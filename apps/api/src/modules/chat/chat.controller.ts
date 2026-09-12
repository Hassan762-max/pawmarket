import { Body, Controller, Post } from "@nestjs/common";
import { ChatDto } from "./chat.dto";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  ask(@Body() body: ChatDto) {
    return this.chat.reply(body.message, body.history ?? []);
  }
}
