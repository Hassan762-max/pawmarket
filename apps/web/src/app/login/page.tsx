"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AUTH_KEY, api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("customer@pawmarket.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const result = await api<{ accessToken: string; user: { roles: string[] } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(AUTH_KEY, result.accessToken);
      const roles = result.user.roles;
      const status = (result.user as { vendorStatus?: string | null }).vendorStatus;
      if (roles.includes("admin")) window.location.href = "/admin";
      else if (roles.includes("vendor_owner") || roles.includes("vendor_staff")) {
        if (!status || status === "PENDING_ONBOARDING" || status === "REJECTED") {
          window.location.href = "/vendor/onboarding";
        } else {
          window.location.href = "/vendor";
        }
      } else window.location.href = "/account";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl">Sign in</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input className="w-full rounded-xl border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          type="password"
          className="w-full rounded-xl border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="w-full rounded-full bg-brand-700 py-2 text-white">Continue</button>
      </form>
      <p className="mt-4 text-sm">
        New here? <Link href="/register">Create an account</Link>
      </p>
    </div>
  );
}
