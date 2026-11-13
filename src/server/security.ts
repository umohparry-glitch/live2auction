import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const BCRYPT_ROUNDS = 12;

// Per-process ephemeral fallback secret if SESSION_HMAC_SECRET is not injected
const PROCESS_SECRET = crypto.randomBytes(32).toString('hex');

function getHmacSecret(): string {
  return process.env.SESSION_HMAC_SECRET || PROCESS_SECRET;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signCsrfToken(sessionNonce: string): string {
  const payload = `${sessionNonce}.${Date.now()}`;
  const sig = crypto
    .createHmac('sha256', getHmacSecret())
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}

export function verifyCsrfSignature(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [nonce, tsStr, sig] = parts;
  if (!nonce || !tsStr || !sig) return false;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return false;
  // Token valid for 24 hours
  if (Date.now() - ts > 24 * 60 * 60 * 1000) return false;

  const expected = crypto
    .createHmac('sha256', getHmacSecret())
    .update(`${nonce}.${tsStr}`)
    .digest('hex');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeRichText(input: unknown, maxLength = 8000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .trim()
    .slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,24}$/.test(username);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?[0-9]{7,16}$/.test(cleaned);
}

export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}
