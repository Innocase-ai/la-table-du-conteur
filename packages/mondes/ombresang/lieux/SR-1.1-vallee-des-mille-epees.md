# SR 1.1 — La Vallée des Mille Épées : les lieux (V4, niveau 1, lieu par lieu)

**Module :** *Le Sang sur la Lame* (voir [`../PITCH-LAME-ROUSSE.md`](../PITCH-LAME-ROUSSE.md), V1 validé). **Fil rouge :** [`../FIL-ROUGE.md`](../FIL-ROUGE.md), prologue.
**Héritage (niveau 0)** : la charte de la région 1 (atlas `01-region-cretes-de-fer-titan.md` §3) : acier météorique sombre, rouille sanglante, ocre de limaille, noir de charbon, névés, lueur orange de forge ; vent glacial chargé de limaille, rivières rouge-rouille, grondement des marteaux-pilons, éclairs magnétiques sur les lames géantes.

Les cinq lieux de la sous-région, dans l'ordre choisi avec l'utilisateur :

| N° | Lieu | Statut |
| :-: | :--- | :--- |
| 1 | 🏘️ Village de Lame-Rousse | **validé le 08/11/2026 (V4, lieu 1/5), gelé** |
| 2 | 🏰 Bastion du Pont-Viaduc | **validé le 08/11/2026 (V4, lieu 2/5), gelé** |
| 3 | 🕳️ Grotte des Rouilles | **validé le 08/11/2026 (V4, lieu 3/5), gelé** |
| 4 | ⛩️ Temple du Glaive Brisé | **validé le 08/11/2026 (V4, lieu 4/5), gelé** |
| 5 | 🗿 Forêt d'Acier | **validé le 08/11/2026 (V4, lieu 5/5), gelé** |

---

## Niveau 1 : lr-village (Village de Lame-Rousse, bourg de forgerons — le hub)

> **Validé par l'utilisateur le 08/11/2026** (V4, lieu 1/5). Gelé : toute modification passe par lui. Corrigé après audit le 08/11/2026 avec l'accord de l'utilisateur (estrade, voisin de la place, budget, état actuel). Décisions confirmées : Joran au pilori de la place (emmené au Bastion si le groupe tarde) ; la Baillie paraît sur l'estrade puis se retire au Bastion ; noms Odile Braise, Gorm Meule, *La Lame Émoussée*, *Les Mains Tendues* ; pas d'énigme au village.

### Héritage et nuances propres à ce lieu
- Héritage : charte de la région 1 (ci-dessus).
- Nuances : toits de tôle rapiécée et de bardeaux noircis, étincelles jaunes sous les meules, cheminées qui crachent un suif gris, lames de tous âges rangées en gerbes contre les murs, haillons de cuir bouilli, roues à aubes qui grincent sur le torrent d'Oxyde.

