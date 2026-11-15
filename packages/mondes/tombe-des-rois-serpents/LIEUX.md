# Atlas des lieux de La Tombe des Rois Serpents

<!-- VALIDATION -->
**Validé le 15/11/2026 par l'utilisateur** : textes des lieux (arrivées, résumés, accroches, passages, variantes d'arrivée), faits, examens et codex, pour le Fort et le Bivouac, le niveau 1, le niveau 2 et le niveau 3 (récapitulatif : `RECAP-VALIDATION-LIEUX.md`). Gelé : tout changement passe par l'accord de l'utilisateur.
<!-- VALIDATION -->

Document de synthèse géographique de la campagne **La Tombe des Rois Serpents** dans le **Val du Couchant**.

---

## Niveau 0 : Carte du Val du Couchant (`val-du-couchant`)

- **Relief & Climat :** plateaux calcaires blancs, dunes rousses et caillasse sèche balayée par un vent chaud à cinq jours à l'ouest de Valdargent.
- **Palette & Matières :** `ocre sable`, `vert-de-gris serpentin`, `noir de suie`, `or terni`, `violet alchimique`.

| id | nom | type | position | heures vers voisins | rôle |
| --- | --- | --- | --- | --- | --- |
| `fort-du-reflet-beni` | Fort du Reflet Béni | `camp` | (75, 55) | 8h → `bivouac-entree` | Départ, refuge `sur`, soins, forge, apothicaire |
| `bivouac-entree` | Le Bivouac du Seuil | `lieu-dit` | (45, 55) | 8h → fort, 1h → tombe | Campement de Martin & mules, `repos: sur`, partage final |
| `tombe-des-rois` | La Tombe des Rois Serpents | `donjon` | (25, 55) | 1h → bivouac | Entrée de la nécropole en 3 niveaux |

---

## Niveau 1 de la Tombe : Le Seuil Trompeur (`n1-*`)

1. `n1-couloir-entree` (Salle 1) : couloir ensoleillé, 4 niches latérales et porte barrée au sud (`verrou` DD 13).
2. `n1-tombes-des-gardes` (Salles 2 & 3) : statues d'argile, cercueils piégés au gaz vert (`p-gaz-sepulcres`), 3 amulettes d'or.
3. `n1-tombe-du-sorcier` (Salle 4) : statue bleue étoilée portant l'anneau maudit `anneau-griffe-croc` + 1 amulette.
4. `n1-porte-et-fausse-tombe` (Salles 5 & 6) : piège du marteau oscillant (`p-marteau-porte-niveau1`) + 3 cercueils royaux factices (`r-squelettes-fausse-tombe`).
5. `n1-faux-temple` (Salle 7) : immense statue du dieu serpent, mur est humide, passage secret sous l'idole (`cache` DD 12) vers le Niveau 2.

---

## Niveau 2 de la Tombe : Les Catacombes Noires (`n2-*`)

1. `n2-hall-aux-statues` (Salles 8 & 9) : 6 colosses de basalte dans le noir absolu, statue désaxée cachant le réduit `n2-salle-garde-secrete` (Salle 10 : 2 dagues + icône 150 po).
2. `n2-atrium` (Salle 11) : carrefour octogonal autour d'un bassin noir abritant `r-bleme-atrium` et ses bijoux noyés (`t-bassin-atrium`).
3. `n2-tombe-xisor` (Salle 12) : sarcophage de Xisor le Vert, piège `p-onde-xisor` et parchemin de vague tonnante.
4. `n2-tombe-sparamantur` (Salle 13) : crypte à demi effondrée (`r-sparamantur-squelette`) et ornements.
5. `n2-tombe-franbinzar` (Salle 14) : momification ratée (`r-gelee-ocre-franbinzar`) et bague d'argent.
6. `n2-sacristie` (Salle 15) : 3 lits de pierre, parchemins livrant le vrai nom de **Baltoplate**, icône sertie d'émeraudes (200 po).
7. `n2-soldats-d-argile` (Salles 16 & 17) : tombe inachevée et 18 statues creuses en 3×6 ; passage secret sud-ouest (`cache` DD 16) vers `n3-hall-du-basilic`.
8. `n2-escalier-piege` (Salle 18) : 3e volée basculante à pointes (`p-escalier-basculant`).
9. `n2-arene-gardien` (Salle 19) : 5 boucliers en trophée et le **Gardien osseux serpentin** (`r-gardien-osseux`).
10. `n2-gouffre-et-effondrement` (Salles 20–22) : corniche glissante (`r-traversee-corniche`), éboulis sans issue et porte piégée (`p-marteau-porte-niveau2`) menant au Niveau 3.

