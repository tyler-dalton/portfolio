// script.js
// Quotes carousel + auto-fit + smooth transition + auto-advance + pause + progress ring (JS-driven)

const quotes = [
  { text: "A gem cannot be polished without friction, nor a man perfected without trials.", author: "Seneca" },
  { text: "Don’t expect to be motivated every day to get out there and make things happen. You won’t be. Don’t count on motivation. Count on discipline.", author: "Jocko Willink" },
  { text: "What we fear doing most is usually what we most need to do.", author: "Tim Ferriss" },
  { text: "If you are not willing to risk the usual, you will have to settle for the ordinary.", author: "Jim Rohn" },
  { text: "It is to be like the rock, that the waves keep crashing over. It stands unmoved and the raging of the sea falls still around it.", author: "Marcus Aurelius" },
];

let quoteIndex = 0;
let isAnimating = false;

function initMobileNav() {
  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const list = document.getElementById("primary-nav");
  if (!nav || !toggle || !list) return;

  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  };

  const open = () => {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    expanded ? close() : open();
  });

  // Close after tapping a link (mobile UX)
  list.addEventListener("click", (e) => {
    if (e.target?.closest("a")) close();
  });

  // Close if resizing back to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) close();
  });

  // Escape key closes
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  document.addEventListener("click", (e) => {
  if (!nav.classList.contains("is-open")) return;
  if (e.target.closest(".site-nav")) return;
  close();
});
}


/* ========= Active nav ========= */

function setActiveNav() {
  const links = document.querySelectorAll("header nav a");
  if (!links.length) return;

  const current = window.location.pathname.split("/").pop() || "index.html";

  links.forEach((a) => {
    const isActive = a.getAttribute("href") === current;

    a.classList.toggle("active", isActive);

    if (isActive) {
      a.setAttribute("aria-current", "page");
    } else {
      a.removeAttribute("aria-current");
    }
  });
}

/* ========= Reveal-on-scroll ========= */

function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        window.setTimeout(() => entry.target.classList.add("is-visible"), 80);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );

  els.forEach((el) => io.observe(el));
}

/* ========= Quote sizing ========= */

function fitQuoteText() {
  const card = document.querySelector(".quote-card");
  const quote = document.getElementById("quoteText");
  const author = document.getElementById("quoteAuthor");
  const controls = card?.querySelector(".quote-controls");

  if (!card || !quote || !author || !controls) return;

  let size = 40;
  const minSize = 14;

  quote.style.fontSize = size + "px";

  const buffer = 28;

  const controlsStyle = window.getComputedStyle(controls);
  const controlsHeight = (controlsStyle.position === "absolute") ? 0 : controls.offsetHeight;

  const available = card.clientHeight - author.offsetHeight - controlsHeight - buffer;
  if (available <= 0) return;

  while (quote.scrollHeight > available && size > minSize) {
    size -= 1;
    quote.style.fontSize = size + "px";
  }
}

/* ========= Progress ring + auto-advance (single source of truth) ========= */

const AUTO_ADVANCE_MS = 7000;

let progressRaf = null;
let progressStart = 0;
let progressElapsed = 0;
let isPaused = false;

const RING_R = 8;
const RING_CIRC = 2 * Math.PI * RING_R; // ~50.265

function renderDots() {
  const dotsContainer = document.querySelector(".quote-dots");
  if (!dotsContainer) return;

  dotsContainer.innerHTML = "";

  quotes.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "quote-dot" + (i === quoteIndex ? " active" : "");
    dot.innerHTML = `
      <svg class="ring" viewBox="0 0 24 24" aria-hidden="true">
        <circle class="ring-track" cx="12" cy="12" r="${RING_R}"></circle>
        <circle class="ring-progress" cx="12" cy="12" r="${RING_R}"></circle>
      </svg>
    `;
    dotsContainer.appendChild(dot);
  });

  document.querySelectorAll(".ring-progress").forEach((c) => {
    c.style.strokeDasharray = `${RING_CIRC}`;
    c.style.strokeDashoffset = `${RING_CIRC}`;
  });

  setActiveRingProgress(0);
}

function updateDots() {
  const dots = document.querySelectorAll(".quote-dot");
  dots.forEach((dot, i) => dot.classList.toggle("active", i === quoteIndex));

  document.querySelectorAll(".ring-progress").forEach((c) => {
    c.style.strokeDashoffset = `${RING_CIRC}`;
  });

  setActiveRingProgress(0);
}

function setActiveRingProgress(pct) {
  const active = document.querySelector(".quote-dot.active .ring-progress");
  if (!active) return;

  const clamped = Math.max(0, Math.min(1, pct));
  const offset = RING_CIRC * (1 - clamped);
  active.style.strokeDashoffset = `${offset}`;
}

function stopProgress() {
  if (progressRaf) cancelAnimationFrame(progressRaf);
  progressRaf = null;
}

function startProgress(fromElapsed = 0) {
  stopProgress();
  progressElapsed = fromElapsed;
  progressStart = performance.now() - progressElapsed;
  progressRaf = requestAnimationFrame(tickProgress);
}

function pauseProgress() {
  if (isPaused) return;
  isPaused = true;
  stopProgress();
  progressElapsed = performance.now() - progressStart;
}

function resumeProgress() {
  if (!isPaused) return;
  isPaused = false;
  startProgress(progressElapsed);
}

function resetProgress() {
  isPaused = false;
  startProgress(0);
}

