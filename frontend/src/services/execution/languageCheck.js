// Spots code written in one language but run as another, e.g. a JavaScript draft sitting in
// the Python editor. This is only ever a hint: code always runs, and the hint is added to the
// error only when the run already failed to parse or compile. It never blocks a run.

const LABELS = { javascript: 'JavaScript', python: 'Python', cpp: 'C++', java: 'Java' };

// Signs that only make sense in one language
const SIGNS = {
  python: [/^\s*def\s+\w+\s*\(/m, /^\s*class\s+\w+(\([^)]*\))?\s*:/m, /\bself\b/, /^\s*(elif|except)\b/m],
  javascript: [/^\s*(var|let|const)\s+\w+\s*=\s*function\b/m, /^\s*function\s+\w+\s*\(/m, /\w+\.prototype\.\w+\s*=/, /=>\s*[{(\w]/],
  cpp: [/^\s*#include\s*</m, /^\s*using\s+namespace\s+std\s*;/m, /^\s*public:\s*$/m, /\bvector\s*<\w/],
  java: [/^\s*import\s+java\./m, /\bpublic\s+(static\s+)?[\w<>\[\], ]+\s+\w+\s*\([^)]*\)\s*\{/m, /\bSystem\.out\./, /\bString\[\]/],
};

const score = (code, lang) => SIGNS[lang].filter((re) => re.test(code)).length;

/**
 * The other language this code clearly is, or null. "Clearly" means no sign at all of the
 * selected language (so ordinary code in it never matches) and more signs of one other
 * language than of any other.
 */
export function clearlyOtherLanguage(selected, code = '') {
  if (!SIGNS[selected] || score(code, selected) > 0) return null;
  const [best, second] = Object.keys(SIGNS)
    .filter((l) => l !== selected)
    .map((l) => [l, score(code, l)])
    .sort((a, b) => b[1] - a[1]);
  if (best[1] < 1 || best[1] === second?.[1]) return null;
  return best[0];
}

/** A hint to add to a parse or compile error, or null */
export function languageHint(selected, code) {
  const other = clearlyOtherLanguage(selected, code);
  if (!other) return null;
  return `This looks like ${LABELS[other]} code, but the language is set to ${LABELS[selected]}. Switch the language, or press Reset to load the ${LABELS[selected]} starter code`;
}

/** Errors that mean the code didn't parse or compile, as opposed to failing while it ran */
export const isParseError = (message = '') =>
  /^(SyntaxError|IndentationError|TabError)\b/.test(message) || /\berror:/.test(message) || /expected|unexpected token/i.test(message);

export const languageLabel = (id) => LABELS[id] || id;
