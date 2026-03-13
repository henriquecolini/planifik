"use client";

// Full-screen modal for creating OR editing a folder.
// Replaces the previous inline popup.

import { useEffect, useRef, useState } from "react";
import { ChevronDown, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Button, Modal, Input } from "@/components/ui";
import type { Folder } from "@/types";

const FOLDER_ICONS = [
  "📁",
  "🏠",
  "💼",
  "🏋️",
  "🚗",
  "✈️",
  "🎮",
  "📚",
  "💊",
  "🛒",
  "🎵",
  "🌿",
  "🎓",
  "💡",
  "🔧",
  "📱",
];
const FOLDER_COLORS = [
  { preview: "#ffffff", color: "#ffffff" },
  { preview: "#ef4444", color: "#FEF2F2,#ef4444" },
  { preview: "#10b981", color: "#ECFDF5,#10b981" },
  { preview: "#3b82f6", color: "#EFF6FF,#3b82f6" },
  { preview: "#f97316", color: "#FFF7ED,#f97316" },
  { preview: "#8b5cf6", color: "#F5F3FF,#8b5cf6" },
];

interface FolderPopupProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  editFolder?: Folder | null;
  onCreated?: (folder: Folder) => void;
  onUpdated?: (folder: Folder) => void;
  onDeleted?: (id: string) => void;
}

export function FolderModal({
  open,
  onClose,
  groupId,
  editFolder,
  onCreated,
  onUpdated,
  onDeleted,
}: FolderPopupProps) {
  const { t } = useI18n();
  const isEditing = !!editFolder;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [color, setColor] = useState(FOLDER_COLORS[0].color);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editFolder) {
      setName(editFolder.name);
      setIcon(editFolder.icon);
      setColor(editFolder.backgroundColor);
    } else {
      setName("");
      setIcon("📁");
      setColor(FOLDER_COLORS[0].color);
    }
    setError("");
    setTimeout(() => nameRef.current?.focus(), 30);
  }, [open, editFolder]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSave = async () => {
    setError("");
    if (!name.trim()) return setError(t("folderNameRequired"));
    setLoading(true);
    try {
      const url = isEditing ? `/api/folders/${editFolder!.id}` : "/api/folders";
      const method = isEditing ? "PATCH" : "POST";
      const body = isEditing
        ? { name: name.trim(), icon, backgroundColor: color }
        : { groupId, name: name.trim(), icon, backgroundColor: color };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);

      const result = await res.json();
      isEditing ? onUpdated?.(result) : onCreated?.(result);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editFolder) return;
    if (!confirm(t("deleteFolderConfirm").replace("{name}", editFolder.name))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/folders/${editFolder.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete folder");
      onDeleted?.(editFolder.id);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? t("editFolder") : t("newFolder")}
      size="sm"
      footer={
        <div className="flex flex-col w-full gap-2">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? t("saving") : t("done")}
            </Button>
          </div>
          {isEditing && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="text-[11px] text-bill hover:underline py-1"
            >
              {t("deleteFolder")}
            </button>
          )}
        </div>
      }
    >
      {error && (
        <div className="bg-bill-bg border border-bill-border rounded-lg px-3 py-2 text-sm text-bill">
          {error}
        </div>
      )}

      {/* Name */}
      <Input
        ref={nameRef}
        label={t("folderName")}
        placeholder={t("folderNamePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
        autoFocus
      />

      {/* Color swatches */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-text-secondary">{t("folderColor")}</label>
        <div className="flex flex-wrap justify-stretch gap-1.5">
          {FOLDER_COLORS.map((c) => (
            <button
              key={c.color}
              onClick={() => setColor(c.color)}
              className={cn(
                "flex-1 h-7 rounded-full border-2 p-0.5 transition-all",
                color === c.color
                  ? "border-accent scale-110"
                  : "border-border-default hover:scale-105",
              )}
            >
              <div
                className="w-full h-full rounded-full"
                style={{ backgroundColor: c.preview }}
              ></div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <label className="block text-xs font-medium text-text-secondary">{t("preview")}</label>
      <div
        className="rounded-2xl border border-border-default shadow-sm transition-all duration-150"
        style={{ backgroundColor: color.split(",")[0] }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 select-none">
          <div className="flex-shrink-0 text-text-muted p-0.5 -ml-1">
            <GripVertical size={14} />
          </div>

          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            {color.split(",")[1] && (
              <div
                className="w-8 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color.split(",")[1] }}
              />
            )}
            <span className="text-sm font-semibold text-text-primary truncate">
              {name || t("folderName")}
            </span>
          </div>

          <div className="text-sm font-semibold text-text-muted tabular-nums flex-shrink-0">
            $0.00
          </div>

          <ChevronDown size={14} className="text-text-muted flex-shrink-0" />
        </div>
      </div>
    </Modal>
  );
}
