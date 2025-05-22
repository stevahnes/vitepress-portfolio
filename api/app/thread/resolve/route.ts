import { NextRequest, NextResponse } from "next/server";
import { ChatService } from "../../../lib/chat-service";

const chatService = new ChatService(process.env.OPENAI_API_KEY!);

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

    // Update thread with feedback using ChatService
    const result = await chatService.updateThread(threadId, {
      status: "resolved",
      feedback: feedback,
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
