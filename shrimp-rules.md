# Development Guidelines — JobLens for Infra Engineers

## 1. 프로젝트 개요

- **서비스**: Notion CMS 기반 인프라 직군(SRE/Cloud/MLOps 등) 채용공고 조회 서비스
- **스택**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + `@notionhq/client` v5 + TanStack Query + Zustand
- **인증/DB 없음**: MVP에서 인증과 자체 DB 불필요. Notion이 CMS 역할을 전담

---

## 2. 프로젝트 아키텍처

### 디렉토리 역할

| 경로 | 역할 |
|------|------|
| `src/lib/notion.ts` | Notion 클라이언트 싱글턴 + 모든 DB 쿼리 함수 |
| `src/types/job.ts` | `Job`, `JobFilter`, `JobType`, `TechStackStat` 등 전체 타입 정의 |
| `src/app/api/jobs/route.ts` | 목록 조회 API Route (GET /api/jobs) |
| `src/app/api/jobs/[id]/route.ts` | 상세 조회 API Route (GET /api/jobs/[id]) |
| `src/app/page.tsx` | 홈(목록) 페이지 — Client Component, TanStack Query 사용 |
| `src/app/jobs/[id]/page.tsx` | 공고 상세 — Server Component, notion.ts 직접 호출 |
| `src/app/stats/page.tsx` | 통계 — Server Component, notion.ts 직접 호출 |
| `src/app/bookmarks/page.tsx` | 북마크 목록 — Client Component, Zustand 사용 |
| `src/app/guide/page.tsx` | 공고 입력 가이드 — 정적 Server Component |
| `src/components/jobs/` | `JobCard`, `JobList`, `FilterSidebar` 컴포넌트 |
| `src/components/stats/` | `TechStackChart`, `JobTypeChart` (Recharts) |
| `src/components/layout/` | `Header`, `Sidebar` |
| `src/stores/bookmark-store.ts` | Zustand + persist 북마크 스토어 |
| `src/providers/app-providers.tsx` | TanStack Query + Zustand 루트 프로바이더 |

### 데이터 흐름

```
Notion DB
  → notion.ts (queryDatabase → mapPageToJob)
    → API Route (목록/상세)
      → TanStack Query (Client Component)
        → FilterSidebar + JobList + JobCard
```

통계/상세 페이지는 API Route 없이 Server Component에서 `notion.ts` 직접 호출.

---

## 3. Notion API 규칙 (**핵심**)

### `@notionhq/client` v5 사용 방식

- **`notion.databases.query()` 호출 금지** — v5에서 deprecated
- **반드시 `notion.request<T>()` 사용**:

```typescript
// 올바른 방법 (Notion v5: databases → data_sources)
notion.request<DatabaseQueryResponse>({
  path: `data_sources/${databaseId}/query`,
  method: 'post',
  body: { page_size: 20, start_cursor: cursor },
});

// 잘못된 방법 (금지)
notion.databases.query({ database_id: databaseId }); // v5에서 제거됨
notion.request({ path: `databases/${databaseId}/query` }); // invalid_request_url 오류 발생
```

- 페이지 상세 조회는 `notion.pages.retrieve({ page_id: id })` 사용 가능 (deprecated 아님)

### Notion 클라이언트 null 처리

- `notion` 싱글턴은 `NOTION_API_KEY` 미설정 시 `null` 반환 (`createNotionClient()` 참조)
- 모든 공개 API 함수(`getJobs`, `getJobById` 등)는 `if (!notion) return 빈값` 가드 필수
- `getDatabaseId()`는 `NOTION_DATABASE_ID` 미설정 시 throw → 호출 전에 `notion` null 체크 후 early return

### Notion DB 필드명 매핑

Notion DB 필드명은 **한국어**. `mapPageToJob`에서 `props['필드명']` 형태로 접근:

| 필드명 | Notion 타입 | 헬퍼 함수 |
|--------|------------|-----------|
| `공고명` | Title | `extractTitle` |
| `회사명` | Rich Text | `extractRichText` → plain_text join |
| `직무 유형` | Multi-select | `extractMultiSelect` |
| `고용 형태` | Select | `extractSelect` |
| `경력 요건` | Select | `extractSelect` |
| `자격요건` / `우대사항` / `담당업무` / `메모` | Rich Text | `extractRichText` |
| `기술스택` | Multi-select | `extractMultiSelect` |
| `공고 URL` | URL | `extractUrl` |
| `마감일` / `수집일` | Date | `extractDate` |
| `상태` | Select | `extractSelect` |

- 필드명 변경 시 `mapPageToJob` 함수만 수정
- 새 Notion 필드 추가 시: `src/types/job.ts` → `Job` 인터페이스 수정 + `mapPageToJob` 수정

---

## 4. Server / Client Component 구분 규칙

