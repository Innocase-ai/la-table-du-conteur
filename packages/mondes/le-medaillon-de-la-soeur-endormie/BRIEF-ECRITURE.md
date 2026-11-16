# Brief d'écriture : Le Médaillon de la Sœur Endormie

Monde brouillon `le-medaillon-de-la-soeur-endormie` créé depuis la Forge d'Histoires. Le plan est **validé par l'utilisateur** : lieux, PNJ, objets, contenants, obstacles, quêtes, récompenses, liens. **On n'y change rien** (ni lieu, ni PNJ, ni DD, ni récompense, ni quête) sans son accord. Il reste à écrire les textes marqués « À écrire » : 37 champ(s) dans 16 fiche(s).

## Contexte

- Niveaux du groupe : 1 à 2. Épisode court d'une saga (docs/PRD-SAGA.md) : lieu de départ dense, 3 à 8 quêtes dont une principale.
- Accroche : Une lenteur mauvaise s’est glissée sous les toits de Villambrune : la nuit, on entend gratter les cercueils…

## À lire avant d'écrire

- `packages/mondes/le-medaillon-de-la-soeur-endormie/RAPPORT-FORGE.md` : ce qui a été deviné, la table des références de la Forge (L1, P3…) vers les identifiants du monde.
- `packages/mondes/le-medaillon-de-la-soeur-endormie/conception.forge.json` : la conception d'origine (descriptions et répliques saisies dans la Forge : à reprendre et réécrire, pas à jeter).
- Les fichiers du monde : `monde.json`, `lieux/`, `pnj/`, `objets/`, `tresors/`, `pieges/`, `rencontres/`, `quetes/`, `evenements/`, `fins/` (fichiers `forge-*.json`).
- `docs/ECRIRE-UNE-HISTOIRE.md`, `docs/FORGE.md`, `docs/MONDES.md` (format) ; skills `creer-monde`, `decrire-lieux`, `creer-personnages`, `creer-pieges-tresors`, `creer-rencontres`.

## Règles d'écriture

- Deuxième personne du pluriel, présent, phrases courtes. Un détail sensoriel concret par texte et un détail inattendu. Pas de lore déguisé en dialogue. Finir sur une question ou un coût.
- Longueurs : récit d'arrivée d'un lieu 130 à 170 mots ; accroche d'une pièce vue du dehors 1 à 2 phrases ; réponse d'un PNJ 75 à 115 mots ; mise en scène d'une rencontre 70 à 110 mots ; journal de quête 2 à 3 phrases ; objet ou contenant 1 à 2 phrases.
- Interdits dans les textes lus par le joueur : mot de mécanique (DD, jet, jauge, points de vie, niveau), secret, contenu caché. Accents français corrects.
- Chaque PNJ veut quelque chose (du groupe aussi), craint quelque chose, cache quelque chose, a une voix (un tic, un rythme).

## Méthode (décisions du projet)

1. **Les textes sont écrits par des agents Haiku** (un par groupe de fiches : lieux, PNJ, rencontres et quêtes, objets et contenants), chacun avec ces règles, les fiches concernées et leur voisinage (lieu, PNJ du lieu, quête liée). Claude relit et arbitre ; il ne réécrit pas à leur place.
2. Chaque agent remplace **uniquement** les valeurs « À écrire : … » (le chemin du champ est donné ci-dessous) et ne touche à rien d'autre.
3. Avant de présenter quoi que ce soit : `pnpm monde valider le-medaillon-de-la-soeur-endormie`, puis le sous-agent `auditeur-coherence-histoire` (lecture seule) pour la cohérence, et vérifier soi-même ses anomalies.
4. **L'utilisateur valide chaque groupe de textes** (lieux, puis PNJ, puis quêtes…) avant qu'on le considère comme gelé.
5. À la fin : `pnpm monde verifier le-medaillon-de-la-soeur-endormie`, `pnpm monde parcours le-medaillon-de-la-soeur-endormie`, aucune occurrence de « À écrire » ne doit rester (`grep -r "À écrire" packages/mondes/le-medaillon-de-la-soeur-endormie`), entrée dans `docs/JOURNAL.md`. Ne rien commiter sans l'accord de l'utilisateur ; images, voix et appels d'API : annoncer le coût d'abord.

