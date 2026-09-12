export type PaymentIntentInput = {
  orderId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
};

export type PaymentIntentResult = {
  provider: string;
  providerRef: string;
  status: "REQUIRES_PAYMENT" | "CAPTURED" | "PENDING_COLLECTION" | "FAILED";
  clientSecret?: string;
  /** Hosted checkout POST URL (JazzCash / EasyPaisa) */
  redirectUrl?: string;
  /** Hidden form fields for gateway POST */
  formFields?: Record<string, string>;
  mode?: "sandbox" | "live";
  message?: string;
};

export type WebhookResult = {
  providerEventId: string;
  providerRef: string;
  type: string;
  amount: number;
  status: "CAPTURED" | "FAILED" | "CANCELLED";
  raw: unknown;
};

export type PaymentMethod = "jazzcash" | "easypaisa" | "card" | "cod";

export interface PaymentPort {
  readonly name: string;
  createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  refund(providerRef: string, amount: number): Promise<{ providerEventId: string }>;
  parseWebhook(headers: Record<string, string | undefined>, body: unknown): Promise<WebhookResult>;
}
