import crypto from 'node:crypto';

// Remembers recent code analyses, so pressing Run again on code that hasn't changed (or Submit
// right after a Run) is answered instantly and uses none of the day's AI quota. In memory only,
// oldest entries go first; a restart just means the next Run asks again.

export function createAnalysisCache(max = 300) {
  const entries = new Map();
  return {
    /** A key for one person, problem, language and piece of code (line endings and outer spaces ignored) */
    key(owner, problemId, language, code) {
      const normalized = String(code ?? '').replace(/\r\n/g, '\n').trim();
      return crypto.createHash('sha1').update([owner, problemId, language, normalized].map(String).join('\u0000')).digest('hex');
    },
    get: (key) => entries.get(key) ?? null,
    set(key, value) {
      entries.set(key, value);
      if (entries.size > max) entries.delete(entries.keys().next().value);
    },
    get size() { return entries.size; },
  };
}
