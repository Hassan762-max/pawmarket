"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";
import {
  NotificationRow,
  formatRelativeTime,
  notificationsInboxPath,
} from "@/components/notifications-inbox";

type Me = { roles: string[] };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [inbox, setInbox] = useState("/account/notifications");
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      setCount(0);
      setRows([]);
      return;
    }
    try {
      const [me, unread, list] = await Promise.all([
        api<Me>("/auth/me", { token }),
        api<{ count: number }>("/notifications/unread-count", { token }),
        api<NotificationRow[]>("/notifications", { token }),
      ]);
      setInbox(notificationsInboxPath(me.roles));
      setCount(unread.count);
      setRows(list.slice(0, 8));
    } catch {
      /* session may be expired */
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 20000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function markAll() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    const list = await api<NotificationRow[]>("/notifications/read", {
      method: "POST",
      token,
      body: "{}",
    });
    setRows(list.slice(0, 8));
    setCount(0);
  }

  async function openNote(note: NotificationRow) {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    if (!note.readAt) {
      const list = await api<NotificationRow[]>("/notifications/read", {
        method: "POST",
        token,
        body: JSON.stringify({ id: note.id }),
      });
      setRows(list.slice(0, 8));
      setCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (note.link) window.location.href = note.link;
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) refresh();
        }}
        className="relative rounded-full px-2.5 py-1.5 hover:bg-brand-100"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5 text-stone-700"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
          <path d="M10 17a2 2 0 0 0 4 0" />
        </svg>
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <p className="text-sm font-medium text-stone-900">Notifications</p>
            <button type="button" onClick={markAll} className="text-xs text-brand-800 hover:underline">
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {rows.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openNote(n)}
                  className={`w-full border-b border-stone-50 px-4 py-3 text-left transition hover:bg-sand-50 ${
                    n.readAt ? "bg-white" : "bg-brand-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-stone-900">{n.title}</p>
                    <span className="shrink-0 text-[10px] text-stone-500">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-stone-600">{n.body}</p>
                </button>
              </li>
            ))}
            {rows.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-stone-500">You&apos;re all caught up.</li>
            ) : null}
          </ul>
          <div className="border-t border-stone-100 px-4 py-2.5">
            <Link
              href={inbox}
              onClick={() => setOpen(false)}
              className="block text-center text-sm font-medium text-brand-800 hover:underline"
            >
              View all
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
