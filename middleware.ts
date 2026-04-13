import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";

// Edge Runtime 호환: Prisma 없이 JWT만으로 세션 확인
const { auth } = NextAuth(authConfig);

// 로그인 필요 경로
const protectedRoutes = ["/dashboard"];
// 로그인 상태에서 접근 불가 경로
const authRoutes = ["/sign-in", "/sign-up"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;

  const isProtectedRoute = protectedRoutes.some((path) =>
    nextUrl.pathname.startsWith(path)
  );
  const isAuthRoute = authRoutes.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  // 로그인된 사용자가 인증 페이지 접근 시 대시보드로 리다이렉트
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 미로그인 사용자가 보호된 경로 접근 시 로그인으로 리다이렉트
  if (!isLoggedIn && isProtectedRoute) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
