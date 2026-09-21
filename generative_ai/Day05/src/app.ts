import express from "express";
import { chat, generateWebsite } from "./chat.js";

const app = express();

app.use(express.text());

// CHAT

app.post("/api/chat", async (req, res) => {
  try {
    const text = req.body;

    if (!text) {
      throw new Error("text is required");
    }

    const result = await chat(text);

    res.send(result);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// WEBSITE GENERATION

app.post("/api/generate-website", async (req, res) => {
  try {
    const text = req.body;

    if (!text) {
      throw new Error("message is required");
    }

    const result = await generateWebsite(text);

    res.send(result);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

export default app;
