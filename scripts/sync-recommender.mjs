// Copies the recommender and its pattern graph from the backend to the frontend, so the
// "Next up" suggestion works offline with exactly the same logic as the server.
// The backend files are the source; never edit the frontend copies.
//
//   node scripts/sync-recommender.mjs
//
// `cd backend && npm test` fails when the copies are stale.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const copies = [
  ['backend/data/recommender.js', 'frontend/src/lib/recommender.js', true],
  ['backend/data/problem-graph.json', 'frontend/src/data/problemGraph.json', false],
];

for (const [src, dest, addHeader] of copies) {
  const body = fs.readFileSync(path.join(root, src), 'utf8');
  const header = addHeader ? `// GENERATED from ${src} by scripts/sync-recommender.mjs. Edit the backend file, then re-run the script.\n` : '';
  fs.writeFileSync(path.join(root, dest), header + body);
  console.log(`${src} → ${dest}`);
}
