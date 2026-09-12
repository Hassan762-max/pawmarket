import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

function flattenMessage(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    const parts = value.map((v) => flattenMessage(v, "")).filter(Boolean);
    if (parts.length) return parts.join("; ");
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.trim()) return obj.message;
    if (Array.isArray(obj.message)) return flattenMessage(obj.message, fallback);
  }
  return fallback;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    let code = "INTERNAL_ERROR";
    let message = "Something went wrong.";
    let details: unknown = undefined;
    if (typeof raw === "string") {
      message = raw;
    } else if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      message = flattenMessage(obj.message ?? obj, message);
      code = String(obj.code ?? obj.error ?? "HTTP_ERROR");
      details = obj.message ?? obj.details;
    } else if (exception instanceof Error && process.env.NODE_ENV !== "production") {
      message = exception.message || message;
      details = exception.stack;
    }
    if (status >= 500) {
      console.error("[api-error]", exception);
    }
    res.status(status).json({
      success: false,
      error: { code, message, details },
    });
  }
}
