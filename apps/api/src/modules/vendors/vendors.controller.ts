import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { IsEmail, IsIn, IsOptional, IsString, Length, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { VendorsService } from "./vendors.service";

class OnboardDto {
  @IsString()
  @MinLength(6)
  phone!: string;
  @IsString()
  @Length(2, 2)
  country!: string;
  @IsString()
  @MinLength(2)
  legalName!: string;
  @IsString()
  @MinLength(4)
  taxId!: string;
  @IsOptional()
  @IsString()
  about?: string;
  @IsString()
  @MinLength(2)
  storeName!: string;
  @IsString()
  @MinLength(2)
  storeSlug!: string;
  @IsOptional()
  @IsString()
  tagline?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsString()
  @MinLength(2)
  payoutHolderName!: string;
  @IsString()
  @Length(4, 4)
  payoutLast4!: string;
}

class DocumentDto {
  @IsIn(["id", "business_license", "tax_form"])
  type!: string;
  @IsString()
  fileName!: string;
  @IsString()
  mimeType!: string;
}

class StorePatchDto {
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsString()
  tagline?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsString()
  logoUrl?: string;
  @IsOptional()
  @IsString()
  bannerUrl?: string;
}

class StaffDto {
  @IsEmail()
  email!: string;
  @IsIn(["manager", "packer", "finance"])
  roleSlug!: string;
}

@Controller("vendor")
@UseGuards(JwtAuthGuard)
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get("profile")
  profile(@CurrentUser() user: { userId: string }) {
    return this.vendors.getMine(user.userId);
  }

  @Post("onboarding")
  onboard(@CurrentUser() user: { userId: string }, @Body() body: OnboardDto) {
    return this.vendors.onboard(user.userId, body);
  }

  @Post("documents")
  documents(@CurrentUser() user: { userId: string }, @Body() body: DocumentDto) {
    return this.vendors.addDocument(user.userId, body);
  }

  @Patch("stores/:id")
  updateStore(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() body: StorePatchDto,
  ) {
    return this.vendors.updateStore(user.userId, id, body);
  }

  @Get("staff")
  staff(@CurrentUser() user: { userId: string }) {
    return this.vendors.listStaff(user.userId);
  }

  @Post("staff")
  invite(@CurrentUser() user: { userId: string }, @Body() body: StaffDto) {
    return this.vendors.inviteStaff(user.userId, body.email, body.roleSlug);
  }
}
