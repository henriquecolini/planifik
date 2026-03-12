"use client";

import { cn } from "@/lib/utils";
import { BANKS } from "@/types";
import { getBankLogo } from "./BankLogos";

// All icon containers use select-none so the emoji text is never selectable,
// making them feel like images to the user.

interface BankIconProps {
  bank: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const BANK_ABBREVIATIONS: Record<string, string> = {
  nubank: "Nu",
  itau: "Itaú",
  inter: "Inter",
  caixa: "CEF",
  c6: "C6",
  bradesco: "Brad",
  santander: "San",
  btg: "BTG",
  sicoob: "SCB",
  safra: "Sfr",
  picpay: "Pic",
  mercadopago: "MP",
  pagbank: "Pag",
  pan: "Pan",
  neon: "Neon",
  next: "Next",
};

const BANK_SIZE_CLASSES = {
  sm: "w-7 h-7 text-[9px]  font-bold rounded-lg",
  md: "w-9 h-9 text-[10px] font-bold rounded-xl",
  lg: "w-11 h-11 text-xs   font-bold rounded-xl",
};

export function BankIcon({ bank, size = "md", className }: BankIconProps) {
  const info = BANKS.find((b) => b.slug === bank);

  if (!info) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-elevated border border-border-default text-text-muted select-none",
          BANK_SIZE_CLASSES[size],
          className,
        )}
      >
        🏦
      </div>
    );
  }

  const logo = getBankLogo(info.slug, { className: "w-full h-full" });

  return (
    <div
      className={cn(
        "flex items-center justify-center flex-shrink-0 select-none overflow-hidden",
        BANK_SIZE_CLASSES[size],
        className,
      )}
      style={{ backgroundColor: info.color, color: info.textColor ?? "#fff" }}
    >
      {logo || (BANK_ABBREVIATIONS[info.slug] ?? info.slug.slice(0, 2).toUpperCase())}
    </div>
  );
}

interface ItemIconProps {
  icon: string;
  type: "BILL" | "INCOME" | "CREDIT_CARD" | "CHECKING_ACCOUNT";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ITEM_SIZE_CLASSES = {
  sm: "w-7 h-7 text-base rounded-lg",
  md: "w-9 h-9 text-lg   rounded-xl",
  lg: "w-11 h-11 text-xl rounded-xl",
};

const ITEM_TYPE_CLASSES: Record<string, string> = {
  BILL: "bg-bill-bg   border border-bill-border",
  INCOME: "bg-income-bg border border-income-border",
  CREDIT_CARD: "bg-bill-bg   border border-bill-border",
  CHECKING_ACCOUNT: "bg-income-bg border border-income-border",
};

export function ItemIcon({ icon, type, size = "md", className }: ItemIconProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center flex-shrink-0 select-none",
        ITEM_SIZE_CLASSES[size],
        ITEM_TYPE_CLASSES[type],
        className,
      )}
    >
      {icon}
    </div>
  );
}
