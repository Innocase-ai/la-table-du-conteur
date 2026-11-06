# Atlas des lieux de {{NOM DU MONDE}}

Document de travail (le moteur ne le lit pas) : **source unique** des descriptions de lieux, des images et des cartes. Écrit de haut en bas : niveau 0 (la carte du monde), niveau 1 (chaque lieu de cette carte), niveau 2 (chaque point à visiter). Un niveau ne contredit jamais celui du dessus.

Positions : `(x, y)` en % de la carte du parent (x : 0 à gauche, 100 à droite ; y : 0 en haut, 100 en bas). Ce sont des **intentions** ; on les replace d'après l'image réelle une fois la carte générée.

---

## Niveau 0 : la carte du monde

### Le territoire
- **Forme générale** :
- **Orientation** (où est le nord) :
- **Échelle** (jours de marche d'un bout à l'autre) :
- **Relief** :
- **Eaux** :
- **Climat et saisons** :
- **Ce qu'on voit de loin** (silhouettes, fumées, lumières) :

### Charte du monde (bloc d'héritage racine)
- **Matériaux** (3 à 5) :
- **Couleurs** (4 à 6, d'après la palette de `monde.json`) :
- **Formes d'architecture** (2 à 3) :
- **Lumière type** :
- **Météo type** :
- **Sons de fond** :
- **Odeurs de fond** :

### Les grands lieux

| id | nom | type | position | reconnaissable de loin par | heures vers les voisins | menace ou promesse |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  | (  ,  ) |  |  |  |

### Routes et passages
-

### Composition de la carte (pour `images.json`, clé `carte-<racine>`, 3 à 5 phrases)

>

---

## Niveau 1 : {{id du lieu}} ({{nom}}, {{type}})

### Héritage (recopié du niveau 0, ne pas modifier)
- Matériaux, couleurs, formes, lumière, météo :
### Nuances propres à ce lieu
-

### Plan vu de dessus
- **Forme générale** :
- **Limites** (mur, falaise, rivière…) :
- **Orientation** :
- **Voies d'accès** (d'où on arrive, où on débouche) :
- **Éléments naturels** :
- **Quartiers, ailes, niveaux** :

### Points à visiter

| id | nom | type | fonction dramatique | position | taille | voisins directs |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  | combat / rencontre / énigme / repos / trésor / secret | (  ,  ) | grande / moyenne / petite |  |

### Histoire et état actuel
-

### Jour, nuit, mauvais temps
- **Jour** :
- **Nuit** :
- **Mauvais temps** :

### Ce que le joueur voit en arrivant
-

### Secret du MJ (jamais dans `visuel`, `resume`, `accroche`)
-

### Composition de la carte (pour `images.json`, clé `carte-<lieu>`, 3 à 5 phrases)

>

### Champs dérivés de ce lieu
- **resume** (une phrase, sans spoiler) :
- **accroche** (12 à 30 mots, vue du dehors depuis le parent) :
- **visuel** (2 à 4 phrases, ce qu'on voit depuis l'entrée ; matériaux et couleurs du bloc d'héritage) :
- **ambiance** (3 à 8 mots) :
- **description** (MJ, 100 à 250 mots) :

---

### Niveau 2 : {{id du point}} ({{nom}}, {{type}}), dans {{id du lieu}}

**Héritage** (recopié du niveau 1, ne pas modifier) :

- **Dimensions et structure** :
- **Matériaux et état** (âge, usure, humidité, ce qui est cassé, ce qui est récent) :
- **Lumière** (origine, couleur, force, ombres) :
- **Sons** :
- **Odeurs** :
- **Température** :
- **Éléments remarquables** (chacun avec sa place) :
  -
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `id` : description (12 à 30 mots) ; retour (12 à 30 mots)
- **Ce qu'on y trouve** (ids du canon seulement : PNJ, trésors, pièges, énigmes, rencontres) :
- **Avant / après** (avec le drapeau ou le fait qui déclenche le changement) :
- **Un détail propre à ce lieu** (inscription, odeur, objet cassé : ce qui empêche cette fiche d'être échangeable) :

**Champs dérivés**
- **resume** :
- **accroche** :
- **visuel** :
- **ambiance** :
- **description** :
