---
name: decrire-lieux
description: Décrire en détail tous les lieux d'un monde de « La Table du Conteur », du général au particulier (la carte du monde, puis chaque lieu de cette carte, puis chaque point à visiter), dans un atlas unique (`LIEUX.md`) qui sert à la fois l'histoire (descriptions du MJ, passages, détails à examiner), les images des lieux (`visuel`) et les cartes illustrées (composition, positions). À utiliser pour une nouvelle histoire, une fois le canon écrit et avant d'écrire les zones, ou quand l'utilisateur veut « décrire les lieux », « faire l'atlas », « la carte du monde de l'histoire », « des lieux plus détaillés », « que les images et les cartes collent », ou quand les images d'un monde se contredisent entre elles ou avec les cartes. Complète `creer-monde` (étapes 2 et 3), `creer-personnages` et `creer-rencontres`.
---

# Décrire les lieux, du monde à la salle

Un lieu mal décrit se paie trois fois : une scène plate (le MJ n'a rien à raconter), une image fausse (le texte devient le prompt), une carte incohérente (le port de la carte ne ressemble pas au port de la scène). La cause est toujours la même : chaque texte est écrit seul. Ce skill écrit **tous les lieux d'un coup, de haut en bas**, dans un seul document, **l'atlas** (`packages/mondes/<id>/LIEUX.md`), et en tire ensuite les champs du monde (`description`, `visuel`, `resume`, `ambiance`, `accroche`, `position`, passages, détails à examiner) et les prompts des cartes.

Le moteur ne lit pas l'atlas (comme `BIBLE.md` et `CANON-PERSONNAGES.md`, c'est un document de travail) : il sert de **source unique**. Quand un texte du monde et l'atlas se contredisent, on corrige d'abord l'atlas, puis on re-dérive.

## Les trois niveaux (toujours dans cet ordre)

| Niveau | Quoi | Qui l'écrit | Ce qui en sort |
| --- | --- | --- | --- |
| **0. La carte du monde** | tout le territoire de l'histoire, vu de loin : forme, relief, eau, climat, régions, grands lieux, routes, distances, menace | **Claude seul** (comme le canon) | la carte principale (`carte-<racine>`), la charte du monde (matériaux, couleurs, lumière), les `position` des grands lieux |
| **1. Chaque lieu de cette carte** | une région, ville, village, camp, donjon, grotte : son plan vu de dessus, ses limites, ses accès, sa liste de points à visiter avec leur place | **Claude seul**, avec l'utilisateur | une carte de détail par lieu (`carte-<lieu>`), les `position` de ses points, le `resume` / `accroche` du lieu |
| **2. Chaque point à visiter** | une salle, un bâtiment, un quartier, un lieu-dit : dimensions, matériaux, lumière, sons, odeurs, mobilier, issues, détails à examiner, ce qui change selon l'histoire | **agents**, un par lieu du niveau 1 (relus par Claude) | `description`, `visuel`, `ambiance`, `accroche`, passages (`liens`) ; la matière des `examens` (éléments remarquables) et des cartes tactiques (dimensions, mobilier, issues) |
| **3, 4… Les points à l'intérieur d'un point** | la cave, le cellier et les chambres d'une taverne ; les cellules d'une geôle ; les étages d'une tour : **même fiche que le niveau 2**, répétée à chaque profondeur | le même agent que son niveau 2 | les mêmes champs, pour chaque sous-lieu |

