import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Share2, 
  Flame, 
  Info,
  DollarSign,
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { MarketplaceProduct } from '../types/marketplace';
import { useMarketplace } from '../context/MarketplaceContext';

interface MarketplaceProductDetailProps {
  product: MarketplaceProduct;
  onBack: () => void;
  onOpenOrderModal?: (orderId: string) => void;
}

export const MarketplaceProductDetail: React.FC<MarketplaceProductDetailProps> = ({
  product,
  onBack,
  onOpenOrderModal
}) => {
  const { placeMarketplaceBid } = useMarketplace();

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [bidAmountInput, setBidAmountInput] = useState(
    (product.currentBid + product.bidIncrement).toString()
  );
  const [bidFeedback, setBidFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; mins: number; secs: number }>({ hours: 0, mins: 0, secs: 0 });

  const minNextBid = product.currentBid + product.bidIncrement;

  // Countdown timer calculation
  useEffect(() => {
    const updateCountdown = () => {
      const diff = new Date(product.effectiveEndTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, mins: 0, secs: 0 });
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ hours, mins, secs });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [product.effectiveEndTime]);

  // Keep input updated when price changes
  useEffect(() => {
    setBidAmountInput((product.currentBid + product.bidIncrement).toString());
  }, [product.currentBid, product.bidIncrement]);

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(bidAmountInput.replace(/[^0-9]/g, ''));
    if (isNaN(val)) return;

    const res = placeMarketplaceBid(product.id, val, 'Umoh Parry');
    setBidFeedback(res);

    setTimeout(() => {
      setBidFeedback(null);
    }, 4000);
  };

  const handleQuickAdd = (increment: number) => {
    const current = parseFloat(bidAmountInput) || minNextBid;
    setBidAmountInput((current + increment).toString());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-white text-slate-900">
      
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span>{product.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-700 font-bold truncate max-w-xs">{product.brand}</span>
        </div>
      </div>

      {/* Main Detail Grid (Section 76) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Col: Media & Specs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Image */}
          <div className="aspect-4/3 rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 relative">
            <img
              src={product.images[activeImgIndex] || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
            />

            {/* Verification Badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1.5 rounded-full text-xs font-black bg-emerald-600 text-white flex items-center gap-1.5 shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{product.verificationStatus === 'inspected' ? 'Platform Inspected' : 'Product Verified'}</span>
              </span>
            </div>
          </div>

          {/* Thumbnail row */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition ${
                    activeImgIndex === idx ? 'border-emerald-600' : 'border-slate-200 opacity-70'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description & Warranty */}
          <div className="rounded-2xl border border-slate-200 p-6 space-y-4 bg-white">
            <h3 className="text-base font-extrabold text-slate-900">Product Overview & Specs</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>

            {product.warrantyInfo && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Warranty:</strong> {product.warrantyInfo}</span>
              </div>
            )}

            {product.serialNumber && (
              <div className="text-xs text-slate-500 font-mono">
                Serial / Registered IMEI: {product.serialNumber} (Verified by Platform Inspector)
              </div>
            )}
          </div>

          {/* Seller Profile Box (Section 77) */}
          <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Accredited Merchant
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">{product.sellerName}</h4>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{product.sellerLocation}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-black text-emerald-700">★ {product.sellerRating.toFixed(1)} / 5.0</div>
                <div className="text-[11px] text-slate-500 font-semibold">{product.sellerCompletedSales} Successful Sales</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Bidding Terminal (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="rounded-3xl border-2 border-emerald-500/80 p-6 sm:p-8 bg-white shadow-lg space-y-6">
            
            {/* Title & Condition */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800">
                  {product.condition}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ESCROW PROTECTED
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                {product.title}
              </h1>
            </div>

            {/* Countdown Clock Box */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-300">Time Remaining:</span>
              </div>
              <div className="text-lg font-mono font-black text-amber-400 tracking-wider">
                {timeLeft.hours}h {timeLeft.mins}m {timeLeft.secs}s
              </div>
            </div>

            {/* Current Bid Display */}
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Current Highest Bid</span>
                <span className="text-emerald-700 font-mono font-bold">{product.bidsCount} bids placed</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-700 font-display tracking-tight">
                ₦{product.currentBid.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                <span>Starting Price: ₦{product.startingPrice.toLocaleString()}</span>
                <span>Minimum Increment: +₦{product.bidIncrement.toLocaleString()}</span>
              </div>
            </div>

            {/* Bid Form (Section 78) */}
            <form onSubmit={handlePlaceBid} className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Bid Amount (₦ NGN):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ₦
                  </span>
                  <input
                    type="number"
                    min={minNextBid}
                    step={product.bidIncrement}
                    value={bidAmountInput}
                    onChange={(e) => setBidAmountInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 font-black text-base text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Minimum acceptable bid: <strong className="text-slate-700">₦{minNextBid.toLocaleString()}</strong>
                </div>
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex gap-2">
                {[product.bidIncrement, product.bidIncrement * 2, product.bidIncrement * 5].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => handleQuickAdd(inc)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    +₦{inc.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Bid Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Flame className="w-4 h-4 fill-white" />
                <span>Place Confirmed Bid of ₦{parseFloat(bidAmountInput || '0').toLocaleString()}</span>
              </button>
            </form>

            {/* Bid Feedback Toast */}
            {bidFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                bidFeedback.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {bidFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{bidFeedback.message}</span>
              </div>
            )}

            {/* Anti-Sniping & Delivery Highlights */}
            <div className="rounded-2xl bg-slate-50 p-4 space-y-2 text-xs border border-slate-200">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>2-Minute Anti-Sniping Rule (Section 14)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                If any valid bid is placed in the final 2 minutes, the clock automatically extends by +2 minutes to ensure fair competition.
              </p>

              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tracked Dispatch:</span>
                </span>
                <span className="font-bold text-slate-900">{product.deliveryOptions.dispatchTime}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
