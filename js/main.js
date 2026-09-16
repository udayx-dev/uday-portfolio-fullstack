/* ============================================================
   UDAY SHINDE PORTFOLIO — main.js
   All interactive features, animations, and AI chatbot
   ============================================================ */

'use strict';

/* ── UTILITIES ──────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const qs = (sel) => document.querySelector(sel);

/* ── LOADER ─────────────────────────────────────────────────── */
(function initLoader() {
  const loader = qs('#loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 1200);
  });
})();

/* ── CUSTOM CURSOR ──────────────────────────────────────────── */
(function initCursor() {
  const cursor   = qs('#cursor');
  const follower = qs('#cursor-follower');
  if (!cursor || !follower) return;
  if (window.matchMedia('(hover: none)').matches) return;

  let mx = 0, my = 0, fx = 0, fy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  const updateFollower = () => {
    fx += (mx - fx) * 0.12;
    fy += (my - fy) * 0.12;
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(updateFollower);
  };
  updateFollower();

  const hoverEls = 'a, button, input, textarea, select, .skill-tab, .filter-btn, .test-dot, .tp-color, .quick-btn';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverEls)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverEls)) document.body.classList.remove('cursor-hover');
  });
})();

/* ── SCROLL PROGRESS ─────────────────────────────────────────── */
(function initScrollProgress() {
  const bar = qs('#scroll-progress');
  if (!bar) return;
  const update = () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
})();

/* ── NAVBAR ──────────────────────────────────────────────────── */
(function initNavbar() {
  const nav  = qs('#navbar');
  const ham  = qs('#nav-hamburger');
  const menu = qs('#mobile-menu');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    qs('#back-to-top')?.classList.toggle('visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger
  ham?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    ham.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    menu.style.display = open ? 'block' : 'none';
  });

  // Close menu on link click
  menu?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      ham?.classList.remove('open');
      ham?.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    });
  });

  // Active nav highlighting
  const sections = $$('section[id]');
  const links    = $$('.nav-link');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach(s => observer.observe(s));

  // Smooth scroll all anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
})();

/* ── BACK TO TOP ─────────────────────────────────────────────── */
qs('#back-to-top')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── PARTICLES CANVAS ────────────────────────────────────────── */
(function initParticles() {
  const canvas = qs('#particles-canvas');
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  let W, H, particles = [], mouse = { x: -999, y: -999 };

  const PARTICLE_COUNT = window.innerWidth < 768 ? 40 : 80;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00e5ff';

  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const random = (min, max) => Math.random() * (max - min) + min;

  const createParticle = () => ({
    x: random(0, W), y: random(0, H),
    vx: random(-0.3, 0.3), vy: random(-0.3, 0.3),
    size: random(1, 3),
    alpha: random(0.2, 0.7),
    alphaDir: random(-0.005, 0.005)
  });

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());

  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

  const hexToRgb = hex => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '0,229,255';
  };
  const accentRgb = hexToRgb(accent);

  const animate = () => {
    ctx.clearRect(0, 0, W, H);

    particles.forEach((p, i) => {
      // Mouse repulsion
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80) {
        const force = (80 - dist) / 80 * 0.8;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy;
      p.alpha += p.alphaDir;

      if (p.alpha <= 0.1 || p.alpha >= 0.7) p.alphaDir *= -1;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accentRgb},${p.alpha})`;
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx2 = p.x - q.x, dy2 = p.y - q.y;
        const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (d2 < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${accentRgb},${0.08 * (1 - d2 / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(animate);
  };
  animate();
})();

/* ── TYPING ANIMATION ────────────────────────────────────────── */
(function initTyped() {
  const el = qs('#typed-text');
  if (!el) return;
  const roles = [
    'Full-Stack Developer',
    'MERN Stack Engineer',
    'Cybersecurity Enthusiast',
    'AI/ML Explorer',
    'Open Source Contributor',
    'Hackathon Builder',
    'Future SDE @ ₹25 LPA'
  ];
  let ri = 0, ci = 0, deleting = false;
  const TYPE_SPEED = 75, DELETE_SPEED = 40, PAUSE = 1800;

  const type = () => {
    const current = roles[ri];
    if (deleting) {
      el.textContent = current.slice(0, ci - 1);
      ci--;
      if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; setTimeout(type, 300); return; }
    } else {
      el.textContent = current.slice(0, ci + 1);
      ci++;
      if (ci === current.length) { setTimeout(() => { deleting = true; type(); }, PAUSE); return; }
    }
    setTimeout(type, deleting ? DELETE_SPEED : TYPE_SPEED);
  };
  setTimeout(type, 800);
})();

/* ── SCROLL REVEAL ───────────────────────────────────────────── */
(function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });
  $$('.reveal').forEach(el => io.observe(el));
})();

/* ── COUNTER ANIMATION ───────────────────────────────────────── */
(function initCounters() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      let start = 0;
      const dur = 1500, step = 16;
      const inc = target / (dur / step);
      const tick = () => {
        start = Math.min(start + inc, target);
        el.textContent = Math.floor(start);
        if (start < target) requestAnimationFrame(tick);
        else el.textContent = target;
      };
      tick();
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(el => io.observe(el));
})();

/* ── SKILL BARS ──────────────────────────────────────────────── */
(function initSkillBars() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const fill = e.target.querySelector('.skill-fill');
      if (fill) fill.classList.add('animated');
      io.unobserve(e.target);
    });
  }, { threshold: 0.3 });
  $$('.skill-card').forEach(el => io.observe(el));
})();

/* ── SKILLS TABS ─────────────────────────────────────────────── */
(function initSkillTabs() {
  const tabs    = $$('.skill-tab');
  const contents = $$('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = qs(`#tab-${tab.dataset.tab}`);
      if (target) {
        target.classList.add('active');
        // Re-trigger skill bar animation
        target.querySelectorAll('.skill-fill').forEach(f => {
          f.classList.remove('animated');
          setTimeout(() => f.classList.add('animated'), 50);
        });
      }
    });
  });
})();

