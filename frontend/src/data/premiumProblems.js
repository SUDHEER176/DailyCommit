// Problems that are LeetCode Premium. LeetCode's API returns no statement for them without a paid
// login, so these are written here in our own words, with starter code, examples, extra cases for
// Submit, and the types the runners need (same shape as the backend's /details response).
//
// Test cases: `args` holds one JSON value per parameter, `expected` the answer as JSON.
// Where several answers could be right (Alien Dictionary), every case has exactly one.

const INF = 2147483647;

const html = ({ statement, examples, constraints, note }) => [
  statement,
  ...examples.map((ex, i) => `<p><strong class="example">Example ${i + 1}:</strong></p>\n<pre><strong>Input:</strong> ${ex.input}\n<strong>Output:</strong> ${ex.output}${ex.why ? `\n<strong>Explanation:</strong> ${ex.why}` : ''}</pre>`),
  `<p><strong>Constraints:</strong></p>\n<ul>${constraints.map((c) => `<li>${c}</li>`).join('')}</ul>`,
  note ? `<p>${note}</p>` : '',
].join('\n\n');

/** Build test cases from [args, expected] pairs, labelling inputs with the parameter names */
const cases = (names, rows, startId = 1) => rows.map(([args, expected], i) => ({
  id: startId + i,
  args: args.map((a) => JSON.stringify(a)),
  input: args.map((a, j) => `${names[j]} = ${JSON.stringify(a)}`).join('\n'),
  expected: JSON.stringify(expected),
}));

const premium = (p) => ({ ...p, authored: true, premium: true });

