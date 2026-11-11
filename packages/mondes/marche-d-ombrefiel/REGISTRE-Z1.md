# Registre des entités de la zone 1 (Carrefour d'Aldric) — contrat des agents de contenu

Document de travail (le moteur ne le lit pas). **Les ids ci-dessous sont fixes** : chaque agent écrit les entités de **son lieu** et ne fait que **citer** les autres par leur id. Ajouter un id = l'ajouter ici d'abord. Préfixes : `ald-` pour tout ce que la zone 1 crée (rencontres `ald-r-`, pièges `ald-p-`, trésors `ald-t-`, énigmes `ald-e-`, objets `ald-o-` sauf ceux déjà au registre de la BIBLE §7, faits `f-ald-`, événements `ald-ev-`). Les ids de la BIBLE §7 (PNJ, objets clés, drapeaux, faits centraux, quêtes principales) gardent leur forme sans préfixe.

## Fichiers (un par dossier et par lieu)

`pnj/z1-<lieu>.json`, `objets/z1-<lieu>.json`, `tresors/z1-<lieu>.json`, `pieges/z1-<lieu>.json`, `enigmes/z1-<lieu>.json`, `rencontres/z1-<lieu>.json`, `faits/z1-<lieu>.json`, `quetes/z1-<nom>.json`. Codes de lieu : `auberge`, `pont`, `moulin`, `combe`, `carriere`, `tertre`. Un PNJ, un trésor, un piège, une énigme se rattachent à leur **lieu le plus précis** par leur champ `lieu` (id de sous-lieu quand il existe).

## Rencontres (7 combats, 8 sans combat)

