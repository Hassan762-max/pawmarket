"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const VK = "pm_ab_v";

export function HeroAb({ fallback }: { fallback: string }) {
  const [text, setText] = useState(fallback);

  useEffect(() => {
    let v = localStorage.getItem(VK);
    if (!v) {
      v = Math.random().toString(36).slice(2);
      localStorage.setItem(VK, v);
    }
    api<{ variant: string; visitorKey: string }>(`/experiments/home_hero?v=${v}`)
      .then((r) => {
        if (r.variant === "B") setText("Join thousands of pet parents — free shipping on first order*");
      })
      .catch(() => undefined);
  }, []);

  return <p className="mt-4 max-w-lg text-base leading-relaxed text-stone-100/90 md:text-lg">{text}</p>;
}
