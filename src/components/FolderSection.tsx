"use client";

import { ChevronRight, Pencil } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { SortableItem } from "./SortableItem";
import { FolderCard } from "./FolderCard";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Folder, Item } from "@/types";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";

interface FolderSectionProps {
  folder: Folder | null;
  items: Item[];
  /** Pre-computed folder total from the server (signed, Decimal-accurate) */
  total: number;
  month: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onPay: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onUnpay: (item: Item) => void;
  onAmountSaved: (item: Item) => void;
  onEditFolder?: (folder: Folder) => void;
  dragHandleListeners?: DraggableSyntheticListeners;
  dragHandleAttributes?: DraggableAttributes;
  isDragging?: boolean;
}

export function FolderSection({
  folder, items, total, month, isCollapsed, onToggleCollapse,
  onPay, onEdit, onDelete, onUnpay, onAmountSaved, onEditFolder,
  dragHandleListeners, dragHandleAttributes, isDragging,
}: FolderSectionProps) {
  const { t } = useI18n();

  // If no folder and no items, nothing to show
  if (!folder && items.length === 0) return null;

  const content = (
      <div className="space-y-1.5">
          {items.map((item) => (
              <SortableItem
                  key={item.id}
                  item={item}
                  month={month}
                  onPay={onPay}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUnpay={onUnpay}
                  onAmountSaved={onAmountSaved}
              />
          ))}
      </div>
  );

  if (!folder) {
    return content;
  }

  return (
      <FolderCard
          folder={folder}
          total={total}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          onEdit={onEditFolder}
          dragHandleListeners={dragHandleListeners}
          dragHandleAttributes={dragHandleAttributes}
          isDragging={isDragging}
      >
        {content}
      </FolderCard>
  );
}
