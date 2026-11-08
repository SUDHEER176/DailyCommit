import React from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BRAND } from '@/lib/brand';

import Hero22 from './Hero22';
import Stats15 from './reactbits/Stats15';
import Features13 from './reactbits/Features13';
import HowItWorks7 from './reactbits/HowItWorks7';
import TaskSteps from './ui/task-steps';
import Calendar from './ui/calendar';
import IntegrationsSection from './ui/integrations-3';
import Faqs01 from './ui/faqs-01';
import FeatureBento from './reactbits/FeatureBento';
import FinalCTA from './reactbits/FinalCTA';
import RevisionTimeline from './RevisionTimeline';

export default function Dashboard({ 
  stats, 
  todayTasks = [], 
  onToggleTask, 
  onOpenTaskModal, 
  onOpenProblemModal,
  onOpenAuthModal,
  currentUser,
  setActiveTab,
  activeTab,
  onNavigate
}) {
  const defaultDsaTasks = [
    { id: "task-dsa-1", title: "Solve 15. 3Sum with two pointers", topic: "Arrays", priority: "High", estimatedMinutes: 25, completed: false },
    { id: "task-dsa-2", title: "Review the LRU cache design", topic: "Design", estimatedMinutes: 20, completed: false },
    { id: "task-dsa-3", title: "Timed mock interview", topic: "Sprint", estimatedMinutes: 45, completed: false },
    { id: "task-dsa-4", title: "Write up time and space complexity", topic: "Analysis", estimatedMinutes: 10, completed: false }
  ];

  const activeTaskList = todayTasks.length > 0 ? todayTasks : defaultDsaTasks;
  const completedCount = activeTaskList.filter(t => t.completed).length;
  const totalCount = activeTaskList.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleTaskCheck = (taskId) => {
    if (onToggleTask) {
      onToggleTask(taskId);
    }
    const target = activeTaskList.find(t => t.id === taskId);
    if (!target?.completed) {
      confetti({
        particleCount: 28,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#0066FF', '#4d8eff', '#a3a9b8'],
        disableForReducedMotion: true,
      });
    }
  };

  // Map tasks to TaskSteps data with active glow for current in-progress task
  const taskStepsData = activeTaskList.map((task, index) => {
    let status = "pending";
    if (task.completed) {
      status = "done";
    } else if (index === completedCount) {
      status = "active";
    }

    return {
      id: task.id,
      label: task.title,
      topic: task.topic,
      priority: task.priority,
      meta: task.estimatedMinutes ? `${task.estimatedMinutes} min` : undefined,
      status
    };
  });

  // Scroll spy to update activeTab in navbar as user scrolls through sections
  React.useEffect(() => {
    const sectionIds = ['overview', 'features', 'today-plan', 'how-it-works', 'integrations', 'faqs'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 220;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPos) {
          if (setActiveTab) setActiveTab(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setActiveTab]);

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-24 sm:space-y-32">

      {/* Overview: hero, preview, logos, scheduling */}
      <div id="overview" className="space-y-24 sm:space-y-32 scroll-mt-24">
        <Hero22
          stats={stats}
          todayTasks={todayTasks}
          onOpenTaskModal={onOpenTaskModal}
          onOpenProblemModal={onOpenProblemModal}
          onOpenAuthModal={onOpenAuthModal}
          currentUser={currentUser}
          setActiveTab={setActiveTab}
          activeTab={activeTab}
          onNavigate={onNavigate}
        />

        <Stats15 stats={stats} setActiveTab={setActiveTab} />
      </div>

      <RevisionTimeline />

      <FeatureBento stats={stats} setActiveTab={setActiveTab} onNavigate={onNavigate} signedIn={Boolean(currentUser?.isAuthenticated)} />

      <div id="features" className="scroll-mt-24">
        <Features13
          stats={stats}
          todayTasks={todayTasks}
          setActiveTab={setActiveTab}
          onOpenTaskModal={onOpenTaskModal}
          onOpenProblemModal={onOpenProblemModal}
        />
      </div>

      {/* Today's plan: the task sequence and this month's solve calendar */}
      <div id="today-plan" className="scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="eyebrow">{todayLabel}</span>
            <h2 className="mt-3 text-[32px] sm:text-[40px] leading-[1.1] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
              Today’s plan
            </h2>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              Check off a step when it’s done. Finished tasks count toward your streak.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate('/practice/dsa') : (window.location.pathname = '/practice/dsa'))}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              DailyCode 150 planner
              <ArrowRight className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={onOpenTaskModal}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-ink-800 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-colors active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              Add task
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[15px] text-slate-900 dark:text-white">Study sprint</span>
              <span className="font-mono text-[13px] tabular-nums text-slate-500 dark:text-slate-400">
                {completedCount} of {totalCount} done · {progressPercent}%
              </span>
            </div>

            <div className="mt-4 h-1 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden" aria-hidden>
              <div
                className="h-full w-full origin-left rounded-full bg-brand-500 transition-transform duration-500 ease-out"
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>

            <TaskSteps
              className="mt-6"
              steps={taskStepsData}
              current={completedCount}
              label="Today's task sequence"
              onStepClick={(step) => handleTaskCheck(step.id)}
            />

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-[13px]">
              <span className="text-slate-500 dark:text-slate-400">
                {totalCount - completedCount === 0
                  ? 'Everything on today’s list is done'
                  : `${totalCount - completedCount} left for today`}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab && setActiveTab('planner')}
                className="inline-flex items-center gap-1 rounded-md text-brand-600 dark:text-brand-400 hover:underline underline-offset-4"
              >
                Manage tasks
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <Calendar onOpenProblemModal={onOpenProblemModal} />
        </div>
      </div>

      <div id="how-it-works" className="scroll-mt-24">
        <HowItWorks7 setActiveTab={setActiveTab} onOpenProblemModal={onOpenProblemModal} />
      </div>

      <div id="integrations" className="scroll-mt-24">
        <IntegrationsSection onGetStarted={() => setActiveTab && setActiveTab('planner')} />
      </div>

      <div id="faqs" className="scroll-mt-24">
        <Faqs01 supportEmail={BRAND.supportEmail} whatsappNumber={BRAND.whatsappNumber} />
      </div>

      <FinalCTA onOpenProblemModal={onOpenProblemModal} onNavigate={onNavigate} />
    </div>
  );
}
