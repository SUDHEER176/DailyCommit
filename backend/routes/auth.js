import express from 'express';
import { hasDatabase, query } from '../data/neon.js';
import { loadUserData, seedUserData, updateUserProfile } from '../data/store.js';
import { sendVerificationCode, mailConfigured } from '../data/mailer.js';
import { proStatus } from '../data/billing.js';
import {
  requireUser, bearerToken, createSession, deleteSession,
  hashPassword, checkPassword, normalizeEmail, isValidEmail,
  verifyGoogleCredential, googleClientId,
  issueCode, checkCode,
  tooManyAttempts, recordFailure, clearFailures,
} from '../data/auth.js';

const router = express.Router();

const accountsOff = (res) =>
  res.status(503).json({ success: false, error: 'Accounts need a database. Set DATABASE_URL in backend/.env' });

async function publicUser(row) {
  const data = await loadUserData(row.id);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url || null,
    emailVerified: Boolean(row.email_verified),
    hasPassword: Boolean(row.password_hash),
    googleLinked: Boolean(row.google_sub),
    streak: data.user?.streak ?? 0,
    ...proStatus(row),
    isAuthenticated: true,
  };
}

async function signedIn(res, row, status = 200) {
  const { token, expiresAt } = await createSession(row.id);
  res.status(status).json({ success: true, data: { user: await publicUser(row), token, expiresAt } });
}

/** The existing data from before accounts goes to the first account that gets data */
async function noAccountHasData() {
  const { rows } = await query('SELECT NOT EXISTS (SELECT 1 FROM user_state) AS empty');
  return rows[0].empty;
}

async function hasData(userId) {
  const { rows } = await query('SELECT EXISTS (SELECT 1 FROM user_state WHERE user_id = $1) AS has', [userId]);
  return rows[0].has;
}

/** Issue and email a code. Returns { retryAfter } or throws with a status */
async function sendCode(user) {
  const issued = await issueCode(user.email, 'verify');
  if (issued.error) return { retryAfter: issued.retryAfter, throttled: issued.error };
  try {
    await sendVerificationCode({ to: user.email, name: user.name, code: issued.code });
  } catch (err) {
    console.error(`[mail] could not send verification code to ${user.email}: ${err.message}`);
    if (process.env.NODE_ENV !== 'production') {
      // Local development: keep the code and print it, so sign-up can still be tested
      console.log(`\n[mail] (dev only) Verification code for ${user.email}: ${issued.code}\n`);
      return { retryAfter: issued.retryAfter, throttled: 'The email could not be sent. In development the code is printed in the backend console' };
    }
    // Forget the code so a retry is not blocked by the resend cooldown
    await query('DELETE FROM email_codes WHERE email = $1 AND purpose = $2', [user.email, 'verify']).catch(() => {});
    const sandbox = /resend\.dev|testing|own email|verify a domain/i.test(err.message);
    throw Object.assign(
      new Error(sandbox
        ? 'Email sending is in test mode and can only reach the app owner\'s address right now. Use that email or try again later'
        : 'We could not send the email. Check the address and try again'),
      { status: 502 }
    );
  }
  return { retryAfter: issued.retryAfter };
}

const pending = (res, email, sent, status = 202) =>
  res.status(status).json({
    success: true,
    data: { pendingVerification: true, email, retryAfter: sent.retryAfter, notice: sent.throttled || null },
  });

/** GET /api/auth/config: tells the frontend which sign-in methods are available */
router.get('/config', (req, res) => {
  res.json({ success: true, data: { accounts: hasDatabase, googleClientId, emailDelivery: mailConfigured } });
});

/** POST /api/auth/register { name, email, password } → emails a code, no session yet */
router.post('/register', async (req, res) => {
  if (!hasDatabase) return accountsOff(res);
  try {
    const name = String(req.body.name || '').trim().slice(0, 80);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!name) return res.status(400).json({ success: false, error: 'Enter your name' });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, error: 'Enter a valid email address' });
    if (password.length < 8) return res.status(400).json({ success: false, error: 'Use at least 8 characters for your password' });

    const { rows: found } = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user = found[0];

    if (user?.email_verified) {
      return res.status(409).json({
        success: false,
        error: user.google_sub && !user.password_hash
          ? 'This email already has an account. Sign in with Google'
          : 'This email already has an account. Sign in instead',
      });
    }

    const hash = await hashPassword(password);
    if (user) {
      // Never verified: let the person start over with a new name and password
      ({ rows: [user] } = await query('UPDATE users SET name = $1, password_hash = $2 WHERE id = $3 RETURNING *', [name, hash, user.id]));
    } else {
      ({ rows: [user] } = await query('INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *', [email, name, hash]));
    }

    pending(res, email, await sendCode(user));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    console.error('[auth] register failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not create your account' });
  }
});

