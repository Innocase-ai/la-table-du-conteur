# Atlas des lieux de Le Grimoire de Port-Sillage

Document de travail (le moteur ne le lit pas) : **source unique** des descriptions de lieux, des images et des cartes. Écrit de haut en bas : niveau 0 (la carte du monde), niveau 1 (chaque lieu de cette carte), niveau 2 (chaque point à visiter). Un niveau ne contredit jamais celui du dessus.

Positions : `(x, y)` en % de la carte du parent (x : 0 à gauche, 100 à droite ; y : 0 en haut, 100 en bas). Ce sont des **intentions** ; on les replace d'après l'image réelle une fois la carte générée.

---

## Niveau 0 : la carte du monde

> **Validé par l'utilisateur le 06/11/2026** (V3). Gelé.

### Le territoire
- **Forme générale** : une baie en demi-lune ouverte à l'ouest ; le village au creux, deux avancées de falaise basse au nord (promontoire de l'église) et au sud (la crique cachée).
- **Orientation** (où est le nord) : en haut de la carte ; la mer est à l'ouest (à gauche), la route de terre part à l'est.
- **Échelle** (jours de marche d'un bout à l'autre) : environ une heure de marche en tout.
- **Relief** : falaises basses de granit, grève de galets et de sable gris, collines rases à l'est.
- **Eaux** : la mer ; les marées marquent l'histoire (le sentier des Goémons est noyé aux fortes marées).
- **Climat et saisons** : fin d'été, embruns, brume le matin, vent de mer régulier.
- **Ce qu'on voit de loin** : le clocher-lanterne sur le promontoire, les fumées de poisson grillé, les barques tirées sur la grève.

### Charte du monde (bloc d'héritage racine)
- **Matériaux** (3 à 5) : granit gris, bois goudronné, ardoise bleue, chanvre (cordes et filets).
- **Couleurs** (4 à 6) : gris pierre, bleu ardoise, ocre doré, vert-de-gris, blanc d'écume.
- **Formes d'architecture** (2 à 3) : pignons d'ardoise, seuils de pierre arrondis par le sel, clocher-lanterne.
- **Lumière type** : dorée et basse, fin d'après-midi.
- **Météo type** : embruns, brume légère le matin.
- **Sons de fond** : cloches, goélands, drisses qui claquent, ressac.
- **Odeurs de fond** : algues, goudron, poisson grillé.

### Les grands lieux

| id | nom | type | position | reconnaissable de loin par | heures vers les voisins | menace ou promesse |
| --- | --- | --- | --- | --- | --- | --- |
| ps-place | Place de la Criée (et quai) | place, hub | (48, 55) | l'estrade et les guirlandes | taverne 0,1 · caserne 0,15 · église 0,25 · crique 0,7 | départ, mairie en plein air, rumeurs |
| ps-taverne | Taverne *Le Hareng Rouillé* | taverne | (62, 63) | l'enseigne de fer en forme de hareng | place 0,1 | rumeurs, cave aux rats |
| ps-caserne | Caserne du guet | caserne | (80, 38) | la tour carrée et son drapeau | place 0,15 | autorité, solde impayée |
| ps-eglise | Église Sainte-Maëlle | église, crypte | (42, 16) | le clocher-lanterne sur le promontoire | place 0,25 (les cent marches) | le vol, la crypte, Aubin |
| ps-crique | Crique des Gueux | crique, grotte | (20, 86) | une anse masquée par des rochers | place 0,7 (sentier des Goémons) | contrebandiers, le livre |

### Routes et passages
- La rue du Quai relie la place, la taverne et la caserne.
- L'escalier des cent marches monte de la place à l'église.
- Le sentier des Goémons longe la falaise sud vers la crique ; il est noyé aux fortes marées.
- La crique s'atteint aussi par la mer : c'est le chemin du navire acheteur.
- La route de l'est (hors carte) mène à l'intérieur des terres.

### Composition de la carte (pour `images.json`, clé `carte-port-sillage`, 3 à 5 phrases)

> Une baie en demi-lune ouverte à l'ouest. L'église au clocher-lanterne se dresse sur le promontoire au nord-ouest, reliée par un escalier de cent marches. La place de la Criée et son quai occupent le centre, sur la grève ; la taverne est à l'angle sud-est de la place, la caserne à tour carrée à l'est près de la route. Au sud-ouest, derrière un chapelet de rochers, une crique cachée avec une cabane et l'entrée d'une grotte.

---

## Niveau 1 : ps-place (Place de la Criée, place et quai)

> **Validé par l'utilisateur le 06/11/2026** (V4, lieu 1/5). Gelé.

### Héritage (recopié du niveau 0, ne pas modifier)
- Matériaux, couleurs, formes, lumière, météo : ceux de la charte du monde.
### Nuances propres à ce lieu
- Galets de rivière polis par les pas, guirlandes de fête (fanions bleu et ocre) pendantes, étals à bâche de toile cirée, planches du quai noircies de goudron.

### Plan vu de dessus
- **Forme générale** : une place pavée de galets en trapèze, ouverte à l'ouest sur le quai.
- **Limites** : maisons à pignon d'ardoise au sud et à l'est, la falaise du promontoire au nord, la mer à l'ouest.
- **Orientation** : le quai part vers l'ouest ; l'escalier des cent marches au nord-ouest ; la rue du Quai à l'est.
- **Voies d'accès** : rue du Quai (taverne puis caserne), escalier (église), quai (barques, sentier des Goémons par la grève).
- **Éléments naturels** : galets, grève, goélands.
- **Quartiers** : l'estrade (nord-centre), le puits (centre), les étals de la criée (sud), le quai (ouest).

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| ps-place | la place (estrade, puits, étals) | place | rencontre (3), commerce, départ | (50, 50) | grande | pl-quai, ps-taverne, ps-caserne, ps-eglise |
| pl-quai | le quai et son hangar à filets | quai | rencontre (Tobie), trésor | (15, 55) | moyenne | ps-place |

### Budget de contenu (décidé avec l'utilisateur)
- Combats : 0 · Rencontres sociales : 3 · PNJ : 4 · Énigmes : 0 · Pièges : 0 · Trésors : 1
- Répartition : PNJ `gilda-fauvel` (estrade), `cyprien-crieur` (étal de la criée), `mirande-sel` (étal, marchande) sur la place ; `tobie-ancre` sous la barque *La Brise-Lame* au quai. Rencontres : mission de Gilda, rumeur de Cyprien, confrontation avec Tobie. Trésor : cachette de pêcheur au quai (20 po).

### Histoire et état actuel
- La place sert à la criée du poisson et aux fêtes. La fête de la Mer devait s'y finir en chansons ; guirlandes et barriques sont restées en place.

### Jour, nuit, mauvais temps
- **Jour** : étals, goélands, pêcheurs qui commentent le vol.
- **Nuit** : lanternes de poisson, quai désert ; Tobie sort manger.
- **Mauvais temps** : le quai est fermé par une corde, les étals bâchés.

### Ce que le joueur voit en arrivant
- La maire en ciré sur l'estrade, le prêtre assis sur les marches de l'escalier, des fanions mouillés, un crieur qui répète la nouvelle.

### Secret du MJ (jamais dans `visuel`, `resume`, `accroche`)
- Tobie est sous la barque *La Brise-Lame* depuis la nuit du vol. Gilda sait qu'elle a vidé la caisse de la solde et craint les comptes. La « rumeur du fantôme » de Cyprien est inventée.

### Composition de la carte (`carte-ps-place`)

> Une place de galets en trapèze ; l'estrade de bois au nord-centre, un puits de granit au milieu, des étals à bâche au sud ; à l'ouest un long quai de planches goudronnées avec des barques tirées au sec et un hangar à filets ; l'escalier des cent marches en haut à gauche, la rue du Quai qui part vers la droite.

---

## Niveau 1 : ps-taverne (Taverne *Le Hareng Rouillé*, taverne)

> **Validé par l'utilisateur le 06/11/2026** (V4, lieu 2/5). Gelé.

### Héritage : charte du monde. Nuances : enseigne de fer en forme de hareng, poutres noircies par la fumée, filets de pêche suspendus au plafond.

### Plan vu de dessus
- Bâtiment bas à pignon d'ardoise, entrée au nord sur la rue du Quai ; salle commune (comptoir de chêne, grande cheminée, tables de planches) ; trappe derrière le comptoir vers la cave (tonneaux, caisses de sel, mur de moellons avec un trou de rats) ; chambres à l'étage (service de nuit).

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| ta-salle | salle commune | salle | rencontres (2), repos, commerce | (50, 45) | grande | ta-cave, ps-place |
| ta-cave | la cave | cave | combat 1, trésor | (50, 80) | moyenne | ta-salle |

### Budget de contenu (décidé avec l'utilisateur)
- Combats : 1 · Rencontres sociales : 2 · PNJ : 2 · Énigmes : 0 · Pièges : 0 · Trésors : 2
- Répartition : `maeva-brisant` et `gaspard-vent` en salle ; combat « les rats de la cave » (rats géants et nuée, niveau 1, calé pour 4 héros, issue sans combat : enfumer ou piéger la nuée) ; trésors : `bourse-marquee` (confiance de Maëva) et la cachette de contrebande de la cave (15 po, une potion).

### Secret du MJ
- Maëva a vu des hommes de Sorel payer leur vin en pièces estampillées d'une écaille de poisson et en garde une bourse ; elle se tait (Sorel fournit sa bière). Gaspard a bien vu une barque sans lumière filer vers la crique, mais la nuit d'avant la fête.

### Jour, nuit
- Midi : pêcheurs. Soir : bondée, chants. Nuit : silence (à jauge 2, la salle est presque vide).

### Composition de la carte
- Pas de carte illustrée (deux sous-lieux) : le jeu dessine la salle et la cave en anneau.

---

## Niveau 1 : ps-caserne (Caserne du guet, caserne)

> **Validé par l'utilisateur le 06/11/2026** (V4, lieu 3/5). Gelé.

### Héritage : charte du monde. Nuances : drapeau bleu délavé, râteliers de bois, pierres de la tour sombres d'humidité.

### Plan vu de dessus
- Tour carrée de granit à l'est de la place, entourée d'une cour ; la cour (râteliers, mannequins, abreuvoir) ; le bureau d'Odile au pied de la tour (table de cartes, registre, tiroir fermé à clé, fenêtre sur le port).

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| ca-cour | la cour d'exercice | cour | rencontres (2), compagnon, trésor | (45, 60) | grande | ca-bureau, ps-place |
| ca-bureau | le bureau du capitaine | bureau | rencontre, dilemme, trésor | (50, 25) | moyenne | ca-cour |

### Budget de contenu (décidé avec l'utilisateur)
- Combats : 0 · Rencontres sociales : 3 · PNJ : 3 · Énigmes : 0 · Pièges : 0 · Trésors : 2
- Répartition : `piotr-lenoir` et `basile-ecume` (compagnon) en cour ; `odile-marsan` au bureau ; rencontres : exercice de Piotr (épreuve de compétence, donne les rondes), recrutement de Basile, confrontation avec Odile ; trésors : `registre-de-la-solde` (tiroir fermé, DD moyen) et le râtelier (une arme ou un bouclier du catalogue).

