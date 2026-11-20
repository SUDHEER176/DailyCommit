// The code score (0 to 100) behind the bar in the editor.
//
// Three parts, so the number can be explained and doesn't swing with the AI's mood:
//   tests   up to 40  how many test cases the run passed
//   time    up to 40  the AI's grade of the time complexity against the best known approach
//   space   up to 20  the AI's grade of the extra space against the best known approach
// Grades: "optimal" (matches the best known), "good" (one step off, e.g. O(n log n) for O(n)),
// "poor" (worse, e.g. O(n^2) for O(n)).
//
// The time and space credit is scaled by the share of tests passed, so code that doesn't work
// can't earn points for being fast (a function that just returns false is O(1)). 100 needs every
// test passed AND optimal time AND optimal space; nothing rounds up to it.

export const GRADES = ['optimal', 'good', 'poor'];
export const MAX_POINTS = { tests: 40, time: 40, space: 20 };
const TIME_POINTS = { optimal: 40, good: 28, poor: 12 };
const SPACE_POINTS = { optimal: 20, good: 14, poor: 6 };

/**
 * @returns {{ score: number|null, tests: number|null, time: number|null, space: number|null, max }}
 *   score is null when there is nothing to score yet (no test results, or no grades).
 */
export function computeScore({ passed, total, timeGrade, spaceGrade } = {}) {
  const max = MAX_POINTS;
  const haveTests = Number.isInteger(passed) && Number.isInteger(total) && total > 0 && passed >= 0 && passed <= total;
  if (!haveTests) return { score: null, tests: null, time: null, space: null, max };

  const ratio = passed / total;
  const all = passed === total;
  // Partial credit rounds down, so a single failing case can never round up to the full amount
  const scale = (points) => (all ? points : Math.floor(points * ratio));

  const tests = scale(MAX_POINTS.tests);
  if (!(spaceGrade in SPACE_POINTS) || !(timeGrade in TIME_POINTS)) return { score: null, tests, time: null, space: null, max };
  const time = scale(TIME_POINTS[timeGrade]);
  const space = scale(SPACE_POINTS[spaceGrade]);
  return { score: tests + time + space, tests, time, space, max };
}

/** One word for the approach, from the two grades (the recommender reads this) */
export function verdictFromGrades(timeGrade, spaceGrade) {
  if (timeGrade === 'poor') return 'suboptimal';
  if (timeGrade === 'optimal' && spaceGrade !== 'poor') return 'optimal';
  return 'acceptable';
}
