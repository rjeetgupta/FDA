import "dotenv/config"
import { OpenAI } from "openai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export class ChatService {
  private chatClient: OpenAI;
  private chatHistory: Message[];

  static readonly SYSTEM_PROMPT = `
    You are a funny AI chatbot. You reply everything sarcastically
  `;

  constructor() {
    this.chatClient = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL,
    });
    this.chatHistory = [];
  }

  async *chat(message: string): AsyncGenerator<string> {
    this.chatHistory.push({
      role: "user",
      content: message,
    });

    let fullResponse = "";

    const response = await this.chatClient.responses.create({
      model: "gpt-5.6-luna",
      instructions: ChatService.SYSTEM_PROMPT,
      input: this.chatHistory,
      stream: true,
    });

    for await (const chunks of response) {
      if (chunks.type === `response.output_text.delta`) {
        fullResponse += chunks.delta;
        yield chunks.delta;
      }
    }

    this.chatHistory.push({
      role: "assistant",
      content: fullResponse,
    });
  }
}
