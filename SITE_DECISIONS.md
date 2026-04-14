# Site Decisions for Svelte Design Studio

This document describes the architecture and implementation decisions made while building the site.

## 1. Project Structure

- `index.html`, `contact-me.html`, `graphic-design-and-digital-marketing.html`, `master-classes.html`, `original-art.html`, `my-journey.html`
  - Static HTML entry points for each main page.
  - Each page shares the same site shell layout and navigation structure.
- `styles.css`
  - Shared styling for layout, navigation, grids, cards, and responsive behavior.
- `script.js`
  - Main runtime logic for dynamic page rendering, mobile menu, and gallery layout.
- `site-data.js`
  - Centralized page and media metadata.
  - Defines page order, navigation labels, hero text, sections, artwork files, and content structure.
- `assets/`
  - All media files used by the site.
  - `assets/library/`, `assets/art/`, `assets/classes/`, and `assets/design/` contain the original artwork and design assets.
- `assets/mobile/`
  - Generated low-resolution mobile image copies for faster loading on phones.
- `scripts/generate-mobile-images.py`
  - Utility script to generate mobile-friendly image assets from the originals.

## 2. Data-Driven Rendering

- The site uses a data-driven content model in `site-data.js`.
- Each page loads only the relevant sections and images from this single data source.
- This makes it easy to add or update content without editing page markup directly.
- `body[data-page]` identifies the current page and enables the script to render the correct content.

## 3. Dynamic Gallery Rendering

- `script.js` contains logic to render:
  - hero artwork previews (`renderHeroArtwork()`)
  - page panels and section navigation
  - galleries for each `section.files` set
- `createMediaCard()` builds cards dynamically from `site-data.js` entries.
- Files are grouped into `landscape` and `standard` layouts for more polished gallery display.

## 4. Mobile Optimization

- Mobile image delivery is handled by detecting the viewport width using `window.matchMedia("(max-width: 768px)")`.
- On mobile, `createMediaElement()` attempts to use `assets/mobile/...` variants.
- This reduces page weight for phone users while keeping full-resolution sources for desktops.
- If a mobile image fails to load, the code falls back to the original full-size source.
- Header logos also use `srcset` and `sizes` so phones can load `assets/mobile/logo.png`.

## 5. Image Asset Strategy

- Original assets remain in `assets/` so quality is preserved.
- Generated mobile versions live in `assets/mobile/` with the same directory structure.
- The image generation script:
  - scans `assets/` for PNG, JPG, JPEG, and WEBP files
  - creates downscaled copies with a max dimension of 768px
  - applies compression to reduce file size
- This improves performance on phones without changing desktop experience.

## 6. Responsive Navigation

- The mobile menu is toggled via the `.menu-toggle` button in `script.js`.
- Header state is controlled by the `is-open` class and `aria-expanded` for accessibility.
- Navigation links are marked with `data-nav-page` and the current page is highlighted.

## 7. Build and Runtime Environment

- The project is primarily a static site with plain HTML, CSS, and JavaScript.
- A `svelte.config.js` file is present and configured for `@sveltejs/adapter-static` with a base path of `/svelte-site`.
- This suggests the project can also be hosted as a static SvelteKit site if needed.
- `package.json` currently contains only the Svelte static adapter dependency.

## 8. Key Implementation Choices

- Single source of truth for page metadata in `site-data.js`.
- Lazy-loading images using `loading="lazy"` for all gallery and hero images.
- Use of dynamic DOM creation to keep HTML markup minimal and content-driven.
- Mobile-specific asset delivery for speed without altering desktop visuals.
- Graceful fallback behavior for mobile image loading.

## 9. Future Improvements

- Add automated build scripts to refresh `assets/mobile/` when new images are added.
- Optionally generate additional responsive image sizes and `srcset` values for each gallery image.
- Add progressive image placeholders or blur-up previews for an even smoother mobile experience.
- Consolidate site shell and page templates if moving to a full SvelteKit implementation.

