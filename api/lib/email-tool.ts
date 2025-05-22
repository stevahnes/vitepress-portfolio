import { Tool } from "@langchain/core/tools";

export class EmailTool extends Tool {
  name = "send_email";
  description = "Send a message via email to Stevanus";

  constructor(
    private sendEmailFn: (params: {
      subject: string;
      content: string;
      senderName: string;
      senderEmail: string;
    }) => Promise<string>
  ) {
    super();
  }

  protected schema = {
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
  } as const;

  async _call(input: {
    subject: string;
    content: string;
    senderName: string;
    senderEmail: string;
  }): Promise<string> {
    return this.sendEmailFn(input);
  }
}
