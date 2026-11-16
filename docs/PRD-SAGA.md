# PRD — La Saga : épisodes denses, quêtes en grammaire, butin par difficulté

**Version :** 0.1 — 15/11/2026 **Statut :** brouillon issu du brainstorming du 15/11/2026, à valider par l'utilisateur. Aucun code écrit. Copié dans `docs/PRD-SAGA.md` le 15/11/2026 à la demande de l'utilisateur (pas commité).
**Complète** `docs/PRD.md` (vision), `docs/COMBAT.md`, `docs/MONDES.md` ; **remplace** les plans Ombresang à 64 sous-régions (`PARTIE-UNIQUE.md`, `PROGRESSION-XP.md`, `CHARGEUR-DE-PACKS.md`), dont les idées de persistance et de progression sont reprises ici.

## 1. Pourquoi

Constat de l'utilisateur : les textes sont bons mais ne suffisent pas à donner envie de jouer. Dans un jeu de rôle, ce qui donne envie, ce sont les **actions** (fouiller, chercher un piège, désamorcer, crocheter, parler, se battre, se reposer, se soigner, acheter et vendre), les **quêtes**, les **combats** et le **butin**. On capitalise là-dessus, avec le moteur de combat comme point fort.

L'audit des données (Dîme des Roseaux, 15/11) le confirme : un village de 5 bâtiments dont la Halle du conseil est vide (0 PNJ, 0 trésor, 0 service), 25 trésors pour 30 lieux, surtout dans les donjons. Le moteur sait déjà tout exprimer (contenants, verrous, pièges, gardiens, services, alternatives) ; ce qui manque est de la **densité**, de la **lisibilité** et quelques **garde-fous**.

## 2. Décisions prises dans le brainstorming (à ne pas rouvrir sans raison)

1. **Produit = une saga d'épisodes indépendants**, mêmes héros, un niveau par épisode (deux par niveau vers le 15), jusqu'au niveau 20 à terme. Annonce commerciale : **« saison 1 » = épisodes de niveau 1 à 5**.
2. **Chaque épisode** : un lieu de départ dense (village, quartier ou château, environ 10 à 13 pièces visitables, image par lieu, écrit à la main), 2 à 4 sites de quête, **3 à 8 quêtes** dont une principale (fil rouge). Épisode 1 plus court (2 ou 3 quêtes, 2 ou 3 combats). Pas de quêtes personnelles ni de faction à part.
3. **Verbes** : fouiller (la pièce, puis le contenant), **chercher un piège** (jet de dés, DD secret), désamorcer, crocheter, ouvrir, prendre, combattre, parler, se reposer, se soigner, acheter et vendre.
4. **Quêtes** : quatre buts (tuer, trouver, apporter, libérer), résolus par un ou deux verbes (combat, fouille, énigme, discussion, désamorçage, crochetage). **Une porte de sortie (négocier, payer) seulement si l'adversaire parle**, sinon choix par défaut.
5. **Butin proportionnel à la difficulté**, plafonné au niveau du groupe. Trois degrés : *tiré* (tables), *nommé* (écrit, ordinaire, avec lore, récompense de quête secondaire), *unique* (objet de la quête principale ou du boss ; 1 à 3 par épisode, fixes et écrits).
6. **Continuité légère** : le monde est en arrière-plan commun (courte bible commune) ; chaque épisode a un PNJ qui connaît ce que le groupe a fait dans les quêtes principales passées ; des **retours surprises** (ennemi vengeur, allié reconnaissant, accès, réputation), toujours en bonus, jamais obligatoires.
7. **Hors périmètre, décidé** : intérieurs tirés au hasard (générateur), centaines de lieux ou monde ouvert à 64 sous-régions, quêtes personnelles et de faction autonomes, changement de la voix officielle, changement de règles du SRD, mort définitive.
8. Les trois histoires actuelles ne sont plus proposées au joueur ; leurs données restent comme **jeux d'essai** (et référence) tant que les tests en ont besoin.
9. **Signature audiovisuelle conservée dans chaque épisode** (décision du 15/11/2026) : la **vidéo de présentation** de l'épisode (scène narrée d'ouverture), les **phrases des PNJ** (salutations et ouvertures de conversation voisées) et la **scène narrée à l'arrivée au lieu de la quête principale**. Mécanismes déjà en place : scènes de `scenes/scenes.json` avec `declencheur` (début, fin, lieu, quête), voix officielle du Maître de jeu inchangée (Gemini Flash TTS, Algieba, ×1,15), bibliothèque de salutations communes (6 registres × 12 voix) pour ne voiser que les lignes propres à un PNJ. Les **scènes de fin sont conservées aussi** (confirmé par l'utilisateur le 15/11/2026 ; le carnet de campagne en dépend).

