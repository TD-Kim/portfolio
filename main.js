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
  const fine = matchMedia("(pointer: fine)").matches;

  /* ---------- render content ---------- */
  document.title = `${D.name} | Portfolio`;
  $$("[data-name]").forEach((el) => (el.textContent = D.name));
  $$("[data-name-en]").forEach((el) => (el.textContent = D.nameEn));
  $("[data-tagline]").textContent = D.tagline;
  $("[data-year]").textContent = new Date().getFullYear();

  // 페이지에는 요약만 보여 주고, 자세한 내용은 챗봇이 답합니다.
  $(".about-text").innerHTML =
    `<p>${esc(D.about[0])}</p>` +
    `<p>자세한 경험과 프로젝트 이야기는 <button type="button" class="link-btn" data-ask>챗봇에게 물어보세요 →</button></p>`;
  $(".stats").innerHTML = D.stats
    .map((s) => `<div class="stat"><b data-count="${s.value}" data-suffix="${esc(s.suffix)}">0</b><span>${esc(s.label)}</span></div>`)
    .join("");
  const skills = D.skills.map((s) => `<span>${esc(s)}</span>`).join("");
  // 두 번 반복해서 끊김 없이 흐르게. 두 번째 묶음은 화면 읽기 프로그램이 두 번 읽지 않게 숨긴다
  $(".marquee-track").innerHTML = skills + skills.replace(/<span>/g, '<span aria-hidden="true">');

  // 링크가 있으면 <a>, 없으면 <article> 카드
  const card = (p, i) => {
    const meta = [p.period, p.org].filter(Boolean).map(esc).join(" · ");
    const inner = `
        <span class="card-num">${String(i + 1).padStart(2, "0")}${meta ? ` <span class="card-meta">${meta}</span>` : ""}</span>
        ${p.status ? `<span class="badge">${esc(p.status)}</span>` : ""}
        ${p.link ? '<span class="card-arrow">↗</span>' : ""}
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.summary || p.desc)}</p>
        <div class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>`;
    return p.link
      ? `<a class="card reveal" href="${esc(p.link)}" target="_blank" rel="noopener">${inner}</a>`
      : `<article class="card reveal">${inner}</article>`;
  };
  $(".projects:not(.learning)").innerHTML = D.projects.map(card).join("");
  $(".projects.learning").innerHTML = D.learning.map(card).join("");

  $(".creds-list").innerHTML = D.credentials
    .map((c) => `<li><span class="mono">${esc(c.year)}</span><b>${esc(c.title)}</b>${c.desc ? `<small>${esc(c.desc)}</small>` : ""}</li>`)
    .join("");

  $(".timeline").innerHTML = D.experience
    .map(
      (e) => `
      <li class="reveal">
        <span class="period">${esc(e.period)}</span>
        <h3>${esc(e.title)}<small>${esc(e.org)}</small></h3>
        <p>${esc(e.desc)}</p>
      </li>`
    )
    .join("");

  const email = $("[data-email]");
  email.textContent = D.contact.email;
  email.href = `mailto:${D.contact.email}`;
  $(".contact-links").innerHTML = D.contact.links
    .map((l) => `<a class="btn btn-ghost magnetic" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
    .join("");

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

  /* ---------- typing effect ---------- */
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
        if (r === 0 && rounds >= 2) return caret.classList.add("done"); // 두 바퀴 뒤 첫 직함에서 멈춘다
        del = true; delay = 1600;
      } else if (del && c === 0) {
        del = false; r = (r + 1) % D.roles.length; delay = 300;
        if (r === 0) rounds++;
      }
      setTimeout(tick, delay);
    };
    tick();
  }

  /* ---------- scroll reveal + counters ---------- */
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = (String(target).split(".")[1] || "").length;
    const suffix = el.dataset.suffix;
    if (reduced) return (el.textContent = target.toFixed(decimals) + suffix);
    const start = performance.now();
    const step = (t) => {
      const k = Math.min((t - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-count]", e.target).forEach(countUp);
      io.unobserve(e.target);
    }),
    { threshold: 0.15 }
  );
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    io.observe(el);
  });

  /* ---------- scroll progress, active nav, timeline fill ---------- */
  const progress = $(".progress");
  const timeline = $(".timeline");
  const navLinks = $$(".nav nav a");
  const sections = navLinks.map((a) => $(a.getAttribute("href")));
  const onScroll = () => {
    const h = document.documentElement;
    progress.style.transform = `scaleX(${h.scrollTop / (h.scrollHeight - h.clientHeight || 1)})`;

    const tr = timeline.getBoundingClientRect();
    const fill = Math.min(Math.max((innerHeight * 0.6 - tr.top) / tr.height, 0), 1);
    timeline.style.setProperty("--fill", fill.toFixed(3));

    let current = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
    navLinks.forEach((a, i) => a.classList.toggle("active", i === current));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- pointer effects (desktop only) ---------- */
  if (fine && !reduced) {
    const glow = $(".cursor-glow");
    addEventListener("pointermove", (e) => {
      glow.style.opacity = 1;
      glow.style.transform = `translate(${e.clientX - 210}px, ${e.clientY - 210}px)`;
    });

    // 3D tilt + spotlight on cards
    $$(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
        card.style.transform = `rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 10}deg)`;
      });
      card.addEventListener("pointerleave", () => (card.style.transform = ""));
    });

    // magnetic buttons
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- particle network background ---------- */
  const canvas = $("#bg");
  const ctx = canvas.getContext("2d");
  let W, H, pts = [], mouse = { x: -9999, y: -9999 };
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(Math.floor((W * H) / 14000), 110);
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
    }));
  };
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  resize();

  const LINK = 130;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      if (!html.classList.contains("still")) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 140 && d > 0) { p.x += (dx / d) * 1.2; p.y += (dy / d) * 1.2; } // 마우스 피하기
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      ctx.fillStyle = "rgba(160,150,255,0.7)";
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(124,92,255,${(1 - d / LINK) * 0.35})`;
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
})();
