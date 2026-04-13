// Edge Runtime 호환 설정 (Prisma 미사용)
// middleware.ts에서 사용
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    // Edge에서는 DB 검증 없이 최소한의 설정만
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      authorize: () => null, // 실제 검증은 auth.ts의 full config에서 처리
    }),
  ],
} satisfies NextAuthConfig;
