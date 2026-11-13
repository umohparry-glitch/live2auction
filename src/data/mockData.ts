import { AuctionProduct, LiveAuctionEvent, UserNotification, FraudAlert } from '../types';

export const INITIAL_PRODUCTS: AuctionProduct[] = [
  {
    id: 'prod_1',
    title: 'Apple iPhone 15 (128GB, Blue)',
    category: 'Smartphones',
    condition: 'Brand New',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80'
    ],
    startingPrice: 450000,
    currentBid: 520000,
    bidIncrement: 5000,
    reservePrice: 480000,
    estimatedMarketValue: 720000,
    seller: {
      name: 'Ikeja Gadget Hub Ltd',
      location: 'Otigba Street, Computer Village, Ikeja, Lagos',
      verified: true,
      rating: 4.9
    },
    durationSeconds: 84,
    remainingSeconds: 84,
    status: 'active',
    bidsCount: 42,
    description: 'Factory sealed US model Apple iPhone 15 with 1 Year Apple Care warranty, 100% genuine IMEI, active network unlock.',
    specs: ['128GB Storage', 'A16 Bionic Chip', '48MP Main Camera', 'Dynamic Island', 'USB-C Port'],
    deliveryInfo: {
      shipsFrom: 'Ikeja, Lagos',
      dispatchTime: 'Same Day Dispatch in Lagos (2-4 hrs)',
      lagosAbujaFee: 3500,
      nationwideFee: 6500
    },
    extensionCount: 0,
    maxExtensions: 5
  },
  {
    id: 'prod_2',
    title: 'Samsung Galaxy S24 Ultra (512GB, Titanium Gray)',
    category: 'Smartphones',
    condition: 'Brand New',
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1000&q=80'
    ],
    startingPrice: 850000,
    currentBid: 850000,
    bidIncrement: 10000,
    reservePrice: 900000,
    estimatedMarketValue: 1350000,
    seller: {
      name: 'Abuja Tech Pavilion',
      location: 'Wuse 2, Abuja FCT',
      verified: true,
      rating: 4.8
    },
    durationSeconds: 90,
    remainingSeconds: 90,
    status: 'queued',
    bidsCount: 0,
    description: 'Brand new Samsung S24 Ultra with Galaxy AI, S-Pen included, Snapdragon 8 Gen 3 for Galaxy, Dual SIM.',
    specs: ['512GB Storage', '12GB RAM', '200MP Quad Telephoto', '5000mAh Battery', 'Titanium Frame'],
    deliveryInfo: {
      shipsFrom: 'Wuse 2, Abuja',
      dispatchTime: 'Next Day Delivery',
      lagosAbujaFee: 4000,
      nationwideFee: 7000
    },
    extensionCount: 0,
    maxExtensions: 5
  },
  {
    id: 'prod_3',
    title: 'Sony PlayStation 5 Slim Digital Console',
    category: 'Gaming',
    condition: 'Brand New',
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80'
    ],
    startingPrice: 500000,
    currentBid: 500000,
    bidIncrement: 5000,
    reservePrice: 550000,
    estimatedMarketValue: 780000,
    seller: {
      name: 'GameCity Alaba Direct',
      location: 'Alaba International Market, Ojo, Lagos',
      verified: true,
      rating: 4.9
    },
    durationSeconds: 90,
    remainingSeconds: 90,
    status: 'queued',
    bidsCount: 0,
    description: 'PlayStation 5 Slim 1TB SSD Digital Edition with DualSense wireless controller, HDMI 2.1 cable and Astro Playroom pre-installed.',
    specs: ['1TB Custom NVMe SSD', 'Ultra-high speed I/O', 'Ray Tracing support', 'Tempest 3D AudioTech'],
    deliveryInfo: {
      shipsFrom: 'Alaba, Lagos',
      dispatchTime: '24-48 Hours',
      lagosAbujaFee: 4500,
      nationwideFee: 8000
    },
    extensionCount: 0,
    maxExtensions: 5
  },
  {
    id: 'prod_4',
    title: 'HP EliteBook 840 G8 (Core i7 11th Gen, 16GB, 512GB SSD)',
    category: 'Computers & Laptops',
    condition: 'Open Box',
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80'
    ],
    startingPrice: 380000,
    currentBid: 380000,
    bidIncrement: 5000,
    reservePrice: 400000,
    estimatedMarketValue: 560000,
    seller: {
      name: 'Benchmark Systems NG',
      location: 'Medical Road, Ikeja, Lagos',
      verified: true,
      rating: 4.7
    },
    durationSeconds: 90,
    remainingSeconds: 90,
    status: 'queued',
    bidsCount: 0,
    description: 'Clean Grade A+ executive business laptop with Bang & Olufsen audio, backlit keyboard, fingerprint reader and 8-hour battery.',
    specs: ['Intel Core i7-1165G7', '16GB DDR4 RAM', '512GB PCIe NVMe SSD', '14" FHD IPS Anti-Glare'],
    deliveryInfo: {
      shipsFrom: 'Ikeja, Lagos',
      dispatchTime: 'Immediate Dispatch',
      lagosAbujaFee: 3000,
      nationwideFee: 6000
    },
    extensionCount: 0,
    maxExtensions: 5
  },
  {
    id: 'prod_5',
    title: 'LG 55" 4K UHD Smart AI ThinQ TV (2024 Model)',
    category: 'Electronics',
    condition: 'Brand New',
    images: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80'
    ],
    startingPrice: 420000,
    currentBid: 420000,
    bidIncrement: 5000,
    reservePrice: 450000,
    estimatedMarketValue: 640000,
    seller: {
      name: 'Fouani Electronics Outlet Partner',
      location: 'Victoria Island, Lagos',
      verified: true,
      rating: 5.0
    },
    durationSeconds: 90,
    remainingSeconds: 90,
    status: 'queued',
    bidsCount: 0,
    description: 'Genuine LG 55-inch real 4K screen with Magic Remote, webOS 24, HDR10 Pro, Game Optimizer and Bluetooth Surround ready.',
    specs: ['55" 4K (3840 x 2160)', 'α5 Gen6 AI Processor', 'WebOS with AirPlay 2', '20W Dolby Sound'],
    deliveryInfo: {
      shipsFrom: 'VI, Lagos',
      dispatchTime: 'Special Handled Cargo (1-2 Days)',
      lagosAbujaFee: 7500,
      nationwideFee: 14000
    },
    extensionCount: 0,
    maxExtensions: 5
  },
  {
    id: 'prod_6',
    title: 'EcoFlow Delta 2 Solar Power Station (1024Wh LFP + 220W Solar)',
    category: 'Solar & Power',
    condition: 'Brand New',
    images: [
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1000&q=80'
    ],
    startingPrice: 680000,
    currentBid: 680000,
    bidIncrement: 10000,
    reservePrice: 750000,
    estimatedMarketValue: 1100000,
    seller: {
      name: 'SolarNaija Direct Energy',
      location: 'Lekki Phase 1, Lagos',
      verified: true,
      rating: 4.9
    },
    durationSeconds: 90,
    remainingSeconds: 90,
    status: 'queued',
    bidsCount: 0,
    description: 'Perfect for Nigerian power backup. Fast charging 0-80% in 50 minutes. Powers inverter ACs, refrigerators, laptops, and TV.',
    specs: ['1024Wh LiFePO4 Battery (3000+ cycles)', '1800W AC Output (2700W Surge)', '220W Bifacial Solar Panel'],
    deliveryInfo: {
      shipsFrom: 'Lekki, Lagos',
      dispatchTime: 'Heavy Cargo Delivery (24 hrs)',
      lagosAbujaFee: 6000,
      nationwideFee: 12000
    },
    extensionCount: 0,
    maxExtensions: 5
  }
];

