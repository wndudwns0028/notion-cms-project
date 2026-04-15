---
name: JobLens 주요 아키텍처 결정사항
description: Notion API v5 클라이언트 사용 방식 등 프로젝트 핵심 기술 결정사항
type: project
---

`@notionhq/client` v5에서 `databases.query`가 deprecated되어 `client.request`를 통한 HTTP 직접 호출 방식을 채택함.

**Why:** v5 API 변경으로 인해 기존 방식 사용 불가. `client.request({ path: 'databases/${id}/query', method: 'post', body: {...} })` 패턴 사용.

**How to apply:** Notion API 관련 코드 수정 시 `client.databases.query()` 대신 `client.request()` 사용. 관련 코드는 `src/lib/notion.ts`의 `queryDatabase` 함수 참조.

## 필터링 전략

클라이언트 사이드 필터링 채택 (Notion API 필터 조건 미사용).

**Why:** Notion API 필터 조건 조합이 복잡하고, 요청 수 최소화를 위해 전체 데이터를 한 번에 가져와 클라이언트에서 필터링. TanStack Query staleTime 1분으로 재요청 억제.

## 인증 미사용

MVP에서 인증 불필요. Notion이 어드민 역할 수행. `src/lib/auth.ts` 등 NextAuth 파일은 보일러플레이트로 잔존하나 미활성화.

## 통계 데이터 처리

Server Component에서 `notion.ts` 함수를 직접 호출 (API Route 없음). Suspense 기반 스트리밍 로딩.
