import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, LayoutDashboard, Code2, BookOpen, Layers,
  CheckCircle2, Check, Circle, Clock, Award, Star, Flame,
  Search, Bell, ChevronRight, ChevronLeft, ChevronDown, ExternalLink,
  Plus, X, ArrowRight, ShieldCheck, Ticket, CalendarDays,
  Laptop, Database, Terminal, FileCode, CheckSquare,
  HelpCircle, MessageCircle, LogIn, User, Menu
} from 'lucide-react';
import confetti from 'canvas-confetti';
import CodeStreakLogo from './ui/CodeStreakLogo';
import { BRAND } from '@/lib/brand';
import { CppLogo, PythonLogo } from './ui/BrandLogos';
import PersonalizedPlannerView from './PersonalizedPlanner/PersonalizedPlannerView';
import CodeWorkspace from './CodeWorkspace/CodeWorkspace';
import DailyProblemCard from './practice/DailyProblemCard';
import RevisionQueueCard from './practice/RevisionQueueCard';
import { api } from '../services/api';
import {
  dailyProblem, readDailyLog, markDailySolved, activeDays, currentStreak, localDay,
  revisionSchedule, editorProblem, PROBLEM_COUNT, TOPIC_COUNT,
} from '@/lib/practice';

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

  const loadPlan = () => api.getStudyPlan().then((p) => setPlan(p?.days ? p : null)).catch(() => setPlan(null));
  // Reload when coming back to the hub, since the planner and editor change the plan
  useEffect(() => {
    if (activeView === 'sheets' && !activeEditorProblem) loadPlan();
  }, [activeView, activeEditorProblem]);

  const today = dailyProblem();
  const planQuestion = (id) => plan?.days?.flatMap((d) => d.questions).find((q) => q.id === id);
  const todayKey = localDay();
  const solvedToday = dailyLog[todayKey] === today.id
    || Boolean(planQuestion(today.id)?.completedAt && localDay(new Date(planQuestion(today.id).completedAt)) === todayKey);
  const streak = currentStreak(activeDays(plan, dailyLog));
  const schedule = revisionSchedule(plan);

  const openEditor = (problem, context) => {
    setEditorContext(context);
    setActiveEditorProblem(editorProblem(problem));
  };

  // An accepted submit in the editor: count the daily problem, or record the review
  const handleProblemSolved = async () => {
    const ctx = editorContext;
    if (!ctx) return;
    if (ctx.kind === 'daily') {
      setDailyLog(markDailySolved(ctx.id));
      const q = planQuestion(ctx.id);
      if (q && !q.completed) await api.updatePlannedQuestion(ctx.id, { completed: true });
    } else if (ctx.kind === 'review') {
      await api.updatePlannedQuestion(ctx.id, { reviewed: true });
      setEditorContext(null); // one review per accepted submit
    }
    loadPlan();
  };

  const markReviewed = async (item) => {
    const updated = await api.updatePlannedQuestion(item.question.id, { reviewed: true });
    if (updated?.days) setPlan(updated);
    else loadPlan();
  };

  // Sheets. Only DailyCode 150 has problems behind it today; the others are outlines being written.
  const sheets = [
    {
      id: 'dailycode-150',
      section: 'Start here',
      title: 'DailyCode 150',
      description: 'The core interview patterns, ordered topic by topic, with a day-by-day plan, the editor and revision built in.',
      tag: `${PROBLEM_COUNT} problems · ${TOPIC_COUNT} topics`,
      icon: '150',
      category: 'DSA',
      live: true,
      syllabus: [],
    },
    {
      id: 'cpp-beginners',
      section: 'Language basics',
      title: 'C++ for DSA',
      description: 'Fast I/O, the STL containers you reach for in interviews, references and pointers.',
      icon: 'C++',
      category: 'DSA',
      syllabus: [
        'Variables, types, input and output',
        'Conditionals and loops',
        'Functions, references and pointers',
        'The STL: vector, set, map, priority_queue',
        'Reading the time complexity of C++ code',
      ],
    },
    {
      id: 'python-dsa',
      section: 'Language basics',
      title: 'Python for DSA',
      description: 'Lists, dicts, deque, heapq and collections, plus recursion and memoization with functools.',
      icon: 'Py',
      category: 'DSA',
      syllabus: [
        'Syntax and dynamic typing',
        'Lists, dicts, tuples and deque',
        'heapq and the collections module',
        'Recursion limits and memoization with functools',
      ],
    },
    {
      id: 'a2z-roadmap',
      section: 'More sheets',
      title: 'A2Z Roadmap',
      description: 'A longer path from the basics to dynamic programming, for when you are starting from zero.',
      icon: 'A2Z',
      category: 'DSA',
      syllabus: [
        'Basics: math, recursion, time complexity',
        'Sorting: merge, quick, cyclic',
        'Arrays: easy to hard',
        'Binary search on arrays and on the answer',
        'Strings',
        'Linked lists',
        'Recursion and backtracking',
        'Bit manipulation',
        'Stacks, queues and monotonic stacks',
        'Sliding window and two pointers',
        'Heaps',
        'Greedy',
        'Binary trees',
        'Binary search trees',
        'Graphs',
        'Dynamic programming',
        'Tries',
        'Advanced strings',
      ],
    },
    {
      id: 'top-180',
      section: 'More sheets',
      title: 'Top 180',
      description: 'A day-by-day set of frequently asked interview problems, a few each day.',
      icon: '180',
      category: 'DSA',
      syllabus: [
        'Arrays',
        'Arrays, part 2',
        'Arrays and math',
        'Arrays, part 4',
        'Linked lists',
        'Linked lists, part 2',
        'Two pointers',
        'Greedy',
        'Recursion',
        'Backtracking',
      ],
    },
    {
      id: 'quick-75',
      section: 'More sheets',
      title: 'Quick 75',
      description: 'A shorter list for when the interview is a few weeks away.',
      icon: '75',
      category: 'DSA',
      syllabus: [
        'Arrays and hashing',
        'Two pointers and sliding window',
        'Stacks and monotonic deques',
        'Binary search',
        'Linked lists',
        'Trees and BSTs',
        'Graphs and shortest paths',
        'Dynamic programming',
      ],
    },
    {
      id: 'system-design',
      section: 'System design',
      title: 'System design basics',
      description: 'Caches, load balancing, sharding and queues, then two classic design walk-throughs.',
      icon: 'HLD',
      category: 'System Design',
      syllabus: [
        'Load balancers, consistent hashing and DNS',
        'Caching and eviction policies',
        'Sharding, replication and the CAP theorem',
        'Message queues',
        'Design a URL shortener',
        'Design a chat app',
      ],
    },
    {
      id: 'core-cs',
      section: 'Core CS',
      title: 'Operating systems and DBMS',
      description: 'Processes, threads, scheduling, memory, normalization and transactions.',
      icon: 'OS',
      category: 'Core CS',
      syllabus: [
        'Processes, threads and concurrency',
        'CPU scheduling and deadlocks',
        'Memory management and virtual memory',
        'The relational model, keys and normalization',
        'Transactions, ACID and concurrency control',
      ],
    }
  ];

  // Filter sheets by active category
  const filteredSheets = sheets.filter(s => {
    const matchesCategory = s.category === activeCategory;
    const matchesSearch = searchQuery === '' || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group sheets by section
  const sections = Array.from(new Set(filteredSheets.map(s => s.section)));

  // Helper to render original official logos for C++ and Python
  const renderSheetIcon = (sheetItem, size = 22) => {
    if (!sheetItem) return null;
    if (sheetItem.id === 'cpp-beginners') {
      return <CppLogo size={size} />;
    }
    if (sheetItem.id === 'python-dsa') {
      return <PythonLogo size={size} />;
    }
    if (React.isValidElement(sheetItem.icon)) {
      return sheetItem.icon;
    }
    return <span className="font-mono font-medium text-brand-600 dark:text-brand-400 text-xs">{sheetItem.icon}</span>;
  };

  return (
    <div className="relative min-h-screen w-full bg-ink-900 text-slate-100 flex flex-col md:flex-row">

      {/* Ambient top glow */}

      {/* ── MOBILE TOP BAR ── */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-ink-900/90 backdrop-blur-md border-b border-white/[0.08]">
        <div onClick={handleGoHome} className="cursor-pointer select-none">
          <CodeStreakLogo size={20} textSize="text-[17px]" />
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-9 h-9 grid place-items-center rounded-lg hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      <div
        onClick={() => setIsSidebarOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-150 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* ── LEFT SIDEBAR ── */}
      <aside
        onClickCapture={(e) => { if (e.target.closest('button, a')) setIsSidebarOpen(false); }}
        className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-150 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:sticky md:top-0 md:self-start md:h-screen md:w-64 overflow-y-auto bg-ink-950 border-r border-white/[0.08] flex flex-col justify-between p-3 flex-shrink-0 select-none`}
      >

        <div className="space-y-6">
          {/* Logo / Brand Header */}
          <div className="flex items-center justify-between h-10 px-2.5">
            <div 
              onClick={handleGoHome}
              className="cursor-pointer select-none"
            >
              <CodeStreakLogo size={20} textSize="text-[17px]" />
            </div>

            <button
              onClick={handleGoHome}
              className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors"
              title="Return to Main Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Nav Section: Prep */}
          <div className="space-y-0.5">
            <span className="flex items-center h-6 px-2.5 text-xs text-slate-500">Prep</span>
            <button
              onClick={handleGoHome}
              className="w-full flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors text-left text-slate-400 hover:text-white hover:bg-white/[0.04]"
            >
              <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveView('sheets')}
              className={`w-full flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors text-left ${
                activeView === 'sheets'
                  ? 'text-white bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Compass className="w-4 h-4" strokeWidth={1.5} />
              <span>Prep hub</span>
              
            </button>
            <button
              onClick={() => setActiveView('planner')}
              className={`w-full flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors text-left ${
                activeView === 'planner'
                  ? 'text-white bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <CalendarDays className="w-4 h-4" strokeWidth={1.5} />
              <span>DSA planner</span>
              <span className="ml-auto font-mono text-xs tabular-nums text-slate-500">150</span>
            </button>
          </div>

          {/* Nav Section: Practice */}
          <div className="space-y-0.5">
            <span className="flex items-center h-6 px-2.5 text-xs text-slate-500">Practice</span>
            <button
              onClick={() => {
                setActiveView('sheets');
                setActiveCategory('DSA');
              }}
              className={`w-full flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors text-left ${
                activeView === 'sheets' && activeCategory === 'DSA'
                  ? 'text-white bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Code2 className="w-4 h-4" strokeWidth={1.5} />
              <span>DSA sheets</span>
            </button>
            <button
              onClick={() => {
                setActiveView('sheets');
                setActiveCategory('Core CS');
              }}
              className={`w-full flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors text-left ${
                activeView === 'sheets' && activeCategory === 'Core CS'
                  ? 'text-white bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Terminal className="w-4 h-4" strokeWidth={1.5} />
              <span>Core CS & SQL</span>
            </button>
            <button
              onClick={() => {
                setActiveView('sheets');
                setActiveCategory('System Design');
              }}
              className={`w-full flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors text-left ${
                activeView === 'sheets' && activeCategory === 'System Design'
                  ? 'text-white bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Database className="w-4 h-4" strokeWidth={1.5} />
              <span>System Design</span>
            </button>
          </div>

          {/* Nav Section: Planly / Study Planner */}
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveView('planner')}
              className={`w-full flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors text-left ${
                activeView === 'planner'
                  ? 'text-white bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <CheckSquare className="w-4 h-4" strokeWidth={1.5} />
              <span>DailyCode 150 plan</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="space-y-2 pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => setActiveTab && setActiveTab('overview')}
            className="w-full flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors text-left text-slate-400 hover:text-white hover:bg-white/[0.04]"
          >
            <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
            <span>Contact support</span>
          </button>

          {currentUser?.isAuthenticated ? (
            <button
              onClick={onOpenAuthModal}
              className="w-full p-2.5 rounded-xl hover:bg-white/[0.04] border border-white/[0.08] flex items-center justify-between text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/[0.14] flex items-center justify-center font-medium text-xs text-white flex-shrink-0">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-medium text-white block truncate group-hover:text-slate-200">
                    {currentUser.name || 'Signed in'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono block truncate">
                    {currentUser.email || 'Signed in'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
            </button>
          ) : (
            <div className="p-3 rounded-xl border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/[0.08] flex items-center justify-center text-slate-400 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[13px] text-white block">Guest</span>
                  <span className="text-xs text-slate-500 block truncate">Sign in to sync your streak</span>
                </div>
              </div>
              <button
                onClick={onOpenAuthModal}
                className="w-full h-8 rounded-lg bg-slate-100 hover:bg-white text-ink-900 text-[13px] font-medium transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" strokeWidth={1.5} />
                <span>Sign in</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <main className="relative flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pb-8 space-y-6 max-w-[1440px]">

        {/* ── TOP NAVBAR ON /practice/dsa ── */}
        <div className="flex items-center justify-between h-16 border-b border-white/[0.08] gap-4">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <span 
              onClick={handleGoHome}
              className="hover:text-white cursor-pointer transition-colors"
            >
              Dashboard
            </span>
            <span>/</span>
            <span 
              onClick={() => { setActiveEditorProblem(null); setEditorContext(null); setActiveView('sheets'); }}
              className="hover:text-white cursor-pointer transition-colors"
            >
              Practice hub
            </span>
            {activeEditorProblem ? (
              <>
                <span>/</span>
                <span className="text-slate-400">Code editor</span>
                <span>/</span>
                <span className="text-white">{activeEditorProblem.title}</span>
              </>
            ) : activeView === 'planner' ? (
              <>
                <span>/</span>
                <span className="text-white">DSA study planner</span>
              </>
            ) : (
              <>
                <span>/</span>
                <span className="text-white">{activeCategory}</span>
              </>
            )}
          </div>

          {/* Right Header Actions: Streak & Profile Pill */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 h-8 px-2 text-[13px] text-slate-500">
              <span className="cell" data-level={streak > 0 ? 4 : 0} aria-hidden />
              <span className="font-mono tabular-nums text-white">{streak}</span>
              <span>day streak</span>
            </div>

            {/* Profile Button Pill */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 h-8 px-2.5 rounded-lg hover:bg-white/[0.06] text-[13px] text-slate-300 hover:text-white transition-colors"
              title={currentUser?.isAuthenticated ? `Logged in as ${currentUser.name}` : "Sign in / Profile"}
            >
              <div className="w-5 h-5 rounded-full bg-white/10 border border-white/[0.14] flex items-center justify-center text-[11px] font-medium text-white">
                {currentUser?.name ? currentUser.name[0].toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <span className="max-w-[100px] truncate">
                {currentUser?.isAuthenticated ? (currentUser.name?.split(' ')[0] || 'Profile') : 'Sign in'}
              </span>
            </button>
          </div>
        </div>

        {/* ── ACTIVE VIEW SWITCHER: CODE EDITOR vs PLANNER vs SHEETS ── */}
        {activeEditorProblem ? (
          <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-sm bg-ink-850">
            <CodeWorkspace
              problem={activeEditorProblem}
              onBack={() => { setActiveEditorProblem(null); setEditorContext(null); }}
              onProblemSolved={handleProblemSolved}
            />
          </div>
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
            {/* Today's problem: one a day for everyone, counted toward the streak */}
            <DailyProblemCard
              problem={today}
              solvedToday={solvedToday}
              streak={streak}
              onSolve={() => openEditor(today, { kind: 'daily', id: today.id })}
            />

            {/* DailyCode 150 Personalized Planner Featured Banner */}
            <div className="rounded-2xl border border-white/[0.08] bg-ink-850 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[15px] font-medium text-white">
                  A DailyCode 150 plan built around your interview date
                </span>
                <p className="text-[13px] text-slate-400 max-w-xl">
                  Answer five short questions about your level, hours and target date, and get a day-by-day schedule with revision built in.
                </p>
              </div>
              <button
                onClick={() => setActiveView('planner')}
                className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm flex-shrink-0 bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
              >
                <span>Build my plan</span>
                <ArrowRight className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              </button>
            </div>

            {/* Categories Bar & Quick Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              {/* Domain Category Selector Pills */}
              <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-ink-850 border border-white/[0.08] scrollbar-none w-fit max-w-full">
                {['DSA', 'Core CS', 'System Design'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`h-8 px-3 rounded-lg text-[13px] whitespace-nowrap transition-colors ${
                      activeCategory === cat
                        ? 'bg-slate-100 text-ink-900'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-[10px] bg-ink-850 border border-white/[0.08] text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* ── TWO-COLUMN MAIN VIEW: sheets on the left, revision and today on the right ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLS: Curriculum Sheets Grouped by Section */}
          <div className="lg:col-span-2 space-y-8">
            {sections.map((sectionName) => {
              const sectionSheets = filteredSheets.filter(s => s.section === sectionName);
              if (sectionSheets.length === 0) return null;

              return (
                <div key={sectionName} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-medium text-white flex items-baseline gap-3">
                      <span>{sectionName}</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sectionSheets.map((sheet) => (
                      <div
                        key={sheet.id}
                        className="p-6 rounded-2xl bg-ink-850 border border-white/[0.08] hover:border-white/[0.14] transition-colors duration-150 flex flex-col justify-between gap-6 group relative"
                      >
                                                <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-[10px] bg-ink-800 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                {renderSheetIcon(sheet, 24)}
                              </div>
                              <div>
                                <h3 className="text-[15px] font-medium text-white">
                                  {sheet.title}
                                </h3>
                                <span className="text-xs text-slate-500">
                                  {sheet.live ? sheet.tag : 'Coming soon'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-[13px] text-slate-400 line-clamp-2 leading-[1.55]">
                            {sheet.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {sheet.live ? 'Free' : `${sheet.syllabus.length} parts planned`}
                          </span>
                          {sheet.live ? (
                            <button
                              onClick={() => setActiveView('planner')}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] btn-primary-glow font-medium active:scale-[0.98]"
                            >
                              <span>Open</span>
                              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedSheet(sheet)}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
                            >
                              <span>See outline</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT 1 COL: revision queue and today's tasks */}
          <div className="space-y-6">

            <RevisionQueueCard
              schedule={schedule}
              hasPlan={Boolean(plan)}
              onReview={(item) => openEditor(item.question, { kind: 'review', id: item.question.id })}
              onMarkReviewed={markReviewed}
              onOpenPlanner={() => setActiveView('planner')}
            />

            {/* Daily Planner Widget */}
            <div className="p-6 rounded-2xl bg-ink-850 border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-medium text-white">Today</h3>
                <span className="font-mono text-xs text-slate-500">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {currentUser || todayTasks.length > 0 ? (
                <div className="space-y-3">
                                    <div className="space-y-1">
                    {todayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="h-10 px-2.5 rounded-lg hover:bg-white/[0.03] flex items-center justify-between text-[13px]"
                      >
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          {task.completed ? (
                            <span className="cell !w-3.5 !h-3.5 !rounded-[4px]" data-level="4" aria-label="Done" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-[4px] border border-white/[0.14] flex-shrink-0" aria-label="To do" />
                          )}
                          <span className={`truncate ${task.completed ? 'line-through decoration-slate-600 text-slate-500' : 'text-slate-200'}`}>
                            {task.title}
                          </span>
                        </div>
                        {task.estimatedMinutes && (
                          <span className="font-mono text-xs tabular-nums text-slate-500 flex-shrink-0">
                            {task.estimatedMinutes} min
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => setActiveView('planner')}
                      className="h-9 rounded-lg text-[13px] flex items-center justify-center gap-2 bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
                    >
                      <span>Open plan</span>
                    </button>
                    <button
                      onClick={onOpenTaskModal}
                      className="h-9 rounded-lg hover:bg-white/[0.06] text-slate-300 hover:text-white text-[13px] transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" strokeWidth={1.5} />
                      <span>Add task</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <CheckSquare className="w-5 h-5 mx-auto text-slate-500" strokeWidth={1.5} aria-hidden />
                  <div>
                    <h4 className="text-[13px] font-medium text-white">No plan yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto">
                      Build a day-by-day plan around your hours and target date.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('planner')}
                    className="w-full h-9 rounded-lg text-[13px] flex items-center justify-center gap-2 bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
                  >
                    <span>Build my plan</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
        </>
        )}

      </main>

      {/* ── MODAL: Interactive Sheet Detail View when user clicks "Explore ->" ── */}
      <AnimatePresence>
        {selectedSheet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl bg-ink-850 border border-white/[0.08] flex flex-col overflow-hidden text-slate-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-ink-800 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    {renderSheetIcon(selectedSheet, 28)}
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Coming soon</span>
                    <h2 className="mt-1 text-xl font-medium text-white">
                      {selectedSheet.title}
                    </h2>
                    <p className="text-[13px] text-slate-400 mt-1">
                      {selectedSheet.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSheet(null)}
                  className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Outline: what the sheet will cover */}
              <div className="p-6 overflow-y-auto flex-1">
                <p className="text-[13px] text-slate-400">
                  We’re still writing the problems for this sheet. Here’s what it will cover.
                </p>
                <ol className="mt-4 divide-y divide-white/[0.06] border-y border-white/[0.06]">
                  {selectedSheet.syllabus.map((step, i) => (
                    <li key={step} className="h-11 px-1 flex items-center gap-4 text-[13px] sm:text-sm text-slate-200">
                      <span className="w-6 font-mono text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                      <span className="truncate">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Footer: the sheet that works today */}
              <div className="p-4 px-6 border-t border-white/[0.08] bg-ink-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-[13px] text-slate-500">
                  Until then, DailyCode 150 covers the same core patterns
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSheet(null)}
                    className="h-9 px-3 rounded-lg text-[13px] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { setSelectedSheet(null); setActiveView('planner'); }}
                    className="h-9 px-4 rounded-lg btn-primary-glow font-medium text-[13px] inline-flex items-center gap-2 active:scale-[0.98]"
                  >
                    Open DailyCode 150
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
