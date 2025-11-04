// Build ID: 05

// -------- 1) projects -------------
const PROJECTS = [
{
  id: "pi-server",
  title: "Self-Hosted Pi Server",
  description: "Personal homelab on Raspberry Pi: Dockerized services behind Caddy + Cloudflare, with backup & monitoring.",
  tech: ["Docker","Caddy","Cloudflare","Linux"],
  featured: true, openSource: false, hasDemo: false,
  ongoing: true,
  image: "/assets/pi-server.jpg",
  date: "2024-07-01",
  end: null
},
{
  id: "mono-text",
  title: "MonoText",
  description:
    "Mini social app with secure auth, roles, posting/comments, and real-time chat. Defended against SQLi, XSS, CSRF; built with PHP + MySQL and a JS front end.",
  tech: ["PHP","MySQL","JavaScript","HTML","CSS","Bootstrap","jQuery","Auth"],
  featured: true, openSource: true, hasDemo: true,
  image: "/assets/monoText.png",
  demoUrl: "https://monotext.zorki.org/",     
  sourceUrl: null,             
  date: "2025-07-01",           // Summer 2025
  end:  "2025-08-31"
},
{
  id: "movie-rec",
  title: "Movie Recommendation",
  description:
    "Content-based movie recommender using TMDB metadata; Azure-hosted Python/ML API with a JS UI (search, posters, trailers, cast).",
  tech: ["Python","Azure","TMDB","ML","JavaScript","Node.js","Express","HTML","CSS","REST","Docker","jQuery"],
  featured: false, openSource: true, hasDemo: true,
  image: "/assets/movie-recs.png",
  demoUrl: "https://cps449-coil-team6.github.io/views/chatbox.html",
  sourceUrl: null,
  date: "2025-01-15",           // Spring 2025
  end:  "2025-05-15"
},
{
  id: "cloud-pos",
  title: "Cloud POS",
  description:
    "Point-of-sale concept with Neo4j graph backend + REST/GraphQL APIs. Focused on orders, inventory, transactions; testing & deployment workflows.",
  tech: ["Neo4j","REST","GraphQL","JavaScript","Node.js","Express","HTML","CSS", "Auth"],
  featured: false, openSource: false, hasDemo: false,
  image: "/assets/demo.gif",   
  demoUrl: null,
  sourceUrl: "https://jakeondevinecrm.github.io/",
  date: "2024-10-01",           // Fall 2024
  end:  "2024-12-15"
},
];

// -------- 2) State, derived tech list, and helpers --------------
const state = {
featured: false,
oss: false,
demo: false,
sort: "new",
tech: new Set(),
};

function el(html) {
const t = document.createElement("template");
t.innerHTML = html.trim();
return t.content.firstElementChild;
}

function passesFilters(p) {
if (state.featured && !p.featured) return false;
if (state.oss && !p.openSource) return false;
if (state.demo && !p.hasDemo) return false;
if (state.tech.size) {
    for (const need of state.tech) if (!p.tech.includes(need)) return false;
}
return true;
}

function sortProjects(arr) {
  const noFilters =
    !state.featured && !state.oss && !state.demo && state.tech.size === 0;

  // helpers: end time (ongoing -> Infinity), start time fallback
  const endMs = (p) =>
    (p.ongoing || p.end == null || String(p.end).toLowerCase() === "present")
      ? Number.POSITIVE_INFINITY
      : +new Date(p.end || p.date || 0);
  const startMs = (p) => +new Date(p.date || 0);

  switch (state.sort) {
    case "old":
      // earliest end first; tie-breaker: earliest start
      return arr.sort((a, b) => (endMs(a) - endMs(b)) || (startMs(a) - startMs(b)));

    case "az":
      return arr.sort((a, b) => a.title.localeCompare(b.title));

    case "za":
      return arr.sort((a, b) => b.title.localeCompare(a.title));

    default: // "new"
      if (noFilters) {
        // Default view: ongoing (Infinity) first, then most recent end,
        // tie-breaker: most recent start
        return arr.sort((a, b) => (endMs(b) - endMs(a)) || (startMs(b) - startMs(a)));
      }
      // When filters are active, just use start date desc
      return arr.sort((a, b) => startMs(b) - startMs(a));
  }
}


// -------- 3) Render tech chips (toggleable) ---------------------
const techWrap = document.getElementById("tech-chips");

// Build a map of {tech -> count} from a project array
function collectTechCounts(projects) {
  const map = new Map();
  for (const p of projects) {
    (p.tech || []).forEach(t => map.set(t, (map.get(t) || 0) + 1));
  }
  return map;
}

