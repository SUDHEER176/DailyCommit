import React from 'react';
import {
  CheckSquare,
  Timer,
  User,
  Flame,
  Sun,
  Moon,
  Layers,
  Workflow,
  Cpu,
  HelpCircle,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '../context/ThemeContext';
import CodeStreakLogo from './ui/CodeStreakLogo';

// Section links. Icons are used by the mobile bottom bar only.
export const navTabs = [
  { id: 'overview',     label: 'Overview',     icon: LayoutGrid },
  { id: 'features',     label: 'Features',     icon: Layers },
  { id: 'today-plan',   label: "Today's plan", icon: CheckSquare },
  { id: 'how-it-works', label: 'How it works', icon: Workflow },
  { id: 'integrations', label: 'Integrations', icon: Cpu },
  { id: 'faqs',         label: 'FAQ',          icon: HelpCircle },
];

const iconButton =
  'inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors';

export default function Navbar({
  activeTab,
  setActiveTab,
  onNavigate,
  streak = 7,
  onOpenProblemModal,
  onToggleTimer,
  isTimerActive,
  currentUser,
  onOpenAuthModal,
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
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-colors duration-150',
        isScrolled
          ? 'bg-slate-50/90 dark:bg-ink-900/90 backdrop-blur-md border-slate-200 dark:border-white/[0.08]'
          : 'bg-transparent border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center h-16 gap-4">
          <button
            type="button"
            onClick={() => handleNavClick('overview')}
            className="justify-self-start flex items-center rounded-lg"
            aria-label="Daily Commit home"
          >
            <CodeStreakLogo size={20} textSize="text-[17px]" />
          </button>

          <nav aria-label="Sections" className="hidden lg:flex items-center justify-center gap-1">
            {navTabs.slice(1).map((item) => {
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
            {/* Signed out there is no streak to show (streak is null) */}
            {streak != null && (
              <>
              {/* Streak readout: a flame and the day count */}
              <div
                className="hidden sm:flex items-center gap-1 h-8 px-2 text-sm"
                title={`${streak} day streak`}
                aria-label={`${streak} day streak`}
              >
                <Flame
                  size={16}
                  strokeWidth={1.5}
                  className={streak > 0 ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400 dark:text-slate-500'}
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

            <button
              type="button"
              onClick={onOpenAuthModal}
              className="hidden md:inline-flex items-center gap-2 h-8 px-3 ml-2 rounded-lg text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.1] hover:border-slate-300 dark:hover:border-white/[0.18] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
              title={signedIn ? `Signed in as ${currentUser.name}` : 'Sign in'}
            >
              {signedIn && <User size={16} strokeWidth={1.5} className="text-slate-500 dark:text-slate-400" />}
              {signedIn ? currentUser.name?.split(' ')[0] || 'Profile' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={onOpenAuthModal}
              className={cn(iconButton, 'md:hidden')}
              aria-label={signedIn ? 'Profile' : 'Sign in'}
            >
              <User size={16} strokeWidth={1.5} />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}