/* ── PROJECT FILTERS ─────────────────────────────────────────── */
(function initProjectFilters() {
  const btns  = $$('.filter-btn');
  const cards = $$('.project-card');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const filter = btn.dataset.filter;
      cards.forEach(c => {
        const show = filter === 'all' || c.dataset.category === filter;
        c.style.display = show ? '' : 'none';
        c.classList.toggle('hidden', !show);
      });
    });
  });
})();

/* ── PROJECT SEARCH ──────────────────────────────────────────── */
(function initProjectSearch() {
  const input = qs('#project-search-input');
  const cards = $$('.project-card');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    cards.forEach(c => {
      const text = (c.dataset.name || '') + c.textContent.toLowerCase();
      const match = !q || text.includes(q);
      c.style.display = match ? '' : 'none';
    });
  });
})();

/* ── TESTIMONIALS SLIDER ─────────────────────────────────────── */
(function initTestimonials() {
  const cards = $$('.test-card');
  const dotsC = qs('#test-dots');
  const prev  = qs('#test-prev');
  const next  = qs('#test-next');
  if (!cards.length) return;

  let current = 0, timer;

  // Create dots
  cards.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'test-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
    d.addEventListener('click', () => show(i));
    dotsC?.appendChild(d);
  });

  const show = (i) => {
    cards[current].classList.remove('active');
    dotsC?.querySelectorAll('.test-dot')[current]?.classList.remove('active');
    current = (i + cards.length) % cards.length;
    cards[current].classList.add('active');
    dotsC?.querySelectorAll('.test-dot')[current]?.classList.add('active');
    clearInterval(timer); timer = setInterval(() => show(current + 1), 5000);
  };

  cards[0].classList.add('active');
  prev?.addEventListener('click', () => show(current - 1));
  next?.addEventListener('click', () => show(current + 1));
  timer = setInterval(() => show(current + 1), 5000);
})();

/* ── DARK / LIGHT MODE ───────────────────────────────────────── */
(function initThemeToggle() {
  const btn = qs('#theme-toggle');
  const stored = localStorage.getItem('theme') || 'dark';
  document.documentElement.dataset.theme = stored;
  updateIcon(stored);

  btn?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    updateIcon(next);
  });

  function updateIcon(t) {
    if (btn) btn.querySelector('.theme-icon').textContent = t === 'dark' ? '☀' : '◑';
  }
})();

/* ── THEME COLOR CUSTOMIZER ──────────────────────────────────── */
(function initThemePanel() {
  const openBtn  = qs('#open-theme-panel-btn');
  const panel    = qs('#theme-panel');
  const closeBtn = qs('#theme-panel-close');
  const colorBtns = $$('.tp-color');

  const savedAccent = localStorage.getItem('accent') || 'cyan';
  document.documentElement.dataset.accent = savedAccent;
  colorBtns.find(b => b.dataset.color === savedAccent)?.classList.add('active');

  openBtn?.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    panel.setAttribute('aria-hidden', !open);
  });
  closeBtn?.addEventListener('click', () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  });

  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.documentElement.dataset.accent = btn.dataset.color;
      localStorage.setItem('accent', btn.dataset.color);
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
})();

