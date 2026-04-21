"""기존 Notion 공고에 플랫폼 필드를 URL 기반으로 백필하는 스크립트"""
import time

from notion_client import Client

from config import NOTION_API_KEY, NOTION_DATABASE_ID, NOTION_DATA_SOURCE_ID

URL_TO_PLATFORM = {
    "wanted.co.kr": "원티드",
    "jumpit.co.kr": "점핏",
    "saramin.co.kr": "사람인",
    "programmers.co.kr": "프로그래머스",
    "jobkorea.co.kr": "잡코리아",
}


def get_platform_from_url(url: str) -> str | None:
    if not url:
        return None
    for domain, platform in URL_TO_PLATFORM.items():
        if domain in url:
            return platform
    return None


def fetch_all_pages(client: Client) -> list[dict]:
    pages = []
    cursor = None
    query_id = NOTION_DATA_SOURCE_ID or NOTION_DATABASE_ID

    while True:
        body: dict = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor

        response = client.request(
            path=f"data_sources/{query_id}/query",
            method="post",
            body=body,
        )
        pages.extend(response.get("results", []))

        if not response.get("has_more"):
            break
        cursor = response.get("next_cursor")

    return pages


def backfill():
    client = Client(auth=NOTION_API_KEY)

    print("Notion DB에서 전체 공고 조회 중...")
    pages = fetch_all_pages(client)
    print(f"총 {len(pages)}건 조회")

    updated = 0
    skipped = 0
    already_set = 0

    for page in pages:
        page_id = page["id"]
        props = page.get("properties", {})

        # 이미 플랫폼이 설정된 경우 스킵
        platform_prop = props.get("플랫폼", {})
        existing_platform = "".join(
            chunk.get("plain_text", "")
            for chunk in platform_prop.get("rich_text", [])
        )
        if existing_platform:
            already_set += 1
            continue

        # URL에서 플랫폼 추론
        url_prop = props.get("공고 URL", {})
        job_url = url_prop.get("url", "")
        platform = get_platform_from_url(job_url)

        if not platform:
            skipped += 1
            continue

        # 플랫폼 필드 업데이트
        try:
            client.request(
                path=f"pages/{page_id}",
                method="patch",
                body={
                    "properties": {
                        "플랫폼": {
                            "rich_text": [{"type": "text", "text": {"content": platform}}]
                        }
                    }
                },
            )
            updated += 1
            time.sleep(0.4)  # Rate limit
        except Exception as e:
            print(f"  [오류] {page_id}: {e}")

    print(f"\n백필 완료: 업데이트 {updated}건 / 이미 설정됨 {already_set}건 / URL 불명 스킵 {skipped}건")


if __name__ == "__main__":
    backfill()
