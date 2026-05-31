export const sessionCookieName = "learnlens_session";
export const sessionHeaderName = "x-learnlens-session";

const sessionPattern = /^[A-Za-z0-9-]{16,80}$/;

export function normalizeSessionId(value?: string | null) {
  const sessionId = value?.trim();

  return sessionId && sessionPattern.test(sessionId) ? sessionId : null;
}

export function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}
