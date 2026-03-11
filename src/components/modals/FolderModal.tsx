"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Modal, Button, Input } from "@/components/ui/index";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Folder } from "@/types";

const FOLDER_ICONS  = ["📁","🏠","💼","🏋️","🚗","✈️","🎮","📚","💊","🛒","🎵","🌿","🎓","💡","🔧","📱"];
const FOLDER_COLORS = ["#F0F2F5","#FEF2F2","#ECFDF5","#EFF6FF","#FFF7ED","#F5F3FF","#FFFBEB","#F0FDF4","#FDF4FF","#FFF1F2"];

interface FolderModalProps {
  open: boolean; onClose: () => void; groupId: string;
  folders: Folder[]; editFolder?: Folder | null;
  onCreated: (f: Folder) => void; onUpdated: (f: Folder) => void; onDeleted: (id: string) => void;
}

export function FolderModal({ open, onClose, groupId, folders, editFolder, onCreated, onUpdated, onDeleted }: FolderModalProps) {
  const { t } = useI18n();
  const isEditing = !!editFolder;
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"list" | "edit">("list");

  useEffect(() => {
    if (!open) { setView("list"); return; }
    if (editFolder) { setName(editFolder.name); setIcon(editFolder.icon); setColor(editFolder.backgroundColor); setView("edit"); }
  }, [open, editFolder]);

  const handleSave = async () => {
    setError("");
    if (!name.trim()) return setError(t("folderNameRequired"));
    setLoading(true);
    try {
      const isEdit = view === "edit" && isEditing;
      const url    = isEdit ? `/api/folders/${editFolder!.id}` : "/api/folders";
      const method = isEdit ? "PATCH" : "POST";
      const body   = isEdit ? { name, icon, backgroundColor: color } : { groupId, name, icon, backgroundColor: color };
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      const result = await res.json();
      isEdit ? onUpdated(result) : onCreated(result);
      setView("list");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  };

  const handleDelete = async (folder: Folder) => {
    if (!confirm(t("deleteFolderConfirm").replace("{name}", folder.name))) return;
    await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
    onDeleted(folder.id);
  };

  return (
    <Modal open={open} onClose={onClose}
      title={view === "list" ? t("folders") : isEditing ? t("editFolder") : t("newFolder")}
      size="sm"
      footer={
        view === "list"
          ? <Button onClick={() => { setName(""); setIcon("📁"); setColor(FOLDER_COLORS[0]); setView("edit"); }}>+ {t("newFolder")}</Button>
          : <>
              <Button variant="secondary" onClick={() => setView("list")} disabled={loading}>{t("back")}</Button>
              <Button onClick={handleSave} disabled={loading}>{loading ? t("saving") : t("save")}</Button>
            </>
      }
    >
      {view === "list" ? (
        <div className="space-y-1.5">
          {folders.length === 0 && <p className="text-sm text-text-muted text-center py-4">{t("noFoldersYet")}</p>}
          {folders.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-elevated border border-border-subtle">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm" style={{ backgroundColor: f.backgroundColor }}>{f.icon}</div>
              <span className="flex-1 text-sm text-text-primary">{f.name}</span>
              <button onClick={() => handleDelete(f)} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-bill transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {error && <div className="text-sm text-bill bg-bill-bg border border-bill-border rounded-lg px-3 py-2">{error}</div>}
          <Input label={t("folderName")} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("folderNamePlaceholder")} autoFocus />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-secondary">{t("folderIcon")}</label>
            <div className="grid grid-cols-8 gap-1.5">
              {FOLDER_ICONS.map((em) => (
                <button key={em} onClick={() => setIcon(em)}
                  className={cn("w-8 h-8 flex items-center justify-center rounded-lg text-base transition-all",
                    icon === em ? "bg-accent-dim ring-1 ring-accent" : "bg-elevated hover:bg-hover")}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-secondary">{t("folderColor")}</label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn("w-8 h-8 rounded-lg border-2 transition-all", color === c ? "border-accent scale-110" : "border-border-default")}
                  style={{ backgroundColor: c }} />
              ))}
              <label className={cn("w-8 h-8 rounded-lg border-2 cursor-pointer overflow-hidden", !FOLDER_COLORS.includes(color) ? "border-accent" : "border-border-default")}>
                <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={color} onChange={(e) => setColor(e.target.value)} />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-elevated rounded-xl border border-border-subtle">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm" style={{ backgroundColor: color }}>{icon}</div>
            <span className="text-sm text-text-primary">{name || t("folderName")}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
