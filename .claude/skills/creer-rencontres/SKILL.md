---
name: creer-rencontres
description: Écrire, régler ou relire les rencontres d'un monde de « La Table du Conteur » : combats, négociations, scènes sociales ou d'exploration, embuscades, déclencheurs (entrée, repos, fouille, aléatoire, effet), difficulté et budget de PX, alternatives sans combat, prix d'un jet raté, cartes tactiques, rythme de l'histoire. À utiliser dès qu'on crée ou modifie une rencontre, qu'on veut « plus de combats », « un combat dans cette salle », « une embuscade », « une rencontre sociale », qu'on règle la difficulté, ou que le validateur signale un avis de rythme, de tension ou de jet sans prix. Pour les mini-quêtes de combat, voir aussi `creer-contrats`.
---

# Écrire les rencontres d'un monde

Une **rencontre** est une fiche de données (`rencontres/<zone>.json`) que le moteur met en scène à un moment précis : le jeu passe alors en scène de rencontre et propose des boutons (*Combattre* si elle a des monstres, ses alternatives, *Se replier* ou *Passer son chemin*). **Le moteur tranche** (cartes, grille, jets) ; le conteur IA ne décide jamais d'un combat ni de son issue. Schéma qui fait foi : `RencontreMonde` dans `packages/regles/src/monde/schemas.ts`.

## 1. Choisir le type

| Type | Quand | Particularités |
| --- | --- | --- |
| `combat` | Un affrontement | Monstres + carte tactique + `terrain`. Au moins une alternative si « élevée ». |
| `mixte` | Combat qu'on peut éviter ou dénouer | Monstres ET alternatives (négocier, payer, ruser). Le plus riche : une taverne qui dégénère, une porte gardée. |
| `social` | Négociation, procès, audience | Sans monstres, sans carte. Les alternatives sont l'histoire : sans elles, ce n'est qu'un récit (faite aussitôt). |
| `exploration` | Obstacle ou chronomètre | Sans monstres : un passage à franchir, une marée qui monte, un éboulis. |

Règle de rythme : **au moins 20 % de rencontres sans combat** (`social`, `exploration`) et **au moins 3 « élevée »** pour les temps forts (le validateur avertit). Une zone sans aucun combat à moins de quelques lieux de son entrée donne des heures monotones : place au moins un combat accessible tôt.

## 2. Choisir le déclencheur

Les rencontres se rattachent à un **lieu** (`lieux/*.json`, champ `rencontres: [{ id, declencheur, condition?, unique }]`) ou arrivent par un **effet** `{ "rencontre": id }`.

| Déclencheur | Quand |
| --- | --- |
| `entree` | À l'arrivée dans le lieu (défaut). |
| `exploration` | Après une fouille du lieu (« on a fait du bruit »). |
| `repos` | Quand le groupe se repose (halte ou nuit) : embuscade nocturne. Un lieu `repos: sur` autorise la nuit, `dangereux` une halte, `impossible` rien. |
| `aleatoire` | Une chance sur trois à l'arrivée ou au repos (jamais pendant une fouille). |
| effet `rencontre` | Posé par un événement, un sujet de dialogue, un piège, un échec d'énigme, une étape de quête : elle se joue à la fin de l'action en cours. |

`unique: true` (défaut) : une seule fois. `unique: false` : répétable (lieu dangereux). `condition` : un drapeau, une quête, un PNJ, la jauge, l'argent (`{ "pieces": { "min": 100 } }`).

## 3. Régler la difficulté

- `difficulte` : `faible`, `moderee`, `elevee`, d'après le budget de PX du SRD **pour 6 héros** (`BUDGET_PX` dans `packages/regles/src/budget.ts` : par personnage, niveau 1 : 50/75/100 ; niveau 2 : 100/150/200 ; niveau 3 : 150/225/400 ; niveau 4 : 250/375/500 ; niveau 5 : 500/750/1100 ; multiplier par 6). Le validateur compare.
- Début de partie : « faible » ou « modérée », 2 à 3 monstres au plus. Une rencontre « élevée » est un moment fort (boss, embuscade, finale).
- **Monstres** : **obligatoirement** les profils du moteur, `packages/donnees/srd/monstres/` (329 : tout le SRD) ; une histoire n'invente aucun monstre ni aucune image de monstre (un boss est un profil du catalogue avec un nom et des textes propres). Liste dans la BIBLE du monde, §9.
- **Défaite** : l'histoire continue. Huit heures plus tard, les héros tombés se relèvent à 1 PV (les autres gardent les leurs), délestés de la moitié de l'or ; la rencontre les attend toujours.
- **PX** : ceux d'un combat se partagent entre les héros ; l'XP des quêtes et effets est celle de chacun. Le monde entier doit rapporter assez de PX pour atteindre son niveau maximum (avis « PX »).

