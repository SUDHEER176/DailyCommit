/**
 * Idempotent seed importer for CodeStreak's JSON-backed problem bank.
 *
 * Usage from repository root:
 *   node scripts/import-neetcode150.js
 *
 * Defaults:
 *   seed:   server/data/seeds/neetcode150.json (or backend/data/seeds/neetcode150.json)
 *   target: server/data/problems.json (or backend/data/problems.json)
 *
 * This importer adds missing question IDs only. It does not overwrite existing
 * problem records, user progress, submissions, or planner assignments.
 * Review the problemUrl values and fill difficulty before production use.
 */
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

// Default paths in backend
let defaultSeed = "backend/data/seeds/neetcode150.json";
let defaultTarget = "backend/data/problems.json";

const seedPath = path.resolve(
  root,
  process.argv[2] || defaultSeed
);
const targetPath = path.resolve(
  root,
  process.argv[3] || defaultTarget
);

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.trim()) return fallback;
  return JSON.parse(raw);
}

function writeJsonAtomically(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2) + "\n", "utf8");
  fs.renameSync(tempPath, filePath);
}

const seed = readJson(seedPath, []);
if (!Array.isArray(seed)) {
  throw new Error(`Seed file must contain a JSON array: ${seedPath}`);
}

const existing = readJson(targetPath, []);
if (!Array.isArray(existing)) {
  throw new Error(
    `Target file must contain a JSON array: ${targetPath}. ` +
    "If your existing file uses another shape, adapt this importer first."
  );
}

const existingIds = new Set(existing.map((item) => item.id).filter(Boolean));
const seenSeedIds = new Set();
const additions = [];

for (const problem of seed) {
  if (!problem || typeof problem.id !== "string" || !problem.id.trim()) {
    throw new Error("Every seed record must have a non-empty string id.");
  }
  if (seenSeedIds.has(problem.id)) {
    throw new Error(`Duplicate ID in seed file: ${problem.id}`);
  }
  seenSeedIds.add(problem.id);

  if (!problem.title || !problem.topic || !problem.source) {
    throw new Error(`Missing required fields for ${problem.id}`);
  }

  if (!existingIds.has(problem.id)) {
    additions.push(problem);
    existingIds.add(problem.id);
  }
}

const merged = [...existing, ...additions];
writeJsonAtomically(targetPath, merged);

console.log(`Seed records: ${seed.length}`);
console.log(`Added: ${additions.length}`);
console.log(`Already present/skipped: ${seed.length - additions.length}`);
console.log(`Total questions in bank: ${merged.length}`);
console.log(`Saved to: ${targetPath}`);
console.log(
  "Next: review problemUrl values and fill difficulty. " +
  "This import does not include problem statements or hidden test cases."
);
