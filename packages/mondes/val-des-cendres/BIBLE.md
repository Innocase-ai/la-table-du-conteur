# Bible du Val des Cendres (canon)

Document de référence pour tous ceux qui écrivent des données de ce monde. **Les identifiants du registre (§7) sont fixes** : les zones s'y réfèrent entre elles. Ne rien inventer qui contredise ce canon.

## 1. Pitch

Une haute vallée enclavée. Il y a deux siècles, le royaume nain de la **Haute-Forge** s'est effondré. Depuis, une **cendre grise** retombe doucement sur le Val, et là où elle tombe, les morts se relèvent : pas des âmes revenues, de la cendre qui marche. Le dernier village, **Veillecendre**, vit autour de la **Lanterne**, un phare de garde nain dont la flamme tient la cendre à distance. La flamme faiblit. Le col vient de se fermer sous la neige : le groupe, arrivé avec la dernière caravane, est coincé.

**Ton** : sombre et mélancolique, espoir dans les petits gestes, humour sec, choix qui coûtent. **Esthétique** : gris cendre, orange braise, ombres bleutées, pierre naine gravée de runes.

## 2. Ce qui s'est vraiment passé (secret, révélé par morceaux)

- **La Haute-Forge** était un royaume nain de quatre siècles, bâti sur la **Veine rouge**, une coulée de feu élémentaire. Son foyer sacré, le **Cœur-de-Braise**, alimentait toutes les forges.
- Le onzième Roi-Forgeron, **Thalgrin Cœur-d'Enclume**, a perdu sa fille **Brunhild** à la « toux grise ». Il a passé ses dernières années à forger la **Dernière Commande** : un corps de fer et de braise pour la ramener, **la Fille de fer**.
- Pour l'animer, il a **surnourri le Cœur-de-Braise** avec le feu de ses forges, puis avec celui de son peuple. La nuit où il a achevé la fonte, le Cœur a débordé : le royaume est mort étouffé sous la cendre (**la Nuit de la Cendre**). Thalgrin est devenu un **spectre lié à sa forge**, qui poursuit sa commande sans fin : il lui manque « un dernier souffle » pour réveiller Brunhild.
- Le Cœur ne s'est pas éteint : il **entretient les morts**, ils sont le reste de sa flamme. La cendre qui tombe est ce qu'il rejette.
- Les nains en fuite ont bâti la **Lanterne**, allumée à une étincelle du Cœur. Elle repousse la cendre mais **dépend du Cœur** : chaque année, un volontaire, le **Veilleur**, doit y donner un peu de sa vie. La Mère-Gardienne le cache au village. Le Veilleur actuel est mourant, et il n'y a plus de volontaire.
- Les **Pèlerins gris** pensent que la cendre est une grâce : se laisser prendre, c'est rejoindre les morts en paix. Ils ne tuent personne.
- La **Compagnie du Fer-Gris** (hobgobelins disciplinés, battus au sud, arrivés il y a cinq ans) occupe **Pont-de-Fer** et veut le Cœur-de-Braise pour alimenter ses forges de guerre. Son capitaine est sincère : il veut un foyer pour son peuple.
- Le **bailli** de Veillecendre paie en secret un tribut de grain au Fer-Gris pour que le village soit « protégé ». Il veut évacuer avant l'hiver et ne dit pas que le grain manque.
- La **bande du Gué** pille les réfugiés ; son chef n'est qu'un homme affamé devenu cruel.

## 3. Les fins

1. **Rallumer** : nourrir le Cœur d'un volontaire vivant qui reste à la Forge. La cendre cesse, la Lanterne revit, le village est sauvé, un compagnon ou un personnage-joueur paie. Fait : `f-rallumer-par-volontaire`.
2. **Éteindre** : rouvrir l'**Écluse noire** et noyer le Cœur. Les morts reposent, la cendre cesse, mais la Lanterne s'éteint et le Val est abandonné. Fait : `f-ecluse-noire`.
3. **Achever la commande** : donner à Thalgrin « le dernier souffle » (un sacrifice de feu) pour animer Brunhild. Thalgrin est délivré, la cendre cesse, mais la Fille de fer s'éveille, mi-enfant mi-forge, gardienne d'un Val haunté dont le groupe devient les hôtes. Fait : `f-derniere-commande`.
4. **Livrer la Forge au Fer-Gris** : le capitaine obtient le Cœur ; ordre brutal, le Val devient un fief de guerre, la cendre continue ailleurs. Fait : `f-fer-gris-veut-la-forge`.

## 4. La jauge de Cendre