// (Re)render chips from a project array
function renderTechChips(fromProjects) {
  const techCounts = collectTechCounts(fromProjects);
  const techList = Array.from(techCounts.keys()).sort((a, b) => a.localeCompare(b));

  techWrap.innerHTML = "";
  techList.forEach((t) => {
    const count = techCounts.get(t);
    const chip = el(
      `<button type="button" class="chip" aria-pressed="${state.tech.has(t)}">
         ${t}<span class="muted" style="margin-left:.4rem;font-size:.8em">(${count})</span>
       </button>`
    );

    if (state.tech.has(t)) chip.classList.add("active");

    chip.addEventListener("click", () => {
      if (state.tech.has(t)) {
        state.tech.delete(t);
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
      } else {
        state.tech.add(t);
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
      }
      render(); // will re-render cards + chips
    });

    techWrap.appendChild(chip);
  });
}

// -------- 4) Wire up filter controls ----------------------------
const $ = (s) => document.getElementById(s);
$("f-featured").addEventListener("change", (e) => { state.featured = e.target.checked; render(); });
$("f-oss").addEventListener("change",      (e) => { state.oss      = e.target.checked; render(); });
$("f-demo").addEventListener("change",     (e) => { state.demo     = e.target.checked; render(); });
$("sort").addEventListener("change",       (e) => { state.sort     = e.target.value;   render(); });

$("reset").addEventListener("click", () => {
state.featured = state.oss = state.demo = false;
state.sort = "new";
state.tech.clear();
document.querySelectorAll("#tech-chips .chip.active").forEach((c) => {
    c.classList.remove("active");
    c.setAttribute("aria-pressed", "false");
});
document
    .querySelectorAll(".sidebar input[type=checkbox]")
    .forEach((c) => (c.checked = false));
$("sort").value = "new";
render();
});

// Semester label helper (Spring/ Summer/ Fall)
function termLabel(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  const term = (m <= 5) ? "Spring" : (m <= 8) ? "Summer" : "Fall";
  return { term, year: y };
}

function dateLabel(p) {
  const start = termLabel(p.date);
  const ongoing =
    p.ongoing || p.end == null || String(p.end).toLowerCase() === "present";

  if (!start) return ongoing ? "Present" : (termLabel(p.end)?.term ?? "");

  if (ongoing) return `${start.term} ${start.year}–Present`;

  const end = termLabel(p.end);
  if (!end) return `${start.term} ${start.year}`;

  // Same term & year → collapse to single label
  if (start.term === end.term && start.year === end.year) {
    return `${start.term} ${start.year}`;
  }
  return `${start.term} ${start.year}–${end.term} ${end.year}`;
}



// -------- 5) Render results ------------------------------------
function render() {
  const cards = document.getElementById("cards");
  const empty = document.getElementById("empty");
  const out = sortProjects(PROJECTS.filter(passesFilters));
  renderTechChips(out);

  document.getElementById("results-text").textContent =
    `Showing ${out.length} of ${PROJECTS.length} projects`;

  cards.innerHTML = "";
  out.forEach((p) => {
    const featuredBadge = p.featured
      ? `<span class="badge badge--featured">Featured</span>` : "";
    const ongoingBadge = (p.ongoing || p.end == null)
      ? `<span class="badge badge--ongoing">Ongoing</span>` : "";

    const demoBtn = p.demoUrl
      ? `<a class="btn primary" href="${p.demoUrl}" target="_blank" rel="noopener">Live Demo</a>`
      : "";
    const srcBtn = p.sourceUrl
      ? `<a class="btn" href="${p.sourceUrl}" target="_blank" rel="noopener">Source</a>`
      : `<span class="btn" style="opacity:.6;cursor:not-allowed" title="Private">Private</span>`;

    const techHtml = p.tech
      .map((t) => `<span class="chip" style="cursor:default">${t}</span>`)
      .join("");

    const card = el(`
      <article class="card" aria-labelledby="t-${p.id}">
        <div class="thumb">
          <img src="${p.image}" alt="${p.title} thumbnail" loading="lazy" decoding="async">
          <div class="badges">${featuredBadge}${ongoingBadge}</div>
        </div>
        <div class="body">
          <div class="title-row">
            <h3 id="t-${p.id}">${p.title}</h3>
            <span class="muted" style="font-size:.85rem">${dateLabel(p)}</span>
          </div>
          <p class="desc">${p.description}</p>
          <div class="tags">${techHtml}</div>
          <div class="actions">${demoBtn}${srcBtn}</div>
        </div>
      </article>
    `);
    cards.appendChild(card);
  });

  empty.hidden = out.length !== 0;
}


render();

