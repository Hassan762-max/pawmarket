"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";

type Bal = {
  pending: number;
  available: number;
  paid: number;
  commission: number;
  entries: { id: string; type: string; amount: number; note: string; createdAt: string }[];
};

export default function VendorEarningsPage() {
  const [bal, setBal] = useState<Bal | null>(null);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");

  function token() {
    return localStorage.getItem(AUTH_KEY);
  }

  function load() {
    const t = token();
    if (!t) return;
    api<Bal>("/vendor/earnings", { token: t }).then(setBal);
  }

  useEffect(() => {
    load();
  }, []);

  async function release() {
    const t = token();
    if (!t) return;
    setBal(await api<Bal>("/vendor/earnings/release", { method: "POST", token: t, body: "{}" }));
    setMsg("Pending released to available");
  }

  async function payout() {
    const t = token();
    if (!t) return;
    try {
      await api("/vendor/payouts", {
        method: "POST",
        token: t,
        body: JSON.stringify({ amount: Math.round(Number(amount) * 100), note: "Vendor payout" }),
      });
      setMsg("Payout requested");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  if (!bal) return <VendorShell><p>Loading…</p></VendorShell>;

  return (
    <VendorShell>
      <h1 className="font-display text-3xl">Earnings</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Pending", bal.pending],
          ["Available", bal.available],
          ["Paid", bal.paid],
          ["Commission taken", bal.commission],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-stone-500">{l}</p>
            <p className="text-xl">{money(Number(v))}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={release} className="rounded-full bg-brand-700 px-4 py-2 text-white">
          Release pending → available
        </button>
        <input
          className="rounded-full border px-3 py-2 text-sm"
          placeholder="Payout $"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={payout} className="rounded-full border border-brand-700 px-4 py-2 text-brand-800">
          Request payout
        </button>
      </div>
      {msg ? <p className="mt-3 text-sm text-stone-600">{msg}</p> : null}
      <h2 className="mt-10 font-display text-xl">Ledger</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {bal.entries.map((e) => (
          <li key={e.id} className="flex justify-between border-b py-2">
            <span>
              {e.type} · {e.note}
            </span>
            <span>{money(e.amount)}</span>
          </li>
        ))}
      </ul>
    </VendorShell>
  );
}
