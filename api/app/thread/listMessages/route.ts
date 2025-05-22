import { NextRequest, NextResponse } from "next/server";
import { ChatService } from "../../../lib/chat-service";

const chatService = new ChatService(process.env.OPENAI_API_KEY!);

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

    // Get thread messages using ChatService
    const messages = await chatService.getThreadMessages(threadId);

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
