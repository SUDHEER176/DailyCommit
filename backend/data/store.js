import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AsyncLocalStorage } from 'async_hooks';
import { hasDatabase, ensureSchema, loadState, loadUserState, upsertUserKeys } from './neon.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

// Initial default seed data
const defaultData = {
  user: {
    name: "Alex Learner",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    targetRole: "Software Engineering Intern / SDE-1",
    targetCompany: "FAANG & Top Tier Startups",
    dailyGoal: 3,
    streak: 7,
    lastActiveDate: new Date().toISOString().split('T')[0]
  },
  tasks: [
    {
      id: "task-1",
      title: "Learn Binary Search on Rotated Array",
      topic: "Searching & Sorting",
      estimatedMinutes: 30,
      completed: true,
      date: new Date().toISOString().split('T')[0],
      carriedOver: false,
      priority: "High"
    },
    {
      id: "task-2",
      title: "Solve 3 Two-Pointer Medium Problems",
      topic: "Arrays & Strings",
      estimatedMinutes: 45,
      completed: true,
      date: new Date().toISOString().split('T')[0],
      carriedOver: false,
      priority: "High"
    },
    {
      id: "task-3",
      title: "Revise Yesterday's Mistakes (Stack Monotonic)",
      topic: "Stacks & Queues",
      estimatedMinutes: 15,
      completed: false,
      date: new Date().toISOString().split('T')[0],
      carriedOver: false,
      priority: "Medium"
    },
    {
      id: "task-4",
      title: "Practice Time & Space Complexity Analysis",
      topic: "Basics & Math",
      estimatedMinutes: 20,
      completed: false,
      date: new Date().toISOString().split('T')[0],
      carriedOver: false,
      priority: "Low"
    }
  ],
  problems: [
    {
      id: "prob-1",
      title: "Two Sum",
      platform: "LeetCode",
      difficulty: "Easy",
      topic: "Arrays & Hashing",
      link: "https://leetcode.com/problems/two-sum/",
      solveStatus: "Independently", // "Independently", "Needed Hint", "Looked at Solution", "Need Revision"
      needsRevision: false,
      timeSpentMinutes: 15,
      notes: "Used Hash Map to achieve O(n) time and O(n) space complexity.",
      solvedAt: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: "prob-2",
      title: "3Sum",
      platform: "LeetCode",
      difficulty: "Medium",
      topic: "Two Pointers",
      link: "https://leetcode.com/problems/3sum/",
      solveStatus: "Needed Hint",
      needsRevision: true,
      timeSpentMinutes: 35,
      notes: "Sort the array first, then use two pointers. Beware of duplicate triplets!",
      solvedAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: "prob-3",
      title: "Valid Parentheses",
      platform: "LeetCode",
      difficulty: "Easy",
      topic: "Stacks & Queues",
      link: "https://leetcode.com/problems/valid-parentheses/",
      solveStatus: "Independently",
      needsRevision: false,
      timeSpentMinutes: 10,
      notes: "Classic stack problem. Push opening brackets, match when closing encountered.",
      solvedAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: "prob-4",
      title: "Longest Substring Without Repeating Characters",
      platform: "LeetCode",
      difficulty: "Medium",
      topic: "Sliding Window",
      link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      solveStatus: "Independently",
      needsRevision: false,
      timeSpentMinutes: 25,
      notes: "Sliding window with set / index map. Update left pointer when duplicate seen.",
      solvedAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: "prob-5",
      title: "Trapping Rain Water",
      platform: "LeetCode",
      difficulty: "Hard",
      topic: "Two Pointers",
      link: "https://leetcode.com/problems/trapping-rain-water/",
      solveStatus: "Looked at Solution",
      needsRevision: true,
      timeSpentMinutes: 50,
      notes: "Two-pointer approach using left_max and right_max bounds. Must re-solve next week!",
      solvedAt: new Date().toISOString()
    },
    {
      id: "prob-6",
      title: "Merge Two Sorted Lists",
      platform: "LeetCode",
      difficulty: "Easy",
      topic: "Linked Lists",
      link: "https://leetcode.com/problems/merge-two-sorted-lists/",
      solveStatus: "Independently",
      needsRevision: false,
      timeSpentMinutes: 12,
      notes: "Dummy head node simplifies pointer manipulation.",
      solvedAt: new Date().toISOString()
    }
  ],
  roadmap: [
    {
      week: 1,
      title: "Arrays & Strings Mastery",
      description: "Fundamental memory layouts, two pointers, prefix sums, and sliding window techniques.",
      status: "completed", // "completed", "in-progress", "upcoming"
      progress: 100,
      topics: [
        { name: "Array Basics & Dynamic Arrays", completed: true },
        { name: "Two Pointers Technique", completed: true },
        { name: "Sliding Window Patterns", completed: true },
        { name: "Prefix Sums & Frequency Maps", completed: true }
      ],
      curatedProblemsCount: 15,
      completedProblemsCount: 15
    },
    {
      week: 2,
      title: "Searching, Sorting & Stacks",
      description: "Binary search variations, quick/merge sort concepts, and monotonic stacks/queues.",
      status: "in-progress",
      progress: 65,
      topics: [
        { name: "Binary Search on Answer Space", completed: true },
        { name: "Rotated Sorted Array Search", completed: true },
        { name: "Monotonic Stack Patterns", completed: true },
        { name: "Priority Queues / Min-Max Heaps", completed: false }
      ],
      curatedProblemsCount: 18,
      completedProblemsCount: 12
    },
    {
      week: 3,
      title: "Linked Lists & Fast-Slow Pointers",
      description: "Reversal, cycle detection (Floyd's algorithm), LRU Cache, and merge sorting on lists.",
      status: "upcoming",
      progress: 0,
      topics: [
        { name: "Singly & Doubly Linked Lists", completed: false },
        { name: "Tortoise & Hare Cycle Detection", completed: false },
        { name: "Reversing in K-Groups", completed: false },
        { name: "LRU Cache Implementation", completed: false }
      ],
      curatedProblemsCount: 12,
      completedProblemsCount: 0
    },
    {
      week: 4,
      title: "Binary Trees & BST",
      description: "Tree traversals (Inorder/Pre/Post/Level), LCA, diameter, and binary search tree properties.",
      status: "upcoming",
      progress: 0,
      topics: [
        { name: "DFS Traversals & Recursive Views", completed: false },
        { name: "BFS Level Order & Zigzag", completed: false },
        { name: "Lowest Common Ancestor (LCA)", completed: false },
        { name: "BST Validation & Construction", completed: false }
      ],
      curatedProblemsCount: 20,
      completedProblemsCount: 0
    },
    {
      week: 5,
      title: "Graphs: BFS, DFS & Shortest Paths",
      description: "Adjacency representations, topological sort, Dijkstra, Union-Find (DSU).",
      status: "upcoming",
      progress: 0,
      topics: [
        { name: "Graph Traversals (BFS / DFS)", completed: false },
        { name: "Topological Sort (Kahn's Algo)", completed: false },
        { name: "Disjoint Set Union (DSU)", completed: false },
        { name: "Dijkstra's Shortest Path", completed: false }
      ],
      curatedProblemsCount: 22,
      completedProblemsCount: 0
    },
    {
      week: 6,
      title: "Dynamic Programming & Backtracking",
      description: "1D/2D memoization vs tabulation, knapsack, LCS, LIS, and state-machine DP.",
      status: "upcoming",
      progress: 0,
      topics: [
        { name: "1D DP & Subsequence patterns", completed: false },
        { name: "0/1 Knapsack & Unbounded", completed: false },
        { name: "Longest Common Subsequence (LCS)", completed: false },
        { name: "Backtracking (Permutations, N-Queens)", completed: false }
      ],
      curatedProblemsCount: 25,
      completedProblemsCount: 0
    }
  ],
  heatmaps: generateInitialHeatmapData()
};

