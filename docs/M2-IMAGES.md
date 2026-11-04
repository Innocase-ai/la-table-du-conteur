# M2 — Comparaison des services d'images

But : choisir le service qui illustre le mieux le jeu, en mesurant **le style, la ressemblance des héros d'une image à l'autre, le délai et le coût**. Claude ne génère pas d'images : le jeu passera par l'API d'un service.

## Principe : jamais de héros fixes dans le produit

Le groupe est **créé par le joueur** : le jeu ne sait pas à l'avance qui il a choisi. Les 6 héros pré-tirés (Bran, Grukk, Pip, Sylvaine, Hilda, Ambrine) ne servent qu'au lot de test ci-dessous ; **le produit ne génère jamais d'image avec eux**. En production :

- **La galerie de portraits** (54 : 9 espèces × 2 sexes × 3) est pré-générée, sans équipement de classe : c'est le seul contenu de héros fait à l'avance.
- **Les scènes avec le groupe** sont construites **à l'exécution** depuis les personnages du joueur : espèce, sexe, classe, équipement visible (armure, armes, symbole sacré…) tirés de la fiche, avec le **portrait de galerie qu'il a choisi** comme image de référence. Le MJ illustrateur choisit quels personnages apparaissent dans la scène.
- **Pré-générables** : les PNJ, les monstres et les lieux d'un monde, d'après les champs `apparence` et `visuel` de ses données.

## Le lot de test (identique pour chaque service)

10 images, décrites dans `packages/donnees/visuel/charte.json` (charte graphique, fiches visuelles des 6 héros, 2 monstres, 4 scènes) :

| Groupe | Images | Ce que ça teste |
| --- | --- | --- |
| Portraits | Bran, Grukk, Pip, Sylvaine, Hilda, Ambrine | Qualité et style ; ces images servent ensuite de références |
| Embuscade | les 6 héros, goblins et loup | Cohérence d'un **groupe entier** à partir de 6 références, scène d'action |
| Crypte | Bran, Hilda, Ambrine | Cohérence d'un petit groupe, éclairage complexe |
| Taverne | Pip seule | Cohérence d'un **visage** en plan rapproché, scène de dialogue |
| Chef gobelin | aucune référence | Qualité d'un monstre, sans contrainte de ressemblance |

Les scènes reçoivent les portraits **du même service** comme références, puisque c'est ainsi que le jeu fonctionnera.

## Passage par OpenRouter

Une **seule clé** (`OPENROUTER_API_KEY`), une seule API (`POST https://openrouter.ai/api/v1/images`) et un seul crédit prépayé donnent accès à une soixantaine de modèles d'images, dont FLUX, Gemini et gpt-image. Le coût réel de chaque image est renvoyé dans la réponse (`usage.cost`) et enregistré par l'outil. Changer de modèle ne demande plus ni nouveau compte ni nouvelle clé : seulement un autre identifiant.

