import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    }
    next();
  }
}

/** Simple in-process rate limit (per IP). Prefer Redis/edge for multi-replica. */
export function createRateLimit(windowMs = 60_000, max = 120) {
  const hits = new Map<string, { count: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "local");
    const now = Date.now();
    const cur = hits.get(ip);
    if (!cur || now > cur.reset) {
      hits.set(ip, { count: 1, reset: now + windowMs });
      return next();
    }
    cur.count += 1;
    if (cur.count > max) {
      res.status(429).json({
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests. Try again shortly." },
      });
      return;
    }
    next();
  };
}

export function assertProdSecrets() {
  if (process.env.NODE_ENV !== "production") return;
  const required = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
  const missing = required.filter((k) => !process.env[k] || String(process.env[k]).includes("change-me"));
  if (missing.length) {
    throw new Error(`Missing/insecure production secrets: ${missing.join(", ")}`);
  }
  if ((process.env.JWT_SECRET?.length ?? 0) < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
}
