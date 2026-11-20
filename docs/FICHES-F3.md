# Fiche de décision de F3 (gabarit de quête) — 20/11/2026

**Statut au 20/11/2026 : F3-D1 tranchée par l'utilisateur (« Oui, option 1 ») et appliquée, sans drapeau de monde** (voir ci-dessous). Les quatre « dépendances connues » de l'état des lieux du 13/11/2026 sont traitées (tableau final).

---

## F3-D1 — Un effet direct `quete: active` lance la quête malgré son `prerequis` — **décidé : option 1, appliquée**

- **Constat.** `prerequis` d'une quête n'est lu que par la commande `accepterQuete` (« Accepter » grisé tant qu'il est faux). Un effet direct (`{ "quete": { "id": …, "statut": "active" } }` d'un sujet de PNJ, d'un événement, d'une issue de rencontre) ou un effet `etape` ne l'évalue pas : la quête devient `active` même quand le prérequis est faux (`monde/etat.ts`, `appliquerEffet`). `niveau` n'est jamais appliqué non plus (affichage seul).
- **Où cela se voyait.** **Tombe** 3 quêtes (`q-varnac-frere-d-armes`, `q-lysandre-sceau-brise`, `q-mireille-plan-trois-paliers` : le sujet « rejoindre » les lance, leur prérequis est « le PNJ est vivant » : toujours vrai quand son sujet se joue, donc **sans conséquence réelle**) ; **Val des cendres** (jeu d'essai) 6 quêtes. Dîme, Marche : aucune.
- **Options.**
  1. **Rétrograder** : quand le prérequis est faux, l'effet `active` ne lance pas la quête, il la **propose** (`proposee`) ; le joueur la voit grisée dans « Quêtes proposées » et l'acceptera quand le prérequis sera vrai. L'évaluation se fait **en fin de lot d'effets** (comme la clôture d'une quête, `appliquerEffets`) pour ne pas dépendre de l'ordre des effets d'un sujet (un drapeau posé après l'effet de quête compterait).
  2. **Ignorer** : l'effet ne fait rien quand le prérequis est faux (comme un sujet dont la condition est fausse). Le joueur ne sait pas qu'une quête lui a été refusée.
  3. **Garder** (l'état d'aujourd'hui) : le prérequis ne protège que l'acceptation ; l'auteur qui veut une protection met la condition sur le sujet ou l'événement  (option écartée).
- **Recommandation : option 1.** C'est la seule qui ne perd rien (la quête reste proposée) et ne laisse pas un joueur sans explication. Elle ne change que les cas où le prérequis est faux au moment de l'effet : **aucun cas des trois histoires ni des jeux d'essai** (à confirmer par `pnpm monde parcours`, qui doit prouver les mêmes fins). Reste à choisir : **sans drapeau de monde** (le plus simple, puisque rien ne change aujourd'hui) ou **derrière un drapeau** `quetesPrerequisStricts` (la lecture stricte de P2 : tout comportement nouveau est opt-in).
- **Ce qui a été fait (option 1, sans drapeau de monde).** `monde/etat.ts` : un effet `quete: active` sur une quête **pas encore en cours** (absente ou proposée) dont le `prerequis` est faux la **propose** seulement ; un effet `etape` sur une telle quête ne la lance pas non plus (elle reste ou devient proposée) ; une quête déjà en cours ne recule pas ; une quête sans `prerequis` est lancée exactement comme avant. Dans `appliquerEffets`, ces lancements se jugent **après** les autres effets du lot : un drapeau que le prérequis lit, posé plus bas dans le même sujet, compte. **Pas de drapeau de monde** : rien ne change tant que le prérequis est vrai (le cas des trois histoires et des jeux d'essai : les 3 quêtes de la Tombe ont pour prérequis « le PNJ est vivant »), donc ni migration de sauvegarde ni comportement nouveau pour un monde existant. Tests : `quete-durcissement.test.ts` (5 cas). L'avis `quete.prerequis-ignore` n'a plus d'objet et a été retiré.

---

## État des quatre dépendances connues

| Dépendance (état des lieux du 13/11) | État au 20/11/2026 | Ce qui a été fait |
|---|---|---|
| `quete: active` ignore `prerequis` | **Corrigé** (F3-D1, option 1 décidée le 20/11/2026) | La quête est proposée, pas lancée, tant que le prérequis est faux ; jugé en fin de lot ; 5 tests. |
| Une étape supprimée du monde bloque une quête en cours | **Déjà réparé** par `avancerQuetes` (réparation des étapes inconnues, repli sur les suites des étapes accomplies, retour au début) ; manquait la preuve | 4 tests (`quete-durcissement.test.ts`) : étape active renommée, une seule étape active disparue, plus rien de connu, quête close jamais rouverte. Pas de migration. |
| `recompensesDeQuete` additionne des branches exclusives | **Corrigé**, additif | Le déroulé le plus généreux (étapes en parallèle additionnées, étapes finales `termine` exclusives) ; paramètre facultatif `accomplies` (ce que la partie a vraiment reçu, utilisé par le journal pour « Reçu ») ; **aucune quête sans embranchement ne change** (test sur les trois histoires). Non traité : le budget de PX de `valider` (`validation.ts`, somme de toutes les étapes) compte toujours les fins exclusives. |
| `completion` insatisfiable non détectée | **Détectée** (avis, jamais erreur : P1) | Avis `quete.etape-impossible` (`conditionSatisfiable` sur chaque `completion` et sur `prerequis`). Sur les histoires : **Marche** 2 quêtes (`q-honneur-de-brise-roc`, `q-l-echantillon-maudit`, déjà acceptées dans `revue.json`, voir L2-D4). |

## Défauts que les nouveaux avis font apparaître (rien n'est corrigé en silence)

Données **non modifiées** : voir `pnpm monde quetes <monde>` pour la liste complète.

- **Annonce de récompense absente** : Dîme 12 quêtes sur 12, Marche 9 sur 9, Tombe 3 sur 15 (les autres ont déjà la leur). Les quêtes de la Tombe les plus récentes l'ont.
- **Retour au donneur non prouvé** (aucun drapeau posé par un sujet du donneur) : Dîme 2 (`q-la-dime`, `q-marin-le-passage`), Tombe 1 (`q-tombe-des-rois-serpents` : son drapeau `verdict-partage-rendu` vient d'un dilemme, pas d'un sujet de Martin).
- **Combat contre des adversaires qui parlent, sans alternative** : le Médaillon (jeu d'essai) : `le-medaillon-vole`, rencontre `r-goule-des-cryptes` (momie, goule).
- **Négociation contre des adversaires muets** : aucune, sur les trois histoires, après avoir distingué la parole (Persuasion, Tromperie) des gestes (Intimidation, offrande).
