import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { BaseMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

// Types for our chat service
export interface MessageType {
  role: "user" | "assistant" | "tool";
  content: string;
  timestamp?: number;
  name?: string;
  tool_call_id?: string;
}

export interface ThreadType {
  id: string;
  metadata?: {
    status?: "active" | "resolved";
    feedback?: "good" | "bad";
  };
  messages: MessageType[];
  created_at: number;
}

// In-memory storage for threads - in production this should be replaced with a database
const threads = new Map<string, ThreadType>();

export class ChatService {
  private model: ChatOpenAI;
  private tools: any[];
  private toolMap: Map<string, any>;

  constructor(apiKey: string, tools: any[] = []) {
    this.model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: "gpt-4-turbo-preview",
      temperature: 0.7,
      streaming: true,
    });
    this.tools = tools;
    this.toolMap = new Map(tools.map((tool) => [tool.name, tool]));
  }

  private convertToLangChainMessage(message: MessageType): BaseMessage {
    switch (message.role) {
      case "user":
        return new HumanMessage(message.content);
      case "assistant":
        return new AIMessage(message.content);
      case "tool":
        return new ToolMessage({
          content: message.content,
          tool_call_id: message.tool_call_id!,
          name: message.name!,
        });
      default:
        throw new Error(`Unknown message role: ${message.role}`);
    }
  }

  private generateThreadId(): string {
    return `thread_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Create a new thread or get existing one
  async getOrCreateThread(threadId?: string): Promise<ThreadType> {
    if (threadId && threads.has(threadId)) {
      return threads.get(threadId)!;
    }

    const newThread: ThreadType = {
      id: threadId || this.generateThreadId(),
      messages: [],
      created_at: Date.now(),
      metadata: {
        status: "active",
      },
    };

    threads.set(newThread.id, newThread);
    return newThread;
  }

  // Get all messages in a thread
  async getThreadMessages(threadId: string): Promise<MessageType[] | null> {
    const thread = threads.get(threadId);
    return thread ? thread.messages : null;
  }

  // Update thread metadata (e.g., for feedback)
  async updateThread(
    threadId: string,
    metadata: { status?: "active" | "resolved"; feedback?: "good" | "bad" }
  ): Promise<ThreadType | null> {
    const thread = threads.get(threadId);
    if (!thread) return null;

    thread.metadata = { ...thread.metadata, ...metadata };
    threads.set(threadId, thread);
    return thread;
  }
  // Main chat method that handles streaming and tools
  async chat(options: {
    messages: MessageType[];
    threadId?: string;
    stream?: boolean;
  }): Promise<{ stream?: ReadableStream; threadId: string }> {
    const thread = await this.getOrCreateThread(options.threadId);

    // Convert messages to LangChain format
    const history = options.messages.map((msg) =>
      this.convertToLangChainMessage(msg)
    );

    // Create the model with tools if available
    const modelWithTools =
      this.tools.length > 0
        ? this.model.bind({
            tools: this.tools,
            tool_choice: "auto",
          })
        : this.model;

    // Create a basic chain with the model and tools
    const chain = RunnableSequence.from([
      {
        messages: async () => history,
      },
      modelWithTools,
      new StringOutputParser(),
    ]);

    // Get the response stream
    const stream = await chain.stream({});

    // Add user message to thread
    thread.messages.push({
      ...options.messages[options.messages.length - 1],
      timestamp: Date.now(),
    });

    // Create a TransformStream to convert model output to the expected format
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Process the stream
    (async () => {
      try {
        for await (const chunk of stream) {
          const transformedChunk =
            JSON.stringify({
              choices: [
                {
                  delta: {
                    content: chunk,
                  },
                },
              ],
            }) + "\n";

          await writer.write(new TextEncoder().encode(transformedChunk));
        }

        // Add assistant message to thread
        thread.messages.push({
          role: "assistant",
          content: "", // We'll accumulate this from the stream in the route handler
          timestamp: Date.now(),
        });

        await writer.close();
      } catch (error) {
        console.error("Error in chat stream:", error);
        await writer.abort(error as Error);
      }
    })();

    return {
      stream: readable,
      threadId: thread.id,
    };
  }
}
