import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BentoGrid = ({ children, className = "", ...props }) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[20rem] sm:auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className = "",
  Icon,
  description,
  href = "#",
  cta = "Explore",
  onClick,
  badge,
  accentColor = "#0066FF",
  ...props
}) => (
  <div
    key={name}
    onClick={onClick}
    className={cn(
      "group relative col-span-1 md:col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl cursor-pointer",
      "bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/10 p-6 transition-all duration-300 shadow-sm dark:shadow-none",
      "hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-[#0c121e] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
      className
    )}
    {...props}
  >
    {/* Content */}
    <div className="relative z-10 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          {Icon && (
            <div className="flex items-center justify-center">
              {typeof Icon === 'function' ? <Icon className="w-8 h-8" /> : Icon}
            </div>
          )}
          {badge && (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-brand-600 dark:group-hover:text-white transition-colors">
          {name}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
          {description}
        </p>
      </div>

      {/* CTA Action */}
      <div className="pt-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff6611] group-hover:text-brand-600 dark:group-hover:text-white transition-colors">
          <span>{cta}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  </div>
);

export { BentoCard, BentoGrid };
