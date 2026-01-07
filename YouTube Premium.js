// ==UserScript==
// @name         YouTube Premium
// @version      1.13
// @description  Enable YouTube Premium Logo
// @match        *://www.youtube.com/*
// @grant        none
// ==/UserScript==

(() => {
  const S = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 101 20" style="pointer-events:none;display:inherit;width:100%;height:100%"><g><path d="M14.48 20C14.48 20 23.57 20 25.82 19.4C27.09 19.06 28.05 18.08 28.38 16.87C29 14.65 29 9.98 29 9.98s0-4.64-.62-6.84C28.05 1.9 27.09.94 25.82.61 23.57 0 14.48 0 14.48 0S5.42 0 3.18.61C1.93.94.95 1.9.6 3.14 0 5.34 0 9.98 0 9.98s0 4.67.6 6.89c.35 1.21 1.33 2.19 2.58 2.53C5.42 20 14.48 20 14.48 20z" fill="#f03"/><path d="M19 10l-7.5-4.25v8.5z" fill="#fff"/></g><g><path d="M32.18 2.1v16.8h2.58v-5.99h.69c3.35 0 5.11-1.8 5.11-5.34v-.69c0-3.57-1.56-4.78-4.84-4.78h-3.54zm5.68 5.53c0 2.37-.72 3.45-2.46 3.45h-.64V3.95h.69c1.97 0 2.41.81 2.41 3.18v.5zM41.98 18.9h2.55v-8.81c.42-.72 1.46-1.04 2.77-.77l.16-2.99c-.17-.02-.32-.04-.46-.04-1.2 0-2.17.91-2.66 2.57h-.18v-2.32h-1.97v12.36h-.21zM55.75 11.5c0-2.98-.3-5.19-3.73-5.19-3.23 0-3.95 2.15-3.95 5.31v2.17c0 3.08.66 5.32 3.87 5.32 2.54 0 3.85-1.27 3.7-3.73l-2.25-.12c-.03 1.52-.38 2.14-1.39 2.14-1.27 0-1.33-1.21-1.33-3.01v-.84h5.08v-2.05zm-3.79-3.53c1.22 0 1.31 1.15 1.31 3.1v1.01h-2.6v-1.01c0-1.93.08-3.1 1.29-3.1zM60.19 18.9V8.92c.38-.53 1-.85 1.6-.85.77 0 1.05.54 1.05 1.62v9.21h2.66l-.02-9.97c.37-.56 1-.89 1.62-.89.67 0 1.04.57 1.04 1.65v9.21h2.66V9.49c0-2.21-.79-3.22-2.46-3.22-1.16 0-2.15.42-3.06 1.4-.38-.91-1.13-1.4-2.2-1.4-1.21 0-2.35.52-3.15 1.49h-.15V6.54h-2.05v12.36h2.46zM74.09 4.97c.9 0 1.32-.3 1.32-1.54 0-1.16-.45-1.52-1.32-1.52-.88 0-1.31.32-1.31 1.52 0 1.24.41 1.54 1.31 1.54zM72.87 18.9h2.53V6.54h-2.53v12.36zM79.95 19.09c1.46 0 2.37-.61 3.12-1.71h.11l.11 1.52h1.99V6.54h-2.64v9.93c-.28.49-.93.85-1.54.85-.77 0-1.01-.61-1.01-1.63V6.54h-2.63v9.27c0 2.01.58 3.28 2.49 3.28zM90 18.9V8.92c.38-.53 1-.85 1.6-.85.77 0 1.05.54 1.05 1.62v9.21h2.66l-.02-9.97c.37-.56 1-.89 1.62-.89.67 0 1.04.57 1.04 1.65v9.21h2.66V9.49c0-2.21-.79-3.22-2.46-3.22-1.16 0-2.15.42-3.06 1.4-.38-.91-1.13-1.4-2.2-1.4-1.21 0-2.35.52-3.15 1.49h-.15V6.54h-2.05v12.36H90z"/></g></svg>`;

  document.head.appendChild(document.createElement('style')).textContent =
    `yt-icon.ytd-logo,c3-icon.yt-spec-more-drawer-view-model__more-drawer-header-logo{width:101px!important;height:20px!important}`;

  const premLogo = new DOMParser().parseFromString(S, "image/svg+xml").documentElement;
  premLogo.setAttribute('data-prem', '1');
  const regex = /\bYouTube\b(?! Premium)/;

  const run = () => {
    const targets = document.querySelectorAll('ytd-topbar-logo-renderer, c3-icon.yt-spec-more-drawer-view-model__more-drawer-header-logo');

    targets.forEach(el => {
      // 1. Hide doodle, country code
      if (el.tagName.startsWith('YTD')) {
        const y = el.querySelector('ytd-yoodle-renderer');
        if (y) y.hidden = true;
        el.querySelectorAll('div[hidden], #country-code').forEach(e => e.hidden = false);
      }

      // 2. Swap icon
      const icon = el.matches('c3-icon') ? el : el.querySelector('yt-icon#logo-icon');
      if (icon && !icon.querySelector('[data-prem]')) icon.replaceChildren(premLogo.cloneNode(true));

      // 3. Update tooltip
      const a = el.closest('a') || el.querySelector('a#logo');
      if (a) {
        const t = (a.title || a.getAttribute('aria-label') || '').replace(regex, 'YouTube Premium');
        if (t && t !== a.title) { a.title = t; a.setAttribute('aria-label', t); }
      }
    });
  };

  let frame;
  const obs = new MutationObserver(() => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(run);
  });

  obs.observe(document.body, { subtree: true, childList: true });
  window.addEventListener('yt-navigate-finish', run);
  run();
})();
