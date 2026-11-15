import { and, desc, eq, lte, ne } from 'drizzle-orm';
import type { Server as SocketIOServer } from 'socket.io';
import { db } from '../db/index.ts';
import { auctions, bids, notifications, users, watchlists } from '../db/schema.ts';

const notifiedEndingSoonIds = new Set<number>();
let lastReconcileAt = 0;
let reconcileInFlight: Promise<void> | null = null;

export async function notifyAuctionWinnerAndAdmins(
  io: SocketIOServer,
  auction: {
    id: number;
    code: string;
    title: string;
    sellerId: number | null;
  },
  topBid: {
    userId: number;
    username: string;
    amount: number;
  } | null
) {
  const activeAdmins = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(and(eq(users.isAdmin, true), eq(users.status, 'active')));

  if (topBid) {
    const [winnerUser] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, topBid.userId))
      .limit(1);

    const amountFormatted = `₦${Number(topBid.amount).toLocaleString()}`;

    // 1. Notify the winning bidder (DB + real-time Socket.IO)
    const winnerTitle = 'Congratulations! You Won the Auction!';
    const winnerMsg = `You won "${auction.title}" (${auction.code}) with the winning bid of ${amountFormatted}. An administrator will coordinate escrow settlement with you shortly.`;

    await db.insert(notifications).values({
      userId: topBid.userId,
      type: 'auction_won',
      title: winnerTitle,
      message: winnerMsg,
      auctionId: auction.id,
    });

    io.emit('notification:user', {
      userId: topBid.userId,
      type: 'auction_won',
      title: winnerTitle,
      message: winnerMsg,
      auctionId: auction.id,
    });

    // 2. Notify ALL active administrators with full winner contact details (DB + real-time Socket.IO)
    const contactSummary = [
      winnerUser?.fullName || topBid.username,
      winnerUser?.email || null,
      winnerUser?.phone || null,
    ]
      .filter(Boolean)
      .join(' · ');

    const adminTitle = `Winner Confirmed: ${auction.code}`;
    const adminMsg = `"${auction.title}" closed at ${amountFormatted}. Winner: @${topBid.username} (${contactSummary}).`;

    for (const adm of activeAdmins) {
      await db.insert(notifications).values({
        userId: adm.id,
        type: 'admin_auction_won',
        title: adminTitle,
        message: adminMsg,
        auctionId: auction.id,
      });

      io.emit('notification:user', {
        userId: adm.id,
        type: 'admin_auction_won',
        title: adminTitle,
        message: adminMsg,
        auctionId: auction.id,
      });
    }

    io.emit('notification:admin', {
      type: 'admin_auction_won',
      title: adminTitle,
      message: adminMsg,
      auctionId: auction.id,
      winnerUsername: topBid.username,
      winningBidAmount: topBid.amount,
    });

    // 3. Notify seller (if user-submitted lot and seller isn't the winner or an already-notified admin)
    const notifiedIds = new Set<number>([topBid.userId, ...activeAdmins.map((a) => a.id)]);
    if (auction.sellerId && !notifiedIds.has(auction.sellerId)) {
      const sellerTitle = 'Your Listed Product Sold!';
      const sellerMsg = `Your auction lot "${auction.title}" (${auction.code}) closed at ${amountFormatted}, won by @${topBid.username}.`;
      await db.insert(notifications).values({
        userId: auction.sellerId,
        type: 'seller_item_sold',
        title: sellerTitle,
        message: sellerMsg,
        auctionId: auction.id,
      });
      io.emit('notification:user', {
        userId: auction.sellerId,
        type: 'seller_item_sold',
        title: sellerTitle,
        message: sellerMsg,
        auctionId: auction.id,
      });
    }

    // 4. Notify outbid / losing participants
    const allBidders = await db
      .selectDistinct({ userId: bids.userId })
      .from(bids)
      .where(and(eq(bids.auctionId, auction.id), ne(bids.userId, topBid.userId)));

    for (const loser of allBidders) {
      const loserMsg = `"${auction.title}" closed at ${amountFormatted}. Better luck next lot!`;
      await db.insert(notifications).values({
        userId: loser.userId,
        type: 'auction_lost',
        title: 'Auction Ended',
        message: loserMsg,
        auctionId: auction.id,
      });
      io.emit('notification:user', {
        userId: loser.userId,
        type: 'auction_lost',
        title: 'Auction Ended',
        message: loserMsg,
        auctionId: auction.id,
      });
    }
  } else {
    // Closed with no bids — still inform admins
    const adminTitle = `Auction Closed (No Bids): ${auction.code}`;
    const adminMsg = `"${auction.title}" closed with 0 bids placed.`;
    for (const adm of activeAdmins) {
      await db.insert(notifications).values({
        userId: adm.id,
        type: 'admin_auction_closed_no_bids',
        title: adminTitle,
        message: adminMsg,
        auctionId: auction.id,
      });
      io.emit('notification:user', {
        userId: adm.id,
        type: 'admin_auction_closed_no_bids',
        title: adminTitle,
        message: adminMsg,
        auctionId: auction.id,
      });
    }
  }
}