function tickProgress(now) {
  const elapsed = now - progressStart;
  const pct = elapsed / AUTO_ADVANCE_MS;

  setActiveRingProgress(pct);

  if (pct >= 1) {
    nextQuote(true);
    return;
  }

  progressRaf = requestAnimationFrame(tickProgress);
}

/* ========= Quote rendering ========= */

function renderQuote({ animate = true } = {}) {
  const card = document.querySelector(".quote-card");
  const quote = document.getElementById("quoteText");
  const author = document.getElementById("quoteAuthor");
  if (!card || !quote || !author) return;

  const item = quotes[quoteIndex];

  if (!animate) {
    quote.textContent = `“${item.text}”`;
    author.textContent = `— ${item.author}`;
    fitQuoteText();
    updateDots();
    resetProgress();
    return;
  }

  if (isAnimating) return;
  isAnimating = true;

  card.classList.add("is-transitioning");

  window.setTimeout(() => {
    quote.textContent = `“${item.text}”`;
    author.textContent = `— ${item.author}`;

    fitQuoteText();
    updateDots();
    resetProgress();

    card.classList.remove("is-transitioning");

    window.setTimeout(() => {
      isAnimating = false;
    }, 520);
  }, 420);
}

function nextQuote(isAuto = false) {
  quoteIndex = (quoteIndex + 1) % quotes.length;
  renderQuote();

  if (!isAuto) resetProgress();
}

function prevQuote() {
  quoteIndex = (quoteIndex - 1 + quotes.length) % quotes.length;
  renderQuote();
  resetProgress();
}

/* ========= Pause on hover/focus ========= */

function initQuoteHoverPause() {
  const prevBtn = document.querySelector(".prev-quote");
  const nextBtn = document.querySelector(".next-quote");

  if (!prevBtn || !nextBtn) return;

  const pause = () => pauseProgress();
  const resume = () => resumeProgress();

  // Pause only when hovering arrows
  prevBtn.addEventListener("mouseenter", pause);
  nextBtn.addEventListener("mouseenter", pause);

  prevBtn.addEventListener("mouseleave", resume);
  nextBtn.addEventListener("mouseleave", resume);

  // Keyboard accessibility
  prevBtn.addEventListener("focusin", pause);
  nextBtn.addEventListener("focusin", pause);

  prevBtn.addEventListener("focusout", resume);
  nextBtn.addEventListener("focusout", resume);
}

/* ========= Events ========= */

window.addEventListener("load", () => {
  setActiveNav();
  initReveal();
  initMobileNav();
  // initHomelabStatus();
  initFakeHomelabStatus();
  initCopyEmail();


  document.querySelector(".next-quote")?.addEventListener("click", () => nextQuote(false));
  document.querySelector(".prev-quote")?.addEventListener("click", prevQuote);

  renderDots();
  renderQuote({ animate: false });

  initQuoteHoverPause();
  resetProgress();
});

window.addEventListener("resize", () => {
  fitQuoteText();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") nextQuote(false);
  if (e.key === "ArrowLeft") prevQuote();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseProgress();
  else resumeProgress();
});

async function initHomelabStatus() {
  const el = document.getElementById("homelabStatus");
  if (!el) return;

  const setStatus = (status, label, details) => {
    el.dataset.status = status;

    const textEl =
      el.querySelector(".status-text") ||
      el.querySelector("span:last-child"); // fallback if markup differs

    if (textEl) textEl.textContent = label;
    el.title = details || "";
  };

  // Default while loading
  setStatus("unknown", "Checking homelab status…", "Loading status.json");

  try {
    const res = await fetch(`status.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    const raw = (data.status || "").toLowerCase().trim();

    // Allowed statuses (including your new one)
    const allowed = new Set(["online", "degraded", "offline", "construction"]);

    const status = allowed.has(raw) ? raw : "construction";
    const label =
      data.label ||
      (status === "construction" ? "Homelab Under Construction" : "Status Unknown");

    const details =
      data.details ||
      (status === "construction"
        ? "Rebuilding services + cleanup in progress"
        : "No details available");

    setStatus(status, label, details);
  } catch (e) {
    // If fetch fails, show construction instead of just hanging
    setStatus(
      "construction",
      "Homelab Under Construction",
      "Status feed unavailable — rebuilding services right now."
    );
  }
}

function initFakeHomelabStatus() {
  const el = document.getElementById("homelabStatus");
  if (!el) return;

  // Simulate network delay
  window.setTimeout(() => {
    el.classList.remove("is-loading");

    // keep whatever status string you want
    el.dataset.status = "construction";

    const textEl = el.querySelector(".status-text");
    if (textEl) textEl.textContent = "Homelab Under Configuration";

    el.title = "Rebuilding services + firewall configuration in progress";

    // HARD FORCE YELLOW DOT
    const dotEl =
      el.querySelector(".status-dot") ||      // preferred
      el.querySelector('[data-status-dot]');  // optional fallback if you use an attribute

    if (dotEl) {
      dotEl.style.backgroundColor = "#f1c40f"; // yellow
      dotEl.style.boxShadow = "0 0 0 3px rgba(241, 196, 15, 0.18)"; // optional “glow”
    }
  }, 200);
}

/* ========= Copy email button ========= */

function initCopyEmail() {
  const btn = document.querySelector("[data-copy-email]");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const email = btn.dataset.copyEmail;

    try {
      await navigator.clipboard.writeText(email);
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      btn.textContent = "Failed";
    }
  });
}
