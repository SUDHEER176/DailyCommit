// Class names shared by the workspace's cards, tabs and buttons

export const tabClass = (active) =>
  `relative h-full inline-flex items-center gap-2 text-[13px] transition-colors ${
    active
      ? 'text-white after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-[var(--text)]'
      : 'text-slate-500 hover:text-slate-200'
  }`;

export const iconButton =
  'w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors';
export const toolButton =
  'h-7 px-2 inline-flex items-center gap-1.5 rounded-md text-xs text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors';
export const card = 'h-full flex flex-col rounded-xl border border-white/[0.08] bg-ink-850 overflow-hidden';

/** A test case's square: grey until it runs, then green or red */
export const squareClass = (state) =>
  state === 'pass' ? 'bg-emerald-400' : state === 'fail' ? 'bg-rose-400' : 'bg-[var(--raised)] ring-1 ring-inset ring-white/[0.08]';