## 3. Principes de non-régression (« ne pas casser le moteur »)

Ces règles s'appliquent à **toutes** les fiches ; une fiche qui ne les tient pas n'est pas livrée.

- **P1 — Tout est additif.** Un champ de schéma nouveau est facultatif avec une valeur par défaut qui reproduit l'ancien comportement. Les mondes existants et les jeux d'essai (`packages/regles/tests/fixtures/mondes/`) passent `pnpm monde valider` **sans modification**, avant et après.
- **P2 — Comportement nouveau = opt-in par les données.** Un monde qui n'utilise pas le nouveau champ ou le nouveau drapeau se joue exactement comme avant (exemples : « chercher un piège » séparé de la fouille, plafond de butin à l'exécution). Les drapeaux de monde sont documentés dans `docs/MONDES.md`.
- **P3 — Le combat est gelé pour les fiches 1 à 5** : aucun fichier de `packages/regles/src/combat/` n'est modifié. Mesure de garde : on enregistre **avant** de commencer `pnpm simuler 10 rapide` (graines fixes 1000 à 1009, générateur déterministe) et on exige une sortie **identique** après chaque fiche.
- **P4 — Sauvegardes.** `VERSION_PARTIE` vaut 4 aujourd'hui (`noyau/types.ts`). Tout champ d'état nouveau est facultatif ; si la forme change, on passe à la version 5 avec une migration dans `noyau/migrations.ts` et un test qui charge des sauvegardes des versions 1 à 4. Une partie en cours (y compris un combat en cours) doit se recharger.
- **P5 — Barrières de livraison** (par fiche, avant toute demande de commit) : `pnpm typecheck`, `pnpm test` (plus de 2 500 tests verts), `pnpm monde verifier` sur les mondes de référence et les jeux d'essai, simulation de référence inchangée (P3), journal mis à jour (`docs/JOURNAL.md`).
- **P6 — Architecture.** Toute nouvelle fonctionnalité du moteur est un module (skill `ajouter-module`), sans dépendance de `packages/regles` vers `apps/`. Le moteur décide, le LLM ne fait que raconter ; **aucun LLM ne crée ni ne clôt une quête** et ne tire un butin.
- **P7 — Petits pas.** Un chantier = une branche courte, des tests écrits avec le code, l'accord de l'utilisateur avant chaque commit, jamais de push sans accord, aucune dépense (images, voix, API) sans annonce du coût d'abord.

## 4. Exigences par fiche

Ordre de réalisation : **F1 → F2 → F3 → F4 → F8 → F7 (pilote) → F5 → F6**. F1 à F4 sont indépendantes les unes des autres sauf F4 qui lit les difficultés de F1 ; F8 (réserve de décors) fournit les images du lieu de départ ; F7 s'appuie sur les cinq.

