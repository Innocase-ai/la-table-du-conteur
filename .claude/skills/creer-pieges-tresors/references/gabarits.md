# Gabarits JSON (pièges, trésors, objets, tables)

Tous les identifiants sont en kebab-case ASCII, avec le préfixe de la zone. Les exemples sont tirés des mondes livrés (le Val des Cendres) ou construits sur le même modèle ; les champs facultatifs sont omis quand ils ne servent pas. Un fichier de zone est un **tableau** d'entités (`pieges/z1-….json`, `tresors/z1-….json`, `tables/z1-….json`, `objets/z1-….json`).

## Piège lié à un contenant (équitable : le joueur choisit d'ouvrir)

```json
{
  "id": "vei-p-aiguille-du-coffret",
  "nom": "Aiguille empoisonnée du coffret",
  "lieu": "vei-cellier-du-bailli",
  "resume": "Le coffret de fer du bailli est équipé d'une aiguille à ressort, au fond de la serrure, enduite d'un poison de grain pourri.",
  "detection": { "dd": 13, "competence": "investigation" },
  "desarmement": { "dd": 13, "competence": "escamotage", "outil": "outils-de-voleur" },
  "declenchement": "Quand on force la serrure ou qu'on tourne une clé qui n'est pas la bonne, une aiguille jaillit dans la paume.",
  "sauvegarde": { "caracteristique": "con", "dd": 12, "moitieSiReussite": true },
  "degats": [{ "des": "1d8", "type": "poison" }],
  "etats": ["empoisonné"],
  "effets": [],
  "reinitialisation": false
}
```

Le trésor qui le garde (`acces.piege`) :

```json
{
  "id": "vei-t-plancher-du-bailli",
  "nom": "Le coffret sous le plancher du bailli",
  "lieu": "vei-cellier-du-bailli",
  "contenant": "coffre",
  "description": "Un coffret de fer noir encastré dans une niche du cellier, fermé par une serrure à ressort. Il contient le vrai registre de vivres du bailli, un billet signé, et une bourse.",
  "contenu": { "pieces": { "po": 85 }, "objets": [{ "objet": "vei-double-registre", "quantite": 1 }, { "objet": "vei-billet-de-dette", "quantite": 1 }], "tables": [] },
  "acces": { "verrou": { "dd": 14 }, "piege": "vei-p-aiguille-du-coffret" },
  "indice": "f-vei-registre-du-bailli"
}
```

(Pour que la clé ouvre sans déclencher le piège : `"verrou": { "dd": 14, "cle": "<id de l'objet clé>" }` et un objet `categorie: "cle"` obtenable dans le monde.)

## Piège avec un effet qui change la suite (pas que des dégâts)

```json
{
  "id": "vei-p-souffle-de-la-flamme",
  "nom": "Souffle de la flamme",
  "lieu": "vei-foyer-de-la-lanterne",
  "resume": "Qui tend la main vers la flamme sans y être invité reçoit un souffle brûlant : la flamme défend son propre cœur.",
  "detection": { "dd": 12, "competence": "perception" },
  "desarmement": { "dd": 14, "competence": "arcanes" },
  "declenchement": "Une main (ou un outil) qui touche la flamme sans la permission d'un Gardien déclenche une langue de feu orange qui cingle.",
  "sauvegarde": { "caracteristique": "dex", "dd": 13, "moitieSiReussite": true },
  "degats": [{ "des": "2d6", "type": "feu" }],
  "effets": [{ "narration": "La flamme vacille un instant et se rétracte, plus petite qu'avant." }],
  "reinitialisation": true
}
```

