import "dotenv/config";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
});

const model = process.env.OPENAI_MODEL || "~openai/gpt-sol-latest";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const history: Message[] = [];

const system_prompt = `
      You are a customer support executive for our college event management named EventHub

      You job is to identify the customer main problems and urgency, answer them related to query in 2 line.

      User professional language. If user has an issue, use word like I understand your frustration, I am really
      sorry for the inconvenience.

      Do not answer any other questions which are not related to the event management for collge. 
  `

export async function chatService(message: string): Promise<string> {

  history.push({
    role: "user",
    content: message
  })
  
  const response = await openai.chat.completions.create({
    model,
    max_tokens: 200,
    
    messages: [
      { role: "system", content: system_prompt },
      ...history,
    ],
  });

  const content = response.choices[0]?.message?.content

  if (!content) {
    throw new Error("OpenAI does not provide any responses");
  }

  history.push({
    role: "assistant",
    content,
  });

  return content;
}
