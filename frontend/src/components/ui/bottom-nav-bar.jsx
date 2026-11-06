"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  CheckSquare,
  Code2,
  Map,
  RotateCcw,
  BarChart3,
  Home,
  LineChart,
  CreditCard,
  MessageCircle,
  Trophy,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const defaultNavItems = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "features", label: "Features", icon: CheckSquare },
  { id: "today-plan", label: "Today's Plan", icon: CheckSquare },
  { id: "how-it-works", label: "How It Works", icon: Sparkles },
  { id: "integrations", label: "Integrations", icon: Code2 },
  { id: "faqs", label: "FAQs", icon: MessageCircle },
];

export const demoNavItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "portfolio", label: "Portfolio", icon: LineChart },
  { id: "transactions", label: "Transactions", icon: CreditCard },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "rewards", label: "Rewards", icon: Trophy },
  { id: "profile", label: "Profile", icon: User },
];

const MOBILE_LABEL_WIDTH = 84;

export function BottomNavBar({
  className,
  defaultIndex = 0,
  stickyBottom = false,
  items = defaultNavItems,
  activeIndex: controlledIndex,
  onTabChange,
  revisionCount = 0,
}) {
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

  const handleSelect = (idx, item) => {
    setInternalIndex(idx);
    if (onTabChange) {
      onTabChange(idx, item);
    }
  };

  return (
    <motion.nav
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label="Bottom Navigation"
      className={cn(
        "bg-white/95 dark:bg-black/95  border border-slate-200 dark:border-white/[0.08] rounded-lg flex items-center p-1.5 space-x-0.5 min-w-[320px] max-w-[95vw] h-[56px] ring-1 ring-slate-200 dark:ring-white/5",
        stickyBottom && "fixed inset-x-0 bottom-6 mx-auto z-50 w-fit",
        className,
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeIndex === idx;
        const showBadge = item.id === "revision" && revisionCount > 0;

        return (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "flex items-center gap-0 px-2.5 py-2 rounded-md transition-colors duration-150 relative h-10 min-w-[40px] min-h-[40px] max-h-[44px] flex-shrink-0",
              isActive
                ? "bg-brand-500/10 dark:bg-brand-500/25 text-slate-900 dark:text-white border border-brand-500/30 dark:border-brand-500/40 gap-2 font-medium"
                : "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5",
              "focus:outline-none focus-visible:ring-0",
            )}
            onClick={() => handleSelect(idx, item)}
            aria-label={item.label}
            type="button"
          >
            <div className="relative flex items-center justify-center">
              <Icon
                size={19}
                strokeWidth={2.2}
                aria-hidden
                className={cn(
                  "transition-colors duration-150",
                  isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-500 dark:text-slate-400"
                )}
              />
              {showBadge && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[11px] font-medium flex items-center justify-center">
                  {revisionCount}
                </span>
              )}
            </div>

            <motion.div
              initial={false}
              animate={{
                width: isActive ? `${MOBILE_LABEL_WIDTH}px` : "0px",
                opacity: isActive ? 1 : 0,
                marginLeft: isActive ? "6px" : "0px",
              }}
              transition={{
                width: { type: "spring", stiffness: 350, damping: 32 },
                opacity: { duration: 0.18 },
                marginLeft: { duration: 0.18 },
              }}
              className={cn("overflow-hidden flex items-center max-w-[90px]")}
            >
              <span
                className={cn(
                  "font-medium text-xs whitespace-nowrap select-none transition-opacity duration-150 overflow-hidden text-ellipsis leading-tight text-slate-900 dark:text-white",
                  isActive ? "opacity-100" : "opacity-0",
                )}
                title={item.label}
              >
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavBar;
