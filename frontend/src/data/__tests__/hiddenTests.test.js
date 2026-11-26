import { describe, it, expect } from 'vitest';
import hiddenTests from '../hiddenTests.json';
import { buildHiddenTests } from '../../../scripts/hidden-tests/build.js';
import { PROBLEMS } from '../../../scripts/hidden-tests/problems.js';
import { parseInputs, parseValue } from '../../services/execution/testCases';

describe('hidden Submit tests', () => {
  it('match what scripts/hidden-tests generates (run `npm run hidden-tests` after editing problems.js)', () => {
    expect(hiddenTests).toEqual(buildHiddenTests());
  }, 120000);

  it('cover every problem in the generator, with at least five cases each', () => {
    expect(Object.keys(hiddenTests).sort()).toEqual(PROBLEMS.map((p) => p.slug).sort());
    for (const [slug, cases] of Object.entries(hiddenTests)) {
      expect(cases.length, slug).toBeGreaterThanOrEqual(5);
    }
  });

  it('are well-formed: inputs and expected values parse', () => {
    for (const [slug, cases] of Object.entries(hiddenTests)) {
      for (const c of cases) {
        expect(typeof c.expected, slug).toBe('string');
        expect(() => JSON.parse(c.expected), `${slug}: ${c.expected.slice(0, 40)}`).not.toThrow();
        if (c.args) c.args.forEach((a) => expect(parseValue(a), slug).not.toBeUndefined());
        else expect(parseInputs(c.input).length, slug).toBeGreaterThan(0);
      }
    }
  });
});
