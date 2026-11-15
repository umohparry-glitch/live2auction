import { and, inArray, ne } from 'drizzle-orm';
import type { Server as SocketIOServer } from 'socket.io';
import { db } from '../db/index.ts';
import { auctions, users, websiteSettings } from '../db/schema.ts';

export interface SlotHoldInfo {
  slotKey: string;
  userId: number;
  username: string;
  socketId: string;
  expiresAt: number;
}

export interface ComputedAuctionSlot {
  slotKey: string;
  slotNumber: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  gapMinutesAfter: number;
  state: 'available' | 'occupied' | 'mine' | 'held';
  isLiveNow: boolean;
  heldByUsername: string | null;
  heldByUserId: number | null;
  occupiedBy: {
    id: number;
    code: string;
    title: string;
    status: string;
    approvalStatus: string;
    sellerId: number | null;
    sellerUsername: string | null;
  } | null;
}

const activeSlotHolds = new Map<string, SlotHoldInfo>();
const HOLD_TTL_MS = 90_000; // 90 seconds auto-expiry for transient click holds

function pruneExpiredHolds() {
  const now = Date.now();
  let removed = false;
  for (const [key, hold] of activeSlotHolds.entries()) {
    if (hold.expiresAt <= now) {
      activeSlotHolds.delete(key);
      removed = true;
    }
  }
  return removed;
}

export function getActiveSlotHolds() {
  pruneExpiredHolds();
  return Array.from(activeSlotHolds.values()).map((h) => ({
    slotKey: h.slotKey,
    userId: h.userId,
    username: h.username,
    expiresAt: h.expiresAt,
  }));
}

export function clearSlotHold(slotKey: string, io?: SocketIOServer) {
  if (!slotKey) return;
  const existed = activeSlotHolds.delete(slotKey);
  if (existed && io) {
    io.emit('slots:holds_updated', getActiveSlotHolds());
  }
}

export function registerSlotSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket) => {
    socket.on(
      'slot:selecting',
      (payload: { slotKey?: string; userId?: number; username?: string }) => {
        pruneExpiredHolds();
        const slotKey = typeof payload?.slotKey === 'string' ? payload.slotKey.trim() : '';
        const userId = Number(payload?.userId);
        const username =
          typeof payload?.username === 'string' ? payload.username.trim().slice(0, 40) : '';

        if (!slotKey || !Number.isInteger(userId) || userId <= 0 || !username) {
          return;
        }

        // Remove any previous hold owned by this socket/user so a user only holds one slot at a time
        for (const [k, existing] of activeSlotHolds.entries()) {
          if (existing.socketId === socket.id || existing.userId === userId) {
            activeSlotHolds.delete(k);
          }
        }

        activeSlotHolds.set(slotKey, {
          slotKey,
          userId,
          username,
          socketId: socket.id,
          expiresAt: Date.now() + HOLD_TTL_MS,
        });

        io.emit('slots:holds_updated', getActiveSlotHolds());
      }
    );

    socket.on('slot:released', (payload?: { slotKey?: string }) => {
      let changed = pruneExpiredHolds();
      const targetKey = typeof payload?.slotKey === 'string' ? payload.slotKey.trim() : '';
      for (const [k, existing] of activeSlotHolds.entries()) {
        if (existing.socketId === socket.id && (!targetKey || k === targetKey)) {
          activeSlotHolds.delete(k);
          changed = true;
        }
      }
      if (changed) {
        io.emit('slots:holds_updated', getActiveSlotHolds());
      }
    });

    socket.on('disconnect', () => {
      let changed = pruneExpiredHolds();
      for (const [k, existing] of activeSlotHolds.entries()) {
        if (existing.socketId === socket.id) {
          activeSlotHolds.delete(k);
          changed = true;
        }
      }
      if (changed) {
        io.emit('slots:holds_updated', getActiveSlotHolds());
      }
    });
  });
}

