import React from 'react';
import { ShieldCheck, Shield } from 'lucide-react';

export type TrustTier = 'Elite' | 'Trusted' | 'Verified' | 'Building' | 'Standard';

export interface BidderTrustProfile {
  username: string;
  score: number;
  tier: TrustTier;
  completedWins: number;
  totalWins: number;
  completedAuctionsCount: number;
  totalBidsCount: number;
  completionRate: number | null;
  emailVerified: boolean;
}

export function tierFromScore(score: number): TrustTier {
  if (score >= 92) return 'Elite';
  if (score >= 82) return 'Trusted';
  if (score >= 75) return 'Verified';
  if (score >= 60) return 'Building';
  return 'Standard';
}

interface BidderTrustBadgeProps {
  profile?: BidderTrustProfile | null;
  fallbackScore?: number;
  compact?: boolean;
  showTier?: boolean;
}

export const BidderTrustBadge: React.FC<BidderTrustBadgeProps> = ({
  profile,
  fallbackScore,
  compact = false,
  showTier = false,
}) => {
  const score = profile?.score ?? fallbackScore;
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return null;
  }

  const tier: TrustTier = profile?.tier || tierFromScore(score);

  const colorClasses =
    score >= 90
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : score >= 80
      ? 'bg-teal-50 text-teal-800 border-teal-200'
      : score >= 70
      ? 'bg-slate-100 text-slate-700 border-slate-200'
      : 'bg-amber-50 text-amber-800 border-amber-200';

  const iconColor =
    score >= 90
      ? 'text-emerald-600'
      : score >= 80
      ? 'text-teal-600'
      : score >= 70
      ? 'text-slate-600'
      : 'text-amber-600';

  const tooltipText = profile
    ? `Bidder Trust Score: ${profile.score}% (${profile.tier}) · ${profile.completedWins} settled ${
        profile.completedWins === 1 ? 'win' : 'wins'
      } · ${profile.completedAuctionsCount} completed ${
        profile.completedAuctionsCount === 1 ? 'auction' : 'auctions'
      } · ${profile.totalBidsCount} ${profile.totalBidsCount === 1 ? 'bid' : 'bids'}`
    : `Bidder Trust Score: ${score}% (${tier}) based on successful bid completions`;

  return (
    <span
      title={tooltipText}
      aria-label={tooltipText}
      className={`inline-flex items-center gap-1 rounded border font-semibold tabular-nums leading-none whitespace-nowrap ${colorClasses} ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      }`}
    >
      {score >= 75 ? (
        <ShieldCheck className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${iconColor} shrink-0`} />
      ) : (
        <Shield className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${iconColor} shrink-0`} />
      )}
      <span>{score}%</span>
      {showTier && <span className="font-medium opacity-80">· {tier}</span>}
    </span>
  );
};
