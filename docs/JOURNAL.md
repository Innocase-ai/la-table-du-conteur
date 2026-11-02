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
