import express, { Request, Response } from "express";
import { summarizeTicket } from "./summarizeService.ts";

const app = express();

app.use(express.text({ type: "*/*", limit: "100kb" }));

app.post("/api/summarize", async (req: Request, res: Response) => {
  const ticket = typeof req.body === "string" ? req.body : "";

  if (!ticket.trim()) {
    return res.status(400).type("text/plain").send("Ticket text is required.");
  }

  try {
    const summary = await summarizeTicket(ticket);
    return res.type("text/plain").send(summary);
  } catch (error) {
    console.error("Failed to summarize ticket:", error);
    return res
      .status(500)
      .type("text/plain")
      .send("Unable to summarize the ticket.");
  }
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

export default app;
