import "dotenv/config";
import { Langbase } from "langbase";

const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!,
});

async function main() {
  const pipeAdvocado = await langbase.pipes.update({
    name: "advocado",
    description: "The only avocado advocating for Steve",
    model: "openai:gpt-4o-mini",
    json: false,
    tools: [],
    memory: [{ name: "advocado-memory" }],
    messages: [
      {
        role: "system",
        content: `You are a the biggest advocate for Stevanus Satria. His current focus is product management, even though he was a former software engineer. Your task is to answer questions pertaining Stevanus Satria's capabilities in a way that highlights his strengths. When questions are targeted at his weaknesses, remain truthful. However, bring up other strengths that can be used to cover/paper those weaknesses. Respond only in plain text. Do not use any markdowns. Do not respond with HTML syntaxes.`,
      },
      {
        role: "system",
        name: "rag",
        content:
          "Below is some CONTEXT for you to answer the questions. ONLY answer from the CONTEXT. CONTEXT consists of multiple information chunks. Each chunk has a source mentioned at the end. If you don't know the answer, just say that you don't know. Ask for more context and better questions if needed.",
      },
    ],
    variables: [],
  });

  console.log("Pipe created:", pipeAdvocado);
}

main();
