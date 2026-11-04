---
name: creer-monde
description: Construire un nouveau monde (une histoire jouable) pour le CRPG dans ~/crpg-llm, au format de docs/MONDES.md — canon, registre d'identifiants, écriture par zones en parallèle par des agents, validation et raccordement. À utiliser dès que l'utilisateur veut créer, écrire, concevoir ou étendre un monde, une histoire, une campagne, un scénario, un chapitre, un donjon, une ville ou une aventure pour ce jeu (« un nouveau monde », « une autre histoire », « on fait un monde de pirates », « écris-moi un scénario », « ajoute un chapitre »), même si l'utilisateur ne parle pas de « monde » ni de « skill ».
---

# Créer un monde pour le CRPG

Un monde est un dossier de données (`packages/mondes/<id>/`) lu par le même moteur que tous les autres : lieux, PNJ, trésors, rencontres, énigmes, pièges, quêtes, factions, jauges, fins. Écrire un monde, c'est écrire des données **cohérentes entre elles** ; la difficulté n'est pas la quantité de texte, c'est que six auteurs (ici des agents en parallèle) produisent un tout qui se tient. Tout ce skill sert cette cohérence : un **canon** écrit d'abord, un **registre d'identifiants fixes** que chacun respecte, un **validateur** qui attrape ce qui dérive.

Le premier monde, **le Val des Cendres** (`packages/mondes/val-des-cendres/`), est la référence : relis son `BIBLE.md` et son `GUIDE-ZONE.md` avant de commencer, pour voir le niveau de détail attendu.

## Avant de commencer

