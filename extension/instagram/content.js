(() => {
  "use strict";

  const html = document.documentElement;

  const isHome = () => location.pathname === "/";
  // Page Explorer et page Recherche.
  const isExplore = () => /^\/explore\/(?:search\/?)?$/.test(location.pathname);
  const isReels = () => /^\/reels(?:\/|$)/.test(location.pathname);
  const isDirect = () => /^\/direct(?:\/|$)/.test(location.pathname);

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
  const THREAD_LINK = 'a[href^="/direct/t/"]';
  const SUGGEST_TITLE =
    /^(suggested for you|suggestions for you|suggestions pour vous)$/i;
  const EXPLORE_TITLES = /^(pour vous|personnalis[ée]e?s?|for you|personali[sz]ed)$/i;
  const NOT_PERSONALIZED = /non[\s-]*personnalis|not[\s-]*personali[sz]/i;
  const NOTES_LABEL =
    /^(notes?|votre note|your note|ajouter une note|add (?:a )?note|laisser une note|leave a note|note(?:\.{3}|…))$/i;

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
      const text = t.textContent.trim();
      if (EXPLORE_TITLES.test(text) || (text.length < 80 && NOT_PERSONALIZED.test(text))) {
        hide(t, true);
      }
    }
  }

  // ---------- 4. Messagerie : section "Notes" de la colonne des conversations ----------
  // On repère le libellé, puis on masque le bloc situé au-dessus de la liste des
  // conversations. Si la liste arrive après coup à l'intérieur de ce qu'on a
  // masqué, on rétablit et on recalcule.
  let notesBlock = null;

  function hideDirectNotes() {
    if (notesBlock && notesBlock.querySelector(THREAD_LINK)) {
      show(notesBlock);
      notesBlock = null;
    }
    if (notesBlock && notesBlock.isConnected) return;
    notesBlock = null;

    const candidates = document.querySelectorAll("span, h1, h2, h3, div[aria-label], button[aria-label]");
    for (const t of candidates) {
      if (t.closest("nav, [role='navigation']") || t.hasAttribute("data-isf")) continue;
      if (t.children.length !== 0 && !t.hasAttribute("aria-label")) continue;
      const label = (t.getAttribute("aria-label") || t.textContent || "").trim();
      if (!NOTES_LABEL.test(label)) continue;

      let el = t;
      let steps = 0;
      while (el.parentElement && el.parentElement !== document.body && steps < 8) {
        const p = el.parentElement;
        if (
          p.querySelector(THREAD_LINK) ||
          p.matches("main, [role='main']") ||
          p.querySelector("nav, [role='navigation']")
        ) {
          break;
        }
        el = p;
        steps++;
      }
      if (el === document.body || el.matches("main, [role='main']")) continue;
      notesBlock = el;
      hide(el, true);
      return;
    }
  }

  // ---------- 5. Entrée "Reels" des menus ----------
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

  // ---------- 6. Mentions de bas de page (Meta, À propos, Aide, Confidentialité…) ----------
  // Le CSS masque déjà les liens ; on retire aussi le bloc qui les contient
  // (séparateurs, mention "© Instagram from Meta").
  let lastFooterScan = 0;

  function hideFooter() {
    const now = Date.now();
    if (now - lastFooterScan < 300) return;
    lastFooterScan = now;

    const links = document.querySelectorAll(FOOTER_LINKS);
    if (links.length < 3) return;

    // Plus petit conteneur regroupant au moins trois de ces liens...
    let el = links[0];
    while (
      el.parentElement &&
      el.parentElement !== document.body &&
      el.querySelectorAll(FOOTER_LINKS).length < 3
    ) {
      el = el.parentElement;
    }
    // ...étendu tant qu'il reste un simple bloc de bas de page.
    while (el.parentElement && el.parentElement !== document.body) {
      const p = el.parentElement;
      if (
        p.querySelector('main, nav, [role="navigation"], [role="main"], article, input') ||
        p.querySelectorAll("a[href]").length > 14
      ) {
        break;
      }
      el = p;
    }
    if (el !== document.body && !el.hasAttribute("data-isf")) hide(el, false);
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
      notesBlock = null;
    }

    if (isHome()) hideRightColumn();
    if (isExplore()) {
      const main = document.querySelector("main");
      if (main) hideExplore(main);
    }
    if (isDirect()) hideDirectNotes();
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
})();
