"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { AUTH_KEY, api, requireLogin } from "@/lib/api";
import { DashboardShell, RoleGreeting } from "@/components/dashboard-shell";

type Me = { firstName: string; email: string; roles: string[] };

const links = [
  { href: "/admin", label: "Overview", match: "exact" as const },
  { href: "/admin/notifications", label: "Notifications", match: "prefix" as const },
  { href: "/admin/vendors", label: "Vendors", match: "prefix" as const },
  { href: "/admin/products", label: "Products", match: "prefix" as const },
  { href: "/admin/categories", label: "Categories", match: "prefix" as const },
  { href: "/admin/money", label: "Money", match: "prefix" as const },
  { href: "/admin/plans", label: "Plans", match: "prefix" as const },
  { href: "/admin/ops", label: "Ops", match: "prefix" as const },
  { href: "/admin/analytics", label: "Analytics", match: "prefix" as const },
  { href: "/admin/growth", label: "Growth", match: "prefix" as const },
  { href: "/admin/cms", label: "Homepage CMS", match: "prefix" as const },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      requireLogin("/admin");
      return;
    }
    api<Me>("/auth/me", { token }).then((u) => {
      if (!u.roles.includes("admin")) {
        window.location.href = "/";
        return;
      }
      setMe(u);
    });
  }, []);

  if (!me) {
    return <p className="px-4 py-16 text-center text-stone-600">Loading admin console…</p>;
  }

  return (
    <DashboardShell
      title={<RoleGreeting firstName={me.firstName} roles={me.roles} />}
      subtitle={me.email}
      links={links}
      footer={
        <div className="space-y-2">
          <Link href="/" className="block rounded-xl px-3 py-2 text-stone-500 hover:bg-stone-100">
            ← Marketplace
          </Link>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-stone-500 hover:bg-stone-100"
            onClick={() => {
              localStorage.removeItem(AUTH_KEY);
              window.location.href = "/";
            }}
          >
            Sign out
          </button>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
