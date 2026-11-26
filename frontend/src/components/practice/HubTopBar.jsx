import React from 'react';
import { User } from 'lucide-react';

/** Breadcrumbs on the left; the streak and the profile (or the testing-mode label) on the right */
export default function HubTopBar({ onGoHome, onShowHub, activeEditorProblem, activeView, activeCategory, streak, testingMode, currentUser, onOpenAuthModal }) {
  return (
    <div className="flex items-center justify-between h-16 border-b border-white/[0.08] gap-4">
      <div className="flex items-center gap-2 text-[13px] text-slate-500">
        <span 
          onClick={onGoHome}
          className="hover:text-white cursor-pointer transition-colors"
        >
          Dashboard
        </span>
        <span>/</span>
        <span 
          onClick={() => onShowHub()}
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

        {/* Profile Button Pill (testing mode has no accounts, so a label instead) */}
        {testingMode ? (
          <span className="flex items-center h-8 px-2.5 rounded-lg text-[13px] text-amber-300 bg-amber-500/10">Testing mode</span>
        ) : (
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
        )}
      </div>
    </div>
  );
}
