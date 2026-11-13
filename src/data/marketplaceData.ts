import { 
  MarketplaceProduct, 
  MarketplaceOrder, 
  MarketplaceDispute, 
  SellerProfile,
  AuditLogEntry,
  CommissionRule
} from '../types/marketplace';

export const INITIAL_COMMISSION_RULES: CommissionRule[] = [
  { id: 'c1', minAmount: 0, maxAmount: 100000, percentage: 12, fixedFee: 500 },
  { id: 'c2', minAmount: 100001, maxAmount: 500000, percentage: 10, fixedFee: 1000 },
  { id: 'c3', minAmount: 500001, maxAmount: 2000000, percentage: 7.5, fixedFee: 2500 },
  { id: 'c4', minAmount: 2000001, maxAmount: 100000000, percentage: 5, fixedFee: 5000 }
];

export function calculatePlatformCommission(saleAmount: number): {
  percentage: number;
  fixedFee: number;
  commissionTotal: number;
  sellerNetAmount: number;
} {
  const rule = INITIAL_COMMISSION_RULES.find(
    r => saleAmount >= r.minAmount && saleAmount <= r.maxAmount
  ) || INITIAL_COMMISSION_RULES[INITIAL_COMMISSION_RULES.length - 1];

  const variableFee = Math.round((saleAmount * rule.percentage) / 100);
  const commissionTotal = variableFee + rule.fixedFee;
  const sellerNetAmount = Math.max(0, saleAmount - commissionTotal);

  return {
    percentage: rule.percentage,
    fixedFee: rule.fixedFee,
    commissionTotal,
    sellerNetAmount
  };
}

export const DEMO_SELLERS: SellerProfile[] = [
  {
    id: 'seller_ikeja_hub',
    userId: 'u_seller_1',
    businessName: 'Ikeja Gadget Hub Ltd (Computer Village)',
    classification: 'registered_business',
    state: 'Lagos',
    city: 'Ikeja',
    address: '14 Otigba Street, Computer Village, Ikeja',
    status: 'verified',
    payoutBank: 'Zenith Bank',
    payoutAccountNumber: '2089****12',
    payoutAccountName: 'IKEJA GADGET HUB LTD',
    rating: 4.9,
    totalSalesCount: 142,
    totalSalesVolume: 42800000,
    sellThroughRate: 96.4,
    avgFulfilmentHours: 3.2,
    phoneVerified: true,
    identityVerified: true,
    createdAt: '2025-01-10T10:00:00Z'
  },
  {
    id: 'seller_abuja_tech',
    userId: 'u_seller_2',
    businessName: 'Abuja Tech Pavilion (Wuse 2)',
    classification: 'registered_business',
    state: 'Abuja FCT',
    city: 'Wuse 2',
    address: 'Plot 418 Aminu Kano Crescent, Wuse 2, Abuja',
    status: 'verified',
    payoutBank: 'Guaranty Trust Bank (GTBank)',
    payoutAccountNumber: '0142****90',
    payoutAccountName: 'ABUJA TECH PAVILION ENT',
    rating: 4.8,
    totalSalesCount: 88,
    totalSalesVolume: 29400000,
    sellThroughRate: 93.1,
    avgFulfilmentHours: 4.5,
    phoneVerified: true,
    identityVerified: true,
    createdAt: '2025-02-15T14:30:00Z'
  },
  {
    id: 'seller_solarnaija',
    userId: 'u_seller_3',
    businessName: 'SolarNaija Direct Energy',
    classification: 'registered_business',
    state: 'Lagos',
    city: 'Lekki',
    address: 'Admiralty Way, Lekki Phase 1, Lagos',
    status: 'verified',
    payoutBank: 'Access Bank',
    payoutAccountNumber: '0039****67',
    payoutAccountName: 'SOLARNAIJA SYSTEMS NIG',
    rating: 5.0,
    totalSalesCount: 54,
    totalSalesVolume: 38200000,
    sellThroughRate: 98.0,
    avgFulfilmentHours: 2.8,
    phoneVerified: true,
    identityVerified: true,
    createdAt: '2025-03-01T09:00:00Z'
  }
];

