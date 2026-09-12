import { Module } from "@nestjs/common";
import {
  CardAdapter,
  CodAdapter,
  EasyPaisaAdapter,
  JazzCashAdapter,
  StripeTestAdapter,
} from "./adapters";
import { CommissionService, LedgerService } from "./commission-ledger.service";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { InventoryModule } from "../inventory/inventory.module";
import { VendorsModule } from "../vendors/vendors.module";

@Module({
  imports: [InventoryModule, VendorsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripeTestAdapter,
    CodAdapter,
    JazzCashAdapter,
    EasyPaisaAdapter,
    CardAdapter,
    CommissionService,
    LedgerService,
  ],
  exports: [
    PaymentsService,
    CommissionService,
    LedgerService,
    StripeTestAdapter,
    CodAdapter,
    JazzCashAdapter,
    EasyPaisaAdapter,
    CardAdapter,
  ],
})
export class PaymentsModule {}