### Secret du MJ
- Odile tolère la contrebande de Sorel depuis deux ans car la solde n'est plus payée ; Gilda a détourné la caisse. Piotr ne sait rien et doute d'Odile. Prouvé la solde détournée et le marché de Sorel, Odile aide (jauge −1, port bloqué).

### Jour, nuit
- Jour : exercices. Nuit : deux gardes à la grille ; à jauge 2, garnison consignée et port fermé.

### Composition de la carte
- Pas de carte illustrée (deux points) : anneau.

---

## Niveau 1 : ps-eglise (Église Sainte-Maëlle, église et crypte)

> **Validé par l'utilisateur le 06/11/2026** (V4, lieu 4/5). Gelé.

### Héritage : charte du monde. Nuances : vitrail bleu de la sainte, bancs de chêne polis, bronze des cloches verdi, odeur de cire et de sel.

### Plan vu de dessus
- Église de granit sur le promontoire au bout des cent marches, clocher-lanterne ; nef (bancs, chaire, vitrail) ; sacristie accolée au nord (armoires, lit d'infirmerie, coffre des offrandes) ; crypte sous le chœur (voûte basse, ossuaire des marins noyés, niche vide du livre, armoire de la sainte).

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| eg-nef | la nef | nef | rencontre (Aubin) | (50, 55) | grande | eg-sacristie, eg-crypte, ps-place |
| eg-sacristie | la sacristie | sacristie | rencontres (2), piège, trésor | (80, 40) | moyenne | eg-nef |
| eg-crypte | la crypte | crypte | combat 2, piège, énigme, trésor | (45, 85) | grande | eg-nef |

### Budget de contenu (décidé avec l'utilisateur)
- Combats : 1 · Rencontres sociales : 3 · PNJ : 2 · Énigmes : 1 · Pièges : 2 · Trésors : 2
- Répartition : `pere-aubin` en nef ; `helene-ancre` en sacristie (coffre des offrandes à aiguille empoisonnée = piège 1 ; crochet de clé vide = indice) ; crypte : combat « les noyés de l'ossuaire » (squelettes, niveau 2, calé pour 4 héros, issue : apaiser les noyés par une prière), dalle à plaque devant la niche (piège 2), énigme `eg-e-cloches-de-maree` (trois cloches de bronze à sonner dans l'ordre des marées : ouvrent l'armoire de la sainte et son registre des lectures) ; trésors : offrandes, potion bénite de l'armoire.

### Secret du MJ
- Aubin perd la vue et la voix à force de lire la Bonace et voulait Tobie pour successeur ; la page de soin ne s'ouvre que pour un lecteur qui a lu la Bonace. Hélène a vu son fils rentrer tard avec du sable de la crique dans ses chaussures. Les noyés s'agitent depuis l'absence du livre.

### Jour, nuit
- Jour : lumière bleue du vitrail. Nuit : une bougie, murmures dans la crypte.

### Composition de la carte
- Pas de carte illustrée (trois points) : anneau.

---

## Niveau 1 : ps-crique (Crique des Gueux, crique et grotte)

> **Validé par l'utilisateur le 06/11/2026** (V4, lieu 5/5). Gelé.

### Héritage : charte du monde. Nuances : sable gris, épaves de barques, bois goudronné, cordes salées, algues sèches.

### Plan vu de dessus
- Anse de sable gris fermée par des rochers, à 40 minutes de la place par le sentier des Goémons (noyé aux fortes marées) ; la plage (épaves, mares à crabes) ; l'entrepôt de bois goudronné adossé à la falaise (caisses, tonneaux, barque légère) ; la grotte creusée sous la falaise, accessible depuis l'entrepôt, avec un ponton intérieur pour la chaloupe du navire.

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| cr-plage | la plage et ses mares | plage | combat 3, approche | (40, 70) | grande | cr-entrepot, ps-place (sentier) |
| cr-entrepot | l'entrepôt | entrepôt | combat 4, preuves, trésors | (65, 45) | moyenne | cr-plage, cr-grotte |
| cr-grotte | la grotte de Sorel | grotte | finale : combat 5 ou négociation, piège, énigme, trésor | (75, 20) | moyenne | cr-entrepot |

### Budget de contenu (décidé avec l'utilisateur)
- Combats : 3 · Rencontres sociales : 2 · PNJ : 1 · Énigmes : 1 · Pièges : 1 · Trésors : 3
- Répartition : combat 3 « les crabes des mares » (crabes géants, niveau 2, calé pour 4 ; issue : passer par les rochers à marée basse) ; combat 4 « les bandits de l'entrepôt » (niveau 2-3 ; issues : se faire passer pour des acheteurs, saboter la barque = jauge −1) ; `cle-de-la-crypte` et caisses de contrebande à l'entrepôt ; grotte : `sorel-noirbec` (négociation ou combat 5 « Sorel et ses hommes », niveau 3, calé pour 4), cloche d'alarme à fil tendu (piège 3, monte la jauge si elle sonne), énigme `cr-e-coffre-de-sorel` (coffre à cadrans lus dans les marques de marée gravées au mur) contenant `livre-de-maelle` et `lettre-de-verdelune`. Rencontres sociales : la négociation avec Sorel, un guetteur bavard à l'entrepôt.

### Secret du MJ
- Sorel n'est pas cruel (il n'a jamais tué) ; il vend le livre pour payer le sel de sa bande. Le livre se lit à voix haute : danger discret pour qui le lit sans préparation (indice pour la fin 3).

### Jour, nuit, marée
- Marée basse : plage large ; marée haute : sentier noyé, la crique n'est joignable que par la mer. Nuit : lanternes de contrebandiers.

### Composition de la carte (`carte-ps-crique`)

> Une anse de sable gris fermée par des rochers ; des épaves de barques et des mares sur la plage au sud ; un hangar de bois goudronné adossé à la falaise à l'est ; l'entrée sombre d'une grotte tout en haut à droite ; le sentier de falaise qui arrive par la gauche.

---

# Niveau 2 (V5 validé le 06/11/2026)

<!-- niv2-ps-place -->

> **Validé par l'utilisateur le 06/11/2026** (V5, lieu 1/5). Gelé. Le lien vers `ps-crique` part de `pl-quai` (sentier des Goémons).

