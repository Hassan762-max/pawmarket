import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { IsOptional, IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ProductsService } from "./products.service";

class ReasonDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}

class CategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;
  @IsOptional()
  @IsString()
  slug?: string;
  @IsOptional()
  @IsString()
  parentId?: string | null;
  @IsOptional()
  @IsString()
  animalType?: string | null;
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class CategoryPatchDto {
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsString()
  animalType?: string | null;
  @IsOptional()
  @IsString()
  imageUrl?: string;
  @IsOptional()
  @IsString()
  parentId?: string | null;
}

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminCatalogController {
  constructor(private readonly catalog: ProductsService) {}

  @Get("products")
  listProducts(@Query("status") status?: string) {
    return this.catalog.adminList(status);
  }

  @Patch("products/:id/approve")
  approve(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.catalog.approve(user.userId, id);
  }

  @Patch("products/:id/reject")
  reject(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() body: ReasonDto,
  ) {
    return this.catalog.reject(user.userId, id, body.reason ?? "");
  }

  @Post("categories")
  createCategory(@Body() body: CategoryDto) {
    return this.catalog.adminCreateCategory(body);
  }

  @Patch("categories/:id")
  updateCategory(@Param("id") id: string, @Body() body: CategoryPatchDto) {
    return this.catalog.adminUpdateCategory(id, body);
  }

  @Delete("categories/:id")
  deleteCategory(@Param("id") id: string) {
    return this.catalog.adminDeleteCategory(id);
  }
}
