# Bible de La Citadelle des Marées (canon)

Document de référence pour tous ceux qui écrivent des données de ce monde. **Les identifiants du registre (§7) sont fixes** : les zones s'y réfèrent entre elles. Ne rien inventer qui contredise ce canon.

## 1. Pitch

Sur la Côte de Hautmarée, un promontoire de falaises porte la **Citadelle des Marées**, un monastère-observatoire dont les cartographes dressent, depuis des siècles, la carte des marées. Un groupe d'aventuriers, surpris par une tempête sur la route des falaises, y trouve refuge pour la nuit. Mais cette nuit n'est pas comme les autres : la mer s'est retirée trop loin, trop longtemps, et les cartographes se taisent. Dame Ysmène Hautecôte, la plus vieille d'entre eux, élève depuis seize ans une apprentie nommée **Nolwen**, trouvée bébé dans une barque à la dérive, une marque pâle sur l'épaule. La **Grande Marée** arrive dans trois jours, et avec elle des émissaires venus de sous la mer, qui réclament Nolwen. Après la mort d'Ysmène, c'est au groupe d'escorter la jeune fille jusqu'à **Port-aux-Cordes** et de décider ce qu'on doit à la mer.

**Ton** : mélancolique et maritime, sobre ; espoir dans les petits gestes (une lampe allumée, une carte partagée), humour sec, choix qui coûtent. **Esthétique** : gris ardoise, vert-de-gris, ambre des phares, blanc d'écume, bleu nuit ; cuivre patiné, cartes anciennes, brume, pierre mouillée.

## 2. Ce qui s'est vraiment passé (secret, révélé par morceaux)

