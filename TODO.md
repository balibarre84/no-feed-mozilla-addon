# À faire

Travail sur la branche `claude/inspiring-wozniak-7mu4nz` (pas de build sur `main`). Livraison : zip de test via `scripts/build-amo.sh`.

## 1. Reddit : l'accueil apparaît brièvement au lancement d'une recherche

- **Constat** : quand on lance une recherche, la page d'accueil s'affiche un instant. Le feed est bien masqué, mais les menus latéraux et l'en-tête de colonne (« Pour toi » / « Abonné ») sont visibles.
- **Attendu** : rien de la page d'accueil ne doit apparaître pendant la transition vers `/search`.
- **Piste** (`extension/reddit/hide.css`, `content.js`) : la règle `data-rsf-search` ne masque que `shreddit-feed` et `shreddit-gallery-carousel`. Les en-têtes et menus de l'accueil, encore montés pendant la transition, restent visibles. Masquer tout le contenu de la page (`.main-container` / `#main-content`) tant que les résultats de recherche ne sont pas montés, et poser le drapeau dès le lancement de la recherche (soumission du formulaire, clic sur une suggestion) plutôt qu'au changement d'adresse.
- **Fait** : `content.js` pose `data-rsf-wait` sur `<html>` dès Entrée / clic sur une suggestion ou la loupe dans la barre de recherche (écouteurs en capture, via `composedPath()` à cause du shadow DOM), le maintient sur `/search` jusqu'au montage des résultats (repli 1,5 s). `hide.css` masque (`visibility: hidden`) tout le contenu de la page pendant l'attente.
- **Statut** : implémenté, à tester. Les sélecteurs des résultats (`ready`) sont des suppositions : si la page reste vide ~1,5 s, ils sont à ajuster.

## 2. YouTube : placeholders de chargement sur l'accueil

- **Constat** : à l'ouverture de l'accueil, des placeholders (squelettes) de contenu apparaissent puis disparaissent une fois la page chargée.
- **Attendu** : aucun placeholder.
- **Fait** : `content.js` pose `data-ysf-home` sur `<html>` dès le chargement sur l'accueil ; `hide.css` masque `#home-page-skeleton`, `ytd-ghost-grid-renderer`, la grille, le chargement continu et la barre de filtres tant que `ytd-browse` n'a pas son `page-subtype`.
- **Statut** : implémenté, à tester.