export const DEMO_LIVE_EVENT: LiveAuctionEvent = {
  id: 'event_saturday_mega',
  title: '🔴 SATURDAY MEGA AUCTION (Lagos & Abuja Deals)',
  description: 'Nigeria’s premier live bidding event! Featuring flagship phones, gaming consoles, laptops, and home solar power stations at unbeatable starting prices.',
  banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
  eventType: 'weekly',
  startTime: '12:00 PM',
  endTime: '08:00 PM',
  status: 'live',
  hostName: 'Chidi Okafor (The Auction King)',
  hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  totalProducts: 25,
  currentProductIndex: 0,
  viewerCount: 2482,
  activeBiddersCount: 137,
  totalBidsPlaced: 184,
  totalSalesVolume: 4850000,
  energyLevel: 'HOT',
  sponsor: {
    name: 'Paystack Verified Escrow',
    banner: 'Secure Nigerian Bank & Card Escrow Protection',
    tagline: 'Funds held securely until item is verified & delivered.'
  }
};

export const UPCOMING_EVENTS: LiveAuctionEvent[] = [
  {
    id: 'event_phone_deal_day',
    title: '🔥 PHONE DEAL DAY (iPhone & Flagship Androids)',
    description: 'Exclusive 4-hour live blitz of brand new iPhones, Samsung Galaxy, and Google Pixels straight from accredited Computer Village distributors.',
    banner: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    eventType: 'special_event',
    startTime: 'Today 04:00 PM',
    endTime: 'Today 08:00 PM',
    status: 'scheduled',
    hostName: 'Amina Bello (TechBoutique)',
    totalProducts: 18,
    currentProductIndex: 0,
    viewerCount: 890,
    activeBiddersCount: 64,
    totalBidsPlaced: 0,
    totalSalesVolume: 0,
    energyLevel: 'MEDIUM'
  },
  {
    id: 'event_solar_power_clearance',
    title: '⚡ NIGERIA SOLAR & POWER CLEARANCE',
    description: 'Inverters, lithium battery banks, portable power stations, and solar panels with guaranteed local manufacturer warranties.',
    banner: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    eventType: 'daily',
    startTime: 'Tomorrow 10:00 AM',
    endTime: 'Tomorrow 02:00 PM',
    status: 'scheduled',
    hostName: 'Engr. Tunde Adeleke',
    totalProducts: 30,
    currentProductIndex: 0,
    viewerCount: 1420,
    activeBiddersCount: 92,
    totalBidsPlaced: 0,
    totalSalesVolume: 0,
    energyLevel: 'MEDIUM'
  },
  {
    id: 'event_black_friday_mega',
    title: '🔥 BLACK FRIDAY SUPER AUCTION',
    description: 'The largest electronics, fashion, and gadget auction of the season with starting prices starting as low as ₦10,000!',
    banner: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
    eventType: 'special_event',
    startTime: 'Friday 09:00 AM',
    endTime: 'Friday 10:00 PM',
    status: 'scheduled',
    hostName: 'Live Auctioneer Collective',
    totalProducts: 150,
    currentProductIndex: 0,
    viewerCount: 5600,
    activeBiddersCount: 310,
    totalBidsPlaced: 0,
    totalSalesVolume: 0,
    energyLevel: 'EXTREME'
  }
];

