---
name: creer-evenements-choix
description: Écrire, relire ou régler les événements à choix illustrés d'un monde de « La Table du Conteur » : dossier `evenements-choix/`, un tableau (grande image, narration, choix généraux, choix réservés à l'origine d'un héros du groupe, résultat, « Partir »). À utiliser quand l'utilisateur veut « un événement », « un tableau », « un écran à choix comme dans un RPG », « des choix selon l'espèce ou la classe », « une découverte avec plusieurs façons de réagir », ou qu'un avis du validateur parle d'« événement à choix ». Complète `creer-dilemmes` (choix lourd) et `creer-monde`.
---

# Écrire des événements à choix illustrés

Un **événement à choix** est un *tableau* : le groupe tombe sur quelque chose (une mare aux eaux étranges, une porte, un cadavre, un autel), l'écran montre une grande image et une boîte de texte, le joueur choisit comment réagir, lit le résultat, puis part. Les choix peuvent être **propres à l'origine d'un héros du groupe** (« (Nain) « Laissez-moi goûter la pierre. » ») : ils ne s'affichent que si un héros vivant correspond. Module `packages/regles/src/modules/evenements-choix.ts`, format `packages/regles/src/monde/evenements-choix-donnees.ts`, écran `apps/jeu/src/aventure/EcranEvenement.tsx`, plan de conception `docs/PLAN-EVENEMENTS-A-CHOIX.md`, format détaillé `docs/MONDES.md` § « Les événements à choix ».

**Pas un dilemme.** Un dilemme est un choix lourd (coût et gain affichés, abstention, délai, échos, chronique) : voir `creer-dilemmes`. Un événement est une découverte à petit ou moyen enjeu, avec un texte de résultat. Un événement peut poser un drapeau (`evt-<id>-<choix>`) qui ouvre un dilemme.

