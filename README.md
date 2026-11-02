# portfolio

김진용(Jinyong Kim)의 포트폴리오 사이트와 "저에 대해 물어보세요" 챗봇.

- 사이트: https://td-kim.github.io/portfolio/ (GitHub Pages, `main` 브랜치 루트)
- 챗봇: https://portfolio-c8vetzvd3jbl4tpdkdfjwx.streamlit.app (Streamlit Community Cloud, 초대 코드 필요)
- 초대 링크: 사이트 주소 뒤에 `?code=코드` 를 붙여 보내면 물어보기 버튼이 코드를 챗봇에 넘겨줍니다

- `index.html`, `style.css`, `main.js`: 포트폴리오 사이트 (빌드 없는 정적 사이트)
- `data.json`: 경력 자료. 사이트와 챗봇이 함께 씀
- `og.png`, `favicon.svg`: 링크 미리보기 이미지와 아이콘. `.nojekyll`: GitHub Pages 가 파일을 그대로 올리게 함
- `chatbot/`: Streamlit + Claude 챗봇 에이전트 ([설명](chatbot/README.md))

로컬 미리보기: `python3 -m http.server 8000` 후 http://localhost:8000
(`data.json`을 fetch 하므로 파일을 직접 열면 안 되고 서버로 띄워야 합니다)
