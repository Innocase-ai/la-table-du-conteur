# Audit de rythme et d'enjeux (14/11/2026)

Demande de l'utilisateur : « je m'ennuie rapidement dans notre jeu, tu cliques, tu te retrouves devant une image avec du texte… il n'y a rien qui donne une montée d'adrénaline. Le jeu est trop plat. »

**Méthode.** Lecture seule, aucun appel payant : données de La Marche d'Ombrefiel (publiée, chapitre « Prologue — Le Carrefour d'Aldric »), code du moteur (`monde/exploration.ts`, `combat/`), audits existants (`AUDIT-COMBAT.md`, `AUDIT-MOTEUR-JEU.md`, `GAMEPLAY-REFERENCES.md`, `SONS.md`) et `estimation.json`. **Limites** : personne n'a joué avec moi ; la sensation de tension se juge en jouant, et je n'ai pas relu le déroulé réel d'une partie. Les chiffres viennent des fichiers JSON du monde. La Dîme (brouillon) n'est pas auditée.

## Les chiffres

| Mesure | La Marche (prologue) |
| --- | --- |
| Durée estimée | ≈ 6 h : 4 h de récit, 1,5 h de combats (`estimation.json`) ; 185 tours, dont 84 avec le conteur |
| Lieux, chacun avec un récit d'arrivée de 130 à 170 mots | 30 (≈ 4 500 mots d'arrivées à lire) |
| Rencontres | 13 : 8 avec combat (5 « faible », 3 « modérée », **0 « élevée »**), 5 sociales ; 12 sur 13 ont des alternatives |
| Rencontres « aléatoires » | 4, toutes **sociales, uniques et nommées** : rien n'est vraiment tiré |
| Pièges / énigmes / événements à choix / dilemmes | 3 / 1 / 2 / 2 sur 30 lieux |
| Jauges, événements datés, fins | **0 / 0 / 0** (aucune horloge qui avance) |
| Quêtes | 9, de 2 à 3 étapes : aller (tuer, rapporter, chercher), puis revenir voir le donneur |
| Échec d'une alternative | 35 alternatives, 17 avec un prix d'échec : **17 sont de la narration** (2 changent aussi une attitude) ; **0 coût en PV, or ou objet** |
| Récompenses | PX : ≈ 1 500 à 1 800 par héros pour ≈ 900 visés (le niveau est plafonné par chapitre) ; or sans usage ; une seule rencontre a un butin explicite sur 13 ; la Marche n'a aucune table de butin propre |
| Repos | 5 lieux « sûrs » pour 32 ; la chambre de l'auberge coûte 0,2 po : une nuit complète est presque gratuite |

## Constats : les enjeux (ce qu'on peut perdre)

- **E1. Perdre ne coûte presque rien.** Il n'y a pas de mort définitive (décision à respecter). Après une défaite, les héros reviennent à 1 PV, perdent la moitié de leur or et 8 heures ([exploration.ts:960](packages/regles/src/monde/exploration.ts:960)). L'or n'ayant pas d'usage, la perte est nulle. Et les échecs de jets sont de la narration.
- **E2. Rien ne s'épuise.** PV et sorts sont rendus par une nuit à 0,2 po. Pas de provisions, de lumière ni d'usure. Les consommables ont été remis en état le 13/11, mais la Marche en place presque aucun (2 mentions de potion de guérison) et n'a aucune table de butin. Une expédition n'a donc pas de « fond de réserve » qui descend.
- **E3. Rien ne presse.** Aucune jauge, aucun événement daté : prendre son temps est toujours le bon choix. L'« Échéance du Conseil » n'existe que dans le texte.
- **E4. Les combats sont gagnés d'avance.** 5 sur 8 sont « faibles » (dans les simulations de l'audit de combat, les troupes de difficulté « faible » sont gagnées presque à chaque fois), aucun n'est « élevé », et l'audit de combat note que les étiquettes de difficulté ne sont pas fiables aux niveaux 1 à 3. Les combats sont toujours « tuer tout le monde » : pas d'objectif de survie, de protection ou de course, pas de renforts qui arrivent, pas de moral ni de reddition ([AUDIT-COMBAT.md](docs/AUDIT-COMBAT.md) §3).
- **E5. Peu de décisions lourdes.** 2 événements à choix et 2 dilemmes en 6 heures, soit un moment qui fait hésiter toutes les 90 minutes environ. Le reste des choix est « quel bouton cliquer » sans prix annoncé.
- **E6. Les quêtes sont des commissions.** Neuf quêtes de 2 à 3 étapes qui suivent le modèle aller / retour (la règle d'écriture demande une étape finale « retournez voir le donneur »), sans enjeu qui évolue ni choix qui engage.

## Constats : le rythme

- **R1. Deux tiers du temps se passent à lire.** 4 h de récit sur 6. Une arrivée dans un lieu = un écran de texte, même pour un lieu-dit sans enjeu (19 lieux-dits sur 32 lieux).
- **R2. Le rythme est uniforme.** Lire, cliquer, lire. Il manque l'alternance calme / tension / explosion / répit : une scène d'attente, une montée (bruits, traces, compte à rebours), puis un coup d'éclat, puis un moment de souffle. Ici, **les 8 combats se déclenchent tous à l'entrée d'un lieu** (les 5 rencontres sociales : 4 « aléatoires » et 1 à l'exploration) : le combat n'est jamais préparé ni annoncé, il tombe quand on clique.
- **R3. Les surprises sont écrites, donc prévisibles.** Les 4 rencontres dites aléatoires sont uniques et nommées ; un joueur qui rejoue connaît tout.
- **R4. Le voyage est un trou noir.** Cliquer « Partir » saute 1 à 2 heures sans rien : c'est le seul moment où un joueur pourrait sentir le danger du monde.

