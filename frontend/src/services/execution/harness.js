// Turns a problem plus its test cases into a language-neutral spec the runners execute,
// and turns the runners' raw per-case output back into the result shape the editor shows.
//
// Spec shape:
//   function problems: { mode: 'function', fnName, inPlaceIndex, cases: [{ args: [Arg], cyclePos }] }
//   design problems:   { mode: 'design', className, methods: { name: { returnsVoid } }, cases: [{ ops, args }] }
//   Arg: { kind: 'value' | 'list' | 'listArray' | 'tree' | 'treeRef', value, type, name, refIndex? }

import { readSignature } from './signature';
import { parseInputs, parseValue, isDesignCase, answersMatch, allowsAnyOrder, displayExpected } from './testCases';

export class UnsupportedProblemError extends Error {}

/** Comment line the C++ and Java drivers put right above the person's code, to map compiler line numbers back */
export const USER_CODE_MARKER = '// ── Your code ──';

/** Values of one case: from `args` (one raw value per line) when present, else parsed from the input text */
function caseValues(testCase, meta) {
  if (Array.isArray(testCase.args) && testCase.args.length) {
    const names = meta?.params?.map((p) => p.name) || [];
    return testCase.args.map((raw, i) => ({ name: names[i] || null, value: parseValue(raw) }));
  }
  return parseInputs(testCase.input || '');
}

const metaKind = (type = '') => {
  if (/^ListNode\[\]$|^list<ListNode>$/.test(type)) return 'listArray';
  if (/^ListNode$/.test(type)) return 'list';
  if (/^TreeNode$/.test(type)) return 'tree';
  if (/(^|[^A-Za-z])Node\b/.test(type) && !/ListNode|TreeNode/.test(type)) return 'unsupported';
  return null;
};

/**
 * Build the spec for running `testCases` in `language`.
 * `signatureSource` is the starter template when there is one, otherwise the user's code.
 */
export function buildSpec({ problem, language, signatureSource, testCases }) {
  const meta = problem?.meta || null;
  const parsed = testCases.map((tc) => caseValues(tc, meta));

  // Design problems: a class driven by a list of operations
  if (meta?.classname || (parsed.length && parsed.every(isDesignCase))) {
    const className = meta?.classname || parsed[0][0].value[0];
    const methods = Object.fromEntries((meta?.methods || []).map((m) => [m.name, {
      returnsVoid: m.return?.type === 'void',
      params: (m.params || []).map((p) => p.type),
      returnType: m.return?.type,
    }]));
    return {
      mode: 'design',
      className,
      ctorParams: (meta?.constructor?.params || []).map((p) => p.type),
      methods,
      cases: parsed.map(([ops, args]) => ({ ops: ops.value, args: args.value })),
    };
  }

  const sig = readSignature(language, signatureSource);
  if (!sig) throw new UnsupportedProblemError('Could not find the solution method in the starter code');

  const metaParams = meta?.params || [];
  const metaType = (name) => metaParams.find((p) => p.name === name)?.type;
  if (metaParams.some((p) => metaKind(p.type) === 'unsupported') || metaKind(meta?.return?.type) === 'unsupported') {
    throw new UnsupportedProblemError('This problem uses a custom Node type that can’t be run here yet. Solve it on LeetCode for now');
  }

  const sigNames = new Set(sig.params.map((p) => p.name));
  const inPlaceIndex = meta?.output?.paramindex ?? (sig.returnsVoid ? 0 : null);

  const cases = parsed.map((values) => {
    const byName = Object.fromEntries(values.filter((v) => v.name).map((v) => [v.name, v.value]));
    // Values the method doesn't take, e.g. `pos` in Linked List Cycle, which places the cycle
    const extras = values.filter((v) => v.name && !sigNames.has(v.name));
    const cyclePos = extras.find((v) => v.name === 'pos')?.value ?? -1;
    let positional = values.filter((v) => !v.name || sigNames.has(v.name));

    const args = sig.params.map((p, i) => {
      const value = p.name in byName ? byName[p.name] : positional[i]?.value;
      const type = metaType(p.name) || '';
      let kind = metaKind(type) || p.kind;
      // Lowest Common Ancestor: the statement gives p and q as values, the method wants nodes
      if (p.kind === 'tree' && typeof value === 'number') kind = 'treeRef';
      return { name: p.name, type, codeType: p.type, kind, value };
    });
    // Point node references at the first tree argument
    const treeIndex = args.findIndex((a) => a.kind === 'tree');
    args.forEach((a) => { if (a.kind === 'treeRef') a.refIndex = treeIndex; });
    return { args, cyclePos };
  });

  const returnKind = metaKind(meta?.return?.type) || (/ListNode/.test(sig.returnType) ? 'list' : /TreeNode/.test(sig.returnType) ? 'tree' : 'value');
  // Methods to call in order, each on the previous result. Usually just one; Encode and Decode
  // Strings is checked as decode(encode(strs)).
  const calls = Array.isArray(meta?.pipe) && meta.pipe.length ? meta.pipe : [sig.name];
  return { mode: 'function', fnName: calls[0], calls, inPlaceIndex, returnType: sig.returnType, returnKind, params: sig.params, cases };
}

