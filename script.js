const body = document.body;
const pageKey = body.dataset.page;
const basePages = window.SITE_DATA.pages;
const pageOrder = window.SITE_DATA.pageOrder;
const siteTranslations = window.SITE_TRANSLATIONS || {};
const defaultLanguage = siteTranslations.defaultLanguage || "en";
const supportedLanguages = new Set(siteTranslations.supportedLanguages || [defaultLanguage]);
const languageStorageKey = "svelte-site-language";

const navLinks = Array.from(document.querySelectorAll("[data-nav-page]"));
const menuToggle = document.querySelector(".menu-toggle");
const header = document.querySelector(".site-header");

const videoExtensions = new Set(["mp4", "webm", "ogg", "mov"]);
const lightboxExtensions = new Set(["jpg", "jpeg", "png", "mp4"]);

let currentLanguage = defaultLanguage;
let galleryLightbox = null;

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

const clearIfPresent = (element) => {
  if (element) {
    element.replaceChildren();
  }
};

const normalizeLanguage = (value) => (supportedLanguages.has(value) ? value : defaultLanguage);

const getLanguageFromUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return normalizeLanguage(params.get("lang") || "");
  } catch {
    return defaultLanguage;
  }
};

const getStoredLanguage = () => {
  const languageFromUrl = getLanguageFromUrl();
  if (languageFromUrl !== defaultLanguage) {
    return languageFromUrl;
  }

  try {
    return normalizeLanguage(window.localStorage.getItem(languageStorageKey) || defaultLanguage);
  } catch {
    return defaultLanguage;
  }
};

const storeLanguage = (value) => {
  try {
    window.localStorage.setItem(languageStorageKey, normalizeLanguage(value));
  } catch {
    // Ignore storage failures and keep the current in-memory language.
  }
};

const getStaticDictionary = (lang = currentLanguage) =>
  siteTranslations.static?.[lang] || siteTranslations.static?.[defaultLanguage] || {};

const getStaticValue = (path, fallback = "", lang = currentLanguage) => {
  const segments = path.split(".");
  let value = getStaticDictionary(lang);

  for (const segment of segments) {
    if (value && typeof value === "object" && segment in value) {
      value = value[segment];
    } else {
      return fallback;
    }
  }

  return value ?? fallback;
};

const getStaticText = (path, fallback = "", lang = currentLanguage) => {
  const value = getStaticValue(path, fallback, lang);
  return typeof value === "string" ? value : fallback;
};

const formatText = (template, values = {}) =>
  template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");

const getPageTranslation = (key = pageKey, lang = currentLanguage) =>
  siteTranslations.pages?.[lang]?.[key] || null;

const mergeLocalizedList = (baseList = [], translatedList = []) =>
  baseList.map((item, index) => ({
    ...item,
    ...(translatedList[index] || {})
  }));

const getLocalizedPage = (key = pageKey, lang = currentLanguage) => {
  const basePage = basePages[key];
  if (!basePage) {
    return null;
  }

  const translatedPage = getPageTranslation(key, lang);
  if (!translatedPage) {
    return basePage;
  }

  return {
    ...basePage,
    ...translatedPage,
    panels: mergeLocalizedList(basePage.panels || [], translatedPage.panels),
    sections: mergeLocalizedList(basePage.sections || [], translatedPage.sections),
    heroArtwork: mergeLocalizedList(basePage.heroArtwork || [], translatedPage.heroArtwork)
  };
};

const getPageNavLabel = (key, lang = currentLanguage) => {
  if (key === "home") {
    return getStaticText("nav.home", "Home", lang);
  }

  const page = getLocalizedPage(key, lang);
  return page?.navLabel || page?.menuLabel || getStaticText(`nav.${key}`, "", lang);
};

const getPageHref = (href, lang = currentLanguage) => {
  try {
    const url = new URL(href, window.location.href);

    if (lang === defaultLanguage) {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", lang);
    }

    return `${url.pathname.split("/").pop() || "index.html"}${url.search}${url.hash}`;
  } catch {
    return href;
  }
};

