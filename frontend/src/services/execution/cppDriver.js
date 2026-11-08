// Builds a complete C++ program: LeetCode's usual headers, ListNode/TreeNode,
// the user's Solution, and a main() that runs every case and prints markers harness.js reads.

import { UnsupportedProblemError, USER_CODE_MARKER } from './harness';

// LeetCode metaData types → C++ types (used for design problems, where only metaData has types)
function metaToCpp(type = '') {
  const arr = type.match(/^(.*)\[\]$/) || type.match(/^list<(.*)>$/);
  if (arr) return `vector<${metaToCpp(arr[1])}>`;
  return {
    integer: 'int', long: 'long long', double: 'double', boolean: 'bool', string: 'string',
    character: 'char', ListNode: 'ListNode*', TreeNode: 'TreeNode*', void: 'void',
  }[type] || type;
}

/** Parameter type as written in the method, without const and & */
const bareType = (t = '') => t.replace(/\bconst\b/g, '').replace(/&/g, '').replace(/\s*\*/g, '*').replace(/\s+/g, ' ').trim();

const cppString = (s) => JSON.stringify(String(s)); // JSON escapes are valid C++ escapes for \" \\ \n \t
const cppChar = (c) => `'${String(c).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** C++ expression of `type` holding the JSON `value` */
function literal(type, value) {
  const t = bareType(type);
  const vec = t.match(/^vector\s*<\s*(.+)\s*>$/);
  if (vec) return `${t}{${(value || []).map((v) => literal(vec[1], v)).join(', ')}}`;
  if (t === 'ListNode*') return `buildList(vector<int>{${(value || []).join(', ')}})`;
  if (t === 'TreeNode*') return `buildTree(vector<string>{${(value || []).map((v) => cppString(v === null ? 'null' : v)).join(', ')}})`;
  if (t === 'string') return cppString(value);
  if (t === 'char') return cppChar(value);
  if (t === 'bool') return value ? 'true' : 'false';
  if (t === 'double' || t === 'float') return Number.isInteger(value) ? `${value}.0` : String(value);
  if (/long/.test(t)) return `${value}LL`;
  if (/^(int|unsigned|short|size_t)/.test(t)) return String(value);
  throw new UnsupportedProblemError(`C++ arguments of type ${t} aren't supported yet. Try JavaScript or Python`);
}

const PRELUDE = `#include <bits/stdc++.h>
using namespace std;
`;

const LIST_NODE = `struct ListNode {
    int val; ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};
`;

const TREE_NODE = `struct TreeNode {
    int val; TreeNode *left; TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};
`;

const HELPERS = `
static ListNode* buildList(const vector<int>& v, int pos = -1) {
    ListNode dummy; ListNode* cur = &dummy; ListNode* at = nullptr;
    for (size_t i = 0; i < v.size(); i++) { cur->next = new ListNode(v[i]); cur = cur->next; if ((int)i == pos) at = cur; }
    if (at) cur->next = at;
    return dummy.next;
}
static TreeNode* buildTree(const vector<string>& v) {
    if (v.empty() || v[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(stoi(v[0])); queue<TreeNode*> q; q.push(root); size_t i = 1;
    while (!q.empty() && i < v.size()) {
        TreeNode* n = q.front(); q.pop();
        if (i < v.size() && v[i] != "null") { n->left = new TreeNode(stoi(v[i])); q.push(n->left); } i++;
        if (i < v.size() && v[i] != "null") { n->right = new TreeNode(stoi(v[i])); q.push(n->right); } i++;
    }
    return root;
}
static TreeNode* findNode(TreeNode* r, int val) {
    if (!r) return nullptr; if (r->val == val) return r;
    TreeNode* l = findNode(r->left, val); return l ? l : findNode(r->right, val);
}
static string jsonEscape(const string& s) {
    string o = "\\"";
    for (char c : s) { if (c == '"' || c == '\\\\') { o += '\\\\'; o += c; } else if (c == '\\n') o += "\\\\n"; else o += c; }
    return o + "\\"";
}
static string ser(int v) { return to_string(v); }
static string ser(long v) { return to_string(v); }
static string ser(long long v) { return to_string(v); }
static string ser(unsigned v) { return to_string(v); }
static string ser(unsigned long v) { return to_string(v); }
static string ser(double v) { ostringstream s; s << setprecision(12) << v; return s.str(); }
static string ser(bool v) { return v ? "true" : "false"; }
static string ser(char c) { return jsonEscape(string(1, c)); }
static string ser(const string& v) { return jsonEscape(v); }
static string ser(const char* v) { return jsonEscape(string(v)); }
static string ser(ListNode* h) {
    string o = "["; set<ListNode*> seen; bool first = true;
    for (ListNode* n = h; n && !seen.count(n); n = n->next) { seen.insert(n); o += (first ? "" : ",") + to_string(n->val); first = false; }
    return o + "]";
}
static string ser(TreeNode* r) {
    vector<string> out; queue<TreeNode*> q; q.push(r);
    while (!q.empty()) { TreeNode* n = q.front(); q.pop(); if (n) { out.push_back(to_string(n->val)); q.push(n->left); q.push(n->right); } else out.push_back("null"); }
    while (!out.empty() && out.back() == "null") out.pop_back();
    string o = "["; for (size_t i = 0; i < out.size(); i++) o += (i ? "," : "") + out[i]; return o + "]";
}
template <class T> static string ser(const vector<T>& v) {
    string o = "["; for (size_t i = 0; i < v.size(); i++) { o += (i ? "," : ""); o += ser((T)v[i]); } return o + "]";
}
`;

