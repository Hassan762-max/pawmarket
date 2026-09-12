"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_KEY } from "@/lib/api";
import { NotificationBell } from "@/components/notification-bell";
import { BrandLogo } from "@/components/brand-logo";

export function Header() {
  const [q, setQ] = useState("");
  const [authed, setAuthed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(localStorage.getItem(AUTH_KEY)));
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-brand-900/10 bg-sand-50/85 shadow-soft backdrop-blur-xl"
          : "border-b border-transparent bg-sand-50/60 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5">
        <BrandLogo size="md" />
        <nav className="hidden items-center gap-5 text-sm text-stone-600 md:flex">
          {[
            ["/shop", "Shop"],
            ["/categories", "Categories"],
            ["/stores", "Stores"],
            ["/deals", "Deals"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-brand-600 after:transition-all hover:text-brand-800 hover:after:w-full">
              {label}
            </Link>
          ))}
        </nav>
        <form className="ml-auto hidden max-w-md flex-1 md:block" action="/search">
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pets, food, stores…"
            className="w-full rounded-full border border-stone-200/80 bg-white/80 px-4 py-2 text-sm outline-none ring-brand-500/30 transition focus:border-brand-500 focus:ring-2"
          />
        </form>
        <div className="ml-auto flex items-center gap-1.5 text-sm md:ml-0 md:gap-2">
          <Link href="/cart" className="rounded-full px-3 py-1.5 transition hover:bg-brand-100/80">
            Cart
          </Link>
          {authed ? <NotificationBell /> : null}
          {authed ? (
            <Link href="/account" className="rounded-full px-3 py-1.5 transition hover:bg-brand-100/80">
              Account
            </Link>
          ) : (
            <Link href="/login" className="rounded-full px-3 py-1.5 transition hover:bg-brand-100/80">
              Sign in
            </Link>
          )}
          <Link
            href="/sell"
            className="rounded-full bg-brand-700 px-3.5 py-1.5 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-lift"
          >
            Sell
          </Link>
        </div>
      </div>
    </header>
  );
}
