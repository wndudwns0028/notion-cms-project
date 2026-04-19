"""환경변수 로딩 및 설정 관리"""
import os
from dotenv import load_dotenv

# scraper/ 디렉토리의 .env 파일 로드
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

NOTION_API_KEY: str = os.environ.get("NOTION_API_KEY", "")
# NOTION_DATABASE_ID: 페이지 생성용 database ID (.env.local의 ID와 동일)
NOTION_DATABASE_ID: str = os.environ.get("NOTION_DATABASE_ID", "")
# NOTION_DATA_SOURCE_ID: 쿼리용 data_source ID (database 객체의 data_sources[0].id)
NOTION_DATA_SOURCE_ID: str = os.environ.get("NOTION_DATA_SOURCE_ID", "")
SARAMIN_API_KEY: str = os.environ.get("SARAMIN_API_KEY", "")

# 요청 공통 헤더
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8",
}

def validate(dry_run: bool = False):
    """필수 환경변수 존재 여부 확인.

    dry_run=True 이면 Notion 관련 키를 검증하지 않는다.
    """
    missing = []
    if not dry_run:
        if not NOTION_API_KEY or NOTION_API_KEY == "secret_xxxx":
            missing.append("NOTION_API_KEY")
        if not NOTION_DATABASE_ID or NOTION_DATABASE_ID == "xxxx":
            missing.append("NOTION_DATABASE_ID")
    if missing:
        raise EnvironmentError(
            f"필수 환경변수 미설정: {', '.join(missing)}\n"
            "scraper/.env 파일을 확인해 주세요."
        )
