"use client";

import { useState } from "react";
import { Button, Modal, Toggle } from "@/components/ui/index";
import { BankIcon, ItemIcon } from "@/components/Icons";
import { cn, formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Item, PaymentMethod } from "@/types";
import { ColoredCurrency } from "@/components/ColoredCurrency";

interface PayItemModalProps {
  open: boolean;
  onClose: () => void;
  item: Item | null;
  month: string;
  accounts: Item[];
  onConfirm: (paymentMethod: PaymentMethod | null, paymentItemId: string | null) => Promise<void>;
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
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const isIncome = item.type === "INCOME";
  const isCard = item.type === "CREDIT_CARD";
  const amount = item.balance;

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
      await onConfirm(method, selectedAccount?.id ?? null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isAccountItem = (i: Item) => i.type === "CREDIT_CARD" || i.type === "CHECKING_ACCOUNT";

  const AccountOption = ({ acc }: { acc: Item }) => {
    const balanceAmount = acc.balance;
    const isSelected = selectedAccount?.id === acc.id;
    return (
      <button
        onClick={() => {
          setSelectedAccount(isSelected ? null : acc);
        }}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm text-left transition-all",
          isSelected
            ? "border-accent bg-accent-dim"
            : "border-border-subtle bg-white hover:border-border-default",
        )}
      >
        <BankIcon bank={acc.bank} size="sm" />
        <span className="flex-1 font-medium text-text-primary">{acc.title}</span>
        <span className="text-xs text-text-muted tabular-nums">
          <div className="min-h-8 flex flex-col justify-center items-end">
            {isSelected ? (
              <>
                <div className="line-through">{`${formatCurrency(selectedAccount.balance)}`}</div>
                <div>{`${formatCurrency(selectedAccount.balance + amount)}`}</div>
              </>
            ) : (
              formatCurrency(balanceAmount)
            )}
          </div>
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
        <ColoredCurrency value={amount} />
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
    </Modal>
  );
}
