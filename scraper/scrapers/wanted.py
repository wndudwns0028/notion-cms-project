"""원티드 내부 JSON API 스크래퍼 (비공식)"""
import time

import requests

from config import DEFAULT_HEADERS
from scrapers.base import BaseScraper
from utils.tech_extractor import extract_tech_stack
from utils.job_classifier import classify_job_type

# 원티드 내부 API 엔드포인트
LIST_URL = "https://www.wanted.co.kr/api/v4/jobs"
DETAIL_URL = "https://www.wanted.co.kr/api/v4/jobs/{job_id}"

# 인프라 직군 job_group_id 목록
# 215: 데브옵스·시스템·네트워크·보안 / 1024: AI·ML·데이터
JOB_GROUP_IDS = [215]

HEADERS = {
    **DEFAULT_HEADERS,
    "Referer": "https://www.wanted.co.kr/",
    "Accept": "application/json, text/plain, */*",
    "wanted-user-language": "ko",
    "wanted-user-country": "KR",
}


class WantedScraper(BaseScraper):
    """원티드 내부 JSON API를 통해 채용공고를 수집한다."""

    def scrape(self) -> list[dict]:
        jobs: list[dict] = []
        seen_ids: set[int] = set()

        for group_id in JOB_GROUP_IDS:
            fetched = self._fetch_group(group_id)
            for job in fetched:
                job_id = job.get("_id")
                if job_id and job_id not in seen_ids:
                    seen_ids.add(job_id)
                    jobs.append(job)

        return jobs

    def _fetch_group(self, job_group_id: int) -> list[dict]:
        """특정 직군 ID의 공고 목록을 페이지네이션으로 수집"""
        results: list[dict] = []
        offset = 0
        limit = 20

        while True:
            params = {
                "country": "kr",
                "job_group_id": job_group_id,
                "offset": offset,
                "limit": limit,
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
                print(f"  [원티드] 목록 요청 오류: {e}")
                break

            job_list = data.get("data", {}).get("jobs", [])
            if not job_list:
                break

            for item in job_list:
                job = self._parse_list_item(item)
                if job:
                    results.append(job)
                time.sleep(0.3)  # 상세 요청 딜레이

            # 마지막 페이지 확인
            links = data.get("links", {})
            if not links.get("next_href"):
                break

            offset += limit
            time.sleep(0.7)

        return results

    def _parse_list_item(self, item: dict) -> dict | None:
        """목록 아이템에서 기본 정보 + 상세 API 호출로 전체 정보 수집"""
        job_id = item.get("id")
        title = item.get("position", "")
        company = item.get("company", {}).get("name", "")
        job_url = f"https://www.wanted.co.kr/wd/{job_id}" if job_id else None

        if not title or not job_url:
            return None

        # 상세 API 호출로 자격요건, 담당업무, 우대사항 수집
        detail = self._fetch_detail(job_id)
        requirements = detail.get("requirements", "")
        preferred = detail.get("preferred", "")
        responsibilities = detail.get("responsibilities", "")

        # 플랫폼 제공 태그
        platform_tags = [tag.get("title", "") for tag in item.get("tags", [])]

        full_text = " ".join([title, requirements, preferred, responsibilities])

        return {
            "title": title,
            "company": company,
            "job_url": job_url,
            "_id": job_id,
            "job_types": classify_job_type(title, full_text),
            "employment_type": "정규직",  # 원티드 기본값
            "experience_level": self._map_experience(item.get("experience_level", {})),
            "tech_stack": extract_tech_stack(full_text, platform_tags),
            "requirements": requirements,
            "preferred": preferred,
            "responsibilities": responsibilities,
            "deadline": None,  # 원티드는 마감일 정보 별도 제공 안 함
        }

    def _fetch_detail(self, job_id: int) -> dict:
        """원티드 공고 상세 API 호출"""
        try:
            resp = requests.get(
                DETAIL_URL.format(job_id=job_id),
                headers=HEADERS,
                timeout=10,
            )
            resp.raise_for_status()
            detail = resp.json().get("job", {})
            return {
                "requirements": detail.get("requirements", ""),
                "preferred": detail.get("preferred_requirements", ""),
                "responsibilities": detail.get("main_tasks", ""),
            }
        except Exception:
            return {"requirements": "", "preferred": "", "responsibilities": ""}

    @staticmethod
    def _map_experience(exp: dict) -> str | None:
        """원티드 경력 정보를 Job 타입으로 변환"""
        code = exp.get("code", "")
        if code == "newcomer":
            return "신입"
        if code == "experienced":
            min_year = exp.get("min", 0)
            if min_year >= 5:
                return "5년 이상"
            if min_year >= 3:
                return "3년 이상"
            return "1년 이상"
        return "무관"
