// Which mode the app runs in. Set APP_MODE in backend/.env, or pass --testing / --production.
//
//  testing     For trying the app. No sign-in: you go straight to the practice hub and the editor.
//              Every Pro feature is free (smart revision, AI review), payments are switched off,
//              and data lives in a local file (backend/data/testing-db.json, not in git), so the
//              real database and real users are never touched, even when DATABASE_URL is set.
//  production  The real thing. Sign-in required, Razorpay checkout, Pro features only for Pro
//              accounts. Needs DATABASE_URL; the server refuses to start without it.
//
// When neither is set: production if DATABASE_URL is set, testing otherwise.

const MODES = ['testing', 'production'];
const fromArgs = MODES.find((m) => process.argv.includes(`--${m}`));
const fromEnv = String(process.env.APP_MODE || '').trim().toLowerCase();

export const APP_MODE = fromArgs || (MODES.includes(fromEnv) ? fromEnv : (process.env.DATABASE_URL ? 'production' : 'testing'));
export const isTesting = APP_MODE === 'testing';
export const isProduction = APP_MODE === 'production';
