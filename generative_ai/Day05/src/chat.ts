import "dotenv/config";
import { OpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import {
  calculator,
  createDirectory,
  currentWeather,
  getExchangeRate,
  initializeWebsiteWorkspace,
  listFiles,
  readFile,
  writeFile,
} from "./tools.js";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
});

const chatHistory: ChatCompletionMessageParam[] = [];
const websiteHistory: ChatCompletionMessageParam[] = [];

const chatSystemPrompt = `
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

const websiteSystemPrompt = `
  You are an expert frontend website developer.
  Your job is to create complete static websites using the available tools.
  Follow these rules strictly:
  1. Create a separate directory for every website.
  2. Create index.html.
  3. Create style.css.
  4. Create script.js when JavaScript is useful.
  5. Build modern, beautiful and responsive websites.
  6. Use only HTML, CSS and vanilla JavaScript.
  7. Do not just return website code in your response.
  8. Actually create the files using the available filesystem tools.
  9. After creating the website, use listFiles to verify the project files.
  10. Read important files again using readFile if necessary.
  11. Fix obvious problems before finishing.
  12. Do not stop after creating only one file.
  13. Make sure the complete website exists inside generated-sites.
  14. Do not create files outside generated-sites.
  15. When you finish, briefly explain what was created.
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
          a: { type: "number", description: "First number" },
          b: { type: "number", description: "Second number" },
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
          location: { type: "string", description: "Name of the city" },
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

const websiteTools = [
  {
    type: "function" as const,
    function: {
      name: "createDirectory",
      description: "Creates a new directory inside the website workspace.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative directory path, for example brewlab",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "writeFile",
      description:
        "Creates or overwrites a text file inside the website workspace. Use this to create HTML, CSS and JavaScript files.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative file path, for example brewlab/index.html",
          },
          content: {
            type: "string",
            description:
              "Complete content that should be written into the file.",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "readFile",
      description:
        "Reads the contents of an existing file from the website workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path." },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "listFiles",
      description: "Lists all files and directories inside a website project.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative directory path, for example brewlab.",
          },
        },
        required: ["path"],
      },
    },
  },
];

// CHAT TOOL EXECUTION

async function executeChatTool(toolName: string, args: any): Promise<unknown> {
  switch (toolName) {
    case "calculator":
      return calculator(args.operation, args.a, args.b);
    case "currentWeather":
      return await currentWeather(args.location);
    case "getExchangeRate":
      return await getExchangeRate(args.from, args.to);
    default:
      throw new Error(`Unknown chat tool: ${toolName}`);
  }
}

// WEBSITE TOOL EXECUTION

async function executeWebsiteTool(
  toolName: string,
  args: any,
): Promise<unknown> {
  switch (toolName) {
    case "createDirectory":
      return await createDirectory(args.path);
    case "writeFile":
      return await writeFile(args.path, args.content);
    case "readFile":
      return await readFile(args.path);
    case "listFiles":
      return await listFiles(args.path);
    default:
      throw new Error(`Unknown website tool: ${toolName}`);
  }
}

export async function chat(message: string): Promise<string> {
  chatHistory.push({ role: "user", content: message });
  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-5.6-luna",
      messages: [
        {
          role: "system",
          content: chatSystemPrompt,
        },
        ...chatHistory,
      ],
      tools: chatTools,
      max_tokens: 500,
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
      if (toolCall.type !== "function") {
        continue;
      }
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeChatTool(toolName, args);
      chatHistory.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
      });
    }
  }
}

// WEBSITE GENERATOR

export async function generateWebsite(message: string): Promise<string> {
  await initializeWebsiteWorkspace();

  websiteHistory.push({
    role: "user",
    content: message,
  });

  while (true) {
    console.log("\nWebsite builder asking model...\n");

    const response = await client.chat.completions.create({
      model: "gpt-5.6-luna",
      messages: [
        {
          role: "system",
          content: websiteSystemPrompt,
        },
        ...websiteHistory,
      ],

      tools: websiteTools,
      max_tokens: 4000,
    });

    const reply = response.choices[0].message;

    if (!reply.tool_calls?.length) {
      const result = reply.content;
      if (!result) {
        throw new Error("Website generator returned no response");
      }
      websiteHistory.push({ role: "assistant", content: result });
      return result;
    }

    websiteHistory.push({
      role: "assistant",
      content: reply.content,
      tool_calls: reply.tool_calls,
    });

    for (const toolCall of reply.tool_calls) {
      if (toolCall.type !== "function") {
        continue;
      }
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      console.log(`Website tool called: ${toolName}`, args);
      const result = await executeWebsiteTool(toolName, args);
      websiteHistory.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
      });
    }
  }
}
