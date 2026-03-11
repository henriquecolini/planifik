// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

export type ItemType = "BILL" | "INCOME" | "CREDIT_CARD" | "CHECKING_ACCOUNT";

export type RecurrenceMode = "once" | "limited" | "forever";

export type DeleteMode = "this" | "following" | "all";

export type PaymentMethod = "credit_card" | "checking_account" | "cash";

// ─── Database Models (as returned from API) ────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface Group {
  id: string;
  name: string;
  createdAt: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  userId: string;
  role: "owner" | "member";
  user?: User;
}

export interface Folder {
  id: string;
  groupId: string;
  name: string;
  icon: string;
  backgroundColor: string;
  position: number;
  items?: Item[];
}

export interface Item {
  id: string;
  groupId: string;
  folderId: string | null;
  userId: string;
  title: string;
  type: ItemType;
  icon: string;
  bank: string | null;
  startMonth: string;
  endMonth: string | null;
  dueDay: number | null;
  dueNextMonth: boolean;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  // Fields computed by the API for the queried month:
  isPaid?: boolean;
  balance: number; // This month's balance (signed; checking accounts can be negative)
  event?: ItemEvent | null;
  folder?: Folder | null;
}

export interface ItemBalance {
  id: string;
  itemId: string;
  month: string;
  amount: number;
}

export interface ItemEvent {
  id: string;
  itemId: string;
  userId: string;
  month: string;
  actionType: string;
  paymentMethod: string | null;
  paymentItemId: string | null;
  balanceDeducted: boolean;
  createdAt: string;
}

// ─── API Response Types ────────────────────────────────────────────────────────

/** Response shape of GET /api/groups/[id]/items */
export interface ItemsApiResponse {
  items: Item[];
  /** Net balance for the month (unpaid items only), computed with Decimal on the server */
  monthTotal: number;
  /** Per-folder net totals. Key "__unfiled__" holds items without a folder. */
  folderTotals: Record<string, number>;
}

// ─── API Request Types ─────────────────────────────────────────────────────────

export interface CreateGroupRequest {
  name: string;
}

export interface CreateFolderRequest {
  groupId: string;
  name: string;
  icon: string;
  backgroundColor: string;
}

export interface UpdateFolderRequest {
  name?: string;
  icon?: string;
  backgroundColor?: string;
}

export interface CreateItemRequest {
  groupId: string;
  folderId?: string | null;
  title: string;
  type: ItemType;
  amount: number;
  icon: string;
  bank?: string | null;
  monthlyBalance?: number | null;
  month?: string;
  startMonth: string;
  endMonth?: string | null;
  dueDay?: number | null;
  dueNextMonth?: boolean;
  dueDate?: string | null;
}

export interface UpdateItemRequest {
  folderId?: string | null;
  title?: string;
  icon?: string;
  bank?: string | null;
  monthlyBalance?: number | null;
  month?: string;
  startMonth?: string;
  endMonth?: string | null;
  dueDay?: number | null;
  dueNextMonth?: boolean;
  dueDate?: string | null;
}

export interface PayItemRequest {
  month: string;
  paymentMethod?: PaymentMethod;
  paymentItemId?: string;
  deductBalance?: boolean;
}

export interface DeleteItemRequest {
  mode: DeleteMode;
  month?: string;
}

// ─── UI State Types ────────────────────────────────────────────────────────────

export interface MonthSelection {
  year: number;
  month: number; // 1-indexed
}

// ─── Bank metadata ─────────────────────────────────────────────────────────────

export interface BankInfo {
  slug: string;
  name: string;
  color: string;
  textColor?: string;
}

export const BANKS: BankInfo[] = [
  { slug: "nubank",    name: "Nubank",    color: "#8A05BE", textColor: "#fff" },
  { slug: "itau",      name: "Itaú",      color: "#FF6600", textColor: "#fff" },
  { slug: "inter",     name: "Inter",     color: "#FF7A00", textColor: "#fff" },
  { slug: "caixa",     name: "Caixa",     color: "#005CA9", textColor: "#fff" },
  { slug: "c6",        name: "C6 Bank",   color: "#242424", textColor: "#f5d000" },
  { slug: "bradesco",  name: "Bradesco",  color: "#CC092F", textColor: "#fff" },
  { slug: "santander", name: "Santander", color: "#EC0000", textColor: "#fff" },
  { slug: "btg",       name: "BTG",       color: "#003087", textColor: "#fff" },
  { slug: "sicoob",    name: "Sicoob",    color: "#00703C", textColor: "#fff" },
  { slug: "safra",     name: "Safra",     color: "#1A237E", textColor: "#fff" },
];

// ─── Generic item icons ───────────────────────────────────────────────────────

export const ITEM_ICONS = [
  "🏠", "💡", "💧", "🔥", "📱", "🚗", "✈️", "🎬",
  "🛒", "🍕", "🏋️", "📚", "💊", "🐾", "👕", "🎮",
  "🎵", "☕", "🚌", "⛽", "🌐", "💳", "🏦", "💰",
  "📦", "🔧", "🏥", "📺", "🎓", "💼",
];
