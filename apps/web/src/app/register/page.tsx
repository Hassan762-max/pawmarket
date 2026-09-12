"use client";

import { FormEvent, useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", referralCode: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setForm((f) => ({ ...f, referralCode: ref.toUpperCase() }));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const result = await api<{ accessToken: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem(AUTH_KEY, result.accessToken);
      window.location.href = "/account";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl">Create account</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        {(["firstName", "lastName", "email", "password"] as const).map((k) => (
          <input
            key={k}
            type={k === "password" ? "password" : "text"}
            placeholder={k}
            className="w-full rounded-xl border px-3 py-2"
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
          />
        ))}
        <input
          placeholder="Referral code (optional)"
          className="w-full rounded-xl border px-3 py-2"
          value={form.referralCode}
          onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="w-full rounded-full bg-brand-700 py-2 text-white">Register</button>
      </form>
    </div>
  );
}
