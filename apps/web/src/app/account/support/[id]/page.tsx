"use client";

import { use, useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";

type Ticket = {
  subject: string;
  status: string;
  messages: { id: string; body: string; isStaff: boolean; createdAt: string }[];
};

export default function SupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [body, setBody] = useState("");

  function load() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    api<Ticket[]>("/support/tickets", { token }).then((rows) => {
      const t = rows.find((r) => (r as { id?: string }).id === id) as unknown as Ticket & { id: string };
      setTicket(t ?? null);
    });
  }

  useEffect(() => {
    load();
  }, [id]);

  async function reply() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    const updated = await api<Ticket>(`/support/tickets/${id}/messages`, {
      method: "POST",
      token,
      body: JSON.stringify({ body }),
    });
    setTicket(updated);
    setBody("");
  }

  if (!ticket) return <p className="py-10 text-center text-stone-600">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">{ticket.subject}</h1>
      <p className="text-sm text-stone-600">{ticket.status}</p>
      <ul className="mt-6 space-y-3">
        {ticket.messages.map((m) => (
          <li key={m.id} className={`rounded-xl border p-3 text-sm ${m.isStaff ? "bg-brand-50" : "bg-white"}`}>
            <p className="text-xs text-stone-500">{m.isStaff ? "Staff" : "You"}</p>
            <p>{m.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex gap-2">
        <input className="flex-1 rounded-xl border px-3 py-2" value={body} onChange={(e) => setBody(e.target.value)} />
        <button onClick={reply} className="rounded-full bg-brand-700 px-4 py-2 text-white">
          Reply
        </button>
      </div>
    </div>
  );
}
