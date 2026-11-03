# Architecture

Vue d'ensemble du dépôt. **Évolution prévue : `ARCHITECTURE-CIBLE.md`** (noyau à modules : état unique, commandes, événements). Détails : `PRD.md` (vision et jalons), `COMBAT.md`, `CREATION.md`, `MONDES.md`, `M2-IMAGES.md`, `SRD-INVENTAIRE.md`, `JOURNAL.md` (historique).

## Principe

**Le LLM propose, le moteur décide.** Les règles, les dés, l'état du jeu et les conditions de monde sont du code déterministe et testé ; le MJ (Claude, à venir en M4) raconte, joue les PNJ et choisit parmi des outils validés par le moteur. Aucun LLM ne modifie l'état directement.

## Le dépôt

| Dossier | Rôle |
| --- | --- |
| `packages/regles/src/noyau`, `src/modules` | **Noyau** (partie unique et versionnée, commandes, événements, modules ; `ARCHITECTURE-CIBLE.md`) et modules livrés (Exploration, Dialogue) |
| `packages/regles` | Moteur en TypeScript pur (aucune dépendance graphique ni réseau) : fiches de personnage, **combat** (`src/combat` : grille, tours, cartes, sorts, IA par simulation), **création** (`src/creation` : exigences, recommandations, groupe), **monde** (`src/monde` : schémas, état de partie, conditions et effets, validation) |
| `packages/donnees/srd` | Données du SRD 5.2.1 français en JSON : classes, espèces, historiques, dons, armes, armures, 181 sorts, 30 monstres, 446 objets, choix de création |
| `packages/donnees/visuel` | Charte graphique et fiches visuelles des héros, noms, galerie de portraits |
| `packages/mondes/<id>` | Les mondes (histoires jouables) : un dossier de JSON par monde, avec son canon (`BIBLE.md`) |
| `apps/jeu` | Client web (Vite + React) : accueil, créateur de personnage, groupe, combat de cartes animé |
| `outils` | Scripts : `pnpm simuler` (équilibre du combat), `pnpm images` (comparaison de services d'images via OpenRouter), `pnpm monde` (valider, générer le document, créer un monde) |
| `.claude/skills/creer-monde` | Skill qui guide la création d'un nouveau monde |
| `sources/` | PDF du SRD et texte extrait (non versionnés) |

## Flux des données

```
SRD (JSON) ──► regles ──► fiches, combat, création ──► apps/jeu
mondes/<id> ──► regles/monde (validation, état, quêtes) ──► (MJ, M4) ──► apps/jeu
charte + portraits ──► outils/images ──► illustrations (M2, M4)
```

## Dans l'ordre d'apparition

M0 règles et données · M1 combat de cartes · M3a créateur et groupe · Mondes (format, Val des Cendres) · à venir : M2 images, M4 MJ (récit illustré, arbitre, PNJ qui parlent, serveur et clé Anthropic).

## Conventions

- Tests : `pnpm test` (Vitest) ; types : `pnpm typecheck` ; un monde publié doit valider sans erreur (`pnpm monde valider`).
- Documentation tenue au fil du travail : `JOURNAL.md` (un paragraphe par étape), `PRD.md` (décisions et jalons), un document par sous-système.
- Données du SRD : extraites avec recoupement de deux sorties du PDF ; attribution CC-BY-4.0 dans le README et les crédits du jeu.
- Aucune clé API dans le dépôt : `.env` (ignoré par git) ; le dossier `sorties/` (images générées) aussi.
