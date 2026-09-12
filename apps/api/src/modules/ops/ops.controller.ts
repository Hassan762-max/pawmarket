import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { OpsService } from "./ops.service";
import { NotificationsService } from "./notifications.service";
import { VendorsService } from "../vendors/vendors.service";
import { CatalogService } from "../catalog/catalog.service";

class CouponDto {
  @IsString()
  code!: string;
  @IsIn(["PERCENT", "FIXED"])
  type!: "PERCENT" | "FIXED";
  @IsInt()
  @Min(1)
  value!: number;
  @IsOptional()
  @IsInt()
  minSubtotal?: number;
  @IsOptional()
  @IsInt()
  maxRedemptions?: number;
  @IsOptional()
  @IsString()
  endsAt?: string;
}

class ReviewDto {
  @IsString()
  productId!: string;
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
  @IsString()
  @MinLength(2)
  title!: string;
  @IsString()
  @MinLength(2)
  comment!: string;
}

class TicketDto {
  @IsString()
  @MinLength(3)
  subject!: string;
  @IsString()
  @MinLength(3)
  body!: string;
}

class ReplyDto {
  @IsString()
  @MinLength(1)
  body!: string;
}

class ValidateCouponDto {
  @IsString()
  code!: string;
  @IsInt()
  @Min(0)
  merchandiseTotal!: number;
  @IsOptional()
  vendorIds?: string[];
}

class CmsDto {
  @IsString()
  title!: string;
  @IsString()
  content!: string;
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

@Controller()
export class OpsController {
  constructor(
    private readonly ops: OpsService,
    private readonly notifications: NotificationsService,
    private readonly vendors: VendorsService,
    private readonly catalog: CatalogService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("notifications")
  notes(@CurrentUser() user: { userId: string }) {
    return this.notifications.list(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("notifications/unread-count")
  unreadCount(@CurrentUser() user: { userId: string }) {
    return this.notifications.unreadCount(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("notifications/read")
  readAll(@CurrentUser() user: { userId: string }, @Body() body: { id?: string }) {
    return this.notifications.markRead(user.userId, body.id);
  }

  @Post("coupons/validate")
  validate(@Body() body: ValidateCouponDto) {
    return this.ops.validateCoupon(body.code, body.merchandiseTotal, body.vendorIds ?? []);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/coupons")
  adminCoupons() {
    return this.ops.listCoupons();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post("admin/coupons")
  adminCreateCoupon(@Body() body: CouponDto) {
    return this.ops.createCoupon(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("vendor/coupons")
  vendorCoupons(@CurrentUser() user: { vendorId: string | null }) {
    return this.ops.listCoupons(this.vendors.requireVendorId(user.vendorId));
  }

  @UseGuards(JwtAuthGuard)
  @Post("vendor/coupons")
  vendorCreateCoupon(
    @CurrentUser() user: { vendorId: string | null },
    @Body() body: CouponDto,
  ) {
    const vendorId = this.vendors.requireVendorId(user.vendorId);
    return this.ops.createCoupon({ ...body, vendorId, scope: "VENDOR" });
  }

  @UseGuards(JwtAuthGuard)
  @Post("reviews")
  review(@CurrentUser() user: { userId: string }, @Body() body: ReviewDto) {
    return this.ops.createReview(user.userId, body.productId, body.rating, body.title, body.comment);
  }

  @Get("products/:id/reviews")
  productReviews(@Param("id") id: string) {
    return this.ops.listProductReviews(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("support/tickets")
  myTickets(@CurrentUser() user: { userId: string }) {
    return this.ops.listTickets(user.userId, false);
  }

  @UseGuards(JwtAuthGuard)
  @Post("support/tickets")
  openTicket(@CurrentUser() user: { userId: string }, @Body() body: TicketDto) {
    return this.ops.createTicket(user.userId, body.subject, body.body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("support/tickets/:id/messages")
  reply(
    @CurrentUser() user: { userId: string; roles?: string[] },
    @Param("id") id: string,
    @Body() body: ReplyDto,
  ) {
    const isStaff = Boolean(user.roles?.includes("admin"));
    return this.ops.replyTicket(user.userId, id, body.body, isStaff);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/support")
  adminTickets() {
    return this.ops.listTickets("", true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Patch("admin/support/:id/close")
  close(@Param("id") id: string) {
    return this.ops.closeTicket(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/cms")
  cmsList() {
    return this.ops.listCms();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post("admin/cms/:slug")
  async cmsUpsert(@Param("slug") slug: string, @Body() body: CmsDto) {
    let content: unknown = body.content;
    try {
      content = JSON.parse(body.content);
    } catch {
      content = { html: body.content };
    }
    return this.catalog.upsertCms(slug, body.title, content, body.published ?? true);
  }
}
