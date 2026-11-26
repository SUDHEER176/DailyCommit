import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Group, Panel, Separator, usePanelRef } from 'react-resizable-panels';
import confetti from 'canvas-confetti';
import { RotateCcw, Copy, Check, Maximize2, Minimize2, Minus, Plus } from 'lucide-react';
import { getProblemDetails } from '../../data/problemDetails';
import { runSolution, warmUpPython } from '../../services/execution';
import { clearlyOtherLanguage } from '../../services/execution/languageCheck';
import { api } from '../../services/api';
import { useAttemptTracker } from './useAttemptTracker';
import { useNextProblem } from '../practice/NextUpCard';
import ScoreBar from './ScoreBar';
import ScoreModal from './ScoreModal';
import { useCodeScore } from './useCodeScore';
import { hiddenTestsFor } from '../../data/hiddenTests';
import { SUPPORTED_LANGUAGES, LANGUAGE_KEY } from './languages';
import { useLightTheme, defineEditorTheme } from './editorTheme';
import LanguageMenu from './LanguageMenu';
import { getProblemSlug } from './statement';
import { useSolveTimer } from './useSolveTimer';
import { card, toolButton } from './styles';
import WorkspaceTopBar from './WorkspaceTopBar';
import ProblemPanel from './ProblemPanel';
import ConsolePanel from './ConsolePanel';

