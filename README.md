# La Table du Conteur

Jeu de rôle narratif illustré, en français, sur les règles du SRD 5.2.1 (Donjons & Dragons 5e, règles libres). Un livre dont vous êtes le héros, avec toute la mécanique de la 5e : de 1 à 6 héros créés par le joueur, des histoires complètes, un combat de cartes tactique sur grille, et un « conteur » animé par une IA.

**Le principe : le conteur propose, le jeu décide.** Les règles, les dés, les combats, les trésors et les conséquences sont du code déterministe et testé ; l'IA raconte et joue les personnages, mais ne modifie jamais l'état du jeu.

> Jeu indépendant, fondé sur le SRD 5.2.1 de Wizards of the Coast. Ce n'est pas un produit officiel de Donjons & Dragons.

Créé de bout en bout par Claude (Anthropic), sous la direction de son auteur.

## Ce que contient le dépôt

| Dossier | Contenu |
| --- | --- |
| `packages/regles` | Moteur de règles en TypeScript pur : fiches de personnage, création, combat de cartes et IA des monstres, exploration, dialogues, quêtes, énigmes |
| `packages/donnees` | Données du SRD 5.2.1 en français (12 classes jusqu'au niveau 20, 9 espèces, 339 sorts, 329 monstres, 502 objets) et charte visuelle |
| `packages/mondes` | Les histoires jouables, un dossier de données par monde (lieux, personnages, rencontres, énigmes, quêtes, fins, images, voix) |
| `apps/jeu` | Le jeu : client web (Vite + React) |
| `apps/atelier` | Atelier d'auteur : vérification des mondes (santé, graphes, parcours) |
| `apps/bureau` | Coquille de bureau (Tauri) |
| `outils` | Scripts en ligne de commande : validation des mondes, simulation d'équilibre, images, voix, sons, musique |
| `site` | Page de présentation du jeu (statique, prête à déployer) |
| `docs` | Conception : vision, combat, création, format des mondes, architecture |

## Démarrer

Prérequis : Node.js 22 ou plus, [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm test          # moteur, données du SRD et mondes
pnpm typecheck
pnpm jeu           # le jeu sur http://localhost:5173
pnpm monde valider # valide les mondes (références, quêtes, énigmes)
```

Le jeu fonctionne sans clé d'API en « mode livre » : textes des auteurs et boutons proposés. Le conteur IA utilise la clé OpenRouter du joueur (voir `.env.example` : copiez-le en `.env`, qui est ignoré par git). Ne publiez jamais une clé.

## Les histoires livrées

- **Le Val des Cendres** : niveaux 1 à 5, environ 30 h.
- **La Citadelle des Marées** : niveaux 1 à 4, environ 16 h.
- **Le Grimoire de Port-Sillage** : niveaux 1 à 3, histoire facile pour 4 héros, environ 6 h.

Le format des mondes est décrit dans `docs/MONDES.md`.

## Crédits

Cette œuvre inclut du matériel issu du System Reference Document 5.2.1 (« SRD 5.2.1 ») de Wizards of the Coast LLC, disponible à l'adresse https://www.dndbeyond.com/srd. Le SRD 5.2.1 est régi par la Licence Creative Commons Attribution 4.0 International, disponible à l'adresse https://creativecommons.org/licenses/by/4.0/legalcode.

Autres crédits : pictogrammes de [game-icons.net](https://game-icons.net) (CC BY 3.0, voir `apps/jeu/src/icones/CREDITS.md`), deux bruitages de Kenney (CC0, voir `apps/jeu/src/sons/CREDITS.md`).

## Licence

- **Code source** : licence MIT (fichier `LICENSE`), Copyright (c) 2026 Sébastien Hanoteaux.
- **Contenus du jeu** (histoires, images, voix, musiques, bruitages, textes du site) : tous droits réservés, sauf les éléments sous licence libre listés dans `LICENSE-CONTENU.md` (SRD 5.2.1 sous CC BY 4.0, pictogrammes sous CC BY 3.0, deux bruitages sous CC0). Ils ne peuvent pas être réutilisés sans l'accord de l'auteur.
