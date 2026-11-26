import React, { useEffect, useRef, useState } from 'react';

/*
 * "Writing on the sheet": handwritten text on the landing page's paper appears left to right
 * like a pen writing it, the first time its sheet scrolls into view.
 *
 * A sheet is any element with the `ink-sheet` class and the props from useInkSheet(). Inside it:
 * - <Ink at={0.4}>text</Ink> writes its text in, starting `at` seconds after the sheet shows.
 * - className="ink-fade" with style={{ '--at': '0.5s' }} fades printed parts in.
 * - `--base` on any wrapper shifts every delay inside it (used to stagger the hero cards).
 * The styles are in index.css under "Landing ink". With reduced motion everything is shown at once.
 */

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** True once the element behind `ref` has scrolled into view; it never goes back */
function useSeenOnce(threshold = 0.35) {
  const ref = useRef(null);
  const [written, setWritten] = useState(() => typeof IntersectionObserver === 'undefined' || reducedMotion());

  useEffect(() => {
    if (written || !ref.current) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setWritten(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [written, threshold]);

  return [ref, written];
}

/** Props for a sheet: `data-written` is set once it has come into view, and never removed */
export function useInkSheet() {
  const [ref, written] = useSeenOnce(0.35);
  return { ref, 'data-written': written ? '' : undefined };
}

/**
 * Scroll reveal for a section's panel: the panel fades in, then every element marked with
 * rv(i) inside it fades from see-through and rises into place, one after another. Once only.
 */
export function useReveal() {
  const [ref, shown] = useSeenOnce(0.15);
  return { ref, 'data-shown': shown ? '' : undefined };
}

/** Marks one card in a reveal; `i` is its place in the order (later ones wait a little longer) */
export const rv = (i = 0) => ({ 'data-rv': '', style: { '--rv': i } });

function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return textOf(node.props?.children);
}

/** Handwritten text that writes itself in. Longer text takes longer, like a real pen */
export function Ink({ at = 0, className = '', children }) {
  const chars = textOf(children).length;
  const dur = Math.min(1.6, Math.max(0.35, chars * 0.045));
  return (
    <span className={`ink ${className}`} style={{ '--at': `${at}s`, '--dur': `${dur}s` }}>
      <span className="ink-text">{children}</span>
    </span>
  );
}
