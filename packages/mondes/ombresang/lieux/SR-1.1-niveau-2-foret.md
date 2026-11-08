# Forêt d'Acier (lr-foret) : points à visiter, niveau 2

> **Validé par l'utilisateur le 08/11/2026** (V5, lieu 5/5). Gelé : toute modification passe par lui.

Fiches détaillées des points à visiter de `lr-foret`, au modèle de `SR-1.1-niveau-2-temple.md`. Sources : la fiche Niveau 1 de `lr-foret` (gelée) dans `SR-1.1-vallee-des-mille-epees.md`, `../PITCH-LAME-ROUSSE.md` (§6, lieu 5), et les issues imposées vers `lr-forge-vorn` et `lr-temple-chapelle`. Dans les blocs d'héritage, « charte de la région 1 » renvoie à l'en-tête de `SR-1.1-vallee-des-mille-epees.md`.

**Plan de référence** (mètres, nord en haut, origine au coin nord-ouest de l'ensemble ; x vers l'est, y vers le sud ; une position (x %, y %) de la fiche gelée vaut (x × 8 m, y × 8 m)) :
- Ensemble : 800 m sur 800 m.
- Lisière (`lr-foret-lisiere`) : x 556 à 596, y 700 à 740 (position 576, 720). Piste de terre rouge, large de 6 m, qui entre par le sud-est, où une pente descend vers la forge de Vorn (hors zone), et sort au nord-ouest vers l'allée.
- Allée (`lr-foret-allee`) : grand ruban de 20 m de large, du bord nord-ouest de la lisière (vers x 556, y 700) jusqu'à la clairière centrale, sur près de 250 m. Clairière centrale de 40 m sur 40 m, x 380 à 420, y 476 à 516 (position 400, 496). Trois branches de 20 m de large en partent : vers le sud-ouest jusqu'au campement, vers le nord jusqu'au menhir, vers l'est jusqu'à l'antre.
- Campement (`lr-foret-campement`) : x 156 à 196, y 604 à 644 (position 176, 624). Sortie est vers l'arche de la chapelle ; lien nord-est vers la branche sud-ouest de l'allée.
- Menhir (`lr-foret-menhir`) : x 460 à 500, y 180 à 220 (position 480, 200). Cratère de 20 m de diamètre en son centre (x 470 à 490, y 190 à 210) ; arête de roche sèche, large de 2 m, du bord sud jusqu'au pied du Menhir. Accès par le sud, depuis la branche nord de l'allée.
- Antre (`lr-foret-antre`) : x 694 à 714, y 328 à 344 (position 704, 336). Entrée large de 2 m, côté ouest (x 694, y 333 à 335), qui donne sur la branche est de l'allée.
- **Matière** : acier gris-bleu des lames et des gardes, rouille rouge et roche rouge au sol ; le Menhir est un bloc de pierre noire.

**Budget (niveau 1, gelé)** : 2 combats · 0 rencontre sociale · 0 PNJ · 0 énigme · 1 piège · 2 trésors. Répartition : lisière (combat : lames errantes) ; allée (codex, site de contrat hors budget) ; campement (indices, trésor : la cache de lames, site de contrat hors budget) ; menhir (piège, objet de quête, traces) ; antre (combat, trésor : la bourse).

---

### Niveau 2 : lr-foret-lisiere (la lisière et la piste des ferrailleurs, piste), dans lr-foret

**Héritage** (recopié du bloc « Héritage et nuances propres à ce lieu » de lr-foret, niveau 1, ne pas modifier) :
- Héritage : charte de la région 1. Nuances : acier gris-bleu des lames géantes, rouille rouge sur le sol, fumerolles d'Ichor tiède par endroits, vent qui siffle dans des fils d'acier de cinquante à deux cent cinquante mètres, étincelles d'éclairs magnétiques, ombres rayées par les épées.