1. Lis `docs/MONDES.md` (le format et les règles d'écriture) et `packages/regles/src/monde/schemas.ts` (le schéma qui fait foi). Ne modifie pas le schéma pour un monde : si un monde en a besoin, c'est une évolution du moteur, à traiter à part.
2. `pnpm monde lister` : les mondes existants (évite les doublons de thème et de noms).
3. Les monstres disponibles sont ceux de `packages/donnees/srd/monstres/` (30 profils : gobelinoïdes, morts-vivants, ogres, gnolls, loups, araignées, bandits, spectres, golems de pierre…). **Le monde doit être pensé pour ce bestiaire** : un monde de pirates ou de dragons en demande d'autres. Si le thème l'exige, planifie une extraction de monstres SRD (un agent, comme pour le Val : voir `references/lecons.md`) **avant** d'écrire les zones.
4. Le catalogue d'objets du SRD (446 objets) et les armes et armures sont réutilisables par tous les mondes : on les cite par identifiant.

## Étape 1 — Cadrer avec l'utilisateur

L'utilisateur est l'auteur du monde, tu es son éditeur et son équipe. Ne commence jamais à écrire sans accord sur le pitch. Propose **trois pistes** réellement différentes (ton, thème, structure), en 3 phrases chacune, appuyées sur le bestiaire disponible, avec `AskUserQuestion`. Une piste doit pouvoir se résumer en : un décor singulier, un secret, une question centrale, des factions aux motivations opposées, plusieurs fins qui coûtent.

Décide ensuite avec lui (propose des défauts, il corrige) : le ton, les niveaux (1 à 5 par défaut), la taille (un chapitre complet = environ 30 lieux, 25 PNJ, 25 trésors, 15 rencontres ; un monde plus court est possible mais le validateur avertira), l'espèce ou l'univers à éviter, le nombre de fins (au moins 3).

**Prévenir du coût avant de lancer les agents** : un monde complet mobilise ~6 agents pendant 15 à 25 minutes chacun. Dis-le et obtiens l'accord.

## Étape 2 — Écrire le canon

Lance `pnpm monde nouveau <id> "<Nom du monde>"` : il crée `packages/mondes/<id>/` avec `monde.json` (brouillon), `BIBLE.md` (modèle à remplir), `GUIDE-ZONE.md` (consignes aux auteurs de zones) et les dossiers vides.

Remplis **`BIBLE.md`** toi-même (ne le délègue pas : c'est la colonne vertébrale, et un canon écrit par six mains se contredit). `references/canon-modele.md` détaille chaque section. L'essentiel :

- **Le secret** : ce qui s'est vraiment passé, à plat, que le groupe découvre par morceaux. Chaque antagoniste a de bonnes raisons.
- **Les fins** (≥ 3) : chacune a un coût, aucune n'est entièrement heureuse.
- **Les factions** (4 à 6, ids fixes) et leurs chefs.
- **La jauge** qui met le monde sous pression (optionnelle mais très efficace).
- **Le registre d'identifiants fixes (§7)** : lieux racines par zone, PNJ clés (qui les crée, où), objets clés, drapeaux de quête, faits centraux, quêtes principales. **C'est ce qui permet aux zones de se référencer sans se parler.** Sois exhaustif : tout identifiant qu'une zone doit lire sans l'avoir écrit est dans le registre.
- La progression par niveau, les monstres utilisés.

Remplis aussi `monde.json` : accroche, ton, direction artistique (palette, mots-clés, interdits, qui guideront les illustrations), départ, règles du MJ.

Fais valider un **résumé** du canon à l'utilisateur (pas le document entier) avant d'écrire les zones : changer un secret après coup coûte tout le travail des agents.

## Étape 3 — Découper en zones

Découpe par **ensembles de lieux qui ne partagent presque rien** (zone = un agent). Gabarit éprouvé, à adapter :

| Zone | Contenu | Cible |
| --- | --- | --- |
| Z1 | Le hub de départ (village ou ville) et ses routes | 18 lieux, 17 PNJ, 8 marchands, 5 quêtes, 8 trésors |
| Z2 | Une ville ou un camp rival, un repaire | 16 lieux, 12 PNJ, 6 rencontres, 3 quêtes |
| Z3 | Grottes, routes, lieux sauvages | 16 lieux, 8 PNJ, 8 rencontres, 4 quêtes |
| Z4 | Donjon intermédiaire | 17 lieux, 7 rencontres, 3 énigmes, 5 pièges |
| Z5 | Donjon final (fins jouables) | 24 lieux, 8 rencontres, 4 énigmes, les voies vers chaque fin |
| Z6 | Central : factions, jauge, faits centraux, quête principale, quêtes personnelles et de faction, fins, tables de butin, événements globaux | tout ce qui relie |

Chaque zone a un **code** (`z1`…), un **préfixe d'identifiants** (`vei-`…) et des fichiers préfixés par son code : c'est ce qui évite les collisions entre agents qui écrivent en parallèle. Une seule zone crée la racine de la carte du monde ; chaque zone déclare ses liens vers le hub (double sens) pour que l'accessibilité ne dépende de personne d'autre.

## Étape 4 — Lancer les agents

Un agent `general-purpose` par zone, tous lancés **dans le même message** pour qu'ils travaillent en parallèle (plus un agent d'extraction de monstres si besoin, lancé d'abord). Chaque prompt est court : il renvoie au `GUIDE-ZONE.md` (consignes communes, à suivre à la lettre) et au `BIBLE.md`, puis donne la mission de la zone. Les modèles de prompts sont dans `references/prompts-zones.md`.

Pendant qu'ils travaillent, n'écris pas dans les fichiers d'une zone. Ils lanceront `pnpm monde valider` : les erreurs de référence vers les autres zones sont normales tant que tout n'existe pas. Garde le monde en `"statut": "brouillon"` jusqu'à la fin (le test du dépôt n'exige alors pas de validation sans erreur, mais exige que les fichiers respectent le schéma).

## Étape 5 — Intégrer et raccorder

Quand tous les agents ont terminé :

1. `pnpm monde valider <id>` et corrige jusqu'à **0 erreur, 0 avertissement** (sauf les avis `[énigmes]`, qui se lisent un par un : corrige-les ou justifie-les à l'utilisateur, voir le skill `enigmes`). Les rapports des agents listent les « points à vérifier » : traite-les. `references/lecons.md` donne les défauts typiques (drapeau lu mais jamais posé, quêtes à fins alternatives, noms différents pour un même objet, boutiques sans armes…).
   **Énigmes : skill `enigmes`.** Lance `pnpm monde enigmes <id>` (elle *joue* chaque énigme : zéro erreur, chaque avis lu) et joue une énigme de chaque type dans le jeu ; une énigme que tu n'as pas jouée n'est pas finie.