## Le format
```json
{
  "id": "la-source-grise", "titre": "La source grise", "lieu": "gro-loups-source",
  "quand": { "rencontre": { "id": "gro-r-loups-salle-de-la-meute", "alternative": "apaiser" } },
  "ouverture": "entree",
  "image": { "groupe": "lieux", "id": "gro-loups-source" },
  "narration": "70 à 110 mots : ce que le groupe voit, sent, entend ; jamais de secret.",
  "variantes": [ { "condition": { "fait": "f-…" }, "narration": "60 à 90 mots : la même scène, lue par qui sait déjà." } ],
  "choix": [
    { "id": "boire", "libelle": "Buvez à la source.", "jet": { "competence": "medecine", "dd": 11 },
      "effets": [ { "fait": "f-…" }, { "xp": 25 } ], "resultat": "50 à 80 mots.",
      "echec": [ { "flag": "…" } ], "resultatEchec": "50 à 80 mots." },
    { "id": "nain", "condition": { "heros": { "espece": "nain" } }, "libelle": "« Laissez-moi goûter la pierre. »",
      "effets": [ { "flag": "…" } ], "resultat": "50 à 80 mots." }
  ],
  "partir": "Laisser les louveteaux dormir et repartir."
}
```
- **`lieu`** : où il se joue. **`quand`** : une `Condition` (fait, quête, drapeau, **mémoire du groupe** `rencontre` / `parle` / `temoin` / `lieu`, `heros`…). **`ouverture`** : `entree` (défaut) s'ouvre tout seul dès que le groupe est là et que `quand` est vrai ; `bouton` : une action « Regarder de plus près » du panneau Ici. Partir sans choisir ne perd rien : un bouton « Revenir à ce moment » ramène à l'événement. Il ne se joue **qu'une fois** (la rejouabilité est reportée).
- **`image`** : une image déjà au manifeste (`lieux`, `pnj`, `monstres`, `objets`) ; par défaut celle du lieu. `visuel` (facultatif) garde le prompt d'une illustration propre, à générer plus tard **après accord sur le coût** ; jamais de héros pré-tirés dedans.
- **Choix** : 2 à 6, plus « Partir » toujours présent.
  - **Choix général** (sans `heros`) : un geste à l'impératif (« Buvez à la source. »).
  - **Choix d'origine** : `condition` avec `heros` (espèce, classe, historique, seuls ou ensemble : le **même** héros doit tout avoir). Le jeu préfixe **`(Nain)`** (nom SRD ; `origine` pour dire autre chose) ; caché sans héros vivant correspondant ; **ce héros agit** (c'est lui qui fait le jet, il est nommé dans le résultat). Le libellé est une **réplique du héros entre guillemets** (« … »).
  - **Condition quelconque** (objet, PNJ témoin d'un combat…) : choix sans préfixe. **`requis` + `requisTexte`** : grisé (« Il vous faut une corde »).
  - **Jet** : un jet raté ne bloque jamais, `jet` impose `echec` (effets) **et** `resultatEchec` (texte), différents de la réussite.
- **Mémoire** : le jeu pose `evt-<id>` et `evt-<id>-<choix>`, lisibles partout (salutations variables, sujets, examens, interjections, dilemmes, fins). Le Journal garde « Événements vécus ».

## Recette d'un bon événement
1. **Une découverte concrète**, ancrée dans un lieu déjà décrit (reprendre ses détails, ne rien inventer qui contredise la bible).
2. **Un choix général** que tout groupe peut faire, **et deux ou trois choix d'origine différents** (nain : pierre, métal, voûtes ; magicien : trace magique ; druide : bêtes, plantes ; roublard : mécanisme, serrure ; clerc : sacré, mort-vivant ; barbare, guerrier : force, flair du danger). Les choix d'origine apportent un **regard** (détail concret en plus), pas un « meilleur » résultat ; aucun n'ouvre de secret ni de solution d'énigme.
3. **Un risque réel** sur au moins un choix (jet avec échec qui coûte quelque chose, même petit) ; au moins un effet que le joueur reverra (fait appris, drapeau lu plus loin, XP, PNJ, objet).
4. **Aucune bonne réponse unique** : si un choix domine, réécrire.
5. **Jamais de héros pré-tiré** dans l'image ni le texte (Bran, Grukk, Pip…) ; le texte dit « vous », le héros qui agit est nommé par le jeu.
6. Trois à cinq événements par histoire, dans des lieux mémorables (une par zone au plus).

## Qui fait quoi
Claude **conçoit** (lieu, condition, choix, jets, effets, ids exacts de faits et de rencontres lus dans le monde) ; un agent **Haiku** **écrit** les textes (narration 70-110 mots, variante 60-90, résultats 50-80 mots, libellés d'origine d'une phrase) avec la bible en lecture ; Claude **relit** (pas de lore inventé, pas de secret, accents, longueurs) et assemble le JSON. Modèle : `packages/mondes/val-des-cendres/evenements-choix/z3-source-grise.json`.

## Vérifier
`pnpm monde valider <monde>` : erreurs (lieu, image, fait, rencontre inconnus ; id ou choix en double ; jet sans `echec` ni `resultatEchec` ; tous les choix réservés à une origine ; condition `heros` invalide) et conseils (narration hors 40 à 150 mots, résultat hors 30 à 110, aucun choix d'origine, choix sans effet, `quand` jamais vrai). Test modèle : `packages/regles/tests/evenements-choix.test.ts`. Puis dans le jeu (`pnpm jeu`) : l'événement s'ouvre-t-il au bon moment ? Les choix d'origine n'apparaissent-ils qu'avec un héros correspondant ? Le résultat et « Partir » s'affichent-ils ? Les touches 1 à 9 et Échap marchent-elles ?

## Pièges connus
- L'événement s'ouvre seulement en exploration : pendant un combat, une conversation ou une scène narrée, il attend la fin.
- Les origines suivent l'ordre du groupe à la création (`etat.heros`) : une ancienne sauvegarde sans origines ne voit jamais les choix réservés.
- Le conteur IA ne choisit jamais (commandes hors conteur) : il raconte, le joueur choisit.
- Une condition `quand` qui ne peut jamais être vraie (drapeau jamais posé) : le validateur le signale.
