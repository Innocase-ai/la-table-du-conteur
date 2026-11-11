# Audit de « La Marche d'Ombrefiel » en vue de son intégration au moteur

> 11/11/2026. Audit en lecture seule du dossier `D&D/la-marche-d-ombrefiel/` (aucun fichier de l'histoire n'a été modifié). Objectif : dire ce qu'il faut changer, ajouter ou décider pour que cette histoire devienne un monde jouable par La Table du Conteur (`packages/mondes/<id>/`, format décrit dans `docs/MONDES.md`).
>
> **Méthode.** Lecture complète par moi des documents racine (bible, piliers, factions, rêves et objets, architecture, données JSON, journal, schéma SQL), du README de la zone 1, de ses fiches PNJ et conteneurs, et de la zone 6 (README, combats, actions). Les 6 zones (126 + 84 + 70 + 62 + 61 + 57 Ko) ont ensuite été inventoriées en entier par six agents Haiku en lecture seule (consigne commune : `docs/audit-ombrefiel/CONSIGNE.md`), puis recoupées par moi. J'ai revérifié moi-même dans les fichiers une quinzaine des anomalies citées ci-dessous (toutes confirmées, numéros de ligne exacts) ; les inventaires bruts en annexe (`docs/audit-ombrefiel/zone-N.md`) n'ont **pas** été relus ligne à ligne.

## 1. Verdict

**Ce n'est pas importable en l'état, mais la matière est bonne et presque tout est convertible.** Il y a trois ensembles de travail, très inégaux :