export const PREMIUM_PROBLEMS = {
  'nc-271': premium({
    id: 'nc-271',
    number: 271,
    title: 'Encode and Decode Strings',
    difficulty: 'Medium',
    contentHtml: html({
      statement: `<p>Write two functions. <code>encode</code> turns a list of strings into one string, and <code>decode</code> turns that string back into the original list.</p>
<p>The strings can contain any character, including the ones you might want to use as separators, so a plain join on a delimiter isn't enough. Your <code>decode</code> must return exactly the list that was passed to <code>encode</code>, in the same order.</p>
<p>The checker calls <code>decode(encode(strs))</code> and compares the result with <code>strs</code>.</p>`,
      examples: [
        { input: 'strs = ["neet","code","love","you"]', output: '["neet","code","love","you"]', why: 'One possible encoding is "4#neet4#code4#love3#you". Decoding it gives the list back.' },
        { input: 'strs = ["we","say",":","yes"]', output: '["we","say",":","yes"]' },
      ],
      constraints: ['<code>0 &lt;= strs.length &lt; 100</code>', '<code>0 &lt;= strs[i].length &lt; 200</code>', '<code>strs[i]</code> can contain any of the 256 ASCII characters'],
      note: 'Follow-up: can you do it without escaping characters, in one pass each way?',
    }),
    starterTemplates: {
      javascript: `/**\n * Encodes a list of strings to a single string.\n * @param {string[]} strs\n * @return {string}\n */\nvar encode = function(strs) {\n    \n};\n\n/**\n * Decodes a single string to a list of strings.\n * @param {string} s\n * @return {string[]}\n */\nvar decode = function(s) {\n    \n};`,
      python: `class Solution:\n    def encode(self, strs: List[str]) -> str:\n        pass\n\n    def decode(self, s: str) -> List[str]:\n        pass`,
      cpp: `class Solution {\npublic:\n    string encode(vector<string>& strs) {\n        \n    }\n\n    vector<string> decode(string s) {\n        \n    }\n};`,
      java: `class Solution {\n    public String encode(List<String> strs) {\n        \n    }\n\n    public List<String> decode(String s) {\n        \n    }\n}`,
    },
    meta: { name: 'encode', pipe: ['encode', 'decode'], params: [{ name: 'strs', type: 'string[]' }], return: { type: 'string[]' } },
    sampleTestCases: cases(['strs'], [
      [[['neet', 'code', 'love', 'you']], ['neet', 'code', 'love', 'you']],
      [[['we', 'say', ':', 'yes']], ['we', 'say', ':', 'yes']],
    ]),
    hiddenTestCases: cases(['strs'], [
      [[[]], []],
      [[['']], ['']],
      [[['', '', '']], ['', '', '']],
      [[['4#abcd', '#', '##', 'x']], ['4#abcd', '#', '##', 'x']],
      [[['a,b', 'c;d', ' ', '1:2:3']], ['a,b', 'c;d', ' ', '1:2:3']],
    ], 3),
  }),

  'nc-252': premium({
    id: 'nc-252',
    number: 252,
    title: 'Meeting Rooms',
    difficulty: 'Easy',
    contentHtml: html({
      statement: `<p>You're given a list of meeting times <code>intervals</code>, where <code>intervals[i] = [start<sub>i</sub>, end<sub>i</sub>]</code>. Return <code>true</code> if one person could attend every meeting, meaning no two meetings overlap.</p>
<p>A meeting that ends at the moment another starts doesn't overlap it: <code>[1,5]</code> and <code>[5,8]</code> can both be attended.</p>`,
      examples: [
        { input: 'intervals = [[0,30],[5,10],[15,20]]', output: 'false', why: '[0,30] overlaps both other meetings.' },
        { input: 'intervals = [[7,10],[2,4]]', output: 'true' },
      ],
      constraints: ['<code>0 &lt;= intervals.length &lt;= 10<sup>4</sup></code>', '<code>intervals[i].length == 2</code>', '<code>0 &lt;= start<sub>i</sub> &lt; end<sub>i</sub> &lt;= 10<sup>6</sup></code>'],
    }),
    starterTemplates: {
      javascript: `/**\n * @param {number[][]} intervals\n * @return {boolean}\n */\nvar canAttendMeetings = function(intervals) {\n    \n};`,
      python: `class Solution:\n    def canAttendMeetings(self, intervals: List[List[int]]) -> bool:\n        pass`,
      cpp: `class Solution {\npublic:\n    bool canAttendMeetings(vector<vector<int>>& intervals) {\n        \n    }\n};`,
      java: `class Solution {\n    public boolean canAttendMeetings(int[][] intervals) {\n        \n    }\n}`,
    },
    meta: { name: 'canAttendMeetings', params: [{ name: 'intervals', type: 'integer[][]' }], return: { type: 'boolean' } },
    sampleTestCases: cases(['intervals'], [
      [[[[0, 30], [5, 10], [15, 20]]], false],
      [[[[7, 10], [2, 4]]], true],
    ]),
    hiddenTestCases: cases(['intervals'], [
      [[[]], true],
      [[[[1, 5], [5, 8]]], true],
      [[[[1, 2], [2, 3], [1, 3]]], false],
      [[[[5, 8], [6, 7]]], false],
    ], 3),
  }),

  'nc-253': premium({
    id: 'nc-253',
    number: 253,
    title: 'Meeting Rooms II',
    difficulty: 'Medium',
    contentHtml: html({
      statement: `<p>You're given a list of meeting times <code>intervals</code>, where <code>intervals[i] = [start<sub>i</sub>, end<sub>i</sub>]</code>. Return the smallest number of rooms needed so that every meeting has a room for its whole length.</p>
<p>A room is free again at the moment its meeting ends, so <code>[1,5]</code> and <code>[5,8]</code> can share one room.</p>`,
      examples: [
        { input: 'intervals = [[0,30],[5,10],[15,20]]', output: '2', why: '[0,30] needs its own room; [5,10] and [15,20] can share the second.' },
        { input: 'intervals = [[7,10],[2,4]]', output: '1' },
      ],
      constraints: ['<code>0 &lt;= intervals.length &lt;= 10<sup>4</sup></code>', '<code>0 &lt;= start<sub>i</sub> &lt; end<sub>i</sub> &lt;= 10<sup>6</sup></code>'],
    }),
    starterTemplates: {
      javascript: `/**\n * @param {number[][]} intervals\n * @return {number}\n */\nvar minMeetingRooms = function(intervals) {\n    \n};`,
      python: `class Solution:\n    def minMeetingRooms(self, intervals: List[List[int]]) -> int:\n        pass`,
      cpp: `class Solution {\npublic:\n    int minMeetingRooms(vector<vector<int>>& intervals) {\n        \n    }\n};`,
      java: `class Solution {\n    public int minMeetingRooms(int[][] intervals) {\n        \n    }\n}`,
    },
    meta: { name: 'minMeetingRooms', params: [{ name: 'intervals', type: 'integer[][]' }], return: { type: 'integer' } },
    sampleTestCases: cases(['intervals'], [
      [[[[0, 30], [5, 10], [15, 20]]], 2],
      [[[[7, 10], [2, 4]]], 1],
    ]),
    hiddenTestCases: cases(['intervals'], [
      [[[]], 0],
      [[[[1, 5], [5, 8]]], 1],
      [[[[1, 10], [2, 9], [3, 8]]], 3],
      [[[[1, 3], [2, 6], [8, 10], [9, 12], [11, 13]]], 2],
    ], 3),
  }),

  'nc-286': premium({
    id: 'nc-286',
    number: 286,
    title: 'Walls and Gates',
    difficulty: 'Medium',
    contentHtml: html({
      statement: `<p>You're given an <code>m x n</code> grid <code>rooms</code> where each cell is one of:</p>
<ul><li><code>-1</code>, a wall</li><li><code>0</code>, a gate</li><li><code>2147483647</code> (<code>INF</code>), an empty room</li></ul>
<p>Fill each empty room with the number of steps to its nearest gate, moving up, down, left or right and never through walls. A room that can't reach any gate stays <code>INF</code>.</p>
<p>Change <code>rooms</code> in place; nothing is returned.</p>`,
      examples: [
        { input: `rooms = [[${INF},-1,0,${INF}],[${INF},${INF},${INF},-1],[${INF},-1,${INF},-1],[0,-1,${INF},${INF}]]`, output: '[[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]' },
        { input: 'rooms = [[-1]]', output: '[[-1]]' },
      ],
      constraints: ['<code>1 &lt;= m, n &lt;= 250</code>', '<code>rooms[i][j]</code> is <code>-1</code>, <code>0</code> or <code>2147483647</code>'],
    }),
    starterTemplates: {
      javascript: `/**\n * @param {number[][]} rooms\n * @return {void} Do not return anything, modify rooms in place.\n */\nvar wallsAndGates = function(rooms) {\n    \n};`,
      python: `class Solution:\n    def wallsAndGates(self, rooms: List[List[int]]) -> None:\n        """\n        Do not return anything, modify rooms in-place instead.\n        """\n        pass`,
      cpp: `class Solution {\npublic:\n    void wallsAndGates(vector<vector<int>>& rooms) {\n        \n    }\n};`,
      java: `class Solution {\n    public void wallsAndGates(int[][] rooms) {\n        \n    }\n}`,
    },
    meta: { name: 'wallsAndGates', params: [{ name: 'rooms', type: 'integer[][]' }], return: { type: 'void' }, output: { paramindex: 0 } },
    sampleTestCases: cases(['rooms'], [
      [[[[INF, -1, 0, INF], [INF, INF, INF, -1], [INF, -1, INF, -1], [0, -1, INF, INF]]], [[3, -1, 0, 1], [2, 2, 1, -1], [1, -1, 2, -1], [0, -1, 3, 4]]],
      [[[[-1]]], [[-1]]],
    ]),
    hiddenTestCases: cases(['rooms'], [
      [[[[0, INF], [INF, INF]]], [[0, 1], [1, 2]]],
      [[[[INF]]], [[INF]]],
      [[[[0, -1, INF]]], [[0, -1, INF]]],
      [[[[INF, INF, 0], [INF, -1, INF], [0, INF, INF]]], [[2, 1, 0], [1, -1, 1], [0, 1, 2]]],
    ], 3),
  }),

  'nc-323': premium({
    id: 'nc-323',
    number: 323,
    title: 'Number of Connected Components in an Undirected Graph',
    difficulty: 'Medium',
    contentHtml: html({
      statement: `<p>There are <code>n</code> nodes labelled <code>0</code> to <code>n - 1</code>, and a list <code>edges</code> where <code>edges[i] = [a<sub>i</sub>, b<sub>i</sub>]</code> joins nodes <code>a<sub>i</sub></code> and <code>b<sub>i</sub></code> in an undirected graph.</p>
<p>Return how many connected components the graph has. A node with no edges is a component on its own.</p>`,
      examples: [
        { input: 'n = 5, edges = [[0,1],[1,2],[3,4]]', output: '2', why: '{0, 1, 2} and {3, 4}.' },
        { input: 'n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]', output: '1' },
      ],
      constraints: ['<code>1 &lt;= n &lt;= 2000</code>', '<code>0 &lt;= edges.length &lt;= 5000</code>', '<code>0 &lt;= a<sub>i</sub>, b<sub>i</sub> &lt; n</code>, <code>a<sub>i</sub> != b<sub>i</sub></code>', 'No edge appears twice'],
    }),
    starterTemplates: {
      javascript: `/**\n * @param {number} n\n * @param {number[][]} edges\n * @return {number}\n */\nvar countComponents = function(n, edges) {\n    \n};`,
      python: `class Solution:\n    def countComponents(self, n: int, edges: List[List[int]]) -> int:\n        pass`,
      cpp: `class Solution {\npublic:\n    int countComponents(int n, vector<vector<int>>& edges) {\n        \n    }\n};`,
      java: `class Solution {\n    public int countComponents(int n, int[][] edges) {\n        \n    }\n}`,
    },
    meta: { name: 'countComponents', params: [{ name: 'n', type: 'integer' }, { name: 'edges', type: 'integer[][]' }], return: { type: 'integer' } },
    sampleTestCases: cases(['n', 'edges'], [
      [[5, [[0, 1], [1, 2], [3, 4]]], 2],
      [[5, [[0, 1], [1, 2], [2, 3], [3, 4]]], 1],
    ]),
    hiddenTestCases: cases(['n', 'edges'], [
      [[3, []], 3],
      [[4, [[0, 1], [2, 3], [1, 2]]], 1],
      [[6, [[0, 1], [2, 3], [4, 5]]], 3],
      [[1, []], 1],
    ], 3),
  }),

  'nc-261': premium({
    id: 'nc-261',
    number: 261,
    title: 'Graph Valid Tree',
    difficulty: 'Medium',
    contentHtml: html({
      statement: `<p>There are <code>n</code> nodes labelled <code>0</code> to <code>n - 1</code>, and a list of undirected <code>edges</code> where <code>edges[i] = [a<sub>i</sub>, b<sub>i</sub>]</code>.</p>
<p>Return <code>true</code> if these edges form a valid tree: every node is connected, and there are no cycles.</p>`,
      examples: [
        { input: 'n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]', output: 'true' },
        { input: 'n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]', output: 'false', why: '1, 2 and 3 form a cycle.' },
      ],
      constraints: ['<code>1 &lt;= n &lt;= 2000</code>', '<code>0 &lt;= edges.length &lt;= 5000</code>', '<code>0 &lt;= a<sub>i</sub>, b<sub>i</sub> &lt; n</code>, <code>a<sub>i</sub> != b<sub>i</sub></code>', 'No edge appears twice'],
    }),
    starterTemplates: {
      javascript: `/**\n * @param {number} n\n * @param {number[][]} edges\n * @return {boolean}\n */\nvar validTree = function(n, edges) {\n    \n};`,
      python: `class Solution:\n    def validTree(self, n: int, edges: List[List[int]]) -> bool:\n        pass`,
      cpp: `class Solution {\npublic:\n    bool validTree(int n, vector<vector<int>>& edges) {\n        \n    }\n};`,
      java: `class Solution {\n    public boolean validTree(int n, int[][] edges) {\n        \n    }\n}`,
    },
    meta: { name: 'validTree', params: [{ name: 'n', type: 'integer' }, { name: 'edges', type: 'integer[][]' }], return: { type: 'boolean' } },
    sampleTestCases: cases(['n', 'edges'], [
      [[5, [[0, 1], [0, 2], [0, 3], [1, 4]]], true],
      [[5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]], false],
    ]),
    hiddenTestCases: cases(['n', 'edges'], [
      [[1, []], true],
      [[4, [[0, 1], [2, 3]]], false],
      [[2, [[1, 0]]], true],
      [[3, [[0, 1], [1, 2], [2, 0]]], false],
    ], 3),
  }),

  'nc-269': premium({
    id: 'nc-269',
    number: 269,
    title: 'Alien Dictionary',
    difficulty: 'Hard',
    contentHtml: html({
      statement: `<p>An alien language uses lowercase English letters in an unknown order. You're given a list <code>words</code> from its dictionary, already sorted in that language's order.</p>
<p>Return a string of every letter that appears in <code>words</code>, in an order consistent with the sorting. If no order works (the list contradicts itself, or a word comes before its own prefix), return <code>""</code>.</p>
<p>Word order is decided by the first letter where two words differ. If one word is a prefix of the other, the shorter word comes first.</p>`,
      examples: [
        { input: 'words = ["wrt","wrf","er","ett","rftt"]', output: '"wertf"' },
        { input: 'words = ["z","x"]', output: '"zx"' },
        { input: 'words = ["z","x","z"]', output: '""', why: 'z comes before x and after it, which is impossible.' },
      ],
      constraints: ['<code>1 &lt;= words.length &lt;= 100</code>', '<code>1 &lt;= words[i].length &lt;= 100</code>', '<code>words[i]</code> has only lowercase English letters'],
      note: 'Every test here has exactly one valid order, so your answer is compared with it directly.',
    }),
    starterTemplates: {
      javascript: `/**\n * @param {string[]} words\n * @return {string}\n */\nvar alienOrder = function(words) {\n    \n};`,
      python: `class Solution:\n    def alienOrder(self, words: List[str]) -> str:\n        pass`,
      cpp: `class Solution {\npublic:\n    string alienOrder(vector<string>& words) {\n        \n    }\n};`,
      java: `class Solution {\n    public String alienOrder(String[] words) {\n        \n    }\n}`,
    },
    meta: { name: 'alienOrder', params: [{ name: 'words', type: 'string[]' }], return: { type: 'string' } },
    sampleTestCases: cases(['words'], [
      [[['wrt', 'wrf', 'er', 'ett', 'rftt']], 'wertf'],
      [[['z', 'x']], 'zx'],
      [[['z', 'x', 'z']], ''],
    ]),
    hiddenTestCases: cases(['words'], [
      [[['abc', 'ab']], ''],
      [[['z', 'z']], 'z'],
      [[['ba', 'bc', 'ac', 'cab']], 'bac'],
    ], 4),
  }),
};

/** Our own version of a Premium problem, by planner id or LeetCode number */
export function getPremiumProblem(problem) {
  if (!problem) return null;
  return PREMIUM_PROBLEMS[problem.id] || (problem.number ? PREMIUM_PROBLEMS[`nc-${problem.number}`] : null) || null;
}
