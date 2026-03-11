"use client";

// Small inline popup for creating OR editing a folder.
// Appears as a dropdown anchored to a trigger element — not a full-screen modal.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/index";
import type { Folder } from "@/types";

const FOLDER_ICONS  = ["📁","🏠","💼","🏋️","🚗","✈️","🎮","📚","💊","🛒","🎵","🌿","🎓","💡","🔧","📱"];
const FOLDER_COLORS = ["#F0F2F5","#FEF2F2","#ECFDF5","#EFF6FF","#FFF7ED","#F5F3FF","#FFFBEB","#F0FDF4","#FDF4FF","#FFF1F2"];

interface FolderPopupProps {
    open: boolean;
    onClose: () => void;
    groupId: string;
    editFolder?: Folder | null;
    onCreated?: (folder: Folder) => void;
    onUpdated?: (folder: Folder) => void;
    onDeleted?: (id: string) => void;
    /** Position the popup relative to this element */
    anchorRef?: React.RefObject<HTMLElement>;
}

export function FolderPopup({
                                open, onClose, groupId, editFolder, onCreated, onUpdated, onDeleted, anchorRef,
                            }: FolderPopupProps) {
    const { t } = useI18n();
    const isEditing = !!editFolder;

    const [name,    setName]    = useState("");
    const [icon,    setIcon]    = useState("📁");
    const [color,   setColor]   = useState(FOLDER_COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        if (editFolder) {
            setName(editFolder.name);
            setIcon(editFolder.icon);
            setColor(editFolder.backgroundColor);
        } else {
            setName(""); setIcon("📁"); setColor(FOLDER_COLORS[0]);
        }
        setError("");
        setTimeout(() => nameRef.current?.focus(), 30);
    }, [open, editFolder]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const handleSave = async () => {
        setError("");
        if (!name.trim()) return setError(t("folderNameRequired"));
        setLoading(true);
        try {
            const url    = isEditing ? `/api/folders/${editFolder!.id}` : "/api/folders";
            const method = isEditing ? "PATCH" : "POST";
            const body   = isEditing
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

    if (!open) return null;

    return (
        <>
            {/* Backdrop — invisible, just closes on click outside */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Popup card */}
            <div className="fixed top-14 right-4 z-50 w-64 bg-white border border-border-default rounded-2xl shadow-xl animate-slide-down">
                <div className="p-4 space-y-3">
                    <p className="text-sm font-semibold text-text-primary">
                        {isEditing ? t("editFolder") : t("newFolder")}
                    </p>

                    {error && (
                        <p className="text-xs text-bill">{error}</p>
                    )}

                    {/* Name */}
                    <input
                        ref={nameRef}
                        type="text"
                        placeholder={t("folderNamePlaceholder")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                        className="w-full bg-white border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />

                    {/* Icon grid */}
                    <div>
                        <p className="text-[11px] font-medium text-text-muted mb-1.5">{t("folderIcon")}</p>
                        <div className="grid grid-cols-8 gap-1">
                            {FOLDER_ICONS.map((em) => (
                                <button
                                    key={em}
                                    onClick={() => setIcon(em)}
                                    className={cn(
                                        "w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-all select-none",
                                        icon === em ? "bg-accent-dim ring-1 ring-accent" : "hover:bg-elevated",
                                    )}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color swatches */}
                    <div>
                        <p className="text-[11px] font-medium text-text-muted mb-1.5">{t("folderColor")}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {FOLDER_COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={cn(
                                        "w-7 h-7 rounded-lg border-2 transition-all",
                                        color === c ? "border-accent scale-110" : "border-transparent hover:border-border-default",
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            {/* Custom color */}
                            <label className={cn(
                                "w-7 h-7 rounded-lg border-2 cursor-pointer overflow-hidden",
                                !FOLDER_COLORS.includes(color) ? "border-accent" : "border-transparent hover:border-border-default",
                            )}>
                                <input
                                    type="color"
                                    className="opacity-0 w-full h-full cursor-pointer"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-elevated border border-border-subtle">
                        <div
                            className="w-5 h-5 rounded-md flex items-center justify-center text-xs select-none"
                            style={{ backgroundColor: color }}
                        >
                            {icon}
                        </div>
                        <span className="text-sm text-text-primary truncate">{name || t("folderName")}</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-2 pt-1">
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={onClose} disabled={loading} className="flex-1">
                                {t("cancel")}
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={loading} className="flex-1">
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
                </div>
            </div>
        </>
    );
}