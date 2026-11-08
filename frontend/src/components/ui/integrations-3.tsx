import React from 'react';
import { ArrowRight, Code2, ListChecks, SquareTerminal, Timer } from 'lucide-react';
import { VSCodium } from './integrations-3-utils/vs-codium';
import { LeetCodeLogo } from './BrandLogos';
import { ZeroHesitationEmblem } from './ZeroHesitationLogo';
import { BRAND } from '@/lib/brand';
import { cn } from '../../lib/utils';

export default function IntegrationsSection({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="relative w-full">
      <div className="grid items-center gap-12 lg:gap-16 md:grid-cols-2">
        <div className="order-2 md:order-1 mx-auto w-fit">
          <div className="flex justify-center gap-3">
            <IntegrationCard label="LeetCode"><LeetCodeLogo /></IntegrationCard>
            <IntegrationCard label="DailyCode 150 list"><ListChecks strokeWidth={1.5} className="text-slate-500 dark:text-slate-400" /></IntegrationCard>
          </div>
          <div className="my-3 flex justify-center gap-3">
            <IntegrationCard label="Built-in code workspace"><Code2 strokeWidth={1.5} className="text-slate-500 dark:text-slate-400" /></IntegrationCard>
            <IntegrationCard label={BRAND.name} className="bg-slate-50 dark:bg-ink-800 border-slate-300 dark:border-white/[0.14] text-slate-500 dark:text-slate-400 [&_svg]:!grayscale-0">
              <ZeroHesitationEmblem size={28} />
            </IntegrationCard>
            <IntegrationCard label="VS Code"><VSCodium /></IntegrationCard>
          </div>
          <div className="flex justify-center gap-3">
            <IntegrationCard label="Your terminal"><SquareTerminal strokeWidth={1.5} className="text-slate-500 dark:text-slate-400" /></IntegrationCard>
            <IntegrationCard label="Focus timer"><Timer strokeWidth={1.5} className="text-slate-500 dark:text-slate-400" /></IntegrationCard>
          </div>
        </div>

        <div className="order-1 md:order-2 max-w-lg">
          <span className="eyebrow">Where you solve</span>
          <h2 className="mt-3 text-[32px] sm:text-[40px] leading-[1.1] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
            Solve anywhere, log it here
          </h2>
          <p className="mt-4 text-base leading-[1.6] text-slate-600 dark:text-slate-400">
            Solve on LeetCode, in your own editor or in the built-in code workspace, then log the problem in
            {BRAND.name}. Every solve counts toward today's plan and your streak, wherever you wrote the code.
          </p>
          <button
            type="button"
            onClick={onGetStarted}
            className="mt-8 inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm text-slate-900 dark:text-white bg-white dark:bg-ink-800 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-colors active:scale-[0.98]"
          >
            Open today's plan
            <ArrowRight className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}

const IntegrationCard = ({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) => (
  <div
    title={label}
    aria-label={label}
    className={cn(
      'flex size-16 items-center justify-center rounded-xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08] [&_svg]:size-7 [&_svg]:grayscale [&_svg]:opacity-80',
      className,
    )}
  >
    {children}
  </div>
);
