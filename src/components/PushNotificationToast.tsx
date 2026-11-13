import React from 'react';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { Bell, Clock, ArrowRight, X, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface PushNotificationToastProps {
  onGoToRoom?: () => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({ onGoToRoom }) => {
  const { activeToastNotification, dismissToastNotification, jumpToProductAuction } = useLiveAuction();

  if (!activeToastNotification) return null;

  const handleActionClick = () => {
    if (activeToastNotification.productId) {
      jumpToProductAuction(activeToastNotification.productId);
    }
    if (onGoToRoom) {
      onGoToRoom();
    }
    dismissToastNotification();
  };

  const isEndingSoon = activeToastNotification.type === 'ending_soon';
  const isPriceChange = activeToastNotification.type === 'price_change';

  return (
    <div className="fixed top-20 inset-x-3 sm:inset-x-auto sm:right-4 z-50 sm:w-96 max-w-md animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto">
      <div className={`p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
        isEndingSoon
          ? 'bg-rose-950/95 border-rose-500/80 text-white shadow-rose-900/30'
          : isPriceChange
          ? 'bg-slate-900/95 border-emerald-500/80 text-white shadow-emerald-950/40'
          : 'bg-slate-900/95 border-slate-700 text-white shadow-slate-950/40'
      }`}>
        <div className="flex items-start gap-3">
          {/* Icon Badge */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
            isEndingSoon 
              ? 'bg-rose-600 text-white animate-pulse' 
              : isPriceChange
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 text-white'
          }`}>
            {isEndingSoon ? (
              <Clock className="w-5 h-5 animate-spin" />
            ) : isPriceChange ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isEndingSoon 
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40'
                  : isPriceChange
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                  : 'bg-blue-500/30 text-blue-300 border border-blue-400/40'
              }`}>
                {isEndingSoon ? '⏱ Ending Soon Push Alert' : isPriceChange ? '🔔 Watchlist Price Update' : 'Live Push Alert'}
              </span>
              <button
                onClick={dismissToastNotification}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-1">
              {activeToastNotification.title}
            </h4>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
              {activeToastNotification.message}
            </p>

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
              <button
                onClick={handleActionClick}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                  isEndingSoon
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                }`}
              >
                <span>View Auction & Bid</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={dismissToastNotification}
                className="py-1.5 px-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
