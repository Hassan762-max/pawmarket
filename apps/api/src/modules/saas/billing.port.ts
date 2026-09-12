export type BillingCheckoutInput = {
  vendorId: string;
  planSlug: string;
  amount: number;
};

export type BillingCheckoutResult = {
  provider: string;
  providerCustomerId: string;
  providerSubId: string;
  status: "ACTIVE" | "TRIALLING" | "PAST_DUE";
  currentPeriodEnd: Date;
};

export interface BillingPort {
  readonly name: string;
  startSubscription(input: BillingCheckoutInput): Promise<BillingCheckoutResult>;
  cancelSubscription(providerSubId: string, atPeriodEnd: boolean): Promise<{ status: string }>;
}

/** No live Stripe Billing — local stub for SaaS phase. */
export class StubBillingAdapter implements BillingPort {
  readonly name = "stub";

  async startSubscription(input: BillingCheckoutInput): Promise<BillingCheckoutResult> {
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    return {
      provider: this.name,
      providerCustomerId: `cus_stub_${input.vendorId.slice(0, 8)}`,
      providerSubId: `sub_stub_${input.planSlug}_${Date.now()}`,
      status: input.amount === 0 ? "ACTIVE" : "ACTIVE",
      currentPeriodEnd: end,
    };
  }

  async cancelSubscription(_providerSubId: string, atPeriodEnd: boolean) {
    return { status: atPeriodEnd ? "CANCEL_SCHEDULED" : "CANCELLED" };
  }
}