2. **Rejoue les fins avec le moteur d'état** : ajoute au test `packages/regles/tests/monde.test.ts` (modèle : « Val des Cendres : parcours ») un cas par fin qui pose les drapeaux et les objets du chemin et vérifie que la quête principale se termine avec la bonne fin. C'est la seule façon de savoir que l'histoire est finissable.
3. Remplis `chapitres[].quetes` dans `monde.json` avec toutes les quêtes, passe le `statut` à `"publie"`.
4. `pnpm monde doc <id>` : génère `docs/mondes/<id>.md`, que l'utilisateur relira (il juge le ton, les personnages, les fins, la générosité des trésors).
5. **Images du monde** (après accord de l'utilisateur : c'est payant, environ 0,01 $ l'image avec Klein) : `pnpm images monde <id>` liste les lieux ; génère **lieu par lieu** (`--lieu <lieu> --go`), relis chaque lot à l'œil, corrige un refus ou une image fausse par une retouche dans `packages/mondes/<id>/images.json` (jamais dans les fiches), puis `python3 outils/images/installer.py monde <id>` installe les WebP et le manifeste. Ne jamais illustrer les héros du joueur. Pièges connus : `references/lecons.md` § Images ; détails : `docs/M2-IMAGES.md`.
6. **Scènes narrées** : écris `scenes/scenes.json` (format : `docs/MONDES.md`) : au moins l'ouverture (`{ "debut": true }`, en `"presentation": "film"` : 5 ou 6 plans, environ une minute, du passé lointain jusqu'à l'arrivée du groupe, sans rien révéler du secret), la remise de la quête principale, l'entrée du donjon final, et une scène par fin (le plus simple : l'épilogue découpé en trois plans). Images : celles du monde. Textes pour le joueur, sans révélation anticipée. `pnpm monde valider` les vérifie. Les voix : `pnpm voix generer <id> --go` **après accord de l'utilisateur** (payant, quelques centimes par scène).
7. `pnpm monde estimer <id>` : écrit `estimation.json` (durée et coût d'API pour le joueur, affichés sur l'écran « Choisir une histoire » ; un test exige qu'il soit à jour). Signale à l'utilisateur la durée et le coût obtenus : une histoire trop longue coûte cher au joueur, qui paie avec sa propre clé.
8. `pnpm test` et `pnpm typecheck` verts.
9. Mets à jour `docs/MONDES.md` (liste des mondes), `docs/JOURNAL.md`, la mémoire du projet ; propose le commit (demande l'accord avant).

## Écrire les textes en série (passages, accroches, descriptions) : agents Haiku

Pour un grand nombre de petits textes (une phrase par lien, par lieu…), **toujours des agents Haiku** (consigne de l'utilisateur), en lots de ≈ 25 : un script (dans le bac à sable, jamais d'apostrophes dans un `node -e`) découpe les entrées en `sorties/<atelier>/lot-N.json` avec les fiches des deux lieux, un fichier de consignes commun (format JSON de sortie, 12 à 30 mots, interdits, varier les débuts) et chaque agent écrit **uniquement** son `sortie-lot-N.json`. Un script contrôle (JSON valide, tout est couvert, longueurs, mots interdits, débuts répétés), le directeur relit, corrige à la main et compile dans le monde. Modèle : passages et accroches du Val des Cendres (journal du 04/11/2026). Piège : un `retour` est mort quand le lieu d'arrivée déclare son propre lien ; le résumé d'un lieu jamais visité peut divulguer, on ne s'en sert pas comme repli.

## Atelier d'écriture : une scène clé à plusieurs voix (méthode éprouvée, pilote du conseil des Gardiens)

Pour **une scène où plusieurs PNJ s'opposent** (conseil, procès, dispute, repas tendu), un seul auteur tend à lisser les voix en un consensus poli. L'atelier donne à chaque PNJ **son propre avocat** (un agent) avant d'assembler. Ce n'est pas un système d'exécution : tout se passe à l'écriture, le jeu ne lit que du JSON. À réserver aux 3 ou 4 scènes qui portent le monde, pas à chaque PNJ (comptez une dizaine d'appels, abonnement Claude Code, rien sur OpenRouter).

1. **Brief du directeur** (`sorties/atelier-pilote/00-brief-directeur.md`, git-ignoré) : la scène, les temps forts imposés, un tableau « qui sait / cache quoi », les **interdits absolus** (révélations réservées à d'autres moments du monde), le ton. Choisir des tempéraments **asymétriques** (un qui veut partir, un qui veut tenir, un qui se tait, une qui cache) et donner à chacun **une fissure**.
2. **Tour 1 : positions** (un agent par PNJ, en parallèle, Sonnet, lecture seule) : ce qu'il veut, ce qu'il ne dira pas, ce qu'il pense des autres, 3 phrases, un geste qui le trahit. Le directeur relit et **tranche les conflits de savoir** (qui dit un chiffre le premier, qui découvre quoi) dans un fichier de décisions.
3. **Tour 2 : réactions** (mêmes agents, qui lisent les trois autres positions) : 4 à 6 répliques de 40 mots au plus, étiquetées « réagit à X », au moins une **opposition frontale** et une **fissure**, plus un sujet de suivi.
4. **Architecte** : assemble la narration (300 à 420 mots, présent, « vous » pour le groupe qui ne parle jamais, finit sur une question sans réponse). Le directeur **arbitre les doublons** : trois avocats sur quatre ouvrent sur le même détail, il n'en garde qu'un.
5. **Critique** (Haiku suffit, relecture) : révélations interdites, cohérence de savoir, dérive de voix, consensus mou, clarté. **Garder son jugement** : il a vu juste sur un contresens (« voter des tonneaux »), une voix non reconnaissable et un PNJ sans position ; il a eu tort de vouloir supprimer une réplique qui ne nommait personne.
6. **Compilation par script** (un fichier `.mjs` dans le bac à sable, jamais d'apostrophes dans un `node -e`), `pnpm monde valider`, `pnpm monde estimer` si le monde change, et un **test du moteur qui joue la scène** (modèle : `packages/regles/tests/conseil-gardiens.test.ts`).

Pièges rencontrés : les avocats **anticipent** un fait que le PNJ ne peut pas encore connaître (« neuf ans » avant l'aveu) ; ils **recopient une phrase de la fiche** (« cinquante » pour la garde) ; ils réagissent à une réplique **qui a été coupée** à l'assemblage ; un mot banal frôle un secret (« rations », « avec ce que nous portons » pour le grain). Les `repliques`/`opinions` des compagnons du schéma ne sont **lues par rien** dans le jeu : une scène à plusieurs voix passe par un **événement** (narration) et des **sujets** (réponses), seuls textes que le moteur affiche. Un sujet n'est joignable que **là où le PNJ se trouve** (`parler` exige sa présence) : une scène tenue dans un lieu ne rend pas ses PNJ présents ailleurs. Une narration longue s'affiche en paragraphes si on sépare par `\n\n` (le jeu découpe sur les lignes vides).

## Ce qui fait un bon monde (à garder en tête à chaque étape)

- **Des PNJ qui ont des désirs, des peurs et des secrets**, une voix distincte et des sujets qui font avancer ; pas des distributeurs de quêtes.
- **Plusieurs façons de résoudre** : négocier, ruser, corrompre, fuir. Les rencontres importantes ont des alternatives.
- **Des trésors qui récompensent l'exploration** : cachés, verrouillés, gardés, piégés ; quelques belles trouvailles, jamais d'objet disproportionné pour le niveau.
- **Des énigmes solubles par déduction** à partir de ce que le groupe peut voir ; le moteur tranche la réponse. Le joueur répond par un formulaire adapté au type (éléments à ordonner, nombres, leviers, placement) : voir le skill **`enigmes`** (écriture et vérification obligatoire), `docs/MONDES.md` § Énigmes et `references/lecons.md`.
- **Des choix qui coûtent** et une jauge qui rend le temps précieux.
- **Du concret visuel** : chaque lieu et chaque PNJ se dessine (c'est ce qui nourrira les illustrations).
