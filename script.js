const body = document.body;
const pageKey = body.dataset.page;
const pages = window.SITE_DATA.pages;
const pageOrder = window.SITE_DATA.pageOrder;

const navLinks = Array.from(document.querySelectorAll("[data-nav-page]"));
const menuToggle = document.querySelector(".menu-toggle");
const header = document.querySelector(".site-header");

const videoExtensions = new Set(["mp4", "webm", "ogg", "mov"]);

const isMobileViewport = () => window.matchMedia("(max-width: 768px)").matches;

const getMobileSrc = (src) => {
  if (!src.startsWith("assets/")) {
    return src;
  }

  return src.replace(/^assets\//, "assets/mobile/");
};

const hideIfEmpty = (element, shouldHide) => {
  if (!element) {
    return;
  }

  element.hidden = shouldHide;
};


const formatFileName = (value) => {
  const base = value.split("/").pop().replace(/\.[^.]+$/, "");
  return base
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getExtension = (value) => {
  const cleanValue = value.split("?")[0];
  return cleanValue.includes(".")
    ? cleanValue.split(".").pop().toLowerCase()
    : "";
};

const getFilePath = (file) => (typeof file === "string" ? file : file.path);

const getFileLayout = (file) => {
  if (typeof file === "string") {
    return "standard";
  }

  return file.layout || "standard";
};

const groupFilesByLayout = (files) =>
  files.reduce(
    (groups, file) => {
      const layout = getFileLayout(file) === "landscape" ? "landscape" : "standard";
      groups[layout].push(file);
      return groups;
    },
    {
      landscape: [],
      standard: []
    }
  );

const createMediaElement = (src, altText) => {
  const extension = getExtension(src);

  if (videoExtensions.has(extension)) {
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.muted = true;
    video.src = encodeURI(src);
    return video;
  }

  const image = document.createElement("img");
  image.decoding = "async";
  image.loading = "lazy";
  image.alt = altText;

  const mobileSrc = getMobileSrc(src);
  const shouldUseMobile = isMobileViewport() && mobileSrc !== src;
  image.src = encodeURI(shouldUseMobile ? mobileSrc : src);

  if (shouldUseMobile) {
    image.addEventListener(
      "error",
      () => {
        if (image.src !== encodeURI(src)) {
          image.src = encodeURI(src);
        }
      },
      { once: true }
    );
  }

  return image;
};

const createMediaCard = (basePath, file, sectionTitle) => {
  const article = document.createElement("article");
  article.className = "media-card";

  const frame = document.createElement("div");
  frame.className = "media-frame";

  const filePath = getFilePath(file);
  const fileTitle = formatFileName(filePath);
  const src = `${basePath}/${filePath}`;
  const media = createMediaElement(src, `${sectionTitle} - ${fileTitle}`);
  frame.append(media);

  article.append(frame);
  return article;
};

const renderHeroArtwork = (page) => {
  const heroArtShowcase = document.querySelector("#hero-art-showcase");
  const primaryLink = document.querySelector("#hero-primary-link");

  if (primaryLink && page.sections.length) {
    primaryLink.href = `#${page.sections[0].id}`;
  }

  if (!heroArtShowcase) {
    return;
  }

  if (!page.heroArtwork || !page.heroArtwork.length) {
    hideIfEmpty(heroArtShowcase, true);
    return;
  }

  const fragment = document.createDocumentFragment();

  page.heroArtwork.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = `art-showcase-card art-showcase-card--${index + 1}`;

    const image = createMediaElement(item.src, item.alt);

    card.append(image);
    fragment.append(card);
  });

  heroArtShowcase.append(fragment);
};

const createEmptyState = (text) => {
  const card = document.createElement("div");
  card.className = "empty-state";
  card.textContent = text;
  return card;
};

const buildSiteNav = () => {
  navLinks.forEach((link) => {
    const targetKey = link.dataset.navPage;
    if (targetKey === pageKey) {
      link.classList.add("is-current");
    }
  });
};

const setupMobileMenu = () => {
  if (!menuToggle || !header) {
    return;
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
};

const setupContactForm = () => {
  const form = document.querySelector("#contact-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const project = (formData.get("project") || "").toString().trim();

    if (!name && !email && !phone && !project) {
      alert("Please enter at least one piece of information before sending.");
      return;
    }

    const lines = [
      name ? `Name: ${name}` : null,
      email ? `Email: ${email}` : null,
      phone ? `Phone: ${phone}` : null,
      project ? `Project / Request: ${project}` : null
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join("\n"));
    const whatsappUrl = `https://wa.me/972547343857?text=${text}`;

    window.open(whatsappUrl, "_blank");
  });
};

