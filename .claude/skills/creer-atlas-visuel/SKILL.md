---
name: creer-atlas-visuel
description: Dériver d'une Bible de monde l'ensemble de ses fiches d'Atlas Topographique & Visuel (1 fiche pour la capitale en 4 districts et 8 fiches régionales pour les 64 sous-régions) afin de verrouiller à la fois la cohérence cartographique, le réseau routier/maritime (temps de trajet et verrous), l'emplacement des sous-régions, les Points d'Intérêt (POI) et la hiérarchie des Boss (monstres SRD 5.2.1).
---

# Créer l'Atlas Topographique, Routier, POI & Visuel d'un Monde

Un grand monde CRPG ne peut pas reposer sur des descriptions vagues : avant de dessiner les cartes régionales ou d'écrire les scènes d'aventure, chaque région doit posséder une **fiche d'ingénierie topographique et visuelle complète**.

Ce skill prend la **Bible d'un Grand Monde** (`packages/mondes/<id>/BIBLE.md`) et génère méthodiquement le dossier **`packages/mondes/<id>/atlas-visuel/`** composé de **9 fiches de référence complètes** (`00` à `08`).

---

## 1. Organisation du Dossier `atlas-visuel/`

Chaque monde possède son sous-dossier d'atlas structuré ainsi :
- `00-capitale-<nom>.md` : Les Boss de la Capitale, les grandes routes continentales qui en rayonnent, le graphe des 4 districts, leurs frontières, accès, 4 POI chacun et sous-boss.
- `01-region-<nom-r1>.md` à `08-region-<nom-r8>.md` : Les 8 fiches régionales couvrant les 64 sous-régions du monde.

---

## 2. Structure Obligatoire en 5 Sections d'une Fiche Régionale

Chaque fichier régional (`01` à `08`) **DOIT impérativement** comporter les **5 sections suivantes**, sans jamais résumer ni omettre une sous-région :

### Section 1 : Hiérarchie des Boss (Monstres SRD 5.2.1)
Un tableau récapitulatif indiquant avec précision :
- **Le ou les Boss de Région** (au sommet de la chaîne alimentaire/politique de la région) ;
- **Les 8 Sous-Boss (un par sous-région)** ;
- **L'identifiant exact (`id`) du monstre dans le SRD 5.2.1** (`packages/donnees/srd/monstres/<id>.json`, ex: `diantrefosse`, `dragon-rouge-venerable`, `aboleth`, `liche`, `tarasque`) ainsi que son **FP (CR)** et son rôle narratif.

### Section 2 : Réseau Routier, Voies Navigables, Temps de Trajet & Verrous
- Un **schéma `mermaid` (`flowchart TD`)** représentant :
  - Les **connexions entrantes** depuis la Capitale ou les régions limitrophes (avec le nom de la route/col et le temps de marche en heures) ;
  - Les **8 sous-régions** avec leurs coordonnées `{ x, y }` et leur palier de niveau ;
  - Toutes les **routes, cols, ponts, fleuves ou lignes maritimes/aériennes** reliant les sous-régions entre elles, avec le **temps de trajet en heures (`Xh`)** ;
- La liste explicite des **Verrous Stratégiques (`🔒`)** de la région (ex: pont-levis, écluse, nef à coque d'argent, ascenseur à contrepoids, sceau magique) qui bloquent l'accès aux zones de haut niveau.

### Section 3 : Charte Visuelle & Empreinte sur la Carte du Monde
- **Vue Aérienne (Carte du Monde / Atlas)** : Forme géographique/anatomique vue du ciel, palette de couleurs avec **codes HEX**, et marqueurs visuels distinctifs.
- **Vue au Sol (Exploration CRPG)** : Atmosphère, météo, lumière, matériaux et style architectural local.

### Section 4 : Description Détaillée des 8 Sous-Régions
Pour **chacune des 8 sous-régions** (`SR X.1` à `SR X.8`), fournir systématiquement :
1. **Position & Frontières Naturelles** : Coordonnées `{ x, y }` et délimitation exacte par rapport aux sous-régions voisines.
2. **Routes & Accès** : Toutes les voies permettant d'y entrer et d'en sortir avec leurs temps de trajet.
3. **5 Points d'Intérêt (POI) Typés** :
   - 🏘️ **Village / Campement / Ville / Port** (lieu de vie, de commerce ou dePNJ) ;
   - 🏰 **Forteresse / Bastion / Tour** (position militaire ou politique) ;
   - 🕳️ **Grotte / Mine / Gouffre / Égout** (donjon souterrain ou repaire de monstre) ;
   - ⛩️ **Temple / Sanctuaire / Autel** (lieu spirituel, mystique ou mécanique de bénédiction/pacte) ;
   - 🗿 **Ruine / Merveille Anatomique / Repère Mythique** (vestige monumental visible de loin).
4. **Boss de Sous-Région** : Nom propre, `id` SRD exact, FP et composition de son escorte.

### Section 5 : Prompt Cartographique de Référence (en Anglais)
Un bloc de prompt prêt à l'emploi pour le sous-agent `image-generator` listant tous les repères géographiques des 8 sous-régions afin que la carte régionale générée corresponde trait pour trait aux textes et aux routes.

---

## 3. Articulation dans la Chaîne de Création de Monde

```
[creer-grand-monde] 
        │ (produit la BIBLE.md : mythologie, factions, 8 régions, bestiaire)
        ▼
[creer-atlas-visuel] 
        │ (produit atlas-visuel/00 à 08 : Boss SRD, Graphe Routier Mermaid, Frontières, 5 POI/sous-région, Visuels & Prompts)
        ▼
[creer-carte-monde] 
        │ (génère les cartes fidèles à la topographie et au réseau routier de l'Atlas)
        ▼
[decrire-lieux] / [creer-rencontres]
          (transforme chaque POI et chaque Boss de l'Atlas en scènes jouables JSON)
```
