import { and, desc, eq, lte, ne } from 'drizzle-orm';
import { Server as SocketIOServer } from 'socket.io';
import { db } from '../db/index.ts';
import { auctions, bids, notifications, watchlists } from '../db/schema.ts';

const notifiedEndingSoonIds = new Set<number>();

export function startAuctionLifecycleWorker(io: SocketIOServer) {
  // Run periodically after server is listening (never at top-level import time)
  const interval = setInterval(async () => {
    try {
      const now = new Date();

      // 1. Auto-start scheduled auctions whose startTime <= now
      const dueToStart = await db
        .select()
        .from(auctions)
        .where(and(eq(auctions.status, 'scheduled'), lte(auctions.startTime, now)));

      for (const item of dueToStart) {
        await db
          .update(auctions)
          .set({ status: 'live', updatedAt: now })
          .where(eq(auctions.id, item.id));
        io.emit('auction:started', { auctionId: item.id, title: item.title });
      }

      // 2. Notify watchlisted users when live auctions are within 2 minutes of closing
      const twoMinsFromNow = new Date(now.getTime() + 120 * 1000);
      const endingSoon = await db
        .select()
        .from(auctions)
        .where(
          and(
            eq(auctions.status, 'live'),
            lte(auctions.effectiveEndTime, twoMinsFromNow)
          )
        );

      for (const item of endingSoon) {
        const remainingMs = new Date(item.effectiveEndTime).getTime() - now.getTime();
        if (remainingMs > 0 && !notifiedEndingSoonIds.has(item.id)) {
          notifiedEndingSoonIds.add(item.id);
          const watchers = await db
            .select({ userId: watchlists.userId })
            .from(watchlists)
            .where(eq(watchlists.auctionId, item.id));

          for (const w of watchers) {
            await db.insert(notifications).values({
              userId: w.userId,
              type: 'ending_soon',
              title: 'Watchlist Lot Closing Within 2 Minutes',
              message: `"${item.title}" is closing soon! Current bid: ₦${item.currentBid.toLocaleString()}.`,
              auctionId: item.id,
            });
            io.emit('notification:user', {
              userId: w.userId,
              type: 'ending_soon',
              title: 'Watchlist Lot Closing Soon',
              message: `"${item.title}" closes in under 2 minutes!`,
              auctionId: item.id,
            });
          }
        }
      }

      // 3. Auto-close expired live auctions
      const expired = await db
        .select()
        .from(auctions)
        .where(and(eq(auctions.status, 'live'), lte(auctions.effectiveEndTime, now)));

      for (const item of expired) {
        const [topBid] = await db
          .select()
          .from(bids)
          .where(eq(bids.auctionId, item.id))
          .orderBy(desc(bids.amount), bids.createdAt)
          .limit(1);

        const [closed] = await db
          .update(auctions)
          .set({
            status: 'ended',
            winnerId: topBid?.userId ?? null,
            winnerUsername: topBid?.username ?? null,
            winningBidAmount: topBid?.amount ?? null,
            updatedAt: now,
          })
          .where(eq(auctions.id, item.id))
          .returning();

        if (topBid) {
          await db.insert(notifications).values({
            userId: topBid.userId,
            type: 'auction_won',
            title: 'Auction Won!',
            message: `Congratulations! You won "${item.title}" at ₦${topBid.amount.toLocaleString()}.`,
            auctionId: item.id,
          });

          // Notify losing bidders
          const allBidders = await db
            .selectDistinct({ userId: bids.userId })
            .from(bids)
            .where(and(eq(bids.auctionId, item.id), ne(bids.userId, topBid.userId)));

          for (const loser of allBidders) {
            await db.insert(notifications).values({
              userId: loser.userId,
              type: 'auction_lost',
              title: 'Auction Ended',
              message: `"${item.title}" closed at ₦${topBid.amount.toLocaleString()}. Better luck next lot!`,
              auctionId: item.id,
            });
          }
        }

        io.emit('auction:closed', {
          auctionId: item.id,
          winnerUsername: closed?.winnerUsername ?? null,
          winningBidAmount: closed?.winningBidAmount ?? null,
        });
      }
    } catch (err) {
      // Quietly log without crashing interval
      console.error('Auction worker tick error:', err);
    }
  }, 5000);

  return () => clearInterval(interval);
}
