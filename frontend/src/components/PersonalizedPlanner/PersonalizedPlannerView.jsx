import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, Sliders } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import CodeWorkspace from '../CodeWorkspace/CodeWorkspace';
import { PageLoader } from '../ui/Spinner';
import PlannerWizardModal from './PlannerWizardModal';
import PlannerOverview from './PlannerOverview';
import PlannerSheet from './PlannerSheet';
import PlannerDay from './PlannerDay';
import { PlannerRevision, PlannerAllDays } from './PlannerLists';
import {
  TOPIC_ORDER, fmtDate, groupByTopic, iconButton, secondaryButton, tabClass, todayIso,
} from './plannerUtils';

/**
 * DailyCode 150 planner: loads the person's study plan and shows it as
 * an overview, then four tabs (sheet, day, revision, all days).
 *
 * This component owns all plan state and the API calls that change it.
 * The tab components only render and call the `actions` passed to them.
 */
export default function PersonalizedPlannerView({ onOpenWizardDirect = false }) {
  // ── Plan data ──
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ── What is open on screen ──
  const [isWizardOpen, setIsWizardOpen] = useState(onOpenWizardDirect);
  const [activeTab, setActiveTab] = useState('sheet'); // 'sheet' | 'daily' | 'revision' | 'all'
  const [selectedDayNum, setSelectedDayNum] = useState(1);
  const [expandedNotesId, setExpandedNotesId] = useState(null);
  const [activeCodeProblem, setActiveCodeProblem] = useState(null);
  const [calOffset, setCalOffset] = useState(0); // streak calendar: months back from this one

  // ── Sheet filters, kept here so they survive switching tabs ──
  const [openTopics, setOpenTopics] = useState(() => new Set());
  const [sheetQuery, setSheetQuery] = useState('');
  const [sheetDifficulty, setSheetDifficulty] = useState('All');
  const [hideSolved, setHideSolved] = useState(false);

  const plannerTopRef = useRef(null);

  // Load the plan; with no plan yet, open the wizard
  const loadPlan = async () => {
    setLoading(true);
    try {
      const activePlan = await api.getStudyPlan();
      if (activePlan && activePlan.days) {
        setPlan(activePlan);
        // Start on today's day, otherwise the first unfinished day, otherwise day 1
        const matchToday = activePlan.days.find((d) => d.date === todayIso());
        if (matchToday) {
          setSelectedDayNum(matchToday.dayNumber);
        } else {
          const firstIncomplete = activePlan.days.find((d) => !d.isFullyCompleted);
          setSelectedDayNum(firstIncomplete ? firstIncomplete.dayNumber : 1);
        }
      } else {
        setIsWizardOpen(true);
      }
    } catch (e) {
      console.warn('Error fetching study plan', e);
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

  // ── Actions ──

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

  /** Save one change to a planned question and take the updated plan the API returns */
  const updateQuestion = async (question, changes) => {
    if (!question) return;
    const updatedPlan = await api.updatePlannedQuestion(question.id, changes);
    if (updatedPlan) setPlan({ ...updatedPlan });
  };

  const actions = {
    toggleComplete: async (q) => {
      if (!q) return;
      if (!q.completed) {
        confetti({ particleCount: 28, spread: 50, origin: { y: 0.7 }, colors: ['#0066FF', '#4d8eff', '#a3a9b8'], disableForReducedMotion: true });
      }
      await updateQuestion(q, { completed: !q.completed });
    },
    toggleDifficult: (q) => updateQuestion(q, { isDifficult: !q?.isDifficult }),
    setSolveStatus: (q, status) => updateQuestion(q, { solveStatus: status }),
    saveNotes: (q, text) => updateQuestion(q, { notes: text }),
    openEditor: (q) => setActiveCodeProblem(q),
  };

  // Move unsolved problems from past days onto upcoming days
  const handleCarryForward = async () => {
    setActionLoading(true);
    try {
      const updatedPlan = await api.carryForwardPlannedQuestions();
      if (updatedPlan) setPlan({ ...updatedPlan });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived numbers ──

  const todayStr = todayIso();
  const activeDay = plan?.days?.find((d) => d.dayNumber === selectedDayNum) || plan?.days?.[0];
  const allQuestions = plan?.days?.flatMap((d) => d.questions) || [];
  const byTopic = groupByTopic(allQuestions);

  const overdueCount = (plan?.days || [])
    .filter((d) => d.date < todayStr)
    .reduce((n, d) => n + d.questions.filter((q) => !q.completed).length, 0);

  const completedQuestionsCount = plan?.completedCount || 0;
  const daysCount = plan?.days?.length || 45;
  const revisionCount = plan?.revisionQueue?.length || 0;
  const level = plan?.config?.level || 'intermediate';
  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);
  const hoursLeft = Math.round(((150 - completedQuestionsCount) * (level === 'beginner' ? 45 : 30)) / 60);

  // ── Full-screen states ──

  if (loading) {
    return <PageLoader label="Loading your plan" className="min-h-[400px]" />;
  }

  if (activeCodeProblem) {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-ink-900 animate-fadeIn">
        <CodeWorkspace
          problem={activeCodeProblem}
          onBack={() => setActiveCodeProblem(null)}
          onProblemSolved={() => actions.toggleComplete(activeCodeProblem)}
        />
      </div>
    );
  }

  const openToday = () => {
    const t = plan?.days?.find((d) => d.date === todayStr);
    if (t) setSelectedDayNum(t.dayNumber);
    setActiveTab('daily');
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
          {overdueCount > 0 && (
            <button onClick={handleCarryForward} disabled={actionLoading} className={secondaryButton}>
              Move {overdueCount} overdue to upcoming days
            </button>
          )}
          <button onClick={() => setIsWizardOpen(true)} className={secondaryButton}>
            <Sliders className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
            Change pace
          </button>
          <button
            onClick={openToday}
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

      <PlannerOverview
        questions={allQuestions}
        byTopic={byTopic}
        solvedCount={completedQuestionsCount}
        calOffset={calOffset}
        setCalOffset={setCalOffset}
      />

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

      {activeTab === 'sheet' && (
        <PlannerSheet
          byTopic={byTopic}
          solvedCount={completedQuestionsCount}
          totalCount={allQuestions.length || 150}
          filters={{
            query: sheetQuery, setQuery: setSheetQuery,
            difficulty: sheetDifficulty, setDifficulty: setSheetDifficulty,
            hideSolved, setHideSolved,
          }}
          openTopics={openTopics}
          setOpenTopics={setOpenTopics}
          notesOpenId={expandedNotesId}
          setNotesOpenId={setExpandedNotesId}
          actions={actions}
        />
      )}

      {activeTab === 'daily' && (
        <PlannerDay
          plan={plan}
          activeDay={activeDay}
          selectedDayNum={selectedDayNum}
          setSelectedDayNum={setSelectedDayNum}
          daysCount={daysCount}
          todayStr={todayStr}
          notesOpenId={expandedNotesId}
          setNotesOpenId={setExpandedNotesId}
          actions={actions}
        />
      )}

      {activeTab === 'revision' && (
        <PlannerRevision revisionQueue={plan?.revisionQueue} onOpenEditor={actions.openEditor} />
      )}

      {activeTab === 'all' && (
        <PlannerAllDays
          days={plan?.days}
          selectedDayNum={selectedDayNum}
          onOpenDay={(n) => { setSelectedDayNum(n); setActiveTab('daily'); }}
        />
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
