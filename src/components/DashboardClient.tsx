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
import { Plus, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { TopBar }            from "./TopBar";
import { MonthSelector }     from "./MonthSelector";
import { BalanceCounter }    from "./BalanceCounter";
import { FolderSection }     from "./FolderSection";
import { AddItemModal }      from "./modals/AddItemModal";
import { PayItemModal }      from "./modals/PayItemModal";
import { DeleteConfirmModal } from "./modals/DeleteConfirmModal";
import { FolderModal }       from "./modals/FolderModal";
import { GroupModal }        from "./modals/GroupModal";

import { currentMonth, toMonthString } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Folder, Group, Item, ItemsApiResponse, DeleteMode, PaymentMethod } from "@/types";

export function DashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // ── Core state ─────────────────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [groups,        setGroups]        = useState<Group[]>([]);
  const [activeGroup,   setActiveGroup]   = useState<Group | null>(null);
  const [folders,       setFolders]       = useState<Folder[]>([]);
  const [items,         setItems]         = useState<Item[]>([]);
  const [monthTotal,    setMonthTotal]    = useState(0);
  const [folderTotals,  setFolderTotals]  = useState<Record<string, number>>({});
  const [loading,       setLoading]       = useState(true);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [addItemOpen,     setAddItemOpen]     = useState(false);
  const [editItem,        setEditItem]        = useState<Item | null>(null);
  const [payItem,         setPayItem]         = useState<Item | null>(null);
  const [deleteItem,      setDeleteItem]      = useState<Item | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editFolder,      setEditFolder]      = useState<Folder | null>(null);
  const [groupModal,      setGroupModal]      = useState<"create" | "manage" | null>(null);

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

  const fetchItems = useCallback(async () => {
    if (!activeGroup) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/groups/${activeGroup.id}/items?month=${monthString}`);
      const data: ItemsApiResponse = await res.json();
      setItems(data.items);
      setMonthTotal(data.monthTotal);
      setFolderTotals(data.folderTotals);
    } finally {
      setLoading(false);
    }
  }, [activeGroup, monthString]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

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

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handlePay    = useCallback((item: Item) => setPayItem(item),    []);
  const handleEdit   = useCallback((item: Item) => setEditItem(item),   []);
  const handleDelete = useCallback((item: Item) => setDeleteItem(item), []);

  const handleUnpay = useCallback(async (item: Item) => {
    await fetch(`/api/items/${item.id}/pay?month=${monthString}`, { method: "DELETE" });
    // Refetch so server recomputes totals
    fetchItems();
  }, [monthString, fetchItems]);

  const handleAmountSaved = useCallback((updatedItem: Item) => {
    // Update the item locally; refetch to get accurate server-side totals
    setItems((prev) => prev.map((i) => i.id === updatedItem.id ? updatedItem : i));
    fetchItems();
  }, [fetchItems]);

  const handlePayConfirm = useCallback(async (
    method: PaymentMethod | null,
    paymentItemId: string | null,
    deductBalance: boolean,
  ) => {
    if (!payItem) return;
    await fetch(`/api/items/${payItem.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: monthString, paymentMethod: method, paymentItemId, deductBalance }),
    });
    setPayItem(null);
    fetchItems();
  }, [payItem, monthString, fetchItems]);

  const handleDeleteConfirm = useCallback(async (mode: DeleteMode) => {
    if (!deleteItem) return;
    const params = new URLSearchParams({ mode });
    if (mode !== "all") params.set("month", monthString);
    await fetch(`/api/items/${deleteItem.id}?${params}`, { method: "DELETE" });
    setDeleteItem(null);
    fetchItems();
  }, [deleteItem, monthString, fetchItems]);

  const handleItemCreated = useCallback(() => fetchItems(), [fetchItems]);

  const handleItemUpdated = useCallback((item: Item) => {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...item } : i));
    fetchItems();
  }, [fetchItems]);

  // ── Loading / auth states ──────────────────────────────────────────────────

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

      <TopBar
        groups={groups}
        activeGroup={activeGroup}
        onGroupChange={setActiveGroup}
        onOpenFolders={() => { setEditFolder(null); setFolderModalOpen(true); }}
        onCreateGroup={() => setGroupModal("create")}
        onManageGroup={() => setGroupModal("manage")}
      />

      <div className="bg-base/80 backdrop-blur-sm sticky top-14 z-20">
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-32">

        {/* Balance — total comes from server, no frontend arithmetic */}
        <BalanceCounter total={monthTotal} pendingCount={pendingCount} />

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 select-none">💸</div>
            <p className="text-text-secondary font-medium">{t("noItemsForMonth")} {monthString}</p>
            <p className="text-text-muted text-sm mt-1">{t("tapToAdd")}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-text-muted" />
          </div>
        )}

        {/* Item list, organized by folder */}
        {!loading && items.length > 0 && (
          <div className="space-y-5 mt-1">
            {folders.map((folder) => (
              <FolderSection
                key={folder.id}
                folder={folder}
                items={itemsByFolder.get(folder.id) ?? []}
                total={folderTotals[folder.id] ?? 0}
                month={monthString}
                onPay={handlePay}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUnpay={handleUnpay}
                onAmountSaved={handleAmountSaved}
                onEditFolder={(f) => { setEditFolder(f); setFolderModalOpen(true); }}
              />
            ))}

            {/* Unfiled items */}
            {(itemsByFolder.get(null)?.length ?? 0) > 0 && (
              <FolderSection
                folder={null}
                items={itemsByFolder.get(null) ?? []}
                total={folderTotals["__unfiled__"] ?? 0}
                month={monthString}
                onPay={handlePay}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUnpay={handleUnpay}
                onAmountSaved={handleAmountSaved}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating add button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => { setEditItem(null); setAddItemOpen(true); }}
          className="flex items-center gap-2 bg-accent hover:bg-accent-light text-white text-sm font-semibold pl-4 pr-5 h-12 rounded-2xl shadow-lg shadow-accent/30 transition-all duration-150 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} />
          {t("addItem")}
        </button>
      </div>

      {/* Modals */}

      <AddItemModal
        open={addItemOpen || !!editItem}
        onClose={() => { setAddItemOpen(false); setEditItem(null); }}
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

      <FolderModal
        open={folderModalOpen}
        onClose={() => { setFolderModalOpen(false); setEditFolder(null); }}
        groupId={activeGroup?.id ?? ""}
        folders={folders}
        editFolder={editFolder}
        onCreated={(f) => setFolders((prev) => [...prev, f])}
        onUpdated={(f) => setFolders((prev) => prev.map((x) => x.id === f.id ? f : x))}
        onDeleted={(id) => { setFolders((prev) => prev.filter((x) => x.id !== id)); fetchItems(); }}
      />

      <GroupModal
        open={groupModal !== null}
        onClose={() => setGroupModal(null)}
        mode={groupModal ?? "create"}
        activeGroup={activeGroup}
        onCreated={(g) => { setGroups((prev) => [...prev, g]); setActiveGroup(g); }}
        onGroupUpdated={(g) => {
          setGroups((prev) => prev.map((x) => x.id === g.id ? g : x));
          setActiveGroup(g);
        }}
      />
    </div>
  );
}
