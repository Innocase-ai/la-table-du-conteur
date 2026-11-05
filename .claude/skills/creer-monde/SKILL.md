---
name: creer-monde
description: Construire un nouveau monde (une histoire jouable) pour le CRPG dans ~/crpg-llm, au format de docs/MONDES.md — canon, registre d'identifiants, écriture par zones en parallèle par des agents, validation et raccordement. À utiliser dès que l'utilisateur veut créer, écrire, concevoir ou étendre un monde, une histoire, une campagne, un scénario, un chapitre, un donjon, une ville ou une aventure pour ce jeu (« un nouveau monde », « une autre histoire », « on fait un monde de pirates », « écris-moi un scénario », « ajoute un chapitre »), même si l'utilisateur ne parle pas de « monde » ni de « skill ». C'est le chef d'orchestre : il renvoie aux skills spécialisés `creer-rencontres`, `creer-contrats`, `creer-dilemmes` et `enigmes`.
---

# Créer un monde pour le CRPG

Un monde est un dossier de données (`packages/mondes/<id>/`) lu par le même moteur que tous les autres : lieux, PNJ, trésors, rencontres, énigmes, pièges, quêtes, factions, jauges, fins, et les dossiers de modules (`scenes/`, `dilemmes/`). Écrire un monde, c'est écrire des données **cohérentes entre elles** ; la difficulté n'est pas la quantité de texte, c'est que six auteurs (ici des agents en parallèle) produisent un tout qui se tient. Tout ce skill sert cette cohérence : un **canon** écrit d'abord, un **registre d'identifiants fixes** que chacun respecte, un **validateur** qui attrape ce qui dérive.

Les deux mondes livrés sont les références : **le Val des Cendres** et **La Citadelle des Marées** (`packages/mondes/`) ; relis leur `BIBLE.md` et `GUIDE-ZONE.md` pour voir le niveau de détail attendu.

## Les skills de la famille (à appeler au bon moment)

