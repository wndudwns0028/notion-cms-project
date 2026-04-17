"""공고 본문에서 기술스택 키워드를 추출하는 유틸리티"""

# 인프라/DevOps 직군 기술스택 키워드 목록
TECH_KEYWORDS: set[str] = {
    # 컨테이너 / 오케스트레이션
    "Kubernetes", "k8s", "Docker", "Podman", "Helm", "Kustomize",
    # IaC
    "Terraform", "Ansible", "Pulumi", "CloudFormation", "CDK",
    # 클라우드
    "AWS", "GCP", "Azure", "OCI", "Naver Cloud", "NCP",
    # 모니터링
    "Prometheus", "Grafana", "Datadog", "Dynatrace", "ELK",
    "Elasticsearch", "Kibana", "Logstash", "Fluentd", "Loki",
    # CI/CD
    "Jenkins", "GitHub Actions", "GitLab CI", "ArgoCD", "Spinnaker",
    "Tekton", "CircleCI",
    # 서비스 메시 / 네트워크
    "Istio", "Envoy", "Nginx", "HAProxy", "Traefik",
    # 언어
    "Python", "Go", "Golang", "Bash", "Shell", "Ruby",
    # OS / 인프라
    "Linux", "Ubuntu", "CentOS", "RHEL",
    # 데이터베이스
    "PostgreSQL", "MySQL", "Redis", "MongoDB", "Kafka",
    # 보안
    "Vault", "RBAC", "IAM",
    # MLOps
    "Kubeflow", "MLflow", "Airflow", "Spark",
}

# 대소문자 통합을 위한 소문자 → 정규 표기명 매핑
_LOWER_MAP: dict[str, str] = {k.lower(): k for k in TECH_KEYWORDS}
# k8s → Kubernetes 별칭 처리
_ALIASES: dict[str, str] = {
    "k8s": "Kubernetes",
    "golang": "Go",
    "github actions": "GitHub Actions",
    "gitlab ci": "GitLab CI",
}


def extract_tech_stack(text: str, platform_tags: list[str] | None = None) -> list[str]:
    """
    공고 본문 텍스트에서 기술스택 키워드를 추출한다.

    플랫폼이 제공하는 태그(platform_tags)가 있으면 우선 사용하고,
    없으면 본문 텍스트에서 키워드를 추출한다.

    Args:
        text: 공고 전체 텍스트 (제목 + 자격요건 + 담당업무 등)
        platform_tags: 플랫폼 제공 태그 목록 (없으면 None)

    Returns:
        정규화된 기술스택 이름 목록 (중복 제거, 정렬)
    """
    if platform_tags:
        # 플랫폼 제공 태그를 정규 표기명으로 정규화
        result: set[str] = set()
        for tag in platform_tags:
            tag_lower = tag.lower().strip()
            if tag_lower in _ALIASES:
                result.add(_ALIASES[tag_lower])
            elif tag_lower in _LOWER_MAP:
                result.add(_LOWER_MAP[tag_lower])
        if result:
            return sorted(result)

    # 본문 텍스트에서 키워드 추출
    text_lower = text.lower()
    found: set[str] = set()

    # 별칭 먼저 처리
    for alias, canonical in _ALIASES.items():
        if alias in text_lower:
            found.add(canonical)

    # 키워드 직접 매칭
    for keyword_lower, canonical in _LOWER_MAP.items():
        if keyword_lower in text_lower:
            found.add(canonical)

    return sorted(found)
