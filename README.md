# WoW Forever Talents

Simulateur de talents pour *World of Warcraft: Forever*, calqué sur l’expérience d’un calculateur classique à trois arbres.

- Neuf classes, 51 points au niveau 60
- Clic pour apprendre, clic droit / Maj+clic pour rembourser
- Portes de ligne (5 points par rangée du même arbre) et prérequis
- Comparaison avec Classic
- Brouillons locaux, builds nommés et liens partageables

## Développement

```bash
npm install
npm test
npm run dev
```

Le calculateur est servi sur `http://localhost:5173`. Les routes `/warrior`, `/mage`, etc. ouvrent directement une classe.

## Données

Les arbres et tooltips proviennent de [talentsforever.com](https://talentsforever.com) (CC BY 4.0), transcrits depuis la démo BlizzCon 2026. Les noms, icônes et textes appartiennent à Blizzard Entertainment. Fan-made, non affilié à Blizzard.

Les rangs absents de la démo restent non vérifiés : aucune valeur n’est inventée.
