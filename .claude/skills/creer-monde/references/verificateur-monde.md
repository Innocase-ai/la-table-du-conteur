# Brief du vérificateur d'ensemble du monde (un seul, avant la publication)

Il lit le monde **entier** avec des yeux neufs et vérifie ce qu'aucune machine ne voit : que les données racontent l'histoire de la BIBLE, que les fins sont justes, que rien n'a été inventé en route. C'est l'équivalent, pour tout le monde, du vérificateur du niveau 1 de l'atlas (`decrire-lieux`).

**Quand** : étape 5 de `creer-monde`, après le point 7 (validation à 0 erreur et 0 avertissement) et le point 8 (parcours), avant la publication.
**Modèle** : **Opus 5.5** si les agents de zone étaient en Sonnet 5.5 (jamais le modèle des rédacteurs), contexte neuf. **Il ne modifie aucun fichier** : il rend un verdict, Claude corrige ou tranche avec l'utilisateur. Annonce le modèle avant de le lancer.

## Avant lui : le mécanique (Claude, sans agent)
`pnpm monde valider <id>`, `pnpm monde enigmes <id>`, `pnpm monde parcours <id>` (et `--couvrir`), l'atelier (Santé, Registre, Revue avec `canon.json`, Graphes). Donne-lui leurs sorties : il ne refait pas ce travail.

---

Tu vérifies le monde **{{id}}** (`packages/mondes/{{id}}/`, chemins relatifs à la racine du dépôt) contre son canon. Tu as : `BIBLE.md`, `CANON-PERSONNAGES.md`, `canon.json`, `LIEUX.md` (l'atlas), `monde.json`, tous les fichiers de données, et les sorties du validateur et du parcours (jointes). Tu ne modifies aucun fichier.

## Ce que tu contrôles
1. **L'histoire de la BIBLE est jouable telle qu'écrite** : la question centrale est posée tôt (un PNJ, un événement d'ouverture) ; chaque secret de la BIBLE a ses indices dans les données (faits, examens, sujets) ; l'ordre des révélations est celui du canon (sympathie, doute, choix).
2. **Les fins** : chacune répond à la question centrale et coûte quelque chose ; sa `condition` ne peut pas devenir vraie avant le choix final (cherche les conditions sur un fait appris tôt) ; chaque fin a une scène et un épilogue cohérents avec les épilogues des dilemmes ; le parcours les atteint toutes (sinon, dis ce qui bloque).
3. **L'horloge** : la jauge monte au rythme annoncé, ses paliers changent vraiment le monde, le joueur peut la freiner, une fin en dépend.
4. **Les personnages** : aucun PNJ ne contredit `CANON-PERSONNAGES.md` (âge, liens, passé) ; les fiches de savoir, les sujets et les salutations disent la même chose ; chaque PNJ important a un désir et un secret ; les compagnons réagissent aux grands choix.
5. **Les lieux** : les données suivent l'atlas (`LIEUX.md`) : mêmes points, même contenu prévu, mêmes textes ; les écarts sont justifiés.
6. **Rien d'inventé** : aucun nom propre, lieu, relique, faction, date ou secret absent du canon (la Revue de l'atelier en attrape une partie : lis ses alertes) ; aucun secret de la BIBLE dans un texte lu par le joueur avant son heure.
7. **Le rythme** : alternance combat, conversation, exploration, repos ; pas une heure de jeu sans combat ni une suite de trois combats sans souffle ; des quêtes secondaires courtes, avec une chute ; un ton par scène.
8. **Ce que lit le joueur** : un échantillon de 20 textes (passages, accroches, réponses de sujets, narrations, intros de rencontres) : phrases complètes, au présent, sans identifiant ni note technique, dans le ton du monde.

## Verdict (format obligatoire, court)

```
MONDE : {{id}}
VERDICT : PUBLIABLE | CORRECTIONS
CORRECTIONS, une par ligne : <fichier ou id> | <numéro du contrôle> | <le problème, avec la citation> | <ce qu'il faut changer>
QUESTIONS POUR L'UTILISATEUR (décisions d'histoire) : ...
POINTS FORTS (trois au plus, pour ne pas les casser en corrigeant) : ...
```

Cite toujours le texte fautif et le passage du canon qu'il contredit. Pas de remarque de style sans exemple. Une correction qui touche le **canon** remonte à l'utilisateur ; aucun agent ne modifie la BIBLE.

## Boucle
Claude corrige (ou fait corriger par un agent, puis revalide) → le vérificateur repasse **sur les seules corrections**. Au plus deux tours, puis Claude tranche avec l'utilisateur.