function generateInitialHeatmapData() {
  const result = [];
  const today = new Date();
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Seed realistic activity
    let count = 0;
    if (i < 20) {
      count = Math.floor(Math.random() * 4) + 1;
    } else if (i % 3 === 0 || i % 7 === 0) {
      count = Math.floor(Math.random() * 3);
    }
    result.push({ date: dateStr, count });
  }
  return result;
}

// ── Storage ──
// Routes call getDb() / saveDb() synchronously.
//
// Neon mode (DATABASE_URL set): every data request runs inside runAsUser(userId, ...),
// set by the requireUser middleware. getDb() returns that user's in-memory copy, loaded
// from the user_state table, and saveDb() writes the collections that changed back to Neon.
//
// File mode (no DATABASE_URL): one shared data set in data/db.json, as before. Accounts are off.

const requestUser = new AsyncLocalStorage();
const userCache = new Map(); // userId -> { data, lastSaved: {key: json}, chain: Promise }

/** Data a brand-new account starts with: the roadmap, nothing done yet */
export function freshUserData({ name = 'Learner', email = '' } = {}) {
  const roadmap = JSON.parse(JSON.stringify(defaultData.roadmap)).map((week, i) => ({
    ...week,
    status: i === 0 ? 'in-progress' : 'upcoming',
    progress: 0,
    completedProblemsCount: 0,
    topics: week.topics.map((t) => ({ ...t, completed: false })),
  }));
  return {
    user: {
      name,
      email,
      targetRole: '',
      targetCompany: '',
      dailyGoal: 3,
      streak: 0,
      lastActiveDate: null,
    },
    tasks: [],
    problems: [],
    roadmap,
    heatmaps: [],
  };
}

