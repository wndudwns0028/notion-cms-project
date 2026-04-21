"""사람인 공식 오픈 API 스크래퍼"""
import time
from lxml import etree

import requests

from config import DEFAULT_HEADERS, SARAMIN_API_KEY
from scrapers.base import BaseScraper
from utils.tech_extractor import extract_tech_stack
from utils.job_classifier import classify_job_type

# 사람인 API에서 검색할 키워드 목록
SEARCH_KEYWORDS = [
    "SRE",
    "DevOps",
    "Cloud Engineer",
    "MLOps",
    "인프라 엔지니어",
    "플랫폼 엔지니어",
    "시스템 엔지니어",
]

API_URL = "https://oapi.saramin.co.kr/job-search"

# 경력 요건 매핑 (사람인 → Job 타입)
EXPERIENCE_MAP = {
    "신입": "신입",
    "경력": "1년 이상",
    "신입·경력": "신입",
    "경력무관": "무관",
}

# 고용 형태 매핑
EMPLOYMENT_MAP = {
    "정규직": "정규직",
    "계약직": "계약직",
    "인턴직": "인턴",
    "아르바이트": None,
}


class SaRAminScraper(BaseScraper):
    """사람인 공식 오픈 API를 통해 채용공고를 수집한다."""

    def __init__(self):
        if not SARAMIN_API_KEY:
            raise ValueError(
                "SARAMIN_API_KEY 환경변수가 설정되지 않았습니다.\n"
                "https://oapi.saramin.co.kr 에서 무료 API 키를 발급받으세요."
            )

    def scrape(self) -> list[dict]:
        jobs: list[dict] = []
        seen_urls: set[str] = set()

        for keyword in SEARCH_KEYWORDS:
            fetched = self._fetch_keyword(keyword)
            for job in fetched:
                url = job.get("job_url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    jobs.append(job)
            # 키워드 간 딜레이
            time.sleep(0.5)

        return jobs

    def _fetch_keyword(self, keyword: str) -> list[dict]:
        """특정 키워드로 사람인 API 조회 (페이지네이션 포함)"""
        results: list[dict] = []
        start = 0
        count = 100

        while True:
            params = {
                "access-key": SARAMIN_API_KEY,
                "keywords": keyword,
                "job_type": 1,  # 정규직
                "count": count,
                "start": start,
                "fields": "expiration-date,job-code,salary,company",
            }

            try:
                resp = requests.get(
                    API_URL,
                    params=params,
                    headers=DEFAULT_HEADERS,
                    timeout=10,
                )
                resp.raise_for_status()
            except requests.RequestException as e:
                print(f"  [사람인] 요청 오류 ({keyword}): {e}")
                break

            jobs = self._parse_xml(resp.content)
            results.extend(jobs)

            # 더 이상 데이터가 없으면 중단
            if len(jobs) < count:
                break
            start += count
            time.sleep(0.3)

        return results

    def _parse_xml(self, xml_bytes: bytes) -> list[dict]:
        """사람인 API XML 응답을 Job dict 목록으로 파싱"""
        jobs: list[dict] = []

        try:
            root = etree.fromstring(xml_bytes)
        except etree.XMLSyntaxError:
            return jobs

        for job_el in root.findall(".//job"):
            try:
                title = self._text(job_el, "position/title")
                company = self._text(job_el, "company/detail/name")
                job_url = self._text(job_el, "url")
                deadline_raw = self._text(job_el, "expiration-date")
                experience_raw = self._text(job_el, "position/experience-level/name")
                employment_raw = self._text(job_el, "position/job-type/name")
                description = self._text(job_el, "position/title") + " " + self._text(job_el, "position/job-code/name", "")

                if not title or not job_url:
                    continue

                # 경력 요건 정규화
                experience_level = EXPERIENCE_MAP.get(experience_raw)

                # 고용 형태 정규화
                employment_type = EMPLOYMENT_MAP.get(employment_raw)

                # 마감일 파싱 (YYYY-MM-DD 형식)
                deadline = self._parse_deadline(deadline_raw)

                jobs.append({
                    "title": title,
                    "company": company,
                    "job_url": job_url,
                    "source": "사람인",
                    "job_types": classify_job_type(title, description),
                    "employment_type": employment_type,
                    "experience_level": experience_level,
                    "tech_stack": extract_tech_stack(description),
                    "deadline": deadline,
                    "requirements": "",
                    "preferred": "",
                    "responsibilities": "",
                })
            except Exception:
                continue

        return jobs

    @staticmethod
    def _text(element, xpath: str, default: str = "") -> str:
        el = element.find(xpath)
        return el.text.strip() if el is not None and el.text else default

    @staticmethod
    def _parse_deadline(raw: str) -> str | None:
        """사람인 마감일 문자열(YYYY-MM-DD 또는 '채용시')을 ISO 형식으로 변환"""
        if not raw or "채용시" in raw or "상시" in raw:
            return None
        # 이미 YYYY-MM-DD 형식이면 그대로 반환
        if len(raw) == 10 and raw[4] == "-":
            return raw
        return None
