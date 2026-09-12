import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";
import { VendorsService } from "../vendors/vendors.service";
import { SaasService } from "../saas/saas.service";
import { NotificationsService } from "../ops/notifications.service";
import { cdnImageUrl } from "../../common/observability";

export type VariantInput = {
  name: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  costPrice?: number | null;
  weightGrams?: number;
  onHand?: number;
  lowStockThreshold?: number;
};

export type ProductInput = {
  storeId?: string;
  categoryId: string;
  name: string;
  slug?: string;
  brand?: string;
  shortDescription?: string;
  description?: string;
  animalType?: string;
  tags?: string[] | string;
  visibility?: "DRAFT" | "PUBLISHED" | "HIDDEN";
  imageUrl?: string;
  variants: VariantInput[];
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly vendors: VendorsService,
    private readonly saas: SaasService,
    private readonly notifications: NotificationsService,
  ) {}

  async listForVendor(vendorId: string | null) {
    const id = this.vendors.requireVendorId(vendorId);
    const products = await this.prisma.product.findMany({
      where: { vendorId: id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        store: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: true,
      },
    });
    return products.map((p) => this.mapProduct(p));
  }

  async getForVendor(vendorId: string | null, productId: string) {
    const id = this.vendors.requireVendorId(vendorId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, vendorId: id, deletedAt: null },
      include: {
        category: true,
        store: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });
    if (!product) throw new NotFoundException({ code: "NOT_FOUND", message: "Product not found." });
    return this.mapProduct(product, true);
  }

  async create(userId: string, vendorId: string | null, input: ProductInput) {
    const id = this.vendors.requireVendorId(vendorId);
    await this.assertVendorCanCatalog(id);
    await this.saas.assertCanCreateProduct(id);
    const store = await this.resolveStore(id, input.storeId);
    const category = await this.prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new BadRequestException({ code: "INVALID_CATEGORY", message: "Category not found." });
    if (!input.variants?.length) {
      throw new BadRequestException({ code: "VARIANTS_REQUIRED", message: "At least one variant is required." });
    }

    const slug = await this.uniqueSlug(input.slug || input.name);
    const tags = Array.isArray(input.tags) ? input.tags.join(",") : input.tags ?? "";

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          vendorId: id,
          storeId: store.id,
          categoryId: category.id,
          name: input.name,
          slug,
          brand: input.brand ?? "",
          shortDescription: input.shortDescription ?? "",
          description: input.description ?? "",
          animalType: input.animalType ?? "Dogs",
          tags,
          approvalStatus: "PENDING",
          visibility: input.visibility === "PUBLISHED" ? "DRAFT" : input.visibility ?? "DRAFT",
          images: input.imageUrl
            ? { create: [{ url: input.imageUrl, alt: input.name, sortOrder: 0 }] }
            : undefined,
          variants: {
            create: input.variants.map((v) => ({
              name: v.name,
              sku: v.sku.toUpperCase(),
              price: v.price,
              salePrice: v.salePrice ?? null,
              costPrice: v.costPrice ?? null,
              weightGrams: v.weightGrams ?? 0,
              onHand: 0,
              lowStockThreshold: v.lowStockThreshold ?? 5,
            })),
          },
        },
        include: { variants: true, images: true, category: true, store: true },
      });

      for (const [i, v] of input.variants.entries()) {
        const createdVariant = created.variants.find((x) => x.sku === v.sku.toUpperCase()) ?? created.variants[i];
        if (v.onHand && v.onHand > 0) {
          await this.inventory.setOnHand(tx, createdVariant.id, v.onHand, userId);
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: created.id },
        include: { variants: true, images: true, category: true, store: true },
      });
    });

    return this.mapProduct(product, true);
  }

  async update(userId: string, vendorId: string | null, productId: string, input: Partial<ProductInput>) {
    const id = this.vendors.requireVendorId(vendorId);
    await this.assertVendorCanCatalog(id);
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, vendorId: id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Product not found." });

    if (input.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!category) throw new BadRequestException({ code: "INVALID_CATEGORY", message: "Category not found." });
    }

    const tags =
      input.tags === undefined
        ? undefined
        : Array.isArray(input.tags)
          ? input.tags.join(",")
          : input.tags;

    const product = await this.prisma.product.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        brand: input.brand,
        shortDescription: input.shortDescription,
        description: input.description,
        animalType: input.animalType,
        categoryId: input.categoryId,
        tags,
        visibility: input.visibility === "PUBLISHED" ? "DRAFT" : input.visibility,
        // Edits after approval go back to pending
        approvalStatus: "PENDING",
        rejectionReason: null,
      },
      include: { variants: true, images: true, category: true, store: true },
    });

    if (input.imageUrl) {
      await this.prisma.productImage.deleteMany({ where: { productId: product.id } });
      await this.prisma.productImage.create({
        data: { productId: product.id, url: input.imageUrl, alt: product.name, sortOrder: 0 },
      });
    }

    void userId;
    return this.getForVendor(id, product.id);
  }

  async softDelete(vendorId: string | null, productId: string) {
    const id = this.vendors.requireVendorId(vendorId);
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, vendorId: id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Product not found." });
    await this.prisma.product.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), visibility: "HIDDEN" },
    });
    return { deleted: true };
  }

  async upsertVariant(
    userId: string,
    vendorId: string | null,
    productId: string,
    input: VariantInput & { id?: string },
  ) {
    const id = this.vendors.requireVendorId(vendorId);
    await this.assertVendorCanCatalog(id);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, vendorId: id, deletedAt: null },
    });
    if (!product) throw new NotFoundException({ code: "NOT_FOUND", message: "Product not found." });

    return this.prisma.$transaction(async (tx) => {
      let variant;
      if (input.id) {
        const owned = await tx.productVariant.findFirst({
          where: { id: input.id, productId: product.id },
        });
        if (!owned) throw new NotFoundException({ code: "NOT_FOUND", message: "Variant not found." });
        variant = await tx.productVariant.update({
          where: { id: owned.id },
          data: {
            name: input.name,
            sku: input.sku.toUpperCase(),
            price: input.price,
            salePrice: input.salePrice ?? null,
            costPrice: input.costPrice ?? null,
            weightGrams: input.weightGrams ?? 0,
            lowStockThreshold: input.lowStockThreshold ?? owned.lowStockThreshold,
          },
        });
      } else {
        variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            name: input.name,
            sku: input.sku.toUpperCase(),
            price: input.price,
            salePrice: input.salePrice ?? null,
            costPrice: input.costPrice ?? null,
            weightGrams: input.weightGrams ?? 0,
            onHand: 0,
            lowStockThreshold: input.lowStockThreshold ?? 5,
          },
        });
      }

      if (input.onHand !== undefined) {
        variant = await this.inventory.setOnHand(tx, variant.id, input.onHand, userId);
      }

      await tx.product.update({
        where: { id: product.id },
        data: { approvalStatus: "PENDING", rejectionReason: null },
      });

      return variant;
    });
  }

  async adjustInventory(
    userId: string,
    vendorId: string | null,
    variantId: string,
    onHand: number,
  ) {
    const id = this.vendors.requireVendorId(vendorId);
    await this.assertVendorCanCatalog(id);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, product: { vendorId: id, deletedAt: null } },
    });
    if (!variant) throw new NotFoundException({ code: "NOT_FOUND", message: "Variant not found." });
    return this.prisma.$transaction((tx) => this.inventory.setOnHand(tx, variant.id, onHand, userId));
  }

  async listInventory(vendorId: string | null) {
    const id = this.vendors.requireVendorId(vendorId);
    const variants = await this.prisma.productVariant.findMany({
      where: { product: { vendorId: id, deletedAt: null } },
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: { sku: "asc" },
    });
    return variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      productId: v.product.id,
      productName: v.product.name,
      onHand: v.onHand,
      reserved: v.reserved,
      available: v.onHand - v.reserved,
      sold: v.sold,
      lowStockThreshold: v.lowStockThreshold,
      lowStock: v.onHand - v.reserved <= v.lowStockThreshold,
    }));
  }

  async adminList(status?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(status ? { approvalStatus: status } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        store: true,
        category: true,
        images: { take: 1 },
        variants: true,
      },
      take: 100,
    });
    return products.map((p) => this.mapProduct(p));
  }

  async approve(adminUserId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new NotFoundException({ code: "NOT_FOUND", message: "Product not found." });
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.product.update({
        where: { id: product.id },
        data: { approvalStatus: "APPROVED", visibility: "PUBLISHED", rejectionReason: null },
        include: { store: true, category: true, images: true, variants: true },
      });
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: "product.approve",
          entityType: "Product",
          entityId: product.id,
          previous: JSON.stringify({ approvalStatus: product.approvalStatus, visibility: product.visibility }),
          next: JSON.stringify({ approvalStatus: "APPROVED", visibility: "PUBLISHED" }),
        },
      });
      return next;
    });
    await this.notifyProductVendor(product.vendorId, {
      title: "Product approved",
      body: `“${product.name}” is live on the marketplace.`,
      link: "/vendor/products",
    });
    return this.mapProduct(updated, true);
  }

  async reject(adminUserId: string, productId: string, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException({ code: "REASON_REQUIRED", message: "A rejection reason is required." });
    }
    const product = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new NotFoundException({ code: "NOT_FOUND", message: "Product not found." });
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.product.update({
        where: { id: product.id },
        data: {
          approvalStatus: "REJECTED",
          visibility: "DRAFT",
          rejectionReason: reason.trim(),
        },
        include: { store: true, category: true, images: true, variants: true },
      });
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: "product.reject",
          entityType: "Product",
          entityId: product.id,
          previous: JSON.stringify({ approvalStatus: product.approvalStatus }),
          next: JSON.stringify({ approvalStatus: "REJECTED", reason: reason.trim() }),
        },
      });
      return next;
    });
    await this.notifyProductVendor(product.vendorId, {
      title: "Product rejected",
      body: `“${product.name}”: ${reason.trim()}`,
      link: "/vendor/products",
    });
    return this.mapProduct(updated, true);
  }

  private async notifyProductVendor(
    vendorId: string,
    note: { title: string; body: string; link?: string },
  ) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { ownerId: true } });
    if (!vendor) return;
    await this.notifications.notify({
      userId: vendor.ownerId,
      type: "PRODUCT_STATUS",
      title: note.title,
      body: note.body,
      link: note.link,
    });
  }

  async adminCreateCategory(input: {
    name: string;
    slug?: string;
    parentId?: string | null;
    animalType?: string | null;
    imageUrl?: string;
  }) {
    const slug =
      (input.slug || input.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `cat-${Date.now()}`;
    return this.prisma.category.create({
      data: {
        name: input.name,
        slug,
        parentId: input.parentId || null,
        animalType: input.animalType || null,
        imageUrl: input.imageUrl || "",
      },
    });
  }

  async adminUpdateCategory(
    id: string,
    input: { name?: string; animalType?: string | null; imageUrl?: string; parentId?: string | null },
  ) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Category not found." });
    return this.prisma.category.update({ where: { id }, data: input });
  }

  async adminDeleteCategory(id: string) {
    const count = await this.prisma.product.count({ where: { categoryId: id, deletedAt: null } });
    if (count > 0) {
      throw new BadRequestException({
        code: "CATEGORY_IN_USE",
        message: "Move or delete products in this category first.",
      });
    }
    const children = await this.prisma.category.count({ where: { parentId: id } });
    if (children > 0) {
      throw new BadRequestException({
        code: "CATEGORY_HAS_CHILDREN",
        message: "Delete child categories first.",
      });
    }
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertVendorCanCatalog(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.status === "SUSPENDED") {
      throw new ForbiddenException({
        code: "VENDOR_SUSPENDED",
        message: "Suspended vendors cannot manage catalog.",
      });
    }
    if (vendor.status !== "APPROVED") {
      throw new ForbiddenException({
        code: "VENDOR_NOT_APPROVED",
        message: "Vendor must be approved before managing catalog.",
      });
    }
  }

  private async resolveStore(vendorId: string, storeId?: string) {
    const store = storeId
      ? await this.prisma.store.findFirst({ where: { id: storeId, vendorId } })
      : await this.prisma.store.findFirst({ where: { vendorId }, orderBy: { createdAt: "asc" } });
    if (!store) throw new BadRequestException({ code: "STORE_REQUIRED", message: "Create a store first." });
    return store;
  }

  private async uniqueSlug(base: string) {
    const root =
      base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50) || `product-${Date.now()}`;
    let slug = root;
    let i = 1;
    while (await this.prisma.product.findUnique({ where: { slug } })) {
      slug = `${root}-${i++}`;
    }
    return slug;
  }

  private mapProduct(
    p: {
      id: string;
      name: string;
      slug: string;
      brand: string;
      shortDescription: string;
      description?: string;
      animalType: string;
      tags: string;
      approvalStatus: string;
      rejectionReason?: string | null;
      visibility: string;
      store: { id: string; name: string; slug: string };
      category: { id: string; name: string; slug: string };
      images: { url: string; alt: string }[];
      variants: {
        id: string;
        name: string;
        sku: string;
        price: number;
        salePrice: number | null;
        costPrice?: number | null;
        onHand: number;
        reserved: number;
        sold: number;
        lowStockThreshold?: number;
        weightGrams?: number;
      }[];
    },
    detailed = false,
  ) {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      shortDescription: p.shortDescription,
      description: detailed ? p.description : undefined,
      animalType: p.animalType,
      tags: p.tags ? p.tags.split(",").filter(Boolean) : [],
      approvalStatus: p.approvalStatus,
      rejectionReason: p.rejectionReason ?? null,
      visibility: p.visibility,
      image: cdnImageUrl(p.images[0]?.url ?? null),
      images: detailed
        ? p.images.map((i) => ({ ...i, url: cdnImageUrl(i.url) ?? i.url }))
        : undefined,
      store: p.store,
      category: p.category,
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        salePrice: v.salePrice,
        costPrice: detailed ? v.costPrice ?? null : undefined,
        onHand: v.onHand,
        reserved: v.reserved,
        available: v.onHand - v.reserved,
        sold: v.sold,
        lowStockThreshold: v.lowStockThreshold ?? 5,
        weightGrams: v.weightGrams ?? 0,
      })),
    };
  }
}
