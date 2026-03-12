"use client";

import { useState } from "react";
import { Button, Modal, Toggle } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { Item } from "@/types";

interface UnpayModalProps {
  open: boolean;
  onClose: () => void;
  item: Item | null;
  onConfirm: (rollback: boolean) => Promise<void>;
}

export function UnpayModal({ open, onClose, item, onConfirm }: UnpayModalProps) {
  const { t } = useI18n();
  const [rollback, setRollback] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const paymentAccountItem = item.event?.paymentAccountItem;
  const isIncome = item.type === "INCOME";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(rollback);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("unpayTitle")}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? t("saving") : t("confirm")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">{t("unpayConfirm")}</p>

        {paymentAccountItem && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-elevated border border-border-subtle">
            <span className="text-sm font-medium text-text-primary">
              {isIncome
                ? t("rollbackIncome", { account: paymentAccountItem.title })
                : t("rollbackBalance", { account: paymentAccountItem.title })}
            </span>
            <Toggle checked={rollback} onChange={setRollback} />
          </div>
        )}
      </div>
    </Modal>
  );
}