Fiches détaillées de la Place de la Criée et de son quai, d'après la fiche de niveau 1 de `ps-place` dans `LIEUX.md` (validée et gelée). Le niveau 1 n'est pas modifié. Les champs dérivés du lieu `ps-place` sont en tête ; la fiche de la place ci-dessous détaille la place elle-même (les deux se confondent, d'où une seule fiche pour la place).

---

## Champs dérivés de ps-place (niveau 1)

- **resume** : Place de galets où l'on vend le poisson et où la fête de la Mer devait finir, au cœur du village.
- **accroche** : Au bout de la rue du Quai, des guirlandes bleues et ocre pendent entre les pignons ; l'odeur du goudron et du poisson grillé monte de la place.
- **visuel** : Une place pavée de galets polis, en trapèze, ouverte à l'ouest sur le quai. Trois repères : une estrade de bois gris au nord, un puits de granit au centre, une rangée d'étals sous bâches de toile cirée au sud ; des guirlandes de fanions bleus et ocre pendent entre les pignons d'ardoise. Le soleil bas de fin d'après-midi entre par l'ouest, au-dessus de la mer, et allonge les ombres des pignons sur les pavés.
- **ambiance** : Fête interrompue, vent de mer, lumière dorée.
- **description** (MJ) : La place de la Criée est le cœur de Port-Sillage : une aire de galets de rivière polis par les pas, en trapèze, ouverte à l'ouest sur le quai. Les maisons qui la bordent ont des pignons d'ardoise bleue, au sud et à l'est ; au nord, la falaise du promontoire porte le pied de l'escalier des cent marches. Au centre se dresse le puits de granit, margelle usée par les seaux et couvercle de bois tenu par une chaîne. Au nord-centre, l'estrade est une plateforme de planches grises sur trois marches, où l'on lit les annonces et où le village se réunit. Au sud, les étals de la criée alignent leurs tréteaux sous des bâches de toile cirée : le poisson s'y vend tôt le matin. Les guirlandes de fête, fanions bleus et ocre, sont tendues entre les pignons et n'ont jamais été redescendues. Les sorties : la rue du Quai à l'est, qui mène à la taverne puis à la caserne ; l'escalier des cent marches au nord-ouest ; le quai à l'ouest, d'où part le sentier des Goémons. On trouve ici surtout des gens : pêcheurs, marchandes, crieur.

---

## Niveau 2 : ps-place (Place de la Criée, place)

Les champs dérivés de la place sont en tête de fichier.

**Héritage** (recopié du niveau 1, ne pas modifier) :

- **Dimensions et structure** : trapèze d'environ 30 pas du nord au sud et 25 pas d'est en ouest ; pavé de galets, sans marche sauf l'estrade (*ajout hors niveau 1, à valider*).
- **Matériaux et état** (âge, usure, humidité, ce qui est cassé, ce qui est récent) : galets de rivière polis par les pas, usés au centre et luisants ; granit du puits ; planches grises de l'estrade ; toile cirée des étals ; guirlandes neuves pour la fête, déjà fanées par le sel.
- **Lumière** (origine, couleur, force, ombres) : dorée et basse de fin d'après-midi, venue de l'ouest au-dessus de la mer ; ombres longues des pignons vers l'est. La nuit : lanternes de poisson suspendues aux étals, rares.
- **Sons** : cloches, goélands, drisses qui claquent aux mâts du quai, ressac.
- **Odeurs** : algues, goudron, poisson grillé.
- **Température** : tiède au soleil, fraîche à l'ombre des pignons ; vent de mer régulier, brume légère le matin (*ajout hors niveau 1, à valider*).
- **Éléments remarquables** (chacun avec sa place) :
  - L'estrade : nord-centre, plateforme de planches grises sur trois marches, garde-corps bas, un fanion bleu cloué au poteau de gauche.
  - Le puits : centre, margelle de granit usée par les seaux, couvercle de bois tenu par une chaîne.
  - Les étals de la criée : sud, cinq tréteaux alignés sous des bâches de toile cirée, caisses de glace et de poisson sous les tables.
  - Les guirlandes : tendues entre le pignon sud et le pignon est, et entre l'angle de l'estrade et la maison du nord-est ; fanions bleus et ocres, pendants.
  - L'escalier : nord-ouest, pied des cent marches contre la falaise ; rampe de corde goudronnée.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `pl-quai` : pente douce de galets vers l'ouest ; les pavés cèdent aux planches goudronnées du quai, entre deux barriques et un tas de filets (22 mots) ; retour : en revenant du quai, la place s'élève doucement, on voit d'abord l'estrade et les guirlandes au-dessus des pignons (19 mots).
  - vers `ps-taverne` : rue du Quai vers l'est ; au pignon sud-est, la façade basse de la taverne, enseigne de fer en forme de hareng, porte nord ouverte sur la rue (27 mots) ; retour : depuis la porte de la taverne, la place se voit au bout de la rue, puits et estrade au centre, étals sur la gauche (26 mots).
  - vers `ps-caserne` : plus loin à l'est, la rue du Quai longe la grille de la cour ; la tour carrée de granit se dresse, son drapeau bleu délavé au sommet (23 mots) ; retour : depuis la tour, la place se découpe en contrebas vers l'ouest, guirlandes visibles au-dessus des toits d'ardoise (18 mots).
  - vers `ps-eglise` : escalier des cent marches, depuis l'angle nord-ouest ; degrés de granit usés au milieu, rampe de corde goudronnée contre la falaise (20 mots) ; retour : du haut de l'escalier, la place se voit tout entière, un trapèze de galets pâles bordé de pignons et de guirlandes (20 mots).
  - vers `ps-crique` (par le quai et la grève) : le sentier des Goémons part du quai vers le sud, longe la falaise par la grève, environ quarante minutes de marche ; noyé aux fortes marées (23 mots) ; retour : depuis la crique, le sentier remonte la grève ; le quai et les barques tirées au sec se voient en premier (20 mots).
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | maire ; confie la mission du livre (rencontre sociale) | l'estrade, en ciré sur la marche haute | `gilda-fauvel` | Persuasion |
  | PNJ | crieur ; répète la nouvelle et colporte une rumeur (rencontre sociale) | l'étal de la criée, sud, debout sur une barrique renversée | `cyprien-crieur` | Perspicacité |
  | PNJ | marchande ambulante ; commerce de passage | l'étal sud-est, sous une bâche bleue | `mirande-sel` | Persuasion (marchandage) |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : aucun changement de la place avant la jauge 2. Jauge 2 (couvre-feu, `grande-maree`) : la garnison est consignée, les rues se vident le soir ; la place reste ouverte mais déserte après la nuit tombée. Jauge 3 (navire au large) : pas de changement sur la place ; les barques font la navette au quai.
- **Un détail propre à ce lieu** (inscription, odeur, objet cassé : ce qui empêche cette fiche d'être échangeable) : sur le pignon de la mairie, une ardoise de criée à demi effacée annonce le programme de la fête : « chansons dès la marée haute » ; la craie du mot « chansons » a été frottée par la pluie et le sel.
- **Intérieur** : sans objet. Aucun sous-lieu déclaré ; `pl-quai` est un point à part (voir plus bas).

**Champs dérivés** : voir la tête du fichier (resume, accroche, visuel, ambiance, description).

---

## Niveau 2 : pl-quai (le quai et son hangar à filets, quai), dans ps-place

**Héritage** (recopié du niveau 1 de `ps-place`, ne pas modifier) :

- **Dimensions et structure** : quai de planches d'environ 20 pas de long sur 5 de large, le long de la grève à l'ouest de la place ; hangar à filets d'environ 8 pas sur 6, au bout sud du quai (*ajout hors niveau 1, à valider*).
- **Matériaux et état** (âge, usure, humidité, ce qui est cassé, ce qui est récent) : planches goudronnées noircies, humides, le goudron colle aux semelles ; bittes d'amarrage en granit ; cordages de chanvre ; un madrier cassé au bout du quai, cerclé de fer ; hangar en bois goudronné à toit d'ardoise.
- **Lumière** (origine, couleur, force, ombres) : dorée et basse, venue de l'ouest par-dessus la mer, reflets sur l'eau ; ombre portée du hangar sur le quai. La nuit : lanternes de poisson accrochées au hangar, quai désert.
- **Sons** : ressac contre les pilotis, drisses qui claquent, coque qui tape contre les barques, goélands.
- **Odeurs** : goudron, algues, poisson.
- **Température** : fraîche dès que le soleil baisse, vent de mer régulier (*ajout hors niveau 1, à valider*).
- **Éléments remarquables** (chacun avec sa place) :
  - La barque *La Brise-Lame* : au bout du quai, retournée sur deux tréteaux, quille vers le ciel, dégagée d'environ un pas sous le bordage.
  - Le hangar à filets : au bout sud du quai, porte à loquet de bois, filets suspendus à des crochets de fer au plafond.
  - Les barques tirées au sec : sur la grève, au pied du quai, côté nord, quille sur des rondins.
  - Les bittes de granit : le long du bord, une tous les trois pas.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `ps-place` : vers l'est, les planches cèdent aux galets ; une pente douce monte vers la place, bordée de pignons d'ardoise (18 mots) ; retour : du seuil de la place, le quai se voit en contrebas, planches noires de goudron, barques, et la mer au bout (21 mots).
  - vers `ps-crique` : au sud du quai, le sentier des Goémons quitte le bois et longe la falaise par la grève, environ quarante minutes de marche ; noyé aux fortes marées (22 mots) ; retour : depuis la crique, le sentier remonte la grève ; le quai et les barques tirées au sec se voient en premier (20 mots).
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | sacristain caché ; confrontation avec les héros (rencontre sociale) | sous la barque *La Brise-Lame*, retournée sur deux tréteaux | `tobie-ancre` | Persuasion ou Intimidation |
  | trésor | cachette de pêcheur : 20 po | sous une planche descellée au fond du hangar à filets, à droite de la porte | à créer | Perception |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : jauge 3 (navire au large, `grande-maree`) : des barques font la navette entre le quai et le navire de Verdelune mouillé au large. Le quai n'a pas d'autre changement dans le canon.
- **Un détail propre à ce lieu** (inscription, odeur, objet cassé : ce qui empêche cette fiche d'être échangeable) : sur le plat-bord de la barque retournée, le nom *La Brise-Lame* est peint en bleu ardoise, à moitié écaillé ; un seau de bois cerclé de fer, à moitié plein d'eau de mer, traîne près des bittes.
- **Intérieur** : sans objet. Le hangar à filets n'est pas déclaré comme sous-lieu.

**Champs dérivés** : sans objet (seuls les champs de `ps-place` sont demandés).

<!-- niv2-ps-taverne -->

> **Validé par l'utilisateur le 06/11/2026** (V5, lieu 2/5). Gelé.

Document de travail (le moteur ne le lit pas). Source : la fiche de niveau 1 `ps-taverne` de `LIEUX.md` (validée et gelée le 06/11/2026) et le canon de `BIBLE.md`. Ce fichier ne modifie aucune fiche existante. Les lignes du bloc « Héritage » qui ne figurent pas encore au niveau 1 (dimensions, lumière, sons, odeurs, température) sont à remonter dans `LIEUX.md` si l'utilisateur les valide.

---

## Champs dérivés de ps-taverne (Taverne *Le Hareng Rouillé*, taverne)

- **resume** : Taverne de port au comptoir de chêne et à la cave humide, où les rumeurs de la fête circulent plus vite que les chopes.
- **accroche** (vue de la place et de la rue du Quai) : L'enseigne de fer en forme de hareng grince au-dessus d'une porte basse ; fumée de bois et chants sortent par la fenêtre.
- **visuel** : Bâtiment bas à pignon d'ardoise bleue, en granit gris, avec un seuil de pierre arrondi par le sel. L'enseigne de fer en forme de hareng pend au-dessus de la porte nord, et deux fenêtres basses laissent voir une lueur ambrée. Un filet de pêche mouillé sèche sur la barre d'appui de la fenêtre est.
- **ambiance** : Chaleur de foyer, sel et fumée de bois.
- **description** (MJ) : Bâtiment bas à pignon d'ardoise, bâti en granit gris, sur la rue du Quai, à quelques minutes de la place de la Criée. La porte nord, basse et large, est en chêne gris usé par les bottes ; au-dessus, l'enseigne de fer forgée en forme de hareng grince au vent du quai. Deux fenêtres à petits carreaux éclairent la salle commune, et des volets bleus les ferment la nuit.

  Dans la salle, le sol est de dalles grises couvertes de sable. Le comptoir de chêne occupe tout le mur est ; derrière lui, des étagères portent les bouteilles et la caisse, et une trappe carrée s'ouvre dans le plancher pour la cave. La grande cheminée de granit ferme le mur ouest, avec un foyer assez large pour un chaudron. Cinq tables de planches complètent le décor, et des filets de pêche pendent aux poutres noircies par la fumée. Un escalier monte au fond, vers les chambres du service de nuit.

  Maëva Brisant tient la taverne et connaît la plupart des clients. Gaspard Vent, vieux pêcheur, occupe chaque soir la table près du feu. La cave, sous la salle, est humide et sent le sel : c'est là que la taverne garde ses tonneaux et son sel.

---

### Niveau 2 : ta-salle (salle commune, salle), dans ps-taverne

**Héritage** (recopié du niveau 1, ne pas modifier) :

- Héritage du niveau 1 : charte du monde. Nuances : enseigne de fer en forme de hareng, poutres noircies par la fumée, filets de pêche suspendus au plafond.
- **Dimensions et structure** : salle rectangulaire de 12 pas est-ouest sur 8 pas nord-sud, soit environ 9 m sur 6 m ; poutres à 3 pas du sol (environ 2,3 m) ; murs de granit d'un pas d'épaisseur.
- **Matériaux et état** : granit gris ; poutres de bois goudronné noircies par la fumée ; dalles grises couvertes de sable ; planches des tables marquées de cercles de chopes et polies sur les bords ; comptoir de chêne ciré, avec une entaille ancienne côté sud.
- **Lumière** : foyer de la cheminée (ouest), deux lanternes de poisson accrochées aux poutres, au-dessus des tables du centre et du comptoir ; le jour gris entre par les deux fenêtres du nord. Lumière ambrée, ombres longues dans le coin sud-ouest.
- **Sons** : chopes posées sur le bois, conversations, craquement du foyer ; par la porte ouverte, le ressac et les goélands du quai.
- **Odeurs** : fumée de bois, poisson fumé, bière, sel.
- **Température** : chaude près du foyer, plus fraîche vers la porte nord, où entre un courant d'air.
- **Éléments remarquables** (chacun avec sa place) :
  - comptoir de chêne, le long du mur est, du nord au sud sur six pas ; derrière, la caisse et des étagères de bouteilles.
  - trappe carrée dans le plancher derrière le comptoir, au pied sud, à deux pas du mur sud.
  - cheminée de granit au milieu du mur ouest, foyer large d'un pas et demi, crémaillère, deux bancs de bois devant.
  - cinq tables de planches : deux près de la cheminée, trois au centre de la salle.
  - filets de pêche tendus en travers des poutres au-dessus des tables du centre, à deux pas du sol.
  - escalier de bois contre le mur sud, qui monte vers les chambres.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `ta-cave` : description (vue de la salle) : Trappe carrée de chêne au ras du plancher, derrière le comptoir, ouverte par un anneau de fer ; une odeur de sel monte de l'escalier raide. Retour (vue de la cave) : Trappe carrée derrière le comptoir, au pied sud ; un escalier raide descend vers une odeur de sel et de terre humide.
  - vers `ps-place` : description (vue de la salle) : Porte nord en chêne gris, deux pas de large, qui donne sur la rue du Quai ; seuil usé en creux par les bottes. Retour (vue de la rue du Quai) : Porte basse de la taverne sur la rue du Quai, d'où l'on voit la lueur du foyer et l'enseigne de fer au-dessus.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ (rencontre sociale) | aubergiste : connaît les clients et la cave ; donne la bourse à qui a sa confiance | comptoir, côté est, derrière la caisse | `maeva-brisant` | Persuasion |
  | PNJ (rencontre sociale) | vieux pêcheur : a vu une barque sans lumière, la nuit d'avant la fête | table près de la cheminée, dos au mur ouest | `gaspard-vent` | Perspicacité |
  | trésor | bourse de pièces marquées, preuve du marché | tiroir de la caisse, sous le comptoir | `bourse-marquee` | Persuasion (confiance de Maëva) |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : à grande marée 2 (couvre-feu, fait « la taverne se vide »), la salle est presque vide : une table occupée au plus, les chaises remontées sur les autres. Le décor ne change pas.
- **Un détail propre à ce lieu** : sous la poutre au-dessus du comptoir, des traits de craie groupés par cinq comptent les tournées ; le dernier groupe n'est tracé qu'à moitié.
- **Intérieur** :
  - plan intérieur (entrée, enchaînement des pièces) : porte au nord, sur la rue du Quai ; la salle s'ouvre vers le sud et l'ouest ; comptoir à l'est ; trappe au pied sud du comptoir ; escalier de l'étage contre le mur sud.
  - sous-lieux (chacun aura sa fiche, ici `ta-cave`, fiche de niveau 2 à part entière dans ce fichier) :

    | id | nom | type | fonction dramatique | position | ce qui l'annonce depuis ce lieu | voisins directs |
    | --- | --- | --- | --- | --- | --- | --- |
    | ta-cave | la cave | cave | combat 1, trésor | (50, 80) | la trappe carrée derrière le comptoir et l'odeur de sel qui monte | ta-salle |

**Champs dérivés**
- **resume** : Salle commune de la taverne, où le comptoir, la cheminée et les rumeurs se partagent la soirée.
- **accroche** (vue de la rue du Quai) : Par les petits carreaux de la façade, une lueur ambrée, une odeur de poisson fumé et le bruit des chopes sur le bois.
- **visuel** : Une salle longue, au sol de dalles grises couvertes de sable, sous des poutres noircies par la fumée. Le comptoir de chêne ciré occupe le mur est, la cheminée de granit le mur ouest, et cinq tables de planches se répartissent au centre. Des filets de pêche pendent entre les poutres ; la lumière principale vient du foyer, ambrée, avec le jour gris de la porte nord.
- **ambiance** : Chaleur de foyer, chopes et filets secs.
- **description** : La salle occupe tout le rez-de-chaussée, sur neuf mètres environ de long. On entre par la porte nord, et la pièce s'ouvre vers le sud. Le comptoir de chêne ciré ferme l'est : derrière lui, Maëva Brisant garde la caisse, les bouteilles et un tiroir où elle range la bourse de pièces marquées ; une trappe carrée, au pied sud du comptoir, mène à la cave. La cheminée de granit ouvre le mur ouest, avec deux bancs ; à sa droite, la table de Gaspard Vent, qui se tient toujours le dos au mur. Trois tables au centre, sous les filets ; deux autres près du feu. Les poutres sont noircies, et les planches portent les cercles des chopes. Un escalier raide, contre le mur sud, monte vers les chambres du service de nuit. Sous la poutre du comptoir, des traits de craie comptent les tournées de la fête.

---

### Niveau 2 : ta-cave (la cave, cave), dans ps-taverne

Fiche de niveau 2 (et non 3) : la cave est un point à visiter de ps-taverne, comme la salle. Son héritage est la fiche de son conteneur, ps-taverne, recopiée sans changement.

**Héritage** (recopié du niveau 1, ne pas modifier) :

- Héritage du niveau 1 : charte du monde. Nuances : enseigne de fer en forme de hareng, poutres noircies par la fumée, filets de pêche suspendus au plafond.
- **Dimensions et structure** : cave voûtée de 9 pas est-ouest sur 6 pas nord-sud, soit environ 7 m sur 4,5 m ; voûte de moellons, haute de deux pas le long des murs et de deux pas et demi au centre (environ 1,5 m et 1,9 m).
- **Matériaux et état** : moellons de granit gris, joints de chaux noircie, suintants ; sol de terre battue dure, couvert de sable et de paille ; bois des tonneaux gonflé par l'humidité, cerclage de fer rouillé ; caisses de sel en bois blanc, neuves.
- **Lumière** : une lanterne à huile sur un crochet, au pied de l'escalier, dans le coin nord-est, qui éclaire environ deux pas autour ; le reste est dans l'ombre. Quand la trappe est ouverte, un carré pâle tombe au même endroit.
- **Sons** : gouttes d'eau régulières sur les pierres du mur ouest ; des grattements dans le mur sud ; le craquement des poutres quand la salle bouge au-dessus.
- **Odeurs** : sel, goudron de tonneau, terre humide.
- **Température** : fraîche, humide sur la peau, nettement plus froide que la salle au-dessus.
- **Éléments remarquables** (chacun avec sa place) :
  - escalier de bois raide, cinq marches, accolé au mur est, qui descend de la trappe jusqu'au coin nord-est de la cave.
  - quatre tonneaux de chêne debout, cerclés de fer, de un pas de diamètre, alignés contre le mur ouest du nord au sud.
  - deux piles de caisses de sel : l'une au centre (deux caisses de haut), l'autre dans le coin sud-est (trois caisses de haut).
  - une ouverture basse dans le mur sud, à un pas du coin sud-ouest, haute d'un demi-pas, au ras du sol ; les joints autour sont rongés.
  - une flaque de deux pas de large au centre-ouest, devant les tonneaux, qui rend le sol glissant.
  - une dalle descellée au pied du mur est, sous la pile du coin sud-est.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `ta-salle` : description (vue de la cave) : Escalier de bois de cinq marches, sous une trappe carrée qui s'ouvre au plafond du coin nord-est ; la lumière de la salle tombe en carré. Retour (vue de la salle) : Trappe carrée derrière le comptoir, au pied sud ; un escalier raide descend vers une odeur de sel et de terre humide.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | monstre | combat « les rats de la cave » (niveau 1, calé pour 4 héros) : rats géants qui sortent de l'ouverture du mur sud | ouverture basse du mur sud | `rat-geant` ; rencontre à créer | — |
  | monstre | même combat : une nuée de rats, au pied des tonneaux. Issue sans combat : l'enfumer ou la piéger | coin sud-ouest, au pied des tonneaux | `nuee-de-rats` | — |
  | trésor | cachette de contrebande : 15 po et une potion | dalle descellée au pied du mur est | à créer | Perception (DD moyen) pour trouver la dalle |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) : aucun changement prévu par le canon.
- **Un détail propre à ce lieu** : sur le mur est, au-dessus de la dalle descellée, trois traits de craie comptent les caisses de sel ; le dernier est barré d'un seul trait.

**Champs dérivés**
- **resume** : Cave humide sous la taverne, où les tonneaux et le sel attendent au fond des moellons.
- **accroche** (vue de la salle) : Derrière le comptoir, une trappe de chêne ouverte sur une odeur de sel froid, de goudron et de terre humide, et un bruit d'eau qui goutte.
- **visuel** : Une cave basse et voûtée de moellons de granit gris, luisante d'humidité, que n'éclaire qu'une lanterne à huile au pied d'un escalier de bois. Quatre tonneaux de chêne cerclés de fer alignent le mur ouest ; deux piles de caisses de sel occupent le centre et le coin sud-est. Une flaque luit devant les tonneaux, et une ouverture basse et sombre s'ouvre au ras du sol dans le mur sud.
- **ambiance** : Froid humide, sel et silence troublé.
- **description** : La cave s'étend sous toute la salle, en un rectangle d'environ sept mètres sur quatre et demi. On y descend par l'escalier de bois de cinq marches, raide, qui arrive dans le coin nord-est. La voûte de moellons est basse : il faut se courber le long des murs, et la lanterne suspendue à son crochet est la seule lumière, avec le carré pâle de la trappe quand elle est ouverte. Quatre tonneaux de chêne, cerclés de fer et gonflés par l'humidité, sont debout contre le mur ouest. Au centre, une pile de deux caisses de sel ; dans le coin sud-est, une pile de trois, près d'une dalle descellée au pied du mur est. Devant les tonneaux, une flaque de deux pas s'étale sur la terre battue, glissante. Dans le mur sud, une ouverture au ras du sol, haute d'un demi-pas, a été rongée dans les joints de chaux. Au-delà de deux pas de la lanterne, l'ombre est complète, et la salle au-dessus fait entendre ses chopes.

<!-- niv2-ps-caserne -->

> **Validé par l'utilisateur le 06/11/2026** (V5, lieu 3/5). Gelé.

Fichier de travail (le moteur ne le lit pas). Source : `LIEUX.md`, niveau 1 de `ps-caserne` (validé le 06/11/2026, gelé). Les champs ci-dessous sont dérivés du lieu de niveau 1 lui-même.

---

## Champs dérivés de ps-caserne (niveau 1)

- **resume** : Tour de granit où le guet garde ses râteliers, sa cour d'exercice et ses registres, à deux pas de la place.
- **accroche** (vue depuis la rue du Quai) : Au bout de la rue du Quai, une tour carrée de granit gris, un drapeau bleu délavé, et le bruit sec de bâtons qui frappent du bois.
- **visuel** : Une tour carrée de granit gris, aux pierres sombres d'humidité, se dresse à l'est de la place, sa cour fermée d'un mur et d'une grille côté rue du Quai. Au sommet, un drapeau bleu délavé flotte au-dessus d'un toit d'ardoise bleue. Dans la cour, des râteliers de bois longent le mur nord, des mannequins de bois se dressent au centre, et un abreuvoir de pierre reçoit la pluie ; la lumière dorée et basse vient de l'ouest, par-dessus le port.
- **ambiance** : Granit humide, goudron, coups de bâton, drisses.
- **description** (MJ) : La caserne du guet est une tour carrée de granit gris, à l'est de la place de la Criée, entourée d'une cour. Les pierres sont sombres d'humidité jusqu'à la hauteur d'un homme. Au sommet, un drapeau bleu délavé flotte au-dessus d'un toit d'ardoise, visible depuis le quai. Une grille de fer ferme la cour du côté de la rue du Quai, qui mène à la place en dix minutes de marche. Dans la cour, des râteliers de bois longent le mur nord, des mannequins de bois servent aux exercices, et un abreuvoir de pierre reçoit l'eau de pluie. Au pied de la tour, une porte de chêne donne sur trois marches et sur le bureau du capitaine. Le guet garde la place et le port : les rondes partent à la nuit tombée, les exercices résonnent le jour. Les gardes de la grille connaissent les gens du quartier et laissent entrer ceux qui ont une raison. Quand le couvre-feu tombe, la garnison reste consignée au quartier.

**Issues de ps-caserne** (vers le niveau 1 voisin) :
- vers `ps-place` : rue du Quai, dix minutes de marche. Description (depuis la rue) : une grille de fer, une tour et un drapeau au-dessus d'un mur ; retour (depuis la place) : la rue descend en pavés vers les étals et sent le goudron.

---

## Niveau 2 : ca-cour (la cour d'exercice, cour), dans ps-caserne

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Dimensions et structure** : cour carrée d'environ 18 pas sur 12, pavée de dalles, entourée de murs de granit ; grille au sud sur la rue du Quai ; tour de granit au fond, à l'est. *(Dimensions proposées ici, absentes du niveau 1 : à valider.)*
- **Matériaux et état** : granit gris des murs, dalles usées au milieu par les pas, bois goudronné des râteliers, pierres de la tour sombres d'humidité. Rien de cassé.
- **Lumière** : soleil bas de fin d'après-midi venu de l'ouest, par-dessus le mur ouest ; ombres longues contre la tour.
- **Sons** : coups secs sur le bois, drisses qui claquent au port, goélands, cloche lointaine.
- **Odeurs** : goudron, cuir, algues.
- **Température** : fraîche à l'ombre de la tour, tiède au soleil. *(Non fixée au niveau 1 : à valider.)*
- **Éléments remarquables** (chacun avec sa place) :
  - râteliers de bois le long du mur nord, armes de la garnison ;
  - deux mannequins de bois au centre de la cour ;
  - abreuvoir de pierre contre le mur ouest ;
  - porte basse de chêne au pied de la tour, à l'est.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `ca-bureau` : une porte basse de chêne cerclé de fer, au haut de trois marches de pierre usées ; retour : une porte de chêne ouverte sur la cour, on y voit les râteliers et la lumière du couchant par la grille.
  - vers `ps-place` : une grille de fer sur le côté sud, ouverte de jour sur la rue du Quai ; une chaîne pend contre le montant ; retour : depuis la rue, la grille découpe la cour, et l'on aperçoit la tour et le drapeau bleu au-dessus du mur.
- **Contenu prévu** (un emplacement par entité ; au lieu le plus précis) :

  | sorte | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | `piotr-lenoir`, sergent qui dirige l'exercice ; rencontre : épreuve de compétence, donne les rondes | les mannequins de bois, au centre | piotr-lenoir | Athlétisme (DD à fixer) |
  | PNJ | `basile-ecume`, recrue du guet ; rencontre : recrutement, compagnon | l'abreuvoir de pierre | basile-ecume | Persuasion (DD à fixer) |
  | trésor | râtelier d'armes : une arme ou un bouclier du catalogue, en bon état | râtelier de bois du mur nord | à créer | |

- **Avant / après** : à la jauge 2 de `grande-maree` (couvre-feu), la garnison est consignée : la cour est vide, la grille reste fermée à clé et deux gardes y restent.
- **Un détail propre à ce lieu** : sur le montant de la porte de la tour, une gorge de cordage a usé la pierre à hauteur de main ; les drisses ont servi là pendant des années.
- **Intérieur** : aucun sous-lieu.

**Champs dérivés**
- **resume** : Une cour de dalles où le guet s'exerce au bâton, entre les mannequins et les râteliers.
- **accroche** (vue depuis la caserne) : Par la grille de fer, on entend des coups secs sur le bois et des voix qui comptent les pas ; l'odeur du goudron monte de la cour.
- **visuel** : Une cour carrée de dalles usées, bordée de murs de granit gris, où la lumière dorée du soir arrive par-dessus le mur ouest. Des râteliers de bois couvrent le mur nord, deux mannequins de bois se dressent au centre, et un abreuvoir de pierre luit contre le mur ouest. Au fond, à l'est, la tour a une porte basse de chêne au haut de trois marches, et le drapeau bleu délavé flotte au-dessus.
- **ambiance** : Dalles, coups secs, goudron, vent du port.
- **description** (MJ) : La cour d'exercice occupe tout le devant de la tour, un carré d'environ dix-huit pas sur douze, pavé de dalles de granit usées au milieu par les pas. Le mur nord porte une rangée de râteliers de bois où sont rangées les armes de la garnison ; le râtelier d'armes garde une arme ou un bouclier du catalogue, en bon état. Au centre, deux mannequins de bois servent aux exercices de frappe. L'abreuvoir de pierre, contre le mur ouest, reçoit l'eau qui coule du toit de la tour. La grille est au sud, sur la rue du Quai ; elle reste ouverte le jour et deux gardes restent devant la nuit. Les recrues s'y entraînent le matin, et le sergent dirige l'exercice. Au fond, trois marches de pierre usées montent à la porte de chêne du bureau, au pied de la tour.

---

## Niveau 2 : ca-bureau (le bureau du capitaine, bureau), dans ps-caserne

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Dimensions et structure** : pièce carrée d'environ 5 pas sur 4, au rez-de-chaussée de la tour, plafond bas à poutres goudronnées ; une fenêtre étroite face au port. *(Dimensions proposées ici, absentes du niveau 1 : à valider.)*
- **Matériaux et état** : murs de granit sombres d'humidité, plancher et mobilier de chêne, poutres goudronnées. Rien de cassé.
- **Lumière** : fenêtre étroite à l'ouest, lumière dorée du soir ; une lampe de cuivre à huile sur la table, dont la flamme tremble.
- **Sons** : ressac et drisses par la fenêtre, cloche lointaine, grincement de la porte.
- **Odeurs** : encre, cire, goudron, huile de lampe.
- **Température** : fraîche, l'humidité du granit se sent. *(Non fixée au niveau 1 : à valider.)*
- **Éléments remarquables** (chacun avec sa place) :
  - table de chêne au centre, couverte d'une carte de la baie punaisée aux quatre coins, avec un registre des rondes ouvert dessus ;
  - bureau à deux tiroirs contre le mur ouest, sous la fenêtre ; le tiroir du bas ferme à clé ;
  - lampe de cuivre à huile posée sur la table ;
  - fenêtre étroite sur le mur ouest, tournée vers le port.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `ca-cour` : une porte de chêne ouverte sur trois marches qui descendent vers la cour, que le couchant éclaire ; retour : une porte basse de chêne cerclé de fer, au haut de trois marches usées, un battant ouvert sur la pièce du capitaine.
- **Contenu prévu** (un emplacement par entité ; au lieu le plus précis) :

  | sorte | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | `odile-marsan`, capitaine ; rencontre : confrontation, dilemme de la solde | la table de cartes, au centre | odile-marsan | aucun (dialogue) |
  | trésor | `registre-de-la-solde` : prouve la solde impayée ; tiroir fermé à clé, DD moyen | bureau à deux tiroirs, mur ouest | registre-de-la-solde | Dextérité (outils de voleur), DD moyen |

- **Avant / après** : si le groupe prévient Odile (drapeau `odile-prevenue`), des traits au crayon apparaissent sur la carte, autour de la crique, et la jauge `grande-maree` descend d'un cran.
- **Un détail propre à ce lieu** : une tache d'encre sèche a coulé du bord de la table jusqu'au plancher, en forme de hareng ; personne ne l'a essuyée.
- **Intérieur** : aucun sous-lieu.

**Champs dérivés**
- **resume** : Le bureau du capitaine, au pied de la tour, où s'empilent les cartes de la baie et les registres du guet.
- **accroche** (vue depuis la cour) : Trois marches de pierre usées montent vers une porte de chêne ; une lampe de cuivre brille derrière la fenêtre étroite de la tour.
- **visuel** : Une pièce carrée à plafond bas, aux poutres goudronnées, éclairée par une fenêtre étroite ouverte sur le port, où entre la lumière dorée du soir. Au centre, une table de chêne couverte d'une carte de la baie, et une lampe de cuivre à huile dont la flamme tremble. Contre le mur ouest, un bureau à deux tiroirs, dont le tiroir du bas est fermé à clé.
- **ambiance** : Papier, huile de lampe, ressac par la fenêtre.
- **description** (MJ) : Le bureau du capitaine tient dans la base de la tour : une pièce carrée d'environ cinq pas sur quatre, au plafond bas à poutres goudronnées. Une table de chêne occupe le centre, couverte d'une carte de la baie punaisée aux quatre coins ; un registre des rondes y est ouvert. Contre le mur ouest, sous la fenêtre étroite tournée vers le port, un bureau à deux tiroirs ; le tiroir du bas ferme à clé, et c'est là que sont rangés les comptes de la solde. Une lampe de cuivre à huile éclaire la table, et une chaise de bois à dossier droit fait face à la porte. La fenêtre laisse entrer le ressac, les drisses des barques et la lumière du couchant. Trois marches descendent vers la cour. La pièce sent l'encre, la cire et l'huile de lampe ; le granit des murs garde la fraîcheur de la nuit.

---

**Notes de relecture (pour Claude)** :
- Dimensions et température de l'héritage ne sont pas dans le niveau 1 : à ajouter au bloc d'héritage de ps-caserne après validation.
- Les skills et DD sont des propositions à valider (Athlétisme, Persuasion, Dextérité) ; le budget n'en fixe pas.
- Le râtelier d'armes et le registre de la solde : ids `à créer` pour le râtelier.

<!-- niv2-ps-eglise -->

> **Validé par l'utilisateur le 06/11/2026** (V5, lieu 4/5). Gelé. Arbitrages : (1) les 3 rencontres sociales sont Aubin (conseil), Hélène, la confidence d'Aubin sur sa voix (confiance élevée) ; (2) fin 1 : le livre retourne dans la niche et les murmures cessent, fins 2 et 3 : la niche reste vide ; (3) la grille de la crypte est ouverte depuis la découverte du vol, sa serrure est intacte (la clé a servi, rien n'a été forcé).

Fichier de travail (le moteur ne le lit pas). Source : fiche niveau 1 de `ps-eglise` dans `LIEUX.md` (validée et gelée). Ne contredit pas le niveau 1 ni `BIBLE.md`.

---

## Champs dérivés de ps-eglise (niveau 1)

- **resume** : Église de granit au bout des cent marches, avec sa nef, sa sacristie et sa crypte.
- **accroche** (vue de la place) : Au bout des cent marches, un clocher-lanterne de granit se dresse sur le promontoire, et une lueur bleue brille à la nef.
- **visuel** : Au sommet des cent marches, une église de granit gris s'appuie sur la falaise, son clocher-lanterne ajouré dressé au-dessus de la nef. Un portail de chêne bleu écaillé, sous un linteau de pierre usé par le sel, s'ouvre côté escalier ; le petit bloc de la sacristie se colle au flanc nord. La lumière dorée de fin d'après-midi glisse sur le granit et fait briller au fond le vitrail bleu. La porte est ouverte sur la nef.
- **ambiance** : Pierre froide, cire et sel.
- **description** (MJ) : L'église Sainte-Maëlle se dresse au bout des cent marches, sur le promontoire de granit gris qui ferme la baie au nord-ouest. Son clocher-lanterne, ajouré de baies rondes, se voit de toute la place ; le portail de chêne bleu, sous un linteau usé par le sel, s'ouvre sur une nef de bancs polis. Au fond, un vitrail bleu représente la sainte ; à côté, une porte mène à la sacristie, petite pièce de chaux et d'armoires. Sous le chœur, une grille de fer ouverte descend vers la crypte, où les marins noyés de la paroisse reposent dans des alcôves de pierre, à côté d'une niche vide et d'une armoire de chêne noir. L'église est celle du village : on y vient pour les mariages, les deuils et les veillées de tempête, et l'on y entre sans frapper. Le prêtre y reçoit chacun sur son banc. Le vent de mer fait tinter les cloches de bronze du clocher quand il tourne, et l'odeur de cire et de sel marque l'entrée.

---

### Niveau 2 : eg-nef (la nef, nef), dans ps-eglise

**Héritage** (recopié du niveau 1, ne pas modifier) :

- Héritage : charte du monde. Nuances : vitrail bleu de la sainte, bancs de chêne polis, bronze des cloches verdi, odeur de cire et de sel.
- **Dimensions et structure** : nef de 16 pas de long sur 7 de large, hauteur sous voûte de 5 pas ; deux files de bancs de chêne séparées par une allée centrale de 2 pas ; l'autel au fond, le portail à l'opposé.
- **Matériaux et état** : granit gris des murs, bancs de chêne polis par les mains des fidèles, dallage de galets sciés ; une tache de sel au bas du mur côté portail, un banc fendu près de la chaire.
- **Lumière** : le vitrail bleu au fond, au-dessus de l'autel, et deux fenêtres étroites à gauche ; le soir, la lumière dorée tombe en bandes sur les bancs. De nuit, seule une bougie sur l'autel.
- **Sons** : pas qui sonnent sur les galets, ressac sous la falaise, goélands au-dehors.
- **Odeurs** : cire, sel, encens froid.
- **Température** : fraîche, plus que dehors au soleil ; plus humide près du portail.
- **Éléments remarquables** (chacun avec sa place) :
  - vitrail bleu au fond, au-dessus de l'autel, sur trois pas de haut ;
  - chaire de chêne à droite en entrant, contre le mur ;
  - grille de fer à deux battants, ouverte, au pied de l'autel ;
  - porte de la sacristie dans le mur nord, à gauche de l'autel ;
  - pile de cierges neufs au pied du troisième pilier de gauche.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `eg-sacristie` : description : Porte de chêne à deux panneaux, peinte en bleu écaillé, dans le mur nord près de l'autel ; elle reste close. ; retour : Même porte vue de l'intérieur : planche de chêne nue, verrou de fer, et la lumière de la nef qui filtre sous le seuil.
  - vers `eg-crypte` : description : Grille de fer ouverte au pied de l'autel ; au-delà, douze marches usées descendent dans une lueur jaune et une odeur de sel froid. ; retour : Depuis la crypte, les douze marches remontent vers un rectangle de jour gris, cadré par la grille ouverte.
  - vers `ps-place` (par le parvis et les cent marches) : description : Double portail de chêne bleu, ouvert sur le parvis et l'escalier des cent marches ; en plein jour, la lumière entre en bande sur les dalles. ; retour : Vu de la place, le portail n'est qu'une tache sombre au sommet des marches ; le vent y pousse l'odeur de cire et les cloches du clocher.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | rencontre sociale : prie pour le retour du livre, demande de l'aide | premier banc à gauche, devant l'autel | `pere-aubin` | Perspicacité |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) :
  - Avant : la nef est presque vide, les cierges sont éteints, le prêtre attend seul devant l'autel.
  - Après `choix-eglise` (le livre rendu à Aubin, fin 1) : les bancs se remplissent pour la lecture de la Bonace, les cierges sont allumés, la lumière du vitrail reste la même.
- **Un détail propre à ce lieu** : au pied du troisième pilier de gauche, une pile de cierges neufs, enveloppée dans de la toile cirée, sans mèche brûlée : quelqu'un les a apportés pour une veillée qui n'a pas eu lieu.

**Champs dérivés**
- **resume** : Une nef de chêne et de granit, sous un vitrail bleu, où la fête de la Mer s'est arrêtée.
- **accroche** : Sous le clocher-lanterne, le portail de chêne bleu reste entrouvert ; on entend des voix basses et le craquement des bancs.
- **visuel** : Une nef étroite de granit gris, aux bancs de chêne polis disposés en deux files que sépare une allée de galets. Au fond, un vitrail bleu tombe sur l'autel en bandes de lumière, et à droite une chaire de chêne se détache contre le mur. Une grille de fer ouverte, au pied de l'autel, laisse voir les premières marches de la crypte ; la lumière dorée du soir entre par deux fenêtres étroites à gauche.
- **ambiance** : Cire, bancs polis, bleu de vitrail.
- **description** (MJ) : La nef est une salle longue et simple, de granit gris sous une charpente de chêne. Deux files de bancs polis par les mains des fidèles encadrent une allée centrale ; la chaire de chêne est à droite, contre le mur, et l'autel occupe le fond, sous le vitrail bleu qui représente la sainte, la main levée sur une mer calme. Le portail est à l'opposé de l'autel, côté place : on y entre depuis le parvis en haut des cent marches. Au pied du troisième pilier de gauche, une pile de cierges neufs attend sur une toile cirée. À gauche de l'autel, une porte de chêne mène à la sacristie ; derrière l'autel, la grille de fer ouverte laisse descendre l'escalier de la crypte. Le père Aubin s'installe d'ordinaire sur le premier banc, devant l'autel, et reçoit ceux qui viennent demander conseil. Rien dans la nef n'est cassé ni fermé : l'église est ouverte depuis le matin, et le prêtre parle à voix basse, comme on le fait dans une église.

---

### Niveau 2 : eg-sacristie (la sacristie, sacristie), dans ps-eglise

**Héritage** (recopié du niveau 1, ne pas modifier) :

- Héritage : charte du monde. Nuances : vitrail bleu de la sainte, bancs de chêne polis, bronze des cloches verdi, odeur de cire et de sel.
- **Dimensions et structure** : pièce carrée de 6 pas sur 5, plafond bas de 3 pas ; une seule fenêtre étroite dans le mur nord, à trois pas du sol ; une porte dans le mur est vers la nef.
- **Matériaux et état** : moellons de granit enduits de chaux qui s'écaille au bas du mur est ; armoires de chêne noir ; table couverte de toile cirée ; humidité près du seau.
- **Lumière** : la fenêtre du nord, grise et indirecte, n'atteint pas le fond de la pièce ; de nuit, une bougie sur la table, et les ombres des armoires.
- **Sons** : silence de la pierre, goutte d'eau qui tombe dans un seau, ressac lointain amorti par le mur.
- **Odeurs** : cire froide, tisane à la menthe, sel.
- **Température** : plus froide que la nef, humide.
- **Éléments remarquables** (chacun avec sa place) :
  - armoire de chêne noir contre le mur est, étagères d'aubes et de chasubles pliées, registre des offrandes posé sur le dessus ;
  - lit de sangle étroit contre le mur nord, sous la fenêtre, couvert de laine grise ;
  - coffre des offrandes : coffre de chêne ferré, long d'un pas, posé à gauche de la porte de la nef, serrure de laiton ;
  - crochet de fer vide sur le panneau de bois au-dessus du coffre, avec une étiquette tracée à la craie qui porte le mot « crypte » (indice).
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `eg-nef` : description : Porte de chêne nue, fermée par un verrou de fer côté sacristie ; la lumière de la nef filtre sous le seuil. ; retour : Vue de la nef, une porte de chêne bleu écaillé, close, sans poignée visible.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | piège | aiguille de laiton enduite de poison, qui sort de la serrure si l'on ouvre le coffre sans la bonne manœuvre (effet à créer) | coffre des offrandes | à créer | Perception (repérer), Dextérité (outils de voleur) pour désamorcer |
  | trésor | offrandes : pièces de cuivre et d'argent, cierges de cire | dans le coffre des offrandes | à créer | |
  | PNJ | rencontre sociale : malade, elle parle de son fils avec prudence | lit de sangle contre le mur nord | `helene-ancre` | Perspicacité |
  | indice (décor) | le crochet de la clé est vide | crochet au-dessus du coffre | | Perception |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) :
  - Avant : Hélène est malade, le lit reste occupé, la fenêtre est fermée.
  - Après `choix-tobie` (fin 3, la page de soin lue par Tobie) : le lit est vide, la fenêtre est ouverte, la cuvette a été rincée et rangée.
- **Un détail propre à ce lieu** : sur la table, une cuvette d'eau tiède et un linge plié, mouillé de tisane à la menthe ; une chaise est tirée en biais, comme si quelqu'un venait de se lever.

**Champs dérivés**
- **resume** : Une petite pièce de chêne et de chaux, où l'on range les ornements et où l'on soigne ceux qui ne peuvent pas rentrer chez eux.
- **accroche** : Au flanc nord de l'église, un petit bâtiment bas, une fenêtre étroite au ras de la pierre, et une lueur de bougie qui filtre.
- **visuel** : Une pièce basse de moellons enduits de chaux, avec une armoire de chêne noir contre le mur est, couverte d'aubes pliées. Un lit de sangle étroit, couvert de laine grise, occupe le mur nord sous une fenêtre étroite ; un coffre de chêne ferré, long d'un pas, est posé à gauche de la porte. Une bougie sur la table éclaire un linge et une cuvette ; la lumière grise de la fenêtre n'atteint pas le fond.
- **ambiance** : Chaux, tisane, cire froide.
- **description** (MJ) : La sacristie est une pièce basse et carrée, accolée au flanc nord de l'église, où l'on range les ornements et où l'on soigne ceux qui ne peuvent pas rentrer chez eux. Le long du mur est, une armoire de chêne noir contient des aubes et des chasubles pliées, et le registre des offrandes est posé sur le dessus. Contre le mur nord, sous l'unique fenêtre étroite, un lit de sangle est couvert de laine grise. Hélène Ancre y est installée, malade depuis plusieurs semaines ; elle reçoit les visites sans se lever, et la conversation tourne vite vers la fièvre. À gauche de la porte de la nef se trouve le coffre des offrandes, coffre de chêne ferré où les fidèles glissent des pièces ; sa serrure de laiton n'a pas de clé visible. Au-dessus du coffre, un crochet de fer vide pend au panneau de bois, sous une étiquette à la craie qui porte le mot « crypte ». Le seau à eau et le linge sont à portée du lit.

---

### Niveau 2 : eg-crypte (la crypte, crypte), dans ps-eglise

**Héritage** (recopié du niveau 1, ne pas modifier) :

- Héritage : charte du monde. Nuances : vitrail bleu de la sainte, bancs de chêne polis, bronze des cloches verdi, odeur de cire et de sel.
- **Dimensions et structure** : salle de 10 pas d'est en ouest sur 7 du nord au sud, voûte en berceau de granit à 2 pas et demi du sol ; escalier de douze marches arrivant au milieu du mur est, large de 3 pas.
- **Matériaux et état** : moellons de granit, enduit de la voûte tombé par plaques ; sol de dalles usées, humide au centre ; poussière épaisse, sauf sur le rectangle propre de la niche ; cuivre verdi au joint de la dalle ; bronze verdi des cloches.
- **Lumière** : une lampe à huile sur une console du mur sud, faible et chaude ; le jour de l'escalier, gris, n'atteint que le tiers de la salle. De nuit, la lampe seule.
- **Sons** : goutte d'eau qui tombe sur la pierre, écho long ; la nuit, des murmures venus du fond.
- **Odeurs** : sel froid, pierre mouillée, cire ancienne, vieux bois.
- **Température** : froide, nettement plus que la nef.
- **Éléments remarquables** (chacun avec sa place) :
  - ossuaire : alcôves de pierre sur trois rangs le long du mur nord, sur 6 pas de long, crânes et ossements rangés, têtes côté pierre ;
  - niche vide au mur ouest, au centre, creusée en arc, un pas de large sur un de haut, avec un rectangle plus clair dans la poussière au fond ;
  - dalle à plaque devant la niche, au sol, dalle de granit de 2 pas sur 1, bord cerclé de cuivre, plaque de cuivre encastrée au centre ;
  - trois cloches de bronze verdi suspendues à une poutre de chêne qui traverse la salle du mur nord au mur sud, au tiers de la longueur depuis l'escalier, à hauteur de tête ; tailles différentes, chacune avec un cercle gravé d'un motif différent ;
  - armoire de la sainte : armoire de chêne noir contre le mur sud, près de la niche, fermée par une barre de fer et une serrure de bronze à anneau ;
  - lampe à huile sur une console du mur sud, près de l'armoire.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `eg-nef` : description : Douze marches usées remontent vers un rectangle de jour gris, cadré par la grille de fer ouverte, au milieu du mur est. ; retour : Depuis la nef, une grille de fer ouverte au pied de l'autel ; les marches s'enfoncent dans une lueur jaune.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | monstre | combat « les noyés de l'ossuaire » : squelettes, niveau 2, calés pour 4 héros ; issue : apaiser les noyés par une prière | sortent des alcôves du mur nord | `squelette` (profil SRD) | Combat ; prière : Religion |
  | piège | dalle à plaque ; effet à créer | dalle devant la niche | à créer | Perception (repérer le joint de cuivre), Dextérité (outils de voleur) |
  | énigme | trois cloches à sonner dans l'ordre des marées ; ouvrent l'armoire de la sainte et son registre des lectures | les trois cloches sous la poutre ; l'armoire | `eg-e-cloches-de-maree` | Investigation |
  | trésor | potion bénite | dans l'armoire de la sainte | à créer | |

- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) :
  - Avant : la niche est vide, la poussière est intacte autour du rectangle clair, les noyés s'agitent et murmurent la nuit.
  - Après `livre-retrouve` : les murmures cessent. Le canon ne dit pas où le livre est replacé ensuite : à trancher avant d'écrire ce point.
