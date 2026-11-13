import { AuctionProduct, AuctionSlot, DaySchedule } from '../types';
import { INITIAL_CATEGORY_ROOMS } from './categoryRoomsData';

// Generates 7-day week schedule (Today, Tomorrow / Next Day, + 5 days)
export function generateWeekScheduleForCategory(categoryId: string): DaySchedule[] {
  const room = INITIAL_CATEGORY_ROOMS.find(r => r.categoryId === categoryId || r.id === categoryId) || INITIAL_CATEGORY_ROOMS[0];
  const days: DaySchedule[] = [];
  const baseDate = new Date();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);

    const dayName = dayNames[d.getDay()];
    const monthName = monthNames[d.getMonth()];
    const dateNum = d.getDate();
    const formattedDate = `${dayName}, ${monthName} ${dateNum}`;
    const isoDate = d.toISOString().split('T')[0];

    const isToday = i === 0;
    const isTomorrow = i === 1;
    const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow (Next Day)' : dayName;

    // Build the 3 daily slots for this day
    const slots: AuctionSlot[] = [
      {
        id: `slot_${room.slug}_${isoDate}_a`,
        code: 'Slot A',
        name: isToday ? room.slots[0]?.name || 'Morning Flash Deals' : `Morning Prime Quota (${dayName})`,
        targetItemCount: 200,
        scheduledStartTime: '09:00 AM',
        scheduledEndTime: '01:00 PM',
        status: isToday ? 'active' : 'upcoming',
        products: isToday && room.slots[0]?.products ? room.slots[0].products : generateSlotProducts(room.slug, 'A', isoDate, dayName),
        activeProductIndex: 0,
        completedItemsCount: isToday ? (room.slots[0]?.completedItemsCount || 42) : 0,
        totalSalesVolume: isToday ? (room.slots[0]?.totalSalesVolume || 24500000) : 0,
        totalBidsPlaced: isToday ? (room.slots[0]?.totalBidsPlaced || 618) : 0,
        dayLabel: label,
        date: isoDate
      },
      {
        id: `slot_${room.slug}_${isoDate}_b`,
        code: 'Slot B',
        name: isToday ? room.slots[1]?.name || 'Afternoon Flagship Rush' : `Afternoon Flagship Showcase (${dayName})`,
        targetItemCount: 350,
        scheduledStartTime: '01:30 PM',
        scheduledEndTime: '06:00 PM',
        status: 'upcoming',
        products: isToday && room.slots[1]?.products ? room.slots[1].products : generateSlotProducts(room.slug, 'B', isoDate, dayName),
        activeProductIndex: 0,
        completedItemsCount: 0,
        totalSalesVolume: 0,
        totalBidsPlaced: 0,
        dayLabel: label,
        date: isoDate
      },
      {
        id: `slot_${room.slug}_${isoDate}_c`,
        code: 'Slot C',
        name: isToday ? room.slots[2]?.name || 'Evening Super Clearance' : `Evening Clearance & Graded Lots (${dayName})`,
        targetItemCount: 150,
        scheduledStartTime: '06:30 PM',
        scheduledEndTime: '10:30 PM',
        status: 'upcoming',
        products: isToday && room.slots[2]?.products ? room.slots[2].products : generateSlotProducts(room.slug, 'C', isoDate, dayName),
        activeProductIndex: 0,
        completedItemsCount: 0,
        totalSalesVolume: 0,
        totalBidsPlaced: 0,
        dayLabel: label,
        date: isoDate
      }
    ];

    days.push({
      dayIndex: i,
      dayName,
      formattedDate,
      label,
      isToday,
      isTomorrow,
      slots
    });
  }

  return days;
}

