# JobLens for Infra Engineers - 개발 로드맵

> 문서 버전: v1.0 | 최종 업데이트: 2026-04-15 | 작성자: AI Architect

---

## 프로젝트 개요

### 목적 및 배경

Notion을 CMS로 활용하여 SRE, Cloud Engineer, MLOps Engineer 등 인프라/운영 직군의 채용공고를 수집·분류·분석하는 웹 서비스입니다. 채용공고는 흩어져 있고 직무 명칭도 제각각이기 때문에, 해당 직군의 공고를 한 곳에 모아 자격요건·기술스택·담당업무를 체계적으로 파악할 수 있는 환경을 제공합니다.

### 핵심 목표

| 목표 | 핵심 결과 (KR) |
|------|----------------|
| Notion CMS 연동 완성 | Notion DB 데이터를 2초 이내 렌더링 |
| 채용 정보 접근성 향상 | 직무 유형·기술스택·상태 기준 필터링 100% 동작 |
| 인프라 기술 트렌드 파악 | 기술스택 빈도 차트, 직무 유형 분포 시각화 제공 |
| 관심 공고 관리 | 북마크 기능 localStorage 퍼시스트 완성 |

### 범위

**In-Scope**
- Notion API 기반 채용공고 목록 조회 및 상세 페이지
- 직무 유형 / 기술스택 / 고용형태 / 경력 / 상태 필터링
- 키워드 검색 (공고명, 회사명)
- 기술스택 빈도 차트, 직무 유형 분포 차트 (Recharts)
- 북마크 기능 (Zustand + localStorage persist)
- Notion 공고 입력 가이드 페이지
- 반응형 UI (모바일 375px ~ 데스크탑 1440px)
- SEO 메타태그 (공고 상세 `generateMetadata`)

**Out-of-Scope**
- 자체 데이터베이스(PostgreSQL 등)를 통한 공고 저장
- 사용자 회원가입 / 로그인 기능 (NextAuth 제거 예정 또는 미사용)
- 관리자용 CRUD 어드민 UI (Notion이 어드민 역할 수행)
- 마감일 기준 자동 상태 업데이트 (Phase 3 이후 검토)
- 월별 수집 공고 수 추이 라인 차트 (데이터 누적 후 추가)

---

## MVP 정의

### MVP 목표

Notion API와 연동하여 인프라 직군 채용공고를 필터링·조회·북마크할 수 있는 핵심 기능을 갖춘 웹 서비스를 배포합니다.

### MVP 포함 기능

- [x] Notion API 연동 (`@notionhq/client` v5) 및 데이터 유틸 레이어 (`src/lib/notion.ts`)
- [x] 채용공고 목록 API Route (`GET /api/jobs`)
- [x] 채용공고 상세 API Route (`GET /api/jobs/[id]`)
- [x] 공고 카드 컴포넌트 (`JobCard`) + 그리드 목록 (`JobList`)
- [x] 필터 사이드바 (`FilterSidebar`) - 직무 유형, 고용형태, 경력, 상태
- [x] 키워드 검색 (공고명, 회사명 클라이언트 사이드 필터)
- [x] 공고 상세 페이지 (`/jobs/[id]`) - Rich Text 렌더링, SEO 메타태그
- [x] 북마크 기능 (`useBookmarkStore` - Zustand + persist)
- [x] 북마크 목록 페이지 (`/bookmarks`)
- [ ] 기본 반응형 UI 검증 (모바일 대응 최종 확인)
- [ ] Vercel 배포 및 환경변수 설정

### MVP 제외 기능 및 사유

| 기능 | 제외 사유 |
|------|-----------|
| 기술스택 필터 (사이드바 내) | 기술스택 항목이 많아 UX 설계 추가 필요 |
| 월별 수집 공고 수 추이 차트 | 수집 데이터가 일정량 쌓인 후 의미 있음 |
| 무한 스크롤 | 커서 기반 페이지네이션 구조 완성 후 추가 |
| 마감일 자동 상태 업데이트 | Notion Webhook 또는 배치 작업 설계 필요 |

### 성공 지표 (KPI)

- 공고 목록 초기 로딩: 2초 이내 (TanStack Query staleTime 1분 캐시 기준)
- 필터·검색 응답: 즉각적 (클라이언트 사이드 필터링)
- Notion API 에러 시 빈 상태(Empty State) 처리 100%
- 모바일(375px) / 태블릿(768px) / 데스크탑(1440px) 레이아웃 정상 동작

---

## 기술 아키텍처 개요

### 시스템 구성

```
[사용자 브라우저]
      |
      | HTTPS
      v
[Vercel Edge / Node.js Runtime]
  Next.js 16 (App Router)
  ├── Server Components (공고 상세, 통계 - 직접 notion.ts 호출)
  ├── Client Components (목록 페이지, 북마크 - TanStack Query)
  └── API Routes (/api/jobs, /api/jobs/[id])
      |
      | HTTPS (Notion API)
      v
[Notion API v5]
  └── 채용공고 DB (데이터베이스 ID)
```

### 주요 기술 결정 사항

