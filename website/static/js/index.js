document.documentElement.classList.add("js");

const pages = [
  ["home", "Home", "index.html"],
  ["about", "About", "about.html"],
  ["speakers", "Speakers", "speakers.html"],
  ["schedule", "Schedule", "schedule.html"],
  ["attend", "Attend", "attend.html"],
  ["partners", "Sponsors", "partners.html"],
  ["team", "Organizers", "team.html"],
  ["contact", "Contact", "contact.html"]
];
const visiblePages = pages;

const pageSections = {
  home: [
    ["Home", "#home"],
    ["About Retooling", "#why-retooled"],
    ["Retooling in Practice", "#community"],
    ["Speakers List", "#speakers-preview"],
    ["About TEDx", "#what-is-tedx"],
    ["Get Involved", "#participate"]
  ],
  about: [
    ["Overview", "#about-top"],
    ["About the Event", "#about-event"],
    ["Theme", "#theme"],
    ["TED and TEDx", "#about-tedx"],
    ["Principles", "#principles"],
    ["Experience", "#experience"]
  ],
  speakers: [
    ["Overview", "#speakers-top"],
    ["Speakers List", "#speaker-intro"],
    ["Arina Bokas", "#arina-bokas"],
    ["Kefei Duan", "#kefei-duan"],
    ["Janilla Lee", "#janilla-lee"],
    ["Shelly Propson Lennon", "#shelly-propson-lennon"],
    ["Khalid Mirza", "#khalid-mirza"],
    ["Pavan Muzumdar", "#pavan-muzumdar"],
    ["Amartya Sen", "#amartya-sen"],
    ["Ahmad Tafti", "#ahmad-tafti"],
    ["Darin Weiss", "#darin-weiss"],
    ["Debbie Wertz", "#debbie-wertz"],
    ["Kaiqi Zhao", "#kaiqi-zhao"],
    ["Program updates", "#speaker-note"]
  ],
  schedule: [
    ["Overview", "#schedule-top"],
    ["Day at a Glance", "#day-at-a-glance"],
    ["Session Format", "#session-format"],
    ["Plan Your Day", "#plan-your-day"]
  ],
  attend: [
    ["Overview", "#attend-top"],
    ["Free Registration", "#tickets"],
    ["Apply to Speak", "#speaker-application"],
    ["Speaker Commitments", "#speaker-expectations"],
    ["Livestream", "#livestream"],
    ["Location & Access", "#access"]
  ],
  partners: [
    ["Overview", "#partners-top"],
    ["Why Sponsor", "#why-partner"],
    ["Opportunities", "#opportunities"],
    ["Sponsors", "#partner-grid"],
    ["Contact", "#partner-contact"]
  ],
  team: [
    ["Overview", "#team-top"],
    ["Organizing Team", "#organizing-team"],
    ["Production", "#production"],
    ["Volunteer", "#volunteer"]
  ],
  contact: [
    ["Overview", "#contact-top"],
    ["Contact the Team", "#contact-team"],
    ["Send a Message", "#message"],
    ["Questions", "#faq"],
    ["Official Listing", "#official-event"]
  ]
};

const pageKey = document.body.dataset.page || "home";
const currentPageIndex = Math.max(0, pages.findIndex(([key]) => key === pageKey));

function buildHeader() {
  const mount = document.querySelector("#site-header");
  if (!mount) return;

  const nav = visiblePages
    .map(([key, label, href]) => {
      const active = key === pageKey ? ' class="active" aria-current="page"' : "";
      return `<li><a href="${href}"${active}>${label}</a></li>`;
    })
    .join("");

  mount.innerHTML = `
    <header class="site-header">
      <div class="site-progress" aria-hidden="true"><div class="site-progress-bar"></div></div>
      <div class="utility-bar">
        <strong>TEDxAuburnHills &bull; Retooling</strong>
        <div class="utility-links">
          <span>October 10, 2026 &bull; 11:00 a.m.&ndash;4:00 p.m. Eastern time</span>
          <a href="https://www.ted.com/tedx/events/69999" target="_blank" rel="noopener noreferrer">Official TED event page</a>
        </div>
      </div>
      <div class="conference-header" rt-liquid-glass rt-liquid-glass-blur="11" rt-liquid-glass-scale="30" rt-liquid-glass-map="512" rt-liquid-glass-tint="rgba(255,255,255,.36)">
        <a class="conference-brand" href="index.html" aria-label="TEDxAuburnHills home">
          <span class="brand-copy">
            <span class="brand-line"><span class="tedx">TEDx</span><span class="place">AuburnHills</span></span>
            <small>x = independently organized TED event</small>
          </span>
        </a>
        <button class="menu-toggle" type="button" aria-label="Toggle site menu" aria-expanded="false">
          <span></span><span></span>
        </button>
        <nav class="page-nav" aria-label="Site pages"><ul>${nav}</ul></nav>
      </div>
    </header>`;
}

