/* eslint-disable no-restricted-globals */
// Runs a JavaScript solution against a spec from harness.js, off the main thread.
// The page terminates this worker if it runs past the time limit.

function ListNode(val, next) { this.val = val === undefined ? 0 : val; this.next = next === undefined ? null : next; }
function TreeNode(val, left, right) {
  this.val = val === undefined ? 0 : val;
  this.left = left === undefined ? null : left;
  this.right = right === undefined ? null : right;
}

function buildList(values, pos = -1) {
  const nodes = (values || []).map((v) => new ListNode(v));
  nodes.forEach((n, i) => { n.next = nodes[i + 1] || null; });
  if (pos >= 0 && nodes[pos]) nodes[nodes.length - 1].next = nodes[pos];
  return nodes[0] || null;
}

/** LeetCode level-order array, nulls for missing children */
function buildTree(values) {
  if (!values || !values.length || values[0] === null) return null;
  const root = new TreeNode(values[0]);
  const queue = [root];
  let i = 1;
  while (queue.length && i < values.length) {
    const node = queue.shift();
    if (i < values.length && values[i] !== null) { node.left = new TreeNode(values[i]); queue.push(node.left); }
    i++;
    if (i < values.length && values[i] !== null) { node.right = new TreeNode(values[i]); queue.push(node.right); }
    i++;
  }
  return root;
}

function findNode(root, val) {
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    if (!n) continue;
    if (n.val === val) return n;
    stack.push(n.left, n.right);
  }
  return null;
}

const isList = (v) => v && typeof v === 'object' && 'val' in v && 'next' in v;
const isTree = (v) => v && typeof v === 'object' && 'val' in v && ('left' in v || 'right' in v);

/** Plain JSON-able value: lists → arrays, trees → level-order arrays */
function plain(v) {
  if (isList(v)) {
    const out = [];
    const seen = new Set();
    for (let n = v; n && out.length < 100000; n = n.next) {
      if (seen.has(n)) break; // a cycle: stop instead of looping forever
      seen.add(n);
      out.push(n.val);
    }
    return out;
  }
  if (isTree(v)) {
    const out = [];
    const queue = [v];
    while (queue.length) {
      const n = queue.shift();
      if (n) { out.push(n.val); queue.push(n.left, n.right); } else out.push(null);
    }
    while (out.length && out[out.length - 1] === null) out.pop();
    return out;
  }
  if (Array.isArray(v)) return v.map(plain);
  if (v instanceof Set) return [...v].map(plain);
  if (v === undefined) return null;
  return v;
}

const toJson = (v) => JSON.stringify(plain(v));

function makeArg(arg, built, cyclePos, firstListIndex, index) {
  if (arg.kind === 'list') return buildList(arg.value, index === firstListIndex ? cyclePos : -1);
  if (arg.kind === 'listArray') return (arg.value || []).map((l) => buildList(l));
  if (arg.kind === 'tree') return buildTree(arg.value);
  if (arg.kind === 'treeRef') return findNode(built[arg.refIndex], arg.value);
  return arg.value;
}

self.onmessage = ({ data }) => {
  const { code, spec } = data;
  const logs = [];
  const fmt = (a) => (typeof a === 'string' ? a : (() => { try { return JSON.stringify(plain(a)); } catch { return String(a); } })());
  console.log = (...a) => logs.push(a.map(fmt).join(' '));
  console.error = console.warn = console.info = console.log;

  // Names the code must define: the class for design problems, else each function to call in order
  const names = spec.mode === 'design' ? [spec.className] : (spec.calls || [spec.fnName]);
  const load = () => new Function('ListNode', 'TreeNode',
    `${code}\nreturn { ${names.map((n) => `${JSON.stringify(n)}: typeof ${n} !== 'undefined' ? ${n} : undefined`).join(', ')} };`,
  )(ListNode, TreeNode);

  const cases = spec.cases.map((c) => {
    logs.length = 0;
    const start = performance.now();
    try {
      const defined = load();
      const missing = names.find((n) => typeof defined[n] !== 'function');
      if (missing) throw new Error(`${missing} is not defined`);
      const target = defined[names[0]];
      let output;
      if (spec.mode === 'design') {
        let obj = null;
        const out = c.ops.map((op, i) => {
          if (i === 0) { obj = new target(...c.args[0]); return null; }
          if (typeof obj[op] !== 'function') throw new Error(`${spec.className}.${op} is not defined`);
          const r = obj[op](...c.args[i]);
          return spec.methods[op]?.returnsVoid ? null : plain(r);
        });
        output = JSON.stringify(out);
      } else {
        const firstList = c.args.findIndex((a) => a.kind === 'list');
        const built = [];
        c.args.forEach((a, i) => { built[i] = makeArg(a, built, c.cyclePos, firstList, i); });
        let r = target(...built);
        names.slice(1).forEach((n) => { r = defined[n](r); }); // e.g. decode(encode(strs))
        output = spec.inPlaceIndex !== null && spec.inPlaceIndex !== undefined ? toJson(built[spec.inPlaceIndex]) : toJson(r);
      }
      return { output, logs: logs.join('\n'), ms: performance.now() - start };
    } catch (err) {
      return { error: `${err?.name || 'Error'}: ${err?.message || err}`, logs: logs.join('\n'), ms: performance.now() - start };
    }
  });

  self.postMessage({ cases });
};
