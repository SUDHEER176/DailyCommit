import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Code2, ExternalLink,
  FileText, PlayCircle, Search, Sliders, Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import PlannerWizardModal from './PlannerWizardModal';
import TopicRoadmap from './TopicRoadmap';
import { AchievementsCard, buildAchievements } from '../StreakAndAchievements';
import CodeWorkspace from '../CodeWorkspace/CodeWorkspace';
import { PageLoader } from '../ui/Spinner';
import neetcodeList from '../../data/neetcode150.json';

// Topic and problem order of the DailyCode 150 list, used by the sheet view
const TOPIC_ORDER = Array.from(new Set(neetcodeList.map((p) => p.topic)));
const ORDER_INDEX = Object.fromEntries(neetcodeList.map((p, i) => [p.id, i]));
const topicAnchor = (topic) => 'topic-' + topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default function PersonalizedPlannerView({
  onNavigate,
  onOpenWizardDirect = false,
  onClose
}) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(onOpenWizardDirect);
  const [selectedDayNum, setSelectedDayNum] = useState(1);
  const [expandedNotesId, setExpandedNotesId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sheet'); // 'sheet' | 'daily' | 'revision' | 'all'
  const [openTopics, setOpenTopics] = useState(() => new Set());
  const [sheetQuery, setSheetQuery] = useState('');
  const [sheetDifficulty, setSheetDifficulty] = useState('All');
  const [hideSolved, setHideSolved] = useState(false);
  const [calOffset, setCalOffset] = useState(0);
  const [activeCodeProblem, setActiveCodeProblem] = useState(null);

  // Load study plan
  const loadPlan = async () => {
    setLoading(true);
    try {
      const activePlan = await api.getStudyPlan();
      if (activePlan && activePlan.days) {
        setPlan(activePlan);
        // Default to today's day number or day 1
        const todayStr = new Date().toISOString().split('T')[0];
        const matchToday = activePlan.days.find(d => d.date === todayStr);
        if (matchToday) {
          setSelectedDayNum(matchToday.dayNumber);
        } else {
          // If past or future, find first incomplete day or day 1
          const firstIncomplete = activePlan.days.find(d => !d.isFullyCompleted);
          setSelectedDayNum(firstIncomplete ? firstIncomplete.dayNumber : 1);
        }
      } else {
        // No plan yet, prompt wizard
        setIsWizardOpen(true);
      }
    } catch (e) {
      console.warn("Error fetching study plan", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  // Open the first topic that still has unsolved problems
  useEffect(() => {
    if (!plan?.days || openTopics.size > 0) return;
    const all = plan.days.flatMap((d) => d.questions);
    const first = TOPIC_ORDER.find((t) => all.some((q) => q.topic === t && !q.completed)) || TOPIC_ORDER[0];
    setOpenTopics(new Set([first]));
  }, [plan]);

  // Handle plan generation from wizard
  const plannerTopRef = React.useRef(null);
  const handlePlanGenerated = async (config) => {
    const newPlan = await api.generateStudyPlan(config);
    setPlan(newPlan);
    if (newPlan && newPlan.days) {
      // Open the new plan on the first day that has work left, usually today's Day 1
      const firstOpen = newPlan.days.find((d) => !d.isFullyCompleted) || newPlan.days[0];
      setSelectedDayNum(firstOpen.dayNumber);
      setActiveTab('daily');
      setOpenTopics(new Set());
      // Wait for the wizard to close and the plan to render, then bring the plan into view
      setTimeout(() => {
        plannerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  };

  // Toggle problem completion
  const handleToggleComplete = async (question) => {
    if (!question) return;
    const nextCompleted = !question.completed;
    if (nextCompleted) {
      confetti({ particleCount: 28, spread: 50, origin: { y: 0.7 }, colors: ['#0066FF', '#4d8eff', '#a3a9b8'], disableForReducedMotion: true });
    }
    const updatedPlan = await api.updatePlannedQuestion(question.id, {
      completed: nextCompleted
    });
    if (updatedPlan) setPlan({ ...updatedPlan });
  };

  // Toggle difficulty flag
  const handleToggleDifficult = async (question) => {
    if (!question) return;
    const nextDifficult = !question.isDifficult;
    const updatedPlan = await api.updatePlannedQuestion(question.id, {
      isDifficult: nextDifficult
    });
    if (updatedPlan) setPlan({ ...updatedPlan });
  };

  // Set solve independence status
  const handleSetSolveStatus = async (question, status) => {
    if (!question) return;
    const updatedPlan = await api.updatePlannedQuestion(question.id, {
      solveStatus: status
    });
    if (updatedPlan) setPlan({ ...updatedPlan });
  };

  // Save notes
  const handleSaveNotes = async (question, text) => {
    if (!question) return;
    const updatedPlan = await api.updatePlannedQuestion(question.id, {
      notes: text
    });
    if (updatedPlan) setPlan({ ...updatedPlan });
  };

  // Intelligent Carry Forward
  const handleCarryForward = async () => {
    setActionLoading(true);
    try {
      const updatedPlan = await api.carryForwardPlannedQuestions();
      if (updatedPlan) {
        setPlan({ ...updatedPlan });
        
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Identify selected day and stats
  const activeDay = plan?.days?.find(d => d.dayNumber === selectedDayNum) || plan?.days?.[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = activeDay?.date === todayStr;

  // Check for past overdue questions
  const overdueQuestions = [];
  if (plan?.days) {
    plan.days.forEach(d => {
      if (d.date < todayStr) {
        d.questions.forEach(q => {
          if (!q.completed) overdueQuestions.push(q);
        });
      }
    });
  }

  // Overall metrics
  const totalQuestionsCount = plan?.totalQuestions || 150;
  const completedQuestionsCount = plan?.completedCount || 0;
  const overallPercent = Math.round((completedQuestionsCount / totalQuestionsCount) * 100);

  const dayCompletedCount = activeDay?.questions?.filter(q => q.completed).length || 0;
  const dayTotalCount = activeDay?.questions?.length || 0;
  const dayPercent = dayTotalCount > 0 ? Math.round((dayCompletedCount / dayTotalCount) * 100) : 0;

  const daysCount = plan?.days?.length || 45;
  const revisionCount = plan?.revisionQueue?.length || 0;
  const level = plan?.config?.level || 'intermediate';
  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);
  const hoursLeft = Math.round(((150 - completedQuestionsCount) * (level === 'beginner' ? 45 : 30)) / 60);

  const fmtDate = (iso, opts = { month: 'short', day: 'numeric' }) => {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', opts);
  };

  const dayLevel = (d) => {
    const total = d.questions?.length || 0;
    const done = d.questions?.filter((q) => q.completed).length || 0;
    if (!total || !done) return 0;
    if (done === total) return 4;
    return done / total >= 0.5 ? 3 : 2;
  };

  const difficultyText = {
    Easy: 'text-emerald-400',
    Medium: 'text-amber-400',
    Hard: 'text-rose-400',
  };

  const tabClass = (active) =>
    `relative h-full inline-flex items-center gap-2 text-[13px] transition-colors ${
      active
        ? 'text-white after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-white'
        : 'text-slate-500 hover:text-slate-200'
    }`;

  const iconButton = (on) =>
    `w-8 h-8 grid place-items-center rounded-lg transition-colors ${
      on ? 'text-white bg-white/[0.06]' : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
    }`;

  const secondary =
    'inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-[13px] text-white transition-colors active:scale-[0.98] disabled:opacity-50';

  const solveOptions = [
    { key: 'independent', label: 'Solo', title: 'Solved on my own', on: 'text-emerald-400' },
    { key: 'hint', label: 'Hint', title: 'Needed a hint', on: 'text-amber-400' },
    { key: 'solution', label: 'Solution', title: 'Read the solution', on: 'text-rose-400' },
  ];

  // ── Topic sheet: every problem grouped by topic, in NeetCode order ──
  const allQuestions = plan?.days?.flatMap((d) => d.questions) || [];
  const byTopic = TOPIC_ORDER.map((topic) => ({
    topic,
    items: allQuestions
      .filter((q) => q.topic === topic)
      .sort((a, b) => (ORDER_INDEX[a.id] ?? 999) - (ORDER_INDEX[b.id] ?? 999)),
  })).filter((t) => t.items.length > 0);

  const query = sheetQuery.trim().toLowerCase();
  const matches = (q) =>
    (sheetDifficulty === 'All' || q.difficulty === sheetDifficulty) &&
    (!hideSolved || !q.completed) &&
    (!query || q.title.toLowerCase().includes(query) || String(q.number).includes(query));
  const filtering = query !== '' || sheetDifficulty !== 'All' || hideSolved;

  const toggleTopic = (topic) =>
    setOpenTopics((prev) => {
      const next = new Set(prev);
      next.has(topic) ? next.delete(topic) : next.add(topic);
      return next;
    });

  const linkButton =
    'w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors';

  const renderSheetRow = (q) => {
    const notesOpen = expandedNotesId === q.id;
    return (
      <React.Fragment key={q.id}>
        <tr className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
          <td className="pl-6 pr-2 py-2 w-12 align-middle">
            <button
              onClick={() => handleToggleComplete(q)}
              aria-label={q.completed ? `Mark ${q.title} not solved` : `Mark ${q.title} solved`}
              className="block rounded-[4px]"
            >
              {q.completed ? (
                <span className="grid place-items-center w-4 h-4 rounded-[4px] bg-brand-500 text-white">
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                </span>
              ) : (
                <span className="block w-4 h-4 rounded-[4px] border border-white/[0.14] hover:border-white/30 transition-colors" />
              )}
            </button>
          </td>
          <td className="px-2 py-2 align-middle">
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="w-8 flex-shrink-0 font-mono text-xs tabular-nums text-slate-500">{q.number}</span>
              <span className={`text-sm truncate ${q.completed ? 'text-slate-500 line-through decoration-slate-600' : 'text-white'}`}>
                {q.title}
              </span>
            </div>
            {q.notes && !notesOpen && (
              <p className="mt-0.5 pl-11 text-xs text-slate-500 truncate">Note · {q.notes}</p>
            )}
          </td>
          <td className="px-2 py-2 w-[128px] align-middle">
            <div className="flex items-center gap-0.5">
              <button onClick={() => setActiveCodeProblem(q)} className={linkButton} title="Solve in the editor" aria-label={`Solve ${q.title} in the editor`}>
                <Code2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
              {q.url && (
                <a href={q.url} target="_blank" rel="noopener noreferrer" className={linkButton} title="Open on LeetCode" aria-label={`Open ${q.title} on LeetCode`}>
                  <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                </a>
              )}
              {q.video && (
                <a href={q.video} target="_blank" rel="noopener noreferrer" className={linkButton} title="Video explanation" aria-label={`Video explanation for ${q.title}`}>
                  <PlayCircle className="w-4 h-4" strokeWidth={1.5} />
                </a>
              )}
            </div>
          </td>
          <td className={`px-2 py-2 w-24 align-middle text-[13px] ${difficultyText[q.difficulty] || 'text-slate-400'}`}>{q.difficulty}</td>
          <td className="px-2 py-2 w-20 align-middle">
            <button
              onClick={() => handleToggleDifficult(q)}
              className={iconButton(q.isDifficult)}
              aria-pressed={!!q.isDifficult}
              aria-label={q.isDifficult ? `Remove ${q.title} from revision` : `Star ${q.title} for revision`}
              title={q.isDifficult ? 'Starred for revision' : 'Star for revision'}
            >
              <Star className={`w-4 h-4 ${q.isDifficult ? 'fill-current' : ''}`} strokeWidth={1.5} />
            </button>
          </td>
          <td className="pl-2 pr-6 py-2 w-20 align-middle">
            <button
              onClick={() => setExpandedNotesId(notesOpen ? null : q.id)}
              className={iconButton(q.notes || notesOpen)}
              aria-expanded={notesOpen}
              aria-label={`Notes for ${q.title}`}
              title="Notes on mistakes and approach"
            >
              <FileText className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </td>
        </tr>
        {notesOpen && (
          <tr>
            <td colSpan={6} className="px-6 pb-4">
              <textarea
                rows={2}
                defaultValue={q.notes || ''}
                onBlur={(e) => handleSaveNotes(q, e.target.value)}
                aria-label={`Notes for ${q.title}`}
                placeholder="What tripped you up, and what worked"
                className="ml-[72px] w-[calc(100%-72px)] rounded-[10px] bg-ink-800 border border-white/[0.08] p-3 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  const renderSheet = () => (
    <div className="space-y-4">
      <TopicRoadmap
        solved={completedQuestionsCount}
        total={allQuestions.length || 150}
        progress={Object.fromEntries(byTopic.map(({ topic, items }) => [topic, { done: items.filter((q) => q.completed).length, total: items.length }]))}
        onSelect={(topic) => {
          setSheetQuery('');
          setSheetDifficulty('All');
          setHideSolved(false);
          setOpenTopics(new Set([topic]));
          setTimeout(() => document.getElementById(topicAnchor(topic))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        }}
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={1.5} />
          <input
            type="search"
            value={sheetQuery}
            onChange={(e) => setSheetQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search problems"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-ink-850 border border-white/[0.08] text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex items-center h-9 p-0.5 rounded-lg border border-white/[0.08] w-fit" role="group" aria-label="Difficulty">
          {['All', 'Easy', 'Medium', 'Hard'].map((level) => (
            <button
              key={level}
              onClick={() => setSheetDifficulty(level)}
              aria-pressed={sheetDifficulty === level}
              className={`h-full px-3 rounded-md text-xs transition-colors ${
                sheetDifficulty === level ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 h-9 px-1 text-[13px] text-slate-400 cursor-pointer select-none">
          <input type="checkbox" checked={hideSolved} onChange={(e) => setHideSolved(e.target.checked)} className="peer sr-only" />
          <span className="grid place-items-center w-4 h-4 rounded-[4px] border border-white/[0.14] peer-checked:bg-brand-500 peer-checked:border-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 text-white">
            {hideSolved && <Check className="w-3 h-3" strokeWidth={2.5} />}
          </span>
          Hide solved
        </label>

        <div className="md:ml-auto flex items-center gap-1">
          <button onClick={() => setOpenTopics(new Set(byTopic.map((t) => t.topic)))} className="h-9 px-3 rounded-lg text-[13px] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            Expand all
          </button>
          <button onClick={() => setOpenTopics(new Set())} className="h-9 px-3 rounded-lg text-[13px] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            Collapse all
          </button>
        </div>
      </div>

      {/* Topics */}
      <div className="rounded-2xl bg-ink-850 border border-white/[0.08] overflow-hidden divide-y divide-white/[0.08]">
        {byTopic.map(({ topic, items }, i) => {
          const done = items.filter((q) => q.completed).length;
          const visible = items.filter(matches);
          if (filtering && visible.length === 0) return null;
          const open = filtering || openTopics.has(topic);
          const complete = done === items.length;
          return (
            <section key={topic} id={topicAnchor(topic)} className="scroll-mt-6">
              <h3>
                <button
                  onClick={() => toggleTopic(topic)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-4 h-14 px-6 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="w-6 font-mono text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 flex items-center gap-2 min-w-0 text-[15px] text-white">
                    <span className="truncate">{topic}</span>
                    {complete && <span className="cell" data-level="4" aria-label="All solved" />}
                  </span>
                  <span className="hidden sm:block w-32 h-1 rounded-full bg-white/[0.06] overflow-hidden" aria-hidden>
                    <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(done / items.length) * 100}%` }} />
                  </span>
                  <span className="w-14 text-right font-mono text-xs tabular-nums text-slate-400">{done} / {items.length}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </button>
              </h3>

              {open && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead>
                      <tr className="text-xs text-slate-500">
                        <th scope="col" className="pl-6 pr-2 h-9 font-normal w-12">Done</th>
                        <th scope="col" className="px-2 h-9 font-normal">Problem</th>
                        <th scope="col" className="px-2 h-9 font-normal w-[128px]">Practice</th>
                        <th scope="col" className="px-2 h-9 font-normal w-24">Difficulty</th>
                        <th scope="col" className="px-2 h-9 font-normal w-20">Revision</th>
                        <th scope="col" className="pl-2 pr-6 h-9 font-normal w-20">Notes</th>
                      </tr>
                    </thead>
                    <tbody>{(filtering ? visible : items).map(renderSheetRow)}</tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
        {filtering && byTopic.every(({ items }) => items.filter(matches).length === 0) && (
          <p className="px-6 py-12 text-center text-[13px] text-slate-500">No problems match these filters</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <PageLoader label="Loading your plan" className="min-h-[400px]" />
    );
  }

  if (activeCodeProblem) {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-ink-900 animate-fadeIn">
        <CodeWorkspace
          problem={activeCodeProblem}
          onBack={() => setActiveCodeProblem(null)}
          onProblemSolved={() => handleToggleComplete(activeCodeProblem)}
        />
      </div>
    );
  }

  const renderQuestion = (q, idx) => {
    const isNotesOpen = expandedNotesId === q.id;
    return (
      <li key={q.id || idx} className={`flex flex-col p-5 rounded-2xl border transition-colors ${
        q.completed ? 'bg-ink-850 border-white/[0.06]' : 'bg-ink-850 border-white/[0.08] hover:border-white/[0.14]'
      }`}>
        <div className="flex items-start gap-3">
          <button
            onClick={() => handleToggleComplete(q)}
            aria-label={q.completed ? `Mark ${q.title} not solved` : `Mark ${q.title} solved`}
            title={q.completed ? 'Mark not solved' : 'Mark solved'}
            className="mt-0.5 flex-shrink-0 rounded-[4px]"
          >
            {q.completed ? (
              <span className="grid place-items-center w-4 h-4 rounded-[4px] bg-brand-500 text-white">
                <Check className="w-3 h-3" strokeWidth={2.5} />
              </span>
            ) : (
              <span className="block w-4 h-4 rounded-[4px] border border-white/[0.14] hover:border-white/30 transition-colors" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className={`text-[15px] leading-5 ${q.completed ? 'text-slate-500 line-through decoration-slate-600' : 'text-white'}`}>
              {q.title}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
              <span className="font-mono tabular-nums text-slate-500">{q.number}</span>
              <span className={difficultyText[q.difficulty] || 'text-slate-400'}>{q.difficulty}</span>
              <span className="text-slate-500">· {q.topic}</span>
              <span className="font-mono tabular-nums text-slate-500">· {q.estimatedMinutes || 25} min</span>
            </div>
          </div>
        </div>

        {q.notes && !isNotesOpen && (
          <p className="mt-3 pl-7 text-xs text-slate-400 line-clamp-2"><span className="text-slate-500">Note · </span>{q.notes}</p>
        )}

        {isNotesOpen && (
          <textarea
            rows={2}
            autoFocus
            defaultValue={q.notes || ''}
            onBlur={(e) => handleSaveNotes(q, e.target.value)}
            aria-label={`Notes for ${q.title}`}
            placeholder="What tripped you up, and what worked"
            className="mt-3 w-full rounded-[10px] bg-ink-800 border border-white/[0.08] p-3 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        )}

        <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-1">
          <div className="flex items-center h-8 p-0.5 rounded-lg border border-white/[0.08]" role="group" aria-label="How you solved it">
            {solveOptions.map((o) => {
              const on = q.solveStatus === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => handleSetSolveStatus(q, o.key)}
                  title={o.title}
                  aria-pressed={on}
                  className={`h-full px-2 rounded-md text-xs transition-colors ${on ? `bg-white/[0.06] ${o.on}` : 'text-slate-500 hover:text-white'}`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => handleToggleDifficult(q)}
            className={iconButton(q.isDifficult)}
            aria-pressed={!!q.isDifficult}
            aria-label={q.isDifficult ? 'Remove from revision' : 'Star for revision'}
            title={q.isDifficult ? 'Starred for revision' : 'Star for revision'}
          >
            <Star className={`w-4 h-4 ${q.isDifficult ? 'fill-current' : ''}`} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setExpandedNotesId(isNotesOpen ? null : q.id)}
            className={iconButton(q.notes || isNotesOpen)}
            aria-expanded={isNotesOpen}
            aria-label="Notes"
            title="Notes on mistakes and approach"
          >
            <FileText className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setActiveCodeProblem(q)}
            className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-[13px] text-white transition-colors active:scale-[0.98]"
            title="Open in the code editor"
          >
            Solve
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
          </button>
        </div>
      </li>
    );
  };

  // ── Overview boxes: solved ring, streak calendar, plan summary ──
  const dateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const solvesByDay = {};
  (plan?.days?.flatMap((d) => d.questions) || []).forEach((q) => {
    if (!q.completed || !q.completedAt) return;
    const k = dateKey(new Date(q.completedAt));
    solvesByDay[k] = (solvesByDay[k] || 0) + 1;
  });

  const todayDate = new Date();
  const todayKey = dateKey(todayDate);
  const currentStreak = (() => {
    const d = new Date(todayDate);
    if (!solvesByDay[todayKey]) d.setDate(d.getDate() - 1); // today still counts until midnight
    let n = 0;
    while (solvesByDay[dateKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  })();
  const longestStreak = (() => {
    const keys = Object.keys(solvesByDay).sort();
    let best = 0, run = 0, prev = null;
    keys.forEach((k) => {
      const t = new Date(`${k}T00:00:00`).getTime();
      run = prev !== null && t - prev === 86400000 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = t;
    });
    return best;
  })();

  const calMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + calOffset, 1);
  const calDays = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const calLead = calMonth.getDay();
  const solvedThisMonth = Array.from({ length: calDays }, (_, i) =>
    solvesByDay[dateKey(new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1))] ? 1 : 0
  ).reduce((a, b) => a + b, 0);

  const ringParts = (() => {
    const list = plan?.days?.flatMap((d) => d.questions) || [];
    const parts = [
      { level: 'Easy', color: '#2fa872', track: 'rgba(47,168,114,0.3)', text: 'text-emerald-400' },
      { level: 'Medium', color: '#c78f2a', track: 'rgba(199,143,42,0.3)', text: 'text-amber-400' },
      { level: 'Hard', color: '#e5484d', track: 'rgba(229,72,77,0.3)', text: 'text-rose-400' },
    ].map((p) => {
      const items = list.filter((q) => q.difficulty === p.level);
      return { ...p, total: items.length, done: items.filter((q) => q.completed).length };
    });
    const sum = parts.reduce((a, p) => a + p.total, 0) || 1;
    let start = 0;
    return parts.map((p) => {
      const share = p.total / sum;
      const out = { ...p, start, share };
      start += share;
      return out;
    });
  })();

  const solvedTimes = (plan?.days?.flatMap((d) => d.questions) || [])
    .filter((q) => q.completed && q.completedAt)
    .map((q) => q.completedAt)
    .sort();
  const finishedTopics = byTopic.filter(({ items }) => items.length && items.every((q) => q.completed));
  const topicDates = finishedTopics
    .map(({ items }) => items.map((q) => q.completedAt).filter(Boolean).sort().pop())
    .filter(Boolean)
    .sort();
  const plannerAchievements = buildAchievements({
    solved: completedQuestionsCount,
    longestStreak,
    topicsDone: finishedTopics.length,
    dates: { first: solvedTimes[0], fifty: solvedTimes[49], topic: topicDates[0] },
  });

  const renderOverview = () => {
    const R = 62;
    const C = 2 * Math.PI * R;
    const GAP = 0.012;
    const solvedTotal = ringParts.reduce((a, p) => a + p.done, 0);
    const totalAll = ringParts.reduce((a, p) => a + p.total, 0) || 150;
    const todayPlan = plan?.days?.find((d) => d.date === todayStr);
    const todayDone = todayPlan?.questions?.filter((q) => q.completed).length || 0;
    const todayTotal = todayPlan?.questions?.length || 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        {/* Solved ring */}
        <section className="xl:col-span-5 p-6 rounded-2xl bg-ink-850 border border-white/[0.08] flex flex-col">
          <h2 className="text-[15px] font-medium text-white">Solved</h2>
          <div className="flex-1 mt-4 flex items-center gap-8">
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" role="img"
                aria-label={ringParts.map((p) => `${p.level} ${p.done} of ${p.total}`).join(', ')}>
                {ringParts.map((p) => (
                  <g key={p.level}>
                    <circle cx="80" cy="80" r={R} fill="none" stroke={p.track} strokeWidth="10"
                      strokeDasharray={`${Math.max(0, p.share - GAP) * C} ${C}`} strokeDashoffset={-p.start * C} />
                    {p.done > 0 && (
                      <circle cx="80" cy="80" r={R} fill="none" stroke={p.color} strokeWidth="10"
                        strokeDasharray={`${Math.max(0, p.share - GAP) * C * (p.done / p.total)} ${C}`}
                        strokeDashoffset={-p.start * C}
                        className="transition-[stroke-dasharray] duration-500 ease-out" />
                    )}
                  </g>
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-[32px] leading-none font-medium tabular-nums text-white">{solvedTotal}</span>
                <span className="mt-1 font-mono text-xs tabular-nums text-slate-500">of {totalAll}</span>
              </div>
            </div>

            <ul className="flex-1">
              {ringParts.map((p) => (
                <li key={p.level} className="flex items-center justify-between gap-4 h-10 border-b border-white/[0.06] last:border-b-0">
                  <span className="flex items-center gap-2 text-[13px] text-slate-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                    {p.level}
                  </span>
                  <span className="font-mono text-[13px] tabular-nums text-white">
                    {p.done}<span className="text-slate-500"> / {p.total}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Streak calendar */}
        <section className="xl:col-span-4 p-6 rounded-2xl bg-ink-850 border border-white/[0.08]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-medium text-white">Daily streak</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="cell !w-4 !h-4 !rounded-[4px]" data-level={currentStreak > 0 ? 4 : 0} aria-hidden />
                <div>
                  <div className="font-mono text-[24px] leading-none font-medium tabular-nums text-white">
                    {currentStreak}<span className="ml-2 font-sans text-[13px] font-normal text-slate-500">{currentStreak === 1 ? 'day' : 'days'}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Longest {longestStreak}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCalOffset((o) => o - 1)} className={iconButton(false)} aria-label="Previous month">
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button onClick={() => setCalOffset((o) => Math.min(0, o + 1))} disabled={calOffset >= 0}
                className={`${iconButton(false)} disabled:opacity-30 disabled:pointer-events-none`} aria-label="Next month">
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between text-xs">
            <span className="text-slate-300">{calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            <span className="font-mono tabular-nums text-slate-500">{solvedThisMonth} active days</span>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="h-5 grid place-items-center font-mono text-[11px] text-slate-500">{d}</span>
            ))}
            {Array.from({ length: calLead }).map((_, i) => <span key={`e${i}`} aria-hidden />)}
            {Array.from({ length: calDays }, (_, i) => {
              const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1);
              const k = dateKey(date);
              const n = solvesByDay[k] || 0;
              const lvl = n === 0 ? 0 : n === 1 ? 2 : n === 2 ? 3 : 4;
              const future = date > todayDate;
              const isTodayCell = k === todayKey;
              return (
                <span
                  key={k}
                  data-level={lvl}
                  title={future ? undefined : `${n} solved`}
                  className={`cell !w-full !h-7 !rounded-md grid place-items-center font-mono text-[11px] tabular-nums ${
                    future ? '!bg-transparent text-slate-600' : lvl >= 3 ? 'text-white' : lvl > 0 ? 'text-white' : 'text-slate-500'
                  } ${isTodayCell ? 'ring-1 ring-white ring-offset-1 ring-offset-ink-850' : ''}`}
                >
                  {i + 1}
                </span>
              );
            })}
          </div>
        </section>

        {/* Achievements, from real solve history */}
        <AchievementsCard className="md:col-span-2 xl:col-span-3" achievements={plannerAchievements} />
      </div>
    );
  };

  return (
    <div ref={plannerTopRef} className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn scroll-mt-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] leading-[1.2] font-medium tracking-[-0.02em] text-white">DailyCode 150 in {daysCount} days</h1>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {levelLabel} · {plan?.config?.dailyHours || 2} h a day · {Math.max(0, 150 - completedQuestionsCount)} left, about {hoursLeft} h · finish {fmtDate(plan?.estimatedCompletionDate) || '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {overdueQuestions.length > 0 && (
            <button onClick={handleCarryForward} disabled={actionLoading} className={secondary}>
              Move {overdueQuestions.length} overdue to upcoming days
            </button>
          )}
          <button onClick={() => setIsWizardOpen(true)} className={secondary}>
            <Sliders className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
            Change pace
          </button>
          <button
            onClick={() => {
              const t = plan?.days?.find((d) => d.date === todayStr);
              if (t) setSelectedDayNum(t.dayNumber);
              setActiveTab('daily');
            }}
            className="btn-primary-glow inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-medium active:scale-[0.98]"
          >
            Today’s problems
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {plan?.warning && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] text-[13px] text-amber-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <p className="line-clamp-2" title={plan.warning}>{plan.warning}</p>
        </div>
      )}

      {renderOverview()}

      {/* Tabs */}
      <div className="h-11 flex items-center justify-between border-b border-white/[0.08]">
        <div className="h-full flex items-center gap-6">
          <button onClick={() => setActiveTab('sheet')} className={tabClass(activeTab === 'sheet')}>Sheet</button>
          <button onClick={() => setActiveTab('daily')} className={tabClass(activeTab === 'daily')}>Day {selectedDayNum}</button>
          <button onClick={() => setActiveTab('revision')} className={tabClass(activeTab === 'revision')}>
            Revision
            {revisionCount > 0 && <span className="font-mono text-xs tabular-nums text-slate-500">{revisionCount}</span>}
          </button>
          <button onClick={() => setActiveTab('all')} className={tabClass(activeTab === 'all')}>All days</button>
        </div>

        {activeTab === 'daily' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDayNum(Math.max(1, selectedDayNum - 1))}
              disabled={selectedDayNum <= 1}
              className={`${iconButton(false)} disabled:opacity-30 disabled:pointer-events-none`}
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <span className="w-16 text-center font-mono text-xs tabular-nums text-slate-400">{selectedDayNum} / {daysCount}</span>
            <button
              onClick={() => setSelectedDayNum(Math.min(daysCount, selectedDayNum + 1))}
              disabled={selectedDayNum >= daysCount}
              className={`${iconButton(false)} disabled:opacity-30 disabled:pointer-events-none`}
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>

      {/* Sheet */}
      {activeTab === 'sheet' && renderSheet()}

      {/* Day */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <section className="p-4 rounded-2xl bg-ink-850 border border-white/[0.08]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13px] text-slate-400">
                Day <span className="font-mono tabular-nums text-white">{selectedDayNum}</span> of {daysCount}
              </span>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5"><span className="cell" data-level="0" />Not started</span>
                <span className="flex items-center gap-1.5"><span className="cell" data-level="2" />Started</span>
                <span className="flex items-center gap-1.5"><span className="cell" data-level="4" />Done</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-[3px]">
              {plan?.days?.map((d) => {
                const selected = d.dayNumber === selectedDayNum;
                return (
                  <button
                    key={d.dayNumber}
                    onClick={() => setSelectedDayNum(d.dayNumber)}
                    data-level={dayLevel(d)}
                    title={`Day ${d.dayNumber} · ${fmtDate(d.date)}${d.date === todayStr ? ' · today' : ''}${d.isRevisionDay ? ' · revision' : ''}`}
                    aria-label={`Day ${d.dayNumber}, ${fmtDate(d.date)}`}
                    aria-current={selected ? 'date' : undefined}
                    className={`cell !w-3.5 !h-3.5 !rounded-[3px] ${
                      selected ? 'ring-1 ring-white ring-offset-1 ring-offset-ink-850' : d.date === todayStr ? 'ring-1 ring-white/40' : 'hover:ring-1 hover:ring-white/30'
                    }`}
                  />
                );
              })}
            </div>
          </section>

          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <h2 className="text-[17px] font-medium text-white flex flex-wrap items-baseline gap-x-3">
                Day {activeDay?.dayNumber}
                <span className="text-[13px] font-normal text-slate-400">{fmtDate(activeDay?.date, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                {isToday && <span className="text-[13px] font-normal text-brand-400">Today</span>}
                {activeDay?.isRevisionDay && <span className="text-[13px] font-normal text-slate-400">Revision day</span>}
              </h2>
              {activeDay?.topics?.length > 0 && <p className="mt-1 text-[13px] text-slate-500">{activeDay.topics.join(' · ')}</p>}
            </div>
            <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
              <span className="text-slate-500">{activeDay?.totalEstimatedMinutes || 60} min</span>
              <span className="text-white">{dayCompletedCount} of {dayTotalCount} solved</span>
            </div>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDay?.questions?.map((q, idx) => renderQuestion(q, idx))}
          </ul>
        </div>
      )}

      {/* Revision */}
      {activeTab === 'revision' && (
        <section className="rounded-2xl bg-ink-850 border border-white/[0.08] overflow-hidden">
          <div className="px-6 py-5 border-b border-white/[0.08]">
            <h2 className="text-[17px] font-medium text-white">Revision</h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Problems you starred, or solved with a hint or the solution. Solve them again without help to make the pattern stick.
            </p>
          </div>

          {revisionCount === 0 ? (
            <div className="px-6 py-16 text-center">
              <Star className="w-5 h-5 mx-auto text-slate-500" strokeWidth={1.5} aria-hidden />
              <p className="mt-3 text-[15px] text-white">Nothing to revise yet</p>
              <p className="mt-1 text-[13px] text-slate-500">Star a tricky problem while you solve it and it shows up here</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {plan.revisionQueue.map((q) => (
                <li key={q.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono text-xs tabular-nums text-slate-500">{q.number}</span>
                      <span className="text-[15px] text-white">{q.title}</span>
                      <span className={`text-[13px] ${difficultyText[q.difficulty] || 'text-slate-400'}`}>{q.difficulty}</span>
                      <span className="text-[13px] text-slate-500">{q.topic}</span>
                    </div>
                    {q.notes && <p className="mt-1 text-[13px] text-slate-400 truncate"><span className="text-slate-500">Note </span>{q.notes}</p>}
                  </div>
                  <button onClick={() => setActiveCodeProblem(q)} className={`${secondary} self-start sm:self-auto`}>
                    Solve again
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* All days */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plan?.days?.map((d) => {
            const selected = d.dayNumber === selectedDayNum;
            const done = d.questions.filter((q) => q.completed).length;
            return (
              <button
                key={d.dayNumber}
                onClick={() => { setSelectedDayNum(d.dayNumber); setActiveTab('daily'); }}
                className={`text-left rounded-2xl border p-5 transition-colors ${
                  selected ? 'bg-ink-800 border-white/[0.14]' : 'bg-ink-850 border-white/[0.08] hover:border-white/[0.14]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] text-white">
                    <span className="cell" data-level={dayLevel(d)} aria-hidden />
                    Day {d.dayNumber}
                    {d.isRevisionDay && <span className="text-slate-500">Revision</span>}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{fmtDate(d.date)}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {d.questions.map((q) => (
                    <li key={q.id} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className={`truncate ${q.completed ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-300'}`}>{q.title}</span>
                      <span className={`flex-shrink-0 text-xs ${difficultyText[q.difficulty] || 'text-slate-500'}`}>{q.difficulty}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs tabular-nums text-slate-500">
                  <span>{done} of {d.questions.length} solved</span>
                  <span>{d.totalEstimatedMinutes} min</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <PlannerWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onPlanGenerated={handlePlanGenerated}
        currentConfig={plan?.config}
        solvedIds={allQuestions.filter((q) => q.completed).map((q) => q.id)}
      />
    </div>
  );
}
