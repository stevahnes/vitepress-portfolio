import { Langbase } from "langbase";
import { NextRequest, NextResponse } from "next/server";

const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!,
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const threadId = searchParams.get("threadId");
    console.log(threadId);

    if (!threadId) {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 }
      );
    }

    // Get thread details using Langbase SDK
    const thread = await langbase.threads.get({
      threadId: threadId,
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error("Error getting thread:", error);
    return NextResponse.json(
      { error: "Failed to get thread details" },
      { status: 500 }
    );
  }
}
