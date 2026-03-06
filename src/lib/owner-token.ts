import { headers } from "next/headers";

const OWNER_TOKEN_HEADER = "x-owner-token";

/**
 * Extract the owner token from request headers.
 * Used for anonymous project ownership (same pattern as aiworkflow).
 */
export async function getOwnerToken(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get(OWNER_TOKEN_HEADER);
}

/**
 * Require owner token — throws 401 if missing.
 */
export async function requireOwnerToken(): Promise<string> {
  const token = await getOwnerToken();
  if (!token) {
    throw new Error("Missing owner token");
  }
  return token;
}
