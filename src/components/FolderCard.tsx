"use client";

import { ChevronDown, GripVertical, Pencil } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Folder } from "@/types";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";

interface FolderCardProps {
  folder: Folder;
  total: number;
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  /** dnd-kit drag handle listeners — spread onto the drag handle element */
  dragHandleListeners?: DraggableSyntheticListeners;
  dragHandleAttributes?: DraggableAttributes;
  isDragging?: boolean;
  onEdit?: (folder: Folder) => void;
}

export function FolderCard({
  folder,
  total,
  children,
  isCollapsed,
  onToggleCollapse,
  dragHandleListeners,
  dragHandleAttributes,
  isDragging,
  onEdit,
}: FolderCardProps) {
  const { t } = useI18n();

  // Auto-collapse when dragging
  const showItems = !isCollapsed && !isDragging;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white transition-all duration-150",
        isDragging
          ? "border-accent shadow-lg opacity-80 ring-1 ring-accent/30"
          : "border-border-default shadow-sm",
      )}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none group/header rounded-2xl"
        onClick={onToggleCollapse}
      >
        {/* Drag handle */}
        <div
          {...dragHandleListeners}
          {...dragHandleAttributes}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded"
        >
          <GripVertical size={14} />
        </div>

        {/* Folder icon */}
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0 select-none"
          style={{ backgroundColor: folder.backgroundColor }}
        >
          {folder.icon}
        </div>

        {/* Name */}
        <span className="flex-1 text-sm font-semibold text-text-primary truncate">
          {folder.name}
        </span>

        {/* Total */}
        <span
          className={cn(
            "text-sm font-semibold tabular-nums flex-shrink-0",
            total >= 0 ? "text-income" : "text-bill",
          )}
        >
          {total >= 0 ? "+" : "−"}
          {formatCurrency(Math.abs(total))}
        </span>

        {/* Edit button */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(folder);
            }}
            className="opacity-0 group-hover/header:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-elevated transition-all flex-shrink-0"
          >
            <Pencil size={11} />
          </button>
        )}

        {/* Chevron */}
        <ChevronDown
          size={14}
          className={cn(
            "text-text-muted transition-transform flex-shrink-0",
            !showItems && "-rotate-90",
          )}
        />
      </div>

      {/* ── Items ── */}
      {showItems && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-border-subtle pt-2.5">{children}</div>
      )}
    </div>
  );
}

// ── Drag overlay version (rendered while dragging) ────────────────────────────
export function FolderCardOverlay({ folder, total }: { folder: Folder; total: number }) {
  return (
    <div className="rounded-2xl border border-accent bg-white shadow-xl ring-1 ring-accent/30 opacity-90">
      <div className="flex items-center gap-2 px-3 py-2.5 select-none">
        <GripVertical size={14} className="text-text-muted flex-shrink-0" />
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0 select-none"
          style={{ backgroundColor: folder.backgroundColor }}
        >
          {folder.icon}
        </div>
        <span className="flex-1 text-sm font-semibold text-text-primary truncate">
          {folder.name}
        </span>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            total >= 0 ? "text-income" : "text-bill",
          )}
        >
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
