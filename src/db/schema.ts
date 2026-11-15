import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// 1. Users table
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(),
    fullName: text('full_name').notNull(),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    phone: text('phone').default('').notNull(),
    passwordHash: text('password_hash'),
    avatarUrl: text('avatar_url').default('').notNull(),
    status: text('status').default('active').notNull(), // active | inactive | suspended | banned
    emailVerified: boolean('email_verified').default(false).notNull(),
    mustChangePassword: boolean('must_change_password').default(false).notNull(),
    isAdmin: boolean('is_admin').default(false).notNull(),
    canPostProducts: boolean('can_post_products').default(false).notNull(),
    sellerApprovalRequested: boolean('seller_approval_requested').default(false).notNull(),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_username_lower_idx').on(sql`lower(${table.username})`),
    uniqueIndex('users_email_lower_idx').on(sql`lower(${table.email})`),
    index('users_status_idx').on(table.status),
  ]
);

// 2. Roles table
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // super_admin | auction_manager | user_manager | seller | buyer
  displayName: text('display_name').notNull(),
  description: text('description').default('').notNull(),
  isAdminRole: boolean('is_admin_role').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Permissions table
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // manage_admins | manage_users | manage_auctions | manage_bids | manage_settings | view_logs | manage_categories
  description: text('description').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Role Permissions join table
export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: serial('id').primaryKey(),
    roleId: integer('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    permissionId: integer('permission_id')
      .references(() => permissions.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [
    uniqueIndex('role_permissions_unique_idx').on(table.roleId, table.permissionId),
  ]
);

// 5. User Roles join table
export const userRoles = pgTable(
  'user_roles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    roleId: integer('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    assignedBy: integer('assigned_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_roles_unique_idx').on(table.userId, table.roleId),
  ]
);

// 6. User explicit permissions (for granular admin permission overrides)
export const userPermissions = pgTable(
  'user_permissions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    permissionId: integer('permission_id')
      .references(() => permissions.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_permissions_unique_idx').on(table.userId, table.permissionId),
  ]
);

// 7. Sessions table (Server-side HTTP-only cookie session store with token rotation)
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    rememberMe: boolean('remember_me').default(false).notNull(),
    isAdminSession: boolean('is_admin_session').default(false).notNull(),
    userAgent: text('user_agent').default('').notNull(),
    ipAddress: text('ip_address').default('').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    lastRotatedAt: timestamp('last_rotated_at').defaultNow().notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ]
);

// 8. Password Reset Tokens
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('prt_user_id_idx').on(table.userId)]
);

// 9. Email Verification Tokens
export const emailVerificationTokens = pgTable(
  'email_verification_tokens',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('evt_user_id_idx').on(table.userId)]
);

// 10. Auction Categories
export const auctionCategories = pgTable('auction_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description').default('').notNull(),
  icon: text('icon').default('Tag').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Auctions table