- **Lothmar** était un royaume côtier, riche et fier, protégé de la mer par le **Pacte des Marées**. À chaque génération, la Couronne donnait à la mer un **Sceau** : un enfant du sang royal, marqué à la naissance de la **marque de basse-mer** (une tache pâle en forme de vague sur l'épaule). À seize ans, le Sceau descendait à marée basse jusqu'au Palais-Basmarée et « tenait la mer » : il y demeurait, vivant et lié, et les flots ne dépassaient plus la ligne de la côte.
- Il y a trois cents ans, la **Régente Aelis Corvane** devait livrer son propre fils. Elle refusa : elle le fit passer en secret dans une barque vers le nord. Privée de son Sceau, la mer monta en une seule nuit, la **Nuit Haute**, et engloutit Lothmar. La Cour se noya.
- Mais le pacte n'était brisé qu'à demi : **la Cour ne repose pas**. Elle « tient » sous les flots, liée, sans sommeil, tant qu'un Sceau n'a pas pris sa place. Les noyés ne sont ni fous ni cruels : ils sont fidèles, épuisés, et ils veulent **cesser de tenir**.
- À chaque génération renaît, dans la lignée dispersée de Lothmar, un enfant marqué. La Cour le cherche à seize ans. Les autres Sceaux ont été retrouvés ; celui de cette génération est **Nolwen**. Les cartes de marée de la Citadelle, minutieusement tenues, **brouillent la marque** : c'est pourquoi la Cour a mis seize ans à la trouver.
- La Cour est **divisée**. Le **Chancelier Orvald** veut **relever Lothmar** : un Sceau consentant, couronné, et le royaume remonte, vivant, quoi qu'il en coûte à la côte. La **Dame Noyée** (la Régente Aelis, devenue fantôme) veut **mettre fin au pacte** : elle sait que la **Pierre de rupture**, cachée au Palais, peut briser le Sceau et laisser enfin les noyés reposer, au prix d'une mer redevenue libre. Le **Héraut Blême**, émissaire du Chancelier, est celui qui vient chercher Nolwen.
- **Dame Ysmène** a trouvé le bébé, compris ce qu'il portait, et tenu les cartes pour le cacher. Elle sait pour la Cour ; elle ignore le coût réel du pacte. Elle meurt sur la chaussée des Basses-Eaux, en retenant le Héraut pour que le groupe fuie.
- Le **Prieur Anselme Vareuil**, chef de la Citadelle, sait la vérité depuis des années. Il croit sincèrement qu'il vaut mieux **livrer une enfant** que laisser la côte se noyer : il n'est pas méchant, il a fait ses comptes. La **Ligue des Phares**, l'autorité des ports, connaît la légende ; elle veut **enfermer le Sceau** dans un phare-cellule scellé, pour que la mer n'ait personne à réclamer. Les **Rats de quai**, contrebandiers de Port-aux-Cordes, vendent des passages et surveillent la côte ; l'un d'eux est payé par le Chancelier pour signaler toute jeune fille marquée.
- **Le coût caché** : le Sceau n'est pas « honoré », il est **emprisonné** : il demeure sous la mer, vivant, sans retour, et ce que la mer retient, elle le prend aussi à la côte (les noyés des naufrages ne remontent jamais).

## 3. Les fins

1. **Le Sceau renoué** (`choix-renouer`) : Nolwen descend d'elle-même au Palais et reprend le pacte. La mer s'apaise, la côte est sauvée, la Cour repose enfin… et Nolwen ne reviendra pas. *Coût* : une enfant, vivante, perdue pour le monde de la lumière. *Possible grâce à* : `f-pacte-des-marees`, `f-nolwen-est-le-sceau`.
2. **Le Sceau brisé** (`choix-briser`) : la Pierre de rupture détruit la marque. Les noyés reposent, Nolwen est libre et vit. Mais la mer n'est plus tenue : les Grandes Marées reviendront, la côte devra reculer, la Citadelle sera abandonnée. *Coût* : la côte telle qu'on la connaît. *Possible grâce à* : `f-pierre-de-rupture`, la Dame Noyée.
3. **Lothmar relevée** (`choix-relever`) : Nolwen est couronnée. Lothmar remonte, ses nobles reviennent à la vie, la mer se retire… et avec elle disparaissent Port-aux-Cordes et les villages de la baie, engloutis à leur place. *Coût* : une ville, et une cour aux mains pleines de morts qui exigeront leur dû. *Possible grâce à* : le Chancelier Orvald.
4. **L'enfant à la Ligue** (`choix-livrer`) : Nolwen est confiée au phare-cellule. La côte est protégée, l'ordre revient… pour un temps : la mer ronge la cellule, et l'enfant y vieillira seule. *Coût* : la liberté de Nolwen, et une solution qui ne durera pas. *Possible grâce à* : `f-ligue-et-phare-cellule`.
5. **Fin d'échec** : la Grande Marée engloutit Port-aux-Cordes (jauge à 5). Le groupe survit, la côte non.

## 4. La jauge de Marée

Identifiant `maree`, de 0 à 5, départ 1. Elle monte d'un cran à chaque repos long (le temps passe ; la Grande Marée approche) et à certains mauvais choix (laisser un habitant sans abri, trahir un allié) ; elle baisse quand les fanaux de la côte sont rallumés (quête `q-citadelle-les-fanaux`) ou quand un allié ferme une brèche. Paliers : **2** (des noyés marchent au pied de la falaise ; premiers signes), **3** (la mer découvre la chaussée des Basses-Eaux : le Héraut paraît, c'est la nuit du départ), **4** (Port-aux-Cordes : ruelles inondées, noyés à marée basse, la Ligue ferme le port), **5** (la Grande Marée engloutit le port : fin d'échec).

## 5. Factions (identifiants fixes)

| id | Faction | Veut | Chef |
| --- | --- | --- | --- |
| `cartographes` | Les cartographes de la Citadelle | Protéger Nolwen, garder le pacte secret | `ysmene-hautecote` (puis `prieur-anselme-vareuil`) |
| `ligue-des-phares` | La Ligue des Phares | Tenir les ports, enfermer le Sceau dans un phare-cellule | `maitre-osric-vent` |
| `rats-de-quai` | Les Rats de quai | Vivre du passage et du secret, ne rien devoir à la Ligue | `mere-sorel-quaibas` |
| `cour-noyee` | Les noyés de Lothmar | Cesser de tenir : relever le royaume ou le laisser reposer | `chancelier-orvald-sel` / `dame-aelis-corvane` |

## 6. Les peuples et les espèces

- **Humains** : côtiers, cartographes, armateurs ; presque toute la Ligue. **Nains** : fanaliers, bâtisseurs de phares et de digues. **Elfes** : navigateurs, mémoire des marées, certains archivistes. **Gnomes** : instruments, horloges de marée, lentilles. **Halfelins** : cuisiniers, saunières du marais, passeurs. **Orcs** : dockers et calfats de Port-aux-Cordes. **Tieffelins** : marins mal vus, nombreux chez les Rats de quai. **Goliaths** : pêcheurs des hautes falaises, ils ont vu les premiers signes. **Drakéides** : lignée de Lothmar : plusieurs nobles noyés portent encore leurs écailles sous les coraux. Tout groupe, de toute espèce, est accueilli : la Citadelle ouvre ses portes à qui la tempête chasse.

## 7. Registre des identifiants fixes

### Lieux (arbre)

- `cote-de-hautmaree` — région (racine de tout)
  - `citadelle-des-marees` — forteresse-monastère, **hub et départ** (Z1). Sous-lieux préfixés `cit-` : `cit-porte-de-terre`, `cit-cour-des-vents`, `cit-grande-bibliotheque`, `cit-salle-des-cartes`, `cit-observatoire`, `cit-phare-archive`, `cit-refectoire`, `cit-dortoirs`, `cit-infirmerie`, `cit-bureau-du-prieur`, `cit-jardins-de-falaise`, `cit-quai-des-basses-eaux`, `cit-grille-de-mer`, `cit-caveaux` et d'autres
  - `route-des-falaises` — route (Z2) ; `marais-de-sel` — marais salants (Z2) ; autres lieux de Z2 préfixés `fal-` : `fal-phare-du-cap-mort`, `fal-epave-de-la-perle-grise`, `fal-brumevoile` (village de pêcheurs abandonné), `fal-grotte-des-marees`, `fal-cimetiere-des-naufrages`
  - `port-aux-cordes` — ville portuaire (Z3), sous-lieux `por-` : `por-quai-aux-cordes`, `por-taverne-du-hareng`, `por-entrepots-des-rats`, `por-hall-de-la-ligue`, `por-marche-aux-poissons`, `por-chapelle-des-noyes`, `por-cale-seche`, `por-phare-du-port`, `por-egouts-a-maree` et d'autres
  - `palais-basmaree` — donjon final (Z4), sous-lieux `lot-` : `lot-chaussee-des-basses-eaux`, `lot-parvis-des-noyes`, `lot-grande-salle`, `lot-salle-du-conseil`, `lot-bibliotheque-des-noms`, `lot-sanctuaire-du-sceau` (où l'on choisit), `lot-chapelle-de-la-regente` (la Pierre de rupture) et d'autres

### Personnages clés (créés par la zone indiquée)

| id | Qui | Zone, lieu |
| --- | --- | --- |
| `ysmene-hautecote` | Dame Ysmène, cartographe-mage, humaine, F, ~70 ans, **mentor** | Z1, `cit-salle-des-cartes` |
| `nolwen-brevemer` | Nolwen, apprentie cartographe, humaine, F, 16 ans, **le Sceau** (le groupe l'escorte ; elle n'est pas jouable : l'effet `escorte` la rend présente **partout où va le groupe**, sans événement de déplacement) | Z1, `cit-grande-bibliotheque` |
| `prieur-anselme-vareuil` | le Prieur, humain, M, ~55 ans | Z1, `cit-bureau-du-prieur` |
| `gudrun-lanterne` | maître fanalier de la Citadelle, naine, F | Z1, `cit-phare-archive` |
| `aldous-lindenvert` | bibliothécaire des marées, gnome, M | Z1, `cit-grande-bibliotheque` |
| `bertrane-mijotee` | cuisinière, halfeline, F | Z1, `cit-refectoire` |
| `quentin-salmier` | érudit de passage, **infiltré** de la Cour, humain, M | Z1, `cit-dortoirs` |
| `marthe-la-saniere` | saunière du marais, halfeline, F | Z2, `marais-de-sel` |
| `corentin-brumevoile` | pêcheur, dernier de son village, goliath, M | Z2, `fal-brumevoile` |
| `mere-sorel-quaibas` | cheffe des Rats de quai, tieffeline, F | Z3, `por-entrepots-des-rats` |
| `maitre-osric-vent` | Maître de la Ligue des Phares, humain, M | Z3, `por-hall-de-la-ligue` |
| `soeur-elwyn` | gardienne de la chapelle des noyés, elfe, F | Z3, `por-chapelle-des-noyes` |
| `joss-la-rame` | tavernier, orc, M, **espion du Chancelier** (à son insu pour certains) | Z3, `por-taverne-du-hareng` |
| `le-heraut-bleme` | Héraut du Chancelier, spectre en armure corallienne (en Z1 il n'est qu'une **rencontre et une narration** à la grille de mer, sans fiche PNJ ; la fiche PNJ est créée par Z4, au parvis des noyés) | Z4, `lot-parvis-des-noyes` |
| `dame-aelis-corvane` | la Régente, devenue la Dame Noyée, fantôme | Z4, `lot-chapelle-de-la-regente` |
| `chancelier-orvald-sel` | Chancelier de Lothmar, spectre, drakéide | Z4, `lot-salle-du-conseil` |

### Objets clés

`carte-des-marees-d-ysmene` (Z1 : la carte maîtresse, qui indique la route et brouille la marque), `fanal-de-poche` (Z1 : lanterne de phare portative qui tient les noyés à distance quelques minutes), `cle-des-eaux-basses` (Z3 : ouvre la grille de la chaussée), `sceau-de-la-ligue` (Z3 : laissez-passer du port), `pierre-de-rupture` (Z4 : brise le Sceau), `couronne-de-lothmar` (Z4 : ce que veut le Chancelier).

### Jauge, drapeaux, faits centraux

- Jauge : `maree`.
- Drapeaux (posés par les zones, lus par les quêtes) : `a-parle-a-ysmene`, `cit-signes-vus` (le groupe a vu deux signes de la mer), `cit-infiltre-demasque`, `cit-nuit-du-depart` (le Héraut paraît : fin du prologue), `ysmene-tombee`, `nolwen-avec-le-groupe`, `port-atteint`, `ligue-alliee`, `rats-allies`, `joss-demasque`, `chaussee-ouverte`, `palais-atteint`, `regente-rencontree`, `choix-renouer`, `choix-briser`, `choix-relever`, `choix-livrer`.
- Faits centraux (fichier `faits/faits-centraux.json`, écrit par Z5, révélés par les autres zones) : `f-pacte-des-marees`, `f-nuit-haute`, `f-lothmar-englouti`, `f-marque-de-basse-mer`, `f-nolwen-est-le-sceau`, `f-regente-a-cache-l-enfant`, `f-la-cour-tient-sous-la-mer`, `f-deux-cours`, `f-prieur-veut-livrer`, `f-ligue-et-phare-cellule`, `f-rats-vendent-les-passages`, `f-cartes-cachent-la-marque`, `f-chaussee-des-basses-eaux`, `f-pierre-de-rupture`, `f-le-sceau-est-prisonnier`, `f-grande-maree-dans-trois-jours`.

### Quêtes principales (créées par Z5)

`q-la-grande-maree` (principale, 9 étapes : `abri`, `signes`, `heraut`, `chaussee`, `port`, `alliance`, `basses-eaux`, `palais`, `choix`) ; de faction : `q-ligue-le-phare-cellule`, `q-rats-le-passage`, `q-regente-la-pierre`. **`q-citadelle-les-fanaux`** (rallumer trois fanaux de falaise avant la nuit ; l'étape finale baisse la jauge `maree` de 1) est créée par **Z1** (c'est Gudrun qui la donne). Les zones créent leurs propres quêtes secondaires `q-…` (préfixe de zone).

### Qui pose chaque drapeau (une seule zone par drapeau)

| Drapeau | Posé par | Comment |
| --- | --- | --- |
| `a-parle-a-ysmene` | Z1 | effet d'un sujet d'Ysmène |
| `cit-signes-vus` | Z1 | deux signes de la mer à découvrir (grille de mer, jardins de falaise : faits de lieu), puis événement `condition` |
| `cit-infiltre-demasque` | Z1 | résolution de la rencontre ou d'un sujet avec Quentin Salmier |
| `cit-nuit-du-depart` | Z1 | événement `condition` : `cit-signes-vus` **et** `cit-infiltre-demasque`, **ou** jauge `maree` ≥ 3 ; le Héraut paraît à la grille de mer ; **pose aussi** `nolwen-avec-le-groupe`, donne `carte-des-marees-d-ysmene` et `fanal-de-poche`, **fait escorter Nolwen** (effet `{"escorte": {"pnj": "nolwen-brevemer", "actif": true}}`) : elle est dès lors présente dans tous les lieux où va le groupe |
| `ysmene-tombee` | Z1 | événement de la route (après `cit-nuit-du-depart`) : Ysmène retient le Héraut sur la chaussée |
| `nolwen-avec-le-groupe` | Z1 | voir ci-dessus ; **aucune autre zone n'a à la déplacer** : elle suit le groupe. Z3 l'arrête (`escorte` avec `actif: false`, puis `deplacer` vers le phare-cellule) si le groupe choisit de la livrer |
| `port-atteint` | Z3 | événement `entree-lieu` à `port-aux-cordes` (une narration d'arrivée ; Nolwen est déjà avec le groupe) |
| `ligue-alliee`, `rats-allies` | Z3 | effets des quêtes `q-ligue-le-phare-cellule` et `q-rats-le-passage` (le groupe en choisit un) |
| `joss-demasque` | Z3 | sujet ou rencontre avec Joss la Rame |
| `chaussee-ouverte` | Z3 | utilisation de `cle-des-eaux-basses` à `por-cale-seche` : **Z4 déclare le lien** `palais-basmaree` ↔ `por-cale-seche` conditionné par ce drapeau |
| `choix-livrer` | Z3 | fin de `q-ligue-le-phare-cellule` : le groupe confie Nolwen à Maître Osric |
| `palais-atteint`, `regente-rencontree` | Z4 | événement `entree-lieu` ; sujet de la Dame Noyée |
| `choix-renouer` | **Z1** | sujet de **Nolwen** (son fichier est celui de Z1, qui écrit donc **tous** ses sujets, y compris ceux qui ne se débloquent que plus tard, par `condition` sur un lieu visité : `{"lieu": "fal-brumevoile"}`, `port-aux-cordes`, `palais-basmaree`, `lot-sanctuaire-du-sceau`) : « accepter le pacte », condition : sanctuaire visité et aucun autre choix posé |
| `choix-briser`, `choix-relever` | Z4 | sujets de la Dame Noyée (avec `pierre-de-rupture` dans le sac) et du Chancelier (avec `couronne-de-lothmar`), au **sanctuaire du Sceau** ou près de lui |

**Règle générale** : un agent n'écrit que ses fichiers ; une zone ne peut pas ajouter un sujet à un PNJ d'une autre zone. Les PNJ **créés par une zone** reçoivent **tous** leurs sujets de cette zone, même ceux qui réagissent à des lieux d'autres zones (conditions `lieu`, `flag`, `fait`).

La zone centrale (Z5) **lit** ces drapeaux (quête principale, fins) mais n'en pose aucun, sauf les paliers de jauge (événements `condition` sur `maree`).

### Rencontres

La nuit de l'infiltré (Citadelle, niveau 1), l'ombre sur la grille de mer (Citadelle, 1), les naufragés de la route (Z2, 1-2), les noyés du marais (Z2, 2), le cimetière des naufrages (Z2, 2), les égouts à marée (Port, 2-3), la Ligue en armes (Port, 3, évitable), la chaussée (3), le Palais : parvis, salle du conseil, sanctuaire (3).

## 8. Progression par niveau

Niveau 1 : la Citadelle (prologue : une nuit et un jour), route des falaises. Niveaux 1-2 : marais de sel, Brumevoile, phare du Cap-Mort. Niveaux 2-3 : Port-aux-Cordes, égouts à marée. Niveau 3 : chaussée des Basses-Eaux et Palais-Basmarée. Histoire courte : environ 15 heures.

## 9. Monstres disponibles (SRD, ids de profil)

Les noyés : `zombi`, `squelette`, `ame-en-peine`, `spectre`, `fantome`, `ombre`, `goule` (cimetière des naufrages). Le Héraut et les gardes du Palais : `armure-animee`, `garde-anime`, `spectre`. Les vivants : `bandit`, `chef-de-bande`, `eclaireur`, `garde`. Autres : `gargouille` (corniches de la Citadelle, du Palais), `nuee-de-rats`, `rat-geant` (égouts, caves), `loup` (falaises), `araignee-geante` (grottes du marais). Aucune créature marine dans le bestiaire : **la mer ne se montre jamais en entier, on ne voit que ses effets** (marée, noyés, brume). Les rencontres n'utilisent que ces profils ; d'autres pourront être extraits du SRD si besoin (les demander).
