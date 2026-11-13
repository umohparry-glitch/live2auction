import React, { useState } from 'react';
import { AuctionProduct } from '../types';
import { 
  Trophy, 
  CheckCircle2, 
  CreditCard, 
  Truck, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  MapPin
} from 'lucide-react';

interface WinnerModalProps {
  product: AuctionProduct | null;
  onClose: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({ product, onClose }) => {
  const [deliveryLocation, setDeliveryLocation] = useState('Lagos');
  const [paymentStep, setPaymentStep] = useState<'review' | 'paid'>('review');

  if (!product) return null;

  const winningBid = product.winner?.bidAmount || product.currentBid;
  const deliveryFee = deliveryLocation === 'Lagos' ? product.deliveryInfo.lagosAbujaFee : product.deliveryInfo.nationwideFee;
  const buyerProtectionFee = Math.round(winningBid * 0.015); // 1.5% escrow protection
  const totalDue = winningBid + deliveryFee + buyerProtectionFee;

  const handleCompletePayment = () => {
    setPaymentStep('paid');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 my-8">
        
        {paymentStep === 'paid' ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Escrow Payment Initiated!</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Payment received into NaijaAuction Escrow. The seller ({product.seller.name}) has been notified to dispatch your package to {deliveryLocation}.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Escrow Tracking ID:</span>
                <span className="font-mono font-bold text-slate-800">#ESC-NG-{Date.now().toString().slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dispatch Window:</span>
                <span className="font-bold text-emerald-700">{product.deliveryInfo.dispatchTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inspection Period:</span>
                <span className="font-bold text-slate-800">48 Hours after delivery</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-extrabold text-xs hover:bg-black transition"
            >
              Return to Live Auction
            </button>
          </div>
        ) : (
          <>
            {/* Winner Trophy Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">
                🎉 YOU WON THE AUCTION!
              </h2>
              <p className="text-xs font-semibold text-rose-600 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Complete payment within 12 hours to secure your lot.</span>
              </p>
            </div>

            {/* Product Card */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 truncate">
                  {product.title}
                </h4>
                <div className="text-xs text-slate-500 mt-0.5">
                  Sold by {product.seller.name}
                </div>
                <div className="text-sm font-black text-emerald-700 mt-1">
                  Winning Bid: ₦{winningBid.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Delivery Destination Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700">
                Select Delivery Destination:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Lagos', 'Abuja (FCT)', 'Nationwide'].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setDeliveryLocation(loc)}
                    className={`py-2 px-3 rounded-xl font-bold border transition text-center ${
                      deliveryLocation === loc 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Winning Hammer Bid:</span>
                <span className="font-semibold text-slate-900">₦{winningBid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Verified Delivery ({deliveryLocation}):</span>
                <span className="font-semibold text-slate-900">₦{deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Escrow Buyer Protection (1.5%):</span>
                <span className="font-semibold text-slate-900">₦{buyerProtectionFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>Total Payable:</span>
                <span className="text-emerald-700">₦{totalDue.toLocaleString()}</span>
              </div>
            </div>

            {/* Escrow Badge */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-900 text-[11px] font-medium border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Funds are protected in escrow until you inspect and accept the package.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition"
              >
                Pay Later
              </button>
              <button
                onClick={handleCompletePayment}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay ₦{totalDue.toLocaleString()} (Escrow)</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
