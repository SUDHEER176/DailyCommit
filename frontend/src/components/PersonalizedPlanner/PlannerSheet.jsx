import React from 'react';
import { Check, ChevronDown, Code2, ExternalLink, FileText, PlayCircle, Search, Star } from 'lucide-react';
import TopicRoadmap from './TopicRoadmap';
import SolvedCheckbox from './SolvedCheckbox';
import { difficultyText, iconButton, linkButton, notesField, topicAnchor } from './plannerUtils';

/**
 * Sheet tab: the topic roadmap, filters, and every problem in a collapsible table per topic.
 * Filter and open-topic state lives in the parent so it survives switching tabs.
 */
export default function PlannerSheet({
  byTopic,
  solvedCount,
  totalCount,
  filters,      // { query, setQuery, difficulty, setDifficulty, hideSolved, setHideSolved }
  openTopics,
  setOpenTopics,
  notesOpenId,
  setNotesOpenId,
  actions,      // { toggleComplete, toggleDifficult, saveNotes, openEditor }
}) {
  const { query: rawQuery, setQuery, difficulty, setDifficulty, hideSolved, setHideSolved } = filters;

  const query = rawQuery.trim().toLowerCase();
  const matches = (q) =>
    (difficulty === 'All' || q.difficulty === difficulty) &&
    (!hideSolved || !q.completed) &&
    (!query || q.title.toLowerCase().includes(query) || String(q.number).includes(query));
  const filtering = query !== '' || difficulty !== 'All' || hideSolved;

  const toggleTopic = (topic) =>
    setOpenTopics((prev) => {
      const next = new Set(prev);
      next.has(topic) ? next.delete(topic) : next.add(topic);
      return next;
    });

  const jumpToTopic = (topic) => {
    setQuery('');
    setDifficulty('All');
    setHideSolved(false);
    setOpenTopics(new Set([topic]));
    setTimeout(() => document.getElementById(topicAnchor(topic))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <div className="space-y-4">
      <TopicRoadmap
        solved={solvedCount}
        total={totalCount}
        progress={Object.fromEntries(byTopic.map(({ topic, items }) => [topic, { done: items.filter((q) => q.completed).length, total: items.length }]))}
        onSelect={jumpToTopic}
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={1.5} />
          <input
            type="search"
            value={rawQuery}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search problems"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-ink-850 border border-white/[0.08] text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex items-center h-9 p-0.5 rounded-lg border border-white/[0.08] w-fit" role="group" aria-label="Difficulty">
          {['All', 'Easy', 'Medium', 'Hard'].map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              aria-pressed={difficulty === level}
              className={`h-full px-3 rounded-md text-xs transition-colors ${
                difficulty === level ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 h-9 px-1 text-[13px] text-slate-400 cursor-pointer select-none">
          <input type="checkbox" checked={hideSolved} onChange={(e) => setHideSolved(e.target.checked)} className="peer sr-only" />
          <span className="grid place-items-center w-4 h-4 rounded-[4px] border border-white/[0.14] peer-checked:bg-brand-500 peer-checked:border-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 text-white">
            {hideSolved && <Check className="w-3 h-3" strokeWidth={2.5} />}
          </span>
          Hide solved
        </label>

        <div className="md:ml-auto flex items-center gap-1">
          <button onClick={() => setOpenTopics(new Set(byTopic.map((t) => t.topic)))} className="h-9 px-3 rounded-lg text-[13px] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            Expand all
          </button>
          <button onClick={() => setOpenTopics(new Set())} className="h-9 px-3 rounded-lg text-[13px] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            Collapse all
          </button>
        </div>
      </div>

      {/* Topics */}
      <div className="rounded-2xl bg-ink-850 border border-white/[0.08] overflow-hidden divide-y divide-white/[0.08]">
        {byTopic.map(({ topic, items }, i) => {
          const done = items.filter((q) => q.completed).length;
          const visible = items.filter(matches);
          if (filtering && visible.length === 0) return null;
          const open = filtering || openTopics.has(topic);
          const complete = done === items.length;
          return (
            <section key={topic} id={topicAnchor(topic)} className="scroll-mt-6">
              <h3>
                <button
                  onClick={() => toggleTopic(topic)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-4 h-14 px-6 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="w-6 font-mono text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 flex items-center gap-2 min-w-0 text-[15px] text-white">
                    <span className="truncate">{topic}</span>
                    {complete && <span className="cell" data-level="4" aria-label="All solved" />}
                  </span>
                  <span className="hidden sm:block w-32 h-1 rounded-full bg-white/[0.06] overflow-hidden" aria-hidden>
                    <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(done / items.length) * 100}%` }} />
                  </span>
                  <span className="w-14 text-right font-mono text-xs tabular-nums text-slate-400">{done} / {items.length}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </button>
              </h3>

              {open && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead>
                      <tr className="text-xs text-slate-500">
                        <th scope="col" className="pl-6 pr-2 h-9 font-normal w-12">Done</th>
                        <th scope="col" className="px-2 h-9 font-normal">Problem</th>
                        <th scope="col" className="px-2 h-9 font-normal w-[128px]">Practice</th>
                        <th scope="col" className="px-2 h-9 font-normal w-24">Difficulty</th>
                        <th scope="col" className="px-2 h-9 font-normal w-20">Revision</th>
                        <th scope="col" className="pl-2 pr-6 h-9 font-normal w-20">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filtering ? visible : items).map((q) => (
                        <SheetRow
                          key={q.id}
                          question={q}
                          notesOpen={notesOpenId === q.id}
                          onToggleNotes={() => setNotesOpenId(notesOpenId === q.id ? null : q.id)}
                          actions={actions}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
        {filtering && byTopic.every(({ items }) => items.filter(matches).length === 0) && (
          <p className="px-6 py-12 text-center text-[13px] text-slate-500">No problems match these filters</p>
        )}
      </div>
    </div>
  );
}

/** One problem in a topic table, plus its notes field when open */
function SheetRow({ question: q, notesOpen, onToggleNotes, actions }) {
  return (
    <>
      <tr className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors">
        <td className="pl-6 pr-2 py-2 w-12 align-middle">
          <SolvedCheckbox question={q} onToggle={actions.toggleComplete} className="block" />
        </td>
        <td className="px-2 py-2 align-middle">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="w-8 flex-shrink-0 font-mono text-xs tabular-nums text-slate-500">{q.number}</span>
            <span className={`text-sm truncate ${q.completed ? 'text-slate-500 line-through decoration-slate-600' : 'text-white'}`}>
              {q.title}
            </span>
          </div>
          {q.notes && !notesOpen && (
            <p className="mt-0.5 pl-11 text-xs text-slate-500 truncate">Note · {q.notes}</p>
          )}
        </td>
        <td className="px-2 py-2 w-[128px] align-middle">
          <div className="flex items-center gap-0.5">
            <button onClick={() => actions.openEditor(q)} className={linkButton} title="Solve in the editor" aria-label={`Solve ${q.title} in the editor`}>
              <Code2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
            {q.url && (
              <a href={q.url} target="_blank" rel="noopener noreferrer" className={linkButton} title="Open on LeetCode" aria-label={`Open ${q.title} on LeetCode`}>
                <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
              </a>
            )}
            {q.video && (
              <a href={q.video} target="_blank" rel="noopener noreferrer" className={linkButton} title="Video explanation" aria-label={`Video explanation for ${q.title}`}>
                <PlayCircle className="w-4 h-4" strokeWidth={1.5} />
              </a>
            )}
          </div>
        </td>
        <td className={`px-2 py-2 w-24 align-middle text-[13px] ${difficultyText[q.difficulty] || 'text-slate-400'}`}>{q.difficulty}</td>
        <td className="px-2 py-2 w-20 align-middle">
          <button
            onClick={() => actions.toggleDifficult(q)}
            className={iconButton(q.isDifficult)}
            aria-pressed={!!q.isDifficult}
            aria-label={q.isDifficult ? `Remove ${q.title} from revision` : `Star ${q.title} for revision`}
            title={q.isDifficult ? 'Starred for revision' : 'Star for revision'}
          >
            <Star className={`w-4 h-4 ${q.isDifficult ? 'fill-current' : ''}`} strokeWidth={1.5} />
          </button>
        </td>
        <td className="pl-2 pr-6 py-2 w-20 align-middle">
          <button
            onClick={onToggleNotes}
            className={iconButton(q.notes || notesOpen)}
            aria-expanded={notesOpen}
            aria-label={`Notes for ${q.title}`}
            title="Notes on mistakes and approach"
          >
            <FileText className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </td>
      </tr>
      {notesOpen && (
        <tr>
          <td colSpan={6} className="px-6 pb-4">
            <textarea
              rows={2}
              defaultValue={q.notes || ''}
              onBlur={(e) => actions.saveNotes(q, e.target.value)}
              aria-label={`Notes for ${q.title}`}
              placeholder="What tripped you up, and what worked"
              className={`ml-[72px] w-[calc(100%-72px)] ${notesField}`}
            />
          </td>
        </tr>
      )}
    </>
  );
}
