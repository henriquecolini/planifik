"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui/index";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Item, DeleteMode } from "@/types";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  item: Item | null;
  month: string;
  onConfirm: (mode: DeleteMode) => Promise<void>;
}

export function DeleteConfirmModal({ open, onClose, item, month, onConfirm }: DeleteConfirmModalProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<DeleteMode>("this");
  const [loading,  setLoading]  = useState(false);

  if (!item) return null;

  const isRecurring = !item.endMonth || item.startMonth !== item.endMonth;

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(isRecurring ? selected : "all"); onClose(); }
    finally { setLoading(false); }
  };

  const options: { value: DeleteMode; label: string; desc: string }[] = [
    { value: "this",      label: t("deleteJustThis"),    desc: t("deleteJustThisDesc",    { month }) },
    { value: "following", label: t("deleteFollowing"),   desc: t("deleteFollowingDesc",   { month }) },
    { value: "all",       label: t("deleteAll"),          desc: t("deleteAllDesc") },
  ];

  return (
    <Modal open={open} onClose={onClose} title={t("deleteItem")} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t("cancel")}</Button>
          <Button variant="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? t("deleting") : t("deleteConfirm")}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">
        {t("deleteConfirm")} <span className="font-medium text-text-primary">"{item.title}"</span>?
      </p>

      {isRecurring ? (
        <div className="space-y-1.5">
          {options.map((opt) => (
            <button key={opt.value} onClick={() => setSelected(opt.value)}
              className={cn("w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all",
                selected === opt.value ? "border-bill bg-bill-bg" : "border-border-subtle bg-white hover:border-border-default")}>
              <span className={cn("font-medium block", selected === opt.value ? "text-bill" : "text-text-primary")}>
                {opt.label}
              </span>
              <span className="text-xs text-text-muted mt-0.5 block">{opt.desc}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">{t("deleteOneTime")}</p>
      )}
    </Modal>
  );
}
