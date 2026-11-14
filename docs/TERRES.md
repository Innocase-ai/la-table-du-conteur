# Les terres : se promener entre les lieux

`packages/terres` (`@crpg/terres`) est un **moteur de carte à déplacement libre**, pur et sans dépendance, **séparé du moteur de jeu**. Il génère une carte tuilée à partir de ce que l'auteur a déjà écrit (les lieux, leurs positions, les durées de trajet), puis fait marcher un groupe dessus : temps qui passe, brouillard, repères visibles de loin, points d'intérêt, rencontres tirées au hasard. Il ne connaît ni les règles, ni les monstres, ni les quêtes : il **signale** (« une rencontre de ce type », « un point d'intérêt atteint ») et s'arrête ; c'est le moteur de jeu qui prend la main.

Étude d'origine (14/11/2026) : approche B, « carte tuilée dérivée des lieux écrits » ; RPGSEB (`C:\Users\sebas\Documents\GitHub\RPGSEB`, `src/engine`) en a fourni le bruit fractal, le brouillard, les coûts de terrain et l'idée de la carte tuilée.

## Essayer

```bash
pnpm exec vitest run packages/terres      # 51 tests : génération, chemins, vision, voyage, rencontres, sauvegarde
node apps/jeu/node_modules/vite/bin/vite.js packages/terres/demo --port 5195
```

La démo (`packages/terres/demo/`) est le Carrefour d'Aldric de La Marche d'Ombrefiel (positions et durées réelles). Clic sur une case : le groupe y va ; flèches ou ZQSD : un pas ; « Camper », « Dormir » ; boutons Sauver / Charger ; case « Fidèle » : cherche une graine dont les routes respectent les durées écrites. Les rencontres et les événements des points d'intérêt y sont **simulés en texte**.

## Ce que fait le moteur

| Fichier | Rôle |
| --- | --- |
| `generation.ts` | `genererCarte(def)` : relief, zones dégagées autour des lieux, décors bloquants, routes creusées (gué si l'eau coupe), points d'intérêt, vérification que tout est joignable. `rapportDurees` compare la durée de chaque route à celle de l'auteur, `chercherGraine` trouve une graine fidèle. |
| `disposition.ts` | Place les lieux : positions peintes (pourcentages) puis ressorts pour respecter les durées écrites (elles ne s'accordent pas : 209 à 454 px/h dans la Marche). |
| `voyage.ts` | `creerVoyage`, `planifier` (A*, le groupe ne connaît que ce qu'il a vu), `deplacer`, `marcher`, `camper` : pures, déterministes, elles rendent un nouvel état et des **événements**. |
| `rencontres.ts` | Une vérification toutes les 30 minutes de marche ; probabilité selon terrain, route, heure, danger de la région, proximité d'un lieu ; tirage d'une ligne de la table. |
| `vision.ts` | Vision en losange (hauteur, nuit, vision dans le noir), repères lointains avec ligne de vue (les montagnes cachent), exploration. |
| `sauvegarde.ts` | État du groupe en JSON versionné : cases explorées en bits (base64), compteur de hasard ; refuse une carte qui aurait changé. |
| `ambiance.ts` | Phrases de présence (terrain, moment, signes), sans toucher au hasard du voyage. |
| `terrain.ts`, `biomes.ts`, `poi.ts`, `chemin.ts`, `camera.ts`, `rng.ts` | Coûts (plaine 5 min, forêt 10, colline 10, marais 15, montagne 20, route 3), biomes, 11 types de points d'intérêt, A* à tas, caméra, hasard. |

**Déterminisme** : la carte vient d'une graine fixée par l'auteur (même carte pour tous, générée à l'identique) ; tout le hasard du voyage tient dans `etat.graine` + `etat.tirages` (sauvegardés), donc une partie rechargée tire les mêmes rencontres. `VERSION_GENERATEUR` doit être incrémentée à tout changement d'algorithme qui modifie les cartes.

## Brancher le moteur de jeu (à faire, pas fait)

Rien du jeu n'est modifié. Le branchement prévu, dans l'ordre :

1. **Module `terres`** dans `packages/regles/src/modules/` (dépendance `@crpg/terres: workspace:*` + `pnpm install`, ajout à `MODULES_STANDARD`). Données du monde dans un dossier `terres/` (`dm.extensions`) : définition de la carte par lieu conteneur (`DefTerres` : graine, taille, biome, ancres = lieux enfants avec `Lieu.position`, liens = `Lieu.liens[].heures`), table de rencontres de la région.
2. **État** : `partie.modules.terres = serialiserVoyage(etat)` ; sauvegarde version 4 (migration additive, rien pour les anciennes parties). Pas d'événement du journal par case : événements agrégés (`voyageDebut`, `rencontreEnRoute`, `voyageFin`).
3. **Scène** : nouvelle variante `{ type: 'voyage' }` de `Scene` (`noyau/types.ts`) ; `etat.lieu` reste le dernier lieu connu (invariant « un lieu valide »). Adapter `libre` / `enExploration` (`modules/commun.ts`).
4. **Commandes** : « Partir à pied » (depuis une ancre), `deplacer` / `marcher` (hors conteur), `voyager { vers }` (pour le conteur, de haut niveau), `camper`, `entrerLieu` (même chemin que `aller` sans les heures, via `sortiesDe` : portes écrites, passages cachés et conditions restent respectés).
5. **Temps** : `minutesDepuisHorloge` / `horlogeDepuisMinutes` ; `etat.heure` fractionnaire ou `etat.minute` ; les passages de minuit passent par `avancerHeures` (jauges et événements « jour »). `camper` s'appuie sur la logique de `seReposer` (à en extraire) : nuit interrompue, repos court ou long.
6. **Rencontres** : la ligne tirée (`entree.genre`, `tags`) devient un combat via `composerRencontre` (budget de PX pour 4 ou 6 héros) ou une rencontre écrite répétable ; la rencontre composée est **persistée dans l'état** (`etat.exploration.errante`) avec une indirection `rencontreParId`, car `issueRencontre` et `reglerRencontre` lisent `dm.rencontres`. Le plateau vient de `voisinage(carte, groupe, …)` (phase 3 de `docs/PLATEAUX.md`). Politique de PX/butin des rencontres errantes (pas de farm) : décision à prendre.
7. **Conteur** : bloc `terres` dans `FicheScene` (terrain, repères, direction et distance des lieux connus) ; ses outils : seulement `voyager`.
8. **Quêtes** : `lieuxObjectifs` marque déjà les lieux ◆ ; en afficher une direction sur la carte.
9. **Client** : un écran `EcranTerres` (la démo en est le brouillon : canvas, caméra `fenetre`, mini-carte) avec les textures de combat et `Reliefs.tsx` plutôt que les couleurs de la démo.

## Reste à décider (avec l'utilisateur)

Périmètre (une région, toutes les régions, un grand monde), voyage rapide conservé ou non, lieux visibles d'avance ou à découvrir, fréquence et part de rencontres non violentes, pression du temps sur les jauges, camper dehors, monstres visibles ou invisibles, direction artistique, écriture de la carte (graine, à la main, mixte), commandes (flèches, clic).