/** POST /api/auth/verify-email { email, code } → verifies and signs in */
router.post('/verify-email', async (req, res) => {
  if (!hasDatabase) return accountsOff(res);
  const email = normalizeEmail(req.body.email);
  const limitKey = `verify|${req.ip}|${email}`;
  try {
    if (tooManyAttempts(limitKey)) {
      return res.status(429).json({ success: false, error: 'Too many attempts. Try again in 15 minutes' });
    }
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user = rows[0];
    if (!user) return res.status(400).json({ success: false, error: 'Ask for a new code' });
    if (user.email_verified) return res.status(400).json({ success: false, error: 'This email is already verified. Sign in instead' });

    const result = await checkCode(email, 'verify', req.body.code);
    if (!result.ok) {
      recordFailure(limitKey);
      return res.status(400).json({ success: false, error: result.error });
    }
    clearFailures(limitKey);

    ({ rows: [user] } = await query(
      'UPDATE users SET email_verified = true, email_verified_at = now() WHERE id = $1 RETURNING *',
      [user.id]
    ));
    if (!(await hasData(user.id))) {
      await seedUserData(user.id, { name: user.name, email: user.email, claimLegacy: await noAccountHasData() });
    }
    await signedIn(res, user, 200);
  } catch (err) {
    console.error('[auth] verify failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not verify your email' });
  }
});

/** POST /api/auth/resend-code { email } */
router.post('/resend-code', async (req, res) => {
  if (!hasDatabase) return accountsOff(res);
  const email = normalizeEmail(req.body.email);
  try {
    const { rows } = await query('SELECT * FROM users WHERE email = $1 AND NOT email_verified', [email]);
    // Same answer whether or not the email has an account, so this cannot be used to look up emails
    if (!rows[0]) return pending(res, email, { retryAfter: 60 }, 200);
    pending(res, email, await sendCode(rows[0]), 200);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    console.error('[auth] resend failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not send a new code' });
  }
});

/** POST /api/auth/login { email, password } */
router.post('/login', async (req, res) => {
  if (!hasDatabase) return accountsOff(res);
  const email = normalizeEmail(req.body.email);
  const limitKey = `${req.ip}|${email}`;
  try {
    if (tooManyAttempts(limitKey)) {
      return res.status(429).json({ success: false, error: 'Too many attempts. Try again in 15 minutes' });
    }
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    const ok = await checkPassword(String(req.body.password || ''), user?.password_hash);
    if (!user || !user.password_hash || !ok) {
      recordFailure(limitKey);
      const googleOnly = user && !user.password_hash && user.google_sub;
      return res.status(401).json({
        success: false,
        error: googleOnly ? 'This account uses Google. Sign in with Google' : 'Email or password is incorrect',
      });
    }
    clearFailures(limitKey);

    if (!user.email_verified) {
      // Right password, but the email was never confirmed: send a code first
      return pending(res, email, await sendCode(user), 403);
    }
    await signedIn(res, user);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    console.error('[auth] login failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not sign you in' });
  }
});

/** POST /api/auth/google { credential }: Google has already verified the email */
router.post('/google', async (req, res) => {
  if (!hasDatabase) return accountsOff(res);
  try {
    const g = await verifyGoogleCredential(String(req.body.credential || ''));

    let { rows } = await query('SELECT * FROM users WHERE google_sub = $1', [g.sub]);
    let user = rows[0];

    if (!user) {
      ({ rows } = await query('SELECT * FROM users WHERE email = $1', [g.email]));
      if (rows[0]) {
        // Same email signed up with a password: link Google, which also proves the email
        ({ rows } = await query(
          `UPDATE users SET google_sub = $1, avatar_url = COALESCE(avatar_url, $2),
             email_verified = true, email_verified_at = COALESCE(email_verified_at, now())
           WHERE id = $3 RETURNING *`,
          [g.sub, g.avatarUrl, rows[0].id]
        ));
        user = rows[0];
      }
    }

    if (!user) {
      ({ rows } = await query(
        `INSERT INTO users (email, name, google_sub, avatar_url, email_verified, email_verified_at)
         VALUES ($1, $2, $3, $4, true, now()) RETURNING *`,
        [g.email, g.name, g.sub, g.avatarUrl]
      ));
      user = rows[0];
    }
    if (!(await hasData(user.id))) {
      await seedUserData(user.id, { name: user.name, email: user.email, claimLegacy: await noAccountHasData() });
    }

    await signedIn(res, user);
  } catch (err) {
    const status = err.status || 401;
    if (status >= 500) console.error('[auth] google sign-in failed:', err.message);
    res.status(status).json({ success: false, error: status === 401 ? 'Google sign-in failed. Try again' : err.message });
  }
});

/** GET /api/auth/me */
router.get('/me', requireUser, async (req, res) => {
  if (!hasDatabase) return accountsOff(res);
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) return res.status(401).json({ success: false, error: 'Sign in to continue' });
    res.json({ success: true, data: await publicUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load your profile' });
  }
});

/** PATCH /api/auth/me { name } */
router.patch('/me', requireUser, async (req, res) => {
  if (!hasDatabase) return accountsOff(res);
  const name = String(req.body.name || '').trim().slice(0, 80);
  if (!name) return res.status(400).json({ success: false, error: 'Enter your name' });
  const { rows } = await query('UPDATE users SET name = $1 WHERE id = $2 RETURNING *', [name, req.userId]);
  await updateUserProfile(req.userId, { name });
  res.json({ success: true, data: await publicUser(rows[0]) });
});

/** POST /api/auth/logout */
router.post('/logout', async (req, res) => {
  const token = bearerToken(req);
  if (hasDatabase && token) await deleteSession(token).catch(() => {});
  res.json({ success: true });
});

export default router;
