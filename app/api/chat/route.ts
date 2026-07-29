import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  validateUIMessages,
} from "ai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/resume";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Chat is not configured. Missing ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object" || !("messages" in body)) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  let messages;

  try {
    messages = await validateUIMessages({ messages: body.messages });
  } catch {
    return Response.json({ error: "Invalid messages." }, { status: 400 });
  }

  // ponytail: hard cap so a scripted client can't grow context unbounded
  if (messages.length > 40) {
    return Response.json({ error: "Conversation too long." }, { status: 400 });
  }

  const result = streamText({
    instructions: CHAT_SYSTEM_PROMPT,
    maxOutputTokens: 1024,
    messages: await convertToModelMessages(messages),
    model: anthropic("claude-sonnet-5"),
    onError: ({ error }) => {
      console.error("[chat] stream failed", error);
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ sendReasoning: true, stream: result.stream }),
  });
}