/* ── CONTACT FORM ────────────────────────────────────────────── */
(function initContactForm() {
  const form    = qs('#contact-form');
  if (!form) return;
  const nameIn  = qs('#cf-name');
  const emailIn = qs('#cf-email');
  const subjIn  = qs('#cf-subject');
  const msgIn   = qs('#cf-message');
  const submitB = qs('#submit-btn');
  const success = qs('#form-success');
  const charCt  = qs('#char-count');
  const draftSt = qs('#draft-status');

  // Char counter
  msgIn?.addEventListener('input', () => {
    const len = msgIn.value.length;
    charCt.textContent = len;
    charCt.style.color = len > 450 ? 'var(--warning)' : '';
  });

  // Auto-save draft
  const DRAFT_KEY = 'contact_draft';
  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      name: nameIn?.value, email: emailIn?.value,
      subject: subjIn?.value, message: msgIn?.value
    }));
    if (draftSt) { draftSt.textContent = '💾 Draft saved'; setTimeout(() => draftSt.textContent = '', 2000); }
  };
  [nameIn, emailIn, subjIn, msgIn].forEach(el => el?.addEventListener('input', debounce(saveDraft, 1500)));

  // Restore draft
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    if (draft.name)    nameIn.value    = draft.name;
    if (draft.email)   emailIn.value   = draft.email;
    if (draft.subject) subjIn.value    = draft.subject;
    if (draft.message) { msgIn.value   = draft.message; charCt.textContent = draft.message.length; }
    if (draft.name || draft.message) draftSt.textContent = '📝 Draft restored';
  } catch(_) {}

  // Validation
  const validate = () => {
    let valid = true;
    const setErr = (inp, errId, msg) => {
      const g = inp.closest('.form-group');
      const e = qs(`#${errId}`);
      if (msg) { g?.classList.add('error'); if (e) e.textContent = msg; valid = false; }
      else { g?.classList.remove('error'); if (e) e.textContent = ''; }
    };

    setErr(nameIn, 'err-name', !nameIn?.value.trim() ? 'Name is required' : nameIn.value.trim().length < 2 ? 'Name too short' : '');
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setErr(emailIn, 'err-email', !emailIn?.value.trim() ? 'Email is required' : !emailReg.test(emailIn.value) ? 'Enter a valid email' : '');
    setErr(subjIn, 'err-subject', !subjIn?.value ? 'Please select a subject' : '');
    setErr(msgIn, 'err-message', !msgIn?.value.trim() ? 'Message is required' : msgIn.value.trim().length < 10 ? 'Message too short' : '');
    return valid;
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;
    if (submitB.classList.contains('loading')) return; // guard against double-submit
    submitB.classList.add('loading');
    submitB.disabled = true;
    success.classList.remove('visible', 'form-error-banner');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameIn.value.trim(),
          email: emailIn.value.trim(),
          subject: subjIn.value,
          message: msgIn.value.trim(),
          // Honeypot — real visitors never see or fill this field (hidden via CSS).
          company_website: qs('#cf-company')?.value || '',
        }),
      });

      let payload = {};
      try { payload = await res.json(); } catch (_) { /* non-JSON error page, fall through */ }

      if (!res.ok) {
        if (payload.fieldErrors) {
          Object.entries(payload.fieldErrors).forEach(([field, msg]) => {
            const inputEl = qs(`#cf-${field}`);
            const errEl = qs(`#err-${field}`);
            inputEl?.closest('.form-group')?.classList.add('error');
            if (errEl) errEl.textContent = msg;
          });
        }
        success.textContent = payload.error || "Couldn't send your message — please try again.";
        success.classList.add('visible', 'form-error-banner');
        return;
      }

      success.textContent = '🎉 ' + (payload.message || "Message sent! I'll get back to you within 24 hours.");
      success.classList.add('visible');
      form.reset();
      charCt.textContent = '0';
      localStorage.removeItem(DRAFT_KEY);
      setTimeout(() => success.classList.remove('visible'), 6000);
    } catch (networkErr) {
      success.textContent = "Network hiccup — please check your connection and try again, or email shinde.uday538@gmail.com directly.";
      success.classList.add('visible', 'form-error-banner');
    } finally {
      submitB.classList.remove('loading');
      submitB.disabled = false;
    }
  });
})();

