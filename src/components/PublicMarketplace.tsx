import React, { useEffect, useState } from 'react';
import { ArrowRight, Bookmark, Clock, Package, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

export interface PublicAuctionItem {
  id: number;
  code: string;
  title: string;
  slug: string;
  description: string;
  categoryId: number | null;
  categoryName: string;
  condition: string;
  brand: string;
  location: string;
  sellerName: string;
  startingPrice: number;
  currentBid: number;
  bidIncrement: number;
  estimatedMarketValue: number;
  status: string;
  startTime: string;
  endTime: string;
  effectiveEndTime: string;
  extensionCount: number;
  maxExtensions: number;
  winnerUsername: string | null;
  winningBidAmount: number | null;
  bidsCount: number;
  isFeatured: boolean;
  specs: string[];
  images: string[];
  isWatchlisted?: boolean;
}

interface PublicMarketplaceProps {
  initialStatusFilter?: 'all' | 'live' | 'scheduled' | 'ended';
  onSelectAuction: (auction: PublicAuctionItem) => void;
  onGoToLiveRoom: () => void;
}

export const PublicMarketplace: React.FC<PublicMarketplaceProps> = ({
  initialStatusFilter = 'all',
  onSelectAuction,
  onGoToLiveRoom,
}) => {
  const { websiteSettings, requireAuthentication, socket, showToast } = useAuth();
  const [auctions, setAuctions] = useState<PublicAuctionItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const loadData = async () => {
    try {
      const [aucsRes, catsRes] = await Promise.all([
        apiRequest<{ auctions: PublicAuctionItem[] }>('/api/public/auctions'),
        apiRequest<{ categories: { id: number; name: string }[] }>('/api/public/categories'),
      ]);
      setAuctions(aucsRes.auctions || []);
      setCategories(catsRes.categories || []);
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onBid = (payload: any) => {
      setAuctions((prev) =>
        prev.map((a) =>
          a.id === payload.auctionId
            ? {
                ...a,
                currentBid: payload.currentBid,
                bidsCount: payload.bidsCount,
                effectiveEndTime: payload.effectiveEndTime,
              }
            : a
        )
      );
    };
    const onUpdate = () => loadData();
    socket.on('auction:bid_placed', onBid);
    socket.on('auction:updated', onUpdate);
    socket.on('auction:started', onUpdate);
    socket.on('auction:closed', onUpdate);
    return () => {
      socket.off('auction:bid_placed', onBid);
      socket.off('auction:updated', onUpdate);
      socket.off('auction:started', onUpdate);
      socket.off('auction:closed', onUpdate);
    };
  }, [socket]);

  const handleToggleWatchlist = async (e: React.MouseEvent, auctionId: number) => {
    e.stopPropagation();
    requireAuthentication(async () => {
      try {
        const res = await apiRequest<{ watchlisted: boolean; message: string }>(
          `/api/auctions/${auctionId}/watchlist`,
          { method: 'POST' }
        );
        setAuctions((prev) =>
          prev.map((a) => (a.id === auctionId ? { ...a, isWatchlisted: res.watchlisted } : a))
        );
        showToast('success', 'Watchlist Updated', res.message);
      } catch (err: any) {
        showToast('error', 'Error', err?.message || 'Unable to update watchlist.');
      }
    });
  };

  const formatRemaining = (item: PublicAuctionItem) => {
    if (item.status === 'ended') return 'Auction Ended';
    if (item.status === 'cancelled') return 'Cancelled';
    if (item.status === 'paused') return 'Paused';
    const target =
      item.status === 'scheduled'
        ? new Date(item.startTime).getTime()
        : new Date(item.effectiveEndTime).getTime();
    const diff = target - nowMs;
    if (diff <= 0) return item.status === 'scheduled' ? 'Starting...' : 'Closing...';
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const prefix = item.status === 'scheduled' ? 'Starts in ' : '';
    if (hrs >= 24) {
      return `${prefix}${Math.floor(hrs / 24)}d ${hrs % 24}h`;
    }
    return `${prefix}${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const filtered = auctions.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && a.categoryName !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay = `${a.title} ${a.brand} ${a.categoryName} ${a.location} ${a.code}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero Showcase (Shown on main Auctions view) */}
      {initialStatusFilter === 'all' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-5">
            <div className="text-xs font-semibold text-emerald-700 tracking-wide">
              Verified Nigerian Marketplace · Escrow Protected
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.12] font-display text-balance">
              {websiteSettings?.heroBannerTitle ||
                'Verified Live Auctions with 100% Protected Escrow'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              {websiteSettings?.heroBannerSubtitle ||
                'Browse live, upcoming, and completed lots freely. Sign in whenever you are ready to enter the live room, place bids, or track your watchlist.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => requireAuthentication(onGoToLiveRoom)}
                className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition cursor-pointer"
              >
                <span>Enter Live Auction Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('auction-catalog');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-sm font-semibold transition cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 relative min-h-[240px] bg-slate-200">
            <img
              src={
                websiteSettings?.heroBannerImage ||
                '/src/assets/images/hero_auction_showcase_1794582937386.jpg'
              }
              alt="Featured verified auction items"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </section>
      )}

      {/* Search & Segmented Filter Controls */}
      <section id="auction-catalog" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              {statusFilter === 'scheduled'
                ? 'Upcoming Scheduled Auctions'
                : statusFilter === 'ended'
                ? 'Completed Auctions'
                : 'Auction Catalog'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {filtered.length} verified {filtered.length === 1 ? 'lot' : 'lots'} available
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item, brand, location..."
                className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {[
                { key: 'all', label: 'All' },
                { key: 'live', label: 'Live Now' },
                { key: 'scheduled', label: 'Upcoming' },
                { key: 'ended', label: 'Completed' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition cursor-pointer ${
                categoryFilter === cat.name
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Auctions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="border border-slate-200 rounded-xl overflow-hidden bg-white animate-pulse"
              >
                <div className="aspect-4/3 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  <div className="h-5 w-4/5 bg-slate-100 rounded" />
                  <div className="h-4 w-1/3 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-slate-200 rounded-2xl p-12 text-center space-y-2 bg-slate-50">
            <Package className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-900">No Matching Auctions</h3>
            <p className="text-xs text-slate-500">
              Adjust your search or category filter to view other lots.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const primaryImage = item.images[0];
              const isLive = item.status === 'live';
              const isEnded = item.status === 'ended';

              return (
                <article
                  key={item.id}
                  onClick={() => onSelectAuction(item)}
                  className="group border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  {/* 4:3 Image Container with fallback */}
                  <div className="aspect-4/3 bg-slate-100 relative overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 p-4 text-center">
                        <Package className="w-8 h-8 mb-2" />
                        <span className="text-xs font-medium">{item.title}</span>
                      </div>
                    )}

                    <button
                      onClick={(e) => handleToggleWatchlist(e, item.id)}
                      aria-label="Toggle watchlist"
                      className={`absolute top-3 right-3 p-2 rounded-lg border transition cursor-pointer ${
                        item.isWatchlisted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white/95 border-slate-200 text-slate-700 hover:text-emerald-700'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${item.isWatchlisted ? 'fill-current' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Card Body: Zero-pill unboxed metadata */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span
                          className={`font-semibold ${
                            isLive
                              ? 'text-emerald-700'
                              : isEnded
                              ? 'text-slate-600'
                              : 'text-amber-700'
                          }`}
                        >
                          {item.status === 'live'
                            ? 'Live'
                            : item.status === 'scheduled'
                            ? 'Upcoming'
                            : item.status === 'ended'
                            ? 'Completed'
                            : item.status}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.categoryName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.location}</span>
                      </div>

                      <h3 className="text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {item.title}
                      </h3>

                      <div className="text-xs text-slate-500">
                        {item.condition} · Seller: {item.sellerName}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs text-slate-500">
                            {isEnded
                              ? 'Winning Bid'
                              : item.bidsCount > 0
                              ? 'Current Bid'
                              : 'Starting Price'}
                          </div>
                          <div className="text-lg font-bold text-slate-900 tabular-nums">
                            ₦{item.currentBid.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500 tabular-nums">
                            {item.bidsCount} {item.bidsCount === 1 ? 'bid' : 'bids'}
                          </div>
                          <div className="text-xs font-mono font-semibold text-slate-800 tabular-nums flex items-center justify-end gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatRemaining(item)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAuction(item);
                        }}
                        className={`w-full py-2 px-4 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          isLive
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                        }`}
                      >
                        {isLive ? 'View & Place Bid' : 'View Lot Details'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* General Auction Rules Summary */}
      <section className="border-t border-slate-200 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
        <div className="space-y-1.5">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Escrow Settlement</span>
          </div>
          <p className="leading-relaxed">
            Every winning bid is protected by escrow until buyer inspection confirms item condition and authenticity.
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="font-semibold text-slate-900">Server-Authoritative Timers</div>
          <p className="leading-relaxed">
            Anti-sniping protection extends closing windows automatically when last-second bids arrive.
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="font-semibold text-slate-900">Transparent Bid Ledger</div>
          <p className="leading-relaxed">
            All public prices, starting bids, bid counts, and completed auction results are visible to every visitor.
          </p>
        </div>
      </section>
    </div>
  );
};
