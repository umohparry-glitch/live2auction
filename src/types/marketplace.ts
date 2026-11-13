export type MarketplaceCategory = 
  | 'Phones'
  | 'Laptops'
  | 'Electronics'
  | 'Home Appliances'
  | 'Fashion'
  | 'Shoes'
  | 'Watches'
  | 'Gaming'
  | 'Furniture'
  | 'Tools'
  | 'Solar & Power'
  | 'Auto Accessories'
  | 'Other Approved Products';

export type VerificationStatus = 
  | 'seller_listed' 
  | 'pending_review' 
  | 'verified' 
  | 'inspected' 
  | 'rejected' 
  | 'suspended';

export type MarketplaceUserRole = 'buyer' | 'seller' | 'admin';

export type SellerAccountStatus = 
  | 'pending' 
  | 'submitted' 
  | 'under_review' 
  | 'verified' 
  | 'rejected' 
  | 'suspended' 
  | 'banned';

export type TimedAuctionStatus = 
  | 'draft' 
  | 'pending_review' 
  | 'scheduled' 
  | 'live' 
  | 'ended' 
  | 'awaiting_payment' 
  | 'payment_expired' 
  | 'awaiting_fulfillment' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed';

export type OrderStatus = 
  | 'created' 
  | 'payment_pending' 
  | 'paid' 
  | 'seller_processing' 
  | 'pickup_requested' 
  | 'picked_up' 
  | 'inspection' 
  | 'in_transit' 
  | 'delivered' 
  | 'buyer_inspection' 
  | 'accepted' 
  | 'disputed' 
  | 'refund_pending' 
  | 'refunded' 
  | 'payout_pending' 
  | 'completed' 
  | 'cancelled';

export type PaymentStatus = 
  | 'pending' 
  | 'initiated' 
  | 'authorized' 
  | 'paid' 
  | 'failed' 
  | 'expired' 
  | 'refunded' 
  | 'partially_refunded' 
  | 'disputed' 
  | 'released';

export type DeliveryStatus = 
  | 'pending' 
  | 'pickup_scheduled' 
  | 'picked_up' 
  | 'in_transit' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'failed' 
  | 'returned';

export type DisputeStatus = 
  | 'open' 
  | 'under_review' 
  | 'waiting_buyer' 
  | 'waiting_seller' 
  | 'resolved_buyer' 
  | 'resolved_seller' 
  | 'partially_resolved' 
  | 'closed';

export type DisputeReason = 
  | 'product_not_received' 
  | 'wrong_product' 
  | 'significantly_not_as_described' 
  | 'damaged' 
  | 'counterfeit_suspected' 
  | 'missing_parts' 
  | 'delivery_issue' 
  | 'payment_issue' 
  | 'other';

export interface MarketplaceProduct {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerLocation: string;
  sellerRating: number;
  sellerCompletedSales: number;
  sellerVerified: boolean;
  title: string;
  slug: string;
  category: MarketplaceCategory;
  brand: string;
  model: string;
  condition: 'Brand New' | 'Open Box' | 'Refurbished' | 'Fairly Used' | 'Used';
  description: string;
  defectsDisclosure?: string;
  quantity: number;
  productLocation: string; // Lagos (Ikeja, Lekki, Yaba, etc.), Abuja, Port Harcourt, Ibadan
  expectedMarketValue: number;
  startingPrice: number;
  reservePrice?: number;
  bidIncrement: number;
  currentBid: number;
  bidsCount: number;
  images: string[];
  videoUrl?: string;
  verificationStatus: VerificationStatus;
  status: TimedAuctionStatus;
  startTime: string;
  endTime: string;
  effectiveEndTime: string;
  extensionCount: number;
  maxExtensions: number;
  winnerId?: string;
  winnerMaskedName?: string;
  winningBidAmount?: number;
  deliveryOptions: {
    shipsFrom: string;
    dispatchTime: string;
    lagosAbujaFee: number;
    nationwideFee: number;
    courierName: string;
  };
  warrantyInfo?: string;
  serialNumber?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface TimedBid {
  id: string;
  auctionId: string;
  bidderId: string;
  maskedBidder: string;
  amount: number;
  timestamp: string;
  isAutoBid?: boolean;
}

export interface MarketplaceOrder {
  id: string;
  auctionId: string;
  productId: string;
  productTitle: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  buyerPhoneMasked: string;
  sellerId: string;
  sellerName: string;
  sellerLocation: string;
  hammerPrice: number;
  deliveryFee: number;
  protectionFee: number;
  totalPaid: number;
  platformCommission: number;
  sellerPayoutAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  trackingNumber: string;
  deliveryAddress: string;
  courierProvider: string;
  paymentDeadline: string;
  inspectionDeadline?: string;
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
  completedAt?: string;
}

export interface CommissionRule {
  id: string;
  minAmount: number;
  maxAmount: number;
  percentage: number;
  fixedFee: number;
}

export interface MarketplaceDispute {
  id: string;
  orderId: string;
  productTitle: string;
  openedBy: 'buyer' | 'seller';
  openerName: string;
  reason: DisputeReason;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  adminDecision?: string;
  refundAmount?: number;
  sellerPayoutAmount?: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface SellerProfile {
  id: string;
  userId: string;
  businessName: string;
  classification: 'individual' | 'registered_business';
  state: string;
  city: string;
  address: string;
  status: SellerAccountStatus;
  payoutBank: string;
  payoutAccountNumber: string; // masked
  payoutAccountName: string;
  rating: number;
  totalSalesCount: number;
  totalSalesVolume: number;
  sellThroughRate: number;
  avgFulfilmentHours: number;
  phoneVerified: boolean;
  identityVerified: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  ipMetadata?: string;
}
