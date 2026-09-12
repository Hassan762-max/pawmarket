"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
};

export function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsInbox({
  title = "Notifications",
  loginNext,
}: {
  title?: string;
  loginNext: string;
}) {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = `/login?next=${encodeURIComponent(loginNext)}`;
      return;
    }
    api<NotificationRow[]>("/notifications", { token })
      .then(setRows)
      .finally(() => setLoading(false));
  }, [loginNext]);

  useEffect(() => {
    load();
  }, [load]);

  async function markAll() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    setRows(await api<NotificationRow[]>("/notifications/read", { method: "POST", token, body: "{}" }));
  }

  async function openNote(note: NotificationRow) {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    if (!note.readAt) {
      setRows(
        await api<NotificationRow[]>("/notifications/read", {
          method: "POST",
          token,
          body: JSON.stringify({ id: note.id }),
        }),
      );
    }
    if (note.link) window.location.href = note.link;
  }

  if (loading) {
    return <p className="py-10 text-center text-stone-600">Loading notifications…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Inbox</p>
          <h1 className="mt-1 font-display text-3xl text-stone-900">{title}</h1>
        </header>
        <button type="button" onClick={markAll} className="text-sm text-brand-800 hover:underline">
          Mark all read
        </button>
      </div>
      <ul className="space-y-2">
        {rows.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border border-stone-200/80 p-4 shadow-sm ${
              n.readAt ? "bg-white/90" : "bg-brand-50/80"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-stone-900">{n.title}</p>
              <span className="text-xs text-stone-500">{formatRelativeTime(n.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm text-stone-600">{n.body}</p>
            {n.link ? (
              <button
                type="button"
                onClick={() => openNote(n)}
                className="mt-2 text-sm font-medium text-brand-800 hover:underline"
              >
                Open
              </button>
            ) : !n.readAt ? (
              <button
                type="button"
                onClick={() => openNote(n)}
                className="mt-2 text-sm text-stone-500 hover:underline"
              >
                Mark read
              </button>
            ) : null}
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="rounded-xl border border-dashed border-stone-200 bg-white/60 px-4 py-10 text-center text-sm text-stone-500">
            No notifications yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export function notificationsInboxPath(roles: string[]) {
  if (roles.includes("admin")) return "/admin/notifications";
  if (roles.includes("vendor_owner") || roles.includes("vendor_staff")) return "/vendor/notifications";
  return "/account/notifications";
}
