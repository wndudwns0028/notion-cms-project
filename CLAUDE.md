# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 명령어

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 포맷 적용
npm run typecheck    # TypeScript 타입 검사

npm run db:generate  # Prisma 클라이언트 재생성
npm run db:migrate   # 마이그레이션 실행 (dev)
npm run db:push      # 스키마 → DB 반영 (마이그레이션 없이)
npm run db:studio    # Prisma Studio 실행
npm run db:reset     # DB 초기화
```

## 아키텍처

### 디렉토리 구조

```
src/
├── app/
│   ├── (auth)/          # 인증 페이지 (sign-in, sign-up)
│   ├── (dashboard)/     # 인증 후 페이지
│   ├── api/auth/        # NextAuth 핸들러 + 회원가입 API
│   └── layout.tsx       # 루트 레이아웃 (AppProviders 주입)
├── components/
│   ├── ui/              # shadcn/ui 기반 원자 컴포넌트
│   ├── layout/          # Header, Sidebar
│   └── common/          # 공통 컴포넌트
├── lib/
│   ├── auth.config.ts   # Edge 호환 NextAuth 설정 (Prisma 없음)
│   ├── auth.ts          # 전체 NextAuth 설정 (PrismaAdapter 포함)
│   ├── prisma.ts        # Prisma 클라이언트 싱글턴
│   └── api-client.ts    # fetch 래퍼 유틸리티
├── stores/              # Zustand 전역 상태
├── providers/           # AppProviders (Session + Query + Theme)
├── types/               # 전역 타입 선언
└── generated/prisma/    # Prisma 자동 생성 파일 (직접 수정 금지)
```

### 핵심 설계 결정

**Prisma 7.x 어댑터 패턴**
- Prisma 7.x는 드라이버 어댑터 방식을 사용함. `PrismaBetterSqlite3`를 `@prisma/adapter-better-sqlite3`에서 import하여 `PrismaClient`에 주입
- 클라이언트는 `src/generated/prisma/`에 생성됨 (`@/generated/prisma/client`에서 import)
- 스키마 변경 후 반드시 `db:generate` 실행

**NextAuth v5 Edge 분리 패턴**
- `auth.config.ts`: Prisma 없이 Edge Runtime에서 실행 가능한 최소 설정. `middleware.ts`에서 사용
- `auth.ts`: PrismaAdapter + Credentials 실제 검증 포함한 전체 설정. API route와 서버 컴포넌트에서 사용
- 세션 전략: JWT. `token.id`와 `token.role`을 세션에 주입

**상태 관리 계층**
- 서버 상태: TanStack Query (기본 staleTime 60초, query retry 1회)
- 클라이언트 UI 상태: Zustand + `persist` 미들웨어 (localStorage)
- API 호출: `apiClient` 유틸리티 사용 (`src/lib/api-client.ts`)

**Tailwind CSS v4**
- v3와 설정 방식이 다름. `tailwind.config.js` 대신 CSS에서 설정
- PostCSS는 `@tailwindcss/postcss` 플러그인 사용

**데이터베이스**
- SQLite (`prisma/dev.db`), `DATABASE_URL` 환경변수로 경로 지정 (예: `file:./dev.db`)
- `User` 모델에 `password` (bcrypt), `role` 필드 추가됨
