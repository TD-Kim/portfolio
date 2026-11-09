(async () => {
  // 사이트와 챗봇이 같은 data.json 을 읽습니다.
  const D = await fetch("data.json").then((r) => r.json());
  // ?admin 은 index.html 맨 위에서 화면을 그리기 전에 챗봇 관리자 페이지로 보낸다. 여기서는 아무것도 하지 않는다.
  if (new URLSearchParams(location.search).has("admin")) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 움직임 멈추기: 동작 줄이기 설정이 없어도 누구나 버튼으로 멈출 수 있다 (WCAG 2.2.2)
  let still = reduced;
  try { still = still || localStorage.getItem("portfolio-still") === "1"; } catch {}
  const html = document.documentElement;
  html.classList.toggle("still", still);

  /* ---------- render content ---------- */
  document.title = `${D.name} | Portfolio`;
  $$("[data-name]").forEach((el) => (el.textContent = D.name));
  $$("[data-name-en]").forEach((el) => (el.textContent = D.nameEn));
  $("[data-tagline]").textContent = D.tagline;
  $("[data-year]").textContent = new Date().getFullYear();

  // 페이지에는 요약만 보여 주고, 자세한 내용은 챗봇이 답합니다.
  $(".about-text").innerHTML =
    `<p>${esc(D.about[0])}</p>` +
    `<p>자세한 경험과 프로젝트 이야기는 <button type="button" class="link-btn" data-ask>챗봇에게 물어보세요</button></p>`;
  $(".stats").innerHTML = D.stats
    .map((s) => `<div class="stat"><dt>${esc(s.label)}</dt><dd>${esc(s.value + s.suffix)}</dd></div>`)
    .join("");
  $(".skills").innerHTML = D.skills
    .map((s, i) => `<li><button type="button" class="skill" aria-pressed="false" data-skill="${i}">${esc(s)}</button></li>`)
    .join("");

  /* ---------- 프로젝트 ↔ 경력기술서 연결 ---------- */
  // 카드 제목과 경력기술서 제목이 조금씩 달라서(괄호, 어순) 3글자 이상 단어가 2개 이상 겹치면 같은 프로젝트로 본다
  const norm = (t) => String(t).toLowerCase().replace(/[\s()·]/g, "");
  const detailOf = (p) => {
    const words = p.title.split(/[\s()·]+/).filter((w) => w.length >= 3);
    let best = null, score = 1;
    for (const c of D.careerDetails || []) {
      const t = norm(c.title);
      const n = words.filter((w) => t.includes(norm(w))).length;
      if (n > score) { best = c; score = n; }
    }
    return best;
  };
  const details = D.projects.map(detailOf);

  // 펼쳤을 때 보여 줄 맡은 일 3개: 기술 이름·괄호가 들어간 구체적인 줄을 먼저 고르고, 원래 순서대로 보여 준다.
  // 나머지는 챗봇에게 물어보게 한다.
  const highlights = (c) => {
    const score = (d) => (/[()]|[A-Za-z]{3,}/.test(d) ? 1000 : 0) + d.length - (/보조/.test(d) ? 2000 : 0); // 보조 업무는 뒤로
    const top = c.duties.map((d, k) => ({ d, k })).sort((a, b) => score(b.d) - score(a.d)).slice(0, 3);
    return top.sort((a, b) => a.k - b.k).map((x) => x.d);
  };

  // 링크가 있으면 <a>, 없으면 <article> 카드. 경력기술서가 있는 프로젝트는 누르면 아래로 펼쳐진다
  const card = (p, i, list) => {
    const meta = [p.period, p.org].filter(Boolean).map(esc).join(" · ");
    const right = p.status ? `<span class="badge">${esc(p.status)}</span>` : p.link ? '<span class="card-arrow">↗</span>' : "";
    const c = list === "projects" && details[i];
    const more = c
      ? `<button type="button" class="more" aria-expanded="false" aria-controls="more-${i}">맡은 일 보기 <span class="chev" aria-hidden="true">⌄</span></button>
         <div class="card-more" id="more-${i}" hidden>
           <p class="cmd"><span class="prompt">$</span> head -3 projects/${String(i + 1).padStart(2, "0")}.md</p>
           <ul class="duties">${highlights(c).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
           <p class="more-left">외 ${c.duties.length - Math.min(3, c.duties.length)}가지 일을 더 했어요. 어떻게, 어디까지 했는지는 챗봇이 자세히 답해 드려요</p>
           <button type="button" class="btn btn-primary more-ask" data-ask>💬 이 프로젝트 챗봇에게 물어보기</button>
         </div>`
      : "";
    const inner = `
        <span class="card-top"><span>${String(i + 1).padStart(2, "0")}${meta ? ` <span class="card-meta">${meta}</span>` : ""}</span>${right}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.summary || p.desc)}</p>
        <div class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>${more}`;
    return p.link
      ? `<a class="card reveal" href="${esc(p.link)}" target="_blank" rel="noopener">${inner}</a>`
      : `<article class="card reveal" id="${list === "projects" ? `project-${i + 1}` : ""}">${inner}</article>`;
  };
  $(".projects:not(.learning)").innerHTML = D.projects.map((p, i) => card(p, i, "projects")).join("");
  $(".projects.learning").innerHTML = D.learning.map((p, i) => card(p, i, "learning")).join("");

  $(".creds-list").innerHTML = D.credentials
    .map((c) => `<li><span class="mono">${esc(c.year)}</span><b>${esc(c.title)}</b>${c.desc ? `<small>${esc(c.desc)}</small>` : ""}</li>`)
    .join("");

  // 경력은 배포 로그처럼: 맨 위(지금 다니는 곳)가 HEAD
  $(".log").innerHTML = D.experience
    .map(
      (e, i) => `
      <li class="reveal${i === 0 ? " head" : ""}">
        <span class="period">${esc(e.period)}</span>${i === 0 ? '<span class="head-tag">HEAD</span>' : ""}
        <h3>${esc(e.title)}</h3>
        <p>${esc(e.desc)}</p>
      </li>`
    )
    .join("");

  const email = $("[data-email]");
  email.textContent = D.contact.email;
  email.href = `mailto:${D.contact.email}`;
  $(".contact-links").insertAdjacentHTML(
    "beforeend",
    D.contact.links.map((l) => `<a class="btn btn-ghost" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")
  );

  /* ---------- chatbot: 초대 코드 확인 → 깨우는 중 안내 → 이동 ---------- */
  // 초대 코드는 링크(?code=...)로 받거나 직접 입력한다. 관리자 페이지에서 만든 코드(i1.내용.서명)는
  // 내용에 마감일이 들어 있어서, 그날까지만 이 브라우저에 기억한다. 날짜를 알 수 없는 코드
  // (ACCESS_CODES 로 만든 코드, 잘못 입력한 값)는 기억하지 않는다. 입장 여부는 항상 챗봇이 다시 확인한다.
  const STORE = "portfolio-invite";
  const kstToday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  // 짧은 코드(K7F2-Q9MX-AB3D)는 60비트 안에 마감일이 들어 있다(2024-01-01 부터 며칠째, 16비트).
  const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const normShort = (c) => {
    const t = String(c).toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
    return t.length === 12 && [...t].every((ch) => B32.includes(ch)) ? t : null;
  };
  const untilOf = (c) => {
    try {
      const short = normShort(c);
      if (short) {
        let n = 0n;
        for (const ch of short) n = (n << 5n) | BigInt(B32.indexOf(ch));
        const day = Number((n >> 28n) & 0xffffn);
        return new Date(Date.UTC(2024, 0, 1) + day * 86400e3).toISOString().slice(0, 10);
      }
      const parts = c.split(".");
      if (parts.length !== 3 || parts[0] !== "i1") return null;
      const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0)));
      const e = JSON.parse(json).e;
      return /^\d{4}-\d{2}-\d{2}$/.test(e) ? e : null;
    } catch {
      return null;
    }
  };
  // 입력칸에 링크를 통째로 붙여 넣어도 code 값만 꺼내고, 짧은 코드는 보기 좋은 형태로 맞춘다
  const cleanCode = (text) => {
    let c = String(text || "").trim();
    try {
      if (c.includes("code=")) c = new URL(c, location.href).searchParams.get("code") || c;
    } catch {}
    const short = normShort(c);
    return short ? `${short.slice(0, 4)}-${short.slice(4, 8)}-${short.slice(8)}` : c;
  };
  const saveCode = (c) => {
    const until = untilOf(c);
    try {
      if (until && until >= kstToday()) localStorage.setItem(STORE, JSON.stringify({ code: c, until }));
    } catch {}
  };
  const loadCode = () => {
    try {
      const v = JSON.parse(localStorage.getItem(STORE) || "null");
      if (v && v.code && v.until >= kstToday()) return v.code;
      localStorage.removeItem(STORE);
    } catch {}
    return null;
  };

  const params = new URLSearchParams(location.search);
  let code = params.get("code");
  if (code) {
    saveCode(code);
    // 주소창에서 코드를 지워서, 이 화면 주소를 복사해 남에게 보내도 코드가 같이 가지 않게 한다
    params.delete("code");
    const rest = params.toString();
    history.replaceState(null, "", location.pathname + (rest ? "?" + rest : "") + location.hash);
  } else {
    code = loadCode();
  }

  /* ---------- 방문 통계 (GoatCounter) ---------- */
  // 코드 자체는 보내지 않는다. 짧은 코드의 앞 16비트(초대 번호, 예: 2ea9)만 보내고,
  // 번호와 받은 사람 이름의 연결은 비공개 기록 저장소의 invites.json 에만 있다.
  const inviteIdOf = (c) => {
    try {
      const short = normShort(c);
      if (short) {
        let n = 0n;
        for (const ch of short) n = (n << 5n) | BigInt(B32.indexOf(ch));
        return (n >> 44n).toString(16).padStart(4, "0");
      }
      const parts = String(c).split(".");
      if (parts.length === 3 && parts[0] === "i1") {
        const json = new TextDecoder().decode(
          Uint8Array.from(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")), (ch) => ch.charCodeAt(0))
        );
        const id = JSON.parse(json).n;
        return /^[0-9a-f]{4,12}$/.test(id) ? id : null;
      }
    } catch {}
    return null;
  };
  const gcQueue = [];
  const track = (opts) => {
    const gc = window.goatcounter;
    if (gc && gc.count) {
      try { gc.count(opts); } catch {}
    } else gcQueue.push(opts);
  };
  $("#gc-script")?.addEventListener("load", () => gcQueue.splice(0).forEach(track));
  // 주소에서 ?code= 를 지운 뒤라 코드가 통계에 남지 않는다. 채용 앱 안에서 열면 출처가 비는 일이 많아서
  // 링크에 ?ref=saramin 처럼 붙여 두면 그 값을 출처로 쓴다.
  const ref = (params.get("ref") || params.get("utm_source") || "").slice(0, 40);
  track(ref ? { path: location.pathname, referrer: ref } : { path: location.pathname });
  const visitId = code && inviteIdOf(code);
  if (visitId) {
    try {
      // 같은 탭에서 새로고침할 때마다 세지 않게 한 번만
      if (!sessionStorage.getItem("portfolio-invite-seen")) {
        sessionStorage.setItem("portfolio-invite-seen", "1");
        track({ path: `invite/${visitId}`, title: "초대 링크로 방문", event: true });
      }
    } catch {
      track({ path: `invite/${visitId}`, title: "초대 링크로 방문", event: true });
    }
  }

  const wake = $(".wake:not(.gate)");
  const go = $("[data-wake-go]");
  const gate = $(".gate");
  const gateInput = $("[data-gate-input]");
  const chatUrlFor = (c) => {
    const u = new URL(D.chatbotUrl);
    if (c) u.searchParams.set("code", c);
    return u.href;
  };
  $("[data-gate-request]").href =
    `mailto:${D.contact.email}?subject=${encodeURIComponent("포트폴리오 챗봇 초대 코드 요청")}` +
    `&body=${encodeURIComponent("안녕하세요, 포트폴리오를 보고 연락드립니다.\n\n회사/이름: \n")}`;

  $("[data-gate-request]").addEventListener("click", () =>
    track({ path: "code-request", title: "초대 코드 요청 메일", event: true })
  );

  let wakeTimer, opener = null;
  const outside = () => $$("body > header, body > main, body > footer, body > .ask-fab");
  const focusables = (d) =>
    $$("a[href], button:not([disabled]), input:not([disabled])", d).filter((e) => e.offsetParent !== null);
  const openDialog = (d, first) => {
    if (!opener) opener = document.activeElement;
    [gate, wake].forEach((x) => (x.hidden = x !== d));
    outside().forEach((x) => (x.inert = true)); // 뒤쪽 페이지는 눌리지도, 포커스되지도 않게
    (first || focusables(d)[0])?.focus();
  };
  const closeAll = () => {
    clearTimeout(wakeTimer);
    wake.hidden = gate.hidden = true;
    outside().forEach((x) => (x.inert = false));
    if (opener && document.contains(opener)) opener.focus(); // 연 버튼으로 포커스를 돌려준다
    opener = null;
  };
  const openChat = () => {
    const id = code && inviteIdOf(code);
    track({ path: id ? `chat-open/${id}` : "chat-open", title: "챗봇 열기", event: true });
    go.href = chatUrlFor(code);
    openDialog(wake, go);
    // 안내는 기다리게 하려는 게 아니라 다음 화면이 뜰 때까지만 보인다. 그려질 틈만 주고 바로 이동한다
    wakeTimer = setTimeout(() => (location.href = go.href), 50);
  };
  const gateError = $("[data-gate-error]");
  $$("[data-ask]").forEach((b) =>
    b.addEventListener("click", () => {
      if (code) return openChat();
      // 코드가 없으면 서버를 깨우며 기다리게 하지 않고 여기서 바로 안내한다
      gateInput.value = "";
      gateError.hidden = true;
      gateInput.removeAttribute("aria-invalid");
      track({ path: "gate-open", title: "코드 없이 챗봇 버튼", event: true });
      openDialog(gate, gateInput);
    })
  );
  $(".gate form").addEventListener("submit", (e) => {
    e.preventDefault();
    const c = cleanCode(gateInput.value);
    if (!c) {
      gateError.hidden = false; // 빈칸으로 누르면 칸 바로 아래에 안내한다
      gateInput.setAttribute("aria-invalid", "true");
      return gateInput.focus();
    }
    code = c;
    saveCode(c); // 마감일이 든 코드만 기억된다. 맞는 코드인지는 챗봇이 확인한다
    openChat();
  });
  $$("[data-wake-cancel], [data-gate-close]").forEach((b) => b.addEventListener("click", closeAll));
  // 챗봇에서 뒤로 가기로 돌아오면 브라우저가 이전 화면을 그대로 보여 주므로, 안내가 남아 있지 않게 닫는다
  addEventListener("pageshow", (e) => { if (e.persisted && !wake.hidden) closeAll(); });
  addEventListener("keydown", (e) => {
    const d = [gate, wake].find((x) => !x.hidden);
    if (!d) return;
    if (e.key === "Escape") return closeAll();
    if (e.key !== "Tab") return;
    const f = focusables(d);
    if (!f.length) return;
    const [first, last] = [f[0], f[f.length - 1]];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  addEventListener("pageshow", closeAll); // 뒤로 가기로 돌아왔을 때 안내창 닫기

  /* ---------- 공통: 아래에서 올라오는 창 (자세히 보기, 터미널) ---------- */
  // <dialog> 의 showModal 이 뒤쪽을 막고, Esc 로 닫히고, 포커스를 창 안에 가둔다
  const sheetOpener = new WeakMap();
  const openSheet = (dlg, focusEl) => {
    sheetOpener.set(dlg, document.activeElement);
    dlg.showModal();
    focusEl?.focus();
  };
  $$("dialog.sheet").forEach((dlg) => {
    dlg.addEventListener("close", () => sheetOpener.get(dlg)?.focus?.());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // 바깥(어두운 곳) 누르면 닫기
    $$("[data-sheet-close]", dlg).forEach((b) => b.addEventListener("click", () => dlg.close()));
  });
  // 창 안의 '물어보기' 버튼은 창을 닫고 챗봇으로 간다
  $$("dialog.sheet [data-ask]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close(), { capture: true }));

  /* ---------- 프로젝트 카드 펼치기 (아코디언) ---------- */
  const toggleCard = (cardEl, open) => {
    const btn = $(".more", cardEl), box = $(".card-more", cardEl);
    if (!btn) return;
    open = open ?? btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(open));
    btn.firstChild.textContent = open ? "접기 " : "맡은 일 보기 ";
    box.hidden = !open;
    cardEl.classList.toggle("open", open);
    if (open) track({ path: `detail/${cardEl.id.replace("project-", "")}`, title: "프로젝트 펼치기", event: true });
  };
  $$(".projects:not(.learning) .card").forEach((cardEl) => {
    // 카드 어디를 눌러도 펼쳐지고, 키보드는 '맡은 일 보기' 버튼으로 연다. 안쪽 버튼·글자 선택은 그대로 둔다
    cardEl.addEventListener("click", (e) => {
      if (e.target.closest("[data-ask]") || (e.target.closest("button") && !e.target.closest(".more"))) return;
      if (String(getSelection()).length) return;
      toggleCard(cardEl);
    });
  });
  // 기술 지도·터미널에서 프로젝트를 고르면 그 카드로 이동해서 펼친다
  const showDetail = (i) => {
    const cardEl = $(`#project-${i + 1}`);
    if (!cardEl) return;
    toggleCard(cardEl, true);
    cardEl.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    setTimeout(() => $(".more", cardEl)?.focus({ preventScroll: true }), reduced ? 0 : 400);
  };

  /* ---------- 기술 ↔ 프로젝트 연결 지도 ---------- */
  // 'Java' 가 'JavaScript' 에 걸리지 않게, 기술 이름 바로 뒤가 글자가 아닐 때만 같은 기술로 본다
  const usesSkill = (skill, items) => {
    const re = new RegExp("^" + skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![a-z])", "i");
    return items.some((t) => re.test(String(t).trim()));
  };
  const noteOf = (skill) =>
    (D.skillNotes || []).find((n) => n.skill.toLowerCase().split(/\s*·\s*/).some((part) => part === skill.toLowerCase()) || n.skill.toLowerCase() === skill.toLowerCase());
  const skillInfo = $(".skill-info");
  $$(".skill").forEach((b) =>
    b.addEventListener("click", () => {
      const on = b.getAttribute("aria-pressed") !== "true";
      $$(".skill").forEach((x) => x.setAttribute("aria-pressed", String(x === b && on)));
      $(".skills").classList.toggle("picking", on);
      if (!on) { skillInfo.hidden = true; return; }
      const skill = D.skills[Number(b.dataset.skill)];
      const used = D.projects
        .map((p, i) => ({ p, i }))
        .filter(({ p, i }) => usesSkill(skill, [...p.tags, ...(details[i]?.env || [])]));
      const note = noteOf(skill);
      skillInfo.innerHTML = `
        <p class="cmd"><span class="prompt">$</span> grep -r "${esc(skill)}" projects/</p>
        ${used.length
          ? `<ul class="hits">${used.map(({ p, i }) => `<li><button type="button" class="hit" data-detail="${i}">${esc(p.title)}<span class="mono">${esc(p.period || "")}</span></button></li>`).join("")}</ul>`
          : '<p class="no-hit">대표 프로젝트에는 없고, 아래 메모의 경험이 있어요</p>'}
        ${note ? `<p class="note"><b>어디까지</b> ${esc(note.did)}${note.level ? ` <span class="level">· ${esc(note.level)}</span>` : ""}</p>` : ""}`;
      skillInfo.hidden = false;
      $$("[data-detail]", skillInfo).forEach((h) => h.addEventListener("click", () => showDetail(Number(h.dataset.detail))));
      track({ path: `skill/${skill}`, title: "기술 지도", event: true });
    })
  );

  /* ---------- 이스터에그: 미니 터미널 ---------- */
  const termDlg = $("dialog.term");
  const termOut = $("[data-term-out]");
  const termIn = $("[data-term-in]");
  const print = (html, cls = "") => termOut.insertAdjacentHTML("beforeend", `<div class="${cls}">${html}</div>`);
  const pad = (s, n) => s + " ".repeat(Math.max(1, n - s.length));
  const commands = {
    help: () => print(
      ["whoami", "ls projects", "cat projects/01", "cat skills", "cat contact", "ask", "clear", "exit"]
        .map((c) => `<span class="cmd-name">${pad(c, 18)}</span>`).join("<br>") +
      '<br><span class="dim">↑ 키로 이전 명령, Tab 으로 자동 완성</span>'
    ),
    whoami: () => print(`${esc(D.name)} (${esc(D.nameEn)})<br><span class="dim">${esc(D.tagline)}</span>`),
    "ls projects": () => print(D.projects.map((p, i) => `<span class="cmd-name">${String(i + 1).padStart(2, "0")}</span>  ${esc(p.title)}  <span class="dim">${esc(p.period || "")}</span>`).join("<br>") + '<br><span class="dim">cat projects/01 처럼 번호로 열어 보세요</span>'),
    "cat skills": () => print(D.skills.map(esc).join("  ·  ")),
    "cat contact": () => print(`email   ${esc(D.contact.email)}<br>${D.contact.links.map((l) => `${esc(pad(l.label.toLowerCase(), 8))}${esc(l.url)}`).join("<br>")}`),
    ask: () => { termDlg.close(); $("[data-ask]").click(); },
    clear: () => (termOut.innerHTML = ""),
    exit: () => termDlg.close(),
    ls: () => commands["ls projects"](),
    "sudo hire jinyong": () => print('권한 확인 중… <span class="ok">승인</span>. 연락은 <span class="cmd-name">cat contact</span> 또는 <span class="cmd-name">ask</span> 로 해 주세요 🙂'),
  };
  const cmdHistory = [];
  let hIdx = 0;
  const run = (raw) => {
    const cmd = raw.trim().replace(/\s+/g, " ");
    print(`<span class="prompt">$</span> ${esc(cmd)}`, "echo");
    if (!cmd) return;
    cmdHistory.push(cmd); hIdx = cmdHistory.length;
    const m = cmd.match(/^cat projects\/0?(\d+)(\.md)?$/);
    if (m) {
      const i = Number(m[1]) - 1, p = D.projects[i], c = details[i];
      if (!p) return print(`cat: projects/${esc(m[1])}: 그런 프로젝트가 없어요 (ls projects)`, "err");
      print(`<b>${esc(p.title)}</b>  <span class="dim">${esc(p.period || "")}</span><br>` +
        (c ? c.duties.map((d) => `- ${esc(d)}`).join("<br>") : esc(p.desc)));
      return;
    }
    (commands[cmd.toLowerCase()] || (() => print(`${esc(cmd.split(" ")[0])}: 없는 명령이에요. help 를 입력해 보세요`, "err")))();
    termOut.scrollTop = termOut.scrollHeight;
  };
  const openTerm = () => {
    if (!termOut.childElementCount) {
      print(`${esc(D.nameEn)} 의 포트폴리오에 오신 걸 환영해요. <span class="cmd-name">help</span> 를 입력해 보세요`, "dim");
    }
    openSheet(termDlg, termIn);
    track({ path: "terminal", title: "터미널 열기", event: true });
  };
  $("[data-term-form]").addEventListener("submit", (e) => { e.preventDefault(); run(termIn.value); termIn.value = ""; termOut.scrollTop = termOut.scrollHeight; });
  termIn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && cmdHistory.length) { e.preventDefault(); hIdx = Math.max(0, hIdx - 1); termIn.value = cmdHistory[hIdx]; }
    else if (e.key === "ArrowDown" && cmdHistory.length) { e.preventDefault(); hIdx = Math.min(cmdHistory.length, hIdx + 1); termIn.value = cmdHistory[hIdx] || ""; }
    else if (e.key === "Tab" && termIn.value) {
      const hit = Object.keys(commands).find((c) => c.startsWith(termIn.value.toLowerCase()) && c !== "sudo hire jinyong");
      if (hit) { e.preventDefault(); termIn.value = hit; }
    }
  });
  $("[data-term-open]").addEventListener("click", openTerm);
  // ` 키로 열기 (글을 입력하는 중이거나 다른 창이 열려 있을 때는 무시)
  addEventListener("keydown", (e) => {
    if (e.key !== "`" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, [contenteditable]") || document.querySelector("dialog[open]") || !gate.hidden || !wake.hidden) return;
    e.preventDefault();
    openTerm();
  });

  /* ---------- 직함 타이핑: 두 바퀴 돌고 첫 직함에서 멈춘다 ---------- */
  const typed = $(".typed");
  const caret = $(".caret");
  const settle = () => { typed.textContent = D.roles[0]; caret.classList.add("done"); };
  if (still) settle();
  else {
    let r = 0, c = 0, del = false, rounds = 0;
    const tick = () => {
      if (html.classList.contains("still")) return settle();
      const word = D.roles[r];
      c += del ? -1 : 1;
      typed.textContent = word.slice(0, c);
      let delay = del ? 40 : 90;
      if (!del && c === word.length) {
        if (r === 0 && rounds >= 2) return caret.classList.add("done");
        del = true; delay = 1600;
      } else if (del && c === 0) {
        del = false; r = (r + 1) % D.roles.length; delay = 300;
        if (r === 0) rounds++;
      }
      setTimeout(tick, delay);
    };
    tick();
  }

  /* ---------- 배경: 천천히 움직이는 점과 선. 색은 강조색(--accent)을 옅게 ---------- */
  const canvas = $("#bg");
  const ctx = canvas.getContext("2d");
  const accentRgb = () => {
    const hex = getComputedStyle(html).getPropertyValue("--accent").trim().replace("#", "");
    const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
    return Number.isNaN(n) ? "242,178,76" : `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  };
  let rgb = accentRgb(), frame = 0;
  let W, H, pts = [], mouse = { x: -9999, y: -9999 };
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(Math.floor((W * H) / 16000), 90);
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    }));
  };
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  resize();
  const LINK = 130;
  const draw = () => {
    if (++frame % 30 === 0) rgb = accentRgb(); // 강조색이 바뀌면 따라간다
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      if (!html.classList.contains("still")) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 140 && d > 0) { p.x += (dx / d) * 1.2; p.y += (dy / d) * 1.2; } // 마우스 피하기
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      ctx.fillStyle = `rgba(${rgb},0.55)`;
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(${rgb},${(1 - d / LINK) * 0.22})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    if (!html.classList.contains("still")) requestAnimationFrame(draw);
  };
  draw();

  /* ---------- 움직임 멈추기 버튼 ---------- */
  const toggle = $("[data-still]");
  const syncToggle = () => {
    const on = html.classList.contains("still");
    toggle.setAttribute("aria-pressed", String(on));
    toggle.textContent = on ? "▶ 움직임 다시 켜기" : "⏸ 움직임 멈추기";
  };
  toggle.addEventListener("click", () => {
    const on = !html.classList.contains("still");
    html.classList.toggle("still", on);
    try { localStorage.setItem("portfolio-still", on ? "1" : "0"); } catch {}
    if (on) settle();
    else requestAnimationFrame(draw);
    syncToggle();
  });
  syncToggle();

  /* ---------- 등장 효과: 섹션마다 한 번, 짧게 ---------- */
  if (reduced || !("IntersectionObserver" in window)) {
    $$(".reveal").forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }),
      { threshold: 0.12 }
    );
    $$(".reveal").forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 50}ms`;
      io.observe(el);
    });
  }

  /* ---------- 지금 보고 있는 섹션을 메뉴에 표시 ---------- */
  const navLinks = $$(".nav nav a");
  const sections = navLinks.map((a) => $(a.getAttribute("href")));
  const onScroll = () => {
    let current = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
    navLinks.forEach((a, i) => a.classList.toggle("active", i === current));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
