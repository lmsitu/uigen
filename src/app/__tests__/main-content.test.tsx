import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock resizable panels
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, className }: any) => (
    <div className={className} data-testid="resizable-panel-group">
      {children}
    </div>
  ),
  ResizablePanel: ({ children, className }: any) => (
    <div className={className} data-testid="resizable-panel">
      {children}
    </div>
  ),
  ResizableHandle: ({ className }: any) => (
    <div className={className} data-testid="resizable-handle" />
  ),
}));

// Mock context providers
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <>{children}</>,
}));

// Mock child components
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">PreviewFrame</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">HeaderActions</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("renders with Preview tab active by default", () => {
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: "Preview" });
  const codeButton = screen.getByRole("tab", { name: "Code" });

  expect(previewButton).toBeDefined();
  expect(codeButton).toBeDefined();

  // Preview tab should be active by default
  expect(previewButton.getAttribute("data-state")).toBe("active");
  expect(codeButton.getAttribute("data-state")).toBe("inactive");
});

test("shows PreviewFrame when Preview tab is active", () => {
  render(<MainContent />);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});

test("clicking Code tab switches to code view", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeButton = screen.getByRole("tab", { name: "Code" });
  await user.click(codeButton);

  // Code view should now be visible
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.getByTestId("file-tree")).toBeDefined();
  // Preview frame should be hidden
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("clicking Code tab updates active state on tabs", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: "Preview" });
  const codeButton = screen.getByRole("tab", { name: "Code" });

  await user.click(codeButton);

  expect(codeButton.getAttribute("data-state")).toBe("active");
  expect(previewButton.getAttribute("data-state")).toBe("inactive");
});

test("clicking Preview tab from code view switches back to preview", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: "Preview" });
  const codeButton = screen.getByRole("tab", { name: "Code" });

  // Switch to code view first
  await user.click(codeButton);
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Switch back to preview view
  await user.click(previewButton);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("clicking Preview tab from code view updates active state", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: "Preview" });
  const codeButton = screen.getByRole("tab", { name: "Code" });

  // Switch to code then back to preview
  await user.click(codeButton);
  await user.click(previewButton);

  expect(previewButton.getAttribute("data-state")).toBe("active");
  expect(codeButton.getAttribute("data-state")).toBe("inactive");
});

test("can toggle between preview and code multiple times", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: "Preview" });
  const codeButton = screen.getByRole("tab", { name: "Code" });

  // Toggle code
  await user.click(codeButton);
  expect(codeButton.getAttribute("data-state")).toBe("active");

  // Toggle preview
  await user.click(previewButton);
  expect(previewButton.getAttribute("data-state")).toBe("active");

  // Toggle code again
  await user.click(codeButton);
  expect(codeButton.getAttribute("data-state")).toBe("active");

  // Toggle preview again
  await user.click(previewButton);
  expect(previewButton.getAttribute("data-state")).toBe("active");
});