const syncPageLanguageInUrl = () => {
  try {
    const url = new URL(window.location.href);
    if (currentLanguage === defaultLanguage) {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", currentLanguage);
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Ignore URL rewrite failures.
  }
};

const getWhatsAppUrl = (message) =>
  `https://api.whatsapp.com/send?phone=972547343857&text=${encodeURIComponent(message)}`;

const getMailtoUrl = (subject, bodyText) =>
  `mailto:msveta13@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
};

const setPlaceholder = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) {
    element.placeholder = value;
  }
};

const setHref = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) {
    element.href = value;
  }
};

const setAriaLabel = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute("aria-label", value);
  }
};

const syncDocumentLanguage = () => {
  document.documentElement.lang = supportedLanguages.has(currentLanguage) ? currentLanguage : defaultLanguage;
  body.dataset.lang = currentLanguage;
};

const updateDocumentMetadata = () => {
  const metaDescription = document.querySelector('meta[name="description"]');

  if (pageKey === "home") {
    document.title = getStaticText("home.documentTitle", "Svelte Design Studio");
    if (metaDescription) {
      metaDescription.setAttribute("content", getStaticText("home.metaDescription", ""));
    }
    return;
  }

  const page = getLocalizedPage();
  if (!page) {
    return;
  }

  document.title = `${page.menuLabel} | ${getStaticText("brandName", "Svelte Design Studio")}`;
  if (metaDescription) {
    metaDescription.setAttribute("content", page.summary);
  }
};

const syncLightboxStrings = () => {
  if (!galleryLightbox) {
    return;
  }

  galleryLightbox.dialog.setAttribute(
    "aria-label",
    getStaticText("gallery.dialogLabel", "Gallery preview")
  );
  galleryLightbox.closeButton.setAttribute(
    "aria-label",
    getStaticText("gallery.closeLabel", "Close preview")
  );
};

const ensureGalleryLightbox = () => {
  if (galleryLightbox) {
    syncLightboxStrings();
    return galleryLightbox;
  }

  let restoreFocusTo = null;

  const overlay = document.createElement("div");
  overlay.className = "gallery-lightbox";
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");

  const dialog = document.createElement("div");
  dialog.className = "gallery-lightbox__dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "gallery-lightbox__close";
  closeButton.textContent = "x";

  const contentRoot = document.createElement("div");
  contentRoot.className = "gallery-lightbox__content";

  dialog.append(closeButton, contentRoot);
  overlay.append(dialog);
  body.append(overlay);

  const closeLightbox = () => {
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    body.classList.remove("lightbox-open");
    contentRoot.replaceChildren();

    if (restoreFocusTo && typeof restoreFocusTo.focus === "function") {
      restoreFocusTo.focus();
    }

    restoreFocusTo = null;
  };

  const openLightbox = (src, altText, extension, triggerElement) => {
    contentRoot.replaceChildren();

    let media;
    if (extension === "mp4") {
      media = document.createElement("video");
      media.className = "gallery-lightbox__video";
      media.src = encodeURI(src);
      media.controls = true;
      media.playsInline = true;
      media.preload = "metadata";
    } else {
      media = document.createElement("img");
      media.className = "gallery-lightbox__image";
      media.src = encodeURI(src);
      media.alt = altText;
      media.decoding = "async";
    }

    contentRoot.append(media);
    restoreFocusTo = triggerElement;
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    body.classList.add("lightbox-open");
    closeButton.focus();
  };

  closeButton.addEventListener("click", closeLightbox);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) {
      closeLightbox();
    }
  });

  galleryLightbox = {
    overlay,
    dialog,
    closeButton,
    openLightbox,
    closeLightbox
  };

  syncLightboxStrings();
  return galleryLightbox;
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
  return cleanValue.includes(".") ? cleanValue.split(".").pop().toLowerCase() : "";
};

const supportsLightbox = (src) => lightboxExtensions.has(getExtension(src));

const attachLightboxTrigger = (element, src, altText) => {
  if (!supportsLightbox(src)) {
    return;
  }

  const { openLightbox } = ensureGalleryLightbox();
  const extension = getExtension(src);

  element.classList.add("media-frame--interactive");
  element.setAttribute("role", "button");
  element.setAttribute("tabindex", "0");
  element.setAttribute(
    "aria-label",
    formatText(getStaticText("gallery.openAria", "Open {title} in full screen"), {
      title: altText
    })
  );

  element.addEventListener("click", () => {
    openLightbox(src, altText, extension, element);
  });

  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(src, altText, extension, element);
    }
  });
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
  const altText = `${sectionTitle} - ${fileTitle}`;
  const media = createMediaElement(src, altText);
  frame.append(media);
  attachLightboxTrigger(frame, src, altText);

  article.append(frame);
  return article;
};

const renderHeroArtwork = (page) => {
  const heroArtShowcase = document.querySelector("#hero-art-showcase");
  if (!heroArtShowcase) {
    return;
  }

  clearIfPresent(heroArtShowcase);

  if (!page.heroArtwork || !page.heroArtwork.length) {
    hideIfEmpty(heroArtShowcase, true);
    return;
  }

  hideIfEmpty(heroArtShowcase, false);

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

const ensureLanguageSelector = () => {
  if (!header) {
    return null;
  }

  let selector = header.querySelector(".language-selector");
  if (selector) {
    return selector;
  }

  const nav = header.querySelector(".site-nav");
  if (!nav) {
    return null;
  }

  selector = document.createElement("div");
  selector.className = "language-selector";

  [
    { code: "en", label: "ENG" },
    { code: "he", label: "HEB" },
    { code: "ru", label: "RUS" }
  ].forEach((item) => {
    const link = document.createElement("a");
    link.href = "#";
    link.className = "lang-link";
    link.dataset.lang = item.code;
    link.textContent = item.label;
    selector.append(link);
  });

  header.append(selector);
  return selector;
};

const updateLanguageSelector = () => {
  const selector = ensureLanguageSelector();
  if (!selector) {
    return;
  }

  selector.querySelectorAll(".lang-link").forEach((link) => {
    const lang = link.dataset.lang;
    const enabled = supportedLanguages.has(lang);
    const isActive = lang === currentLanguage;

    link.classList.toggle("active", isActive);
    link.setAttribute("aria-pressed", String(isActive));
    link.setAttribute("aria-disabled", String(!enabled));
    link.title = enabled ? "" : getStaticText("language.unavailable", "Coming soon");
    link.href = getPageHref(window.location.pathname, enabled ? lang : currentLanguage);
  });
};

const syncInternalLanguageLinks = (root = document) => {
  root.querySelectorAll("a[href]").forEach((link) => {
    if (link.classList.contains("lang-link")) {
      return;
    }

    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#")) {
      return;
    }

    if (/^(https?:|mailto:|tel:|javascript:|\/\/)/i.test(href)) {
      return;
    }

    if (!/\.html(?:$|[?#])/i.test(href)) {
      return;
    }

    link.href = getPageHref(href);
  });
};

const buildSiteNav = () => {
  navLinks.forEach((link) => {
    const targetKey = link.dataset.navPage;
    link.classList.toggle("is-current", targetKey === pageKey);
    link.textContent = getPageNavLabel(targetKey);
    link.href = getPageHref(link.getAttribute("href") || `${targetKey}.html`);
  });
};

const setupLanguageSelector = () => {
  if (!header || header.dataset.languageSetup === "true") {
    return;
  }

  header.dataset.languageSetup = "true";
  header.addEventListener("click", (event) => {
    const link = event.target.closest(".lang-link");
    if (!link) {
      return;
    }

    const nextLanguage = link.dataset.lang;
    if (!supportedLanguages.has(nextLanguage)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    if (nextLanguage === currentLanguage) {
      return;
    }

    currentLanguage = normalizeLanguage(nextLanguage);
    storeLanguage(currentLanguage);
    syncPageLanguageInUrl();
    applyLanguage();
  });
};

const setupMobileMenu = () => {
  if (!menuToggle || !header || menuToggle.dataset.menuSetup === "true") {
    return;
  }

  menuToggle.dataset.menuSetup = "true";
  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
};

const setupContactForm = () => {
  const form = document.querySelector("#contact-form");
  if (!form || form.dataset.contactSetup === "true") {
    return;
  }

  form.dataset.contactSetup = "true";
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const project = (formData.get("project") || "").toString().trim();

    if (!name && !email && !phone && !project) {
      alert(getStaticText("contact.form.missingAlert", "Please enter at least one piece of information before sending."));
      return;
    }

    const lines = [
      name ? `${getStaticText("contact.form.fields.name", "Name")}: ${name}` : null,
      email ? `${getStaticText("contact.form.fields.email", "Email")}: ${email}` : null,
      phone ? `${getStaticText("contact.form.fields.phone", "Phone")}: ${phone}` : null,
      project ? `${getStaticText("contact.form.fields.project", "Project / Request")}: ${project}` : null
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join("\n"));
    const whatsappUrl = `https://wa.me/972547343857?text=${text}`;

    window.open(whatsappUrl, "_blank");
  });
};

