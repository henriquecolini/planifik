"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/ui/index";
import { useI18n } from "@/lib/i18n";
import type { Folder } from "@/types";

interface DeleteFolderConfirmModalProps {
  open: boolean;
  onClose: () => void;
  folder: Folder | null;
  onConfirm: () => Promise<void>;
}

export function DeleteFolderConfirmModal({
  open,
  onClose,
  folder,
  onConfirm,
}: DeleteFolderConfirmModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  if (!folder) return null;

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
      title={t("deleteFolder")}
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
      <p className="text-sm text-text-secondary">
        {t("deleteFolderConfirm", { name: folder.name })}
      </p>
      <p className="text-xs text-text-muted mt-2">{t("deleteFolderWarning")}</p>
    </Modal>
  );
}