export default function CodeWorkspace({
  problem: initialProblem,
  onBack,
  onProblemSolved,
  onOpenProblem, // optional: open another problem; enables the "Next up" suggestion after a solve
  streak = 0, // the person's streak, for today's square in the top bar
  activeToday = false, // whether today already counts toward it
}) {
  const [problem, setProblem] = useState(() => getProblemDetails(initialProblem));
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  // Python first; after that, the language the person last picked
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      return SUPPORTED_LANGUAGES.some((l) => l.id === saved) ? saved : 'python';
    } catch { return 'python'; }
  });
  const setLanguage = (id) => {
    setLanguageState(id);
    try { localStorage.setItem(LANGUAGE_KEY, id); } catch { /* storage unavailable */ }
  };
  const lightTheme = useLightTheme();
  // "Saved" shows briefly after typing, since drafts save on every change
  const [savedFlash, setSavedFlash] = useState(false);
  const savedTimer = useRef(null);
  useEffect(() => () => clearTimeout(savedTimer.current), []);
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'solution' | 'submissions'
  const [activeTestIndex, setActiveTestIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [bottomTab, setBottomTab] = useState('testcases'); // 'testcases' | 'result' | 'console'
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };
  // The problem statement and the console can be folded away to give the editor the room
  const statementPanel = usePanelRef();
  const consolePanel = usePanelRef();
  const [statementCollapsed, setStatementCollapsed] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const toggleStatement = () => {
    const panel = statementPanel.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand(); else panel.collapse();
  };
  const toggleConsole = () => {
    const panel = consolePanel.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand(); else panel.collapse();
  };
  const showConsoleTab = (tab) => {
    setBottomTab(tab);
    if (consolePanel.current?.isCollapsed()) consolePanel.current.expand();
  };
  const [fontSize, setFontSize] = useState(14);
  const [runStatus, setRunStatus] = useState(null); // e.g. "Loading Python" while the interpreter downloads
  const attempt = useAttemptTracker(problem);
  const timer = useSolveTimer(problem?.id);
  // Solved before (an accepted submit saved on this device), or just now
  const [acceptedNow, setAcceptedNow] = useState(false);
  useEffect(() => { setAcceptedNow(false); }, [problem?.id]);
  const solvedBefore = acceptedNow || (problem?.id != null && api.getLocalAttempts(problem.id).some((a) => a.solved));
  const doneToday = activeToday || acceptedNow;

  // After an accepted submit (and again after a self-rating), suggest what to solve next.
  // Bumped only once the attempt is saved, so the suggestion reflects it.
  const [historyVersion, setHistoryVersion] = useState(0);
  const bumpHistory = () => setHistoryVersion((v) => v + 1);
  // The code score bar, and the centred popup shown after an accepted Submit (or from the bar's Details)
  const score = useCodeScore({ problem, language, getAttemptId: attempt.getAttemptId });
  const [scoreModal, setScoreModal] = useState(null); // { result, variant: 'optimal' | 'solved' | 'details' }
  useEffect(() => { setScoreModal(null); }, [problem?.id]);
  // The "Stuck? Suggest an easier problem" card, opened by the person after a Run or Submit that failed
  const [stuckOpen, setStuckOpen] = useState(false);
  useEffect(() => { setHistoryVersion(0); setStuckOpen(false); }, [problem?.id]);
  const askForEasier = () => {
    setStuckOpen(true);
    attempt.markGaveUp().then(bumpHistory);
  };
  const next = useNextProblem({
    after: problem?.id,
    refreshKey: historyVersion,
    enabled: Boolean(onOpenProblem) && historyVersion > 0,
  });

  // Python loads about 10 MB the first time, so start as soon as it's picked
  useEffect(() => {
    if (language === 'python') warmUpPython()?.catch(() => {});
  }, [language]);

  // Load problem details and fetch official LeetCode statements & snippets
  useEffect(() => {
    const localDetails = getProblemDetails(initialProblem);
    setProblem(localDetails);

    // Problems we wrote ourselves (LeetCode Premium) have nothing to fetch
    if (localDetails?.authored) return;

    const slug = getProblemSlug(initialProblem);
    if (!slug) return;

    let isMounted = true;
    setIsLoadingDetails(true);

    api.getProblemDetails(slug).then((remoteData) => {
      if (!isMounted || !remoteData) {
        if (isMounted) setIsLoadingDetails(false);
        return;
      }

      setProblem((prev) => ({
        ...prev,
        ...remoteData,
        id: prev?.id || remoteData.id,
        number: remoteData.number || prev?.number,
        title: remoteData.title || prev?.title,
        difficulty: remoteData.difficulty || prev?.difficulty,
        topic: prev?.topic || remoteData.topic,
        contentHtml: remoteData.contentHtml || prev?.contentHtml,
        meta: remoteData.meta || prev?.meta,
        starterTemplates: {
          ...(prev?.starterTemplates || {}),
          ...(remoteData.starterTemplates || {})
        },
        sampleTestCases: remoteData.sampleTestCases?.length ? remoteData.sampleTestCases : prev?.sampleTestCases,
        examples: remoteData.examples?.length ? remoteData.examples : prev?.examples,
        constraints: remoteData.constraints?.length ? remoteData.constraints : prev?.constraints,
        // The server sends [] for problems it has no hidden tests for; keep the ones written locally
        hiddenTestCases: remoteData.hiddenTestCases?.length ? remoteData.hiddenTestCases : prev?.hiddenTestCases
      }));
      setIsLoadingDetails(false);
    }).catch((err) => {
      console.warn("Failed to fetch official problem details:", err);
      if (isMounted) setIsLoadingDetails(false);
    });

    return () => {
      isMounted = false;
    };
  }, [initialProblem]);

  // The draft key of the code currently in the editor. Saving goes here, not to whatever
  // language is selected at that instant, so a change event that lands during a language
  // switch can't store one language's code under another's key.
  const draftKeyRef = useRef(null);

  // Load starter code or saved draft from localStorage
  useEffect(() => {
    if (!problem) return;
    const storageKey = `code_${problem.id}_${language}`;
    let saved = null;
    try { saved = localStorage.getItem(storageKey); } catch { saved = null; }

    // Old placeholders, and drafts that are clearly another language, give way to the real template
    const isGenericFallback = saved && (
      saved.includes('// Write your code here') ||
      saved.includes('// Write your solution here') ||
      saved.includes('function happyNumber(') ||
      saved.trim() === ''
    );
    const isOtherLanguage = saved && Boolean(clearlyOtherLanguage(language, saved));
    if (isOtherLanguage) {
      try { localStorage.removeItem(storageKey); } catch { /* storage unavailable */ }
    }

    if (saved && !isGenericFallback && !isOtherLanguage) {
      setCode(saved);
    } else if (problem.starterTemplates && problem.starterTemplates[language]) {
      setCode(problem.starterTemplates[language]);
    } else {
      setCode(language === 'python' ? '# Write your solution here\n' : '// Write your solution here\n');
    }
    draftKeyRef.current = storageKey;
    setExecutionResult(null);
  }, [problem?.id, problem?.starterTemplates?.[language], language]);

  // Save code changes to localStorage, under the key the editor's code was loaded for
  const handleCodeChange = (newVal) => {
    const val = newVal ?? '';
    setCode(val);
    const key = draftKeyRef.current;
    if (key && key === `code_${problem?.id}_${language}`) {
      try {
        localStorage.setItem(key, val);
        setSavedFlash(true);
        clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSavedFlash(false), 1500);
      } catch { /* storage unavailable */ }
    }
  };

  // Reset to starter template
  const handleResetCode = () => {
    if (!problem?.starterTemplates?.[language]) return;
    if (window.confirm("Reset to the starter code? Your changes for this language will be lost.")) {
      const original = problem.starterTemplates[language];
      setCode(original);
      localStorage.removeItem(`code_${problem.id}_${language}`);
      setExecutionResult(null);
    }
  };

  // Run Code against sample test cases
  const handleRunCode = async () => {
    if (!problem || isRunning || isSubmitting) return;
    setIsRunning(true);
    attempt.recordRun(language);
    showConsoleTab('result');

    try {
      const testCases = problem.sampleTestCases || [];
      const res = await runSolution({ problem, language, code, testCases, onStatus: setRunStatus });
      setExecutionResult({
        type: 'run',
        ...res
      });
      // Score the code in the background; the bar fills in when the analysis arrives
      const ranCases = res.results || [];
      score.analyze({ kind: 'run', passed: ranCases.filter((r) => r.passed).length, total: ranCases.length, verdict: res.verdict, code });
    } catch (err) {
      setExecutionResult({
        type: 'run',
        success: false,
        verdict: 'Execution Error',
        runtimeMs: 0,
        results: [{
          testCaseIndex: 1,
          passed: false,
          error: err.message || 'Execution failed'
        }]
      });
    } finally {
      setIsRunning(false);
      setRunStatus(null);
    }
  };

  // Submit Solution against all sample + hidden test cases
  const handleSubmitCode = async () => {
    if (!problem || isRunning || isSubmitting) return;
    setIsSubmitting(true);
    showConsoleTab('result');

    try {
      const allCases = [
        ...(problem.sampleTestCases || []),
        ...(problem.hiddenTestCases || []),
        ...(await hiddenTestsFor(getProblemSlug(initialProblem))),
      ];
      const res = await runSolution({ problem, language, code, testCases: allCases, onStatus: setRunStatus });

      setExecutionResult({
        type: 'submit',
        ...res
      });
      attempt.recordSubmit(language, res).then(() => { if (res.success) bumpHistory(); });
      const submittedCases = res.results || [];
      score.analyze({ kind: 'submit', passed: submittedCases.filter((r) => r.passed).length, total: submittedCases.length, verdict: res.verdict, code })
        .then((done) => {
          if (!done || !res.success) return;
          // Accepted: say how it did in the middle of the screen, and keep the verdict for Next up
          const optimal = done.score.score === 100;
          setScoreModal({ result: done, variant: optimal ? 'optimal' : 'solved' });
          attempt.recordAiVerdict(done.analysis.verdict).then(bumpHistory);
        });

      if (res.success) {
        setAcceptedNow(true);
        // Trigger celebratory confetti
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { y: 0.6 },
          colors: ['#0066FF', '#4d8eff', '#a3a9b8'],
          disableForReducedMotion: true,
        });

        if (onProblemSolved) {
          onProblemSolved(problem.id || problem.number);
        }
      }
    } catch (err) {
      attempt.recordSubmit(language, { success: false, verdict: 'Execution Error' });
      setExecutionResult({
        type: 'submit',
        success: false,
        verdict: 'Execution Error',
        runtimeMs: 0,
        results: [{
          testCaseIndex: 1,
          passed: false,
          error: err.message || 'Submission failed'
        }]
      });
    } finally {
      setIsSubmitting(false);
      setRunStatus(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!problem) {
    return (
      <div className="h-[480px] flex items-center justify-center bg-ink-900 text-[13px] text-slate-400">
        No problem selected. Pick one from the practice hub
      </div>
    );
  }

  const sampleCases = problem.sampleTestCases || [];

  const busy = isRunning || isSubmitting;
  return (
    <div className="h-full flex flex-col gap-2 p-2 bg-ink-950 text-slate-100">
      {/* After an accepted Submit: the score, complexity, main idea and a better way to think about it */}
      {scoreModal && (
        <ScoreModal
          result={scoreModal.result}
          variant={scoreModal.variant}
          problemTitle={problem.title}
          onClose={() => setScoreModal(null)}
          selfRating={attempt.selfRating}
          onRate={executionResult?.type === 'submit' && executionResult.success
            ? (value) => attempt.setSelfRating(value).then(bumpHistory)
            : null}
          nextProblem={onOpenProblem && !next.loading ? next.rec?.problem : null}
          onOpenNext={onOpenProblem}
        />
      )}

      {/* Top bar: back, the problem, the clock, today's square, Run and Submit */}
      <WorkspaceTopBar
        problem={problem}
        onBack={onBack}
        statementCollapsed={statementCollapsed}
        onToggleStatement={toggleStatement}
        timer={timer}
        doneToday={doneToday}
        streak={doneToday && !activeToday ? streak + 1 : streak}
        busy={busy}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        runStatus={runStatus}
        onRun={handleRunCode}
        onSubmit={handleSubmitCode}
      />

      <div className="flex-1 min-h-0">
        <Group orientation="horizontal">
          {/* Problem statement */}
          <Panel
            panelRef={statementPanel}
            defaultSize="44%"
            minSize="24%"
            collapsible
            collapsedSize="0%"
            onResize={(size) => setStatementCollapsed(size.asPercentage < 1)}
          >
            <ProblemPanel
              problem={problem}
              isLoadingDetails={isLoadingDetails}
              activeTab={activeTab}
              onTab={setActiveTab}
              onHintsViewed={attempt.markHintsViewed}
              onVideoOpened={attempt.markVideoOpened}
              solvedBefore={solvedBefore}
            />
          </Panel>

          <Separator className="w-2 relative outline-none cursor-col-resize after:absolute after:inset-y-[40%] after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:rounded-full after:bg-transparent after:transition-colors hover:after:bg-brand-500" />

          {/* Editor and console */}
          <Panel defaultSize="56%" minSize="34%">
            <Group orientation="vertical">
              <Panel defaultSize="64%" minSize="24%">
                <section className={card} aria-label="Code">
                  <div className="h-11 pl-4 pr-2 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <LanguageMenu value={language} onChange={setLanguage} />
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs text-slate-500 transition-opacity duration-300 ${savedFlash ? 'opacity-100' : 'opacity-0'}`}
                        aria-live="polite"
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden />
                        {savedFlash ? 'Saved' : ''}
                      </span>
                    </div>
                    {score.enabled && (
                      <ScoreBar
                        state={score.state}
                        onDetails={() => score.state.analysis && setScoreModal({
                          result: { analysis: score.state.analysis, score: score.state.parts, code: score.state.code },
                          variant: 'details',
                        })}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-h-0 overflow-hidden">
                    <Editor
                      height="100%"
                      language={SUPPORTED_LANGUAGES.find((l) => l.id === language)?.monacoLang || 'javascript'}
                      theme={lightTheme ? 'daily-commit-light' : 'daily-commit'}
                      beforeMount={defineEditorTheme}
                      onMount={(editor) => {
                        // Pasted characters are a signal: a pasted solution says little about skill
                        editor.onDidPaste((e) => {
                          const model = editor.getModel();
                          if (model && e.range) attempt.recordPaste(model.getValueLengthInRange(e.range));
                        });
                      }}
                      value={code}
                      onChange={handleCodeChange}
                      options={{
                        fontSize,
                        lineHeight: Math.round(fontSize * 1.65),
                        fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Consolas, monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        renderLineHighlight: 'line',
                        guides: { indentation: false, bracketPairs: false },
                        bracketPairColorization: { enabled: false },
                        overviewRulerLanes: 0,
                        hideCursorInOverviewRuler: true,
                        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                        padding: { top: 16, bottom: 16 },
                      }}
                    />
                  </div>

                  {/* Editor toolbar */}
                  <div className="h-10 px-2 border-t border-white/[0.08] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-0.5" aria-label="Font size">
                      <button onClick={() => setFontSize((s) => Math.max(12, s - 1))} className={toolButton} aria-label="Smaller text">
                        <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <span className="w-10 text-center font-mono text-xs tabular-nums text-slate-500">{fontSize}px</span>
                      <button onClick={() => setFontSize((s) => Math.min(20, s + 1))} className={toolButton} aria-label="Larger text">
                        <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={handleResetCode} className={toolButton} title="Reset to the starter code">
                        <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Reset
                      </button>
                      <button onClick={() => copyToClipboard(code)} className={toolButton} title="Copy the code">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={toggleFullscreen}
                        className={toolButton}
                        title={isFullscreen ? 'Exit full screen' : 'Full screen'}
                        aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
                      >
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                </section>
              </Panel>

              <Separator className="h-2 relative outline-none cursor-row-resize after:absolute after:inset-x-[40%] after:top-1/2 after:h-0.5 after:-translate-y-1/2 after:rounded-full after:bg-transparent after:transition-colors hover:after:bg-brand-500" />

              <Panel
                panelRef={consolePanel}
                defaultSize="36%"
                minSize="18%"
                collapsible
                collapsedSize="44px"
                onResize={(size) => setConsoleCollapsed(size.inPixels < 48)}
              >
                <ConsolePanel
                  bottomTab={bottomTab}
                  collapsed={consoleCollapsed}
                  onShowTab={showConsoleTab}
                  onToggle={toggleConsole}
                  executionResult={executionResult}
                  sampleCases={sampleCases}
                  activeTestIndex={activeTestIndex}
                  onSelectCase={setActiveTestIndex}
                  selfRating={attempt.selfRating}
                  onRate={(value) => attempt.setSelfRating(value).then(bumpHistory)}
                  showRating={!(score.enabled && score.state.phase === 'done' && score.state.analysis)}
                  onOpenProblem={onOpenProblem}
                  next={next}
                  stuckOpen={stuckOpen}
                  onAskEasier={askForEasier}
                />
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
