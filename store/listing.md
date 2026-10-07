# Fiche addons.mozilla.org — No feed

## Informations générales
- **Nom** : No feed
- **Identifiant d'URL (slug)** : no-feed (à adapter s'il est déjà pris)
- **Catégories** (2 maximum) : Social & Communication, Appearance
- **Étiquettes** : focus, distractions, feed, reddit, youtube, instagram, shorts, reels, productivity
- **Licence** : MIT (à choisir selon ton souhait ; le dépôt GitHub est public)
- **Site d'assistance** : https://github.com/balibarre84/no-feed-mozilla-addon
- **Politique de confidentialité** : non requise (aucune donnée n'est collectée ni transmise)

---

## Résumé (250 caractères maximum)

**Français** (210 caractères)
Masque les feeds et distractions de Reddit, YouTube et Instagram : fils d'accueil, suggestions de recherche, Shorts, Reels, barres latérales et boutons superflus. Aucune donnée collectée, aucune requête réseau.

**English** (189 characters)
Hides the feeds and distractions of Reddit, YouTube and Instagram: home feeds, search suggestions, Shorts, Reels, sidebars and extra buttons. Collects no data and makes no network requests.

---

## Description — Français

No feed supprime les fils sans fin et les distractions de Reddit, YouTube et Instagram, pour que tu ne voies que ce que tu es venu chercher.

REDDIT
- Masque le fil de l'accueil, de Popular, d'All et de News, ainsi que celui d'une liste de subreddits généralistes (modifiable dans le fichier subreddits.js).
- Supprime les suggestions et tendances de la barre de recherche.
- Retire les boutons « Créer un post », « Advertise » et chat de la barre supérieure.
- Masque la barre latérale gauche et recentre le contenu.

YOUTUBE
- Masque le fil de la page d'accueil (la barre de recherche reste).
- Masque la barre latérale gauche.
- Supprime tous les Shorts : étagères, résultats de recherche, onglet des chaînes, filtre de recherche, recommandations. Un lien vers un Short ouvre la vidéo dans le lecteur normal.

INSTAGRAM
- Page d'accueil vide : feed, stories, compte et suggestions de profils masqués.
- Page Explorer : grille masquée (la recherche reste), sans roue de chargement ni titres « Pour vous », « Personnalisé » et « Non personnalisé ».
- Reels supprimés : entrée du menu masquée, page redirigée vers l'accueil.
- Mentions de bas de page (Meta, À propos, Aide…) et choix de la langue masqués.

Respect de la vie privée : l'extension ne collecte aucune donnée, n'envoie aucune requête réseau et n'exécute aucun code distant. Ses seules autorisations sont l'accès aux pages de reddit.com, youtube.com et instagram.com, pour masquer des éléments.

Code source ouvert : https://github.com/balibarre84/no-feed-mozilla-addon

No feed n'est affilié ni à Reddit, ni à Google/YouTube, ni à Meta/Instagram. Ces sites modifient leur présentation régulièrement : si un élément réapparaît, signale-le sur la page GitHub.

---

## Description — English

No feed removes the endless feeds and distractions of Reddit, YouTube and Instagram, so you only see what you came for.

REDDIT
- Hides the feed on Home, Popular, All and News, and on a list of general-interest subreddits (editable in subreddits.js).
- Removes search suggestions and trending searches.
- Removes the "Create post", "Advertise" and chat buttons from the top bar.
- Hides the left sidebar and recentres the content.

YOUTUBE
- Hides the home page feed (the search bar stays).
- Hides the left sidebar.
- Removes all Shorts: shelves, search results, the channel tab, the search filter and recommendations. A link to a Short opens the video in the regular player.

INSTAGRAM
- Empty home page: feed, stories, account and suggested profiles hidden.
- Explore page: grid hidden (search stays), with no loading spinner and no "For you", "Personalized" or "Not personalized" headings.
- Reels removed: menu entry hidden, page redirected to the home page.
- Footer links (Meta, About, Help…) and the language selector hidden.

Privacy: the extension collects no data, makes no network requests and runs no remote code. Its only permissions are access to the reddit.com, youtube.com and instagram.com pages, in order to hide elements.

Open source: https://github.com/balibarre84/no-feed-mozilla-addon

No feed is not affiliated with Reddit, Google/YouTube or Meta/Instagram. These sites change their layout regularly: if an element comes back, please report it on the GitHub page.

---

## Notes pour les relecteurs (Notes to reviewer) — à coller en anglais

The extension only injects CSS and small DOM scripts (content scripts) on reddit.com, youtube.com and instagram.com to hide feed elements. There is no background script, no network request, no remote code, no minification and no build step: the uploaded files are the source code (also on GitHub, URL above). No data is collected (data_collection_permissions: none).

To check the behaviour: on reddit.com, the home feed and the left sidebar disappear; on youtube.com the home feed, the left sidebar and all Shorts disappear (opening /shorts/ID redirects to /watch?v=ID); on instagram.com (logged in) the home page content is hidden and /reels/ redirects to the home page. Instagram and Reddit show their full interface only when logged in, so a test account is recommended for these two sites; YouTube can be checked without logging in.

---

## Captures d'écran (à prendre toi-même)
Une capture suffit pour commencer ; trois sont idéales : l'accueil Reddit sans feed, l'accueil YouTube sans feed ni barre latérale, l'accueil Instagram vide.