| 항목 | 결정 | 근거 |
|------|------|------|
| Notion 클라이언트 | `@notionhq/client` v5 (request 메서드 직접 사용) | v5에서 `databases.query`가 deprecated, HTTP 직접 호출 방식 채택 |
| 서버 상태 관리 | TanStack Query (공고 목록/상세) | staleTime 60초로 Notion API 요청 최소화 |
| 클라이언트 상태 | Zustand + persist (북마크) | 로그인 없이 localStorage에 북마크 영속화 |
| 필터링 방식 | 클라이언트 사이드 | Notion API 필터 조건 조합이 복잡하고 요청 수 절약 |
| 차트 라이브러리 | Recharts | React 친화적이며 shadcn/ui 테마와 통합 용이 |
| 인증 | 사용 안 함 (NextAuth 파일 존재하나 미활성화) | MVP에서 인증 불필요, Notion이 데이터 관리 담당 |

### 데이터 모델 (Notion DB 필드 매핑)

```typescript
interface Job {
  id: string;             // Notion 페이지 ID
  title: string;          // 공고명 (Title)
  company: string;        // 회사명 (Rich Text → plain_text)
  jobTypes: JobType[];    // 직무 유형 (Multi-select)
  employmentType: EmploymentType | null;   // 고용 형태 (Select)
  experienceLevel: ExperienceLevel | null; // 경력 요건 (Select)
  requirements: RichTextItem[];            // 자격요건 (Rich Text)
  preferredQualifications: RichTextItem[]; // 우대사항 (Rich Text)
  responsibilities: RichTextItem[];        // 담당업무 (Rich Text)
  techStack: string[];    // 기술스택 (Multi-select)
  jobUrl: string | null;  // 공고 URL (URL)
  deadline: string | null;    // 마감일 (Date)
  collectedAt: string | null; // 수집일 (Date)
  status: JobStatus | null;   // 상태 (Select)
  memo: RichTextItem[];   // 메모 (Rich Text)
}
```

### API 엔드포인트 목록

| 메서드 | 경로 | 설명 | 상태 |
|--------|------|------|------|
| GET | `/api/jobs` | 공고 목록 조회 (cursor 페이지네이션) | 완료 |
| GET | `/api/jobs/[id]` | 공고 상세 조회 | 완료 |

> 통계 데이터(`/stats`)는 Server Component에서 `notion.ts` 함수를 직접 호출하므로 별도 API Route 없음.

---

## 🧪 테스트 전략

### Playwright MCP 테스트 원칙
- 모든 API 연동 구현 후 Playwright MCP로 실제 브라우저 동작 검증 필수
- 비즈니스 로직 구현 후 사용자 시나리오 기반 E2E 테스트 수행
- **구현 → 테스트 → 수정** 순서를 반드시 지킴 (테스트 통과 전까지 다음 Task로 진행 금지)
- 테스트 실패 시: 실패 원인 기록 → 코드 수정 → 재테스트 → 통과 후 진행

### 테스트 시나리오 작성 기준
각 테스트 Task에 다음 항목을 포함:
1. **정상 케이스**: 올바른 입력으로 기대 결과 확인
2. **예외 케이스**: 빈 값, 잘못된 입력, API 오류 상황
3. **UI 상태 검증**: 로딩(spinner), 에러 메시지, 빈 상태(empty state) 표시 여부

### Playwright MCP 도구 사용 가이드
- `mcp__playwright__browser_navigate` → 테스트할 페이지로 이동
- `mcp__playwright__browser_snapshot` → 현재 DOM 상태 스냅샷으로 렌더링 결과 확인
- `mcp__playwright__browser_click` → 버튼/링크 클릭 동작 테스트
- `mcp__playwright__browser_fill_form` → 폼 입력값 채우기
- `mcp__playwright__browser_wait_for` → 비동기 데이터 로딩 완료 대기
- `mcp__playwright__browser_take_screenshot` → 테스트 결과 화면 캡처 (실패 증거용)
- `mcp__playwright__browser_network_requests` → API 요청/응답 확인
- `mcp__playwright__browser_console_messages` → 콘솔 에러 확인

---

## 개발 단계별 계획

### Phase 1: 프로젝트 초기 설정 - 완료

**목표:** Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui 기반 프로젝트 골격을 구축하고, TanStack Query / Zustand AppProviders 및 공통 레이아웃(Header, Sidebar)을 완성합니다.

**완료 기준:**
- Next.js 15 App Router 프로젝트가 정상 실행됨
- `AppProviders` (TanStack Query, Zustand)가 루트 레이아웃에 주입됨
- Header / Sidebar 공통 레이아웃이 (dashboard) 그룹에 적용됨
- `.env.local` 환경변수 구조가 정의됨
- `npm run lint`, `npm run typecheck`가 오류 없이 통과됨

#### Epic 1.1: 프로젝트 기반 설정

- [x] Task: Next.js 15 + TypeScript + Tailwind CSS v4 + shadcn/ui 초기 설정 (예상: 1h)
- [x] Task: TanStack Query + Zustand `AppProviders` 구성 및 루트 레이아웃 주입 (예상: 1h)
- [x] Task: `.env.local` 환경변수 구조 정의 (`NOTION_API_KEY`, `NOTION_DATABASE_ID`) (예상: 0.5h)

