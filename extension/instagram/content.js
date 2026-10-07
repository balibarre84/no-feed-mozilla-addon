(() => {
  "use strict";

  const html = document.documentElement;

  const isHome = () => location.pathname === "/";
  const isExplore = () => /^\/explore\/?$/.test(location.pathname);
  const isReels = () => /^\/reels(?:\/|$)/.test(location.pathname);

  // ---------- 1. Page Reels : on ne l'affiche jamais ----------
  // /reels/… est un fil infini : on renvoie vers l'accueil (dont le feed est masqué).
  // Les liens individuels /reel/ID restent ouverts.
  function leaveReels() {
    if (!isReels()) return false;
    location.replace("/");
    return true;
  }

  if (leaveReels()) return;

  // ---------- Utilitaires ----------
  // Les classes d'Instagram sont générées et changent sans cesse : on se repère
  // à des liens stables (href), jamais aux noms de classes.
  const SUGGEST_LINK = 'a[href="/explore/people/"]';
  const SUGGEST_TITLE =
    /^(suggested for you|suggestions for you|suggestions pour vous)$/i;

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

  // ---------- 2. Accueil : colonne du feed (stories et publications) ----------
  // On masque la colonne qui contient les publications mais pas la colonne de
  // droite (compte, suggestions), qui est traitée à part. Masquer le conteneur
  // entier, et non les seules publications, empêche aussi le défilement infini
  // de continuer à charger des pages invisibles.
  let feedColumn = null;

  function hideHomeFeed(main) {
    const sideLink = main.querySelector(SUGGEST_LINK);

    // La colonne de droite est apparue après coup à l'intérieur de ce qu'on a
    // masqué : on rétablit et on recalcule.
    if (feedColumn && sideLink && feedColumn.contains(sideLink)) {
      show(feedColumn);
      feedColumn = null;
    }
    if (feedColumn && feedColumn.isConnected) return;

    const first = main.querySelector("article");
    if (!first) return;

    let el = first;
    while (el.parentElement && el.parentElement !== main) {
      if (el.parentElement.querySelector(SUGGEST_LINK)) break;
      el = el.parentElement;
    }
    feedColumn = el;
    hide(el, true);
  }

  // ---------- 3. Accueil : barre de propositions de profils (à droite) ----------
  function hideSuggestions() {
    const anchors = [...document.querySelectorAll(SUGGEST_LINK)];

    if (ticks % 5 === 0) {
      // Repli par libellé si le lien "Voir tout" a changé.
      for (const t of document.querySelectorAll("main span, main h2, main h3")) {
        if (t.children.length === 0 && SUGGEST_TITLE.test(t.textContent.trim())) {
          anchors.push(t);
        }
      }
    }

    for (const anchor of anchors) {
      let el = anchor;
      // Plus petit conteneur qui contient aussi les profils suggérés.
      while (
        el.parentElement &&
        el.parentElement !== document.body &&
        el.querySelectorAll('a[href^="/"]').length < 4
      ) {
        el = el.parentElement;
      }
      if (
        el === document.body ||
        el.matches("main, [role='main']") ||
        el.querySelector("article") ||
        el.hasAttribute("data-isf")
      ) {
        continue;
      }
      hide(el, true);
    }
  }

  // ---------- 4. Explorer : grille masquée, barre de recherche conservée ----------
  function hideExploreGrid(main) {
    const tile = main.querySelector('a[href^="/p/"], a[href^="/reel/"]');
    if (!tile) return;

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

  // ---------- Boucle ----------
  let ticks = 0;
  let lastPath = null;

  function tick() {
    if (leaveReels()) return;
    ticks++;

    html.toggleAttribute("data-isf-home", isHome());
    html.toggleAttribute("data-isf-explore", isExplore());

    // Instagram est une application monopage : à chaque changement de page,
    // on rétablit ce qui avait été masqué pour l'ancienne page.
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      for (const el of [...routeHidden]) show(el);
      feedColumn = null;
    }

    const main = document.querySelector("main");
    if (main) {
      if (isHome()) hideHomeFeed(main);
      if (isExplore()) hideExploreGrid(main);
    }
    if (isHome()) hideSuggestions();
    hideReelsNav();
  }

  html.toggleAttribute("data-isf-home", isHome());
  html.toggleAttribute("data-isf-explore", isExplore());

  window.addEventListener("popstate", tick);
  setInterval(tick, 500);
})();
