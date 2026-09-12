"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AUTH_KEY, api } from "@/lib/api";

export default function ReferralPage() {
  const [data, setData] = useState<{ code: string; sharePath: string; invited: number } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/account/referral";
      return;
    }
    api<{ code: string; sharePath: string; invited: number }>("/account/referral", { token }).then(setData);
  }, []);

  if (!data) return <p className="px-4 py-16 text-center">Loading…</p>;

  const url = typeof window !== "undefined" ? `${window.location.origin}${data.sharePath}` : data.sharePath;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Refer friends</h1>
      <p className="mt-2 text-stone-600">Share your code. Invites so far: {data.invited}</p>
      <div className="mt-6 rounded-2xl border bg-white p-6">
        <p className="text-sm text-stone-500">Your code</p>
        <p className="font-mono text-3xl tracking-widest">{data.code}</p>
        <p className="mt-4 break-all text-sm text-stone-600">{url}</p>
        <button
          className="mt-4 rounded-full bg-brand-700 px-4 py-2 text-sm text-white"
          onClick={() => navigator.clipboard.writeText(url)}
        >
          Copy link
        </button>
      </div>
    </div>
  );
}
