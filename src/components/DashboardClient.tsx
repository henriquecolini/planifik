"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DashboardClient — top-level interactive shell for the dashboard
//
// Responsibilities:
//   - Auth guard (redirects to /login if unauthenticated)
//   - Group & month state
//   - Data fetching (groups → folders → items)
//   - All modal open/close state
//   - Optimistic UI updates after mutations
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { TopBar } from "./TopBar";
import { MonthSelector } from "./MonthSelector";
import { BalanceCounter } from "./BalanceCounter";
import AddItemModal from "./modals/AddItemModal";
import { PayItemModal } from "./modals/PayItemModal";
import { UnpayModal } from "./modals/UnpayModal";
import { DeleteConfirmModal } from "./modals/DeleteConfirmModal";
import { FolderModal } from "./modals/FolderModal";
import { GroupModal } from "./modals/GroupModal";

import { currentMonth, formatMonth, toMonthString } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { DeleteMode, Folder, Group, Item, ItemsApiResponse, PaymentMethod } from "@/types";
import { FolderCard } from "@/components/FolderCard";
import { ItemCard } from "@/components/ItemCard";

export function DashboardClient() {
  const { status } = useSession();
  const router = useRouter();
  const { t, lang } = useI18n();

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // ── Core state ─────────────────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [folderTotals, setFolderTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // ── Drag & Drop state ──────────────────────────────────────────────────────
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"folder" | "item" | null>(null);

  // Set of folder IDs that are collapsed
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());

  const toggleFolderCollapse = useCallback((id: string) => {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [payItem, setPayItem] = useState<Item | null>(null);
  const [unpayItem, setUnpayItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editFolder, setEditFolder] = useState<Folder | null>(null);
  const [groupModal, setGroupModal] = useState<"create" | "manage" | null>(null);

  // ── Bootstrap: fetch groups, auto-create Personal if first sign-in ─────────
  useEffect(() => {
    if (status !== "authenticated") return;

    const init = async () => {
      let data: Group[] = await fetch("/api/groups").then((r) => r.json());
      if (!Array.isArray(data) || data.length === 0) {
        const created = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Personal" }),
        }).then((r) => r.json());
        data = [created];
      }
      setGroups(data);
      setActiveGroup(data[0]);
    };

    init();
  }, [status]);

  // ── Fetch folders when active group changes ────────────────────────────────
  useEffect(() => {
    if (!activeGroup) return;
    fetch(`/api/folders?groupId=${activeGroup.id}`)
      .then((r) => r.json())
      .then(setFolders);
  }, [activeGroup]);

  // ── Fetch items when group or month changes ────────────────────────────────
  const monthString = toMonthString(selectedMonth);

  const fetchItems = useCallback(
    async (silent = false) => {
      if (!activeGroup) return;
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/groups/${activeGroup.id}/items?month=${monthString}`);
        const data: ItemsApiResponse = await res.json();
        setItems(data.items);
        setMonthTotal(data.monthTotal);
        setFolderTotals(data.folderTotals);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [activeGroup, monthString],
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const accounts = useMemo(
    () => items.filter((i) => i.type === "CREDIT_CARD" || i.type === "CHECKING_ACCOUNT"),
    [items],
  );

  const pendingCount = useMemo(
    () => items.filter((i) => !i.isPaid && (i.type === "BILL" || i.type === "INCOME")).length,
    [items],
  );

  // Group items by folderId (null = unfiled)
  const itemsByFolder = useMemo(() => {
    const map = new Map<string | null, Item[]>();
    map.set(null, []);
    folders.forEach((f) => map.set(f.id, []));
    items.forEach((item) => {
      const key = item.folderId ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }, [items, folders]);

  // Combined sortable items: folders + their items in order (only if folder is expanded)
  const allSortableIds = useMemo(() => {
    const ids: string[] = [];
    folders.forEach((f) => {
      ids.push(f.id);
      const folderItems = itemsByFolder.get(f.id) ?? [];
      folderItems.forEach((i) => ids.push(i.id));
    });
    const unfiledItems = itemsByFolder.get(null) ?? [];
    unfiledItems.forEach((i) => ids.push(i.id));
    return ids;
  }, [folders, itemsByFolder]);

  const folderIds = useMemo(() => folders.map((f) => f.id), [folders]);
  const itemIds = useMemo(() => {
    const ids = items.map((i) => i.id);
    ids.push("unfiled");
    return ids;
  }, [items]);

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handlePay = useCallback((item: Item) => setPayItem(item), []);
  const handleEdit = useCallback((item: Item) => setEditItem(item), []);
  const handleDelete = useCallback((item: Item) => setDeleteItem(item), []);

  const handleUnpay = useCallback(
    async (item: Item) => {
      const paymentAccountItem = (item as any).event?.paymentAccountItem;
      if (paymentAccountItem) {
        setUnpayItem(item);
      } else {
        await fetch(`/api/items/${item.id}/pay?month=${monthString}&rollback=false`, {
          method: "DELETE",
        });
        await fetchItems(true);
      }
    },
    [monthString, fetchItems],
  );

  const handleUnpayConfirm = useCallback(
    async (rollback: boolean) => {
      if (!unpayItem) return;
      await fetch(`/api/items/${unpayItem.id}/pay?month=${monthString}&rollback=${rollback}`, {
        method: "DELETE",
      });
      setUnpayItem(null);
      await fetchItems(true);
    },
    [unpayItem, monthString, fetchItems],
  );

  const handleAmountSaved = useCallback(
    (updatedItem: Item) => {
      // Update the item locally; refetch to get accurate server-side totals
      setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
      fetchItems(true);
    },
    [fetchItems],
  );

  const handlePayConfirm = useCallback(
    async (method: PaymentMethod | null, paymentItemId: string | null) => {
      if (!payItem) return;
      await fetch(`/api/items/${payItem.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: monthString,
          paymentMethod: method,
          paymentItemId,
        }),
      });
      setPayItem(null);
      await fetchItems(true);
    },
    [payItem, monthString, fetchItems],
  );

  const handleDeleteConfirm = useCallback(
    async (mode: DeleteMode) => {
      if (!deleteItem) return;
      const params = new URLSearchParams({ mode });
      if (mode !== "all") params.set("month", monthString);
      await fetch(`/api/items/${deleteItem.id}?${params}`, { method: "DELETE" });
      setDeleteItem(null);
      await fetchItems(true);
    },
    [deleteItem, monthString, fetchItems],
  );

  const handleItemCreated = useCallback(() => fetchItems(true), [fetchItems]);

  const handleItemUpdated = useCallback(
    (item: Item) => {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...item } : i)));
      fetchItems(true);
    },
    [fetchItems],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  //
  // const handleDragStart = (event: DragStartEvent) => {
  //   const { active } = event;
  //   const id = active.id as string;
  //   setActiveId(id);
  //   const type = active.data.current?.type as "folder" | "item";
  //   setActiveType(type);
  //
  //   if (type === "folder") {
  //     setDragStartFolders(folders);
  //     // Automatically collapse the folder being dragged
  //     setCollapsedFolderIds((prev) => new Set(prev).add(id));
  //   }
  // };
  //
  // const handleDragOver = (event: DragOverEvent) => {
  //   const { active, over } = event;
  //   if (!over || active.id === over.id) return;
  //
  //   const overId = over.id as string;
  //   const overType = over.data.current?.type as "folder" | "item";
  //
  //   // ── Folder constraints ───────────────────────────────────────────────────
  //   if (activeType === "folder") {
  //     // Folders can only be dragged over other folders.
  //     // We ignore items and "unfiled"
  //     if (overType !== "folder" || overId === "unfiled") return;
  //
  //     setFolders((prev) => {
  //       const oldIndex = prev.findIndex((f) => f.id === active.id);
  //       const newIndex = prev.findIndex((f) => f.id === overId);
  //       if (oldIndex === -1 || newIndex === -1) return prev;
  //       return arrayMove(prev, oldIndex, newIndex);
  //     });
  //     return;
  //   }
  //
  //   // ── Item constraints ─────────────────────────────────────────────────────
  //   if (activeType === "item") {
  //     setItems((prev) => {
  //       const activeIndex = prev.findIndex((i) => i.id === active.id);
  //       if (activeIndex === -1) return prev;
  //
  //       const activeItem = prev[activeIndex];
  //       let newFolderId = activeItem.folderId;
  //       let overIndex = -1;
  //
  //       if (overType === "folder") {
  //         // If hovering over a folder header, check if it's open
  //         if (overId !== "unfiled" && collapsedFolderIds.has(overId)) {
  //           // Nothing happens when an item is placed in front of a closed folder
  //           return prev;
  //         }
  //         newFolderId = overId === "unfiled" ? null : overId;
  //       } else {
  //         overIndex = prev.findIndex((i) => i.id === overId);
  //         if (overIndex !== -1) newFolderId = prev[overIndex].folderId;
  //       }
  //
  //       // If nothing changed in terms of position or folderId, return
  //       if (activeIndex === overIndex && newFolderId === activeItem.folderId) return prev;
  //
  //       let newItems: Item[];
  //       if (overType === "item" && overIndex !== -1) {
  //         newItems = arrayMove(prev, activeIndex, overIndex);
  //       } else if (overType === "folder") {
  //         const item = { ...activeItem, folderId: newFolderId };
  //         const temp = [...prev];
  //         temp.splice(activeIndex, 1);
  //         // Find the last item in the target folder to place this item after it
  //         const lastInFolderIndex = [...temp]
  //           .reverse()
  //           .findIndex((i) => i.folderId === newFolderId);
  //         const targetIndex = lastInFolderIndex !== -1 ? temp.length - lastInFolderIndex : 0;
  //         temp.splice(targetIndex, 0, item);
  //         newItems = temp;
  //       } else {
  //         return prev;
  //       }
  //
  //       return newItems.map((i) => (i.id === active.id ? { ...i, folderId: newFolderId } : i));
  //     });
  //   }
  // };
  //
  // const handleDragEnd = async (event: DragEndEvent) => {
  //   const { active, over } = event;
  //   setActiveId(null);
  //   setActiveType(null);
  //   if (!over) {
  //     // If dropped outside, we might need to refetch to ensure UI matches server (since we did optimistic updates in DragOver)
  //     await fetchItems(true);
  //     return;
  //   }
  //
  //   if (activeType === "folder") {
  //     // Persist folder order
  //     await fetch("/api/folders/reorder", {
  //       method: "PATCH",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ folderIds: folders.map((f) => f.id) }),
  //     });
  //     await fetchItems(true);
  //   } else if (activeType === "item") {
  //     const activeId = active.id as string;
  //     const activeItem = items.find((i) => i.id === activeId);
  //     if (!activeItem) return;
  //
  //     const folderId = activeItem.folderId;
  //     const itemIds = items.filter((i) => i.folderId === folderId).map((i) => i.id);
  //
  //     fetch("/api/items/reorder", {
  //       method: "PATCH",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ itemId: activeId, folderId, itemIds }),
  //     }).then(() => fetchItems(true));
  //   }
  // };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-base">
      <div className="sticky top-0 z-20">
        <TopBar
          groups={groups}
          activeGroup={activeGroup}
          onGroupChange={setActiveGroup}
          onCreateGroup={() => setGroupModal("create")}
          onManageGroup={() => setGroupModal("manage")}
        />

        <div className="bg-base/80 backdrop-blur-sm top-14 z-20">
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-32">
        {/* Balance — total comes from server, no frontend arithmetic */}
        <BalanceCounter total={monthTotal} pendingCount={pendingCount} />

        {loading ? (
          <>
            {/* Loading */}
            <div className="flex items-center justify-center py-20">
              <Loader2 size={20} className="animate-spin text-text-muted" />
            </div>
          </>
        ) : items.length === 0 && folders.length === 0 ? (
          <>
            {/* Empty state */}
            <div className="text-center py-20">
              <div className="text-5xl mb-4 select-none">💸</div>
              <p className="text-text-secondary font-medium">
                {t("noItemsForMonth")} {formatMonth(selectedMonth, lang)}
              </p>
              <p className="text-text-muted text-sm mt-1">{t("tapToAdd")}</p>
            </div>
          </>
        ) : (
          <>
            {/* Item list, organized by folder */}
            <div className="flex flex-col gap-2">
              {folders.map((folder, folderIndex) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  index={folderIndex}
                  total={folderTotals[folder.id] ?? 0}
                  isCollapsed={collapsedFolderIds.has(folder.id)}
                  onToggleCollapse={() => toggleFolderCollapse(folder.id)}
                >
                  {itemsByFolder.get(folder.id)?.map((item, itemIndex) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      month={monthString}
                      index={itemIndex}
                      onPay={handlePay}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onUnpay={handleUnpay}
                      onAmountSaved={handleAmountSaved}
                    />
                  ))}
                </FolderCard>
              ))}

              {/* Unfiled items */}
              <div className="flex flex-col gap-2 mt-2">
                {itemsByFolder.get(null)?.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    month={monthString}
                    index={index}
                    onPay={handlePay}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUnpay={handleUnpay}
                    onAmountSaved={handleAmountSaved}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating add button */}
      <div className="fixed bottom-8 z-30 w-full flex justify-center gap-4">
        <button
          onClick={() => {
            setEditFolder(null);
            setFolderModalOpen(true);
          }}
          className="flex items-center gap-2 bg-base hover:bg-elevated border-border-default border text-sm font-semibold pl-4 pr-5 h-12 rounded-full transition-all duration-150 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} />
          {t("addFolder")}
        </button>
        <button
          onClick={() => {
            setEditItem(null);
            setAddItemOpen(true);
          }}
          className="flex items-center gap-2 bg-accent hover:bg-accent-light text-white text-sm font-semibold pl-4 pr-5 h-12 rounded-full transition-all duration-150 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} />
          {t("addItem")}
        </button>
      </div>

      {/* Modals */}

      <AddItemModal
        open={addItemOpen || !!editItem}
        onClose={() => {
          setAddItemOpen(false);
          setEditItem(null);
        }}
        groupId={activeGroup?.id ?? ""}
        folders={folders}
        defaultMonth={monthString}
        editItem={editItem}
        onCreated={handleItemCreated}
        onUpdated={handleItemUpdated}
      />

      <PayItemModal
        open={!!payItem}
        onClose={() => setPayItem(null)}
        item={payItem}
        month={monthString}
        accounts={accounts}
        onConfirm={handlePayConfirm}
      />

      <DeleteConfirmModal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        item={deleteItem}
        month={monthString}
        onConfirm={handleDeleteConfirm}
      />

      <UnpayModal
        open={!!unpayItem}
        onClose={() => setUnpayItem(null)}
        item={unpayItem}
        onConfirm={handleUnpayConfirm}
      />

      <FolderModal
        open={folderModalOpen}
        onClose={() => {
          setFolderModalOpen(false);
          setEditFolder(null);
        }}
        groupId={activeGroup?.id ?? ""}
        editFolder={editFolder}
        onCreated={(f) => setFolders((prev) => [...prev, f])}
        onUpdated={(f) => {
          setFolders((prev) => prev.map((x) => (x.id === f.id ? f : x)));
          fetchItems();
        }}
        onDeleted={(id) => {
          setFolders((prev) => prev.filter((x) => x.id !== id));
          fetchItems();
        }}
      />

      <GroupModal
        open={groupModal !== null}
        onClose={() => setGroupModal(null)}
        mode={groupModal ?? "create"}
        activeGroup={activeGroup}
        onCreated={(g) => {
          setGroups((prev) => [...prev, g]);
          setActiveGroup(g);
        }}
        onGroupUpdated={(g) => {
          setGroups((prev) => prev.map((x) => (x.id === g.id ? g : x)));
          setActiveGroup(g);
        }}
      />
    </div>
  );
}
