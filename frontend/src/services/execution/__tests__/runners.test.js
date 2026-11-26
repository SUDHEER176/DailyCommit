// Real solutions through the real runners, in every language whose tool is installed.
// JavaScript always runs; Python, C++ and Java skip (with a note) when python, g++ or java is missing.

import { describe, it, expect } from 'vitest';
import { PROBLEMS, problemFor } from './fixtures';
import { runLocally, available } from './localRunners';
import hiddenTests from '../../../data/hiddenTests.json';

const LANGUAGES = ['javascript', 'python', 'cpp', 'java'];
const SLOW = 120000; // compiling C++ and Java takes a few seconds per program

for (const language of LANGUAGES) {
  describe.skipIf(!available[language])(`${language} runner`, () => {
    for (const [key, p] of Object.entries(PROBLEMS)) {
      it(`accepts a correct ${p.title}`, () => {
        const result = runLocally({ problem: problemFor(key), language, code: p.solutions[language], testCases: p.testCases });
        const failed = result.results.filter((r) => !r.passed).map((r) => `case ${r.testCaseIndex}: got ${r.actual}, expected ${r.expected}${r.error ? ` (${r.error})` : ''}`);
        expect(failed, `${p.title} in ${language}`).toEqual([]);
        expect(result.verdict).toBe('Accepted');
      }, SLOW);
    }
  });
}

// The generated hidden Submit tests, run by correct solutions in every language: checks the data
// works through the Python driver and the compiled C++ and Java programs, not only JavaScript
const HIDDEN_SLUGS = { twoSum: 'two-sum', reverseList: 'reverse-linked-list', hasCycle: 'linked-list-cycle', mergeKLists: 'merge-k-sorted-lists', minStack: 'min-stack' };

for (const language of LANGUAGES) {
  describe.skipIf(!available[language])(`${language} hidden Submit tests`, () => {
    for (const [key, slug] of Object.entries(HIDDEN_SLUGS)) {
      it(`passes every hidden case of ${PROBLEMS[key].title}`, () => {
        const testCases = hiddenTests[slug];
        const result = runLocally({ problem: problemFor(key), language, code: PROBLEMS[key].solutions[language], testCases });
        const failed = result.results.filter((r) => !r.passed).map((r) => `case ${r.testCaseIndex}: ${r.error || `got ${r.actual.slice(0, 80)}`}`);
        expect(failed, `${slug} in ${language}`).toEqual([]);
      }, SLOW);
    }
  });
}

describe('failure verdicts', () => {
  const twoSum = problemFor('twoSum');
  const { testCases } = PROBLEMS.twoSum;

  it('reports a wrong answer with the output and the expected value', () => {
    const r = runLocally({ problem: twoSum, language: 'javascript', code: 'var twoSum = function(nums, target) { return [0, 0]; };', testCases });
    expect(r.verdict).toBe('Wrong Answer');
    expect(r.results[0]).toMatchObject({ passed: false, actual: '[0,0]', expected: '[0,1]' });
  });

  it('reports a thrown error as a runtime error, with console output kept', () => {
    const r = runLocally({ problem: twoSum, language: 'javascript', code: 'var twoSum = function(nums) { console.log("here", nums.length); return nums.foo.bar; };', testCases });
    expect(r.verdict).toBe('Runtime Error');
    expect(r.results[0].error).toMatch(/TypeError/);
    expect(r.results[0].logs).toBe('here 4');
  });

  it('reports a missing function by name', () => {
    const r = runLocally({ problem: twoSum, language: 'javascript', code: 'var somethingElse = () => 1;', testCases });
    expect(r.results[0].error).toMatch(/twoSum is not defined/);
  });

  it.skipIf(!available.python)('reports Python exceptions', () => {
    const r = runLocally({ problem: twoSum, language: 'python', code: 'class Solution:\n    def twoSum(self, nums, target):\n        return nums[99]', testCases });
    expect(r.verdict).toBe('Runtime Error');
    expect(r.results[0].error).toMatch(/IndexError/);
  }, SLOW);

  it.skipIf(!available.cpp)('reports a C++ compile error', () => {
    const r = runLocally({ problem: twoSum, language: 'cpp', code: 'class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return nums } };', testCases });
    expect(r.verdict).toBe('Compile Error');
  }, SLOW);
});

describe('runner availability', () => {
  it('notes which languages were skipped on this machine', () => {
    const skipped = LANGUAGES.filter((l) => !available[l]);
    if (skipped.length) console.warn(`Runner tests skipped (tool not installed): ${skipped.join(', ')}`);
    expect(available.javascript).toBe(true);
  });
});
