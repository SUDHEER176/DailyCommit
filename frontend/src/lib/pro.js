// Pro status helpers. The server is the source of truth (`plan` and `proUntil` on the user from
// /auth/me); these only read it, so every screen agrees on what "Pro" means.

const DAY_MS = 86400000;
export const EXPIRY_WARNING_DAYS = 7;
const ENDED_NOTICE_DAYS = 14;

const untilMs = (user) => (user?.proUntil ? Date.parse(user.proUntil) : NaN);

/** Signed in and Pro right now. Checks the date too, in case the cached profile is old */
export function isPro(user, now = Date.now()) {
  const until = untilMs(user);
  return Boolean(user?.isAuthenticated && user.plan === 'pro' && until > now);
}

/** Whole days of Pro left, rounded up (so "ends today" is 1), or null when not Pro */
export function proDaysLeft(user, now = Date.now()) {
  if (!isPro(user, now)) return null;
  return Math.max(1, Math.ceil((untilMs(user) - now) / DAY_MS));
}

/**
 * What to tell the person about their plan, if anything:
 *  { kind: 'expiring', days, until }  Pro ends within a week
 *  { kind: 'ended', until }           Pro ended in the last two weeks
 *  null                                nothing to say
 */
export function proNotice(user, now = Date.now()) {
  if (!user?.isAuthenticated) return null;
  const until = untilMs(user);
  if (Number.isNaN(until)) return null;
  if (until > now) {
    const days = proDaysLeft(user, now);
    return days <= EXPIRY_WARNING_DAYS ? { kind: 'expiring', days, until: new Date(until) } : null;
  }
  return now - until <= ENDED_NOTICE_DAYS * DAY_MS ? { kind: 'ended', until: new Date(until) } : null;
}