const renderHome = () => {
  const homeGrid = document.querySelector("#home-grid");
  if (!homeGrid) {
    return;
  }

  const cardEyebrows = {
    "graphic-design-and-digital-marketing": "Warm visual stories",
    "master-classes": "Quiet creative practice",
    "original-art": "Texture, color, stillness",
    "my-journey": "A path back to art",
    "contact-me": "A kind beginning"
  };

  const fragment = document.createDocumentFragment();

  pageOrder.forEach((key) => {
    const page = pages[key];
    const card = document.createElement("a");
    card.className = "page-card";
    card.href = page.file;
    card.dataset.pageKey = key;

    const eyebrow = document.createElement("p");
    eyebrow.className = "card-eyebrow";
    eyebrow.textContent = cardEyebrows[key] || page.heroKicker;

    const title = document.createElement("h3");
    title.textContent = page.menuLabel;

    const text = document.createElement("p");
    text.className = "card-text";
    text.textContent = page.summary;

    const meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = page.sections.length
      ? "Open the galleries"
      : "Read more";

    card.append(eyebrow, title, text, meta);
    fragment.append(card);
  });

  homeGrid.append(fragment);
};

const renderDetailPage = async () => {
  const page = pages[pageKey];
  if (!page) {
    return;
  }

  const kicker = document.querySelector("#page-kicker");
  const title = document.querySelector("#page-title");
  const summary = document.querySelector("#page-summary");
  const panelsRoot = document.querySelector("#page-panels");
  const panelsSection = document.querySelector("#page-panels-section");
  const sectionNav = document.querySelector("#section-nav");
  const sectionsRoot = document.querySelector("#sections-root");

  document.title = `${page.menuLabel} | Svelte Design Studio`;

  if (kicker) kicker.textContent = page.heroKicker;
  if (title) title.textContent = page.heroTitle;
  if (summary) summary.textContent = page.summary;
  renderHeroArtwork(page);

  if (panelsRoot && page.panels.length) {
    const panelFragment = document.createDocumentFragment();

    page.panels.forEach((panel) => {
      const card = document.createElement("article");
      card.className = pageKey === "my-journey" ? "story-block" : "info-card";

      const cardTitle = document.createElement("h3");
      cardTitle.textContent = panel.title;

      const cardText = document.createElement("p");
      cardText.textContent = panel.text;

      card.append(cardTitle, cardText);
      panelFragment.append(card);
    });

    panelsRoot.append(panelFragment);
  } else {
    hideIfEmpty(panelsSection, true);
  }

  if (sectionNav && page.sections.length) {
    const navFragment = document.createDocumentFragment();

    page.sections.forEach((section) => {
      const link = document.createElement("a");
      link.className = "pill-link";
      link.href = `#${section.id}`;
      link.textContent = section.title;
      navFragment.append(link);
    });

    sectionNav.append(navFragment);
  } else {
    hideIfEmpty(sectionNav, true);
  }

  if (!sectionsRoot) {
    return;
  }

  if (!page.sections.length) {
    if (!page.panels.length) {
      sectionsRoot.append(createEmptyState("This page is waiting for its next story."));
    }
    return;
  }

  const sectionFragment = document.createDocumentFragment();

  for (const section of page.sections) {
    const wrapper = document.createElement("section");
    wrapper.className = "section gallery-section";
    wrapper.id = section.id;

    const heading = document.createElement("div");
    heading.className = "section-heading";

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = section.title;

    const titleNode = document.createElement("h2");
    titleNode.textContent = section.title;

    const note = document.createElement("p");
    note.textContent = section.note;

    heading.append(eyebrow, titleNode, note);

    const grid = document.createElement("div");
    grid.className = "gallery-grid";

    if (section.files.length) {
      const groupedFiles = groupFilesByLayout(section.files);

      ["landscape", "standard"].forEach((groupName) => {
        const files = groupedFiles[groupName];
        if (!files.length) {
          return;
        }

        const group = document.createElement("div");
        group.className = `gallery-group gallery-group--${groupName}`;

        files.forEach((file) => {
          group.append(createMediaCard(section.basePath, file, section.title));
        });

        grid.append(group);
      });
    } else {
      grid.append(createEmptyState("This collection is resting between new works."));
    }

    wrapper.append(heading, grid);
    sectionFragment.append(wrapper);
  }

  sectionsRoot.append(sectionFragment);
};

buildSiteNav();
setupMobileMenu();
setupContactForm();

if (pageKey === "home") {
  renderHome();
} else {
  void renderDetailPage();
}