- **Un détail propre à ce lieu** : au pied de l'alcôve la plus proche de l'escalier, un crâne porte une couronne de fil de chanvre tressé, nouée en cocarde bleue, avec une bougie de cire morte à ses pieds.

**Champs dérivés**
- **resume** : Une crypte basse sous le chœur, ossuaire de marins noyés, avec une niche vide et trois cloches.
- **accroche** : Sous le chœur, une grille de fer ouverte laisse monter une odeur de sel froid et une lueur jaune.
- **visuel** : Une salle longue et basse, voûtée de granit à deux pas et demi du sol, creusée sous le chœur. Des alcôves de pierre rangent des crânes et des ossements le long du mur nord ; au fond du mur ouest, une niche creuse garde un rectangle plus clair dans la poussière, devant une dalle cerclée de cuivre. Trois cloches de bronze verdi pendent à une poutre de chêne au centre de la salle, à hauteur de tête, et une armoire noire se dresse près d'une lampe à huile posée sur une console. Seule la lampe éclaire la pierre humide ; le jour de l'escalier n'atteint que le tiers de la salle.
- **ambiance** : Pierre humide, sel froid, bronze verdi.
- **description** (MJ) : La crypte s'étend sous le chœur, dix pas d'est en ouest et sept du nord au sud, sous une voûte de granit qui ne dépasse pas deux pas et demi. Les marins noyés de la paroisse y sont rangés depuis des siècles : les alcôves de pierre du mur nord, sur trois rangs, portent des crânes et des os. Au centre de la salle, une poutre de chêne traverse la pièce d'un mur à l'autre ; trois cloches de bronze verdi y pendent, de tailles différentes, à hauteur de tête, et chacune porte un cercle gravé d'un motif différent. Le long du mur sud, l'armoire de la sainte, en chêne noir, est fermée par une barre de fer et une serrure de bronze à anneau ; une lampe à huile sur une console voisine est la seule lumière. Au fond, à l'ouest, la niche creuse est vide : elle a la taille d'un livre, et la poussière autour est lisse sur un rectangle plus clair. Devant la niche, la dalle de granit est cerclée de cuivre, et une plaque du même métal est encastrée en son centre. L'escalier de douze marches arrive au milieu du mur est. Il fait froid, et l'air sent le sel et la pierre mouillée.

