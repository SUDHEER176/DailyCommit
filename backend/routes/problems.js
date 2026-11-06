import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDb } from '../data/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '../data/problem_cache.json');

function getCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.warn("Failed to write problem_cache.json", e);
  }
}

const router = express.Router();

// GET /api/problems/details/:slug (Fetches full official LeetCode statement, snippets, testcases)
router.get('/details/:slug', async (req, res) => {
  let rawSlug = req.params.slug.trim().toLowerCase();
  
  if (rawSlug.includes('problems/')) {
    rawSlug = rawSlug.split('problems/')[1].split('/')[0];
  } else {
    rawSlug = rawSlug.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const cache = getCache();
  if (cache[rawSlug]) {
    return res.json({ success: true, data: cache[rawSlug] });
  }

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      body: JSON.stringify({
        query: `query getQuestionDetail($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            questionFrontendId
            title
            difficulty
            content
            sampleTestCase
            codeSnippets {
              langSlug
              code
            }
          }
        }`,
        variables: { titleSlug: rawSlug }
      })
    });

    const json = await response.json();
    const q = json.data?.question;
    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found on LeetCode' });
    }

    // Parse starter templates
    const templates = {};
    if (q.codeSnippets) {
      for (const s of q.codeSnippets) {
        if (s.langSlug === 'javascript') templates.javascript = s.code;
        if (s.langSlug === 'python3' || s.langSlug === 'python') templates.python = s.code;
        if (s.langSlug === 'cpp') templates.cpp = s.code;
        if (s.langSlug === 'java') templates.java = s.code;
      }
    }

    // Parse examples from HTML
    const examples = [];
    if (q.content) {
      const exMatches = [...q.content.matchAll(/<strong class="example">Example (\d+):<\/strong>[\s\S]*?<pre>([\s\S]*?)<\/pre>/gi)];
      for (const match of exMatches) {
        const rawPre = match[2].replace(/<[^>]+>/g, '').trim();
        const inputMatch = rawPre.match(/Input:\s*([\s\S]*?)(?=Output:|$)/i);
        const outputMatch = rawPre.match(/Output:\s*([\s\S]*?)(?=Explanation:|$)/i);
        const explMatch = rawPre.match(/Explanation:\s*([\s\S]*)/i);

        examples.push({
          input: inputMatch ? inputMatch[1].trim() : rawPre,
          output: outputMatch ? outputMatch[1].trim() : '',
          explanation: explMatch ? explMatch[1].trim() : ''
        });
      }
    }

    // Parse constraints
    const constraints = [];
    if (q.content) {
      const cMatch = q.content.match(/<strong>Constraints:<\/strong>[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
      if (cMatch) {
        const lis = [...cMatch[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)];
        for (const li of lis) {
          constraints.push(li[1].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim());
        }
      }
    }

    // Sample test cases
    const sampleTestCases = [];
    let jsFnName = '';
    if (templates.javascript) {
      const fnMatch = templates.javascript.match(/(?:var|const|let)\s+([a-zA-Z0-9_$]+)\s*=\s*function/) ||
                      templates.javascript.match(/function\s+([a-zA-Z0-9_$]+)\s*\(/);
      if (fnMatch) jsFnName = fnMatch[1];
    }
    let pyFnName = '';
    if (templates.python) {
      const pyMatch = templates.python.match(/def\s+([a-zA-Z0-9_$]+)\s*\(self/);
      if (pyMatch) pyFnName = pyMatch[1];
    }

    if (examples.length > 0) {
      examples.forEach((ex, i) => {
        let cleanArgs = (ex.input || '').replace(/(?:^|\n|,)\s*[a-zA-Z0-9_$]+\s*=\s*/g, (m) => m.startsWith(',') ? ', ' : '').trim();
        let pyArgs = cleanArgs.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None');
        sampleTestCases.push({
          id: i + 1,
          input: ex.input,
          expected: ex.output,
          fnCallJs: jsFnName ? `${jsFnName}(${cleanArgs})` : undefined,
          fnCallPy: pyFnName ? `Solution().${pyFnName}(${pyArgs})` : undefined
        });
      });
    } else if (q.sampleTestCase) {
      sampleTestCases.push({
        id: 1,
        input: q.sampleTestCase,
        expected: "Expected output"
      });
    }

    const problemData = {
      id: `nc-${q.questionFrontendId || rawSlug}`,
      number: q.questionFrontendId ? Number(q.questionFrontendId) : undefined,
      title: q.title,
      difficulty: q.difficulty,
      contentHtml: q.content,
      starterTemplates: templates,
      examples,
      constraints,
      sampleTestCases,
      hiddenTestCases: []
    };

    cache[rawSlug] = problemData;
    saveCache(cache);

    return res.json({ success: true, data: problemData });
  } catch (err) {
    console.error("Error fetching LeetCode details:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET all problems (with filtering options)
router.get('/', (req, res) => {
  const db = getDb();
  const { topic, difficulty, solveStatus, needsRevision, search } = req.query;
  let problems = db.problems;

  if (topic && topic !== 'All') {
    problems = problems.filter(p => p.topic.toLowerCase() === topic.toLowerCase());
  }

  if (difficulty && difficulty !== 'All') {
    problems = problems.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  if (solveStatus && solveStatus !== 'All') {
    problems = problems.filter(p => p.solveStatus === solveStatus);
  }

  if (needsRevision === 'true') {
    problems = problems.filter(p => p.needsRevision === true);
  }

  if (search) {
    const q = search.toLowerCase();
    problems = problems.filter(p => 
      p.title.toLowerCase().includes(q) || 
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.topic && p.topic.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, count: problems.length, data: problems });
});

// POST create a problem
router.post('/', (req, res) => {
  const { title, platform, difficulty, topic, link, solveStatus, needsRevision, timeSpentMinutes, notes } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Problem title is required' });
  }

  const db = getDb();
  const newProblem = {
    id: `prob-${Date.now()}`,
    title,
    platform: platform || 'LeetCode',
    difficulty: difficulty || 'Medium',
    topic: topic || 'Arrays & Strings',
    link: link || '',
    solveStatus: solveStatus || 'Independently', // Independently, Needed Hint, Looked at Solution
    needsRevision: needsRevision === true || solveStatus === 'Looked at Solution',
    timeSpentMinutes: Number(timeSpentMinutes) || 20,
    notes: notes || '',
    solvedAt: new Date().toISOString()
  };

  db.problems.unshift(newProblem);

  // Update user stats & heatmap for today
  const today = new Date().toISOString().split('T')[0];
  const heatmapDay = db.heatmaps.find(h => h.date === today);
  if (heatmapDay) {
    heatmapDay.count += 1;
  } else {
    db.heatmaps.push({ date: today, count: 1 });
  }

  // Update streak if needed
  if (db.user.lastActiveDate !== today) {
    db.user.streak += 1;
    db.user.lastActiveDate = today;
  }

  saveDb(db);
  res.status(201).json({ success: true, data: newProblem });
});

// PATCH toggle revision status
router.patch('/:id/toggle-revision', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const problem = db.problems.find(p => p.id === id);

  if (!problem) {
    return res.status(404).json({ success: false, message: 'Problem not found' });
  }

  problem.needsRevision = !problem.needsRevision;
  saveDb(db);

  res.json({ success: true, data: problem });
});

// PUT update problem
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const index = db.problems.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Problem not found' });
  }

  db.problems[index] = { ...db.problems[index], ...req.body };
  saveDb(db);

  res.json({ success: true, data: db.problems[index] });
});

// DELETE problem
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const initialLen = db.problems.length;
  db.problems = db.problems.filter(p => p.id !== id);

  if (db.problems.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Problem not found' });
  }

  saveDb(db);
  res.json({ success: true, message: 'Problem deleted successfully' });
});

export default router;
