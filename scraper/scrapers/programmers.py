"""프로그래머스 커리어 내부 JSON API 스크래퍼 (비공식)"""
import time

import requests

from config import DEFAULT_HEADERS
from scrapers.base import BaseScraper
from utils.tech_extractor import extract_tech_stack
from utils.job_classifier import classify_job_type

LIST_URL = "https://career.programmers.co.kr/api/job_positions"

# 인프라/DevOps 관련 태그 목록
SEARCH_TAGS = [
    "DevOps",
    "SRE",
    "클라우드",
    "인프라",
    "MLOps",
    "플랫폼",
]

HEADERS = {
    **DEFAULT_HEADERS,
    "Referer": "https://career.programmers.co.kr/",
    "Accept": "application/json",
}


class ProgrammersScraper(BaseScraper):
    """프로그래머스 커리어 내부 JSON API를 통해 채용공고를 수집한다."""

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
        """특정 태그로 프로그래머스 공고 목록 수집 (페이지네이션)"""
        results: list[dict] = []
        page = 1

        while True:
            params = {
                "page": page,
                "order": "recent",
                "search": tag,
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
                print(f"  [프로그래머스] 요청 오류 ({tag}): {e}")
                break

            items = data.get("jobPositions", data.get("data", []))
            if not items:
                break

            for item in items:
                job = self._parse_item(item)
                if job:
                    results.append(job)

            # 마지막 페이지 확인
            total_pages = data.get("totalCount", 0) // 20 + 1
            if page >= total_pages:
                break

            page += 1
            time.sleep(0.5)

        return results

    def _parse_item(self, item: dict) -> dict | None:
        """프로그래머스 공고 아이템을 Job dict로 변환"""
        position_id = item.get("id")
        title = item.get("title", "").strip()
        company = (item.get("company") or {}).get("name", "").strip()
        job_url = (
            f"https://career.programmers.co.kr/job_positions/{position_id}"
            if position_id
            else None
        )

        if not title or not job_url:
            return None

        # 플랫폼 제공 기술스택 태그
        platform_tags = [t.get("name", "") for t in item.get("technicalTags", [])]

        # 경력 요건
        experience_level = self._map_experience(item.get("careerRange", ""))

        # 마감일
        deadline_raw = item.get("closedAt", "")
        deadline = deadline_raw[:10] if deadline_raw and len(deadline_raw) >= 10 else None

        full_text = title + " " + item.get("summary", "") + " " + " ".join(platform_tags)

        return {
            "title": title,
            "company": company,
            "job_url": job_url,
            "_id": position_id,
            "job_types": classify_job_type(title, full_text),
            "employment_type": "정규직",
            "experience_level": experience_level,
            "tech_stack": extract_tech_stack(full_text, platform_tags),
            "requirements": item.get("requiredExperienceDescription", ""),
            "preferred": item.get("preferredExperienceDescription", ""),
            "responsibilities": item.get("jobDescription", ""),
            "deadline": deadline,
        }

    @staticmethod
    def _map_experience(raw: str) -> str | None:
        """프로그래머스 경력 범위를 Job 타입으로 변환"""
        if not raw:
            return "무관"
        if "신입" in raw:
            return "신입"
        try:
            nums = [int(n) for n in raw.split("~") if n.strip().isdigit()]
            if nums:
                min_year = min(nums)
                if min_year >= 5:
                    return "5년 이상"
                if min_year >= 3:
                    return "3년 이상"
                if min_year >= 1:
                    return "1년 이상"
        except Exception:
            pass
        return "무관"