<!-- niv2-ps-crique -->

> **Validé par l'utilisateur le 06/11/2026** (V5, lieu 5/5). Gelé. Arbitrages : alarme rattachée à l'énigme du coffre ; guetteur anonyme (12 PNJ) ; le sentier relie `cr-plage` à `pl-quai` ; les effectifs des combats seront calés sur le budget de PX en V6.

## Niveau 1 : ps-crique (Crique des Gueux, crique et grotte)

### Champs dérivés de ce lieu
- **resume** : Une anse de sable gris, à quarante minutes de la place par la falaise, avec des épaves de barques, un entrepôt de bois goudronné et une grotte sous la falaise.
- **accroche** (vue du sentier des Goémons) : Au bout du sentier, la falaise s'ouvre sur une anse de sable gris ; un hangar de bois goudronné et des épaves de barques au bord de l'eau.
- **visuel** : Une anse de sable gris fermée à gauche et à droite par des murs de granit gris, vue du haut du sentier. Au premier plan, deux épaves de barques échouées, leur bordé bleu ardoise écaillé, et des mares qui brillent entre les pierres. Au fond, à droite, un hangar de bois goudronné adossé à la falaise, et plus haut une fente sombre dans la roche, l'entrée d'une grotte. La lumière dorée tombe de biais sur le sable, et la mer, à marée basse, est loin à l'ouest.
- **ambiance** : Ressac, goélands, bois qui craque.
- **description** (MJ) : La crique des Gueux est une anse de sable gris d'une trentaine de mètres, fermée au nord et au sud par des murs de granit. On y descend par le sentier des Goémons, qui part de la place de la Criée et longe la falaise sud : quarante minutes de marche, avec un passage noyé aux fortes marées. À marée basse, la plage est large et praticable ; à marée haute, la crique ne se joint plus que par la mer. Sur le sable, deux épaves de barques échouées, des mares où vivent des crabes, des cordes salées qui pourrissent sur des pieux et des algues sèches. À l'est, un entrepôt de bois goudronné est adossé à la falaise, avec ses caisses, ses tonneaux et une barque légère sur des rouleaux. Une grotte creusée sous la falaise s'ouvre au fond de l'entrepôt, par un couloir de roche ; à l'intérieur, un ponton de planches longe une eau de mer calme et un coffre de chêne est fixé au mur. Le lieu ne se trouve que par le sentier, ou par la mer.

