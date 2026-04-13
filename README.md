# JobLens for Infra Engineers

Notion을 CMS로 활용하여 SRE, Cloud Engineer, MLOps, Platform Engineer 등 인프라/운영 직군의 채용 공고를 수집·분류·분석하는 웹 서비스입니다.

## 프로젝트 배경

채용 공고는 사이트마다 흩어져 있고, 같은 일을 하더라도 직무 명칭이 SRE / Platform Engineer / DevOps / Infrastructure Engineer 등으로 제각각입니다. 이 서비스는 해당 직군의 공고를 한 곳에 모아 자격요건·기술스택·담당업무를 체계적으로 파악할 수 있게 합니다.

## 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript
- **CMS**: Notion API (`@notionhq/client`)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **상태 관리**: Zustand, TanStack Query
- **인증**: NextAuth.js v5
- **DB**: Prisma + SQLite
- **배포**: Vercel

## 주요 기능

- Notion 데이터베이스 연동 채용 공고 목록 조회
- 직무 유형 / 기술스택 / 경력 / 고용 형태 필터링
- 공고 상세 페이지 (자격요건·우대사항·담당업무 전체 내용)
- 기술스택 빈도 통계 / 직무 분포 분석
- 북마크 기능 (로컬스토리지 퍼시스트)

## 시작하기

### 환경변수 설정

`.env.local` 파일을 생성하고 아래 값을 입력합니다.

```env
# NextAuth
AUTH_SECRET=your_auth_secret

# Database
DATABASE_URL="file:./dev.db"

# Notion
NOTION_API_KEY=secret_xxxx
NOTION_DATABASE_ID=xxxx
```

### 개발 서버 실행

```bash
npm install
npm run db:push      # DB 스키마 반영
npm run db:generate  # Prisma 클라이언트 생성
npm run dev          # 개발 서버 실행
```

[http://localhost:3000](http://localhost:3000)에서 확인합니다.

### 주요 명령어

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사
npm run typecheck    # TypeScript 타입 검사
npm run format       # Prettier 포맷 적용

npm run db:generate  # Prisma 클라이언트 재생성
npm run db:migrate   # 마이그레이션 실행
npm run db:push      # 스키마 → DB 반영 (마이그레이션 없이)
npm run db:studio    # Prisma Studio 실행
```

## 문서

- [PRD (제품 요구사항 문서)](./docs/PRD.md)

## Notion 데이터베이스 구조

| 필드명 | 타입 | 설명 |
|--------|------|------|
| 공고명 | Title | 직무 공고 제목 |
| 회사명 | Text | 기업명 |
| 직무 유형 | Multi-select | SRE / Cloud / MLOps / Platform / DevOps 등 |
| 자격요건 | Rich Text | 필수 자격 조건 |
| 우대사항 | Rich Text | 우대 조건 |
| 담당업무 | Rich Text | 구체적인 업무 내용 |
| 기술스택 | Multi-select | Kubernetes / Terraform / AWS 등 |
| 공고 URL | URL | 원본 채용 공고 링크 |
| 마감일 | Date | 공고 마감 날짜 |
| 상태 | Select | 진행중 / 마감 / 검토중 |
