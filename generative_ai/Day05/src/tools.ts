import fs from "node:fs/promises";
import path from "node:path";

// CHAT TOOLS

export function calculator(
  operation: string,
  a: number,
  b: number,
): number {
  console.log("Calculator tool called");

  switch (operation) {
    case "add":
      return a + b;

    case "subtract":
      return a - b;

    case "multiply":
      return a * b;

    case "divide":
      if (b === 0) {
        throw new Error("Cannot divide by 0");
      }

      return a / b;

    case "mod":
      if (b === 0) {
        throw new Error("Cannot calculate mod by 0");
      }

      return a % b;

    case "power":
      return a ** b;

    default:
      throw new Error(`Unsupported operation ${operation}`);
  }
}


// WEATHER

export async function currentWeather(
  location: string,
): Promise<string> {
  console.log("Weather tool called");

  const response = await fetch(
    `https://wttr.in/${encodeURIComponent(location)}?format=j1`,
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.text();
}


// CURRENCY

export async function getExchangeRate(
  from: string,
  to: string,
): Promise<string> {
  console.log("Currency Exchange tool called");

  const response = await fetch(
    `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.text();
}


// WEBSITE BUILDER TOOLS

const websiteWorkspace = path.resolve("generated-sites");


// Safe path

function safePath(relativePath: string): string {
  const resolved = path.resolve(
    websiteWorkspace,
    relativePath,
  );

  if (
    resolved !== websiteWorkspace &&
    !resolved.startsWith(
      `${websiteWorkspace}${path.sep}`,
    )
  ) {
    throw new Error(
      "Access outside generated-sites is not allowed",
    );
  }

  return resolved;
}


// Create directory

export async function createDirectory(
  relativePath: string,
): Promise<string> {
  try {
    await fs.mkdir(
      safePath(relativePath),
      {
        recursive: true,
      },
    );

    console.log(
      `Directory created: ${relativePath}`,
    );

    return `Directory created successfully: ${relativePath}`;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    return `Failed to create directory: ${message}`;
  }
}


// Write file

export async function writeFile(
  relativePath: string,
  content: string,
): Promise<string> {
  try {
    const file = safePath(relativePath);

    await fs.mkdir(
      path.dirname(file),
      {
        recursive: true,
      },
    );

    await fs.writeFile(
      file,
      content,
      "utf8",
    );

    console.log(
      `File written: ${relativePath}`,
    );

    return `File written successfully: ${relativePath}`;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    return `Failed to write file: ${message}`;
  }
}


// Read file

export async function readFile(
  relativePath: string,
): Promise<string> {
  try {
    return await fs.readFile(
      safePath(relativePath),
      "utf8",
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    return `Failed to read file: ${message}`;
  }
}


// List files

export async function listFiles(
  relativePath: string,
): Promise<string> {
  try {
    const directory = safePath(relativePath);

    try {
      await fs.access(directory);
    } catch {
      return `Directory does not exist: ${relativePath}`;
    }

    const files: string[] = [];

    async function walk(
      current: string,
    ): Promise<void> {
      const entries = await fs.readdir(
        current,
        {
          withFileTypes: true,
        },
      );

      for (const entry of entries) {
        const item = path.join(
          current,
          entry.name,
        );

        const relative = path.relative(
          websiteWorkspace,
          item,);

        files.push(relative);

        if (entry.isDirectory()) {
          await walk(item);
        }
      }
    }

    await walk(directory);

    return files.join("\n");
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    return `Failed to list files: ${message}`;
  }
}


// Initialize workspace

export async function initializeWebsiteWorkspace(): Promise<void> {
  await fs.mkdir(
    websiteWorkspace,
    {
      recursive: true,
    },
  );
}
