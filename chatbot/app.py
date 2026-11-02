"""진용님에 대해 물어보세요 - Streamlit 챗봇 화면.

실행: streamlit run chatbot/app.py
필요한 설정(.streamlit/secrets.toml 또는 환경변수): chatbot/README.md 참고
"""

from __future__ import annotations

import os

import streamlit as st

# Streamlit Cloud 의 Secrets 를 환경변수처럼 쓸 수 있게 옮긴다 (agent.py 는 환경변수만 본다)
try:
    for k, v in st.secrets.items():
        if isinstance(v, str):
            os.environ.setdefault(k, v)
except Exception:  # secrets.toml 이 없으면 환경변수만 사용
    pass

# 서버가 켜진 채로 새 코드가 배포되면 예전 agent 모듈이 메모리에 남아 ImportError 가 날 수 있다.
# agent.py 가 바뀌었으면 다시 불러오고, 그 버전을 아래 캐시 키에 넣어 예전 객체도 버린다.
import importlib  # noqa: E402

import agent as _agent_module  # noqa: E402

AGENT_VERSION = os.path.getmtime(_agent_module.__file__)
if getattr(_agent_module, "_loaded_version", None) != AGENT_VERSION:  # 기록이 없어도(예전 코드) 다시 불러온다
    _agent_module = importlib.reload(_agent_module)
_agent_module._loaded_version = AGENT_VERSION

from agent import (  # noqa: E402
    KEY_NAMES,
    MAX_USER_TURNS,
    ChatSession,
    CodeQuota,
    DailyBudget,
    Profile,
    AccessControl,
    build_agent,
    parse_access_codes,
    resolve_api_key,
    InviteRegistry,
    logger_from_env,
    signer_from_env,
)

st.set_page_config(page_title="진용님에 대해 물어보세요", page_icon="💬", layout="centered")

