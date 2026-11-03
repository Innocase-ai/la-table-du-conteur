#!/usr/bin/env python3
"""Copie la galerie générée (sorties/images/galerie/*.png) dans le jeu, réduite en WebP 512 px.

Les portraits sont communs à tous les mondes : ils sont versionnés dans apps/jeu/src/portraits/
(le créateur de personnages les trouve par import.meta.glob). Les PNG d'origine restent dans sorties/.
Usage : python3 outils/images/installer-galerie.py   (nécessite Pillow)
"""
from pathlib import Path
from PIL import Image

racine = Path(__file__).resolve().parents[2]
source = racine / "sorties/images/galerie"
cible = racine / "apps/jeu/src/portraits"
cible.mkdir(parents=True, exist_ok=True)
n = 0
for png in sorted(source.glob("*.png")):
    with Image.open(png) as im:
        im.convert("RGB").resize((512, 512), Image.LANCZOS).save(cible / f"{png.stem}.webp", "WEBP", quality=88, method=6)
    n += 1
print(f"{n} portrait(s) installés dans {cible.relative_to(racine)}")
