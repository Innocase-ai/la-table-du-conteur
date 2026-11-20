# Bible de La Foire des Trois Ponts (canon)

Document de référence pour tous ceux qui écrivent des données de ce monde. **Les identifiants du registre (§7) sont fixes** : les zones s'y réfèrent entre elles. Ne rien inventer qui contredise ce canon.

> **Statut** : épisode pilote de la saga (F7 de `docs/PRD-SAGA.md`). **V1 (pitch), V2 (canon), V3 (plan) V4 (lieux par zone : village, moulin, Pont-Cassé) et V5 (fiches détaillées des 17 pièces, voir `LIEUX.md`) validés par l'utilisateur le 20/11/2026 ; **V6 du village (`V6-village.md`) validé le 20/11/2026** (reste V6 du moulin et du Pont-Cassé)** : ce qui est marqué « Validé » est **gelé** (changer un élément gelé demande un nouveau oui). Ce qui est marqué « Proposé » (identifiants, espèces, âges, peuples) n'est pas encore validé : il se tranche à V3 et V6.

## 1. Pitch — *Validé le 20/11/2026 (V1)*

Verdelle, bourg de rivière au pied des collines, tient chaque automne une foire de trois jours. Elle s'ouvre à l'aube, mais la clé du coffre de la foire (les droits de place et la bourse du concours, 300 po) a disparu dans la nuit. Le groupe arrive la veille de l'ouverture : il remonte la piste d'un voleur que tout le monde plaint, et d'un notable que personne ne soupçonne.

**Ton** : chaleureux et malicieux (une enquête de foire, des forains, des étals, de la bonne humeur qui cache une dette). **Esthétique** : bois, toile rayée, lanternes, pierre claire des ponts, lumière d'automne. **Épisode 1 de la saga** : niveau 1 → 2 (300 PX), groupe conseillé de 6 héros, **2 fins**, durée visée environ 1 h 30, **3 quêtes**, **3 combats**, aucune horloge.

**Question centrale** : qui doit payer, le voleur désespéré ou celui qui l'a acculé ?

## 2. Ce qui s'est vraiment passé (secret, révélé par morceaux) — *Validé le 20/11/2026 (V2)*

- **Tobie Pivoine**, funambule forain, devait **90 po** à **Gédéon Marchebise**, marchand de grain et prêteur. Gédéon menaçait de faire saisir la roulotte de la mère de Tobie.
- Tobie a **volé la clé du coffre de la foire** pour payer la dette en douce avec la bourse du concours, puis il a perdu courage.
- Il a **caché la clé au grenier du moulin** et se terre au Pont-Cassé, dans la roulotte de sa mère.
- **Gédéon sait tout**. Il a engagé **Rouquin Lamefine**, chef de bande, et quatre hommes de main pour retrouver la clé avant le bailli sans se montrer : ils tiennent le moulin et chassent Tobie.
- **Mère Pivoine** sait que son fils est en danger et attend un colis de Brun. **Sœur Pervenche** a vu Tobie prier de nuit. **Mathilde Pot-de-Miel** lui a vendu une corde fine. **Brun Forgefer**, ce matin à l'aube, a vu une serrure forcée au moulin.
- Gédéon n'est pas un monstre : il croit son dû légitime. Il offrira 30 po au groupe « pour oublier l'affaire » (sans effet sur la quête).

**Faits clés (chacun à trois sources jouables : un PNJ, un lieu à fouiller, un objet)** : `f-tobie-a-vole-la-cle` (Pervenche, Mathilde et la corde, la serrure forcée) ; `f-cle-au-grenier` (Tobie, Mère Pivoine, les traces de corde sur la poutre) ; `f-gedeon-et-la-dette` (un homme de main qui parle, la **reconnaissance de dette** dans le coffre de la boutique du grain, Tobie).

## 3. Les fins — *Validé le 20/11/2026 (V2)*

Au dénouement, le groupe rend la clé au bailli Aubin Cerfeuil et choisit (drapeaux `choix-scandale` ou `choix-silence`). La prime de **60 po** est versée dès que la clé est rendue (avant ou après l'ouverture de la foire : le temps n'a aucun effet sur les fins).

1. **Le scandale** : le groupe expose Gédéon devant le bailli et les anciens. Condition : la reconnaissance de dette **ou** le témoignage d'un homme de main. Gédéon est ruiné (interdit de foire, déserté de ses clients) et devient un ennemi ; la dette de Tobie est annulée, mais lui et sa mère sont bannis de la foire. **Coût** : une famille ruinée, un ennemi.
2. **Le silence** : le groupe paie la dette de Tobie de sa poche (**90 po**) et rend la clé en secret. Condition : connaître la dette. Le bailli verse la prime (60 po) : net **−30 po**. Gédéon reste impuni. **Coût** : de l'argent, un notable intouché.