const applySharedTranslations = () => {
  syncDocumentLanguage();
  syncPageLanguageInUrl();

  const brand = document.querySelector(".brand");
  if (brand) {
    brand.setAttribute("aria-label", getStaticText("brandAriaLabel", "Svelte Design Studio home"));
  }

  const brandImage = document.querySelector(".brand img");
  if (brandImage) {
    brandImage.alt = getStaticText("logoAlt", brandImage.alt);
  }

  const brandText = document.querySelector(".brand span");
  if (brandText) {
    brandText.textContent = getStaticText("brandName", brandText.textContent);
  }

  if (menuToggle) {
    menuToggle.setAttribute("aria-label", getStaticText("menuToggleAria", "Open navigation"));
  }

  const footerText = document.querySelector("#site-footer-text") || document.querySelector(".site-footer p");
  if (footerText) {
    footerText.textContent = getStaticText("footer", footerText.textContent);
  }

  buildSiteNav();
  updateLanguageSelector();
  updateDocumentMetadata();
  syncLightboxStrings();
};

const applyHomeStaticTranslations = () => {
  if (pageKey !== "home") {
    return;
  }

  setText("#home-hero-eyebrow", getStaticText("home.heroEyebrow", ""));
  setText("#home-title", getStaticText("home.heroTitle", "Svelte Design Studio"));
  setText("#home-lead", getStaticText("home.lead", ""));
  setText("#home-section-eyebrow", getStaticText("home.sectionEyebrow", ""));
  setText("#home-section-title", getStaticText("home.sectionTitle", ""));
  setText("#home-section-text", getStaticText("home.sectionText", ""));

  const cta = document.querySelector("#home-cta");
  if (cta) {
    cta.textContent = getStaticText("home.ctaLabel", "Send a WhatsApp message");
    cta.href = getWhatsAppUrl(getStaticText("home.ctaMessage", "Hello, I am interested in more details about your services."));
  }
};

