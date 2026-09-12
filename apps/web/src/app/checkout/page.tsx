"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_KEY, api, money } from "@/lib/api";

type Address = {
  id: string;
  label: string;
  line1: string;
  city: string;
  region: string;
  postalCode: string;
  isDefault: boolean;
};

type Quote = {
  grandTotal: number;
  taxTotal: number;
  shippingTotal: number;
  cart: { merchandiseTotal: number; groups: { store: { name: string }; subtotal: number }[] };
  vendorSplits: { store: { name: string }; merchandise: number; shipping: number }[];
};

type PayMethod = "jazzcash" | "easypaisa" | "card" | "cod";

type PaymentCheckout = {
  method: PayMethod;
  provider: string;
  status: string;
  mode?: string;
  message?: string;
  redirectUrl?: string;
  formFields?: Record<string, string>;
};

type Order = {
  id: string;
  number: string;
  grandTotal: number;
  vendorOrders: { number: string; store: { name: string }; merchandiseTotal: number }[];
  shippingAddress?: { line1: string; city: string; region: string; postalCode: string };
  paymentCheckout?: PaymentCheckout;
  payment?: { provider: string; status: string };
};

const METHODS: { id: PayMethod; title: string; blurb: string; needsPhone?: boolean }[] = [
  { id: "jazzcash", title: "JazzCash", blurb: "JazzCash mobile wallet (PKR)", needsPhone: true },
  { id: "easypaisa", title: "EasyPaisa", blurb: "EasyPaisa mobile account (PKR)", needsPhone: true },
  { id: "card", title: "Credit / Debit Card", blurb: "Visa, Mastercard, bank cards" },
  { id: "cod", title: "Cash on delivery", blurb: "Pay when the parcel arrives" },
];

