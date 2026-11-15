# Assets venus de RPGSEB (15/11/2026)

Demande de l'utilisateur : « ajoute ses assets dans notre base d'assets pour de futures aventures ». Source : `C:\Users\sebas\Documents\GitHub\RPGSEB\public\assets` (125 fichiers, 17 Mo), copiés ici le 15/11/2026.

**Origine et licence** : images générées avec le même pipeline que celui de ce dépôt (FLUX 3 Image Klein via OpenRouter, charte visuelle alignée sur `packages/donnees/visuel/charte.json` : voir `catalogue/charte-visuelle.json`), pour le projet personnel de l'utilisateur : aucune contrainte de licence tierce.

**Ce n'est pas encore branché dans le jeu** : rien ici n'est importé par `apps/jeu` (le glob des images communes, `./communs/*/*.webp` dans `mondes.ts`, ne descend pas dans ce dossier), donc ces fichiers ne pèsent pas sur le paquet du jeu tant qu'on ne les utilise pas. Ils ne sont pas non plus dans les tables `pnj-communs.json` et `objets-histoires.json` (leurs tests exigent un monde d'origine) : `pnpm images communs proposer` ne les propose pas encore.

## Contenu (≈ 5 Mo de WebP et de catalogues)

| Dossier | Fichiers | Quoi |
| --- | --- | --- |
| `carte/decor/` | 24 | Décors vus du dessus pour une carte tuilée : arbres (6), châteaux (3), grottes (3), lac, maisons (3), montagne, roches (4), villages (3) |
| `carte/neige/` | 24 | Les mêmes décors en version enneigée (région arctique) |
| `carte/groupe/` | 2 + `autres/` (6) | Jeton du groupe sur la carte (`groupe`, `groupe-lueur`) et ses variantes (bannière, campement, colonne, marche) |
| `interface/emplacements/` | 10 | Emplacements d'équipement (anneau, armes, cou, jambes, main gauche…) |
| `interface/fonds/` | 1 | Fond de panneau |
| `interface/monnaies/` | 3 | Pièces de cuivre, d'argent et d'or |
| `interface/onglets/` | 6 | Icônes d'onglets (carte, compétences, inventaire, options, personnage, quêtes) |
| `interface/rarete/` | 5 | Cadres de rareté, du commun au légendaire |
| `objets/icones/` | 28 | Icônes d'armes (12), d'armures (11) et d'objets (5 : épée, bouclier, parchemin, potion, potion de mana) |
| `personnages/portraits/` | 16 | Portraits de figurants humains : 8 hommes et 8 femmes, carnations variées (`catalogue/portraits.json`) |

## Ce qui a changé à la copie

- **PNG → WebP** pour les 56 images de `carte/` (15,3 Mo → 3,6 Mo, qualité 92) : mêmes noms, mêmes dimensions, transparence gardée (contrôlé image par image). Les 69 autres étaient déjà en WebP et sont copiées telles quelles.
- Les chemins `image` des catalogues sont **relatifs à ce dossier** (`carte/decor/arbre-chene.webp` au lieu de `assets/carte/decor/arbre-chene.png`). Aucune image citée ne manque.

## Les catalogues (`catalogue/`)

- `decor.json` : pour chaque décor, `taille` (en cases), `ancre`, `bloquant` (cases bloquantes, relatives au coin haut-gauche), `entree` (la case d'où l'on entre dans un lieu, ou `null`), `action` (ce qu'on y déclenche) et `terrains` (où le poser : `forest`, `plain`, `hill`, `mountain`…). Les variantes enneigées sont des entrées à part (`…-neige`). `decors.md` en est la table lisible.
- `interface.json`, `icones.json`, `portraits.json` : id, image, dimensions (et nom, sexe, carnation, âge pour les portraits).
- `charte-visuelle.json` : le style et les contraintes des prompts de RPGSEB (modèle, ratio, coût ≈ 0,009 $ l'image). Les décors de carte et le jeton n'étaient pas encore réalignés sur la charte à la date de la copie.

## Pour s'en servir plus tard

- **Carte tuilée / déplacement libre** (étude de la session « déplacement ») : `carte/` et `decor.json` sont faits pour cela ; le moteur d'origine est dans `RPGSEB/src/engine/` (`world.ts` : `DECORS`, `lieuA`, `construireBlocage`).
- **Figurants** : les 16 portraits sont des visages génériques ; pour les proposer comme les 157 portraits de PNJ de la bibliothèque commune, il faudrait accepter une origine externe dans `pnj-communs.json` (aujourd'hui chaque entrée pointe vers un PNJ d'un monde, ce que `communs.test.ts` vérifie) et dans `pnpm images communs extraire`.
- **Interface** : les emplacements, monnaies et cadres de rareté peuvent compléter `apps/jeu/src/interface/` ; vérifier le style avant de les mélanger à l'existant.
- Les icônes d'armes et d'armures **doublent** en partie les 529 images d'équipement du SRD (`apps/jeu/src/equipement/`) : à ne garder que si leur style plaît mieux.
