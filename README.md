# portfolio

김진용(Jinyong Kim)의 포트폴리오 사이트와 "김진용에게 질문하기" 챗봇.

- `index.html`, `style.css`, `main.js`: 포트폴리오 사이트 (빌드 없는 정적 사이트)
- `data.json`: 경력 자료. 사이트와 챗봇이 함께 씀
- `chatbot/`: Streamlit + Claude 챗봇 에이전트 ([설명](chatbot/README.md))

로컬 미리보기: `python3 -m http.server 8000` 후 http://localhost:8000
(`data.json`을 fetch 하므로 파일을 직접 열면 안 되고 서버로 띄워야 합니다)
