"""경력기술서 PDF 를 만든다 (원본 Word 경력기술서와 같은 표 모양, 4쪽).

    python3 tools/career_pdf/build.py tools/career_pdf      # career.html 생성
    node tools/career_pdf/render.js tools/career_pdf         # 김진용_경력기술서.pdf 생성

내용은 아래 skills / projects 에 직접 적혀 있다 (2026-11-16 판: 원본 Word PDF + LMS React 7줄, 정관장 기간 오타 수정,
사이트에만 있던 FCM(LMS)·GitHub Actions(기업 홈페이지)·Tiles·Bootstrap(K-water) 줄 추가, 기술표에 프론트엔드 칸 분리).
"""
import html
import sys
from pathlib import Path

out = Path(sys.argv[1])

skills = [
    ("개발언어", "Java, JSP, HTML5, XML, CSS3, JavaScript(Ajax 활용), Python"),
    ("프레임워크", "Spring, Spring Boot, ibatis, mybatis, Tiles"),
    ("프론트엔드", "React 18, Vite, Redux Toolkit, React Query, React Router, axios, MUI, Ant Design, Sass, Tailwind, jQuery, Bootstrap"),
    ("협업 툴", "tortoise SVN, subversion, redmine, github"),
    ("개발 툴", "Eclipse, IntelliJ, SQL Developer, Maven, Nexacro, WebSquare5, OzReport"),
    ("데이터베이스", "Oracle, MySQL, MariaDB, PostgreSQL, Cubrid, Firebase"),
    ("운영체제 및 서버", "Linux(Ubuntu, CentOS, Red Hat), Tomcat, Apache, JBOSS, Nginx"),
    ("클라우드 플랫폼", "AWS"),
    ("보안 및 인증", "JWT, Spring Security, OAuth2.0"),
    ("배포 및 CI/CD", "Docker, GitHub Actions, Jenkins"),
    ("AI 툴", "Claude Code, ChatGPT"),
]

