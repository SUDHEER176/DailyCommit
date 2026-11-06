import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '../ui/questionnaire';

const QUESTIONNAIRE_ITEMS = [
  { name: 'level', required: true },
  { name: 'difficulty', required: true },
  { name: 'hours', required: true },
  { name: 'targetDays', required: true },
  { name: 'revision', required: true },
];

export default function PlannerWizardModal({
  isOpen,
  onClose,
  onPlanGenerated,
  currentConfig = null,
}) {
  const [item, setItem] = useState('level');
  const [loading, setLoading] = useState(false);

  // Default values
  const defaultValues = {
    level: currentConfig?.level || 'intermediate',
    difficulty: currentConfig?.difficultyPref || 'mixed_easy_medium',
    hours: String(currentConfig?.dailyHours || '2'),
    targetDays: String(currentConfig?.targetDays || '45'),
    revision: currentConfig?.includeRevision !== false ? 'yes' : 'no',
  };

  const [statuses, setStatuses] = useState({
    level: 'answered',
    difficulty: 'answered',
    hours: 'answered',
    targetDays: 'answered',
    revision: 'answered',
  });

  const unanswered = statuses[item] === 'unanswered';

  const setStatus = (name, status) => {
    // Only store a change; returning the same object stops the item effect from looping
    setStatuses((prev) => (prev[name] === status ? prev : { ...prev, [name]: status }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const levelVal = formData.get('level')?.toString() || defaultValues.level;
      const difficultyVal = formData.get('difficulty')?.toString() || defaultValues.difficulty;
      const hoursVal = parseFloat(formData.get('hours')?.toString() || defaultValues.hours) || 2;
      const targetDaysVal = parseInt(formData.get('targetDays')?.toString() || defaultValues.targetDays) || 45;
      const revisionVal = formData.get('revision')?.toString() !== 'no';

      const config = {
        level: levelVal,
        difficultyPref: difficultyVal,
        dailyHours: hoursVal,
        targetDays: targetDaysVal,
        includeRevision: revisionVal,
        startDate: new Date().toISOString().split('T')[0],
      };

      if (onPlanGenerated) {
        await onPlanGenerated(config);
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="planner-wizard-title"
        className="relative w-full max-w-lg rounded-2xl bg-ink-850 border border-white/[0.08] text-white p-6 animate-modalIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Icon Free & Minimal Black and White */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="planner-wizard-title" className="text-[17px] font-medium text-white">
              Build your NeetCode 150 plan
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Five questions, about a minute
            </p>
          </div>
          <button
            onClick={onClose}
            className="-mr-2 -mt-1 w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Minimized Compound Questionnaire */}
        <div className="pt-6">
          <Questionnaire
            item={item}
            items={QUESTIONNAIRE_ITEMS}
            onItemChange={(next) => setItem(next)}
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
            className="space-y-6"
          >
            <QuestionnaireProgress />

            {/* Question 1: DSA Level */}
            <QuestionnaireItem
              name="level"
              required
              onStatusChange={(status) => setStatus('level', status)}
            >
              <QuestionnaireTitle>
                What is your DSA level?
              </QuestionnaireTitle>
              <QuestionnaireDescription>
                Sets how long each problem is planned for
              </QuestionnaireDescription>
              <QuestionnaireChoices>
                <QuestionnaireChoice
                  value="beginner"
                  description="About 45 min a problem"
                >
                  Beginner, still learning the fundamentals
                </QuestionnaireChoice>
                <QuestionnaireChoice
                  value="intermediate"
                  description="About 30 min a problem"
                >
                  Intermediate, I know the basics and need practice
                </QuestionnaireChoice>
                <QuestionnaireChoice
                  value="advanced"
                  description="About 20 min a problem"
                >
                  Advanced, polishing for interviews
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            {/* Question 2: Difficulty Preference */}
            <QuestionnaireItem
              name="difficulty"
              required
              onStatusChange={(status) => setStatus('difficulty', status)}
            >
              <QuestionnaireTitle>
                Which difficulty mix suits you?
              </QuestionnaireTitle>
              <QuestionnaireDescription>
                How problems are ordered and ramped up
              </QuestionnaireDescription>
              <QuestionnaireChoices>
                <QuestionnaireChoice
                  value="easy_first"
                  description="Easy problems before medium ones"
                >
                  Easy first, then gradually harder
                </QuestionnaireChoice>
                <QuestionnaireChoice
                  value="mixed_easy_medium"
                  description="A steady mix through the core patterns"
                >
                  Mixed easy and medium
                </QuestionnaireChoice>
                <QuestionnaireChoice
                  value="all_tiers"
                  description="The standard NeetCode 150 topic order"
                >
                  Easy, Medium and Hard
                </QuestionnaireChoice>
                <QuestionnaireChoice
                  value="mostly_medium"
                  description="The level most interview loops ask at"
                >
                  Mostly medium
                </QuestionnaireChoice>
                <QuestionnaireChoice
                  value="hard_focus"
                  description="Medium and hard problems only"
                >
                  Hard interview problems
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            {/* Question 3: Daily Study Hours */}
            <QuestionnaireItem
              name="hours"
              required
              onStatusChange={(status) => setStatus('hours', status)}
            >
              <QuestionnaireTitle>
                How many hours a day can you study?
              </QuestionnaireTitle>
              <QuestionnaireDescription>
                Each day’s list is sized to fit
              </QuestionnaireDescription>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="1" description="1 to 2 problems a day">
                  1 hour
                </QuestionnaireChoice>
                <QuestionnaireChoice value="2" description="3 to 4 problems a day · recommended">
                  2 hours
                </QuestionnaireChoice>
                <QuestionnaireChoice value="3" description="4 to 6 problems a day">
                  3 hours
                </QuestionnaireChoice>
                <QuestionnaireChoice value="4" description="6 to 8 problems a day">
                  4 hours
                </QuestionnaireChoice>
                <QuestionnaireChoice value="5" description="8 or more problems a day">
                  5+ hours
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            {/* Question 4: Target Days */}
            <QuestionnaireItem
              name="targetDays"
              required
              onStatusChange={(status) => setStatus('targetDays', status)}
            >
              <QuestionnaireTitle>
                When do you want to finish?
              </QuestionnaireTitle>
              <QuestionnaireDescription>
                Time to cover all 150 problems
              </QuestionnaireDescription>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="30" description="About 5 problems a day">
                  30 days
                </QuestionnaireChoice>
                <QuestionnaireChoice value="45" description="About 3 problems a day · recommended">
                  45 days
                </QuestionnaireChoice>
                <QuestionnaireChoice value="60" description="About 2 to 3 problems a day">
                  60 days
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            {/* Question 5: Spaced Revision */}
            <QuestionnaireItem
              name="revision"
              required
              onStatusChange={(status) => setStatus('revision', status)}
            >
              <QuestionnaireTitle>
                Should the plan include revision days?
              </QuestionnaireTitle>
              <QuestionnaireDescription>
                Tricky problems come back on scheduled days
              </QuestionnaireDescription>
              <QuestionnaireChoices>
                <QuestionnaireChoice
                  value="yes"
                  description="Every 5th day reviews starred problems"
                >
                  Yes, include revision
                </QuestionnaireChoice>
                <QuestionnaireChoice
                  value="no"
                  description="Every day has new problems"
                >
                  No, only new questions
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            {/* Actions Bar - Icon Free */}
            <QuestionnaireActions>
              <QuestionnairePrevious>Back</QuestionnairePrevious>
              <QuestionnaireNext
                className="data-[status=unanswered]:opacity-50"
                disabled={unanswered}
                variant="primary"
              >
                Next
              </QuestionnaireNext>
              <QuestionnaireSubmit disabled={unanswered || loading}>
                {loading ? 'Building' : 'Build plan'}
              </QuestionnaireSubmit>
            </QuestionnaireActions>
          </Questionnaire>
        </div>
      </div>
    </div>
  );
}
