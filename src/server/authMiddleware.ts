import { NextFunction, Request, Response } from 'express';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { ensureSeeded } from '../db/seed.ts';
import {
  adminActivityLogs,
  permissions,
  rolePermissions,
  roles,
  sessions,
  userPermissions,
  userRoles,
  users,
} from '../db/schema.ts';
import { generateToken, hashToken, verifyCsrfSignature } from './security.ts';

export const SESSION_COOKIE_NAME = 'naija_session';
export const CSRF_COOKIE_NAME = 'naija_csrf';

export interface AuthContext {
  user: {
    id: number;
    uid: string;
    fullName: string;
    username: string;
    email: string;
    phone: string;
    avatarUrl: string;
    status: string;
    emailVerified: boolean;
    mustChangePassword: boolean;
    isAdmin: boolean;
    createdAt: Date;
    lastLoginAt: Date | null;
  };
  sessionId: string;
  roles: string[];
  permissions: string[];
}

export interface AuthRequest extends Request {
  auth?: AuthContext;
}

export function isHttpsRequest(req: Request): boolean {
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string' && proto.toLowerCase().includes('https')) return true;
  if (req.headers['x-forwarded-ssl'] === 'on') return true;
  if (req.secure) return true;
  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.startsWith('https://')) return true;
  const referer = req.headers.referer;
  if (typeof referer === 'string' && referer.startsWith('https://')) return true;
  const host = req.headers.host || '';
  if (host.includes('.run.app') || host.includes('.web.app')) return true;
  return process.env.NODE_ENV === 'production';
}

export function getSessionCookieOptions(
  req: Request,
  rememberMe: boolean,
  isAdminSession: boolean
) {
  const https = isHttpsRequest(req);
  const maxAge = isAdminSession
    ? rememberMe
      ? 24 * 60 * 60 * 1000 // Admin with Remember Me: max 24h
      : 2 * 60 * 60 * 1000 // Admin without Remember Me: 2h
    : rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // Standard user Remember Me: 30 days
    : undefined; // Browser session cookie (expires on close, 4h server TTL)

  return {
    httpOnly: true,
    secure: https,
    sameSite: (https ? 'none' : 'lax') as 'none' | 'lax',
    ...(https ? { partitioned: true } : {}),
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  };
}

export function clearSessionCookie(req: Request, res: Response) {
  const https = isHttpsRequest(req);
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: https,
    sameSite: (https ? 'none' : 'lax') as 'none' | 'lax',
    ...(https ? { partitioned: true } : {}),
    path: '/',
  });
}

function isTransientDbError(err: any): boolean {
  const msg = err?.message || '';
  const code = err?.code || '';
  return (
    msg.includes('Connection terminated') ||
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    code === 'ETIMEDOUT' ||
    code === '57P01'
  );
}

