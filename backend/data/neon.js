import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Neon connection. Set DATABASE_URL in backend/.env (see .env.example).
// Without it, the store falls back to the local db.json file and accounts are off.
//
// This uses Neon's serverless driver, which speaks Postgres over a WebSocket on port 443.
// Plain Postgres on port 5432 gets reset on this network, and 443 works on almost any network.
neonConfig.webSocketConstructor = ws;

const { DATABASE_URL } = process.env;

export const hasDatabase = Boolean(DATABASE_URL);

export const pool = hasDatabase
  ? new Pool({ connectionString: DATABASE_URL, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 })
  : null;

if (pool) {
  // Neon closes idle connections; log instead of crashing the server
  pool.on('error', (err) => console.error('[neon] idle client error:', err.message));
}

export function query(text, params) {
  return pool.query(text, params);
}

export async function ensureSchema() {
  // Legacy single-user table. Its rows are handed to the first account that registers.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      key         text PRIMARY KEY,
      value       jsonb NOT NULL,
      updated_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email          text UNIQUE NOT NULL,
      name           text NOT NULL,
      password_hash  text,
      google_sub     text UNIQUE,
      avatar_url     text,
      created_at     timestamptz NOT NULL DEFAULT now(),
      last_login_at  timestamptz
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash  text PRIMARY KEY,
      user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  timestamptz NOT NULL DEFAULT now(),
      expires_at  timestamptz NOT NULL
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)');
  // Email verification: accounts stay unverified until the emailed code is entered
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz');
  await pool.query('UPDATE users SET email_verified = true, email_verified_at = COALESCE(email_verified_at, now()) WHERE google_sub IS NOT NULL AND NOT email_verified');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_codes (
      email       text NOT NULL,
      purpose     text NOT NULL,
      code_hash   text NOT NULL,
      expires_at  timestamptz NOT NULL,
      attempts    int NOT NULL DEFAULT 0,
      sent_at     timestamptz NOT NULL DEFAULT now(),
      sends_today int NOT NULL DEFAULT 1,
      PRIMARY KEY (email, purpose)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_state (
      user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key         text NOT NULL,
      value       jsonb NOT NULL,
      updated_at  timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, key)
    )
  `);
}

// ── Per-user collections ──
export async function loadUserState(userId) {
  const { rows } = await pool.query('SELECT key, value FROM user_state WHERE user_id = $1', [userId]);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function upsertUserKeys(userId, entries) {
  if (!entries.length) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of entries) {
      await client.query(
        `INSERT INTO user_state (user_id, key, value, updated_at)
         VALUES ($1, $2, $3::jsonb, now())
         ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [userId, key, JSON.stringify(value)]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// ── Legacy single-user state ──
export async function loadState() {
  const { rows } = await pool.query('SELECT key, value FROM app_state');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function ping() {
  const { rows } = await pool.query('SELECT now() AS now');
  return rows[0];
}
