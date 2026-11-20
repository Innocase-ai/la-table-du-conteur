# V6 : le moulin, contenu pièce par pièce — *Validé par l'utilisateur le 20/11/2026 (gelé), décisions M1 à M10 comprises*

Même rythme que le village (`V6-village.md`, gelé). Ce document dit **ce qu'on vit** au moulin, pièce par pièce : les deux PNJ, les deux rencontres, les contenants, la clé, les examens, les liens et leurs conditions. Il ne contient pas les textes lus par le joueur : après ton oui, des agents Haiku les écrivent (pilote inutile, le style du village sert de référence). Il ne touche pas au gelé (V2 à V5) ; ce qui s'y ajoute est marqué **[nouveau]**. Les quêtes (étapes, récompenses) restent pour V7.

## A. Décisions à valider

| # | Décision | Proposition | Pourquoi |
| --- | --- | --- | --- |
| M1 | Le témoignage de l'homme de main (fin « scandale » : « la reconnaissance de dette **ou** le témoignage d'un homme de main ») | un fait intermédiaire **[nouveau]** `f-gedeon-a-engage-la-bande` : « Gédéon Marchebise a engagé Rouquin Lamefine et ses hommes pour retrouver la clé de la foire. » L'homme de main (réglé) et Rouquin (avec le levier) le révèlent. En V7, la condition du « scandale » sera `f-gedeon-et-la-dette` **ou** `f-gedeon-a-engage-la-bande` | l'homme de main ne connaît ni la dette ni la menace : il sait seulement qui paie ; `f-gedeon-et-la-dette` (qui contient la dette) reste pour la reconnaissance, Gédéon et Tobie |
| M2 | Le jet de la caisse de matériel (cour ; « à fixer en V6 ») | verrou de cadenas, **Escamotage ou Athlétisme DD 10** ; 5 po ; aucun piège ni gardien | deux contenants à jet au moulin (caisse DD 10, coffre de campement DD 12), conforme au budget V4 |
| M3 | La clé dans la fente de la poutre (V4 : « Investigation DD 14, DD 10 après examen de la poutre ») | **deux trésors exclusifs** qui donnent la même clé : `mou-tre-cle` (cache Investigation DD 14, tant que l'examen de la poutre n'a pas été fait) et `mou-tre-cle-poutre` (cache Investigation DD 10, une fois `f-traces-de-corde-sur-la-poutre` connu) ; chacun disparaît dès que la clé est dans le sac. La fouille se retente le lendemain (aucune horloge) ; en plus, Tobie et Mère Pivoine disent où elle est (V6 Pont-Cassé). *Variante plus simple si tu préfères : un seul trésor, DD 12, on abandonne « DD 10 après examen »* | respecte V4 et la règle « une chose indispensable ne tient pas à un seul jet » |
| M4 | La trappe du grenier, coincée (lien salle → grenier) | lien **conditionné** par `rencontre r-rouquin-au-moulin` (réglée) et **verrouillé** DD 12 (le groupe la **force** : Athlétisme) ; pas de clé | ce que V4/V5 laissaient « à fixer en V6 » |
| M5 | Un jet raté contre les hommes de main ou Rouquin | le moteur rouvre la scène (le combat reste possible, l'issue ratée ne se retente pas), au lieu de « lancer le combat » (V4) | c'est ainsi que le moteur traite un jet raté contre des monstres ; le prix est que la négociation ratée est perdue |
| M6 | Espèces et âges | l'homme de main du pont : humain, 35 ans ; Rouquin Lamefine : humain, 42 ans | BIBLE §6 les laissait à V6 |
| M8 | Personne ne meurt, personne ne part (règle « n+1 » de V4 : ni mort définitive de PNJ, ni état nouveau) | vaincu, l'homme de main et Rouquin **se rendent** et restent à leur place, vivants ; leurs sujets restent accessibles (ceux qui parlent du patron s'ouvrent après une victoire ou une négociation) ; **pas** d'état « parti » | corrige mon brouillon : le moteur ne tue pas un PNJ de lui-même, seule une donnée le fait |
| M9 | Quand s'ouvre une rencontre | à **l'entrée** du pont et de la salle, répétable (`unique: false`) tant qu'elle n'est pas réglée (condition `non rencontre`), pour qu'une fuite ne bloque pas le groupe ; on peut parler aux deux PNJ avant ou après la scène | aucun cul-de-sac |
| M10 | Le lien pont → cour (silence du gelé, V4 : « trois sorties » pour passer les hommes de main) | conditionné par `rencontre r-hommes-de-main` **réglée** (victoire, négociation ou paiement) | c'est ce qui fait des hommes de main un vrai passage ; la route Verdelle → pont reste conditionnée à la quête principale (V4) |
| M7 | PX des issues sans combat | hommes de main : négocier 17 PX, payer 0 PX (100 PX divisés par 6, arrondis) ; Rouquin : négocier ou acheter 75 PX (V2). Le total des PX de l'épisode se règle en V7 | conforme à V2 |

