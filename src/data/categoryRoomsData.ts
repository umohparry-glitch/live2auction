import { CategoryLiveRoom, AuctionSlot, AuctionProduct } from '../types';

export const INITIAL_CATEGORY_ROOMS: CategoryLiveRoom[] = [
  {
    id: 'room_phones',
    categoryId: 'Phones',
    categoryName: 'Phones & Tablets',
    icon: '📱',
    slug: 'phones',
    title: 'Phones & Tablets Live Arena',
    description: 'Direct live bidding on factory sealed and open box iPhones, Samsung Galaxy flagships, and Google Pixels with IMEI verification.',
    banner: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    hostName: 'Chidi Okafor (The Auction King)',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    viewerCount: 3240,
    activeBiddersCount: 186,
    status: 'live',
    energyLevel: 'HOT',
    activeSlotId: 'slot_phones_a',
    sponsor: {
      name: 'Computer Village Accredited',
      banner: '100% Genuine IMEI & 1-Year Warranty',
      tagline: 'All devices verified on-site in Ikeja before dispatch.'
    },
    slots: [
      {
        id: 'slot_phones_a',
        code: 'Slot A',
        name: 'Morning Flash Deals & Flagships',
        targetItemCount: 200, // 200 live auction items for today
        scheduledStartTime: '09:00 AM',
        scheduledEndTime: '01:00 PM',
        status: 'active',
        activeProductIndex: 0,
        completedItemsCount: 42,
        totalSalesVolume: 24500000,
        totalBidsPlaced: 618,
        products: [
          {
            id: 'phone_1',
            title: 'Apple iPhone 15 Pro Max (256GB, Natural Titanium)',
            category: 'Phones & Tablets',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
              'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 1100000,
            currentBid: 1280000,
            bidIncrement: 10000,
            reservePrice: 1200000,
            estimatedMarketValue: 1750000,
            seller: {
              name: 'Ikeja Gadget Hub Ltd',
              location: 'Otigba Street, Computer Village, Ikeja, Lagos',
              verified: true,
              rating: 4.9
            },
            durationSeconds: 90,
            remainingSeconds: 78,
            status: 'active',
            bidsCount: 38,
            description: 'Factory sealed US model iPhone 15 Pro Max in Natural Titanium with 1 Year Apple Care. Active dual eSIM, 100% battery health.',
            specs: ['256GB NVMe', 'A17 Pro 3nm Chip', 'Titanium Frame with Action Button', '5x Optical Telephoto', 'USB-C 3.0 (10Gbps)'],
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
            id: 'phone_2',
            title: 'Samsung Galaxy S24 Ultra (512GB, Titanium Violet)',
            category: 'Phones & Tablets',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 1050000,
            currentBid: 1050000,
            bidIncrement: 10000,
            reservePrice: 1150000,
            estimatedMarketValue: 1600000,
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
            description: 'Samsung S24 Ultra featuring integrated S-Pen, Galaxy AI live translate, Snapdragon 8 Gen 3 for Galaxy, and Gorilla Armor anti-reflective glass.',
            specs: ['512GB UFS 4.0', '12GB LPDDR5X RAM', '200MP Quad Camera System', '5000mAh Battery', '7 Years OS Updates'],
            deliveryInfo: {
              shipsFrom: 'Wuse 2, Abuja',
              dispatchTime: 'Next Day Express Dispatch',
              lagosAbujaFee: 4000,
              nationwideFee: 7000
            },
            extensionCount: 0,
            maxExtensions: 5
          },
          {
            id: 'phone_3',
            title: 'Google Pixel 8 Pro (128GB, Bay Blue)',
            category: 'Phones & Tablets',
            condition: 'Open Box',
            images: [
              'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 580000,
            currentBid: 580000,
            bidIncrement: 5000,
            reservePrice: 620000,
            estimatedMarketValue: 850000,
            seller: {
              name: 'PixelDirect West Africa',
              location: 'Victoria Island, Lagos',
              verified: true,
              rating: 4.9
            },
            durationSeconds: 90,
            remainingSeconds: 90,
            status: 'queued',
            bidsCount: 0,
            description: 'Grade A+ Pristine Pixel 8 Pro. Tensor G3 with Google AI Magic Editor, Best Take, Temperature Sensor, and 120Hz LTPO OLED.',
            specs: ['128GB Storage', '12GB RAM', 'Google Tensor G3', '50MP + 48MP + 48MP Cameras', 'Bay Blue Matte Finish'],
            deliveryInfo: {
              shipsFrom: 'VI, Lagos',
              dispatchTime: 'Same Day Dispatch',
              lagosAbujaFee: 3500,
              nationwideFee: 6000
            },
            extensionCount: 0,
            maxExtensions: 5
          }
        ]
      },
      {
        id: 'slot_phones_b',
        code: 'Slot B',
        name: 'Afternoon Pro Series & Mid-Range Stars',
        targetItemCount: 350, // 350 items for today
        scheduledStartTime: '01:30 PM',
        scheduledEndTime: '06:00 PM',
        status: 'upcoming',
        activeProductIndex: 0,
        completedItemsCount: 0,
        totalSalesVolume: 0,
        totalBidsPlaced: 0,
        products: [
          {
            id: 'phone_slot_b_1',
            title: 'Apple iPad Pro 12.9" M2 (256GB Wi-Fi + Cellular, Space Gray)',
            category: 'Phones & Tablets',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 880000,
            currentBid: 880000,
            bidIncrement: 10000,
            reservePrice: 950000,
            estimatedMarketValue: 1350000,
            seller: {
              name: 'iStore Hub Victoria Island',
              location: 'Adetokunbo Ademola, VI, Lagos',
              verified: true,
              rating: 4.9
            },
            durationSeconds: 90,
            remainingSeconds: 90,
            status: 'queued',
            bidsCount: 0,
            description: 'Liquid Retina XDR Mini-LED display with ProMotion 120Hz. Apple M2 processor with 8-core CPU and 10-core GPU. Apple Pencil 2 hover support.',
            specs: ['12.9" Liquid Retina XDR', '256GB Storage', 'Apple M2 Silicon', '5G Cellular Nano-SIM + eSIM'],
            deliveryInfo: {
              shipsFrom: 'VI, Lagos',
              dispatchTime: 'Same Day Dispatch',
              lagosAbujaFee: 4000,
              nationwideFee: 7000
            },
            extensionCount: 0,
            maxExtensions: 5
          },
          {
            id: 'phone_slot_b_2',
            title: 'OnePlus 12 (512GB, Silky Black - Snapdragon 8 Gen 3)',
            category: 'Phones & Tablets',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 650000,
            currentBid: 650000,
            bidIncrement: 5000,
            reservePrice: 700000,
            estimatedMarketValue: 920000,
            seller: {
              name: 'Benchmark Mobile NG',
              location: 'Medical Road, Ikeja, Lagos',
              verified: true,
              rating: 4.8
            },
            durationSeconds: 90,
            remainingSeconds: 90,
            status: 'queued',
            bidsCount: 0,
            description: 'Ultra flagship specs with 4th Gen Hasselblad Camera, 100W SUPERVOOC charging (charges in 26 mins), and 5400mAh battery.',
            specs: ['512GB Storage', '16GB RAM', '100W Fast Charger in Box', 'Hasselblad Triple Camera'],
            deliveryInfo: {
              shipsFrom: 'Ikeja, Lagos',
              dispatchTime: 'Immediate Dispatch',
              lagosAbujaFee: 3500,
              nationwideFee: 6500
            },
            extensionCount: 0,
            maxExtensions: 5
          }
        ]
      },
      {
        id: 'slot_phones_c',
        code: 'Slot C',
        name: 'Evening Clearance & Tokunbo Graded Lots',
        targetItemCount: 150, // 150 items for today
        scheduledStartTime: '06:30 PM',
        scheduledEndTime: '10:30 PM',
        status: 'upcoming',
        activeProductIndex: 0,
        completedItemsCount: 0,
        totalSalesVolume: 0,
        totalBidsPlaced: 0,
        products: [
          {
            id: 'phone_slot_c_1',
            title: 'Apple iPhone 13 (128GB, Midnight - Grade A UK Used)',
            category: 'Phones & Tablets',
            condition: 'Fairly Used',
            images: [
              'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 320000,
            currentBid: 320000,
            bidIncrement: 5000,
            reservePrice: 350000,
            estimatedMarketValue: 480000,
            seller: {
              name: 'Lagos Island Gadgets Co',
              location: 'Broad Street, Marina, Lagos',
              verified: true,
              rating: 4.7
            },
            durationSeconds: 90,
            remainingSeconds: 90,
            status: 'queued',
            bidsCount: 0,
            description: 'Direct UK Grade A tokunbo phone with 91% battery health, original OLED screen, FaceID fully functional with receipt and 60-day warranty.',
            specs: ['128GB Storage', 'Face ID 100% OK', '91% Battery Health', 'Dual SIM (Nano + eSIM)'],
            deliveryInfo: {
              shipsFrom: 'Marina, Lagos',
              dispatchTime: '24 Hours',
              lagosAbujaFee: 3000,
              nationwideFee: 5500
            },
            extensionCount: 0,
            maxExtensions: 5
          }
        ]
      }
    ]
  },
  {
    id: 'room_laptops',
    categoryId: 'Laptops',
    categoryName: 'Laptops & Computers',
    icon: '💻',
    slug: 'laptops',
    title: 'Laptops & Computing Live Room',
    description: 'Executive MacBooks, HP EliteBooks, Dell XPS, and ThinkPads verified with battery diagnostic reports.',
    banner: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    hostName: 'Blessing TechQueen',
    hostAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    viewerCount: 2180,
    activeBiddersCount: 114,
    status: 'live',
    energyLevel: 'HOT',
    activeSlotId: 'slot_laptops_a',
    sponsor: {
      name: 'Benchmark Certified Refurbish',
      banner: 'Grade A+ Corporate Systems with 90-Day Escrow Warranty',
      tagline: 'Fresh thermal paste, diagnostics test report on every machine.'
    },
    slots: [
      {
        id: 'slot_laptops_a',
        code: 'Slot A',
        name: 'Morning Executive MacBooks & Ultrabooks',
        targetItemCount: 180, // 180 items for today
        scheduledStartTime: '09:30 AM',
        scheduledEndTime: '01:30 PM',
        status: 'active',
        activeProductIndex: 0,
        completedItemsCount: 31,
        totalSalesVolume: 38400000,
        totalBidsPlaced: 480,
        products: [
          {
            id: 'laptop_1',
            title: 'Apple MacBook Pro 16" (M3 Pro 18-Core GPU, 36GB RAM, 512GB SSD)',
            category: 'Laptops & Computers',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
              'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 1950000,
            currentBid: 2150000,
            bidIncrement: 25000,
            reservePrice: 2100000,
            estimatedMarketValue: 2850000,
            seller: {
              name: 'Victoria Island MacStation',
              location: 'Ahmadu Bello Way, VI, Lagos',
              verified: true,
              rating: 5.0
            },
            durationSeconds: 90,
            remainingSeconds: 82,
            status: 'active',
            bidsCount: 29,
            description: 'Factory sealed Space Black MacBook Pro 16. Liquid Retina XDR screen with 120Hz ProMotion, 22-hour battery life, MagSafe 3.',
            specs: ['Apple M3 Pro (12-Core CPU, 18-Core GPU)', '36GB Unified Memory', '512GB NVMe SSD', '16.2" Liquid Retina XDR', 'Space Black'],
            deliveryInfo: {
              shipsFrom: 'VI, Lagos',
              dispatchTime: 'Insured Armored Courier (Same Day)',
              lagosAbujaFee: 5000,
              nationwideFee: 9500
            },
            extensionCount: 0,
            maxExtensions: 5
          },
          {
            id: 'laptop_2',
            title: 'HP EliteBook 840 G10 (Core i7 13th Gen, 32GB RAM, 1TB SSD)',
            category: 'Laptops & Computers',
            condition: 'Open Box',
            images: [
              'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 620000,
            currentBid: 620000,
            bidIncrement: 10000,
            reservePrice: 650000,
            estimatedMarketValue: 880000,
            seller: {
              name: 'Corporate Systems Hub Ikeja',
              location: 'Computer Village, Ikeja, Lagos',
              verified: true,
              rating: 4.8
            },
            durationSeconds: 90,
            remainingSeconds: 90,
            status: 'queued',
            bidsCount: 0,
            description: 'Executive corporate machine in pristine condition. Intel Core i7-1355U, 32GB RAM, 1TB Gen4 SSD, Bang & Olufsen audio, backlit keyboard.',
            specs: ['Intel Core i7-1355U', '32GB DDR5 RAM', '1TB PCIe 4.0 SSD', '14" WUXGA Anti-Glare IPS', '5MP IR Camera for Windows Hello'],
            deliveryInfo: {
              shipsFrom: 'Ikeja, Lagos',
              dispatchTime: 'Same Day Dispatch',
              lagosAbujaFee: 3500,
              nationwideFee: 6500
            },
            extensionCount: 0,
            maxExtensions: 5
          }
        ]
      },
      {
        id: 'slot_laptops_b',
        code: 'Slot B',
        name: 'Afternoon Gaming Rigs & Mobile Workstations',
        targetItemCount: 240, // 240 items for today
        scheduledStartTime: '02:00 PM',
        scheduledEndTime: '06:30 PM',
        status: 'upcoming',
        activeProductIndex: 0,
        completedItemsCount: 0,
        totalSalesVolume: 0,
        totalBidsPlaced: 0,
        products: [
          {
            id: 'laptop_slot_b_1',
            title: 'ASUS ROG Zephyrus G16 (Intel Core Ultra 9, RTX 4080 12GB, 32GB, 2TB OLED)',
            category: 'Laptops & Computers',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 2400000,
            currentBid: 2400000,
            bidIncrement: 50000,
            reservePrice: 2600000,
            estimatedMarketValue: 3400000,
            seller: {
              name: 'Apex Gaming Systems Abuja',
              location: 'Maitama, Abuja FCT',
              verified: true,
              rating: 4.9
            },
            durationSeconds: 90,
            remainingSeconds: 90,
            status: 'queued',
            bidsCount: 0,
            description: 'Elite gaming and AI rendering laptop. 2.5K 240Hz ROG Nebula OLED display, CNC aluminum chassis, Vapor Chamber cooling.',
            specs: ['Intel Core Ultra 9 185H', 'NVIDIA GeForce RTX 4080 12GB', '32GB LPDDR5X RAM', '2TB PCIe 4.0 SSD'],
            deliveryInfo: {
              shipsFrom: 'Maitama, Abuja',
              dispatchTime: 'Same Day Delivery Abuja / Next Day Lagos',
              lagosAbujaFee: 5000,
              nationwideFee: 9500
            },
            extensionCount: 0,
            maxExtensions: 5
          }
        ]
      }
    ]
  },
  {
    id: 'room_gaming',
    categoryId: 'Gaming',
    categoryName: 'Gaming & Consoles',
    icon: '🎮',
    slug: 'gaming',
    title: 'Gaming & Consoles Live Arena',
    description: 'PlayStation 5 Slim, Xbox Series X, Nintendo Switch OLED, graphics cards, and gaming accessories direct from verified Alaba importers.',
    banner: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80',
    hostName: 'EmekaGamer (Level 99)',
    hostAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80',
    viewerCount: 2890,
    activeBiddersCount: 162,
    status: 'live',
    energyLevel: 'EXTREME',
    activeSlotId: 'slot_gaming_a',
    sponsor: {
      name: 'GameCity Alaba Direct Importers',
      banner: '100% Brand New Sealed Consoles with Local Nigerian Power Cord',
      tagline: 'Tested and verified HDMI 2.1 4K 120Hz output.'
    },
    slots: [
      {
        id: 'slot_gaming_a',
        code: 'Slot A',
        name: 'Morning Next-Gen Consoles & Bundles',
        targetItemCount: 150, // 150 items for today
        scheduledStartTime: '10:00 AM',
        scheduledEndTime: '02:00 PM',
        status: 'active',
        activeProductIndex: 0,
        completedItemsCount: 24,
        totalSalesVolume: 16800000,
        totalBidsPlaced: 342,
        products: [
          {
            id: 'gaming_1',
            title: 'Sony PlayStation 5 Slim (1TB Disc Edition + 2 Controllers + FC24)',
            category: 'Gaming & Consoles',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 480000,
            currentBid: 560000,
            bidIncrement: 5000,
            reservePrice: 520000,
            estimatedMarketValue: 820000,
            seller: {
              name: 'GameCity Alaba Direct',
              location: 'Alaba International Market, Ojo, Lagos',
              verified: true,
              rating: 4.9
            },
            durationSeconds: 90,
            remainingSeconds: 65,
            status: 'active',
            bidsCount: 31,
            description: 'Factory sealed PlayStation 5 Slim 1TB Disc Edition. Includes 2 White DualSense Wireless Controllers, EA Sports FC 24 disc, and HDMI 2.1 cable.',
            specs: ['1TB Custom High-Speed SSD', 'Ultra HD Blu-ray Disc Drive', '2x DualSense Controllers', 'Tempest 3D Audio'],
            deliveryInfo: {
              shipsFrom: 'Alaba, Lagos',
              dispatchTime: '24-48 Hours Insured Cargo',
              lagosAbujaFee: 4500,
              nationwideFee: 8000
            },
            extensionCount: 0,
            maxExtensions: 5
          },
          {
            id: 'gaming_2',
            title: 'Microsoft Xbox Series X (1TB Carbon Black + Game Pass Ultimate 3-Months)',
            category: 'Gaming & Consoles',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 520000,
            currentBid: 520000,
            bidIncrement: 5000,
            reservePrice: 550000,
            estimatedMarketValue: 790000,
            seller: {
              name: 'ConsoleKing Yaba',
              location: 'Commercial Avenue, Yaba, Lagos',
              verified: true,
              rating: 4.8
            },
            durationSeconds: 90,
            remainingSeconds: 90,
            status: 'queued',
            bidsCount: 0,
            description: 'True 4K Gaming with 12 Teraflops of raw graphic processing power. Quick Resume between multiple games in seconds.',
            specs: ['1TB Custom NVMe SSD', '12 Teraflops GPU', '4K UHD Blu-ray', 'DirectX Raytracing'],
            deliveryInfo: {
              shipsFrom: 'Yaba, Lagos',
              dispatchTime: 'Same Day Dispatch',
              lagosAbujaFee: 4000,
              nationwideFee: 7500
            },
            extensionCount: 0,
            maxExtensions: 5
          }
        ]
      },
      {
        id: 'slot_gaming_b',
        code: 'Slot B',
        name: 'Afternoon Handhelds, VR & Racing Sims',
        targetItemCount: 300, // 300 items for today
        scheduledStartTime: '02:30 PM',
        scheduledEndTime: '07:00 PM',
        status: 'upcoming',
        activeProductIndex: 0,
        completedItemsCount: 0,
        totalSalesVolume: 0,
        totalBidsPlaced: 0,
        products: [
          {
            id: 'gaming_slot_b_1',
            title: 'Meta Quest 3 (128GB - Mixed Reality VR Headset)',
            category: 'Gaming & Consoles',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 420000,
            currentBid: 420000,
            bidIncrement: 5000,
            reservePrice: 450000,
            estimatedMarketValue: 650000,
            seller: {
              name: 'VR Lounge Lekki',
              location: 'Lekki Phase 1, Lagos',
              verified: true,
              rating: 4.9
            },
            durationSeconds: 90,
            remainingSeconds: 90,
            status: 'queued',
            bidsCount: 0,
            description: 'Breakthrough mixed reality headset. Transform your home into a virtual playground with color passthrough and Snapdragon XR2 Gen 2.',
            specs: ['128GB Storage', '4K+ Infinite Display (2064x2208 per eye)', 'Touch Plus Controllers with TruTouch Haptics'],
            deliveryInfo: {
              shipsFrom: 'Lekki, Lagos',
              dispatchTime: 'Same Day Dispatch',
              lagosAbujaFee: 3500,
              nationwideFee: 6500
            },
            extensionCount: 0,
            maxExtensions: 5
          }
        ]
      }
    ]
  },
  {
    id: 'room_solar',
    categoryId: 'Solar & Power',
    categoryName: 'Solar & Power Systems',
    icon: '☀️',
    slug: 'solar',
    title: 'Solar & Energy Live Hub',
    description: 'High capacity hybrid inverters, LiFePO4 wall-mount battery banks, and solar panels with guaranteed manufacturer warranties.',
    banner: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    hostName: 'Engr. Tunde Adeleke (Solar Pro)',
    hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    viewerCount: 1950,
    activeBiddersCount: 98,
    status: 'live',
    energyLevel: 'HOT',
    activeSlotId: 'slot_solar_a',
    sponsor: {
      name: 'Felicity & EcoFlow Nigeria Certified',
      banner: 'Original Grade A Cells with 5-Year Replacement Guarantee',
      tagline: 'Reliable 24/7 power independence for Nigerian homes and businesses.'
    },
    slots: [
      {
        id: 'slot_solar_a',
        code: 'Slot A',
        name: 'Morning Inverters & Lithium Storage',
        targetItemCount: 160, // 160 items for today
        scheduledStartTime: '08:30 AM',
        scheduledEndTime: '12:30 PM',
        status: 'active',
        activeProductIndex: 0,
        completedItemsCount: 19,
        totalSalesVolume: 41200000,
        totalBidsPlaced: 215,
        products: [
          {
            id: 'solar_1',
            title: 'Felicity Solar 5kVA 48V Hybrid Inverter + 5kWh Lithium Battery Bundle',
            category: 'Solar & Power',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 2100000,
            currentBid: 2450000,
            bidIncrement: 25000,
            reservePrice: 2300000,
            estimatedMarketValue: 3200000,
            seller: {
              name: 'SolarNaija Direct Energy',
              location: 'Lekki Phase 1, Lagos',
              verified: true,
              rating: 4.9
            },
            durationSeconds: 90,
            remainingSeconds: 70,
            status: 'active',
            bidsCount: 22,
            description: 'Complete plug-and-play solar package for 3-4 bedroom flat. Runs 1.5HP inverter AC, double-door refrigerator, TV, lights, and pumping machine.',
            specs: ['5kVA 48V Pure Sine Wave Inverter', '5kWh 100Ah 48V LiFePO4 Battery (6000 cycles)', 'Built-in 100A MPPT Solar Charge Controller', 'Wi-Fi Monitoring Dongle'],
            deliveryInfo: {
              shipsFrom: 'Lekki, Lagos',
              dispatchTime: 'Heavy Cargo Pallet (24 hrs)',
              lagosAbujaFee: 8000,
              nationwideFee: 16000
            },
            extensionCount: 0,
            maxExtensions: 5
          },
          {
            id: 'solar_2',
            title: 'EcoFlow Delta 2 Max (2048Wh LFP Battery Station + 400W Solar Panel)',
            category: 'Solar & Power',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 1250000,
            currentBid: 1250000,
            bidIncrement: 20000,
            reservePrice: 1350000,
            estimatedMarketValue: 1850000,
            seller: {
              name: 'PowerHub Abuja',
              location: 'Garki 2, Abuja FCT',
              verified: true,
              rating: 4.9
            },
            durationSeconds: 90,
            remainingSeconds: 90,
            status: 'queued',
            bidsCount: 0,
            description: 'Ultra-portable, zero-fume power generator. 2400W AC output (powers 99% of appliances including microwave & iron). Fast 80-minute AC charge.',
            specs: ['2048Wh Capacity (Expandable to 6kWh)', '2400W AC Output (3400W X-Boost)', 'LFP Battery with 10-Year Lifespan', '400W Portable Solar Panel'],
            deliveryInfo: {
              shipsFrom: 'Garki, Abuja',
              dispatchTime: 'Next Day Express Cargo',
              lagosAbujaFee: 6000,
              nationwideFee: 12000
            },
            extensionCount: 0,
            maxExtensions: 5
          }
        ]
      },
      {
        id: 'slot_solar_b',
        code: 'Slot B',
        name: 'Afternoon High Capacity Panels & Commercial Systems',
        targetItemCount: 280, // 280 items for today
        scheduledStartTime: '01:00 PM',
        scheduledEndTime: '05:30 PM',
        status: 'upcoming',
        activeProductIndex: 0,
        completedItemsCount: 0,
        totalSalesVolume: 0,
        totalBidsPlaced: 0,
        products: [
          {
            id: 'solar_slot_b_1',
            title: 'Pallet of 10x Jinko 580W N-Type Bifacial Mono Solar Panels (5.8kW Total)',
            category: 'Solar & Power',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 950000,
            currentBid: 950000,
            bidIncrement: 10000,
            reservePrice: 1050000,
            estimatedMarketValue: 1450000,
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
            description: 'Grade A Tier 1 Jinko Tiger Neo N-Type panels. High 22.45% efficiency, 30-year power output linear warranty.',
            specs: ['10x 580W Panels (5800W Array)', 'Bifacial Energy Gain (up to +25%)', 'Anodized Aluminum Frame'],
            deliveryInfo: {
              shipsFrom: 'Lekki, Lagos',
              dispatchTime: 'Pallet Delivery (2-3 Days)',
              lagosAbujaFee: 12000,
              nationwideFee: 24000
            },
            extensionCount: 0,
            maxExtensions: 5
          }
        ]
      }
    ]
  },
  {
    id: 'room_electronics',
    categoryId: 'Electronics',
    categoryName: 'Electronics & Audio-Visual',
    icon: '📺',
    slug: 'electronics',
    title: 'Electronics & Audio-Visual Room',
    description: '4K OLED Smart TVs, JBL PartyBox speakers, home theaters, and professional studio equipment direct from authorized distributors.',
    banner: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=80',
    hostName: 'DJ Kaycee (Sound Maestro)',
    hostAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    viewerCount: 1680,
    activeBiddersCount: 82,
    status: 'live',
    energyLevel: 'MEDIUM',
    activeSlotId: 'slot_electronics_a',
    sponsor: {
      name: 'Fouani & JBL Official Warranty',
      banner: '2 Years Manufacturer Warranty with Original Remote & Cables',
      tagline: 'Tested screens with zero dead pixels guarantee.'
    },
    slots: [
      {
        id: 'slot_electronics_a',
        code: 'Slot A',
        name: 'Morning Smart TVs & Audio Bashing',
        targetItemCount: 140, // 140 items for today
        scheduledStartTime: '09:00 AM',
        scheduledEndTime: '01:00 PM',
        status: 'active',
        activeProductIndex: 0,
        completedItemsCount: 16,
        totalSalesVolume: 12400000,
        totalBidsPlaced: 188,
        products: [
          {
            id: 'elec_1',
            title: 'LG 65" OLED C3 4K Smart TV (120Hz, Dolby Vision & Atmos)',
            category: 'Electronics',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 1100000,
            currentBid: 1240000,
            bidIncrement: 20000,
            reservePrice: 1200000,
            estimatedMarketValue: 1750000,
            seller: {
              name: 'Fouani Electronics Partner Outlet',
              location: 'Victoria Island, Lagos',
              verified: true,
              rating: 5.0
            },
            durationSeconds: 90,
            remainingSeconds: 62,
            status: 'active',
            bidsCount: 18,
            description: 'World-renowned LG OLED C3 with α9 AI Processor Gen6. Self-lit pixels, infinite contrast, 0.1ms response time, 4x HDMI 2.1 ports for gaming.',
            specs: ['65" 4K OLED (3840 x 2160)', 'α9 AI Processor Gen6', 'webOS 23 with ThinQ AI', 'NVIDIA G-Sync & AMD FreeSync'],
            deliveryInfo: {
              shipsFrom: 'VI, Lagos',
              dispatchTime: 'Special Handled Cargo (24 hrs)',
              lagosAbujaFee: 8500,
              nationwideFee: 16000
            },
            extensionCount: 0,
            maxExtensions: 5
          },
          {
            id: 'elec_2',
            title: 'JBL PartyBox 710 (800W Powerful Bluetooth Speaker with Dynamic Lightshow)',
            category: 'Electronics',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 650000,
            currentBid: 650000,
            bidIncrement: 10000,
            reservePrice: 700000,
            estimatedMarketValue: 950000,
            seller: {
              name: 'Surulere Sound Warehouse',
              location: 'Surulere, Lagos',
              verified: true,
              rating: 4.8
            },
            durationSeconds: 90,
            remainingSeconds: 90,
            status: 'queued',
            bidsCount: 0,
            description: 'Massive 800W RMS of high-performance JBL Original Pro Sound. Splashproof IPX4 design, easy-to-grip handle and sturdy wheels.',
            specs: ['800W RMS Output', 'Synchronized Light Show with Strobe', 'Dual 2.75" Tweeters + Dual 8" Woofers', 'Guitar & Mic Inputs'],
            deliveryInfo: {
              shipsFrom: 'Surulere, Lagos',
              dispatchTime: 'Same Day Dispatch',
              lagosAbujaFee: 5000,
              nationwideFee: 9500
            },
            extensionCount: 0,
            maxExtensions: 5
          }
        ]
      }
    ]
  },
  {
    id: 'room_watches',
    categoryId: 'Watches',
    categoryName: 'Watches & Luxury',
    icon: '⌚',
    slug: 'watches',
    title: 'Watches & Horology Live Suite',
    description: 'Authentic luxury Swiss timepieces, automatic divers, and gold accents authenticated by master horologists.',
    banner: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    hostName: 'Barrister Tunde (Luxury Collector)',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    viewerCount: 1420,
    activeBiddersCount: 68,
    status: 'live',
    energyLevel: 'HOT',
    activeSlotId: 'slot_watches_a',
    sponsor: {
      name: 'Ikoyi Horology Guild',
      banner: '100% Guaranteed Authentic with Master Certification Certificate',
      tagline: 'Tested movement amplitude and water resistance.'
    },
    slots: [
      {
        id: 'slot_watches_a',
        code: 'Slot A',
        name: 'Morning Swiss Chronographs & Automatics',
        targetItemCount: 120, // 120 items for today
        scheduledStartTime: '11:00 AM',
        scheduledEndTime: '03:00 PM',
        status: 'active',
        activeProductIndex: 0,
        completedItemsCount: 14,
        totalSalesVolume: 28900000,
        totalBidsPlaced: 146,
        products: [
          {
            id: 'watch_1',
            title: 'Tag Heuer Aquaracer Professional 300 (Automatic Blue Dial, 43mm)',
            category: 'Watches & Luxury',
            condition: 'Brand New',
            images: [
              'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80'
            ],
            startingPrice: 1600000,
            currentBid: 1850000,
            bidIncrement: 25000,
            reservePrice: 1750000,
            estimatedMarketValue: 2600000,
            seller: {
              name: 'Ikoyi Timepieces Ltd',
              location: 'Bourbillion Court, Ikoyi, Lagos',
              verified: true,
              rating: 5.0
            },
            durationSeconds: 90,
            remainingSeconds: 74,
            status: 'active',
            bidsCount: 16,
            description: 'Genuine Tag Heuer Aquaracer with Calibre 5 Automatic movement. Unidirectional ceramic bezel, sapphire crystal with double anti-reflective treatment, 300m water resistance.',
            specs: ['Calibre 5 Automatic Movement', '300m / 1000ft Water Resistant', 'Fine-brushed Steel Case & Bracelet', 'Complete Box & International Papers'],
            deliveryInfo: {
              shipsFrom: 'Ikoyi, Lagos',
              dispatchTime: 'Insured Armored Courier (Same Day)',
              lagosAbujaFee: 5000,
              nationwideFee: 10000
            },
            extensionCount: 0,
            maxExtensions: 5
          }
        ]
      }
    ]
  }
];
