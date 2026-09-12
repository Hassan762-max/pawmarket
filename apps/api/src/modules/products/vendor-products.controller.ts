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
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ProductsService } from "./products.service";

class VariantDto {
  @IsOptional()
  @IsString()
  id?: string;
  @IsString()
  @MinLength(1)
  name!: string;
  @IsString()
  @MinLength(2)
  sku!: string;
  @IsInt()
  @Min(0)
  price!: number;
  @IsOptional()
  @IsInt()
  @Min(0)
  salePrice?: number | null;
  @IsOptional()
  @IsInt()
  @Min(0)
  costPrice?: number | null;
  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number;
  @IsOptional()
  @IsInt()
  @Min(0)
  onHand?: number;
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}

class CreateProductDto {
  @IsOptional()
  @IsString()
  storeId?: string;
  @IsString()
  categoryId!: string;
  @IsString()
  @MinLength(2)
  name!: string;
  @IsOptional()
  @IsString()
  slug?: string;
  @IsOptional()
  @IsString()
  brand?: string;
  @IsOptional()
  @IsString()
  shortDescription?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsString()
  animalType?: string;
  @IsOptional()
  tags?: string[] | string;
  @IsOptional()
  @IsIn(["DRAFT", "PUBLISHED", "HIDDEN"])
  visibility?: "DRAFT" | "PUBLISHED" | "HIDDEN";
  @IsOptional()
  @IsString()
  imageUrl?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants!: VariantDto[];
}

class UpdateProductDto {
  @IsOptional()
  @IsString()
  categoryId?: string;
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
  @IsOptional()
  @IsString()
  brand?: string;
  @IsOptional()
  @IsString()
  shortDescription?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsString()
  animalType?: string;
  @IsOptional()
  tags?: string[] | string;
  @IsOptional()
  @IsIn(["DRAFT", "PUBLISHED", "HIDDEN"])
  visibility?: "DRAFT" | "PUBLISHED" | "HIDDEN";
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class InventoryDto {
  @IsInt()
  @Min(0)
  onHand!: number;
}

@Controller("vendor")
@UseGuards(JwtAuthGuard)
export class VendorProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get("products")
  list(@CurrentUser() user: { vendorId: string | null }) {
    return this.products.listForVendor(user.vendorId);
  }

  @Get("products/:id")
  one(@CurrentUser() user: { vendorId: string | null }, @Param("id") id: string) {
    return this.products.getForVendor(user.vendorId, id);
  }

  @Post("products")
  create(
    @CurrentUser() user: { userId: string; vendorId: string | null },
    @Body() body: CreateProductDto,
  ) {
    return this.products.create(user.userId, user.vendorId, body);
  }

  @Patch("products/:id")
  update(
    @CurrentUser() user: { userId: string; vendorId: string | null },
    @Param("id") id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.products.update(user.userId, user.vendorId, id, body);
  }

  @Delete("products/:id")
  remove(@CurrentUser() user: { vendorId: string | null }, @Param("id") id: string) {
    return this.products.softDelete(user.vendorId, id);
  }

  @Post("products/:id/variants")
  variant(
    @CurrentUser() user: { userId: string; vendorId: string | null },
    @Param("id") id: string,
    @Body() body: VariantDto,
  ) {
    return this.products.upsertVariant(user.userId, user.vendorId, id, body);
  }

  @Get("inventory")
  inventory(@CurrentUser() user: { vendorId: string | null }) {
    return this.products.listInventory(user.vendorId);
  }

  @Patch("inventory/:variantId")
  setStock(
    @CurrentUser() user: { userId: string; vendorId: string | null },
    @Param("variantId") variantId: string,
    @Body() body: InventoryDto,
  ) {
    return this.products.adjustInventory(user.userId, user.vendorId, variantId, body.onHand);
  }
}