export const INITIAL_CHAT_MESSAGES = [
  {
    id: 'msg_1',
    senderId: 'usr_mod',
    senderNickname: 'System Mod 🛡️',
    text: 'Welcome to Saturday Mega Auction! All bids are binding. 100% Escrow Protection enabled.',
    timestamp: '12:01 PM',
    isModerator: true,
    pinned: true
  },
  {
    id: 'msg_2',
    senderId: 'usr_deal',
    senderNickname: 'DealHunter_NG',
    text: 'Is this iPhone 15 dual physical SIM or eSIM?',
    timestamp: '12:02 PM'
  },
  {
    id: 'msg_3',
    senderId: 'usr_host',
    senderNickname: 'Auctioneer Chidi 🎙️',
    text: 'US Model with active eSIM support! Genuine sealed box directly from Otigba Street.',
    timestamp: '12:02 PM',
    isHost: true
  },
  {
    id: 'msg_4',
    senderId: 'usr_abuja',
    senderNickname: 'AbujaBuyer_99',
    text: 'How much is delivery to Gwarinpa, Abuja?',
    timestamp: '12:03 PM'
  },
  {
    id: 'msg_5',
    senderId: 'usr_gadget',
    senderNickname: 'GadgetFanatic',
    text: '₦3,500 standard delivery or next day express. Nice starting bid on this!',
    timestamp: '12:03 PM'
  },
  {
    id: 'msg_6',
    senderId: 'usr_lagos',
    senderNickname: 'LagosTrader',
    text: 'Watching closely... ready to bid in the final seconds! 🔥',
    timestamp: '12:04 PM'
  }
];

export const INITIAL_FRAUD_ALERTS: FraudAlert[] = [
  {
    id: 'frd_1',
    bidderId: 'usr_bad_99',
    maskedBidder: 'Bidder_291',
    riskLevel: 'HIGH',
    reason: 'Rapid 12 bids placed across 2 products with 3 historical failed checkout completions and suspected multi-account IP.',
    timestamp: '12:04 PM',
    actionTaken: 'restricted'
  },
  {
    id: 'frd_2',
    bidderId: 'usr_mid_14',
    maskedBidder: 'Bidder_014',
    riskLevel: 'MEDIUM',
    reason: 'Unusual bid jump from ₦450,000 directly to ₦700,000 within 2 seconds.',
    timestamp: '12:02 PM',
    actionTaken: 'cleared'
  }
];

