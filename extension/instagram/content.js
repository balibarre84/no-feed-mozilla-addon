(() => {
  "use strict";

  const html = document.documentElement;
  const INBOX = "/direct/inbox/";

  const isHome = () => location.pathname === "/";
  // Page Explorer et page Recherche.
  const isExplore = () => /^\/explore\/(?:search\/?)?$/.test(location.pathname);
  const isReels = () => /^\/reels(?:\/|$)/.test(location.pathname);

  // ---------- 1. Redirections ----------
  // Reels : fil infini, renvoyé vers la messagerie. Les liens /reel/ID restent ouverts.
  // Accueil : renvoyé vers la messagerie. Au chargement d'une page, background.js
  // s'en charge déjà avant même la requête ; ici on traite le démarrage de
  // secours et surtout la navigation interne (clic sur "Accueil", sur le logo…).
  let lastRedirect = 0;

  function goToInbox() {
    const now = Date.now();
    if (now - lastRedirect < 1500) return;
    lastRedirect = now;

    // Navigation interne instantanée, sans recharger la page, quand le lien existe.
    const link = document.querySelector('a[href="' + INBOX + '"]');
    if (link) {
      link.click();
      setTimeout(() => {
        if (isHome() || isReels()) location.replace(INBOX);
      }, 800);
    } else {
      location.replace(INBOX);
    }
  }

  // ---------- Drapeaux de page ----------
  // Posés immédiatement, avant le premier affichage : hide.css masque alors
  // <main> sans que rien n'apparaisse, même un instant.
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
  const HOME_LABEL = /^(home|accueil)$/i;

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

  // Remonte jusqu'à l'élément de menu qui ne contient que ce lien.
  function hideNavItem(a) {
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
  // titres "Pour vous" / "Personnalisé" supprimés.
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

    for (const t of main.querySelectorAll("h1, h2, h3, span")) {
      if (
        t.children.length === 0 &&
        EXPLORE_TITLES.test(t.textContent.trim()) &&
        !t.hasAttribute("data-isf")
      ) {
        hide(t, true);
      }
    }
  }

  // ---------- 4. Entrées "Reels" et "Accueil" des menus ----------
  function hideNavEntries() {
    for (const a of document.querySelectorAll('a[href="/reels/"]')) hideNavItem(a);

    // "Accueil" : par libellé, sinon tous les liens "/" sauf le premier (le logo).
    const homes = [...document.querySelectorAll('a[href="/"]')];
    const labelled = homes.filter((a) => {
      const svg = a.querySelector("svg[aria-label]");
      const label = (svg && svg.getAttribute("aria-label")) || a.textContent || "";
      return HOME_LABEL.test(label.trim());
    });
    for (const a of labelled.length ? labelled : homes.slice(1)) hideNavItem(a);
  }

  // ---------- 5. Mentions de bas de page (Meta, À propos, Aide, Confidentialité…) ----------
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
    ticks++;
    updateFlags();

    if (isHome() || isReels()) {
      if (isHome()) hideRightColumn(); // le temps de la redirection interne
      goToInbox();
      return;
    }

    // Instagram est une application monopage : à chaque changement de page,
    // on rétablit ce qui avait été masqué pour l'ancienne page.
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      for (const el of [...routeHidden]) show(el);
    }

    if (isExplore()) {
      const main = document.querySelector("main");
      if (main) hideExplore(main);
    }
    hideNavEntries();
    hideFooter();
  }

  // Redirection de secours dès le démarrage (background.js a normalement
  // déjà redirigé avant la requête).
  if (isHome() || isReels()) goToInbox();

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