#### Epic 1.2: 공통 레이아웃

- [x] Task: `src/components/layout/header.tsx` - Header 컴포넌트 (예상: 1h)
- [x] Task: `src/components/layout/sidebar.tsx` - Sidebar 컴포넌트 (예상: 1h)
- [x] Task: `src/app/(dashboard)/layout.tsx` - Header + Sidebar 조합 레이아웃 (예상: 0.5h)

---

### Phase 2: 공통 모듈 개발 - 완료

**목표:** Notion API 클라이언트, 데이터 타입 및 변환 레이어, API Routes를 완성하여 이후 모든 기능이 사용하는 공통 기반을 구축합니다.

**완료 기준:**
- `NOTION_API_KEY`, `NOTION_DATABASE_ID` 환경변수 설정 시 정상 조회
- `Job` 타입으로 Notion 페이지 데이터가 변환됨
- API 키 미설정 시 빈 배열 반환 (빌드 오류 없음)
- `GET /api/jobs`, `GET /api/jobs/[id]` 응답 정상

#### Epic 2.1: Notion 클라이언트 설정

- [x] Task: Notion Integration 생성 및 API 키 발급 (예상: 0.5h)
- [x] Task: 채용공고 DB 생성 및 14개 필드 설정 (예상: 1h)
- [x] Task: `@notionhq/client` v5 설치 및 `.env.local` 환경변수 설정 (예상: 0.5h)
- [x] Task: `src/lib/notion.ts` - 싱글턴 클라이언트 + 환경변수 null 처리 (예상: 1h)

#### Epic 2.2: 데이터 타입 및 변환 레이어

- [x] Task: `src/types/job.ts` - `Job`, `JobFilter`, `TechStackStat`, `JobTypeStat` 타입 정의 (예상: 1h)
- [x] Task: Notion 프로퍼티 추출 헬퍼 함수 구현 (`extractTitle`, `extractRichText`, `extractSelect` 등) (예상: 2h)
- [x] Task: `mapPageToJob` - `PageObjectResponse` → `Job` 변환 함수 (예상: 1h)
- [x] Task: `getJobs`, `getJobById` 공개 API 함수 (페이지네이션 포함) (예상: 1h)
- [x] Task: `getTechStackStats`, `getJobTypeStats` 집계 함수 (예상: 1.5h)

#### Epic 2.3: API Routes 구현

- [x] Task: `GET /api/jobs` - 목록 조회, cursor 파라미터 처리 (예상: 0.5h)
- [x] Task: `GET /api/jobs/[id]` - 상세 조회, 404 처리 (예상: 0.5h)

---

### Phase 3: 핵심 기능 - 완료 (일부 이월)

**목표:** 공고 목록 카드 그리드와 공고 상세 페이지를 완성하여 서비스의 핵심 사용자 흐름(목록 조회 → 상세 확인)을 구현합니다.

**완료 기준:**
- 공고 카드에 회사명, 공고명, 직무 유형 배지, 기술스택 태그(최대 5개), 마감일, 상태, 북마크 버튼이 표시됨
- TanStack Query로 공고 목록 데이터가 페칭됨
- 검색창에서 공고명·회사명 키워드 검색이 동작함
- 공고 상세 페이지에서 담당업무, 자격요건, 우대사항이 줄바꿈 기준으로 목록 렌더링됨
- `generateMetadata`로 공고명, 회사명이 메타태그에 반영됨
- 공고 원문 링크 버튼 및 404 처리가 동작함

#### Epic 3.1: 공고 카드 컴포넌트

- [x] Task: `src/components/jobs/job-card.tsx` - `JobCard` 컴포넌트 (예상: 2h)
  - 회사명, 공고명(링크), 직무 유형 배지, 기술스택 태그, 고용형태, 경력, 마감일, 상태, 북마크 버튼
- [x] Task: `src/components/jobs/job-list.tsx` - `JobList` 그리드 컴포넌트 (로딩/빈 상태 포함) (예상: 1h)

#### Epic 3.2: 홈 페이지 조합

- [x] Task: `src/app/page.tsx` - TanStack Query 데이터 페칭, 클라이언트 사이드 필터 적용 (예상: 2h)
- [x] Task: 검색창 (`<Input>`) 키워드 필터 연동 (예상: 0.5h)

#### Epic 3.3: 공고 상세 페이지

- [x] Task: `src/app/jobs/[id]/page.tsx` - Server Component 상세 페이지 (예상: 3h)
  - 공고 헤더 (회사명, 공고명, 배지, 메타 정보)
  - `RichTextBlock` 컴포넌트 (줄바꿈 파싱 → 목록 렌더링)
  - 담당업무, 자격요건, 우대사항, 메모 섹션
  - 원본 공고 링크 버튼
- [x] Task: `generateMetadata` - 동적 메타태그 생성 (예상: 0.5h)

#### Epic 3.4: Rich Text 렌더링 개선 (선택, 이월)

- [ ] Task: Notion 어노테이션 적용 렌더러 구현 (예상: 3h)
  - bold, italic, strikethrough, code, underline 스타일 반영
  - 현재 `RichTextBlock`은 `plain_text`만 사용하므로 서식 정보 미반영
