# Les plateaux de combat

Un plateau = une **ambiance** (le sol et les murs) + des **éléments** posés sur les cases (arbres, rochers, eau, boue, neige). Les deux sont indépendants : une mare peut se trouver en forêt comme en caverne.

## Les cartes en texte

Une rencontre écrit sa carte en lignes de texte (`Rencontre.carte`, ou `carte` d'une rencontre de monde) :

| Caractère | Case | Règle appliquée |
| --- | --- | --- |
| `.` | sol | normale |
| `#` | mur (bord du plateau, pilier, palissade) | bloque le passage et la vue |
| `~` | terrain difficile (broussaille, éboulis… selon l'ambiance) | déplacement ×2 |
| `T` | arbre | comme un mur |
| `R` | rocher | comme un mur |
| `e` | eau peu profonde | terrain difficile |
| `b` | boue | terrain difficile |
| `n` | neige profonde | terrain difficile |
| `H` | départ d'un héros | sol |
| `m` | départ d'un monstre | sol |

**Phase 1 (04/11/2026) : les éléments reprennent les règles qui existaient déjà** (mur, terrain difficile) : le jeu ne change pas, seul le décor change. Une ancienne carte donne donc exactement le même combat quand on remplace un `#` par un `T` ou un `~` par un `e`. Le moteur (`packages/regles/src/combat/grille.ts`) garde le type de case pour les règles, et la table `reliefs` (clé « x,y ») pour l'apparence : `INFO_RELIEFS` dit, pour chaque élément, sa lettre et le type de case qu'il applique.

Les départs `H` et `m` doivent rester sur du sol. Une carte a besoin d'au moins 6 `H`, et d'assez de `m` (ou de sols libres près d'eux) pour ses monstres.

## Les ambiances

`foret`, `souterrain`, `caverne`, `camp`, `neige` (`TERRAINS` dans `grille.ts`). Chacune a trois textures peintes vues de dessus (`<ambiance>-sol`, `-difficile`, `-mur`), décrites dans `packages/donnees/visuel/terrains.json`, générées par `pnpm images terrains` et installées par `python3 outils/images/installer.py terrains` (`apps/jeu/src/terrains/`). Sans texture, le plateau retombe sur des dégradés : le jeu ne casse jamais pour une image absente.

## Les éléments à l'écran

- **Arbres et rochers** : dessinés en vecteur par le jeu (`apps/jeu/src/composants/Reliefs.tsx`), sans fond, sur le sol de l'ambiance ; chacun un peu différent de son voisin (forme, taille, teinte, tirées de sa position, donc stables d'un rendu à l'autre). De la neige se pose dessus sur un plateau enneigé, de la mousse sur certains rochers en forêt. Ils passent toujours **sous** les jetons : on ne perd jamais un personnage derrière un arbre.
- **Eau, boue, neige** : des plaques qui remplacent le sol de la case, avec une texture continue d'une case à l'autre et un liseré sombre là où la plaque s'arrête. L'eau a des reflets qui glissent (arrêtés avec « mouvement réduit »). Textures peintes : `relief-eau`, `relief-boue`, `relief-neige` (une par plaque, communes à toutes les ambiances) ; sans elles, un dégradé.
- Dans l'aperçu des cartes (choix d'une escarmouche), chaque élément a sa couleur.

## Les cartes livrées

| Rencontre | Ambiance | Éléments |
| --- | --- | --- |
| Embuscade gobeline | forêt | arbres, mare, chemin boueux |
| La crypte | souterrain | piliers (murs) |
| La bande et ses ogres | caverne | rochers, bassin souterrain |
| Le camp hobgobelin | camp | boue, palissades |
| **Le gué des brigands** (nouveau) | forêt | rivière à traverser, gué, arbres, rochers, boue |
| **Le col gelé** (nouveau) | neige | congères, arbres, rochers |

Les quatre premières cartes n'ont changé que d'apparence (même nombre de murs et de cases difficiles aux mêmes places) : leur équilibre calé par simulation reste valable. Les deux nouvelles ont leur coefficient de danger calé par `pnpm escarmouches` (gué 1,4 ; col 1,25).

## Pour ajouter un élément ou une carte

1. Une carte : écrire ses lignes avec les caractères ci-dessus, l'ajouter à `RENCONTRES` (`prototype.ts`), puis un thème dans `THEMES` (`escarmouche.ts`) avec ses troupes, et caler son `danger` (`pnpm escarmouches 16 <thème> 2,3,4 --danger <thème>=1.2`).
2. Un élément : l'ajouter à `RELIEFS` et `INFO_RELIEFS` (`grille.ts`, avec la lettre et le type de case qu'il applique), le dessiner dans `Plateau.tsx` / `Reliefs.tsx`, ajouter sa couleur d'aperçu (`Accueil.tsx`, `styles.css`) ; une plaque a en plus sa description dans `terrains.json` (`reliefs`). Les tests (`reliefs.test.ts`, `images.test.ts`) vérifient que tout est cohérent.

## Suite prévue

- **Phase 2** : le couvert (+2 à la CA, règle du SRD) pour les obstacles bas (rocher bas, tronc couché, caisse), qui bloquent le passage sans bloquer la vue ; l'IA des monstres apprend à s'en servir.
- **Phase 3** : eau profonde (nage), glace (glissant), champs de bataille tirés au hasard pour les escarmouches, cartes pour les lieux des histoires.
