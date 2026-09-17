// import OpenAI from "openai";

// const openai = new OpenAI();
// const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";


// export async function summarizeTicket(ticket: string): Promise<string> {
//   const response = await openai.responses.create({
//     model,
//     input: `Summarize this support ticket in 2 lines : \n\n${ticket}`,
//     store: false,
//   });

//   if (!response.output_text) {
//     throw new Error("OpenAI returned an empty summary");
//   }

//   return response.output_text;
// }



import "dotenv/config";
import { OpenRouter } from "@openrouter/sdk";

const client = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const model = process.env.OPENROUTER_MODEL || "openai/gpt-5.6-luna";

export async function summarizeTicket(ticket: string): Promise<string> {
  const response = await client.chat.send({
    chatRequest: {
      model,
      maxTokens: 200,
      messages: [
        {
          role: "user",
          content: `Summarize this support ticket in 2 lines:\n\n${ticket}`,
        },
      ],
    },
  });

  if (response instanceof ReadableStream) {
    throw new Error("Expected a non-streaming response");
  }

  const summary = response.choices[0]?.message?.content;

  if (!summary || typeof summary !== "string") {
    throw new Error("OpenRouter returned an empty summary");
  }

  return summary;
}