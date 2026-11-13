import { Router } from 'express';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { Server as SocketIOServer } from 'socket.io';
import { db } from '../../db/index.ts';
import {
  adminActivityLogs,
  auctionCategories,
  auctionImages,
  auctions,
  bids,
  notifications,
  permissions,
  roles,
  sessions,
  userPermissions,
  userRoles,
  users,
  websiteSettings,
} from '../../db/schema.ts';
import {
  AuthRequest,
  loadUserRolesAndPermissions,
  logAdminAction,
  requireAdmin,
  requireAuth,
  requirePermission,
} from '../authMiddleware.ts';
import {
  hashPassword,
  isValidEmail,
  isValidPhone,
  isValidUsername,
  sanitizeRichText,
  sanitizeText,
  validatePasswordStrength,
} from '../security.ts';

export function createAdminRouter(io: SocketIOServer) {
  const router = Router();

  // Every route in /api/admin requires authenticated active Admin (with mustChangePassword === false)
  router.use(requireAuth, requireAdmin);

  // ================= ADMIN OVERVIEW & ANALYTICS =================
  router.get('/overview', async (_req, res) => {
    try {
      const [usersCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users);
      const [adminsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.isAdmin, true));
      const [activeAuctionsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(auctions)
        .where(eq(auctions.status, 'live'));
      const [upcomingAuctionsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(auctions)
        .where(eq(auctions.status, 'scheduled'));
      const [completedAuctionsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(auctions)
        .where(eq(auctions.status, 'ended'));
      const [bidsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bids);

      const recentRegistrations = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          email: users.email,
          status: users.status,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(8);

      const recentBids = await db
        .select({
          id: bids.id,
          username: bids.username,
          amount: bids.amount,
          createdAt: bids.createdAt,
          auctionTitle: auctions.title,
          auctionCode: auctions.code,
        })
        .from(bids)
        .innerJoin(auctions, eq(bids.auctionId, auctions.id))
        .orderBy(desc(bids.createdAt))
        .limit(10);

      const categoryStats = await db
        .select({
          category: auctions.categoryName,
          count: sql<number>`count(*)::int`,
          totalBidVolume: sql<number>`coalesce(sum(${auctions.currentBid}), 0)::bigint`,
        })
        .from(auctions)
        .groupBy(auctions.categoryName);

      res.json({
        kpis: {
          totalUsers: usersCount?.count || 0,
          totalAdmins: adminsCount?.count || 0,
          activeAuctions: activeAuctionsCount?.count || 0,
          upcomingAuctions: upcomingAuctionsCount?.count || 0,
          completedAuctions: completedAuctionsCount?.count || 0,
          totalBids: bidsCount?.count || 0,
        },
        recentRegistrations,
        recentBids,
        categoryStats: categoryStats.map((c) => ({
          category: c.category,
          count: c.count,
          totalBidVolume: Number(c.totalBidVolume),
        })),
      });
    } catch (err) {
      console.error('GET /admin/overview error:', err);
      res.status(500).json({ error: 'Failed to load admin overview.' });
    }
  });

  // ================= A. USER MANAGEMENT =================
  router.get('/users', requirePermission('manage_users'), async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      const allUsers = await db
        .select({
          id: users.id,
          uid: users.uid,
          fullName: users.fullName,
          username: users.username,
          email: users.email,
          phone: users.phone,
          status: users.status,
          emailVerified: users.emailVerified,
          isAdmin: users.isAdmin,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));

      const roleRows = await db
        .select({
          userId: userRoles.userId,
          roleName: roles.name,
          displayName: roles.displayName,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id));

      const rolesByUser = new Map<number, string[]>();
      for (const rr of roleRows) {
        const list = rolesByUser.get(rr.userId) || [];
        list.push(rr.roleName);
        rolesByUser.set(rr.userId, list);
      }

      const filtered = allUsers
        .filter((u) => {
          if (!q) return true;
          return (
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.phone.toLowerCase().includes(q) ||
            u.fullName.toLowerCase().includes(q)
          );
        })
        .map((u) => ({
          ...u,
          roles: rolesByUser.get(u.id) || ['buyer'],
        }));

      res.json({ users: filtered });
    } catch (err) {
      console.error('GET /admin/users error:', err);
      res.status(500).json({ error: 'Failed to load users.' });
    }
  });

  // Register new ordinary user (Buyer or Seller) manually from Admin Panel
  router.post('/users', requirePermission('manage_users'), async (req: AuthRequest, res) => {
    try {
      const fullName = sanitizeText(req.body.fullName, 80);
      const username = sanitizeText(req.body.username, 24);
      const email = sanitizeText(req.body.email, 120).toLowerCase();
      const phone = sanitizeText(req.body.phone, 24);
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      const roleName = req.body.roleName === 'seller' ? 'seller' : 'buyer';

      if (fullName.length < 2) {
        return res.status(400).json({ error: 'Full name is required.' });
      }
      if (!isValidUsername(username)) {
        return res.status(400).json({ error: 'Invalid username format (3-24 alphanumeric/underscore).' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Valid email is required.' });
      }
      if (phone && !isValidPhone(phone)) {
        return res.status(400).json({ error: 'Valid phone number is required.' });
      }
      const pwdErr = validatePasswordStrength(password);
      if (pwdErr) {
        return res.status(400).json({ error: pwdErr });
      }

      const dup = await db
        .select({ id: users.id })
        .from(users)
        .where(
          or(
            sql`lower(${users.username}) = lower(${username})`,
            sql`lower(${users.email}) = lower(${email})`
          )
        )
        .limit(1);
      if (dup.length > 0) {
        return res.status(409).json({ error: 'Username or email already exists.' });
      }

      const passwordHash = await hashPassword(password);
      const [created] = await db
        .insert(users)
        .values({
          uid: `usr_${crypto.randomUUID()}`,
          fullName,
          username,
          email,
          phone,
          passwordHash,
          status: 'active',
          emailVerified: true,
          mustChangePassword: false,
          isAdmin: false,
        })
        .returning();

      const [roleRow] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
      if (roleRow) {
        await db.insert(userRoles).values({
          userId: created.id,
          roleId: roleRow.id,
          assignedBy: req.auth!.user.id,
        });
      }

      await logAdminAction(
        req,
        'USER_CREATED_BY_ADMIN',
        'User',
        created.id,
        `Created ${roleName} account @${created.username} (${created.email})`
      );

      const { passwordHash: _ph, ...safeUser } = created;
      res.status(201).json({ user: safeUser, message: `User @${created.username} created.` });
    } catch (err) {
      console.error('POST /admin/users error:', err);
      res.status(500).json({ error: 'Failed to create user.' });
    }
  });

  // Edit / Activate / Deactivate / Suspend / Ban user
  router.patch('/users/:id', requirePermission('manage_users'), async (req: AuthRequest, res) => {
    try {
      const targetId = Number(req.params.id);
      if (!Number.isInteger(targetId) || targetId <= 0) {
        return res.status(400).json({ error: 'Invalid user ID.' });
      }

      const [existing] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
      if (!existing) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (existing.isAdmin && !req.auth!.roles.includes('super_admin')) {
        return res.status(403).json({ error: 'Only Super Admin can modify administrator accounts.' });
      }

      const fullName = req.body.fullName !== undefined ? sanitizeText(req.body.fullName, 80) : existing.fullName;
      const phone = req.body.phone !== undefined ? sanitizeText(req.body.phone, 24) : existing.phone;
      const email = req.body.email !== undefined ? sanitizeText(req.body.email, 120).toLowerCase() : existing.email;
      const status =
        typeof req.body.status === 'string' &&
        ['active', 'inactive', 'suspended', 'banned'].includes(req.body.status)
          ? req.body.status
          : existing.status;

      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address.' });
      }

      const [updated] = await db
        .update(users)
        .set({
          fullName,
          phone,
          email,
          status,
          emailVerified:
            req.body.emailVerified !== undefined ? Boolean(req.body.emailVerified) : existing.emailVerified,
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetId))
        .returning();

      // If suspended/banned/deactivated, revoke active sessions immediately
      if (status !== 'active') {
        await db
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(eq(sessions.userId, targetId));
      }

      if (status !== existing.status) {
        await db.insert(notifications).values({
          userId: targetId,
          type: status === 'active' ? 'account_reactivated' : 'account_suspended',
          title: status === 'active' ? 'Account Reactivated' : `Account ${status}`,
          message:
            status === 'active'
              ? 'Your account has been reactivated by an administrator.'
              : `Your account status was changed to "${status}" by an administrator.`,
        });
      }

      await logAdminAction(
        req,
        'USER_UPDATED',
        'User',
        targetId,
        `Updated @${updated.username} (status: ${existing.status} -> ${status})`
      );

      const { passwordHash: _ph, ...safeUser } = updated;
      res.json({ user: safeUser, message: `Updated @${updated.username}.` });
    } catch (err) {
      console.error('PATCH /admin/users/:id error:', err);
      res.status(500).json({ error: 'Failed to update user.' });
    }
  });

  // Admin reset user password
  router.post(
    '/users/:id/reset-password',
    requirePermission('manage_users'),
    async (req: AuthRequest, res) => {
      try {
        const targetId = Number(req.params.id);
        const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
        const pwdErr = validatePasswordStrength(newPassword);
        if (pwdErr) return res.status(400).json({ error: pwdErr });

        const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
        if (!target) return res.status(404).json({ error: 'User not found.' });
        if (target.isAdmin && !req.auth!.roles.includes('super_admin')) {
          return res.status(403).json({ error: 'Only Super Admin can reset administrator passwords.' });
        }

        const passwordHash = await hashPassword(newPassword);
        await db
          .update(users)
          .set({ passwordHash, mustChangePassword: true, updatedAt: new Date() })
          .where(eq(users.id, targetId));
        await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, targetId));

        await db.insert(notifications).values({
          userId: targetId,
          type: 'security',
          title: 'Password Reset by Administrator',
          message: 'An administrator reset your password. Please log in with your temporary password.',
        });

        await logAdminAction(
          req,
          'USER_PASSWORD_RESET',
          'User',
          targetId,
          `Reset password for @${target.username}`
        );

        res.json({ success: true, message: `Password reset for @${target.username}.` });
      } catch (err) {
        console.error('POST /admin/users/:id/reset-password error:', err);
        res.status(500).json({ error: 'Failed to reset user password.' });
      }
    }
  );

  // View user auction history
  router.get('/users/:id/history', requirePermission('manage_users'), async (req, res) => {
    try {
      const targetId = Number(req.params.id);
      const userBids = await db
        .select({
          id: bids.id,
          amount: bids.amount,
          createdAt: bids.createdAt,
          auctionId: auctions.id,
          auctionCode: auctions.code,
          auctionTitle: auctions.title,
          auctionStatus: auctions.status,
          winnerId: auctions.winnerId,
        })
        .from(bids)
        .innerJoin(auctions, eq(bids.auctionId, auctions.id))
        .where(eq(bids.userId, targetId))
        .orderBy(desc(bids.createdAt));

      res.json({ history: userBids });
    } catch (err) {
      console.error('GET /admin/users/:id/history error:', err);
      res.status(500).json({ error: 'Failed to load user auction history.' });
    }
  });

  // Delete user
  router.delete('/users/:id', requirePermission('manage_users'), async (req: AuthRequest, res) => {
    try {
      const targetId = Number(req.params.id);
      if (targetId === req.auth!.user.id) {
        return res.status(400).json({ error: 'You cannot delete your own account.' });
      }
      const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
      if (!target) return res.status(404).json({ error: 'User not found.' });
      if (target.isAdmin && !req.auth!.roles.includes('super_admin')) {
        return res.status(403).json({ error: 'Only Super Admin can delete administrator accounts.' });
      }
      if (target.username.toLowerCase() === 'damwad') {
        return res.status(403).json({ error: 'The primary Super Admin account (damwad) cannot be deleted.' });
      }

      await db.delete(users).where(eq(users.id, targetId));
      await logAdminAction(
        req,
        'USER_DELETED',
        'User',
        targetId,
        `Deleted user account @${target.username} (${target.email})`
      );
      res.json({ success: true, message: `User @${target.username} deleted.` });
    } catch (err) {
      console.error('DELETE /admin/users/:id error:', err);
      res.status(500).json({ error: 'Failed to delete user.' });
    }
  });

  // ================= B. ADMIN ACCOUNT MANAGEMENT (RBAC) =================
  router.get('/admins', requirePermission('manage_admins'), async (_req, res) => {
    try {
      const adminUsers = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          email: users.email,
          phone: users.phone,
          status: users.status,
          mustChangePassword: users.mustChangePassword,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.isAdmin, true))
        .orderBy(users.id);

      const enriched = await Promise.all(
        adminUsers.map(async (adm) => {
          const rbac = await loadUserRolesAndPermissions(adm.id);
          return {
            ...adm,
            roles: rbac.roles,
            permissions: rbac.permissions,
          };
        })
      );

      const allPerms = await db.select().from(permissions);
      res.json({ admins: enriched, availablePermissions: allPerms });
    } catch (err) {
      console.error('GET /admin/admins error:', err);
      res.status(500).json({ error: 'Failed to load administrator accounts.' });
    }
  });

  // Create new administrator
  router.post('/admins', requirePermission('manage_admins'), async (req: AuthRequest, res) => {
    try {
      const fullName = sanitizeText(req.body.fullName, 80);
      const username = sanitizeText(req.body.username, 24);
      const email = sanitizeText(req.body.email, 120).toLowerCase();
      const phone = sanitizeText(req.body.phone, 24);
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      const confirmPassword =
        typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';
      const roleName =
        typeof req.body.roleName === 'string' &&
        ['super_admin', 'auction_manager', 'user_manager'].includes(req.body.roleName)
          ? req.body.roleName
          : 'auction_manager';
      const customPerms: string[] = Array.isArray(req.body.permissions)
        ? req.body.permissions
        : [];

      if (fullName.length < 2) return res.status(400).json({ error: 'Full name is required.' });
      if (!isValidUsername(username)) {
        return res.status(400).json({ error: 'Username must be 3–24 alphanumeric/underscore characters.' });
      }
      if (!isValidEmail(email)) return res.status(400).json({ error: 'Valid email is required.' });
      if (!isValidPhone(phone)) return res.status(400).json({ error: 'Valid phone number is required.' });
      const pwdErr = validatePasswordStrength(password);
      if (pwdErr) return res.status(400).json({ error: pwdErr });
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
      }

      const dup = await db
        .select({ id: users.id })
        .from(users)
        .where(
          or(
            sql`lower(${users.username}) = lower(${username})`,
            sql`lower(${users.email}) = lower(${email})`
          )
        )
        .limit(1);
      if (dup.length > 0) {
        return res.status(409).json({ error: 'Username or email already exists.' });
      }

      const passwordHash = await hashPassword(password);
      const [created] = await db
        .insert(users)
        .values({
          uid: `admin_${crypto.randomUUID()}`,
          fullName,
          username,
          email,
          phone,
          passwordHash,
          status: 'active',
          emailVerified: true,
          mustChangePassword: true,
          isAdmin: true,
        })
        .returning();

      const [roleRow] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
      if (roleRow) {
        await db.insert(userRoles).values({
          userId: created.id,
          roleId: roleRow.id,
          assignedBy: req.auth!.user.id,
        });
      }

      if (customPerms.length > 0) {
        const permRows = await db
          .select()
          .from(permissions)
          .where(inArray(permissions.code, customPerms));
        for (const p of permRows) {
          await db
            .insert(userPermissions)
            .values({ userId: created.id, permissionId: p.id })
            .onConflictDoNothing();
        }
      }

      await logAdminAction(
        req,
        'ADMIN_CREATED',
        'Admin',
        created.id,
        `Created administrator @${created.username} with role ${roleName}`
      );

      res.status(201).json({
        success: true,
        message: `Administrator @${created.username} (${roleName}) created.`,
      });
    } catch (err) {
      console.error('POST /admin/admins error:', err);
      res.status(500).json({ error: 'Failed to create administrator.' });
    }
  });

  // Update administrator details, role, status, and permissions
  router.patch('/admins/:id', requirePermission('manage_admins'), async (req: AuthRequest, res) => {
    try {
      const targetId = Number(req.params.id);
      const [existing] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
      if (!existing || !existing.isAdmin) {
        return res.status(404).json({ error: 'Administrator not found.' });
      }

      if (
        existing.username.toLowerCase() === 'damwad' &&
        req.body.status &&
        req.body.status !== 'active'
      ) {
        return res.status(400).json({ error: 'Primary Super Admin (damwad) cannot be deactivated.' });
      }

      const fullName = req.body.fullName !== undefined ? sanitizeText(req.body.fullName, 80) : existing.fullName;
      const phone = req.body.phone !== undefined ? sanitizeText(req.body.phone, 24) : existing.phone;
      const email = req.body.email !== undefined ? sanitizeText(req.body.email, 120).toLowerCase() : existing.email;
      const status =
        typeof req.body.status === 'string' && ['active', 'inactive', 'suspended'].includes(req.body.status)
          ? req.body.status
          : existing.status;

      await db
        .update(users)
        .set({ fullName, phone, email, status, updatedAt: new Date() })
        .where(eq(users.id, targetId));

      if (status !== 'active') {
        await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, targetId));
      }

      if (
        typeof req.body.roleName === 'string' &&
        ['super_admin', 'auction_manager', 'user_manager'].includes(req.body.roleName) &&
        existing.username.toLowerCase() !== 'damwad'
      ) {
        const [roleRow] = await db
          .select()
          .from(roles)
          .where(eq(roles.name, req.body.roleName))
          .limit(1);
        if (roleRow) {
          await db.delete(userRoles).where(eq(userRoles.userId, targetId));
          await db.insert(userRoles).values({
            userId: targetId,
            roleId: roleRow.id,
            assignedBy: req.auth!.user.id,
          });
        }
      }

      if (Array.isArray(req.body.permissions)) {
        await db.delete(userPermissions).where(eq(userPermissions.userId, targetId));
        if (req.body.permissions.length > 0) {
          const permRows = await db
            .select()
            .from(permissions)
            .where(inArray(permissions.code, req.body.permissions));
          for (const p of permRows) {
            await db.insert(userPermissions).values({ userId: targetId, permissionId: p.id });
          }
        }
      }

      await logAdminAction(
        req,
        'ADMIN_UPDATED',
        'Admin',
        targetId,
        `Updated admin @${existing.username} (status: ${status})`
      );

      res.json({ success: true, message: `Administrator @${existing.username} updated.` });
    } catch (err) {
      console.error('PATCH /admin/admins/:id error:', err);
      res.status(500).json({ error: 'Failed to update administrator.' });
    }
  });

  // View Admin Activity Logs
  router.get('/logs', requirePermission('view_logs'), async (_req, res) => {
    try {
      const logs = await db
        .select()
        .from(adminActivityLogs)
        .orderBy(desc(adminActivityLogs.createdAt))
        .limit(100);
      res.json({ logs });
    } catch (err) {
      console.error('GET /admin/logs error:', err);
      res.status(500).json({ error: 'Failed to load activity logs.' });
    }
  });

  // ================= C. AUCTION & CATEGORY MANAGEMENT =================
  router.get('/auctions', requirePermission('manage_auctions'), async (_req, res) => {
    try {
      const all = await db.select().from(auctions).orderBy(desc(auctions.createdAt));
      const ids = all.map((a) => a.id);
      const imgs =
        ids.length > 0
          ? await db
              .select()
              .from(auctionImages)
              .where(inArray(auctionImages.auctionId, ids))
              .orderBy(auctionImages.sortOrder)
          : [];
      const imgMap = new Map<number, string[]>();
      for (const im of imgs) {
        const list = imgMap.get(im.auctionId) || [];
        list.push(im.imageUrl);
        imgMap.set(im.auctionId, list);
      }

      res.json({
        auctions: all.map((a) => ({
          ...a,
          images: imgMap.get(a.id) || [],
        })),
      });
    } catch (err) {
      console.error('GET /admin/auctions error:', err);
      res.status(500).json({ error: 'Failed to load auctions.' });
    }
  });

  router.post('/auctions', requirePermission('manage_auctions'), async (req: AuthRequest, res) => {
    try {
      const title = sanitizeText(req.body.title, 160);
      const description = sanitizeRichText(req.body.description || title, 4000);
      const categoryId = req.body.categoryId ? Number(req.body.categoryId) : null;
      const condition = sanitizeText(req.body.condition || 'Brand New', 40);
      const brand = sanitizeText(req.body.brand || 'Verified', 60);
      const location = sanitizeText(req.body.location || 'Lagos, Nigeria', 80);
      const sellerName = sanitizeText(req.body.sellerName || 'NaijaAuction Verified', 80);
      const startingPrice = Number(req.body.startingPrice);
      const bidIncrement = Number(req.body.bidIncrement || 5000);
      const reservePrice = req.body.reservePrice ? Number(req.body.reservePrice) : null;
      const estimatedMarketValue = Number(req.body.estimatedMarketValue || startingPrice * 1.4);
      const status =
        typeof req.body.status === 'string' &&
        ['draft', 'scheduled', 'live'].includes(req.body.status)
          ? req.body.status
          : 'live';
      const startTime = req.body.startTime ? new Date(req.body.startTime) : new Date();
      const endTime = req.body.endTime
        ? new Date(req.body.endTime)
        : new Date(Date.now() + 24 * 3600 * 1000);
      const imageUrls: string[] = Array.isArray(req.body.images)
        ? req.body.images.filter((u: any) => typeof u === 'string' && u.trim().length > 0)
        : [];
      const specs: string[] = Array.isArray(req.body.specs)
        ? req.body.specs.map((s: any) => sanitizeText(s, 80)).filter(Boolean)
        : [];

      if (title.length < 3) return res.status(400).json({ error: 'Auction title is required.' });
      if (!Number.isFinite(startingPrice) || startingPrice <= 0) {
        return res.status(400).json({ error: 'Starting price must be greater than zero.' });
      }
      if (!Number.isFinite(bidIncrement) || bidIncrement <= 0) {
        return res.status(400).json({ error: 'Bid increment must be greater than zero.' });
      }
      if (endTime.getTime() <= startTime.getTime()) {
        return res.status(400).json({ error: 'Closing time must be after start time.' });
      }

      let categoryName = sanitizeText(req.body.categoryName || 'Electronics', 60);
      if (categoryId) {
        const [cat] = await db
          .select()
          .from(auctionCategories)
          .where(eq(auctionCategories.id, categoryId))
          .limit(1);
        if (cat) categoryName = cat.name;
      }

      const code = `LOT-NG-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-3)}`;
      const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${Date.now().toString().slice(-4)}`;

      const [created] = await db
        .insert(auctions)
        .values({
          code,
          title,
          slug,
          description,
          categoryId,
          categoryName,
          condition,
          brand,
          location,
          sellerName,
          startingPrice: Math.round(startingPrice),
          currentBid: Math.round(startingPrice),
          bidIncrement: Math.round(bidIncrement),
          reservePrice: reservePrice ? Math.round(reservePrice) : null,
          estimatedMarketValue: Math.round(estimatedMarketValue),
          status,
          startTime,
          endTime,
          effectiveEndTime: endTime,
          isFeatured: Boolean(req.body.isFeatured),
          specs,
          createdBy: req.auth!.user.id,
        })
        .returning();

      const imgsToInsert =
        imageUrls.length > 0
          ? imageUrls
          : ['/src/assets/images/hero_auction_showcase_1794582937386.jpg'];

      await db.insert(auctionImages).values(
        imgsToInsert.map((url, idx) => ({
          auctionId: created.id,
          imageUrl: url.trim(),
          sortOrder: idx,
          isPrimary: idx === 0,
        }))
      );

      await logAdminAction(
        req,
        'AUCTION_CREATED',
        'Auction',
        created.id,
        `Created auction ${created.code}: "${created.title}" (${created.status})`
      );

      io.emit('auction:updated', { auctionId: created.id, status: created.status });

      res.status(201).json({
        auction: { ...created, images: imgsToInsert },
        message: `Auction ${created.code} created successfully.`,
      });
    } catch (err) {
      console.error('POST /admin/auctions error:', err);
      res.status(500).json({ error: 'Failed to create auction.' });
    }
  });

  // Update / Start / Pause / Close / Cancel auction
  router.patch('/auctions/:id', requirePermission('manage_auctions'), async (req: AuthRequest, res) => {
    try {
      const auctionId = Number(req.params.id);
      const [existing] = await db.select().from(auctions).where(eq(auctions.id, auctionId)).limit(1);
      if (!existing) return res.status(404).json({ error: 'Auction not found.' });

      const nextStatus =
        typeof req.body.status === 'string' &&
        ['draft', 'scheduled', 'live', 'paused', 'ended', 'cancelled'].includes(req.body.status)
          ? req.body.status
          : existing.status;

      const patch: Record<string, any> = {
        title: req.body.title !== undefined ? sanitizeText(req.body.title, 160) : existing.title,
        description:
          req.body.description !== undefined
            ? sanitizeRichText(req.body.description, 4000)
            : existing.description,
        startingPrice:
          req.body.startingPrice !== undefined
            ? Math.round(Number(req.body.startingPrice))
            : existing.startingPrice,
        bidIncrement:
          req.body.bidIncrement !== undefined
            ? Math.round(Number(req.body.bidIncrement))
            : existing.bidIncrement,
        reservePrice:
          req.body.reservePrice !== undefined
            ? req.body.reservePrice
              ? Math.round(Number(req.body.reservePrice))
              : null
            : existing.reservePrice,
        status: nextStatus,
        isFeatured:
          req.body.isFeatured !== undefined ? Boolean(req.body.isFeatured) : existing.isFeatured,
        updatedAt: new Date(),
      };

      if (req.body.startTime) patch.startTime = new Date(req.body.startTime);
      if (req.body.endTime) {
        patch.endTime = new Date(req.body.endTime);
        patch.effectiveEndTime = new Date(req.body.endTime);
      }
      if (req.body.categoryName) {
        patch.categoryName = sanitizeText(req.body.categoryName, 60);
      }

      // If closing auction manually, finalize winner & notify participants
      if (nextStatus === 'ended' && existing.status !== 'ended') {
        const [topBid] = await db
          .select()
          .from(bids)
          .where(eq(bids.auctionId, auctionId))
          .orderBy(desc(bids.amount), bids.createdAt)
          .limit(1);

        if (topBid) {
          patch.winnerId = topBid.userId;
          patch.winnerUsername = topBid.username;
          patch.winningBidAmount = topBid.amount;

          await db.insert(notifications).values({
            userId: topBid.userId,
            type: 'auction_won',
            title: 'Congratulations! You Won an Auction',
            message: `You won "${existing.title}" with a winning bid of ₦${topBid.amount.toLocaleString()}.`,
            auctionId,
          });
        }
      }

      const [updated] = await db
        .update(auctions)
        .set(patch)
        .where(eq(auctions.id, auctionId))
        .returning();

      if (Array.isArray(req.body.images)) {
        const validImages = req.body.images
          .filter((u: any) => typeof u === 'string' && u.trim().length > 0)
          .map((u: string) => u.trim());
        if (validImages.length > 0) {
          await db.delete(auctionImages).where(eq(auctionImages.auctionId, auctionId));
          await db.insert(auctionImages).values(
            validImages.map((url: string, idx: number) => ({
              auctionId,
              imageUrl: url,
              sortOrder: idx,
              isPrimary: idx === 0,
            }))
          );
        }
      }

      await logAdminAction(
        req,
        'AUCTION_UPDATED',
        'Auction',
        auctionId,
        `Updated ${existing.code} (status: ${existing.status} -> ${nextStatus})`
      );

      io.emit('auction:updated', { auctionId, status: nextStatus });

      res.json({ auction: updated, message: `Auction ${existing.code} updated.` });
    } catch (err) {
      console.error('PATCH /admin/auctions/:id error:', err);
      res.status(500).json({ error: 'Failed to update auction.' });
    }
  });

  // View all bids on a specific auction
  router.get('/auctions/:id/bids', requirePermission('manage_bids'), async (req, res) => {
    try {
      const auctionId = Number(req.params.id);
      const auctionBids = await db
        .select()
        .from(bids)
        .where(eq(bids.auctionId, auctionId))
        .orderBy(desc(bids.amount), desc(bids.createdAt));
      res.json({ bids: auctionBids });
    } catch (err) {
      console.error('GET /admin/auctions/:id/bids error:', err);
      res.status(500).json({ error: 'Failed to load auction bids.' });
    }
  });

  // Delete auction
  router.delete('/auctions/:id', requirePermission('manage_auctions'), async (req: AuthRequest, res) => {
    try {
      const auctionId = Number(req.params.id);
      const [existing] = await db.select().from(auctions).where(eq(auctions.id, auctionId)).limit(1);
      if (!existing) return res.status(404).json({ error: 'Auction not found.' });

      await db.delete(auctions).where(eq(auctions.id, auctionId));
      await logAdminAction(
        req,
        'AUCTION_DELETED',
        'Auction',
        auctionId,
        `Deleted auction ${existing.code}: "${existing.title}"`
      );
      io.emit('auction:updated', { auctionId, deleted: true });
      res.json({ success: true, message: `Auction ${existing.code} deleted.` });
    } catch (err) {
      console.error('DELETE /admin/auctions/:id error:', err);
      res.status(500).json({ error: 'Failed to delete auction.' });
    }
  });

  // Categories CRUD
  router.get('/categories', requirePermission('manage_categories'), async (_req, res) => {
    const cats = await db.select().from(auctionCategories).orderBy(auctionCategories.name);
    res.json({ categories: cats });
  });

  router.post('/categories', requirePermission('manage_categories'), async (req: AuthRequest, res) => {
    try {
      const name = sanitizeText(req.body.name, 60);
      const description = sanitizeText(req.body.description || '', 200);
      if (name.length < 2) return res.status(400).json({ error: 'Category name is required.' });
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const [cat] = await db
        .insert(auctionCategories)
        .values({ name, slug, description, isActive: true })
        .returning();

      await logAdminAction(req, 'CATEGORY_CREATED', 'Category', cat.id, `Created category "${name}"`);
      res.status(201).json({ category: cat });
    } catch (err) {
      console.error('POST /admin/categories error:', err);
      res.status(409).json({ error: 'Category already exists or invalid.' });
    }
  });

  router.delete('/categories/:id', requirePermission('manage_categories'), async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(auctionCategories).where(eq(auctionCategories.id, id));
      await logAdminAction(req, 'CATEGORY_DELETED', 'Category', id, `Deleted category ID ${id}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete category.' });
    }
  });

  // ================= D. WEBSITE SETTINGS =================
  router.get('/settings', requirePermission('manage_settings'), async (_req, res) => {
    const [settings] = await db.select().from(websiteSettings).limit(1);
    res.json({ settings });
  });

  router.put('/settings', requirePermission('manage_settings'), async (req: AuthRequest, res) => {
    try {
      const [existing] = await db.select().from(websiteSettings).limit(1);
      const payload = {
        siteName: sanitizeText(req.body.siteName || 'NaijaAuction', 60),
        logoUrl: sanitizeText(req.body.logoUrl || '', 400),
        heroBannerTitle: sanitizeText(req.body.heroBannerTitle || '', 160),
        heroBannerSubtitle: sanitizeText(req.body.heroBannerSubtitle || '', 400),
        heroBannerImage: sanitizeText(req.body.heroBannerImage || '', 400),
        contactEmail: sanitizeText(req.body.contactEmail || '', 120),
        contactPhone: sanitizeText(req.body.contactPhone || '', 40),
        contactAddress: sanitizeText(req.body.contactAddress || '', 240),
        socialLinks: {
          twitter: sanitizeText(req.body.socialLinks?.twitter || '', 200),
          instagram: sanitizeText(req.body.socialLinks?.instagram || '', 200),
          facebook: sanitizeText(req.body.socialLinks?.facebook || '', 200),
          linkedin: sanitizeText(req.body.socialLinks?.linkedin || '', 200),
        },
        auctionRules: sanitizeRichText(req.body.auctionRules || '', 6000),
        termsAndConditions: sanitizeRichText(req.body.termsAndConditions || '', 8000),
        privacyPolicy: sanitizeRichText(req.body.privacyPolicy || '', 8000),
        aboutUs: sanitizeRichText(req.body.aboutUs || '', 6000),
        allowRegistration: Boolean(req.body.allowRegistration),
        requireEmailVerification: Boolean(req.body.requireEmailVerification),
        defaultBidIncrement: Math.max(100, Number(req.body.defaultBidIncrement || 5000)),
        antiSnipingSeconds: Math.max(10, Math.min(300, Number(req.body.antiSnipingSeconds || 60))),
        updatedBy: req.auth!.user.id,
        updatedAt: new Date(),
      };

      let updated;
      if (existing) {
        [updated] = await db
          .update(websiteSettings)
          .set(payload)
          .where(eq(websiteSettings.id, existing.id))
          .returning();
      } else {
        [updated] = await db.insert(websiteSettings).values(payload).returning();
      }

      await logAdminAction(
        req,
        'WEBSITE_SETTINGS_UPDATED',
        'Settings',
        updated.id,
        `Updated platform settings (${updated.siteName})`
      );

      io.emit('settings:updated', updated);
      res.json({ settings: updated, message: 'Website settings saved successfully.' });
    } catch (err) {
      console.error('PUT /admin/settings error:', err);
      res.status(500).json({ error: 'Failed to update website settings.' });
    }
  });

  return router;
}