| 조건 | 컴포넌트 종류 |
|------|--------------|
| Notion API 직접 호출 필요 | Server Component (`async` 함수) |
| `useState`, `useEffect`, 이벤트 핸들러 필요 | Client Component (`'use client'`) |
| Zustand 스토어 접근 | Client Component (`'use client'`) |
| TanStack Query (`useQuery`) 사용 | Client Component (`'use client'`) |
| 정적 콘텐츠만 | Server Component (기본값) |

- Server Component 내에서 onClick 등 이벤트 핸들러 **금지**
- 상세 페이지의 북마크 버튼처럼 인터랙션이 필요한 부분은 별도 Client Component로 분리 (`BookmarkButton`)

---

## 5. 필터링 구현 규칙

- **클라이언트 사이드 필터링 전용** — Notion API의 `filter` 파라미터 서버사이드 적용 금지
- 필터 로직은 `src/app/page.tsx`의 `applyFilter()` 함수에 구현
- `JobFilter` 타입 (`src/types/job.ts`) 기준으로 필터 상태 관리
- 다중 선택 필터(jobTypes, techStack)는 **OR 조건** 적용
- 단일 선택 필터(employmentType, experienceLevel, status)는 **정확히 일치** 조건
- 기술스택 필터 추가 시: `JobFilter.techStack?: string[]` 이미 정의됨 → `applyFilter`에 조건 추가만 필요

---

## 6. TanStack Query 규칙

- 기본 `staleTime: 60 * 1000` (1분) — Notion API rate limit 보호
- `retry: 1` — 기본값
- query key 구조: `['jobs']` (목록), `['job', id]` (상세)
- API 호출은 `/api/jobs`, `/api/jobs/[id]` Route를 통해서만 수행
- 통계/상세 Server Component는 TanStack Query 사용 **금지** (직접 `await notion함수()` 호출)

---

## 7. Zustand 북마크 스토어 규칙

- 스토어 파일: `src/stores/bookmark-store.ts`
- persist key: `'bookmark-storage'`
- Hydration 불일치 방지: Client Component에서 `isMounted` 패턴 사용

```typescript
// 올바른 패턴
const [isMounted, setIsMounted] = useState(false);
useEffect(() => setIsMounted(true), []);
if (!isMounted) return <LoadingSpinner />;
```

- 북마크 조작 함수: `toggleBookmark(id)`, `isBookmarked(id)`, `clearBookmarks()`
- 새 Client Component에서 북마크 기능 추가 시 반드시 `useBookmarkStore` import

---

## 8. 통계 함수 추가 규칙

- 새 집계 함수는 반드시 `src/lib/notion.ts`에 추가
- 전수 집계 시 while 루프 패턴 사용 (100건씩 페이지네이션):

```typescript
let cursor: string | undefined;
do {
  const response = await queryDatabase(databaseId, { page_size: 100, start_cursor: cursor });
  // ... 집계 로직
  cursor = response.next_cursor ?? undefined;
} while (cursor);
```

- 새 통계 타입은 `src/types/job.ts`에 interface 추가
- 통계 페이지(`src/app/stats/page.tsx`)에서 `Suspense`로 감싸 로딩 처리

---

## 9. 컴포넌트 추가/수정 규칙

### shadcn/ui 컴포넌트

- `src/components/ui/`에 위치 — 직접 수정 가능 (자동 생성 아님)
- 새 shadcn 컴포넌트 추가: `npx shadcn@latest add <component-name>`
- Tailwind CSS v4 사용 — `tailwind.config.js` 없음, CSS 파일(`globals.css`)에서 설정

### 공통 컴포넌트

- `src/components/common/empty-state.tsx` — 빈 상태 표시
- `src/components/common/loading-spinner.tsx` — 로딩 스피너
- 새 공통 컴포넌트는 `src/components/common/`에 추가

### 차트 컴포넌트

- Recharts 사용, `src/components/stats/`에 위치
- 반드시 `'use client'` 선언 (Recharts는 Client Component)
- 차트 컴포넌트는 Server Component인 stats 페이지에서 import하여 `<Suspense>`로 감싸기

---

## 10. 타입 수정 규칙

- **`src/types/job.ts` 단독 타입 소스** — 다른 파일에 Job 관련 타입 중복 정의 금지
- `JobType` union 변경 시 → `FilterSidebar`의 `JOB_TYPES` 배열도 동기화
- `JobStatus` 변경 시 → `FilterSidebar`의 `JOB_STATUSES` 배열도 동기화
- `EmploymentType` / `ExperienceLevel` 변경 시 → `FilterSidebar`의 해당 배열도 동기화

---

## 11. API Route 규칙

