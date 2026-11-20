# Bibliothèque commune : portraits, objets et salutations des histoires, réutilisables

> 11/11/2026, demande de l'utilisateur : « récupérer un maximum d'assets des autres aventures et les mettre dans les tables communes ». Choix : **portraits de PNJ, objets propres aux histoires, voix et salutations** ; usage **par référence** (les fichiers vivent une fois, dans le moteur) ; **tout est repris, étiqueté et signalé** (le catalogue propose d'abord les génériques).

## Ce qui est commun aujourd'hui

| Asset | Où | Combien |
| --- | --- | --- |
| Portraits de héros du créateur | `apps/jeu/src/portraits/` (`galerie.json`) | 54 |
| Bestiaire (monstres du SRD) | `apps/jeu/src/bestiaire/` | un par profil |
| Équipement et objets du SRD | `apps/jeu/src/equipement/` | 529 |
| Terrains, interface | `apps/jeu/src/terrains/`, `interface/` | |
| Ouvertures de conversation, répliques de combat, salutations communes | `packages/donnees/repliques/`, `apps/jeu/src/voix/` | 648 prises pour les salutations |
| **Portraits de PNJ des histoires** | `apps/jeu/src/communs/pnj/` + `packages/donnees/visuel/pnj-communs.json` | **157** |
| **Images d'objets propres aux histoires** | `apps/jeu/src/communs/objets/` + `objets-histoires.json` | **180** |
| **Assets de RPGSEB** (décors de carte tuilée, jeton du groupe, interface, icônes d'équipement, 16 portraits de figurants) | `apps/jeu/src/communs/rpgseb/` (voir son `LISEZMOI.md` et `catalogue/`) | **125** (≈ 5 Mo) : pas encore branchés dans le jeu ni dans `proposer` |
| **Réserve de décors** (F8, 20/11/2026 : pièces courantes d'un lieu de départ) | `apps/jeu/src/communs/lieux/` + son `catalogue.json` ; registre : `docs/REGISTRE-DECORS.md` | **31** (10 types, au moins 3 variantes chacun) |
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

## Réserve de décors génériques (F8, 20/11/2026)

Pour qu'un lieu de départ de 10 à 13 pièces ne demande pas dix images neuves à chaque épisode. **Registre à lire avant d'écrire les lieux et à compléter à la fin : `docs/REGISTRE-DECORS.md`** (catalogue, types incomplets, où chaque décor sert).

- **Types** (10) : `taverne`, `chambre`, `sanctuaire`, `maison-du-chef`, `forge`, `marche`, `boutique`, `interieur-modeste`, `cave-ou-grenier`, `place-du-village` ; **3 variantes au moins par type** (limite la répétition visible d'un même décor).
- **Catalogue** : `apps/jeu/src/communs/lieux/catalogue.json` (schéma `TableLieuxCommuns`, `monde/communs.ts`) : par décor, `id`, `type`, `description` (sans nom propre ni personnage), `ambiance`, `interieur`, `origine`. Les **31** décors d'aujourd'hui (2,6 Mo) : 20 images **déjà faites** pour les histoires de départ, **choisies à la main** (rien de nommé, aucun personnage, aucun emblème) et **copiées** (les mondes d'origine gardent les leurs, aucun manifeste existant n'est modifié), et 11 du **lot générique** `decors-generiques-1` (généré le 20/11/2026, 0,063 $).
- **Utiliser** : dans `images/manifeste.json` d'un épisode, `"lieux": { "<id-du-lieu>": "commun:lieux/<id-du-décor>" }`. Le client la résout (`apps/jeu/src/mondes.ts`, aussi pour la couverture d'une histoire), `pnpm monde manque` la compte comme une image, une référence inconnue est un **manque**, `verifierImages` la signale. Un manifeste qui n'en cite aucune est inchangé (P1, P2).
- **Ce qui reste propre à l'épisode** : l'image du hub, les lieux de quête, les sites de boss, tout lieu mémorable, les cartes, les voix de scènes.
- **Compléter la réserve** : ajouter les entrées (id, type, description, ambiance, `interieur`, `prompt`) à `packages/donnees/visuel/lieux-communs-a-generer.json` ; `pnpm images decors` (**simulation par défaut, coût annoncé**, payant seulement avec `--go`, **après accord**) génère dans `sorties/images/decors/` (le service renvoie parfois du JPEG sous une extension `.png` ; sans Python, `ffmpeg -i x.jpg -vf scale=960:-2 -c:v libwebp -quality 80 <id>.webp` fait l'installation que `installer.py decors` fait avec Pillow) ; puis inscrire au `catalogue.json` (`origine: { "lot": "<nom du lot>" }`) et lancer `pnpm images communs registre`. Le lot `decors-generiques-1` (11 images : 3 chambres, 1 forge, 2 marchés, 2 boutiques, 1 intérieur modeste, 1 grenier, 1 place) a été généré et installé : il a comblé les 7 types qui n'avaient pas leurs 3 variantes. Un lot de 30 images (3 de plus par type) coûterait ≈ 0,27 $ (annoncé à 0,009 $ l'image ; la dépense réelle du compteur de la clé a été de 0,006 $ l'image).
- **Registre** : `pnpm images communs registre` réécrit **la partie générée** de `docs/REGISTRE-DECORS.md` (catalogue, types incomplets, usages d'après les manifestes) et laisse la partie écrite (règles d'usage, lieux déjà vus) intacte ; le test le régénère à l'identique.

## À savoir

- Les images sont **copiées** (≈ 9,7 Mo) : les mondes d'origine gardent les leurs. Pour dédoubler plus tard, remplacer l'entrée du manifeste d'origine par `commun:…` et supprimer le fichier.
- Un portrait `principal` est reconnaissable (un borgne, un chef gobelin) : à éviter pour un figurant. L'`apparence` de chaque entrée dit ce qu'on y voit.
- Les **voix de scènes** (narration propre à chaque histoire), les **cartes** et les **lieux de quête, de boss ou mémorables** ne sont pas dans la bibliothèque. Les images de lieux n'y étaient pas non plus (décision du 11/11/2026) ; **F8 (20/11/2026) ajoute seulement une réserve de décors génériques** pour les pièces courantes d'un lieu de départ, voir plus bas : ce n'est pas un classement des 321 images de lieux.
