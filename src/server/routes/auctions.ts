import { Router } from 'express';
import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { Server as SocketIOServer } from 'socket.io';
import { db } from '../../db/index.ts';
import { ensureSeeded } from '../../db/seed.ts';
import {
  auctionCategories,
  auctionDiscussions,
  auctionImages,
  auctions,
  bids,
  notifications,
  sessions,
  users,
  watchlists,
  websiteSettings,
} from '../../db/schema.ts';
import { AuthRequest, getClientIp, requireAuth } from '../authMiddleware.ts';
import { isValidPhone, sanitizeText } from '../security.ts';

export function createAuctionsRouter(io: SocketIOServer) {
  const router = Router();

  // ================= PUBLIC ROUTES (No login required) =================

  // Public Website Settings (branding, banners, About, Contact, Terms, Privacy)
  router.get('/public/settings', async (_req, res) => {
    try {
      await ensureSeeded();
      const [settings] = await db.select().from(websiteSettings).limit(1);
      res.json({ settings: settings || null });
    } catch (err) {
      console.error('GET /public/settings error:', err);
      res.status(500).json({ error: 'Failed to load platform settings.' });
    }
  });

  // Public Auction Categories
  router.get('/public/categories', async (_req, res) => {
    try {
      await ensureSeeded();
      const cats = await db
        .select()
        .from(auctionCategories)
        .where(eq(auctionCategories.isActive, true))
        .orderBy(auctionCategories.name);
      res.json({ categories: cats });
    } catch (err) {
      console.error('GET /public/categories error:', err);
      res.status(500).json({ error: 'Failed to load categories.' });
    }
  });

  // Public Auctions Listing (Live, Upcoming/Scheduled, Completed/Ended)
  router.get('/public/auctions', async (req: AuthRequest, res) => {
    try {
      await ensureSeeded();
      const statusFilter = typeof req.query.status === 'string' ? req.query.status : 'all';
      const categoryFilter = typeof req.query.category === 'string' ? req.query.category : 'all';
      const searchFilter = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

      const allAuctions = await db
        .select()
        .from(auctions)
        .where(ne(auctions.status, 'draft'))
        .orderBy(desc(auctions.isFeatured), auctions.effectiveEndTime);

      const auctionIds = allAuctions.map((a) => a.id);
      const imageRows =
        auctionIds.length > 0
          ? await db
              .select()
              .from(auctionImages)
              .where(inArray(auctionImages.auctionId, auctionIds))
              .orderBy(auctionImages.sortOrder)
          : [];

      const imagesByAuction = new Map<number, string[]>();
      for (const img of imageRows) {
        const list = imagesByAuction.get(img.auctionId) || [];
        list.push(img.imageUrl);
        imagesByAuction.set(img.auctionId, list);
      }

      // If logged in, return user's watchlisted IDs so cards show bookmark state
      let userWatchlistSet = new Set<number>();
      if (req.auth) {
        const wl = await db
          .select({ auctionId: watchlists.auctionId })
          .from(watchlists)
          .where(eq(watchlists.userId, req.auth.user.id));
        userWatchlistSet = new Set(wl.map((w) => w.auctionId));
      }

      const enriched = allAuctions
        .filter((a) => {
          if (statusFilter !== 'all' && a.status !== statusFilter) return false;
          if (categoryFilter !== 'all' && a.categoryName !== categoryFilter) return false;
          if (searchFilter) {
            const hay = `${a.title} ${a.brand} ${a.categoryName} ${a.location} ${a.code}`.toLowerCase();
            if (!hay.includes(searchFilter)) return false;
          }
          return true;
        })
        .map((a) => ({
          id: a.id,
          code: a.code,
          title: a.title,
          slug: a.slug,
          description: a.description,
          categoryId: a.categoryId,
          categoryName: a.categoryName,
          condition: a.condition,
          brand: a.brand,
          location: a.location,
          sellerName: a.sellerName,
          startingPrice: a.startingPrice,
          currentBid: a.currentBid,
          bidIncrement: a.bidIncrement,
          estimatedMarketValue: a.estimatedMarketValue,
          status: a.status,
          startTime: a.startTime,
          endTime: a.endTime,
          effectiveEndTime: a.effectiveEndTime,
          extensionCount: a.extensionCount,
          maxExtensions: a.maxExtensions,
          winnerUsername: a.winnerUsername,
          winningBidAmount: a.winningBidAmount,
          bidsCount: a.bidsCount,
          isFeatured: a.isFeatured,
          specs: a.specs,
          images: imagesByAuction.get(a.id) || [],
          isWatchlisted: userWatchlistSet.has(a.id),
        }));

      res.json({ auctions: enriched });
    } catch (err) {
      console.error('GET /public/auctions error:', err);
      res.status(500).json({ error: 'Failed to load auctions.' });
    }
  });

  // Public Auction Detail
  router.get('/public/auctions/:id', async (req: AuthRequest, res) => {
    try {
      await ensureSeeded();
      const auctionId = Number(req.params.id);
      if (!Number.isInteger(auctionId) || auctionId <= 0) {
        return res.status(400).json({ error: 'Invalid auction ID.' });
      }

      const [auction] = await db
        .select()
        .from(auctions)
        .where(eq(auctions.id, auctionId))
        .limit(1);

      if (!auction || auction.status === 'draft') {
        return res.status(404).json({ error: 'Auction not found.' });
      }

      const imgs = await db
        .select()
        .from(auctionImages)
        .where(eq(auctionImages.auctionId, auction.id))
        .orderBy(auctionImages.sortOrder);

      const bidRows = await db
        .select({
          id: bids.id,
          username: bids.username,
          amount: bids.amount,
          isProxy: bids.isProxy,
          createdAt: bids.createdAt,
        })
        .from(bids)
        .where(eq(bids.auctionId, auction.id))
        .orderBy(desc(bids.amount), desc(bids.createdAt))
        .limit(30);

      const discussionRows = await db
        .select({
          id: auctionDiscussions.id,
          username: auctionDiscussions.username,
          message: auctionDiscussions.message,
          createdAt: auctionDiscussions.createdAt,
        })
        .from(auctionDiscussions)
        .where(eq(auctionDiscussions.auctionId, auction.id))
        .orderBy(desc(auctionDiscussions.createdAt))
        .limit(40);

      let isWatchlisted = false;
      if (req.auth) {
        const wl = await db
          .select()
          .from(watchlists)
          .where(
            and(
              eq(watchlists.userId, req.auth.user.id),
              eq(watchlists.auctionId, auction.id)
            )
          )
          .limit(1);
        isWatchlisted = wl.length > 0;
      }

      res.json({
        auction: {
          ...auction,
          reservePrice: undefined, // never expose reserve price publicly
          images: imgs.map((i) => i.imageUrl),
          isWatchlisted,
        },
        bids: bidRows,
        discussions: discussionRows.reverse(),
      });
    } catch (err) {
      console.error('GET /public/auctions/:id error:', err);
      res.status(500).json({ error: 'Failed to load auction details.' });
    }
  });

  // ================= PROTECTED BIDDING & WATCHLIST & DISCUSSIONS =================

  // Place Bid (Mandatory Auth, Atomic DB Transaction, Anti-Sniping, Real-time Socket Broadcast)
  router.post('/auctions/:id/bid', requireAuth, async (req: AuthRequest, res) => {
    try {
      const auctionId = Number(req.params.id);
      const amount = Number(req.body.amount);
      if (!Number.isInteger(auctionId) || auctionId <= 0) {
        return res.status(400).json({ error: 'Invalid auction ID.' });
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid bid amount.' });
      }

      const user = req.auth!.user;
      const ip = getClientIp(req);

      const [settings] = await db.select().from(websiteSettings).limit(1);
      const antiSnipingSec = settings?.antiSnipingSeconds || 60;

      const result = await db.transaction(async (tx) => {
        const [lockedAuction] = await tx
          .select()
          .from(auctions)
          .where(eq(auctions.id, auctionId))
          .for('update');

        if (!lockedAuction) {
          throw { status: 404, message: 'Auction not found.' };
        }
        if (lockedAuction.status !== 'live') {
          throw { status: 400, message: `Bidding is closed (status: ${lockedAuction.status}).` };
        }

        const now = new Date();
        if (new Date(lockedAuction.effectiveEndTime).getTime() <= now.getTime()) {
          throw { status: 400, message: 'This auction has already ended.' };
        }

        const minRequired =
          lockedAuction.bidsCount === 0
            ? lockedAuction.startingPrice
            : lockedAuction.currentBid + lockedAuction.bidIncrement;

        if (amount < minRequired) {
          throw {
            status: 400,
            message: `Minimum bid required is ₦${minRequired.toLocaleString()}.`,
          };
        }

        if (lockedAuction.winnerId === user.id) {
          throw { status: 400, message: 'You are already the highest bidder on this lot.' };
        }

        const previousWinnerId = lockedAuction.winnerId;

        // Anti-sniping: extend closing time if bid arrives within final 30 seconds
        const msRemaining =
          new Date(lockedAuction.effectiveEndTime).getTime() - now.getTime();
        let newEffectiveEndTime = lockedAuction.effectiveEndTime;
        let newExtensionCount = lockedAuction.extensionCount;
        let extended = false;

        if (msRemaining <= 30000 && lockedAuction.extensionCount < lockedAuction.maxExtensions) {
          newEffectiveEndTime = new Date(
            new Date(lockedAuction.effectiveEndTime).getTime() + antiSnipingSec * 1000
          );
          newExtensionCount += 1;
          extended = true;
        }

        const [insertedBid] = await tx
          .insert(bids)
          .values({
            auctionId,
            userId: user.id,
            username: user.username,
            amount: Math.round(amount),
            isProxy: false,
            ipAddress: ip,
          })
          .returning();

        const [updatedAuction] = await tx
          .update(auctions)
          .set({
            currentBid: Math.round(amount),
            bidsCount: lockedAuction.bidsCount + 1,
            winnerId: user.id,
            winnerUsername: user.username,
            winningBidAmount: Math.round(amount),
            effectiveEndTime: newEffectiveEndTime,
            extensionCount: newExtensionCount,
            updatedAt: now,
          })
          .where(eq(auctions.id, auctionId))
          .returning();

        // Notify current bidder
        await tx.insert(notifications).values({
          userId: user.id,
          type: 'bid_placed',
          title: 'Bid Accepted',
          message: `You placed a leading bid of ₦${Math.round(amount).toLocaleString()} on "${lockedAuction.title}".`,
          auctionId,
        });

        // Notify outbid previous leader
        if (previousWinnerId && previousWinnerId !== user.id) {
          await tx.insert(notifications).values({
            userId: previousWinnerId,
            type: 'outbid',
            title: 'You Have Been Outbid',
            message: `Someone placed ₦${Math.round(amount).toLocaleString()} on "${lockedAuction.title}". Bid again to stay in the lead!`,
            auctionId,
          });
        }

        return {
          bid: insertedBid,
          auction: updatedAuction,
          extended,
          previousWinnerId,
        };
      });

      io.emit('auction:bid_placed', {
        auctionId,
        currentBid: result.auction.currentBid,
        bidsCount: result.auction.bidsCount,
        winnerUsername: result.auction.winnerUsername,
        effectiveEndTime: result.auction.effectiveEndTime,
        extensionCount: result.auction.extensionCount,
        extended: result.extended,
        bid: {
          id: result.bid.id,
          username: result.bid.username,
          amount: result.bid.amount,
          createdAt: result.bid.createdAt,
        },
      });

      if (result.previousWinnerId) {
        io.emit('notification:user', {
          userId: result.previousWinnerId,
          type: 'outbid',
          title: 'Outbid Alert',
          message: `You were outbid on ${result.auction.title} (₦${result.auction.currentBid.toLocaleString()}).`,
          auctionId,
        });
      }

      res.status(201).json({
        success: true,
        message: result.extended
          ? `Bid of ₦${amount.toLocaleString()} accepted! Anti-sniping extended timer by ${antiSnipingSec}s.`
          : `Bid of ₦${amount.toLocaleString()} accepted! You are currently leading.`,
        auction: result.auction,
        bid: result.bid,
      });
    } catch (err: any) {
      if (err?.status && err?.message) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error('POST /auctions/:id/bid error:', err);
      res.status(500).json({ error: 'Unable to place bid right now.' });
    }
  });

  // Toggle Watchlist
  router.post('/auctions/:id/watchlist', requireAuth, async (req: AuthRequest, res) => {
    try {
      const auctionId = Number(req.params.id);
      if (!Number.isInteger(auctionId) || auctionId <= 0) {
        return res.status(400).json({ error: 'Invalid auction ID.' });
      }

      const userId = req.auth!.user.id;
      const existing = await db
        .select()
        .from(watchlists)
        .where(and(eq(watchlists.userId, userId), eq(watchlists.auctionId, auctionId)))
        .limit(1);

      if (existing.length > 0) {
        await db.delete(watchlists).where(eq(watchlists.id, existing[0].id));
        return res.json({ watchlisted: false, message: 'Removed from watchlist.' });
      }

      await db.insert(watchlists).values({ userId, auctionId });
      res.json({ watchlisted: true, message: 'Added to watchlist with 2-minute closing alerts.' });
    } catch (err) {
      console.error('POST /auctions/:id/watchlist error:', err);
      res.status(500).json({ error: 'Failed to update watchlist.' });
    }
  });

  // Post Live Discussion message (Requires Auth)
  router.post('/auctions/:id/discussions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const auctionId = Number(req.params.id);
      const message = sanitizeText(req.body.message, 400);
      if (!Number.isInteger(auctionId) || auctionId <= 0) {
        return res.status(400).json({ error: 'Invalid auction ID.' });
      }
      if (!message) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      const [inserted] = await db
        .insert(auctionDiscussions)
        .values({
          auctionId,
          userId: req.auth!.user.id,
          username: req.auth!.user.username,
          message,
        })
        .returning();

      io.emit('auction:discussion', {
        auctionId,
        discussion: {
          id: inserted.id,
          username: inserted.username,
          message: inserted.message,
          createdAt: inserted.createdAt,
        },
      });

      res.status(201).json({ discussion: inserted });
    } catch (err) {
      console.error('POST /auctions/:id/discussions error:', err);
      res.status(500).json({ error: 'Failed to send message.' });
    }
  });

  // ================= PROTECTED USER DASHBOARD ROUTES =================

  router.get('/user/dashboard', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.auth!.user.id;

      // All bids placed by this user
      const userBids = await db
        .select({
          bidId: bids.id,
          auctionId: bids.auctionId,
          amount: bids.amount,
          createdAt: bids.createdAt,
          auctionTitle: auctions.title,
          auctionCode: auctions.code,
          auctionStatus: auctions.status,
          currentBid: auctions.currentBid,
          winnerId: auctions.winnerId,
          effectiveEndTime: auctions.effectiveEndTime,
        })
        .from(bids)
        .innerJoin(auctions, eq(bids.auctionId, auctions.id))
        .where(eq(bids.userId, userId))
        .orderBy(desc(bids.createdAt));

      // Group highest user bid per auction
      const userMaxByAuction = new Map<number, typeof userBids[number]>();
      for (const b of userBids) {
        const existing = userMaxByAuction.get(b.auctionId);
        if (!existing || b.amount > existing.amount) {
          userMaxByAuction.set(b.auctionId, b);
        }
      }

      const activeBids = Array.from(userMaxByAuction.values()).filter(
        (b) => b.auctionStatus === 'live'
      );
      const winningBids = Array.from(userMaxByAuction.values()).filter(
        (b) => b.auctionStatus === 'ended' && b.winnerId === userId
      );
      const lostAuctions = Array.from(userMaxByAuction.values()).filter(
        (b) => b.auctionStatus === 'ended' && b.winnerId !== userId
      );

      // Watchlist items
      const watchlistRows = await db
        .select({
          watchlistId: watchlists.id,
          auctionId: auctions.id,
          code: auctions.code,
          title: auctions.title,
          categoryName: auctions.categoryName,
          currentBid: auctions.currentBid,
          startingPrice: auctions.startingPrice,
          status: auctions.status,
          effectiveEndTime: auctions.effectiveEndTime,
          bidsCount: auctions.bidsCount,
        })
        .from(watchlists)
        .innerJoin(auctions, eq(watchlists.auctionId, auctions.id))
        .where(eq(watchlists.userId, userId))
        .orderBy(auctions.effectiveEndTime);

      // Attach primary image to watchlist items
      const wlAuctionIds = watchlistRows.map((w) => w.auctionId);
      const wlImages =
        wlAuctionIds.length > 0
          ? await db
              .select()
              .from(auctionImages)
              .where(inArray(auctionImages.auctionId, wlAuctionIds))
              .orderBy(auctionImages.sortOrder)
          : [];
      const firstImageByAuction = new Map<number, string>();
      for (const img of wlImages) {
        if (!firstImageByAuction.has(img.auctionId)) {
          firstImageByAuction.set(img.auctionId, img.imageUrl);
        }
      }

      // User Notifications
      const notifRows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(50);

      // Active sessions count
      const activeSessions = await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            sql`${sessions.revokedAt} IS NULL`,
            sql`${sessions.expiresAt} > NOW()`
          )
        );

      res.json({
        stats: {
          activeBidsCount: activeBids.length,
          wonCount: winningBids.length,
          lostCount: lostAuctions.length,
          totalBidsPlaced: userBids.length,
          watchlistCount: watchlistRows.length,
          activeSessionsCount: activeSessions.length,
        },
        activeBids,
        winningBids,
        lostAuctions,
        watchlist: watchlistRows.map((w) => ({
          ...w,
          imageUrl: firstImageByAuction.get(w.auctionId) || '',
        })),
        bidHistory: userBids,
        notifications: notifRows,
      });
    } catch (err) {
      console.error('GET /user/dashboard error:', err);
      res.status(500).json({ error: 'Failed to load dashboard data.' });
    }
  });

  // Update User Profile
  router.patch('/user/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const fullName = sanitizeText(req.body.fullName, 80);
      const phone = sanitizeText(req.body.phone, 24);
      const avatarUrl = sanitizeText(req.body.avatarUrl, 400);

      if (fullName.length < 2) {
        return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      }
      if (phone && !isValidPhone(phone)) {
        return res.status(400).json({ error: 'Please enter a valid phone number.' });
      }

      const [updated] = await db
        .update(users)
        .set({
          fullName,
          phone,
          avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.auth!.user.id))
        .returning({
          id: users.id,
          uid: users.uid,
          fullName: users.fullName,
          username: users.username,
          email: users.email,
          phone: users.phone,
          avatarUrl: users.avatarUrl,
          status: users.status,
          emailVerified: users.emailVerified,
          mustChangePassword: users.mustChangePassword,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
        });

      res.json({ user: updated, message: 'Profile updated successfully.' });
    } catch (err) {
      console.error('PATCH /user/profile error:', err);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  });

  // Mark notification(s) as read
  router.patch('/user/notifications/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const notifId = req.body.id ? Number(req.body.id) : null;
      if (notifId) {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(
            and(
              eq(notifications.id, notifId),
              eq(notifications.userId, req.auth!.user.id)
            )
          );
      } else {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(eq(notifications.userId, req.auth!.user.id));
      }
      res.json({ success: true });
    } catch (err) {
      console.error('PATCH /user/notifications/read error:', err);
      res.status(500).json({ error: 'Failed to update notifications.' });
    }
  });

  return router;
}
