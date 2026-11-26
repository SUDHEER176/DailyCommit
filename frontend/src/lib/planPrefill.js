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

// A problem picked on the landing page's Today's plan sheets, opened in the hub's editor.
// { id, kind: 'plan' | 'review' }, read once like the plan answers above.
const OPEN_KEY = 'codestreak_open_problem';

export function setOpenProblem(id, kind) {
  try { sessionStorage.setItem(OPEN_KEY, JSON.stringify({ id, kind })); } catch { /* storage blocked: the hub opens without it */ }
}

export function takeOpenProblem() {
  try {
    const raw = sessionStorage.getItem(OPEN_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(OPEN_KEY);
    const v = JSON.parse(raw);
    return v && typeof v.id === 'string' ? v : null;
  } catch {
    return null;
  }
}