### Plan vu de dessus
- **Forme générale** : un bourg de 800 âmes en fer à cheval ouvert vers le sud, bâti autour du viaduc ; une place centrale, vingt forges à aubes alignées le long du torrent, quelques ruelles de terre rouge.
- **Limites** : le torrent d'Oxyde à l'est ; la Forêt d'Acier (champ d'épées géantes) au nord et à l'ouest ; le viaduc et son Bastion à l'extrême sud.
- **Orientation** : nord en haut ; la route du viaduc arrive par le sud, la Voie Royale de Fer file vers le sud-est ; les pistes vers la Cuirasse (nord) et les Landes de Limaille (est) partent de la place.
- **Éléments naturels** : le torrent rouge rouille, des roches à vif, des épées géantes qui dépassent des toits.
- **Quartiers** : la place des Ferrailleurs (centre), la rangée des forges à aubes (est, le long de l'eau), les ruelles de l'auberge et de l'apothicairerie (centre-sud), la colline de la Baillie (nord-est), l'atelier isolé de Vorn (nord-ouest, face à la Forêt d'Acier).

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| lr-place | la place des Ferrailleurs | place | **ouverture** (combat), Joran au pilori, annonces | (50, 50) | grande | lr-auberge, lr-apothicairerie, lr-forges, lr-villa, lr-forge-vorn, lr-bastion-cour (sud), lr-temple-parvis (par le sentier des Gardiens, à l'ouest) |
| lr-auberge | l'auberge *La Lame Émoussée* | auberge | repos, rumeurs, tableau des contrats, refuge (Fièvre de Fer 3) | (33, 62) | moyenne | lr-place |
| lr-apothicairerie | l'apothicairerie *Les Mains Tendues* | boutique-soins | soins, piste des oxydeurs, quête de Sœur Martha | (64, 64) | petite | lr-place |
| lr-forges | la rangée des forges à aubes | atelier | **commerce** (armes, armures), réparation, rumeurs des lames | (80, 46) | grande | lr-place |
| lr-villa | la villa de la Baillie (colline) | maison | **infiltration** : piège, trésor, le registre de scories, les drains | (72, 20) | moyenne | lr-place, lr-grotte-drains (par les vieux drains) |
| lr-forge-vorn | la forge de Vorn | atelier | **dénouement** (choix moral), fragment d'enclume | (16, 20) | moyenne | lr-place, lr-foret-lisiere (par la piste des ferrailleurs) |

### Budget de contenu (proposé, à décider avec l'utilisateur)
- **Combats : 2** · **Rencontres sociales : 5** · **PNJ : 5** · **Énigmes : 0** · **Pièges : 1** · **Trésors : 2**
- **Répartition :**
  - Combats : la place (3 `epee-volante`, avec la milice : ouverture) ; la forge de Vorn (3 `epee-volante` qui défendent le foyer, si on le force ou si on l'éteint) ; 2 **contrats** affichés à l'auberge, **hors budget** (cibles dans la Forêt d'Acier, écrits avec `creer-contrats` : « Le chargement de Gorm » (campement) et « La lame fendue » (allée)).
  - PNJ : `vorn-bras-de-laiton` (forge), `soeur-martha` (apothicairerie), `joran-deserteur` (place, pilori), `odile-braise` (aubergiste), `gorm-meule` (forgeron-marchand des forges à aubes).
  - Rencontres sociales : Joran qui plaide sa cause ; Sœur Martha et ses blessés ; Odile et les rumeurs ; Gorm et les lames de sa dernière fournée ; Vorn et le choix. La Baillie Élinor Vane paraît sur l'estrade de la place (scène de l'ouverture), puis se retire au Bastion (lieu 2).
  - Piège : la serrure du bureau de la Baillie (villa).
  - Trésors : la caisse du péage (villa) ; la réserve de Gorm (une potion de soins). Le registre de livraisons de scories (villa) est un objet de quête, pas un trésor.
  - Services : repos et rumeurs (auberge) ; soins (apothicairerie) ; armes et armures du catalogue SRD, réparation (forges).
  - Objets de quête : le **fragment d'enclume** (forge de Vorn) et le **registre de livraisons de scories** (villa).

### Histoire et état actuel
- Lame-Rousse vit depuis trois siècles de la ferraille divine : on arrache, polit et revend les lames plantées dans la vallée. Depuis trois nuits, les lames forgées s'animent ; depuis hier, les épées de la vallée se soulèvent ; le village s'enferme et se querelle.

### Jour, nuit, mauvais temps
- **Jour** : forges qui cliquètent, marteaux-pilons, vent de limaille, ferrailleurs qui discutent des lames « vivantes ».
- **Nuit** : les volets sont clos, les lames se dressent dans le noir, la forge de Vorn rougeoie seule au nord-ouest.
- **Mauvais temps** : des éclairs magnétiques frappent les épées géantes ; les lames errantes sont plus nombreuses.

### Ce que le joueur voit en arrivant
- Une place où une charrette de ferraille vient de se renverser, des lames qui frémissent, une estrade où la Baillie, en robe impériale, hurle qu'on garde son calme, un jeune soldat aux fers au pilori, la foule qui recule.

### Secret du MJ (jamais dans `visuel`, `resume`, `accroche`)
- Joran est innocent : il a vu les monstres de rouille sortir des **drains de la villa** de la Baillie (ils mènent à la Grotte des Rouilles). Le **registre de livraisons de scories** est dans un tiroir à double fond du bureau de la Baillie, avec la caisse du péage ; il mène à la Forge Crânienne de Draven Kael. Le fragment d'enclume, dans la forge de Vorn, **bat comme un pouls** (premier signe du Cœur) ; Vorn a une écharde d'Ichor dans la poitrine. Gorm sait que toutes les lames qui s'animent viennent de la fournée de Vorn.
- **Joran** : au pilori de la place au début ; si le groupe tarde (Fièvre de Fer à 2), la Baillie l'emmène au Bastion (lieu 2), où on peut encore l'interroger.

### Composition de la carte (`carte-lr-village`, pour `images.json`)

> Un bourg de forgerons en fer à cheval ouvert au sud ; une place de terre rouge au centre avec une estrade et un pilori ; le long d'un torrent rouge rouille à l'est, une rangée de vingt forges à roues à aubes ; au nord-est, une villa de pierre sur une colline ; au nord-ouest, une forge isolée aux flammes orange face à un champ d'immenses épées plantées ; au sud, le viaduc de fer et de pierre franchissant le torrent.

---

## Niveau 1 : lr-bastion (Bastion du Pont-Viaduc, poste de péage et de garde)

> **Validé par l'utilisateur le 08/11/2026** (V4, lieu 2/5). Gelé : toute modification passe par lui. Passé à l'audit de cohérence (3 passes, conforme avec remarques).

### Héritage et nuances propres à ce lieu
- Héritage : charte de la région 1. Nuances : pierre noire de la tour couverte de coulures de rouille, herse de fer rouillé, drapeau impérial en lambeaux, gouttes d'acide qui tombent des câbles, câbles et chaînes du pont-levis qui pendent, odeur de métal mouillé.

### Plan vu de dessus
- **Forme générale** : un poste fortifié carré sur la rive nord du torrent d'Oxyde, au pied du viaduc : une tour de péage à l'angle nord-est, une cour pavée, un corps de garde à l'ouest, la herse en travers de la chaussée au sud ; l'arche de fer du viaduc part vers le sud au-dessus du torrent.
- **Limites** : le mur d'enceinte (nord, vers le village) ; au sud, le torrent d'Oxyde en contrebas, qui coule d'est en ouest sous l'arche (il longe le village à l'est avant de tourner sous le viaduc) ; le vide sous l'arche.
- **Orientation** : nord en haut ; le village est au nord, la rive sud (camp des réfugiés) au-delà du viaduc. **Sur la rive sud, la route se sépare** : la Voie Royale de Fer file vers le Sud-Est (la capitale, 14 h) et le Défilé des Forges part vers l'Ouest (le Gantelet d'Airain, SR 1.2, 10 h). C'est pourquoi le viaduc fermé coupe les deux routes pour les convois.
- **Voies d'accès** : la porte nord (de la place du village), la herse au sud, l'escalier à vis de la tour, une échelle de fer le long de la pile nord (vers la Grotte des Rouilles).
- **Éléments naturels** : le torrent rouge rouille, des roches rongées par l'acide.
- **Quartiers** : la cour (centre), la tour de péage (nord-est), le corps de garde et ses cellules (ouest), la herse et le treuil (sud), le tablier du viaduc (extrême sud).

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| lr-bastion-cour | la cour du poste | cour | négociation, accès à tout le poste, hommes de main de la Baillie | (50, 40) | grande | lr-bastion-tour, lr-bastion-cellules, lr-bastion-herse, lr-place |
| lr-bastion-tour | la tour de péage | tour | **rencontre** (Élinor Vane), rapport des ingénieurs, bureau | (72, 22) | moyenne | lr-bastion-cour |
| lr-bastion-cellules | les cellules de la quarantaine | geôle | **révélation** (ingénieurs enfermés, Joran s'il a été transféré), piège | (24, 34) | petite | lr-bastion-cour |
| lr-bastion-herse | la herse coincée et le treuil brisé | mécanisme | **énigme** (engrenages), quête de la pièce de rechange | (50, 62) | moyenne | lr-bastion-cour, lr-viaduc-tablier |
| lr-viaduc-tablier | le tablier du viaduc et ses piles | pont | **combat**, danger, accès à la Grotte des Rouilles par la pile nord | (50, 82) | grande | lr-bastion-herse, lr-camp-refugies, lr-grotte-entree (par la pile nord) |
| lr-camp-refugies | le camp des réfugiés de la rive sud | camp | rencontre (la sœur de Joran), contrat | (50, 95) | moyenne | lr-viaduc-tablier |

### Budget de contenu (proposé, à décider avec l'utilisateur)
- **Combats : 2** · **Rencontres sociales : 4** · **PNJ : 4** · **Énigmes : 1** · **Pièges : 1** · **Trésors : 1**
- **Répartition :**
  - Combats : la cour (hommes de main de la Baillie, seulement si l'on force le poste ou si l'on libère Joran) : **pour 4 héros, 2 `bandit` et 1 `eclaireur` ; pour 6 héros, 3 `bandit` et 2 `eclaireur`** ; le tablier (`oxydeur` qui rongent les câbles) : **1 pour 4 héros, 2 pour 6 héros**.
  - PNJ : `elinor-vane` (tour), `aldric-ponts` (ingénieur en chef, cellules), `mira-sorel` (sœur de Joran, camp), `brisk-sergent` (sergent des péagers, cour). Joran n'y est **que si le groupe a tardé** (Fièvre de Fer à 2) : sinon il est au pilori de la place.
  - Rencontres sociales : la négociation avec Élinor ; l'interrogatoire de Joran si l'on tarde ; la révélation d'Aldric ; la sœur de Joran au camp.
  - Énigme : les engrenages fondus de la herse (mécanisme à remettre dans l'ordre, après avoir constaté l'acide).
  - Piège : la dalle de la cellule qui lâche sur la fosse (un seul piège).
  - Trésor : la recette du péage du jour (coffre de la tour, 40 po). La **clé des cellules** (sur le sergent Brisk) est un objet de quête, pas un trésor. La grosse caisse du péage, elle, est dans la villa d'Élinor (voir le village).
  - Objet de quête : la **pièce de rechange du treuil** est au Temple du Glaive Brisé (lieu 4), non ici.

### Histoire et état actuel
- Poste impérial de péage et de garde depuis la pose du viaduc ; la garnison a déserté ou a été massacrée, le poste est tenu par les seuls péagers d'Élinor Vane, qui a fermé la route « pour la sécurité ».

### Jour, nuit, mauvais temps
- **Jour** : péagers qui regardent la herse sans la toucher, grincements du pont, acide qui goutte.
- **Nuit** : torches rouges sur le mur, on entend ronger la pile centrale.
- **Mauvais temps** : le vent siffle dans l'arche, des éclairs magnétiques frappent les câbles, le tablier vibre.

### Ce que le joueur voit en arrivant
- Une herse rouillée barrant la route, une tour de pierre noire où une femme en robe impériale compte des pièces, des péagers armés qui hésitent, la grande arche de fer et ses câbles pendants au-dessus du torrent.

### Secret du MJ (jamais dans `visuel`, `resume`, `accroche`)
- Élinor sait que les piles s'effondrent et refuse de payer les réparations : elle veut qu'on lui rachète ses stocks de minerai à prix d'or, puis fuir avec la grosse caisse du péage, qu'elle garde dans sa villa. Elle a enfermé **Aldric Ponts** et ses ingénieurs sous prétexte de « quarantaine » pour qu'ils ne réparent pas le pont ni n'envoient leur rapport au Sénat.
- La herse est coincée parce que **Joran** a tenté de l'abaisser pour sauver une caravane de pèlerins poursuivie par des lames : les engrenages ont été fondus par l'acide d'un oxydeur. Aldric sait qu'un treuil de rechange est conservé au **Temple du Glaive Brisé** ; il en connaît la garde et le **serment des Gardiens** qui la fait céder.
- Les oxydeurs rongent le viaduc parce qu'ils fuient les scories toxiques (voir le registre de la villa) ; la **Reine des Rouilles** a son nid sous la pile nord (Grotte, lieu 3), accessible par l'échelle de fer.

### Composition de la carte (`carte-lr-bastion`, pour `images.json`)

> Un poste fortifié carré en pierre noire, au pied d'un grand viaduc d'arches de fer ; une tour de péage à l'angle nord-est, une cour pavée au centre, un corps de garde à l'ouest, une herse rouillée en travers de la chaussée au sud ; le torrent rouge rouille en contrebas sous l'arche ; au loin, au-delà de l'arche, un camp de tentes de réfugiés sur l'autre rive.

---

## Niveau 1 : lr-grotte (Grotte des Rouilles, cavernes sous la pile nord du viaduc)

> **Validé par l'utilisateur le 08/11/2026** (V4, lieu 3/5). Gelé : toute modification passe par lui. Passé à l'audit de cohérence (conforme après corrections).

### Héritage et nuances propres à ce lieu
- Héritage : charte de la région 1. Nuances : roche rouge-ocre rongée en dentelle, suintements d'acide jaune, poutres de fer percées comme du fromage, flaques de rouille liquide, odeur de métal chaud et de sang séché, éclats de lumière qui tombent des fissures du viaduc.

### Plan vu de dessus
- **Forme générale** : un réseau de cavernes sous la pile nord du viaduc, du nord (l'entrée sur la pile) vers le sud (le nid), en forme de goutte étirée ; une galerie principale sous le tablier, des boyaux latéraux, une grande salle centrale, un nid au fond.
- **Limites** : la roche, la pile de pierre et de fer du viaduc au-dessus, le torrent d'Oxyde en contrebas au sud (les galeries basses sont inondables par gros temps).
- **Orientation** : nord en haut ; l'entrée est au nord (l'échelle de fer qui descend du tablier du viaduc, à l'entrée du pont côté Bastion, le long de la pile nord), un long boyau part vers le nord-est et rejoint les vieux drains de la colline de la Baillie, une fissure à l'est laisse suinter des scories.
- **Voies d'accès** : l'échelle de fer (depuis le tablier du viaduc, côté Bastion), les vieux drains (depuis la villa de la Baillie, étroits et cachés), la fissure des scories (inaccessible de l'extérieur).
- **Éléments naturels** : roche rouge-ocre, flaques d'acide, concrétions de rouille, veine de scories noires.
- **Quartiers** : la corniche d'entrée (nord), la galerie des poutres rongées (centre-nord), les vieux drains (nord-est), les cavernes rouge-ocre (centre), la veine de scories (est), le nid (extrême sud).

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| lr-grotte-entree | la corniche et l'échelle de fer | entrée | descente, **piège** (la corniche rongée) | (50, 8) | petite | lr-viaduc-tablier (par l'échelle de la pile nord), lr-grotte-galerie |
| lr-grotte-galerie | la galerie des poutres rongées | galerie | **combat** (les oxydeurs au travail), constat des dégâts | (50, 28) | grande | lr-grotte-entree, lr-grotte-drains, lr-grotte-cavernes |
| lr-grotte-drains | les vieux drains vers le village | boyau | jonction avec la villa, **piège** (poche d'acide), indice | (82, 24) | petite | lr-grotte-galerie, lr-villa (par les drains) |
| lr-grotte-cavernes | les cavernes rouge-ocre et la salle des mues | grande salle | exploration, **rencontre** (Ansel), trésor, suif d'oxydeur | (55, 58) | grande | lr-grotte-galerie, lr-grotte-veine, lr-grotte-nid |
| lr-grotte-veine | la veine de scories | fissure | **indice du fil rouge** (fûts scellés) | (85, 66) | petite | lr-grotte-cavernes |
| lr-grotte-nid | le nid de la Reine des Rouilles | nid | **combat** ou **leurre** (boss), trésor | (50, 90) | moyenne | lr-grotte-cavernes |

### Budget de contenu (proposé, à décider avec l'utilisateur)
- **Combats : 2** · **Rencontres sociales : 1** · **PNJ : 1** · **Énigmes : 0** · **Pièges : 2** · **Trésors : 2**
- **Répartition :**
  - Combats : la galerie (`oxydeur` : **2 pour 4 héros, 3 pour 6 héros**) ; le nid (**la Reine des Rouilles, un `oxydeur` de FP 1/2** — c'est le profil du catalogue, avec un nom et une fiche de texte propres — plus **1 `oxydeur` pour 4 héros, 2 pour 6 héros**). **Alternative sans combat pour la Reine** : la détourner avec le minerai de Vorn (lancer, discrétion, ou une voix calme : Dressage) ; c'est la voie de la fin C du pitch.
  - PNJ : `ansel-pique` (apprenti de Gorm Meule, disparu depuis trois jours, coincé sur une corniche des cavernes). Rencontre sociale : le sauver, apprendre ce qu'il a vu (les fûts scellés).
  - Pièges : la corniche d'entrée rongée qui cède ; la poche d'acide dans les vieux drains.
  - Trésors : la cache de ferraille de qualité dans les cavernes (40 po de métal divin) ; le « cœur de rouille » du nid (50 po).
  - Objets de quête : le **fût de scories scellé** (veine de scories, sceau de la Forge Crânienne) ; le **suif d'oxydeur** à prélever pour Sœur Martha (quête secondaire du village).
  - Effet (règle validée le 08/11/2026, ajoutée au pitch §4) : la Reine abattue ou détournée, les oxydeurs cessent de ronger la pile et la Fièvre de Fer baisse d'un palier.

### Histoire et état actuel
- Les oxydeurs ont fui la crevasse nord, empoisonnée par les scories, et ont trouvé dans la Grotte, sous le viaduc, tout le fer qu'ils voulaient. La Reine y a son nid. Ils rongent la pile nord de l'intérieur, et remontent la nuit par les vieux drains du village.

### Jour, nuit, mauvais temps
- **Jour** : filets de lumière par les fissures du viaduc, acide qui goutte, grincement des poutres rongées.
- **Nuit** : les oxydeurs remontent par les drains vers le village ; la grotte est plus calme au fond.
- **Mauvais temps** : le torrent monte, les galeries basses s'inondent, la corniche d'entrée glisse.

### Ce que le joueur voit en arrivant
- Une échelle de fer rongée qui descend le long de la pile nord, des poutres percées comme du fromage, des gouttes d'acide jaune, une odeur de métal et de rouille, des griffures qui s'enfoncent dans le noir.

### Secret du MJ (jamais dans `visuel`, `resume`, `accroche`)
- Les oxydeurs ne sont pas « méchants » : la Reine protège ses œufs. Ils sont venus ici chassés par les scories de la crevasse nord.
- Les **vieux drains** relient la Grotte à la villa de la Baillie (c'est par là que Joran a vu les monstres sortir) ; Élinor l'a su dès la première nuit, et n'a rien dit (détail validé le 08/11/2026 ; son secret dans le pitch reste la quarantaine des ingénieurs).
- La **veine de scories** est alimentée par une galerie bouchée par des **fûts scellés au sceau de la Forge Crânienne** (Draven Kael) : la preuve que les scories viennent de l'Empire. **Ansel** les a vus, d'où sa fuite sur la corniche.

### Composition de la carte (`carte-lr-grotte`, pour `images.json`)

> Un réseau de cavernes rouge-ocre vu de dessus, sous un grand pilier de fer et de pierre : une corniche et une échelle de fer au nord, une longue galerie aux poutres percées, un boyau étroit au nord-est, une grande salle centrale piquée de concrétions de rouille, une fissure noire de scories à l'est, un nid de ferraille rongée au fond au sud ; un mince filet d'eau rouge rouille au bas.

---

## Niveau 1 : lr-temple (Temple du Glaive Brisé, sanctuaire martial dans la garde d'une épée géante)

> **Validé par l'utilisateur le 08/11/2026** (V4, lieu 4/5). Gelé : toute modification passe par lui. Passé à l'audit de cohérence (conforme après corrections).

### Héritage et nuances propres à ce lieu
- Héritage : charte de la région 1. Nuances : acier gris-bleu poli par le vent, statues de chevaliers brisées, bronze verdi des portes, inscriptions de serment gravées dans la lame, mousse rouille, silence que seul trouble le chant du vent dans le fil de l'épée.

### Plan vu de dessus
- **Forme générale** : une épée géante couchée sur un replat rocheux, pointe vers le sud ; sa **garde en croix** (deux bras) forme le sanctuaire, et la gorge de la lame (le « sang-de-fer ») abrite l'arsenal.
- **Limites** : le replat de roche rouge ; au sud la pointe de l'épée s'enfonce dans la pente ; à l'ouest et au nord, la lisière de la Forêt d'Acier.
- **Orientation** : nord en haut ; le sentier des Gardiens monte du village par l'est ; le pommeau (nord) domine les cellules des gardiens, la nef est au croisement, l'arsenal au sud.
- **Voies d'accès** : le sentier des Gardiens (depuis la place du village), la lisière de la Forêt d'Acier (à l'ouest).
- **Éléments naturels** : roche rouge, mousse de rouille, vent qui chante dans la lame.
- **Quartiers** : les cellules des gardiens (nord, sous le pommeau), le parvis (bras est de la garde, côté sentier), la chapelle des serments (bras ouest de la garde), la nef (croisement), l'arsenal (gorge de la lame, au sud).

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| lr-temple-parvis | le parvis des chevaliers brisés | cour | entrée, **piège** (dalles à lames), indice du serment | (80, 35) | moyenne | lr-place (par le sentier des Gardiens), lr-temple-nef |
| lr-temple-chapelle | la chapelle des serments | chapelle | **énigme** (le serment), **rencontre sociale** (la voix du Maître d'Armes) | (20, 35) | moyenne | lr-temple-nef, lr-foret-campement (par le sentier de l'ouest) |
| lr-temple-nef | la nef de la garde | nef | carrefour, statues, accès à tout le sanctuaire | (50, 48) | grande | lr-temple-parvis, lr-temple-chapelle, lr-temple-cellules, lr-temple-arsenal |
| lr-temple-cellules | les cellules des gardiens | cellules | **trésor**, journal du dernier gardien (le battement de la lame) | (50, 15) | petite | lr-temple-nef |
| lr-temple-arsenal | l'arsenal du pont | crypte | **combat** (le Maître d'Armes), le **treuil de rechange**, trésor | (50, 82) | moyenne | lr-temple-nef |

### Budget de contenu (proposé, à décider avec l'utilisateur)
- **Combats : 1** · **Rencontres sociales : 1** · **PNJ : 1** · **Énigmes : 1** · **Pièges : 1** · **Trésors : 2**
- **Répartition :**
  - Combat : l'arsenal : **le Maître d'Armes Sans Corps, une `armure-animee` (FP 1)**, avec **2 `epee-volante` pour 4 héros, 4 pour 6 héros** (comme dans le pitch). Difficulté d'après le budget de PX du moteur (niveau 1) : **modérée pour 4 héros** (300 PX), **entre faible et modérée pour 6 héros** (400 PX, faible 300, modérée 450). **Deux autres issues** : **sans combat**, réciter le **serment des Gardiens** (appris à la chapelle, ou donné par Aldric Ponts au Bastion) ; **combat réduit**, un **duel** contre l'armure seule, sans les épées.
  - PNJ : `maitre-d-armes-sans-corps` (l'esprit lié à l'armure ; il parle par la voix creuse de son casque dans la chapelle).
  - Rencontre sociale : la chapelle : le Maître d'Armes exige le serment ou un duel ; il détecte les mensonges.
  - Énigme : le serment : trois inscriptions gravées dans la lame et sur les statues à remettre dans l'ordre du serment (le parvis donne le début, la chapelle la fin).
  - Piège : les dalles à lames du parvis.
  - Trésors : l'arme du Maître d'Armes, la « lame solaire ternie » (son nom dans l'histoire ; l'objet est une arme magique modeste du catalogue SRD, à choisir au point V6) ; le reliquaire des gardiens (cellules, 50 po).
  - Objet de quête : le **treuil de rechange** (arsenal), à rapporter au Bastion pour réparer la herse.
  - Codex : le **journal du dernier gardien** (cellules).

### Histoire et état actuel
- Un sanctuaire des Gardiens du Pont, chevaliers qui juraient de ne jamais laisser tomber le viaduc, bâti dans la garde d'une épée tombée de la main de Vael-Khor. Les Gardiens ont disparu ; l'esprit de leur dernier Maître d'Armes veille encore sur l'arsenal, éveillé depuis que la lame bat de nouveau.

### Jour, nuit, mauvais temps
- **Jour** : le vent chante dans le fil de l'épée, l'acier brille, les statues projettent de longues ombres.
- **Nuit** : la lame est tiède et bat faiblement ; des lueurs oranges courent le long de la gorge.
- **Mauvais temps** : des éclairs magnétiques frappent le pommeau, les lames de l'arsenal cliquettent derrière les portes de bronze.

### Ce que le joueur voit en arrivant
- Une épée géante couchée sur le roc, sa garde en croix formant la façade d'un sanctuaire ; des statues de chevaliers brisées sur le parvis ; une porte de bronze verdi entrebâillée ; le chant du vent dans la lame.

### Secret du MJ (jamais dans `visuel`, `resume`, `accroche`)
- Le Maître d'Armes est l'esprit de Ser Osbern, dernier Maître d'Armes des Gardiens, lié à l'armure par un serment ; il protège le treuil parce qu'il a juré de ne jamais laisser tomber le pont. Il cédera le treuil à qui jure de **protéger le pont et ceux qui le franchissent**, et sent le mensonge.
- Le **journal du dernier gardien** raconte que la lame « bat comme un cœur de forge » depuis que le Dieu de la Guerre est tombé, et que ce battement s'est réveillé il y a trois nuits (un écho du pouls de la forge de Vorn : le fil rouge, sans nommer le Concile).
- Aldric Ponts, au Bastion, connaît le serment.

### Composition de la carte (`carte-lr-temple`, pour `images.json`)

> Une épée géante d'acier gris-bleu couchée sur un replat de roche rouge vue de dessus, pointe vers le bas ; sa garde en croix forme un sanctuaire de pierre et de bronze verdi avec un parvis dallé orné de statues brisées à l'est, côté sentier, et une chapelle à l'ouest ; un pommeau rond au nord, des cellules sous lui ; dans la gorge de la lame, une crypte ; au nord et à l'ouest, des épées géantes plantées de biais ; un sentier qui monte de l'est.

---

## Niveau 1 : lr-foret (Forêt d'Acier, champ des épées géantes)

> **Validé par l'utilisateur le 08/11/2026** (V4, lieu 5/5). Gelé : toute modification passe par lui. Passé à l'audit de cohérence (conforme après corrections).

### Héritage et nuances propres à ce lieu
- Héritage : charte de la région 1. Nuances : acier gris-bleu des lames géantes, rouille rouge sur le sol, fumerolles d'Ichor tiède par endroits, vent qui siffle dans des fils d'acier de cinquante à deux cent cinquante mètres, étincelles d'éclairs magnétiques, ombres rayées par les épées.

### Plan vu de dessus
- **Forme générale** : un vaste champ de bataille pétrifié au nord et à l'ouest du village, où plus de cent épées, hallebardes et lances géantes sont plantées de biais dans le roc ; une allée centrale que le vent a dégagée, des clairières entre les lames.
- **Limites** : le village et sa forge de Vorn au sud-est ; le replat du Temple du Glaive Brisé au sud, entre le champ et le village (la Forêt borde le Temple à l'ouest et au nord) ; au nord, la roche nue des Crêtes ; le torrent d'Oxyde loin à l'est.
- **Orientation** : nord en haut ; la piste des ferrailleurs entre par le sud-est (depuis la forge de Vorn) ; le Menhir Brisé et son cratère au nord-est du champ ; le campement abandonné au sud-ouest, à l'ouest du replat du Temple.
- **Voies d'accès** : la piste des ferrailleurs (depuis la forge de Vorn et le village), le sentier de l'ouest (qui part du Temple, côté chapelle, vers le campement).
- **Éléments naturels** : roche rouge, lames géantes inclinées, poches d'Ichor tiède, rouille.
- **Quartiers** : la lisière (sud-est), l'allée des épées géantes (centre), le campement des ferrailleurs (sud-ouest), le Menhir Brisé et son cratère (nord-est), l'antre des loups sous une garde géante (est).

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| lr-foret-lisiere | la lisière et la piste des ferrailleurs | piste | entrée, **combat** (les lames errantes), repères | (72, 90) | moyenne | lr-forge-vorn (par la piste), lr-foret-allee |
| lr-foret-allee | l'allée des épées géantes | allée | exploration, **codex** (inscriptions de la dernière bataille), site de contrat | (50, 62) | grande | lr-foret-lisiere, lr-foret-campement, lr-foret-menhir, lr-foret-antre |
| lr-foret-campement | le campement abandonné des ferrailleurs | camp | indices, **trésor**, site de contrat | (22, 78) | moyenne | lr-foret-allee, lr-temple-chapelle (par le sentier de l'ouest) |
| lr-foret-menhir | le Menhir Brisé et le cratère de la relique | cratère | **le secret du module** : l'origine du fragment d'enclume, **piège** (le sol d'Ichor), objet de quête | (60, 25) | moyenne | lr-foret-allee |
| lr-foret-antre | l'antre des loups sous une garde géante | antre | **combat** (les loups), **trésor** | (88, 42) | petite | lr-foret-allee |

### Budget de contenu (proposé, à décider avec l'utilisateur)
- **Combats : 2** · **Rencontres sociales : 0** · **PNJ : 0** · **Énigmes : 0** · **Pièges : 1** · **Trésors : 2**
- **Répartition :**
  - Combats : la lisière (**lames errantes** : **3 `epee-volante` pour 4 héros, 5 pour 6 héros**, d'autant plus nombreuses que la Fièvre de Fer monte) ; l'antre (**1 `loup-sanguinaire` pour 4 héros, 2 pour 6 héros**). Difficulté d'après le budget de PX du moteur (niveau 1) : lisière **sous le seuil faible** (150 PX pour 4 héros, 250 pour 6 ; seuils 200 et 300) : une patrouille, qui grossit avec la Fièvre de Fer ; antre faible pour 4 héros (200 PX), entre faible et modérée pour 6 (400 PX). **Alternative** pour les loups : leur jeter de la viande ou les détourner (Dressage, Discrétion).
  - Contrats : les **2 contrats** affichés à l'auberge (hors budget) ont pour sites l'allée des épées géantes et le campement abandonné ; ils sont écrits avec `creer-contrats` : « Le chargement de Gorm » (campement) et « La lame fendue » (allée).
  - Piège : le sol du cratère, saturé d'Ichor tiède (brûlure et vertige) autour du Menhir Brisé.
  - Trésors : la bourse d'un ferrailleur tué par les loups (antre, 25 po) ; la cache de lames de qualité dans le campement (60 po, armes du catalogue).
  - Objet de quête : l'**éclat de la pierre sacrée** (cratère), preuve que Vorn a profané le Menhir ; il est distinct du fragment d'enclume, qui reste à la forge de Vorn.
  - Codex : les **inscriptions de la dernière bataille** de Vael-Khor, gravées sur les épées géantes de l'allée.

### Histoire et état actuel
- Le champ où le Dieu de la Guerre est tombé et où ses armes se sont fichées dans le roc. Les ferrailleurs y prélevaient des lames depuis trois siècles. Depuis hier à l'aube, les lames s'y arrachent d'elles-mêmes ; les loups, chassés de leurs terriers, rôdent aux abords.

### Jour, nuit, mauvais temps
- **Jour** : les lames géantes luisent et sifflent, des lames errantes tournent comme des rapaces.
- **Nuit** : les lames errantes sont plus nombreuses, le cratère rougeoie par endroits.
- **Mauvais temps** : des éclairs magnétiques frappent les épées géantes, les lames errantes se déchaînent.

### Ce que le joueur voit en arrivant
- Une forêt d'épées, de hallebardes et de lances immenses plantées de biais, une allée de roche rouge où le vent siffle, des lames plus petites qui flottent et pivotent au loin comme des oiseaux de proie.

### Secret du MJ (jamais dans `visuel`, `resume`, `accroche`)
- Le **Menhir Brisé** est la **pierre sacrée** des Gardiens du Pont : un bloc de pommeau tombé d'une autre épée du dieu que celle du Temple. **Vorn** l'a brisée pour en tirer le fragment d'enclume suintant d'Ichor divin ; le cratère est encore tiède et **bat**, plus fort la nuit.
- Les traces de pas et de traîneau dans la rouille mènent du cratère à **la forge de Vorn** : la preuve que le foyer maudit vient d'ici.
- Les **loups sanguinaires** ont fui leurs terriers, chassés par les lames ; la femelle protège une portée.
- Les ferrailleurs ont déserté le campement en le laissant plein : ils ont vu les lames s'arracher.

### Composition de la carte (`carte-lr-foret`, pour `images.json`)

> Un champ de bataille pétrifié vu de dessus : plus de cent épées, hallebardes et lances géantes d'acier gris-bleu plantées de biais dans une roche rouge, laissant une allée centrale ; un cratère tiède à fumerolles autour d'un bloc de pierre brisé au nord-est ; un campement de tentes et de charrettes abandonné au sud-ouest ; une grande garde d'épée couchée formant un abri sombre à l'est ; une piste qui entre par le sud-est.