export const INITIAL_NOTIFICATIONS: UserNotification[] = [
  {
    id: 'notif_1',
    title: 'Saturday Mega Auction is LIVE',
    message: 'The Saturday Mega Auction has begun! iPhone 15 is on the live stage right now.',
    timestamp: '12:00 PM',
    read: false,
    type: 'system'
  },
  {
    id: 'notif_2',
    title: 'Reminder Set: Phone Deal Day',
    message: 'You asked to be reminded 10 minutes before Phone Deal Day begins at 4:00 PM.',
    timestamp: '11:30 AM',
    read: true,
    type: 'reminder',
    productTitle: 'Phone Deal Day'
  }
];

export const TODAY_SCHEDULE = [
  { time: '10:00 AM', category: 'Smartphones & Tablets', title: 'Flagship Mobile Hour', productsCount: 12, status: 'Completed' },
  { time: '12:00 PM', category: 'Mega Mix', title: 'Saturday Mega Auction (Live Now)', productsCount: 25, status: 'LIVE' },
  { time: '02:00 PM', category: 'Electronics & Audio', title: 'Hi-Fi Sound & 4K Home TVs', productsCount: 16, status: 'Upcoming' },
  { time: '04:00 PM', category: 'Gaming & Computing', title: 'PS5 & RTX Gaming Laptop Blitz', productsCount: 14, status: 'Upcoming' },
  { time: '06:00 PM', category: 'Solar & Inverters', title: 'Clean Energy & Inverter Specials', productsCount: 20, status: 'Upcoming' },
  { time: '08:00 PM', category: 'Late Night Deals', title: 'Flash Liquidation Auction', productsCount: 15, status: 'Upcoming' }
];

export const WEEKLY_CALENDAR = [
  { day: 'Monday', title: 'Office & Business Tech Liquidation', time: '12:00 PM - 04:00 PM', items: 35, banner: '💼 Corporate Assets' },
  { day: 'Tuesday', title: 'Appliance & Home Essentials', time: '01:00 PM - 05:00 PM', items: 28, banner: '🏠 Home Appliances' },
  { day: 'Wednesday', title: 'Mid-Week Mobile Madness', time: '02:00 PM - 06:00 PM', items: 40, banner: '📱 Smartphones' },
  { day: 'Thursday', title: 'Automotive & Generator Spares', time: '11:00 AM - 03:00 PM', items: 25, banner: '⚡ Power & Autos' },
  { day: 'Friday', title: 'Friday Deal Day Marathon', time: '09:00 AM - 10:00 PM', items: 150, banner: '🔥 150 Product Marathon' },
  { day: 'Saturday', title: 'Saturday Mega Auction (Live)', time: '12:00 PM - 08:00 PM', items: 50, banner: '🔴 Featured Weekly Showcase' },
  { day: 'Sunday', title: 'Luxury Watches & Premium Lifestyle', time: '03:00 PM - 07:00 PM', items: 22, banner: '💎 Premium Curated' }
];

export const SAMPLE_TEXT_FILE_CONTENT = `# NIGERIAN LIVE AUCTION PRODUCT QUEUE
# Format: Title | Starting Price | Bid Increment | Category | Condition | Est Market Value | Location
Apple MacBook Air M2 256GB Midnight | 850000 | 10000 | Computers | Brand New | 1250000 | Ikeja, Lagos
Sony WH-1000XM5 Wireless Headphones | 280000 | 5000 | Audio | Brand New | 420000 | Victoria Island, Lagos
DJI Mini 3 Pro Drone with Fly More Kit | 620000 | 10000 | Photography | Open Box | 890000 | Wuse 2, Abuja
Oral-B iO Series 9 Electric Toothbrush | 85000 | 2000 | Lifestyle | Brand New | 145000 | Lekki, Lagos
Starlink Standard Gen 3 Satellite Kit | 480000 | 5000 | Networking | Brand New | 650000 | Port Harcourt, Rivers
JBL PartyBox 310 Portable Bluetooth Speaker | 490000 | 5000 | Audio | Brand New | 720000 | Alaba, Lagos
`;
