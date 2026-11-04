# Journal de développement

## 02/11/2026 — M0 : fondations

- Dépôt créé : workspace pnpm, TypeScript strict, Vitest. Paquets `packages/regles` (moteur pur) et `packages/donnees` (JSON).
- SRD 5.2.1 **français officiel** téléchargé dans `sources/` (non versionné), inventaire dans `docs/SRD-INVENTAIRE.md`.
- Schémas Zod des données (`regles/src/schemas.ts`) : classes, espèces, historiques, dons, armures, armes. Les effets mécaniques sont un petit ensemble de types (`ca_sans_armure`, `pv_par_niveau`, `expertise`…) ; tout le reste est un résumé pour le MJ.
- Données extraites du SRD : 12 classes (niveaux 1 à 5, une sous-classe chacune), 9 espèces, 4 historiques, 17 dons, 13 armures, 38 armes. Tables recoupées entre deux extractions du PDF.
- Moteur : dés à graine (rejouables), expressions de dés, tests d20 avec avantage/désavantage et critiques, modificateurs, bonus de maîtrise, PX → niveau, acquisition par points, tirage 4d6.
- `calculerFiche` : valide les choix (méthode de valeurs, bonus d'historique, améliorations, compétences, expertises, taille) et calcule caractéristiques, PV (valeurs fixes), CA (armure, bouclier, Défense sans armure, style Défense), initiative, vitesse, sauvegardes, compétences (demi-maîtrise, expertise), perception passive, vision, résistances, incantation.
- Tests : 104 verts, dont 5 fiches calculées à la main et toutes les classes aux niveaux 1 à 5.

**Limites connues** (voir l'inventaire) : les choix de lignage/ascendance et d'ordre de classe ne produisent pas encore d'effets ; outils et langues en texte ; pas de multiclassage.

**Suite :** M1, le combat de cartes (sorts, monstres, actions) sans LLM.

## 02/11/2026 — M1 : combat de cartes (prototype)

- Spécification : `docs/COMBAT.md` (grille de 1,5 m, actions, cartes permanentes, deck d'élan, IA, contenu du prototype).
- Données SRD ajoutées : 17 monstres (FP 1/8 à 3) et 20 sorts (Grêle d'épines n'est pas dans le SRD). Schémas `Monstre` et `Sort`, avec un champ `special` pour les sorts codés à la main.
- Moteur de combat (`packages/regles/src/combat/`) : état sérialisable et clonable, dés à graine et dés imposés, grille (Dijkstra par paliers, ligne de vue, zones), tours, attaques d'opportunité, attaques et bottes d'arme, critiques, résistances, sauvegardes, états, jets contre la mort, concentration, sorts génériques et spéciaux, aptitudes des 6 classes pré-tirées.
- Cartes : main calculée à chaque instant (jouabilité, raison du refus, cibles valides), exécution de commandes validées ; deck d'élan de 10 cartes (martial ou lanceur), 2 pioches par tour, 1 jouée.
- IA : génération d'étapes (déplacement + carte), tri par effet immédiat, départage des meilleures par simulation du round ; vue sans triche (PV adverses estimés) ; doctrine (agressivité, prudence, focus, seuil de fuite) ; fuite des monstres vivants quand le groupe a trop perdu.
- Contenu : 6 héros pré-tirés de niveau 3 (Bran, Grukk, Pip, Sylvaine, Hilda, Ambrine) et 4 rencontres.
- Outil `pnpm simuler` : l'IA joue les deux camps et mesure l'équilibre.
- Bug trouvé par la simulation : la paralysie de la goule n'avait ni sauvegarde ni durée. Schéma `EtatInflige` complété (sauvegarde, évasion, taille maximale).
- Équilibre (IA normale des deux côtés, 8 parties) : Embuscade gobeline 100 % de victoires, La crypte 88 %, La bande et ses ogres 100 %, Le camp hobgobelin 75 % après allègement (13 % avec 6 hobgobelins, 2 gobelours et un traqueur).
- Client web `apps/jeu` (Vite + React) : accueil, plateau, main de cartes, ciblage et aperçu des zones, tours des monstres joués pas à pas, initiative, journal, fiche, fin de combat ; modes « Tour auto » et « Héros auto ». Vérifié en jouant dans le navigateur.
- Corrections après revue : règle de moral exportée par le moteur (plus de copie côté client), cône calculé en géométrie euclidienne, taille des créatures prise en compte pour les états infligés.

**À valider par toi en jouant** : le critère du PRD §7.3 (durée 10-20 min, choix qui comptent, défaite possible) et l'intérêt du deck d'élan (comparer avec et sans).

**Suite :** retours de jeu sur M1, puis M2 (test des images).

## 02/11/2026 — Retours graphiques du prototype

Retour du joueur : « ça manque de retour graphique, d'images des héros et ennemis ».

- Moteur : les événements du journal portent des `details` structurés (chemin parcouru, résultat et jet d'attaque, CA, projectile, sort, cases d'une zone, sauvegarde, critique). Les déplacements sont découpés autour des attaques d'opportunité ; les poussées sont journalisées.
- Client : file d'animations rejouant le journal (glissements, élans, flèches et traits de sort colorés, flash et secousse, « Raté ! », « Critique ! », bulle de dé, dégâts et soins flottants, éclats de zone, morts, badges d'état, aura de rage), avec accélération et prise en compte de `prefers-reduced-motion`. Les tours des monstres attendent la fin des animations.
- 20 pictogrammes de game-icons.net (CC BY 3.0) sur les jetons, l'initiative, la fiche et l'accueil ; chefs marqués d'un liseré doré ; page « Crédits » (pictogrammes et SRD).
- Accueil sur une colonne dans une fenêtre étroite.

**Suite :** M2, des portraits peints générés par un service d'images (à choisir, clé API nécessaire).

## 02/11/2026 — M2 : outil de comparaison des services d'images (préparé)

- Charte graphique et fiches visuelles des 6 héros, 2 monstres et 4 scènes : `packages/donnees/visuel/charte.json`.
- Outil `pnpm images` (`outils/images/`) : génération du lot (portraits, puis scènes avec les portraits en références), garde-fous (simulation par défaut, `--go` obligatoire, `--max`, arrêt à la première erreur, `--id` pour un essai à une image), page de comparaison HTML avec délai et coût. Tests avec un faux serveur.
- Décision de l'utilisateur : passer par **OpenRouter**, une clé et une API pour toute une famille de modèles, avec le coût réel renvoyé à chaque image. J'ai remplacé mes trois adaptateurs directs (Gemini, OpenAI, FLUX), jamais utilisés, par un seul adaptateur OpenRouter. Cinq alias (`flux2`, `flux3`, `gemini`, `gemini-pro`, `gpt-image`) et n'importe quel identifiant `auteur/modele`.
- À noter : FLUX 3 Image (10 références) est apparu dans le catalogue ; à comparer à FLUX.2 pro (8 références), car l'embuscade demande 6 héros.
- Protocole, budget (environ 0,3 à 1,5 $ par modèle) et critères : `docs/M2-IMAGES.md`.
- **Aucun appel réel n'a été fait** : en attente de la clé OpenRouter de l'utilisateur.

## 02/11/2026 — M3a : créateur de personnage

Cahier des charges de l'utilisateur : complet mais pas trop complexe, comme Baldur's Gate, sans personnalisation physique (visage, couleurs).

- Spécification : `docs/CREATION.md` (8 écrans, Recommandé partout, Création rapide, galerie de portraits).
- Données : 181 sorts de niveaux 0 à 3 extraits du SRD (5 agents en parallèle, convention d'identifiants partagée, détection des doublons), choix de création (lignages, ordres, manifestations, métamagie), liste des sorts jouables en combat.
- Moteur (`packages/regles/src/creation/`) : exigences et manquants par écran, effets des choix, sorts mineurs et préparés, bottes d'arme, équipement de départ résolu depuis les objets du SRD, recommandations et création rapide, groupe de 6 (format JSON versionné, conseils de composition), kit de combat. L'indexeur refuse les identifiants en double.
- Combat : arts martiaux du Moine, coup de poing, Attaque supplémentaire ; `preparerRencontre` accepte un groupe de 1 à 6 héros.
- Tests : 540 personnages de création rapide valides (12 classes × 9 espèces × 5 niveaux), groupes complets joués jusqu'au bout par l'IA, aller-retour de sauvegarde, groupe conseillé sans avertissement.
- Interface (`apps/jeu/src/createur/`, `groupe/`) : créateur à 8 écrans avec liste à gauche et description à droite, Recommandé partout, Création rapide, aperçu de fiche en direct, écran Groupe (6 emplacements, groupe conseillé, dupliquer, réordonner, export et import JSON, sauvegarde dans le navigateur), accueil avec choix « Pré-tirés | Mon groupe ». Vérifié en jouant : création à la main (clerc nain), création rapide (magicien elfe niveau 3), combat lancé avec un groupe créé.
- Corrections après revue : message d'import de groupe en français, choix d'espèce contrôlés dès que l'espèce est choisie.

**Limites connues** : portraits en tuiles d'attente (les images viennent avec M2) ; 25 sorts sur 181 jouables en combat ; sorts du don Initié à la magie non lançables ; les messages d'erreur bruts de `calculerFiche` ne sont affichés que s'aucun manque n'est listé.

**À valider par toi en jouant** : le parcours est-il assez simple ? Trop de choix à l'écran 5 ? Le groupe conseillé te convient-il ?

## 02/11/2026 — Mondes : un format pour des dizaines d'histoires

Demande de l'utilisateur : le moteur doit accueillir des dizaines de nouveaux mondes, chacun avec villes, villages, grottes, donjons, beaucoup de PNJ et de trésors. Le Val des Cendres (piste choisie) devient le premier monde de ce format.

- Format (`packages/regles/src/monde/schemas.ts`, `docs/MONDES.md`) : un monde est un dossier de JSON (lieux en arbre avec liens, PNJ avec personnalité, sujets, secrets, boutiques, services, compagnons ; objets, trésors, tables de butin ; rencontres ; pièges ; énigmes à solution vérifiable ; quêtes à étapes ; factions ; jauges ; événements ; fins ; faits). Conditions et effets forment un langage commun.
- Moteur : chargeur de monde, état de partie (JSON sauvegardable), évaluateur de conditions, effets, avancement automatique des quêtes, vérification des énigmes.
- Validateur (`pnpm monde valider`) : références, accessibilité des lieux, graphe des quêtes, énigmes, équilibre des rencontres (budget de PX du SRD pour 6), faits jamais révélés, objectifs de richesse par chapitre. `pnpm monde doc` génère le document lisible d'un monde.
- Catalogue d'objets du SRD partagé par tous les mondes (équipement, objets magiques) ; monstres supplémentaires.
- Val des Cendres : canon (`packages/mondes/val-des-cendres/BIBLE.md` : secret, quatre fins, factions, registre d'identifiants fixes) et six agents d'écriture en parallèle (Veillecendre, Pont-de-Fer et le Gué, grottes et hauteurs, cryptes, Haute-Forge, éléments centraux).
- **Val des Cendres écrit et validé** (0 erreur, 0 avertissement) : 1 région, 1 village, 1 ville, 1 hameau, 3 grottes, 2 donjons (cryptes sur 2 niveaux, Haute-Forge sur 3), 63 PNJ (378 sujets, 14 marchands, 3 compagnons), 93 trésors, 101 objets propres, 56 rencontres, 18 énigmes, 33 pièges, 23 quêtes, 176 faits, 6 factions, jauge de Cendre, 4 fins plus l'échec. Les zones ont été écrites en parallèle puis raccordées.
- Moteur : une étape de quête peut être marquée `termine` pour des fins alternatives (une quête ne se clôt plus tôt par erreur) ; le validateur détecte les conditions mortes (drapeau lu mais jamais posé, objet ou fait introuvable) ; boutiques et butins peuvent citer des armes et armures du SRD.
- Corrections au raccordement : le Veilleur meurt quand la Cendre atteint 4 (drapeau manquant), laissez-passer du Fer-Gris offert par un déserteur (voie « don »), bande du Gué dissoute ou vaincue compte pour la voie « service ».
- Tests : les quatre fins sont jouables de bout en bout avec le moteur d'état ; la jauge de Cendre au maximum donne l'échec ; le monde est validé à chaque `pnpm test`.

**À valider par toi en lisant** : `docs/mondes/val-des-cendres.md` (document généré, 1 000 lignes) : le ton, les personnages, les fins, l'équilibre des trésors (≈ 33 000 po au total).

**Suite** : M4, le MJ (récit illustré, arbitre, PNJ qui parlent) qui lira ce monde ; une visionneuse du monde dans l'interface pour le parcourir ; d'autres mondes.

## 02/11/2026 — Skill « creer-monde »

Demande de l'utilisateur : un skill pour construire les autres histoires.

- `.claude/skills/creer-monde/` : cadrage (trois pistes via questions), canon (modèle de bible et registre d'identifiants fixes), découpage en zones et modèles de prompts d'agents, intégration (validation à 0 erreur, test des fins avec le moteur d'état, document généré, commit), et les leçons du Val des Cendres.
- `pnpm monde nouveau <id> "<Nom>"` (`outils/monde/nouveau.ts`) : crée le squelette d'un monde en brouillon avec la bible et le guide des zones personnalisés ; testé.

## 02/11/2026 — M2 : premiers essais réels d'images

- Clé OpenRouter en place (la première était une clé de gestion, inutilisable pour générer ; limite de 1 $ atteinte, relevée à 5 $).
- FLUX.2 pro : 6 portraits et 4 scènes (~0,03 $ le portrait). Verdict détaillé dans `docs/M2-IMAGES.md` : très bons portraits ; fidélité du groupe jusqu'à 3 personnages.
- Test de l'embuscade à 6 héros avec les mêmes portraits : **FLUX 3 Image fidèle aux 6** (0,048 $) ; Gemini garde les 6 mais déforme Hilda.
- Outil : option `--refs`, commande `pnpm images depense`, bilan réel de dépense par lot.
- Suite : régénérer le lot complet avec FLUX 3 Image, ajouter des scènes du Val des Cendres, puis la galerie de portraits du créateur (54).

## 03/11/2026 — M2 : galerie de 54 portraits (moteur)

- Galerie commune à toutes les campagnes : `galerie.json` (descriptions), `outils/images/galerie.ts`, commande `pnpm images galerie`, installation WebP dans `apps/jeu/src/portraits/` (versionnée). 54 images Klein, 0,49 $, aucun refus ; 337 tests verts, build du jeu OK.
- Reste : relire les 255 images du Val des Cendres, manifeste et client, test des références Klein pour les scènes du groupe.
- Relecture complète des 255 images du Val des Cendres : 3 lieux de la Haute-Forge refaits (lave au lieu de fonte figée), le reste conforme.
- Images livrées avec le monde : `packages/mondes/<monde>/images/` (WebP, 16 Mo) + `manifeste.json` ; module moteur `monde/images.ts` (lecture, vérification, `imageDe`) ; `outils/images/installer.py galerie|monde <id>`. 340 tests verts.
- Plateau de combat refait : textures peintes par ambiance (forêt, souterrain, caverne, camp ; 12 textures raccordables), murs en léger relief, jetons agrandis, zoom et défilement ; illustration du combattant actif ou survolé en bas à gauche (portrait de galerie ou bestiaire de 30 monstres). Un essai de figurines debout en plongée a été abandonné (trop grand). Écran réorganisé : plateau au centre, actions à droite, illustration, fiche et journal en bas. Champ `terrain` des rencontres. 0,34 $ d'images.

## 03/11/2026 — Écran titre et menus

- Nom du jeu choisi : **La Table du Conteur** (`apps/jeu/src/jeu.ts`, seul endroit à changer).
- Écran titre (arrivée du joueur) sur une illustration générée (table du conteur, sans personnage ; `pnpm images interface`) : Choisir une histoire, Mon groupe, Escarmouche (l'ancien accueil, combat d'entraînement), Aide au jeu, Crédits. Les objets de l'image sont cliquables (calque SVG calé sur l'image) : livre → histoires, plume → groupe, dés → escarmouche, lanterne → aide, parchemins → crédits ; ils s'illuminent et donnent leur nom au survol, et se jouent aussi au clavier.
- Choisir une histoire : les mondes publiés de `packages/mondes` (couverture tirée du manifeste d'images, accroche, ton, résumé, chapitres) et ce qu'il faut pour commencer (groupe complet, niveau). « Commencer l'aventure » reste désactivé jusqu'au conteur (M4).
- Aide au jeu : principe, création du groupe, combat, cartes et deck d'élan, états et mort, commandes, glossaire.
- Plan de M4 (le conteur) : `docs/M4-CONTEUR.md` — tour de jeu, verbes du conteur validés par le moteur, fiche de scène + préfixe en cache (le monde complet est trop gros pour chaque tour), serveur Node pour la clé, écran d'exploration, étapes M4a (moteur d'exploration sans LLM) à M4e (partie test d'une heure).
- Décision : le jeu sera **vendu**, chaque joueur fournit **ses propres clés d'API** (plan § 7 : trousseau sécurisé, plafond de dépense, erreurs claires).
- Coût d'API par campagne : `estimerCampagne` (moteur) et `pnpm monde estimer` → `estimation.json`, affiché sur « Choisir une histoire » par modèle. Val des Cendres : ≈ 30 h, ≈ 51 $ (Opus 5.5), 29 $ (Sonnet 5.5), 4,5 $ (Haiku 5.5), provisoire jusqu'aux mesures de M4b.

## 03/11/2026 — M4a : moteur d'exploration (sans LLM)

- `exploration.ts`, `dialogue.ts`, `scene.ts` dans `packages/regles/src/monde/` : aller, fouiller, ouvrir, désarmer, prendre, parler, influencer, test libre, énigmes, repos, issue des rencontres, fiche de scène ; jets réels sur les fiches du groupe, comptes rendus factuels pour le conteur.
- Règles tranchées (docs/M4-CONTEUR.md § 10) : parent/enfant libres sauf lien déclaré, perception passive, DD de fouille secret et une fouille par lieu et par jour, pièges de contenants, barème d'influence, paliers de jauge.
- 11 tests sur le Val des Cendres (dont une marche au hasard de 400 actions) ; 355 tests verts.

## 03/11/2026 — Révision du plan M4 : coût d'API acceptable

- Constat de l'utilisateur : 30 à 50 $ d'API par histoire, c'est le prix d'un jeu AAA ; objectif fixé à **moins de 5 $ par histoire**.
- Nouveau principe : **le moteur et les textes écrits portent le jeu ; le conteur intervient là où il apporte quelque chose** (saisie libre, vraies conversations, imprévus, moments forts, bouton « Raconter »). Les actions mécaniques sont des boutons qui appellent le moteur directement, gratuitement ; sans clé, le jeu reste jouable en mode « livre ».
- Estimation refaite (tours mécaniques / tours du conteur) : Val des Cendres 918 tours dont 337 racontés ; ≈ 0,7 $ (Haiku 5.5), 4,5 $ (Sonnet 5.5), 8 $ (Opus 5.5). Haiku pressenti par défaut, à confirmer sur la qualité en M4b.
- Nouvelle étape M4b' : récit d'arrivée de chaque lieu généré une fois par nous et livré avec le jeu.

## 03/11/2026 — M4c en mode « livre » : le Val des Cendres se joue dans le navigateur

- « Commencer l'aventure » : écran d'aventure (image, récit, actions du moteur en boutons, dialogue, trésors, pièges, énigmes, sorties, groupe), combats de l'histoire avec PV conservés et retour au récit, sauvegarde automatique et reprise. Sans clé ni IA.
- Moteur : chargement pur des mondes (`assemblage.ts`, partagé Node / navigateur), verbe `commencer`.
- Détails et vérifications : `docs/M4-CONTEUR.md` § 11.

## 03/11/2026 — Analyse d'architecture : vers un moteur à modules

- Demande : préparer le moteur aux ajouts (scènes narrées, inventaire, grimoire, journal de quêtes…) sans réécriture, voire changer de langage.
- Analyse (`docs/ARCHITECTURE-CIBLE.md`) : règles saines, mais état du personnage éclaté en trois (fiche, combattant, aventurier ; d'où une potion neuve et des sorts rechargés à chaque combat de l'histoire), pas d'état racine, pas d'événements, chaque verbe déclaré trois fois.
- Cible : noyau (état de partie unique et versionné, graine dans l'état, commandes Zod, événements, effets extensibles, registre de modules) ; chaque fonctionnalité devient un module. Langage : TypeScript conservé (Rust pour la coquille de bureau Tauri, et éventuellement l'IA du combat si une mesure le justifie).
- Migration en 6 étapes, la première (noyau) rendant les suivantes additives.

## 03/11/2026 — Étape 1 de l'architecture : le noyau

- `packages/regles/src/noyau/` : partie unique et versionnée (hasard compris), commandes Zod, événements typés extensibles, transactions sur copie, événements d'état déduits automatiquement, réactions entre modules, vues.
- Modules Exploration et Dialogue (enveloppes des verbes existants) ; le client tourne sur le noyau (boutons → commandes, récit ← journal d'événements, sauvegarde = la partie).
- Nouveau skill `ajouter-module` ; 365 tests verts ; parcours vérifié dans le navigateur.

## 03/11/2026 — Étape 2 de l'architecture : le personnage unifié

- `Personnage` remplace l'aventurier : PV, ressources durables et emplacements de sorts, partagés par l'exploration et le combat (`heroCombatDe`, `appliquerEtat`). Corrige la potion offerte et les sorts rechargés à chaque combat de l'histoire.
- Repos selon le SRD (`recuperer`, table `RECUPERATION`), événement `ressourceChange`, sauvegarde en version 2 avec la première migration.
- Bandeau du groupe : potions et sorts restants. 370 tests verts ; vérifié en jeu.

## 03/11/2026 — Étape 3 de l'architecture : les boutons viennent des commandes

- `Proposition` : chaque commande décrit les actions concrètes qu'elle offre (panneau, élément, style, saisie, raison d'être grisée) ; `moteur.propositions(partie)` les réunit.
- L'écran d'aventure affiche les panneaux de façon générique : un module ajouté apparaît sans code d'interface.
- Test : 300 actions au hasard parmi les boutons proposés, aucun refus. 374 tests verts ; vérifié en jeu.

## 03/11/2026 — Étape 4 de l'architecture : Inventaire, Grimoire, Journal de quêtes

- Trois modules ajoutés sans toucher au reste ; nouvelle notion du noyau : l'encart (fiche d'information dans un onglet).
- Inventaire (utiliser, confier une potion pour le combat, identifier, jeter ; onglet Sac), Grimoire (sorts de soins hors combat ; onglet Grimoire), Journal (quêtes et notes ; onglet Journal).
- 382 tests verts ; vérifié en jeu avec le groupe du joueur.

## 03/11/2026 — Étape 5 de l'architecture : les scènes narrées

- Les mondes acceptent les données des modules (`extensions`, validées par chaque module).
- Module Scènes (déclencheurs par événements, file, revoir), lecteur plein écran (image animée, texte, voix), outil `pnpm voix` (OpenRouter gpt-audio, simulation par défaut).
- 8 scènes du Val des Cendres. Corrigé : le CLI des images s'exécutait à l'import. 386 tests verts.

## 03/11/2026 — Voix des scènes du Val

- 25 plans lus par `openai/gpt-audio-mini` (voix `onyx`) : 4,4 Mo de MP3, 0,025 $.
- Deux pièges du modèle audio : il inventait une suite après le texte, et à `temperature: 0` l'audio bouclait 13 minutes (0,04 $ perdus). L'outil vérifie maintenant la transcription mot à mot, la durée (coupure du flux au-delà du double attendu), retire les silences, refait jusqu'à trois fois, plafonne la dépense et garde chaque transcription à côté du MP3.

## 03/11/2026 — Le prologue en film

- Nouvelle présentation des scènes narrées, « film » : carton de titre, fondus enchaînés, texte qui défile au rythme de la voix, « Commencer l'aventure » à la fin. Le prologue du Val passe à 6 plans (Haute-Forge, Val, champ de cendre, Lanterne, col fermé, Veillecendre), environ 70 s, voix refaites (0,004 $).
- `pnpm voix` refait un plan dont le texte a changé. Corrigé : le client chargeait les fiches des voix (`voix/*.json`) avec les données du monde.
- Vérifié dans le jeu : les six voix enregistrées s'enchaînent, le texte défile centré, le titre revient à la fin.

## 03/11/2026 — Un sac plus agréable : grille, page dédiée, tris

- Noyau : `Encart.grille` (éléments rangés par groupe, avec rareté, image ou icône, mesures, « nouveau », « à découvrir »), `Proposition.choix` (choix d'un héros avec portrait) et `Proposition.confirmer`.
- Écran : grille triable, filtrable et cherchable ; page plein écran du sac (touche I, Échap) avec fiche et actions de l'objet choisi ; 18 icônes dessinées ; cadre de rareté ; pastille « nouveau ».
- Inventaire : soigner ou confier à un héros précis, identifier avec le héros de son choix, jeter avec confirmation ; objets à identifier mystérieux (`inconnu`, 3 objets du Val).
- Vérifié dans le jeu avec un sac de 20 objets ; trouvé au passage : le serveur de développement ne voyait pas le catalogue SRD ajouté après son démarrage (446 objets absents côté navigateur), d'où des objets affichés par leur identifiant. Relancer `pnpm jeu` règle ce cas. 391 tests verts.

## 03/11/2026 — Les énigmes, vérifiées et réparées

- Vérification de « Les aiguillages du carreau » : l'énigme est juste, mais 13 des 18 énigmes du Val ne se résolvaient pas par les boutons (réponse envoyée en texte, attendue en liste ou en association) et l'échec d'une énigme *supprimait* le combat annoncé au lieu de le lancer.
- Formulaires de réponse par type (éléments à ordonner, nombres, leviers, placement), réponses mal formées refusées sans conséquence, effet `rencontre` qui déclenche vraiment, `plage` et `libelles` des cadrans.
- Vérifié dans le jeu : séquence (bonne et mauvaise réponse, le combat du dortoir se lance), cadran, leviers et placement. 420 tests verts.

## 03/11/2026 — Skill « enigmes » et audit automatique

- Skill de projet `enigmes` : écrire, vérifier et réparer les énigmes, avec la vérification obligatoire (demande de l'utilisateur : « toujours les vérifier »).
- `pnpm monde enigmes <monde>` joue chaque énigme dans le moteur et contrôle l'échec, la récompense, les indices et l'énoncé ; `pnpm monde valider` l'inclut. Le Val : 0 erreur, 6 avis. 423 tests verts.

## 03/11/2026 — L'équipement et le conteur

- **Équipement** (module `equipement`) : équiper et retirer armure, bouclier, armes, parures et objets magiques ; la CA et les armes de combat suivent (`Fiche.defense`, `caAvec`) ; les objets portés sont dans la grille du sac, groupés par héros ; catalogue du SRD commun à tous les mondes (une arme du monde repose sur une arme du SRD) ; outil `pnpm images equipement` pour les images communes (51, ≈ 0,46 $, en attente d'accord).
- **Conteur** (M4b) : le conteur appelle les commandes du moteur comme outils (OpenRouter, Claude Haiku 5.5), saisie libre dans l'écran d'aventure, récit et actions suggérées, relais du serveur de développement qui garde la clé. **≈ 0,0015 $ par tour** mesuré sur quatre tours réels. 453 tests verts.

## 03/11/2026 — Escarmouches adaptées au groupe

- Question de l'utilisateur : les adversaires des escarmouches sont-ils du niveau des héros ? Non, quatre rencontres fixes pour six héros de niveau 3.
- Nouveau : `composerRencontre` (thème + difficulté + niveaux des héros → rencontre au budget du groupe), écran d'escarmouche avec choix de la difficulté, `pnpm escarmouches` pour caler l'équilibre par simulation. Les PX du SRD ne disent pas tout (la crypte était bien plus dure que la bande à PX égaux) : coefficient de danger par thème. Limite : 30 monstres au catalogue, niveau 5 trop facile.


## 04/11/2026 — Icônes de classe sur les jetons et les portraits

- Chaque classe jouable a son pictogramme propre : six classes empruntaient une icône voisine (paladin, ensorceleur, occultiste, druide, moine, barde). Dessins maison pour ces six (`apps/jeu/src/icones/`, sans source externe, crédits dans `CREDITS.md`).
- L'icône de la classe est posée en bas à droite du portrait du héros dans la fiche de combat (médaillon aux couleurs du camp, grisé à la mort). Les jetons l'affichaient déjà.
- Vérifié dans le navigateur (escarmouche avec les héros pré-tirés) ; 463 tests verts, typecheck OK.

## 04/11/2026 — Retour visuel des attaques et de la magie, palier 1 : des impacts qui se sentent

- **Une famille de dégâts, un habillage** (`apps/jeu/src/effets-visuels.ts`) : 13 familles (tranchant, perforant, contondant, feu, froid, foudre, acide, poison, nécrotique, radiant, force, psychique, tonnerre), chacune avec son impact (braises, éclats de glace, éclair, bulles, rayons, onde qui converge, ondes concentriques…), sa couleur de chiffre et sa façon de mourir (le jeton noircit, se fige, blanchit, vire au vert, grésille). Un élément l'emporte sur le physique : une épée de feu brûle.
- **Coups d'arme** : arc de lame (tranchant), estoc (perforant), onde de choc en étoile (contondant), orientés de l'attaquant vers la cible.
- **Critique** : arrêt sur image de 90 ms, plateau qui tremble et se rapproche de la cible, bords rougis. Le tonnerre fait trembler le plateau en plus léger.
- **Mentions** « Résiste », « Vulnérable ! », « Immunisé » : le journal du moteur porte maintenant `details.reaction` (un test). Mouvement réduit : seuls les chiffres restent.
- Les effets passent au-dessus des jetons (le conteneur était sous eux).
- **Banc d'essai** : `http://localhost:5173/?effets` (un bouton par famille, critique, réaction, « tout enchaîner ») pour régler les effets sans lancer de combat.
- Vérifié dans un vrai combat (impacts perforant et tranchant, critique avec secousse et flash) ; 464 tests verts, typecheck OK. Reste à voir en jeu : les sorts (feu, froid…), la mort par famille. Paliers 2 (projectiles de sorts, zones qui se propagent) et 3 (auras, états) à faire.

## 04/11/2026 — Retour visuel des attaques et de la magie, palier 2 : des sorts qui voyagent

- **Un projectile par forme de sort** (`formeSort`, `effetDeSort`) : boule de feu à traînée (trait de feu), éclat de glace (rayon de givre), dard qui dévie en arc (projectile magique, un par fléchette), jet d'acide qui monte en arc, volute sinueuse (poison, nécrotique, psychique). Un sort inconnu suit la famille de ses dégâts.
- **Rayons instantanés** : faisceau qui jaillit puis s'éteint (rayon ardent, flamme sacrée), éclair en zigzag qui crépite (éclair traçant).
- **Zones qui se propagent** : la zone part de son centre (le point visé, ou le lanceur pour un souffle) et gagne les cases une à une (60 ms par case) ; taches de couleur aux bords fondus ; explosion à l'origine pour un sort de dégâts lancé à distance.
- **Cercle d'incantation** : un cercle de runes (deux carrés, anneau gradué) se trace sous le lanceur avant chaque sort. Mouvement réduit : lueur simple, zone sans propagation.
- Banc d'essai (`/?effets`) : onze sorts, lancés depuis un disque bleu vers la case choisie ; il rejoue la même séquence que le combat.
- Vérifié : chaque forme au banc d'essai (images arrêtées à mi-course) et dans un vrai combat (cercle d'incantation et éclair). 464 tests verts, typecheck OK. Reste le palier 3 : auras persistantes (bénédiction, bouclier de la foi, fléau, marque) et états lisibles sur les jetons.

## 04/11/2026 — Retour visuel des attaques et de la magie, palier 3 : des effets qui restent visibles

- **Auras persistantes** sur les jetons du plateau (`aurasDe`, trois au plus), tirées des modificateurs en cours : bénédiction (anneau doré parcouru d'une étincelle), bouclier de la foi et sort Bouclier (bulle froide qui miroite), fléau (anneau violet qui vacille), marque du chasseur (réticule rouge), givre (rayon de givre, ralentissement), éclair traçant (anneau jaune), concentration (cercle de runes qui tourne), points de vie temporaires (liseré blanc). Une aura qui apparaît « se pose » en une demi-seconde.
- **États lisibles sur le jeton** : signes flottants (z pour le sommeil et l'inconscience, cœurs pour le charme, points d'exclamation pour la peur, éclairs pour la paralysie, points d'interrogation pour la cécité, bulles pour le poison), jeton couché quand il est à terre, icône qui tremble quand il est effrayé, crépitement jaune pour la paralysie, chaîne pour l'entrave et l'empoignade. Les badges restent pour le détail. Rien de tout cela dans la barre d'initiative (jetons trop petits).
- Banc d'essai (`/?effets`) : une section « Auras et états » avec un jeton par aura et par état.
- Vérifié au banc d'essai et dans un vrai combat (sommeil, chaînes, points de vie temporaires). 464 tests verts, typecheck OK. Les auras s'affichent d'après l'état réel du moteur : elles peuvent apparaître un instant avant la fin de l'animation du sort qui les pose.

## 04/11/2026 — L'aide du jeu devient un vrai guide du joueur, avec captures d'écran

- **Trois nouvelles sections** dans « Aide au jeu » (`apps/jeu/src/menu/EcranAide.tsx`) :
  - « Les classes et leurs icônes » : les douze classes, leur icône (celle du jeton et le médaillon du portrait), leur rôle en une phrase ; capture des douze portraits avec médaillon et jeton, capture du plateau.
  - « Voir les attaques et la magie » : les treize familles de dégâts (pastille de couleur et description de l'impact), le coup critique, les mentions Résiste / Vulnérable / Immunisé, les projectiles et rayons de sorts (boule, glace, éclair, faisceau, dards), les zones qui se propagent (cône, sphère), le cercle d'incantation, le mouvement réduit.
  - « Auras et états sur les jetons » : chaque aura et chaque état, avec sa capture.
- Onze captures d'écran dans `apps/jeu/src/aide/` (PNG et JPG, 1,3 Mo), chargées par Vite et affichées par un petit composant `Capture` légendé.
- Les captures viennent du banc d'essai : `/?effets&cote=72` règle la taille d'une case et propose maintenant aussi une planche « Classes : jeton et portrait en combat ». Pour les refaire : ouvrir le banc d'essai dans un navigateur de 800 × 600, lancer l'effet, figer les animations et rogner la zone.
- Si un effet change d'apparence, refaire sa capture : elles montrent l'état du jeu au 04/11/2026.

## 04/11/2026 — Les bruitages de combat

- **Outil `pnpm sons rogner`** (`outils/sons/`) : coupe le silence du début et de la fin d'un son (garde une queue de 0,15 s), pose un fondu, égalise le volume moyen à −20 dB sans que le pic dépasse −1,5 dB, écrit en mp3 ou en ogg. `--simuler` affiche sans écrire ; `--correspondance` renomme. Les cinq sons de 8 s fournis par l'auteur du jeu tombent à 0,7–1,7 s. 16 tests (analyse des silences, bornes, gain, noms). Il lui faut ffmpeg.
- **Dix sons de l'auteur** (épée, hache, arc, feu ×2, glace, foudre, projectile magique, soin, protection) et **deux sons Kenney CC0** (contondant, perforant) dans `apps/jeu/src/sons/`. Leur origine et leur licence sont dans `sons/CREDITS.md` : **les dix sons de l'auteur sont à confirmer avant la vente** ; sources et licences des lots téléchargés dans `sources/audio/LICENCES.md`.
- **Branchement** (`sons-regles.ts`, pur et testé ; `sons.ts`, lecture) : coup d'épée ou de hache à l'impact d'un coup tranchant (la hache d'après le nom de l'arme dans le journal), pointe pour le perforant au corps à corps, choc sourd pour le contondant, corde d'arc au départ d'un tir, bruit du sort à son départ (feu, glace, foudre, projectile magique, un par fléchette), soin, protection au lancement de bouclier / bouclier de la foi / bénédiction. Les dégâts d'un sort ne rejouent rien ; une arme enchantée (dégâts de feu sans sort) reste muette plutôt que de se tromper. Les sorts sans son (sommeil, acide, poison, nécrotique, radiant, psychique, tonnerre…) restent silencieux. Les sons jouent aussi en « mouvement réduit ».
- **Commande** : 🔊 et curseur de volume dans la barre d'actions du combat, réglage mémorisé dans le navigateur (`crpg.son`) ; un coup d'épée à la fin du réglage. Le banc d'essai (`/?effets`) a une ligne « Écouter les bruitages » (un bouton par son) et joue les mêmes sons que le combat.
- Vitest couvre maintenant aussi `apps/*/src/**/*.test.ts` (13 tests de correspondance).
- Vérifié dans un vrai combat (arc, épée, hache, perforant, foudre, soin ; sourdine à 0 son) et au banc d'essai (chaque sort et chaque famille). Je ne peux pas écouter : le rendu à l'oreille reste à juger. Manquent : sons pour les autres familles de dégâts, la zone de sommeil, la mort.

## 04/11/2026 — Bruitages : le son d'un coup d'arme part avec le coup

- Constat de l'utilisateur : les sons des coups d'arme arrivaient en retard. Mesuré en combat : le son partait 230 ms après la secousse de la cible (440 ms sur un critique), parce qu'il attendait l'événement des dégâts ; et un élément `<audio>` met en plus plusieurs dizaines de millisecondes à démarrer.
- Le bruit du coup se joue maintenant **au moment où la cible est touchée** : l'animation va chercher dans le journal les dégâts que porte l'attaque (`degatsDeLAttaque`, 5 tests) pour choisir le son, et ne le rejoue pas avec les dégâts.
- L'arc de lame, l'impact et le chiffre suivent la secousse de plus près (110 ms au lieu de 220 ; 240 au lieu de 340 sur un critique).
- **Lecture par Web Audio** (`sons.ts`) : chaque son est téléchargé et décodé une fois, puis joué sans délai ; repli sur un élément `<audio>` tant que le son n'est pas décodé ou que le navigateur garde l'audio en veille.
- Mesuré à nouveau : 0 ms entre la secousse et le son d'arme. 498 tests verts, typecheck OK.

## 04/11/2026 — Musiques d'ambiance de combat : l'outil et un premier clip

- **Modèles trouvés sur OpenRouter** (catalogue de 455 modèles, seuls deux produisent de la musique) : `google/lyria-3-clip-preview` (clip de 30 s, **0,04 $**) et `google/lyria-3-pro-preview` (morceau complet d'environ 2 min, **0,08 $**), tous deux de Google. Sortie : audio stéréo 44,1 kHz (mp3 ou wav), instrumental demandé dans la consigne, filigrane SynthID inaudible, résultat non déterministe, pas de retouche. **Licence d'usage commercial des sorties non précisée par OpenRouter ni par la page Google : à vérifier avant la vente.**
- **Outil `pnpm musique`** (`outils/musique/`) : `lister` (les cinq ambiances : forêt, souterrain, caverne, camp, intense, une par terrain du plateau + le combat intense) et `generer [--ambiance] [--modele clip|pro] [--plafond] [--go]`. Simulation par défaut ; plafond de dépense (0,10 $) ; la réponse brute est écrite avant d'être lue, pour ne jamais perdre ce qui a été payé ; brouillons dans `sorties/musique/` (hors git) avec un `.json` (consigne, durée, coût). 10 tests (lecture du flux, format, ambiances, coûts).
- **Piège trouvé** : une variable `OPENROUTER_API_KEY` du shell (laissée par un autre projet) masquait la clé du `.env` (« User not found »). L'outil lit maintenant la clé du `.env` du projet.
- **Dépense** : 0,16 $ au total sur la clé (0,12 $ pour trois requêtes de diagnostic à jeter, mon erreur, plus 0,04 $ pour le clip). Règle retenue : jamais de requête de diagnostic qui peut réussir sur un service payant.
- **Premier clip** (`foret-clip-1.mp3`, ambiance forêt, Lyria 3 Clip) : 30,8 s, mp3 192 kb/s stéréo 44,1 kHz, 727 Ko, sans silence, volume constant (−12 à −16 dB, aucun fondu à la fin). À écouter pour juger la consigne ; reste à faire les quatre autres ambiances.

## 04/11/2026 — Musiques : l'étape « boucler »

- Mesure du clip forêt brut : pas de clic au raccord, durée de 30,77 s ≈ 12 mesures à environ 94 battements par minute (bon signe), mais les 100 premières millisecondes sont à −29 dB (entrée douce de 0,5 s) et les 100 dernières à −17 dB : bouclé tel quel, le morceau se couperait en pleine énergie puis repartirait doucement.
- **`pnpm musique boucler <fichier> [--fondu 1.5] [--format mp3|ogg]`** (`outils/musique/boucle.ts`, gratuit) : fondu enchaîné fin → début en puissance égale. La boucle dure L − fondu et reprend exactement l'original à L − fondu : au tour suivant la musique continue sans coupure. `pnpm musique verifier <fichier>` mesure un raccord.
- **Vérifié par construction** sur `foret-clip-1-boucle.mp3` : le début de la boucle corrèle à 0,999 avec l'original à 29,27 s (décalage 0 ms), la fin à 1,000 avec l'original juste avant ; l'énergie pendant le fondu suit le mélange attendu à 0,6 dB près (pas de creux). Mesurer seulement « l'écart de volume au raccord » s'est révélé trompeur : cette musique est percussive et varie de plusieurs dB d'une fenêtre à l'autre ; la mesure compare maintenant au changement de volume que l'original a lui-même à cet endroit.
- 20 tests sur l'outil (flux, ambiances, boucle, mesures). Reste à faire : lire la boucle sans blanc dans le jeu (Web Audio avec points de boucle, l'élément `<audio>` laisse un petit trou), puis les quatre autres ambiances.

## 04/11/2026 — Musiques d'ambiance : un niveau de fond sonore

- Remarque de l'utilisateur : les musiques de fond ne doivent pas être jouées trop fort. Le clip forêt brut sortait à −14 dB de volume moyen (pic 0 dB), nettement au-dessus des bruitages (−20 dB).
- `pnpm musique boucler` ramène maintenant la boucle au niveau d'une musique d'ambiance : **−26 dB de volume moyen** (6 dB sous les bruitages) et pic ≤ −3 dB (`NIVEAU_AMBIANCE`, réglable avec `--moyenne`). Forêt bouclée mesurée à −26,3 dB, pic −11,6 dB. 22 tests.
- Règle pour l'intégration dans le jeu : la musique aura son propre canal et son propre curseur, séparés des bruitages, avec un défaut bas (environ 30 %) ; bruitages et voix restent toujours au-dessus.

## 04/11/2026 — Musiques d'ambiance de combat : les cinq sont faites

- **Quatre clips générés** (Lyria 3 Clip, 4 appels, 0,16 $) : souterrain, caverne, camp de guerre, combat intense ; la forêt existait. Brouillons dans `sorties/musique/<ambiance>-clip-1.mp3` (hors git), boucles prêtes dans `<ambiance>-clip-1-boucle.mp3`. Dépense totale de la clé pour ce chantier : 0,32 $ (dont 0,12 $ d'essais de diagnostic perdus).
- **Le souterrain finissait par une résonance qui s'éteint** (−15 dB à 26 s, puis −29, −38, −49) malgré la consigne « sans fondu » : bouclé tel quel, il aurait laissé un creux de silence à chaque tour (38 dB de chute au raccord). `pnpm musique boucler` écarte maintenant la partie faible aux extrémités (`bornesStables` : fenêtres de 0,25 s à plus de 8 dB sous le volume médian, au moins deux de suite, pour ne pas couper un simple silence entre deux coups) : le souterrain devient une boucle de 25,0 s, raccord à 0,4 dB (l'original a 0,0 dB à cet endroit).
- Les cinq boucles : 25 à 29,3 s, volume moyen −26,2 à −26,3 dB, pic ≤ −11,6 dB, raccord fidèle à l'original partout. `--ambiance` accepte une liste (`souterrain,caverne`). 27 tests sur l'outil.
- Reste : brancher les musiques dans le jeu (une au hasard à chaque combat), lecture sans blanc, canal de volume à part, et licence d'usage commercial à vérifier.

## 04/11/2026 — Les musiques d'ambiance sont dans le jeu

- **Une musique au hasard à chaque combat** parmi les cinq (`musique-regles.ts`, `choisirAmbiance` : jamais la même que le combat précédent ; 5 tests). Les cinq boucles sont dans `apps/jeu/src/musique/` (3,4 Mo, crédits et réserve de licence dans `musique/CREDITS.md`).
- **Lecteur** (`musique.ts`) : Web Audio, boucle sans blanc (`loop`, `loopStart` 0, `loopEnd` = durée de la boucle, déjà montée pour se raccorder), fondu d'entrée de 2 s, fondu de sortie de 3 s à la fin du combat et de 0,8 s quand on quitte l'écran. Seule l'ambiance tirée est téléchargée et décodée (le jeu démarre vite). Le contexte audio est partagé avec les bruitages.
- **Canal à part** : bouton ♪ et curseur de musique à côté de 🔊, réglage mémorisé (`crpg.musique`), défaut 50 % : les fichiers étant à −26 dB, la musique reste environ 8 dB sous les bruitages (60 %), conformément à la consigne « musique de fond, pas trop forte ». Couper la musique éteint en fondu, la rallumer repart sur la même ambiance.
- Banc d'essai (`/?effets`) : une ligne « Écouter les musiques d'ambiance » (un bouton par boucle, « Arrêter »).
- Vérifié dans un vrai combat : une boucle de 29,25 s avec `loop` actif et `loopEnd` égal à sa durée, gain de musique à 0,5 contre 0,6 pour les bruitages, sourdine = gain à 0 et source arrêtée (réglage mémorisé), la reprise relance en fondu, quitter l'écran arrête la musique, la fin du combat l'éteint en 3 s. En développement, le double montage de React charge parfois une deuxième ambiance pour rien (sans effet en production). 530 tests verts.
- Reste : la licence d'usage commercial des musiques générées, et choisir une ambiance par terrain pour les combats de l'histoire si on le souhaite.

## 04/11/2026 — Les bruitages des sorts et des armes

- **22 nouveaux sons** fournis par l'auteur du jeu (armes : fouet, lance, rapière, masse, massue, arbalète, fronde, arme à feu, sarbacane, arme lancée, attaque ratée ; sorts : radiant, acide, poison, nécrotique, tonnerre, sommeil, immobilisation, arme spirituelle, renforcement, marque, malédiction), rognés et égalisés par `pnpm sons rogner` (les blancs coupés : jusqu'à 8 s de silence retirées). 34 sons en tout (`docs/SONS.md` dit ce qui est en place et ce qui manque).
- **Correspondance** (`sons-regles.ts`, 26 tests) : l'arme est reconnue par son nom dans le journal (hache, fouet, lance/pique/trident → estoc, rapière/dague/épée courte, masse/marteau/fléau/morgenstern, massue/gourdin/bâton, sinon son générique) ; un tir a son bruit au départ (arc, arbalète, fronde, arme à feu, sarbacane, sinon arme lancée) ; une arme qui rate siffle (`rate-arme`) ; chaque sort a son son au départ, les sorts de soutien (bouclier, bénédiction, aide, marque, malédiction) au lancement, et un sort sans son propre prend celui de la famille de ses dégâts (radiant, acide, poison, nécrotique, tonnerre en plus de feu, froid, foudre, force). Le son d'un sort à jet de sauvegarde (flamme sacrée, blessure, immobilisation) joue une fois, pas à chaque créature d'une zone. Le Rayon traçant passe de `foudre` à `radiant`.
- **Vérifié** : au banc d'essai, les 19 sorts testés jouent le bon fichier (3 sons pour les 3 fléchettes) ; dans un vrai combat, lance, arme lancée, rapière, masse, massue, marque, protection, feu et cinq attaques ratées ont joué, sans repli sur un élément `<audio>` (tout est préchargé et décodé). Le serveur de développement a dû être relancé pour voir les nouveaux fichiers.
- **À revoir** : trois paires de fichiers fournis sont identiques (`lance` = `lancer`, `rapiere` = `rate-arme`, `necrotique` = `renforcement`) ; `fleche-impact` est le même son que `arc` (le départ de la corde), il n'a pas été branché (l'impact d'une flèche reste muet) ; `chaine` (fléau d'armes) n'a pas été fournie (joue `masse`). Licence des sons fournis à confirmer avant la vente.

## 04/11/2026 — Première version de bureau (Tauri)

- Décision prise avec l'utilisateur : on développe dans le navigateur, on **vend une application de bureau** ; Tauri 2 plutôt qu'Electron (programme d'environ 10 Mo contre 150, moteur WebView2 sur Windows). Les outils étaient déjà sur la machine (Rust 1.97, Build Tools 2022, WebView2) ; seuls l'outil Tauri (npm) et les bibliothèques Rust ont été téléchargés.
- `apps/bureau/` : une fenêtre de 1440 × 900 (minimum 1100 × 700) qui affiche le jeu de `apps/jeu` sans dupliquer son code ; installeur NSIS en français, pour l'utilisateur courant ; icône provisoire tirée de l'écran titre. Commandes : `pnpm bureau` et `pnpm bureau:installeur`. Détails et suite : `docs/BUREAU.md`.
- Premier build : **installeur de 29,9 Mo** (`La Table du Conteur_0.1.0_x64-setup.exe`), programme de 38 Mo, 2 minutes de compilation. Lancé pour vérifier : la fenêtre « La Table du Conteur » s'ouvre, le WebView2 démarre et crée son dossier de données. L'installeur n'a pas été exécuté sur la machine.
- Limite connue : le conteur n'a pas de relais dans l'application, le jeu y reste en mode « livre » jusqu'à l'écran Options (clé du joueur dans le trousseau du système). Signature du programme, macOS et mises à jour : plus tard.

## 04/11/2026 — Premier audit du code, corrections (lots 1 et 2)

- Constat de l'utilisateur : le code n'était jamais relu par un autre que son auteur. **Audit indépendant** (agent séparé, lecture seule, sans appel payant) de tout ce qui a été écrit dans la session : 5 défauts importants, une quinzaine de mineurs, des tests manquants. Les principaux ont été revérifiés dans le code avant correction.
- **Lot 1, sécurité et dépenses** :
  - le relais du conteur n'accepte plus que le jeu lui-même : origine locale ou application de bureau, corps en JSON (une page web ouverte dans le navigateur pouvait dépenser la clé du développeur) ; `max_tokens` et plafond invalides ne font plus sauter les bornes ; une seule requête à la fois, pour que le plafond tienne (`apps/jeu/relais.ts`, 10 tests ; vérifié sur le serveur : 403 pour une origine étrangère, 415 pour du texte brut) ;
  - une seule lecture de la clé pour tous les outils et le relais, **le `.env` du projet gagne sur le shell** (`outils/cle.ts`, 7 tests) ; la fin de la clé utilisée s'affiche avant tout appel payant (voix, musique, conteur) ;
  - les plafonds de dépense acceptent la virgule et refusent une valeur invalide (`lireMontant`) au lieu de se désactiver ;
  - `sources/` entier est ignoré par git ; le banc d'essai (`/?effets`) n'existe plus qu'en développement (absent du build, vérifié).
- **Lot 2, justesse des sons et des effets** :
  - le moteur met l'arme dans le journal (`details.arme`, identifiant de l'arme ou de l'action du monstre) : la lecture du texte (`armeDuJournal`), fragile, est supprimée ; les sons d'arme cherchent des mots entiers (« arc » n'est pas dans « lance d'arçon ») ;
  - le bruit et le tracé d'un coup viennent de sa part physique (`famillePhysique`), la couleur de l'impact de l'élément : fin du coup muet sous la Marque du chasseur ou une morsure empoisonnée ;
  - le Bouclier en réaction porte son sort dans le journal, donc son bruit ; l'Écorchure (raté qui blesse) ne rejoue plus un bruit de coup ; un coup sans position garde son bruit ;
  - tests sur un **vrai journal du moteur** (`journal-sons.test.ts` : arme nommée, Marque, javeline lancée, Bouclier) et contrôle des fichiers audio (chaque son et chaque musique déclarés ont leur fichier, outil et jeu ont les mêmes ambiances).
- 561 tests verts, typecheck et build OK ; vérifié dans un vrai combat. Restent les lots 3 (solidité des outils, `pnpm typecheck` du jeu, port fixe, CSP avant l'écran Options) et 4 (maintenance : tables de couleurs, code partagé, découpage de `styles.css`).

## 04/11/2026 — Répliques des compagnons : le pilote

- Idée de l'utilisateur, à la manière de Baldur's Gate : **chaque portrait a ses propres phrases**, génériques, dites selon la situation du personnage (« J'ai besoin de soins ! » quand il est gravement blessé), en combat d'abord, dans les histoires ensuite.
- Le portrait suit toujours l'espèce et le genre (le créateur le remplace quand on change d'espèce) : les phrases de celui qui parle sont écrites telles quelles, avec ses accords. Seule la personne **dont on parle** demande un accord : `{nom}` et `{masculin|féminin}` (« Couvrez-{le|la} ! »). Le caractère de chaque voix est tiré de la description du portrait (`galerie.json`).
- Pilote : **3 portraits** (`humain-f-1` franche et déterminée, `nain-m-2` vieux sage sec, `tieffelin-f-1` bravache), **10 situations** (début du combat, blessé, gravement blessé, relevé, soigné, critique donné ou reçu, ennemi abattu, allié tombé, victoire), 3 phrases chacune : 90 répliques écrites à la main, sans appel d'API. Format : `packages/donnees/repliques/<portrait>.json` (voir `docs/REPLIQUES.md`).
- `apps/jeu/src/repliques-regles.ts` (pur) : les situations sont repérées dans le journal du moteur, comparé à l'état d'avant la commande (seuils de PV franchis, héros relevé de 0 PV, mort d'un allié…). Puis **une réplique au plus par commande** : la plus importante d'abord, une réplique ordinaire par round pour le groupe et tous les deux rounds pour un même personnage (les situations graves passent outre), une chance sur deux ou trois pour les situations courantes, pas de redite avant d'avoir tout dit. Le hasard vient de l'interface, le tirage du moteur n'est pas touché.
- Affichage : une bulle de parchemin au-dessus du jeton et une ligne dans le journal (« Hilda : « … » »). Une bulle à la fois (la suivante attend), un temps de lecture qui ne suit pas le mode rapide, une bulle qui survit au clic qui termine les animations ; le bilan de fin attend la dernière réplique.
- Tests : 14 (fichiers valides, accords, repérage sur un vrai journal du moteur, priorités, silences, pas de redite). Vérifié dans de vrais combats (héros joués par l'IA, portraits du pilote posés en mémoire) : 7 répliques sur 4 rounds, jamais deux bulles ensemble, accords justes.
- Suite : les 51 autres portraits ; des répliques liées à la classe ou à l'alignement ; les situations d'histoire (entrer dans un lieu, trouver un trésor, se reposer) ; une voix lue, plus tard et avec accord sur le coût.

## 04/11/2026 — Voix des répliques : essais, Gemini retenu

- Essai 1, `openai/gpt-audio-mini` et `gpt-audio` (7 prises du vieux nain, 0,0154 $) : **refusé par l'utilisateur**, « on dirait un robot qui récite une phrase ». C'est un modèle de conversation qui parle, pas un moteur de voix ; la consigne « mot pour mot » le poussait à réciter.
- Essai 2, **Gemini 3.8 Flash TTS** (choix de l'utilisateur), voix Algenib (« rocailleuse ») : 5 prises, 0,0046 $. Le texte exact et le style (« vieux nain guerrier, voix grave et rocailleuse ; gravement blessé, à bout de souffle… ») partent séparément (`instructions`, transmis à Gemini comme `speech_metadata.style`) : le style n'est pas lu.
- « C'est mou » : deux versions accélérées sur la machine, sans appel ; l'utilisateur choisit **×1,25**, avec les pauses internes ramenées à 0,12 s. C'est le réglage de toutes les répliques (`filtreReplique`, `outils/voix/lecture.ts`).
- Outil `pnpm repliques` (`outils/voix/repliques.ts`) : `lister`, `voix <portrait>` (simulation sans `--go`, plafond, coût relevé pour chaque prise), `convertir <portrait>` (refait les MP3 depuis l'audio brut gardé, gratuit). La lecture commune aux scènes et aux répliques est dans `outils/voix/lecture.ts`. Les essais sont dans `sorties/voix-repliques/` (hors de git).
- Limite : les phrases qui nomment un allié (`{nom}`) ne se lisent pas d'avance. Reste à faire : brancher les voix dans le jeu (canal des bruitages), les répliques et les voix des autres portraits, vérifier la licence commerciale des voix Gemini avant la vente.

## 04/11/2026 — Répliques : des cris courts, et les ratés

- Retour de l'utilisateur après avoir écouté Gemini à ×1,25 : « c'est mieux, mais je voyais surtout pour les combats des phrases plus petites » (« J'ai besoin de soins », « Je suis grièvement blessé », « Victoire ! », « Encore raté »…). Les phrases de dialogue du pilote étaient trop longues pour un combat.
- Les 3 portraits du pilote sont **réécrits en cris de 1 à 5 mots** ; la bulle reste 1,3 s plus 45 ms par caractère, au plus 3,2 s. Les 5 prises Gemini déjà payées (0,0046 $) disaient les anciennes phrases : elles ne servent plus.
- Deux situations nouvelles, **12 en tout** : `rate` (le héros rate une attaque, commenté une fois sur quatre) et `rate-encore` (sa précédente attaque avait déjà raté, six fois sur dix). Repérées dans le journal du moteur, testées avec des dés imposés (15 tests).

## 04/11/2026 — Répliques : le groupe de base parle, les voix se branchent

- Constat de l'utilisateur : en escarmouche avec le groupe de base, aucune voix. Normal : seuls les 3 portraits du pilote avaient des phrases, et aucune voix n'était branchée. Les cris sont maintenant écrits pour les **6 héros pré-tirés** (`humain-m-1`, `orc-m-1`, `halfelin-m-1`, `elfe-f-1`, `nain-f-1`, `gnome-f-1`) : 9 portraits en tout, 36 phrases chacun, chacun avec son timbre Gemini (Achird, Orus, Puck, Vindemiatrix, Kore, Leda, Zephyr, Pulcherrima, Algenib).
- Le cri court du vieux nain (« J'ai besoin de soins ! », « Pour les ancêtres ! »…) a été validé à l'oreille par l'utilisateur.
- Branchement : `apps/jeu/src/voix.ts` dit la phrase quand sa bulle apparaît (canal des bruitages, un peu plus fort qu'eux, une voix à la fois), précharge les voix des héros du combat ; sans fichier, bulle muette. `Replique` porte le portrait et le numéro de la phrase.
- `pnpm repliques voix tous --livrer` : tous les portraits d'un coup, MP3 livrés dans `apps/jeu/src/voix/`, phrases déjà livrées sautées, plafond vérifié sur le compteur de la clé toutes les 10 prises. Tests : 578 verts.

## 04/11/2026 — Cris de combat : une voix par race, des cris communs

- Idée de l'utilisateur : plutôt que des phrases propres à chaque portrait, **10 à 15 cris communs à tous**, et **une voix différente par race, gardée pour tous les cris** (« le principal est de garder la cohérence d'une voix »). Adopté : les 9 fichiers par portrait sont supprimés (le premier essai du pilote reste dans l'historique git).
- Les voix sont par race **et par genre** (18 voix pour les 9 races) : les voix de Gemini ont un genre, et le cri s'accorde (« blessé » ou « blessée »). Les 3 portraits d'une même race et d'un même genre partagent sa voix ; un nouveau portrait parle sans rien écrire.
- Données : `packages/donnees/repliques/cris.json` (15 cris sur les 12 situations, accord `{blessé|blessée}`) et `voix.json` (timbre Gemini et personnage à jouer pour chacune des 18 voix, timbres tous différents : Achird, Zephyr, Algenib, Kore, Iapetus, Vindemiatrix, Puck, Aoede, Sadachbia, Leda, Algieba, Pulcherrima, Orus, Gacrux, Alnilam, Sulafat, Schedar, Autonoe).
- Code : la voix d'un héros vient de son portrait (`elfe-f-2` donne `elfe-f`), le choix du cri est par personnage (pas de redite avant d'avoir tout dit), `Replique` porte la voix et le numéro du cri. `pnpm repliques voix tous --livrer` génère les 18 voix × 15 cris = 270 appels (≈ 0,12 $), saute ce qui est déjà livré, vérifie le plafond sur le compteur de la clé. 583 tests verts.
- Reste à faire : générer les voix (accord de l'utilisateur pour la dépense), puis vérifier à l'oreille, race par race ; améliorer plus tard (davantage de cris par situation, cris propres à certains portraits en bulle seulement).
- **Voix générées** (accord de l'utilisateur) : 270 cris, 18 voix × 15, avec Gemini 3.8 Flash TTS, **≈ 0,11 $** au compteur de la clé (0,1061 $, plus une prise refaite : « Un de moins ! » de l'humain, que Gemini avait tronquée). 4,7 Mo de MP3 dans `apps/jeu/src/voix/`.
- **Volume égalisé** depuis l'audio brut, sans appel : jusqu'à 15 dB d'écart entre deux cris d'une même voix, ramenés à 6 dB au plus ; moyenne −17 dB, juste au-dessus des bruitages (−20 dB), pic à −1 dB (`enMp3Egalise`, `NIVEAU_CRI`). `pnpm repliques convertir tous --livrer` refait tout en quelques minutes.
- Défaut trouvé en jouant : quand une bulle attendait son tour, sa voix partait tout de suite. La voix part maintenant avec la bulle (`effetDeReplique`). Vérifié dans de vrais combats avec le groupe de base : 8 cris, 8 voix, chacune à 10 ms de sa bulle, la bonne race et le bon genre (« blessée » pour Ambrine la gnome).

## 04/11/2026 — Cris de combat : cohérence et moins de bavardage

- Retour de l'utilisateur après écoute : un cri doit coller à ce qui se passe (« s'il est grièvement blessé, il ne doit pas dire "Victoire" ; si un perso réussit son coup, il ne doit pas dire "Encore raté" »), et les personnages ne doivent pas parler tous en même temps.
- **Cohérence** : `convient` (état de celui qui parle : pas de victoire, de cri de guerre ni de triomphe sous le quart de ses PV ; « Aïe » seulement entre la moitié et le quart) et `rateVraiment` (un raté qui blesse quand même, comme l'Écorchure, n'est pas un raté ; « Encore raté » exige que la précédente attaque ait vraiment raté aussi).
- **Moins de bavardage** : au plus 2 répliques par round (la victoire passe toujours), 0,7 s de silence entre deux bulles, et un cri qui devrait attendre plus que sa limite (0,3 s pour les courants, 1,5 s pour les graves) n'est pas dit du tout (`ATTENTE_MAX`, `planifierBulle`). Le journal ne note que les cris vraiment dits.
- **Voix gardées pour les histoires** : `pnpm repliques dire <voix> "<texte>" --ton "…"` lit une phrase libre avec la voix d'une race (même timbre que les cris, débit ×1, pauses gardées). Les 18 timbres de `voix.json` ne changent pas.
- Vérifié dans un vrai combat avec le groupe de base : 6 cris en 4 rounds, jamais deux à la fois ; les deux « Encore raté ! » (Pip, Grukk) suivaient bien un premier raté du même héros. 591 tests verts.
- Piège rencontré : deux serveurs de développement (5173 et 5174) tournaient, et celui de 5173 servait un module d'avant mes modifications (« ATTENTE_MAX is not defined »). Arrêtés par leur numéro de processus puis relancés : un seul serveur.
