// ==UserScript==
// @name         Return YouTube Trending
// @version      1.7
// @description  Replace Shorts with Trending
// @match        *://*.youtube.com/*
// @grant        none
// ==/UserScript==
// Source by ChatGPT, Perplexity

(function() {
  'use strict';

  // --- DESKTOP ---
  if (location.hostname === 'www.youtube.com') {
    function waitForFrostedGlassReady() {
      return new Promise(resolve => {
        const glass = document.querySelector('#frosted-glass');
        if (glass && !glass.classList.contains('loading-without-chipbar')) {
          resolve();
          return;
        }

        const observer = new MutationObserver(() => {
          const glass = document.querySelector('#frosted-glass');
          if (glass && !glass.classList.contains('loading-without-chipbar')) {
            observer.disconnect();
            resolve();
          }
        });

        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      });
    }

    function waitForMiniGuideMode() {
      return new Promise(resolve => {
        const target = document.querySelector('ytd-mini-guide-renderer');
        if (target) {
          const result = target.hasAttribute('mini-guide-visible')
            ? 'mini-guide-visible'
            : target.hasAttribute('guide-persistent-and-visible') || target.hasAttribute('hidden')
              ? 'skip'
              : null;

          if (result === 'mini-guide-visible') {
            resolve(true);
            return;
          } else if (result === 'skip') {
            resolve(false);
            return;
          }
        }

        const observer = new MutationObserver(() => {
          const el = document.querySelector('ytd-mini-guide-renderer');
          if (!el) return;

          if (el.hasAttribute('mini-guide-visible')) {
            observer.disconnect();
            resolve(true);
          } else if (el.hasAttribute('guide-persistent-and-visible') || el.hasAttribute('hidden')) {
            observer.disconnect();
            resolve(false);
          }
        });

        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      });
    }

    (async () => {
      await waitForFrostedGlassReady();
      const runParts1and2 = await waitForMiniGuideMode();

      async function waitFor(selector) {
        const el = await new Promise(resolve => {
          const observer = new MutationObserver(() => {
            const found = document.querySelector(selector);
            if (found) {
              observer.disconnect();
              resolve(found);
            }
          });
          observer.observe(document, { childList: true, subtree: true });
        });
        return el;
      }

      async function main() {
        const guideDrawer = await waitFor('tp-yt-app-drawer#guide');
        const ytdApp = document.querySelector('ytd-app');

        let originalScrimDuration = null;
        let originalContentContainerDuration = null;

        if (runParts1and2) {
          // (Wait for menu) Remove menu space
          new MutationObserver((_, obs) => {
            const ytdApp = document.querySelector('ytd-app.darker-dark-theme');
            if (!ytdApp) return;
            const attrObserver = new MutationObserver(() => {
              if (
                ytdApp.hasAttribute('guide-persistent-and-visible') &&
                !ytdApp.hasAttribute('mini-guide-visible')
              ) {
                ytdApp.setAttribute('mini-guide-visible', '');
                ytdApp.removeAttribute('guide-persistent-and-visible');
                attrObserver.disconnect(); // Stop after one revert
              }
            });
            attrObserver.observe(ytdApp, {
              attributes: true,
              attributeFilter: ['guide-persistent-and-visible', 'mini-guide-visible']
            });
            obs.disconnect();
          }).observe(document.documentElement, { childList: true, subtree: true });

          // Hide menu
          if (guideDrawer) {
            guideDrawer.style.transitionDuration = '0ms';
            guideDrawer.style.transform = 'translateX(-100%)';
          }

          // Remove animation
          const zeroDrawerTransition = () => {
            const scrim = document.querySelector('#scrim');
            const contentContainer = document.querySelector('#contentContainer');

            if (scrim) {
              originalScrimDuration = scrim.style.transitionDuration || window.getComputedStyle(scrim).transitionDuration;
              scrim.style.transitionDuration = '0ms';
            }

            if (contentContainer) {
              originalContentContainerDuration = contentContainer.style.transitionDuration || window.getComputedStyle(contentContainer).transitionDuration;
              contentContainer.style.transitionDuration = '0ms';
            }
          };
          if (guideDrawer) zeroDrawerTransition();

          // (Wait for menu button) Open menu
          const guideButton = await waitFor('yt-icon-button#guide-button');
          const svgIcon = await waitFor('yt-icon-button#guide-button svg');
          if (guideButton && svgIcon) {
            const button = guideButton.querySelector('button');
            if (button) {
              button.click();
            }
          }
        }

        // (Wait for menu) Wait for Trending, Shorts SVG
        async function waitForTrendingEntry() {
          return new Promise(resolve => {
            const observer = new MutationObserver(() => {
              const entry = Array.from(document.querySelectorAll('ytd-guide-entry-renderer')).find(el => {
                const a = el.querySelector('a#endpoint');
                if (!a) return false;
                try {
                  const url = new URL(a.href, window.location.origin);
                  return url.pathname === '/feed/trending';
                } catch {
                  return false;
                }
              });

              if (entry) {
                const svg = entry.querySelector('svg');
                if (svg) {
                  observer.disconnect();
                  resolve(entry);
                }
              }
            });

            observer.observe(document.body, { childList: true, subtree: true });
          });
        }

        // Replace main menu buttons
        const SHORTS_SVG = ["m7.61 15.719", "M18.45 8.851"];
        function isShorts(el) {
          const d = el.querySelector('svg path')?.getAttribute('d')?.trim();
          return d && SHORTS_SVG.some(p => d.startsWith(p));
        }
        function isTrending(el) {
          const href = el.querySelector('a#endpoint')?.getAttribute('href');
          return href?.startsWith('/feed/trending');
        }
        function swapGuideEntries() {
          const entries = [...document.querySelectorAll('ytd-guide-entry-renderer')];
          const shorts = entries.find(isShorts);
          const trending = entries.find(isTrending);
          if (!shorts || !trending || shorts.dataset.swapped) return;

          const [p1, p2] = [shorts.parentNode, trending.parentNode];
          const [n1, n2] = [shorts.nextSibling, trending.nextSibling];
          p1.replaceChild(trending, shorts);
          p2.insertBefore(shorts, n2);
          shorts.dataset.swapped = trending.dataset.swapped = 'true';
        }
        const guideObserver = new MutationObserver(swapGuideEntries);
        guideObserver.observe(document.body, { childList: true, subtree: true });
        swapGuideEntries();

        // Fetch Trending elements
        (async function replaceMiniGuideShortsWithTrending() {
          const waitForTrendingEntryInMain = () => new Promise(resolve => {
            const observer = new MutationObserver(check);
            function check() {
              const entry = [...document.querySelectorAll('ytd-guide-entry-renderer')].find(el =>
                el.querySelector('a#endpoint')?.href.includes('/feed/trending')
              );
              if (entry) {
                const svg = entry.querySelector('svg');
                const path = svg?.querySelector('path');
                const text = entry.querySelector('.title');
                if (svg && path && text) {
                  observer.disconnect();
                  resolve(entry);
                }
              }
            }
            check();
            observer.observe(document.body, { childList: true, subtree: true });
          });

          const getTrendingDataFromEntry = entry => {
            const endpoint = entry.querySelector('a#endpoint');
            const svg = endpoint?.querySelector('svg');
            const path = svg?.querySelector('path');
            const label = entry.querySelector('.title')?.textContent.trim();
            const href = endpoint?.getAttribute('href');
            const tooltip = endpoint?.getAttribute('title');

            return {
              svg: svg?.cloneNode(true),
              pathD: path?.getAttribute('d'),
              label,
              href,
              tooltip
            };
          };

          const trendingMainEntry = await waitForTrendingEntryInMain();
          let trendingData = getTrendingDataFromEntry(trendingMainEntry);

          if (runParts1and2) {
            // Close menu
            const guideButton = document.querySelector('yt-icon-button#guide-button');
            if (guideButton) {
              guideButton.click();
            }

            // Restore menu
            if (guideDrawer) {
              guideDrawer.style.transitionDuration = '0ms';
              guideDrawer.style.transform = 'translateX(0%)';
            }

            // Restore animation
            const scrim = document.querySelector('#scrim');
            const contentContainer = document.querySelector('#contentContainer');

            if (scrim && originalScrimDuration) {
              scrim.style.transitionDuration = originalScrimDuration;
            }

            if (contentContainer && originalContentContainerDuration) {
              contentContainer.style.transitionDuration = originalContentContainerDuration;
            }
          }

          // (Wait for mini menu) Replace shorts with Trending in mini menu
          async function waitForMiniGuideShorts() {
            const SHORTS_PATHS = [
              "m7.61 15.719", "M18.45 8.851"
            ];

            return new Promise(resolve => {
              const observer = new MutationObserver(() => {
                const entries = document.querySelectorAll('ytd-mini-guide-entry-renderer');
                for (const entry of entries) {
                  const path = entry.querySelector('svg path');
                  if (path) {
                    const d = path.getAttribute('d')?.trim();
                    if (d && SHORTS_PATHS.some(prefix => d.startsWith(prefix))) {
                      observer.disconnect();
                      resolve(entry);
                      return;
                    }
                  }
                }
              });

              observer.observe(document.body, { childList: true, subtree: true });
            });
          }

          const replaceMiniGuideEntry = entry => {
            const oldSvg = entry?.querySelector('svg');
            const textTarget = entry?.querySelector('.title');
            const anchor = entry?.querySelector('#endpoint');

            if (oldSvg && textTarget && anchor) {
              oldSvg.replaceWith(trendingData.svg.cloneNode(true));
              textTarget.textContent = trendingData.label;
              anchor.title = trendingData.label;
              anchor.href = trendingData.href;
            }
          };

          const shortsEntry = await waitForMiniGuideShorts();
          if (shortsEntry && trendingData) {
            replaceMiniGuideEntry(shortsEntry);
          }

          const watchMainGuideTrendingForChanges = () => {
            const observer = new MutationObserver(() => {
              const current = [...document.querySelectorAll('ytd-guide-entry-renderer')].find(el =>
                el.querySelector('a#endpoint')?.href.includes('/feed/trending')
              );
              if (!current) return;

              const newTrendingData = getTrendingDataFromEntry(current);
              if (
                newTrendingData.pathD !== trendingData.pathD ||
                newTrendingData.label !== trendingData.label
              ) {
                trendingData = newTrendingData;
                replaceMiniGuideEntry(shortsEntry);
              }
            });

            observer.observe(document.body, {
              childList: true,
              characterData: true,
              subtree: true
            });
          };

          watchMainGuideTrendingForChanges();
        })();

        // Overwrite mini menu shorts button polymer
        function addTrendingMiniGuideHandler() {
          document.querySelectorAll("ytd-mini-guide-entry-renderer").forEach(e => {
            if (e.dataset.trendingHandler) return;

            const found = Array.from(e.querySelectorAll('svg path')).some(p => {
              const d = p.getAttribute('d')?.trim();
              return d && ["M14 2 7.305", "m14 2-1.5"].some(prefix => d.startsWith(prefix));
            });

            if (found) {
              e.addEventListener('click', ev => {
                ev.preventDefault();
                ev.stopPropagation();

                const mainTrending = document.querySelector(
                  'tp-yt-app-drawer#guide a#endpoint[href^="/feed/trending"]'
                );
                if (mainTrending) {
                  mainTrending.click();
                }
              }, true);

              e.dataset.trendingHandler = "true";
            }
          });
        }

        const miniGuideTrendingObserver = new MutationObserver(addTrendingMiniGuideHandler);
        miniGuideTrendingObserver.observe(document.body, { childList: true, subtree: true });
        addTrendingMiniGuideHandler();
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
      } else {
        main();
      }
    })();
  }

  // --- MOBILE ---
  if (location.hostname === 'm.youtube.com') {
    // (Wait for menu) Hide menu
    const css=document.createElement('style');
    css.id='h';css.textContent=`div.drawer-layout.opened{transform:translateX(-100%)!important;transition:none!important;visibility:hidden!important;pointer-events:none!important;display:block!important;}ytw-scrim.ytWebScrimHost{display:none!important;pointer-events:none!important;transition:none!important;animation:none!important;}div.drawer-layout.opened,div.drawer-layout.opened *,ytw-scrim.ytWebScrimHost,ytw-scrim.ytWebScrimHost *{transition:none!important;animation:none!important;}`;
    document.head.appendChild(css);

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

      // (Wait for menu button) Open menu
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

      // (Wait for menu) Fetch Trending elements
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

      // Close menu
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
      // Restore menu
        restore();
      },300);
    }

    // Replace shorts with Trending in mini menu (Cache Trending elements)
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

    if(document.readyState==='loading'){
      window.addEventListener('DOMContentLoaded',()=>{menu();mobileSwap()});
    } else {
      menu();mobileSwap();
    }
  }
})();