export const DEMO_MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'mprod_1',
    sellerId: 'seller_ikeja_hub',
    sellerName: 'Ikeja Gadget Hub Ltd',
    sellerLocation: 'Ikeja, Lagos',
    sellerRating: 4.9,
    sellerCompletedSales: 142,
    sellerVerified: true,
    title: 'Apple iPhone 15 Pro Max (256GB, Natural Titanium)',
    slug: 'apple-iphone-15-pro-max-256gb-natural-titanium-verified-lagos',
    category: 'Phones',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max 256GB',
    condition: 'Brand New',
    description: 'Factory sealed US model A2849 Apple iPhone 15 Pro Max. 100% clean IMEI, active manufacturer 1-year warranty, A17 Pro chip, 5x optical zoom camera. Verified directly at Computer Village inspection hub.',
    quantity: 1,
    productLocation: 'Ikeja, Lagos',
    expectedMarketValue: 1650000,
    startingPrice: 1100000,
    reservePrice: 1200000,
    bidIncrement: 20000,
    currentBid: 1280000,
    bidsCount: 19,
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80'
    ],
    verificationStatus: 'verified',
    status: 'live',
    startTime: new Date(Date.now() - 3600000 * 20).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 4).toISOString(), // 4 hours left
    effectiveEndTime: new Date(Date.now() + 3600000 * 4).toISOString(),
    extensionCount: 0,
    maxExtensions: 5,
    deliveryOptions: {
      shipsFrom: 'Ikeja, Lagos',
      dispatchTime: 'Same Day Dispatch (Lagos 2-4 hrs)',
      lagosAbujaFee: 3500,
      nationwideFee: 7000,
      courierName: 'GIG Logistics / Red Star Express'
    },
    warrantyInfo: '1 Year Apple Official Warranty',
    serialNumber: 'F2LX****MN90',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'mprod_2',
    sellerId: 'seller_abuja_tech',
    sellerName: 'Abuja Tech Pavilion',
    sellerLocation: 'Wuse 2, Abuja',
    sellerRating: 4.8,
    sellerCompletedSales: 88,
    sellerVerified: true,
    title: 'Apple MacBook Pro 14" M3 Pro (18GB RAM, 512GB SSD, Space Black)',
    slug: 'macbook-pro-14-m3-pro-18gb-512gb-abuja',
    category: 'Laptops',
    brand: 'Apple',
    model: 'MacBook Pro 14" M3 Pro',
    condition: 'Open Box',
    description: 'Clean Grade A+ executive machine. Battery health 100% (only 8 battery cycles). Comes in original Apple box with genuine MagSafe 3 braided cable and 70W power brick. Liquid Retina XDR display.',
    quantity: 1,
    productLocation: 'Wuse 2, Abuja',
    expectedMarketValue: 2400000,
    startingPrice: 1600000,
    reservePrice: 1750000,
    bidIncrement: 25000,
    currentBid: 1850000,
    bidsCount: 14,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80'
    ],
    verificationStatus: 'inspected',
    status: 'live',
    startTime: new Date(Date.now() - 3600000 * 30).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 1.5).toISOString(), // Ending soon (1.5 hrs)
    effectiveEndTime: new Date(Date.now() + 3600000 * 1.5).toISOString(),
    extensionCount: 1,
    maxExtensions: 5,
    deliveryOptions: {
      shipsFrom: 'Wuse 2, Abuja',
      dispatchTime: '24-48 Hours Tracked Air Cargo',
      lagosAbujaFee: 4500,
      nationwideFee: 8500,
      courierName: 'DHL Nigeria / Fez Delivery'
    },
    warrantyInfo: '6 Months Tech Pavilion Warranty',
    serialNumber: 'C02G****MD6T',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
  },
  {
    id: 'mprod_3',
    sellerId: 'seller_solarnaija',
    sellerName: 'SolarNaija Direct Energy',
    sellerLocation: 'Lekki, Lagos',
    sellerRating: 5.0,
    sellerCompletedSales: 54,
    sellerVerified: true,
    title: 'EcoFlow Delta 2 Solar Power Station (1024Wh LFP + 220W Bifacial Panel)',
    slug: 'ecoflow-delta-2-solar-power-station-lekki-lagos',
    category: 'Solar & Power',
    brand: 'EcoFlow',
    model: 'Delta 2 1024Wh',
    condition: 'Brand New',
    description: 'Essential power backup system for Nigerian homes and offices. Powers 1HP Inverter AC, refrigerator, lights, TV, and workstations during grid outages. Ultra-fast charging: 0-80% in 50 minutes.',
    quantity: 1,
    productLocation: 'Lekki Phase 1, Lagos',
    expectedMarketValue: 1150000,
    startingPrice: 650000,
    reservePrice: 700000,
    bidIncrement: 10000,
    currentBid: 780000,
    bidsCount: 22,
    images: [
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1000&q=80'
    ],
    verificationStatus: 'verified',
    status: 'live',
    startTime: new Date(Date.now() - 3600000 * 12).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 18).toISOString(),
    effectiveEndTime: new Date(Date.now() + 3600000 * 18).toISOString(),
    extensionCount: 0,
    maxExtensions: 5,
    deliveryOptions: {
      shipsFrom: 'Lekki, Lagos',
      dispatchTime: 'Special Handled Cargo (1-2 Days)',
      lagosAbujaFee: 6000,
      nationwideFee: 12000,
      courierName: 'Kwik Delivery / GIG Heavy Cargo'
    },
    warrantyInfo: '3 Years Manufacturer Warranty',
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString()
  },
  {
    id: 'mprod_4',
    sellerId: 'seller_ikeja_hub',
    sellerName: 'Ikeja Gadget Hub Ltd',
    sellerLocation: 'Ikeja, Lagos',
    sellerRating: 4.9,
    sellerCompletedSales: 142,
    sellerVerified: true,
    title: 'Sony PlayStation 5 Slim Disc Edition + 2 DualSense Controllers',
    slug: 'sony-playstation-5-slim-disc-edition-ikeja',
    category: 'Gaming',
    brand: 'Sony',
    model: 'PS5 Slim Disc (CFI-2000)',
    condition: 'Brand New',
    description: 'Brand new in box PS5 Slim with Ultra HD Blu-ray disc drive, 1TB NVMe internal SSD, 2 genuine DualSense controllers (White & Midnight Black), and EA Sports FC 24 disc included.',
    quantity: 1,
    productLocation: 'Ikeja, Lagos',
    expectedMarketValue: 790000,
    startingPrice: 480000,
    reservePrice: 520000,
    bidIncrement: 10000,
    currentBid: 560000,
    bidsCount: 16,
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80'
    ],
    verificationStatus: 'verified',
    status: 'live',
    startTime: new Date(Date.now() - 3600000 * 8).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 6).toISOString(),
    effectiveEndTime: new Date(Date.now() + 3600000 * 6).toISOString(),
    extensionCount: 0,
    maxExtensions: 5,
    deliveryOptions: {
      shipsFrom: 'Ikeja, Lagos',
      dispatchTime: '24 Hours Delivery',
      lagosAbujaFee: 4000,
      nationwideFee: 8000,
      courierName: 'GIG Logistics'
    },
    warrantyInfo: '1 Year Merchant Warranty',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
  },
  {
    id: 'mprod_5',
    sellerId: 'seller_abuja_tech',
    sellerName: 'Abuja Tech Pavilion',
    sellerLocation: 'Wuse 2, Abuja',
    sellerRating: 4.8,
    sellerCompletedSales: 88,
    sellerVerified: true,
    title: 'Samsung 65" QLED 4K Smart TV (Q60C Series, 2024)',
    slug: 'samsung-65-qled-4k-smart-tv-abuja',
    category: 'Electronics',
    brand: 'Samsung',
    model: 'QA65Q60CAUXKE',
    condition: 'Brand New',
    description: 'Quantum Dot 100% color volume, Quantum HDR, Dual LED backlighting, SolarCell Remote, AirSlim design. Direct import from authorized Samsung Gulf channel.',
    quantity: 1,
    productLocation: 'Wuse 2, Abuja',
    expectedMarketValue: 980000,
    startingPrice: 620000,
    reservePrice: 680000,
    bidIncrement: 15000,
    currentBid: 710000,
    bidsCount: 11,
    images: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80'
    ],
    verificationStatus: 'verified',
    status: 'live',
    startTime: new Date(Date.now() - 3600000 * 16).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 22).toISOString(),
    effectiveEndTime: new Date(Date.now() + 3600000 * 22).toISOString(),
    extensionCount: 0,
    maxExtensions: 5,
    deliveryOptions: {
      shipsFrom: 'Wuse 2, Abuja',
      dispatchTime: 'Special Handled Cargo (1-2 Days)',
      lagosAbujaFee: 7500,
      nationwideFee: 15000,
      courierName: 'Kobo360 / GIG Logistics'
    },
    warrantyInfo: '2 Years Official Samsung Warranty',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'mprod_6',
    sellerId: 'seller_ikeja_hub',
    sellerName: 'Ikeja Gadget Hub Ltd',
    sellerLocation: 'Ikeja, Lagos',
    sellerRating: 4.9,
    sellerCompletedSales: 142,
    sellerVerified: true,
    title: 'Apple Watch Ultra 2 (49mm Titanium, Orange Ocean Band)',
    slug: 'apple-watch-ultra-2-titanium-ikeja',
    category: 'Watches',
    brand: 'Apple',
    model: 'Watch Ultra 2 GPS + Cellular',
    condition: 'Open Box',
    description: 'Aerospace-grade titanium case, precision dual-frequency GPS, up to 36 hours of battery life (72 hours in low power mode), 3000 nits brightest display. Complete with box and charger.',
    quantity: 1,
    productLocation: 'Ikeja, Lagos',
    expectedMarketValue: 920000,
    startingPrice: 550000,
    reservePrice: 600000,
    bidIncrement: 10000,
    currentBid: 640000,
    bidsCount: 15,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80'
    ],
    verificationStatus: 'verified',
    status: 'live',
    startTime: new Date(Date.now() - 3600000 * 26).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 0.8).toISOString(), // 48 mins left
    effectiveEndTime: new Date(Date.now() + 3600000 * 0.8).toISOString(),
    extensionCount: 0,
    maxExtensions: 5,
    deliveryOptions: {
      shipsFrom: 'Ikeja, Lagos',
      dispatchTime: 'Same Day Dispatch',
      lagosAbujaFee: 3000,
      nationwideFee: 6000,
      courierName: 'GIG Logistics'
    },
    warrantyInfo: 'AppleCare+ valid until Nov 2026',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString()
  }
];

