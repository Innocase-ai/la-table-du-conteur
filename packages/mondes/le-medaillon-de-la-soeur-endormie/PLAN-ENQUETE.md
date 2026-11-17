# Plan d'enquête : « Le Médaillon de la Sœur Endormie » (proposition du 17/11/2026, à valider)

Règle appliquée : la quête principale est une enquête (skill `creer-intrigue`, point 3 bis). **Rien n'est écrit tant que ce plan n'est pas validé.**

## La vérité (secret du MJ, jamais dite en toutes lettres)

Sainte Odile, la Sœur Endormie, a été embaumée à la cire, puis enterrée sans son médaillon (ôté de son cou « pour servir aux vivants »). Elle repose dans la chapelle brûlée. Elle s'est levée, a marché jusqu'à la crypte du sanctuaire (d'où les traces de boue de cendre et de cire), a repris son médaillon et l'a ramené à son cercueil, qu'elle garde avec deux goules attirées par la cire. Personne n'a forcé la porte de la crypte.

## Les pistes (le joueur en choisit l'ordre)

| Piste | Où | Indice qu'elle apporte | Nature |
|---|---|---|---|
| **A. La crypte** | Nouveau lieu « Crypte du sanctuaire » (Anselme en ouvre la marche) | `f-boue-de-cendre` : la boue contient de la cendre (donc un lieu brûlé) ; `f-cire-d-embaumeur` : la cire n'est pas celle des cierges (cire d'embaumement) ; `f-serrure-intacte` : la porte n'a pas été forcée | 3 examens du décor |
| **B. Les clés** | Bertrand, Anselme | Rien : personne n'est coupable | **Impasse utile** (écarte les suspects, `f-serrure-intacte` la confirme) |
| **C. Les offrandes du carrefour** | Nouveau lieu « Carrefour des offrandes » (Mahaut et Bertrand en parlent) | `f-lambeau-de-lin` : un lambeau de lin jauni et ciré | **Petit combat** : 3 chiens errants attirés par les offrandes |
| **D. Les grattements** | Jorane, Foulques, Mahaut | Rien de décisif | **Impasse + petit combat** : des rats géants dans la cave du Sanglier Doré (rencontre dans le lieu existant, sans nouveau lieu) |
| **E. Le bandit du bois** | Quête de Mahaut (bois, déjà là) | `f-temoin-du-bandit` : il s'est abrité dans la nef des ruines et s'est enfui la nuit où « quelque chose s'est levé » ; c'est ce qui l'a estropié | **Petit combat ou négociation** (déjà écrit), qui recoupe les deux quêtes |
| **F. Les récits** | Anselme (registre), Jorane (chanson), Mahaut (incendie), Foulques (nuit du vol) | Déjà écrits : médaillon ôté, « elle reprend l'or », flammes blanches, pas traînants et cire froide | Indices de fond qui rendent le recoupement lisible |

## Le recoupement qui ouvre les ruines

- **Étapes parallèles** de la quête « Le médaillon volé » : *interroger le village*, *examiner la crypte*, puis *comprendre où mènent les traces* qui s'accomplit quand le joueur connaît `f-boue-de-cendre` **et** (`f-cire-d-embaumeur` **ou** `f-temoin-du-bandit`). Cette étape a pour effet `debloquer` des ruines ; le passage exige déjà la quête active.
- Ensuite : vaincre la Gardienne et ses goules, trouver le médaillon, le rapporter à Bertrand (inchangé).

## Ce qui change dans ce qui est déjà validé (à accepter)

1. **Anselme (sujet « la crypte »)**, **Bertrand (sujet « les ruines »)** et **Jorane (sujet « ce qu'on entend »)** ne nomment plus les ruines ni la route de charrette : les traces « s'éloignent par la vieille route, vers le nord ». Le fait `f-traces-route-de-charrette` est réécrit en conséquence. Sans ça, le lieu final est donné d'emblée.
2. **Le bandit estropié** gagne 2 ou 3 phrases (négociation ou sac fouillé) pour livrer son témoignage.
3. **La quête principale** passe de 4 étapes en ligne à des étapes parallèles qui convergent (texte du journal par Haiku, sans solution ni lieu).

## Ce qu'il faut créer

- 2 lieux (crypte, carrefour) : fiches, récits d'arrivée, passages, **2 images (≈ 0,018 $)** ; une scène d'ouverture n'est pas prévue.
- 2 rencontres de combat faciles (chiens errants, rats géants), sans butin notable ; monstres du catalogue SRD, aucune image de monstre à créer.
- 4 examens (3 à la crypte, 1 au carrefour) et 4 faits nouveaux (boue, cire d'embaumeur, serrure intacte, témoin du bandit) + lambeau de lin.
- Aucune voix à générer, sauf si tu veux narrer l'ouverture du lieu final.

## Compte final (vérifié par `pnpm monde parcours --chemin`)

3 pistes utiles (A, C, E), 2 impasses (B, D), au moins 8 indices, 3 petits combats (chiens, rats, bandit) avant le combat final. Le chemin le plus court doit passer par la crypte et par un second indice.

## Questions pour toi

1. Les 2 nouveaux lieux (≈ 0,018 $ d'images) te vont-ils, ou on garde tout dans les lieux existants (la crypte devient une série d'examens du sanctuaire) ?
2. Le joueur doit-il pouvoir deviner que la Gardienne est sainte Odile ? (Je propose que oui, par recoupement : registre + chanson + cire d'embaumeur + lin ; le boss reste ambigu, l'épilogue ne le confirme pas.)
3. Veux-tu en plus un **choix final** (rendre le médaillon à Bertrand ou le laisser à la Sœur) ? C'est un dilemme de plus ; je ne l'ajoute pas sans ton accord.
