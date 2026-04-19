"""Notion DB에 채용공고를 저장하는 모듈 (쓰기 + 중복 방지)"""
import time
from datetime import date, datetime, timedelta

from notion_client import Client

from config import NOTION_API_KEY, NOTION_DATABASE_ID


def _get_client() -> Client:
    """Notion 클라이언트 생성"""
    return Client(auth=NOTION_API_KEY)


def _chunk_text(text: str, size: int = 2000) -> list[str]:
    """Notion Rich Text 2000자 제한 대응: 텍스트를 청크로 분할"""
    return [text[i : i + size] for i in range(0, len(text), size)] if text else [""]


def _rich_text_blocks(text: str) -> list[dict]:
    """문자열을 Notion Rich Text 블록 배열로 변환 (2000자 청크 분할)"""
    return [
        {"type": "text", "text": {"content": chunk}}
        for chunk in _chunk_text(text)
    ]


def _build_properties(job: dict) -> dict:
    """
    Job dict를 Notion 페이지 properties 형식으로 변환.
    src/types/job.ts의 Job 인터페이스와 docs/PRD.md의 Notion 필드명 기준.
    """
    today = date.today().isoformat()

    props: dict = {
        # 공고명 (Title)
        "공고명": {
            "title": [{"type": "text", "text": {"content": job.get("title", "")[:2000]}}]
        },
        # 회사명 (Rich Text)
        "회사명": {
            "rich_text": [{"type": "text", "text": {"content": job.get("company", "")[:2000]}}]
        },
        # 수집일 (Date)
        "수집일": {"date": {"start": today}},
        # 상태 (Select) - 신규 수집 공고는 항상 "진행중"
        "상태": {"select": {"name": "진행중"}},
    }

    # 직무 유형 (Multi-select)
    job_types = job.get("job_types") or []
    if job_types:
        props["직무 유형"] = {
            "multi_select": [{"name": t} for t in job_types]
        }

    # 고용 형태 (Select)
    employment_type = job.get("employment_type")
    if employment_type:
        props["고용 형태"] = {"select": {"name": employment_type}}

    # 경력 요건 (Select)
    experience_level = job.get("experience_level")
    if experience_level:
        props["경력 요건"] = {"select": {"name": experience_level}}

    # 기술스택 (Multi-select)
    tech_stack = job.get("tech_stack") or []
    if tech_stack:
        props["기술스택"] = {
            "multi_select": [{"name": t} for t in tech_stack]
        }

    # 공고 URL (URL)
    job_url = job.get("job_url")
    if job_url:
        props["공고 URL"] = {"url": job_url}

    # 마감일 (Date)
    deadline = job.get("deadline")
    if deadline:
        props["마감일"] = {"date": {"start": deadline}}

    # 자격요건 (Rich Text, 2000자 청크)
    requirements = job.get("requirements", "")
    if requirements:
        props["자격요건"] = {"rich_text": _rich_text_blocks(requirements)}

    # 우대사항 (Rich Text)
    preferred = job.get("preferred", "")
    if preferred:
        props["우대사항"] = {"rich_text": _rich_text_blocks(preferred)}

    # 담당업무 (Rich Text)
    responsibilities = job.get("responsibilities", "")
    if responsibilities:
        props["담당업무"] = {"rich_text": _rich_text_blocks(responsibilities)}

    return props


def get_existing_urls(days: int = 60) -> set[str]:
    """
    Notion DB에서 최근 N일간 수집된 공고 URL 목록을 조회한다.
    중복 방지를 위한 기준값으로 사용.

    Args:
        days: 조회 기준 일수 (기본 60일)

    Returns:
        기존 공고 URL의 set
    """
    client = _get_client()
    since = (datetime.now() - timedelta(days=days)).date().isoformat()

    existing_urls: set[str] = set()
    cursor: str | None = None

    while True:
        body: dict = {
            "filter": {
                "property": "수집일",
                "date": {"on_or_after": since},
            },
            "page_size": 100,
        }
        if cursor:
            body["start_cursor"] = cursor

        response = client.request(
            path=f"databases/{NOTION_DATABASE_ID}/query",
            method="post",
            body=body,
        )

        for page in response.get("results", []):
            props = page.get("properties", {})
            url_prop = props.get("공고 URL", {})
            url = url_prop.get("url")
            if url:
                existing_urls.add(url)

        if not response.get("has_more"):
            break
        cursor = response.get("next_cursor")

    return existing_urls


def create_job_page(job: dict) -> str:
    """
    Notion DB에 채용공고 페이지를 생성한다.

    Args:
        job: BaseScraper.scrape()가 반환하는 Job dict

    Returns:
        생성된 Notion 페이지 ID
    """
    client = _get_client()
    response = client.pages.create(
        parent={"database_id": NOTION_DATABASE_ID},
        properties=_build_properties(job),
    )
    return response["id"]


def save_jobs(jobs: list[dict], dry_run: bool = False) -> tuple[int, int]:
    """
    수집된 공고 목록을 Notion DB에 저장한다.
    중복 공고(동일 URL)는 건너뛴다.

    Args:
        jobs: 수집된 Job dict 목록
        dry_run: True이면 Notion에 쓰지 않고 결과만 출력

    Returns:
        (저장된 수, 건너뛴 수) 튜플
    """
    # 인프라 직군으로 분류된 공고만 처리 (job_types가 비어있으면 비인프라 공고)
    infra_jobs = [j for j in jobs if j.get("job_types")]
    filtered_out = len(jobs) - len(infra_jobs)
    if filtered_out:
        print(f"  [필터] 비인프라 직군 공고 {filtered_out}개 제외")

    if dry_run:
        print(f"[dry-run] 인프라 공고 {len(infra_jobs)}개 (전체 {len(jobs)}개 중, Notion 미저장)")
        for job in infra_jobs:
            print(f"  - [{job.get('company', '?')}] {job.get('title', '?')} | {job.get('job_url', '')}")
        return len(infra_jobs), 0

    # 기존 URL 조회 (중복 방지)
    existing_urls = get_existing_urls()
    saved, skipped = 0, 0

    for job in infra_jobs:
        url = job.get("job_url", "")
        if url and url in existing_urls:
            skipped += 1
            continue

        try:
            create_job_page(job)
            if url:
                existing_urls.add(url)
            saved += 1
            # Notion API Rate Limit 준수 (초당 3회)
            time.sleep(0.4)
        except Exception as e:
            print(f"  [오류] 저장 실패: {job.get('title', '?')} — {e}")

    return saved, skipped
