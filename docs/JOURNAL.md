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
