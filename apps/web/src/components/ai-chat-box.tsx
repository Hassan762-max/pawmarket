"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { api, mediaUrl, money } from "@/lib/api";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: { name: string; slug: string; image: string | null; priceFrom: number; store: string }[];
};

type ChatResponse = {
  reply: string;
  suggestions?: string[];
  products?: Msg["products"];
};

const WELCOME: Msg = {
  id: "welcome",
  role: "assistant",
  content:
    "Assalam o Alaikum! Budget poochho (e.g. food under 5000) ya starter kit: “cat / dog / hamster / parrot / fish rakhne ke liye kya chahiye?” — checklist + total cost milay ga.",
};

const STARTER_PETS = [
  { label: "Cat", prompt: "Cat rakhne ke liye kya chahiye?" },
  { label: "Dog", prompt: "Dog rakhne ke liye kya chahiye aur kitna total?" },
  { label: "Hamster", prompt: "Hamster rakhne ke liye kya kharidna padega?" },
  { label: "Parrot", prompt: "Parrot rakhne ke liye kya chahiye aur total?" },
  { label: "Fish", prompt: "Fish aquarium ke liye kya chahiye aur kitna total?" },
  { label: "Rabbit", prompt: "Rabbit rakhne ke liye kya chahiye?" },
];

export function AiChatBox() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [suggestions, setSuggestions] = useState([
    "Cat rakhne ke liye kya chahiye?",
    "Dog starter kit total?",
    "Food under 5,000",
    "Hamster ke liye kya kharidna?",
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: trimmed };
    const nextHistory = [...messages, userMsg]
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const res = await api<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory.slice(-8),
        }),
      });
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: res.reply,
          products: res.products,
        },
      ]);
      if (res.suggestions?.length) setSuggestions(res.suggestions);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: e instanceof Error ? e.message : "Chat abhi available nahi — thodi der baad try karein.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="flex h-[min(560px,72vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-brand-900/10 animate-fade-up">
          <div className="flex items-center justify-between bg-gradient-to-r from-brand-800 to-brand-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
                AI
              </span>
              <div>
                <p className="font-display text-base leading-tight">PawMarket AI</p>
                <p className="text-[11px] text-brand-100">Pet shopping assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-2 py-1 text-lg leading-none text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-sand-50/80 px-3 py-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-soft ${
                    m.role === "user"
                      ? "rounded-br-md bg-brand-700 text-white"
                      : "rounded-bl-md bg-white text-ink-900 ring-1 ring-stone-200/80"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.products?.length ? (
                    <div className="mt-2 space-y-1.5 border-t border-stone-100 pt-2">
                      {m.products.slice(0, 6).map((p) => (
                        <Link
                          key={p.slug}
                          href={`/products/${p.slug}`}
                          className="flex items-center gap-2 rounded-xl bg-sand-50 p-1.5 transition hover:bg-brand-50"
                          onClick={() => setOpen(false)}
                        >
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(p.image)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-sand-200" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-ink-900">{p.name}</p>
                            <p className="text-[11px] text-brand-800">{money(p.priceFrom)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-stone-500 ring-1 ring-stone-200/80">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-stone-100 bg-white px-3 py-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Starter kit — kya kharidna padega?
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STARTER_PETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(p.prompt)}
                  className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-medium text-brand-800 transition hover:bg-brand-100 disabled:opacity-40"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {!busy && suggestions.length ? (
            <div className="flex gap-2 overflow-x-auto border-t border-stone-100 bg-white px-3 py-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="shrink-0 rounded-full border border-stone-200 bg-sand-50 px-3 py-1 text-[11px] font-medium text-stone-700 transition hover:border-brand-300 hover:text-brand-800"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="flex gap-2 border-t border-stone-100 bg-white p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. cat rakhne ke liye kya chahiye?"
              className="min-w-0 flex-1 rounded-full border border-stone-200 bg-sand-50 px-4 py-2.5 text-sm outline-none ring-brand-500/30 transition focus:border-brand-500 focus:ring-2"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2 rounded-full bg-brand-700 px-4 py-3 text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-brand-800"
        aria-label={open ? "Close AI chat" : "Open AI chat"}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
          {open ? "×" : "AI"}
        </span>
        <span className="pr-1 text-sm font-medium">{open ? "Close" : "Ask PawMarket AI"}</span>
      </button>
    </div>
  );
}
