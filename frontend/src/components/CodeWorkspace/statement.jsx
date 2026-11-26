// Helpers for showing a problem statement and its results
import React from 'react';

export const difficultyText = {
  Easy: 'text-emerald-400',
  Medium: 'text-amber-400',
  Hard: 'text-rose-400',
};

// Problem statements arrive as light markdown. Render **bold** and `code` instead of showing the marks.
export function renderInline(text = '') {
  return String(text)
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-medium text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1 py-0.5 rounded bg-white/[0.06] font-mono text-[13px] text-slate-100">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
}

export function getProblemSlug(prob) {
  if (!prob) return '';
  const url = prob.link || prob.problemUrl || prob.url || '';
  if (url.includes('problems/')) {
    return url.split('problems/')[1].split('/')[0].replace(/[^a-z0-9-]/gi, '').toLowerCase();
  }
  if (prob.title) {
    return prob.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  return '';
}

// Hidden cases can hold a thousand numbers; the Result tab shows the start, the tooltip the rest
export const clip = (text, max = 240) => {
  const t = String(text ?? '');
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

// LeetCode statements pad with empty paragraphs and end headings with colons
export const tidyStatement = (html) => String(html)
  .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
  .replace(/(<strong[^>]*>\s*(?:Example \d+|Constraints))\s*:\s*(<\/strong>)/gi, '$1$2');