Modèles comparés par défaut (alias de l'outil). Les références maximales viennent des endpoints OpenRouter ; les prix sont ceux affichés par OpenRouter le 02/11/2026 (à revérifier sur la page du modèle) :

| Alias | Modèle OpenRouter | Références max | Prix indicatif |
| --- | --- | --- | --- |
| `flux2` | `black-forest-labs/flux.2-pro` | 8 | 0,03 $ / mégapixel (soit ~0,03 à 0,05 $ l'image) |
| `flux3` | `black-forest-labs/flux-3-image` | 10 | 0,048 $ en 1K, 0,07 $ en 1,5K |
| `klein` | `black-forest-labs/flux-3-image-klein` | 10 (supposé) | modèle à poids ouverts, environ 5 fois moins cher que FLUX 3 Image (tarif catalogue) |
| `gemini` | `google/gemini-nano-banana-2.1` | 14 | facturé au jeton |
| `gemini-pro` | `google/gemini-3-pro-image` | 14 | facturé au jeton, plus cher |
| `gpt-image` | `openai/gpt-image-2.5-sunburst` | 16 | facturé au jeton (qualité `medium`) |

N'importe quel autre modèle se teste avec son identifiant, par exemple `pnpm images generer bytedance-seed/seedream-5-0-pro --go`. La liste est sur https://openrouter.ai/models?output_modalities=image.

Budget : **de l'ordre de 0,3 à 1,5 $ par modèle** pour les 10 images. Le garde-fou `--max` (12 par défaut) empêche de dépasser le lot par erreur.

Choix de l'utilisateur (02/11/2026) : commencer par **FLUX.2**, via OpenRouter.

## Mode d'emploi

1. Crée un compte sur https://openrouter.ai, ajoute quelques crédits (« Credits ») et crée une clé API (« Keys »). Le compte, le paiement et la clé sont à faire par toi.
2. `cp .env.example .env` puis renseigne `OPENROUTER_API_KEY`. `.env` est ignoré par git ; **ne colle jamais la clé dans une conversation**.
3. Vérifie sans rien dépenser :
   ```bash
   pnpm images lister            # prompts, lot et alias
   pnpm images generer flux2     # simulation, aucun appel
   ```
4. **Premier essai prudent** : une seule image, pour valider l'appel et voir le coût réel.
   ```bash
   pnpm images generer flux2 --id portrait-bran --go
   ```
5. Les portraits, puis les scènes (qui prennent les portraits comme références), modèle par modèle :
   ```bash
   pnpm images generer flux2 --lot portraits --go
   pnpm images generer flux2 --lot scenes --go
   ```
   L'outil s'arrête à la première erreur (inutile de répéter un appel qui échoue). Les images déjà générées ne sont pas refaites.
6. `pnpm images comparer` écrit `sorties/images/comparaison.html` : une ligne par image, une colonne par modèle, avec délai et coût.

## Critères de choix

| Critère | Mesure |
| --- | --- |
| Ressemblance | Les héros sont-ils reconnaissables d'un portrait à l'autre, et dans le groupe ? (note de 1 à 5, à la main) |
| Style | Respect de la charte (peinture dark fantasy, pas de texte parasite) |
| Délai | Secondes par image (affiché dans la page) |
| Coût | Dollars par image, puis par heure de jeu estimée |
| Fiabilité | Taux de réussite, refus de contenu, erreurs d'API |

## Points non vérifiés

Aucun appel réel n'a encore été fait. Le format de requête suit la documentation OpenRouter du 02/11/2026 et est couvert par des tests avec un faux serveur, mais le premier essai peut demander un ajustement (par exemple un paramètre refusé par un modèle précis). OpenRouter précise que le nombre de références varie selon le fournisseur.

## Sources

- [OpenRouter — génération d'images](https://openrouter.ai/docs/features/multimodal/image-generation)
- [OpenRouter — liste des modèles d'images](https://openrouter.ai/models?output_modalities=image)
- Capacités et prix par modèle : `https://openrouter.ai/api/v1/images/models/<auteur>/<modele>/endpoints`

## Premiers résultats (02/11/2026)

Lot généré via OpenRouter avec la charte et les 6 héros pré-tirés (images dans `sorties/images/`, hors git ; page `pnpm images comparer`).

| Test | FLUX.2 pro | FLUX 3 Image | Gemini Nano Banana 2.1 |
| --- | --- | --- | --- |
| Portraits (6) | Excellents, distincts, style conforme | non testé | un portrait (Bran) généré, non comparé |
| Scène 1 héros (taverne) | Très fidèle | non testé | non testé |
| Scène 3 héros (crypte) | Très bonne : les 3 héros reconnaissables | non testé | non testé |
| **Scène 6 héros (embuscade)**, mêmes portraits | **3 héros sur 6 seulement**, une tenue changée | **6 héros fidèles** (visages, tenues, accessoires) | 6 héros, mais Hilda devient barbue et du texte parasite apparaît sur la tunique |
| Coût annoncé de cette scène | 0,135 $ | **0,048 $** | 0,055 $ |
| Délai | 35 s | 30 s | 34 s |

Constats :
- Les portraits de FLUX.2 pro suffisent comme références ; la fidélité tient jusqu'à 3 personnages avec FLUX.2 pro, et à 6 avec FLUX 3 Image, qui accepte 10 références et coûte moins cher pour cette scène.
- **Orientation provisoire : FLUX 3 Image pour les scènes avec le groupe ; FLUX.2 pro ou FLUX 3 pour les portraits.** À confirmer en régénérant tout le lot avec FLUX 3 Image.
- Défaut commun : des lettres parasites sur les écussons malgré la consigne « sans texte » ; à traiter par un prompt négatif plus fort ou une retouche.
- Coût : un essai contrôlé (un portrait Gemini) a montré un coût réel égal au coût annoncé (0,040 $). Un écart inexpliqué est apparu avec la première clé (1,11 $ de dépense affichée pour 0,47 $ annoncés) ; il peut venir d'autres usages de cette clé. `pnpm images generer` affiche désormais le bilan réel du lot, et `pnpm images depense` la dépense cumulée de la clé.
- Un modèle peut être testé sur les portraits d'un autre : `--refs <service>`.

## Essai de FLUX 3 Image Klein sur les lieux du Val des Cendres (02/11/2026)

Trois scènes de lieux, sans aucun personnage, 1K, 3:2 : Veillecendre, entrée des cryptes d'Ormgard, halles de la Haute-Forge.

- **Coût et délai :** 0,009 $ et 8 à 12 s par image, soit environ 5 fois moins cher que FLUX 3 Image (0,048 $).
- **Qualité :** style de la charte respecté, compositions très lisibles, aucune lettre parasite. Veillecendre (tour runique, palissade, lueur orangée) et les cryptes (porte de bronze verdie, stèles, neige) collent à la description du monde.
- **Défaut :** à la Haute-Forge, les canaux de fonte coulent en lave incandescente alors que le monde les décrit **figés** ; le prompt devra l'écrire plus fermement (« cold, solidified, dark metal channels »). Deux statues de nains se sont ajoutées au premier plan.
- **Non testé :** les références d'images avec Klein (portraits de galerie en entrée) ; c'est le critère décisif pour les scènes du groupe.

## Générer un monde, lieu par lieu

```bash
pnpm images monde val-des-cendres                                      # lieux dans l'ordre du parcours, images faites / à faire
pnpm images monde val-des-cendres --lieu vei-auberge-dernier-feu --go   # un lieu (sans --go : simulation)
```

Chaque lieu produit : son image (sans personne), les portraits de ses PNJ, les monstres de ses rencontres et ses objets notables (rareté supérieure à commun, ou magiques). Un élément n'est fait qu'une fois, dans le premier lieu où il apparaît. Sortie : `sorties/images/mondes/<monde>/` (ignoré par git). Val des Cendres : 255 images prévues (≈ 2,30 $ avec Klein).

Leçons des premiers lieux :
- **Les fiches sont en français, les prompts en anglais.** « Halfelin » donnait une oreille d'elfe, et « Bandit » un humanoïde-hyène : les espèces sont traduites et chaque monstre a une fiche `apparence` en anglais dans `charte.json` (25 monstres du Val des Cendres).
- **Un refus de modération n'arrête plus le lot** (HTTP 400 « blocked ») : l'image est signalée et on passe à la suivante. « Brûlures anciennes sur les avant-bras » a été prise pour de l'automutilation. Le texte de remplacement se met dans `packages/mondes/<monde>/images.json` (`{ "pnj-<id>": "texte" }`), sans toucher à la fiche que lit le MJ.
- Vérifier chaque lot à l'œil : l'image peut être belle et fausse (Haute-Forge : lave au lieu de métal figé).

## Bilan : Val des Cendres entièrement illustré (02/11/2026)

255 images générées avec FLUX 3 Image Klein, lieu par lieu : 151 lieux, 63 PNJ, 25 monstres, 16 objets notables. Coût des images du monde : environ 2,30 $ (0,009 $ l'une) ; la clé a cumulé 2,98 $ sur 5 $ avec tous les essais de comparaison.

- **Refus de modération : 9 sur 255**, tous résolus par une retouche de texte dans `packages/mondes/val-des-cendres/images.json` : corps gelé, silhouettes allongées, « cadavre en décomposition », petite fille de fer, un sergent-armure (refus sans motif précis). Les mots qui déclenchent : corps, cadavre, enfant, brûlures, silhouettes couchées.
- **Un délai dépassé** (300 s) sur un appel : le lot s'arrête alors ; relancer la même commande reprend où il s'est arrêté.
- **Espèces inconnues** (armure animée, construction de fer…) : le prompt dit « être fantastique non humain » au lieu de « homme de l'espèce X », et l'âge n'est donné que s'il est numérique.
- **Relu en entier le 03/11/2026** (planches de 12) : voir « Images livrées avec le monde » plus bas.

## Galerie de portraits du créateur (03/11/2026)

Les 54 portraits (9 espèces × 2 sexes × 3 visages) sont **du moteur, pas d'un monde** : toutes les campagnes les partagent, et le créateur de personnages les propose avant que le monde ne soit connu. Ils ne dépendent donc ni de `packages/mondes/` ni de `images.json`.

- **Données :** `packages/donnees/visuel/portraits.json` (les 54 ids, lus par le créateur) et `galerie.json` (traits de chaque espèce, en anglais, et description de chacun des 54 visages : âge, peau, cheveux, regard). Un test vérifie que les deux fichiers se correspondent et qu'aucun visage n'est décrit deux fois.
- **Prompt :** charte + « portrait d'un·e <sexe> de l'espèce <traits> » + visage décrit + **tenue de voyage neutre, sans armure, arme, symbole sacré ni outil** (le joueur choisit sa classe après) + buste de trois quarts sur fond sombre.
- **Génération :** `pnpm images galerie [--service klein] [--go]` écrit dans `sorties/images/galerie/<id>.png` ; on peut la relancer, elle ne refait que les manquantes. Résultat : 54 images en 5 min avec Klein, 0,49 $, aucun refus.
- **Installation :** `python3 outils/images/installer.py galerie` réduit les PNG en WebP 512 px (2,1 Mo les 54) vers `apps/jeu/src/portraits/`, **versionné** : le créateur les trouve par `import.meta.glob`. Les PNG d'origine restent dans `sorties/`.
- **Pour changer ou ajouter un visage :** éditer `galerie.json` (et `portraits.json` pour un nouvel id), effacer le PNG concerné, relancer `pnpm images galerie --go`, puis l'installation.
- **Vérifié à l'œil :** toutes les espèces sont reconnaissables et les 6 visages de chaque espèce sont distincts. Défaut mineur : des gnomes et halfelins ont les oreilles un peu pointues malgré le prompt.
- **Toujours non testé :** Klein avec ces portraits en référence pour les scènes du groupe.

## Images livrées avec le monde (03/11/2026)

**Principe : un monde est un paquet autonome, données et images.** Le moteur ne connaît aucun monde : il lit `packages/mondes/<monde>/images/manifeste.json` s'il existe, le vérifie et répond « quelle image pour cet élément ? ». Un monde sans images reste jouable (tuiles d'attente).

- **Manifeste :** quatre groupes, chacun indexé par l'identifiant de l'élément du monde : `lieux`, `pnj`, `monstres` (par profil SRD, partagé par toutes les rencontres), `objets`. Valeur : nom du fichier WebP dans `images/`.
- **Moteur :** `packages/regles/src/monde/images.ts` (`ManifesteImages`, `imageDe`, `verifierImages`) et `chargerManifesteImages(dossier)` dans le chargeur. Les tests vérifient, pour chaque monde livré, que le manifeste ne cite que des éléments existants et des fichiers présents ; pour le Val des Cendres, que chaque lieu et chaque PNJ a son image.
- **Installation :** `python3 outils/images/installer.py monde <monde>` réduit les PNG de `sorties/images/mondes/<monde>/` en WebP (lieux 960 px qualité 75, le reste 512 px qualité 80) et réécrit le manifeste. Val des Cendres : 255 images, **16 Mo** versionnés (contre 140 Mo de PNG).
- **Chaîne complète pour un nouveau monde :** `pnpm images monde <monde> --lieu <id> --go` lieu par lieu → relecture → retouches dans `images.json` si besoin → `installer.py monde <monde>`.

Relecture complète du Val des Cendres :
- **Lieux (151) :** très bons, fidèles au texte et cohérents entre eux. Les silhouettes présentes (squelettes de la caserne, fantôme de la chambre des cartes, gardes de fer, corps du relais du col) viennent du texte du lieu.
- **Refaits (3) :** `haute-forge`, `hf-niveau-2-ateliers` et `hf-pont-basculant` montraient de la lave alors que le texte parle de **fonte figée / morte**. Retouche dans `images.json` (« FROIDS et solidifiés, pas de lave »), régénération : corrigé. La lave reste là où le monde la veut (Veine rouge, lit de braise, pont de la Veine, Forge du Cœur).
- **PNJ (63), monstres (25), objets (16) :** conformes (espèces, signes distinctifs, fantômes translucides). Défaut mineur conservé : sœur Brume (halfeline) a les oreilles un peu pointues ; la momie porte un collier égyptien.

## Plateau de combat : textures, jetons et illustration (03/11/2026)

Demande : un plateau plus beau, des cases lisibles, des personnages plus grands. Un premier essai en figurines debout (plateau en plongée) a été jugé trop chargé : retour aux jetons ronds, un peu plus grands, et l'image du combattant en grand à côté de sa fiche. Tout est **du moteur**, commun à toutes les campagnes.

- **Plateau vu de dessus**, cases carrées texturées, murs en léger relief (dessus décalé, face sombre). Jetons à pictogramme de 0,9 case (1 case pour les grandes créatures). Le plateau s'ajuste à l'écran (cases d'au moins 52 px, sinon il défile ; Ctrl + molette ou boutons − ⤢ + pour zoomer) et suit le combattant actif.
- **Terrain** : 5 ambiances (`foret`, `souterrain`, `caverne`, `camp`, `neige`) × 3 textures vues de dessus (`sol`, `difficile`, `mur`), décrites dans `packages/donnees/visuel/terrains.json`. Une rencontre choisit son ambiance (champ `terrain` des rencontres du prototype et, en option, des rencontres d'un monde). Les textures sont rendues **raccordables** à l'installation (bords fondus avec le côté opposé) et couvrent 4 × 4 cases avant de se répéter.
- **Illustration** : en bas à gauche, l'image du combattant actif ou survolé, à côté de sa fiche. Héros : le **portrait de galerie choisi par le joueur** (les pré-tirés empruntent un portrait de galerie) ; monstre : le **bestiaire**, une image en pied par profil du SRD (30), sur fond neutre.
- **Écran de combat** : le plateau prend tout le centre ; la colonne de droite porte le tour en cours (ressources, consigne, boutons) et les cartes en liste compacte ; l'illustration, la fiche et le journal sont en bas.
- **Commandes** : `pnpm images terrains --go`, `pnpm images bestiaire --go`, puis `python3 outils/images/installer.py terrains|bestiaire` (vers `apps/jeu/src/terrains/` et `apps/jeu/src/bestiaire/`, versionnés). Coût : 12 textures + 30 monstres ≈ 0,34 $.
- **Nouveau monstre** : sa fiche `apparence` (anglais) dans `charte.json`, puis `pnpm images bestiaire --go` (ne refait que les manquantes) et l'installation.

## Écran titre (03/11/2026)

Illustration `ecran-titre` (table du conteur, sans personnage) : `pnpm images interface --go` puis `python3 outils/images/installer.py interface`. Ses objets sont cliquables : les zones sont des polygones **dans le repère de l'image (1248 × 832)**, dans `apps/jeu/src/menu/EcranTitre.tsx`. **Si l'illustration est régénérée, il faut redessiner ces zones** (les tracer sur l'image avec Pillow pour vérifier le calage).
