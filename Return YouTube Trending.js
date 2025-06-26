// ==UserScript==
// @name         Return YouTube Trending
// @version      1.0
// @description  Replace Shorts with Trending
// @match        *://*.youtube.com/*
// @grant        none
// ==/UserScript==
// Source by Perplexity

(function() {
    'use strict';

    // SVG path data for icons
    const trendingPath = "M14 2 7.305 5.956C4.637 7.533 3 10.401 3 13.5c0 4.694 3.806 8.5 8.5 8.5s8.5-3.806 8.5-8.5V1l-6 4V2ZM9 15c0-1.226.693-2.346 1.789-2.894L15 10v5c0 1.657-1.343 3-3 3s-3-1.343-3-3Z";
    const otherPath = "m14 2-1.5.886-5.195 3.07C4.637 7.533 3 10.401 3 13.5c0 4.694 3.806 8.5 8.5 8.5s8.5-3.806 8.5-8.5V1l-1.5 1-3 2L14 5V2ZM8.068 7.248l4.432-2.62v3.175l2.332-1.555L18.5 3.803V13.5c0 3.866-3.134 7-7 7s-7-3.134-7-7c0-2.568 1.357-4.946 3.568-6.252ZM9 15c0-1.226.693-2.346 1.789-2.894L15 10v5c0 1.657-1.343 3-3 3s-3-1.343-3-3Z";

    // Helper to create SVG icon as a DOM element
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

    // Get correct label based on user language
    function getTrendingLabel() {
        const lang = (window.yt?.config_?.HL || window.ytInitialData?.responseContext?.mainAppWebResponseContext?.hl || document.documentElement.lang || 'en').toLowerCase();
        return lang.startsWith('ko') ? '인기 급상승' : 'Trending';
    }

    // Debounce helper for MutationObserver
    function debounce(func, wait) {
        let timeout;
        return function() {
            const ctx = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(ctx, args), wait);
        };
    }

    // Mobile logic (for m.youtube.com)
    if (location.hostname === 'm.youtube.com') {
        // Replace Shorts icon and label with Trending
        function patchShortsTab() {
            const trending = getTrendingLabel();
            // Replace SVG path for icon
            document.querySelectorAll('ytm-pivot-bar-item-renderer .pivot-shorts svg path').forEach(
                p => p.setAttribute('d', location.pathname === '/feed/trending' ? trendingPath : otherPath)
            );
            // Replace label
            document.querySelectorAll('.pivot-bar-item-title.pivot-shorts span').forEach(
                s => { if (s.textContent.trim() === 'Shorts') s.textContent = trending; }
            );
        }

        // Redirect Shorts tab to Trending
        document.addEventListener('click', e => {
            const t = e.target.closest('.pivot-bar-item-tab.pivot-shorts');
            if (t) { e.preventDefault(); location.href = '/feed/trending'; }
        }, true);

        // Debounced function to patch
        const tryPatch = debounce(() => {
            if (document.querySelector('.pivot-shorts')) {
                patchShortsTab();
            }
        }, 100);

        // Watch for DOM changes and patch when needed
        new MutationObserver(tryPatch).observe(document.documentElement, {childList: true, subtree: true});
        document.addEventListener('DOMContentLoaded', tryPatch);
        window.addEventListener('yt-page-data-updated', tryPatch);
    }

    // Desktop logic (for www.youtube.com)
    if (location.hostname === 'www.youtube.com') {
        // Replace Shorts icon and label in mini-guide
        function swapShortsGuide() {
            const b = document.querySelector('ytd-mini-guide-entry-renderer[aria-label="Shorts"]');
            if (!b) return;
            const a = b.querySelector('a#endpoint');
            if (!a) return;
            // Remove old icons
            b.querySelectorAll('yt-icon#icon, .yt-icon-shape, svg, .yt-trending-icon').forEach(e => e.remove());
            // Add new SVG icon
            const s = document.createElement('span');
            s.className = 'yt-trending-icon';
            const svgElem = createTrendingSVG(location.pathname.startsWith('/feed/trending') ? trendingPath : otherPath);
            s.appendChild(svgElem);
            a.insertBefore(s, a.firstChild);
            // Update label
            const t = b.querySelector('.title');
            if (t) t.textContent = getTrendingLabel();
        }

        // Redirect Shorts button to Trending
        function redirectShortsGuide() {
            const e = document.querySelector('ytd-mini-guide-entry-renderer[aria-label="Shorts"] a#endpoint');
            if (e && !e.dataset.r) {
                e.onclick = t => { t.preventDefault(); t.stopPropagation(); location.href = '/feed/trending'; };
                e.dataset.r = 1;
            }
        }

        // Update Shorts tooltip to Trending
        function updateShortsTooltip() {
            const label = getTrendingLabel();
            const a = document.querySelector('ytd-mini-guide-entry-renderer a#endpoint[title="Shorts"]');
            if (a) {
                a.title = label;
                const tip = a.querySelector('tp-yt-paper-tooltip #tooltip');
                if (tip) tip.textContent = label;
            }
        }

        // Swap menu entries (Shorts ↔ Trending) once
        function swapMenuEntries() {
            if (document.querySelector('ytd-guide-entry-renderer[data-swapped="1"]')) return;
            let shorts, trending;
            document.querySelectorAll('ytd-guide-entry-renderer').forEach(e => {
                const txt = e.querySelector('.title')?.textContent.trim();
                if (txt === "Shorts") shorts = e;
                if (txt === "Trending" || txt === "인기 급상승") trending = e;
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

        // Apply all desktop patches at once
        function applyDesktopPatches() {
            swapShortsGuide();
            redirectShortsGuide();
            updateShortsTooltip();
            swapMenuEntries();
        }

        // Watch for DOM changes and patch when needed
        function observeDesktop() {
            [document.querySelector('ytd-mini-guide-renderer'), document.querySelector('ytd-guide-renderer'), document.body]
                .filter(Boolean)
                .forEach(target => new MutationObserver(debounce(applyDesktopPatches, 100)).observe(target, {childList: true, subtree: true}));
        }

        // Patch on navigation and page load
        ['yt-navigate-finish', 'popstate'].forEach(e => window.addEventListener(e, () => { applyDesktopPatches(); observeDesktop(); }));
        document.addEventListener('DOMContentLoaded', () => { applyDesktopPatches(); observeDesktop(); });
    }
})();
