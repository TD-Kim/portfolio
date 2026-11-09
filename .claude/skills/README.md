# 이 저장소에서 쓰는 Claude Code 스킬

이 저장소로 여는 Claude Code 세션(클라우드·PC)에서 자동으로 쓸 수 있습니다. 말로 부르면 됩니다.

| 스킬 | 하는 일 | 출처 (라이선스) |
|---|---|---|
| `ui-ux-pro-max` | UI/UX 점검·개선: 접근성, 터치 영역, 반응형, 색·타이포, 애니메이션. 로컬 데이터 검색(외부 전송 없음) | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) @ `3a13158` (MIT) |
| `karpathy-guidelines` | 코딩 원칙: 먼저 생각하기, 단순하게, 필요한 곳만 고치기, 검증 가능한 목표 | [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) @ `2c60614` (MIT) |
| `unslop` | AI가 만든 티 나는 화면(보라 그라데이션, 글로우, 이모지 라벨, 들쭉날쭉한 간격)을 찾아 간격·색·아이콘·문구·글꼴·레이아웃·디테일·비주얼·움직임 순서로 다듬기. 고치기 전에 진단과 방향을 먼저 보여 주고 확인받음 | [heydamir/unslop](https://github.com/heydamir/unslop) @ `97daa3e` (CC BY 4.0, 출처 표시 필수) |

예: "ui-ux-pro-max로 사이트 접근성이랑 모바일 점검해줘", "karpathy 원칙대로 고쳐줘", "unslop으로 챗봇 화면 진단해줘"

## 원본과 다른 점
- `ui-ux-pro-max/SKILL.md`: 플러그인용 스크립트 경로(`${CLAUDE_PLUGIN_ROOT}/...`)를 저장소 기준
  `$(git rev-parse --show-toplevel)/.claude/skills/ui-ux-pro-max/scripts/search.py` 로 바꿨습니다.
- `ui-ux-pro-max/scripts/tests` 는 뺐습니다(스킬 동작에는 필요 없음).
- `unslop`: 원본 그대로 복사했고, 출처와 라이선스를 `unslop/SOURCE.md`, `unslop/LICENSE` 에 남겼습니다.
  실시간 사이트 캡처(`scripts/snapshot.mjs`)와 영상(`scripts/story.mjs`)은 Playwright, ffmpeg 가 있어야 합니다.

업데이트할 때는 원본 저장소에서 같은 폴더를 다시 복사하고 위 경로만 다시 바꾸면 됩니다.
