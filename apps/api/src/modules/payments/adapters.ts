import { createHmac } from "crypto";
import { Injectable } from "@nestjs/common";
import {
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentPort,
  WebhookResult,
} from "./payment.port";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** JazzCash datetime: YYYYMMDDHHmmss */
export function jazzDate(d = new Date()) {
  return (
    `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}` +
    `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`
  );
}

/** HMAC-SHA256 over IntegritySalt&sorted(pp_* values) */
export function jazzSecureHash(salt: string, fields: Record<string, string>) {
  const keys = Object.keys(fields)
    .filter((k) => k.startsWith("pp_") && fields[k] !== "" && k !== "pp_SecureHash")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const payload = [salt, ...keys.map((k) => fields[k])].join("&");
  return createHmac("sha256", salt).update(payload).digest("hex").toUpperCase();
}

function liveEnabled() {
  return (process.env.PAYMENT_LIVE ?? "false").toLowerCase() === "true";
}

@Injectable()
export class StripeTestAdapter implements PaymentPort {
  readonly name = "stripe_test";

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const providerRef = `pi_test_${input.orderId.slice(0, 8)}_${Date.now()}`;
    return {
      provider: this.name,
      providerRef,
      status: "CAPTURED",
      clientSecret: `${providerRef}_secret_test`,
    };
  }

  async refund(providerRef: string, amount: number) {
    return { providerEventId: `re_test_${providerRef}_${amount}_${Date.now()}` };
  }

  async parseWebhook(
    _headers: Record<string, string | undefined>,
    body: unknown,
  ): Promise<WebhookResult> {
    const b = (body ?? {}) as Record<string, unknown>;
    const providerEventId = String(b.id ?? `evt_test_${Date.now()}`);
    const data = (b.data as { object?: Record<string, unknown> } | undefined)?.object ?? b;
    return {
      providerEventId,
      providerRef: String(data["id"] ?? data["providerRef"] ?? ""),
      type: String(b.type ?? "payment_intent.succeeded"),
      amount: Number(data["amount"] ?? 0),
      status: "CAPTURED",
      raw: body,
    };
  }
}

@Injectable()
export class CodAdapter implements PaymentPort {
  readonly name = "cod";

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      provider: this.name,
      providerRef: `cod_${input.orderId}`,
      status: "PENDING_COLLECTION",
    };
  }

  async refund(providerRef: string, amount: number) {
    return { providerEventId: `cod_refund_${providerRef}_${amount}` };
  }

  async parseWebhook(): Promise<WebhookResult> {
    throw new Error("COD has no webhook");
  }
}

/** JazzCash wallet / mobile account */
@Injectable()
export class JazzCashAdapter implements PaymentPort {
  readonly name = "jazzcash";

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const providerRef = `JC${Date.now()}${input.orderId.replace(/-/g, "").slice(0, 8)}`.slice(0, 20);
    const merchantId = process.env.JAZZCASH_MERCHANT_ID ?? "";
    const password = process.env.JAZZCASH_PASSWORD ?? "";
    const salt = process.env.JAZZCASH_INTEGRITY_SALT ?? "";
    const returnUrl =
      process.env.JAZZCASH_RETURN_URL ??
      `${process.env.APP_URL ?? "http://localhost:3000"}/checkout/return?provider=jazzcash`;
    const postUrl =
      process.env.JAZZCASH_POST_URL ??
      (liveEnabled()
        ? "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform"
        : "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform");

    if (!liveEnabled() || !merchantId || !password || !salt) {
      return {
        provider: this.name,
        providerRef,
        status: "CAPTURED",
        mode: "sandbox",
        message: "JazzCash sandbox — set PAYMENT_LIVE=true + JAZZCASH_* keys for real redirect.",
      };
    }

    const txnDate = jazzDate();
    const expiry = jazzDate(new Date(Date.now() + 60 * 60 * 1000));
    const fields: Record<string, string> = {
      pp_Version: "1.1",
      pp_TxnType: "MWALLET",
      pp_Language: "EN",
      pp_MerchantID: merchantId,
      pp_Password: password,
      pp_TxnRefNo: providerRef,
      pp_Amount: String(input.amount),
      pp_TxnCurrency: input.currency || "PKR",
      pp_TxnDateTime: txnDate,
      pp_BillReference: input.orderId.slice(0, 20),
      pp_Description: `PawMarket order ${input.orderId.slice(0, 8)}`,
      pp_TxnExpiryDateTime: expiry,
      pp_ReturnURL: returnUrl,
      ppmpf_1: input.metadata?.phone ?? "",
    };
    fields.pp_SecureHash = jazzSecureHash(salt, fields);

    return {
      provider: this.name,
      providerRef,
      status: "REQUIRES_PAYMENT",
      mode: "live",
      redirectUrl: postUrl,
      formFields: fields,
    };
  }

  async refund(providerRef: string, amount: number) {
    return { providerEventId: `jc_refund_${providerRef}_${amount}_${Date.now()}` };
  }

  async parseWebhook(
    _headers: Record<string, string | undefined>,
    body: unknown,
  ): Promise<WebhookResult> {
    const b = (body ?? {}) as Record<string, string>;
    const responseCode = String(b.pp_ResponseCode ?? b.pp_ResponseCode ?? "");
    const ok = responseCode === "000";
    return {
      providerEventId: `jc_${b.pp_TxnRefNo ?? Date.now()}_${responseCode}`,
      providerRef: String(b.pp_TxnRefNo ?? ""),
      type: ok ? "payment.succeeded" : "payment.failed",
      amount: Number(b.pp_Amount ?? 0),
      status: ok ? "CAPTURED" : "FAILED",
      raw: body,
    };
  }
}

