"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";

type Ticket = { id: string; subject: string; status: string; updatedAt: string };

export default function SupportListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function load() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/account/support";
      return;
    }
    api<Ticket[]>("/support/tickets", { token }).then(setTickets);
  }

  useEffect(() => {
    load();
  }, []);

  async function open() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    await api("/support/tickets", {
      method: "POST",
      token,
      body: JSON.stringify({ subject, body }),
    });
    setSubject("");
    setBody("");
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Support</h1>
      <ul className="mt-6 space-y-2">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link href={`/account/support/${t.id}`} className="block rounded-xl border bg-white p-4">
              {t.subject} · {t.status}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 space-y-2">
        <h2 className="font-medium">New ticket</h2>
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea className="w-full rounded-xl border px-3 py-2" placeholder="How can we help?" value={body} onChange={(e) => setBody(e.target.value)} />
        <button onClick={open} className="rounded-full bg-brand-700 px-5 py-2 text-white">
          Submit
        </button>
      </div>
    </div>
  );
}
