# À faire

Travail sur la branche `claude/inspiring-wozniak-7mu4nz` (pas de build sur `main`). Livraison : zip de test via `scripts/build-amo.sh`.

## 1. Reddit : l'accueil apparaît brièvement au lancement d'une recherche

- **Constat** : quand on lance une recherche, la page d'accueil s'affiche un instant. Le feed est bien masqué, mais les menus latéraux et l'en-tête de colonne (« Pour toi » / « Abonné ») sont visibles.
- **Attendu** : rien de la page d'accueil ne doit apparaître pendant la transition vers `/search`.
- **Piste** (`extension/reddit/hide.css`, `content.js`) : la règle `data-rsf-search` ne masque que `shreddit-feed` et `shreddit-gallery-carousel`. Les en-têtes et menus de l'accueil, encore montés pendant la transition, restent visibles. Masquer tout le contenu de la page (`.main-container` / `#main-content`) tant que les résultats de recherche ne sont pas montés, et poser le drapeau dès le lancement de la recherche (soumission du formulaire, clic sur une suggestion) plutôt qu'au changement d'adresse.
- **Statut** : à faire.
