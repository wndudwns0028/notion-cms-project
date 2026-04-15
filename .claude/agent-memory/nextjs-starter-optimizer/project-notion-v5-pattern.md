---
name: Notion Client v5 API 패턴
description: @notionhq/client v5에서 databases.query가 없어 request()로 직접 쿼리해야 함
type: project
---

`@notionhq/client` v5 (설치 버전: 5.18.0)에서 DB 쿼리 방식이 v4와 다름.

**Why:** v5에서 `client.databases.query()` 메서드가 제거됨. `client.databases`에는 retrieve/create/update만 존재.

**How to apply:** DB 쿼리 시 `client.request<T>()` 메서드로 직접 HTTP POST 요청 사용:

```typescript
const response = await notion.request<DatabaseQueryResponse>({
  path: `databases/${databaseId}/query`,
  method: 'post',
  body: { page_size: 20, sorts: [...] },
});
```

## 타입 관련 주의사항
- `PageObjectResponse.properties`는 `Record<string, PagePropertyValueWithIdResponse>` 타입
- `PagePropertyValueWithIdResponse`는 내부(non-export) 타입 → `Record<string, unknown>` 경유 캐스팅 필요
- `isFullPage(response: ObjectResponse)` 타입 가드 사용 가능 (helpers에서 export)
- DB 쿼리 응답 타입: `Array<PageObjectResponse | PartialPageObjectResponse>`로 선언
- 각 프로퍼티 타입: TitleArrayBasedPropertyValueResponse, RichTextArrayBasedPropertyValueResponse 등 내부 타입 → 직접 구조 파악 후 헬퍼 함수로 추출