---

### Niveau 2 : cr-plage (la plage et ses mares, plage), dans ps-crique

**Héritage** (recopié du niveau 1, ne pas modifier) :

- **Dimensions et structure** : 24 × 14 cases (environ 36 × 21 m ; une case = 1,5 m). Sable gris en pente douce, de la falaise au nord vers la mer au sud-ouest. Entrepôt à l'est ; sentier de falaise au nord-ouest.
- **Matériaux et état** : sable gris, galets, granit de la falaise ; bois gris d'humidité des épaves ; chevilles de cuivre vert-de-gris ; cordes salées qui pourrissent sur les pieux ; algues sèches.
- **Lumière** : dorée et basse, venant de l'ouest au-dessus de la mer ; ombres longues des épaves vers l'est.
- **Sons** : ressac, goélands, craquement du bois des épaves, cliquetis des crabes dans les mares.
- **Odeurs** : algues, sel, goudron venu de l'entrepôt.
- **Température** : fraîche à l'ombre de la falaise, tiède au soleil.
- **Éléments remarquables** (chacun avec sa place) :
  - épave 1 : bordé bleu ardoise écaillé, mât brisé, cases x 8 à 11, y 3 à 4 (centre-nord) ;
  - épave 2 : quille contre le sable, cases x 17 à 20, y 5 à 6 (est) ;
  - quatre mares peu profondes (terrain difficile) : A, x 5 à 7, y 8 à 9 ; B, x 11 à 13, y 10 à 11 ; C, x 16 à 18, y 9 à 10 ; D, x 20 à 21, y 11 à 12 (sud) ;
  - pieux et cordes salées contre la falaise, cases x 22, y 1 à 3 (nord-est) ;
  - passe de rochers au sud-ouest, cases x 0 à 4, y 10 à 13 : praticable seulement à marée basse, elle mène au bord de la mer.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `cr-entrepot` : description : Un mur de planches goudronnées percé d'une porte double, à l'est, ouverte sur la lueur d'une lanterne. ; retour : Une porte double de planches, ouverte sur le sable gris et la lueur du jour.
  - vers `pl-quai` (sentier des Goémons) : description : Un sentier de falaise, marqué de piquets, remonte vers le nord-ouest entre les rochers ; il est noyé à marée haute. ; retour : Le sentier des Goémons part du quai, par la grève, et longe la falaise sud ; il est noyé aux fortes marées.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | monstre (4 × `crabe-geant`) | combat 3 « les crabes des mares » (niveau 2, calé pour 4 héros) | les mares A à D | à créer | — |

  Issue hors combat (texte pour le MJ) : passer par la passe de rochers au sud-ouest, à marée basse.
