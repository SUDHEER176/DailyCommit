import React from 'react';
import {
  CheckSquare,
  Timer,
  User,
  Sun,
  Moon,
  Layers,
  Workflow,
  Shapes,
  Scale,
  HelpCircle,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '../context/ThemeContext';
import CodeStreakLogo from './ui/CodeStreakLogo';
import { isPro } from '@/lib/pro';

// Section links. Icons are used by the mobile bottom bar only.
export const navTabs = [
  { id: 'overview',     label: 'Overview',     icon: LayoutGrid },
  { id: 'today-plan',   label: "Today's plan", icon: CheckSquare },
  { id: 'sheets',       label: 'Sheets',       icon: Layers },
  { id: 'how-it-works', label: 'How it works', icon: Workflow },
  { id: 'topics',       label: 'Topics',       icon: Shapes },
  { id: 'compare',      label: 'Free vs Pro',  icon: Scale },
  { id: 'faqs',         label: 'FAQ',          icon: HelpCircle },
];

const iconButton =
  'inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors';

export default function Navbar({
  activeTab,
  setActiveTab,
  onNavigate,
  streak = 7,
  committedToday = false, // something on today's plan is done, so today's square is filled
  wide = false, // the landing page runs edge to edge, so the bar does too
  onOpenProblemModal,
  onToggleTimer,
  isTimerActive,
  currentUser,
  onOpenAuthModal,
  testingMode = false, // no accounts in testing mode, so no sign-in button
}) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { theme, toggleTheme } = useTheme();

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onPricing = typeof window !== 'undefined' && window.location.pathname === '/pricing';

  const handleNavClick = (tabId) => {
    // Section links live on the home page, so leave other pages first
    if (window.location.pathname !== '/' && onNavigate) onNavigate('/');
    setActiveTab(tabId);
    if (tabId === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setTimeout(() => {
      document.getElementById(tabId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const signedIn = currentUser?.isAuthenticated;

  return (
    <header
      className="sticky top-0 z-50 w-full pt-3"
    >
      <div className={wide ? 'px-3 sm:px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        {/* At the top it's see-through and full width, sitting on the page. Once the page
            scrolls it narrows into a centered, shorter pill of frosted glass */}
        <div
          className={cn(
            'nav-bar mx-auto w-full grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 pl-4 pr-3 rounded-2xl border',
            isScrolled
              ? 'h-12 bg-white/[0.88] dark:bg-ink-850/[0.88] backdrop-blur-[24px] backdrop-saturate-150 border-slate-200/80 dark:border-white/[0.08] shadow-[0_12px_32px_-18px_rgba(11,13,20,0.4)] dark:shadow-[0_12px_32px_-14px_rgba(0,0,0,0.7)]'
              : 'h-14 bg-transparent border-transparent'
          )}
          style={{ maxWidth: isScrolled ? '65rem' : '100%' }}
        >
          <button
            type="button"
            onClick={() => handleNavClick('overview')}
            className="justify-self-start flex items-center rounded-lg"
            aria-label="Daily Commit home"
          >
            <CodeStreakLogo size={20} textSize="text-[17px]" />
          </button>

          <nav aria-label="Sections" className="hidden lg:flex items-center justify-center gap-1">
            {navTabs.slice(1).filter((item) => item.id !== 'compare' && (signedIn || item.id !== 'today-plan')).map((item) => {
              const isActive = !onPricing && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'h-8 px-3 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.06]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/pricing')}
              aria-current={onPricing ? 'page' : undefined}
              className={cn(
                'h-8 px-3 rounded-lg text-sm transition-colors',
                onPricing
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.06]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Pricing
            </button>
          </nav>

          <div className="col-start-3 justify-self-end flex items-center gap-1">
            {/* Signed out there is no streak to show (streak is null). The scrolled glass pill
                leaves it out too, to stay compact */}
            {streak != null && !isScrolled && (
              <>
              {/* Streak readout: today's commit square, filled once something today is done, and the day count */}
              <div
                className="hidden sm:flex items-center gap-2 h-8 px-2 text-sm"
                title={`${streak} day streak, today ${committedToday ? 'done' : 'not done yet'}`}
                aria-label={`${streak} day streak, today ${committedToday ? 'done' : 'not done yet'}`}
              >
                <span
                  className={cn(
                    'w-3 h-3 rounded-[3px] transition-colors',
                    committedToday ? 'bg-brand-500' : 'border border-slate-300 dark:border-white/[0.24]'
                  )}
                  aria-hidden
                />
                <span className="font-mono tabular-nums text-slate-900 dark:text-white">{streak}</span>
              </div>

              <span className="hidden sm:block w-px h-4 mx-1 bg-slate-200 dark:bg-white/[0.08]" aria-hidden />
              </>
            )}

            <button
              type="button"
              onClick={onToggleTimer}
              className={cn(iconButton, isTimerActive && 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.06]')}
              title="Focus timer"
              aria-label="Focus timer"
              aria-pressed={!!isTimerActive}
            >
              <Timer size={16} strokeWidth={1.5} />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={iconButton}
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            </button>

            {testingMode ? (
              <span className="inline-flex items-center h-8 px-3 ml-3 rounded-lg text-sm text-amber-700 dark:text-amber-300 bg-amber-500/10">Testing</span>
            ) : (<>
            {/* Sign in is a quiet link; signed in, the same spot shows the name */}
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="hidden md:inline-flex items-center gap-2 h-8 px-3 ml-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              title={signedIn ? `Signed in as ${currentUser.name}${isPro(currentUser) ? ' · Pro' : ''}` : 'Sign in'}
            >
              {signedIn && <User size={16} strokeWidth={1.5} className="text-slate-500 dark:text-slate-400" />}
              {signedIn ? currentUser.name?.split(' ')[0] || 'Profile' : 'Sign in'}
              {isPro(currentUser) && (
                <span className="font-mono text-[11px] leading-none px-1.5 py-1 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">Pro</span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenAuthModal}
              className={cn(iconButton, 'md:hidden')}
              aria-label={signedIn ? 'Profile' : 'Sign in'}
            >
              <User size={16} strokeWidth={1.5} />
            </button>
            </>)}

            {/* The one solid action, last in the row */}
            {!signedIn && !testingMode && (
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('/practice/dsa')}
                className="on-dark hidden sm:inline-flex items-center gap-2 h-8 pl-3 pr-2.5 ml-1 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-ink-900 dark:hover:bg-white transition-colors active:scale-[0.98]"
              >
                Get started
                <ArrowRight size={16} strokeWidth={1.5} />
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
