"""김진용에게 질문하기 - Streamlit 챗봇 화면.

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

from agent import MAX_USER_TURNS, ChatSession, build_agent  # noqa: E402

st.set_page_config(page_title="김진용에게 질문하기", page_icon="💬", layout="centered")

PORTFOLIO_URL = os.environ.get("PORTFOLIO_URL", "")

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
def get_agent():
    return build_agent()


if PORTFOLIO_URL:
    st.markdown(f"[← 포트폴리오로 돌아가기]({PORTFOLIO_URL})")
st.markdown('<p class="hero-title">💬 김진용에게 질문하기</p>', unsafe_allow_html=True)
st.markdown(
    '<p class="hero-sub"><b>질문에 답하고, 필요하면 연락까지 이어주는 에이전트</b><br>'
    "경력·프로젝트 자료를 직접 찾아보고 답하며, 원하시면 진용님에게 메시지도 전해 드려요.</p>",
    unsafe_allow_html=True,
)

has_key = bool(os.environ.get("ANTHROPIC_API_KEY"))
agent = get_agent() if has_key else None
if agent is None:
    st.warning("ANTHROPIC_API_KEY 가 설정되지 않아 답변을 할 수 없어요. chatbot/README.md 를 참고해 설정해 주세요.")

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
        with st.spinner("자료를 찾아보는 중이에요…"):
            reply = agent.answer(chat, question)
        st.markdown(reply)
    history.append(("assistant", reply))
    if clicked:
        st.rerun()  # 예시 버튼을 숨기기 위해 화면을 다시 그린다

left = MAX_USER_TURNS - chat.turn
st.markdown(
    f'<p class="foot">AI가 자료를 바탕으로 답하지만 틀릴 수 있어요. 중요한 내용은 직접 확인해 주세요 · 남은 질문 {left}개</p>',
    unsafe_allow_html=True,
)
