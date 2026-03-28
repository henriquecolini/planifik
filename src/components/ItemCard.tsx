"use client";

import { useEffect, useRef, useState } from "react";
import {
  MdCheck,
  MdDragIndicator,
  MdEditSquare,
  MdMoreVert,
  MdRotateLeft,
  MdDelete,
} from "react-icons/md";
import { cn, dueDateInfo, getDueDateForMonth } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { BankIcon, ItemIcon } from "./Icons";
import type { Item, ItemType } from "@/types";
import { CurrencyInput, CurrencyInputOnChangeValues } from "react-currency-input-field";
import { ColoredCurrency } from "@/components/ColoredCurrency";
import { useSortable } from "@dnd-kit/react/sortable";
import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";

interface ItemCardProps {
  item: Item;
  month: string;
  dragIndex: number;
  dragGroupId: string;
  onPay: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onUnpay: (item: Item) => void;
  onAmountSaved: (item: Item) => void;
}

export function ItemCard({
  item,
  month,
  dragIndex,
  dragGroupId,
  onPay,
  onEdit,
  onDelete,
  onUnpay,
  onAmountSaved,
}: ItemCardProps) {
  const { t } = useI18n();

  const { ref, isDragging } = useSortable({
    id: item.id,
    index: dragIndex,
    type: "item",
    accept: "item",
    group: dragGroupId,
    modifiers: [RestrictToVerticalAxis],
  });
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
          amount: newBalance,
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

  const typeOptions: Record<ItemType, string> = {
    BILL: t("typeBill"),
    INCOME: t("typeIncome"),
    CREDIT_CARD: t("typeCreditCard"),
    CHECKING_ACCOUNT: t("typeChecking"),
  };

  /* ───────────────────────────────
     Render
  ─────────────────────────────── */

  return (
    <div
      ref={ref}
      data-dragging={isDragging}
      className={cn(
        "group relative flex items-center gap-2 pl-2.5 pr-3.5 py-3 rounded-2xl border",
        isDragging
          ? "border-accent shadow-lg opacity-80 ring-1 ring-accent/30 bg-white"
          : isPaid
            ? "bg-gray-50 border-border-subtle item-paid"
            : "bg-white border-border-default hover:shadow-sm",
      )}
    >
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
          <span className="text-xs text-text-secondary">{typeOptions[item.type]}</span>
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
          {strBalance !== null && <ColoredCurrency value={numBalance} underline />}
        </button>
      )}

      {/* Menu */}
      <div className="relative flex items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
        >
          <MdMoreVert size={18} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />

            <div className="absolute right-0 top-10 w-48 bg-white border border-border-default rounded-xl shadow-lg overflow-hidden z-40">
              {(!isCheckingAccount || isPaid) && numBalance != 0 && !editing && (
                <button
                  onClick={() => {
                    isPaid ? onUnpay(item) : onPay(item);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors",
                    isPaid
                      ? "hover:bg-elevated"
                      : isIncome
                        ? "text-income hover:bg-income-bg"
                        : "text-bill hover:bg-bill-bg",
                  )}
                >
                  {isPaid ? <MdRotateLeft size={14} /> : <MdCheck size={14} />}
                  {isPaid
                    ? isIncome
                      ? t("markUnpaid")
                      : t("markUnpaid")
                    : isIncome
                      ? t("receive")
                      : t("pay")}
                </button>
              )}

              <button
                onClick={() => {
                  onEdit(item);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-elevated border-t border-border-subtle"
              >
                <MdEditSquare size={14} /> {t("edit")}
              </button>

              <button
                onClick={() => {
                  onDelete(item);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-bill hover:bg-bill-bg border-t border-border-subtle"
              >
                <MdDelete size={14} /> {t("delete")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
