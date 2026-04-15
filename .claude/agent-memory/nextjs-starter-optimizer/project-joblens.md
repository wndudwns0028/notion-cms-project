---
name: JobLens 프로젝트 컨텍스트
description: JobLens 서비스 초기화 내역 - 기술 스택, 설치 패키지, 구현된 페이지/컴포넌트 목록
type: project
---

JobLens (Notion CMS 기반 인프라 채용공고 분석 서비스)를 Next.js 15 스타터킷 위에 초기화 완료.

**Why:** Notion을 CMS로 활용해 SRE/Cloud/MLOps 등 인프라 직군 공고를 수집·분류·분석하는 웹 서비스 구축.

**How to apply:** 기존 NextAuth v5 + Prisma 인증 구조는 유지됨. 새 기능은 Notion API 기반으로 개발.

## 설치된 패키지
- `@notionhq/client` v5.18.0 — Notion API 클라이언트
- `recharts` v3.8.1 — 차트 라이브러리

## 구현된 페이지
- `/` — 공고 목록 (카드 그리드 + 필터 사이드바, 클라이언트 컴포넌트)
- `/jobs/[id]` — 공고 상세 (서버 컴포넌트, generateMetadata 포함)
- `/stats` — 통계/분석 (서버 컴포넌트 + Suspense)
- `/bookmarks` — 북마크 목록 (클라이언트 컴포넌트, Zustand)
- `/guide` — Notion 입력 가이드 (서버 컴포넌트)

## 구현된 API 라우트
- `GET /api/jobs` — 공고 목록 (cursor 페이지네이션)
- `GET /api/jobs/[id]` — 공고 상세

## 주요 파일
- `src/lib/notion.ts` — Notion 클라이언트 + 쿼리 함수
- `src/types/job.ts` — Job 관련 타입 전체 정의
- `src/stores/bookmark-store.ts` — Zustand + persist 북마크 스토어
- `src/components/jobs/` — JobCard, JobList, FilterSidebar
- `src/components/stats/` — TechStackChart, JobTypeChart

## 주의사항
- Dashboard 레이아웃 Sidebar 제거 (JobLens에 전용 Sidebar 없음, Header 네비게이션으로 대체)
- Notion API 키 없을 때 빈 결과 반환 (빌드 가능)
- Prisma 클라이언트는 `src/generated/prisma/`에 생성됨 (db:generate 실행 필요)
