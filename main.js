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

  /* ---------- chatbot: 깨우는 중 안내 후 이동 ---------- */
  const wake = $(".wake");
  const go = $("[data-wake-go]");
  // 포트폴리오 링크에 붙은 초대 코드(?code=...)를 챗봇 주소로 넘겨준다
  const code = new URLSearchParams(location.search).get("code");
  const chatUrl = new URL(D.chatbotUrl);
  if (code) chatUrl.searchParams.set("code", code);
  go.href = chatUrl.href;
  let wakeTimer;
  const closeWake = () => { clearTimeout(wakeTimer); wake.hidden = true; };
  $$("[data-ask]").forEach((b) =>
    b.addEventListener("click", () => {
      wake.hidden = false;
      go.focus();
      wakeTimer = setTimeout(() => (location.href = chatUrl.href), 2500); // 안내를 잠깐 보여 준 뒤 이동
    })
  );
  $("[data-wake-cancel]").addEventListener("click", closeWake);
  addEventListener("keydown", (e) => e.key === "Escape" && closeWake());
  addEventListener("pageshow", closeWake); // 뒤로 가기로 돌아왔을 때 안내창 닫기

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
