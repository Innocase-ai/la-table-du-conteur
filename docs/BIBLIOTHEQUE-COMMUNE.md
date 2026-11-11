# Bibliothèque commune : portraits, objets et salutations des histoires, réutilisables

> 11/11/2026, demande de l'utilisateur : « récupérer un maximum d'assets des autres aventures et les mettre dans les tables communes ». Choix : **portraits de PNJ, objets propres aux histoires, voix et salutations** ; usage **par référence** (les fichiers vivent une fois, dans le moteur) ; **tout est repris, étiqueté et signalé** (le catalogue propose d'abord les génériques).

## Ce qui est commun aujourd'hui

| Asset | Où | Combien |
| --- | --- | --- |
| Portraits de héros du créateur | `apps/jeu/src/portraits/` (`galerie.json`) | 54 |
| Bestiaire (monstres du SRD) | `apps/jeu/src/bestiaire/` | un par profil |
| Équipement et objets du SRD | `apps/jeu/src/equipement/` | 433 |
| Terrains, interface | `apps/jeu/src/terrains/`, `interface/` | |
| Ouvertures de conversation, répliques de combat, salutations communes | `packages/donnees/repliques/`, `apps/jeu/src/voix/` | 648 prises pour les salutations |
| **Portraits de PNJ des histoires** | `apps/jeu/src/communs/pnj/` + `packages/donnees/visuel/pnj-communs.json` | **157** |
| **Images d'objets propres aux histoires** | `apps/jeu/src/communs/objets/` + `objets-histoires.json` | **180** |
| **Salutations propres déjà dites** | `packages/donnees/visuel/salutations-reprises.json` (fichiers voisés : `apps/jeu/src/voix/dialogues/`) | **57** |

## Les tables

Écrites par `pnpm images communs extraire` (relançable : elle relit tous les mondes) ; schémas et recherche dans `packages/regles/src/monde/communs.ts`.

- **`pnj-communs.json`** : par portrait, son origine (monde, PNJ), `espece` normalisée (texte libre des fiches → `humain`, `nain`…, sinon `autre`), `sexe`, `age` et `tranche` (`enfant`, `jeune`, `adulte`, `mur`, `age`, `inconnu`), `metiers` (aubergiste, marchand, forgeron, garde, pretre, erudit, voleur, noble, paysan, pecheur, mineur, chasseur, artiste, guerisseur, enfant, monstre : reconnus dans le titre et le rôle), `apparence`, et `categorie` : **`principal`** (donneur de quête, ≥ 8 sujets ou ≥ 3 secrets : un personnage reconnaissable de son histoire) ou **`secondaire`** (un visage utilisable ailleurs).
- **`objets-histoires.json`** : par image, origine, catégorie et rareté de l'objet, et `categorie` : **`intrigue`** (objet de quête, clé, relique légendaire : propre à son enquête) ou **`generique`**. Les objets déjà dans le catalogue SRD sont exclus.
- **`salutations-reprises.json`** : les salutations propres (neutre, amicale, hostile) déjà voisées, avec la **voix** qui les a dites, la clé du fichier et `generique` (sans nom propre ni chiffre, ≤ 30 mots). Un PNJ de la **même voix** peut reprendre une ligne générique ; c'est limité (une voix par PNJ, déterminée par son identifiant), la bibliothèque `salutations.commune` (6 registres × 12 voix) reste le moyen principal de ne pas refaire de voix.

## Utiliser un asset commun dans une histoire

Une entrée du manifeste (`packages/mondes/<monde>/images/manifeste.json`) peut citer un asset commun au lieu d'un fichier :

```json
{ "pnj": { "perrin-le-garde": "commun:pnj/hilaire-le-metayer" }, "objets": { "chope": "commun:objets/chope-inepuisable" } }
```

Le client résout la référence (`apps/jeu/src/mondes.ts`, `urlImage`), `pnpm monde manque` la compte comme une image, le schéma l'accepte pour `pnj` et `objets` seulement, et `verifierImages` signale une référence inconnue. L'installateur d'images (`installer.py monde`) **garde** les références existantes.

```bash
pnpm images communs extraire                       # (re)construit les tables et copie les images
pnpm images communs proposer <monde>               # pour chaque PNJ / objet sans image : les 3 assets communs les plus proches (espèce, sexe, âge, métier)
pnpm images communs proposer <monde> --appliquer   # écrit au manifeste la meilleure proposition (score ≥ 60 pour un PNJ, ≥ 80 pour un objet ; jamais pour un objet de quête ou une clé)
```

Avant de **générer** un portrait ou une image d'objet pour une nouvelle histoire, lancer `proposer` : un visage secondaire déjà fait coûte 0 $.

## À savoir

- Les images sont **copiées** (≈ 9,7 Mo) : les mondes d'origine gardent les leurs. Pour dédoubler plus tard, remplacer l'entrée du manifeste d'origine par `commun:…` et supprimer le fichier.
- Un portrait `principal` est reconnaissable (un borgne, un chef gobelin) : à éviter pour un figurant. L'`apparence` de chaque entrée dit ce qu'on y voit.
- Les images de **lieux** (321) et les **voix de scènes** (narration propre à chaque histoire) ne sont pas dans la bibliothèque : décision de l'utilisateur du 11/11/2026 (portraits, objets, salutations seulement).