## B. Faits **[nouveaux]** (indices du moulin)

| id | texte (à plat) | Source |
| --- | --- | --- |
| `f-gedeon-a-engage-la-bande` | Gédéon Marchebise a engagé Rouquin Lamefine et ses hommes pour retrouver la clé de la foire, sans se montrer. | l'homme de main du pont (rencontre réglée) ; Rouquin (levier montré) |
| `f-cour-fouillee-par-une-bande` | La serrure de l'atelier a été forcée de l'extérieur il y a peu, et de nombreuses bottes ont piétiné la cour : une bande a fouillé ici. | examens de la cour |
| `f-traces-de-corde-sur-la-poutre` | La poutre maîtresse du grenier porte des traces de corde à hauteur de main : quelqu'un s'y est suspendu ou y a noué une corde. | examen de la poutre |
| `f-trappe-calee-de-l-interieur` | La cale de la trappe du grenier a été posée depuis le grenier : celui qui l'a posée est reparti autrement, et la bande n'est jamais montée. | examen de la trappe, côté grenier |

`f-traces-de-corde-sur-la-poutre` est la source « lieu à fouiller » de `f-cle-au-grenier` (avec Tobie et Mère Pivoine) ; le recoupement est écrit en V7.

## C. Les PNJ du moulin

### 1. L'homme de main du pont (`homme-de-main-du-pont`, pont du Meunier)

Humain, 35 ans, profil de combat `bandit`, **l'un des quatre** de la rencontre. **Voix** : laconique, bourrue, un ton de garde qui s'ennuie. **Désir** : toucher sa paie sans histoire. **Peur** : son chef. Il se tient dans la guérite, au bout côté cour.

| # | Sujet (bouton) | Contenu | Effets / condition |
| --- | --- | --- | --- |
| 1 | « Qui garde ce pont ? » | Les hommes de la barrière : il ne dit pas pour qui ; « on a été payés pour qu'il n'y passe personne ». | — |
| 2 ★ | « Pourquoi le moulin est-il fermé ? » | « Réparations », dit l'écriteau ; lui n'a aucun marteau ; il se tait quand on insiste. | — |
| 3 ★ | « Qui commande, là-haut ? » | Le chef est dans la salle des meules ; il s'appelle Rouquin et « n'aime pas qu'on le dérange » ; il vaut mieux payer qu'insister. | — |
| 4 | « Ça vous plaît, ce travail ? » | Trois jours de pluie, du pain dur ; il compte les pièces ; sans malice. | — |
| 5 ★ (secret) | « Qui vous paie ? » | **Condition** : la rencontre `r-hommes-de-main` réglée par la **victoire** ou par la **négociation** (pas en payant). Le patron est « quelqu'un de la ville qui a de l'argent » : le marchand de grain, Marchebise. Il ne sait rien de plus. | révèle `f-gedeon-a-engage-la-bande` |

**Cas limites** : vaincu, il se rend et reste vivant (M8) : son témoignage reste possible ; s'il a été payé, il se tait ; il reste toujours la reconnaissance de dette (V2). Payé (20 po), il se tait sur le patron : le sujet 5 ne s'ouvre qu'après une victoire ou une négociation (voir §E), pas après un paiement.

