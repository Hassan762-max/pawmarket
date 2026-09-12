import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { StubBillingAdapter } from "./billing.port";

@Injectable()
export class SaasService {
  private readonly billing = new StubBillingAdapter();

  constructor(private readonly prisma: PrismaService) {}

  listPlans(activeOnly = true) {
    return this.prisma.plan.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });
  }

  async adminUpsertPlan(input: {
    id?: string;
    slug: string;
    name: string;
    description?: string;
    priceMonthly: number;
    productLimit: number;
    storeLimit: number;
    staffLimit: number;
    analyticsLevel?: string;
    featuredListing?: boolean;
    active?: boolean;
    sortOrder?: number;
  }) {
    if (input.id) {
      return this.prisma.plan.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description ?? "",
          priceMonthly: input.priceMonthly,
          productLimit: input.productLimit,
          storeLimit: input.storeLimit,
          staffLimit: input.staffLimit,
          analyticsLevel: input.analyticsLevel ?? "BASIC",
          featuredListing: input.featuredListing ?? false,
          active: input.active ?? true,
          sortOrder: input.sortOrder ?? 0,
        },
      });
    }
    return this.prisma.plan.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description ?? "",
        priceMonthly: input.priceMonthly,
        productLimit: input.productLimit,
        storeLimit: input.storeLimit,
        staffLimit: input.staffLimit,
        analyticsLevel: input.analyticsLevel ?? "BASIC",
        featuredListing: input.featuredListing ?? false,
        active: input.active ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async getVendorSubscription(vendorId: string) {
    let sub = await this.prisma.vendorSubscription.findUnique({
      where: { vendorId },
      include: { plan: true },
    });
    if (!sub) {
      const free = await this.prisma.plan.findUnique({ where: { slug: "free" } });
      if (!free) throw new NotFoundException("Free plan missing — reseed");
      sub = await this.prisma.vendorSubscription.create({
        data: {
          vendorId,
          planId: free.id,
          status: "ACTIVE",
          billingProvider: "stub",
          currentPeriodEnd: null,
        },
        include: { plan: true },
      });
    }
    const productCount = await this.prisma.product.count({
      where: { vendorId, deletedAt: null },
    });
    const storeCount = await this.prisma.store.count({ where: { vendorId } });
    const staffCount = await this.prisma.vendorStaff.count({ where: { vendorId } });
    return {
      ...sub,
      usage: {
        products: productCount,
        productLimit: sub.plan.productLimit,
        stores: storeCount,
        storeLimit: sub.plan.storeLimit,
        staff: staffCount,
        staffLimit: sub.plan.staffLimit,
        analyticsLevel: sub.plan.analyticsLevel,
      },
    };
  }

  async changePlan(vendorId: string, planSlug: string) {
    const plan = await this.prisma.plan.findFirst({ where: { slug: planSlug, active: true } });
    if (!plan) throw new NotFoundException("Plan not found");

    const usage = await this.getVendorSubscription(vendorId);
    if (usage.usage.products > plan.productLimit) {
      throw new BadRequestException({
        code: "PLAN_LIMIT",
        message: `You have ${usage.usage.products} products; ${plan.name} allows ${plan.productLimit}.`,
      });
    }
    if (usage.usage.stores > plan.storeLimit) {
      throw new BadRequestException({
        code: "PLAN_LIMIT",
        message: `Store count exceeds ${plan.name} limit.`,
      });
    }

    const billed = await this.billing.startSubscription({
      vendorId,
      planSlug: plan.slug,
      amount: plan.priceMonthly,
    });

    return this.prisma.vendorSubscription.upsert({
      where: { vendorId },
      create: {
        vendorId,
        planId: plan.id,
        status: billed.status,
        billingProvider: billed.provider,
        providerCustomerId: billed.providerCustomerId,
        providerSubId: billed.providerSubId,
        currentPeriodEnd: billed.currentPeriodEnd,
      },
      update: {
        planId: plan.id,
        status: billed.status,
        billingProvider: billed.provider,
        providerCustomerId: billed.providerCustomerId,
        providerSubId: billed.providerSubId,
        currentPeriodEnd: billed.currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
      include: { plan: true },
    });
  }

  async cancel(vendorId: string, atPeriodEnd = true) {
    const sub = await this.prisma.vendorSubscription.findUnique({ where: { vendorId } });
    if (!sub) throw new NotFoundException("No subscription");
    if (sub.providerSubId) {
      await this.billing.cancelSubscription(sub.providerSubId, atPeriodEnd);
    }
    return this.prisma.vendorSubscription.update({
      where: { vendorId },
      data: {
        cancelAtPeriodEnd: atPeriodEnd,
        status: atPeriodEnd ? "ACTIVE" : "CANCELLED",
      },
      include: { plan: true },
    });
  }

  async assertCanCreateProduct(vendorId: string) {
    const sub = await this.getVendorSubscription(vendorId);
    if (!["ACTIVE", "TRIALLING"].includes(sub.status)) {
      throw new ForbiddenException({
        code: "SUBSCRIPTION_INACTIVE",
        message: "Subscription is not active.",
      });
    }
    if (sub.usage.products >= sub.plan.productLimit) {
      throw new ForbiddenException({
        code: "PRODUCT_LIMIT",
        message: `Plan ${sub.plan.name} allows ${sub.plan.productLimit} products. Upgrade to add more.`,
      });
    }
  }

  async assertCanCreateStore(vendorId: string) {
    const sub = await this.getVendorSubscription(vendorId);
    if (sub.usage.stores >= sub.plan.storeLimit) {
      throw new ForbiddenException({
        code: "STORE_LIMIT",
        message: `Plan ${sub.plan.name} allows ${sub.plan.storeLimit} store(s).`,
      });
    }
  }

  async assertAnalytics(vendorId: string, required: "BASIC" | "ADVANCED") {
    const sub = await this.getVendorSubscription(vendorId);
    const rank = { BASIC: 1, ADVANCED: 2 };
    if ((rank[sub.plan.analyticsLevel as "BASIC" | "ADVANCED"] ?? 1) < rank[required]) {
      throw new ForbiddenException({
        code: "ANALYTICS_LOCKED",
        message: "Upgrade plan for advanced analytics.",
      });
    }
  }

  adminListSubscriptions() {
    return this.prisma.vendorSubscription.findMany({
      include: { plan: true, vendor: { include: { owner: true, profile: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }
}