Le moteur n'a pas de limite de profondeur : un lieu a un `parent`, et un lieu peut contenir des lieux qui en contiennent d'autres (le Val va jusqu'à région, village, bâtiment, salle). Au-delà du niveau 2 on **répète la même fiche** : une taverne est un niveau 2 ; sa cave, son cellier et ses chambres sont des niveaux 3, qui héritent de la taverne comme la taverne hérite du village.

**Règle d'héritage** : un niveau ne contredit jamais celui du dessus, il le précise. Chaque fiche commence par un **bloc d'héritage** recopié du niveau supérieur (matériaux, couleurs, architecture, lumière, état général) ; celui qui écrit la fiche ne le modifie pas. Si un point à visiter exige un matériau absent du bloc (une salle de nacre dans un palais de pierre grise), on le justifie dans la fiche **et** on ajoute la nuance au bloc du dessus.

## Avant de commencer

1. Le canon existe (`BIBLE.md` : secret, factions, fins, registre d'identifiants §7 ; `monde.json` : ton et direction artistique). Sans lui, ne pas commencer : l'atlas en serait l'otage.
2. Lis la `direction` de `monde.json` (style, palette, mots-clés, interdits) : elle devient le **bloc d'héritage du niveau 0**.
3. Relis l'exemple livré : les `visuel` et `description` de `packages/regles/tests/fixtures/mondes/citadelle-des-marees/lieux/` et ses cartes (`images/carte-*.webp`) montrent le niveau attendu ; le modèle de l'atlas est `assets/ATLAS.modele.md`.
4. Décide avec l'utilisateur de la **taille** (nombre de lieux au niveau 1, de points au niveau 2) : c'est elle qui fixe le coût (un agent par lieu du niveau 1) ; annonce-le et attends l'accord.

## Niveau 0 : la carte du monde

Écris, dans `LIEUX.md` § « Niveau 0 », avec le modèle :

- **Le territoire** : forme générale, orientation (où est le nord), échelle (combien de jours de marche d'un bout à l'autre), relief, eaux, climat et saisons, ce qu'on voit de loin (silhouettes, fumées, lumières).
- **La charte du monde** (le bloc d'héritage racine) : 3 à 5 **matériaux** dominants, 4 à 6 **couleurs** (reprends la palette de `monde.json`), 2 à 3 **formes** d'architecture, la **lumière** type, la **météo** type, les **sons** et **odeurs** de fond. C'est ce qui rend tous les lieux reconnaissables d'une même histoire.
- **Les grands lieux** (les enfants directs de la racine) : pour chacun, son type, sa **position approximative** sur la carte du monde (en % : x de gauche à droite, y de haut en bas), ce qui le rend reconnaissable de loin, la distance en **heures** de ses voisins par la route, la menace ou la promesse qu'il porte.
- **Les routes et les passages** : qui relie quoi, les ponts, les cols, les gués, ce qui est fermé ou caché, les raccourcis dangereux.
- **La composition de la carte** : 3 à 5 phrases qui disent où se trouve chaque grand lieu (« la citadelle sur le promontoire au nord-ouest, le port dans l'anse au sud-est, les marais entre les deux »). Ce texte va dans `images.json` (`carte-<racine>`) et remplace le `visuel` de la racine dans le prompt de la carte : le modèle d'images ne place pas les lieux où on le lui dit, mais une composition claire aide beaucoup.

**→ Validation V3** : présente à l'utilisateur un **résumé d'une page** (territoire, charte, liste des grands lieux avec leur rôle et leur position) et attends son oui avant le niveau 1. Marque le niveau 0 « Validé par l'utilisateur le <date> ».

## Niveau 1 : chaque lieu de la carte

Un lieu qui contient d'autres lieux (au moins ~5 enfants, ou un niveau de donjon) a une fiche de niveau 1 ; les lieux plus petits sont décrits directement au niveau 2. La fiche (modèle dans l'atlas) contient :

- **Le bloc d'héritage** du niveau 0 + **les nuances propres** à ce lieu (ce qui le distingue des autres régions : un matériau, une couleur, une odeur).
- **Le plan vu de dessus** : forme générale, limites (mur, falaise, rivière), orientation, voies d'accès et où elles arrivent, éléments naturels, quartiers ou ailes. C'est ce qu'on verra sur sa carte.
- **Les points à visiter** : la liste exhaustive des enfants directs (leur `id`, leur type, leur fonction dramatique : combat, rencontre, énigme, repos, trésor, secret), avec leur **position approximative** sur le plan (x, y en %), leur **taille** (grande, moyenne, petite) et leurs **voisins directs** (ce qui devient les `liens`).
- **Le budget de contenu du lieu** (décidé avec l'utilisateur) : combien de combats, de rencontres sociales, de PNJ, d'énigmes, de pièges, de trésors, et sur quels points (« 2 combats et 4 rencontres de PNJ dans la citadelle : la cour, le réfectoire… »). Ce budget est une intention, pas encore des fiches.
- **L'histoire du lieu** en quelques lignes (qui l'a bâti, ce qui s'y est passé) et son **état actuel**.
- **Le jour, la nuit, le mauvais temps** : trois ambiances brèves.
- **Ce que le joueur voit en y arrivant**, et **ce qu'il ne voit pas** (les secrets du lieu, **dans une section séparée** « Secret du MJ »).
- **La composition de la carte** : 3 à 5 phrases pour `images.json` (`carte-<lieu>`), comme au niveau 0.

**→ Validation V4, lieu par lieu, pour tous les lieux** : Claude propose la fiche complète d'un lieu (plan, points à visiter, budget de contenu, secret), l'utilisateur la valide ou la corrige (il décide de la forme, des points, des combats et des rencontres : c'est son histoire), puis on passe au lieu suivant. La fiche validée est marquée et gelée.

## Niveau 2 et suivants : chaque point à visiter

Un agent par lieu du niveau 1, **un lieu à la fois** (dans l'ordre choisi par l'utilisateur ; en parallèle seulement s'il le demande), et seulement pour un lieu dont la fiche de niveau 1 est validée, avec `references/brief-agent-lieu.md` (à suivre à la lettre), l'atlas (niveaux 0 et 1 du lieu), `BIBLE.md` et le schéma. Chaque point reçoit une **fiche très détaillée** (modèle dans l'atlas) :

- le bloc d'héritage (recopié, jamais modifié) ;
- **dimensions et structure** (taille en pas, hauteur, forme, niveaux, ce qui soutient ou ferme) ;
- **matériaux et état** (de quoi c'est fait, l'âge, l'usure, l'humidité, ce qui est cassé, ce qui est récent) ;
- **lumière** (d'où vient-elle, sa couleur, sa force, ses ombres), **sons**, **odeurs**, **température** ;
- **éléments remarquables**, chacun avec sa **place** (« au fond à gauche », « contre le mur nord ») : mobilier, décor, traces, objets ; ce sont les futurs détails à examiner (`examens/`) ;
- **issues** : chaque porte, escalier, passage ; où il mène, comment il se présente de chaque côté (les `liens` avec leur `description` et leur `retour`, 12 à 30 mots) ;
- **le contenu prévu** : pour chaque PNJ, monstre, rencontre, piège, trésor, énigme ou objet de ce point, son **emplacement** (à quel élément décrit il est lié : le piège sous la dalle devant le coffre, le PNJ derrière le comptoir), son **rôle**, et son id s'il existe déjà dans le canon (sinon « à créer »). C'est un **emplacement**, pas la fiche de l'entité : voir « Le contenu des lieux » plus bas ;
- **avant / après** : ce qui change selon l'avancée de l'histoire (une salle propre puis dévastée, une porte close puis ouverte) ;
- les **champs dérivés**, rédigés à la fin de la fiche : `visuel` (voir ci-dessous), `description` (pour le MJ : factuelle, détaillée, 100 à 250 mots), `resume` (une phrase qui ne spoile rien), `ambiance` (3 à 8 mots), `accroche` (12 à 30 mots, vue du dehors).

### Quand un point en contient d'autres (taverne, tour, geôle…)

- La fiche du point (niveau 2) a une section **Intérieur** : le plan intérieur (où est l'entrée, comment les pièces s'enchaînent), la liste **exhaustive** de ses sous-lieux (`id`, type, fonction dramatique, position approximative sur ce plan, voisins directs : la cave sous la salle commune, l'escalier qui monte aux chambres) et **ce qu'on voit de la taverne qui annonce chaque sous-lieu** (la trappe derrière le comptoir, l'escalier de bois au fond).
- Chaque sous-lieu a ensuite **sa propre fiche** (niveau 3), avec le même modèle ; son **bloc d'héritage est celui de son conteneur**, avec les nuances propres de la pièce (le cellier est plus froid et plus sombre que la salle commune, mais mêmes pierres et mêmes poutres). Même règle pour un niveau 4 (le fond du cellier, un passage derrière un tonneau).
- Le sous-lieu est un **vrai lieu** du monde : `parent` = le conteneur, `accroche` vue du dehors depuis le conteneur, ses propres `liens`, `visuel`, `description`.
- **Cartes** : un conteneur n'a de carte illustrée que s'il a au moins ~5 sous-lieux ou si c'est un niveau de donjon ; sinon le jeu dessine ses sous-lieux en anneau sur un fond sobre, ce qui suffit pour une taverne de trois pièces. Les `position` des sous-lieux n'ont de sens que sur la carte illustrée de leur conteneur.
- **Un point simple** (une salle sans rien dedans) n'a pas de section Intérieur.
- Le même agent écrit un point et tous ses sous-lieux (il garde ainsi le bloc d'héritage et la cohérence des issues entre la salle et sa cave).

### Le `visuel`, prompt de l'image

C'est ce champ, tel quel, qui fabrique l'image du lieu **et** nourrit la carte du parent. Il décrit **ce qu'on voit depuis l'entrée**, en 2 à 4 phrases denses :

1. la **forme générale** et la **matière** (une salle ronde de pierre grise, un quai de planches noircies) ;
2. **trois éléments remarquables** avec leur place (au fond, à droite, au centre) ;
3. la **lumière** et son origine ;
4. l'**état** des choses (eau gelée ou courante, fonte figée ou en fusion, porte ouverte ou close).

Interdits : nommer un personnage ou une créature (ce qui est nommé apparaît à l'image), les mots refusés par le service d'images (corps, cadavre, enfant près d'un danger, brûlures sur la peau, silhouettes couchées), le vocabulaire abstrait (« inquiétant », « mystérieux » : on décrit ce qui inquiète), tout secret (le `visuel` est vu par le joueur). Les matériaux et couleurs viennent **du bloc d'héritage** : pas de nouvelle teinte sans la justifier plus haut.

**→ Validation V5, lieu par lieu** : après le vérificateur du niveau 2 de ce lieu, présente à l'utilisateur les fiches de ses points (et sous-lieux) en tableau (point, ce qu'on y voit, ce qu'on y trouve, détail propre) ; à son oui, le lieu est gelé et on passe au suivant.

## Le contenu des lieux (PNJ, monstres, objets, pièges, énigmes)

L'atlas décrit **où** et **dans quel décor** ; il ne crée pas les entités. Chaque PNJ, rencontre, piège, trésor, énigme ou objet est une fiche du monde, écrite après l'atlas par le skill ou l'agent qui en est responsable, et rattachée à son lieu par son champ `lieu`. Le contenu se décide à trois endroits :

1. **Au niveau 1** : le budget du lieu (combien de chaque sorte, sur quels points), avec l'utilisateur.
2. **À chaque point, dès le niveau 2 et à chaque sous-niveau** (la taverne, sa cave, son cellier, ses chambres) : le contenu prévu, avec son emplacement dans le décor. Une entité se place **au lieu le plus précis** : le piège de la cave est un contenu de la cave (niveau 3), pas de la taverne ; son champ `lieu` sera l'id de la cave.
3. **Ensuite, par les skills spécialisés**, qui lisent la fiche du point pour rester cohérents avec son décor :

| Contenu | Qui l'écrit | Ce qu'il tire de la fiche du point |
| --- | --- | --- |
| PNJ et leur profondeur | `creer-personnages` (et les agents de zone pour les PNJ simples) | l'endroit où ils se tiennent, la lumière, les sons, ce qu'ils ont sous la main |
| Rencontres et monstres, contrats | `creer-rencontres`, `creer-contrats` | les dimensions et le mobilier pour la carte tactique, les issues pour la fuite, la lumière pour l'ambiance du plateau |
| Énigmes | `enigmes` | seulement ce que le groupe peut **voir** : inscriptions, objets, traces des éléments remarquables |
| Pièges, trésors, objets, tables de butin | `creer-pieges-tresors` (agents de zone pour les cas courants, voir `GUIDE-ZONE.md`) | l'élément auquel ils sont liés (la dalle, le coffre), pour que la détection et la description collent |
| Détails à examiner | agents Haiku (`brief-examens.md` de `creer-monde`) | les éléments remarquables, un examen par élément |

Quand les entités existent, **reporte leurs ids** dans le « Contenu prévu » de chaque point de l'atlas (l'atelier, onglets Registre et Graphes, donne la liste) : l'atlas redevient fidèle, et l'écart avec le budget du niveau 1 se voit. Rien de ce que l'atlas dit d'un décor ne doit être contredit par une entité (un piège qui se déclenche dans une pièce que l'atlas décrit sans dalle, un PNJ dans un lieu sans place pour lui).

## Du document au monde

1. **Dérive les champs** de l'atlas vers les fichiers de zone (`lieux/z*.json`) : les agents de zone du skill `creer-monde` **recopient** `visuel`, `description`, `resume`, `ambiance`, `accroche`, `liens` depuis l'atlas au lieu de les inventer (ajoute-le à leur mission ; le `GUIDE-ZONE.md` renvoie à `LIEUX.md`). Si l'atlas est fait **avant** les zones, c'est l'ordre idéal : les agents n'ont plus qu'à structurer.
2. **Les positions** : recopie les `position {x, y}` de l'atlas dans les fiches (atelier, onglet **Cartes**, ou le champ `position` à la main). Ce sont des intentions : une fois l'image générée, **on replace** les lieux d'après l'image réelle (le modèle ne dessine pas exactement la composition demandée). Regarde l'image avant de poser.
3. **Les cartes** (voir `docs/M2-IMAGES.md` et `docs/MONDES.md`) : d'abord la carte principale (`pnpm images cartes <monde> --lieu <racine>`), **on pose ses lieux**, puis les cartes de détail (la découpe de la carte principale autour du lieu sert de référence : c'est elle qui garde les bâtiments identiques). Coût ≈ 0,01 $ l'image : annonce-le, attends l'accord, un essai d'abord. Mets la composition de l'atlas dans `images.json` (`carte-<id>`).
4. **Les images des lieux** : `pnpm images monde <id>`, lot par lot, relues une à une contre le bloc d'héritage et la carte du parent.
5. `pnpm monde valider <id>`, puis l'**atelier** (Santé : lieux sans accroche, passages sans description ; Revue : secrets qui fuient dans un champ lu par le joueur ; Cartes : frères au même endroit de la carte).

## Vérifier en cascade

Le contrôle se fait **de bas en haut**, avec des yeux qui ne sont pas ceux du rédacteur :

1. **Le mécanique d'abord** (pas d'agent) : `pnpm monde valider <id>`, l'atelier (Revue : secrets qui fuient ; Cartes : frères au même endroit ; Santé), positions entre 0 et 100.
2. **Vérificateur du niveau 2, un par lieu du niveau 1** (`references/verificateur-niveau-2.md`) : cohérence interne du lieu, de ses points et de leurs sous-niveaux (héritage identique, issues réciproques, sous-lieux annoncés, plan et voisins, détail propre, contenu prévu, champs dérivés). Il rend un verdict, ne corrige rien.
3. **Vérificateur du niveau 1, un seul** (`references/verificateur-niveau-1.md`) : contrôle le contrôleur par sondage (2 ou 3 fiches par lieu) puis vérifie la cohérence avec l'histoire (rôle des lieux, ordre des révélations, fins, factions et horloge, budget et rythme, lieux frères, carte du monde).
4. **Claude au sommet** : arbitre les désaccords et tranche avec l'utilisateur ce qui touche au canon.

Vérificateurs en **Sonnet 5.5** (jamais le modèle des rédacteurs), contexte neuf, **au plus deux tours** de correction par niveau. Annonce le modèle et le nombre d'agents avant de les lancer (un par lieu du niveau 1, plus un).

## Contrôle de cohérence (avant de dire « c'est fini »)

À faire lieu par lieu, avec l'atlas et les images sous les yeux :

- [ ] Les matériaux, couleurs et lumière d'une fiche sont **ceux du bloc d'héritage** (ou une nuance justifiée plus haut).
- [ ] Les **voisins** d'un point (ses `liens`) correspondent à ses **positions** sur le plan : deux salles voisines ne sont pas aux deux bouts de la carte.
- [ ] Chaque **issue** a une `description` et un `retour` cohérents avec ce qu'on voit des deux côtés (un escalier qui descend d'un côté remonte de l'autre).
- [ ] Le `visuel` ne contient **aucun secret** ni **aucun nom** de personnage ; la `description` du MJ peut avoir le détail, pas le `visuel`.
- [ ] L'**image du lieu** montre ce que dit le `visuel` ; la **carte du parent** montre le lieu comme le `visuel` le dit (même matière, même couleur, même silhouette) ; la carte de détail reprend les bâtiments de la carte d'ensemble.
- [ ] Les distances en **heures** des liens entre grands lieux correspondent à l'échelle de la carte du monde.
- [ ] Chaque **avant / après** a un déclencheur dans le canon (un drapeau, un fait) : sinon l'état « après » n'arrivera jamais.
- [ ] Chaque **contenu prévu** a un emplacement dans le décor décrit, au **lieu le plus précis** (la cave, pas la taverne) ; le total par lieu correspond au **budget** du niveau 1.
- [ ] Une fois les entités écrites, leurs `lieu` et leurs ids sont **reportés dans l'atlas**, et aucune ne contredit le décor (piège sans dalle, PNJ sans place).
- [ ] Rien n'est **inventé** hors du canon : pas de nouveau PNJ, de nouveau secret ou de nouvelle relique dans une description.

## Les pièges connus

- **Texte générique** (« une salle sombre aux murs de pierre ») : le défaut n°1. Si deux fiches pourraient s'échanger sans qu'on le voie, aucune n'est finie : exige un détail propre (une inscription, une odeur, un objet cassé) par fiche.
- **Dérive des matériaux** : sans bloc d'héritage recopié, chaque agent invente sa pierre et sa lumière.
- **Secrets dans le `visuel`** : l'image les montrerait. Le secret va dans « Secret du MJ ».
- **Carte qui recopie la région** : donner à Klein la carte d'ensemble entière en référence fait recopier la région ; la **découpe** autour du lieu corrige (`docs/M2-IMAGES.md`).
- **Lieu trop petit pour une carte** : sous ~5 enfants, on pose les points sur la carte du parent.
- **Positions posées avant l'image** : elles ne collent pas ; replace après génération.

## Qui fait quoi (modèles)

- **Niveaux 0 et 1 : Claude lui-même** (jamais un agent : un atlas écrit par plusieurs mains se contredit, comme un canon), **avec l'utilisateur** pour les décisions (forme des lieux, points à visiter, combats, rencontres).
- **Vérificateurs** : voir « Vérifier en cascade » (Sonnet 5.5, un par lieu du niveau 1, puis un pour le niveau 1).
- **Niveaux 2 et suivants : un agent par lieu du niveau 1**, `general-purpose`, modèle **Haiku** (règle du projet pour l'écriture de textes) ; Claude **relit chaque fiche** contre le bloc d'héritage et la liste de contrôle, et arbitre. Si les fiches restent génériques après une relecture, passe le lot à **Sonnet 5.5** (annonce le modèle en une ligne, comme pour tout sous-agent) ; les vérificateurs passent alors à **Opus 5.5**, pour ne jamais partager le modèle du rédacteur.
- Pas de commit sans l'accord de l'utilisateur ; mets à jour `docs/JOURNAL.md` après le chantier.