export const DEMO_ORDERS: MarketplaceOrder[] = [
  {
    id: 'ord_ng_98214',
    auctionId: 'mprod_past_1',
    productId: 'mprod_1',
    productTitle: 'Samsung Galaxy S24 Ultra (512GB, Titanium Black)',
    productImage: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1000&q=80',
    buyerId: 'u_buyer_demo',
    buyerName: 'Umoh Parry (You)',
    buyerPhoneMasked: '+234 803 **** 891',
    sellerId: 'seller_ikeja_hub',
    sellerName: 'Ikeja Gadget Hub Ltd',
    sellerLocation: 'Ikeja, Lagos',
    hammerPrice: 890000,
    deliveryFee: 3500,
    protectionFee: 13350, // 1.5%
    totalPaid: 906850,
    platformCommission: 67750, // 7.5% + fixed fee
    sellerPayoutAmount: 822250,
    status: 'buyer_inspection',
    paymentStatus: 'paid',
    deliveryStatus: 'delivered',
    trackingNumber: 'GIG-NG-8890214',
    deliveryAddress: 'Plot 12 Lekki Phase 1, Lagos State',
    courierProvider: 'GIG Logistics Express',
    paymentDeadline: new Date(Date.now() - 3600000 * 24).toISOString(),
    inspectionDeadline: new Date(Date.now() + 3600000 * 18).toISOString(), // 18 hrs left to inspect
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    paidAt: new Date(Date.now() - 3600000 * 46).toISOString(),
    deliveredAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'ord_ng_98215',
    auctionId: 'mprod_past_2',
    productId: 'mprod_3',
    productTitle: 'HP Omen 16 Gaming Laptop (Ryzen 7, RTX 4060, 16GB)',
    productImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80',
    buyerId: 'u_buyer_demo',
    buyerName: 'Umoh Parry (You)',
    buyerPhoneMasked: '+234 803 **** 891',
    sellerId: 'seller_abuja_tech',
    sellerName: 'Abuja Tech Pavilion',
    sellerLocation: 'Wuse 2, Abuja',
    hammerPrice: 650000,
    deliveryFee: 4500,
    protectionFee: 9750,
    totalPaid: 664250,
    platformCommission: 49750,
    sellerPayoutAmount: 600250,
    status: 'in_transit',
    paymentStatus: 'paid',
    deliveryStatus: 'in_transit',
    trackingNumber: 'DHL-ABJ-334910',
    deliveryAddress: 'Victoria Island, Lagos State',
    courierProvider: 'DHL Express Nigeria',
    paymentDeadline: new Date(Date.now() - 3600000 * 30).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 32).toISOString(),
    paidAt: new Date(Date.now() - 3600000 * 31).toISOString()
  }
];

