"use client";

import { useEffect, useState } from "react";
import { MdPersonRemove } from "react-icons/md";
import { Button, Input, Modal } from "@/components/ui/index";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n";
import type { Group } from "@/types";

interface GroupModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "manage";
  activeGroup?: Group | null;
  onCreated: (group: Group) => void;
  onGroupUpdated: (group: Group) => void;
  onDeleteGroup: (group: Group) => void;
}

export function GroupModal({
  open,
  onClose,
  mode,
  activeGroup,
  onCreated,
  onGroupUpdated,
  onDeleteGroup,
}: GroupModalProps) {
  const { data: session } = useSession();
  const { t } = useI18n();
  const userId = session?.user?.id;
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = activeGroup?.members?.find((m) => m.userId === userId)?.role === "owner";

  useEffect(() => {
    if (activeGroup) setEditName(activeGroup.name);
  }, [activeGroup]);

  const handleCreate = async () => {
    setError("");
    if (!name.trim()) return setError(t("groupNameRequired"));
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const group = await res.json();
      onCreated(group);
      setName("");
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!activeGroup || !editName.trim() || editName === activeGroup.name) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = await res.json();
      onGroupUpdated(updated);
      setSuccess(t("done"));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!activeGroup || !inviteEmail.trim()) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSuccess(`Invited ${inviteEmail}`);
      setInviteEmail("");
      const gr = await fetch(`/api/groups/${activeGroup.id}`).then((r) => r.json());
      onGroupUpdated(gr);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeGroup) return;
    await fetch(`/api/groups/${activeGroup.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberId }),
    });
    const gr = await fetch(`/api/groups/${activeGroup.id}`).then((r) => r.json());
    onGroupUpdated(gr);
  };

  if (mode === "create") {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={t("newGroupTitle")}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? t("creating") : t("newGroup")}
            </Button>
          </>
        }
      >
        {error && (
          <div className="text-sm text-bill bg-bill-bg border border-bill-border rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <Input
          label={t("groupNameField")}
          placeholder={t("groupNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t("manageGroupTitle")}: ${activeGroup?.name}`}
      size="md"
      footer={
        <div className="flex justify-between items-center w-full">
          {isOwner ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (activeGroup) onDeleteGroup(activeGroup);
              }}
            >
              {t("deleteGroup")}
            </Button>
          ) : (
            <div />
          )}
          <Button variant="secondary" onClick={onClose}>
            {t("done")}
          </Button>
        </div>
      }
    >
      {error && (
        <div className="text-sm text-bill bg-bill-bg border border-bill-border rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-income bg-income-bg border border-income-border rounded-lg px-3 py-2">
          {success}
        </div>
      )}

      {isOwner && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label={t("groupNameField")}
              placeholder={t("groupNamePlaceholder")}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <Button onClick={handleUpdateName} disabled={loading || editName === activeGroup?.name}>
            {t("save")}
          </Button>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-medium text-text-secondary mb-2">{t("members")}</p>
        <div className="space-y-1.5">
          {activeGroup?.members?.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-elevated border border-border-subtle"
            >
              {m.user?.image ? (
                <Image
                  src={m.user.image}
                  alt={m.user.name ?? ""}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-accent-dim flex items-center justify-center text-xs font-bold text-accent">
                  {m.user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{m.user?.name}</p>
                <p className="text-xs text-text-muted truncate">{m.user?.email}</p>
              </div>
              <span className="text-xs text-text-muted capitalize">{m.role}</span>
              {m.userId !== userId && (
                <button
                  onClick={() => handleRemoveMember(m.userId)}
                  className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-bill transition-colors"
                >
                  <MdPersonRemove size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            label={t("inviteByEmail")}
            placeholder={t("inviteEmailPlaceholder")}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </div>
        <button
          onClick={handleInvite}
          disabled={loading}
          className="px-4 h-9 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
        >
          {t("invite")}
        </button>
      </div>
    </Modal>
  );
}
