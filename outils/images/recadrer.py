#!/usr/bin/env python3
"""Découpe, dans l'image d'une carte, la zone autour d'un lieu (centre en % de l'image) : sert de référence pour dessiner la carte
de ce lieu en gros plan, avec les mêmes bâtiments que la carte d'ensemble.

  uv run --with pillow python outils/images/recadrer.py <image> <x%> <y%> <sortie> [largeur%]

La découpe garde les proportions de l'image (3:2), mesure `largeur`% de sa largeur (40 par défaut) et reste dans l'image.
"""
import sys
from PIL import Image

if len(sys.argv) not in (5, 6):
    sys.exit(__doc__)
source, cx, cy, sortie = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
part = float(sys.argv[5]) / 100 if len(sys.argv) == 6 else 0.4
with Image.open(source) as im:
    im = im.convert("RGB")
    l, h = im.size
    lc, hc = round(l * part), round(h * part)
    x0 = min(max(round(l * cx / 100 - lc / 2), 0), l - lc)
    y0 = min(max(round(h * cy / 100 - hc / 2), 0), h - hc)
    im.crop((x0, y0, x0 + lc, y0 + hc)).save(sortie)