Autres effets utiles dans `effets` (mêmes effets que partout : `docs/MONDES.md` § « Conditions et effets ») : `{ "rencontre": "<id>" }` (une alarme : la rencontre se joue à la fin de l'action), `{ "flag": "<id>" }`, `{ "fait": "<id>" }`, `{ "jauge": { "id": "<jauge>", "delta": 1 } }`, `{ "objet": { "id": "<objet>", "retirer": true } }` (voler un objet), `{ "pieces": -20 }` (une bourse coupée), `{ "reputation": { "faction": "<id>", "delta": -1 } }`, `{ "debloquer": "<lieu>" }` (le piège ouvre un passage), `{ "attitude": { "pnj": "<id>", "delta": -5 } }`. (`deplacer` déplace un **PNJ**, pas le groupe.)

## Piège sans sauvegarde (un mécanisme, pas des dégâts)

Un piège peut n'avoir ni `sauvegarde` ni `degats` : une alarme ou un enfermement se joue par ses `effets`.

```json
{
  "id": "z3-p-fil-d-alarme",
  "nom": "Fil d'alarme",
  "lieu": "z3-couloir-des-sentinelles",
  "resume": "Un fil de crin tendu à hauteur de cheville, relié à une grappe de clochettes de bronze.",
  "detection": { "dd": 13, "competence": "perception" },
  "desarmement": { "dd": 12, "competence": "escamotage" },
  "declenchement": "Le fil cède sous le pied ; les clochettes s'affolent dans le couloir, et quelque part, une porte claque.",
  "degats": [],
  "etats": [],
  "effets": [{ "rencontre": "z3-r-sentinelles-alertees" }],
  "reinitialisation": false
}
```

## Trésor caché, gardé et qui sert l'histoire

```json
{
  "id": "z4-t-niche-du-scribe",
  "nom": "Une niche sous l'escalier",
  "lieu": "z4-scriptorium",
  "contenant": "cache",
  "description": "Derrière une pierre qui sonne creux, une niche abrite un étui de cuir et une petite bourse.",
  "contenu": { "pieces": { "po": 40 }, "objets": [{ "objet": "z4-journal-du-scribe" }], "tables": [] },
  "acces": { "cache": { "dd": 15, "competence": "investigation" } },
  "gardien": "z4-r-chien-de-garde",
  "indice": "f-z4-ce-que-savait-le-scribe"
}
```

## Objet propre au monde (relique, objet de quête, curiosité)

```json
{
  "id": "z4-journal-du-scribe",
  "nom": "Le journal du scribe",
  "categorie": "livre",
  "rarete": "commun",
  "valeurPo": 5,
  "resume": "Un carnet de cuir, aux pages serrées d'une écriture fine, humides sur les bords.",
  "lore": "Le scribe y notait chaque nuit ce qu'il n'osait dire le jour."
}
```

Objet magique à identifier (le joueur voit d'abord `inconnu`) :

```json
{
  "id": "z4-anneau-des-marees",
  "nom": "Anneau des marées",
  "categorie": "anneau",
  "rarete": "peu-commun",
  "valeurPo": 250,
  "magique": true,
  "attunement": true,
  "resume": "Une fois accordé, l'anneau permet de retenir son souffle deux fois plus longtemps.",
  "identification": 13,
  "inconnu": { "nom": "Anneau de coquillage", "resume": "Un anneau de nacre froide, dont l'intérieur est poli par l'usure." }
}
```

Arme ou armure du monde : `"base": "epee-longue"` (id du catalogue SRD) obligatoire, plus `bonus: { "attaque": 1, "degats": 1 }` et `lore`. Le nom, la `base` et les bonus suffisent : les caractéristiques viennent du SRD.

## Table de butin pondérée

```json
{
  "id": "vei-tb-pillage-gobelin",
  "nom": "Pillage gobelin",
  "palier": 1,
  "entrees": [
    { "poids": 3, "pieces": { "des": "2d6", "unite": "pa" } },
    { "poids": 2, "pieces": { "des": "1d6", "unite": "po" } },
    { "poids": 2, "objet": "fleches", "quantite": 10 },
    { "poids": 2, "objet": "rations", "quantite": 3 },
    { "poids": 1, "objet": "potion-de-guerison" },
    { "poids": 2, "rien": true }
  ]
}
```

Une entrée peut aussi pointer vers une autre table (`"table": "<id>"`). Palier : 1 = niveaux 1 à 4, 2 = 5 à 10, 3 = 11 à 16, 4 = 17 à 20.
