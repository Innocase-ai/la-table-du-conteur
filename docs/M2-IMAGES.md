# M2 — Comparaison des services d'images

But : choisir le service qui illustre le mieux le jeu, en mesurant **le style, la ressemblance des héros d'une image à l'autre, le délai et le coût**. Claude ne génère pas d'images : le jeu passera par l'API d'un service.

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
