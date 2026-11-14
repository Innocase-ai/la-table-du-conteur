---
name: creer-monde
description: Construire un nouveau monde (une histoire jouable) pour le CRPG de ce dépôt, au format de docs/MONDES.md — canon, registre d'identifiants, écriture par zones en parallèle par des agents, validation et raccordement. À utiliser dès que l'utilisateur veut créer, écrire, concevoir ou étendre un monde, une histoire, une campagne, un scénario, un chapitre, un donjon, une ville ou une aventure pour ce jeu (« un nouveau monde », « une autre histoire », « on fait un monde de pirates », « écris-moi un scénario », « ajoute un chapitre »), même si l'utilisateur ne parle pas de « monde » ni de « skill ». C'est le chef d'orchestre : il fixe l'ordre de production et renvoie aux skills spécialisés `decrire-lieux`, `creer-intrigue`, `creer-personnages`, `creer-marchands-compagnons`, `creer-rencontres`, `creer-contrats`, `creer-pieges-tresors`, `creer-dilemmes` et `enigmes`.
---

# Créer un monde pour le CRPG

Un monde est un dossier de données (`packages/mondes/<id>/`) lu par le même moteur que tous les autres : lieux, PNJ, trésors, rencontres, énigmes, pièges, quêtes, factions, jauges, fins, et les dossiers de modules (`scenes/`, `dilemmes/`). Écrire un monde, c'est écrire des données **cohérentes entre elles** ; la difficulté n'est pas la quantité de texte, c'est que six auteurs (ici des agents en parallèle) produisent un tout qui se tient. Tout ce skill sert cette cohérence : un **canon** écrit d'abord, un **registre d'identifiants fixes** que chacun respecte, un **validateur** qui attrape ce qui dérive.

Les références : **La Marche d'Ombrefiel** (publiée) et **La Dîme des Roseaux** (brouillon court) (`packages/mondes/`), et les données des anciennes histoires **Le Val des Cendres**, **La Citadelle des Marées**, **Port-Sillage** et **Ombresang** (`packages/regles/tests/fixtures/mondes/`, sans images) ; relis leur `BIBLE.md` et `GUIDE-ZONE.md` pour voir le niveau de détail attendu.

## Les points de validation (décision de l'utilisateur, 06/11/2026)

L'utilisateur est l'auteur : il valide **chaque étape, chaque niveau et chaque lieu**. Claude reste le maître du jeu : à chaque point, il **propose une version complète et argumentée** (jamais une page blanche ni une liste de questions ouvertes), puis attend un « oui » explicite. **Rien ne passe à l'étape suivante sans ce oui.** Un refus ou une correction reprend l'étape en cours, pas le début.

| Point | Ce que Claude présente (une page au plus, décisions en tête) | Ce que l'utilisateur décide |
| --- | --- | --- |
| **V1. Pitch** | 3 pistes en 3 phrases, puis ton, niveaux, taille, coût | la piste et le cadre |
| **V2. Canon** | une page : secret, fins, factions, horloge, personnages clés | ce qui est vrai dans ce monde |
| **V3. Atlas, niveau 0** | la carte du monde en mots : territoire, grands lieux et leur rôle, routes, charte (matériaux, couleurs, lumière) | la géographie |
| **V4. Atlas, niveau 1, lieu par lieu** | pour **chaque** lieu : plan, points à visiter, budget de contenu (« 2 combats, 4 PNJ, 1 piège… »), secret du lieu | ce qui se passe dans ce lieu |
| **V5. Niveau 2 et suivants, lieu par lieu** | les fiches de tous les points du lieu (et de leurs sous-lieux), après le vérificateur | le détail du lieu |
| **V6. Contenu, lieu par lieu** | les PNJ (qui, ce qu'ils savent, ce qu'ils veulent), combats, pièges, trésors, énigmes du lieu, tels qu'écrits dans les données | ce qu'on y vit |
| **V7. Intrigue et choix** | quête principale, jauge, dilemmes, fins (et leurs épilogues) | comment l'histoire se tranche |
| **V8. Publication** | le verdict du vérificateur d'ensemble, les fins prouvées par le parcours, la durée et le coût estimés | on publie |

