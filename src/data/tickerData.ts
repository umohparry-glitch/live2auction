export interface RecentSuccessfulBid {
  id: string;
  productTitle: string;
  category: string;
  categoryIcon: string;
  finalBid: number;
  marketPrice: number;
  discountPercentage: number;
  winnerName: string;
  location: string;
  timestamp: string;
  timeAgo: string;
  verifiedEscrow: boolean;
  type: 'live_room' | 'timed_auction';
}

export const INITIAL_RECENT_BIDS: RecentSuccessfulBid[] = [
  {
    id: 'sb_1',
    productTitle: 'Apple iPhone 15 Pro Max (256GB - Natural Titanium)',
    category: 'Phones & Tablets',
    categoryIcon: '📱',
    finalBid: 1280000,
    marketPrice: 1750000,
    discountPercentage: 27,
    winnerName: 'Chinedu_K',
    location: 'Lekki, Lagos',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    timeAgo: '4m ago',
    verifiedEscrow: true,
    type: 'live_room'
  },
  {
    id: 'sb_2',
    productTitle: 'Sony PlayStation 5 Slim (1TB Disc Edition + 2 Controllers)',
    category: 'Gaming & Consoles',
    categoryIcon: '🎮',
    finalBid: 560000,
    marketPrice: 820000,
    discountPercentage: 32,
    winnerName: 'EmekaGamer99',
    location: 'Wuse 2, Abuja',
    timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    timeAgo: '9m ago',
    verifiedEscrow: true,
    type: 'timed_auction'
  },
  {
    id: 'sb_3',
    productTitle: 'Felicity Solar 5kVA 48V Hybrid Inverter + 5kWh Lithium',
    category: 'Solar & Energy',
    categoryIcon: '☀️',
    finalBid: 2450000,
    marketPrice: 3200000,
    discountPercentage: 23,
    winnerName: 'Engr_Folabi',
    location: 'Ikeja, Lagos',
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    timeAgo: '14m ago',
    verifiedEscrow: true,
    type: 'live_room'
  },
  {
    id: 'sb_4',
    productTitle: 'Apple MacBook Pro 16" (M3 Pro 18-Core GPU, 36GB RAM, 512GB)',
    category: 'Laptops & Computers',
    categoryIcon: '💻',
    finalBid: 2150000,
    marketPrice: 2850000,
    discountPercentage: 25,
    winnerName: 'BlessingTech',
    location: 'Victoria Island, Lagos',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    timeAgo: '18m ago',
    verifiedEscrow: true,
    type: 'timed_auction'
  },
  {
    id: 'sb_5',
    productTitle: 'Starlink Standard Kit Gen 3 (High-Speed Low Latency Satellite)',
    category: 'Smart Home & IoT',
    categoryIcon: '🛰️',
    finalBid: 490000,
    marketPrice: 720000,
    discountPercentage: 32,
    winnerName: 'PH_Consultant',
    location: 'GRA, Port Harcourt',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    timeAgo: '25m ago',
    verifiedEscrow: true,
    type: 'live_room'
  },
  {
    id: 'sb_6',
    productTitle: 'JBL PartyBox 310 (240W Portable Bluetooth Speaker with Lightshow)',
    category: 'Audio & Sound',
    categoryIcon: '🔊',
    finalBid: 420000,
    marketPrice: 580000,
    discountPercentage: 28,
    winnerName: 'DJ_Kaycee',
    location: 'Surulere, Lagos',
    timestamp: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
    timeAgo: '31m ago',
    verifiedEscrow: true,
    type: 'timed_auction'
  },
  {
    id: 'sb_7',
    productTitle: 'Sony Alpha A7 IV Full-Frame Mirrorless + 28-70mm Lens Kit',
    category: 'Cameras & Optics',
    categoryIcon: '📷',
    finalBid: 1680000,
    marketPrice: 2250000,
    discountPercentage: 25,
    winnerName: 'LagosStudioHQ',
    location: 'Yaba, Lagos',
    timestamp: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    timeAgo: '38m ago',
    verifiedEscrow: true,
    type: 'live_room'
  },
  {
    id: 'sb_8',
    productTitle: 'Mikano 15kVA Soundproof Diesel Generator (Low Hours)',
    category: 'Generators & Power',
    categoryIcon: '⚡',
    finalBid: 3600000,
    marketPrice: 4800000,
    discountPercentage: 25,
    winnerName: 'Alhaji_Bello',
    location: 'Kano Municipal, Kano',
    timestamp: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
    timeAgo: '44m ago',
    verifiedEscrow: true,
    type: 'timed_auction'
  },
  {
    id: 'sb_9',
    productTitle: 'Tag Heuer Aquaracer Professional 300 (Automatic Blue Dial)',
    category: 'Watches & Luxury',
    categoryIcon: '⌚',
    finalBid: 1850000,
    marketPrice: 2600000,
    discountPercentage: 29,
    winnerName: 'Barrister_Tunde',
    location: 'Ikoyi, Lagos',
    timestamp: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    timeAgo: '52m ago',
    verifiedEscrow: true,
    type: 'live_room'
  },
  {
    id: 'sb_10',
    productTitle: 'Samsung 65" QLED 4K Smart TV with Dolby Atmos',
    category: 'TV & Home Theatre',
    categoryIcon: '📺',
    finalBid: 780000,
    marketPrice: 1050000,
    discountPercentage: 26,
    winnerName: 'Mrs_Adeyemi',
    location: 'Bodija, Ibadan',
    timestamp: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
    timeAgo: '59m ago',
    verifiedEscrow: true,
    type: 'timed_auction'
  },
  {
    id: 'sb_11',
    productTitle: '2016 Lexus RX350 AWD (Direct Tokunbo, Customs Paid)',
    category: 'Vehicles & Autos',
    categoryIcon: '🚗',
    finalBid: 14800000,
    marketPrice: 18500000,
    discountPercentage: 20,
    winnerName: 'Chief_Okafor',
    location: 'Enugu Urban, Enugu',
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    timeAgo: '1h ago',
    verifiedEscrow: true,
    type: 'timed_auction'
  },
  {
    id: 'sb_12',
    productTitle: 'Haier Thermocool 350L Turbo Deep Chest Freezer',
    category: 'Home Appliances',
    categoryIcon: '❄️',
    finalBid: 325000,
    marketPrice: 470000,
    discountPercentage: 31,
    winnerName: 'MamaChidera',
    location: 'Alaba, Lagos',
    timestamp: new Date(Date.now() - 92 * 60 * 1000).toISOString(),
    timeAgo: '1h ago',
    verifiedEscrow: true,
    type: 'timed_auction'
  }
];
