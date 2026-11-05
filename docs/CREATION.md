# Créateur de personnage — M3a

Création de personnage dans l'esprit de Baldur's Gate : des écrans courts, une liste de choix à gauche et une description à droite, un bouton **Recommandé** partout, une **Création rapide**. Pas de personnalisation physique (couleurs, visage) : le portrait se choisit dans une galerie.

## Les 8 écrans

| # | Écran | Choix |
| --- | --- | --- |
| 1 | Espèce | Espèce, taille si elle est au choix, lignage / ascendance / héritage, don d'origine de l'humain |
| 2 | Classe | Classe (12), niveau de départ (1 à 5) ; **Création rapide** |
| 3 | Historique | Historique (4) ; sorts du don Initié à la magie quand il est accordé |
| 4 | Caractéristiques | Valeurs standard, achat de points (27) ou tirage 4d6 ; bonus d'historique ; améliorations (niveau 4) |
| 5 | Choix de classe | Compétences, expertises, style de combat, options de classe, bottes d'arme, sorts, équipement |
| 6 | Alignement | 9 alignements |
| 7 | Nom et portrait | Nom, sexe, portrait de la galerie, ligne de caractère facultative |
| 8 | Récapitulatif | Fiche complète et enregistrement dans le groupe |

## Principe : le moteur décide

- `calculerFiche` (packages/regles/src/fiche.ts) valide les choix et calcule la fiche.
- `exigences` et `manquants` (src/creation/exigences.ts) disent ce qu'il reste à choisir, écran par écran : « Suivant » est permis quand rien ne manque pour l'écran.
- `recommandations.ts` fournit les valeurs du bouton Recommandé : répartition standard de la classe (table du SRD p. 22), historique et bonus adaptés, compétences usuelles, sorts jouables en combat d'abord, équipement de l'option A. Toute recommandation est validée comme un choix du joueur. Test : les 12 classes × 9 espèces × 5 niveaux (540 personnages) sont valides.
- `groupe.ts` : le groupe de 6 (format JSON versionné, validé par Zod), les conseils de composition (jamais bloquants) et le **groupe conseillé** (Bran, Hilda, Pip, Sylvaine, Ambrine, Grukk).
- `kit.ts` : du personnage au combattant (armes, bottes, sorts jouables, potion).

## Ce que le créateur couvre

- **Données** : 12 classes (niveaux 1 à 5, une sous-classe chacune), 9 espèces, 4 historiques, 17 dons, **181 sorts de niveaux 0 à 3** pour les 8 classes lanceuses, armes, armures.
- **Choix modélisés** : lignages et ascendances des espèces (résistances, vision, Vitesse, sorts accordés), ordre divin, ordre primitif, manifestations occultes, métamagie, style de combat, expertises (avec liste restreinte pour l'Érudition du Magicien), compétences supplémentaires, bottes d'arme (règles par classe), équipement de départ (options A/B, objets du SRD reconnus comme armes ou armures).
- **Combat** : les personnages créés se battent avec leurs armes, leurs bottes d'arme et leurs sorts. Arts martiaux du Moine, coup de poing sans arme, Attaque supplémentaire (niveau 5).

## Simplifications assumées

- **Sorts jouables en combat** : 25 sorts sur 181 (liste `SORTS_JOUABLES_EN_COMBAT`). Les autres figurent sur la fiche, marqués « non jouable en combat ». La liste s'agrandit au fil des sorts codés.
- **Initié à la magie** (historiques Acolyte et Sage) : sorts choisis et affichés sur la fiche, pas encore lançables en combat.
- **Kit de départ allégé** (décision du 05/11/2026, `allegerKit` dans `creation/equipement.ts`) : le SRD donne le kit de classe (3 à 8 objets) plus celui de l'historique (5 à 7), un sac d'armes. Le jeu garde l'armure, le bouclier, les outils et le paquetage, mais **deux armes** au plus par classe (l'arme principale et la première arme de jet ou de tir qui suit, ou la deuxième), les munitions seulement avec une arme de tir ou de jet gardée, et **aucune arme venant de l'historique** (lance et arc court du Soldat, dagues du Criminel). **Le prix des armes retirées s'ajoute à l'or de départ** : le reste est à acheter. L'or de départ des fiches forme la **bourse du groupe** au début de l'histoire (commande `commencer`). Un guerrier-soldat passe de 6 armes à 2 (+36 po).
- **Pas d'option « or »** à la place de l'équipement.
- **Choix de langues et d'outils** : ni demandés ni calculés.
- **Grimoire du Magicien** : traité comme les autres classes (sorts préparés choisis dans la liste de classe).
- Une seule sous-classe par classe (celle du SRD), donc pas de choix de sous-classe.
- **Portraits** : la galerie compte 54 entrées (9 espèces × 2 sexes × 3) ; les images seront générées avec M2, en attendant des tuiles d'attente.
- Un personnage reste au niveau où il a été créé (pas de montée de niveau en jeu pour l'instant).

## Pour la suite (M3b)

« Décris ton personnage en une phrase » : un sous-agent propose des choix, le moteur les valide avant de les montrer. Demande un serveur et une clé Anthropic.
