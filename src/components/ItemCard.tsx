"use client";

import { useEffect, useRef, useState } from "react";
import { Check, GripVertical, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { cn, dueDateInfo, getDueDateForMonth } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { BankIcon, ItemIcon } from "./Icons";
import type { Item } from "@/types";
import { DraggableAttributes } from "@dnd-kit/core";
import { CurrencyInput, CurrencyInputOnChangeValues } from "react-currency-input-field";
import { ColoredCurrency } from "@/components/ColoredCurrency";

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
  const [strBalance, setStrBalance] = useState<string | undefined>(undefined);
  const [numBalance, setNumBalance] = useState<number>(item.balance);

  const currencyRef = useRef<HTMLInputElement>(null);

  const isCreditCard = item.type === "CREDIT_CARD";
  const isCheckingAccount = item.type === "CHECKING_ACCOUNT";
  const isIncome = item.type === "INCOME";
  const isBill = item.type === "BILL";

  const isBank = isCreditCard || isCheckingAccount;
  const isPaid = !!item.isPaid;

  const forcePositive = isIncome;
  const forceNegative = isBill || isCreditCard;
  const visualPositive = (forcePositive && numBalance != 0) || numBalance > 0;
  const visualNegative = (forceNegative && numBalance != 0) || numBalance < 0;

  /* ───────────────────────────────
     Sync local state when item changes
  ─────────────────────────────── */

  useEffect(() => {
    setStrBalance(undefined);
    setNumBalance(item.balance);
    setEditing(false);
  }, [item.id, item.balance]);

  /* ───────────────────────────────
     Focus input when editing starts
  ─────────────────────────────── */

  useEffect(() => {
    if (editing) {
      currencyRef.current?.focus();
      currencyRef.current?.select();
    }
  }, [editing]);

  /* ───────────────────────────────
     Due date logic
  ─────────────────────────────── */

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

  /* ───────────────────────────────
     Currency input change
  ─────────────────────────────── */

  const handleOnValueChange = (
    _value: string | undefined,
    _name?: string,
    values?: CurrencyInputOnChangeValues,
  ) => {
    setStrBalance(_value);
    if (values?.float != null) {
      setNumBalance(ensureSign(values.float));
    } else {
      setNumBalance(0);
    }
  };

  const ensureSign = (value: number) => {
    if (forcePositive) {
      return Math.abs(value);
    }
    if (forceNegative && value != 0) {
      return -Math.abs(value);
    }
    return value;
  };

  /* ───────────────────────────────
     Save edited balance
  ─────────────────────────────── */

  const commitEdit = async () => {
    const newBalance = ensureSign(numBalance);
    setEditing(false);
    if (newBalance === item.balance) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyBalance: newBalance,
          month,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        onAmountSaved({ ...item, ...updated });
      }
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setStrBalance(undefined);
    setNumBalance(item.balance);
    setEditing(false);
  };

  /* ───────────────────────────────
     Render
  ─────────────────────────────── */

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 pl-2.5 pr-3.5 py-3 rounded-2xl border transition-all duration-150",
        isDragging
          ? "border-accent shadow-lg opacity-80 ring-1 ring-accent/30 bg-white"
          : isPaid
            ? "bg-gray-50 border-border-subtle item-paid"
            : "bg-white border-border-default hover:shadow-sm",
      )}
    >
      {/* Drag handle */}
      <div
        {...dragHandleListeners}
        {...dragHandleAttributes}
        className="flex-shrink-0 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded transition-colors group-hover:opacity-100 opacity-0"
      >
        <GripVertical size={14} />
      </div>

      {/* Icon */}
      <div className="select-none pointer-events-none flex-shrink-0">
        {isBank ? (
          <BankIcon bank={item.bank} size="md" />
        ) : (
          <ItemIcon icon={item.icon} type={item.type} size="md" />
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-sm font-medium block truncate leading-snug",
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

      {/* Amount */}
      {editing ? (
        <div className="flex items-center border border-accent rounded-md overflow-hidden bg-white focus-within:ring-1 focus-within:ring-accent/30">
          <CurrencyInput
            ref={currencyRef}
            defaultValue={numBalance}
            value={strBalance}
            onValueChange={handleOnValueChange}
            allowNegativeValue={!forcePositive}
            decimalSeparator=","
            groupSeparator="."
            decimalScale={2}
            prefix="R$"
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            className={cn(
              "w-32 text-sm font-semibold text-right px-2 py-0.5",
              visualPositive ? "text-income" : visualNegative ? "text-bill" : "text-text-primary",
            )}
          />
        </div>
      ) : isPaid ? (
        <ColoredCurrency value={numBalance} readonly />
      ) : (
        <button
          onClick={() => {
            if (!isPaid) {
              setEditing(true);
            }
          }}
          disabled={isPaid}
          title={isPaid ? undefined : t("edit")}
          className={cn(
            "text-sm font-semibold tabular-nums flex-shrink-0 rounded px-1 py-0.5 transition-all",
            isPaid
              ? "text-text-muted cursor-default"
              : visualPositive
                ? "hover:bg-income-bg cursor-text"
                : visualNegative
                  ? "hover:bg-bill-bg cursor-text"
                  : "hover:bg-elevated cursor-text",
            saving && "opacity-50",
          )}
        >
          {strBalance !== null && <ColoredCurrency value={numBalance} />}
        </button>
      )}

      {/* Pay button */}
      {(!isCheckingAccount || isPaid) && numBalance != 0 && !editing && (
        <button
          onClick={() => (isPaid ? onUnpay(item) : onPay(item))}
          className={cn(
            "flex-shrink-0 h-7 px-2.5 rounded-lg text-xs font-medium transition-all duration-100 active:scale-95 border",
            isPaid
              ? "bg-white border-border-default text-text-muted hover:bg-elevated flex items-center gap-1"
              : isIncome
                ? "bg-income-bg text-income border-income-border hover:bg-green-100"
                : "bg-bill-bg text-bill border-bill-border hover:bg-red-100",
          )}
        >
          {isPaid && <Check size={11} />}
          {isPaid ? (isIncome ? t("received") : t("paid")) : isIncome ? t("receive") : t("pay")}
        </button>
      )}

      {/* Menu */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
        >
          <MoreHorizontal size={14} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />

            <div className="absolute right-0 top-8 w-40 bg-white border border-border-default rounded-xl shadow-lg overflow-hidden z-40">
              <button
                onClick={() => {
                  onEdit(item);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-elevated"
              >
                <Pencil size={13} /> {t("edit")}
              </button>

              {isPaid && (
                <button
                  onClick={() => {
                    onUnpay(item);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-elevated"
                >
                  <RotateCcw size={13} /> {t("markUnpaid")}
                </button>
              )}

              <button
                onClick={() => {
                  onDelete(item);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-bill hover:bg-bill-bg"
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

/* Overlay */

export function ItemCardOverlay({ item }: { item: Item }) {
  const isCreditCard = item.type === "CREDIT_CARD";
  const isCheckingAccount = item.type === "CHECKING_ACCOUNT";
  const isBank = isCreditCard || isCheckingAccount;

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-2xl border border-accent bg-white shadow-xl ring-1 ring-accent/30 opacity-90">
      <GripVertical size={14} className="text-text-muted flex-shrink-0" />

      <div className="select-none pointer-events-none flex-shrink-0">
        {isBank ? (
          <BankIcon bank={item.bank} size="md" />
        ) : (
          <ItemIcon icon={item.icon} type={item.type} size="md" />
        )}
      </div>

      <span className="flex-1 text-sm font-medium text-text-primary truncate">{item.title}</span>

      <ColoredCurrency value={item.balance} />
    </div>
  );
}
