# Les formes de contrat, une par une

Pour chaque forme : l'idée, comment l'écrire avec les données du moteur, une variante sans combat, un piège. Les identifiants sont des exemples. Le format d'une rencontre et de ses alternatives : skill `creer-rencontres` ; d'un dilemme : `creer-dilemmes`.

## 1. Embuscade de nuit
**Idée** : le PNJ sait que des voleurs (ou des noyés, des pillards) viennent la nuit ; il demande qu'on les attende. Le groupe peut dormir dans le piège, ou prévenir les cibles.
**Données** : rencontre `combat` ou `mixte` rattachée au lieu avec `declencheur: "repos"` et `condition` = quête active ; le lieu a `repos: "dangereux"` ou `"sur"` (le groupe doit pouvoir dormir ou faire halte). Le sujet du PNJ dit **où** dormir.
**Sans combat** : une alternative « les surprendre et négocier » (jet d'intuition ou de discrétion), « leur laisser la marchandise » (coût).
**Piège** : si le lieu est `impossible` pour le repos, la rencontre n'arrive jamais.

## 2. Nid à nettoyer
**Idée** : une cave, une grotte, une cale infestée ; le chef est au fond.
**Données** : 2 ou 3 petites rencontres `entree` dans des salles successives (chacune `faible`), un chef `moderee` à la dernière ; la victoire du chef pose le drapeau d'étape. Les salles ont un trésor modeste.
**Sans combat** : enfumer (jet de survie), murer l'entrée (jet d'athlétisme), négocier avec le chef (`mixte` : il demande un prix).
**Piège** : trois salles de rats qui se ressemblent ; varier les monstres et les cartes.

## 3. Traque
**Idée** : une petite enquête ; on cherche une bête, un voleur, un déserteur, puis on l'affronte.
**Données** : 2 ou 3 faits (`faits/`) à plusieurs sources (un PNJ, un lieu à fouiller avec DD, un objet) ; l'étape suivante a pour `completion` `{ "fait": "…" }` ; la rencontre (`mixte`) a pour condition le dernier fait.
**Sans combat** : « le convaincre de se rendre » avec les faits comme arguments (condition sur le fait).
**Piège** : un seul fait derrière un jet : un échec bloque la quête. Toujours trois sources.

## 4. Défense d'un lieu
**Idée** : on prévient l'assaut, on tient la porte, on protège un entrepôt.
**Données** : deux rencontres enchaînées sur le même lieu (la première `entree` ou effet, la seconde posée par l'effet de victoire de la première : `{ "rencontre": "…" }`) ; ce qui est protégé dépend du résultat (jauge, attitude du PNJ, boutique ouverte).
**Sans combat** : fortifier avant l'assaut (jet) pour que la seconde rencontre soit `faible`.
**Piège** : le joueur ne sait pas combien de temps ça dure ; l'annoncer (« deux vagues »).

## 5. Le client ment
**Idée** : la cible a de bonnes raisons ; le client cache quelque chose. Le contrat devient un choix.
**Données** : la rencontre est `mixte` ; avant ou après, un fait révèle la vérité (trois sources) ; un **dilemme** (`quand`: le fait appris + quête active) propose : exécuter (le client te doit), épargner (la cible te doit), dénoncer le client (réputation). Chaque option a coût et gain.
**Sans combat** : l'option « épargner » ou « dénoncer ».
**Piège** : le retournement trop tôt ou trop tard ; l'ordre des révélations doit mener à la sympathie d'abord, au doute ensuite.

## 6. Convoi (partiel)
**Idée** : conduire un marchand, une jeune fille, une charrette jusqu'à un lieu.
**Données** : effet `escorte` sur le PNJ ; des rencontres `aleatoire` ou `entree` sur la route ; une étape de quête dont l'`echec` est une condition de jauge (la Marée, la Cendre : le temps qui passe) ; il n'y a pas de condition « avant le jour N », le chronomètre passe par une jauge ou un dilemme à `delai` ; le PNJ réagit à l'arrivée (`salutations.variantes`).
**Limite** : le moteur de combat ne protège pas un allié : l'escorté n'est pas ciblé et ne meurt pas pendant la bataille. Le danger est **narratif** (jauge, choix, temps), pas tactique.
**Sans combat** : un détour (jet de survie) qui évite une rencontre mais prend du temps.

## 7. Duel (partiel)
**Idée** : un champion défie le groupe ; un duel d'honneur règle une dette.
**Données** : rencontre `mixte` avec un adversaire fort seul (1 monstre `moderee`) ; alternatives : défier selon la coutume, refuser (coût de réputation), payer le prix du sang.
**Limite** : pas de duel à un seul héros : le combat engage tout le groupe (le décor du duel est une carte étroite, mais il reste six contre un).
**Piège** : un monstre trop faible rend le duel anecdotique ; un trop fort le rend injuste.

## 8. Les variantes à garder sous la main
- **Le rival** : un PNJ concurrent veut la même cible ; le groupe peut le doubler.
- **La prime refusée** : la cible offre plus que le client ; dilemme.
- **Le contrat inversé** : la victime d'un autre contrat revient se venger (écho d'un dilemme).