- [ ] 🧪 Test: Rich Text 어노테이션 렌더링 검증 (예상: 1h)
  - 정상 케이스: bold 텍스트가 `<strong>` 또는 `font-bold` 클래스로 렌더링됨, code 텍스트가 `<code>` 태그로 표시됨, italic이 `<em>` 또는 `font-italic`으로 표시됨
  - 예외 케이스: 어노테이션 없는 일반 텍스트는 스타일 없이 정상 렌더링, 여러 어노테이션 중첩(bold + italic) 시 모두 적용됨
  - UI 상태 검증: 상세 페이지 자격요건/담당업무 섹션에서 서식이 실제 화면에 반영됨(`browser_snapshot`으로 DOM 확인)

---

### Phase 4: 추가 기능 - 일부 완료 (일부 이월)

**목표:** 필터 사이드바를 완성하고, 기술스택 필터·URL 상태 동기화·상세 페이지 북마크 버튼 분리를 구현하여 필터링 UX를 완성합니다.

**완료 기준:**
- 직무 유형 / 고용형태 / 경력 / 상태 필터가 즉각 적용됨
- 기술스택 필터가 사이드바에 표시되고 선택 시 공고 목록이 필터링됨
- URL 쿼리 파라미터로 필터 상태가 동기화되어 새로고침·공유 시 유지됨
- 상세 페이지 북마크 버튼이 클라이언트 컴포넌트로 분리되어 정상 동작함

#### Epic 4.1: 필터 사이드바

- [x] Task: `src/components/jobs/filter-sidebar.tsx` - `FilterSidebar` 컴포넌트 (예상: 2h)
  - 직무 유형, 고용형태, 경력 요건, 공고 상태 토글 배지 필터
  - 활성 필터 수 표시 및 전체 초기화 버튼
- [ ] Task: 기술스택 필터 항목 추가 (이월) (예상: 2h)
  - 기술스택 목록을 Notion DB에서 동적으로 가져오거나 정적 목록 제공
  - 다중 선택 UI (체크박스 또는 배지 토글)
- [ ] 🧪 Test: 기술스택 필터 동작 검증 (예상: 1h)
  - 정상 케이스: 특정 기술스택(예: Kubernetes) 선택 시 해당 기술 포함 공고만 목록에 표시됨
  - 예외 케이스: 공고가 없는 기술스택 선택 시 빈 상태(empty state) 메시지 표시, 다중 선택 시 OR/AND 조건 동작 확인
  - UI 상태 검증: 기술스택 목록 로딩 중 스피너 표시, 선택된 필터 배지 활성화 스타일 확인, 필터 초기화 버튼 클릭 시 전체 해제

#### Epic 4.2: URL 필터 상태 동기화 (이월)

- [ ] Task: URL 쿼리 파라미터 기반 필터 상태 동기화 (예상: 2h)
  - 새로고침·공유 시 필터 상태 유지
  - `useSearchParams`, `useRouter`를 활용한 URL 동기화
- [ ] 🧪 Test: URL 필터 상태 동기화 검증 (예상: 1h)
  - 정상 케이스: 직무 유형 필터 선택 후 URL에 쿼리 파라미터 반영됨(`?jobType=SRE`), 해당 URL 직접 접근 시 필터가 적용된 상태로 로딩됨
  - 예외 케이스: 잘못된 쿼리 파라미터 값(예: `?status=invalid`) 입력 시 필터 무시 후 전체 목록 표시, 빈 쿼리 파라미터 처리 확인
  - UI 상태 검증: 필터 선택 즉시 URL 변경 확인(`browser_network_requests`), 브라우저 뒤로가기 시 이전 필터 상태로 복원

#### Epic 4.3: 상세 페이지 북마크 버튼 분리 (이월)

- [ ] Task: 상세 페이지 북마크 버튼 클라이언트 컴포넌트 분리 (예상: 1h)
  - 현재 상세 페이지의 북마크 버튼은 클릭해도 동작하지 않음 (Server Component 한계)
  - `BookmarkButton` 클라이언트 컴포넌트로 분리하여 `useBookmarkStore` 연동
- [ ] 🧪 Test: 상세 페이지 북마크 버튼 동작 검증 (예상: 0.5h)
  - 정상 케이스: 상세 페이지에서 북마크 버튼 클릭 시 아이콘이 채워진 상태로 토글됨, 목록 페이지로 돌아왔을 때 동일 공고 카드에도 북마크 상태 반영됨
  - 예외 케이스: 새로고침 후 북마크 상태가 localStorage에서 복원됨, 북마크 목록 페이지에서 해당 공고가 표시됨
  - UI 상태 검증: 클릭 즉시 버튼 아이콘 변경 확인, 콘솔 에러 없음 확인(`browser_console_messages`)

---

### Phase 5: 북마크 기능 - 완료

**목표:** 로컬스토리지 기반 북마크 기능을 완성하고, 북마크 목록 페이지를 구현합니다.

**완료 기준:**
- 공고 카드의 북마크 버튼 클릭 시 즉시 토글됨
- 새로고침 후에도 북마크 상태가 유지됨 (localStorage persist)
- 북마크 목록 페이지에서 저장된 공고만 필터링하여 표시됨
- 북마크 없을 때 Empty State가 표시됨