/* ── RESUME MODAL ────────────────────────────────────────────── */
(function initResumeModal() {
  const modal     = qs('#resume-modal');
  const openBtn   = qs('#preview-resume-btn');
  const closeBtn  = qs('#modal-close-btn');
  if (!modal) return;

  openBtn?.addEventListener('click', () => { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); });
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
})();

/* ── AI CHATBOT ──────────────────────────────────────────────── */
(function initChatbot() {
  const toggle   = qs('#chatbot-toggle');
  const win      = qs('#chatbot-window');
  const closeBtn = qs('#chatbot-close');
  const form     = qs('#chatbot-form');
  const input    = qs('#chatbot-input');
  const messages = qs('#chatbot-messages');
  const quickBtns = $$('.quick-btn');
  if (!toggle || !win) return;

  let isOpen = false;

  toggle.addEventListener('click', () => {
    isOpen = !isOpen;
    win.classList.toggle('open', isOpen);
    win.setAttribute('aria-hidden', !isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
    if (isOpen) input?.focus();
  });
  closeBtn?.addEventListener('click', () => {
    isOpen = false; win.classList.remove('open');
    win.setAttribute('aria-hidden', 'true');
  });

  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (input) input.value = btn.dataset.q;
      handleChat(btn.dataset.q);
    });
  });

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    handleChat(q);
    input.value = '';
  });

  const addMsg = (text, cls) => {
    const div = document.createElement('div');
    div.className = `chat-msg ${cls}`;
    div.innerHTML = `<span>${text}</span>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  };

  const addTyping = () => {
    const div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  };

  const removeTyping = () => qs('#typing-indicator')?.remove();

  // Session-scoped conversation id: persists across messages in this tab so
  // the backend can maintain multi-turn context, but resets in a new tab or
  // after the browser session ends (no permanent visitor tracking).
  const SESSION_KEY = 'chatbot_session_id';
  const getSessionId = () => {
    try {
      let id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        sessionStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (_) {
      return null; // sessionStorage unavailable (e.g. private mode edge cases) — server issues a fresh id each time
    }
  };

  let isSending = false;

  async function handleChat(q) {
    if (isSending) return; // prevent duplicate/overlapping sends
    isSending = true;
    if (input) input.disabled = true;

    addMsg(q, 'user');
    const typing = addTyping();

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, sessionId: getSessionId() }),
      });

      let payload = {};
      try { payload = await res.json(); } catch (_) { /* ignore parse errors, handled below */ }

      removeTyping();

      if (!res.ok) {
        addMsg(payload.error || "Something went wrong — please try again in a moment.", 'bot');
        return;
      }

      if (payload.sessionId) {
        try { sessionStorage.setItem(SESSION_KEY, payload.sessionId); } catch (_) {}
      }
      addMsg(payload.reply || "Sorry, I didn't catch that — could you rephrase?", 'bot');
    } catch (networkErr) {
      removeTyping();
      addMsg("I couldn't reach the server just now. Please check your connection, or email Uday directly at shinde.uday538@gmail.com. 🙏", 'bot');
    } finally {
      isSending = false;
      if (input) { input.disabled = false; input.focus(); }
    }
  }
})();

/* ── KEYBOARD SHORTCUTS ──────────────────────────────────────── */
(function initKeyboardShortcuts() {
  const modal     = qs('#shortcuts-modal');
  const closeBtn  = qs('#shortcuts-modal-close');
  const hint      = qs('#shortcut-hint');

  let hintTimer;
  const showHint = (txt) => {
    if (!hint) return;
    hint.textContent = txt;
    hint.classList.add('visible');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hint.classList.remove('visible'), 2000);
  };

  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
    switch (e.key.toLowerCase()) {
      case 'k':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          modal?.classList.toggle('open');
          modal?.setAttribute('aria-hidden', !modal.classList.contains('open'));
          showHint('Keyboard shortcuts panel');
        }
        break;
      case 't':
        qs('#theme-toggle')?.click();
        showHint('Theme toggled');
        break;
      case 'h':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showHint('↑ Back to top');
        break;
      case 'p':
        qs('#projects')?.scrollIntoView({ behavior: 'smooth' });
        showHint('→ Projects');
        break;
      case 'c':
        qs('#contact')?.scrollIntoView({ behavior: 'smooth' });
        showHint('→ Contact');
        break;
      case 'escape':
        $$('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        qs('#chatbot-window.open')?.classList.remove('open');
        break;
    }
  });

  closeBtn?.addEventListener('click', () => modal?.classList.remove('open'));
  modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
})();

/* ── EASTER EGG ──────────────────────────────────────────────── */
(function initEasterEgg() {
  const sequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let idx = 0;
  document.addEventListener('keydown', e => {
    if (e.key === sequence[idx]) {
      idx++;
      if (idx === sequence.length) {
        idx = 0;
        document.body.style.animation = 'egg-rainbow 2s linear';
        const style = document.createElement('style');
        style.textContent = `@keyframes egg-rainbow { 0%{filter:hue-rotate(0)} 100%{filter:hue-rotate(360deg)} }`;
        document.head.appendChild(style);
        setTimeout(() => { document.body.style.animation = ''; style.remove(); }, 2000);
        showToast('🥚 Konami Code! You found the Easter Egg! 🎉');
      }
    } else { idx = 0; }
  });
})();

/* ── TOAST ───────────────────────────────────────────────────── */
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed; top:2rem; left:50%; transform:translateX(-50%);
    background:var(--bg-card); backdrop-filter:blur(20px);
    border:1px solid var(--glass-border); border-radius:100px;
    padding:.65rem 1.5rem; font-size:.85rem; z-index:99999;
    box-shadow:var(--glass-shadow); animation:fadeInDown .4s ease;
    color:var(--text-primary);
  `;
  t.textContent = msg;
  const s = document.createElement('style');
  s.textContent = '@keyframes fadeInDown{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%)}}';
  document.head.appendChild(s);
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => { t.remove(); s.remove(); }, 400); }, 3000);
}

