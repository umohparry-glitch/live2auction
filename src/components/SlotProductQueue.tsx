import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  Search, 
  Sparkles, 
  Flame, 
  Bell, 
  Check, 
  ArrowRight, 
  Eye, 
  ShieldCheck, 
  TrendingUp, 
  Play, 
  ChevronRight,
  Filter,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { AuctionProduct } from '../types';

interface SlotProductQueueProps {
  openPreBidModal: (product: AuctionProduct) => void;
  openWeekScheduleModal: (targetSlotId?: string) => void;
  onJumpToProduct?: (productId: string) => void;
}

export const SlotProductQueue: React.FC<SlotProductQueueProps> = ({
  openPreBidModal,
  openWeekScheduleModal,
  onJumpToProduct
}) => {
  const {
    activeRoom,
    activeSlot,
    activeProductIndex,
    activeProduct,
    watchlist,
    toggleWatchlist,
    userRole,
    simulateTwoMinuteClosingAlert
  } = useLiveAuction();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'watchlisted'>('all');

  const products: AuctionProduct[] = activeSlot?.products || [];

  // Filter products based on search and active tab
  const filteredProducts = useMemo(() => {
    return products.map((prod, originalIndex) => ({
      ...prod,
      queueIndex: originalIndex + 1,
      isCurrentlyOnAir: originalIndex === activeProductIndex,
      isUpNext: originalIndex === activeProductIndex + 1,
      isPast: originalIndex < activeProductIndex,
      isUpcoming: originalIndex > activeProductIndex
    })).filter((prod) => {
      // Tab filter
      if (filterTab === 'upcoming' && prod.isPast) return false;
      if (filterTab === 'watchlisted' && !watchlist.includes(prod.id)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = prod.title.toLowerCase().includes(q);
        const matchesCategory = prod.category.toLowerCase().includes(q);
        const matchesSpecs = prod.specs.some(s => s.toLowerCase().includes(q));
        const matchesSeller = prod.seller.name.toLowerCase().includes(q);
        return matchesTitle || matchesCategory || matchesSpecs || matchesSeller;
      }
      return true;
    });
  }, [products, activeProductIndex, filterTab, searchQuery, watchlist]);

  // Calculate estimated wait time for an upcoming lot
  const getEstimatedWaitTime = (index: number) => {
    if (index === activeProductIndex) return 'On Air Now';
    if (index < activeProductIndex) return 'Ended';
    const lotsAhead = index - activeProductIndex;
    if (lotsAhead === 1) {
      const remainingSecs = activeProduct?.remainingSeconds || 90;
      return `Up Next (~${remainingSecs}s)`;
    }
    const minsAhead = (lotsAhead - 1) * 1.5 + Math.ceil((activeProduct?.remainingSeconds || 90) / 60);
    return `~${Math.round(minsAhead)}m in queue`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[740px] overflow-hidden">
      
      {/* Header: Slot Badge, Name & Schedule Launcher */}
      <div className="p-3.5 border-b border-slate-200/90 bg-slate-50/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
              {activeSlot.code}
            </span>
            <span className="font-extrabold text-xs text-slate-900 truncate max-w-[150px]">
              {activeSlot.name}
            </span>
          </div>

          {/* Button to explore week range schedule */}
          <button
            onClick={() => openWeekScheduleModal(activeSlot.id)}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            title="View full week schedule and list of available items for today and tomorrow"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Week Slots & Items</span>
          </button>
        </div>

        {/* Slot Quota Progress Tracker */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            Queue: <strong className="text-slate-900">{products.length} Scheduled Lots</strong>
          </span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>{activeSlot.scheduledStartTime} – {activeSlot.scheduledEndTime}</span>
          </span>
        </div>

        {/* Search & Tabs */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items in this slot queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 mt-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition cursor-pointer ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Lots ({products.length})
          </button>
          <button
            onClick={() => setFilterTab('upcoming')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition cursor-pointer ${
              filterTab === 'upcoming'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Next in Queue ({products.length - activeProductIndex})
          </button>
          <button
            onClick={() => setFilterTab('watchlisted')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer ${
              filterTab === 'watchlisted'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Bell className="w-2.5 h-2.5 text-emerald-600" />
            <span>Saved ({watchlist.filter(id => products.some(p => p.id === id)).length})</span>
          </button>
        </div>
      </div>

      {/* Product Queue List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold">No items match your search in this slot queue.</p>
            <button
              onClick={() => { setSearchQuery(''); setFilterTab('all'); }}
              className="mt-2 text-[11px] text-emerald-600 font-bold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const isSaved = watchlist.includes(prod.id);
            const isWithinTwoMinutes = prod.isCurrentlyOnAir && prod.remainingSeconds <= 120 && prod.remainingSeconds > 0;
            const waitTime = getEstimatedWaitTime(prod.queueIndex - 1);

            return (
              <div
                key={prod.id}
                className={`rounded-xl border transition-all duration-200 p-2.5 relative ${
                  prod.isCurrentlyOnAir
                    ? 'bg-emerald-50/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/50'
                    : prod.isUpNext
                    ? 'bg-amber-50/30 border-amber-300 shadow-xs'
                    : prod.isPast
                    ? 'bg-slate-50/60 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                {/* Header row in card: Lot Sequence, Badge & Estimated Time */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                      prod.isCurrentlyOnAir 
                        ? 'bg-emerald-700 text-white' 
                        : prod.isUpNext
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      Lot #{prod.queueIndex}
                    </span>

                    {prod.isCurrentlyOnAir ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        ON AIR NOW
                      </span>
                    ) : prod.isUpNext ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                        UP NEXT
                      </span>
                    ) : prod.isPast ? (
                      <span className="text-[9px] font-bold text-slate-400">
                        Completed
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Queued
                      </span>
                    )}

                    {isWithinTwoMinutes && (
                      <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-rose-600 text-white animate-pulse">
                        &lt;2m Left
                      </span>
                    )}
                  </div>

                  {/* Estimated wait time */}
                  <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                    prod.isCurrentlyOnAir 
                      ? 'text-rose-600 font-mono font-bold' 
                      : prod.isUpNext
                      ? 'text-amber-700 font-bold'
                      : 'text-slate-400'
                  }`}>
                    <Clock className="w-2.5 h-2.5" />
                    <span>{waitTime}</span>
                  </span>
                </div>

                {/* Body row: Image, Title, Price */}
                <div className="flex gap-2.5">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={prod.images[0]}
                      alt={prod.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] font-bold text-center py-0.2 truncate">
                      {prod.condition}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                      {prod.title}
                    </h4>

                    {/* Pricing */}
                    <div className="flex items-baseline justify-between gap-1 mt-1">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-medium">
                          {prod.isCurrentlyOnAir ? 'Current Bid' : 'Starting Price'}
                        </span>
                        <span className="font-mono font-extrabold text-xs text-emerald-700">
                          ₦{(prod.isCurrentlyOnAir ? prod.currentBid : prod.startingPrice).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block font-medium">Market Est.</span>
                        <span className="text-[11px] text-slate-500 line-through">
                          ₦{prod.estimatedMarketValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Pre-Bid, Watchlist, Jump */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {/* Watchlist Toggle */}
                    <button
                      onClick={() => toggleWatchlist(prod.id)}
                      className={`p-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                        isSaved
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      title={isSaved ? 'Saved in Watchlist (2-min native alert active)' : 'Add to Watchlist for 2-minute native closing alert'}
                    >
                      <Bell className={`w-3 h-3 ${isSaved ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
                      <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Remind'}</span>
                    </button>

                    {/* Pre-bid count indicator */}
                    {prod.bidsCount > 0 && (
                      <span className="text-[10px] text-slate-500 font-semibold px-1.5 py-0.5 bg-slate-100 rounded">
                        {prod.bidsCount} bids
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {prod.isCurrentlyOnAir ? (
                      <button
                        onClick={() => {
                          const bidStage = document.getElementById('bid-input') || document.querySelector('button[id*="quick-bid"]');
                          bidStage?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <span>Bid Live Now</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => openPreBidModal(prod)}
                        disabled={prod.isPast}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 text-slate-800 hover:text-emerald-800 font-extrabold text-[10px] transition flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-40"
                      >
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        <span>Pre-Bid</span>
                      </button>
                    )}

                    {/* Host / Admin queue controls */}
                    {(userRole === 'admin' || userRole === 'host') && !prod.isCurrentlyOnAir && !prod.isPast && onJumpToProduct && (
                      <button
                        onClick={() => onJumpToProduct(prod.id)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition"
                        title="Host: Bring this lot on air now"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Footer Banner: Switch Day & Slots */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span>Today's Slot Progress:</span>
          <span className="font-bold text-slate-900">
            {activeSlot.completedItemsCount} of {activeSlot.targetItemCount} lots completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round((activeSlot.completedItemsCount / activeSlot.targetItemCount) * 100))}%` }}
          />
        </div>

        <button
          onClick={() => openWeekScheduleModal()}
          className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs mt-1"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Browse Tomorrow & 7-Day Slot Items</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </button>
      </div>

    </div>
  );
};
