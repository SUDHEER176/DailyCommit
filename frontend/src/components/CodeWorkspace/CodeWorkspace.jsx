import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import confetti from 'canvas-confetti';
import {
  Play,
  Send,
  RotateCcw,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  FileCode2,
  Settings,
  Code2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Lightbulb,
  Minus,
  Plus,
  ExternalLink
} from 'lucide-react';
import { getProblemDetails } from '../../data/problemDetails';
import { runCodeAgainstCases } from '../../services/codeExecutionService';
import { api } from '../../services/api';

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript (Node.js)', monacoLang: 'javascript' },
  { id: 'python', label: 'Python 3', monacoLang: 'python' },
  { id: 'cpp', label: 'C++ (GCC 10)', monacoLang: 'cpp' },
  { id: 'java', label: 'Java (OpenJDK 15)', monacoLang: 'java' }
];

const difficultyText = {
  Easy: 'text-emerald-400',
  Medium: 'text-amber-400',
  Hard: 'text-rose-400',
};

// Problem statements arrive as light markdown. Render **bold** and `code` instead of showing the marks.
function renderInline(text = '') {
  return String(text)
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-medium text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1 py-0.5 rounded bg-white/[0.06] font-mono text-[13px] text-slate-100">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
}

// Monaco theme on the ink ramp: the editor sits on the card surface, keywords take the brand shade.
function defineEditorTheme(monaco) {
  monaco.editor.defineTheme('daily-commit', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'dde1e9' },
      { token: 'comment', foreground: '767e92' },
      { token: 'comment.doc', foreground: '767e92' },
      { token: 'delimiter.bracket', foreground: 'a3a9b8' },
      { token: 'keyword', foreground: '4d8eff' },
      { token: 'string', foreground: 'd9a441' },
      { token: 'number', foreground: 'd9a441' },
      { token: 'type', foreground: 'a3a9b8' },
      { token: 'delimiter', foreground: 'a3a9b8' },
    ],
    colors: {
      'editor.background': '#11141c',
      'editor.foreground': '#dde1e9',
      'editorLineNumber.foreground': '#4b5565',
      'editorLineNumber.activeForeground': '#a3a9b8',
      'editor.lineHighlightBackground': '#1a1e28',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#0066ff40',
      'editor.inactiveSelectionBackground': '#0066ff22',
      'editorCursor.foreground': '#eef0f5',
      'editorIndentGuide.background1': '#1a1e28',
      'editorWidget.background': '#1a1e28',
      'editorWidget.border': '#eef0f514',
      'editorSuggestWidget.background': '#1a1e28',
      'editorSuggestWidget.border': '#eef0f514',
      'editorSuggestWidget.selectedBackground': '#232838',
      'scrollbarSlider.background': '#eef0f514',
      'scrollbarSlider.hoverBackground': '#eef0f524',
      'scrollbarSlider.activeBackground': '#eef0f530',
    },
  });
}

