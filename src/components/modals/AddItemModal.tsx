"use client";

import { useEffect, useRef, useState } from "react";
import { Modal, Button, Select } from "@/components/ui/index";
import { CentsInput } from "@/components/ui/CentsInput";
import { useI18n } from "@/lib/i18n";
import { BANKS, ITEM_ICONS } from "@/types";
import { cn } from "@/lib/utils";
import type { Item, Folder, ItemType, CreateItemRequest, UpdateItemRequest } from "@/types";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  folders: Folder[];
  defaultMonth: string;
  editItem?: Item | null;
  onCreated?: (item: Item) => void;
  onUpdated?: (item: Item) => void;
}

type RecurrenceMode = "once" | "limited" | "forever";

const isAccountType = (type: ItemType) =>
  type === "CREDIT_CARD" || type === "CHECKING_ACCOUNT";

export function AddItemModal({
  open, onClose, groupId, folders, defaultMonth, editItem, onCreated, onUpdated,
}: AddItemModalProps) {
  const { t } = useI18n();
  const isEditing = !!editItem;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [title,       setTitle]       = useState("");
  const [type,        setType]        = useState<ItemType>("BILL");
  // Amount is stored in reais as a number. For checking accounts this can be negative.
  const [amountReais, setAmountReais] = useState(0);
  const [icon,        setIcon]        = useState("💡");
  const [bank,        setBank]        = useState("");
  const [folderId,    setFolderId]    = useState("");
  const [recurrence,  setRecurrence]  = useState<RecurrenceMode>("once");
  const [repeatCount, setRepeatCount] = useState("3");
  const [dueDay,      setDueDay]      = useState("");
  const [dueDayNextMonth, setDueDayNextMonth] = useState(false);

  // UI state
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Used to remount CentsInput when we need it to reset to a new initialValue
  const [amountKey, setAmountKey] = useState(0);

  const titleRef = useRef<HTMLInputElement>(null);

  // ── Populate / reset form ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (editItem) {
      setTitle(editItem.title);
      setType(editItem.type);
      setAmountReais(editItem.balance ?? 0);
      setIcon(editItem.icon);
      setBank(editItem.bank ?? "");
      setFolderId(editItem.folderId ?? "");
      setDueDay(editItem.dueDay != null ? String(editItem.dueDay) : "");
      setDueDayNextMonth(editItem.dueNextMonth || false);

      if (!editItem.endMonth) {
        setRecurrence("forever");
      } else if (editItem.startMonth === editItem.endMonth) {
        setRecurrence("once");
      } else {
        setRecurrence("limited");
        const [sy, sm] = editItem.startMonth.split("-").map(Number);
        const [ey, em] = editItem.endMonth!.split("-").map(Number);
        setRepeatCount(String((ey - sy) * 12 + (em - sm) + 1));
      }
    } else {
      setTitle(""); setType("BILL"); setAmountReais(0); setIcon("💡");
      setBank(""); setFolderId(""); setRecurrence("once");
      setRepeatCount("3"); setDueDay(""); setDueDayNextMonth(false); setError("");
    }

    setAmountKey((k) => k + 1); // remount CentsInput so it re-reads initialValue
    setIconPickerOpen(false);
    setBankPickerOpen(false);
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [open, editItem]);

  // ── Computed end month ─────────────────────────────────────────────────────
  const computedEndMonth = (() => {
    if (recurrence === "once")    return defaultMonth;
    if (recurrence === "forever") return null;
    const count = Math.max(parseInt(repeatCount, 10) || 1, 1);
    const [y, m] = defaultMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + count - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");

    if (!title.trim()) return setError(t("titleRequired"));

    // Checking accounts support negative; all others must be positive
    if (type !== "CHECKING_ACCOUNT" && amountReais <= 0) return setError(t("validAmount"));

    if (isAccountType(type) && !bank) return setError(t("selectBankError"));

    setLoading(true);
    try {
      const body: CreateItemRequest | UpdateItemRequest = {
        ...(isEditing ? {} : { groupId }),
        folderId:       folderId || null,
        title:          title.trim(),
        type,
        amount:         amountReais,
        icon:           isAccountType(type) ? (bank || "🏦") : icon,
        bank:           isAccountType(type) ? (bank || null) : null,
        monthlyBalance: amountReais,
        month:          defaultMonth,
        startMonth:     defaultMonth,
        endMonth:       computedEndMonth,
        dueDay:         dueDay ? parseInt(dueDay, 10) : null,
        dueNextMonth:   dueDayNextMonth,
      };

      const url    = isEditing ? `/api/items/${editItem!.id}` : "/api/items";
      const method = isEditing ? "PATCH" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");

      const result = await res.json();
      isEditing ? onUpdated?.(result) : onCreated?.(result);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  // ── Options ────────────────────────────────────────────────────────────────
  const typeOptions = [
    { value: "BILL",             label: t("typeBill") },
    { value: "INCOME",           label: t("typeIncome") },
    { value: "CREDIT_CARD",      label: t("typeCreditCard") },
    { value: "CHECKING_ACCOUNT", label: t("typeChecking") },
  ];

  const folderOptions = [
    { value: "", label: t("noFolder") },
    ...folders.map((f) => ({ value: f.id, label: `${f.icon} ${f.name}` })),
  ];

  const recurrenceOptions = [
    { value: "once",    label: t("recurrenceOnce") },
    { value: "forever", label: t("recurrenceForever") },
    { value: "limited", label: t("recurrenceLimited") },
  ];

  const amountLabel =
    type === "CREDIT_CARD"      ? t("amountOwed")     :
    type === "CHECKING_ACCOUNT" ? t("currentBalance") :
    type === "INCOME"           ? t("amountIncome")   : t("amountBill");

  const bankInfo = BANKS.find((b) => b.slug === bank);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? t("editItemTitle") : t("addItemTitle")}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t("cancel")}</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? t("saving") : isEditing ? t("save") : t("add")}
          </Button>
        </>
      }
    >
      {error && (
        <div className="bg-bill-bg border border-bill-border rounded-lg px-3 py-2 text-sm text-bill">
          {error}
        </div>
      )}

      {/* ── Title + icon/bank picker ── */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-text-secondary">{t("titleField")}</label>
        <div className="flex gap-2">

          {/* Icon / bank button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (isAccountType(type)) { setBankPickerOpen((v) => !v); setIconPickerOpen(false); }
                else                     { setIconPickerOpen((v) => !v); setBankPickerOpen(false); }
              }}
              className="w-10 h-9 flex items-center justify-center rounded-lg border border-border-default bg-white hover:bg-elevated transition-colors text-base flex-shrink-0 select-none"
              title={t("chooseIcon")}
            >
              {isAccountType(type) && bankInfo ? (
                <span
                  className="text-[9px] font-bold w-6 h-6 rounded flex items-center justify-center select-none"
                  style={{ backgroundColor: bankInfo.color, color: bankInfo.textColor ?? "#fff" }}
                >
                  {bank.slice(0, 2).toUpperCase()}
                </span>
              ) : isAccountType(type) ? "🏦" : icon}
            </button>

            {/* Emoji picker */}
            {iconPickerOpen && !isAccountType(type) && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIconPickerOpen(false)} />
                <div className="absolute top-11 left-0 z-20 bg-white border border-border-default rounded-xl shadow-lg p-2 w-52 animate-scale-in">
                  <div className="grid grid-cols-7 gap-1">
                    {ITEM_ICONS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => { setIcon(em); setIconPickerOpen(false); }}
                        className={cn(
                          "w-7 h-7 flex items-center justify-center rounded-lg text-base hover:bg-elevated transition-colors select-none",
                          icon === em && "bg-accent-dim ring-1 ring-accent",
                        )}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Bank picker */}
            {bankPickerOpen && isAccountType(type) && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBankPickerOpen(false)} />
                <div className="absolute top-11 left-0 z-20 bg-white border border-border-default rounded-xl shadow-lg p-3 w-56 animate-scale-in">
                  <p className="text-xs text-text-muted mb-2">{t("selectBank")}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BANKS.map((b) => (
                      <button
                        key={b.slug}
                        type="button"
                        onClick={() => { setBank(b.slug); setBankPickerOpen(false); }}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs text-left transition-all",
                          bank === b.slug
                            ? "border-accent bg-accent-dim text-accent"
                            : "border-border-subtle hover:border-border-default",
                        )}
                      >
                        <div
                          className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[8px] font-bold select-none"
                          style={{ backgroundColor: b.color, color: b.textColor ?? "#fff" }}
                        >
                          {b.slug.slice(0, 2).toUpperCase()}
                        </div>
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Title input */}
          <input
            ref={titleRef}
            type="text"
            placeholder={isAccountType(type) ? t("titlePlaceholderAcc") : t("titlePlaceholderBill")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            className="flex-1 bg-white border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
          />
        </div>
      </div>

      {/* ── Type ── */}
      <Select
        label={t("typeField")}
        value={type}
        onChange={(e) => { setType(e.target.value as ItemType); setBank(""); setAmountKey((k) => k + 1); }}
        options={typeOptions}
      />

      {/* ── Amount (CentsInput) ── */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-text-secondary">{amountLabel}</label>
        {type === "CHECKING_ACCOUNT" && (
          <p className="text-[11px] text-text-muted">{t("negativeHint")}</p>
        )}
        <div className="flex items-center bg-white border border-border-default rounded-lg overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-colors">
          <CentsInput
            key={amountKey}
            initialValue={amountReais}
            onChange={setAmountReais}
            allowNegative={type === "CHECKING_ACCOUNT"}
            className="flex-1 text-sm text-text-primary px-3 py-2 text-left"
          />
        </div>
      </div>

      {/* ── Folder ── */}
      {folders.length > 0 && (
        <Select
          label={t("folderField")}
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          options={folderOptions}
        />
      )}

      {/* ── Recurrence ── */}
      <Select
        label={t("recurrenceField")}
        value={recurrence}
        onChange={(e) => setRecurrence(e.target.value as RecurrenceMode)}
        options={recurrenceOptions}
      />

      {recurrence === "limited" && (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-text-secondary">{t("numberOfMonths")}</label>
          <input
            type="number"
            min={2}
            max={120}
            value={repeatCount}
            onChange={(e) => setRepeatCount(e.target.value)}
            className="w-full bg-white border border-border-default rounded-lg text-sm text-text-primary px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
          />
          {computedEndMonth && (
            <p className="text-xs text-text-muted">{t("until")} {computedEndMonth}</p>
          )}
        </div>
      )}

      {/* ── Due day (recurring only) ── */}
      {recurrence !== "once" && (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-text-secondary">{t("dueDayField")}</label>
          <input
            type="number"
            min={1}
            max={31}
            placeholder={t("dueDayPlaceholder")}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="w-full bg-white border border-border-default rounded-lg text-sm text-text-primary px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
          />
          {dueDay && (
            <label className="flex items-center gap-2 cursor-pointer mt-1.5">
              <input
                type="checkbox"
                checked={dueDayNextMonth}
                onChange={(e) => setDueDayNextMonth(e.target.checked)}
                className="rounded border-border-default accent-accent w-4 h-4"
              />
              <span className="text-xs text-text-secondary">{t("dueDayNextMonth")}</span>
            </label>
          )}
        </div>
      )}
    </Modal>
  );
}
