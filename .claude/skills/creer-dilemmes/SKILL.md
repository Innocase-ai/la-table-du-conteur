---
name: creer-dilemmes
description: Écrire, relire ou régler les dilemmes (choix difficiles) d'un monde de « La Table du Conteur » : dossier `dilemmes/`, options avec coût et gain, jets avec prix d'échec, abstention, délai, échos différés, épilogues, drapeaux de choix, chronique du journal. À utiliser quand l'utilisateur veut « un choix difficile », « un dilemme », « un choix qui coûte », « des conséquences », « une trahison », « sacrifier quelqu'un », « une fin qui dépend de ce qu'on a fait », ou qu'un avis du validateur parle de « Choix », « Pertes », « Réactivité » ou d'un dilemme. Complète `creer-monde` (le canon) et `creer-contrats` (le contrat truqué).
---

# Écrire des dilemmes

Un **dilemme** est un choix où chaque option **sert une valeur que le joueur aime** et **coûte quelque chose de visible**. Le module `dilemmes` (`packages/regles/src/modules/dilemmes.ts`, format `packages/regles/src/monde/dilemmes-donnees.ts`) l'affiche avec une ligne **Coût** et une ligne **Gain** sous chaque option, garde la mémoire du choix, programme ses échos et l'inscrit dans la *Chronique des choix* du Journal. Référence complète du format : `docs/MONDES.md` § « Les dilemmes ».

## Les règles qui font un bon dilemme
1. **Pas de bonne réponse.** Test : si deux joueurs choisiraient la même option, réécrire. Jamais d'option évidemment meilleure.
2. **Chaque option a un coût ET un gain**, écrits dans `couts[]` et `gains[]` (au moins une ligne chacun). Un coût mesurable dans `effets` : réputation de faction, attitude d'un PNJ, objet perdu, argent, jauge, PNJ qui meurt ou part, rencontre déclenchée.
3. **L'abstention coûte aussi** (`abstention.couts` + `effets`). Avec un `delai` (en jours), elle s'applique d'elle-même à l'échéance : le temps presse.
4. **Un jet raté ne bloque jamais** : une option avec `jet` impose `echec` (les effets du raté). Le prix de l'échec est différent de celui de la réussite, pas seulement « moins bon ».
5. **Révéler dans le bon ordre** : sympathie pour le personnage d'abord, doute ensuite, puis le choix ; prévoir un lieu de pause avant. La condition `quand` suit ces révélations (un fait appris, une quête, un drapeau).
6. **Une conséquence en deux temps** : un effet immédiat, plus un `echo` 1 à 4 jours plus tard (le déserteur revient, la ruelle noyée, un messager). Chaque grand choix laisse une trace.
7. **Un épilogue par option** (une phrase de « ce qu'il est advenu », racontée à la fin de l'histoire) et pour l'abstention.
8. **Au moins un dilemme par monde où un PNJ peut mourir ou partir** (`pnjEtat`) : sans perte possible, aucun choix ne pèse.

## Le format (rappel)
```json
{
  "id": "le-pli-scelle", "titre": "Le pli scellé", "situation": "2 à 4 phrases lues par le joueur…",
  "quand": { "quete": { "id": "q-…", "statut": "active" } },
  "lieu": "id d'un lieu (facultatif : où l'on tranche)", "delai": 3,
  "options": [
    { "id": "porter", "libelle": "Je le porte sans l'ouvrir.", "ton": "Loyauté",
      "couts": ["…"], "gains": ["…"], "condition": { }, "requis": { "pieces": { "min": 100 } }, "requisTexte": "Il vous faut 100 po.",
      "jet": { "competence": "escamotage", "dd": 13 }, "effets": [ ], "echec": [ ], "epilogue": "…" }
  ],
  "abstention": { "libelle": "Je ne tranche pas.", "couts": ["…"], "effets": [ ], "epilogue": "…" },
  "echos": [ { "si": "porter", "apres": 2, "annonce": "…", "effets": [ ] } ]
}
```
- `libelle` à la 1re personne ; `ton` : l'étiquette (« Clémence », « Fermeté », « Ruse »).
- `condition` : l'option est **cachée** si fausse (option réservée) ; `requis` : l'option est **grisée** avec `requisTexte` (argent, objet).
- Chaque choix pose les drapeaux `choix-<dilemme>` et `choix-<dilemme>-<option>`, lisibles partout (conditions de sujet, de rencontre, de fin, **variantes de salutation**).

## Quoi écrire autour
- **Salutations variables** des PNJ concernés (`salutations.variantes`, première condition vraie gagne) : le monde se souvient.
- **Événements de conséquence** (`evenements/`, déclencheur `condition`) qui frappent selon le choix ou la jauge.
- **Fins** (`fins/`) qui lisent un drapeau de choix.
- Les dilemmes du **monde entier** sont écrits par l'auteur du monde (Claude), car ils touchent plusieurs zones ; les agents de zone ne les écrivent pas.

## Volume et production
Visez **3 dilemmes par chapitre** (le validateur avertit). Pour la rédaction, des agents **Haiku** avec un brief précis (ids exacts, forme du choix, coûts voulus) ; Claude relit : un dilemme dont une option domine est un échec d'écriture. Modèles abordés : `packages/mondes/citadelle-des-marees/dilemmes/z6-dilemmes.json` et `packages/mondes/val-des-cendres/dilemmes/z7-dilemmes.json`.

## Vérifier
`pnpm monde valider <monde>` : erreurs (référence inconnue, jet sans `echec`, écho sur une option inconnue) et conseils `[dilemmes]` (option sans effet ou seulement narrative, aucun écho, épilogue manquant, deux options aux effets identiques). Test : `packages/regles/tests/dilemmes.test.ts` (modèle d'un test qui ouvre, tranche, vérifie coûts, drapeaux et échos). Puis dans le jeu : le dilemme s'ouvre-t-il au bon moment ? les boutons sont-ils lisibles (libellés longs sur plusieurs lignes) ? la chronique du Journal est-elle juste ?

## Pièges connus
- Un dilemme dont la condition `quand` dépend d'un drapeau jamais posé ne s'ouvre jamais (le validateur le signale).
- Un dilemme ouvert pendant une rencontre ou une conversation n'est proposable qu'en exploration : il apparaît ensuite.
- Un coût en argent sans `requis` est gratuit si le groupe est pauvre : poser `requis` avec `{ "pieces": { "min": N } }`.
- Le conteur IA ne tranche jamais (`trancher` est hors conteur) : il raconte, le joueur choisit.
