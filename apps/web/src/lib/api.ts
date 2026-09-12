function resolveApiUrl() {
  const fallback = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
  if (typeof window === "undefined") return fallback;
  const { protocol, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return fallback;
  // Same host on LAN/IP — talk to the API port on this machine
  return `${protocol}//${hostname}:3001/api/v1`;
}

export const API_URL = resolveApiUrl();

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string };
};

export const AUTH_KEY = "pawmarket_token";

export function money(paisas: number, currency = process.env.NEXT_PUBLIC_CURRENCY ?? "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paisas / 100);
}

function isSessionDead(status: number, error?: { code?: string }) {
  if (status !== 401) return false;
  // Login failures must surface to the form — everything else with a bearer token is a dead session.
  return (error?.code ?? "").toUpperCase() !== "INVALID_CREDENTIALS";
}

/** Clear stale auth and send the user to login. */
export function requireLogin(next?: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  const path = next ?? `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?next=${encodeURIComponent(path)}`;
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${resolveApiUrl()}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });
  return parseApiResponse<T>(res, Boolean(token));
}

/** Upload a file (multipart). Do not set JSON content-type. */
export async function uploadFile(
  file: File,
  token?: string | null,
): Promise<{ url: string; filename: string }> {
  const auth = token ?? (typeof window !== "undefined" ? localStorage.getItem(AUTH_KEY) : null);
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${resolveApiUrl()}/uploads`, {
    method: "POST",
    headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    body,
    cache: "no-store",
  });
  return parseApiResponse<{ url: string; filename: string }>(res, Boolean(auth));
}

/** Turn API/media paths into browser-usable URLs (LAN/IP safe). */
export function mediaUrl(url: string | null | undefined) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  // Stale absolute localhost URLs from seed → same-origin relative path
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      /* fall through */
    }
  }
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return url;
  const origin = resolveApiUrl().replace(/\/api\/v1\/?$/, "");
  return `${origin}/${url}`;
}

async function parseApiResponse<T>(res: Response, hadToken: boolean): Promise<T> {
  const json = (await res.json()) as ApiEnvelope<T> & T;
  if (!res.ok || (json as ApiEnvelope<T>).success === false) {
    const error = (json as ApiEnvelope<T>).error;
    const message =
      error?.message ??
      (typeof json === "object" && json && "message" in json
        ? String((json as { message: string }).message)
        : "Request failed");

    if (hadToken && typeof window !== "undefined" && isSessionDead(res.status, error)) {
      requireLogin();
      return new Promise<T>(() => {});
    }

    throw new Error(message);
  }
  if ((json as ApiEnvelope<T>).data !== undefined) {
    const envelope = json as ApiEnvelope<T> & { meta?: unknown };
    if (envelope.meta) {
      return { ...(envelope.data as object), meta: envelope.meta } as T;
    }
    return envelope.data as T;
  }
  return json as T;
}
