// ===== Data =====================================================
const JOBS = [
  {
    id: "it-admin",
    title: "Information Technology Administrator",
    company: "Sunsong North America, Inc. & Harco Manufacturing Group, LLC",
    location: "Dayton, OH · On-site",
    type: "Full-time",
    start: "2025-09-29",
    end: null,
    image: "/assets/companylogo.png",
    bullets: [
      "Provide IT support for 60+ employees across office & production; diagnose and resolve HW/SW/network issues.",
      "Support & troubleshoot Microsoft Dynamics AX; coordinate with IT & vendors; maintain reliable data flows.",
      "Server maintenance, workstation setup, new device configuration, and user provisioning in AD & M365.",
      "Troubleshoot ZPL/Zebra label workflows; maintain office/industrial printers; manage EDI (receiving/ASN).",
      "Backup to Network Admin for cabling, upgrades, and infrastructure support."
    ],
    technologies: [
      "Windows", "Windows Server","Active Directory","Microsoft 365","Dynamics AX",
      "EDI","Networking","VMware","DNS/DHCP", 
      "Exchange Online","Cabling","Hardware","Zebra Printers", "Brother Printers", "HP Printers", "Epson Printers"
    ],
    skills: [
      "Technical Support","System Administration","Troubleshooting",
      "Documentation","User Training","IT Coordination","Networking Fundamentals",
      "Hardware Diagnostics","Incident Response","Communication",
      "Process Improvement","Vendor Management"
    ]
  },
  {
    id: "ops-manager",
    title: "Operations Manager",
    company: "University of Dayton",
    location: "Dayton, OH · On-site",
    type: "Part-time",
    start: "2023-07-01",
    end: "2025-08-31",
    image: "/assets/schoollogo.jpg",
    bullets: [
      "Promoted to Manager; led a 6-member team, improving efficiency by 30% and reducing setup errors.",
      "Delivered AV/IT support (Crestron, audio, event systems); resolved ~90% of issues independently.",
      "Coordinated event operations ensuring smooth execution, clear communication, and quick resolution."
    ],
    technologies: [
      "Crestron","Audio Systems","Video Conferencing","Networking",
      "Windows","Cabling","Hardware","Zoom","Projector Systems", "Video Equipment"
    ],
    skills: [
      "Leadership","Communication","Project Management","Technical Setup",
      "Team Coordination","Customer Support","Time Management","Teamwork",
      "Training","Event Management","Troubleshooting","Process Optimization","Customer Service","Event Coordination","Problem Solving","Adaptability"
    ]
  },
  {
    id: "ops-assistant",
    title: "Operations Assistant",
    company: "University of Dayton",
    location: "Dayton, OH · On-site",
    type: "Part-time",
    start: "2022-05-01",
    end: "2023-07-01",
    image: "/assets/schoollogo.jpg",
    bullets: [
      "Provided technical support for Crestron, audio setups, and computers.",
      "Worked effectively in high-pressure environments while maintaining customer satisfaction.",
      "Collaborated with teams of 2–6 to deliver events."
    ],
    technologies: ["Crestron","Audio Systems","Windows","Cabling","Hardware","Video Equipment"],
    skills: [
      "Customer Service","Technical Setup","Time Management",
      "Communication","Problem Solving","Event Coordination",
      "Teamwork","Adaptability","Troubleshooting","Customer Support"
    ]
  }
];

// classify every tag once
const TECH_SET  = new Set(JOBS.flatMap(j => j.technologies || []));
const SKILL_SET = new Set(JOBS.flatMap(j => j.skills || []));
const tagClass = (t) => TECH_SET.has(t) ? "chip--tech" : SKILL_SET.has(t) ? "chip--skill" : "";

// ===== Helpers ==================================================
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const fmt = (d) => !d ? "Present" : new Date(d).toLocaleString(undefined, { month: "short", year: "numeric" });
const span = (a,b) => `${fmt(a)} – ${fmt(b)}`;
const byStartAsc = (a,b) => +new Date(a.start) - +new Date(b.start);
function getFilteredJobs() {
  return [...JOBS].sort(byStartAsc).filter(jobMatchesSelectedTags);
}



// ===== DOM refs ================================================
const rail   = $("#timeline");
const modal  = $("#job-modal");
const mTitle = $("#modal-title");
const mSub   = $("#modal-sub");
const mDates = $("#modal-dates");
const mPts   = $("#modal-points");

// ===== dynamic card spacing ====================================
function setGapFromHeight(pointEl, cardEl) {
  const h = cardEl.getBoundingClientRect().height || cardEl.offsetHeight || 0;
  const base  = 12;
  const extra = Math.max(0, (h - 120) / 20);
  pointEl.style.setProperty("--y-gap", `${(base + extra).toFixed(1)}px`);
  pointEl.style.setProperty("--nub", "16px");
}

