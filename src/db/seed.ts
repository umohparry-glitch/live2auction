import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './index.ts';
import {
  auctionCategories,
  auctionImages,
  auctions,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
  websiteSettings,
} from './schema.ts';

let seedPromise: Promise<void> | null = null;
let seeded = false;

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  if (!seedPromise) {
    seedPromise = runSeed()
      .then(() => {
        seeded = true;
      })
      .catch((err) => {
        seedPromise = null;
        console.error('Database seed warning:', err);
      });
  }
  await seedPromise;
}

async function runSeed() {
  // 1. Seed Roles
  const defaultRoles = [
    {
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Complete control over the entire platform, admins, users, auctions, and settings.',
      isAdminRole: true,
    },
    {
      name: 'auction_manager',
      displayName: 'Auction Manager',
      description: 'Create, edit, monitor, start, close, and cancel auctions and manage categories.',
      isAdminRole: true,
    },
    {
      name: 'user_manager',
      displayName: 'User Manager',
      description: 'Manage registered users, create accounts, reset passwords, suspend/reactivate.',
      isAdminRole: true,
    },
    {
      name: 'seller',
      displayName: 'Verified Seller',
      description: 'Accredited merchant able to submit auction lots for verification.',
      isAdminRole: false,
    },
    {
      name: 'buyer',
      displayName: 'Registered Bidder',
      description: 'Standard authenticated buyer able to bid, watch items, and manage orders.',
      isAdminRole: false,
    },
  ];

  for (const r of defaultRoles) {
    await db
      .insert(roles)
      .values(r)
      .onConflictDoNothing({ target: roles.name });
  }

  // 2. Seed Permissions
  const defaultPermissions = [
    { code: 'manage_admins', description: 'Create, edit, suspend, and assign roles to administrators' },
    { code: 'manage_users', description: 'View, create, edit, suspend, ban, and delete standard users' },
    { code: 'manage_auctions', description: 'Create, edit, schedule, start, close, and cancel auctions' },
    { code: 'manage_bids', description: 'Inspect and moderate all auction bids and winners' },
    { code: 'manage_categories', description: 'Create, edit, and toggle auction categories' },
    { code: 'manage_settings', description: 'Modify website branding, policies, banners, and auction rules' },
    { code: 'view_logs', description: 'View administrator audit trail and platform activity logs' },
  ];

  for (const p of defaultPermissions) {
    await db
      .insert(permissions)
      .values(p)
      .onConflictDoNothing({ target: permissions.code });
  }

  // 3. Map Role -> Permissions
  const allRoles = await db.select().from(roles);
  const allPerms = await db.select().from(permissions);
  const roleMap = new Map(allRoles.map((r) => [r.name, r.id]));
  const permMap = new Map(allPerms.map((p) => [p.code, p.id]));

  const rolePermMapping: Record<string, string[]> = {
    super_admin: [
      'manage_admins',
      'manage_users',
      'manage_auctions',
      'manage_bids',
      'manage_categories',
      'manage_settings',
      'view_logs',
    ],
    auction_manager: ['manage_auctions', 'manage_bids', 'manage_categories'],
    user_manager: ['manage_users'],
  };

  for (const [roleName, permCodes] of Object.entries(rolePermMapping)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;
    for (const code of permCodes) {
      const permissionId = permMap.get(code);
      if (!permissionId) continue;
      await db
        .insert(rolePermissions)
        .values({ roleId, permissionId })
        .onConflictDoNothing();
    }
  }

  // 4. Provision Default Super Admin ('damwad') if INITIAL_ADMIN_PASSWORD env var is configured
  const initialAdminPwd = process.env.INITIAL_ADMIN_PASSWORD;
  const existingDamwad = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = 'damwad'`)
    .limit(1);

  if (existingDamwad.length === 0 && initialAdminPwd && initialAdminPwd.trim().length >= 6) {
    const passwordHash = await bcrypt.hash(initialAdminPwd.trim(), 12);
    const [createdAdmin] = await db
      .insert(users)
      .values({
        uid: `admin_${crypto.randomUUID()}`,
        fullName: 'Damwad Super Administrator',
        username: 'damwad',
        email: 'damwad@naijaauction.ng',
        phone: '+234 800 624 5228',
        passwordHash,
        status: 'active',
        emailVerified: true,
        mustChangePassword: true,
        isAdmin: true,
      })
      .returning();

    const superAdminRoleId = roleMap.get('super_admin');
    if (createdAdmin && superAdminRoleId) {
      await db
        .insert(userRoles)
        .values({ userId: createdAdmin.id, roleId: superAdminRoleId })
        .onConflictDoNothing();
    }
  }

  // 5. Seed Website Settings
  const existingSettings = await db.select().from(websiteSettings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(websiteSettings).values({
      siteName: 'NaijaAuction',
      logoUrl: '',
      heroBannerTitle: 'Verified Live Auctions with 100% Protected Escrow',
      heroBannerSubtitle:
        'Bid transparently on flagship smartphones, pro workstations, luxury horology, and solar power units across Nigeria.',
      heroBannerImage: '/src/assets/images/hero_auction_showcase_1794582937386.jpg',
      contactEmail: 'support@naijaauction.ng',
      contactPhone: '+234 800 624 5228',
      contactAddress: '14 Simbiat Abiola Way, Computer Village, Ikeja, Lagos, Nigeria',
      socialLinks: {
        twitter: 'https://twitter.com/naijaauction',
        instagram: 'https://instagram.com/naijaauction',
        facebook: 'https://facebook.com/naijaauction',
        linkedin: 'https://linkedin.com/company/naijaauction',
      },
    });
  }

  // 6. Seed Auction Categories
  const defaultCategories = [
    { name: 'Phones', slug: 'phones', description: 'Flagship smartphones and mobile accessories', icon: 'Smartphone' },
    { name: 'Laptops', slug: 'laptops', description: 'Workstations, ultrabooks, and creator laptops', icon: 'Laptop' },
    { name: 'Watches', slug: 'watches', description: 'Swiss mechanical and luxury chronographs', icon: 'Watch' },
    { name: 'Solar & Power', slug: 'solar-power', description: 'Lithium power stations, inverters, and solar kits', icon: 'Zap' },
    { name: 'Electronics', slug: 'electronics', description: 'Audio gear, consoles, cameras, and smart home', icon: 'Cpu' },
  ];

  for (const cat of defaultCategories) {
    await db
      .insert(auctionCategories)
      .values(cat)
      .onConflictDoNothing({ target: auctionCategories.slug });
  }

  // 7. Seed Initial Auctions (Live, Upcoming/Scheduled, Completed/Ended) if empty
  const existingAuctions = await db.select({ id: auctions.id }).from(auctions).limit(1);
  if (existingAuctions.length === 0) {
    const cats = await db.select().from(auctionCategories);
    const catBySlug = new Map(cats.map((c) => [c.slug, c]));
    const now = Date.now();

    const sampleAuctions = [
      {
        code: 'LOT-NG-101',
        title: 'iPhone 15 Pro Max 256GB Natural Titanium (Factory Unlocked)',
        slug: 'iphone-15-pro-max-256gb-natural-titanium',
        description:
          'Brand new factory sealed Apple iPhone 15 Pro Max 256GB Natural Titanium. Physical SIM + eSIM compatible, verified Apple warranty, inspected at Ikeja Hub.',
        categoryId: catBySlug.get('phones')?.id ?? null,
        categoryName: 'Phones',
        condition: 'Brand New',
        brand: 'Apple',
        location: 'Ikeja, Lagos',
        sellerName: 'Ikeja Gadget Hub Ltd',
        startingPrice: 1250000,
        currentBid: 1385000,
        bidIncrement: 15000,
        reservePrice: 1300000,
        estimatedMarketValue: 1850000,
        status: 'live',
        startTime: new Date(now - 2 * 3600 * 1000),
        endTime: new Date(now + 45 * 60 * 1000),
        effectiveEndTime: new Date(now + 45 * 60 * 1000),
        bidsCount: 9,
        isFeatured: true,
        specs: ['256GB NVMe Storage', 'A17 Pro Chip', 'Natural Titanium Grade 5', '12-Month Apple Warranty'],
        images: [
          '/src/assets/images/auction_iphone_pro_1794582939193.jpg',
          '/src/assets/images/hero_auction_showcase_1794582937386.jpg',
        ],
      },
      {
        code: 'LOT-NG-102',
        title: 'MacBook Pro 16-inch M3 Max 36GB RAM / 1TB SSD Space Black',
        slug: 'macbook-pro-16-m3-max-space-black',
        description:
          'Mint open-box Apple MacBook Pro 16 M3 Max with only 4 battery cycles. Includes original 140W MagSafe charger and verified serial inspection certificate.',
        categoryId: catBySlug.get('laptops')?.id ?? null,
        categoryName: 'Laptops',
        condition: 'Open Box',
        brand: 'Apple',
        location: 'Wuse 2, Abuja',
        sellerName: 'Abuja Pro Systems',
        startingPrice: 2800000,
        currentBid: 3050000,
        bidIncrement: 25000,
        reservePrice: 2950000,
        estimatedMarketValue: 4100000,
        status: 'live',
        startTime: new Date(now - 1 * 3600 * 1000),
        endTime: new Date(now + 95 * 60 * 1000),
        effectiveEndTime: new Date(now + 95 * 60 * 1000),
        bidsCount: 6,
        isFeatured: true,
        specs: ['Apple M3 Max 14-Core', '36GB Unified Memory', '1TB PCIe SSD', 'Liquid Retina XDR 120Hz'],
        images: [
          '/src/assets/images/auction_macbook_pro_1794582937883.jpg',
          '/src/assets/images/hero_auction_showcase_1794582937386.jpg',
        ],
      },
      {
        code: 'LOT-NG-103',
        title: 'Volta X-1000 LiFePO4 Portable Solar Power Station (1024Wh / 1200W)',
        slug: 'volta-x1000-lifepo4-solar-power-station',
        description:
          'Heavy-duty Nigerian-grid-ready portable lithium power station with 220V pure sine wave AC outlets, 100W USB-C PD, and solar MPPT fast input.',
        categoryId: catBySlug.get('solar-power')?.id ?? null,
        categoryName: 'Solar & Power',
        condition: 'Brand New',
        brand: 'Volta',
        location: 'Victoria Island, Lagos',
        sellerName: 'Lagos CleanEnergy Co.',
        startingPrice: 480000,
        currentBid: 540000,
        bidIncrement: 10000,
        reservePrice: 500000,
        estimatedMarketValue: 780000,
        status: 'live',
        startTime: new Date(now - 30 * 60 * 1000),
        endTime: new Date(now + 2 * 3600 * 1000),
        effectiveEndTime: new Date(now + 2 * 3600 * 1000),
        bidsCount: 5,
        isFeatured: true,
        specs: ['1024Wh LiFePO4 Battery', '1200W Pure Sine AC Output', 'Dual 100W USB-C PD', '3500+ Charge Cycles'],
        images: ['/src/assets/images/auction_solar_station_1794582938882.jpg'],
      },
      {
        code: 'LOT-NG-104',
        title: 'Swiss Automatic Emerald Dial Chronograph Stainless Steel 41mm',
        slug: 'swiss-automatic-emerald-chronograph-41mm',
        description:
          'Authenticated mechanical automatic chronograph wristwatch with sapphire crystal, exhibition caseback, and full presentation box.',
        categoryId: catBySlug.get('watches')?.id ?? null,
        categoryName: 'Watches',
        condition: 'Brand New',
        brand: 'Helvetia Horology',
        location: 'Ikoyi, Lagos',
        sellerName: 'Ikoyi Timepieces Guild',
        startingPrice: 950000,
        currentBid: 950000,
        bidIncrement: 20000,
        reservePrice: 1100000,
        estimatedMarketValue: 1650000,
        status: 'scheduled',
        startTime: new Date(now + 3 * 3600 * 1000),
        endTime: new Date(now + 27 * 3600 * 1000),
        effectiveEndTime: new Date(now + 27 * 3600 * 1000),
        bidsCount: 0,
        isFeatured: false,
        specs: ['Calibre 7750 Automatic', 'Sapphire Crystal', '100m Water Resistance', '41mm Brushed 316L Steel'],
        images: ['/src/assets/images/auction_luxury_watch_1794582939778.jpg'],
      },
      {
        code: 'LOT-NG-105',
        title: 'Executive Tech Bundle: Titanium Flagship + Pro Workstation',
        slug: 'executive-tech-bundle-flagship-workstation',
        description:
          'Curated corporate auction bundle featuring an unlocked Pro Max smartphone paired with a 14-inch aluminum pro laptop.',
        categoryId: catBySlug.get('electronics')?.id ?? null,
        categoryName: 'Electronics',
        condition: 'Brand New',
        brand: 'Multi-Brand',
        location: 'Port Harcourt, Rivers',
        sellerName: 'Delta Enterprise Tech',
        startingPrice: 3200000,
        currentBid: 3200000,
        bidIncrement: 50000,
        reservePrice: 3400000,
        estimatedMarketValue: 4600000,
        status: 'scheduled',
        startTime: new Date(now + 18 * 3600 * 1000),
        endTime: new Date(now + 42 * 3600 * 1000),
        effectiveEndTime: new Date(now + 42 * 3600 * 1000),
        bidsCount: 0,
        isFeatured: false,
        specs: ['Factory Sealed Pair', 'Dual Escrow Inspection', '24-Hour Express Dispatch'],
        images: ['/src/assets/images/hero_auction_showcase_1794582937386.jpg'],
      },
      {
        code: 'LOT-NG-098',
        title: 'iPhone 14 Pro Max 512GB Space Black (Completed Lot)',
        slug: 'iphone-14-pro-max-512gb-completed',
        description: 'Completed verified auction settled cleanly through NaijaAuction Escrow.',
        categoryId: catBySlug.get('phones')?.id ?? null,
        categoryName: 'Phones',
        condition: 'Open Box',
        brand: 'Apple',
        location: 'Ikeja, Lagos',
        sellerName: 'Ikeja Gadget Hub Ltd',
        startingPrice: 900000,
        currentBid: 1145000,
        bidIncrement: 15000,
        reservePrice: 950000,
        estimatedMarketValue: 1450000,
        status: 'ended',
        startTime: new Date(now - 48 * 3600 * 1000),
        endTime: new Date(now - 6 * 3600 * 1000),
        effectiveEndTime: new Date(now - 6 * 3600 * 1000),
        winnerUsername: 'DealHunter_Lagos',
        winningBidAmount: 1145000,
        bidsCount: 14,
        isFeatured: false,
        specs: ['512GB Storage', '98% Battery Health', 'Original Box & Receipt'],
        images: ['/src/assets/images/auction_iphone_pro_1794582939193.jpg'],
      },
    ];

    for (const item of sampleAuctions) {
      const { images: imgUrls, ...auctionRow } = item;
      const [inserted] = await db.insert(auctions).values(auctionRow).returning();
      if (inserted && imgUrls.length > 0) {
        await db.insert(auctionImages).values(
          imgUrls.map((url, idx) => ({
            auctionId: inserted.id,
            imageUrl: url,
            sortOrder: idx,
            isPrimary: idx === 0,
          }))
        );
      }
    }
  }
}