/** EasyPaisa mobile wallet / OTC-style checkout */
@Injectable()
export class EasyPaisaAdapter implements PaymentPort {
  readonly name = "easypaisa";

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const providerRef = `EP${Date.now()}${input.orderId.replace(/-/g, "").slice(0, 8)}`.slice(0, 20);
    const storeId = process.env.EASYPAISA_STORE_ID ?? "";
    const hashKey = process.env.EASYPAISA_HASH_KEY ?? "";
    const postBackUrl =
      process.env.EASYPAISA_POSTBACK_URL ??
      `${process.env.APP_URL ?? "http://localhost:3000"}/checkout/return?provider=easypaisa`;
    const postUrl =
      process.env.EASYPAISA_POST_URL ??
      (liveEnabled()
        ? "https://easypay.easypaisa.com.pk/easypay/Index.jsf"
        : "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf");

    if (!liveEnabled() || !storeId || !hashKey) {
      return {
        provider: this.name,
        providerRef,
        status: "CAPTURED",
        mode: "sandbox",
        message: "EasyPaisa sandbox — set PAYMENT_LIVE=true + EASYPAISA_* keys for real redirect.",
      };
    }

    // Amount for EasyPaisa hosted is typically major units with 2 decimals
    const amountMajor = (input.amount / 100).toFixed(2);
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const raw = `${storeId}${providerRef}${amountMajor}${postBackUrl}${expiryDate}`;
    const merchantHashedReq = createHmac("sha256", hashKey).update(raw).digest("hex");

    return {
      provider: this.name,
      providerRef,
      status: "REQUIRES_PAYMENT",
      mode: "live",
      redirectUrl: postUrl,
      formFields: {
        storeId,
        amount: amountMajor,
        postBackURL: postBackUrl,
        orderRefNum: providerRef,
        expiryDate,
        autoRedirect: "1",
        paymentMethod: "MA_PAYMENT_METHOD",
        merchantHashedReq,
        mobileAccountNo: input.metadata?.phone ?? "",
      },
    };
  }

  async refund(providerRef: string, amount: number) {
    return { providerEventId: `ep_refund_${providerRef}_${amount}_${Date.now()}` };
  }

  async parseWebhook(
    _headers: Record<string, string | undefined>,
    body: unknown,
  ): Promise<WebhookResult> {
    const b = (body ?? {}) as Record<string, string>;
    const status = String(b.status ?? b.transactionStatus ?? "").toLowerCase();
    const ok = status === "success" || status === "paid" || b.responseCode === "0000";
    return {
      providerEventId: `ep_${b.orderRefNum ?? b.transactionId ?? Date.now()}`,
      providerRef: String(b.orderRefNum ?? b.transactionId ?? ""),
      type: ok ? "payment.succeeded" : "payment.failed",
      amount: Math.round(Number(b.amount ?? 0) * 100),
      status: ok ? "CAPTURED" : "FAILED",
      raw: body,
    };
  }
}

/**
 * Credit / debit card.
 * Live: uses JazzCash hosted page with txn type for cards when JazzCash keys exist,
 * else Stripe if STRIPE_SECRET_KEY is set; otherwise sandbox capture.
 */
@Injectable()
export class CardAdapter implements PaymentPort {
  readonly name = "card";

  constructor(private readonly jazzcash: JazzCashAdapter) {}

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
    const jazzId = process.env.JAZZCASH_MERCHANT_ID ?? "";

    if (liveEnabled() && jazzId) {
      const base = await this.jazzcash.createIntent(input);
      if (base.formFields) {
        base.formFields.pp_TxnType = process.env.JAZZCASH_CARD_TXN_TYPE ?? "MPAY";
        if (base.formFields.pp_SecureHash && process.env.JAZZCASH_INTEGRITY_SALT) {
          const { pp_SecureHash: _drop, ...rest } = base.formFields;
          base.formFields.pp_SecureHash = jazzSecureHash(process.env.JAZZCASH_INTEGRITY_SALT, rest);
        }
      }
      return { ...base, provider: this.name };
    }

    if (liveEnabled() && stripeKey) {
      // Placeholder: wire Stripe PaymentIntents when key is present (PCI via Stripe Elements later)
      const providerRef = `pi_live_${input.orderId.slice(0, 8)}_${Date.now()}`;
      return {
        provider: "stripe",
        providerRef,
        status: "REQUIRES_PAYMENT",
        mode: "live",
        clientSecret: `${providerRef}_pending_stripe_elements`,
        message: "Use Stripe Elements with this client secret on the pay page.",
      };
    }

    const providerRef = `card_sandbox_${input.orderId.slice(0, 8)}_${Date.now()}`;
    return {
      provider: this.name,
      providerRef,
      status: "CAPTURED",
      mode: "sandbox",
      message: "Card sandbox — add JAZZCASH_* or STRIPE_SECRET_KEY + PAYMENT_LIVE=true for live cards.",
    };
  }

  async refund(providerRef: string, amount: number) {
    return { providerEventId: `card_refund_${providerRef}_${amount}_${Date.now()}` };
  }

  async parseWebhook(
    headers: Record<string, string | undefined>,
    body: unknown,
  ): Promise<WebhookResult> {
    return this.jazzcash.parseWebhook(headers, body);
  }
}
