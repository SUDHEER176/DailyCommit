import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ArrowRight, CalendarDays } from 'lucide-react';
import PersonalizedPlannerView from './PersonalizedPlanner/PersonalizedPlannerView';
import CodeWorkspace from './CodeWorkspace/CodeWorkspace';
import DailyProblemCard from './practice/DailyProblemCard';
import RevisionQueueCard from './practice/RevisionQueueCard';
import NextUpCard, { useNextProblem } from './practice/NextUpCard';
import HubSidebar from './practice/HubSidebar';
import HubTopBar from './practice/HubTopBar';
import SheetFilters from './practice/SheetFilters';
import SheetList from './practice/SheetList';
import TodayTasksCard from './practice/TodayTasksCard';
import SheetOutlineModal from './practice/SheetOutlineModal';
import ProgressCard from './practice/ProgressCard';
import { api } from '../services/api';
import {
  dailyProblem, readDailyLog, markDailySolved, activeDays, currentStreak, localDay,
  revisionSchedule, editorProblem,
  reviewResultFromAttempt, withLocalDueDate, PROBLEMS,
} from '@/lib/practice';
import { useAppMode } from '@/lib/appMode';

export default function PracticeHub({
  onNavigate,
  setActiveTab,
  onOpenTaskModal,
  onOpenProblemModal,
  onOpenAuthModal,
  currentUser,
  todayTasks = []
}) {
  const [activeView, setActiveView] = useState('sheets'); // 'sheets' | 'planner'
  const [activeEditorProblem, setActiveEditorProblem] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate('/');
    } else if (setActiveTab) {
      setActiveTab('overview');
    } else {
      window.location.href = '/';
    }
  };

  // Domain tab filter: DSA, Core CS, System Design
  const [activeCategory, setActiveCategory] = useState('DSA');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSheet, setSelectedSheet] = useState(null); // sheet whose outline is open

  // ── The person's plan: source of the revision queue and the streak ──
  const [plan, setPlan] = useState(null);
  const [dailyLog, setDailyLog] = useState(() => readDailyLog());
  // Why the editor is open, so an accepted submit can be recorded: { kind: 'daily' | 'review', id }
  const [editorContext, setEditorContext] = useState(null);

  // Smart revision (Pro) is computed on the server, which also decides who gets it. Free
  // accounts, and offline sessions, get the fixed day 3 / 7 / 21 schedule computed here.
  const [smartSchedule, setSmartSchedule] = useState(null);
  // What revision and progress are built from besides the plan: problems solved in the editor
  // (so they work without a study plan), and reviews done on those
  const [attempts, setAttempts] = useState({});
  const [attemptReviews, setAttemptReviews] = useState({});
  const [progress, setProgress] = useState(null);
  const loadPlan = () => {
    api.getRevisionSchedule().then((s) => setSmartSchedule(s?.smart ? s : null)).catch(() => setSmartSchedule(null));
    api.getAttempts().then((a) => setAttempts(a && !Array.isArray(a) ? a : {})).catch(() => {});
    api.getAttemptReviews().then((r) => setAttemptReviews(r || {})).catch(() => {});
    api.getProgress().then(setProgress).catch(() => setProgress(null));
    return api.getStudyPlan().then((p) => setPlan(p?.days ? p : null)).catch(() => setPlan(null));
  };
  const smartRevision = Boolean(smartSchedule);
  // The editor is a full-window workspace: only its own panels scroll, never the page
  useEffect(() => {
    if (!activeEditorProblem) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [activeEditorProblem]);
  // Testing mode: no sign-in at all, so the sign-in prompts are replaced by a note
  const testingMode = useAppMode() === 'testing';

  // Reload when coming back to the hub, since the planner and editor change the plan, and when
  // signing in or out or buying Pro, which changes which revision schedule applies
  useEffect(() => {
    if (activeView === 'sheets' && !activeEditorProblem) loadPlan();
  }, [activeView, activeEditorProblem, currentUser?.isAuthenticated, currentUser?.plan]);

  const today = dailyProblem();
  const planQuestion = (id) => plan?.days?.flatMap((d) => d.questions).find((q) => q.id === id);
  const todayKey = localDay();
  const solvedToday = dailyLog[todayKey] === today.id
    || Boolean(planQuestion(today.id)?.completedAt && localDay(new Date(planQuestion(today.id).completedAt)) === todayKey);
  const solvedDays = activeDays(plan, dailyLog, attempts);
  const streak = currentStreak(solvedDays);
  const schedule = smartSchedule
    ? { due: smartSchedule.due.map(withLocalDueDate), upcoming: smartSchedule.upcoming.map(withLocalDueDate), mastered: smartSchedule.mastered }
    : revisionSchedule(plan, new Date(), { attempts, problems: PROBLEMS, attemptReviews });

  const openEditor = (problem, context) => {
    setEditorContext(context);
    setActiveEditorProblem(editorProblem(problem));
  };

  // Adaptive "Next up": refetched whenever the editor closes, since a solve changes the suggestion
  const nextUp = useNextProblem({ refreshKey: activeEditorProblem ? `editing-${activeEditorProblem.id}` : 'hub', enabled: !activeEditorProblem });
  const openSuggested = (problem) => openEditor(problem, { kind: 'next', id: problem.id });

  // An accepted submit in the editor: count the daily problem, or record the review
  const handleProblemSolved = async () => {
    const ctx = editorContext;
    if (!ctx) return;
    if (ctx.kind === 'daily') {
      setDailyLog(markDailySolved(ctx.id));
      const q = planQuestion(ctx.id);
      if (q && !q.completed) await api.updatePlannedQuestion(ctx.id, { completed: true });
    } else if (ctx.kind === 'review') {
      // Solving it again is the review; with smart revision, how it went sets the next gap.
      // The editor saves the attempt locally before calling this, so the latest one is there.
      const latest = api.getLocalAttempts(ctx.id).slice(-1)[0];
      const difficulty = planQuestion(ctx.id)?.difficulty || PROBLEMS.find((p) => p.id === ctx.id)?.difficulty;
      const reviewResult = smartRevision && latest ? reviewResultFromAttempt(latest, difficulty) : undefined;
      await api.recordReview(ctx.id, reviewResult);
      setEditorContext(null); // one review per accepted submit
    } else if (ctx.kind === 'next') {
      // A suggested problem that is also in the plan counts as done there
      const q = planQuestion(ctx.id);
      if (q && !q.completed) await api.updatePlannedQuestion(ctx.id, { completed: true });
    }
    loadPlan();
  };

  const markReviewed = async (item, reviewResult) => {
    await api.recordReview(item.question.id, reviewResult);
    await loadPlan();
  };

  return (
    <div className="relative min-h-screen w-full bg-ink-900 text-slate-100 flex flex-col md:flex-row">

      <HubSidebar
        open={isSidebarOpen}
        setOpen={setIsSidebarOpen}
        onGoHome={handleGoHome}
        activeView={activeView}
        setActiveView={setActiveView}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        testingMode={testingMode}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <main className="relative flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pb-12 space-y-6 max-w-[1440px] mx-auto w-full">

        <HubTopBar
          onGoHome={handleGoHome}
          onShowHub={() => { setActiveEditorProblem(null); setEditorContext(null); setActiveView('sheets'); }}
          activeEditorProblem={activeEditorProblem}
          activeView={activeView}
          activeCategory={activeCategory}
          streak={streak}
          testingMode={testingMode}
          currentUser={currentUser}
          onOpenAuthModal={onOpenAuthModal}
        />

        {/* ── ACTIVE VIEW SWITCHER: CODE EDITOR vs PLANNER vs SHEETS ── */}
        {activeEditorProblem ? (
          // Portalled to <body> so no ancestor (transforms, banners) can shift the full-window workspace
          createPortal(
          <div className="fixed inset-0 z-[60] bg-ink-950">
            <CodeWorkspace
              problem={activeEditorProblem}
              onBack={() => { setActiveEditorProblem(null); setEditorContext(null); }}
              onProblemSolved={handleProblemSolved}
              onOpenProblem={openSuggested}
              streak={streak}
              activeToday={solvedDays.has(todayKey)}
            />
          </div>,
            document.body
          )
        ) : activeView === 'planner' ? (
          <div className="space-y-4">
            <button
              onClick={() => setActiveView('sheets')}
              className="-ml-2.5 flex items-center gap-1 h-8 pl-1.5 pr-2.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white text-[13px] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              <span>Back to sheets</span>
            </button>
            <PersonalizedPlannerView onNavigate={onNavigate} />
          </div>
        ) : (
          <>
            {/* Page heading */}
            <div className="pt-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-[22px] font-medium text-white">Practice</h1>
                <p className="mt-1 text-[13px] text-slate-500">
                  {progress
                    ? <><span className="font-mono tabular-nums text-slate-300">{progress.solved}</span> of <span className="font-mono tabular-nums">{progress.total}</span> solved · <span className="font-mono tabular-nums">{schedule.due.length}</span> {schedule.due.length === 1 ? 'revision' : 'revisions'} due</>
                    : 'One problem a day, reviewed on days 3, 7 and 21'}
                </p>
              </div>
            </div>

            {/* Today's problem with the streak and recent activity */}
            <DailyProblemCard
              problem={today}
              solvedToday={solvedToday}
              streak={streak}
              days={solvedDays}
              onSolve={() => openEditor(today, { kind: 'daily', id: today.id })}
            />

            {/* Adaptive next problem beside the plan builder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <NextUpCard rec={nextUp.rec} loading={nextUp.loading} onOpen={openSuggested} onSkip={nextUp.skip} />
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-ink-850 p-6 flex flex-col justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays className="w-4 h-4" strokeWidth={1.5} />
                    <span>Study plan</span>
                  </div>
                  <p className="text-[15px] font-medium text-white">{plan ? 'Your DailyCode 150 plan' : 'A plan built around your interview date'}</p>
                  <p className="text-[13px] text-slate-400 leading-[1.55]">
                    {plan
                      ? 'Your day-by-day schedule, with revision built in'
                      : 'Five short questions about your level, hours and date, then a day-by-day schedule'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('planner')}
                  className="self-start inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
                >
                  <span>{plan ? 'Open plan' : 'Build my plan'}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Solved, covered and left: the basics for everyone, the detail for Pro */}
            <ProgressCard
              data={progress}
              streak={streak}
              revisionsDue={schedule.due.length}
              onUpgrade={currentUser?.isAuthenticated ? () => onNavigate && onNavigate('/pricing') : null}
            />

            <SheetFilters
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {/* Sheets on the left, revision and today's tasks on the right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SheetList
                activeCategory={activeCategory}
                searchQuery={searchQuery}
                progress={progress}
                onOpenPlan={() => setActiveView('planner')}
                onShowOutline={setSelectedSheet}
              />

              <div className="space-y-6">
                <RevisionQueueCard
                  schedule={schedule}
                  hasPlan={Boolean(plan) || schedule.due.length + schedule.upcoming.length > 0}
                  onReview={(item) => openEditor(item.question, { kind: 'review', id: item.question.id })}
                  onMarkReviewed={markReviewed}
                  onOpenPlanner={() => setActiveView('planner')}
                  smart={smartRevision}
                  onUpgrade={currentUser?.isAuthenticated ? () => onNavigate && onNavigate('/pricing') : null}
                />

                <TodayTasksCard
                  currentUser={currentUser}
                  todayTasks={todayTasks}
                  onOpenPlan={() => setActiveView('planner')}
                  onOpenTaskModal={onOpenTaskModal}
                />
              </div>
            </div>
          </>
        )}

      </main>

      {/* What a sheet that isn't written yet will cover */}
      <SheetOutlineModal
        sheet={selectedSheet}
        onClose={() => setSelectedSheet(null)}
        onOpenPlan={() => setActiveView('planner')}
      />

    </div>
  );
}
