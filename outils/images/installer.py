#!/usr/bin/env python3
"""Installe les images générées (sorties/images/…, PNG) dans le dépôt, réduites en WebP.

  python3 outils/images/installer.py galerie          → apps/jeu/src/portraits/<id>.webp (512 px, commun à tous les mondes)
  python3 outils/images/installer.py monde <monde>    → packages/mondes/<monde>/images/<id>.webp + manifeste.json

Les PNG d'origine restent dans sorties/ (ignoré par git). Le manifeste d'un monde range chaque image par groupe
(lieux, pnj, monstres, objets) sous l'identifiant de l'élément du monde ; le moteur le lit et le vérifie
(packages/regles/src/monde/images.ts). Nécessite Pillow.
"""
import json
import sys
from pathlib import Path
from PIL import Image

RACINE = Path(__file__).resolve().parents[2]
GROUPES = {"lieu-": "lieux", "pnj-": "pnj", "monstre-": "monstres", "objet-": "objets"}


def reduire(png: Path, cible: Path, cote: int, qualite: int) -> None:
    """Le plus grand côté ramené à `cote` pixels, proportions gardées."""
    with Image.open(png) as im:
        im = im.convert("RGB")
        im.thumbnail((cote, cote), Image.LANCZOS)
        im.save(cible, "WEBP", quality=qualite, method=6)


def galerie() -> None:
    source, cible = RACINE / "sorties/images/galerie", RACINE / "apps/jeu/src/portraits"
    cible.mkdir(parents=True, exist_ok=True)
    pngs = sorted(source.glob("*.png"))
    for png in pngs:
        reduire(png, cible / f"{png.stem}.webp", 512, 88)
    print(f"{len(pngs)} portrait(s) installés dans {cible.relative_to(RACINE)}")


def monde(id_monde: str) -> None:
    source = RACINE / "sorties/images/mondes" / id_monde
    cible = RACINE / "packages/mondes" / id_monde / "images"
    if not source.is_dir():
        sys.exit(f"Aucune image générée pour « {id_monde} » ({source.relative_to(RACINE)}).")
    cible.mkdir(parents=True, exist_ok=True)
    manifeste = {g: {} for g in GROUPES.values()}
    for png in sorted(source.glob("*.png")):
        prefixe = next((p for p in GROUPES if png.stem.startswith(p)), None)
        if not prefixe:
            continue
        # Lieux : 960 px de large (plein écran du récit), qualité 75 ; portraits, monstres, objets : 512 px.
        reduire(png, cible / f"{png.stem}.webp", *((960, 75) if prefixe == "lieu-" else (512, 80)))
        manifeste[GROUPES[prefixe]][png.stem[len(prefixe):]] = f"{png.stem}.webp"
    (cible / "manifeste.json").write_text(json.dumps(manifeste, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    total = sum(len(v) for v in manifeste.values())
    print(f"{total} image(s) installées dans {cible.relative_to(RACINE)} ({', '.join(f'{len(v)} {g}' for g, v in manifeste.items())})")


if __name__ == "__main__":
    if sys.argv[1:2] == ["galerie"]:
        galerie()
    elif sys.argv[1:2] == ["monde"] and len(sys.argv) == 3:
        monde(sys.argv[2])
    else:
        sys.exit(__doc__)
