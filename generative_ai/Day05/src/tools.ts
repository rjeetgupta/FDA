import fs from "node:fs/promises";
import path from "node:path";

// CHAT TOOL

export function calculator(
  operation: string,
  a: number,
  b: number,
): number {
  console.log("Calculator tool called");

  if (operation === "add") return a + b;

  if (operation === "subtract") return a - b;

  if (operation === "multiply") return a * b;

  if (operation === "divide") {
    if (b === 0) {
      throw new Error("Cannot divide by 0");
    }

    return a / b;
  }

  if (operation === "mod") {
    if (b === 0) {
      throw new Error("Cannot calculate mod by 0");
    }

    return a % b;
  }

  if (operation === "power") {
    return a ** b;
  }

  throw new Error(`Unsupported operation ${operation}`);
}


export async function currentWeather(
  location: string
): Promise<string> {
  const response = await fetch(
    `https://wttr.in/${encodeURIComponent(location)}?format=j1`
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.text();
}


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

// WEBSITE TOOL

const websiteWorkspace = path.resolve("generated-sites");


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

    return `Directory created successfully: ${relativePath}`;
  } catch (error: any) {
    return `Failed to create directory: ${error.message}`;
  }
}


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

    return `File written successfully: ${relativePath}`;
  } catch (error: any) {
    return `Failed to write file: ${error.message}`;
  }
}


export async function readFile(
  relativePath: string,
): Promise<string> {
  try {
    return await fs.readFile(
      safePath(relativePath),
      "utf8",
    );
  } catch (error: any) {
    return `Failed to read file: ${error.message}`;
  }
}


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

    async function walk(current: string) {
      for (
        const entry of await fs.readdir(
          current,
          {
            withFileTypes: true,
          },
        )
      ) {
        const item = path.join(
          current,
          entry.name,
        );

        files.push(
          path.relative(
            websiteWorkspace,
            item,
          ),
        );

        if (entry.isDirectory()) {
          await walk(item);
        }
      }
    }

    await walk(directory);

    return files.join("\n");
  } catch (error: any) {
    return `Failed to list files: ${error.message}`;
  }
}


export async function initializeWebsiteWorkspace() {
  await fs.mkdir(
    websiteWorkspace,
    {
      recursive: true,
    },
  );
}