export const auctions = pgTable(
  'auctions',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull().unique(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    categoryId: integer('category_id').references(() => auctionCategories.id, {
      onDelete: 'set null',
    }),
    categoryName: text('category_name').default('Electronics').notNull(),
    condition: text('condition').default('Brand New').notNull(),
    brand: text('brand').default('').notNull(),
    location: text('location').default('Lagos, Nigeria').notNull(),
    sellerId: integer('seller_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    sellerName: text('seller_name').default('NaijaAuction Verified').notNull(),
    startingPrice: bigint('starting_price', { mode: 'number' }).notNull(),
    currentBid: bigint('current_bid', { mode: 'number' }).notNull(),
    bidIncrement: bigint('bid_increment', { mode: 'number' }).default(5000).notNull(),
    reservePrice: bigint('reserve_price', { mode: 'number' }),
    estimatedMarketValue: bigint('estimated_market_value', { mode: 'number' }).notNull(),
    status: text('status').default('scheduled').notNull(), // draft | scheduled | live | paused | ended | cancelled
    approvalStatus: text('approval_status').default('approved').notNull(), // pending | approved | rejected
    rejectionReason: text('rejection_reason').default('').notNull(),
    queueOrder: integer('queue_order').default(100).notNull(),
    slotKey: text('slot_key'),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    effectiveEndTime: timestamp('effective_end_time').notNull(),
    extensionCount: integer('extension_count').default(0).notNull(),
    maxExtensions: integer('max_extensions').default(5).notNull(),
    winnerId: integer('winner_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    winnerUsername: text('winner_username'),
    winningBidAmount: bigint('winning_bid_amount', { mode: 'number' }),
    winnerStatus: text('winner_status').default('pending').notNull(), // pending | notified | escrow_paid | dispatched | settled
    bidsCount: integer('bids_count').default(0).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    specs: jsonb('specs').$type<string[]>().default([]).notNull(),
    createdBy: integer('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('auctions_status_idx').on(table.status),
    index('auctions_category_idx').on(table.categoryId),
    index('auctions_end_time_idx').on(table.effectiveEndTime),
    index('auctions_queue_order_idx').on(table.queueOrder),
    index('auctions_approval_status_idx').on(table.approvalStatus),
    index('auctions_slot_key_idx').on(table.slotKey),
  ]
);

// 12. Auction Images
export const auctionImages = pgTable(
  'auction_images',
  {
    id: serial('id').primaryKey(),
    auctionId: integer('auction_id')
      .references(() => auctions.id, { onDelete: 'cascade' })
      .notNull(),
    imageUrl: text('image_url').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('auction_images_auction_idx').on(table.auctionId)]
);

// 13. Bids
export const bids = pgTable(
  'bids',
  {
    id: serial('id').primaryKey(),
    auctionId: integer('auction_id')
      .references(() => auctions.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    username: text('username').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    isProxy: boolean('is_proxy').default(false).notNull(),
    maxProxyAmount: bigint('max_proxy_amount', { mode: 'number' }),
    ipAddress: text('ip_address').default('').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('bids_auction_idx').on(table.auctionId),
    index('bids_user_idx').on(table.userId),
    index('bids_amount_idx').on(table.auctionId, table.amount),
  ]
);

// 14. Watchlists
export const watchlists = pgTable(
  'watchlists',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    auctionId: integer('auction_id')
      .references(() => auctions.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('watchlists_user_auction_unique_idx').on(table.userId, table.auctionId),
  ]
);

// 15. Notifications
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    auctionId: integer('auction_id').references(() => auctions.id, {
      onDelete: 'set null',
    }),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('notifications_user_read_idx').on(table.userId, table.isRead),
  ]
);

// 16. Admin Activity Logs
export const adminActivityLogs = pgTable(
  'admin_activity_logs',
  {
    id: serial('id').primaryKey(),
    adminId: integer('admin_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    adminUsername: text('admin_username').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').default('').notNull(),
    details: text('details').default('').notNull(),
    ipAddress: text('ip_address').default('').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('admin_logs_created_idx').on(table.createdAt)]
);

// 17. Website Settings
export const websiteSettings = pgTable('website_settings', {
  id: serial('id').primaryKey(),
  siteName: text('site_name').default('NaijaAuction').notNull(),
  logoUrl: text('logo_url').default('').notNull(),
  heroBannerTitle: text('hero_banner_title')
    .default('Live Verified Auctions with Protected Escrow')
    .notNull(),
  heroBannerSubtitle: text('hero_banner_subtitle')
    .default(
      'Bid in real time on verified smartphones, laptops, luxury timepieces, and power equipment across Nigeria.'
    )
    .notNull(),
  heroBannerImage: text('hero_banner_image')
    .default('/src/assets/images/hero_auction_showcase_1794582937386.jpg')
    .notNull(),
  contactEmail: text('contact_email').default('support@naijaauction.ng').notNull(),
  contactPhone: text('contact_phone').default('+234 800 624 5228').notNull(),
  contactAddress: text('contact_address')
    .default('14 Simbiat Abiola Way, Computer Village, Ikeja, Lagos, Nigeria')
    .notNull(),
  socialLinks: jsonb('social_links')
    .$type<{ twitter?: string; instagram?: string; facebook?: string; linkedin?: string }>()
    .default({
      twitter: 'https://twitter.com/naijaauction',
      instagram: 'https://instagram.com/naijaauction',
      facebook: 'https://facebook.com/naijaauction',
      linkedin: 'https://linkedin.com/company/naijaauction',
    })
    .notNull(),
  auctionRules: text('auction_rules')
    .default(
      '1. All bids are binding commitments.\n2. Anti-sniping protection automatically extends closing timers by 60 seconds when a bid arrives in the final 30 seconds.\n3. Winners must settle escrow invoices within 24 hours.\n4. Funds remain protected in escrow until buyer inspection confirms item authenticity.'
    )
    .notNull(),
  termsAndConditions: text('terms_and_conditions')
    .default(
      'By registering and placing bids on NaijaAuction, you agree to abide by our transparent bidding rules, verified identity policies, and protected escrow settlement terms.'
    )
    .notNull(),
  privacyPolicy: text('privacy_policy')
    .default(
      'NaijaAuction protects your personal data using encrypted sessions, bcrypt password hashing, and strict data minimization. Public auction feeds display only masked handles or usernames.'
    )
    .notNull(),
  aboutUs: text('about_us')
    .default(
      'NaijaAuction is Nigeria’s premier real-time interactive auction marketplace connecting verified merchants in Lagos, Abuja, and Port Harcourt with discerning buyers through server-authoritative bidding and 100% escrow protection.'
    )
    .notNull(),
  allowRegistration: boolean('allow_registration').default(true).notNull(),
  requireEmailVerification: boolean('require_email_verification').default(false).notNull(),
  defaultBidIncrement: integer('default_bid_increment').default(5000).notNull(),
  antiSnipingSeconds: integer('anti_sniping_seconds').default(60).notNull(),
  timeBetweenAuctionsMinutes: integer('time_between_auctions_minutes').default(15).notNull(),
  defaultSlotDurationMinutes: integer('default_slot_duration_minutes').default(60).notNull(),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 18. Auction Discussions (Authenticated Live Discussions inside auction rooms)
export const auctionDiscussions = pgTable(
  'auction_discussions',
  {
    id: serial('id').primaryKey(),
    auctionId: integer('auction_id')
      .references(() => auctions.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    username: text('username').notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('discussions_auction_idx').on(table.auctionId)]
);

// ================= RELATIONS =================
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  userPermissions: many(userPermissions),
  sessions: many(sessions),
  bids: many(bids),
  watchlists: many(watchlists),
  notifications: many(notifications),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userPermissions: many(userPermissions),
}));

export const auctionsRelations = relations(auctions, ({ one, many }) => ({
  category: one(auctionCategories, {
    fields: [auctions.categoryId],
    references: [auctionCategories.id],
  }),
  images: many(auctionImages),
  bids: many(bids),
  watchlists: many(watchlists),
  discussions: many(auctionDiscussions),
}));

export const auctionImagesRelations = relations(auctionImages, ({ one }) => ({
  auction: one(auctions, {
    fields: [auctionImages.auctionId],
    references: [auctions.id],
  }),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  auction: one(auctions, {
    fields: [bids.auctionId],
    references: [auctions.id],
  }),
  user: one(users, {
    fields: [bids.userId],
    references: [users.id],
  }),
}));
