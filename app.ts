import OpenAI from "openai";
import * as dotenv from "dotenv";
import readline from "readline/promises";
import { contextFinder } from "./context.js";
dotenv.config();
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const context: any = [];
async function ask() {
  while (true) {
    const input = await rl.question("you: ");

    context.push({ role: "user", content: input });
    context.push({
      role: "assistant",
      content: `this is context ${await contextFinder(input)}`,
    });

    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: context,
    });
    const rp = completion.choices[0].message.content;
    context.push({ role: "assistant", content: rp });
    console.log("bot: ", rp);
  }
}
ask();
