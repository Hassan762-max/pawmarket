"use client";

import { FormEvent, useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";

type Staff = { id: string; email: string; name: string; roleSlug: string };

export default function VendorStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [email, setEmail] = useState("customer@pawmarket.local");
  const [roleSlug, setRoleSlug] = useState("manager");
  const [error, setError] = useState("");

  function load(token: string) {
    api<Staff[]>("/vendor/staff", { token }).then(setStaff);
  }

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    load(token);
  }, []);

  async function invite(e: FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    setError("");
    try {
      await api("/vendor/staff", {
        method: "POST",
        token,
        body: JSON.stringify({ email, roleSlug }),
      });
      load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    }
  }

  return (
    <VendorShell>
      <h1 className="font-display text-3xl">Staff</h1>
      <p className="mt-1 text-sm text-stone-600">Invite an existing PawMarket user into this vendor account.</p>
      <form onSubmit={invite} className="mt-6 flex flex-wrap gap-3 rounded-2xl border bg-white p-4">
        <input className="rounded-xl border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="rounded-xl border px-3 py-2" value={roleSlug} onChange={(e) => setRoleSlug(e.target.value)}>
          <option value="manager">Manager</option>
          <option value="packer">Packer</option>
          <option value="finance">Finance</option>
        </select>
        <button className="rounded-full bg-brand-700 px-4 py-2 text-white">Invite</button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <ul className="mt-6 space-y-2">
        {staff.map((s) => (
          <li key={s.id} className="rounded-xl border bg-white p-3 text-sm">
            {s.name} · {s.email} · {s.roleSlug}
          </li>
        ))}
        {staff.length === 0 ? <li className="text-stone-500">No staff yet.</li> : null}
      </ul>
    </VendorShell>
  );
}
