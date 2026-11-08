// Builds a complete Java program (class Main) around the user's Solution,
// with ListNode/TreeNode and a main() that runs every case and prints markers harness.js reads.

import { UnsupportedProblemError, USER_CODE_MARKER } from './harness';

// LeetCode metaData types → Java types (used for design problems)
function metaToJava(type = '') {
  const arr = type.match(/^(.*)\[\]$/);
  if (arr) return `${metaToJava(arr[1])}[]`;
  const list = type.match(/^list<(.*)>$/);
  if (list) return `List<${boxed(metaToJava(list[1]))}>`;
  return {
    integer: 'int', long: 'long', double: 'double', boolean: 'boolean', string: 'String',
    character: 'char', ListNode: 'ListNode', TreeNode: 'TreeNode', void: 'void',
  }[type] || type;
}

const BOXED = { int: 'Integer', long: 'Long', double: 'Double', boolean: 'Boolean', char: 'Character' };
const boxed = (t) => BOXED[t] || t;

const javaString = (s) => JSON.stringify(String(s));
const javaChar = (c) => `'${String(c).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** Java expression of `type` holding the JSON `value`. `nested` drops `new T[]` inside array initialisers */
function literal(type, value, nested = false) {
  const t = type.replace(/\s+/g, ' ').trim();
  const arr = t.match(/^(.+)\[\]$/);
  if (arr) {
    const items = (value || []).map((v) => literal(arr[1], v, true)).join(', ');
    return nested ? `{${items}}` : `new ${t}{${items}}`;
  }
  const list = t.match(/^(?:List|ArrayList)\s*<\s*(.+)\s*>$/);
  if (list) {
    const el = list[1];
    const items = (value || []).map((v) => literal(el, v)).join(', ');
    return items ? `new ArrayList<${el}>(Arrays.<${el}>asList(${items}))` : `new ArrayList<${el}>()`;
  }
  if (t === 'ListNode') return `H.list(new int[]{${(value || []).join(', ')}}, -1)`;
  if (t === 'TreeNode') return `H.tree(new Integer[]{${(value || []).map((v) => (v === null ? 'null' : v)).join(', ')}})`;
  if (t === 'String') return javaString(value);
  if (t === 'char' || t === 'Character') return javaChar(value);
  if (t === 'boolean' || t === 'Boolean') return value ? 'true' : 'false';
  if (t === 'double' || t === 'Double') return Number.isInteger(value) ? `${value}.0` : String(value);
  if (t === 'long' || t === 'Long') return `${value}L`;
  if (t === 'int' || t === 'Integer' || t === 'short') return String(value);
  throw new UnsupportedProblemError(`Java arguments of type ${t} aren't supported yet. Try JavaScript or Python`);
}

const IMPORTS = 'import java.util.*;\nimport java.util.stream.*;\nimport java.util.function.*;\n';

const LIST_NODE = `class ListNode {
    int val; ListNode next;
    ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
`;

const TREE_NODE = `class TreeNode {
    int val; TreeNode left; TreeNode right;
    TreeNode() {} TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}
`;

const HELPERS = `class H {
    static ListNode list(int[] v, int pos) {
        ListNode dummy = new ListNode(0), cur = dummy, at = null;
        for (int i = 0; i < v.length; i++) { cur.next = new ListNode(v[i]); cur = cur.next; if (i == pos) at = cur; }
        if (at != null) cur.next = at;
        return dummy.next;
    }
    static TreeNode tree(Integer[] v) {
        if (v.length == 0 || v[0] == null) return null;
        TreeNode root = new TreeNode(v[0]); Deque<TreeNode> q = new ArrayDeque<>(); q.add(root); int i = 1;
        while (!q.isEmpty() && i < v.length) {
            TreeNode n = q.poll();
            if (i < v.length && v[i] != null) { n.left = new TreeNode(v[i]); q.add(n.left); } i++;
            if (i < v.length && v[i] != null) { n.right = new TreeNode(v[i]); q.add(n.right); } i++;
        }
        return root;
    }
    static TreeNode find(TreeNode r, int val) {
        if (r == null) return null; if (r.val == val) return r;
        TreeNode l = find(r.left, val); return l != null ? l : find(r.right, val);
    }
    static String str(String s) {
        StringBuilder b = new StringBuilder("\\"");
        for (char c : s.toCharArray()) { if (c == '"' || c == '\\\\') b.append('\\\\').append(c); else if (c == '\\n') b.append("\\\\n"); else b.append(c); }
        return b.append('"').toString();
    }
    static String ser(Object o) {
        if (o == null) return "null";
        if (o instanceof String) return str((String) o);
        if (o instanceof Character) return str(String.valueOf(o));
        if (o instanceof Boolean || o instanceof Number) return String.valueOf(o);
        if (o instanceof ListNode) {
            StringBuilder b = new StringBuilder("["); Set<ListNode> seen = new HashSet<>(); boolean first = true;
            for (ListNode n = (ListNode) o; n != null && seen.add(n); n = n.next) { b.append(first ? "" : ",").append(n.val); first = false; }
            return b.append("]").toString();
        }
        if (o instanceof TreeNode) {
            List<String> out = new ArrayList<>(); Deque<TreeNode> q = new LinkedList<>(); q.add((TreeNode) o);
            while (!q.isEmpty()) { TreeNode n = q.poll(); if (n != null) { out.add(String.valueOf(n.val)); q.add(n.left); q.add(n.right); } else out.add("null"); }
            while (!out.isEmpty() && out.get(out.size() - 1).equals("null")) out.remove(out.size() - 1);
            return "[" + String.join(",", out) + "]";
        }
        if (o.getClass().isArray()) {
            StringBuilder b = new StringBuilder("["); int n = java.lang.reflect.Array.getLength(o);
            for (int i = 0; i < n; i++) b.append(i > 0 ? "," : "").append(ser(java.lang.reflect.Array.get(o, i)));
            return b.append("]").toString();
        }
        if (o instanceof Iterable) {
            StringBuilder b = new StringBuilder("["); boolean first = true;
            for (Object x : (Iterable<?>) o) { b.append(first ? "" : ",").append(ser(x)); first = false; }
            return b.append("]").toString();
        }
        return str(String.valueOf(o));
    }
}
`;

