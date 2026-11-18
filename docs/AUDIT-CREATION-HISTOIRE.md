# Audit du moteur de création d'histoire (18/11/2026)

Audit en lecture seule de tout ce qui sert à fabriquer une histoire jouable, de l'idée à la publication :
- le format des données (`packages/regles/src/monde/schemas.ts`, chargeur, extensions, `docs/MONDES.md`) ;
- les outils (`pnpm monde …`, validateur, complétude, revue, parcours, `outils/images/`, `outils/voix/`) ;
- l'importateur et l'exportateur de la Forge d'Histoires ;
- les skills d'écriture de `.claude/skills/` et le sous-agent `auditeur-coherence-histoire`.

Aucun fichier du dépôt n'a été modifié (ce rapport mis à part), rien n'a été commité, aucune API payante n'a été appelée : images et voix en simulation seulement, sans `--go`.

**Corrigés le 18/11/2026 (accord de l'utilisateur : « rangs 1 à 4 »)** : rangs 1 à 4 du §5, soit S1, S2 (en partie), G1 à G6. Tests : `outils/monde/audit-creation-histoire.test.ts` (15 tests, dont 14 qui échouaient avant la correction) ; installateur essayé sur une copie dans un dossier temporaire (le dépôt n'a pas de test Python ; essai décrit dans `docs/JOURNAL.md`). **Corrigés le 18/11/2026 (accord de l'utilisateur : « go pour les rangs 5 et 6 »)** : rangs 5 et 6, soit S3, S4, S5 et C4 à C7, plus une partie de C8 (influence, ce que lit le joueur, longueur des descriptions, accents des contenants, `decouverte`). La ligne `CLAUDE.md:71` reste à aligner : le texte proposé est dans `docs/JOURNAL.md`. Les autres constats restent à faire.

**Corrigés le 18/11/2026 (lot 1, groupe 2, `docs/FICHES-LOT-1.md`)** : O1 à O9 (fiche C3 : commande inconnue refusée, options strictes, fichiers JSON mal formés rapportés, `--sans-parcours` et canon vide dits, squelette de `nouveau` valide, `doc` en code 1, conseil `--ms`, « 0 fin » en avis), G8, S6, S8, C1 (fiche C4), et le code de G7 (fiche C2). Tests : `outils/monde/lot1-cli.test.ts` (17), `outils/monde/lot1-forge.test.ts` (5), `packages/regles/tests/lot1-creation.test.ts` (7). Restent : O10 à O12, G9 (fiche C1, groupe 4) et les données de G7.

**Ce qui n'est pas repris.** `docs/AUDIT-MOTEUR.md` (moteur de jeu) n'est pas refait. Ses constats M22 (`debloquer`, lieux sans retour, conditions impossibles, quête sautable approximative), M23 (clé de nuit et groupe de test du parcours) et §5 (mémoire du parcours) restent valables ; ils ne sont pas répétés ici. `docs/AUDIT-MOTEUR-HISTOIRE.md`, un plan d'écriture plus ancien, n'est pas non plus repris.

**Méthode.**
- Deux relectures déléguées : une par Haiku (les skills, contre le schéma), une par Sonnet (le code des garde-fous et des outils).
- Chaque constat de ce rapport a été revérifié par l'auteur, soit par une commande, soit par une lecture ligne à ligne.
- Les essais sont faits sur un **monde d'essai hors du dépôt** : l'exemple de la Forge (`outils/monde/fixtures/villambrune.forge.json`), importé par `ecrireMondeForge` dans le dossier temporaire de la session. On y injecte des défauts un par un, puis on compare le diagnostic à celui de départ.
- L'installateur d'images est essayé sur une **copie** de `installer.py`, posée dans une arborescence temporaire.
- Scripts : annexe en fin de rapport.

**Certitude.** *Reproduit* : un essai montre le défaut. *Lu* : vérifié ligne à ligne dans le code, sans essai. *Plausible* : probable, mais pas démontré.

**Gravité.**
- *Bloquant* : une histoire cassée ou trompeuse peut être publiée sans que l'outil le dise, ou l'outil empêche de travailler.
- *Gênant* : l'auteur doit le savoir et le vérifier à la main.
- *Cosmétique* : texte, cas rare ou latent.

## 0. Mesures de départ (18/11/2026)

| Commande | Marche d'Ombrefiel | Dîme des Roseaux | Tombe des Rois Serpents |
|---|---|---|---|
| `pnpm monde valider` | 0 erreur, 30 avis, code 0 | 0 erreur, 5 avis, code 0 | 0 erreur, 4 avis, code 0 |
| `pnpm monde manque` | 0 manque, 4 avis (2 fins sans scène, 2 lieux sans arrivée), code 0 | 0 manque, 0 avis, code 0 | 0 manque, 0 avis, code 0 |
| `pnpm monde verifier` | « Rien ne bloque », 2/2 fins (732 états), 19 s, code 0 | « Rien ne bloque », 4/4 fins (751 états), 7 s, code 0 | « Rien ne bloque », 5/5 fins (576 états), 14 s, code 0 |
| `pnpm monde enigmes` | 1 énigme, 8/8 contrôles | 3 énigmes, toutes vertes | 3 énigmes, toutes vertes |

- **`pnpm test`** : `Test Files 185 passed (185)`, `Tests 2618 passed | 3 skipped (2621)`, 37,8 s, code 0.
- **Simulations** : `pnpm images monde`, `pnpm images cartes`, `pnpm images communs proposer`, `pnpm voix lister` et `pnpm voix generer` (sans `--go`) tournent sans erreur. Elles n'écrivent rien : `git status` était vide après coup.
- **Le Médaillon de la Sœur Endormie**, seul épisode écrit selon le cap du 15/11 (en brouillon) : `valider` donne 0 erreur et 29 avis, **dont 18 avis « Richesse »** (voir S1).

**Mesures sur les données**, faites par un script qui charge les mondes et ne modifie rien :

| | Marche | Dîme | Tombe | Médaillon |
|---|---|---|---|---|
| PNJ avec moins de 4 sujets | **6** (Obert, Perrin, Ysabeau, Lambert, Hilaire, Odile : 3 chacun) | 0 | 0 | 0 |
| Récits d'arrivée hors de 130-170 mots | 0 sur 30 | 0 sur 30 | 0 sur 43 | 0 sur 9 |
| Réponses de PNJ hors de 75-115 mots | 1 sur 60 | **25 sur 121** (de 60 mots au minimum) | 1 sur 147 | 1 sur 38 |
| Étapes de quête avec `lieu` | 0 | 0 | 0 | 0 |
| Quêtes avec `lieu` (au niveau de la quête) | 9 sur 9 | 12 sur 12 | 15 sur 15 | 2 sur 2 |
| … dont ce `lieu` n'est pas celui du donneur | 4 | 4 | 10 | 0 |

**Verdict en une phrase.** L'outillage vérifie bien la justesse des données : références, schéma, énigmes jouées, fins prouvées, secrets du canon. Mais il **ne vérifie aucune des règles qui définissent un épisode** (cap du 15/11, règles du 16/11), et il ne voit aucun des quatre défauts trouvés à la main dans la Tombe. Toutes les règles de forme sont de simples avis, noyés parmi des avis « Richesse » faits pour l'ancien modèle.

---

## 1. Garde-fous : les défauts réels que l'outillage laisse passer

### G1. Aucun contrôle du nombre de PNJ par lieu, ni des pièces vides · gênant · reproduit · **corrigé le 18/11/2026** (avis « Lieux surpeuplés », tous les mondes ; « pièces vides » dans le profil « épisode »)
- **Où** : `packages/regles/src/monde/validation.ts:288-332`. La boucle des PNJ vérifie seulement que `lieu` et `presences` existent. Aucune règle « densité » ou « pièce vide » n'existe dans `packages/regles/src` ni dans `outils/`. La fiche F2 du PRD n'est pas implémentée.
- **Ce qui se passe** : les douze PNJ du Fort de la Tombe, sur un seul écran, n'ont produit aucun avis. Un bâtiment du lieu de départ sans PNJ, sans trésor ni service n'en produit pas non plus.
- **Reproduire** : sur le monde d'essai, essai A (11 PNJ clonés dans le lieu d'un PNJ existant, soit 12) : aucun avis ne cite ce lieu. Seuls les comptes « Richesse » changent (`16 PNJ pour 1 chapitre(s) (objectif : 25)`). Essai H (une grange vide ajoutée au village) : seul l'avis `9 lieux pour 1 chapitre(s) (objectif : 30)` apparaît.
- **Correction** : un avis quand un lieu reçoit plus de 6 PNJ qui parlent, en comptant les `presences` du même moment. Un avis pour une pièce du lieu de départ sans aucune « couche » (PNJ, contenant, service, rencontre, examen), comme le prévoit F2.

