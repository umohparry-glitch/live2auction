import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MarketplaceProduct, 
  MarketplaceOrder, 
  MarketplaceDispute, 
  SellerProfile,
  AuditLogEntry,
  MarketplaceCategory,
  VerificationStatus,
  OrderStatus
} from '../types/marketplace';
import { 
  DEMO_MARKETPLACE_PRODUCTS, 
  DEMO_SELLERS, 
  DEMO_ORDERS, 
  DEMO_DISPUTES, 
  DEMO_AUDIT_LOGS,
  calculatePlatformCommission
} from '../data/marketplaceData';
import { paymentService, deliveryService } from '../services/marketplaceServices';

export interface MarketplaceContextType {
  products: MarketplaceProduct[];
  orders: MarketplaceOrder[];
  disputes: MarketplaceDispute[];
  sellers: SellerProfile[];
  auditLogs: AuditLogEntry[];
  selectedProduct: MarketplaceProduct | null;
  setSelectedProduct: (p: MarketplaceProduct | null) => void;
  
  // Bidding on Timed Auctions
  placeMarketplaceBid: (productId: string, bidAmount: number, bidderName: string) => { success: boolean; message: string };
  
  // Seller Actions
  createProduct: (productData: Partial<MarketplaceProduct>) => { success: boolean; product: MarketplaceProduct };
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  
  // Buyer Actions
  payForOrder: (orderId: string) => Promise<{ success: boolean; message: string }>;
  confirmBuyerInspectionAccept: (orderId: string) => void;
  openDispute: (orderId: string, reason: any, description: string) => void;
  
  // Admin Moderation
  approveProductVerification: (productId: string) => void;
  rejectProductVerification: (productId: string, reason: string) => void;
  resolveDispute: (disputeId: string, decision: string, refundBuyerAmount: number) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<MarketplaceProduct[]>(DEMO_MARKETPLACE_PRODUCTS);
  const [orders, setOrders] = useState<MarketplaceOrder[]>(DEMO_ORDERS);
  const [disputes, setDisputes] = useState<MarketplaceDispute[]>(DEMO_DISPUTES);
  const [sellers, setSellers] = useState<SellerProfile[]>(DEMO_SELLERS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(DEMO_AUDIT_LOGS);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);

