// Helpers for showing a signed-in person's real numbers on the landing page.
// Signed out, the same components fall back to example data with an "Example" tag.

export const isSignedIn = (user) => Boolean(user?.isAuthenticated);

/** Local YYYY-MM-DD, the same shape as plan dates and the stats activity keys */
export function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date, n) {
  const x = new Date(date);
  x.setDate(x.getDate() + n);
  return x;
}

export const shortDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Solves on one day → heatmap level 0 to 4 */
export const levelFor = (n) => (!n ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4);

/** Whole days from today until a YYYY-MM-DD date, never below 0 */
export function daysUntil(ymd) {
  if (!ymd) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((target - today) / 86400000));
}

export function parseDay(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}
