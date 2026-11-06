import { ArrowRight, Mail } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BRAND } from '@/lib/brand';

export interface FaqItem {
  q: string;
  a: string;
}

export interface Faqs01Props {
  defaultValue?: string;
  supportEmail?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  items?: FaqItem[];
}

const defaultFaqs: FaqItem[] = [
  {
    q: `What is ${BRAND.name}?`,
    a: `${BRAND.name} is a daily DSA planner and problem tracker for interview prep. It puts a roadmap, the day's problems, a spaced revision queue and a solve heatmap in one place, so practice turns into a habit.`,
  },
  {
    q: 'How does the revision queue work?',
    a: `When a problem took a hint or felt shaky, mark it for revision. ${BRAND.name} brings it back on day 1, 3, 7 and 14, so the pattern is still there when the interview comes.`,
  },
  {
    q: 'Can I change my daily targets and roadmap?',
    a: 'Yes. Switch between the 4 week sprint and the 6 week roadmap, set how long you plan to spend on each problem, and add your own tasks to any day.',
  },
  {
    q: 'How is my streak counted?',
    a: 'Your streak goes up on every day you finish your planned tasks or log a solved problem. The heatmap shows each of those days, along with your difficulty split and pace over time.',
  },
  {
    q: 'How do I sign in?',
    a: `Create an account with your email and a password, or continue with Google. Your plan, problems and streak are saved to your account and follow you to any device.`,
  },
  {
    q: 'Can I get help with my prep plan?',
    a: 'Write to us by email or message the team on WhatsApp with the buttons below. We reply within four business hours.',
  },
];

const contactButton =
  'inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-ink-800 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-colors';

export default function Faqs01({
  defaultValue,
  supportEmail = BRAND.supportEmail,
  whatsappNumber = BRAND.whatsappNumber,
  whatsappMessage = `Hi ${BRAND.name} team, I have a question about my DSA prep plan.`,
  items = defaultFaqs,
}: Faqs01Props) {
  const mailtoHref = `mailto:${supportEmail}?subject=${encodeURIComponent(`Question from a ${BRAND.name} user`)}`;
  const whatsappHref = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-slate-900 dark:text-slate-100">
      <div className="lg:col-span-4">
        <span className="eyebrow">FAQ</span>
        <h2 className="mt-3 text-[32px] sm:text-[40px] leading-[1.1] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
          Questions people ask first
        </h2>
        <p className="mt-4 text-base leading-[1.6] text-slate-600 dark:text-slate-400">
          Can&apos;t find yours? Write to{' '}
          <a
            href={mailtoHref}
            className="text-slate-900 dark:text-white underline underline-offset-4 decoration-slate-300 dark:decoration-white/30 hover:decoration-current rounded-sm"
          >
            {supportEmail}
          </a>
        </p>
      </div>

      <div className="lg:col-span-8">
        <Accordion
          type="single"
          collapsible
          className="border-t border-slate-200 dark:border-white/[0.08]"
          defaultValue={defaultValue}
        >
          {items.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`} className="border-b border-slate-200 dark:border-white/[0.08]">
              <AccordionTrigger className="text-slate-900 dark:text-white hover:text-slate-600 dark:hover:text-slate-300">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="leading-[1.6] text-slate-600 dark:text-slate-400">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 p-6">
          <div>
            <p className="text-[15px] text-slate-900 dark:text-white">Still have a question?</p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">We reply within four business hours</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={mailtoHref} className={contactButton}>
              <Mail className="size-4 text-slate-500" strokeWidth={1.5} />
              Email us
            </a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={contactButton}>
              <svg className="size-4 fill-slate-500" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              WhatsApp
              <ArrowRight className="size-3.5 text-slate-500" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
