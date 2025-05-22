import { NextRequest } from "next/server";
import { Resend } from "resend";
import { ChatService } from "../../lib/chat-service";
import { EmailTool } from "../../lib/email-tool";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Create HTML email template
function createEmailTemplate(
  subject: string,
  content: string,
  senderName: string,
  senderEmail: string
): string {
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
      background-color: #191970;
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
}

// Email sending function
async function handleEmailSend({
  subject,
  content,
  senderName,
  senderEmail,
}: {
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
}): Promise<string> {
  try {
    const htmlContent = createEmailTemplate(
      subject,
      content,
      senderName,
      senderEmail
    );
    const { data, error } = await resend.emails.send({
      from: "Advocado <advocado@stevanussatria.com>",
      to: ["me@stevanussatria.com"],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      return JSON.stringify({ success: false, error: error.message });
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
}

// Initialize chat service with email tool
const chatService = new ChatService(process.env.OPENAI_API_KEY!, [
  new EmailTool(handleEmailSend),
]);

// Chat endpoint handler
export async function POST(req: NextRequest) {
  const options = await req.json();

  const { stream, threadId } = await chatService.chat({
    messages: options.messages,
    threadId: options.threadId,
    stream: true,
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "lb-thread-id": threadId,
    },
  });
}
