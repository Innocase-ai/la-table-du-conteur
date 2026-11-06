# Gabarits JSON de l'intrigue

Exemple complet et cohérent (un monde fictif, préfixe `z6-`) : une quête principale à embranchement, deux fins posées par leur drapeau, une jauge qui monte avec les jours et se freine, un événement d'écho, une faction. Chaque bloc est validé contre les schémas du moteur. Un fichier de zone est un **tableau** d'entités (`quetes/z6-….json`, `fins/`, `jauges/`, `evenements/`, `factions/`).

## La quête principale : enquête, choix, une issue par fin

```json
{
  "id": "q-la-digue",
  "nom": "La digue qui cède",
  "type": "principale",
  "donneur": "pnj-maitre-des-digues",
  "resume": "La digue du marais cède chaque nuit un peu plus. Le maître des digues veut savoir qui la sabote, et ce qu'il faut sacrifier pour la sauver.",
  "niveau": { "min": 1, "max": 4 },
  "debut": "e-enqueter",
  "etapes": [
    { "id": "e-enqueter", "texte": "Trouver qui ouvre la vanne la nuit.", "completion": { "fait": "f-vanne-ouverte-par-la-guilde" }, "suivantes": ["e-choisir"] },
    { "id": "e-choisir", "texte": "Décider : dénoncer la guilde, ou fermer les yeux contre sa protection.", "completion": { "ou": [{ "flag": "choix-digue-denoncer" }, { "flag": "choix-digue-pacte" }] }, "suivantes": ["issue-denoncer", "issue-pacte"] },
    { "id": "issue-denoncer", "texte": "Livrer la guilde au conseil.", "completion": { "flag": "choix-digue-denoncer" }, "termine": true, "effets": [{ "xp": 300 }, { "flag": "fin-digue-sauvee" }, { "fin": "fin-digue-sauvee" }] },
    { "id": "issue-pacte", "texte": "Laisser faire la guilde.", "completion": { "flag": "choix-digue-pacte" }, "termine": true, "effets": [{ "xp": 300 }, { "flag": "fin-pacte-noye" }, { "fin": "fin-pacte-noye" }] }
  ],
  "recompenses": { "xp": 0, "pieces": 0, "objets": [], "effets": [] },
  "ramifications": "Si la jauge atteint son dernier palier avant le choix, la digue cède : la fin de submersion l'emporte."
}
```

Elle devient active par un sujet du donneur : `"effets": [{ "quete": { "id": "q-la-digue", "statut": "active" } }]`.

## Les fins (condition = le drapeau de l'issue)

```json
{
  "id": "fin-digue-sauvee",
  "nom": "La digue tient",
  "condition": { "flag": "fin-digue-sauvee" },
  "epilogue": "La guilde jugée, la vanne scellée, la digue tient l'hiver. Mais le marais garde le souvenir de ceux qu'on a livrés, et les barques de la guilde ne reviennent plus au port.",
  "consequences": []
}
```

```json
{
  "id": "fin-submersion",
  "nom": "Le marais reprend tout",
  "condition": { "flag": "jauge-crue-6" },
  "epilogue": "Une nuit, l'eau passe par-dessus la digue. Au matin, il ne reste du village que les toits et le clocher, où l'on sonne pour les absents.",
  "consequences": []
}
```

## La jauge : elle monte chaque jour, ses paliers changent le monde, on peut la freiner

```json
{
  "id": "jauge-crue",
  "nom": "La crue",
  "resume": "L'eau du marais contre la digue.",
  "min": 0,
  "max": 6,
  "initial": 1,
  "paliers": [
    { "seuil": 2, "nom": "L'eau monte", "narration": "Les caves du bas-village prennent l'eau ; on monte les sacs de grain au grenier.", "effets": [{ "flag": "jauge-crue-2" }] },
    { "seuil": 3, "nom": "Les gués noyés", "narration": "Les gués du marais disparaissent sous l'eau brune : seuls les chemins de crête restent praticables.", "effets": [{ "flag": "jauge-crue-3" }] },
    { "seuil": 4, "nom": "La peur", "narration": "Des familles chargent leurs charrettes. Le maître des digues ne dort plus.", "effets": [{ "flag": "jauge-crue-4" }, { "reputation": { "faction": "faction-guilde-des-eclusiers", "delta": -10 } }] },
    { "seuil": 6, "nom": "La rupture", "narration": "La digue cède dans un grondement de pierres.", "effets": [{ "flag": "jauge-crue-6" }, { "fin": "fin-submersion" }] }
  ],
  "evolution": [
    { "declencheur": "jour", "delta": 1 },
    { "declencheur": "condition", "delta": -2, "condition": { "flag": "vanne-scellee" } }
  ]
}
```

(`lieu` dans `evolution` fait bouger la jauge à **chaque** entrée dans ce lieu ; pour une seule fois, `"declencheur": "condition", "condition": { "lieu": "<id>" }`.)

## Un événement d'écho (deux jours après un choix, là où se trouve le groupe)

```json
{
  "id": "ev-echo-denonciation",
  "declencheur": "jour",
  "condition": { "et": [{ "flag": "choix-digue-denoncer" }, { "non": { "flag": "ev-echo-denonciation-vu" } }] },
  "unique": true,
  "narration": "Au matin, une barque de la guilde est échouée devant l'auberge, la coque fendue à la hache. Personne n'a rien vu.",
  "effets": [{ "flag": "ev-echo-denonciation-vu" }, { "reputation": { "faction": "faction-guilde-des-eclusiers", "delta": -20 } }]
}
```

## Une faction (la réputation sert de condition ailleurs)

```json
{
  "id": "faction-guilde-des-eclusiers",
  "nom": "La guilde des éclusiers",
  "resume": "Ceux qui manœuvrent les vannes du marais, et qui vivent des droits de passage.",
  "objectifs": ["Garder le contrôle des vannes", "Faire payer le passage des barges"],
  "chef": "pnj-maitresse-eclusiere",
  "reputation": 0,
  "paliers": [{ "seuil": -30, "nom": "Ennemis", "effet": "Les éclusiers refusent de parler au groupe." }],
  "relations": []
}
```

Lire la réputation : `"condition": { "faction": { "id": "faction-guilde-des-eclusiers", "min": 20 } }` sur un sujet, une option de dilemme, un événement ou une fin. Les `paliers` et `relations` de la faction ne sont que des notes.
