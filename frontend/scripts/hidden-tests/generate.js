// Writes src/data/hiddenTests.json. Run with `npm run hidden-tests` after editing problems.js.
import { writeFileSync } from 'node:fs';
import { buildHiddenTests, formatHiddenTests } from './build.js';

const target = new URL('../../src/data/hiddenTests.json', import.meta.url);
const tests = buildHiddenTests();
writeFileSync(target, formatHiddenTests(tests));
const total = Object.values(tests).reduce((n, cases) => n + cases.length, 0);
console.log(`Wrote ${total} hidden cases for ${Object.keys(tests).length} problems to src/data/hiddenTests.json`);
