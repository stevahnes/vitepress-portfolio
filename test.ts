import "dotenv/config";
import { Pipe, getRunner } from "@baseai/core";
import pipeAdvocado from "./baseai/pipes/advocado";

const pipe = new Pipe(pipeAdvocado());

async function main() {
  const { stream } = await pipe.run({
    messages: [
      {
        role: "user",
        content: "What kind of product management role will suite Steve?",
      },
    ],
    stream: true,
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
