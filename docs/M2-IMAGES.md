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