function getProblemSlug(prob) {
  if (!prob) return '';
  const url = prob.link || prob.problemUrl || prob.url || '';
  if (url.includes('problems/')) {
    return url.split('problems/')[1].split('/')[0].replace(/[^a-z0-9-]/gi, '').toLowerCase();
  }
  if (prob.title) {
    return prob.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  return '';
}

export default function CodeWorkspace({
  problem: initialProblem,
  onBack,
  onProblemSolved
}) {
  const [problem, setProblem] = useState(() => getProblemDetails(initialProblem));
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'solution' | 'submissions'
  const [activeTestIndex, setActiveTestIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [bottomTab, setBottomTab] = useState('testcases'); // 'testcases' | 'result' | 'console'
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  // Load problem details and fetch official LeetCode statements & snippets
  useEffect(() => {
    const localDetails = getProblemDetails(initialProblem);
    setProblem(localDetails);

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
        contentHtml: remoteData.contentHtml,
        starterTemplates: {
          ...(prev?.starterTemplates || {}),
          ...(remoteData.starterTemplates || {})
        },
        sampleTestCases: remoteData.sampleTestCases?.length ? remoteData.sampleTestCases : prev?.sampleTestCases,
        examples: remoteData.examples?.length ? remoteData.examples : prev?.examples,
        constraints: remoteData.constraints?.length ? remoteData.constraints : prev?.constraints
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

  // Load starter code or saved draft from localStorage
  useEffect(() => {
    if (!problem) return;
    const storageKey = `code_${problem.id}_${language}`;
    const saved = localStorage.getItem(storageKey);

    // If saved draft was an old placeholder, upgrade to real official template
    const isGenericFallback = saved && (
      saved.includes('// Write your code here') || 
      saved.includes('// Write your solution here') ||
      saved.includes('function happyNumber(') ||
      saved.trim() === ''
    );

    if (saved && !isGenericFallback) {
      setCode(saved);
    } else if (problem.starterTemplates && problem.starterTemplates[language]) {
      setCode(problem.starterTemplates[language]);
    } else {
      setCode('// Write your solution here\n');
    }
    setExecutionResult(null);
  }, [problem?.id, problem?.starterTemplates?.[language], language]);

  // Save code changes to localStorage
  const handleCodeChange = (newVal) => {
    const val = newVal ?? '';
    setCode(val);
    if (problem) {
      localStorage.setItem(`code_${problem.id}_${language}`, val);
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
    setBottomTab('result');

    try {
      const testCases = problem.sampleTestCases || [];
      const res = await runCodeAgainstCases(language, code, testCases);
      setExecutionResult({
        type: 'run',
        ...res
      });
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
    }
  };

  // Submit Solution against all sample + hidden test cases
  const handleSubmitCode = async () => {
    if (!problem || isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setBottomTab('result');

    try {
      const allCases = [
        ...(problem.sampleTestCases || []),
        ...(problem.hiddenTestCases || [])
      ];
      const res = await runCodeAgainstCases(language, code, allCases);

      setExecutionResult({
        type: 'submit',
        ...res
      });

      if (res.success) {
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
  const activeCase = sampleCases[activeTestIndex] || sampleCases[0];
  const results = executionResult?.results || [];
  const passedCount = results.filter((r) => r.passed).length;

  const tabClass = (active) =>
    `relative h-full inline-flex items-center text-[13px] transition-colors ${
      active
        ? 'text-white after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-white'
        : 'text-slate-500 hover:text-slate-200'
    }`;

  const iconButton =
    'w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors';

  return (
    <div className={`flex flex-col bg-ink-900 text-slate-100 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-64px)] min-h-[640px]'}`}>
      {/* Top bar */}
      <div className="h-12 px-2 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 h-8 pl-1.5 pr-2.5 rounded-lg text-[13px] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          Problems
        </button>

        <div className="flex items-center gap-1">
          <button onClick={handleResetCode} title="Reset to the starter code" aria-label="Reset code" className={iconButton}>
            <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
            className={iconButton}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" strokeWidth={1.5} /> : <Maximize2 className="w-4 h-4" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal">
          {/* Problem statement */}
          <Panel defaultSize={44} minSize={28}>
            <div className="h-full flex flex-col bg-ink-900">
              <div className="h-10 px-6 border-b border-white/[0.08] flex items-center gap-6 flex-shrink-0">
                <button onClick={() => setActiveTab('description')} className={tabClass(activeTab === 'description')}>
                  Description
                </button>
                <button onClick={() => setActiveTab('solution')} className={tabClass(activeTab === 'solution')}>
                  Hints and topics
                </button>
                {isLoadingDetails && (
                  <span className="ml-auto font-mono text-xs text-slate-500">Loading statement</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 text-sm leading-[1.65] text-slate-300">
                {activeTab === 'description' && (
                  <>
                    <h1 className="text-xl font-medium text-white">
                      {problem.number ? `${problem.number}. ` : ''}{problem.title}
                    </h1>
                    <div className="mt-2 flex items-center gap-3 text-[13px]">
                      <span className={difficultyText[problem.difficulty] || difficultyText.Easy}>{problem.difficulty}</span>
                      {problem.topic && <span className="text-slate-500">{problem.topic}</span>}
                    </div>

                    {problem.contentHtml ? (
                      <div
                        className="problem-content-html mt-6 text-sm leading-[1.65] text-slate-300 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-4 [&_pre]:bg-ink-850 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:border [&_pre]:border-white/[0.06] [&_pre]:my-4 [&_pre]:overflow-x-auto [&_code]:bg-white/[0.06] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-slate-100 [&_code]:font-mono [&_code]:text-[13px] [&_strong]:text-white [&_strong]:font-medium [&_em]:not-italic [&_em]:text-slate-200 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-4 [&_img]:border [&_img]:border-white/[0.08]"
                        dangerouslySetInnerHTML={{ __html: problem.contentHtml }}
                      />
                    ) : (
                      <>
                        <div className="mt-6 space-y-4 whitespace-pre-line">
                          {renderInline(problem.description)}
                        </div>

                        {problem.examples?.length > 0 && (
                          <div className="mt-8 space-y-3">
                            {problem.examples.map((ex, idx) => (
                              <div key={idx}>
                                <p className="text-[13px] text-white">Example {idx + 1}</p>
                                <dl className="mt-2 rounded-xl bg-ink-850 border border-white/[0.06] p-4 font-mono text-[13px] leading-[1.7] grid grid-cols-[88px_minmax(0,1fr)] gap-x-2">
                                  <dt className="text-slate-500">Input</dt>
                                  <dd className="text-slate-200 break-words">{ex.input}</dd>
                                  <dt className="text-slate-500">Output</dt>
                                  <dd className="text-slate-200">{ex.output}</dd>
                                  {ex.explanation && (
                                    <>
                                      <dt className="text-slate-500">Why</dt>
                                      <dd className="text-slate-400 font-sans text-[13px]">{ex.explanation}</dd>
                                    </>
                                  )}
                                </dl>
                              </div>
                            ))}
                          </div>
                        )}

                        {problem.constraints?.length > 0 && (
                          <div className="mt-8">
                            <p className="text-[13px] text-white">Constraints</p>
                            <ul className="mt-2 space-y-1 font-mono text-[13px] text-slate-400">
                              {problem.constraints.map((c, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-slate-600" aria-hidden>·</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {activeTab === 'solution' && (
                  <div>
                    <h2 className="text-[15px] font-medium text-white">Topics and approach</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      This problem mostly tests <span className="text-white">{problem.topic || 'data structures'}</span>.
                      Try it on your own first, then come back here if you get stuck.
                    </p>
                    {problem.video && (
                      <a
                        href={problem.video}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-[13px] text-white transition-colors"
                      >
                        Watch the NeetCode explanation
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Separator className="w-px bg-white/[0.08] hover:bg-brand-500 active:bg-brand-500 transition-colors cursor-col-resize relative after:absolute after:inset-y-0 after:-inset-x-1.5" />

          {/* Editor and console */}
          <Panel defaultSize={56} minSize={34}>
            <Group orientation="vertical">
              <Panel defaultSize={64} minSize={28}>
                <div className="h-full flex flex-col bg-ink-850">
                  <div className="h-10 pl-4 pr-2 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      aria-label="Language"
                      className="h-8 -ml-2 pl-2 pr-7 rounded-lg bg-transparent hover:bg-white/[0.06] text-[13px] text-slate-200 border-0 focus:outline-none cursor-pointer appearance-none bg-no-repeat bg-[right_8px_center] bg-[length:12px] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23767e92%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')]"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id} className="bg-ink-850">
                          {lang.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1" aria-label="Font size">
                      <button onClick={() => setFontSize((s) => Math.max(12, s - 1))} className={iconButton} aria-label="Smaller text">
                        <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <span className="w-8 text-center font-mono text-xs tabular-nums text-slate-500">{fontSize}px</span>
                      <button onClick={() => setFontSize((s) => Math.min(20, s + 1))} className={iconButton} aria-label="Larger text">
                        <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <Editor
                      height="100%"
                      language={SUPPORTED_LANGUAGES.find((l) => l.id === language)?.monacoLang || 'javascript'}
                      theme="daily-commit"
                      beforeMount={defineEditorTheme}
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
                </div>
              </Panel>

              <Separator className="h-px bg-white/[0.08] hover:bg-brand-500 active:bg-brand-500 transition-colors cursor-row-resize relative after:absolute after:inset-x-0 after:-inset-y-1.5" />

              <Panel defaultSize={36} minSize={20}>
                <div className="h-full flex flex-col bg-ink-900">
                  <div className="h-11 pl-4 pr-2 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
                    <div className="h-full flex items-center gap-6">
                      <button onClick={() => setBottomTab('testcases')} className={tabClass(bottomTab === 'testcases')}>
                        Test cases
                      </button>
                      <button onClick={() => setBottomTab('result')} className={`${tabClass(bottomTab === 'result')} gap-2`}>
                        Result
                        {executionResult && (
                          <span className={`w-1.5 h-1.5 rounded-full ${executionResult.success ? 'bg-emerald-400' : 'bg-rose-400'}`} aria-hidden />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRunCode}
                        disabled={isRunning || isSubmitting}
                        className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-[13px] text-white transition-colors active:scale-[0.98] disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                        {isRunning ? 'Running' : 'Run'}
                      </button>
                      <button
                        onClick={handleSubmitCode}
                        disabled={isRunning || isSubmitting}
                        className="btn-primary-glow inline-flex items-center gap-2 h-8 px-3 rounded-lg text-[13px] font-medium active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSubmitting ? 'Submitting' : 'Submit'}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {bottomTab === 'testcases' && (
                      <div>
                        <div className="flex items-center gap-1">
                          {sampleCases.map((c, i) => (
                            <button
                              key={c.id || i}
                              onClick={() => setActiveTestIndex(i)}
                              className={`h-8 px-3 rounded-lg text-[13px] transition-colors ${
                                activeTestIndex === i
                                  ? 'bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                                  : 'text-slate-500 hover:text-white'
                              }`}
                            >
                              Case {i + 1}
                            </button>
                          ))}
                        </div>

                        {activeCase ? (
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                              <p className="text-xs text-slate-500">Input</p>
                              <pre className="mt-2 p-3 rounded-[10px] bg-ink-850 border border-white/[0.06] font-mono text-[13px] text-slate-200 whitespace-pre-wrap">{activeCase.input}</pre>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Expected</p>
                              <pre className="mt-2 p-3 rounded-[10px] bg-ink-850 border border-white/[0.06] font-mono text-[13px] text-slate-200 whitespace-pre-wrap">{activeCase.expected}</pre>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 text-[13px] text-slate-500">This problem has no sample cases yet</p>
                        )}
                      </div>
                    )}

                    {bottomTab === 'result' && (
                      !executionResult ? (
                        <div className="h-full min-h-[120px] flex items-center justify-center text-[13px] text-slate-500">
                          Run to check the sample cases, or submit to check them all
                        </div>
                      ) : (
                        <div>
                          {/* Verdict: the moment of this screen */}
                          <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                              <div className={`text-[22px] leading-none font-medium ${executionResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {executionResult.verdict}
                              </div>
                              <div className="mt-2 text-xs text-slate-500">
                                {executionResult.type === 'submit' ? 'All test cases' : 'Sample cases'} ·{' '}
                                <span className="font-mono tabular-nums">{passedCount} / {results.length} passed</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-[22px] leading-none tabular-nums text-white">
                                {executionResult.runtimeMs}<span className="ml-1 text-[13px] text-slate-500">ms</span>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">Runtime</div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-1" aria-label={`${passedCount} of ${results.length} cases passed`}>
                            {results.map((r, i) => (
                              <span
                                key={i}
                                title={`Case ${r.testCaseIndex}: ${r.passed ? 'passed' : 'failed'}`}
                                className={`w-3 h-3 rounded-[3px] ${r.passed ? 'bg-brand-500' : 'bg-rose-500'}`}
                              />
                            ))}
                          </div>

                          <ul className="mt-6 divide-y divide-white/[0.06] border-t border-white/[0.06]">
                            {results.map((res, i) => (
                              <li key={i} className="py-3 font-mono text-[13px]">
                                <div className="flex items-center justify-between font-sans">
                                  <span className="text-slate-300">Case {res.testCaseIndex}</span>
                                  <span className={res.passed ? 'text-emerald-400' : 'text-rose-400'}>
                                    {res.passed ? 'Passed' : 'Failed'}
                                  </span>
                                </div>
                                {res.error ? (
                                  <p className="mt-2 text-rose-400 whitespace-pre-wrap">{res.error}</p>
                                ) : (
                                  <dl className="mt-2 grid grid-cols-[80px_minmax(0,1fr)] gap-x-2 gap-y-1">
                                    <dt className="text-slate-500">Output</dt>
                                    <dd className={res.passed ? 'text-slate-200' : 'text-rose-400'}>{res.actual}</dd>
                                    <dt className="text-slate-500">Expected</dt>
                                    <dd className="text-slate-200">{res.expected}</dd>
                                  </dl>
                                )}
                                {res.logs && (
                                  <pre className="mt-2 p-2 rounded-lg bg-ink-850 text-xs text-slate-400 whitespace-pre-wrap">{res.logs}</pre>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
