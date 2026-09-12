import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { IsArray, IsBoolean, IsOptional, IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { GrowthService } from "./growth.service";

class CampaignDto {
  @IsString()
  @MinLength(2)
  name!: string;
  @IsString()
  subject!: string;
  @IsString()
  body!: string;
  @IsOptional()
  @IsString()
  audience?: string;
}

class ExperimentDto {
  @IsString()
  key!: string;
  @IsString()
  name!: string;
  @IsOptional()
  @IsArray()
  variants?: string[];
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@Controller()
export class GrowthController {
  constructor(private readonly growth: GrowthService) {}

  @UseGuards(JwtAuthGuard)
  @Get("account/referral")
  referral(@CurrentUser() user: { userId: string }) {
    return this.growth.referralStats(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/campaigns")
  campaigns() {
    return this.growth.listCampaigns();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post("admin/campaigns")
  createCampaign(@Body() body: CampaignDto) {
    return this.growth.createCampaign(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post("admin/campaigns/:id/send")
  sendCampaign(@Param("id") id: string) {
    return this.growth.sendCampaign(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/experiments")
  experiments() {
    return this.growth.listExperiments();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Post("admin/experiments")
  upsertExperiment(@Body() body: ExperimentDto) {
    return this.growth.upsertExperiment(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("admin/experiments/:key/stats")
  experimentStats(@Param("key") key: string) {
    return this.growth.experimentStats(key);
  }

  @Get("experiments/:key")
  assign(@Param("key") key: string, @Query("v") visitorKey?: string) {
    const vk = visitorKey || this.growth.newVisitorKey();
    return this.growth.assignVariant(key, vk).then((r) => ({ ...r, visitorKey: vk }));
  }
}
