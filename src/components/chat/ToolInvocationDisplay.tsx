"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  args: Record<string, string>;
  state: string;
  [key: string]: unknown;
}

interface ToolInvocationDisplayProps {
  toolInvocation: ToolInvocation;
}

export function getToolMessage(
  toolName: string,
  args: Record<string, string>,
  state: string
): string {
  const isResult = state === "result";
  const path = args?.path ?? "";

  if (toolName === "str_replace_editor") {
    switch (args?.command) {
      case "create":
        return isResult ? `Created ${path}` : `Creating ${path}`;
      case "str_replace":
      case "insert":
        return isResult ? `Edited ${path}` : `Editing ${path}`;
      case "view":
        return isResult ? `Read ${path}` : `Reading ${path}`;
    }
  }

  if (toolName === "file_manager") {
    switch (args?.command) {
      case "rename":
        return isResult ? `Renamed ${path}` : `Renaming ${path}`;
      case "delete":
        return isResult ? `Deleted ${path}` : `Deleting ${path}`;
    }
  }

  return toolName;
}

export function ToolInvocationDisplay({
  toolInvocation,
}: ToolInvocationDisplayProps) {
  const message = getToolMessage(
    toolInvocation.toolName,
    toolInvocation.args,
    toolInvocation.state
  );
  const isResult = toolInvocation.state === "result";
  const path = toolInvocation.args?.path;
  const isFallback = message === toolInvocation.toolName;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isResult ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      {isFallback ? (
        <span className="text-neutral-700 font-mono">{message}</span>
      ) : (
        <span className="text-neutral-700">
          {message.replace(path, "")}<code className="font-mono">{path}</code>
        </span>
      )}
    </div>
  );
}
