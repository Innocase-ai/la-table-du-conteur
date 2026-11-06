# Les plateaux de combat

Un plateau = une **ambiance** (le sol et les murs) + des **éléments** posés sur les cases (arbres, rochers, eau, boue, neige, et les obstacles bas : rochers bas, troncs, caisses). Les deux sont indépendants : une mare peut se trouver en forêt comme en caverne.

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
| `r` | rocher bas | obstacle bas |
| `t` | tronc couché | obstacle bas |
| `c` | caisse | obstacle bas |
| `H` | départ d'un héros | sol |
| `m` | départ d'un monstre | sol |

**Obstacle bas** (phase 2) : on ne peut pas y entrer, mais on voit et on tire par-dessus ; il donne un **demi-couvert** (voir plus bas).

**Phase 1 (04/11/2026) : les éléments reprennent les règles qui existaient déjà** (mur, terrain difficile) : le jeu ne change pas, seul le décor change. Une ancienne carte donne donc exactement le même combat quand on remplace un `#` par un `T` ou un `~` par un `e`. Le moteur (`packages/regles/src/combat/grille.ts`) garde le type de case pour les règles, et la table `reliefs` (clé « x,y ») pour l'apparence : `INFO_RELIEFS` dit, pour chaque élément, sa lettre et le type de case qu'il applique.

Les départs `H` et `m` doivent rester sur du sol. Une carte a besoin d'au moins 6 `H`, et d'assez de `m` (ou de sols libres près d'eux) pour ses monstres.

## Le couvert (phase 2, 04/11/2026)

Règle du SRD 5.2.1, version de grille : une cible a un **demi-couvert** (**+2 à la CA**, et **+2 aux jets de sauvegarde de Dextérité**) quand un obstacle bas se trouve sur le tracé entre l'attaquant (ou l'origine de l'effet) et elle, sauf si cet obstacle est collé à l'attaquant : qui se tient contre un muret tire par-dessus. Le tracé est celui de la ligne de vue (Bresenham, de centre à centre). Les murs, arbres et rochers hauts ne donnent pas de couvert : ils coupent la vue, l'attaque n'a pas lieu.

- Moteur : `couvert(grille, origine, cible)` dans `grille.ts` ; `jetAttaque` l'ajoute à la CA de la cible (`JetAttaque.couvert`, `DetailsEvenement.couvert`) ; `couvertSauvegarde` pour les sauvegardes de Dextérité des sorts (origine : le point visé d'une zone, sinon le lanceur) et des actions de monstres (souffle…). Le journal le dit : « … raté (cible à couvert, +2 CA) », « sauvegarde réussie (à couvert, +2) ».
- IA : ses attaques sont simulées avec les vrais dés du moteur, donc le couvert compte dans ses choix de cible sans rien de plus ; pour se placer, elle examine aussi une **position de tir à couvert** (celle qui l'abrite du plus grand nombre d'ennemis), que la simulation du round départage avec les autres.
- Écran : quand on vise, un bouclier **🛡+2** marque les cibles à couvert ; la bulle du jet ajoute 🛡 après la CA.
- Non pris en compte (pour l'instant) : le couvert des créatures (une créature entre l'attaquant et la cible), le trois-quarts de couvert (+5), le couvert total.

Mesure sur 6 parties jouées par l'IA (niveau 3, modérée) : au gué, 19 attaques sur 395 visaient une cible à couvert, et 3 sauvegardes ont été aidées ; au col, 7 sur 285.

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
| **Le gué des brigands** (nouveau) | forêt | rivière à traverser, gué, arbres, rochers, boue ; caisses des brigands et tronc couché (couvert) |
| **Le col gelé** (nouveau) | neige | congères, arbres, rochers ; rochers bas et tronc (couvert) |

Les quatre premières cartes n'ont changé que d'apparence (même nombre de murs et de cases difficiles aux mêmes places) : leur équilibre calé par simulation reste valable. Les deux nouvelles ont leur coefficient de danger calé par `pnpm escarmouches` (gué 1,4 ; col 1,25), recontrôlé après l'ajout des obstacles bas : mêmes fourchettes.

## Pour ajouter un élément ou une carte

1. Une carte : écrire ses lignes avec les caractères ci-dessus, l'ajouter à `RENCONTRES` (`prototype.ts`), puis un thème dans `THEMES` (`escarmouche.ts`) avec ses troupes, et caler son `danger` (`pnpm escarmouches 16 <thème> 2,3,4 --danger <thème>=1.2`).
2. Un élément : l'ajouter à `RELIEFS` et `INFO_RELIEFS` (`grille.ts`, avec la lettre et le type de case qu'il applique), le dessiner dans `Reliefs.tsx` (`DessinRelief`, `TAILLE_SPRITE`), ajouter sa couleur d'aperçu (`Accueil.tsx`, `styles.css`) ; une plaque a en plus sa description dans `terrains.json` (`reliefs`). Les tests (`reliefs.test.ts`, `images.test.ts`) vérifient que tout est cohérent.

## Suite prévue

- ~~Phase 2~~ : faite (couvert, obstacles bas, IA).
- **Phase 3** : eau profonde (nage), glace (glissant), champs de bataille tirés au hasard pour les escarmouches, cartes pour les lieux des histoires.