function buildSidebar() {
  const mount = document.querySelector("#site-sidebar");
  const sections = pageSections[pageKey];
  if (!mount || !sections?.length) return;

  const [, pageLabel] = pages[currentPageIndex];
  const links = sections
    .map(([label, href], index) => `
      <a href="${href}">
        <span class="anchor-index">${String(index + 1).padStart(2, "0")}</span>
        <span>${label}</span>
      </a>`)
    .join("");

  mount.innerHTML = `
    <aside class="anchor-sidebar" aria-label="${pageLabel} sections">
      <nav class="anchor-nav">${links}</nav>
    </aside>`;
}

function buildFooter() {
  const mount = document.querySelector("#site-footer");
  if (!mount) return;

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div>
          <p class="footer-brand"><span class="tedx">TEDx</span><span class="place">AuburnHills</span></p>
          <p>Retooling: Same hands, different tools.</p>
        </div>
        <div>
          <strong>Event</strong>
          <p>October 10, 2026 &bull; 11:00 a.m.&ndash;4:00 p.m. Eastern time</p>
          <p><a href="https://www.ted.com/tedx/events/69999" target="_blank" rel="noopener noreferrer">View the official TED event page</a></p>
        </div>
        <div>
          <strong>Image credit</strong>
          <p><a href="https://commons.wikimedia.org/wiki/File:Autumn_at_Spencer_Park.jpg" target="_blank" rel="noopener noreferrer">Autumn at Spencer Park</a> by Olson.Sarah, resized and adapted under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.</p>
        </div>
      </div>
      <div class="footer-legal">This independent TEDx event is operated under license from TED.</div>
    </footer>`;
}

function buildPageFlow() {
  const footerMount = document.querySelector("#site-footer");
  if (!footerMount) return;

  const currentVisibleIndex = visiblePages.findIndex(([key]) => key === pageKey);
  const nextIndex = currentVisibleIndex < 0 ? 0 : (currentVisibleIndex + 1) % visiblePages.length;
  const [, nextLabel, nextHref] = visiblePages[nextIndex];
  const prompt = nextIndex === 0 ? "Return to" : "Continue to";
  const section = document.createElement("section");
  section.className = "page-next";
  section.innerHTML = `
    <a href="${nextHref}">
      <span class="page-next-copy"><span>${prompt}</span><strong>${nextLabel}</strong></span>
      <i class="page-next-arrow" aria-hidden="true">&nearr;&#xfe0e;</i>
    </a>`;
  footerMount.before(section);
}

function buildMastheadDetails() {
  const panel = document.querySelector(".page-masthead .masthead-panel");
  const title = panel?.querySelector("h1");
  if (!panel || !title) return;

  panel.setAttribute("rt-liquid-glass", "");
  panel.setAttribute("rt-liquid-glass-blur", "12");
  panel.setAttribute("rt-liquid-glass-scale", "34");
  panel.setAttribute("rt-liquid-glass-map", "640");
  panel.setAttribute("rt-liquid-glass-tint", "rgba(255,255,255,.12)");
  panel.setAttribute("rt-liquid-glass-fallback-blur", "16");

  const words = title.textContent.trim().split(/\s+/);
  title.innerHTML = words
    .map((word, index) => `<span class="title-word" style="--word-index:${index}">${word}</span>`)
    .join(" ");
}

function prepareSectionVariants() {
  document.querySelectorAll(".content-wrap > .section-heading + .feature-split").forEach(split => {
    split.parentElement.classList.add("heading-split-layout");
  });

  const wholeSectionGlass = ["partner-grid"];
  wholeSectionGlass.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;
    section.classList.add("section-glass");
    section.querySelector(":scope > .content-wrap")?.classList.remove("glass-panel");
  });

  ["partner-grid"].forEach(id => {
    document.getElementById(id)?.classList.add("tone-dark");
  });

  const flowSections = [
    "why-retooled",
    "what-is-tedx",
    "about-tedx",
    "speaker-intro",
    "speaker-note",
    "speaker-expectations",
    "contact-team",
    "why-partner",
    "organizing-team"
  ];
  flowSections.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;
    section.classList.add("flow-background", "tone-dark");
    section.classList.remove("section-glass");
    if (id !== "speaker-expectations") {
      section.querySelector(":scope > .content-wrap")?.classList.remove("glass-panel");
    }
  });

  ["theme", "message", "production", "opportunities", "speaker-application"].forEach(id => {
    document.getElementById(id)?.classList.add("ambient-zone");
  });
}

function setupMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".page-nav");
  if (!toggle || !nav) return;

  const closeMenu = () => {
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", event => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });
}

function setupAnchorNavigation() {
  const links = [...document.querySelectorAll(".anchor-nav a")];
  const sections = links
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (!sections.length) return;

  const activate = id => {
    links.forEach(link => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  activate((window.location.hash || `#${sections[0].id}`).slice(1));

  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) activate(visible.target.id);
  }, { rootMargin: "-23% 0px -58% 0px", threshold: [0, .18, .45] });

  sections.forEach(section => observer.observe(section));
}

