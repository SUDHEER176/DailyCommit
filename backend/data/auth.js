import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { hasDatabase, query } from './neon.js';
import { loadUserData, runAsUser } from './store.js';

const SESSION_DAYS = 30;
const SESSION_CACHE_MS = 5 * 60 * 1000;
const sessionCache = new Map(); // token hash -> { userId, expiresAt, cachedAt }

export const googleClientId = process.env.GOOGLE_CLIENT_ID || null;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

// A real bcrypt hash of a random string, used so unknown emails take as long as wrong passwords
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function checkPassword(password, hash) {
  return bcrypt.compare(password, hash || DUMMY_HASH);
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [hashToken(token), userId, expiresAt]);
  await query('UPDATE users SET last_login_at = now() WHERE id = $1', [userId]);
  return { token, expiresAt };
}

export async function deleteSession(token) {
  const h = hashToken(token);
  sessionCache.delete(h);
  await query('DELETE FROM sessions WHERE token_hash = $1', [h]);
}

async function lookupSession(token) {
  const h = hashToken(token);
  const cached = sessionCache.get(h);
  if (cached && Date.now() - cached.cachedAt < SESSION_CACHE_MS && cached.expiresAt > Date.now()) return cached.userId;
  const { rows } = await query(
    `SELECT s.user_id, s.expires_at, u.email_verified
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1`,
    [h]
  );
  const row = rows[0];
  // Only verified accounts get a working session
  if (!row || !row.email_verified || new Date(row.expires_at).getTime() <= Date.now()) {
    sessionCache.delete(h);
    if (row) await query('DELETE FROM sessions WHERE token_hash = $1', [h]);
    return null;
  }
  sessionCache.set(h, { userId: row.user_id, expiresAt: new Date(row.expires_at).getTime(), cachedAt: Date.now() });
  return row.user_id;
}

export function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

/**
 * Protects data routes. In Neon mode the request must carry a valid session token,
 * and the route then runs with that user's data. In file mode everything stays open.
 */
export async function requireUser(req, res, next) {
  if (!hasDatabase) return next();
  try {
    const token = bearerToken(req);
    const userId = token && (await lookupSession(token));
    if (!userId) return res.status(401).json({ success: false, error: 'Sign in to continue' });
    await loadUserData(userId);
    req.userId = userId;
    runAsUser(userId, () => next());
  } catch (err) {
    console.error('[auth] session check failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not check your session' });
  }
}

export async function verifyGoogleCredential(credential) {
  if (!googleClient) throw Object.assign(new Error('Google sign-in is not set up'), { status: 503 });
  const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId });
  const p = ticket.getPayload();
  if (!p?.email || !p.email_verified) throw Object.assign(new Error('Your Google account email is not verified'), { status: 400 });
  return { sub: p.sub, email: normalizeEmail(p.email), name: p.name || p.email.split('@')[0], avatarUrl: p.picture || null };
}

// ── Email verification codes ──
const CODE_TTL_MIN = 10;
const RESEND_COOLDOWN_S = 60;
const MAX_SENDS_PER_DAY = 10;
const MAX_ATTEMPTS = 5;

const codeHash = (email, purpose, code) =>
  crypto.createHash('sha256').update(`${email}:${purpose}:${code}`).digest('hex');

/**
 * Create a fresh 6 digit code for an email. Returns { code } or { error, retryAfter }.
 * The code itself is never stored, only its hash.
 */
export async function issueCode(email, purpose = 'verify') {
  const { rows } = await query('SELECT sent_at, sends_today FROM email_codes WHERE email = $1 AND purpose = $2', [email, purpose]);
  const prev = rows[0];
  if (prev) {
    const since = (Date.now() - new Date(prev.sent_at).getTime()) / 1000;
    if (since < RESEND_COOLDOWN_S) {
      return { error: 'Wait a moment before asking for another code', retryAfter: Math.ceil(RESEND_COOLDOWN_S - since) };
    }
    if (since < 86400 && prev.sends_today >= MAX_SENDS_PER_DAY) {
      return { error: 'Too many codes sent to this email today. Try again tomorrow', retryAfter: Math.ceil(86400 - since) };
    }
  }
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60000);
  await query(
    `INSERT INTO email_codes (email, purpose, code_hash, expires_at, attempts, sent_at, sends_today)
     VALUES ($1, $2, $3, $4, 0, now(), 1)
     ON CONFLICT (email, purpose) DO UPDATE SET
       code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0, sent_at = now(),
       sends_today = CASE WHEN email_codes.sent_at > now() - interval '1 day' THEN email_codes.sends_today + 1 ELSE 1 END`,
    [email, purpose, codeHash(email, purpose, code), expiresAt]
  );
  return { code, retryAfter: RESEND_COOLDOWN_S };
}

/** Check a code. Returns { ok: true } or { ok: false, error } */
export async function checkCode(email, purpose, code) {
  const { rows } = await query('SELECT code_hash, expires_at, attempts FROM email_codes WHERE email = $1 AND purpose = $2', [email, purpose]);
  const row = rows[0];
  if (!row) return { ok: false, error: 'Ask for a new code' };
  if (new Date(row.expires_at).getTime() <= Date.now()) return { ok: false, error: 'This code has expired. Ask for a new one' };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: 'Too many wrong codes. Ask for a new one' };

  const given = Buffer.from(codeHash(email, purpose, String(code || '').replace(/\D/g, '')), 'hex');
  const stored = Buffer.from(row.code_hash, 'hex');
  if (given.length !== stored.length || !crypto.timingSafeEqual(given, stored)) {
    await query('UPDATE email_codes SET attempts = attempts + 1 WHERE email = $1 AND purpose = $2', [email, purpose]);
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return { ok: false, error: left > 0 ? `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left` : 'Too many wrong codes. Ask for a new one' };
  }
  await query('DELETE FROM email_codes WHERE email = $1 AND purpose = $2', [email, purpose]);
  return { ok: true };
}

// Simple in-memory limiter for sign-in attempts: 10 per 15 minutes per IP and email
const attempts = new Map();
export function tooManyAttempts(key) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((t) => now - t < 15 * 60 * 1000);
  attempts.set(key, recent);
  return recent.length >= 10;
}
export function recordFailure(key) {
  attempts.set(key, [...(attempts.get(key) || []), Date.now()]);
}
export function clearFailures(key) {
  attempts.delete(key);
}