## Constats : la sensation (retours visuels et sonores)

- **F1. Les moments forts sont peu soulignés.** 34 bruitages, 6 musiques de fond à −30 dB (très bas), 6 de combat. Manquent le son d'impact des sorts et des flèches, le critique, la mort d'une créature, les états ; rien pendant l'effort de crochetage ou de désamorçage ([SONS.md](docs/SONS.md)).
- **F2. Les jets de dés sont montrés mais pas mis en scène.** Un jet décisif (franchir une porte, convaincre un garde) s'affiche comme les autres. Peu de suspense : pas d'attente, pas d'annonce « DD 15, 60 % de chances ».
- **F3. Les images sont statiques.** Une image fixe par lieu et par événement ; l'action est dans le texte.

## Ce qui marche déjà (à garder)

- **Fail forward** : les échecs font avancer l'histoire (35 alternatives, 12 rencontres sur 13).
- **Plusieurs voies** par obstacle, validées par le validateur.
- **Un combat riche** : cartes, plateau, couvert, IA par simulation.
- **Récits d'arrivée soignés**, PNJ avec voix, conteur pour la saisie libre.
- **Un jet de mort** en combat (tension réelle pour un héros à 0 PV).

## Leviers, classés par rapport impact / effort

| # | Levier | Pourquoi | Où | Effort |
| --- | --- | --- | --- | --- |
| 1 | **Faire coûter l'échec** sans tuer : PV, objet abîmé ou perdu, or, une quête qui se ferme, un compagnon blessé, du temps | E1 : le jeu cesse d'être sans conséquence | `Alternative.echec` (déjà `Effets`), données de la Marche | petit (données) |
| 2 | **Des ressources qui descendent** : provisions, lumière, potions et sorts à garder, chambre plus chère, repos qui prend vraiment du temps | E2 : « continuer ou rentrer ? » | module d'inventaire, `seReposer`, tables de butin | moyen |
| 3 | **Une horloge** : une jauge ou un événement daté par chapitre (l'Échéance du Conseil), qui avance avec le temps passé | E3 : le temps devient un coût | jauges, événements (formats déjà là) | petit à moyen (données) |
| 4 | **Combats qui comptent** : étiquettes de difficulté fiables, quelques combats « élevés », objectifs autres que tout tuer, renforts, moral | E4 | `combat/`, `AUDIT-COMBAT.md` §3 | moyen à gros |
| 5 | **Voyage avec risque** : rencontres tirées au hasard en route, nuit qui tombe, camper dehors, ressources qui baissent (le moteur `terres` ou les trajets par étapes) | R3 et R4, et cumule avec 2 et 3 | `packages/terres`, `aller` | moyen (moteur fait, branchement et contenu à faire) |
| 6 | **Plus de choix lourds** : un événement à choix ou un dilemme par site, avec l'enjeu annoncé avant | E5 | `creer-evenements-choix`, `creer-dilemmes` | moyen (écriture) |
| 7 | **Mettre en scène les moments forts** : jet décisif annoncé avec les chances, son d'impact, critique, mort, musique qui monte à l'approche d'un danger | F1, F2, R2 | `sons-regles.ts`, musique, `EcranRencontre` | petit à moyen |
| 8 | **Des quêtes qui évoluent** : une quête dont le donneur ment, un second choix au retour, une étape qui change si on tarde | E6 | `creer-intrigue` | moyen (écriture) |

## Ce que je recommande

1. **Les leviers 1 et 3** d'abord : ils transforment ce que le joueur ressent sans écrire un seul décor, et ils sont presque entièrement des données. Un échec qui coûte et une horloge qui avance suffisent à changer le rapport au risque.
2. **Le levier 5 ensuite**, combiné au 2 : un voyage où l'on peut perdre des ressources et se faire surprendre est l'endroit naturel pour faire monter la pression. C'est là que le moteur `terres` (ou des trajets par étapes) a de la valeur.
3. **Le levier 7 en parallèle**, c'est peu coûteux et ça se voit tout de suite.
4. Les leviers 4, 6 et 8 demandent plus d'écriture et de tests de jeu : à planifier une fois les premiers essayés.

**À décider avec l'utilisateur** : quelle part de risque il veut (un échec peut-il coûter de l'or, un objet, un compagnon ?), si l'horloge d'une histoire peut faire perdre une quête, et si la dureté d'un combat peut monter (un « élevé » doit-il pouvoir battre le groupe ?).
