# PRD: JobLens for Infra Engineers

## 프로젝트 개요

- **프로젝트명**: JobLens for Infra Engineers
- **목적**: Notion을 CMS로 활용하여 SRE, Cloud Engineer, MLOps Engineer 등 인프라/운영 직군의 채용 공고를 수집·분류·분석하는 웹 서비스
- **배경**: 채용 공고는 흩어져 있고 직무 명칭도 제각각이다. 같은 일을 하더라도 SRE, Platform Engineer, DevOps Engineer, Infrastructure Engineer 등 다양한 이름으로 불린다. 이 서비스는 해당 직군의 공고를 한 곳에 모아 자격요건·기술스택·담당업무를 체계적으로 파악할 수 있게 한다.
- **CMS 선택 이유**: Notion API를 활용하여 별도 어드민 UI 없이도 비개발자가 직접 공고 데이터를 입력·수정·관리할 수 있다. Notion의 데이터베이스 뷰를 그대로 활용하면 데이터 관리 비용이 낮다.

---

## 타겟 직무 범위

명칭이 달라도 인프라 설계·구축·자동화·운영 성격의 직무를 모두 포함한다.

| 직무 명칭 | 설명 |
|-----------|------|
| SRE (Site Reliability Engineer) | 서비스 신뢰성·가용성·성능 관리 |
| Cloud Engineer | 클라우드 인프라 설계·구축·운영 |
| MLOps Engineer | ML 파이프라인 자동화·인프라 운영 |
| Platform Engineer | 내부 개발자 플랫폼 구축 |
| DevOps Engineer | 개발-운영 통합, CI/CD 파이프라인 |
| Infrastructure Engineer | 서버·네트워크·스토리지 인프라 운영 |
| System Engineer | 시스템 설계·구성·운영 (인프라 성격) |

---

## 주요 기능

### 1. 채용 공고 목록 조회
- Notion 데이터베이스에서 공고 데이터를 읽어 카드 형태로 표시
- 페이지네이션 또는 무한 스크롤
- 공고명, 회사명, 직무 유형, 기술스택 태그, 마감일 표시

### 2. 필터링 및 검색
- 직무 유형 필터 (SRE / Cloud / MLOps / Platform / DevOps 등)
- 기술스택 필터 (Kubernetes, Terraform, AWS 등)
- 고용 형태 필터 (정규직 / 계약직 / 인턴)
- 경력 요건 필터 (신입 / 경력)
- 공고 상태 필터 (진행중 / 마감)
- 키워드 검색 (공고명, 회사명)

### 3. 공고 상세 페이지
- 자격요건, 우대사항, 담당업무, 기술스택 전체 내용 표시
- Notion rich text 렌더링 (굵게, 기울임, 목록 등)
- 원본 공고 링크 바로가기
- 북마크 추가/제거

### 4. 기술스택 통계 / 분석
- 전체 공고에서 가장 많이 등장하는 기술스택 빈도 차트
- 직무 유형별 공고 수 분포
- 경력 요건 분포

### 5. 북마크
- 관심 공고 저장 (Zustand + localStorage 퍼시스트)
- 북마크 목록 페이지에서 저장된 공고 일괄 조회

### 6. Notion 공고 입력 가이드 (관리자용)
- 공고 데이터를 Notion DB에 입력하는 방법 안내 페이지
- 각 필드 설명 및 작성 예시

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router), TypeScript |
| CMS | Notion API (`@notionhq/client`) |
| Styling | Tailwind CSS v4, shadcn/ui |
| Icons | Lucide React |
| 상태 관리 | Zustand (북마크·UI 상태) |
| 서버 상태 | TanStack Query (Notion API 응답 캐싱) |
| 차트 | Recharts |
| 배포 | Vercel |

---

## Notion 데이터베이스 구조

데이터베이스명: `채용공고 DB`

| 필드명 | Notion 타입 | 설명 |
|--------|------------|------|
| 공고명 | Title | 직무 공고 제목 |
| 회사명 | Text | 기업명 |
| 직무 유형 | Multi-select | SRE / Cloud / MLOps / Platform / DevOps / Infrastructure / System |
| 고용 형태 | Select | 정규직 / 계약직 / 인턴 |
| 경력 요건 | Select | 신입 / 1년 이상 / 3년 이상 / 5년 이상 / 무관 |
| 자격요건 | Rich Text | 필수 자격 조건 (상세 텍스트) |
| 우대사항 | Rich Text | 우대 조건 (상세 텍스트) |
| 담당업무 | Rich Text | 구체적인 업무 내용 |
| 기술스택 | Multi-select | Kubernetes / Terraform / AWS / GCP / Azure / Docker / Prometheus 등 |
| 공고 URL | URL | 원본 채용 공고 링크 |
| 마감일 | Date | 공고 마감 날짜 |
| 수집일 | Date | 데이터 등록 날짜 |
| 상태 | Select | 진행중 / 마감 / 검토중 |
| 메모 | Rich Text | 개인 메모 (지원 여부, 특이사항 등) |

