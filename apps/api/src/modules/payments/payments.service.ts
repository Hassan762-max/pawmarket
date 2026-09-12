import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CardAdapter,
  CodAdapter,
  EasyPaisaAdapter,
  JazzCashAdapter,
  StripeTestAdapter,
} from "./adapters";
import { CommissionService, LedgerService } from "./commission-ledger.service";
import { InventoryService } from "../inventory/inventory.service";
import { PaymentMethod, PaymentPort } from "./payment.port";
import { VendorsService } from "../vendors/vendors.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeTestAdapter,
    private readonly cod: CodAdapter,
    private readonly jazzcash: JazzCashAdapter,
    private readonly easypaisa: EasyPaisaAdapter,
    private readonly card: CardAdapter,
    private readonly ledger: LedgerService,
    private readonly commission: CommissionService,
    private readonly inventory: InventoryService,
    private readonly vendors: VendorsService,
  ) {}

  adapter(method: PaymentMethod): PaymentPort {
    switch (method) {
      case "cod":
        return this.cod;
      case "jazzcash":
        return this.jazzcash;
      case "easypaisa":
        return this.easypaisa;
      case "card":
        return this.card;
      default:
        return this.card;
    }
  }

  listMethods() {
    const live = (process.env.PAYMENT_LIVE ?? "false").toLowerCase() === "true";
    return {
      currency: process.env.DEFAULT_CURRENCY ?? "PKR",
      live,
      methods: [
        {
          id: "jazzcash",
          label: "JazzCash",
          description: "Pay with JazzCash mobile wallet",
          needsPhone: true,
        },
        {
          id: "easypaisa",
          label: "EasyPaisa",
          description: "Pay with EasyPaisa mobile account",
          needsPhone: true,
        },
        {
          id: "card",
          label: "Credit / Debit Card",
          description: "Visa, Mastercard, and local bank cards",
          needsPhone: false,
        },
        {
          id: "cod",
          label: "Cash on delivery",
          description: "Pay when the order arrives",
          needsPhone: false,
        },
      ],
    };
  }

  async createIntentForOrder(orderId: string, method: PaymentMethod, phone?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.payment) return order.payment;

    const intent = await this.adapter(method).createIntent({
      orderId: order.id,
      amount: order.grandTotal,
      currency: order.currency,
      metadata: phone ? { phone } : undefined,
    });

    return this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: intent.provider,
        status: intent.status,
        amount: order.grandTotal,
        providerRef: intent.providerRef,
        transactions: {
          create: {
            providerEventId: `created_${intent.providerRef}`,
            type: "intent.created",
            amount: order.grandTotal,
            raw: JSON.stringify(intent),
          },
        },
      },
    });
  }

  async handleWebhook(provider: string, headers: Record<string, string | undefined>, body: unknown) {
    let adapter: PaymentPort;
    if (provider === "stripe" || provider === "stripe_test") adapter = this.stripe;
    else if (provider === "jazzcash") adapter = this.jazzcash;
    else if (provider === "easypaisa") adapter = this.easypaisa;
    else if (provider === "card") adapter = this.card;
    else throw new BadRequestException("Unknown provider");

    const event = await adapter.parseWebhook(headers, body);
    const existing = await this.prisma.paymentTransaction.findUnique({
      where: { providerEventId: event.providerEventId },
    });
    if (existing) return { ok: true, duplicate: true };

    const payment = await this.prisma.payment.findFirst({
      where: { providerRef: event.providerRef },
    });
    if (!payment) throw new NotFoundException("Payment not found for webhook");

    await this.prisma.$transaction([
      this.prisma.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          providerEventId: event.providerEventId,
          type: event.type,
          amount: event.amount || payment.amount,
          raw: JSON.stringify(event.raw),
        },
      }),
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: event.status },
      }),
      ...(event.status === "CAPTURED"
        ? [
            this.prisma.order.update({
              where: { id: payment.orderId },
              data: { status: "CONFIRMED" },
            }),
          ]
        : []),
    ]);
    return { ok: true, status: event.status };
  }

  async requestRefund(userId: string, orderId: string, amount: number, reason: string, restock = false) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { payment: true },
    });
    if (!order?.payment) throw new NotFoundException("Order/payment not found");
    if (amount <= 0 || amount > order.payment.amount) {
      throw new BadRequestException({ code: "INVALID_REFUND", message: "Invalid refund amount." });
    }
    return this.prisma.refund.create({
      data: {
        paymentId: order.payment.id,
        orderId: order.id,
        amount,
        reason,
        restock,
        status: "PENDING",
      },
    });
  }

  async adminListRefunds() {
    return this.prisma.refund.findMany({ orderBy: { createdAt: "desc" }, include: { payment: true } });
  }

  private adapterForProvider(provider: string): PaymentPort {
    if (provider === "cod") return this.cod;
    if (provider === "jazzcash") return this.jazzcash;
    if (provider === "easypaisa") return this.easypaisa;
    if (provider === "card" || provider === "stripe") return this.card;
    return this.stripe;
  }

  async adminDecideRefund(adminId: string, refundId: string, approve: boolean) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: { payment: true },
    });
    if (!refund) throw new NotFoundException("Refund not found");
    if (refund.status !== "PENDING") throw new BadRequestException("Already decided");

    if (!approve) {
      return this.prisma.refund.update({ where: { id: refundId }, data: { status: "REJECTED" } });
    }

    const adapter = this.adapterForProvider(refund.payment.provider);
    const result = await adapter.refund(refund.payment.providerRef ?? refund.payment.id, refund.amount);

    return this.prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.create({
        data: {
          paymentId: refund.paymentId,
          providerEventId: result.providerEventId,
          type: "refund",
          amount: refund.amount,
          raw: JSON.stringify({ adminId }),
        },
      });
      await tx.refund.update({ where: { id: refundId }, data: { status: "APPROVED" } });
      await tx.payment.update({
        where: { id: refund.paymentId },
        data: {
          status: refund.amount >= refund.payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
        },
      });
      await tx.ledgerEntry.create({
        data: {
          orderId: refund.orderId,
          type: "CUSTOMER_REFUND",
          amount: refund.amount,
          note: refund.reason,
        },
      });
      const vos = await tx.vendorOrder.findMany({ where: { orderId: refund.orderId } });
      for (const vo of vos) {
        const share = Math.round((refund.amount * vo.vendorEarning) / Math.max(1, refund.payment.amount));
        if (share > 0) {
          await tx.ledgerEntry.create({
            data: {
              vendorId: vo.vendorId,
              orderId: refund.orderId,
              vendorOrderId: vo.id,
              type: "VENDOR_REFUND_CLAWBACK",
              amount: share,
              note: "Refund clawback",
            },
          });
        }
      }
      if (refund.restock) {
        const items = await tx.orderItem.findMany({
          where: { vendorOrder: { orderId: refund.orderId } },
        });
        for (const item of items) {
          await this.inventory.apply(tx, {
            variantId: item.variantId,
            type: "RETURN",
            quantity: item.quantity,
            note: `refund ${refundId}`,
            actorUserId: adminId,
          });
        }
      }
      return tx.refund.findUnique({ where: { id: refundId } });
    });
  }

  async vendorEarnings(vendorId: string) {
    return this.ledger.balances(vendorId);
  }

  async requestPayout(vendorId: string, amount: number, note = "") {
    const bal = await this.ledger.balances(vendorId);
    if (amount <= 0 || amount > bal.available) {
      throw new BadRequestException({
        code: "INSUFFICIENT_AVAILABLE",
        message: `Withdrawable balance is ${bal.available}. Release pending first if needed.`,
      });
    }
    return this.prisma.payoutRequest.create({
      data: { vendorId, amount, note, status: "PENDING" },
    });
  }

  async releaseMyPending(vendorId: string) {
    return this.ledger.releasePending(vendorId);
  }

  async adminListPayouts(status?: string) {
    return this.prisma.payoutRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: { vendor: { include: { profile: true, owner: true } } },
    });
  }

  async adminDecidePayout(payoutId: string, approve: boolean) {
    const payout = await this.prisma.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException("Payout not found");
    if (payout.status !== "PENDING") throw new BadRequestException("Already decided");

    if (!approve) {
      return this.prisma.payoutRequest.update({
        where: { id: payoutId },
        data: { status: "REJECTED", processedAt: new Date() },
      });
    }

    const bal = await this.ledger.balances(payout.vendorId);
    if (payout.amount > bal.available) {
      throw new BadRequestException("Vendor available balance too low");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.ledgerEntry.create({
        data: {
          vendorId: payout.vendorId,
          payoutId: payout.id,
          type: "VENDOR_AVAILABLE",
          amount: -payout.amount,
          note: "Payout debit",
        },
      });
      await tx.ledgerEntry.create({
        data: {
          vendorId: payout.vendorId,
          payoutId: payout.id,
          type: "VENDOR_PAID",
          amount: payout.amount,
          note: "Payout paid",
        },
      });
      return tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: "PAID", processedAt: new Date() },
      });
    });
  }

  async adminSetCommission(rateBps: number, vendorId?: string) {
    if (rateBps < 0 || rateBps > 5000) {
      throw new BadRequestException("rateBps must be 0–5000");
    }
    const scope = vendorId ? "VENDOR" : "GLOBAL";
    const scopeId = vendorId ?? "";
    return this.prisma.commissionSetting.upsert({
      where: { scope_scopeId: { scope, scopeId } },
      create: { scope, scopeId, rateBps },
      update: { rateBps },
    });
  }

  getCommissionRate(vendorId: string) {
    return this.commission.rateBps(vendorId);
  }
}
