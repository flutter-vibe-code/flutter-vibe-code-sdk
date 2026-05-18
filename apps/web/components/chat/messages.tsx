"use client";

import { memo } from "react";
import type { Message } from "ai";
import { Messages as BaseMessages } from "@flutter-vibe-code/chat/components";
import { ChatMessage } from "./message";

interface MessagesProps {
  messages: Message[];
  status: "streaming" | "error" | "submitted" | "ready";
  isLoading: boolean;
  projectId?: string;
  sandboxId?: string | null;
  userId?: string;
  onRestore?: (messageId: string) => Promise<void>;
  restoringMessageId?: string | null;
  isWaitingForFirstMessage?: boolean;
}

const PureMessages = ({
  messages,
  status,
  isLoading,
  projectId,
  sandboxId,
  userId,
  onRestore,
  restoringMessageId,
  isWaitingForFirstMessage,
}: MessagesProps) => {
  return (
    <BaseMessages
      messages={messages}
      status={status}
      isLoading={isLoading}
      projectId={projectId}
      sandboxId={sandboxId}
      userId={userId}
      onRestore={onRestore}
      restoringMessageId={restoringMessageId}
      isWaitingForFirstMessage={isWaitingForFirstMessage}
      renderMessage={(props) => (
        <ChatMessage
          key={props.message.id}
          {...props}
        />
      )}
    />
  );
};

export const Messages = memo(PureMessages);
Messages.displayName = "Messages";