### F1 — Verbes en deux étages (exploration d'une pièce)
- **Objectif :** que le joueur vive : fouiller la pièce, repérer un contenant, **chercher un piège (jet)**, désamorcer, crocheter, ouvrir, prendre.
- **Aujourd'hui :** `fouiller` (`modules/exploration.ts`) cherche d'un coup passages secrets, trésors cachés, pièges et indices, une fois par lieu et par jour ; la perception passive repère les trésors cachés sans jet mais jamais les pièges. Le schéma `Tresor` porte déjà `contenant`, `acces {cache, verrou, piege}`, `gardien`, `indice` ; `Piege` porte `detection` et `desarmement`.
- **Changements :** (a) **audit préalable** de l'écran d'aventure pour savoir comment les contenants visibles sont présentés (non vérifié à ce jour) ; (b) une commande **`chercherPiege`** sur un contenant ou une porte : jet de Perception ou d'Investigation contre le DD secret, par le héros choisi ou le meilleur du groupe, **une tentative par héros et par cible** ; résultat « piège trouvé » (rend `désamorcer` disponible) ou « rien de suspect » (ambigu volontairement) ; (c) la fouille de la pièce ne révèle plus les pièges quand le monde est opt-in (P2, drapeau de monde à nommer à la conception) ; (d) l'écran liste les contenants d'une pièce avec leurs actions ; le DD reste caché, le bonus du héros est annoncé avant le clic (déjà fait pour crocheter).
- **Critères d'acceptation :** un monde sans le drapeau se joue à l'identique (tests existants) ; un monde avec le drapeau : fouiller ne révèle pas de piège, `chercherPiege` le révèle sur réussite, une tentative par héros et par cible, un piège non cherché se déclenche à l'ouverture ; test de bout en bout pièce → contenant → piège → désarmement → crochetage → butin.
- **Effort :** moyen. **Risque :** l'écran (jamais vu en jeu) ; les spams de jets (limite par héros et par cible).

### F2 — Gabarit de lieu de départ et contrôle de densité
- **Objectif :** un lieu de départ qui offre quelque chose à faire dans chaque pièce.
- **Changements :** un gabarit décrit comme liste d'emplacements (4 bâtiments d'une pièce, taverne avec 2 ou 3 pièces visitables + chambre qui est un service de repos, sanctuaire 1 pièce avec soigneur, maison du chef 2 ou 3 pièces, marchand) ; **avis** dans `pnpm monde manque` quand une pièce est vide ou qu'un emplacement manque ; barème indicatif : 2 à 4 couches parmi PNJ, contenant, verrou ou piège, adversaire avec butin, service, objet ; pas toutes les couches partout. Fichier de référence pour les auteurs (skill `creer-monde`, `verifier-completude-histoire`).
- **Critères :** les mondes existants ne produisent que des avis (jamais d'erreur bloquante, P1) ; le village pilote (F7) ne produit aucun avis de densité.
- **Effort :** faible à moyen. **Risque :** remplir mécaniquement ; garder le barème indicatif.

### F3 — Gabarit de quête (grammaire) et validation
- **Objectif :** quêtes lisibles, variées, jouables de bout en bout.
- **Changements :** fiche courte (type : tuer, trouver, apporter, libérer ; donneur ; lieu ; cible ; verbe(s) de résolution ; butin annoncé) qui **produit le JSON des étapes**, ensuite retouchable à la main (générateur de données, pas un type vérifié à l'exécution) ; chaque quête a un `lieu` d'étape, un retour au donneur, une `annonce` de récompense ; **validateur** : une quête « tuer » contre un adversaire qui parle sans alternative → avis ; une alternative de négociation contre un adversaire qui ne parle pas → avis. Critère « sait parler » : dérivé du champ `langues` des profils (130 des 329 monstres ont « aucune » ; les formes « comprend… » sont à traiter à part) — **pas** du type de créature (les gobelins sont de type « Fée (Gobelinoïde) », les dragons parlent).
- **Dépendances connues** (état des lieux du 13/11) : l'effet direct `quete: active` ignore `prerequis` ; une étape supprimée d'un monde bloque une quête en cours ; `recompensesDeQuete` additionne des branches exclusives ; `completion` insatisfiable non détectée. À durcir **avant ou avec** F3, en additif (P1).
- **Critères :** 3 à 8 quêtes par monde (avis hors de la fourchette) ; toute quête a un chemin jouable testé par le parcours automatique ; aucune régression sur les tests de quêtes (`quetes-moteur`, `quete-*`, `contrats*`).
- **Effort :** moyen. **Risque :** la rigidité si le gabarit devient un carcan ; l'écriture sans interrompre la création libre.

### F4 — Butin par difficulté et niveau
- **Objectif :** « plus c'est difficile, plus le butin est gros, toujours en rapport avec le niveau du groupe ».
- **Aujourd'hui :** règles de rareté par niveau écrites dans le skill `creer-pieges-tresors` (consigne d'auteur) ; `TableButin.palier` **n'est pas lu au tirage** ; pas de lien entre la difficulté d'un obstacle et la valeur du contenu.
- **Changements :** (a) **difficulté d'un contenant** = max(DD du verrou, DD du piège, FP du gardien) ; avis du validateur sur les écarts (trésor riche sans obstacle ; obstacle sérieux sans rien) ; (b) **plafond lu au tirage** : le moteur ne retient que les entrées de palier compatible avec le niveau réel du groupe, la difficulté poussant vers le haut du palier ; **opt-in par monde** (P2) ; (c) trois degrés de butin (tiré, nommé, unique) avec règle : **uniques fixes, 1 à 3 par épisode, rattachés à la quête principale ou au boss** ; (d) indices visibles de richesse (« une serrure d'une finesse inhabituelle »).
- **Critères :** sans le drapeau, tirages identiques à l'ancien comportement à graine égale ; avec le drapeau, aucune entrée de palier supérieur ne sort (test sur 1 000 tirages) ; aucun objet de quête n'est jamais généré ; aucun objet `rare` avant le niveau 3 à 4 ni `legendaire` avant le niveau 5 hors unique déclaré.
- **Effort :** moyen. **Risque :** un butin plafonné frustre qui force un site trop dur → les uniques restent fixes pour cette raison.

