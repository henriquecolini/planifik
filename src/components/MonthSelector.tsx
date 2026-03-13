"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, cn, currentMonth, formatMonth, sameMonth } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { MonthSelection } from "@/types";

interface MonthSelectorProps {
  value: MonthSelection;
  onChange: (m: MonthSelection) => void;
}

export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const { t, lang } = useI18n();
  const todayMonth = currentMonth();
  const isCurrentMonth = sameMonth(value, todayMonth);

  return (
    <div className="border-b border-border-subtle bg-white w-full">
      <div className="flex items-center justify-center gap-2 py-2.5 px-4 max-w-2xl relative mx-auto">
        <button
          onClick={() => onChange(todayMonth)}
          className={cn(
            "absolute left-4 text-xs font-medium text-accent transition-all duration-150",
            isCurrentMonth ? "opacity-0 pointer-events-none" : "opacity-100",
          )}
        >
          {t("today")}
        </button>

        <button
          onClick={() => onChange(addMonths(value, -1))}
          className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
        >
          <ChevronLeft size={15} />
        </button>

        <span className="min-w-[96px] text-center text-sm font-semibold text-text-primary no-select">
          {formatMonth(value, lang)}
        </span>

        <button
          onClick={() => onChange(addMonths(value, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
