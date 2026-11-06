"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuestionnaireItemStatus = "unanswered" | "answered" | "error";

interface QuestionnaireItemConfig {
  name: string;
  required?: boolean;
}

interface QuestionnaireContextValue {
  item: string;
  items: readonly QuestionnaireItemConfig[] | QuestionnaireItemConfig[];
  currentIndex: number;
  totalItems: number;
  isFirst: number;
  isLast: boolean;
  values: Record<string, any>;
  statuses: Record<string, QuestionnaireItemStatus>;
  errors: Record<string, string>;
  setValue: (name: string, value: any) => void;
  setStatus: (name: string, status: QuestionnaireItemStatus) => void;
  setError: (name: string, error: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  onItemChange?: (nextItem: string) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

const QuestionnaireContext = React.createContext<QuestionnaireContextValue | null>(null);

export function useQuestionnaire() {
  const context = React.useContext(QuestionnaireContext);
  if (!context) {
    throw new Error("useQuestionnaire must be used within a Questionnaire");
  }
  return context;
}

interface QuestionnaireItemContextValue {
  name: string;
  required?: boolean;
  value?: any;
  status?: QuestionnaireItemStatus;
}

const QuestionnaireItemContext = React.createContext<QuestionnaireItemContextValue | null>(null);

export function useQuestionnaireItem() {
  const context = React.useContext(QuestionnaireItemContext);
  if (!context) {
    throw new Error("useQuestionnaireItem must be used within a QuestionnaireItem");
  }
  return context;
}

// ── 1. Main Questionnaire Container ──
export interface QuestionnaireProps extends React.HTMLAttributes<HTMLFormElement> {
  item?: string;
  items: readonly QuestionnaireItemConfig[] | QuestionnaireItemConfig[];
  onItemChange?: (nextItem: string) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  defaultValues?: Record<string, any>;
  children: React.ReactNode;
}

export function Questionnaire({
  className,
  item: controlledItem,
  items,
  onItemChange,
  onSubmit,
  defaultValues = {},
  children,
  ...props
}: QuestionnaireProps) {
  const [internalItem, setInternalItem] = React.useState<string>(items[0]?.name || "");
  const currentItemName = controlledItem !== undefined ? controlledItem : internalItem;

  const [values, setValues] = React.useState<Record<string, any>>(defaultValues);
  const [statuses, setStatuses] = React.useState<Record<string, QuestionnaireItemStatus>>(() => {
    const initial: Record<string, QuestionnaireItemStatus> = {};
    items.forEach((it) => {
      initial[it.name] = defaultValues[it.name] !== undefined ? "answered" : "unanswered";
    });
    return initial;
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const currentIndex = items.findIndex((it) => it.name === currentItemName);
  const totalItems = items.length;
  const isFirst = currentIndex <= 0 ? 1 : 0;
  const isLast = currentIndex >= totalItems - 1;

  const setItem = React.useCallback(
    (nextItem: string) => {
      setInternalItem(nextItem);
      if (onItemChange) {
        onItemChange(nextItem);
      }
    },
    [onItemChange]
  );

  const setValue = React.useCallback((name: string, val: any) => {
    setValues((prev) => ({ ...prev, [name]: val }));
    setStatuses((prev) => ({ ...prev, [name]: val !== undefined && val !== "" ? "answered" : "unanswered" }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const setStatus = React.useCallback((name: string, status: QuestionnaireItemStatus) => {
    setStatuses((prev) => ({ ...prev, [name]: status }));
  }, []);

  const setError = React.useCallback((name: string, err: string) => {
    setErrors((prev) => ({ ...prev, [name]: err }));
    setStatuses((prev) => ({ ...prev, [name]: "error" }));
  }, []);

  const goNext = React.useCallback(() => {
    if (currentIndex < totalItems - 1) {
      const nextName = items[currentIndex + 1].name;
      setItem(nextName);
    }
  }, [currentIndex, totalItems, items, setItem]);

  const goPrevious = React.useCallback(() => {
    if (currentIndex > 0) {
      const prevName = items[currentIndex - 1].name;
      setItem(prevName);
    }
  }, [currentIndex, items, setItem]);

  return (
    <QuestionnaireContext.Provider
      value={{
        item: currentItemName,
        items,
        currentIndex: Math.max(0, currentIndex),
        totalItems,
        isFirst,
        isLast,
        values,
        statuses,
        errors,
        setValue,
        setStatus,
        setError,
        goNext,
        goPrevious,
        onItemChange: setItem,
        onSubmit,
      }}
    >
      <form
        onSubmit={onSubmit}
        className={cn("w-full space-y-6 text-slate-100", className)}
        {...props}
      >
        {Object.entries(values).map(([key, val]) => (
          <input key={key} type="hidden" name={key} value={val ?? ""} />
        ))}
        {children}
      </form>
    </QuestionnaireContext.Provider>
  );
}

// ── 2. Progress Indicator ──
export function QuestionnaireProgress({ className }: { className?: string }) {
  const { currentIndex, totalItems } = useQuestionnaire();

  return (
    <div className={cn("flex items-center justify-between", className)} aria-label={`Question ${currentIndex + 1} of ${totalItems}`}>
      <span className="font-mono text-xs tabular-nums text-slate-500">{currentIndex + 1} of {totalItems}</span>
      <div className="flex items-center gap-1" aria-hidden>
        {Array.from({ length: totalItems }).map((_, i) => (
          <span key={i} className="cell" data-level={i < currentIndex ? 3 : i === currentIndex ? 4 : 0} />
        ))}
      </div>
    </div>
  );
}

// ── 3. Individual Question Item ──
export interface QuestionnaireItemProps {
  name: string;
  required?: boolean;
  onStatusChange?: (status: QuestionnaireItemStatus) => void;
  className?: string;
  children: React.ReactNode;
}

export function QuestionnaireItem({
  name,
  required = false,
  onStatusChange,
  className,
  children,
}: QuestionnaireItemProps) {
  const { item, values, statuses, setStatus } = useQuestionnaire();
  const isActive = item === name;

  const currentStatus = statuses[name] || "unanswered";

  React.useEffect(() => {
    if (onStatusChange) {
      onStatusChange(currentStatus);
    }
  }, [currentStatus, onStatusChange]);

  if (!isActive) return null;

  return (
    <QuestionnaireItemContext.Provider
      value={{
        name,
        required,
        value: values[name],
        status: currentStatus,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={cn("space-y-3", className)}
      >
        {children}
      </motion.div>
    </QuestionnaireItemContext.Provider>
  );
}

// ── 4. Title and Description ──
export function QuestionnaireTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[17px] font-medium text-white", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function QuestionnaireDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-[13px] text-slate-400 leading-[1.55]", className)}
      {...props}
    >
      {children}
    </p>
  );
}

// ── 5. Choices Container ──
export function QuestionnaireChoices({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2 pt-2", className)} {...props}>
      {children}
    </div>
  );
}

// ── 6. Individual Choice Option ──
export interface QuestionnaireChoiceProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: any;
  description?: string;
}

export function QuestionnaireChoice({
  value,
  description,
  className,
  children,
  onClick,
  ...props
}: QuestionnaireChoiceProps) {
  const { values, setValue } = useQuestionnaire();
  const { name } = useQuestionnaireItem();

  const isSelected = values[name] === value;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setValue(name, value);
    if (onClick) onClick(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-selected={isSelected}
      className={cn(
        "w-full min-h-[56px] px-4 py-3 rounded-[10px] text-left border transition-colors flex items-center justify-between gap-4 select-none",
        isSelected
          ? "bg-ink-800 border-white/[0.14] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "bg-transparent border-white/[0.08] hover:border-white/[0.14] text-slate-300 hover:text-white",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm">{children}</div>
        {description && (
          <div className="text-[13px] text-slate-500 mt-0.5">{description}</div>
        )}
      </div>
      <div
        className={cn(
          "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
          isSelected ? "border-brand-500 bg-brand-500" : "border-white/[0.2] bg-transparent"
        )}
      >
        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    </button>
  );
}

// ── 7. Error Message ──
export function QuestionnaireError({ className }: { className?: string }) {
  const { errors } = useQuestionnaire();
  const { name } = useQuestionnaireItem();
  const errorMsg = errors[name];

  if (!errorMsg) return null;

  return (
    <div
      className={cn(
        "text-[13px] text-rose-400",
        className
      )}
    >
      <span>{errorMsg}</span>
    </div>
  );
}

// ── 8. Action Buttons Container ──
export function QuestionnaireActions({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pt-6 mt-6 border-t border-white/[0.08]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ── 9. Previous Button ──
export function QuestionnairePrevious({
  className,
  children = "Back",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isFirst, goPrevious } = useQuestionnaire();

  if (isFirst) {
    return <div />;
  }

  return (
    <button
      type="button"
      onClick={goPrevious}
      className={cn(
        "h-9 px-3 rounded-lg hover:bg-white/[0.06] text-slate-300 hover:text-white text-[13px] transition-colors active:scale-[0.98]",
        className
      )}
      {...props}
    >
      <span>{children}</span>
    </button>
  );
}

// ── 10. Next Button ──
export interface QuestionnaireNextProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function QuestionnaireNext({
  className,
  disabled,
  children = "Next",
  variant = "primary",
  ...props
}: QuestionnaireNextProps) {
  const { isLast, goNext, statuses, item, items, setError } = useQuestionnaire();

  if (isLast) return null;

  const currentItemConfig = items.find((it) => it.name === item);
  const isRequired = currentItemConfig?.required;
  const isUnanswered = statuses[item] === "unanswered";

  const handleNextClick = () => {
    if (isRequired && isUnanswered) {
      setError(item, "Pick an answer to continue");
      return;
    }
    goNext();
  };

  return (
    <button
      type="button"
      onClick={handleNextClick}
      disabled={disabled}
      data-status={statuses[item]}
      className={cn(
        "h-9 px-4 rounded-lg text-[13px] font-medium transition-colors active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
        variant === "secondary"
          ? "bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white"
          : "btn-primary-glow",
        className
      )}
      {...props}
    >
      <span>{children}</span>
    </button>
  );
}

// ── 11. Submit Button ──
export function QuestionnaireSubmit({
  className,
  disabled,
  children = "Complete",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isLast, statuses, item } = useQuestionnaire();

  if (!isLast) return null;

  const isUnanswered = statuses[item] === "unanswered";

  return (
    <button
      type="submit"
      disabled={disabled || isUnanswered}
      className={cn(
        "btn-primary-glow h-9 px-4 rounded-lg text-[13px] font-medium active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
        className
      )}
      {...props}
    >
      <span>{children}</span>
    </button>
  );
}