/** Full Java source (public class Main) that runs every case of `spec` against `userCode` */
export function buildJavaProgram(userCode, spec) {
  // Only Main may be public in a single-file program
  const code = userCode.replace(/\bpublic\s+class\s+(Solution|\w+)\b/g, 'class $1');
  const parts = [IMPORTS, `${USER_CODE_MARKER}\n`, code, '\n'];
  if (!/class\s+ListNode\b/.test(code)) parts.push(LIST_NODE);
  if (!/class\s+TreeNode\b/.test(code)) parts.push(TREE_NODE);
  parts.push(HELPERS, '\npublic class Main {\n    public static void main(String[] args) {\n');

  spec.cases.forEach((c, i) => {
    const lines = [];
    if (spec.mode === 'design') {
      lines.push(`List<String> out = new ArrayList<>(); ${spec.className} obj = null;`);
      c.ops.forEach((op, j) => {
        if (j === 0) {
          const args = c.args[0].map((v, k) => literal(metaToJava(spec.ctorParams[k]), v));
          lines.push(`obj = new ${spec.className}(${args.join(', ')}); out.add("null");`);
          return;
        }
        const m = spec.methods[op];
        if (!m) throw new UnsupportedProblemError(`Unknown operation ${op}`);
        const args = c.args[j].map((v, k) => literal(metaToJava(m.params[k]), v));
        lines.push(m.returnsVoid
          ? `obj.${op}(${args.join(', ')}); out.add("null");`
          : `out.add(H.ser(obj.${op}(${args.join(', ')})));`);
      });
      lines.push(`System.out.println("@@CASE ${i} OUT@@[" + String.join(",", out) + "]");`);
    } else {
      const firstList = c.args.findIndex((a) => a.kind === 'list');
      c.args.forEach((a, k) => {
        const type = (a.codeType || metaToJava(a.type)).trim();
        if (a.kind === 'treeRef') {
          lines.push(`TreeNode a${k} = H.find(a${a.refIndex}, ${Number(a.value)});`);
        } else if (a.kind === 'list' && k === firstList && c.cyclePos >= 0) {
          lines.push(`ListNode a${k} = H.list(new int[]{${(a.value || []).join(', ')}}, ${c.cyclePos});`);
        } else {
          lines.push(`${type} a${k} = ${literal(type, a.value)};`);
        }
      });
      // One Solution object for every call; later calls take the previous result (decode(encode(strs)))
      lines.push('Solution sol = new Solution();');
      const calls = spec.calls || [spec.fnName];
      const call = calls.slice(1).reduce(
        (inner, name) => `sol.${name}(${inner})`,
        `sol.${calls[0]}(${c.args.map((_, k) => `a${k}`).join(', ')})`,
      );
      if (spec.inPlaceIndex !== null && spec.inPlaceIndex !== undefined) {
        lines.push(`${call};`, `System.out.println("@@CASE ${i} OUT@@" + H.ser(a${spec.inPlaceIndex}));`);
      } else {
        lines.push(`Object r = ${call};`, `System.out.println("@@CASE ${i} OUT@@" + H.ser(r));`);
      }
    }
    parts.push(
      `        System.out.println("@@CASE ${i} BEGIN@@");\n`,
      `        { long t0 = System.nanoTime();\n          try {\n`,
      lines.map((l) => `            ${l}\n`).join(''),
      `          } catch (Throwable e) { System.out.println("@@CASE ${i} ERR@@" + e); }\n`,
      `          System.out.println("@@CASE ${i} MS@@" + (System.nanoTime() - t0) / 1e6); }\n`,
    );
  });

  parts.push('    }\n}\n');
  return parts.join('');
}