---

## 화면 구성

### 1. 홈 / 공고 목록 페이지 (`/`)
- 상단: 서비스 소개 헤더 + 키워드 검색창
- 좌측: 필터 사이드바 (직무 유형, 기술스택, 고용 형태, 경력, 상태)
- 우측: 공고 카드 그리드
  - 카드 구성: 회사명, 공고명, 직무 유형 배지, 기술스택 태그, 마감일, 북마크 버튼

### 2. 공고 상세 페이지 (`/jobs/[id]`)
- 공고명, 회사명, 직무 유형, 고용 형태, 경력 요건
- 담당업무 섹션
- 자격요건 섹션
- 우대사항 섹션
- 기술스택 태그 목록
- 원본 공고 링크 버튼
- 수집일 / 마감일
- 북마크 토글 버튼

### 3. 통계 / 분석 페이지 (`/stats`)
- 기술스택 빈도 수평 막대 차트 (Top 20)
- 직무 유형별 공고 수 도넛 차트
- 경력 요건 분포 차트
- 월별 수집 공고 수 추이 라인 차트

### 4. 북마크 페이지 (`/bookmarks`)
- 저장한 공고 카드 목록
- 북마크 해제 기능
- 공고가 없을 때 빈 상태(Empty State) 표시

### 5. 공고 입력 가이드 페이지 (`/guide`)
- Notion DB 접근 방법 안내
- 각 필드별 작성 요령 및 예시
- 기술스택 태그 표준 목록

---

## MVP 범위

최초 배포 시 포함할 기능:

- [ ] Notion API 연동 및 채용공고 목록 조회
- [ ] 직무 유형 / 기술스택 / 상태 필터
- [ ] 공고 상세 페이지 (Notion rich text 렌더링)
- [ ] 기본 반응형 UI (모바일 대응)
- [ ] 북마크 기능 (로컬스토리지 퍼시스트)

MVP 이후 추가:

- [ ] 기술스택 통계/분석 페이지
- [ ] 키워드 검색
- [ ] 공고 입력 가이드 페이지
- [ ] 마감일 기준 자동 상태 업데이트

---

## 구현 단계

### 1단계: Notion 연동 기반 구축
- Notion Integration 생성 및 API 키 발급
- 채용공고 DB 생성 및 필드 설정
- `@notionhq/client` 설치 및 환경변수 설정 (`.env.local`)
- Notion API 호출 유틸 레이어 작성 (`src/lib/notion.ts`)
- 응답 데이터 타입 정의 (`src/types/job.ts`)

### 2단계: 공고 목록 페이지
- Notion DB 전체 조회 API Route 구현 (`/api/jobs`)
- TanStack Query로 데이터 페칭 및 캐싱
- 공고 카드 컴포넌트 (`JobCard`)
- 목록 그리드 레이아웃 구현

### 3단계: 필터링 기능
- 필터 사이드바 컴포넌트 (`FilterSidebar`)
- URL 쿼리 파라미터 기반 필터 상태 관리
- Notion API 필터 조건 연동

### 4단계: 공고 상세 페이지
- Notion 페이지 상세 조회 API Route (`/api/jobs/[id]`)
- Notion rich text 렌더러 컴포넌트
- 상세 페이지 레이아웃 구현

### 5단계: 북마크 및 통계
- Zustand + persist 미들웨어로 북마크 스토어 구현
- 북마크 페이지 구현
- Recharts 기반 통계 페이지 구현

### 6단계: 배포
- Vercel 환경변수 설정
- 프로덕션 배포 및 도메인 연결

---

## 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| 성능 | 목록 페이지 초기 로딩 2초 이내 (TanStack Query 캐싱 활용) |
| 반응형 | 모바일(375px) ~ 데스크탑(1440px) 대응 |
| 접근성 | 키보드 탐색 가능, ARIA 레이블 적용 |
| SEO | 공고 상세 페이지 메타태그 (`generateMetadata`) 적용 |
| Notion API 한도 | 요청당 100건 제한 고려, 페이지네이션 처리 |

---

## 환경변수

```env
NOTION_API_KEY=secret_xxxx          # Notion Integration API 키
NOTION_DATABASE_ID=xxxx             # 채용공고 DB ID
```
