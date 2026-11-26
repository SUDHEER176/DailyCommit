import React, { useState } from 'react';
import { ChevronRight, Mail, MessageCircle } from 'lucide-react';
import { Panel } from './SectionHead';
import { rv } from './ink';
import { BRAND } from '@/lib/brand';

const GROUPS = [
  {
    name: 'Getting started',
    items: [
      [`What is ${BRAND.name}?`, `A daily DSA planner for coding interviews. It spreads the DailyCode 150 list across the days you have, gives you an editor to solve in, and brings back the problems you struggled with at 3, 7 and 21 days.`],
      ['Is it free?', 'Yes. The plan, the editor, logging, streaks and revision are free. Pro adds AI code review, the code score and smart revision.'],
      ['How do I sign in?', 'With your email and a password, or with Google. Your plan, problems and streak are saved to your account and follow you to any device.'],
    ],
  },
  {
    name: 'Plans and practice',
    items: [
      ['How is my plan built?', 'Pick your level, the hours you have each day and whether to finish in 30, 45 or 60 days. The problems you haven’t solved yet are spread across those days, topic by topic.'],
      ['Which languages can I code in?', 'Python, JavaScript, C++ and Java. Python and JavaScript run in your browser; C++ and Java are compiled on the server.'],
      ['Can I solve on LeetCode instead?', 'Yes. Solve wherever you like and log the problem here. It counts toward today’s plan and your streak either way.'],
    ],
  },
  {
    name: 'Revision and streaks',
    items: [
      ['How does revision work?', 'Problems you mark as needing revision come back 3, 7 and 21 days after you solve them. With Pro, the ones you found hard come back sooner and the ones you know well wait longer.'],
      ['How is my streak counted?', 'Your streak goes up on every day you finish your planned tasks or log a solved problem. The heatmap shows each of those days.'],
    ],
  },
  {
    name: 'Pro and payments',
    items: [
      ['Does Pro renew by itself?', 'No. Pro is a one-time payment for 30 or 365 days. When it ends, your account goes back to Free and keeps all your data.'],
      ['How can I pay?', 'UPI, debit and credit cards, net banking and wallets, through Razorpay.'],
      ['Can I extend Pro early?', 'Yes. Buying again adds the new days on top of the time you have left.'],
    ],
  },
];

/** Questions grouped by topic: the groups on the left, the open group's questions on the right */
export default function FaqSection() {
  const [g, setG] = useState(0);
  const [open, setOpen] = useState(null);
  const wa = `https://wa.me/${BRAND.whatsappNumber.replace(/[^0-9]/g, '')}`;

  return (
    <section id="faqs" className="scroll-mt-24">
      <div className="land-col flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <h2 className="text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.02em] text-slate-900 dark:text-white">FAQs</h2>
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 sm:pb-2">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors">
            <MessageCircle className="w-4 h-4" strokeWidth={1.5} />WhatsApp
          </a>
          <span className="w-px h-4 bg-slate-200 dark:bg-white/[0.1]" aria-hidden />
          <a href={`mailto:${BRAND.supportEmail}`} className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Mail className="w-4 h-4" strokeWidth={1.5} />{BRAND.supportEmail}
          </a>
        </div>
      </div>

      <Panel className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-4">
        <div {...rv(0)} className="flex md:flex-col gap-1 overflow-x-auto">
          {GROUPS.map((x, i) => (
            <button
              key={x.name}
              type="button"
              aria-pressed={g === i}
              onClick={() => { setG(i); setOpen(null); }}
              className={`shrink-0 text-left h-9 px-3 rounded-lg text-[13px] transition-colors ${g === i ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              {x.name}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {GROUPS[g].items.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <li key={q} {...rv(i + 1)} className="rounded-xl bg-white dark:bg-ink-900 border border-slate-200 dark:border-white/[0.06]">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 h-14 px-4 text-left text-[14px] text-slate-800 dark:text-slate-200"
                >
                  {q}
                  <ChevronRight className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} strokeWidth={1.5} />
                </button>
                {isOpen && <p className="px-4 pb-4 -mt-1 text-[14px] leading-[1.65] text-slate-600 dark:text-slate-400 animate-fadeIn">{a}</p>}
              </li>
            );
          })}
        </ul>
      </Panel>
    </section>
  );
}
