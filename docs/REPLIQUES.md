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

Dans `apps/jeu/src/repliques-regles.ts` (chances, priorités, silences et attentes en tête du fichier) :

- **cohérence avec celui qui parle** (`convient`) : un héros gravement blessé (sous le quart de ses PV) ne crie ni victoire, ni cri de guerre, ni triomphe sur un critique ; « Aïe, ça fait mal ! » ne se dit qu'entre la moitié et le quart des PV ; « gravement blessé » seulement sous le quart. Si personne ne convient, personne ne parle ;
- **cohérence avec ce qui s'est passé** : « Raté ! » seulement si le coup a vraiment raté, c'est-à-dire sans dégâts sur la cible (une botte comme l'Écorchure blesse même sur un raté) ; « Encore raté ! » seulement si la précédente attaque du même héros avait aussi vraiment raté ;
- **pas tous en même temps** : au plus 2 répliques par round (la victoire passe toujours) ; une seule bulle et une seule voix à la fois, avec 0,7 s de silence entre deux ; un cri qui devrait attendre plus que sa limite (0,3 s pour les situations courantes, 1,5 s pour les graves, jamais pour la victoire) n'est pas dit du tout : mieux vaut se taire qu'arriver après le coup suivant. Le journal ne note que les cris vraiment dits ;
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

## Phrases plus longues (histoires)

Les 18 voix (timbre et personnage dans `voix.json`) ne servent pas qu'aux cris : `pnpm repliques dire <voix> "<texte>" --ton "…"` lit n'importe quelle phrase avec la voix d'une race, pour une histoire ou un dialogue. Ce sont les mêmes timbres, donc la même voix que les cris du même personnage. Le débit est naturel par défaut (×1 : le ×1,25 des cris est fait pour l'action) et les pauses de la phrase sont gardées. Sans `--go`, c'est une simulation ; la prise est enregistrée dans `sorties/voix-repliques/<voix>/histoire-….mp3` (`--sortie` pour la copier ailleurs). Le `--ton` change selon la scène (« grave, lent, solennel », « chuchoté »). Pour qu'une voix reste identique d'une scène à l'autre, ne pas changer son timbre : c'est lui qui fait la cohérence.

Avant la vente : vérifier la licence d'usage commercial des voix de Gemini via OpenRouter.

## Ouvertures de conversation des PNJ

Quand le joueur adresse la parole à un PNJ, celui-ci lance d'abord une courte phrase (« Bien le bonjour, voyageurs. Que puis-je pour vous ? »), tirée d'un fonds **commun à toutes les histoires**, puis vient sa salutation propre (écrite par l'auteur). Décidé avec l'utilisateur le 07/11/2026.

- **Les textes** : `packages/donnees/repliques/ouvertures.json`, 30 phrases en trois tons (10 neutres, 10 amicales, 10 méfiantes), l'accord de genre du PNJ qui parle s'écrit `{ravi|ravie}`. Pas de lieu, de métier ni d'heure : elles vont à n'importe quel PNJ.
- **Le ton** suit l'attitude du PNJ (`tonDeLAttitude`, seuils de `dialogue.ts`) : hostile → méfiant, dévoué → amical ; entre les deux, 70 % neutre, sinon amical ou méfiant selon le côté où penche l'attitude. Jamais deux fois de suite la même phrase.
- **Les voix** : douze, choisies à l'oreille avec l'utilisateur (Gemini Flash TTS via OpenRouter) : six d'homme (`m-charon`, `m-umbriel`, `m-sadaltager`, `m-aubergiste`, `m-bonhomme`, `m-sage`) et six de femme (`f-despina`, `f-callirrhoe`, `f-erinome`, `f-commere`, `f-guerisseuse`, `f-matrone`). Le genre du PNJ (`sexe`) donne le genre de la voix ; **la voix est toujours la même pour un PNJ** (d'après son identifiant) et varie d'un PNJ à l'autre. Un PNJ de genre N garde toujours le même genre de voix, tiré de son identifiant. **Selon l'âge** : quatre voix ont un âge minimum (`ageMin` : aubergiste 35, matrone 40, vieux sage 50, guérisseuse 50) ; l'âge d'un PNJ est lu dans son texte libre (`ageApproximatif` : « 52 ans », « trente-cinq ans », « une cinquantaine d'années » ; rien pour « mort depuis deux siècles » ou au-delà de 100 ans), et un jeune PNJ n'a jamais une voix de vieux.
- **Les fichiers** : `apps/jeu/src/voix/ouvertures/<voix>/<ouverture>.mp3` (360 : 12 voix × 30 phrases), faits par l'outil :

```bash
pnpm ouvertures lister                              # ouvertures, voix, fichiers livrés
pnpm ouvertures essai [--types] [--go]              # une même phrase par six timbres, pour choisir à l'oreille
pnpm ouvertures generer --livrer --go               # génération payante (≈ 0,00075 $ la phrase, plafond 0,05 $ par défaut, --plafond pour le relever)
pnpm ouvertures generer m --voix m-sage --refaire --livrer --go   # refaire une voix
```

- **Dans le jeu** (`EcranAventure.tsx`) : à chaque début de conversation, la phrase s'affiche en tête de la boîte de dialogue (au nom du PNJ) et se dit à voix haute, sur le canal des bruitages. Règles pures et testées : `apps/jeu/src/ouvertures-regles.ts`.
- **Coût** : 12 essais de timbres (≈ 0,01 $), 360 phrases (≈ 0,27 $). Avant la vente : vérifier la licence d'usage commercial des voix de Gemini via OpenRouter.
