import { Module, forwardRef } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../ops/notifications.module";
import { VendorsController } from "./vendors.controller";
import { AdminVendorsController } from "./admin-vendors.controller";
import { VendorsService } from "./vendors.service";

@Module({
  imports: [forwardRef(() => AuthModule), NotificationsModule],
  controllers: [VendorsController, AdminVendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
