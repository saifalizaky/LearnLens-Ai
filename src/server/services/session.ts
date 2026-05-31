import { cookies, headers } from "next/headers";
import {
  normalizeSessionId,
  readCookie,
  sessionCookieName,
  sessionHeaderName,
} from "@/lib/session";

const fallbackSessionId = "anonymous-local-session";

export { sessionCookieName, sessionHeaderName };

export async function getCurrentSessionId() {
  const headerStore = await headers();
  const headerSession = normalizeSessionId(headerStore.get(sessionHeaderName));

  if (headerSession) {
    return headerSession;
  }

  const cookieStore = await cookies();
  const cookieSession = normalizeSessionId(cookieStore.get(sessionCookieName)?.value);

  return cookieSession ?? fallbackSessionId;
}

export function getSessionIdFromRequest(request: Request) {
  return (
    normalizeSessionId(request.headers.get(sessionHeaderName)) ??
    normalizeSessionId(readCookie(request.headers.get("cookie"), sessionCookieName)) ??
    fallbackSessionId
  );
}
