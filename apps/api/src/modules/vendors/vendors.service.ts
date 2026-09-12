import { Prisma } from "@prisma/client";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../ops/notifications.service";

export type OnboardingInput = {
  phone: string;
  country: string;
  legalName: string;
  taxId: string;
  about?: string;
  storeName: string;
  storeSlug: string;
  tagline?: string;
  description?: string;
  payoutHolderName: string;
  payoutLast4: string;
};

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getMine(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { ownerId: userId },
      include: {
        profile: true,
        documents: { orderBy: { createdAt: "desc" } },
        payoutMethods: true,
        stores: { include: { settings: true } },
        staff: { include: { user: true } },
      },
    });
    if (!vendor) return null;
    return this.serialize(vendor);
  }

  async onboard(userId: string, input: OnboardingInput) {
    const slug = this.slugify(input.storeSlug || input.storeName);
    if (!slug) throw new BadRequestException({ code: "INVALID_SLUG", message: "Store slug is required." });

    const existing = await this.prisma.vendor.findUnique({ where: { ownerId: userId } });
    if (existing && !["PENDING_ONBOARDING", "REJECTED"].includes(existing.status)) {
      throw new ConflictException({
        code: "VENDOR_EXISTS",
        message: "A vendor application already exists for this account.",
      });
    }

    const slugTaken = await this.prisma.store.findFirst({
      where: { slug, ...(existing ? { vendorId: { not: existing.id } } : {}) },
    });
    if (slugTaken) {
      throw new ConflictException({ code: "SLUG_TAKEN", message: "That store URL is already in use." });
    }

    const vendorRole = await this.prisma.role.findUnique({ where: { slug: "vendor_owner" } });
    if (!vendorRole) throw new BadRequestException("Roles not seeded");

    return this.prisma.$transaction(async (tx) => {
      await tx.userRole.upsert({
        where: { userId_roleId: { userId, roleId: vendorRole.id } },
        create: { userId, roleId: vendorRole.id },
        update: {},
      });

      const vendor = existing
        ? await tx.vendor.update({
            where: { id: existing.id },
            data: {
              status: "PENDING_REVIEW",
              legalName: input.legalName,
              taxId: input.taxId,
              phone: input.phone,
              country: input.country,
              rejectionReason: null,
              reviewedAt: null,
            },
          })
        : await tx.vendor.create({
            data: {
              ownerId: userId,
              status: "PENDING_REVIEW",
              legalName: input.legalName,
              taxId: input.taxId,
              phone: input.phone,
              country: input.country,
            },
          });

      await tx.vendorProfile.upsert({
        where: { vendorId: vendor.id },
        create: { vendorId: vendor.id, displayName: input.storeName, about: input.about ?? "" },
        update: { displayName: input.storeName, about: input.about ?? "" },
      });

      const store = await tx.store.findFirst({ where: { vendorId: vendor.id } });
      if (store) {
        await tx.store.update({
          where: { id: store.id },
          data: {
            name: input.storeName,
            slug,
            tagline: input.tagline ?? "",
            description: input.description ?? "",
            status: "DRAFT",
          },
        });
      } else {
        await tx.store.create({
          data: {
            vendorId: vendor.id,
            name: input.storeName,
            slug,
            tagline: input.tagline ?? "",
            description: input.description ?? "",
            status: "DRAFT",
            settings: { create: {} },
          },
        });
      }

      await tx.vendorPayoutMethod.deleteMany({ where: { vendorId: vendor.id } });
      await tx.vendorPayoutMethod.create({
        data: {
          vendorId: vendor.id,
          method: "bank",
          holderName: input.payoutHolderName,
          accountLast4: input.payoutLast4.slice(-4),
        },
      });

      return vendor;
    });

    await this.notifications.notify({
      userId,
      type: "VENDOR_APPLICATION",
      title: "Application submitted",
      body: `Your shop “${input.storeName}” is waiting for admin review. We’ll notify you when it’s approved.`,
      link: "/vendor",
    });
    await this.notifications.notifyAdmins({
      type: "VENDOR_APPLICATION",
      title: "New vendor application",
      body: `${input.legalName} / ${input.storeName} is ready for review.`,
      link: "/admin/vendors",
    });

    return this.getMine(userId);
  }

  async addDocument(
    userId: string,
    input: { type: string; fileName: string; mimeType: string },
  ) {
    const vendor = await this.requireOwnedVendor(userId);
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(input.mimeType)) {
      throw new BadRequestException({ code: "INVALID_FILE", message: "Only JPEG, PNG, WebP, or PDF is allowed." });
    }
    return this.prisma.vendorDocument.create({
      data: {
        vendorId: vendor.id,
        type: input.type,
        fileName: input.fileName,
        mimeType: input.mimeType,
        storageKey: `vendors/${vendor.id}/${Date.now()}-${input.fileName}`,
        status: "PENDING",
      },
    });
  }

  async updateStore(
    userId: string,
    storeId: string,
    input: { name?: string; tagline?: string; description?: string; logoUrl?: string; bannerUrl?: string },
  ) {
    const vendor = await this.requireOwnedVendor(userId);
    const store = await this.prisma.store.findFirst({ where: { id: storeId, vendorId: vendor.id } });
    if (!store) throw new NotFoundException({ code: "NOT_FOUND", message: "Store not found." });
    return this.prisma.store.update({
      where: { id: store.id },
      data: input,
    });
  }

  async listStaff(userId: string) {
    const vendor = await this.requireOwnedVendor(userId);
    const staff = await this.prisma.vendorStaff.findMany({
      where: { vendorId: vendor.id },
      include: { user: true },
    });
    return staff.map((s) => ({
      id: s.id,
      roleSlug: s.roleSlug,
      email: s.user.email,
      name: `${s.user.firstName} ${s.user.lastName}`,
    }));
  }

  async inviteStaff(userId: string, email: string, roleSlug: string) {
    const vendor = await this.requireOwnedVendor(userId);
    if (vendor.status !== "APPROVED") {
      throw new ForbiddenException({
        code: "VENDOR_NOT_APPROVED",
        message: "Staff can be added after the store is approved.",
      });
    }
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "No PawMarket account exists for that email yet.",
      });
    }
    const staffRole = await this.prisma.role.findUnique({ where: { slug: "vendor_staff" } });
    if (staffRole) {
      await this.prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: staffRole.id } },
        create: { userId: user.id, roleId: staffRole.id },
        update: {},
      });
    }
    return this.prisma.vendorStaff.upsert({
      where: { vendorId_userId: { vendorId: vendor.id, userId: user.id } },
      create: { vendorId: vendor.id, userId: user.id, roleSlug },
      update: { roleSlug },
    });
  }

  async adminList(status?: string) {
    return this.prisma.vendor.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        owner: true,
        stores: true,
        documents: true,
        profile: true,
      },
    }).then((rows) => rows.map((v) => this.serializeAdmin(v)));
  }

  async adminGet(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: { owner: true, stores: true, documents: true, profile: true, payoutMethods: true },
    });
    if (!vendor) throw new NotFoundException({ code: "NOT_FOUND", message: "Vendor not found." });
    return this.serializeAdmin(vendor);
  }

  async approve(adminUserId: string, vendorId: string) {
    const result = await this.transition(adminUserId, vendorId, "APPROVED", async (tx, vendor) => {
      await tx.vendor.update({
        where: { id: vendor.id },
        data: {
          status: "APPROVED",
          rejectionReason: null,
          suspendedReason: null,
          reviewedAt: new Date(),
          reviewedById: adminUserId,
        },
      });
      await tx.store.updateMany({
        where: { vendorId: vendor.id },
        data: { status: "ACTIVE" },
      });
    });
    await this.notifyVendorOwner(vendorId, {
      type: "VENDOR_STATUS",
      title: "Shop approved",
      body: "Your vendor application was approved. You can list products and start selling.",
      link: "/vendor",
    });
    return result;
  }

  async reject(adminUserId: string, vendorId: string, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException({ code: "REASON_REQUIRED", message: "A rejection reason is required." });
    }
    const result = await this.transition(adminUserId, vendorId, "REJECTED", async (tx, vendor) => {
      await tx.vendor.update({
        where: { id: vendor.id },
        data: {
          status: "REJECTED",
          rejectionReason: reason.trim(),
          reviewedAt: new Date(),
          reviewedById: adminUserId,
        },
      });
      await tx.store.updateMany({ where: { vendorId: vendor.id }, data: { status: "DRAFT" } });
    });
    await this.notifyVendorOwner(vendorId, {
      type: "VENDOR_STATUS",
      title: "Application rejected",
      body: reason.trim(),
      link: "/vendor/onboarding",
    });
    return result;
  }

  async suspend(adminUserId: string, vendorId: string, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException({ code: "REASON_REQUIRED", message: "A suspend reason is required." });
    }
    const result = await this.transition(adminUserId, vendorId, "SUSPENDED", async (tx, vendor) => {
      await tx.vendor.update({
        where: { id: vendor.id },
        data: { status: "SUSPENDED", suspendedReason: reason.trim(), reviewedById: adminUserId },
      });
      await tx.store.updateMany({ where: { vendorId: vendor.id }, data: { status: "PAUSED" } });
    });
    await this.notifyVendorOwner(vendorId, {
      type: "VENDOR_STATUS",
      title: "Shop suspended",
      body: reason.trim(),
      link: "/vendor",
    });
    return result;
  }

  async reactivate(adminUserId: string, vendorId: string) {
    const result = await this.transition(adminUserId, vendorId, "APPROVED", async (tx, vendor) => {
      await tx.vendor.update({
        where: { id: vendor.id },
        data: { status: "APPROVED", suspendedReason: null, reviewedById: adminUserId },
      });
      await tx.store.updateMany({ where: { vendorId: vendor.id }, data: { status: "ACTIVE" } });
    });
    await this.notifyVendorOwner(vendorId, {
      type: "VENDOR_STATUS",
      title: "Shop reactivated",
      body: "Your vendor account is active again. You can resume selling.",
      link: "/vendor",
    });
    return result;
  }

  private async notifyVendorOwner(
    vendorId: string,
    note: { type: string; title: string; body: string; link?: string },
  ) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { ownerId: true } });
    if (!vendor) return;
    await this.notifications.notify({
      userId: vendor.ownerId,
      type: note.type,
      title: note.title,
      body: note.body,
      link: note.link,
    });
  }

  /** Always from auth context — never from a client-supplied vendorId. */
  requireVendorId(vendorId: string | null | undefined): string {
    if (!vendorId) {
      throw new ForbiddenException({
        code: "VENDOR_CONTEXT_REQUIRED",
        message: "This action requires an authenticated vendor.",
      });
    }
    return vendorId;
  }

  private async requireOwnedVendor(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { ownerId: userId } });
    if (!vendor) {
      throw new NotFoundException({ code: "VENDOR_NOT_FOUND", message: "Start vendor onboarding first." });
    }
    return vendor;
  }

  private async transition(
    adminUserId: string,
    vendorId: string,
    nextStatus: string,
    apply: (tx: Prisma.TransactionClient, vendor: { id: string; status: string }) => Promise<void>,
  ) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException({ code: "NOT_FOUND", message: "Vendor not found." });
    await this.prisma.$transaction(async (tx) => {
      await apply(tx, vendor);
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: `vendor.${nextStatus.toLowerCase()}`,
          entityType: "Vendor",
          entityId: vendor.id,
          previous: JSON.stringify({ status: vendor.status }),
          next: JSON.stringify({ status: nextStatus }),
        },
      });
    });
    return this.adminGet(vendorId);
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  }

  private serialize(vendor: {
    id: string;
    status: string;
    legalName: string;
    taxId: string;
    phone: string;
    country: string;
    rejectionReason: string | null;
    suspendedReason: string | null;
    profile: { displayName: string; about: string; website: string } | null;
    documents: { id: string; type: string; fileName: string; status: string; createdAt: Date }[];
    payoutMethods: { method: string; holderName: string; accountLast4: string }[];
    stores: {
      id: string;
      name: string;
      slug: string;
      tagline: string;
      description: string;
      logoUrl: string;
      bannerUrl: string;
      status: string;
    }[];
    staff: { id: string; roleSlug: string; user: { email: string; firstName: string; lastName: string } }[];
  }) {
    return {
      id: vendor.id,
      status: vendor.status,
      legalName: vendor.legalName,
      taxId: vendor.taxId,
      phone: vendor.phone,
      country: vendor.country,
      rejectionReason: vendor.rejectionReason,
      suspendedReason: vendor.suspendedReason,
      canSell: vendor.status === "APPROVED",
      profile: vendor.profile,
      documents: vendor.documents,
      payoutMethods: vendor.payoutMethods.map((p) => ({
        method: p.method,
        holderName: p.holderName,
        accountLast4: p.accountLast4,
      })),
      stores: vendor.stores,
      staff: vendor.staff.map((s) => ({
        id: s.id,
        roleSlug: s.roleSlug,
        email: s.user.email,
        name: `${s.user.firstName} ${s.user.lastName}`,
      })),
    };
  }

  private serializeAdmin(vendor: {
    id: string;
    status: string;
    legalName: string;
    taxId: string;
    phone: string;
    country: string;
    rejectionReason: string | null;
    suspendedReason: string | null;
    createdAt: Date;
    owner: { id: string; email: string; firstName: string; lastName: string };
    stores: { id: string; name: string; slug: string; status: string }[];
    documents: { id: string; type: string; fileName: string; status: string }[];
    profile: { displayName: string; about: string } | null;
  }) {
    return {
      id: vendor.id,
      status: vendor.status,
      legalName: vendor.legalName,
      taxId: vendor.taxId,
      phone: vendor.phone,
      country: vendor.country,
      rejectionReason: vendor.rejectionReason,
      suspendedReason: vendor.suspendedReason,
      createdAt: vendor.createdAt,
      owner: {
        id: vendor.owner.id,
        email: vendor.owner.email,
        name: `${vendor.owner.firstName} ${vendor.owner.lastName}`,
      },
      stores: vendor.stores,
      documents: vendor.documents,
      profile: vendor.profile,
    };
  }
}
