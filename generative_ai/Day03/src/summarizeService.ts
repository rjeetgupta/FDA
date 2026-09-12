import OpenAI from "openai";

const openai = new OpenAI();
const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";


export async function summarizeTicket(ticket: string): Promise<string> {
  const response = await openai.responses.create({
    model,
    input: `Summarize this support ticket in 2 lines : \n\n${ticket}`,
    store: false,
  });

  if (!response.output_text) {
    throw new Error("OpenAI returned an empty summary");
  }

  return response.output_text;
}
