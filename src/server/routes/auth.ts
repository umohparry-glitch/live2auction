import { Router } from 'express';
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { db } from '../../db/index.ts';
import { ensureSeeded } from '../../db/seed.ts';
import {
  adminActivityLogs,
  emailVerificationTokens,
  notifications,
  passwordResetTokens,
  roles,
  sessions,
  userRoles,
  users,
  websiteSettings,
} from '../../db/schema.ts';
import { adminAuth } from '../../lib/firebase-admin.ts';
import {
  AuthRequest,
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  getClientIp,
  getSessionCookieOptions,
  loadUserRolesAndPermissions,
  requireAuth,
} from '../authMiddleware.ts';
import {
  generateToken,
  hashPassword,
  hashToken,
  isValidEmail,
  isValidPhone,
  isValidUsername,
  sanitizeText,
  signCsrfToken,
  validatePasswordStrength,
  verifyPassword,
} from '../security.ts';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please wait 15 minutes and try again.',
  },
});

async function createSessionForUser(
  req: any,
  res: any,
  userId: number,
  rememberMe: boolean,
  isAdminSession: boolean
) {
  const rawToken = generateToken(32);
  const tokenHash = hashToken(rawToken);
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = isAdminSession
    ? new Date(now.getTime() + (rememberMe ? 24 : 2) * 60 * 60 * 1000)
    : new Date(now.getTime() + (rememberMe ? 30 * 24 : 4) * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    tokenHash,
    rememberMe,
    isAdminSession,
    userAgent: sanitizeText(req.headers['user-agent'] || '', 250),
    ipAddress: getClientIp(req),
    expiresAt,
    lastRotatedAt: now,
  });

  res.cookie(
    SESSION_COOKIE_NAME,
    rawToken,
    getSessionCookieOptions(req, rememberMe, isAdminSession)
  );
  return sessionId;
}

// GET CSRF Token
router.get('/csrf', async (_req, res) => {
  await ensureSeeded();
  const token = signCsrfToken(crypto.randomBytes(16).toString('hex'));
  res.json({ csrfToken: token });
});

// Check whether default Super Admin (damwad) has been provisioned
router.get('/setup-status', async (_req, res) => {
  try {
    await ensureSeeded();
    const superAdmins = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(roles.name, 'super_admin'))
      .limit(1);

    res.json({
      adminInitialized: superAdmins.length > 0,
      defaultAdminUsername: 'damwad',
    });
  } catch (err) {
    console.error('setup-status error:', err);
    res.status(500).json({ error: 'Unable to verify setup status.' });
  }
});

// One-time secure initial provisioning for default admin ('damwad') if INITIAL_ADMIN_PASSWORD env was not set
router.post('/setup-admin', authLimiter, async (req, res) => {
  try {
    await ensureSeeded();
    const existingSuperAdmins = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(roles.name, 'super_admin'))
      .limit(1);

    if (existingSuperAdmins.length > 0) {
      return res.status(403).json({
        error: 'Initial administrator is already provisioned. Please sign in normally.',
      });
    }

    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const confirmPassword =
      typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';
    const email = sanitizeText(req.body.email || 'damwad@naijaauction.ng', 120).toLowerCase();

    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Initial admin password must be at least 6 characters.',
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid administrator email is required.' });
    }

    const passwordHash = await hashPassword(password);
    const [createdAdmin] = await db
      .insert(users)
      .values({
        uid: `admin_${crypto.randomUUID()}`,
        fullName: 'Damwad Super Administrator',
        username: 'damwad',
        email,
        phone: '+234 800 624 5228',
        passwordHash,
        status: 'active',
        emailVerified: true,
        mustChangePassword: true,
        isAdmin: true,
      })
      .returning();

    const [superRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'super_admin'))
      .limit(1);

    if (createdAdmin && superRole) {
      await db.insert(userRoles).values({
        userId: createdAdmin.id,
        roleId: superRole.id,
      });
    }

    await db.insert(adminActivityLogs).values({
      adminId: createdAdmin.id,
      adminUsername: 'damwad',
      action: 'INITIAL_SUPER_ADMIN_PROVISIONED',
      targetType: 'User',
      targetId: String(createdAdmin.id),
      details: 'Default Super Admin account initialized via one-time secure setup.',
      ipAddress: getClientIp(req),
    });

    res.status(201).json({
      success: true,
      message: 'Super Admin account "damwad" initialized. Please sign in and set a new personal password.',
    });
  } catch (err) {
    console.error('setup-admin error:', err);
    res.status(500).json({ error: 'Failed to initialize administrator account.' });
  }
});

