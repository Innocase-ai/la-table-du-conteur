# Bastion du Pont-Viaduc (lr-bastion) : points à visiter, niveau 2

> **Validé par l'utilisateur le 08/11/2026** (V5, lieu 2/5). Gelé : toute modification passe par lui. Fiches détaillées des points à visiter de `lr-bastion`, au modèle de `SR-1.1-niveau-2-village.md`. Sources : la fiche Niveau 1 de `lr-bastion` (gelée) dans `SR-1.1-vallee-des-mille-epees.md`, `../PITCH-LAME-ROUSSE.md` (§2, §4, §5, §6 lieu 2) et `../monde.json` (ton). Dans les blocs d'héritage, « charte de la région 1 » renvoie à l'en-tête de `SR-1.1-vallee-des-mille-epees.md`.

**Plan de référence** (mètres, nord en haut, origine au coin nord-ouest de l'enceinte ; sert à vérifier les dimensions) :
- Enceinte carrée de 40 m de côté, murs de pierre noire de 6 m de haut. Porte nord : une ouverture de 12 m (x 14 à 26), ouverte sur la route du village.
- Tour de péage : 10 m sur 10 m, dans l'angle nord-est (x 30 à 40, y 0 à 10), 12 m de haut.
- Corps de garde : bâtiment bas de 10 m sur 40 m, le long du mur ouest (x 0 à 10). Les cellules sont sous sa moitié sud (y 22 à 40).
- Cour : 30 m sur 20 m (x 10 à 40, y 10 à 30), entre le corps de garde, la tour et le passage sud. Entre la porte nord et la cour (x 10 à 30, y 0 à 10), un porche pavé, ouvert, compté avec la cour.
- Passage sud : voûte de 8 m de large (x 16 à 24, y 30 à 40), la herse à son extrémité sud. La niche du treuil est dans le mur est du passage (x 24 à 26, y 33 à 37).
- Tablier : chaussée de 8 m de large et de 60 m de long, au sud de la herse (y 40 à 100). Pile nord à son extrémité nord (y 40 à 46), pile centrale au milieu.
- Camp : rive sud, 40 m sur 30 m, au bout du tablier (y 100 à 130).

**Budget (niveau 1, gelé)** : 2 combats · 4 rencontres sociales (Élinor, Aldric, Mira, Joran si le groupe a tardé ; Brisk n'en est pas une) · 4 PNJ · 1 énigme · 1 piège · 1 trésor.

---

### Niveau 2 : lr-bastion-cour (la cour du poste, cour), dans lr-bastion

**Héritage** (recopié du bloc « Héritage et nuances propres à ce lieu » de lr-bastion, niveau 1, ne pas modifier) :
- Héritage : charte de la région 1. Nuances : pierre noire de la tour couverte de coulures de rouille, herse de fer rouillé, drapeau impérial en lambeaux, gouttes d'acide qui tombent des câbles, câbles et chaînes du pont-levis qui pendent, odeur de métal mouillé.

- **Dimensions et structure** : cour de pavés de 30 m est-ouest sur 20 m nord-sud (environ 41 pas sur 27), entre le corps de garde à l'ouest, la tour au nord-est, la porte nord et le passage sud ; murs de 6 m de haut.
- **Matériaux et état** : pavés de pierre noire usés en creux, murs de la même pierre couverts de rouille, planches de caisse ferrées aux portes, fer rouillé partout.
- **Lumière** : de jour, lumière grise tombant du ciel, sans ombre franche ; jour et nuit, des torches de suif que les péagers laissent brûler dans des appliques de fer, sur les murs ouest et nord, pour guetter les lames. Leur flamme tire au rouge.
- **Sons** : chaînes qui battent contre la herse, grincement des câbles au vent, bruit lointain du torrent sous l'arche.
- **Odeurs** : métal mouillé, suif, acide.
- **Température** : froide, avec le vent du nord qui entre par la porte large.
- **Éléments remarquables** (chacun avec sa place) :
  - tour de péage, dans l'angle nord-est : porte basse de planches ferrées au sud, fenêtre étroite au premier étage face à la cour (voir lr-bastion-tour).
  - corps de garde, bâtiment bas le long du mur ouest ; sous son auvent, dans le mur ouest, une porte de planches ferrées ferme le haut d'un escalier de pierre qui descend vers les cellules.
  - herse, au sud : grille de fer rouillé au bout du passage voûté, descendue aux trois quarts, à 1,5 m du pavé.
  - torches de suif dans des appliques de fer, sur le mur ouest et le mur nord.
  - rigole d'acide, creusée au centre de la cour, du pied de la herse vers le pied de la tour.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `lr-place` (route du village, nord) : description (vue de la cour) : « Porte nord du poste, large, ouverte sur la route du village ; au nord, les toits de tôle et les lames plantées. » ; retour (vue de la place) : « Route de terre battue au sud, qui descend entre les dernières maisons vers la porte du poste, avec l'arche de fer du viaduc derrière. »
  - vers `lr-bastion-tour` (nord-est) : description (vue de la cour) : « Porte de planches ferrées dans le mur sud de la tour, ouverte sur une pièce basse, où l'on entend des pièces tomber sur la pierre. » ; retour (vue de la tour) : « Porte de planches ferrées dans le mur sud de la salle de recette, au ras du sol ; par-dessus le seuil, la cour grise et les torches. »
  - vers `lr-bastion-cellules` (ouest, sous le corps de garde) : description (vue de la cour) : « Dans le mur ouest, sous l'auvent du corps de garde, une porte de planches ferrées ferme le haut d'un escalier de pierre qui descend, cadenassée côté cour. » ; retour (vue des cellules) : « Escalier de pierre qui monte vers une porte de planches ferrées, cadenassée de l'autre côté ; au-delà, la lumière grise de la cour. »
  - vers `lr-bastion-herse` (sud) : description (vue de la cour) : « Passage voûté au sud de la cour, entre deux murs de pierre noire, qui s'enfonce vers la herse rouillée et le ciel gris de la chaussée. » ; retour (vue de la herse) : « Passage voûté qui remonte au nord vers la cour ; au bout, les pavés et la lumière des torches de suif. »
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | combat (conditionnel) | hommes de main de la Baillie, seulement si l'on force le poste ou si l'on libère Joran : **6 héros**, `bandit` x3 et `eclaireur` x2 ; **4 héros**, `bandit` x2 et `eclaireur` x1 | cour, pavés, devant le corps de garde | `bandit`, `eclaireur` | combat |
  | PNJ (sans rencontre sociale au budget) | Brisk, sergent des péagers : commande les péagers, qui hésitent ; porte la clé des cellules à la ceinture | sous l'auvent du corps de garde | `brisk-sergent` | Intimidation ou Escamotage |
  | objet de quête | clé des cellules, portée par Brisk (elle ouvre le cadenas de l'escalier et les grilles) | à la ceinture de Brisk | à créer | — |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : aucun.
- **Un détail propre à ce lieu** : la rigole creusée dans le pavé par l'acide qui goutte des chaînes de la herse ; elle sert de guide au regard jusqu'au pied de la tour, et personne ne l'a rebouchée.

**Champs dérivés**
- **resume** : La cour du poste impérial, où les péagers hésitent devant la herse rouillée.
- **accroche** (vue du dehors depuis la place) : Au pied de l'arche de fer, un poste de pierre noire barre la route ; sa tour de péage éclaire une fenêtre où quelqu'un compte lentement des pièces.
- **visuel** : Une cour de pavés de pierre noire, usés en creux et rongés d'une rigole d'acide, fermée de murs de la même pierre couverts de coulures de rouille. Au nord-est, une tour de pierre noire dresse une fenêtre étroite face à la cour ; à l'ouest, sous l'auvent d'un bâtiment de garde bas, une porte de planches ferrées ferme le haut d'un escalier ; au sud, une herse de fer rouillé barre un passage voûté. Le jour gris tombe du ciel sans ombre franche, et des torches de suif, accrochées aux murs, tirent la lumière vers le rouge.
- **ambiance** : Pavés noirs, torches rouges, herse rouillée.
- **description** : La cour est le cœur du Bastion : un rectangle de pavés noirs, entouré de murs de six mètres. Au nord, la porte large donne sur la route du village, et c'est par là que les héros entrent. Dans l'angle nord-est, la tour de péage domine la cour, et sa fenêtre du premier étage surveille le passage. À l'ouest, le corps de garde est bâti le long du mur ; sous son auvent, une porte de planches ferrées ferme le haut d'un escalier qui descend vers les cellules, cadenassée côté cour. Le cadenas n'a qu'une clé, et c'est Brisk, le sergent des péagers, qui la porte à la ceinture. Brisk commande des hommes qui ne savent plus quel ordre suivre depuis que la route est fermée ; ils restent armés, hésitent, et reculent dès que l'on sort les armes. Les hommes de main de la Baillie, eux, n'obéissent qu'à elle : ils sont dans le corps de garde, et n'interviennent que si l'on force le poste ou si l'on libère le prisonnier des cellules. Au sud, un passage voûté conduit à la herse, descendue aux trois quarts, qui barre la chaussée vers le viaduc. La rigole d'acide, dans le pavé, mène du pied de la herse au pied de la tour. Le combat, s'il éclate, se joue ici, à découvert, entre les murs et les torches.
- **arrivee** : Le vent du nord vous pousse sous la porte large, et la cour s'ouvre devant vous, pavée de pierre noire usée par l'acide. Au sud, la herse rouillée barre la route, et sa rouille coule en traînées sombres sur les barreaux. À votre gauche, une tour de pierre noire se dresse, couverte de coulures ; derrière sa fenêtre étroite, une femme en robe impériale compte des pièces, lentement, à la lueur d'une lanterne. Les péagers armés se tiennent près du corps de garde, la main sur leurs armes ; ils hésitent, regardent la herse, puis vous. Plus haut, au-dessus du mur sud, la grande arche de fer enjambe le torrent qu'on entend gronder sans le voir, et ses câbles pendent de ses sommets.

---

### Niveau 2 : lr-bastion-tour (la tour de péage, tour), dans lr-bastion

**Héritage** (recopié du bloc « Héritage et nuances propres à ce lieu » de lr-bastion, niveau 1, ne pas modifier) :
- Héritage : charte de la région 1. Nuances : pierre noire de la tour couverte de coulures de rouille, herse de fer rouillé, drapeau impérial en lambeaux, gouttes d'acide qui tombent des câbles, câbles et chaînes du pont-levis qui pendent, odeur de métal mouillé.

- **Dimensions et structure** : tour carrée de 10 m sur 10 m (environ 14 pas sur 14), dans l'angle nord-est de l'enceinte, haute de 12 m, trois niveaux. Rez-de-chaussée : la salle de recette, avec un escalier en vis de 2 m de diamètre dans l'angle nord-est. Premier étage : le bureau de 7 m sur 6 m, à l'ouest de l'escalier. Sommet : la plateforme du guet, entourée d'un parapet. Une seule entrée, une porte basse dans le mur sud.
- **Matériaux et état** : pierre noire taillée au ciseau, coulures de rouille sur toutes les faces ; planchers de planches de caisse ; porte de planches ferrées ; escalier de pierre ; comptoir de planches, balance de fer et coffre de fer.
- **Lumière** : au rez-de-chaussée, lumière grise du jour qui entre par la porte et par deux fentes étroites ; à l'étage, une lanterne à huile posée sur le bureau, que sa propriétaire laisse brûler tout le jour, l'unique fenêtre étant trop étroite.
- **Sons** : le tintement des pièces sur le bureau, le vent dans les fentes, le grincement du plancher sous les pas.
- **Odeurs** : métal mouillé, papier humide, suif froid.
- **Température** : froide ; la pierre épaisse garde le froid de la nuit.
- **Éléments remarquables** (chacun avec sa place) :
  - porte basse de planches ferrées, dans le mur sud, au ras de la cour (vers la cour).
  - deux fentes étroites dans le mur est de la salle de recette.
  - comptoir de planches au centre de la salle de recette ; sur le comptoir, une balance de fer à deux plateaux, l'un poli par les pièces, l'autre rongé de rouille.
  - coffre de fer de la recette, sous le comptoir, côté nord, fermé par une serrure à clé.
  - escalier en vis de pierre, dans l'angle nord-est de la salle de recette, qui monte au bureau.
  - bureau de planches à l'étage, sous la fenêtre étroite, face au sud.
  - fenêtre étroite, au premier étage, dans le mur sud, face à la cour.
  - lanterne à huile posée sur le bureau, à côté d'une bourse de pièces (cuivre, argent et or) ; la Baillie garde à la main un coupe-papier de nacre.
  - rapport des ingénieurs, scellé de cire, dans le tiroir du milieu du bureau.
  - parapet de la plateforme du guet, au sommet, accessible par l'escalier en vis.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `lr-bastion-cour` (sud) : description (vue de la tour) : « Porte de planches ferrées dans le mur sud de la salle de recette, au ras du sol ; par-dessus le seuil, la cour grise et les torches. » ; retour (vue de la cour) : « Porte de planches ferrées dans le mur sud de la tour, ouverte sur une pièce basse, où l'on entend des pièces tomber sur la pierre. »
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ (rencontre sociale : la négociation) | Élinor Vane propose une prime pour chasser les oxydeurs et garder le prisonnier aux fers ; sa réponse dépend de ce que le groupe a vu. Deux voies au moins : la Persuasion ou l'Intimidation, ou lui mettre une preuve sous les yeux (le registre, le rapport) | bureau de l'étage, sous la fenêtre | `elinor-vane` | Persuasion, Intimidation, ou preuve |
  | trésor | recette du péage du jour : l'équivalent de 40 pièces d'or, en cuivre, en argent et quelques pièces d'or | coffre de fer de la recette, dans la salle du rez-de-chaussée | à créer | Outils de voleur |
  | objet de quête | rapport des ingénieurs, scellé et adressé au Sénat | tiroir du milieu du bureau | à créer | Investigation |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : aucun.
- **Un détail propre à ce lieu** : l'un des plateaux de la balance est poli par les pièces, l'autre rongé de rouille ; le poids de la recette est la seule chose de la tour qui ait encore servi.

**Champs dérivés**
- **resume** : La tour de péage, où la Baillie tient sa recette et ses comptes.
- **accroche** (vue du dehors depuis la cour) : Une tour de pierre noire à l'angle de l'enceinte, couverte de rouille, dont une seule fenêtre laisse voir un cercle jaune.
- **visuel** : Une tour carrée de pierre noire, haute de douze mètres, couverte de coulures de rouille, s'élève à l'angle nord-est du poste. Sa porte basse de planches ferrées, au sud, s'ouvre au ras de la cour, et son parapet de guet couronne le toit. Au premier étage, une fenêtre étroite face à la cour laisse voir une lanterne à huile posée sur un bureau, dont le cercle jaune éclaire la pierre autour.
- **ambiance** : Pierre noire, lanterne, pièces qui tintent.
- **description** : La tour de péage est le centre administratif du Bastion : trois niveaux de pierre noire, une porte basse au sud, et tout ce qui fait rentrer l'argent du poste. Au rez-de-chaussée, la salle de recette est étroite : un comptoir de planches, une balance de fer, et sous le comptoir un coffre de fer qui garde la recette du jour, l'équivalent de quarante pièces d'or, en cuivre, en argent et quelques pièces d'or. À l'étage, le bureau de la Baillie occupe l'ouest de l'étage, sous la fenêtre étroite. C'est là qu'Élinor Vane reçoit le groupe, sans se lever, une bourse de pièces devant elle et un coupe-papier de nacre à la main. Elle parle bas, froide et hautaine, et ne s'excuse de rien. Elle répète que la route est fermée pour la sécurité de tous, et propose une prime à qui chassera les oxydeurs et laissera le prisonnier aux fers. Si le groupe refuse, elle ne menace pas ; elle fait appeler le sergent et ferme la discussion. La négociation peut se conduire par la Persuasion ou l'Intimidation, aidée par ce que le groupe a vu au village et à la herse, ou se trancher en lui mettant une preuve sous les yeux. Dans le tiroir du milieu du bureau, un rapport des ingénieurs, scellé de cire, attend : un document officiel adressé au Sénat. Il se fouille à part, pendant que la Baillie a les yeux ailleurs. Au sommet, le guet domine la cour et le viaduc.
- **arrivee** : La porte basse s'ouvre, et l'air froid de la pierre vous prend, avec une odeur de métal mouillé et de papier humide. La salle de recette est étroite : un comptoir de planches, une balance de fer dont un plateau est poli, l'autre rongé de rouille. Sous le comptoir, un coffre de fer, fermé, occupe son coin. Un escalier de pierre monte en vis dans l'angle, et là-haut, un bruit régulier de pièces que l'on empile vous parvient par à-coups, comme une horloge. La seule lumière vient de deux fentes étroites et du jour gris qui entre par la porte.

---

### Niveau 2 : lr-bastion-cellules (les cellules de la quarantaine, geôle), dans lr-bastion

**Héritage** (recopié du bloc « Héritage et nuances propres à ce lieu » de lr-bastion, niveau 1, ne pas modifier) :
- Héritage : charte de la région 1. Nuances : pierre noire de la tour couverte de coulures de rouille, herse de fer rouillé, drapeau impérial en lambeaux, gouttes d'acide qui tombent des câbles, câbles et chaînes du pont-levis qui pendent, odeur de métal mouillé.

- **Dimensions et structure** : sous-sol d'environ 10 m est-ouest sur 18 m nord-sud, sous la moitié sud du corps de garde. Un escalier de huit marches descend de la porte du mur ouest de la cour. Un couloir de pierre de 2 m de large court du nord au sud. À l'ouest du couloir, deux cellules l'une à la suite de l'autre, aux grilles de fer ; à l'est, la cellule de l'est ; au bout du couloir, au sud, la cellule du fond, la plus grande.
- **Matériaux et état** : pierre noire, joints rongés de rouille ; sol de dalles de pierre, humide en pied de mur ; grilles de fer rouillé ; paille moisie sur le sol ; entailles en rangées sur le mur de la cellule du fond.
- **Lumière** : une torche de suif, accrochée à un crochet de fer à l'entrée du couloir, que les péagers laissent brûler pour surveiller les cellules ; le fond du couloir reste dans la pénombre.
- **Sons** : une goutte d'eau qui tombe dans la fosse, des respirations, des voix basses derrière les grilles.
- **Odeurs** : eau croupie, rouille, paille moisie.
- **Température** : froide et humide, plus froide près du sol.
- **Éléments remarquables** (chacun avec sa place) :
  - escalier de pierre, huit marches, qui monte vers la porte de planches ferrées du mur ouest de la cour.
  - couloir de pierre, nord-sud, avec la torche de suif accrochée à son entrée, au pied de l'escalier.
  - deux cellules à l'ouest, grilles de fer rouillé ; des ingénieurs impériaux y sont enfermés, sans fiche propre.
  - cellule de l'est : une dalle plate au centre du sol, qui paraît comme les autres.
  - fosse d'une ancienne citerne, sous la dalle de la cellule de l'est, pleine d'eau croupie.
  - cellule du fond, la plus grande, au bout du couloir : des entailles en rangées sur le mur, une par jour ; Aldric Ponts y est enfermé.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `lr-bastion-cour` (haut de l'escalier, à l'est) : description (vue des cellules) : « Escalier de pierre qui monte vers une porte de planches ferrées, cadenassée de l'autre côté ; au-delà, la lumière grise de la cour. » ; retour (vue de la cour) : « Dans le mur ouest, sous l'auvent du corps de garde, une porte de planches ferrées ferme le haut d'un escalier de pierre qui descend, cadenassée côté cour. »
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ (rencontre sociale : la révélation) | Aldric Ponts, ingénieur en chef : raconte ce que ses équipes ont mesuré dans les piles du pont | cellule du fond | `aldric-ponts` | Persuasion, ou le libérer de sa cellule |
  | figurants (sans fiche) | les ingénieurs enfermés avec lui, sans nom propre | deux cellules de l'ouest | aucun | — |
  | PNJ (rencontre sociale, seulement si le groupe a tardé : l'interrogatoire) | Joran, transféré ici par la Baillie à Fièvre de Fer 2 | cellule de l'est | `joran-deserteur` | Persuasion ou Perspicacité |
  | piège | la dalle de la cellule de l'est lâche sur la fosse si l'on marche dessus sans la sonder ; chute de trois mètres et dégâts de chute | dalle au centre de la cellule de l'est | à créer | Perception |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : à Fièvre de Fer 2, si le groupe a tardé, Joran n'est plus au pilori de la place : la Baillie l'a transféré dans la cellule de l'est.
- **Un détail propre à ce lieu** : les entailles du mur de la cellule du fond sont faites en rangées de cinq, comme on compte à la main ; la dernière n'est pas finie.

**Champs dérivés**
- **resume** : Les cellules sous le corps de garde, où des hommes sont enfermés derrière des grilles de fer.
- **accroche** (vue du dehors depuis la cour) : Une porte de planches ferrées au pied du corps de garde, cadenassée, et une odeur d'eau croupie qui passe sous le battant.
- **visuel** : Un couloir de pierre noire, étroit, descend par huit marches depuis une porte de planches ferrées, vers quatre cellules aux grilles de fer rouillé. Une torche de suif, accrochée à un crochet à l'entrée du couloir, éclaire les grilles d'une lueur rouge et tremblante. Plus loin, dans la cellule du fond, les entailles du mur comptent les jours.
- **ambiance** : Grilles, torche, eau qui goutte.
- **description** : Les cellules sont sous le corps de garde, et on y descend par huit marches depuis la porte cadenassée de la cour. Le couloir est étroit, la pierre suinte, et la seule lumière est une torche de suif accrochée à l'entrée, que les péagers entretiennent pour surveiller le couloir. Deux cellules à l'ouest, aux grilles de fer rouillé, abritent des ingénieurs impériaux enfermés depuis plusieurs jours. Ils travaillaient sur les piles du viaduc. Leur chef, Aldric Ponts, est dans la cellule du fond, la plus grande, où les entailles du mur comptent les jours. Il parle peu, mais il sait ce qu'il a mesuré : les piles du pont ne tiennent plus comme elles devraient, et il l'a écrit. Il n'accuse personne à voix haute ; il dit seulement qu'on l'a enfermé au nom d'une quarantaine. Il ne donne rien sans savoir qui est en face de lui, et veut d'abord des preuves de bonne foi. La cellule de l'est est vide, ou occupée par Joran si le groupe a tardé. Au centre de son sol, une dalle paraît comme les autres, mais elle lâche sur la fosse d'une ancienne citerne : un trou de trois mètres, plein d'eau croupie. Un test de Perception la révèle. La chute ne tue pas, mais elle fait mal, et elle isole celui qui tombe au fond de la fosse.
- **arrivee** : Huit marches vous enfoncent sous le corps de garde, et l'air se fait lourd. Au pied de l'escalier, une torche de suif brûle dans un crochet de fer, et sa lumière tremble sur les grilles. L'air sent l'eau croupie et la rouille ; quelque part au fond, une goutte tombe, régulière, dans un trou. Deux hommes assis derrière une grille relèvent la tête, les mains serrées sur leurs genoux, avec le silence de gens qui attendent. Au bout du couloir, dans la pénombre, on devine des entailles sur un mur.

---

### Niveau 2 : lr-bastion-herse (la herse coincée et le treuil brisé, mécanisme), dans lr-bastion

**Héritage** (recopié du bloc « Héritage et nuances propres à ce lieu » de lr-bastion, niveau 1, ne pas modifier) :
- Héritage : charte de la région 1. Nuances : pierre noire de la tour couverte de coulures de rouille, herse de fer rouillé, drapeau impérial en lambeaux, gouttes d'acide qui tombent des câbles, câbles et chaînes du pont-levis qui pendent, odeur de métal mouillé.

- **Dimensions et structure** : passage voûté de 8 m de large sur 10 m de long, entre la cour (au nord) et la chaussée (au sud) ; voûte de pierre noire haute de 4 m. La herse, grille de fer de 8 m sur 4 m, glisse dans deux rails verticaux creusés dans les murs de la voûte ; elle est restée aux trois quarts descendue, à 1,5 m du pavé. La niche du treuil est creusée dans le mur est, à 2 m du pavé, 4 m de large sur 2 m de profondeur.
- **Matériaux et état** : pierre noire de la voûte, couverte de rouille ; fer de la herse rongé, barreaux creux ; chaînes de fer qui relient la herse au treuil ; traînées jaunes d'acide sur la pierre et sur le pavé ; dents rongées en creux sur les roues.
- **Lumière** : grise, venue du sud, qui filtre entre les barreaux de la herse et pâlit les pavés ; du côté nord, la lumière de la cour et des torches de suif.
- **Sons** : chaînes qui battent contre la herse au moindre vent, grincement des roues quand on les touche, goutte d'acide qui tombe sur le fer avec un petit sifflement.
- **Odeurs** : acide âcre, huile figée des roues, rouille.
- **Température** : courant d'air froid qui s'engouffre sous la voûte.
- **Éléments remarquables** (chacun avec sa place) :
  - herse de fer rouillé, en travers du passage, descendue aux trois quarts, pendue à deux rails ; un homme à pied passe dessous en se courbant.
  - rails verticaux de pierre noire, dans les murs de la voûte, où glisse la herse.
  - niche du treuil, dans le mur est, à 2 m du pavé : un arbre de fer et quatre roues dentées.
  - quatre roues dentées du treuil, chacune avec une encoche numérotée de 1 à 4 ; les dents de plusieurs roues sont rongées en creux.
  - chaînes de fer qui pendent de la herse et montent vers le treuil.
  - traînées jaunes d'acide sur la pierre de la voûte, sous la niche, et sur le pavé.
  - départ de la rigole d'acide, au pied de la herse, qui file au nord vers la cour.
  - fanion impérial déchiré, noué à la chaîne du treuil, à hauteur d'homme.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `lr-bastion-cour` (nord) : description (vue de la herse) : « Passage voûté qui remonte au nord vers la cour ; au bout, les pavés et la lumière des torches de suif. » ; retour (vue de la cour) : « Passage voûté au sud de la cour, entre deux murs de pierre noire, qui s'enfonce vers la herse rouillée et le ciel gris de la chaussée. »
  - vers `lr-viaduc-tablier` (sud) : description (vue de la herse) : « Au-delà de la herse, la chaussée se prolonge sur le tablier de fer, qui file droit vers le sud au-dessus du torrent. » ; retour (vue du tablier) : « Au nord, la herse rouillée barre l'entrée du poste, ses barreaux pendus à hauteur de poitrine au-dessus de la chaussée. »
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | énigme | remettre les quatre roues du treuil dans l'ordre de l'arbre ; l'acide a rongé des dents, et les encoches (1 à 4) et les dents restées saines indiquent l'ordre | niche du treuil, dans le mur est | à créer | Investigation |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : aucun.
- **Un détail propre à ce lieu** : un fanion impérial déchiré est noué à la chaîne du treuil, à hauteur d'homme, et personne ne l'a retiré.

**Champs dérivés**
- **resume** : La herse rouillée du passage sud, restée coincée, dont le treuil fondu bloque les convois.
- **accroche** (vue du dehors depuis la cour) : Au bout d'un passage voûté, une grille de fer rouillé pend presque jusqu'au pavé, et du métal rongé luit sous une niche.
- **visuel** : Un passage voûté de pierre noire, couvert de coulures de rouille, ferme la route au sud par une herse de fer aux barreaux rongés, descendue aux trois quarts et pendue à deux rails. À l'est, dans une niche à deux mètres du pavé, un treuil de fer porte quatre roues dentées, rongées en creux et marquées chacune d'une encoche. La lumière grise de la chaussée filtre entre les barreaux et pâlit les pavés, tandis que des traînées jaunes d'acide courent sous la niche.
- **ambiance** : Herse rouillée, roues rongées, acide qui goutte.
- **description** : Le passage sud est le verrou du Bastion : une herse de fer qui devait tomber en cas d'assaut, et qui est restée coincée aux trois quarts de sa course. Les péagers ont eu beau tirer sur la chaîne, rien ne bouge. Le problème vient du treuil. La niche à l'est abrite un arbre de fer et quatre roues dentées, chacune marquée d'une encoche numérotée de 1 à 4. Les dents de plusieurs roues sont rongées en creux, et les traînées jaunes d'acide sur la pierre, sous la niche, montrent que le mal est venu d'en haut, par coulures, et non par un choc. Pour remettre la herse en marche, il faut remonter les roues dans l'ordre de l'arbre, en se fiant aux encoches et aux dents restées saines. Les péagers n'ont pas de rechange : la pièce qui manque n'est pas dans le poste, et il faudra la chercher ailleurs. Tant que la herse reste coincée, aucun convoi ne passe ; un homme à pied, lui, se courbe et passe dessous. Au nord, la cour ; au sud, la chaussée et le tablier, au-dessus du torrent.
- **arrivee** : Le passage vous avale, et la voûte de pierre noire renvoie le bruit de vos pas. Au bout, la herse rouillée barre la route, ses barreaux pendus à hauteur de poitrine ; la lumière grise de la chaussée filtre entre eux et pâlit les pavés. Les chaînes battent contre le fer au moindre souffle de vent, et une goutte d'acide tombe quelque part avec un petit sifflement. À l'est, dans la niche, le treuil luit faiblement : quatre roues dentées, rongées en creux, avec une encoche gravée sur chacune. Un fanion impérial déchiré, noué à la chaîne, pend à hauteur d'homme.

---

### Niveau 2 : lr-viaduc-tablier (le tablier du viaduc et ses piles, pont), dans lr-bastion

**Héritage** (recopié du bloc « Héritage et nuances propres à ce lieu » de lr-bastion, niveau 1, ne pas modifier) :
- Héritage : charte de la région 1. Nuances : pierre noire de la tour couverte de coulures de rouille, herse de fer rouillé, drapeau impérial en lambeaux, gouttes d'acide qui tombent des câbles, câbles et chaînes du pont-levis qui pendent, odeur de métal mouillé.

- **Dimensions et structure** : chaussée de 8 m de large sur environ 60 m de long, du sud de la herse à la rive sud, à une vingtaine de mètres au-dessus du torrent d'Oxyde. Une grande arche de fer enjambe le torrent du nord au sud, au-dessus de la chaussée. Deux piles : la pile nord, à l'extrémité nord du tablier (y 40 à 46), au bord de la rive nord, en pierre et fer, haute d'une vingtaine de mètres ; la pile centrale, au milieu de la chaussée, dans le lit du torrent.
- **Matériaux et état** : plaques de fer rouillées et glissantes, et dalles de pierre noire pour la chaussée ; arche de fer rongée par endroits ; piles de pierre et de fer, la base de la pile centrale rongée en creux ; câbles du pont-levis tendus de l'arche jusqu'aux bords du tablier.
- **Lumière** : jour gris, tombant du ciel sans ombre franche ; aucune lampe, aucune torche.
- **Sons** : vent qui siffle dans l'arche, torrent qui gronde vingt mètres plus bas, claquement sec des câbles, et par endroits un grignotement.
- **Odeurs** : métal mouillé, acide, vent froid qui descend des crêtes.
- **Température** : froide ; le vent est plus fort sur le tablier qu'au poste.
- **Éléments remarquables** (chacun avec sa place) :
  - grande arche de fer, qui enjambe le torrent d'un bord à l'autre au-dessus de la chaussée.
  - câbles pendants, depuis les sommets de l'arche jusqu'aux crochets des bords du tablier ; ils luisent d'une bave acide.
  - pile nord, à l'extrémité nord du tablier, en pierre et fer ; une échelle de fer rongée est fixée à sa face ouest et descend le long de la pierre vers une corniche d'ombre.
  - pile centrale, au milieu du torrent, sa base rongée en creux.
  - plaques de fer rouillées et dalles noires de la chaussée, sans garde-fou.
  - tronçon de chaîne tombé sur la chaussée, au bord ouest, aux maillons rongés.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `lr-bastion-herse` (nord) : description (vue du tablier) : « Au nord, la herse rouillée barre l'entrée du poste, ses barreaux pendus à hauteur de poitrine au-dessus de la chaussée. » ; retour (vue de la herse) : « Au-delà de la herse, la chaussée se prolonge sur le tablier de fer, qui file droit vers le sud au-dessus du torrent. »
  - vers `lr-camp-refugies` (sud, rive opposée) : description (vue du tablier) : « Tablier qui file vers le sud, plat et large, jusqu'à la terre rouge de la rive opposée, où des bâches grises s'agitent. » ; retour (vue du camp) : « Plaques de fer qui s'arrêtent sur la terre rouge ; le pont s'étire au nord jusqu'au poste. »
  - vers `lr-grotte-entree` (échelle de fer, pile nord) : description (vue du tablier) : « Échelle de fer rongée, fixée à la pile nord, qui descend le long de la pierre vers une corniche d'ombre. » ; retour (vue de la grotte) : « Échelle de fer rongée qui monte le long de la pile vers le tablier ; la corniche est rongée et des poutres percées tiennent la roche au-dessus. »
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | combat | des oxydeurs rongent les câbles de l'arche, près de la pile centrale : **1 pour 4 héros, 2 pour 6 héros** | câbles pendants, au-dessus de la pile centrale | `oxydeur` | combat |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : à Fièvre de Fer 2 (pitch §4), les oxydeurs ont attaqué les soubassements : la base de la pile centrale est rongée plus profondément. À Fièvre de Fer 3, les câbles du pont-levis menacent de rompre : ils pendent plus bas et tirent la chaussée à chaque rafale.
- **Un détail propre à ce lieu** : un tronçon de chaîne tombé sur la chaussée, dont les maillons sont rongés comme des dents, est resté là depuis le dernier convoi.

**Champs dérivés**
- **resume** : Le tablier du viaduc, où les câbles de l'arche s'usent au-dessus du torrent.
- **accroche** (vue du dehors depuis la cour) : Une arche de fer s'élève au-delà du poste, reliée à lui par une chaussée de plaques rouillées, et des câbles pendent de ses sommets.
- **visuel** : Une arche de fer franchit le torrent d'un bord à l'autre, au-dessus d'une chaussée de plaques rouillées et de dalles noires. Au nord, près du poste, une pile de pierre et de fer s'élève, et une échelle de fer rongée est fixée à sa face ouest ; au milieu du torrent, une pile centrale a la base rongée en creux. Des câbles pendent de l'arche jusqu'aux bords du tablier, luisants d'une bave acide, et le jour gris tombe sans ombre franche sur le tout.
- **ambiance** : Vent dans l'arche, câbles, torrent rouge.
- **description** : Le tablier mène au sud, vers la rive opposée. Il est large de huit mètres et court au-dessus du torrent d'Oxyde sur une soixantaine de mètres, sans garde-fou, à vingt mètres au-dessus de l'eau. La pile nord est à son extrémité, au bord de la rive nord : une échelle de fer rongée est fixée à sa face ouest, et elle descend vers une corniche d'ombre, puis vers la Grotte des Rouilles (voir lr-grotte-entree). Les câbles qui pendent de l'arche tiennent la chaussée par des crochets, et la pile centrale les sépare en deux portions. C'est sur les câbles, près de la pile centrale, que les oxydeurs se sont accrochés : ils rongent les attaches, un maillon après l'autre, avec un grignotement continu qu'on entend de loin. Le combat se fait à découvert, sur des plaques glissantes, et le vide est partout. Les bêtes ne sont là que pour manger le fer ; on les voit aller et venir sur les câbles, puis disparaître sous la pile centrale. Le tablier est aussi l'endroit où l'on comprend que l'arche ne tient plus qu'à ses attaches : si le pont cède, il cède ici. Vers le sud, la chaussée s'arrête sur la terre rouge de la rive opposée.
- **arrivee** : Le tablier s'étend devant vous, plaques de fer rouillées et dalles noires, sous une arche qui se perd dans le ciel gris. Le vent siffle dans les barreaux de l'arche, plus fort qu'au poste, et le torrent gronde vingt mètres plus bas, rouge et bruyant. Au-dessus de vous, des câbles pendent à leurs crochets, et l'un d'eux claque sec, comme un fouet. Sur le bord de la chaussée, un tronçon de chaîne est tombé, ses maillons rongés comme des dents. Le poste reste derrière vous, et au bout des plaques, la terre rouge de l'autre rive.

---

### Niveau 2 : lr-camp-refugies (le camp des réfugiés de la rive sud, camp), dans lr-bastion

**Héritage** (recopié du bloc « Héritage et nuances propres à ce lieu » de lr-bastion, niveau 1, ne pas modifier) :
- Héritage : charte de la région 1. Nuances : pierre noire de la tour couverte de coulures de rouille, herse de fer rouillé, drapeau impérial en lambeaux, gouttes d'acide qui tombent des câbles, câbles et chaînes du pont-levis qui pendent, odeur de métal mouillé.

- **Dimensions et structure** : camp de 40 m est-ouest sur 30 m nord-sud, sur la terre rouge de la rive sud, au bout du tablier. Une soixantaine de tentes en rangs irréguliers, des charrettes, des foyers. Au sud, à la fourche, la route se sépare : la Voie Royale de Fer file vers le sud-est, le Défilé des Forges vers l'ouest.
- **Matériaux et état** : tentes en bâches de convoi déchirées, tendues sur des perches ; terre rouge piétinée ; charrettes à roues cerclées de fer ; foyers de pierre noire et de charbon.
- **Lumière** : jour gris, sans ombre franche ; la nuit, les réfugiés entretiennent des feux de charbon dans leurs foyers de pierre, et leur lueur orange se voit de loin depuis le tablier.
- **Sons** : voix basses, toux, une femme qui chante très bas, claquement des bâches au vent, grondement du torrent plus au nord.
- **Odeurs** : fumée de charbon, eau de pluie sur la toile, suif.
- **Température** : froide et humide ; le vent du nord pousse la fumée dans les tentes.
- **Éléments remarquables** (chacun avec sa place) :
  - tentes de bâches de convoi, en rangs irréguliers ; la tente de Mira Sorel, la plus proche du tablier, au nord.
  - foyers de charbon, au centre du camp, entourés de pierres noires.
  - charrettes à roues cerclées de fer, alignées au sud, à la fourche.
  - borne de pierre noire à la fourche des deux routes, gravée de deux flèches.
  - bâche marquée du sceau impérial, tendue à l'envers entre deux charrettes.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `lr-viaduc-tablier` (nord, le pont) : description (vue du camp) : « Plaques de fer qui s'arrêtent sur la terre rouge ; le pont s'étire au nord jusqu'au poste. » ; retour (vue du tablier) : « Tablier qui file vers le sud, plat et large, jusqu'à la terre rouge de la rive opposée, où des bâches grises s'agitent. »
  - vers `sepulcre-d-or` (Voie Royale de Fer, sud-est, 14 h ; **lien absent**) : description (vue du camp) : « Voie Royale de Fer, large chaussée pavée de fer qui file vers le sud-est, quatorze heures de marche jusqu'à la capitale. » ; retour (lien absent) : « La fiche d'arrivée, à Sépulcre-d'Or, reste à écrire ; elle devra répondre à cette route. »
  - vers `le-gantelet-d-airain` (Défilé des Forges, ouest, 10 h ; **lien absent**) : description (vue du camp) : « Défilé des Forges, passage de pierre et de rocaille qui file vers l'ouest, dix heures de marche jusqu'au Gantelet d'Airain. » ; retour (lien absent) : « La fiche d'arrivée, au Gantelet d'Airain, reste à écrire ; elle devra répondre à ce défilé. »
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ (rencontre sociale) | Mira Sorel, sœur de Joran, attend sur la rive sud depuis que le pont est fermé ; elle demande des nouvelles de son frère et dit ce qu'elle a vu des lames la nuit | tente de Mira, au nord | `mira-sorel` | Persuasion, ou lui rapporter des nouvelles de Joran |
  | contrat (hors budget) | « La veille du camp » : défense en deux vagues, donneuse Mira Sorel | foyers de charbon, au centre | `la-veille-du-camp` (rencontres `veille-du-camp-premiere-volee`, `veille-du-camp-assaut`) | `creer-contrats` |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : aucun.
- **Un détail propre à ce lieu** : la bâche marquée du sceau impérial est tendue à l'envers entre deux charrettes, comme si l'on avait voulu ne plus voir le sceau ; c'est la seule trace d'autorité dans le camp.

**Champs dérivés**
- **resume** : Le camp des réfugiés de la rive sud, où l'on attend des nouvelles du pont et de ceux qui le traversent.
- **accroche** (vue du dehors depuis le tablier) : De l'autre côté de l'arche, des tentes de bâches grises et des feux de charbon sur la terre rouge, où la route se sépare.
- **visuel** : Un camp de tentes faites de bâches de convoi déchirées, tendues sur des perches en rangs irréguliers, sur une terre rouge piétinée. Au centre, des foyers de charbon entourés de pierres noires laissent monter une fumée que le vent du nord pousse vers les tentes ; au sud, des charrettes à roues cerclées de fer encadrent une borne de pierre gravée de deux flèches, à la fourche des deux routes. Le jour gris tombe sans ombre franche, et la lueur des foyers, le soir, se voit de loin depuis le pont.
- **ambiance** : Bâches, fumée de charbon, route qui se sépare.
- **description** : Le camp est installé sur la rive sud, au bout du tablier. Une soixantaine de tentes en bâches de convoi déchirées, plus d'une centaine de personnes, des charrettes, des foyers de charbon. Ce sont des pèlerins et des ouvriers du viaduc qui ont trouvé refuge ici en fuyant les lames. C'est aussi ici que la route se sépare : la Voie Royale de Fer file au sud-est vers la capitale, quatorze heures de marche, et le Défilé des Forges part vers l'ouest, dix heures jusqu'au Gantelet d'Airain. Le camp est le site d'un contrat de défense : Mira Sorel demande qu'on veille avec le camp à la tombée de la nuit, car les lames visent le fer des charrettes et des foyers et reviennent par vagues. Mira Sorel, la sœur de Joran, a dressé sa tente au nord, face au tablier, et elle attend depuis que le pont est fermé. Son frère est aux fers de l'autre côté du pont, et elle n'a aucun moyen de le voir. Elle parle franchement à qui la respecte, et demande qu'on le sorte de là. Elle raconte ce qu'elle a vu des lames la nuit, passer au-dessus de l'eau ; elle n'a pas vu le poste de près, et ne sait pas ce qui s'y passe. La rencontre se joue par la Persuasion, et Mira en dit plus à qui promet de rapporter une nouvelle. La bâche marquée du sceau impérial, tendue à l'envers entre deux charrettes, est le seul signe d'autorité qu'on voit ici.
- **arrivee** : Les tentes apparaissent les premières, de bâches grises et déchirées, collées à la terre rouge. L'odeur de fumée de charbon vous prend à la gorge, mêlée à l'humidité de l'eau de pluie sur la toile. Des voix basses passent entre les tentes, une toux, le bruit d'un seau, et quelque part une femme chante très bas, sans s'arrêter. Au centre, un foyer de charbon ronfle entre des pierres noires, et sa fumée remonte vers les charrettes. Derrière vous, le tablier franchit le torrent, et ses câbles claquent dans le vent.

---

## Cas limites du Bastion (règle n+1)

- **Élinor Vane meurt ou s'enfuit** : le rapport et la recette restent dans la tour ; les péagers, sans ordre, laissent Brisk décider.
- **Brisk meurt** : la clé des cellules se trouve sur lui. **La clé est perdue** : le cadenas se force (Outils de voleur).
- **Aldric Ponts meurt** : le serment des Gardiens s'apprend encore à la chapelle du Temple, et le rapport des ingénieurs, dans la tour, mentionne le treuil de rechange du Temple.
- **Joran meurt** : Mira Sorel l'apprend au camp et ne parle plus que de cela ; la piste des drains reste lisible dans la cave de la villa.
- **Le treuil de rechange est perdu** : la herse reste coincée, le viaduc reste fermé aux convois ; les pistes à pied demeurent.
