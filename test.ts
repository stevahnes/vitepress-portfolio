import "dotenv/config";
import { getRunner, Langbase } from "langbase";

const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!,
});

async function main() {
  const { stream, threadId, rawResponse } = await langbase.pipes.run({
    stream: true,
    rawResponse: true,
    name: "advocado",
    messages: [
      {
        role: "user",
        content: "What kind of product management role will suite Steve?",
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
  });
  runner.on("error", (error) => {
    console.error("Error:", error);
  });
}
main();
