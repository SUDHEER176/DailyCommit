import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to make LeetCode URL slug
export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function parseNeetCodeQuestions(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  function splitLine(line) {
    const row = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    return row;
  }

  const header = splitLine(lines[0]);
  const questions = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    if (values.length < 4) continue;
    
    const week = parseInt(values[0]) || 1;
    const topic = values[1];
    const number = parseInt(values[2]);
    const title = values[3];
    const difficulty = values[4] || 'Medium';
    const freeLink = values[5] || '';
    const video = values[6] || 'Watch';
    
    if (!title || isNaN(number)) continue;

    const slug = slugify(title);
    const leetcodeUrl = `https://leetcode.com/problems/${slug}/`;

    questions.push({
      id: `nc-${number}`,
      number,
      title,
      topic,
      difficulty,
      week,
      url: leetcodeUrl,
      freeUrl: freeLink ? `https://neetcode.io/problems/${slug}` : null,
      video: video === 'Watch' ? `https://www.youtube.com/results?search_query=neetcode+${encodeURIComponent(title)}` : null,
      completed: false,
      isDifficult: false,
      solveStatus: 'unattempted', // 'independent' | 'hint' | 'solution' | 'unattempted'
      notes: '',
      completedAt: null
    });
  }

  return questions;
}

// Generate Day-by-Day Schedule
export function generateSchedule({
  questions = [],
  level = 'intermediate', // 'beginner' | 'intermediate' | 'advanced'
  difficultyPref = 'mixed_easy_medium', // 'easy_first' | 'mixed_easy_medium' | 'all_tiers' | 'mostly_medium' | 'hard_focus'
  dailyHours = 2,
  targetDays = 45,
  includeRevision = true,
  startDate = new Date().toISOString().split('T')[0],
  existingCompletedIds = []
}) {
  const dailyMinutes = Math.max(30, Math.round(dailyHours * 60));

  // Time estimate multipliers by level
  const timeEstimates = {
    beginner: { Easy: 25, Medium: 45, Hard: 70 },
    intermediate: { Easy: 18, Medium: 32, Hard: 50 },
    advanced: { Easy: 12, Medium: 22, Hard: 35 }
  }[level] || { Easy: 18, Medium: 32, Hard: 50 };

  // Tag questions with estimated minutes
  let pool = questions.map(q => {
    const isCompleted = existingCompletedIds.includes(q.id) || q.completed;
    return {
      ...q,
      completed: isCompleted,
      estimatedMinutes: timeEstimates[q.difficulty] || 30
    };
  });

  // Calculate total workload
  const totalMinutes = pool.reduce((acc, q) => acc + q.estimatedMinutes, 0);

  // Sort pool based on user preference
  let orderedPool = [...pool];
  if (difficultyPref === 'easy_first') {
    const diffWeight = { Easy: 1, Medium: 2, Hard: 3 };
    orderedPool.sort((a, b) => {
      if (diffWeight[a.difficulty] !== diffWeight[b.difficulty]) {
        return diffWeight[a.difficulty] - diffWeight[b.difficulty];
      }
      return a.week - b.week;
    });
  } else if (difficultyPref === 'mostly_medium') {
    const diffWeight = { Medium: 1, Easy: 2, Hard: 3 };
    orderedPool.sort((a, b) => {
      if (diffWeight[a.difficulty] !== diffWeight[b.difficulty]) {
        return diffWeight[a.difficulty] - diffWeight[b.difficulty];
      }
      return a.week - b.week;
    });
  } else if (difficultyPref === 'hard_focus') {
    const diffWeight = { Hard: 1, Medium: 2, Easy: 3 };
    orderedPool.sort((a, b) => {
      if (diffWeight[a.difficulty] !== diffWeight[b.difficulty]) {
        return diffWeight[a.difficulty] - diffWeight[b.difficulty];
      }
      return a.week - b.week;
    });
  } else {
    // Standard NeetCode 150 topic & week progression
    orderedPool.sort((a, b) => a.week - b.week || a.number - b.number);
  }

  // Spread the work over the target number of days.
  // Every problem stays in the plan in order; solved ones ride along at no cost.
  const uncompleted = orderedPool.filter(q => !q.completed);
  const completed = orderedPool.filter(q => q.completed);
  const remainingMinutes = uncompleted.reduce((acc, q) => acc + q.estimatedMinutes, 0);

  const planDays = Math.max(1, Math.min(Math.round(targetDays) || 45, uncompleted.length || 1));
  const dayWeight = (n) => (includeRevision && n % 5 === 0 ? 0.7 : 1); // revision days carry a lighter load
  const totalWeight = Array.from({ length: planDays }, (_, i) => dayWeight(i + 1)).reduce((a, b) => a + b, 0);
  const minutesPerFullDay = remainingMinutes / totalWeight;
  const neededHours = minutesPerFullDay / 60;

  let warning = null;
  if (uncompleted.length > 0 && neededHours > dailyHours * 1.15) {
    warning = `Finishing in ${planDays} days means about ${neededHours.toFixed(1)} h a day, more than the ${dailyHours} h you set. Pick a later date or more hours if that is too much.`;
  }

  const scheduleDays = [];
  const start = new Date(startDate);
  let qIdx = 0;
  let doneMinutes = 0;
  let weightSoFar = 0;

  for (let dayNum = 1; dayNum <= planDays && qIdx < orderedPool.length; dayNum++) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + (dayNum - 1));
    const dateStr = dayDate.toISOString().split('T')[0];
    const isRevisionDay = includeRevision && dayNum % 5 === 0;

    weightSoFar += dayWeight(dayNum);
    const targetMinutes = remainingMinutes * (weightSoFar / totalWeight);
    const isLastDay = dayNum === planDays;

    const dayQuestions = [];
    let dayMinutes = 0;
    while (qIdx < orderedPool.length) {
      const q = orderedPool[qIdx];
      const cost = q.completed ? 0 : q.estimatedMinutes;
      const hasNewWork = dayQuestions.some(x => !x.completed);
      // Take the problem if it keeps the running total on schedule, always take at least one unsolved
      if (!isLastDay && hasNewWork && cost > 0 && doneMinutes + cost / 2 > targetMinutes) break;
      dayQuestions.push(q);
      dayMinutes += cost;
      doneMinutes += cost;
      qIdx++;
    }

    scheduleDays.push({
      dayNumber: dayNum,
      date: dateStr,
      topics: Array.from(new Set(dayQuestions.map(q => q.topic))),
      questions: dayQuestions,
      totalEstimatedMinutes: dayMinutes,
      isRevisionDay,
      completedCount: dayQuestions.filter(q => q.completed).length,
      isFullyCompleted: dayQuestions.length > 0 && dayQuestions.every(q => q.completed)
    });
  }

  const finalTargetDate = scheduleDays.length > 0 ? scheduleDays[scheduleDays.length - 1].date : startDate;

  return {
    config: {
      level,
      difficultyPref,
      dailyHours,
      targetDays,
      includeRevision,
      startDate
    },
    warning,
    totalQuestions: pool.length,
    completedCount: completed.length,
    remainingCount: uncompleted.length,
    totalEstimatedMinutes: totalMinutes,
    estimatedDaysNeeded: scheduleDays.length,
    estimatedCompletionDate: finalTargetDate,
    days: scheduleDays
  };
}

// Quick test if run standalone
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const csvPath = path.join(__dirname, 'neetcode150.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const questions = parseNeetCodeQuestions(csvText);
  console.log('Loaded questions count:', questions.length);

  const plan = generateSchedule({
    questions,
    level: 'intermediate',
    difficultyPref: 'mixed_easy_medium',
    dailyHours: 2,
    targetDays: 45,
    includeRevision: true
  });

  console.log('Generated plan total days:', plan.days.length);
  console.log('Warning:', plan.warning);
  console.log('Day 1:', plan.days[0]);
  console.log('Day 5 (revision day):', plan.days[4]);
}
