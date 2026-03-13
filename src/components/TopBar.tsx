"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { MdCheck, MdExpandMore, MdLanguage, MdLogout, MdAdd, MdPeople } from "react-icons/md";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { type Lang, useI18n } from "@/lib/i18n";
import type { Group } from "@/types";

interface TopBarProps {
  groups: Group[];
  activeGroup: Group | null;
  onGroupChange: (group: Group) => void;
  onCreateGroup: () => void;
  onManageGroup: () => void;
}

export function TopBar({
  groups,
  activeGroup,
  onGroupChange,
  onCreateGroup,
  onManageGroup,
}: TopBarProps) {
  const { data: session } = useSession();
  const { t, lang, setLang } = useI18n();
  const user = session?.user;

  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const closeAll = () => {
    setGroupMenuOpen(false);
    setProfileMenuOpen(false);
  };

  return (
    <header className="top-0 z-30 bg-white border-b border-border-subtle">
      <div
        className="relative flex items-center gap-2 px-4 max-w-2xl mx-auto"
        style={{ height: 52 }}
      >
        {/* ── Group switcher ── */}
        <div className="flex-1 flex justify-center relative">
          <button
            onClick={() => {
              setGroupMenuOpen((v) => !v);
              setProfileMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-elevated transition-colors"
          >
            <span className="text-sm font-semibold text-text-primary">
              {activeGroup?.name ?? t("selectGroup")}
            </span>
            <MdExpandMore
              size={13}
              className={cn("text-text-muted transition-transform", groupMenuOpen && "rotate-180")}
            />
          </button>

          {groupMenuOpen && (
            <div className="absolute top-9 left-1/2 -translate-x-1/2 z-50">
              <div className="w-52 bg-white border border-border-default rounded-xl shadow-lg overflow-hidden animate-slide-down">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      onGroupChange(g);
                      setGroupMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-text-primary hover:bg-elevated transition-colors"
                  >
                    <span className="truncate">{g.name}</span>
                    {g.id === activeGroup?.id && (
                      <MdCheck size={13} className="text-accent flex-shrink-0" />
                    )}
                  </button>
                ))}
                <div className="border-t border-border-subtle">
                  <button
                    onClick={() => {
                      onManageGroup();
                      setGroupMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:bg-elevated transition-colors"
                  >
                    <MdPeople size={13} /> {t("manageGroup")}
                  </button>
                  <button
                    onClick={() => {
                      onCreateGroup();
                      setGroupMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:bg-elevated transition-colors"
                  >
                    <MdAdd size={13} /> {t("newGroup")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Logo ── */}
        <div className="absolute left-4 flex">
          <Image src="/logo.svg" height={10} width={80} alt="Logo" className="select-none" />
        </div>
        {/* ── Profile ── */}
        <div className="absolute right-4 flex">
          <button
            onClick={() => {
              setProfileMenuOpen((v) => !v);
              setGroupMenuOpen(false);
            }}
            className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-border-default hover:ring-accent transition-all flex-shrink-0"
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-accent-dim flex items-center justify-center text-xs font-semibold text-accent">
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </button>

          {profileMenuOpen && (
            <div className="absolute top-10 right-0 w-56 bg-white border border-border-default rounded-xl shadow-lg overflow-hidden z-50 animate-slide-down">
              {/* User info */}
              <div className="px-3 py-3 border-b border-border-subtle">
                <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>

              {/* Language switcher */}
              <div className="px-3 py-2.5 border-b border-border-subtle">
                <div className="flex items-center gap-2 mb-2">
                  <MdLanguage size={13} className="text-text-muted" />
                  <span className="text-xs font-medium text-text-secondary">{t("language")}</span>
                </div>
                <div className="flex gap-1.5">
                  {(["pt-BR", "en"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={cn(
                        "flex-1 text-xs py-1 rounded-lg font-medium transition-colors",
                        lang === l
                          ? "bg-accent text-white"
                          : "bg-elevated text-text-secondary hover:bg-hover",
                      )}
                    >
                      {l === "pt-BR" ? "Português" : "English"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-bill hover:bg-bill-bg transition-colors"
              >
                <MdLogout size={14} /> {t("signOut")}
              </button>
            </div>
          )}
        </div>

        {(groupMenuOpen || profileMenuOpen) && (
          <div className="fixed inset-0 z-40" onClick={closeAll} />
        )}
      </div>
    </header>
  );
}
