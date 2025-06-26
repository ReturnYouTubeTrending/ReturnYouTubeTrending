// ==UserScript==
// @name         Return YouTube Trending
// @version      1.1
// @description  Replace Shorts with Trending
// @match        *://*.youtube.com/*
// @grant        none
// ==/UserScript==
// Source by Perplexity
// Updated by ChatGPT

(function() {
  'use strict';

  // SVG paths for the trending icons (active/inactive)
  const trendingPath = "M14 2 7.305 5.956C4.637 7.533 3 10.401 3 13.5c0 4.694 3.806 8.5 8.5 8.5s8.5-3.806 8.5-8.5V1l-6 4V2ZM9 15c0-1.226.693-2.346 1.789-2.894L15 10v5c0 1.657-1.343 3-3 3s-3-1.343-3-3Z";
  const otherPath = "m14 2-1.5.886-5.195 3.07C4.637 7.533 3 10.401 3 13.5c0 4.694 3.806 8.5 8.5 8.5s8.5-3.806 8.5-8.5V1l-1.5 1-3 2L14 5V2ZM8.068 7.248l4.432-2.62v3.175l2.332-1.555L18.5 3.803V13.5c0 3.866-3.134 7-7 7s-7-3.134-7-7c0-2.568 1.357-4.946 3.568-6.252ZM9 15c0-1.226.693-2.346 1.789-2.894L15 10v5c0 1.657-1.343 3-3 3s-3-1.343-3-3Z";

  // Mapping of languages to "Trending" label translations
  const trendingLabels = {
    af: "Neigings", am: "በመታየት ላይ ያሉ", ar: "المحتوى الرائج", az: "Trendlərin təhlili", be: "Трэндавыя",
    bg: "Популярни", bn: "প্রবণতা", bs: "Popularno", ca: "Vídeos del moment", cs: "Populární",
    da: "Hot lige nu", de: "Angesagt", el: "Τάση", en: "Trending", es: "Tendencias", et: "Popp",
    eu: "Pil-pilean", fa: "پرطرفدار", fi: "Trendaava", fr: "Tendances", gl: "Tendencias", gu: "વલણમાં",
    hi: "रुझान में है", hr: "Aktualno", hu: "Felkapott", hy: "Թրենդային", is: "Vinsælt núna", it: "Tendenze",
    iw: "פופולרי", ja: "急上昇", ka: "პოპულარულები", kk: "Тренд", km: "កំពុង​ពេញ​និយម", kn: "ಟ್ರೆಂಡಿಂಗ್",
    ko: "인기 급상승", ky: "Жаңы видеолор", lo: "ກຳລັງນິຍົມ", lt: "Populiaru", lv: "Aktuāli", mk: "Во тренд",
    ml: "ട്രെൻഡിംഗ്", mn: "Тренд", mr: "ट्रेन्डिंग", ms: "Sohor Kini", my: "ခေတ်ရှေ့ပြေး", nb: "På vei opp",
    ne: "लोकप्रियता बढ्दै", nl: "Trending", pa: "ਰੁਝਾਨ ਵਾਲੇ", pl: "Trendy", pt: "Tendências", "pt-br": "Em alta",
    ro: "Tendințe", ru: "Популярное", si: "නැඟී එන", sk: "Trendy", sl: "Priljubljeno", sq: "Tendenca",
    sr: "У тренду", "sr-latn": "U trendu", sv: "Trender", sw: "Zinazovuma", ta: "ட்ரெண்டிங்", te: "ట్రెండింగ్",
    th: "มาแรง", tl: "Trending", tr: "Trendler", uk: "Популярне", ur: "رجحان ساز", uz: "Ommabop",
    vi: "Thịnh hành", zh: "时下流行", "zh-cn": "时下流行", "zh-hk": "熱門影片", "zh-tw": "發燒影片", zu: "Okuthrendayo"
  };

  // Get localized "Trending" label from user’s interface language
  function getTrendingLabel() {
    let lang =
      (window.yt?.config_?.HL) ||
      (window.ytInitialData?.responseContext?.mainAppWebResponseContext?.hl) ||
      document.documentElement.lang ||
      navigator.language || 'en';
    lang = lang.toLowerCase();
    const base = lang.split('-')[0];
    return trendingLabels[lang] || trendingLabels[base] || "Trending";
  }

  // Check if a given string is a known localized "Trending" label
  function isTrendingLabel(txt) {
    return Object.values(trendingLabels).includes(txt);
  }

  // Create a <div> containing an SVG icon (used for the Trending icon)
  function createTrendingSVG(path) {
    const svgNS = "http://www.w3.org/2000/svg";
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.display = 'block';
    div.style.fill = 'currentcolor';

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '24');

    const pathElem = document.createElementNS(svgNS, 'path');
    pathElem.setAttribute('clip-rule', 'evenodd');
    pathElem.setAttribute('d', path);
    pathElem.setAttribute('fill-rule', 'evenodd');

    svg.appendChild(pathElem);
    div.appendChild(svg);
    return div;
  }

  // Debounce utility for MutationObserver
  function debounce(func, wait) {
    let timeout;
    return function() {
      const ctx = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(ctx, args), wait);
    };
  }

  // === Mobile YouTube: m.youtube.com ===
  if (location.hostname === 'm.youtube.com') {
    // Replace Shorts icon and label with Trending
    function patchShortsTab() {
      const trending = getTrendingLabel();
      document.querySelectorAll('ytm-pivot-bar-item-renderer .pivot-shorts svg path').forEach(
        p => p.setAttribute('d', location.pathname === '/feed/trending' ? trendingPath : otherPath)
      );
      document.querySelectorAll('.pivot-bar-item-title.pivot-shorts span').forEach(
        s => { if (s.textContent.trim() === 'Shorts') s.textContent = trending; }
      );
    }

    // Intercept Shorts tab click to redirect to /feed/trending
    document.addEventListener('click', e => {
      const t = e.target.closest('.pivot-bar-item-tab.pivot-shorts');
      if (t) { e.preventDefault(); location.href = '/feed/trending'; }
    }, true);

    // Watch DOM for changes and patch as needed
    const tryPatch = debounce(() => {
      if (document.querySelector('.pivot-shorts')) patchShortsTab();
    }, 100);

    new MutationObserver(tryPatch).observe(document.documentElement, {childList: true, subtree: true});
    document.addEventListener('DOMContentLoaded', tryPatch);
    window.addEventListener('yt-page-data-updated', tryPatch);
  }

  // === Desktop YouTube: www.youtube.com ===
  if (location.hostname === 'www.youtube.com') {
    // Replace Shorts in the mini guide sidebar with Trending
    function swapShortsGuide() {
      const b = document.querySelector('ytd-mini-guide-entry-renderer[aria-label="Shorts"]');
      if (!b) return;
      const a = b.querySelector('a#endpoint');
      if (!a) return;

      // Remove Shorts icon
      b.querySelectorAll('yt-icon#icon, .yt-icon-shape, svg, .yt-trending-icon').forEach(e => e.remove());

      // Insert new Trending icon
      const s = document.createElement('span');
      s.className = 'yt-trending-icon';
      s.appendChild(createTrendingSVG(location.pathname.startsWith('/feed/trending') ? trendingPath : otherPath));
      a.insertBefore(s, a.firstChild);

      // Replace label
      const t = b.querySelector('.title');
      if (t) t.textContent = getTrendingLabel();
    }

    // Make Shorts link redirect to Trending
    function redirectShortsGuide() {
      const e = document.querySelector('ytd-mini-guide-entry-renderer[aria-label="Shorts"] a#endpoint');
      if (e && !e.dataset.r) {
        e.onclick = t => { t.preventDefault(); t.stopPropagation(); location.href = '/feed/trending'; };
        e.dataset.r = 1;
      }
    }

    // Update tooltip text for Shorts (now Trending)
    function updateShortsTooltip() {
      const label = getTrendingLabel();
      const a = document.querySelector('ytd-mini-guide-entry-renderer a#endpoint[title="Shorts"]');
      if (a) {
        a.title = label;
        const tip = a.querySelector('tp-yt-paper-tooltip #tooltip');
        if (tip) tip.textContent = label;
      }
    }

    // Swap menu entries: Shorts <--> Trending
    function swapMenuEntries() {
      if (document.querySelector('ytd-guide-entry-renderer[data-swapped="1"]')) return;
      let shorts, trending;
      document.querySelectorAll('ytd-guide-entry-renderer').forEach(e => {
        const txt = e.querySelector('.title')?.textContent.trim();
        if (txt === "Shorts") shorts = e;
        if (isTrendingLabel(txt)) trending = e;
      });
      if (!shorts || !trending) return;

      const sParent = shorts.parentNode, tParent = trending.parentNode;
      const sNext = shorts.nextSibling, tNext = trending.nextSibling;
      sParent.removeChild(shorts);
      tParent.removeChild(trending);
      sParent.insertBefore(trending, sNext);
      tParent.insertBefore(shorts, tNext);

      trending.dataset.swapped = '1';
      shorts.dataset.swapped = '1';
    }

    // Run all patches for desktop view
    function applyDesktopPatches() {
      swapShortsGuide();
      redirectShortsGuide();
      updateShortsTooltip();
      swapMenuEntries();
    }

    // Watch for YouTube navigation or UI reloads
    function observeDesktop() {
      [document.querySelector('ytd-mini-guide-renderer'), document.querySelector('ytd-guide-renderer'), document.body]
        .filter(Boolean)
        .forEach(target => new MutationObserver(debounce(applyDesktopPatches, 100)).observe(target, {childList: true, subtree: true}));
    }

    // Initial run + event listeners
    ['yt-navigate-finish', 'popstate'].forEach(e => window.addEventListener(e, () => {
      applyDesktopPatches();
      observeDesktop();
    }));
    document.addEventListener('DOMContentLoaded', () => {
      applyDesktopPatches();
      observeDesktop();
    });
  }
})();
