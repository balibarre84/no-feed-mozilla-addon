(() => {
  "use strict";

  // Pages entièrement "feed" : accueil (et ses tris), r/popular, r/all, News.
  const FEED_PATH =
    /^\/(?:(?:best|hot|new|top|rising|controversial)\/?)?$|^\/r\/(?:popular|all)(?:\/|$)|^\/news(?:\/|$)/i;

  // Page de liste d'un subreddit (pas un post, pas le wiki, pas la création).
  const SUB_LISTING =
    /^\/r\/([^/]+)\/?(?:(?:best|hot|new|top|rising|controversial)\/?)?$/i;

  const GENERAL_SUBS = new Set(
    (typeof RSF_SUBREDDITS !== "undefined" ? RSF_SUBREDDITS : []).map((s) =>
      s.toLowerCase()
    )
  );

  const root = document.documentElement;

  // Attente d'une recherche : posée dès que l'utilisateur la lance (Entrée,
  // clic sur une suggestion ou la loupe), avant que l'adresse ne change, puis
  // maintenue sur /search jusqu'à ce que les résultats soient montés (ou 1,5 s).
  // Pendant ce temps, hide.css masque tout le contenu de la page : rien de
  // l'accueil (menus, onglets « Pour toi / Abonné ») ne doit apparaître.
  let waitUntil = 0;
  let waitedPath = "";

  function startWait() {
    waitUntil = Date.now() + 3000;
    waitedPath = "";
    root.setAttribute("data-rsf-wait", "");
  }

  function updateWait() {
    const onSearch = /^\/search(?:\/|$)/i.test(location.pathname);
    if (!root.hasAttribute("data-rsf-wait")) {
      // Arrivée directe ou navigation interne vers /search sans interaction.
      if (onSearch && waitedPath !== location.pathname + location.search) {
        waitedPath = location.pathname + location.search;
        waitUntil = Date.now() + 1500;
        root.setAttribute("data-rsf-wait", "");
      }
      return;
    }
    if (onSearch) {
      if (waitedPath !== location.pathname + location.search) {
        waitedPath = location.pathname + location.search;
        waitUntil = Math.min(waitUntil, Date.now() + 1500);
      }
      const ready = document.querySelector(
        '#main-content [data-testid="search-results"], #main-content search-telemetry-tracker, ' +
          '#main-content a[data-testid="post-title"]'
      );
      if (ready) root.removeAttribute("data-rsf-wait");
    }
    if (Date.now() > waitUntil) root.removeAttribute("data-rsf-wait");
  }

  // La recherche vit dans un shadow DOM : les événements composés remontent
  // jusqu'au document avec l'hôte comme cible, on lit donc composedPath().
  const SEARCH_HOST = /^(?:REDDIT-SEARCH-\w+|FACEPLATE-SEARCH-INPUT)$/;

  function fromSearch(e) {
    return e.composedPath().some((n) => n instanceof Element && SEARCH_HOST.test(n.tagName));
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" && fromSearch(e)) startWait();
    },
    true
  );

  document.addEventListener(
    "click",
    (e) => {
      if (!fromSearch(e)) return;
      const hit = e.composedPath().find(
        (n) =>
          n instanceof Element &&
          (/^A$/i.test(n.tagName) && /\/search/i.test(n.getAttribute("href") || "") ||
            (/^BUTTON$/i.test(n.tagName) && n.getAttribute("type") === "submit") ||
            /search-?(?:button|icon)|submit/i.test(n.id || n.getAttribute("aria-label") || ""))
      );
      if (hit) startWait();
    },
    true
  );

  document.addEventListener("submit", (e) => {
    if (fromSearch(e)) startWait();
  }, true);

  function updateFlags() {
    updateWait();
    const path = location.pathname;
    root.toggleAttribute("data-rsf-feed", FEED_PATH.test(path));

    root.toggleAttribute("data-rsf-search", /^\/search(?:\/|$)/i.test(path));

    const m = SUB_LISTING.exec(path);
    root.toggleAttribute(
      "data-rsf-sub",
      !!m && GENERAL_SUBS.has(m[1].toLowerCase())
    );
  }

  // Certains éléments de Reddit vivent dans des shadow DOM que hide.css
  // n'atteint pas : on y réinjecte les règles utiles.
  const SHADOW_HOSTS =
    "reddit-search-large, reddit-search-small, faceplate-search-input, " +
    "reddit-header-large, reddit-header-small, reddit-header-action-items";

  const SHADOW_CSS = `
    #search-dropdown-results-container,
    #section_0_pipeline_1_trending_query,
    #section_0_pipeline_1_trending_query ~ *,
    #reddit-trending-searches-partial-container,
    create-post-entry-point-wrapper,
    #create-post,
    [data-testid="create-post"],
    #header-action-item-advertise-button,
    #header-action-item-chat-button,
    [id*="advertise" i],
    [id*="chat-button" i],
    a[href*="ads.reddit.com"],
    a[href*="chat.reddit.com"],
    a[href*="/chat"],
    faceplate-tracker[noun="advertise"],
    faceplate-tracker[noun="chat"],
    #navbar-menu-button {
      display: none !important;
    }
  `;

  function styleShadowRoot(shadow) {
    if (shadow.querySelector("style[data-rsf]")) return;
    const style = document.createElement("style");
    style.setAttribute("data-rsf", "");
    style.textContent = SHADOW_CSS;
    shadow.appendChild(style);
  }

  // ---------- Suppression réelle (pas seulement masquage) ----------
  // Boutons "Advertise" et "Open chat" : on retire les éléments du DOM,
  // puis les conteneurs devenus vides, pour qu'il ne reste aucune zone cliquable.
  const REMOVE_SELECTORS = [
    "#header-action-item-advertise-button",
    "#header-action-item-chat-button",
    '[id*="advertise" i]',
    '[id*="chat-button" i]',
    'a[href*="ads.reddit.com"]',
    'a[href*="chat.reddit.com"]',
    'header a[href*="/chat"]',
    'faceplate-tracker[noun="advertise"]',
    'faceplate-tracker[noun="chat"]',
    'faceplate-tracker[source="advertise"]',
  ].join(",");

  // Repli par libellé (FR/EN) pour les boutons de la barre supérieure.
  const LABEL_RE = /\bchat\b|advertis|publicit[eé]|annonceur/i;
  const LABEL_TARGETS = 'a[aria-label], button[aria-label], faceplate-tracker[aria-label]';

  const KEEP_TAGS = /^(HTML|BODY|HEADER|NAV|MAIN)$/i;

  function prune(el) {
    let parent = el.parentNode;
    el.remove();
    while (
      parent instanceof Element &&
      !parent.shadowRoot &&
      parent.children.length === 0 &&
      !parent.textContent.trim() &&
      !KEEP_TAGS.test(parent.tagName)
    ) {
      const next = parent.parentNode;
      parent.remove();
      parent = next;
    }
  }

  function purge(scope) {
    for (const el of scope.querySelectorAll(REMOVE_SELECTORS)) prune(el);

    const inTopBar = scope !== document;
    for (const el of scope.querySelectorAll(LABEL_TARGETS)) {
      if (!(inTopBar || el.closest("header, nav"))) continue;
      if (LABEL_RE.test(el.getAttribute("aria-label") || "")) prune(el);
    }
  }

  function scan(scope) {
    for (const host of scope.querySelectorAll(SHADOW_HOSTS)) {
      if (!host.shadowRoot) continue;
      styleShadowRoot(host.shadowRoot);
      purge(host.shadowRoot);
      scan(host.shadowRoot);
    }
  }

  function tick() {
    updateFlags();
    purge(document);
    scan(document);
  }

  // Dès le chargement, pour que rien n'apparaisse à l'écran.
  updateFlags();

  // Reddit change de page sans recharger : on met les drapeaux à jour dès que
  // l'adresse change, avant le rendu suivant, sans attendre le prochain tick.
  let lastPath = location.pathname + location.search;
  new MutationObserver(() => {
    const cur = location.pathname + location.search;
    if (cur === lastPath) return;
    lastPath = cur;
    updateFlags();
  }).observe(document, { childList: true, subtree: true });

  // Reddit monte ses composants en différé.
  setInterval(tick, 400);
  document.addEventListener("DOMContentLoaded", tick);
  window.addEventListener("popstate", tick);
})();
