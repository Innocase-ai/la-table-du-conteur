# Registre des décors (F8 du 20/11/2026)

**À lire AVANT d'écrire les lieux d'un épisode** (skill `creer-monde`) et à compléter à la fin. Il dit quels décors génériques existent déjà, lesquels servent dans quel épisode, et quels lieux ont déjà été vus (pour ne pas refaire la même pièce). Référence : `docs/PRD-SAGA.md` F8, `docs/BIBLIOTHEQUE-COMMUNE.md`.

## Règles d'usage (écrit)

- **Ce qui est commun** : les pièces **courantes** d'un lieu de départ (taverne, chambre, sanctuaire, maison du chef, forge, marché, boutique, intérieur modeste, cave ou grenier, place du village). Une pièce du lieu de départ qui n'a rien de mémorable cite un décor de la réserve : `"lieux": { "<id-du-lieu>": "commun:lieux/<id-du-décor>" }` dans `images/manifeste.json` (le client la résout, `pnpm monde manque` la compte comme une image, une référence inconnue est un manque).
- **Ce qui reste propre à l'épisode** : l'image du hub (le village vu d'ensemble), les **lieux de quête**, les sites de boss, tout lieu **mémorable** ou nommé (un décor de réserve ne montre ni personnage, ni emblème, ni enseigne lisible). Les cartes tactiques, les cartes illustrées et les voix de scènes restent à l'épisode.
- **Choisir** : lire le catalogue ci-dessous (type, intérieur ou extérieur, ambiance), **ne pas citer deux fois le même décor dans un épisode**, varier les ambiances d'un épisode à l'autre (jour clair après une nuit de pluie). Quand un type n'a que ses 3 variantes et que l'épisode en demande plus, **générer** un décor propre à l'épisode plutôt que de répéter.
- **Compléter** : à la fin d'un épisode, `pnpm images communs registre` réécrit la partie générée (les usages viennent des manifestes) ; la partie écrite ci-dessous se complète à la main (lieux vus, ambiances).
- **Origine des décors** : **31 décors**. 20 sont des images **déjà faites** pour les histoires de départ (sélection manuelle : rien de nommé, aucun personnage, aucun emblème), copiées dans `apps/jeu/src/communs/lieux/` ; les mondes d'origine **gardent leurs images** (rien n'est remplacé). 11 viennent du **lot générique** `decors-generiques-1` (généré le 20/11/2026 après accord, FLUX Klein, 0,063 $ réellement dépensés), qui a comblé les 7 types à moins de 3 variantes ; ses prompts restent dans `packages/donnees/visuel/lieux-communs-a-generer.json`. Un nouveau lot : ajouter ses entrées à ce fichier, `pnpm images decors` (simulation, puis `--go` après accord), `installer.py decors`, inscription au catalogue, `pnpm images communs registre`.

## Lieux déjà vus (écrit, à compléter à chaque épisode)

Les histoires de départ restent des jeux d'essai ; leurs décors génériques sont passés dans la réserve (voir « Origine »). Ambiances déjà très employées : **soirée de pluie et boue** (la Dîme, la Marche : chaume mouillé, puits, marais), **pierre froide et cierges** (la Tombe, le Médaillon). À varier : plein jour, neige, fin d'été, bord de mer, vignes, ville de pierre.

| Épisode | Lieux génériques repris dans la réserve | À ne pas refaire tels quels |
| --- | --- | --- |
| La Dîme des Roseaux | auberge, cave, grenier sur pilotis, place du marché, village et barques, halle du conseil, atelier du mineur | Mireval au bord du marais (hub propre), le moulin et sa roue |
| La Marche d'Ombrefiel | salle commune, comptoir et cellier, étage et combles, cour au puits | l'auberge fortifiée vue de l'extérieur, le vieux pont |
| La Tombe des Rois Serpents | réfectoire, chapelle, infirmerie, scriptorium, forge | le Fort du Reflet Béni vu d'ensemble, tout l'intérieur de la tombe |
| Le Médaillon de la Sœur Endormie | taverne, sanctuaire, demeure de pierre, chaumière | Villambrune vu d'ensemble, la crypte |

## Registre généré

<!-- DEBUT-GENERE : ne pas modifier à la main, `pnpm images communs registre` le réécrit -->

### Catalogue (généré)

31 décor(s) en réserve, 3 variantes visées par type. Une image : `apps/jeu/src/communs/lieux/<id>.webp` ; une histoire la cite dans son manifeste : `"lieux": { "<id-du-lieu>": "commun:lieux/<id>" }`.

