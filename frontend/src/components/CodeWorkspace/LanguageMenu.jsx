import React, { useState, useEffect, useRef } from 'react';
import { Code2, Check, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from './languages';

// The language as a chip with its own menu (a native <select> can't be styled to match)
export default function LanguageMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SUPPORTED_LANGUAGES.find((l) => l.id === value) || SUPPORTED_LANGUAGES[0];
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.label}`}
        className={`h-7 pl-2 pr-1.5 inline-flex items-center gap-1.5 rounded-lg border text-[13px] transition-colors ${
          open ? 'border-white/[0.14] bg-white/[0.06] text-white' : 'border-white/[0.08] text-slate-200 hover:border-white/[0.14]'
        }`}
      >
        <Code2 className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
        {current.label}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute left-0 top-full mt-1 z-20 w-60 p-1 rounded-xl border border-white/[0.08] bg-ink-850 shadow-lg animate-fadeIn"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const selected = lang.id === value;
            return (
              <li key={lang.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => { onChange(lang.id); setOpen(false); }}
                  className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between gap-3 text-left transition-colors ${
                    selected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span>
                    <span className="block text-[13px] text-white">{lang.label}</span>
                    <span className="block text-xs text-slate-500">{lang.detail}</span>
                  </span>
                  {selected && <Check className="w-4 h-4 text-brand-400 flex-shrink-0" strokeWidth={1.5} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
