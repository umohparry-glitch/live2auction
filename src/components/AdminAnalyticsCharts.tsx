import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface HourlyVelocityPoint {
  hourKey: string;
  label: string;
  bidsPerHour: number;
  uniqueBidders: number;
  bidVolume: number;
}

export interface DailyMetricPoint {
  date: string;
  label: string;
  bidsCount: number;
  dailyVolume: number;
  settledVolume: number;
  cumulativeVolume: number;
  activeBidders: number;
  discussionParticipants: number;
  newRegistrations: number;
  totalParticipation: number;
}

export interface CategoryStatPoint {
  category: string;
  count: number;
  totalBidVolume: number;
}

export interface OverviewAnalyticsPayload {
  velocitySummary?: {
    bidsLastHour: number;
    bidsLast24h: number;
    avgBidsPerHour: number;
    peakHourlyVelocity: number;
  };
  volumeSummary?: {
    totalAuctionVolume: number;
    settledVolume: number;
    totalHistoricalBidVolume: number;
    avgBidAmount: number;
  };
  participationSummary?: {
    todayActiveBidders: number;
    todayNewRegistrations: number;
    todayDiscussionUsers: number;
    fourteenDayBidTotal: number;
  };
  hourlyVelocitySeries?: HourlyVelocityPoint[];
  dailySeries?: DailyMetricPoint[];
}

interface AdminAnalyticsChartsProps {
  analytics?: OverviewAnalyticsPayload | null;
  categoryStats?: CategoryStatPoint[];
}

function formatCompactNaira(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '₦0';
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₦${Math.round(value / 1_000)}K`;
  return `₦${value.toLocaleString()}`;
}

interface TooltipPayloadEntry {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
}

const ChartTooltipCard: React.FC<{
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  currencyKeys?: string[];
}> = ({ active, payload, label, currencyKeys = [] }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-xs space-y-1">
      <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">{label}</div>
      {payload.map((entry, idx) => {
        const isCurrency = entry.dataKey ? currencyKeys.includes(entry.dataKey) : false;
        const val = Number(entry.value || 0);
        return (
          <div key={idx} className="flex items-center justify-between gap-4 tabular-nums">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span
                className="w-2 h-2 rounded-xs shrink-0"
                style={{ backgroundColor: entry.color || '#059669' }}
              />
              <span>{entry.name}</span>
            </span>
            <span className="font-semibold text-slate-900">
              {isCurrency ? `₦${val.toLocaleString()}` : val.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const AdminAnalyticsCharts: React.FC<AdminAnalyticsChartsProps> = ({
  analytics,
  categoryStats = [],
}) => {
  const [velocityMode, setVelocityMode] = useState<'hourly' | 'daily'>('hourly');

  const velocitySummary = analytics?.velocitySummary || {
    bidsLastHour: 0,
    bidsLast24h: 0,
    avgBidsPerHour: 0,
    peakHourlyVelocity: 0,
  };
  const volumeSummary = analytics?.volumeSummary || {
    totalAuctionVolume: 0,
    settledVolume: 0,
    totalHistoricalBidVolume: 0,
    avgBidAmount: 0,
  };
  const participationSummary = analytics?.participationSummary || {
    todayActiveBidders: 0,
    todayNewRegistrations: 0,
    todayDiscussionUsers: 0,
    fourteenDayBidTotal: 0,
  };

  const hourlyVelocitySeries = analytics?.hourlyVelocitySeries || [];
  const dailySeries = analytics?.dailySeries || [];

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Marketplace Analytics &amp; Live Metrics
          </h3>
          <p className="text-xs text-slate-500">
            Real-time database telemetry tracking bidding velocity, total auction volume, and daily user participation.
          </p>
        </div>
      </div>

      {/* Analytics Highlight Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Bidding Velocity (24h)</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {velocitySummary.bidsLast24h.toLocaleString()} bids
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            Last hr: {velocitySummary.bidsLastHour} · Peak: {velocitySummary.peakHourlyVelocity}/hr · Avg:{' '}
            {velocitySummary.avgBidsPerHour}/hr
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Auction Volume</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            ₦{volumeSummary.totalAuctionVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            Settled: ₦{volumeSummary.settledVolume.toLocaleString()} · Avg Bid: ₦
            {volumeSummary.avgBidAmount.toLocaleString()}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Today&apos;s User Participation</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {participationSummary.todayActiveBidders.toLocaleString()} active bidders
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            +{participationSummary.todayNewRegistrations} signups today ·{' '}
            {participationSummary.todayDiscussionUsers} in discussions
          </div>
        </div>
      </div>

      {/* 1. Bidding Velocity Chart */}
      <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Bidding Velocity</h4>
            <p className="text-[11px] text-slate-500">
              {velocityMode === 'hourly'
                ? 'Bids placed per hour & unique bidders over the last 24 hours (UTC)'
                : 'Daily bid throughput & active bidder trend over the last 14 days'}
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setVelocityMode('hourly')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                velocityMode === 'hourly'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              24h Hourly
            </button>
            <button
              type="button"
              onClick={() => setVelocityMode('daily')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                velocityMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              14-Day Trend
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {velocityMode === 'hourly' ? (
              <ComposedChart data={hourlyVelocitySeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip content={<ChartTooltipCard />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="bidsPerHour"
                  name="Bids / Hour"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#velocityGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="uniqueBidders"
                  name="Unique Bidders"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            ) : (
              <ComposedChart data={dailySeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyVelocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip content={<ChartTooltipCard />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="bidsCount"
                  name="Daily Bids"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#dailyVelocityGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="activeBidders"
                  name="Active Bidders"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Total Auction Volume (Cumulative/Daily + By Category) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Total Auction Volume Trend (₦)
            </h4>
            <p className="text-[11px] text-slate-500">
              Daily gross bid volume vs cumulative marketplace bid volume over 14 days
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailySeries} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => formatCompactNaira(Number(v))}
                  width={56}
                />
                <Tooltip
                  content={
                    <ChartTooltipCard
                      currencyKeys={['dailyVolume', 'cumulativeVolume', 'settledVolume']}
                    />
                  }
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="dailyVolume"
                  name="Daily Bid Volume"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeVolume"
                  name="Cumulative Volume"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Auction Volume by Category (₦)
              </h4>
              <p className="text-[11px] text-slate-500">
                Current aggregate auction value across product categories
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64 w-full">
            {categoryStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No category auction volume recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => formatCompactNaira(Number(v))}
                    width={56}
                  />
                  <Tooltip content={<ChartTooltipCard currencyKeys={['totalBidVolume']} />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="totalBidVolume"
                    name="Category Volume"
                    fill="#0d9488"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 3. Daily User Participation Metrics */}
      <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Daily User Participation Metrics (14 Days)
          </h4>
          <p className="text-[11px] text-slate-500">
            Unique daily bidders, live lot discussion participants, and new user registrations
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<ChartTooltipCard />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey="activeBidders"
                name="Active Bidders"
                fill="#059669"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="discussionParticipants"
                name="Discussion Users"
                fill="#0284c7"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="newRegistrations"
                name="New Registrations"
                fill="#d97706"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
