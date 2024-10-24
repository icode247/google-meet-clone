import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authState = request.cookies.get("auth-storage")?.value;
  let isAuthenticated = false;

  console.log(authState);

  if (authState) {
    try {
      const parsedAuthState = JSON.parse(authState);
      isAuthenticated = !!(
        parsedAuthState.state?.token && parsedAuthState.state?.user
      );
    } catch (error) {
      console.error("Error parsing auth state:", error);
    }
  }

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/register");

  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("/auth/redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/meetings/:path*", "/auth/login", "/auth/register"],
};