/**
 * Raw runner output per case: { output?: string (JSON), error?: string, logs?: string, ms?: number }.
 * `runError` is a failure of the whole run (compile error, time limit) and marks every unfinished case.
 */
/**
 * Match LeetCode's display of node results: an empty list or tree is [] (not null), and when the
 * expected answer is a single value (Lowest Common Ancestor) a returned node shows as its value.
 */
function normaliseNodeOutput(output, expectedText, returnKind) {
  if (output === undefined || (returnKind !== 'list' && returnKind !== 'tree')) return output;
  if (output === 'null') return '[]';
  const expected = parseValue(expectedText);
  if (returnKind === 'tree' && !Array.isArray(expected)) {
    try {
      const tree = JSON.parse(output);
      return Array.isArray(tree) ? JSON.stringify(tree.length ? tree[0] : null) : output;
    } catch { return output; }
  }
  return output;
}

export function assembleResult({ problem, testCases, caseOutputs = [], runError = null, verdictHint = null, spec = null }) {
  const anyOrder = allowsAnyOrder(problem);
  const results = testCases.map((tc, i) => {
    const raw = caseOutputs[i] || {};
    const out = { ...raw, output: normaliseNodeOutput(raw.output, tc.expected, spec?.returnKind) };
    const expected = displayExpected(tc.expected);
    const error = out.error || (out.output === undefined ? (runError || 'Did not run') : null);
    const passed = !error && answersMatch(out.output, tc.expected, { anyOrder });
    return {
      testCaseIndex: i + 1,
      input: tc.input,
      expected,
      actual: out.output ?? (error ? 'Error' : 'undefined'),
      passed,
      error,
      logs: out.logs || '',
      ms: out.ms ?? null,
    };
  });

  const allPassed = results.length > 0 && results.every((r) => r.passed);
  const verdict = allPassed
    ? 'Accepted'
    : verdictHint
      || (results.some((r) => r.error) ? 'Runtime Error' : 'Wrong Answer');
  const runtimeMs = Math.round(results.reduce((a, r) => a + (r.ms || 0), 0));
  return { success: allPassed, verdict, runtimeMs, results };
}

/** Pull per-case output out of a compiled program's stdout (C++ and Java print markers) */
export function parseMarkedOutput(stdout = '', count) {
  const cases = Array.from({ length: count }, () => ({}));
  const logs = Array.from({ length: count }, () => []);
  let current = -1;
  stdout.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^@@CASE (\d+) (BEGIN|OUT|ERR|MS)@@(.*)$/);
    if (!m) {
      if (current >= 0 && line.trim()) logs[current].push(line);
      return;
    }
    const i = Number(m[1]);
    if (m[2] === 'BEGIN') current = i;
    else if (m[2] === 'OUT') cases[i].output = m[3];
    else if (m[2] === 'ERR') cases[i].error = m[3] || 'Runtime error';
    else if (m[2] === 'MS') cases[i].ms = Number(m[3]);
  });
  cases.forEach((c, i) => { if (logs[i].length) c.logs = logs[i].join('\n'); });
  return { cases, lastStarted: current };
}