| Ensemble | Gravité | Effort |
| --- | --- | --- |
| **Droits** : l'histoire est bâtie sur Forgotten Realms / Baldur's Gate (règle 1 du moteur : aucun nom d'un univers existant) | Bloquant pour la vente | Moyen, mécanique (table de renommage) |
| **Forme** : prose Markdown, identifiants incompatibles, monstres écrits à la main, quêtes sans étapes ni drapeaux, aucun fait | Bloquant pour le chargement | **Le gros du travail** |
| **Cohérence interne** : ≈ 200 écarts entre fichiers, dont des indices qui n'ont aucune source | À corriger avant ou pendant la conversion | Moyen, à faire zone par zone |

Les **mécaniques maison** (bris d'arme, rêves et pouvoirs innés, objets parlants, costume fusionné) n'ont aucun module du moteur : chacune est une décision (garder avec un module, simplifier, abandonner).

## 2. Ce que l'histoire contient, face au minimum du moteur

Le minimum de `docs/MONDES.md` est donné par chapitre de niveaux 1 à 5 ; l'histoire couvre 7 niveaux.

| Élément | Dans le dossier | Minimum moteur (par chapitre) | Écart |
| --- | --- | --- | --- |
| Lieux | 36 secteurs + ≈ 100 sous-lieux numérotés | 30 (dont 3 grottes, 1 donjon, 1 village ou ville) | Suffisant, mais aucun lien ni durée de trajet écrit comme tels |
| PNJ avec fiche | 33 (8 + 6 + 5 + 5 + 4 + 5) + ≈ 24 PNJ de rencontres décalées | 25 PNJ, 75 sujets | Des répliques verbatim (≈ 2 à 3 par PNJ), pas de **sujets** |
| Marchands | **0** (aucune zone n'a de boutique) | 3 | Manque |
| Compagnons | 2 recrutables (Varek, Mireille), tous deux en zone 1 | 3 | Non lus par le moteur (`Pnj.compagnon`), voir §5 |
| Quêtes | ≈ 40 lignes, dont une douzaine de vraies quêtes ; 5 sans donneur nommé en zone 1 ; zones 4 à 6 : une quête formelle par zone | 1 principale + 6 secondaires + 3 personnelles | Étapes, conditions et récompenses absentes presque partout |
| Conteneurs / trésors | 37, très bien décrits (DD, pièges, lignes de vue) | 25 trésors | Excellent, converti presque tel quel |
| Combats | ≈ 33 | 15 rencontres (dont 20 à 30 % sans combat) | Beaucoup de combats, peu d'alternatives (zone 3 : C-3.2 et C-3.5 n'en ont aucune) |
| Énigmes | 0 formelle (mots de passe, code FEROX) | 3 | Manque |
| **Faits** | **0** (les indices sont des objets et des phrases) | 40 | Manque : c'est ce que le conteur lit |
| Factions / jauge / fins | 3 factions ; jauge ITU en zone 6 seulement ; **3 dénouements** en zone 6 (triomphe, révolution, chute) | 4 / horloge globale / 2 fins | Manque : horloge globale et une fin pour la voie sombre ; les 3 dénouements sont à garder |
| Dilemmes | 2 (zone 1) | 3 par chapitre | Manque |

Points forts à conserver : conteneurs (serrure, DD, piège, ligne de vue), actions avec DD, PNJ avec voix, ton, rencontres décalées, la Joute oratoire (vote 7 sur 12) et l'ITU (jauge).

## 3. Bloquants

### 3.1 Droits et univers existant

Occurrences relevées dans le dossier (fichiers `.md`, `.json`, `.sql`) : **Cormyr** 26 (19 fichiers), **Baldur's Gate** 41 (34 fichiers), **Lathandre** 8, **Melf** (« Flèche Acide de Melf ») 5, **BioWare** 6, **Pantalon Doré** 10, **Tymora** 3, **Tarnesh** 3, **Minsc & Boo** 3, **Tasha** 3, **Bhaal** 1, **Côte des Épées** 2, **Mer des Étoiles Déchues** 2, **Suzail** (capitale du Cormyr) dans 3 fichiers, plus les clins d'œil de rencontres (« Noober », « Melicamp », « Borda »). Le moteur n'accepte que le SRD (règle d'écriture n° 1) ; la vente est visée.

À faire : une table de renommage (Cormyr, Haute-Garde et les dieux → noms originaux ; Lathandre et Tymora → deux dieux de l'univers choisi ; sorts → noms du SRD : *Flèche acide*, *Fou rire*, *Foulée brumeuse* sont dans le catalogue) ; retirer les références à Baldur's Gate et BioWare des documents du monde ; décider du sort du « Pantalon Doré », qui est une parodie directe d'un objet de Baldur's Gate 1. Je ne suis pas juriste : à faire confirmer avant la vente.

### 3.2 Les monstres : le moteur n'accepte que ceux du SRD

`docs/MONDES.md` et la décision du 06/11 (« monstres dans le moteur, jamais dans une histoire ») interdisent les profils maison. L'histoire en écrit une dizaine de blocs par zone. **Tous les adversaires ont un équivalent dans le catalogue** (329 profils) ; le PNJ nommé garde son nom (`monstres[].nom`) mais prend les statistiques du profil. Correspondance proposée (FP du catalogue) :

| Dans l'histoire (FP annoncé) | Profil SRD | Remarques |
| --- | --- | --- |
| Pillards, bandits maraudeurs, bandits de la Cour (1/8) | `bandit` (1/8) | OK |
| Molosses de guerre (1/8), Bave-de-Loup | `molosse` (1/8) | OK |
| Kobolds (1/8), apprentis, suiveurs | `combattant-kobold` (1/8) | « Poseur de bombes » : kobold + piège |
| Guetteurs et archers gobelins (1/4) | `combattant-gobelin` (1/4) | OK |
| Vieux Baloo (« 1-2 ») | `ours-brun` (1) | Écrire FP 1 |
| Demi-Dent (1/2), Grrrak (1), Garrash (1) | `chef-gobelin` (1), `combattant-gobelours` (1) | FP annoncé à corriger |
| Keldan le Pâle (arcaniste, 1/2) | aucun lanceur FP 1/2 | `acolyte` (1/4) ou `fanatique-de-secte` (2) ; **retirer *Sommeil* au niveau 1** (voir §4) |
| Capitaine Durn (1), miliciens (1/2) | `gros-bras` (1/2), `garde` (1/8), `chef-de-bande` (2) | |
| Davor (2), Malakar (5) | `fanatique-de-secte` (2), `mage` (6) | Malakar monte d'un FP |
| Tireurs d'élite, traqueurs, arbalétriers (1/4 à 1/2) | `eclaireur` (1/2) | |
| Méphites de boue (1/4) | `mephite-vaporeux` (1/4) | La boue n'existe pas au catalogue |
| Éventreur (lézard géant, 1), sangsue géante (1) | `crapaud-geant` (1) ou `lezard-geant` (1/4) | À trancher |
| Vendra la Fileuse (2) | `ettercap` (2) | + `araignee-geante` (FP **1**, 200 PX : l'histoire donne 100) |
| Kromar (3), Kaelen (3) | `chevalier` (3) | |
| Brise-Crâne (1/2) | `worg` (1/2) | |
| Morga la Sanglante (2) | `guenaude-marine` (2) | |
| Zombies (1/4) | `zombi` (1/4) | |
| Crocodiles géants « de combat » (1) | `crocodile` (1/2) | `crocodile-geant` est FP **5** |
| Mercenaires, gardes corrompus, superviseurs | `garde` (1/8), `gros-bras` (1/2), `veteran` (**3**) | L'histoire écrit « vétéran FP 1 » : le SRD dit 3 |
| Darek l'Enclume (4) | `chef-gros-bras` (4) | |
| Gargouilles (2), Spectre (1), Ombres (1/2), Wyvernes | `gargouille`, `spectre`, `ombre`, `vouivre` (6) | Les wyvernes n'ont ni bloc ni FP : **FP 6 pour un groupe de niveau 5** |
| Barthélemy, golem de suie (3) | aucun | `golem-de-chair` (5) ou une `armure-animee` (1) |
| Rats crâniens, vase grise | `rat-geant` (1/8) / `nuee-de-rats` (1/4), `vase-grise` (1/2) | |
| Général Vane (5), Chevaliers (2) | `gladiateur` (5), `chevalier` (3) | |
| Chef Masqué (6) | `mage` (6) | + masque d'Onyx en objet ; la régénération et le bris du masque sont du scénario, pas du profil |

Conséquence : **tous les XP écrits à la main disparaissent** (le moteur les calcule d'après les profils) ; ils sont de toute façon faux. Exemples vérifiés : Vane (FP 5 = 1 800 PX) + 4 chevaliers annoncés 1 500 PX au total ; Chef Masqué (FP 6 = 2 300) annoncé 1 800 ; chaque zone annonce un total qui diffère de la somme de ses lignes (Z2 : 1 800 / 1 950 / 1 850 ; Z3 : 2 400 / 2 600 ; Z4 : 3 200 / 3 300 ; Z5 : 4 200 / 4 900 ; Z6 : 5 500 / 5 950).

### 3.3 La forme des données

- **Identifiants** : les conteneurs sont « C1 à C8 » (fiches), « C-1.2 » (`quests.json`), « 2D » (document des objets insolites) ; en zones 2 à 6 les mêmes numéros « C-4.1 à C-4.5 » servent à la fois à des conteneurs et à des combats. Le moteur veut des ids kebab-case uniques par type, lieux préfixés par leur zone.
- **Noms de lieux** qui dérivent entre fichiers (Z4 : « Tertre des Trois Crânes » dans `zones.json`, « tertre-sorcière » dans la carte ; Z5 : « Cour d'Obsidienne » / « Cour des Gargouilles » ; « Garnison du Lion » / « Quartiers des mercenaires »).
- **`quests.json`** : 32 entrées sans étapes, drapeaux, conditions ni récompenses ; des donneurs qui ne sont pas des PNJ (« Coffre C-1.2 », « Intrigue Principale », « Climax Absolu », « Cellules de la Tour »). Or le moteur exige un `donneur` PNJ, des étapes qui s'achèvent d'elles-mêmes et (règle du 11/11) une **étape de retour au donneur** : sur ≈ 40 lignes de quêtes, **4 seulement** disent à qui et où la rendre (Brégor, Martha, Prime sur Demi-Dent vers Brégor, et en partie Mireille).
- **Aucun fait** (`faits/`), aucune condition (`flag`, `fait`, `etape`…) : les indices sont des objets et des phrases. Le moteur raconte à partir de faits.
- **Cartes** : les liens des galeries sont des chemins absolus vers un ancien dossier (`file:///…/mind-maps/…`), les images de zone 1 sont en JPG, celles des zones 3 à 6 en SVG ; les grilles tactiques de combat du moteur (cases `H`, `m`, `T R e b n r t c`) n'existent pas (les plans sont des illustrations). 42 liens Markdown sont cassés.
- **Dialogues** : l'architecture prévoit des nœuds à choix ; le moteur travaille par **sujets** (question du joueur, mots, réponse, faits révélés, effets). Les répliques verbatim se convertissent en réponses de sujets, avec les secrets ouverts par attitude, jet ou condition.

## 4. Équilibre et niveaux

- **Progression** : les piliers disent « une zone franchie = un niveau » (jalons) ; les fiches annoncent des XP « pour le MD ». Le moteur calcule des PX (seuils du SRD) et sait donner un effet `xp`. À la lettre, ≈ 18 000 PX (journal) laissent le groupe vers le niveau 6 et non 7 (seuil 23 000). **Décision à prendre** : jalons, rendus par un effet `xp` de fin de zone, ou PX calculés.
- **Trois tables de niveaux** qui divergent : zones (1-2, 2-3, 2-4, 3-5, 4-6, 5-7), jalons (fin de zone : 2, 3, 4, 5, 6, 7), rêves (3-4 pour la forêt, 4-5 marais…).
- **Niveau 1 trop dur** : Keldan lance *Sommeil* sur un groupe de niveau 1 ; le Vieux Baloo est écrit « mortel » ; la Spatha de Bronze (seule arme immunisée) est unique pour 4 à 6 héros.
- **Groupe** : le moteur adapte à 4 ou 6 héros ; les combats sont écrits « pour un groupe de 4 », avec des effectifs qui changent d'un fichier à l'autre (tireurs du pont de la forêt 1 ou 2 ; loups du chenil 4 ou 2 ; garnison 8 miliciens annoncés pour 2 blocs).
- **Combats sans issue** : zone 3 C-3.2, C-3.5 (« Kromar ne fuit jamais »), zone 4 C-4.1 et C-4.2 : le moteur avertit d'un combat « élevé » sans alternative.

## 5. Les mécaniques maison, une par une

| Mécanique | Dans l'histoire | Moteur | Proposition |
| --- | --- | --- | --- |
| **Bris d'arme** (1 naturel au d20 ; 1 ou 2 dans les marais ; ou « au premier coup », zone 1 `CR:41` contre `CR:3`) | Pilier central | Aucun module | Très coûteux : un groupe de 4 qui fait 20 attaques casse une arme dans 64 % des combats (88 % dans les marais). Si on le garde : module d'usure, et arme **ébréchée** (−1 jusqu'à réparation) plutôt que détruite ; trancher d'abord la règle (deux versions s'opposent en zone 1) |
| **Rêves et pouvoirs innés** (12 rêves, une voie lumineuse ou sombre par zone) | Document seul : **aucune zone ne contient de déclencheur, de drapeau ni de choix** | Aucun | Module à écrire, ou transposer en `scenes` (cinématiques) + pouvoirs en objets à charges (non lus par le moteur : `usage.type = "charges"`). Les pouvoirs sombres sont strictement plus forts (+10 dégâts, 2d8 vampirique) : à rééquilibrer ; aucune fin « sombre » ne suit en zone 6 |
| **Indice de Tension Urbaine** (zone 6) | 1 à 10, 4 paliers | **Oui : `jauges`** | Convertir tel quel ; ajouter une horloge globale pour toute l'histoire (la crise du fer n'est pas comptée) |
| **Joute oratoire** (7 voix sur 12) | Zone 6 | Partiel : rencontre sociale à `alternatives` + drapeaux, ou dilemme | Écrire en 3 preuves à drapeaux ; le texte dit « au moins 4 preuves » alors que la joute n'en propose que 3 (`liens-inter-zones.md:55`) |
| **Objets parlants / à pouvoir** (dague Langue-d'Acier, bottes de saut, chope, costume impérial fusionné de 3 pièces) | `systeme-reves-et-objets-insolites.md` seul : **non placés dans les zones** (C4 ne contient pas le pantalon, C7 pas les bottes, C8 pas la dague) | `Objet` avec bonus et usage ; pas de fusion | Les placer d'abord ; la fusion = un service de PNJ (`services`) qui retire trois objets et en donne un |
| **Compagnons recrutables** (Varek, Mireille, Elian, Corwin…) | Recrutement + quête personnelle | `Pnj.compagnon` **non lu** ; `escorte` fonctionne | Passer par `escorte` + interjections ; décider s'ils existent à côté d'un groupe de 4 à 6 héros créés par le joueur |
| **Moral des monstres, torches 1 chance sur 6, boue = terrain difficile, visibilité 30 m** | Règles d'environnement | Non | Terrain de combat (`T R e b n r t c`) pour la boue ; le reste à abandonner ou à décrire |
| **Boutiques** | Aucune | `boutique`, `services` | Au moins 3 marchands à créer (aucune zone n'en a) |

## 6. Cohérence interne (écarts relevés, vérifiés par sondage)

Les inventaires comptent ≈ 220 entrées de contradictions ou d'éléments manquants (55 en zone 1, 36 en zone 2, 44 en zone 3, 32 en zone 4, 28 en zone 5, 24 en zone 6) ; une partie sont de simples écarts de chiffres. Les plus graves :

**Indices et pièces à conviction sans source ou à sources multiples (chaîne causale cassée)**

| Indice | Problème | Où |
| --- | --- | --- |
| Mot de passe de Mère Margot (« Le moulin d'Aldric tourne même sans vent ») | « Confié par Dame Greta en Z1 » : Greta est en **zone 2** et ne le donne nulle part | Z6 `actions-interactives.md:50` |
| Code « FEROX » (coffre de Sévérus) | Trois origines : « sur le Général Vane » (`lieux-detailles.md:80`), « bague de Kaelen en Z5 » (`actions:91`), bague du Chef Masqué (`liens:44`) ; **aucun fichier de la zone 5 ne le contient** | Z6 / Z5 |
| Laissez-passer de Kaelen « saisi en Z5 » | Absent de la zone 5 | Z6 `actions:25` |
| Acide corrosif | Produit à la Tour d'Onyx (Z1 `liens:80`), par le Lion d'Acier de Haute-Garde (Z1 `fiches:121`), puis par Davor (Z2) | Z1, Z2 |
| Ordre militaire de Vane | « Ordre de mobilisation » dans un « bureau de Malakar » **qui n'existe pas** (`liens:48`) ; « Ordre de Déploiement » dans le coffre de Kaelen (`fiches:102`) | Z5 |
| Lettre d'Hildegarde | Trois provenances : corbeau, secrétaire, coffre | Z3 |
| Lingots volés | Sceau d'Aldric (`lieux:110`) ou léopard du Cormyr (`fiches:56`, `actions:77`) | Z3 |
| Coffre-fort de Darek | Contenu de `actions:73` ≠ `fiches:76-78` (ceinturon, 320 pa, Grand Livre) | Z4 |
| Journal qui mène à la zone 3 | Dans un coffre **optionnel** (Z2 C-2.4) : si le groupe ne l'ouvre pas, l'enquête s'arrête | Z2 |
| Hildegarde, forgeron évadé, fille de Korgan, « notes techniques de Darek » | Annoncés, jamais écrits (pas de fiche, pas de lieu) | Z4, Z2 |
| Le méchant final, Valerius | Nommé **une fois** avant la zone 6 (zone 5) ; Sévérus jamais avant la zone 6 | Z1 à Z5 |

**Contradictions de contenu**

- **Zone 1** : le chariot d'Aldous est à 500 m (`README:198`) ou 40 m (`C4`) ; le coffret a quatre contenus selon le fichier ; le carnet de Silas existe en deux versions ; la prime sur Demi-Dent a trois donneurs ; stats de Keldan (14 ou 15 PV), Baloo (CA 11 ou 12), Demi-Dent (masse 1d6 ou 1d8) ; 5 quêtes sans donneur ; mot de passe « La Serre ne plie point » exigé au Moulin sans que le Moulin le prévoie.
- **Zone 2** : Harken emprisonné pour **quatre motifs** ; l'ordre de Durn en trois versions ; or et ordres tantôt du Lion d'Acier tantôt de la Griffe Noire ; piège du coffre de Davor (acide ou moutarde) ; Marteau du Brise-Roc à deux emplacements et deux effets ; garnison de 8 miliciens pour 2 blocs.
- **Zone 3** : tireurs du pont (1 ou 2, 11 ou 18 PV) ; marteau de Harken annoncé, jamais utilisé.
- **Zone 4** : chaudron de Morga (détruit les zombies dans `actions:43`, n'annule que sa régénération dans `combats:64`).
- **Zone 5** : Sceptre de Conductivité à trois effets (`lieux:60`, `fiches:88`, `actions:84`) ; l'alambic se « relie » (`actions:89`) ou se « découple » (`combats:107`) ; dégâts à Malakar 3d10, 4d10 ou 4d8 ; combinaison du coffre C-5.5 absente.
- **Zone 6** : Brisure du masque DD 14 (`actions:131`) ou DD 16 (`fiches:138`) ; sortie secrète du palais (réserve, cave, cuisines) ; le Bastion n'a aucun accès écrit ; PV de Vane (85) et du Chef Masqué (95) ≠ leurs dés (90 et 91).

**Éléments absents dans chaque zone** : lieu de repos sûr (zones 2 à 6 : aucun), marchand (aucun), énigme, règle d'argent, fiche de plusieurs PNJ cités, bloc d'adversaires nommés dans les actions.

## 7. Plan de conversion proposé

Ordre qui réduit le risque (chaque étape se valide avec `pnpm monde valider`) :

1. **Décisions** (voir §8) : univers original, bris d'arme, rêves, progression, compagnons, découpage de l'histoire.
2. **Canon** : une `BIBLE.md` fusionnant bible, piliers et factions avec le registre des identifiants (skill `creer-monde`), le **secret mis à plat** et la chaîne des indices **réparée** (§6 : la source de chaque indice, une par zone au plus tôt ; le Doyen visible dès la zone 1, `docs/ECRIRE-UNE-HISTOIRE.md` §9 « antagoniste absent jusqu'au dernier acte »).
3. **Atlas des lieux** avec liens, durées de trajet, lieux de repos et marchands (skill `decrire-lieux`) : combler les trous du §2.
4. **Zone pilote : la zone 1** (la plus complète et la plus saine) convertie de bout en bout : lieux, PNJ à sujets, conteneurs en trésors, combats en rencontres SRD, quêtes à étapes avec retour au donneur, faits. Mesure l'effort réel avant de faire les cinq autres.
5. **Zones 2 à 6** : un agent par zone (recopie de l'atlas), puis enrichissement dans l'ordre du skill : contrats, rencontres et alternatives, pièges et trésors, savoirs, dilemmes puis salutations variables, examens et codex.
6. **Modules** seulement si la décision du §8 le demande : usure d'arme, rêves et pouvoirs (skill `ajouter-module`).
7. **Prouver** : `pnpm monde valider` à 0 erreur, `pnpm monde parcours` (chaque fin atteignable), puis cartes, images, scènes et voix **après accord sur les coûts**.

Taille indicative : le dossier fait 470 Ko de prose ; le monde Val des Cendres (63 PNJ, 378 sujets) en est l'ordre de grandeur. Je ne chiffre pas en temps ; la zone pilote donnera le vrai rapport entre prose et données.

## 8. Décisions à prendre avec vous

1. **Univers** (✔ décidé le 11/11 : univers original ; table validée le 11/11 : `docs/RENOMMAGE-MARCHE-D-OMBREFIEL.md`) : renommer tout ce qui vient de Forgotten Realms / Baldur's Gate (§3.1) et adopter un cadre original ; garder ou non le « Pantalon Doré ».
2. **Une histoire ou un morceau d'Ombresang ?** (✔ décidé le 11/11 : monde à part, id `marche-d-ombrefiel`) Ombresang est déjà conçu comme un grand jeu à la Baldur's Gate 1 (centaines de petites histoires, groupe persistant). Cette histoire est un module linéaire de niveaux 1 à 7. Soit un monde à part, soit une histoire publiée dans le cadre d'Ombresang (la zone 1 conviendrait au niveau 1).
3. **Bris d'arme** (✔ décidé le 11/11 : option B, **arme ébréchée** : 1 naturel sur une arme de fer non magique = −1 au toucher, cumul plafonné à −2, réparée chez un forgeron ; armes anciennes, en bronze ou magiques immunisées ; petit module à écrire à la conversion, scènes de sabotage écrites en plus).
4. **Rêves et pouvoirs innés** (✔ décidé le 11/11 : option A seule, **rêves narratifs** : une scène par zone jouée au lendemain du dilemme, jauge « Voie » lumineuse/sombre, une vraie **fin sombre** en zone 6, salutations qui changent ; **aucun pouvoir de combat**, pas de module ; déclenchement « au lendemain » à confirmer à la conversion).
5. **Progression** (✔ décidé le 11/11 : option B, **PX calculés par le moteur**, rencontres et récompenses de quête réglées pour retomber sur les cibles : fin de zone 1 = niveau 2 (300 PX), 2 = niveau 3 (900), 3 = niveau 4 (2 700), 4 = niveau 5 (6 500), 5 = niveau 6 (14 000), 6 = niveau 7 (23 000) ; contrôlé par l'avis « PX » du validateur ; jalons stricts possibles plus tard par un petit module).
6. **Compagnons** (✔ décidé le 11/11 : option A, **compagnons qui voyagent mais ne combattent pas** : effet `escorte`, interjections, quête personnelle liée à la confiance, confidences verrouillées ; Varek et Mireille dès la zone 1 ; les quêtes « L'Honneur de Brise-Roc » et « Le Baume de l'Aube » deviennent leurs quêtes personnelles avec retour au donneur ; Mireille peut offrir un service de soins ; aucun compagnon jouable).
7. **Lieu d'écriture** (✔ décidé le 11/11 : monde converti dans `packages/mondes/marche-d-ombrefiel/` créé par `pnpm monde nouveau` en statut `brouillon` ; dossier d'origine `D&D/la-marche-d-ombrefiel/` intact, lu en lecture seule par les agents ; documents de pilotage dans `crpg-llm/docs/` ; Drive réservé au contenu non technique, sans y toucher sans demande).

## 9. Annexes

- Consigne donnée aux agents : `docs/audit-ombrefiel/CONSIGNE.md`.
- Inventaires bruts par zone (lieux, PNJ, quêtes, indices, conteneurs, combats, actions, règles maison, noms extérieurs, contradictions, manques, chiffres) : `docs/audit-ombrefiel/zone-1.md` à `zone-6.md` (agents Haiku ; chaque ligne porte sa source `fichier:ligne`). À utiliser comme base de travail pour la conversion, après relecture.
- Catalogue de monstres du SRD utilisé pour la correspondance : `packages/donnees/srd/monstres/` (329 profils).