// ===== Filter state (Experiences) ==============================
const expState = { tags: new Set() };

// desktop chip rows
const techChipsDesktop  = document.getElementById('exp-tech-chips');
const skillChipsDesktop = document.getElementById('exp-skill-chips');
// bottom-sheet chip rows
const techChipsSheet  = document.getElementById('sheet-tech-chips');
const skillChipsSheet = document.getElementById('sheet-skill-chips');
const filterSheet  = document.getElementById("filter-sheet");
const openSheetBtn = document.getElementById("open-filters");
const closeSheetBtn= document.getElementById("close-sheet");
const applyBtn     = document.getElementById("apply-filters");
const clearBtn     = document.getElementById("clear-filters");
const resetFiltersDesktop = document.getElementById("reset-filters-desktop");
// desktop chip containers
const techDesktop  = document.getElementById('exp-tech-chips');
const skillDesktop = document.getElementById('exp-skill-chips');
// sheet chip containers (mobile)
const techSheet  = document.getElementById('sheet-tech-chips');
const skillSheet = document.getElementById('sheet-skill-chips');
// desktop reset button
const resetDesktopBtn = document.getElementById('reset-filters-desktop');
resetDesktopBtn?.addEventListener('click', () => {
  expState.tags.clear();
  render(); // re-render chips + timeline
});

// Build {tag -> count} from jobs
function collectGroupCounts(jobs) {
  const tech = new Map(), skill = new Map();
  for (const j of jobs) {
    (j.technologies || []).forEach(t => tech.set(t,  (tech.get(t)  || 0) + 1));
    (j.skills        || []).forEach(s => skill.set(s, (skill.get(s) || 0) + 1));
  }
  return { tech, skill };
}


// AND-match: job must include all selected tags
function jobMatchesSelectedTags(job) {
  if (expState.tags.size === 0) return true;
  const set = new Set([...(job.technologies || []), ...(job.skills || [])]);
  for (const t of expState.tags) if (!set.has(t)) return false;
  return true;
}