function setupRevealMotion() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const selectors = [
    ".content-section .section-heading",
    ".content-section .section-lead",
    ".content-section .prose",
    ".info-card",
    ".action-card",
    ".speaker-card",
    ".home-speaker-card",
    ".profile-card",
    ".team-card",
    ".contact-card",
    ".logo-placeholder",
    ".timeline-item",
    ".side-card",
    ".faq-list details",
    ".signup-form"
  ];
  const elements = [...document.querySelectorAll(selectors.join(","))];
  elements.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${(index % 5) * 55}ms`);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    elements.forEach(element => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .1 });

  elements.forEach(element => observer.observe(element));
}

function setupSectionRendering() {
  const sections = [...document.querySelectorAll(".content-section")];
  if (!sections.length || !window.CSS?.supports("content-visibility", "auto")) return;
  sections.forEach(section => section.classList.add("is-render-managed"));
}

function setupGlassStyling() {
  const toneTargets = document.querySelectorAll([
    ".side-card",
    ".info-card",
    ".action-card",
    ".speaker-card",
    ".home-speaker-card",
    ".profile-card",
    ".team-card",
    ".contact-card",
    ".timeline-item",
    ".logo-placeholder",
    ".faq-list details",
    ".notice"
  ].join(","));
  const tones = ["red", "dark", "light"];
  toneTargets.forEach((element, index) => {
    const tone = element.matches(".side-card") ? "red" : tones[index % tones.length];
    element.classList.add(`glass-tone-${tone}`);
  });

  document.querySelectorAll([
    ".glass-panel",
    ".section-glass",
    ".side-card",
    ".info-card",
    ".action-card",
    ".speaker-card",
    ".home-speaker-card",
    ".profile-card",
    ".team-card",
    ".contact-card",
    ".timeline-item",
    ".logo-placeholder",
    ".faq-list details",
    ".signup-form",
    ".notice",
    ".button"
  ].join(",")).forEach(element => element.setAttribute("rt-liquid-glass", ""));
}

function setupStaticBackdrop() {
  const field = document.createElement("div");
  field.id = "neural-field";
  field.setAttribute("aria-hidden", "true");
  document.body.prepend(field);
}

function setupSpeakerGrid() {
  const section = document.querySelector("#speaker-intro");
  if (!section) return;

  const grid = document.createElement("span");
  grid.className = "speaker-grid-field";
  grid.setAttribute("aria-hidden", "true");
  section.prepend(grid);
}

function setupScrollEffects() {
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".site-progress-bar");
  const sidebar = document.querySelector(".anchor-sidebar");
  const masthead = document.querySelector(".page-masthead");
  let ticking = false;

  const update = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll));
    const isCondensed = scrollTop > 52 && window.innerWidth > 1050;
    progress?.style.setProperty("transform", `scaleX(${ratio})`);
    sidebar?.style.setProperty("--side-progress", ratio.toFixed(4));
    masthead?.style.setProperty("--hero-shift", `${Math.min(70, scrollTop * .08).toFixed(1)}px`);
    header?.classList.toggle("is-condensed", isCondensed);
    document.body.classList.toggle("header-condensed", isCondensed);
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
}

function setupPointerAtmosphere() {
  document.querySelectorAll(".ambient-zone").forEach(zone => {
    if (!zone.querySelector(":scope > .ambient-glow")) {
      const glow = document.createElement("span");
      glow.className = "ambient-glow";
      glow.setAttribute("aria-hidden", "true");
      zone.prepend(glow);
    }
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (reduceMotion || coarsePointer) return;

  let frame = 0;
  let latestEvent = null;
  let activeAmbient = null;
  let activeGlass = null;
  let activeMasthead = null;
  let activeSpeakerGrid = null;

  const resetPair = (element, xName, yName, xValue, yValue) => {
    if (!element) return;
    element.style.setProperty(xName, xValue);
    element.style.setProperty(yName, yValue);
  };

  const setRelativePoint = (element, event, xName, yName, pointCache) => {
    let point = pointCache.get(element);
    if (!point) {
      const rect = element.getBoundingClientRect();
      point = {
        x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100)),
        y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / Math.max(1, rect.height)) * 100))
      };
      pointCache.set(element, point);
    }
    element.style.setProperty(xName, `${point.x.toFixed(1)}%`);
    element.style.setProperty(yName, `${point.y.toFixed(1)}%`);
    return point;
  };

  const resetActive = () => {
    resetPair(activeAmbient, "--ambient-x", "--ambient-y", "50%", "50%");
    resetPair(activeGlass, "--glass-x", "--glass-y", "18%", "8%");
    resetPair(activeMasthead, "--pointer-x", "--pointer-y", "70%", "28%");
    resetPair(activeSpeakerGrid, "--speaker-grid-x", "--speaker-grid-y", "50%", "50%");
    if (activeSpeakerGrid) {
      activeSpeakerGrid.style.setProperty("--speaker-grid-shift-x", "0px");
      activeSpeakerGrid.style.setProperty("--speaker-grid-shift-y", "0px");
    }
    activeAmbient = null;
    activeGlass = null;
    activeMasthead = null;
    activeSpeakerGrid = null;
  };

  const render = () => {
    const event = latestEvent;
    frame = 0;
    if (!event || !(event.target instanceof Element)) return;

    const nextAmbient = event.target.closest(".ambient-zone");
    const nextGlass = event.target.closest("[rt-liquid-glass]");
    const nextMasthead = event.target.closest(".page-masthead");
    const nextSpeakerGrid = event.target.closest("#speaker-intro");
    const pointCache = new Map();

    if (activeAmbient && activeAmbient !== nextAmbient) resetPair(activeAmbient, "--ambient-x", "--ambient-y", "50%", "50%");
    if (activeGlass && activeGlass !== nextGlass) resetPair(activeGlass, "--glass-x", "--glass-y", "18%", "8%");
    if (activeMasthead && activeMasthead !== nextMasthead) resetPair(activeMasthead, "--pointer-x", "--pointer-y", "70%", "28%");
    if (activeSpeakerGrid && activeSpeakerGrid !== nextSpeakerGrid) {
      resetPair(activeSpeakerGrid, "--speaker-grid-x", "--speaker-grid-y", "50%", "50%");
      activeSpeakerGrid.style.setProperty("--speaker-grid-shift-x", "0px");
      activeSpeakerGrid.style.setProperty("--speaker-grid-shift-y", "0px");
    }

    activeAmbient = nextAmbient;
    activeGlass = nextGlass;
    activeMasthead = nextMasthead;
    activeSpeakerGrid = nextSpeakerGrid;

    if (activeAmbient) setRelativePoint(activeAmbient, event, "--ambient-x", "--ambient-y", pointCache);
    if (activeGlass) setRelativePoint(activeGlass, event, "--glass-x", "--glass-y", pointCache);
    if (activeMasthead) setRelativePoint(activeMasthead, event, "--pointer-x", "--pointer-y", pointCache);
    if (activeSpeakerGrid) {
      const point = setRelativePoint(activeSpeakerGrid, event, "--speaker-grid-x", "--speaker-grid-y", pointCache);
      activeSpeakerGrid.style.setProperty("--speaker-grid-shift-x", `${((point.x - 50) * .18).toFixed(1)}px`);
      activeSpeakerGrid.style.setProperty("--speaker-grid-shift-y", `${((point.y - 50) * .12).toFixed(1)}px`);
    }
  };

  document.addEventListener("pointermove", event => {
    latestEvent = event;
    if (!frame) frame = window.requestAnimationFrame(render);
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", resetActive, { passive: true });
  window.addEventListener("blur", resetActive, { passive: true });
}

function setupScheduleThread() {
  const timeline = document.querySelector("[data-schedule-thread]");
  const svg = timeline?.querySelector(".schedule-thread");
  const path = svg?.querySelector("path");
  const items = timeline ? [...timeline.querySelectorAll(".timeline-item")] : [];
  if (!timeline || !svg || !path || !items.length) return;

  let pathLength = 1;
  let ticking = false;

  const drawPath = () => {
    const width = Math.max(1, timeline.clientWidth);
    const height = Math.max(1, timeline.scrollHeight);
    const narrow = window.innerWidth <= 700;
    const centerX = narrow ? 26 : width / 2;
    const sway = narrow ? 12 : Math.min(86, width * .085);
    const points = [0, ...items.map(item => item.offsetTop + item.offsetHeight / 2), height];
    let route = `M ${centerX.toFixed(1)} 0`;

    for (let index = 1; index < points.length; index += 1) {
      const previousY = points[index - 1];
      const nextY = points[index];
      const distance = nextY - previousY;
      const direction = index % 2 === 0 ? -1 : 1;
      route += ` C ${(centerX + sway * direction).toFixed(1)} ${(previousY + distance * .34).toFixed(1)}, ${(centerX - sway * direction).toFixed(1)} ${(previousY + distance * .66).toFixed(1)}, ${centerX.toFixed(1)} ${nextY.toFixed(1)}`;
    }

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    path.setAttribute("d", route);
    pathLength = Math.max(1, path.getTotalLength());
    path.style.strokeDasharray = String(pathLength);
    update();
  };

  const update = () => {
    const rect = timeline.getBoundingClientRect();
    const start = window.innerHeight * .82;
    const finish = window.innerHeight * .2;
    const progress = Math.min(1, Math.max(0, (start - rect.top) / Math.max(1, rect.height + start - finish)));
    path.style.strokeDashoffset = String(pathLength * (1 - progress));
    timeline.style.setProperty("--thread-progress", progress.toFixed(4));

    const timelineVisible = rect.bottom > 0 && rect.top < window.innerHeight;
    let nearestItem = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    if (timelineVisible) {
      items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const distance = Math.abs(itemRect.top + itemRect.height / 2 - window.innerHeight / 2);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestItem = item;
        }
      });
    }
    items.forEach(item => item.classList.toggle("is-current", item === nearestItem && nearestDistance < window.innerHeight * .34));
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.requestAnimationFrame(drawPath);
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", drawPath, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(drawPath).observe(timeline);
}

function setupPageTransitions() {
  const curtain = document.createElement("div");
  curtain.className = "page-curtain";
  curtain.setAttribute("aria-hidden", "true");
  curtain.innerHTML = `
    <div class="curtain-lockup">
      <span class="curtain-brand"><b>TEDx</b><span>AuburnHills</span></span>
      <small>x = independently organized TED event</small>
      <em>Retooling</em>
    </div>`;
  document.body.append(curtain);
}

function setupPlaceholderUI() {
  document.querySelectorAll("[data-placeholder-form]").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      if (status) status.textContent = "This form layout is ready. Add the final submission service before launch.";
    });
  });

  document.querySelectorAll("[data-placeholder-action]").forEach(button => {
    const originalText = button.textContent;
    button.addEventListener("click", () => {
      button.textContent = `${button.dataset.placeholderAction} to be added`;
      window.setTimeout(() => {
        button.textContent = originalText;
      }, 2200);
    });
  });
}

buildHeader();
buildSidebar();
buildFooter();
buildPageFlow();
buildMastheadDetails();
prepareSectionVariants();
setupMenu();
setupAnchorNavigation();
setupRevealMotion();
setupSectionRendering();
setupGlassStyling();
setupStaticBackdrop();
setupSpeakerGrid();
setupPointerAtmosphere();
setupScrollEffects();
setupScheduleThread();
setupPageTransitions();
setupPlaceholderUI();

window.addEventListener("DOMContentLoaded", () => {
  window.requestAnimationFrame(() => {
    window.setTimeout(() => document.body.classList.add("is-ready"), 360);
  });
});

window.addEventListener("load", () => {
  window.setTimeout(() => {
    document.body.classList.add("is-ready");
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (target) window.requestAnimationFrame(() => target.scrollIntoView());
  }, 360);
});
