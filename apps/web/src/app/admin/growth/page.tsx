"use client";

import { FormEvent, useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";

type Campaign = { id: string; name: string; subject: string; status: string; sentCount: number };
type Experiment = { id: string; key: string; name: string; active: boolean; _count: { assignments: number } };

export default function AdminGrowthPage() {
  const [token, setToken] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [campForm, setCampForm] = useState({ name: "", subject: "", body: "" });
  const [expForm, setExpForm] = useState({ key: "home_hero", name: "Home hero", variants: "A,B" });

  async function refresh(t: string) {
    setCampaigns(await api<Campaign[]>("/admin/campaigns", { token: t }));
    setExperiments(await api<Experiment[]>("/admin/experiments", { token: t }));
  }

  useEffect(() => {
    const t = localStorage.getItem(AUTH_KEY);
    if (!t) {
      window.location.href = "/login?next=/admin/growth";
      return;
    }
    setToken(t);
    refresh(t);
  }, []);

  async function createCampaign(e: FormEvent) {
    e.preventDefault();
    await api("/admin/campaigns", { method: "POST", token, body: JSON.stringify(campForm) });
    setCampForm({ name: "", subject: "", body: "" });
    await refresh(token);
  }

  async function upsertExp(e: FormEvent) {
    e.preventDefault();
    await api("/admin/experiments", {
      method: "POST",
      token,
      body: JSON.stringify({
        key: expForm.key,
        name: expForm.name,
        variants: expForm.variants.split(",").map((s) => s.trim()).filter(Boolean),
        active: true,
      }),
    });
    await refresh(token);
  }

  if (!token) return <p className="px-4 py-16 text-center">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Growth</h1>

      <h2 className="mt-10 font-display text-2xl">Email campaigns</h2>
      <form onSubmit={createCampaign} className="mt-4 space-y-2 rounded-2xl border bg-white p-4">
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Name" value={campForm.name} onChange={(e) => setCampForm({ ...campForm, name: e.target.value })} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Subject" value={campForm.subject} onChange={(e) => setCampForm({ ...campForm, subject: e.target.value })} />
        <textarea className="w-full rounded-xl border px-3 py-2" placeholder="Body" value={campForm.body} onChange={(e) => setCampForm({ ...campForm, body: e.target.value })} />
        <button className="rounded-full bg-brand-700 px-4 py-2 text-sm text-white">Create draft</button>
      </form>
      <ul className="mt-4 space-y-2">
        {campaigns.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
            <span>
              {c.name} · {c.status} · sent {c.sentCount}
            </span>
            {c.status !== "SENT" ? (
              <button
                className="text-sm text-brand-800"
                onClick={async () => {
                  await api(`/admin/campaigns/${c.id}/send`, { method: "POST", token });
                  await refresh(token);
                }}
              >
                Send (stub)
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl">A/B experiments</h2>
      <form onSubmit={upsertExp} className="mt-4 space-y-2 rounded-2xl border bg-white p-4">
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Key" value={expForm.key} onChange={(e) => setExpForm({ ...expForm, key: e.target.value })} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Name" value={expForm.name} onChange={(e) => setExpForm({ ...expForm, name: e.target.value })} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Variants A,B" value={expForm.variants} onChange={(e) => setExpForm({ ...expForm, variants: e.target.value })} />
        <button className="rounded-full bg-brand-700 px-4 py-2 text-sm text-white">Save experiment</button>
      </form>
      <ul className="mt-4 space-y-2">
        {experiments.map((x) => (
          <li key={x.id} className="rounded-xl border bg-white p-3">
            {x.key} · {x.name} · {x.active ? "active" : "off"} · {x._count.assignments} assignments
          </li>
        ))}
      </ul>
    </div>
  );
}
