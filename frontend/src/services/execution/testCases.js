// Reading LeetCode-style test cases and checking answers. Shared by every language runner.

const ENTITIES = { '&quot;': '"', '&#39;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>', '&amp;': '&', '&nbsp;': ' ' };

/** Undo the HTML escaping LeetCode statements carry, e.g. &quot;abc&quot; → "abc" */
export function decodeEntities(text = '') {
  return String(text)
    .replace(/&(quot|#39|apos|lt|gt|nbsp|amp);/g, (m) => ENTITIES[m])
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** Split on commas that are not inside brackets or quotes */
function splitTopLevel(text, sep = ',') {
  const parts = [];
  let depth = 0, quote = null, start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '[' || c === '{' || c === '(') depth++;
    else if (c === ']' || c === '}' || c === ')') depth--;
    else if (c === sep && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter((p) => p !== '');
}

/** One literal from a test case: JSON, plus Python-style True/False/None */
export function parseValue(raw) {
  const text = decodeEntities(raw).trim();
  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(text.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null'));
    } catch {
      return text; // leave as a bare string, e.g. an unquoted word
    }
  }
}

/**
 * Inputs of one case as [{ name, value }].
 * Accepts the statement form "nums = [2,7], target = 9" and the raw form "[2,7]\n9".
 */
export function parseInputs(input) {
  const text = decodeEntities(input).trim();
  if (/^[A-Za-z_]\w*\s*=/.test(text)) {
    // Named: split before each "name =" at the top level
    const pieces = splitTopLevel(text.replace(/\n/g, ', '));
    const named = [];
    pieces.forEach((piece) => {
      const m = piece.match(/^([A-Za-z_]\w*)\s*=\s*([\s\S]*)$/);
      if (m) named.push({ name: m[1], raw: m[2] });
      else if (named.length) named[named.length - 1].raw += `, ${piece}`; // a comma inside an unquoted value
    });
    return named.map(({ name, raw }) => ({ name, value: parseValue(raw) }));
  }
  return text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => ({ name: null, value: parseValue(line) }));
}

/** Design problems ("LRUCache", "put", ...) take an operations list and an arguments list */
export function isDesignCase(inputs) {
  if (inputs.length !== 2) return false;
  const [ops, args] = inputs.map((i) => i.value);
  return Array.isArray(ops) && ops.length > 0 && ops.every((o) => typeof o === 'string')
    && Array.isArray(args) && args.length === ops.length && args.every(Array.isArray);
}

// ── Comparing answers ──

/** Sort nested lists so two answers given in any order compare equal */
function canonical(value) {
  if (!Array.isArray(value)) return value;
  const items = value.map(canonical);
  return items
    .map((v) => [JSON.stringify(v), v])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([, v]) => v);
}

function deepEqual(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(b));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
  }
  return a === b;
}

/** Does the statement say the answer may come in any order? */
export function allowsAnyOrder(problem) {
  const text = `${problem?.contentHtml || ''} ${problem?.description || ''}`;
  return /\bany order\b|order[^.]{0,40}does not matter|order[^.]{0,40}doesn't matter/i.test(decodeEntities(text));
}

/** Compare a runner's JSON output with the expected text from the test case */
export function answersMatch(actualJson, expectedText, { anyOrder = false } = {}) {
  const expected = parseValue(expectedText);
  let actual;
  try { actual = JSON.parse(actualJson); } catch { actual = actualJson; }
  if (deepEqual(actual, expected)) return true;
  return anyOrder && deepEqual(canonical(actual), canonical(expected));
}

/** Expected text for display, with entities decoded */
export const displayExpected = (text) => decodeEntities(text || '').trim();
