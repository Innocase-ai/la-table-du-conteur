---
name: creer-monde
description: Construire un nouveau monde (une histoire jouable) pour le CRPG de ce dépôt, au format de docs/MONDES.md. Depuis le cap du 15/11/2026, c'est un ÉPISODE court de la saga (lieu de départ dense de 10 à 13 pièces, 3 à 8 quêtes, un niveau, butin plafonné), conçu dans la Forge d'Histoires, validé par l'utilisateur à chaque étape V1 à V8, écrit par des agents Haiku et vérifié par le profil « épisode » du validateur. À utiliser dès que l'utilisateur veut créer, écrire, concevoir ou étendre un monde, une histoire, un épisode, une campagne, un scénario, un chapitre, un donjon, une ville ou une aventure pour ce jeu (« un nouveau monde », « une autre histoire », « le prochain épisode », « on fait un monde de pirates », « écris-moi un scénario »), même si l'utilisateur ne parle pas de « monde » ni de « skill ». C'est le chef d'orchestre : il fixe l'ordre de production et renvoie aux skills spécialisés `decrire-lieux`, `creer-intrigue`, `creer-personnages`, `creer-marchands-compagnons`, `creer-rencontres`, `creer-contrats`, `creer-pieges-tresors`, `creer-dilemmes`, `creer-evenements-choix` et `enigmes`.
---

# Créer un monde pour le CRPG

Un monde est un dossier de données (`packages/mondes/<id>/`) lu par le même moteur que tous les autres : lieux, PNJ, trésors, rencontres, énigmes, pièges, quêtes, factions, jauges, fins, et les dossiers de modules (`scenes/`, `dilemmes/`, `evenements-choix/`, `examens/`, `savoirs/`…). Écrire un monde, c'est écrire des données **cohérentes entre elles** ; la difficulté n'est pas la quantité de texte, c'est que plusieurs auteurs (ici des agents) produisent un tout qui se tient. Tout ce skill sert cette cohérence : un **canon** écrit d'abord, un **registre d'identifiants fixes** que chacun respecte, un **validateur** et un **auditeur** qui attrapent ce qui dérive.

**Les références** (`packages/mondes/`) :
- **Le Médaillon de la Sœur Endormie** (brouillon, niveaux 1-2) : le premier épisode conçu dans la Forge, le modèle du chemin décrit ici (lieux de quête qui se découvrent, enquête, PNJ à 5 ou 6 sujets, boutiques et chambre, boss).
- **La Marche d'Ombrefiel**, **La Dîme des Roseaux** et **La Tombe des Rois Serpents** (publiées) : écrites selon l'ancien modèle de grande histoire (annexe), elles ne seront plus proposées au joueur et restent des jeux d'essai et des références de style (textes riches, quête en enquête de la Tombe, Fort découpé en pièces).
- Les anciennes histoires **Le Val des Cendres**, **La Citadelle des Marées** et **Port-Sillage** (`packages/regles/tests/fixtures/mondes/`, sans images) : relis leur `BIBLE.md` et `GUIDE-ZONE.md` pour le niveau de détail attendu. Ombresang (même dossier) est un grand monde abandonné le 15/11/2026 : ne pas le prendre pour modèle.

## Le format : un épisode de la saga (cap du 15/11/2026)

Le produit est une **saga d'épisodes courts et indépendants** (`docs/PRD-SAGA.md`, à lire avant tout chantier d'histoire), avec les mêmes héros et un niveau par épisode. La « saison 1 » couvre les niveaux 1 à 5. Un épisode :
- **un lieu de départ dense**, écrit à la main : un village, un quartier ou un château d'environ **10 à 13 pièces visitables**, chacune avec une image et quelque chose à faire. Gabarit (PRD F2) : 4 bâtiments d'une pièce, une taverne de 2 ou 3 pièces avec une chambre qui est un service de repos, un sanctuaire d'une pièce avec un soigneur, la maison du chef en 2 ou 3 pièces, un marchand. Le barème est indicatif : 2 à 4 « couches » par pièce parmi PNJ, contenant, verrou ou piège, adversaire avec butin, service, objet ; pas toutes les couches partout ;
- **2 à 4 sites de quête** ;
- **3 à 8 quêtes, dont une seule principale** (le fil rouge). L'épisode 1 est plus court : 2 ou 3 quêtes, 2 ou 3 combats. **Pas de quête personnelle ni de faction autonome**, en faire des secondaires. Une quête a l'un des quatre buts **tuer, trouver, apporter, libérer**, résolu par un ou deux verbes (combat, fouille, énigme, discussion, désamorçage, crochetage). Il n'y a de porte de sortie (négocier, payer) que si l'adversaire parle ;
- un **butin proportionnel à la difficulté et plafonné au niveau** du groupe, en trois degrés : *tiré* (tables), *nommé* (écrit, avec du lore, en récompense de quête secondaire), *unique* (1 à 3 par épisode, fixes, rattachés à la quête principale ou au boss) ;
- une **continuité légère** : un PNJ qui sait ce que le groupe a fait dans les quêtes principales passées. Les retours surprises (ennemi vengeur, allié reconnaissant) sont toujours en bonus, jamais obligatoires ;
- une **signature audiovisuelle** : la vidéo de présentation (scène d'ouverture), les salutations voisées des PNJ (communes d'abord), la scène narrée à l'arrivée au lieu de la quête principale et les scènes de fin ;
- **une durée courte**, de l'ordre de 1 à 2 h, **non mesurée** : `pnpm monde calibrer` compare au temps réel exporté par l'écran Options.

**Les réglages de `monde.json` d'un épisode** (format complet : `docs/MONDES.md`) :

