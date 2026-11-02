(async () => {
  // 사이트와 챗봇이 같은 data.json 을 읽습니다.
  const D = await fetch("data.json").then((r) => r.json());
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  $(".marquee-track").innerHTML = skills + skills; // 두 번 반복해서 끊김 없이 흐르게

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
  const untilOf = (c) => {
    try {
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

  let wakeTimer;
  const closeAll = () => { clearTimeout(wakeTimer); wake.hidden = true; gate.hidden = true; };
  const openChat = () => {
    gate.hidden = true;
    go.href = chatUrlFor(code);
    wake.hidden = false;
    go.focus();
    wakeTimer = setTimeout(() => (location.href = go.href), 2500); // 안내를 잠깐 보여 준 뒤 이동
  };
  $$("[data-ask]").forEach((b) =>
    b.addEventListener("click", () => {
      if (code) return openChat();
      // 코드가 없으면 서버를 깨우며 기다리게 하지 않고 여기서 바로 안내한다
      gate.hidden = false;
      gateInput.value = "";
      gateInput.focus();
    })
  );
  $(".gate form").addEventListener("submit", (e) => {
    e.preventDefault();
    const c = gateInput.value.trim();
    if (!c) return gateInput.focus();
    code = c;
    saveCode(c); // 마감일이 든 코드만 기억된다. 맞는 코드인지는 챗봇이 확인한다
    openChat();
  });
  $$("[data-wake-cancel], [data-gate-close]").forEach((b) => b.addEventListener("click", closeAll));
  addEventListener("keydown", (e) => e.key === "Escape" && closeAll());
  addEventListener("pageshow", closeAll); // 뒤로 가기로 돌아왔을 때 안내창 닫기

  /* ---------- typing effect ---------- */
  const typed = $(".typed");
  if (reduced) typed.textContent = D.roles[0];
  else {
    let r = 0, c = 0, del = false;
    const tick = () => {
      const word = D.roles[r];
      c += del ? -1 : 1;
      typed.textContent = word.slice(0, c);
      let delay = del ? 40 : 90;
      if (!del && c === word.length) { del = true; delay = 1600; }
      else if (del && c === 0) { del = false; r = (r + 1) % D.roles.length; delay = 300; }
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
    timeline.style.setProperty("--fill", `${fill * 100}%`);

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
      if (!reduced) {
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
    if (!reduced) requestAnimationFrame(draw);
  };
  draw();
})();
