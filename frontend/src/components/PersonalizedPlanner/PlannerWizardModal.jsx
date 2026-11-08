import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { generateScheduleClient } from '../../utils/schedulerEngine';
import questionList from '../../data/neetcode150.json';
import Spinner from '../ui/Spinner';

// Minutes per problem by level. Mirrors timeEstimates in utils/schedulerEngine.js
const MINUTES = {
  beginner: { Easy: 25, Medium: 45, Hard: 70 },
  intermediate: { Easy: 18, Medium: 32, Hard: 50 },
  advanced: { Easy: 12, Medium: 22, Hard: 35 },
};

const STEPS = [
  {
    key: 'level',
    nav: 'Level',
    title: 'Where are you with DSA?',
    hint: 'Sets how long each problem is planned for',
    options: [
      { value: 'beginner', label: 'Beginner', detail: 'Still learning the fundamentals' },
      { value: 'intermediate', label: 'Intermediate', detail: 'Know the basics, need practice' },
      { value: 'advanced', label: 'Advanced', detail: 'Polishing for interviews' },
    ],
  },
  {
    key: 'difficulty',
    nav: 'Mix',
    title: 'How should difficulty ramp up?',
    hint: 'Decides the order problems come in',
    options: [
      { value: 'easy_first', label: 'Easy first', detail: 'All easy problems, then medium, then hard' },
      { value: 'mixed_easy_medium', label: 'Steady mix', detail: 'Topic by topic, easy and medium side by side' },
      { value: 'all_tiers', label: 'Topic order', detail: 'The standard DailyCode 150 order' },
      { value: 'mostly_medium', label: 'Medium first', detail: 'The level most interview loops ask at' },
      { value: 'hard_focus', label: 'Hard first', detail: 'Hard problems lead, easy ones last' },
    ],
  },
  {
    key: 'hours',
    nav: 'Hours',
    title: 'How much time do you have each day?',
    hint: 'Each day’s list is sized to fit',
    options: [
      { value: 1, label: '1 h' },
      { value: 2, label: '2 h' },
      { value: 3, label: '3 h' },
      { value: 4, label: '4 h' },
      { value: 5, label: '5 h' },
    ],
  },
  {
    key: 'targetDays',
    nav: 'Finish',
    title: 'When do you want to finish?',
    hint: 'Time to cover every problem you haven’t solved yet',
    options: [
      { value: 30, label: '30 days' },
      { value: 45, label: '45 days' },
      { value: 60, label: '60 days' },
    ],
  },
  {
    key: 'revision',
    nav: 'Revision',
    title: 'Add lighter revision days?',
    hint: 'Every 5th day carries less new work, so starred problems get a second pass',
    options: [
      { value: true, label: 'Yes, every 5th day', detail: 'About 30% less new work on those days' },
      { value: false, label: 'No, new problems every day', detail: 'Finishes the same day with a more even load' },
    ],
  },
];

const today = () => new Date().toISOString().split('T')[0];
const fmt = (iso, opts = { month: 'short', day: 'numeric' }) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', opts);
const hours = (h) => (h < 10 ? h.toFixed(1).replace(/\.0$/, '') : Math.round(h));

// Hours a full day needs for this pace. Mirrors the weighting in utils/schedulerEngine.js
function neededHoursFor({ level, targetDays, revision }, solvedIds) {
  const left = questionList.filter((q) => !solvedIds.has(q.id));
  if (!left.length) return 0;
  const minutes = left.reduce((a, q) => a + (MINUTES[level]?.[q.difficulty] || 30), 0);
  const days = Math.max(1, Math.min(targetDays, left.length));
  let weight = 0;
  for (let n = 1; n <= days; n++) weight += revision && n % 5 === 0 ? 0.7 : 1;
  return minutes / weight / 60;
}

const DIFF_DOT = { Easy: 'bg-emerald-500', Medium: 'bg-amber-500', Hard: 'bg-rose-500' };