---

## Niveau 3 de la Tombe : Le Cœur, Xiximantre & les Gobelins (`n3-*`)

- **Aile ouest & Fosse :** `n3-salle-ceremonie` (23–26 : fontaine à statue volée, fosse `p-fosse-ceremonie` et bourse) → `n3-dome-et-esclaves` (27–28) → `n3-salle-du-tresor` (29, clé du Basilic / DD 20) & `n3-fosse-sacrificielle` (30, flamme éternelle et gemmes).
- **Cœur :** `n3-vestibule-garde` (31, 36–37 : 2 gardiens pétrifiés) → `n3-salle-invocation` (32 : Baltoplate, dague +1, serpent de pierre), `n3-autel-et-couloir-lames` (33–34 : dalles `p-dalles-faux-couloir` et énigme `e-autel-du-cobra`), `n3-repos-des-pretres` (35, refuge `repos: sur`), `n3-hall-du-basilic` (38–39 : `r-basilic-enchaine` et `cle-du-basilic`).
- **Antre de Xiximantre :** `n3-antichambre-xiximantre` (40 : lampes violettes et `xiximantre`) → `n3-reserve-et-oubliettes` (41 : safran, graines éteintes, 4 prisonniers gobelins) → `n3-laboratoire` (42 : `cle-de-xiximantre`) & `n3-salle-du-trone` (43 : serpent de pierre, trône maudit et 8 miroirs).
- **Terriers gobelins :** `n3-porte-cylindre-et-reserve` (44–46 : sas piégé `p-sas-cylindre`) → `n3-salle-commune-gobeline` (47–49 : guetteurs et statue d'or de la fontaine) → `n3-ferme-champignons` (50 : `skriik-le-cueilleur`, `couronne-rois-serpents` cachée dans le terreau) → `n3-escalier-surface` (51–52 : raccourci secret vers le Hall du Basilic et sortie cachée sous les racines vers `bivouac-entree`).

---

<!-- CONTENU-GENERE-DEBUT -->
## Contenu des lieux (généré le 15/11/2026 depuis les données du monde)

Ce tableau est produit par script : il reflète les fichiers du monde (PNJ, rencontres, pièges, trésors, énigmes, faits, examens). **Statut : validé le 15/11/2026 par l'utilisateur (non commité).**

### Val du Couchant, Fort et Bivouac

| lieu | PNJ | rencontres | pièges | trésors | énigmes | faits | examens |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `val-du-couchant` | — | — | — | — | — | `f-val-empire-oublie` | `exa-val-borne-serpent` |
| `fort-du-reflet-beni` | `frere-balthazar`, `marta-aubergiste`, `torin-armurier`, `solene-caravaniere`, `varnac-le-borgne`, `soeur-lysandre`, `mireille-cartographe`, `sergent-rodrigue`, `corvin-le-scribe`, `nolan-palefrenier`, `commandeur-garin`, `elara-herboriste` | `r-contrat-citerne` | — | — | — | `f-contrat-moitie-part`, `f-fort-contient-les-horreurs` (histoire 11), `f-varnac-survivant` (investigation 11) | `exa-fort-bannieres`, `exa-fort-consigne` |
| `bivouac-entree` | `gaspard-muletier`, `lise-guetteuse`, `martin-le-valet` | `r-contrat-deserteurs`, `r-contrat-ankheg`, `r-contrat-pillards-crete` | — | — | — | `f-martin-compte-tout` (intuition 10) | `exa-bivouac-racines`, `exa-bivouac-balance` |
| `tombe-des-rois` | `brennan-terrassier`, `jehan-fosseyeur` | `r-chantier-sable` | — | — | — | `f-tranchee-forcee` | `exa-tombe-linteau` |

### Niveau 1 : le Seuil trompeur

| lieu | PNJ | rencontres | pièges | trésors | énigmes | faits | examens |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `n1-couloir-entree` | — | — | — | `t-niche-du-pilleur` | — | `f-barre-contre-ce-qui-sort` (investigation 11) | `exa-couloir-bas-reliefs`, `exa-couloir-cartouches` |
| `n1-tombes-des-gardes` | — | `r-statues-d-argile-eveillees` | `p-gaz-sepulcres` | `t-amulettes-gardes` | — | `f-vapeur-des-sepulcres` (perception 12), `f-passage-temple-decouvert` (investigation 13) | `exa-gardes-argile`, `exa-gardes-platre` |
| `n1-tombe-du-sorcier` | — | — | — | `t-anneau-du-sorcier` | — | `f-griffe-croc-maudite` (arcanes 13), `f-traces-expedition-n1` (survie 10) | `exa-sorcier-statue`, `exa-sorcier-poussiere` |
| `n1-porte-et-fausse-tombe` | — | `r-squelettes-fausse-tombe` | `p-marteau-porte-niveau1` | `t-dorures-fausse-tombe` | — | `f-passage-temple-decouvert` (investigation 14), `f-marteaux-du-seuil` (investigation 12), `f-squelettes-fausse-tombe` (religion 13) | `exa-fausse-tombe-doree`, `exa-fausse-tombe-couvercles` |
| `n1-faux-temple` | — | — | `p-bouche-de-l-idole` | `t-offrande-de-l-idole` | — | `f-passage-temple-decouvert` (perception 12), `f-fausse-tombe-leurre` (investigation 13), `f-eau-sous-l-idole` (perception 10) | `exa-faux-temple` |

### Niveau 2 : les Catacombes noires

| lieu | PNJ | rencontres | pièges | trésors | énigmes | faits | examens |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `n2-hall-aux-statues` | — | `r-mantes-du-noir-absolu` | — | — | — | `f-noir-absolu-n2`, `f-statue-pivotante-garde-secrete` (perception 14) | `exa-hall-six-statues`, `exa-hall-parois` |
| `n2-salle-garde-secrete` | — | — | — | `t-salle-garde-secrete` | — | — | `exa-garde-tablette` |
| `n2-atrium` | — | `r-bleme-atrium` | — | `t-bassin-atrium` | — | `f-vraies-tombes-n2` (investigation 10), `f-bleme-du-bassin` (perception 12) | `exa-atrium-margelle`, `exa-atrium-cartouches` |
| `n2-tombe-xisor` | — | — | `p-onde-xisor` | `t-parchemin-xisor` | — | `f-xisor-haut-pretre` (histoire 11), `f-dalle-xisor-onde` (arcanes 14) | `exa-xisor-sceptre` |
| `n2-tombe-sparamantur` | — | `r-sparamantur-squelette` | — | `t-ornements-sparamantur` | — | `f-sparamantur-veille` (perception 11) | `exa-sparamantur-plaques` |
| `n2-tombe-franbinzar` | — | `r-gelee-ocre-franbinzar` | — | `t-bague-franbinzar` | — | `f-franbinzar-gelee` (nature 11) | `exa-franbinzar-cuvettes` |
| `n2-sacristie` | — | — | — | `t-sacristie-icone` | — | `f-vrai-nom-baltoplate`, `f-cercle-d-argent-garde` (religion 10) | `exa-sacristie-casiers` |
| `n2-soldats-d-argile` | — | `r-statues-creuses-serpents` | — | `t-statue-creuse`, `t-outils-tombe-inachevee` | — | `f-soldats-argile-creux` (investigation 10), `f-chantier-abandonne` (histoire 12), `f-passage-soldats-vers-n3` (perception 16) | `exa-soldats-argile-fentes`, `exa-soldats-outils` |
| `n2-escalier-piege` | — | — | `p-escalier-basculant` | — | — | `f-escalier-basculant` (investigation 12) | `exa-escalier-serpents` |
| `n2-arene-gardien` | — | `r-gardien-osseux` | — | `t-boucliers-arene` | — | `f-gardien-osseux-gouffre`, `f-boucliers-trophees` (investigation 10) | `exa-arene-boucliers`, `exa-arene-griffures` |
| `n2-gouffre-et-effondrement` | — | `r-traversee-corniche` | `p-marteau-porte-niveau2` | — | — | `f-porte-niveau-3-corniche` | `exa-gouffre-eboulis` |

### Niveau 3 : le Cœur, Xiximantre et les gobelins

| lieu | PNJ | rencontres | pièges | trésors | énigmes | faits | examens |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `n3-salle-ceremonie` | — | `r-chauves-souris-et-fosse` | `p-fosse-ceremonie` | `t-bourse-fosse-nord` | — | `f-statue-fontaine-volee` (investigation 12), `f-fosse-dalles-creuses` (perception 13) | `exa-ceremonie-vasque` |
| `n3-dome-et-esclaves` | — | — | — | — | — | `f-anneaux-d-esclaves` (histoire 10), `f-tresor-porte-de-fer` (investigation 11) | `exa-dome-chaines` |
| `n3-salle-du-tresor` | — | — | — | `t-grand-tresor-rois`, `t-console-de-marbre` | — | — | `exa-tresor-pieces` |
| `n3-fosse-sacrificielle` | — | `r-corniche-fosse-sacrificielle` | — | `t-gemmes-fosse-flamme` | — | `f-flamme-eternelle-fosse` (religion 12) | `exa-fosse-flamme` |
| `n3-vestibule-garde` | — | — | — | `t-garde-petrifie` | — | `f-gardes-vraiment-petrifies` (nature 12), `f-plaintes-derriere-la-porte-runique` | `exa-vestibule-gardes` |
| `n3-salle-invocation` | `baltoplate` | `r-baltoplate-devoilee` | — | `t-autel-invocation` | `e-cercle-baltoplate` | `f-serpent-de-pierre-ouvre-la-porte` (investigation 12) | `exa-invocation-cercle`, `exa-invocation-table` |
| `n3-autel-et-couloir-lames` | — | — | `p-dalles-faux-couloir`, `p-buses-du-cobra` | `t-offrandes-autel-cobra` | `e-autel-du-cobra` | `f-dalles-claires-sures` (investigation 14) | `exa-autel-cobra`, `exa-autel-dalles` |
| `n3-repos-des-pretres` | — | — | — | `t-coussins-des-pretres` | — | — | `exa-repos-coussins` |
| `n3-hall-du-basilic` | — | `r-basilic-enchaine` | — | `t-collier-du-basilic` | — | `f-cle-sur-collier-basilic` (perception 12), `f-chaine-du-basilic` (investigation 11), `f-porte-hall-encoche-serpent` | `exa-basilic-chaine`, `exa-basilic-porte` |
| `n3-antichambre-xiximantre` | `xiximantre` | `r-xiximantre-courroux` | — | — | — | `f-empire-chute-xiximantre` (intuition 13), `f-xiximantre-troque-curiosites` (intuition 11), `f-xiximantre-ne-supporte-pas` (intuition 14), `f-cle-de-xiximantre-ceinture` (perception 12) | `exa-xiximantre-tapisseries`, `exa-xiximantre-lutrin` |
| `n3-reserve-et-oubliettes` | `krak-oubliettes`, `elios-captif` | `r-grilles-des-oubliettes` | — | `t-reserve-xiximantre` | — | `f-prisonniers-gobelins-oubliettes`, `f-elios-recopie-les-commandes`, `f-reserve-escalier-trone` (perception 15) | `exa-reserve-grilles` |
| `n3-laboratoire` | — | — | `p-fiole-piegee` | `t-laboratoire-potions` | — | — | `exa-laboratoire-fioles` |
| `n3-salle-du-trone` | — | — | — | `t-miroirs-salle-trone`, `t-compartiment-du-trone` | `e-miroirs-du-trone` | `f-rumeur-trone-maudit` (arcanes 13), `f-trone-insuffle-la-folie` (arcanes 16), `f-couronne-manque-au-trone` (perception 10) | `exa-trone-serpents`, `exa-trone-estrade` |
| `n3-porte-cylindre-et-reserve` | — | — | `p-sas-cylindre` | `t-resserre-gobeline` | — | `f-sas-sens-du-tambour` (investigation 12) | `exa-sas-tambour`, `exa-sas-fosse` |
| `n3-salle-commune-gobeline` | `grib-guetteur`, `grignote-marmite` | `r-eclaireurs-gobelins` | — | `t-statue-fontaine-gobelins` | — | `f-gobelins-refugies-aile-ouest`, `f-statue-or-salle-commune` | `exa-commune-statue`, `exa-commune-barricade` |
| `n3-ferme-champignons` | `trou-noir-gobelin`, `skriik-le-cueilleur` | `r-troc-skriik-champignons` | — | `t-couronne-terreau` | — | `f-couronne-chez-gobelins` (investigation 12), `f-skriik-troque-couronne` (intuition 12) | `exa-ferme-planches` |
| `n3-escalier-surface` | — | — | — | — | — | `f-sortie-racines-surface`, `f-raccourci-gobelin-basilic` (perception 14) | `exa-escalier-racines` |

<!-- CONTENU-GENERE-FIN -->
