export type AuctionStatus = 'draft' | 'scheduled' | 'live' | 'paused' | 'ended' | 'cancelled';
export type ProductAuctionStatus = 'queued' | 'active' | 'sold' | 'passed' | 'paused';
export type AuctionEventType = 'daily' | 'weekly' | 'special_event';

export interface AuctionProduct {
  id: string;
  title: string;
  category: string;
  condition: 'Brand New' | 'Open Box' | 'Refurbished' | 'Fairly Used';
  images: string[];
  startingPrice: number;
  currentBid: number;
  bidIncrement: number;
  reservePrice?: number;
  estimatedMarketValue: number;
  seller: {
    name: string;
    location: string;
    verified: boolean;
    rating: number;
  };
  durationSeconds: number;
  remainingSeconds: number;
  status: ProductAuctionStatus;
  winner?: {
    id: string;
    nickname: string;
    bidAmount: number;
    timestamp: string;
  };
  bidsCount: number;
  description: string;
  specs: string[];
  deliveryInfo: {
    shipsFrom: string;
    dispatchTime: string;
    lagosAbujaFee: number;
    nationwideFee: number;
  };
  extensionCount: number;
  maxExtensions: number;
}

export interface BidRecord {
  id: string;
  auctionProductId: string;
  bidderId: string;
  maskedBidder: string;
  amount: number;
  timestamp: string;
  isProxy?: boolean;
  isCurrentUser?: boolean;
}

export interface ProxyBidConfig {
  id: string;
  userId: string;
  userNickname: string;
  auctionProductId: string;
  maxAmount: number;
  createdAt: string;
  active: boolean;
}

export interface LiveChatMessage {
  id: string;
  senderId: string;
  senderNickname: string;
  text: string;
  timestamp: string;
  isModerator?: boolean;
  isHost?: boolean;
  isSystem?: boolean;
  pinned?: boolean;
  masked?: boolean;
  flagged?: boolean;
}

export interface LiveReaction {
  id: string;
  emoji: string;
  xOffset: number; // 0 to 100%
  timestamp: number;
}

export interface LiveAuctionEvent {
  id: string;
  title: string;
  description: string;
  banner: string;
  eventType: AuctionEventType;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  hostName: string;
  hostAvatar?: string;
  totalProducts: number;
  currentProductIndex: number;
  viewerCount: number;
  activeBiddersCount: number;
  totalBidsPlaced: number;
  totalSalesVolume: number;
  sponsor?: {
    name: string;
    banner: string;
    tagline: string;
  };
  energyLevel: 'LOW' | 'MEDIUM' | 'HOT' | 'EXTREME';
}

export interface AuctionAnnouncement {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'celebration' | 'alert';
  timestamp: string;
}

export interface FraudAlert {
  id: string;
  bidderId: string;
  maskedBidder: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  timestamp: string;
  actionTaken?: 'restricted' | 'suspended' | 'cleared';
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'outbid' | 'won' | 'reminder' | 'extended' | 'system' | 'price_change' | 'ending_soon';
  productTitle?: string;
  productId?: string;
  price?: number;
}

export type UserRole = 'buyer' | 'admin' | 'host';

export type SlotStatusCode = 'active' | 'upcoming' | 'completed' | 'paused';

export interface AuctionSlot {
  id: string;
  code: string; // e.g. "Slot A", "Slot B"
  name: string; // e.g. "Morning Tech Rush", "Afternoon Prime Bidding"
  targetItemCount: number; // e.g. 200 for Slot A, 350 for Slot B
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: SlotStatusCode;
  products: AuctionProduct[];
  activeProductIndex: number;
  completedItemsCount: number;
  totalSalesVolume: number;
  totalBidsPlaced: number;
  dayLabel?: string;
  date?: string;
}

export interface DaySchedule {
  dayIndex: number;
  dayName: string;
  formattedDate: string;
  label: string;
  isToday: boolean;
  isTomorrow: boolean;
  slots: AuctionSlot[];
}

export interface CategoryLiveRoom {
  id: string;
  categoryId: string;
  categoryName: string;
  icon: string;
  slug: string;
  title: string;
  description: string;
  banner: string;
  hostName: string;
  hostAvatar?: string;
  viewerCount: number;
  activeBiddersCount: number;
  status: AuctionStatus;
  energyLevel: 'LOW' | 'MEDIUM' | 'HOT' | 'EXTREME';
  activeSlotId: string;
  slots: AuctionSlot[];
  sponsor?: {
    name: string;
    banner: string;
    tagline: string;
  };
}
