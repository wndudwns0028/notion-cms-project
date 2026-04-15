---
name: JobLens 프로젝트 현황
description: JobLens for Infra Engineers 프로젝트의 구현 현황 및 주요 아키텍처 결정사항
type: project
---

Phase 1~6 구현 완료, Phase 7(품질 개선 및 배포) 진행 전 상태.

**Why:** PRD 기반 ROADMAP.md 생성 과정에서 실제 코드 분석을 통해 구현 현황 파악.

**How to apply:** 이후 대화에서 미완성 기능(북마크 버튼, 기술스택 필터, URL 동기화, Rich Text 어노테이션, 모바일 필터 드로어)에 대한 구현 요청 시 Phase 7 체크리스트 참조.

## 완료된 핵심 구현

- `src/lib/notion.ts`: Notion API v5 클라이언트 (`client.request` 직접 호출 방식)
- `src/types/job.ts`: Job, JobFilter, TechStackStat, JobTypeStat 타입
- `GET /api/jobs`, `GET /api/jobs/[id]` API Routes
- `JobCard`, `JobList`, `FilterSidebar` 컴포넌트
- `useBookmarkStore` (Zustand + persist)
- `/` (홈/목록), `/jobs/[id]` (상세), `/stats` (통계), `/bookmarks`, `/guide` 페이지

## 미완성 항목 (Phase 7)

1. 상세 페이지 북마크 버튼: Server Component 한계로 미동작 → `BookmarkButton` 클라이언트 컴포넌트 분리 필요
2. 기술스택 필터: `FilterSidebar`에 미포함
3. URL 쿼리 파라미터 필터 동기화: 로컬 state만 사용, 새로고침 시 초기화
4. Rich Text 어노테이션 렌더링: `plain_text`만 사용, bold/italic/code 미반영
5. 모바일 필터 UI: `lg:hidden`으로 미표시, shadcn/ui Sheet 드로어 필요
6. 경력 요건 분포 차트: PRD 명시 요구사항이나 미구현

## 기술 부채

- `src/lib/auth.ts`, `src/lib/auth.config.ts`: NextAuth 보일러플레이트 잔존 (미사용)
- `src/lib/prisma.ts`, `prisma/`: Notion CMS 방식으로 DB 불필요, 제거 검토 필요
- 통계 전수 집계 성능: 공고 수 증가 시 `getTechStackStats`/`getJobTypeStats`가 느려질 수 있음
