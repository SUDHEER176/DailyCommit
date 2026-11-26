// Hidden Submit tests for the first 50 problems of the DailyCode 150.
//
// Each entry has LeetCode's metaData (so cases match what the editor gets at runtime), a reference
// solution, examples from the statement with their known answers (the generator refuses to run if
// the reference gets one wrong), and a seeded generator of edge cases and random cases.
// Expected answers are never typed by hand: `npm run hidden-tests` runs the reference through the
// real harness and JavaScript runner to compute them.
//
// Left out: Encode and Decode Strings, Meeting Rooms I and II (Premium, with hand-written tests in
// src/data/premiumProblems.js) and Copy List with Random Pointer (its Node type can't run yet).

const fn = (name, params, ret, extra = {}) => ({ name, params: params.map(([n, type]) => ({ name: n, type })), return: { type: ret }, ...extra });
const cls = (classname, ctor, methods) => ({
  classname,
  constructor: { params: ctor.map(([n, type]) => ({ name: n, type })) },
  methods: methods.map(([name, params, ret]) => fn(name, params, ret)),
});

// ── Seeded random helpers (mulberry32), so `npm run hidden-tests` always writes the same file ──
export function makeRandom(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = (xs) => xs[int(0, xs.length - 1)];
  const arr = (n, lo, hi) => Array.from({ length: n }, () => int(lo, hi));
  const shuffle = (xs) => { const a2 = [...xs]; for (let i = a2.length - 1; i > 0; i--) { const j = int(0, i); [a2[i], a2[j]] = [a2[j], a2[i]]; } return a2; };
  const distinct = (n, lo, hi) => shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, n);
  const str = (n, alphabet) => Array.from({ length: n }, () => pick(alphabet)).join('');
  const sortedDistinct = (n, lo, hi) => distinct(n, lo, hi).sort((x, y) => x - y);
  return { next, int, pick, arr, shuffle, distinct, str, sortedDistinct };
}

const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');

/** Count index pairs i < j with a[i] + a[j] === target */
const pairCount = (a, target) => { let c = 0; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] + a[j] === target) c++; return c; };