## 3 bis. Le butin (un combat gagné rapporte quelque chose)
- `butin.tables` : des tables de `tables/` (entrées pondérées : pièces `{des, unite}`, objet du SRD ou du monde avec `quantite`, `rien`) ; chaque victoire en tire une entrée par table, versée au sac, avec un constat « Butin : … ». Adapter à l'ennemi (noyés : poches, offrandes ; bandits : bourse, armes ; rats : grain, corde) ; un combat « élevée » mérite une table plus riche (potion, parchemin de sort, eau bénite) et peu ou pas de `rien`.
- `butin.tresors` : la réserve de l'ennemi. Sans verrou ni piège et dans le lieu du combat, elle est prise à la victoire ; sinon elle est révélée.
- **Dépouilles automatiques** : le moteur donne déjà à chaque adversaire vaincu une bourse et du matériel selon son type SRD et son FP (humanoïde : bourse et matériel ; mort-vivant : vieilles pièces ; bête, artificiel : presque rien ; `monde/depouilles.ts`). Pas besoin d'écrire ces gains ; les tables de la rencontre ne servent qu'à la **saveur de l'histoire** (un objet précis, une relique). `butin.depouilles: false` les supprime (rixe, duel).
- Un combat sans aucun butin (`depouilles: false`, ni table ni réserve) est signalé (avis « Butin »).

## 4. Écrire les issues (alternatives)

- Toute rencontre importante a **au moins deux issues vraiment différentes** (pas « combattre ou fuir ») et un **enjeu** (ce qu'on gagne, ce qu'on perd).
- Tout combat « élevée » a une **issue de repli** (négocier, se rendre, ruser, payer), sinon le groupe n'a que la fuite.
- Une alternative a : `id`, `nom` (une phrase à la 1re personne : « Je lui réponds dans le langage des contrebandiers. »), `jet` optionnel `{ competence, dd }` (DD 10 facile, 13 moyen, 15 difficile), `condition` optionnelle (un objet, un fait, de l'argent), `resume` (ce qui se passe), `effets`.
- **Un échec fait avancer** : une alternative avec `jet` dans une rencontre **sans monstres** porte `echec` (liste d'effets : le prix) et `echecResout: true` (la rencontre se dénoue quand même, plus cher). Avec `echecResout: false`, le groupe reste dans la scène et peut tenter autre chose (l'issue ratée ne se retente pas). Le validateur signale un jet raté qui ne coûte rien.
- **Payer** : une alternative qui coûte de l'argent porte la condition `{ "pieces": { "min": N } }` (sinon le coût est gratuit : l'argent ne descend pas sous 0).
- Une rencontre finale qui **lit le parcours** (un drapeau, un choix de dilemme) vaut mieux qu'une embuscade identique quoi qu'il arrive.

## 5. Les cartes tactiques (combat, mixte)

`carte` : lignes de texte de même longueur. `.` sol, `#` mur, `~` terrain difficile, `H` départ des héros (au moins 6), `m` départ des monstres (au moins autant que de monstres), éléments : `e` eau, `b` boue, `T` arbre, `R` rocher, `r` rocher bas, `t` tronc, `c` caisse (couvert : +2 CA). `terrain` : `foret`, `souterrain`, `caverne` ou `camp` (ambiance du plateau). `tactique` (doctrine, fuite, renforts) **n'est pas encore lu par le moteur** (`docs/MONDES.md`) : c'est une note pour le MJ, pas un réglage de l'IA. Il faut un `H` par héros (6) et un `m` par monstre : sinon le combat prend les cases manquantes sur le sol le plus proche des cases marquées (le validateur le signale par un avis). Voir `docs/PLATEAUX.md`.

## 6. Écrire le texte

`intro` : la mise en scène lue par le joueur (2 à 4 phrases, au présent, sans révéler ce qu'il n'a pas appris). Libellés des alternatives à la 1re personne. Sobre, concret, dans le ton du monde. Pour beaucoup de rencontres, confier le texte à des agents **Haiku** avec un brief précis (voir `creer-monde/references/textes-en-serie.md`) et relire.

## 7. Vérifier

`pnpm monde valider <monde>` (0 erreur ; avis « Rythme », « Tension », « un jet raté ne coûte rien », « sans autre issue »), puis jouer la rencontre dans le jeu. Tests : un test du moteur qui joue le déclencheur (modèles : `packages/regles/tests/audit.test.ts`, `epique.test.ts`). Après un changement de monde : `pnpm monde estimer <monde>` (un test exige `estimation.json` à jour).

## Pièges connus
- Rien n'est aléatoire par défaut : sans `aleatoire`, `repos` ou rencontres répétables, on peut errer longtemps sans combattre.
- Un jet raté dans une rencontre à monstres relance la scène (le combat attend) ; sans monstres, prévoir `echecResout`.
- `unique` évite qu'un combat se rejoue en revenant dans le lieu ; une rencontre déclenchée par un effet n'est pas limitée par le lieu.
