"use client";

import { FormEvent, useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";
import { VendorShell } from "@/components/vendor-shell";

type Profile = {
  status: string;
  rejectionReason?: string | null;
  stores: { name: string; slug: string }[];
};

const steps = ["Business", "Store", "Payout", "Documents", "Review"];

export default function VendorOnboardingPage() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    phone: "+15555550123",
    country: "US",
    legalName: "",
    taxId: "",
    about: "",
    storeName: "",
    storeSlug: "",
    tagline: "",
    description: "",
    payoutHolderName: "",
    payoutLast4: "4242",
    docType: "business_license",
    fileName: "business-license.pdf",
    mimeType: "application/pdf",
  });

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    api<Profile | null>("/vendor/profile", { token }).then((p) => {
      if (!p) return;
      setProfile(p);
      if (p.stores[0]) {
        setForm((f) => ({
          ...f,
          storeName: p.stores[0].name,
          storeSlug: p.stores[0].slug,
          legalName: f.legalName || p.stores[0].name,
        }));
      }
    });
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "storeName") {
        next.storeSlug = String(value)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return next;
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/vendor/onboarding";
      return;
    }
    setError("");
    try {
      const result = await api<Profile>("/vendor/onboarding", {
        method: "POST",
        token,
        body: JSON.stringify({
          phone: form.phone,
          country: form.country,
          legalName: form.legalName,
          taxId: form.taxId,
          about: form.about,
          storeName: form.storeName,
          storeSlug: form.storeSlug,
          tagline: form.tagline,
          description: form.description,
          payoutHolderName: form.payoutHolderName || form.legalName,
          payoutLast4: form.payoutLast4,
        }),
      });
      await api("/vendor/documents", {
        method: "POST",
        token,
        body: JSON.stringify({
          type: form.docType,
          fileName: form.fileName,
          mimeType: form.mimeType,
        }),
      });
      setProfile(result);
      setMessage("Application submitted for Admin review.");
      window.location.href = "/vendor";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
    }
  }

  return (
    <VendorShell>
      <h1 className="font-display text-3xl">Vendor onboarding</h1>
      <p className="mt-1 text-stone-600">
        Registration → business → store → payout → documents → Admin review.
      </p>
      {profile?.rejectionReason ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
          Previous rejection: {profile.rejectionReason}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`rounded-full px-3 py-1 ${step === i ? "bg-brand-700 text-white" : "border bg-white"}`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-8 max-w-xl space-y-4 rounded-2xl border bg-white p-6">
        {step === 0 ? (
          <>
            <Field label="Legal business name" value={form.legalName} onChange={(v) => update("legalName", v)} />
            <Field label="Tax ID" value={form.taxId} onChange={(v) => update("taxId", v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
            <Field label="Country (ISO)" value={form.country} onChange={(v) => update("country", v)} />
            <Field label="About" value={form.about} onChange={(v) => update("about", v)} />
          </>
        ) : null}
        {step === 1 ? (
          <>
            <Field label="Store name" value={form.storeName} onChange={(v) => update("storeName", v)} />
            <Field label="Store slug" value={form.storeSlug} onChange={(v) => update("storeSlug", v)} />
            <Field label="Tagline" value={form.tagline} onChange={(v) => update("tagline", v)} />
            <Field label="Description" value={form.description} onChange={(v) => update("description", v)} />
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Field
              label="Payout account holder"
              value={form.payoutHolderName}
              onChange={(v) => update("payoutHolderName", v)}
            />
            <Field label="Account last 4" value={form.payoutLast4} onChange={(v) => update("payoutLast4", v)} />
            <p className="text-xs text-stone-500">We only store the last four digits — never full account numbers.</p>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <label className="block text-sm">
              Document type
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.docType}
                onChange={(e) => update("docType", e.target.value)}
              >
                <option value="business_license">Business license</option>
                <option value="tax_form">Tax form</option>
                <option value="id">Owner ID</option>
              </select>
            </label>
            <Field label="File name" value={form.fileName} onChange={(v) => update("fileName", v)} />
            <p className="text-xs text-stone-500">
              Metadata is recorded now; S3/R2 upload lands in a later phase.
            </p>
          </>
        ) : null}
        {step === 4 ? (
          <div className="space-y-2 text-sm text-stone-700">
            <p>
              <strong>{form.legalName}</strong> · {form.storeName} (`/{form.storeSlug}`)
            </p>
            <p>Submit to send this vendor into Admin review. Selling stays locked until approval.</p>
          </div>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-brand-800">{message}</p> : null}
        <div className="flex gap-3 pt-2">
          {step > 0 ? (
            <button type="button" className="rounded-full border px-4 py-2" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : null}
          {step < steps.length - 1 ? (
            <button type="button" className="rounded-full bg-brand-700 px-4 py-2 text-white" onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button type="submit" className="rounded-full bg-brand-700 px-4 py-2 text-white">
              Submit for review
            </button>
          )}
        </div>
      </form>
    </VendorShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        className="mt-1 w-full rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