#### Epic 5.1: 북마크 스토어

- [x] Task: `src/stores/bookmark-store.ts` - Zustand + persist 스토어 구현 (예상: 1h)
  - `bookmarkedIds`, `addBookmark`, `removeBookmark`, `toggleBookmark`, `isBookmarked`, `clearBookmarks`

#### Epic 5.2: 북마크 UI

- [x] Task: `src/app/bookmarks/page.tsx` - 북마크 목록 페이지 (예상: 1.5h)
  - Hydration 불일치 방지 (`isMounted` 패턴)
  - 전체 삭제 버튼
  - `JobList`로 북마크 공고 렌더링

---

### Phase 6: 통계/분석 페이지 - 완료 (일부 이월)

**목표:** Recharts를 활용하여 기술스택 빈도 차트와 직무 유형 분포 차트를 제공합니다.

**완료 기준:**
- 기술스택 수평 막대 차트(상위 15개)가 렌더링됨
- 직무 유형 도넛 차트 및 집계 테이블이 표시됨
- Suspense 기반 로딩 처리가 동작함

#### Epic 6.1: 차트 컴포넌트

- [x] Task: `src/components/stats/tech-stack-chart.tsx` - Recharts 수평 막대 차트 (예상: 2h)
- [x] Task: `src/components/stats/job-type-chart.tsx` - Recharts 도넛 차트 (예상: 2h)

#### Epic 6.2: 통계 페이지

- [x] Task: `src/app/stats/page.tsx` - Server Component, Suspense 분리 (예상: 1h)
  - `TechStackSection`, `JobTypeSection` 서버 컴포넌트 분리
  - 집계 테이블 (직무 유형별 공고 수 / 비율)

#### Epic 6.3: 추가 차트 (선택, 이월)

- [ ] Task: 경력 요건 분포 차트 구현 (예상: 1.5h)
  - PRD 명시 요구사항, 현재 미구현
  - `getExperienceLevelStats` 함수 추가 후 파이/도넛 차트 적용
- [ ] 🧪 Test: 경력 요건 분포 차트 렌더링 검증 (예상: 0.5h)
  - 정상 케이스: 통계 페이지 접근 시 경력 요건 차트(신입/1-3년/3-5년/5년 이상 등)가 파이/도넛 형태로 렌더링됨, 각 항목의 비율·건수가 정확히 표시됨
  - 예외 케이스: 경력 요건 미설정 공고가 있을 경우 '미분류' 또는 null 항목 처리 확인, 공고가 없을 때 빈 상태 표시
  - UI 상태 검증: 데이터 로딩 중 Suspense fallback 표시 확인, 차트 레전드와 툴팁 정상 동작(`browser_hover`로 툴팁 확인)
- [ ] Task: 월별 수집 공고 수 추이 라인 차트 (예상: 2h)
  - 데이터 누적 후 의미 있음 - 충분한 데이터 확보 후 구현

---

### Phase 7: 공고 입력 가이드 페이지 - 완료

**목표:** 비개발자도 Notion DB에 공고를 올바르게 입력할 수 있도록 안내 페이지를 제공합니다.

**완료 기준:**
- 14개 필드 각각의 설명, 필수 여부, 작성 예시가 카드 형태로 표시됨
- 시작하기 순서 안내가 포함됨

#### Epic 7.1: 가이드 페이지

- [x] Task: `src/app/guide/page.tsx` - 필드 가이드 데이터 + 카드 UI (예상: 2h)

---

### Phase 8: 품질 개선 및 배포

**목표:** 이월된 미완성 기능을 완성하고 UX/UI·접근성을 개선한 뒤 Vercel에 프로덕션 배포합니다.

**예상 기간:** 2~3일

**완료 기준:**
- Lighthouse 점수 Performance 85 이상, Accessibility 90 이상
- 모바일(375px) 레이아웃 이상 없음
- Vercel 배포 성공 및 환경변수 설정 완료
- NOTION_API_KEY 미설정 시 빈 상태(Empty State) 정상 표시

#### Epic 8.1: 미완성 기능 완성

- [ ] Task: 상세 페이지 북마크 버튼 `BookmarkButton` 클라이언트 컴포넌트 분리 (예상: 1h)
- [ ] 🧪 Test: 상세 페이지 북마크 버튼 클라이언트 동작 검증 (예상: 0.5h)
  - 정상 케이스: 공고 상세 페이지에서 북마크 버튼 클릭 시 즉시 토글 반응, 목록 페이지 카드의 북마크 상태와 동기화됨
  - 예외 케이스: 새로고침 후 북마크 상태 복원 확인, 북마크 목록 페이지에서 해당 공고 표시 여부 확인
  - UI 상태 검증: 버튼 클릭 즉시 아이콘 변경 확인, 콘솔 에러 없음(`browser_console_messages`)
- [ ] Task: 기술스택 필터 사이드바 추가 (예상: 2h)
- [ ] 🧪 Test: 기술스택 필터 사이드바 동작 검증 (예상: 1h)
  - 정상 케이스: 사이드바에 기술스택 필터 목록 표시됨, 특정 기술(예: Docker) 선택 시 해당 기술 포함 공고만 필터링됨
  - 예외 케이스: 선택 기술스택에 해당하는 공고 없을 때 empty state 표시, 여러 기술스택 동시 선택 시 조건 적용 확인
  - UI 상태 검증: 활성 필터 수 표시 업데이트 확인, 필터 초기화 버튼으로 기술스택 선택 해제 확인