### F7 — Épisode pilote (banc d'essai de F1 à F4 et F8)
- **Objectif :** vérifier que la boucle fouille, piège, crochet, butin, combat est amusante, avant de généraliser.
- **Contenu :** niveau de départ 1, fin au niveau 2 (300 PX) ; lieu de départ du gabarit F2 (10 à 13 pièces, images) ; 2 ou 3 quêtes (F3), 2 ou 3 combats, butin F4 ; durée visée courte (de l'ordre de 1 à 2 h, **non mesurée** : utiliser l'outil de mesure `pnpm monde calibrer`). Thème : **à décider**.
- **Signature audiovisuelle (décision 9) :** une scène d'ouverture (vidéo de présentation), une scène narrée à l'arrivée au premier lieu de la quête principale, les salutations voisées des PNJ du lieu de départ (communes d'abord), et les scènes de fin (2 ou 3). Voix et coûts à annoncer avant génération.
- **Décors :** les pièces génériques du lieu de départ viennent de la réserve de décors (F8) ; l'image du hub et celle des lieux de quête sont propres à l'épisode ; le registre des décors (F8) est lu avant d'écrire les lieux et complété à la fin.
- **Coûts à annoncer avant dépense :** images d'intérieur et de hub (FLUX Klein ≈ 0,009 $ l'image selon les assets copiés de RPGSEB ; ordre de grandeur de 0,2 $ pour un village), textes par agents Haiku relus par l'auteur.
- **Critères :** `pnpm monde verifier` sans blocage ; parcours automatique jusqu'à la fin ; au moins une partie complète jouée à la main par l'utilisateur avant d'écrire d'autres épisodes.