export const PROBLEMS = [
  {
    slug: 'contains-duplicate',
    meta: fn('containsDuplicate', [['nums', 'integer[]']], 'boolean'),
    ref: function containsDuplicate(nums) { return new Set(nums).size !== nums.length; },
    examples: [[[[1, 2, 3, 1]], true], [[[1, 2, 3, 4]], false], [[[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], true]],
    generate: (r) => [
      [[7]], [[-1, -1]], [[0, 1]],
      [r.distinct(50, -1000, 1000)],
      [[...r.distinct(30, -100, 100), 5, 5]],
      [r.arr(200, -1e9, 1e9)],
      [r.shuffle([...r.distinct(99, 1, 500), 250])],
    ],
  },
  {
    slug: 'valid-anagram',
    meta: fn('isAnagram', [['s', 'string'], ['t', 'string']], 'boolean'),
    ref: function isAnagram(s, t) { return s.length === t.length && [...s].sort().join('') === [...t].sort().join(''); },
    examples: [[['anagram', 'nagaram'], true], [['rat', 'car'], false]],
    generate: (r) => {
      const w = r.str(40, LOWER);
      return [
        ['a', 'a'], ['a', 'b'], ['ab', 'a'], ['aacc', 'ccac'],
        [w, r.shuffle([...w]).join('')],
        [w, r.shuffle([...w]).join('').slice(1) + 'z'],
        [r.str(60, ['a', 'b']), r.str(60, ['a', 'b'])],
      ];
    },
  },
  {
    slug: 'two-sum',
    meta: fn('twoSum', [['nums', 'integer[]'], ['target', 'integer']], 'integer[]'),
    ref: function twoSum(nums, target) { const seen = new Map(); for (let i = 0; i < nums.length; i++) { if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i]; seen.set(nums[i], i); } return []; },
    examples: [[[[2, 7, 11, 15], 9], [0, 1]], [[[3, 2, 4], 6], [1, 2]], [[[3, 3], 6], [0, 1]]],
    generate: (r) => {
      const cases = [[[1, 5], 6], [[-3, 4, 3, 90], 0], [[0, 4, 3, 0], 0], [[-1, -2, -3, -4, -5], -8]];
      // Exactly one pair adds up to the target, as the problem promises
      while (cases.length < 9) {
        const nums = r.arr(r.int(2, 80), -1e4, 1e4);
        const i = r.int(0, nums.length - 1);
        let j = r.int(0, nums.length - 1);
        if (i === j) continue;
        const target = nums[i] + nums[j];
        if (pairCount(nums, target) === 1) cases.push([nums, target]);
      }
      return cases;
    },
  },
  {
    slug: 'group-anagrams',
    meta: fn('groupAnagrams', [['strs', 'string[]']], 'list<list<string>>'),
    anyOrder: true,
    ref: function groupAnagrams(strs) { const m = new Map(); for (const s of strs) { const k = [...s].sort().join(''); if (!m.has(k)) m.set(k, []); m.get(k).push(s); } return [...m.values()]; },
    examples: [[[['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], [['bat'], ['nat', 'tan'], ['ate', 'eat', 'tea']]], [[['']], [['']]], [[['a']], [['a']]]],
    generate: (r) => {
      const bases = Array.from({ length: 6 }, () => r.str(r.int(1, 6), LOWER));
      const many = Array.from({ length: 40 }, () => r.shuffle([...r.pick(bases)]).join(''));
      return [[['', '']], [['', 'b', '']], [['abc', 'bca', 'cab', 'xyz']], [many], [Array.from({ length: 30 }, () => r.str(r.int(0, 3), ['a', 'b']))]];
    },
  },
  {
    slug: 'top-k-frequent-elements',
    meta: fn('topKFrequent', [['nums', 'integer[]'], ['k', 'integer']], 'integer[]'),
    anyOrder: true,
    ref: function topKFrequent(nums, k) { const c = new Map(); for (const n of nums) c.set(n, (c.get(n) || 0) + 1); return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([n]) => n); },
    examples: [[[[1, 1, 1, 2, 2, 3], 2], [1, 2]], [[[1], 1], [1]]],
    generate: (r) => {
      // Every value gets a different count, so the answer is unique as the problem promises
      const make = (distinctValues, k) => {
        const values = r.distinct(distinctValues, -1000, 1000);
        const counts = r.distinct(distinctValues, 1, distinctValues + 10);
        return [r.shuffle(values.flatMap((v, i) => Array(counts[i]).fill(v))), k];
      };
      return [[[5, 5, 5, 4], 1], [[-1, -1], 1], [[1, 2], 2], make(5, 2), make(8, 8), make(12, 3), make(20, 1)];
    },
  },
  {
    slug: 'product-of-array-except-self',
    meta: fn('productExceptSelf', [['nums', 'integer[]']], 'integer[]'),
    ref: function productExceptSelf(nums) { const out = Array(nums.length).fill(1); let p = 1; for (let i = 0; i < nums.length; i++) { out[i] = p; p *= nums[i]; } p = 1; for (let i = nums.length - 1; i >= 0; i--) { out[i] *= p; p *= nums[i]; } return out.map((x) => (x === 0 ? 0 : x)); },
    examples: [[[[1, 2, 3, 4]], [24, 12, 8, 6]], [[[-1, 1, 0, -3, 3]], [0, 0, 9, 0, 0]]],
    generate: (r) => [
      [[2, 3]], [[0, 0]], [[0, 5, 2]], [[-1, -1, -1, -1]],
      [r.arr(10, -4, 4)], [r.arr(12, 1, 4)], [r.arr(10, -4, 4).map((x) => x || 1)],
    ],
  },
  {
    slug: 'valid-sudoku',
    meta: fn('isValidSudoku', [['board', 'character[][]']], 'boolean'),
    ref: function isValidSudoku(board) {
      const seen = new Set();
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        const v = board[r][c];
        if (v === '.') continue;
        const keys = [`r${r}${v}`, `c${c}${v}`, `b${Math.floor(r / 3)}${Math.floor(c / 3)}${v}`];
        if (keys.some((k) => seen.has(k))) return false;
        keys.forEach((k) => seen.add(k));
      }
      return true;
    },
    generate: (r) => {
      // From a solved grid with the digits relabelled: blanks keep it valid; one copied digit breaks it
      const solved = () => {
        const map = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        return Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, col) => String(map[(row * 3 + Math.floor(row / 3) + col) % 9])));
      };
      const blank = (b, p) => b.map((row) => row.map((v) => (r.next() < p ? '.' : v)));
      const breakAt = (b, kind) => {
        const g = b.map((row) => [...row]);
        const row = r.int(0, 8), col = r.int(0, 8);
        let src;
        if (kind === 'row') src = [row, (col + r.int(1, 8)) % 9];
        else if (kind === 'col') src = [(row + r.int(1, 8)) % 9, col];
        else { const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3; do { src = [br + r.int(0, 2), bc + r.int(0, 2)]; } while (src[0] === row && src[1] === col); }
        const full = solved();
        g[src[0]][src[1]] = full[0][0];
        g[row][col] = full[0][0];
        return g;
      };
      const empty = Array.from({ length: 9 }, () => Array(9).fill('.'));
      return [
        { args: [empty], expect: true },
        { args: [blank(solved(), 0.5)], expect: true },
        { args: [blank(solved(), 0.8)], expect: true },
        { args: [solved()], expect: true },
        { args: [breakAt(blank(solved(), 1), 'row')], expect: false },
        { args: [breakAt(blank(solved(), 1), 'col')], expect: false },
        { args: [breakAt(blank(solved(), 1), 'box')], expect: false },
      ];
    },
  },
  {
    slug: 'longest-consecutive-sequence',
    meta: fn('longestConsecutive', [['nums', 'integer[]']], 'integer'),
    ref: function longestConsecutive(nums) { const s = new Set(nums); let best = 0; for (const n of s) { if (s.has(n - 1)) continue; let len = 1; while (s.has(n + len)) len++; best = Math.max(best, len); } return best; },
    examples: [[[[100, 4, 200, 1, 3, 2]], 4], [[[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], 9], [[[1, 0, 1, 2]], 3]],
    generate: (r) => [
      [[]], [[5]], [[1, 1, 1]], [[-1, 0, 1]], [[10, 5, 12, 3, 55, 30, 4, 11, 2]],
      [r.arr(100, -50, 50)], [r.arr(200, -1e9, 1e9)], [r.shuffle(Array.from({ length: 300 }, (_, i) => i - 150))],
    ],
  },
  {
    slug: 'valid-palindrome',
    meta: fn('isPalindrome', [['s', 'string']], 'boolean'),
    ref: function isPalindrome(s) { const t = s.toLowerCase().replace(/[^a-z0-9]/g, ''); return t === [...t].reverse().join(''); },
    examples: [[['A man, a plan, a canal: Panama'], true], [['race a car'], false], [[' '], true]],
    generate: (r) => {
      const half = r.str(20, [...'abcAB019', ' ', ',', '.', ':', '!']);
      return [['a.'], ['0P'], ['ab_a'], ['.,'], ['No lemon, no melon'], [half + [...half].reverse().join('')], [half + 'x' + half]];
    },
  },
  {
    slug: 'two-sum-ii-input-array-is-sorted',
    meta: fn('twoSum', [['numbers', 'integer[]'], ['target', 'integer']], 'integer[]'),
    ref: function twoSum(numbers, target) { let i = 0, j = numbers.length - 1; while (i < j) { const s = numbers[i] + numbers[j]; if (s === target) return [i + 1, j + 1]; if (s < target) i++; else j--; } return []; },
    examples: [[[[2, 7, 11, 15], 9], [1, 2]], [[[2, 3, 4], 6], [1, 3]], [[[-1, 0], -1], [1, 2]]],
    generate: (r) => {
      const cases = [[[1, 2], 3], [[0, 0, 3, 4], 0], [[5, 25, 75], 100]];
      while (cases.length < 9) {
        const nums = r.arr(r.int(2, 100), -1000, 1000).sort((a, b) => a - b);
        const i = r.int(0, nums.length - 2), j = r.int(i + 1, nums.length - 1);
        const target = nums[i] + nums[j];
        if (pairCount(nums, target) === 1) cases.push([nums, target]);
      }
      return cases;
    },
  },
  {
    slug: '3sum',
    meta: fn('threeSum', [['nums', 'integer[]']], 'list<list<integer>>'),
    anyOrder: true,
    ref: function threeSum(nums) {
      const a = [...nums].sort((x, y) => x - y), out = [];
      for (let i = 0; i < a.length - 2; i++) {
        if (i > 0 && a[i] === a[i - 1]) continue;
        let l = i + 1, h = a.length - 1;
        while (l < h) {
          const s = a[i] + a[l] + a[h];
          if (s === 0) { out.push([a[i], a[l], a[h]]); while (l < h && a[l] === a[l + 1]) l++; while (l < h && a[h] === a[h - 1]) h--; l++; h--; } else if (s < 0) l++; else h--;
        }
      }
      return out;
    },
    examples: [[[[-1, 0, 1, 2, -1, -4]], [[-1, -1, 2], [-1, 0, 1]]], [[[0, 1, 1]], []], [[[0, 0, 0]], [[0, 0, 0]]]],
    generate: (r) => [[[0, 0, 0, 0]], [[1, 2, -2, -1]], [[-2, 0, 1, 1, 2]], [r.arr(30, -10, 10)], [r.arr(60, -20, 20)], [r.arr(100, -1e5, 1e5)]],
  },
  {
    slug: 'container-with-most-water',
    meta: fn('maxArea', [['height', 'integer[]']], 'integer'),
    ref: function maxArea(height) { let i = 0, j = height.length - 1, best = 0; while (i < j) { best = Math.max(best, Math.min(height[i], height[j]) * (j - i)); if (height[i] < height[j]) i++; else j--; } return best; },
    examples: [[[[1, 8, 6, 2, 5, 4, 8, 3, 7]], 49], [[[1, 1]], 1]],
    generate: (r) => [[[0, 0]], [[4, 3, 2, 1, 4]], [[1, 2, 1]], [r.arr(50, 0, 100)], [r.arr(300, 0, 10000)], [Array.from({ length: 100 }, (_, i) => i)]],
  },
  {
    slug: 'trapping-rain-water',
    meta: fn('trap', [['height', 'integer[]']], 'integer'),
    ref: function trap(height) { let l = 0, r = height.length - 1, lm = 0, rm = 0, w = 0; while (l < r) { if (height[l] < height[r]) { lm = Math.max(lm, height[l]); w += lm - height[l]; l++; } else { rm = Math.max(rm, height[r]); w += rm - height[r]; r--; } } return w; },
    examples: [[[[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], 6], [[[4, 2, 0, 3, 2, 5]], 9]],
    generate: (r) => [[[1]], [[3, 0, 3]], [[5, 4, 3, 2, 1]], [[1, 2, 3, 4, 5]], [r.arr(40, 0, 10)], [r.arr(300, 0, 1000)]],
  },
  {
    slug: 'best-time-to-buy-and-sell-stock',
    meta: fn('maxProfit', [['prices', 'integer[]']], 'integer'),
    ref: function maxProfit(prices) { let lo = Infinity, best = 0; for (const p of prices) { lo = Math.min(lo, p); best = Math.max(best, p - lo); } return best; },
    examples: [[[[7, 1, 5, 3, 6, 4]], 5], [[[7, 6, 4, 3, 1]], 0]],
    generate: (r) => [[[1]], [[2, 4, 1]], [[3, 3, 3]], [[1, 2]], [r.arr(50, 0, 100)], [r.arr(500, 0, 10000)]],
  },
  {
    slug: 'longest-substring-without-repeating-characters',
    meta: fn('lengthOfLongestSubstring', [['s', 'string']], 'integer'),
    ref: function lengthOfLongestSubstring(s) { const last = new Map(); let start = 0, best = 0; for (let i = 0; i < s.length; i++) { if (last.has(s[i]) && last.get(s[i]) >= start) start = last.get(s[i]) + 1; last.set(s[i], i); best = Math.max(best, i - start + 1); } return best; },
    examples: [[['abcabcbb'], 3], [['bbbbb'], 1], [['pwwkew'], 3]],
    generate: (r) => [[''], [' '], ['au'], ['dvdf'], ['abba'], [r.str(60, [...'abcdef'])], [r.str(200, [...'abcdefghijklmnopqrstuvwxyz0123456789 '])]],
  },
  {
    slug: 'longest-repeating-character-replacement',
    meta: fn('characterReplacement', [['s', 'string'], ['k', 'integer']], 'integer'),
    ref: function characterReplacement(s, k) { const c = {}; let l = 0, most = 0, best = 0; for (let r = 0; r < s.length; r++) { c[s[r]] = (c[s[r]] || 0) + 1; most = Math.max(most, c[s[r]]); while (r - l + 1 - most > k) { c[s[l]]--; l++; } best = Math.max(best, r - l + 1); } return best; },
    examples: [[['ABAB', 2], 4], [['AABABBA', 1], 4]],
    generate: (r) => [['A', 0], ['AB', 0], ['ABCDE', 1], ['AAAA', 2], [r.str(50, ['A', 'B']), 3], [r.str(100, ['A', 'B', 'C']), 0], [r.str(200, [...'ABCDE']), 10]],
  },
  {
    slug: 'permutation-in-string',
    meta: fn('checkInclusion', [['s1', 'string'], ['s2', 'string']], 'boolean'),
    ref: function checkInclusion(s1, s2) { const key = (s) => [...s].sort().join(''); const k = key(s1); for (let i = 0; i + s1.length <= s2.length; i++) if (key(s2.slice(i, i + s1.length)) === k) return true; return false; },
    examples: [[['ab', 'eidbaooo'], true], [['ab', 'eidboaoo'], false]],
    generate: (r) => {
      const s1 = r.str(5, LOWER.slice(0, 6));
      return [['a', 'a'], ['abc', 'ab'], ['adc', 'dcda'], ['hello', 'ooolleoooleh'],
        [s1, r.str(20, LOWER) + r.shuffle([...s1]).join('') + r.str(20, LOWER)], [s1, r.str(80, LOWER.slice(0, 3))], [r.str(3, ['a', 'b']), r.str(60, ['a', 'b'])]];
    },
  },
  {
    slug: 'minimum-window-substring',
    meta: fn('minWindow', [['s', 'string'], ['t', 'string']], 'string'),
    ref: function minWindow(s, t) {
      const need = {}; for (const c of t) need[c] = (need[c] || 0) + 1;
      let missing = t.length, l = 0, best = [0, Infinity];
      for (let r = 0; r < s.length; r++) {
        if (need[s[r]] > 0) missing--;
        need[s[r]] = (need[s[r]] || 0) - 1;
        while (missing === 0) {
          if (r - l < best[1] - best[0]) best = [l, r];
          need[s[l]]++; if (need[s[l]] > 0) missing++; l++;
        }
      }
      return best[1] === Infinity ? '' : s.slice(best[0], best[1] + 1);
    },
    examples: [[['ADOBECODEBANC', 'ABC'], 'BANC'], [['a', 'a'], 'a'], [['a', 'aa'], '']],
    generate: (r) => {
      // Keep only cases with a single shortest window, since the problem promises a unique answer
      const covers = (w, t) => { const c = {}; for (const x of w) c[x] = (c[x] || 0) + 1; return [...t].every((x) => (c[x] = (c[x] || 0) - 1) >= 0); };
      const unique = (s, t) => {
        for (let len = t.length; len <= s.length; len++) {
          const hits = new Set();
          for (let i = 0; i + len <= s.length; i++) if (covers(s.slice(i, i + len), t)) hits.add(i);
          if (hits.size) return hits.size === 1;
        }
        return true; // no window: the answer is ""
      };
      const cases = [['ab', 'b'], ['bba', 'ab'], ['abc', 'cba'], ['aa', 'aa'], ['xyz', 'q']];
      while (cases.length < 10) {
        const s = r.str(r.int(5, 40), [...'ABCDEFabc']);
        const t = r.str(r.int(1, 4), [...'ABCabc']);
        if (unique(s, t)) cases.push([s, t]);
      }
      return cases;
    },
  },
  {
    slug: 'sliding-window-maximum',
    meta: fn('maxSlidingWindow', [['nums', 'integer[]'], ['k', 'integer']], 'integer[]'),
    ref: function maxSlidingWindow(nums, k) { const out = [], dq = []; for (let i = 0; i < nums.length; i++) { while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop(); dq.push(i); if (dq[0] <= i - k) dq.shift(); if (i >= k - 1) out.push(nums[dq[0]]); } return out; },
    examples: [[[[1, 3, -1, -3, 5, 3, 6, 7], 3], [3, 3, 5, 5, 6, 7]], [[[1], 1], [1]]],
    generate: (r) => [[[1, -1], 1], [[9, 11], 2], [[4, -2], 2], [[7, 2, 4], 2], [r.arr(30, -10, 10), 4], [r.arr(300, -1e4, 1e4), 25], [r.arr(50, -5, 5), 50]],
  },
  {
    slug: 'valid-parentheses',
    meta: fn('isValid', [['s', 'string']], 'boolean'),
    ref: function isValid(s) { const st = [], pair = { ')': '(', ']': '[', '}': '{' }; for (const c of s) { if (pair[c]) { if (st.pop() !== pair[c]) return false; } else st.push(c); } return st.length === 0; },
    examples: [[['()'], true], [['()[]{}'], true], [['(]'], false], [['([])'], true]],
    generate: (r) => {
      const valid = (depth) => (depth > 3 || r.next() < 0.3 ? '' : r.pick(['()', '[]', '{}']).split('').join(valid(depth + 1)) + valid(depth + 1));
      return [['('], [']'], ['(('], ['([)]'], ['{[]}'], [valid(0) + valid(0) + '()'], [r.str(30, [...'()[]{}'])], ['('.repeat(50) + ')'.repeat(50)]];
    },
  },
  {
    slug: 'min-stack',
    meta: cls('MinStack', [], [['push', [['val', 'integer']], 'void'], ['pop', [], 'void'], ['top', [], 'integer'], ['getMin', [], 'integer']]),
    ref: class MinStack {
      constructor() { this.s = []; }
      push(val) { this.s.push([val, this.s.length ? Math.min(val, this.s[this.s.length - 1][1]) : val]); }
      pop() { this.s.pop(); }
      top() { return this.s[this.s.length - 1][0]; }
      getMin() { return this.s[this.s.length - 1][1]; }
    },
    examples: [[[['MinStack', 'push', 'push', 'push', 'getMin', 'pop', 'top', 'getMin'], [[], [-2], [0], [-3], [], [], [], []]], [null, null, null, null, -3, null, 0, -2]]],
    generate: (r) => Array.from({ length: 6 }, (_, n) => {
      const ops = ['MinStack'], args = [[]];
      let size = 0;
      for (let i = 0; i < 10 + n * 15; i++) {
        const op = size === 0 ? 'push' : r.pick(['push', 'push', 'pop', 'top', 'getMin']);
        ops.push(op);
        args.push(op === 'push' ? [(n < 3 ? r.int(-9, 9) : r.int(-(2 ** 31), 2 ** 31 - 1))] : []);
        size += op === 'push' ? 1 : op === 'pop' ? -1 : 0;
      }
      return [ops, args];
    }),
  },
  {
    slug: 'evaluate-reverse-polish-notation',
    meta: fn('evalRPN', [['tokens', 'string[]']], 'integer'),
    ref: function evalRPN(tokens) { const st = []; for (const t of tokens) { if ('+-*/'.includes(t) && t.length === 1) { const b = st.pop(), a = st.pop(); st.push(t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : Math.trunc(a / b)); } else st.push(Number(t)); } return st[0]; },
    examples: [[[['2', '1', '+', '3', '*']], 9], [[['4', '13', '5', '/', '+']], 6], [[['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+']], 22]],
    generate: (r) => {
      // Random expression trees; any with a division by zero are thrown away
      const build = (depth) => {
        if (depth > 3 || r.next() < 0.3) { const v = r.int(-20, 20); return { tokens: [String(v)], value: v }; }
        const a = build(depth + 1), b = build(depth + 1), op = r.pick(['+', '-', '*', '/']);
        if (op === '/' && b.value === 0) return a;
        const value = op === '+' ? a.value + b.value : op === '-' ? a.value - b.value : op === '*' ? a.value * b.value : Math.trunc(a.value / b.value);
        if (Math.abs(value) > 2 ** 31 - 1) return a; // LeetCode keeps every step within 32 bits
        return { tokens: [...a.tokens, ...b.tokens, op], value };
      };
      return [[['18']], [['-7']], [['3', '-4', '/']], [['-3', '4', '/']], ...Array.from({ length: 5 }, () => [build(0).tokens])];
    },
  },
  {
    slug: 'generate-parentheses',
    meta: fn('generateParenthesis', [['n', 'integer']], 'list<string>'),
    anyOrder: true, // LeetCode accepts the combinations in any order
    ref: function generateParenthesis(n) { const out = []; const go = (s, open, close) => { if (s.length === 2 * n) { out.push(s); return; } if (open < n) go(s + '(', open + 1, close); if (close < open) go(s + ')', open, close + 1); }; go('', 0, 0); return out; },
    examples: [[[3], ['((()))', '(()())', '(())()', '()(())', '()()()']], [[1], ['()']]],
    generate: () => [[2], [4], [5], [6], [7], [8]],
  },
  {
    slug: 'daily-temperatures',
    meta: fn('dailyTemperatures', [['temperatures', 'integer[]']], 'integer[]'),
    ref: function dailyTemperatures(temperatures) { const t = temperatures; const out = Array(t.length).fill(0), st = []; for (let i = 0; i < t.length; i++) { while (st.length && t[st[st.length - 1]] < t[i]) { const j = st.pop(); out[j] = i - j; } st.push(i); } return out; },
    examples: [[[[73, 74, 75, 71, 69, 72, 76, 73]], [1, 1, 4, 2, 1, 1, 0, 0]], [[[30, 40, 50, 60]], [1, 1, 1, 0]], [[[30, 60, 90]], [1, 1, 0]]],
    generate: (r) => [[[50]], [[90, 80, 70]], [[70, 70, 70, 71]], [r.arr(40, 30, 100)], [r.arr(500, 30, 100)]],
  },
  {
    slug: 'car-fleet',
    meta: fn('carFleet', [['target', 'integer'], ['position', 'integer[]'], ['speed', 'integer[]']], 'integer'),
    ref: function carFleet(target, position, speed) { const cars = position.map((p, i) => [p, (target - p) / speed[i]]).sort((a, b) => b[0] - a[0]); let fleets = 0, slowest = 0; for (const [, t] of cars) if (t > slowest) { fleets++; slowest = t; } return fleets; },
    examples: [[[12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3]], 3], [[10, [3], [3]], 1], [[100, [0, 2, 4], [4, 2, 1]], 1]],
    generate: (r) => {
      const make = (n, target) => [target, r.distinct(n, 0, target - 1), r.arr(n, 1, 10)];
      return [[10, [0, 4, 2], [2, 1, 3]], [10, [6, 8], [3, 2]], make(5, 20), make(20, 100), make(60, 1000), make(100, 1e6)];
    },
  },
  {
    slug: 'largest-rectangle-in-histogram',
    meta: fn('largestRectangleArea', [['heights', 'integer[]']], 'integer'),
    ref: function largestRectangleArea(heights) { const h = heights; const st = []; let best = 0; for (let i = 0; i <= h.length; i++) { const cur = i === h.length ? 0 : h[i]; while (st.length && h[st[st.length - 1]] >= cur) { const height = h[st.pop()]; const left = st.length ? st[st.length - 1] + 1 : 0; best = Math.max(best, height * (i - left)); } st.push(i); } return best; },
    examples: [[[[2, 1, 5, 6, 2, 3]], 10], [[[2, 4]], 4]],
    generate: (r) => [[[0]], [[1]], [[2, 2, 2]], [[1, 2, 3, 4, 5]], [[5, 4, 3, 2, 1]], [r.arr(40, 0, 20)], [r.arr(500, 0, 10000)]],
  },
  {
    slug: 'binary-search',
    meta: fn('search', [['nums', 'integer[]'], ['target', 'integer']], 'integer'),
    ref: function search(nums, target) { let lo = 0, hi = nums.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (nums[m] === target) return m; if (nums[m] < target) lo = m + 1; else hi = m - 1; } return -1; },
    examples: [[[[-1, 0, 3, 5, 9, 12], 9], 4], [[[-1, 0, 3, 5, 9, 12], 2], -1]],
    generate: (r) => {
      const a = r.sortedDistinct(200, -1e4, 1e4);
      return [[[5], 5], [[5], -5], [[1, 2], 2], [[1, 2], 0], [[1, 2], 3], [a, a[0]], [a, a[199]], [a, a[r.int(0, 199)]], [a, 10001]];
    },
  },
  {
    slug: 'search-a-2d-matrix',
    meta: fn('searchMatrix', [['matrix', 'integer[][]'], ['target', 'integer']], 'boolean'),
    ref: function searchMatrix(matrix, target) { return matrix.some((row) => row.includes(target)); },
    examples: [[[[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], true], [[[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], false]],
    generate: (r) => {
      const grid = (m, n) => { const vals = r.sortedDistinct(m * n, -1e4, 1e4); return Array.from({ length: m }, (_, i) => vals.slice(i * n, i * n + n)); };
      const g = grid(8, 12);
      return [[[[1]], 1], [[[1]], 2], [[[1], [3]], 3], [[[1, 3]], 2], [g, g[7][11]], [g, g[0][0]], [g, g[3][5]], [g, 10001]];
    },
  },
  {
    slug: 'koko-eating-bananas',
    meta: fn('minEatingSpeed', [['piles', 'integer[]'], ['h', 'integer']], 'integer'),
    ref: function minEatingSpeed(piles, h) { let lo = 1, hi = Math.max(...piles); while (lo < hi) { const k = Math.floor((lo + hi) / 2); const hours = piles.reduce((s, p) => s + Math.ceil(p / k), 0); if (hours <= h) hi = k; else lo = k + 1; } return lo; },
    examples: [[[[3, 6, 7, 11], 8], 4], [[[30, 11, 23, 4, 20], 5], 30], [[[30, 11, 23, 4, 20], 6], 23]],
    generate: (r) => {
      const p = r.arr(30, 1, 1e9);
      return [[[1], 1], [[1000000000], 2], [[312884470], 968709470], [[5, 5, 5], 3], [p, 30], [p, 1e9], [r.arr(100, 1, 1000), 150]];
    },
  },
  {
    slug: 'find-minimum-in-rotated-sorted-array',
    meta: fn('findMin', [['nums', 'integer[]']], 'integer'),
    ref: function findMin(nums) { return Math.min(...nums); },
    examples: [[[[3, 4, 5, 1, 2]], 1], [[[4, 5, 6, 7, 0, 1, 2]], 0], [[[11, 13, 15, 17]], 11]],
    generate: (r) => {
      const rot = (n) => { const a = r.sortedDistinct(n, -5000, 5000); const k = r.int(0, n - 1); return [...a.slice(k), ...a.slice(0, k)]; };
      return [[[1]], [[2, 1]], [[1, 2]], [rot(10)], [rot(100)], [rot(1000)]];
    },
  },
  {
    slug: 'search-in-rotated-sorted-array',
    meta: fn('search', [['nums', 'integer[]'], ['target', 'integer']], 'integer'),
    ref: function search(nums, target) { return nums.indexOf(target); },
    examples: [[[[4, 5, 6, 7, 0, 1, 2], 0], 4], [[[4, 5, 6, 7, 0, 1, 2], 3], -1], [[[1], 0], -1]],
    generate: (r) => {
      const a = r.sortedDistinct(300, -1e4, 1e4); const k = r.int(1, 299); const rot = [...a.slice(k), ...a.slice(0, k)];
      return [[[1], 1], [[1, 3], 3], [[3, 1], 1], [[5, 1, 3], 5], [[5, 1, 3], 4], [rot, rot[0]], [rot, rot[299]], [rot, a[0]], [rot, 20000]];
    },
  },
  {
    slug: 'time-based-key-value-store',
    meta: cls('TimeMap', [], [['set', [['key', 'string'], ['value', 'string'], ['timestamp', 'integer']], 'void'], ['get', [['key', 'string'], ['timestamp', 'integer']], 'string']]),
    ref: class TimeMap {
      constructor() { this.m = new Map(); }
      set(key, value, timestamp) { if (!this.m.has(key)) this.m.set(key, []); this.m.get(key).push([timestamp, value]); }
      get(key, timestamp) { const a = this.m.get(key) || []; let lo = 0, hi = a.length - 1, ans = ''; while (lo <= hi) { const mid = (lo + hi) >> 1; if (a[mid][0] <= timestamp) { ans = a[mid][1]; lo = mid + 1; } else hi = mid - 1; } return ans; }
    },
    examples: [[[['TimeMap', 'set', 'get', 'get', 'set', 'get', 'get'], [[], ['foo', 'bar', 1], ['foo', 1], ['foo', 3], ['foo', 'bar2', 4], ['foo', 4], ['foo', 5]]], [null, null, 'bar', 'bar', null, 'bar2', 'bar2']]],
    generate: (r) => Array.from({ length: 5 }, (_, n) => {
      // Timestamps of set strictly increase, as the problem promises
      const ops = ['TimeMap'], args = [[]];
      let ts = 0;
      const keys = ['love', 'foo', 'k'].slice(0, 1 + (n % 3));
      for (let i = 0; i < 8 + n * 10; i++) {
        if (r.next() < 0.45) { ts += r.int(1, 5); ops.push('set'); args.push([r.pick(keys), r.str(r.int(1, 5), LOWER), ts]); } else { ops.push('get'); args.push([r.pick([...keys, 'none']), r.int(0, ts + 3)]); }
      }
      return [ops, args];
    }),
  },
  {
    slug: 'median-of-two-sorted-arrays',
    meta: fn('findMedianSortedArrays', [['nums1', 'integer[]'], ['nums2', 'integer[]']], 'double'),
    ref: function findMedianSortedArrays(nums1, nums2) { const m = [...nums1, ...nums2].sort((x, y) => x - y); const n = m.length; return n % 2 ? m[(n - 1) / 2] : (m[n / 2 - 1] + m[n / 2]) / 2; },
    examples: [[[[1, 3], [2]], 2], [[[1, 2], [3, 4]], 2.5]],
    generate: (r) => {
      const s = (n) => r.arr(n, -1e6, 1e6).sort((x, y) => x - y);
      return [[[], [1]], [[2], []], [[0, 0], [0, 0]], [[1, 2], [-1, 3]], [s(7), s(8)], [s(100), s(3)], [s(0), s(50)], [s(250), s(251)]];
    },
  },
  {
    slug: 'insert-interval',
    meta: fn('insert', [['intervals', 'integer[][]'], ['newInterval', 'integer[]']], 'integer[][]'),
    ref: function insert(intervals, newInterval) { const out = []; let [s, e] = newInterval, placed = false; for (const [a, b] of intervals) { if (b < s) out.push([a, b]); else if (a > e) { if (!placed) { out.push([s, e]); placed = true; } out.push([a, b]); } else { s = Math.min(s, a); e = Math.max(e, b); } } if (!placed) out.push([s, e]); return out; },
    examples: [[[[[1, 3], [6, 9]], [2, 5]], [[1, 5], [6, 9]]], [[[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], [[1, 2], [3, 10], [12, 16]]]],
    generate: (r) => {
      const sorted = (n) => { const pts = r.sortedDistinct(2 * n, 0, 1000); return Array.from({ length: n }, (_, i) => [pts[2 * i], pts[2 * i + 1]]); };
      const iv = () => { const a = r.int(0, 1000); return [a, a + r.int(0, 200)]; };
      return [[[], [5, 7]], [[[1, 5]], [2, 3]], [[[1, 5]], [6, 8]], [[[3, 5]], [0, 1]], [[[1, 5]], [0, 0]], [sorted(10), iv()], [sorted(30), iv()], [sorted(30), [0, 1000]]];
    },
  },
  {
    slug: 'merge-intervals',
    meta: fn('merge', [['intervals', 'integer[][]']], 'integer[][]'),
    ref: function merge(intervals) { const a = [...intervals].sort((x, y) => x[0] - y[0]), out = []; for (const [s, e] of a) { if (out.length && s <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], e); else out.push([s, e]); } return out; },
    examples: [[[[[1, 3], [2, 6], [8, 10], [15, 18]]], [[1, 6], [8, 10], [15, 18]]], [[[[1, 4], [4, 5]]], [[1, 5]]], [[[[4, 7], [1, 4]]], [[1, 7]]]],
    generate: (r) => {
      const ivs = (n, span) => Array.from({ length: n }, () => { const a = r.int(0, 1000); return [a, a + r.int(0, span)]; });
      return [[[[1, 4]]], [[[1, 4], [0, 4]]], [[[1, 4], [2, 3]]], [[[1, 4], [0, 0]]], [ivs(10, 50)], [ivs(50, 10)], [ivs(100, 300)]];
    },
  },
  {
    slug: 'non-overlapping-intervals',
    meta: fn('eraseOverlapIntervals', [['intervals', 'integer[][]']], 'integer'),
    ref: function eraseOverlapIntervals(intervals) { const a = [...intervals].sort((x, y) => x[1] - y[1]); let end = -Infinity, removed = 0; for (const [s, e] of a) { if (s >= end) end = e; else removed++; } return removed; },
    examples: [[[[[1, 2], [2, 3], [3, 4], [1, 3]]], 1], [[[[1, 2], [1, 2], [1, 2]]], 2], [[[[1, 2], [2, 3]]], 0]],
    generate: (r) => {
      const ivs = (n, span) => Array.from({ length: n }, () => { const a = r.int(-500, 500); return [a, a + r.int(1, span)]; });
      return [[[[0, 1]]], [[[1, 100], [11, 22], [1, 11], [2, 12]]], [[[-52, 31], [-73, -26], [82, 97], [-65, -11], [-62, -49], [95, 99], [58, 95], [-31, 49], [66, 98], [-63, 2], [30, 47], [-40, -26]]], [ivs(20, 30)], [ivs(100, 100)]];
    },
  },
  {
    slug: 'minimum-interval-to-include-each-query',
    meta: fn('minInterval', [['intervals', 'integer[][]'], ['queries', 'integer[]']], 'integer[]'),
    ref: function minInterval(intervals, queries) { return queries.map((q) => { let best = -1; for (const [l, r] of intervals) if (l <= q && q <= r) { const size = r - l + 1; if (best === -1 || size < best) best = size; } return best; }); },
    examples: [[[[[1, 4], [2, 4], [3, 6], [4, 4]], [2, 3, 4, 5]], [3, 3, 1, 4]], [[[[2, 3], [2, 5], [1, 8], [20, 25]], [2, 19, 5, 22]], [2, -1, 4, 6]]],
    generate: (r) => {
      const ivs = (n, span) => Array.from({ length: n }, () => { const a = r.int(1, 1000); return [a, a + r.int(0, span)]; });
      return [[[[1, 1]], [1, 2]], [[[5, 10]], [4, 5, 10, 11]], [ivs(10, 100), r.arr(10, 1, 1100)], [ivs(100, 50), r.arr(100, 1, 1100)], [ivs(50, 500), r.arr(30, 1, 1500)]];
    },
  },
  {
    slug: 'reverse-linked-list',
    meta: fn('reverseList', [['head', 'ListNode']], 'ListNode'),
    ref: function reverseList(head) { let prev = null; while (head) { const next = head.next; head.next = prev; prev = head; head = next; } return prev; },
    examples: [[[[1, 2, 3, 4, 5]], [5, 4, 3, 2, 1]], [[[1, 2]], [2, 1]], [[[]], []]],
    generate: (r) => [[[]], [[7]], [[1, 1, 2]], [[-1, 0, 1]], [r.arr(30, -5000, 5000)], [r.arr(500, -5000, 5000)]],
  },
  {
    slug: 'merge-two-sorted-lists',
    meta: fn('mergeTwoLists', [['list1', 'ListNode'], ['list2', 'ListNode']], 'ListNode'),
    ref: function mergeTwoLists(list1, list2) { let a = list1, b = list2; const d = new ListNode(0); let t = d; while (a && b) { if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; } t = t.next; } t.next = a || b; return d.next; },
    examples: [[[[1, 2, 4], [1, 3, 4]], [1, 1, 2, 3, 4, 4]], [[[], []], []], [[[], [0]], [0]]],
    generate: (r) => {
      const s = (n) => r.arr(n, -100, 100).sort((x, y) => x - y);
      return [[[5], []], [[1, 1], [1]], [[-3, 2], [-4, 3]], [s(10), s(15)], [s(50), s(1)], [s(50), s(50)]];
    },
  },
  {
    slug: 'linked-list-cycle',
    meta: fn('hasCycle', [['head', 'ListNode']], 'boolean'),
    named: ['head', 'pos'], // pos isn't a parameter: it places the cycle, so cases use the named form
    ref: function hasCycle(head) { let slow = head, fast = head; while (fast && fast.next) { slow = slow.next; fast = fast.next.next; if (slow === fast) return true; } return false; },
    examples: [[[[3, 2, 0, -4], 1], true], [[[1, 2], 0], true], [[[1], -1], false]],
    generate: (r) => {
      const n = 200, vals = r.arr(n, -1e5, 1e5);
      return [[[], -1], [[1], 0], [[1, 2], 1], [[1, 2], -1], [vals, -1], [vals, 0], [vals, n - 1], [vals, r.int(1, n - 2)]];
    },
  },
  {
    slug: 'reorder-list',
    meta: fn('reorderList', [['head', 'ListNode']], 'void', { output: { paramindex: 0 } }),
    ref: function reorderList(head) { const nodes = []; for (let n = head; n; n = n.next) nodes.push(n); let i = 0, j = nodes.length - 1; while (i < j) { nodes[i].next = nodes[j]; i++; if (i === j) break; nodes[j].next = nodes[i]; j--; } if (nodes.length) nodes[i].next = null; },
    examples: [[[[1, 2, 3, 4]], [1, 4, 2, 3]], [[[1, 2, 3, 4, 5]], [1, 5, 2, 4, 3]]],
    generate: (r) => [[[1]], [[1, 2]], [[1, 2, 3]], [r.arr(10, 1, 1000)], [r.arr(51, 1, 1000)], [r.arr(400, 1, 1000)]],
  },
  {
    slug: 'remove-nth-node-from-end-of-list',
    meta: fn('removeNthFromEnd', [['head', 'ListNode'], ['n', 'integer']], 'ListNode'),
    ref: function removeNthFromEnd(head, n) { const d = new ListNode(0, head); let fast = d, slow = d; for (let i = 0; i <= n; i++) fast = fast.next; while (fast) { fast = fast.next; slow = slow.next; } slow.next = slow.next.next; return d.next; },
    examples: [[[[1, 2, 3, 4, 5], 2], [1, 2, 3, 5]], [[[1], 1], []], [[[1, 2], 1], [1]]],
    generate: (r) => { const a = r.arr(30, 0, 100); return [[[1, 2], 2], [[1, 2, 3], 3], [[1, 2, 3], 1], [a, 1], [a, 30], [a, 15]]; },
  },
  {
    slug: 'add-two-numbers',
    meta: fn('addTwoNumbers', [['l1', 'ListNode'], ['l2', 'ListNode']], 'ListNode'),
    ref: function addTwoNumbers(l1, l2) { const d = new ListNode(0); let t = d, carry = 0; while (l1 || l2 || carry) { const s = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry; carry = Math.floor(s / 10); t.next = new ListNode(s % 10); t = t.next; l1 = l1 && l1.next; l2 = l2 && l2.next; } return d.next; },
    examples: [[[[2, 4, 3], [5, 6, 4]], [7, 0, 8]], [[[0], [0]], [0]], [[[9, 9, 9, 9, 9, 9, 9], [9, 9, 9, 9]], [8, 9, 9, 9, 0, 0, 0, 1]]],
    generate: (r) => {
      // Digits in reverse order, with no leading zero on the number
      const num = (n) => [...r.arr(n - 1, 0, 9), r.int(1, 9)];
      return [[[5], [5]], [[1, 8], [0]], [[9], [1, 9, 9]], [num(10), num(3)], [num(40), num(40)], [Array(60).fill(9), [1]]];
    },
  },
  {
    slug: 'find-the-duplicate-number',
    meta: fn('findDuplicate', [['nums', 'integer[]']], 'integer'),
    ref: function findDuplicate(nums) { const s = new Set(); for (const n of nums) { if (s.has(n)) return n; s.add(n); } return -1; },
    examples: [[[[1, 3, 4, 2, 2]], 2], [[[3, 1, 3, 4, 2]], 3], [[[3, 3, 3, 3, 3]], 3]],
    generate: (r) => {
      // n + 1 numbers in [1, n]; only one value repeats, possibly several times
      const make = (n, extra) => { const dup = r.int(1, n); const a = Array.from({ length: n }, (_, i) => i + 1); a.push(dup); for (let i = 0; i < extra; i++) { const j = r.int(0, n); if (a[j] !== dup) a[j] = dup; } return r.shuffle(a); };
      return [[[1, 1]], [[1, 1, 2]], [[2, 2, 2]], [make(10, 0)], [make(50, 5)], [make(500, 0)], [make(300, 100)]];
    },
  },
  {
    slug: 'lru-cache',
    meta: cls('LRUCache', [['capacity', 'integer']], [['get', [['key', 'integer']], 'integer'], ['put', [['key', 'integer'], ['value', 'integer']], 'void']]),
    ref: class LRUCache {
      constructor(capacity) { this.c = capacity; this.m = new Map(); }
      get(key) { if (!this.m.has(key)) return -1; const v = this.m.get(key); this.m.delete(key); this.m.set(key, v); return v; }
      put(key, value) { this.m.delete(key); this.m.set(key, value); if (this.m.size > this.c) this.m.delete(this.m.keys().next().value); }
    },
    examples: [[[['LRUCache', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get'], [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]], [null, null, null, 1, null, -1, null, -1, 3, 4]]],
    generate: (r) => Array.from({ length: 6 }, (_, n) => {
      const capacity = [1, 1, 2, 3, 4, 10][n];
      const ops = ['LRUCache'], args = [[capacity]];
      for (let i = 0; i < 10 + n * 12; i++) {
        const key = r.int(0, capacity + 3);
        if (r.next() < 0.5) { ops.push('put'); args.push([key, r.int(0, 1e5)]); } else { ops.push('get'); args.push([key]); }
      }
      return [ops, args];
    }),
  },
  {
    slug: 'merge-k-sorted-lists',
    meta: fn('mergeKLists', [['lists', 'ListNode[]']], 'ListNode'),
    ref: function mergeKLists(lists) { const vals = []; for (let l of lists) for (; l; l = l.next) vals.push(l.val); vals.sort((a, b) => a - b); let head = null; for (let i = vals.length - 1; i >= 0; i--) head = new ListNode(vals[i], head); return head; },
    examples: [[[[[1, 4, 5], [1, 3, 4], [2, 6]]], [1, 1, 2, 3, 4, 4, 5, 6]], [[[]], []], [[[[]]], []]],
    generate: (r) => {
      const s = (n) => r.arr(n, -1e4, 1e4).sort((x, y) => x - y);
      return [[[[], [1]]], [[[2], [], [-1]]], [[[1, 1], [1, 1]]], [Array.from({ length: 5 }, () => s(r.int(0, 10)))], [Array.from({ length: 30 }, () => s(r.int(0, 20)))]];
    },
  },
];

/** The reference as source code the JavaScript runner can load */
export const referenceSource = (p) => p.ref.toString();
