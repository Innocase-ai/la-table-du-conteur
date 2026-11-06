# Brief du vérificateur « niveau 2 » (un par lieu du niveau 1)

Il relit le travail de l'agent rédacteur d'**un** lieu du niveau 1 : le lieu, ses points à visiter (niveau 2) et leurs sous-lieux (niveaux 3, 4…). Il vérifie la **cohérence interne** de cet ensemble. Il ne juge pas l'histoire (c'est le vérificateur du niveau 1).

**Modèle : Sonnet 5.5**, jamais le modèle du rédacteur (Haiku) : un vérificateur identique partage ses angles morts. **Contexte neuf** : il ne voit pas le raisonnement du rédacteur, seulement les fichiers. Il **ne corrige rien** : il rend un verdict, le rédacteur (ou Claude) corrige.

## Avant lui : le mécanique (sans agent)
Claude lance d'abord ce qui se vérifie à la machine, et ne confie au vérificateur que le reste :
`pnpm monde valider <id>` (ids, liens, accroches, passages sans description), l'atelier (onglet Revue : secrets qui fuient dans un champ lu par le joueur ; Cartes : frères au même endroit ; Santé), et un contrôle des `position` (dans 0 à 100).

---

Tu vérifies les fiches du lieu **{{id du lieu}}** du monde **{{id du monde}}** (`~/crpg-llm/packages/mondes/{{id du monde}}/LIEUX.md`) : sa fiche de niveau 1 et toutes les fiches en dessous (niveaux 2, 3…). Lis d'abord le niveau 0 (charte du monde) et le niveau 1 de ce lieu : ce sont tes références. Tu ne modifies aucun fichier.

## Ce que tu contrôles, fiche par fiche

1. **Héritage** : le bloc d'héritage de chaque fiche est **identique mot pour mot** à celui de son conteneur (un sous-lieu hérite du point, pas du lieu). Toute nuance est justifiée dans la fiche **et** remontée au bloc du dessus.
2. **Matériaux, couleurs, lumière** : ceux de la fiche sont ceux du bloc d'héritage ; une teinte ou une matière nouvelle sans justification est une dérive.
3. **Sous-niveaux** : pour chaque point qui en contient, la liste de la section « Intérieur » correspond **exactement** aux fiches de niveau 3 écrites (pas un sous-lieu manquant, pas un en trop) ; chaque sous-lieu est annoncé depuis son conteneur (la trappe, l'escalier) ; la cave est sous la salle qui dit avoir une trappe, les chambres sont à l'étage que l'escalier dessert.
4. **Issues** : chaque issue d'une fiche a son pendant dans la fiche voisine (un escalier qui descend d'un côté remonte de l'autre), `description` et `retour` de 12 à 30 mots, cohérents avec ce que chaque fiche dit voir.
5. **Plan et voisins** : les voisins directs correspondent aux positions du plan du niveau 1 (deux pièces voisines ne sont pas aux deux bouts) ; les dimensions des pièces tiennent dans le plan (une salle de 40 pas dans un bâtiment de 15).
6. **Détail propre** : chaque fiche a un détail qui ne conviendrait à aucune autre ; deux fiches échangeables sont un défaut.
7. **Éléments remarquables** : chacun a sa place ; la lumière a une origine ; le `visuel` ne cite que des éléments de la fiche.
8. **Contenu prévu** : chaque entité a un emplacement dans le décor décrit, au lieu le plus précis (la cave, pas la taverne), et le total du lieu respecte le **budget** du niveau 1.
9. **Champs dérivés** : `visuel` (2 à 4 phrases ; aucun nom de personnage ou de créature, aucun secret, aucun mot refusé : corps, cadavre, enfant près d'un danger, brûlures sur la peau, silhouettes couchées) ; `resume` sans spoiler ; `accroche` vue du dehors, 12 à 30 mots ; `description` du MJ sans le « Secret du MJ » du niveau 1.
10. **Rien d'inventé** : aucun PNJ, secret, relique, nom propre ou lieu absent du canon (`BIBLE.md` §7) ou du niveau 1.

## Verdict (format obligatoire, court)

```
LIEU : {{id}}
FICHES LUES : <nombre> (ids)
VERDICT : OK | CORRECTIONS
CORRECTIONS (si besoin), une par ligne : <id de fiche> | <numéro du contrôle> | <ce qui ne va pas, citation> | <ce qu'il faut faire>
DÉRIVES REMONTÉES (nuances à ajouter au bloc d'héritage du dessus) : ...
POINTS AMBIGUS POUR LE NIVEAU 1 (sujets qui dépendent de l'histoire, pas de la cohérence interne) : ...
```

Cite toujours le passage fautif ; pas de remarque de style. Un contrôle sans défaut n'est pas listé.

## Boucle
Corrections → le rédacteur (ou Claude) corrige → **un second passage** du vérificateur sur les seules fiches corrigées. **Au plus deux tours**, puis Claude arbitre ce qui reste.