PORTFOLIO_URL = os.environ.get("PORTFOLIO_URL", "")
# 초대 코드. 비어 있으면 누구나 쓸 수 있다. 예: ACCESS_CODES = "카카오 인사팀:k7f2q9:2026-11-30,친구:m3x8zz"
ACCESS_CODES = os.environ.get("ACCESS_CODES", "")
CODE_TTL_HOURS = float(os.environ.get("CODE_TTL_HOURS", "24"))  # 처음 쓴 뒤 몇 시간 동안 쓸 수 있는지 (0 = 제한 없음)
# 서명 초대 코드: INVITE_SECRET 이 있으면 ?admin 페이지에서 Secrets 를 고치지 않고 코드를 만들 수 있다
INVITE_SECRET = os.environ.get("INVITE_SECRET", "")
REVOKED_INVITES = os.environ.get("REVOKED_INVITES", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
DAILY_LIMIT = int(os.environ.get("DAILY_QUESTION_LIMIT", "200"))  # 서버 전체 하루 질문 수
QUESTIONS_PER_CODE = int(os.environ.get("QUESTIONS_PER_CODE", "30"))  # 초대 코드 하나당 질문 수 (탭·기기 합산)
MAX_CODE_TRIES = 5

GREETING = """안녕하세요! 👋 저는 **김진용님의 포트폴리오 안내 에이전트**예요.
진용님의 경력, 프로젝트, 기술에 대해 무엇이든 물어보세요.

**이런 키워드를 넣어 물어보면 정확한 답을 얻을 수 있어요**

| 궁금한 것 | 키워드 예시 |
|---|---|
| 기술 경험 | `Spring Boot` `Oracle 튜닝` `Docker` `Kubernetes` |
| 프로젝트 | `병무청` `LMS` `국가정보자원관리원` `K-water` |
| 이력 | `경력` `자격증` `학력` `표창` |
| 공부·도전 | `AI TOP 100` `GraphRAG` |
| 그 밖에 | `GitHub 저장소` `메시지 남기기` |

아래 예시 질문을 눌러 바로 시작할 수도 있어요."""

EXAMPLES = [
    "Spring Boot로 어떤 프로젝트를 했나요?",
    "병무청 프로젝트에서 맡은 일은?",
    "Docker나 Kubernetes 경험이 있나요?",
    "AI TOP 100은 어떤 대회였나요?",
    "최근 GitHub 저장소 보여줘",
    "진용님에게 메시지를 남기고 싶어요",
]

st.markdown(
    """
<style>
.block-container { padding-top: 4.5rem; max-width: 760px; }
.hero-title {
  font-size: 2.2rem !important; font-weight: 800; letter-spacing: -0.03em; margin: 0; line-height: 1.25;
  background: linear-gradient(120deg, #7c5cff, #00d4ff 50%, #ff4ecd);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.hero-sub { color: #9a98b0; margin: 0.25rem 0 1.4rem; }
.hero-sub b { color: #ecebf5; }
div[data-testid="stButton"] button { border-radius: 999px; width: 100%; text-align: left; }
.foot { color: #6f6d85; font-size: 0.8rem; text-align: center; margin-top: 0.5rem; }
</style>
""",
    unsafe_allow_html=True,
)


# 서버가 깨어난 뒤 처음 한 번만 준비한다. 잠들어 있다 깨어나는 동안 이 안내가 보인다.
@st.cache_resource(show_spinner="잠들어 있던 챗봇을 깨우는 중이에요. 오래 잠들어 있었다면 30초~1분 정도 걸릴 수 있어요 🙏")
def get_agent(version: float):  # version 이 바뀌면 새로 만든다
    return build_agent()


@st.cache_resource
def get_logger(version: float, token: str, repo: str):  # 대화 기록기 (없으면 None)
    return logger_from_env()


@st.cache_resource
def get_registry(version: float, token: str, repo: str):  # 보낸 초대 목록 (기록 저장소의 invites.json)
    log = get_logger(version, token, repo)
    return InviteRegistry(log) if log else None


LOG_ARGS = (os.environ.get("LOG_GITHUB_TOKEN", ""), os.environ.get("LOG_REPO", ""))


@st.cache_resource
def get_access(raw: str, ttl: float, version: float, secret: str, revoked: str, log_args: tuple) -> AccessControl:
    # 모든 방문자가 함께 쓰는 '처음 쓴 시각' 기록. Secrets 가 바뀌면 인자가 바뀌어 새로 만든다.
    registry = get_registry(version, *log_args)
    return AccessControl(
        parse_access_codes(raw), ttl_hours=ttl, signer=signer_from_env(),
        labels=registry.labels if registry else None,
        blocked=registry.blocked if registry else None,
    )


@st.cache_resource
def get_quota(limit: int, version: float) -> CodeQuota:  # 초대 코드별 질문 수 (모든 방문자가 함께 씀)
    return CodeQuota(limit)


@st.cache_resource
def get_budget() -> DailyBudget:  # 모든 방문자가 함께 쓰는 하루 한도
    return DailyBudget(DAILY_LIMIT)


# ---- 초대 링크 만들기 (관리자 전용): 챗봇 주소 뒤에 ?admin 을 붙여 연다
if "admin" in st.query_params:
    import datetime as dt
    import hmac
    from urllib.parse import quote

    st.markdown('<p class="hero-title">🔑 관리자</p>', unsafe_allow_html=True)
    signer = signer_from_env()
    if not (ADMIN_PASSWORD and signer):
        st.warning(
            "Streamlit Secrets 에 `ADMIN_PASSWORD` 와 `INVITE_SECRET`(16자 이상의 아무 문자열)을 먼저 넣어 주세요. "
            "INVITE_SECRET 은 한 번 정하면 바꾸지 마세요. 바꾸면 이전에 보낸 링크가 모두 막힙니다."
        )
        st.stop()

    if not st.session_state.get("admin_ok"):
        tries = st.session_state.get("admin_tries", 0)
        if tries >= MAX_CODE_TRIES:
            st.error("비밀번호를 여러 번 틀렸어요. 새로고침한 뒤 다시 시도해 주세요.")
            st.stop()
        with st.form("admin_login"):
            pw = st.text_input("관리자 비밀번호", type="password")
            if st.form_submit_button("들어가기", use_container_width=True):
                if hmac.compare_digest(pw.encode(), ADMIN_PASSWORD.encode()):
                    st.session_state.admin_ok = True
                    st.rerun()
                st.session_state.admin_tries = tries + 1
                st.error("비밀번호가 맞지 않아요.")
        st.stop()

    tab_invite, tab_logs = st.tabs(["🔗 초대 링크", "🗂️ 대화 기록"])
    with tab_invite:
        site = PORTFOLIO_URL or Profile.load().data.get("siteUrl", "")
        chat_url = Profile.load().data.get("chatbotUrl", "")
        registry = get_registry(AGENT_VERSION, *LOG_ARGS)
        today = (dt.datetime.utcnow() + dt.timedelta(hours=9)).date()  # 한국 날짜
        with st.form("make_invite", clear_on_submit=True):
            label = st.text_input("누구에게 보내나요?", placeholder="예: 카카오 인사팀", max_chars=40)
            until = st.date_input("언제까지 쓸 수 있나요? (그날 끝까지)", value=today + dt.timedelta(days=14), min_value=today)
            made = st.form_submit_button("초대 코드 만들기", use_container_width=True)
        if made:
            if not label.strip():
                st.error("누구에게 보내는지 적어 주세요.")
            else:
                taken = set(registry.load(force=True)) if registry else set()
                code, invite_id = signer.make_short(until.isoformat())
                while invite_id in taken:  # id 가 겹치면 다시 뽑는다
                    code, invite_id = signer.make_short(until.isoformat())
                saved = registry.add(invite_id, label.strip(), until.isoformat()) if registry else False
                st.session_state.last_made = (label.strip(), until.isoformat(), invite_id, code, saved)
                print(f"[admin] 초대 코드 생성: '{label.strip()}' ~{until.isoformat()} (id {invite_id})", flush=True)

        def show_invite(lb: str, exp: str, invite_id: str, code: str) -> None:
            st.markdown(f"**{lb}** · {exp}까지 · id `{invite_id}`")
            st.caption("초대 코드 (직접 알려 줄 때)")
            st.code(code, language=None)
            if site:
                st.caption("포트폴리오 링크 (누르면 바로 들어와요)")
                st.code(f"{site}?code={code}", language=None)
            st.caption("챗봇 바로가기")
            st.code(f"{chat_url}/?code={code}", language=None)

        if st.session_state.get("last_made"):
            lb, exp, invite_id, code, saved = st.session_state.last_made
            with st.container(border=True):
                st.success("만들었어요! 아래 코드나 링크를 복사해서 보내세요.")
                show_invite(lb, exp, invite_id, code)
                if not saved:
                    st.caption("⚠️ 초대 목록 저장소(LOG_REPO)가 없어 이름이 저장되지 않았어요. 대화 기록에는 '초대 " + invite_id + "'로 보여요.")

        st.markdown("##### 보낸 초대 목록")
        if not registry:
            st.caption("`LOG_GITHUB_TOKEN`, `LOG_REPO` 를 넣으면 보낸 초대가 여기에 쌓여요.")
        else:
            usage = get_quota(QUESTIONS_PER_CODE, AGENT_VERSION)
            items = sorted(
                ((k, v) for k, v in registry.load().items() if not v.get("deleted")),
                key=lambda kv: kv[1].get("created", ""),
                reverse=True,
            )
            if not items:
                st.caption("아직 없어요.")
            for invite_id, info in items:
                exp, lb = info.get("expires", ""), info.get("label", "")
                if info.get("revoked"):
                    state = "⛔ 막음"
                elif exp < today.isoformat():
                    state = "⌛ 끝남"
                else:
                    state = "✅ 사용 중"
                used = QUESTIONS_PER_CODE - usage.remaining("id:" + invite_id)
                with st.expander(f"{state} · {lb} · {exp}까지 · 질문 {used}/{QUESTIONS_PER_CODE}"):
                    show_invite(lb, exp, invite_id, signer.make_short(exp, invite_id)[0])
                    st.caption(f"만든 때 {info.get('created', '-')}" + (f" · 바꾼 때 {info['changed']}" if info.get("changed") else ""))
                    col1, col2 = st.columns(2)
                    if info.get("revoked"):
                        if col1.button("다시 허용", key=f"restore-{invite_id}", use_container_width=True):
                            registry.set_revoked(invite_id, False)
                            print(f"[admin] 초대 다시 허용: '{lb}' (id {invite_id})", flush=True)
                            st.rerun()
                    elif col1.button("⛔ 막기", key=f"revoke-{invite_id}", use_container_width=True):
                        registry.set_revoked(invite_id, True)
                        print(f"[admin] 초대 막음: '{lb}' (id {invite_id})", flush=True)
                        st.rerun()
                    with col2.popover("🗑️ 삭제", use_container_width=True):
                        st.caption("목록에서 지우고 이 코드도 막아요. 되돌릴 수 없어요.")
                        if st.button("정말 삭제", key=f"delete-{invite_id}", type="primary", use_container_width=True):
                            registry.delete(invite_id)
                            print(f"[admin] 초대 삭제: '{lb}' (id {invite_id})", flush=True)
                            st.rerun()
        st.caption(
            "코드 오른쪽 위 복사 버튼으로 복사해요. 막으면 바로 적용되고, 이미 들어와 있던 사람도 다음 질문부터 막혀요. "
            "질문 수는 서버가 다시 켜지면 0부터 다시 세요."
        )

    with tab_logs:
        conv_log = get_logger(AGENT_VERSION, *LOG_ARGS)
        if conv_log is None:
            st.info("Secrets 에 `LOG_GITHUB_TOKEN` 과 `LOG_REPO` 를 넣으면 대화 기록이 여기에 보여요.")
        else:
            if st.button("새로고침", use_container_width=True):
                st.session_state.pop("log_paths", None)
            if "log_paths" not in st.session_state:
                with st.spinner("기록을 불러오는 중…"):
                    st.session_state.log_paths = conv_log.recent()
            paths = st.session_state.log_paths
            if not paths:
                st.caption("아직 기록이 없어요.")
            else:
                pick = st.selectbox(
                    f"최근 대화 {len(paths)}개 (최신순)",
                    paths,
                    format_func=lambda p: p.split("/")[-1].rsplit("_", 1)[0].replace("_", " · ", 1),
                )
                with st.container(border=True):
                    st.markdown(conv_log.read(pick))
                st.caption(f"GitHub 앱의 `{conv_log.repo}` 저장소에서도 같은 파일을 볼 수 있어요.")
    st.stop()

if PORTFOLIO_URL:
    st.markdown(f"[← 포트폴리오로 돌아가기]({PORTFOLIO_URL})")
st.markdown('<p class="hero-title">💬 진용님에 대해 물어보세요</p>', unsafe_allow_html=True)
st.markdown(
    '<p class="hero-sub"><b>질문에 답하고, 필요하면 연락까지 이어주는 에이전트</b><br>'
    "경력·프로젝트 자료를 직접 찾아보고 답하며, 원하시면 진용님에게 메시지도 전해 드려요.</p>",
    unsafe_allow_html=True,
)

# ---- 초대 코드 확인: 링크의 ?code=... 또는 직접 입력
access = get_access(ACCESS_CODES, CODE_TTL_HOURS, AGENT_VERSION, INVITE_SECRET, REVOKED_INVITES, LOG_ARGS)
quota = get_quota(QUESTIONS_PER_CODE, AGENT_VERSION)
conv_log = get_logger(AGENT_VERSION, *LOG_ARGS)
EXPIRED_TEXT = "⌛ 이 초대 코드는 사용 기간이 끝났어요. 다시 이용하고 싶으시면 아래 이메일로 연락 주세요."


def admit(code: str, how: str) -> None:
    st.session_state.access_code = code
    # Streamlit Cloud 로그(Manage app → Logs)에서 누가 썼는지 볼 수 있다. 코드 값은 남기지 않는다.
    print(f"[access] '{access.label(code)}' 입장({how})", flush=True)


if access.enabled:
    held = st.session_state.get("access_code")
    if held and not access.still_valid(held):  # 열어 둔 탭에서 기간이 끝난 경우
        st.session_state.pop("access_code")
        st.session_state.code_status = "expired"
    if not st.session_state.get("access_code"):
        status = st.session_state.get("code_status")
        if status is None and st.query_params.get("code"):
            status, code = access.enter(st.query_params.get("code"))
            if code:
                admit(code, "링크")
            st.session_state.code_status = status
    if not st.session_state.get("access_code"):
        tries = st.session_state.get("code_tries", 0)
        if st.session_state.get("code_status") == "expired":
            st.warning(EXPIRED_TEXT)
        else:
            st.info("🔒 초대받은 분만 사용할 수 있어요. 받으신 **초대 코드**를 입력해 주세요.")
        if tries >= MAX_CODE_TRIES:
            st.error("코드를 여러 번 잘못 입력했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.")
        else:
            with st.form("code"):
                # 비밀번호 칸은 휴대폰에서 붙여넣기가 막히는 경우가 있어 일반 칸을 쓴다
                given = st.text_input(
                    "초대 코드", max_chars=400, placeholder="예: K7F2-Q9MX-AB3D (받은 링크를 통째로 붙여 넣어도 돼요)"
                )
                if st.form_submit_button("입장하기", use_container_width=True):
                    status, code = access.enter(given)
                    st.session_state.code_status = status
                    if code:
                        admit(code, "직접 입력")
                        st.rerun()
                    st.session_state.code_tries = tries + 1
                    if status == "expired":
                        st.warning(EXPIRED_TEXT)
                    elif status == "busy":
                        st.error("지금 확인 요청이 많아요. 잠시 후 다시 시도해 주세요.")
                    else:
                        st.error("코드가 맞지 않아요. 다시 확인해 주세요.")
        email = Profile.load().data.get("contact", {}).get("email", "")
        st.caption(f"코드가 없으신가요? {email} 로 연락 주시면 보내 드릴게요.")
        st.stop()

has_key = bool(resolve_api_key())
agent = get_agent(AGENT_VERSION) if has_key else None
if agent is None:
    st.warning(f"API 키({' 또는 '.join(KEY_NAMES)})가 설정되지 않아 답변을 할 수 없어요. chatbot/README.md 를 참고해 설정해 주세요.")

if "chat" not in st.session_state:
    st.session_state.chat = ChatSession()
    st.session_state.history = []  # 화면에 보여 줄 (역할, 글) 목록
chat: ChatSession = st.session_state.chat
history: list[tuple[str, str]] = st.session_state.history

with st.chat_message("assistant", avatar="🧑‍💻"):
    st.markdown(GREETING)

for role, text in history:
    with st.chat_message(role, avatar="🧑‍💻" if role == "assistant" else None):
        st.markdown(text)

clicked = None
if not history:
    cols = st.columns(2)
    for i, q in enumerate(EXAMPLES):
        if cols[i % 2].button(q, key=f"ex{i}", disabled=agent is None):
            clicked = q

typed = st.chat_input("질문을 입력하세요 (예: Spring Boot 경험 알려줘)", disabled=agent is None, max_chars=1000)
question = typed or clicked

if question and agent is not None:
    history.append(("user", question))
    with st.chat_message("user"):
        st.markdown(question)
    with st.chat_message("assistant", avatar="🧑‍💻"):
        quota_key = access.key(st.session_state["access_code"]) if access.enabled else None
        if access.enabled and not access.still_valid(st.session_state.get("access_code")):
            reply = "⌛ 초대 코드 사용 기간이 끝났어요. 페이지를 새로고침하면 안내가 나와요."
        elif quota_key and not quota.take(quota_key):
            reply = (
                f"이 초대 코드로 물어볼 수 있는 질문 {QUESTIONS_PER_CODE}개를 모두 쓰셨어요. "
                "더 궁금한 점은 이메일로 연락 주시거나, '메시지 남기기'가 필요하시면 진용님께 직접 연락 부탁드려요 🙏"
            )
        elif not get_budget().take():
            if quota_key:
                quota.refund(quota_key)
            reply = "오늘 받을 수 있는 질문 수를 모두 채웠어요. 내일 다시 찾아 주시거나 이메일로 연락해 주세요 🙏"
        else:
            before, tools_before = chat.turn, len(chat.tool_log)
            with st.spinner("자료를 찾아보는 중이에요…"):
                reply = agent.answer(chat, question)
            if quota_key and chat.turn == before:  # 답변에 실패한 질문은 세지 않는다
                quota.refund(quota_key)
            if conv_log and chat.turn > before:  # 답변한 질문만 기록한다 (연락처는 가려서)
                if "log_conv" not in st.session_state:
                    st.session_state.log_conv = conv_log.new_conversation(
                        access.label(st.session_state.access_code) if access.enabled else "공개", quota_key
                    )
                conv_log.add_turn(st.session_state.log_conv, question, reply, chat.tool_log[tools_before:])
            if access.enabled:
                print(
                    f"[access] '{access.label(st.session_state.access_code)}' 질문 "
                    f"(남은 {quota.remaining(quota_key)}/{QUESTIONS_PER_CODE})",
                    flush=True,
                )
        st.markdown(reply)
    history.append(("assistant", reply))
    if clicked:
        st.rerun()  # 예시 버튼을 숨기기 위해 화면을 다시 그린다

left = MAX_USER_TURNS - chat.turn
if access.enabled and st.session_state.get("access_code"):
    left = min(left, quota.remaining(access.key(st.session_state.access_code)))
st.markdown(
    '<p class="foot">AI가 자료를 바탕으로 답하지만 틀릴 수 있어요. 중요한 내용은 직접 확인해 주세요 · '
    + (f"남은 질문 {left}개" if not conv_log else f"남은 질문 {left}개<br>더 나은 답변을 위해 질문과 답변이 기록돼요 (이메일·전화번호는 가려서 저장)")
    + "</p>",
    unsafe_allow_html=True,
)
