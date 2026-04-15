import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '입력 가이드',
};

/**
 * Notion 필드 정보 타입
 */
interface FieldGuide {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: string;
}

/** Notion DB 필드 가이드 데이터 */
const fieldGuides: FieldGuide[] = [
  {
    name: '공고명',
    type: 'Title',
    required: true,
    description: '채용공고 제목을 그대로 입력합니다.',
    example: 'SRE Engineer (Site Reliability Engineer)',
  },
  {
    name: '회사명',
    type: 'Text',
    required: true,
    description: '채용 회사 이름을 입력합니다.',
    example: 'Kakao, Naver, Toss, Line',
  },
  {
    name: '직무 유형',
    type: 'Multi-select',
    required: true,
    description: '해당하는 직무 유형을 모두 선택합니다.',
    example: 'SRE, Cloud, MLOps, Platform, DevOps, Infrastructure, System',
  },
  {
    name: '고용 형태',
    type: 'Select',
    required: false,
    description: '고용 형태를 선택합니다.',
    example: '정규직, 계약직, 인턴',
  },
  {
    name: '경력 요건',
    type: 'Select',
    required: false,
    description: '요구하는 경력 수준을 선택합니다.',
    example: '신입, 1년 이상, 3년 이상, 5년 이상, 무관',
  },
  {
    name: '자격요건',
    type: 'Rich Text',
    required: false,
    description: '공고의 자격요건을 항목별로 줄바꿈하여 입력합니다.',
    example: 'Linux 시스템 운영 경험\nKubernetes 운영 경험',
  },
  {
    name: '우대사항',
    type: 'Rich Text',
    required: false,
    description: '우대사항을 항목별로 줄바꿈하여 입력합니다.',
    example: 'AWS/GCP 자격증 보유자\nIstio 경험자',
  },
  {
    name: '담당업무',
    type: 'Rich Text',
    required: false,
    description: '담당 업무를 항목별로 줄바꿈하여 입력합니다.',
    example: '서비스 안정성 모니터링 및 장애 대응\nSLI/SLO 설계 및 운영',
  },
  {
    name: '기술스택',
    type: 'Multi-select',
    required: false,
    description: '공고에 명시된 기술스택을 선택합니다. 없으면 직접 추가합니다.',
    example: 'Kubernetes, Terraform, Prometheus, Grafana, AWS',
  },
  {
    name: '공고 URL',
    type: 'URL',
    required: false,
    description: '원본 채용공고 링크를 붙여넣습니다.',
    example: 'https://www.wanted.co.kr/wd/12345',
  },
  {
    name: '마감일',
    type: 'Date',
    required: false,
    description: '공고 마감일을 입력합니다. 상시 채용이면 비워둡니다.',
    example: '2025-06-30',
  },
  {
    name: '수집일',
    type: 'Date',
    required: false,
    description: '공고를 수집한 날짜를 입력합니다.',
    example: '2025-04-14',
  },
  {
    name: '상태',
    type: 'Select',
    required: false,
    description: '공고 진행 상태를 선택합니다.',
    example: '진행중, 검토중, 마감',
  },
  {
    name: '메모',
    type: 'Rich Text',
    required: false,
    description: '해당 공고에 대한 개인 메모를 자유롭게 작성합니다.',
    example: '기술 면접 일정: 4/20\n처우 협의 필요',
  },
];

/**
 * Notion 공고 입력 가이드 페이지 (/guide)
 */
export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Notion 공고 입력 가이드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Notion 데이터베이스에 채용공고를 올바르게 입력하는 방법을 안내합니다.
          </p>
        </div>

        {/* 시작하기 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>시작하기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="list-decimal space-y-2 pl-4">
              <li>
                <strong>.env.local</strong> 파일에{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  NOTION_API_KEY
                </code>
                와{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  NOTION_DATABASE_ID
                </code>
                를 설정합니다.
              </li>
              <li>
                Notion 인테그레이션에서 API 키를 발급받고 대상 DB에 인테그레이션 연결 권한을
                부여합니다.
              </li>
              <li>아래 필드 가이드를 참고하여 공고 정보를 입력합니다.</li>
              <li>저장 후 홈 화면에서 공고를 확인합니다.</li>
            </ol>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* 필드 가이드 */}
        <h2 className="mb-4 text-lg font-semibold">필드별 입력 가이드</h2>
        <div className="space-y-4">
          {fieldGuides.map((field) => (
            <Card key={field.name}>
              <CardContent className="pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium">{field.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {field.type}
                  </Badge>
                  {field.required && (
                    <Badge variant="default" className="text-xs">
                      필수
                    </Badge>
                  )}
                </div>
                <p className="mb-2 text-sm text-muted-foreground">{field.description}</p>
                <div className="rounded-md bg-muted px-3 py-2">
                  <p className="font-mono text-xs text-muted-foreground">예시: {field.example}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
