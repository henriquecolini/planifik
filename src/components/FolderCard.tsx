"use client";

import { ChevronDown, Pencil } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Folder } from "@/types";
import { useSortable } from "@dnd-kit/react/sortable";
import { CollisionPriority } from "@dnd-kit/abstract";

interface FolderCardProps {
  folder: Folder;
  index: number;
  total: number;
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDragging?: boolean;
  onEdit?: (folder: Folder) => void;
}

export function FolderCard({
  folder,
  index,
  total,
  children,
  isCollapsed,
  onToggleCollapse,
  onEdit,
}: FolderCardProps) {
  const { ref, isDragging } = useSortable({
    id: folder.id,
    index: index,
    type: "folder",
    collisionPriority: CollisionPriority.Low,
    accept: ["item"],
  });

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border bg-white",
        isDragging
          ? "border-accent shadow-lg opacity-80 ring-1 ring-accent/30"
          : "border-border-default hover:shadow-sm",
      )}
      style={{ backgroundColor: folder.backgroundColor.split(",")[0] }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none group/header"
        onClick={onToggleCollapse}
      >
        {/* Name */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          {folder.backgroundColor.split(",")[1] && (
            <div
              className="w-8 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: folder.backgroundColor.split(",")[1] }}
            />
          )}
          <span className="text-sm font-semibold text-text-primary truncate">{folder.name}</span>
        </div>

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
            isCollapsed && "-rotate-90",
          )}
        />
      </div>

      {/* ── Items ── */}
      {!isCollapsed && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-border-subtle pt-2.5">
          {children}
        </div>
      )}
    </div>
  );
}
