import React, { useEffect, useState } from 'react';
import { Clock, PauseCircle, ShieldAlert, Zap } from 'lucide-react';

export interface AuctionCountdownTimerProps {
  status: string;
  /** Direct seconds remaining (used in simulated/room contexts) */
  remainingSeconds?: number;
  /** Total auction window duration in seconds (for progress bar calculation) */
  totalDurationSeconds?: number;
  /** ISO timestamps (used in PostgreSQL-backed live auctions) */
  startTime?: string | Date;
  endTime?: string | Date;
  effectiveEndTime?: string | Date;
  /** Anti-sniping configuration & state */
  antiSnipingSeconds?: number;
  extensionCount?: number;
  maxExtensions?: number;
  isExtended?: boolean;
  /** Compact inline layout for cards vs full detail panel */
  compact?: boolean;
}

type UrgencyTier = 'normal' | 'warning' | 'urgent' | 'critical' | 'scheduled' | 'paused' | 'ended';

export const AuctionCountdownTimer: React.FC<AuctionCountdownTimerProps> = ({
  status,
  remainingSeconds: directSeconds,
  totalDurationSeconds,
  startTime,
  endTime,
  effectiveEndTime,
  antiSnipingSeconds = 60,
  extensionCount = 0,
  maxExtensions = 5,
  isExtended = false,
  compact = false,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (directSeconds !== undefined) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [directSeconds]);

  const normalizedStatus = status.toLowerCase();
  const isClosed =
    normalizedStatus === 'ended' ||
    normalizedStatus === 'sold' ||
    normalizedStatus === 'passed' ||
    normalizedStatus === 'cancelled';

  let computedSeconds = 0;
  let windowSeconds = totalDurationSeconds || 3600;

  if (directSeconds !== undefined) {
    computedSeconds = Math.max(0, Math.floor(directSeconds));
    windowSeconds = Math.max(totalDurationSeconds || 180, computedSeconds, 1);
  } else if (normalizedStatus === 'scheduled' && startTime) {
    const startMs = new Date(startTime).getTime();
    computedSeconds = Math.max(0, Math.floor((startMs - nowMs) / 1000));
    windowSeconds = 86400;
  } else if (effectiveEndTime || endTime) {
    const endMs = new Date(effectiveEndTime || endTime!).getTime();
    const startMs = startTime ? new Date(startTime).getTime() : endMs - 3600 * 1000;
    computedSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));
    windowSeconds = Math.max(60, Math.floor((endMs - startMs) / 1000));
  }

  let tier: UrgencyTier = 'normal';
  if (isClosed) {
    tier = 'ended';
  } else if (normalizedStatus === 'paused') {
    tier = 'paused';
  } else if (normalizedStatus === 'scheduled') {
    tier = 'scheduled';
  } else if (computedSeconds <= 0) {
    tier = 'ended';
  } else if (computedSeconds <= 10) {
    tier = 'critical';
  } else if (computedSeconds <= 30) {
    tier = 'urgent';
  } else if (computedSeconds <= 120) {
    tier = 'warning';
  } else {
    tier = 'normal';
  }

  const days = Math.floor(computedSeconds / 86400);
  const hrs = Math.floor((computedSeconds % 86400) / 3600);
  const mins = Math.floor((computedSeconds % 3600) / 60);
  const secs = computedSeconds % 60;

  const formattedClock =
    tier === 'ended'
      ? normalizedStatus === 'cancelled'
        ? 'Cancelled'
        : 'Closed'
      : days > 0
      ? `${days}d ${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`
      : hrs > 0
      ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (compact) {
    const compactColor =
      tier === 'critical'
        ? 'text-rose-700 font-bold animate-pulse'
        : tier === 'urgent'
        ? 'text-orange-700 font-bold'
        : tier === 'warning'
        ? 'text-amber-700 font-semibold'
        : tier === 'scheduled'
        ? 'text-slate-700 font-semibold'
        : tier === 'ended'
        ? 'text-slate-500 font-medium'
        : 'text-emerald-700 font-semibold';

    return (
      <div className={`text-xs font-mono tabular-nums flex items-center gap-1 ${compactColor}`}>
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{tier === 'scheduled' ? `Starts ${formattedClock}` : formattedClock}</span>
      </div>
    );
  }

  const tierStyles: Record<
    UrgencyTier,
    {
      container: string;
      iconWrap: string;
      digits: string;
      statusText: string;
      barTrack: string;
      barFill: string;
      label: string;
    }
  > = {
    normal: {
      container: 'border-emerald-200 bg-emerald-50/40',
      iconWrap: 'bg-emerald-100 text-emerald-700',
      digits: 'text-slate-900',
      statusText: 'text-emerald-700',
      barTrack: 'bg-emerald-100',
      barFill: 'bg-emerald-600',
      label: 'Live Bidding Open',
    },
    warning: {
      container: 'border-amber-300 bg-amber-50/80',
      iconWrap: 'bg-amber-100 text-amber-800',
      digits: 'text-amber-900',
      statusText: 'text-amber-800',
      barTrack: 'bg-amber-200/70',
      barFill: 'bg-amber-500',
      label: 'Closing Soon · Under 2 Minutes Left',
    },
    urgent: {
      container: 'border-orange-400 bg-orange-50',
      iconWrap: 'bg-orange-100 text-orange-700',
      digits: 'text-orange-800',
      statusText: 'text-orange-800',
      barTrack: 'bg-orange-200/80',
      barFill: 'bg-orange-600',
      label: `Final 30s · Anti-Sniping Armed (+${antiSnipingSeconds}s)`,
    },
    critical: {
      container: 'border-rose-500 bg-rose-50 shadow-sm',
      iconWrap: 'bg-rose-600 text-white animate-pulse',
      digits: 'text-rose-700 animate-pulse',
      statusText: 'text-rose-700',
      barTrack: 'bg-rose-200',
      barFill: 'bg-rose-600',
      label: `FINAL CALL · Bids Add +${antiSnipingSeconds}s`,
    },
    scheduled: {
      container: 'border-slate-200 bg-slate-50',
      iconWrap: 'bg-slate-200 text-slate-700',
      digits: 'text-slate-900',
      statusText: 'text-slate-600',
      barTrack: 'bg-slate-200',
      barFill: 'bg-slate-500',
      label: 'Scheduled · Starts In',
    },
    paused: {
      container: 'border-amber-200 bg-amber-50/50',
      iconWrap: 'bg-amber-100 text-amber-700',
      digits: 'text-amber-900',
      statusText: 'text-amber-800',
      barTrack: 'bg-amber-100',
      barFill: 'bg-amber-500',
      label: 'Auction Temporarily Paused',
    },
    ended: {
      container: 'border-slate-200 bg-slate-100',
      iconWrap: 'bg-slate-200 text-slate-600',
      digits: 'text-slate-600',
      statusText: 'text-slate-500',
      barTrack: 'bg-slate-200',
      barFill: 'bg-slate-400',
      label: normalizedStatus === 'cancelled' ? 'Auction Cancelled' : 'Bidding Closed',
    },
  };

  const styles = tierStyles[tier];

  // Progress ratio: during critical/urgent final window (< 120s), scale bar cleanly against 120s or window
  const progressPct =
    tier === 'ended'
      ? 0
      : tier === 'scheduled'
      ? 100
      : Math.max(3, Math.min(100, (computedSeconds / Math.min(windowSeconds, 3600)) * 100));

  return (
    <div
      className={`rounded-xl border p-3.5 transition-colors duration-300 space-y-2.5 ${styles.container}`}
      role="timer"
      aria-live={tier === 'critical' || tier === 'urgent' ? 'polite' : 'off'}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${styles.iconWrap}`}
          >
            {tier === 'paused' ? (
              <PauseCircle className="w-4 h-4" />
            ) : tier === 'critical' || tier === 'urgent' ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className={`text-[11px] font-bold tracking-tight truncate ${styles.statusText}`}>
              {styles.label}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
              <span className="tabular-nums">
                Anti-sniping +{antiSnipingSeconds}s ({extensionCount}/{maxExtensions} used)
              </span>
            </div>
          </div>
        </div>

        <div className={`text-2xl font-black font-mono tabular-nums tracking-tight shrink-0 ${styles.digits}`}>
          {formattedClock}
        </div>
      </div>

      {/* Linear urgency progress bar */}
      <div className={`h-1.5 w-full rounded-full overflow-hidden ${styles.barTrack}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${styles.barFill}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {isExtended && (
        <div className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5">
          <Zap className="w-3.5 h-3.5 fill-white" />
          <span>Time Extended! Anti-sniping protection added +{antiSnipingSeconds}s</span>
        </div>
      )}
    </div>
  );
};
