"use client";

import { useState } from "react";
import { Check, GripVertical, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { cn, dueDateInfo, formatCurrency, getDueDateForMonth } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { BankIcon, ItemIcon } from "./Icons";
import { CentsInput } from "./ui/CentsInput";
import type { Item } from "@/types";
import { DraggableAttributes } from "@dnd-kit/core";

interface ItemCardProps {
  item: Item;
  month: string;
  onPay: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onUnpay: (item: Item) => void;
  onAmountSaved: (item: Item) => void;
  dragHandleListeners?: Record<string, unknown>;
  dragHandleAttributes?: DraggableAttributes;
  isDragging?: boolean;
}

export function ItemCard({
  item,
  month,
  onPay,
  onEdit,
  onDelete,
  onUnpay,
  onAmountSaved,
  dragHandleListeners,
  dragHandleAttributes,
  isDragging,
}: ItemCardProps) {
  const { t } = useI18n();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPaid = !!item.isPaid;
  const isAccount = item.type === "CREDIT_CARD" || item.type === "CHECKING_ACCOUNT";
  const isIncome = item.type === "INCOME";
  const isChecking = item.type === "CHECKING_ACCOUNT";

  // ── Sign / display ─────────────────────────────────────────────────────────
  // For checking accounts the stored balance is signed; for all others it is a
  // positive magnitude and the type determines the sign shown to the user.
  const rawBalance = item.balance ?? 0;

  const effectivelyPositive =
    item.type === "INCOME"
      ? true
      : item.type === "BILL"
        ? false
        : item.type === "CREDIT_CARD"
          ? false
          : /* CHECKING_ACCOUNT */ rawBalance >= 0;

  const signChar = effectivelyPositive ? "+" : "−";
  const absForDisplay = Math.abs(rawBalance);

  // ── Due date ───────────────────────────────────────────────────────────────
  const dueDate = getDueDateForMonth(item, month);
  const due = dueDate ? dueDateInfo(dueDate) : null;

  const dueLabelText = (() => {
    if (!due) return null;
    switch (due.type) {
      case "today":
        return t("dueToday");
      case "tomorrow":
        return t("dueTomorrow");
      case "inDays":
        return t("dueInDays", { n: String(due.days) });
      case "on":
        return t("dueOn", { date: due.formattedDate });
      case "expiredYesterday":
        return t("expiredYesterday");
      case "expiredDaysAgo":
        return t("expiredDaysAgo", { n: String(due.days) });
    }
  })();

  // ── Pay button label ───────────────────────────────────────────────────────
  const actionLabel = isPaid
    ? isIncome
      ? t("received")
      : t("paid")
    : isIncome
      ? t("receive")
      : t("pay");

  // ── Inline balance save ────────────────────────────────────────────────────
  const commitEdit = async (newValueInReais: number) => {
    setEditing(false);
    if (newValueInReais === rawBalance) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBalance: newValueInReais, month }),
      });
      if (res.ok) {
        const updated = await res.json();
        onAmountSaved({ ...item, ...updated });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 pl-2.5 pr-3.5 py-3 rounded-xl border transition-all duration-150",
        isDragging
          ? "border-accent shadow-lg opacity-80 ring-1 ring-accent/30 bg-white"
          : isPaid
            ? "bg-gray-50 border-border-subtle item-paid"
            : "bg-white border-border-subtle hover:border-border-default hover:shadow-sm",
      )}
    >
      {/* Left type stripe */}
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-0.5 rounded-full transition-opacity",
          isPaid ? "opacity-0" : effectivelyPositive ? "bg-income" : "bg-bill",
        )}
      />

      {/* Drag handle */}
      <div
        {...dragHandleListeners}
        {...dragHandleAttributes}
        className="flex-shrink-0 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded transition-colors group-hover:opacity-100 opacity-0"
      >
        <GripVertical size={14} />
      </div>

      {/* Icon — pointer-events-none so it feels like an image, not selectable text */}
      <div className="select-none pointer-events-none flex-shrink-0">
        {isAccount ? (
          <BankIcon bank={item.bank} size="md" />
        ) : (
          <ItemIcon icon={item.icon} type={item.type} size="md" />
        )}
      </div>

      {/* Title + due date */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-sm font-medium item-title block truncate leading-snug",
            isPaid ? "text-text-muted" : "text-text-primary",
          )}
        >
          {item.title}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {item.user?.name && (
            <span className="text-[11px] text-text-muted">{item.user.name.split(" ")[0]}</span>
          )}
          {due && dueLabelText && !isPaid && (
            <span
              className={cn(
                "text-[11px] font-medium px-1.5 py-0.5 rounded",
                due.isExpired
                  ? "text-bill bg-bill-bg"
                  : due.isUrgent
                    ? "text-warning bg-warning-bg"
                    : "text-text-muted bg-elevated",
              )}
            >
              {dueLabelText}
            </span>
          )}
        </div>
      </div>

      {/* ── Amount — click to edit inline ── */}
      {editing ? (
        <div
          className={cn(
            "flex items-center border border-accent rounded-md overflow-hidden bg-white",
            "focus-within:ring-1 focus-within:ring-accent/30",
          )}
        >
          <CentsInput
            initialValue={rawBalance}
            allowNegative={isChecking}
            autoFocus
            onCommit={commitEdit}
            onCancel={() => setEditing(false)}
            className={cn(
              "w-32 text-sm font-semibold text-right px-2 py-0.5",
              effectivelyPositive ? "text-income" : "text-bill",
            )}
          />
        </div>
      ) : (
        <button
          onClick={() => {
            if (!isPaid) setEditing(true);
          }}
          disabled={isPaid}
          title={isPaid ? undefined : t("edit")}
          className={cn(
            "text-sm font-semibold tabular-nums flex-shrink-0 rounded px-1 py-0.5 transition-all",
            isPaid
              ? "text-text-muted cursor-default"
              : effectivelyPositive
                ? "text-income hover:bg-income-bg cursor-text"
                : "text-bill   hover:bg-bill-bg   cursor-text",
            saving && "opacity-50",
          )}
        >
          {signChar}
          {formatCurrency(absForDisplay)}
        </button>
      )}

      {/* Pay / Receive button */}
      <button
        onClick={() => (isPaid ? onUnpay(item) : onPay(item))}
        className={cn(
          "flex-shrink-0 h-7 px-2.5 rounded-lg text-xs font-medium transition-all duration-100 active:scale-95 border",
          isPaid
            ? "bg-white border-border-default text-text-muted hover:bg-elevated flex items-center gap-1"
            : isIncome
              ? "bg-income-bg text-income border-income-border hover:bg-green-100"
              : "bg-bill-bg   text-bill   border-bill-border   hover:bg-red-100",
        )}
      >
        {isPaid && <Check size={11} />}
        {actionLabel}
      </button>

      {/* ── Three-dot context menu ──
          Always visible (dimmed), not hidden until hover — avoids the
          "invisible button on white background" problem. */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
          title={t("edit")}
        >
          <MoreHorizontal size={14} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 w-40 bg-white border border-border-default rounded-xl shadow-lg overflow-hidden z-40 animate-scale-in">
              <button
                onClick={() => {
                  onEdit(item);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:bg-elevated transition-colors"
              >
                <Pencil size={13} /> {t("edit")}
              </button>
              {isPaid && (
                <button
                  onClick={() => {
                    onUnpay(item);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:bg-elevated transition-colors"
                >
                  <RotateCcw size={13} /> {t("markUnpaid")}
                </button>
              )}
              <button
                onClick={() => {
                  onDelete(item);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-bill hover:bg-bill-bg transition-colors"
              >
                <Trash2 size={13} /> {t("delete")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ItemCardOverlay({ item }: { item: Item }) {
  const rawBalance = item.balance ?? 0;
  const effectivelyPositive =
    item.type === "INCOME"
      ? true
      : item.type === "BILL"
        ? false
        : item.type === "CREDIT_CARD"
          ? false
          : rawBalance >= 0;

  const signChar = effectivelyPositive ? "+" : "−";

  const isAccount = item.type === "CREDIT_CARD" || item.type === "CHECKING_ACCOUNT";

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl border border-accent bg-white shadow-xl ring-1 ring-accent/30 opacity-90">
      <GripVertical size={14} className="text-text-muted flex-shrink-0" />
      <div className="select-none pointer-events-none flex-shrink-0">
        {isAccount ? (
          <BankIcon bank={item.bank} size="md" />
        ) : (
          <ItemIcon icon={item.icon} type={item.type} size="md" />
        )}
      </div>
      <span className="flex-1 text-sm font-medium text-text-primary truncate">{item.title}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums flex-shrink-0",
          effectivelyPositive ? "text-income" : "text-bill",
        )}
      >
        {signChar}
        {formatCurrency(Math.abs(rawBalance))}
      </span>
    </div>
  );
}
