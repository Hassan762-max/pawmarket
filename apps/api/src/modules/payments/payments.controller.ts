import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PaymentsService } from "./payments.service";
import { VendorsService } from "../vendors/vendors.service";

class RefundDto {
  @IsInt()
  @Min(1)
  amount!: number;
  @IsString()
  @MinLength(3)
  reason!: string;
  @IsOptional()
  @IsBoolean()
  restock?: boolean;
}

class PayoutDto {
  @IsInt()
  @Min(1)
  amount!: number;
  @IsOptional()
  @IsString()
  note?: string;
}

class DecideDto {
  @IsBoolean()
  approve!: boolean;
}

class CommissionDto {
  @IsInt()
  @Min(0)
  rateBps!: number;
  @IsOptional()
  @IsString()
  vendorId?: string;
}

@Controller()
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly vendors: VendorsService,
  ) {}

  @Get("payments/methods")
  methods() {
    return this.payments.listMethods();
  }

  @Post("payments/webhooks/:provider")
  webhook(
    @Param("provider") provider: string,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: unknown,
  ) {
    return this.payments.handleWebhook(provider, headers, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("orders/:id/refunds")
  requestRefund(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() body: RefundDto,
  ) {
    return this.payments.requestRefund(user.userId, id, body.amount, body.reason, body.restock);
  }

  @UseGuards(JwtAuthGuard)
  @Get("vendor/earnings")
  earnings(@CurrentUser() user: { vendorId: string | null }) {
    return this.payments.vendorEarnings(this.vendors.requireVendorId(user.vendorId));
  }

  @UseGuards(JwtAuthGuard)
  @Post("vendor/earnings/release")
  release(@CurrentUser() user: { vendorId: string | null }) {
    return this.payments.releaseMyPending(this.vendors.requireVendorId(user.vendorId));
  }

  @UseGuards(JwtAuthGuard)
  @Post("vendor/payouts")
  payout(@CurrentUser() user: { vendorId: string | null }, @Body() body: PayoutDto) {
    return this.payments.requestPayout(
      this.vendors.requireVendorId(user.vendorId),
      body.amount,
      body.note,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/refunds")
  adminRefunds() {
    return this.payments.adminListRefunds();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Patch("admin/refunds/:id")
  adminRefund(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() body: DecideDto,
  ) {
    return this.payments.adminDecideRefund(user.userId, id, body.approve);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/payouts")
  adminPayouts(@Query("status") status?: string) {
    return this.payments.adminListPayouts(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Patch("admin/payouts/:id")
  adminPayout(@Param("id") id: string, @Body() body: DecideDto) {
    return this.payments.adminDecidePayout(id, body.approve);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post("admin/commission")
  setCommission(@Body() body: CommissionDto) {
    return this.payments.adminSetCommission(body.rateBps, body.vendorId);
  }
}
