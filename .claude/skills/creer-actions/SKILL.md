---
name: creer-actions
description: ÉBAUCHE (format pas encore dans le moteur). Écrire les actions d'un lieu d'un monde de « La Table du Conteur » : des gestes propres à une situation (« soulever la planche du grenier », « lire le registre du port », « suivre le messager jusqu'au pont »), avec un prix, une trace et un dilemme, pas des jets de compétence génériques. À utiliser quand l'utilisateur veut « plus d'actions que fouiller », « de la profondeur dans l'exploration », « des verbes », « enquêter », « espionner », « suivre quelqu'un ». Complète `creer-evenements-choix` (tableau illustré), `creer-dilemmes` (choix lourd) et `creer-pieges-tresors` (fouille).
---

# Écrire des actions de situation (ÉBAUCHE)

> **Statut : brouillon de conception, validé dans le principe le 14/11/2026 ; banc d’essai (lot 0) joué le 14/11/2026 avec les événements à choix, voir `packages/regles/tests/banc-carriere.test.ts` et l’étude du moteur dans les notes des sessions.** Le format ci-dessous n'existe pas encore dans `packages/regles` : rien ne le valide ni ne l'affiche. Avant d'écrire une seule action dans un monde, voir « Ce qu'il faut décider » en bas.

## L'idée
Une **action de situation** est un geste que l'auteur propose à un endroit et à un moment précis, parce que le groupe a vu ou appris quelque chose. Ce n'est pas un verbe général (« fouiller », « pister ») suivi d'un jet : c'est « Soulever la planche du grenier » qui n'apparaît que si l'on a remarqué la poussière déplacée.

Une action est profonde si elle a **les trois** :
1. **Un prix** : du temps, un risque, un objet usé, un PNJ qui s'en aperçoit.
2. **Une trace** : un fait appris, un drapeau lu plus loin, la vigilance du lieu qui monte, une réputation.
3. **Un dilemme, pas seulement un résultat** : chaque approche gagne quelque chose et en perd une autre. Si une approche domine, réécrire.

## Ce qui existe déjà (à réutiliser, ne pas dupliquer)
- **Examens** (`modules/examens.ts`, dossier `examens/`) : regarder de près un détail ; texte de lore, variantes selon ce que le groupe sait, regards d'origine. Pas de prix, pas de choix. Une action peut **s'ouvrir** parce qu'un examen a été lu (`examen-<id>` vu).
- **Événements à choix** (`creer-evenements-choix`) : tableau illustré, choix généraux et d'origine, jets avec échec, drapeaux `evt-<id>-<choix>`. `ouverture: "bouton"` en fait déjà une action de situation, mais **une seule fois** et sans coût de temps ni de vigilance.
- **Fouille** (`fouiller`, `creer-pieges-tresors`) : détection d'une cachette, sans choix.
- **Conditions** (fait, quête, drapeau, mémoire du groupe, `heros`, `moment`) : suffisent à décider quand une action apparaît.

## Format envisagé
```json
{
  "id": "soulever-la-planche", "lieu": "mar-moulin-grenier",
  "verbe": "Soulever", "titre": "La planche du grenier",
  "visible": { "fait": "f-poussiere-deplacee" },
  "approches": [
    { "id": "mains", "libelle": "À mains nues.", "cout": { "heures": 0, "vigilance": 1 },
      "jet": { "competence": "athletisme", "dd": 10 },
      "effets": [ { "fait": "f-registre-trouve" } ], "resultat": "50 à 80 mots.",
      "echec": [ { "flag": "grenier-bruit" } ], "resultatEchec": "50 à 80 mots." },
    { "id": "lever", "libelle": "Avec le pied-de-biche.", "requis": { "objet": "pied-de-biche" },
      "cout": { "heures": 1, "vigilance": 0 }, "effets": [ { "fait": "f-registre-trouve" } ], "resultat": "50 à 80 mots." }
  ],
  "rejouable": false,
  "media": { "image": null, "voix": false, "son": "planche-qui-craque" }
}
```
- **`visible`** : une `Condition` ; sans elle l'action serait un verbe général. **`approches`** : 2 à 4, chacune avec son prix. **`cout`** : `heures` (le temps compte pour les horloges de quête) et `vigilance` (jauge du lieu, voir plus bas).
- **Mémoire** : le jeu pose `act-<id>` et `act-<id>-<approche>`, lisibles partout comme `evt-…`.
- **Repli général** : si l'auteur n'a rien écrit, un verbe commun (observer, guetter) renvoie une réponse générique courte ; il ne sert que de filet.

## La vigilance d'un lieu
Une jauge cachée par lieu (0 à 3). Chaque geste bruyant ou voyant la monte (crocheter, voler, forcer, se faire remarquer), chaque geste discret ou le temps qui passe la baisse. À 2 : les PNJ se ferment ou les gardes font un tour. À 3 : une conséquence écrite (porte verrouillée, rencontre, PNJ prévenu). Elle donne du poids à toute approche discrète sans ajouter une mécanique de plus par action.

## Recette d'une bonne action
1. **Ancrée dans un détail déjà vu** (examen, description, PNJ, objet) : le joueur sait pourquoi il a ce geste.
2. **Deux approches au moins qui ne se comparent pas** (discrète et lente, rapide et bruyante, par la ruse, par un objet, par un compagnon).
3. **Un gain et une perte réels** pour chaque approche ; au moins un effet que le joueur reverra.
4. **Un libellé court** à l'impératif (« Soulever. », « Suivre. ») ; l'enjeu se voit dans le texte, jamais en mots de machine (ni DD, ni jauge, ni vigilance).
5. **Un échec qui change la suite**, jamais un mur : un jet raté ouvre une autre voie, plus chère.
6. Quelques actions soignées par lieu mémorable, pas dix par pièce.

## Images, voix, sons (ce qui s'ajoute, et à quel coût)
- **Par défaut, rien de payant** : texte seul, avec l'image du lieu ou de l'objet déjà au manifeste (`media.image` vide).
- **Image propre (vignette)** : seulement pour les actions marquantes (une sur quatre au plus), prompt gardé dans `visuel`, **à générer après accord sur le coût** ; jamais de héros pré-tirés.
- **Voix** : seulement pour les résultats forts, avec la **voix officielle du Maître de jeu** (Gemini, Algieba, ×1,15) ; pas de nouvelle voix. Estimation et accord avant toute génération.
- **Sons** : un petit bruitage par geste (planche, serrure, pas dans l'escalier) piochés dans `docs/SONS.md` ; le moins cher et celui qui donne le plus de présence.

## Qui fait quoi
Claude **conçoit** (lieu, condition d'ouverture, approches, prix, ids exacts de faits lus dans le monde) ; un agent **Haiku** **écrit** les textes (résultats 50-80 mots, libellés courts) avec la bible en lecture ; Claude **relit** (pas de lore inventé, pas de secret, accents, longueurs, aucune approche dominante) et assemble le JSON.

## Ce qu'il faut décider avant de coder
1. **Nouveau module `actions` ou extension d'`evenements-choix`** (ajout de `coût`, `rejouable`, `approches`) ? Voir `ajouter-module`.
2. **Un seul outil du conteur** (`agir` avec id d'action et approche) pour que la liste reste identique d'un tour à l'autre : à vérifier avec le skill `conteur`.
3. **Vigilance** : par lieu (recommandé), par PNJ, ou par faction ? Où elle s'affiche, si elle s'affiche.
4. **Rejouable** : quelles actions se refont (guetter, se renseigner) et lesquelles sont uniques.
5. **Validateur** : avis proposés (action jamais visible, approche dominante, aucune trace, texte hors longueur).
6. **Banc d'essai** : une scène de la Marche d'Ombrefiel (lieu, 3 actions, une jauge) avant d'étendre.
