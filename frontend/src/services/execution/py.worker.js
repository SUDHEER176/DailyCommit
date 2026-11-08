/* eslint-disable no-restricted-globals, no-undef */
// Runs a Python solution with Pyodide (CPython compiled to WebAssembly).
// Loaded once per worker; the page terminates and replaces the worker after a time limit.

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

importScripts(`${PYODIDE_URL}pyodide.js`);

// The same names LeetCode's Python environment makes available without imports
const PRELUDE = `
import json, sys, io, time, math, bisect, heapq, itertools, functools, collections, string, re, random, operator
from typing import *
from collections import *
from heapq import *
from functools import *
from itertools import *
from bisect import *
from math import inf

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def __build_list(values, pos=-1):
    nodes = [ListNode(v) for v in (values or [])]
    for a, b in zip(nodes, nodes[1:]):
        a.next = b
    if pos is not None and pos >= 0 and pos < len(nodes):
        nodes[-1].next = nodes[pos]
    return nodes[0] if nodes else None

def __build_tree(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = deque([root])
    i = 1
    while queue and i < len(values):
        node = queue.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i]); queue.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i]); queue.append(node.right)
        i += 1
    return root

def __find_node(root, val):
    stack = [root]
    while stack:
        n = stack.pop()
        if n is None:
            continue
        if n.val == val:
            return n
        stack.extend([n.left, n.right])
    return None

def __plain(v):
    if hasattr(v, 'val') and hasattr(v, 'next'):
        out, seen, n = [], set(), v
        while n is not None and id(n) not in seen and len(out) < 100000:
            seen.add(id(n)); out.append(n.val); n = n.next
        return out
    if hasattr(v, 'val') and (hasattr(v, 'left') or hasattr(v, 'right')):
        out, queue = [], deque([v])
        while queue:
            n = queue.popleft()
            if n is None:
                out.append(None)
            else:
                out.append(n.val); queue.append(n.left); queue.append(n.right)
        while out and out[-1] is None:
            out.pop()
        return out
    if isinstance(v, (list, tuple, set, frozenset)):
        return [__plain(x) for x in v]
    if isinstance(v, dict):
        return {str(k): __plain(x) for k, x in v.items()}
    return v

def __json(v):
    return json.dumps(__plain(v), separators=(',', ':'))

def __make_arg(arg, built, cycle_pos, is_first_list):
    kind = arg['kind']
    if kind == 'list':
        return __build_list(arg['value'], cycle_pos if is_first_list else -1)
    if kind == 'listArray':
        return [__build_list(x) for x in (arg['value'] or [])]
    if kind == 'tree':
        return __build_tree(arg['value'])
    if kind == 'treeRef':
        return __find_node(built[arg['refIndex']], arg['value'])
    return arg['value']

def __run(user_code, spec_json):
    spec = json.loads(spec_json)
    results = []
    for case in spec['cases']:
        buf = io.StringIO()
        old_out = sys.stdout
        sys.stdout = buf
        start = time.perf_counter()
        try:
            scope = dict(globals())
            exec(user_code, scope)
            if spec['mode'] == 'design':
                cls = scope.get(spec['className'])
                if cls is None:
                    raise NameError(spec['className'] + ' is not defined')
                obj, out = None, []
                for i, op in enumerate(case['ops']):
                    if i == 0:
                        obj = cls(*case['args'][0]); out.append(None); continue
                    r = getattr(obj, op)(*case['args'][i])
                    meth = spec['methods'].get(op) or {}
                    out.append(None if meth.get('returnsVoid') else __plain(r))
                output = json.dumps(out, separators=(',', ':'))
            else:
                solution = scope.get('Solution')
                if solution is None:
                    raise NameError('class Solution is not defined')
                args = case['args']
                first_list = next((i for i, a in enumerate(args) if a['kind'] == 'list'), -1)
                built = []
                for i, a in enumerate(args):
                    built.append(__make_arg(a, built, case['cyclePos'], i == first_list))
                r = getattr(solution(), spec['fnName'])(*built)
                idx = spec.get('inPlaceIndex')
                output = __json(built[idx]) if idx is not None else __json(r)
            results.append({'output': output, 'logs': buf.getvalue(), 'ms': (time.perf_counter() - start) * 1000})
        except SyntaxError as e:
            # Name the line and show it, instead of "invalid syntax (<string>, line 1)"
            where = f' on line {e.lineno}' if e.lineno else ''
            src = f': {e.text.strip()}' if e.text and e.text.strip() else ''
            results.append({'error': f'{type(e).__name__}: {e.msg}{where}{src}', 'logs': buf.getvalue(), 'ms': (time.perf_counter() - start) * 1000})
        except Exception as e:
            results.append({'error': type(e).__name__ + ': ' + str(e), 'logs': buf.getvalue(), 'ms': (time.perf_counter() - start) * 1000})
        finally:
            sys.stdout = old_out
    return json.dumps(results)
`;

const ready = (async () => {
  const pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
  pyodide.runPython(PRELUDE);
  return pyodide;
})();

ready.then(() => self.postMessage({ type: 'ready' })).catch((err) => self.postMessage({ type: 'loadError', error: String(err?.message || err) }));

self.onmessage = async ({ data }) => {
  try {
    const pyodide = await ready;
    pyodide.globals.set('__user_code', data.code);
    pyodide.globals.set('__spec_json', JSON.stringify(data.spec));
    const out = pyodide.runPython('__run(__user_code, __spec_json)');
    self.postMessage({ type: 'done', cases: JSON.parse(out) });
  } catch (err) {
    // A SyntaxError in the user's code surfaces here, before any case runs
    const message = String(err?.message || err);
    const last = message.trim().split('\n').filter(Boolean).pop() || message;
    self.postMessage({ type: 'failed', error: last });
  }
};