- [ ] Task: URL 쿼리 파라미터 필터 동기화 (예상: 2h)
- [ ] 🧪 Test: URL 필터 파라미터 동기화 종합 검증 (예상: 1h)
  - 정상 케이스: 직무 유형·상태·기술스택 필터 복합 선택 후 URL에 모든 파라미터 반영, 생성된 URL을 새 탭에서 열면 동일 필터 상태로 로드됨
  - 예외 케이스: URL에 존재하지 않는 필터 값 포함 시 해당 값 무시 후 유효한 필터만 적용, 뒤로가기/앞으로가기 시 필터 상태 이력 추적
  - UI 상태 검증: 필터 변경 시 URL 쿼리스트링 실시간 갱신 확인(`browser_snapshot`), 페이지 제목과 공고 건수가 필터 조건 반영
- [ ] Task: Rich Text 어노테이션 렌더링 개선 (bold, italic, code 등) (예상: 3h)
- [ ] 🧪 Test: Rich Text 어노테이션 스타일 적용 검증 (예상: 1h)
  - 정상 케이스: Notion에서 bold 설정된 텍스트가 화면에서 굵게 표시됨, inline code가 코드 스타일(배경색, monospace 폰트)로 렌더링됨, italic이 기울임꼴로 표시됨
  - 예외 케이스: 어노테이션 없는 일반 텍스트 정상 렌더링, strikethrough 텍스트 취소선 적용 확인
  - UI 상태 검증: 자격요건·담당업무 섹션 DOM 스냅샷으로 실제 스타일 클래스 확인(`browser_snapshot`)
- [ ] Task: 경력 요건 분포 차트 추가 (예상: 1.5h)
- [ ] 🧪 Test: 경력 요건 차트 통계 페이지 통합 검증 (예상: 0.5h)
  - 정상 케이스: 통계 페이지에 경력 요건 차트 섹션이 표시됨, 각 경력 구간별 공고 수와 비율이 정확히 집계됨
  - 예외 케이스: 경력 요건 미입력 공고 처리(null 항목 표시 여부), 공고 0건 경력 구간 차트에서 처리 방식 확인
  - UI 상태 검증: Suspense 로딩 상태에서 스피너 표시, 차트 데이터 로드 완료 후 렌더링 확인(`browser_wait_for`)

#### Epic 8.2: UX/UI 개선

- [ ] Task: 모바일 필터 드로어/시트 구현 (현재 `lg:hidden`으로 미표시) (예상: 2h)
  - shadcn/ui `Sheet` 컴포넌트를 활용한 모바일 필터 패널
- [ ] 🧪 Test: 모바일 필터 드로어 동작 검증 (예상: 1h)
  - 정상 케이스: 375px 뷰포트에서 필터 버튼 클릭 시 Sheet 드로어 열림, 필터 선택 후 적용 버튼 클릭 시 드로어 닫힘 및 공고 목록 필터 반영
  - 예외 케이스: 드로어 열린 상태에서 뒤로가기 또는 오버레이 클릭 시 닫힘 동작 확인, 필터 선택 없이 닫기 시 기존 필터 상태 유지
  - UI 상태 검증: `browser_resize`로 375px로 조정 후 필터 사이드바 숨김 확인, 드로어 열림/닫힘 애니메이션 동작, 드로어 내부 필터 UI 정상 렌더링
- [ ] Task: 공고 카드 스켈레톤 로딩 UI 적용 (예상: 1h)
  - 현재는 스피너만 표시, 카드 형태 Skeleton으로 개선
- [ ] 🧪 Test: 스켈레톤 로딩 UI 표시 검증 (예상: 0.5h)
  - 정상 케이스: 페이지 최초 로드 시 공고 카드 영역에 Skeleton 컴포넌트가 카드 형태로 표시됨, 데이터 로드 완료 후 실제 카드로 전환됨
  - 예외 케이스: 네트워크 지연 시뮬레이션 후 스켈레톤 유지 시간 확인, 에러 발생 시 스켈레톤이 에러 메시지로 대체됨
  - UI 상태 검증: 스켈레톤 카드 개수가 적절함(예: 6~12개), 레이아웃 shift 없이 스켈레톤 → 실제 카드 전환
- [ ] Task: 상태 배지 색상 구분 강화 (진행중: green, 마감: gray, 검토중: yellow) (예상: 0.5h)
- [ ] 🧪 Test: 상태 배지 색상 표시 검증 (예상: 0.5h)
  - 정상 케이스: 공고 목록에서 '진행중' 배지가 초록색 계열로, '마감' 배지가 회색으로, '검토중' 배지가 노란색으로 표시됨
  - 예외 케이스: 상태 값이 null인 공고에서 배지 미표시 또는 기본 스타일 적용 확인
  - UI 상태 검증: `browser_snapshot`으로 각 상태별 배지 CSS 클래스 확인, 다크모드에서도 색상 구분 가능 여부 확인

