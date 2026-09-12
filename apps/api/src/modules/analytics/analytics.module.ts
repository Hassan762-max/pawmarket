import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsCacheService } from "./analytics-cache.service";
import { VendorsModule } from "../vendors/vendors.module";
import { SaasModule } from "../saas/saas.module";

@Module({
  imports: [VendorsModule, SaasModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsCacheService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