function postToGateway(url: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  for (const [k, v] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

function isPkMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  return /^03\d{9}$/.test(digits);
}

export default function CheckoutPage() {
  const [method, setMethod] = useState<PayMethod>("jazzcash");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [cartEmpty, setCartEmpty] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) {
      setLoading(false);
      window.location.href = "/login?next=/checkout";
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const errors: string[] = [];

      const [addrRes, quoteRes, methodsRes] = await Promise.allSettled([
        api<Address[]>("/addresses", { token }),
        api<Quote>("/checkout/quote", { token }),
        api<{ live: boolean }>("/payments/methods"),
      ]);

      if (cancelled) return;

      const sessionDead = [addrRes, quoteRes].some(
        (r) =>
          r.status === "rejected" &&
          r.reason instanceof Error &&
          /session expired|unauthorized|sign in again/i.test(r.reason.message),
      );
      if (sessionDead) {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = "/login?next=/checkout";
        return;
      }

      if (addrRes.status === "fulfilled") {
        setAddresses(addrRes.value);
        setAddressId(addrRes.value.find((a) => a.isDefault)?.id ?? addrRes.value[0]?.id ?? "");
      } else {
        errors.push(addrRes.reason instanceof Error ? addrRes.reason.message : "Addresses load nahi hui.");
      }

      if (quoteRes.status === "fulfilled") {
        setQuote(quoteRes.value);
        setCartEmpty(false);
      } else {
        const msg = quoteRes.reason instanceof Error ? quoteRes.reason.message : "Quote failed";
        if (/cart is empty/i.test(msg)) {
          setCartEmpty(true);
          setQuote(null);
        } else if (/Foreign key|Cart_userId/i.test(msg)) {
          localStorage.removeItem(AUTH_KEY);
          window.location.href = "/login?next=/checkout";
          return;
        } else {
          errors.push(msg);
        }
      }

      if (methodsRes.status === "fulfilled") {
        setLive(Boolean(methodsRes.value.live));
      }

      setError(errors[0] ?? "");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function place() {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return;
    setError("");

    if (!addressId) {
      setError("Pehle shipping address add karein.");
      return;
    }
    if (!quote) {
      setError(cartEmpty ? "Cart khali hai — pehle shop se item add karein." : "Total load nahi hua. Page refresh karein.");
      return;
    }
    if ((method === "jazzcash" || method === "easypaisa") && !isPkMobile(phone)) {
      setError("JazzCash / EasyPaisa ke liye mobile 03XXXXXXXXX (11 digits) likhein.");
      return;
    }

    setPlacing(true);
    try {
      // Re-quote so clientGrandTotal matches server (avoids PRICE_CHANGED)
      const fresh = await api<Quote>("/checkout/quote", { token });
      setQuote(fresh);
      const created = await api<Order>("/checkout", {
        method: "POST",
        token,
        body: JSON.stringify({
          paymentMethod: method,
          addressId,
          phone: phone.replace(/\D/g, "") || undefined,
          clientGrandTotal: couponCode ? undefined : fresh.grandTotal,
          couponCode: couponCode || undefined,
        }),
      });
      const checkout = created.paymentCheckout;
      if (checkout?.redirectUrl && checkout.formFields && checkout.status === "REQUIRES_PAYMENT") {
        postToGateway(checkout.redirectUrl, checkout.formFields);
        return;
      }
      setOrder(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setPlacing(false);
    }
  }

  if (order) {
    const pay = order.paymentCheckout;
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Order {order.number}</h1>
        <p className="mt-2">
          {money(order.grandTotal)} · {pay?.provider ?? order.payment?.provider ?? method}
        </p>
        <p className="mt-2 text-sm text-stone-600">
          {pay?.mode === "sandbox"
            ? "Sandbox mode: payment marked paid for demo. Live JazzCash/EasyPaisa ke liye merchant keys add karein."
            : pay?.status === "PENDING_COLLECTION"
              ? "Cash on delivery — courier par payment."
              : "Payment received."}
        </p>
        {pay?.message ? <p className="mt-2 text-xs text-stone-500">{pay.message}</p> : null}
        <ul className="mt-6 space-y-2 text-left text-sm">
          {order.vendorOrders.map((v) => (
            <li key={v.number} className="rounded-xl border bg-white p-3">
              {v.number} · {v.store.name} · {money(v.merchandiseTotal)}
            </li>
          ))}
        </ul>
        <Link href={`/account/orders/${order.id}`} className="mt-8 inline-block text-brand-800">
          Track order
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-display text-3xl">Checkout</h1>
        <p className="mt-4 text-sm text-stone-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-3xl">Checkout</h1>
      <p className="mt-2 text-sm text-stone-600">
        PKR payments · JazzCash, EasyPaisa, card
        {live ? " · live gateways on" : " · sandbox (demo)"}
      </p>

      {cartEmpty ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Cart khali hai.{" "}
          <Link href="/shop" className="font-medium underline">
            Shop se product add karein
          </Link>
          , phir JazzCash se pay karein.
        </p>
      ) : null}

      <h2 className="mt-8 font-medium">Ship to</h2>
      {addresses.length === 0 ? (
        <p className="mt-2 text-sm">
          No address. <Link href="/account/addresses">Add one</Link>
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {addresses.map((a) => (
            <li key={a.id}>
              <label className="flex cursor-pointer gap-2 rounded-xl border bg-white p-3 text-sm">
                <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                <span>
                  {a.label}: {a.line1}, {a.city} {a.region} {a.postalCode}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {quote ? (
        <div className="mt-8 space-y-1 rounded-2xl border bg-white p-4 text-sm">
          {quote.vendorSplits.map((s) => (
            <p key={s.store.name}>
              {s.store.name}: {money(s.merchandise)} + ship {money(s.shipping)}
            </p>
          ))}
          <p className="pt-2">Merchandise {money(quote.cart.merchandiseTotal)}</p>
          <p>Shipping {money(quote.shippingTotal)}</p>
          {discount ? <p>Discount −{money(discount)}</p> : null}
          <p>Tax {money(quote.taxTotal)}</p>
          <p className="text-lg font-medium">Total {money(Math.max(0, quote.grandTotal - discount))}</p>
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2 text-sm"
          placeholder="Coupon (try PAW10)"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
        />
        <button
          className="rounded-full border px-4 text-sm"
          type="button"
          onClick={async () => {
            if (!quote || !couponCode) return;
            try {
              const v = await api<{ discount: number }>("/coupons/validate", {
                method: "POST",
                body: JSON.stringify({
                  code: couponCode,
                  merchandiseTotal: quote.cart.merchandiseTotal,
                }),
              });
              setDiscount(v.discount);
              setError("");
            } catch (e) {
              setDiscount(0);
              setError(e instanceof Error ? e.message : "Coupon failed");
            }
          }}
        >
          Apply
        </button>
      </div>

      <h2 className="mt-8 font-medium">Payment method</h2>
      <div className="mt-3 space-y-2">
        {METHODS.map((m) => (
          <label
            key={m.id}
            className={`flex cursor-pointer gap-3 rounded-xl border bg-white p-3 text-sm ${
              method === m.id ? "border-brand-600 ring-1 ring-brand-600" : ""
            }`}
          >
            <input type="radio" checked={method === m.id} onChange={() => setMethod(m.id)} />
            <span>
              <span className="font-medium">{m.title}</span>
              <span className="block text-stone-500">{m.blurb}</span>
            </span>
          </label>
        ))}
      </div>

      {method === "jazzcash" || method === "easypaisa" ? (
        <label className="mt-4 block text-sm">
          Mobile number (03XXXXXXXXX)
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03001234567"
            inputMode="numeric"
            autoComplete="tel"
          />
        </label>
      ) : null}

      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
      <button
        type="button"
        onClick={place}
        disabled={!addressId || !quote || placing || cartEmpty}
        className="mt-6 w-full rounded-full bg-brand-700 px-6 py-3 text-white disabled:bg-stone-300"
      >
        {placing
          ? "Processing…"
          : method === "cod"
            ? "Place COD order"
            : `Pay with ${METHODS.find((m) => m.id === method)?.title}`}
      </button>
    </div>
  );
}
