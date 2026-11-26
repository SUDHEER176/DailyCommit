import { useState, useEffect } from 'react';

// Seconds on this problem while the tab is visible; the person can pause it
export function useSolveTimer(resetKey) {
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { setSeconds(0); setPaused(false); }, [resetKey]);
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const sec = String(seconds % 60).padStart(2, '0');
  const label = h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${String(m).padStart(2, '0')}:${sec}`;
  return { label, paused, toggle: () => setPaused((v) => !v) };
}
