#!/usr/bin/env python3
"""Installe les images générées (sorties/images/…, PNG) dans le dépôt, réduites en WebP.

  python3 outils/images/installer.py galerie          → apps/jeu/src/portraits/<id>.webp (512 px, commun à tous les mondes)
  python3 outils/images/installer.py monde <monde> [--purger]
                                                      → packages/mondes/<monde>/images/<id>.webp + manifeste.json
  python3 outils/images/installer.py bestiaire        → apps/jeu/src/bestiaire/<profil>.webp (images de combat, tous mondes)
  python3 outils/images/installer.py equipement       → apps/jeu/src/equipement/<id>.webp (armes et armures du SRD, tous mondes)
  python3 outils/images/installer.py decors           → apps/jeu/src/communs/lieux/<id>.webp (réserve de décors génériques, 960 px ; à inscrire ensuite à catalogue.json)
  python3 outils/images/installer.py terrains         → apps/jeu/src/terrains/<ambiance>-<type>.webp (raccordables)
  python3 outils/images/installer.py interface        → apps/jeu/src/interface/<id>.webp (écran titre…, 1600 px)

Les PNG d'origine restent dans sorties/ (ignoré par git). Le manifeste d'un monde range chaque image par groupe
(lieux, pnj, monstres, objets, cartes) sous l'identifiant de l'élément du monde ; le moteur le lit et le vérifie
(packages/regles/src/monde/images.ts). Nécessite Pillow (sur cette machine : `uv run --with pillow python outils/images/installer.py …`).

Monde : le manifeste est FUSIONNÉ, pas reconstruit (audit du 18/11/2026, docs/AUDIT-CREATION-HISTOIRE.md G4). Une entrée dont le PNG
n'est plus dans sorties/ est gardée tant que son .webp est dans le dépôt ; une entrée dont le fichier a disparu n'est retirée qu'avec
--purger. Tout ce qui change est affiché.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # la fusion du manifeste (`fusionner`) se teste sans Pillow
    Image = None  # type: ignore[assignment]

RACINE = Path(__file__).resolve().parents[2]
GROUPES = {"lieu-": "lieux", "pnj-": "pnj", "objet-": "objets", "carte-": "cartes"}


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


def equipement() -> None:
    source, cible = RACINE / "sorties/images/equipement", RACINE / "apps/jeu/src/equipement"
    cible.mkdir(parents=True, exist_ok=True)
    pngs = sorted(source.glob("*.png"))
    for png in pngs:
        reduire(png, cible / f"{png.stem}.webp", 384, 80)
    print(f"{len(pngs)} image(s) d'équipement installées dans {cible.relative_to(RACINE)}")


def decors() -> None:
    source, cible = RACINE / "sorties/images/decors", RACINE / "apps/jeu/src/communs/lieux"
    cible.mkdir(parents=True, exist_ok=True)
    pngs = sorted(source.glob("*.png"))
    for png in pngs:
        reduire(png, cible / f"{png.stem}.webp", 960, 80)
    print(f"{len(pngs)} décor(s) installés dans {cible.relative_to(RACINE)} : à inscrire à catalogue.json (voir docs/BIBLIOTHEQUE-COMMUNE.md)")


def terrains() -> None:
    source, cible = RACINE / "sorties/images/terrains", RACINE / "apps/jeu/src/terrains"
    cible.mkdir(parents=True, exist_ok=True)
    pngs = sorted(source.glob("*.png"))
    for png in pngs:
        with Image.open(png) as im:
            tuile = raccordable(im.convert("RGB")).resize((512, 512), Image.LANCZOS)
            tuile.save(cible / f"{png.stem}.webp", "WEBP", quality=80, method=6)
    print(f"{len(pngs)} texture(s) installées dans {cible.relative_to(RACINE)}")


def interface() -> None:
    source, cible = RACINE / "sorties/images/interface", RACINE / "apps/jeu/src/interface"
    cible.mkdir(parents=True, exist_ok=True)
    pngs = sorted(source.glob("*.png"))
    for png in pngs:
        reduire(png, cible / f"{png.stem}.webp", 1600, 80)
    print(f"{len(pngs)} illustration(s) d'interface installées dans {cible.relative_to(RACINE)}")


def galerie() -> None:
    source, cible = RACINE / "sorties/images/galerie", RACINE / "apps/jeu/src/portraits"
    cible.mkdir(parents=True, exist_ok=True)
    pngs = sorted(source.glob("*.png"))
    for png in pngs:
        reduire(png, cible / f"{png.stem}.webp", 512, 88)
    print(f"{len(pngs)} portrait(s) installés dans {cible.relative_to(RACINE)}")


def fusionner(ancien: dict, installees: dict, presents: set, purger: bool = False) -> tuple[dict, list[str]]:
    """Le nouveau manifeste et la liste de ce qui change. `ancien` : le manifeste en place ; `installees` : groupe → {clé: fichier} des
    images que l'on vient d'installer depuis sorties/ ; `presents` : les fichiers du dossier images/ après l'installation. Rien ne se
    perd sans le dire : une entrée absente de sorties/ reste tant que son fichier existe (ou si c'est une référence `commun:`) ; une
    entrée dont le fichier n'existe plus est gardée et signalée, et n'est retirée qu'avec `purger`."""
    manifeste = {g: dict(e) for g, e in ancien.items()}
    for g in GROUPES.values():
        manifeste.setdefault(g, {})
    changements: list[str] = []
    for groupe, entrees in installees.items():
        for cle, fichier in entrees.items():
            avant = manifeste[groupe].get(cle)
            if avant is None:
                changements.append(f"  + {groupe}/{cle} : {fichier}")
            elif avant != fichier:
                changements.append(f"  ~ {groupe}/{cle} : {avant} → {fichier}")
            manifeste[groupe][cle] = fichier
    for groupe, entrees in manifeste.items():
        for cle, fichier in list(entrees.items()):
            if cle in installees.get(groupe, {}) or str(fichier).startswith("commun:") or fichier in presents:
                continue
            if purger:
                del entrees[cle]
                changements.append(f"  - {groupe}/{cle} : {fichier} (fichier absent, retiré par --purger)")
            else:
                changements.append(f"  ! {groupe}/{cle} : {fichier} (fichier absent du dossier images/ : gardé ; --purger pour le retirer)")
    return manifeste, changements


def monde(id_monde: str, purger: bool = False) -> None:
    source = RACINE / "sorties/images/mondes" / id_monde
    cible = RACINE / "packages/mondes" / id_monde / "images"
    if not source.is_dir():
        sys.exit(f"Aucune image générée pour « {id_monde} » ({source.relative_to(RACINE)}).")
    cible.mkdir(parents=True, exist_ok=True)
    installees: dict = {g: {} for g in GROUPES.values()}
    ignores = []
    for png in sorted(source.glob("*.png")):
        prefixe = next((p for p in GROUPES if png.stem.startswith(p)), None)
        if not prefixe:
            ignores.append(png.name)
            continue
        # Lieux : 960 px de large (plein écran du récit), qualité 75 ; cartes : 1248 px (on y pose des repères), qualité 80 ; portraits, monstres, objets : 512 px.
        reduire(png, cible / f"{png.stem}.webp", *{"lieu-": (960, 75), "carte-": (1248, 80)}.get(prefixe, (512, 80)))
        installees[GROUPES[prefixe]][png.stem[len(prefixe):]] = f"{png.stem}.webp"
    ancien_fichier = cible / "manifeste.json"
    ancien = json.loads(ancien_fichier.read_text(encoding="utf8")) if ancien_fichier.exists() else {}
    presents = {f.name for f in cible.iterdir() if f.is_file()}
    manifeste, changements = fusionner(ancien, installees, presents, purger)
    ancien_fichier.write_text(json.dumps(manifeste, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    total = sum(len(v) for v in installees.values())
    print(f"{total} image(s) installées depuis {source.relative_to(RACINE)} ; manifeste : {', '.join(f'{len(v)} {g}' for g, v in manifeste.items())}")
    print("\n".join(["Changements du manifeste :", *changements]) if changements else "Manifeste : aucune entrée ajoutée, changée ni perdue.")
    if ignores:
        print(f"PNG ignorés (préfixe inconnu, attendu : {', '.join(GROUPES)}) : {', '.join(ignores)}")


if __name__ == "__main__":
    for flux in (sys.stdout, sys.stderr):
        if hasattr(flux, "reconfigure"):
            flux.reconfigure(encoding="utf-8")  # console Windows : les accents
    if sys.argv[1:2] == ["galerie"]:
        galerie()
    elif sys.argv[1:2] == ["bestiaire"]:
        bestiaire()
    elif sys.argv[1:2] == ["equipement"]:
        equipement()
    elif sys.argv[1:2] == ["decors"]:
        decors()
    elif sys.argv[1:2] == ["terrains"]:
        terrains()
    elif sys.argv[1:2] == ["interface"]:
        interface()
    elif sys.argv[1:2] == ["monde"] and len(sys.argv) in (3, 4) and sys.argv[3:] in ([], ["--purger"]):
        monde(sys.argv[2], purger=sys.argv[3:] == ["--purger"])
    else:
        sys.exit(__doc__)
