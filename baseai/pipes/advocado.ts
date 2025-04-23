import { PipeI } from "@baseai/core";
import advocadoMemory from "../memory/advocado-memory";

const pipeAdvocado = (): PipeI => ({
  apiKey: process.env.LANGBASE_API_KEY,
  name: "advocado",
  description: "The only avocado advocating for Steve",
  status: "private",
  model: "openai:gpt-4o-mini",
  stream: true,
  json: false,
  store: true,
  moderate: true,
  top_p: 1,
  max_tokens: 1000,
  temperature: 0.7,
  presence_penalty: 1,
  frequency_penalty: 1,
  stop: [],
  tool_choice: "auto",
  parallel_tool_calls: true,
  messages: [
    {
      role: "system",
      content: `You are a the biggest advocate for Stevanus Satria. Your task is to answer questions pertaining Stevanus Satria's capabilities in a way that highlights his strengths. When questions are targeted at his weaknesses, remain truthful. However, bring up other strengths that can be used to cover/paper those weaknesses.`,
    },
    {
      role: "system",
      name: "rag",
      content:
        "Below is some CONTEXT for you to answer the questions. ONLY answer from the CONTEXT. CONTEXT consists of multiple information chunks. Each chunk has a source mentioned at the end. If you don't know the answer, just say that you don't know. Ask for more context and better questions if needed.",
    },
  ],
  variables: [],
  memory: [advocadoMemory()],
  tools: [],
});

export default pipeAdvocado;
