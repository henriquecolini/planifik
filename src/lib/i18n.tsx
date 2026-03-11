"use client";

// ─────────────────────────────────────────────────────────────────────────────
// i18n — Lightweight internationalization
// Supports: en (English), pt-BR (Brazilian Portuguese, default)
//
// Usage:
//   const { t, lang, setLang } = useI18n();
//   t("addItem")  →  "Add Item" or "Adicionar Item"
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "pt-BR" | "en";

// ─── Translation dictionary ───────────────────────────────────────────────────
// Every user-visible string lives here. Add new keys to both languages.

const translations = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  signIn:              { en: "Sign in",                   "pt-BR": "Entrar" },
  signOut:             { en: "Sign out",                  "pt-BR": "Sair" },
  continueWithGoogle:  { en: "Continue with Google",      "pt-BR": "Continuar com o Google" },
  signingIn:           { en: "Signing in…",               "pt-BR": "Entrando…" },
  useGoogleAccount:    { en: "Use your Google account to continue", "pt-BR": "Use sua conta do Google para continuar" },
  agreeTerms:          { en: "By signing in you agree to our terms of service.", "pt-BR": "Ao entrar, você concorda com nossos termos de uso." },

  // ── Nav / groups ──────────────────────────────────────────────────────────
  selectGroup:         { en: "Select Group",              "pt-BR": "Selecionar Grupo" },
  manageGroup:         { en: "Manage group",              "pt-BR": "Gerenciar grupo" },
  newGroup:            { en: "New group",                 "pt-BR": "Novo grupo" },
  manageFolders:       { en: "Manage folders",            "pt-BR": "Gerenciar pastas" },
  today:               { en: "Today",                     "pt-BR": "Hoje" },

  // ── Balance ───────────────────────────────────────────────────────────────
  netBalance:          { en: "Net Balance",               "pt-BR": "Saldo Líquido" },
  pendingItem:         { en: "pending item",              "pt-BR": "item pendente" },
  pendingItems:        { en: "pending items",             "pt-BR": "itens pendentes" },

  // ── Item list ─────────────────────────────────────────────────────────────
  noItemsForMonth:     { en: "No items for",              "pt-BR": "Sem itens para" },
  tapToAdd:            { en: "Tap + to add your first item", "pt-BR": "Toque em + para adicionar o primeiro item" },
  addItem:             { en: "Add Item",                  "pt-BR": "Adicionar" },
  unfiled:             { en: "Unfiled",                   "pt-BR": "Sem pasta" },

  // ── Item actions ──────────────────────────────────────────────────────────
  pay:                 { en: "Pay",                       "pt-BR": "Pagar" },
  paid:                { en: "Paid",                      "pt-BR": "Pago" },
  receive:             { en: "Receive",                   "pt-BR": "Receber" },
  received:            { en: "Received",                  "pt-BR": "Recebido" },
  edit:                { en: "Edit",                      "pt-BR": "Editar" },
  markUnpaid:          { en: "Mark unpaid",               "pt-BR": "Desmarcar" },
  delete:              { en: "Delete",                    "pt-BR": "Excluir" },
  cancel:              { en: "Cancel",                    "pt-BR": "Cancelar" },
  save:                { en: "Save",                      "pt-BR": "Salvar" },
  saving:              { en: "Saving…",                   "pt-BR": "Salvando…" },
  add:                 { en: "Add",                       "pt-BR": "Adicionar" },
  back:                { en: "Back",                      "pt-BR": "Voltar" },
  done:                { en: "Done",                      "pt-BR": "Pronto" },

  // ── Due dates ─────────────────────────────────────────────────────────────
  dueToday:            { en: "Due today",                 "pt-BR": "Vence hoje" },
  dueTomorrow:         { en: "Due tomorrow",              "pt-BR": "Vence amanhã" },
  dueInDays:           { en: "Due in {n} days",           "pt-BR": "Vence em {n} dias" },
  dueOn:               { en: "Due {date}",                "pt-BR": "Vence em {date}" },
  expiredYesterday:    { en: "Expired yesterday",         "pt-BR": "Venceu ontem" },
  expiredDaysAgo:      { en: "Expired {n} days ago",      "pt-BR": "Venceu há {n} dias" },

  // ── Add/Edit Item modal ───────────────────────────────────────────────────
  addItemTitle:        { en: "Add Item",                  "pt-BR": "Novo Item" },
  editItemTitle:       { en: "Edit Item",                 "pt-BR": "Editar Item" },
  titleField:          { en: "Title",                     "pt-BR": "Nome" },
  titlePlaceholderBill:{ en: "e.g. Rent, Netflix…",       "pt-BR": "Ex: Aluguel, Netflix…" },
  titlePlaceholderAcc: { en: "e.g. Nubank, Itaú…",        "pt-BR": "Ex: Nubank, Itaú…" },
  typeField:           { en: "Type",                      "pt-BR": "Tipo" },
  typeBill:            { en: "Bill",                      "pt-BR": "Despesa" },
  typeIncome:          { en: "Income",                    "pt-BR": "Receita" },
  typeCreditCard:      { en: "Credit Card",               "pt-BR": "Cartão de Crédito" },
  typeChecking:        { en: "Checking Account",          "pt-BR": "Conta Corrente" },
  amountBill:          { en: "Amount (R$)",               "pt-BR": "Valor (R$)" },
  amountIncome:        { en: "Amount (R$)",               "pt-BR": "Valor (R$)" },
  amountOwed:          { en: "Amount owed (R$)",          "pt-BR": "Fatura atual (R$)" },
  currentBalance:      { en: "Current balance (R$)",      "pt-BR": "Saldo atual (R$)" },
  folderField:         { en: "Folder",                    "pt-BR": "Pasta" },
  noFolder:            { en: "No folder",                 "pt-BR": "Sem pasta" },
  recurrenceField:     { en: "Recurrence",                "pt-BR": "Recorrência" },
  recurrenceOnce:      { en: "One time",                  "pt-BR": "Uma vez" },
  recurrenceForever:   { en: "Every month (forever)",     "pt-BR": "Todo mês (sempre)" },
  recurrenceLimited:   { en: "Every month for N months",  "pt-BR": "Todo mês por N meses" },
  numberOfMonths:      { en: "Number of months",          "pt-BR": "Número de meses" },
  until:               { en: "Until",                     "pt-BR": "Até" },
  dueDayField:         { en: "Due day (optional)",        "pt-BR": "Dia de vencimento (opcional)" },
  dueDayPlaceholder:   { en: "e.g. 10",                   "pt-BR": "Ex: 10" },
  dueDayNextMonth:     { en: "Due day falls in the following month", "pt-BR": "Vencimento cai no mês seguinte" },
  selectBank:          { en: "Select bank",               "pt-BR": "Selecionar banco" },
  chooseIcon:          { en: "Choose icon",               "pt-BR": "Escolher ícone" },
  titleRequired:       { en: "Title is required.",        "pt-BR": "Nome é obrigatório." },
  validAmount:         { en: "Enter a valid amount.",     "pt-BR": "Informe um valor válido." },
  negativeHint:        { en: "Press − to make it negative.", "pt-BR": "Pressione − para valor negativo." },
  selectBankError:     { en: "Please select a bank.",     "pt-BR": "Selecione um banco." },

  // ── Pay modal ─────────────────────────────────────────────────────────────
  receiveIncome:       { en: "Receive Income",            "pt-BR": "Receber Receita" },
  payBill:             { en: "Pay Bill",                  "pt-BR": "Pagar Despesa" },
  payCreditCard:       { en: "Pay Credit Card",           "pt-BR": "Pagar Cartão" },
  markReceived:        { en: "Mark Received",             "pt-BR": "Marcar Recebido" },
  markPaid:            { en: "Mark Paid",                 "pt-BR": "Marcar Pago" },
  depositInto:         { en: "Deposit into account",      "pt-BR": "Depositar na conta" },
  payFrom:             { en: "Pay from checking account", "pt-BR": "Pagar da conta corrente" },
  payingWith:          { en: "Paying with",               "pt-BR": "Pagando com" },
  optional:            { en: "optional",                  "pt-BR": "opcional" },
  cashNotSpecified:    { en: "Cash / Not specified",       "pt-BR": "Dinheiro / Não especificado" },
  addToBalance:        { en: "Add to account balance",    "pt-BR": "Adicionar ao saldo da conta" },
  deductFromBalance:   { en: "Deduct from account balance","pt-BR": "Deduzir do saldo da conta" },

  // ── Delete modal ──────────────────────────────────────────────────────────
  deleteItem:          { en: "Delete item",               "pt-BR": "Excluir item" },
  deleteConfirm:       { en: "Remove",                    "pt-BR": "Remover" },
  deleting:            { en: "Deleting…",                 "pt-BR": "Excluindo…" },
  deleteJustThis:      { en: "Just this month",           "pt-BR": "Só este mês" },
  deleteJustThisDesc:  { en: "Skip {month} only",         "pt-BR": "Pular apenas {month}" },
  deleteFollowing:     { en: "This and all following",    "pt-BR": "Este e os seguintes" },
  deleteFollowingDesc: { en: "Remove from {month} onward","pt-BR": "Remover a partir de {month}" },
  deleteAll:           { en: "Delete completely",         "pt-BR": "Excluir completamente" },
  deleteAllDesc:       { en: "Remove from all months",    "pt-BR": "Remover de todos os meses" },
  deleteOneTime:       { en: "This is a one-time item and will be permanently removed.", "pt-BR": "Este é um item único e será removido permanentemente." },
  deleteFolder:        { en: "Delete folder",             "pt-BR": "Excluir pasta" },

  // ── Folders ───────────────────────────────────────────────────────────────
  folders:             { en: "Folders",                   "pt-BR": "Pastas" },
  newFolder:           { en: "New Folder",                "pt-BR": "Nova Pasta" },
  editFolder:          { en: "Edit Folder",               "pt-BR": "Editar Pasta" },
  folderName:          { en: "Name",                      "pt-BR": "Nome" },
  folderNamePlaceholder:{ en: "e.g. Utilities, Subscriptions…", "pt-BR": "Ex: Moradia, Assinaturas…" },
  folderIcon:          { en: "Icon",                      "pt-BR": "Ícone" },
  folderColor:         { en: "Color",                     "pt-BR": "Cor" },
  folderNameRequired:  { en: "Name is required.",         "pt-BR": "Nome é obrigatório." },
  noFoldersYet:        { en: "No folders yet.",           "pt-BR": "Nenhuma pasta ainda." },
  deleteFolderConfirm: { en: `Delete "{name}"? Items will become unfiled.`, "pt-BR": `Excluir "{name}"? Os itens ficarão sem pasta.` },

  // ── Groups ────────────────────────────────────────────────────────────────
  newGroupTitle:       { en: "New Group",                 "pt-BR": "Novo Grupo" },
  manageGroupTitle:    { en: "Manage",                    "pt-BR": "Gerenciar" },
  groupNameField:      { en: "Group Name",                "pt-BR": "Nome do Grupo" },
  groupNamePlaceholder:{ en: "e.g. Family, Personal…",   "pt-BR": "Ex: Família, Pessoal…" },
  groupNameRequired:   { en: "Name is required.",         "pt-BR": "Nome é obrigatório." },
  creating:            { en: "Creating…",                 "pt-BR": "Criando…" },
  members:             { en: "Members",                   "pt-BR": "Membros" },
  inviteByEmail:       { en: "Invite by Email",           "pt-BR": "Convidar por Email" },
  invite:              { en: "Invite",                    "pt-BR": "Convidar" },
  inviteEmailPlaceholder: { en: "friend@example.com",    "pt-BR": "amigo@exemplo.com" },

  // ── Language picker ───────────────────────────────────────────────────────
  language:            { en: "Language",                  "pt-BR": "Idioma" },
} satisfies Record<string, Record<Lang, string>>;

export type TranslationKey = keyof typeof translations;

// ─── Context ──────────────────────────────────────────────────────────────────

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate a key, with optional variable substitution: t("dueInDays", { n: "3" }) */
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "pt-BR",
  setLang: () => {},
  t: (key) => key,
});

const STORAGE_KEY = "planifik_lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt-BR");

  // Load preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "en" || stored === "pt-BR") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: TranslationKey, vars?: Record<string, string>): string => {
    let str = translations[key][lang] ?? translations[key]["en"] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
