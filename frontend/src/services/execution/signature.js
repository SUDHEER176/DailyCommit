// Reads the method a problem wants from its starter code: name, parameters and types.
// The type text is kept as written (e.g. "vector<int>&", "Optional[ListNode]", "int[][]")
// and also reduced to a `kind` the harness cares about: 'list' (ListNode), 'tree' (TreeNode) or 'value'.

const LIST_NAMES = /^(head|l1|l2|list1|list2|headA|headB)$/;
const TREE_NAMES = /^(root|root1|root2|subRoot|p|q|original|cloned)$/;

function kindOf(type = '', name = '') {
  if (/ListNode/.test(type)) return 'list';
  if (/TreeNode/.test(type)) return 'tree';
  if (!type) {
    if (LIST_NAMES.test(name)) return 'list';
    if (TREE_NAMES.test(name)) return 'tree';
  }
  return 'value';
}

/** Split "a, map<int, int> b" on commas outside <> [] () */
function splitParams(text) {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if ('<[('.includes(c)) depth++;
    else if ('>])'.includes(c)) depth--;
    else if (c === ',' && depth === 0) { out.push(text.slice(start, i)); start = i + 1; }
  }
  out.push(text.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}

function javascript(code) {
  const m = code.match(/(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*function\s*\(([^)]*)\)/)
    || code.match(/function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/);
  if (!m) return null;
  const jsdocTypes = {};
  for (const t of code.matchAll(/@param\s*\{([^}]*)\}\s*([A-Za-z_$][\w$]*)/g)) jsdocTypes[t[2]] = t[1];
  const ret = code.match(/@return\s*\{([^}]*)\}/)?.[1] || '';
  const params = splitParams(m[2]).map((name) => ({ name, type: jsdocTypes[name] || '', kind: kindOf(jsdocTypes[name], name) }));
  return { name: m[1], params, returnType: ret, returnsVoid: /^void$/.test(ret) };
}

function python(code) {
  const body = code.slice(code.indexOf('class Solution') >= 0 ? code.indexOf('class Solution') : 0);
  const m = body.match(/def\s+([A-Za-z_]\w*)\s*\(\s*self\s*,?([^)]*)\)\s*(?:->\s*([^:]+))?:/);
  if (!m) return null;
  const params = splitParams(m[2]).map((p) => {
    const [name, type = ''] = p.split(':').map((s) => s.trim());
    return { name: name.replace(/=.*$/, '').trim(), type, kind: kindOf(type, name) };
  });
  const ret = (m[3] || '').trim();
  return { name: m[1], params, returnType: ret, returnsVoid: ret === 'None' };
}

/** C++ and Java share the "Type name(Type a, Type b) {" shape inside class Solution */
function typed(code, language) {
  const start = code.indexOf('class Solution');
  const body = start >= 0 ? code.slice(start) : code;
  const re = language === 'java'
    ? /public\s+(?:static\s+)?([\w<>\[\],\s?]+?)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/
    : /(?:public:\s*)?([\w:<>,\s*&]+?)\s*\b([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/;
  const m = body.slice(body.indexOf('{') + 1).match(re);
  if (!m) return null;
  const params = splitParams(m[3]).map((p) => {
    const pm = p.match(/^(.*?)([A-Za-z_]\w*)\s*$/);
    const type = (pm?.[1] || '').trim();
    const name = pm?.[2] || p;
    return { name, type, kind: kindOf(type, name) };
  });
  const ret = m[1].replace(/\s+/g, ' ').trim();
  return { name: m[2], params, returnType: ret, returnsVoid: ret === 'void' };
}

/** Signature of the solution method, or null when the starter code has none (e.g. design problems) */
export function readSignature(language, code = '') {
  if (!code) return null;
  if (language === 'javascript') return javascript(code);
  if (language === 'python') return python(code);
  if (language === 'cpp' || language === 'java') return typed(code, language);
  return null;
}
