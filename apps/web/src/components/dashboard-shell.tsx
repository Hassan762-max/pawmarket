"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export type DashLink = { href: string; label: string; match?: "exact" | "prefix" };

const ROLE_STYLES = {
  admin: { label: "ADMIN", className: "text-rose-600" },
  vendor: { label: "VENDOR", className: "text-amber-600" },
  customer: { label: "CUSTOMER", className: "text-brand-700" },
} as const;

export function dashboardRole(roles: string[]) {
  if (roles.includes("admin")) return ROLE_STYLES.admin;
  if (roles.includes("vendor_owner") || roles.includes("vendor_staff")) return ROLE_STYLES.vendor;
  return ROLE_STYLES.customer;
}

export function RoleGreeting({ firstName, roles }: { firstName: string; roles: string[] }) {
  const role = dashboardRole(roles);
  return (
    <span className="inline-flex max-w-full items-baseline gap-1.5 whitespace-nowrap">
      Hi, {firstName}
      <span className={`font-sans text-[10px] font-semibold uppercase leading-none tracking-[0.12em] ${role.className}`}>
        ({role.label})
      </span>
    </span>
  );
}

export function DashboardShell({
  eyebrow,
  title,
  subtitle,
  badge,
  links,
  footer,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  badge?: string | null;
  links: DashLink[];
  footer?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  function active(link: DashLink) {
    if (link.match === "prefix") {
      if (link.href === "/admin" || link.href === "/vendor" || link.href === "/account") {
        return pathname === link.href;
      }
      return pathname === link.href || pathname.startsWith(`${link.href}/`);
    }
    return pathname === link.href;
  }

  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(36,159,126,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(230,213,188,0.45),_transparent_45%)]"
      />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[240px_1fr]">
        <aside className="h-fit space-y-5 rounded-3xl border border-stone-200/80 bg-white/80 p-5 shadow-sm backdrop-blur md:sticky md:top-24">
          <div>
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p>
            ) : null}
            <p className={`font-display text-2xl leading-tight text-stone-900 ${eyebrow ? "mt-1" : ""}`}>
              {title}
            </p>
            {subtitle ? <p className="mt-1 text-sm text-stone-500">{subtitle}</p> : null}
            {badge ? (
              <p className="mt-3 inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-900">
                {badge.replaceAll("_", " ")}
              </p>
            ) : null}
          </div>
          <nav className="flex flex-col gap-0.5 text-sm">
            {links.map((l) => {
              const on = active(l);
              return (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  className={`rounded-xl px-3 py-2.5 transition ${
                    on ? "bg-brand-700 font-medium text-white shadow-sm" : "text-stone-700 hover:bg-brand-50"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          {footer ? <div className="border-t border-stone-100 pt-4 text-sm">{footer}</div> : null}
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function DashStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 font-display text-3xl text-stone-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}

export function DashPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-stone-900">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-stone-500">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
