"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";

type Coupon = { id: string; code: string; type: string; value: number; redeemedCount: number; active: boolean };
type Ticket = { id: string; subject: string; status: string; user: { email: string } };

export default function AdminOpsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [code, setCode] = useState("SAVE5");
  const [msg, setMsg] = useState("");

  function load() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/admin/ops";
      return;
    }
    api<Coupon[]>("/admin/coupons", { token }).then(setCoupons);
    api<Ticket[]>("/admin/support", { token }).then(setTickets);
  }

  useEffect(() => {
    load();
  }, []);

  async function createCoupon() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    await api("/admin/coupons", {
      method: "POST",
      token,
      body: JSON.stringify({ code, type: "PERCENT", value: 5, minSubtotal: 1000 }),
    });
    setMsg("Coupon created");
    load();
  }

  async function close(id: string) {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    await api(`/admin/support/${id}/close`, { method: "PATCH", token, body: "{}" });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Operations</h1>

      <section className="mt-8">
        <h2 className="font-display text-xl">Coupons</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {coupons.map((c) => (
            <li key={c.id}>
              {c.code} · {c.type} {c.value} · redeemed {c.redeemedCount}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input className="rounded-xl border px-3 py-2" value={code} onChange={(e) => setCode(e.target.value)} />
          <button onClick={createCoupon} className="rounded-full bg-brand-700 px-4 py-2 text-white">
            Create % coupon
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Support tickets</h2>
        <ul className="mt-3 space-y-2">
          {tickets.map((t) => (
            <li key={t.id} className="flex justify-between rounded-xl border bg-white p-3 text-sm">
              <span>
                {t.subject} · {t.user.email} · {t.status}
              </span>
              {t.status !== "CLOSED" ? (
                <button onClick={() => close(t.id)} className="text-brand-800">
                  Close
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      {msg ? <p className="mt-4 text-sm">{msg}</p> : null}
      <p className="mt-6 text-sm">
        CMS pages: <Link href="/pages/about">/pages/about</Link> ·{" "}
        <Link href="/pages/shipping">/pages/shipping</Link>
      </p>
    </div>
  );
}
