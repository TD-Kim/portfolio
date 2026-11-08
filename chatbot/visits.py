"""(portfolio-logs 저장소의 scripts/visits.py 와 같은 파일. 고칠 때는 둘 다 고친다.
관리자 페이지의 '오늘 방문'이 report() 를 그대로 쓴다.)

GoatCounter 에서 하루치 포트폴리오 사이트 방문 통계를 받아 visits/YYYY-MM/DD.md 로 남긴다.

    GOATCOUNTER_TOKEN=... python scripts/visits.py            # 어제(한국 시간)
    GOATCOUNTER_TOKEN=... python scripts/visits.py 2026-11-06 # 그날

- 토큰은 GoatCounter 설정 > API 에서 'Read statistics' 권한으로 만든다. 저장소 Secrets 에만 둔다.
- 모든 방문을 세고, 사이트가 보내는 단계 이벤트(gate-open, code-request, invite/<번호>, chat-open[/<번호>])로
  방문 → 챗봇 버튼 → 코드 요청 → 챗봇 이동 흐름을 보여 준다.
- 초대 번호는 invites.json 의 이름으로 바꿔 적는다.
- 그날 방문이 하나도 없으면 파일을 만들지 않는다.
- 표준 라이브러리만 쓴다.
"""

from __future__ import annotations

import datetime as dt
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parent.parent
KST = dt.timezone(dt.timedelta(hours=9))
SECTIONS = [("toprefs", "들어온 경로"), ("browsers", "브라우저"), ("systems", "OS"), ("locations", "지역")]  # 화면 크기는 이름이 비어 와서 뺐다

Fetch = Callable[[str, dict[str, str]], dict[str, Any]]


def http_get(url: str, headers: dict[str, str]) -> dict[str, Any]:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


class GoatCounter:
    def __init__(self, site: str, token: str, fetch: Fetch = http_get, tries: int = 4, wait: float = 30):
        self.tries, self.wait = tries, wait  # 404 다시 묻기 (관리자 화면은 짧게 준다)
        self.base = f"https://{site}.goatcounter.com/api/v0"
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        self.fetch = fetch

    def get(self, path: str, day: dt.date, **extra: Any) -> dict[str, Any]:
        start = dt.datetime.combine(day, dt.time(0, 0), KST)
        end = dt.datetime.combine(day, dt.time(23, 59, 59), KST)
        q = {"start": start.isoformat(), "end": end.isoformat(), **extra}
        return self.fetch(f"{self.base}{path}?{urllib.parse.urlencode(q)}", self.headers)

    def hits(self, day: dt.date, tries: int | None = None, sleep: Callable[[float], None] = time.sleep) -> list[dict[str, Any]]:
        """그날 경로별 방문. GoatCounter 가 방문이 있는 날에도 가끔 404 를 주므로(11/8 새벽 사례)
        404 는 잠깐 기다렸다 다시 묻는다. 끝까지 404 면 오류로 끝내서, 다음 실행이 다시 채우게 한다."""
        tries, wait = tries or self.tries, self.wait
        for i in range(tries):
            try:
                return self.get("/stats/hits", day, limit=100).get("hits", [])
            except urllib.error.HTTPError as e:
                if e.code != 404 or i == tries - 1:
                    raise
                print(f"{day}: /stats/hits 404, {wait:.0f}초 뒤 다시 시도 ({i + 1}/{tries})")
                sleep(wait)
        return []


def count_of(row: dict[str, Any]) -> int:
    # GoatCounter 버전에 따라 이름이 다르다
    return int(row.get("count", row.get("count_unique", 0)) or 0)


def load_labels() -> dict[str, str]:
    try:
        data = json.loads((ROOT / "invites.json").read_text(encoding="utf-8"))
        return {k: str(v.get("label", "")) for k, v in data.items()}
    except (OSError, ValueError):
        return {}


def table(rows: list[tuple[str, int]], head: str) -> list[str]:
    if not rows:
        return []
    return [f"| {head} | 방문 |", "|---|---:|", *[f"| {name or '(없음)'} | {n} |" for name, n in rows], ""]


