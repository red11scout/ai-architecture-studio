"use client";

const OWNER_TOKEN_KEY = "ai-solution-builder-token";

/**
 * Get or create the anonymous owner token.
 * Same pattern as aiworkflow — localStorage-based anonymous identity.
 */
function getOwnerToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(OWNER_TOKEN_KEY);
  if (!token) {
    token = `asb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(OWNER_TOKEN_KEY, token);
  }
  return token;
}

/**
 * API request helper.
 * Method is the FIRST parameter (same convention as aiworkflow).
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      "x-owner-token": getOwnerToken(),
    };

    if (data !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        errorBody.error || `Request failed: ${response.status} ${response.statusText}`
      );
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}
