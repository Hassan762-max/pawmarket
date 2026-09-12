import Link from "next/link";

export default function SellPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-4xl">Open a PawMarket shop</h1>
      <p className="mt-4 text-stone-600">
        Independent stores keep their brand. Customers check out once. You fulfill your own
        shipments and earn after commission. Admin reviews every new vendor before selling is
        enabled.
      </p>
      <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-stone-700">
        <li>Create or sign in to a PawMarket account</li>
        <li>Complete vendor onboarding (business, store, payout, documents)</li>
        <li>Wait for Admin approval</li>
        <li>Publish products and fulfill vendor orders</li>
      </ol>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/register" className="rounded-full bg-brand-700 px-5 py-2 text-white">
          Create account
        </Link>
        <Link href="/vendor/onboarding" className="rounded-full border px-5 py-2">
          Start onboarding
        </Link>
        <Link href="/login" className="rounded-full border px-5 py-2">
          Vendor sign in
        </Link>
      </div>
      <p className="mt-6 text-sm text-stone-500">
        Demo pending vendor: vendor.pending@pawmarket.local / Password123!
      </p>
    </div>
  );
}