| id | Lieu précis | Type | Contenu |
| --- | --- | --- | --- |
| `ald-r-chariot-enlise` | `ald-auberge-de-bregor` (arrivée, scène d'ouverture sur la route) | combat | 3 `bandit` |
| `ald-r-keldan-au-perron` | `ald-auberge-perron-et-potence` | combat | `acolyte` nommé « Keldan le Pâle » + 2 `molosse` |
| `ald-r-silas-confronte` | `ald-auberge-salle-commune` | social | le groupe confronte Silas (alternatives : intimider, soudoyer, filer) |
| `ald-r-barnabe` | `ald-auberge-perron-et-potence` | social (décalée) | Barnabé le Casse-Pieds |
| `ald-r-embuscade-du-pont` | `ald-pont-talus-d-embuscade` | combat | 3 `bandit`, 1 `eclaireur`, `mephite-vaporeux` optionnel |
| `ald-r-chariot-d-aldwin` | `ald-pont-carcasse-du-chariot` | social | le coffret et le mort (dilemme) |
| `ald-r-thibault` | `ald-pont-tablier-et-breche` | social (décalée) | Thibault le Pêcheur de Néant |
| `ald-r-guetteurs-du-moulin` | `ald-moulin-plateforme-du-cor` | combat | 2 `combattant-gobelin` |
| `ald-r-deserteurs-de-la-ferme` | `ald-moulin-ferme-haddon` | social | 2 déserteurs ; repli `garde` |
| `ald-r-godefroy` | `ald-moulin-tertre-et-approche` | social (décalée) | Messire Godefroy |
| `ald-r-bourru-et-kobolds` | `ald-combe-antre-du-vieux-bourru` | combat | `ours-brun` + 3 `combattant-kobold` (évitable) |
| `ald-r-demi-dent-et-sa-bande` | `ald-carriere-huttes-et-poste-de-commandement` | combat | `chef-gobelin`, `molosse`, 4 `combattant-gobelin` (3 temps) |
| `ald-r-reddition-de-demi-dent` | idem | social | reddition à 5 PV ou moins (dilemme) |
| `ald-r-squelettes-du-tombeau` | `ald-tertre-sarcophage` | combat | 3 `squelette` (évitable par le rite) |
| `ald-r-sentinelles-de-nuit` | `ald-tertre-cercle` | social (décalée) | squelettes sentinelles muets |

## Pièges, trésors, énigme

Pièges : `ald-p-tonneau-du-perron` (auberge, 1E), `ald-p-fosses-a-pieux` (carrière, périmètre), `ald-p-dalle-a-javelines` (tertre, antichambre). Trésors : `ald-t-coffre-de-silas` (C1, étage), `ald-t-trappe-du-lion` (C2, cellier), `ald-t-cache-du-puits` (C3, cour), `ald-t-coffret-d-aldwin` (C4, carcasse du chariot), `ald-t-boite-de-la-ferme` (C5), `ald-t-pot-des-kobolds` (C6, falaise), `ald-t-coffre-de-demi-dent` (C7, huttes), `ald-t-sarcophage` (C8). Énigme : `ald-e-carnet-de-silas` (étage, test de déchiffrement).

## Objets (ids BIBLE §7 et ajouts)

BIBLE : `spatha-d-aethelgard`, `bouclier-d-aethelgard`, `culotte-a-rubans`, `dague-langue-d-acier`, `bottes-de-saut-du-gobelin`, `chope-inepuisable`, `registre-de-convoi`, `echantillon-de-fonte-friable`, `ordre-de-keldan`, `marteau-du-brise-roc` (zone 2, hors zone 1). Ajouts zone 1 : `ald-o-carnet-de-silas`, `ald-o-luth-de-finbar`, `ald-o-torque-d-electrum`, `ald-o-broche-au-sanglier`, `ald-o-sifflet-d-argent`, `ald-o-miroir-de-poche`, `ald-o-pioches-du-lion`, `ald-o-graines-de-pavot`, `ald-o-mousse-de-saule` (3 doses, quête de Mireille).

## Quêtes de la zone 1 (donneur → étape de retour au donneur : règle du 11/11)

| id | Donneur | Lieux concernés |
| --- | --- | --- |
| `q-la-securite-du-relais` | `bregor-le-borgne` | pont, carrière |
| `q-la-prime-sur-demi-dent` | `bregor-le-borgne` (avis cloué sur la palissade) | carrière |
| `q-l-echantillon-maudit` | `torben-main-brulee` | zone 2 (hors zone 1) |
| `q-honneur-de-brise-roc` | `varek-le-brise` (compagnon, attitude 40) | zone 2 |
| `q-baume-de-l-aube` | `mireille-de-la-rose` (compagnon) | pont (vasières) |
| `q-le-luth-de-finbar` | `finbar-le-chantre` | combe |
| `q-le-testament-du-chariot` | `martha-haddon` | pont (chariot) |
| `q-l-ombre-de-la-griffe` | `silas-l-epieur` (découverte : carnet, mot de passe) | auberge, pont |
| `q-le-cor-du-moulin` | `bregor-le-borgne` | moulin |

## Drapeaux et faits (zone 1)

Drapeaux (BIBLE §7) : `z1-sabotage-prouve`, `z1-demi-dent-epargne`, `z1-demi-dent-tue`. Ajouts : `z1-silas-capture` (mot de passe arraché), `z1-carnet-dechiffre`, `z1-cor-reduit-au-silence`, `z1-or-rendu`, `z1-or-garde`, `z1-luth-rendu`, `z1-rite-du-tombeau`. Faits (BIBLE §7) : `f-fer-sabote-a-la-source`, `f-peages-du-lion`, `f-griffe-noire-camp-foret`, `f-reactifs-vers-puits-4`. Ajouts : `f-ald-keldan-embusque-le-porche` (carnet), `f-ald-mot-de-passe-de-la-griffe` (Silas), `f-ald-kobolds-ont-vole-le-luth`, `f-ald-marchand-mort-sur-la-route` (pont), `f-ald-spatha-immunisee` (tertre).

## Boutiques et services (zone 1)

Torben : boutique de **bronze et de bois** (dagues antiques en bronze 6 po, bâtons ferrés, gourdins de chêne 1 po, flèches à pointe d'os) et service `reparation-d-arme` (résumé : « Torben redresse et ressoude une arme ébréchée » ; l'effet mécanique de l'arme ébréchée viendra avec le module, décision n° 3). Brégor : service `chambre` et `dortoir` (repos long à l'auberge : dortoir 2 pièces de cuivre, chambre individuelle non louée à la nuit), boisson et repas.
