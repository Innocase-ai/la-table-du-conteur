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

1. `pnpm monde valider <id>` et corrige jusqu'à **0 erreur, 0 avertissement**. Les rapports des agents listent les « points à vérifier » : traite-les. `references/lecons.md` donne les défauts typiques (drapeau lu mais jamais posé, quêtes à fins alternatives, noms différents pour un même objet, boutiques sans armes…).
2. **Rejoue les fins avec le moteur d'état** : ajoute au test `packages/regles/tests/monde.test.ts` (modèle : « Val des Cendres : parcours ») un cas par fin qui pose les drapeaux et les objets du chemin et vérifie que la quête principale se termine avec la bonne fin. C'est la seule façon de savoir que l'histoire est finissable.
3. Remplis `chapitres[].quetes` dans `monde.json` avec toutes les quêtes, passe le `statut` à `"publie"`.
4. `pnpm monde doc <id>` : génère `docs/mondes/<id>.md`, que l'utilisateur relira (il juge le ton, les personnages, les fins, la générosité des trésors).
5. **Images du monde** (après accord de l'utilisateur : c'est payant, environ 0,01 $ l'image avec Klein) : `pnpm images monde <id>` liste les lieux ; génère **lieu par lieu** (`--lieu <lieu> --go`), relis chaque lot à l'œil, corrige un refus ou une image fausse par une retouche dans `packages/mondes/<id>/images.json` (jamais dans les fiches), puis `python3 outils/images/installer.py monde <id>` installe les WebP et le manifeste. Ne jamais illustrer les héros du joueur. Détails : `docs/M2-IMAGES.md`.
6. `pnpm test` et `pnpm typecheck` verts.
7. Mets à jour `docs/MONDES.md` (liste des mondes), `docs/JOURNAL.md`, la mémoire du projet ; propose le commit (demande l'accord avant).

## Ce qui fait un bon monde (à garder en tête à chaque étape)

- **Des PNJ qui ont des désirs, des peurs et des secrets**, une voix distincte et des sujets qui font avancer ; pas des distributeurs de quêtes.
- **Plusieurs façons de résoudre** : négocier, ruser, corrompre, fuir. Les rencontres importantes ont des alternatives.
- **Des trésors qui récompensent l'exploration** : cachés, verrouillés, gardés, piégés ; quelques belles trouvailles, jamais d'objet disproportionné pour le niveau.
- **Des énigmes solubles par déduction** à partir de ce que le groupe peut voir ; le moteur tranche la réponse.
- **Des choix qui coûtent** et une jauge qui rend le temps précieux.
- **Du concret visuel** : chaque lieu et chaque PNJ se dessine (c'est ce qui nourrira les illustrations).
