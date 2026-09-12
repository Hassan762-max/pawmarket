import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { VendorsService } from "./vendors.service";

class ReasonDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}

@Controller("admin/vendors")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminVendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get()
  list(@Query("status") status?: string) {
    return this.vendors.adminList(status);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.vendors.adminGet(id);
  }

  @Patch(":id/approve")
  approve(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.vendors.approve(user.userId, id);
  }

  @Patch(":id/reject")
  reject(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() body: ReasonDto,
  ) {
    return this.vendors.reject(user.userId, id, body.reason ?? "");
  }

  @Patch(":id/suspend")
  suspend(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() body: ReasonDto,
  ) {
    return this.vendors.suspend(user.userId, id, body.reason ?? "");
  }

  @Patch(":id/reactivate")
  reactivate(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.vendors.reactivate(user.userId, id);
  }
}
