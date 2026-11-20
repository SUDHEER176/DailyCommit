import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';

// Records one attempt per time a problem is open in the editor. These are the signals the
// next-problem recommender reads, so they aim to be honest rather than complete:
//   - active time only counts while the tab is visible and the person did something in the last minute
//   - first-submit and final verdicts, runs and submits
//   - whether hints or the video were opened, and how many characters were pasted
//   - a self-rating after an accepted submit, the most reliable cheap signal
// Typing speed is deliberately not recorded: it measures typing, not problem solving.

const TICK_MS = 5000;
const IDLE_MS = 60000;

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function freshAttempt(problemId) {
  const now = new Date().toISOString();
  return {
    id: newId(),
    problemId,
    title: null,
    difficulty: null,
    topic: null,
    openedAt: now,
    lastActiveAt: now,
    activeSeconds: 0,
    runs: 0,
    submits: 0,
    firstSubmitVerdict: null,
    finalVerdict: null,
    solved: false,
    solvedAt: null,
    secondsToSolve: null,
    languages: [],
    hintsViewed: false,
    videoOpened: false,
    pastedChars: 0,
    selfRating: null,
    aiVerdict: null,
  };
}

/** Opening a problem and reading it is not an attempt; only send once something happened */
const worthSending = (a) => a.runs || a.submits || a.hintsViewed || a.videoOpened || a.selfRating;

export function useAttemptTracker(problem) {
  const problemId = problem ? String(problem.id ?? problem.number ?? '') : '';
  const attemptRef = useRef(null);
  const tickRef = useRef(() => {});
  const metaRef = useRef({});
  const [selfRating, setSelfRatingState] = useState(null);

  // Details arrive after the editor opens, so read the latest title, difficulty and topic when sending
  metaRef.current = { title: problem?.title || null, difficulty: problem?.difficulty || null, topic: problem?.topic || null };

  // Resolves once the attempt is saved (or failed to save), so a recommendation fetched
  // afterwards sees it
  const flush = useCallback((options) => {
    const a = attemptRef.current;
    if (!a) return Promise.resolve(false);
    tickRef.current();
    if (!worthSending(a)) return Promise.resolve(false);
    return api.recordAttempt({ ...a, ...metaRef.current, languages: [...a.languages] }, options);
  }, []);

  useEffect(() => {
    if (!problemId) return undefined;
    attemptRef.current = freshAttempt(problemId);
    setSelfRatingState(null);

    let lastInput = Date.now();
    let lastTick = Date.now();
    let activeMs = 0;

    const tick = () => {
      const now = Date.now();
      // Timers are throttled in background tabs, so never credit more than two ticks at once
      if (document.visibilityState === 'visible' && now - lastInput < IDLE_MS) {
        activeMs += Math.min(now - lastTick, TICK_MS * 2);
        const a = attemptRef.current;
        if (a) {
          a.activeSeconds = Math.round(activeMs / 1000);
          a.lastActiveAt = new Date(now).toISOString();
        }
      }
      lastTick = now;
    };
    tickRef.current = tick;

    const onInput = () => { lastInput = Date.now(); };
    const inputEvents = ['keydown', 'pointerdown', 'pointermove', 'wheel'];
    inputEvents.forEach((e) => window.addEventListener(e, onInput, { passive: true, capture: true }));

    const onHidden = () => { if (document.visibilityState === 'hidden') flush({ keepalive: true }); };
    const onPageHide = () => flush({ keepalive: true });
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPageHide);

    const timer = setInterval(tick, TICK_MS);

    return () => {
      clearInterval(timer);
      inputEvents.forEach((e) => window.removeEventListener(e, onInput, { capture: true }));
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', onPageHide);
      flush();
      attemptRef.current = null;
      tickRef.current = () => {};
    };
  }, [problemId, flush]);

  const addLanguage = (a, language) => {
    if (language && !a.languages.includes(language)) a.languages.push(language);
  };

  const recordRun = useCallback((language) => {
    const a = attemptRef.current;
    if (!a) return;
    a.runs += 1;
    addLanguage(a, language);
  }, []);

  const recordSubmit = useCallback((language, result) => {
    const a = attemptRef.current;
    if (!a) return Promise.resolve(false);
    tickRef.current();
    a.submits += 1;
    addLanguage(a, language);
    const verdict = result?.verdict || (result?.success ? 'Accepted' : 'Execution Error');
    if (a.submits === 1) a.firstSubmitVerdict = verdict;
    a.finalVerdict = verdict;
    if (result?.success && !a.solved) {
      a.solved = true;
      a.solvedAt = new Date().toISOString();
      a.secondsToSolve = a.activeSeconds;
    }
    return flush();
  }, [flush]);

  const markHintsViewed = useCallback(() => {
    if (attemptRef.current) attemptRef.current.hintsViewed = true;
  }, []);

  const markVideoOpened = useCallback(() => {
    if (attemptRef.current) attemptRef.current.videoOpened = true;
  }, []);

  const recordPaste = useCallback((chars) => {
    if (attemptRef.current && chars > 0) attemptRef.current.pastedChars += chars;
  }, []);

  const setSelfRating = useCallback((rating) => {
    const a = attemptRef.current;
    if (!a) return Promise.resolve(false);
    a.selfRating = rating;
    setSelfRatingState(rating);
    return flush();
  }, [flush]);

  // The AI review's verdict lives on the attempt too: the client always sends the whole attempt,
  // so without this a later save would wipe the verdict the server stored
  const recordAiVerdict = useCallback((verdict) => {
    const a = attemptRef.current;
    if (!a) return Promise.resolve(false);
    a.aiVerdict = verdict;
    return flush();
  }, [flush]);

  const getAttemptId = useCallback(() => attemptRef.current?.id || null, []);

  return {
    recordRun, recordSubmit, markHintsViewed, markVideoOpened, recordPaste, setSelfRating, selfRating,
    recordAiVerdict, getAttemptId,
  };
}
