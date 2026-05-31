import { NextResponse, type NextRequest } from "next/server";
import {
  normalizeSessionId,
  sessionCookieName,
  sessionHeaderName,
} from "@/lib/session";

const sessionMaxAge = 60 * 60 * 24 * 180;

export function proxy(request: NextRequest) {
  const existingSession = normalizeSessionId(
    request.cookies.get(sessionCookieName)?.value,
  );
  const sessionId = existingSession ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(sessionHeaderName, sessionId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!existingSession) {
    response.cookies.set(sessionCookieName, sessionId, {
      httpOnly: true,
      maxAge: sessionMaxAge,
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