// Generates realistic queued items for any day's slot across the week range
function generateSlotProducts(categorySlug: string, slotCode: 'A' | 'B' | 'C', isoDate: string, dayName: string): AuctionProduct[] {
  if (categorySlug.includes('phone')) {
    if (slotCode === 'A') {
      return [
        {
          id: `phone_${isoDate}_a1`,
          title: 'Apple iPhone 15 Pro Max (512GB, Blue Titanium - Sealed)',
          category: 'Phones & Tablets',
          condition: 'Brand New',
          images: [
            'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80'
          ],
          startingPrice: 1250000,
          currentBid: 1250000,
          bidIncrement: 10000,
          reservePrice: 1350000,
          estimatedMarketValue: 1850000,
          seller: {
            name: 'Otigba Premium Apple Hub',
            location: 'Computer Village, Ikeja, Lagos',
            verified: true,
            rating: 4.9
          },
          durationSeconds: 90,
          remainingSeconds: 90,
          status: 'queued',
          bidsCount: 0,
          description: `Scheduled for ${dayName} Slot A. Pristine brand new iPhone 15 Pro Max 512GB with 1-Year Apple warranty, physical SIM + eSIM support.`,
          specs: ['512GB Storage', 'A17 Pro 3nm Silicon', 'Titanium Grade 5 Frame', 'USB-C 3.0'],
          deliveryInfo: {
            shipsFrom: 'Ikeja, Lagos',
            dispatchTime: 'Same Day Dispatch',
            lagosAbujaFee: 3500,
            nationwideFee: 6500
          },
          extensionCount: 0,
          maxExtensions: 5
        },
        {
          id: `phone_${isoDate}_a2`,
          title: 'Samsung Galaxy S24 Ultra (256GB, Titanium Gray with S-Pen)',
          category: 'Phones & Tablets',
          condition: 'Brand New',
          images: [
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1000&q=80'
          ],
          startingPrice: 980000,
          currentBid: 980000,
          bidIncrement: 10000,
          reservePrice: 1050000,
          estimatedMarketValue: 1450000,
          seller: {
            name: 'Galaxy Experience Store Abuja',
            location: 'Maitama, Abuja FCT',
            verified: true,
            rating: 4.8
          },
          durationSeconds: 90,
          remainingSeconds: 90,
          status: 'queued',
          bidsCount: 0,
          description: `Scheduled for ${dayName} Slot A. Samsung flagship with 200MP camera, built-in S-Pen, and Galaxy AI live transcription.`,
          specs: ['256GB UFS 4.0', '12GB RAM', 'Snapdragon 8 Gen 3', '5000mAh Battery'],
          deliveryInfo: {
            shipsFrom: 'Maitama, Abuja',
            dispatchTime: 'Next Day Express',
            lagosAbujaFee: 4000,
            nationwideFee: 7000
          },
          extensionCount: 0,
          maxExtensions: 5
        },
        {
          id: `phone_${isoDate}_a3`,
          title: 'Google Pixel 8 Pro (256GB, Obsidian Black - Factory Unlocked)',
          category: 'Phones & Tablets',
          condition: 'Open Box',
          images: [
            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80'
          ],
          startingPrice: 620000,
          currentBid: 620000,
          bidIncrement: 5000,
          reservePrice: 680000,
          estimatedMarketValue: 900000,
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
          description: `Scheduled for ${dayName} Slot A. Grade A+ Google Tensor G3 device with Gemini Nano on-device AI.`,
          specs: ['256GB Storage', '12GB RAM', 'Tensor G3', 'Triple 50MP Cameras'],
          deliveryInfo: {
            shipsFrom: 'VI, Lagos',
            dispatchTime: 'Same Day Dispatch',
            lagosAbujaFee: 3500,
            nationwideFee: 6000
          },
          extensionCount: 0,
          maxExtensions: 5
        },
        {
          id: `phone_${isoDate}_a4`,
          title: 'Xiaomi 14 Ultra (512GB Leica Optics, Photography Kit Edition)',
          category: 'Phones & Tablets',
          condition: 'Brand New',
          images: [
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80'
          ],
          startingPrice: 920000,
          currentBid: 920000,
          bidIncrement: 10000,
          reservePrice: 990000,
          estimatedMarketValue: 1300000,
          seller: {
            name: 'Gadget Express Alaba',
            location: 'Alaba Int Market, Ojo, Lagos',
            verified: true,
            rating: 4.8
          },
          durationSeconds: 90,
          remainingSeconds: 90,
          status: 'queued',
          bidsCount: 0,
          description: `Scheduled for ${dayName} Slot A. Includes wireless camera grip and 67mm filter adapter ring. 1-inch Sony LYT-900 sensor.`,
          specs: ['512GB Storage', '16GB RAM', '1-inch Leica Sensor', '90W Fast Charge'],
          deliveryInfo: {
            shipsFrom: 'Alaba, Lagos',
            dispatchTime: 'Next Day Express',
            lagosAbujaFee: 3500,
            nationwideFee: 6500
          },
          extensionCount: 0,
          maxExtensions: 5
        }
      ];
    } else if (slotCode === 'B') {
      return [
        {
          id: `phone_${isoDate}_b1`,
          title: 'Apple iPad Pro 11" M4 (256GB Wi-Fi, Space Black)',
          category: 'Phones & Tablets',
          condition: 'Brand New',
          images: [
            'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1000&q=80'
          ],
          startingPrice: 1150000,
          currentBid: 1150000,
          bidIncrement: 10000,
          reservePrice: 1250000,
          estimatedMarketValue: 1650000,
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
          description: `Scheduled for ${dayName} Slot B. Ultra Retina XDR tandem OLED display, breakthrough Apple M4 3nm chip, and 5.3mm razor-thin profile.`,
          specs: ['11" Tandem OLED', 'Apple M4 Chip', '256GB Storage', 'Apple Pencil Pro Support'],
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
          id: `phone_${isoDate}_b2`,
          title: 'OnePlus 12 (512GB, Flowy Emerald - Hasselblad Triple Cam)',
          category: 'Phones & Tablets',
          condition: 'Brand New',
          images: [
            'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1000&q=80'
          ],
          startingPrice: 680000,
          currentBid: 680000,
          bidIncrement: 5000,
          reservePrice: 720000,
          estimatedMarketValue: 950000,
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
          description: `Scheduled for ${dayName} Slot B. Fast charging monster: 100W SUPERVOOC adapter in box, 5400mAh dual-cell battery.`,
          specs: ['512GB Storage', '16GB LPDDR5X RAM', 'Snapdragon 8 Gen 3', '2K 120Hz ProXDR Display'],
          deliveryInfo: {
            shipsFrom: 'Ikeja, Lagos',
            dispatchTime: 'Immediate Dispatch',
            lagosAbujaFee: 3500,
            nationwideFee: 6500
          },
          extensionCount: 0,
          maxExtensions: 5
        },
        {
          id: `phone_${isoDate}_b3`,
          title: 'Nothing Phone (2) (256GB, Dark Gray - Glyph Interface)',
          category: 'Phones & Tablets',
          condition: 'Brand New',
          images: [
            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80'
          ],
          startingPrice: 480000,
          currentBid: 480000,
          bidIncrement: 5000,
          reservePrice: 530000,
          estimatedMarketValue: 700000,
          seller: {
            name: 'Lagos Tech Emporium',
            location: 'Lekki Phase 1, Lagos',
            verified: true,
            rating: 4.9
          },
          durationSeconds: 90,
          remainingSeconds: 90,
          status: 'queued',
          bidsCount: 0,
          description: `Scheduled for ${dayName} Slot B. Transparent back design with custom LED Glyph notifications. Snapdragon 8+ Gen 1 flagship power.`,
          specs: ['256GB Storage', '12GB RAM', 'Custom Glyph LEDs', 'LTPO AMOLED 120Hz'],
          deliveryInfo: {
            shipsFrom: 'Lekki, Lagos',
            dispatchTime: 'Same Day Dispatch',
            lagosAbujaFee: 3500,
            nationwideFee: 6500
          },
          extensionCount: 0,
          maxExtensions: 5
        }
      ];
    } else {
      // Slot C
      return [
        {
          id: `phone_${isoDate}_c1`,
          title: 'Apple iPhone 14 Pro (128GB, Deep Purple - Grade A Tokunbo)',
          category: 'Phones & Tablets',
          condition: 'Fairly Used',
          images: [
            'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80'
          ],
          startingPrice: 650000,
          currentBid: 650000,
          bidIncrement: 5000,
          reservePrice: 700000,
          estimatedMarketValue: 920000,
          seller: {
            name: 'Marina Digital Clearing House',
            location: 'Broad Street, Lagos Island',
            verified: true,
            rating: 4.7
          },
          durationSeconds: 90,
          remainingSeconds: 90,
          status: 'queued',
          bidsCount: 0,
          description: `Scheduled for ${dayName} Slot C. UK direct used in Grade A mint condition. 91% battery health, fully tested IMEI & FaceID.`,
          specs: ['128GB Storage', 'Dynamic Island Display', 'A16 Bionic Chip', '48MP ProRAW'],
          deliveryInfo: {
            shipsFrom: 'Lagos Island',
            dispatchTime: 'Next Day Express',
            lagosAbujaFee: 3500,
            nationwideFee: 6000
          },
          extensionCount: 0,
          maxExtensions: 5
        },
        {
          id: `phone_${isoDate}_c2`,
          title: 'Samsung Galaxy S22 Ultra (256GB, Phantom Black - 100% Tested)',
          category: 'Phones & Tablets',
          condition: 'Refurbished',
          images: [
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1000&q=80'
          ],
          startingPrice: 420000,
          currentBid: 420000,
          bidIncrement: 5000,
          reservePrice: 460000,
          estimatedMarketValue: 620000,
          seller: {
            name: 'Computer Village Certified Techs',
            location: 'Ikeja, Lagos',
            verified: true,
            rating: 4.8
          },
          durationSeconds: 90,
          remainingSeconds: 90,
          status: 'queued',
          bidsCount: 0,
          description: `Scheduled for ${dayName} Slot C. Certified 30-point diagnostics passed with 6-month warranty. Includes S-Pen.`,
          specs: ['256GB Storage', '12GB RAM', '108MP Quad Camera', 'Snapdragon 8 Gen 1'],
          deliveryInfo: {
            shipsFrom: 'Ikeja, Lagos',
            dispatchTime: 'Same Day Dispatch',
            lagosAbujaFee: 3500,
            nationwideFee: 6000
          },
          extensionCount: 0,
          maxExtensions: 5
        }
      ];
    }
  }

  // Fallback for general computing / electronics / gaming
  return [
    {
      id: `${categorySlug}_${isoDate}_${slotCode}_1`,
      title: `Premium ${slotCode === 'A' ? 'Flagship Lot' : slotCode === 'B' ? 'Pro Series Deal' : 'Clearance Lot'} (${dayName})`,
      category: 'Electronics & Computing',
      condition: slotCode === 'C' ? 'Fairly Used' : 'Brand New',
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80'
      ],
      startingPrice: slotCode === 'A' ? 850000 : slotCode === 'B' ? 550000 : 320000,
      currentBid: slotCode === 'A' ? 850000 : slotCode === 'B' ? 550000 : 320000,
      bidIncrement: 10000,
      reservePrice: slotCode === 'A' ? 950000 : slotCode === 'B' ? 620000 : 360000,
      estimatedMarketValue: slotCode === 'A' ? 1250000 : slotCode === 'B' ? 820000 : 480000,
      seller: {
        name: 'Nigeria Verified Auction Partner',
        location: 'Lagos & Abuja Warehouses',
        verified: true,
        rating: 4.9
      },
      durationSeconds: 90,
      remainingSeconds: 90,
      status: 'queued',
      bidsCount: 0,
      description: `Verified lot allocated for ${dayName} Slot ${slotCode}. Inspected by NaijaAuction logistics team before lot scheduling.`,
      specs: ['Full Manufacturer Warranty', 'Original Box & Accessories', 'Inspected IMEI/Serial', 'Same Day Escrow'],
      deliveryInfo: {
        shipsFrom: 'Lagos / Abuja',
        dispatchTime: '24-48 Hours Nationwide',
        lagosAbujaFee: 3500,
        nationwideFee: 6500
      },
      extensionCount: 0,
      maxExtensions: 5
    },
    {
      id: `${categorySlug}_${isoDate}_${slotCode}_2`,
      title: `High Quota Lot #2 (${dayName} - Slot ${slotCode})`,
      category: 'Electronics & Computing',
      condition: 'Brand New',
      images: [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80'
      ],
      startingPrice: slotCode === 'A' ? 620000 : 410000,
      currentBid: slotCode === 'A' ? 620000 : 410000,
      bidIncrement: 5000,
      reservePrice: slotCode === 'A' ? 680000 : 450000,
      estimatedMarketValue: slotCode === 'A' ? 900000 : 600000,
      seller: {
        name: 'TechDirect Distribution Ltd',
        location: 'Victoria Island, Lagos',
        verified: true,
        rating: 4.8
      },
      durationSeconds: 90,
      remainingSeconds: 90,
      status: 'queued',
      bidsCount: 0,
      description: `Quality assured item queued for ${dayName} Slot ${slotCode}. Ready for pre-bidding or live bidding when slot begins.`,
      specs: ['Factory Sealed', '1-Year Warranty', 'Nationwide Delivery Guarantee'],
      deliveryInfo: {
        shipsFrom: 'VI, Lagos',
        dispatchTime: 'Fast Dispatch',
        lagosAbujaFee: 3500,
        nationwideFee: 6500
      },
      extensionCount: 0,
      maxExtensions: 5
    }
  ];
}
