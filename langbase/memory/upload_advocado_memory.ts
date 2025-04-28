import "dotenv/config";
import { Langbase } from "langbase";
import fs from "fs";
import path from "path";

const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!,
});

const docNames = [
  "about.md",
  "gear.md",
  "stack.md",
  "milestones.md",
  "projects.md",
  "recommendations.md",
  "index.md",
];

async function main(docName: string) {
  const src = path.join(process.cwd(), "docs", docName);

  const response = await langbase.memories.documents.upload({
    document: fs.readFileSync(src),
    memoryName: "advocado-memory",
    documentName: docName,
    contentType: "text/plain",
    meta: {
      extension: "md",
      description: "Steve's Portfolio Pages",
    },
  });

  console.log(response);
}
docNames.forEach((docName) => {
  main(docName);
});
