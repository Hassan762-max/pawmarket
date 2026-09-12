import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { IsInt, IsString, Min } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CartService } from "./cart.service";

class AddItemDto {
  @IsString()
  variantId!: string;
  @IsInt()
  @Min(1)
  quantity!: number;
}

class UpdateItemDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser() user: { userId: string }) {
    return this.cart.getCart(user.userId);
  }

  @Post("items")
  add(@CurrentUser() user: { userId: string }, @Body() body: AddItemDto) {
    return this.cart.addItem(user.userId, body.variantId, body.quantity);
  }

  @Patch("items/:id")
  update(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() body: UpdateItemDto,
  ) {
    return this.cart.updateItem(user.userId, id, body.quantity);
  }

  @Delete("items/:id")
  remove(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.cart.removeItem(user.userId, id);
  }
}
