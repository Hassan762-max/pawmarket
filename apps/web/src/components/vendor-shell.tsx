"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { AUTH_KEY, api, requireLogin } from "@/lib/api";
import { DashboardShell, RoleGreeting } from "@/components/dashboard-shell";

type Me = {
  firstName: string;
  roles: string[];
  vendorStatus: string | null;
  stores: { name: string; status: string }[];
};

const links = [
  { href: "/vendor", label: "Overview", match: "exact" as const },
  { href: "/vendor/notifications", label: "Notifications", match: "prefix" as const },
  { href: "/vendor/products", label: "Products", match: "prefix" as const },
  { href: "/vendor/products/new", label: "Add product", match: "exact" as const },
  { href: "/vendor/inventory", label: "Inventory", match: "prefix" as const },
  { href: "/vendor/store", label: "Store", match: "prefix" as const },
  { href: "/vendor/orders", label: "Orders", match: "prefix" as const },
  { href: "/vendor/earnings", label: "Earnings", match: "prefix" as const },
  { href: "/vendor/analytics", label: "Analytics", match: "prefix" as const },
  { href: "/vendor/subscription", label: "Plan", match: "prefix" as const },
  { href: "/vendor/staff", label: "Staff", match: "prefix" as const },
  { href: "/vendor/onboarding", label: "Onboarding", match: "prefix" as const },
];

export function VendorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      requireLogin("/vendor");
      return;
    }
    api<Me>("/auth/me", { token }).then(setMe);
  }, []);

  if (!me) {
    return <p className="px-4 py-16 text-center text-stone-600">Loading vendor workspace…</p>;
  }

  const needsOnboarding =
    !me.vendorStatus ||
    me.vendorStatus === "PENDING_ONBOARDING" ||
    me.vendorStatus === "REJECTED";

  return (
    <DashboardShell
      title={<RoleGreeting firstName={me.firstName} roles={me.roles} />}
      subtitle={me.stores[0]?.name ?? "Your shop"}
      badge={me.vendorStatus}
      links={links}
      footer={
        <Link href="/" className="block rounded-xl px-3 py-2 text-stone-500 hover:bg-stone-100">
          ← Marketplace
        </Link>
      }
    >
      {needsOnboarding && pathname !== "/vendor/onboarding" ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
          Finish onboarding so Admin can review your shop.{" "}
          <Link href="/vendor/onboarding" className="font-medium text-brand-800">
            Continue application
          </Link>
        </div>
      ) : null}
      {me.vendorStatus === "PENDING_REVIEW" ? (
        <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm">
          Your application is waiting for Admin approval. You can update store details, but you cannot
          sell yet. You&apos;ll get a notification when it&apos;s approved.
        </div>
      ) : null}
      {me.vendorStatus === "SUSPENDED" ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm">
          This vendor account is suspended. Contact support if you believe this is a mistake.
        </div>
      ) : null}
      {children}
    </DashboardShell>
  );
}
