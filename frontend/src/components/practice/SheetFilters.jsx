import React from 'react';
import { Search } from 'lucide-react';

/** The DSA / Core CS / System Design tabs and the sheet search */
export default function SheetFilters({ activeCategory, setActiveCategory, searchQuery, setSearchQuery }) {
  return (
    <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Domain Category Selector Pills */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-ink-850 border border-white/[0.08] scrollbar-none w-fit max-w-full">
        {['DSA', 'Core CS', 'System Design'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`h-8 px-3 rounded-lg text-[13px] whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-slate-100 text-ink-900'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Quick Search */}
      <div className="relative w-full sm:w-64">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-[10px] bg-ink-850 border border-white/[0.08] text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>
    </div>
  );
}