const applyDetailTemplateTranslations = () => {
  const panelCopy = getStaticValue(`pagePanels.${pageKey}`, null);
  if (!panelCopy) {
    return;
  }

  setText("#page-panels-kicker", panelCopy.eyebrow || "");
  setText("#page-panels-title", panelCopy.title || "");
};

const applyContactStaticTranslations = () => {
  if (pageKey !== "contact-me") {
    return;
  }

  const contactIntro = getStaticText("contact.intro", "");
  setText("#contact-intro", contactIntro);
  hideIfEmpty(document.querySelector("#contact-intro"), !contactIntro.trim());
  setAriaLabel("#contact-info-card", getStaticText("contact.infoCardAria", ""));
  setAriaLabel("#contact-request-card", getStaticText("contact.requestCardAria", ""));
  setText("#contact-info-title", getStaticText("contact.infoTitle", ""));
  setText("#contact-email-label", getStaticText("contact.emailLabel", ""));
  setText("#contact-phone-label", getStaticText("contact.phoneLabel", ""));
  setText("#contact-socials-label", getStaticText("contact.socialsLabel", ""));
  setText("#contact-instagram-prefix", getStaticText("contact.instagramPrefix", "Instagram:"));
  setText("#contact-facebook-prefix", getStaticText("contact.facebookPrefix", "Facebook:"));
  setText("#contact-request-title", getStaticText("contact.requestTitle", ""));
  setText("#contact-request-intro", getStaticText("contact.requestIntro", ""));
  setText('label[for="contact-name"]', getStaticText("contact.form.nameLabel", "Name"));
  setText('label[for="contact-email"]', getStaticText("contact.form.emailLabel", "Email"));
  setText('label[for="contact-phone"]', getStaticText("contact.form.phoneLabel", "Phone Number"));
  setText('label[for="contact-project"]', getStaticText("contact.form.projectLabel", "Project / Request"));
  setPlaceholder("#contact-name", getStaticText("contact.form.namePlaceholder", "Your name"));
  setPlaceholder("#contact-email", getStaticText("contact.form.emailPlaceholder", "Your email"));
  setPlaceholder("#contact-phone", getStaticText("contact.form.phonePlaceholder", "Your phone number"));
  setPlaceholder("#contact-project", getStaticText("contact.form.projectPlaceholder", "Briefly describe your request"));
  setText("#contact-submit", getStaticText("contact.form.submitLabel", "Send to WhatsApp"));
  setHref(
    "#contact-email-link",
    getMailtoUrl(
      getStaticText("contact.mailSubject", "Contact Request"),
      getStaticText("contact.mailBody", "Hello, I am interested in more details about your services.")
    )
  );
  setHref(
    "#contact-phone-link",
    getWhatsAppUrl(getStaticText("contact.whatsappMessage", "Hello, I am interested in more details about your services."))
  );

  const portrait = document.querySelector("#contact-portrait");
  if (portrait) {
    portrait.alt = getStaticText("contact.portraitAlt", portrait.alt);
  }
};