| Champ | Pour un épisode | Pourquoi |
| --- | --- | --- |
| `format` | `"episode"` | Active le **profil « épisode » du validateur** (ci-dessous). Sans lui, l'épisode reçoit les avis « Richesse » d'un chapitre de 30 lieux. Ne change rien au jeu. |
| `niveaux` | `{ "min": N, "max": N + 1 }` | Le niveau de départ, puis le niveau atteint à la fin (le Médaillon : 1-2, 300 PX). Le butin et les raretés se jugent sur `max`. |
| `groupe.conseille` | 4 ou 6 | Taille du groupe annoncée au joueur ; les combats s'adaptent de 1 à 6 héros. Pour 4, mettre les renforts en derniers groupes. |
| `depart.signesDeQuete` | `false` | Coupe les « ! » et « ? » au-dessus des PNJ : le joueur cherche et parle sans être guidé (règle du 16/11/2026). |
| `depart.orMax` | 10 pour un village pauvre, sinon rien | Plafond d'or de départ **par héros** (≈ 23 po sans plafond) : un groupe riche de ses kits achèterait tout le stock du hub. |
| `piegesACherche` | `true` (épisode) | La fouille ne révèle plus les pièges : le joueur les cherche (bouton « Chercher un piège » sur chaque contenant, « Chercher des pièges » pour la pièce ; une tentative par héros et par cible). Chaque piège doit rester trouvable (`docs/MONDES.md`, « Pièges à chercher », skill `creer-pieges-tresors`). |
| `butinPlafonne` | `true` (épisode) | Plafond de butin à l'exécution (F4) : un tirage de table ne donne que des entrées du palier du niveau réel du groupe, jamais d'objet de quête, de clé ni d'unique, et la difficulté du contenant ou de la rencontre pousse vers les plus rares permis. Ne touche ni `contenu.objets` ni les récompenses (écrits à la main). Sans lui, tirages d'avant (`docs/MONDES.md`, « Butin par difficulté et niveau », skill `creer-pieges-tresors`). |
| `tirageArrivee`, `vivres` | au choix | Le dé à l'arrivée dans un lieu, les rations et la faim (`docs/MONDES.md`). |
| `teasing` | 3 paragraphes, 150 à 200 mots | Le texte du bouton « Résumé » de l'écran « Choisir une histoire » (étape 6, point 12). |

**Le profil « épisode » du validateur** (`"format": "episode"`, `packages/regles/src/monde/episode.ts`). Il remplace les avis « Richesse » par des avis « Épisode : … », qui sont des **avis** à lire et à décider, jamais des erreurs :
- le lieu de départ fait-il 10 à 13 pièces, lui compris ? Le lieu de départ est le lieu `depart.lieu`, ou son parent s'il n'a pas de pièces ; régions et routes sont exceptées ;
- y a-t-il des **pièces vides**, sans PNJ, contenant, piège, énigme, examen, événement, rencontre, service ni fait ?
- 3 à 8 quêtes, une seule principale, aucune quête `personnelle` ni `faction` ;
- **aucun `lieu` sur les étapes de quête** ;
- **au moins 4 sujets** pour chaque PNJ qui parle (qui a un sujet, ou qui se trouve au lieu de départ) ;
- **récits d'arrivée de 130 à 170 mots** ;
- un objet du catalogue trop rare pour le niveau maximal (rare : niveau 5, très rare : 11, légendaire : 17 ; un objet unique se déclare dans `objets/`) ; une table de butin d'un palier trop haut ;
- **1 à 3 objets `unique`** (`degre: "unique"` dans `objets/`), chacun rattaché à la quête principale (récompense) ou au boss (trésor gardé par une rencontre élevée ou citée par la quête principale) ; un objet `nomme` sans `lore`.

Le profil ne vérifie pas encore « 2 sujets sur la quête principale » ni la scène d'arrivée au lieu de la quête principale : à vérifier soi-même et par l'auditeur. Pour **tous** les mondes, le validateur avertit aussi des **lieux surpeuplés** (plus de 6 PNJ qui parlent au même endroit : découper en pièces), des **titres qui trahissent** (une parenthèse, « compagnon », « boss »… dans un `nom` ou un `titre`) et des **répliques « vous me trouverez à… »** qui citent un lieu où le PNJ n'est jamais.

## Les points de validation (décision de l'utilisateur, 06/11/2026)

L'utilisateur est l'auteur : il valide **chaque étape, chaque niveau et chaque lieu**. Claude reste le maître du jeu : à chaque point, il **propose une version complète et argumentée** (jamais une page blanche ni une liste de questions ouvertes), puis attend un « oui » explicite. **Rien ne passe à l'étape suivante sans ce oui.** Un refus ou une correction reprend l'étape en cours, pas le début.

| Point | Ce que Claude présente (une page au plus, décisions en tête) | Ce que l'utilisateur décide |
| --- | --- | --- |
| **V1. Pitch** | 3 pistes en 3 phrases, puis ton, niveau, taille du groupe, durée visée, coût | la piste et le cadre |
| **V2. Canon** | une page : secret, fins (2 ou 3), personnages clés, horloge s'il y en a une, ce que l'épisode retient des précédents | ce qui est vrai dans cet épisode |
| **V3. Plan de l'épisode** | sur le canevas de la Forge (ou l'atlas, niveau 0) : le lieu de départ et ses 10 à 13 pièces avec leur rôle, les 2 à 4 sites de quête, les routes, les 3 à 8 quêtes et leur but, la charte (matériaux, couleurs, lumière) | la géographie et la liste des quêtes |
| **V4. Lieu par lieu** | pour **chaque** pièce et chaque site : plan, points à visiter, budget de contenu (« 2 PNJ, un coffre verrouillé, la chambre »), secret du lieu | ce qui se passe dans ce lieu |
| **V5. Le détail, lieu par lieu** | les fiches de tous les points du lieu (et de leurs sous-lieux), après l'auditeur | le détail du lieu |
| **V6. Contenu, lieu par lieu** | les PNJ (qui, ce qu'ils savent, ce qu'ils veulent, leurs sujets), combats, pièges, trésors, énigmes du lieu, tels qu'écrits dans les données | ce qu'on y vit |
| **V7. Intrigue et choix** | quête principale (pistes, impasses, recoupements), quêtes secondaires, jauge, dilemmes, fins et leurs épilogues | comment l'histoire se tranche |
| **V8. Publication** | le verdict de `pnpm monde verifier`, les fins prouvées par le parcours et leur chemin le plus court, le verdict du vérificateur d'ensemble, la durée et le coût estimés | on publie |

