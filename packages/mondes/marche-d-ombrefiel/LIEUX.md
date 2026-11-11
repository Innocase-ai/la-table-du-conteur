# Atlas des lieux de La Marche d'Ombrefiel

Document de travail (le moteur ne le lit pas) : **source unique** des descriptions de lieux, des images et des cartes. Écrit de haut en bas : niveau 0 (la carte du monde), niveau 1 (chaque lieu de cette carte), niveau 2 (chaque point à visiter). Un niveau ne contredit jamais celui du dessus.

Positions : `(x, y)` en % de la carte du parent (x : 0 à gauche, 100 à droite ; y : 0 en haut, 100 en bas). Ce sont des **intentions** ; on les replace d'après l'image réelle une fois la carte générée.

> **Niveau 0 : validé par l'utilisateur le 11/11/2026 (V3). Gelé : tout changement demande un nouveau oui.** Les éléments marqués **✚** sont des arbitrages ou des durées inventées (le dossier d'origine ne les donne pas). Niveaux 1 et suivants : à écrire zone par zone (V4) après le oui du niveau 0 ; le gabarit complet est dans `.claude/skills/decrire-lieux/`.

---

## Niveau 0 : la carte du monde

Racine : `marche-d-ombrefiel` (région).

### Le territoire
- **Forme générale** : une province frontière, large d'environ **90 km d'ouest en est** et de **70 km du nord au sud** ✚, qui descend des collines de schiste d'Ombrefiel (ouest) vers une côte plate et rocheuse (nord) ✚. Au sud-centre, le **Carrefour d'Aldric**, sur une butte calcaire dans une plaine boueuse : c'est là que se croisent la Route du Roi (nord, vers Haute-Garde) et la Piste de Sombreval (ouest).
- **Orientation** (où est le nord) : le **nord est en haut** ; la **Mer Grise** borde toute la côte nord ✚ (Haute-Garde y est bâtie en amphithéâtre).
- **Échelle** (jours de marche d'un bout à l'autre) : environ **deux jours** de marche de Sombreval à Haute-Garde par Aldric ✚ ; **la boue double les durées hors des pavés** (terrain difficile).
- **Relief** : à l'ouest, les **contreforts schisteux d'Ombrefiel** (gorge d'ardoise noire de Sombreval, puits de mine) ; au nord-ouest de Sombreval, la **Forêt des Murmures** de chênes géants moussus ; au nord-est, un **plateau de basalte** dominé par l'aiguille de la **Tour d'Onyx** (falaise de 400 m, Escalier des Vents), au-dessus d'un **delta de tourbières** (les Marais de Vieux-Saule) proche de la côte.
- **Eaux** : la **Noire-Eau**, ruisseau marécageux qui naît en forêt (la **Haute Noire-Eau**, navigable en barge), passe au sud du Carrefour sous le Vieux Pont, remonte vers l'est puis le nord-est et s'élargit en delta dans les marais, près de la côte ✚. Eaux souterraines acides des mines. La **Mer Grise** au nord.
- **Climat et saisons** : **automne perpétuel**, crachin, brouillard humide ; plus froid et venteux en altitude (tempêtes d'altitude, gelées matinales à la Tour d'Onyx) ; bruine tiède et miasmes dans les marais ; vents marins violents et orages au large de Haute-Garde.
- **Ce qu'on voit de loin** : les **cheminées et la fumée de soufre** des hauts-fourneaux de Sombreval ; la **silhouette noire de la Tour d'Onyx** sur le plateau, avec parfois des éclairs verts autour de son sommet ; le **Clocher des Tempêtes** de Haute-Garde (80 m) au-dessus de la côte ; la brume permanente sur la forêt ; les **deux pendus** de la potence du Carrefour.

### Charte du monde (bloc d'héritage racine)
- **Matériaux** (3 à 5) : **ardoise noire** et schiste ; **grès gris** et granit gris ; **chêne noirci** de suie et de pluie ; **fer rouillé** ou friable ; tourbe et vase.
- **Couleurs** (4 à 6, d'après la palette de `monde.json`) : gris ardoise, brun bistre, rouille, vert de mousse, noir de suie, orange de forge.
- **Formes d'architecture** (2 à 3) : **auberges-forteresses** à palissade de troncs et volets ferrés percés de meurtrières ; **ateliers et fonderies** à cheminées, passerelles et cuves ; **cité en amphithéâtre à triple enceinte** de granit, et **tours d'obsidienne** sur les crêtes.
- **Lumière type** : basse et grise ; l'**orange des forges** et des lanternes la nuit ; éclairs verts autour de la Tour d'Onyx.
- **Météo type** : crachin d'automne, brouillard humide, vent froid de couloir dans les gorges.
- **Sons de fond** : le vent, la pluie sur l'ardoise, le tintement lointain de wagonnets, des **marteaux qui se taisent** parce que le fer ne tient plus, des corneilles, des grincements d'engrenages.
- **Odeurs de fond** : suint de laine mouillée, tourbe remuée, bière tiède, soufre et vitriol, œufs pourris de méthane dans les marais, ozone près de la Tour, marée à Haute-Garde.

### Les grands lieux

| id | nom | type | position | reconnaissable de loin par | heures vers les voisins | menace ou promesse |
| --- | --- | --- | --- | --- | --- | --- |
| `ald-carrefour-d-aldric` | Le Carrefour d'Aldric | région (hub) | (36, 64) | la butte de l'auberge fortifiée et les deux pendus | Sombreval 5 h ; Haute-Garde ≈ 12 h par la Route du Roi (35 km) ✚ ; marais ≈ 10 h par la Noire-Eau ✚ | Le fer pourri se voit ici ; la promesse d'un abri, d'un forgeron et d'une enquête |
| `som-mines-de-sombreval` | Les Mines de Sombreval | région (mines) | (19, 64) | la fumée de soufre des hauts-fourneaux, la gorge d'ardoise | Aldric 5 h ; la forêt ≈ 4 h par la Brèche des Contrebandiers ou le sentier de muletiers ✚ | La source du poison ; Davor, Durn, Korgan |
| `mur-foret-des-murmures` | La Forêt des Murmures | région (forêt) | (14, 46) | une brume basse qui ne se lève jamais | Sombreval ≈ 4 h ✚ ; les marais ≈ 7 h en barge sur la Haute Noire-Eau ✚ | Le camp fortifié de la Griffe Noire ; le fer pur volé |
| `vsa-marais-de-vieux-saule` | Les Marais de Vieux-Saule | région (marais) | (64, 32) | des bulles de méthane et la fumée basse de forges cachées | Aldric ≈ 10 h ✚ ; Tour d'Onyx 3 h par l'Escalier des Vents | Les forges clandestines de Val-Brume ; des forgerons enchaînés |
| `ony-tour-d-onyx` | Les Ruines de la Tour d'Onyx | région (ruines, donjon) | (60, 24) | l'aiguille noire et ses éclairs verts | marais 3 h ; Haute-Garde 18 km ≈ 6 h par la Route militaire des Crêtes ✚, 45 min en wyverne | Le laboratoire où se distille la toxine ; Hildegarde prisonnière |
| `hau-haute-garde` | La Cité de Haute-Garde | région (ville) | (42, 14) | le Clocher des Tempêtes et la triple enceinte de granit | Aldric ≈ 12 h ✚ ; Tour d'Onyx ≈ 6 h ✚ | Le Conseil des Pairs, l'Échéance, le Chef Masqué |

### Routes et passages
- **La Route du Roi** : grande voie pavée qui monte d'Aldric droit vers le **nord** sur 35 km jusqu'à Haute-Garde ; praticable en carrosse ; **coupée par des barrages de péage illégaux du Lion d'Acier** (c'est ce qui enferme le groupe à Aldric au départ ; le palier « alerte orange » de l'Échéance y ajoute fouilles et barrages, et ferme la Porte du Dragon aux civils).
- **La Piste de Sombreval** : chemin de terre rocailleux et raviné qui part plein **ouest** du Carrefour, 15 km, 350 m de dénivelé.
- **Le sentier de muletiers secret** (derrière les forges de Sombreval) et la **Brèche des Contrebandiers** (niveau −3 de la mine, 300 m de tunnel) : deux passages vers la forêt, le second sort dans la Doline de la Résurgence.
- **La Haute Noire-Eau** : de l'Embarcadère des Bras Morts (forêt) à l'Anse des Épaves (marais) par barge à fond plat ; la **Noire-Eau** passe au sud d'Aldric (Vieux Pont) puis remonte vers le delta. Les chalands de contrebande y circulent.
- **L'Escalier des Vents** (1 200 marches taillées dans la falaise, Athlétisme DD 12 sans cordée, 3 h) et le **treuil alchimique** de l'Écluse Noire montent des marais à la Tour d'Onyx.
- **La Route militaire des Crêtes** (18 km, dalles de basalte, ≈ 6 h ✚) et la **ligne des wyvernes messagères** (45 min) relient la Tour d'Onyx à Haute-Garde, vers l'ouest ✚.
- **Les égouts centraux** et la **Bouche d'évacuation** donnent un accès clandestin à Haute-Garde.

### Composition de la carte (pour `images.json`, clé `carte-marche-d-ombrefiel`, 3 à 5 phrases)

> Carte régionale à la plume, bistre et sépia sur vieux parchemin, vue de dessus, nord en haut : une province frontière entre collines de schiste à l'ouest, plaine boueuse au centre, forêt brumeuse au nord-ouest, delta de tourbières au sud-est et plateau de basalte à l'est. Au sud-centre, la butte d'une auberge fortifiée au croisement de deux routes ; à l'ouest, une gorge noircie de fumées de hauts-fourneaux ; au nord, sur la côte, une cité en amphithéâtre derrière trois enceintes et un haut clocher ; à l'est de la cité, sur un plateau, une aiguille noire dentelée au-dessus d'un delta de tourbières. Un ruisseau sombre naît dans la forêt du nord-ouest, passe au sud de la butte puis remonte s'étaler en delta ; des routes pavées et des pistes tracées en traits fins. Teintes brun bistre, gris ardoise, touches de rouille et d'orange de forge, sans personnages.

### Notes de travail (arbitrages géographiques ✚, hors texte joueur)

Les sources d'origine sont **géométriquement incompatibles** ; la carte ci-dessus (échelle : 1 % de largeur ≈ 0,9 km, 1 % de hauteur ≈ 0,7 km) respecte le **canon validé** (Aldric → Sombreval 15 km à l'ouest ; Aldric → Haute-Garde 35 km au nord par la Route du Roi ; Tour d'Onyx → Haute-Garde 18 km ; Escalier des Vents des marais à la Tour) et tranche ainsi :

1. Les marais sont **au nord-est**, près de la côte, et non au sud-est d'Aldric (sinon la Tour d'Onyx, à 3 h de leur Écluse Noire, serait à plus de 35 km de Haute-Garde : impossible avec 18 km) ; la Noire-Eau fait donc le tour par le sud puis remonte (le dossier d'origine la dit tantôt « sud-est », tantôt vers le delta).
2. Haute-Garde est à l'**ouest** de la Tour d'Onyx (la zone 5 d'origine dit « vers l'est » pour la route des Crêtes ; la zone 6 d'origine place même Haute-Garde « à l'ouest » d'Aldric : contradiction non reprise).
3. La côte est au **nord** (aucune source ne donne la direction de la mer) ; les durées marquées ✚ sont des inventions à 3 km/h à pied ou 7 km/h en barge.

---

## Niveau 1 : ald-carrefour-d-aldric (Le Carrefour d'Aldric, région : hub et zone 1)

> **Validé par l'utilisateur le 11/11/2026 (V4, zone 1). Gelé : tout changement demande un nouveau oui.** (une fiche par zone, puis le niveau 2 lieu par lieu). Les éléments **✚** sont des arbitrages ou des inventions de cette fiche ; le reste vient du dossier d'origine (`zones/zone-1-carrefour-aldric/`), contradictions tranchées d'après `docs/audit-ombrefiel/zone-1.md`. Niveaux du groupe : **entre au niveau 1, sort au niveau 2** (300 PX par héros).

### Héritage (extrait du niveau 0, ne pas modifier)
- **Matériaux** : ardoise noire et schiste ; grès gris et granit gris ; chêne noirci de suie et de pluie ; fer rouillé ou friable ; tourbe et vase.
- **Couleurs** : gris ardoise, brun bistre, rouille, vert de mousse, noir de suie, orange de forge.
- **Formes** : auberges-forteresses à palissade et volets ferrés ; ateliers et fonderies ; tours d'obsidienne.
- **Lumière, météo** : basse et grise, orange des forges ; crachin d'automne, brouillard humide.

### Nuances propres à cette zone
- **Argile rouge** (la carrière) et **boue glacée** partout hors des pavés ; **pins écorcés** de la palissade (clairs sur le fond noir) ; **calcaire crayeux** de la combe ; **granit noir** des menhirs du tertre.
- Le **bois** domine sur le fer : bâtons ferrés, gourdins de chêne, flèches à pointe d'os (le fer neuf ne tient pas, le groupe l'apprend ici).
- Une odeur de **suint de laine mouillée**, de tourbe remuée et de bière tiède ; des corneilles sur la potence.

### Plan vu de dessus
- **Forme générale** : une plaine d'environ **6 km d'est en ouest sur 5 km du nord au sud**, mangée par la boue ; au centre, **l'Éperon d'Aldric**, butte calcaire de 15 m d'où l'on voit à 2 km par temps clair.
- **Limites** : au nord, le ruban pavé de la **Route du Roi** (vers Haute-Garde) ; à l'ouest, la **Piste de Sombreval** qui monte vers les contreforts ; au sud, la **Noire-Eau** et ses vasières ; à l'est, des landes et des collines boisées.
- **Orientation** : nord en haut, comme la carte du monde.
- **Voies d'accès** : on arrive par la **Route du Roi** (nord) ou la **Piste de Sombreval** (ouest) ; la Noire-Eau n'est pas une voie d'arrivée à ce niveau. Hors des pavés, la boue **double les durées** (terrain difficile). La Route du Roi est **barrée de péages illégaux du Lion d'Acier** : c'est ce qui retient le groupe ici au départ.
- **Éléments naturels** : la butte calcaire, la rivière marécageuse aux roseaux tranchants, le **taillis de prunelliers** et la combe de craie au nord-ouest, l'**excavation d'argile** au sud-ouest, la **colline conique et rase** du tertre au sud-est.
- **Quartiers, ailes, niveaux** : aucun : six lieux dispersés autour de l'Éperon, reliés par des pistes de boue.

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| `ald-auberge-de-bregor` | L'Auberge de Brégor et l'Éperon d'Aldric | auberge fortifiée (hub) | **repos**, rencontre, combat d'ouverture, énigme, trésors | (50, 46) | grande | tous les autres (1 h à 2 h ✚) |
| `ald-vieux-pont` | Le Vieux Pont d'Aldric et la Noire-Eau | pont, vasières | combat (embuscade), dilemme, trésor | (42, 80) | moyenne | auberge (1 h ✚), carrière (1 h ✚) |
| `ald-moulin-d-eldren` | Le Moulin d'Eldren et la Ferme Haddon | moulin en ruine, ferme brûlée | combat, rencontre, trésor | (76, 24) | moyenne | auberge (1 h 30 ✚) |
| `ald-combe-de-l-ours` | Le Taillis aux Épines et la Combe de l'Ours | ravin, grotte | combat évitable, rencontre, trésor | (22, 22) | moyenne | auberge (1 h 30 ✚) |
| `ald-carriere-d-argile` | La Carrière d'Argile Rouge | camp gobelin retranché | **combat de boss**, piège, trésor, preuve | (20, 68) | grande | auberge (2 h ✚, par le pont), pont (1 h ✚) |
| `ald-tertre-des-sept-lances` | Le Tertre des Sept-Lances | cercle de menhirs, crypte | combat évitable, piège, trésor (la Spatha), secret | (80, 72) | moyenne | auberge (2 h ✚) |

**Sous-lieux prévus au niveau 2** (24 au total, **numérotation de `actions-interactives.md`** : la forge est en 1D, le perron et la potence en 1E) : auberge **5** (1A salle commune, 1B comptoir et cellier, 1C étage et combles, 1D cour, puits, écuries et forge de Torben, 1E perron et potence) ; pont **4** (tablier et brèche, talus d'embuscade, vasières, carcasse du chariot) ; moulin **4** (3A tertre et approche, 3B rez-de-chaussée et chambre des meules, 3C plateforme du cor, 3D ferme Haddon) ; combe **3** (goulet des ronces, falaise et failles, antre de l'ours) ; carrière **4** (gradins, périmètre piégé, fond de fosse et mare, huttes et poste de commandement) ; tertre **4** (cercle, dalle et escalier, antichambre, sarcophage).

### Budget de contenu (décidé avec l'utilisateur)
- **Combats 7** · **Rencontres sans combat 8** (dont 4 décalées : Barnabé, Godefroy, Thibault, les squelettes sentinelles de nuit) · **PNJ 8 avec fiche** (+ les PNJ décalés) · **Énigmes 1** · **Pièges 3** · **Trésors 8**.
- **Par point** :

| Point | Combats | Rencontres sans combat | PNJ | Énigmes | Pièges | Trésors |
| --- | --- | --- | --- | --- | --- | --- |
| Auberge | 2 : le **chariot enlisé** à l'arrivée sur la Route du Roi, joué en scène d'ouverture rattachée à ce point ✚ (3 pillards, ouverture sur la fonte friable), **Keldan** au porche | 2 : la confrontation de **Silas** ; Barnabé le Casse-Pieds (décalée) | 7 : Brégor, Varek, Mireille, Torben, Silas, Finbar, Martha | 1 : le **carnet chiffré de Silas** ✚ (test de déchiffrement, Intelligence DD 14 ; révèle que Keldan est en place au porche et l'adresse du camp de la forêt) | 1 ✚ : le tonneau du perron (action piégeuse sans dégâts : un jet pour gêner les chiens) | 3 : coffre de Silas, trappe du Lion d'Acier, cache du puits |
| Vieux Pont | 1 : bandits, tireur, méphite optionnel | 2 : le **chariot d'Aldwin et son coffret** (dilemme), Thibault le Pêcheur de Néant (décalée) | — | — | — | 1 : le coffret d'Aldwin |
| Moulin et ferme | 1 : les guetteurs au cor | 2 : les **déserteurs de la Garde d'Émeraude**, Messire Godefroy (décalée) | — | — | — | 1 : la boîte de la ferme |
| Combe | 1 : le Vieux Bourru et les kobolds (**évitable** : le luth de Finbar) | 0 | — | — | — | 1 : le pot des kobolds |
| Carrière | 1 : Demi-Dent et sa bande | 1 : sa **reddition** (dilemme) | 1 : Demi-Dent | — | 1 : les fosses à pieux | 1 : son coffre blindé (le **registre de convoi**) |
| Tertre | 1 : les 3 squelettes (**évitable** : le serment) | 1 : les squelettes sentinelles de nuit | — | — | 1 : la dalle à javelines | 1 : le sarcophage (Spatha, torque, bouclier) |

- **Le mot de passe** « La Serre ne plie point » ne vient pas du carnet : il s'arrache à **Silas capturé vivant** (Intimidation DD 13) ; il sert aux bandits du pont et, en contournement, aux guetteurs du moulin ✚.
- **Dilemmes de zone** : le coffret d'Aldwin (rendre l'or à Martha, ou le garder) et la reddition de Demi-Dent (l'épargner, ou l'exécuter) : ils poussent la **Voie** et déclenchent le rêve de fin de zone.
- **Objets insolites du canon (BIBLE §7), placés dans des contenants existants, donc sans changer le budget de trésors** ✚ : la **culotte à rubans** (1re pièce de la Garde-robe du Chambellan) au fond du **coffret d'Aldwin** ; les **bottes de saut du gobelin** dans le **coffre blindé de Demi-Dent** ; la **chope inépuisable** dans le **cellier secret** de Brégor (trappe) ; la **dague Langue-d'Acier** dans le **sarcophage d'Aethelgard**.
- **Marchands** : Torben (armes anciennes, bâtons, flèches d'os ; **service de réparation** des armes ébréchées) ; Brégor (gîte, couvert, dortoir). **Compagnons** (qui voyagent, ne combattent pas) : Varek et Mireille.

### Histoire et état actuel
- Aldric était un **relais de diligences** sur la Route du Roi, prospère grâce au fer pur de Sombreval. Il y a **six mois**, quand les convois ont été attaqués et que le fer a commencé à pourrir, Brégor l'a **fortifié à la hâte** : palissade de troncs, fenêtres condamnées, meurtrières. Les diligences royales ne passent plus ; **une vingtaine de tentes de réfugiés** campent dans la cour.
- Les chariots du **Lion d'Acier** traversent le carrefour sans obéir à la Garde d'Émeraude, avec des **sauf-conduits du Conseil signés du Doyen Valerius** ✚ (réputé honnête). Les deux **pendus** de la potence, exposés il y a cinq jours, portent la menace de la Compagnie.
- Dans la boue, la **Griffe Noire** espionne par Silas et embusque par Keldan ; les gobelins de Demi-Dent pillent les convois isolés ; des déserteurs de la Garde rançonnent les passants.

### Jour, nuit, mauvais temps
- **Jour** : crachin gris, vue à 2 km depuis l'Éperon ; la route est sûre à peu près (patrouilles corrompues, colporteurs, réfugiés).
- **Nuit** : hors des pavés, loups et éclaireurs de la Griffe Noire ; l'Éperon ne s'éclaire que de la lanterne-tempête de la cour ; le gibet craque.
- **Mauvais temps** : pluie battante, vue réduite à 30 m, la boue engloutit les chariots ; un feu de camp ne s'allume pas en plein vent.

### Ce que le joueur voit en arrivant
Un chariot embourbé que trois pillards veulent piller, une palissade de pins écorcés sur une butte, une vingtaine de tentes de réfugiés dans la cour, et, au croisement, deux pendus sous un panneau pourri. Dans l'angle sombre de la salle commune, un nain regarde trois morceaux de métal brisé. À la forge, un autre nain tape sur un lingot qui se désagrège.

### Secret du MJ (jamais dans `visuel`, `resume`, `accroche`)
- **Keldan et Silas** sont payés en **or d'une cité rivale** (Silas aussi par la Griffe Noire et le Lion d'Acier) par des marchands de Haute-Garde ; Keldan a l'**ordre scellé** « Empêchez tout aventurier d'atteindre les puits de Sombreval » (la version d'origine ajoutait « ou envoyé de la Garde d'Émeraude ») ; ce pli porte le **sceau du Chef Masqué** ✚ (première apparition).
- **Demi-Dent** garde un **registre de convoi** qui mentionne des « réactifs alchimiques acides » envoyés au **Puits n° 4**, sous le sceau du Lion d'Acier et la signature de Vane : **la preuve que le Lion d'Acier est derrière l'acide**. Il ne sait pas ce que sont les réactifs ✚ ; il touche une part du butin.
- **Brégor** a été sergent sous Vane ✚ ; il se tait là-dessus.
- Un **cavalier masqué** est aperçu à l'embranchement au crépuscule ✚ : Valerius, ou un de ses hommes ; il observe et part.
- Le **Tertre** abrite la tombe d'**Aethelgard**, champion d'avant le royaume : sa **Spatha de bronze** est la plus ancienne et la seule épée longue **immunisée** de la zone (les dagues de bronze de Torben le sont aussi).
- Le **Vieux Bourru** n'attaque que si l'on pénètre dans sa combe ; Les kobolds ont volé le luth de Finbar pendant son sommeil et l'ont abandonné à l'entrée de l'antre de l'ours (harmonisé le 11/11 avec la fiche de la combe).

### Notes de travail (hors texte joueur)
- Le dossier d'origine dit la carrière « à 800 m au sud du moulin » : **écarté** (le moulin est au nord-est, la carrière au sud-ouest, à ≈ 4 km) ; le mécanisme du cor d'alarme du moulin est à revoir au niveau 2.
- Pour le niveau 2 : Keldan n'est plus mage de niveau 2 avec *Sommeil* (canon : `acolyte`, sans *Sommeil*) ; le Vieux Bourru est `ours-brun` (FP 1, pas « 1-2 ») ; seuil de reddition de Demi-Dent à trancher (5 ou 6 PV).

### Composition de la carte (pour `images.json`, clé `carte-ald-carrefour-d-aldric`, 3 à 5 phrases)

> Carte de détail à la plume, bistre et sépia sur parchemin, vue de dessus, nord en haut : une plaine boueuse de quelques kilomètres, au centre une butte calcaire couronnée d'une auberge fortifiée à palissade, au croisement d'une route pavée qui monte vers le nord et d'une piste qui part vers l'ouest. Au nord-ouest, un ravin de craie et un taillis ; au nord-est, un moulin à toiles déchirées et une ferme brûlée ; au sud-ouest, une grande excavation d'argile rouge avec des huttes ; au sud, un ruisseau sombre et un vieux pont de grès à une arche ; au sud-est, une colline conique et rase couronnée de sept pierres noires. Pas de personnages ; une potence discrète au croisement.

### Champs dérivés de ce lieu
- **resume** (sans spoiler) : « Une plaine de boue autour d'une butte fortifiée où deux routes se croisent, six lieux dispersés : une auberge pleine de réfugiés, un pont d'embuscade, un moulin brisé, un ravin à l'ours, une carrière de pillards et une tombe ancienne. »
- **accroche** (12 à 30 mots, vue du dehors depuis le parent) : « Au croisement de la Route du Roi et de la piste de l'ouest, une butte porte une auberge fortifiée ; deux pendus se balancent au carrefour. »
- **visuel** : « Plaine de boue rouge et grise sous un crachin bas, traversée de deux routes en croix. Au centre, une butte calcaire coiffée d'une bâtisse de grès noircie, ceinte d'une palissade de pins écorcés et de tentes serrées. Un gibet de bois noir se dresse au carrefour, des corneilles posées sur la poutre. »
- **ambiance** : « Boue, crachin, peur sourde, bière tiède. »
- **description** (MJ, 100 à 250 mots) : « Le Carrefour d'Aldric occupe une plaine de six kilomètres sur cinq, que des semaines de crachin ont transformée en bourbier. Hors des pavés, tout déplacement est difficile et deux fois plus long. L'Éperon, butte de calcaire de quinze mètres, porte l'auberge de Brégor, fortifiée à la hâte, et son camp de réfugiés ; c'est le seul abri sûr de la région et le seul lieu où l'on dort sans veiller. Autour, cinq lieux : le Vieux Pont de la Noire-Eau, où les détrousseurs poussent des troncs devant les chariots ; le moulin d'Eldren, dont les gobelins se servent de guet, et la ferme Haddon où des déserteurs de la Garde d'Émeraude rançonnent ; la combe du Vieux Bourru, un ours territorial, et ses kobolds ; la carrière de Demi-Dent, au sud-ouest ; le tertre des Sept-Lances, au sud-est, qui garde une tombe antique et la plus belle arme du pays que le fer pourri n'atteint pas. Ici commence l'enquête : tout indique Sombreval, mais ce qui paie les hommes de main vient de Haute-Garde. Le groupe doit apprendre ici que le fer neuf est friable, qu'il vaut mieux du bois et du bronze, et que les alliés se gagnent. »

---

> **Niveau 2 et 3 : ald-auberge-de-bregor, validé par l'utilisateur le 11/11/2026 (V5). Gelé : tout changement demande un nouveau oui.** Rédigée par un agent Haiku, vérifiée par Sonnet 5.5 (deux passes), relue par Claude.

### Niveau 2 : ald-auberge-de-bregor (L'Auberge de Brégor et l'Éperon d'Aldric, auberge fortifiée), dans ald-carrefour-d-aldric

**Héritage** (extrait du niveau 1 de la zone, ne pas modifier) :
- Matériaux : ardoise noire et schiste ; grès gris et granit gris ; chêne noirci de suie et de pluie ; fer rouillé ou friable ; tourbe et vase.
- Couleurs : gris ardoise, brun bistre, rouille, vert de mousse, noir de suie, orange de forge.
- Formes : auberges-forteresses à palissade et volets ferrés ; ateliers et fonderies ; tours d'obsidienne.
- Lumière, météo : basse et grise, orange des forges ; crachin d'automne, brouillard humide.

**Héritage physique** (fiche de ce niveau, recopiée sans changement dans chacun de ses sous-lieux) :
- **Dimensions et structure** : bâtisse de deux niveaux (rez-de-chaussée et étage sous combles) au sommet de la butte calcaire de quinze mètres ; salle commune d'environ 16 pas sur 10 ; cour d'environ 30 pas sur 20, enclose par une palissade de pins écorcés de trois mètres.
- **Matériaux et état** : moellons de grès et colombages de chêne noircis de suie ; toit d'ardoise lourde ; tomettes de terre cuite maculées de boue séchée ; fenêtres du rez-de-chaussée condamnées par des madriers ferrés percés de meurtrières ; palissade de pins écorcés, clairs sur le fond noir ; boue glacée dans la cour ; humidité qui suinte des murs de grès.
- **Lumière** : basse et grise par les fentes des meurtrières ; âtre central de la salle commune ; lanterne-tempête suspendue à un poteau au bord du puits ; l'étage et les combles ne reçoivent que la lumière de l'escalier, de la fenêtre de la chambre d'angle et d'une lucarne ronde du dortoir.
- **Sons** : pluie sur l'ardoise ; plancher de pin qui grince ; brouhaha de la salle ; hennissements des écuries ; treuil du puits ; marteau de la forge.
- **Odeurs** : bière éventée, suint de mouton mouillé, civet de navets au lard rance, tourbe remuée, soufre et vitriol de la forge.
- **Température** : froide et humide ; l'âtre chauffe mal la salle ; la cour est glacée au vent.
- **Éléments remarquables** (chacun avec sa place) :
  - l'âtre central en moellons, au milieu de la salle commune ;
  - le comptoir d'orme renforcé de tôle, contre le mur est de la salle commune, face à la porte d'entrée ;
  - le puits d'Aldric, au centre de la cour ;
  - la palissade de pins écorcés, qui ceinture la cour ;
  - l'escalier de chêne dans l'angle sud-est de la salle commune ;
  - l'appentis de la forge, adossé à la palissade au nord-est.

**Nuances propres** : pins écorcés de la palissade, clairs sur le fond noir ; boue glacée hors des pavés ; le bois domine le fer. Mobilier d'usage d'auberge, présent dans tout le bâtiment : tomettes de terre cuite, orme du comptoir, pichets de cuivre et chopes d'étain, cadenas de laiton, paillasses de paille et de foin, toile des tentes, corde de chanvre du treuil, sacs de jute, fil de fer des réparations, cire des sceaux, argent d'un sifflet.

**Issues** (où elles mènent, aspect vu de chaque côté) :
- vers `ald-carrefour-d-aldric` (la rampe) : description : « Une rampe boueuse descend de la butte vers le carrefour, où la potence se dresse à côté du panneau pourri. » (20 mots) ; retour : « Depuis le carrefour, la butte se dresse au-dessus de la plaine ; la rampe monte jusqu'au perron, puis à la palissade de pins. » (22 mots)

**Contenu prévu** (un emplacement par entité ; id s'il existe, sinon « à créer » ; au lieu le plus précis) :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (×3) | pillards du chariot enlisé ; scène d'ouverture de l'arrivée ; ouverture sur la fonte friable (règle de l'arme ébréchée, module à écrire) | le chariot dans l'ornière de la Route du Roi, au pied de la rampe (hors enceinte : la scène d'ouverture se joue avant l'arrivée à la butte) | `bandit` | combat ; la rupture de l'arme |

Les autres entités du point sont placées dans les sous-lieux 1A à 1E.

**Avant / après** : aucun changement prévu par le canon à ce niveau ; la palissade et les tentes restent en place.

**Un détail propre à ce lieu** : le linteau de la porte principale porte des rangées d'entailles, par paquets de cinq, qui comptent les jours depuis la fortification de la butte ; les dernières sont fraîches, à la pointe.

**Intérieur** (ce point contient cinq sous-lieux) :
- plan intérieur : la porte principale, à l'ouest, ouvre sur le perron (1E), au sommet de la rampe, et sur la salle commune (1A), au centre de la bâtisse. Contre le mur est de la salle, le comptoir (1B) ; l'escalier de l'angle sud-est monte à l'étage et aux combles (1C). Une porte de service, au sud de la salle, donne sur la cour (1D), dont un portail au sud-ouest s'ouvre sur la rampe. La forge (1D) occupe l'appentis du nord-est de la cour.
- sous-lieux :

| id | nom | type | fonction dramatique | position | ce qui l'annonce depuis ce lieu | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
| `ald-auberge-salle-commune` | Salle commune (1A) | rez-de-chaussée, salle de repos | rencontre, repos | (34, 30) | l'âtre fumant et les tables de chêne, visibles dès la porte | comptoir, étage, cour, perron |
| `ald-auberge-comptoir-et-cellier` | Comptoir blindé et cellier (1B) | rez-de-chaussée et cave | repos, trésor | (54, 28) | le comptoir de tôle contre le mur est, et la lanterne au-dessus du passage | salle commune ; le cellier est dans ce même sous-lieu |
| `ald-auberge-etage-et-combles` | Étage et combles (1C) | étage et sous les combles | trésor, énigme | (44, 38) | l'escalier de chêne de l'angle sud-est, dont la troisième marche grince | salle commune ; la cour, par la fenêtre |
| `ald-auberge-cour-et-ecuries` | Cour, puits, écuries et forge (1D) | cour à ciel ouvert | repos, rencontre, trésor | (46, 62) | la porte de service au sud de la salle, et la fumée de la forge au-dessus de la palissade | salle commune, perron (portail sud-ouest), étage (fenêtre) |
| `ald-auberge-perron-et-potence` | Perron, rampe et potence (1E) | perron au sommet de la rampe, pente vers le carrefour | combat, piège, rencontre | (12, 40) | la porte principale, à l'ouest, au sommet de la rampe | salle commune, cour (portail), carrefour |

**Champs dérivés**
- **resume** : une auberge fortifiée sur une butte de boue, avec sa palissade, sa cour de réfugiés et sa forge.
- **accroche** : « Une butte calcaire porte une bâtisse de grès et une palissade de pins écorcés, au-dessus d'une rampe boueuse ; deux pendus se balancent au pied. » (24 mots)
- **visuel** : Butte de calcaire gris couronnée d'une bâtisse de grès noirci, coiffée d'ardoise lourde et aux volets ferrés percés de meurtrières. Une palissade de pins écorcés, clairs sur le fond noir, ceinture la cour, et une cheminée de forge fume au nord-est. Une lueur orange se devine derrière les fentes, sous un ciel gris et bas, tandis que la boue glacée luit au pied de la rampe.
- **ambiance** : Boue, crachin, marteau qui se tait.
- **description** : L'Éperon d'Aldric est une butte de calcaire de quinze mètres, d'où l'on voit à deux kilomètres par temps clair. Au sommet, l'auberge de Brégor a été fortifiée à la hâte il y a six mois : une bâtisse de grès et de colombages de chêne, des fenêtres du rez-de-chaussée closes par des volets ferrés percés de meurtrières, et une palissade de pins écorcés de trois mètres qui ceinture la cour. La salle commune, le comptoir, le cellier, l'étage et les combles occupent la bâtisse ; la cour, le puits d'Aldric, les écuries, le hangar à foin et la forge occupent l'enceinte. Dans la cour, une vingtaine de tentes de réfugiés sont serrées contre la palissade ; les chevaux de trait et les mules réquisitionnées vivent dans les écuries. Au sommet de la rampe, le perron ferme la bâtisse du côté de la pente ; au pied, la potence se dresse au carrefour. Seul abri sûr de la région, l'auberge permet de dormir sans veiller, mais les marteaux de la forge se taisent de plus en plus souvent : le fer ne tient plus.
- **arrivee** : La butte apparaît d'abord comme une masse plus sombre que la plaine, puis la palissade se détache : des troncs de pin écorcés, clairs sur le fond noir, dressés sur trois mètres. Au-dessus, la bâtisse de grès et de colombages tient sa toiture d'ardoise lourde, et ses fenêtres du bas sont closes par des volets ferrés percés de fentes étroites. Le crachin tombe depuis le matin et ruisselle sur la rampe, où la boue glacée aspire les bottes à chaque pas. Une odeur de suint mouillé et de tourbe remuée monte jusqu'à vous, mêlée à celle de la bière tiède. Un coup de marteau sur le fer résonne à droite, irrégulier, comme si la pièce frappée se défaisait sous le choc. Au bout de la rampe, deux silhouettes de chiffon pendent sous un panneau pourri, et les corneilles s'envolent à votre approche. Le ciel reste bas, gris d'ardoise, et une lueur orange de forge se devine au-dessus de la palissade.

---

#### Niveau 3 : ald-auberge-salle-commune (Salle commune, rez-de-chaussée, rencontre et repos), dans ald-auberge-de-bregor

**Héritage** (recopié de la fiche de l'auberge, niveau 2, sans changement) :
- **Dimensions et structure** : bâtisse de deux niveaux (rez-de-chaussée et étage sous combles) au sommet de la butte calcaire de quinze mètres ; salle commune d'environ 16 pas sur 10 ; cour d'environ 30 pas sur 20, enclose par une palissade de pins écorcés de trois mètres.
- **Matériaux et état** : moellons de grès et colombages de chêne noircis de suie ; toit d'ardoise lourde ; tomettes de terre cuite maculées de boue séchée ; fenêtres du rez-de-chaussée condamnées par des madriers ferrés percés de meurtrières ; palissade de pins écorcés, clairs sur le fond noir ; boue glacée dans la cour ; humidité qui suinte des murs de grès.
- **Lumière** : basse et grise par les fentes des meurtrières ; âtre central de la salle commune ; lanterne-tempête suspendue à un poteau au bord du puits ; l'étage et les combles ne reçoivent que la lumière de l'escalier, de la fenêtre de la chambre d'angle et d'une lucarne ronde du dortoir.
- **Sons** : pluie sur l'ardoise ; plancher de pin qui grince ; brouhaha de la salle ; hennissements des écuries ; treuil du puits ; marteau de la forge.
- **Odeurs** : bière éventée, suint de mouton mouillé, civet de navets au lard rance, tourbe remuée, soufre et vitriol de la forge.
- **Température** : froide et humide ; l'âtre chauffe mal la salle ; la cour est glacée au vent.
- **Éléments remarquables** (chacun avec sa place) :
  - l'âtre central en moellons, au milieu de la salle commune ;
  - le comptoir d'orme renforcé de tôle, contre le mur est de la salle commune, face à la porte d'entrée ;
  - le puits d'Aldric, au centre de la cour ;
  - la palissade de pins écorcés, qui ceinture la cour ;
  - l'escalier de chêne dans l'angle sud-est de la salle commune ;
  - l'appentis de la forge, adossé à la palissade au nord-est.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- l'âtre central, au milieu de la pièce, sa pierre noircie jusqu'au linteau ; un tisonnier de fer couvert d'écailles grises est posé contre lui ;
- six tables de chêne balafrées : deux contre le mur nord, une isolée près de l'âtre, une près de la porte d'entrée (traces d'osselets), deux au centre ;
- le coin nord-est, sans fenêtre, à l'écart de la lumière de l'âtre ;
- l'escalier de chêne dans l'angle sud-est, qui monte à l'étage.

**Issues** :
- vers `ald-auberge-comptoir-et-cellier` : description : « Le comptoir d'orme se dresse contre le mur est de la salle, face à la porte ; une ouverture libre permet de passer derrière le comptoir. » (25 mots) ; retour : « Derrière le comptoir, la salle entière se voit d'un coup d'œil : l'âtre au centre, les tables, et la porte d'entrée à l'ouest. » (22 mots)
- vers `ald-auberge-etage-et-combles` : description : « Un escalier de chêne noirci monte dans l'angle sud-est de la salle, vers l'étage et les combles. » (17 mots) ; retour : « L'escalier de chêne descend vers la salle commune ; la troisième marche grince, et l'âtre se devine en bas. » (18 mots)
- vers `ald-auberge-cour-et-ecuries` : description : « Une porte de service à planches ferrées, au sud de la salle, ouvre sur la cour boueuse. » (17 mots) ; retour : « Depuis la cour, la porte de service est un panneau de planches ferrées ; le bruit de la salle filtre à travers le bois. » (23 mots)
- vers `ald-auberge-perron-et-potence` : description : « La porte principale, à l'ouest, s'ouvre sur un perron de trois marches que la pluie rend glissant. » (17 mots) ; retour : « Devant le perron, la porte d'une bâtisse de grès s'ouvre sur une salle enfumée ; la pluie coule sur les marches. » (20 mots)

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| PNJ (compagnon qui voyage, recrutable) | Varek, nain, assis seul ; regarde les débris de sa hache ; recrutable, il marche et ne combat pas | le coin nord-est, sur une table, les morceaux de métal | `varek-le-brise` | Histoire ou Outils de forgeron DD 11 (examiner) ; Persuasion DD 10 (recrutement) |
| rencontre sans combat | Silas, informateur de la Griffe Noire ; observe qui s'intéresse aux mines ; la confrontation a lieu ici | la table isolée près de l'âtre, une pinte intacte devant lui | `silas-l-epieur` | Intuition DD 13 ; Tromperie DD 13 |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : sur la table la plus proche de la porte d'entrée, des traces d'osselets sont gravées dans le bois, avec un cercle de bière séchée au centre.

**Champs dérivés**
- **resume** : une salle basse enfumée, aux tables de chêne, où les voyageurs bloqués attendent que la route se rouvre.
- **accroche** : « Par les fentes des volets ferrés, la fumée grise de l'âtre et des voix basses s'échappent de la façade ouest de la bâtisse. » (23 mots)
- **visuel** : Une salle basse de grès et de chêne noirci, au sol de tomettes couvert de boue séchée. Au centre, l'âtre en moellons est la seule source de lumière chaude, avec un tisonnier gris d'écailles posé contre la pierre. Six tables de chêne balafrées occupent la pièce, et l'escalier de l'angle sud-est disparaît dans la pénombre.
- **ambiance** : Brouhaha, fumée, bière éventée.
- **description** : La salle commune occupe le rez-de-chaussée, sur seize pas de long et dix de large, et ne reçoit de jour que par les fentes des madriers ferrés. L'âtre central en moellons chauffe mal : il réchauffe les tables les plus proches et laisse le reste de la salle dans le froid humide. Six tables de chêne sont réparties dans la pièce. Deux, contre le mur nord, servent aux bûcherons et aux réfugiés, qui parlent à voix basse de fer rongé et de convois arrêtés. Une table isolée, près de l'âtre, reste à moitié libre : Silas s'y installe le plus souvent, une pinte que personne ne touche devant lui. Dans le coin nord-est, sans fenêtre, Varek, un nain, garde les morceaux d'une hache brisée posés sur une table, à l'écart de la lumière. L'escalier de chêne monte dans l'angle sud-est ; la porte de service, au sud, donne sur la cour, et la porte principale, à l'ouest, sur le perron.
- **arrivee** : La porte s'ouvre sur une salle basse où la fumée de l'âtre stagne en couche grise sous les poutres. Le sol est fait de tomettes maculées de boue séchée, et les tables de chêne, serrées les unes contre les autres, portent des cernes de chopes et des entailles de couteau. Les fenêtres sont closes par des madriers ferrés ; seules quelques fentes laissent passer une lumière grise. Une odeur de bière éventée, de suint mouillé et de civet au lard vous enveloppe aussitôt. Au centre, l'âtre en moellons ronfle, sa pierre noircie jusqu'au linteau. Des voix basses se croisent, celles de marchands bloqués et de réfugiés qui parlent à mi-mot, pendant que le crachin tambourine sur les volets. Dans le coin le plus sombre, un homme trapu est penché sur une table couverte de morceaux de métal.

---

#### Niveau 3 : ald-auberge-comptoir-et-cellier (Comptoir blindé et cellier, rez-de-chaussée et cave, repos et trésor), dans ald-auberge-de-bregor

**Héritage** (recopié de la fiche de l'auberge, niveau 2, sans changement) :
- **Dimensions et structure** : bâtisse de deux niveaux (rez-de-chaussée et étage sous combles) au sommet de la butte calcaire de quinze mètres ; salle commune d'environ 16 pas sur 10 ; cour d'environ 30 pas sur 20, enclose par une palissade de pins écorcés de trois mètres.
- **Matériaux et état** : moellons de grès et colombages de chêne noircis de suie ; toit d'ardoise lourde ; tomettes de terre cuite maculées de boue séchée ; fenêtres du rez-de-chaussée condamnées par des madriers ferrés percés de meurtrières ; palissade de pins écorcés, clairs sur le fond noir ; boue glacée dans la cour ; humidité qui suinte des murs de grès.
- **Lumière** : basse et grise par les fentes des meurtrières ; âtre central de la salle commune ; lanterne-tempête suspendue à un poteau au bord du puits ; l'étage et les combles ne reçoivent que la lumière de l'escalier, de la fenêtre de la chambre d'angle et d'une lucarne ronde du dortoir.
- **Sons** : pluie sur l'ardoise ; plancher de pin qui grince ; brouhaha de la salle ; hennissements des écuries ; treuil du puits ; marteau de la forge.
- **Odeurs** : bière éventée, suint de mouton mouillé, civet de navets au lard rance, tourbe remuée, soufre et vitriol de la forge.
- **Température** : froide et humide ; l'âtre chauffe mal la salle ; la cour est glacée au vent.
- **Éléments remarquables** (chacun avec sa place) :
  - l'âtre central en moellons, au milieu de la salle commune ;
  - le comptoir d'orme renforcé de tôle, contre le mur est de la salle commune, face à la porte d'entrée ;
  - le puits d'Aldric, au centre de la cour ;
  - la palissade de pins écorcés, qui ceinture la cour ;
  - l'escalier de chêne dans l'angle sud-est de la salle commune ;
  - l'appentis de la forge, adossé à la palissade au nord-est.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- le comptoir d'orme de cinq pas, renforcé de tôle rivetée, contre le mur est de la salle ; une ouverture libre permet de passer derrière ;
- deux fûts de cent cinquante litres, posés derrière le comptoir ;
- le râtelier d'armes contre le mur nord, derrière le comptoir ;
- des étagères de planches contre le mur est, derrière le comptoir, avec les pichets de cuivre et les bouteilles d'eau-de-vie ;
- la lanterne accrochée au-dessus du passage, qui éclaire le comptoir ;
- la trappe de bois, cadenassée de laiton, au sol à côté des fûts ;
- le cellier, taillé dans la roche calcaire, à une douzaine de marches sous la trappe : carcasses de porc salé pendues au plafond, fûts rangés contre la paroi, caisse bâchée au pied de l'escalier, étagère où repose la chope.

**Issues** :
- vers `ald-auberge-salle-commune` : description : « Derrière le comptoir, la salle entière se voit d'un coup d'œil : l'âtre au centre, les tables, et la porte d'entrée à l'ouest. » (22 mots) ; retour : « Le comptoir d'orme se dresse contre le mur est de la salle, face à la porte ; une ouverture libre permet de passer derrière le comptoir. » (25 mots)
- vers le cellier (dans ce même sous-lieu) : description : « Une trappe cadenassée s'ouvre au sol, à côté des fûts, sur une volée de marches de pierre taillée vers la cave. » (20 mots) ; retour : « En bas, le cellier sent le saloir ; la trappe, au-dessus, laisse tomber une lumière grise par l'ouverture. » (20 mots)

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| PNJ (aubergiste, service de repos sûr) | Brégor : gîte et couvert, tarifs de la maison ; donne la quête de sécurité ; questionné sur la sécurité, il se méfie de tous | derrière le comptoir | `bregor-le-borgne` | Persuasion DD 12 (questionner) ; Escamotage DD 15 (vol de l'arbalète, à éviter) |
| trésor (C2) | caisse clandestine du Lion d'Acier : six pioches neuves, alvéolées et friables (sceau de la Compagnie) | dans le cellier, sous une bâche de jute, au pied de l'escalier | à créer (C2) | Outils de voleur DD 13 (trappe) ; Investigation DD 13 (trouver la caisse) ; Athlétisme DD 12 (forcer la caisse) |
| trésor (objet insolite) | chope inépuisable, objet de bière sans module | sur une étagère du cellier, à côté de la caisse | `chope-inepuisable` | Investigation DD 13 |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : sur la tôle du comptoir, près du bord, une entaille fraîche de couperet marque l'endroit où une lame a manqué une main, à deux doigts de la rivure.

**Champs dérivés**
- **resume** : un comptoir de tôle contre le mur est, et sous une trappe, une cave de pierre pleine de réserves.
- **accroche** : « Côté est de la bâtisse, une fenêtre condamnée par des volets ferrés laisse filtrer une lueur jaune et l'odeur de la bière éventée. » (23 mots)
- **visuel** : Un comptoir d'orme renforcé de tôle rivetée occupe le mur est de la pièce, face à l'entrée, avec deux fûts de bière cerclés de fer posés derrière lui. Contre le mur nord, un râtelier d'armes ; une lanterne accrochée au-dessus du passage donne une lumière jaune sur le bois. Tout est gris de suie et de rouille, sauf les pichets de cuivre.
- **ambiance** : Tôle froide, bière, pierre humide.
- **description** : Le comptoir de Brégor est un ouvrage d'orme de cinq pas, renforcé de tôle rivetée, qui occupe le mur est de la salle et laisse un passage étroit à une extrémité. Il sert de guichet pour le gîte et le couvert : une paillasse au dortoir pour deux pièces de cuivre la nuit. Un râtelier d'armes, à gauche, contient de quoi répondre à une bagarre. Deux fûts de cent cinquante litres sont posés derrière le comptoir. Au sol, à côté des fûts, une trappe fermée par un cadenas de laiton ouvre sur un cellier taillé dans la roche calcaire : une douzaine de marches, puis une cave fraîche où pendent des carcasses de porc salé. Dans le cellier, une caisse de transport camouflée sous une bâche de jute est marquée au sceau de la Compagnie du Lion d'Acier ; elle contient six pioches neuves qui sonnent creux, car le fer en est alvéolé. Sur une étagère, une chope d'étain, dont la bière ne se tarit jamais, attend son propriétaire.
- **arrivee** : Le comptoir occupe une grande partie du mur est, plus large que la porte, et sa tôle rivetée renvoie la lueur de la lanterne en reflets gris. Derrière lui, les étagères portent des pichets de cuivre et des bouteilles d'eau-de-vie, et une odeur de genièvre piquant se mêle à celle de la bière éventée. Deux fûts de cent cinquante litres sont posés derrière le comptoir, leur bois cerclé de fer et sentant la levure. Le sol de tomettes est couvert de boue séchée jusqu'au pied du comptoir. Un courant d'air froid passe par une fente de meurtrière et fait vaciller la flamme de la lanterne accrochée au-dessus du passage. Le bruit de la salle s'éloigne à mesure que vous approchez. Le plafond est bas, traversé de poutres noircies par la fumée, et la pièce sent la pierre humide.

---

#### Niveau 3 : ald-auberge-etage-et-combles (Étage et combles, trésor et énigme), dans ald-auberge-de-bregor

**Héritage** (recopié de la fiche de l'auberge, niveau 2, sans changement) :
- **Dimensions et structure** : bâtisse de deux niveaux (rez-de-chaussée et étage sous combles) au sommet de la butte calcaire de quinze mètres ; salle commune d'environ 16 pas sur 10 ; cour d'environ 30 pas sur 20, enclose par une palissade de pins écorcés de trois mètres.
- **Matériaux et état** : moellons de grès et colombages de chêne noircis de suie ; toit d'ardoise lourde ; tomettes de terre cuite maculées de boue séchée ; fenêtres du rez-de-chaussée condamnées par des madriers ferrés percés de meurtrières ; palissade de pins écorcés, clairs sur le fond noir ; boue glacée dans la cour ; humidité qui suinte des murs de grès.
- **Lumière** : basse et grise par les fentes des meurtrières ; âtre central de la salle commune ; lanterne-tempête suspendue à un poteau au bord du puits ; l'étage et les combles ne reçoivent que la lumière de l'escalier, de la fenêtre de la chambre d'angle et d'une lucarne ronde du dortoir.
- **Sons** : pluie sur l'ardoise ; plancher de pin qui grince ; brouhaha de la salle ; hennissements des écuries ; treuil du puits ; marteau de la forge.
- **Odeurs** : bière éventée, suint de mouton mouillé, civet de navets au lard rance, tourbe remuée, soufre et vitriol de la forge.
- **Température** : froide et humide ; l'âtre chauffe mal la salle ; la cour est glacée au vent.
- **Éléments remarquables** (chacun avec sa place) :
  - l'âtre central en moellons, au milieu de la salle commune ;
  - le comptoir d'orme renforcé de tôle, contre le mur est de la salle commune, face à la porte d'entrée ;
  - le puits d'Aldric, au centre de la cour ;
  - la palissade de pins écorcés, qui ceinture la cour ;
  - l'escalier de chêne dans l'angle sud-est de la salle commune ;
  - l'appentis de la forge, adossé à la palissade au nord-est.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- l'escalier de chêne, qui débouche à l'extrémité est du couloir par une trémie ; sa troisième marche grince ;
- le couloir de pin, de deux pas et demi de large, qui court d'est en ouest, avec une latte fendue puis recollée au fil de fer au troisième pas ;
- une échelle de meunier, près de la trémie, qui monte par une ouverture sans porte au dortoir sous combles ;
- la chambre d'angle, au bout ouest du couloir, au sud-ouest : porte de chêne noirci, sommier de paille sur deux tréteaux, petite table, fenêtre sans volet ouvrant sur la cour ;
- le coffre cadenassé, sous le sommier de la chambre d'angle ;
- le dortoir sous combles, au-dessus du couloir : paillasses de foin alignées sous le toit, une lucarne ronde au fond.

**Issues** :
- vers `ald-auberge-salle-commune` : description : « L'escalier de chêne descend vers la salle commune ; la troisième marche grince, et l'âtre se devine en bas. » (18 mots) ; retour : « Un escalier de chêne noirci monte dans l'angle sud-est de la salle, vers l'étage et les combles. » (17 mots)
- vers `ald-auberge-cour-et-ecuries` (par la fenêtre de la chambre d'angle) : description : « La fenêtre de la chambre d'angle n'a pas de volet ferré ; le saut donne sur la boue de la cour, à trois mètres. » (23 mots) ; retour : « Sous la fenêtre de la chambre d'angle, la boue porte des traces de pas ; le mur de grès n'offre aucune prise. » (21 mots)

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| PNJ (présence conditionnelle) | Silas, s'il n'est pas en salle commune : il range ici ses affaires ; surpris, il tente la fenêtre vers la cour | la chambre d'angle, près du sommier | `silas-l-epieur` | Discrétion DD 12 (approcher la chambre, le couloir grince) |
| trésor (C1) | coffre cadenassé de Silas : dix-huit pièces d'or étrangères, un flacon d'encre noire et trois plumes de corbeau taillées | sous le sommier de la chambre d'angle | à créer (C1) | Outils de voleur DD 14 (crochetage) ; Athlétisme DD 15 (forcer, avec un pied-de-biche) ; Escamotage DD 14 (clé portée par Silas) |
| énigme | carnet chiffré de la Griffe Noire : déchiffré, il révèle que Keldan est en place au porche et donne l'adresse du camp de la forêt | dans le coffre C1, en dessous des pièces | à créer | Intelligence (Investigation ou Linguistique) DD 14 |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : la latte du troisième pas, fendue puis recollée au fil de fer, qui grince plus fort que les autres.

**Champs dérivés**
- **resume** : un étage de pin qui grince, une chambre d'angle fermée à double tour, et un dortoir de paille sous le toit.
- **accroche** : « Sous le toit d'ardoise, une lucarne et une fenêtre sans volet donnent sur la cour. » (15 mots)
- **visuel** : Un couloir de pin étroit, aux lattes claires que l'humidité a teintées de gris, longe l'étage à la lumière de la trémie de l'escalier. Au bout ouest, une porte de chêne noirci ferme la chambre d'angle, sous un mur couvert de suie. Près de la trémie, une échelle de meunier monte vers les combles.
- **ambiance** : Pin qui grince, foin, pluie.
- **description** : L'étage est une coursive de pin de deux pas et demi de large, qui court d'est en ouest au-dessus de la salle commune, de la trémie de l'escalier jusqu'à la chambre. Les lattes craquent sous le pas ; au troisième, une latte fendue a été recollée au fil de fer. Près de la trémie, une échelle de meunier monte par une ouverture sans porte au dortoir sous combles. Au bout ouest, au sud-ouest, la chambre d'angle est louée au mois. Sa porte de chêne noirci se ferme à double tour (Crochetage DD 14) ; à l'intérieur, un sommier de paille repose sur deux tréteaux, une petite table tient contre le mur, et une fenêtre sans volet ouvre sur la cour, à trois mètres en contrebas. Sous le sommier, un coffre de bois cadenassé, non piégé, contient dix-huit pièces d'or étrangères, un flacon d'encre et un carnet chiffré de la Griffe Noire : une liste de convois miniers qui, une fois déchiffrée, annonce Keldan en place au porche et donne l'adresse du camp de la forêt. Le dortoir, sous le toit, abrite une douzaine de réfugiés, qui dorment serrés sur des paillasses de foin pour deux pièces de cuivre la nuit ; une lucarne ronde, au fond, y laisse passer le jour gris.
- **arrivee** : L'escalier débouche sur un couloir de pin si étroit que vos épaules frôlent les deux cloisons. Le plancher est gris, fait de lattes claires que l'humidité a teintées. La lumière monte de la salle par la trémie et tombe en bande pâle sur les planches. À votre gauche, une échelle de meunier monte vers un plafond sombre. Au bout du couloir, une porte de chêne noirci, serrée dans son cadre, se détache sur un mur couvert de suie. Chaque pas fait gémir le bois, et l'écho se répand jusqu'à la porte fermée. Une odeur de fumée d'âtre et de foin mouillé vous suit depuis la salle, et le silence semble attendre quelqu'un. Le couloir n'a pas de fenêtre, et seule la trémie fait entrer le gris du jour. Par l'ouverture au-dessus de l'échelle monte une odeur tiède de dormeurs et de paille.

---

#### Niveau 3 : ald-auberge-cour-et-ecuries (Cour intérieure, puits, écuries, hangar à foin et forge), dans ald-auberge-de-bregor

**Héritage** (recopié de la fiche de l'auberge, niveau 2, sans changement) :
- **Dimensions et structure** : bâtisse de deux niveaux (rez-de-chaussée et étage sous combles) au sommet de la butte calcaire de quinze mètres ; salle commune d'environ 16 pas sur 10 ; cour d'environ 30 pas sur 20, enclose par une palissade de pins écorcés de trois mètres.
- **Matériaux et état** : moellons de grès et colombages de chêne noircis de suie ; toit d'ardoise lourde ; tomettes de terre cuite maculées de boue séchée ; fenêtres du rez-de-chaussée condamnées par des madriers ferrés percés de meurtrières ; palissade de pins écorcés, clairs sur le fond noir ; boue glacée dans la cour ; humidité qui suinte des murs de grès.
- **Lumière** : basse et grise par les fentes des meurtrières ; âtre central de la salle commune ; lanterne-tempête suspendue à un poteau au bord du puits ; l'étage et les combles ne reçoivent que la lumière de l'escalier, de la fenêtre de la chambre d'angle et d'une lucarne ronde du dortoir.
- **Sons** : pluie sur l'ardoise ; plancher de pin qui grince ; brouhaha de la salle ; hennissements des écuries ; treuil du puits ; marteau de la forge.
- **Odeurs** : bière éventée, suint de mouton mouillé, civet de navets au lard rance, tourbe remuée, soufre et vitriol de la forge.
- **Température** : froide et humide ; l'âtre chauffe mal la salle ; la cour est glacée au vent.
- **Éléments remarquables** (chacun avec sa place) :
  - l'âtre central en moellons, au milieu de la salle commune ;
  - le comptoir d'orme renforcé de tôle, contre le mur est de la salle commune, face à la porte d'entrée ;
  - le puits d'Aldric, au centre de la cour ;
  - la palissade de pins écorcés, qui ceinture la cour ;
  - l'escalier de chêne dans l'angle sud-est de la salle commune ;
  - l'appentis de la forge, adossé à la palissade au nord-est.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- le puits d'Aldric, au centre de la cour : margelle de pierre, treuil de chanvre sur un axe de bois, seau de fer ; l'eau se tient à quatre mètres sous la margelle ; une niche de la paroi, au-dessus de l'eau, est accessible par la corde du treuil ;
- les tentes de toile grise, une vingtaine, alignées contre la palissade du sud ;
- l'écurie basse, le long du mur est : chevaux de trait et mules réquisitionnés ; près de la porte, une paillasse de Martha Haddon ; au fond, l'hôpital de fortune de Mireille (paillasses, cataplasmes, bols de tisane) ;
- le hangar à foin, à l'ouest : toit bas sur des meules, paillasses de réfugiés ; Finbar a sa place contre les meules ;
- l'appentis de la forge, au nord-est, adossé à la palissade : enclume massive au centre, bac de trempe d'eau saumâtre, tas de ferrailles difformes ;
- une lanterne-tempête suspendue à un poteau, au bord du puits.

**Issues** :
- vers `ald-auberge-salle-commune` (par la porte de service) : description : « Depuis la cour, la porte de service est un panneau de planches ferrées ; le bruit de la salle filtre à travers le bois. » (23 mots) ; retour : « Une porte de service à planches ferrées, au sud de la salle, ouvre sur la cour boueuse. » (17 mots)
- vers `ald-auberge-etage-et-combles` (par la fenêtre de la chambre d'angle) : description : « Sous la fenêtre de la chambre d'angle, la boue porte des traces de pas ; le mur de grès n'offre aucune prise. » (21 mots) ; retour : « La fenêtre de la chambre d'angle n'a pas de volet ferré ; le saut donne sur la boue de la cour, à trois mètres. » (23 mots)
- vers `ald-auberge-perron-et-potence` (par le portail sud-ouest) : description : « Un portail de planches ferrées ferme la palissade au sud-ouest ; il s'ouvre sur la rampe et le perron. » (18 mots) ; retour : « Le long de la palissade, un portail de planches ferrées donne sur la cour ; ses gonds grincent à chaque ouverture. » (20 mots)

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| trésor (C3) | cache dans une niche de la paroi du puits, au-dessus de l'eau : une potion de soins scellée à la cire rouge et un sifflet d'argent à la gravure effacée, qui sonne jusqu'à un kilomètre | la niche de la paroi, accessible par la corde du treuil | à créer (C3) | Perception DD 13 (repérer la niche) ; Athlétisme DD 12 (descendre au treuil, DD 15 sans corde) |
| PNJ (compagnon qui voyage, clerc) | Mireille : soins aux réfugiés, service de soins deux fois par jour ; recrutable, elle voyage sans combattre | l'hôpital de fortune au fond de l'écurie | `mireille-de-la-rose` | Médecine DD 10 (aider la plaie) ; Persuasion DD 10 (recrutement) |
| PNJ | Martha Haddon, veuve, hébergée dans l'écurie ; reçoit le coffret du chariot (quête, rendu ailleurs) | une paillasse près de la porte de l'écurie | `martha-haddon` | — |
| PNJ | Finbar, ménestrel réfugié ; donne la quête du luth dérobé par les kobolds | le hangar à foin, adossé aux meules | `finbar-le-chantre` | — |
| PNJ (marchand, service de réparation) | Torben : vend armes anciennes, bâtons ferrés, dagues de bronze, flèches d'os ; répare les armes ébréchées | derrière l'enclume de la forge | `torben-main-brulee` | Persuasion DD 13 (rabais de 15 %) |
| objet (indice) | échantillon de fonte friable, lingot de Sombreval qui s'effrite en poudre grise au moindre choc | sur l'enclume de Torben | `echantillon-de-fonte-friable` | — |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : la margelle du puits est usée en gouttière par les siècles de treuil ; une entaille de corde, polie, traverse la pierre sur toute sa largeur.

**Champs dérivés**
- **resume** : une cour de boue autour d'un puits, avec des écuries, un hangar à foin et une forge qui se tait.
- **accroche** : « Derrière la palissade de pins, une fumée de forge monte du nord-est et des hennissements d'écurie passent les troncs. » (19 mots)
- **visuel** : Une cour de boue grise, enclose de troncs de pin écorcés hauts de trois mètres. Au centre, un puits à margelle de pierre et treuil de chanvre, éclairé par une lanterne-tempête au bord de la margelle ; le long du mur est, les écuries basses, et à l'ouest le hangar à meules de foin. Au nord-est, l'appentis de la forge fume par une cheminée noire.
- **ambiance** : Boue, hennissements, marteau qui se tait.
- **description** : La cour occupe l'enceinte entre la bâtisse et la palissade, une trentaine de pas de long, couverte d'une boue glacée qui tient les bottes. Au centre, le puits d'Aldric, seule eau potable garantie saine de la région, a une margelle de pierre où le chanvre du treuil a creusé une gouttière. Une vingtaine de tentes de réfugiés sont dressées contre la palissade du sud. À l'est, l'écurie basse abrite les chevaux de trait et les mules réquisitionnées ; près de la porte, Martha Haddon dort sur une paillasse, et au fond un coin de paille forme l'hôpital de fortune de Mireille, avec ses cataplasmes et ses bols de tisane. À l'ouest, le hangar à foin, sous un toit bas posé sur des meules, sert de refuge à Finbar le ménestrel. Au nord-est, l'appentis de la forge est adossé à la palissade : Torben y vend des armes anciennes et répare les armes ébréchées. Sur son enclume, un lingot de Sombreval s'effrite au moindre choc. Dans une niche de la paroi du puits, au-dessus de l'eau, une boîte d'étain contient une potion et un sifflet d'argent à la gravure effacée ; on l'atteint en descendant au bout de la corde du treuil.
- **arrivee** : Vous franchissez la porte de service, et la cour s'ouvre devant vous, plus vaste que la salle, où la boue est si profonde qu'on y avance à petits pas. Au centre, un puits à margelle de pierre dresse son treuil de chanvre sous la pluie fine. À gauche, l'écurie basse laisse échapper un hennissement et une odeur de foin mouillé, âcre et tiède. À droite, un hangar aux meules de foin laisse voir des paillasses et des gourdes pendues aux poutres. Le long de la palissade du sud, des tentes de toile grise sont alignées, et la fumée de leurs foyers monte droit dans l'air humide. Plus loin, au nord-est, un atelier noirci par la suie fume par sa cheminée, et un marteau frappe puis se tait, comme sur un métal qui se brise. L'air sent le suint, le soufre et la tourbe, et la fumée reste collée à la palissade.

---

#### Niveau 3 : ald-auberge-perron-et-potence (Perron, rampe et potence, combat, piège et rencontre), dans ald-auberge-de-bregor

**Héritage** (recopié de la fiche de l'auberge, niveau 2, sans changement) :
- **Dimensions et structure** : bâtisse de deux niveaux (rez-de-chaussée et étage sous combles) au sommet de la butte calcaire de quinze mètres ; salle commune d'environ 16 pas sur 10 ; cour d'environ 30 pas sur 20, enclose par une palissade de pins écorcés de trois mètres.
- **Matériaux et état** : moellons de grès et colombages de chêne noircis de suie ; toit d'ardoise lourde ; tomettes de terre cuite maculées de boue séchée ; fenêtres du rez-de-chaussée condamnées par des madriers ferrés percés de meurtrières ; palissade de pins écorcés, clairs sur le fond noir ; boue glacée dans la cour ; humidité qui suinte des murs de grès.
- **Lumière** : basse et grise par les fentes des meurtrières ; âtre central de la salle commune ; lanterne-tempête suspendue à un poteau au bord du puits ; l'étage et les combles ne reçoivent que la lumière de l'escalier, de la fenêtre de la chambre d'angle et d'une lucarne ronde du dortoir.
- **Sons** : pluie sur l'ardoise ; plancher de pin qui grince ; brouhaha de la salle ; hennissements des écuries ; treuil du puits ; marteau de la forge.
- **Odeurs** : bière éventée, suint de mouton mouillé, civet de navets au lard rance, tourbe remuée, soufre et vitriol de la forge.
- **Température** : froide et humide ; l'âtre chauffe mal la salle ; la cour est glacée au vent.
- **Éléments remarquables** (chacun avec sa place) :
  - l'âtre central en moellons, au milieu de la salle commune ;
  - le comptoir d'orme renforcé de tôle, contre le mur est de la salle commune, face à la porte d'entrée ;
  - le puits d'Aldric, au centre de la cour ;
  - la palissade de pins écorcés, qui ceinture la cour ;
  - l'escalier de chêne dans l'angle sud-est de la salle commune ;
  - l'appentis de la forge, adossé à la palissade au nord-est.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- le perron, trois marches de pierre usée au sommet de la rampe, devant la porte principale, à l'ouest de la bâtisse ; un auvent de planches abrite la porte et le palier du haut, au sommet des marches ; une lanterne de fer est fixée au montant ;
- sous les marches, un renfoncement de pierre où se tiennent les molosses ;
- un tonneau d'eau de pluie, posé en haut des marches, contre le mur ;
- la rampe boueuse, qui descend du perron vers le carrefour, bordée de pierres sèches ;
- la potence de bois noirci, au pied de la rampe, au bord de la piste, avec un panneau pourri et deux pendus en chiffon.

**Issues** :
- vers `ald-auberge-salle-commune` (par la porte principale) : description : « Devant le perron, la porte d'une bâtisse de grès s'ouvre sur une salle enfumée ; la pluie coule sur les marches. » (20 mots) ; retour : « La porte principale, à l'ouest, s'ouvre sur un perron de trois marches que la pluie rend glissant. » (17 mots)
- vers `ald-auberge-cour-et-ecuries` (par le portail sud-ouest) : description : « Le long de la palissade, un portail de planches ferrées donne sur la cour ; ses gonds grincent à chaque ouverture. » (20 mots) ; retour : « Un portail de planches ferrées ferme la palissade au sud-ouest ; il s'ouvre sur la rampe et le perron. » (18 mots)
- vers `ald-carrefour-d-aldric` (la rampe) : description : « La rampe boueuse descend du perron vers le carrefour ; la potence se dresse à son pied, au bord de la piste. » (21 mots) ; retour : « Depuis le carrefour, la potence se dresse au pied de la rampe ; au sommet, le perron et la porte principale ferment la butte. » (22 mots)

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (embuscade) | Keldan le Pâle, acolyte mercenaire, au service de la Griffe Noire ; attaque depuis le perron ; sans *Sommeil* au niveau 1 (BIBLE §9) | sous l'auvent, près de la porte, sur le palier | `keldan-le-pale` | combat ; Perception DD 13 (repérer avant d'engager) |
| monstre (×2) | deux molosses d'attaque, lâchés par Keldan dès que les aventuriers gravissent les marches | le renfoncement sous les marches | `molosse` | combat |
| piège | tonneau d'eau de pluie : le renverser rend les marches glissantes et gêne les chiens au premier round | le tonneau, en haut des marches | à créer | Athlétisme DD 10 |
| rencontre sans combat (décalée) | Barnabé le Casse-Pieds : jeune paysan au bonnet trop grand, qui suit le groupe et pose des questions sans fin ; il fuit si on le frappe | au pied de la rampe, près de la potence | à créer (décalée) | — |
| objet (preuve) | pli scellé de cire noire, trouvé sur Keldan après sa défaite | sur Keldan, après le combat | `ordre-de-keldan` | — |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : la première marche du perron est creusée en cuvette par les pas des charretiers ; la pluie y forme une flaque qui ne s'écoule jamais.

**Champs dérivés**
- **resume** : un perron glissant, une rampe de boue et, au pied, une potence qui porte deux pendus.
- **accroche** : « Au bas de la rampe qui monte à la butte, une potence de bois noirci porte un panneau pourri et deux silhouettes de chiffon. » (24 mots)
- **visuel** : Une rampe de boue grise descend de la bâtisse de grès vers la piste, bordée de pierres ; trois marches usées, sous un auvent et une lanterne de fer, mènent à une porte de chêne. Au bas de la pente, une potence de bois noirci se dresse au bord de la piste, sous un panneau pourri et deux silhouettes de chiffon pendues.
- **ambiance** : Crachin, gibet qui craque, boue.
- **description** : Le perron est un palier de trois marches de pierre usée, au sommet de la rampe, devant la porte principale, à l'ouest de la bâtisse. Un auvent de planches couvre le palier du haut. La première marche est creusée par les pas des charretiers ; la pluie y fait une flaque. Un tonneau d'eau de pluie est calé en haut des marches : le renverser rend les marches glissantes et gêne les chiens. Sous les marches, dans un renfoncement de pierre, les deux molosses de Keldan attendent ; Keldan le Pâle, tueur à gages au service de la Griffe Noire, se tient sous l'auvent. Ses bottes sont propres malgré la boue, et ses doigts sont tachés d'encre. La rampe descend ensuite vers le carrefour, sur une quarantaine de pas. Au pied, la potence de bois noirci porte deux pendus livrés aux corneilles et un panneau pourri : « Quiconque entrave les convois du Roi connaîtra le gibet. » Près de la potence, un jeune paysan au bonnet trop grand guette les passants. Sur Keldan, après le combat, on trouve un pli scellé de cire noire.
- **arrivee** : Vous débouchez au pied de la rampe, et la boue monte jusqu'à la cheville. Au sommet, trois marches de pierre usée mènent à une porte de chêne, sous une lanterne de fer qui se balance. Tout près, au bord de la piste, une potence de bois noirci dresse son bras au-dessus de la boue. Deux silhouettes de chiffon pendent à la poutre, et un panneau pourri se balance avec elles. Les corneilles, posées sur la traverse, s'envolent au passage du vent puis reviennent aussitôt. Un tonneau d'eau de pluie est posé en haut des marches, sa surface couverte de feuilles mortes. La pluie fine fait briller les pavés de la route, et une bande de lumière orange filtre entre les volets, au-dessus de vous. L'odeur de tourbe et de bière tiède monte de la porte, mêlée à celle de la pluie sur la pierre.

---

> **Niveau 2 et 3 : ald-vieux-pont, validé par l'utilisateur le 11/11/2026 (V5). Gelé : tout changement demande un nouveau oui.** Rédigée par un agent Haiku, vérifiée par Sonnet 5.5 (deux passes), relue par Claude. Le marchand du chariot s'appelle **Aldwin** (renommé de « Aldous » le 11/11/2026, avec l'accord de l'utilisateur, pour ne pas le confondre avec `grand-duc-aldous`).

### Niveau 2 : ald-vieux-pont (Le Vieux Pont d'Aldric et la Noire-Eau, pont et vasières), dans ald-carrefour-d-aldric

**Héritage** (extrait du niveau 1 de la zone, ne pas modifier) :
- Matériaux : ardoise noire et schiste ; grès gris et granit gris ; chêne noirci de suie et de pluie ; fer rouillé ou friable ; tourbe et vase.
- Couleurs : gris ardoise, brun bistre, rouille, vert de mousse, noir de suie, orange de forge.
- Formes : auberges-forteresses à palissade et volets ferrés ; ateliers et fonderies ; tours d'obsidienne.
- Lumière, météo : basse et grise, orange des forges ; crachin d'automne, brouillard humide.

**Héritage physique** (fiche de ce niveau, recopiée sans changement dans chacun de ses sous-lieux) :
- **Dimensions et structure** : pont de pierre à une arche unique, qui enjambe la Noire-Eau ; tablier large de quatre pas et long de quinze, parapets hauts d'environ un mètre ; arche de sept pas d'ouverture, dont la voûte est à quatre mètres au-dessus de l'eau ; berges de vase sur une dizaine de pas de part et d'autre.
- **Matériaux et état** : gros blocs de grès gris rougis de rouille, joints usés ; pavés du tablier disjoints et glissants ; parapets fêlés, bord éclaté près de la brèche ; berges de vase et de tourbe ; humidité qui suinte des joints et de la voûte.
- **Lumière** : grise et basse, tombée du ciel par le crachin ; aucune lampe sur le pont ; sous l'arche, une pénombre humide où l'eau sombre ne reflète presque rien.
- **Sons** : clapotis de la Noire-Eau contre les pierres de l'arche ; crissement des roseaux dans le vent ; pluie sur la pierre ; cris de corneilles, lointains.
- **Odeurs** : vase et tourbe remuée, eau croupie.
- **Température** : froide et humide ; l'air est plus froid au-dessus de l'eau, et le vent passe droit sous la voûte.
- **Éléments remarquables** (chacun avec sa place) :
  - l'arche de grès, sous le tablier, à quatre mètres au-dessus de la Noire-Eau ;
  - la brèche de trois mètres dans le parapet de l'est, au milieu du tablier ;
  - le talus boisé à la tête nord-ouest du pont, couronné de deux vieux chênes noueux ;
  - les roseaux de la berge sud, sous l'arche, au ras de la vase.

**Nuances propres** : la Noire-Eau est brune et boueuse, et ses berges sont tapissées de roseaux tranchants ; des algues brunes glissent sur les pavés ; l'aulne borde les berges (deux troncs sciés au talus, des buissons dans le fossé) ; une pointe de carreau d'arbalète est en os, faute de fer neuf. Le grès est rougi de rouille, couleur de la palette. Matières et odeurs hors du bloc, justifiées par le décor : le cuir (bottes, botte du marchand), la farine de la cargaison, le satin et le ruban de la culotte du coffret, la toile de la chemise trempée, l'or et l'argent du coffret, le parchemin de l'acte, les fougères et les feuilles pourries du talus, le noisetier et la ficelle de Thibault, la coquille de noix, les plumes des empennages de carreaux, les pierres sèches du chemin, le bois clair des aulnes sciés et de la caisse (teinte de pin clair, comme au niveau 1), l'odeur de farine aigre de la cargaison et l'odeur d'œuf pourri du méthane qui remonte des vasières (œufs pourris de méthane du niveau 0).

**Plan vu de dessus** (positions en % du plan du pont ; nord en haut ; 100 % en largeur ≈ 120 m) : le tablier court du nord au sud, en travers d'une rivière qui coule d'ouest en est. Sa tête nord touche le talus, au nord-ouest ; le talus touche la piste du carrefour. La tête sud se partage entre les vasières, à l'ouest, et la berge aval, à l'est, où le fossé est à quarante mètres.

**Issues** (où elles mènent, aspect vu de chaque côté) :
- vers `ald-carrefour-d-aldric` (la route du nord, par le talus) : description : « Depuis la tête nord du pont, la piste remonte vers le carrefour, par une pente de boue que bordent des pierres sèches. » (22 mots) ; retour : « Depuis le carrefour, le pont se voit en contrebas : une arche de grès, un tablier étroit et, au-delà, la rivière noire. » (22 mots)
- vers `ald-auberge-de-bregor` (1 h ✚, par le carrefour) : description : « La route remonte vers le carrefour, puis la butte de l'auberge, à une heure de marche dans la boue. » (19 mots) ; retour : « Depuis le perron de l'auberge, la rampe descend vers le carrefour, puis une piste de boue mène à une arche de grès au bord de l'eau noire. » (28 mots)
- vers `ald-carriere-d-argile` (1 h ✚, par les vasières, sortie ouest) : description : « Par les vasières de la rive sud, un sentier de boue file vers l'ouest, entre les roseaux, jusqu'à l'excavation d'argile rouge. » (21 mots) ; retour : « Depuis l'excavation, le sentier descend vers l'est au bord de la rivière, et le pont se découvre, gris, au-dessus des roseaux. » (21 mots)

**Contenu prévu** (budget du point : 1 combat, 2 rencontres sans combat, 1 trésor ; 0 PNJ avec fiche, 0 énigme, 0 piège ; chaque entité est placée dans le sous-lieu le plus précis, voir les niveaux 3) :
- combat : 3 `bandit` et 1 `eclaireur` en embuscade au talus (2B) ; `mephite-vaporeux` optionnel dans les vasières (2C).
- rencontres sans combat : Thibault le Pêcheur de Néant (décalée, 2A) ; le dilemme du chariot d'Aldwin (2D).
- trésor : le coffret C4 du chariot (2D).

**Avant / après** : aucun changement prévu par le canon à ce lieu ; le talus, les troncs et le chariot restent en place.

**Un détail propre à ce lieu** : sur le pied de l'arche, côté ouest, un trait noir à deux mètres au-dessus de l'eau : une marque de crue, au-dessous de laquelle la mousse ne pousse pas.

**Intérieur** (ce point contient quatre sous-lieux) :
- plan intérieur : le tablier (2A) relie la tête nord, que le talus (2B) touche au nord-ouest, à la tête sud. De la tête sud, un passage descend à l'ouest vers les vasières (2C), et une berge à l'est, à quarante mètres, mène au chariot renversé (2D).
- sous-lieux (chacun aura sa fiche « Niveau 3 », même modèle, héritage = cette fiche) :

  | id | nom | type | fonction dramatique | position | ce qui l'annonce depuis ce lieu | voisins directs |
  | --- | --- | --- | --- | --- | --- | --- |
  | `ald-pont-tablier-et-breche` | Le tablier du pont et la brèche (2A) | tablier de pierre, passage | rencontre, combat (bousculade) | (48, 46) | la pierre grise du tablier et la brèche béante dans le parapet de l'est | talus (2B, nord-ouest), vasières (2C, sud-ouest), carcasse (2D, est) |
  | `ald-pont-talus-d-embuscade` | Le talus d'embuscade (2B) | talus boisé, bord de la route | combat (embuscade) | (42, 32) | le grand chêne noueux au-dessus du talus, et les troncs d'aulne sur leurs cales | tablier (2A) ; piste du carrefour (nord) |
  | `ald-pont-vasieres` | Les vasières de la Noire-Eau (2C) | berges de vase et de roseaux | combat optionnel, passage | (38, 52) | les roseaux qui frémissent sous l'arche, sur la berge sud | tablier (2A) ; carrière (ouest) |
  | `ald-pont-carcasse-du-chariot` | La carcasse du chariot renversé (2D) | fossé boueux, berge aval | dilemme, trésor | (82, 56) | une roue brisée qui dépasse des aulnes, sur la berge sud, à quarante mètres en aval | tablier (2A, par la berge sud) |

**Champs dérivés**
- **resume** : un pont de grès à une arche sur une rivière noire, avec un talus boisé au nord et des vasières au sud.
- **accroche** : « Au sud du carrefour, une piste de boue descend vers une arche de grès qui enjambe une rivière noire ; des roseaux bruissent dans le vent. » (26 mots)
- **visuel** : Un pont d'une seule arche, de grès gris rougi de rouille, traverse une rivière noire et lente, et ses berges de vase sont couvertes de roseaux. Sur le tablier, une brèche de trois mètres s'ouvre dans le parapet de l'est, au-dessus de l'eau. À la tête nord-ouest du pont, un talus boisé porte deux vieux chênes noueux, et la lumière grise du ciel bas tombe sur tout cela.
- **ambiance** : Pierre mouillée, roseaux, eau noire.
- **description** : Le Vieux Pont d'Aldric enjambe la Noire-Eau, un ruisseau marécageux qui coule d'ouest en est au sud de la butte. C'est un pont de grès à une arche : un tablier de quatre pas de large et d'une quinzaine de long, aux pavés disjoints et glissants d'algues brunes, dont la brèche de trois mètres s'ouvre dans le parapet de l'est. Au nord, la piste qui vient du carrefour descend vers la tête du pont, et c'est par là que les convois arrivent et que les détrousseurs les attendent. Au nord-ouest, un talus haut de deux mètres porte deux vieux chênes noueux ; au pied, deux troncs d'aulne sciés reposent sur des cales de pierre, prêts à basculer sur la route. Sur la rive sud, sous l'arche, la vase et les roseaux bordent l'eau, et un méphite de vapeur guette les pieds qui s'y aventurent. Le ruisseau continue vers l'est, où un chariot de farine renversé gît à quarante mètres en aval, caché par les aulnes du fossé ; et vers l'ouest, par les vasières, un sentier mène à la carrière d'argile rouge. Le pont n'a ni garde ni barrière : le danger vient des talus, de la vase et de la brèche.
- **arrivee** : Vous descendez la piste de boue, et le pont apparaît au bas de la pente : une arche de grès gris rougi de rouille, enjambant une rivière noire qui ne reflète presque rien. Le tablier est étroit et long, ses pavés disjoints luisent de crachin. Au nord-ouest, un talus boisé se détache sur la pente, avec deux chênes noueux qui penchent au-dessus du chemin. Sous l'arche, l'air est plus froid : une odeur de vase et de tourbe remuée monte de l'eau, mêlée à celle de la vase des berges. Au milieu du tablier, dans le parapet de l'est, une brèche de trois mètres laisse voir le vide, et la rivière quatre mètres plus bas. La lumière grise du ciel bas tombe sur des berges de vase, où les pas se perdent dans la boue. Vous entendez le clapotis de l'eau contre les pierres de l'arche, et, au loin, le cri des corneilles. Le ciel est bas, gris d'ardoise, et il pleut sur la rivière.

---

#### Niveau 3 : ald-pont-tablier-et-breche (Le tablier du pont et la brèche, tablier de pierre, rencontre et bousculade), dans ald-vieux-pont

**Héritage** (recopié de la fiche du pont, niveau 2, sans changement) :
- **Dimensions et structure** : pont de pierre à une arche unique, qui enjambe la Noire-Eau ; tablier large de quatre pas et long de quinze, parapets hauts d'environ un mètre ; arche de sept pas d'ouverture, dont la voûte est à quatre mètres au-dessus de l'eau ; berges de vase sur une dizaine de pas de part et d'autre.
- **Matériaux et état** : gros blocs de grès gris rougis de rouille, joints usés ; pavés du tablier disjoints et glissants ; parapets fêlés, bord éclaté près de la brèche ; berges de vase et de tourbe ; humidité qui suinte des joints et de la voûte.
- **Lumière** : grise et basse, tombée du ciel par le crachin ; aucune lampe sur le pont ; sous l'arche, une pénombre humide où l'eau sombre ne reflète presque rien.
- **Sons** : clapotis de la Noire-Eau contre les pierres de l'arche ; crissement des roseaux dans le vent ; pluie sur la pierre ; cris de corneilles, lointains.
- **Odeurs** : vase et tourbe remuée, eau croupie.
- **Température** : froide et humide ; l'air est plus froid au-dessus de l'eau, et le vent passe droit sous la voûte.
- **Éléments remarquables** (chacun avec sa place) :
  - l'arche de grès, sous le tablier, à quatre mètres au-dessus de la Noire-Eau ;
  - la brèche de trois mètres dans le parapet de l'est, au milieu du tablier ;
  - le talus boisé à la tête nord-ouest du pont, couronné de deux vieux chênes noueux ;
  - les roseaux de la berge sud, sous l'arche, au ras de la vase.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- le tablier de grès, quatre pas de large et quinze de long, du nord au sud, pavés disjoints couverts d'algues brunes ;
- la brèche de trois mètres dans le parapet de l'est, au milieu du tablier, bord éclaté, au-dessus de la rivière ;
- le parapet de l'ouest, fêlé, au milieu du tablier, où un homme assis en tailleur laisse pendre ses jambes au-dessus de l'eau ;
- la tête nord du tablier, que le talus touche au nord-ouest, et la tête sud, qui descend vers la berge.

**Issues** :
- vers `ald-pont-talus-d-embuscade` : description : « Depuis le tablier, une pente de boue monte vers le talus, au nord-ouest, où un chêne noueux penche sur le chemin. » (21 mots) ; retour : « Depuis le talus, le tablier s'étend en contrebas, au sud-est ; la brèche du parapet de l'est se voit de loin, béante. » (22 mots)
- vers `ald-pont-vasieres` : description : « Du tablier, un passage de pierres descend vers le sud-ouest, jusqu'à la berge de roseaux qui longe l'eau sous l'arche. » (20 mots) ; retour : « Depuis la berge, le tablier se dresse au-dessus de vous, large et gris, et la brèche se devine dans le parapet. » (21 mots)
- vers `ald-pont-carcasse-du-chariot` : description : « Au sud du tablier, un chemin de terre file vers l'est, le long de la berge, jusqu'aux aulnes du fossé. » (20 mots) ; retour : « Depuis les aulnes du fossé, le pont se voit mal : seul le tablier de grès dépasse, à l'ouest, sur la rivière. » (22 mots)

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| rencontre sans combat (décalée, sans fiche) | Thibault le Pêcheur de Néant : philosophe qui pêche le néant avec une ficelle sans hameçon ; il confie à qui le veut un lombric, Bertrand, sans aucun bonus (décor, aucun module) | le parapet de l'ouest, au milieu du tablier | à créer (décalée) | — |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : sur le parapet de l'ouest, près de la brèche, une encoche faite à la hache, à hauteur de main : les charretiers y comptent les convois passés.

**Champs dérivés**
- **resume** : un tablier de pierre glissant, une brèche béante dans le parapet et un inconnu assis au bord du vide.
- **accroche** : « Au milieu du tablier, une brèche béante ouvre le parapet sur la rivière noire ; les pavés luisent de crachin. » (20 mots)
- **visuel** : Un tablier de grès gris, rougi de rouille, traverse la rivière sur quatre pas de large, ses pavés disjoints couverts d'algues brunes. Au milieu, dans le parapet de l'est, une brèche de trois mètres s'ouvre sur le vide au-dessus de la Noire-Eau. Sur le parapet de l'ouest, une figure assise laisse pendre ses jambes au-dessus de l'eau, et la lumière grise du ciel bas tombe sans ombre sur la pierre.
- **ambiance** : Pierre glissante, rivière, crachin.
- **description** : Le tablier est le cœur du passage : quatre pas de large, quinze de long, et une brèche de trois mètres dans le parapet de l'est, au milieu. La pierre est glissante : un déplacement rapide sur les pavés demande un test d'Acrobaties DD 10, et l'échec fait tomber le personnage à terre ; c'est un terrain, non un piège. Qui veut pousser un bandit ou un ennemi dans la brèche doit tenter une manœuvre de bousculade (Athlétisme opposé) ; la cible tombe dans la Noire-Eau, quatre mètres plus bas, subit 1d6 contondants et reste entravée par la vase du fond. Sur le parapet de l'ouest, Thibault le Pêcheur de Néant est assis en tailleur, sa branche de noisetier à la main et sa ficelle sans hameçon. C'est un philosophe inoffensif, qui ne connaît aucun secret du pont ; il offre volontiers un lombric dans une coquille de noix. Le tablier relie le talus, au nord-ouest, aux vasières, au sud-ouest, par la rive, et la berge de l'est, au sud, mène au chariot renversé, à quarante mètres.
- **arrivee** : Le tablier s'étend devant vous, plus étroit que vous ne l'imaginiez, ses pavés disjoints couverts d'algues brunes qui glissent sous le pied. Le crachin ruisselle sur la pierre grise rougie de rouille, et la rivière coule en bas, sous la voûte. Au milieu du pont, le parapet de l'est s'ouvre sur trois mètres de vide : la pierre éclatée bâille au-dessus de la Noire-Eau, quatre mètres plus bas, et le vent y passe avec un souffle froid. Sur le parapet de l'ouest, un homme est assis en tailleur, les jambes pendantes au-dessus de l'eau, une branche de noisetier à la main. Il ne tourne pas la tête quand vous passez. Une odeur de vase et de tourbe remuée monte des berges, et le clapotis de la rivière revient contre la pierre de l'arche. Le ciel bas, gris d'ardoise, éclaire le pont sans ombre. Il ne reste que le gris du jour, les algues et la brèche béante.

---

#### Niveau 3 : ald-pont-talus-d-embuscade (Le talus d'embuscade, bord de la route, combat), dans ald-vieux-pont

**Héritage** (recopié de la fiche du pont, niveau 2, sans changement) :
- **Dimensions et structure** : pont de pierre à une arche unique, qui enjambe la Noire-Eau ; tablier large de quatre pas et long de quinze, parapets hauts d'environ un mètre ; arche de sept pas d'ouverture, dont la voûte est à quatre mètres au-dessus de l'eau ; berges de vase sur une dizaine de pas de part et d'autre.
- **Matériaux et état** : gros blocs de grès gris rougis de rouille, joints usés ; pavés du tablier disjoints et glissants ; parapets fêlés, bord éclaté près de la brèche ; berges de vase et de tourbe ; humidité qui suinte des joints et de la voûte.
- **Lumière** : grise et basse, tombée du ciel par le crachin ; aucune lampe sur le pont ; sous l'arche, une pénombre humide où l'eau sombre ne reflète presque rien.
- **Sons** : clapotis de la Noire-Eau contre les pierres de l'arche ; crissement des roseaux dans le vent ; pluie sur la pierre ; cris de corneilles, lointains.
- **Odeurs** : vase et tourbe remuée, eau croupie.
- **Température** : froide et humide ; l'air est plus froid au-dessus de l'eau, et le vent passe droit sous la voûte.
- **Éléments remarquables** (chacun avec sa place) :
  - l'arche de grès, sous le tablier, à quatre mètres au-dessus de la Noire-Eau ;
  - la brèche de trois mètres dans le parapet de l'est, au milieu du tablier ;
  - le talus boisé à la tête nord-ouest du pont, couronné de deux vieux chênes noueux ;
  - les roseaux de la berge sud, sous l'arche, au ras de la vase.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- le talus de terre meuble, haut de deux mètres, couvert de fougères sèches, à la tête nord-ouest du pont, qui touche le tablier ;
- le grand chêne noueux, au bord du talus, dont la branche maîtresse, à quatre mètres, domine le chemin ;
- le second chêne, aussi vieux et noueux, à deux pas du premier, au sommet du talus ;
- deux troncs d'aulne de six pas, sciés, posés sur des cales de pierre au bord du chemin, prêts à basculer sur la route.

**Issues** :
- vers `ald-pont-tablier-et-breche` : description : « En descendant le talus vers le sud-est, un chemin de terre rejoint la tête nord du tablier, large de quatre pas. » (21 mots) ; retour : « Depuis la tête du pont, le talus se dresse au nord-ouest, couvert de fougères et de deux chênes noueux. » (19 mots)
- vers `ald-carrefour-d-aldric` (la route du nord) : description : « Un chemin remonte le talus vers le nord, entre les fougères, jusqu'à la piste qui gagne le carrefour. » (18 mots) ; retour : « Depuis la piste, au carrefour, le talus boisé se dresse au sud et un chêne noueux le couronne. » (18 mots)

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (×3) | bandits maraudeurs, accroupis derrière le talus, les mains sur les troncs ; ils basculent les troncs et ouvrent le feu dès que le groupe passe le milieu du tablier | les troncs d'aulne sur leurs cales, au bord du chemin | `bandit` | combat ; Perception DD 12 (repérer le talus, à une vingtaine de mètres) |
| monstre (×1) | tireur d'élite de la Griffe Noire, perché sur la branche maîtresse ; siffle le signal de l'attaque, abri supérieur tant qu'il reste dans le feuillage | le grand chêne noueux, branche à quatre mètres | `eclaireur` | combat ; Perception DD 12 (repérer l'arc, à une vingtaine de mètres) |
| négociation (alternative au combat) | les bandits réclament le mot de passe, que le groupe n'a qu'en l'ayant arraché à Silas, capturé vivant (voir la fiche de zone) ; si le mot est donné, ils laissent passer sans verser de sang | les bandits accroupis derrière le talus | — | Tromperie DD 12 (signe de voleur) |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : dans le talus, trois creux de terre, à hauteur de genou, creusés par des bandits qui s'accroupissent là depuis des semaines ; une bande de fougères est couchée sur dix pas.

**Champs dérivés**
- **resume** : un talus boisé à la tête du pont, deux chênes noueux et des troncs d'aulne posés sur des cales.
- **accroche** : « Au nord-ouest du pont, un talus boisé porte deux chênes noueux, et des troncs d'aulne sont posés au bord de la route. » (22 mots)
- **visuel** : Un talus de terre meuble, haut de deux mètres, couronné de deux chênes noueux, borde le chemin au nord-ouest du pont. Au pied, deux troncs d'aulne sciés reposent sur des cales de pierre, leur bois clair tranché de frais. Sous une lumière grise qui filtre à travers le feuillage, la boue et les fougères sèches tiennent le sol.
- **ambiance** : Fougères sèches, boue, feuillage gris.
- **description** : Le talus est le point d'embuscade : la pente monte de deux mètres au nord-ouest de la tête du pont, et les bandits ont creusé des creux derrière la terre meuble. Trois bandits maraudeurs, armés de cimeterres et d'arbalètes légères, sont accroupis derrière le talus, les mains posées sur les deux troncs d'aulne prêts à basculer. Le tireur d'élite de la Griffe Noire se tient sur la branche maîtresse du grand chêne, à quatre mètres ; il est caché dans le feuillage et ne se voit qu'à un test de Perception DD 12, depuis le tablier, à une vingtaine de mètres. Le groupe peut aussi prendre le talus à revers en longeant la berge nord de la rivière (Discrétion DD 12) et surprendre les bandits au corps-à-corps avec un tour de surprise complet. Un groupe qui s'avance en affichant un signe de voleur (Tromperie DD 12) fait hésiter les bandits, qui réclament un mot de passe ; sans lui, le combat reste inévitable. Dès que le groupe passe le milieu du tablier, le tireur siffle : les troncs basculent sur la route, et les bandits ouvrent le feu. Une torche jetée sur les fougères sèches du talus force les bandits à sortir de leur abri en toussant, avec un désavantage à leurs attaques pendant un round.
- **arrivee** : Le chemin monte doucement entre les fougères, et le talus borde la piste, haut de deux mètres, couvert de terre meuble et de fougères sèches. Deux vieux chênes noueux le couronnent, leurs troncs tordus par les vents du nord, leur feuillage gris retenant la pluie en gouttes lourdes. Au bord du chemin, deux troncs d'aulne, sciés et posés sur des cales de pierre, barrent presque la piste, leur bois clair fraîchement coupé sous la mousse. Le sol est une boue brune qui colle aux bottes. Une odeur de feuilles pourries et de tourbe remuée monte de la pente, mêlée à l'humidité de l'eau en contrebas. Derrière la masse des troncs, le talus cache le reste du chemin, et le chant des corneilles s'est tu d'un coup. Il ne reste que la pluie fine sur le bois.

---

#### Niveau 3 : ald-pont-vasieres (Les vasières de la Noire-Eau, berges de vase et de roseaux, combat optionnel et passage), dans ald-vieux-pont

**Héritage** (recopié de la fiche du pont, niveau 2, sans changement) :
- **Dimensions et structure** : pont de pierre à une arche unique, qui enjambe la Noire-Eau ; tablier large de quatre pas et long de quinze, parapets hauts d'environ un mètre ; arche de sept pas d'ouverture, dont la voûte est à quatre mètres au-dessus de l'eau ; berges de vase sur une dizaine de pas de part et d'autre.
- **Matériaux et état** : gros blocs de grès gris rougis de rouille, joints usés ; pavés du tablier disjoints et glissants ; parapets fêlés, bord éclaté près de la brèche ; berges de vase et de tourbe ; humidité qui suinte des joints et de la voûte.
- **Lumière** : grise et basse, tombée du ciel par le crachin ; aucune lampe sur le pont ; sous l'arche, une pénombre humide où l'eau sombre ne reflète presque rien.
- **Sons** : clapotis de la Noire-Eau contre les pierres de l'arche ; crissement des roseaux dans le vent ; pluie sur la pierre ; cris de corneilles, lointains.
- **Odeurs** : vase et tourbe remuée, eau croupie.
- **Température** : froide et humide ; l'air est plus froid au-dessus de l'eau, et le vent passe droit sous la voûte.
- **Éléments remarquables** (chacun avec sa place) :
  - l'arche de grès, sous le tablier, à quatre mètres au-dessus de la Noire-Eau ;
  - la brèche de trois mètres dans le parapet de l'est, au milieu du tablier ;
  - le talus boisé à la tête nord-ouest du pont, couronné de deux vieux chênes noueux ;
  - les roseaux de la berge sud, sous l'arche, au ras de la vase.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- la berge sud, sous l'arche, une bande de vase noire longue d'une dizaine de pas, bordée de roseaux coupants ;
- la vase qui descend jusqu'à l'eau brune, où la tourbe a noirci les bottes ;
- les traces dans la boue, à mi-berge : des bottes ferrées mêlées à de petites pattes aux longues griffes ;
- un trou sombre dans la paroi de grès, au ras de l'eau, sous la voûte : le terrier du méphite ;
- la marque de crue, un trait noir sur le pied de l'arche, côté ouest, à deux mètres au-dessus de l'eau ;
- le sentier de l'ouest, qui longe la rivière vers l'excavation d'argile.

**Issues** :
- vers `ald-pont-tablier-et-breche` : description : « Depuis la berge, un passage de pierres monte vers le nord-est, au pied du tablier, jusqu'à sa tête sud. » (19 mots) ; retour : « Depuis la tête sud du pont, la berge de roseaux s'enfonce vers l'ouest, sous l'arche, dans la vase. » (18 mots)
- vers `ald-carriere-d-argile` (1 h ✚, sortie ouest) : description : « Un sentier de boue file vers l'ouest, le long de la rivière, à travers les roseaux, jusqu'à l'excavation d'argile rouge. » (20 mots) ; retour : « Depuis l'excavation, le sentier descend vers l'est au bord de la rivière, et le pont se découvre, gris, au-dessus des roseaux. » (21 mots)

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (optionnel) | méphite de vapeur, tapi dans son terrier sous l'arche ; il ne sort que si une créature tombe dans l'eau sous la brèche ou s'approche de son terrier ; souffle de vapeur chaude (recharge 6) : jet de Constitution DD 10, sinon 2d4 dégâts de feu et vitesse réduite de 3 m | le trou sombre de la paroi de grès, au ras de l'eau | `mephite-vaporeux` | combat optionnel ; Perception DD 12 (repérer le terrier) |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : un casque rouillé, à demi enfoncé dans la vase, cabossé sur un côté, à quelques pas du terrier.

**Champs dérivés**
- **resume** : une berge de vase et de roseaux sous l'arche, où la rivière retient les pieds.
- **accroche** : « Sous l'arche du pont, des roseaux bruissent au bord d'une vase noire, et la rivière retient les pieds qui s'y aventurent. » (21 mots)
- **visuel** : Sous l'arche, une berge de vase noire, couverte de roseaux coupants, descend jusqu'à la Noire-Eau brune. Des empreintes de bottes et de longues griffures marquent la boue, et, dans la paroi de grès, un trou sombre s'ouvre au ras de l'eau. La lumière grise, tombée de part et d'autre de l'arche, laisse la berge dans une pénombre humide.
- **ambiance** : Vase, roseaux, eau noire, clapotis.
- **description** : La berge sud, sous l'arche, est une bande de vase et de tourbe longue d'une dizaine de pas, bordée de roseaux tranchants. Toute créature qui s'avance dans l'eau doit réussir un test de Force (Athlétisme) DD 11, sinon elle s'enfonce jusqu'aux cuisses et sa vitesse tombe à zéro ; elle ne s'en dégage qu'en réussissant le même test par une action. Sonder la vase d'une perche (Investigation DD 13) ne fait remonter rien d'utile. Dans la paroi de grès, au ras de l'eau, un terrier abrite un méphite de vapeur, créature sournoise attirée par les eaux croupies : il ne sort que si une créature tombe dans l'eau sous la brèche ou s'approche de son terrier, et il souffle une bouffée de vapeur chaude (recharge 6 ; jet de Constitution DD 10, sinon 2d4 dégâts de feu et vitesse réduite de 3 m). Les empreintes, bottes ferrées et pattes à griffes, vont et viennent entre la berge et le talus, et ne disent rien de plus sur qui rôde ici. Le sentier de l'ouest quitte la berge et longe la rivière jusqu'à la carrière.
- **arrivee** : La berge se descend par une pente de boue ; sous vos pieds, la vase cède à peine, noire et froide, tandis que les roseaux, plus hauts que vous, claquent contre vos épaules. Sous l'arche du pont, la lumière tombe en biais, grise et basse, et la pierre du tablier forme au-dessus de vous une voûte sombre. La Noire-Eau coule, brune, presque immobile à cet endroit, et l'on n'y voit pas le fond. Une bulle crève à la surface, avec une odeur d'œuf pourri qui vous serre la gorge. Dans la boue, des empreintes mêlent des bottes ferrées à de petites pattes aux longues griffes, puis disparaissent sous l'eau. Le roseau frémit ; un oiseau s'envole. Le froid de l'eau monte dans vos chevilles, et chaque pas dans la vase fait un bruit de succion qui se répète sous l'arche. Au-dessus, le tablier de grès, bas et gris, semble peser sur la rivière.

---

#### Niveau 3 : ald-pont-carcasse-du-chariot (La carcasse du chariot renversé, rencontre sans combat et trésor), dans ald-vieux-pont

**Héritage** (recopié de la fiche du pont, niveau 2, sans changement) :
- **Dimensions et structure** : pont de pierre à une arche unique, qui enjambe la Noire-Eau ; tablier large de quatre pas et long de quinze, parapets hauts d'environ un mètre ; arche de sept pas d'ouverture, dont la voûte est à quatre mètres au-dessus de l'eau ; berges de vase sur une dizaine de pas de part et d'autre.
- **Matériaux et état** : gros blocs de grès gris rougis de rouille, joints usés ; pavés du tablier disjoints et glissants ; parapets fêlés, bord éclaté près de la brèche ; berges de vase et de tourbe ; humidité qui suinte des joints et de la voûte.
- **Lumière** : grise et basse, tombée du ciel par le crachin ; aucune lampe sur le pont ; sous l'arche, une pénombre humide où l'eau sombre ne reflète presque rien.
- **Sons** : clapotis de la Noire-Eau contre les pierres de l'arche ; crissement des roseaux dans le vent ; pluie sur la pierre ; cris de corneilles, lointains.
- **Odeurs** : vase et tourbe remuée, eau croupie.
- **Température** : froide et humide ; l'air est plus froid au-dessus de l'eau, et le vent passe droit sous la voûte.
- **Éléments remarquables** (chacun avec sa place) :
  - l'arche de grès, sous le tablier, à quatre mètres au-dessus de la Noire-Eau ;
  - la brèche de trois mètres dans le parapet de l'est, au milieu du tablier ;
  - le talus boisé à la tête nord-ouest du pont, couronné de deux vieux chênes noueux ;
  - les roseaux de la berge sud, sous l'arche, au ras de la vase.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- le fossé boueux de la rive sud, à quarante mètres en aval, où un chariot de transport de farine gît sur le flanc, essieu brisé net ;
- le rideau de buissons d'aulne qui cache le chariot, et une roue brisée qui dépasse du feuillage ;
- la caisse, de planches claires fendues, avec des carreaux d'arbalète à pointe d'os fichés dans le bois ;
- sous la caisse, côté fossé, le marchand mort, étendu (champ MJ seulement) ; une botte de cuir trempée dépasse de sous la caisse ;
- le double-fond sous le plancher du chariot, à l'avant ;
- le chemin de terre qui revient vers le tablier, par la berge.

**Issues** :
- vers `ald-pont-tablier-et-breche` : description : « Par la berge sud, un chemin de terre remonte vers l'ouest, quarante mètres, jusqu'à la tête sud du pont. » (19 mots) ; retour : « Depuis la tête sud, le fossé se cache sous les aulnes ; seule une roue brisée dépasse du feuillage à l'est. » (20 mots)

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| rencontre sans combat (dilemme) | le marchand Aldwin, mari de Martha Haddon, mort sur son chariot depuis deux jours d'un carreau d'arbalète dans le dos, ses poches vidées à la hâte ; son coffret caché. Dilemme : rendre l'or à Martha, veuve hébergée à l'auberge (1D, `martha-haddon`), ou le garder | le marchand, sous la caisse ; la botte qui dépasse | à créer (dilemme) | Médecine DD 10 (examiner) ; Investigation DD 13 (double-fond) |
| trésor (C4) | coffret de chêne cerclé de fer, dans le double-fond : 65 pièces d'or, 40 pièces d'argent, une alliance de mariage en argent gravée « À mon cher Aldwin, ta Martha chérie », un acte de propriété de terres dans la vallée, et la culotte à rubans (`culotte-a-rubans`, 1re pièce de la Garde-robe du Chambellan), au fond du coffret | le double-fond sous le plancher | à créer (C4) | Investigation DD 13 (trouver le double-fond) ; clé au cou du marchand, ou Outils de voleur DD 12 (crochetage), ou Force DD 13 (forcer, risque d'abîmer le contenu) |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : sous le plancher, du côté aval, deux traits croisés au couteau, la marque d'un charretier, près d'un essieu de rechange.

**Champs dérivés**
- **resume** : un chariot de farine renversé dans un fossé d'aulnes.
- **accroche** : « Sur la rive sud, à quarante mètres en aval, une roue brisée dépasse des aulnes d'un fossé boueux. » (18 mots)
- **visuel** : Dans un fossé de boue, sous un rideau d'aulnes, un chariot de transport gît sur le flanc, sa caisse de planches claires fendue et son essieu brisé. Des carreaux d'arbalète à pointe d'os sont fichés dans le bois, et une botte de cuir trempée dépasse de sous la caisse. La lumière grise tombe entre les branches et laisse la boue presque noire.
- **ambiance** : Farine mouillée, aulnes, boue noire.
- **description** : À quarante mètres en aval du pont, sur la rive sud, un chariot de transport de farine gît sur le flanc dans un fossé boueux, caché par les buissons d'aulne. Le marchand Aldwin, mari de Martha Haddon, y est mort : un carreau d'arbalète l'a frappé dans le dos il y a deux jours, et ses poches ont été vidées à la hâte. Médecine DD 10 le confirme et permet de dater le coup. Le coffret de chêne cerclé de fer est dans un double-fond, sous le plancher : Investigation DD 13 pour le trouver. Pour l'ouvrir, la petite clé pendue au cou du marchand, sous sa chemise trempée, ou un test d'Outils de voleur DD 12, ou un test de Force DD 13, qui risque d'abîmer le contenu. Le coffret contient 65 pièces d'or et 40 pièces d'argent, une alliance de mariage en argent, un acte de propriété de terres dans la vallée, et, au fond, une culotte à rubans de satin fané. Le dilemme est ici : l'or appartient à Martha, veuve qui dort à l'auberge ; le lui rendre pousse vers la lumière, le garder pour équiper le groupe pousse vers l'ombre. Les bandits du talus ne voient pas ce fossé, à soixante mètres de l'autre côté de la rivière ; ils n'y viennent que s'ils entendent du bruit.
- **arrivee** : Le chemin vous mène au bord d'un fossé de boue, et les aulnes, serrés, forment un rideau de branches grises. Derrière, un chariot de transport gît sur le flanc, sa caisse de planches claires fendue, son essieu brisé net, une roue levée vers le ciel. La lumière grise tombe entre les feuilles et luit sur la boue noire. Une odeur de farine mouillée, aigre et ancienne, monte de la caisse. Dans le bois, des carreaux d'arbalète à pointe d'os sont fichés, leurs empennages trempés. De sous la caisse, une botte de cuir trempée dépasse dans la boue. Le fossé sent la vase et la tourbe, et le bruit de la rivière, quarante mètres en amont, s'éloigne sous les aulnes. Le ciel bas, gris d'ardoise, pèse sur la caisse et sur la boue, et rien ne bouge, sauf les gouttes qui roulent sur le bois.

---

> **Niveau 2 et 3 : ald-moulin-d-eldren, validé par l'utilisateur le 11/11/2026 (V5). Gelé : tout changement demande un nouveau oui.** Rédigée par un agent Haiku, vérifiée par Sonnet 5.5 (deux passes), relue par Claude.

### Niveau 2 : ald-moulin-d-eldren (Le Moulin d'Eldren et la Ferme Haddon, moulin en ruine et ferme brûlée), dans ald-carrefour-d-aldric

**Héritage** (extrait du niveau 1 de la zone, ne pas modifier) :
- Matériaux : ardoise noire et schiste ; grès gris et granit gris ; chêne noirci de suie et de pluie ; fer rouillé ou friable ; tourbe et vase.
- Couleurs : gris ardoise, brun bistre, rouille, vert de mousse, noir de suie, orange de forge.
- Formes : auberges-forteresses à palissade et volets ferrés ; ateliers et fonderies ; tours d'obsidienne.
- Lumière, météo : basse et grise, orange des forges ; crachin d'automne, brouillard humide.

**Héritage physique** (fiche de ce niveau, recopiée sans changement dans chacun de ses sous-lieux) :
- **Dimensions et structure** : tour circulaire de moellons de granit gris, d'environ six pas de diamètre hors œuvre, aux murs épais d'un pas, et huit mètres jusqu'au toit conique, dressée sur un tertre de quatre mètres ; trois niveaux (rez-de-chaussée, chambre des meules à l'étage, plateforme de guet sous le toit) ; la ferme Haddon, à deux cents mètres au sud, n'est plus qu'une longère calcinée.
- **Matériaux et état** : moellons de granit gris aux joints usés et mousseux ; toit conique de bardeaux de chêne noircis, troués par endroits ; quatre ailes de bois aux toiles déchirées, fixées à un arbre vertical qui traverse le toit ; à la ferme, charpente effondrée et murs de moellons noircis par le feu ; sol de terre boueuse.
- **Lumière** : grise et basse, tombée du ciel par les deux fentes de tir de la plateforme de guet et par la porte ouverte à l'ouest ; aucune lampe, aucun feu dans la tour ; à la ferme, le jour tombe entre des murs sans toit.
- **Sons** : crécelle des engrenages qui grincent au vent ; claquement des toiles des ailes au-dessus du toit ; sifflement du vent dans les fentes ; pluie sur le bardeau ; à la ferme, le vent entre les décombres.
- **Odeurs** : bois mouillé et tourbe remuée du pré ; cendre froide et suie à la ferme.
- **Température** : froide et humide ; le vent traverse la tour par les fentes de tir et la porte ; la ferme est glacée depuis deux mois.
- **Éléments remarquables** (chacun avec sa place) :
  - la tour de moellons de granit gris, au sommet du tertre, avec son toit conique de bardeaux ;
  - les quatre ailes de bois, au-dessus du toit conique, dont les toiles déchirées battent au vent ;
  - la cheminée de brique rouge de la ferme Haddon, debout au milieu des ruines, à deux cents mètres au sud ;
  - le pré humide, à l'ouest du tertre, où la brume reste collée aux herbes couchées.

**Nuances propres** : hêtre pâle des engrenages et des dents de roue ; bardeaux de chêne du toit conique ; toile des ailes et des litières ; brique rouge de la cheminée ; tuiles de terre cuite de la ferme ; grain moisi et farine aigre des sacs ; cendre et suie de la ferme ; paille brûlée des fenils et paille non brûlée de la couche du guet ; madrier de chêne ; argile séchée du bouchon ; fer-blanc et toile cirée de la boîte ; ficelle de chanvre ; corne d'aurochs. Matières et odeurs hors du bloc, justifiées par le décor : elles viennent du moulin et de la ferme, et non de l'héritage de la zone.

**Plan vu de dessus** (positions en % du plan ; nord en haut ; 100 % en largeur comme en hauteur ≈ 400 m) : la tour s'élève sur le tertre, au centre-nord du plan. Le pré humide s'étend à l'ouest. Un chemin de boue descend vers le sud sur deux cents mètres, jusqu'aux ruines de la ferme, à la moitié basse du plan.
- **Forme générale** : un tertre, une tour, un pré, puis deux cents mètres de boue et une ferme en ruine au sud.
- **Limites** : au nord et à l'est, la lande ; à l'ouest, le pré humide puis des haies basses ; au sud, le chemin de boue qui descend vers le carrefour.
- **Orientation** : nord en haut, comme la carte de la zone.
- **Voies d'accès** : une piste de boue arrive du sud-ouest, passe les ruines de la ferme, puis monte le tertre par la pente sud.
- **Éléments naturels** : le tertre herbeux, le pré humide, la brume basse et les haies.
- **Quartiers, niveaux** : trois niveaux dans la tour ; la ferme est un lieu à part, à deux cents mètres.

**Contenu prévu** (budget du point : 1 combat, 2 rencontres sans combat, 1 trésor ; 0 PNJ avec fiche, 0 énigme, 0 piège ; chaque entité au sous-lieu le plus précis) :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (×2) | deux guetteurs gobelins sur le guet ; le sonneur tient le cor d'alarme. Si le guet repère le groupe, le cor sonne au premier round ; sinon rien ne se passe. Combat, sauf si le mot de passe est donné | le guet sous le toit, ses deux fentes de tir (3C) | `combattant-gobelin` | combat ; Discrétion DD 11 (approcher sans être repéré, 3A) |
| rencontre sans combat (décalée) | Messire Godefroy, chevalier errant qui défend un tronc couché dans le pré | le tronc de chêne couché, dans le pré à l'ouest (3A) | à créer (décalée) | Intuition DD 10 (comprendre qu'il se bat contre un bout de bois) |
| rencontre sans combat (1 rencontre, 2 déserteurs) | deux déserteurs de la Garde d'Émeraude, ivres, qui rançonnent aux ruines ; si le groupe attaque, combat de repli hors budget avec le profil `garde` | la grange, à vingt mètres à l'est de la cheminée (3D) | à créer | Perception DD 12 (héros qui entre dans les ruines) ; Persuasion DD 11 ou Intimidation DD 12 |
| trésor (C5) | boîte en fer-blanc cachée dans le conduit de la cheminée, derrière un bouchon d'argile | le conduit de la cheminée calcinée (3D) | à créer (C5) | Investigation DD 11 (conduit, bouchon) |

**Avant / après** : aucun changement prévu par le canon à ce lieu ; la tour, les ailes et les ruines restent en place.

**Un détail propre à ce lieu** : le seuil de pierre de la face ouest est creusé en gouttière par des siècles de sacs traînés sur la même marche, et une marque de charrette de farine y est encore visible.

**Intérieur** (ce point contient quatre sous-lieux) :
- plan intérieur : le tertre (3A) mène à la tour (3B), par la porte ouverte à l'ouest ; au rez-de-chaussée, un escalier de bois monte à la chambre des meules, puis une échelle de meunier monte par une trappe au guet sous le toit (3C). Par le sud, le chemin de boue descend deux cents mètres jusqu'aux ruines de la ferme (3D).
- sous-lieux (chacun aura sa fiche « Niveau 3 », même modèle, héritage = cette fiche) :

  | id | nom | type | fonction dramatique | position | ce qui l'annonce depuis ce lieu | voisins directs |
  | --- | --- | --- | --- | --- | --- | --- |
  | `ald-moulin-tertre-et-approche` | Tertre et approche (3A), pré humide | tertre herbeux, pré | rencontre (décalée), approche | (48, 38) | la pente d'herbe couchée et le pré humide, dès la piste de boue | tour (3B) ; ferme (3D, sentier de deux cents mètres) ; piste vers le carrefour |
  | `ald-moulin-rez-de-chaussee-et-meules` | Rez-de-chaussée et chambre des meules (3B) | tour de moellons, deux niveaux | secret (engrenages, sacs) | (50, 30) | la masse de granit, la porte ouverte à l'ouest et les ailes qui claquent au-dessus du toit | tertre (3A) ; guet (3C, échelle de meunier) |
  | `ald-moulin-plateforme-du-cor` | Plateforme de guet (3C), sous le toit conique | étage fermé sous le toit | combat (guetteurs) | (50, 30) | les deux fentes de tir sous le toit, et les bras des ailes au-dessus du bardeau | chambre des meules (3B, par l'échelle) |
  | `ald-moulin-ferme-haddon` | Ferme Haddon, ruines et grange (3D) | ruines, grange | rencontre, trésor | (50, 80) | la cheminée de brique rouge, debout au sud au-dessus des murs noircis | tertre (3A, par le sentier) ; piste vers le carrefour |

**Champs dérivés**
- **resume** : un moulin de pierre sur un tertre, dont les ailes de bois tournent encore, et une ferme brûlée à deux cents mètres au sud.
- **accroche** : « Sur un tertre au nord-est de la plaine, une tour de pierre grise tourne ses ailes déchirées ; au sud, une cheminée de brique dépasse des ruines. »
- **visuel** : Une tour de moellons de granit gris, coiffée d'un toit conique de bardeaux noircis, se dresse au sommet d'un tertre herbeux, au nord-est de la plaine. Quatre ailes de bois tournent au-dessus du toit, leurs toiles déchirées battant contre le ciel gris ; plus au sud, une cheminée de brique rouge dépasse des ruines calcinées. À l'ouest, un pré humide, où la brume ne se lève pas, s'étale sous une lumière basse qui tombe du ciel, sans lampe ni feu.
- **ambiance** : Crécelle, ailes, farine moisie, crachin.
- **description** : Le moulin d'Eldren occupe un tertre de quatre mètres, au nord-est de la plaine, et son toit conique domine les herbes. La tour de granit gris a trois niveaux. Dans la chambre des meules, à l'étage, une meule dormante et une meule tournante, de deux pas de diamètre, sont superposées autour de l'arbre vertical ; des engrenages de hêtre les relient aux ailes, et la crécelle grince à chaque tour. Au sommet, sous le toit, le guet est tenu par deux gobelins depuis des semaines ; l'un d'eux garde un cor d'alarme en corne d'aurochs. Deux fentes de tir regardent la Route du Roi, au nord, et le chemin de la ferme, au sud. La ferme Haddon, à deux cents mètres, a brûlé il y a deux mois : la charpente est tombée, et restent debout la cheminée de brique et des murs de refend. Dans les ruines, deux déserteurs de la Garde d'Émeraude rançonnent qui passe. À l'ouest, dans le pré, un chevalier rouillé défend un tronc couché. Si le guet repère des intrus, le cor sonne et l'alerte passe de poste de guet en poste de guet, dans la plaine, jusqu'au camp de la carrière d'argile, à un quart d'heure. Une boîte en fer-blanc est cachée dans le conduit de la cheminée, à la ferme.
- **arrivee** : La piste de boue monte vers un tertre couvert d'herbes couchées par le vent. Au sommet, une tour de moellons de granit gris se dresse sous un toit conique de bardeaux noircis, et quatre ailes de bois tournent lentement au-dessus, leurs toiles déchirées battant à chaque bourrasque. Des engrenages grincent à l'intérieur, dans une crécelle continue qui descend jusqu'à la piste. Plus bas, au sud, une cheminée de brique rouge dépasse des décombres d'une ferme brûlée. L'air sent le grain moisi, la farine aigre et la tourbe remuée. À l'ouest, un pré humide s'étend, où la brume reste collée aux touffes. Le ciel est gris et bas, et le crachin ruisselle sur la pierre. Le vent siffle dans les fentes étroites de la tour, et la lumière grise y entre en lames minces. Rien ne bouge sur le tertre, et la lumière ne laisse aucune ombre.

**Issues** (où elles mènent, aspect vu de chaque côté) :
- vers `ald-auberge-de-bregor` (1 h 30 ✚, par la piste de boue) : description : « La piste de boue descend vers le sud-ouest, passe les ruines d'une ferme, puis rejoint le carrefour et la butte de l'auberge, à une heure et demie de marche. » ; retour : « Depuis le perron de l'auberge, au loin vers le nord-est, une tour de pierre grise dépasse d'un tertre, au-dessus des pâtures. »

---

#### Niveau 3 : ald-moulin-tertre-et-approche (Tertre et approche, pré humide, rencontre décalée et approche), dans ald-moulin-d-eldren

**Héritage** (recopié de la fiche du moulin, niveau 2, sans changement) :
- **Dimensions et structure** : tour circulaire de moellons de granit gris, d'environ six pas de diamètre hors œuvre, aux murs épais d'un pas, et huit mètres jusqu'au toit conique, dressée sur un tertre de quatre mètres ; trois niveaux (rez-de-chaussée, chambre des meules à l'étage, plateforme de guet sous le toit) ; la ferme Haddon, à deux cents mètres au sud, n'est plus qu'une longère calcinée.
- **Matériaux et état** : moellons de granit gris aux joints usés et mousseux ; toit conique de bardeaux de chêne noircis, troués par endroits ; quatre ailes de bois aux toiles déchirées, fixées à un arbre vertical qui traverse le toit ; à la ferme, charpente effondrée et murs de moellons noircis par le feu ; sol de terre boueuse.
- **Lumière** : grise et basse, tombée du ciel par les deux fentes de tir de la plateforme de guet et par la porte ouverte à l'ouest ; aucune lampe, aucun feu dans la tour ; à la ferme, le jour tombe entre des murs sans toit.
- **Sons** : crécelle des engrenages qui grincent au vent ; claquement des toiles des ailes au-dessus du toit ; sifflement du vent dans les fentes ; pluie sur le bardeau ; à la ferme, le vent entre les décombres.
- **Odeurs** : bois mouillé et tourbe remuée du pré ; cendre froide et suie à la ferme.
- **Température** : froide et humide ; le vent traverse la tour par les fentes de tir et la porte ; la ferme est glacée depuis deux mois.
- **Éléments remarquables** (chacun avec sa place) :
  - la tour de moellons de granit gris, au sommet du tertre, avec son toit conique de bardeaux ;
  - les quatre ailes de bois, au-dessus du toit conique, dont les toiles déchirées battent au vent ;
  - la cheminée de brique rouge de la ferme Haddon, debout au milieu des ruines, à deux cents mètres au sud ;
  - le pré humide, à l'ouest du tertre, où la brume reste collée aux herbes couchées.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- le tertre, butte de terre et d'herbe de quatre mètres que la tour couronne, avec une pente sud pelée par les pas ;
- le pré humide, à l'ouest du tertre, où l'herbe est couchée en nappes et l'eau reste dans les creux ;
- le tronc de chêne pourri, couché dans l'herbe du pré, à une vingtaine de pas du tertre ;
- le seuil de pierre usée de la face ouest, qui donne sur le pré, et la porte de chêne, ouverte contre le mur ;
- la piste de boue, au pied sud du tertre, qui contourne la butte ;
- le sentier de boue qui descend vers le sud, entre des haies basses, sur deux cents mètres.

**Issues** :
- vers `ald-moulin-rez-de-chaussee-et-meules` : description : « Au pied de la tour, la pente de terre s'arrête devant le seuil de pierre usée de la face ouest, creusé en gouttière par les sacs traînés. » ; retour : « Depuis le seuil de la tour, le pré humide s'étend à l'ouest, et la piste de boue descend vers le sud. »
- vers `ald-moulin-ferme-haddon` (deux cents mètres au sud) : description : « Le sentier de boue descend vers le sud, deux cents mètres, entre des haies basses, jusqu'aux murs noircis de la ferme. » ; retour : « Depuis les ruines de la ferme, le tertre se dresse au nord, à deux cents mètres, avec la tour de granit au sommet. »
- vers `ald-auberge-de-bregor` (par la piste de boue, 1 h 30 ✚) : description : « La piste de boue quitte le tertre au sud, passe les ruines de la ferme, puis descend vers le carrefour, à une heure et demie. » ; retour : « Depuis la piste de boue, au sud du tertre, la tour se dresse au nord, au sommet des herbes couchées. »

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| rencontre sans combat (décalée) | Messire Godefroy : chevalier errant à l'armure rouillée, qui se bat contre un tronc couché qu'il prend pour un monstre ; il ne combat pas | le tronc de chêne couché, dans le pré | à créer (décalée) | Intuition DD 10 (comprendre qu'il délire) |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : dans le pré, un bâton de chêne est planté dans la boue à hauteur d'homme, comme une lance de tournoi.

**Champs dérivés**
- **resume** : un tertre herbeux et un pré humide, à l'ouest de la tour, où l'herbe couchée garde l'eau.
- **accroche** : « Au pied de la tour de granit, une pente d'herbe couchée descend vers un pré humide que la brume ne quitte jamais. »
- **visuel** : Un tertre herbeux, pelé par les pas sur sa pente sud, porte à son sommet une tour de moellons de granit gris. À l'ouest, un pré humide, où la brume reste collée, s'étend jusqu'à un tronc de chêne couché dans l'herbe. La lumière grise du ciel bas tombe sans ombre sur les herbes, et les ailes de bois tournent au-dessus du toit de la tour, leurs toiles déchirées battant au vent.
- **ambiance** : Herbe mouillée, brume, crécelle lointaine.
- **description** : Le tertre est une butte de terre et d'herbe de quatre mètres, que la tour couronne ; sa pente sud est pelée par les pas, et la piste de boue en contourne le pied. C'est le premier lieu où le groupe peut être repéré. Un test de Discrétion DD 11 permet de s'approcher jusqu'au pied de la tour sans être vu : réussi, le guet ne sonne pas ; raté, les guetteurs repèrent le groupe et le cor sonne au premier round. À l'ouest, le pré humide reste inondé dans ses creux. Dans l'herbe, près du tronc de chêne couché, Messire Godefroy, chevalier errant en armure de fer rouillée, défend le tronc contre un « Vouivre-Écorce » qui n'est qu'un vieux bois pourri. Si on lui dit que c'est du bois, il secoue la tête avec une pitié infinie et affirme qu'il monte la garde pour eux. S'il reçoit un coup de pied, il se jette sur le tronc pour l'étouffer et s'étale dans la mousse en criant qu'il tient la bête par les ouïes. Il ne connaît rien du moulin ni des guetteurs, ne vole rien et ne fait de mal à personne. Le sentier qui descend vers le sud, deux cents mètres, mène aux ruines de la ferme Haddon.
- **arrivee** : La piste de boue vous conduit au pied d'un tertre, et la pente d'herbe couchée monte vers la tour. L'herbe est trempée, et la boue noire colle autour des bottes à chaque pas. À votre gauche, un pré humide s'étend vers l'ouest, où la brume reste collée aux touffes et les creux ne sèchent jamais. Au milieu du pré, un tronc de chêne pourri gît dans l'herbe, et une silhouette en armure rouillée se tient devant lui, immobile, l'épée haute. Plus haut, la tour de granit gris dresse sa masse sombre, et ses quatre ailes de bois tournent au-dessus du toit, leurs toiles déchirées claquant au vent. Le grincement de la crécelle des engrenages descend jusqu'à la pente. Une odeur de tourbe remuée et de grain moisi monte du tertre, mêlée au vent froid. Vers le sud, au loin, une cheminée de brique rouge se devine au-dessus des haies. Le crachin tombe sans relâche, et la lumière grise ne laisse aucune ombre sur l'herbe.

---

#### Niveau 3 : ald-moulin-rez-de-chaussee-et-meules (Rez-de-chaussée et chambre des meules, tour de moellons, secret et action sur les engrenages), dans ald-moulin-d-eldren

**Héritage** (recopié de la fiche du moulin, niveau 2, sans changement) :
- **Dimensions et structure** : tour circulaire de moellons de granit gris, d'environ six pas de diamètre hors œuvre, aux murs épais d'un pas, et huit mètres jusqu'au toit conique, dressée sur un tertre de quatre mètres ; trois niveaux (rez-de-chaussée, chambre des meules à l'étage, plateforme de guet sous le toit) ; la ferme Haddon, à deux cents mètres au sud, n'est plus qu'une longère calcinée.
- **Matériaux et état** : moellons de granit gris aux joints usés et mousseux ; toit conique de bardeaux de chêne noircis, troués par endroits ; quatre ailes de bois aux toiles déchirées, fixées à un arbre vertical qui traverse le toit ; à la ferme, charpente effondrée et murs de moellons noircis par le feu ; sol de terre boueuse.
- **Lumière** : grise et basse, tombée du ciel par les deux fentes de tir de la plateforme de guet et par la porte ouverte à l'ouest ; aucune lampe, aucun feu dans la tour ; à la ferme, le jour tombe entre des murs sans toit.
- **Sons** : crécelle des engrenages qui grincent au vent ; claquement des toiles des ailes au-dessus du toit ; sifflement du vent dans les fentes ; pluie sur le bardeau ; à la ferme, le vent entre les décombres.
- **Odeurs** : bois mouillé et tourbe remuée du pré ; cendre froide et suie à la ferme.
- **Température** : froide et humide ; le vent traverse la tour par les fentes de tir et la porte ; la ferme est glacée depuis deux mois.
- **Éléments remarquables** (chacun avec sa place) :
  - la tour de moellons de granit gris, au sommet du tertre, avec son toit conique de bardeaux ;
  - les quatre ailes de bois, au-dessus du toit conique, dont les toiles déchirées battent au vent ;
  - la cheminée de brique rouge de la ferme Haddon, debout au milieu des ruines, à deux cents mètres au sud ;
  - le pré humide, à l'ouest du tertre, où la brume reste collée aux herbes couchées.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- le rez-de-chaussée, salle ronde de quatre pas de diamètre, au sol de terre battue couvert de sacs de farine crevés, dont certains moisissent en boules grises ;
- le seuil de pierre de la face ouest, creusé en gouttière, et la porte de chêne ouverte dessus : c'est la seule source de lumière du rez-de-chaussée ;
- un tas de farine moisie, au pied de l'arbre vertical, sous la chambre des meules ;
- l'escalier de bois, contre la paroi nord, qui monte à la chambre des meules ;
- la chambre des meules, à l'étage : une meule dormante et une meule tournante, superposées, d'environ deux pas de diamètre, au centre de la pièce ;
- les engrenages de hêtre et de fer, autour de l'arbre vertical, qui relient la meule tournante aux ailes ;
- l'arbre vertical, qui monte d'une crapaudine de pierre au centre du rez-de-chaussée, traverse le plancher de la chambre des meules puis celui du guet, jusqu'au toit ;
- un madrier de chêne, posé contre la paroi, à côté des engrenages ;
- l'échelle de meunier, dans l'angle est de la chambre des meules, qui monte par une trappe ouverte au plafond vers le guet.

**Issues** :
- vers `ald-moulin-tertre-et-approche` : description : « Le seuil de pierre, creusé en gouttière, ouvre à l'ouest sur le pré humide et la pente du tertre. » ; retour : « Depuis le tertre, la tour de granit ferme le sommet ; seules des fentes étroites la percent, et son seuil ouest est l'accès. »
- vers `ald-moulin-plateforme-du-cor` (échelle de meunier, trappe au plafond) : description : « Dans la chambre des meules, une échelle de meunier monte à une trappe ouverte au plafond, vers le guet sous le toit. » ; retour : « Depuis le guet, une trappe s'ouvre sur la chambre des meules ; l'échelle de meunier descend jusqu'aux engrenages qui grincent. »

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| aucune entité (action) | blocage de la meule tournante par le madrier de chêne, et fouille des sacs ; aucun piège, aucun trésor | le madrier, contre la paroi ; les engrenages ; les sacs au sol | — | Athlétisme DD 12 (madrier) ; Investigation DD 11 (sacs) |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : une dent de roue en hêtre, cassée net, posée sur le tas de farine au pied de l'arbre.

**Champs dérivés**
- **resume** : un rez-de-chaussée de sacs moisis, une chambre de meules qui grince, et une échelle vers le guet.
- **accroche** : « Au sommet du tertre, la tour de granit grince à chaque tour de ses ailes ; une odeur de grain moisi sort de sa porte. »
- **visuel** : Une salle ronde de moellons de granit gris, au sol de terre battue couvert de sacs de farine crevés et moisis. Un escalier de bois monte à l'étage, où une meule dormante et une meule tournante, d'environ deux pas de diamètre, s'empilent au centre, autour de l'arbre vertical. Les engrenages de hêtre et de fer tournent autour de l'arbre ; la seule lumière vient du seuil ouvert à l'ouest et d'un faisceau gris qui tombe du plafond, par la trappe.
- **ambiance** : Farine moisie, crécelle, courant d'air.
- **description** : Le rez-de-chaussée est une salle ronde de quatre pas, en moellons de granit gris, au sol de terre battue. Des sacs de farine y gisent, percés ou moisis en boules grises ; l'odeur de grain pourri domine. Un escalier de bois, contre la paroi nord, monte à la chambre des meules. Là, une meule dormante et une meule tournante, de deux pas de diamètre, reposent l'une sur l'autre autour de l'arbre vertical ; des engrenages de hêtre et de fer les relient aux ailes, au-dessus du toit, et la crécelle grince à chaque tour. Une action est possible ici, sans piège : glisser le madrier de chêne dans les roues crantées (Athlétisme DD 12) bloque la meule tournante. Le claquement secoue toute la tour, et les guetteurs doivent réussir un jet de sauvegarde de Dextérité DD 12 ou tomber à terre. Fouiller les sacs (Investigation DD 11) ne donne que de la farine gâtée. Une échelle de meunier, dans l'angle est de la chambre, monte par une trappe ouverte au plafond vers le guet.
- **arrivee** : Le froid de la pierre vous saisit dès le premier pas, et la lumière grise ne va pas plus loin que le premier cercle de sacs. La salle est ronde, ses murs de granit si épais qu'ils étouffent le vent. Au sol, de la terre battue couvre des sacs de farine crevés, dont certains moisissent en boules grises, et une odeur de grain pourri monte jusqu'au plafond. Un escalier de bois grince contre la paroi, et, plus haut, la crécelle des engrenages descend en continu, comme une chose vivante qui tourne. Un arbre de bois monte du centre de la pièce et disparaît dans le plafond ; au-dessus de vous, des dents de roue tournent en grinçant. Les sacs bougent un peu sous le courant d'air venu de l'ouest. La lumière grise du seuil glisse sur le sol, et la farine en suspension y scintille. Vos bottes glissent sur la terre battue, et les engrenages vous rappellent que tout tourne ici, même sans grain.

---

#### Niveau 3 : ald-moulin-plateforme-du-cor (Plateforme de guet sous le toit conique, combat contre les guetteurs), dans ald-moulin-d-eldren

**Héritage** (recopié de la fiche du moulin, niveau 2, sans changement) :
- **Dimensions et structure** : tour circulaire de moellons de granit gris, d'environ six pas de diamètre hors œuvre, aux murs épais d'un pas, et huit mètres jusqu'au toit conique, dressée sur un tertre de quatre mètres ; trois niveaux (rez-de-chaussée, chambre des meules à l'étage, plateforme de guet sous le toit) ; la ferme Haddon, à deux cents mètres au sud, n'est plus qu'une longère calcinée.
- **Matériaux et état** : moellons de granit gris aux joints usés et mousseux ; toit conique de bardeaux de chêne noircis, troués par endroits ; quatre ailes de bois aux toiles déchirées, fixées à un arbre vertical qui traverse le toit ; à la ferme, charpente effondrée et murs de moellons noircis par le feu ; sol de terre boueuse.
- **Lumière** : grise et basse, tombée du ciel par les deux fentes de tir de la plateforme de guet et par la porte ouverte à l'ouest ; aucune lampe, aucun feu dans la tour ; à la ferme, le jour tombe entre des murs sans toit.
- **Sons** : crécelle des engrenages qui grincent au vent ; claquement des toiles des ailes au-dessus du toit ; sifflement du vent dans les fentes ; pluie sur le bardeau ; à la ferme, le vent entre les décombres.
- **Odeurs** : bois mouillé et tourbe remuée du pré ; cendre froide et suie à la ferme.
- **Température** : froide et humide ; le vent traverse la tour par les fentes de tir et la porte ; la ferme est glacée depuis deux mois.
- **Éléments remarquables** (chacun avec sa place) :
  - la tour de moellons de granit gris, au sommet du tertre, avec son toit conique de bardeaux ;
  - les quatre ailes de bois, au-dessus du toit conique, dont les toiles déchirées battent au vent ;
  - la cheminée de brique rouge de la ferme Haddon, debout au milieu des ruines, à deux cents mètres au sud ;
  - le pré humide, à l'ouest du tertre, où la brume reste collée aux herbes couchées.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- le plancher de chêne noirci, de quatre pas de diamètre, sous le toit conique, percé de la trappe par laquelle on monte depuis la chambre des meules ;
- deux fentes de tir taillées dans le granit du mur, à hauteur de tête : l'une vers le nord et la Route du Roi, l'autre vers le sud et la ferme ;
- l'arbre vertical, qui traverse le plancher et le toit pour porter les ailes au-dessus du bardeau ;
- une solive, près de la trappe, où un crochet de fer retient la corne d'aurochs ;
- un tas de paille non brûlée et de toile, contre le mur, qui sert de couche ;
- l'échelle de meunier, qui descend par la trappe vers la chambre des meules.

**Issues** :
- vers `ald-moulin-rez-de-chaussee-et-meules` (l'échelle de meunier, par la trappe) : description : « Une échelle de meunier descend du guet par une trappe, jusqu'à la chambre des meules et ses engrenages qui grincent. » ; retour : « Depuis la chambre des meules, une échelle monte à une trappe au plafond, vers le guet sous le toit conique. »

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (×2) | deux guetteurs gobelins. Le sonneur, près de la solive, décroche la corne et souffle au premier round si le guet a repéré le groupe (échec de Discrétion en 3A, ou approche à découvert) ; sinon rien ne se passe. L'autre tire à l'arc depuis la fente nord. Le mot de passe, donné, les fait laisser passer sans combat | la solive au crochet de fer et la fente de tir nord | `combattant-gobelin` | combat ; Perception DD 12 (repérer les guetteurs en montant) |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : une ficelle de chanvre neuve est nouée autour de la corne d'aurochs, la seule chose propre de la plateforme.

**Champs dérivés**
- **resume** : une chambre de guet sous le toit conique, avec deux fentes de tir sur la plaine et sur la ferme.
- **accroche** : « Sous le toit conique de la tour, deux fentes de tir percent le granit ; au-dessus du bardeau, les ailes de bois tournent. »
- **visuel** : Un plancher de chêne noirci occupe la chambre sous le toit conique. Deux fentes de tir taillées dans le granit laissent entrer une lumière grise, l'une vers le nord, l'autre vers le sud. Une solive porte un crochet de fer, et contre le mur un tas de paille et de toile sert de couche.
- **ambiance** : Vent, toile qui claque, ciel bas.
- **description** : Le guet occupe le sommet de la tour, sous le toit conique : un plancher de chêne noirci, de quatre pas de diamètre, percé de la trappe par laquelle on monte depuis la chambre des meules, et deux fentes de tir taillées dans le granit, l'une vers le nord et la Route du Roi, l'autre vers le sud et la ferme. Deux guetteurs gobelins tiennent ce guet depuis des semaines. Le sonneur, près de la solive où un crochet de fer retient la corne d'aurochs, peut la décrocher ; l'autre, à la fente nord, tire à l'arc court (portée 24 m, longue portée 96 m) et défend le corps à corps au cimeterre. Ils ont la vision dans le noir et la fuite agile. Le cor ne sonne que si le guet repère le groupe (échec de Discrétion en 3A, ou approche à découvert) : le sonneur souffle alors dès le premier round, et l'alerte passe de poste en poste dans la plaine jusqu'au camp de la carrière d'argile, en un quart d'heure. Si la tour a été bloquée depuis le rez-de-chaussée (3B), les guetteurs doivent réussir un jet de sauvegarde de Dextérité DD 12 ou tomber à terre. Le mot de passe « La Serre ne plie point », arraché à Silas capturé, les fait baisser leurs armes : prononcé, il laisse passer le groupe sans combat. Après le combat, une ficelle de chanvre neuve, nouée autour de la corne, est la seule chose propre du guet.
- **arrivee** : Vous montez jusqu'à une chambre basse et ronde, dont le plafond de chêne noirci forme le dessous d'un toit conique. Le plancher craque sous chaque pas, et la pierre autour de vous étouffe presque tous les bruits. La lumière grise entre par deux fentes de tir, taillées dans un mur épais d'un pas, et la pluie fine fouette la pierre au-dehors. Par la fente du nord, une route pavée s'éloigne dans la plaine boueuse ; par celle du sud, une cheminée de brique rouge dépasse de ruines lointaines. Un crochet de fer est scellé dans une solive, près de vous, et un tas de paille et de toile sert de couche contre le mur. Une odeur de bois mouillé et de toile humide flotte dans l'air froid. Au-dessus du bardeau, un claquement sec revient à chaque bourrasque : les bras des ailes tournent sur leur arbre.

---

#### Niveau 3 : ald-moulin-ferme-haddon (Ferme Haddon, ruines et grange, rencontre sans combat et trésor), dans ald-moulin-d-eldren

**Héritage** (recopié de la fiche du moulin, niveau 2, sans changement) :
- **Dimensions et structure** : tour circulaire de moellons de granit gris, d'environ six pas de diamètre hors œuvre, aux murs épais d'un pas, et huit mètres jusqu'au toit conique, dressée sur un tertre de quatre mètres ; trois niveaux (rez-de-chaussée, chambre des meules à l'étage, plateforme de guet sous le toit) ; la ferme Haddon, à deux cents mètres au sud, n'est plus qu'une longère calcinée.
- **Matériaux et état** : moellons de granit gris aux joints usés et mousseux ; toit conique de bardeaux de chêne noircis, troués par endroits ; quatre ailes de bois aux toiles déchirées, fixées à un arbre vertical qui traverse le toit ; à la ferme, charpente effondrée et murs de moellons noircis par le feu ; sol de terre boueuse.
- **Lumière** : grise et basse, tombée du ciel par les deux fentes de tir de la plateforme de guet et par la porte ouverte à l'ouest ; aucune lampe, aucun feu dans la tour ; à la ferme, le jour tombe entre des murs sans toit.
- **Sons** : crécelle des engrenages qui grincent au vent ; claquement des toiles des ailes au-dessus du toit ; sifflement du vent dans les fentes ; pluie sur le bardeau ; à la ferme, le vent entre les décombres.
- **Odeurs** : bois mouillé et tourbe remuée du pré ; cendre froide et suie à la ferme.
- **Température** : froide et humide ; le vent traverse la tour par les fentes de tir et la porte ; la ferme est glacée depuis deux mois.
- **Éléments remarquables** (chacun avec sa place) :
  - la tour de moellons de granit gris, au sommet du tertre, avec son toit conique de bardeaux ;
  - les quatre ailes de bois, au-dessus du toit conique, dont les toiles déchirées battent au vent ;
  - la cheminée de brique rouge de la ferme Haddon, debout au milieu des ruines, à deux cents mètres au sud ;
  - le pré humide, à l'ouest du tertre, où la brume reste collée aux herbes couchées.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- la cheminée de brique rouge, haute de six mètres, debout au milieu des ruines et noircie de suie jusqu'au conduit ;
- le foyer, au pied de la cheminée, couvert de cendre froide et de tuiles de terre cuite tombées ;
- le conduit de la cheminée, au-dessus du foyer, obturé par un bouchon d'argile séchée ; la boîte est derrière ce bouchon ;
- les murs de refend, en moellons noircis, qui cloisonnent les pièces effondrées ;
- les poutres carbonisées de la charpente, couchées en travers du chemin ;
- la grange, à vingt mètres à l'est, dont le toit tient encore.

**Issues** :
- vers `ald-moulin-tertre-et-approche` (sentier de deux cents mètres vers le nord) : description : « Le sentier de boue remonte vers le nord, deux cents mètres, jusqu'au tertre et à la tour de granit qui le couronne. » ; retour : « Depuis le tertre, la cheminée de brique se dresse au sud, à deux cents mètres, au milieu de murs noircis. »
- vers `ald-auberge-de-bregor` (piste de boue vers le sud-ouest, 1 h 30 ✚) : description : « La piste de boue quitte les ruines vers le sud-ouest et descend vers le carrefour, à une heure et demie de marche. » ; retour : « Depuis la piste du carrefour, des murs noircis et une cheminée de brique se devinent au nord-est, au-delà des haies basses. »

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| rencontre sans combat (1 rencontre, 2 déserteurs) | deux déserteurs de la Garde d'Émeraude, ivres et aigris, cachés dans la grange ; ils rançonnent qui fouille les ruines ; ils baissent les armes si on les persuade ou les intimide ; si le groupe attaque, combat de repli hors budget avec le profil `garde` (lance) | la grange, à vingt mètres à l'est | à créer | Perception DD 12 (le héros qui entre dans les ruines, pour les repérer avant qu'ils sortent) ; Persuasion DD 11 ou Intimidation DD 12 |
| trésor (C5) | boîte en fer-blanc, couvercle rouillé, noircie par la suie : douze pièces d'argent, vingt-huit pièces de cuivre et un sachet de graines de pavot noir | le conduit de la cheminée, derrière le bouchon d'argile | à créer (C5) | Investigation DD 11 (repérer le conduit) ; poignard pour retirer le bouchon |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : un anneau de fer rouillé, scellé dans la brique rouge de la cheminée à hauteur de main, où l'on attachait jadis un cheval.

**Champs dérivés**
- **resume** : une ferme brûlée, une cheminée de brique debout et une grange qui tient encore, au sud du moulin.
- **accroche** : « Plus au sud, une cheminée de brique rouge dépasse des murs noircis d'une ferme brûlée, derrière des haies basses. »
- **visuel** : Au milieu des ruines, une cheminée de brique rouge, haute de six mètres, est noircie de suie jusqu'au conduit, au-dessus d'un foyer couvert de cendre froide. Des murs de moellons noircis, en refend, cloisonnent des pièces effondrées, et des poutres carbonisées gisent sur le sol. Plus loin, à vingt mètres à l'est, une grange au toit encore debout se découpe sur le ciel bas. La lumière grise tombe du ciel, sans toit pour la retenir.
- **ambiance** : Cendre froide, suie, vent entre les murs.
- **description** : La ferme Haddon, à deux cents mètres au sud de la tour, a brûlé il y a deux mois : la charpente s'est effondrée sur les pièces, et seules restent debout la cheminée de brique rouge et des murs de refend en moellons noircis. Au pied de la cheminée, le foyer est couvert de cendre froide et de tuiles tombées. Le conduit, au-dessus du foyer, est obturé par un bouchon d'argile séchée ; derrière, une boîte en fer-blanc, au couvercle rouillé et noircie par la suie, contient douze pièces d'argent, vingt-huit pièces de cuivre et un sachet de toile cirée rempli de graines de pavot noir. Pour l'atteindre, il faut gratter l'âtre et inspecter le conduit (Investigation DD 11), puis retirer le bouchon avec un poignard. Dans la grange, à vingt mètres à l'est, deux déserteurs de la Garde d'Émeraude se terrent. Ivres et aigris, ils ont quitté leur poste et rançonnent qui fouille les ruines. Un héros qui entre dans les ruines fait un test de Perception DD 12 : réussi, il repère les déserteurs avant qu'ils ne sortent ; raté, ils sortent une lance à la main. Négocier (Persuasion DD 11) ou intimider (Intimidation DD 12) les fait baisser les armes : ils acceptent de quitter la région sans combat, contre deux rations de nourriture. S'ils attaquent, ils combattent avec le profil `garde`, combat de repli hors budget. Le sentier qui remonte au nord rejoint le tertre.
- **arrivee** : Le sentier descend encore, les haies basses se resserrent, et les ruines apparaissent d'un coup. Une cheminée de brique rouge, haute de six mètres, se dresse au milieu d'un champ de décombres, noircie de suie jusqu'au conduit. L'air sent la cendre froide et le bois brûlé, une odeur sèche que le crachin ne dissipe pas. Des murs de moellons noircis cloisonnent ce qui fut une maison, sans toit ni plancher, et des poutres carbonisées gisent en travers du chemin. Le sol est une boue grise de cendre et de tuiles brisées, qui colle aux semelles. Le vent passe entre les murs et siffle dans les ouvertures où les fenêtres ont cédé. À vingt mètres, à l'est, une grange au toit encore debout se découpe sur le ciel bas. Rien ne bouge autour de la cheminée, sauf une tuile morte qui claque à chaque bourrasque. Le ciel gris pèse sur les murs, et la pluie tombe sur les tuiles mortes.

---

> **Niveau 2 et 3 : ald-combe-de-l-ours, validé par l'utilisateur le 11/11/2026 (V5). Gelé : tout changement demande un nouveau oui.** Rédigée par un agent Haiku, vérifiée par Sonnet 5.5 (deux passes), relue par Claude.

### Niveau 2 : ald-combe-de-l-ours (Le Taillis aux Épines et la Combe de l'Ours, ravin de craie et antre), dans ald-carrefour-d-aldric

**Héritage** (extrait du niveau 1 de la zone, ne pas modifier) :
- Matériaux : ardoise noire et schiste ; grès gris et granit gris ; chêne noirci de suie et de pluie ; fer rouillé ou friable ; tourbe et vase.
- Couleurs : gris ardoise, brun bistre, rouille, vert de mousse, noir de suie, orange de forge.
- Formes : auberges-forteresses à palissade et volets ferrés ; ateliers et fonderies ; tours d'obsidienne.
- Lumière, météo : basse et grise, orange des forges ; crachin d'automne, brouillard humide.

**Héritage physique** (fiche de ce niveau, recopiée sans changement dans chacun de ses sous-lieux) :
- **Dimensions et structure** : ravin calcaire encaissé de huit mètres sous la plaine, long d'une quarantaine de mètres, du goulet au sud jusqu'à la paroi du fond au nord ; on y descend par une pente de boue jusqu'au goulet, puis le fond remonte doucement vers le nord ; au fond, une sente de gibier de moins d'un mètre de large ; à l'est, la falaise de craie ; au pied de la paroi du fond, une caverne naturelle de dix mètres sur douze.
- **Matériaux et état** : craie blanche, friable et rongée par la pluie, poudreuse au sommet ; falaise percée d'une douzaine de trous de terrier de cinquante à soixante centimètres de diamètre ; prunelliers, aubépines et ronces géantes aux épines d'acier ; terre boueuse et glissante au fond ; humidité qui suinte des parois.
- **Lumière** : grise et basse, tombée du ciel en bande étroite entre les bords du ravin ; aucune lampe, aucun feu ; dans la caverne, le jour s'arrête à quelques pas de la gueule.
- **Sons** : pluie sur la craie et les feuilles des prunelliers ; ruissellement dans la sente ; éclats de craie qui glissent le long de la falaise ; sifflement du vent au-dessus des bords ; grognement sourd et régulier qui sort de la caverne.
- **Odeurs** : craie mouillée, feuilles de prunellier froissées, terre détrempée.
- **Température** : froide et humide ; le vent ne descend pas au fond du ravin, où le crachin stagne ; la caverne est plus froide encore.
- **Éléments remarquables** (chacun avec sa place) :
  - le goulet, au sud, où le ravin commence, entre le versant de prunelliers à l'ouest et la craie à l'est, au bas d'une pente de boue ;
  - la falaise de craie, à l'est du ravin, haute de huit mètres et percée d'une douzaine de trous de terrier ;
  - la corniche de craie, à six mètres de hauteur, qui court le long de la falaise ;
  - la sente de gibier, au fond du ravin, bordée à l'ouest par les prunelliers et les ronces géantes ;
  - la caverne naturelle, au pied de la paroi du fond, au nord, dont la gueule est basse.

**Nuances propres** : craie blanche, prunelliers, aubépines, ronces, genévriers et terre boueuse, qui viennent du ravin lui-même ; fougères pourries, os et crânes de cerfs et de poneys, dans la caverne ; boyau et bois de rose du luth ; argile du pot et mousse qui le scelle ; bronze antique de la broche ; cuir sec du piquet ; cailloux de quartz. Ces matières et odeurs ne figurent pas dans le bloc d'héritage de la zone : elles viennent de la combe.

**Plan vu de dessus** (positions en % du plan ; nord en haut ; 100 % en largeur comme en hauteur ≈ 100 m) : le ravin s'étire du sud au nord, au centre du plan. Le goulet occupe la base, à la lisière du taillis ; la caverne est au nord, au pied de la paroi. Le versant ouest, couvert de prunelliers, borde la sente ; la falaise longe l'est.
- **Forme générale** : un ravin étroit de huit mètres de profondeur, long d'une quarantaine de mètres, bordé de craie à l'est.
- **Limites** : au sud, la lisière du taillis et la pente de boue ; à l'ouest, le versant de prunelliers ; à l'est, la falaise de craie ; au nord, la paroi du fond.
- **Orientation** : nord en haut, comme la carte de la zone.
- **Voies d'accès** : la piste de boue arrive du sud-est, depuis le carrefour, et une pente de boue descend jusqu'au goulet, au sud.
- **Éléments naturels** : la craie, les prunelliers et les ronces, la sente de gibier, la caverne.
- **Quartiers, niveaux** : aucun ; trois zones en enfilade du sud au nord : goulet, falaise, caverne.

**Contenu prévu** (budget du point : 1 combat, 0 rencontre sans combat, 0 PNJ avec fiche, 0 énigme, 0 piège, 1 trésor, plus 1 objet de quête ; chaque entité au sous-lieu le plus précis) :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (×3) | trois kobolds harceleurs : ils lancent des dagues depuis la corniche et se replient dans les trous de terrier ; leur vacarme doit réveiller l'ours. Sensibilité au soleil sans effet, le ravin restant à l'ombre. Combat évitable | la corniche de craie, à six mètres, et les trous de terrier (4B) | `combattant-kobold` | combat ; Discrétion DD 12 (pénétrer sans bruit) |
| monstre (×1) | le Vieux Bourru, ours brun territorial, endormi au fond de la caverne ; le vacarme des kobolds le réveille, il charge l'intrus le plus proche ; il ne poursuit pas au-delà du goulet | la caverne, au pied de la paroi du fond (4C) | `ours-brun` | combat, évitable ; Discrétion DD 12 (approche dans l'ombre le long de la paroi) |
| trésor (C6) | pot d'argile scellé par une boule de mousse : 34 pièces de cuivre, 8 pièces d'argent, 3 cailloux de quartz polis, une broche de bronze antique figurant un sanglier (10 po) | la faille de la falaise, à cinq mètres de haut, entre deux racines de genévrier (4B) | à créer (C6) | Athlétisme DD 13 ou grappin DD 10 (atteindre la faille) ; Investigation DD 12 (fouiller) ; un échec de 5 ou plus réveille l'ours |
| objet de quête | luth de Finbar en bois de rose, intact, cordes de boyau détendues, coincé dans une touffe de ronces | la touffe de ronces, à quatre mètres devant la gueule (4C) | à créer | voies sans combat : Dressage DD 10 (appât de viande fraîche, à dix mètres) ; Discrétion DD 12 (ramper dans l'ombre le long de la paroi) ; distraction par un feu de broussailles au loin |

**Avant / après** : aucun changement prévu par le canon à ce lieu ; le ravin et la caverne restent en place.

**Un détail propre à ce lieu** : la craie de la paroi est polie en bandes lisses, à hauteur d'épaule, par le frottement des bêtes qui passent le ravin depuis des années.

**Intérieur** (ce point contient trois sous-lieux) :
- plan intérieur : la sente de gibier remonte doucement du goulet (4A), au sud, vers la falaise (4B), puis jusqu'à la caverne (4C), au fond ; les trois sous-lieux se suivent en enfilade, sur une quarantaine de mètres.
- sous-lieux (chacun aura sa fiche « Niveau 3 », même modèle, héritage = cette fiche) :

  | id | nom | type | fonction dramatique | position | ce qui l'annonce depuis ce lieu | voisins directs |
  | --- | --- | --- | --- | --- | --- | --- |
  | `ald-combe-goulet-des-ronces` | Goulet des ronces (4A), entrée du ravin | sente de gibier au bas d'une pente de boue | approche, terrain | (50, 82) | le versant de prunelliers à l'ouest et la craie à l'est, au sud, qui se referment sur une sente de moins d'un mètre | falaise (4B, vingt mètres au nord) ; piste vers l'auberge |
  | `ald-combe-falaise-et-failles` | Falaise et failles (4B) | paroi de craie, corniche, faille | combat (kobolds), trésor | (56, 61) | la falaise de craie à l'est, percée de trous noirs, et sa corniche pâle à six mètres | goulet (4A, vingt mètres au sud) ; caverne (4C, vingt mètres au nord) |
  | `ald-combe-antre-du-vieux-bourru` | Antre du Vieux Bourru (4C) | caverne basse, touffe de ronces | combat (ours), objet de quête | (50, 40) | la gueule basse d'une caverne au pied de la paroi du fond, et les os et les ronces devant elle | falaise (4B, vingt mètres au sud) |

**Issues** (où elles mènent, aspect vu de chaque côté) :
- vers `ald-auberge-de-bregor` (la piste de boue, 1 h 30 ✚) : description : « Depuis le goulet, la piste de boue remonte vers le sud-est, à travers le taillis, jusqu'au carrefour et à la butte de l'auberge, à une heure et demie. » ; retour : « Depuis la piste du carrefour, un ravin de craie blanche et un taillis d'épines se devinent au nord-ouest, à une heure et demie de marche. »

**Champs dérivés**
- **resume** : un ravin de craie blanche, bordé de prunelliers, où une sente de gibier mène à une caverne au fond.
- **accroche** : « Au nord-ouest de la plaine, un ravin de craie blanche entaille un taillis d'épines ; une sente de gibier s'y enfonce, sans que rien ne bouge au fond. »
- **visuel** : Un ravin de craie blanche, haut de huit mètres, entaille le taillis au nord-ouest de la plaine. À l'est, la falaise de craie est percée de trous ronds, sous une corniche pâle ; à l'ouest, les prunelliers et les ronces ferment la sente. Au fond, une caverne basse ouvre sa gueule au pied de la paroi, et la lumière grise du ciel n'y entre que sur quelques pas.
- **ambiance** : Craie mouillée, ronces, crachin, vent coupé.
- **description** : La Combe de l'Ours est un ravin de craie blanche, encaissé de huit mètres sous la plaine, qui s'ouvre au nord-ouest d'Aldric sur une quarantaine de mètres. On y descend par une pente de boue jusqu'à son goulet, au sud ; une sente de gibier, moins d'un mètre de large, remonte doucement entre les prunelliers et les ronces géantes. À l'est, la falaise est percée d'une douzaine de trous de terrier, réseau de galeries où les kobolds se replient ; une corniche la borde à six mètres. Trois kobolds y ont fait leur poste de harcèlement : ils lancent des dagues sur qui passe et crient pour réveiller l'ours. Au fond, la caverne de dix mètres sur douze abrite le Vieux Bourru, un ours brun territorial, non maléfique. Leur vacarme peut le réveiller : il rugit alors et charge l'intrus le plus proche, sans poursuivre au-delà du goulet. Le combat peut donc être évité : le luth de Finbar, intact, est coincé dans une touffe de ronces à quatre mètres de la gueule. On peut le récupérer en appâtant l'ours, en rampant dans l'ombre le long de la paroi, ou en le détournant par un feu de broussailles au loin. Le crachin stagne au fond du ravin, et le froid y est vif.
- **arrivee** : La piste de boue s'enfonce entre deux haies de prunelliers, et le taillis se referme ; les épines accrochent les manches à chaque pas. Puis une pente glissante descend vers le fond, et le ravin de craie blanche, haut de huit mètres, se referme autour de vous. Sa falaise de l'est est percée de trous ronds, et une corniche pâle la borde, à six mètres. Des massifs de prunelliers bordent la sente qui remonte doucement au fond, et des ronces géantes se mêlent aux buissons. Au loin, au pied de la paroi du fond, une caverne basse ouvre sa gueule, noire au-delà de quelques pas. Une odeur de craie mouillée et de feuilles froissées monte de la terre détrempée. Le vent ne descend pas jusqu'au fond, et le crachin tombe droit dans le ravin. La lumière grise vient du ciel, en bande étroite entre les bords. Quelques éclats de craie glissent le long de la paroi, puis tout redevient immobile.

---

#### Niveau 3 : ald-combe-goulet-des-ronces (Goulet des ronces, entrée du ravin, approche et terrain), dans ald-combe-de-l-ours

**Héritage** (recopié de la fiche de la combe, niveau 2, sans changement) :
- **Dimensions et structure** : ravin calcaire encaissé de huit mètres sous la plaine, long d'une quarantaine de mètres, du goulet au sud jusqu'à la paroi du fond au nord ; on y descend par une pente de boue jusqu'au goulet, puis le fond remonte doucement vers le nord ; au fond, une sente de gibier de moins d'un mètre de large ; à l'est, la falaise de craie ; au pied de la paroi du fond, une caverne naturelle de dix mètres sur douze.
- **Matériaux et état** : craie blanche, friable et rongée par la pluie, poudreuse au sommet ; falaise percée d'une douzaine de trous de terrier de cinquante à soixante centimètres de diamètre ; prunelliers, aubépines et ronces géantes aux épines d'acier ; terre boueuse et glissante au fond ; humidité qui suinte des parois.
- **Lumière** : grise et basse, tombée du ciel en bande étroite entre les bords du ravin ; aucune lampe, aucun feu ; dans la caverne, le jour s'arrête à quelques pas de la gueule.
- **Sons** : pluie sur la craie et les feuilles des prunelliers ; ruissellement dans la sente ; éclats de craie qui glissent le long de la falaise ; sifflement du vent au-dessus des bords ; grognement sourd et régulier qui sort de la caverne.
- **Odeurs** : craie mouillée, feuilles de prunellier froissées, terre détrempée.
- **Température** : froide et humide ; le vent ne descend pas au fond du ravin, où le crachin stagne ; la caverne est plus froide encore.
- **Éléments remarquables** (chacun avec sa place) :
  - le goulet, au sud, où le ravin commence, entre le versant de prunelliers à l'ouest et la craie à l'est, au bas d'une pente de boue ;
  - la falaise de craie, à l'est du ravin, haute de huit mètres et percée d'une douzaine de trous de terrier ;
  - la corniche de craie, à six mètres de hauteur, qui court le long de la falaise ;
  - la sente de gibier, au fond du ravin, bordée à l'ouest par les prunelliers et les ronces géantes ;
  - la caverne naturelle, au pied de la paroi du fond, au nord, dont la gueule est basse.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- la pente de boue, au sud-est, qui descend de la plaine jusqu'au goulet ;
- la sente de gibier, moins d'un mètre de large, qui monte vers le nord entre le versant de prunelliers et le pied de la falaise, et que la boue rend glissante ;
- les aubépines et les ronces géantes qui hérissent le versant de prunelliers, à hauteur d'épaule ;
- le piquet de bois fiché dans la craie au bord de la sente, avec des lanières de cuir sèches nouées à son sommet et une entaille ancienne dans le bois ;
- la paroi de craie, à l'est, haute de huit mètres, qui commence au goulet ;
- la piste de boue, au sud-est, qui remonte vers le carrefour.

**Issues** :
- vers `ald-combe-falaise-et-failles` : description : « La sente de gibier monte vers le nord, entre les prunelliers ; à vingt mètres, la craie blanche de la falaise s'élève à l'est. » ; retour : « Depuis la sente au pied de la falaise, le goulet se devine au sud, à vingt mètres, où la pente de boue remonte vers la plaine. »
- vers `ald-auberge-de-bregor` (la piste de boue, 1 h 30 ✚) : description : « La piste de boue quitte le goulet vers le sud-est, remonte à travers le taillis et rejoint le carrefour, à une heure et demie de marche. » ; retour : « Depuis la piste du carrefour, un ravin de craie blanche et un taillis d'épines se devinent au nord-ouest, à une heure et demie de marche. »

**Contenu prévu** : aucun. Le goulet ne porte ni combat, ni trésor, ni piège ; le budget du point est placé en 4B et 4C. Les ronces et les aubépines blessent qui passe au pas de course : c'est du terrain, pas un piège.

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : sur la craie de la paroi, à hauteur de tête, quatre griffures parallèles, profondes de trois doigts, sont récentes et d'un blanc vif.

**Champs dérivés**
- **resume** : un goulet de prunelliers et de ronces, où la sente s'enfonce au pied d'une paroi de craie.
- **accroche** : « Au sud du ravin, un versant de prunelliers et une paroi de craie se resserrent sur une sente de gibier. »
- **visuel** : Une sente de gibier, boueuse et large de moins d'un mètre, s'enfonce entre un versant de prunelliers et de ronces géantes, au pied d'une paroi de craie qui monte à huit mètres. Un piquet de bois fiché dans la craie, au bord de la sente, porte des lanières de cuir sèches. Le ciel gris tombe en bande étroite entre les bords du ravin, et la pluie ruisselle sur la craie.
- **ambiance** : Boue, ronces, craie mouillée, crachin.
- **description** : Le goulet des ronces marque l'entrée du ravin. La piste de boue arrive du sud-est ; une pente glissante descend de huit mètres jusqu'au fond, où s'engage une sente de gibier, moins d'un mètre de large, qui remonte doucement vers le nord. À l'ouest, un versant de prunelliers, d'aubépines et de ronces géantes aux épines d'acier ; à l'est, la craie. Traverser les ronces au pas de course inflige de petites blessures ; avancer prudemment, en fendant les épines avec un tranchoir ou en prenant son temps, permet de passer sans dommage. Ce n'est pas un piège, seulement du terrain. Au bord de la sente, un piquet de bois fiché dans la craie porte des lanières de cuir sèches et une entaille ancienne dont on ne sait rien. Sur la craie de la paroi, à hauteur de tête, quatre griffures fraîches disent qu'une bête lourde passe ici souvent, la nuit. Cette lisière marque la limite de son territoire : l'ours ne sort pas au-delà du goulet. La lumière grise tombe du ciel en bande étroite entre les bords.
- **arrivee** : Le chemin de boue descend par une pente glissante, et le couloir du ravin se resserre autour de vous. À gauche, le versant de prunelliers hérisse ses épines à hauteur d'épaule, et les ronces géantes accrochent la toile des manches à chaque pas. À droite, la craie blanche monte de huit mètres. Une sente, large de moins d'un mètre, remonte vers le nord entre les buissons et le pied de la paroi. Un piquet de bois est fiché dans la craie, au bord de la sente, et des lanières de cuir sèches pendent à son sommet, nouées depuis longtemps. Une odeur de craie mouillée et de feuilles de prunellier froissées monte de la terre détrempée. Le crachin tombe droit dans le ravin, et le vent qui siffle au-dessus des bords ne descend pas jusqu'à vous. La lumière grise vient du ciel, en bande étroite. Rien ne bouge entre les massifs, sauf la pluie qui ruisselle sur la craie et goutte dans les épines.

---

#### Niveau 3 : ald-combe-falaise-et-failles (Falaise de craie, corniche des kobolds et faille au trésor, combat et trésor), dans ald-combe-de-l-ours

**Héritage** (recopié de la fiche de la combe, niveau 2, sans changement) :
- **Dimensions et structure** : ravin calcaire encaissé de huit mètres sous la plaine, long d'une quarantaine de mètres, du goulet au sud jusqu'à la paroi du fond au nord ; on y descend par une pente de boue jusqu'au goulet, puis le fond remonte doucement vers le nord ; au fond, une sente de gibier de moins d'un mètre de large ; à l'est, la falaise de craie ; au pied de la paroi du fond, une caverne naturelle de dix mètres sur douze.
- **Matériaux et état** : craie blanche, friable et rongée par la pluie, poudreuse au sommet ; falaise percée d'une douzaine de trous de terrier de cinquante à soixante centimètres de diamètre ; prunelliers, aubépines et ronces géantes aux épines d'acier ; terre boueuse et glissante au fond ; humidité qui suinte des parois.
- **Lumière** : grise et basse, tombée du ciel en bande étroite entre les bords du ravin ; aucune lampe, aucun feu ; dans la caverne, le jour s'arrête à quelques pas de la gueule.
- **Sons** : pluie sur la craie et les feuilles des prunelliers ; ruissellement dans la sente ; éclats de craie qui glissent le long de la falaise ; sifflement du vent au-dessus des bords ; grognement sourd et régulier qui sort de la caverne.
- **Odeurs** : craie mouillée, feuilles de prunellier froissées, terre détrempée.
- **Température** : froide et humide ; le vent ne descend pas au fond du ravin, où le crachin stagne ; la caverne est plus froide encore.
- **Éléments remarquables** (chacun avec sa place) :
  - le goulet, au sud, où le ravin commence, entre le versant de prunelliers à l'ouest et la craie à l'est, au bas d'une pente de boue ;
  - la falaise de craie, à l'est du ravin, haute de huit mètres et percée d'une douzaine de trous de terrier ;
  - la corniche de craie, à six mètres de hauteur, qui court le long de la falaise ;
  - la sente de gibier, au fond du ravin, bordée à l'ouest par les prunelliers et les ronces géantes ;
  - la caverne naturelle, au pied de la paroi du fond, au nord, dont la gueule est basse.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- la falaise de craie, à l'est de la sente, haute de huit mètres, percée d'une douzaine de trous de terrier de cinquante à soixante centimètres, qui se prolongent en galeries dans la roche ;
- la corniche de craie, à six mètres de hauteur, qui court le long de la falaise au-dessus de la sente ;
- la faille de la falaise, à cinq mètres de hauteur, sous la corniche, calée entre deux racines de genévrier ; un pot d'argile y est scellé par une boule de mousse ;
- trois petits tas de cailloux de craie, au sol, au pied de la paroi, sous la corniche ;
- le versant de prunelliers, à l'ouest de la sente, qui descend en pente jusqu'au fond du ravin.

**Issues** :
- vers `ald-combe-goulet-des-ronces` (sente, vingt mètres au sud) : description : « La sente redescend vers le sud, entre les prunelliers, jusqu'au goulet des ronces, à vingt mètres de la falaise. » ; retour : « Depuis le goulet, la falaise de craie se dresse au nord, à vingt mètres, avec sa corniche pâle et ses trous noirs. »
- vers `ald-combe-antre-du-vieux-bourru` (sente, vingt mètres au nord) : description : « La sente remonte vers le nord, au pied de la falaise, jusqu'à la gueule basse de la caverne, à vingt mètres. » ; retour : « Depuis la gueule de la caverne, la falaise et la corniche se devinent au sud, à vingt mètres, derrière les ronces. »

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (×3) | trois kobolds harceleurs, 7 PV, CA 14 ; ils lancent des dagues, au corps à corps ou à 6/18 m, depuis la corniche ; avantage dès qu'un allié se tient à 1,50 m de la cible (tactique de meute) ; ils se replient dans les trous de terrier ; leur vacarme doit réveiller l'ours | la corniche de craie, à six mètres, et les trous de terrier | `combattant-kobold` | combat ; Discrétion DD 12 (pénétrer sans bruit) |
| trésor (C6) | pot d'argile scellé par une boule de mousse : 34 pièces de cuivre, 8 pièces d'argent, 3 cailloux de quartz polis, une broche de bronze antique figurant un sanglier (10 po) | la faille de la falaise, à cinq mètres de hauteur, entre deux racines de genévrier | à créer (C6) | Athlétisme DD 13 ou grappin et corde DD 10 (atteindre la faille) ; Investigation DD 12 (fouiller la fissure) ; échec de 5 ou plus : l'ours se réveille |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : trois petits tas de cailloux de craie, rangés au sol au pied de la paroi, sous la corniche, comme des munitions prêtes à servir.

**Champs dérivés**
- **resume** : une falaise de craie percée de terriers, sous une corniche pâle, avec une faille à mi-hauteur.
- **accroche** : « Sur la paroi de craie, percée de trous noirs, une corniche pâle court au-dessus de la sente. »
- **visuel** : Une falaise de craie blanche, haute de huit mètres, monte à l'est de la sente et se troue d'une douzaine de terriers larges d'une cinquantaine de centimètres. À six mètres, une corniche pâle court au-dessus de la sente ; sous elle, à cinq mètres, une faille calée entre deux racines de genévrier. Au sol, au pied de la paroi, trois petits tas de cailloux de craie ; à l'ouest, un versant de prunelliers descend vers le fond, sous une lumière grise qui tombe du ciel en bande étroite.
- **ambiance** : Craie fraîche, terriers, pluie sur la paroi.
- **description** : La falaise de craie, à l'est de la sente, monte à huit mètres et porte une douzaine de trous de terrier, larges d'une cinquantaine de centimètres, qui se prolongent en galeries dans la roche : c'est le réseau des kobolds. Trois combattants kobolds (7 PV, CA 14) tiennent la corniche, à six mètres. Ils lancent des dagues sur qui passe, au corps à corps ou à 6/18 m (+4, 1d4+2 perforant), et se prêtent main-forte : l'avantage dès qu'un allié est à 1,50 m de la cible. Leur sensibilité au soleil n'a pas d'effet, le ravin restant à l'ombre. Ils crient et jettent de la craie pour faire du bruit, dans l'espoir que l'ours se réveille ; ce vacarme peut porter jusqu'à la caverne. Un pot d'argile est scellé dans la faille, à cinq mètres, entre deux racines de genévrier, sous la corniche : c'est le trésor des kobolds. Y accéder demande une escalade (Athlétisme DD 13) ou un grappin et une corde (DD 10) ; un échec de 5 ou plus dans la craie friable réveille l'ours. Les kobolds défendent la faille depuis la corniche. Une fouille de la fissure (Investigation DD 12) livre le pot : 34 pièces de cuivre, 8 pièces d'argent, 3 cailloux de quartz polis et une broche de bronze antique figurant un sanglier, valant 10 po.
- **arrivee** : La sente remonte doucement vers le nord, et la craie se dresse d'un coup à votre droite, blanche et sans fin, haute de huit mètres au-dessus de la boue. Sa surface est poudreuse et rongée par la pluie. Elle est percée d'une douzaine de trous ronds, larges d'une cinquantaine de centimètres, dont les bords sont grignotés. Plus haut, une corniche pâle court le long de la paroi, à six mètres. À votre gauche, un versant de prunelliers descend en pente jusqu'au fond. Au pied de la falaise, sous la corniche, trois petits tas de cailloux de craie sont rangés sur la boue, et de la craie fraîche blanchit la terre par plaques. Une odeur de craie mouillée et de terre détrempée vous accompagne. La pluie ruisselle sur la pierre, et le vent passe au-dessus des bords sans descendre. La lumière grise tombe du ciel en bande étroite, et les parois ne renvoient aucun écho.

---

#### Niveau 3 : ald-combe-antre-du-vieux-bourru (Antre du Vieux Bourru, caverne et touffe de ronces, combat et objet de quête), dans ald-combe-de-l-ours

**Héritage** (recopié de la fiche de la combe, niveau 2, sans changement) :
- **Dimensions et structure** : ravin calcaire encaissé de huit mètres sous la plaine, long d'une quarantaine de mètres, du goulet au sud jusqu'à la paroi du fond au nord ; on y descend par une pente de boue jusqu'au goulet, puis le fond remonte doucement vers le nord ; au fond, une sente de gibier de moins d'un mètre de large ; à l'est, la falaise de craie ; au pied de la paroi du fond, une caverne naturelle de dix mètres sur douze.
- **Matériaux et état** : craie blanche, friable et rongée par la pluie, poudreuse au sommet ; falaise percée d'une douzaine de trous de terrier de cinquante à soixante centimètres de diamètre ; prunelliers, aubépines et ronces géantes aux épines d'acier ; terre boueuse et glissante au fond ; humidité qui suinte des parois.
- **Lumière** : grise et basse, tombée du ciel en bande étroite entre les bords du ravin ; aucune lampe, aucun feu ; dans la caverne, le jour s'arrête à quelques pas de la gueule.
- **Sons** : pluie sur la craie et les feuilles des prunelliers ; ruissellement dans la sente ; éclats de craie qui glissent le long de la falaise ; sifflement du vent au-dessus des bords ; grognement sourd et régulier qui sort de la caverne.
- **Odeurs** : craie mouillée, feuilles de prunellier froissées, terre détrempée.
- **Température** : froide et humide ; le vent ne descend pas au fond du ravin, où le crachin stagne ; la caverne est plus froide encore.
- **Éléments remarquables** (chacun avec sa place) :
  - le goulet, au sud, où le ravin commence, entre le versant de prunelliers à l'ouest et la craie à l'est, au bas d'une pente de boue ;
  - la falaise de craie, à l'est du ravin, haute de huit mètres et percée d'une douzaine de trous de terrier ;
  - la corniche de craie, à six mètres de hauteur, qui court le long de la falaise ;
  - la sente de gibier, au fond du ravin, bordée à l'ouest par les prunelliers et les ronces géantes ;
  - la caverne naturelle, au pied de la paroi du fond, au nord, dont la gueule est basse.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- la caverne naturelle, de dix mètres sur douze, dont la gueule est basse et s'ouvre au pied de la paroi du fond ;
- les os de cerfs et de poneys rongés, éparpillés sur la boue devant la gueule et blanchis par la pluie ;
- la touffe de ronces, à hauteur de genou et à quatre mètres devant la gueule, où le luth de Finbar est coincé, son manche de bois de rose pris dans les épines ;
- au fond de la caverne, dans l'ombre, un lit de fougères pourries creusé en cuvette, et un tas d'os avec des crânes de cerfs posés en rang le long de la paroi ;
- la terre battue, détrempée près de la gueule.

**Issues** :
- vers `ald-combe-falaise-et-failles` (sente, vingt mètres au sud) : description : « La sente redescend vers le sud, entre les prunelliers, jusqu'à la falaise de craie, à vingt mètres. » ; retour : « Depuis la falaise, la gueule basse de la caverne se devine au nord, derrière une touffe de ronces, au fond du ravin. »

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (×1) | le Vieux Bourru, ours brun territorial (22 PV, CA 11, FP 1), endormi au fond ; le vacarme des kobolds le réveille, il rugit et charge l'intrus le plus proche ; il ne poursuit pas au-delà du goulet | le lit de fougères pourries, au fond de la caverne | `ours-brun` | combat, évitable ; Discrétion DD 12 (approche dans l'ombre le long de la paroi) |
| objet de quête | luth de Finbar en bois de rose, intact, cordes de boyau détendues ; abandonné ici par les kobolds | la touffe de ronces, à quatre mètres devant la gueule | à créer | Dressage DD 10 (appât de viande fraîche jeté à dix mètres, l'ours sort manger le dos tourné) ; Discrétion DD 12 (ramper dans l'ombre le long de la paroi) ; ou distraction par un feu de broussailles au loin |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : un crâne de cerf porte encore son bois, dont une branche est brisée net.

**Champs dérivés**
- **resume** : une caverne basse au fond du ravin, tapissée de fougères pourries et jonchée d'os de cerfs.
- **accroche** : « Au fond du ravin, une gueule basse s'ouvre au pied de la craie, entourée de ronces et d'os blanchis par la pluie. »
- **visuel** : Une caverne de dix mètres sur douze, à la gueule basse, s'ouvre au pied de la paroi de craie, au fond du ravin. Devant elle, des os de cerfs et de poneys rongés, blanchis par la pluie, traînent sur la boue, et une touffe de ronces s'étale à hauteur de genou. Au-delà de quelques pas, la lumière grise du ciel n'atteint plus rien, et l'intérieur reste noir.
- **ambiance** : Os blanchis, grognement sourd, crachin.
- **description** : La caverne, de dix mètres sur douze, ouvre sa gueule basse au pied de la paroi du fond ; des os de cerfs et de poneys rongés sont éparpillés sur la boue devant elle. Au fond, dans l'ombre, sur un lit de fougères pourries, dort le Vieux Bourru, un ours brun (22 PV, CA 11, FP 1) : une bête territoriale, non maléfique. Il attaque deux fois par tour : une morsure (+5, 1d8+3 perforant) et une griffe (+5, 1d4+3 tranchant), qui met à terre une cible de taille G ou moins ; le combat est dangereux pour un groupe de niveau 1 qui reste au corps à corps. Le luth de Finbar, intact, est coincé dans une touffe de ronces à quatre mètres devant la gueule : les kobolds l'ont volé pendant le sommeil de Finbar et l'ont abandonné ici. Le vacarme des kobolds peut réveiller l'ours : il rugit alors et charge l'intrus le plus proche. Trois voies évitent le combat. Un appât de viande fraîche lancé à dix mètres de la gueule attire l'ours hors de la caverne pour manger le dos tourné (Dressage DD 10) ; le luth, à quatre mètres, devient alors récupérable. Une approche dans l'ombre le long de la paroi, sans faire rouler les cailloux (Discrétion DD 12), permet de le saisir sans l'éveiller. Un feu de broussailles allumé au loin détourne aussi l'attention. Si le combat tourne mal, l'ours ne poursuit pas au-delà du goulet.
- **arrivee** : La sente vous mène au bord d'une caverne dont la gueule est basse, à peine plus haute qu'un homme courbé. Devant elle, des os de cerfs et de poneys rongés, blanchis par la pluie, traînent sur la boue, et une touffe de ronces s'étale à hauteur de genou. Ses épines accrochent la toile des manches. La roche de la paroi du fond est blanche, mais l'entrée est noire au-delà de quelques pas. Une odeur de fougère pourrie et de terre détrempée sort de l'obscurité, lourde et âcre, et se mêle au crachin. Un grognement sourd et régulier monte du fond. La boue glisse sous les semelles, et le froid de la caverne vous saisit avant même la gueule. Le vent ne rentre pas ici, et la lumière grise s'arrête à trois pas dans l'ombre. Au-delà, la paroi se perd dans une masse sombre que rien n'éclaire.

---

> **Niveau 2 et 3 : ald-carriere-d-argile, validé par l'utilisateur le 11/11/2026 (V5). Gelé : tout changement demande un nouveau oui.** Rédigée par un agent Haiku, vérifiée par Sonnet 5.5 (deux passes), arbitrée par Claude. Durée carrière-auberge : 2 h par le pont (table du niveau 1 harmonisée avec l'accord de l'utilisateur).

### Niveau 2 : ald-carriere-d-argile (La Carrière d'Argile Rouge, excavation de glaise et camp retranché), dans ald-carrefour-d-aldric

**Héritage** (extrait du niveau 1 de la zone, ne pas modifier) :
- Matériaux : ardoise noire et schiste ; grès gris et granit gris ; chêne noirci de suie et de pluie ; fer rouillé ou friable ; tourbe et vase.
- Couleurs : gris ardoise, brun bistre, rouille, vert de mousse, noir de suie, orange de forge.
- Formes : auberges-forteresses à palissade et volets ferrés ; ateliers et fonderies ; tours d'obsidienne.
- Lumière, météo : basse et grise, orange des forges ; crachin d'automne, brouillard humide.

**Héritage physique** (fiche de ce niveau, recopiée sans changement dans chacun de ses sous-lieux) :
- **Dimensions et structure** : excavation d'argile rouge de quatre-vingts mètres de large, d'est en ouest, et d'environ soixante-quinze mètres du nord au sud, creusée jusqu'à douze mètres sous la plaine ; au nord, les gradins descendent du rebord en quatre terrasses de trois mètres ; au centre, un fond plat, large et humide ; à l'est, une rampe de charrois entaille la paroi ; au sud, une falaise d'argile de douze mètres dont le sommet déverse au-dessus d'un pied de paroi où s'abrite un camp de huttes.
- **Matériaux et état** : argile rouge écarlate, lisse et collante sous la pluie, craquelée et pâle au sommet des gradins ; glaise détrempée et par plaques au fond ; falaise sud striée de fentes et de coulées anciennes ; boue rouge sur toutes les pentes ; humidité qui suinte des fentes de la falaise.
- **Lumière** : grise et basse, tombée du ciel et reçue en plein par le rebord et les gradins ; le fond n'en reçoit qu'une part, et le pied de la falaise sud reste à l'ombre sous le surplomb ; aucune lampe dans la cuvette, sauf le feu du camp, orange, au pied de la falaise.
- **Sons** : pluie sur la glaise et les bâches ; ruissellement et écoulements de boue dans les gradins ; clapotis dans la mare ; craquements de branchages au camp ; voix basses et grognements au pied de la falaise.
- **Odeurs** : argile mouillée, fumée de branchages verts, rouille de la mare, graisse rance de viande grillée, suint de laine mouillée.
- **Température** : fraîche et humide ; l'air stagne au fond de la cuvette, où le crachin ne se disperse pas ; le pied de la falaise est plus froid, et la fumée du camp le réchauffe un peu.
- **Éléments remarquables** (chacun avec sa place) :
  - les gradins d'argile, au nord, quatre terrasses qui descendent du rebord vers le fond ;
  - la mare de rouille, au centre-est du fond, plate et sombre ;
  - la falaise d'argile, au sud, haute de douze mètres, dont le sommet déverse au-dessus du camp ;
  - le campement de huttes d'écorce, coiffées de bâches grises, au pied de la falaise, au sud-ouest ;
  - le feu de branchages du camp, au pied de la falaise, au sud-ouest : fumée qui monte sous le surplomb, lueur orange ;
  - la rampe de charrois, à l'est, qui remonte vers le rebord.

**Nuances propres** : argile rouge, glaise et boue, qui viennent de la carrière elle-même ; jute des toiles, branchages tressés en fascines, sève coupée des branchages, écorce des huttes, bâches grises de chariot, rouille de la mare et des carcasses, bois de fer cerclé d'acier du coffre, chanvre des cordes, cuir des sangles, fil de fer des réparations, os d'un crâne de poney, roche sous les ornières, eau morte et bois pourri de la mare ; fumée de branchages verts et graisse de viande, qui viennent du camp. Ces matières et odeurs ne figurent pas dans le bloc d'héritage de la zone.

**Plan vu de dessus** (positions en % du plan ; nord en haut ; 100 % en largeur comme en hauteur ≈ 100 m) : la cuvette occupe presque tout le plan. Les gradins bordent le nord, la falaise ferme le sud, la mare occupe le centre-est et le camp se blottit au pied de la falaise sud, à l'ouest.
- **Forme générale** : une cuvette de quatre-vingts mètres de large sur soixante-quinze de long, creusée à douze mètres sous la plaine.
- **Limites** : au nord, le rebord et la piste de boue ; à l'est, la paroi entaillée par la rampe ; au sud, la falaise d'argile de douze mètres, contre laquelle le camp est adossé ; à l'ouest, une paroi de glaise haute de douze mètres, comme le reste.
- **Orientation** : nord en haut ; depuis le rebord, la cuvette se déploie vers le sud.
- **Voies d'accès** : la piste de boue arrive du nord-est, depuis le carrefour, et débouche sur le rebord à son extrémité nord-est ; la rampe de charrois, à l'est du fond, sort de la cuvette vers le sud-est, en direction du Vieux Pont.
- **Éléments naturels** : la glaise rouge, les gradins, la mare, la falaise.
- **Quartiers, niveaux** : quatre zones, du nord au sud : gradins, barrage du pied des gradins, fond et mare, camp au pied de la falaise sud.

**Contenu prévu** (budget du point : 1 combat, 1 rencontre sans combat, 1 PNJ avec fiche, 0 énigme, 1 piège, 1 trésor ; le combat est **un seul combat en trois temps** (archers de 5B, molosse de 5C, puis chef et archers de 5D) ; chaque entité au sous-lieu le plus précis) :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (×2) | archers gobelins, premier temps : derrière les fascines de l'ouest, au-dessus du barrage | les palissades de fascines (5B) | `combattant-gobelin` | combat ; Perception passive DD 12 pour les voir |
| monstre (×1) | Bave-de-Loup, molosse, deuxième temps : il garde la rive sud de la mare et aboie à l'intrus | la rive sud de la mare (5C) | `molosse` | combat ; Discrétion DD 12 pour le contourner sans l'éveiller |
| monstre (chef) | Demi-Dent, chef du camp, troisième temps : combat au cimeterre et à l'arc court | la plus grande hutte, au centre du camp (5D) | `chef-gobelin` | combat |
| monstre (×2) | archers gobelins, troisième temps : derrière la palissade du réduit | les fascines au nord et à l'est du camp (5D) | `combattant-gobelin` | combat |
| rencontre sans combat | reddition de Demi-Dent à 5 PV ou moins : l'épargner ou l'exécuter (dilemme de zone) | la masse tombée dans la glaise, devant la plus grande hutte (5D) | à créer | dilemme ; seuil de 5 PV |
| PNJ | Demi-Dent, avec sa fiche (dialogues de reddition) | la plus grande hutte (5D) | `demi-dent` | rencontre (reddition) |
| piège | deux fosses de quatre mètres de large et trois de profondeur, côte à côte et séparées de deux mètres, occupant les dix mètres du passage, à quatre pieux de chêne noircis chacune ; chute 2d6 perforants ; le barrage se contourne par la fondrière de l'est (terrain difficile, Dextérité DD 11) | le centre du barrage, au pied des gradins (5B) | à créer | Perception passive DD 13 ou Investigation DD 11 ; Dextérité DD 13 pour se rattraper au bord |
| trésor (C7) | coffre blindé de Demi-Dent : 75 po, 120 pa, une potion de soins, un miroir de poche en argent (25 po), le `registre-de-convoi`, les `bottes-de-saut-du-gobelin` | le coffre en bois de fer cerclé d'acier, au fond de la plus grande hutte (5D) | à créer (C7) | Crochetage DD 12 ; Force DD 16 (fracas qui alerte le camp) ; impossible sans combat tant que le chef et ses gardes vivent |

**Avant / après** : aucun changement de décor à ce niveau. Le sort de Demi-Dent (épargné ou exécuté) pose le drapeau `z1-demi-dent-epargne` ou `z1-demi-dent-tue`, lu plus loin, sans effet sur les huttes ni sur la mare.

**Un détail propre à ce lieu** : sur la falaise sud, à mi-hauteur, une cheville de bois fichée dans la glaise porte encore un bout de corde ; une seconde cheville, plus bas, a été arrachée.

**Intérieur** (ce point contient quatre sous-lieux) :
- plan intérieur : la piste arrive au rebord nord-est (5A) et les gradins descendent vers le sud-ouest. Au pied des gradins, le barrage (5B) ferme le fond : fascines à l'ouest, un passage de dix mètres occupé par deux fosses, fondrière à l'est. Au centre-est, la mare (5C) et la rampe de charrois. Au pied de la falaise sud, à l'ouest, le camp (5D).
- sous-lieux (chacun aura sa fiche « Niveau 3 », même modèle, héritage = cette fiche) :

  | id | nom | type | fonction dramatique | position | ce qui l'annonce depuis ce lieu | voisins directs |
  | --- | --- | --- | --- | --- | --- | --- |
  | `ald-carriere-gradins-d-argile` | Gradins d'argile et accès supérieur (5A) | terrasses et rebord d'accès | approche, terrain | (70, 12) | les quatre terrasses de glaise qui descendent vers le sud-ouest, et la piste de boue qui débouche sur le rebord | 5B (au sud-ouest, une trentaine de mètres) ; pente de boue vers la berge sud |
  | `ald-carriere-perimetre-piege` | Périmètre piégé (5B) | pied des gradins, barrage de fosses | piège, combat (archers) | (50, 38) | les toiles de jute étalées sur la glaise, la palissade de fascines à l'ouest, la bande de boue à l'est | 5A (au nord-est, une trentaine de mètres) ; 5C (au sud-est, une vingtaine) ; 5D (au sud-ouest, quarante-cinq mètres) |
  | `ald-carriere-fond-de-fosse-et-mare` | Fond de fosse et mare (5C) | cuvette humide, mare de rouille, rampe | combat (molosse), terrain, sortie vers le pont | (64, 56) | la mare rouillée au centre-est, les carcasses de chariot à demi immergées, et la rampe à l'est | 5B (au nord-ouest, une vingtaine) ; 5D (à l'ouest-sud-ouest, quarante-deux mètres) ; rampe vers le pont |
  | `ald-carriere-huttes-et-poste-de-commandement` | Huttes et poste de commandement (5D) | camp de huttes au pied de la falaise sud | combat (chef et archers), rencontre, trésor | (30, 80) | la fumée de branchages et la lueur orange du feu, au pied de la falaise, à l'ouest | 5B (au nord-est, quarante-cinq mètres) ; 5C (à l'est-nord-est, quarante-deux mètres) |

**Issues** (où elles mènent, aspect vu de chaque côté) :
- vers `ald-auberge-de-bregor` (la rampe de l'est, le sentier de la berge sud, le Vieux Pont puis la piste, environ 2 h ✚) : description : « Depuis le fond, la rampe de l'est rejoint le sentier de la berge sud jusqu'au Vieux Pont, puis la piste monte à la butte de l'auberge, environ deux heures. » ; retour : « Depuis la butte, la descente mène au Vieux Pont, puis un sentier de boue remonte la berge sud vers une cuvette de glaise rouge, environ deux heures. »
- vers `ald-vieux-pont` (la rampe de charrois, puis le sentier de boue, 1 h ✚) : description : « Depuis le fond, la rampe de l'est rejoint le sentier de la berge sud, qui file vers l'est par les vasières jusqu'au Vieux Pont, à une heure. » ; retour : « Depuis l'extrémité sud du pont, le sentier file vers l'ouest par les vasières, au bord de la berge sud, jusqu'à une excavation d'argile rouge, à une heure. »

**Champs dérivés**
- **resume** : une cuvette d'argile rouge, à gradins, où un campement de huttes s'abrite sous une falaise.
- **accroche** : « Au sud-ouest de la plaine, une excavation d'argile rouge s'ouvre entre des gradins de glaise ; au pied d'une falaise, un campement de huttes fume sous un surplomb. »
- **visuel** : Une cuvette d'argile rouge, large de quatre-vingts mètres, s'enfonce dans la plaine en quatre terrasses de glaise qui descendent du nord. Au centre-est du fond, une mare plate et rouillée reflète le ciel gris ; au sud, une falaise d'argile haute de douze mètres surplombe un campement de huttes d'écorce coiffées de bâches grises. Une lueur orange de feu de branchages brille sous le surplomb, sous un ciel bas et un crachin continu.
- **ambiance** : Glaise rouge, fumée de branchages, pluie.
- **description** : La Carrière d'Argile Rouge est une excavation de quatre-vingts mètres de large, creusée jusqu'à douze mètres sous la plaine. On y descend par les quatre terrasses du nord. Au pied des gradins, le passage entre la palissade de l'ouest et la fondrière de l'est, long de dix mètres, est barré par deux fosses camouflées sous des toiles de jute, côte à côte : quatre mètres de large, trois de profondeur, des pieux au fond. À l'ouest, une palissade de fascines ; à l'est, une fondrière de boue profonde, terrain difficile, permet de contourner le barrage. Au centre-est, une mare de rouille, profonde de soixante centimètres, s'étale sur une dizaine de mètres, avec deux carcasses de chariots à demi immergées. Le molosse Bave-de-Loup garde sa rive. À l'est, la rampe de charrois sort de la cuvette vers le Vieux Pont. Au pied de la falaise sud, à l'ouest, sept huttes d'écorce et de bâches usées forment le camp. Demi-Dent, chef gobelin (21 PV, CA 17, FP 1), se tient dans la plus grande hutte ; son profil lui donne un cimeterre (1d6 + 2 tranchant) et un arc court (1d6 + 2 perforant, 24/96 m). Quatre archers gobelins (10 PV, CA 15, FP 1/4) tirent derrière les fascines. Quand Demi-Dent tombe à 5 PV ou moins, il jette son arme et se rend : le groupe peut l'épargner ou l'exécuter. Une issue sans violence existe : négocier, intimider, accepter la reddition, ou contourner les fosses par la fondrière de l'est.
- **arrivee** : La piste de boue monte entre deux talus, puis le sol se dérobe d'un coup : vous voici au bord d'une cuvette d'argile rouge, large d'environ quatre-vingts mètres, qui descend en terrasses vers un fond plat. La glaise est écarlate, lisse et luisante sous le crachin, creusée de rigoles où l'eau coule en filets sombres. Au loin, au sud, une fumée de branchages monte au-dessus de petits toits de huttes, au pied d'une falaise d'argile haute de douze mètres, avec une lueur orange sous le surplomb. Au centre-est du fond, une mare plate et rouillée reflète le ciel gris, plus sombre que la terre. Une odeur d'argile mouillée, de fumée âcre et de graisse rance vous atteint. Des voix basses, étouffées par la pluie, montent du bas. Le vent ne descend pas jusqu'ici, et la pluie tombe droit dans la cuvette.

---

#### Niveau 3 : ald-carriere-gradins-d-argile (Gradins d'argile et accès supérieur, terrasses et rebord, approche et terrain), dans ald-carriere-d-argile

**Héritage** (recopié de la fiche de la carrière, niveau 2, sans changement) :
- **Dimensions et structure** : excavation d'argile rouge de quatre-vingts mètres de large, d'est en ouest, et d'environ soixante-quinze mètres du nord au sud, creusée jusqu'à douze mètres sous la plaine ; au nord, les gradins descendent du rebord en quatre terrasses de trois mètres ; au centre, un fond plat, large et humide ; à l'est, une rampe de charrois entaille la paroi ; au sud, une falaise d'argile de douze mètres dont le sommet déverse au-dessus d'un pied de paroi où s'abrite un camp de huttes.
- **Matériaux et état** : argile rouge écarlate, lisse et collante sous la pluie, craquelée et pâle au sommet des gradins ; glaise détrempée et par plaques au fond ; falaise sud striée de fentes et de coulées anciennes ; boue rouge sur toutes les pentes ; humidité qui suinte des fentes de la falaise.
- **Lumière** : grise et basse, tombée du ciel et reçue en plein par le rebord et les gradins ; le fond n'en reçoit qu'une part, et le pied de la falaise sud reste à l'ombre sous le surplomb ; aucune lampe dans la cuvette, sauf le feu du camp, orange, au pied de la falaise.
- **Sons** : pluie sur la glaise et les bâches ; ruissellement et écoulements de boue dans les gradins ; clapotis dans la mare ; craquements de branchages au camp ; voix basses et grognements au pied de la falaise.
- **Odeurs** : argile mouillée, fumée de branchages verts, rouille de la mare, graisse rance de viande grillée, suint de laine mouillée.
- **Température** : fraîche et humide ; l'air stagne au fond de la cuvette, où le crachin ne se disperse pas ; le pied de la falaise est plus froid, et la fumée du camp le réchauffe un peu.
- **Éléments remarquables** (chacun avec sa place) :
  - les gradins d'argile, au nord, quatre terrasses qui descendent du rebord vers le fond ;
  - la mare de rouille, au centre-est du fond, plate et sombre ;
  - la falaise d'argile, au sud, haute de douze mètres, dont le sommet déverse au-dessus du camp ;
  - le campement de huttes d'écorce, coiffées de bâches grises, au pied de la falaise, au sud-ouest ;
  - le feu de branchages du camp, au pied de la falaise, au sud-ouest : fumée qui monte sous le surplomb, lueur orange ;
  - la rampe de charrois, à l'est, qui remonte vers le rebord.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- le rebord nord, où la piste de boue débouche sur la glaise tassée, à l'extrémité nord-est de la cuvette ;
- la première terrasse, à trois mètres sous le rebord, bordée d'un talus de glaise sèche et craquelée ;
- une trace de sabot à demi effacée sur la première terrasse, près du talus, où la glaise a cédé d'un côté ;
- les trois terrasses suivantes, larges de six mètres, qui descendent vers le sud-ouest en marches irrégulières, marquées de rigoles.

**Issues** :
- vers `ald-carriere-perimetre-piege` (les gradins, une trentaine de mètres au sud-ouest) : description : « Les terrasses descendent vers le sud-ouest, marche après marche, jusqu'au pied de la glaise, à une trentaine de mètres. » ; retour : « Depuis le pied des gradins, le rebord se devine au nord-est, à une trentaine de mètres, au bout des terrasses de glaise rouge. »

**Contenu prévu** : aucun. Les gradins ne portent ni combat, ni trésor, ni piège ; le budget du point est placé en 5B, 5C et 5D. La glaise glissante est du terrain : une descente demande un jet de Dextérité (Acrobaties) DD 11 pour ne pas glisser.

**Avant / après** : aucun changement prévu par le canon à ce lieu ; les gradins restent en place.

**Un détail propre à ce lieu** : sur la première terrasse, une trace de sabot à demi effacée, large comme une main ; un cheval de trait a glissé ici et s'est relevé de travers.

**Champs dérivés**
- **resume** : des gradins de glaise rouge qui descendent du rebord vers une cuvette, glissants après la pluie.
- **accroche** : « Sur le rebord de la plaine, quatre terrasses de glaise rouge descendent vers une cuvette, glissantes sous la pluie, où un feu fume au pied d'une falaise. »
- **visuel** : Quatre terrasses de glaise rouge, larges de six mètres, descendent du rebord nord vers le fond de la cuvette ; une piste de boue débouche sur le rebord, à son extrémité nord-est. Les talus sont lisses et craquelés, et la pluie y trace des rigoles sombres. Au loin, au sud, une fumée et une lueur orange montent du pied de la falaise, où les toits des huttes se devinent, petits.
- **ambiance** : Glaise rouge, marches glissantes, pluie.
- **description** : Le rebord nord est l'accès principal de la carrière : la piste de boue du carrefour y débouche à l'extrémité nord-est, et quatre terrasses de glaise descendent de douze mètres vers le fond. Chaque terrasse fait environ trois mètres de haut et six de large, avec un talus lisse. Après la pluie, la glaise est un toboggan : descendre sans glisser demande un jet de Dextérité (Acrobaties) DD 11 ; un échec fait glisser sur une trentaine de mètres, jusqu'au pied, dans la boue, avec 1d4 de dégâts contondants. C'est du terrain, pas un piège. Le bas des gradins est à une trentaine de mètres du rebord. Au pied, le barrage du fond (toiles de jute, fosses, voir 5B) ne se remarque guère de haut : il se voit mieux en descendant.
- **arrivee** : Le chemin de boue débouche sur le rebord, et la cuvette s'ouvre devant vous d'un seul coup : quatre marches de glaise rouge descendent vers le sud-ouest, chacune large de six mètres, avec un talus lisse et craquelé au bord. La pluie trace des rigoles dans la terre, et la boue luit sous vos semelles. À votre droite, le rebord file vers le nord-ouest, nu et plat. Au loin, au sud, une fumée de branchages monte au-dessus de petits toits de huttes, au pied de la falaise, avec une lueur orange sous le surplomb ; plus près, au centre-est du fond, une mare rousse luit sous le crachin. Une odeur d'argile mouillée monte des terrasses, et des voix basses, étouffées par la pluie, viennent du bas. Une trace de sabot à demi effacée marque la première terrasse, où la glaise a cédé. La lumière grise tombe du ciel sur les gradins, mais le fond n'en reçoit qu'une part.

---

#### Niveau 3 : ald-carriere-perimetre-piege (Périmètre piégé, barrage de fosses, fascines et fondrière, piège et archers), dans ald-carriere-d-argile

**Héritage** (recopié de la fiche de la carrière, niveau 2, sans changement) :
- **Dimensions et structure** : excavation d'argile rouge de quatre-vingts mètres de large, d'est en ouest, et d'environ soixante-quinze mètres du nord au sud, creusée jusqu'à douze mètres sous la plaine ; au nord, les gradins descendent du rebord en quatre terrasses de trois mètres ; au centre, un fond plat, large et humide ; à l'est, une rampe de charrois entaille la paroi ; au sud, une falaise d'argile de douze mètres dont le sommet déverse au-dessus d'un pied de paroi où s'abrite un camp de huttes.
- **Matériaux et état** : argile rouge écarlate, lisse et collante sous la pluie, craquelée et pâle au sommet des gradins ; glaise détrempée et par plaques au fond ; falaise sud striée de fentes et de coulées anciennes ; boue rouge sur toutes les pentes ; humidité qui suinte des fentes de la falaise.
- **Lumière** : grise et basse, tombée du ciel et reçue en plein par le rebord et les gradins ; le fond n'en reçoit qu'une part, et le pied de la falaise sud reste à l'ombre sous le surplomb ; aucune lampe dans la cuvette, sauf le feu du camp, orange, au pied de la falaise.
- **Sons** : pluie sur la glaise et les bâches ; ruissellement et écoulements de boue dans les gradins ; clapotis dans la mare ; craquements de branchages au camp ; voix basses et grognements au pied de la falaise.
- **Odeurs** : argile mouillée, fumée de branchages verts, rouille de la mare, graisse rance de viande grillée, suint de laine mouillée.
- **Température** : fraîche et humide ; l'air stagne au fond de la cuvette, où le crachin ne se disperse pas ; le pied de la falaise est plus froid, et la fumée du camp le réchauffe un peu.
- **Éléments remarquables** (chacun avec sa place) :
  - les gradins d'argile, au nord, quatre terrasses qui descendent du rebord vers le fond ;
  - la mare de rouille, au centre-est du fond, plate et sombre ;
  - la falaise d'argile, au sud, haute de douze mètres, dont le sommet déverse au-dessus du camp ;
  - le campement de huttes d'écorce, coiffées de bâches grises, au pied de la falaise, au sud-ouest ;
  - le feu de branchages du camp, au pied de la falaise, au sud-ouest : fumée qui monte sous le surplomb, lueur orange ;
  - la rampe de charrois, à l'est, qui remonte vers le rebord.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- des toiles de jute étalées à sécher sur la glaise, saupoudrées d'argile sèche, sur les dix mètres du passage, au pied des gradins ;
- au centre de ces toiles, deux fosses camouflées, côte à côte, de quatre mètres de large chacune et séparées de deux mètres (voir la description) ;
- à l'ouest, une palissade de fascines, à hauteur d'épaule (environ 1,5 m), qui ferme le fond jusqu'à la paroi, et une fascine réparée avec un morceau de bâche grise cousu au fil de fer, le fil rouillé tranchant sur le branchage ;
- à l'est, sous le pied des gradins, la fondrière : une bande de boue profonde, longue d'une vingtaine de mètres, lisse et luisante, qui rejoint la mare ;
- le pied de la dernière terrasse, au nord, où les gradins finissent sur la glaise du fond.

**Issues** :
- vers `ald-carriere-gradins-d-argile` (les terrasses, une trentaine de mètres au nord-est) : description : « Les terrasses de glaise remontent vers le nord-est, marche après marche, jusqu'au rebord, à une trentaine de mètres. » ; retour : « Depuis le rebord, le pied des gradins se devine au sud-ouest, à une trentaine de mètres, où la glaise s'étale en plaques pâles. »
- vers `ald-carriere-fond-de-fosse-et-mare` (la mare, au sud-est) : description : « Au sud-est, la glaise du fond s'étend vers la mare, à une vingtaine de mètres, le long de la bande de boue. » ; retour : « Depuis la mare, le pied des gradins se devine au nord-ouest, à une vingtaine de mètres, au bout d'une glaise battue. »
- vers `ald-carriere-huttes-et-poste-de-commandement` (le camp, au sud-ouest) : description : « Vers le sud-ouest, le fond descend vers le camp, à quarante-cinq mètres, le long de la palissade de l'ouest. » ; retour : « Depuis le camp, le fond remonte vers le nord-est, à quarante-cinq mètres, jusqu'à la bande de toiles de jute. »

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| piège | deux fosses de quatre mètres de large et trois de profondeur, côte à côte et séparées de deux mètres, occupant les dix mètres du passage, garnies chacune de quatre pieux de chêne noircis au feu ; chute 2d6 perforants ; le barrage se contourne par la fondrière de l'est (terrain difficile, Dextérité DD 11 pour ne pas s'enliser) | le centre des toiles de jute, au pied des gradins | à créer | Perception passive DD 13 ou Investigation DD 11 (repérer la terre affaissée) ; Dextérité DD 13 pour se rattraper au bord |
| monstre (×2) | archers gobelins, premier temps du combat, derrière la palissade de fascines de l'ouest, tirant sur le barrage | la palissade de fascines | `combattant-gobelin` | combat ; Perception passive DD 12 pour les voir |

**Avant / après** : aucun changement prévu par le canon à ce lieu ; les fosses restent en place, une fois découvertes, sans se refermer.

**Un détail propre à ce lieu** : une fascine réparée avec un morceau de bâche grise, cousu au fil de fer ; le fil de fer rouillé tranche sur le branchage.

**Champs dérivés**
- **resume** : un fond de glaise couvert de toiles de jute, au pied des gradins, bordé de fascines à l'ouest et de boue à l'est.
- **accroche** : « Au pied des gradins, le fond se couvre de toiles de jute étalées à sécher, bordé à l'ouest de fascines et à l'est d'une bande de boue. »
- **visuel** : Au pied des gradins, des toiles de jute saupoudrées d'argile sèche sont étalées sur la glaise, sur les dix mètres du passage. À l'ouest, une palissade de fascines, haute d'environ un mètre et demi, ferme le fond ; à l'est, une bande de boue sombre s'étire sous les gradins. La lumière grise du ciel n'éclaire ce bas-fond qu'en partie.
- **ambiance** : Toile de jute, fascines, glaise sèche.
- **description** : Au pied des gradins, le passage entre la palissade de fascines de l'ouest et la fondrière de l'est, long de dix mètres, est barré. Deux fosses camouflées sous des toiles de jute saupoudrées d'argile sèche occupent tout ce passage, côte à côte et séparées de deux mètres : chacune mesure quatre mètres de large et trois de profondeur, et garde quatre pieux de chêne noircis au feu. Pour les repérer, il faut une Perception passive DD 13, ou une Investigation DD 11 qui fouille la terre. Une chute inflige 2d6 dégâts perforants ; un jet de Dextérité DD 13 permet de se rattraper au bord. À l'ouest, une palissade de fascines ferme le fond jusqu'à la paroi ; à l'est, une fondrière de boue profonde, longue d'une vingtaine de mètres, est un terrain difficile : chaque pas coûte le double, et un jet de Dextérité DD 11 évite de s'enliser. Le seul contournement passe donc par la fondrière. Deux archers gobelins (combattant-gobelin, 10 PV, CA 15, FP 1/4) tirent depuis derrière la palissade de l'ouest : leur cimeterre frappe à 1,50 m (1d6 + 2 tranchant), leur arc court à 24/96 m (1d6 + 2 perforant), et chacun peut se replier par une Fuite agile.
- **arrivee** : Les derniers pas de la pente vous posent sur une glaise un peu plus ferme, qui sonne sous le talon ; la descente vous a fait glisser, et vos bottes sont lourdes de rouge. Devant vous, le passage se couvre de toiles de jute étalées à sécher sur la terre, saupoudrées d'argile. Une palissade de fascines ferme le fond à l'ouest, et ses branchages tressés sentent la sève coupée ; elle est verte par endroits, brune ailleurs. À l'est, sous le pied des gradins, une bande de boue plus sombre s'étire, lisse et luisante. Une odeur de fumée et de terre remuée vous parvient du sud. La lumière grise du ciel n'atteint ce bas-fond qu'en partie, et le crachin mouille les toiles. Un bruit de bois qui craque retentit quelque part, puis retombe. Rien ne bouge entre les branchages.

---

#### Niveau 3 : ald-carriere-fond-de-fosse-et-mare (Fond de fosse, mare de rouille et rampe, molosse et sortie vers le pont), dans ald-carriere-d-argile

**Héritage** (recopié de la fiche de la carrière, niveau 2, sans changement) :
- **Dimensions et structure** : excavation d'argile rouge de quatre-vingts mètres de large, d'est en ouest, et d'environ soixante-quinze mètres du nord au sud, creusée jusqu'à douze mètres sous la plaine ; au nord, les gradins descendent du rebord en quatre terrasses de trois mètres ; au centre, un fond plat, large et humide ; à l'est, une rampe de charrois entaille la paroi ; au sud, une falaise d'argile de douze mètres dont le sommet déverse au-dessus d'un pied de paroi où s'abrite un camp de huttes.
- **Matériaux et état** : argile rouge écarlate, lisse et collante sous la pluie, craquelée et pâle au sommet des gradins ; glaise détrempée et par plaques au fond ; falaise sud striée de fentes et de coulées anciennes ; boue rouge sur toutes les pentes ; humidité qui suinte des fentes de la falaise.
- **Lumière** : grise et basse, tombée du ciel et reçue en plein par le rebord et les gradins ; le fond n'en reçoit qu'une part, et le pied de la falaise sud reste à l'ombre sous le surplomb ; aucune lampe dans la cuvette, sauf le feu du camp, orange, au pied de la falaise.
- **Sons** : pluie sur la glaise et les bâches ; ruissellement et écoulements de boue dans les gradins ; clapotis dans la mare ; craquements de branchages au camp ; voix basses et grognements au pied de la falaise.
- **Odeurs** : argile mouillée, fumée de branchages verts, rouille de la mare, graisse rance de viande grillée, suint de laine mouillée.
- **Température** : fraîche et humide ; l'air stagne au fond de la cuvette, où le crachin ne se disperse pas ; le pied de la falaise est plus froid, et la fumée du camp le réchauffe un peu.
- **Éléments remarquables** (chacun avec sa place) :
  - les gradins d'argile, au nord, quatre terrasses qui descendent du rebord vers le fond ;
  - la mare de rouille, au centre-est du fond, plate et sombre ;
  - la falaise d'argile, au sud, haute de douze mètres, dont le sommet déverse au-dessus du camp ;
  - le campement de huttes d'écorce, coiffées de bâches grises, au pied de la falaise, au sud-ouest ;
  - le feu de branchages du camp, au pied de la falaise, au sud-ouest : fumée qui monte sous le surplomb, lueur orange ;
  - la rampe de charrois, à l'est, qui remonte vers le rebord.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- la mare de rouille, au centre-est du fond : une dizaine de mètres sur douze, soixante centimètres de profondeur, eau rousse et brune, piquetée de gouttes de pluie ;
- deux carcasses de chariots pillés, à demi immergées sur la rive nord de la mare : roues sans jantes, ridelles brisées ;
- une bâche grise déchirée qui flotte près des carcasses ;
- une roue de chariot sans jante, couchée sur la rive nord, avec un fer à cheval cloué au moyeu en guise de bouton : le fer, au bord, est fendu ;
- trois ornières creusées jusqu'à la roche, qui traversent la glaise de la mare vers l'est ;
- la rive sud de la mare, une glaise battue où rôde le molosse ;
- la rampe de charrois, à l'est : une pente raide qui monte d'une douzaine de mètres vers le rebord, creusée de traces de roues.

**Issues** :
- vers `ald-carriere-perimetre-piege` (le barrage des fosses, au nord-ouest) : description : « Vers le nord-ouest, la glaise du fond remonte vers les toiles de jute, à une vingtaine de mètres, le long de la bande de boue. » ; retour : « Depuis les toiles de jute, la mare rousse se devine au sud-est, à une vingtaine de mètres, au bout de la glaise battue. »
- vers `ald-carriere-huttes-et-poste-de-commandement` (le camp, à l'ouest) : description : « Vers l'ouest-sud-ouest, la glaise battue traverse le fond jusqu'au camp, à quarante-deux mètres. » ; retour : « Depuis le camp, la mare rousse s'étale à l'est-nord-est, à quarante-deux mètres, au bout d'une glaise battue. »
- vers `ald-vieux-pont` (la rampe de charrois, puis le sentier de boue, 1 h ✚) : description : « La rampe de l'est rejoint le sentier de la berge sud, qui file vers l'est par les vasières jusqu'au Vieux Pont, à une heure. » ; retour : « Depuis le Vieux Pont, un sentier de boue file vers l'ouest au bord de la berge sud, puis remonte vers la rampe de l'excavation, à une heure de marche. »

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (×1) | Bave-de-Loup, molosse, deuxième temps du combat : il garde la rive sud, aboie et charge le premier qui traverse le fond ; sa morsure met à terre une cible de taille M ou moins | la rive sud de la mare, près des carcasses (5C) | `molosse` | combat ; Discrétion DD 12 pour le contourner sans l'éveiller |

**Avant / après** : aucun changement prévu par le canon à ce lieu ; la mare reste en place.

**Un détail propre à ce lieu** : une roue de chariot sans jante, couchée sur la rive nord, porte un fer à cheval cloué à son moyeu en guise de bouton ; le fer, au bord, se fend.

**Champs dérivés**
- **resume** : une mare rouillée au centre-est d'une cuvette, bordée au nord de carcasses de chariots, avec une rampe qui remonte vers l'est.
- **accroche** : « Au centre-est de la cuvette, une mare rouillée s'étale, bordée au nord de carcasses de chariots, et une rampe monte vers l'est. »
- **visuel** : Une mare plate, rousse et brune, s'étend au centre-est de la cuvette, sur une dizaine de mètres, sous un ciel gris qui s'y reflète. Sur sa rive nord, deux carcasses de chariots s'enfoncent à demi, roues sans jantes et ridelles brisées ; une bâche grise déchirée flotte près d'elles. À l'est, une rampe de charrois raide remonte vers le rebord, creusée de traces de roues.
- **ambiance** : Rouille, eau stagnante, bois pourri.
- **description** : Le fond de la cuvette est une glaise battue, humide, où la mare de rouille occupe le centre-est : soixante centimètres de profondeur au plus, sur une dizaine de mètres par douze. L'eau est rousse et brune, piquetée par la pluie ; deux carcasses de chariots pillés y sont à demi immergées, roues sans jantes et ridelles brisées, et une bâche grise déchirée flotte près d'elles. Le molosse Bave-de-Loup (5 PV, CA 12, FP 1/8) garde la rive sud : sa morsure fait 1d6 + 1 perforant (+3 pour toucher), et une cible de taille M ou moins tombe à terre. Il aboie et charge le premier qui traverse le fond, et le camp l'entend. Le contourner en longeant la rive nord demande un jet de Discrétion DD 12. À l'est, la rampe de charrois, raide et creusée d'ornières, remonte d'une douzaine de mètres vers le rebord ; de là, un sentier de boue longe la berge sud de la Noire-Eau jusqu'au Vieux Pont, à une heure de marche. Une roue couchée sur la rive nord porte un fer à cheval cloué à son moyeu : le fer se fend au moindre choc, comme les armes du groupe dans cette zone.
- **arrivee** : Le fond de la cuvette est plus humide, et la glaise rouge se change en boue à chaque pas. Au centre-est, une mare s'étale sur une dizaine de mètres, couleur de vieille rouille, piquetée de gouttes de pluie qui brisent le reflet du ciel gris. Au nord de la mare, deux carcasses de chariots s'enfoncent à demi dans l'eau : roues sans jantes, ridelles cassées, et une bâche grise déchirée qui flotte près d'elles. Une roue couchée sur la berge porte un fer à cheval cloué à son moyeu, et le fer, au bord, est fendu. L'odeur est âcre : rouille, eau morte, bois pourri, argile mouillée par-dessus. Trois ornières, creusées jusqu'à la roche, traversent la glaise vers l'est. Un clapotis léger sur les bords, puis plus rien. La lumière grise vient du ciel et se réfléchit sur l'eau, plus claire que la boue. Plus loin, vers l'ouest-sud-ouest, des braises de feu de branchages luisent sous la falaise, et tout reste silencieux au bord de la mare.

---

#### Niveau 3 : ald-carriere-huttes-et-poste-de-commandement (Campement de huttes et poste de commandement, pied de la falaise, combat, reddition et trésor), dans ald-carriere-d-argile

**Héritage** (recopié de la fiche de la carrière, niveau 2, sans changement) :
- **Dimensions et structure** : excavation d'argile rouge de quatre-vingts mètres de large, d'est en ouest, et d'environ soixante-quinze mètres du nord au sud, creusée jusqu'à douze mètres sous la plaine ; au nord, les gradins descendent du rebord en quatre terrasses de trois mètres ; au centre, un fond plat, large et humide ; à l'est, une rampe de charrois entaille la paroi ; au sud, une falaise d'argile de douze mètres dont le sommet déverse au-dessus d'un pied de paroi où s'abrite un camp de huttes.
- **Matériaux et état** : argile rouge écarlate, lisse et collante sous la pluie, craquelée et pâle au sommet des gradins ; glaise détrempée et par plaques au fond ; falaise sud striée de fentes et de coulées anciennes ; boue rouge sur toutes les pentes ; humidité qui suinte des fentes de la falaise.
- **Lumière** : grise et basse, tombée du ciel et reçue en plein par le rebord et les gradins ; le fond n'en reçoit qu'une part, et le pied de la falaise sud reste à l'ombre sous le surplomb ; aucune lampe dans la cuvette, sauf le feu du camp, orange, au pied de la falaise.
- **Sons** : pluie sur la glaise et les bâches ; ruissellement et écoulements de boue dans les gradins ; clapotis dans la mare ; craquements de branchages au camp ; voix basses et grognements au pied de la falaise.
- **Odeurs** : argile mouillée, fumée de branchages verts, rouille de la mare, graisse rance de viande grillée, suint de laine mouillée.
- **Température** : fraîche et humide ; l'air stagne au fond de la cuvette, où le crachin ne se disperse pas ; le pied de la falaise est plus froid, et la fumée du camp le réchauffe un peu.
- **Éléments remarquables** (chacun avec sa place) :
  - les gradins d'argile, au nord, quatre terrasses qui descendent du rebord vers le fond ;
  - la mare de rouille, au centre-est du fond, plate et sombre ;
  - la falaise d'argile, au sud, haute de douze mètres, dont le sommet déverse au-dessus du camp ;
  - le campement de huttes d'écorce, coiffées de bâches grises, au pied de la falaise, au sud-ouest ;
  - le feu de branchages du camp, au pied de la falaise, au sud-ouest : fumée qui monte sous le surplomb, lueur orange ;
  - la rampe de charrois, à l'est, qui remonte vers le rebord.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- sept huttes d'écorce, coiffées de bâches grises usées, serrées sous le surplomb de la falaise : la plus grande au centre-ouest du réduit, les autres en demi-cercle à l'est et au sud ;
- la plus grande hutte, au centre-ouest, reconnaissable à son poteau de devant, planté de travers (poste de commandement) ;
- le coffre de Demi-Dent, en bois de fer cerclé d'acier, cadenassé, au fond de la plus grande hutte ;
- le feu de branchages verts, au centre du réduit, dont la fumée monte droit sous le surplomb ;
- devant la plus grande hutte, une bande de boue piétinée, où le camp va et vient ;
- la palissade de fascines, à hauteur d'épaule (environ 1,5 m), qui ferme le réduit au nord et à l'est, avec deux portillons de fascines : un au nord-est, vers le barrage de 5B, un à l'est, vers la mare, par où arrive la rampe de charrois ;
- sur la falaise, au-dessus du camp, une cheville de bois portant un bout de corde, et une seconde cheville, plus bas, arrachée.

**Issues** :
- vers `ald-carriere-perimetre-piege` (le barrage, par le portillon nord-est) : description : « Vers le nord-est, le fond remonte entre les fascines, par le portillon, jusqu'à la bande de toiles de jute, à quarante-cinq mètres. » ; retour : « Depuis la bande de toiles, le camp se devine vers le sud-ouest, en contrebas, à quarante-cinq mètres, derrière les fascines. »
- vers `ald-carriere-fond-de-fosse-et-mare` (la mare, par le portillon est) : description : « Vers l'est-nord-est, la glaise battue traverse le fond par le portillon, jusqu'à la mare rousse, à quarante-deux mètres. » ; retour : « Depuis la mare, les huttes se devinent à l'ouest-sud-ouest, au pied de la falaise, derrière les fascines, à quarante-deux mètres. »

**Contenu prévu** :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| monstre (chef) | Demi-Dent, dans la plus grande hutte, troisième temps du combat ; cimeterre (1d6 + 2 tranchant, allonge 1,50 m) et arc court (1d6 + 2 perforant, 24/96 m), deux attaques par tour | la plus grande hutte (5D) | `chef-gobelin` | combat |
| monstre (×2) | archers gobelins, troisième temps du combat, derrière la palissade de fascines du réduit, nord et est | les fascines du réduit | `combattant-gobelin` | combat ; Perception passive DD 12 |
| rencontre sans combat | reddition de Demi-Dent à 5 PV ou moins : il jette son arme et se rend ; l'épargner ou l'exécuter | la masse tombée dans la glaise, devant la plus grande hutte | à créer | dilemme de zone (lumière : épargner ; ombre : l'exécuter) ; seuil de 5 PV |
| PNJ | Demi-Dent, avec sa fiche et ses dialogues de reddition | la plus grande hutte (5D) | `demi-dent` | rencontre (reddition) |
| trésor (C7) | coffre blindé : 75 po, 120 pa, une potion de soins, un miroir de poche en argent (25 po), le `registre-de-convoi` (sceau du Lion d'Acier, signature de Vane), les `bottes-de-saut-du-gobelin` | le coffre, au fond de la plus grande hutte | à créer (C7) | Crochetage DD 12 ; Force DD 16 (fracas qui alerte le camp) ; impossible sans combat tant que le chef et ses gardes vivent |

**Avant / après** : aucun changement de décor après la reddition ou la mort de Demi-Dent ; le drapeau `z1-demi-dent-epargne` ou `z1-demi-dent-tue`, posé par le dilemme, n'altère pas les huttes.

**Un détail propre à ce lieu** : un crâne de poney, peint de bandes d'argile rouge, est suspendu au poteau de la plus grande hutte.

**Champs dérivés**
- **resume** : un campement de huttes d'écorce serrées sous une falaise, autour d'un feu de branchages.
- **accroche** : « Sous le surplomb d'une falaise d'argile, un campement de huttes d'écorce serrées autour d'un feu de branchages fume au pied de la glaise. »
- **visuel** : Sept huttes d'écorce, coiffées de bâches grises usées, se serrent sous le surplomb d'une falaise d'argile haute de douze mètres, au sud-ouest de la cuvette. Un feu de branchages verts brûle au centre du réduit, et une palissade de fascines le ferme au nord et à l'est. La fumée du feu monte droit sous la falaise, là où le surplomb la retient.
- **ambiance** : Fumée, écorce, bâches, graisse rance.
- **description** : Le réduit occupe le pied de la falaise sud, dans son angle ouest : sept huttes d'écorce, une palissade de fascines au nord et à l'est, un feu de branchages au centre. La plus grande hutte est le poste de commandement de Demi-Dent, chef gobelin (21 PV, CA 17, FP 1). Il se bat au cimeterre ou à l'arc court, deux attaques par tour. Deux archers gobelins (10 PV, CA 15, FP 1/4) tiennent la palissade, au nord et à l'est ; deux autres tirent depuis le barrage de 5B. Quand Demi-Dent tombe à 5 PV ou moins, il jette son arme et se rend : c'est un dilemme de zone, l'épargner ou l'exécuter. Au fond de la plus grande hutte se trouve un coffre au contenu précieux, qui ne s'ouvre pas tant que le chef et ses gardes vivent ; crochetage DD 12, ou Force DD 16, qui fait un fracas et alerte le camp. Les deux portillons, au nord-est (vers 5B) et à l'est (vers la mare, 5C), sont les seules ouvertures du réduit.
- **arrivee** : Le réduit s'ouvre au pied de la falaise, et le froid de la glaise s'adoucit : une chaleur de fumée et de bois vert monte de la terre. Sept huttes d'écorce se serrent contre la paroi, coiffées de bâches grises usées et tendues sur des branches. Au centre, un feu de branchages verts brûle sans flamme haute, et sa fumée monte droit sous le surplomb, où elle s'étale en nappe. Un peu à l'ouest, la plus grande hutte se reconnaît à son poteau de devant, planté de travers, et à une bande de boue piétinée. Une palissade de fascines, tressée de branchages et haute d'environ un mètre et demi, ferme le réduit au nord et à l'est. L'odeur de graisse rance de viande grillée est forte, mêlée à celle de l'écorce humide et de la suie. Des voix basses et des craquements de branchages montent du camp. Le surplomb couvre les huttes, et la pluie goutte à sa lisière. Rien ne bouge encore entre les huttes.

---

> **Niveau 2 et 3 : ald-tertre-des-sept-lances, validé par l'utilisateur le 11/11/2026 (V5). Gelé : tout changement demande un nouveau oui.** Rédigée par un agent Haiku, vérifiée par Sonnet 5.5 (deux passes), arbitrée par Claude.

### Niveau 2 : ald-tertre-des-sept-lances (Le Tertre des Sept-Lances, cercle de menhirs et crypte, moyenne), dans ald-carrefour-d-aldric

**Héritage** (extrait du niveau 1 de la zone, ne pas modifier) :
- Matériaux : ardoise noire et schiste ; grès gris et granit gris ; chêne noirci de suie et de pluie ; fer rouillé ou friable ; tourbe et vase.
- Couleurs : gris ardoise, brun bistre, rouille, vert de mousse, noir de suie, orange de forge.
- Formes : auberges-forteresses à palissade et volets ferrés ; ateliers et fonderies ; tours d'obsidienne.
- Lumière, météo : basse et grise, orange des forges ; crachin d'automne, brouillard humide.

**Héritage physique** (fiche de ce niveau, recopiée sans changement dans chacun de ses sous-lieux) :
- **Dimensions et structure** : butte conique et rase, couronnée d'un cercle de sept menhirs de 3,5 m sur une ligne d'environ vingt mètres de diamètre ; au centre du cercle, une dalle de grès d'environ 400 kg, glissée de 80 cm, découvre une trouée et un escalier de 18 marches large de 80 cm, qui descend à 5 m sous terre sur environ cinq mètres de longueur ; une antichambre voûtée de 4 m sur 3 au pied de l'escalier ; une crypte voûtée en berceau de 6 m sur 5, au bout de l'antichambre, avec six niches murales et une cuve de grès au centre.
- **Matériaux et état** : granit noir brut des menhirs, sans mousse, inclinés de quinze degrés vers le centre ; pelouse rase et calcinée qui couvre la butte ; grès gris de la dalle, à la cassure brune ; grès des marches, des parois et de la cuve ; pierre taillée humide sous terre, sol de dalles usées ; urnes d'argile brisées dans les niches ; couvercle et cuve de grès.
- **Lumière** : au-dessus de la butte, ciel bas et gris, sans ombre ; sous la trouée, la lueur grise du ciel descend les premières marches et s'affaiblit ; l'antichambre reste en pénombre, la crypte dans l'obscurité complète. Aucune lampe ni torche sur place : le groupe apporte sa lumière.
- **Sons** : vent régulier qui siffle entre les menhirs ; silence des landes ; sous terre, silence et écho : chaque pas résonne sous la voûte, et une goutte d'eau tombe au fond de l'escalier.
- **Odeurs** : herbe calcinée et cendre froide sur la butte ; pierre mouillée et poussière de calcaire sous terre ; cendre éteinte dans la crypte.
- **Température** : froide et venteuse sur la butte ; fraîche et humide à la descente, glacée au fond de la crypte.
- **Éléments remarquables** (chacun avec sa place) :
  - le cercle des sept menhirs de granit noir, sur la crête de la butte, inclinés vers le centre ;
  - la pelouse rase et calcinée qui couvre la butte, sans une mauvaise herbe ;
  - la dalle de grès glissée de 80 cm, au centre du cercle, et la trouée qu'elle découvre ;
  - l'escalier de 18 marches qui descend droit sous la trouée, à 5 m sous terre ;
  - l'antichambre voûtée, au pied de l'escalier, au sud du centre ;
  - la crypte voûtée en berceau, au sud de l'antichambre, avec ses six niches murales et la cuve de grès au centre ;
  - les trois niches basses, au ras du sol, dans le mur ouest de la crypte, fermées par des dalles de pierre.

**Nuances propres** : granit noir des menhirs (déjà au niveau 1), pelouse calcinée, grès de la dalle, des marches, des parois et de la cuve, urnes d'argile brisées dans les niches, pierres sèches et moellons du muret, poussière de calcaire et cendre sous terre, éclats d'argile grise du trou carré, chaîne de fer rouillée, contrepoids de pierre et javelines rouillées du piège, cuivre du cerclage du bouclier, grenats du torque, bronze et électrum du trésor (6D). Ces matières tiennent à une tombe très ancienne, d'avant le royaume.

**Plan vu de dessus** (positions en % du plan ; nord en haut ; 100 % en largeur comme en hauteur ≈ 40 m) : le cercle des menhirs, de vingt mètres de diamètre, occupe la moitié de la largeur du plan, son centre vers (50, 50). La piste de boue arrive du nord-ouest et rejoint le cercle par l'intervalle nord-ouest, vers (32, 36). L'escalier, long d'environ cinq mètres, descend droit vers le sud depuis la dalle : antichambre vers (50, 66), crypte vers (50, 77).

**Issues** (où elles mènent, aspect vu de chaque côté) :
- vers `ald-auberge-de-bregor` (environ 2 h ✚, par les landes de l'est et la piste de boue) : description : « La piste de boue descend vers le nord-ouest, à travers les landes, vers la butte de l'auberge, à environ deux heures de marche. » (23 mots) ; retour : « Depuis le perron de l'auberge, vers le sud-est, on devine la colline rase sur les landes, à demi noyée dans le crachin. » (22 mots)

**Contenu prévu** (un emplacement par entité ; au lieu le plus précis) : aucune entité au niveau 2. Les quatre emplacements du tertre sont dans les sous-lieux 6A à 6D : une rencontre sans combat, un combat évitable, un piège et un trésor.

**Avant / après** : aucun changement prévu par le canon à ce niveau ; la dalle reste glissée et les menhirs restent debout.

**Un détail propre à ce lieu** : la face intérieure de chacun des sept menhirs porte, à hauteur d'épaule, une croix de tailleur creusée dans le granit ; celle du menhir sud est reprise à la pointe, et ses bords sont clairs.

**Intérieur** (ce point contient quatre sous-lieux) :
- plan intérieur : l'entrée se fait par l'intervalle nord-ouest du cercle. Au centre, la dalle glissée découvre une trouée ; l'escalier descend droit sous elle, vers le sud, jusqu'à l'antichambre, puis la crypte. Tout ce qui est sous la butte se parcourt donc en ligne droite, depuis le cercle.
- sous-lieux (chacun aura sa fiche « Niveau 3 », même modèle, héritage = cette fiche) :

  | id | nom | type | fonction dramatique | position | ce qui l'annonce depuis ce lieu | voisins directs |
  | --- | --- | --- | --- | --- | --- | --- |
  | `ald-tertre-cercle` | Tumulus et cercle des menhirs (6A) | cercle de menhirs, à l'air libre | rencontre sans combat, examen | (50, 40) | les sept pierres noires dressées sur la crête, visibles dès la piste | piste (intervalle nord-ouest) ; dalle (6B) |
  | `ald-tertre-dalle-et-escalier` | Dalle et escalier (6B) | trouée et escalier de pierre | secret | (50, 50) | la dalle de grès glissée au centre du cercle, et le trou noir qu'elle découvre | cercle (6A) ; antichambre (6C) |
  | `ald-tertre-antichambre` | Antichambre voûtée (6C) | antichambre basse, en pénombre | piège | (50, 66) | un souffle froid et une lueur grise qui s'affaiblit en descendant | escalier (6B) ; crypte (6D) |
  | `ald-tertre-sarcophage` | Crypte du sarcophage (6D) | crypte voûtée, niches d'urnes | combat, trésor | (50, 77) | une odeur de cendre froide et de poussière qui monte du boyau | antichambre (6C) |

**Champs dérivés**
- **resume** : une colline rase couronnée de sept pierres noires, où une dalle glissée laisse voir un escalier vers le sous-sol.
- **accroche** : « Au sud-est de la plaine, une colline rase porte sept pierres noires penchées vers son centre, comme des lances fichées dans la terre. » (23 mots)
- **visuel** : Une butte conique couverte d'une pelouse rase et calcinée, d'un gris presque noir, sous un ciel bas. Sept menhirs de granit noir, hauts de trois mètres et demi, se dressent en cercle sur la crête, inclinés vers le centre. Au milieu du cercle, une lourde dalle de grès a glissé de côté et laisse voir un trou noir.
- **ambiance** : Vent sur la pierre, herbe brûlée, silence.
- **description** : Le Tertre des Sept-Lances est une butte conique et rase, à environ deux heures de marche de l'auberge par la piste de boue. Son sommet porte un cercle de sept menhirs de granit noir, hauts de trois mètres et demi, inclinés de quinze degrés vers le centre, sur une ligne d'environ vingt mètres de diamètre. La pelouse qui couvre la butte est calcinée et rase. Au centre du cercle, une dalle de grès d'environ quatre cents kilos a été fracturée et glissée de quatre-vingts centimètres ; sous elle, une trouée donne sur un escalier de dix-huit marches, qui descend droit, dans l'axe, à cinq mètres sous terre. Au pied de l'escalier, une antichambre basse ouvre sur une crypte voûtée de six mètres sur cinq, aux six niches d'urnes brisées, avec la cuve de grès au centre. Le piège est au pied de la dernière marche ; les gardiens sont dans la crypte, et le respect se gagne au sarcophage, par un serment ou une offrande. De nuit, trois squelettes sentinelles sont assis près d'un muret, au nord-est du cercle.
- **arrivee** : La piste de boue monte doucement depuis les landes, puis la pente se dégage et la butte apparaît, nue, au-dessus de la plaine. Sa pelouse est rase et grise, comme brûlée jusqu'à la racine, et pas une herbe ne dépasse. Au sommet, sept pierres noires se dressent en cercle, hautes de trois mètres et demi, toutes penchées vers le centre comme des lances fichées dans la terre. Vos bottes, enfoncées dans la boue de la pente, peinent à se dégager à chaque pas. Le vent siffle entre les pierres, et l'air sent la cendre froide. Au milieu du cercle, une lourde dalle de grès a glissé de côté et laisse voir un trou noir. De loin, la butte semble vide, et l'on ne voit d'abord que le cercle dressé contre le ciel. Le ciel reste bas et gris, sans un oiseau.

---

#### Niveau 3 : ald-tertre-cercle (Tumulus et cercle des menhirs, à l'air libre, rencontre et examen), dans ald-tertre-des-sept-lances

**Héritage** (recopié du niveau 2, sans changement) :
- **Dimensions et structure** : butte conique et rase, couronnée d'un cercle de sept menhirs de 3,5 m sur une ligne d'environ vingt mètres de diamètre ; au centre du cercle, une dalle de grès d'environ 400 kg, glissée de 80 cm, découvre une trouée et un escalier de 18 marches large de 80 cm, qui descend à 5 m sous terre sur environ cinq mètres de longueur ; une antichambre voûtée de 4 m sur 3 au pied de l'escalier ; une crypte voûtée en berceau de 6 m sur 5, au bout de l'antichambre, avec six niches murales et une cuve de grès au centre.
- **Matériaux et état** : granit noir brut des menhirs, sans mousse, inclinés de quinze degrés vers le centre ; pelouse rase et calcinée qui couvre la butte ; grès gris de la dalle, à la cassure brune ; grès des marches, des parois et de la cuve ; pierre taillée humide sous terre, sol de dalles usées ; urnes d'argile brisées dans les niches ; couvercle et cuve de grès.
- **Lumière** : au-dessus de la butte, ciel bas et gris, sans ombre ; sous la trouée, la lueur grise du ciel descend les premières marches et s'affaiblit ; l'antichambre reste en pénombre, la crypte dans l'obscurité complète. Aucune lampe ni torche sur place : le groupe apporte sa lumière.
- **Sons** : vent régulier qui siffle entre les menhirs ; silence des landes ; sous terre, silence et écho : chaque pas résonne sous la voûte, et une goutte d'eau tombe au fond de l'escalier.
- **Odeurs** : herbe calcinée et cendre froide sur la butte ; pierre mouillée et poussière de calcaire sous terre ; cendre éteinte dans la crypte.
- **Température** : froide et venteuse sur la butte ; fraîche et humide à la descente, glacée au fond de la crypte.
- **Éléments remarquables** (chacun avec sa place) :
  - le cercle des sept menhirs de granit noir, sur la crête de la butte, inclinés vers le centre ;
  - la pelouse rase et calcinée qui couvre la butte, sans une mauvaise herbe ;
  - la dalle de grès glissée de 80 cm, au centre du cercle, et la trouée qu'elle découvre ;
  - l'escalier de 18 marches qui descend droit sous la trouée, à 5 m sous terre ;
  - l'antichambre voûtée, au pied de l'escalier, au sud du centre ;
  - la crypte voûtée en berceau, au sud de l'antichambre, avec ses six niches murales et la cuve de grès au centre ;
  - les trois niches basses, au ras du sol, dans le mur ouest de la crypte, fermées par des dalles de pierre.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- la gravure du menhir sud-est, face à l'entrée, à hauteur d'homme : un guerrier qui terrasse une chimère de brume avec une épée de bronze éclatante ;
- l'inscription courte, gravée sous cette scène sur le menhir sud-est, à hauteur d'homme ;
- les croix de tailleur creusées dans la face intérieure des sept menhirs, à hauteur d'épaule ; celle du menhir sud est reprise à la pointe ;
- le trou carré creusé dans le socle du menhir nord, à ras du sol, rempli de cendre froide et d'éclats d'argile grise ;
- le muret de pierres sèches, effondré, à dix pas au nord-est du cercle ;
- l'intervalle nord-ouest, large d'une dizaine de pas, entre le menhir nord et le menhir ouest, où commence la piste ;
- au centre, la dalle glissée (décrite au sous-lieu 6B).

**Issues** :
- vers `ald-tertre-dalle-et-escalier` : description : « Au centre du cercle, la dalle de grès glissée laisse voir une trouée, et les premières marches d'un escalier qui descend dans la pierre. » (24 mots) ; retour : « Depuis la trouée, le cercle des menhirs se voit en plein ciel, avec sa pelouse brûlée et l'intervalle nord-ouest par où l'on est venu. » (23 mots)
- vers `ald-auberge-de-bregor` (hors du tertre, par la piste de boue, environ 2 h) : description : « L'intervalle nord-ouest ouvre sur la piste de boue, qui descend à travers les landes vers la butte de l'auberge. » (21 mots) ; retour : « Depuis la piste, au nord-ouest, le cercle des sept pierres noires ferme la crête et se détache sur le ciel gris. » (20 mots)

**Contenu prévu** (un emplacement par entité ; au lieu le plus précis) :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| rencontre sans combat (monstre au repos, de nuit seulement) | trois squelettes sentinelles de nuit, assis en rond, immobiles et aux aguets ; ils ne combattent pas si l'on les laisse à leur pause ; une fiole d'huile les fait cliqueter de contentement | le muret de pierres sèches effondré, au nord-est, de minuit à l'aube | `squelette` (sans fiche de PNJ) | Perception DD 10 (les voir de nuit) ; aucun test pour les laisser en paix |

**Avant / après** (canon : les squelettes ne sont là que la nuit) : de minuit à l'aube, les trois squelettes sentinelles sont assis derrière le muret ; de jour, le muret est vide et le cercle n'a que ses pierres.

**Un détail propre à ce lieu** : un trou carré creusé dans le socle du menhir nord, à ras du sol, rempli de cendre froide et d'éclats d'argile grise, comme un foyer d'offrandes que personne n'a rallumé.

**Champs dérivés**
- **resume** : un cercle de sept menhirs sur une butte rase, couvert de gravures anciennes et d'un muret écroulé.
- **accroche** : « Au sommet de la butte, sept pierres noires se dressent en cercle, inclinées vers le centre ; au milieu, une dalle glissée laisse voir un trou. » (25 mots)
- **visuel** : Un cercle de sept menhirs de granit noir brut, hauts de trois mètres et demi, se dresse sur une pelouse rase et calcinée. Les pierres penchent toutes vers le centre, où une lourde dalle de grès a glissé de côté. Sur le menhir sud-est, à hauteur d'homme, des gravures pâles se détachent sur le granit, sous un ciel bas et gris.
- **ambiance** : Vent entre les menhirs, cendre froide, silence.
- **description** : Le cercle est le premier lieu que le groupe voit de près : sept menhirs de granit noir brut, inclinés de quinze degrés vers le centre, qui ferment la butte sur une vingtaine de mètres de diamètre. L'entrée se fait par l'intervalle nord-ouest, large d'une dizaine de pas, entre le menhir nord et le menhir ouest. Sur le menhir sud-est, face à l'entrée, des gravures d'avant le royaume représentent, à hauteur d'homme, un guerrier qui terrasse une chimère de brume avec une épée de bronze éclatante. Juste au-dessous, une inscription courte se déchiffre à l'examen (Histoire DD 12, ou Arcanes DD 11) : « Ci-gît Aethelgard, marteau des ombres. Seul le bronze forgé sous l'étoile ne cède point devant la pourriture du ver. » Elle annonce l'immunité de la lame de bronze à la fonte friable, que la crypte permettra de vérifier. Au pied du menhir nord, un trou carré à ras du sol contient de la cendre froide. Le muret de pierres sèches, au nord-est, est effondré. De nuit, entre minuit et l'aube, trois squelettes sentinelles sont assis derrière lui, immobiles, la tête basse et aux aguets ; ils ne combattent pas si l'on passe son chemin. Quand une éclaircie perce les nuages, quelques nuits, une pâle clarté de lune éclaire le cercle ; sous un ciel couvert, il fait presque noir. La dalle glissée est décrite au sous-lieu 6B.
- **arrivee** : Vous franchissez l'intervalle entre deux pierres et entrez dans le cercle. Ici, le vent siffle entre les pierres, et le silence des landes semble se refermer sur vous. Les sept menhirs de granit noir brut se dressent tout autour, sans mousse, et leur inclinaison vers le centre donne l'impression d'être observé de toutes parts. Au milieu, la dalle de grès a glissé de côté et laisse voir un trou noir, d'où monte un air froid qui sent la cendre et la pierre humide. Sur la pelouse brûlée, rien ne pousse. Vos pas font craquer une cendre sèche sous l'herbe, et le froid du lieu vous saisit aussitôt. La lumière est plate, grise, sans une ombre. Sur le menhir qui fait face à l'entrée, à hauteur d'homme, quelque chose de pâle attire le regard : des traits gravés dans la pierre, à demi effacés par la pluie.

---

#### Niveau 3 : ald-tertre-dalle-et-escalier (Dalle et escalier, trouée et boyau, secret), dans ald-tertre-des-sept-lances

**Héritage** (recopié du niveau 2, sans changement) :
- **Dimensions et structure** : butte conique et rase, couronnée d'un cercle de sept menhirs de 3,5 m sur une ligne d'environ vingt mètres de diamètre ; au centre du cercle, une dalle de grès d'environ 400 kg, glissée de 80 cm, découvre une trouée et un escalier de 18 marches large de 80 cm, qui descend à 5 m sous terre sur environ cinq mètres de longueur ; une antichambre voûtée de 4 m sur 3 au pied de l'escalier ; une crypte voûtée en berceau de 6 m sur 5, au bout de l'antichambre, avec six niches murales et une cuve de grès au centre.
- **Matériaux et état** : granit noir brut des menhirs, sans mousse, inclinés de quinze degrés vers le centre ; pelouse rase et calcinée qui couvre la butte ; grès gris de la dalle, à la cassure brune ; grès des marches, des parois et de la cuve ; pierre taillée humide sous terre, sol de dalles usées ; urnes d'argile brisées dans les niches ; couvercle et cuve de grès.
- **Lumière** : au-dessus de la butte, ciel bas et gris, sans ombre ; sous la trouée, la lueur grise du ciel descend les premières marches et s'affaiblit ; l'antichambre reste en pénombre, la crypte dans l'obscurité complète. Aucune lampe ni torche sur place : le groupe apporte sa lumière.
- **Sons** : vent régulier qui siffle entre les menhirs ; silence des landes ; sous terre, silence et écho : chaque pas résonne sous la voûte, et une goutte d'eau tombe au fond de l'escalier.
- **Odeurs** : herbe calcinée et cendre froide sur la butte ; pierre mouillée et poussière de calcaire sous terre ; cendre éteinte dans la crypte.
- **Température** : froide et venteuse sur la butte ; fraîche et humide à la descente, glacée au fond de la crypte.
- **Éléments remarquables** (chacun avec sa place) :
  - le cercle des sept menhirs de granit noir, sur la crête de la butte, inclinés vers le centre ;
  - la pelouse rase et calcinée qui couvre la butte, sans une mauvaise herbe ;
  - la dalle de grès glissée de 80 cm, au centre du cercle, et la trouée qu'elle découvre ;
  - l'escalier de 18 marches qui descend droit sous la trouée, à 5 m sous terre ;
  - l'antichambre voûtée, au pied de l'escalier, au sud du centre ;
  - la crypte voûtée en berceau, au sud de l'antichambre, avec ses six niches murales et la cuve de grès au centre ;
  - les trois niches basses, au ras du sol, dans le mur ouest de la crypte, fermées par des dalles de pierre.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- la dalle de grès glissée de 80 cm vers la droite (sud-ouest) de qui entre par le nord-ouest, la cassure brune tournée vers la trouée ;
- la trouée, passage de 80 cm de large au centre du cercle, sous le bord de la dalle ;
- l'escalier de 18 marches de pierre taillée, large de 80 cm, dans l'axe du centre, sur environ cinq mètres de longueur ; la neuvième marche est fendue en deux ;
- les parois de grès de l'escalier, suintantes, au niveau des épaules ;
- une fine poussière blanche dans les rainures du bord de la trouée.

**Issues** :
- vers `ald-tertre-cercle` : description : « Par la trouée, on remonte à la lumière grise du ciel, puis au cercle des menhirs et à sa pelouse brûlée. » (20 mots) ; retour : « Depuis le cercle, la trouée s'ouvre au centre, à côté du bord de la dalle, et un souffle froid en monte. » (20 mots)
- vers `ald-tertre-antichambre` : description : « L'escalier descend droit dans l'axe, dix-huit marches, jusqu'à une antichambre voûtée cinq mètres plus bas. » (19 mots) ; retour : « L'escalier remonte dix-huit marches, de plus en plus clair vers le haut, jusqu'à la trouée sous la dalle glissée. » (19 mots)

**Contenu prévu** (un emplacement par entité ; au lieu le plus précis) : aucune entité dans ce sous-lieu. Le boyau est un passage ; le piège est au pied de la dernière marche, au sous-lieu 6C.

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : une fine poussière blanche s'est déposée dans les rainures du bord de la trouée, comme si personne n'y avait touché depuis longtemps.

**Champs dérivés**
- **resume** : une dalle de grès glissée de côté, sur un escalier de dix-huit marches qui descend sous la butte.
- **accroche** : « Au centre de la butte, une dalle de grès glissée laisse descendre un escalier étroit dans le noir. » (19 mots)
- **visuel** : Une dalle de grès gris, longue comme un homme, a glissé de côté au centre du cercle, et sa cassure brune se détache sous le ciel gris. Sous elle s'ouvre une trouée étroite, puis un escalier de pierre taillée qui plonge droit dans l'obscurité. Un souffle froid remonte de la trouée, et la lumière grise s'affaiblit à mesure qu'elle descend les marches.
- **ambiance** : Pierre froide, souffle du fond, goutte d'eau.
- **description** : La dalle de grès, d'environ quatre cents kilos, a été fracturée sur une arête puis glissée de quatre-vingts centimètres vers la droite de celui qui entre par le nord-ouest. Sous elle, la trouée donne sur un escalier de dix-huit marches de pierre taillée, large de quatre-vingts centimètres, qui descend droit, dans l'axe du cercle, jusqu'à cinq mètres sous la butte. Un souffle froid vient du fond de l'escalier. La lumière grise du ciel s'amenuise de marche en marche ; en bas, elle n'atteint plus que la pénombre de l'antichambre. Il n'y a pas de lampe ici : le groupe doit apporter la sienne. La neuvième marche est fendue en deux, et les parois suintent au niveau des épaules. Il n'y a rien à fouiller dans la trouée : c'est un simple boyau. Le piège n'est pas ici, mais au pied de la dernière marche, en travers du seuil de l'antichambre (6C) ; le sarcophage se trouve au bout de la descente (6D).
- **arrivee** : Vous marchez vers le centre du cercle, où la dalle de grès a glissé de côté. Elle est longue comme un homme, et son arête brisée, brune et lisse, se détache faiblement sur le gris du ciel. À sa place s'ouvre un trou étroit, large de quatre-vingts centimètres, d'où monte, de l'escalier, un souffle froid qui fait frissonner les mains. En bas, des marches de pierre taillée descendent tout droit dans le noir, et la lumière du ciel s'amenuise à chaque marche. Une goutte d'eau tombe quelque part au fond, puis une autre, à intervalles réguliers. L'odeur est celle d'une cave : pierre mouillée, poussière de calcaire, cendre éteinte. Vos pas s'arrêtent d'eux-mêmes au bord du trou, et vous tendez l'oreille. Vous ne voyez le fond de l'escalier qu'à demi, et le bas se perd dans un gris sans contours.

---

#### Niveau 3 : ald-tertre-antichambre (Antichambre voûtée, pénombre et piège, piège), dans ald-tertre-des-sept-lances

**Héritage** (recopié du niveau 2, sans changement) :
- **Dimensions et structure** : butte conique et rase, couronnée d'un cercle de sept menhirs de 3,5 m sur une ligne d'environ vingt mètres de diamètre ; au centre du cercle, une dalle de grès d'environ 400 kg, glissée de 80 cm, découvre une trouée et un escalier de 18 marches large de 80 cm, qui descend à 5 m sous terre sur environ cinq mètres de longueur ; une antichambre voûtée de 4 m sur 3 au pied de l'escalier ; une crypte voûtée en berceau de 6 m sur 5, au bout de l'antichambre, avec six niches murales et une cuve de grès au centre.
- **Matériaux et état** : granit noir brut des menhirs, sans mousse, inclinés de quinze degrés vers le centre ; pelouse rase et calcinée qui couvre la butte ; grès gris de la dalle, à la cassure brune ; grès des marches, des parois et de la cuve ; pierre taillée humide sous terre, sol de dalles usées ; urnes d'argile brisées dans les niches ; couvercle et cuve de grès.
- **Lumière** : au-dessus de la butte, ciel bas et gris, sans ombre ; sous la trouée, la lueur grise du ciel descend les premières marches et s'affaiblit ; l'antichambre reste en pénombre, la crypte dans l'obscurité complète. Aucune lampe ni torche sur place : le groupe apporte sa lumière.
- **Sons** : vent régulier qui siffle entre les menhirs ; silence des landes ; sous terre, silence et écho : chaque pas résonne sous la voûte, et une goutte d'eau tombe au fond de l'escalier.
- **Odeurs** : herbe calcinée et cendre froide sur la butte ; pierre mouillée et poussière de calcaire sous terre ; cendre éteinte dans la crypte.
- **Température** : froide et venteuse sur la butte ; fraîche et humide à la descente, glacée au fond de la crypte.
- **Éléments remarquables** (chacun avec sa place) :
  - le cercle des sept menhirs de granit noir, sur la crête de la butte, inclinés vers le centre ;
  - la pelouse rase et calcinée qui couvre la butte, sans une mauvaise herbe ;
  - la dalle de grès glissée de 80 cm, au centre du cercle, et la trouée qu'elle découvre ;
  - l'escalier de 18 marches qui descend droit sous la trouée, à 5 m sous terre ;
  - l'antichambre voûtée, au pied de l'escalier, au sud du centre ;
  - la crypte voûtée en berceau, au sud de l'antichambre, avec ses six niches murales et la cuve de grès au centre ;
  - les trois niches basses, au ras du sol, dans le mur ouest de la crypte, fermées par des dalles de pierre.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- la voûte basse de l'antichambre, de 4 m sur 3, au pied de l'escalier, et ses parois de grès humides ;
- la dalle de pierre légèrement surélevée, au pied de la dernière marche, en travers du seuil de l'antichambre ; elle est reliée par une chaîne de fer rouillée à un contrepoids de pierre scellé dans le mur est, à hauteur de la hanche ;
- deux fentes carrées dans le mur ouest, à hauteur de poitrine, d'où sortent les javelines ;
- une flèche gravée sur le mur ouest, sous les fentes, pointée vers le sol ;
- au fond de la pièce, au sud, l'ouverture vers la crypte, sans porte, où l'air est plus froid.

**Issues** :
- vers `ald-tertre-dalle-et-escalier` : description : « L'escalier de dix-huit marches monte droit vers la trouée, cinq mètres plus haut, où la lueur grise du ciel se fait plus nette. » (22 mots) ; retour : « Depuis la trouée, l'escalier descend dix-huit marches vers une pénombre où l'on distingue à peine les dalles du fond. » (20 mots)
- vers `ald-tertre-sarcophage` : description : « Au fond de l'antichambre, une ouverture sans porte mène à la crypte, où l'obscurité est complète et l'air plus froid. » (21 mots) ; retour : « Depuis la crypte, la pénombre de l'antichambre se devine au-dessus du seuil, comme un rectangle grisâtre. » (17 mots)

**Contenu prévu** (un emplacement par entité ; au lieu le plus précis) :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| piège | dalle à javelines : si l'on marche sur la dalle surélevée, le contrepoids tire et deux javelines rouillées partent des fentes du mur ouest (Attaque +4, 1d6 perforant chacune) | la dalle surélevée au pied de la dernière marche, en travers du seuil, le contrepoids du mur est, les fentes du mur ouest | à créer | Perception DD 13 (repérer la dalle surélevée et les fentes) ; Outils de voleur DD 12, ou un coin de fer glissé sous la dalle pour la bloquer (désarmer) |

**Avant / après** : aucun changement prévu par le canon à ce lieu.

**Un détail propre à ce lieu** : la flèche gravée sur le mur ouest, pointée vers le sol, est une marque de tailleur, plus profonde que les autres marques du mur ; elle indique la dalle à qui sait la lire.

**Champs dérivés**
- **resume** : une antichambre voûtée au pied d'un escalier, où la pénombre s'arrête devant une ouverture vers la crypte.
- **accroche** : « Par la trouée sous la dalle glissée, on n'aperçoit que quelques marches et une lueur grise qui faiblit en descendant. » (21 mots)
- **visuel** : Une antichambre basse, voûtée de pierre taillée, au pied d'un escalier qui vient du haut. Une lueur grise et faible tombe de la trouée et s'arrête sur des parois de grès humides. Au fond, une ouverture sombre, sans porte, s'enfonce dans l'obscurité.
- **ambiance** : Pierre humide, pénombre, silence serré.
- **description** : L'antichambre est voûtée en berceau bas, de quatre mètres sur trois, au pied de l'escalier, à cinq mètres sous la butte. Elle ne reçoit que la lueur faible de la trouée. Au pied de la dernière marche, en travers du seuil de l'antichambre, une dalle de pierre légèrement surélevée est reliée par une chaîne de fer rouillée à un contrepoids scellé dans le mur est : si l'on marche dessus sans précaution, le contrepoids tire et deux javelines rouillées jaillissent des fentes carrées du mur ouest. Détection : Perception DD 13. Désarmement : Outils de voleur DD 12, ou un coin de fer glissé sous la dalle pour la bloquer. Échec au déclenchement : deux javelines, Attaque +4, 1d6 perforant chacune. Une flèche gravée sur le mur ouest, pointée vers le sol, est une marque de tailleur qui signale la dalle à qui sait la lire. Au fond, une ouverture sans porte mène à la crypte (6D), où l'obscurité est complète ; l'air qui en sort est plus froid et sent la cendre.
- **arrivee** : L'escalier s'achève sur une antichambre basse, voûtée de pierre taillée. Vous descendez les dernières marches, et la pénombre se fait plus épaisse : la lueur grise de la trouée, là-haut, n'atteint plus ici qu'un pâle reflet sur le sol. Les parois de grès sont humides et luisantes, et la voûte est si basse qu'un grand gaillard doit baisser la tête. Vos pas résonnent sur des dalles usées, et chaque bruit revient en écho. Au fond, le mur de pierre se perd dans un noir plus épais, d'où monte un air plus froid, qui sent la cendre et la poussière de calcaire. Le silence est presque complet ; seule une goutte d'eau tombe quelque part, plus loin. Vous sentez l'humidité sur votre visage. Vos yeux mettent un moment à s'habituer à cette demi-clarté. La pièce est petite, et le moindre mouvement s'entend.

---

#### Niveau 3 : ald-tertre-sarcophage (Crypte du sarcophage, obscurité, combat et trésor), dans ald-tertre-des-sept-lances

**Héritage** (recopié du niveau 2, sans changement) :
- **Dimensions et structure** : butte conique et rase, couronnée d'un cercle de sept menhirs de 3,5 m sur une ligne d'environ vingt mètres de diamètre ; au centre du cercle, une dalle de grès d'environ 400 kg, glissée de 80 cm, découvre une trouée et un escalier de 18 marches large de 80 cm, qui descend à 5 m sous terre sur environ cinq mètres de longueur ; une antichambre voûtée de 4 m sur 3 au pied de l'escalier ; une crypte voûtée en berceau de 6 m sur 5, au bout de l'antichambre, avec six niches murales et une cuve de grès au centre.
- **Matériaux et état** : granit noir brut des menhirs, sans mousse, inclinés de quinze degrés vers le centre ; pelouse rase et calcinée qui couvre la butte ; grès gris de la dalle, à la cassure brune ; grès des marches, des parois et de la cuve ; pierre taillée humide sous terre, sol de dalles usées ; urnes d'argile brisées dans les niches ; couvercle et cuve de grès.
- **Lumière** : au-dessus de la butte, ciel bas et gris, sans ombre ; sous la trouée, la lueur grise du ciel descend les premières marches et s'affaiblit ; l'antichambre reste en pénombre, la crypte dans l'obscurité complète. Aucune lampe ni torche sur place : le groupe apporte sa lumière.
- **Sons** : vent régulier qui siffle entre les menhirs ; silence des landes ; sous terre, silence et écho : chaque pas résonne sous la voûte, et une goutte d'eau tombe au fond de l'escalier.
- **Odeurs** : herbe calcinée et cendre froide sur la butte ; pierre mouillée et poussière de calcaire sous terre ; cendre éteinte dans la crypte.
- **Température** : froide et venteuse sur la butte ; fraîche et humide à la descente, glacée au fond de la crypte.
- **Éléments remarquables** (chacun avec sa place) :
  - le cercle des sept menhirs de granit noir, sur la crête de la butte, inclinés vers le centre ;
  - la pelouse rase et calcinée qui couvre la butte, sans une mauvaise herbe ;
  - la dalle de grès glissée de 80 cm, au centre du cercle, et la trouée qu'elle découvre ;
  - l'escalier de 18 marches qui descend droit sous la trouée, à 5 m sous terre ;
  - l'antichambre voûtée, au pied de l'escalier, au sud du centre ;
  - la crypte voûtée en berceau, au sud de l'antichambre, avec ses six niches murales et la cuve de grès au centre ;
  - les trois niches basses, au ras du sol, dans le mur ouest de la crypte, fermées par des dalles de pierre.

**Éléments de ce sous-lieu** (chacun avec sa place) :
- la crypte voûtée en berceau, de 6 m sur 5, entrée par son côté nord, depuis l'antichambre ;
- six niches murales à hauteur d'épaule, trois sur le mur est et trois sur le mur ouest, chacune contenant une urne d'argile brisée ;
- trois niches basses, au ras du sol, dans le mur ouest, sous les niches d'urnes, où sont allongés les trois squelettes ;
- trois dalles de pierre basses, appuyées contre le mur ouest à hauteur des genoux, qui ferment les trois niches basses ;
- la cuve de grès du sarcophage, d'environ deux pas sur trois, au centre de la crypte, fermée par un couvercle de grès de 250 kg ;
- l'effigie d'homme armé au bouclier rond, sculptée sur le couvercle, dont le visage est ébréché ;
- une pierre plate, devant la cuve, côté nord, qui fait office d'autel, avec une cuvette creusée au centre.

**Issues** :
- vers `ald-tertre-antichambre` : description : « Par la baie nord, sans porte, on retrouve l'antichambre basse, où un rectangle de pénombre grise se devine au-dessus du seuil. » (21 mots) ; retour : « Depuis l'antichambre, la crypte paraît noire : la voûte et les niches n'apparaissent qu'à la lumière apportée par le groupe. » (21 mots)

**Contenu prévu** (un emplacement par entité ; au lieu le plus précis) :

| sorte | rôle | lié à quel élément du décor | id | skill |
| --- | --- | --- | --- | --- |
| combat (évitable) | trois squelettes allongés dans trois niches basses, au ras du sol, dans le mur ouest ; ils s'extirpent si le couvercle est ouvert sans rite ou si l'arme est saisie sans respect ni offrande ; profil SRD : CA 14, 13 PV, vulnérables au contondant (dégâts doublés), épée courte +5 ou arc court +5 (1d6+3 perforant) ; 50 PX chacun | les trois niches basses du mur ouest, sous les niches d'urnes | `squelette` (trois fois) | Rite évitable : Religion DD 11 (serment), ou une offrande de vin ou d'eau bénite sur l'autel |
| trésor | sarcophage : Spatha de bronze d'Aethelgard (épée longue de bronze antique, base SRD `epee-longue`, immunisée à la fonte friable, la seule épée longue immunisée de la zone) ; torque d'électrum à grenats (50 po) ; bouclier de chêne cerclé de cuivre (+2 CA, incassable, base SRD `bouclier`) ; dague Langue-d'Acier (objet insolite, glissée dans la doublure : métal météorique qui parle, jamais détaillée côté joueur) | dans la cuve, sous le couvercle de grès de 250 kg | `spatha-d-aethelgard`, `bouclier-d-aethelgard`, `dague-langue-d-acier` ; torque à créer | Force combinée DD 13 ou levier pour le couvercle ; Investigation DD 13 pour trouver la doublure |

**Avant / après** (canon) : rite réussi, les squelettes restent immobiles dans leurs niches et le couvercle s'ouvre sans combat ; rite absent ou raté, le combat commence dès l'ouverture du couvercle ou dès que l'arme est saisie.

**Un détail propre à ce lieu** : la tête de l'effigie est ébréchée, mais l'ébréchure est polie comme le reste du couvercle, et la pierre de l'autel a une cuvette creusée au centre, pleine de cendre froide.

**Champs dérivés**
- **resume** : une crypte voûtée et sombre, aux niches d'urnes brisées, autour d'un sarcophage de grès fermé.
- **accroche** : « Sous la butte, par la trouée, monte une odeur de cendre froide et de poussière de calcaire d'une crypte que la lueur n'atteint pas. » (25 mots)
- **visuel** : Une crypte voûtée en berceau, de pierre grise et humide, dont six niches murales à hauteur d'épaule contiennent des urnes d'argile brisées. Au centre, une cuve de grès est fermée par un couvercle sculpté d'une effigie d'homme armé au bouclier rond, au visage ébréché. Devant la cuve, une pierre plate forme un autel, et l'obscurité complète ne laisse voir la voûte qu'à la lumière apportée.
- **ambiance** : Cendre froide, pierre humide, écho lointain.
- **description** : La crypte est voûtée en berceau, six mètres sur cinq, à cinq mètres sous la butte, et ne reçoit aucune lumière : le groupe apporte la sienne. Six niches murales, à hauteur d'épaule, sont creusées dans les murs est et ouest ; chacune contient une urne d'argile brisée. Dans le mur ouest, trois niches basses, au ras du sol, fermées par des dalles de pierre, abritent trois squelettes allongés, immobiles tant que le rite est respecté. Au centre, la cuve de grès, d'environ deux pas sur trois, est fermée par un couvercle de deux cent cinquante kilos, sculpté d'une effigie d'homme armé au bouclier rond dont le visage est ébréché. Devant la cuve, une pierre plate sert d'autel. Le groupe peut s'y incliner, prononcer un serment (Religion DD 11), ou verser du vin ou de l'eau bénite. Le rite réussi est narré : une lueur bleutée éclaire la voûte, et les squelettes restent immobiles. Il ne donne aucune récompense mécanique. Si l'arme est saisie sans respect ni offrande, ou si le couvercle est ouvert sans rite (Force combinée DD 13, ou levier), les squelettes repoussent les dalles de pierre de leurs niches basses pour sortir, et bloquent la crypte et l'escalier. Dans la cuve, sous une doublure de chêne, se trouvent la Spatha de bronze d'Aethelgard, la seule épée longue immunisée de la zone, le torque d'électrum à grenats, le bouclier de chêne cerclé de cuivre, et la dague glissée dans la doublure, décrite dans Contenu prévu.
- **arrivee** : Vous entrez dans une crypte voûtée en berceau, où l'obscurité est totale : aucune lueur ne vient d'en haut, et seule votre lumière la découpe. La voûte est de pierre grise, humide, et les murs portent six niches à hauteur d'épaule, chacune contenant une urne d'argile brisée, qui ont perdu leur couvercle. Contre le mur ouest, trois dalles de pierre basses ferment des niches au ras du sol. Au centre, une cuve de grès, fermée par un couvercle lourd, occupe le milieu de la pièce. Sur le couvercle, une effigie d'homme armé au bouclier rond a le visage ébréché. Devant la cuve, une pierre plate sert d'autel, nue, sans offrande. Le silence est total, et l'air sent la cendre froide et la poussière sèche, qui s'accroche à la gorge. Votre voix revient en écho sous la voûte. Le froid y est plus vif qu'au sommet de la butte. Il vous faut une lumière pour lire les niches.
---

## Niveau 1 (suite) : raccordements de `ald-carrefour-d-aldric` (V5, fiche du carrefour)

> **Validé par l'utilisateur le 11/11/2026 (V5, raccordements). Gelé : tout changement demande un nouveau oui.** Cette section ne décrit aucun nouveau lieu : elle écrit **les issues réciproques** que les six fiches gelées n'ont pas toutes (l'auberge n'a que la rampe vers le carrefour) et **les deux sorties de la zone**. Les textes « côté auberge » reprennent mot pour mot les `retour` déjà écrits dans les fiches gelées des lieux voisins ; rien n'est inventé. Le carrefour n'est pas un lieu de plus : c'est le pied de la rampe (la potence, le panneau, le croisement), décrit dans `ald-auberge-perron-et-potence` (1E).

### Les pistes de la zone, vues depuis l'auberge (réciproques)

Point de départ de chaque issue : `ald-auberge-perron-et-potence` (1E), qui donne sur le carrefour. Durées de la table du niveau 1 (gelée).

| Vers | Durée | `description` (côté auberge) | `retour` (côté voisin, déjà écrit dans sa fiche) |
| --- | --- | --- | --- |
| `ald-vieux-pont` | 1 h ✚ | « Depuis le perron de l'auberge, la rampe descend vers le carrefour, puis une piste de boue mène à une arche de grès au bord de l'eau noire. » | « La route remonte vers le carrefour, puis la butte de l'auberge, à une heure de marche dans la boue. » |
| `ald-moulin-d-eldren` | 1 h 30 ✚ | « Depuis le perron de l'auberge, au loin vers le nord-est, une tour de pierre grise dépasse d'un tertre, au-dessus des pâtures. » | « La piste de boue descend vers le sud-ouest, passe les ruines d'une ferme, puis rejoint le carrefour et la butte de l'auberge, à une heure et demie de marche. » |
| `ald-combe-de-l-ours` | 1 h 30 ✚ | « Depuis la piste du carrefour, un ravin de craie blanche et un taillis d'épines se devinent au nord-ouest, à une heure et demie de marche. » | « Depuis le goulet, la piste de boue remonte vers le sud-est, à travers le taillis, jusqu'au carrefour et à la butte de l'auberge, à une heure et demie. » |
| `ald-carriere-d-argile` | ≈ 2 h ✚ (par le pont) | « Depuis la butte, la descente mène au Vieux Pont, puis un sentier de boue remonte la berge sud vers une cuvette de glaise rouge, environ deux heures. » | « Depuis le fond, la rampe de l'est rejoint le sentier de la berge sud jusqu'au Vieux Pont, puis la piste monte à la butte de l'auberge, environ deux heures. » |
| `ald-tertre-des-sept-lances` | ≈ 2 h ✚ | « Depuis le perron de l'auberge, vers le sud-est, on devine la colline rase sur les landes, à demi noyée dans le crachin. » | « La piste de boue descend vers le nord-ouest, à travers les landes, vers la butte de l'auberge, à environ deux heures de marche. » |

Entre voisins déjà écrits et gelés : pont ↔ carrière (1 h, sentier de la berge sud) ; pont et combe, moulin et tertre se rejoignent par le carrefour (pas d'issue directe).

### Les deux sorties de la zone (lieux d'autres zones, à créer)

| Vers | Durée | `description` | `retour` |
| --- | --- | --- | --- |
| `som-mines-de-sombreval` (Piste de Sombreval, plein ouest) | 5 h | « La piste de Sombreval s'enfonce vers l'ouest, rocailleuse et ravinée, et gravit des contreforts d'ardoise d'où monte une fumée de soufre. » | « Depuis les contreforts, la piste redescend vers l'est dans la brume, jusqu'à une butte fortifiée où deux routes se croisent. » |
| `hau-haute-garde` (Route du Roi, plein nord) | ≈ 12 h ✚ | « La Route du Roi, voie pavée, file droit vers le nord ; plus loin, des chariots à bâche noire s'arrêtent devant des barrages de péage. » | « Depuis les faubourgs, la Route du Roi redescend vers le sud, pavée et droite, jusqu'à un carrefour de boue où se dresse un gibet. » |

La Route du Roi est **barrée par les péages illégaux du Lion d'Acier** : elle mène à Haute-Garde mais ne se parcourt pas librement au départ ; son verrou (condition, fouille, laissez-passer, palier de l'Échéance) est une règle de **l'histoire entière**, écrite avec la jauge `echeance` et la zone 6, pas ici. La Noire-Eau vers les marais n'est **pas** une sortie de la zone 1.

### Ce que cette section ne change pas

Aucun lieu, aucun budget, aucune fiche gelée : seulement les issues réciproques de l'auberge et les deux sorties de zone, à reporter dans les fichiers de lieux au moment de la dérivation.
