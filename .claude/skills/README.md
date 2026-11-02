# 이 저장소에서 쓰는 Claude Code 스킬

이 저장소로 여는 Claude Code 세션(클라우드·PC)에서 자동으로 쓸 수 있습니다. 말로 부르면 됩니다.

| 스킬 | 하는 일 | 출처 (라이선스) |
|---|---|---|
| `ui-ux-pro-max` | UI/UX 점검·개선: 접근성, 터치 영역, 반응형, 색·타이포, 애니메이션. 로컬 데이터 검색(외부 전송 없음) | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) @ `3a13158` (MIT) |
| `karpathy-guidelines` | 코딩 원칙: 먼저 생각하기, 단순하게, 필요한 곳만 고치기, 검증 가능한 목표 | [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) @ `2c60614` (MIT) |

예: "ui-ux-pro-max로 사이트 접근성이랑 모바일 점검해줘", "karpathy 원칙대로 고쳐줘"

## 원본과 다른 점
- `ui-ux-pro-max/SKILL.md`: 플러그인용 스크립트 경로(`${CLAUDE_PLUGIN_ROOT}/...`)를 저장소 기준
  `$(git rev-parse --show-toplevel)/.claude/skills/ui-ux-pro-max/scripts/search.py` 로 바꿨습니다.
- `ui-ux-pro-max/scripts/tests` 는 뺐습니다(스킬 동작에는 필요 없음).

업데이트할 때는 원본 저장소에서 같은 폴더를 다시 복사하고 위 경로만 다시 바꾸면 됩니다.
