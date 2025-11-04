// BuildID: 2

document.getElementById("y").textContent = new Date().getFullYear();
// Visitor tracker: increment/read CountAPI and fallback to localStorage
(function initVisitorTracker() {
  const countEl = document.getElementById("visitor-count");
  const youEl   = document.getElementById("visitor-you");
  const msgEl   = document.getElementById("visitor-msg");
  if (!countEl) return;

  // 1) Per-device count (local
  try {
    const key = "zorkiiiz_visits_local";
    let n = parseInt(localStorage.getItem(key) || "0", 10);
    n = isNaN(n) ? 1 : n + 1;
    localStorage.setItem(key, String(n));
    if (youEl) youEl.textContent = String(n);
  } catch {}

  // 2) Global count via CounterAPI (public endpoint)
  const NS  = "tomtr-portfolio";
  const KEY = "site-visitors";
  const url = `/you-visited/stats/v1/${encodeURIComponent(NS)}/${encodeURIComponent(KEY)}/up`;

  fetch(url, { cache: "no-store" })
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(data => {
      // Handle multiple possible response shapes
      const v =
        (data && typeof data.value === "number") ? data.value :
        (data && typeof data.count === "number") ? data.count :
        (data && data.counter && typeof data.counter.value === "number") ? data.counter.value :
        (data && data.counter && typeof data.counter.count === "number") ? data.counter.count :
        null;

      console.log("CounterAPI response:", data); // peek at the exact shape
      countEl.textContent = v !== null ? String(v) : "—";
      if (msgEl) msgEl.textContent = "Updated globally via CounterAPI";
    })
    .catch(err => {
      console.error("CounterAPI error:", err);
      if (msgEl) msgEl.textContent = "Using local tracking only";
      // Leave global count as "—"
    });
})();



// make the ticker loop seamlessly by cloning children and creating a dynamic keyframe
(function initTicker() {
const track = document.querySelector(".ticker .track");
if (!track) return;
const wrap = track.parentElement;

// 1) Width of ONE original sequence (before cloning)
const baseWidth = track.scrollWidth;

// 2) Clone until exceed ~2x wrapper width (or at least 2x base)
const originals = Array.from(track.children);
const minTotal = Math.max(wrap.clientWidth * 2.2, baseWidth * 2);
let safety = 0;
while (track.scrollWidth < minTotal && safety < 20) {
    originals.forEach((n) => track.appendChild(n.cloneNode(true)));
    safety++;
}

// 3) Animate by exactly ONE sequence width
const distance = baseWidth; // <<< key change
const pxPerSecond = 80;
const duration = Math.max(10, Math.round(distance / pxPerSecond));

// 4) Lock wrapper height to avoid layout shift
wrap.style.height = track.offsetHeight + "px";

// 5) Inject exact-distance keyframes and start
const style = document.createElement("style");
style.textContent = `@keyframes ticker-scroll{from{transform:translateX(0)}to{transform:translateX(-${distance}px)}}`;
document.head.appendChild(style);

track.style.animation = `ticker-scroll ${duration}s linear infinite`;
})();

// create floating orbs and attach to .float-bg
(function createOrbs() {
const container = document.querySelector(".float-bg");
if (!container) return;
const colors = ["#8b5cf6", "#7dd3fc", "#ffd369", "#3ddc97"];
for (let i = 0; i < 5; i++) {
    const orb = document.createElement("div");
    orb.className = "orb";
    const size = 120 + Math.round(Math.random() * 220);
    orb.style.width = orb.style.height = size + "px";
    orb.style.left = Math.random() * 100 + "%";
    orb.style.top = Math.random() * 100 + "%";
    orb.style.background = colors[i % colors.length];
    const dur = 2 + Math.random() * 3;
    orb.style.animation = `floatY ${dur.toFixed(1)}s ease-in-out ${
    Math.random() * 3
    }s infinite`;
    orb.style.opacity = 0.08 + Math.random() * 0.12;
    container.appendChild(orb);
}
})();