export async function reconcileAuctionLifecycles(io: SocketIOServer, force = false) {
  const nowMs = Date.now();
  if (!force && nowMs - lastReconcileAt < 10000) {
    return;
  }
  if (reconcileInFlight) {
    return reconcileInFlight;
  }

  reconcileInFlight = (async () => {
    try {
      lastReconcileAt = Date.now();
      const now = new Date();

      // 1. Auto-start approved scheduled auctions whose startTime <= now
      const dueToStart = await db
        .select()
        .from(auctions)
        .where(
          and(
            eq(auctions.status, 'scheduled'),
            eq(auctions.approvalStatus, 'approved'),
            lte(auctions.startTime, now)
          )
        );

      for (const item of dueToStart) {
        await db
          .update(auctions)
          .set({ status: 'live', updatedAt: now })
          .where(eq(auctions.id, item.id));
        io.emit('auction:started', { auctionId: item.id, title: item.title });
        io.emit('slots:updated', { auctionId: item.id, status: 'live' });
      }

      // 2. Notify watchlisted users when live auctions are within 2 minutes of closing
      const twoMinsFromNow = new Date(now.getTime() + 120 * 1000);
      const endingSoon = await db
        .select()
        .from(auctions)
        .where(
          and(
            eq(auctions.status, 'live'),
            eq(auctions.approvalStatus, 'approved'),
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
            winnerStatus: topBid ? 'notified' : 'pending',
            updatedAt: now,
          })
          .where(eq(auctions.id, item.id))
          .returning();

        await notifyAuctionWinnerAndAdmins(
          io,
          {
            id: item.id,
            code: item.code,
            title: item.title,
            sellerId: item.sellerId,
          },
          topBid
            ? {
                userId: topBid.userId,
                username: topBid.username,
                amount: topBid.amount,
              }
            : null
        );

        io.emit('auction:closed', {
          auctionId: item.id,
          winnerUsername: closed?.winnerUsername ?? null,
          winningBidAmount: closed?.winningBidAmount ?? null,
        });
        io.emit('slots:updated', { auctionId: item.id, status: 'ended' });
      }
    } catch (err: any) {
      console.warn('Auction lifecycle reconcile notice:', err?.message || 'Unknown error');
    } finally {
      reconcileInFlight = null;
    }
  })();

  return reconcileInFlight;
}

export function startAuctionLifecycleWorker(io: SocketIOServer) {
  // Only reconcile when active browser clients are connected (avoids keeping Cloud SQL awake when idle)
  const interval = setInterval(() => {
    if (io.engine.clientsCount > 0) {
      void reconcileAuctionLifecycles(io);
    }
  }, 30000);

  return () => clearInterval(interval);
}
