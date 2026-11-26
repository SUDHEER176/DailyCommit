import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SHEETS } from './sheets';
import SheetIcon from './SheetIcon';

/** The sheets of the chosen category, grouped by section; DailyCode 150 is live, the rest show an outline */
export default function SheetList({ activeCategory, searchQuery, progress, onOpenPlan, onShowOutline }) {
  // Filter sheets by active category
  const filteredSheets = SHEETS.filter(s => {
    const matchesCategory = s.category === activeCategory;
    const matchesSearch = searchQuery === '' || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group sheets by section
  const sections = Array.from(new Set(filteredSheets.map(s => s.section)));

  return (
    <div className="lg:col-span-2 space-y-8">
      {sections.map((sectionName) => {
        const sectionSheets = filteredSheets.filter(s => s.section === sectionName);
        if (sectionSheets.length === 0) return null;

        return (
          <div key={sectionName} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-medium text-white flex items-baseline gap-3">
                <span>{sectionName}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sectionSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`p-6 rounded-2xl bg-ink-850 border border-white/[0.08] hover:border-white/[0.14] transition-colors duration-150 flex flex-col justify-between gap-6 group relative ${sheet.live ? 'sm:col-span-2' : ''}`}
                >
                                          <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-ink-800 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                          <SheetIcon sheet={sheet} size={24} />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-medium text-white">
                            {sheet.title}
                          </h3>
                          <span className="text-xs text-slate-500">
                            {sheet.live ? sheet.tag : 'Coming soon'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[13px] text-slate-400 line-clamp-2 leading-[1.55]">
                      {sheet.description}
                    </p>
                    {sheet.live && progress && (
                      <div className="pt-2 space-y-2">
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden" role="presentation">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress.total ? Math.round((progress.solved / progress.total) * 100) : 0}%` }} />
                        </div>
                        <p className="font-mono text-xs tabular-nums text-slate-500">{progress.solved} of {progress.total} solved</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {sheet.live ? 'Free' : `${sheet.syllabus.length} parts planned`}
                    </span>
                    {sheet.live ? (
                      <button
                        onClick={onOpenPlan}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] btn-primary-glow font-medium active:scale-[0.98]"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    ) : (
                      <button
                        onClick={() => onShowOutline(sheet)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
                      >
                        <span>See outline</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
