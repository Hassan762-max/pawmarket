import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { OrdersService } from "./orders.service";
import { VendorsService } from "../vendors/vendors.service";

class CheckoutDto {
  @IsOptional()
  @IsIn(["jazzcash", "easypaisa", "card", "cod"])
  paymentMethod?: "jazzcash" | "easypaisa" | "card" | "cod";

  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientGrandTotal?: number;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class VendorOrderPatchDto {
  @IsOptional()
  @IsIn(["PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"])
  status?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  carrier?: string;
}

@Controller()
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly vendors: VendorsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("checkout/quote")
  quote(@CurrentUser() user: { userId: string }) {
    return this.orders.quote(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("checkout")
  checkout(@CurrentUser() user: { userId: string }, @Body() body: CheckoutDto) {
    return this.orders.checkout(
      user.userId,
      body.paymentMethod ?? "card",
      body.addressId,
      body.clientGrandTotal,
      body.couponCode,
      body.phone,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("orders")
  list(@CurrentUser() user: { userId: string }) {
    return this.orders.listForUser(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("orders/:id")
  one(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.orders.getForUser(user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("vendor/orders")
  vendorOrders(@CurrentUser() user: { vendorId: string | null }) {
    const vendorId = this.vendors.requireVendorId(user.vendorId);
    return this.orders.listVendorOrders(vendorId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("vendor/orders/:id")
  patchVendorOrder(
    @CurrentUser() user: { vendorId: string | null },
    @Param("id") id: string,
    @Body() body: VendorOrderPatchDto,
  ) {
    const vendorId = this.vendors.requireVendorId(user.vendorId);
    return this.orders.updateVendorOrder(
      vendorId,
      id,
      body.status,
      body.trackingNumber,
      body.carrier,
    );
  }
}
