import { NextResponse, type NextRequest } from "next/server";

export const VISITOR_COOKIE = "vwo_visitor_id";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.get(VISITOR_COOKIE)?.value) {
    response.cookies.set({
      name: VISITOR_COOKIE,
      value: crypto.randomUUID(),
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
