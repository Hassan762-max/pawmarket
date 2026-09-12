"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AUTH_KEY, api } from "@/lib/api";

type Category = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

export default function AdminCategoriesPage() {
  const [trees, setTrees] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load() {
    api<Category[]>("/categories").then(setTrees);
  }

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      window.location.href = "/login?next=/admin/categories";
      return;
    }
    load();
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    setError("");
    try {
      await api("/admin/categories", {
        method: "POST",
        token,
        body: JSON.stringify({ name, parentId: parentId || null }),
      });
      setName("");
      setMessage("Category created");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function remove(id: string) {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    setError("");
    try {
      await api(`/admin/categories/${id}`, { method: "DELETE", token });
      setMessage("Category deleted");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const parents = trees.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="space-y-4">
      <Link href="/admin/products" className="text-sm text-brand-800">
        ← Products
      </Link>
      <h1 className="mt-2 font-display text-3xl">Categories</h1>
      <form onSubmit={create} className="mt-6 flex flex-wrap gap-2 rounded-2xl border bg-white p-4">
        <input
          className="rounded-xl border px-3 py-2"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select className="rounded-xl border px-3 py-2" value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">Top level</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              Child of {p.name}
            </option>
          ))}
        </select>
        <button className="rounded-full bg-brand-700 px-4 py-2 text-white">Add</button>
      </form>
      {message ? <p className="mt-2 text-sm text-brand-800">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <ul className="mt-6 space-y-4">
        {trees.map((root) => (
          <li key={root.id} className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {root.name} <span className="text-sm text-stone-400">/{root.slug}</span>
              </p>
              <button className="text-sm text-red-700" onClick={() => remove(root.id)}>
                Delete
              </button>
            </div>
            <ul className="mt-2 space-y-1 pl-4 text-sm">
              {root.children.map((c) => (
                <li key={c.id} className="flex justify-between">
                  <span>
                    {c.name} <span className="text-stone-400">/{c.slug}</span>
                  </span>
                  <button className="text-red-700" onClick={() => remove(c.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
