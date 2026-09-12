"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { AUTH_KEY, api, requireLogin } from "@/lib/api";
import { DashboardShell, RoleGreeting } from "@/components/dashboard-shell";

type Me = { firstName: string; email: string; roles: string[] };

const baseLinks = [
  { href: "/account", label: "Overview", match: "exact" as const },
  { href: "/account/orders", label: "Orders", match: "prefix" as const },
  { href: "/account/addresses", label: "Addresses", match: "prefix" as const },
  { href: "/account/wishlist", label: "Wishlist", match: "prefix" as const },
  { href: "/account/notifications", label: "Notifications", match: "prefix" as const },
  { href: "/account/support", label: "Support", match: "prefix" as const },
  { href: "/account/referral", label: "Referrals", match: "prefix" as const },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      requireLogin("/account");
      return;
    }
    api<Me>("/auth/me", { token }).then(setMe);
  }, []);

  if (!me) {
    return <p className="px-4 py-16 text-center text-stone-600">Loading your account…</p>;
  }

  const links = [
    ...baseLinks,
    ...(me.roles.includes("vendor_owner")
      ? [{ href: "/vendor", label: "Vendor workspace", match: "prefix" as const }]
      : []),
    ...(me.roles.includes("admin")
      ? [{ href: "/admin", label: "Admin console", match: "prefix" as const }]
      : []),
  ];

  return (
    <DashboardShell
      title={<RoleGreeting firstName={me.firstName} roles={me.roles} />}
      subtitle={me.email}
      links={links}
      footer={
        <div className="space-y-2">
          <Link href="/shop" className="block rounded-xl px-3 py-2 text-stone-500 hover:bg-stone-100">
            Continue shopping
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