export function runAsUser(userId, fn) {
  return requestUser.run({ userId }, fn);
}

function currentUserId() {
  return requestUser.getStore()?.userId || null;
}

/** Load a user's collections into memory. Call before running a request as that user. */
export async function loadUserData(userId) {
  const cached = userCache.get(userId);
  if (cached) return cached.data;
  const stored = await loadUserState(userId);
  const entry = { data: { ...freshUserData(), ...stored }, lastSaved: {}, chain: Promise.resolve() };
  Object.entries(stored).forEach(([key, value]) => { entry.lastSaved[key] = JSON.stringify(value); });
  userCache.set(userId, entry);
  return entry.data;
}

function flushUser(userId) {
  const entry = userCache.get(userId);
  if (!entry) return Promise.resolve();
  const changed = Object.entries(entry.data).filter(([key, value]) => JSON.stringify(value) !== entry.lastSaved[key]);
  if (!changed.length) return entry.chain;
  changed.forEach(([key, value]) => { entry.lastSaved[key] = JSON.stringify(value); });
  entry.chain = entry.chain
    .then(() => upsertUserKeys(userId, changed))
    .catch((err) => {
      console.error(`[neon] write failed for user ${userId}, will retry on the next save:`, err.message);
      changed.forEach(([key]) => { delete entry.lastSaved[key]; });
    });
  return entry.chain;
}

/**
 * Create the starting data for a new account.
 * The very first account also receives the data that existed before accounts (the legacy app_state rows).
 */
export async function seedUserData(userId, { name, email, claimLegacy = false }) {
  let data = freshUserData({ name, email });
  if (claimLegacy) {
    const legacy = await loadState();
    if (Object.keys(legacy).length) {
      data = { ...data, ...legacy, user: { ...(legacy.user || {}), name, email } };
    }
  }
  userCache.set(userId, { data, lastSaved: {}, chain: Promise.resolve() });
  await flushUser(userId);
  return data;
}

/** Update the profile collection after a name or email change */
export async function updateUserProfile(userId, patch) {
  const data = await loadUserData(userId);
  data.user = { ...data.user, ...patch };
  await flushUser(userId);
}

// ── File mode ──
let fileDb = null;

function readLocalFile() {
  try {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading db.json:', err.message);
  }
  return null;
}

function writeLocalFile(data) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err.message);
  }
}

/** Call once before the server starts listening */
export async function initDb() {
  if (!hasDatabase) {
    fileDb = readLocalFile() || JSON.parse(JSON.stringify(defaultData));
    if (!fs.existsSync(DB_FILE)) writeLocalFile(fileDb);
    return { mode: 'file' };
  }
  await ensureSchema();
  return { mode: 'neon' };
}

export function getDb() {
  if (hasDatabase) {
    const userId = currentUserId();
    const entry = userId && userCache.get(userId);
    if (!entry) throw new Error('getDb() called outside a signed-in request');
    return entry.data;
  }
  if (!fileDb) fileDb = readLocalFile() || JSON.parse(JSON.stringify(defaultData));
  return fileDb;
}

export function saveDb(data) {
  if (hasDatabase) {
    const userId = currentUserId();
    const entry = userId && userCache.get(userId);
    if (!entry) throw new Error('saveDb() called outside a signed-in request');
    entry.data = data;
    flushUser(userId);
    return;
  }
  fileDb = data;
  writeLocalFile(data);
}

/** Wait for pending Neon writes, for example before shutting down */
export function flushDb() {
  return Promise.all([...userCache.values()].map((e) => e.chain));
}

export const storageMode = hasDatabase ? 'neon' : 'file';

export const db = {
  read: getDb,
  write: saveDb
};

export default {
  initDb,
  getDb,
  saveDb,
  flushDb,
  db
};
