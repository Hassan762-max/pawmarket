import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { cdnImageUrl } from "../../common/observability";

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { label: "asc" }],
    });
  }

  async createAddress(
    userId: string,
    data: {
      label: string;
      line1: string;
      city: string;
      region: string;
      postalCode: string;
      country?: string;
      isDefault?: boolean;
    },
  ) {
    if (data.isDefault !== false) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({
      data: {
        userId,
        label: data.label,
        line1: data.line1,
        city: data.city,
        region: data.region,
        postalCode: data.postalCode,
        country: data.country ?? "US",
        isDefault: data.isDefault !== false,
      },
    });
  }

  async updateAddress(
    userId: string,
    id: string,
    data: Partial<{
      label: string;
      line1: string;
      city: string;
      region: string;
      postalCode: string;
      country: string;
      isDefault: boolean;
    }>,
  ) {
    const existing = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException("Address not found");
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.update({ where: { id }, data });
  }

  async deleteAddress(userId: string, id: string) {
    await this.prisma.address.deleteMany({ where: { id, userId } });
    return { ok: true };
  }

  async listWishlist(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            images: { take: 1 },
            variants: true,
            store: true,
          },
        },
      },
    });
    return items
      .filter((i) => !i.product.deletedAt && i.product.visibility === "PUBLISHED")
      .map((i) => {
        const prices = i.product.variants.map((v) => v.salePrice ?? v.price);
        return {
          id: i.id,
          productId: i.productId,
          name: i.product.name,
          slug: i.product.slug,
          image: cdnImageUrl(i.product.images[0]?.url ?? null),
          priceFrom: prices.length ? Math.min(...prices) : 0,
          store: { name: i.product.store.name, slug: i.product.store.slug },
        };
      });
  }

  async addWishlist(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        visibility: "PUBLISHED",
        approvalStatus: "APPROVED",
        deletedAt: null,
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
    return this.listWishlist(userId);
  }

  async removeWishlist(userId: string, productId: string) {
    await this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return this.listWishlist(userId);
  }

  async requireAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) {
      throw new BadRequestException({
        code: "ADDRESS_REQUIRED",
        message: "Choose a shipping address.",
      });
    }
    return address;
  }
}
