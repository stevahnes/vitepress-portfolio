import { Langbase } from "langbase";
import { NextRequest, NextResponse } from "next/server";

const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { threadId } = await req.json();

    if (!threadId) {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 }
      );
    }

    // Close the thread using Langbase SDK
    await langbase.threads.update({
      threadId,
      metadata: {
        status: "resolved",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error closing thread:", error);
    return NextResponse.json(
      { error: "Failed to close thread" },
      { status: 500 }
    );
  }
}