- **Dimensions et structure** : lisière de 40 m sur 40 m (environ 53 pas sur 53), que traverse du sud-est au nord-ouest une piste de terre rouge large de 6 m. Une pente descend au sud-est vers la forge de Vorn, et la piste se perd au nord-ouest dans l'allée.
- **Matériaux et état** : terre rouge tassée sur la piste, rouille rouge en croûte sur les rochers, lames géantes d'acier gris-bleu plantées de biais en bordure, poussière de limaille sur les pierres.
- **Lumière** : de jour, un jour gris et rasant tombe sur la piste ; les lames géantes luisent et rayent la terre de leurs ombres. La nuit, la seule lueur vient de la forge, au sud-est, au bas de la pente. Par mauvais temps, des éclairs magnétiques frappent les lames plantées et laissent un instant un éclat sur leur acier.
- **Sons** : vent qui siffle dans les fils d'acier, martèlement sourd de la forge au sud-est ; par mauvais temps, les lames sifflent plus fort.
- **Odeurs** : terre rouge, rouille, fumée de forge.
- **Température** : froide ; un vent du nord charrie de la limaille.
- **Éléments remarquables** (chacun avec sa place) :
  - piste de terre rouge, large de 6 m, qui traverse la lisière du sud-est au nord-ouest.
  - hallebarde brisée, fichée par son manche dans la roche, à l'entrée sud-est de la piste (détail propre).
  - trois cairns de pierres rouges, à l'extrémité nord-ouest de la piste, marquant la limite du champ.
  - lames géantes d'acier gris-bleu, plantées de biais en bordure de la piste, de part et d'autre.
  - pente au sud-est, qui descend vers la forge de Vorn.
  - lueur orange de la forge, au bas de la pente, au sud-est.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `lr-forge-vorn` (piste des ferrailleurs, sud-est) : description (vue de la lisière) : « Piste de terre rouge entre les lames géantes ; au bas de la pente, la forge se voit comme une lueur orange. » ; retour (vue de la forge) : « Porte arrière au nord, sur une piste de ferrailleurs qui s'enfonce entre les lames plantées de biais. »
  - vers `lr-foret-allee` (nord-ouest) : description (vue de la lisière) : « Au nord-ouest, la piste s'élargit en une allée de roche rouge, entre deux rangées de lames géantes qui montent vers le cœur du champ. » ; retour (vue de l'allée) : « Au sud-est, l'allée se resserre en une piste de terre rouge, et descend vers trois cairns de pierres rouges. »
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | combat | lames errantes : 3 `epee-volante` pour 4 héros, 5 pour 6 héros, et davantage à mesure que la Fièvre de Fer monte ; elles patrouillent en petits groupes autour de la piste | lames géantes plantées en bordure de la piste | `epee-volante` (x3 ou x5, plus avec la Fièvre) | combat |
  | repères (sans fiche) | trois cairns de pierres rouges, qui marquent la limite du champ | extrémité nord-ouest de la piste | aucun | aucun (lecture) |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : si le foyer de Vorn est éteint, les lames errantes retombent, et le combat n'a plus lieu.
- **Un détail propre à ce lieu** : une hallebarde brisée, fichée par son manche à l'entrée de la piste.

**Champs dérivés**
- **resume** : La lisière du champ d'acier, où commence la piste des ferrailleurs.
- **accroche** (vue du dehors depuis la piste, au bas de la pente) : Au bout de la piste, la lisière d'un champ où des lames géantes dressent leurs gardes sur un ciel gris.
- **visuel** : Une piste de terre rouge, large de six mètres, traverse des lames géantes d'acier gris-bleu plantées de biais dans la roche rouge. Une hallebarde brisée, fichée par son manche, marque son entrée, et trois cairns de pierres rouges se dressent à son extrémité nord-ouest. Au sud-est, la piste descend vers une lueur orange, au bas de la pente ; sous un jour gris et rasant, les lames luisent et rayent la terre de longues ombres.
- **ambiance** : Terre rouge, lames plantées, vent d'acier.
- **description** : La lisière est le bord sud-est du champ, là où la piste de terre rouge s'enfonce entre les lames géantes. La piste est large de six mètres ; elle traverse une zone de quarante mètres sur quarante, puis se perd au nord-ouest dans l'allée centrale. Une hallebarde brisée, fichée par son manche dans la roche, marque l'entrée de la piste. Plus loin, trois cairns de pierres rouges se dressent à son extrémité nord-ouest : ce sont les seuls repères laissés par les ferrailleurs. Au sud-est, la piste descend une pente jusqu'à la forge de Vorn, qu'on ne voit d'ici qu'à sa lueur orange. Des lames errantes patrouillent autour de la piste, en petits groupes : trois pour quatre héros, cinq pour six, et davantage à mesure que la Fièvre de Fer monte ; elles sont plus nombreuses la nuit, et se déchaînent par mauvais temps. La lisière ne contient ni trésor, ni piège, ni personne : elle sert d'entrée et de point de repère pour qui revient vers la forge.
- **arrivee** : La terre rouge crisse sous vos semelles, et le vent froid charrie de la limaille. Autour de vous, les lames géantes d'acier gris-bleu s'élèvent comme des murs, et leurs ombres rayées couvrent la piste. Au loin, de petites lames flottent et pivotent au-dessus du champ, comme des oiseaux de proie qui attendent. Au bas de la pente, sous le ciel gris, une lueur orange palpite, et un martèlement sourd monte jusqu'ici. L'air sent la rouille et la fumée, et le vent siffle dans le fil des épées.

