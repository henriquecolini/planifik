"use client";

import { useState } from "react";
import { Button, Modal, Toggle } from "@/components/ui/index";
import { BankIcon, ItemIcon } from "@/components/Icons";
import { cn, formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Item, PaymentMethod } from "@/types";

interface PayItemModalProps {
  open: boolean;
  onClose: () => void;
  item: Item | null;
  month: string;
  accounts: Item[];
  onConfirm: (
    paymentMethod: PaymentMethod | null,
    paymentItemId: string | null,
    deductBalance: boolean,
  ) => Promise<void>;
}

export function PayItemModal({
  open,
  onClose,
  item,
  month,
  accounts,
  onConfirm,
}: PayItemModalProps) {
  const { t } = useI18n();
  const [selectedAccount, setSelectedAccount] = useState<Item | null>(null);
  const [deductBalance, setDeductBalance] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const isIncome = item.type === "INCOME";
  const isCard = item.type === "CREDIT_CARD";
  const amount = item.balance ?? 0;

  const checkingAccounts = accounts.filter((a) => a.type === "CHECKING_ACCOUNT");
  const creditCards = accounts.filter((a) => a.type === "CREDIT_CARD");

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const method: PaymentMethod | null = selectedAccount
        ? selectedAccount.type === "CREDIT_CARD"
          ? "credit_card"
          : "checking_account"
        : null;
      await onConfirm(method, selectedAccount?.id ?? null, deductBalance);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isAccountItem = (i: Item) => i.type === "CREDIT_CARD" || i.type === "CHECKING_ACCOUNT";

  const AccountOption = ({ acc }: { acc: Item }) => {
    const balanceAmount = acc.balance ?? 0;
    return (
      <button
        onClick={() => setSelectedAccount(selectedAccount?.id === acc.id ? null : acc)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-all",
          selectedAccount?.id === acc.id
            ? "border-accent bg-accent-dim"
            : "border-border-subtle bg-white hover:border-border-default",
        )}
      >
        <BankIcon bank={acc.bank} size="sm" />
        <span className="flex-1 font-medium text-text-primary">{acc.title}</span>
        <span className="text-xs text-text-muted tabular-nums">
          {formatCurrency(balanceAmount)}
        </span>
      </button>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isIncome ? t("receiveIncome") : isCard ? t("payCreditCard") : t("payBill")}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? t("saving") : isIncome ? t("markReceived") : t("markPaid")}
          </Button>
        </>
      }
    >
      {/* Summary card */}
      <div className="flex items-center gap-3 bg-elevated rounded-xl px-3 py-3 border border-border-subtle">
        {isAccountItem(item) ? (
          <BankIcon bank={item.bank} size="md" />
        ) : (
          <ItemIcon icon={item.icon} type={item.type} size="md" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{item.title}</p>
          <p className="text-xs text-text-muted">{month}</p>
        </div>
        <span className={cn("text-sm font-bold", isIncome ? "text-income" : "text-bill")}>
          {isIncome ? "+" : "−"}
          {formatCurrency(amount)}
        </span>
      </div>

      {/* Account selection */}
      {isIncome ? (
        checkingAccounts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-text-secondary">
              {t("depositInto")}{" "}
              <span className="text-text-muted font-normal">({t("optional")})</span>
            </p>
            {checkingAccounts.map((acc) => (
              <AccountOption key={acc.id} acc={acc} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-text-secondary">
            {isCard ? t("payFrom") : t("payingWith")}{" "}
            <span className="text-text-muted font-normal">({t("optional")})</span>
          </p>
          {checkingAccounts.map((acc) => (
            <AccountOption key={acc.id} acc={acc} />
          ))}
          {!isCard && creditCards.map((acc) => <AccountOption key={acc.id} acc={acc} />)}
        </div>
      )}

      {/* Balance toggle */}
      {selectedAccount && (
        <Toggle
          checked={deductBalance}
          onChange={setDeductBalance}
          label={isIncome ? t("addToBalance") : t("deductFromBalance")}
          description={
            isIncome
              ? `${formatCurrency(selectedAccount.balance ?? 0)} → ${formatCurrency((selectedAccount.balance ?? 0) + amount)}`
              : `${formatCurrency(selectedAccount.balance ?? 0)} → ${formatCurrency((selectedAccount.balance ?? 0) - amount)}`
          }
        />
      )}
    </Modal>
  );
}
