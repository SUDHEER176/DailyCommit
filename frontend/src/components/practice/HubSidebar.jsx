import React from 'react';
import { Compass, LayoutDashboard, Code2, ChevronRight, CalendarDays, Database, Terminal, CheckSquare, HelpCircle, LogIn, User, Menu } from 'lucide-react';
import CodeStreakLogo from '../ui/CodeStreakLogo';

/** The hub's navigation: a top bar and slide-out drawer on phones, a fixed sidebar on desktop */
export default function HubSidebar({ open, setOpen, onGoHome, activeView, setActiveView, activeCategory, setActiveCategory, setActiveTab, currentUser, testingMode, onOpenAuthModal }) {
  return (
      <>
      {/* ── MOBILE TOP BAR ── */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-ink-900/90 backdrop-blur-md border-b border-white/[0.08]">
        <div onClick={onGoHome} className="cursor-pointer select-none">
          <CodeStreakLogo size={20} textSize="text-[17px]" />
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 grid place-items-center rounded-lg hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-150 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* ── LEFT SIDEBAR ── */}
      <aside
        onClickCapture={(e) => { if (e.target.closest('button, a')) setOpen(false); }}
        className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-150 ease-out ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:sticky md:top-0 md:self-start md:h-screen md:w-64 overflow-y-auto bg-ink-950 border-r border-white/[0.08] flex flex-col justify-between p-3 flex-shrink-0 select-none`}
      >

        <div className="space-y-6">
          {/* Logo / Brand Header */}
          <div className="flex items-center justify-between h-10 px-2.5">
            <div 
              onClick={onGoHome}
              className="cursor-pointer select-none"
            >
              <CodeStreakLogo size={20} textSize="text-[17px]" />
            </div>

            <button
              onClick={onGoHome}
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
              onClick={onGoHome}
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
                  <span className="text-[13px] text-white block">{testingMode ? 'Tester' : 'Guest'}</span>
                  <span className="text-xs text-slate-500 block truncate">
                    {testingMode ? 'Testing mode: no sign-in, Pro is free' : 'Sign in to sync your streak'}
                  </span>
                </div>
              </div>
              {!testingMode && (
                <button
                  onClick={onOpenAuthModal}
                  className="w-full h-8 rounded-lg bg-slate-100 hover:bg-white text-ink-900 text-[13px] font-medium transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" strokeWidth={1.5} />
                  <span>Sign in</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
      </>
  );
}
