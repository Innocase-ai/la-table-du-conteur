# Gabarit de lieu de départ et contrôle de densité

**Fiche F2 du PRD de la saga** (`docs/PRD-SAGA.md`), livrée le 20/11/2026. Fichier de référence des auteurs (humains ou agents) : à lire avant de concevoir le lieu de départ d'un épisode (skill `creer-monde`, étapes 2 et 4) et en relisant un avis `densite` ou `gabarit` de `pnpm monde manque` (skill `verifier-completude-histoire`).

**Le but : un lieu de départ où chaque pièce offre quelque chose à faire.** Le gabarit dit *quels emplacements* un village de départ comporte ; le barème dit *combien de couches* porte une pièce. Les deux sont **indicatifs** : le contrôle ne produit que des **avis**, jamais une erreur, et ne remplit rien à la place de l'auteur. Un avis se lit, puis se décide : on le suit, ou on l'écarte en connaissance de cause (`revue.json` n'est pas nécessaire : un avis de gabarit ne fait pas échouer `pnpm monde verifier`).

Les données lues par le contrôle sont dans `packages/regles/src/monde/gabarit-depart.json` (emplacements, bornes, couches, aides) ; la logique est dans `gabarit-depart.ts`. Ce document et ce fichier disent la même chose ; un test (`packages/regles/tests/gabarit-depart.test.ts`) vérifie que chaque emplacement et chaque couche du fichier est décrit ici.

## 1. S'en servir (opt-in par les données)

Le contrôle **ne s'applique qu'à un monde qui déclare le gabarit** dans `monde.json`, sous `depart` :

```json
"depart": {
  "lieu": "place-du-village",
  "intro": "…",
  "gabarit": {}
}
```

- **`depart.gabarit`** (facultatif, objet) : sa seule présence, même `{}`, active le contrôle. Sans lui, un monde est joué, validé et vérifié exactement comme avant (les trois histoires livrées ne le déclarent pas). Il ne change rien au jeu.
- **`depart.gabarit.emplacements`** (facultatif) : quand le contrôle ne reconnaît pas un emplacement tout seul (§ 3), l'auteur dit quel lieu le tient : `{ "sanctuaire": "cabane-du-fond", "batiments": ["forge", "moulin", "grenier", "echoppe"] }`. Un id de lieu, ou une liste d'ids pour `batiments`. Une clé qui n'est pas un emplacement du gabarit, ou un lieu qui n'existe pas, est signalé (avis).
- Pour un épisode, déclarer **les deux** : `"format": "episode"` (profil du validateur : 10 à 13 pièces, 3 à 8 quêtes, sujets, récits d'arrivée, butin) et `depart.gabarit` (densité et emplacements du lieu de départ). Quand le gabarit est déclaré, le profil « épisode » ne répète plus l'avis grossier « pièces vides » : le contrôle de densité le remplace.

Où les avis apparaissent : **`pnpm monde manque <monde>`** (rubriques `densite` et `gabarit`, toujours des « avis », jamais des « manques » : le code de sortie reste 0) et, par lui, la ligne « Complétude » de **`pnpm monde verifier <monde>`** (⚠️ « à lire », jamais ❌).

## 2. Les emplacements du gabarit

Le **lieu de départ** est le lieu `depart.lieu`, ou son parent s'il n'a pas de pièces (on démarre alors dans une pièce du hub). Ses **pièces** sont lui-même et tous ses descendants (régions et routes exceptées). Un village d'épisode compte **10 à 13 pièces** (contrôlé par le profil `format: "episode"` ; par le gabarit seul quand le monde n'a pas ce profil).

| Emplacement | Ce qui est attendu | Pièces |
| --- | --- | --- |
| `batiments` | au moins **4 bâtiments d'une seule pièce**, directement dans le lieu de départ (forge, grenier, moulin, échoppe, étable…) | 1 chacun |
| `taverne` | une taverne avec son tavernier (un PNJ), pièces à visiter : salle commune, cave, cour, étage | **2 ou 3** |
| `chambre` | une chambre qui est un **service de repos** de la taverne (service de type `nuit`, ou service de lieu `chambre`), pas une pièce à visiter | — |
| `sanctuaire` | un sanctuaire avec un **soigneur** (PNJ qui a un service de type `soins`) | **1** |
| `maison-du-chef` | la maison (ou la halle) du chef du village ; le chef y est présent (au moins un PNJ) | **2 ou 3** |
| `marchand` | au moins un **marchand** : un PNJ qui a une boutique (`boutique`), dans une pièce du lieu de départ | — |

Plan type d'un village de 10 pièces : la place (le hub) ; la taverne et sa cave (2) ; la maison du chef et son cabinet (2) ; le sanctuaire (1) ; quatre bâtiments d'une pièce (4), dont la forge du marchand. On monte à 13 avec une pièce de plus à la taverne et à la maison du chef, et un cinquième ou un sixième bâtiment.

## 3. Comment le contrôle reconnaît un emplacement

D'abord la **déclaration de l'auteur** (`depart.gabarit.emplacements`). Sinon, d'après les données, en parcourant les pièces dans l'ordre (le lieu de départ d'abord, puis ses descendants) :

- **`taverne`** : la première pièce qui offre une nuit (un PNJ qui y habite a un service de type `nuit`, ou le lieu a un service `chambre`, `dortoir`, `auberge`…), sinon dont le nom ou l'id contient auberge, taverne, relais ou hostellerie. Ses « pièces » sont elle-même et ses descendants. **`chambre`** : un service de repos dans la taverne ou ses pièces.
- **`sanctuaire`** : la première pièce qui offre des soins (un PNJ qui y habite a un service de type `soins`, ou le lieu a un service `soins`), sinon dont le nom ou l'id contient sanctuaire, temple, chapelle, infirmerie, hospice ou oratoire. Sans soigneur, le contrôle le dit.
- **`maison-du-chef`** : la première pièce dont le nom ou l'id contient chef, conseil, maire, mairie, seigneur, bailli, doyen, manoir, capitaine, bourgmestre ou commandement. C'est la reconnaissance la plus fragile : **déclarer l'emplacement** si le nom du lieu est autre (« la halle », « la grande maison »).
- **`marchand`** : la première pièce où habite un PNJ avec une `boutique`.
- **`batiments`** : les pièces enfants directs du lieu de départ, sans pièce à l'intérieur, qui ne font partie ni de la taverne, ni du sanctuaire, ni de la maison du chef.

Le **soigneur** et le **marchand** se reconnaissent par leur **lieu principal** (`lieu` du PNJ), pas par leurs `presences` : un PNJ qui ne fait que passer ne fait pas un emplacement.

## 4. Le barème : 2 à 4 couches par pièce

Une pièce du lieu de départ porte **2 à 4 couches** parmi six. Le contrôle signale une pièce **vide** (0 couche) ou **pauvre** (1 couche, avec les couches qui lui manquent). Il ne signale **jamais** une pièce qui a plus de 4 couches : le maximum est un conseil de dosage (une pièce qui a tout devient un donjon), pas une règle ; on ne remplit pas mécaniquement.

| Couche | Ce qui compte (ce que le contrôle lit) |
| --- | --- |
| `pnj` | un PNJ dont le lieu est cette pièce, ou qui y passe (`presences`) |
| `contenant` | un trésor de la pièce (coffre, cache, étagère, autel, tombe…) hors objet posé au sol |
| `obstacle` | un verrou ou un piège : trésor verrouillé ou piégé, piège de la pièce, énigme, passage verrouillé (`liens[].verrou`) |
| `adversaire` | une rencontre de **combat** (ou mixte, avec des monstres) dans la pièce, dont les adversaires laissent un butin (dépouilles, tables ou trésors de la rencontre, ou trésor gardé par elle) |
| `service` | un service du lieu (`services` : repas, chambre, soins, forge, marché…) ou d'un PNJ présent (boutique, `services` du PNJ) |
| `objet` | un objet **à ramasser** (trésor de contenant `sol`) ou un **détail à examiner** : fait du lieu, examen (`examens/`), événement à choix, événement du monde |

Quelques conséquences voulues : un marchand compte deux couches (le PNJ et son service) ; un coffre verrouillé en compte deux (contenant, obstacle) ; une pièce où l'on ne peut que lire une inscription n'en a qu'une (objet) : ajouter un PNJ, un service ou un contenant, ou la fondre dans une autre pièce. **La même chose posée deux fois ne compte qu'une fois** (deux PNJ dans une pièce = une couche `pnj`) : varier les couches, c'est varier ce que le joueur fait (parler, ouvrir, crocheter, se battre, acheter, examiner).

## 5. Ce que le contrôle ne fait pas

- Il ne bloque rien (P1 du PRD) : ni erreur de validation, ni code de sortie 1, ni échec de `pnpm monde verifier`. Les avis ne sont pas à « rejeter » dans `revue.json`.
- Il ne juge ni la qualité des textes, ni l'équilibre du butin (c'est `creer-pieges-tresors` et F4), ni la quête (F3).
- Il ne contrôle que le lieu de départ ; les sites de quête (donjons, grottes) suivent leurs propres règles (`creer-rencontres`, `creer-pieges-tresors`).
- Il ne lit pas le sens : un PNJ « tavernier » qui n'a ni service de nuit ni nom évocateur n'est pas reconnu comme tavernier ; déclarer l'emplacement.
- Il ne vérifie pas encore que chaque pièce a une image : c'est la rubrique `images` de `manque`.

## 6. Ce que donneraient les trois histoires livrées (audit du 20/11/2026)

Aucune ne déclare `depart.gabarit` : elles ne reçoivent **aucun** avis de ce genre (test dans `gabarit-depart.test.ts`). Pour mémoire, un contrôle forcé (`avisGabarit(dm, { forcer: true })`, jamais utilisé par les commandes) leur donnerait :

| Monde | Avis forcés |
| --- | --- |
| La Tombe des Rois Serpents (fort, 7 pièces) | 7 pièces (visé 10 à 13), taverne d'une pièce, pas de maison du chef, 2 pièces à une couche (scriptorium, écuries) : **5 avis** |
| La Marche d'Ombrefiel (le départ est l'auberge, 6 pièces) | 6 pièces, aucun bâtiment d'une pièce, taverne de 6 pièces, pas de maison du chef : **4 avis** |
| La Dîme des Roseaux (Mireval, 9 pièces) | 9 pièces, 3 bâtiments sur 4, pas de sanctuaire, halle du conseil d'une pièce et sans PNJ, 5 pièces à une couche (place, roue du moulin, cave, halle, lavoir) : **10 avis** |

C'est le barème du PRD, pas un défaut de ces histoires : elles ont été écrites avant lui.

## 7. Pour le futur village pilote (F7)

Un village qui suit ce document **ne produit aucun avis** de densité ni de gabarit. Le test `gabarit-depart.test.ts` en tient un exemple : 10 pièces, une taverne de 2 pièces avec sa chambre, un sanctuaire et sa soigneuse, une maison du chef de 2 pièces, un marchand, 4 bâtiments, chaque pièce à 2 ou 3 couches. En cas d'avis, deux issues : étoffer la pièce (un PNJ, un contenant, un service, un détail à examiner), ou la fondre dans une pièce voisine.
