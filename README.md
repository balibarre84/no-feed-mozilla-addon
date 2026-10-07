# No feed

Masque les feeds et distractions de Reddit, YouTube et Instagram.

- **Reddit** : feeds (accueil, Popular, All, News, subreddits généralistes), suggestions de recherche, boutons « Créer un post », « Advertise » et chat, barre latérale gauche.
- **YouTube** : feed de l'accueil, barre latérale gauche, Shorts.
- **Instagram** : accueil redirigé immédiatement vers la messagerie (avant même le chargement de la page), feed et suggestions de profils masqués, grille Explorer masquée (recherche conservée, sans roue de chargement ni titres « Pour vous » et « Personnalisé »), entrée et page Reels supprimées, mentions de bas de page (Meta, À propos…) masquées.

Le code de l'extension est dans `extension/`.

## Publier une version

```
git tag v1.0.1 && git push --tags
```

Le workflow `.github/workflows/release.yml` fixe la version d'après le tag, fait signer l'extension par Mozilla (canal non répertorié), publie le `.xpi` dans une Release et met à jour `updates.json`, que Firefox consulte pour les mises à jour automatiques.

Secrets requis dans le dépôt : `AMO_JWT_ISSUER` et `AMO_JWT_SECRET` (clés d'API de addons.mozilla.org).
