import { ChatService } from "./chatService";

export class ChatController {
  constructor(private chatService: ChatService) {}

  chat(message: string): AsyncGenerator<string> {
    return this.chatService.chat(message);
  }
}