const renderHome = () => {
  const homeGrid = document.querySelector("#home-grid");
  if (!homeGrid) {
    return;
  }

  clearIfPresent(homeGrid);

  const cardEyebrows = getStaticValue("home.cardEyebrows", {});
  const cardMeta = getStaticValue("home.cardMeta", {
    sections: "Open the galleries",
    noSections: "Read more"
  });

  const fragment = document.createDocumentFragment();

  pageOrder.forEach((key) => {
    const page = getLocalizedPage(key);
    if (!page) {
      return;
    }

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
    meta.textContent = page.sections.length ? cardMeta.sections : cardMeta.noSections;

    card.append(eyebrow, title, text, meta);
    fragment.append(card);
  });

  homeGrid.append(fragment);
};

const renderDetailPage = () => {
  const page = getLocalizedPage();
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

  if (kicker) kicker.textContent = page.heroKicker;
  if (title) title.textContent = page.heroTitle;
  if (summary) summary.textContent = page.summary;

  renderHeroArtwork(page);

  clearIfPresent(panelsRoot);
  clearIfPresent(sectionNav);
  clearIfPresent(sectionsRoot);
  hideIfEmpty(panelsSection, false);
  hideIfEmpty(sectionNav, false);

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
  } else if (panelsSection) {
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
      sectionsRoot.append(
        createEmptyState(getStaticText("gallery.emptyPage", "This page is waiting for its next story."))
      );
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
      grid.append(
        createEmptyState(
          getStaticText("gallery.emptyCollection", "This collection is resting between new works.")
        )
      );
    }

    wrapper.append(heading, grid);
    sectionFragment.append(wrapper);
  }

  sectionsRoot.append(sectionFragment);
};

const applyLanguage = () => {
  applySharedTranslations();

  if (pageKey === "home") {
    applyHomeStaticTranslations();
    renderHome();
  } else {
    applyDetailTemplateTranslations();
    renderDetailPage();
    applyContactStaticTranslations();
  }

  syncInternalLanguageLinks();
};

currentLanguage = getStoredLanguage();
ensureLanguageSelector();
setupLanguageSelector();
setupMobileMenu();
setupContactForm();
applyLanguage();
