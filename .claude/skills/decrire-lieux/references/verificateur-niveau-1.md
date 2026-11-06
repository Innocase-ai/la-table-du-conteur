# Brief du vérificateur « niveau 1 » (un seul, après tous les vérificateurs du niveau 2)

Il vérifie deux choses que le vérificateur du niveau 2 ne peut pas voir : (A) que ce vérificateur a **vraiment** vérifié, (B) que l'ensemble des lieux **sert l'histoire** (le canon) et se tient entre lieux.

**Modèle : Sonnet 5.5** (ou plus fort si l'histoire est très dense), contexte neuf, aucune modification de fichier : il rend un verdict. Claude arbitre, comme pour le canon.

## Avant lui
Tous les vérificateurs du niveau 2 ont rendu « OK » (au plus deux tours chacun), et le mécanique est vert : `pnpm monde valider <id>`, atelier (Revue, Cartes, Santé).

---

Tu vérifies l'atlas **`packages/mondes/{{id du monde}}/LIEUX.md`** contre le canon (`BIBLE.md`, `monde.json`). Tu as : l'atlas complet, les rapports des vérificateurs du niveau 2, le canon. Tu ne modifies aucun fichier.

## A. Contrôler le contrôleur (sondage)
Pour **chaque lieu du niveau 1**, choisis **2 ou 3 fiches** de niveau 2 ou 3 au hasard (prends au moins une fiche de sous-lieu quand il y en a) et refais, à la main, les contrôles 1 (héritage identique), 4 (issues réciproques), 6 (détail propre) et 9 (champs dérivés) du vérificateur du niveau 2. Si tu trouves un défaut qu'il avait laissé passer, note-le : son rapport n'est pas fiable pour ce lieu, et **tout le lieu est à revérifier**.

## B. Cohérence avec l'histoire
1. **Le rôle de chaque lieu** : chaque lieu du niveau 1 sert le canon (un secret, une faction, une fin, un temps fort) ; un lieu sans fonction dramatique est signalé.
2. **L'ordre des révélations** : les secrets du « Secret du MJ » de chaque lieu sont découvrables dans l'ordre prévu par le canon (pas un secret final accessible dès le début, pas un indice indispensable derrière un lieu qu'on ne peut atteindre qu'après).
3. **Les fins** : chaque fin du canon a des lieux qui la rendent possible ; aucun lieu n'en suppose une autre.
4. **Les factions et l'horloge** : les factions sont présentes dans les lieux où le canon les met ; l'état des lieux (« avant / après ») correspond aux paliers de la jauge et aux événements du canon, avec un déclencheur (drapeau, fait) qui existe.
5. **Le budget de contenu** : le total de combats, de rencontres sociales, de PNJ, d'énigmes, de pièges et de trésors tient dans ce qui a été décidé avec l'utilisateur ; le rythme est bon (pas trois combats d'affilée sans repos ; ≥ 20 % de rencontres sans combat ; des repos là où on peut dormir).
6. **Entre lieux frères** : pas de deux lieux interchangeables ; pas de contradiction d'histoire (qui a bâti quoi, quand) ; mêmes mots pour les mêmes choses ; chaque lieu a sa nuance de matériau ou de couleur par rapport aux autres régions.
7. **Avec la carte du monde** : les distances en heures des liens correspondent à l'échelle du niveau 0 ; les positions des grands lieux sont celles de la composition de la carte ; la charte du monde (matériaux, couleurs, lumière) est respectée partout.
8. **Les points ambigus** remontés par les vérificateurs du niveau 2 : tranche-les ou note-les pour Claude.
9. **Rien d'inventé** hors canon dans l'atlas entier (PNJ, reliques, secrets, noms).

## Verdict (format obligatoire, court)

```
ATLAS : {{id du monde}}
SONDAGE (A) : <lieu> : fiabilité OK | À REVÉRIFIER (preuve : fiche, défaut) ...
HISTOIRE (B) : OK | CORRECTIONS
CORRECTIONS, une par ligne : <lieu ou fiche> | <numéro du contrôle B> | <le problème, citation du canon ou de la fiche> | <ce qu'il faut changer, et où : atlas ou canon>
QUESTIONS POUR L'UTILISATEUR (décisions d'histoire, pas de cohérence) : ...
```

Une correction qui touche le **canon** (et non l'atlas) n'est jamais appliquée par un agent : elle remonte à l'utilisateur.

## Boucle
Corrections de l'atlas → les rédacteurs concernés corrigent → le vérificateur du niveau 2 de ces lieux repasse → tu repasses **sur les seules corrections**. Au plus deux tours, puis Claude arbitre avec l'utilisateur.
