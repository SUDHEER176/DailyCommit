// Answers picked in the landing page's plan bar, handed to the plan wizard in the practice hub.
// Session storage, read once: the hub opens the wizard with these answers filled in.
const KEY = 'codestreak_plan_prefill';

export function setPlanPrefill(answers) {
  try { sessionStorage.setItem(KEY, JSON.stringify(answers)); } catch { /* storage blocked: the wizard opens with defaults */ }
}

export function takePlanPrefill() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}
