import { inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { auctions, bids, users } from '../db/schema.ts';

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

const SETTLED_WINNER_STATUSES = new Set(['escrow_paid', 'dispatched', 'settled']);
const PENDING_WINNER_STATUSES = new Set(['pending', 'notified']);

export function tierFromScore(score: number): TrustTier {
  if (score >= 92) return 'Elite';
  if (score >= 82) return 'Trusted';
  if (score >= 75) return 'Verified';
  if (score >= 60) return 'Building';
  return 'Standard';
}

/**
 * Computes real-time Bidder Trust Scores for a set of usernames from PostgreSQL
 * based on successful bid completions, ended auction participations, and account standing.
 */
export async function computeBidderTrustScores(
  rawUsernames: string[]
): Promise<Record<string, BidderTrustProfile>> {
  const cleaned = Array.from(
    new Set(
      rawUsernames
        .map((u) => (typeof u === 'string' ? u.trim().toLowerCase() : ''))
        .filter((u) => u.length > 0 && u.length <= 60)
    )
  ).slice(0, 60);

  if (cleaned.length === 0) {
    return {};
  }

  const userRows = await db
    .select({
      id: users.id,
      username: users.username,
      status: users.status,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(
      sql`lower(${users.username}) IN (${sql.join(
        cleaned.map((name) => sql`${name}`),
        sql`, `
      )})`
    );

  if (userRows.length === 0) {
    return {};
  }

  const userIds = userRows.map((u) => u.id);

  // Fetch all bids by these users joined with auction completion metadata
  const userBidRows = await db
    .select({
      userId: bids.userId,
      auctionId: bids.auctionId,
      auctionStatus: auctions.status,
      winnerId: auctions.winnerId,
      winnerStatus: auctions.winnerStatus,
    })
    .from(bids)
    .innerJoin(auctions, sql`${bids.auctionId} = ${auctions.id}`)
    .where(inArray(bids.userId, userIds));

  // Also fetch any ended auctions won directly by these users
  const wonAuctionRows = await db
    .select({
      auctionId: auctions.id,
      winnerId: auctions.winnerId,
      winnerStatus: auctions.winnerStatus,
    })
    .from(auctions)
    .where(
      sql`${auctions.winnerId} IN (${sql.join(
        userIds.map((id) => sql`${id}`),
        sql`, `
      )}) AND ${auctions.status} = 'ended'`
    );

  // Aggregate metrics per userId
  const statsMap = new Map<
    number,
    {
      totalBidsCount: number;
      endedAuctionIds: Set<number>;
      wonAuctionStatusByAuction: Map<number, string>;
    }
  >();

  for (const uid of userIds) {
    statsMap.set(uid, {
      totalBidsCount: 0,
      endedAuctionIds: new Set<number>(),
      wonAuctionStatusByAuction: new Map<number, string>(),
    });
  }

  for (const row of userBidRows) {
    const agg = statsMap.get(row.userId);
    if (!agg) continue;
    agg.totalBidsCount += 1;
    if (row.auctionStatus === 'ended') {
      agg.endedAuctionIds.add(row.auctionId);
      if (row.winnerId === row.userId) {
        agg.wonAuctionStatusByAuction.set(row.auctionId, row.winnerStatus || 'pending');
      }
    }
  }

  for (const won of wonAuctionRows) {
    if (!won.winnerId) continue;
    const agg = statsMap.get(won.winnerId);
    if (!agg) continue;
    agg.endedAuctionIds.add(won.auctionId);
    agg.wonAuctionStatusByAuction.set(won.auctionId, won.winnerStatus || 'pending');
  }

  const result: Record<string, BidderTrustProfile> = {};

  for (const u of userRows) {
    const agg = statsMap.get(u.id)!;
    let completedWins = 0;
    let pendingWins = 0;

    for (const wStatus of agg.wonAuctionStatusByAuction.values()) {
      if (SETTLED_WINNER_STATUSES.has(wStatus)) {
        completedWins += 1;
      } else if (PENDING_WINNER_STATUSES.has(wStatus)) {
        pendingWins += 1;
      }
    }

    const totalWins = agg.wonAuctionStatusByAuction.size;
    const completedAuctionsCount = agg.endedAuctionIds.size;
    const totalBidsCount = agg.totalBidsCount;

    // Deterministic completion-driven scoring (0 - 100)
    let rawScore = u.status === 'active' ? (u.emailVerified ? 75 : 70) : 35;
    rawScore += Math.min(20, completedWins * 8);
    rawScore += Math.min(10, completedAuctionsCount * 2);

    if (completedWins === 0 && totalBidsCount > 0) {
      rawScore += Math.min(5, totalBidsCount);
    }

    if (totalWins > 0 && pendingWins > 0 && completedWins < totalWins) {
      const unsettledRatio = pendingWins / totalWins;
      rawScore -= Math.round(unsettledRatio * 6);
    }

    const score = Math.max(20, Math.min(100, rawScore));
    const completionRate =
      totalWins > 0
        ? Math.round((completedWins / totalWins) * 100)
        : completedAuctionsCount > 0
        ? 100
        : null;

    const profile: BidderTrustProfile = {
      username: u.username,
      score,
      tier: tierFromScore(score),
      completedWins,
      totalWins,
      completedAuctionsCount,
      totalBidsCount,
      completionRate,
      emailVerified: u.emailVerified,
    };

    // Index by both lowercase and original casing for instant lookup
    result[u.username.toLowerCase()] = profile;
    result[u.username] = profile;
  }

  return result;
}
