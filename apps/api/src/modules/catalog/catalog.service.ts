import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { cdnImageUrl } from "../../common/observability";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(query: {
    q?: string;
    category?: string;
    animal?: string;
    store?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    onSale?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(48, Math.max(1, Number(query.pageSize ?? 12)));
    const where: Prisma.ProductWhereInput = {
      visibility: "PUBLISHED",
      approvalStatus: "APPROVED",
      deletedAt: null,
      store: {
        status: "ACTIVE",
        vendor: { status: "APPROVED" },
        ...(query.store ? { slug: query.store } : {}),
      },
    };
    if (query.category) where.category = { slug: query.category };
    // If both animal + category are set, category wins (avoids Fish+Parrots = 0 results)
    else if (query.animal) where.animalType = query.animal;
    if (query.onSale) where.variants = { some: { salePrice: { not: null } } };
    if (query.q) {
      where.OR = [
        { name: { contains: query.q } },
        { brand: { contains: query.q } },
        { tags: { contains: query.q } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    switch (query.sort) {
      case "rating":
        orderBy = { ratingAvg: "desc" };
        break;
      case "best_selling":
        orderBy = { soldCount: "desc" };
        break;
      case "price_asc":
      case "price_desc":
        orderBy = { createdAt: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const items = await this.prisma.product.findMany({
      where,
      orderBy,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: true,
        store: true,
        category: true,
      },
    });

    let data = items.map((p) => this.mapProduct(p));
    if (query.minPrice != null) data = data.filter((p) => p.priceFrom >= query.minPrice!);
    if (query.maxPrice != null) data = data.filter((p) => p.priceFrom <= query.maxPrice!);
    if (query.sort === "price_asc") data.sort((a, b) => a.priceFrom - b.priceFrom);
    if (query.sort === "price_desc") data.sort((a, b) => b.priceFrom - a.priceFrom);

    const total = data.length;
    const paged = data.slice((page - 1) * pageSize, page * pageSize);
    return {
      data: paged,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 },
    };
  }

  async getProduct(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        visibility: "PUBLISHED",
        approvalStatus: "APPROVED",
        deletedAt: null,
        store: { status: "ACTIVE", vendor: { status: "APPROVED" } },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        store: true,
        category: true,
        reviews: { include: { user: true }, take: 10, orderBy: { createdAt: "desc" } },
      },
    });
    if (!product) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Product not found." });
    }
    return this.mapProduct(product, true);
  }

  async listCategories() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: "asc" },
    });
  }

  async listStores() {
    return this.prisma.store.findMany({
      where: { status: "ACTIVE", vendor: { status: "APPROVED" } },
      orderBy: { name: "asc" },
    });
  }

  async getStore(slug: string) {
    const store = await this.prisma.store.findFirst({
      where: { slug, status: "ACTIVE", vendor: { status: "APPROVED" } },
    });
    if (!store) throw new NotFoundException({ code: "NOT_FOUND", message: "Store not found." });
    const products = await this.listProducts({ store: slug, pageSize: 24 });
    return { ...store, products: products.data };
  }

  async homepage() {
    const cms = await this.prisma.cmsPage.findUnique({ where: { slug: "home" } });
    const fallbackHero = {
      title: "Everything your pet needs, from shops you can trust",
      subtitle:
        "One cart across many specialty stores — food, toys, habitats, and gear for dogs, cats, fish, birds, and more.",
      cta: "Shop the marketplace",
      image:
        "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1600&q=80",
    };
    const hero = cms ? (JSON.parse(cms.content).hero as typeof fallbackHero) : fallbackHero;

    const [featuredCategories, popular, stores, deals, newest] = await Promise.all([
      this.prisma.category.findMany({ where: { parentId: { not: null } }, take: 8 }),
      this.listProducts({ sort: "best_selling", pageSize: 8 }),
      this.listStores(),
      this.listProducts({ onSale: true, pageSize: 8, sort: "price_asc" }),
      this.listProducts({ sort: "newest", pageSize: 8 }),
    ]);
    return {
      hero,
      featuredCategories: featuredCategories.map((c) => ({
        ...c,
        imageUrl: cdnImageUrl(c.imageUrl) ?? c.imageUrl,
      })),
      popularProducts: popular.data,
      featuredStores: stores.map((s) => ({
        ...s,
        logoUrl: cdnImageUrl(s.logoUrl) ?? s.logoUrl,
        bannerUrl: cdnImageUrl(s.bannerUrl) ?? s.bannerUrl,
      })),
      deals: deals.data,
      newArrivals: newest.data,
      animalTypes: ["Dogs", "Cats", "Birds", "Fish", "Rabbits", "Hamsters", "Reptiles", "Hens", "Goats", "Cows", "Other"],
    };
  }

  async getCms(slug: string) {
    const page = await this.prisma.cmsPage.findFirst({ where: { slug, published: true } });
    if (!page) throw new NotFoundException({ code: "NOT_FOUND", message: "Page not found." });
    return { ...page, content: JSON.parse(page.content) };
  }

  async upsertCms(slug: string, title: string, content: unknown, published = true) {
    return this.prisma.cmsPage.upsert({
      where: { slug },
      create: { slug, title, content: JSON.stringify(content), published },
      update: { title, content: JSON.stringify(content), published },
    });
  }

  async sitemapEntries() {
    const [products, stores, categories] = await Promise.all([
      this.prisma.product.findMany({
        where: { visibility: "PUBLISHED", approvalStatus: "APPROVED", deletedAt: null },
        select: { slug: true, updatedAt: true },
      }),
      this.listStores(),
      this.prisma.category.findMany({ select: { slug: true } }),
    ]);
    return {
      products: products.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })),
      stores: stores.map((s) => ({ slug: s.slug })),
      categories: categories.map((c) => ({ slug: c.slug })),
    };
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
      ratingAvg: number;
      soldCount: number;
      tags: string;
      images: { url: string; alt: string }[];
      variants: { id: string; name: string; sku: string; price: number; salePrice: number | null; onHand: number; reserved: number }[];
      store: { id: string; name: string; slug: string };
      category: { id: string; name: string; slug: string };
      reviews?: { id: string; rating: number; title: string; comment: string; user: { firstName: string } }[];
    },
    detailed = false,
  ) {
    const prices = p.variants.map((v) => v.salePrice ?? v.price);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      shortDescription: p.shortDescription,
      description: detailed ? p.description : undefined,
      animalType: p.animalType,
      ratingAvg: Number(p.ratingAvg.toFixed(1)),
      soldCount: p.soldCount,
      tags: p.tags.split(","),
      image: cdnImageUrl(p.images[0]?.url ?? null),
      images: detailed ? p.images.map((i) => ({ ...i, url: cdnImageUrl(i.url) ?? i.url })) : undefined,
      priceFrom: Math.min(...prices),
      priceTo: Math.max(...prices),
      hasSale: p.variants.some((v) => v.salePrice != null),
      store: p.store,
      category: p.category,
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        salePrice: v.salePrice,
        available: Math.max(0, v.onHand - v.reserved),
      })),
      reviews: detailed ? p.reviews : undefined,
    };
  }
}
