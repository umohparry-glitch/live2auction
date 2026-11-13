import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Pause, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Award,
  Filter
} from 'lucide-react';
import { INITIAL_RECENT_BIDS, RecentSuccessfulBid } from '../data/tickerData';

interface RecentBidsTickerProps {
  latestLiveBid?: {
    productTitle: string;
    category: string;
    amount: number;
    bidder: string;
  } | null;
}

export const RecentBidsTicker: React.FC<RecentBidsTickerProps> = ({ latestLiveBid }) => {
  const [bids, setBids] = useState<RecentSuccessfulBid[]>(INITIAL_RECENT_BIDS);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeItemModal, setActiveItemModal] = useState<RecentSuccessfulBid | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // When a new live room bid arrives, dynamically prepend it as a fresh social proof entry!
  useEffect(() => {
    if (!latestLiveBid) return;

    const newBidItem: RecentSuccessfulBid = {
      id: 'live_' + Date.now(),
      productTitle: latestLiveBid.productTitle,
      category: latestLiveBid.category || 'Live Room',
      categoryIcon: '🔥',
      finalBid: latestLiveBid.amount,
      marketPrice: Math.round(latestLiveBid.amount * 1.3),
      discountPercentage: 23,
      winnerName: latestLiveBid.bidder,
      location: 'Live Room Bidder',
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      verifiedEscrow: true,
      type: 'live_room'
    };

    setBids(prev => [newBidItem, ...prev.slice(0, 24)]);
  }, [latestLiveBid]);

  // Filtered bids list
  const filteredBids = selectedCategory === 'All' 
    ? bids 
    : bids.filter(b => b.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  // Duplicate for seamless infinite marquee loop
  const displayItems = [...filteredBids, ...filteredBids];

  const handleManualScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const categories = [
    'All',
    'Phones',
    'Laptops',
    'Solar',
    'Gaming',
    'Audio',
    'Power',
    'Watches'
  ];

  return (
    <aside 
      aria-label="Recent successful bids across all categories"
      className="w-full bg-slate-900 border-t border-slate-800 text-white shadow-2xl relative z-30 transition-all select-none"
    >
      {/* Top micro-bar with header and category switcher */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 text-xs">
        
        {/* Left: Social Proof Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-extrabold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="uppercase">Live Verified Wins</span>
          </div>
          <span className="hidden sm:inline text-slate-400 text-[11px]">
            Recent successful bids across all categories
          </span>
        </div>

        {/* Center/Right: Category Quick Filters & Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 mr-1 hidden md:flex">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}

          {/* Pause / Play Toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition ml-1 shrink-0"
            title={isPaused ? 'Resume scrolling ticker' : 'Pause scrolling ticker'}
            aria-label={isPaused ? 'Play ticker' : 'Pause ticker'}
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" /> : <Pause className="w-3 h-3" />}
          </button>

          {/* Manual step controls */}
          <div className="hidden sm:flex items-center gap-0.5 ml-1 shrink-0">
            <button
              onClick={() => handleManualScroll('left')}
              className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Scroll left"
              aria-label="Previous bids"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleManualScroll('right')}
              className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Scroll right"
              aria-label="Next bids"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* The Scrolling Marquee Track Container */}
      <div 
        ref={scrollContainerRef}
        className="relative overflow-x-hidden overflow-y-hidden py-2 px-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div 
          className={`flex items-center gap-3 w-max transition-all ${
            isPaused ? '' : 'animate-ticker-continuous'
          }`}
          style={{
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        >
          {displayItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              onClick={() => setActiveItemModal(item)}
              className="group cursor-pointer flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl px-3 py-2 text-xs transition duration-150 shadow-sm shrink-0 max-w-[340px] sm:max-w-[370px]"
            >
              {/* Category Icon / Badge */}
              <div className="w-8 h-8 rounded-lg bg-slate-700/80 border border-slate-600/50 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition">
                {item.categoryIcon}
              </div>

              {/* Product Info & Price */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 leading-tight">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 truncate max-w-[120px]">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0">
                    <Clock className="w-2.5 h-2.5 text-slate-500" />
                    {item.timeAgo}
                  </span>
                </div>

                <p className="font-semibold text-slate-100 truncate text-xs mt-0.5 group-hover:text-emerald-300 transition">
                  {item.productTitle}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                    ₦{item.finalBid.toLocaleString()}
                  </span>
                  {item.discountPercentage > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/60">
                      -{item.discountPercentage}%
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 truncate flex items-center gap-0.5">
                    <Award className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    {item.winnerName}
                  </span>
                </div>
              </div>

              {/* Location Tag */}
              <div className="hidden sm:flex flex-col items-end text-right shrink-0 border-l border-slate-700/60 pl-2">
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                  {item.location.split(',')[0]}
                </span>
                <span className="text-[9px] text-emerald-400/90 font-bold flex items-center gap-0.5 mt-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  Escrow
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Proof Modal on item click */}
      {activeItemModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 text-slate-900"
          onClick={() => setActiveItemModal(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl p-2 rounded-xl bg-slate-100">{activeItemModal.categoryIcon}</span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {activeItemModal.category} • Verified Sale
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                    {activeItemModal.productTitle}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveItemModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Winning Final Bid</span>
                  <div className="text-xl font-black text-emerald-700 font-mono">
                    ₦{activeItemModal.finalBid.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500">Retail Estimate</span>
                  <div className="text-xs font-bold text-slate-400 line-through">
                    ₦{activeItemModal.marketPrice.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600">
                    Saved {activeItemModal.discountPercentage}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[11px] block">Winning Buyer</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    {activeItemModal.winnerName}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[11px] block">Delivery Location</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {activeItemModal.location}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Protected by <strong>Paystack / Flutterwave Escrow</strong>. Seller only receives funds after 24hr buyer inspection.
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveItemModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