Règles :
- **Ce qui est validé est gelé** : dans le canon (`BIBLE.md`) et l'atlas (`LIEUX.md`), marque-le (« Validé par l'utilisateur le <date> ») ; les agents ne travaillent que sur du validé, et les vérificateurs signalent tout écart. Changer un élément gelé demande un nouveau oui.
- **Lieu par lieu** : les agents travaillent sur un lieu (ou une zone) à la fois, dans l'ordre que l'utilisateur choisit ; plusieurs en parallèle seulement s'il le demande.
- **Les dépenses** (images, voix, API) gardent leur propre accord, coût annoncé d'abord.
- Les présentations sont courtes, concrètes, en tableau quand c'est possible ; les choix que Claude recommande sont dits comme tels, avec la raison.
- **Audit avant chaque page (obligatoire, décision du 08/11/2026)** : avant de présenter à l'utilisateur un pitch, une fiche de lieu ou du contenu (V1 à V8), Claude lance le sous-agent `auditeur-coherence-histoire` (`.claude/agents/auditeur-coherence-histoire.md`, modèle Haiku, lecture seule) sur ce qu'il a écrit, **corrige** ce qui est signalé dans ce qui n'est pas encore validé, **signale** à l'utilisateur tout écart avec ce qui est gelé (jamais de correction silencieuse), et ne présente la page qu'avec le verdict de l'audit. Après chaque correction, l'audit est relancé.
- **Sous-régions d'Ombresang (décision du 08/11/2026)** : l'arc unique sur toute une sous-région (un secret, une jauge, des fins, cinq lieux comme étapes) ne vaut **que pour Lame-Rousse** (SR 1.1, prologue et hub). **Pour toutes les autres** : un pitch léger et un fil conducteur de sous-région, sans secret, jauge ni fins propres à la sous-région ; **chacun des 5 lieux a sa propre mini-histoire autonome** (un début, un dilemme, une fin, 20 à 40 minutes), jouable dans n'importe quel ordre, avec un lien vers le fil rouge (`FIL-ROUGE.md`) et une sortie.
- **Six règles de gameplay (décision du 08/11/2026, recherche dans `docs/GAMEPLAY-REFERENCES.md`)**, pour tout nouveau lieu ; ce qui est déjà gelé ne change qu'avec l'accord de l'utilisateur :
  1. **Accroches par rencontre** : chaque lieu confie sa mini-histoire par un PNJ ou un événement visible, jamais en obligeant à tout fouiller.
  2. **Un lieu-vitrine mémorable par sous-région** (un moment fort), les autres plus modestes.
  3. **Deux voies différentes** pour toute rencontre sans combat (deux compétences, un objet, une parole). Le validateur avertit d'une « voie unique ».
  4. **Cas limites « n+1 » par lieu**, une ligne par cas : que se passe-t-il si le PNJ clé meurt, si l'objet est perdu, si le groupe tue la mauvaise personne ?
  5. **Lame-Rousse uniquement** : un test à échec amusant tôt, avant la première vraie punition, pour apprendre au joueur que rater est sans danger.
  6. **Conséquences visibles vite** : chaque dilemme montre un premier effet dans le lieu ou le suivant ; l'écho tardif vient ensuite.

## Les skills de la famille (à appeler au bon moment)

