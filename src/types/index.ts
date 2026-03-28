// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import {
  ItemTypeSchema,
  RecurrenceModeSchema,
  DeleteModeSchema,
  PaymentMethodSchema,
  CreateGroupSchema,
  CreateFolderSchema,
  UpdateFolderSchema,
  CreateItemSchema,
  UpdateItemSchema,
  PayItemRequestSchema,
  DeleteItemRequestSchema,
} from "@/lib/validations";

export type ItemType = z.infer<typeof ItemTypeSchema>;
export type RecurrenceMode = z.infer<typeof RecurrenceModeSchema>;
export type DeleteMode = z.infer<typeof DeleteModeSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

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
  totalAmount?: number;
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
  defaultAmount?: number | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  // Fields computed by the API for the queried month:
  isPaid?: boolean;
  monthAmount?: number | null; // Specific balance for this month, if any
  practicalAmount: number; // Final balance (amount ?? defaultAmount ?? 0)
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
  createdAt: string;
  paymentAccountItem?: {
    id: string;
    title: string;
    type: string;
  } | null;
}

// ─── API Response Types ────────────────────────────────────────────────────────

/** Response shape of GET /api/groups/[id]/items */
export interface ItemsApiResponse {
  folders: Folder[];
  unfiled: Item[];
  /** Net balance for the month (unpaid items only), computed with Decimal on the server */
  monthTotal: number;
}

export interface ErrorResponse {
  error: string;
}

// ─── API Request Types ─────────────────────────────────────────────────────────

export type CreateGroupRequest = z.infer<typeof CreateGroupSchema>;

export type CreateFolderRequest = z.infer<typeof CreateFolderSchema>;

export type UpdateFolderRequest = z.infer<typeof UpdateFolderSchema>;

export type CreateItemRequest = z.infer<typeof CreateItemSchema>;

export type UpdateItemRequest = z.infer<typeof UpdateItemSchema>;

export type PayItemRequest = z.infer<typeof PayItemRequestSchema>;

export type DeleteItemRequest = z.infer<typeof DeleteItemRequestSchema>;

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
  translationKey?: string;
}

export const BANKS: BankInfo[] = [
  { slug: "nubank", name: "Nubank", color: "#820ad1ff", textColor: "#fff" },
  { slug: "itau", name: "Itaú", color: "#ff6200ff", textColor: "#fff" },
  { slug: "inter", name: "Inter", color: "#ea7100ff", textColor: "#fff" },
  { slug: "caixa", name: "Caixa", color: "#ffffffff", textColor: "#fff" },
  { slug: "c6", name: "C6 Bank", color: "#000000ff", textColor: "#f5d000" },
  { slug: "bradesco", name: "Bradesco", color: "#cc092fff", textColor: "#fff" },
  { slug: "santander", name: "Santander", color: "#ea1d25ff", textColor: "#fff" },
  { slug: "btg", name: "BTG", color: "#001e61ff", textColor: "#fff" },
  { slug: "sicoob", name: "Sicoob", color: "#003641ff", textColor: "#fff" },
  { slug: "safra", name: "Safra", color: "#1e2044ff", textColor: "#fff" },
  { slug: "picpay", name: "PicPay", color: "#21c25eff", textColor: "#fff" },
  { slug: "mercadopago", name: "Mercado Pago", color: "#ffe700ff", textColor: "#fff" },
  { slug: "pagbank", name: "PagBank", color: "#ffffffff", textColor: "#000" },
  { slug: "pan", name: "Pan", color: "#00a0fdfe", textColor: "#fff" },
  { slug: "neon", name: "Neon", color: "#00a0fdfe", textColor: "#000" },
  { slug: "next", name: "Next", color: "#00ff5fff", textColor: "#000" },
  { slug: "carrefour", name: "Carrefour", color: "#ffffffff", textColor: "#fff" },
  {
    slug: "generic",
    name: "Generic",
    translationKey: "genericBank",
    color: "#e2e8f0ff",
    textColor: "#475569",
  },
];

// ─── Generic item icons ───────────────────────────────────────────────────────

export const ITEM_ICONS = [
  "🏠",
  "💡",
  "💧",
  "🔥",
  "📱",
  "🚗",
  "✈️",
  "🎬",
  "🛒",
  "🍕",
  "🏋️",
  "📚",
  "💊",
  "🐾",
  "👕",
  "🎮",
  "🎵",
  "☕",
  "🚌",
  "⛽",
  "🌐",
  "💳",
  "🏦",
  "💰",
  "📦",
  "🔧",
  "🏥",
  "📺",
  "🎓",
  "💼",
];
