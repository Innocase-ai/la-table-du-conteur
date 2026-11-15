# Bible de La Tombe des Rois Serpents (canon)

Document de référence canonique pour **La Tombe des Rois Serpents** (`tombe-des-rois-serpents`), adapté du scénario d'exploration de donjon pour le moteur `crpg-llm`.

## 1. Pitch

Mandatés par le seigneur **Aldéric de Valdargent** selon un contrat strict à moitié-part, les aventuriers quittent le **Fort du Reflet Béni** pour explorer une ancienne nécropole serpent enfouie sous les sables du **Val du Couchant**. Surveillés à l'entrée par le méthodique valet **Martin** et ses deux mules, ils descendent à travers trois niveaux piégés — des faux caveaux d'argile jusqu'aux catacombes obscures gardées par un colosse osseux, puis jusqu'au sanctuaire d'un basilic enchaîné, d'une succube prisonnière, de gobelins terrés dans des champignonnières et de l'alchimiste immortel **Xiximantre**.

**Ton & Esthétique :** exploration de donjon classique et mortelle, humour sec des contrastes (un sorcier millénaire persuadé que son empire règne toujours), méfiance autour du partage du butin ; pierre calcaire sèche, argile peinte vert-de-gris, suie noire de torche et lueur violette alchimique.

## 2. Ce qui s'est vraiment passé (secret, révélé par morceaux)

- Le premier niveau entier est un **faux tombeau** construit pour décourager ou tuer les pilleurs sous des éboulements et gaz toxiques, cachant le vrai puits sous la grande statue du Faux Temple (`f-passage-temple-decouvert`).
- Les cercueils du premier niveau libèrent une **vapeur verte des sépulcres** (`f-vapeur-des-sepulcres`) ; l'anneau d'un sorcier d'argile est un piège maudit (*Griffe-croc*).
- Le **deuxième niveau** baigne dans une obscurité absolue et héberge les véritables tombes de nobles ophidiens (Xisor le Vert, Sparamantur, Franbinzar transformé en gelée ocre), gardées au sud par un colosse osseux face à un gouffre sans fond (`f-gardien-osseux-gouffre`).
- Une **succube nommée Baltoplate** (`f-vrai-nom-baltoplate`) fut jadis liée dans un cercle d'invocation du troisième niveau ; elle feint d'être une captive innocente pour qu'un mortel brise le sceau d'un baiser.
- L'immortel **Xiximantre** distille des potions sous terre depuis des siècles sans savoir que son empire a disparu (`f-empire-chute-xiximantre`) ; il ne supporte ni la preuve de cette chute ni le vol manifeste, mais troque volontiers contre des curiosités rares.
- Un petit clan de gobelins s'est réfugié dans l'aile ouest après avoir dérobé la **statue d'or de la fontaine** (`f-statue-fontaine-volee`) et la **Couronne des Rois Serpents** (`f-couronne-chez-gobelins`) ; quatre des leurs agonisent dans les oubliettes du sorcier (`f-prisonniers-gobelins-oubliettes`).
- Un **escalier secret sous les racines d'un arbre mort** (`f-sortie-racines-surface`) permet de regagner le bivouac sans retraverser toute la nécropole.

## 3. Les fins

**La question de l'histoire** : que valent les richesses des Rois Serpents, et à qui reviennent-elles : au seigneur qui paie, à ceux qui ont risqué leur peau, ou aux derniers habitants de la tombe ? Aucune fin n'est entièrement heureuse : chacune a son coût.

**Où se décide la fin** : au Bivouac du Seuil, quand le groupe remonte avec de quoi solder le contrat (drapeau `coeur-tombe-resolu` : le grand trésor ouvert, la Couronne reprise, ou un accord avec Xiximantre). Le dilemme `dilemme-le-decompte` (Martin, sa balance de cuivre, les mules ; coûts et gains affichés) s'ouvre alors ; chaque issue pose `verdict-partage-rendu` et le drapeau de sa fin ; ne pas trancher revient à un partage loyal sans estime (Martin applique le contrat). **Aucune fin ne peut donc arriver avant ce moment**, sauf l'échec de l'horloge.