export async function getAuctionTimingConfig() {
  const [settings] = await db.select().from(websiteSettings).limit(1);
  return {
    timeBetweenAuctionsMinutes: Math.max(0, settings?.timeBetweenAuctionsMinutes ?? 15),
    defaultSlotDurationMinutes: Math.max(5, settings?.defaultSlotDurationMinutes ?? 60),
  };
}

export async function computeAuctionSlots(options: {
  dayOffset?: number;
  currentUserId?: number | null;
}) {
  pruneExpiredHolds();
  const dayOffset = Math.max(0, Math.min(3, Number(options.dayOffset || 0)));
  const currentUserId = options.currentUserId ?? null;

  const { timeBetweenAuctionsMinutes, defaultSlotDurationMinutes } =
    await getAuctionTimingConfig();

  const durationMs = defaultSlotDurationMinutes * 60_000;
  const gapMs = timeBetweenAuctionsMinutes * 60_000;
  const stepMs = durationMs + gapMs;

  // Fetch non-rejected active/upcoming auctions to map slot occupancy
  const activeAuctions = await db
    .select({
      id: auctions.id,
      code: auctions.code,
      title: auctions.title,
      status: auctions.status,
      approvalStatus: auctions.approvalStatus,
      sellerId: auctions.sellerId,
      slotKey: auctions.slotKey,
      startTime: auctions.startTime,
      endTime: auctions.endTime,
      effectiveEndTime: auctions.effectiveEndTime,
    })
    .from(auctions)
    .where(
      and(
        inArray(auctions.status, ['scheduled', 'live']),
        ne(auctions.approvalStatus, 'rejected')
      )
    );

  const sellerIds = Array.from(
    new Set(activeAuctions.map((a) => a.sellerId).filter((id): id is number => Boolean(id)))
  );
  const sellerRows =
    sellerIds.length > 0
      ? await db
          .select({ id: users.id, username: users.username })
          .from(users)
          .where(inArray(users.id, sellerIds))
      : [];
  const sellerMap = new Map(sellerRows.map((s) => [s.id, s.username]));

  const now = new Date();
  const nowMs = now.getTime();
  const todayMidnightUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0,
    0,
    0,
    0
  );

  const slots: ComputedAuctionSlot[] = [];

  if (dayOffset === 0) {
    // From now forward: show currently running / next 12 sequential slots
    let k = Math.max(0, Math.floor((nowMs - todayMidnightUtc) / stepMs));
    while (slots.length < 12 && k < 500) {
      const sMs = todayMidnightUtc + k * stepMs;
      const eMs = sMs + durationMs;
      k++;
      if (eMs <= nowMs) continue;

      const slotKey = new Date(sMs).toISOString();
      const matched = activeAuctions.find((a) => {
        if (a.slotKey === slotKey) return true;
        const aStart = new Date(a.startTime).getTime();
        const aEnd = new Date(a.effectiveEndTime || a.endTime).getTime();
        // Overlap check respecting admin buffer gap before and after existing scheduled/pending slots
        return aStart < eMs + gapMs && aEnd + gapMs > sMs;
      });

      const hold = activeSlotHolds.get(slotKey);
      const isMine = matched && currentUserId && matched.sellerId === currentUserId;
      const isHeldByOther = Boolean(hold && hold.userId !== currentUserId && !matched);

      let state: ComputedAuctionSlot['state'] = 'available';
      if (matched) {
        state = isMine ? 'mine' : 'occupied';
      } else if (isHeldByOther) {
        state = 'held';
      }

      slots.push({
        slotKey,
        slotNumber: slots.length + 1,
        startTime: new Date(sMs).toISOString(),
        endTime: new Date(eMs).toISOString(),
        durationMinutes: defaultSlotDurationMinutes,
        gapMinutesAfter: timeBetweenAuctionsMinutes,
        state,
        isLiveNow: sMs <= nowMs && eMs > nowMs,
        heldByUsername: hold ? hold.username : null,
        heldByUserId: hold ? hold.userId : null,
        occupiedBy: matched
          ? {
              id: matched.id,
              code: matched.code,
              title: matched.title,
              status: matched.status,
              approvalStatus: matched.approvalStatus,
              sellerId: matched.sellerId,
              sellerUsername: matched.sellerId
                ? sellerMap.get(matched.sellerId) || null
                : null,
            }
          : null,
      });
    }
  } else {
    const windowStart = todayMidnightUtc + dayOffset * 24 * 3600_000;
    const windowEnd = windowStart + 24 * 3600_000;
    let k = Math.max(0, Math.floor((windowStart - todayMidnightUtc) / stepMs));
    while (slots.length < 16 && k < 1500) {
      const sMs = todayMidnightUtc + k * stepMs;
      const eMs = sMs + durationMs;
      k++;
      if (sMs >= windowEnd) break;
      if (eMs <= windowStart || eMs <= nowMs) continue;

      const slotKey = new Date(sMs).toISOString();
      const matched = activeAuctions.find((a) => {
        if (a.slotKey === slotKey) return true;
        const aStart = new Date(a.startTime).getTime();
        const aEnd = new Date(a.effectiveEndTime || a.endTime).getTime();
        return aStart < eMs + gapMs && aEnd + gapMs > sMs;
      });

      const hold = activeSlotHolds.get(slotKey);
      const isMine = matched && currentUserId && matched.sellerId === currentUserId;
      const isHeldByOther = Boolean(hold && hold.userId !== currentUserId && !matched);

      let state: ComputedAuctionSlot['state'] = 'available';
      if (matched) {
        state = isMine ? 'mine' : 'occupied';
      } else if (isHeldByOther) {
        state = 'held';
      }

      slots.push({
        slotKey,
        slotNumber: slots.length + 1,
        startTime: new Date(sMs).toISOString(),
        endTime: new Date(eMs).toISOString(),
        durationMinutes: defaultSlotDurationMinutes,
        gapMinutesAfter: timeBetweenAuctionsMinutes,
        state,
        isLiveNow: false,
        heldByUsername: hold ? hold.username : null,
        heldByUserId: hold ? hold.userId : null,
        occupiedBy: matched
          ? {
              id: matched.id,
              code: matched.code,
              title: matched.title,
              status: matched.status,
              approvalStatus: matched.approvalStatus,
              sellerId: matched.sellerId,
              sellerUsername: matched.sellerId
                ? sellerMap.get(matched.sellerId) || null
                : null,
            }
          : null,
      });
    }
  }

  return {
    slots,
    timeBetweenAuctionsMinutes,
    defaultSlotDurationMinutes,
    activeHolds: getActiveSlotHolds(),
    serverTime: now.toISOString(),
  };
}

