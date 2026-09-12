"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";

type Payout = {
  id: string;
  amount: number;
  status: string;
  note: string;
  vendor: { legalName: string; owner: { email: string } };
};

type Refund = {
  id: string;
  amount: number;
  status: string;
  reason: string;
  orderId: string;
};

export default function AdminMoneyPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [rateBps, setRateBps] = useState("1000");
  const [msg, setMsg] = useState("");

  function token() {
    return localStorage.getItem(AUTH_KEY);
  }

  function load() {
    const t = token();
    if (!t) {
      window.location.href = "/login?next=/admin/money";
      return;
    }
    api<Payout[]>("/admin/payouts", { token: t }).then(setPayouts);
    api<Refund[]>("/admin/refunds", { token: t }).then(setRefunds);
  }

  useEffect(() => {
    load();
  }, []);

  async function decidePayout(id: string, approve: boolean) {
    const t = token();
    if (!t) return;
    await api(`/admin/payouts/${id}`, { method: "PATCH", token: t, body: JSON.stringify({ approve }) });
    load();
  }

  async function decideRefund(id: string, approve: boolean) {
    const t = token();
    if (!t) return;
    await api(`/admin/refunds/${id}`, { method: "PATCH", token: t, body: JSON.stringify({ approve }) });
    load();
  }

  async function saveCommission() {
    const t = token();
    if (!t) return;
    await api("/admin/commission", {
      method: "POST",
      token: t,
      body: JSON.stringify({ rateBps: Number(rateBps) }),
    });
    setMsg(`Global commission set to ${Number(rateBps) / 100}%`);
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Money</h1>

      <section className="mt-8">
        <h2 className="font-display text-xl">Global commission (bps)</h2>
        <div className="mt-2 flex gap-2">
          <input className="rounded-xl border px-3 py-2" value={rateBps} onChange={(e) => setRateBps(e.target.value)} />
          <button onClick={saveCommission} className="rounded-full bg-brand-700 px-4 py-2 text-white">
            Save
          </button>
        </div>
        {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Payout requests</h2>
        <ul className="mt-3 space-y-2">
          {payouts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-4 text-sm">
              <span>
                {p.vendor.legalName} · {money(p.amount)} · {p.status}
              </span>
              {p.status === "PENDING" ? (
                <span className="flex gap-2">
                  <button onClick={() => decidePayout(p.id, true)} className="rounded-full bg-brand-700 px-3 py-1 text-white">
                    Pay
                  </button>
                  <button onClick={() => decidePayout(p.id, false)} className="rounded-full border px-3 py-1">
                    Reject
                  </button>
                </span>
              ) : null}
            </li>
          ))}
          {payouts.length === 0 ? <li className="text-stone-500">None</li> : null}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Refunds</h2>
        <ul className="mt-3 space-y-2">
          {refunds.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-4 text-sm">
              <span>
                {money(r.amount)} · {r.status} · {r.reason}
              </span>
              {r.status === "PENDING" ? (
                <span className="flex gap-2">
                  <button onClick={() => decideRefund(r.id, true)} className="rounded-full bg-brand-700 px-3 py-1 text-white">
                    Approve
                  </button>
                  <button onClick={() => decideRefund(r.id, false)} className="rounded-full border px-3 py-1">
                    Reject
                  </button>
                </span>
              ) : null}
            </li>
          ))}
          {refunds.length === 0 ? <li className="text-stone-500">None</li> : null}
        </ul>
      </section>
    </div>
  );
}
