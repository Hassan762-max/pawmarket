import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { SaasService } from "./saas.service";
import { VendorsService } from "../vendors/vendors.service";

class PlanDto {
  @IsOptional()
  @IsString()
  id?: string;
  @IsString()
  @MinLength(2)
  slug!: string;
  @IsString()
  name!: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsInt()
  @Min(0)
  priceMonthly!: number;
  @IsInt()
  @Min(1)
  productLimit!: number;
  @IsInt()
  @Min(1)
  storeLimit!: number;
  @IsInt()
  @Min(0)
  staffLimit!: number;
  @IsOptional()
  @IsString()
  analyticsLevel?: string;
  @IsOptional()
  @IsBoolean()
  featuredListing?: boolean;
  @IsOptional()
  @IsBoolean()
  active?: boolean;
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ChangePlanDto {
  @IsString()
  planSlug!: string;
}

@Controller()
export class SaasController {
  constructor(
    private readonly saas: SaasService,
    private readonly vendors: VendorsService,
  ) {}

  @Get("plans")
  plans() {
    return this.saas.listPlans(true);
  }

  @UseGuards(JwtAuthGuard)
  @Get("vendor/subscription")
  mine(@CurrentUser() user: { vendorId: string | null }) {
    return this.saas.getVendorSubscription(this.vendors.requireVendorId(user.vendorId));
  }

  @UseGuards(JwtAuthGuard)
  @Post("vendor/subscription")
  change(@CurrentUser() user: { vendorId: string | null }, @Body() body: ChangePlanDto) {
    return this.saas.changePlan(this.vendors.requireVendorId(user.vendorId), body.planSlug);
  }

  @UseGuards(JwtAuthGuard)
  @Post("vendor/subscription/cancel")
  cancel(@CurrentUser() user: { vendorId: string | null }) {
    return this.saas.cancel(this.vendors.requireVendorId(user.vendorId), true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/plans")
  adminPlans() {
    return this.saas.listPlans(false);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Put("admin/plans")
  upsert(@Body() body: PlanDto) {
    return this.saas.adminUpsertPlan(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/subscriptions")
  adminSubs() {
    return this.saas.adminListSubscriptions();
  }
}
