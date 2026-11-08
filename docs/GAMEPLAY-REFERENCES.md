# Ce qui fait un bon gameplay de CRPG : synthèse de recherche (08/11/2026)

**Statut :** notes de travail, à valider. Sources web **secondaires** (articles, comptes rendus de conférences, forums) : à lire comme des pistes, pas des vérités. Les affirmations sans source primaire sont signalées.

## 1. Ce que disent les sources

### Structure à la Baldur's Gate
- Les quêtes secondaires importantes commencent par une **rencontre avec un PNJ**, pas en fouillant des maisons une à une ; chercher des quêtes dans des bâtiments vides est vécu comme une corvée (forums Beamdog, avis de joueurs).
- **Peu de rencontres représentatives suffisent** à suggérer un monde plus grand : une douzaine de chasseurs de primes ponctuent un voyage, cent seraient lassants.
- Un **donjon-vitrine** marque (celui de Durlag est cité comme le meilleur) ; le remplissage est ce qu'on reproche à BG1. La découverte d'une ville sans carte marquée faisait partie du plaisir.

### Choix et conséquences
- Poser les **enjeux avant** le choix ; rendre les conséquences **visibles** (investir dans ce qu'on ne voit pas n'est pas récompensé) ; utiliser les conséquences différées avec soin (CD Projekt RED, GDC 2023).
- Décider tôt si l'on privilégie l'**histoire** ou la **liberté du joueur**, car tout le reste en dépend (Tim Cain, résumé).
- Chaque quête gagne à avoir **au moins trois voies** : combat, discrétion, diplomatie (principe attribué à l'école Quest for Glory, via une analyse).
- En fiction interactive : ne pas **fusionner les branches** trop vite, éviter le **faux choix**, **moins de choix mais plus lourds** ; tous les moments ne doivent pas être décisifs, au risque de l'épuisement (Choice of Games, Roadwarden).

### Échec et réactivité
- **Disco Elysium** : l'échec **produit du contenu** (scène, réplique, état nouveau), on enseigne tôt que **rater est sans danger**, les chances sont **lisibles** et les tests « blancs » se retentent en progressant ; critique : un test sans alternative sur le chemin critique est mal vu.
- **Baldur's Gate 3** : la réactivité tient à la **densité de reconnaissance** des actes du joueur plus qu'au nombre de fins ; prévoir « n+1 » solutions quand le joueur casse l'intrigue, et une **liste de cas limites** à traiter par quête ; la liberté demande des garde-fous (une réactivité qui casse casse fort).
- Obsidian (Sawyer, 2011, un seul enseignement retrouvé) : le chaos mécanique frustre ; permettre de **refaire** un personnage qui ne convient pas.

### Compagnons
- Tim Cain (résumé) : 2 à 4 compagnons actifs dans un vivier de 3 à 6 ; l'histoire principale doit rester finissable sans eux ; leurs quêtes personnelles sont mieux en annexe. *(Sans objet pour nous : pas de recrutement dans le groupe.)*

### Progression
- Partir du **rythme voulu** (temps par niveau), en déduire la courbe d'XP, puis tester avec de vrais temps de jeu ; **récompenses fixes** (niveaux, quêtes) plus **récompenses variables** (butin, événements) ; faire suivre la puissance du joueur par la difficulté du contenu (pistes non chiffrées, à tester).

## 2. Ce que nous avons déjà

| Principe | Où dans le projet |
| :--- | :--- |
| Un échec fait avancer (prix d'échec, chemin sans jet) | `creer-monde` règle n° 2 ; `alternatives` des rencontres |
| Plusieurs voies par obstacle (serment, duel, leurre à Lame-Rousse) | `creer-rencontres` ; fiches V4 |
| Le monde se souvient (salutations variables, échos, épilogues) | `creer-dilemmes`, `creer-personnages` |
| Du rythme, ton qui alterne, ≥ 20 % de rencontres sans combat | `creer-monde` règles 8 et 10 |
| Peu de rencontres par lieu (2 combats, budget annoncé) | fiches V4 |
| Refaire les choix à la montée de niveau | commande `reviserMontee` |
| Courbe de progression maîtrisée | `docs/PROGRESSION-XP.md` (plafond par chapitre) |
| Dilemmes sans bonne réponse | `creer-dilemmes` |

## 3. Les six ajouts : **retenus par l'utilisateur le 08/11/2026**

*Règle 3 : faite dans le validateur (`monde/validation.ts`, test `chemin-critique.test.ts`). Règles 1, 2, 4, 5, 6 : règles d'écriture à appliquer dans les fiches de lieux et à inscrire dans le skill `creer-monde` (par l'autre session, qui le modifie).*

1. **Accroches par rencontre, jamais par corvée** : chaque lieu confie sa mini-histoire par un PNJ ou un événement visible, pas en demandant de tout fouiller.
2. **Un lieu-vitrine par sous-région** : un lieu mémorable (set piece) sur les 5, les autres plus modestes.
3. **Règle de validateur « chemin critique »** : un obstacle bloquant la progression doit avoir au moins deux voies (deux compétences, un objet, une conversation). Avertissement si une seule compétence le garde.
4. **Liste de cas limites par lieu (« n+1 »)** : que se passe-t-il si le PNJ clé meurt, si l'objet est perdu, si le groupe tue la mauvaise personne ? Une ligne par cas, vérifiée par l'agent d'audit.
5. **Apprendre tôt que l'échec est sans danger** : un test à échec amusant dans le village de Lame-Rousse, avant la première vraie punition.
6. **Conséquences visibles vite** : chaque dilemme montre un premier effet dans le lieu ou le suivant, l'écho tardif venant après.

## 4. Sources

- [Beamdog : avis de joueurs sur la conception de BG1](https://forums.beamdog.com/discussion/comment/1098419)
- [GDC 2023, quêtes de Cyberpunk 2077 et The Witcher 3](https://www.gamedeveloper.com/marketing/10-key-takeaways-from-the-quest-design-of-cyberpunk-2077-and-the-witcher-3)
- [Tim Cain : compagnons](https://turbo-wiki.pages.dev/tim-cain/narrative-design/companions)
- [Tim Cain : narration et liberté du joueur](https://turbo-wiki.pages.dev/tim-cain/narrative-design/story-telling-and-player-agency)
- [Obsidian : cinq leçons de conception de RPG](https://www.gamedeveloper.com/design/gdc-europe-obsidian-s-five-hard-lessons-of-rpg-design)
- [Choice of Games : écrire un long roman interactif](https://www.choiceofgames.com/2011/07/by-the-numbers-how-to-write-a-long-interactive-novel-that-doesnt-suck/)
- [Roadwarden : concevoir l'impact et la variance narrative](https://www.Gamasutra.Com/design/deep-dive-roadwarden)
- [Disco Elysium : l'échec vu par PC Gamer](https://www.pcgamer.com/why-i-love-failing-in-disco-elysium)
- [Baldur's Gate 3 : la réactivité selon Larian](https://pcgamer.com/games/rpg/larian-gave-baldurs-gate-3-its-acclaimed-reactivity-by-approaching-it-as-weird-dungeon-masters)
- [Conception d'une courbe de niveaux et d'XP](https://bugnet.io/blog/how-to-design-an-rpgs-leveling-and-xp-curve)
