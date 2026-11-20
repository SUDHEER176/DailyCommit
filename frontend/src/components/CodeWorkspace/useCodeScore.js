import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';

// The code score behind the bar in the editor. After a Run or a Submit it asks the server to
// analyse the code (time and space complexity, the approach) and score it 0 to 100 together with
// how many tests passed. States:
//   idle         nothing run yet
//   analyzing    waiting for the analysis (the previous score stays on the bar meanwhile)
//   done         scored
//   skipped      the code didn't run (compile or runtime error), so there's nothing to judge
//   locked       analysis is a Pro feature and this account is Free
//   unavailable  the analysis failed (quota, busy); the bar falls back to the tests part only

let statusPromise = null;
const aiStatus = () => (statusPromise ||= api.getAiStatus());

const NOT_ANALYSABLE = new Set(['Compile Error', 'Runtime Error', 'Execution Error']);
const TESTS_POINTS = 40; // the tests part of the score, as on the server (data/code-score.js)
const testsOnly = (passed, total) => (total > 0 ? (passed === total ? TESTS_POINTS : Math.floor((TESTS_POINTS * passed) / total)) : 0);

export function useCodeScore({ problem, language, getAttemptId }) {
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState({ phase: 'idle' });
  const latest = useRef(0); // a newer Run or Submit, or another problem, makes older answers stale

  useEffect(() => {
    let alive = true;
    aiStatus().then((s) => { if (alive) setEnabled(Boolean(s?.reviewEnabled)); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    latest.current += 1;
    setState({ phase: 'idle' });
  }, [problem?.id]);

  /**
   * @param kind     'run' or 'submit'
   * @param verdict  what the test run said ('Accepted', 'Wrong Answer', 'Compile Error', ...)
   * @returns the analysis and score once they arrive, or null (skipped, failed, or superseded)
   */
  const analyze = useCallback(async ({ kind, passed, total, verdict, code }) => {
    const mine = ++latest.current;
    if (NOT_ANALYSABLE.has(verdict)) {
      setState({ phase: 'skipped', kind, score: 0, note: 'The code hit an error. Fix it to get a score' });
      return null;
    }
    setState((prev) => ({ ...prev, phase: 'analyzing', kind }));
    const res = await api.reviewCode({
      problemId: problem?.id ? String(problem.id) : undefined,
      attemptId: getAttemptId?.(),
      title: problem?.title,
      difficulty: problem?.difficulty,
      language, code, passed, total, kind,
    });
    if (mine !== latest.current) return null;

    if (res.success) {
      const { score, ...analysis } = res.data;
      setState({ phase: 'done', kind, score: score.score, parts: score, analysis, passed, total, code, language });
      return { analysis, score, passed, total, code, language };
    }
    if (res.upgrade) {
      setState({ phase: 'locked', kind, score: testsOnly(passed, total), note: 'AI scoring is part of Pro' });
    } else {
      setState({ phase: 'unavailable', kind, score: testsOnly(passed, total), note: `${res.error}. The score shows tests only` });
    }
    return null;
  }, [problem?.id, problem?.title, problem?.difficulty, language, getAttemptId]);

  return { enabled, state, analyze };
}
