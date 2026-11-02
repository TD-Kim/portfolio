// ✏️ 이 파일만 수정하면 사이트 내용이 바뀝니다.
window.PORTFOLIO = {
  name: "김OO",
  nameEn: "Kim OO",
  roles: ["DevOps Engineer", "Cloud Infrastructure", "Automation Lover", "SRE Enthusiast"],
  tagline: "반복은 자동화하고, 장애는 예방하고, 배포는 지루하게 만듭니다.",
  about: [
    "안정적이고 확장 가능한 인프라를 만드는 엔지니어입니다.",
    "클라우드 환경 설계부터 CI/CD 파이프라인, 모니터링까지 서비스가 멈추지 않도록 하는 모든 과정을 좋아합니다.",
  ],
  stats: [
    { value: 3, suffix: "+", label: "년 경력" },
    { value: 12, suffix: "", label: "프로젝트" },
    { value: 99.9, suffix: "%", label: "가용성 목표" },
  ],
  skills: ["AWS", "Kubernetes", "Docker", "Terraform", "GitHub Actions", "ArgoCD", "Prometheus", "Grafana", "Linux", "Python", "Go", "Nginx"],
  projects: [
    {
      title: "Kubernetes 플랫폼 구축",
      desc: "EKS 기반 멀티 환경 클러스터를 Terraform으로 구성하고 ArgoCD로 GitOps 배포 체계를 만들었습니다.",
      tags: ["EKS", "Terraform", "ArgoCD"],
      link: "#",
    },
    {
      title: "CI/CD 파이프라인 개선",
      desc: "GitHub Actions 캐싱과 병렬화로 빌드 시간을 25분에서 6분으로 줄였습니다.",
      tags: ["GitHub Actions", "Docker"],
      link: "#",
    },
    {
      title: "통합 모니터링 시스템",
      desc: "Prometheus · Grafana · Alertmanager로 지표 수집과 알림 체계를 구축해 장애 인지 시간을 단축했습니다.",
      tags: ["Prometheus", "Grafana"],
      link: "#",
    },
    {
      title: "인프라 비용 최적화",
      desc: "Spot 인스턴스와 오토스케일링 정책 조정으로 월 클라우드 비용을 30% 절감했습니다.",
      tags: ["AWS", "Cost"],
      link: "#",
    },
  ],
  experience: [
    { period: "2024 — 현재", title: "DevOps Engineer", org: "OO 컴퍼니", desc: "클라우드 인프라 운영 및 배포 자동화" },
    { period: "2022 — 2024", title: "Infrastructure Engineer", org: "OO 스타트업", desc: "온프레미스 → AWS 마이그레이션" },
    { period: "2021", title: "인턴", org: "OO 연구소", desc: "리눅스 서버 운영 및 스크립트 자동화" },
  ],
  contact: {
    email: "you@example.com",
    links: [
      { label: "GitHub", url: "https://github.com/td-kim" },
      { label: "Blog", url: "#" },
      { label: "LinkedIn", url: "#" },
    ],
  },
};