projects = [
    (8, "병무청 디지털 플랫폼 개발", "2025-06 ~ 진행중",
     "Java 17, Spring Boot 3, MyBatis, Oracle19c, Nexacro, Kubernetes, Docker, Jboss, Git",
     ["기존 Legacy Spring 기반 개발 소스를 Spring Boot 기반 구조로 전환 및 코드 리팩토링 수행",
      "업무 요구사항 분석 및 기능 설계, 개발·테스트 전 과정 수행",
      "기존 C Batch 프로그램을 Java Batch 기반으로 전환하여 배치 처리 구조 개선",
      "Oracle SQL 분석 및 튜닝을 통한 조회 속도 개선",
      "기존 업무 쿼리 분석 및 수정, 데이터 처리 로직 개선",
      "Nexacro 화면 분석 및 UI 기능 수정·개선",
      "단위 테스트 및 통합 테스트 수행, 오류 분석 및 개선 작업 진행",
      "C Batch를 Spring Batch(Job·Step) 기반과 일반 Java 배치로 전환"]),
    (7, "LMS(학습관리시스템) 개발", "2023-12-11 ~ 2025-05",
     "Java 17, Spring Boot 3.3.7, MyBatis, MariaDB 10.11, React 18, Vite, Redux Toolkit, React Query(TanStack Query), "
     "React Router, axios, hls.js, video.js, MUI, Ant Design, HTML5, CSS3 (Sass), JavaScript (ES6), Tailwind, Docker, "
     "Nginx, GitHub, NFS, FFmpeg, inotify, Jenkins, GitHub Actions, Linux(Red Hat), Firebase",
     ["단독 책임으로 요구사항 분석, 아키텍처 설계 및 전체 시스템 설계 수행",
      "DB 설계",
      "Spring Security 구조 설계, Access·Refresh 토큰 발급·재발급, 권한 관리",
      "PASS 인증 기반 로그인/회원가입 기능 설계 및 구현 (Spring Security, JWT)",
      "OAuth2.0 기반 소셜 로그인 연동 (카카오·네이버·구글)",
      "강의 관리, 수강 신청, 진도 체크 등 핵심 비즈니스 로직 개발 (RESTful API)",
      "동영상 스트리밍 서버 구축 및 운영 (Nginx-RTMP, NFS 설정)",
      "업로드된 동영상 자동 변환 스크립트 구현 (inotify + FFmpeg)",
      "Firebase Cloud Messaging(FCM)으로 수강·공지 푸시 알림 구현",
      "React 18 + Vite 기반 프론트엔드 프로젝트 직접 구축 (폴더 구조 설계, 개발·운영 환경 분리, 공통 컴포넌트 설계)",
      "전역 상태(로그인·사용자 정보)는 Redux Toolkit, 서버 데이터(강의·수강 정보)는 React Query로 나눠 관리 (캐싱·재요청·로딩 상태 처리)",
      "axios 인터셉터 기반 API 통신 모듈 구현 (공통 헤더·에러 처리, Access 토큰 만료 시 Refresh 토큰으로 자동 재발급 후 요청 재시도)",
      "React Router 라우팅 및 역할(관리자·강사·수강생)별 접근 제어, 소셜·PASS 본인인증 로그인 화면 연동",
      "hls.js·video.js 기반 강의 동영상 플레이어 구현 (시청 위치 주기 저장·이어보기, 미시청 구간 건너뛰기 방지로 정확한 진도율 관리)",
      "관리자 화면(강의·회원·수강 관리), 수강 신청·내 강의실 화면 반응형(PC·모바일) 구현 (MUI, Ant Design, Sass, Tailwind)",
      "페이지 단위 코드 분할(lazy·Suspense)과 memo로 렌더링 최적화, 빌드 결과를 Nginx로 서빙",
      "Jenkins 서버 설치부터 빌드·배포 파이프라인 구성 및 GitHub Actions와 연동하여 Docker 컨테이너 기반 배포 자동화",
      "Dockerfile 작성 및 docker-compose로 멀티 컨테이너 구성",
      "Nginx SSL 인증서 적용(HTTPS) 및 리버스 프록시 및 로드밸런싱 설정",
      "MariaDB 복제(Replication) 기반 DB 고가용성 환경 구성",
      "GitHub으로 코드 관리 및 이슈 트래킹, 배포 릴리즈 관리",
      "Red Hat 서버 초기 세팅 및 장애 분석"]),
    (6, "기업 홈페이지 구축 및 클라이언트 프로그램 개선", "2023-02 ~ 2023-12",
     "Java 17, Spring Boot 3.3.2, MyBatis, MariaDB 10.11, jQuery 3.x, HTML5, CSS3(Sass), JavaScript(ES6), Docker, Nginx, GitHub, Redmine, GitHub Actions",
     ["요구사항 분석 및 시스템 아키텍처 설계",
      "프론트엔드 React 컴포넌트 개발 및 UI/UX 개선 (Sass, jQuery 활용)",
      "백엔드 RESTful API 설계 및 구현(Spring Boot, MyBatis)",
      "데이터베이스 모델링 및 쿼리 최적화(MariaDB)",
      "Docker 기반 컨테이너화",
      "Nginx 리버스 프록시 설정 및 부하 분산 환경 구성",
      "GitHub으로 코드를 관리하고, GitHub Actions로 빌드·배포 CI/CD 파이프라인 구축"]),
    (5, "국가정보자원관리원 클라우드 운영 자동화 개발", "2022-05 ~ 2023-02",
     "Window 10, egovFramework 3.7, Postgresql, PGAdmin, Cubrid 11, Cubrid Manager 10, Maven, Tomcat 8.5, Apache 2.4, "
     "JBOSS 7.4, Java 1.8, VisualSVN, Mybatis, Spring, jsp, Ansible",
     ["운영 자동화 업무 분석", "개발 환경 구축", "운영 자동화 DB 설계", "클라우드 운영 예방점검 포탈 구축",
      "Ansible 활용 예방점검 구현", "Ansible Playbook 작성", "예방점검 결과 리포팅(엑셀 추출)", "예방점검 스케줄러 구현"]),
    (4, "DB손해보험 사내 자동화 프로그램 개발", "2022-03 ~ 2022-05", "BrityRPA, javascript",
     ["경제뉴스 및 증권종합정보 자료 스크랩 엑셀 생성", "자동 메일링 기능",
      "손해보험협회 등록 직원, 신규 직원, 재등록 직원 식별 및 구분 엑셀 생성 자동화"]),
    (3, "정관장 POS 시스템 유지보수", "2021-12 ~ 2022-02",
     "Window 10, egovFramework 3.7, Oracle 10g, SQL developer, SQLgate, Maven, Jeus 6, Java 1.7, SVN, Ibatis",
     ["AS-IS TO-BE 데이터베이스 마이그레이션", "데이터 정합성 확인 및 검증", "쿠폰 발행 기능 개선", "통계 자료 추출 쿼리 작성"]),
    (2, "K-water 업무시스템 통합 구축", "2021-03 ~ 2021-12",
     "Window 10, egovFramework 3.7, Oracle 11g, SQL developer, SQLgate, Maven, Tomcat 8.5, Java 1.8, SVN, Mybatis, WebSquare, OzReport, Tiles, Bootstrap",
     ["DA#5 사용한 ERD 설계 보조", "분양시스템 분양계획, 계약관리 개발", "SAP 데이터 가공 및 연계", "웹스퀘어를 사용한 화면 설계",
      "다수의 계산 로직 및 결과 시뮬레이션 개발", "OzReport로 분양 계약서·계약 현황 등 출력용 리포트 개발",
      "Tiles로 JSP 공통 레이아웃(헤더·메뉴·푸터)을 구성하고 Bootstrap으로 화면 구현"]),
    (1, "헬스케어 머천다이징 솔루션", "2020-12 ~ 2021-02",
     "Window 10, egovFramework 3.9, Oracle 11g, SQL developer, Maven, Tomcat 8.5, Java 1.8, SVN",
     ["eXERD를 활용하여 DB를 설계, 단어사전, 용어사전 정의", "데이터들 사이의 관계를 정의하여 참조 관계 정의",
      "Oracle에서 참조 관계를 고려하여 DB를 구축하고 시험 데이터를 넣어 프로젝트를 수행할 수 있는 기본 환경 구축",
      "로그인(유저별 화면전환)/로그아웃, 회원가입, 회원수정", "본사와 제휴점 페이지의 메뉴관리 구현",
      "fullcalendar 라이브러리를 사용하여 스케줄러 구현", "파이썬 face_recognition 라이브러리를 사용, 안면인식 출퇴근 기능 구현",
      "자유게시판(페이징 처리, 댓글, 다중 파일업로드/다운로드, 다음글/이전글)", "웹 크롤링을 사용, 데이터 가공 및 화면 출력"]),
]