## 11. Recent Updates (April 2026)

- **Homepage Portrait Addition**: Added a portrait photo (`Sveta_Portrait_20191124.jpg`) to the homepage hero section in a delicate light blue frame. The photo is positioned absolutely on the right side, centered vertically within the hero section, and sized at 190px × 220px with padding and rounded corners for a polished look. The frame uses a light blue background (`rgba(230, 239, 247, 0.88)`) and subtle border to complement the site's color palette. This enhances the personal touch on the landing page without disrupting the layout.

- **Contact Page Enhancements**: 
  - Added the same portrait photo to the "My Info" card on the Contact Me page, positioned above the contact details in a smaller frame (140px × 180px) with matching styling.
  - Transformed the client details section into a functional contact form with fields for Name, Email, Phone Number, and Project/Request.
  - Implemented WhatsApp integration: the form submits by opening `https://wa.me/972547343857` with a pre-filled message containing the user's input. This allows direct communication via WhatsApp for inquiries.
  - Updated contact details to include real information (email: msveta13@gmail.com, phone: +972 547 343 857, social links).

- **Styling and Positioning Adjustments**: 
  - Ensured the homepage photo aligns with the text indentation by adjusting the right positioning.
  - Added responsive behavior to hide the photo on smaller screens (mobile) to maintain clean layout.
  - Used CSS classes like `.hero-photo` and `.contact-card-portrait` for consistent framing across pages.

These changes improve user engagement by adding a personal element and streamlining contact methods, while maintaining the site's clean, data-driven architecture.


## 12. Recent Updates (April 2026, Multilingual and UX)

- **Bilingual Site Structure**:
  - Added `translations.js` as the shared translation source for static UI copy and page-level localized content.
  - English remains the default language and Russian is available in parallel across the full site.
  - The Russian copy is stored as plain readable UTF-8 text so it can be reviewed and edited comfortably in tools such as Notepad++.

- **Language Switching Behavior**:
  - `script.js` now supports `ENG` and `RUS` as active languages in the shared header language selector on every page.
  - The current language is preserved both in `localStorage` and in page URLs using `?lang=ru`.
  - Internal page links are rewritten dynamically so navigation, brand links, and generated homepage cards keep the selected language while moving through the site.
  - `HEB` remains a visible placeholder only and is still marked as unavailable.

- **Russian Copy Strategy**:
  - Russian content was rewritten as native-style editorial copy rather than literal translation.
  - Awkward direct phrasing was replaced with more natural Russian across navigation, homepage copy, page intros, gallery notes, Contact Me, and My Journey.
  - The Russian Contact Me intro can intentionally be empty, and the matching paragraph is hidden automatically instead of leaving blank space.

- **Shared Header and Navigation Refinements**:
  - Added language buttons to all page headers as part of the shared site shell.
  - Header spacing and sizing were adjusted to support larger navigation text without collisions.
  - Russian-specific header sizing rules were added in `styles.css` so longer menu labels and language buttons fit cleanly beside the brand name.
  - The brand label and navigation typography were tuned so the header remains balanced at larger browser text sizes.

- **Gallery Viewer Improvements**:
  - Added a full-screen lightbox for gallery media.
  - The lightbox applies only to `jpg`, `jpeg`, `png`, and `mp4` files.
  - Gallery thumbnails remain visible in the normal grid; clicking supported items opens a full-screen preview fitted to the current screen size.
  - The preview closes using the on-screen `x` button, clicking outside the media, or pressing `Esc`.

- **Gallery Layout Decisions**:
  - Gallery rendering continues to group files into `landscape` and `standard` sets.
  - Landscape items are displayed in 3 columns, while non-landscape items are displayed in 5 columns on desktop-oriented layouts.
  - This layout logic is driven by the metadata layer and rendered dynamically in `script.js`.
