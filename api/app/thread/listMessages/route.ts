import { Langbase } from "langbase";
import { NextRequest, NextResponse } from "next/server";

const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!,
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const threadId = searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 }
      );
    }

    // Get thread messages using Langbase SDK
    const messages = await langbase.threads.messages.list({ threadId });

    if (!messages) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error getting thread messages:", error);
    return NextResponse.json(
      { error: "Failed to get thread messages" },
      { status: 500 }
    );
  }
}
