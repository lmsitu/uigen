import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock server-only (no-op)
vi.mock("server-only", () => ({}));

// Mock next/headers cookies
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Import after mocks
import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("sets an httpOnly cookie with a JWT token", async () => {
    await createSession("user-1", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name, token, options] = mockCookieStore.set.mock.calls[0];

    expect(name).toBe("auth-token");
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT format
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("sets cookie expiration to 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-1", "test@example.com");
    const after = Date.now();

    const { expires } = mockCookieStore.set.mock.calls[0][2];
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs);
    expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs);
  });

  test("token contains correct userId and email", async () => {
    await createSession("user-42", "hello@test.com");

    const token = mockCookieStore.set.mock.calls[0][1];
    const secret = new TextEncoder().encode("development-secret-key");
    const { payload } = await jwtVerify(token, secret);

    expect(payload.userId).toBe("user-42");
    expect(payload.email).toBe("hello@test.com");
  });
});

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns null when no cookie is set", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    // Create a session first to get a valid token
    await createSession("user-1", "test@example.com");
    const token = mockCookieStore.set.mock.calls[0][1];

    mockCookieStore.get.mockReturnValue({ value: token });

    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session!.userId).toBe("user-1");
    expect(session!.email).toBe("test@example.com");
  });

  test("returns null for an invalid token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "invalid.jwt.token" });

    const session = await getSession();
    expect(session).toBeNull();
  });
});

describe("deleteSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("deletes the auth-token cookie", async () => {
    await deleteSession();

    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
  });
});

describe("verifySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns null when request has no auth cookie", async () => {
    const request = new NextRequest("http://localhost:3000/", {
      headers: new Headers(),
    });

    const session = await verifySession(request);
    expect(session).toBeNull();
  });

  test("returns session payload for valid cookie in request", async () => {
    // Create a token
    await createSession("user-5", "req@test.com");
    const token = mockCookieStore.set.mock.calls[0][1];

    const request = new NextRequest("http://localhost:3000/", {
      headers: new Headers({ Cookie: `auth-token=${token}` }),
    });

    const session = await verifySession(request);
    expect(session).not.toBeNull();
    expect(session!.userId).toBe("user-5");
    expect(session!.email).toBe("req@test.com");
  });

  test("returns null for tampered token in request", async () => {
    const request = new NextRequest("http://localhost:3000/", {
      headers: new Headers({ Cookie: "auth-token=tampered.bad.token" }),
    });

    const session = await verifySession(request);
    expect(session).toBeNull();
  });
});