#### Taverne (`taverne`) — 4 en réserve

| Id | Vu | Ambiance | Origine |
| --- | --- | --- | --- |
| `taverne-foyer-et-chopes` | intérieur — Salle d'auberge de bois sombre : âtre allumé, tables basses, chopes de terre et lanterne posée. | soirée de pluie, lueur d’âtre, bois sombre | dime-des-roseaux / mir-auberge-des-roseaux |
| `taverne-grande-cheminee` | intérieur — Grande salle commune à l’immense cheminée de pierre, tables rondes, sol de terre cuite usé. | feu vif, fumée, sol piétiné | marche-d-ombrefiel / ald-auberge-salle-commune |
| `taverne-longues-tables` | intérieur — Salle à longues tables et bancs de bois, bougies, grande cheminée blanchie. | chandelles, calme du soir | le-medaillon-de-la-soeur-endormie / le-sanglier-dore |
| `taverne-refectoire-voute` | intérieur — Réfectoire voûté de pierre claire, hautes fenêtres, longues tables dressées, âtre au fond. | lumière du jour, vaste et calme | tombe-des-rois-serpents / fort-auberge |

#### Chambre (`chambre`) — 3 en réserve

| Id | Vu | Ambiance | Origine |
| --- | --- | --- | --- |
| `chambre-lit-et-coffre` | intérieur — Petite chambre d’auberge : lit étroit aux couvertures rêches, coffre de voyage au pied, volet clos, bougie sur un tabouret. | bougie, nuit calme | lot decors-generiques-1 |
| `chambre-mansarde-sous-les-poutres` | intérieur — Mansarde sous les poutres : deux paillasses, cuvette sur une caisse, lucarne ronde. | matin gris, poutres basses | lot decors-generiques-1 |
| `chambre-dortoir-commun` | intérieur — Dortoir commun d’une auberge : rangée de lits superposés simples, patères au mur, lanterne suspendue. | lanterne, longue pièce | lot decors-generiques-1 |

#### Sanctuaire (`sanctuaire`) — 3 en réserve

| Id | Vu | Ambiance | Origine |
| --- | --- | --- | --- |
| `sanctuaire-nef-et-vasque` | intérieur — Chapelle de pierre blanche à voûtes, bancs de bois, vasque d’eau au centre, vitraux bleus. | froid clair, recueillement | tombe-des-rois-serpents / fort-chapelle |
| `sanctuaire-vitraux-et-cierges` | intérieur — Nef à colonnes de bois, vitraux colorés, cierges posés au sol. | pénombre colorée, cierges | le-medaillon-de-la-soeur-endormie / sanctuaire-de-sainte-odile |
| `sanctuaire-salle-de-soins-aux-herbes` | intérieur — Salle de soins : lits blancs, bouquets d’herbes séchées au plafond, fioles et table de travail. | lumière douce, herbes séchées | tombe-des-rois-serpents / fort-infirmerie |

#### Maison du chef (`maison-du-chef`) — 3 en réserve

| Id | Vu | Ambiance | Origine |
| --- | --- | --- | --- |
| `maison-du-chef-demeure-de-pierre` | extérieur — Demeure de pierre à deux étages couverte de lierre, fenêtres éclairées, sous un ciel d’orage. | crépuscule menaçant | le-medaillon-de-la-soeur-endormie / demeure-du-sire-bertrand |
| `maison-du-chef-halle-couverte` | extérieur — Halle de bois au toit de chaume, bancs et planche d’affichage vierge, ouverte sur la boue du village. | pluie fine, lanternes | dime-des-roseaux / mir-halle-du-conseil |
| `maison-du-chef-cabinet-aux-parchemins` | intérieur — Salle de travail claire : pupitres, parchemins, encrier et plume, coffre dans un coin. | jour clair, poussière de papier | tombe-des-rois-serpents / fort-scriptorium |

#### Forge (`forge`) — 3 en réserve

| Id | Vu | Ambiance | Origine |
| --- | --- | --- | --- |
| `forge-enclume-et-armes` | intérieur — Forge intérieure : enclume, foyer, râteliers d’armes et mannequin d’armure. | lumière rasante, braises | tombe-des-rois-serpents / fort-forge |
| `forge-atelier-d-etabli` | intérieur — Atelier de pierre : établi chargé d’outils, petite enclume, panneau vierge au mur. | lampe vacillante, pierre nue | dime-des-roseaux / gro-atelier-du-mineur |
| `forge-soufflet-et-trempe` | intérieur — Forge de village vue de la porte : grand soufflet, bac de trempe, foyer rougeoyant, marteaux et tenailles au mur. | braises, contre-jour | lot decors-generiques-1 |