Règles :
- **Ce qui est validé est gelé** : dans le canon (`BIBLE.md`) et l'atlas (`LIEUX.md`), marque-le (« Validé par l'utilisateur le <date> »). Les agents ne travaillent que sur du validé, et les vérificateurs signalent tout écart. Changer un élément gelé demande un nouveau oui.
- **Lieu par lieu** : les agents travaillent sur un lieu (ou un groupe de fiches) à la fois, dans l'ordre que l'utilisateur choisit ; plusieurs en parallèle seulement s'il le demande.
- **Les dépenses** (images, voix, API) gardent leur propre accord, coût annoncé d'abord.
- Les présentations sont courtes, concrètes, en tableau quand c'est possible ; les choix que Claude recommande sont dits comme tels, avec la raison.
- **Audit avant chaque page (obligatoire, décision du 08/11/2026)**. Avant de présenter à l'utilisateur un pitch, une fiche de lieu ou du contenu (V1 à V8), Claude lance le sous-agent **`auditeur-coherence-episode`** sur ce qu'il a écrit (`.claude/agents/auditeur-coherence-episode.md`, modèle Haiku, lecture seule : canon, secrets, qui est où, densité, titres, règles du 16/11, chemin le plus court, longueurs, monstres et butin). Avec l'outil `Agent` : `subagent_type: "auditeur-coherence-episode"` ; s'il n'est pas chargé dans la session, un `general-purpose` en `model: "haiku"` à qui l'on donne ce fichier à lire comme mission. Ensuite :
  - Claude **corrige** ce qui est signalé dans ce qui n'est pas encore validé ;
  - il **signale** à l'utilisateur tout écart avec ce qui est gelé (jamais de correction silencieuse) ;
  - il vérifie lui-même chaque anomalie (un auditeur Haiku peut se tromper) ;
  - il ne présente la page qu'avec le verdict de l'audit, et relance l'audit après chaque correction.

  L'ancien `auditeur-coherence-histoire` est réservé aux grands mondes abandonnés.
- **Six règles de gameplay (décision du 08/11/2026, recherche dans `docs/GAMEPLAY-REFERENCES.md`)**, pour tout nouveau lieu ; ce qui est déjà gelé ne change qu'avec l'accord de l'utilisateur. Nées pour les sous-régions d'Ombresang, elles s'appliquent ici à l'épisode :
  1. **Accroches par rencontre** : chaque site confie son histoire par un PNJ ou un événement visible, jamais en obligeant à tout fouiller.
  2. **Un lieu-vitrine mémorable par épisode** (un moment fort, souvent le site de la quête principale), les autres plus modestes.
  3. **Deux voies différentes** pour toute rencontre sans combat (deux compétences, un objet, une parole). Le validateur avertit d'une « voie unique ».
  4. **Cas limites « n+1 » par lieu**, une ligne par cas : que se passe-t-il si le PNJ clé meurt, si l'objet est perdu, si le groupe tue la mauvaise personne ?
  5. **Premier épisode** : un test à échec amusant tôt, avant la première vraie punition, pour apprendre au joueur que rater est sans danger.
  6. **Conséquences visibles vite** : chaque dilemme montre un premier effet dans le lieu ou le suivant ; l'écho tardif vient ensuite.

## Les règles de RPG (16/11/2026) et les textes riches (10/11/2026)

**Le joueur cherche.**
- Aucun `lieu` sur les étapes de quête par défaut, donc ni losange sur la carte, ni « ◆ » sur la sortie, ni boussole vers l'objectif. Le journal ne nomme un lieu que si un PNJ l'a déjà dit au joueur.
- Le lieu de l'objectif se découvre : un passage `cache` trouvé en fouillant, des sujets de PNJ qui le débloquent et révèlent un fait, une rumeur. Le PNJ qui confie la quête ne nomme pas ce lieu. Méthode et modèle (le Médaillon) dans `creer-intrigue`, « Comment faire DÉCOUVRIR un lieu de quête ».
- **Pas de quête sautable** : le passage vers l'objectif exige la quête active, et tout sujet qui l'ouvre démarre la quête.
- Pour un épisode, mettre `depart.signesDeQuete: false`.

**Parler vraiment.**
- Chaque PNJ qui parle a **au moins 4 sujets** en rapport avec l'histoire, qui complètent le savoir du joueur : l'objet central, le chef du lieu, les rumeurs, l'avis sur les autres PNJ.
- Chaque PNJ du lieu de départ a **au moins 2 sujets sur la quête principale**, en récits.
- Aucun sujet ne promet ce que le jeu ne tient pas : une piste sans suite, une offre impossible.
- Détail dans `creer-personnages`.

**Le chemin le plus court.** Avant chaque V7 et V8, joue-le : `pnpm monde parcours <id> --chemin` donne le plus court chemin de chaque fin. Il doit demander de **chercher**, de **parler** et de **se battre** avant d'atteindre l'objectif. S'il va droit au boss, cache le passage, fais démarrer la quête par un sujet, exige un fait appris.

