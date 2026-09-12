"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";

type VendorRow = {
  id: string;
  status: string;
  legalName: string;
  taxId: string;
  phone: string;
  rejectionReason?: string | null;
  suspendedReason?: string | null;
  owner: { name: string; email: string };
  stores: { name: string; slug: string; status: string }[];
  documents: { type: string; fileName: string; status: string }[];
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");

  function load(token: string, status?: string) {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    api<VendorRow[]>(`/admin/vendors${q}`, { token }).then(setVendors);
  }

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/admin/vendors";
      return;
    }
    load(token, filter || undefined);
  }, [filter]);

  async function act(id: string, action: "approve" | "reject" | "suspend" | "reactivate") {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    let reason: string | undefined;
    if (action === "reject" || action === "suspend") {
      reason = window.prompt(action === "reject" ? "Rejection reason" : "Suspend reason") ?? "";
      if (!reason.trim()) return;
    }
    await api(`/admin/vendors/${id}/${action}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(reason ? { reason } : {}),
    });
    setMessage(`${action} completed`);
    load(token, filter || undefined);
  }

  return (
    <div className="space-y-4">
      <h1 className="mt-2 font-display text-3xl">Vendors</h1>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {["", "PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 ${filter === s ? "bg-brand-700 text-white" : "border bg-white"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>
      {message ? <p className="mt-3 text-sm text-brand-800">{message}</p> : null}
      <ul className="mt-6 space-y-4">
        {vendors.map((v) => (
          <li key={v.id} className="rounded-2xl border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{v.legalName}</p>
                <p className="text-sm text-stone-500">
                  {v.status} · {v.owner.name} · {v.owner.email}
                </p>
                <p className="mt-1 text-sm">
                  Store: {v.stores[0]?.name} ({v.stores[0]?.status}) · Tax {v.taxId} · {v.phone}
                </p>
                {v.documents.length ? (
                  <p className="mt-1 text-xs text-stone-500">
                    Docs: {v.documents.map((d) => `${d.type}:${d.fileName}`).join(", ")}
                  </p>
                ) : null}
                {v.rejectionReason ? <p className="mt-1 text-sm text-red-700">Reject: {v.rejectionReason}</p> : null}
                {v.suspendedReason ? <p className="mt-1 text-sm text-red-700">Suspend: {v.suspendedReason}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {v.status === "PENDING_REVIEW" || v.status === "REJECTED" ? (
                  <button className="rounded-full bg-brand-700 px-3 py-1.5 text-white" onClick={() => act(v.id, "approve")}>
                    Approve
                  </button>
                ) : null}
                {v.status === "PENDING_REVIEW" ? (
                  <button className="rounded-full border px-3 py-1.5" onClick={() => act(v.id, "reject")}>
                    Reject
                  </button>
                ) : null}
                {v.status === "APPROVED" ? (
                  <button className="rounded-full border px-3 py-1.5" onClick={() => act(v.id, "suspend")}>
                    Suspend
                  </button>
                ) : null}
                {v.status === "SUSPENDED" ? (
                  <button className="rounded-full bg-brand-700 px-3 py-1.5 text-white" onClick={() => act(v.id, "reactivate")}>
                    Reactivate
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