| Quand | Skill |
| --- | --- |
| Écrire ou régler des **rencontres** (combat, social, exploration), leurs déclencheurs, difficulté, alternatives, prix d'échec, rythme | `creer-rencontres` |
| Écrire des **contrats de combat** : mini-quêtes variées dont le but est un petit combat, avec un PNJ qui a un vrai problème | `creer-contrats` |
| Écrire des **choix difficiles** (dossier `dilemmes/`), échos, épilogues, pertes | `creer-dilemmes` |
| Donner de la **profondeur aux PNJ** (passé, liens, confidences, savoir vérifié ; dossier `savoirs/`) | `creer-personnages` |
| Donner du **lore au décor** : détails à examiner par lieu (inscriptions, objets, traces) qui se relisent selon ce que le groupe sait ; dossier `examens/`, format dans `docs/MONDES.md`, brief type `references/brief-examens.md` | ce skill (agents Haiku, relecture par Claude) |
| Faire **réagir le monde aux héros** (condition `heros` : regards d'origine sur les examens, salutations de PNJ ; brief `references/brief-origines.md`) et **faire hanter le début par l'antagoniste** (apparitions qui montent en étrangeté, un fait chacune ; brief `references/brief-antagoniste.md`) | ce skill (agents Haiku, relecture par Claude : aucun lore inventé) |
| Poser des **mystères au joueur** : questions du codex (dossier `codex/`, 10 à 15 par monde), chacune ouverte par un fait connu, avec une piste et fermée par le fait qui répond ; brief type `references/brief-codex.md` | ce skill (un agent Haiku, relecture par Claude ; **vérifier que `quand` est le fait que le groupe sait déjà et `resolue` celui qui répond**) |
| Écrire et vérifier des **énigmes** | `enigmes` |
| Toucher au **conteur IA** | `conteur` ; nouvelle mécanique de jeu : `ajouter-module` |

## Avant de commencer

1. Lis `docs/MONDES.md` (format et règles) et `packages/regles/src/monde/schemas.ts` (le schéma qui fait foi). Ne modifie pas le schéma pour un monde : si un monde en a besoin, c'est une évolution du moteur, à traiter à part.
2. `pnpm monde lister` : les mondes existants (évite les doublons de thème et de noms).
3. Les monstres disponibles sont ceux de `packages/donnees/srd/monstres/` (30 profils : gobelinoïdes, morts-vivants, ogres, gnolls, loups, araignées, bandits, spectres, golems de pierre…). **Le monde doit être pensé pour ce bestiaire** : un monde de pirates ou de dragons en demande d'autres. Si le thème l'exige, planifie une extraction de monstres SRD (un agent : voir `references/lecons.md`) **avant** d'écrire les zones.
4. Le catalogue d'objets du SRD (446 objets), les armes et armures sont réutilisables par tous les mondes : on les cite par identifiant.

## Étape 1 — Cadrer avec l'utilisateur

L'utilisateur est l'auteur du monde, tu es son éditeur et son équipe. Ne commence jamais à écrire sans accord sur le pitch. Propose **trois pistes** réellement différentes (ton, thème, structure), en 3 phrases chacune, appuyées sur le bestiaire, avec `AskUserQuestion`. Une piste se résume en : un décor singulier, un secret, une question centrale, des factions aux motivations opposées, plusieurs fins qui coûtent.

Décide ensuite avec lui (propose des défauts) : le ton, les niveaux (1 à 5 par défaut), la taille (un chapitre complet ≈ 30 lieux, 25 PNJ, 25 trésors, 15 rencontres, 3 dilemmes ; un monde plus court est possible, le validateur avertira), ce qu'il faut éviter, le nombre de fins (au moins 3). **Prévenir du coût avant de lancer les agents** : un monde complet mobilise ~6 agents pendant 15 à 25 minutes chacun ; obtenir l'accord.

## Étape 2 — Écrire le canon

`pnpm monde nouveau <id> "<Nom du monde>"` crée `packages/mondes/<id>/` (`monde.json` en brouillon, `BIBLE.md` modèle, `GUIDE-ZONE.md`, dossiers vides dont `dilemmes/`). Remplis **`BIBLE.md`** toi-même (ne le délègue pas : un canon écrit par six mains se contredit ; `references/canon-modele.md` détaille chaque section) :

- **Le secret** : ce qui s'est vraiment passé, à plat, découvert par morceaux ; chaque antagoniste a de bonnes raisons.
- **Les fins** (≥ 3) : chacune a un coût, aucune n'est entièrement heureuse.
- **Les factions** (4 à 6, ids fixes) et leurs chefs ; **la jauge** qui met le monde sous pression.
- **Le registre d'identifiants fixes (§7)** : lieux racines, PNJ clés (qui les crée, où), objets clés, drapeaux de quête, faits centraux, quêtes principales. **C'est ce qui permet aux zones de se référencer sans se parler.**
- La progression par niveau, les monstres utilisés ; `monde.json` : accroche, ton, direction artistique, départ, règles du MJ.

**Les six ingrédients** à cocher (§ 7 bis du modèle) : intrigue (une phrase), enjeu (une fin liée à une jauge), antagoniste, lieux (chacun a une fonction), PNJ clés, rebondissement. Paliers de difficulté par lieu à fouiller (DD bas, moyen, élevé, une phrase différente à chacun).

**Faire une histoire dont le joueur ne s'ennuie pas** : la checklist (chaque ligne est portée par un avis du validateur ou un module) :
1. **Dilemmes sans bonne réponse**, 3 par chapitre → `creer-dilemmes`.
2. **Un échec fait avancer** (prix d'échec, fait clé à trois sources, un chemin sans jet) → `creer-rencontres`.
3. **Révéler dans le bon ordre** (sympathie, puis doute, puis choix) → `creer-dilemmes`.
4. **Le monde se souvient** : `salutations.variantes` pour au moins 5 PNJ importants.
5. **Conséquences en deux temps** : un effet immédiat et un écho quelques jours plus tard → `creer-dilemmes`.
6. **Des pertes réelles** : au moins un PNJ qui peut mourir ou partir ; événements `condition` sur la jauge.
7. **Une horloge visible** : jauge à 4 paliers au moins, la moitié avec des effets, un moyen de la ralentir.
8. **Du rythme** : ≥ 20 % de rencontres sans combat, ≥ 3 « élevée », **des contrats de combat variés dans le hub** (jamais une heure sans combat) → `creer-rencontres`, `creer-contrats`.
9. **Des épilogues** : une phrase par option de dilemme, racontée à la fin.
10. **Un ton par scène** : alterner grave, léger, étrange ; une quête secondaire tient en dix minutes et finit sur une chute.

Fais valider un **résumé** du canon à l'utilisateur (pas le document entier) avant d'écrire les zones : changer un secret après coup coûte tout le travail des agents.

## Étape 3 — Découper en zones

Découpe par **ensembles de lieux qui ne partagent presque rien** (zone = un agent). Gabarit éprouvé : Z1 le hub et ses routes (18 lieux, 17 PNJ, 8 marchands, 5 quêtes) ; Z2 une ville ou un camp rival ; Z3 grottes, routes, lieux sauvages ; Z4 donjon intermédiaire ; Z5 donjon final (les voies vers chaque fin) ; Z6 central : factions, jauge, faits centraux, quête principale, fins, tables de butin, événements globaux. Chaque zone a un **code** (`z1`…), un **préfixe d'identifiants** et des fichiers préfixés par son code (aucune collision). Une seule zone crée la racine de la carte ; chaque zone déclare ses liens vers le hub (double sens). Les **dilemmes du monde** et les contrats qui traversent plusieurs zones sont écrits par toi après les zones, pas par les agents de zone.

## Étape 4 — Lancer les agents

Un agent `general-purpose` par zone, tous lancés **dans le même message**. Chaque prompt est court : il renvoie au `GUIDE-ZONE.md` (à suivre à la lettre) et au `BIBLE.md`, puis donne la mission de la zone (modèles : `references/prompts-zones.md`). Pendant qu'ils travaillent, n'écris pas dans les fichiers d'une zone ; les erreurs de référence vers les autres zones sont normales. Garde `"statut": "brouillon"` jusqu'à la fin.

## Étape 5 — Intégrer et raccorder

1. `pnpm monde valider <id>` : **0 erreur, 0 avertissement** (sauf les avis `[énigmes]`, lus un par un). `references/lecons.md` donne les défauts typiques. **Énigmes** : skill `enigmes` (`pnpm monde enigmes <id>`, et jouer une énigme de chaque type).
2. **Ajoute les contrats, les dilemmes et les salutations variables** (skills `creer-contrats`, `creer-dilemmes`) une fois les zones intégrées : ils s'appuient sur les PNJ et les lieux réels.
3. **Rejoue les fins avec le moteur d'état** : un cas par fin dans `packages/regles/tests/monde.test.ts` (modèle : « Val des Cendres : parcours ») : la seule façon de savoir que l'histoire est finissable.
4. Remplis `chapitres[].quetes` dans `monde.json`, passe le `statut` à `"publie"` ; `pnpm monde doc <id>` génère `docs/mondes/<id>.md` que l'utilisateur relit.
5. **Images** (après accord : ≈ 0,01 $ l'image) : `pnpm images monde <id>`, génère lieu par lieu (`--lieu <lieu> --go`), relis chaque lot, corrige par retouche de `images.json`, installe les WebP (`python3 outils/images/installer.py monde <id>`). Ne jamais illustrer les héros du joueur ; pièges : `references/lecons.md` § Images, `docs/M2-IMAGES.md`.
6. **Scènes narrées** : `scenes/scenes.json` (format : `docs/MONDES.md`) : l'ouverture en `"presentation": "film"` (5 ou 6 plans, une minute, sans rien révéler du secret), la remise de la quête principale, l'entrée du donjon final, une scène par fin. Les voix : `pnpm voix generer <id> --go` **après accord** (≈ 0,003 $ par plan) : **voix officielle du Maître de jeu** (Gemini, Algieba, ×1,15, style naturel), défaut de l'outil : jamais d'autre timbre ni style.
7. `pnpm monde estimer <id>` : écrit `estimation.json` (durée et coût d'API pour le joueur ; un test exige qu'il soit à jour) ; signale-les à l'utilisateur.
8. `pnpm test` et `pnpm typecheck` verts.
9. Mets à jour `docs/MONDES.md`, `docs/JOURNAL.md`, la mémoire du projet ; propose le commit (demande l'accord avant).

## Références
- `references/canon-modele.md` (le canon, section par section), `references/prompts-zones.md`, `references/lecons.md` (défauts typiques, images, monstres).
- `references/textes-en-serie.md` : écrire beaucoup de petits textes (passages, accroches, questions) avec des **agents Haiku**.
- `references/atelier-scene-multivoix.md` : une scène clé où plusieurs PNJ s'opposent (un agent par voix).
- `references/guide-style-textes-courts.md`, `references/consignes-critique-textes.md`.

## Ce qui fait un bon monde (à garder en tête)
Des PNJ avec désirs, peurs et secrets (pas des distributeurs de quêtes) ; plusieurs façons de résoudre ; des trésors qui récompensent l'exploration ; des énigmes solubles par déduction ; des choix qui coûtent et une jauge qui rend le temps précieux ; du concret visuel (chaque lieu et chaque PNJ se dessine).