e = html.escape
COLS = '<colgroup><col style="width:97pt"><col></colgroup>'

parts = ['<table class="block">' + COLS + '<tr class="head"><td colspan="2">▣ Programming Skill (프로그래밍 기술)</td></tr>']
parts += [f'<tr><td class="label">{e(k)}</td><td>{e(v)}</td></tr>' for k, v in skills]
parts.append("</table>")
for no, name, period, env, duties in projects:
    lis = "".join(f"<li>{e(d)}</li>" for d in duties)
    parts.append(
        f'<table class="block">{COLS}<tr class="head"><td colspan="2">▣ 프로젝트{no}</td></tr>'
        f'<tr><td class="label">프로젝트명</td><td class="title">{e(name)}</td></tr>'
        f'<tr><td class="label">프로젝트 기간</td><td>{e(period)}</td></tr>'
        f'<tr><td class="label">개발환경</td><td>{e(env)}</td></tr>'
        f'<tr><td class="label">담당업무</td><td><ul>{lis}</ul></td></tr></table>'
    )

doc = f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>김진용 경력기술서</title>
<link href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@700;800&family=Nanum+Myeongjo:wght@400&display=swap" rel="stylesheet">
<style>
  /* 원본 Word 경력기술서와 같은 A4 표 모양. 표는 쪽 사이에서 잘리지 않게 한다 */
  @page {{ size: 595pt 842pt; margin: 66pt 58pt 64pt 57pt; }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: "Nanum Myeongjo", serif; color: #000; }}
  table {{ width: 100%; border-collapse: collapse; table-layout: fixed; border-top: 1.5pt solid #000; border-bottom: 1.5pt solid #000;
          break-inside: avoid; page-break-inside: avoid; }}
  table + table {{ margin-top: 28pt; }}
  td {{ border-top: 0.75pt solid #000; font-size: 9.96pt; line-height: 16pt; padding: 2.5pt 4pt; vertical-align: middle; }}
  tr:first-child td {{ border-top: 0; }}
  .head td {{ background: #e2e2e2; font-family: "Nanum Gothic", sans-serif; font-weight: 800; font-size: 9pt; padding: 4pt 7pt;
             -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  .label {{ text-align: center; font-family: "Nanum Gothic", sans-serif; font-weight: 800; font-size: 9pt; border-right: 0.75pt solid #000; }}
  .title {{ font-family: "Nanum Gothic", sans-serif; font-weight: 800; font-size: 9pt; }}
  ul {{ list-style: none; padding: 1pt 0 1pt 4pt; }}
  li {{ line-height: 14.4pt; padding-left: 10pt; text-indent: -10pt; }}
  li::before {{ content: "- "; }}
</style></head><body>
{''.join(parts)}
</body></html>"""
(out / "career.html").write_text(doc, encoding="utf-8")
print("ok")
