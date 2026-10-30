# No feed

Masque les feeds et distractions de Reddit, YouTube et Instagram.

- **Reddit** : feeds (accueil, Popular, All, News, subreddits généralistes), suggestions de recherche, boutons « Créer un post », « Advertise » et chat, barre latérale gauche.
- **YouTube** : feed de l'accueil, barre latérale gauche, Shorts.
- **Instagram** : accueil vide (feed, stories, compte et suggestions de profils masqués), grille Explorer masquée (recherche conservée, sans roue de chargement ni titres « Pour vous », « Personnalisé » et « Non personnalisé »), entrée et page Reels supprimées, mentions de bas de page (Meta, À propos…) et choix de la langue masqués sur toutes les pages.

Le code de l'extension est dans `extension/`.

## Publier une version

```
git tag v1.0.1 && git push --tags
```

Le workflow `.github/workflows/release.yml` fixe la version d'après le tag, fait signer l'extension par Mozilla (canal non répertorié), publie le `.xpi` dans une Release et met à jour `updates.json`, que Firefox consulte pour les mises à jour automatiques.

## Mettre à jour la fiche publique AMO

```
git tag amo-v1.0.0 && git push --tags
```

Le workflow `.github/workflows/publish-amo.yml` construit l'extension sans `update_url`, avec la version du tag, et la soumet à la fiche publique sur addons.mozilla.org. Elle passe ensuite par la relecture de Mozilla. Le numéro de version doit être nouveau (différent de tout tag `v*`). Sans automatisation, `scripts/build-amo.sh` produit le zip à déposer à la main.

Secrets requis dans le dépôt : `AMO_JWT_ISSUER` et `AMO_JWT_SECRET` (clés d'API de addons.mozilla.org).
