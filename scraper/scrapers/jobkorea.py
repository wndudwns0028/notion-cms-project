"""잡코리아 HTML 파싱 스크래퍼 (공식 API 없음, BeautifulSoup 사용)"""
import time
from urllib.parse import urlencode

import requests
from bs4 import BeautifulSoup

from config import DEFAULT_HEADERS
from scrapers.base import BaseScraper
from utils.tech_extractor import extract_tech_stack
from utils.job_classifier import classify_job_type

BASE_URL = "https://www.jobkorea.co.kr"
SEARCH_URL = f"{BASE_URL}/Search/"

# 검색 키워드 목록 (인프라 직군)
SEARCH_KEYWORDS = [
    "DevOps",
    "SRE",
    "클라우드 엔지니어",
    "인프라 엔지니어",
    "MLOps",
    "플랫폼 엔지니어",
]

HEADERS = {
    **DEFAULT_HEADERS,
    "Referer": "https://www.jobkorea.co.kr/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


class JobKoreaScraper(BaseScraper):
    """
    잡코리아 채용공고 HTML 파싱 스크래퍼.

    주의: 잡코리아는 공식 API가 없으므로 HTML 구조 변경 시 파서 수정이 필요하다.
    HTML 파싱 방식 중 가장 유지보수 부담이 높은 방식이다.
    """

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
            # 키워드 간 딜레이 (HTML 파싱이므로 더 긴 딜레이)
            time.sleep(1.5)

        return jobs

    def _fetch_keyword(self, keyword: str) -> list[dict]:
        """특정 키워드로 잡코리아 검색 결과 수집"""
        results: list[dict] = []
        page = 1

        while page <= 3:  # 키워드당 최대 3페이지
            params = {
                "stext": keyword,
                "tabType": "recruit",
                "Page_No": page,
            }
            url = f"{SEARCH_URL}?{urlencode(params)}"

            try:
                resp = requests.get(url, headers=HEADERS, timeout=15)
                resp.raise_for_status()
            except requests.RequestException as e:
                print(f"  [잡코리아] 요청 오류 ({keyword}, page={page}): {e}")
                break

            soup = BeautifulSoup(resp.text, "lxml")
            items = self._parse_list_page(soup)

            if not items:
                break

            results.extend(items)
            page += 1
            time.sleep(1.0)

        return results

    def _parse_list_page(self, soup: BeautifulSoup) -> list[dict]:
        """잡코리아 목록 페이지 HTML 파싱"""
        jobs: list[dict] = []

        # 잡코리아 공고 카드 선택자 (HTML 구조 변경 시 업데이트 필요)
        job_cards = soup.select("div.recruit-info")
        if not job_cards:
            # 대체 선택자 시도
            job_cards = soup.select("li.list-item")

        for card in job_cards:
            try:
                job = self._parse_card(card)
                if job:
                    jobs.append(job)
            except Exception:
                continue

        return jobs

    def _parse_card(self, card) -> dict | None:
        """개별 공고 카드 파싱"""
        # 공고명
        title_el = card.select_one("a.title") or card.select_one(".job-title")
        if not title_el:
            return None
        title = title_el.get_text(strip=True)

        # 공고 URL
        href = title_el.get("href", "")
        if not href:
            return None
        job_url = href if href.startswith("http") else f"{BASE_URL}{href}"

        # 회사명
        company_el = card.select_one(".company-name") or card.select_one(".corp-name")
        company = company_el.get_text(strip=True) if company_el else ""

        # 마감일
        deadline_el = card.select_one(".date") or card.select_one(".deadline")
        deadline_text = deadline_el.get_text(strip=True) if deadline_el else ""
        deadline = self._parse_deadline(deadline_text)

        # 전체 텍스트에서 기술스택, 직무 유형 추출
        full_text = card.get_text(" ", strip=True)

        return {
            "title": title,
            "company": company,
            "job_url": job_url,
            "job_types": classify_job_type(title, full_text),
            "employment_type": "정규직",
            "experience_level": self._parse_experience(full_text),
            "tech_stack": extract_tech_stack(full_text),
            "requirements": "",
            "preferred": "",
            "responsibilities": "",
            "deadline": deadline,
        }

    @staticmethod
    def _parse_deadline(text: str) -> str | None:
        """마감일 텍스트를 ISO 형식으로 변환"""
        if not text or "채용시" in text or "상시" in text:
            return None
        import re
        match = re.search(r"(\d{4})[.\-/](\d{2})[.\-/](\d{2})", text)
        if match:
            return f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
        match = re.search(r"(\d{2})[.\-/](\d{2})", text)
        if match:
            from datetime import date
            year = date.today().year
            return f"{year}-{match.group(1)}-{match.group(2)}"
        return None

    @staticmethod
    def _parse_experience(text: str) -> str | None:
        """텍스트에서 경력 요건 추출"""
        if "신입" in text and "경력" not in text:
            return "신입"
        if "경력무관" in text or "무관" in text:
            return "무관"
        import re
        match = re.search(r"(\d+)년\s*이상", text)
        if match:
            years = int(match.group(1))
            if years >= 5:
                return "5년 이상"
            if years >= 3:
                return "3년 이상"
            return "1년 이상"
        return None
