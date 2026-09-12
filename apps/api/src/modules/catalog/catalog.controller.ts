import { Body, Controller, Get, Param, Put, Query, UseGuards } from "@nestjs/common";
import { IsBoolean, IsObject, IsOptional, IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CatalogService } from "./catalog.service";

class CmsDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsObject()
  content!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("homepage")
  homepage() {
    return this.catalog.homepage();
  }

  @Get("sitemap-data")
  sitemap() {
    return this.catalog.sitemapEntries();
  }

  @Get("cms/:slug")
  cms(@Param("slug") slug: string) {
    return this.catalog.getCms(slug);
  }

  @Put("admin/cms/:slug")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  upsertCms(@Param("slug") slug: string, @Body() body: CmsDto) {
    return this.catalog.upsertCms(slug, body.title, body.content, body.published ?? true);
  }

  @Get("products")
  products(
    @Query("q") q?: string,
    @Query("category") category?: string,
    @Query("animal") animal?: string,
    @Query("store") store?: string,
    @Query("sort") sort?: string,
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
    @Query("onSale") onSale?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.catalog.listProducts({
      q,
      category,
      animal,
      store,
      sort,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      onSale: onSale === "1" || onSale === "true",
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 12,
    });
  }

  @Get("products/:slug")
  product(@Param("slug") slug: string) {
    return this.catalog.getProduct(slug);
  }

  @Get("categories")
  categories() {
    return this.catalog.listCategories();
  }

  @Get("stores")
  stores() {
    return this.catalog.listStores();
  }

  @Get("stores/:slug")
  store(@Param("slug") slug: string) {
    return this.catalog.getStore(slug);
  }

  @Get("search")
  search(
    @Query("q") q?: string,
    @Query("sort") sort?: string,
    @Query("animal") animal?: string,
    @Query("category") category?: string,
  ) {
    return this.catalog.listProducts({ q, sort, animal, category, pageSize: 24 });
  }
}
