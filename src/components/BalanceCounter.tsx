"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface BalanceCounterProps {
  /** Net balance for the month, pre-computed on the server with Decimal arithmetic */
  total: number;
  /** Number of unpaid bills/incomes to show as hint */
  pendingCount: number;
}

export function BalanceCounter({ total, pendingCount }: BalanceCounterProps) {
  const { t } = useI18n();

  // Animated counter — interpolates from previous value to new value
  const [displayed, setDisplayed] = useState(total);
  const rafRef = useRef<number>();
  const prevRef = useRef(total);

  useEffect(() => {
    const start = prevRef.current;
    const end = total;
    const dur = 350;
    const startT = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startT) / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + (end - start) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = end;
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [total]);

  const isPositive = displayed >= 0;

  return (
    <div className="px-4 pt-6 pb-5 max-w-2xl mx-auto flex flex-col items-center justify-center">
      <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-1">
        {t("netBalance")}
      </p>
      <div
        className={cn(
          "balance-value text-4xl font-bold tracking-tight",
          isPositive ? "text-income" : "text-bill",
        )}
      >
        {formatCurrency(displayed)}
      </div>
      {pendingCount > 0 && (
        <p className="text-xs text-text-muted mt-1.5">
          {pendingCount} {pendingCount === 1 ? t("pendingItem") : t("pendingItems")}
        </p>
      )}
    </div>
  );
}
