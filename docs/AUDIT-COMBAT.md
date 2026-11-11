# Audit du moteur de combat (11/11/2026)

Trois audits en lecture seule (règles du SRD, IA et équilibre, architecture et interface), puis vérification des constats dans le code. Les mesures d'équilibre viennent de `pnpm simuler` et `pnpm escarmouches` (IA contre IA, plus dur que pour un joueur humain).

## 1. Bugs corrigés le 11/11/2026 (test : `packages/regles/tests/combat-correctifs.test.ts`)

| # | Bug | Correction |
| --- | --- | --- |
| 1 | Un héros à 0 PV ne pouvait plus être attaqué | `adversairesCiblables` (`combat/etat.ts`) : un héros tombé reste une cible ; un coup au contact est un critique, et coûte 1 échec au jet contre la mort (2 sur un critique). L'IA ne le vise qu'à défaut d'adversaire debout (`ia.ts`, `choixCibles`). |
| 2 | La victoire n'arrivait qu'en fin de tour | `executer` (`cartes.ts`) vérifie la fin du combat après chaque commande. |
| 3 | Critique amélioré : un 19 touchait toujours | Seul le 20 naturel touche toujours ; un 19 est un critique s'il touche (`moteur.ts`) ; Bouclier peut parer un 19. |
| 4 | Aucun bonus au jet contre la mort | Bénédiction, Fléau et l'Inspiration bardique s'y appliquent (`moteur.ts`). |
| 5 | « S'échapper » ajoutait toujours la maîtrise | Bonus d'Athlétisme ou d'Acrobaties du combattant (`competences`, maîtrise comprise seulement si on l'a). |
| 6 | Attaque d'opportunité avec la première arme de corps à corps | L'arme (ou l'action de monstre) dont l'allonge atteint la cible. |
| 7 | Les monstres traversaient un héros inconscient | Une créature hostile bloque le passage, même inconsciente (`occupation`). |
| 8 | Plus de héros que de cases libres : plantage tardif | Erreur claire dans `preparerRencontre`. |

## 2. Fait le 11/11/2026 : les renseignements d'un ennemi

Pendant un combat, **cliquer un combattant** (hors choix de cible) épingle sa fiche dans la colonne : pour un monstre, ses **renseignements** (`apps/jeu/src/composants/RenseignementsMonstre.tsx`) : type, taille, FP, description, caractéristiques, sens, langues, défenses (résistances, immunités, vulnérabilités, états), capacités et actions avec leur coût. Un second clic ou Échap retire l'épingle ; le survol montre toujours la fiche du combattant survolé.

## 3. Pistes, par impact sur le plaisir de jeu

1. **Objectifs autres que tout tuer** : survivre N rounds, atteindre une case, tuer le chef, protéger un PNJ ; **renforts** qui arrivent vraiment à un round donné (`tactique.renforts` n'est aujourd'hui qu'un texte pour le conteur).
2. **Moral et reddition** : quand le chef tombe, les autres testent leur moral (`doitFuir` ne regarde que les PX perdus) ; une reddition raccourcit les combats longs (crypte, camp, col : 8 à 11 rounds mesurés ; cible 4 à 7).
3. **Difficultés fiables** : au niveau 5 les trois étiquettes donnent la même rencontre (catalogue d'escarmouches trop pauvre en FP 3 à 6) ; aux niveaux 1 à 3, les étiquettes ne sont pas monotones (crypte niv. 1 : faible 100 %, modérée 67 %, élevée 100 % ; embuscade élevée niv. 3 : 0 %). Ajouter 6 à 10 monstres et un test de régression (faible ≥ modérée ≥ élevée).
4. **Informer avant de cliquer** : pourcentage de toucher, CA de la cible, avantage ou désavantage, dégâts moyens (`situationAttaque` existe) ; intention ennemie (« X va viser Y »).
5. **IA plus fine** : cible selon la menace (dégâts, concentration, soigneur), soins préventifs, sorts de zone dès 2 ennemis ; carte « Défi » pour qu'un guerrier tienne une ligne.
6. **Terrain qui compte** : surprise au premier round, couvert aux trois quarts, zones de couvert visibles.
7. **Écarts SRD connus les plus visibles** (`AUDIT-REGLES-SRD.md` §7) : grandes créatures sur une case, 186 actions de monstre sans effet et souffles à une cible, Aider / Se cacher / Préparer / Lutte absents.

## 4. Fondations techniques

- **Sauvegarder le combat** dans la partie (état et graine) : il vit aujourd'hui dans React et sa graine vient de `Math.random` (`App.tsx`) ; un rechargement relance la rencontre avec un nouveau tirage.
- **Un seul bilan de combat** (`bilanCombat`) : PX et issue sont calculés dans `App.tsx`, `xp-combat.ts` et `exploration.ts`.
- **Protéger l'action du joueur** : `try/catch` autour de `jouer()` dans `Combat.tsx`.
- **Performance** : le plateau se redessine à chaque survol ; l'IA normale calcule sur le fil principal (≈ 5 s par combat de 10 rounds en simulation) ; touche « passer le tour ennemi ».
- **Accessibilité** : raccourcis 1 à 9 pour les cartes, Espace pour finir le tour, plateau au clavier, journal annoncé aux lecteurs d'écran.
- **Tests** : même graine = même combat, aller-retour JSON de l'état, groupe entièrement à terre, « 200 graines sans plantage ».

## Écarts mineurs relevés, non corrigés

Bouclier sans formation à l'armure ; résistance + vulnérabilité sans l'arrondi du SRD ; Boule de feu qui épargne son lanceur ; un seul jet de concentration pour une attaque à plusieurs dégâts ; ligne de vue (Bresenham) parfois asymétrique au coin d'un mur ; ramper à terre ne coûte pas double. (Sommeil qui épargne les alliés est conforme au SRD 5.2.1 : « créatures de votre choix ».)
