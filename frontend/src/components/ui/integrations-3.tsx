import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Gemini } from './integrations-3-utils/gemini';
import { Replit } from './integrations-3-utils/replit';
import { MagicUI } from './integrations-3-utils/magic-ui';
import { VSCodium } from './integrations-3-utils/vs-codium';
import { MediaWiki } from './integrations-3-utils/media-wiki';
import { GooglePaLM } from './integrations-3-utils/google-palm';
import { ZeroHesitationEmblem } from './ZeroHesitationLogo';
import { BRAND } from '@/lib/brand';
import { cn } from '../../lib/utils';

export default function IntegrationsSection({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="relative w-full">
      <div className="grid items-center gap-12 lg:gap-16 md:grid-cols-2">
        <div className="order-2 md:order-1 mx-auto w-fit">
          <div className="flex justify-center gap-3">
            <IntegrationCard label="Gemini"><Gemini /></IntegrationCard>
            <IntegrationCard label="Replit"><Replit /></IntegrationCard>
          </div>
          <div className="my-3 flex justify-center gap-3">
            <IntegrationCard label="Magic UI"><MagicUI /></IntegrationCard>
            <IntegrationCard label={BRAND.name} className="bg-slate-50 dark:bg-ink-800 border-slate-300 dark:border-white/[0.14] text-slate-500 dark:text-slate-400 [&_svg]:!grayscale-0">
              <ZeroHesitationEmblem size={28} />
            </IntegrationCard>
            <IntegrationCard label="VS Code"><VSCodium /></IntegrationCard>
          </div>
          <div className="flex justify-center gap-3">
            <IntegrationCard label="Docs and wiki"><MediaWiki /></IntegrationCard>
            <IntegrationCard label="PaLM"><GooglePaLM /></IntegrationCard>
          </div>
        </div>

        <div className="order-1 md:order-2 max-w-lg">
          <span className="eyebrow">Integrations</span>
          <h2 className="mt-3 text-[32px] sm:text-[40px] leading-[1.1] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
            Works with the editors and tutors you already use
          </h2>
          <p className="mt-4 text-base leading-[1.6] text-slate-600 dark:text-slate-400">
            Connect {BRAND.name} to LeetCode, VS Code, a Gemini tutor and cloud IDEs, so a problem you solve
            somewhere else still counts toward today.
          </p>
          <button
            type="button"
            onClick={onGetStarted}
            className="mt-8 inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm text-slate-900 dark:text-white bg-white dark:bg-ink-800 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-colors active:scale-[0.98]"
          >
            Connect integrations
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
