// ==UserScript==
// @name         Return YouTube Trending
// @version      1.8
// @description  Replace Shorts with Trending
// @match        *://*.youtube.com/*
// @grant        none
// ==/UserScript==
// Source by ChatGPT, Perplexity

(function() {
  'use strict';

  const dict = {
    "af-ZA": "Gewild", // Afrikaans
    "az-Latn-AZ": "Trenddə olan", // Azərbaycan
    "id-ID": "Trending", // Bahasa Indonesia
    "ms-MY": "Sohor Kini", // Bahasa Malaysia
    "bs-Latn-BA": "Popularno", // Bosanski
    "ca-ES": "Tendències", // Català
    "cs-CZ": "Trendy", // Čeština
    "da-DK": "Hot lige nu", // Dansk
    "de-DE": "Trends", // Deutsch
    "et-EE": "Populaarsed", // Eesti
    "en-IN": "Trending", // English (India)
    "en-GB": "Trending", // English (UK)
    "en": "Trending", // English (US)
    "es-ES": "Tendencias", // Español (España)
    "es-419": "Tendencias", // Español (Latinoamérica)
    "es-US": "Tendencias", // Español (US)
    "eu-ES": "Pil-pilean", // Euskara
    "fil-PH": "Trending", // Filipino
    "fr-FR": "Tendances", // Français
    "fr-CA": "Tendance", // Français (Canada)
    "gl-ES": "Tendencias", // Galego
    "hr-HR": "U trendu", // Hrvatski
    "zu-ZA": "Okuthrendayo", // IsiZulu
    "is-IS": "Vinsælt núna", // Íslenska
    "it-IT": "Tendenze", // Italiano
    "sw-TZ": "Zinazovuma", // Kiswahili
    "lv-LV": "Tendences", // Latviešu valoda
    "lt-LT": "Populiarūs", // Lietuvių
    "hu-HU": "Felkapott", // Magyar
    "nl-NL": "Trending", // Nederlands
    "nb-NO": "På vei opp", // Norsk
    "uz-Latn-UZ": "Trendda", // O‘zbek
    "pl-PL": "Na czasie", // Polski
    "pt-PT": "Tendências", // Português
    "pt-BR": "Em alta", // Português (Brasil)
    "ro-RO": "Tendințe", // Română
    "sq-AL": "Tendenca", // Shqip
    "sk-SK": "Populárne", // Slovenčina
    "sl-SI": "V trendu", // Slovenščina
    "sr-Latn-RS": "U trendu", // Srpski
    "fi-FI": "Nousussa", // Suomi
    "sv-SE": "Populärt", // Svenska
    "vi-VN": "Thịnh hành", // Tiếng Việt
    "tr-TR": "Trendler", // Türkçe
    "be-BY": "Трэндавыя", // Беларуская
    "bg-BG": "Набиращи популярност", // Български
    "ky-KG": "Жаңы видеолор", // Кыргызча
    "kk-KZ": "Танымал", // Қазақ Тілі
    "mk-MK": "Во тренд", // Македонски
    "mn-MN": "Тренд", // Монгол
    "ru-RU": "В тренде", // Русский
    "sr-Cyrl-RS": "У тренду", // Српски
    "uk-UA": "Популярне", // Українська
    "el-GR": "Τάσεις", // Ελληνικά
    "hy-AM": "Թրենդային", // Հայերեն
    "he-IL": "הסרטונים החמים", // עברית
    "ur-PK": "رجحان ساز", // اردو
    "ar": "المحتوى الرائج", // العربية
    "fa-IR": "پرطرفدار", // فارسی
    "ne-NP": "प्रचलनमा", // नेपाली
    "mr-IN": "ट्रेंडिंग", // मराठी
    "hi-IN": "ट्रेंडिंग", // हिन्दी
    "as-IN": "এইমুহূৰ্তত জনপ্রিয়", // অসমীয়া
    "bn-BD": "এখন জনপ্রিয়", // বাংলা
    "pa-Guru-IN": "ਪ੍ਰਚਲਿਤ", // ਪੰਜਾਬੀ
    "gu-IN": "ટ્રેંડિંગ", // ગુજરાતી
    "or-IN": "ଟ୍ରେଣ୍ଡିଂ", // ଓଡ଼ିଆ
    "ta-IN": "பிரபலமடைபவை", // தமிழ்
    "te-IN": "ట్రెండింగ్", // తెలుగు
    "kn-IN": "ಟ್ರೆಂಡಿಂಗ್", // ಕನ್ನಡ
    "ml-IN": "ട്രെൻഡിംഗ്", // മലയാളം
    "si-LK": "නැඟී එන", // සිංහල
    "th-TH": "มาแรง", // ภาษาไทย
    "lo-LA": "ກຳລັງນິຍົມ", // ລາວ
    "my-MM": "ခေတ်စားသော", // ဗမာ
    "ka-GE": "პოპულარულები", // ქართული
    "am-ET": "በመታየት ላይ ያሉ", // አማርኛ
    "km-KH": "កំពុង​ពេញ​និយម", // ខ្មែរ
    "zh-Hans-CN": "时下流行", // 中文 (简体)
    "zh-Hant-TW": "發燒影片", // 中文 (繁體)
    "zh-Hant-HK": "熱爆影片", // 中文 (香港)
    "ja-JP": "急上昇", // 日本語
    "ko-KR": "인기 급상승" // 한국어
};

  const Shorts_SVG = `m7.61 15.719.392-.22v-2.24l-.534-.228-.942-.404c-.869-.372-1.4-1.15-1.446-1.974-.047-.823.39-1.642 1.203-2.097h.001L15.13 3.59c1.231-.689 2.785-.27 3.466.833.652 1.058.313 2.452-.879 3.118l-1.327.743-.388.217v2.243l.53.227.942.404c.869.372 1.4 1.15 1.446 1.974.047.823-.39 1.642-1.203 2.097l-.002.001-8.845 4.964-.001.001c-1.231.688-2.784.269-3.465-.834-.652-1.058-.313-2.451.879-3.118l1.327-.742Zm1.993 6.002c-1.905 1.066-4.356.46-5.475-1.355-1.057-1.713-.548-3.89 1.117-5.025a4.14 4.14 0 01.305-.189l1.327-.742-.942-.404a4.055 4.055 0 01-.709-.391c-.963-.666-1.578-1.718-1.644-2.877-.08-1.422.679-2.77 1.968-3.49l8.847-4.966c1.905-1.066 4.356-.46 5.475 1.355 1.057 1.713.548 3.89-1.117 5.025a4.074 4.074 0 01-.305.19l-1.327.742.942.403c.253.109.49.24.709.392.963.666 1.578 1.717 1.644 2.876.08 1.423-.679 2.77-1.968 3.491l-8.847 4.965ZM10 14.567a.25.25 0 00.374.217l4.45-2.567a.25.25 0 000-.433l-4.45-2.567a.25.25 0 00-.374.216v5.134Z`;
  const Shorts_SVG2 = `M18.45 8.851c1.904-1.066 2.541-3.4 1.422-5.214-1.119-1.814-3.57-2.42-5.475-1.355L5.55 7.247c-1.29.722-2.049 2.069-1.968 3.491.081 1.423.989 2.683 2.353 3.268l.942.404-1.327.742c-1.904 1.066-2.541 3.4-1.422 5.214 1.119 1.814 3.57 2.421 5.475 1.355l8.847-4.965c1.29-.722 2.049-2.068 1.968-3.49-.081-1.423-.989-2.684-2.353-3.269l-.942-.403 1.327-.743ZM10 14.567a.25.25 0 00.374.217l4.45-2.567a.25.25 0 000-.433l-4.45-2.567a.25.25 0 00-.374.216v5.134Z`;
  const Trending_SVG = `m14 2-1.5.886-5.195 3.07C4.637 7.533 3 10.401 3 13.5c0 4.694 3.806 8.5 8.5 8.5s8.5-3.806 8.5-8.5V1l-1.5 1-3 2L14 5V2ZM8.068 7.248l4.432-2.62v3.175l2.332-1.555L18.5 3.803V13.5c0 3.866-3.134 7-7 7s-7-3.134-7-7c0-2.568 1.357-4.946 3.568-6.252ZM9 15c0-1.226.693-2.346 1.789-2.894L15 10v5c0 1.657-1.343 3-3 3s-3-1.343-3-3Z`;
  const Trending_SVG2 = `M14 2 7.305 5.956C4.637 7.533 3 10.401 3 13.5c0 4.694 3.806 8.5 8.5 8.5s8.5-3.806 8.5-8.5V1l-6 4V2ZM9 15c0-1.226.693-2.346 1.789-2.894L15 10v5c0 1.657-1.343 3-3 3s-3-1.343-3-3Z`;

  const normalize = d => d.replace(/\s+/g, '');
  const shortsPaths = [Shorts_SVG, Shorts_SVG2];

  if (location.hostname === 'www.youtube.com') {
    const getSiteLanguage = () => {
      const htmlLang = document.documentElement.getAttribute('lang');
      if (htmlLang && dict[htmlLang]) return htmlLang;
      return "en-GB";
    };

    const lang = getSiteLanguage();
    const text = dict[lang] || "Trending";

    const updateShortsEntry = () => {
      const els = [...document.querySelectorAll('ytd-mini-guide-entry-renderer, ytd-guide-entry-renderer')].filter(e => {
        const paths = e.querySelectorAll('svg path');
        return [...paths].some(p => {
          const d = p.getAttribute('d');
          return shortsPaths.some(shortD => normalize(shortD) === normalize(d));
        });
      });
      if (!els.length) return;

      els.forEach(el => {
        const a = el.querySelector("a#endpoint");
        const s = el.querySelector("span.title") || el.querySelector("yt-formatted-string.title");
        const t = el.querySelector("tp-yt-paper-tooltip #tooltip");

        if (s?.textContent !== text) {
          s.textContent = text;
          if (a) {
            a.title = text;
            a.href = "/feed/trending";
          }
          el.setAttribute("aria-label", text);
          if (t) t.textContent = text;
        }

        if (a) {
          a.removeEventListener("click", onClickRedirect);
          a.addEventListener("click", onClickRedirect);
        }
      });
    };

    function onClickRedirect(e) {
      e.preventDefault();
      window.location.href = "/feed/trending";
    }

    const isMatch = d => [Trending_SVG, Trending_SVG2, ...shortsPaths].some(x => normalize(x) === normalize(d));
    const getD = () => normalize(location.pathname) === '/feed/trending' ? Trending_SVG2 : Trending_SVG;

    function observeSVGChanges(el) {
      const svg = el.querySelector('svg');
      if (!svg) return;

      const path = [...svg.querySelectorAll('path')].find(p =>
        isMatch(p.getAttribute('d'))
      );
      if (!path) return;

      if (path.__svgObserved) return;
      path.__svgObserved = true;

      const svgObserver = new MutationObserver(() => {
        const d = path.getAttribute('d');
        if (isMatch(d) && d !== getD()) {
          path.setAttribute('d', getD());
        }
      });

      svgObserver.observe(path, { attributes: true, attributeFilter: ['d'] });
    }

    const replaceSVG = () => {
      const els = [...document.querySelectorAll('ytd-mini-guide-entry-renderer, ytd-guide-entry-renderer')]
        .filter(e => {
          const titleSpan = e.querySelector("span.title") || e.querySelector("yt-formatted-string.title");
          return titleSpan && (titleSpan.textContent.trim() === text);
        });
      if (!els.length) return;

      els.forEach(el => {
        el.querySelectorAll('svg path').forEach(p => {
          if (isMatch(p.getAttribute('d'))) {
            p.setAttribute('d', getD());
          }
        });

        observeSVGChanges(el);
      });
    };

    const observer = new MutationObserver(() => {
      updateShortsEntry();
      replaceSVG();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    ['pushState', 'replaceState'].forEach(k => {
      const orig = history[k];
      history[k] = function (...a) {
        orig.apply(this, a);
        updateShortsEntry();
        replaceSVG();
      };
    });

    addEventListener('popstate', () => {
      updateShortsEntry();
      replaceSVG();
    });

    updateShortsEntry();
    replaceSVG();
  }

  if (location.hostname === 'm.youtube.com') {
    const lang = document.body.lang || 'en-GB';
    const trendingText = dict[lang] || dict['en-GB'];

    let lastUrl = location.pathname + location.search + location.hash;

    function replaceClick(div) {
      if (div.__customClickReplaced) return;
      div.__customClickReplaced = true;

      div.style.cursor = 'pointer';
      div.onclick = null;

      div.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (location.pathname !== '/feed/trending') {
          window.location.href = '/feed/trending';
        }
      }, { capture: true });
    }

    function update() {
      const currentUrl = location.pathname + location.search + location.hash;
      const onTrending = currentUrl.startsWith('/feed/trending');
      lastUrl = currentUrl;

      const shortsTabs = document.querySelectorAll('div.pivot-bar-item-tab.pivot-shorts');

      shortsTabs.forEach(div => {
        const pathEl = div.querySelector('svg path');
        if (!pathEl) return;

        const currentD = pathEl.getAttribute('d');
        const isKnownSvg = [Shorts_SVG, Trending_SVG, Trending_SVG2].includes(currentD);
        if (!isKnownSvg) return;

        const desiredPath = onTrending ? Trending_SVG2 : Trending_SVG;

        if (currentD !== desiredPath) {
          pathEl.setAttribute('d', desiredPath);
        }

        const textSpan = div.querySelector('div.pivot-bar-item-title.pivot-shorts > span[role="text"]');
        if (textSpan && textSpan.textContent !== trendingText) {
          textSpan.textContent = trendingText;
        }

        replaceClick(div);
      });
    }

    function hookHistoryMethod(method) {
      const original = history[method];
      return function (...args) {
        const result = original.apply(this, args);
        window.dispatchEvent(new Event('urlchange'));
        return result;
      };
    }

    history.pushState = hookHistoryMethod('pushState');
    history.replaceState = hookHistoryMethod('replaceState');

    window.addEventListener('popstate', update);
    window.addEventListener('urlchange', update);

    new MutationObserver(() => update()).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['d'],
    });

    update();
  }
})();
