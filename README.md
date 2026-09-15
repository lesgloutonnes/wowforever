# WoW Forever Talents

Simulateur de talents pour *World of Warcraft: Forever*, calqué sur l’expérience d’un calculateur classique à trois arbres.

## Ouvrir sans serveur

Double-cliquez sur **`app/index.html`**. Aucun `npm`, aucun localhost : le fichier s’ouvre dans le navigateur.

Vous pouvez aussi copier tout le dossier `app/` (HTML + `icons/` + `bg/`) ailleurs ; gardez ces trois éléments ensemble.

Si vous ouvrez `index.html` à la racine du projet en `file://`, il redirige vers `app/index.html`.

## Développement (optionnel)

```bash
npm install
npm test
npm run dev
```

`npm run build` régénère le dossier `app/` (HTML autonome, JS/CSS intégrés).

## Données

Les arbres et tooltips proviennent de [talentsforever.com](https://talentsforever.com) (CC BY 4.0), transcrits depuis la démo BlizzCon 2026. Les noms, icônes et textes appartiennent à Blizzard Entertainment. Fan-made, non affilié à Blizzard.
