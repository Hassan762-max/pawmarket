import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CommissionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Rate in basis points. Precedence: vendor → global (default 10%). */
  async rateBps(vendorId: string): Promise<number> {
    const vendor = await this.prisma.commissionSetting.findUnique({
      where: { scope_scopeId: { scope: "VENDOR", scopeId: vendorId } },
    });
    if (vendor) return vendor.rateBps;
    const global = await this.prisma.commissionSetting.findUnique({
      where: { scope_scopeId: { scope: "GLOBAL", scopeId: "" } },
    });
    return global?.rateBps ?? 1000;
  }

  calc(base: number, rateBps: number) {
    const commission = Math.round((base * rateBps) / 10000);
    return { commission, earning: base - commission };
  }
}

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async postCheckout(
    tx: Prisma.TransactionClient,
    input: {
      orderId: string;
      grandTotal: number;
      taxTotal: number;
      vendorSplits: {
        vendorId: string;
        vendorOrderId: string;
        merchandise: number;
        shipping: number;
        commission: number;
        earning: number;
      }[];
    },
  ) {
    await tx.ledgerEntry.create({
      data: {
        orderId: input.orderId,
        type: "CUSTOMER_PAYMENT",
        amount: input.grandTotal,
        note: "Customer capture",
      },
    });
    if (input.taxTotal > 0) {
      await tx.ledgerEntry.create({
        data: {
          orderId: input.orderId,
          type: "TAX_PAYABLE",
          amount: input.taxTotal,
          note: "Sales tax",
        },
      });
    }
    for (const v of input.vendorSplits) {
      await tx.ledgerEntry.create({
        data: {
          vendorId: v.vendorId,
          orderId: input.orderId,
          vendorOrderId: v.vendorOrderId,
          type: "PLATFORM_COMMISSION",
          amount: v.commission,
          note: "Commission",
        },
      });
      await tx.ledgerEntry.create({
        data: {
          vendorId: v.vendorId,
          orderId: input.orderId,
          vendorOrderId: v.vendorOrderId,
          type: "VENDOR_PENDING",
          amount: v.earning + v.shipping,
          note: "Merchandise earning + shipping",
        },
      });
    }
  }

  async balances(vendorId: string) {
    const entries = await this.prisma.ledgerEntry.findMany({ where: { vendorId } });
    let pending = 0;
    let available = 0;
    let paid = 0;
    let commission = 0;
    for (const e of entries) {
      if (e.type === "VENDOR_PENDING") pending += e.amount;
      if (e.type === "VENDOR_AVAILABLE") available += e.amount;
      if (e.type === "VENDOR_PAID") paid += e.amount;
      if (e.type === "PLATFORM_COMMISSION") commission += e.amount;
      if (e.type === "VENDOR_REFUND_CLAWBACK") {
        pending = Math.max(0, pending - e.amount);
        available = Math.max(0, available - e.amount);
      }
    }
    // pending not yet released sits in pending; available is withdrawable
    const withdrawable = Math.max(0, available);
    return { pending, available: withdrawable, paid, commission, entries: entries.slice(0, 50) };
  }

  /** Move PENDING → AVAILABLE for a vendor (settlement). */
  async releasePending(vendorId: string, amount?: number) {
    const bal = await this.balances(vendorId);
    const move = Math.min(amount ?? bal.pending, bal.pending);
    if (move <= 0) return bal;
    await this.prisma.$transaction([
      this.prisma.ledgerEntry.create({
        data: {
          vendorId,
          type: "VENDOR_PENDING",
          amount: -move,
          note: "Release to available",
        },
      }),
      this.prisma.ledgerEntry.create({
        data: {
          vendorId,
          type: "VENDOR_AVAILABLE",
          amount: move,
          note: "Settlement release",
        },
      }),
    ]);
    return this.balances(vendorId);
  }
}