## Points laissés à la main par la Forge

- Arme « Épée de fer » (O2) : aucune arme du SRD reconnue dans le nom ; l'objet est « divers ». Choisir l'arme de base (champ « base », catégorie « arme »), ou la remplacer par un objet du catalogue.
- Rencontre « Goule des cryptes » (P6) : difficulté moderee (lue dans « Modéré »).
- Rencontre « Bandit estropié » (P7) : difficulté faible (lue dans « Facile »). Adversaire humanoïde : une alternative « Négocier » (Persuasion DD 12) est prête, texte et effets à écrire.
- Prêtre « Frère Anselme » (P4) : le service de soins n'a pas d'effet de jeu (effets à écrire).
- 2 quête(s) : le cap du 15/11/2026 en veut 3 à 8 (docs/PRD-SAGA.md, F3).
- Espèce, sexe, apparence et personnalité des PNJ : valeurs provisoires (`humain`, `N`, `à définir`) à remplacer en même temps que leurs textes.
- `ton` de `monde.json` : `à définir`, à écrire avec l'utilisateur.

## Inventaire des champs à écrire

### lieux (22)

- **Le Médaillon de la Sœur Endormie** (`le-medaillon-de-la-soeur-endormie`, lieux/forge-lieux.json)
  - `visuel` : À écrire : la région vue de loin.
- **Villambrune** (`villambrune`, lieux/forge-lieux.json)
  - `resume` : À écrire : résumé de Villambrune.
  - `description` : À écrire : ce qu'on trouve à Villambrune (factuel, pour le MJ).
  - `visuel` : À écrire : ce qu'on voit de Villambrune, sans nommer de personnage.
- **Demeure du Sire Bertrand** (`demeure-du-sire-bertrand`, lieux/forge-lieux.json)
  - `resume` : À écrire : résumé de Demeure du Sire Bertrand.
  - `description` : À écrire : ce qu'on trouve à Demeure du Sire Bertrand (factuel, pour le MJ).
  - `visuel` : À écrire : ce qu'on voit de Demeure du Sire Bertrand, sans nommer de personnage.
- **Le Sanglier Doré** (`le-sanglier-dore`, lieux/forge-lieux.json)
  - `resume` : À écrire : résumé de Le Sanglier Doré.
  - `description` : À écrire : ce qu'on trouve à Le Sanglier Doré (factuel, pour le MJ).
  - `visuel` : À écrire : ce qu'on voit de Le Sanglier Doré, sans nommer de personnage.
- **Sanctuaire de sainte Odile** (`sanctuaire-de-sainte-odile`, lieux/forge-lieux.json)
  - `resume` : À écrire : résumé de Sanctuaire de sainte Odile.
  - `description` : À écrire : ce qu'on trouve à Sanctuaire de sainte Odile (factuel, pour le MJ).
  - `visuel` : À écrire : ce qu'on voit de Sanctuaire de sainte Odile, sans nommer de personnage.
- **Chaumière de la vieille Mahaut** (`chaumiere-de-la-vieille-mahaut`, lieux/forge-lieux.json)
  - `resume` : À écrire : résumé de Chaumière de la vieille Mahaut.
  - `description` : À écrire : ce qu'on trouve à Chaumière de la vieille Mahaut (factuel, pour le MJ).
  - `visuel` : À écrire : ce qu'on voit de Chaumière de la vieille Mahaut, sans nommer de personnage.
- **Ruines de la chapelle brûlée** (`ruines-de-la-chapelle-brulee`, lieux/forge-lieux.json)
  - `resume` : À écrire : résumé de Ruines de la chapelle brûlée.
  - `description` : À écrire : ce qu'on trouve à Ruines de la chapelle brûlée (factuel, pour le MJ).
  - `visuel` : À écrire : ce qu'on voit de Ruines de la chapelle brûlée, sans nommer de personnage.
