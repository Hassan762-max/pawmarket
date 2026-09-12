import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { CartModule } from "../cart/cart.module";
import { InventoryModule } from "../inventory/inventory.module";
import { VendorsModule } from "../vendors/vendors.module";
import { AccountModule } from "../account/account.module";
import { PaymentsModule } from "../payments/payments.module";
import { OpsModule } from "../ops/ops.module";

@Module({
  imports: [CartModule, InventoryModule, VendorsModule, AccountModule, PaymentsModule, OpsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
