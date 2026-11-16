# 인수인계 (handoff)

마지막 정리: 2026-11-16 · 기준 커밋: `main` @ PR #32 머지 직후

이 문서는 다음 작업 세션이 앞선 대화 없이 이어서 일할 수 있도록 현재 상태, 결정한 것, 작업 방식, 남은 일을 적은 것이다.
설치·설정 방법은 [`README.md`](README.md), [`chatbot/README.md`](chatbot/README.md)에 있다. 여기에는 그 문서에 없는 결정과 맥락만 적는다.

> 이 저장소는 공개이고 GitHub Pages 가 루트 파일을 그대로 올린다. 이 파일에도 비밀값·초대 코드·받은 사람 이름은 적지 않는다.

---

## 1. 무엇이 어디서 돌고 있나

| 구성 | 위치 | 배포 |
|---|---|---|
| 포트폴리오 사이트 | `index.html`, `style.css`, `main.js`, `data.json` | GitHub Pages, `main` 루트. 머지하면 1~2분 뒤 반영 (https://td-kim.github.io/portfolio/) |
| 챗봇 + 관리자 화면 | `chatbot/app.py`(Streamlit), `chatbot/agent.py`, `chatbot/prompt.md`, `.streamlit/config.toml` | Streamlit Community Cloud, `main` 의 `chatbot/app.py`. 머지하면 자동 재배포 |
| 기록 저장소 (비공개) | `TD-Kim/portfolio-logs` | 챗봇이 대화 기록·초대 목록(`invites.json`)을 저장. GitHub Actions 두 개가 돈다 (아래) |
| 방문 통계 | GoatCounter `td-kim.goatcounter.com` | 사이트가 직접 보냄. 쿠키·IP 저장 없음 |

- 모델: `claude-haiku-5-5` (`CHAT_MODEL` 로 바꿀 수 있음). Anthropic SDK, 프롬프트 캐싱 사용.
- `portfolio-logs` 의 Actions
  - `visits.yml`: 매일 00:17 KST 에 전날 방문 통계를 `visits/YYYY-MM/DD.md` 로 저장. 어제 + 그 전 이틀 중 파일이 없는 날을 다시 채운다 (GoatCounter 가 가끔 일시적으로 404 를 줘서).
  - `keepalive.yml`: 6시간마다 헤드리스 브라우저로 챗봇을 열어 Streamlit 이 잠들지 않게 한다. 잠들어 있으면 깨우기 버튼을 누른다.
- `chatbot/visits.py` 와 `portfolio-logs/scripts/visits.py` 는 **같은 파일**이다 (관리자 "오늘 방문" 탭이 씀). 고치면 둘 다 고친다.

### 설정값 (Streamlit Secrets · 저장소 Secrets) — 이름만
- Streamlit: `ANTHROPIC_API_KEY`(또는 `PORTFOLIO_CHATBOT_ANTHROPIC_API_KEY`), `ADMIN_PASSWORD`, `INVITE_SECRET`(바꾸면 보낸 링크가 모두 막힘), `LOG_GITHUB_TOKEN`, `LOG_REPO`, `GOATCOUNTER_TOKEN`, `SMTP_*`, `MAIL_TO`
- 선택: `QUESTIONS_PER_CODE`(기본 30), `DAILY_QUESTION_LIMIT`(200), `CODE_TTL_HOURS`(24), `REVOKED_INVITES`, `ACCESS_CODES`
- `portfolio-logs` 저장소 Secret: `GOATCOUNTER_TOKEN`

---

## 2. 사이트 현재 상태와 결정한 것

디자인은 unslop 진단 → 미리보기 → 사용자 확인을 거쳐 PR #24 이후 바뀌었다. 아래는 사용자가 **직접 고른 것**이라 되돌리지 않는다.

- **색**: 잉크색 바탕(`#0b0d14`) + 틸 강조(`#3ecfbf`). 예전 보라·하늘·분홍 그라데이션은 없앴다.
- **밝은 테마**: 상단 ☾/☀ 버튼. 기본은 어두운 테마, 선택은 `localStorage["portfolio-theme"]`. `<head>` 에서 그리기 전에 적용(깜빡임 방지). 밝은 테마 틸은 글자 대비 때문에 `#0a7d72`.
- **버튼**: 주 버튼은 속 빈 틸 테두리 + 은은한 틸 빛, 보조 버튼은 흰 테두리 + 흰 빛(밝은 테마에서는 옅은 그림자).
- **유지**: 별자리 배경(강조색을 따라감), "Backend Developer" 타이핑 + 커서, 💬🔒 이모지(사용자가 유지 원함), "움직임 멈추기" 버튼.
- **첫 화면**: 이름 아래 한 줄 "요구사항부터 운영까지, 시스템을 끝까지 만드는 개발자", 오른쪽에 실제 챗봇 답변 예시(CI/CD 질문. Kubernetes 는 "확인 수준"이라 일부러 뺐다).
- **기능**: 프로젝트 카드 펼치기(맡은 일 3개 + 챗봇으로 연결), 기술 지도(기술 → 쓴 프로젝트 + 본인 확인 메모), 미니 터미널(` 키), `?admin` → 챗봇 관리자로 이동, `?me` → 이 브라우저 방문을 통계에서 뺌(`?me=off` 로 되돌림), `?ref=saramin` 같은 출처 표시.
- **한글 줄바꿈**: `word-break: keep-all` (단어 중간에서 끊기지 않게).
- 링크 미리보기 이미지 `og.png` 는 새 디자인으로 다시 만들었고, 캐시 때문에 `og.png?v=3` 으로 걸려 있다. 바꾸면 숫자를 올린다.

## 3. 챗봇 현재 상태와 결정한 것

- 근거 자료는 전부 `data.json`: `careerDetails`(경력기술서), `skillNotes`(기술별 본인 확인 메모: 어디서·한 일·수준), `skillTable`, `projects`, `learning` 등.
- `chatbot/prompt.md` 의 답변 규칙 중 사용자가 요청해서 넣은 것
  - 답의 출처("메모", "경력기술서 기준")를 말하지 않는다. "직접 문의해 주세요" 같은 맺음말을 붙이지 않는다.
  - 예/아니오 질문은 사실대로 먼저 답한다 (예: "파이썬 실무에서 써봤어요?" → "회사 업무에서는 쓰지 않았고…").
  - 여러 기술에 걸친 질문(CI/CD, 배포, DevOps)에는 내용이 많은 기술부터 말하고, 묻지 않은 약한 기술(Kubernetes·AWS 처럼 "확인 수준"·"실무 미사용")은 꺼내지 않는다. 이름으로 직접 물으면 사실대로 답한다.
  - 숫자가 없는 성과(SQL 튜닝)는 숫자를 만들지 않는다.
- 테마: `.streamlit/config.toml` 에 어두운(기본)·밝은 테마. 사이트가 챗봇 주소에 `embed_options=light_theme|dark_theme` 을 붙여 같은 테마로 연다.
- 관리자(`챗봇주소?admin`): 초대 링크 · 대화 기록 · 방문 기록(오늘 실시간 + 지난 기록) · 메일 탭.
  - 초대 목록은 사용 중 / 막음을 먼저, 끝난 초대는 스위치 뒤에 숨긴다(코드·링크도 숨김).
  - "기간 바꾸기": 같은 id·이름·질문 수로 **새 코드**가 나온다(짧은 코드 안에 마감일이 들어 있음). 예전 코드는 원래 마감일에 끝난다.
- 서버가 켜진 채로 새 코드가 배포되면 예전 모듈이 남는다. `agent.py` 는 파일 시각으로, `visits.py` 는 관리자 탭을 열 때 `importlib.reload` 한다. 새 모듈을 추가하면 같은 처리를 해 준다. 그래도 이상하면 Streamlit "Reboot app".

## 4. 경력 자료 (사용자 본인 확인 완료)

- 사용자에게 보기를 주고 고르게 해서 확인한 내용만 `skillNotes`·`careerDetails` 에 넣었다. **추측으로 채우지 않는다.** 모르는 건 보기(AskUserQuestion)를 만들어 묻는다 — 사용자가 직접 입력하기보다 고르는 걸 선호한다.
- 최근 추가: LMS React 프론트엔드 7줄 (React 18 + Vite 구축, Redux Toolkit + React Query, axios 토큰 재발급, React Router 역할별 접근 제어, hls.js·video.js 플레이어 진도 관리, MUI·Ant Design 반응형, 코드 분할·memo).
- 경력기술서 PDF 는 `tools/career_pdf/` 로 다시 만든다 (`build.py` 에 내용이 직접 들어 있음, 4쪽).
  - PDF 와 `data.json` 의 차이(사이트에만 있음): LMS FCM 푸시 알림, 기업 홈페이지 GitHub Actions, K-water Tiles·Bootstrap. 사용자가 원하면 PDF 에도 넣는다.
- 공개하지 않는 정보: 전화번호, 주소, 생년월일, 사진. 이메일은 공개 가능. 기록에 남는 연락처는 가려서 저장.

---

## 5. 작업 방식 (이 저장소에서 지켜 온 것)

- 브랜치 `claude/portfolio-site` 에서 작업 → PR → **사용자가 "머지해줘"/"적용해줘" 하면** merge commit 으로 머지. 디자인처럼 큰 변경은 별도 브랜치 + 미리보기(Artifact)로 먼저 보여 주고 확인받는다.
- 커밋 전에 꼭: `cd chatbot && python -m unittest -q` (지금 56개). 출력을 `| tail` 로 잘라서 종료 코드를 가리지 않는다.
- 챗봇 답변을 바꾸면 실제 API 로 확인: `python chatbot/live_check.py` (전체 17개, 약 1센트) 또는 `--only <이름>`. 키가 없는 세션이면 확인 못 했다고 사용자에게 말한다.
- 화면을 바꾸면 Playwright 로 PC(1440)·휴대폰(390, 320) 캡처, 가로 넘침·글자 대비 4.5:1·누르는 영역 44px 확인.
- 관리자 화면은 로컬에서 가짜 GitHub 서버로 띄워 볼 수 있다: `LOG_API_URL=http://127.0.0.1:9900` (가짜 contents API) + `ADMIN_PASSWORD`, `INVITE_SECRET` 를 주고 `streamlit run chatbot/app.py`.
- 프로젝트 스킬: `.claude/skills/` 의 `ui-ux-pro-max`, `unslop`, `karpathy-guidelines` ([목록](.claude/skills/README.md)).
- 답변은 한국어로, 전문 용어 대신 쉬운 말로. 사용자는 휴대폰으로 확인하는 일이 많다.

## 6. 남은 일·알려진 점

- [ ] 챗봇이 기업 홈페이지를 "이전 회사"라고 표현한 적이 있다 (실제로는 LMS 와 같은 에이치에스 컴퍼니). 자주 보이면 `prompt.md` 에 "같은 회사의 다른 프로젝트를 이전 회사라고 하지 않는다" 규칙 추가.
- [ ] (선택) 경력기술서 1쪽 기술 분류표에 "프론트엔드" 칸 따로 두기 — 사용자에게 제안만 했다.
- [ ] (선택) PDF 에 사이트에만 있는 3줄(FCM, GitHub Actions, Tiles·Bootstrap) 넣을지 사용자 확인.
- 채용 앱에 올린 링크는 `?ref=saramin` 처럼 앱별로 붙이면 방문 출처가 정확히 나온다 (안 붙여도 방문 수는 집계됨).
- 사용자 기기에서 `?me` 를 한 번 열어 두면 본인 방문이 통계에서 빠진다 (브라우저마다, 카카오톡 안 브라우저도 따로).
- AI TOP 100 은 "예선 완주"로 정리됨(본선 미진출). 학습 카드(GraphRAG, FDE)는 "강의 수료 · 혼자 연습 중".
