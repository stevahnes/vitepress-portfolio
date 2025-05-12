import { Langbase } from "langbase";
import { NextRequest, NextResponse } from "next/server";

const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { threadId, feedback } = await req.json();
    console.log("Thread/resolve route - Received:", { threadId, feedback });

    if (!threadId) {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 }
      );
    }

    if (!feedback || !["good", "bad"].includes(feedback)) {
      return NextResponse.json(
        { error: "Feedback must be either 'good' or 'bad'" },
        { status: 400 }
      );
    }

    // Resolve thread with feedback metadata
    const result = await langbase.threads.update({
      threadId,
      metadata: {
        status: "resolved",
        feedback: feedback,
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Failed to resolve thread" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resolving thread:", error);
    return NextResponse.json(
      { error: "Failed to resolve thread" },
      { status: 500 }
    );
  }
}