#### Epic 8.3: 성능 및 접근성

- [ ] Task: ARIA 레이블 전수 점검 (예상: 1h)
  - 필터 배지, 북마크 버튼, 차트 등 ARIA 속성 보완
- [ ] 🧪 Test: 접근성 ARIA 레이블 검증 (예상: 1h)
  - 정상 케이스: 북마크 버튼에 `aria-label="북마크 추가"` / `"북마크 제거"` 속성이 상태에 따라 변경됨, 필터 배지 버튼에 선택/해제 상태가 `aria-pressed` 또는 `aria-checked`로 표시됨
  - 예외 케이스: 아이콘만 있는 버튼에 텍스트 대안(`aria-label` 또는 `sr-only`) 적용 확인, 차트 영역에 `aria-label` 또는 `role="img"` 속성 확인
  - UI 상태 검증: `browser_snapshot`의 accessibility tree에서 모든 인터랙티브 요소에 레이블 존재 확인, 콘솔 접근성 경고 없음
- [ ] Task: 키보드 탐색 검증 (예상: 1h)
- [ ] 🧪 Test: 키보드 탐색 동작 검증 (예상: 1h)
  - 정상 케이스: Tab 키로 헤더 → 검색창 → 필터 → 공고 카드 → 북마크 버튼 순서로 포커스 이동, Enter/Space로 필터 배지 선택 및 북마크 토글 동작
  - 예외 케이스: 모달/드로어 열린 상태에서 포커스 트랩 동작 확인(Tab이 드로어 내부에서만 순환), Escape 키로 드로어/모달 닫힘
  - UI 상태 검증: `browser_press_key`로 Tab 순서 검증, 포커스 링(focus ring) 시각적으로 표시됨(`browser_snapshot`으로 확인)
- [ ] Task: `<Image>` 컴포넌트 적용 (로고, 아이콘 등 최적화 여지) (예상: 0.5h)

#### Epic 8.4: 배포

- [ ] Task: Vercel 프로젝트 생성 및 GitHub 연동 (예상: 0.5h)
- [ ] Task: Vercel 환경변수 설정 (`NOTION_API_KEY`, `NOTION_DATABASE_ID`) (예상: 0.5h)
- [ ] Task: 프로덕션 빌드 검증 (`npm run build` 오류 없음 확인) (예상: 0.5h)
- [ ] 🧪 Test: 프로덕션 배포 후 핵심 기능 E2E 검증 (예상: 1.5h)
  - 정상 케이스: 배포된 프로덕션 URL에서 공고 목록 정상 로드(2초 이내), 필터 적용 및 상세 페이지 이동 동작, 북마크 저장 후 새로고침 시 유지
  - 예외 케이스: 환경변수 미설정 시나리오 - NOTION_API_KEY 없을 때 빈 상태(empty state) 표시됨(서버 오류 아님), `/api/jobs` 직접 접근 시 JSON 응답 확인
  - UI 상태 검증: `browser_network_requests`로 API 응답 시간 확인, `browser_console_messages`로 프로덕션 환경 콘솔 에러 없음 확인, `browser_take_screenshot`으로 주요 페이지 캡처
- [ ] Task: 커스텀 도메인 연결 (선택사항) (예상: 0.5h)

---

## 리스크 및 의존성

| 리스크 | 영향도 | 발생 가능성 | 대응 방안 |
|--------|--------|------------|----------|
| Notion API Rate Limit (초당 3회) | 높음 | 중간 | TanStack Query staleTime 1분 설정, 통계 페이지 ISR 또는 서버 캐시 검토 |
| Notion API 응답 시간 지연 | 중간 | 높음 | TanStack Query 캐싱 + 스켈레톤 UI로 체감 속도 개선 |
| `@notionhq/client` v5 API 변경 | 높음 | 낮음 | `client.request` 직접 호출로 버전 의존성 격리 완료 |
| Notion DB 필드명 변경 시 매핑 오류 | 높음 | 낮음 | `mapPageToJob` 함수에서 null 처리 완비, 가이드 페이지 필드명 명시 |
| 공고 100건 초과 시 페이지네이션 누락 | 중간 | 중간 | 현재 목록 20건 페이지네이션, 통계는 while 루프로 전수 집계 완료 |
| 모바일에서 필터 사이드바 미표시 | 중간 | 확정 | Phase 7에서 모바일 드로어(Sheet) 구현 예정 |
| Vercel 빌드 시 환경변수 미설정 | 높음 | 중간 | `createNotionClient`에서 null 반환으로 빌드 오류 방지 완비 |

---

## 기술 부채 및 향후 개선 사항

### 현재 범위에서 제외된 개선 사항

1. **Notion Rich Text 완전 렌더링**: 현재 `RichTextBlock`은 `plain_text`만 사용하여 bold, italic, code, strikethrough 등 Notion 어노테이션이 무시됨. `annotations` 객체를 활용한 스타일 적용 필요.

2. **공고 상세 페이지 북마크 버튼**: 현재 Server Component 내에 북마크 버튼이 있어 클릭 이벤트 미동작. `BookmarkButton` 클라이언트 컴포넌트로 분리 필요.

