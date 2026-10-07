(() => {
  "use strict";

  // ---------- 1. Pages Shorts : on ne les affiche jamais ----------
  // /shorts/ID  -> lecteur vidéo normal /watch?v=ID
  // /shorts     -> page d'accueil (qui est vide)
  const SHORTS_ID = /^\/shorts\/([\w-]{6,})/i;

  function leaveShorts() {
    const path = location.pathname;
    const m = SHORTS_ID.exec(path);
    if (m) {
      location.replace("/watch?v=" + encodeURIComponent(m[1]));
      return true;
    }
    if (/^\/(?:feed\/)?shorts\/?$/i.test(path)) {
      location.replace("/");
      return true;
    }
    return false;
  }

  if (leaveShorts()) return;

  // ---------- 2. Repli par texte ----------
  // Onglet "Shorts" des chaînes, filtre "Shorts" des recherches, entrées de menu :
  // ces éléments n'ont pas de lien /shorts/ exploitable en CSS, on les repère
  // par leur libellé (le mot "Shorts" n'est pas traduit).
  const TARGETS = [
    "yt-chip-cloud-chip-renderer",
    "yt-tab-shape",
    "tp-yt-paper-tab",
    "ytd-guide-entry-renderer",
    "ytd-mini-guide-entry-renderer",
    "yt-tab-group-shape yt-tab-shape",
  ].join(",");

  function hideShortsLabels() {
    for (const el of document.querySelectorAll(TARGETS)) {
      if (el.hasAttribute("data-ysf")) continue;
      const label = (
        el.getAttribute("tab-title") ||
        el.getAttribute("aria-label") ||
        el.textContent ||
        ""
      ).trim();
      if (/^shorts$/i.test(label)) {
        el.setAttribute("data-ysf", "");
        el.style.setProperty("display", "none", "important");
      }
    }
  }

  // YouTube est une application monopage : on revérifie à chaque navigation
  // interne et régulièrement, car les composants se montent en différé.
  function tick() {
    if (leaveShorts()) return;
    hideShortsLabels();
  }

  document.addEventListener("yt-navigate-start", tick);
  document.addEventListener("yt-navigate-finish", tick);
  window.addEventListener("popstate", tick);
  setInterval(tick, 500);
})();