- 모든 API Route는 `src/app/api/` 하위에 위치
- 오류 응답: `NextResponse.json({ error: '...' }, { status: 500 })`
- Notion API 오류는 `try/catch`로 감싸고 `console.error('[GET /api/경로] 오류:', error)` 형식으로 로깅
- 환경변수 미설정 시 API Route가 빈 배열/null을 반환해야 함 (500 오류 금지)

---

## 12. 환경변수 규칙

| 변수명 | 설명 | 미설정 시 동작 |
|--------|------|--------------|
| `NOTION_API_KEY` | Notion Integration 키 | `createNotionClient()` → null 반환 |
| `NOTION_DATABASE_ID` | 채용공고 DB ID | `getDatabaseId()` → throw |

- `.env.local`에 설정, `.env.example`에 더미값 유지
- 환경변수 타입은 `src/types/env.d.ts`에 선언

---

## 13. 스크래퍼 파이프라인 (완료 — scraper/)

> 2026-04-17 구현 완료. 5개 플랫폼에서 인프라 직군 채용공고를 자동 수집하여 Notion DB에 저장.

### 구조

| 파일 | 역할 |
|------|------|
| `scraper/main.py` | CLI 진입점 (`--source`, `--dry-run`) |
| `scraper/config.py` | 환경변수 로딩 + `validate(dry_run)` |
| `scraper/notion_writer.py` | Notion DB 쓰기 + URL 기반 중복 방지 (최근 60일) |
| `scraper/scrapers/base.py` | `BaseScraper` 추상 클래스 |
| `scraper/scrapers/saramin.py` | 사람인 공식 XML API |
| `scraper/scrapers/wanted.py` | 원티드 내부 JSON API |
| `scraper/scrapers/jumpit.py` | 점핏 내부 JSON API |
| `scraper/scrapers/programmers.py` | 프로그래머스 내부 JSON API |
| `scraper/scrapers/jobkorea.py` | 잡코리아 HTML 파싱 (구조 변경 위험 높음) |
| `scraper/utils/tech_extractor.py` | 기술스택 키워드 추출 |
| `scraper/utils/job_classifier.py` | 직무 유형 자동 분류 |
| `.github/workflows/scraper.yml` | GitHub Actions (월/수/금 오전 9시 KST) |

### 실행 방법

```bash
cd scraper
pip install -r requirements.txt
cp .env.example .env   # NOTION_API_KEY, NOTION_DATABASE_ID, SARAMIN_API_KEY 입력

python main.py --source all --dry-run  # 수집만 확인 (Notion 저장 안 함)
python main.py --source all            # 전체 수집 + Notion 저장
```

### GitHub Secrets 필요 항목
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`
- `SARAMIN_API_KEY`

---

## 15. 금지 사항

- **`notion.databases.query()` 직접 호출 금지** — 반드시 `notion.request()` 사용
- **Prisma 활성화 금지** — `src/lib/prisma.ts`, `src/generated/prisma/` 파일 존재하나 사용 금지. Notion이 유일한 데이터 소스
- **NextAuth 활성화 금지** — `src/lib/auth.ts`, `src/lib/auth.config.ts` 존재하나 MVP에서 인증 불필요. `middleware.ts`에서 auth 미들웨어 활성화 금지
- **서버사이드 Notion API 필터 사용 금지** — 클라이언트 사이드 필터링 전용
- **Server Component에 이벤트 핸들러 추가 금지** — 인터랙션 필요 시 별도 Client Component 분리
- **`src/generated/prisma/` 파일 직접 수정 금지** — Prisma 자동 생성 파일
- **`src/components/ui/` 외부에 shadcn 원자 컴포넌트 생성 금지**
- **Job 타입 관련 인터페이스를 `src/types/job.ts` 외 파일에 중복 정의 금지**

---

## 16. AI 의사결정 기준

### 새 기능 구현 시 판단 기준

```
데이터가 Notion에서 오는가?
  ├─ YES → notion.ts에 함수 추가
  │         ├─ 목록/집계 → while 루프 패이지네이션 패턴
  │         └─ 단건 → pages.retrieve 사용
  └─ NO → 클라이언트 상태(Zustand/useState) 사용

UI 컴포넌트가 사용자 인터랙션이 필요한가?
  ├─ YES → 'use client' Client Component
  └─ NO → Server Component (async 직접 데이터 fetching)

필터링 로직이 필요한가?
  └─ 항상 클라이언트 사이드 (applyFilter 함수 확장)
```

### 모호한 상황 처리

- Notion 필드명이 불명확할 때: `mapPageToJob` 함수의 `props['필드명']` 패턴 참조
- 새 차트가 필요할 때: `src/components/stats/` + `'use client'` + Recharts 패턴 따름
- 북마크 기능이 필요한 새 페이지: `useBookmarkStore` + `isMounted` hydration 패턴 적용
- 통계 집계 로직이 필요할 때: `getTechStackStats()` 패턴 복제 후 집계 로직 변경
