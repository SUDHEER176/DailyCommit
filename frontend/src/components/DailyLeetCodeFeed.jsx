import React from "react";
import { cn } from "@/lib/utils";
import { AnimatedList } from "./ui/animated-list";
import { 
  Code2, 
  Clock, 
  Briefcase, 
  ArrowUpRight,
  Sparkles,
  ChevronRight
} from "lucide-react";

export const dailyLeetCodeQuestions = [
  {
    day: "Day 1",
    title: "1. Two Sum",
    difficulty: "Easy",
    topic: "Arrays & Hashing",
    company: "Google, Meta",
    time: "15m",
    color: "#22c55e",
    url: "https://leetcode.com/problems/two-sum/",
  },
  {
    day: "Day 2",
    title: "121. Best Time to Buy & Sell Stock",
    difficulty: "Easy",
    topic: "Sliding Window",
    company: "Amazon, Apple",
    time: "20m",
    color: "#22c55e",
    url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
  },
  {
    day: "Day 3",
    title: "3. Longest Substring Without Repeating",
    difficulty: "Medium",
    topic: "Sliding Window",
    company: "Microsoft, Meta",
    time: "30m",
    color: "#f59e0b",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
  },
  {
    day: "Day 4",
    title: "33. Search in Rotated Sorted Array",
    difficulty: "Medium",
    topic: "Binary Search",
    company: "Google, Uber",
    time: "35m",
    color: "#f59e0b",
    url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
  },
  {
    day: "Day 5",
    title: "206. Reverse Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    company: "Amazon, MSFT",
    time: "15m",
    color: "#22c55e",
    url: "https://leetcode.com/problems/reverse-linked-list/",
  },
  {
    day: "Day 6",
    title: "141. Linked List Cycle",
    difficulty: "Easy",
    topic: "Two Pointers",
    company: "Apple, Netflix",
    time: "20m",
    color: "#22c55e",
    url: "https://leetcode.com/problems/linked-list-cycle/",
  },
  {
    day: "Day 7",
    title: "42. Trapping Rain Water",
    difficulty: "Hard",
    topic: "Two Pointers & Stack",
    company: "Google, Meta",
    time: "45m",
    color: "#f43f5e",
    url: "https://leetcode.com/problems/trapping-rain-water/",
  },
  {
    day: "Day 8",
    title: "102. Binary Tree Level Order Traversal",
    difficulty: "Medium",
    topic: "Trees / BFS",
    company: "Amazon, Meta",
    time: "30m",
    color: "#f59e0b",
    url: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
  },
  {
    day: "Day 9",
    title: "200. Number of Islands",
    difficulty: "Medium",
    topic: "Graphs / DFS",
    company: "Google, Amazon",
    time: "35m",
    color: "#f59e0b",
    url: "https://leetcode.com/problems/number-of-islands/",
  },
  {
    day: "Day 10",
    title: "322. Coin Change",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    company: "Microsoft, Uber",
    time: "40m",
    color: "#f59e0b",
    url: "https://leetcode.com/problems/coin-change/",
  },
];

const LeetCodeCard = ({ 
  day, 
  title, 
  difficulty, 
  topic, 
  company, 
  time, 
  url,
  onOpenProblemModal 
}) => {
  return (
    <div
      onClick={() => onOpenProblemModal && onOpenProblemModal()}
      className="group relative w-full cursor-pointer rounded-xl bg-[#0b0f17] border border-white/10 hover:border-white/25 hover:bg-[#121824] p-3.5 transition-all duration-150 shadow-md font-sans"
    >
      <div className="flex items-start justify-between gap-3">
        
        {/* Left Side: Day Badge & Content */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Day Badge */}
          <span className="shrink-0 px-2 py-1 rounded-md bg-white/[0.06] border border-white/10 font-mono text-[11px] font-bold text-[#ff6611]">
            {day}
          </span>

          {/* Title & Metadata */}
          <div className="flex flex-col min-w-0 space-y-1.5 flex-1">
            <h4 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors leading-snug">
              {title}
            </h4>

            {/* Tags row */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
              <span className="font-medium text-slate-300">
                {topic}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-400 truncate max-w-[140px]">
                <Briefcase className="w-3 h-3 text-slate-500 shrink-0" />
                {company}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                {time}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Difficulty Pill & External Link */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <span
            className={cn(
              "text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border",
              difficulty === "Easy" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
              difficulty === "Medium" && "bg-amber-500/10 text-amber-400 border-amber-500/25",
              difficulty === "Hard" && "bg-rose-500/10 text-rose-400 border-rose-500/25"
            )}
          >
            {difficulty}
          </span>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            title="Open on LeetCode"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};

export default function DailyLeetCodeFeed({
  className = "",
  onOpenProblemModal
}) {
  return (
    <div className={cn("relative flex h-[540px] w-full flex-col overflow-hidden font-sans", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0066FF]/15 border border-[#0066FF]/30 flex items-center justify-center text-[#38bdf8]">
            <Code2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Daily LeetCode Track</h3>
            <p className="text-[11px] text-slate-400">Curated day-by-day interview curriculum</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0066FF]/10 text-[#38bdf8] border border-[#0066FF]/25">
          Live
        </span>
      </div>

      {/* Animated Stream Container */}
      <div className="relative flex-1 overflow-hidden pt-1">
        <AnimatedList delay={1600}>
          {dailyLeetCodeQuestions.map((item, idx) => (
            <LeetCodeCard 
              key={idx} 
              {...item} 
              onOpenProblemModal={onOpenProblemModal}
            />
          ))}
        </AnimatedList>

      </div>
    </div>
  );
}
