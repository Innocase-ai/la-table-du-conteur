---
name: creer-contrats
description: Écrire des contrats de combat pour « La Table du Conteur » : de petites quêtes dont le but est un combat court, variées et ancrées dans la fiction (embuscade de nuit, nid à nettoyer, traque, défense d'un lieu, client qui ment, convoi, duel, avec ou sans issue pacifique). À utiliser quand l'utilisateur veut « des petites quêtes de combat », « plus de combats », « des contrats », « des chasses », « de l'action dans le hub », « une heure sans combat, c'est monotone », ou quand on remplit un monde en rencontres avec un PNJ qui demande un service violent. Complète `creer-rencontres` (le format d'une rencontre) et `creer-dilemmes` (le contrat truqué).
---

# Écrire des contrats de combat

Un **contrat** est une mini-quête (10 à 15 minutes) dont le combat est le but, mais jamais la seule raison : un PNJ a **un vrai problème**, le combat est le moyen, la suite en dépend. Il sert le rythme : le joueur **choisit** de l'accepter, donc personne n'a de combat toutes les cinq minutes ; mais une heure ne doit plus passer sans en rencontrer un.

## Le test qui décide
Retirez la récompense : le PNJ a-t-il encore une raison de demander ? Sinon, c'est un tableau d'affichage, pas un contrat. Chaque contrat a :
- **un PNJ avec un désir ou une peur** (vu dans ses fiches), qui en parle dans un sujet de conversation ;
- **une raison de fiction liée au monde** (la marée, les noyés, la cendre), pas « 10 rats à tuer » ;
- **une récompense qui n'est pas seulement de l'or** : réputation de faction, attitude du PNJ, un fait ou un secret, un objet utile, un passage ouvert, un allié.

## Les formes (voir `references/formes.md` pour le détail de chacune)

| Forme | En une ligne | Faisabilité |
| --- | --- | --- |
| **Embuscade** | Le PNJ sait où et quand ; la rencontre se déclenche au repos ou sur place. Le groupe attend ou prévient la cible. | Données seules |
| **Nid à nettoyer** | 2 ou 3 petits combats dans des salles successives, un chef au bout ; enfumer, murer, négocier. | Données seules |
| **Traque** | Indices (faits à plusieurs sources), puis la rencontre : une petite enquête qui finit par un combat. | Données seules |
| **Défense** | Deux rencontres enchaînées (l'arrivée, puis l'assaut) ; ce qu'on protège dépend du résultat. | Données seules |
| **Le client ment** | La cible a de bonnes raisons ; le groupe découvre la vérité en chemin, puis un **dilemme** (tuer, épargner, trahir le client). | Données + `dilemmes/` |
| **Issue pacifique** | Une alternative sans combat vraiment différente (payer, persuader, détourner). | Données seules |
| **Convoi** | Le PNJ est escorté (`escorte`) avec embuscades sur la route et échec si la jauge du monde monte trop haut. | **Partiel** : on ne protège pas un allié *dans* le combat (il n'est pas ciblé) |
| **Duel** | Un adversaire fort, avec défi, refus ou paiement. | **Partiel** : le combat engage toujours le groupe entier |

## Règles de variété
- **Jamais deux contrats de même forme à la suite** dans un hub ; au moins 3 formes différentes sur 4 contrats.
- **Un contrat sur trois** a une issue sans combat vraiment différente (pas « les convaincre » seulement : une vraie voie, avec un prix) ; **un sur quatre** est truqué (le client cache quelque chose).
- **Calibrage** : début de partie `faible` ou `moderee`, 2 à 3 monstres, 3 à 5 minutes ; pas de combat « élevée » dans un contrat ordinaire.
- **Placement** : 2 ou 3 contrats accessibles dans les **20 premières minutes**, les autres plus tard et plus loin ; pas tous au même PNJ.
- **Pas de contrat sans enjeu** : ce qui arrive si on refuse (un PNJ blessé, une jauge qui monte, une porte qui reste fermée) doit se voir.

## Le gabarit d'un contrat complet (six pièces)
*Contrat offert en scène* : quand le client est rencontré en chemin (un marchand assailli, un voyageur piégé) plutôt qu'au hub, la pièce 1 devient un **événement à choix** écrit en « scène à appel » (`creer-evenements-choix`) dont le choix « L'aider. » pose `quete: active` (donc pas de bouton « Accepter ») ; les pièces 2 à 6 ne changent pas.
1. **Le sujet du PNJ** (`pnj/…`) : `mots`, `question` (3 à 12 mots, vouvoiement), `reponse` (ce que le PNJ dit : son problème, avec un vrai détail), `effets` `[{ "quete": { "id": "q-…", "statut": "proposee" } }]`. Le joueur accepte dans le Journal (« Accepter : … »).
2. **La quête** (`quetes/…`) : `type: "secondaire"`, `donneur`, `lieu`, `niveau`, `resume`, `etapes` (au moins l'étape « le combat » dont la `completion` est un drapeau, et si possible une étape de retour au PNJ), `recompenses` (xp, pièces, objets, effets de réputation). Une étape `echec` ou une variante (`ramifications`) pour le refus ou la trahison. Noter la forme dans `ramifications` : « forme : traque ».
3. **La rencontre** (`rencontres/…`) : voir `creer-rencontres`. `effetsVictoire` : `[{ "flag": "…-fait" }, …]` ; chaque alternative qui règle la rencontre pose le **même drapeau** (sinon la quête reste bloquée).
4. **Le rattachement** au lieu : `{ "id": "…", "declencheur": "entree" | "repos" | "exploration", "condition": { "quete": { "id": "q-…", "statut": "active" } }, "unique": true }` : la rencontre n'apparaît qu'une fois la quête acceptée.
5. **Le PNJ de retour** (facultatif) : un sujet conditionné par le drapeau (réaction, récompense, secret).
6. **Les variantes de fiction** : une salutation variable du PNJ après le contrat (`salutations.variantes`), un épilogue.

## Produire un lot de contrats
1. **Lire** : les PNJ du hub (désirs, peurs, `lieu`), la BIBLE du monde, les lieux et rencontres existants (`pnpm monde valider` pour l'état).
2. **Concevoir moi-même** (Claude) la liste : PNJ, problème, forme, enjeu, récompense, ids exacts, rattachement. Les ids sont la cause n°1 d'erreurs : les écrire dans le brief, jamais les laisser à l'agent.
3. **Faire écrire par des agents Haiku** (texte et JSON) avec `references/brief-agent.md` : un agent par contrat ou par zone, qui écrit seulement ses fichiers `z<n>-contrats.json`.
4. **Relire** chaque contrat : le problème tient-il sans la récompense ? les alternatives sont-elles vraiment différentes ? le drapeau est-il posé par toutes les issues ?
5. **Valider et jouer** : `pnpm monde valider <monde>` (0 erreur), `pnpm monde estimer <monde>`, un test qui joue le contrat (accepter, déclencher, résoudre par chaque issue, vérifier l'étape et la récompense), puis dans le navigateur.

## Pièges connus
- **Un lieu verrouillé ou à passage secret ne convient pas pour un contrat du hub** : vérifier ses `liens` (`verrou`, `cache`) avant de le choisir (premier essai : les caveaux de la Citadelle exigent la clé d'une autre quête, le contrat a dû descendre à l'intendance). Le test du contrat doit **atteindre le lieu par les passages du jeu**, pas en posant `etat.lieu`.
- Après avoir parlé à un PNJ, la scène est `dialogue` : `quitterDialogue` avant de se déplacer dans un test.
- Une alternative qui règle la rencontre mais **ne pose pas le drapeau** de la quête : le joueur a réussi et la quête reste bloquée. Tester chaque issue.
- Un contrat rattaché à un lieu **sans condition** se déclenche même sans la quête : toujours conditionner sur la quête (`active`).
- Le hub trop riche en contrats « va tuer » : voir les règles de variété.
- Une rencontre `repos` n'arrive que si le groupe se repose dans le lieu : dire au joueur **où** dormir (le PNJ l'indique dans son sujet). Une simple **halte** (repos court) la déclenche aussi, même dans un lieu `dangereux` : pas besoin de rendre le lieu sûr.
- **Un contrat accepté dans le lieu même du combat** (le donneur est sur place) ne peut pas se déclencher à `entree` : le groupe y est déjà. Utiliser `repos` (veille, défense) ou une rencontre dans un autre lieu.
- **Contrat de l'auberge, du tableau, du camp** : le contrôle `pnpm monde manque` reconnaît un contrat à son nom ou à `ramifications` qui commence par « Forme : … » : toujours l'écrire ainsi.
- **Tester le contrat** : l'histoire s'ouvre sur un combat (la place de Lame-Rousse) ; un test doit d'abord le résoudre (`reglerRencontre`, issue `victoire`) pour retrouver l'exploration. Modèle : `packages/regles/tests/contrats-ombresang.test.ts`.
- Une défense en deux vagues enchaîne par l'effet `{ "rencontre": "<id>" }` (victoire **et** alternative de la première) ; la seconde rencontre n'est **pas** rattachée au lieu.