1. **`fin-partage-honnete` (Le partage loyal)** : le groupe étale tout et partage à moitié-part (ou ne tranche pas : Martin applique le contrat). Gain : la solde et l'appui d'Aldéric, la parole du groupe vaut de l'or. Coût : la moitié exacte des richesses s'en va. Variantes d'épilogue : *fraude réussie* (le partage a été truqué avec succès : Martin n'a rien vu), *Couronne*, *associés* (réputation de Valdargent élevée).
2. **`fin-soupcon-et-disgrace` (La fraude éventée)** : le groupe tente de cacher les plus belles pièces (jet d'Escamotage ; offert seulement tant que Martin ne soupçonne pas : horloge à 2 ou moins) et échoue. Gain : quelques pièces sauves dans les doublures. Coût : confiscation, pas de solde, réputation ruinée à Valdargent.
3. **`fin-trahison-fortune` (L'or gardé de force)** : le groupe rompt le contrat et garde tout. Gain : la fortune complète. Coût : Aldéric devient un ennemi riche et patient, le Fort ferme ses portes. Variantes : *Xiximantre vaincu*, *Couronne*.
4. **`fin-pacte-des-profondeurs` (Le silence des profondeurs)** : le groupe déclare le tombeau vide à Martin (jet de Tromperie). Réservé à qui a sauvé les gobelins ou flatté Xiximantre, et **n'a pas tout raconté à Martin** (drapeau `martin-informe`, posé par l'option « tout lui dire » du dilemme de Martin). Gain : la paix des profondeurs et un savoir rare. Coût : aucune solde. Variantes : *éventé* (jet raté : Martin n'a pas cru, Aldéric enverra d'autres hommes), *Xiximantre allié*, *allié et gobelins sauvés*.
5. **`fin-echec-horloge` (Les sables se referment)** : la jauge `soupcon-et-tension` atteint 5 avant le verdict : Martin lève le camp avec les preuves et Valdargent révoque le contrat. Variantes : *le butin en mains*, *le troisième niveau atteint*.

*Validé le 15/11/2026 (V7).*

## 4. La jauge

- **`soupcon-et-tension`** (`min: 0`, `max: 5`, `initial: 0`) : **+1 à chaque nuit de repos complète**. Le moteur applique l'évolution `repos-long` sans condition : on ne peut pas exempter le Fort du Reflet Béni (une nuit au Fort compte comme les autres ; l'effet voulu à l'origine, « hors du Fort », demanderait une évolution conditionnelle que le moteur ne lit pas). L'horloge est donc la patience de Martin : cinq nuits.
- **Paliers** (narration et effets) : 1 *Les mules piétinent* (Martin attend des nouvelles) ; 2 *Regards soupçonneux* (Martin −10, ouvre le dilemme de Martin) ; 3 *Les profondeurs s'agitent* (Cour de Xiximantre −10, Clan −5) ; 4 *Enquête du Fort* (Martin −15, Ordre −5) ; 5 *Le rappel de Valdargent* (fin d'échec).
- **Ce qui la ralentit** : le dilemme de Martin (« tout lui dire » −2, « échantillon » −1 ou +1 selon le jet), les deux comptes rendus à Martin après le niveau 1 et le niveau 2 (−1 chacun), les quêtes secondaires des terrassiers (`q-barre-de-granit`) et d'Elara (`q-statues-petrifiees`) (−1 chacune). **Ce qui l'accélère** : refuser l'inventaire ou ne pas répondre à Martin (+1), libérer Baltoplate (+1), un échec à s'asseoir sur le trône (+1), et le dilemme de Martin laissé sans réponse quatre jours (+1 d'office).

*Validé le 15/11/2026 (V7).*

## 5. Factions (identifiants fixes)

| id | Faction | Veut | Chef |
| --- | --- | --- | --- |
| `commanditaire-alderic` | Maison de Valdargent | La moitié exacte du butin | Seigneur Aldéric (`martin-le-valet`) |
| `ordre-du-reflet-beni` | Garnison du Reflet Béni | Contenir les horreurs enfouies | `commandeur-garin` |
| `cour-de-xiximantre` | Cour de Xiximantre | Poursuivre l'alchimie hors du temps | `xiximantre` |
| `clan-des-champignons` | Clan des Champignons | Survivre et libérer les captifs | `skriik-le-cueilleur` |

## 6. Les peuples et les espèces dans ce monde

Toutes les espèces jouables du SRD trouvent naturellement place dans une troupe d'expédition engagée à Valdargent : marchands et éclaireurs humains/elfes/nains au Fort du Reflet Béni, pisteurs demi-orcs ou drakéides dans le Val du Couchant, roublards halfelins ou gnomes dans les passages étroits de la tombe, et l'érudite elfe Elara à l'apothicairerie du fort.

## 7. Registre des identifiants fixes

### Lieux (arbre)
- `val-du-couchant` (région)
  - `fort-du-reflet-beni` (`repos: "sur"`, départ)
  - `bivouac-entree` (`repos: "sur"`)
  - `tombe-des-rois` (`donjon`)
    - Niveau 1 : `n1-couloir-entree` → `n1-tombes-des-gardes`, `n1-tombe-du-sorcier`, `n1-porte-et-fausse-tombe` → `n1-faux-temple`
    - Niveau 2 : `n2-hall-aux-statues` → `n2-salle-garde-secrete`, `n2-atrium` → (`n2-tombe-xisor`, `n2-tombe-sparamantur`, `n2-tombe-franbinzar`, `n2-sacristie`, `n2-soldats-d-argile`, `n2-escalier-piege` → `n2-arene-gardien` → `n2-gouffre-et-effondrement`)
    - Niveau 3 : `n3-salle-ceremonie` → (`n3-dome-et-esclaves` → `n3-salle-du-tresor`, `n3-fosse-sacrificielle`), (`n3-vestibule-garde` → `n3-salle-invocation`, `n3-autel-et-couloir-lames`, `n3-repos-des-pretres` (`repos: "sur"`), `n3-hall-du-basilic` → `n3-antichambre-xiximantre` → `n3-reserve-et-oubliettes` → `n3-laboratoire`, `n3-salle-du-trone`, `n3-porte-cylindre-et-reserve` → `n3-salle-commune-gobeline` → `n3-ferme-champignons` → `n3-escalier-surface`)

### Personnages clés
| id | Qui | Lieu |
| --- | --- | --- |
| `commandeur-garin` | Commandant et forgeron du Fort | `fort-du-reflet-beni` |
| `elara-herboriste` | Apothicaire de l'avant-poste | `fort-du-reflet-beni` |
| `frere-balthazar` | Chapelain et archiviste du Fort | `fort-du-reflet-beni` |
| `marta-aubergiste` | Cantinière du Fort | `fort-du-reflet-beni` |
| `torin-armurier` | Maître d'armes nain | `fort-du-reflet-beni` |
| `solene-caravaniere` | Marchande de caravane | `fort-du-reflet-beni` |
| `varnac-le-borgne` | **Compagnon** : guerrier humain niv. 1 (`q-varnac-frere-d-armes`) | `fort-du-reflet-beni` |
| `soeur-lysandre` | **Compagnon** : clerc elfe niv. 1 (`q-lysandre-sceau-brise`) | `fort-du-reflet-beni` |
| `mireille-cartographe` | **Compagnon** : roublard gnome niv. 1 (`q-mireille-plan-trois-paliers`) | `fort-du-reflet-beni` |
| `sergent-rodrigue` | Chef de patrouille du Fort | `fort-du-reflet-beni` |
| `corvin-le-scribe` | Greffier du seigneur Aldéric | `fort-du-reflet-beni` |
| `nolan-palefrenier` | Garçon d'écurie | `fort-du-reflet-beni` |
| `martin-le-valet` | Valet de confiance d'Aldéric | `bivouac-entree` |
| `gaspard-muletier` | Muletier du seigneur Aldéric | `bivouac-entree` |
| `lise-guetteuse` | Éclaireuse du Bivouac | `bivouac-entree` |
| `brennan-terrassier` | Contremaître de fouille | `tombe-des-rois` |
| `jehan-fosseyeur` | Terrassier craintif | `tombe-des-rois` |
| `baltoplate` | Captive du cercle / succube | `n3-salle-invocation` |
| `xiximantre` | Alchimiste homme-serpent | `n3-antichambre-xiximantre` |
| `skriik-le-cueilleur` | Ancien de la champignonnière | `n3-ferme-champignons` |
| `trou-noir-gobelin` | Jeune apprenti cueilleur | `n3-ferme-champignons` |
| `grib-guetteur` | Chef de garde de la salle commune | `n3-salle-commune-gobeline` |
| `grignote-marmite` | Cuisinière des champignonniers | `n3-salle-commune-gobeline` |
| `krak-oubliettes` | Cueilleur prisonnier des oubliettes | `n3-reserve-et-oubliettes` |
| `elios-captif` | Scribe elfe prisonnier | `n3-reserve-et-oubliettes` |

### Quêtes
- Principale : `q-tombe-des-rois-serpents`
- Annexes : `q-couronne-des-rois`, `q-fontaine-des-gobelins`, `q-secret-de-baltoplate`, `q-statues-petrifiees`, `q-boucliers-de-l-arene`, `q-barre-de-granit`
- Faction : `q-pactes-de-xiximantre`
- Personnelles : `q-varnac-frere-d-armes`, `q-lysandre-sceau-brise`, `q-mireille-plan-trois-paliers`

### Monstres SRD utilisés
- `squelette`, `bleme`, `gelee-ocre`, `minotaure-squelette`, `chauve-souris-geante`, `basilic`, `combattant-gobelin`, `chef-gobelin`, `succube`, `fanatique-de-secte` (plus profils combat PNJ `chevalier`, `roturier`, `sbire-gobelin`).

## 8. Personnages

Les 25 personnages (passés, dates, liens, voix, dialogues, fiches de savoir, interjections des compagnons) sont décrits dans `CANON-PERSONNAGES.md` et récapitulés dans `RECAP-PERSONNAGES.md`. **Validé le 15/11/2026** par l'auteur (le canon des personnages complète cette bible sans la contredire).
