import { Module, forwardRef } from "@nestjs/common";
import { OpsController } from "./ops.controller";
import { OpsService } from "./ops.service";
import { NotificationsModule } from "./notifications.module";
import { VendorsModule } from "../vendors/vendors.module";
import { CatalogModule } from "../catalog/catalog.module";

@Module({
  imports: [forwardRef(() => VendorsModule), CatalogModule, NotificationsModule],
  controllers: [OpsController],
  providers: [OpsService],
  exports: [OpsService, NotificationsModule],
})
export class OpsModule {}