Identifiant `cendre`, de 0 à 5, départ 1. Elle monte d'un cran à chaque repos long pris hors de la Lanterne, et à certains mauvais choix (dont le départ d'une victime innocente) ; elle baisse quand la Lanterne est nourrie (quête de combustible). Paliers : 2 (les morts rôdent aux abords du village), 3 (assauts nocturnes, couvre-feu), 4 (la Lanterne vacille, le village se vide), 5 (la Lanterne s'éteint : fin du chapitre sans victoire, la cendre submerge Veillecendre).

## 5. Factions (identifiants fixes)

| id | Faction | Veut | Chef |
| --- | --- | --- | --- |
| `gardiens-de-la-veille` | Les Gardiens de la Veille | Garder la Lanterne allumée, quoi qu'il en coûte | `hesta-cendrebrune` |
| `bailliage` | Le bailli et les marchands | Évacuer avant l'hiver, garder l'ordre | `aurele-montclar` |
| `compagnie-du-fer-gris` | La Compagnie du Fer-Gris | Prendre la Haute-Forge, un foyer pour son peuple | `kor-varnak` |
| `bande-du-gue` | La bande du Gué | Survivre en pillant | `gaspard-le-borgne` |
| `pelerins-gris` | Les Pèlerins gris | Rejoindre les morts en paix | `frere-ocre` |
| `morts-de-la-forge` | Les morts de la Haute-Forge | Que le roi achève sa commande | `thalgrin-coeur-d-enclume` |

## 6. Les espèces dans le Val

- **Nains** : survivants de la Haute-Forge, gardiens de la Lanterne. **Orcs** : le clan Marteau-Vert, jadis alliés des forgerons, aujourd'hui forgerons de réfugiés (leur ancêtre aurait vendu un secret : honte de Korvun). **Gnomes** : entretiennent les mécanismes nains (énigmes et pièges). **Halfelins** : cuisiniers, herboristes, tenanciers. **Goliaths** : bergers des hauteurs, ils ont vu tomber la première cendre. **Elfes** : archivistes venus des basses terres. **Tieffelins** : soupçonnés à tort d'avoir « appelé » la cendre. **Drakéides** : voyageurs, rares ; on les croit liés au feu de la Forge. **Humains** : la majorité des réfugiés, le bailliage.

## 7. Registre des identifiants fixes

### Lieux (arbre)

- `val-des-cendres` — région (racine de tout)
  - `veillecendre` — village, **départ**. Sous-lieux préfixés `vei-` (Z1) : `vei-la-lanterne` (tour de garde, à l'intérieur de la flamme), `vei-auberge-dernier-feu`, `vei-forge-des-refugies`, `vei-dispensaire`, `vei-atelier-des-rouages`, `vei-halle-du-bailli`, `vei-maison-des-gardiens`, `vei-chapelle-grise`, `vei-marche`, `vei-archives`, `vei-enclos` et d'autres
  - `route-du-col` — route (Z1) : le col fermé, l'embuscade gobeline (`route-du-col-embuscade`)
  - `sentier-des-cendres` — route (Z3), relie le village aux grottes et aux hauteurs
  - `pont-de-fer` — ville occupée (Z2), sous-lieux `pdf-` ; `le-gue` — hameau (Z2), sous-lieux `gue-`
  - `grotte-des-loups-gris`, `la-fosse` (mine effondrée), `grotte-aux-fils`, `cairn-des-hauteurs`, `champ-de-cendre-gris` — Z3, sous-lieux `gro-`
  - `cryptes-d-ormgard` — donjon (Z4), sous-lieux `cry-`
  - `haute-forge` — donjon final (Z5), sous-lieux `hf-` ; salle du Cœur : `hf-forge-du-coeur` ; Écluse noire : `hf-ecluse-noire`

### Personnages clés (créés par la zone indiquée)

| id | Qui | Zone, lieu |
| --- | --- | --- |
| `hesta-cendrebrune` | Mère-Gardienne, naine, F, ~70 ans | Z1, `vei-maison-des-gardiens` |
| `aurele-montclar` | bailli, humain, M | Z1, `vei-halle-du-bailli` |
| `bertille-dernier-feu` | aubergiste, halfeline, F | Z1, `vei-auberge-dernier-feu` |
| `grodak-marteau-vert` | forgeron, orc, M | Z1, `vei-forge-des-refugies` |
| `pervenche-mousseron` | herboriste, halfeline, F | Z1, `vei-dispensaire` |
| `fennick-rouage` | maître mécanicien gnome, M | Z1, `vei-atelier-des-rouages` |
| `aelith-sombrecorce` | archiviste elfe, F | Z1, `vei-archives` |
| `rolf-garde-capitaine` | capitaine de la garde, humain, M | Z1, `vei-la-lanterne` |
| `ysolde-rouage` | **compagnon** : magicienne gnome, F, niveau 3, apprentie de Fennick | Z1, `vei-atelier-des-rouages` |
| `korvun-tete-rase` | **compagnon** : guerrier orc, M, niveau 3 | Z1, `vei-forge-des-refugies` |
| `mireille-vanhaut` | **compagnon** : clerc tieffelin, F, niveau 3, ex-Pèlerine | Z1, `vei-chapelle-grise` |
| `kor-varnak` | capitaine hobgobelin | Z2, `pdf-caserne` |
| `gaspard-le-borgne` | chef de bande, humain, M | Z2, `gue-repaire` |
| `frere-ocre` | prophète des Pèlerins gris, humain, M | Z3, `champ-de-cendre-gris` |
| `taavi-pas-de-nuage` | berger goliath, M | Z3, `cairn-des-hauteurs` |
| `thalgrin-coeur-d-enclume` | Roi-Forgeron, spectre | Z5, `hf-forge-du-coeur` |
| `brunhild` | la Fille de fer, éveillée ou non | Z5, `hf-forge-du-coeur` |

### Objets clés

`braise-de-veille` (Z1 : braise portative qui protège de la cendre ; confiée à qui la mérite), `cle-du-sceau-de-la-forge` (Z4 : ouvre la Haute-Forge), `cle-de-l-ecluse-noire` (Z5), `marteau-du-premier-forgeron` (Z5 : relique d'arme), `journal-de-brunhild` (Z5 : révèle la Dernière Commande), `sceau-du-fer-gris` (Z2 : laissez-passer de la Compagnie).

### Jauge, drapeaux, faits centraux

- Jauge : `cendre`.
- Drapeaux (posés par les zones, lus par les quêtes) : `a-parle-a-hesta`, `lanterne-visitee`, `cryptes-ouvertes`, `cryptes-franchies` (le gardien des cryptes est vaincu et la clé du sceau récupérée), `haute-forge-ouverte`, `ecluse-noire-trouvee`, `coeur-atteint`, `choix-rallumer`, `choix-eteindre`, `choix-achever`, `choix-fer-gris`, `fer-gris-allie`, `bailli-demasque`, `veilleur-mort`, `vei-conseil-tenu` (le conseil des Gardiens a eu lieu : événement `vei-ev-conseil-des-gardiens`, fait `f-vei-conseil-des-gardiens`, sujet `le-conseil` chez Hesta, Aurèle, Rolf et Fennick).
- Faits centraux (fichier `faits/faits-centraux.json`) : `f-nuit-de-la-cendre`, `f-roi-forgeron-thalgrin`, `f-derniere-commande`, `f-fille-de-fer`, `f-coeur-de-braise`, `f-veine-rouge`, `f-lanterne-etincelle`, `f-veilleur-se-consume`, `f-cendre-reveille-les-morts`, `f-pelerins-motif`, `f-fer-gris-veut-la-forge`, `f-tribut-du-bailli`, `f-ecluse-noire`, `f-rallumer-par-volontaire`, `f-sceau-des-cryptes`, `f-orcs-et-nains`.

### Quêtes principales (créées par Z6)

`q-la-lanterne-faiblit` (principale, 6 étapes : `veille`, `sceau`, `cryptes`, `forge`, `coeur`, `choix`) ; personnelles : `q-ysolde-l-atelier-du-maitre`, `q-korvun-le-marteau-du-clan`, `q-mireille-le-frere-perdu` ; de faction : `q-fer-gris-le-laissez-passer`, `q-gardiens-la-braise`. Les zones créent leurs propres quêtes secondaires `q-…` (préfixe de zone).

### Rencontres issues du prototype de combat (même composition)

Embuscade gobeline (route du col, niveaux 1-2), la crypte (`cryptes-d-ormgard`, niveaux 3-4), la bande et ses ogres (le Gué, niveaux 3-4), le camp hobgobelin (Pont-de-Fer, niveaux 4-5).

## 8. Progression par niveau

Niveau 1 : Veillecendre, route du col. Niveaux 1-3 : sentier, grottes, Fosse, hauteurs. Niveaux 3-4 : Gué, cryptes, premiers contacts avec le Fer-Gris. Niveaux 4-5 : Pont-de-Fer, Haute-Forge.

## 9. Monstres disponibles (SRD, ids de profil)

`sbire-gobelin`, `combattant-gobelin`, `chef-gobelin`, `combattant-hobgobelin`, `capitaine-hobgobelin`, `combattant-gobelours`, `traqueur-gobelours`, `loup`, `loup-sanguinaire`, `squelette`, `zombi`, `ogre`, `bandit`, `chef-de-bande`, `combattant-gnoll`, `goule`, `araignee-geante`. Les rencontres n'utilisent que ces profils ; d'autres profils pourront être extraits du SRD si besoin (les demander).
