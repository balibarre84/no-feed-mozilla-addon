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

  function updateFlags() {
    const path = location.pathname;
    root.toggleAttribute("data-rsf-feed", FEED_PATH.test(path));

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

  // Reddit change de page sans recharger et monte ses composants en différé.
  setInterval(tick, 400);
  document.addEventListener("DOMContentLoaded", tick);
  window.addEventListener("popstate", tick);
})();
