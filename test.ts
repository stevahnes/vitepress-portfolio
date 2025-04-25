import "dotenv/config";
import { getRunner, Langbase } from "langbase";

const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!,
});

async function main(userMessage: string, thread = "") {
  const { stream, threadId, rawResponse } = await langbase.pipes.run({
    stream: true,
    rawResponse: true,
    name: "advocado",
    threadId: thread.length > 0 ? thread : undefined,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const runner = getRunner(stream);
  runner.on("connect", () => {
    console.log("Stream started.\n");
  });
  runner.on("content", (content) => {
    process.stdout.write(content);
  });
  runner.on("end", () => {
    console.log("\nStream ended.");
    console.log(`Thread ID: ${threadId}`);
  });
  runner.on("error", (error) => {
    console.error("Error:", error);
  });
}
main(process.argv[2], process.argv[3]);
