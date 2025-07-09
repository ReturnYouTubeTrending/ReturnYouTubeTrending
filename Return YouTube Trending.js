// ==UserScript==
// @name         Return YouTube Trending
// @version      1.6
// @description  Replace Shorts with Trending
// @match        *://*.youtube.com/*
// @grant        none
// ==/UserScript==
// Source by ChatGPT, Perplexity

(function() {
  'use strict';

  // --- MAIN SCRIPT: Applies only to www.youtube.com ---
  if (location.hostname === 'www.youtube.com') {

    // Utility: Wait for a DOM element matching selector to appear
    function waitFor(selector, root = document) {
      return new Promise(resolve => {
        const el = root.querySelector(selector);
        if (el) return resolve(el);
        const mo = new MutationObserver(() => {
          const found = root.querySelector(selector);
          if (found) {
            mo.disconnect();
            resolve(found);
          }
        });
        mo.observe(root, { childList: true, subtree: true });
      });
    }

    // Utility: Wait for ytd-app to have either mini-guide or persistent-guide attribute
    async function waitForYtdAppAttr() {
      const app = await waitFor('ytd-app');
      return new Promise(resolve => {
        function check() {
          if (app.hasAttribute('guide-persistent-and-visible')) {
            resolve({mode: 'persistent', app});
            return true;
          }
          if (app.hasAttribute('mini-guide-visible')) {
            resolve({mode: 'mini', app});
            return true;
          }
          return false;
        }
        if (check()) return;
        const mo = new MutationObserver(() => { check(); });
        mo.observe(app, { attributes: true });
      });
    }

    // --- LOGIC FOR MINI-GUIDE MODE ---
    async function scriptMiniGuide(app) {
      // --- Sidebar: Open, swap Shorts/Trending, and handle transitions ---

      // Wait for mini-guide to be visible before proceeding
      const shouldRun = async () => {
        await waitFor('ytd-app');
        const app = document.querySelector('ytd-app');
        if (app?.hasAttribute('mini-guide-visible')) return true;
        return new Promise(resolve => {
          const observer = new MutationObserver(() => {
            const app2 = document.querySelector('ytd-app');
            if (app2?.hasAttribute('mini-guide-visible')) {
              observer.disconnect();
              resolve(true);
            }
          });
          observer.observe(document.documentElement, { attributes: true, subtree: true });
        });
      };

      // Instantly remove 200ms transitions from drawer and its children
      const zeroDrawerTransition = el => {
        el.querySelectorAll('[style*="200ms"]').forEach(node => {
          node.style.transitionDuration = '0ms';
        });
      };

      // Wait for drawer and remove transitions once
      (async () => {
        const waitFor = selector => new Promise(resolve => {
          const found = document.querySelector(selector);
          if (found) return resolve(found);
          const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
              observer.disconnect();
              resolve(el);
            }
          });
          observer.observe(document.documentElement, {childList: true, subtree: true});
        });
        const drawer = await waitFor('tp-yt-app-drawer#guide');
        if (drawer) zeroDrawerTransition(drawer);
      })();

      // Prevent the persistent guide attribute from being set
      const ytdApp = document.querySelector('ytd-app');
      if (ytdApp) {
        // Remove if already present
        ytdApp.removeAttribute('guide-persistent-and-visible');
        // Observe and remove if added later
        window._gpvObserver = new MutationObserver(mutations => {
          for (const mutation of mutations) {
            if (
              mutation.type === 'attributes' &&
              mutation.attributeName === 'guide-persistent-and-visible'
            ) {
              ytdApp.removeAttribute('guide-persistent-and-visible');
            }
          }
        });
        window._gpvObserver.observe(ytdApp, { attributes: true });
      }

      // Open the sidebar menu (hamburger)
      const openMenu = async () => {
        await new Promise(resolve => {
          const check = () => {
            const app = document.querySelector('ytd-app');
            if (app && app.hasAttribute('mini-guide-visible') && !app.hasAttribute('guide-persistent-and-visible')) {
              resolve();
              return true;
            }
            return false;
          };
          if (check()) return;
          const mo = new MutationObserver(() => {
            if (check()) mo.disconnect();
          });
          mo.observe(document.documentElement, { attributes: true, subtree: true });
        });

        await waitFor('ytd-mini-guide-renderer[mini-guide-visible]');

        const hamburgerPathD = "M21 6H3V5h18v1zm0 5H3v1h18v-1zm0 6H3v1h18v-1z";
        const path = await waitFor(`svg path[d="${hamburgerPathD}"]`);
        const clickable = path.closest('div') || path.parentElement;
        clickable.click();
      };

      // Hide the guide drawer after opening
      const hideGuideDrawer = async () => {
        const guideDrawer = await waitFor('tp-yt-app-drawer#guide');
        guideDrawer.style.transform = 'translateX(-100%)';

        const trendingAnchorSelector = 'ytd-guide-entry-renderer a#endpoint[href*="/feed/trending"]';
        const trendingAnchor = await waitFor(trendingAnchorSelector);
        await waitFor('svg', trendingAnchor);

        const menuIconPath = "M21 6H3V5h18v1zm0 5H3v1h18v-1zm0 6H3v1h18v-1z";
        const guideButton = Array.from(document.querySelectorAll('yt-icon-button button'))
          .find(btn => btn.querySelector('svg path')?.getAttribute('d') === menuIconPath);

        if (guideButton) {
          guideButton.click();
          guideDrawer.style.transform = 'translateX(0)';
        }
      };

      // Run open/hide logic if mini-guide is active
      if (await shouldRun()) {
        await openMenu();
        await hideGuideDrawer();
      }

      // Restore drawer transitions to original duration
      async function restoreDrawerTransition() {
        const drawer = await waitFor('tp-yt-app-drawer#guide');
        if (!drawer) return;
        drawer.querySelectorAll('[style*="0ms"]').forEach(node => {
          // Use computed style or fallback to 200ms
          const computed = getComputedStyle(node).transitionDuration;
          node.style.transitionDuration = (computed && computed !== "0ms") ? computed : "200ms";
        });
      }

      if (await shouldRun()) {
        await restoreDrawerTransition();
      }

      // Stop blocking persistent guide attribute
      if (window._gpvObserver) {
        window._gpvObserver.disconnect();
        window._gpvObserver = null;
      }

      // Replace Shorts with Trending in the mini-guide
      const throttle = (f, d) => {
        let last = 0;
        return (...args) => {
          const now = Date.now();
          if (now - last > d) {
            last = now;
            f(...args);
          }
        };
      };
      const getTrending = () => new Promise(resolve => {
        const found = [...document.querySelectorAll('ytd-guide-entry-renderer a#endpoint')].find(a => a.href.includes('/feed/trending'));
        if (found) return resolve(found);
        const observer = new MutationObserver((mutations, obs) => {
          for (const mu of mutations) {
            for (const node of mu.addedNodes) {
              if (node.nodeType !== 1) continue;
              if (node.matches && node.matches('a#endpoint[href*="/feed/trending"]')) return obs.disconnect() || resolve(node);
              const f = node.querySelector && node.querySelector('a#endpoint[href*="/feed/trending"]');
              if (f) return obs.disconnect() || resolve(f);
            }
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
      const findShorts = () => {
        const r = document.querySelector('ytd-mini-guide-entry-renderer[data-replaced="true"] a#endpoint');
        if (r) return r;
        return [...document.querySelectorAll('ytd-mini-guide-entry-renderer a#endpoint')].find(a => {
          const p = a.querySelector('svg path');
          return p && S.has(p.getAttribute('d'));
        }) || null;
      };
      const nav = url => {
        try {
          if (window.yt?.router?.navigate) return window.yt.router.navigate(url), true;
          if (window.yt?.player?.Application?.router?.navigate) return window.yt.player.Application.router.navigate(url), true;
        } catch {}
        return false;
      };
      const rep = async () => {
        const t = await getTrending(), s = findShorts();
        if (!t || !s) return;
        const tSvg = t.querySelector('svg'), tText = t.querySelector('yt-formatted-string');
        if (!tSvg || !tText) return;
        const i = s.querySelector('yt-icon#icon span.yt-icon-shape div'), ttl = s.querySelector('span.title');
        if (!i || !ttl) return;
        while (i.firstChild) i.removeChild(i.firstChild);
        i.appendChild(tSvg.cloneNode(true));
        ttl.textContent = tText.textContent;
        const href = t.getAttribute('href'), title = t.getAttribute('title') || tText.textContent;
        s.setAttribute('href', href);
        s.setAttribute('title', title);
        s.onclick = e => {
          e.preventDefault();
          if (!nav(href)) window.location.href = href;
        };
        const c = s.closest('ytd-mini-guide-entry-renderer');
        if (c && !c.hasAttribute('data-replaced')) c.setAttribute('data-replaced', 'true');
      };
      const throttledReplace = throttle(rep, 1000);
      new MutationObserver(throttledReplace).observe(document.body, { childList: true, subtree: true });
      rep();

      // Swap Shorts and Trending entries in the main menu
      const S = new Set([
        "m7.61 15.719.392-.22v-2.24l-.534-.228-.942-.404c-.869-.372-1.4-1.15-1.446-1.974-.047-.823.39-1.642 1.203-2.097h.001L15.13 3.59c1.231-.689 2.785-.27 3.466.833.652 1.058.313 2.452-.879 3.118l-1.327.743-.388.217v2.243l.53.227.942.404c.869.372 1.4 1.15 1.446 1.974.047.823-.39 1.642-1.203 2.097l-.002.001-8.845 4.964-.001.001c-1.231.688-2.784.269-3.465-.834-.652-1.058-.313-2.451.879-3.118l1.327-.742Zm1.993 6.002c-1.905 1.066-4.356.46-5.475-1.355-1.057-1.713-.548-3.89 1.117-5.025a4.14 4.14 0 01.305-.189l1.327-.742-.942-.404a4.055 4.055 0 01-.709-.391c-.963-.666-1.578-1.718-1.644-2.877-.08-1.422.679-2.77 1.968-3.49l8.847-4.966c1.905-1.066 4.356-.46 5.475 1.355 1.057 1.713.548 3.89-1.117 5.025a4.074 4.074 0 01-.305.19l-1.327.742.942.403c.253.109.49.24.709.392.963.666 1.578 1.717 1.644 2.876.08 1.423-.679 2.77-1.968 3.491l-8.847 4.965ZM10 14.567a.25.25 0 00.374.217l4.45-2.567a.25.25 0 000-.433l-4.45-2.567a.25.25 0 00-.374.216v5.134Z",
        "M18.45 8.851c1.904-1.066 2.541-3.4 1.422-5.214-1.119-1.814-3.57-2.42-5.475-1.355L5.55 7.247c-1.29.722-2.049 2.069-1.968 3.491.081 1.423.989 2.683 2.353 3.268l.942.404-1.327.742c-1.904 1.066-2.541 3.4-1.422 5.214 1.119 1.814 3.57 2.421 5.475 1.355l8.847-4.965c1.29-.722 2.049-2.068 1.968-3.49-.081-1.423-.989-2.684-2.353-3.269l-.942-.403 1.327-.743ZM10 14.567a.25.25 0 00.374.217l4.45-2.567a.25.25 0 000-.433l-4.45-2.567a.25.25 0 00-.374.216v5.134Z"
      ]);

      let scheduled = false;
      function swap() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          const entries = [...document.querySelectorAll('ytd-guide-entry-renderer')];
          const shorts = entries.find(e => S.has(e.querySelector('a#endpoint svg path')?.getAttribute('d')));
          const trending = entries.find(e => e.querySelector('a#endpoint')?.href.includes('/feed/trending'));
          // Swap only if not already swapped
          if (
            shorts && trending &&
            !shorts.hasAttribute('data-swapped') &&
            !trending.hasAttribute('data-swapped') &&
            shorts !== trending
          ) {
            const shortsNext = shorts.nextSibling;
            const trendingNext = trending.nextSibling;
            const shortsParent = shorts.parentNode;
            const trendingParent = trending.parentNode;
            shortsParent.insertBefore(trending, shortsNext);
            trendingParent.insertBefore(shorts, trendingNext);
            shorts.setAttribute('data-swapped', 'true');
            trending.setAttribute('data-swapped', 'true');
          }
        });
      }

      const container = document.querySelector('ytd-guide-section-renderer') || document.body;
      new MutationObserver(swap).observe(container, { childList: true, subtree: true });
      swap();
    }

    // --- LOGIC FOR PERSISTENT GUIDE MODE ---
    async function scriptPersistentGuide(app) {
      // SVG path data for Shorts icons
      const SHORTS_PATHS = new Set([
        "m7.61 15.719.392-.22v-2.24l-.534-.228-.942-.404c-.869-.372-1.4-1.15-1.446-1.974-.047-.823.39-1.642 1.203-2.097h.001L15.13 3.59c1.231-.689 2.785-.27 3.466.833.652 1.058.313 2.452-.879 3.118l-1.327.743-.388.217v2.243l.53.227.942.404c.869.372 1.4 1.15 1.446 1.974.047.823-.39 1.642-1.203 2.097l-.002.001-8.845 4.964-.001.001c-1.231.688-2.784.269-3.465-.834-.652-1.058-.313-2.451.879-3.118l1.327-.742Zm1.993 6.002c-1.905 1.066-4.356.46-5.475-1.355-1.057-1.713-.548-3.89 1.117-5.025a4.14 4.14 0 01.305-.189l1.327-.742-.942-.404a4.055 4.055 0 01-.709-.391c-.963-.666-1.578-1.718-1.644-2.877-.08-1.422.679-2.77 1.968-3.49l8.847-4.966c1.905-1.066 4.356-.46 5.475 1.355 1.057 1.713.548 3.89-1.117 5.025a4.074 4.074 0 01-.305.19l-1.327.742.942.403c.253.109.49.24.709.392.963.666 1.578 1.717 1.644 2.876.08 1.423-.679 2.77-1.968 3.491l-8.847 4.965ZM10 14.567a.25.25 0 00.374.217l4.45-2.567a.25.25 0 000-.433l-4.45-2.567a.25.25 0 00-.374.216v5.134Z",
        "M18.45 8.851c1.904-1.066 2.541-3.4 1.422-5.214-1.119-1.814-3.57-2.42-5.475-1.355L5.55 7.247c-1.29.722-2.049 2.069-1.968 3.491.081 1.423.989 2.683 2.353 3.268l.942.404-1.327.742c-1.904 1.066-2.541 3.4-1.422 5.214 1.119 1.814 3.57 2.421 5.475 1.355l8.847-4.965c1.29-.722 2.049-2.068 1.968-3.49-.081-1.423-.989-2.684-2.353-3.269l-.942-.403 1.327-.743ZM10 14.567a.25.25 0 00.374.217l4.45-2.567a.25.25 0 000-.433l-4.45-2.567a.25.25 0 00-.374.216v5.134Z"
      ]);

      // Find a guide entry by href substring
      const findGuideEntry = (substr) =>
        Array.from(document.querySelectorAll('ytd-guide-entry-renderer')).find(el =>
          el.querySelector('a#endpoint')?.href.includes(substr)
        );

      // Check if a guide entry is Shorts
      const isShorts = (el) => {
        const d = el.querySelector('a#endpoint svg path')?.getAttribute('d');
        return d && SHORTS_PATHS.has(d);
      };

      // Swap Shorts and Trending in the persistent guide
      function swapGuideEntries() {
        if (document.querySelector('[data-swapped]')) return;
        const shorts = Array.from(document.querySelectorAll('ytd-guide-entry-renderer')).find(isShorts);
        const trending = findGuideEntry('/feed/trending');
        if (!shorts || !trending) return;

        const [p1, p2, n1, n2] = [
          shorts.parentNode,
          trending.parentNode,
          shorts.nextSibling,
          trending.nextSibling
        ];
        p1.replaceChild(trending, shorts);
        p2.insertBefore(shorts, n2);
        shorts.dataset.swapped = trending.dataset.swapped = 1;
      }

      // Extract Trending info for mini-guide replacement
      function fetchTrendingInfo() {
        const el = Array.from(document.querySelectorAll('ytd-guide-entry-renderer a#endpoint'))
          .find(a => a.href.includes('/feed/trending'));
        if (!el) return null;
        const svg = el.querySelector('svg');
        const txt = el.querySelector('yt-formatted-string');
        return svg && txt ? {
          svg,
          text: txt.textContent,
          href: el.href,
          title: el.title || txt.textContent
        } : null;
      }

      // Replace Shorts in the mini-guide with Trending info
      function replaceMiniGuideShorts(trending) {
        const a = Array.from(document.querySelectorAll('ytd-mini-guide-entry-renderer a#endpoint'))
          .find(a => {
            const d = a.querySelector('svg path')?.getAttribute('d');
            return d && SHORTS_PATHS.has(d);
          });
        if (!a) return;
        const icon = a.querySelector('yt-icon#icon span.yt-icon-shape div');
        const title = a.querySelector('span.title');
        if (!icon || !title) return;
        icon.replaceChildren(trending.svg.cloneNode(true));
        title.textContent = trending.text;
        a.href = trending.href;
        a.title = trending.title;
        a.onclick = e => { e.preventDefault(); location.href = trending.href; };
        a.closest('ytd-mini-guide-entry-renderer')?.setAttribute('data-replaced', 'true');
      }

      // Wait for the main guide button to be clicked (to trigger mini-guide)
      function waitForGuideClick() {
        return new Promise(res => {
          const btn = () => document.querySelector('#guide-button');
          const found = btn();
          if (found) return found.addEventListener('click', () => res(), { once: true });
          const mo = new MutationObserver(() => {
            const b = btn();
            if (b) { b.addEventListener('click', () => res(), { once: true }); mo.disconnect(); }
          });
          mo.observe(document.body, { childList: true, subtree: true });
        });
      }

      // --- Main persistent guide logic ---

      // Swap Shorts/Trending and observe for changes
      swapGuideEntries();
      new MutationObserver(swapGuideEntries).observe(document.body, { childList: true, subtree: true });

      (async () => {
        // Wait for Trending info to be available
        let trending = fetchTrendingInfo();
        if (!trending) {
          trending = await new Promise(res => {
            const mo = new MutationObserver(() => {
              const data = fetchTrendingInfo();
              if (data) { mo.disconnect(); res(data); }
            });
            mo.observe(document.body, { childList: true, subtree: true });
          });
        }
        await waitForGuideClick();
        replaceMiniGuideShorts(trending);
      })();
    }

    // --- MAIN ENTRYPOINT: Run correct script by guide mode ---
    waitForYtdAppAttr().then(({mode, app}) => {
      if (mode === 'persistent') {
        scriptPersistentGuide(app);
      } else if (mode === 'mini') {
        scriptMiniGuide(app);
      }
    });

    // --- Add click handler for Trending in mini-guide ---
    const paths = [
      "M14 2 7.305 5.956C4.637 7.533 3 10.401 3 13.5c0 4.694 3.806 8.5 8.5 8.5s8.5-3.806 8.5-8.5V1l-6 4V2ZM9 15c0-1.226.693-2.346 1.789-2.894L15 10v5c0 1.657-1.343 3-3 3s-3-1.343-3-3Z",
      "m14 2-1.5.886-5.195 3.07C4.637 7.533 3 10.401 3 13.5c0 4.694 3.806 8.5 8.5 8.5s8.5-3.806 8.5-8.5V1l-1.5 1-3 2L14 5V2ZM8.068 7.248l4.432-2.62v3.175l2.332-1.555L18.5 3.803V13.5c0 3.866-3.134 7-7 7s-7-3.134-7-7c0-2.568 1.357-4.946 3.568-6.252ZM9 15c0-1.226.693-2.346 1.789-2.894L15 10v5c0 1.657-1.343 3-3 3s-3-1.343-3-3Z"
    ];

    function addTrendingMiniGuideHandler() {
      document.querySelectorAll("ytd-mini-guide-entry-renderer").forEach(e => {
        if (e.dataset.trendingHandler) return; // Already handled
        const found = Array.from(e.querySelectorAll('svg path')).some(
          p => paths.includes(p.getAttribute('d'))
        );
        if (found) {
          e.addEventListener('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            // Try both open and closed drawer selectors for robustness
            document.querySelector('tp-yt-app-drawer#guide a#endpoint[href^="/feed/trending"]')?.click();
          }, true);
          e.dataset.trendingHandler = "true";
        }
      });
    }

    // Observe for new mini-guide entries and add handler
    const observer = new MutationObserver(addTrendingMiniGuideHandler);
    observer.observe(document.body, {childList: true, subtree: true});
    addTrendingMiniGuideHandler();

    // No-op reference to ytdApp for completeness
    const ytdApp = document.querySelector('ytd-app');
  }

  // --- MOBILE VERSION: Applies only to m.youtube.com ---
  if (location.hostname === 'm.youtube.com') {
    // Inject CSS to hide/disable drawer and scrim
    const css=document.createElement('style');
    css.id='h';css.textContent=`div.drawer-layout.opened{transform:translateX(-100%)!important;transition:none!important;visibility:hidden!important;pointer-events:none!important;display:block!important;}ytw-scrim.ytWebScrimHost{display:none!important;pointer-events:none!important;transition:none!important;animation:none!important;}div.drawer-layout.opened,div.drawer-layout.opened *,ytw-scrim.ytWebScrimHost,ytw-scrim.ytWebScrimHost *{transition:none!important;animation:none!important;}`;
    document.head.appendChild(css);

    // Hide the drawer, wait for Trending, then restore layout
    async function menu() {
      const save=e=>{if(!e.dataset.os)e.dataset.os=e.style.cssText||''};
      const restore=()=>{
        let d=document.querySelector('div.drawer-layout.opened'),
            s=document.querySelector('ytw-scrim.ytWebScrimHost'),
            c=document.getElementById('h');
        if(d&&d.dataset.os)d.style.cssText=d.dataset.os;
        if(s&&s.dataset.os)s.style.cssText=s.dataset.os;
        c&&c.remove();
      };
      const patch=()=>{
        let d=document.querySelector('div.drawer-layout.opened'),
            s=document.querySelector('ytw-scrim.ytWebScrimHost');
        if(d){save(d);d.style.setProperty('transform','translateX(-100%)','important');d.style.setProperty('transition','none','important');d.style.setProperty('visibility','hidden','important');d.style.setProperty('pointer-events','none','important');d.style.setProperty('display','block','important')}
        if(s){save(s);s.style.setProperty('display','none','important');s.style.setProperty('pointer-events','none','important');s.style.setProperty('transition','none','important');s.style.setProperty('animation','none','important')}
      };
      const findBtn=()=>document.querySelector('div.search-bar-entry-point-button.search-bar-entry-point-more-drawer-button[role=button]')||[...document.querySelectorAll('div.chip-container')].find(d=>d.querySelector('svg'))||null;
      const waitClick=()=>new Promise(r=>{
        let b=findBtn();
        if(b){b.click();r(b);return;}
        const o=new MutationObserver(()=>{
          let b=findBtn();
          if(b){o.disconnect();b.click();r(b);}
        });
        o.observe(document.body,{childList:1,subtree:1});
      });
      const waitTrend=()=>new Promise(r=>{
        const c=()=>{
          for(const a of document.querySelectorAll('a[href*="/feed/trending"]'))
            if(a.querySelector('svg'))return a;
          return null;
        };
        let f=c();
        if(f){r(f);return;}
        const o=new MutationObserver(()=>{
          let f=c();
          if(f){o.disconnect();r(f);}
        });
        o.observe(document.body,{childList:1,subtree:1});
      });
      const close=()=>{
        const b=document.querySelector('ytw-scrim button.ytWebScrimHiddenButton');
        if(b)b.click();
        else restore();
      };
      const o=new MutationObserver(()=>{if(document.querySelector('div.drawer-layout.opened'))patch()});
      o.observe(document.body,{childList:1,subtree:1});
      await waitClick();
      await waitTrend();
      close();
      setTimeout(()=>{
        o.disconnect();
        restore();
      },300);
    }

    // Swap Shorts/Trending in the mobile pivot bar
    async function mobileSwap(){
      const K='yt_trending_cache';
      let r=0,p=location.pathname,lO;
      const save=(d,l,h)=>d&&l&&h&&localStorage.setItem(K,JSON.stringify({d,l,h}));
      const load=()=>{
        try{return JSON.parse(localStorage.getItem(K))||null}catch{return null}
      };
      const df=(s,r=document)=>r.querySelector(s)||[...r.querySelectorAll('*')].reduce((a,n)=>a||(n.shadowRoot&&df(s,n.shadowRoot)),null);
      const wt=()=>new Promise(r=>{
        const c=()=>{
          const a=df('a[href*="/feed/trending"]');
          if(!a)return 0;
          const p=a.querySelector('svg path'),t=a.querySelector('.yt-spec-navigation-item-shape__navigation-item-label span');
          if(!p||!t)return 0;
          const d=p.getAttribute('d'),l=t.textContent.trim(),h=a.href;
          if(d&&l&&h.includes('/feed/trending')){save(d,l,h);mo.disconnect();r({d,l,h});return 1;}
          return 0;
        };
        if(c())return;
        const mo=new MutationObserver(c);
        mo.observe(document.body,{childList:1,subtree:1});
      });
      const sL=(b,t)=>{
        const s=b.querySelector('div.pivot-bar-item-title span');
        if(!s)return 0;
        s.textContent=t;
        lO?.disconnect();
        lO=new MutationObserver(()=>{if(s.textContent!==t)s.textContent=t});
        lO.observe(s,{characterData:1,childList:1,subtree:1});
        return 1;
      };
      const mkS=d=>{
        const ns='http://www.w3.org/2000/svg',
              s=document.createElementNS(ns,'svg'),
              g=document.createElementNS(ns,'g'),
              p=document.createElementNS(ns,'path');
        s.setAttribute('viewBox','0 0 24 24');
        s.setAttribute('style','pointer-events:none;display:block;width:100%;height:100%');
        p.setAttribute('d',d);
        g.appendChild(p);
        s.appendChild(g);
        return s;
      };
      const mkI=()=>{
        const ns='http://www.w3.org/2000/svg',
              sp=document.createElement('span'),
              d=document.createElement('div'),
              s=document.createElementNS(ns,'svg'),
              p=document.createElementNS(ns,'path');
        sp.className='yt-icon-shape style-scope yt-icon yt-spec-icon-shape';
        d.style.cssText='width:100%;height:100%;display:block;fill:currentcolor';
        s.setAttribute('fill','currentColor');
        s.setAttribute('height','24');
        s.setAttribute('width','24');
        s.setAttribute('viewBox','0 0 24 24');
        s.setAttribute('style','pointer-events:none;display:inherit;width:100%;height:100%');
        p.setAttribute('clip-rule','evenodd');
        p.setAttribute('fill-rule','evenodd');
        p.setAttribute('d','M14 2 7.305 5.956C4.637 7.533 3 10.401 3 13.5c0 4.694 3.806 8.5 8.5 8.5s8.5-3.806 8.5-8.5V1l-6 4V2ZM9 15c0-1.226.693-2.346 1.789-2.894L15 10v5c0 1.657-1.343 3-3 3s-3-1.343-3-3Z');
        s.appendChild(p);
        d.appendChild(s);
        sp.appendChild(d);
        return sp;
      };
      async function rep(){
        const b=document.querySelector('div.pivot-bar-item-tab.pivot-shorts[role=tab]');
        if(!b)return 0;
        const i=b.querySelector('c3-icon');
        if(!i)return 0;
        if(location.pathname==='/feed/trending'){
          i.replaceChildren(mkI());
          b.onclick=()=>location.href='/feed/trending';
          const l=load()?.l||'Trending';
          if(!sL(b,l)){
            const mo=new MutationObserver((_,o)=>sL(b,l)&&o.disconnect());
            mo.observe(b,{childList:1,subtree:1});
          }
          r=1;return 1;
        }
        let d=null;
        if(location.pathname==='/') d=await wt();
        if(!d) d=load();
        if(!d) return 0;
        i.replaceChildren(mkS(d.d));
        b.onclick=()=>location.href=d.h;
        if(!sL(b,d.l)){
          const mo=new MutationObserver((_,o)=>sL(b,d.l)&&o.disconnect());
          mo.observe(b,{childList:1,subtree:1});
        }
        r=1;return 1;
      }
      async function t(){
        if(location.pathname!==p)r=0,p=location.pathname;
        if(!r)await rep();
      }
      await t();
      new MutationObserver(t).observe(document,{childList:1,subtree:1});
    }

    // Run menu and swap logic when DOM is ready
    if(document.readyState==='loading'){
      window.addEventListener('DOMContentLoaded',()=>{menu();mobileSwap()});
    } else {
      menu();mobileSwap();
    }
  }
})();
