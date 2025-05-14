import { NextRequest } from "next/server";
import { Langbase, RunOptionsStream, getToolsFromStream } from "langbase";
import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Langbase client
const langbase = new Langbase({
  apiKey: process.env.LANGBASE_API_KEY!,
});

/**
 * Create HTML email template based on stevanussatria.com color scheme
 * @param subject The email subject
 * @param content The email content/message
 * @param senderName Name of the person sending the message
 * @param senderEmail Email of the person sending the message
 * @returns Formatted HTML email template
 */
const createEmailTemplate = (
  subject: string,
  content: string,
  senderName: string,
  senderEmail: string
): string => {
  // Format the current date
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #444444;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #191970; /* Deep blue similar to stevanussatria.com */
      padding: 20px;
      color: white;
      text-align: center;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }
    .content {
      background-color: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-bottom: none;
    }
    .sender-info {
      background-color: #f5f5f5;
      padding: 15px 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
    .sender-info h3 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #191970;
      font-size: 16px;
    }
    .sender-info p {
      margin: 5px 0;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #888888;
    }
    .timestamp {
      color: #888888;
      font-size: 14px;
      margin-bottom: 20px;
    }
    h1 {
      color: #333;
      margin-top: 0;
    }
    .message {
      background-color: #f9f9f9;
      padding: 15px;
      border-left: 4px solid #191970;
      margin-bottom: 20px;
      white-space: pre-line;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Message from Advocado</h2>
    </div>
    <div class="content">
      <div class="timestamp">Received on: ${currentDate}</div>
      <h1>${subject}</h1>
      <div class="message">${content}</div>
    </div>
    <div class="sender-info">
      <h3>Message sent on behalf of:</h3>
      <p><strong>Name:</strong> ${senderName}</p>
      <p><strong>Email:</strong> ${senderEmail}</p>
    </div>
    <div class="footer">
      <p>This message was sent via Advocado &copy; ${new Date().getFullYear()} Stevanus Satria</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Define email tool for Langbase - follows the OpenAI Function Calling format
const emailTool = {
  type: "function", // Required for Langbase tools
  function: {
    name: "send_email",
    description: "Send a message via email to Stevanus",
    parameters: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "Subject of the email",
        },
        content: {
          type: "string",
          description: "Message content for the email",
        },
        senderName: {
          type: "string",
          description: "Name of the person sending this message",
        },
        senderEmail: {
          type: "string",
          description: "Email address of the person sending this message",
        },
      },
      required: ["subject", "content", "senderName", "senderEmail"],
    },
  },
};

// Define proper interfaces for type safety
interface EmailParams {
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
}

interface EmailResponse {
  success: boolean;
  data?: {
    id?: string;
    message: string;
  };
  error?: string;
}

// Handler function to send email
const sendEmail = async ({
  subject,
  content,
  senderName,
  senderEmail,
}: EmailParams): Promise<string> => {
  try {
    // Create HTML email using template
    const htmlContent = createEmailTemplate(
      subject,
      content,
      senderName,
      senderEmail
    );

    const { data, error } = await resend.emails.send({
      from: "Advocado <advocado@stevanussatria.com>",
      to: ["me@stevanussatria.com"], // Hardcoded recipient
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }

    return JSON.stringify({
      success: true,
      data: {
        id: data?.id,
        message: "Email sent successfully to Stevanus",
      },
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
};

// Map of tools available to the agent
const tools: {
  [key: string]: ({
    subject,
    content,
    senderName,
    senderEmail,
  }: EmailParams) => Promise<string>;
} = {
  send_email: sendEmail,
};

export async function POST(req: NextRequest) {
  const options = await req.json();

  // First call to get initial response and potential tool calls
  const { stream: initialStream, threadId } = await langbase.pipes.run({
    ...options,
    name: "advocado",
    tools: [emailTool], // Add the email tool to the available tools
    toolCallBehavior: "auto", // Allow automatic tool calling
    stream: true, // Ensure streaming is enabled
  });

  // Create a TransformStream to process the response
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Clone the stream for tool handling and response
  const [streamForToolCalls, streamForResponse] = initialStream.tee();

  // Process tool calls
  (async () => {
    try {
      // Extract tool calls from the stream
      const toolCalls = await getToolsFromStream(streamForToolCalls);

      // If there are tool calls, handle them
      if (toolCalls.length > 0) {
        const toolMessages = [];

        // Process each tool call
        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          const toolParameters = JSON.parse(toolCall.function.arguments);
          const toolFunction = tools[toolName];

          if (toolFunction) {
            const toolResult = await toolFunction(toolParameters);

            // Add the tool response message
            toolMessages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: toolName,
              content: toolResult,
            });
          }
        }

        // Get the final response after tool calls
        const { stream: finalStream } = await langbase.pipes.run({
          messages: toolMessages,
          name: "advocado",
          threadId: threadId,
          stream: true,
        } as RunOptionsStream);

        // Forward the final stream to the client
        const reader = finalStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      }

      // Complete the stream
      await writer.close();
    } catch (error) {
      console.error("Error processing tool calls:", error);
      await writer.abort(error);
    }
  })();

  // Forward the initial response stream if no tool calls or until tool calls are processed
  (async () => {
    try {
      const reader = streamForResponse.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }
    } catch (error) {
      console.error("Error forwarding response stream:", error);
      // No need to abort here as it will be handled by the other async function
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: {
      "lb-thread-id": threadId ?? "",
    },
  });
}
