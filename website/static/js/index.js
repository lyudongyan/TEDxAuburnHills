document.documentElement.classList.add("js");

const pages = [
  ["home", "Home", "index.html"],
  ["about", "About", "about.html"],
  ["speakers", "Speakers", "speakers.html"],
  ["schedule", "Schedule", "schedule.html"],
  ["attend", "Attend", "attend.html"],
  ["partners", "Partners", "partners.html"],
  ["team", "Team", "team.html"],
  ["contact", "Contact", "contact.html"]
];
const hiddenPageKeys = new Set(["partners", "team"]);
const visiblePages = pages.filter(([key]) => !hiddenPageKeys.has(key));

const pageSections = {
  home: [
    ["Home", "#home"],
    ["Why Retooling", "#why-retooled"],
    ["Community", "#community"],
    ["Speakers", "#speakers-preview"],
    ["What is TEDx?", "#what-is-tedx"],
    ["Participate", "#participate"]
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
    ["Introduction", "#speaker-intro"],
    ["Ahmad Tafti", "#ahmad-tafti"],
    ["Kefei Duan", "#kefei-duan"],
    ["Janilla Lee", "#janilla-lee"],
    ["Shelly Propson Lennon", "#shelly-propson-lennon"],
    ["Kaiqi Zhao", "#kaiqi-zhao"],
    ["Open speaker place", "#speaker-06"],
    ["Open speaker place", "#speaker-07"],
    ["Open speaker place", "#speaker-08"],
    ["Applications", "#speaker-note"]
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
    ["Venue & Access", "#access"]
  ],
  partners: [
    ["Overview", "#partners-top"],
    ["Why Partner", "#why-partner"],
    ["Opportunities", "#opportunities"],
    ["Partners", "#partner-grid"],
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
          <span>October 10, 2026 &bull; 11:00 a.m.&ndash;3:00 p.m. Eastern time</span>
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
          <p>October 10, 2026 &bull; 11:00 a.m.&ndash;3:00 p.m. Eastern time<br>Rochester Hills Public Library<br>500 Olde Towne Rd, Rochester, MI 48307</p>
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
    "contact-team"
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

  let measureFrame = 0;
  let resizeTimer = 0;

  const measureSections = () => {
    sections.forEach(section => section.classList.remove("is-render-managed"));
    window.cancelAnimationFrame(measureFrame);
    measureFrame = window.requestAnimationFrame(() => {
      sections.forEach(section => {
        const styles = window.getComputedStyle(section);
        const blockExtras = [
          styles.paddingTop,
          styles.paddingBottom,
          styles.borderTopWidth,
          styles.borderBottomWidth
        ].reduce((total, value) => total + (Number.parseFloat(value) || 0), 0);
        const contentHeight = Math.max(1, section.getBoundingClientRect().height - blockExtras);
        section.style.setProperty("--section-intrinsic-size", `${contentHeight.toFixed(3)}px`);
        section.classList.add("is-render-managed");
      });
      measureFrame = 0;
    });
  };

  if (document.readyState === "complete") {
    measureSections();
  } else {
    window.addEventListener("load", measureSections, { once: true });
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(measureSections, 180);
  }, { passive: true });
}

function setupLiquidGlass() {
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

  const presets = [
    [".glass-panel", { blur: 20, scale: 40, map: 820, tint: "rgba(255,255,255,.09)" }],
    [".section-glass", { blur: 18, scale: 34, map: 920, tint: "rgba(255,255,255,.07)" }],
    [".side-card", { blur: 18, scale: 34, map: 520, tint: "rgba(235,0,40,.18)" }],
    [".info-card", { blur: 17, scale: 32, map: 460, tint: "rgba(255,255,255,.08)" }],
    [".action-card", { blur: 17, scale: 32, map: 460, tint: "rgba(255,255,255,.08)" }],
    [".speaker-card", { blur: 17, scale: 32, map: 500, tint: "rgba(255,255,255,.08)" }],
    [".home-speaker-card", { blur: 16, scale: 30, map: 460, tint: "rgba(255,255,255,.08)" }],
    [".profile-card", { blur: 20, scale: 38, map: 760, tint: "rgba(255,255,255,.08)" }],
    [".team-card", { blur: 17, scale: 32, map: 500, tint: "rgba(255,255,255,.08)" }],
    [".contact-card", { blur: 17, scale: 32, map: 500, tint: "rgba(255,255,255,.08)" }],
    [".timeline-item", { blur: 18, scale: 34, map: 560, tint: "rgba(255,255,255,.08)" }],
    [".logo-placeholder", { blur: 16, scale: 30, map: 420, tint: "rgba(255,255,255,.08)" }],
    [".faq-list details", { blur: 16, scale: 30, map: 520, tint: "rgba(255,255,255,.08)" }],
    [".signup-form", { blur: 18, scale: 34, map: 680, tint: "rgba(255,255,255,.08)" }],
    [".notice", { blur: 14, scale: 26, map: 460, tint: "rgba(255,255,255,.08)" }],
    [".button", { blur: 13, scale: 26, map: 360, tint: "rgba(255,255,255,.10)" }]
  ];

  presets.forEach(([selector, options]) => {
    document.querySelectorAll(selector).forEach(element => {
      let tint = options.tint;
      if (element.classList.contains("glass-tone-red")) tint = "rgba(142,0,25,.66)";
      if (element.classList.contains("glass-tone-dark") || element.classList.contains("tone-dark")) tint = "rgba(16,14,15,.56)";
      if (element.classList.contains("glass-tone-light")) tint = "rgba(255,255,255,.08)";
      element.setAttribute("rt-liquid-glass", "");
      element.setAttribute("rt-liquid-glass-blur", String(options.blur));
      element.setAttribute("rt-liquid-glass-scale", String(options.scale));
      element.setAttribute("rt-liquid-glass-map", String(options.map));
      element.setAttribute("rt-liquid-glass-tint", tint);
      element.setAttribute("rt-liquid-glass-fallback-blur", "14");
    });
  });

  document.querySelectorAll("[rt-liquid-glass]").forEach(element => {
    element.addEventListener("pointermove", event => {
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
      const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 100;
      element.style.setProperty("--glass-x", `${x.toFixed(1)}%`);
      element.style.setProperty("--glass-y", `${y.toFixed(1)}%`);
    }, { passive: true });
    element.addEventListener("pointerleave", () => {
      element.style.setProperty("--glass-x", "18%");
      element.style.setProperty("--glass-y", "8%");
    });
  });

  const refresh = () => window.rtLiquidGlass?.refresh();
  window.addEventListener("load", refresh, { once: true });
  window.setTimeout(refresh, 0);
}

