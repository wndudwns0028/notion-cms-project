"""공고 제목/본문에서 직무 유형(JobType)을 자동 분류하는 유틸리티"""

# src/types/job.ts의 JobType union과 동일한 값 사용
JOB_TYPE_PATTERNS: dict[str, list[str]] = {
    "SRE": [
        "sre",
        "site reliability",
        "site reliability engineer",
    ],
    "Cloud": [
        "cloud engineer",
        "cloud architect",
        "클라우드 엔지니어",
        "클라우드 아키텍트",
        "aws engineer",
        "gcp engineer",
        "azure engineer",
    ],
    "MLOps": [
        "mlops",
        "ml engineer",
        "ml infra",
        "ai infra",
        "ai engineer",
        "머신러닝 엔지니어",
        "mlops 엔지니어",
    ],
    "Platform": [
        "platform engineer",
        "platform sre",
        "developer platform",
        "플랫폼 엔지니어",
        "플랫폼 개발",
    ],
    "DevOps": [
        "devops",
        "dev ops",
        "데브옵스",
        "ci/cd",
        "cicd",
        "build engineer",
        "release engineer",
    ],
    "Infrastructure": [
        "infrastructure engineer",
        "infra engineer",
        "인프라 엔지니어",
        "인프라 개발",
        "infrastructure",
        "시스템 인프라",
    ],
    "System": [
        "system engineer",
        "systems engineer",
        "시스템 엔지니어",
        "server engineer",
        "서버 엔지니어",
    ],
}


def classify_job_type(title: str, description: str = "") -> list[str]:
    """
    공고 제목과 본문에서 직무 유형(JobType)을 분류한다.

    Args:
        title: 공고명
        description: 공고 본문 (자격요건 + 담당업무 등)

    Returns:
        매칭된 JobType 목록. 매칭 없으면 빈 리스트 반환 (비인프라 공고로 간주).
    """
    combined = (title + " " + description).lower()

    return [
        job_type
        for job_type, patterns in JOB_TYPE_PATTERNS.items()
        if any(pattern in combined for pattern in patterns)
    ]
