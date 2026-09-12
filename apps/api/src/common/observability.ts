/** Observability hooks — wire real SDKs via env without hard dependency. */

export function initObservability() {
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    console.log(`[otel] Sentry DSN configured (${sentryDsn.slice(0, 12)}…) — install @sentry/node to activate`);
  }
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    console.log(
      `[otel] OTLP endpoint ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT} — install @opentelemetry/sdk-node to activate`,
    );
  }
}

export function captureException(err: unknown, context?: Record<string, unknown>) {
  console.error("[error]", err, context ?? {});
}

/** Rewrite absolute local app URLs to host-relative paths so LAN/IP browsing works. */
export function toPublicAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)) {
      const parsed = new URL(url);
      return `${parsed.pathname}${parsed.search}`;
    }
    const app = (process.env.APP_URL ?? "").replace(/\/$/, "");
    if (app && url.startsWith(app)) {
      const rest = url.slice(app.length);
      return rest.startsWith("/") ? rest : `/${rest}`;
    }
  } catch {
    /* keep original */
  }
  return url;
}

export function cdnImageUrl(url: string | null | undefined, width = 800) {
  const normalized = toPublicAssetUrl(url);
  if (!normalized) return null;
  const base = process.env.IMAGE_CDN_BASE;
  if (!base) return normalized;
  // Generic CDN rewrite: IMAGE_CDN_BASE + encoded origin URL + width
  return `${base.replace(/\/$/, "")}/w=${width}/${encodeURIComponent(normalized)}`;
}