export async function findSlotConflict(
  txOrDb: typeof db | any,
  params: {
    slotStart: Date;
    slotEnd: Date;
    slotKey?: string | null;
    gapMinutes: number;
    excludeAuctionId?: number;
  }
) {
  const sMs = params.slotStart.getTime();
  const eMs = params.slotEnd.getTime();
  const gapMs = Math.max(0, params.gapMinutes) * 60_000;

  const existingRows = await txOrDb
    .select({
      id: auctions.id,
      code: auctions.code,
      title: auctions.title,
      slotKey: auctions.slotKey,
      startTime: auctions.startTime,
      endTime: auctions.endTime,
      effectiveEndTime: auctions.effectiveEndTime,
      status: auctions.status,
      approvalStatus: auctions.approvalStatus,
    })
    .from(auctions)
    .where(
      and(
        inArray(auctions.status, ['scheduled', 'live']),
        ne(auctions.approvalStatus, 'rejected')
      )
    );

  return (
    existingRows.find((row: any) => {
      if (params.excludeAuctionId && row.id === params.excludeAuctionId) return false;
      if (params.slotKey && row.slotKey === params.slotKey) return true;
      const rStart = new Date(row.startTime).getTime();
      const rEnd = new Date(row.effectiveEndTime || row.endTime).getTime();
      return rStart < eMs + gapMs && rEnd + gapMs > sMs;
    }) || null
  );
}