export const DEMO_DISPUTES: MarketplaceDispute[] = [
  {
    id: 'disp_001',
    orderId: 'ord_ng_98214',
    productTitle: 'Samsung Galaxy S24 Ultra',
    openedBy: 'buyer',
    openerName: 'Tunde Adebayo',
    reason: 'significantly_not_as_described',
    description: 'Received 256GB storage variant instead of the advertised 512GB lot. IMEI verified on receipt matches shipping manifest, but storage is lower than declared.',
    evidence: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80'
    ],
    status: 'under_review',
    adminDecision: 'Seller offered ₦60,000 partial refund or full return for refund. Awaiting buyer confirmation.',
    refundAmount: 60000,
    sellerPayoutAmount: 762250,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export const DEMO_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log_01',
    userId: 'admin_sys',
    action: 'PRODUCT_VERIFICATION_APPROVED',
    entityType: 'Product',
    entityId: 'mprod_1',
    oldValue: 'pending_review',
    newValue: 'verified',
    timestamp: new Date(Date.now() - 3600000 * 25).toISOString(),
    ipMetadata: '197.210.65.12 (Lagos, NG)'
  },
  {
    id: 'log_02',
    userId: 'bidder_A82F',
    action: 'BID_PLACED_ATOMIC',
    entityType: 'Auction',
    entityId: 'mprod_1',
    oldValue: '₦1,260,000',
    newValue: '₦1,280,000',
    timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    ipMetadata: '102.89.34.88 (Abuja, NG)'
  },
  {
    id: 'log_03',
    userId: 'system_engine',
    action: 'ANTI_SNIPING_EXTENSION_APPLIED',
    entityType: 'Auction',
    entityId: 'mprod_2',
    oldValue: '+0 mins',
    newValue: '+2 mins extension',
    timestamp: new Date(Date.now() - 3600000 * 0.4).toISOString(),
    ipMetadata: 'Server Cron Engine (UTC)'
  }
];
