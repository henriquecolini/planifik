import { cn, formatCurrency } from "@/lib/utils";

export function ColoredCurrency({
  value,
  readonly,
  underline,
}: {
  value: number;
  readonly?: boolean;
  underline?: boolean;
}) {
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
        underline && "border-b border-text-primary border-dotted",
      )}
    >
      {value > 0 && "+"}
      {formatCurrency(value)}
    </span>
  );
}
