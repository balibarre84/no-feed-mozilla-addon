(() => {
  "use strict";

  const html = document.documentElement;

  const isHome = () => location.pathname === "/";
  // Page Explorer et page Recherche.
  const isExplore = () => /^\/explore\/(?:search\/?)?$/.test(location.pathname);
  const isReels = () => /^\/reels(?:\/|$)/.test(location.pathname);

  // ---------- 1. Page Reels : on ne l'affiche jamais ----------
  // /reels/… est un fil infini : on renvoie vers l'accueil (qui reste vide).
  // Les liens individuels /reel/ID restent ouverts.
  function leaveReels() {
    if (!isReels()) return false;
    location.replace("/");
    return true;
  }

  if (leaveReels()) return;

  // ---------- Drapeaux de page ----------
  // Posés immédiatement, avant le premier affichage : hide.css masque alors
  // <main> sur l'accueil sans que rien n'apparaisse, même un instant.
  function updateFlags() {
    html.toggleAttribute("data-isf-home", isHome());
    html.toggleAttribute("data-isf-explore", isExplore());
  }
  updateFlags();

  // ---------- Utilitaires ----------
  // Les classes d'Instagram sont générées et changent sans cesse : on se repère
  // à des liens (href), des rôles ou des libellés, jamais aux noms de classes.
  const SUGGEST_LINK = 'a[href="/explore/people/"]';
  const SUGGEST_TITLE =
    /^(suggested for you|suggestions for you|suggestions pour vous)$/i;
  const EXPLORE_TITLES = /^(pour vous|personnalis[ée]e?s?|for you|personali[sz]ed)$/i;
  const NOT_PERSONALIZED = /non[\s-]*personnalis|not[\s-]*personali[sz]/i;

  const FOOTER_LINKS = [
    'a[href*="about.meta.com"]',
    'a[href*="help.instagram.com"]',
    'a[href*="privacycenter.instagram.com"]',
    'a[href*="developers.facebook.com"]',
    'a[href^="/about/"]',
    'a[href^="/legal/"]',
    'a[href*="instagram.com/legal/"]',
    'a[href^="/explore/locations/"]',
  ].join(",");

  // Éléments masqués selon la page (rétablis quand on change de page).
  const routeHidden = new Set();

  function hide(el, perRoute) {
    el.setAttribute("data-isf", "");
    el.style.setProperty("display", "none", "important");
    if (perRoute) routeHidden.add(el);
  }

  function show(el) {
    el.removeAttribute("data-isf");
    el.style.removeProperty("display");
    routeHidden.delete(el);
  }

  // ---------- 2. Colonne de droite hors de <main> ----------
  // Compte et suggestions de profils sont normalement dans <main> (donc déjà
  // masqués par le CSS). Si Instagram les place en dehors, on masque la colonne
  // entière, c'est-à-dire le plus grand conteneur qui n'englobe ni <main> ni
  // la barre latérale gauche.
  function hideRightColumn() {
    const main = document.querySelector("main");
    const anchors = [...document.querySelectorAll(SUGGEST_LINK)];

    if (ticks % 5 === 0) {
      for (const t of document.querySelectorAll("span, h2, h3")) {
        if (t.children.length === 0 && SUGGEST_TITLE.test(t.textContent.trim())) {
          anchors.push(t);
        }
      }
    }

    for (const anchor of anchors) {
      if (main && main.contains(anchor)) continue;

      let el = anchor;
      while (el.parentElement && el.parentElement !== document.body) {
        const p = el.parentElement;
        if ((main && p.contains(main)) || p.querySelector('nav, [role="navigation"]')) {
          break;
        }
        el = p;
      }
      if (el !== document.body && !el.hasAttribute("data-isf")) hide(el, true);
    }
  }

  // ---------- 3. Explorer / Recherche ----------
  // Grille masquée (barre de recherche conservée), roue de chargement et
  // titres "Pour vous" / "Personnalisé" / "Non personnalisé" supprimés.
  function hideExplore(main) {
    const tile = main.querySelector('a[href^="/p/"], a[href^="/reel/"]');
    if (tile) {
      let el = tile;
      while (
        el.parentElement &&
        el.parentElement !== main &&
        !el.parentElement.querySelector("input")
      ) {
        el = el.parentElement;
      }
      if (!el.hasAttribute("data-isf")) hide(el, true);
    }

    // Roue de chargement : l'élément (déjà masqué par le CSS) et son conteneur vide.
    for (const spinner of main.querySelectorAll('[role="progressbar"]')) {
      let el = spinner;
      while (
        el.parentElement &&
        el.parentElement !== main &&
        el.parentElement.children.length === 1 &&
        !el.parentElement.querySelector("input")
      ) {
        el = el.parentElement;
      }
      if (!el.hasAttribute("data-isf")) hide(el, true);
    }

    for (const t of main.querySelectorAll("h1, h2, h3, span, div")) {
      if (t.children.length !== 0 || t.hasAttribute("data-isf")) continue;
      if (EXPLORE_TITLES.test(t.textContent.trim())) hide(t, true);
    }

    // "Non personnalisé" : uniquement dans le corps de la page (<main>), jamais
    // dans la barre latérale ni dans une fenêtre. On cherche le texte lui-même,
    // même s'il est mêlé à d'autres éléments (lien "En savoir plus"…), puis on
    // masque le plus petit bloc qui ne contient que cette mention.
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    for (let node; (node = walker.nextNode()); ) {
      if (node.nodeValue.length >= 120 || !NOT_PERSONALIZED.test(node.nodeValue)) continue;
      let el = node.parentElement;
      if (!el || el.hasAttribute("data-isf") || el.closest('[role="dialog"]')) continue;
      while (
        el.parentElement &&
        el.parentElement !== main &&
        el.parentElement.textContent.trim().length < 120 &&
        !el.parentElement.querySelector('input, a[href^="/p/"], a[href^="/reel/"]')
      ) {
        el = el.parentElement;
      }
      hide(el, true);
    }
  }

  // ---------- 4. Entrée "Reels" des menus ----------
  function hideReelsNav() {
    for (const a of document.querySelectorAll('a[href="/reels/"]')) {
      let el = a;
      while (
        el.parentElement &&
        el.parentElement !== document.body &&
        el.parentElement.querySelectorAll("a[href]").length === 1
      ) {
        el = el.parentElement;
      }
      if (!el.hasAttribute("data-isf")) hide(el, false);
    }
  }

  // ---------- 5. Mentions de bas de page et choix de la langue (toutes les pages) ----------
  // On repère le bloc qui regroupe les liens Meta / À propos / Aide /
  // Confidentialité…, ainsi que le sélecteur de langue, puis on les masque.
  // hide.css masque déjà les liens eux-mêmes sans délai.
  const LANGUAGE_LABEL = /langu|idioma|sprache|lingua/i;
  let lastFooterScan = 0;

  function isLanguageSelect(sel) {
    if (LANGUAGE_LABEL.test(sel.getAttribute("aria-label") || "")) return true;
    const opts = [...sel.options].map((o) => o.textContent.trim());
    return (
      opts.includes("English") &&
      opts.some((o) => /^(Français|Español|Deutsch|Italiano|Português)/.test(o))
    );
  }

  // Plus petit bloc de bas de page contenant l'élément, étendu tant qu'il reste
  // un simple bloc de pied de page.
  function footerBlock(start) {
    let el = start;
    while (el.parentElement && el.parentElement !== document.body) {
      const p = el.parentElement;
      if (
        p.querySelector('main, nav, [role="navigation"], [role="main"], article') ||
        p.querySelectorAll("a[href]").length > 14
      ) {
        break;
      }
      el = p;
    }
    return el;
  }

  function hideFooter() {
    const now = Date.now();
    if (now - lastFooterScan < 300) return;
    lastFooterScan = now;

    const starts = [];

    // Blocs de liens pas encore masqués (il peut y en avoir un nouveau après une navigation).
    const links = [...document.querySelectorAll(FOOTER_LINKS)].filter(
      (l) => !l.closest("[data-isf]")
    );
    if (links.length >= 3) {
      let el = links[0];
      while (
        el.parentElement &&
        el.parentElement !== document.body &&
        el.querySelectorAll(FOOTER_LINKS).length < 3
      ) {
        el = el.parentElement;
      }
      starts.push(el);
    }

    // Sélecteur de langue (jamais dans le contenu de la page ni dans le menu).
    for (const sel of document.querySelectorAll("select")) {
      if (sel.closest("[data-isf], main, nav, [role='main']")) continue;
      if (isLanguageSelect(sel)) starts.push(sel);
    }

    for (const start of starts) {
      if (start === document.body) continue;
      const block = footerBlock(start);
      if (block !== document.body && !block.hasAttribute("data-isf")) hide(block, false);
    }
  }

  // ---------- Boucle ----------
  let ticks = 0;
  let lastPath = null;

  function tick() {
    if (leaveReels()) return;
    ticks++;
    updateFlags();

    // Instagram est une application monopage : à chaque changement de page,
    // on rétablit ce qui avait été masqué pour l'ancienne page.
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      for (const el of [...routeHidden]) show(el);
    }

    if (isHome()) hideRightColumn();
    if (isExplore()) {
      const main = document.querySelector("main");
      if (main) hideExplore(main);
    }
    hideReelsNav();
    hideFooter();
  }

  // Dès qu'Instagram modifie la page, on réagit avant l'affichage suivant
  // (les rappels de MutationObserver passent avant le rendu) : rien ne clignote.
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      tick();
    });
  }).observe(document, { childList: true, subtree: true });

  window.addEventListener("popstate", tick);
  setInterval(tick, 1000);
  tick();
})();
