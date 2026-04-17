"""모든 스크래퍼의 추상 기본 클래스"""
from abc import ABC, abstractmethod


class BaseScraper(ABC):
    """
    플랫폼별 스크래퍼가 구현해야 할 인터페이스.

    scrape()는 아래 키를 포함하는 dict 목록을 반환한다.
    (notion_writer.py의 Notion DB 14개 필드 매핑 기준)

    필수 키:
        title (str): 공고명
        company (str): 회사명
        job_url (str): 공고 원문 URL (중복 방지 기준)

    선택 키 (없으면 None):
        job_types (list[str]): 직무 유형 (SRE/Cloud/MLOps 등)
        employment_type (str|None): 고용 형태 (정규직/계약직/인턴)
        experience_level (str|None): 경력 요건 (신입/1년 이상 등)
        requirements (str): 자격요건
        preferred (str): 우대사항
        responsibilities (str): 담당업무
        tech_stack (list[str]): 기술스택
        deadline (str|None): 마감일 (ISO 8601: YYYY-MM-DD)
    """

    @abstractmethod
    def scrape(self) -> list[dict]:
        """채용공고 데이터를 수집하여 반환한다."""
        ...
