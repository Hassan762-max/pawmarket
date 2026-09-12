import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AnalyticsService } from "./analytics.service";
import { VendorsService } from "../vendors/vendors.service";

@Controller()
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly vendors: VendorsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/analytics/overview")
  adminOverview() {
    return this.analytics.adminOverview();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/analytics/report")
  adminReport() {
    return this.analytics.adminOverview();
  }

  @UseGuards(JwtAuthGuard)
  @Get("vendor/analytics")
  vendor(@CurrentUser() user: { vendorId: string | null }) {
    return this.analytics.vendorDashboard(this.vendors.requireVendorId(user.vendorId));
  }
}