- **Bois des Chênes Pâles** (`bois-des-chenes-pales`, lieux/forge-lieux.json)
  - `resume` : À écrire : résumé de Bois des Chênes Pâles.
  - `description` : À écrire : ce qu'on trouve à Bois des Chênes Pâles (factuel, pour le MJ).
  - `visuel` : À écrire : ce qu'on voit de Bois des Chênes Pâles, sans nommer de personnage.

### pnj (12)

- **Sire Bertrand** (`sire-bertrand`, pnj/forge-pnj.json)
  - `apparence` : À écrire : le portrait et la tenue de Sire Bertrand.
  - `personnalite.desir` : À écrire : ce que Sire Bertrand veut.
  - `sujets[1].reponse` : À écrire : la réponse de Sire Bertrand quand le groupe revient (Le médaillon volé).
- **Jorane la ménestrière** (`jorane-la-menestriere`, pnj/forge-pnj.json)
  - `apparence` : À écrire : le portrait et la tenue de Jorane la ménestrière.
  - `personnalite.desir` : À écrire : ce que Jorane la ménestrière veut.
- **Maître Foulques** (`maitre-foulques`, pnj/forge-pnj.json)
  - `apparence` : À écrire : le portrait et la tenue de Maître Foulques.
  - `personnalite.desir` : À écrire : ce que Maître Foulques veut.
- **Frère Anselme** (`frere-anselme`, pnj/forge-pnj.json)
  - `apparence` : À écrire : le portrait et la tenue de Frère Anselme.
  - `personnalite.desir` : À écrire : ce que Frère Anselme veut.
- **Vieille Mahaut** (`vieille-mahaut`, pnj/forge-pnj.json)
  - `apparence` : À écrire : le portrait et la tenue de Vieille Mahaut.
  - `personnalite.desir` : À écrire : ce que Vieille Mahaut veut.
  - `sujets[1].reponse` : À écrire : la réponse de Vieille Mahaut quand le groupe revient (Herbes pour la soupe).

### tresors (1)

- **Sur place à Bois des Chênes Pâles** (`sol-bois-des-chenes-pales`, tresors/forge-tresors.json)
  - `description` : À écrire : ce qui traîne ici et que l'œil attrape.

### rencontres (1)

- **Bandit estropié** (`r-bandit-estropie`, rencontres/forge-rencontres.json)
  - `alternatives[0].resume` : À écrire : comment Bandit estropié se laisse convaincre de renoncer.

### fins (1)

- **Fin de « Le Médaillon de la Sœur Endormie »** (`fin-le-medaillon-vole`, fins/forge-fins.json)
  - `epilogue` : À écrire : l'épilogue, une fois « Le médaillon volé » terminée.


## Suivi de l'écriture (16/11/2026)

- Lieux (récits d'arrivée, accroches, résumés, descriptions, visuels, textes des chemins) : **validé par l'utilisateur le 16/11/2026**.
- PNJ (espèce, apparence, personnalité, salutations amicales, sujets, service de Frère Anselme) : **validé le 16/11/2026** ; la pièce d'argent de Mahaut est retirée (le jeu ne compte que des pièces d'or entières).
- Rencontres (mises en scène, négociation du bandit), étapes de quête, fin (nom, épilogue, conséquences), trésor du bois, ton et direction artistique (`monde.json`) : **validés par l'utilisateur le 16/11/2026**.
- Réglages mécaniques faits au passage : épée de fer = épée longue du SRD (15 po) ; potion de soin = effets de la potion de guérison du catalogue (au prix de 8 po de l'auteur) ; brioche = nourriture.
- Décidé le 16/11/2026 : la brioche d'avoine reste dans l'armoire de Mahaut ET en récompense de sa quête (doublon accepté).
- Reste : images, voix, scènes, estimation (`pnpm monde estimer`) : à annoncer et à valider avant toute dépense.
