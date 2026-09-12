"use client";

import { FormEvent, useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";

type Row = {
  id: string;
  sku: string;
  name: string;
  productName: string;
  onHand: number;
  reserved: number;
  available: number;
  sold: number;
  lowStock: boolean;
};

export default function VendorInventoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  function load(token: string) {
    api<Row[]>("/vendor/inventory", { token }).then((data) => {
      setRows(data);
      setEdits(Object.fromEntries(data.map((r) => [r.id, String(r.onHand)])));
    });
  }

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    load(token);
  }, []);

  async function save(e: FormEvent, variantId: string) {
    e.preventDefault();
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    await api(`/vendor/inventory/${variantId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ onHand: Number(edits[variantId] ?? 0) }),
    });
    setMessage("Inventory updated (transaction recorded).");
    load(token);
  }

  return (
    <VendorShell>
      <h1 className="font-display text-3xl">Inventory</h1>
      <p className="mt-1 text-sm text-stone-600">
        Available = on hand − reserved. Adjustments write immutable inventory transactions.
      </p>
      {message ? <p className="mt-3 text-sm text-brand-800">{message}</p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-stone-500">
              <th className="py-2">Product</th>
              <th>SKU</th>
              <th>On hand</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Sold</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-b ${r.lowStock ? "bg-amber-50" : ""}`}>
                <td className="py-2">
                  {r.productName}
                  <div className="text-xs text-stone-500">{r.name}</div>
                </td>
                <td>{r.sku}</td>
                <td>
                  <input
                    className="w-20 rounded border px-2 py-1"
                    value={edits[r.id] ?? ""}
                    onChange={(e) => setEdits({ ...edits, [r.id]: e.target.value })}
                  />
                </td>
                <td>{r.reserved}</td>
                <td>{r.available}</td>
                <td>{r.sold}</td>
                <td>
                  <button
                    className="rounded-full border px-3 py-1"
                    onClick={(e) => save(e, r.id)}
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VendorShell>
  );
}
