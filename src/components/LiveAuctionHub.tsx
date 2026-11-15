import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  Clock, 
  Flame, 
  Calendar, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  Bell, 
  Users, 
  ChevronRight,
  Sparkles,
  Zap,
  TrendingUp,
  Tag,
  Search,
  Bookmark,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { UPCOMING_EVENTS, TODAY_SCHEDULE, WEEKLY_CALENDAR } from '../data/mockData';

interface LiveAuctionHubProps {
  onJoinLive: () => void;
  openPreBidModal: (product: any) => void;
}

export const LiveAuctionHub: React.FC<LiveAuctionHubProps> = ({
  onJoinLive,
  openPreBidModal
}) => {
  const { 
    categoryRooms, 
    activeRoom, 
    activeSlot,
    setActiveRoomId, 
    setActiveSlotId, 
    currentEvent, 
    activeProduct, 
    currentBid, 
    timeRemaining,
    allAuctionProducts,
    watchlist,
    toggleWatchlist,
    isInWatchlist,
    jumpToProductAuction
  } = useLiveAuction();

  // Category Filtering & Sorting State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'time_soonest' | 'price_lowest' | 'price_highest' | 'bids_highest'>('time_soonest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyWatchlist, setOnlyWatchlist] = useState<boolean>(false);

  // Available categories list
  const categoryFilters = [
    { id: 'all', label: 'All Lots', icon: '⚡' },
    { id: 'Phones & Tablets', label: 'Smartphones', icon: '📱' },
    { id: 'Laptops & Computers', label: 'Laptops', icon: '💻' },
    { id: 'Gaming & Consoles', label: 'Gaming', icon: '🎮' },
    { id: 'Solar & Inverters', label: 'Solar & Power', icon: '⚡' },
    { id: 'Audio & Electronics', label: 'Audio & Gear', icon: '🎧' },
    { id: 'Luxury Watches & Jewelry', label: 'Watches & Jewelry', icon: '⌚' }
  ];

  // Filter and sort auction items
  const filteredAndSortedAuctions = useMemo(() => {
    let list = [...allAuctionProducts];

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(p => 
        p.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Watchlist filter
    if (onlyWatchlist) {
      list = list.filter(p => watchlist.includes(p.id));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.specs.some(s => s.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortOrder === 'time_soonest') {
        const aTime = a.status === 'active' ? a.remainingSeconds : (a.durationSeconds + 10000);
        const bTime = b.status === 'active' ? b.remainingSeconds : (b.durationSeconds + 10000);
        return aTime - bTime;
      }
      if (sortOrder === 'price_lowest') {
        return a.currentBid - b.currentBid;
      }
      if (sortOrder === 'price_highest') {
        return b.currentBid - a.currentBid;
      }
      if (sortOrder === 'bids_highest') {
        return b.bidsCount - a.bidsCount;
      }
      return 0;
    });

    return list;
  }, [allAuctionProducts, selectedCategory, sortOrder, searchQuery, onlyWatchlist, watchlist]);

  const badges = [
    { title: '🔥 First Bid', desc: 'Placed first bid in live session', unlocked: true },
    { title: '⚡ Fast Bidder', desc: 'Counter-bid in under 3 seconds', unlocked: true },
    { title: '🏆 Auction Winner', desc: 'Won verified lot with escrow', unlocked: true },
    { title: '💎 Premium Bidder', desc: 'Participated in flagship tier', unlocked: false },
    { title: '🎯 10 Auctions Won', desc: 'Top tier community bidder', unlocked: false },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 bg-white text-slate-900">
      
      {/* ================= SECTION 1: FEATURED LIVE AUCTION HERO ================= */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
              🔴 LIVE NOW (FEATURED SHOWCASE)
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {currentEvent.viewerCount.toLocaleString()} Viewers in Room
          </span>
        </div>

        <div className="relative rounded-3xl border-2 border-emerald-500/80 bg-white p-6 sm:p-8 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>BROADCASTING LIVE FROM IKEJA & ABUJA</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-display">
              {currentEvent.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
              {currentEvent.description}
            </p>

            {/* Current Product Highlight in Hero */}
            {activeProduct && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                <img
                  src={activeProduct.images[0]}
                  alt={activeProduct.title}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                />
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    On The Block Right Now
                  </span>
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {activeProduct.title}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">Current Bid:</span>
                    <span className="text-sm font-black text-emerald-700">
                      ₦{currentBid.toLocaleString()}
                    </span>
                    <span className="text-xs text-rose-600 font-mono font-bold">
                      ⏱ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onJoinLive}
                className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2 group cursor-pointer"
              >
                <span>JOIN LIVE AUCTION</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
              <div className="text-xs text-slate-500 font-medium">
                Host: <strong className="text-slate-800">{currentEvent.hostName}</strong>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-4/3 border border-slate-200">
              <img
                src={currentEvent.banner}
                alt="Live Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                <div className="text-xs font-semibold text-emerald-300">
                  {currentEvent.sponsor?.tagline}
                </div>
                <div className="text-lg font-black mt-1">
                  100% Escrow Verified By {currentEvent.sponsor?.name}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= SECTION 1.5: ALL CATEGORY LIVE ROOMS & DAILY SLOTS ================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Live Category Rooms & Daily Slots
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Each product category operates its own live broadcast room with dedicated daily auction slots (e.g. Slot A 200 items, Slot B 350 items).
            </p>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
            {categoryRooms.length} Category Channels Online
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryRooms.map((room) => {
            const isLive = room.status === 'live';
            const totalTargetItemsInRoom = room.slots.reduce((acc, s) => acc + s.targetItemCount, 0);

            return (
              <div
                key={room.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Room Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{room.icon}</span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{room.title}</h4>
                        <span className="text-[11px] text-slate-500">{room.category}</span>
                      </div>
                    </div>

                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {room.description}
                  </p>

                  {/* Daily Slots List for this room */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>Today's Auction Slots:</span>
                      <span className="text-emerald-700">{totalTargetItemsInRoom} items total</span>
                    </div>

                    <div className="space-y-1.5">
                      {room.slots.map((slot) => {
                        const isSlotActive = slot.id === room.activeSlotId;

                        return (
                          <div
                            key={slot.id}
                            className={`p-2 rounded-xl text-xs border transition flex items-center justify-between ${
                              isSlotActive 
                                ? 'bg-emerald-50/60 border-emerald-300 font-semibold' 
                                : 'bg-slate-50/60 border-slate-200 text-slate-600'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-900">{slot.code}:</span>
                                <span className="text-slate-800 font-medium truncate max-w-[130px]">{slot.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {slot.scheduledStartTime} – {slot.scheduledEndTime}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="block font-black text-emerald-600 text-xs">
                                {slot.targetItemCount} items
                              </span>
                              <span className="text-[9px] uppercase font-bold text-slate-400">
                                {isSlotActive ? 'ON AIR' : slot.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveRoomId(room.id);
                      if (room.activeSlotId) setActiveSlotId(room.activeSlotId);
                      onJoinLive();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Enter {room.category} Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= SECTION 1.8: AUCTION EXPLORER DIRECTORY (FILTER & SORT) ================= */}
      <section className="space-y-6 pt-4 border-t border-slate-200" id="auction-directory">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Live & Upcoming Auction Catalog
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Filter by category, sort by ending soonest or lowest bid, and bookmark items to your Watchlist for real-time push alerts.
            </p>
          </div>

          {/* Quick Watchlist summary counter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyWatchlist(!onlyWatchlist)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
                onlyWatchlist
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${onlyWatchlist ? 'fill-white' : 'text-slate-400'}`} />
              <span>Watchlist Only</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                onlyWatchlist ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {watchlist.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3.5">
          {/* Top Row: Search & Sort Dropdowns */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search live lots by model, brand, or specs..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                  Sort:
                </span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="time_soonest">⏱ Time Ending Soonest</option>
                  <option value="price_lowest">💰 Lowest Current Bid</option>
                  <option value="price_highest">💎 Highest Current Bid</option>
                  <option value="bids_highest">🔥 Most Bids (Popular)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categoryFilters.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count & Active Status */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div>
            Showing <strong className="text-slate-800">{filteredAndSortedAuctions.length}</strong> auctions
            {selectedCategory !== 'all' && (
              <span> in <strong className="text-emerald-700">{selectedCategory}</strong></span>
            )}
            {onlyWatchlist && <span> (Watchlist items only)</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Instant Push Alerts on Bookmark</span>
            </span>
          </div>
        </div>

        {/* Auction Cards Grid */}
        {filteredAndSortedAuctions.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
            <Filter className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No auctions match your current criteria</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try selecting another category, clearing your search query, or disabling the Watchlist filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setOnlyWatchlist(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredAndSortedAuctions.map((prod) => {
              const inWatchlist = isInWatchlist(prod.id);
              const isOnAir = prod.status === 'active';

              return (
                <div
                  key={prod.id}
                  className={`rounded-2xl border transition-all duration-200 bg-white flex flex-col justify-between overflow-hidden group hover:shadow-md ${
                    isOnAir ? 'border-emerald-400/80 ring-1 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                      <img
                        src={prod.images[0]}
                        alt={prod.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />

                      {/* Top Overlay Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {isOnAir ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            ON AIR NOW
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white uppercase">
                            Queued Lot
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-2xs">
                          {prod.condition}
                        </span>
                      </div>

                      {/* Watchlist Bookmark Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(prod.id);
                        }}
                        className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition shadow-md ${
                          inWatchlist
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-white'
                            : 'bg-white/90 hover:bg-white text-slate-600 hover:text-emerald-700'
                        }`}
                        title={inWatchlist ? 'Remove from Watchlist' : 'Bookmark & get push notifications'}
                      >
                        <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-white' : ''}`} />
                      </button>

                      {/* Timer Pill */}
                      {isOnAir && (
                        <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[11px] font-mono font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                          <span>
                            {Math.floor(prod.remainingSeconds / 60)}:{(prod.remainingSeconds % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold uppercase tracking-wider truncate max-w-[150px]">{prod.category}</span>
                        <span>{prod.bidsCount} bids</span>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1 leading-snug group-hover:text-emerald-700 transition">
                        {prod.title}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>

                      {/* Price Section */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                            {isOnAir ? 'Current Highest Bid' : 'Starting Price'}
                          </span>
                          <span className="text-base font-black text-emerald-700">
                            ₦{prod.currentBid.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">Est. Value</span>
                          <span className="text-xs text-slate-500 line-through">
                            ₦{prod.estimatedMarketValue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-3 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => {
                        jumpToProductAuction(prod.id);
                        onJoinLive();
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isOnAir
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-900 hover:bg-black text-white'
                      }`}
                    >
                      <span>{isOnAir ? 'Tune In & Bid' : 'Enter Auction Room'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => openPreBidModal(prod)}
                      className="py-2 px-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
                      title="Place pre-bid or set proxy max"
                    >
                      Pre-Bid
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= SECTION 2: STARTING SOON & UPCOMING ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
              Upcoming Live Auctions & Special Events
            </h3>
            <p className="text-xs text-slate-500">
              Set reminders and place private pre-bids before the room goes live
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {UPCOMING_EVENTS.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                  <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-black/70 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{event.startTime}</span>
                  </div>
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-white text-slate-800 text-[10px] font-extrabold uppercase">
                    {event.eventType.replace('_', ' ')}
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                    {event.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                  <span>{event.totalProducts} catalog products</span>
                  <span>Host: {event.hostName}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 flex gap-2">
                <button
                  onClick={() => alert(`Reminder set! You will be notified 24h, 1h, and 10m before ${event.title}.`)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5 text-slate-500" />
                  <span>Remind Me</span>
                </button>
                <button
                  onClick={onJoinLive}
                  className="py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition flex items-center justify-center gap-1"
                >
                  <span>Enter Pre-Lobby</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SECTION 3: TODAY'S SCHEDULE & WEEKLY CALENDAR ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Today's Schedule (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Today's Auction Schedule</span>
            </h3>
            <span className="text-xs text-slate-500">Watertight Server Timers</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
            {TODAY_SCHEDULE.map((slot, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono font-bold text-slate-500 w-16">
                    {slot.time}
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      {slot.title}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{slot.category}</span>
                      <span>•</span>
                      <span>{slot.productsCount} items</span>
                    </div>
                  </div>
                </div>

                <div>
                  {slot.status === 'LIVE' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      LIVE NOW
                    </span>
                  ) : slot.status === 'Completed' ? (
                    <span className="text-xs font-semibold text-slate-400">
                      Concluded
                    </span>
                  ) : (
                    <button
                      onClick={() => alert(`Reminder set for ${slot.title} at ${slot.time}`)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md"
                    >
                      Remind
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Calendar (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Weekly Auction Calendar</span>
            </h3>
            <span className="text-xs text-slate-500">Recurring Hubs</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            {WEEKLY_CALENDAR.map((cal, i) => (
              <div key={i} className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      {cal.day}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({cal.time})
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    {cal.title}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  {cal.items} Lots
                </span>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ================= SECTION 4: LIGHTWEIGHT GAMIFICATION & STREAK ================= */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Community & Trust Engagement
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Live Bidder Badges & Participation Streak
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              "You're back! 3 live auctions attended this week." Badges reward genuine participation, not financial excess.
            </p>
          </div>

          <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Current Streak</div>
              <div className="text-sm font-extrabold text-slate-900">3 Sessions Attended</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {badges.map((b, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border text-center transition ${
                b.unlocked 
                  ? 'bg-white border-emerald-200 shadow-xs' 
                  : 'bg-white/60 border-slate-200 opacity-50'
              }`}
            >
              <div className="text-xl mb-1">{b.title.split(' ')[0]}</div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {b.title.split(' ').slice(1).join(' ')}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                {b.desc}
              </div>
              <span className={`inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                b.unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {b.unlocked ? 'Earned' : 'Locked'}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