async function resolveSessionFromDb(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const [sessionRow] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now)
      )
    )
    .limit(1);

  if (!sessionRow) {
    return { status: 'missing' as const };
  }

  const [userRow] = await db
    .select({
      id: users.id,
      uid: users.uid,
      fullName: users.fullName,
      username: users.username,
      email: users.email,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      status: users.status,
      emailVerified: users.emailVerified,
      mustChangePassword: users.mustChangePassword,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(eq(users.id, sessionRow.userId))
    .limit(1);

  if (!userRow || userRow.status !== 'active') {
    await db
      .update(sessions)
      .set({ revokedAt: now })
      .where(eq(sessions.id, sessionRow.id));
    return { status: 'inactive' as const };
  }

  return { status: 'valid' as const, sessionRow, userRow, now };
}

export async function loadUserRolesAndPermissions(userId: number) {
  const userRoleRows = await db
    .select({
      roleId: roles.id,
      roleName: roles.name,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRoleRows.map((r) => r.roleName);
  const permSet = new Set<string>();

  for (const r of userRoleRows) {
    const rpRows = await db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, r.roleId));
    rpRows.forEach((p) => permSet.add(p.code));
  }

  const explicitPerms = await db
    .select({ code: permissions.code })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(eq(userPermissions.userId, userId));

  explicitPerms.forEach((p) => permSet.add(p.code));

  return {
    roles: roleNames,
    permissions: Array.from(permSet),
  };
}

export async function attachSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await ensureSeeded();

    const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (!rawToken || typeof rawToken !== 'string') {
      return next();
    }

    let resolved;
    try {
      resolved = await resolveSessionFromDb(rawToken);
    } catch (firstErr) {
      if (isTransientDbError(firstErr)) {
        resolved = await resolveSessionFromDb(rawToken);
      } else {
        throw firstErr;
      }
    }

    if (resolved.status !== 'valid') {
      clearSessionCookie(req, res);
      return next();
    }

    const { sessionRow, userRow, now } = resolved;

    // Rotate session token every 15 minutes for sliding security
    const msSinceRotation = now.getTime() - new Date(sessionRow.lastRotatedAt).getTime();
    if (msSinceRotation > 15 * 60 * 1000) {
      const nextToken = generateToken(32);
      const nextHash = hashToken(nextToken);
      const nextExpiry = sessionRow.isAdminSession
        ? new Date(now.getTime() + (sessionRow.rememberMe ? 24 : 2) * 60 * 60 * 1000)
        : new Date(
            now.getTime() + (sessionRow.rememberMe ? 30 * 24 : 4) * 60 * 60 * 1000
          );

      await db
        .update(sessions)
        .set({
          tokenHash: nextHash,
          lastRotatedAt: now,
          expiresAt: nextExpiry,
        })
        .where(eq(sessions.id, sessionRow.id));

      res.cookie(
        SESSION_COOKIE_NAME,
        nextToken,
        getSessionCookieOptions(req, sessionRow.rememberMe, sessionRow.isAdminSession)
      );
    }

    const { roles: userRolesList, permissions: userPermsList } =
      await loadUserRolesAndPermissions(userRow.id);

    req.auth = {
      user: userRow,
      sessionId: sessionRow.id,
      roles: userRolesList,
      permissions: userPermsList,
    };

    next();
  } catch (err) {
    console.error('Session middleware error:', err);
    next();
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({
      error: 'Authentication required. Please log in or create an account.',
      code: 'AUTH_REQUIRED',
    });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }
  const hasAdminRole =
    req.auth.user.isAdmin &&
    req.auth.roles.some((r) =>
      ['super_admin', 'auction_manager', 'user_manager'].includes(r)
    );
  if (!hasAdminRole) {
    return res.status(403).json({
      error: 'Administrator access denied. Insufficient privileges.',
      code: 'FORBIDDEN',
    });
  }
  if (req.auth.user.mustChangePassword) {
    return res.status(403).json({
      error: 'Initial password must be changed before accessing administrator controls.',
      code: 'MUST_CHANGE_PASSWORD',
    });
  }
  next();
}

export function requirePermission(permissionCode: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (
      req.auth.roles.includes('super_admin') ||
      req.auth.permissions.includes(permissionCode)
    ) {
      return next();
    }
    return res.status(403).json({
      error: `Permission denied: requires '${permissionCode}'.`,
      code: 'PERMISSION_DENIED',
    });
  };
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  const headerToken = req.headers['x-csrf-token'];
  if (typeof headerToken !== 'string' || !verifyCsrfSignature(headerToken)) {
    return res.status(403).json({
      error: 'Invalid or missing security CSRF token. Please refresh and try again.',
      code: 'CSRF_INVALID',
    });
  }
  next();
}

export function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export async function logAdminAction(
  req: AuthRequest,
  action: string,
  targetType: string,
  targetId: string | number,
  details: string
) {
  try {
    await db.insert(adminActivityLogs).values({
      adminId: req.auth?.user.id ?? null,
      adminUsername: req.auth?.user.username ?? 'system',
      action,
      targetType,
      targetId: String(targetId),
      details,
      ipAddress: getClientIp(req),
    });
  } catch (err) {
    console.error('Failed to write admin activity log:', err);
  }
}
