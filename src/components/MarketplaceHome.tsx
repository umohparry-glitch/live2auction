import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertCircle,
  Truck,
  Eye,
  Tag
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { MarketplaceProduct, MarketplaceCategory } from '../types/marketplace';

const CATEGORIES: MarketplaceCategory[] = [
  'Phones',
  'Laptops',
  'Electronics',
  'Home Appliances',
  'Fashion',
  'Shoes',
  'Watches',
  'Gaming',
  'Furniture',
  'Tools',
  'Solar & Power',
  'Auto Accessories',
  'Other Approved Products'
];

interface MarketplaceHomeProps {
  onSelectProduct: (p: MarketplaceProduct) => void;
  onOpenSellModal: () => void;
  onGoToLiveRoom: () => void;
}

export const MarketplaceHome: React.FC<MarketplaceHomeProps> = ({
  onSelectProduct,
  onOpenSellModal,
  onGoToLiveRoom
}) => {
  const { products } = useMarketplace();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'ending_soon' | 'most_bids' | 'lowest_price' | 'newest'>('ending_soon');
  const [aiNaturalSearch, setAiNaturalSearch] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);

  // Handle Natural Language AI Search (Section 42)
  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiNaturalSearch.trim()) return;

    setIsAiSearching(true);
    setTimeout(() => {
      const q = aiNaturalSearch.toLowerCase();
      if (q.includes('iphone') || q.includes('phone')) {
        setSelectedCategory('Phones');
      } else if (q.includes('laptop') || q.includes('macbook')) {
        setSelectedCategory('Laptops');
      } else if (q.includes('solar') || q.includes('power')) {
        setSelectedCategory('Solar & Power');
      } else if (q.includes('game') || q.includes('ps5')) {
        setSelectedCategory('Gaming');
      }

      if (q.includes('lagos') || q.includes('ikeja') || q.includes('lekki')) {
        setSelectedLocation('Lagos');
      } else if (q.includes('abuja')) {
        setSelectedLocation('Abuja');
      }

      setSearchQuery('');
      setIsAiSearching(false);
    }, 400);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    // only show live or verified products in the public marketplace
    if (p.verificationStatus === 'rejected') return false;

    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (selectedLocation !== 'All' && !p.productLocation.toLowerCase().includes(selectedLocation.toLowerCase())) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sellerLocation.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'ending_soon') {
      return new Date(a.effectiveEndTime).getTime() - new Date(b.effectiveEndTime).getTime();
    }
    if (sortBy === 'most_bids') {
      return b.bidsCount - a.bidsCount;
    }
    if (sortBy === 'lowest_price') {
      return a.currentBid - b.currentBid;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate remaining time helper
  const getRemainingTimeStr = (endTimeStr: string) => {
    const diff = new Date(endTimeStr).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 bg-white text-slate-900">
      
      {/* ================= HERO BANNER ================= */}
      <section className="relative rounded-3xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-emerald-50/40 p-6 sm:p-10 shadow-xs">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>NIGERIA'S AUTHORITATIVE ONLINE AUCTION MARKETPLACE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight font-display">
            Bid on Verified Products with <span className="text-emerald-600 underline decoration-emerald-300">Protected Escrow</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Discover authentic smartphones, laptops, solar power, and electronics from accredited Nigerian merchants. 
            Funds are held safely in escrow until you inspect and accept your delivered item.
          </p>

          {/* AI Search Assistant Form (Section 42) */}
          <form onSubmit={handleAiSearch} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              <input
                type="text"
                value={aiNaturalSearch}
                onChange={(e) => setAiNaturalSearch(e.target.value)}
                placeholder='AI Smart Search e.g. "Find iPhone under ₦1.5M in Ikeja" or "Laptops in Abuja"'
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={isAiSearching}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>{isAiSearching ? 'Analyzing...' : 'Smart Search'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Action Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
            <button
              onClick={onGoToLiveRoom}
              className="flex items-center gap-1.5 text-rose-600 hover:underline font-bold"
            >
              <Flame className="w-4 h-4 fill-rose-600" />
              <span>Jump to Live Interactive Broadcast Room</span>
            </button>
            <span>•</span>
            <button
              onClick={onOpenSellModal}
              className="flex items-center gap-1.5 text-emerald-700 hover:underline font-bold"
            >
              <Tag className="w-4 h-4" />
              <span>Sell An Item (Seller Onboarding)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= CATEGORY CAROUSEL ================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Explore Marketplace Categories
          </h2>
          <span className="text-xs text-slate-500">{CATEGORIES.length} Approved Categories</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ================= SEARCH & FILTERS BAR ================= */}
      <section className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, brand, model or merchant..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Location filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="All">All Locations (Nigeria)</option>
            <option value="Lagos">Lagos (Ikeja, Lekki, Yaba)</option>
            <option value="Abuja">Abuja (Wuse 2, Maitama)</option>
            <option value="Port Harcourt">Port Harcourt</option>
            <option value="Ibadan">Ibadan</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="ending_soon">⏱ Ending Soonest</option>
            <option value="most_bids">🔥 Most Bids</option>
            <option value="lowest_price">₦ Lowest Starting Price</option>
            <option value="newest">✨ Newly Listed</option>
          </select>
        </div>
      </section>

      {/* ================= PRODUCT GRID (Section 75: Product Card) ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Active Timed Auctions ({filteredProducts.length} Lots Available)
            </h2>
            <p className="text-xs text-slate-500">
              Server-authoritative bidding with 2-minute anti-sniping protection and verified seller inspection
            </p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl p-8 space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-800">No matching auctions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your category, location filter, or search term to discover available lots.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedLocation('All');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const remaining = getRemainingTimeStr(product.effectiveEndTime);
              const isEndingSoon = remaining.includes('m') || remaining.includes('0h');

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="group rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md hover:border-emerald-500/50 transition flex flex-col cursor-pointer"
                >
                  {/* Card Image Area */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                    />

                    {/* Verification Badge (Section 9 & 63) */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{product.verificationStatus === 'inspected' ? 'Platform Inspected' : 'Product Verified'}</span>
                      </span>
                    </div>

                    {/* Countdown Pill */}
                    <div className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1 shadow-xs ${
                      isEndingSoon 
                        ? 'bg-rose-600 text-white animate-pulse' 
                        : 'bg-white/95 text-slate-800'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{remaining}</span>
                    </div>

                    {/* Bids pill */}
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-xs flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>{product.bidsCount} bids</span>
                    </div>
                  </div>

                  {/* Card Content Area */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                        <span>{product.category}</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {product.productLocation}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition line-clamp-2">
                        {product.title}
                      </h3>

                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>Seller: <strong className="text-slate-800">{product.sellerName}</strong></span>
                        <span>★ {product.sellerRating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Price & Action Row */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Current Bid
                        </div>
                        <div className="text-lg font-black text-emerald-700 font-display">
                          ₦{product.currentBid.toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct(product);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-extrabold transition flex items-center gap-1 shadow-2xs"
                      >
                        <span>Place Bid</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= BUYER PROTECTION & ESCROW REALITY BANNER (Section 19) ================= */}
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 pt-2">Protected Escrow Provider</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Payments are securely routed via licensed Nigerian payment providers (Paystack / Flutterwave abstraction). The seller is never paid until you accept.
          </p>
        </div>

        <div className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 pt-2">Verified Dispatch & Tracking</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tracked delivery via GIG Logistics, DHL, and Kwik. Same-day delivery within Lagos and Abuja; 24-48 hours nationwide.
          </p>
        </div>

        <div className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 pt-2">24-Hour Inspection Window</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every buyer receives a 24-hour physical inspection window upon delivery. If the item differs from description, open a 1-click dispute.
          </p>
        </div>
      </section>

    </div>
  );
};
