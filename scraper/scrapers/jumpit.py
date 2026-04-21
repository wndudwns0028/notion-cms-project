"""점핏(Jumpit) 내부 JSON API 스크래퍼 (비공식, 사람인 계열)"""
import time

import requests

from config import DEFAULT_HEADERS
from scrapers.base import BaseScraper
from utils.tech_extractor import extract_tech_stack
from utils.job_classifier import classify_job_type

LIST_URL = "https://api.jumpit.co.kr/api/positions"

# 인프라/DevOps 관련 검색 키워드
SEARCH_TAGS = [
    "DevOps",
    "클라우드",
    "SRE",
    "인프라",
    "MLOps",
    "플랫폼 엔지니어",
    "시스템 엔지니어",
]

HEADERS = {
    **DEFAULT_HEADERS,
    "Referer": "https://www.jumpit.co.kr/",
    "Accept": "application/json",
}

EXPERIENCE_MAP = {
    "신입": "신입",
    "1년 이상": "1년 이상",
    "3년 이상": "3년 이상",
    "5년 이상": "5년 이상",
    "무관": "무관",
}


class JumpitScraper(BaseScraper):
    """점핏 내부 JSON API를 통해 채용공고를 수집한다."""

    def scrape(self) -> list[dict]:
        jobs: list[dict] = []
        seen_ids: set[int] = set()

        for tag in SEARCH_TAGS:
            fetched = self._fetch_tag(tag)
            for job in fetched:
                job_id = job.get("_id")
                if job_id and job_id not in seen_ids:
                    seen_ids.add(job_id)
                    jobs.append(job)
            time.sleep(0.5)

        return jobs

    def _fetch_tag(self, tag: str) -> list[dict]:
        """특정 태그로 점핏 공고 목록 수집 (최대 5페이지)"""
        results: list[dict] = []
        page = 1
        max_pages = 5

        while page <= max_pages:
            params = {
                "keyword": tag,
                "page": page,
                "pageSize": 20,
            }

            try:
                resp = requests.get(
                    LIST_URL,
                    params=params,
                    headers=HEADERS,
                    timeout=10,
                )
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                print(f"  [점핏] 요청 오류 ({tag}): {e}")
                break

            positions = data.get("result", {}).get("positions", [])
            if not positions:
                break

            for item in positions:
                job = self._parse_item(item)
                if job:
                    results.append(job)

            total_count = data.get("result", {}).get("totalCount", 0)
            if page * 20 >= total_count or not positions:
                break

            page += 1
            time.sleep(0.5)

        return results

    def _parse_item(self, item: dict) -> dict | None:
        """점핏 공고 아이템을 Job dict로 변환"""
        position_id = item.get("id")
        title = item.get("title", "").strip()
        company = item.get("companyName", "").strip()
        job_url = f"https://www.jumpit.co.kr/position/{position_id}" if position_id else None

        if not title or not job_url:
            return None

        # 제목 기반 인프라 직군 1차 필터링
        if not classify_job_type(title):
            return None

        # 플랫폼 제공 태그 (기술스택) — 문자열 배열로 변경됨
        tech_stacks = item.get("techStacks", [])
        platform_tags = [t if isinstance(t, str) else t.get("name", "") for t in tech_stacks]

        # 경력 요건 파싱 (minCareer가 숫자 또는 문자열)
        experience_raw = item.get("minCareer", "")
        experience_level = self._map_experience(str(experience_raw) if experience_raw is not None else "")

        # 마감일 파싱 (alwaysOpen이면 None)
        deadline = None
        if not item.get("alwaysOpen"):
            closed_at = item.get("closedAt", "")
            if closed_at and len(closed_at) >= 10:
                deadline = closed_at[:10]

        full_text = title + " " + " ".join(platform_tags)

        return {
            "title": title,
            "company": company,
            "job_url": job_url,
            "_id": position_id,
            "source": "점핏",
            "job_types": classify_job_type(title, full_text),
            "employment_type": "정규직",
            "experience_level": experience_level,
            "tech_stack": extract_tech_stack(full_text, platform_tags),
            "requirements": item.get("requirements", ""),
            "preferred": item.get("preferredRequirements", ""),
            "responsibilities": item.get("responsibilities", ""),
            "deadline": deadline,
        }

    @staticmethod
    def _map_experience(raw: str) -> str | None:
        """점핏 경력 정보를 Job 타입으로 변환"""
        if not raw:
            return "무관"
        raw = raw.strip()
        if "신입" in raw:
            return "신입"
        try:
            years = int("".join(filter(str.isdigit, raw)))
            if years >= 5:
                return "5년 이상"
            if years >= 3:
                return "3년 이상"
            if years >= 1:
                return "1년 이상"
        except ValueError:
            pass
        return "무관"
