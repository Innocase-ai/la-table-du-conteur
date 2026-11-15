# Catalogue des assets de décor

Copie du catalogue de RPGSEB (généré là-bas par `uv run outils/catalogue.py` depuis `data/carte/decor.json`, copié ici en `decor.json`) : ne pas éditer à la main.

| Id | Type | Région | Taille (cases) | Cases bloquantes | Déclenche une action | Entrée | Terrains |
|---|---|---|---|---|---|---|---|
| `arbre-bouleau` | Arbre | Forêt (défaut) | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `arbre-chene` | Arbre | Forêt (défaut) | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `arbre-conifere` | Arbre | Forêt (défaut) | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `arbre-erable` | Arbre | Forêt (défaut) | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `arbre-mort` | Arbre | Forêt (défaut) | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `arbre-saule` | Arbre | Forêt (défaut) | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `arbre-bouleau-neige` | Arbre | Arctique | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `arbre-chene-neige` | Arbre | Arctique | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `arbre-conifere-neige` | Arbre | Arctique | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `arbre-erable-neige` | Arbre | Arctique | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `arbre-mort-neige` | Arbre | Arctique | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `arbre-saule-neige` | Arbre | Arctique | 2×2 | 4 | Non (obstacle ou décor) | — | forest, plain |
| `roche` | Roche | Forêt (défaut) | 1×1 | 1 | Non (obstacle ou décor) | — | hill, mountain, plain, forest |
| `roche-basalte` | Roche | Forêt (défaut) | 1×1 | 1 | Non (obstacle ou décor) | — | hill, mountain, plain, forest |
| `roche-granit` | Roche | Forêt (défaut) | 1×1 | 1 | Non (obstacle ou décor) | — | hill, mountain, plain, forest |
| `roche-gres` | Roche | Forêt (défaut) | 1×1 | 1 | Non (obstacle ou décor) | — | hill, mountain, plain, forest |
| `roche-basalte-neige` | Roche | Arctique | 1×1 | 1 | Non (obstacle ou décor) | — | hill, mountain, plain, forest |
| `roche-granit-neige` | Roche | Arctique | 1×1 | 1 | Non (obstacle ou décor) | — | hill, mountain, plain, forest |
| `roche-gres-neige` | Roche | Arctique | 1×1 | 1 | Non (obstacle ou décor) | — | hill, mountain, plain, forest |
| `roche-neige` | Roche | Arctique | 1×1 | 1 | Non (obstacle ou décor) | — | hill, mountain, plain, forest |
| `montagne` | Montagne | Forêt (défaut) | 3×3 | 4 | Non (obstacle ou décor) | — | mountain, hill |
| `montagne-neige` | Montagne | Arctique | 3×3 | 4 | Non (obstacle ou décor) | — | mountain, hill |
| `lac` | Lac | Forêt (défaut) | 4×4 | 4 | Non (obstacle ou décor) | — | plain, forest |
| `lac-neige` | Lac | Arctique | 4×4 | 4 | Non (obstacle ou décor) | — | plain, forest |
| `maison-ardoise` | Maison | Forêt (défaut) | 3×2 | 6 | Non (obstacle ou décor) | — | plain, forest |
| `maison-chaume` | Maison | Forêt (défaut) | 2×3 | 6 | Non (obstacle ou décor) | — | plain, forest |
| `maison-tuiles` | Maison | Forêt (défaut) | 2×3 | 6 | Non (obstacle ou décor) | — | plain, forest |
| `maison-ardoise-neige` | Maison | Arctique | 3×2 | 6 | Non (obstacle ou décor) | — | plain, forest |
| `maison-chaume-neige` | Maison | Arctique | 2×3 | 6 | Non (obstacle ou décor) | — | plain, forest |
| `maison-tuiles-neige` | Maison | Arctique | 2×3 | 6 | Non (obstacle ou décor) | — | plain, forest |
| `grotte-colline` | Grotte | Forêt (défaut) | 2×2 | 3 | `donjon` — entrer dans le donjon | [1, 1] | hill, mountain, plain |
| `grotte-falaise` | Grotte | Forêt (défaut) | 2×2 | 3 | `donjon` — entrer dans le donjon | [1, 1] | hill, mountain, plain |
| `grotte-gouffre` | Grotte | Forêt (défaut) | 2×2 | 3 | `donjon` — entrer dans le donjon | [1, 1] | hill, mountain, plain |
| `grotte-colline-neige` | Grotte | Arctique | 2×2 | 3 | `donjon` — entrer dans le donjon | [1, 1] | hill, mountain, plain |
| `grotte-falaise-neige` | Grotte | Arctique | 2×2 | 3 | `donjon` — entrer dans le donjon | [1, 1] | hill, mountain, plain |
| `grotte-gouffre-neige` | Grotte | Arctique | 2×2 | 3 | `donjon` — entrer dans le donjon | [1, 1] | hill, mountain, plain |
| `village-bourg` | Village | Forêt (défaut) | 6×6 | 35 | `village` — entrer dans le village | [3, 5] | plain, forest |
| `village-fortifie` | Village | Forêt (défaut) | 6×6 | 35 | `village` — entrer dans le village | [3, 5] | plain, forest |
| `village-hameau` | Village | Forêt (défaut) | 4×4 | 4 | `village` — entrer dans le village | [2, 3] | plain, forest |
| `village-bourg-neige` | Village | Arctique | 6×6 | 35 | `village` — entrer dans le village | [3, 5] | plain, forest |
| `village-fortifie-neige` | Village | Arctique | 6×6 | 35 | `village` — entrer dans le village | [3, 5] | plain, forest |
| `village-hameau-neige` | Village | Arctique | 4×4 | 4 | `village` — entrer dans le village | [2, 3] | plain, forest |
| `chateau-fort` | Château | Forêt (défaut) | 6×6 | 35 | `chateau` — entrer dans le château | [3, 5] | plain, forest |
| `chateau-motte` | Château | Forêt (défaut) | 4×4 | 15 | `chateau` — entrer dans le château | [2, 3] | plain, forest |
| `chateau-ruine` | Château | Forêt (défaut) | 6×6 | 35 | `ruine` — explorer la ruine | [3, 5] | plain, forest |
| `chateau-fort-neige` | Château | Arctique | 6×6 | 35 | `chateau` — entrer dans le château | [3, 5] | plain, forest |
| `chateau-motte-neige` | Château | Arctique | 4×4 | 15 | `chateau` — entrer dans le château | [2, 3] | plain, forest |
| `chateau-ruine-neige` | Château | Arctique | 6×6 | 35 | `ruine` — explorer la ruine | [3, 5] | plain, forest |
