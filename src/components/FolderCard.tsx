"use client";

import { ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Folder, Item } from "@/types";
import { useSortable } from "@dnd-kit/react/sortable";
import { CollisionPriority } from "@dnd-kit/abstract";
import React from "react";
import { ColoredCurrency } from "@/components/ColoredCurrency";
import { ItemCard } from "@/components/ItemCard";
import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";

interface FolderCardProps {
  folder: Folder;
  dragIndex: number;
  items: Item[];
  month: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: (folder: Folder) => void;
  onPayItem: (item: Item) => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
  onUnpayItem: (item: Item) => void;
  onAmountSavedItem: (item: Item) => void;
}

export function FolderCard({
  folder,
  dragIndex,
  items,
  month,
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onPayItem,
  onEditItem,
  onDeleteItem,
  onUnpayItem,
  onAmountSavedItem,
}: FolderCardProps) {
  const { ref, isDragging } = useSortable({
    id: folder.id,
    index: dragIndex,
    type: "folder",
    collisionPriority: CollisionPriority.Low,
    accept: ["folder", "item"],
    modifiers: [RestrictToVerticalAxis],
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
        {/* Chevron */}
        <ChevronDown
          size={14}
          className={cn(
            "text-text-muted transition-transform flex-shrink-0",
            isCollapsed && "-rotate-90",
          )}
        />

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
        <span className="px-1 py-0.5">
          <ColoredCurrency value={folder.totalAmount ?? 0} />
        </span>

        {/* Edit button */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(folder);
            }}
            className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-elevated transition-all flex-shrink-0"
          >
            <Pencil size={11} />
          </button>
        )}
      </div>

      {/* ── Items ── */}
      {!isCollapsed && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-border-subtle pt-2.5">
          {items.map((item, index) => (
            <ItemCard
              key={item.id}
              item={item}
              month={month}
              dragIndex={index}
              dragGroupId={folder.id}
              onPay={onPayItem}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onUnpay={onUnpayItem}
              onAmountSaved={onAmountSavedItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
