import { NextRequest } from "next/server";
import { Langbase } from "langbase";

const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!, // Your Langbase API key
});

export async function POST(req: NextRequest) {
  const options = await req.json();
  const { stream, threadId } = await langbase.pipes.run({
    ...options,
    name: "advocado",
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "lb-thread-id": threadId ?? "",
    },
  });
}
