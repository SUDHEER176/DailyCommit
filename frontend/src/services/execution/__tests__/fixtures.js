// Problems covering every input shape the harness supports, each with LeetCode's metaData,
// the starter code per language, a correct solution per language, and test cases.

const fn = (name, params, ret, extra = {}) => ({ name, params: params.map(([n, type]) => ({ name: n, type })), return: { type: ret }, ...extra });

export const PROBLEMS = {
  twoSum: {
    title: 'Two Sum',
    meta: fn('twoSum', [['nums', 'integer[]'], ['target', 'integer']], 'integer[]'),
    starterTemplates: {
      javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};',
      python: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}',
    },
    solutions: {
      javascript: 'var twoSum = function(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];\n    seen.set(nums[i], i);\n  }\n};',
      python: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        seen = {}\n        for i, n in enumerate(nums):\n            if target - n in seen:\n                return [seen[target - n], i]\n            seen[n] = i',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < (int)nums.size(); i++) {\n            if (seen.count(target - nums[i])) return {seen[target - nums[i]], i};\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            if (seen.containsKey(target - nums[i])) return new int[]{seen.get(target - nums[i]), i};\n            seen.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}',
    },
    // One case in the backend's `args` form, one in the statement's named form
    testCases: [
      { input: 'nums = [2,7,11,15]\ntarget = 9', args: ['[2,7,11,15]', '9'], expected: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', expected: '[1,2]' },
      { input: 'nums = [-3,4,3,90], target = 0', expected: '[0,2]' },
    ],
  },

  reverseList: {
    title: 'Reverse Linked List',
    meta: fn('reverseList', [['head', 'ListNode']], 'ListNode'),
    starterTemplates: {
      javascript: '/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    \n};',
      python: 'class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ',
      cpp: 'class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};',
      java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}',
    },
    solutions: {
      javascript: 'var reverseList = function(head) {\n  let prev = null;\n  while (head) { const next = head.next; head.next = prev; prev = head; head = next; }\n  return prev;\n};',
      python: 'class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        prev = None\n        while head:\n            head.next, prev, head = prev, head, head.next\n        return prev',
      cpp: 'class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        ListNode* prev = nullptr;\n        while (head) { ListNode* next = head->next; head->next = prev; prev = head; head = next; }\n        return prev;\n    }\n};',
      java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        ListNode prev = null;\n        while (head != null) { ListNode next = head.next; head.next = prev; prev = head; head = next; }\n        return prev;\n    }\n}',
    },
    testCases: [
      { args: ['[1,2,3,4,5]'], expected: '[5,4,3,2,1]' },
      { args: ['[1,2]'], expected: '[2,1]' },
      { args: ['[]'], expected: '[]' },
    ],
  },

  maxDepth: {
    title: 'Maximum Depth of Binary Tree',
    meta: fn('maxDepth', [['root', 'TreeNode']], 'integer'),
    starterTemplates: {
      javascript: '/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar maxDepth = function(root) {\n    \n};',
      python: 'class Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        ',
      cpp: 'class Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        \n    }\n};',
      java: 'class Solution {\n    public int maxDepth(TreeNode root) {\n        \n    }\n}',
    },
    solutions: {
      javascript: 'var maxDepth = function(root) {\n  return root ? 1 + Math.max(maxDepth(root.left), maxDepth(root.right)) : 0;\n};',
      python: 'class Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right)) if root else 0',
      cpp: 'class Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        return root ? 1 + max(maxDepth(root->left), maxDepth(root->right)) : 0;\n    }\n};',
      java: 'class Solution {\n    public int maxDepth(TreeNode root) {\n        return root == null ? 0 : 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n    }\n}',
    },
    testCases: [
      { args: ['[3,9,20,null,null,15,7]'], expected: '3' },
      { args: ['[1,null,2]'], expected: '2' },
      { args: ['[]'], expected: '0' },
    ],
  },

  hasCycle: {
    title: 'Linked List Cycle',
    // `pos` is in the test case but not a parameter of the method: it places the cycle
    meta: fn('hasCycle', [['head', 'ListNode']], 'boolean'),
    starterTemplates: {
      javascript: '/**\n * @param {ListNode} head\n * @return {boolean}\n */\nvar hasCycle = function(head) {\n    \n};',
      python: 'class Solution:\n    def hasCycle(self, head: Optional[ListNode]) -> bool:\n        ',
      cpp: 'class Solution {\npublic:\n    bool hasCycle(ListNode *head) {\n        \n    }\n};',
      java: 'public class Solution {\n    public boolean hasCycle(ListNode head) {\n        \n    }\n}',
    },
    solutions: {
      javascript: 'var hasCycle = function(head) {\n  let slow = head, fast = head;\n  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; if (slow === fast) return true; }\n  return false;\n};',
      python: 'class Solution:\n    def hasCycle(self, head: Optional[ListNode]) -> bool:\n        slow = fast = head\n        while fast and fast.next:\n            slow, fast = slow.next, fast.next.next\n            if slow is fast:\n                return True\n        return False',
      cpp: 'class Solution {\npublic:\n    bool hasCycle(ListNode *head) {\n        ListNode *slow = head, *fast = head;\n        while (fast && fast->next) { slow = slow->next; fast = fast->next->next; if (slow == fast) return true; }\n        return false;\n    }\n};',
      java: 'public class Solution {\n    public boolean hasCycle(ListNode head) {\n        ListNode slow = head, fast = head;\n        while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; if (slow == fast) return true; }\n        return false;\n    }\n}',
    },
    testCases: [
      { input: 'head = [3,2,0,-4], pos = 1', expected: 'true' },
      { input: 'head = [1,2], pos = 0', expected: 'true' },
      { input: 'head = [1], pos = -1', expected: 'false' },
    ],
  },

  mergeKLists: {
    title: 'Merge k Sorted Lists',
    meta: fn('mergeKLists', [['lists', 'ListNode[]']], 'ListNode'),
    starterTemplates: {
      javascript: '/**\n * @param {ListNode[]} lists\n * @return {ListNode}\n */\nvar mergeKLists = function(lists) {\n    \n};',
      python: 'class Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        ',
      cpp: 'class Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        \n    }\n};',
      java: 'class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        \n    }\n}',
    },
    solutions: {
      javascript: 'var mergeKLists = function(lists) {\n  const vals = [];\n  for (let l of lists) for (; l; l = l.next) vals.push(l.val);\n  vals.sort((a, b) => a - b);\n  let head = null;\n  for (let i = vals.length - 1; i >= 0; i--) head = new ListNode(vals[i], head);\n  return head;\n};',
      python: 'class Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        vals = []\n        for l in lists:\n            while l:\n                vals.append(l.val); l = l.next\n        head = None\n        for v in sorted(vals, reverse=True):\n            head = ListNode(v, head)\n        return head',
      cpp: 'class Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        vector<int> vals;\n        for (ListNode* l : lists) for (; l; l = l->next) vals.push_back(l->val);\n        sort(vals.rbegin(), vals.rend());\n        ListNode* head = nullptr;\n        for (int v : vals) head = new ListNode(v, head);\n        return head;\n    }\n};',
      java: 'class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        List<Integer> vals = new ArrayList<>();\n        for (ListNode l : lists) for (; l != null; l = l.next) vals.add(l.val);\n        vals.sort(Collections.reverseOrder());\n        ListNode head = null;\n        for (int v : vals) head = new ListNode(v, head);\n        return head;\n    }\n}',
    },
    testCases: [
      { args: ['[[1,4,5],[1,3,4],[2,6]]'], expected: '[1,1,2,3,4,4,5,6]' },
      { args: ['[]'], expected: '[]' },
      { args: ['[[]]'], expected: '[]' },
    ],
  },

  minStack: {
    title: 'Min Stack',
    meta: {
      classname: 'MinStack',
      constructor: { params: [] },
      methods: [
        fn('push', [['val', 'integer']], 'void'),
        fn('pop', [], 'void'),
        fn('top', [], 'integer'),
        fn('getMin', [], 'integer'),
      ],
    },
    starterTemplates: {},
    solutions: {
      javascript: 'class MinStack {\n  constructor() { this.s = []; }\n  push(v) { this.s.push([v, this.s.length ? Math.min(v, this.getMin()) : v]); }\n  pop() { this.s.pop(); }\n  top() { return this.s[this.s.length - 1][0]; }\n  getMin() { return this.s[this.s.length - 1][1]; }\n}',
      python: 'class MinStack:\n    def __init__(self):\n        self.s = []\n    def push(self, val: int) -> None:\n        self.s.append((val, min(val, self.s[-1][1]) if self.s else val))\n    def pop(self) -> None:\n        self.s.pop()\n    def top(self) -> int:\n        return self.s[-1][0]\n    def getMin(self) -> int:\n        return self.s[-1][1]',
      cpp: 'class MinStack {\n    vector<pair<int, int>> s;\npublic:\n    MinStack() {}\n    void push(int val) { s.push_back({val, s.empty() ? val : min(val, s.back().second)}); }\n    void pop() { s.pop_back(); }\n    int top() { return s.back().first; }\n    int getMin() { return s.back().second; }\n};',
      java: 'class MinStack {\n    private Deque<int[]> s = new ArrayDeque<>();\n    public MinStack() {}\n    public void push(int val) { s.push(new int[]{val, s.isEmpty() ? val : Math.min(val, s.peek()[1])}); }\n    public void pop() { s.pop(); }\n    public int top() { return s.peek()[0]; }\n    public int getMin() { return s.peek()[1]; }\n}',
    },
    testCases: [
      {
        args: ['["MinStack","push","push","push","getMin","pop","top","getMin"]', '[[],[-2],[0],[-3],[],[],[],[]]'],
        expected: '[null,null,null,null,-3,null,0,-2]',
      },
    ],
  },

  reverseString: {
    title: 'Reverse String',
    // In place: the answer is the first argument after the call
    meta: fn('reverseString', [['s', 'character[]']], 'void', { output: { paramindex: 0 } }),
    starterTemplates: {
      javascript: '/**\n * @param {character[]} s\n * @return {void} Do not return anything, modify s in-place instead.\n */\nvar reverseString = function(s) {\n    \n};',
      python: 'class Solution:\n    def reverseString(self, s: List[str]) -> None:\n        ',
      cpp: 'class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        \n    }\n};',
      java: 'class Solution {\n    public void reverseString(char[] s) {\n        \n    }\n}',
    },
    solutions: {
      javascript: 'var reverseString = function(s) { s.reverse(); };',
      python: 'class Solution:\n    def reverseString(self, s: List[str]) -> None:\n        s.reverse()',
      cpp: 'class Solution {\npublic:\n    void reverseString(vector<char>& s) { reverse(s.begin(), s.end()); }\n};',
      java: 'class Solution {\n    public void reverseString(char[] s) {\n        for (int i = 0, j = s.length - 1; i < j; i++, j--) { char t = s[i]; s[i] = s[j]; s[j] = t; }\n    }\n}',
    },
    testCases: [
      { args: ['["h","e","l","l","o"]'], expected: '["o","l","l","e","h"]' },
      { args: ['["H","a","n","n","a","h"]'], expected: '["h","a","n","n","a","H"]' },
    ],
  },

  lowestCommonAncestor: {
    title: 'Lowest Common Ancestor of a Binary Search Tree',
    // p and q are given as values; the method takes the nodes holding them
    meta: fn('lowestCommonAncestor', [['root', 'TreeNode'], ['p', 'TreeNode'], ['q', 'TreeNode']], 'TreeNode'),
    starterTemplates: {
      javascript: '/**\n * @param {TreeNode} root\n * @param {TreeNode} p\n * @param {TreeNode} q\n * @return {TreeNode}\n */\nvar lowestCommonAncestor = function(root, p, q) {\n    \n};',
      python: "class Solution:\n    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':\n        ",
      cpp: 'class Solution {\npublic:\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        \n    }\n};',
      java: 'class Solution {\n    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {\n        \n    }\n}',
    },
    solutions: {
      javascript: 'var lowestCommonAncestor = function(root, p, q) {\n  while (root) {\n    if (p.val < root.val && q.val < root.val) root = root.left;\n    else if (p.val > root.val && q.val > root.val) root = root.right;\n    else return root;\n  }\n};',
      python: "class Solution:\n    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':\n        while root:\n            if p.val < root.val and q.val < root.val:\n                root = root.left\n            elif p.val > root.val and q.val > root.val:\n                root = root.right\n            else:\n                return root",
      cpp: 'class Solution {\npublic:\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        while (root) {\n            if (p->val < root->val && q->val < root->val) root = root->left;\n            else if (p->val > root->val && q->val > root->val) root = root->right;\n            else return root;\n        }\n        return nullptr;\n    }\n};',
      java: 'class Solution {\n    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {\n        while (root != null) {\n            if (p.val < root.val && q.val < root.val) root = root.left;\n            else if (p.val > root.val && q.val > root.val) root = root.right;\n            else return root;\n        }\n        return null;\n    }\n}',
    },
    testCases: [
      { args: ['[6,2,8,0,4,7,9,null,null,3,5]', '2', '8'], expected: '6' },
      { args: ['[6,2,8,0,4,7,9,null,null,3,5]', '2', '4'], expected: '2' },
    ],
  },
};

/** A problem object shaped like the editor's (meta, starter templates, statement) */
export const problemFor = (key, extra = {}) => {
  const p = PROBLEMS[key];
  return { title: p.title, meta: p.meta, starterTemplates: p.starterTemplates, contentHtml: '', ...extra };
};
