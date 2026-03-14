"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/ui/index";
import { useI18n } from "@/lib/i18n";
import type { Group } from "@/types";

interface DeleteGroupConfirmModalProps {
  open: boolean;
  onClose: () => void;
  group: Group | null;
  onConfirm: () => Promise<void>;
}

export function DeleteGroupConfirmModal({
  open,
  onClose,
  group,
  onConfirm,
}: DeleteGroupConfirmModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  if (!group) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("deleteGroup")}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? t("deleting") : t("deleteConfirm")}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">
          {t("deleteGroupConfirm", { name: group.name })}
        </p>
        <div className="p-3 bg-bill-bg border border-bill-border rounded-lg">
          <p className="text-xs text-bill font-medium">{t("deleteGroupWarning")}</p>
        </div>
      </div>
    </Modal>
  );
}
