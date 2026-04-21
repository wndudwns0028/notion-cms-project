import { Client, isFullPage } from '@notionhq/client';
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints/common';
import type {
  Job,
  JobType,
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  RichTextItem,
  JobsResponse,
  TechStackStat,
  JobTypeStat,
} from '@/types/job';

/**
 * Notion 클라이언트 싱글턴
 * API 키가 없거나 더미값이면 null 반환 (빌드 시 오류 방지)
 */
function createNotionClient(): Client | null {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey || apiKey === 'secret_xxxx') {
    return null;
  }
  return new Client({ auth: apiKey });
}

const notion = createNotionClient();

/**
 * Notion DB ID 가져오기
 */
function getDatabaseId(): string {
  const dbId = process.env.NOTION_DATABASE_ID;
  if (!dbId || dbId === 'xxxx') {
    throw new Error('NOTION_DATABASE_ID 환경변수가 설정되지 않았습니다.');
  }
  return dbId;
}

// ─── 프로퍼티 값 타입 (Notion v5 내부 타입) ────────────────────────────────

/** Rich Text 아이템 응답 타입 */
interface RichTextItemResponse {
  type: string;
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
}

/** 프로퍼티 값 기본 타입 (타입 가드용) */
type NotionPropValue = Record<string, unknown>;

// ─── 프로퍼티 추출 헬퍼 ─────────────────────────────────────────────────────

/** Title 프로퍼티에서 텍스트 추출 */
function extractTitle(prop: NotionPropValue): string {
  if (prop.type !== 'title') return '';
  const items = prop.title as RichTextItemResponse[];
  return (Array.isArray(items) ? items : []).map((t) => t.plain_text).join('');
}

/** Rich Text 프로퍼티에서 RichTextItem 배열 추출 */
function extractRichText(prop: NotionPropValue): RichTextItem[] {
  if (prop.type !== 'rich_text') return [];
  const items = prop.rich_text as RichTextItemResponse[];
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    type: item.type as 'text' | 'mention' | 'equation',
    plain_text: item.plain_text,
    href: item.href,
    annotations: {
      bold: item.annotations.bold,
      italic: item.annotations.italic,
      strikethrough: item.annotations.strikethrough,
      underline: item.annotations.underline,
      code: item.annotations.code,
      color: item.annotations.color,
    },
  }));
}

/** Select 프로퍼티에서 값 추출 */
function extractSelect(prop: NotionPropValue): string | null {
  if (prop.type !== 'select') return null;
  const select = prop.select as { name?: string } | null;
  return select?.name ?? null;
}

/** Multi-select 프로퍼티에서 이름 배열 추출 */
function extractMultiSelect(prop: NotionPropValue): string[] {
  if (prop.type !== 'multi_select') return [];
  const items = prop.multi_select as Array<{ name: string }>;
  return Array.isArray(items) ? items.map((s) => s.name) : [];
}

/** URL 프로퍼티에서 값 추출 */
function extractUrl(prop: NotionPropValue): string | null {
  if (prop.type !== 'url') return null;
  return (prop.url as string | null) ?? null;
}

/** Date 프로퍼티에서 시작 날짜 추출 */
function extractDate(prop: NotionPropValue): string | null {
  if (prop.type !== 'date') return null;
  const date = prop.date as { start?: string } | null;
  return date?.start ?? null;
}

// ─── 페이지 → Job 변환 ───────────────────────────────────────────────────────

/**
 * Notion 페이지 응답을 Job 타입으로 변환
 */
function mapPageToJob(page: PageObjectResponse): Job {
  // PageObjectResponse.properties는 Record<string, PagePropertyValueWithIdResponse>
  // 내부 타입이 export되지 않으므로 unknown 경유 캐스팅
  const props = page.properties as Record<string, NotionPropValue>;

  const title = props['공고'] ? extractTitle(props['공고']) : '';
  const company = props['회사명'] ? extractRichText(props['회사명']).map((r) => r.plain_text).join('') : '';
  const jobTypes = props['직무 유형'] ? (extractMultiSelect(props['직무 유형']) as JobType[]) : [];
  const employmentType = props['고용 형태'] ? (extractSelect(props['고용 형태']) as EmploymentType | null) : null;
  const experienceLevel = props['경력 요건'] ? (extractSelect(props['경력 요건']) as ExperienceLevel | null) : null;
  const requirements = props['자격요건'] ? extractRichText(props['자격요건']) : [];
  const preferredQualifications = props['우대사항'] ? extractRichText(props['우대사항']) : [];
  const responsibilities = props['담당업무'] ? extractRichText(props['담당업무']) : [];
  const techStack = props['기술스택'] ? extractMultiSelect(props['기술스택']) : [];
  const jobUrl = props['공고 URL'] ? extractUrl(props['공고 URL']) : null;
  const deadline = props['마감일'] ? extractDate(props['마감일']) : null;
  const collectedAt = props['수집일'] ? extractDate(props['수집일']) : null;
  const status = props['상태'] ? (extractSelect(props['상태']) as JobStatus | null) : null;
  const platform = props['플랫폼'] ? extractSelect(props['플랫폼']) : null;
  const memo = props['메모'] ? extractRichText(props['메모']) : [];

  return {
    id: page.id,
    title,
    company,
    jobTypes,
    employmentType,
    experienceLevel,
    requirements,
    preferredQualifications,
    responsibilities,
    techStack,
    jobUrl,
    deadline,
    collectedAt,
    status,
    platform,
    memo,
  };
}

