# Cris de combat des compagnons

En combat, les héros lancent de courts cris selon ce qui leur arrive (« J'ai besoin de soins ! », « Victoire ! », « Encore raté ! »), à la manière de Baldur's Gate : une bulle au-dessus du jeton, une ligne dans le journal et une voix.

**Principe (décidé avec l'utilisateur le 04/11/2026) :** un seul jeu de 10 à 15 cris, les mêmes pour tous les personnages, et **une voix par race et par genre**, la même pour tous les cris : c'est la cohérence d'une voix qui compte. Tous les portraits d'une race et d'un genre partagent sa voix. Les cris propres à chaque portrait (un premier essai, abandonné) pourront revenir plus tard en bulle seulement, sans voix.

## Les données (`packages/donnees/repliques/`)

- **`cris.json`** : les cris, par situation (au moins un chacun). Courts : 1 à 5 mots, des exclamations, pas du dialogue. Le genre de celui qui parle s'écrit `{masculin|féminin}` : « Je suis grièvement {blessé|blessée} ! ». Rien d'autre à remplir : aucun cri ne nomme quelqu'un, donc tous peuvent être enregistrés d'avance.
- **`voix.json`** : une entrée par race et par genre (`nain-f`, `elfe-m`…), 18 pour les 9 races de la galerie. `timbre` : une des 30 voix de Gemini ; `jeu` : le personnage à jouer (« nain guerrier, voix grave et rocailleuse, pince-sans-rire »). Le portrait d'un héros (`elfe-f-2`) donne sa voix (`elfe-f`). Un test vérifie que chaque race a ses deux voix, toutes de timbre différent.

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
| `rate` | rate une attaque (commenté une fois sur quatre) | l'attaquant |
| `rate-encore` | rate alors que sa précédente attaque avait déjà raté | l'attaquant |
| `victoire` | le combat est gagné | un héros debout |

## Les règles du choix

Dans `apps/jeu/src/repliques-regles.ts` (chances, priorités et silences en tête du fichier) :

- une réplique au plus par commande, la situation la plus importante d'abord (allié tombé, gravement blessé, relevé, victoire, début, puis critique reçu ou donné, ennemi abattu, encore raté, blessé, soigné, raté) ;
- une réplique ordinaire par round pour le groupe, tous les deux rounds pour un même personnage ; les situations graves passent outre ;
- les situations courantes ne sont commentées qu'une fois sur deux ou trois ;
- pas de redite avant d'avoir dit tous les cris d'une situation (par personnage), ni deux fois de suite le même.

Un personnage dont le portrait n'est pas de la galerie ne parle pas.

## Les voix

Les cris sont dits par **Gemini 3.8 Flash TTS** (via OpenRouter), réglage choisi à l'oreille avec l'utilisateur : le style (`jeu` de la voix + le ton de la situation, par exemple « crie à l'aide, à bout de souffle ») est transmis à part et n'est pas lu ; débit accéléré ×1,25, pauses raccourcies. Le premier essai avec gpt-audio avait été jugé « robotique ».

```bash
pnpm repliques lister                          # les voix, et combien de cris sont livrés
pnpm repliques voix nain-f                     # simulation : cris et style, aucun appel
pnpm repliques voix tous --livrer --go         # génération payante (≈ 0,0005 $ par cri, plafond 0,05 $ par défaut)
pnpm repliques convertir nain-f --tempo 1.2    # refait les MP3 depuis l'audio brut gardé, gratuit
```

Les prises vont dans `sorties/voix-repliques/<voix>/` (hors de git, avec l'audio brut) ; avec `--livrer`, les MP3 sont copiés dans `apps/jeu/src/voix/<voix>/<situation>-<n>.mp3`. Un cri déjà livré n'est pas refait (`--refaire`). Le jeu (`apps/jeu/src/voix.ts`) dit le cri quand sa bulle apparaît, sur le canal des bruitages (bouton 🔊) ; sans fichier, la bulle reste muette.

Avant la vente : vérifier la licence d'usage commercial des voix de Gemini via OpenRouter.
