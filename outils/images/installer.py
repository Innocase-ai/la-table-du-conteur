#!/usr/bin/env python3
"""Installe les images générées (sorties/images/…, PNG) dans le dépôt, réduites en WebP.

  python3 outils/images/installer.py galerie          → apps/jeu/src/portraits/<id>.webp (512 px, commun à tous les mondes)
  python3 outils/images/installer.py monde <monde>    → packages/mondes/<monde>/images/<id>.webp + manifeste.json
  python3 outils/images/installer.py bestiaire        → apps/jeu/src/bestiaire/<profil>.webp (images de combat, tous mondes)
  python3 outils/images/installer.py terrains         → apps/jeu/src/terrains/<ambiance>-<type>.webp (raccordables)

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


def raccordable(im: Image.Image, part: float = 0.25) -> Image.Image:
    """Rend une texture raccordable : les bords sont fondus avec le côté opposé (on perd `part` de chaque dimension)."""
    for axe in (0, 1):
        w, h = im.size
        n = w if axe == 0 else h
        o = int(n * part)
        garde = im.crop((0, 0, n - o, h) if axe == 0 else (0, 0, w, n - o))
        queue = im.crop((n - o, 0, n, h) if axe == 0 else (0, n - o, w, n))
        tete = im.crop((0, 0, o, h) if axe == 0 else (0, 0, w, o))
        # Masque : 1 (queue) au bord, 0 (tête) au bout du fondu, pour que la fin de la texture enchaîne sur son début.
        degrade = Image.linear_gradient("L").rotate(90 if axe == 0 else 0, expand=True)
        masque = degrade.resize(tete.size)
        masque = masque.transpose(Image.FLIP_LEFT_RIGHT if axe == 0 else Image.FLIP_TOP_BOTTOM)
        garde.paste(Image.composite(queue, tete, masque), (0, 0))
        im = garde
    return im


def bestiaire() -> None:
    source, cible = RACINE / "sorties/images/bestiaire", RACINE / "apps/jeu/src/bestiaire"
    cible.mkdir(parents=True, exist_ok=True)
    pngs = sorted(source.glob("*.png"))
    for png in pngs:
        reduire(png, cible / f"{png.stem}.webp", 384, 80)
    print(f"{len(pngs)} image(s) de monstres installées dans {cible.relative_to(RACINE)}")


def terrains() -> None:
    source, cible = RACINE / "sorties/images/terrains", RACINE / "apps/jeu/src/terrains"
    cible.mkdir(parents=True, exist_ok=True)
    pngs = sorted(source.glob("*.png"))
    for png in pngs:
        with Image.open(png) as im:
            tuile = raccordable(im.convert("RGB")).resize((512, 512), Image.LANCZOS)
            tuile.save(cible / f"{png.stem}.webp", "WEBP", quality=80, method=6)
    print(f"{len(pngs)} texture(s) installées dans {cible.relative_to(RACINE)}")


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
    elif sys.argv[1:2] == ["bestiaire"]:
        bestiaire()
    elif sys.argv[1:2] == ["terrains"]:
        terrains()
    elif sys.argv[1:2] == ["monde"] and len(sys.argv) == 3:
        monde(sys.argv[2])
    else:
        sys.exit(__doc__)
