import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Eye,
  BarChart3,
  Gavel,
  Radio,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Cell 
} from 'recharts';
import { useMarketplace } from '../context/MarketplaceContext';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { MarketplaceProduct, MarketplaceCategory, OrderStatus } from '../types/marketplace';
import { calculatePlatformCommission } from '../data/marketplaceData';

interface SellerDashboardProps {
  onOpenNewProductModal: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ onOpenNewProductModal }) => {
  const { products, orders, updateOrderStatus } = useMarketplace();
  const { categoryRooms, allAuctionProducts } = useLiveAuction();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeChartTab, setActiveChartTab] = useState<'sales_trend' | 'win_vs_reserve' | 'category_breakdown'>('sales_trend');

  // Filter seller specific items
  const sellerProducts = products.filter(p => p.sellerId === 'seller_ikeja_hub');
  const sellerOrders = orders.filter(o => o.sellerId === 'seller_ikeja_hub');

  // Metrics calculation
  const totalGmv = useMemo(() => {
    return sellerOrders.reduce((sum, o) => sum + o.hammerPrice, 0) + 18500000; // Includes recent verified settlements
  }, [sellerOrders]);

  const totalCommission = useMemo(() => {
    return Math.round(totalGmv * 0.05); // 5% tier
  }, [totalGmv]);

  const totalNetPayout = useMemo(() => {
    return totalGmv - totalCommission;
  }, [totalGmv, totalCommission]);

  // Active Auctions Count
  const activeAuctionsCount = useMemo(() => {
    return allAuctionProducts.filter(p => p.status === 'active' || p.status === 'upcoming').length + sellerProducts.length;
  }, [allAuctionProducts, sellerProducts]);

  const onAirAuctionsCount = useMemo(() => {
    return allAuctionProducts.filter(p => p.status === 'active').length;
  }, [allAuctionProducts]);

  // Average Winning Bid Amount
  const completedAuctionsCount = 46;
  const averageWinningBid = useMemo(() => {
    return Math.round(totalGmv / completedAuctionsCount);
  }, [totalGmv]);

  const averageReservePrice = 330000;
  const averageReserveUplift = Math.round(((averageWinningBid - averageReservePrice) / averageReservePrice) * 100);

  // Chart Data 1: Sales Trend (30 Days GMV & Volume)
  const salesTrendData = useMemo(() => {
    if (timeframe === '7d') {
      return [
        { period: 'Mon', gmv: 2100000, displayGmv: '2.1M', completedLots: 5, avgBid: 420000 },
        { period: 'Tue', gmv: 3400000, displayGmv: '3.4M', completedLots: 8, avgBid: 425000 },
        { period: 'Wed', gmv: 2800000, displayGmv: '2.8M', completedLots: 6, avgBid: 466000 },
        { period: 'Thu', gmv: 4200000, displayGmv: '4.2M', completedLots: 9, avgBid: 466000 },
        { period: 'Fri', gmv: 5600000, displayGmv: '5.6M', completedLots: 11, avgBid: 509000 },
        { period: 'Sat', gmv: 7100000, displayGmv: '7.1M', completedLots: 14, avgBid: 507000 },
        { period: 'Sun', gmv: 6200000, displayGmv: '6.2M', completedLots: 12, avgBid: 516000 },
      ];
    } else if (timeframe === '90d') {
      return [
        { period: 'Month 1', gmv: 18400000, displayGmv: '18.4M', completedLots: 42, avgBid: 438000 },
        { period: 'Month 2', gmv: 24600000, displayGmv: '24.6M', completedLots: 55, avgBid: 447000 },
        { period: 'Month 3', gmv: 31200000, displayGmv: '31.2M', completedLots: 68, avgBid: 458000 },
      ];
    } else {
      // 30 Days (Weeks)
      return [
        { period: 'Week 1', gmv: 6800000, displayGmv: '6.8M', completedLots: 14, avgBid: 485000 },
        { period: 'Week 2', gmv: 9200000, displayGmv: '9.2M', completedLots: 18, avgBid: 511000 },
        { period: 'Week 3', gmv: 11500000, displayGmv: '11.5M', completedLots: 22, avgBid: 522000 },
        { period: 'Week 4', gmv: 14800000, displayGmv: '14.8M', completedLots: 28, avgBid: 528000 },
      ];
    }
  }, [timeframe]);

  // Chart Data 2: Average Winning Bid vs. Starting Reserve Price by Category
  const categoryWinningBidsData = [
    {
      category: 'Smartphones',
      startingReserve: 450000,
      avgWinningBid: 685000,
      activeLots: 6,
      premiumGain: '+52%'
    },
    {
      category: 'Laptops',
      startingReserve: 520000,
      avgWinningBid: 710000,
      activeLots: 5,
      premiumGain: '+36%'
    },
    {
      category: 'Solar & Power',
      startingReserve: 380000,
      avgWinningBid: 495000,
      activeLots: 4,
      premiumGain: '+30%'
    },
    {
      category: 'Gaming Consoles',
      startingReserve: 320000,
      avgWinningBid: 440000,
      activeLots: 3,
      premiumGain: '+37%'
    },
    {
      category: 'Audio & Gear',
      startingReserve: 95000,
      avgWinningBid: 142000,
      activeLots: 4,
      premiumGain: '+49%'
    },
    {
      category: 'Luxury Watches',
      startingReserve: 750000,
      avgWinningBid: 1050000,
      activeLots: 2,
      premiumGain: '+40%'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-white text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              ACCREDITED MERCHANT (COMPUTER VILLAGE)
            </span>
            <span className="text-xs font-mono text-slate-400">ID: #SLR-IKEJA-142</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Seller Performance & Auction Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Real-time analytics on total sales volume, active live auctions, hammer price premiums, and instant order payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            {(['7d', '30d', '90d'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  timeframe === t ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenNewProductModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>List Product for Auction</span>
          </button>
        </div>
      </div>

      {/* ================= CORE METRICS SUMMARY: SALES, ACTIVE AUCTIONS, AVG WINNING BID ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Metric 1: Total Sales */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Total Sales (GMV)</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +24.8%
            </span>
          </div>
          
          <div className="text-3xl font-black text-slate-900 mt-2">
            ₦{totalGmv.toLocaleString()}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              <span className="block text-[10px] text-slate-400">Net Seller Payout</span>
              <strong className="text-emerald-700 font-extrabold">₦{totalNetPayout.toLocaleString()}</strong>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-slate-400">5% Platform Escrow</span>
              <span className="font-semibold text-slate-600">₦{totalCommission.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Auctions */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-600" />
              <span>Active Auctions</span>
            </span>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
              {onAirAuctionsCount} ON AIR
            </span>
          </div>

          <div className="text-3xl font-black text-slate-900 mt-2">
            {activeAuctionsCount} <span className="text-sm font-semibold text-slate-500">Lots Live / Scheduled</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              <span className="block text-[10px] text-slate-400">Scheduled Slots</span>
              <strong className="text-slate-800 font-extrabold">{activeAuctionsCount - onAirAuctionsCount} Queued Lots</strong>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-slate-400">Active Category Channels</span>
              <span className="font-semibold text-slate-600">{categoryRooms.length} Category Rooms</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Average Winning Bid Amount */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md transition sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Gavel className="w-4 h-4 text-blue-600" />
              <span>Average Winning Bid</span>
            </span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {completedAuctionsCount} Completed Lots
            </span>
          </div>

          <div className="text-3xl font-black text-slate-900 mt-2">
            ₦{averageWinningBid.toLocaleString()}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              <span className="block text-[10px] text-slate-400">Competitive Premium</span>
              <strong className="text-emerald-700 font-extrabold">+{averageReserveUplift}% vs Reserve Price</strong>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-slate-400">Sell-Through Rate</span>
              <span className="font-semibold text-slate-800">96.4% Won</span>
            </div>
          </div>
        </div>

      </section>

      {/* ================= BASIC DATA VISUALIZATION (RECHARTS) ================= */}
      <section className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-6">
        
        {/* Chart Header & Tab Switching */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                Data Visualizations & Auction Performance
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive charts illustrating sales trends, active lot distribution, and winning bids compared to starting reserve prices.
            </p>
          </div>

          {/* Visual switcher tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveChartTab('sales_trend')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 whitespace-nowrap ${
                activeChartTab === 'sales_trend' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sales Volume Trend
            </button>
            <button
              onClick={() => setActiveChartTab('win_vs_reserve')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 whitespace-nowrap ${
                activeChartTab === 'win_vs_reserve' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Winning Bid vs. Reserve
            </button>
            <button
              onClick={() => setActiveChartTab('category_breakdown')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 whitespace-nowrap ${
                activeChartTab === 'category_breakdown' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active Lots by Category
            </button>
          </div>
        </div>

        {/* Chart Container 1: Sales Volume (GMV) Trend Area Chart */}
        {activeChartTab === 'sales_trend' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600" />
                  <strong>Gross Merchandise Value (GMV)</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Winning Lots Hammered</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Values in Nigerian Naira (₦)</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 12, fill: '#64748B' }} 
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'gmv') return [`₦${Number(value).toLocaleString()}`, 'Total Sales GMV'];
                      if (name === 'completedLots') return [value, 'Completed Auctions'];
                      return [value, name];
                    }}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', border: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gmv" 
                    stroke="#059669" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#gmvGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart Container 2: Average Winning Bid vs. Starting Reserve Price */}
        {activeChartTab === 'win_vs_reserve' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-600" />
                  <strong>Average Winning Bid (Hammer Price)</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-slate-300" />
                  <span>Starting Reserve Price</span>
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Live anti-sniping drives +30% to +52% premium over reserve
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryWinningBidsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'avgWinningBid') return [`₦${Number(value).toLocaleString()}`, 'Average Winning Bid'];
                      if (name === 'startingReserve') return [`₦${Number(value).toLocaleString()}`, 'Starting Reserve'];
                      return [value, name];
                    }}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', border: 'none' }}
                  />
                  <Bar dataKey="startingReserve" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="startingReserve" />
                  <Bar dataKey="avgWinningBid" fill="#059669" radius={[4, 4, 0, 0]} name="avgWinningBid" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart Container 3: Active Auctions & Bids Density by Category */}
        {activeChartTab === 'category_breakdown' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">
                Distribution of Currently Active and Scheduled Auction Lots
              </span>
              <span className="text-[11px] text-slate-500">Updated in real time</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryWinningBidsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip 
                    formatter={(value: any) => [`${value} active lots`, 'Inventory Volume']}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', border: 'none' }}
                  />
                  <Bar dataKey="activeLots" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </section>

      {/* ================= PENDING ORDERS & FULFILMENT STATE MACHINE ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <span>Pending Orders & Fulfilment State Machine</span>
            </h2>
            <p className="text-xs text-slate-500">
              Orders won by buyers awaiting merchant dispatch or inspection signoff
            </p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100 bg-white">
            {sellerOrders.map(order => (
              <div key={order.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex items-center gap-4">
                  <img
                    src={order.productImage}
                    alt={order.productTitle}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">#{order.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        order.status === 'buyer_inspection' 
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-extrabold text-slate-900 mt-0.5">
                      {order.productTitle}
                    </h4>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                      <span>Buyer: <strong className="text-slate-800">{order.buyerName}</strong></span>
                      <span>•</span>
                      <span>Winning Bid: <strong>₦{order.hammerPrice.toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>Payout: <strong className="text-emerald-700">₦{order.sellerPayoutAmount.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* State Transition Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {order.status === 'seller_processing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'in_transit')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      Dispatch Courier
                    </button>
                  )}
                  {order.status === 'in_transit' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'buyer_inspection')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                    >
                      Mark Delivered
                    </button>
                  )}
                  {order.status === 'buyer_inspection' && (
                    <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Buyer inspecting (24h)</span>
                    </span>
                  )}
                  {order.status === 'completed' && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Payout Settled</span>
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seller Listed Lots */}
      <section className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          <span>Your Active & Reviewed Product Lots</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sellerProducts.map(prod => (
            <div key={prod.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center gap-3">
                <img src={prod.images[0]} alt={prod.title} className="w-12 h-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">{prod.title}</h4>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                    prod.verificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {prod.verificationStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                <span>Current Bid:</span>
                <span className="font-bold text-slate-900">₦{prod.currentBid.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
