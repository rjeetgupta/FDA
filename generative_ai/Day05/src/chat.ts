import "dotenv/config";
import { OpenAI } from "openai";

import { calculator, currentWeather, getExchangeRate } from "./tools.js";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
});

type Message = {
  role: "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: any[];
};

const chatHistory: Message[] = [];

const systemPrompt = `
You are a helpful AI assistant with access to external tools.

Follow these rules:
1. For arithmetic calculations, ALWAYS use the calculator tool.
2. Always use calculator tool for even trivial calculations.
3. For current weather, ALWAYS use the currentWeather tool.
4. For currency conversion or exchange rates, ALWAYS use the getExchangeRate tool.
5. You may call multiple tools when solving a multi-step request.
6. After receiving tool results, explain the answer naturally.
7. Never invent current weather or exchange-rate information.
`;

const chatTools = [
  {
    type: "function" as const,
    function: {
      name: "calculator",
      description:
        "Performs arithmetic calculations. Supported operations: add, subtract, multiply, divide, mod, power.",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            description:
              "Operation: add, subtract, multiply, divide, mod, power",
          },
          a: {
            type: "number",
            description: "First number",
          },
          b: {
            type: "number",
            description: "Second number",
          },
        },
        required: ["operation", "a", "b"],
      },
    },
  },

  {
    type: "function" as const,
    function: {
      name: "currentWeather",
      description: "Gets the current weather of a city.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "Name of the city",
          },
        },
        required: ["location"],
      },
    },
  },

  {
    type: "function" as const,
    function: {
      name: "getExchangeRate",
      description: "Gets the latest exchange rate between two currencies.",
      parameters: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "Source currency code, for example USD",
          },
          to: {
            type: "string",
            description: "Target currency code, for example INR",
          },
        },
        required: ["from", "to"],
      },
    },
  },
];

export async function chat(message: string) {
  chatHistory.push({
    role: "user",
    content: message,
  });

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-5.6-luna",

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...chatHistory,
      ],

      tools: chatTools,

      max_tokens: 200,
    });

    const reply = response.choices[0].message;

    /*
     * Model did not request any tool.
     * Therefore, this is the final answer.
     */
    if (!reply.tool_calls?.length) {
      const result = reply.content;

      if (!result) {
        throw new Error("No response from AI");
      }

      chatHistory.push({
        role: "assistant",
        content: result,
      });

      return result;
    }

    /*
     * Model requested one or more tools.
     *
     * We save the assistant's tool request
     * before sending the tool results back.
     */
    chatHistory.push({
      role: "assistant",
      content: reply.content,
      tool_calls: reply.tool_calls,
    });

    for (const toolCall of reply.tool_calls) {
      const toolName = toolCall.function.name;

      const args = JSON.parse(toolCall.function.arguments);

      let result;

      if (toolName === "calculator") {
        result = calculator(args.operation, args.a, args.b);
      } else if (toolName === "currentWeather") {
        result = await currentWeather(args.location);
      } else if (toolName === "getExchangeRate") {
        result = await getExchangeRate(args.from, args.to);
      } else {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      /*
       * Send the result of the tool back to the model.
       */
      chatHistory.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
      });
    }
  }
}
