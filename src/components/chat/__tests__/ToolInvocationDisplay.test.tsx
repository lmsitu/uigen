import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  ToolInvocationDisplay,
  getToolMessage,
} from "../ToolInvocationDisplay";

afterEach(() => {
  cleanup();
});

test("str_replace_editor create shows 'Creating' when pending", () => {
  expect(
    getToolMessage("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")
  ).toBe("Creating /App.jsx");
});

test("str_replace_editor create shows 'Created' when result", () => {
  expect(
    getToolMessage("str_replace_editor", { command: "create", path: "/App.jsx" }, "result")
  ).toBe("Created /App.jsx");
});

test("str_replace_editor str_replace shows 'Editing' when pending", () => {
  expect(
    getToolMessage("str_replace_editor", { command: "str_replace", path: "/Card.jsx" }, "call")
  ).toBe("Editing /Card.jsx");
});

test("str_replace_editor str_replace shows 'Edited' when result", () => {
  expect(
    getToolMessage("str_replace_editor", { command: "str_replace", path: "/Card.jsx" }, "result")
  ).toBe("Edited /Card.jsx");
});

test("str_replace_editor insert shows 'Editing' when pending", () => {
  expect(
    getToolMessage("str_replace_editor", { command: "insert", path: "/Card.jsx" }, "partial-call")
  ).toBe("Editing /Card.jsx");
});

test("str_replace_editor insert shows 'Edited' when result", () => {
  expect(
    getToolMessage("str_replace_editor", { command: "insert", path: "/Card.jsx" }, "result")
  ).toBe("Edited /Card.jsx");
});

test("str_replace_editor view shows 'Reading' when pending", () => {
  expect(
    getToolMessage("str_replace_editor", { command: "view", path: "/utils.ts" }, "call")
  ).toBe("Reading /utils.ts");
});

test("str_replace_editor view shows 'Read' when result", () => {
  expect(
    getToolMessage("str_replace_editor", { command: "view", path: "/utils.ts" }, "result")
  ).toBe("Read /utils.ts");
});

test("file_manager rename shows friendly message", () => {
  expect(
    getToolMessage("file_manager", { command: "rename", path: "/old.tsx" }, "call")
  ).toBe("Renaming /old.tsx");
  expect(
    getToolMessage("file_manager", { command: "rename", path: "/old.tsx" }, "result")
  ).toBe("Renamed /old.tsx");
});

test("file_manager delete shows friendly message", () => {
  expect(
    getToolMessage("file_manager", { command: "delete", path: "/temp.tsx" }, "call")
  ).toBe("Deleting /temp.tsx");
  expect(
    getToolMessage("file_manager", { command: "delete", path: "/temp.tsx" }, "result")
  ).toBe("Deleted /temp.tsx");
});

test("unknown tool falls back to displaying toolName", () => {
  expect(
    getToolMessage("some_unknown_tool", { command: "do_stuff" }, "call")
  ).toBe("some_unknown_tool");
});

test("renders spinner when state is not result", () => {
  const { container } = render(
    <ToolInvocationDisplay
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
        toolCallId: "test-1",
      }}
    />
  );

  expect(screen.getByText("Creating")).toBeDefined();
  expect(screen.getByText("/App.jsx")).toBeDefined();
  // Spinner should be present (svg with animate-spin class)
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
  // Green dot should not be present
  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).toBeNull();
});

test("renders green dot when state is result", () => {
  const { container } = render(
    <ToolInvocationDisplay
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        toolCallId: "test-2",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Created")).toBeDefined();
  expect(screen.getByText("/App.jsx")).toBeDefined();
  // Green dot should be present
  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).not.toBeNull();
  // Spinner should not be present
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeNull();
});

test("renders path in monospace code element", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        toolCallId: "test-3",
        result: "Success",
      }}
    />
  );

  const codeEl = screen.getByText("/App.jsx");
  expect(codeEl.tagName).toBe("CODE");
});

test("fallback renders toolName in monospace", () => {
  render(
    <ToolInvocationDisplay
      toolInvocation={{
        toolName: "unknown_tool",
        args: {},
        state: "call",
        toolCallId: "test-4",
      }}
    />
  );

  const span = screen.getByText("unknown_tool");
  expect(span.className).toContain("font-mono");
});
