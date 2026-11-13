import { 
  MarketplaceProduct, 
  MarketplaceOrder, 
  MarketplaceCategory, 
  VerificationStatus,
  SellerProfile
} from '../types/marketplace';

// Payment Service Abstraction (Section 18 & 19)
export interface PaymentService {
  createPayment(orderId: string, amount: number, customerEmail: string): Promise<{ paymentReference: string; checkoutUrl: string }>;
  verifyPayment(reference: string): Promise<{ success: boolean; paidAt: string; providerFee: number }>;
  refundPayment(reference: string, amount: number): Promise<{ success: boolean; refundId: string }>;
}

export class DemoPaymentProvider implements PaymentService {
  async createPayment(orderId: string, amount: number, customerEmail: string) {
    // In production, this proxies to Paystack / Flutterwave / Regulated Escrow Partner
    return {
      paymentReference: `NG_REF_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      checkoutUrl: `https://checkout.paystack.com/demo_auth_${orderId}`
    };
  }

  async verifyPayment(reference: string) {
    return {
      success: true,
      paidAt: new Date().toISOString(),
      providerFee: 100 // ₦100 payment gateway charge
    };
  }

  async refundPayment(reference: string, amount: number) {
    return {
      success: true,
      refundId: `RFD_${Date.now()}`
    };
  }
}

// Delivery Service Abstraction (Section 22)
export interface DeliveryService {
  createShipment(orderId: string, pickupAddress: string, deliveryAddress: string): Promise<{ trackingNumber: string; courierName: string; estimatedDays: number }>;
  trackShipment(trackingNumber: string): Promise<{ status: string; checkpoints: Array<{ time: string; location: string; note: string }> }>;
}

export class DemoDeliveryProvider implements DeliveryService {
  async createShipment(orderId: string, pickupAddress: string, deliveryAddress: string) {
    return {
      trackingNumber: `GIG-NG-${Math.floor(1000000 + Math.random() * 9000000)}`,
      courierName: 'GIG Logistics Tracked Air Cargo',
      estimatedDays: deliveryAddress.toLowerCase().includes('lagos') ? 1 : 2
    };
  }

  async trackShipment(trackingNumber: string) {
    return {
      status: 'in_transit',
      checkpoints: [
        { time: '10:00 AM', location: 'Ikeja Sorting Facility, Lagos', note: 'Package verified and sealed by inspector' },
        { time: '02:30 PM', location: 'Lekki Distribution Hub', note: 'Dispatched with courier van' }
      ]
    };
  }
}

// AI Listing & Price Assistant Service (Section 42, 44 & 45)
export interface AIProductAssistantService {
  suggestListingDetails(rawNotes: string, category: MarketplaceCategory): {
    suggestedTitle: string;
    suggestedDescription: string;
    suggestedStartingPrice: number;
    estimatedMarketValue: number;
    confidenceScore: number;
    recommendedIncrement: number;
    suggestedKeywords: string[];
    checklist: string[];
  };
}

export class DevelopmentAIAssistantService implements AIProductAssistantService {
  suggestListingDetails(rawNotes: string, category: MarketplaceCategory) {
    // Intelligent pricing heuristics based on category standards
    let marketVal = 450000;
    let startVal = 300000;
    let inc = 5000;

    if (category === 'Phones') {
      marketVal = 850000;
      startVal = 550000;
      inc = 10000;
    } else if (category === 'Laptops') {
      marketVal = 950000;
      startVal = 600000;
      inc = 15000;
    } else if (category === 'Solar & Power') {
      marketVal = 700000;
      startVal = 450000;
      inc = 10000;
    }

    return {
      suggestedTitle: rawNotes.length > 5 ? rawNotes : `${category} High Quality Nigerian Lot`,
      suggestedDescription: `Accredited Nigerian marketplace listing. Verified serials, authentic packaging, tested condition. Sold under NaijaAuction Protected Escrow.`,
      suggestedStartingPrice: startVal,
      estimatedMarketValue: marketVal,
      confidenceScore: 86,
      recommendedIncrement: inc,
      suggestedKeywords: ['authentic', 'warranty', 'lagos delivery', 'nigeria auction', 'original'],
      checklist: [
        'High-resolution photos showing all 4 angles included',
        'Defects or cosmetic scratches clearly disclosed',
        'Serial or IMEI registered for verification',
        'Original charger / accessories included'
      ]
    };
  }
}

export const paymentService = new DemoPaymentProvider();
export const deliveryService = new DemoDeliveryProvider();
export const aiAssistantService = new DevelopmentAIAssistantService();
