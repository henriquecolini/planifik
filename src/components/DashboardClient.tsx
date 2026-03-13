"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MdAdd, MdCreateNewFolder, MdRefresh } from "react-icons/md";
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
import { ItemBin } from "@/components/ItemBin";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { isSortable } from "@dnd-kit/react/sortable";

export function DashboardClient() {
  const { status } = useSession();
  const router = useRouter();
  const { t, lang } = useI18n();

  // ── Core state ─────────────────────────────────────────────────────────────

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  const [groups, setGroups] = useState<Group[]>([]);
  const [folders, setFolders] = useState<Record<string, Folder>>({});
  const [folderObjs, setFolderObjs] = useState<Folder[]>([]);
  const [folderIds, setFolderIds] = useState<string[]>([]);
  const [items, setItems] = useState<Record<string, Item[]>>({});
  const [monthTotal, setMonthTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());

  // ── Modal state ────────────────────────────────────────────────────────────

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [itemToPay, setItemToPay] = useState<Item | null>(null);
  const [itemToUnpay, setItemToUnpay] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);

  const [groupModal, setGroupModal] = useState<"create" | "manage" | null>(null);

  const monthString = toMonthString(selectedMonth);

  // ── Derived data ───────────────────────────────────────────────────────────

  const allItems = useMemo(() => Object.entries(items).flatMap(([_, items]) => items), [items]);

  const accounts = useMemo(
    () => allItems.filter((i) => i.type === "CREDIT_CARD" || i.type === "CHECKING_ACCOUNT"),
    [allItems],
  );

  const pendingCount = useMemo(
    () => allItems.filter((i) => !i.isPaid && (i.type === "BILL" || i.type === "INCOME")).length,
    [allItems],
  );

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchItems = useCallback(
    async (silent = false) => {
      if (!selectedGroup) return;

      if (!silent) setLoading(true);

      try {
        const res = await fetch(`/api/groups/${selectedGroup.id}/items?month=${monthString}`);
        const data: ItemsApiResponse = await res.json();
        let newFolderKeys: string[] = [];
        let newFolders: Record<string, Folder> = {};
        let newItems: Record<string, Item[]> = {};
        for (const folder of data.folders) {
          newFolderKeys.push(folder.id);
          newFolders[folder.id] = folder;
          newItems[folder.id] = folder.items ?? [];
        }
        newItems["__unfiled__"] = data.unfiled;
        setFolderIds(newFolderKeys);
        setFolderObjs(data.folders);
        setFolders(newFolders);
        setItems(newItems);
        setMonthTotal(data.monthTotal);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedGroup, monthString],
  );

  // ── UI helpers ─────────────────────────────────────────────────────────────

  const toggleFolderCollapse = useCallback((id: string) => {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Item actions ───────────────────────────────────────────────────────────

  const handlePay = useCallback((item: Item) => setItemToPay(item), []);
  const handleEdit = useCallback((item: Item) => setItemToEdit(item), []);
  const handleDelete = useCallback((item: Item) => setItemToDelete(item), []);

  const handleAmountSaved = useCallback(() => fetchItems(true), [fetchItems]);
  const handleItemCreated = useCallback(() => fetchItems(true), [fetchItems]);
  const handleItemUpdated = useCallback(() => fetchItems(true), [fetchItems]);

  const handlePayConfirm = useCallback(
    async (method: PaymentMethod | null, paymentItemId: string | null) => {
      if (!itemToPay) return;

      await fetch(`/api/items/${itemToPay.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: monthString, paymentMethod: method, paymentItemId }),
      });

      setItemToPay(null);
      await fetchItems(true);
    },
    [itemToPay, monthString, fetchItems],
  );

  const handleUnpay = useCallback(
    async (item: Item) => {
      const paymentAccountItem = (item as any).event?.paymentAccountItem;

      if (paymentAccountItem) {
        setItemToUnpay(item);
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
      if (!itemToUnpay) return;

      await fetch(`/api/items/${itemToUnpay.id}/pay?month=${monthString}&rollback=${rollback}`, {
        method: "DELETE",
      });

      setItemToUnpay(null);
      await fetchItems(true);
    },
    [itemToUnpay, monthString, fetchItems],
  );

  const handleDeleteConfirm = useCallback(
    async (mode: DeleteMode) => {
      if (!itemToDelete) return;

      const params = new URLSearchParams({ mode });
      if (mode !== "all") params.set("month", monthString);

      await fetch(`/api/items/${itemToDelete.id}?${params}`, { method: "DELETE" });

      setItemToDelete(null);
      await fetchItems(true);
    },
    [itemToDelete, monthString, fetchItems],
  );

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

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
      setSelectedGroup(data[0]);
    };

    init();
  }, [status]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── Auth loading ───────────────────────────────────────────────────────────

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <MdRefresh size={24} className="animate-spin text-text-muted" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-base">
      <div className="sticky top-0 z-20">
        <TopBar
          groups={groups}
          activeGroup={selectedGroup}
          onGroupChange={setSelectedGroup}
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
              <MdRefresh size={20} className="animate-spin text-text-muted" />
            </div>
          </>
        ) : items["__unfiled__"].length === 0 && folderIds.length === 0 ? (
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
          <DragDropProvider
            onDragOver={(event) => {
              const { source, target } = event.operation;
              if (source?.type === "folder") {
                setFolderIds((ids) => move(ids, event));
              } else if (source?.type === "item") {
                if (target?.type === "folder" && collapsedFolderIds.has(String(target.id))) {
                  toggleFolderCollapse(String(target.id));
                }
                setItems((items) => move(items, event));
              }
            }}
            onDragEnd={async (event) => {
              const { source, target } = event.operation;

              if (source?.type === "folder") {
                const newFolderIds = move(folderIds, event);
                setFolderIds(newFolderIds);
                await fetch("/api/folders/reorder", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ folderIds: newFolderIds }),
                });
              } else if (source?.type === "item") {
                const newItems = move(items, event);
                setItems(newItems);

                const itemId = String(source.id);
                const targetGroup = isSortable(target) ? target.group : undefined;
                const targetFolderId = String(targetGroup ?? target?.id ?? "__unfiled__");
                const itemIds = newItems[targetFolderId]?.map((i: Item) => i.id) ?? [];

                await fetch("/api/items/reorder", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    itemId,
                    folderId: targetFolderId === "__unfiled__" ? null : targetFolderId,
                    itemIds,
                  }),
                });
              }
            }}
          >
            {/* Item list, organized by folder */}
            <div className="flex flex-col gap-2">
              {folderIds.map((folderId, folderIndex) => (
                <FolderCard
                  key={folderId}
                  folder={folders[folderId]}
                  items={items[folderId]}
                  month={monthString}
                  dragIndex={folderIndex}
                  isCollapsed={collapsedFolderIds.has(folderId)}
                  onToggleCollapse={() => toggleFolderCollapse(folderId)}
                  onEdit={(folder) => {
                    setFolderToEdit(folder);
                    setIsFolderModalOpen(true);
                  }}
                  onPayItem={handlePay}
                  onEditItem={handleEdit}
                  onDeleteItem={handleDelete}
                  onUnpayItem={handleUnpay}
                  onAmountSavedItem={handleAmountSaved}
                />
              ))}
              {/* Unfiled items */}
              <ItemBin id={"__unfiled__"}>
                {items["__unfiled__"].map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    month={monthString}
                    dragIndex={index}
                    dragGroupId={"__unfiled__"}
                    onPay={handlePay}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUnpay={handleUnpay}
                    onAmountSaved={handleAmountSaved}
                  />
                ))}
              </ItemBin>
            </div>
          </DragDropProvider>
        )}
      </main>
      {/* Floating add button */}
      <div className="fixed bottom-8 z-30 w-full flex justify-center gap-4">
        <button
          onClick={() => {
            setFolderToEdit(null);
            setIsFolderModalOpen(true);
          }}
          className="flex items-center gap-2 bg-base hover:bg-elevated border-border-default border text-sm font-semibold pl-4 pr-5 h-12 rounded-full transition-all duration-150 active:scale-95"
        >
          <MdCreateNewFolder size={18} /> {t("addFolder")}
        </button>
        <button
          onClick={() => {
            setItemToEdit(null);
            setIsItemModalOpen(true);
          }}
          className="flex items-center gap-2 bg-accent hover:bg-accent-light text-white text-sm font-semibold pl-4 pr-5 h-12 rounded-full transition-all duration-150 active:scale-95"
        >
          <MdAdd size={18} /> {t("addItem")}
        </button>
      </div>
      {/* Modals */}
      <AddItemModal
        open={isItemModalOpen || !!itemToEdit}
        onClose={() => {
          setIsItemModalOpen(false);
          setItemToEdit(null);
        }}
        groupId={selectedGroup?.id ?? ""}
        folders={folderObjs}
        defaultMonth={monthString}
        editItem={itemToEdit}
        onCreated={handleItemCreated}
        onUpdated={handleItemUpdated}
      />
      <PayItemModal
        open={!!itemToPay}
        onClose={() => setItemToPay(null)}
        item={itemToPay}
        month={monthString}
        accounts={accounts}
        onConfirm={handlePayConfirm}
      />
      <DeleteConfirmModal
        open={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        item={itemToDelete}
        month={monthString}
        onConfirm={handleDeleteConfirm}
      />
      <UnpayModal
        open={!!itemToUnpay}
        onClose={() => setItemToUnpay(null)}
        item={itemToUnpay}
        onConfirm={handleUnpayConfirm}
      />
      <FolderModal
        open={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setFolderToEdit(null);
        }}
        groupId={selectedGroup?.id ?? ""}
        editFolder={folderToEdit}
        onCreated={(_) => fetchItems()}
        onUpdated={(_) => fetchItems()}
        onDeleted={(_) => fetchItems()}
      />
      <GroupModal
        open={groupModal !== null}
        onClose={() => setGroupModal(null)}
        mode={groupModal ?? "create"}
        activeGroup={selectedGroup}
        onCreated={(g) => {
          setGroups((prev) => [...prev, g]);
          setSelectedGroup(g);
        }}
        onGroupUpdated={(g) => {
          setGroups((prev) => prev.map((x) => (x.id === g.id ? g : x)));
          setSelectedGroup(g);
        }}
      />
    </div>
  );
}
