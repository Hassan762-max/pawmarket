import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CartModule } from "./modules/cart/cart.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { VendorsModule } from "./modules/vendors/vendors.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { ProductsModule } from "./modules/products/products.module";
import { AccountModule } from "./modules/account/account.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { SaasModule } from "./modules/saas/saas.module";
import { OpsModule } from "./modules/ops/ops.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { GrowthModule } from "./modules/growth/growth.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { ChatModule } from "./modules/chat/chat.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    CartModule,
    OrdersModule,
    VendorsModule,
    InventoryModule,
    ProductsModule,
    AccountModule,
    PaymentsModule,
    SaasModule,
    OpsModule,
    AnalyticsModule,
    GrowthModule,
    UploadsModule,
    ChatModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
