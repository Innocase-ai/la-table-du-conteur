# Musiques d'ambiance de combat

Cinq boucles de 25 à 29 s, jouées au hasard à chaque combat (`src/musique.ts`).

| Fichier | Ambiance | Origine |
| --- | --- | --- |
| `foret.mp3` | Embuscade en forêt | Générée le 04/11/2026 avec Google Lyria 3 Clip (`google/lyria-3-clip-preview`, via OpenRouter) |
| `souterrain.mp3` | Crypte et souterrain | idem |
| `caverne.mp3` | Caverne | idem |
| `camp.mp3` | Camp de guerre | idem |
| `intense.mp3` | Combat intense | idem |

Chaque fichier vient d'un clip de 30 s (`pnpm musique generer`), rendu bouclable par un fondu enchaîné de la fin sur le début et ramené à −26 dB de volume moyen (`pnpm musique boucler`). Les consignes données au modèle sont dans `outils/musique/ambiances.ts` ; les clips d'origine et leurs fiches (`.json`) sont dans `sorties/musique/` (hors git).

**Licence : à confirmer avant la vente du jeu.** Ni OpenRouter ni la page Google du modèle ne précisent les conditions d'usage commercial des musiques générées. Les morceaux portent un filigrane SynthID inaudible.
