import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AccountService } from "./account.service";

class AddressDto {
  @IsString()
  @MinLength(1)
  label!: string;
  @IsString()
  @MinLength(2)
  line1!: string;
  @IsString()
  city!: string;
  @IsString()
  region!: string;
  @IsString()
  postalCode!: string;
  @IsOptional()
  @IsString()
  country?: string;
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

class WishlistDto {
  @IsString()
  productId!: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get("addresses")
  addresses(@CurrentUser() user: { userId: string }) {
    return this.account.listAddresses(user.userId);
  }

  @Post("addresses")
  createAddress(@CurrentUser() user: { userId: string }, @Body() body: AddressDto) {
    return this.account.createAddress(user.userId, body);
  }

  @Patch("addresses/:id")
  updateAddress(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() body: Partial<AddressDto>,
  ) {
    return this.account.updateAddress(user.userId, id, body);
  }

  @Delete("addresses/:id")
  deleteAddress(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.account.deleteAddress(user.userId, id);
  }

  @Get("wishlist")
  wishlist(@CurrentUser() user: { userId: string }) {
    return this.account.listWishlist(user.userId);
  }

  @Post("wishlist")
  addWishlist(@CurrentUser() user: { userId: string }, @Body() body: WishlistDto) {
    return this.account.addWishlist(user.userId, body.productId);
  }

  @Delete("wishlist/:productId")
  removeWishlist(@CurrentUser() user: { userId: string }, @Param("productId") productId: string) {
    return this.account.removeWishlist(user.userId, productId);
  }
}
