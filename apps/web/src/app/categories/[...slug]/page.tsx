import type { Metadata } from "next";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const leaf = slug[slug.length - 1] ?? "category";
  return {
    title: `${leaf.replace(/-/g, " ")} — PawMarket`,
    description: `Shop ${leaf.replace(/-/g, " ")} from independent pet stores.`,
  };
}

export default async function CategorySlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const leaf = slug[slug.length - 1];
  redirect(`/shop?category=${encodeURIComponent(leaf)}`);
}
