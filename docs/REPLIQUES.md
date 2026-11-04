# Répliques des compagnons

Chaque portrait de la galerie a ses propres phrases, dites par le personnage selon la situation (à la manière de Baldur's Gate). Un portrait sans fichier se tait.

## Le format

Un fichier par portrait : `packages/donnees/repliques/<portrait>.json` (le nom du fichier est l'identifiant du portrait, `elfe-f-2`).

```json
{
  "portrait": "nain-m-2",
  "caractere": "Vieux sage, sec et patient, qui en a vu d'autres ; jure par ses ancêtres.",
  "situations": {
    "debut-combat": ["Encore. À mon âge. Bon.", "…", "…"],
    "allie-tombe": ["{nom} est à terre ! Couvrez-{le|la} !", "…"]
  }
}
```

- `caractere` : la voix du personnage, tirée de la description de son portrait (`packages/donnees/visuel/galerie.json`). Elle guide l'écriture ; le conteur pourra la lire.
- Les **10 situations sont obligatoires**, au moins une phrase chacune (trois conseillées) :

| Situation | Quand | Qui parle |
| --- | --- | --- |
| `debut-combat` | au début du combat | un héros au hasard |
| `blesse` | passe sous la moitié de ses PV | le blessé |
| `grievement-blesse` | passe sous le quart de ses PV | le blessé |
| `releve` | revient de 0 PV (soin, 20 naturel) | le relevé |
| `soigne` | soigné par un allié | le soigné |
| `critique-donne` | porte un coup critique | l'attaquant |
| `critique-recu` | reçoit un coup critique | la cible |
| `ennemi-abattu` | tue un ennemi | le tueur |
| `allie-tombe` | un allié tombe à 0 PV ou meurt | un autre héros debout |
| `victoire` | le combat est gagné | un héros debout |

- Celui qui parle a un genre fixe (celui du portrait) : écrire ses accords tels quels (« je suis blessée »).
- Seule `allie-tombe` parle de quelqu'un d'autre : `{nom}` donne son nom, `{masculin|féminin}` l'accord (« Couvrez-{le|la} », « {Il|Elle} est tombé{|e} »). Ailleurs, pas d'accolades (le test le vérifie).
- Pas de phrase liée à une classe (le joueur choisit la classe librement) : la voix vient du portrait.

## Les règles du choix

Dans `apps/jeu/src/repliques-regles.ts` (chances, priorités et silences en tête du fichier) :

- une réplique au plus par commande, la situation la plus importante d'abord (allié tombé, gravement blessé, relevé, victoire, début, puis critiques, ennemi abattu, blessé, soigné) ;
- une réplique ordinaire par round pour le groupe, tous les deux rounds pour un même personnage ; les situations graves (allié tombé, gravement blessé, relevé, victoire, début) passent outre ;
- les situations courantes ne sont commentées qu'une fois sur deux ou trois ;
- pas de redite avant d'avoir dit toutes les phrases d'une situation, ni deux fois de suite la même.

Affichage : une bulle au-dessus du jeton (une à la fois, le temps de la lire) et une ligne dans le journal.

## En place

3 portraits sur 54 (pilote) : `humain-f-1`, `nain-m-2`, `tieffelin-f-1`.
