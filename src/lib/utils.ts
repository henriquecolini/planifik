// lib/utils.ts — Client-safe utility functions (no server-only imports)

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Item, MonthSelection } from "@/types";
import type { Lang } from "./i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Month helpers ─────────────────────────────────────────────────────────────

export function currentMonth(): MonthSelection {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function toMonthString({ year, month }: MonthSelection): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function fromMonthString(str: string): MonthSelection {
  const [year, month] = str.split("-").map(Number);
  return { year, month };
}

export function formatMonth({ year, month }: MonthSelection, lang: Lang = "pt-BR"): string {
  const locale = lang === "pt-BR" ? "pt-BR" : "en-US";
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: "short",
    year: "numeric",
  });
}

export function addMonths({ year, month }: MonthSelection, delta: number): MonthSelection {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function sameMonth(a: MonthSelection, b: MonthSelection): boolean {
  return a.year === b.year && a.month === b.month;
}

export function compareMonths(a: string, b: string): number {
  return a.localeCompare(b);
}

// ─── Item helpers ─────────────────────────────────────────────────────────────

export function isItemActiveInMonth(item: Item, month: string): boolean {
  if (compareMonths(month, item.startMonth) < 0) return false;
  if (item.endMonth && compareMonths(month, item.endMonth) > 0) return false;
  return true;
}

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Formats a number as BRL currency. Always pass an absolute value and let
 * the caller prepend the sign (+ / −) so display is always unambiguous.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Math.abs(value));
}

/**
 * Formats a signed amount with an explicit "+"/"-" prefix and absolute value,
 * ensuring the display never produces "+-" or "--".
 */
export function formatSignedCurrency(value: number): { sign: "+" | "−"; formatted: string } {
  return {
    sign: value >= 0 ? "+" : "−",
    formatted: formatCurrency(Math.abs(value)),
  };
}

// ─── Due date ─────────────────────────────────────────────────────────────────

export function getDueDateForMonth(item: Item, month: string): Date | null {
  if (item.dueDate) return new Date(item.dueDate);
  if (item.dueDay) {
    const [year, mo] = month.split("-").map(Number);
    if (item.dueNextMonth) return new Date(year, mo, item.dueDay);
    return new Date(year, mo - 1, item.dueDay);
  }
  return null;
}

export function dueDateInfo(dueDate: Date): {
  type: "today" | "tomorrow" | "inDays" | "on" | "expiredYesterday" | "expiredDaysAgo";
  days: number;
  formattedDate: string;
  isExpired: boolean;
  isUrgent: boolean;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  const formattedDate = dueDate.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });

  if (days < -1)
    return {
      type: "expiredDaysAgo",
      days: Math.abs(days),
      formattedDate,
      isExpired: true,
      isUrgent: false,
    };
  if (days === -1)
    return { type: "expiredYesterday", days: 1, formattedDate, isExpired: true, isUrgent: false };
  if (days === 0)
    return { type: "today", days: 0, formattedDate, isExpired: false, isUrgent: true };
  if (days === 1)
    return { type: "tomorrow", days: 1, formattedDate, isExpired: false, isUrgent: true };
  if (days <= 7) return { type: "inDays", days, formattedDate, isExpired: false, isUrgent: true };
  return { type: "on", days, formattedDate, isExpired: false, isUrgent: false };
}

// ─── Recurrence ───────────────────────────────────────────────────────────────

export function getRecurrenceMode(
  item: Pick<Item, "startMonth" | "endMonth">,
): "once" | "limited" | "forever" {
  if (!item.endMonth) return "forever";
  if (item.startMonth === item.endMonth) return "once";
  return "limited";
}
