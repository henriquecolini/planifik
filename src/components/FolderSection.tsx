"use client";

import { useState } from "react";
import { ChevronRight, Pencil } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { ItemCard } from "./ItemCard";
import type { Folder, Item } from "@/types";

interface FolderSectionProps {
  folder: Folder | null;
  items: Item[];
  /** Pre-computed folder total from the server (signed, Decimal-accurate) */
  total: number;
  month: string;
  onPay: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onUnpay: (item: Item) => void;
  onAmountSaved: (item: Item) => void;
  onEditFolder?: (folder: Folder) => void;
}

export function FolderSection({
  folder, items, total, month,
  onPay, onEdit, onDelete, onUnpay, onAmountSaved, onEditFolder,
}: FolderSectionProps) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  // Paid items sink to the bottom
  const sorted = [...items].sort((a, b) => {
    if (a.isPaid === b.isPaid) return 0;
    return a.isPaid ? 1 : -1;
  });

  if (items.length === 0) return null;

  return (
    <div className="space-y-1.5">

      {/* ── Folder header ── */}
      <div
        className="flex items-center gap-2 px-1 py-1 cursor-pointer group/folder select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        {folder ? (
          <>
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] flex-shrink-0 select-none"
              style={{ backgroundColor: folder.backgroundColor }}
            >
              {folder.icon}
            </div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex-1 truncate">
              {folder.name}
            </span>
            <span className={cn("text-xs font-semibold tabular-nums", total >= 0 ? "text-income" : "text-bill")}>
              {total >= 0 ? "+" : "−"}{formatCurrency(Math.abs(total))}
            </span>
            {onEditFolder && (
              <button
                onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }}
                className="opacity-0 group-hover/folder:opacity-100 w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-text-primary transition-all"
              >
                <Pencil size={11} />
              </button>
            )}
          </>
        ) : (
          <>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide flex-1">
              {t("unfiled")}
            </span>
            <span className={cn("text-xs font-semibold tabular-nums", total >= 0 ? "text-income" : "text-bill")}>
              {total >= 0 ? "+" : "−"}{formatCurrency(Math.abs(total))}
            </span>
          </>
        )}
        <ChevronRight
          size={12}
          className={cn("text-text-muted transition-transform flex-shrink-0", !collapsed && "rotate-90")}
        />
      </div>

      {/* ── Items ── */}
      {!collapsed && (
        <div className="space-y-1.5 animate-fade-in">
          {sorted.map((item) => (
            <ItemCard
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
      )}
    </div>
  );
}
