"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CentsInput — integer-cents money input
//
// The user never types a comma or decimal point. They type digits which
// accumulate as cents (rightmost position). Backspace removes the last digit.
// For checking accounts (allowNegative), pressing '-' anywhere toggles sign.
//
// Example (allowNegative=false):
//   Type '1' → R$ 0,01
//   Type '5' → R$ 0,15
//   Type '0' → R$ 1,50
//   Backspace → R$ 0,15
//
// Props:
//   initialValue  — number in reais (e.g. -42.5 or 150.0)
//   onChange      — called on every keystroke with updated reais value
//   onCommit      — called when Enter is pressed
//   onCancel      — called when Escape is pressed
//   allowNegative — enables '-' key to toggle sign (for checking accounts)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CentsInputProps {
  initialValue?: number;
  onChange?: (valueInReais: number) => void;
  onCommit?: (valueInReais: number) => void;
  onCancel?: () => void;
  allowNegative?: boolean;
  className?: string;
  autoFocus?: boolean;
}

const MAX_CENTS = 99_999_999; // R$ 999.999,99 — sane upper bound

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function CentsInput({
  initialValue = 0,
  onChange,
  onCommit,
  onCancel,
  allowNegative = false,
  className,
  autoFocus = false,
}: CentsInputProps) {
  const [cents, setCents] = useState(() => Math.round(Math.abs(initialValue) * 100));
  const [negative, setNegative] = useState(allowNegative && initialValue < 0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      // Small delay so the element is mounted before focusing
      const id = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(id);
    }
  }, [autoFocus]);

  const toReais = (c: number, neg: boolean): number => (neg ? -(c / 100) : c / 100);

  const display = (() => {
    const formatted = formatBRL(cents);
    if (negative && cents > 0) {
      // Prepend minus sign before the currency symbol
      return "−" + formatted;
    }
    return formatted;
  })();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const newCents = Math.min(cents * 10 + parseInt(e.key, 10), MAX_CENTS);
      setCents(newCents);
      onChange?.(toReais(newCents, negative));
    } else if (e.key === "Backspace") {
      e.preventDefault();
      const newCents = Math.floor(cents / 10);
      setCents(newCents);
      onChange?.(toReais(newCents, negative));
    } else if ((e.key === "-" || e.key === "Subtract") && allowNegative) {
      e.preventDefault();
      const newNeg = !negative;
      setNegative(newNeg);
      onChange?.(toReais(cents, newNeg));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onCommit?.(toReais(cents, negative));
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel?.();
    } else {
      // Block all other keys (letters, dots, commas, etc.)
      e.preventDefault();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="none" // prevents mobile keyboard from appearing; we handle input ourselves
      readOnly
      value={display}
      onKeyDown={handleKeyDown}
      onBlur={() => onCommit?.(toReais(cents, negative))}
      // Prevent copy-paste from injecting raw text
      onPaste={(e) => e.preventDefault()}
      className={cn(
        "tabular-nums select-none outline-none bg-transparent cursor-default",
        className,
      )}
    />
  );
}
