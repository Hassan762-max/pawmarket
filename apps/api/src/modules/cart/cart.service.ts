import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { cdnImageUrl } from "../../common/observability";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: { take: 1 },
                store: true,
              },
            },
          },
        },
      },
    });

    const groupsMap = new Map<
      string,
      {
        store: { id: string; name: string; slug: string };
        items: ReturnType<CartService["mapItem"]>[];
        subtotal: number;
      }
    >();

    for (const item of items) {
      const mapped = this.mapItem(item);
      const store = item.variant.product.store;
      const group = groupsMap.get(store.id) ?? {
        store: { id: store.id, name: store.name, slug: store.slug },
        items: [],
        subtotal: 0,
      };
      group.items.push(mapped);
      group.subtotal += mapped.lineTotal;
      groupsMap.set(store.id, group);
    }

    const groups = [...groupsMap.values()];
    const merchandiseTotal = groups.reduce((s, g) => s + g.subtotal, 0);
    return {
      id: cart.id,
      groups,
      merchandiseTotal,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
    };
  }

  async addItem(userId: string, variantId: string, quantity: number) {
    if (quantity < 1) throw new BadRequestException("Quantity must be at least 1");
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { include: { store: { include: { vendor: true } } } } },
    });
    if (!variant || variant.product.visibility !== "PUBLISHED" || variant.product.approvalStatus !== "APPROVED") {
      throw new NotFoundException({ code: "PRODUCT_NOT_FOUND", message: "Variant not found." });
    }
    if (variant.product.store.status !== "ACTIVE" || variant.product.store.vendor.status !== "APPROVED") {
      throw new BadRequestException({
        code: "VENDOR_NOT_APPROVED",
        message: "This store is not currently selling on PawMarket.",
      });
    }
    const available = variant.onHand - variant.reserved;
    if (available < quantity) {
      throw new BadRequestException({
        code: "PRODUCT_OUT_OF_STOCK",
        message: "This product is currently out of stock.",
      });
    }
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      create: { cartId: cart.id, variantId, quantity },
      update: { quantity: { increment: quantity } },
    });
    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException("Cart item not found");
    if (quantity < 1) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return this.getCart(userId);
  }

  private mapItem(item: {
    id: string;
    quantity: number;
    variant: {
      id: string;
      name: string;
      price: number;
      salePrice: number | null;
      product: {
        name: string;
        slug: string;
        images: { url: string }[];
        store: { id: string; name: string; slug: string };
      };
    };
  }) {
    const unitPrice = item.variant.salePrice ?? item.variant.price;
    return {
      id: item.id,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      variantId: item.variant.id,
      variantName: item.variant.name,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      image: cdnImageUrl(item.variant.product.images[0]?.url ?? null),
      store: item.variant.product.store,
    };
  }
}
