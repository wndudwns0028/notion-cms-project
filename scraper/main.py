"""채용공고 자동 수집 파이프라인 CLI 진입점"""
import argparse
import sys
from typing import Type

from config import validate
from notion_writer import save_jobs
from scrapers.base import BaseScraper
from scrapers.saramin import SaRAminScraper
from scrapers.wanted import WantedScraper
from scrapers.jumpit import JumpitScraper

SCRAPER_MAP: dict[str, Type[BaseScraper]] = {
    "saramin": SaRAminScraper,   # 사람인 공식 XML API (SARAMIN_API_KEY 필요)
    "wanted": WantedScraper,     # 원티드 내부 JSON API (키 불필요)
    "jumpit": JumpitScraper,     # 점핏 내부 JSON API (키 불필요)
    # "programmers": ProgrammersScraper,  # ❌ career.programmers.co.kr 서비스 종료
    # "jobkorea": JobKoreaScraper,        # ❌ HTML 파싱 구조 변경으로 동작 안 함
}


def run_scraper(name: str, scraper_cls: Type[BaseScraper], dry_run: bool) -> tuple[int, int]:
    """단일 스크래퍼 실행 후 (저장, 스킵) 건수 반환"""
    print(f"\n{'='*50}")
    print(f"  [{name}] 수집 시작")
    print(f"{'='*50}")

    try:
        scraper = scraper_cls()
    except ValueError as e:
        print(f"  [{name}] 초기화 실패: {e}")
        return 0, 0

    try:
        jobs = scraper.scrape()
    except Exception as e:
        print(f"  [{name}] 수집 중 오류 발생: {e}")
        return 0, 0

    print(f"  [{name}] 수집 완료: {len(jobs)}건")

    if not jobs:
        return 0, 0

    saved, skipped = save_jobs(jobs, dry_run=dry_run)
    mode_label = "[DRY-RUN] " if dry_run else ""
    print(f"  [{name}] {mode_label}저장: {saved}건 / 스킵(중복): {skipped}건")
    return saved, skipped


def main() -> None:
    parser = argparse.ArgumentParser(
        description="인프라 직군 채용공고 자동 수집 파이프라인",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  python main.py --source saramin          # 사람인만 수집 (API 키 필요)
  python main.py --source wanted           # 원티드만 수집
  python main.py --source jumpit           # 점핏만 수집
  python main.py --source all              # 전체 플랫폼 수집
  python main.py --source all --dry-run    # Notion 미기록, 출력만
        """,
    )
    parser.add_argument(
        "--source",
        choices=[*SCRAPER_MAP.keys(), "all"],
        required=True,
        help="수집할 플랫폼 (all: 전체 플랫폼)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="수집만 수행하고 Notion에 저장하지 않음",
    )
    args = parser.parse_args()

    # 환경변수 검증 (dry-run이 아닐 때만 Notion 키 필수)
    try:
        validate(dry_run=args.dry_run)
    except EnvironmentError as e:
        print(f"[오류] {e}")
        sys.exit(1)

    if args.dry_run:
        print("[DRY-RUN 모드] Notion에 저장하지 않습니다.")

    # 수집할 스크래퍼 목록 결정
    if args.source == "all":
        targets = list(SCRAPER_MAP.items())
    else:
        targets = [(args.source, SCRAPER_MAP[args.source])]

    total_saved = 0
    total_skipped = 0

    for name, scraper_cls in targets:
        saved, skipped = run_scraper(name, scraper_cls, dry_run=args.dry_run)
        total_saved += saved
        total_skipped += skipped

    print(f"\n{'='*50}")
    print(f"  수집 완료 요약")
    print(f"{'='*50}")
    mode_label = "[DRY-RUN] " if args.dry_run else ""
    print(f"  {mode_label}총 저장: {total_saved}건 / 총 스킵(중복): {total_skipped}건")


if __name__ == "__main__":
    main()
