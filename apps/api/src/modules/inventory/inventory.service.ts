import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type InventoryType = "RESERVE" | "RELEASE" | "COMMIT_SALE" | "ADJUST" | "RETURN";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(
    tx: Prisma.TransactionClient,
    input: {
      variantId: string;
      type: InventoryType;
      quantity: number;
      note?: string;
      actorUserId?: string;
    },
  ) {
    if (input.quantity <= 0) {
      throw new BadRequestException({ code: "INVALID_QTY", message: "Quantity must be positive." });
    }

    const variant = await tx.productVariant.findUnique({ where: { id: input.variantId } });
    if (!variant) throw new NotFoundException({ code: "NOT_FOUND", message: "Variant not found." });

    let onHand = variant.onHand;
    let reserved = variant.reserved;
    let sold = variant.sold;

    switch (input.type) {
      case "RESERVE": {
        const available = onHand - reserved;
        if (available < input.quantity) {
          throw new BadRequestException({
            code: "PRODUCT_OUT_OF_STOCK",
            message: "This product is currently out of stock.",
          });
        }
        reserved += input.quantity;
        break;
      }
      case "RELEASE":
        reserved = Math.max(0, reserved - input.quantity);
        break;
      case "COMMIT_SALE":
        if (reserved < input.quantity || onHand < input.quantity) {
          throw new BadRequestException({
            code: "INVENTORY_CONFLICT",
            message: "Cannot commit sale for this quantity.",
          });
        }
        reserved -= input.quantity;
        onHand -= input.quantity;
        sold += input.quantity;
        break;
      case "ADJUST":
        onHand = input.quantity; // absolute set for ADJUST via note "set"
        break;
      case "RETURN":
        onHand += input.quantity;
        sold = Math.max(0, sold - input.quantity);
        break;
      default:
        throw new BadRequestException("Unknown inventory transaction type");
    }

    if (onHand < 0 || reserved < 0) {
      throw new BadRequestException({ code: "INVENTORY_CONFLICT", message: "Inventory would go negative." });
    }

    const updated = await tx.productVariant.update({
      where: { id: variant.id },
      data: { onHand, reserved, sold },
    });

    await tx.inventoryTransaction.create({
      data: {
        variantId: variant.id,
        type: input.type,
        quantity: input.quantity,
        onHandAfter: updated.onHand,
        reservedAfter: updated.reserved,
        note: input.note ?? "",
        actorUserId: input.actorUserId,
      },
    });

    return updated;
  }

  /** Vendor stock set (absolute on-hand), keeping reserved intact. */
  async setOnHand(
    tx: Prisma.TransactionClient,
    variantId: string,
    onHand: number,
    actorUserId?: string,
  ) {
    if (onHand < 0) throw new BadRequestException("Stock cannot be negative");
    const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException({ code: "NOT_FOUND", message: "Variant not found." });
    if (onHand < variant.reserved) {
      throw new BadRequestException({
        code: "INVENTORY_CONFLICT",
        message: "On-hand cannot be below reserved quantity.",
      });
    }
    const updated = await tx.productVariant.update({
      where: { id: variantId },
      data: { onHand },
    });
    await tx.inventoryTransaction.create({
      data: {
        variantId,
        type: "ADJUST",
        quantity: onHand,
        onHandAfter: updated.onHand,
        reservedAfter: updated.reserved,
        note: `set onHand from ${variant.onHand} to ${onHand}`,
        actorUserId,
      },
    });
    return updated;
  }
}
