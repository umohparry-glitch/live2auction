import React from 'react';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { 
  Bookmark, 
  Trash2, 
  ArrowRight, 
  Radio, 
  Clock, 
  Bell, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  X,
  Play
} from 'lucide-react';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToRoom: () => void;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({ isOpen, onClose, onGoToRoom }) => {
  const { 
    watchlistItems, 
    toggleWatchlist, 
    notificationPermission, 
    requestNotificationPermission, 
    simulateWatchlistPriceChange, 
    simulateWatchlistEndingSoon,
    simulateTwoMinuteClosingAlert,
    setLotTimerForTesting,
    isNativeNotificationSupported,
    jumpToProductAuction,
    allAuctionProducts
  } = useLiveAuction();

  if (!isOpen) return null;

  const handleTuneIn = (productId: string) => {
    jumpToProductAuction(productId);
    onGoToRoom();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Bookmark className="w-5 h-5 fill-emerald-700 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  Your Watchlist
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  {watchlistItems.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated device push notifications trigger within 2 minutes of closing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold text-sm transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Push Notification Permission Status Banner */}
        <div className="px-5 py-3 bg-slate-100/90 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Push Status:{' '}
              {notificationPermission === 'granted' ? (
                <strong className="text-emerald-700 font-bold">Enabled (Active 🟢) — 2-Min Alerts Live</strong>
              ) : notificationPermission === 'denied' ? (
                <strong className="text-rose-600 font-bold">Blocked in Browser</strong>
              ) : (
                <strong className="text-amber-700 font-bold">Ready to Enable (Native 2-Min Push)</strong>
              )}
            </span>
          </div>

          {notificationPermission !== 'granted' && (
            <button
              onClick={() => requestNotificationPermission()}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition shrink-0"
            >
              Enable Browser Push
            </button>
          )}
        </div>

        {/* Quick Simulation & Test Strip */}
        <div className="px-5 py-2.5 bg-emerald-50/50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Test Push Alerts:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => simulateTwoMinuteClosingAlert()}
              disabled={watchlistItems.length === 0}
              className="px-2 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] transition disabled:opacity-40 shadow-2xs flex items-center gap-1"
              title="Triggers the native browser notification for items within 2 minutes of closing"
            >
              <Clock className="w-3 h-3" />
              <span>⏳ 2-Min Alert</span>
            </button>
            <button
              onClick={() => simulateWatchlistPriceChange()}
              disabled={watchlistItems.length === 0}
              className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-bold text-[10px] transition disabled:opacity-40"
              title="Triggers a simulated competitor bid and price push alert on your first watchlisted item"
            >
              ⚡ Price Change
            </button>
            <button
              onClick={() => simulateWatchlistEndingSoon()}
              disabled={watchlistItems.length === 0}
              className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-bold text-[10px] transition disabled:opacity-40"
              title="Triggers a 30-second final countdown alert"
            >
              ⏱ Ending Soon
            </button>
          </div>
        </div>

        {/* Watchlisted Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {watchlistItems.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bookmark className="w-8 h-8" />
              </div>
              <div className="max-w-xs mx-auto space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900">Your Watchlist is Empty</h4>
                <p className="text-xs text-slate-500">
                  Bookmark auctions from the Live Auction Hub or room to track bids and get automated price & countdown alerts.
                </p>
              </div>

              {/* Suggestions to add */}
              <div className="pt-4 border-t border-slate-100 text-left">
                <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Popular Lots to Watch
                </div>
                <div className="space-y-2">
                  {allAuctionProducts.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
                    >
                      <img src={item.images[0]} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                        <div className="text-[11px] text-emerald-700 font-extrabold">₦{item.currentBid.toLocaleString()}</div>
                      </div>
                      <button
                        onClick={() => toggleWatchlist(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                      >
                        + Watch
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            watchlistItems.map((product) => {
              const isOnAir = product.status === 'active';
              const isWithinTwoMinutes = isOnAir && product.remainingSeconds <= 120 && product.remainingSeconds > 0;

              return (
                <div
                  key={product.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isWithinTwoMinutes
                      ? 'bg-rose-50/70 border-rose-300 shadow-sm ring-1 ring-rose-400/40'
                      : isOnAir 
                      ? 'bg-emerald-50/30 border-emerald-300 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {product.category}
                          </span>
                          {isOnAir ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              ON AIR NOW
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                              {product.status}
                            </span>
                          )}
                          {isWithinTwoMinutes && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse shadow-xs">
                              <Clock className="w-2.5 h-2.5" />
                              &lt; 2 MINS LEFT
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => toggleWatchlist(product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-xs font-extrabold text-slate-900 mt-1 leading-snug line-clamp-1">
                        {product.title}
                      </h4>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Current Bid</span>
                          <span className="font-black text-emerald-700 text-sm">
                            ₦{product.currentBid.toLocaleString()}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Timer</span>
                          {isOnAir ? (
                            <span className={`font-mono font-bold text-xs flex items-center gap-1 justify-end ${
                              isWithinTwoMinutes ? 'text-rose-600 font-extrabold' : 'text-slate-700'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>{Math.floor(product.remainingSeconds / 60)}:{(product.remainingSeconds % 60).toString().padStart(2, '0')}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-600">
                              In Queue
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <button
                          onClick={() => handleTuneIn(product.id)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs min-w-[120px]"
                        >
                          <span>{isOnAir ? 'Jump to Live Room & Bid' : 'View Room & Slot'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => simulateTwoMinuteClosingAlert(product.id)}
                          className="py-1.5 px-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold transition"
                          title="Test 2-minute closing browser push alert for this lot"
                        >
                          ⏳ Test 2-Min Alert
                        </button>

                        {isOnAir && (
                          <button
                            onClick={() => setLotTimerForTesting(product.id, 125)}
                            className="py-1.5 px-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-[10px] font-medium transition"
                            title="Set timer to 2:05 (125 seconds) to watch it tick down to 2:00 and trigger automatically"
                          >
                            ⏱ 2:05 Test
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Escrow & Anti-Sniping Protection</span>
          </div>
          <span>NaijaAuction Push Engine</span>
        </div>

      </div>
    </div>
  );
};
