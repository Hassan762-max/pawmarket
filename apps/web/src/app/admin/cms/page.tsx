"use client";

import { useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";
import { ImageUrlField } from "@/components/image-url-field";

type Cms = {
  title: string;
  content: {
    hero: { title: string; subtitle: string; cta: string; image: string };
    sections: string[];
  };
};

export default function AdminCmsPage() {
  const [form, setForm] = useState({
    title: "Homepage",
    heroTitle: "",
    subtitle: "",
    cta: "",
    image: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/admin/cms";
      return;
    }
    api<Cms>("/cms/home", { token })
      .then((p) => {
        setForm({
          title: p.title,
          heroTitle: p.content.hero.title,
          subtitle: p.content.hero.subtitle,
          cta: p.content.hero.cta,
          image: p.content.hero.image,
        });
      })
      .catch(() => setMsg("Could not load CMS"));
  }, []);

  async function save() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    try {
      await api("/admin/cms/home", {
        method: "PUT",
        token,
        body: JSON.stringify({
          title: form.title,
          published: true,
          content: {
            hero: {
              title: form.heroTitle,
              subtitle: form.subtitle,
              cta: form.cta,
              image: form.image,
            },
            sections: ["animalTypes", "popular", "deals", "newArrivals", "stores"],
          },
        }),
      });
      setMsg("Saved — refresh homepage to see changes.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Homepage CMS</h1>
      <div className="mt-6 max-w-xl space-y-3 rounded-2xl border bg-white p-6">
        {(
          [
            ["heroTitle", "Hero title"],
            ["subtitle", "Subtitle"],
            ["cta", "CTA label"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            {label}
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
        <ImageUrlField
          label="Hero image"
          value={form.image}
          onChange={(image) => setForm((f) => ({ ...f, image }))}
        />
        <button onClick={save} className="rounded-full bg-brand-700 px-5 py-2.5 text-white">
          Save homepage
        </button>
        {msg ? <p className="text-sm text-stone-600">{msg}</p> : null}
      </div>
    </div>
  );
}