/** Full C++ source that runs every case of `spec` against `userCode` */
export function buildCppProgram(userCode, spec) {
  const parts = [PRELUDE];
  if (!/struct\s+ListNode\s*\{/.test(userCode)) parts.push(LIST_NODE);
  if (!/struct\s+TreeNode\s*\{/.test(userCode)) parts.push(TREE_NODE);
  parts.push(HELPERS, `\n${USER_CODE_MARKER}\n`, userCode, '\n// ── Test runner ──\nint main() {\n    ios::sync_with_stdio(true);\n');

  spec.cases.forEach((c, i) => {
    const lines = [];
    if (spec.mode === 'design') {
      lines.push(`vector<string> out; ${spec.className}* obj = nullptr;`);
      c.ops.forEach((op, j) => {
        if (j === 0) {
          const args = c.args[0].map((v, k) => literal(metaToCpp(spec.ctorParams[k]), v));
          lines.push(`obj = new ${spec.className}(${args.join(', ')}); out.push_back("null");`);
          return;
        }
        const m = spec.methods[op];
        if (!m) throw new UnsupportedProblemError(`Unknown operation ${op}`);
        const args = c.args[j].map((v, k) => literal(metaToCpp(m.params[k]), v));
        lines.push(m.returnsVoid
          ? `obj->${op}(${args.join(', ')}); out.push_back("null");`
          : `out.push_back(ser(obj->${op}(${args.join(', ')})));`);
      });
      lines.push('string o = "["; for (size_t k = 0; k < out.size(); k++) o += (k ? "," : "") + out[k]; o += "]";');
      lines.push(`cout << "@@CASE ${i} OUT@@" << o << endl;`);
    } else {
      const firstList = c.args.findIndex((a) => a.kind === 'list');
      c.args.forEach((a, k) => {
        const type = bareType(a.codeType) || metaToCpp(a.type);
        if (a.kind === 'treeRef') {
          lines.push(`TreeNode* a${k} = findNode(a${a.refIndex}, ${Number(a.value)});`);
        } else if (a.kind === 'list' && k === firstList && c.cyclePos >= 0) {
          lines.push(`ListNode* a${k} = buildList(vector<int>{${(a.value || []).join(', ')}}, ${c.cyclePos});`);
        } else {
          lines.push(`${type} a${k} = ${literal(type, a.value)};`);
        }
      });
      const call = `Solution().${spec.fnName}(${c.args.map((_, k) => `a${k}`).join(', ')})`;
      if (spec.inPlaceIndex !== null && spec.inPlaceIndex !== undefined) {
        lines.push(`${call};`, `cout << "@@CASE ${i} OUT@@" << ser(a${spec.inPlaceIndex}) << endl;`);
      } else {
        lines.push(`auto r = ${call};`, `cout << "@@CASE ${i} OUT@@" << ser(r) << endl;`);
      }
    }
    parts.push(
      `    cout << "@@CASE ${i} BEGIN@@" << endl;\n`,
      `    { auto t0 = chrono::steady_clock::now();\n      try {\n`,
      lines.map((l) => `        ${l}\n`).join(''),
      `      } catch (const exception& e) { cout << "@@CASE ${i} ERR@@" << e.what() << endl; }\n`,
      `      catch (...) { cout << "@@CASE ${i} ERR@@Unknown exception" << endl; }\n`,
      `      cout << "@@CASE ${i} MS@@" << chrono::duration<double, milli>(chrono::steady_clock::now() - t0).count() << endl; }\n`,
    );
  });

  parts.push('    return 0;\n}\n');
  return parts.join('');
}