### G2. Le `titre` d'un PNJ n'est pas contrôlé : « (Compagnon) » passe · gênant · reproduit · **corrigé le 18/11/2026** (avis « Titres qui trahissent » ; la Tombe d'avant le 18/11 le déclenche pour Varnac, Lysandre et Mireille). Les mots tabou du canon ne sont pas lus (le validateur ne charge pas `canon.json`).
- **Où** : `schemas.ts:386` (`titre: z.string().optional()`). Le joueur lit ce titre (`modules/dialogue.ts:50-51`, `libelleDuPnj`), mais aucun contrôle ne le lit, ni dans `validation.ts`, ni dans `revue.ts` (`revue.ts:233` le range seulement parmi les mots « connus »). `MOTS_MECANIQUE` (`validation.ts:53`) ne vaut que pour les récits d'arrivée.
- **Ce qui se passe** : « (Compagnon) » dans trois titres de la Tombe trahissait qui est recrutable, sans que rien ne le signale.
- **Reproduire** : essai B, `titre: "Mercenaire (Compagnon)"` et « (Compagnon) » ajouté au `nom` : +0 avis.
- **Correction** : un avis quand le `titre` ou le `nom` contient des parenthèses, un mot de mécanique (`compagnon`, `recrutable`, `boss`, `PNJ`, `quête`) ou un mot tabou du canon.

### G3. Une réplique qui place un PNJ ailleurs n'est pas détectée · gênant · reproduit · **corrigé en partie le 18/11/2026** (avis « Répliques qui placent un PNJ ailleurs » : seules les tournures « vous me trouverez à… », « je suis au… » suivies du nom d'un lieu, dans la même phrase. Les trois répliques de la Tombe étaient des indications de décor, « sur le muret de la fontaine », que l'heuristique ne lit pas ; deux premières versions plus larges donnaient des faux positifs dans la Dîme et la Tombe)
- **Où** : aucun contrôle croisé entre les textes et `pnj.lieu` ou `presences`. `revue.ts` cherche les mots tabou (l. 128), les écarts au canon des personnages (l. 149-169), les liens réciproques (l. 172-187) et les noms propres isolés (l. 213-271). Un nom de lieu existant est un mot « connu », donc jamais signalé.
- **Ce qui se passe** : les trois répliques de la Tombe (Marta, Nolan, Mireille) recalées à la main le 18/11. Le défaut reviendra à chaque déplacement de PNJ, et le découpage des lieux de départ en pièces va justement en multiplier.
- **Reproduire** : essai K, réponse « Vous me trouverez toujours aux écuries du Fort, près de la forge. » sur un PNJ du village : +0 avis.
- **Correction** : pour chaque réponse et chaque salutation, chercher les noms des lieux du monde (et leurs mots distinctifs : « écuries », « forge »…). Donner un avis quand le lieu cité n'est ni le lieu du PNJ, ni l'une de ses présences, ni un lieu voisin de celui-ci. L'heuristique fera des faux positifs : avis seulement, rejetables dans `revue.json` comme les noms inconnus.

### G4. L'installateur d'images reconstruit le manifeste et perd des entrées, sans rien dire · gênant (bloquant si personne ne relance `manque`) · reproduit · **corrigé le 18/11/2026** (fusion, `+ ~ - !` affichés, `--purger`, groupe `monstres` gardé, accents de la console)
- **Où** : `outils/images/installer.py:103-118`.
  - Le manifeste repart de zéro (l. 103).
  - Il ne contient que les PNG présents dans `sorties/images/mondes/<id>/` (l. 104-110).
  - De l'ancien manifeste, il ne garde que les entrées `commun:` (l. 112-117).
  - Il réécrit le fichier entier (l. 118) et n'affiche que le total. Il ne dit jamais ce qui a disparu.
  - Le groupe `monstres` disparaît lui aussi : il est absent de `GROUPES`, l. 21.