3. **모바일 필터 UI**: 현재 `lg:hidden`으로 모바일에서 필터 사이드바가 숨겨짐. shadcn/ui `Sheet` 컴포넌트를 활용한 드로어 필터 패널 구현 필요.

4. **기술스택 필터**: `FilterSidebar`에 기술스택 필터가 없음. 동적 목록(Notion DB에서 가져오기) 또는 정적 목록 방식으로 추가 필요.

5. **URL 필터 상태 동기화**: 현재 필터 상태가 컴포넌트 로컬 state에만 저장되어 새로고침 시 초기화됨. `useSearchParams` 기반 URL 동기화 필요.

6. **무한 스크롤**: 현재 첫 페이지(20건)만 로드. `useInfiniteQuery`와 `hasMore / nextCursor`를 활용한 무한 스크롤 구현 필요.

### 알려진 기술 부채

| 항목 | 위치 | 설명 |
|------|------|------|
| NextAuth 미사용 코드 | `src/lib/auth.ts`, `src/lib/auth.config.ts` | MVP에서 인증 불필요하나 보일러플레이트 잔존. 명시적 제거 또는 향후 활용 결정 필요. |
| Prisma 미사용 코드 | `src/lib/prisma.ts`, `prisma/` | Notion CMS 방식이므로 DB 불필요. 제거 시 `package.json` 정리 필요. |
| `회사명` 필드 타입 불일치 | `src/lib/notion.ts` | Notion에서 `Text`(Rich Text) 타입이지만 단순 문자열로 처리. Rich Text 배열에서 plain_text 추출하는 방식 유지. |
| 통계 페이지 전수 집계 성능 | `src/lib/notion.ts` | `getTechStackStats`, `getJobTypeStats`가 모든 공고를 반복 호출. 공고 수 증가 시 응답 지연 가능. ISR(`revalidate`) 또는 캐싱 전략 도입 필요. |

---

## 진행 추적

### Phase 완료 현황

- [x] Phase 1: 프로젝트 초기 설정 (완료)
- [x] Phase 2: 공통 모듈 개발 (완료)
- [x] Phase 3: 핵심 기능 (완료, Rich Text 어노테이션 이월)
- [ ] Phase 4: 추가 기능 (일부 완료 - FilterSidebar 완료, 기술스택 필터·URL 동기화·상세 북마크 버튼 이월)
- [x] Phase 5: 북마크 기능 (완료)
- [x] Phase 6: 통계/분석 페이지 (완료, 경력 요건 차트·라인 차트 이월)
- [x] Phase 7: 공고 입력 가이드 페이지 (완료)
- [ ] Phase 8: 품질 개선 및 배포 (진행 전)
- [x] Phase 9: 채용공고 자동 수집 파이프라인 (완료)

### Phase 8 세부 체크리스트

**미완성 기능 완성**
- [ ] 상세 페이지 북마크 버튼 클라이언트 컴포넌트 분리
- [ ] 기술스택 필터 사이드바 추가
- [ ] URL 쿼리 파라미터 필터 동기화
- [ ] Rich Text 어노테이션 렌더링 개선
- [ ] 경력 요건 분포 차트 추가

**UX/UI 개선**
- [ ] 모바일 필터 드로어 구현
- [ ] 공고 카드 스켈레톤 로딩 UI
- [ ] 상태 배지 색상 구분 강화

**성능 및 접근성**
- [ ] ARIA 레이블 전수 점검
- [ ] 키보드 탐색 검증

**배포**
- [ ] Vercel 프로젝트 생성 및 환경변수 설정
- [ ] 프로덕션 빌드 검증 (`npm run build`)
- [ ] 커스텀 도메인 연결 (선택)

### Phase 9 세부 체크리스트 (완료)

**스크래퍼 파이프라인 구현**
- [x] `scraper/config.py` — 환경변수 로딩 + validate(dry_run)
- [x] `scraper/scrapers/base.py` — BaseScraper 추상 클래스
- [x] `scraper/utils/tech_extractor.py` — 기술스택 키워드 추출
- [x] `scraper/utils/job_classifier.py` — 직무 유형 자동 분류
- [x] `scraper/notion_writer.py` — Notion DB 쓰기 + URL 기반 중복 방지
- [x] `scraper/scrapers/saramin.py` — 사람인 공식 XML API
- [x] `scraper/scrapers/wanted.py` — 원티드 내부 JSON API
- [x] `scraper/scrapers/jumpit.py` — 점핏 내부 JSON API
- [x] `scraper/scrapers/programmers.py` — 프로그래머스 내부 JSON API
- [x] `scraper/scrapers/jobkorea.py` — 잡코리아 HTML 파싱 (BeautifulSoup)
- [x] `scraper/main.py` — CLI 진입점 (`--source`, `--dry-run`)
- [x] `.github/workflows/scraper.yml` — GitHub Actions 자동화 (월/수/금 오전 9시 KST)

**실행 준비 (사용자 직접 설정 필요)**
- [ ] `scraper/.env` 파일 생성 후 3개 키 입력
- [ ] GitHub Secrets 등록 (`NOTION_API_KEY`, `NOTION_DATABASE_ID`, `SARAMIN_API_KEY`)
