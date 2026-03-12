import { cn, formatCurrency } from "@/lib/utils";

export function ColoredCurrency({ value, readonly }: { value: number; readonly?: boolean }) {
  return (
    <span
      className={cn(
        "text-sm font-semibold tabular-nums flex-shrink-0",
        readonly
          ? "text-text-secondary line-through"
          : value > 0
            ? "text-income"
            : value < 0
              ? "text-bill"
              : "text-text-primary",
      )}
    >
      {value > 0 && "+"}
      {formatCurrency(value)}
    </span>
  );
}
