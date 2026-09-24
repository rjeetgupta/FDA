import express, { Request, Response } from "express";
import { ChatController } from "./chatController";
import { ChatService } from "./chatService";



const app = express();

app.use(express.text())

const chatService = new ChatService();
const chatController = new ChatController(chatService);

app.post("/api/chat", async (req: Request, res: Response) => {

  if (typeof req.body !== "string") {
    return res.status(400).json({
      success: false,
      message: "Request body must be a string",
    });
  }

  try {
    const result = await chatController.chat(req.body);

    return res.status(200).send(result)
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      message: e.message || "Internal server error",
    });
  }
});


export default app;
