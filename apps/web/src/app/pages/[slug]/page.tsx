import { API_URL } from "@/lib/api";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/cms/${slug}`, { cache: "no-store" });
    const json = await res.json();
    const page = json.data ?? json;
    return { title: `${page.title} — PawMarket` };
  } catch {
    return { title: "Page — PawMarket" };
  }
}

export default async function CmsPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await fetch(`${API_URL}/cms/${slug}`, { cache: "no-store" });
  if (!res.ok) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-3xl">Not found</h1>
        <Link href="/">Home</Link>
      </div>
    );
  }
  const json = await res.json();
  const page = json.data ?? json;
  const html = typeof page.content?.html === "string" ? page.content.html : `<pre>${JSON.stringify(page.content, null, 2)}</pre>`;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-4xl">{page.title}</h1>
      <div className="prose mt-6 text-stone-700" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