// Get current session user
router.get('/me', async (req: AuthRequest, res) => {
  if (!req.auth) {
    return res.json({ authenticated: false, user: null, roles: [], permissions: [] });
  }
  res.json({
    authenticated: true,
    user: req.auth.user,
    roles: req.auth.roles,
    permissions: req.auth.permissions,
  });
});

// Register new user
router.post('/register', authLimiter, async (req, res) => {
  try {
    await ensureSeeded();

    const [settings] = await db.select().from(websiteSettings).limit(1);
    if (settings && !settings.allowRegistration) {
      return res.status(403).json({
        error: 'New registrations are currently disabled by the platform administrator.',
      });
    }

    const fullName = sanitizeText(req.body.fullName, 80);
    const username = sanitizeText(req.body.username, 24);
    const email = sanitizeText(req.body.email, 120).toLowerCase();
    const phone = sanitizeText(req.body.phone, 24);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const confirmPassword =
      typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';
    const rememberMe = Boolean(req.body.rememberMe);

    if (fullName.length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }
    if (!isValidUsername(username)) {
      return res.status(400).json({
        error: 'Username must be 3–24 characters using letters, numbers, or underscores.',
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Please provide a valid phone number.' });
    }
    const pwdError = validatePasswordStrength(password);
    if (pwdError) {
      return res.status(400).json({ error: pwdError });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    }

    // Prevent duplicate username or email (case-insensitive)
    const duplicate = await db
      .select({ username: users.username, email: users.email })
      .from(users)
      .where(
        or(
          sql`lower(${users.username}) = lower(${username})`,
          sql`lower(${users.email}) = lower(${email})`
        )
      )
      .limit(1);

    if (duplicate.length > 0) {
      if (duplicate[0].username.toLowerCase() === username.toLowerCase()) {
        return res.status(409).json({ error: 'This username is already taken.' });
      }
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        uid: `usr_${crypto.randomUUID()}`,
        fullName,
        username,
        email,
        phone,
        passwordHash,
        status: 'active',
        emailVerified: false,
        mustChangePassword: false,
        isAdmin: false,
        lastLoginAt: new Date(),
      })
      .returning();

    const [buyerRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'buyer'))
      .limit(1);

    if (buyerRole) {
      await db.insert(userRoles).values({
        userId: newUser.id,
        roleId: buyerRole.id,
      });
    }

    // Create email verification token
    const rawVerifyToken = generateToken(24);
    await db.insert(emailVerificationTokens).values({
      userId: newUser.id,
      tokenHash: hashToken(rawVerifyToken),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Welcome notification
    await db.insert(notifications).values({
      userId: newUser.id,
      type: 'registration',
      title: 'Welcome to NaijaAuction',
      message: `Your account @${newUser.username} is ready! Verify your email to unlock full account verification status.`,
    });

    await createSessionForUser(req, res, newUser.id, rememberMe, false);
    const rbac = await loadUserRolesAndPermissions(newUser.id);

    const { passwordHash: _ph, ...safeUser } = newUser;
    res.status(201).json({
      user: safeUser,
      roles: rbac.roles,
      permissions: rbac.permissions,
      verificationTokenPreview: rawVerifyToken,
      message: 'Account created successfully! Welcome to NaijaAuction.',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login with email or username
router.post('/login', authLimiter, async (req, res) => {
  try {
    await ensureSeeded();
    const identifier = sanitizeText(req.body.identifier, 120);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const rememberMe = Boolean(req.body.rememberMe);

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required.' });
    }

    const [userRow] = await db
      .select()
      .from(users)
      .where(
        or(
          sql`lower(${users.username}) = lower(${identifier})`,
          sql`lower(${users.email}) = lower(${identifier})`
        )
      )
      .limit(1);

    if (!userRow || !userRow.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials. Please try again.' });
    }

    const passwordValid = await verifyPassword(password, userRow.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials. Please try again.' });
    }

    if (userRow.status === 'suspended') {
      return res.status(403).json({
        error: 'Your account is currently suspended. Contact support for assistance.',
      });
    }
    if (userRow.status === 'banned') {
      return res.status(403).json({
        error: 'This account has been permanently banned due to policy violations.',
      });
    }
    if (userRow.status !== 'active') {
      return res.status(403).json({
        error: 'Your account is inactive. Contact an administrator to reactivate it.',
      });
    }

    const [settings] = await db.select().from(websiteSettings).limit(1);
    if (settings?.requireEmailVerification && !userRow.emailVerified && !userRow.isAdmin) {
      return res.status(403).json({
        error: 'Please verify your email address before signing in.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userRow.id));

    await createSessionForUser(req, res, userRow.id, rememberMe, userRow.isAdmin);
    const rbac = await loadUserRolesAndPermissions(userRow.id);

    await db.insert(notifications).values({
      userId: userRow.id,
      type: 'login',
      title: 'New Sign-In Detected',
      message: `Signed in to @${userRow.username} (${rememberMe ? 'Persistent 30-day session' : 'Standard session'}).`,
    });

    const { passwordHash: _ph, ...safeUser } = userRow;
    res.json({
      user: safeUser,
      roles: rbac.roles,
      permissions: rbac.permissions,
      message: userRow.mustChangePassword
        ? 'Signed in. You must update your initial administrator password to continue.'
        : 'Welcome back!',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// Sign in via Firebase Google OAuth ID token
router.post('/google', authLimiter, async (req, res) => {
  try {
    await ensureSeeded();
    const idToken = typeof req.body.idToken === 'string' ? req.body.idToken : '';
    const rememberMe = Boolean(req.body.rememberMe);
    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required.' });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = (decoded.email || '').toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Google account has no verified email.' });
    }

    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.uid, decoded.uid), sql`lower(${users.email}) = lower(${email})`))
      .limit(1);

    let userRow = existing[0];
    if (!userRow) {
      const baseHandle = (email.split('@')[0] || 'user')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .slice(0, 18);
      const uniqueHandle = `${baseHandle}_${crypto.randomBytes(2).toString('hex')}`;

      const [inserted] = await db
        .insert(users)
        .values({
          uid: decoded.uid,
          fullName: sanitizeText(decoded.name || baseHandle, 80),
          username: uniqueHandle,
          email,
          phone: '',
          avatarUrl: decoded.picture || '',
          status: 'active',
          emailVerified: Boolean(decoded.email_verified),
          mustChangePassword: false,
          isAdmin: false,
          lastLoginAt: new Date(),
        })
        .returning();
      userRow = inserted;

      const [buyerRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, 'buyer'))
        .limit(1);
      if (buyerRole) {
        await db
          .insert(userRoles)
          .values({ userId: userRow.id, roleId: buyerRole.id })
          .onConflictDoNothing();
      }
    } else {
      if (userRow.status !== 'active') {
        return res.status(403).json({ error: 'Account is suspended or inactive.' });
      }
      await db
        .update(users)
        .set({ lastLoginAt: new Date(), emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, userRow.id));
    }

    await createSessionForUser(req, res, userRow.id, rememberMe, userRow.isAdmin);
    const rbac = await loadUserRolesAndPermissions(userRow.id);
    const { passwordHash: _ph, ...safeUser } = userRow;

    res.json({
      user: safeUser,
      roles: rbac.roles,
      permissions: rbac.permissions,
      message: 'Signed in with Google successfully.',
    });
  } catch (err) {
    console.error('Google OAuth login error:', err);
    res.status(401).json({ error: 'Google verification failed.' });
  }
});

// Logout current device
router.post('/logout', async (req: AuthRequest, res) => {
  try {
    if (req.auth?.sessionId) {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(eq(sessions.id, req.auth.sessionId));
    }
    clearSessionCookie(req, res);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    clearSessionCookie(req, res);
    res.json({ success: true });
  }
});

// Logout from ALL devices
router.post('/logout-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, req.auth!.user.id), isNull(sessions.revokedAt)));
    clearSessionCookie(req, res);
    res.json({
      success: true,
      message: 'All active sessions across every device have been invalidated.',
    });
  } catch (err) {
    console.error('Logout-all error:', err);
    res.status(500).json({ error: 'Failed to revoke sessions.' });
  }
});

// Verify Email Token
router.post('/verify-email', async (req, res) => {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }
    const tokenHash = hashToken(token);
    const now = new Date();

    const [record] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, tokenHash),
          isNull(emailVerificationTokens.usedAt),
          gt(emailVerificationTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired email verification token.' });
    }

    await db
      .update(users)
      .set({ emailVerified: true, updatedAt: now })
      .where(eq(users.id, record.userId));

    await db
      .update(emailVerificationTokens)
      .set({ usedAt: now })
      .where(eq(emailVerificationTokens.id, record.id));

    await db.insert(notifications).values({
      userId: record.userId,
      type: 'security',
      title: 'Email Verified',
      message: 'Your email address has been verified successfully.',
    });

    res.json({ success: true, message: 'Email address verified successfully!' });
  } catch (err) {
    console.error('verify-email error:', err);
    res.status(500).json({ error: 'Failed to verify email.' });
  }
});

// Resend email verification
router.post('/resend-verification', requireAuth, async (req: AuthRequest, res) => {
  try {
    const rawToken = generateToken(24);
    await db.insert(emailVerificationTokens).values({
      userId: req.auth!.user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    res.json({
      success: true,
      message: 'A new email verification token has been issued.',
      verificationTokenPreview: rawToken,
    });
  } catch (err) {
    console.error('resend-verification error:', err);
    res.status(500).json({ error: 'Failed to generate verification token.' });
  }
});

// Forgot password
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    await ensureSeeded();
    const identifier = sanitizeText(req.body.identifier, 120);
    if (!identifier) {
      return res.status(400).json({ error: 'Please enter your email or username.' });
    }

    const [userRow] = await db
      .select()
      .from(users)
      .where(
        or(
          sql`lower(${users.email}) = lower(${identifier})`,
          sql`lower(${users.username}) = lower(${identifier})`
        )
      )
      .limit(1);

    let previewResetToken: string | undefined;
    if (userRow && userRow.status === 'active') {
      const rawToken = generateToken(24);
      await db.insert(passwordResetTokens).values({
        userId: userRow.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });
      // Security rule: never expose reset tokens for admin accounts in public API responses
      if (!userRow.isAdmin && !process.env.SMTP_HOST) {
        previewResetToken = rawToken;
      }
    }

    res.json({
      success: true,
      message:
        'If a matching active account exists, password reset instructions have been sent.',
      ...(previewResetToken ? { previewResetToken } : {}),
    });
  } catch (err) {
    console.error('forgot-password error:', err);
    res.status(500).json({ error: 'Unable to process password reset request.' });
  }
});

// Reset password with token
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    const confirmPassword =
      typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required.' });
    }
    const pwdError = validatePasswordStrength(newPassword);
    if (pwdError) {
      return res.status(400).json({ error: pwdError });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const tokenHash = hashToken(token);
    const now = new Date();
    const [resetRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const passwordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash, mustChangePassword: false, updatedAt: now })
      .where(eq(users.id, resetRecord.userId));

    await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, resetRecord.id));

    // Revoke all sessions on password reset
    await db
      .update(sessions)
      .set({ revokedAt: now })
      .where(eq(sessions.userId, resetRecord.userId));

    await db.insert(notifications).values({
      userId: resetRecord.userId,
      type: 'security',
      title: 'Password Reset Complete',
      message: 'Your password was reset successfully. All prior sessions have been logged out.',
    });

    res.json({ success: true, message: 'Password reset successfully. You may now log in.' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Change password while logged in (also handles mandatory initial admin password change)
router.post('/change-password', authLimiter, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const currentPassword =
      typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    const confirmPassword =
      typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';
    const identifier = sanitizeText(req.body.identifier || '', 120);

    const pwdError = validatePasswordStrength(newPassword);
    if (pwdError) {
      return res.status(400).json({ error: pwdError });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    let userRow;
    if (req.auth?.user) {
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.auth.user.id))
        .limit(1);
      userRow = found;
    } else if (identifier && currentPassword) {
      const [found] = await db
        .select()
        .from(users)
        .where(
          or(
            sql`lower(${users.username}) = lower(${identifier})`,
            sql`lower(${users.email}) = lower(${identifier})`
          )
        )
        .limit(1);
      userRow = found;
    } else {
      return res.status(401).json({
        error: 'Authentication required. Please log in or enter your username and current password.',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!userRow) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    if (userRow.status !== 'active') {
      return res.status(403).json({ error: 'Account is suspended or inactive.' });
    }

    if (userRow.passwordHash) {
      const ok = await verifyPassword(currentPassword, userRow.passwordHash);
      if (!ok) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      if (currentPassword === newPassword) {
        return res
          .status(400)
          .json({ error: 'New password must be different from your current password.' });
      }
    } else if (!req.auth) {
      return res.status(401).json({
        error: 'Authentication required. Please log in or create an account.',
        code: 'AUTH_REQUIRED',
      });
    }

    const passwordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRow.id));

    // Ensure a valid HTTP-only session cookie is issued/refreshed
    if (!req.auth) {
      await createSessionForUser(req, res, userRow.id, false, userRow.isAdmin);
    }

    const rbac = await loadUserRolesAndPermissions(userRow.id);
    const { passwordHash: _ph, ...safeUser } = {
      ...userRow,
      mustChangePassword: false,
    };

    await db.insert(notifications).values({
      userId: userRow.id,
      type: 'security',
      title: 'Password Changed',
      message: 'Your account password has been updated securely.',
    });

    if (userRow.isAdmin) {
      await db.insert(adminActivityLogs).values({
        adminId: userRow.id,
        adminUsername: userRow.username,
        action: 'ADMIN_PASSWORD_CHANGED',
        targetType: 'User',
        targetId: String(userRow.id),
        details: 'Administrator updated account password.',
        ipAddress: getClientIp(req),
      });
    }

    res.json({
      success: true,
      user: safeUser,
      roles: rbac.roles,
      permissions: rbac.permissions,
      message: 'Password updated successfully.',
    });
  } catch (err) {
    console.error('change-password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;