/* ── PWA SERVICE WORKER ──────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

/* ── LAZY LOADING ────────────────────────────────────────────── */
if ('loading' in HTMLImageElement.prototype) {
  $$('img[data-src]').forEach(img => { img.src = img.dataset.src; });
} else {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.src = e.target.dataset.src;
        io.unobserve(e.target);
      }
    });
  });
  $$('img[data-src]').forEach(img => io.observe(img));
}

/* ── HELPERS ─────────────────────────────────────────────────── */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

/* ── 3D CARD TILT ─────────────────────────────────────────────── */
(function initTilt() {
  $$('.project-card, .skill-card, .blog-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ── CURSOR TRAIL ─────────────────────────────────────────────── */
(function initCursorTrail() {
  if (window.matchMedia('(hover: none)').matches) return;
  const MAX = 8;
  const trail = [];
  for (let i = 0; i < MAX; i++) {
    const d = document.createElement('div');
    d.style.cssText = `position:fixed;width:${4 + i * .5}px;height:${4 + i * .5}px;border-radius:50%;
      background:rgba(var(--accent-rgb),${0.04 + i * 0.01});pointer-events:none;z-index:9990;
      transform:translate(-50%,-50%);transition:none;`;
    document.body.appendChild(d);
    trail.push({ el: d, x: 0, y: 0 });
  }
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  const animateTrail = () => {
    trail.forEach((t, i) => {
      const prev = i === 0 ? { x: mx, y: my } : trail[i - 1];
      t.x += (prev.x - t.x) * (0.35 - i * 0.025);
      t.y += (prev.y - t.y) * (0.35 - i * 0.025);
      t.el.style.left = t.x + 'px';
      t.el.style.top  = t.y + 'px';
    });
    requestAnimationFrame(animateTrail);
  };
  animateTrail();
})();

/* ── MOBILE MENU DISPLAY FIX ─────────────────────────────────── */
(function fixMobileMenu() {
  const menu = qs('#mobile-menu');
  if (menu) menu.style.display = 'none';
})();

/* ── PRIVACY-CONSCIOUS ANALYTICS BEACON ─────────────────────────
   Fires a small set of anonymous, named events to our own backend
   (see server/routes/analytics.js). No PII, no cookies, no IPs stored —
   just event counts. Fails silently if the backend/network is unavailable
   so it can never break the page. ────────────────────────────── */
(function initAnalyticsBeacon() {
  const send = (event, meta) => {
    try {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, meta }),
        keepalive: true,
      }).catch(() => {});
    } catch (_) { /* analytics must never throw */ }
  };

  send('page_view', location.pathname);
  window.__portfolioAnalytics = { send }; // exposed so blog article pages can log 'blog_article_view'
})();