### 2. Rouquin Lamefine (`rouquin-lamefine`, salle des meules)

Humain, 42 ans, profil de combat `chef-de-bande`. **Voix** : lente, ironique, sèche, la politesse d'un homme qui n'a pas besoin de crier. **Désir** : finir le travail et toucher sa paie. **Peur** : perdre ses hommes et sa réputation. Il attend assis sur le lit de camp, et « ne dit que ce qu'il veut dire ».

| # | Sujet | Contenu | Effets / condition |
| --- | --- | --- | --- |
| 1 | « Que faites-vous ici ? » | « On garde un moulin fermé. » Le bruit de la foire ne le regarde pas. | — |
| 2 ★ | « Pour qui travaillez-vous ? » | Pour « un patron qui paie bien » ; pas de nom ; il en dira un « si l'offre le vaut ». | — |
| 3 ★ | « Qu'avez-vous trouvé ? » | Ses hommes ont fouillé la cour et la salle ; en haut, la trappe tient bon : ils attendent une barre à mine. Il ne dit pas ce qu'il cherche. | — |
| 4 | « On peut s'arranger ? » | Sans levier : il refuse, calmement, « pas à ce prix ». **Variante** si le groupe a la reconnaissance de dette : il se tait un instant, puis « montrez-la » (la scène de négociation s'ouvre : voir §E). | variante : condition `objet reconnaissance-de-dette` |
| 5 ★ (secret) | « Qui est ce patron ? » | **Condition** : la reconnaissance de dette dans le sac. Il admet que c'est le marchand de grain, et que la clé « devait être quelque part ici ». | révèle `f-gedeon-a-engage-la-bande` |

Les trois sujets ★ (2, 3, 5) portent la quête principale. **Cas limite** : vaincu, il se rend et reste assis (M8) ; réglé en négociation ou en achat, il reste là aussi, ses sujets accessibles.

## D. Pièce par pièce

### 1. Le pont du Meunier (`mou-pont-du-meunier`)

- **PNJ** : l'homme de main du pont (guérite).
- **Rencontre** `r-hommes-de-main` : 4 × `bandit` (le PNJ en est un), 100 PX, faible ; type `mixte` ; `terrain: foret` ; carte 12 × 5, trois rangs de deux `H` à gauche, quatre `m` à droite, le tonneau-table en `#` ; `intro` de 70 à 110 mots ; **issues** : *négocier* (Persuasion DD 12, 17 PX), *payer* (20 po, condition « avoir 20 po », 0 PX), *combattre* (toujours possible). Un jet raté rouvre la scène (M5). Butin : la **bourse commune** (trésor gardé) ; les bandits n'ont pas de dépouilles supplémentaires (`depouilles: false`).
- **Trésor** `mou-tre-bourse` : bourse commune sous le tonneau-table, 10 po, gardée par la rencontre.
- **Examen** : l'écriteau « Fermé pour réparations » (lettres inégales, clous rouillés) ; fait `f-hommes-de-main-au-pont-du-meunier` déjà connu.
- **Lien** vers la cour : conditionné par `rencontre r-hommes-de-main` (réglée).

### 2. La cour du moulin (`mou-cour`)