// ─── Notion DB 쿼리 (v5 호환) ────────────────────────────────────────────────

/**
 * Notion v5에서 DB 쿼리는 `client.request`를 통해 직접 HTTP 요청으로 처리
 */
interface DatabaseQueryResponse {
  results: Array<PageObjectResponse | PartialPageObjectResponse>;
  next_cursor: string | null;
  has_more: boolean;
}

async function queryDatabase(
  databaseId: string,
  options: {
    start_cursor?: string;
    page_size?: number;
    sorts?: Array<{ property: string; direction: 'ascending' | 'descending' }>;
  } = {}
): Promise<DatabaseQueryResponse> {
  if (!notion) {
    return { results: [], next_cursor: null, has_more: false };
  }

  return notion.request<DatabaseQueryResponse>({
    path: `data_sources/${databaseId}/query`,
    method: 'post',
    body: {
      ...(options.start_cursor && { start_cursor: options.start_cursor }),
      ...(options.page_size && { page_size: options.page_size }),
      ...(options.sorts && { sorts: options.sorts }),
    },
  });
}

// ─── 공개 API 함수 ───────────────────────────────────────────────────────────

/**
 * 채용공고 목록을 Notion DB에서 가져오기
 */
export async function getJobs(cursor?: string): Promise<JobsResponse> {
  if (!notion) {
    return { jobs: [], nextCursor: null, hasMore: false };
  }

  const databaseId = getDatabaseId();
  const response = await queryDatabase(databaseId, {
    start_cursor: cursor,
    page_size: 20,
  });

  const jobs = response.results
    .filter((page): page is PageObjectResponse => isFullPage(page))
    .map(mapPageToJob);

  return {
    jobs,
    nextCursor: response.next_cursor,
    hasMore: response.has_more,
  };
}

/**
 * 특정 채용공고를 Notion에서 가져오기
 */
export async function getJobById(id: string): Promise<Job | null> {
  if (!notion) {
    return null;
  }

  try {
    const page = await notion.pages.retrieve({ page_id: id });
    if (!isFullPage(page)) {
      return null;
    }
    return mapPageToJob(page);
  } catch {
    return null;
  }
}

/**
 * 기술스택 통계를 계산하여 반환
 */
export async function getTechStackStats(): Promise<TechStackStat[]> {
  if (!notion) {
    return [];
  }

  const databaseId = getDatabaseId();
  const allJobs: Job[] = [];
  let cursor: string | undefined;

  // 전체 공고를 페이지네이션으로 수집
  do {
    const response = await queryDatabase(databaseId, {
      start_cursor: cursor,
      page_size: 100,
    });

    const jobs = response.results
      .filter((page): page is PageObjectResponse => isFullPage(page))
      .map(mapPageToJob);

    allJobs.push(...jobs);
    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  // 기술스택 빈도 집계
  const countMap = new Map<string, number>();
  for (const job of allJobs) {
    for (const tech of job.techStack) {
      countMap.set(tech, (countMap.get(tech) ?? 0) + 1);
    }
  }

  return Array.from(countMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 직무 유형별 통계를 계산하여 반환
 */
export async function getJobTypeStats(): Promise<JobTypeStat[]> {
  if (!notion) {
    return [];
  }

  const databaseId = getDatabaseId();
  const allJobs: Job[] = [];
  let cursor: string | undefined;

  do {
    const response = await queryDatabase(databaseId, {
      start_cursor: cursor,
      page_size: 100,
    });

    const jobs = response.results
      .filter((page): page is PageObjectResponse => isFullPage(page))
      .map(mapPageToJob);

    allJobs.push(...jobs);
    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  // 직무 유형 빈도 집계
  const countMap = new Map<string, number>();
  for (const job of allJobs) {
    for (const jobType of job.jobTypes) {
      countMap.set(jobType, (countMap.get(jobType) ?? 0) + 1);
    }
  }

  return Array.from(countMap.entries())
    .map(([name, count]) => ({ name: name as JobType, count }))
    .sort((a, b) => b.count - a.count);
}
