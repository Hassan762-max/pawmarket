"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";

function ReturnInner() {
  const params = useSearchParams();
  const provider = params.get("provider") ?? "jazzcash";
  const [msg, setMsg] = useState("Confirming payment…");

  useEffect(() => {
    const body: Record<string, string> = {};
    params.forEach((v, k) => {
      if (k !== "provider") body[k] = v;
    });
    // Also accept common JazzCash / EasyPaisa query fields already in URL
    api<{ ok: boolean; status?: string }>(`/payments/webhooks/${provider}`, {
      method: "POST",
      body: JSON.stringify(body),
    })
      .then((r) => {
        setMsg(r.status === "FAILED" ? "Payment failed or cancelled." : "Payment confirmed. Shukriya!");
      })
      .catch(() => {
        setMsg("Payment return received. Agar amount cut hua ho to order account mein check karein.");
      });
  }, [params, provider]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-3xl">Payment return</h1>
      <p className="mt-4 text-stone-600">{msg}</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-stone-400">{provider}</p>
      <Link href="/account/orders" className="mt-8 inline-block text-brand-800">
        View orders
      </Link>
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<p className="px-4 py-20 text-center">Loading…</p>}>
      <ReturnInner />
    </Suspense>
  );
}