- **Ce qui se passe** : `parchemin-localisation-objet` (Tombe) a été perdu le 18/11, parce que son PNG n'était plus dans `sorties/`. Le défaut **reviendra à la prochaine installation** : le PNG n'y est toujours pas, alors que le `.webp` et l'entrée sont dans le dépôt. Même effet sur une autre machine, ou après avoir vidé `sorties/` (hors de git).
- **Reproduire** : dans une arborescence temporaire, une copie de `installer.py`, un seul PNG `lieu-a.png`, et un manifeste existant qui cite aussi `objets.parchemin` (dont le `.webp` existe). Après `uv run --with pillow python outils/images/installer.py monde x`, le manifeste n'a plus que `lieux.a` et `pnj.p` (la référence `commun:`). `objets` est vide, `monstres` a disparu, `objet-parchemin.webp` est resté sur le disque, orphelin, et la sortie dit seulement `2 image(s) installées`.
- **Ce qui le rattrape** : `pnpm monde manque`, s'il est relancé. Sur le monde d'essai, une entrée d'objet retirée du manifeste donne bien `MANQUE [images] potion-de-soin`. Mais un objet qui a une image commune de repli, ou un lieu dont on a gardé un ancien PNG, ne serait pas signalé.
- **Correction** : partir de l'ancien manifeste. Ajouter ou remplacer ce que `sorties/` apporte, et garder une entrée tant que son `.webp` existe. N'enlever qu'avec `--purger`. Afficher la liste de ce qui change. Le skill `creer-monde` (étape 11) et `verifier-completude-histoire` doivent nommer ce piège.

### G5. `manque` et `verifier` ne vérifient pas que les images existent sur le disque · gênant · reproduit · **corrigé le 18/11/2026** (manque : fichier absent, référence `commun:` inconnue ; avis : entrée orpheline)
- **Où** : `completude.ts:49-53` ne regarde que la présence d'une clé dans le manifeste. `verifierImages` (`monde/images.ts:45`) contrôle les entrées inconnues et les références `commun:` inconnues, mais seuls les tests l'appellent. La présence des fichiers n'est vérifiée que par `pnpm test` (`packages/regles/tests/monde.test.ts:179-185`).
- **Reproduire** : sur le monde d'essai, un manifeste qui cite une image pour chaque lieu, PNJ et objet, **sans aucun fichier `.webp`** : `manques images = []`. Une entrée `"fantome": "pnj-fantome.webp"` n'est pas signalée non plus (lu).
- **Correction** : dans `completudeDuMonde`, appeler `verifierImages` et tester l'existence de chaque fichier. Le résultat devient un manque, rubrique `images`.

### G6. Les champs « À écrire » et « à définir » ne sont jamais signalés · bloquant · reproduit · **corrigé le 18/11/2026** (manques de la rubrique `textes`)
- **Où** : le squelette (`outils/monde/nouveau.ts:43-50`) et l'importateur de la Forge (`importer-forge.ts:86, 651`) écrivent `À écrire : …` et `à définir`. Aucune occurrence de ces marques n'est cherchée dans `validation.ts`, `completude.ts`, `controles.ts` ni `verifier.ts`. Seul `BRIEF-ECRITURE.md` conseille de les chercher à la main.
- **Reproduire** : le monde d'essai importé compte **34** « À écrire » dans ses lieux et PNJ. `verifierMonde(…, { parcours: false })` donne `Validation 0 erreur, 30 avis`, et aucune rubrique ne les nomme. Ici, la complétude échoue pour d'autres raisons : sans scène d'ouverture ni images, un monde reste bloqué. Un monde qui aurait ses images et ses scènes passerait donc, avec ses « À écrire ».
- **Correction** : une rubrique `textes` de `manque`, « N champs encore à écrire », avec la liste (chemin, id). C'est un manque bloquant dès que le monde est publié ou qu'on lance `verifier`.

### G7. Le `lieu` d'une quête s'affiche sur le parchemin, sans règle ni documentation · gênant · lu et mesuré · **corrigé le 18/11/2026** (lot 1 : `Quete.lieu` documenté, avis « pas le lieu du donneur », et les données des 18 quêtes : Marche 4, Dîme 4, Tombe 10)
- **Où** : `Quete.lieu` (`schemas.ts`, quêtes) n'est documenté ni dans `docs/MONDES.md` ni dans un skill : `creer-intrigue:24` ne parle que du `lieu` d'une **étape**. Le jeu l'affiche pourtant (`apps/jeu/src/quete-regles.ts:70-72`) : « Confiée par **<PNJ>, <métier> — <lieu de la quête>** » (`aventure/EcranQuete.tsx:63-67`).
- **Ce qui se passe** :
  - Dans la Marche, 4 quêtes ont pour `lieu` celui de l'**objectif**, pas celui du donneur. Exemple : `q-la-prime-sur-demi-dent` → `ald-carriere-huttes-et-poste-de-commandement`, alors que le donneur est à l'auberge. Le parchemin annonce donc la destination, contre la règle du 16/11.
  - Dans la Tombe, 10 quêtes sur 15 ont un `lieu` qui n'est pas celui du donneur. Exemple : `q-tombe-des-rois-serpents` → `fort-du-reflet-beni`, donneur au bivouac. Depuis le découpage du Fort, `q-contrat-eau-du-fort` → la cour, donneur à l'auberge. L'origine affichée est donc fausse.
  - L'importateur de la Forge pose ce `lieu` sur le lieu du donneur (`importer-forge.ts:595`), ce qui est cohérent.
