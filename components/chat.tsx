"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Maximize2Icon, Minimize2Icon, SparklesIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

const SUGGESTIONS = [
  "What did Aayush build at LoglineAI?",
  "Summarize his multi-agent infrastructure experience",
  "Which AWS services has he shipped with?",
  "Why should we interview him?",
];

const MessageParts = ({ message }: { message: UIMessage }) => (
  <div className="min-w-0">
    {message.parts.map((part, index) => {
      const key = `${message.id}-${index}`;

      if (part.type === "reasoning") {
        return (
          <Reasoning isStreaming={part.state === "streaming"} key={key}>
            <ReasoningTrigger />
            <ReasoningContent>{part.text}</ReasoningContent>
          </Reasoning>
        );
      }

      if (part.type === "text") {
        return (
          <MessageContent
            className="group-[.is-assistant]:text-[15px] group-[.is-assistant]:leading-relaxed group-[.is-user]:border group-[.is-user]:border-amber-400/20 group-[.is-user]:bg-amber-400/10 group-[.is-user]:text-zinc-100"
            key={key}
          >
            {/* No external-link interstitial: recruiters should reach the
                linked sites in one click. */}
            <MessageResponse linkSafety={{ enabled: false }}>
              {part.text}
            </MessageResponse>
          </MessageContent>
        );
      }

      return null;
    })}
  </div>
);

const EmptyState = ({ onPick }: { onPick: (text: string) => void }) => (
  <div className="flex min-h-full flex-col items-center gap-8 px-6 py-10 text-center">
    <div className="mt-auto">
      <SparklesIcon className="mx-auto size-7 text-amber-400" />
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-zinc-100">
        Ask anything about my work
      </h3>
      <p className="mt-2 text-sm text-zinc-500">
        It knows my resume inside out and answers in seconds.
      </p>
    </div>
    <div className="mb-auto grid w-full max-w-lg gap-2 sm:grid-cols-2">
      {SUGGESTIONS.map((suggestion) => (
        <button
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-amber-400/50 hover:text-amber-200 active:scale-[0.99]"
          key={suggestion}
          onClick={() => onPick(suggestion)}
          type="button"
        >
          {suggestion}
        </button>
      ))}
    </div>
  </div>
);

export const Chat = () => {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const { messages, sendMessage, status, stop } = useChat({
    onError: (error) => {
      toast.error("The assistant hit a snag", { description: error.message });
    },
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  // Fullscreen mode: lock page scroll behind the overlay, Esc to leave.
  useEffect(() => {
    if (!expanded) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const trimmed = message.text.trim();
      if (!trimmed) {
        return;
      }
      sendMessage({ text: trimmed });
      setText("");
    },
    [sendMessage]
  );

  const panel = (
    <div
      className={
        expanded
          ? "fixed inset-0 z-50 flex flex-col overflow-hidden bg-zinc-950/95 backdrop-blur-xl"
          : "flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 shadow-[0_0_80px_-20px_rgba(245,158,11,0.15)] backdrop-blur-md"
      }
      data-lenis-prevent
    >
      <div
        className={`flex items-center justify-between border-b border-zinc-800/80 ${
          expanded ? "px-6 py-4 md:px-10" : "px-6 py-3.5"
        }`}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
          Resume assistant
        </span>
        <button
          aria-label={expanded ? "Exit fullscreen" : "Expand to fullscreen"}
          className="-m-2 p-2 text-zinc-500 transition-colors hover:text-amber-300"
          onClick={() => setExpanded((prev) => !prev)}
          type="button"
        >
          {expanded ? (
            <Minimize2Icon className="size-4" />
          ) : (
            <Maximize2Icon className="size-4" />
          )}
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onPick={(suggestion) => sendMessage({ text: suggestion })} />
        ) : (
          <Conversation className="h-full">
            <ConversationContent
              className={`mx-auto w-full max-w-3xl ${
                expanded ? "gap-8 px-6 py-10 md:px-8" : "gap-6 px-6 py-8"
              }`}
            >
              {messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageParts message={message} />
                </Message>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}
      </div>

      <div
        className={`border-t border-zinc-800/80 ${
          expanded ? "px-6 pb-8 pt-5 md:px-10" : "px-4 py-4"
        }`}
      >
        <PromptInput
          className="mx-auto w-full max-w-3xl [&>[data-slot=input-group]]:rounded-xl [&>[data-slot=input-group]]:border-zinc-800 [&>[data-slot=input-group]]:bg-zinc-900/40"
          onSubmit={handleSubmit}
        >
          <PromptInputBody>
            <PromptInputTextarea
              className="min-h-[52px] px-4 pt-3.5 text-[15px] text-zinc-100 placeholder:text-zinc-600"
              onChange={(event) => setText(event.target.value)}
              placeholder="Ask about experience, stack, or projects..."
              value={text}
            />
          </PromptInputBody>
          <PromptInputFooter className="px-3 pb-2.5">
            <PromptInputTools />
            <PromptInputSubmit
              className="rounded-full bg-amber-400 text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
              disabled={!text.trim() && status === "ready"}
              onStop={stop}
              status={status}
              variant="default"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );

  // Portal escapes GSAP-transformed ancestors, which would otherwise trap
  // position:fixed inside their containing block.
  return expanded ? createPortal(panel, document.body) : panel;
};