function setupNeuralField() {
  const field = document.createElement("div");
  field.id = "neural-field";
  field.setAttribute("aria-hidden", "true");
  document.body.prepend(field);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !window.VANTA?.NET || !window.THREE) return;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const lowPower = Boolean(connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 4));

  try {
    const effect = window.VANTA.NET({
      el: field,
      THREE: window.THREE,
      mouseControls: !lowPower,
      touchControls: !lowPower,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: .7,
      color: 0x9a001b,
      backgroundColor: 0xf1e8e8,
      points: lowPower ? 6 : 9,
      maxDistance: lowPower ? 18 : 24,
      spacing: lowPower ? 22 : 18,
      showDots: true
    });
    window.addEventListener("pagehide", event => {
      if (!event.persisted) effect.destroy();
    }, { once: true });
  } catch {
    field.classList.add("is-static");
  }
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
    progress?.style.setProperty("transform", `scaleX(${ratio})`);
    sidebar?.style.setProperty("--side-progress", ratio.toFixed(4));
    masthead?.style.setProperty("--hero-shift", `${Math.min(70, scrollTop * .08).toFixed(1)}px`);
    header?.classList.toggle("is-condensed", scrollTop > 52 && window.innerWidth > 1050);
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

function setupMastheadPointer() {
  const masthead = document.querySelector(".page-masthead");
  if (!masthead || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  masthead.addEventListener("pointermove", event => {
    const rect = masthead.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 100;
    masthead.style.setProperty("--pointer-x", `${x.toFixed(1)}%`);
    masthead.style.setProperty("--pointer-y", `${y.toFixed(1)}%`);
  }, { passive: true });
}

function setupAmbientGradients() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll(".ambient-zone").forEach(zone => {
    if (!zone.querySelector(":scope > .ambient-glow")) {
      const glow = document.createElement("span");
      glow.className = "ambient-glow";
      glow.setAttribute("aria-hidden", "true");
      zone.prepend(glow);
    }

    let currentX = 50;
    let currentY = 50;
    let targetX = 50;
    let targetY = 50;
    let frame = 0;

    const animate = () => {
      currentX += (targetX - currentX) * .075;
      currentY += (targetY - currentY) * .075;
      zone.style.setProperty("--ambient-x", `${currentX.toFixed(2)}%`);
      zone.style.setProperty("--ambient-y", `${currentY.toFixed(2)}%`);
      if (Math.abs(targetX - currentX) > .03 || Math.abs(targetY - currentY) > .03) {
        frame = window.requestAnimationFrame(animate);
      } else {
        frame = 0;
      }
    };

    const requestAnimation = () => {
      if (!frame) frame = window.requestAnimationFrame(animate);
    };

    zone.addEventListener("pointermove", event => {
      const rect = zone.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
      targetY = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 100;
      requestAnimation();
    }, { passive: true });

    zone.addEventListener("pointerleave", () => {
      targetX = 50;
      targetY = 50;
      requestAnimation();
    }, { passive: true });
  });
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

  const diagnosticMode = new URLSearchParams(window.location.search).get("diagnostic");
  if (diagnosticMode === "native-navigation") return;

  let recoveryTimer = 0;
  document.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;

    const rawHref = link.getAttribute("href");
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) return;

    const url = new URL(link.href, window.location.href);
    const isInternalPage = url.origin === window.location.origin && url.pathname !== window.location.pathname && /\.html$/i.test(url.pathname);
    if (!isInternalPage) return;

    event.preventDefault();
    document.body.classList.add("is-leaving");
    window.clearTimeout(recoveryTimer);
    recoveryTimer = window.setTimeout(() => document.body.classList.remove("is-leaving"), 2400);
    window.setTimeout(() => {
      window.location.href = url.href;
    }, 560);
  });
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
setupAmbientGradients();
setupLiquidGlass();
setupNeuralField();
setupScrollEffects();
setupMastheadPointer();
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
