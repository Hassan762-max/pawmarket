import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AnalyticsCacheService } from "./analytics-cache.service";
import { SaasService } from "../saas/saas.service";

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AnalyticsCacheService,
    private readonly saas: SaasService,
  ) {}

  async adminOverview() {
    const key = "analytics:admin:overview";
    const cached = await this.cache.getJson<Record<string, unknown>>(key);
    if (cached) return { ...cached, cached: true, cacheBackend: this.cache.getBackend() };

    const [
      customers,
      vendors,
      products,
      orders,
      gmv,
      pendingVendors,
      pendingProducts,
      openTickets,
      refundsPending,
      payoutsPending,
      topProducts,
      salesByDay,
    ] = await Promise.all([
      this.prisma.user.count({ where: { roles: { some: { role: { slug: "customer" } } } } }),
      this.prisma.vendor.count({ where: { status: "APPROVED" } }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { grandTotal: true } }),
      this.prisma.vendor.count({ where: { status: "PENDING_REVIEW" } }),
      this.prisma.product.count({ where: { approvalStatus: "PENDING", deletedAt: null } }),
      this.prisma.supportTicket.count({ where: { status: { not: "CLOSED" } } }),
      this.prisma.refund.count({ where: { status: "PENDING" } }),
      this.prisma.payoutRequest.count({ where: { status: "PENDING" } }),
      this.prisma.product.findMany({
        where: { deletedAt: null, approvalStatus: "APPROVED" },
        orderBy: { soldCount: "desc" },
        take: 5,
        select: { name: true, slug: true, soldCount: true, ratingAvg: true },
      }),
      this.salesByDay(14),
    ]);

    const data = {
      customers,
      vendors,
      products,
      orders,
      gmv: gmv._sum.grandTotal ?? 0,
      queues: {
        pendingVendors,
        pendingProducts,
        openTickets,
        refundsPending,
        payoutsPending,
      },
      topProducts,
      salesByDay,
      cached: false,
      cacheBackend: this.cache.getBackend(),
    };
    await this.cache.setJson(key, data, 45);
    return data;
  }

  async vendorDashboard(vendorId: string) {
    await this.saas.assertAnalytics(vendorId, "BASIC");
    const key = `analytics:vendor:${vendorId}:dashboard`;
    const cached = await this.cache.getJson<Record<string, unknown>>(key);
    if (cached) return { ...cached, cached: true, cacheBackend: this.cache.getBackend() };

    const [orders, revenue, commission, products, salesByDay, topSkus, variants] = await Promise.all([
      this.prisma.vendorOrder.count({ where: { vendorId } }),
      this.prisma.vendorOrder.aggregate({
        where: { vendorId },
        _sum: { merchandiseTotal: true, vendorEarning: true, shippingTotal: true },
      }),
      this.prisma.vendorOrder.aggregate({
        where: { vendorId },
        _sum: { commissionAmount: true },
      }),
      this.prisma.product.count({ where: { vendorId, deletedAt: null } }),
      this.vendorSalesByDay(vendorId, 14),
      this.prisma.orderItem.groupBy({
        by: ["productName"],
        where: { vendorOrder: { vendorId } },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      this.prisma.productVariant.findMany({
        where: { product: { vendorId, deletedAt: null } },
        select: { onHand: true, reserved: true, lowStockThreshold: true },
      }),
    ]);

    const lowStockCount = variants.filter((v) => v.onHand - v.reserved <= v.lowStockThreshold).length;

    let advanced: Record<string, unknown> | null = null;
    try {
      await this.saas.assertAnalytics(vendorId, "ADVANCED");
      advanced = {
        avgOrderValue:
          orders > 0 ? Math.round((revenue._sum.merchandiseTotal ?? 0) / orders) : 0,
        conversionHint: "ADVANCED plan — AOV + SKU mix unlocked",
      };
    } catch {
      advanced = null;
    }

    const data = {
      orders,
      merchandiseTotal: revenue._sum.merchandiseTotal ?? 0,
      earnings: revenue._sum.vendorEarning ?? 0,
      shippingCollected: revenue._sum.shippingTotal ?? 0,
      commissionPaid: commission._sum.commissionAmount ?? 0,
      products,
      lowStock: lowStockCount,
      salesByDay,
      topSkus: topSkus.map((s) => ({
        name: s.productName,
        qty: s._sum.quantity ?? 0,
        revenue: s._sum.lineTotal ?? 0,
      })),
      advanced,
      cached: false,
      cacheBackend: this.cache.getBackend(),
    };
    await this.cache.setJson(key, data, 45);
    return data;
  }

  private async salesByDay(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await this.prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, grandTotal: true },
    });
    const map = new Map<string, { orders: number; gmv: number }>();
    for (const r of rows) {
      const d = r.createdAt.toISOString().slice(0, 10);
      const cur = map.get(d) ?? { orders: 0, gmv: 0 };
      cur.orders += 1;
      cur.gmv += r.grandTotal;
      map.set(d, cur);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, ...v }));
  }

  private async vendorSalesByDay(vendorId: string, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await this.prisma.vendorOrder.findMany({
      where: { vendorId, order: { createdAt: { gte: since } } },
      select: { merchandiseTotal: true, order: { select: { createdAt: true } } },
    });
    const map = new Map<string, { orders: number; merchandise: number }>();
    for (const r of rows) {
      const d = r.order.createdAt.toISOString().slice(0, 10);
      const cur = map.get(d) ?? { orders: 0, merchandise: 0 };
      cur.orders += 1;
      cur.merchandise += r.merchandiseTotal;
      map.set(d, cur);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, ...v }));
  }
}