### F8 — Réserve de décors (images de lieux génériques réutilisables)
- **Objectif :** avoir sous la main des décors génériques pour les pièces courantes d'un lieu de départ (taverne, chambre, sanctuaire, maison du chef, forge, marché, boutique, intérieur modeste, cave ou grenier, place du village), réutilisables d'un épisode à l'autre, sans perdre les images déjà faites. Les lieux de quête, les sites de boss et tout lieu mémorable restent **générés et propres à leur épisode**.
- **Aujourd'hui :** la bibliothèque commune (`docs/BIBLIOTHEQUE-COMMUNE.md`) reprend les portraits de PNJ, les objets et les salutations, par référence `commun:pnj/<id>` et `commun:objets/<id>` (schéma des images : `packages/regles/src/monde/images.ts`, expression régulière des références ; résolution côté client `apps/jeu/src/mondes.ts`). Les images de **lieux** (99 dans les trois histoires actuelles, plus 14 cartes) n'y sont pas, par décision du 11/11/2026 ; il n'y a pas de forge, de sanctuaire ni de maison du chef évidents d'après les noms de fichiers (à confirmer en regardant les images).
- **Changements :** (a) dossier `apps/jeu/src/communs/lieux/` et petit `catalogue.json` (id, type, ambiance, intérieur ou extérieur, origine) ; (b) **sélection manuelle** parmi les images existantes réellement génériques (rien de nommé, aucun personnage, aucun emblème) ; (c) **lot de génération conçu générique** pour combler les types manquants : environ 10 types × 3 variantes, style imposé par la charte visuelle (`packages/donnees/visuel/charte.json`) ; coût estimé de l'ordre de 0,27 $ (≈ 0,009 $ l'image), **à annoncer et à faire valider avant toute dépense** ; (d) référence **`commun:lieux/<id>`** acceptée dans le manifeste d'images (une alternative de plus dans l'expression régulière, résolution client, signalement d'une référence inconnue, comptée comme image par `pnpm monde manque`) ; (e) **registre des décors** en Markdown, qui se complète à chaque épisode et que le créateur d'histoires **lit au début** : une partie générée (quels décors servent dans quel épisode, d'après les manifestes) et une partie écrite (lieux déjà vus, ambiances, à ne pas refaire) ; le skill `creer-monde` impose cette lecture avant d'écrire les lieux.
- **Hors périmètre :** table complète classant les 99 images, extension de `pnpm images communs proposer` aux lieux (à reprendre seulement si, après l'épisode pilote, générer des décors devient un vrai frein), cartes tactiques et voix de scènes (restent propres à leur histoire).
- **Non-régression :** additif (P1, P2) ; un monde qui n'emploie pas `commun:lieux/…` est inchangé ; le combat et les sauvegardes ne sont pas concernés ; les tests des communs existants (`communs.test.ts`) restent verts.
- **Critères d'acceptation :** au moins 3 variantes pour chacun des 10 types de pièces ; un monde d'essai cite `commun:lieux/…` et l'image s'affiche ; une référence inconnue est signalée ; le registre se régénère à l'identique.
- **Effort :** faible à moyen. **Risques :** répétition visible d'un même décor (atténuée par les variantes et le registre) ; tri manuel des images existantes (quelques heures, peut attendre) ; lot généré qui ne plaît pas (relançable pour quelques centimes).
- **Quand :** avant l'épisode pilote (seuls le lot de génération et la référence `commun:lieux` y sont indispensables).

### F5 — Campagne : persistance entre épisodes, carnet et échos
- **Objectif :** que le groupe continue d'un épisode à l'autre et que ses actes reviennent.
- **Aujourd'hui :** une partie ne référence qu'**un** monde (`Partie.monde`) ; XP, niveau, or, inventaire sont dans l'état de la partie ; `plafondDeNiveau` limite le niveau par chapitre.
- **Changements :** (a) **audit court** d'abord (où chaque donnée vit, comment une partie change de monde) ; (b) **bilan de fin d'épisode** (héros, niveau, PX, or, inventaire) repris à l'entrée de l'épisode suivant ; (c) **carnet de campagne** facultatif dans la partie (identifiant d'épisode, fin obtenue, 2 à 3 drapeaux marquants ; version de sauvegarde 5 + migration, P4) ; (d) condition `campagne` dans le langage de conditions des PNJ, rencontres, lieux ; (e) **registre des drapeaux de campagne** émis par chaque épisode, et **validation entre épisodes** (une référence à un drapeau inconnu est une erreur) ; (f) **injection d'un carnet** dans le parcours automatique pour tester chaque écho ; (g) entrée à l'épisode N avec un **groupe prêt** du bon niveau (le créateur sait déjà choisir un niveau de départ) ; (h) bible commune du monde (quelques pages) ; (i) option : phrases du carnet dans la fiche du conteur.
- **Règles :** un écho est toujours un **bonus** (la quête principale se joue sans carnet) ; 1 à 2 échos par épisode ; l'adversaire vengeur parle (porte de sortie) ; combat de retour calibré comme toute rencontre du niveau ; **surprise** (pas d'annonce au choix) mais **indice discret à l'époque**, scène qui nomme la cause, et des surprises positives autant que négatives.
- **Critères :** ancienne sauvegarde chargée sans perte ; un groupe neuf entrant à l'épisode N joue normalement ; un carnet injecté déclenche l'écho attendu et lui seul.
- **Effort :** grand. **Risque :** le plus élevé (sauvegarde, validation entre mondes) ; ne pas commencer avant que F7 ait prouvé le plaisir de jeu.

### F6 — Combat de haut niveau (plus tard)
- **Objectif :** que les boss des niveaux élevés tiennent leur rôle.
- **Aujourd'hui (état des lieux du 14/11) :** actions légendaires (30 monstres sur 329), résistance légendaire (32), actions de repaire (34), régénération (3) absentes ; grandes créatures sur 1 case ; sorts de monstres faits le 15/11 sauf réactions et recharges. Moteur de combat solide jusqu'au niveau 8 environ.
- **Changements possibles :** actions légendaires, résistance légendaire, grandes créatures multi-cases, réactions de monstres ; **IA** : valoriser les affaiblissements (point faible n° 1), multiattaque redirigée.
- **Non-régression (P3 levé pour cette fiche seulement) :** nouvelles branches de code exécutées **uniquement** pour les monstres porteurs des nouvelles données ; simulation de référence inchangée sur tous les profils existants ; test de propriété sur les invariants (PV ≥ 0, ordre, état valide).
- **Effort :** grand, par petits lots. **Déclencheur :** avant le premier épisode de niveau 8 ou plus.

## 5. Mesures de réussite
- Chaque pièce du lieu pilote a au moins 2 couches ; aucune pièce vide.
- Un joueur qui n'a pas lu les règles trouve, ouvre et pille un coffre piégé et verrouillé en moins de 5 minutes.
- Les 3 à 8 quêtes de l'épisode pilote sont terminables, sans quête bloquée (parcours automatique).
- Simulations de combat de référence strictement identiques avant et après F1 à F5.
- Durée de l'épisode pilote **mesurée** sur une vraie partie.

## 6. Questions ouvertes
1. Thème et durée de l'épisode 1 ; nom de la saga et de la première région.
2. Image du hub : illustration avec zones cliquables (recommandé) ou carte de décors composée (assets RPGSEB, étude de déplacement en cours).
3. PNJ récurrent (chroniqueur ou barde itinérant) ou un PNJ différent par épisode ; carte de la saga (une épingle par épisode terminé).
4. Combat de boss : phases, terrain, pression sur le groupe ; le moteur de combat comme argument de vente (démo, bande-annonce, mode arène).
5. Modèle commercial : épisode 1 gratuit ou à petit prix, prix des suivants.
6. Critère « sait parler » : autorisation de lire `langues`, traitement de « comprend… mais ne parle pas ».
7. Où s'applique le drapeau d'opt-in de F1 et de F4 (monde ou chapitre).

## 7. Documents à mettre à jour au moment de la mise en œuvre
`CLAUDE.md` (« trois histoires publiées », saga, quêtes 3 à 8), mémoire du projet (décision du 08/11 sur Ombresang remplacée), `docs/PRD.md` (renvoi), `docs/MONDES.md` (nouveaux champs et drapeaux), `docs/BIBLIOTHEQUE-COMMUNE.md` (F8 : `commun:lieux`, registre des décors), `docs/COMBAT.md` (F6), skills `creer-monde`, `creer-intrigue`, `creer-pieges-tresors`, `verifier-completude-histoire`, `docs/JOURNAL.md`.
