import React, { useState } from 'react';
import { AuctionProduct } from '../types';
import { Zap, ShieldCheck, Lock, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { sounds } from '../utils/audio';

interface PreBidModalProps {
  product: AuctionProduct | null;
  onClose: () => void;
}

export const PreBidModal: React.FC<PreBidModalProps> = ({ product, onClose }) => {
  const { setProxyMaxBid } = useLiveAuction();
  const [maxAmount, setMaxAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const val = parseFloat(maxAmount.replace(/[^0-9]/g, ''));
    if (isNaN(val) || val <= product.startingPrice) {
      setErrorMsg(`Pre-bid must exceed the starting price of ₦${product.startingPrice.toLocaleString()}`);
      return;
    }
    setProxyMaxBid(product.id, val);
    sounds.playUserBidSuccessSound();
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
      setIsSuccess(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Place Secret Pre-Bid</h3>
              <p className="text-[11px] text-slate-500">Activates automatically when live</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Pre-Bid Accepted!</h4>
            <p className="text-xs text-slate-600">
              Your maximum bid of ₦{parseFloat(maxAmount).toLocaleString()} has been securely stored.
              You don't need to stay online; the system will proxy bid for you.
            </p>
          </div>
        ) : (
          <>
            {/* Product Summary */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
              />
              <div className="flex-1">
                <h4 className="text-xs font-extrabold text-slate-900 truncate max-w-[240px]">
                  {product.title}
                </h4>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Starting: <strong className="text-slate-900">₦{product.startingPrice.toLocaleString()}</strong> • Inc: +₦{product.bidIncrement.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1 font-bold text-emerald-800">
                <Lock className="w-3.5 h-3.5" />
                <span>100% Confidential Maximum Amount</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                No bidder, spectator, or seller can view your maximum ceiling. The system bids the minimum necessary to keep you winning.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Maximum Pre-Bid Amount (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ₦
                  </span>
                  <input
                    type="number"
                    min={product.startingPrice + product.bidIncrement}
                    step={product.bidIncrement}
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder={`e.g. ${product.startingPrice + product.bidIncrement * 5}`}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs"
                >
                  Submit Pre-Bid
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};
