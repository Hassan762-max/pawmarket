"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";

type Address = {
  id: string;
  label: string;
  line1: string;
  city: string;
  region: string;
  postalCode: string;
  isDefault: boolean;
};

const empty = { label: "Home", line1: "", city: "", region: "", postalCode: "" };

export default function AddressesPage() {
  const [rows, setRows] = useState<Address[]>([]);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState("");

  function token() {
    return localStorage.getItem(AUTH_KEY);
  }

  function load() {
    const t = token();
    if (!t) {
      window.location.href = "/login?next=/account/addresses";
      return;
    }
    api<Address[]>("/addresses", { token: t }).then(setRows);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    const t = token();
    if (!t) return;
    await api("/addresses", { method: "POST", token: t, body: JSON.stringify(form) });
    setForm(empty);
    setMsg("Saved");
    load();
  }

  async function remove(id: string) {
    const t = token();
    if (!t) return;
    await api(`/addresses/${id}`, { method: "DELETE", token: t });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Addresses</h1>
      <ul className="mt-6 space-y-2">
        {rows.map((a) => (
          <li key={a.id} className="flex justify-between rounded-xl border bg-white p-4 text-sm">
            <span>
              {a.label}: {a.line1}, {a.city} {a.region} {a.postalCode}
              {a.isDefault ? " · default" : ""}
            </span>
            <button onClick={() => remove(a.id)} className="text-stone-500">
              Delete
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-8 space-y-2">
        <h2 className="font-medium">Add address</h2>
        {(["label", "line1", "city", "region", "postalCode"] as const).map((k) => (
          <input
            key={k}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder={k}
            value={form[k]}
            onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
          />
        ))}
        <button onClick={save} className="rounded-full bg-brand-700 px-5 py-2 text-white">
          Save
        </button>
        {msg ? <p className="text-sm text-stone-600">{msg}</p> : null}
      </div>
    </div>
  );
}
