import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "./notifications.service";

@Injectable()
export class OpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // —— Coupons ——
  listCoupons(vendorId?: string) {
    return this.prisma.coupon.findMany({
      where: vendorId ? { OR: [{ vendorId }, { scope: "PLATFORM" }] } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  createCoupon(data: {
    code: string;
    type: "PERCENT" | "FIXED";
    value: number;
    scope?: string;
    vendorId?: string;
    minSubtotal?: number;
    maxRedemptions?: number;
    endsAt?: string;
  }) {
    return this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        scope: data.scope ?? (data.vendorId ? "VENDOR" : "PLATFORM"),
        vendorId: data.vendorId,
        minSubtotal: data.minSubtotal ?? 0,
        maxRedemptions: data.maxRedemptions,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    });
  }

  async validateCoupon(code: string, merchandiseTotal: number, vendorIds: string[] = []) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.active) {
      throw new BadRequestException({ code: "COUPON_INVALID", message: "Coupon not found." });
    }
    if (coupon.endsAt && coupon.endsAt < new Date()) {
      throw new BadRequestException({ code: "COUPON_EXPIRED", message: "Coupon expired." });
    }
    if (coupon.maxRedemptions != null && coupon.redeemedCount >= coupon.maxRedemptions) {
      throw new BadRequestException({ code: "COUPON_EXHAUSTED", message: "Coupon fully redeemed." });
    }
    if (merchandiseTotal < coupon.minSubtotal) {
      throw new BadRequestException({
        code: "COUPON_MIN",
        message: `Minimum subtotal is ${coupon.minSubtotal}.`,
      });
    }
    if (coupon.scope === "VENDOR" && coupon.vendorId && !vendorIds.includes(coupon.vendorId)) {
      throw new BadRequestException({
        code: "COUPON_VENDOR",
        message: "Coupon does not apply to cart vendors.",
      });
    }
    const discount =
      coupon.type === "PERCENT"
        ? Math.round((merchandiseTotal * coupon.value) / 100)
        : Math.min(coupon.value, merchandiseTotal);
    return { coupon, discount };
  }

  async redeemCoupon(code: string) {
    await this.prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: { redeemedCount: { increment: 1 } },
    });
  }

  // —— Reviews ——
  async createReview(
    userId: string,
    productId: string,
    rating: number,
    title: string,
    comment: string,
  ) {
    if (rating < 1 || rating > 5) throw new BadRequestException("Rating 1–5");
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product not found");

    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        variant: { productId },
        vendorOrder: { order: { userId, status: { in: ["DELIVERED", "SHIPPED", "CONFIRMED", "PROCESSING"] } } },
      },
    });

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title,
        comment,
        verifiedPurchase: Boolean(purchased),
      },
    });

    const agg = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: { ratingAvg: agg._avg.rating ?? rating },
    });
    return review;
  }

  listProductReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { firstName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  // —— Support ——
  listTickets(userId: string, asAdmin = false) {
    return this.prisma.supportTicket.findMany({
      where: asAdmin ? undefined : { userId },
      include: { messages: { orderBy: { createdAt: "asc" } }, user: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async createTicket(userId: string, subject: string, body: string) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        subject,
        messages: { create: { authorId: userId, body, isStaff: false } },
      },
      include: { messages: true },
    });
    await this.notifications.notify({
      userId,
      type: "SUPPORT",
      title: "Support ticket opened",
      body: subject,
      link: `/account/support/${ticket.id}`,
    });
    return ticket;
  }

  async replyTicket(userId: string, ticketId: string, body: string, isStaff: boolean) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (!isStaff && ticket.userId !== userId) throw new NotFoundException("Ticket not found");
    await this.prisma.supportMessage.create({
      data: { ticketId, authorId: userId, body, isStaff },
    });
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: isStaff ? "WAITING_CUSTOMER" : "OPEN", updatedAt: new Date() },
    });
    const notifyUserId = isStaff ? ticket.userId : userId;
    if (isStaff) {
      await this.notifications.notify({
        userId: notifyUserId,
        type: "SUPPORT",
        title: "Support replied",
        body: ticket.subject,
        link: `/account/support/${ticketId}`,
      });
    }
    return this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  async closeTicket(ticketId: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "CLOSED" },
    });
  }

  // —— CMS pages ——
  listCms() {
    return this.prisma.cmsPage.findMany({ orderBy: { slug: "asc" } });
  }
}
