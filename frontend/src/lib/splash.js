// Controls the splash screen defined in index.html.
const MIN_VISIBLE_MS = 700;
const start = performance.now();
let hidden = false;

const $ = (id) => document.getElementById(id);

// Resolves when the intro video in index.html ends or is skipped (immediately when there is no intro).
const introDone = window.__splashIntro || Promise.resolve();

export function hideSplash() {
  if (hidden) return;
  hidden = true;
  introDone.then(fadeOut);
}

function fadeOut() {
  const el = $('splash');
  if (!el) return;
  const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - start));
  setTimeout(() => {
    el.classList.add('splash-hide');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 800); // fallback if transitionend never fires
  }, wait);
}

// Updates the line under the logo. showSkip reveals the "Continue offline" button.
export function setSplashStatus(text, showSkip = false) {
  const status = $('splash-status');
  if (status) status.textContent = text;
  const skip = $('splash-skip');
  if (skip) skip.hidden = !showSkip;
}

// Calls fn when the user clicks "Continue offline". Returns an unsubscribe function.
export function onSplashSkip(fn) {
  const btn = $('splash-skip');
  if (!btn) return () => {};
  const handler = () => { btn.hidden = true; fn(); };
  btn.addEventListener('click', handler);
  return () => btn.removeEventListener('click', handler);
}
