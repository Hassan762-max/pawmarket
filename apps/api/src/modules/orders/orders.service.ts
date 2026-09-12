import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CartService } from "../cart/cart.service";
import { InventoryService } from "../inventory/inventory.service";
import { AccountService } from "../account/account.service";
import { CommissionService, LedgerService } from "../payments/commission-ledger.service";
import { PaymentsService } from "../payments/payments.service";
import { PaymentMethod } from "../payments/payment.port";
import { OpsService } from "../ops/ops.service";
import { NotificationsService } from "../ops/notifications.service";

const SHIPPING_PER_VENDOR = 24900; // Rs 249 per vendor shipment
const TAX_RATE = 0.05; // simplified GST-style rate
const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY ?? "PKR";

const VENDOR_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly inventory: InventoryService,
    private readonly account: AccountService,
    private readonly commission: CommissionService,
    private readonly ledger: LedgerService,
    private readonly payments: PaymentsService,
    private readonly ops: OpsService,
    private readonly notifications: NotificationsService,
  ) {}

  async quote(userId: string) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.groups.length) {
      throw new BadRequestException({ code: "CART_EMPTY", message: "Your cart is empty." });
    }
    const shippingTotal = cart.groups.length * SHIPPING_PER_VENDOR;
    const taxTotal = Math.round((cart.merchandiseTotal + shippingTotal) * TAX_RATE);
    const vendorSplits = [];
    for (const g of cart.groups) {
      const store = await this.prisma.store.findUnique({ where: { id: g.store.id } });
      const rateBps = store ? await this.commission.rateBps(store.vendorId) : 1000;
      const { commission, earning } = this.commission.calc(g.subtotal, rateBps);
      vendorSplits.push({
        store: g.store,
        merchandise: g.subtotal,
        shipping: SHIPPING_PER_VENDOR,
        rateBps,
        estimatedCommission: commission,
        estimatedEarning: earning,
      });
    }
    return {
      cart,
      shippingPerVendor: SHIPPING_PER_VENDOR,
      shippingTotal,
      taxTotal,
      grandTotal: cart.merchandiseTotal + shippingTotal + taxTotal,
      vendorSplits,
    };
  }

  async checkout(
    userId: string,
    paymentMethod: PaymentMethod = "card",
    addressId?: string,
    clientGrandTotal?: number,
    couponCode?: string,
    phone?: string,
  ) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.groups.length) {
      throw new BadRequestException({ code: "CART_EMPTY", message: "Your cart is empty." });
    }

    let address =
      addressId != null
        ? await this.account.requireAddress(userId, addressId)
        : (await this.account.listAddresses(userId)).find((a) => a.isDefault) ??
          (await this.account.listAddresses(userId))[0];
    if (!address) {
      throw new BadRequestException({
        code: "ADDRESS_REQUIRED",
        message: "Add a shipping address before checkout.",
      });
    }

    const shippingSnapshot = JSON.stringify({
      label: address.label,
      line1: address.line1,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
    });

    let discountTotal = 0;
    let appliedCoupon: string | undefined;
    if (couponCode) {
      const vendorIds = (
        await Promise.all(
          cart.groups.map(async (g) => {
            const s = await this.prisma.store.findUnique({ where: { id: g.store.id } });
            return s?.vendorId;
          }),
        )
      ).filter(Boolean) as string[];
      const validated = await this.ops.validateCoupon(couponCode, cart.merchandiseTotal, vendorIds);
      discountTotal = validated.discount;
      appliedCoupon = validated.coupon.code;
    }

    return this.prisma.$transaction(async (tx) => {
      for (const group of cart.groups) {
        for (const item of group.items) {
          await this.inventory.apply(tx, {
            variantId: item.variantId,
            type: "RESERVE",
            quantity: item.quantity,
            note: "checkout reserve",
            actorUserId: userId,
          });
        }
      }

      let merchandiseTotal = 0;
      let shippingTotal = 0;
      const vendorPayload: {
        vendorId: string;
        storeId: string;
        merchandise: number;
        shipping: number;
        commission: number;
        earning: number;
        items: {
          variantId: string;
          productName: string;
          variantName: string;
          sku: string;
          unitPrice: number;
          quantity: number;
          lineTotal: number;
        }[];
      }[] = [];

      for (const group of cart.groups) {
        const store = await tx.store.findUnique({ where: { id: group.store.id } });
        if (!store) throw new BadRequestException("Store missing");
        let merchandise = 0;
        const items = [];
        for (const item of group.items) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!variant) throw new BadRequestException("Variant missing");
          const unitPrice = variant.salePrice ?? variant.price;
          const lineTotal = unitPrice * item.quantity;
          merchandise += lineTotal;
          items.push({
            variantId: variant.id,
            productName: item.productName,
            variantName: item.variantName,
            sku: variant.sku,
            unitPrice,
            quantity: item.quantity,
            lineTotal,
          });
        }
        const shipping = SHIPPING_PER_VENDOR;
        const rateBps = await this.commission.rateBps(store.vendorId);
        const { commission, earning } = this.commission.calc(merchandise, rateBps);
        merchandiseTotal += merchandise;
        shippingTotal += shipping;
        vendorPayload.push({
          vendorId: store.vendorId,
          storeId: store.id,
          merchandise,
          shipping,
          commission,
          earning,
          items,
        });
      }

      const taxTotal = Math.round((merchandiseTotal - discountTotal + shippingTotal) * TAX_RATE);
      const grandTotal = Math.max(0, merchandiseTotal - discountTotal + shippingTotal + taxTotal);

      if (clientGrandTotal != null && clientGrandTotal !== grandTotal) {
        throw new BadRequestException({
          code: "PRICE_CHANGED",
          message: "Totals changed. Refresh checkout and try again.",
        });
      }

      const orderNumber = `PM-${Date.now().toString().slice(-8)}`;
      const adapter = this.payments.adapter(paymentMethod);

      const order = await tx.order.create({
        data: {
          number: orderNumber,
          userId,
          status: "CONFIRMED",
          currency: DEFAULT_CURRENCY,
          merchandiseTotal,
          discountTotal,
          shippingTotal,
          taxTotal,
          grandTotal,
          couponCode: appliedCoupon,
          shippingAddressId: address.id,
          shippingSnapshot,
          vendorOrders: {
            create: vendorPayload.map((v, idx) => ({
              number: `${orderNumber}-${String.fromCharCode(65 + idx)}`,
              vendorId: v.vendorId,
              storeId: v.storeId,
              status: "CONFIRMED",
              merchandiseTotal: v.merchandise,
              shippingTotal: v.shipping,
              commissionAmount: v.commission,
              vendorEarning: v.earning,
              items: { create: v.items },
            })),
          },
        },
        include: { vendorOrders: { include: { items: true, store: true } } },
      });

      const paidIntent = await adapter.createIntent({
        orderId: order.id,
        amount: grandTotal,
        currency: DEFAULT_CURRENCY,
        metadata: phone ? { phone } : undefined,
      });

      if (paidIntent.status === "REQUIRES_PAYMENT") {
        await tx.order.update({ where: { id: order.id }, data: { status: "PENDING_PAYMENT" } });
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: paidIntent.provider,
          status: paidIntent.status,
          amount: grandTotal,
          providerRef: paidIntent.providerRef,
          transactions: {
            create: {
              providerEventId: `created_${paidIntent.providerRef}`,
              type: "intent.created",
              amount: grandTotal,
              raw: JSON.stringify(paidIntent),
            },
          },
        },
      });

      await this.ledger.postCheckout(tx, {
        orderId: order.id,
        grandTotal,
        taxTotal,
        vendorSplits: order.vendorOrders.map((vo) => {
          const src = vendorPayload.find((v) => v.storeId === vo.storeId)!;
          return {
            vendorId: vo.vendorId,
            vendorOrderId: vo.id,
            merchandise: src.merchandise,
            shipping: src.shipping,
            commission: src.commission,
            earning: src.earning,
          };
        }),
      });

      for (const group of cart.groups) {
        for (const item of group.items) {
          await this.inventory.apply(tx, {
            variantId: item.variantId,
            type: "COMMIT_SALE",
            quantity: item.quantity,
            note: `order ${order.number}`,
            actorUserId: userId,
          });
          await tx.product.updateMany({
            where: { variants: { some: { id: item.variantId } } },
            data: { soldCount: { increment: item.quantity } },
          });
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { code: appliedCoupon },
          data: { redeemedCount: { increment: 1 } },
        });
      }

      const full = await tx.order.findUnique({
        where: { id: order.id },
        include: { vendorOrders: { include: { items: true, store: true } }, payment: true },
      });
      return {
        ...full!,
        shippingAddress: JSON.parse(shippingSnapshot),
        paymentCheckout: {
          method: paymentMethod,
          provider: paidIntent.provider,
          status: paidIntent.status,
          mode: paidIntent.mode ?? "sandbox",
          message: paidIntent.message,
          redirectUrl: paidIntent.redirectUrl,
          formFields: paidIntent.formFields,
          clientSecret: paidIntent.clientSecret,
        },
      };
    }).then(async (result) => {
      try {
        await this.notifications.notify({
          userId,
          type: "ORDER",
          title: `Order ${result.number} placed`,
          body: `Total ${result.grandTotal} via ${paymentMethod} — tracking updates will appear in your account.`,
          link: `/account/orders/${result.id}`,
        });
      } catch (err) {
        console.error("[checkout] notify failed", err);
      }
      return result;
    });
  }

  async listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { vendorOrders: { include: { store: true, items: true } }, payment: true },
    });
  }

  async getForUser(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { vendorOrders: { include: { store: true, items: true } }, payment: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    return {
      ...order,
      shippingAddress: order.shippingSnapshot ? JSON.parse(order.shippingSnapshot) : null,
    };
  }

  async listVendorOrders(vendorId: string) {
    return this.prisma.vendorOrder.findMany({
      where: { vendorId },
      orderBy: { order: { createdAt: "desc" } },
      include: { items: true, store: true, order: true },
    });
  }

  async updateVendorOrder(
    vendorId: string,
    id: string,
    status?: string,
    trackingNumber?: string,
    carrier?: string,
  ) {
    const vo = await this.prisma.vendorOrder.findFirst({
      where: { id, vendorId },
      include: { order: { include: { vendorOrders: true } } },
    });
    if (!vo) throw new NotFoundException("Vendor order not found");

    if (status) {
      const allowed = VENDOR_TRANSITIONS[vo.status] ?? [];
      if (!allowed.includes(status)) {
        throw new BadRequestException({
          code: "INVALID_STATUS",
          message: `Cannot move from ${vo.status} to ${status}.`,
        });
      }
    }

    const updated = await this.prisma.vendorOrder.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(trackingNumber !== undefined ? { trackingNumber } : {}),
        ...(carrier !== undefined ? { carrier } : {}),
        ...(status === "SHIPPED" ? { shippedAt: new Date() } : {}),
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      },
      include: { items: true, store: true, order: true },
    });

    await this.deriveParentStatus(vo.orderId);

    if (status === "DELIVERED") {
      await this.ledger.releasePending(vendorId);
    }

    if (status === "SHIPPED" || status === "DELIVERED") {
      await this.notifications.notify({
        userId: vo.order.userId,
        type: "SHIPPING",
        title: `Shipment ${updated.number} ${status.toLowerCase()}`,
        body: trackingNumber
          ? `Tracking ${trackingNumber}${carrier ? ` via ${carrier}` : ""}`
          : `Status: ${status}`,
        link: `/account/orders/${vo.orderId}`,
      });
    }

    return updated;
  }

  private async deriveParentStatus(orderId: string) {
    const children = await this.prisma.vendorOrder.findMany({ where: { orderId } });
    const statuses = children.map((c) => c.status);
    let parent = "CONFIRMED";
    if (statuses.every((s) => s === "CANCELLED")) parent = "CANCELLED";
    else if (statuses.every((s) => s === "DELIVERED")) parent = "DELIVERED";
    else if (statuses.some((s) => s === "SHIPPED" || s === "OUT_FOR_DELIVERY" || s === "DELIVERED")) {
      parent = statuses.every((s) => ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(s))
        ? "SHIPPED"
        : "PARTIALLY_SHIPPED";
    } else if (statuses.some((s) => ["PROCESSING", "PACKED", "CONFIRMED"].includes(s))) {
      parent = statuses.some((s) => s !== "CONFIRMED") ? "PROCESSING" : "CONFIRMED";
    }
    await this.prisma.order.update({ where: { id: orderId }, data: { status: parent } });
  }

  async adminOverview() {
    const [customers, vendors, products, orders, gmv] = await Promise.all([
      this.prisma.user.count({ where: { roles: { some: { role: { slug: "customer" } } } } }),
      this.prisma.vendor.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { grandTotal: true } }),
    ]);
    return {
      customers,
      vendors,
      products,
      orders,
      gmv: gmv._sum.grandTotal ?? 0,
    };
  }
}