**Échos de campagne** (bonus, jamais lus par la quête principale ; indice discret dans l'épisode) :
- `epi1-gedeon-vengeur` si scandale : Gédéon, qui parle, cherchera à se venger dans un épisode ultérieur ; indice : son pot-de-vin de 30 po offert dès la première rencontre.
- `epi1-tobie-reconnaissant` si silence : Tobie, allié reconnaissant ; indice : un petit cadeau laissé à un héros sur le Pont-Cassé.

## 4. La jauge — *Validé le 20/11/2026 (V2)*

**Aucune.** Pas d'horloge ni d'échec par le temps. La foire s'ouvre à l'aube du jour 2 quoi qu'il arrive (coffre scellé tant que la clé manque) ; la quête reste jouable après l'ouverture.

## 5. Factions

Aucune faction autonome (règle du cap du 15/11/2026).

## 6. Les peuples et les espèces dans ce monde — *Village validé le 20/11/2026 (V6, D1) ; Pont-Cassé et moulin à valider*

Verdelle est un bourg de rivière où se croisent des forains de toutes sortes : une place pour chaque espèce jouable du SRD (drakéide, elfe, gnome, goliath, halfelin, humain, nain, orc, tieffelin), surtout parmi les forains et les marchands. Les PNJ clés sont humains sauf indication contraire. **Au village (V6, D1)** : Aubin Cerfeuil humain, 55 ans ; Colombe Tisserand halfeline, 48 ans ; Gédéon Marchebise humain, 52 ans ; Brun Forgefer nain, 60 ans ; Mathilde Pot-de-Miel gnome, 45 ans ; Sœur Pervenche elfe (a l'air de 40 ans). **Au Pont-Cassé** : Mère Pivoine humaine, 68 ans ; Tobie Pivoine humain, 24 ans. Rouquin Lamefine et l'homme de main du pont : à fixer en V6 (moulin).

## 7. Registre des identifiants fixes

### Lieux (arbre) — *Validé le 20/11/2026 (V3)* : détail dans `LIEUX.md`

Racine : `verdelle-region` (région). Enfants directs : `verdelle` (village, **lieu de départ**, 11 pièces, préfixe `ver-`), `moulin` (site, préfixe `mou-`, avec le Pont-du-Meunier) et `pont-casse` (site, préfixe `pon-`). Le **coffre de la foire** est dans le cabinet de la maison du bailli ; la **cave** des rats est celle de l'auberge du Héron Gris ; le Pont-des-Marchands relie le marché à l'autre rive (sentier du Pont-Cassé). Détail et pièces : V3 (`LIEUX.md`).

### Personnages clés — *Validé (noms, rôles) le 20/11/2026 (V2) ; identifiants proposés*

| id | Qui | Lieu |
| --- | --- | --- |
| `aubin-cerfeuil` | Aubin Cerfeuil, bailli de la foire ; confie la quête principale | maison du bailli |
| `colombe-tisserand` | Colombe Tisserand, aubergiste du Héron Gris ; confie les rats | taverne |
| `gedeon-marchebise` | Gédéon Marchebise, marchand de grain (secret : prêteur, derrière la bande) | boutique du grain |
| `tobie-pivoine` | Tobie Pivoine, funambule (secret : voleur de la clé) | roulotte du Pont-Cassé |
| `mere-pivoine` | Mère Pivoine, doyenne des forains ; reçoit le colis | roulotte du Pont-Cassé |
| `soeur-pervenche` | Sœur Pervenche, soigneuse du sanctuaire | sanctuaire |
| `brun-forgefer` | Brun Forgefer, forgeron ; confie le colis | forge |
| `mathilde-pot-de-miel` | Mathilde Pot-de-Miel, colporteuse | marché |
| `rouquin-lamefine` | Rouquin Lamefine, chef de bande (profil `chef-de-bande`) | moulin |

Quatre **hommes de main** (profil `bandit`) sans nom propre, au Pont-du-Meunier ; l'un d'eux est un PNJ, `homme-de-main-du-pont` (« L'homme de main du pont », 4 sujets), la source « un homme de main qui parle » du fait `f-gedeon-et-la-dette` (V4, 20/11/2026). Chaque PNJ qui parle a **au moins 4 sujets** (V6) ; titres affichés sans parenthèse ni mot qui trahit : jamais « voleur », « prêteur » ni « traître ».

### Objets clés — *Validé (principe) ; ids proposés*

`cle-du-coffre-de-la-foire` (objet de quête), `reconnaissance-de-dette` (objet de quête, levier de négociation avec Rouquin et preuve du scandale), `colis-de-brun` (objet de quête), `recu-de-mere-pivoine` (objet de quête), `corde-de-funambule` (objet nommé : récompense du colis), `porte-bonheur-de-funambule` (objet nommé : offert par Tobie quand il se confie, indice discret de l'écho `epi1-tobie-reconnaissant`, donné quelle que soit la fin ; V4), `perche-d-equilibriste` (**objet unique**, peu commun : récompense de la quête principale, donnée par Aubin ; détail en V6).

### Jauge, drapeaux, faits centraux

Pas de jauge. Faits : `f-tobie-a-vole-la-cle`, `f-cle-au-grenier`, `f-gedeon-et-la-dette`. Drapeaux de fin : `choix-scandale`, `choix-silence`. Échos : `epi1-gedeon-vengeur`, `epi1-tobie-reconnaissant`.

### Quêtes — *Validé le 20/11/2026 (V2) ; aucun `lieu` d'étape (le joueur cherche), chaque quête finit chez son donneur*

- `q-la-cle-de-la-foire` (principale, **trouver** : discussion puis fouille ; donneur Aubin ; Rouquin est un obstacle, pas un verbe de plus).
- `q-le-colis-du-forgeron` (secondaire, **apporter** : crochetage et désamorçage du coffre piégé de Brun, remise à Mère Pivoine, retour à Brun avec le reçu ; récompense annoncée : 10 po et la corde de funambule).
- `q-les-rats-de-la-cave` (secondaire, **tuer** : combat seul ; donneur Colombe ; récompense : une nuit offerte).

### Rencontres emblématiques — *Validé le 20/11/2026 (V2)*

| Rencontre | Adversaires | PX | Difficulté | Sortie |
| --- | --- | --- | --- | --- |
| `r-rats-de-la-cave` | 3 × `rat-geant` | 75 | faible | combat seul (rats muets, langues « aucune ») |
| `r-hommes-de-main` (Pont-du-Meunier) | 4 × `bandit` | 100 | faible | négocier ou payer (ils parlent) |
| `r-rouquin-au-moulin` | 1 × `chef-de-bande` | 450 | modérée | combat ; négocier ou acheter **seulement avec le levier « reconnaissance de dette »** (sans levier, il refuse : le chemin le plus court demande de se battre, règle du 16/11/2026) |

**PX** (d'après le moteur) : une victoire donne ses PX **divisés par le nombre de héros** (104 au total à 6 héros pour les trois combats) ; une alternative réussie vaut une valeur écrite à la main (75 pour Rouquin, valeur de la victoire à 6 héros) ; les quêtes donnent leur valeur entière. La quête principale rapporte environ 230 PX pour que le chemin le plus court atteigne 300. Le niveau est plafonné à 2 (`niveaux.max`).

## 8. Progression par niveau

Un seul niveau : départ niveau 1 (0 PX), fin niveau 2 (300 PX). Butin plafonné au niveau (palier 1), un objet unique, un objet nommé.

## 9. Monstres disponibles (SRD, ids de profil) — *Validé le 20/11/2026 (V2)*

`rat-geant` (rats de la cave), `bandit` (hommes de main), `chef-de-bande` (Rouquin). Aucun monstre propre à l'épisode. Note hors épisode : le résumé du profil SRD `chef-de-bande` parle de « Cimeterre et Pistolet », sa multiattaque ne liste que le cimeterre (défaut du moteur, à traiter à part).

## 10. Choix, pertes et horloge

- **Choix** : le dénouement (scandale ou silence), avec un premier effet visible tout de suite (Gédéon ruiné ou impuni, Tobie banni ou allié). Pas de dilemme supplémentaire en V1 ; à voir en V7.
- **Qui peut partir** : Tobie et sa mère (bannis dans la fin « scandale »).
- **Horloge** : aucune (épisode court).
- **Premier épisode** : un test à échec amusant tôt (avant la première vraie punition), placé sur la place de Verdelle à l'arrivée (la corde des funambules, Acrobaties DD 8, V3) ; deux voies pour toute rencontre sans combat.
- **Salutations qui changent** : à lister en V6 (au moins 5 PNJ).
- **Faits clés et leurs trois sources** : voir §2.

## 11. Ce que l'épisode retient des précédents

Rien (épisode 1). Il laisse deux échos au carnet (§3).