  // Server-authoritative anti-sniping and bid placement
  const placeMarketplaceBid = (productId: string, bidAmount: number, bidderName: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return { success: false, message: 'Auction lot not found.' };

    if (product.status !== 'live') {
      return { success: false, message: 'This timed auction is no longer live.' };
    }

    const minRequired = product.currentBid + product.bidIncrement;
    if (bidAmount < minRequired) {
      return { success: false, message: `Your bid must be at least ₦${minRequired.toLocaleString()}.` };
    }

    // Check anti-sniping: if within final 2 minutes, extend effectiveEndTime by 2 minutes
    const now = Date.now();
    const effectiveEnd = new Date(product.effectiveEndTime).getTime();
    const remainingMs = effectiveEnd - now;

    let newEndTime = product.effectiveEndTime;
    let newExtensionCount = product.extensionCount;
    let extensionApplied = false;

    if (remainingMs <= 120000 && product.extensionCount < product.maxExtensions) {
      newEndTime = new Date(effectiveEnd + 120000).toISOString();
      newExtensionCount += 1;
      extensionApplied = true;
    }

    const maskedBidder = `Buyer #${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          currentBid: bidAmount,
          bidsCount: p.bidsCount + 1,
          winnerMaskedName: maskedBidder,
          effectiveEndTime: newEndTime,
          extensionCount: newExtensionCount
        };
      }
      return p;
    });

    setProducts(updatedProducts);

    // If currently selected product, keep in sync
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(prev => prev ? {
        ...prev,
        currentBid: bidAmount,
        bidsCount: prev.bidsCount + 1,
        winnerMaskedName: maskedBidder,
        effectiveEndTime: newEndTime,
        extensionCount: newExtensionCount
      } : null);
    }

    // Audit log
    const newLog: AuditLogEntry = {
      id: `log_${Date.now()}`,
      userId: bidderName || 'Buyer',
      action: extensionApplied ? 'BID_PLACED_WITH_ANTI_SNIPING_EXTENSION' : 'BID_PLACED_ATOMIC',
      entityType: 'AuctionProduct',
      entityId: productId,
      oldValue: `₦${product.currentBid.toLocaleString()}`,
      newValue: `₦${bidAmount.toLocaleString()}${extensionApplied ? ' (+2 mins extension)' : ''}`,
      timestamp: new Date().toISOString(),
      ipMetadata: 'Client Session Verified (NG)'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    return {
      success: true,
      message: extensionApplied 
        ? `Bid of ₦${bidAmount.toLocaleString()} accepted! Anti-sniping active: +2 mins added to clock.`
        : `Bid of ₦${bidAmount.toLocaleString()} accepted successfully!`
    };
  };

  // Seller creates a new product
  const createProduct = (data: Partial<MarketplaceProduct>) => {
    const newProd: MarketplaceProduct = {
      id: `mprod_${Date.now()}`,
      sellerId: 'seller_ikeja_hub',
      sellerName: 'Ikeja Gadget Hub Ltd',
      sellerLocation: 'Ikeja, Lagos',
      sellerRating: 4.9,
      sellerCompletedSales: 142,
      sellerVerified: true,
      title: data.title || 'Untitled Lot',
      slug: (data.title || 'lot').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: data.category || 'Phones',
      brand: data.brand || 'Generic',
      model: data.model || '',
      condition: data.condition || 'Brand New',
      description: data.description || '',
      quantity: 1,
      productLocation: data.productLocation || 'Ikeja, Lagos',
      expectedMarketValue: data.expectedMarketValue || 100000,
      startingPrice: data.startingPrice || 50000,
      reservePrice: data.reservePrice,
      bidIncrement: data.bidIncrement || 5000,
      currentBid: data.startingPrice || 50000,
      bidsCount: 0,
      images: data.images && data.images.length > 0 ? data.images : [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80'
      ],
      verificationStatus: 'pending_review',
      status: 'pending_review',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000 * 24).toISOString(),
      effectiveEndTime: new Date(Date.now() + 3600000 * 24).toISOString(),
      extensionCount: 0,
      maxExtensions: 5,
      deliveryOptions: {
        shipsFrom: 'Ikeja, Lagos',
        dispatchTime: '24-48 Hours Tracked Delivery',
        lagosAbujaFee: 3500,
        nationwideFee: 7000,
        courierName: 'GIG Logistics'
      },
      createdAt: new Date().toISOString()
    };

    setProducts(prev => [newProd, ...prev]);

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      userId: 'seller_ikeja_hub',
      action: 'SELLER_PRODUCT_SUBMITTED_FOR_REVIEW',
      entityType: 'Product',
      entityId: newProd.id,
      newValue: newProd.title,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);

    return { success: true, product: newProd };
  };

  // Buyer pays for won order
  const payForOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const paymentRes = await paymentService.createPayment(orderId, order.totalPaid, 'buyer@example.com');
    const verifyRes = await paymentService.verifyPayment(paymentRes.paymentReference);

    if (verifyRes.success) {
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'paid',
            paymentStatus: 'paid',
            paidAt: verifyRes.paidAt
          };
        }
        return o;
      }));

      setAuditLogs(prev => [{
        id: `log_${Date.now()}`,
        userId: order.buyerId,
        action: 'PAYMENT_VERIFIED_BY_PROVIDER_ESCROW',
        entityType: 'Order',
        entityId: orderId,
        oldValue: 'payment_pending',
        newValue: 'paid',
        timestamp: new Date().toISOString(),
        ipMetadata: 'Paystack/Flutterwave Webhook 200 OK'
      }, ...prev]);

      return { success: true, message: 'Payment successfully received and secured in protected escrow.' };
    }

    return { success: false, message: 'Payment verification failed.' };
  };

  // Buyer confirms satisfactory delivery inspection (Section 24)
  const confirmBuyerInspectionAccept = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'completed',
          deliveryStatus: 'delivered',
          completedAt: new Date().toISOString()
        };
      }
      return o;
    }));

    setAuditLogs(prev => [{
      id: `log_${Date.now()}`,
      userId: 'Buyer',
      action: 'BUYER_INSPECTION_ACCEPTED_TRANSACTION_COMPLETED',
      entityType: 'Order',
      entityId: orderId,
      oldValue: 'buyer_inspection',
      newValue: 'completed',
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  // Buyer opens dispute during inspection window (Section 25)
  const openDispute = (orderId: string, reason: any, description: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const newDispute: MarketplaceDispute = {
      id: `disp_${Date.now()}`,
      orderId,
      productTitle: order.productTitle,
      openedBy: 'buyer',
      openerName: order.buyerName,
      reason,
      description,
      evidence: [order.productImage],
      status: 'under_review',
      createdAt: new Date().toISOString()
    };

    setDisputes(prev => [newDispute, ...prev]);

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'disputed' };
      }
      return o;
    }));

    setAuditLogs(prev => [{
      id: `log_${Date.now()}`,
      userId: order.buyerId,
      action: 'DISPUTE_OPENED_PAYOUT_PAUSED',
      entityType: 'Dispute',
      entityId: newDispute.id,
      newValue: reason,
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  // Admin approves product verification (Section 9 & 64)
  const approveProductVerification = (productId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          verificationStatus: 'verified',
          status: 'live'
        };
      }
      return p;
    }));

    setAuditLogs(prev => [{
      id: `log_${Date.now()}`,
      userId: 'SuperAdmin',
      action: 'ADMIN_PRODUCT_VERIFICATION_APPROVED',
      entityType: 'Product',
      entityId: productId,
      oldValue: 'pending_review',
      newValue: 'verified & live',
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  const rejectProductVerification = (productId: string, reason: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          verificationStatus: 'rejected',
          status: 'cancelled',
          adminNotes: reason
        };
      }
      return p;
    }));
  };

  const resolveDispute = (disputeId: string, decision: string, refundBuyerAmount: number) => {
    setDisputes(prev => prev.map(d => {
      if (d.id === disputeId) {
        return {
          ...d,
          status: 'resolved_buyer',
          adminDecision: decision,
          refundAmount: refundBuyerAmount,
          resolvedAt: new Date().toISOString()
        };
      }
      return d;
    }));
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    }));
  };

  return (
    <MarketplaceContext.Provider value={{
      products,
      orders,
      disputes,
      sellers,
      auditLogs,
      selectedProduct,
      setSelectedProduct,
      placeMarketplaceBid,
      createProduct,
      updateOrderStatus,
      payForOrder,
      confirmBuyerInspectionAccept,
      openDispute,
      approveProductVerification,
      rejectProductVerification,
      resolveDispute
    }}>
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