- **Avant / après** : aucun changement prévu par le canon ; la marée haute noie le sentier des Goémons (traité au niveau 1).
- **Un détail propre à ce lieu** : une bouée de liège rouge, pendue au pieu de l'épave 1, dont la peinture s'écaille en pelures.

**Champs dérivés**
- **resume** : Une plage de sable gris semée de mares et d'épaves, où la marée décide du passage.
- **accroche** : Au pied de la falaise, une plage de sable gris où brillent des mares et deux épaves de barques échouées.
- **visuel** : Une plage de sable gris en pente douce, fermée au nord par une falaise de granit et au sud-ouest par une passe de rochers. Trois éléments remarquables : deux épaves de barques échouées, l'une au centre-nord, l'autre à l'est, leur bordé bleu ardoise écaillé ; quatre mares peu profondes au sud, luisantes d'algues ; une bouée de liège rouge pendue au pieu de la première épave. La lumière dorée vient de l'ouest, au-dessus de la mer, et allonge les ombres des épaves vers l'est.
- **ambiance** : Ressac, goélands, craquements de bois mouillé.
- **description** (MJ) : La plage occupe le centre de l'anse : 24 cases sur 14, soit environ 36 sur 21 mètres. Le sable gris monte doucement depuis la mer, au sud-ouest, jusqu'à la falaise au nord. Le sentier de falaise arrive par le nord-ouest, entre deux rochers. À marée basse, une passe de rochers au sud-ouest permet de contourner le sable par la mer. Quatre mares peu profondes s'étendent au sud, pleines d'algues et de crabes qui se cachent sous les pierres. Deux épaves de barques sont échouées : la première, au centre-nord, a son bordé bleu écaillé et un mât brisé ; la seconde, à l'est, repose sur sa quille. Une bouée de liège rouge est pendue au pieu de la première. À l'est, la porte double de l'entrepôt ouvre sur le sable. Il n'y a rien à prendre sur la plage.

---

### Niveau 2 : cr-entrepot (l'entrepôt, entrepôt), dans ps-crique

**Héritage** (recopié du niveau 1, ne pas modifier) :

