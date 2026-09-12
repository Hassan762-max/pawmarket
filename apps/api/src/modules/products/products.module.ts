import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { InventoryModule } from "../inventory/inventory.module";
import { VendorsModule } from "../vendors/vendors.module";
import { SaasModule } from "../saas/saas.module";
import { NotificationsModule } from "../ops/notifications.module";
import { ProductsService } from "./products.service";
import { VendorProductsController } from "./vendor-products.controller";
import { AdminCatalogController } from "./admin-catalog.controller";

@Module({
  imports: [AuthModule, InventoryModule, VendorsModule, SaasModule, NotificationsModule],
  controllers: [VendorProductsController, AdminCatalogController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
