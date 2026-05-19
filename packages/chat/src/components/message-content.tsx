"use client";

import { type ComponentProps, memo } from "react";
import Markdown from "react-markdown";
import { cn } from "@flutter-vibe-code/ui/lib/utils";

type MessageContentProps = ComponentProps<"div"> & {
  children: string;
};

export const MessageContent = memo(
  ({ className, children, ...props }: MessageContentProps) => (
    <div
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
        className
      )}
      {...props}
    >
      <Markdown>{children}</Markdown>
    </div>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

MessageContent.displayName = "MessageContent";
