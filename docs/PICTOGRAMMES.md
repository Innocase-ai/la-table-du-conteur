# Pictogrammes des cartes

Chaque carte du panneau de droite porte un **médaillon** (à droite) et une **pastille de coût** (à gauche) ; la barre de tour (Action, Bonus, Réaction, Élan) reprend les signes de coût. Tous les dessins sont **originaux**, en SVG, écrits dans `apps/jeu/src/pictogrammes.ts` : pas de fichier image, rien à télécharger, aucune licence à citer.

## Ce qui existe

| Groupe | Clés | Nombre |
| --- | --- | --- |
| Sorts jouables | `sort:<id>` (trait de feu, rayon de givre, poigne électrique, flamme sacrée, projectile magique, bouclier, mains brûlantes, sommeil, soins, mot de guérison, bénédiction, imprécation, rayon traçant, bouclier de la foi, marque du chasseur, rayon ardent, arme spirituelle, aide, immobilisation de personne, restauration partielle) | 20 |
| Écoles de magie (repli d'un sort sans dessin) | `ecole:abjuration`, `conjuration` (le SRD français dit « invocation »), `divination`, `enchantement`, `evocation`, `illusion`, `necromancie`, `transmutation` | 8 |
| Coûts | `cout:action` (rond), `cout:bonus` (triangle), `cout:reaction` (flèche en boucle), `cout:elan` (étincelle), `cout:gratuit` (anneau) | 5 |
| Actions de base | `base:foncer`, `base:desengager`, `base:esquiver`, `base:potion` | 4 |
| Armes | `arme:epee`, `epee-courte`, `rapiere`, `dague`, `hache`, `hachette`, `masse`, `baton`, `arc`, `javeline`, `cimeterre` (une arme lancée reçoit des traînées) | 11 |
| Monstres et aptitudes | `monstre:morsure`, `monstre:attaques-multiples`, `aptitude:rage`, `second-souffle`, `preservation`, `visee-appliquee`, `aptitude:defaut` | 7 |

Inspiration : les écoles de magie du SRD 5.2.1 (chaque sort en porte une, champ `ecole` des données), et les conventions du monde D&D pour l'économie d'actions. Le SRD lui-même ne contient pas d'images.

## Comment ça se lit

- **La couleur** est celle de l'effet : feu orange, froid bleu clair, foudre jaune, radiant or, force violet, soin vert, protection bleu, charme rose, malédiction vert acide, acier gris pour les armes (`TEINTES`). Chaque pictogramme a deux tons : sa teinte vive (`p2`) et un blanc chaud (`p1`), plus une ombre (`p3`) ; `t1`/`t2`/`t3` sont les mêmes en trait.
- **Le médaillon** (`Pictogramme` avec `medaillon`) pose le dessin sur un fond sombre de la même couleur, avec un liseré clair.
- **Sur une pastille de coût**, le dessin passe en foncé (`surFond`) ; sur une ressource dépensée de la barre de tour, il s'éteint avec son libellé.

## Quelle icône pour quelle carte

`apps/jeu/src/pictogrammes-regles.ts` (pur, testé) : un sort a son dessin `sort:<id>` ; sans lui, celui de son école ; sans école, le signe d'aptitude. Une attaque prend l'arme de son identifiant (`dague-lancer` → dague lancée, `hachette` ≠ `hache`). Une aptitude a le sien ou un signe d'aptitude (ruse : foncer/se désengager reprennent les actions de base ; Témérité et Fougue la rage).

## Ajouter un dessin

1. Écrire le SVG (viewBox 64 × 64, classes `p1 p2 p3 t1 t2 t3`) dans `DESSINS` (`pictogrammes.ts`), avec une teinte de `TEINTES` ; réutiliser les pièces communes (`FLAMME`, `BOULE`, `ECLAIR`, `BOUCLIER`, `CROIX`, `etoile`, `rayons`…).
2. Le regarder : `pnpm jeu`, puis **`/?icones`** (banc d'essai, développement seulement) ; `&grand=128` pour juger les détails, `&prefixe=sort:` pour un groupe.
3. `pnpm test` : `pictogrammes.test.ts` vérifie que les dessins sont bien formés, que chaque sort jouable a le sien, et que **chaque carte que peut jouer un héros ou un monstre trouve un vrai dessin** : une nouvelle capacité sans icône fait échouer le test.

## Pas encore

Les cartes d'élan (Coordination, Pas de côté…) partagent l'étincelle d'élan ; les capacités de monstres rares et les aptitudes des classes non jouables ont le signe d'aptitude. Les sorts du SRD hors du jeu de combat prennent le médaillon de leur école.
