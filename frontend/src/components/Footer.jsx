import React, { useState } from 'react';
import { CheckCircle2, Github, Twitter, ArrowUpRight } from 'lucide-react';
import CodeStreakLogo from './ui/CodeStreakLogo';
import { BRAND } from '@/lib/brand';

const NAV_LINKS = {
  Product: [
    { label: 'Overview', href: '#overview' },
    { label: 'Practice hub', href: '#explore' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Features', href: '#features' },
    { label: "Today's plan", href: '#today-plan' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'FAQ', href: '#faqs' },
  ],
  Resources: [
    { label: 'LeetCode', href: 'https://leetcode.com', external: true },
    { label: 'NeetCode', href: 'https://neetcode.io', external: true },
    { label: 'Striver SDE', href: 'https://takeuforward.org', external: true },
    { label: 'CP-Algorithms', href: 'https://cp-algorithms.com', external: true },
  ],
  Company: [
    { label: 'About', href: '#about' },
    { label: 'Privacy', href: '#privacy' },
    { label: 'Terms', href: '#terms' },
  ],
};

export default function Footer({ setActiveTab, onNavigate }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setSubmitted(true);
    setEmail('');
  };

  const handleLink = (e, link) => {
    if (link.external || !link.href.startsWith('#')) return;
    e.preventDefault();
    const tabId = link.href.slice(1);
    if (tabId === 'pricing') {
      if (onNavigate) onNavigate('/pricing');
      return;
    }
    if (tabId === 'explore') {
      if (onNavigate) onNavigate('/practice/dsa');
      else {
        window.history.pushState({}, '', '/practice/dsa');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      return;
    }
    if (setActiveTab) setActiveTab(tabId);
    // Sections live on the home page, so leave other pages (like Pricing) first
    const leaving = window.location.pathname !== '/' && onNavigate;
    if (leaving) onNavigate('/');
    setTimeout(() => {
      const el = document.getElementById(tabId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, leaving ? 80 : 0);
  };

  return (
    <footer className="relative z-10 w-full mt-32 border-t border-slate-200 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 grid grid-cols-2 md:grid-cols-12 gap-12">
          {/* Brand and newsletter */}
          <div className="col-span-2 md:col-span-6">
            <CodeStreakLogo size={20} textSize="text-[17px]" />
            <p className="mt-4 max-w-xs text-sm leading-[1.6] text-slate-500 dark:text-slate-400">
              A daily DSA plan, problem log and revision queue for coding interview prep.
            </p>

            <div className="mt-8 max-w-sm">
              <label htmlFor="footer-newsletter-email" className="block text-sm text-slate-900 dark:text-white">
                One pattern and one interview tip, every Monday
              </label>
              {!submitted ? (
                <form onSubmit={handleSubscribe} className="mt-3 flex gap-2" noValidate>
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="Email"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'footer-newsletter-error' : undefined}
                    className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-white dark:bg-ink-800 border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <button
                    id="footer-newsletter-submit"
                    type="submit"
                    className="h-10 px-4 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-ink-900 text-sm font-medium hover:bg-slate-700 dark:hover:bg-white transition-colors active:scale-[0.98]"
                  >
                    Subscribe
                  </button>
                </form>
              ) : (
                <p className="mt-3 flex items-center gap-2 h-10 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                  Subscribed. The first one arrives Monday
                </p>
              )}
              {error ? (
                <p id="footer-newsletter-error" className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">No spam. Unsubscribe any time</p>
              )}
            </div>
          </div>

          {Object.entries(NAV_LINKS).map(([group, links]) => (
            <div key={group} className="md:col-span-2">
              <h3 className="text-[13px] text-slate-500">{group}</h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      onClick={(e) => handleLink(e, link)}
                      className="group inline-flex items-center gap-1 h-7 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm"
                    >
                      {link.label}
                      {link.external && (
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" strokeWidth={1.5} aria-hidden />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-6 border-t border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© 2026 {BRAND.name}</p>
          <div className="flex items-center gap-1">
            {[
              { Icon: Github, href: 'https://github.com', label: 'GitHub' },
              { Icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
