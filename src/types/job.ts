/**
 * Notion DB의 Rich Text 아이템 타입
 */
export interface RichTextItem {
  type: 'text' | 'mention' | 'equation';
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

/**
 * 직무 유형
 */
export type JobType =
  | 'SRE'
  | 'Cloud'
  | 'MLOps'
  | 'Platform'
  | 'DevOps'
  | 'Infrastructure'
  | 'System';

/**
 * 고용 형태
 */
export type EmploymentType = '정규직' | '계약직' | '인턴';

/**
 * 경력 요건
 */
export type ExperienceLevel = '신입' | '1년 이상' | '3년 이상' | '5년 이상' | '무관';

/**
 * 공고 상태
 */
export type JobStatus = '진행중' | '마감' | '검토중';

/**
 * Notion DB에서 가져온 채용공고 데이터 타입
 */
export interface Job {
  /** Notion 페이지 ID */
  id: string;
  /** 공고명 (Title) */
  title: string;
  /** 회사명 (Text) */
  company: string;
  /** 직무 유형 (Multi-select) */
  jobTypes: JobType[];
  /** 고용 형태 (Select) */
  employmentType: EmploymentType | null;
  /** 경력 요건 (Select) */
  experienceLevel: ExperienceLevel | null;
  /** 자격요건 (Rich Text) */
  requirements: RichTextItem[];
  /** 우대사항 (Rich Text) */
  preferredQualifications: RichTextItem[];
  /** 담당업무 (Rich Text) */
  responsibilities: RichTextItem[];
  /** 기술스택 (Multi-select) */
  techStack: string[];
  /** 공고 URL (URL) */
  jobUrl: string | null;
  /** 마감일 (Date) */
  deadline: string | null;
  /** 수집일 (Date) */
  collectedAt: string | null;
  /** 상태 (Select) */
  status: JobStatus | null;
  /** 메모 (Rich Text) */
  memo: RichTextItem[];
}

/**
 * 공고 목록 API 응답 타입
 */
export interface JobsResponse {
  jobs: Job[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * 공고 필터 옵션
 */
export interface JobFilter {
  jobTypes?: JobType[];
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  status?: JobStatus;
  techStack?: string[];
  search?: string;
}

/**
 * 기술스택 통계 데이터
 */
export interface TechStackStat {
  name: string;
  count: number;
}

/**
 * 직무 유형별 통계 데이터
 */
export interface JobTypeStat {
  name: JobType;
  count: number;
}
