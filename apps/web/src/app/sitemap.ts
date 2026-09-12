import type { MetadataRoute } from "next";
import { API_URL } from "@/lib/api";

/** Build-time static generation hangs if the API is asleep/unreachable — generate on request instead. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticRoutes: MetadataRoute.Sitemap = ["", "/shop", "/categories", "/stores", "/sell", "/deals", "/new"].map(
    (path) => ({ url: `${base}${path}`, changeFrequency: "daily", priority: path === "" ? 1 : 0.7 }),
  );

  try {
    const res = await fetch(`${API_URL}/sitemap-data`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return staticRoutes;
    const json = await res.json();
    const data = json.data ?? json;
    return [
      ...staticRoutes,
      ...(data.products ?? []).map((p: { slug: string; updatedAt: string }) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...(data.stores ?? []).map((s: { slug: string }) => ({
        url: `${base}/stores/${s.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...(data.categories ?? []).map((c: { slug: string }) => ({
        url: `${base}/categories/${c.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