**Une seule table de longueurs** (mots ; cibles validées par l'utilisateur le 10/11/2026 après un pilote ; méthode dans `references/textes-en-serie.md`) :

| Texte | Cible | Lu par |
| --- | --- | --- |
| récit d'arrivée d'un lieu (`arrivee`, `arriveeVariantes`) | **130 à 170** | le joueur |
| description d'un lieu (`description`) | 100 à 150 | le MJ seulement |
| accroche d'un lieu enfant, description d'un passage (`accroche`, `liens[].description`, `retour`) | 12 à 30 | le joueur |
| mise en scène d'une rencontre (`intro`) | 70 à 110 | le joueur |
| issue d'une rencontre | 50 à 80 | le joueur |
| réponse d'un PNJ (`sujets[].reponse`, `variantes`) | **75 à 115** | le joueur |
| question d'un sujet (`question`) | 3 à 12 | le joueur |
| journal de quête (`resume`, `etapes[].texte`) | 2 à 3 phrases | le joueur |
| plan d'une cinématique de lieu | ≈ 50 | le joueur (voix) |
| teasing | 150 à 200 en tout | le joueur |

La parole libre du conteur (fiches de savoir) a sa propre cible, dans `creer-personnages`.

**Qui écrit quoi.**
- **Les textes que lit le joueur sont écrits par des agents Haiku** (règle de l'utilisateur) : pilote d'abord, puis lots, relus par Claude, qui arbitre sans réécrire à leur place (`references/textes-en-serie.md`).
- La structure des données (le squelette, les liens, les conditions) vient de la Forge (`pnpm monde importer-forge`) ou de Claude.
- Les vérificateurs sont toujours d'un autre modèle que les rédacteurs.

## Les skills de la famille (à appeler au bon moment)

| Quand | Skill |
| --- | --- |
| Écrire ou régler des **rencontres** (combat, social, exploration), leurs déclencheurs, difficulté, alternatives, prix d'échec, rythme | `creer-rencontres` |
| Écrire des **contrats de combat** : mini-quêtes variées dont le but est un petit combat, avec un PNJ qui a un vrai problème | `creer-contrats` |
| Écrire des **choix difficiles** (dossier `dilemmes/`), échos, épilogues, pertes | `creer-dilemmes` |
| Écrire des **événements à choix illustrés** (dossier `evenements-choix/` : une découverte, des choix dont certains propres à l'espèce ou à la classe d'un héros) | `creer-evenements-choix` |
| Donner de la **profondeur aux PNJ** (passé, liens, confidences, savoir vérifié ; dossier `savoirs/` ; au moins 4 sujets) | `creer-personnages` |
| Donner du **lore au décor** : détails à examiner par lieu (inscriptions, objets, traces) qui se relisent selon ce que le groupe sait ; dossier `examens/`, format dans `docs/MONDES.md`, brief type `references/brief-examens.md` | ce skill (agents Haiku, relecture par Claude) |
| Faire **réagir le monde aux héros** (condition `heros` : regards d'origine sur les examens, salutations de PNJ ; brief `references/brief-origines.md`) et **faire hanter le début par l'antagoniste** (apparitions qui montent en étrangeté, un fait chacune ; brief `references/brief-antagoniste.md`) | ce skill (agents Haiku, relecture par Claude : aucun lore inventé) |
| Poser des **mystères au joueur** : questions du codex (dossier `codex/`, 10 à 15 par monde), chacune ouverte par un fait connu, avec une piste et fermée par le fait qui répond ; brief type `references/brief-codex.md` | ce skill (un agent Haiku, relecture par Claude ; **vérifier que `quand` est le fait que le groupe sait déjà et `resolue` celui qui répond**) |
| Décrire **tous les lieux en détail**, du plan de l'épisode à chaque pièce (atlas `LIEUX.md` : source des descriptions du MJ, des `visuel` des images et des cartes illustrées) ; **après le canon, avant l'écriture des textes** | `decrire-lieux` |
| Écrire ou régler des **pièges, trésors, objets propres au monde et tables de butin** (cachettes, serrures et clés, gardiens, détection par la fouille, désamorçage, valeur et rareté par niveau, butin plafonné) | `creer-pieges-tresors` |
| Écrire la **colonne vertébrale** : quête principale (en enquête), quêtes secondaires, factions s'il y en a, jauge (horloge), événements, **fins** | `creer-intrigue` |
| Écrire les **marchands, services** (nuit, soins, identification) et le **compagnon qui voyage** (escorte, interjections) | `creer-marchands-compagnons` |
| Écrire et vérifier des **énigmes** | `enigmes` |
| Ce qui **manque** encore (images, cartes, scènes, voix, textes « À écrire ») | `verifier-completude-histoire` |
| Toucher au **conteur IA** | `conteur` ; nouvelle mécanique de jeu : `ajouter-module` |

## Avant de commencer

1. Lis `docs/PRD-SAGA.md` (le cap), `docs/MONDES.md` (format et règles) et `packages/regles/src/monde/schemas.ts` (le schéma qui fait foi). Ne modifie pas le schéma pour un monde : si un monde en a besoin, c'est une évolution du moteur, à traiter à part (skill `ajouter-module`).
2. `pnpm monde lister` : les mondes existants (évite les doublons de thème et de noms). Lis aussi la dernière entrée de `docs/JOURNAL.md` sur l'épisode précédent : ce que le groupe a fait, ce qu'un PNJ peut en savoir.
3. **Règle de l'utilisateur (06/11/2026) : toutes les créatures sont dans le moteur, et une histoire n'en crée jamais.**
   - Les monstres d'une histoire se choisissent **obligatoirement** parmi les 329 profils du SRD de `packages/donnees/srd/monstres/` (`ls` du dossier : un id = un profil) ; le validateur refuse un profil inconnu.
   - Il n'y a ni monstre propre à une histoire, ni image de monstre propre à une histoire : l'illustration est celle du bestiaire commun (`apps/jeu/src/bestiaire/`).
   - Un boss ou un PNJ unique est un profil du catalogue (un « mage », un « vampire », un « dragon rouge adulte »), avec un nom, une apparence et des textes propres (fiche PNJ, `monstres[].pnj`).
   - Le catalogue couvre tout le SRD : animaux, humanoïdes (gardes, mages, prêtres, pirates…), morts-vivants, géants, élémentaires, fiélons, créatures magiques, dragons de toutes les couleurs et de tous les âges. **Pense le monde pour ce bestiaire.**
   - Si un profil du SRD manque vraiment au catalogue, c'est un chantier du moteur (brief `references/brief-monstres.md`), à faire avant d'écrire, jamais dans l'histoire.
4. Le catalogue d'objets du SRD (446 objets), les armes et armures sont réutilisables par tous les mondes : on les cite par identifiant.
5. **La bibliothèque commune d'abord** (`docs/BIBLIOTHEQUE-COMMUNE.md`) :
   - avant de générer un portrait ou une image d'objet, lance `pnpm images communs proposer <monde>` : les portraits de PNJ et les objets venus des autres histoires se réutilisent par référence (`commun:pnj/<id>`, `commun:objets/<id>`) ;
   - les PNJ secondaires prennent une salutation commune déjà voisée : `"salutations": { "commune": "<registre>" }`, 6 registres × 12 voix (`docs/SALUTATIONS-COMMUNES.md`) ;
   - on ne génère que ce qui est propre à l'épisode.

## Le chemin d'un épisode

### Étape 1 — Cadrer avec l'utilisateur (→ V1)

L'utilisateur est l'auteur du monde, tu es son éditeur et son équipe. Ne commence jamais à écrire sans accord sur le pitch.
- **Propose trois pistes** réellement différentes (ton, thème, structure), en 3 phrases chacune, appuyées sur le bestiaire, avec `AskUserQuestion`. Une piste se résume en : un décor singulier, un secret, une question centrale, des intérêts opposés, deux ou trois fins qui coûtent.
- **Décide ensuite avec lui**, en proposant des défauts :
  - le ton ;
  - le niveau (un par épisode : celui où l'épisode précédent laisse le groupe) ;
  - la **taille du groupe** (`groupe.conseille`) ;
  - la durée visée (1 à 2 h) ;
  - ce qu'il faut éviter ;
  - le nombre de fins (2 ou 3).
- **Annonce le coût avant de lancer les agents** : un agent Haiku par groupe de fiches, plus l'auditeur à chaque page ; ensuite, images (≈ 0,009 $ l'image FLUX Klein, ≈ 0,2 $ pour un village) et voix (≈ 0,003 $ par plan), chacune avec son propre accord.

### Étape 2 — Concevoir l'épisode dans la Forge (→ V3, V4)

La **Forge d'Histoires** (`pnpm atelier`, puis `http://localhost:5180/forge/` ; `docs/FORGE.md`) conçoit le plan **avant d'écrire un fichier**, avec l'utilisateur, sur un canevas :
- le lieu de départ et ses pièces ;
- les PNJ ;
- les contenants (verrou, piège avec ses DD, caché) ;
- les objets (rareté, unique) ;
- les adversaires (profil du SRD) ;
- les 3 à 8 quêtes (type tuer, trouver, apporter, libérer ; destinataire, captif).

Ses conseils de recette signalent les pièces vides, les quêtes injouables, les raretés trop hautes et le butin sans rapport avec l'obstacle. Ces conseils ne vivent que dans l'éditeur : après l'import, c'est le profil « épisode » du validateur qui prend le relais.

1. L'utilisateur valide le plan sur le canevas (V3), puis le contenu prévu de chaque lieu (V4).
2. Le bouton **Créer le monde** (ou `pnpm monde importer-forge <fichier.forge.json> <id> [--niveaux 1-2]`) produit le squelette brouillon :
   - les fiches, dont les textes portent « À écrire : … » ;
   - `RAPPORT-FORGE.md` (devinettes, écarts) ;
   - `BRIEF-ECRITURE.md`, le brief des agents d'écriture, qui liste chaque champ à écrire avec son chemin.

   Le convertisseur ne met pas de `lieu` sur les étapes. Depuis le 18/11/2026, ses étapes de but (rejoindre un lieu, vaincre, trouver, libérer, apporter) sont des champs « À écrire : ce que le joueur cherche à cette étape (… ne nommez pas ce lieu) » : ils entrent dans le brief d'écriture et `pnpm monde manque` les compte tant qu'ils restent. L'étape de retour au donneur (« Retournez voir X. ») est gardée.
3. **Sans la Forge** : `pnpm monde nouveau <id> "<Nom>"` crée `packages/mondes/<id>/` avec :
   - `monde.json` en brouillon ;
   - `BIBLE.md` et `GUIDE-ZONE.md` modèles ;
   - l'atlas `LIEUX.md` ;
   - `canon.json` vide ;
   - des dossiers vides, dont `dilemmes/`.

   Le squelette ne valide pas tant que le lieu racine et le hub n'existent pas.
4. Dans `monde.json`, pose les réglages d'un épisode (tableau plus haut) : `"format": "episode"`, `depart.signesDeQuete: false`, `"piegesACherche": true`, `"butinPlafonne": true`, `depart.orMax` si le lieu est pauvre, `niveaux`, `groupe.conseille`. Garde `"statut": "brouillon"` jusqu'à la fin.

### Étape 3 — Écrire le canon (→ V2)

Remplis **`BIBLE.md`** toi-même. Ne le délègue pas : un canon écrit par plusieurs mains se contredit. `references/canon-modele.md` détaille chaque section.
- **Le secret** : ce qui s'est vraiment passé, à plat, découvert par morceaux ; chaque antagoniste a de bonnes raisons.
- **Les fins** (2 ou 3) : chacune a un coût, aucune n'est entièrement heureuse.
- **Les factions** : facultatives dans un épisode. S'il en a, elles servent les choix de la quête principale (une réputation qui ouvre un sujet, une option de dilemme), sans quête de faction à part. **La jauge**, s'il y a une horloge, met l'épisode sous pression.
- **Le registre d'identifiants fixes (§7)** : lieux racines, PNJ clés (qui les crée, où), objets clés, drapeaux de quête, faits centraux, quête principale. **C'est ce qui permet aux agents de se référencer sans se parler.** Avec la Forge, les ids viennent de l'import : reporte-les.
- **`canon.json`**, dans le même dossier que la BIBLE. `pnpm monde nouveau` le crée vide : ne pas l'oublier, sans lui la revue de secrets n'a rien à surveiller (`verifier` dit « secrets du canon : 0 »). C'est la partie du canon que l'atelier vérifie à la machine :
  - chaque **secret**, avec 1 à 4 **mots tabou** précis (« pacte », « registre » ; jamais un mot courant comme « village ») ;
  - les fiches qui ont le droit d'en parler (`autorise`) ;
  - les **personnages** (nom, âge, espèce).

  L'atelier (onglet **Revue**) propose la liste des faits secrets (« Compléter depuis le monde ») ; les mots tabou, c'est toi qui les choisis. Après chaque lot d'agents, lance `pnpm monde verifier <id> --sans-parcours` (la rubrique « Revue de secrets » : une **fuite** = un mot tabou dans un texte que le joueur lit librement), ou ouvre la **Revue** : secrets qui fuient dans un texte libre, noms propres isolés (lore inventé), personnages qui contredisent le canon, liens non réciproques. On corrige, on rejette un faux positif, ou on admet un nom.
- **La continuité** : ce que l'épisode sait des précédents (le PNJ qui s'en souvient), les retours surprises éventuels, en bonus.
- La progression, les monstres utilisés. Dans `monde.json` : accroche, ton, direction artistique, départ, règles du MJ. Les règles du MJ (`regles`) ne sont reprises aujourd'hui que dans la doc du monde, **pas** dans le prompt du conteur : ce qui doit contraindre le conteur va dans la BIBLE.

**Les six ingrédients**, à cocher (§ 7 bis du modèle) : intrigue (une phrase), enjeu (une fin liée à une jauge ou à un échec), antagoniste, lieux (chacun a une fonction), PNJ clés, rebondissement. Ajoute des paliers de difficulté par lieu à fouiller : DD bas, moyen, élevé, avec une phrase différente à chacun.

**Faire un épisode dont le joueur ne s'ennuie pas** : la checklist. Chaque ligne est portée par un avis du validateur ou par un module.
1. **Dilemmes sans bonne réponse**, jusqu'à 3 par épisode (le validateur en vise 3) → `creer-dilemmes`.
2. **Un échec fait avancer** : prix d'échec, fait clé à trois sources, un chemin sans jet → `creer-rencontres`.
3. **Révéler dans le bon ordre** : sympathie, puis doute, puis choix → `creer-dilemmes`.
4. **Le monde se souvient** : `salutations.variantes` pour au moins 5 PNJ importants. Les PNJ secondaires prennent une salutation commune.
5. **Conséquences en deux temps** : un effet immédiat et un écho quelques jours plus tard → `creer-dilemmes`.
6. **Des pertes réelles** : au moins un PNJ qui peut mourir ou partir ; des événements `condition` sur la jauge.
7. **Une horloge visible**, s'il y en a une : jauge à 4 paliers au moins, la moitié avec des effets, un moyen de la ralentir.
8. **Du rythme** : au moins 20 % de rencontres sans combat, des combats « élevés » pour les moments forts (boss, embuscade, finale), **des contrats de combat variés dans le hub** (jamais une heure sans combat) → `creer-rencontres`, `creer-contrats`.
9. **Des épilogues** : une phrase par option de dilemme, racontée à la fin.
10. **Un ton par scène** : alterner grave, léger, étrange ; une quête secondaire tient en dix minutes et finit sur une chute.

**→ V2** : fais valider un **résumé** du canon à l'utilisateur, pas le document entier, avant d'aller plus loin : changer un secret après coup coûte tout le travail des agents.

**Le canon des personnages** (`CANON-PERSONNAGES.md`, skill `creer-personnages` étape 1, par Claude) s'écrit **ici**, juste après la BIBLE : les savoirs, les examens, les origines et l'antagoniste le lisent plus tard. Reporte les mêmes personnages (nom, âge, espèce) dans `canon.json` : BIBLE §7, `CANON-PERSONNAGES.md` et `canon.json` disent la même chose, et la BIBLE fait foi.

### Étape 4 — Décrire les lieux : l'atlas (→ V3, V4, V5)

Skill `decrire-lieux`, avec l'atlas `LIEUX.md`.
- **Niveau 0** (le plan de l'épisode) et **niveau 1** (chaque pièce du lieu de départ et chaque site de quête, avec son **budget de contenu**) : par Claude avec l'utilisateur, en reprenant le canevas de la Forge.
- **Niveaux 2 et suivants** : par des agents Haiku, avec la vérification en cascade.

L'atlas fixe une fois pour toutes les plans, les matériaux, les positions, les descriptions et **l'emplacement de chaque PNJ**, piège, trésor et rencontre. Les agents recopient ses champs au lieu de les inventer, et les images et les cartes en découlent. **Une pièce par lieu de vie** : plus de 6 personnages au même endroit, c'est une liste « Parler à… » sans repère. Le Fort de la Tombe a dû être découpé en six pièces après coup.

### Étape 5 — Écrire les textes (→ V5, V6)

Les champs « À écrire » du squelette, puis tout ce que l'atlas prévoit, s'écrivent **par des agents Haiku**, un par groupe de fiches : lieux d'une zone de l'atlas, PNJ d'un lieu, rencontres et quêtes, objets et contenants.
- **Leur brief** : `BRIEF-ECRITURE.md` (Forge), ou `GUIDE-ZONE.md` et `references/textes-en-serie.md`. Il contient les règles d'écriture, les longueurs de la table ci-dessus, les fiches concernées et leur voisinage (lieu, PNJ du lieu, quête liée).
- **Pilote d'abord** : 4 textes par catégorie, montrés à l'utilisateur avant tout lot.
- **Patches** : chaque agent remplace **uniquement** les valeurs à écrire, ou rend des patches `{ dossier, id, champ, nouveau }`.
- **Claude relit, arbitre et renvoie les corrections à l'agent**, sans réécrire lui-même (hormis des suppressions de mots).
- **Audit, puis présentation** : `auditeur-coherence-episode` avant chaque présentation, puis l'utilisateur **valide chaque groupe** (lieux, puis PNJ, puis quêtes…) avant qu'on le considère comme gelé.
- **Fin du lot** : `pnpm monde valider <id>`. Pendant l'écriture, les erreurs de référence vers les fiches pas encore écrites sont normales.

### Étape 6 — Enrichir, raccorder, vérifier (dans cet ordre)

1. **Assembler.** `pnpm monde valider <id>` donne **0 erreur**. Lis les avis « Épisode », puis les autres (`references/lecons.md`). À ce stade, les avis « Choix », « Pertes » et « Réactivité » sont **normaux** : les dilemmes et les salutations variables viennent plus loin. **Énigmes** : skill `enigmes` (`pnpm monde enigmes <id>`, et jouer une énigme de chaque type).
2. **Combats, récompenses et commerce.**
   - Contrats : `creer-contrats`.
   - Rencontres relues : `creer-rencontres`.
   - Pièges et trésors relus contre l'emplacement prévu par l'atlas : `creer-pieges-tresors`, avec le butin plafonné au niveau et les uniques rattachés à la quête principale ou au boss.
   - Marchands et services relus : `creer-marchands-compagnons`, avec la chambre payante de la taverne.
3. **Les personnages en profondeur** (`creer-personnages`) : au moins 4 sujets par PNJ qui parle, 2 sur la quête principale pour le lieu de départ, les fiches de savoir (`savoirs/`), et le compagnon qui voyage s'il y en a un (`creer-marchands-compagnons` : `escorte` et `interjections/`, sans quête personnelle autonome).
4. **La quête principale en enquête et les choix** (`creer-intrigue`, `creer-dilemmes`, **→ V7** avec la jauge et les fins) :
   - les pistes, les impasses, les recoupements ;
   - le lieu final qui se déduit ;
   - les dilemmes, les échos, les épilogues ;
   - **puis seulement** les `salutations.variantes` qui citent les drapeaux de choix **ou lisent la mémoire du groupe** (`rencontre`, `parle`, `temoin` : un PNJ réagit à un combat gagné, à une visite, à ce qu'il a vu ; voir `creer-personnages`).
5. **Le décor qui raconte et le mystère** : examens (`references/brief-examens.md`, un examen par élément remarquable de l'atlas), codex (`brief-codex.md`), regards et salutations d'origine (`brief-origines.md`), apparitions de l'antagoniste (`brief-antagoniste.md`), événements à choix (`creer-evenements-choix`). Ces briefs sont des **exemples tirés de la Citadelle** : adapte-les (voir leur en-tête).
6. **Rattacher les « patchs »** que certains briefs écrivent dans le dossier temporaire de la session (sujets, regards, salutations, rencontres de lieu) : Claude les applique à la main, fiche par fiche, puis revalide.
7. **Valider sans avis inexpliqué.** `pnpm monde valider <id>` : **0 erreur**, et chaque avis lu et décidé, en particulier les avis « Épisode » (le barème est indicatif : un écart voulu se dit à l'utilisateur). Le validateur dit aussi une fiche d'extension invalide, un dossier mal nommé ou une clé de fiche inconnue : le jeu les ignorerait en silence. Les avis `[énigmes]` se lisent un par un.
   - Puis ouvre l'atelier : **Santé** ; **Arbre** (chaque PNJ, rencontre, trésor, piège, énigme, dilemme sous son lieu, d'un coup d'œil) ; **Registre** ; **Revue** avec `canon.json` ; **Graphes**.
   - Pour **retoucher un texte isolé** (une réponse au style indirect, une arrivée trop sèche), le bouton « assistant » d'un champ de l'onglet Fiches propose une réécriture avec la bible, la cible de longueur et les mots tabou du canon. C'est un appel payant d'environ 0,002 $, plafonné. Les **séries** de textes restent écrites par des agents Haiku.
8. **Prouve que chaque fin arrive.** `pnpm monde parcours <id>` lance un joueur automatique qui joue le VRAI moteur, avec les mêmes boutons que le joueur (combats supposés gagnés), et rend, pour chaque fin atteinte, un parcours rejouable.
   - `--chemin` le détaille : c'est **le chemin le plus court**, qui doit chercher, parler et se battre.
   - `--couvrir` continue après les fins, pour lister ce qu'il n'a jamais vu ; `--graines` change le nombre de tirages.
   - Une fin « non atteinte » est une piste, pas une preuve (budget : `--etats`, `--ms`). Cherche ce qui la bloque : atelier, onglet Graphes, dépendances d'une fin.
   - Vérifie aussi qu'**aucune fin n'arrive trop tôt** : sa condition doit être le drapeau de l'issue.
   - En complément, un test par fin dans `packages/regles/tests/` (modèles : `tombe-*.test.ts`, « Val des Cendres : parcours » dans `monde.test.ts`).
9. **Vérificateur d'ensemble du monde** (`references/verificateur-monde.md`) : un agent neuf, d'un autre modèle que les rédacteurs, lit tout le monde contre la BIBLE (fins, horloge, personnages, atlas, lore inventé, rythme) et rend un verdict ; deux tours au plus.
10. **Reporte les ids** des entités créées dans le « Contenu prévu » de l'atlas (`decrire-lieux`) et vérifie l'écart avec le budget.
11. **Le teasing** : le champ `teasing` de `monde.json`, lu sous le bouton « Résumé » de l'écran « Choisir une histoire », à côté de « Lancer l'histoire ». Sans lui, l'écran montre `resume`, trop court pour donner envie.
    - **Forme** : 3 paragraphes de 150 à 200 mots en tout, texte brut, paragraphes séparés par une ligne vide, adressé au joueur (« vous », présent).
    - **Contenu** : l'ambiance sensorielle du lieu et du ton, l'urgence du départ, et la grande question du pitch pour finir.
    - **Aucun spoiler** : seulement ce que dit le § 1 (Pitch) de la BIBLE, jamais le § 2 (secrets) ; aucun fait ni nom propre absent du pitch ; aucune promesse de fonctionnalité (heures, nombre de fins).
    - **Qui l'écrit** : un agent **Haiku**, à qui l'on ne donne que le pitch public et le début de `monde.json`. Claude le relit (chercher : un fait caché évoqué, un secret du § 2 trahi, une répétition, un détail inventé), puis l'utilisateur au V8. Modèles : ceux de la Dîme et de la Marche (`monde.json`).

### Étape 7 — Images, voix et publication (→ V8)

1. **`pnpm monde verifier <id>`** : validation, ce qui manque, estimation à jour, revue de secrets, fins prouvées, en une commande et un code de sortie. Il ne vérifie pas le `teasing` : vérifie qu'il est écrit. Présente :
   - le verdict ;
   - les fins prouvées et leur chemin le plus court ;
   - le verdict du vérificateur d'ensemble ;
   - la durée et le coût estimés.
2. **Après le oui de l'utilisateur** : remplis `chapitres[].quetes` dans `monde.json` et passe le `statut` à `"publie"`. `pnpm monde doc <id>` génère `docs/mondes/<id>.md`, que l'utilisateur relit.
3. **Cartes, puis images.** Après accord, à environ 0,009 $ l'image, un essai d'abord.
   1. Lance `pnpm images communs proposer <monde>` (portraits et objets déjà faits).
   2. La carte du lieu de départ : `pnpm images cartes <id> --lieu <hub> --go` ; puis on **pose ses pièces** (atelier, onglet Cartes) ; puis les cartes de détail (`--lieu <lieu>`).
   3. Enfin les images des lieux, des PNJ et des objets : `pnpm images monde <id> --lieu <lieu> --go`, lieu par lieu.
   4. Relis chaque lot. Corrige par retouche de `images.json`, jamais en touchant le texte validé : une couleur nommée dans un `visuel` peut se retrouver partout dans l'image.
   5. Installe les WebP avec `uv run --with pillow python outils/images/installer.py monde <id>`. L'installateur **fusionne** le manifeste et affiche chaque changement : lis ses lignes `!`, une entrée dont le fichier manque, gardée tant qu'on ne passe pas `--purger`. Garde `sorties/images/mondes/<id>/`.
   6. Ne jamais illustrer les héros du joueur. Pièges connus : `references/lecons.md` § Images, `docs/M2-IMAGES.md`.
4. **Scènes narrées** (signature audiovisuelle) : `scenes/scenes.json` (format : `docs/MONDES.md`).
   - **L'ouverture**, en `"presentation": "film"` : 5 ou 6 plans, une minute, sans rien révéler du secret ni nommer le lieu de l'objectif.
   - **La scène à l'arrivée au lieu de la quête principale**, déclencheur `{ "lieu": … }`.
   - **Une scène par fin.**
   - Au besoin, des **cinématiques de lieux** : un plan d'environ 50 mots sur l'image du lieu, modèle `tombe-des-rois-serpents/scenes/cinematiques-lieux.json`.
   - **Les voix** : `pnpm voix generer <id> --go`, **après accord**, à environ 0,003 $ par plan. C'est la **voix officielle du Maître de jeu** (Gemini, Algieba, ×1,15, style naturel), le défaut de l'outil : jamais d'autre timbre ni style.
   - **Les salutations des PNJ** : `pnpm salutations` (communes d'abord, voisées une seule fois).
5. **Ce qui manque** : `pnpm monde manque <id>` (skill `verifier-completude-histoire`) liste :
   - les images de lieux, de PNJ et d'objets, et les fichiers absents du manifeste ;
   - les références communes inconnues ;
   - les cartes illustrées et les positions ;
   - les scènes et les voix ;
   - les contrats annoncés ;
   - les champs encore « À écrire ».

   À relancer jusqu'à 0 manque, et à chaque fin de lieu.
6. `pnpm monde estimer <id>` écrit `estimation.json` (durée et coût d'API pour le joueur ; un test exige qu'il soit à jour) : signale-les à l'utilisateur. Pour un épisode court, l'estimation est grossière : mesure une vraie partie (`pnpm monde calibrer`).
7. `pnpm test` et `pnpm typecheck` verts.
8. Mets à jour `docs/MONDES.md` (liste des mondes), `docs/JOURNAL.md` et la mémoire du projet ; propose le commit (demande l'accord avant).

## Annexe — une grande histoire (ancien modèle, avant le 15/11/2026)

La Marche, la Dîme et la Tombe ont été écrites ainsi. Ce n'est plus le produit visé : à n'utiliser que si l'utilisateur demande explicitement une grande histoire. Dans ce cas, `format` reste absent et le validateur applique les avis « Richesse ».

- **Taille** : un chapitre complet ≈ 30 lieux, 25 PNJ, 25 trésors, 15 rencontres, 3 dilemmes, 4 à 6 factions, au moins 3 fins (minima du validateur : `docs/MONDES.md`, règle d'écriture 9).
- **Découper en zones.** Une zone = un ou plusieurs lieux entiers du niveau 1 de l'atlas (jamais un lieu coupé en deux), regroupés pour ne presque rien partager ; une zone = un agent.
  - **Gabarit éprouvé** : Z1, le hub et ses routes ; Z2, une ville ou un camp rival ; Z3, grottes, routes, lieux sauvages ; Z4, donjon intermédiaire ; Z5, donjon final (les voies vers chaque fin) ; Z6, la zone centrale (factions, jauge, faits centraux, quête principale, fins, tables de butin, événements globaux ; skill `creer-intrigue`, mission type : `references/prompts-zones.md` § zone centrale).
  - **Chiffres visés** : ceux d'une zone sont la somme des budgets de contenu de ses lieux dans l'atlas (l'atlas prime).
  - **Codes** : chaque zone a un **code**, un **préfixe d'identifiants** et des fichiers préfixés par son code. Codes réservés aux étapes suivantes (convention de la Citadelle) : `z7` contrats, `z8` savoirs, `z9` examens, codex, origines, antagoniste, compagnon.
  - **Liens** : une seule zone crée la racine de la carte ; chaque zone déclare ses liens vers le hub (double sens).
  - **Après les zones** : les dilemmes, les salutations variables et les contrats qui traversent plusieurs zones s'écrivent après, pas par les agents de zone.
- **Les agents de zone.** Un agent `general-purpose` par zone (modèles de prompts : `references/prompts-zones.md`), **une zone à la fois** dans l'ordre choisi par l'utilisateur, et toutes en parallèle seulement s'il le demande.
  - **Après chaque zone (→ V6)** : présente lieu par lieu ce qui a été écrit, et attends son oui avant la zone suivante.
  - **Le prompt** : il renvoie au `GUIDE-ZONE.md` (à suivre à la lettre), au `BIBLE.md` et à l'atlas `LIEUX.md`, puis donne la mission de la zone.
  - **Pendant qu'ils travaillent** : n'écris pas dans les fichiers d'une zone ; les erreurs de référence vers les autres zones sont normales.
  - **Les rapports** : relis chacun ; un agent qui s'écarte de l'atlas est corrigé avant la suite.
  - **Les textes que lit le joueur** suivent la règle de ce skill (agents Haiku, table des longueurs), y compris dans une grande histoire. Un agent de zone qui monte les données en Sonnet laisse les textes riches à un lot Haiku.
- Les étapes 3, 4, 6 et 7 du chemin d'un épisode s'appliquent ensuite à l'identique, avec les avis « Richesse » à la place des avis « Épisode ».

## Références
- `references/brief-monstres.md` (ajouter des monstres du SRD), `references/verificateur-monde.md` (le vérificateur d'ensemble avant publication).
- `references/canon-modele.md` (le canon, section par section), `references/prompts-zones.md` (grande histoire), `references/lecons.md` (défauts typiques, images, monstres).
- `references/textes-en-serie.md` : écrire beaucoup de petits textes (passages, accroches, questions) avec des **agents Haiku**, et les textes riches.
- `references/atelier-scene-multivoix.md` : une scène clé où plusieurs PNJ s'opposent (un agent par voix).
- `references/guide-style-textes-courts.md`, `references/consignes-critique-textes.md`.
- `docs/FORGE.md` (la Forge et l'import), `docs/PRD-SAGA.md` (le cap), `.claude/agents/auditeur-coherence-episode.md` (l'audit avant chaque page).

## Ce qui fait un bon monde (à garder en tête)
Des PNJ avec désirs, peurs et secrets (pas des distributeurs de quêtes) ; plusieurs façons de résoudre ; des trésors qui récompensent l'exploration et un butin à la hauteur de l'obstacle ; des énigmes solubles par déduction ; des choix qui coûtent et une jauge qui rend le temps précieux ; un lieu de quête qu'on trouve en cherchant et en parlant ; du concret visuel (chaque lieu et chaque PNJ se dessine).