- **Reproduire** : le script `qlieu.ts` (annexe) compare `q.lieu` au `lieu` du donneur.
- **Correction** :
  - Documenter `Quete.lieu` comme « le lieu où la quête est confiée ».
  - Donner un avis quand il diffère du lieu (ou d'une présence) du donneur.
  - Les données de la Marche et de la Tombe sont à corriger à part (hors de cet audit).

### G8. L'importateur de la Forge écrit des journaux de quête qui nomment le lieu · gênant · reproduit · **corrigé le 18/11/2026** (lot 1, groupe 2 : textes d’étape « À écrire … ne nommez pas ce lieu », dans le brief)
- **Où** : `outils/monde/importer-forge.ts:486`, `texte: \`Rendez-vous à ${nom(l)}.\``. Viennent ensuite « Vainquez Goule des cryptes. » et « Trouvez Médaillon de sainte Odile. » (l. 499, 528), sans article. Ces textes ne commencent pas par « À écrire », donc ils **ne figurent pas dans l'inventaire du brief** (`inventaireAEcrire`, l. 718-732), et l'agent d'écriture ne les reprend pas.
- **Ce qui se passe** : l'option `reperes` retire bien le `lieu` des étapes (l. 580), mais le texte du journal dit encore « Rendez-vous à Ruines de la chapelle brûlée. ». C'est contraire à `creer-intrigue:24` (« le journal ne nomme un lieu que si un PNJ l'a dit »). Le Médaillon a été réécrit à la main pour cette raison (journal du 16/11, suite 9).
- **Reproduire** : sur le monde d'essai, les 7 étapes importées, dont `le-medaillon-vole/aller-ruines-de-la-chapelle-brulee: « Rendez-vous à Ruines de la chapelle brûlée. »`.
- **Correction** : écrire `À écrire : ce que le joueur cherche à cette étape (sans nommer <lieu>)`. Ces champs entrent alors dans le brief.

### G9. Toutes les règles de forme sont des avis : rien ne fait échouer `verifier` · gênant · lu · **corrigé le 18/11/2026** (rubrique « Défauts de jeu » de `verifier` ; défauts acceptés dans `revue.json` avec leur raison)
- **Où** : `outils/monde/verifier.ts:80`. Seul `diag.erreurs` met la validation en échec. Les avis du validateur, nombreux, ne bloquent jamais : textes secs, quête sautable, sans retour au donneur, « Richesse »…
- **Ce qui se passe** : la Marche est publiée avec 30 avis. Parmi eux, deux sont de vrais défauts de jeu : `flacon-de-toxine-x44` est exigé par une quête mais ne se trouve nulle part, et le drapeau `z2-davor-neutralise` est lu mais jamais posé. Ils se trouvent noyés parmi 13 avis « Richesse », et `verifier` dit « Rien ne bloque ».
- **Correction** : trier les avis en deux familles.
  - Les **défauts de jeu** : objet exigé introuvable, drapeau jamais posé, quête sautable, sans retour. Ils deviennent bloquants pour un monde publié, ou passent en `echec` dans `verifier`.
  - Les **conseils d'écriture** : richesse, longueurs. Ils restent des avis.

---

## 2. Adéquation au cap du 15/11 (saga d'épisodes)

### S1. Le validateur pousse vers l'ancienne grande histoire · gênant · reproduit · **corrigé le 18/11/2026** (opt-in `"format": "episode"` dans `monde.json`, activé sur aucun monde ; sur le Médaillon, en mémoire : les 18 avis « Richesse » disparaissent, 3 avis « Épisode » apparaissent)
- **Où** : `validation.ts:64-67`, `MINIMA_PAR_CHAPITRE`. Par chapitre : 30 lieux, 25 PNJ, 75 sujets, 3 marchands, **3 compagnons**, 6 secondaires, **3 personnelles**, 25 trésors, 10 objets, 3 énigmes, 5 pièges, 15 rencontres, 40 faits, **4 factions**, 3 tables. Les mêmes chiffres sont dans `docs/MONDES.md:251`. S'y ajoutent les avis « moins de 3 grottes », « moins de 1 donjon », « ni village ni ville ».
- **Ce qui se passe** : le Médaillon, l'épisode modèle, reçoit 18 avis « Richesse » sur 29. Ces avis **demandent ce que le PRD exclut** (« pas de quêtes personnelles ni de faction à part », PRD-SAGA décision 2). La Tombe reçoit « ni village ni ville » alors que son lieu de départ est un fort, ce que le PRD admet (« village, quartier ou château »).
- **Correction** : un profil **« épisode »**, en opt-in par les données (P2) : par exemple `monde.format: "episode"`, ou bien déduit de `niveaux.max - niveaux.min ≤ 1`. Ce profil remplace les minima de chapitre par les règles du cap (S2). Les minima actuels restent pour les mondes sans le champ (P1).

### S2. Aucune règle du cap n'est contrôlée · gênant · reproduit · **corrigé en partie le 18/11/2026**, dans le profil « épisode » : lieu de départ, pièces vides, quêtes, une principale, ni personnelle ni faction, 4 sujets, `lieu` d'étape, arrivées, rareté du catalogue, palier des tables. Restent non vérifiés : 2 sujets sur la quête principale, 1 à 3 objets uniques, scène d'arrivée au lieu de la quête principale, réponses de 75 à 115 mots

| Règle (PRD-SAGA, CLAUDE.md) | Contrôle aujourd'hui | Essai |
|---|---|---|
| Lieu de départ de 10 à 13 pièces | aucun (seul un seuil de 5 enfants déclenche la carte illustrée, `completude.ts:39`) | — |
| 3 à 8 quêtes | aucun | F (12 quêtes) : aucun avis de nombre |
| Exactement une quête principale | « Aucune quête principale » seulement (`validation.ts:708`) | J : avis ; deux principales passent (lu) |
| Chaque PNJ qui parle a au moins 4 sujets | avis seulement à **0** sujet (`validation.ts:331`) | C (1 sujet) : aucun avis ; la Marche a 6 PNJ à 3 sujets sans avis |
| Au moins 2 sujets sur la quête principale par PNJ du lieu de départ | aucun | — |
| Aucun `lieu` sur les étapes | l'existence du lieu seulement (`validation.ts:439`) | E : aucun avis |
| Récit d'arrivée de 130 à 170 mots | avis sous 110 mots (`TEXTES_SECS`, l. 61) ou hors de 40 à 220 (`ARRIVEE_MOTS`, l. 50) | D (50 mots) : avis ; D2 (215 mots) : aucun |
| Réponse de PNJ de 75 à 115 mots | avis sous 60 mots (`TEXTES_SECS.reponse`) et sous 35 (`MOTS_REPONSE_MIN`) | Dîme : 25 réponses hors cible, aucun avis |
| Butin plafonné au niveau | rareté des seuls **objets propres** au monde (`validation.ts:267-268`) ; rien sur les objets du catalogue, le `palier` des tables ni la valeur | G (épée vorpale, légendaire, dans un trésor de niveau 1) : aucun avis ; N (cape de protection, rare) : aucun ; M (500 po sans obstacle) : aucun |
| 1 à 3 objets uniques, rattachés à la quête principale ou au boss | aucun | — |
| Une scène à l'arrivée au lieu de la quête principale (décision 9) | ouverture et fins seulement (`completude.ts:80-81`) | lu |

- **Correction** : les contrôles du profil « épisode » (S1). Ce sont des avis de densité, au barème indicatif (F2), et des avis de quêtes (F3). Pour le butin : la rareté du **catalogue** comparée au niveau du monde, et `palier` comparé à `niveaux` (F4, partie statique). La partie qui tourne à l'exécution reste une évolution du moteur.

### S3. Le chef d'orchestre `creer-monde` décrit encore la grande histoire · gênant · lu · **corrigé le 18/11/2026** (réécrit autour du chemin « épisode », grande histoire en annexe)
- **Où** : `.claude/skills/creer-monde/SKILL.md`.
  - l. 10 : les références sont « la Marche (publiée) et la Dîme (brouillon court) », plus le Val, la Citadelle, Port-Sillage et Ombresang. Ni la Tombe ni le Médaillon n'y figurent.
  - l. 33-39 : les règles des sous-régions d'Ombresang (« Lame-Rousse uniquement »), alors qu'Ombresang est abandonné.
  - l. 72 : taille par défaut « un chapitre complet ≈ 30 lieux, 25 PNJ, 25 trésors, 15 rencontres » ; l. 82 : factions « 4 à 6 » ; l. 90 : 3 dilemmes par chapitre.
  - l. 111-115 : découpage en six zones (Z1 à Z6), un agent Sonnet par zone.
  - Le chemin « épisode » (Forge, puis import, puis écriture par Haiku) tient en **un paragraphe** (l. 74), sans dire quelles étapes V1 à V8 s'appliquent, se fusionnent ou disparaissent pour un épisode.
  - Il ne cite ni les règles du 16/11 (le joueur cherche, au moins 4 sujets, jouer le chemin le plus court), ni les longueurs des textes riches (seulement par renvoi, `references/textes-en-serie.md:13`).
  - Il ne mentionne pas `pnpm images communs proposer` avant de générer des portraits, alors que `CLAUDE.md:29` l'exige (grep vide dans le skill).
- **Correction** : mettre en tête un **chemin « épisode »** : la Forge, les points V1 à V8 adaptés (le canon et l'atlas tiennent en une page), le gabarit du lieu de départ, les règles du 16/11, les longueurs et la bibliothèque commune. Passer le chemin « grande histoire » en annexe. Supprimer les règles d'Ombresang.

### S4. Les skills d'appui comptent « par chapitre » et réclament des quêtes personnelles · gênant · lu · **corrigé le 18/11/2026**
- `creer-marchands-compagnons/SKILL.md:22` : « 3 marchands par chapitre au moins ». l. 49 et 54 : « un ou deux compagnons par chapitre », avec leur quête `personnelle`.
- `creer-intrigue/SKILL.md:65` : « 6 par chapitre visé par le validateur » pour les quêtes secondaires. Pour un épisode, le total visé est de 3 à 8 quêtes, la principale comprise.
- `creer-dilemmes/SKILL.md:47` : « 3 dilemmes par chapitre ».
- `creer-personnages/SKILL.md:51` : « à appliquer à tout PNJ d'Ombresang ». l. 56 : des questions sur « la sous-région ou la région ».
- **Correction** : remplacer « par chapitre » par « par épisode », avec les chiffres du PRD. Dire qu'un compagnon d'épisode n'a pas de quête personnelle autonome (PRD décision 2) ; sa quête, s'il en a une, est une secondaire.

### S5. Les deux auditeurs de cohérence sont écrits pour Ombresang, et l'un est obligatoire · gênant · lu · **corrigé le 18/11/2026** (`auditeur-coherence-episode`, anciens marqués réservés ; `CLAUDE.md:71` à aligner par l'utilisateur)
- **Où** :
  - `.claude/agents/auditeur-coherence-histoire.md`. Le monde audité par défaut est `tests/fixtures/mondes/ombresang/`. Les sources qu'il suit sont `FIL-ROUGE.md`, `atlas-visuel/0N-region-*.md`, les « 5 POI » d'une sous-région, `lieux/SR-*.md`, le préfixe `lr-` et les PNJ canon d'Ombresang (Draven Kael…).
  - `auditer-coherence-monde/SKILL.md:32-37` (« 8 régions et 64 sous-régions »).
- **Ce qui se passe** :
  - `creer-monde:31` et la mémoire du projet rendent ce sous-agent **obligatoire avant chaque page**, pour toute histoire.
  - `CLAUDE.md:71` le limite au contraire aux « histoires d'Ombresang ».
  - Pour le Médaillon, il « n'était pas chargé » et un agent Haiku généraliste l'a remplacé (journal, 16/11, suite 5).
  - Ce sous-agent ne sait pas contrôler ce qui a cassé dans la Tombe : un PNJ cité au mauvais endroit, des titres qui trahissent, trop de PNJ dans un lieu.
- **Correction** : réécrire l'auditeur pour un épisode (sources : `BIBLE.md`, `LIEUX.md`, `canon.json`, les données). Lui donner pour contrôles explicites G1 à G3, le chemin le plus court et les règles du 16/11. Aligner `CLAUDE.md:71`. Ranger `auditer-coherence-monde` avec les skills d'Ombresang.

### S6. Le PRD-SAGA contredit la règle du 16/11 · gênant · lu · **corrigé le 18/11/2026** (F3 de `PRD-SAGA.md` amendée)
- **Où** : `docs/PRD-SAGA.md:55`, fiche F3 : « chaque quête a un `lieu` d'étape ». Or `CLAUDE.md:58` et `creer-intrigue:24` disent : « aucun `lieu` sur les étapes de quête par défaut ».
- **Risque** : qui implémentera F3 en suivant le PRD remettra les marqueurs.
- **Correction** : amender F3 (« lieu d'étape seulement si l'auteur le demande ; le validateur avertit d'un `lieu` d'étape »).

### S7. Ce que l'outillage sait déjà faire pour un épisode · constat
- **La Forge et l'importateur** produisent un squelette d'épisode jouable. Sur l'exemple : 0 erreur, et le parcours atteint la fin (prouvé ici sur le monde d'essai, et par les tests `importer-forge.test.ts`). Les conseils de la recette de la Forge (3 à 8 quêtes, pièces vides, raretés) existent, mais **seulement dans l'éditeur** (`apps/atelier/public/forge/index.html`) : rien ne les vérifie quand le monde est réécrit à la main ensuite.
- **Le parcours, la revue de secrets, l'audit des énigmes, `manque` et `estimer`** servent tels quels.
- **F1** (`chercherPiege`), **F2** (densité), **F3** (grammaire validée), **F4** (plafond au tirage) et **F8** (`commun:lieux`) ne sont pas implémentées. Conclusion : on peut écrire un épisode pilote **à la main**, comme le Médaillon, mais rien ne garantit qu'il tienne le cap.

### S8. L'estimation est imprécise à l'échelle d'un épisode · gênant · reproduit (données) et lu · **corrigé le 18/11/2026** (total = somme des parties, demi-heure ou quart d’heure sous 2 h ; garde de `calibrer` ; tours de conteur des fiches de savoir)
- **Où** : `monde/estimation.ts:139`, `total: Math.round(recit + enCombat)` : le total est arrondi à l'heure, tandis que récit et combats le sont à la demi-heure.
- **Ce qui se passe** :
  - Le Médaillon affiche `recit 1`, `combats 0.5`, `total 1` (`estimation.json`). Le total n'est pas la somme de ses parties, et l'écart de l'arrondi atteint 50 % pour un épisode d'une à deux heures.
  - Sous 0,5 h, le total vaut 0, et `calibrer.ts:56` (`heures / e.heures.total`) rendrait `Infinity` (lu).
  - Les fiches `savoirs/` (conversation libre, donc conteur payant), `codex/` et `interjections/` ne comptent ni dans les tours ni dans le coût (`estimation.ts:107`, `:116-126`, lu).
- **Correction** : un total arrondi à la demi-heure (ou au quart d'heure sous 2 h), une garde contre la division par zéro, et des tours de conteur pour chaque PNJ qui a une fiche de savoir.

---

## 3. Cohérence entre skills, documents et code

### C1. Trois cibles différentes pour le récit d'arrivée · cosmétique · lu · **corrigé le 18/11/2026** (130 à 170 partout ; l’avis « hors de » passe de 40-220 à 40-200 mots)
- `schemas.ts:502` : « 60 à 150 mots ». `validation.ts:48` : « la cible est de 60 à 150 mots ». Le code, lui, avertit hors de 40 à 220 et sous 110.
- `docs/MONDES.md:39`, `creer-monde/references/textes-en-serie.md:13`, `decrire-lieux/references/brief-agent-lieu.md:29`, `importer-forge.ts:699` et l'assistant de l'atelier : 130 à 170.
- `creer-monde/SKILL.md:63` : « lis `schemas.ts` (le schéma qui fait foi) » : un agent qui suit cette consigne lit 60-150.
- **Correction** : commentaires de `schemas.ts:502` et `validation.ts:48` à « 130 à 170 » ; seuils d'avis à 110 et 200.

### C2. `verifier-completude-histoire` renvoie encore à Ombresang et tait l'installateur · cosmétique · lu
- l. 41 : « Ombresang provisoirement en `publie` pour l'essai ».
- Les « Pièges connus » ne citent pas la perte d'entrées du manifeste (G4), ni le fait que `manque` ne vérifie pas les fichiers (G5).
- **Correction** : remplacer l'exemple par « le monde en cours, provisoirement publié » et ajouter les deux pièges.

### C3. `CLAUDE.md` ne liste pas tous les skills de création · cosmétique · lu
- La liste (`CLAUDE.md:36-51`) omet `auditer-coherence-monde`, `creer-actions` (ébauche), `creer-grand-monde`, `creer-atlas-visuel` et `creer-carte-monde`. Ces trois derniers sont d'Ombresang : il faut le dire, pour qu'on ne les prenne pas pour le chemin courant.

### C4. Le guide de zone copié dans chaque nouveau monde demande « au moins 3 sujets » · gênant · lu · **corrigé le 18/11/2026**
- **Où** : `creer-monde/assets/GUIDE-ZONE.modele.md:31` : « au moins 3 sujets par PNJ important (5 à 7 pour les clés) ». `outils/monde/nouveau.ts:56` le recopie dans chaque nouveau monde ; l'importateur de la Forge aussi, puisqu'il passe par `creerSquelette`.
- **Contre** : la règle du 16/11 (`CLAUDE.md:58`, `creer-personnages`), au moins 4 sujets pour **tout** PNJ qui parle.
- **Correction** : « au moins 4 sujets par PNJ qui parle, dont 2 sur la quête principale pour le lieu de départ ».

### C5. Longueur des réponses de PNJ : quatre cibles · gênant · lu · **corrigé le 18/11/2026** (75 à 115 partout ; la parole libre du conteur garde sa cible propre)
- `creer-personnages/SKILL.md:25` : 75 à 115 mots (cible validée le 10/11). Mais le même skill dit, l. 52 : « **Réponses de 40 à 80 mots** ».
- `creer-personnages/references/brief-compagnon.md:47` : 60 à 120 mots. `creer-monde/references/brief-antagoniste.md:21` : 60 à 110.
- **Correction** : 75 à 115 partout ; la l. 52 est à supprimer ou à corriger.

### C6. Les agents de zone écrivent en Sonnet, alors que les textes doivent être écrits par Haiku · gênant · lu · **corrigé le 18/11/2026** (textes par Haiku dans les deux chemins ; Sonnet reste possible pour les données d'une grande histoire)
- **Où** : `creer-monde/SKILL.md:115` et `references/prompts-zones.md:3` : « modèle **Sonnet 5.5** » pour les agents de zone, qui écrivent aussi les arrivées, les sujets et les intros. Or `references/textes-en-serie.md:3` dit « toujours des agents Haiku », comme la règle de l'utilisateur (mémoire du projet).
- Les deux se défendent : Sonnet pour les données liées entre fichiers, Haiku pour le texte. Mais le skill ne dit pas qui écrit quoi.
- **Correction** : dans le chemin « épisode », Sonnet ne monte que le squelette (ou la Forge le fait), et les textes passent par des lots Haiku.

### C7. Champs utiles au cap que les skills n'enseignent pas · gênant · lu · **corrigé en partie le 18/11/2026** (`format`, `signesDeQuete`, `orMax`, `niveaux`, `groupe.conseille`, `tirageArrivee`, `vivres` et `teasing` enseignés dans `creer-monde` ; `Lien.absent` et le sens de `Quete.lieu`, rang 8, restent à faire)
- `depart.signesDeQuete` (coupe les « ! » et « ? » au-dessus des PNJ) et `depart.orMax` : grep vide dans `.claude/skills`. Ils sont documentés dans `docs/MONDES.md:18` et posés à la main pour le Médaillon et la Tombe. `signesDeQuete: false` fait partie de la règle « le joueur cherche », mais `creer-intrigue:28` présente les signes comme « calculés, rien à écrire ».
- `Lien.absent` (`schemas.ts:489`, un passage grisé vers une suite « bientôt ») sert directement une saga, et n'est cité par aucun skill.
- `Quete.lieu` : `creer-contrats/SKILL.md:39` le demande pour chaque contrat, sans dire ce qu'il veut dire (voir G7).
- **Correction** : une section « réglages d'un épisode » dans `creer-monde`, et le sens de `Quete.lieu` dans `creer-intrigue` et `creer-contrats`.

### C8. Petites contradictions de détail · cosmétique · lu
| Où | Ce qui est écrit | Ce qui fait foi |
|---|---|---|
| `creer-monde/references/lecons.md:49` | influence au DD « 15 − attitude/10 » | `CLAUDE.md:62` : DD 15, Avantage ou Désavantage selon l'attitude |
| `creer-monde/references/lecons.md:51` | d'un lieu, le joueur ne lit que `nom`, `resume` et `ambiance` | depuis le 10/11, il lit surtout `arrivee` (`schemas.ts:499-504`) |
| `decrire-lieux/SKILL.md:71`, `assets/ATLAS.modele.md:92`, `references/brief-agent-lieu.md:28` | `description` de 100 à 250 mots | `references/textes-en-serie.md:13` : 100 à 150 |
| `decrire-lieux/SKILL.md` et les « champs dérivés » de l'atlas (`ATLAS.modele.md:87-92`) | ne citent jamais `arrivee` | seul `brief-agent-lieu.md:29` le demande |
| `creer-pieges-tresors/SKILL.md:30` | contenants « étagère », « établi » (avec accents) | `schemas.ts:253` : `etagere`, `etabli` (le validateur refuse la forme accentuée : défaut rattrapé) |
| `creer-monde/assets/GUIDE-ZONE.modele.md:33` | `decouverte` : « auto, jet, condition » | `schemas.ts:519` : `auto`, `dd`, `competence`, `condition` |
| `creer-intrigue/SKILL.md:63` · `creer-monde/SKILL.md:82` | 3 à 5 factions · 4 à 6 factions | (pour un épisode : le PRD n'en prévoit pas d'autonome) |
| `creer-personnages/SKILL.md:21` · `references/brief-compagnon.md:21` | 40 à 45 interjections · 16 interjections | la leçon du skill (10 à 16 « presque muets ») |
| `auditer-coherence-monde/SKILL.md:14` | sous-agent `auditeur-coherence-monde` via `invoke_subagent` | le seul agent existant est `auditeur-coherence-histoire` |

Un constat de la relecture déléguée a été écarté après vérification : « les mondes publiés sont absents de `packages/mondes/` ». C'est faux : les quatre mondes y sont.

---

## 4. Fiabilité des outils

*O1 à O9 : corrigés le 18/11/2026 (lot 1, groupe 2). O10 à O12 restent à faire.*

| # | Constat | Où | Reproduire | Gravité | Correction |
|---|---|---|---|---|---|
| O1 | **Une commande inconnue lance la validation**, code 0 : `pnpm monde verifie <monde>` ou `manquee` font croire qu'on a vérifié | `outils/monde/cli.ts:216-231` | `pnpm monde frobnicate tombe-des-rois-serpents` affiche le bilan de `valider`, code 0 | gênant | refuser une commande inconnue (liste des commandes, code 1) |
| O2 | **`verifier` plante** sur un `estimation.json`, `manifeste.json` ou `revue.json` mal formé, sans bilan (seul `canon.json` est protégé) | `verifier.ts:19`, `:100`, `:117` | monde d'essai, `estimation.json` = `{ "tours": 3, }` → exception `Expected double-quoted property name…` | gênant | lire ces fichiers dans un `try`, et rendre une rubrique en `echec` qui nomme le fichier |
| O3 | **`--sans-parcours` finit sur « ✅ Rien ne bloque »**, alors qu'aucune fin n'a été jouée | `verifier.ts:141`, `:171-172` | `pnpm monde verifier <monde> --sans-parcours` | cosmétique | « Rien ne bloque (parcours non joué) » |
| O4 | **Revue de secrets en ✅ avec un canon vide** (0 secret : rien n'est surveillé) ; seule l'absence du fichier donne un avis | `verifier.ts:126-133` | monde d'essai (canon vide de `nouveau`) : « secrets du canon : 0 » | gênant | un avis quand `canon.secrets` est vide |
| O5 | **Le squelette de `nouveau` ne valide pas**, et `pnpm monde valider` (tous les mondes) sort en code 1 tant qu'il existe | `outils/monde/nouveau.ts:48`, `:50` | `creerSquelette` dans un dossier temporaire : `lieu inconnu « squelette-hub »`, `Chapitre « ch1 » : lieu inconnu « squelette »` | cosmétique | créer un lieu racine et un hub minimaux, ou ne pas renseigner `depart.lieu` |
| O6 | **`doc` sort en code 0** même si le monde a des erreurs | `cli.ts:218-224` (`continue` avant le calcul d'`echec`) | lu (non lancé : écrit dans `docs/mondes/`) | cosmétique | compter les erreurs avant d'écrire |
| O7 | **`parcours` conseille « --etats plus grand » quand il s'arrête faute de temps** | `cli.ts:186` | `pnpm monde parcours le-medaillon-de-la-soeur-endormie --ms 8000` : `arrêt : temps`, puis « relancer avec --etats plus grand » | cosmétique | conseiller `--ms` quand `arret === 'temps'` |
| O8 | **Options numériques mal formées acceptées** sans message : `--etats abc` donne `NaN` (le budget d'états est alors ignoré), `--niveaux 3` est ignoré en silence par `importer-forge` | `cli.ts:43-54`, `:76` | `pnpm monde parcours <monde> --etats abc` : se joue sans limite d'états | cosmétique | refuser une valeur non numérique |
| O9 | **`parcours` sans aucune fin : « ✅ 0/0 fins atteintes »**, code 0 (`verifier`, lui, donne un avis) | `cli.ts:179-181` | lu | cosmétique | un avis comme dans `verifier` |
| O10 | **L'exportateur de la Forge** (« voir un monde existant ») abandonne en silence les liens que la Forge n'autorise pas : ils ne figurent pas dans les notes de perte | `outils/monde/exporter-forge.ts:80-84` (`lier`) | lu | cosmétique | compter les liens écartés dans `notes` |
| O11 | **Les contrôles de l'atelier** (`controles.ts` : fin inatteignable, dilemme impossible, lien non réciproque) ne passent que dans `diagnostics`, que le CLI n'imprime pas. Latent : sur les quatre mondes, aucun diagnostic n'est caché aujourd'hui | `diagnostiquer.ts:51`, `cli.ts:225-227` | script `essai2.mts` : `diagnostics absents du CLI = {}` partout | cosmétique | imprimer aussi ces diagnostics |
| O12 | **L'installateur** affiche du texte illisible dans la console Windows (`install�es`) ; son aide dit `python3`, alors que la machine demande `py` ou `uv run` | `installer.py:5`, `:120` | sortie de l'essai G4 | cosmétique | `sys.stdout.reconfigure(encoding="utf-8")`, aide alignée sur le skill |

Hors de ce tableau, déjà dans `AUDIT-MOTEUR.md` §5 : la mémoire du parcours quand une fin est inaccessible. Cette fois, les trois `verifier` ont tenu en 7 à 19 s.

**Non vérifié** : la Forge dans le navigateur (`/forge/`, bouton « Créer le monde ») n'a pas été rejouée. L'importateur qu'elle appelle a été essayé directement (§ annexe).

---

## 5. Les dix corrections les plus utiles, dans l'ordre

| Rang | Correction | Constats | Effort | Touche le moteur de jeu ? |
|---|---|---|---|---|
| 1 | ✅ 18/11 · **Profil « épisode » du validateur**, en opt-in : il remplace les minima « Richesse » par les règles du cap. Lieu de départ de 10 à 13 pièces sans pièce vide, 3 à 8 quêtes dont exactement une principale, au moins 4 sujets par PNJ qui parle (2 sur la quête principale pour le lieu de départ), aucun `lieu` d'étape, arrivées de 130 à 170 mots, pas de quête personnelle ni de faction | S1, S2, G1 | moyen | non (validation seulement) |
| 2 | ✅ 18/11 · **Installateur d'images qui fusionne** au lieu de reconstruire : il garde ce qui existe sur le disque, affiche ce qui change et n'enlève qu'avec `--purger` | G4, C2 | petit | non |
| 3 | ✅ 18/11 · **`manque` complet** : présence des fichiers `.webp`, `verifierImages`, et les champs « À écrire » / « à définir » comptés comme manques | G5, G6 | petit | non |
| 4 | ✅ 18/11 (réplique : en partie) · **Contrôles de lieu et de PNJ** : plus de 6 PNJ dans un lieu, titre ou nom qui trahit (parenthèses, « compagnon »), réplique qui cite un lieu où le PNJ n'est jamais | G1, G2, G3 | moyen | non |
| 5 | ✅ 18/11 · **`creer-monde` réécrit** autour du chemin « épisode » (Forge, V1 à V8 adaptés, règles du 16/11, réglages `signesDeQuete` et `orMax`, longueurs, bibliothèque commune, Haiku pour les textes) ; Ombresang retiré ; « par chapitre » → « par épisode » dans les skills d'appui ; `GUIDE-ZONE.modele.md` à 4 sujets ; une seule longueur de réponse (75-115) | S3, S4, C4 à C7 | moyen (texte) | non |
| 6 | ✅ 18/11 (sauf `CLAUDE.md:71`) · **Auditeur de cohérence d'épisode** à la place de l'auditeur d'Ombresang, avec G1 à G3 et le chemin le plus court comme contrôles ; `CLAUDE.md:71` aligné | S5 | petit (texte) | non |
| 7 | ✅ 18/11 · **Avis classés** : les défauts de jeu (objet exigé introuvable, drapeau jamais posé, quête sautable, sans retour) passent en échec de `verifier` pour un monde publié | G9 | petit | non |
| 8 | ✅ 18/11 · **`Quete.lieu` documenté** (« où la quête est confiée ») avec un avis quand il diffère du lieu du donneur ; puis correction des données de la Marche (4 quêtes) et de la Tombe (10) | G7 | petit | non (données à part) |
| 9 | ✅ 18/11 · **CLI fiable** : commande inconnue refusée, fichiers JSON mal formés rapportés au lieu de planter, `--sans-parcours` et canon vide dits comme tels, squelette de `nouveau` valide | O1 à O5 | petit | non |
| 10 | ✅ 18/11 · **Importateur de la Forge et estimation à l'échelle d'un épisode** : textes d'étape en « À écrire » sans nom de lieu ; total arrondi à la demi-heure ; savoirs comptés dans le coût ; PRD F3 amendé ; commentaires de longueur alignés | G8, S8, S6, C1 | petit | non |

Aucune de ces corrections ne touche `packages/regles/src/combat/` ni l'état d'une partie (P3, P4). Elles sont toutes additives au sens de P1 : un monde sans le profil « épisode » garde ses avis actuels.

---

## Annexe : scripts de reproduction

Ils sont hors du dépôt, dans le dossier temporaire de la session : `C:\Users\sebas\AppData\Local\Temp\claude\584d935d5a46fbdf\a796640b-bf42-429e-80df-479324676ec4\scratchpad\audit\`. On les lance depuis la racine du dépôt.
- `stats.ts` : les mesures du §0 (sujets par PNJ, longueurs, `lieu` des étapes et des quêtes, PNJ par lieu, titres suspects).
- `qlieu.ts` : le `lieu` des quêtes comparé au lieu du donneur (G7).
- `essai.mts <dossier>` : importe l'exemple de la Forge dans `<dossier>/essai`, puis injecte les défauts A à N et le manifeste de G5 ; il imprime ce que le diagnostic gagne. On le lance par `node_modules/.bin/tsx <chemin>/essai.mts <chemin>/mondes-essai`.
- `essai2.mts <dossier>` : les contrôles de l'atelier cachés au CLI (O11), `verifierImages` sur les vrais mondes, le squelette de `nouveau` (O5), `verifier` sur le monde d'essai (G6, O4) et le plantage sur un `estimation.json` mal formé (O2).
- `inst/` : la copie de `installer.py` et l'arborescence de l'essai G4 (`uv run -q --with pillow python outils/images/installer.py monde x`, lancé depuis `inst/`).
- Sorties brutes des commandes du §0 : `test.txt`, `valider-*.txt`, `manque-*.txt`, `verifier-*.txt`.

Ce dossier peut être vidé au redémarrage : copier ce qui servira de base aux tests avant de corriger.