// (Re)render tag chips into a container
function renderChipGroup(container, countsMap, kind, { defer = false } = {}) {
  if (!container) return;
  const keys = Array.from(countsMap.keys()).sort((a,b) => a.localeCompare(b));
  container.innerHTML = '';

  for (const key of keys) {
    const count = countsMap.get(key);
    const selected = expState.tags.has(key);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip chip--${kind}` + (selected ? ' active' : '');
    btn.setAttribute('aria-pressed', String(!!selected));
    btn.innerHTML = `${key}<span class="muted" style="margin-left:.4rem;font-size:.8em">(${count})</span>`;

    btn.addEventListener('click', () => {
      if (expState.topic && expState.topic !== kind) {/* no-op; we allow mixing */}
      if (expState.tags.has(key)) {
        expState.tags.delete(key);
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed','false');
      } else {
        expState.tags.add(key);
        btn.classList.add('active');
        btn.setAttribute('aria-pressed','true');
      }
      if (!defer) render(); // desktop applies immediately
    });

    container.appendChild(btn);
  }
}

// ===== Render timeline =========================================
function renderSheet() {
  const jobsForSheet = getFilteredJobs(); // based on current expState.tags
  renderTagChips(chipsSheet, jobsForSheet, { defer: true, onToggle: renderSheet });
}

function render(){
  const jobsAll      = [...JOBS].sort(byStartAsc);
  const jobsFiltered = jobsAll.filter(jobMatchesSelectedTags);

  // meta text
  $("#meta").textContent = `Showing ${jobsFiltered.length} of ${jobsAll.length} roles`;

  const counts = collectGroupCounts(jobsFiltered);

  // desktop chips (apply immediately)
  renderChipGroup(techChipsDesktop,  counts.tech,  'tech',  {defer:false});
  renderChipGroup(skillChipsDesktop, counts.skill, 'skill', {defer:false});

  // bottom-sheet chips (rendered when sheet opens)
  renderChipGroup(techChipsSheet,  counts.tech,  'tech',  {defer:true});
  renderChipGroup(skillChipsSheet, counts.skill, 'skill', {defer:true});

  // timeline
  rail.innerHTML = "";
  jobsFiltered.forEach((j, i) => {
    const side = (i % 2 === 0) ? "top" : "bottom";

    const el = document.createElement("div");
    el.className = `point ${side}`;
    el.innerHTML = `
      <div class="card" role="button" tabindex="0" data-id="${j.id}" aria-label="${j.title} at ${j.company}">
        <h4>${j.title}</h4>
        <div class="sub">${j.company}</div>
        <div class="sub" style="font-size:.85rem">${span(j.start, j.end)}</div>
      </div>
    `;
    rail.appendChild(el);

    const card = el.querySelector(".card");
    setGapFromHeight(el, card);
    const ro = new ResizeObserver(() => setGapFromHeight(el, card));
    ro.observe(card);

    const base = 12;
    const extra = Math.max(0, (card.offsetHeight - 120) / 20);
    el.style.setProperty("--y-gap", `${base + extra}px`);
    el.style.setProperty("--nub", "16px");
  });

  rail.onclick = onCardClick;
  rail.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const card = e.target.closest(".card");
      if (card) { e.preventDefault(); openModal(card.dataset.id); }
    }
  };
}

// ===== Card click / modal ======================================
function onCardClick(e){
  const card = e.target.closest(".card");
  if (!card) return;
  openModal(card.dataset.id);
}

function openModal(id){
  const job = JOBS.find(j => j.id === id);
  if (!job) return;

  // Banner image
  const imgEl = document.getElementById("modal-img");
  if (job.image) {
    imgEl.src = job.image;
    imgEl.style.display = "block";
  } else {
    imgEl.style.display = "none";
  }

  // Header and content
  mTitle.textContent = job.title;
  mSub.textContent   = `${job.company} • ${job.location} • ${job.type ?? ""}`.replace(/ • $/,"");
  mDates.textContent = span(job.start, job.end);
  mPts.innerHTML = job.bullets.map(b => `<li>${b}</li>`).join("");

  // Technologies
  const techWrap = document.getElementById("tech-chips");
  const techGroup = document.getElementById("tech-group");
  techWrap.innerHTML = "";
  (job.technologies || []).forEach(t => {
    const el = document.createElement("span");
    el.className = "chip chip--tech";
    el.textContent = t;
    techWrap.appendChild(el);
  });
  techGroup.style.display = (job.technologies?.length) ? "" : "none";

  // Skills
  const skillWrap = document.getElementById("skill-chips");
  const skillGroup = document.getElementById("skill-group");
  skillWrap.innerHTML = "";
  (job.skills || []).forEach(s => {
    const el = document.createElement("span");
    el.className = "chip chip--skill";
    el.textContent = s;
    skillWrap.appendChild(el);
  });
  skillGroup.style.display = (job.skills?.length) ? "" : "none";

  // Show modal
  if (typeof modal.showModal === "function") modal.showModal();
  else modal.setAttribute("open","");
  $("#modal-close").focus();
}


$("#modal-close").addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

// ===== Scroll buttons ===========================================
const scroller = $(".timeline-wrap");
$("#prev").addEventListener("click", () => {
  const step = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) + 40;
  scroller.scrollBy({ left: -step, behavior:"smooth" });
});
$("#next").addEventListener("click", () => {
  const step = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) + 40;
  scroller.scrollBy({ left: step, behavior:"smooth" });
});

// ------ Mobile filter sheet wiring ------
if (openSheetBtn && filterSheet) {
  openSheetBtn.addEventListener('click', () => {
    const visible = [...JOBS].sort(byStartAsc).filter(jobMatchesSelectedTags);
    const counts  = collectGroupCounts(visible);
    renderChipGroup(techChipsSheet,  counts.tech,  'tech',  {defer:true});
    renderChipGroup(skillChipsSheet, counts.skill, 'skill', {defer:true});
    filterSheet.showModal();
  });
}
if (closeSheetBtn) {
  closeSheetBtn.addEventListener('click', () => filterSheet.close());
}
if (applyBtn) {
  applyBtn.addEventListener('click', () => {
    filterSheet.close();
    render(); // apply current expState.tags
  });
}
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    expState.tags.clear();
    const all = [...JOBS].sort(byStartAsc);
    const counts = collectGroupCounts(all);
    renderChipGroup(techChipsSheet,  counts.tech,  'tech',  {defer:true});
    renderChipGroup(skillChipsSheet, counts.skill, 'skill', {defer:true});
    render(); // refresh desktop chips + timeline
  });
}
if (resetFiltersDesktop) {
  resetFiltersDesktop.addEventListener("click", () => {
    expState.tags.clear();

    // rebuild desktop chips for all jobs
    const allJobs = [...JOBS].sort(byStartAsc);
    const counts = collectGroupCounts(allJobs);

    renderChipGroup(techChipsDesktop,  counts.tech,  'tech',  {defer:false});
    renderChipGroup(skillChipsDesktop, counts.skill, 'skill', {defer:false});

    // also sync the mobile sheet so both match
    renderChipGroup(techChipsSheet,  counts.tech,  'tech',  {defer:true});
    renderChipGroup(skillChipsSheet, counts.skill, 'skill', {defer:true});

    render(); // refresh timeline immediately
  });
}



// init
render();
