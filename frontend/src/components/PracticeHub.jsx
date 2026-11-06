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

  // Domain tab filter: DSA, Core CS, System Design, Data Engineering
  const [activeCategory, setActiveCategory] = useState('DSA');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSheet, setSelectedSheet] = useState(null); // When user clicks 'Explore ->'
  const [completedTopicIds, setCompletedTopicIds] = useState(() => {
    try {
      const saved = localStorage.getItem('practice_hub_completed_topics');
      return saved ? JSON.parse(saved) : ['step-1-1', 'step-1-2', 'step-3-1'];
    } catch {
      return ['step-1-1', 'step-1-2', 'step-3-1'];
    }
  });

  const toggleTopicCheck = (id) => {
    setCompletedTopicIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('practice_hub_completed_topics', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  // Sheet Catalog Data modeled after takeUforward
  const sheets = [
    {
      id: 'cpp-beginners',
      section: 'Start Coding',
      title: 'C++ for Beginners',
      description: 'Master fast I/O, STL containers, pointers, and memory mechanics for DSA.',
      tag: 'Free certification',
      icon: 'C++',
      iconColor: 'from-brand-600 to-slate-600',
      modules: '9 Modules',
      topics: '29 Topics',
      hours: '1.1 Hrs',
      category: 'DSA',
      popular: false,
      syllabus: [
        { id: 'cpp-1', title: 'Basics of C++: Variables, Types, Input/Output', count: '4 Topics' },
        { id: 'cpp-2', title: 'Conditionals & Loop Constructs', count: '5 Topics' },
        { id: 'cpp-3', title: 'Functions, Pass by Reference & Pointers', count: '6 Topics' },
        { id: 'cpp-4', title: 'Standard Template Library (Vectors, Sets, Maps)', count: '8 Topics' },
        { id: 'cpp-5', title: 'Time Complexity Analysis for C++ Code', count: '6 Topics' }
      ]
    },
    {
      id: 'python-dsa',
      section: 'Start Coding',
      title: 'Python for DSA Mastery',
      description: 'Clean syntax, list comprehensions, heaps, and recursion tricks in Python.',
      tag: 'Interview Ready',
      icon: 'Py',
      iconColor: 'from-amber-500 to-emerald-500',
      modules: '8 Modules',
      topics: '34 Topics',
      hours: '2.4 Hrs',
      category: 'DSA',
      popular: false,
      syllabus: [
        { id: 'py-1', title: 'Python Syntax & Dynamic Typing', count: '5 Topics' },
        { id: 'py-2', title: 'Built-in Data Structures: Lists, Dicts, Tuples, Deque', count: '8 Topics' },
        { id: 'py-3', title: 'Heapq & Collections Module in Depth', count: '6 Topics' },
        { id: 'py-4', title: 'Recursion Depth & Memoization with functools', count: '7 Topics' }
      ]
    },
    {
      id: 'striver-a2z',
      section: 'Learn From Zero',
      title: "Striver's A2Z DSA Sheet",
      description: 'The complete #1 master syllabus taking you from elementary programming to dynamic programming mastery.',
      tag: 'Most Popular',
      icon: 'A2Z',
      iconColor: 'from-rose-500 via-slate-600 to-brand-600',
      modules: '20 Modules',
      topics: '455 Topics',
      contests: '16 Contests',
      hours: '131.4 Hrs',
      category: 'DSA',
      popular: true,
      syllabus: [
        { id: 'a2z-1', title: 'Step 1: Learn the Basics (Math, Recursion, Time Complexity)', count: '24 Problems' },
        { id: 'a2z-2', title: 'Step 2: Learn Important Sorting Techniques (Merge, Quick, Cyclic)', count: '7 Problems' },
        { id: 'a2z-3', title: 'Step 3: Solve Problems on Arrays (Easy, Medium, Hard)', count: '40 Problems' },
        { id: 'a2z-4', title: 'Step 4: Binary Search on 1D, 2D Arrays & Search Space', count: '32 Problems' },
        { id: 'a2z-5', title: 'Step 5: Strings (Basic to Advanced KMP/Z-Algorithm)', count: '18 Problems' },
        { id: 'a2z-6', title: 'Step 6: Learn LinkedList (Single, Doubly, Fast/Slow Pointers)', count: '31 Problems' },
        { id: 'a2z-7', title: 'Step 7: Recursion & Backtracking Patterns', count: '22 Problems' },
        { id: 'a2z-8', title: 'Step 8: Bit Manipulation & Bitmasks', count: '14 Problems' },
        { id: 'a2z-9', title: 'Step 9: Stacks and Queues (Monotonic Stack & LRU)', count: '30 Problems' },
        { id: 'a2z-10', title: 'Step 10: Sliding Window & Two Pointers', count: '16 Problems' },
        { id: 'a2z-11', title: 'Step 11: Heaps & Priority Queues', count: '18 Problems' },
        { id: 'a2z-12', title: 'Step 12: Greedy Algorithms', count: '15 Problems' },
        { id: 'a2z-13', title: 'Step 13: Binary Trees (Traversals, Views, Construction)', count: '38 Problems' },
        { id: 'a2z-14', title: 'Step 14: Binary Search Trees (BST)', count: '16 Problems' },
        { id: 'a2z-15', title: 'Step 15: Graphs (BFS/DFS, Cycles, TopoSort, Dijkstra, Disjoint Set)', count: '54 Problems' },
        { id: 'a2z-16', title: 'Step 16: Dynamic Programming (1D, 2D, Grids, Subsequences, Trees)', count: '56 Problems' },
        { id: 'a2z-17', title: 'Step 17: Tries (Insert, Search, Prefix & XOR)', count: '7 Problems' },
        { id: 'a2z-18', title: 'Step 18: Advanced Strings & Rabin-Karp', count: '8 Problems' }
      ]
    },
    {
      id: 'striver-sde-180',
      section: 'Interview Prep – India & Global Tier-1',
      title: "Striver's SDE Sheet (Top 180)",
      description: 'The gold standard high-yield curated question set asked at Google, Amazon, Microsoft, and Uber.',
      tag: 'FAANG Benchmark',
      icon: '180',
      iconColor: 'from-amber-500 to-amber-600',
      modules: '26 Modules',
      topics: '180 Core Drills',
      hours: '54.0 Hrs',
      category: 'DSA',
      popular: true,
      syllabus: [
        { id: 'sde-1', title: 'Day 1: Arrays (Set Matrix Zeroes, Pascal, Next Permutation)', count: '6 Problems' },
        { id: 'sde-2', title: 'Day 2: Arrays Part-II (Rotate Matrix, Merge Intervals, Find Duplicate)', count: '6 Problems' },
        { id: 'sde-3', title: 'Day 3: Arrays/Math (Search 2D, Pow(x,n), Majority Element)', count: '6 Problems' },
        { id: 'sde-4', title: 'Day 4: Arrays Part-IV (2 Sum, 4 Sum, Longest Consecutive Sequence)', count: '6 Problems' },
        { id: 'sde-5', title: 'Day 5: LinkedList (Reverse, Middle, Merge Two Sorted, Delete Kth)', count: '6 Problems' },
        { id: 'sde-6', title: 'Day 6: LinkedList Part-II (Intersection, Cycle Detection, Flatten)', count: '6 Problems' },
        { id: 'sde-7', title: 'Day 7: Two Pointers (3Sum, Trapping Rainwater, Max Consecutive Ones)', count: '6 Problems' },
        { id: 'sde-8', title: 'Day 8: Greedy Algorithm (N Meetings, Minimum Platforms, Job Sequencing)', count: '6 Problems' },
        { id: 'sde-9', title: 'Day 9: Recursion & Backtracking (Subsets, Combination Sum, Palindrome Partition)', count: '6 Problems' },
        { id: 'sde-10', title: 'Day 10: Backtracking (N-Queens, Sudoku Solver, M Coloring)', count: '6 Problems' }
      ]
    },
    {
      id: 'striver-75',
      section: 'Interview Prep – India & Global Tier-1',
      title: "Striver's 75 Challenge",
      description: 'Crisp, high-impact 75 patterns for fast-track 30-day interview cramming.',
      tag: '30-Day Sprint',
      icon: '75',
      iconColor: 'from-brand-500 to-brand-600',
      modules: '14 Modules',
      topics: '75 Problems',
      hours: '28.5 Hrs',
      category: 'DSA',
      popular: false,
      syllabus: [
        { id: 'st75-1', title: 'Arrays & Hashing Essentials', count: '10 Problems' },
        { id: 'st75-2', title: 'Two Pointers & Sliding Window', count: '8 Problems' },
        { id: 'st75-3', title: 'Stack & Monotonic Deque', count: '7 Problems' },
        { id: 'st75-4', title: 'Binary Search Patterns', count: '8 Problems' },
        { id: 'st75-5', title: 'Linked Lists & Two Pointer Traversal', count: '6 Problems' },
        { id: 'st75-6', title: 'Trees & BST Essentials', count: '12 Problems' },
        { id: 'st75-7', title: 'Graphs BFS/DFS & Shortest Path', count: '12 Problems' },
        { id: 'st75-8', title: 'Dynamic Programming Top Patterns', count: '12 Problems' }
      ]
    },
    {
      id: 'system-design-primer',
      section: 'System Design Architecture',
      title: 'High-Level Design (HLD) Master',
      description: 'Distributed caches, load balancing, sharding, message queues, and rate limiters.',
      tag: 'Mid-Senior Level',
      icon: 'HLD',
      iconColor: 'from-emerald-500 to-brand-600',
      modules: '12 Modules',
      topics: '48 Architecture Case Studies',
      hours: '32.0 Hrs',
      category: 'System Design',
      popular: false,
      syllabus: [
        { id: 'hld-1', title: 'Load Balancers, Consistent Hashing & DNS', count: '6 Topics' },
        { id: 'hld-2', title: 'Caching Strategies (Redis, Memcached, Eviction Policies)', count: '8 Topics' },
        { id: 'hld-3', title: 'Database Sharding, Replication & CAP Theorem', count: '10 Topics' },
        { id: 'hld-4', title: 'Message Queues (Kafka, RabbitMQ, Decoupled Systems)', count: '8 Topics' },
        { id: 'hld-5', title: 'Design URL Shortener (TinyURL)', count: 'Case Study' },
        { id: 'hld-6', title: 'Design WhatsApp / Real-Time Chat Architecture', count: 'Case Study' }
      ]
    },
    {
      id: 'core-cs-fundamentals',
      section: 'Core CS Fundamentals',
      title: 'Operating Systems & DBMS for Interviews',
      description: 'Processes, threads, locks, virtual memory, ACID properties, and B+ Trees.',
      tag: 'University & Campus',
      icon: 'OS',
      iconColor: 'from-slate-500 to-slate-600',
      modules: '10 Modules',
      topics: '64 Theory Quizzes',
      hours: '18.0 Hrs',
      category: 'Core CS',
      popular: false,
      syllabus: [
        { id: 'os-1', title: 'Processes, Threads & Concurrency (Mutex vs Semaphores)', count: '12 Topics' },
        { id: 'os-2', title: 'CPU Scheduling Algorithms & Deadlocks', count: '10 Topics' },
        { id: 'os-3', title: 'Memory Management & Paging / Virtual Memory', count: '12 Topics' },
        { id: 'db-1', title: 'DBMS: Relational Model, Keys & Normalization (1NF to BCNF)', count: '14 Topics' },
        { id: 'db-2', title: 'Transactions, ACID Properties & Concurrency Control', count: '16 Topics' }
      ]
    }
  ];

  // Filter sheets by active category
  const filteredSheets = sheets.filter(s => {
    const matchesCategory = activeCategory === 'DSA' ? (s.category === 'DSA' || s.section === 'Learn From Zero' || s.section === 'Start Coding') : s.category === activeCategory;
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

      {/* ── LEFT SIDEBAR (takeUforward Style) ── */}
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
              <span>NeetCode 150 plan</span>
            </button>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors text-left text-slate-400 hover:text-white hover:bg-white/[0.04]"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
              <span>Community</span>
            </a>
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
                    {currentUser.name || 'Alex Learner'}
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
              onClick={() => { setActiveEditorProblem(null); setActiveView('sheets'); }}
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
              <span className="cell" data-level="4" aria-hidden />
              <span className="font-mono tabular-nums text-white">{currentUser?.streak || 7}</span>
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
              onBack={() => setActiveEditorProblem(null)}
              onProblemSolved={(probId) => {
                if (probId) toggleTopicCheck(probId);
              }}
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
            {/* Daily LeetCode Challenge Card */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-ink-850 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex items-start sm:items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-ink-800 border border-white/[0.08] flex items-center justify-center text-slate-300 flex-shrink-0">
                  <Code2 className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Today’s problem · Day 1</span>
                  </div>
                  <h3 className="text-[17px] font-medium text-white flex items-baseline gap-3 flex-wrap">
                    <span>1. Two Sum</span>
                    <span className="text-[13px] font-normal text-emerald-400">Easy</span>
                    <span className="text-[13px] font-normal text-slate-500">Arrays & Hashing</span>
                  </h3>
                  <p className="text-[13px] text-slate-400">
                    Asked at Google, Meta and Amazon · about 15 min
                  </p>
                </div>
              </div>

              <div className="relative flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setActiveEditorProblem({
                    id: "nc-1",
                    number: 1,
                    title: "Two Sum",
                    difficulty: "Easy",
                    topic: "Arrays & Hashing"
                  })}
                  className="flex items-center gap-2 h-10 px-4 rounded-[10px] btn-primary-glow text-white font-medium text-sm active:scale-[0.98]"
                >
                  <span>Solve in editor</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            {/* NeetCode 150 Personalized Planner Featured Banner */}
            <div className="rounded-2xl border border-white/[0.08] bg-ink-850 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[15px] font-medium text-white">
                  A NeetCode 150 plan built around your interview date
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
                {['DSA', 'Core CS', 'System Design', 'Data Engineering'].map((cat) => (
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

            {/* ── TWO-COLUMN MAIN VIEW (Sheets on Left, Promotion & Planner on Right) ── */}
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
                      {sectionName === 'Start Coding' && (
                        <span className="text-[13px] font-normal text-slate-500">Free certification</span>
                      )}
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
                                  {sheet.tag}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-[13px] text-slate-400 line-clamp-2 leading-[1.55]">
                            {sheet.description}
                          </p>

                          {/* Stats Metrics */}
                          <div className="flex items-center gap-2 font-mono text-xs tabular-nums text-slate-500 flex-wrap">
                            <span>{sheet.modules}</span>
                            <span aria-hidden>·</span>
                            <span>{sheet.topics}</span>
                            {sheet.hours && (
                              <>
                                <span aria-hidden>·</span>
                                <span>{sheet.hours}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Explore -> Button */}
                        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                          <span className="text-xs text-slate-500">Free</span>

                          <button
                            onClick={() => setSelectedSheet(sheet)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT 1 COL: Promotional Garba Sale Widget + Daily Planner Widget */}
          <div className="space-y-6">
            
            {/* Promo Card: CodeStreak Pro Pass */}
            <div className="p-6 rounded-2xl bg-ink-850 border border-white/[0.08] space-y-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Pro</span>
                  <h3 className="text-[17px] font-medium text-white mt-1">
                    {BRAND.name} Pro
                  </h3>
                </div>

                {/* Ticket coupon visual */}
                <Ticket className="w-5 h-5 text-slate-500" strokeWidth={1.5} aria-hidden />
              </div>

              <div className="h-11 px-3 rounded-[10px] bg-ink-800 border border-white/[0.08] text-[13px] text-slate-400 flex items-center justify-between">
                <span>Access code</span>
                <span className="font-mono text-white">
                  ZERO2026
                </span>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText('ZERO2026');
                                    alert("Access code ZERO2026 copied");
                }}
                className="w-full h-10 rounded-[10px] text-sm flex items-center justify-center gap-2 bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
              >
                <span>Copy code and unlock</span>
                <ChevronRight className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              </button>
            </div>

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
                    <span className="text-xs text-slate-500">
                      {selectedSheet.tag}
                    </span>
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

              {/* Modal Body: Syllabus Step List */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="flex items-center justify-between text-[13px] text-slate-500">
                  <span>{selectedSheet.syllabus.length} steps</span>
                  <span>Check a step when you finish it</span>
                </div>

                <div className="space-y-1">
                  {selectedSheet.syllabus.map((step, i) => {
                    const isChecked = completedTopicIds.includes(step.id);
                    return (
                      <div
                        key={step.id}
                        className={`h-12 px-3 rounded-[10px] transition-colors flex items-center justify-between gap-3 hover:bg-white/[0.03] ${
                          isChecked ? 'text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <button
                            onClick={() => toggleTopicCheck(step.id)}
                            className="flex-shrink-0 rounded-[4px]"
                            aria-label={isChecked ? 'Mark not done' : 'Mark done'}
                          >
                            {isChecked ? (
                              <span className="grid place-items-center w-4 h-4 rounded-[4px] bg-brand-500 text-white"><Check className="w-3 h-3" strokeWidth={2.5} /></span>
                            ) : (
                              <span className="block w-4 h-4 rounded-[4px] border border-white/[0.14] hover:border-white/30 transition-colors" />
                            )}
                          </button>
                          <span className={`text-[13px] sm:text-sm truncate ${isChecked ? 'line-through decoration-slate-600' : ''}`}>
                            {step.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-xs text-slate-500">
                            {step.count}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedSheet(null);
                              setActiveEditorProblem({
                                id: step.id,
                                title: step.title,
                                difficulty: 'Medium',
                                topic: selectedSheet?.title || 'DSA'
                              });
                            }}
                            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg hover:bg-white/[0.06] text-brand-400 text-[13px] transition-colors active:scale-[0.98]"
                            title="Open in the code editor"
                          >
                            <Code2 className="w-4 h-4" strokeWidth={1.5} />
                            <span>Solve</span>
                          </button>
                          <a
                            href="https://leetcode.com/problemset/all/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors"
                            title="Open on LeetCode"
                            aria-label="Open on LeetCode"
                          >
                            <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-white/[0.08] bg-ink-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-[13px] text-slate-500">
                  Progress saves as you check steps
                </span>
                <button
                  onClick={() => setSelectedSheet(null)}
                  className="h-9 px-4 rounded-lg bg-slate-100 hover:bg-white text-ink-900 font-medium text-[13px] transition-colors active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
