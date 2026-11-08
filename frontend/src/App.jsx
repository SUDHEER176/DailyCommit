import React, { useState, useEffect } from 'react';
import { hideSplash, setSplashStatus, onSplashSkip } from './lib/splash';
import Navbar, { navTabs } from './components/Navbar';
import BottomNavBar from './components/ui/bottom-nav-bar';
import Dashboard from './components/Dashboard';
import FocusTimer from './components/FocusTimer';
import { AddTaskModal, AddProblemModal, AuthModal } from './components/modals';
import Footer from './components/Footer';
import { api } from './services/api';

import DailyPlanner from './components/DailyPlanner';
import ProblemTracker from './components/ProblemTracker';
import RoadmapView from './components/RoadmapView';
import RevisionQueue from './components/RevisionQueue';
import StatsCharts from './components/StatsCharts';
import PracticeHub from './components/PracticeHub';
import CodeWorkspace from './components/CodeWorkspace/CodeWorkspace';
import PricingPage from './components/PricingPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    const targetPath = (path === 'explore' || path === '/explore') ? '/practice/dsa' : (path || '/');
    window.history.pushState({}, '', targetPath);
    setCurrentPath(targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'explore') {
      navigate('/practice/dsa');
    }
  }, [activeTab]);
  const [tasks, setTasks] = useState([]);
  const [problems, setProblems] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [stats, setStats] = useState({
    user: { streak: 7, name: 'Alex' },
    totalProblemsSolved: 42,
    difficultyCounts: { Easy: 18, Medium: 20, Hard: 4 },
    statusCounts: { Independently: 28, NeededHint: 10, LookedAtSolution: 4 },
    revisionCount: 3,
    heatmaps: []
  });
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [activeCodeProblem, setActiveCodeProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial data & auth state
  const loadData = async () => {
    try {
      const [fetchedTasks, fetchedProblems, fetchedRoadmap, fetchedStats, userProfile] = await Promise.all([
        api.getTasks(),
        api.getProblems(),
        api.getRoadmap(),
        api.getStats(),
        api.getCurrentUser()
      ]);
      setTasks(fetchedTasks || []);
      setProblems(fetchedProblems || []);
      setRoadmap(fetchedRoadmap || []);
      setStats(fetchedStats || {});
      setCurrentUser(userProfile || null);
    } catch (err) {
      console.warn("Failed to load backend data, fallback active", err);
    } finally {
      setLoading(false);
    }
  };

  // Fade out the splash screen once the first data load settles
  useEffect(() => {
    if (!loading) hideSplash();
  }, [loading]);

  useEffect(() => {
    // Keep the splash up until the backend is awake, then load real data.
    // After a few seconds the splash explains the wait and offers "Continue offline".
    const skip = new AbortController();
    const offSkip = onSplashSkip(() => skip.abort());
    const slowTimer = setTimeout(() => setSplashStatus('Waking up the server, this can take up to a minute', true), 4000);
    api.waitForBackend({ signal: skip.signal }).finally(() => {
      clearTimeout(slowTimer);
      offSkip();
      setSplashStatus('Loading your data');
      loadData();
    });
    // The API clears an expired session; drop back to guest mode and reload local data
    const onExpired = () => { setCurrentUser(null); loadData(); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    loadData();
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    loadData();
  };

  // Today's tasks for dashboard
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === todayStr);

  // Task actions
  const handleToggleTask = async (id) => {
    const updated = await api.toggleTask(id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    const newStats = await api.getStats();
    setStats(newStats);
  };

  const handleAddTask = async (taskData) => {
    const newTask = await api.createTask(taskData);
    setTasks(prev => [newTask, ...prev]);
    const newStats = await api.getStats();
    setStats(newStats);
  };

  const handleCarryOverTask = async (id, targetDate) => {
    const updated = await api.carryOverTask(id, targetDate);
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { ...t, date: targetDate || tomorrow.toISOString().split('T')[0], carriedOver: true };
      }
      return t;
    }));
  };

  const handleDeleteTask = async (id) => {
    await api.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Problem actions
  const handleAddProblem = async (problemData) => {
    const newProblem = await api.createProblem(problemData);
    setProblems(prev => [newProblem, ...prev]);
    const newStats = await api.getStats();
    setStats(newStats);
  };

  const handleOpenCodeEditor = (prob) => {
    const problemToOpen = prob || {
      id: "nc-1",
      number: 1,
      title: "Two Sum",
      difficulty: "Easy",
      topic: "Arrays & Hashing"
    };
    setActiveCodeProblem(problemToOpen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProblemSolvedFromEditor = async (problemIdOrNumber) => {
    if (activeCodeProblem) {
      await handleAddProblem({
        title: activeCodeProblem.title,
        difficulty: activeCodeProblem.difficulty || 'Easy',
        topic: activeCodeProblem.topic || 'Algorithms',
        solveStatus: 'Independently',
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleToggleRevision = async (id) => {
    await api.toggleRevision(id);
    setProblems(prev => prev.map(p => p.id === id ? { ...p, needsRevision: !p.needsRevision } : p));
    const newStats = await api.getStats();
    setStats(newStats);
  };

  const handleDeleteProblem = async (id) => {
    await api.deleteProblem(id);
    setProblems(prev => prev.filter(p => p.id !== id));
    const newStats = await api.getStats();
    setStats(newStats);
  };

  // Roadmap actions
  const handleToggleRoadmapTopic = async (weekNum, topicIndex) => {
    await api.toggleRoadmapTopic(weekNum, topicIndex);
    const updatedRoadmap = await api.getRoadmap();
    setRoadmap(updatedRoadmap);
  };

  // Active tab index for bottom-nav-bar
  const activeIndex = navTabs.findIndex(t => t.id === activeTab);
  const handleTabChange = (idx, item) => {
    if (item?.id) {
      if (item.id === 'explore') {
        navigate('/practice/dsa');
        return;
      }
      setActiveTab(item.id);
      if (item.id === 'overview') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setTimeout(() => {
          const el = document.getElementById(item.id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 50);
      }
    }
  };

  // Standalone Full-Page Route for /practice/dsa, /practice, or /explore
  const isPracticeRoute =
    currentPath === '/practice/dsa' ||
    currentPath === '/practice' ||
    currentPath.startsWith('/practice/') ||
    currentPath === '/explore';

  if (isPracticeRoute) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-ink-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        <PracticeHub
          onNavigate={navigate}
          setActiveTab={setActiveTab}
          onOpenTaskModal={() => setIsTaskModalOpen(true)}
          onOpenProblemModal={() => setIsProblemModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          todayTasks={todayTasks}
        />

        {/* Modals on standalone practice page */}
        <AddTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onAddTask={handleAddTask}
          defaultDate={selectedDate}
        />

        <AddProblemModal
          isOpen={isProblemModalOpen}
          onClose={() => setIsProblemModalOpen(false)}
          onAddProblem={handleAddProblem}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-ink-900 text-slate-900 dark:text-slate-100 flex flex-col overflow-x-clip pb-20 md:pb-0">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNavigate={navigate}
        streak={currentUser?.isAuthenticated ? (stats.user?.streak ?? 0) : null}
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
        onOpenProblemModal={() => setIsProblemModalOpen(true)}
        onOpenCodeEditor={() => handleOpenCodeEditor()}
        onToggleTimer={() => setIsTimerOpen(!isTimerOpen)}
        isTimerActive={isTimerOpen}
        revisionCount={problems.filter(p => p.needsRevision).length}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area: Dynamic View based on activeTab */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPath === '/pricing' ? (
          <PricingPage
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onUserUpdate={(pro) => setCurrentUser((u) => (u ? { ...u, ...pro } : u))}
          />
        ) : (<>
        {activeTab === 'planner' && (
              <DailyPlanner
                setActiveTab={setActiveTab}
                onOpenTaskModal={() => setIsTaskModalOpen(true)}
              />
            )}
            {activeTab === 'problems' && (
              <ProblemTracker
                setActiveTab={setActiveTab}
                onOpenProblemModal={() => setIsProblemModalOpen(true)}
                onOpenCodeEditor={handleOpenCodeEditor}
              />
            )}
            {activeTab === 'roadmap' && (
              <RoadmapView
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'revision' && (
              <RevisionQueue
                setActiveTab={setActiveTab}
                onOpenProblemModal={() => setIsProblemModalOpen(true)}
              />
            )}
            {activeTab === 'analytics' && (
              <StatsCharts
                setActiveTab={setActiveTab}
                stats={stats}
              />
            )}
            {activeTab === 'explore' && (
              <PracticeHub
                onNavigate={navigate}
                setActiveTab={setActiveTab}
                onOpenTaskModal={() => setIsTaskModalOpen(true)}
                onOpenProblemModal={() => setIsProblemModalOpen(true)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onOpenCodeEditor={handleOpenCodeEditor}
                currentUser={currentUser}
                todayTasks={todayTasks}
              />
            )}
            {(activeTab === 'dashboard' || !['planner', 'problems', 'roadmap', 'revision', 'analytics', 'explore'].includes(activeTab)) && (
              <Dashboard
                stats={stats}
                todayTasks={todayTasks}
                onToggleTask={handleToggleTask}
                onOpenTaskModal={() => setIsTaskModalOpen(true)}
                onOpenProblemModal={() => setIsProblemModalOpen(true)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                currentUser={currentUser}
                setActiveTab={setActiveTab}
                activeTab={activeTab}
                onNavigate={navigate}
              />
            )}
        </>)}
      </main>

      {/* Footer 12 */}
      <Footer stats={stats} setActiveTab={setActiveTab} onNavigate={navigate} />

      {/* Floating Bottom Nav Bar (Shadcn + Framer Motion Pattern) */}
      <div className="md:hidden">
        <BottomNavBar
          stickyBottom
          items={navTabs}
          activeIndex={activeIndex !== -1 ? activeIndex : 0}
          onTabChange={handleTabChange}
          revisionCount={problems.filter(p => p.needsRevision).length}
        />
      </div>

      {/* Floating Focus Stopwatch / Timer */}
      <FocusTimer
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
      />

      {/* Modals */}
      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onAddTask={handleAddTask}
        defaultDate={selectedDate}
      />

      <AddProblemModal
        isOpen={isProblemModalOpen}
        onClose={() => setIsProblemModalOpen(false)}
        onAddProblem={handleAddProblem}
      />

      {/* Sign-in modal: email and password, or Google */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />



    </div>
  );
}