function Choice({ selected, onSelect, label, detail, aside }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-[10px] border text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
        selected
          ? 'bg-ink-800 border-white/[0.14]'
          : 'border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.1]'
      }`}
    >
      <span
        className={`grid place-items-center w-4 h-4 shrink-0 rounded-full border transition-colors ${
          selected ? 'border-brand-500 bg-brand-500' : 'border-white/[0.2]'
        }`}
        aria-hidden
      >
        {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-white">{label}</span>
        {detail && <span className="block text-xs text-slate-500">{detail}</span>}
      </span>
      {aside && <span className="shrink-0 font-mono text-xs tabular-nums text-slate-500">{aside}</span>}
    </button>
  );
}

function Tile({ selected, onSelect, label, sub, warn }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex flex-col items-start justify-center gap-1 h-16 px-3 rounded-[10px] border text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
        selected
          ? 'bg-ink-800 border-brand-500'
          : 'border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.1]'
      }`}
    >
      <span className="font-mono text-[15px] tabular-nums text-white">{label}</span>
      <span className={`text-xs tabular-nums ${warn ? 'text-amber-400' : 'text-slate-500'}`}>{sub}</span>
    </button>
  );
}

export default function PlannerWizardModal({
  isOpen,
  onClose,
  onPlanGenerated,
  currentConfig = null,
  solvedIds = [],
}) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const answersFrom = (c) => ({
    level: c?.level || 'intermediate',
    difficulty: c?.difficultyPref || 'mixed_easy_medium',
    hours: Number(c?.dailyHours) || 2,
    targetDays: Number(c?.targetDays) || 45,
    revision: c?.includeRevision !== false,
  });
  const [answers, setAnswers] = useState(() => answersFrom(currentConfig));

  const solvedKey = solvedIds.join(',');
  const solved = useMemo(() => new Set(solvedIds), [solvedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Each time it opens: start at the first question, from the current plan's answers
  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setAnswers(answersFrom(currentConfig));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // Lock the page behind the wizard so the wheel scrolls the wizard, not the page
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  // The live preview runs the same scheduler the plan is built with
  const preview = useMemo(() => {
    const plan = generateScheduleClient({
      questions: questionList,
      level: answers.level,
      difficultyPref: answers.difficulty,
      dailyHours: answers.hours,
      targetDays: answers.targetDays,
      includeRevision: answers.revision,
      startDate: today(),
      existingCompletedIds: [...solved],
    });
    const needed = neededHoursFor(answers, solved);
    const newWorkDays = plan.days.filter((d) => d.totalEstimatedMinutes > 0);
    const maxMinutes = Math.max(1, ...plan.days.map((d) => d.totalEstimatedMinutes));
    const fullDays = plan.days.filter((d) => !d.isRevisionDay);
    const avgMinutes = fullDays.length
      ? Math.round(fullDays.reduce((a, d) => a + d.totalEstimatedMinutes, 0) / fullDays.length)
      : 0;
    return {
      plan,
      needed,
      fits: needed <= answers.hours * 1.15,
      perDay: newWorkDays.length ? plan.remainingCount / newWorkDays.length : 0,
      avgMinutes,
      maxMinutes,
      revisionDays: plan.days.filter((d) => d.isRevisionDay).length,
      firstDay: plan.days.find((d) => d.questions.some((q) => !q.completed)),
    };
  }, [answers, solved]);

  if (!isOpen) return null;

  const set = (key, value) => setAnswers((a) => ({ ...a, [key]: value }));
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const { plan } = preview;
  const finish = plan.estimatedCompletionDate;
  // Monday-first calendar: pad the first week so columns line up with weekdays
  const lead = (new Date(`${today()}T00:00:00`).getDay() + 6) % 7;

  const build = async () => {
    setLoading(true);
    try {
      await onPlanGenerated?.({
        level: answers.level,
        difficultyPref: answers.difficulty,
        dailyHours: answers.hours,
        targetDays: answers.targetDays,
        includeRevision: answers.revision,
        startDate: today(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderOptions = () => {
    if (current.key === 'hours') {
      return (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" role="radiogroup" aria-label={current.title}>
          {current.options.map((o) => {
            const short = preview.needed > o.value * 1.15;
            return (
              <Tile
                key={o.value}
                selected={answers.hours === o.value}
                onSelect={() => set('hours', o.value)}
                label={o.label}
                sub={short ? `${hours(preview.needed - o.value)} h short` : 'Fits'}
                warn={short}
              />
            );
          })}
        </div>
      );
    }
    if (current.key === 'targetDays') {
      return (
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={current.title}>
          {current.options.map((o) => {
            const need = neededHoursFor({ ...answers, targetDays: o.value }, solved);
            return (
              <Tile
                key={o.value}
                selected={answers.targetDays === o.value}
                onSelect={() => set('targetDays', o.value)}
                label={o.label}
                sub={`${hours(need)} h a day`}
                warn={need > answers.hours * 1.15}
              />
            );
          })}
        </div>
      );
    }
    return (
      <div className="space-y-2" role="radiogroup" aria-label={current.title}>
        {current.options.map((o) => {
          const m = current.key === 'level' ? MINUTES[o.value] : null;
          return (
            <Choice
              key={String(o.value)}
              selected={answers[current.key] === o.value}
              onSelect={() => set(current.key, o.value)}
              label={o.label}
              detail={o.detail}
              aside={m ? `${m.Easy} · ${m.Medium} · ${m.Hard} min` : null}
            />
          );
        })}
        {current.key === 'level' && (
          <p className="pt-1 text-xs text-slate-500">Minutes for an easy, medium and hard problem</p>
        )}
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div className="min-h-full flex items-end sm:items-center justify-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="planner-wizard-title"
        className="relative w-full max-w-[840px] rounded-t-2xl sm:rounded-2xl bg-ink-850 border border-white/[0.08] text-white animate-modalIn md:grid md:grid-cols-[minmax(0,1fr)_320px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Questions */}
        <div className="flex flex-col px-5 pt-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="planner-wizard-title" className="text-[17px] font-medium text-white">
                Build your DailyCode 150 plan
              </h2>
              <p className="mt-1 text-xs text-slate-500">Change any answer, the plan updates as you go</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-1 w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors md:hidden"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Phones: the plan in one line, the full preview lives in the side panel */}
          <div className="md:hidden mt-4 px-3 py-2 rounded-[10px] bg-ink-900 border border-white/[0.06] text-[13px]" aria-live="polite">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-white tabular-nums">Finish {fmt(finish)}</span>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                {preview.perDay.toFixed(1)} a day · {preview.avgMinutes} min
              </span>
            </div>
            <div className={`mt-1 flex items-center gap-1.5 text-xs ${preview.fits ? 'text-slate-500' : 'text-amber-300'}`}>
              {preview.fits ? <Check className="w-3.5 h-3.5 text-brand-400" strokeWidth={1.5} aria-hidden /> : <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden />}
              {preview.fits ? `Fits in ${answers.hours} h a day` : `Needs about ${hours(preview.needed)} h a day`}
            </div>
          </div>

          {/* Step rail: every question has an answer, so any step can be opened */}
          <nav className="mt-4 -mx-1 flex gap-1 overflow-x-auto border-b border-white/[0.06] scrollbar-none" aria-label="Questions">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? 'step' : undefined}
                className={`relative shrink-0 h-9 px-2 text-[13px] transition-colors ${
                  i === step
                    ? 'text-white after:absolute after:inset-x-2 after:-bottom-px after:h-px after:bg-white'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                <span className="font-mono text-[11px] tabular-nums text-slate-500 mr-1">{i + 1}</span>
                {s.nav}
              </button>
            ))}
          </nav>

          <div key={current.key} className="mt-5 flex-1 animate-fadeIn">
            <h3 className="text-[17px] leading-6 font-medium text-white">{current.title}</h3>
            <p className="mt-1 text-[13px] text-slate-400">{current.hint}</p>
            <div className="mt-4">{renderOptions()}</div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-5 md:mx-0 mt-5 px-5 md:px-0 py-4 md:pb-0 flex items-center justify-between gap-3 bg-ink-850 border-t border-white/[0.06] md:border-t-0 md:static">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-2 h-10 px-3 -ml-3 rounded-[10px] text-sm text-slate-400 hover:text-white disabled:opacity-0 transition-[color,opacity]"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Back
            </button>
            <div className="flex items-center gap-2">
              {!isLast && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm text-white bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] transition-colors active:scale-[0.98]"
                >
                  Next
                  <ArrowRight className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                </button>
              )}
              <button
                type="button"
                onClick={build}
                disabled={loading}
                className="btn-primary-glow inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium disabled:opacity-60 active:scale-[0.98]"
              >
                {loading && <Spinner size={16} label="Building plan" />}
                {loading ? 'Building' : 'Build plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <aside
          className="relative hidden md:block p-6 bg-ink-900 border-l border-white/[0.06] rounded-r-2xl"
          aria-live="polite"
          aria-label="Plan preview"
        >
          <button
            type="button"
            onClick={onClose}
            className="hidden md:grid absolute top-4 right-4 w-8 h-8 place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <span className="eyebrow">Your plan</span>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-[24px] leading-none font-medium tracking-[-0.02em] text-white tabular-nums">
              {fmt(finish)}
            </span>
            <span className="font-mono text-xs tabular-nums text-slate-500">
              {plan.days.length} days from today
            </span>
          </div>

          <div
            className={`mt-3 flex items-start gap-2 text-[13px] ${preview.fits ? 'text-slate-300' : 'text-amber-300'}`}
          >
            {preview.fits ? (
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-brand-400" strokeWidth={1.5} aria-hidden />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} aria-hidden />
            )}
            <span>
              {plan.remainingCount === 0
                ? 'Every problem is already solved'
                : preview.fits
                  ? `Fits in your ${answers.hours} h a day, about ${hours(preview.needed)} h needed`
                  : `Needs about ${hours(preview.needed)} h a day, more than your ${answers.hours} h. Pick a later finish or more hours`}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-3 border-y border-white/[0.06] divide-x divide-white/[0.06]">
            {[
              [preview.perDay.toFixed(1), 'problems a day'],
              [preview.avgMinutes, 'min a day'],
              [preview.revisionDays, 'revision days'],
            ].map(([v, l], i) => (
              <div key={l} className={`py-3 ${i === 0 ? 'pr-3' : 'px-3'}`}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-mono text-[15px] tabular-nums text-white">{v}</dd>
                <dd className="mt-1 text-xs text-slate-500">{l}</dd>
              </div>
            ))}
          </dl>

          {/* Each plan day as a heatmap cell, darker means more minutes */}
          <div className="mt-4">
            <div className="grid grid-cols-7 gap-1 w-fit" aria-hidden>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className="w-5 text-center font-mono text-[11px] text-slate-500">{d}</span>
              ))}
              {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} className="w-5 h-5" />)}
              {plan.days.map((d) => {
                const load = d.totalEstimatedMinutes / preview.maxMinutes;
                const level = load === 0 ? 0 : load > 0.85 ? 4 : load > 0.6 ? 3 : load > 0.35 ? 2 : 1;
                return (
                  <span
                    key={d.dayNumber}
                    data-level={level}
                    title={`Day ${d.dayNumber} · ${fmt(d.date)} · ${d.totalEstimatedMinutes} min${d.isRevisionDay ? ' · revision' : ''}`}
                    className={`cell !w-5 !h-5 !rounded-[4px] grid place-items-center ${
                      d.dayNumber === 1 ? 'ring-1 ring-white ring-offset-2 ring-offset-ink-900' : ''
                    }`}
                  >
                    {d.isRevisionDay && <span className="w-1.5 h-1.5 rounded-full bg-white/90" />}
                  </span>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>Darker days hold more minutes</span>
              <span className="flex items-center gap-1.5">
                <span className="cell grid place-items-center" data-level="2" aria-hidden>
                  <span className="w-1 h-1 rounded-full bg-white/90" />
                </span>
                Revision day
              </span>
            </div>
          </div>

          {preview.firstDay && (
            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-white">Day {preview.firstDay.dayNumber}</span>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {preview.firstDay.totalEstimatedMinutes} min
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {preview.firstDay.questions
                  .filter((q) => !q.completed)
                  .slice(0, 3)
                  .map((q) => (
                    <li key={q.id} className="flex items-center gap-2 h-6 text-[13px] text-slate-300">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DIFF_DOT[q.difficulty]}`} aria-hidden />
                      <span className="truncate flex-1">{q.title}</span>
                      <span className="font-mono text-xs tabular-nums text-slate-500">{q.estimatedMinutes}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
      </div>
    </div>,
    document.body,
  );
}
