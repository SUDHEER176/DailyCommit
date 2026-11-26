import { describe, it, expect } from 'vitest';
import { buildSpec, assembleResult, parseMarkedOutput, UnsupportedProblemError } from '../harness';
import { PROBLEMS, problemFor } from './fixtures';

const spec = (key, language = 'javascript', testCases = PROBLEMS[key].testCases, extra) => {
  const problem = problemFor(key, extra);
  return buildSpec({ problem, language, signatureSource: problem.starterTemplates[language] || '', testCases });
};

describe('buildSpec', () => {
  it('maps named and positional inputs onto the parameters', () => {
    const s = spec('twoSum');
    expect(s).toMatchObject({ mode: 'function', fnName: 'twoSum', inPlaceIndex: null, returnKind: 'value' });
    expect(s.cases.map((c) => c.args.map((a) => a.value))).toEqual([[[2, 7, 11, 15], 9], [[3, 2, 4], 6], [[-3, 4, 3, 90], 0]]);
  });

  it('works without LeetCode metadata, from the starter code alone', () => {
    const problem = { starterTemplates: PROBLEMS.twoSum.starterTemplates };
    const s = buildSpec({ problem, language: 'python', signatureSource: problem.starterTemplates.python, testCases: [{ input: '[1,2]\n3', expected: '[0,1]' }] });
    expect(s.cases[0].args.map((a) => a.value)).toEqual([[1, 2], 3]);
  });

  it('takes `pos` out of the arguments and uses it to place the cycle', () => {
    const s = spec('hasCycle');
    expect(s.cases.map((c) => c.cyclePos)).toEqual([1, 0, -1]);
    expect(s.cases[0].args).toHaveLength(1);
    expect(s.cases[0].args[0]).toMatchObject({ kind: 'list', value: [3, 2, 0, -4] });
  });

  it('reads list-of-lists, trees and node references from the metadata', () => {
    expect(spec('mergeKLists').cases[0].args[0].kind).toBe('listArray');
    expect(spec('maxDepth').cases[0].args[0].kind).toBe('tree');
    const lca = spec('lowestCommonAncestor').cases[0].args;
    expect(lca.map((a) => a.kind)).toEqual(['tree', 'treeRef', 'treeRef']);
    expect(lca[1].refIndex).toBe(0);
  });

  it('builds design problems from the class metadata', () => {
    const s = spec('minStack');
    expect(s).toMatchObject({ mode: 'design', className: 'MinStack', ctorParams: [] });
    expect(s.methods.push).toMatchObject({ returnsVoid: true, params: ['integer'] });
    expect(s.methods.getMin).toMatchObject({ returnsVoid: false });
    expect(s.cases[0].ops[0]).toBe('MinStack');
  });

  it('marks in-place answers', () => {
    expect(spec('reverseString').inPlaceIndex).toBe(0);
  });

  it('chains calls for pipe problems, e.g. decode(encode(strs))', () => {
    const problem = {
      meta: { name: 'encode', params: [{ name: 'strs', type: 'string[]' }], return: { type: 'string' }, pipe: ['encode', 'decode'] },
      starterTemplates: { python: 'class Solution:\n    def encode(self, strs: List[str]) -> str:\n        ' },
    };
    const s = buildSpec({ problem, language: 'python', signatureSource: problem.starterTemplates.python, testCases: [{ args: ['["a"]'], expected: '["a"]' }] });
    expect(s.calls).toEqual(['encode', 'decode']);
  });

  it('refuses custom Node types it can\'t build', () => {
    const problem = {
      meta: { name: 'copyRandomList', params: [{ name: 'head', type: 'Node' }], return: { type: 'Node' } },
      starterTemplates: { python: 'class Solution:\n    def copyRandomList(self, head: Optional[Node]) -> Optional[Node]:\n        ' },
    };
    expect(() => buildSpec({ problem, language: 'python', signatureSource: problem.starterTemplates.python, testCases: [{ args: ['[[7,null]]'], expected: '[[7,null]]' }] }))
      .toThrow(UnsupportedProblemError);
  });

  it('says so when the starter code has no method', () => {
    expect(() => buildSpec({ problem: {}, language: 'python', signatureSource: 'x = 1', testCases: [{ input: '1', expected: '1' }] }))
      .toThrow(/solution method/);
  });
});

describe('assembleResult', () => {
  const problem = problemFor('twoSum');
  const testCases = PROBLEMS.twoSum.testCases;

  it('accepts when every case matches', () => {
    const r = assembleResult({ problem, testCases, caseOutputs: [{ output: '[0,1]', ms: 1 }, { output: '[1,2]', ms: 2 }, { output: '[0,2]', ms: 3 }] });
    expect(r).toMatchObject({ success: true, verdict: 'Accepted', runtimeMs: 6 });
    expect(r.results.every((c) => c.passed)).toBe(true);
  });

  it('calls a mismatch a wrong answer, and a thrown error a runtime error', () => {
    const wrong = assembleResult({ problem, testCases, caseOutputs: [{ output: '[0,1]' }, { output: '[2,1]' }, { output: '[0,2]' }] });
    expect(wrong).toMatchObject({ success: false, verdict: 'Wrong Answer' });
    expect(wrong.results[1]).toMatchObject({ passed: false, actual: '[2,1]', expected: '[1,2]' });

    const crashed = assembleResult({ problem, testCases, caseOutputs: [{ output: '[0,1]' }, { error: 'TypeError: x' }, {}] });
    expect(crashed.verdict).toBe('Runtime Error');
    expect(crashed.results[2].error).toBe('Did not run');
  });

  it('passes a whole-run failure to every case, with the verdict given', () => {
    const r = assembleResult({ problem, testCases, runError: 'Time limit exceeded', verdictHint: 'Time Limit Exceeded' });
    expect(r.verdict).toBe('Time Limit Exceeded');
    expect(r.results.every((c) => c.error === 'Time limit exceeded')).toBe(true);
  });

  it('shows an empty list as [] and a returned node as its value, like LeetCode', () => {
    const list = assembleResult({ problem: {}, testCases: [{ expected: '[]' }], caseOutputs: [{ output: 'null' }], spec: { returnKind: 'list' } });
    expect(list.results[0]).toMatchObject({ passed: true, actual: '[]' });
    const node = assembleResult({ problem: {}, testCases: [{ expected: '6' }], caseOutputs: [{ output: '[6,2,8]' }], spec: { returnKind: 'tree' } });
    expect(node.results[0]).toMatchObject({ passed: true, actual: '6' });
  });

  it('is not accepted when there are no cases', () => {
    expect(assembleResult({ problem, testCases: [] }).success).toBe(false);
  });
});

describe('parseMarkedOutput', () => {
  it('splits a compiled program\'s output into cases, keeping prints as logs', () => {
    const stdout = [
      '@@CASE 0 BEGIN@@', 'debug line', '@@CASE 0 OUT@@[0,1]', '@@CASE 0 MS@@1.5',
      '@@CASE 1 BEGIN@@', '@@CASE 1 ERR@@vector::_M_range_check', '@@CASE 1 MS@@0.2',
    ].join('\n');
    const { cases, lastStarted } = parseMarkedOutput(stdout, 3);
    expect(cases[0]).toEqual({ output: '[0,1]', ms: 1.5, logs: 'debug line' });
    expect(cases[1]).toMatchObject({ error: 'vector::_M_range_check' });
    expect(cases[2]).toEqual({});
    expect(lastStarted).toBe(1);
  });
});