- **Dimensions et structure** : 14 × 10 cases (environ 21 × 15 m) ; hauteur de deux cases et demie. Adossé à la falaise : le mur nord est la roche, taillée à l'équerre. Porte double à l'ouest (cases x 0, y 4 à 5) vers la plage ; porte basse au nord-est (cases x 11 à 12, y 0) vers la grotte.
- **Matériaux et état** : planches de bois goudronné, brun presque noir, posées à la verticale ; poutres de chêne ; fer des crochets et des cerclages rouillé ; caisses de bois clair, neuves, cerclées de fer ; toile cirée ; cordes ; odeur de moisi sur la toile.
- **Lumière** : deux lanternes de poisson, ambre, accrochées aux poutres (cases x 1, y 3, et x 9, y 2) ; le jour entre par la porte ouest.
- **Sons** : planches qui grincent, goélands au-dehors, sifflement d'air sous la porte basse.
- **Odeurs** : goudron, sel, huile de poisson.
- **Température** : sèche, un peu plus chaude que dehors.
- **Éléments remarquables** (chacun avec sa place) :
  - deux piles de caisses neuves cerclées de fer, contre le mur nord, cases x 1 à 6, y 0 à 1 ;
  - caisse de tête, couverte d'une bâche, contre le mur est, cases x 12 à 13, y 2 à 3 ;
  - table de travail au centre, cases x 6 à 8, y 5 à 6 : balance, couteaux, rouleaux de corde ;
  - barque légère sur des rouleaux, cases x 3 à 9, y 8 à 9 (sud), proue tournée vers la porte ouest ;
  - trois tonneaux le long du mur est, cases x 13, y 6 à 8 ;
  - toile cirée roulée en tas, cases x 1 à 2, y 7 à 8.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `cr-plage` : description : Une porte double de planches, ouverte sur le sable gris et la lueur du jour. ; retour : Un mur de planches goudronnées percé d'une porte double, à l'est, ouverte sur la lueur d'une lanterne.
  - vers `cr-grotte` : description : Au fond, une porte basse de planches s'ouvre sur un couloir de roche qui sent le sel et l'huile ; une lanterne y brûle. ; retour : Le couloir sort de la roche sous la falaise ; la porte de planches donne sur les caisses de l'entrepôt.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | monstre (4 × `bandit`) | combat 4 « les bandits de l'entrepôt » (calé pour 4 héros) ; issues : se faire passer pour des acheteurs (rencontre sociale), saboter la barque (jauge `grande-maree` −1) | la table, les caisses, la barque | à créer | — |
  | guetteur bavard **anonyme** (pas une fiche de PNJ : le budget reste à 12) | rencontre sociale : parle de la fête, de la marée et des caisses ; ne révèle aucun fait | un tonneau près de la porte ouest, case x 1, y 7 | à créer | Persuasion |
  | trésor (objet : `cle-de-la-crypte`) | la clé volée à Tobie, preuve | caisse de tête, sous la bâche | cle-de-la-crypte | Fouille |
  | trésor (caisses de contrebande) | sel, toile cirée, bouteilles d'alcool de prune | piles de caisses nord | à créer | — |

- **Avant / après** : à jauge 3 (canon : « Sorel déplace ses hommes ») les bandits ont quitté l'entrepôt pour la grotte ; le guetteur reste seul avec les caisses.
- **Un détail propre à ce lieu** : une caisse porte à la craie une vague à trois crêtes, tracée d'une main pressée.

**Champs dérivés**
- **resume** : Un entrepôt de bois goudronné, adossé à la falaise, plein de caisses et de toile cirée.
- **accroche** : Sous la falaise, un long hangar de bois goudronné, une porte ouverte sur la plage et deux lanternes qui brûlent.
- **visuel** : Un hangar de planches goudronnées, brun presque noir, adossé à une falaise de granit gris ; une porte double ouverte à l'ouest, sur le sable. Trois éléments remarquables : deux piles de caisses neuves cerclées de fer contre le mur nord, une table de travail au centre, une barque légère sur des rouleaux au sud. Deux lanternes de poisson, ambre, éclairent la pièce, et le jour entre par la porte ouverte.
- **ambiance** : Planches qui grincent, goudron, lanternes qui sifflent.
- **description** (MJ) : L'entrepôt est un hangar de 14 sur 10 cases, aux planches de bois goudronné posées à la verticale. Le mur nord est la falaise elle-même. Contre ce mur, deux piles de caisses neuves cerclées de fer ; plus loin, un tas de toile cirée roulée. La caisse de tête, couverte d'une bâche, est au fond, contre le mur est : c'est là que la clé est rangée. Au centre, une table de travail porte une balance, des couteaux et des rouleaux de corde. Au sud, une barque légère repose sur des rouleaux, la proue tournée vers la porte ouest. Trois tonneaux sont alignés le long du mur est. Au fond, dans le mur de falaise, une porte basse mène au couloir de la grotte. Deux lanternes de poisson pendent aux poutres, l'une près de la porte ouest, l'autre au centre-nord. Le jour n'entre que par la porte ouverte ; l'odeur de goudron reste dans les vêtements.

---

### Niveau 2 : cr-grotte (la grotte de Sorel, grotte), dans ps-crique

**Héritage** (recopié du niveau 1, ne pas modifier) :

- **Dimensions et structure** : chambre de 12 × 8 cases (environ 18 × 12 m), plafond haut d'environ trois mètres. Couloir d'entrée de 2 cases de large et 6 cases de long, qui arrive par le mur ouest depuis la porte basse de l'entrepôt. Plate-forme de rocher sec à l'ouest (cases x 0 à 7, y 0 à 4) ; ponton de planches goudronnées (cases x 3 à 11, y 5 à 6) ; eau de mer profonde en contrebas (case y 7, terrain difficile).
- **Matériaux et état** : granit gris, humide ; mousse vert-de-gris près de l'eau ; planches goudronnées du ponton, usées au milieu ; chaloupe de bois goudronné ; coffre de chêne cerclé de laiton, verdi aux charnières ; anneau de fer scellé dans la roche.
- **Lumière** : une lanterne de poisson, ambre, suspendue à un crochet de fer au mur ouest, au-dessus de l'entrée ; une fente au plafond, au-dessus du bout est du ponton (cases x 10 à 11, y 5 à 6), laisse entrer une lumière pâle du jour.
- **Sons** : ressac et clapotis sous le ponton, gouttes qui tombent, écho.
- **Odeurs** : sel, algue, huile de lanterne, goudron.
- **Température** : fraîche et humide, plus froide que l'entrepôt.
- **Éléments remarquables** (chacun avec sa place) :
  - coffre à cadrans, contre le mur nord, cases x 8 à 9, y 0 ; trois cadrans de laiton sur sa face avant ;
  - marques de marée gravées dans le mur nord, à droite du coffre, cases x 10 à 11, y 0 à 1 : des rangs de traits de hauteurs différentes, chacun avec son chiffre gravé à côté ;
  - ponton de planches, cases x 3 à 11, y 5 à 6 ;
  - chaloupe amarrée au ponton, cases x 4 à 6, y 7 (dans l'eau) ;
  - anneau de fer et chaîne d'ancre, au bout est du ponton ;
  - fil fin de laiton reliant la serrure du coffre à une clochette sous le plafond, au-dessus du coffre (cases x 8 à 9, y 0) ; invisible si on ne fouille pas.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `cr-entrepot` : description : Le couloir sort de la roche sous la falaise ; la porte de planches donne sur les caisses de l'entrepôt. ; retour : Au fond, une porte basse de planches s'ouvre sur un couloir de roche qui sent le sel et l'huile ; une lanterne y brûle.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ (`sorel-noirbec`) | négociation (le livre contre la fuite, ou la somme) ou combat 5 « Sorel et ses hommes » (profil `chef-de-bande`, calé pour 4 héros) | debout devant le coffre, case x 7, y 2 | sorel-noirbec | Persuasion (DD selon l'attitude) |
  | monstre (2 × `bandit`) | combat 5 : les hommes de Sorel, sur la plate-forme | cases x 5, y 3 et x 9, y 3 | à créer | — |
  | piège (cloche d'alarme, rattachée à l'énigme : `echec.piege`) | une mauvaise combinaison fait sonner la clochette ; la jauge `grande-maree` monte d'un cran | fil de laiton du coffre à la clochette | à créer | Détection (fouille) |
  | énigme (`cr-e-coffre-de-sorel`) | ouvrir le coffre à cadrans ; les marques de marée gravées au mur nord donnent les chiffres | coffre, cases x 8 à 9, y 0 ; marques, cases x 10 à 11, y 0 à 1 | cr-e-coffre-de-sorel | — |
  | trésor (coffre, contenant) | le coffre de chêne ; il ne s'ouvre que par l'énigme | cases x 8 à 9, y 0 | à créer | — |
  | objet (`livre-de-maelle`) | le grimoire, objet de quête | dans le coffre | livre-de-maelle | — |
  | objet (`lettre-de-verdelune`) | la lettre qui prouve la vente et l'heure du navire | dans le coffre | lettre-de-verdelune | — |

- **Avant / après** : à jauge 3 (canon : « Sorel déplace ses hommes ») les bandits de l'entrepôt viennent dans la grotte. À jauge 4 (fin d'échec `f-fin-echec`) le coffre est vide : le livre et la lettre ont embarqué sur la chaloupe.
- **Un détail propre à ce lieu** : une ancre rouillée au bout du ponton, sa chaîne passée dans l'anneau de fer ; la chaloupe s'y cogne doucement.

**Champs dérivés**
- **resume** : Une grotte creusée sous la falaise, un ponton sur une eau calme et un coffre de chêne contre le mur.
- **accroche** : Dans la falaise, au-dessus de l'entrepôt, une fente sombre ; un souffle d'air frais sort de la roche et sent le sel.
- **visuel** : Une grotte de granit gris, basse à l'entrée puis plus haute au fond, qui se prolonge par un couloir de roche venu de l'entrepôt. Trois éléments remarquables : un coffre de chêne cerclé de laiton contre le mur nord, avec trois cadrans de laiton sur sa face ; un ponton de planches goudronnées qui avance sur une eau calme, une chaloupe amarrée au bout ; une fente au plafond, au-dessus du bout du ponton. Une lanterne de poisson accrochée à un crochet de fer éclaire les lieux d'un ambre chaud, et la lumière pâle de la fente tombe sur l'eau.
- **ambiance** : Eau calme, écho, lanterne qui crépite.
- **description** (MJ) : La grotte s'ouvre au bout d'un couloir de roche de six cases, qui part de la porte basse de l'entrepôt. La chambre fait douze cases sur huit, soit environ dix-huit mètres sur douze, et son plafond laisse passer un homme debout. La moitié ouest est une plate-forme de rocher sec, où l'on peut se tenir à l'aise. À l'est, un ponton de planches goudronnées avance sur une eau de mer calme et profonde ; une chaloupe est amarrée à son bout, et une ancre rouillée retient sa chaîne. Une fente dans le plafond laisse tomber une lumière pâle au-dessus du ponton. Le coffre de chêne, cerclé de laiton, est fixé au mur nord ; à sa droite, des marques de marée sont gravées dans la roche, alignées à hauteur d'épaule, chacune avec un chiffre. Le coffre renferme un livre relié de cuir et une lettre scellée. Le lieu est humide et frais, et chaque bruit revient deux fois.

---

## Suivi V6 (contenu écrit)
- Z1, place et quai (gilda-fauvel, cyprien-crieur, mirande-sel, tobie-ancre ; 3 rencontres ; cachette du hangar) : **validé par l utilisateur le 06/11/2026**. Gelé.
- Z1, taverne (maeva-brisant, gaspard-vent ; 2 rencontres sociales ; combat des rats ; 2 trésors) : **validé par l utilisateur le 06/11/2026**. Gelé.
- Z1, caserne (odile-marsan, piotr-lenoir, basile-ecume ; 3 rencontres sociales ; 2 trésors) : **validé par l utilisateur le 06/11/2026**. Zone 1 terminée.
