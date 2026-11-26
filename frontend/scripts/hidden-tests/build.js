// Builds the hidden Submit tests from scripts/hidden-tests/problems.js.
// For each problem: the reference must answer every statement example correctly, then it runs the
// generated inputs through the real harness and JavaScript runner, and its answers become the
// expected values. Used by `npm run hidden-tests` (writes the file) and by a test (checks it's current).

import { PROBLEMS, makeRandom, referenceSource } from './problems.js';
import { runLocally } from '../../src/services/execution/__tests__/localRunners.js';
import { answersMatch } from '../../src/services/execution/testCases.js';

const raw = (v) => JSON.stringify(v);
const seedOf = (slug) => [...slug].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

/** A test case in the shape the editor uses: `args` holds one raw value per parameter */
export function toCase(p, args) {
  if (p.named) {
    // Values that aren't parameters (pos in Linked List Cycle) only work in the named form
    return { input: p.named.map((n, i) => `${n} = ${raw(args[i])}`).join(', ') };
  }
  const names = p.meta.classname ? ['operations', 'arguments'] : p.meta.params.map((x) => x.name);
  return { input: args.map((a, i) => `${names[i]} = ${raw(a)}`).join('\n'), args: args.map(raw) };
}

export const problemObject = (p) => ({ title: p.slug, meta: p.meta, starterTemplates: {}, contentHtml: '' });

function runReference(p, testCases) {
  return runLocally({ problem: problemObject(p), language: 'javascript', code: referenceSource(p), testCases });
}

/** { slug: [{ input, args?, expected, anyOrder? }] } */
export function buildHiddenTests() {
  const out = {};
  for (const p of PROBLEMS) {
    const extra = p.anyOrder ? { anyOrder: true } : {};

    // 1. The reference has to get the statement's own examples right
    if (p.examples?.length) {
      const cases = p.examples.map(([args, expected]) => ({ ...toCase(p, args), expected: raw(expected), ...extra }));
      const res = runReference(p, cases);
      const wrong = res.results.filter((r) => !r.passed);
      if (wrong.length) {
        throw new Error(`${p.slug}: the reference fails its examples: ${wrong.map((r) => `case ${r.testCaseIndex} got ${r.actual}${r.error ? ` (${r.error})` : ''}, expected ${r.expected}`).join('; ')}`);
      }
    }

    // 2. Generated inputs; the reference's answers become the expected values
    const generated = p.generate(makeRandom(seedOf(p.slug))).map((g) => (Array.isArray(g) ? { args: g } : g));
    const cases = generated.map((g) => ({ ...toCase(p, g.args), expected: '' }));
    const res = runReference(p, cases);
    out[p.slug] = res.results.map((r, i) => {
      if (r.error) throw new Error(`${p.slug}: the reference crashed on generated case ${i + 1}: ${r.error}`);
      // Cases built with a known answer (e.g. a Sudoku board broken on purpose) double-check the reference
      if ('expect' in generated[i] && !answersMatch(r.actual, raw(generated[i].expect))) {
        throw new Error(`${p.slug}: generated case ${i + 1} should be ${raw(generated[i].expect)}, the reference says ${r.actual}`);
      }
      return { ...cases[i], expected: r.actual, ...extra };
    });
  }
  return out;
}

/** One case per line, so a regenerated file diffs readably */
export function formatHiddenTests(tests) {
  const body = Object.entries(tests)
    .map(([slug, cases]) => `  ${raw(slug)}: [\n${cases.map((c) => `    ${raw(c)}`).join(',\n')}\n  ]`)
    .join(',\n');
  return `{\n${body}\n}\n`;
}