// reveal cards with IntersectionObserver and small stagger
(function revealCards() {
const cards = Array.from(document.querySelectorAll(".card.animated"));
if (!cards.length) return;
const io = new IntersectionObserver(
    (entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
        const el = entry.target;
        const idx = cards.indexOf(el);
        setTimeout(() => el.classList.add("in-view"), (idx + 1) * 80);
        io.unobserve(el);
        }
    });
    },
    { threshold: 0.08 }
);
cards.forEach((c) => io.observe(c));
})();

// contact form submission
// after the SDK script has loaded
emailjs.init({ publicKey: "tM67faWwWUTvTdSXM" });

function sanitize(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

(function initContactForm() {
  const form = document.getElementById("contact-form");
  const ok = document.getElementById("contact-success");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Submit handler running");           // <-- should appear
    if (document.getElementById("cf-website").value) return; // honeypot

    const name  = document.getElementById("cf-name").value.trim();
    const email = document.getElementById("cf-email").value.trim();
    const msg   = document.getElementById("cf-msg").value.trim();

    ok.style.display = "block";
    if (!name || !email || !msg) { ok.textContent = "Please fill all fields."; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { ok.textContent = "Enter a valid email."; return; }

    ok.textContent = "Sending…";

    try {
      const SERVICE_ID  = "service_wdtxqvr";
      const TEMPLATE_ID = "template_bfe7xjh";

      const resp = await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        from_name:  name,
        from_email: email,
        message:    sanitize(msg),
        time:      new Date().toISOString(),
      });
      console.log("EmailJS success:", resp);
      ok.textContent = "Message sent! I’ll get back to you soon.";
      form.reset();
    } catch (err) {
      console.error("EmailJS error:", err);
      ok.textContent = "Failed to send. Try again or email me at tomtr1456@gmail.com.";
    }
  });
})();


(function fitToViewport() {
const stage = document.querySelector(".stage");
const wrap  = document.querySelector(".wrap");
if (!stage || !wrap) return;

const MIN_SCALE = 0.92; // if scaling would be smaller than this, enable scroll mode
let rafId = null;

function measureNaturalSize() {
const prev = wrap.style.transform;
wrap.style.transform = "none";
const naturalW = wrap.scrollWidth;
const naturalH = wrap.scrollHeight;
wrap.style.transform = prev;
return { naturalW, naturalH };
}

function padTop() {
const cs = getComputedStyle(stage);
return parseFloat(cs.paddingTop || "0") || 0;
}

function footerH() {
const f = document.querySelector("footer");
return f ? f.offsetHeight : 0;
}

function safeBottom() {
return parseFloat(
    getComputedStyle(document.documentElement)
    .getPropertyValue("--safe-bottom") || "0"
) || 0;
}

function applyScale() {
const root = document.documentElement;
// First, ensure we’re not in scroll mode so we measure true natural size
root.classList.remove("scroll-mode");
wrap.style.transform = "none";

const { naturalW, naturalH } = measureNaturalSize();

const availW = Math.max(1, window.innerWidth);
const availH = Math.max(
    1,
    window.innerHeight - padTop() - footerH() - safeBottom() - 8
);

const scale = Math.min(1, availW / naturalW, availH / naturalH);
const heightLimited = (availH / naturalH) <= (availW / naturalW);

// If scaling would get too small, switch to scroll mode
if (scale < MIN_SCALE) {
    root.classList.add("scroll-mode");
    wrap.style.transform = "none";
} else {
    root.classList.remove("scroll-mode");
    document.documentElement.classList.toggle(
    "tight",
    heightLimited && scale < 1
    );
    wrap.style.transformOrigin = "top center";
    wrap.style.transform = `scale(${scale})`;
}
}

function requestFit() {
if (rafId) cancelAnimationFrame(rafId);
rafId = requestAnimationFrame(applyScale);
}

// Refit on changes
window.addEventListener("resize", requestFit, { passive: true });
window.addEventListener("orientationchange", requestFit, { passive: true });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestFit);

const mo = new MutationObserver(requestFit);
mo.observe(wrap, { subtree: true, childList: true, attributes: true, characterData: true });

// Initial run
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", requestFit, { once: true });
} else {
requestFit();
}
})();