def report(gc: GoatCounter, day: dt.date, labels: dict[str, str]) -> str | None:
    hits = gc.hits(day)
    print(f"GoatCounter 에서 받은 경로 {len(hits)}개: " + ", ".join(f"{h.get('path')}={count_of(h)}" for h in hits[:20]))
    pages = [(h.get("path", ""), count_of(h)) for h in hits if not h.get("event") and count_of(h)]
    events = [(h.get("path", ""), count_of(h)) for h in hits if h.get("event") and count_of(h)]
    if not pages and not events:
        return None

    invites: dict[str, dict[str, int]] = {}
    steps = {k: 0 for k in ("gate-open", "code-request", "invite", "chat-open")}
    other_events = []
    for path, n in events:
        kind, _, inv = path.partition("/")
        if kind not in steps:
            other_events.append((path, n))
            continue
        steps[kind] += n
        if inv and kind in ("invite", "chat-open"):
            invites.setdefault(inv, {"invite": 0, "chat-open": 0})[kind] += n

    lines = [f"# 사이트 방문 {day.isoformat()} (한국 시간)", ""]
    lines += [
        "| 단계 | 수 |", "|---|---:|",
        f"| 사이트 방문 (모든 방문자) | **{sum(n for _, n in pages)}** |",
        f"| 코드 없이 챗봇 버튼을 누름 | {steps['gate-open']} |",
        f"| 초대 코드 요청 메일 버튼을 누름 | {steps['code-request']} |",
        f"| 초대 링크·저장된 코드로 방문 | {steps['invite']} |",
        f"| 챗봇으로 이동 | {steps['chat-open']} |",
        "",
    ]
    lines += ["## 초대 링크", ""]
    if invites:
        lines += ["| 번호 | 받은 곳 | 사이트 방문 | 챗봇 열기 |", "|---|---|---:|---:|"]
        for inv, c in sorted(invites.items(), key=lambda x: -sum(x[1].values())):
            lines.append(f"| {inv} | {labels.get(inv) or '(목록에 없음)'} | {c['invite']} | {c['chat-open']} |")
        lines.append("")
    else:
        lines += ["초대 링크로 들어온 방문은 없었습니다.", ""]
    if other_events:
        lines += ["## 그 밖의 이벤트", "", *table(other_events, "이벤트")]
    lines += ["## 페이지", "", *table(pages, "주소")]
    for key, title in SECTIONS:
        try:
            stats = gc.get(f"/stats/{key}", day, limit=10).get("stats", [])
        except urllib.error.HTTPError as e:  # 부가 정보라 하나가 안 돼도 나머지는 남긴다
            print(f"{title}({key}) 건너뜀: HTTP {e.code}")
            continue
        empty = "직접 접속·앱 안에서 열기" if key == "toprefs" else "(알 수 없음)"
        rows = [(str(s.get("name") or empty), count_of(s)) for s in stats if count_of(s)]
        if rows:
            lines += [f"## {title}", "", *table(rows, title)]
    return "\n".join(lines).rstrip() + "\n"


def main(argv: list[str]) -> int:
    token = (os.environ.get("GOATCOUNTER_TOKEN") or "").strip()  # 붙여 넣을 때 딸려 온 공백·줄바꿈 제거
    if not token:
        print("GOATCOUNTER_TOKEN 이 없습니다. 저장소 Settings > Secrets 에 넣어 주세요.")
        return 2
    site = os.environ.get("GOATCOUNTER_SITE", "td-kim")
    gc, labels = GoatCounter(site, token), load_labels()
    if len(argv) > 1 and argv[1]:
        days = [dt.date.fromisoformat(argv[1])]
    else:
        # 어제 + 그 전 이틀 중 아직 파일이 없는 날. 한 번 실패해도 다음 실행이 채운다
        yesterday = dt.datetime.now(KST).date() - dt.timedelta(days=1)
        days = [d for d in (yesterday - dt.timedelta(days=n) for n in (2, 1, 0)) if not out_path(d).exists()]
    failed = 0
    for day in days:
        failed += record(gc, day, labels)
    return 1 if failed else 0


def out_path(day: dt.date) -> Path:
    return ROOT / "visits" / f"{day:%Y-%m}" / f"{day:%d}.md"


def record(gc: GoatCounter, day: dt.date, labels: dict[str, str]) -> int:
    """하루치를 저장한다. 실패하면 1."""
    site = gc.base.split("//")[1].split(".")[0]
    try:
        text = report(gc, day, labels)
    except urllib.error.HTTPError as e:
        hint = {
            401: "토큰이 맞지 않습니다. GoatCounter 설정 > API 에서 만든 토큰 전체를 Secret 에 다시 넣어 주세요.",
            403: "토큰에 'Read statistics' 권한이 없습니다. 권한을 켠 토큰을 새로 만들어 주세요.",
            404: "여러 번 다시 물어도 404 였습니다. GoatCounter 쪽 일시 문제일 수 있어 다음 실행이 다시 채웁니다.",
        }.get(e.code, "")
        where = urllib.parse.urlsplit(e.geturl() or "").path  # 토큰은 헤더에 있어 주소에 나오지 않는다
        try:
            body = e.read().decode()[:300]
        except Exception:
            body = ""
        print(f"{day}: GoatCounter API 오류 HTTP {e.code} ({where}). {hint}\n응답: {body}")
        return 1
    if text is None:
        print(f"{day}: 방문 없음, 파일을 만들지 않음")
        return 0
    out = out_path(day)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")
    print("저장:", out.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
