import { Module } from "@nestjs/common";
import { SaasController } from "./saas.controller";
import { SaasService } from "./saas.service";
import { VendorsModule } from "../vendors/vendors.module";

@Module({
  imports: [VendorsModule],
  controllers: [SaasController],
  providers: [SaasService],
  exports: [SaasService],
})
export class SaasModule {}