| Quand | Skill |
| --- | --- |
| Écrire ou régler des **rencontres** (combat, social, exploration), leurs déclencheurs, difficulté, alternatives, prix d'échec, rythme | `creer-rencontres` |
| Écrire des **contrats de combat** : mini-quêtes variées dont le but est un petit combat, avec un PNJ qui a un vrai problème | `creer-contrats` |
| Écrire des **choix difficiles** (dossier `dilemmes/`), échos, épilogues, pertes | `creer-dilemmes` |
| Écrire des **événements à choix illustrés** (dossier `evenements-choix/` : une découverte, des choix dont certains propres à l'espèce ou à la classe d'un héros) | `creer-evenements-choix` |
| Donner de la **profondeur aux PNJ** (passé, liens, confidences, savoir vérifié ; dossier `savoirs/`) | `creer-personnages` |
| Donner du **lore au décor** : détails à examiner par lieu (inscriptions, objets, traces) qui se relisent selon ce que le groupe sait ; dossier `examens/`, format dans `docs/MONDES.md`, brief type `references/brief-examens.md` | ce skill (agents Haiku, relecture par Claude) |
| Faire **réagir le monde aux héros** (condition `heros` : regards d'origine sur les examens, salutations de PNJ ; brief `references/brief-origines.md`) et **faire hanter le début par l'antagoniste** (apparitions qui montent en étrangeté, un fait chacune ; brief `references/brief-antagoniste.md`) | ce skill (agents Haiku, relecture par Claude : aucun lore inventé) |
| Poser des **mystères au joueur** : questions du codex (dossier `codex/`, 10 à 15 par monde), chacune ouverte par un fait connu, avec une piste et fermée par le fait qui répond ; brief type `references/brief-codex.md` | ce skill (un agent Haiku, relecture par Claude ; **vérifier que `quand` est le fait que le groupe sait déjà et `resolue` celui qui répond**) |
| Décrire **tous les lieux en détail**, de la carte du monde à chaque salle (atlas `LIEUX.md` : source des descriptions du MJ, des `visuel` des images et des cartes illustrées) ; **après le canon, avant les zones** | `decrire-lieux` |
| Écrire ou régler des **pièges, trésors, objets propres au monde et tables de butin** (cachettes, serrures et clés, gardiens, détection par la fouille, désamorçage, valeur et rareté par niveau) | `creer-pieges-tresors` |
| Écrire la **colonne vertébrale** : quête principale, quêtes secondaires et de faction, factions, jauge (horloge), événements, **fins** | `creer-intrigue` |
| Écrire les **marchands, services** (nuit, soins, identification) et le **compagnon qui voyage** (escorte, interjections) | `creer-marchands-compagnons` |
| Écrire et vérifier des **énigmes** | `enigmes` |
| Toucher au **conteur IA** | `conteur` ; nouvelle mécanique de jeu : `ajouter-module` |

## Avant de commencer

1. Lis `docs/MONDES.md` (format et règles) et `packages/regles/src/monde/schemas.ts` (le schéma qui fait foi). Ne modifie pas le schéma pour un monde : si un monde en a besoin, c'est une évolution du moteur, à traiter à part.
2. `pnpm monde lister` : les mondes existants (évite les doublons de thème et de noms).
3. **Règle de l'utilisateur (06/11/2026) : toutes les créatures sont dans le moteur, et une histoire n'en crée jamais.** Les monstres d'une histoire se choisissent **obligatoirement** parmi les 329 profils du SRD de `packages/donnees/srd/monstres/` (`ls` du dossier : un id = un profil) ; le validateur refuse un profil inconnu. Il n'y a ni monstre propre à une histoire, ni image de monstre propre à une histoire : l'illustration est celle du bestiaire commun (`apps/jeu/src/bestiaire/`). Un boss ou un PNJ unique est un profil du catalogue (un « mage », un « vampire », un « dragon rouge adulte ») avec un nom, une apparence et des textes propres (fiche PNJ, `monstres[].pnj`). Si un profil manque vraiment, on **étend le moteur** (hors histoire, `references/brief-monstres.md`), jamais l'histoire. Le catalogue couvre tout le SRD : animaux, humanoïdes (gardes, mages, prêtres, pirates…), morts-vivants, géants, élémentaires, fiélons, créatures magiques, dragons de toutes les couleurs et de tous les âges. **Pense le monde pour ce bestiaire.** Si un profil du SRD manque au catalogue, c'est un chantier du moteur (brief `references/brief-monstres.md`), à faire avant d'écrire les zones, jamais dans l'histoire.
4. Le catalogue d'objets du SRD (446 objets), les armes et armures sont réutilisables par tous les mondes : on les cite par identifiant.

## Étape 1 — Cadrer avec l'utilisateur

**→ V1.** L'utilisateur est l'auteur du monde, tu es son éditeur et son équipe. Ne commence jamais à écrire sans accord sur le pitch. Propose **trois pistes** réellement différentes (ton, thème, structure), en 3 phrases chacune, appuyées sur le bestiaire, avec `AskUserQuestion`. Une piste se résume en : un décor singulier, un secret, une question centrale, des factions aux motivations opposées, plusieurs fins qui coûtent.

Décide ensuite avec lui (propose des défauts) : le ton, les niveaux (1 à 5 par défaut), la **taille du groupe** pour laquelle l'histoire est écrite (champ `groupe.conseille` de `monde.json` : 4 ou 6 héros ; les combats s'adaptent de 1 à 6 héros, le champ sert à l'annoncer au joueur ; calibrer les rencontres en conséquence : pour 4, mettre les renforts en derniers groupes), la taille (un chapitre complet ≈ 30 lieux, 25 PNJ, 25 trésors, 15 rencontres, 3 dilemmes ; un monde plus court est possible, le validateur avertira), ce qu'il faut éviter, le nombre de fins (au moins 3). **Prévenir du coût avant de lancer les agents** : un monde complet mobilise ~6 agents de zone (15 à 25 minutes chacun), plus les agents de l'atlas et ses vérificateurs (un par lieu du niveau 1, plus un), les savoirs (un par PNJ approfondi) et les briefs de l'étape 5 ; annonce le total et obtiens l'accord.

## Étape 2 — Écrire le canon

`pnpm monde nouveau <id> "<Nom du monde>"` crée `packages/mondes/<id>/` (`monde.json` en brouillon, `BIBLE.md` modèle, `GUIDE-ZONE.md`, dossiers vides dont `dilemmes/`). Remplis **`BIBLE.md`** toi-même (ne le délègue pas : un canon écrit par six mains se contredit ; `references/canon-modele.md` détaille chaque section) :

- **Le secret** : ce qui s'est vraiment passé, à plat, découvert par morceaux ; chaque antagoniste a de bonnes raisons.
- **Les fins** (≥ 3) : chacune a un coût, aucune n'est entièrement heureuse.
- **Les factions** (4 à 6, ids fixes) et leurs chefs ; **la jauge** qui met le monde sous pression.
- **Le registre d'identifiants fixes (§7)** : lieux racines, PNJ clés (qui les crée, où), objets clés, drapeaux de quête, faits centraux, quêtes principales. **C'est ce qui permet aux zones de se référencer sans se parler.**
- **`canon.json`** (même dossier, à côté de la BIBLE ; **`pnpm monde nouveau` le crée vide** : ne pas l'oublier, sans lui la revue de secrets n'a rien à surveiller et `pnpm monde verifier` le signale) : la partie du canon que l'atelier vérifie à la machine : chaque **secret** avec 1 à 4 **mots tabou** précis (« pacte », « registre » ; jamais un mot courant comme « village »), les fiches qui ont le droit d'en parler (`autorise`), et les **personnages** (nom, âge, espèce). L'atelier (onglet **Revue**) propose la liste des faits secrets (« Compléter depuis le monde ») ; les mots tabou, c'est toi qui les choisis. Après chaque lot d'agents, lance `pnpm monde verifier <id> --sans-parcours` (la rubrique « Revue de secrets » : une **fuite** = un mot tabou dans un texte que le joueur lit librement) ou ouvre la **Revue** : secrets qui fuient dans un texte libre, noms propres isolés (lore inventé), personnages qui contredisent le canon, liens non réciproques ; on corrige, on rejette un faux positif, ou on admet un nom.
- La progression par niveau, les monstres utilisés ; `monde.json` : accroche, ton, direction artistique, départ, règles du MJ (`regles` : aujourd'hui reprises seulement dans la doc du monde, **pas** dans le prompt du conteur ; ce qui doit contraindre le conteur va dans la BIBLE).

**Les six ingrédients** à cocher (§ 7 bis du modèle) : intrigue (une phrase), enjeu (une fin liée à une jauge), antagoniste, lieux (chacun a une fonction), PNJ clés, rebondissement. Paliers de difficulté par lieu à fouiller (DD bas, moyen, élevé, une phrase différente à chacun).

**Faire une histoire dont le joueur ne s'ennuie pas** : la checklist (chaque ligne est portée par un avis du validateur ou un module) :
1. **Dilemmes sans bonne réponse**, 3 par chapitre → `creer-dilemmes`.
2. **Un échec fait avancer** (prix d'échec, fait clé à trois sources, un chemin sans jet) → `creer-rencontres`.
3. **Révéler dans le bon ordre** (sympathie, puis doute, puis choix) → `creer-dilemmes`.
4. **Le monde se souvient** : `salutations.variantes` pour au moins 5 PNJ importants. **PNJ secondaires** : `"salutations": { "commune": "<registre>" }` au lieu de textes (bibliothèque partagée déjà voisée, `docs/SALUTATIONS-COMMUNES.md`).
5. **Conséquences en deux temps** : un effet immédiat et un écho quelques jours plus tard → `creer-dilemmes`.
6. **Des pertes réelles** : au moins un PNJ qui peut mourir ou partir ; événements `condition` sur la jauge.
7. **Une horloge visible** : jauge à 4 paliers au moins, la moitié avec des effets, un moyen de la ralentir.
8. **Du rythme** : ≥ 20 % de rencontres sans combat, ≥ 3 « élevée », **des contrats de combat variés dans le hub** (jamais une heure sans combat) → `creer-rencontres`, `creer-contrats`.
9. **Des épilogues** : une phrase par option de dilemme, racontée à la fin.
10. **Un ton par scène** : alterner grave, léger, étrange ; une quête secondaire tient en dix minutes et finit sur une chute.

**→ V2** : fais valider un **résumé** du canon à l'utilisateur (pas le document entier) avant d'aller plus loin : changer un secret après coup coûte tout le travail des agents.

**Le canon des personnages** (`CANON-PERSONNAGES.md`, skill `creer-personnages` étape 1, par Claude) s'écrit **ici**, juste après la BIBLE : les savoirs, les examens, les origines et l'antagoniste le lisent plus tard. Reporte les mêmes personnages (nom, âge, espèce) dans `canon.json` : BIBLE §7, `CANON-PERSONNAGES.md` et `canon.json` disent la même chose, et la BIBLE fait foi.

## Étape 2 bis — Décrire les lieux (l'atlas)

Skill `decrire-lieux` : l'atlas `LIEUX.md` (créé par `pnpm monde nouveau`). **→ V3** (niveau 0), **V4** (chaque lieu du niveau 1) et **V5** (le détail de chaque lieu). Niveau 0 (la carte du monde) et niveau 1 (chaque lieu de cette carte, avec son **budget de contenu**) par Claude avec l'utilisateur, puis niveaux 2 et suivants par des agents, et la vérification en cascade. Il fixe une fois pour toutes plans, matériaux, positions, descriptions et l'emplacement de chaque PNJ, piège, trésor et rencontre ; **les agents de zone recopient ses champs** au lieu de les inventer, et les images et les cartes en découlent.

## Étape 3 — Découper en zones

**Une zone = un ou plusieurs lieux entiers du niveau 1 de l'atlas** (jamais un lieu coupé en deux), regroupés pour ne presque rien partager ; zone = un agent. Gabarit éprouvé : Z1 le hub et ses routes ; Z2 une ville ou un camp rival ; Z3 grottes, routes, lieux sauvages ; Z4 donjon intermédiaire ; Z5 donjon final (les voies vers chaque fin) ; Z6 central : factions, jauge, faits centraux, quête principale, fins, tables de butin, événements globaux (skill `creer-intrigue` ; mission type : `references/prompts-zones.md` § zone centrale). Les **chiffres visés** d'une zone sont la **somme des budgets de contenu** de ses lieux dans l'atlas (l'atlas prime). Chaque zone a un **code**, un **préfixe d'identifiants** et des fichiers préfixés par son code. Codes réservés aux étapes suivantes (convention de la Citadelle) : `z7` contrats, `z8` savoirs, `z9` examens, codex, origines, antagoniste, compagnon. Une seule zone crée la racine de la carte ; chaque zone déclare ses liens vers le hub (double sens). Les **dilemmes**, les **salutations variables** et les contrats qui traversent plusieurs zones s'écrivent après les zones, pas par les agents de zone.

## Étape 4 — Lancer les agents de zone

Un agent `general-purpose` par zone, modèle **Sonnet 5.5** (données structurées et cohérence entre fichiers ; annonce-le en une ligne), **une zone à la fois** dans l'ordre choisi par l'utilisateur (toutes en parallèle seulement s'il le demande). **→ V6** : après chaque zone, présente lieu par lieu ce qui a été écrit (PNJ, combats, pièges, trésors, énigmes) et attends son oui avant la zone suivante. Chaque prompt est court : il renvoie au `GUIDE-ZONE.md` (à suivre à la lettre), au `BIBLE.md` et à l'**atlas** `LIEUX.md`, puis donne la mission de la zone (modèles : `references/prompts-zones.md`). Pendant qu'ils travaillent, n'écris pas dans les fichiers d'une zone ; les erreurs de référence vers les autres zones sont normales. Garde `"statut": "brouillon"` jusqu'à la fin. Relis chaque rapport : un agent qui s'écarte de l'atlas (lieu, contenu, texte) est corrigé avant la suite.

## Étape 5 — Intégrer, enrichir, raccorder (dans cet ordre)

1. **Les zones assemblées** : `pnpm monde valider <id>` donne **0 erreur**. À ce stade, les avis « Choix », « Pertes » et « Réactivité » sont **normaux** (les dilemmes et les salutations variables viennent plus loin) ; lis les autres (`references/lecons.md`). **Énigmes** : skill `enigmes` (`pnpm monde enigmes <id>`, et jouer une énigme de chaque type).
2. **Combats, récompenses et commerce** : contrats (`creer-contrats`, fichiers `z7-`), rencontres relues (`creer-rencontres`), pièges et trésors relus (`creer-pieges-tresors`) contre l'emplacement prévu par l'atlas, marchands et services relus (`creer-marchands-compagnons`).
3. **Les personnages en profondeur** (`creer-personnages`) : fiches de savoir (`savoirs/z8-…`), et le compagnon qui voyage (`creer-marchands-compagnons` : `escorte` + `interjections/`, sa quête personnelle).
4. **Les choix** (`creer-dilemmes`, **→ V7** avec la quête principale, la jauge et les fins) : dilemmes, échos, épilogues ; **puis seulement** les `salutations.variantes` qui citent les drapeaux de choix **ou lisent la mémoire du groupe** (`rencontre`, `parle`, `temoin` : un PNJ réagit à un combat gagné, à une visite, à ce qu'il a vu ; voir `creer-personnages`).
5. **Le décor qui raconte et le mystère** : examens (`references/brief-examens.md`, un examen par élément remarquable de l'atlas), codex (`brief-codex.md`), regards et salutations d'origine (`brief-origines.md`), apparitions de l'antagoniste (`brief-antagoniste.md`). Ces briefs sont des **exemples tirés de la Citadelle** : adapte-les (voir leur en-tête).
6. **Rattacher les « patchs »** que certains briefs écrivent dans le dossier temporaire de la session (sujets, regards, salutations, rencontres de lieu) : Claude les applique à la main, fiche par fiche, puis revalide.
7. `pnpm monde valider <id>` : **0 erreur, 0 avertissement** (il dit aussi une fiche d'extension invalide, un dossier mal nommé, une clé de fiche inconnue : le jeu les ignorerait en silence) (sauf les avis `[énigmes]`, lus un par un) ; puis l'atelier (Santé, **Arbre** : chaque PNJ, rencontre, trésor, piège, énigme, dilemme sous son lieu, d'un coup d'œil ; Registre, Revue avec `canon.json`, Graphes). Pour **retoucher un texte isolé** (une réponse au style indirect, une arrivée trop sèche), le bouton « assistant » d'un champ de l'onglet Fiches propose une réécriture avec la bible, la cible de longueur et les mots tabou du canon (appel payant d'environ 0,002 $, plafonné) ; les **séries** de textes restent écrites par des agents Haiku (`references/textes-en-serie.md`).
8. **Prouve que chaque fin arrive** : `pnpm monde parcours <id>` lance un joueur automatique qui joue le VRAI moteur (mêmes boutons que le joueur ; combats supposés gagnés) et rend, pour chaque fin atteinte, un parcours rejouable ; `--chemin` le détaille, `--couvrir` continue après les fins pour lister ce qu'il n'a jamais vu, `--graines` change le nombre de tirages. Une fin « non atteinte » est une piste, pas une preuve (budget : `--etats`, `--ms`) : cherche ce qui la bloque (atelier, onglet Graphes > dépendances d'une fin). Vérifie aussi qu'**aucune fin n'arrive trop tôt** (sa condition doit être le drapeau de l'issue). En complément, un cas par fin dans `packages/regles/tests/monde.test.ts` (modèle : « Val des Cendres : parcours »).
8 bis. **Vérificateur d'ensemble du monde** (`references/verificateur-monde.md`) : un agent neuf, d'un autre modèle que les rédacteurs, lit tout le monde contre la BIBLE (fins, horloge, personnages, atlas, lore inventé, rythme) et rend un verdict ; deux tours au plus.
9. **Reporte les ids** des entités créées dans le « Contenu prévu » de l'atlas (`decrire-lieux`) et vérifie l'écart avec le budget.
10. **→ V8** : lance **`pnpm monde verifier <id>`** (validation, ce qui manque, estimation à jour, revue de secrets, fins prouvées : une commande, un code de sortie), puis présente le verdict du vérificateur d'ensemble, les fins prouvées, la durée et le coût estimés ; seulement après le oui : remplis `chapitres[].quetes` dans `monde.json`, passe le `statut` à `"publie"` ; `pnpm monde doc <id>` génère `docs/mondes/<id>.md`, que l'utilisateur relit.
11. **Cartes, puis images** (après accord ; environ 0,01 dollar l'image, un essai d'abord) : d'abord la carte principale (`pnpm images cartes <id> --lieu <racine> --go`), puis on **pose ses lieux** (atelier, onglet Cartes), puis les cartes de détail (`--lieu <lieu>`), enfin les images des lieux, PNJ et objets (`pnpm images monde <id> --lieu <lieu> --go`, lieu par lieu). Relis chaque lot, corrige par retouche de `images.json`, installe les WebP (`uv run --with pillow python outils/images/installer.py monde <id>` ; garde `sorties/images/mondes/<id>/`). Ne jamais illustrer les héros du joueur ; pièges : `references/lecons.md` § Images, `docs/M2-IMAGES.md`.
12. **Scènes narrées** : `scenes/scenes.json` (format : `docs/MONDES.md`) : l'ouverture en `"presentation": "film"` (5 ou 6 plans, une minute, sans rien révéler du secret), la remise de la quête principale, l'entrée du donjon final, une scène par fin. Les voix : `pnpm voix generer <id> --go` **après accord** (environ 0,003 dollar par plan) : **voix officielle du Maître de jeu** (Gemini, Algieba, ×1,15, style naturel), défaut de l'outil : jamais d'autre timbre ni style.
12 bis. **Ce qui manque** : `pnpm monde manque <id>` (skill `verifier-completude-histoire`) : images de lieux, PNJ et objets, cartes illustrées et positions, scènes et voix, contrats annoncés. À relancer jusqu'à 0 manque, et à chaque fin de lieu.
13. `pnpm monde estimer <id>` : écrit `estimation.json` (durée et coût d'API pour le joueur ; un test exige qu'il soit à jour) ; signale-les à l'utilisateur.
14. `pnpm test` et `pnpm typecheck` verts.
15. Mets à jour `docs/MONDES.md` (liste des mondes), `docs/JOURNAL.md` et la mémoire du projet ; propose le commit (demande l'accord avant).

## Références
- `references/brief-monstres.md` (ajouter des monstres du SRD), `references/verificateur-monde.md` (le vérificateur d'ensemble avant publication).
- `references/canon-modele.md` (le canon, section par section), `references/prompts-zones.md`, `references/lecons.md` (défauts typiques, images, monstres).
- `references/textes-en-serie.md` : écrire beaucoup de petits textes (passages, accroches, questions) avec des **agents Haiku**.
- `references/atelier-scene-multivoix.md` : une scène clé où plusieurs PNJ s'opposent (un agent par voix).
- `references/guide-style-textes-courts.md`, `references/consignes-critique-textes.md`.

## Ce qui fait un bon monde (à garder en tête)
Des PNJ avec désirs, peurs et secrets (pas des distributeurs de quêtes) ; plusieurs façons de résoudre ; des trésors qui récompensent l'exploration ; des énigmes solubles par déduction ; des choix qui coûtent et une jauge qui rend le temps précieux ; du concret visuel (chaque lieu et chaque PNJ se dessine).