#### Marché (`marche`) — 3 en réserve

| Id | Vu | Ambiance | Origine |
| --- | --- | --- | --- |
| `marche-place-aux-etals` | extérieur — Place boueuse avec puits, étal à balance sous un auvent, village aux toits de chaume au fond. | aube humide, brume basse | dime-des-roseaux / mir-place-du-marche |
| `marche-etals-couverts` | extérieur — Ruelle de marché couverte d’auvents rayés : étals de bois, cageots de légumes, poissons et herbes séchés suspendus. | jour de marché, pavés mouillés | lot decors-generiques-1 |
| `marche-halle-de-bois` | extérieur — Halle de marché en charpente ouverte : sacs de grain empilés, tréteaux et balances, lanternes suspendues. | lumière dorée de fin d’après-midi | lot decors-generiques-1 |

#### Boutique (`boutique`) — 3 en réserve

| Id | Vu | Ambiance | Origine |
| --- | --- | --- | --- |
| `boutique-comptoir-et-armes` | intérieur — Comptoir renforcé de pierre, râteliers d’armes, tonneaux et cuivres. | lumière tamisée, métal | marche-d-ombrefiel / ald-auberge-comptoir-et-cellier |
| `boutique-etageres-et-bocaux` | intérieur — Boutique générale : étagères de bocaux, tissus pliés, rouleaux de corde, comptoir de bois avec balance de cuivre, clochette. | lumière dorée de fenêtre | lot decors-generiques-1 |
| `boutique-apothicaire` | intérieur — Échoppe d’apothicaire : flacons de verre, bouquets d’herbes séchées, mortier sur le comptoir, mur de petits tiroirs. | verre coloré, herbes | lot decors-generiques-1 |

#### Intérieur modeste (`interieur-modeste`) — 3 en réserve

| Id | Vu | Ambiance | Origine |
| --- | --- | --- | --- |
| `interieur-modeste-escalier-de-planches` | intérieur — Palier et escalier de planches, porte épaisse, fenêtre ouverte sur la nuit. | nuit, planches humides | marche-d-ombrefiel / ald-auberge-etage-et-combles |
| `interieur-modeste-chaumiere` | extérieur — Chaumière de terre et de chaume, bouquets d’herbes séchées, lueur verte par la porte. | fin de jour, herbes séchées | le-medaillon-de-la-soeur-endormie / chaumiere-de-la-vieille-mahaut |
| `interieur-modeste-foyer-et-table` | intérieur — Intérieur de chaumière : âtre de pierre et marmite, table rustique et deux tabourets, rouet, herbes aux poutres. | feu doux, pièce unique | lot decors-generiques-1 |

#### Cave ou grenier (`cave-ou-grenier`) — 3 en réserve

| Id | Vu | Ambiance | Origine |
| --- | --- | --- | --- |
| `cave-tonneaux-et-bocaux` | intérieur — Cave voûtée : tonneaux, étagères de bocaux, baquet d’eau. | lanterne, humidité | dime-des-roseaux / mir-cave-de-l-auberge |
| `grenier-sur-pilotis` | extérieur — Grenier de planches sur pilotis, toit de chaume, sacs au pied. | ciel bas, chaume mouillé | dime-des-roseaux / mir-grenier |
| `grenier-poutres-et-sacs` | intérieur — Grenier sous les poutres : sacs de grain, bottes de foin, échelle de bois, poussière dans un rai de lumière. | rai de soleil poussiéreux | lot decors-generiques-1 |

#### Place du village (`place-du-village`) — 3 en réserve

| Id | Vu | Ambiance | Origine |
| --- | --- | --- | --- |
| `place-village-puits-et-barques` | extérieur — Village de chaume autour d’un puits, barques tirées sur la rive, fumées de cheminées. | crépuscule, fumée | dime-des-roseaux / mireval |
| `place-cour-au-puits` | extérieur — Cour de ferme boueuse : puits à treuil, écurie et forge au fond, palissade de bois. | sol boueux, ciel couvert | marche-d-ombrefiel / ald-auberge-cour-et-ecuries |
| `place-fontaine-et-arbre` | extérieur — Place de village : fontaine de pierre, vieil arbre, maisons à colombages aux volets, panneau d’affichage. | matin clair | lot decors-generiques-1 |

### Types incomplets (généré)

Tous les types ont leurs 3 variantes.

### Où les décors servent (généré d'après les manifestes)

Aucun épisode ne cite encore `commun:lieux/…`.

<!-- FIN-GENERE -->
