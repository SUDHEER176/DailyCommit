import { useEffect, useState } from 'react';
import { api } from '../services/api';

// The server's mode ('testing' | 'production'), read once per page load from /api/auth/config.
// Testing: no sign-in, every Pro feature free, payments off. Production: the real thing.
// While loading, or when the server can't be reached, the mode is null.

let modePromise = null;
export const loadAppMode = () =>
  (modePromise ||= api.getAuthConfig().then((cfg) => (cfg?.offline ? null : cfg?.mode || null)));

export function useAppMode() {
  const [mode, setMode] = useState(null);
  useEffect(() => {
    let alive = true;
    loadAppMode().then((m) => { if (alive) setMode(m); });
    return () => { alive = false; };
  }, []);
  return mode;
}
