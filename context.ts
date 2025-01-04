import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import * as dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
dotenv.config();
const client = new ChromaClient({
  path: "http://localhost:8000",
});
const collection = await client.getOrCreateCollection({
  name: "obsidian",
  embeddingFunction: new OpenAIEmbeddingFunction({
    openai_api_key: `${process.env.OPENAI_API_KEY}`,
    openai_model: "text-embedding-3-small",
  }),
});
function chunker(text: string, maxLength: number = 1000) {
  const chunked: string[] = [];

  const paragraphs: string[] = text.split("\n\n");
  let currentChuck = "";
  for (const p of paragraphs) {
    if ((currentChuck + p).length > maxLength) {
      if (currentChuck) {
        chunked.push(currentChuck);
      }
      currentChuck = p;
    } else {
      currentChuck += currentChuck ? "\n\n" + p : p;
    }
  }
  if (currentChuck) {
    chunked.push(currentChuck);
  }
  return chunked;
}
const vault = process.env.OBSIDIAN_VAULT ?? "xxx";
const filesDir = await fs.readdir(path.dirname(vault));
const files: { [key: string]: string } = {};
for (const file of filesDir) {
  if (file.endsWith(".md")) {
    const filePath = path.join(path.dirname(vault), file);
    const content = await fs.readFile(filePath, "utf-8");
    const chunks = chunker(content);
    files[filePath] = content;
    await collection.upsert({
      ids: chunks.map((_, i) => `${filePath}_${i}`),
      documents: chunks,
    });
  }
}

export async function contextFinder(q: string) {
  const result = await collection.query({
    queryTexts: q,
    nResults: 2,
  });
  return result.documents[0][0];
}