- **Pas de PNJ**, pas de rencontre.
- **Trésor** `mou-tre-caisse` : la caisse de matériel du meunier, sous l'auvent de l'atelier ; verrou DD 10 (M2) ; 5 po.
- **Examens** : la serrure forcée de l'atelier (de l'extérieur) ; les traces de charrette et de bottes dans la boue ; ils donnent `f-cour-fouillee-par-une-bande`. L'ornière en demi-cercle est un simple détail (aucun examen).
- **Lien** vers la salle des meules : sans condition (la porte du moulin n'est pas barrée).

### 3. La salle des meules (`mou-salle-des-meules`)

- **PNJ** : Rouquin Lamefine (lit de camp, mur est).
- **Rencontre** `r-rouquin-au-moulin` : 1 × `chef-de-bande`, 450 PX, modérée ; type `mixte` ; `terrain: camp` ; carte 14 × 9, escalier à l'ouest et meules au centre en `#`, braises (`~`) près des meules, six `H` près de la porte au sud, un `m` près du lit ; `intro` de 70 à 110 mots ; **issues** : *combattre* ; *négocier* (Persuasion DD 11, 75 PX) et *acheter* (60 po, 75 PX), **toutes deux conditionnées par l'objet `reconnaissance-de-dette`** ; sans levier, il refuse. Butin : les dépouilles tirées de la table commune du palier 1.
- **Trésor** `mou-tre-coffre-campement` : coffre de campement au pied du lit, verrou DD 12, 20 po.
- **Examen** : les deux meules (rainures de largeurs différentes, une pierre polie en cuvette) : ambiance, aucun fait.
- **Lien** vers le grenier : conditionné par `rencontre r-rouquin-au-moulin` (réglée), verrou DD 12 (M4).
- **Cas limite** : la scène s'ouvre à l'entrée (M9) ; le groupe peut se replier, parler à Rouquin, puis revenir : elle se rouvre tant qu'elle n'est pas réglée.

### 4. Le grenier (`mou-grenier`)

- **Pas de PNJ**, pas de rencontre.
- **Trésors** : `mou-tre-cle` (cache Investigation DD 14, clé dans la fente de la poutre, condition : le fait de la poutre inconnu et la clé absente) et `mou-tre-cle-poutre` (cache DD 10, condition : le fait connu et la clé absente), même contenu : `cle-du-coffre-de-la-foire` (M3).
- **Examens** : la poutre maîtresse (traces de corde, `f-traces-de-corde-sur-la-poutre`) ; la trappe côté grenier (la cale : `f-trappe-calee-de-l-interieur`) ; la petite trappe à grain du pignon ouest (trop étroite pour un groupe, sur le vide au-dessus de la roue : ambiance, elle explique le départ de Tobie sans le dire).
- **Cas limite** : l'objet de quête ne se perd ni ne se vend.

## E. Les issues, vues par le joueur

| Rencontre | Choix | Conditions | Jet | PX | Effets |
| --- | --- | --- | --- | --- | --- |
| Hommes de main | Combattre | — | combat | 100 PX (17 chacun à 6) | témoignage possible tant que le PNJ vit (sujet 5) |
| Hommes de main | « Je négocie. » | — | Persuasion DD 12 | 17 | rencontre réglée par l'alternative « négocier » ; le sujet 5 s'ouvre |
| Hommes de main | « Je paie vingt pièces d'or. » | `pieces ≥ 20` | — | 0 | −20 po ; rencontre réglée ; le sujet 5 reste fermé (il se tait) |
| Rouquin | Combattre | — | combat | 450 PX (75 chacun à 6) | — |
| Rouquin | « Je lui montre la reconnaissance de dette et négocie. » | objet `reconnaissance-de-dette` | Persuasion DD 11 | 75 | rencontre réglée ; sujet 5 ouvert |
| Rouquin | « Je lui offre soixante pièces d'or. » | objet `reconnaissance-de-dette` + `pieces ≥ 60` | — | 75 | −60 po ; rencontre réglée |

## F. Chemin le plus court (rappel, pour V7)

Panneau ou Colombe → Aubin → route du moulin → hommes de main (payer 20 po ou négocier) → cour → Rouquin (combat : pas de levier) → forcer la trappe → grenier (fouille DD 14 ou DD 10 après la poutre) → retour à Aubin. Il demande de chercher, de parler et de se battre.

## G. Ce que V6 demande ensuite

Après ton oui : (1) 3 agents Haiku écrivent les textes (l'homme de main et ses issues ; Rouquin et ses issues ; les examens et les trésors du moulin) ; (2) j'assemble les JSON ; (3) audit, `pnpm monde valider`, puis présentation du moulin écrit. Le Pont-Cassé (Mère Pivoine, Tobie) suit séparément.
