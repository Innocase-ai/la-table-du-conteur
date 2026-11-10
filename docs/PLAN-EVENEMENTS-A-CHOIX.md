# Plan : les « événements à choix illustrés »

> Document de travail du 10/11/2026, **à valider avant tout code**. Rien n'est implémenté.

## 1. Ce que l'utilisateur veut (trois captures d'un autre jeu)

1. Une **grande illustration plein cadre** d'un lieu (une mare d'un bleu étrange dans une caverne), avec dessous une **boîte de texte sombre** qui raconte d'abord une courte scène.
2. Puis une **liste de choix numérotés** : un choix général (« Buvez à l'étang. »), des choix **réservés à un héros selon son espèce ou sa classe**, préfixés de son origine (« (Limacien) "Laissez-moi tester la sensation." », « (Sorcier) "Vérifier les traces magiques." »), et « Partir ».
3. Après un choix : la boîte montre le **résultat**, et il ne reste que « Partir ».

Les choix d'origine ne s'affichent que si un héros du groupe correspond : c'est ce qui donne au joueur le sentiment que **son groupe** compte.

## 2. État des lieux : ce qui existe et ce qui manque

| Brique | Ce qu'elle fait | Pourquoi elle ne suffit pas |
|---|---|---|
| **Dilemmes** (`modules/dilemmes.ts`) | Choix difficile : options avec `condition`, `jet` + `echec`, `effets`, abstention, délai, échos, épilogue | Pensé pour la **décision lourde** : coût et gain obligatoires, abstention, échos, chronique. Affiché dans le **panneau d'actions** (boutons), sans image ni boîte de texte, et **sans texte de résultat** (seulement des effets). Trop de cérémonie pour une mare dans une grotte. |
| **Examens** (`modules/examens.ts`) | Détail à regarder de près ; `variantes` ; `regards` d'origine (`condition.heros`) | Une seule lecture, pas de **choix** ; les regards d'origine ne font que s'ajouter une phrase. |
| **Scènes narrées** (`modules/scenes.ts`, `LecteurScene.tsx`) | Plans image + texte + voix, déclenchées par lieu, quête, fait, fin | Linéaires : aucun choix. |
| **Rencontres sociales** | Alternatives avec `jet`, `condition` | Écran de rencontre (monstres, combat) ; pas de narration illustrée ni de choix d'origine. |
| **Condition `heros`** | `{ heros: { espece, classe, historique } }`, vraie si un héros correspond ; `etat.heros[i]` suit `groupe[i]` | Existe déjà et **suffit** pour les choix d'origine. |
| **`testLibre(..., personnage)`** | Jet d'un héros précis | Permet de faire jouer **le héros concerné** (le Nain goûte, le Magicien analyse). |
| **Mémoire du groupe** (`rencontre`, `parle`, `temoin`, `lieu`) | Conditions lisibles partout | Utilisables telles quelles dans `quand` et dans la `condition` d'un choix. |
| **Écran** (`EcranAventure.tsx`, `BoiteDialogue.tsx`) | Image du lieu + boîte de dialogue numérotée (touches 1 à 9, Échap) | La **boîte de dialogue est déjà le bon patron** visuel ; il faut une variante « événement » (image grande, narration, choix, résultat, Partir). |

Conclusion : l'essentiel des briques existe. Il manque **un module** (données + états + commandes) et **un écran**.

## 3. Décision de conception recommandée

**Un nouveau dossier `evenements-choix/` (module `evenementsChoix`), et non une extension des dilemmes.**

- Un dilemme est un **poids moral** (coût, gain, abstention, délai, écho, chronique). Un événement à choix est un **tableau** : une découverte, une ambiance, des réactions de héros, un résultat. Les deux ont des enjeux différents ; fusionner imposerait aux auteurs des coûts, gains et échos qui n'ont pas de sens pour une mare.
- Les deux se **complètent** : un événement peut poser un drapeau qui ouvre un dilemme, et un dilemme peut renvoyer au lieu d'un événement.
- On **réutilise** sans copier : `Condition`, `EffetMonde`, le même format de `jet` + `echec`, `testLibre`, `jouerEffets`, `verser`.
- Le nom `evenements/` est déjà pris (déclencheurs narratifs du format de base) ; d'où `evenements-choix/`.

## 4. Le format d'un événement

```json
{
  "id": "la-source-grise-miroir",
  "titre": "La source grise",
  "lieu": "gro-loups-source",
  "quand": { "rencontre": { "id": "<rencontre de la grotte>", "issue": "victoire" } },
  "ouverture": "entree",
  "rejouable": null,
  "image": { "groupe": "lieux", "id": "gro-loups-source" },
  "narration": "70 à 110 mots : ce que le groupe voit, sent, entend ; jamais de secret.",
  "variantes": [ { "condition": { "fait": "f-…" }, "narration": "ce qu'on lit quand on sait déjà…" } ],
  "choix": [
    { "id": "boire", "libelle": "Buvez à la source.",
      "jet": { "competence": "medecine", "dd": 12 },
      "effets": [ { "fait": "f-…" } ], "resultat": "50 à 80 mots : ce qui arrive.",
      "echec": [ { "jauge": { "id": "…", "delta": 1 } } ], "resultatEchec": "50 à 80 mots : ce qui arrive en cas d'échec." },
    { "id": "pierre", "condition": { "heros": { "espece": "nain" } },
      "libelle": "« Laissez-moi goûter la pierre autour de l'eau. »",
      "effets": [ { "fait": "f-…" } ], "resultat": "…" },
    { "id": "analyse", "condition": { "heros": { "classe": "magicien" } }, "origine": "Magicien", "libelle": "« Je cherche des traces magiques dans l'eau. »", "resultat": "…" }
  ],
  "partir": "Quitter la caverne."
}
```

- **`lieu`** : l'événement se joue là. **`quand`** : condition facultative (n'importe quelle `Condition` : fait, quête, drapeau, `rencontre`, `parle`, `temoin`, `heros`…). **`visuel`** (facultatif) : prompt d'illustration, **sans personnage ni héros pré-tiré** (règle du projet).
- **Déclencheur (`ouverture`)** :
  - `"entree"` (défaut) : l'écran s'ouvre **tout seul** dès que le groupe est dans le lieu et que `quand` est vrai (à l'arrivée, ou dès que la condition devient vraie sur place, par exemple après le combat). Il ne s'ouvre jamais pendant un combat, une conversation ou une scène narrée : il attend la fin.
  - `"bouton"` : une proposition « Regarder de plus près : la source grise » dans le panneau « Ici », à la main du joueur.
  - « Partir » sans avoir choisi **ne perd rien** : l'événement reste en attente et devient un bouton « Revenir à : … ».
- **Une fois ou rejouable** : `unique` par défaut. `"rejouable": "jour"` le rouvre chaque jour de jeu (une fontaine qui soigne, un autel) ; les effets s'appliquent à chaque fois.
- **Choix** : 2 à 6, plus « Partir » (toujours présent, jamais écrit en données sauf son libellé `partir`).
  - **Choix général** : sans `condition` d'origine.
  - **Choix d'origine** : `condition` contenant `heros` (espèce, classe ou historique, seuls ou combinés ; le **même** héros doit tout avoir). Le jeu **préfixe le libellé** de l'origine entre parenthèses, tirée du SRD : `(Nain)`, `(Magicien)`, `(Nain Magicien)`, `(Sage)`. Le champ `origine` la remplace si l'auteur la veut autre. Le choix est **caché** tant qu'aucun héros vivant ne correspond.
  - **Qui agit** : pour un choix d'origine, **le héros concerné** (le premier vivant qui correspond) fait le jet (`testLibre(…, personnage)`) et est nommé dans le résultat ; pour un choix général, le meilleur du groupe, comme les dilemmes.
  - Un choix peut aussi avoir une `condition` quelconque (un objet, un PNJ témoin d'un combat) : il s'affiche alors sans préfixe ; et `requis` + `requisTexte` (grisé : « Il vous faut une corde »).
  - `libelle` : le **choix général** est un geste à l'impératif (« Buvez à la source. »), le **choix d'origine** une réplique du héros entre guillemets.
- **Jet et échec** : même règle que les dilemmes, **un jet raté ne bloque jamais** : `jet` impose `echec` (effets) et `resultatEchec` (texte), différent de la réussite et non « la même chose en moins bien ».
- **Résultat** : `resultat` (50 à 80 mots), des `effets` (fait, drapeau, objet, pièces, XP, attitude, jauge, PNJ, rencontre, quête, fin, tout ce que le format de base permet). Un effet `rencontre` lance le combat **après** que le joueur a quitté l'écran.
- **Mémoire** : le jeu pose les drapeaux `evt-<id>` et `evt-<id>-<choix>` (comme `choix-<dilemme>…`), lisibles partout (salutations, sujets, dilemmes, fins, autres événements). Le choix, le héros qui a agi, le résultat du jet et le jour sont gardés dans l'état (`evenementsChoix.resolus`).

## 5. L'affichage (`apps/jeu`)

Un écran plein cadre `EcranEvenement.tsx`, même famille que `LecteurScene` (fenêtre posée sur l'aventure) et **même habillage que la boîte de dialogue** (cadre cuivre, fond sombre) :

```
┌────────────────────────────────────────┐
│                                        │
│     GRANDE ILLUSTRATION (image du      │
│     lieu, ou illustration propre)      │
│                                        │
├────────────────────────────────────────┤
│  Titre de l'événement                  │
│  Au fond de la caverne, vous tombez…   │   ← phase 1 : narration + choix
│  ─────────────────────────────────     │
│  1. Buvez à la source.                 │
│  2. (Nain) « Laissez-moi goûter… »     │
│  3. (Magicien) « Je cherche… »         │
│  4. Partir                             │
└────────────────────────────────────────┘
```

- **Phase 1** : narration (variante selon `variantes`) et choix numérotés (touches 1 à 9 ; Échap = Partir). Un choix grisé montre sa raison au survol. Un choix à `jet` indique la compétence (« [Médecine, DD 12] ») comme les dilemmes.
- **Phase 2** : la boîte montre le **résultat** (texte de réussite ou d'échec), la ligne de jet (« Pip — Médecine : 14 contre DD 12, réussi »), les constats utiles (« Vous gagnez 40 po », « Vous apprenez : … ») et **seulement « Partir »**.
- **À la sortie** : l'événement est consigné dans le **journal** (narration, choix, résultat) ; le récit d'aventure et la **mémoire du conteur** en profitent (les 14 derniers événements). Une section « Événements vécus » rejoint le Journal (titre, choix, jour).
- **Les images** : `image` désigne une image déjà au manifeste (lieu, PNJ, monstre, objet), **par défaut celle du lieu** : donc **gratuit et immédiat**, et l'exemple du Val a déjà la sienne. Une illustration propre à l'événement (nouveau groupe `evenements` du manifeste, champ `visuel`, `pnj images`) viendra **séparément, après ton accord sur le coût** ; jamais de héros pré-tirés dedans.
- **Voix** : aucune au début. Les scènes narrées gardent leur voix officielle ; une lecture des narrations d'événements (Gemini, Algieba, ×1,15) est possible plus tard, après accord sur le coût.

## 6. Le moteur (`packages/regles`)

- `monde/evenements-choix-donnees.ts` : schéma Zod (`EvenementChoix`, `ChoixEvenement`), `evenementsChoixDe(dm)` (cache, erreurs), helpers purs : `libelleOrigine(condition, srd)`, `herosQuiCorrespondent(etat, groupe, condition)`.
- `modules/evenements-choix.ts` : état `{ resolus: Record<id, { choix, jour, heros?, reussite? }>, courant?: { id, resultat? } }` ; réactions `arrivee`, `deplacement`, `faitAppris`, `queteMiseAJour`, `rencontreTerminee` qui ouvrent un événement dont `quand` devient vrai (si on est en exploration) ; commandes `ouvrirEvenement`, `choisirEvenement`, `quitterEvenement` (pas des outils du conteur : comme `trancher`, le conteur raconte, le joueur choisit ; la liste d'outils reste identique pour le cache de prompt) ; vue `evenementEnCours` ; encart Journal « Événements vécus » ; `valider` et `conseils`.
- Enregistrement dans `modules/index.ts`, pris en compte par `drapeauxDesEvenements` dans le validateur du monde (comme `drapeauxDesDilemmes`).
- Anciennes sauvegardes : état absent = aucun événement résolu (`??=`), comme les autres modules.

## 7. Intégration avec la mémoire du groupe

- `quand` et la `condition` d'un choix lisent **sans drapeau manuel** : `{ rencontre: { id, issue } }` (l'événement de la source ne s'ouvre qu'une fois la meute vaincue ou apaisée), `{ parle: pnj }`, `{ temoin: … }`, `{ lieu }`, `{ heros }`.
- Les événements **écrivent** dans la mémoire par leurs drapeaux `evt-…` : un PNJ peut ensuite réagir à « le groupe a bu à la source » (salutation variante, sujet, interjection).
- À faire ensuite, petit : une ligne « événements vécus » dans `dossierDuGroupe` (`conteur/memoire.ts`) pour que le conteur et les PNJ en tiennent compte (il ne l'invente pas).

## 8. Comment un auteur l'écrit

- **Skill `creer-evenements-choix`** (dans `.claude/skills/`), sur le modèle de `creer-dilemmes` : quand en écrire (un lieu mémorable par zone, trois à cinq par histoire), recette d'un bon événement (une découverte concrète, un choix général, **deux ou trois choix d'origine différents**, un risque réel, jamais de bonne réponse unique), brief Haiku, relecture par Claude.
- **Cibles de texte** (règles du projet) : narration 70 à 110 mots, résultat 50 à 80, réplique d'origine d'une phrase ; accents vérifiés ; pas de secret, pas de lore inventé.
- **Validateur** (`pnpm monde valider`) : erreurs (lieu inconnu, id en double, choix en double, jet sans `echec`/`resultatEchec`, condition ou effet vers un id inconnu, image inconnue, moins de 2 choix) ; conseils (narration hors 40 à 150 mots, résultat hors 30 à 110, aucun choix d'origine, aucun choix avec effet mesurable, événement jamais déclenchable).
- Complétude (`pnpm monde manque`) : à étendre plus tard (lieux « à événement » sans illustration propre).

## 9. Exemple complet : « La source grise » (Val des Cendres, grotte des Loups-Gris)

Lieu `gro-loups-source` (une source tiède voilée de filaments gris, des louveteaux au creux de la roche, déjà illustrée). L'événement s'ouvre quand la meute a été vaincue ou apaisée (`rencontre`, l'id exact sera lu dans le monde). Choix prévus :

1. **Général** : « Buvez à la source. » (jet de Médecine DD 12 : réussi, l'eau est sans danger et on apprend d'où vient le gris ; raté, une nausée coûte un peu).
2. **(Nain)** « Laissez-moi goûter la pierre autour de l'eau. » : il reconnaît la cendre dissoute (un fait).
3. **(Magicien)** « Je cherche des traces magiques dans l'eau. » : rien de magique, mais autre chose.
4. **(Druide)** « Je m'accroupis près des louveteaux. » : une attitude, une trace de la meute.
5. **Partir.**

Les textes seront écrits par des agents Haiku (briefs précis : lieu, faits permis, choix, effets), puis relus par Claude contre la bible du Val (pas de lore inventé, pas de secret). Les faits, drapeaux et jauges cités seront pris **dans le monde existant**, pas inventés.

## 10. Plan de réalisation (après ton accord)

1. Données + module + commandes + vue + validation, avec **tests** (`packages/regles/tests/evenements-choix.test.ts` : ouverture, choix d'origine visible / caché, héros qui agit, jet réussi / raté, effets et drapeaux, unique / rejouable, « Partir » sans choisir, ancienne sauvegarde).
2. Écran `EcranEvenement.tsx` + CSS + règles pures testées (`evenement-regles.ts` : libellés, touches).
3. Skill, `docs/MONDES.md` (nouvelle section), `docs/JOURNAL.md`, `CLAUDE.md` (liste des skills).
4. L'exemple du Val (écrit par Haiku, relu).
5. Vérification : `pnpm typecheck`, `pnpm --filter jeu typecheck`, `pnpm test`, `pnpm monde valider`, puis jeu dans le navigateur (onglet fermé ensuite).
6. Je te propose le commit ; rien n'est poussé sans accord.

**Coût** : aucune dépense d'API pour ce chantier (les agents Haiku sont des sous-agents de l'outil, pas des appels facturés à ton compte OpenRouter ; l'image de l'exemple existe déjà). Une illustration propre à l'événement et une voix sont possibles plus tard, chacune après chiffrage et accord.

## 11. Décisions à prendre avec toi

1. **Nouveau module `evenements-choix/`** (recommandé) ou extension des dilemmes ?
2. **Ouverture automatique** à l'arrivée quand la condition est vraie (recommandé, comme dans les captures), avec bouton « Revenir à… » si on part sans choisir ?
3. **Narration et choix sur le même écran** (recommandé) ou narration seule d'abord, puis un clic « Continuer » avant les choix (comme tes captures 1 et 2) ?
4. **Image de v1 = celle du lieu** (gratuit), l'illustration propre à l'événement après devis ?
5. **Exemple** : « La source grise » de la grotte des Loups-Gris (Val des Cendres) ?
6. **`rejouable: "jour"`** : à garder dans la première version ou plus tard ?