---

### Niveau 2 : lr-foret-allee (l'allée des épées géantes, allée), dans lr-foret

**Héritage** (recopié du bloc « Héritage et nuances propres à ce lieu » de lr-foret, niveau 1, ne pas modifier) :
- Héritage : charte de la région 1. Nuances : acier gris-bleu des lames géantes, rouille rouge sur le sol, fumerolles d'Ichor tiède par endroits, vent qui siffle dans des fils d'acier de cinquante à deux cent cinquante mètres, étincelles d'éclairs magnétiques, ombres rayées par les épées.

- **Dimensions et structure** : ruban de roche rouge, large de 20 m (environ 27 pas), que le vent a dégagé, et qui court sur près de 250 m depuis la lisière, au sud-est, jusqu'à une clairière centrale de 40 m sur 40 m (environ 53 pas sur 53). Trois branches, larges de 20 m, quittent la clairière : au sud-ouest vers le campement, au nord vers le menhir, à l'est vers l'antre.
- **Matériaux et état** : roche rouge à nu, balayée par le vent, rouille rouge au pied des lames ; flancs des épées d'acier gris-bleu, poli par le vent.
- **Lumière** : de jour, un jour gris tombe du ciel sur la roche rouge ; les épées géantes luisent et rayent le sol de leurs ombres. La nuit, seule la lueur de lampe porte dans l'allée ; au nord, le cratère du Menhir rougeoie par-dessus les lames. Par mauvais temps, des éclairs magnétiques frappent les épées, et leur acier s'illumine un instant.
- **Sons** : vent qui siffle dans les fils d'acier de part et d'autre du ruban, pas qui résonnent sur la roche rouge ; par mauvais temps, le sifflement monte jusqu'à une plainte.
- **Odeurs** : rouille, métal froid ; par endroits, au nord, une odeur de métal tiède.
- **Température** : froide dans l'allée ; un souffle tiède monte parfois du nord, depuis le cratère.
- **Éléments remarquables** (chacun avec sa place) :
  - ruban de roche rouge, large de 20 m, entre la lisière, au sud-est, et la clairière centrale.
  - clairière centrale de 40 m sur 40 m, au bout du ruban, où se rejoignent les trois branches.
  - branche sud-ouest, qui part de la clairière vers le campement.
  - branche nord, qui part de la clairière vers le menhir.
  - branche est, qui part de la clairière vers l'antre, une fente basse sous la garde d'une épée couchée.
  - la plus haute des épées, au bord ouest de la clairière, dont le flanc sud porte, à hauteur d'homme, les inscriptions de la dernière bataille (codex).
  - épée fendue par le milieu, sur le bord est du ruban, dont les deux moitiés restent plantées côte à côte (détail propre).
  - épées, hallebardes et lances géantes d'acier gris-bleu, plantées de biais de part et d'autre du ruban.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `lr-foret-lisiere` (sud-est, par le ruban) : description (vue de l'allée) : « Au sud-est, l'allée se resserre en une piste de terre rouge, et descend vers trois cairns de pierres rouges. » ; retour (vue de la lisière) : « Au nord-ouest, la piste s'élargit en une allée de roche rouge, entre deux rangées de lames géantes qui montent vers le cœur du champ. »
  - vers `lr-foret-campement` (sud-ouest) : description (vue de l'allée) : « Au sud-ouest de la clairière, un chemin de roche rouge file entre les lames géantes, vers des toiles grises au loin. » ; retour (vue du campement) : « Au nord-est, un chemin de roche rouge s'enfonce entre les lames géantes, vers une clairière où le vent siffle. »
  - vers `lr-foret-menhir` (nord) : description (vue de l'allée) : « Au nord de la clairière, une trouée de roche rouge monte entre les lames géantes, vers une fumée pâle qui s'élève au loin. » ; retour (vue du menhir) : « Au sud du cratère, une trouée de roche rouge descend entre les lames géantes, vers une clairière dégagée par le vent. »
  - vers `lr-foret-antre` (est) : description (vue de l'allée) : « À l'est de la clairière, un chemin de roche rouge file entre les lames géantes, vers une fente basse sous la garde d'une épée couchée. » ; retour (vue de l'antre) : « Ouverture basse, à l'ouest, sous la garde d'une épée couchée ; au-delà, le jour gris et un chemin entre les lames géantes. »
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | codex | les inscriptions de la dernière bataille de Vael-Khor, gravées en lignes serrées sur le flanc sud de la plus haute des épées | flanc sud de la plus haute des épées, au bord ouest de la clairière | à créer | aucun (lecture) |
  | site de contrat (hors budget) | « La lame fendue » (seconde feuille de l'auberge) : un oxydeur égaré ronge l'épée fendue | centre de la clairière | `la-lame-fendue` (rencontre `le-rongeur-de-l-allee`) | `creer-contrats` |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : aucun.
- **Un détail propre à ce lieu** : une épée fendue par le milieu, dont les deux moitiés restent plantées côte à côte.

**Champs dérivés**
- **resume** : L'allée centrale du champ, où les épées géantes portent les traces d'une ancienne bataille.
- **accroche** (vue du dehors depuis la lisière) : Un ruban de roche rouge monte entre deux rangées de lames géantes, vers une clairière où le vent siffle dans l'acier.
- **visuel** : Un long ruban de roche rouge, large d'une vingtaine de mètres, serpente entre des épées géantes d'acier gris-bleu plantées de biais dans la roche, jusqu'à une clairière de quarante mètres. Au bord ouest de la clairière, la plus haute des épées porte sur son flanc sud des inscriptions gravées en lignes serrées ; plus loin, sur le bord est du ruban, une autre épée, fendue par le milieu, laisse ses deux moitiés plantées côte à côte. Trois branches quittent la clairière, vers le sud-ouest, le nord et l'est, et la rouille rouge couvre le pied des lames. Sous un jour gris, les épées rayent le sol de leurs ombres.
- **ambiance** : Ruban de roche rouge, épées, inscriptions.
- **description** : L'allée est le centre du champ : un ruban de roche rouge, large d'une vingtaine de mètres, qui part de la lisière, au sud-est, et aboutit à une clairière de quarante mètres de côté. Le vent a dégagé ce passage entre les épées géantes, et le reste du champ se referme de part et d'autre en lames plantées de biais dans la roche. Trois branches quittent la clairière : au sud-ouest vers le campement, au nord vers le Menhir Brisé, à l'est vers une fente basse sous une garde d'épée. Au bord ouest de la clairière, la plus haute des épées porte sur son flanc sud les inscriptions de la dernière bataille de Vael-Khor, gravées en lignes serrées. Plus loin, sur le bord est du ruban, une épée fendue par le milieu laisse ses deux moitiés plantées côte à côte. Le centre de la clairière est le site du contrat de la lame fendue (la seconde feuille de l'auberge) : un oxydeur égaré ronge l'épée fendue du bord est. Aucun trésor ni piège ne se trouve ici ; la clairière sert de carrefour.
- **arrivee** : Le vent vous prend ici dans toute sa force, et il siffle dans les fils d'acier qui vous dominent. Les épées géantes dressent leurs gardes à plus de cent mètres, et leurs ombres rayées se croisent sur la roche rouge. Plus haut, de petites lames flottent et pivotent au loin, comme des oiseaux de proie qui surveillent la plaine. L'air sent la rouille et le métal froid. Une clairière s'ouvre entre les épées ; trois chemins en partent, et un long ruban de roche file vers le sud-est.

---

### Niveau 2 : lr-foret-campement (le campement abandonné des ferrailleurs, camp), dans lr-foret

**Héritage** (recopié du bloc « Héritage et nuances propres à ce lieu » de lr-foret, niveau 1, ne pas modifier) :
- Héritage : charte de la région 1. Nuances : acier gris-bleu des lames géantes, rouille rouge sur le sol, fumerolles d'Ichor tiède par endroits, vent qui siffle dans des fils d'acier de cinquante à deux cent cinquante mètres, étincelles d'éclairs magnétiques, ombres rayées par les épées.

- **Dimensions et structure** : clairière de 40 m sur 40 m (environ 53 pas sur 53), au sud-ouest du champ. Une sortie à l'est, au bord de la zone, mène au sentier qui monte vers l'arche de la chapelle ; un lien au nord-est rejoint la branche sud-ouest de l'allée.
- **Matériaux et état** : toile grise des tentes, tendues sur des piquets de fer ; charrettes de bois cerclé de fer, rouille rouge sur les ridelles ; terre rouge nue, foyer de pierres rouges.
- **Lumière** : de jour, un jour gris tombe sur les toiles, et les grandes lames rayent le sol de leurs ombres. La nuit, rien ne brille ici : seule la lueur de lampe des héros porte jusqu'aux toiles. Par mauvais temps, des éclairs magnétiques frappent les lames plantées au loin, et leur éclat se voit à l'horizon.
- **Sons** : toiles qui claquent au vent, grincement des charrettes, sifflement lointain dans le fil des lames.
- **Odeurs** : fumée froide, rouille, huile.
- **Température** : froide ; le vent du nord passe entre les toiles.
- **Éléments remarquables** (chacun avec sa place) :
  - foyer éteint, au centre de la clairière, sous une marmite pleine posée sur les pierres.
  - tentes de toile grise, au centre et au sud, sur des piquets de fer.
  - charrettes abandonnées le long du côté nord, chargées d'outils et de ferraille de rebut.
  - la plus grande charrette, bâchée, au nord-ouest : sous sa bâche, la cache de lames.
  - caisse ferrée, sous la bâche de la grande charrette, qui renferme les lames de qualité (trésor).
  - bottine cloutée, laissée sur la marche arrière d'une charrette, à l'est (détail propre).
  - sentier de l'est, qui quitte la clairière vers l'arche de la chapelle.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `lr-foret-allee` (nord-est) : description (vue du campement) : « Au nord-est, un chemin de roche rouge s'enfonce entre les lames géantes, vers une clairière où le vent siffle. » ; retour (vue de l'allée) : « Au sud-ouest de la clairière, un chemin de roche rouge file entre les lames géantes, vers des toiles grises au loin. »
  - vers `lr-temple-chapelle` (sentier de l'ouest, est) : description (vue du campement) : « Sentier qui monte vers l'est, depuis les charrettes, jusqu'à une arche d'acier gris-bleu ; au-dessus, la garde d'une épée immense. » ; retour (vue de la chapelle) : « Par l'arche ouest, un sentier descend vers l'ouest ; au loin, en contrebas, des tentes et des charrettes abandonnées sur la terre rouge. »
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | indice (sans fiche) | les affaires laissées sur place : marmite pleine, outils laissés, bottine abandonnée ; une fuite faite en hâte | foyer et charrettes | aucun | aucun (lecture) |
  | trésor | la cache de lames de qualité : des armes du catalogue SRD, valant 60 po au total, qui se portent à la main | caisse ferrée, sous la bâche de la plus grande charrette, au nord-ouest | à créer | Perception (fouille sous la bâche) |
  | site de contrat (hors budget) | « Le chargement de Gorm » (première feuille de l'auberge) : des mercenaires chargent la charrette de l'est | centre de la clairière, entre les tentes | `le-chargement-de-gorm` (rencontre `les-mercenaires-du-campement`) | `creer-contrats` |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : aucun.
- **Un détail propre à ce lieu** : une bottine cloutée, laissée sur la marche arrière d'une charrette, comme si son propriétaire allait revenir.

**Champs dérivés**
- **resume** : Le campement abandonné des ferrailleurs, au sud-ouest du champ, sur la terre rouge.
- **accroche** (vue du dehors depuis le sentier de l'est) : Des toiles grises et des charrettes au bord d'une clairière de terre rouge, sous un ciel bas, et une odeur de fumée froide.
- **visuel** : Un campement de tentes de toile grise s'étale sur une clairière de terre rouge, autour d'un foyer éteint où repose une marmite pleine. Des charrettes abandonnées bordent le côté nord, et la plus grande, bâchée, se dresse au nord-ouest. À l'est, un sentier de terre monte vers une arche d'acier gris-bleu, et un jour gris éclaire les toiles.
- **ambiance** : Toiles grises, charrettes, foyer éteint.
- **description** : Le campement est une clairière de quarante mètres de côté, au sud-ouest du champ, où les ferrailleurs dressaient leurs tentes entre leurs charrettes. Les tentes de toile grise sont encore tendues sur des piquets de fer. Au centre, un foyer éteint porte une marmite pleine, et les charrettes, le long du côté nord, sont chargées d'outils et de ferraille de rebut. La plus grande, au nord-ouest, est bâchée ; sous sa bâche, une caisse ferrée renferme la cache de lames de qualité : des armes du catalogue, valant soixante pièces d'or en tout, qui se portent à la main. Une bottine cloutée a été laissée sur la marche arrière d'une charrette, à l'est. Entre les tentes, au centre, la charrette de l'est est le site du contrat de Gorm Meule : des mercenaires de passage la chargent pour la revendre. Une pioche de ferrailleur, au manche de frêne intact et à la tête fondue en poudre rouge, est restée appuyée contre une charrette. Le sentier de l'est quitte le campement vers l'arche de la chapelle, au temple. Les ferrailleurs ont déserté le campement en le laissant plein : ils ont vu les lames s'arracher. Il n'y a pas de piège ici, et aucun combat en dehors du contrat de Gorm Meule.
- **arrivee** : Le silence pèse ici, à peine troublé par les toiles grises qui claquent au vent. Des tentes grises, tendues sur leurs piquets, entourent un foyer éteint, et une marmite pleine repose encore sur les pierres, comme si l'on était parti pour un instant. Des charrettes sont alignées le long du côté nord, chargées d'outils qui luisent sous le jour gris. L'odeur de fumée froide se mêle à celle de la rouille, et un vent froid passe entre les toiles. Au-delà de la clairière, la terre rouge se perd entre les lames géantes.

---

### Niveau 2 : lr-foret-menhir (le Menhir Brisé et le cratère de la relique, cratère), dans lr-foret

**Héritage** (recopié du bloc « Héritage et nuances propres à ce lieu » de lr-foret, niveau 1, ne pas modifier) :
- Héritage : charte de la région 1. Nuances : acier gris-bleu des lames géantes, rouille rouge sur le sol, fumerolles d'Ichor tiède par endroits, vent qui siffle dans des fils d'acier de cinquante à deux cent cinquante mètres, étincelles d'éclairs magnétiques, ombres rayées par les épées.

- **Dimensions et structure** : zone de 40 m sur 40 m (environ 53 pas sur 53), au nord-est du champ. Au centre, un cratère de roche rouge de 20 m de diamètre (environ 27 pas) et de 3 m de profondeur ; son fond est couvert d'un sol saturé d'Ichor tiède. Le Menhir, bloc de pierre noire haut de 6 m, se dresse droit au centre du cratère. Une arête de roche sèche, large de 2 m, traverse le fond du bord sud jusqu'au pied du Menhir. Accès par le sud, depuis la branche nord de l'allée.
- **Matériaux et état** : roche rouge des bords, en pente ; sol du fond saturé d'Ichor tiède ; Menhir de pierre noire, brisé au sommet, rouille rouge en croûte à son pied ; rouille en croûte sur le bord sud-est.
- **Lumière** : de jour, un jour gris tombe sur le cratère, et la fumée tiède le fait paraître flou. La nuit, le cratère rougeoie par endroits, et c'est la seule source de lumière : la lueur de lampe ne porte pas plus loin que le bord. Par mauvais temps, des éclairs magnétiques frappent le Menhir, et sa cassure luit un instant.
- **Sons** : sifflement du vent au bord du cratère, crépitement des fumerolles, et sous le fond un bruit sourd et régulier, à peine audible.
- **Odeurs** : métal chaud et âcre, qui pique la gorge au fond.
- **Température** : tiède au fond du cratère, froide sur le bord, où passe le vent du nord.
- **Éléments remarquables** (chacun avec sa place) :
  - Menhir de pierre noire, brisé au sommet, avec une cassure fraîche, dressé droit au centre du cratère.
  - cratère de 20 m de diamètre, bords de roche rouge, fond couvert de sol saturé d'Ichor tiède.
  - arête de roche sèche, large de 2 m, qui traverse le fond du bord sud jusqu'au pied du Menhir.
  - éclat de la pierre sacrée, petit, de pierre noire, au pied du Menhir, sur l'arête.
  - fumerolles tièdes, qui montent du fond, au bord est du cratère.
  - traces de pas et de traîneau dans la rouille, sur le bord sud-est.
  - piquets de fer alignés en cercle au bord du cratère, certains tordus (détail propre).
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `lr-foret-allee` (sud, par la branche nord) : description (vue du menhir) : « Au sud du cratère, une trouée de roche rouge descend entre les lames géantes, vers une clairière dégagée par le vent. » ; retour (vue de l'allée) : « Au nord de la clairière, une trouée de roche rouge monte entre les lames géantes, vers une fumée pâle qui s'élève au loin. »
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | piège | le sol du cratère, saturé d'Ichor tiède : qui marche hors de l'arête de roche sèche subit brûlure et vertige ; un jet de Constitution réussi réduit les dégâts de moitié | fond du cratère, hors de l'arête | à créer | Perception (repérer l'arête) ; Constitution (dégâts) |
  | objet de quête | l'éclat de la pierre sacrée : un fragment petit, qui se porte à la main ; preuve que Vorn a profané le Menhir (distinct du fragment d'enclume, qui reste à la forge de Vorn) | pied du Menhir, sur l'arête | à créer | aucun |
  | repère (sans fiche) | traces de pas et de traîneau dans la rouille, qui mènent du cratère vers le sud-est, jusqu'à la forge de Vorn | bord sud-est du cratère, dans la rouille | aucun | aucun (lecture) |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : aucun.
- **Un détail propre à ce lieu** : des piquets de fer alignés en cercle au bord du cratère, certains tordus, qui ne retiennent plus rien.

**Champs dérivés**
- **resume** : Le cratère du Menhir Brisé, au nord-est du champ, sous une fumée tiède.
- **accroche** (vue du dehors depuis l'allée) : Au nord-est du champ, un cratère de roche rouge fume sous un ciel gris, et au centre une masse de pierre noire se dresse.
- **visuel** : Un cratère de roche rouge, large d'une vingtaine de mètres, s'ouvre entre les lames géantes, et un bloc de pierre noire, brisé au sommet, se dresse droit en son centre. Le fond est couvert d'une fumée tiède qui monte en filets, et des fumerolles s'élèvent au bord est ; au pied du bloc, un petit éclat de pierre noire accroche le jour. Des traces sillonnent la rouille du bord sud-est, sous un jour gris.
- **ambiance** : Cratère, fumée tiède, pierre brisée.
- **description** : Le cratère est au nord-est du champ, à l'écart de l'allée, qui y mène par une trouée. De roche rouge, il a vingt mètres de diamètre et trois de profondeur ; son fond est couvert d'un sol saturé d'Ichor tiède, dont montent des fumerolles. Une arête de roche sèche, large de deux mètres, traverse le fond depuis le bord sud jusqu'au pied du Menhir : c'est le seul chemin sûr. Qui marche à côté tombe dans la brûlure et le vertige ; un test de Perception repère l'arête, et un jet de Constitution réussi, sur le fond, réduit les dégâts de moitié. Au pied du Menhir, un éclat de pierre noire, petit, se porte à la main : c'est l'éclat de la pierre sacrée. Des piquets de fer, alignés en cercle au bord, certains tordus, ne retiennent plus rien. Sur la rouille du bord sud-est, des traces de pas et de traîneau mènent vers le sud-est, jusqu'à la forge de Vorn. Ce bloc est le pommeau tombé d'une autre épée du dieu que celle du Temple : la pierre sacrée des Gardiens du Pont, que Vorn a brisée pour en tirer le fragment d'enclume. Le cratère bat plus fort la nuit, et ses lueurs rougeoient alors. Il n'y a ni combat ni trésor ici.
- **arrivee** : Une tiédeur étrange monte du cratère, et l'air sent le métal chaud. Au centre d'un bassin de roche rouge, un bloc de pierre noire se dresse, brisé au sommet, et la fumée monte en filets lents autour de lui. Le fond semble couvert d'une croûte sombre et luisante, sous un voile de fumée. Sur le bord, le vent reste froid, tandis que le fond, lui, exhale sa tiédeur. Au pied du bloc, un petit éclat de pierre noire accroche le jour.

---

### Niveau 2 : lr-foret-antre (l'antre des loups sous une garde géante, antre), dans lr-foret

**Héritage** (recopié du bloc « Héritage et nuances propres à ce lieu » de lr-foret, niveau 1, ne pas modifier) :
- Héritage : charte de la région 1. Nuances : acier gris-bleu des lames géantes, rouille rouge sur le sol, fumerolles d'Ichor tiède par endroits, vent qui siffle dans des fils d'acier de cinquante à deux cent cinquante mètres, étincelles d'éclairs magnétiques, ombres rayées par les épées.

- **Dimensions et structure** : antre de 20 m est-ouest sur 16 m nord-sud (environ 27 pas sur 21), à l'est du champ, sous la garde couchée d'une épée géante. Entrée large de 2 m et haute de 1,5 m, côté ouest, sur la branche est de l'allée ; la salle s'enfonce vers l'est.
- **Matériaux et état** : parois de roche rouge, griffées ; terre battue au sol, jonchée de poils gris ; garde couchée d'acier gris-bleu, qui forme le toit de l'entrée.
- **Lumière** : de jour, le jour gris entre par l'entrée et s'arrête à trois pas ; au-delà, la salle reste dans l'ombre. La nuit, aucune lumière ne vient de l'intérieur : seule une lueur de lampe, apportée, éclaire les parois. Par mauvais temps, des éclairs magnétiques frappent la garde, et leur éclat entre par l'ouverture.
- **Sons** : vent qui siffle à l'entrée ; au fond, un souffle lent et régulier, et des grattements sur la terre battue.
- **Odeurs** : poil, fauve, terre humide, rouille.
- **Température** : froide sur le seuil ; le fond reste tiède, comme un terrier, et son souffle sort par l'ouverture.
- **Éléments remarquables** (chacun avec sa place) :
  - entrée basse, large de 2 m, côté ouest, sous la garde couchée d'acier gris-bleu qui forme le toit.
  - parois de roche rouge, au nord et au sud, griffées.
  - terre battue au sol, jonchée de poils gris.
  - fourche de fer pliée en V, plantée dans la paroi est (détail propre).
  - creux au fond, à l'est, plus profond que le reste de la salle.
  - sac de cuir déchiré, au pied de la paroi nord, qui renferme la bourse (trésor).
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `lr-foret-allee` (ouest, par la branche est) : description (vue de l'antre) : « Ouverture basse, à l'ouest, sous la garde d'une épée couchée ; au-delà, le jour gris et un chemin entre les lames géantes. » ; retour (vue de l'allée) : « À l'est de la clairière, un chemin de roche rouge file entre les lames géantes, vers une fente basse sous la garde d'une épée couchée. »
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | combat | les loups sanguinaires : 1 `loup-sanguinaire` pour 4 héros, 2 pour 6 héros, qui défendent l'entrée et le creux du fond ; alternative sans combat : jeter de la viande ou détourner les loups (Dressage, Discrétion) | creux du fond, à l'est ; entrée, à l'ouest | `loup-sanguinaire` (x1 ou x2) | combat (ou Dressage, Discrétion) |
  | trésor | la bourse d'un ferrailleur tué par les loups : 25 po | sac de cuir déchiré, au pied de la paroi nord | à créer | Perception (fouille) |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : une fois les loups tués ou détournés, les grattements cessent (l'arrivée perd cette mention) ; seul reste le souffle de la portée.
- **Un détail propre à ce lieu** : une fourche de fer pliée en V, plantée dans la paroi est.

**Champs dérivés**
- **resume** : Une cavité basse sous la garde d'une épée géante, à l'est du champ.
- **accroche** (vue du dehors depuis l'allée) : Sous une garde d'épée couchée, une fente basse de roche rouge, et un souffle tiède qui sent le fauve.
- **visuel** : Une entrée basse de roche rouge, large de deux mètres, s'ouvre sous une garde d'épée couchée en acier gris-bleu, et une salle de vingt mètres se creuse derrière elle, vers l'est. Le sol de terre battue est jonché de poils gris, et une fourche de fer pliée en V est plantée dans la paroi est, près d'un creux plus profond que le reste. Le jour gris entre par l'entrée et s'arrête à trois pas ; au-delà, une lueur de lampe, chaude et basse, accroche le rouge des parois.
- **ambiance** : Roche rouge, poils, fourche de fer, souffle.
- **description** : L'antre est une cavité de roche rouge, sous la garde couchée d'une épée géante, à l'est du champ. Son entrée, large de deux mètres et haute d'un mètre et demi, s'ouvre côté ouest ; la salle s'enfonce d'une vingtaine de mètres vers l'est, sur seize mètres de large. Le sol est de terre battue, jonché de poils gris. Une fourche de fer, pliée en V, est plantée dans la paroi est, et au fond un creux, plus profond que le reste, sert de couche. Au pied de la paroi nord, un sac de cuir déchiré renferme une bourse de vingt-cinq pièces d'or, laissée par un ferrailleur tué par les loups. Ce sont des loups sanguinaires : un pour quatre héros, deux pour six, qui défendent l'entrée et le fond. La femelle protège une portée dans le creux du fond ; les loups ont fui leurs terriers, chassés par les lames. Un groupe peut les éviter sans combat, en leur jetant de la viande ou en les détournant (Dressage, Discrétion). Le jour gris s'arrête à trois pas de l'entrée, et le reste de la salle reste dans l'ombre.
- **arrivee** : Il faut se pencher pour franchir l'entrée, sous la garde d'une épée couchée. L'air qui sort de l'ombre est tiède, et sent le poil, la terre et le fauve. Le jour gris qui vous suit s'arrête à trois pas, et la salle s'enfonce ensuite dans une obscurité lourde, où votre lampe accroche le rouge des parois. Au fond, un souffle lent et régulier vient d'un creux. Une fourche de fer se dresse dans la paroi est, et quelque chose gratte doucement la terre.

---

## Cas limites de la Forêt (règle n+1)

- **Le groupe entre par le sentier de l'ouest** : il arrive au campement ; le combat de la lisière l'attend s'il ressort par la forge de Vorn.
- **Le foyer de Vorn est éteint** : les lames errantes retombent ; l'allée, le campement et le cratère restent à visiter.
- **Le groupe marche sur le sol du cratère** : brûlure et vertige, puis l'arête reste accessible ; l'éclat n'est jamais perdu.
- **L'éclat n'est pas pris** : les traces du cratère vers la forge restent une preuve ; la confrontation avec Vorn reste possible sans lui.
- **Le groupe n'a pas de viande** : Dressage, Discrétion, ou le combat.
- **Les loups sont tués ou détournés** : la portée reste dans le creux, inoffensive ; la bourse reste à prendre.
- **La cache n'est pas trouvée** : rien n'est bloqué, le trésor reste sous la bâche.
