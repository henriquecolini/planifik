"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FolderSection } from "./FolderSection";
import type { Folder, Item } from "@/types";

interface SortableFolderProps {
  folder: Folder | null;
  items: Item[];
  total: number;
  month: string;
  activeType: "folder" | "item" | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onPay: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onUnpay: (item: Item) => void;
  onAmountSaved: (item: Item) => void;
  onEditFolder?: (folder: Folder) => void;
}

export function SortableFolder(props: SortableFolderProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.folder?.id ?? "unfiled",
    // Folders are ALWAYS disabled for sorting IF an item is being dragged.
    // This ensures items CANNOT displace folders.
    disabled: !props.folder || props.activeType === "item",
    data: {
      type: "folder",
      folder: props.folder,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FolderSection
        {...props}
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}
