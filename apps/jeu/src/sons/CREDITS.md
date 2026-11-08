# Bruitages de combat

Fichiers rognés et égalisés par `pnpm sons rogner` (voir `outils/sons/`), joués par `src/sons.ts` ; le choix du son pour chaque effet est dans `src/sons-regles.ts` ; la liste de ce qui est en place et de ce qui manque est dans `docs/SONS.md`.

| Fichier | Origine | Licence |
| --- | --- | --- |
| `epee`, `hache`, `arc`, `feu-1`, `feu-2`, `glace`, `foudre`, `projectile-magique`, `soin`, `protection` | Fournis par l'auteur du jeu (dossier « effet sonor », 04/11/2026) | **À confirmer** : origine non précisée à ce jour ; à lever avant la vente du jeu |
| `fouet`, `lance`, `rapiere`, `masse`, `massue`, `arbalete`, `fronde`, `arme-a-feu`, `sarbacane`, `radiant`, `acide`, `poison`, `necrotique`, `tonnerre`, `arme-spirituelle`, `marque`, `malediction`, `sommeil`, `immobilisation` | Fournis par l'auteur du jeu (même dossier, 04/11/2026) | **À confirmer** (idem) |
| `lancer`, `rate-arme`, `renforcement` | Générés le 08/11/2026 avec ElevenLabs Sound Effects v2 (`eleven_text_to_sound_v2`, 1 s chacun, formule payante de l'auteur) ; remplacent les fichiers d'origine, identiques à `lance`, `rapiere` et `necrotique` | **À confirmer** : licence commerciale de l'offre ElevenLabs à vérifier avant la vente |
| `contondant` | `impactPunch_heavy_000.ogg`, Kenney Impact Sounds (https://kenney.nl/assets/impact-sounds) | CC0 |
| `perforant` | `knifeSlice.ogg`, Kenney RPG Audio (https://kenney.nl/assets/rpg-audio) | CC0 |

Attribution facultative pour les deux sons de Kenney : « Sons : Kenney (kenney.nl), CC0 ».

## Serrures (écran de crochetage, 07/11/2026)

| Fichier | Origine | Licence |
| --- | --- | --- |
| `serrure-ouverte`, `porte-forcee` | Générés avec ElevenLabs (modèle d'effets sonores `eleven_text_to_sound_v2`, abonnement de l'auteur du jeu), 17 crédits chacun ; prises choisies à l'oreille parmi deux ; rognés par `pnpm sons rogner` | **À confirmer** : conditions d'usage commercial des sons générés selon le forfait ElevenLabs, à vérifier avant la vente du jeu |
