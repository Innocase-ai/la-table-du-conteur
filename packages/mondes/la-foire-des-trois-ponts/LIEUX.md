# Atlas des lieux de La Foire des Trois Ponts

Document de travail (le moteur ne le lit pas) : **source unique** des descriptions de lieux, des images et des cartes. Écrit de haut en bas. Positions : `(x, y)` en % de la carte du parent (x : 0 à gauche, 100 à droite ; y : 0 en haut, 100 en bas) ; ce sont des **intentions**, replacées d'après l'image réelle une fois la carte générée.

> **Statut** : **plan (V3) validé par l'utilisateur le 20/11/2026** : la liste des pièces, leurs parents, leurs liens, leurs couches et le choix des images sont **gelés** (changer un élément gelé demande un nouveau oui). Les descriptions, les points à visiter et le contenu de chaque lieu viennent lieu par lieu (V4 à V6). Épisode 1 de la saga : il ne suit pas la grille de niveaux 0 à 2 des grands mondes, mais ses trois lieux de niveau 1.

---

## Niveau 0 : la région (`verdelle-region`, région)

- **Forme** : une vallée de rivière au pied de collines basses, trois ponts sur la Verdelle. **Eaux** : la rivière Verdelle, calme. **Climat** : automne, lumière dorée, brume de rivière le matin. **De loin** : les toiles rayées de la foire, la roue du moulin, le pont brisé.
- **Charte (héritée par tous les lieux)** : matériaux chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre ; couleurs ocre, vert mousse, rouge brique, crème, bleu rivière ; lumière dorée d'automne, brume du matin ; sons : clochettes de foire, cris de marchands, eau ; odeurs : pain chaud, foin, fumée de bois. **Interdits** : gore, magie ostentatoire.
- **Enfants directs** : `verdelle` (village, **lieu de départ**), `moulin` (site de quête 1), `pont-casse` (site de quête 2). Les sites ne sont **pas** enfants de `verdelle` (sinon le lieu de départ compterait 17 pièces).
- **Routes** : `verdelle` ↔ `mou-pont-du-meunier` (1 h, **condition : quête principale active**) ; `ver-marche` ↔ `ver-pont-des-marchands` ↔ `pon-camp` (30 min, le sentier longe la rive jusqu'au Pont-Cassé).

---

## Niveau 1 : `verdelle` (Verdelle, village, **lieu de départ**, 11 pièces, préfixe `ver-`)

**Plan** : bourg autour d'une place à fontaine et vieil arbre ; la rivière coupe le bourg, le Pont-des-Marchands relie le marché à l'autre rive. **Carte illustrée** `carte-verdelle` exigée (plus de 5 enfants).

| id | nom | type | parent | position | couches (2 à 4) | image |
| --- | --- | --- | --- | --- | --- | --- |
| `verdelle` | La place de Verdelle | village (hub) | `verdelle-region` | (50, 50) | objet (panneau d'affichage, événement de la corde), contenant (cache sous la fontaine) | **propre** |
| `ver-heron-salle` | Le Héron Gris (taverne) | batiment | `verdelle` | (25, 35) | PNJ (Colombe), service (repas, chambre = service de nuit), objet | **propre** |
| `ver-heron-cave` | La cave du Héron Gris | salle | `ver-heron-salle` | — | adversaire avec butin (3 rats géants), contenant (tonneau caché gardé) | réserve `cave-tonneaux-et-bocaux` |
| `ver-bailli-salle` | La halle du bailli | batiment | `verdelle` | (70, 30) | PNJ (Aubin), objet (registre de la foire) | **propre** |
| `ver-bailli-cabinet` | Le cabinet du bailli | salle | `ver-bailli-salle` | — | contenant (étagère, carnet), objet (coffre de la foire scellé : décor, non pillable) | réserve `maison-du-chef-cabinet-aux-parchemins` |
| `ver-sanctuaire` | Le sanctuaire de la Rive | batiment | `verdelle` | (80, 55) | PNJ (Sœur Pervenche), service (soins), objet (ex-voto) | réserve `sanctuaire-nef-et-vasque` |
| `ver-forge` | La forge de Brun | batiment | `verdelle` | (20, 65) | PNJ (Brun), service (forge, armes), contenant + obstacle (coffre piégé du colis) | **propre** |
| `ver-boutique-grain` | La boutique du grain | batiment | `verdelle` | (45, 22) | PNJ (Gédéon : premier contact, offre de 30 po), service (boutique), contenant + obstacle (coffre verrouillé et piégé : la reconnaissance de dette) | réserve `boutique-etageres-et-bocaux` |
| `ver-marche` | Le marché | batiment | `verdelle` | (62, 78) | PNJ (Mathilde, colporteuse), service (boutique), objet (étals) | réserve `marche-etals-couverts` |
| `ver-ecuries` | Les écuries de la foire | batiment | `verdelle` | (85, 80) | contenant (cache dans le foin), obstacle (piège à chercher), objet (bout de corde noué : indice du vol) | **propre** |
| `ver-pont-des-marchands` | Le Pont-des-Marchands | lieu-dit | `verdelle` | (45, 88) | contenant (caisse de bateliers), objet (marques de crue, avis aux bateliers) | **propre** |

**Liens** : toutes les pièces sont enfants de `verdelle` (accessibles depuis la place) ; `ver-heron-cave` par `ver-heron-salle`, `ver-bailli-cabinet` par `ver-bailli-salle` ; `ver-marche` ↔ `ver-pont-des-marchands` ↔ `pon-camp` (30 min). **Gabarit (F2)** : 5 bâtiments d'une pièce (forge, boutique, marché, écuries, pont), taverne de 2 pièces avec chambre-service, maison du chef de 2 pièces, sanctuaire de 1 pièce avec soigneur, marchands (Brun, Gédéon, Mathilde).
**Événement d'arrivée (test à échec amusant)** : sur la place, la corde d'entraînement des funambules est tendue au-dessus de la fontaine ; la traverser demande Acrobaties DD 8, un échec fait un plouf sans danger. Il réutilise l'image du hub.
**Budget de contenu** : 1 combat (rats), 6 PNJ au village (Aubin, Colombe, Gédéon, Brun, Mathilde, Pervenche ; Tobie et Mère Pivoine sont au Pont-Cassé, Rouquin au moulin), 3 contenants à obstacle (coffre du colis, coffre de la dette, piège des écuries), 1 événement à choix.

---

## Niveau 1 : `moulin` (Le moulin, site de quête 1, préfixe `mou-`, **lieu-vitrine** de l'épisode)

| id | nom | type | parent | contenu | rencontre | image |
| --- | --- | --- | --- | --- | --- | --- |
| `mou-pont-du-meunier` | Le Pont-du-Meunier | lieu-dit | `moulin` | le chemin et le pont ; 4 hommes de main | `r-hommes-de-main` (4 × `bandit`, 100 PX, faible : négocier ou payer, ou combat) | **propre** |
| `mou-cour` | La cour du moulin | lieu-dit | `moulin` | traces de roue, serrure forcée (indice) | — | **propre** |
| `mou-salle-des-meules` | La salle des meules | salle | `moulin` | Rouquin Lamefine ; coffre | `r-rouquin-au-moulin` (1 × `chef-de-bande`, 450 PX, modérée : combat, ou négociation avec le levier « reconnaissance de dette » seulement) | **propre** |
| `mou-grenier` | Le grenier du moulin | salle | `mou-salle-des-meules` | la clé du coffre de la foire (cache, fouille), traces de corde sur la poutre | — | **propre** |

**Liens** : `mou-pont-du-meunier` ↔ `mou-cour` ↔ `mou-salle-des-meules` ; `mou-grenier` n'est atteint que par un **lien depuis la salle des meules, dont la condition est « Rouquin réglé »** (combat ou négociation) : on n'y entre pas sans passer par lui. Le chemin le plus court demande de chercher, de parler et de se battre.

---

## Niveau 1 : `pont-casse` (Le Pont-Cassé, site de quête 2, préfixe `pon-`)

| id | nom | type | parent | contenu | image |
| --- | --- | --- | --- | --- | --- |
| `pon-camp` | Le camp des forains | camp | `pont-casse` | camp au pied du pont brisé ; le cadeau de Tobie (indice de l'écho) ; Mathilde y passe | **propre** |
| `pon-roulotte` | La roulotte de Mère Pivoine | salle | `pon-camp` | Mère Pivoine (destinataire du colis), Tobie caché | **propre** |

---

## Images : bilan (décision de l'utilisateur du 20/11/2026)

**12 images propres** : le hub, le Héron Gris, la halle du bailli, la forge, les écuries, le Pont-des-Marchands, les 4 pièces du moulin, les 2 du Pont-Cassé ; **5 décors de la réserve** (cave, cabinet, sanctuaire, boutique du grain, marché) ; **1 carte illustrée** de Verdelle. Coût à annoncer avant toute génération (≈ 0,009 $ l'image avec FLUX Klein) ; décors à citer par `commun:lieux/<id>` dans le manifeste.

## Quêtes (lieu de la quête = lieu du donneur ; aucun `lieu` d'étape)
`q-la-cle-de-la-foire` (Aubin, `ver-bailli-salle`) ; `q-le-colis-du-forgeron` (Brun, `ver-forge`) ; `q-les-rats-de-la-cave` (Colombe, `ver-heron-salle`). Voir la BIBLE §7.

---

## V4 : le village de Verdelle, pièce par pièce — *Validé par l'utilisateur le 20/11/2026 (gelé)*

Chaque pièce : points à visiter, budget de contenu, secret du lieu (relié aux faits clés sans jamais dire librement ce que le canon garde secret), cas limite « n+1 » (sans mort définitive de PNJ ni état de jeu nouveau). Mécaniques : l'événement de la corde est un **événement à choix avec jet** (échec obligatoire : un plouf) ; « le marchand part » s'écrit par l'effet `deplacer` ; le filet des écuries est un piège (sauvegarde de Dextérité DD 10, échec : effet `temps` d'une demi-heure).

| # | Pièce | Points à visiter | Contenu | Secret du lieu | Cas limite |
| --- | --- | --- | --- | --- | --- |
| 1 | La place (`verdelle`) | la fontaine à vasque, le vieil arbre aux rubans, le panneau d'affichage (« moulin fermé pour réparations, jusqu'à nouvel ordre »), la corde des funambules | cache sous la fontaine (5 po et une vieille pièce de foire, Perception DD 12) ; **événement à choix : la corde** (traverser : Acrobaties DD 8, échec = plouf sans danger ; passer ; regarder de près : on remarque le nœud de funambule) | le nœud de la corde est le même que le bout de corde des écuries | un héros tombé à l'eau se sèche au Héron Gris ; ignorer la corde ne coûte rien |
| 2 | Le Héron Gris (`ver-heron-salle`) | le comptoir, la grande cheminée, l'ardoise des rumeurs, l'escalier des chambres | Colombe Tisserand (4 sujets au moins) ; repas ; chambre = service de nuit (2 po) ; examen : l'ardoise des rumeurs | rumeurs : un funambule rôdait en pleine nuit ; des hommes de main louches vers le Pont-du-Meunier | si Colombe est attaquée : elle refuse de servir le groupe jusqu'au lendemain (plus de repas ni de chambre) |
| 3 | La cave (`ver-heron-cave`) | les tonneaux, les bocaux, le soupirail, le trou de rats | `r-rats-de-la-cave` (3 rats géants) ; **butin : le tonneau caché**, trésor gardé par la rencontre (8 po, un vin fin) | un sac de farine rongé par les rats | si les rats sont tués avant d'avoir la quête : Colombe remercie et donne la récompense |
| 4 | La halle du bailli (`ver-bailli-salle`) | la grande table, le tableau des comptes, la cloche d'ouverture, le registre de la foire | Aubin Cerfeuil (4 sujets, dont 2 sur la quête principale) ; examen : le registre des droits de place des marchands (sans détail utile) | — | si la clé est rapportée sans avoir accepté la quête : Aubin verse la prime et termine la quête |
| 5 | Le cabinet du bailli (`ver-bailli-cabinet`) | l'étagère de registres, la fenêtre sur la rivière, le clou où pendait la clé, le coffre de la foire (décor, non pillable) | un carnet du bailli (contenant : petite caisse de 12 po ; son texte ne contient aucun secret) ; examen : le coffre, intact | **aucune effraction** ; la clé pendait au clou près de la fenêtre ; **trace de corde** sur le rebord : on est passé par la rivière | le coffre ne s'ouvre qu'avec la clé, par Aubin : le groupe ne peut pas le piller |
| 6 | Le sanctuaire de la Rive (`ver-sanctuaire`) | la vasque, la nef, les rubans et poupées de bois des ex-voto | Sœur Pervenche (4 sujets) ; soins ; examen : les ex-voto | Tobie est venu prier de nuit et a laissé une poupée de bois ; elle hésite à parler de ceux qui prient la nuit | si Pervenche refuse de parler : deux voies, Intuition DD 12, ou la poupée montrée |
| 7 | La forge de Brun (`ver-forge`) | l'enclume, la forge, le soufflet, la commande de Mère Pivoine | Brun Forgefer (4 sujets) ; forge et armes simples ; **coffre piégé du colis** (verrou DD 12, piège à aiguille 1d4, à chercher puis désamorcer) | ce matin à l'aube (D9, V6), en livrant des fers au moulin, il a vu la **serrure de la cour forcée** | si le coffre est forcé à la brute : le piège part (1d4), le colis reste intact (un objet de quête ne se vend ni ne se jette) |
| 8 | La boutique du grain (`ver-boutique-grain`) | les sacs, la balance, le comptoir, le coffre-fort du fond | Gédéon Marchebise (4 sujets) ; boutique (grain, rations, sacs) ; premier contact : il **offre 30 po** pour « oublier l'affaire » (accepter n'affecte aucune fin ni la quête) ; **coffre** (verrou DD 14, piège à chercher) : la **reconnaissance de dette** et 40 po | la reconnaissance de dette, seulement derrière le verrou et le piège | si le groupe crochète le coffre devant lui : Gédéon part chez le bailli (la boutique est vide, `deplacer`) ; la reconnaissance reste prise, la prime inchangée |
| 9 | Le marché (`ver-marche`) | les étals, la balance publique, un jeu d'anneaux | Mathilde Pot-de-Miel (4 sujets) ; boutique (cordes, rations, bijoux de foire) | elle a vendu une **corde fine de soie** à Tobie | si Mathilde est volée : elle part avec son étal au camp des forains (`deplacer`) |
| 10 | Les écuries (`ver-ecuries`) | les boxes, le foin, les selles, les mangeoires | cache dans le foin (10 po, Perception DD 12) ; **piège à chercher** (filet, Dextérité DD 10, échec : une demi-heure, aucun dégât) ; examen : un **bout de corde noué** | le bout de corde est noué d'un nœud de funambule | — |
| 11 | Le Pont-des-Marchands (`ver-pont-des-marchands`) | le ponton des bateliers, les marques de crue, l'avis aux bateliers, le sentier du Pont-Cassé | une caisse de bateliers (contenant, 5 po) ; examen : les marques de crue | des traces de boue de rive sur les marches du ponton et un sentier piétiné qui part vers le Pont-Cassé | si le groupe tombe à l'eau : une demi-heure pour se sécher |

**Accroches par rencontre** : chaque pièce confie son histoire par un PNJ ou un détail visible, jamais en obligeant à tout fouiller. **Lieu-vitrine du village** : la place (la corde). **Deux voies** pour toute rencontre sans combat du village : Pervenche (Intuition ou la poupée) ; les rats n'ont qu'une voie (muets, combat).
**Faits clés au village** : `f-tobie-a-vole-la-cle` (Pervenche, Mathilde, la trace de corde du cabinet, le bout de corde des écuries) ; `f-gedeon-et-la-dette` (la reconnaissance, dans le coffre) ; `f-cle-au-grenier` : aucune source au village (Tobie, Mère Pivoine, le moulin). Les rumeurs de Colombe et l'observation de Brun sont des indices sur un funambule et le moulin, pas le secret lui-même.
**Or** : plafond de départ **20 po par héros** (`depart.orMax`, décision du 20/11/2026) pour que les 90 po du silence coûtent ; l'or du village fait 80 po (68 dans les contenants dont 40 dans le coffre de Gédéon, plus 12 po de carnet), plus la prime de 60 po. Pour mémoire, sans plafond un héros qui prend l'or de classe part avec 100 à 200 po.
**Décors** : 11 pièces avec image : 6 propres (place, Héron, halle, forge, écuries, Pont-des-Marchands) et 5 de réserve (cave, cabinet, sanctuaire, boutique du grain, marché).

---

## V4 : le moulin et le Pont-Cassé, pièce par pièce — *Validé par l'utilisateur le 20/11/2026 (gelé)*

Même grille que le village. Mécaniques du moteur : alternatives de rencontre (avec ou sans jet, avec condition), lien avec condition, effet `deplacer`, effet `temps`. Une condition `rencontre` sans issue précisée signifie « réglée » (victoire ou alternative, ni fuite ni défaite).

### Le moulin (lieu-vitrine de l'épisode ; la route s'ouvre quand la quête principale est active)

| # | Pièce | Points à visiter | Contenu | Secret du lieu | Cas limite |
| --- | --- | --- | --- | --- | --- |
| 1 | Le Pont-du-Meunier (`mou-pont-du-meunier`) | le pont de bois vermoulu, la barrière « Fermé pour réparations », un abri de garde, un tonneau-table | `r-hommes-de-main` (4 × `bandit`, 100 PX, faible) ; **l'homme de main du pont** (PNJ sans nom propre, 4 sujets) ; butin : une bourse commune sous le tonneau (10 po, trésor gardé par la rencontre) | il parle si on le paie ou le bat : « le patron, c'est quelqu'un de la ville qui a de l'argent » ; il ne nomme Gédéon qu'après reddition (V6) | trois sorties : négocier (Persuasion DD 12), payer (20 po, condition : avoir 20 po), ou combattre (toujours possible) ; un jet raté lance le combat ; s'il meurt : plus de témoignage, reste la reconnaissance |
| 2 | La cour du moulin (`mou-cour`) | la roue immobile, des sacs empilés, l'atelier à la serrure forcée, des traces de charrette et de bottes | une caisse de matériel du meunier (contenant, 5 po) ; examens : la serrure, les traces | serrure forcée de l'extérieur il y a peu, rien volé ; beaucoup de bottes : une bande | route fermée sans la quête active |
| 3 | La salle des meules (`mou-salle-des-meules`) | les deux meules, la trémie, l'arbre de roue, l'escalier du grenier, un lit de camp | **Rouquin Lamefine** (PNJ à profil `chef-de-bande`, 4 sujets) ; `r-rouquin-au-moulin` (450 PX, modérée) ; coffre de campement (verrou DD 12 : 20 po) ; dépouilles : table de butin commune du palier 1 | sa bande a fouillé la cour et la salle ; **la trappe du grenier est coincée par une cale**, ils attendent une barre à mine ; il attend les ordres de « son patron » | **combat, sauf avec le levier** (l'objet « reconnaissance de dette ») : deux alternatives conditionnées par l'objet, **négocier** (Persuasion DD 11) ou **acheter** (60 po) ; sans levier il refuse ; réglé (vaincu, convaincu ou acheté), le grenier s'ouvre (lien avec condition `rencontre`) |
| 4 | Le grenier du moulin (`mou-grenier`) | la charpente, des sacs vides, la trappe à grain, la poutre maîtresse | **la clé du coffre de la foire** (cache : Investigation DD 14, DD 10 après examen de la poutre) ; examen : **traces de corde** sur la poutre | la clé est glissée dans une fente de la poutre, nouée d'un nœud de funambule | objet de quête : ni perdu ni vendu |

Couches : pont 2 (PNJ, adversaire avec butin), cour 2 (contenant, objet), meules 4 (PNJ, adversaire, contenant, obstacle), grenier 2 (contenant, objet). **Budget** : 2 combats, 2 PNJ (Rouquin, l'homme de main du pont), 2 contenants à jet, 1 cache de quête.
**Chemin le plus court** : Colombe ou le panneau → Aubin → route du moulin → hommes de main (payer 20 po ou négocier) → cour → Rouquin (**combat**, pas de levier) → grenier (fouille) → retour.

### Le Pont-Cassé

| # | Pièce | Points à visiter | Contenu | Secret du lieu | Cas limite |
| --- | --- | --- | --- | --- | --- |
| 5 | Le camp des forains (`pon-camp`) | les roulottes peintes, le feu de camp, la corde de funambule tendue entre deux poteaux, le pont brisé | une caisse de costumes (contenant, 10 po) ; examen : les affiches de la troupe ; Mathilde y passe le jour (présence) | les forains parlent de Tobie comme « d'un des leurs » | groupe hostile : ils se ferment (aucun sujet), la roulotte reste accessible |
| 6 | La roulotte de Mère Pivoine (`pon-roulotte`, enfant du camp) | la bâche qui sépare la roulotte, le coffre à costumes, la lampe, une poupée de bois pareille à celle du sanctuaire | **Mère Pivoine** (4 sujets : reçoit le colis, remet le reçu) ; **Tobie Pivoine** (4 sujets) derrière la bâche (Perception DD 10, ou elle l'y conduit) | Tobie **avoue la dette de vive voix** à qui gagne sa confiance (Persuasion DD 11, ou en rendant le colis) ; **s'il se confie, il offre un porte-bonheur de funambule à un héros** (nouvel objet, indice discret de l'écho `epi1-tobie-reconnaissant`, donné quelle que soit la fin) | menacé, il se rend sans combattre ; s'il fuit, `deplacer` vers le camp ; il ne meurt pas dans l'épisode |

**Budget** : aucun combat ; 2 PNJ à 4 sujets ; le colis et le reçu. Couches : camp 3, roulotte 2. **Décors** : 6 images propres (4 du moulin, 2 du Pont-Cassé).
**Or de l'épisode** : village 80 po, sites environ 45 po (bourse 10, caisse 5, coffre 20, caisse du camp 10), prime 60 po ; départ au plus 120 po à 6 héros ; le silence coûte 90 po (net −30 po).

---

## V5 : Verdelle, fiche de niveau 1 et fiches détaillées des 11 pièces — *Validé par l'utilisateur le 20/11/2026 (gelé)*

Rédigées par un agent Haiku, relues par Claude, vérifiées par un vérificateur (Haiku, lecture seule), corrigées (retrait des détails inventés : sac marqué d'un G, bateau de cire, claie repeinte, marteau posé à la hâte, gain au jeu d'anneaux ; arrière-pièce de la boutique supprimée ; DD de recherche des pièges renvoyés à V6). Pour les décors de la réserve (cave, cabinet, sanctuaire, boutique, marché), le `visuel` sera aligné sur l'image réelle à l'écriture des fichiers du monde (V6). Les textes `arrivee`, `resume`, `accroche`, `visuel`, `ambiance` et `description` sont les champs dérivés à recopier dans `lieux/`.

### Niveau 1 : `verdelle` (Verdelle, village, lieu de départ, 11 pièces)

#### Héritage (recopié du niveau 0 de `LIEUX.md`, ne pas modifier)
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

#### Nuances propres à Verdelle
- Le bourg est **plus pierre que bois** du côté des ponts (piles et parapets de pierre claire) et **plus bois et toile** du côté de la foire (étals, auvents, roulottes). Les pavés de la place sont lavés chaque matin par la brume : ils luisent, jamais secs avant midi. Une **guirlande de petites lanternes de papier ocre** court au-dessus de toutes les rues, tendue pour la foire.

- **Matières secondaires admises dans les pièces** (remontées des fiches, relues par Claude) : le **fer** (cerclages des coffres, anneaux, enclume, fers à cheval), le **cuivre** (cloche de la halle, balance de la boutique et du marché), la **cire** (sceaux de tonneaux, cierges des ex-voto), la **faïence bleue** (pot à encre) et le **chanvre** (cordes).

#### Plan vu de dessus
- **Forme générale** : un bourg en croissant sur la rive gauche de la Verdelle, serré autour d'une **place pavée** qui porte une fontaine à vasque et un vieil arbre aux rubans.
- **Limites** : la rivière au sud et à l'est, les collines basses au nord, la route de la vallée à l'ouest.
- **Orientation** : le nord en haut de la carte.
- **Voies d'accès** : la **route des collines** (le groupe arrive par l'ouest, sur la place) ; le **Pont-des-Marchands** au sud, vers l'autre rive et le sentier du Pont-Cassé ; la **route du Pont-du-Meunier** au nord-est, vers le moulin (une heure de marche, fermée tant que la quête principale n'est pas active).
- **Éléments naturels** : la rivière calme, quelques saules sur la berge, la brume du matin.
- **Quartiers** : l'ouest est le quartier de la taverne, et le sud-ouest celui de la forge ; le nord, celui du bailli et du grain ; l'est, celui du sanctuaire au bord de l'eau ; le sud, celui du marché, des écuries et du pont.

#### Points à visiter (positions du plan V3, en %)
`verdelle` la place (50, 50) · `ver-heron-salle` (25, 35) · `ver-bailli-salle` (70, 30) · `ver-sanctuaire` (80, 55) · `ver-forge` (20, 65) · `ver-boutique-grain` (45, 22) · `ver-marche` (62, 78) · `ver-ecuries` (85, 80) · `ver-pont-des-marchands` (45, 88). Sous-lieux sans position (intérieurs) : `ver-heron-cave` (sous le Héron), `ver-bailli-cabinet` (derrière la halle).

#### Histoire et état actuel
- Verdelle tient la foire d'automne depuis quatre-vingt-dix ans : trois jours de marché, de concours et de spectacles, la seule semaine où le bourg est plein. Le bailli est choisi chaque année par les marchands pour la tenir. Le groupe arrive la **veille de l'ouverture** : les toiles sont déployées, les forains sont installés, la guirlande de lanternes est tendue, et tout le monde parle d'une clé que le bailli ne retrouve plus.

#### Le jour, la nuit, le mauvais temps
- **Jour** : lumière dorée, cris de marchands, odeur de pain chaud, brume levée vers midi. **Nuit** : lanternes ocre, chants de forains, rues vides au-delà de la place. **Mauvais temps** : la brume monte de la rivière, les toiles claquent, les pavés restent luisants, les étals se bâchent.

#### Ce que le joueur voit en arrivant
- La route descend des collines : toiles rayées rouge et crème sur les toits, fumées de cheminées, le miroitement de la rivière derrière, et les trois ponts dont l'un est à moitié effondré. Il ne voit pas ce que le bourg garde (voir « Secret du MJ »).

#### Secret du MJ (jamais dans un texte lu par le joueur)
- La clé du coffre de la foire a été volée par Tobie Pivoine pour payer sa dette à Gédéon Marchebise ; il l'a cachée au grenier du moulin et se terre au Pont-Cassé. Gédéon a engagé Rouquin Lamefine et quatre hommes de main pour la retrouver avant le bailli. Les indices de Verdelle (nœud de funambule, trace de corde, serrure forcée) sont décrits dans `LIEUX.md` (V4).

#### Composition de la carte (pour `images.json`, clé `carte-verdelle`)
> Vue d'ensemble du bourg de Verdelle sur la rive d'une rivière calme, nord en haut : une place pavée centrale avec une fontaine et un grand arbre ; à l'ouest une auberge et une forge, au nord une boutique et une halle de bois, à l'est un petit sanctuaire au bord de l'eau ; au sud un marché couvert, des écuries et un pont de pierre. Toiles rayées rouge brique et crème, guirlande de lanternes ocre, lumière dorée d'automne, brume sur l'eau. Aucun personnage.

---

### Fiches détaillées des 11 pièces de Verdelle (niveaux 2 et 3)
(Chaque fiche sous ce titre, dans l'ordre de la liste des points à visiter, un conteneur suivi de ses sous-lieux.)

#### Niveau 2 : `verdelle` (La place de Verdelle, hub), dans `verdelle`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : place pavée d'une trentaine de pas de côté, ouverte sur les rues du bourg. La fontaine à vasque occupe le centre ; le vieil arbre aux rubans se dresse à cinq pas, à l'est.
- **Matériaux et état** : pavés de pierre claire lavés par la brume, luisants et jamais secs avant midi ; margelle de la fontaine usée par les mains, une fissure fine court sur la vasque ; écorce du vieil arbre fendue au pied, rubans de toile rouge et crème pendus aux branches basses, plusieurs effilochés.
- **Lumière** (origine, couleur, force, ombres) : soleil d'automne bas, doré, qui entre par les rues de l'ouest ; brume le matin qui adoucit tout ; à la nuit, les lanternes de papier ocre de la guirlande tendue d'un toit à l'autre. Ombres longues de l'arbre vers l'est.
- **Sons** : clochettes des étals, cris des marchands, eau de la fontaine qui déborde, toiles qui claquent.
- **Odeurs** : pain chaud venu de la taverne, fumée de bois, foin des écuries au sud-est, eau de rivière.
- **Température** : fraîche le matin, douce à midi, froide dès que le soleil baisse.
- **Éléments remarquables** (chacun avec sa place) :
  - la fontaine à vasque, au centre de la place ; son eau claire déborde sur un pavé plus sombre, au nord de la vasque.
  - le vieil arbre aux rubans, à l'est de la fontaine ; un tronc creux à la base, des rubans aux branches basses.
  - la corde des funambules, tendue au-dessus de la vasque de l'un à l'autre de deux poteaux de chêne, à la hauteur d'un homme.
  - le panneau d'affichage, cloué à un poteau de chêne au nord-ouest : « Moulin fermé pour réparations, jusqu'à nouvel ordre. »
  - deux anneaux de fer scellés dans les pavés, à cinq pas l'un de l'autre, verts de rouille, où s'amarrent les haubans des deux poteaux de la corde.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `ver-heron-salle` : description : Une porte basse, sous une enseigne peinte d'un héron gris, s'ouvre à l'ouest sur une salle chaude et bruyante. ; retour : De la salle, la porte basse ouvre sur la place : la fontaine, les toiles rouges et la lumière de l'automne.
  - vers `ver-bailli-salle` : description : Au nord-est, une halle de bois à colonnes ouvre sa grande porte sur la place, sous un auvent rayé de rouge brique et de crème. ; retour : Depuis la halle, la grande porte encadre la place, la fontaine et la foule des étals, et le soleil y entre en bande.
  - vers `ver-sanctuaire` : description : À l'est, un petit sanctuaire de pierre claire se tient au bord de l'eau, derrière une porte cintrée et trois marches. ; retour : Depuis la nef, la porte cintrée ouvre sur la place et la lumière de l'automne ; on y entend l'eau de la rivière.
  - vers `ver-forge` : description : Au sud-ouest, une forge de pierre noircie ouvre sur la place : une grande porte à mi-battant, et le rouge de la braise qui luit dans l'ombre. ; retour : La grande porte de la forge donne sur la place ; le soufflet ronfle, et les passants s'arrêtent sur le seuil pour regarder.
  - vers `ver-boutique-grain` : description : Au nord, une maison de pierre claire à toit de tuiles ouvre sur la place une porte de chêne sous un auvent ocre. ; retour : Depuis la boutique, la porte ouvre sur la place : on voit l'auvent ocre, les sacs de toile et la fontaine au loin.
  - vers `ver-marche` : description : Au sud-est, une ruelle s'ouvre entre deux auvents rayés : les étals du marché débordent sur les pavés, et l'on entend les marchands crier. ; retour : La ruelle du marché remonte vers la place entre les étals ; les pavés luisent de brume, et la fontaine se voit par-dessus les toiles.
  - vers `ver-ecuries` : description : Plus loin, à l'est et au sud, un portail de bois ouvert sur une cour de terre laisse passer l'odeur du foin et le craquement des planches. ; retour : Depuis les écuries, le portail ouvre sur la place ; les pavés luisent, et la corde des funambules barre le ciel au-dessus de la fontaine.
  - vers `ver-pont-des-marchands` : description : Au sud, une rue en pente descend vers le Pont-des-Marchands, un pont de pierre claire dont les piles plongent dans la rivière. ; retour : Du pont, la place se voit en contrebas, au-dessus des toits : la fontaine, la corde tendue et les toiles rouges.
  - vers `mou-pont-du-meunier` (hors de cette fiche ; lien conditionnel à la quête principale, porté par la fiche JSON) : description : Par le nord-est, une route de terre quitte le bourg entre deux haies de noisetiers et file vers les collines. ; retour : La route descend des collines vers le bourg, entre les haies ; de là-haut, on aperçoit les toits rouges de Verdelle et la fumée des cheminées.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | trésor | cache sous la fontaine : 5 po et une vieille pièce de foire | sous la margelle de la fontaine | à créer | Perception DD 12 |
  | objet | événement à choix : la corde des funambules (traverser : Acrobaties DD 8, échec = plouf sans danger ; passer ; regarder de près : on remarque le nœud de funambule) | corde au-dessus de la vasque, anneaux de fer | à créer | Acrobaties DD 8 |
  | objet | panneau d'affichage (texte : « moulin fermé pour réparations, jusqu'à nouvel ordre ») | poteau de chêne au nord-ouest | à créer | — |

- **Avant / après** : aucun changement prévu par le canon sur la place.
- **Un détail propre à ce lieu** : les deux anneaux de fer scellés dans les pavés, qui ne servent qu'à tendre la corde des funambules (le fer est absent du bloc d'héritage ; il est ici scellé dans la pierre, pour l'attache d'un événement).

**Champs dérivés**
- **resume** : La place de Verdelle, pavée et luisante, où la fontaine, le vieil arbre aux rubans et une corde tendue accueillent les arrivants.
- **accroche** : Au bout de la route des collines, un bourg de toiles rouges et de pavés luisants, autour d'une fontaine.
- **visuel** : Une place pavée de pierre claire, lavée par la brume, avec une fontaine à vasque au centre et un vieil arbre aux rubans à l'est. Des toiles rayées rouge brique et crème couvrent les étals, et une corde tendue passe au-dessus de la vasque. La lumière dorée d'automne entre par les rues de l'ouest, et une guirlande de lanternes ocre court au-dessus des toits.
- **ambiance** : Clochettes de foire, pavés mouillés, odeur de pain
- **arrivee** : La route des collines débouche sur la place sans prévenir, et la lumière dorée vous frappe au visage. Les pavés de pierre claire luisent encore de la brume du matin, et chaque pas y laisse une trace sombre qui s'efface aussitôt. Au centre, une fontaine à vasque fait couler son eau dans un bruit régulier ; autour d'elle, les étals s'alignent sous des toiles rayées rouge brique et crème. Un vieil arbre se dresse à l'est, son tronc creux couvert de rubans qui claquent au moindre souffle. Une corde tendue passe au-dessus de la vasque, d'un poteau à l'autre, et sa vibration ondule doucement dans l'air frais. Le pain chaud d'une taverne se mêle à la fumée de bois, et la rivière, derrière les toits, parle à voix basse. Des voix de marchands s'élèvent, des clochettes tintent : la foire n'ouvre que demain, mais le bourg est déjà là.
- **description** : Place pavée d'une trentaine de pas de côté, ouverte sur les rues du bourg. La fontaine, au centre, reçoit une eau claire qui déborde sur un pavé plus sombre. Sous sa margelle, une cache : 5 po et une vieille pièce de foire (Perception DD 12). Le vieil arbre aux rubans, à l'est, a un tronc creux à la base. Le panneau d'affichage, au nord-ouest, annonce que le moulin est fermé pour réparations. La corde des funambules passe au-dessus de la vasque : la traverser demande Acrobaties DD 8, et l'échec fait un plouf sans danger dans la vasque. On peut aussi passer sans rien tenter, ou regarder la corde de près, ce qui fait remarquer un nœud de funambule. Ignorer la corde ne coûte rien, et un héros tombé à l'eau se sèche au Héron Gris.

#### Niveau 2 : `ver-heron-salle` (Le Héron Gris, taverne), dans `verdelle`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : salle basse de douze pas sur six, plancher de planches larges, plafond à poutres à hauteur de tête. Le comptoir occupe le mur est, la grande cheminée le fond, l'escalier des chambres le coin du fond à gauche.
- **Matériaux et état** : poutres et tables de chêne, noircies de fumée au plafond et clairs sur les tables, marquées de couteaux ; pierre claire autour de la cheminée ; plancher usé qui sonne creux près du comptoir ; ardoise des rumeurs noire, bords ébréchés.
- **Lumière** (origine, couleur, force, ombres) : chandelles sur les tables et lampe à huile au-dessus du comptoir ; la cheminée du fond donne la lumière la plus chaude ; deux fenêtres à petits carreaux sur la place laissent un jour pâle ; ombres profondes sous les poutres.
- **Sons** : conversations basses, cliquetis de bols, chopes qui se heurtent, bûches qui craquent dans la cheminée.
- **Odeurs** : soupe de légumes, pain chaud, bois brûlé, bière tiède.
- **Température** : chaude près de la cheminée, plus fraîche près de la porte ; un courant d'air frais remonte du plancher près du comptoir.
- **Éléments remarquables** (chacun avec sa place) :
  - le comptoir de chêne, au mur est, couvert de coups de couteau ; une trappe ferrée au ras du plancher, derrière lui.
  - la grande cheminée de pierre claire, au fond, avec des chenets de fer et une marmite au crochet.
  - l'ardoise des rumeurs, accrochée au pilier près de la porte, couverte de craie.
  - une plume de héron gris clouée à la poutre au-dessus du comptoir.
  - l'escalier des chambres, étroit, au coin du fond à gauche, qui monte vers l'étage des chambres louées (un service de nuit, sans fiche de pièce).
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `verdelle` : description : De la salle, la porte basse ouvre sur la place : la fontaine, les toiles rouges et la lumière de l'automne. ; retour : Une porte basse, sous une enseigne peinte d'un héron gris, s'ouvre à l'ouest sur une salle chaude et bruyante.
  - vers `ver-heron-cave` : description : Derrière le comptoir, une trappe de chêne ferrée est relevée ; un escalier raide descend vers une cave, et son odeur de vin monte jusqu'à la salle. ; retour : Un escalier raide monte vers une trappe de chêne ouverte ; la lumière de la salle tombe en bande sur les marches, et le bruit des bols s'entend.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | Colombe Tisserand, aubergiste : au moins 4 sujets ; confie la quête des rats (`q-les-rats-de-la-cave`) ; si elle est attaquée, elle refuse de servir le groupe jusqu'au lendemain (ni repas ni chambre) | derrière le comptoir | colombe-tisserand | conversation |
  | objet | service : repas (soupe, pain) ; chambre = service de nuit (2 po) | comptoir et escalier des chambres | à créer | — |
  | objet | ardoise des rumeurs (examen) : un funambule rôdait en pleine nuit ; des hommes de main louches vers le Pont-du-Meunier | pilier près de la porte | à créer | examen |

- **Avant / après** : aucun changement prévu par le canon.
- **Un détail propre à ce lieu** : la plume de héron gris clouée à la poutre au-dessus du comptoir, qui a donné son nom à l'enseigne (la plume est absente du bloc d'héritage ; elle n'existe que dans cette salle).
- **Intérieur** (ce point contient une autre pièce) :
  - plan intérieur : une seule salle de plain-pied ; le comptoir à l'est, la trappe derrière lui, la cheminée au fond, l'escalier des chambres au coin du fond à gauche.
  - sous-lieux (chacun aura sa fiche « Niveau 3 ») :

    | id | nom | type | fonction dramatique | position | ce qui l'annonce depuis ce lieu | voisins directs |
    | --- | --- | --- | --- | --- | --- | --- |
    | `ver-heron-cave` | La cave du Héron Gris | salle | adversaire avec butin (3 rats géants) et trésor gardé (tonneau caché) | — (sous la salle) | la trappe ferrée derrière le comptoir | `ver-heron-salle` |

**Champs dérivés**
- **resume** : La taverne du Héron Gris, basse et enfumée, où l'on mange près de la cheminée et où l'on loue une chambre à l'étage.
- **accroche** : Sur la place, une porte basse sous une enseigne de héron gris ; de la salle sortent l'odeur de pain et le bruit des bols.
- **visuel** : Une salle basse aux poutres noircies de fumée, un long comptoir de chêne couvert de marques de couteaux et une grande cheminée de pierre claire où couve un feu. Une plume grise est clouée à la poutre au-dessus du comptoir, et une ardoise couverte de craie est accrochée au pilier près de la porte. Des lampes à huile et la lueur de la cheminée éclairent les tables de chêne clair.
- **ambiance** : Cheminée qui ronfle, bols qui tintent
- **arrivee** : La chaleur vous prend dès le seuil, et l'odeur de soupe, de pain et de bois brûlé vous enveloppe avant que vos yeux s'habituent à la pénombre. Les poutres sont si basses qu'il faut baisser la tête, noircies par des années de fumée. Au fond, une grande cheminée de pierre claire ronfle, et ses flammes dessinent des reflets dorés sur des tables de chêne marquées de couteaux. Une plume grise est clouée à la poutre au-dessus d'un long comptoir. Près de la porte, une ardoise couverte de craie garde des lignes effacées et réécrites d'une main pressée. Des voix basses parlent autour des bancs, des chopes se heurtent, et quelqu'un rit près du foyer. Un escalier étroit monte dans l'ombre, au fond à gauche. Sous vos semelles, le plancher sonne creux par endroits, et un courant d'air frais remonte entre les lattes.
- **description** : Salle basse de douze pas sur six, poutres à hauteur de tête, enfumées par la grande cheminée du fond. Le comptoir de chêne occupe le mur est, marqué de coups de couteau ; derrière, une trappe ferrée donne sur la cave. L'ardoise des rumeurs, accrochée au pilier près de la porte, porte des lignes de craie effacées puis réécrites : c'est là que la salle se raconte le bourg. Un escalier étroit monte au fond à gauche vers deux chambres, louées comme service de nuit (2 po). Colombe Tisserand tient la salle : elle sert soupe, pain et bière, et connaît tout le monde. Elle parle volontiers des rats qui gênent sa cave. Une plume de héron gris est clouée à la poutre au-dessus du comptoir. Si quelqu'un l'attaque, elle refuse de servir le groupe jusqu'au lendemain : ni repas ni chambre.

#### Niveau 3 : `ver-heron-cave` (La cave du Héron Gris, salle), dans `ver-heron-salle`

**Héritage** (recopié du niveau 1 via le niveau 2, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : cave voûtée de douze pas sur cinq, voûte en berceau à deux pas du sol au centre ; descente par un escalier raide de neuf marches de pierre, au coin sud-est.
- **Matériaux et état** : pierre claire mal jointe, qui suinte au pied du mur sud ; tonneaux de chêne aux cercles de fer rouillés ; étagère de bois ; dalles mouillées ; un sac de farine éventré.
- **Lumière** (origine, couleur, force, ombres) : une lanterne de papier ocre au pied de l'escalier, seule lumière de la cave ; un soupirail grillé dans la voûte du nord laisse un filet de jour gris qui s'arrête à mi-hauteur ; ombres profondes derrière les tonneaux.
- **Sons** : gouttes qui tombent dans une flaque, grattement derrière une planche au sud, salle étouffée au-dessus.
- **Odeurs** : vin, levure, moisi, farine.
- **Température** : fraîche et constante, plus froide près du soupirail.
- **Éléments remarquables** (chacun avec sa place) :
  - cinq tonneaux de chêne couchés en rang contre le mur est ; le tonneau caché est calé au bout, derrière les autres.
  - l'étagère de bois à l'ouest, garnie de bocaux de verre dont certains sont bouchés de cire.
  - le soupirail grillé, dans la voûte du nord.
  - le trou de rats, au pied du mur sud, sous une planche.
  - le sac de farine éventré, près de l'étagère ; sa poudre trace un chemin jusqu'au trou.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `ver-heron-salle` : description : Un escalier raide monte vers une trappe de chêne ouverte ; la lumière de la salle tombe en bande sur les marches, et le bruit des bols s'entend. ; retour : Derrière le comptoir, une trappe de chêne ferrée est relevée ; un escalier raide descend vers une cave, et son odeur de vin monte jusqu'à la salle.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | monstre | trois rats géants (combat seul, muets) | derrière les tonneaux et au trou de rats | `r-rats-de-la-cave` | combat |
  | trésor | le tonneau caché : 8 po et un vin fin, gardé par la rencontre | au bout de la rangée de tonneaux | à créer | — (gardé par les rats) |
  | objet | sac de farine rongé (examen) | près de l'étagère | à créer | examen |

  Cas limite : si les rats sont tués avant que le groupe ait la quête, Colombe remercie et donne la récompense (à traiter au Héron Gris).

- **Avant / après** : aucun changement prévu par le canon.
- **Un détail propre à ce lieu** : un rond de cire rouge scellé sur le fond du tonneau caché, que nul autre tonneau de la cave ne porte (la cire est absente du bloc d'héritage ; elle sert ici de sceau).

**Champs dérivés**
- **resume** : La cave du Héron Gris, voûtée et fraîche, où l'on garde le vin, les bocaux et la farine.
- **accroche** : Sous la trappe du comptoir, un escalier raide descend vers une voûte basse, où l'odeur de vin et de moisi monte.
- **visuel** : Une voûte basse de pierre claire, mal jointe, où cinq tonneaux de chêne sont alignés contre le mur est. Des bocaux de verre garnissent une étagère de bois à l'ouest, et un soupirail grillé laisse tomber un filet de jour gris dans la voûte du nord. Une lanterne de papier ocre accrochée au pied de l'escalier éclaire les dalles mouillées.
- **ambiance** : Vin, moisi, gouttes d'eau, grattements lointains
- **arrivee** : La trappe ouverte vous laisse descendre par un escalier raide, dont chaque marche luit sous vos semelles. Le bruit de la salle s'éteint à mesure que vous descendez, et l'air devient frais, lourd, chargé d'une odeur de vin et de moisi. La voûte est si basse qu'il faut courber la nuque. Des tonneaux de chêne sont couchés en rang contre le mur, leurs cercles de fer rouillés, et des bocaux de verre s'alignent sur une étagère. Une lanterne de papier ocre pend au pied de l'escalier et fait briller les dalles mouillées. Dans la voûte du nord, un soupirail grillé laisse tomber un filet de jour gris, qui s'arrête à mi-hauteur. Au coin sud, un grattement très léger vient derrière une planche. Un sac de farine a été éventré près du mur, et sa poudre blanche dessine un chemin jusqu'à un trou. Une goutte tombe du plafond, régulièrement, dans une flaque.
- **description** : Cave voûtée de douze pas de long, aux voûtes si basses qu'elles frôlent la tête ; la pierre claire est mal jointe et suinte au pied du mur sud. Cinq tonneaux de chêne sont couchés en rang contre le mur est. Le tonneau caché est calé au bout, derrière les autres, avec un rond de cire rouge sur le fond : 8 po et un vin fin. Une étagère de bois garde des bocaux de verre à l'ouest, dont certains sont bouchés de cire. Dans la voûte du nord, un soupirail grillé laisse passer un filet de jour gris. Trois rats géants vivent dans le trou au pied du mur sud, sous une planche rongée ; ils attaquent dès qu'on approche, sans un cri. Un sac de farine éventré est posé près de l'étagère. Les rats ne parlent pas : c'est un combat seul.

#### Niveau 2 : `ver-bailli-salle` (La halle du bailli, bâtiment), dans `verdelle`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : halle de quatorze pas sur neuf, portée par quatre colonnes de chêne en deux rangs ; poutres apparentes à près de quatre pas du sol. Une seule nef, un soubassement de pierre claire.
- **Matériaux et état** : chêne clair des colonnes, polies par les mains ; table marquée d'encre ; tableau noir des comptes, écrit à la craie ; cloche d'ouverture en cuivre (le cuivre est absent du bloc d'héritage : une cloche se fond en cuivre, et c'est la seule pièce qui en a un).
- **Lumière** (origine, couleur, force, ombres) : deux fenêtres hautes au mur ouest, lumière dorée en bandes obliques ; lampe à huile au-dessus de la table, allumée le soir ; ombres des colonnes sur le plancher.
- **Sons** : claquement de l'auvent par la porte ouverte, grattement de plume, registres qu'on feuillette, pas sur les lattes.
- **Odeurs** : cire, bois ciré, encre sèche, pain venu de la place.
- **Température** : fraîche près de la porte, tiède sous les fenêtres.
- **Éléments remarquables** (chacun avec sa place) :
  - la grande table de chêne, au centre, couverte de registres et de pots d'encre ; le registre de la foire y est ouvert.
  - le tableau noir des comptes, contre le mur est, couvert de noms de marchands.
  - la cloche d'ouverture, suspendue à une poutre au nord, près de la porte du fond ; corde blanche usée au milieu.
  - la seule chaise rembourrée de la salle, au bout de la table.
  - la porte de planches peinte en vert mousse, au fond, entrouverte.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `verdelle` : description : Depuis la halle, la grande porte encadre la place, la fontaine et la foule des étals, et le soleil y entre en bande. ; retour : Au nord-est, une halle de bois à colonnes ouvre sa grande porte sur la place, sous un auvent rayé de rouge brique et de crème.
  - vers `ver-bailli-cabinet` : description : Au fond de la halle, une porte de planches peinte en vert mousse mène à l'arrière-pièce du bailli, dont la fenêtre donne sur la rivière. ; retour : La porte de planches du cabinet donne sur la halle ; de ce côté, la peinture verte est usée à hauteur de main, à force de passages.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | Aubin Cerfeuil, bailli : confie la quête principale (`q-la-cle-de-la-foire`) ; 4 sujets dont 2 sur la quête ; si la clé est rapportée sans quête acceptée, il verse la prime (60 po) et termine la quête | à la grande table, sur la chaise rembourrée | `aubin-cerfeuil` | conversation |
  | objet | registre de la foire (examen : registre des droits de place des marchands, sans détail utile) | sur la grande table | à créer | examen |

- **Avant / après** : aucun changement prévu dans la pièce.
- **Un détail propre à ce lieu** : un coussin de toile crème brodé d'un épi de blé sur la seule chaise rembourrée, celle du bailli ; rien d'autre de la halle n'est rembourré.
- **Intérieur** (ce point contient une autre pièce) :
  - plan intérieur : une seule salle de plain-pied ; la porte du fond, peinte en vert mousse, mène à l'arrière-pièce.
  - sous-lieux (chacun aura sa fiche « Niveau 3 ») :

    | id | nom | type | fonction dramatique | position | ce qui l'annonce depuis ce lieu | voisins directs |
    | --- | --- | --- | --- | --- | --- | --- |
    | `ver-bailli-cabinet` | Le cabinet du bailli | salle | contenant (carnet et petite caisse de 12 po) ; coffre de la foire scellé (décor, non pillable) | — (derrière la halle) | la porte de planches peinte en vert mousse, au fond de la halle | `ver-bailli-salle` |

**Champs dérivés**
- **resume** : La halle du bailli, où l'on tient le registre de la foire et les comptes des marchands sous quatre colonnes de chêne.
- **accroche** : Au nord-est de la place, une halle de bois à colonnes ; sous son auvent rayé, on entend des voix graves.
- **visuel** : Une halle de chêne clair portée par quatre colonnes, avec une grande table couverte de registres au centre et un tableau noir de comptes contre le mur est. Deux fenêtres hautes laissent entrer une lumière dorée qui glisse sur les poutres et sur la cloche d'ouverture, suspendue au nord. Une porte de planches peinte en vert mousse ferme le fond de la salle.
- **ambiance** : Plumes qui grattent, registres, lumière dorée
- **arrivee** : La grande porte est ouverte sur l'air frais du matin, et l'auvent rayé claque doucement au-dessus du seuil. À l'intérieur, la lumière tombe en bandes obliques depuis deux fenêtres hautes et glisse sur quatre colonnes de chêne clair, polies par les mains. Une grande table occupe le centre, couverte de registres ouverts et de pots d'encre, dont certains ont séché. L'odeur de cire et de bois ciré se mêle à celle du pain venue de la place. Contre le mur est, un grand tableau noir porte des comptes à la craie, serrés, rayés, corrigés. Une cloche de cuivre pend à une poutre, sa corde blanche usée au milieu. Au fond, une porte de planches peinte en vert mousse est entrouverte. Sur la seule chaise rembourrée de la salle, un coussin de toile crème brodé d'un épi de blé rappelle que ce lieu appartient à quelqu'un qui décide. Un grattement de plume s'interrompt, puis reprend.
- **description** : Halle de bois de quatorze pas sur neuf, portée par quatre colonnes de chêne en deux rangs. La grande table occupe le centre, couverte d'encre et de registres ; le registre de la foire y est ouvert, avec les droits de place des marchands : la liste est complète et ennuyeuse, sans détail utile. Contre le mur est, un tableau noir des comptes porte les noms des marchands à la craie. La cloche d'ouverture pend à une poutre au nord, près de la porte du fond, sa corde blanche usée au milieu. Aubin Cerfeuil tient ici sa cour de bailli : il parle peu, pèse ses mots, et cherche la clé qu'il a perdue. Il confie la quête principale. Si la clé est rapportée sans que le groupe ait accepté la quête, Aubin verse la prime et la termine.

#### Niveau 3 : `ver-bailli-cabinet` (Le cabinet du bailli, salle), dans `ver-bailli-salle`

**Héritage** (recopié du niveau 1 via le niveau 2, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : pièce de six pas sur quatre, plafond bas à une poutre de chêne ; fenêtre étroite au mur est, sur la rivière.
- **Matériaux et état** : murs lambrissés de chêne sombre ; plancher de lattes usées qui craquent ; étagère de registres, reliés de toile et de chêne ; coffre de la foire en chêne cerclé de fer (le fer est absent du bloc d'héritage : il sert de cerclage au coffre scellé) ; rebord de fenêtre en chêne.
- **Lumière** (origine, couleur, force, ombres) : lumière pâle de la rivière, par la fenêtre est ; elle se reflète en bandes verdâtres sur le plancher ; le fond de la pièce reste dans l'ombre.
- **Sons** : clapotis de la rivière par la fenêtre ouverte, plancher qui craque, rumeur étouffée de la halle.
- **Odeurs** : papier, cire, encre, humidité de rivière.
- **Température** : fraîche ; plus froide près de la fenêtre.
- **Éléments remarquables** (chacun avec sa place) :
  - l'étagère de registres, au mur ouest, du plancher au plafond ; le carnet du bailli, à hauteur de main, pose sur une petite caisse.
  - la fenêtre étroite, au mur est, sur la rivière ; le rebord de chêne et un clou de fer près d'elle, à hauteur d'homme, sont à examiner.
  - le coffre de la foire, au fond face à la porte, scellé contre le mur.
  - la grande table sous la fenêtre, avec des parchemins empilés et des dossiers de comptes.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `ver-bailli-salle` : description : La porte de planches du cabinet donne sur la halle ; de ce côté, la peinture verte est usée à hauteur de main, à force de passages. ; retour : Au fond de la halle, une porte de planches peinte en vert mousse mène à l'arrière-pièce du bailli, dont la fenêtre donne sur la rivière.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | trésor | carnet du bailli (contenant) recouvrant une petite caisse de bois : 12 po ; le texte du carnet ne contient aucun secret (comptes de place) | étagère de registres, à hauteur de main | à créer | fouille |
  | objet | coffre de la foire scellé : décor, non pillable ; ne s'ouvre qu'avec la clé, par Aubin | fond de la pièce, face à la porte | à créer | — |
  | objet | examen : la trace de corde sur le rebord de la fenêtre et le clou vide près d'elle ; aucune effraction sur le coffre. Indice : on est passé par la rivière (secret du lieu) | fenêtre est | à créer | examen |

- **Avant / après** : aucun changement prévu par le canon.
- **Un détail propre à ce lieu** : un pot à encre de faïence bleue, ébréché, dont l'encre a séché en croûte noire sur la table (la faïence est absente du bloc d'héritage ; c'est le seul objet de ce genre dans le lieu).

**Champs dérivés**
- **resume** : Le cabinet du bailli, pièce claire aux registres, où la fenêtre donne sur la rivière et où le coffre de la foire reste scellé.
- **accroche** : Derrière la halle, une porte de planches donne sur un cabinet clair, où les registres dorment sur des étagères.
- **visuel** : Un cabinet clair aux murs de chêne, avec une étagère de registres à l'ouest, une grande table couverte de dossiers et une fenêtre étroite à l'est. Une lumière pâle de rivière se reflète en bandes verdâtres sur le plancher, et un coffre de chêne cerclé de fer ferme le fond de la pièce. Des parchemins empilés et des pupitres de bois complètent le décor.
- **ambiance** : Papier, cire, lumière de rivière, plancher qui craque
- **arrivee** : Une porte de planches vous fait passer de la halle au silence, et la pièce s'ouvre devant vous, claire et nue. Le plancher craque à chaque pas, et la lumière de la rivière entre par une fenêtre étroite, pâle et verdâtre, qui se reflète en bandes sur les lattes. Le long du mur ouest, une étagère de registres monte jusqu'au plafond, reliés de toile et de chêne, classés par année. Une grande table est couverte de dossiers et de feuilles de comptes, et un pot à encre de faïence bleue, ébréché, a laissé sécher sa croûte noire. Au fond, face à la porte, un coffre de chêne cerclé de fer est scellé contre le mur. L'air sent le papier, la cire et l'humidité de l'eau. Le bruit de la rivière monte par la fenêtre ouverte, un clapotis régulier qui semble compter le temps.
- **description** : Pièce de six pas sur quatre, plafond bas à une poutre de chêne. La fenêtre étroite, à l'est, donne sur la rivière : c'est par elle qu'entre le bruit de l'eau. Une étagère de registres occupe le mur ouest, reliés de toile et de chêne. Le carnet du bailli, posé sur l'étagère, recouvre une petite caisse de bois contenant 12 po ; son texte ne contient aucun secret, seulement des comptes de place. Le coffre de la foire, de chêne cerclé de fer, est scellé contre le mur du fond : il ne s'ouvre qu'avec la clé d'Aubin, et le groupe ne peut pas le piller. À l'examen, le clou près de la fenêtre et le rebord de chêne livrent plus qu'on ne croit (voir Contenu prévu). Un pot à encre ébréché est posé sur la table.

#### Niveau 2 : `ver-sanctuaire` (Le sanctuaire de la Rive, bâtiment), dans `verdelle`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : nef de douze pas sur sept, voûte en berceau ; une vasque au centre, un autel bas au fond, la porte cintrée à l'est.
- **Matériaux et état** : murs de pierre claire polie par les mains ; bancs de chêne clair ; vitraux bleu rivière ; tablettes de bois au mur nord, où les rubans de toile et les poupées de bois sont fanés par la brume ; galets gris autour de la vasque.
- **Lumière** (origine, couleur, force, ombres) : lumière bleutée des deux vitraux du fond, qui glisse sur les bancs ; lampe à huile devant l'autel bas ; ombres douces sous la voûte.
- **Sons** : clapotis de la vasque, eau de la rivière derrière le mur, pas feutrés sur les dalles.
- **Odeurs** : cire, eau froide, herbes sèches.
- **Température** : fraîche et humide, plus froide sous la voûte.
- **Éléments remarquables** (chacun avec sa place) :
  - la vasque de pierre claire, au centre de la nef ; l'eau déborde sur les galets.
  - les tablettes d'ex-voto, au mur nord : rubans de toile, poupées de bois.
  - les deux vitraux bleus, au fond ; l'autel bas devant eux, éclairé par une lampe à huile.
  - les bancs de chêne clair, alignés de part et d'autre de la vasque.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `verdelle` : description : Depuis la nef, la porte cintrée ouvre sur la place et la lumière de l'automne ; on y entend l'eau de la rivière. ; retour : À l'est, un petit sanctuaire de pierre claire se tient au bord de l'eau, derrière une porte cintrée et trois marches.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | Sœur Pervenche, soigneuse : au moins 4 sujets ; soins ; sur ceux qui prient la nuit, deux voies : Intuition DD 12, ou la poupée montrée (Tobie est venu prier de nuit et a laissé la poupée) | près de l'autel bas | `soeur-pervenche` | conversation (Intuition DD 12) |
  | objet | service : soins | nef, près de l'autel | à créer | — |
  | objet | poupée de bois laissée par Tobie (indice : la montrer à Pervenche ouvre la parole) | tablettes d'ex-voto, mur nord | à créer | — |
  | objet | ex-voto (examen) : rubans et poupées de bois | tablettes d'ex-voto, mur nord | à créer | examen |

- **Avant / après** : aucun changement prévu par le canon.
- **Un détail propre à ce lieu** : la poupée de bois peinte en bleu, au ruban crème, parmi les ex-voto fanés des tablettes du mur nord (le « bateau de cire » de la première rédaction a été retiré le 20/11/2026 : détail inventé, déjà noté comme retiré plus haut).

**Champs dérivés**
- **resume** : Le sanctuaire de la Rive, nef de pierre claire au bord de l'eau, où l'on soigne les blessés et où l'on dépose des offrandes.
- **accroche** : À l'est de la place, une petite nef de pierre claire au bord de l'eau, derrière une porte cintrée et des rubans qui flottent.
- **visuel** : Une nef de pierre claire à voûtes, avec une vasque d'eau claire au centre et des vitraux bleus au fond. Des tablettes de bois au mur nord portent des rubans de toile et des poupées de bois, et une lampe à huile brille devant l'autel bas. La lumière bleue des vitraux glisse sur les bancs de chêne clair et sur les galets de la vasque.
- **ambiance** : Eau de vasque, lumière bleue, cire, silence
- **arrivee** : Une porte cintrée s'ouvre sous une arche de pierre claire, et la nef vous accueille dans une fraîcheur d'eau. Au centre, une vasque de pierre reçoit une eau si claire que le fond est visible, et l'eau déborde doucement sur des galets gris. La lumière tombe bleue des vitraux du fond, deux lancettes où la rivière est peinte en traits fins, et elle glisse sur des bancs de chêne clair. Des tablettes de bois courent le long du mur nord, chargées de rubans de toile crème et rouge brique qui pendent comme des cordes à linge. Une lampe à huile brûle devant un autel bas, sans un bruit. On entend le clapotis de la vasque, et plus loin, derrière le mur, le murmure de la rivière. Une odeur de cire et d'herbes sèches monte doucement vers la voûte, et le silence est épais, presque tendre.
- **description** : Nef de douze pas sur sept, voûte en berceau, murs de pierre claire polie par les mains. La vasque, au centre, est alimentée par une source sous la nef ; l'eau déborde sur les galets. Au fond, deux vitraux bleus et un autel bas, devant lequel brûle une lampe à huile. Sur les tablettes du mur nord, les ex-voto : rubans de toile, poupées de bois. Sœur Pervenche soigne ici les blessés. Elle parle volontiers de ceux qui prient, mais hésite à parler de ceux qui prient la nuit : deux voies pour l'amener à se confier, Intuition DD 12, ou la poupée montrée. Soins sur demande.

#### Niveau 2 : `ver-forge` (La forge de Brun, bâtiment), dans `verdelle`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : atelier de dix pas sur six ; forge en pierre au fond, sous une hotte ; enclume au centre ; porte à mi-battant à l'est, sur la place.
- **Matériaux et état** : pierre claire noircie de suie ; billot de chêne ; enclume de fer, marquée de coups de marteau ; établi de chêne couvert de fers et de barres ; pavés usés devant la forge, terre battue près de la porte.
- **Lumière** (origine, couleur, force, ombres) : la braise de la forge, lueur rouge profonde sous la hotte, la seule source vive ; la lumière du jour entre par la porte à mi-battant et s'arrête sur les dalles ; ombres mouvantes qui suivent le soufflet.
- **Sons** : marteau sur l'enclume, soufflet qui ronfle, braises qui craquent, rue au-dehors.
- **Odeurs** : charbon, fer chaud, huile de graissage.
- **Température** : chaude devant la forge, fraîche près de la porte.
- **Éléments remarquables** (chacun avec sa place) :
  - l'enclume de fer, au centre, sur son billot de chêne ; une marque de marteau profonde au bord.
  - la forge, au fond, sous une hotte noire, avec la braise.
  - le soufflet de bois et de toile, appuyé au mur à côté de la forge.
  - l'établi, contre le mur ouest, couvert de fers, de barres et d'outils rangés en désordre.
  - le fer à cheval cloué à l'envers au-dessus du linteau.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `verdelle` : description : La grande porte de la forge donne sur la place ; le soufflet ronfle, et les passants s'arrêtent sur le seuil pour regarder. ; retour : Au sud-ouest, une forge de pierre noircie ouvre sur la place : une grande porte à mi-battant, et le rouge de la braise qui luit dans l'ombre.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | Brun Forgefer, forgeron : au moins 4 sujets ; confie le colis (`q-le-colis-du-forgeron`) ; ce matin à l'aube, en livrant ses fers de roue au moulin, il a vu la serrure de la cour forcée (indice ; « hier » devenu « ce matin à l'aube » par D9 de V6, 20/11/2026) | près de l'enclume | `brun-forgefer` | conversation |
  | objet | service : forge et armes simples | enclume et forge | à créer | — |
  | piège | coffre piégé du colis : verrou DD 12, piège à aiguille (1d4), à chercher puis désamorcer ; forcé à la brute, le piège part (1d4) et le colis reste intact | sous l'établi, contre le mur ouest | à créer | à chercher puis à désamorcer (DD de recherche fixé en V6) |
  | objet | le colis (objet de quête : à remettre à Mère Pivoine, puis à rapporter à Brun avec le reçu ; ni vendable ni jetable) | dans le coffre piégé | à créer | — |

- **Avant / après** : aucun changement prévu par le canon.
- **Un détail propre à ce lieu** : un fer à cheval cloué à l'envers au-dessus du linteau, « pour porter chance à la forge » (le fer est absent du bloc d'héritage : il est ici l'outil et l'offrande de la forge).

**Champs dérivés**
- **resume** : La forge du bourg, où l'on bat le fer sous une hotte noire, et où l'on fait commande d'armes simples et de fers.
- **accroche** : Au sud-ouest de la place, une grande porte à mi-battant laisse voir une braise rouge et entendre le marteau sur l'enclume.
- **visuel** : Un atelier de pierre claire noircie de suie, avec une enclume de fer sur un billot de chêne au centre et une forge au fond, sous une hotte. Un soufflet de bois et de toile est appuyé au mur, près d'un établi couvert de fers et de barres. La braise de la forge éclaire la pièce d'une lueur rouge, et la lumière du jour entre par la porte à mi-battant.
- **ambiance** : Marteau sur l'enclume, braise rouge, odeur de charbon
- **arrivee** : Une chaleur sèche vous frappe dès le seuil, et l'odeur de charbon et de fer chaud vous prend à la gorge. La porte à mi-battant laisse entrer la lumière du jour, qui s'arrête net sur les dalles, comme si elle n'osait pas aller plus loin. Au fond, la braise de la forge luit d'un rouge profond sous une hotte noire, et chaque coup de soufflet la fait gonfler en étincelles. Une enclume de fer repose sur un billot de chêne, couverte de marques de marteau, et son tintement résonne entre les murs de pierre claire noircie de suie. Le long du mur, un soufflet de bois et de toile attend, près d'un établi où s'entassent fers, barres et outils. Au-dessus du linteau, un fer à cheval est cloué à l'envers, la pointe vers le bas.
- **description** : Atelier de dix pas sur six : pavés usés devant la forge, terre battue près de la porte. L'enclume de fer, au centre, repose sur un billot de chêne, avec une marque de marteau profonde au bord. La forge occupe le fond, sous une hotte noire, et le soufflet de bois et de toile est appuyé à côté. Brun Forgefer fabrique des fers et des armes simples, et tient la commande de Mère Pivoine : un colis, enfermé dans un coffre de chêne cerclé de fer, sous l'établi du mur ouest. Le coffre est verrouillé (verrou DD 12) et piégé d'une aiguille (1d4), à chercher puis désamorcer. Brun a aussi vu des choses en livrant des fers au moulin, et il en parle si on le met en confiance. Il a quatre sujets.

#### Niveau 2 : `ver-boutique-grain` (La boutique du grain, bâtiment), dans `verdelle`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : boutique de neuf pas sur cinq, comptoir à l'entrée ; étagères à l'ouest, sacs à l'est ; coffre-fort de fer dressé contre le mur du fond, derrière le comptoir.
- **Matériaux et état** : pierre claire et plancher de planches qui gonfle avec l'humidité du quai ; comptoir de chêne marqué de coups de couteau ; toile crème et rayée des rouleaux ; cordes sur des chevilles de bois ; balance de cuivre (le cuivre est absent du bloc d'héritage ; il sert ici de plateaux de pesée).
- **Lumière** (origine, couleur, force, ombres) : la porte ouverte sur la place, lumière du jour au seuil ; une lanterne de papier ocre au plafond, qui répand une lumière chaude sur les étagères hautes ; ombres basses sous le comptoir.
- **Sons** : toile qui frotte, grain qui coule d'un sac, balance qui tinte à chaque mouvement d'air, sabots de la rue au-dehors.
- **Odeurs** : grain, farine, cordes mouillées, toile.
- **Température** : fraîche et sèche, plus fraîche au fond, près du coffre-fort.
- **Éléments remarquables** (chacun avec sa place) :
  - le comptoir de chêne, à l'entrée, avec la balance de cuivre aux plateaux bien frottés.
  - les étagères de bocaux, mur ouest, garnies aussi de rouleaux de tissu et de cordes.
  - les sacs de grain, alignés contre le mur est, cols pliés.
  - l'ardoise des prix, accrochée près de la porte, chiffres à la craie.
  - le coffre-fort de fer, contre le mur du fond, derrière le comptoir : un meuble massif cerclé de fer, à la serrure épaisse.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `verdelle` : description : Depuis la boutique, la porte ouvre sur la place : on voit l'auvent ocre, les sacs de toile et la fontaine au loin. ; retour : Au nord, une maison de pierre claire à toit de tuiles ouvre sur la place une porte de chêne sous un auvent ocre.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | Gédéon Marchebise, marchand de grain : premier contact, il offre 30 po au groupe pour « oublier l'affaire » (accepter n'affecte ni la quête ni la fin) ; au moins 4 sujets | comptoir | `gedeon-marchebise` | conversation |
  | objet | service : boutique (grain, rations, sacs) | comptoir et étagères | à créer | — |
  | piège | coffre-fort du fond : verrou DD 14, piège à chercher avant de l'ouvrir ; si le groupe crochète le coffre devant Gédéon, il part chez le bailli (effet `deplacer` : la boutique reste vide) | contre le mur du fond | à créer | à chercher puis à crocheter (DD de recherche et de désamorçage fixés en V6) |
  | trésor | contenu du coffre-fort : 40 po et une reconnaissance de dette (secret : visible seulement derrière le verrou et le piège) ; la reconnaissance reste prise dans le cas limite, la prime du bailli ne change pas | même coffre | à créer | — |

- **Avant / après** : aucun changement de décor prévu par le canon (le déplacement de Gédéon est un effet `deplacer`, pas un décor).
- **Un détail propre à ce lieu** : une ardoise de prix aux chiffres écrits à la craie, serrés, dont plusieurs ont été effacés puis réécrits plus bas au fil des saisons (l'ardoise n'existe que dans cette boutique).
- **Intérieur** : aucun sous-lieu déclaré (le coffre-fort est un contenant de la pièce).

**Champs dérivés**
- **resume** : La boutique du grain, où l'on vend sacs, rations et cordes sous une balance de cuivre, et où l'on tient les comptes.
- **accroche** : Au nord de la place, une maison de pierre claire et une porte de chêne sous un auvent ocre, avec des sacs de grain sur le seuil.
- **visuel** : Une boutique de pierre claire à porte de chêne, avec un comptoir de chêne et une balance de cuivre à l'entrée. Des étagères de bocaux, des rouleaux de tissu et des cordes couvrent le mur ouest, et des sacs de grain sont alignés contre le mur est. Une lanterne de papier ocre pend au plafond et éclaire les plateaux de la balance.
- **ambiance** : Sacs de grain, cordes, balance qui tinte
- **arrivee** : La porte de chêne grince et laisse entrer une odeur de grain, de sacs et de cordes mouillées. Une lanterne de papier ocre pend au plafond et répand une lumière chaude sur des étagères hautes, couvertes de bocaux de verre aux étiquettes écrites à la main. Le mur ouest disparaît sous des rouleaux de tissu crème et de toile rayée, et des cordes s'enroulent sur des chevilles de bois. Au centre, un comptoir de chêne, marqué de coups de couteau, porte une balance de cuivre aux plateaux bien frottés, qui tinte doucement à chaque mouvement d'air. Contre le mur est, des sacs de grain sont alignés, leurs cols pliés, et une poussière fine flotte dans la lumière. Une ardoise de prix est accrochée près de la porte, les chiffres à la craie, serrés. Au fond, derrière le comptoir, un coffre-fort de fer cerclé se dresse contre le mur, et le sol de planches gonfle sous vos pas.
- **description** : Boutique de neuf pas sur cinq : comptoir de chêne à l'entrée, étagères de bocaux à l'ouest, sacs de grain alignés à l'est. La balance de cuivre pèse le grain, les rations et les cordes ; l'ardoise des prix est tenue à la craie. Gédéon Marchebise, marchand de grain, tient la boutique et a quatre sujets. Premier contact : il offre 30 po au groupe pour « oublier l'affaire » ; accepter n'affecte ni la quête ni la fin. Au fond, derrière le comptoir, un coffre-fort de fer : verrou DD 14 et piège à chercher avant de l'ouvrir, avec 40 po (voir Contenu prévu). Si le groupe crochète le coffre devant Gédéon, il part chez le bailli : la boutique reste vide.

#### Niveau 2 : `ver-marche` (Le marché, bâtiment couvert en ruelle), dans `verdelle`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : ruelle couverte d'environ trente pas sur huit, bordée d'étals des deux côtés, avec des auvents tendus sur des perches ; balance publique au milieu ; jeu d'anneaux au bout de la ruelle.
- **Matériaux et état** : pavés luisants de brume ; étals de planches et de chêne clair ; cageots de bois ; auvents de toile rouge brique et crème, certains délavés ; balance sur un pied de chêne aux plateaux polis.
- **Lumière** (origine, couleur, force, ombres) : lumière dorée qui filtre entre les toiles en bandes ; lanternes de papier ocre tendues entre les perches, allumées le soir ; ombres des auvents sur les pavés.
- **Sons** : cris de marchands, clochettes, toile qui claque, anneaux de corde qui tombent sur la planche.
- **Odeurs** : pain, cire d'abeille, légumes chauds, cordage.
- **Température** : douce, plus chaude sous les auvents, fraîche dans les coins ombragés.
- **Éléments remarquables** (chacun avec sa place) :
  - la balance publique, au milieu de la ruelle, sur son pied de chêne.
  - les étals de part et d'autre, cageots de légumes et pots de miel.
  - l'étal aux cordes, au fond côté pont : celui de Mathilde, avec des cordes pendues et des rations.
  - le jeu d'anneaux, au bout de la ruelle : une planche percée de clous, des anneaux de corde.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `verdelle` : description : La ruelle du marché remonte vers la place entre les étals ; les pavés luisent de brume, et la fontaine se voit par-dessus les toiles. ; retour : Au sud-est, une ruelle s'ouvre entre deux auvents rayés : les étals du marché débordent sur les pavés, et l'on entend les marchands crier.
  - vers `ver-pont-des-marchands` : description : La ruelle du marché descend vers le pont, entre les étals ; le bruit de la rivière remonte sous les toiles. ; retour : Une ruelle de pierre claire remonte du ponton vers le marché, bordée de caisses et de cordages.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | Mathilde Pot-de-Miel, colporteuse : au moins 4 sujets ; secret du lieu : elle a vendu une corde fine de soie à Tobie ; si elle est volée, elle plie son étal et part au camp des forains (effet `deplacer`) | étal aux cordes, côté pont | `mathilde-pot-de-miel` | conversation |
  | objet | service : boutique (cordes, rations, bijoux de foire) | étal aux cordes | à créer | — |

- **Avant / après** : aucun changement prévu par le canon.
- **Un détail propre à ce lieu** : un pot de miel fêlé, recollé au fil de chanvre, posé au pied de la balance publique (le chanvre est absent du bloc d'héritage ; c'est le seul recollage du marché).

**Champs dérivés**
- **resume** : Le marché de Verdelle, ruelle couverte d'auvents où l'on vend cordes, miel et rations, sous une balance publique.
- **accroche** : Au sud-est de la place, une ruelle couverte d'auvents rayés, où les marchands s'appellent d'un étal à l'autre.
- **visuel** : Une ruelle de pavés bordée d'étals sous des auvents rayés rouge brique et crème, avec des cageots de légumes et des pots de miel alignés. Une balance publique au milieu de la ruelle, sur un pied de chêne, et des cordes pendues à l'étal du fond. La lumière dorée filtre à travers la toile en bandes, et les lanternes ocre pendent entre les perches.
- **ambiance** : Cris de marchands, miel, toile qui claque
- **arrivee** : La ruelle s'ouvre entre deux auvents rayés rouge brique et crème, et le bruit vous saisit d'un coup : cris de marchands, clochettes, toile qui claque au vent. Des étals se serrent des deux côtés, couverts de cageots de légumes aux couleurs vives, de pots de miel ambré et de paquets de rations enveloppés de papier. Une balance publique se dresse au milieu de l'allée, sur un pied de chêne, et ses plateaux polis renvoient la lumière dorée qui filtre entre les toiles. Plus loin, des cordes pendent à un étal, enroulées en couronnes. Une odeur de pain, de cire et de légumes chauds monte des pavés luisants. Au bout de la ruelle, un jeu d'anneaux est dressé, une planche percée de clous, et quelques anneaux de corde attendent qu'on les lance. Quelqu'un rit, un peu plus loin, et l'on sent qu'on marchande déjà.
- **description** : Ruelle d'une trentaine de pas bordée d'étals sous des auvents rayés, sur des pavés luisants de brume. La balance publique, au milieu, pèse le grain, le miel et les cordes pour qui vient marchander. Au bout de la ruelle, un jeu d'anneaux, sans enjeu, attend qu'on le lance aux joueurs de foire. Mathilde Pot-de-Miel tient l'étal aux cordes, côté pont : cordes, rations et bijoux de foire ; elle a quatre sujets et aime les potins. Son secret (voir Contenu prévu) : elle a vendu une corde fine de soie. Si elle est volée, elle plie son étal et part au camp des forains. Un pot de miel fêlé, recollé au fil de chanvre, est posé au pied de la balance.

#### Niveau 2 : `ver-ecuries` (Les écuries de la foire, bâtiment), dans `verdelle`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : bâtiment de bois long de quinze pas sur six ; allée centrale de terre battue ; cinq boxes de chaque côté ; grenier à foin au-dessus, atteint par une échelle de bois près de la porte.
- **Matériaux et état** : bois des planches gonflé par l'humidité de la rivière, portes qui grincent ; claies de chêne clair patinées ; foin sec en tas ; selles de toile et de bois sur des tréteaux ; cordes et sangles raides de poussière.
- **Lumière** (origine, couleur, force, ombres) : jour qui entre par le portail ouvert au sud-est, et par une lucarne au-dessus de l'allée ; bandes de poussière dorée sur la terre ; lanterne de papier ocre accrochée à un poteau, près de la porte ; ombres profondes au fond des boxes.
- **Sons** : planches qui craquent, foin qui crisse, goutte d'eau qui tombe de la toiture à intervalles réguliers.
- **Odeurs** : foin sec, huile de graissage, poussière.
- **Température** : tiède et sèche sous le toit, plus fraîche près du portail.
- **Éléments remarquables** (chacun avec sa place) :
  - les boxes, cinq de chaque côté de l'allée ; le troisième box, seul, a une claie où les palefreniers ont gravé au couteau les noms des chevaux des années passées.
  - le foin, en tas dans le box du fond : la cache s'y trouve.
  - les selles, posées sur des tréteaux près de la porte.
  - la mangeoire du troisième box, où pend un bout de corde noué (examen).
  - le filet suspendu au-dessus de l'allée, près de la porte du grenier.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `verdelle` : description : Depuis les écuries, le portail ouvre sur la place ; les pavés luisent, et la corde des funambules barre le ciel au-dessus de la fontaine. ; retour : Plus loin, à l'est et au sud, un portail de bois ouvert sur une cour de terre laisse passer l'odeur du foin et le craquement des planches.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | trésor | cache dans le foin : 10 po | foin du box du fond | à créer | Perception DD 12 |
  | piège | filet suspendu au-dessus de l'allée : sauvegarde de Dextérité DD 10 ; échec : effet `temps` d'une demi-heure, aucun dégât (piège à chercher d'abord) | au-dessus de l'allée, près de la porte du grenier | à créer | Perception (chercher), puis Dextérité DD 10 |
  | objet | bout de corde noué d'un nœud de funambule (examen, indice du vol) | mangeoire du troisième box | à créer | examen |

- **Avant / après** : aucun changement prévu par le canon.
- **Un détail propre à ce lieu** : les noms des chevaux des années passées, gravés au couteau dans la claie du troisième box : le bois y est plus sombre qu'ailleurs (la gravure est absente du bloc d'héritage ; elle n'existe que dans ce bâtiment).

**Champs dérivés**
- **resume** : Les écuries de la foire, bâtiment de bois aux boxes vides, où le foin sent bon et où les selles attendent leurs cavaliers.
- **accroche** : Au sud-est de la place, un portail de bois ouvert sur une cour de terre et une odeur de foin.
- **visuel** : Un bâtiment de bois long et bas, avec cinq boxes de chaque côté d'une allée de terre battue et des selles posées sur des tréteaux près de la porte. Au fond, le troisième box a une claie couverte de noms gravés, et du foin s'entasse dans le box le plus grand. La lumière du jour entre par le portail ouvert, et une lanterne de papier ocre pend à un poteau.
- **ambiance** : Foin, planches qui craquent, poussière dorée
- **arrivee** : Le portail de bois s'ouvre sur une allée de terre battue, et l'air sent le foin sec et l'huile de graissage. Cinq boxes s'alignent de chaque côté, leurs claies de chêne clair patinées par les mains. Les mangeoires sont vides, mais le foin s'entasse en tas doux dans le box le plus grand, au fond. Des selles reposent sur des tréteaux près de l'entrée, leurs courroies de toile raides de poussière. Une lucarne laisse entrer une lumière poussiéreuse qui tombe en bandes dorées sur la terre. Le troisième box, seul, a une claie couverte de noms gravés au couteau, des noms de chevaux, certains si anciens qu'on ne les lit plus. Quelque part au fond, une goutte d'eau tombe de la toiture, à intervalles réguliers. Le bois des planches a gonflé avec l'humidité de la rivière, et les portes grincent au moindre souffle.
- **description** : Bâtiment de bois long de quinze pas sur six, allée de terre battue, cinq boxes de chaque côté et un grenier à foin au-dessus. Les boxes sont vides, et les selles reposent sur des tréteaux près de la porte. Le foin s'entasse dans le box du fond, où la cache de 10 po se trouve pour qui fouille (Perception DD 12). Au-dessus de l'allée, près de la porte du grenier, un filet est suspendu : il se cherche (Perception), et qui passe sans le voir doit faire une sauvegarde de Dextérité DD 10 ; l'échec coûte une demi-heure, sans dégât. À la mangeoire du troisième box pend un bout de corde noué d'un nœud de funambule (examen). La claie du troisième box porte des noms de chevaux gravés au couteau.

#### Niveau 2 : `ver-pont-des-marchands` (Le Pont-des-Marchands, lieu-dit), dans `verdelle`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : pont de trois arches, une quarantaine de pas de long et quatre de large ; piles de pierre claire plongées dans la rivière ; ponton de chêne au pied de la pile sud.
- **Matériaux et état** : pierre claire des piles, lisse et couverte de vase à la base ; parapet usé à hauteur de main, marqué de petites entailles ; planches de chêne du ponton, humides ; cordes amarrées à des anneaux de fer.
- **Lumière** (origine, couleur, force, ombres) : lumière de la brume qui se lève sur l'eau, pâle puis dorée ; reflets qui glissent sous les arches ; ombre marquée sous les arches et au pied des piles.
- **Sons** : eau contre les piles, cordages qui grincent, cri de batelier étouffé sous les arches.
- **Odeurs** : vase, cordage, pain venu de la place.
- **Température** : fraîche, plus froide au ras de l'eau.
- **Éléments remarquables** (chacun avec sa place) :
  - les marques de crue : des encoches creusées dans la pile nord (examen).
  - le ponton des bateliers, au pied de la pile sud, avec une caisse de bateliers sous une bâche.
  - l'avis aux bateliers, délavé, cloué au parapet.
  - une ancre de pierre percée d'un anneau, posée contre la pile sud.
  - les traces de boue de rive sur les marches du ponton ; un sentier piétiné part vers l'aval.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `verdelle` : description : Du pont, la place se voit en contrebas, au-dessus des toits : la fontaine, la corde tendue et les toiles rouges. ; retour : Au sud, une rue en pente descend vers le Pont-des-Marchands, un pont de pierre claire dont les piles plongent dans la rivière.
  - vers `ver-marche` : description : Une ruelle de pierre claire remonte du ponton vers le marché, bordée de caisses et de cordages. ; retour : La ruelle du marché descend vers le pont, entre les étals ; le bruit de la rivière remonte sous les toiles.
  - vers `pon-camp` (Le camp des forains, hors de cette fiche ; 30 minutes) : description : Un sentier piétiné quitte le ponton et longe la rive vers l'aval, entre les saules, jusqu'au Pont-Cassé. ; retour : Le sentier remonte la rive en longeant les saules, jusqu'au ponton des bateliers et ses marques de crue.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | trésor | caisse de bateliers : 5 po (contenant) | ponton, sous une bâche | à créer | fouille |
  | objet | marques de crue (examen) | pile nord | à créer | examen |
  | objet | avis aux bateliers (examen) | parapet | à créer | examen |
  | objet | indice (secret du lieu) : traces de boue de rive sur les marches du ponton, et sentier piétiné vers le Pont-Cassé | marches du ponton | à créer | examen |

  Cas limite : si le groupe tombe à l'eau, une demi-heure pour se sécher (effet `temps`).

- **Avant / après** : aucun changement prévu par le canon.
- **Un détail propre à ce lieu** : une ancre de pierre percée d'un anneau, posée contre la pile sud, que les bateliers n'utilisent plus (la pierre sert ici d'ancre, ce qui n'existe nulle part ailleurs dans le bourg).

**Champs dérivés**
- **resume** : Le Pont-des-Marchands, pont de pierre claire à trois arches, où la rivière passe lentement et où les bateliers amarrent leurs barques.
- **accroche** : Au sud de la place, un pont de pierre claire enjambe la rivière ; ses piles plongent dans une eau lente et brune.
- **visuel** : Un pont de pierre claire à trois arches, dont les piles plongent dans une eau calme et brune, avec des marques de crue creusées dans la pile nord. Un ponton de planches de chêne descend au pied de la pile sud, où des cordes et une caisse de bateliers attendent sous une bâche. La lumière de la brume se lève sur l'eau, et des reflets dorés glissent sous les arches.
- **ambiance** : Eau lente, pierre claire, cordages, brume
- **arrivee** : Le pont de pierre claire s'avance au-dessus de l'eau, trois arches rondes qui se reflètent dans une rivière si calme qu'elle semble immobile. La brume du matin traîne encore sur l'eau, et les piles plongent dans un courant lent, brun et doux. Le long du parapet, la pierre est usée à hauteur de main, lisse, marquée de petites entailles. Plus bas, un ponton de planches de chêne descend au pied de la pile sud, où des cordes sont amarrées à des anneaux, et une caisse de bois attend sous une bâche. Une odeur de vase et de cordage monte de la rive, mêlée à celle du pain qui vient de la place. Un cri de batelier s'élève et se perd sous les arches. Sur le parapet, un avis aux bateliers, délavé, tient encore par un clou.
- **description** : Pont de trois arches, une quarantaine de pas de long, piles de pierre claire plongées dans une eau calme et brune. Des encoches creusées dans la pile nord en marquent les crues. Un ponton de chêne descend au pied de la pile sud ; une caisse de bateliers y est rangée sous une bâche (5 po). Un avis aux bateliers, délavé, est cloué au parapet et ne se lit plus qu'en partie. Des traces de boue de rive couvrent les marches du ponton, et un sentier piétiné part vers l'aval, en direction du Pont-Cassé. Une ancre de pierre percée d'un anneau est posée contre la pile sud. Si le groupe tombe à l'eau, il lui faut une demi-heure pour se sécher.

---

## V5 : Le moulin, fiche de niveau 1 et fiches détaillées des 4 pièces — *Validé par l'utilisateur le 20/11/2026 (gelé)*

Rédigées par un agent Haiku, relues par Claude, vérifiées (Haiku, lecture seule), corrigées (retrait des faux indices : craie comptée, peinture fraîche, théorie de l'ornière ; une seule position pour la trappe). Décisions validées : la **cale** de la trappe est posée **côté grenier** par Tobie, qui est reparti par la petite trappe à grain du pignon ouest avec sa corde ; la trappe se force une fois Rouquin réglé (jet à fixer en V6) ; l'« atelier » de la cour est un appentis sans fiche de pièce ; le jet de la caisse de matériel est à fixer en V6.

### Niveau 1 : `moulin` (Le moulin, site de quête 1, lieu-vitrine de l'épisode)

### Héritage (recopié du niveau 0 de `LIEUX.md`, ne pas modifier)
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

### Nuances propres au moulin
- Loin de la foire, le moulin est **plus gris que doré** : bois de chêne vieilli et mouillé, pierre des meules, **farine fine déposée sur toutes les surfaces**. Ni toile rayée ni lanternes en place ici : la guirlande de la foire n'arrive pas jusqu'au moulin, fermé ; le bruit de l'eau couvre tout. Matières secondaires admises : le **fer** (cerclages, arbre de roue, crochets), le **cuivre** (petits ustensiles), la **corde** de chanvre.

### Plan vu de dessus
- **Forme générale** : un moulin à eau de pierre et de chêne, adossé à un bras de la Verdelle ; la roue à aubes, immobile, est sur le flanc est du bâtiment ; devant, au sud-ouest, une cour de terre battue ; plus bas, le pont de bois vermoulu qui enjambe le bras de rivière.
- **Limites** : la rivière à l'est, des haies de noisetiers et des champs au sud-ouest, des collines basses au nord.
- **Orientation** : le nord en haut.
- **Voies d'accès** : la **route du Pont-du-Meunier**, qui part de Verdelle au nord-est (une heure de marche) et arrive au pont de bois ; ensuite le pont mène à la cour, la cour à la salle des meules, et un escalier mène de la salle au grenier. Pas d'autre route.
- **Éléments naturels** : le bras de rivière rapide sous la roue, quelques saules, des haies de noisetiers.
- **Quartiers** : trois lieux de plain-pied (le pont, la cour, la salle des meules) et un grenier au-dessus de la salle.

### Points à visiter (enfants directs de `moulin`, sans position : pas de carte illustrée)
`mou-pont-du-meunier` (lieu-dit) · `mou-cour` (lieu-dit) · `mou-salle-des-meules` (salle). Sous-lieu : `mou-grenier` (salle, enfant de `mou-salle-des-meules`).

### Histoire et état actuel
- Le moulin moud le grain du bourg depuis plus d'un siècle ; pendant la foire, il tourne jour et nuit. Cette année, il est **fermé « pour réparations »** : une barrière est tirée en travers du pont de bois, et la roue ne tourne pas.

### Le jour, la nuit, le mauvais temps
- **Jour** : lumière grise et dorée par éclats, eau qui gronde, farine qui poudre l'air dans les rayons. **Nuit** : noir presque total, l'eau seule s'entend, une lueur de braise aux fenêtres de la salle. **Mauvais temps** : la roue grince et le bras de rivière monte, la boue colle à la cour.

### Ce que le joueur voit en arrivant
- Au bout de la route, un moulin de pierre et de chêne à la roue immobile, une barrière tirée en travers du pont, un écriteau « Fermé pour réparations » et la fumée mince d'un feu quelque part derrière le bâtiment. Il ne voit pas ce que le moulin garde (voir « Secret du MJ »).

### Secret du MJ (jamais dans un texte lu par le joueur)
- Rouquin Lamefine, chef de bande, tient le moulin avec quatre hommes de main pour le compte de quelqu'un de la ville : ils cherchent la clé volée. Sa bande a fouillé la cour et la salle ; la trappe du grenier est coincée par une cale posée depuis le grenier. La clé du coffre de la foire est glissée dans une fente de la poutre maîtresse du grenier, nouée d'un nœud de funambule. L'homme de main du pont parle si on le paie ou le bat. Détails de V4 : `LIEUX.md`.

---

### Fiches détaillées (niveaux 2 et 3)
(Chaque fiche sous ce titre, dans l'ordre : `mou-pont-du-meunier`, `mou-cour`, `mou-salle-des-meules`, puis `mou-grenier` sous la salle des meules.)

#### Niveau 2 : `mou-pont-du-meunier` (Le Pont-du-Meunier, lieu-dit), dans `moulin`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : pont de bois à trois travées, une douzaine de pas de long et cinq de large, posé sur deux piles de pierre claire. La route arrive par le nord-est ; la cour s'ouvre de l'autre côté, par une pente de terre.
- **Matériaux et état** : planches de chêne gris, gorgées d'eau, vermoulues au milieu de la travée centrale où deux planches manquent ; garde-corps de fer rouillé ; piles verdies à la base ; cordes de chanvre de la barrière, effilochées.
- **Lumière** (origine, couleur, force, ombres) : lumière grise du ciel, filtrée par la brume, sans source précise ; pas de lampe, pas d'ombre nette ; sous le pont, l'eau reflète un jour pâle.
- **Sons** : eau qui se brise contre les piles, forte et continue ; planches qui craquent sous les pas ; une corde de barrière qui grince au vent.
- **Odeurs** : bois pourri, eau froide, farine humide venue du moulin.
- **Température** : fraîche et humide, plus froide au-dessus de l'eau.
- **Éléments remarquables** (chacun avec sa place) :
  - la barrière de bois tirée en travers de l'entrée côté route, sur deux poteaux de chêne ; son écriteau « Fermé pour réparations » est cloué à la traverse.
  - le tonneau couché en guise de table, au milieu de la travée centrale.
  - la guérite de planches, au bout du pont côté cour, contre le garde-corps est.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `verdelle` : description : La route descend des collines vers le bourg, entre les haies ; de là-haut, on aperçoit les toits rouges de Verdelle et la fumée des cheminées. ; retour : Par le nord-est, une route de terre quitte le bourg entre deux haies de noisetiers et file vers les collines.
  - vers `mou-cour` : description : De l'autre côté du pont, une pente de terre monte vers une cour où une roue de chêne reste immobile au-dessus de l'eau. ; retour : Du haut de la pente, le pont se voit en contrebas : la barrière, les planches sombres et le bruit de la rivière.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | l'homme de main du pont, **l'un des quatre** de la rencontre (la rencontre compte 3 × `bandit` et lui, profil `bandit`) : garde l'accès au pont, quatre sujets ; le groupe peut lui parler | guérite de planches, au bout côté cour | homme-de-main-du-pont | conversation |
  | monstre | quatre hommes de main (4 × `bandit`, 100 PX, faible) : négocier (Persuasion DD 12), payer (20 po, condition : avoir 20 po), ou combattre | le pont entier, la travée centrale | r-hommes-de-main | combat / négociation |
  | trésor | bourse commune de 10 po, gardée par la rencontre | sous le tonneau-table | à créer | — (gardée par la rencontre) |

- **Avant / après** : aucun changement prévu par le canon sur le pont.
- **Un détail propre à ce lieu** : l'écriteau « Fermé pour réparations » est peint en grandes lettres inégales, que les clous qui le fixent ont déjà rouillées (l'écriteau n'existe que sur ce pont).
- **Intérieur** : aucun ; lieu-dit de plain-pied.

**Champs dérivés**
- **resume** : Le pont de bois du moulin, vermoulu et barré d'une barrière, au-dessus d'un bras de rivière.
- **accroche** : Au bout de la route, une barrière tirée en travers d'un pont de bois vermoulu, au-dessus d'une eau qui gronde.
- **visuel** : Un pont de bois à trois travées, aux planches gris sombre gorgées d'eau, franchit un bras de rivière entre deux piles de pierre claire verdie. Côté route, une barrière de bois barre l'entrée, son écriteau « Fermé pour réparations » cloué à la traverse ; au milieu du pont, un tonneau couché sert de table, et une guérite de planches se dresse au bout, côté cour. La lumière grise du ciel, filtrée par la brume, tombe sans source précise, et l'eau brune se brise contre les piles.
- **ambiance** : Pont qui craque, eau qui gronde
- **arrivee** : La route débouche au bord d'un bras de rivière, et la première chose qu'on voit, c'est la barrière : un assemblage de planches tiré en travers de l'entrée du pont, sur deux poteaux de chêne. Un écriteau y est cloué, peint en grandes lettres inégales. Le pont de bois s'étire ensuite au-dessus de l'eau, en trois travées gris sombre, gorgées de pluie. Au milieu, les planches cèdent par endroits sous le pied, et il faut regarder où l'on pose ses bottes. L'eau gronde contre les piles de pierre claire, verdies à la base, et l'air sent le bois qui pourrit et la farine humide venue de l'autre rive. La brume traîne encore sur les berges, et la lumière tombe pâle, sans ombres nettes. De l'autre côté, une pente de terre monte vers le moulin, dont on ne voit pour l'instant qu'un pan de mur de pierre et une fumée mince.
- **description** : Pont de bois à trois travées, une douzaine de pas de long, posé sur deux piles de pierre claire verdie. La travée centrale est vermoulue : deux planches y manquent, et l'eau brune se voit entre les lattes. Côté route, une barrière de chêne tirée en travers porte l'écriteau « Fermé pour réparations ». Un tonneau couché, au milieu du pont, sert de table ; dessous, une bourse de 10 po, gardée par la rencontre. Quatre hommes de main (`r-hommes-de-main`, 100 PX, faibles) tiennent le pont : ils se laissent négocier (Persuasion DD 12), payer (20 po, si le groupe a cette somme), ou combattre. Au bout côté cour, une guérite de planches abrite l'un des quatre hommes de main, l'homme de main du pont (`homme-de-main-du-pont`, PNJ sans nom propre, au moins 4 sujets). Côté cour, une pente de terre monte vers le moulin.

#### Niveau 2 : `mou-cour` (La cour du moulin, lieu-dit), dans `moulin`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : cour de terre battue d'une vingtaine de pas sur quinze, fermée au nord par le mur de pierre du moulin et au sud-ouest par une haie de noisetiers ; la roue à aubes occupe le côté est, face au bras de rivière.
- **Matériaux et état** : terre battue détrempée en flaques, lisse là où l'on a beaucoup marché ; pierre du mur couverte d'une poudre blanche ; roue de chêne aux aubes pourries par endroits, cerclages de fer rouillés, arbre de roue immobile ; sacs de toile empilés contre le mur nord ; porte basse de l'atelier, au mur ouest, dont le bois est frais aux éclats.
- **Lumière** (origine, couleur, force, ombres) : jour gris du ciel, sans soleil direct ; le mur nord assombrit le matin la moitié de la cour, sans ombre nette ; pas de lampe.
- **Sons** : eau qui passe sous les aubes sans les faire tourner, bâche qui claque faiblement, bras de rivière derrière la haie.
- **Odeurs** : farine, bois mouillé, graisse de roue.
- **Température** : fraîche et humide ; plus froide sous la roue et près de l'eau.
- **Éléments remarquables** (chacun avec sa place) :
  - la roue à aubes de chêne, dans l'angle est, son arbre posé sur deux paliers au-dessus de l'eau.
  - trois rangs de sacs de toile, empilés contre le mur nord, à gauche de la porte du moulin.
  - la porte du moulin, au centre du mur nord, de chêne clair, avec une marche de pierre usée.
  - la porte basse de l'atelier, au mur ouest, sa serrure forcée à hauteur de main.
  - la caisse de matériel du meunier, sous l'auvent de l'atelier, contre le mur ouest.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `mou-pont-du-meunier` : description : Du haut de la pente, le pont se voit en contrebas : la barrière, les planches sombres et le bruit de la rivière. ; retour : De l'autre côté du pont, une pente de terre monte vers une cour où une roue de chêne reste immobile au-dessus de l'eau.
  - vers `mou-salle-des-meules` : description : Au centre du mur nord, une porte de chêne clair s'ouvre sur une marche de pierre usée ; une odeur de braise sort de l'ouverture. ; retour : De la salle, la porte ouvre sur la cour : la roue, les sacs pâles de farine et le ciel gris.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | trésor | caisse de matériel du meunier : 5 po, gardée par rien (contenant) | sous l'auvent de l'atelier | à créer | — (à fixer en V6) |
  | objet | examens : la serrure forcée (de l'extérieur, il y a peu) et les traces de charrette et de bottes dans la boue | porte de l'atelier ; sol boueux devant la roue | à créer | examen |

- **Avant / après** : aucun changement prévu par le canon sur la cour.
- **Un détail propre à ce lieu** : devant la roue, le sol porte une ornière en demi-cercle, creusée là où l'arbre de roue tournait autrefois ; (une simple trace d'un ancien passage de charrette).
- **Intérieur** : aucun. L'« atelier » est un appentis d'un pas de profondeur adossé au mur ouest : sa porte basse, forcée, ne cache qu'un établi nu ; il n'a pas de fiche de pièce (à valider).

**Champs dérivés**
- **resume** : La cour de terre battue du moulin, devant la roue immobile et les sacs de farine.
- **accroche** : Côté est, une roue de chêne immobile dépasse du mur de pierre, et une odeur de farine flotte sur la cour de terre battue.
- **visuel** : Une cour de terre battue, détrempée en flaques, fermée au nord par le mur de pierre du moulin. La roue à aubes de chêne, immobile, domine l'angle est, son arbre posé sur deux paliers ; contre le mur nord, trois rangs de sacs de toile dressent une haie pâle de farine. La lumière grise du ciel tombe ouverte sur la cour, et l'eau passe sous la roue sans la faire tourner.
- **ambiance** : Roue immobile, eau sous les aubes
- **arrivee** : La pente de terre vous amène au bord de la cour, où la boue colle aux semelles et chaque flaque reflète le ciel gris. Le mur de pierre du moulin ferme la cour au nord, couvert d'une poudre blanche qui se pose aussi sur vos manches. À l'est, une roue de chêne est arrêtée au-dessus de l'eau : ses aubes pourries pendent, et l'eau passe dessous sans la faire tourner, avec un bruit lourd et continu. Contre le mur, trois rangs de sacs de toile dressent une haie pâle, et la farine y est si fine qu'elle s'envole au moindre souffle. Personne ne parle, aucun outil ne résonne, seules les gouttes des gouttières et le vent dans les noisetiers rompent le silence. Il fait frais, et l'odeur de bois mouillé se mêle à celle de la farine. Au mur ouest, une porte basse d'atelier attend, son bois clair marqué d'éclats frais.
- **description** : Cour de terre battue, fermée au nord par le mur du moulin. La roue à aubes, immobile, occupe l'angle est, et l'eau passe dessous sans la faire tourner. Trois rangs de sacs empilés contre le mur nord ; la porte du moulin, au centre, ouvre sur une marche usée. La porte basse de l'atelier, au mur ouest, a sa serrure forcée : bois frais aux éclats. Examinée de près, la serrure, comme la boue, montre des traces de charrette et de nombreuses bottes : une bande a passé ici. Sous l'auvent de l'atelier, une caisse de matériel du meunier contient 5 po. Devant la roue, une ornière en demi-cercle marque l'ancien tour de l'arbre. L'accès depuis le pont suppose la route ouverte (quête principale active).

#### Niveau 2 : `mou-salle-des-meules` (La salle des meules, salle), dans `moulin`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : salle de quatorze pas sur neuf, plafond de poutres basses à hauteur de tête ; les deux meules occupent le centre, dans un bâti de chêne. La porte de la cour est dans le mur sud, l'escalier du grenier au fond, contre le mur ouest.
- **Matériaux et état** : pierre des meules grise, rainée et poudrée de farine ; bâti et poutres de chêne noirci, enduits de farine ; trémie de bois vermoulu au-dessus des meules ; cerclages de fer rouillés ; lit de camp en planches ; sol de planches larges, couvert de farine tassée.
- **Lumière** (origine, couleur, force, ombres) : jour gris par une fenêtre étroite dans le mur est, qui s'arrête à mi-hauteur ; près des meules, un trépied de fer porte des braises qui donnent une lueur rouge ; ombres profondes sous les poutres et derrière les meules.
- **Sons** : eau qui gronde sous le plancher, à travers les jointures ; braises qui craquent ; silence des meules, qui ne tournent plus.
- **Odeurs** : farine sèche, braise, graisse de roue, bois ancien.
- **Température** : froide près de la fenêtre et du mur est, plus chaude près du trépied.
- **Éléments remarquables** (chacun avec sa place) :
  - les deux meules de pierre grise, au centre, dans un bâti de chêne ; la meule du dessus repose sur son axe de fer.
  - la trémie de bois, au-dessus des meules, vide, son auge couverte de farine.
  - l'escalier du grenier, de bois raide, au fond contre le mur ouest, qui monte vers une trappe au plafond.
  - le lit de camp en planches, contre le mur est, couvert d'une laine brune.
  - le trépied de fer à braises, près des meules, côté sud.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `mou-cour` : description : De la salle, la porte ouvre sur la cour : la roue, les sacs pâles de farine et le ciel gris. ; retour : Au centre du mur nord, une porte de chêne clair s'ouvre sur une marche de pierre usée ; une odeur de braise sort de l'ouverture.
  - vers `mou-grenier` : description : Au fond, contre le mur ouest, un escalier de bois raide monte vers une trappe au plafond, que rien ne soulève quand on la pousse. ; retour : Contre le mur ouest, une trappe de planches au ras du sol ouvre sur un escalier qui descend vers la salle ; une odeur de braise monte par l'ouverture.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | Rouquin Lamefine, chef de bande : au moins 4 sujets ; il attend, assis sur le lit de camp, et ne dit que ce qu'il veut dire | lit de camp, mur est | rouquin-lamefine | conversation |
  | monstre | `r-rouquin-au-moulin` : un chef de bande (`chef-de-bande`, 450 PX, modérée) : combat ; négocier (Persuasion DD 11) ou acheter (60 po) **seulement avec l'objet « reconnaissance de dette »** ; sans lui, il refuse | au centre, près des meules | r-rouquin-au-moulin | combat / négociation |
  | trésor | coffre de campement : verrou DD 12, 20 po | au pied du lit de camp | à créer | crochetage (DD 12) |
  | trésor | dépouilles : table de butin commune du palier 1, remise après le combat | au sol, devant les meules | à créer | — (butin du combat) |
  | obstacle | la trappe du grenier, coincée de l'autre côté par une cale de bois posée depuis le grenier : elle se force une fois Rouquin réglé (lien conditionné par `rencontre` ; jet de force du lien à fixer en V6) | sous la trappe, au sommet de l'escalier | à créer | — (à fixer en V6) |

- **Avant / après** : après « Rouquin réglé » (rencontre `r-rouquin-au-moulin` vaincue, convaincue ou achetée), le lien vers le grenier s'ouvre (lien conditionné, V4) ; la trappe reste coincée, il faut la forcer (à fixer en V6).
- **Un détail propre à ce lieu** : les deux meules ont des rainures de largeurs différentes, l'une fine pour la farine, l'autre large pour le gruau, et la pierre de la plus large est polie en cuvette par un siècle de grain (aucune autre pièce du moulin n'a de pierre de meule).
- **Intérieur** (ce point contient une autre pièce) :
  - plan intérieur : une seule salle de plain-pied ; les meules au centre, le lit de camp et son coffre à l'est, le trépied près des meules, l'escalier au fond à l'ouest.
  - sous-lieux (chacun aura sa fiche « Niveau 3 ») :

    | id | nom | type | fonction dramatique | position | ce qui l'annonce depuis ce lieu | voisins directs |
    | --- | --- | --- | --- | --- | --- | --- |
    | `mou-grenier` | Le grenier du moulin | salle | secret (objet de quête caché, traces de corde) | — (au-dessus de la salle) | l'escalier de bois raide au fond, sa trappe au plafond, qui ne bouge pas quand on la pousse | `mou-salle-des-meules` |

**Champs dérivés**
- **resume** : La salle des meules du moulin, basse et grise de farine, où les pierres ne tournent plus.
- **accroche** : Au centre du mur du moulin, une porte de chêne clair ; par ses jointures filtre une lueur rouge de braise.
- **visuel** : Une salle basse aux poutres poudrées de farine, dominée par deux meules de pierre grise dans un bâti de chêne. Un escalier de bois raide monte au fond, contre le mur ouest, vers une trappe au plafond, et un lit de camp couvert de laine brune occupe le mur est. Une fenêtre étroite laisse entrer un jour gris, tandis qu'un trépied de fer chauffe des braises rouges près des meules.
- **ambiance** : Farine, braises, meules muettes
- **arrivee** : La porte de la cour s'ouvre sur une marche usée, et la chaleur des braises vous monte au visage avant que vos yeux s'habituent à la pénombre. La salle est basse, et ses poutres sont poudrées de farine comme si l'on avait neigé dessus. Au centre, deux meules de pierre grise se dressent dans un bâti de chêne noirci, immobiles, leurs rainures pleines d'une poussière blanche. Un trépied de fer porte des braises qui craquent et teintent les murs d'un rouge sourd. Un homme est assis sur un lit de camp en planches, couvert d'une laine brune ; il lève la tête, puis la rebaisse sans se lever. Une fenêtre étroite, à l'est, laisse entrer un jour gris qui s'arrête à mi-hauteur. Au fond, un escalier de bois raide se perd dans l'ombre. Sous le plancher, l'eau de la rivière gronde à travers les jointures, et l'air sent la farine sèche, la braise et le bois ancien.
- **description** : Salle basse de quatorze pas sur neuf, poutres poudrées de farine. Les deux meules occupent le centre, immobiles ; la meule du dessus repose sur son axe de fer. Au fond, contre le mur ouest, l'escalier du grenier monte vers une trappe que rien ne soulève quand on la pousse (une cale la coince de l'autre côté, depuis le grenier : voir « Avant / après »). Rouquin Lamefine (`rouquin-lamefine`, profil `chef-de-bande`, au moins 4 sujets) est assis sur le lit de camp, contre le mur est, et attend. La rencontre (`r-rouquin-au-moulin`, 450 PX, modérée) se règle par le combat ; une négociation (Persuasion DD 11) ou un achat (60 po) n'est possible qu'avec l'objet « reconnaissance de dette ». Sans lui, il refuse. Au pied du lit, un coffre de campement cerclé de fer est verrouillé (DD 12) et contient 20 po. Les dépouilles, après le combat, forment la table de butin commune du palier 1.
#### Niveau 3 : `mou-grenier` (Le grenier du moulin, salle), dans `mou-salle-des-meules`

**Héritage** (recopié du niveau 1 via le niveau 2, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : grenier sous les toits, neuf pas sur sept, plafond incliné des deux côtés d'un faîtage qui ne dépasse pas la hauteur d'un homme au centre. La trappe, au ras du sol, s'ouvre sur l'escalier de la salle en contrebas.
- **Matériaux et état** : poutre maîtresse de chêne noir, au faîte, de l'est à l'ouest ; planches du plancher larges et fendues, poudrées de farine ; tuiles vieilles, percées dans le pan nord ; sacs de toile vides, pliés ; air sec sous les tuiles.
- **Lumière** (origine, couleur, force, ombres) : jour gris qui tombe par les tuiles percées du pan nord et par une petite trappe à grain dans le pignon ouest ; pas de lampe ; ombres sous le faîte et dans les angles.
- **Sons** : pluie sur les tuiles, charpente qui grince au vent, bruit de la salle qui monte par la trappe.
- **Odeurs** : poussière de grain sec, bois vieux, farine.
- **Température** : plus froide qu'en bas, un courant d'air frais par la trappe à grain.
- **Éléments remarquables** (chacun avec sa place) :
  - la poutre maîtresse, au faîte, noircie par les années, de l'est à l'ouest.
  - la trappe à grain, petite ouverture carrée dans le pignon ouest, à hauteur de tête.
  - la trappe de planches, contre le mur ouest, au ras du sol, d'où monte l'odeur de braise ; une cale de bois la coince de ce côté-ci (côté grenier).
  - les sacs de toile vides, pliés en pile contre le pignon est.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `mou-salle-des-meules` : description : Contre le mur ouest, une trappe de planches au ras du sol ouvre sur un escalier qui descend vers la salle ; une odeur de braise monte par l'ouverture. ; retour : Au fond, contre le mur ouest, un escalier de bois raide monte vers une trappe au plafond, que rien ne soulève quand on la pousse.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | objet (objet de quête) | la clé du coffre de la foire, glissée dans une fente de la poutre, nouée d'un nœud de funambule ; cache : Investigation DD 14, DD 10 après examen de la poutre | fente de la poutre maîtresse | cle-du-coffre-de-la-foire | Investigation DD 14 (DD 10 après examen de la poutre) |
  | objet | examen de la poutre : traces de corde, à hauteur de main | poutre maîtresse | à créer | examen |

- **Avant / après** : aucun changement prévu par le canon ; l'accès à ce grenier est conditionné par « Rouquin réglé » (lien, V4). **Explication retenue** (à valider) : en cachant la clé, Tobie a posé la cale sous la trappe depuis l'intérieur, puis il est reparti par la petite trappe à grain du pignon ouest, avec sa corde de funambule : c'est pourquoi la bande n'est jamais montée et pourquoi la poutre porte des traces de corde.
- **Un détail propre à ce lieu** : une tache sombre sur les planches, à l'aplomb d'une tuile percée, où l'eau goutte à intervalles réguliers, à côté de la trappe (la pluie seule ; rien d'autre dans la pièce ne coule).
- **Intérieur** : aucun (grenier, dernière pièce de la chaîne).

**Champs dérivés**
- **resume** : Le grenier du moulin, sous les toits, où la poussière de grain se pose sur une poutre maîtresse.
- **accroche** : Au fond de la salle, un escalier de bois monte vers une trappe au plafond ; un courant d'air sec et une odeur de grain descendent par la fente.
- **visuel** : Un grenier bas sous les toits, aux planches fendues et poudrées de farine, où deux pans de tuiles se rejoignent sur une poutre maîtresse de chêne noir. Une trappe carrée, au ras du sol, s'ouvre contre le mur ouest sur la salle en contrebas, et des sacs de toile vides sont pliés contre le pignon est. Un jour gris tombe par une petite ouverture dans le pignon ouest et par les tuiles percées du pan nord.
- **ambiance** : Pluie sur les tuiles, poussière de grain
- **arrivee** : La trappe ouvre sur une pénombre qui sent la poussière de grain sec. Le plafond descend de part et d'autre d'un faîtage si bas qu'il faut se courber au centre. Une poutre maîtresse de chêne noir traverse le grenier d'est en ouest, à hauteur d'épaule, et des planches fendues plient un peu sous le pied. La pluie tambourine sur les tuiles, d'un bruit régulier et proche. Des tuiles sont percées sur le pan nord, et un jour gris y tombe en filets pâles qui se posent sur la poussière en suspension. Au pignon ouest, une petite ouverture carrée laisse passer un courant d'air frais. Contre le pignon est, des sacs de toile vides sont pliés en carré. Au centre, une tache sombre sur le plancher goutte à intervalles réguliers. Par la trappe monte le bruit de la salle : un cliquetis de braises, le souffle du feu, l'eau sous le plancher. Tout ici est gris, poussiéreux et silencieux, sauf la goutte.
- **description** : Grenier bas sous les toits, neuf pas sur sept, avec un faîtage central. La poutre maîtresse, de chêne noir, court d'est en ouest ; l'examen de sa surface montre des traces de corde, à hauteur de main. Dans une fente de cette poutre, la clé du coffre de la foire est glissée, nouée d'un nœud de funambule : cache à trouver par la fouille (Investigation DD 14, ou DD 10 après examen de la poutre). Les sacs vides sont pliés contre le pignon est. La petite trappe à grain du pignon ouest, trop étroite pour qu'un groupe l'emprunte et donnant sur le vide au-dessus de la roue, laisse passer le jour et le vent. Contre le mur ouest, la trappe de planches donne sur la salle des meules ; l'odeur de braise y monte. La tuile percée du pan nord fait goutter l'eau de pluie sur le plancher, près de la trappe.

---

## V5 : Le Pont-Cassé, fiche de niveau 1 et fiches détaillées des 2 pièces — *Validé par l'utilisateur le 20/11/2026 (gelé)*

Rédigées par un agent Haiku, relues par Claude (sans vérificateur indépendant pour cette zone), corrigées (retrait de deux faux indices : crans du poteau, étoile repeinte). Décision validée : Mathilde Pot-de-Miel est présente au camp le jour, avec ses sujets du marché (aucun nouveau sujet).

### Niveau 1 : `pont-casse` (Le Pont-Cassé, site de quête 2)

### Héritage (recopié du niveau 0 de `LIEUX.md`, ne pas modifier)
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

### Nuances propres au Pont-Cassé
- C'est le coin des **forains** : les roulottes sont **peintes de couleurs franches** (bleu rivière, ocre, vert mousse, rouge brique) et portent des toiles rayées ; des cordes, des perches et des anneaux de bois sèchent partout ; on y entend plus de musique et de rires qu'au village. Le pont de pierre claire, lui, est **brisé** : deux de ses arches sont tombées dans la rivière. Matières secondaires admises : le **fer** (cerclages des roues, crochets), le **chanvre** (cordes de funambule), la **cire** (bougies de roulotte).

### Plan vu de dessus
- **Forme générale** : sur la rive sud-ouest de la Verdelle, un camp de cinq roulottes disposées en demi-cercle autour d'un feu, face à la rivière ; à droite, au pied du pont brisé, une corde de funambule tendue entre deux poteaux ; la roulotte de Mère Pivoine, plus vieille et plus petite, est un peu à l'écart contre la berge.
- **Limites** : la rivière au nord-est, des saules et des champs en friche au sud-ouest, le pont brisé à l'est.
- **Orientation** : le nord en haut.
- **Voies d'accès** : le **sentier de rive** qui part du Pont-des-Marchands (une demi-heure de marche) ; pas d'autre route (le pont ne mène plus nulle part).
- **Éléments naturels** : la rivière lente, des saules, les piles du pont dressées dans l'eau.
- **Quartiers** : le camp (le feu, les roulottes, la corde) et, à l'écart, la roulotte de Mère Pivoine.

### Points à visiter (enfants de `pont-casse`, sans position : pas de carte illustrée)
`pon-camp` (camp). Sous-lieu : `pon-roulotte` (salle, enfant de `pon-camp`).

### Histoire et état actuel
- Les forains campent là chaque automne depuis l'effondrement du pont : la ville leur laisse la rive. Ils sont la veille de la foire : les roulottes sont peintes de frais, les répétitions de la troupe ont lieu au pied du pont brisé, et le camp est un peu plus silencieux que d'habitude.

### Le jour, la nuit, le mauvais temps
- **Jour** : couleurs vives sous la lumière dorée, linge qui sèche, musique et cris d'enfants au loin. **Nuit** : le feu de camp, des bougies aux fenêtres des roulottes, une guitare. **Mauvais temps** : les bâches claquent, les roulottes se serrent, la rive devient boueuse.

### Ce que le joueur voit en arrivant
- Au bout du sentier de rive : un demi-cercle de roulottes peintes autour d'un feu, une corde tendue entre deux poteaux, et plus loin le pont de pierre claire dont deux arches sont tombées dans l'eau. Il ne voit pas ce que le camp garde (voir « Secret du MJ »).

### Secret du MJ (jamais dans un texte lu par le joueur)
- Tobie Pivoine se cache dans la roulotte de sa mère, derrière une bâche ; il a volé la clé de la foire pour payer sa dette à Gédéon Marchebise (détails : `LIEUX.md`, V4). Mère Pivoine attend le colis de Brun. Les forains parlent de Tobie comme « d'un des leurs ».

---

### Fiches détaillées (niveaux 2 et 3)
(Chaque fiche sous ce titre, dans l'ordre : `pon-camp`, puis `pon-roulotte` juste dessous.)

#### Niveau 2 : `pon-camp` (Le camp des forains, camp), dans `pont-casse`

**Héritage** (recopié du niveau 1, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : clairière de terre battue, une quarantaine de pas de long sur vingt de large, au pied des piles du pont brisé. Au centre, un feu de camp ; cinq roulottes en demi-cercle au nord du feu, portes tournées vers la rivière ; à l'est, la corde de funambule. La roulotte de Mère Pivoine, à l'écart, n'en fait pas partie.
- **Matériaux et état** : terre battue et herbe écrasée, marquée de traces de roues ; roulottes peintes de frais en bleu rivière, ocre, vert mousse et rouge brique, toiles rayées crème et rouge brique tendues en auvents ; cerclages de fer rouillés aux roues ; cordes de chanvre tendues à sécher ; poteaux de chêne gris ; cire de bougies figée sur les rebords de fenêtres.
- **Lumière** (origine, couleur, force, ombres) : soleil d'automne bas, filtré par la brume de la rivière, doré sur les toiles ; ombres longues des roulottes vers l'ouest ; l'ombre froide des piles couvre la berge à l'est ; pas de lampe allumée le jour.
- **Sons** : un accordéon répète une même phrase derrière les roulottes, cris d'enfants au loin, toiles qui claquent, eau contre la berge.
- **Odeurs** : fumée de bois du feu, cire chaude, chanvre mouillé.
- **Température** : fraîche le matin, plus douce près du feu ; plus froide sous les piles, au ras de l'eau.
- **Éléments remarquables** (chacun avec sa place) :
  - le feu de camp, au centre de la clairière, ringé de pierres de rivière, avec une marmite de fer sur trépied.
  - les cinq roulottes, en demi-cercle au nord du feu, la porte à marches de bois tournée vers la rivière.
  - la corde de funambule, tendue à l'est entre deux poteaux de chêne gris, à hauteur d'épaule au premier poteau.
  - les piles du pont brisé, dressées dans l'eau au nord-est, avec entre elles les arches tombées, couvertes d'eau brune.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `ver-pont-des-marchands` : description : Le sentier de rive remonte vers l'amont, entre les saules, jusqu'au ponton des bateliers ; une demi-heure de marche. ; retour : Le sentier remonte la rive en longeant les saules, jusqu'au ponton des bateliers et ses marques de crue.
  - vers `pon-roulotte` : description : Une bâche rayée, rouge brique et crème, ferme la porte d'une roulotte bleu rivière, à l'écart contre la berge ; trois marches de bois y mènent. ; retour : Depuis le seuil, la bâche relevée laisse voir le camp : le feu, les roulottes en demi-cercle et la corde tendue entre ses poteaux.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | trésor | caisse de costumes : 10 po (contenant) | sous l'auvent de la roulotte la plus à l'est, côté corde | à créer | fouille |
  | objet | affiches de la troupe (examen) | fixées au montant de la roulotte de tête, côté feu | à créer | examen |
  | PNJ | Mathilde Pot-de-Miel, colporteuse : présence le jour, assise près du feu (ses sujets sont ceux du marché) | près du feu | `mathilde-pot-de-miel` | conversation |
  | PNJ | les forains, sans nom propre : ils se ferment si le groupe est hostile (aucun sujet) | autour du feu et des roulottes | à créer | conversation |

  Cas limite : groupe hostile, les forains se ferment ; la roulotte reste accessible.

- **Avant / après** : aucun changement prévu par le canon sur le camp.
- **Un détail propre à ce lieu** : au poteau ouest de la corde, le chêne est poli et noirci à hauteur d'épaule par les mains des funambules qui s'y appuient avant de monter (aucun autre poteau du camp n'est aussi lisse).
- **Intérieur** : une roulotte, sous-lieu de ce camp (fiche « Niveau 3 » juste dessous).
  - plan intérieur (entrée, enchaînement des pièces) : une seule pièce, avec la porte côté camp.
  - sous-lieux (chacun aura sa fiche « Niveau 3 », même modèle, héritage = cette fiche) :

    | id | nom | type | fonction dramatique | position | ce qui l'annonce depuis ce lieu | voisins directs |
    | --- | --- | --- | --- | --- | --- | --- |
    | `pon-roulotte` | La roulotte de Mère Pivoine | salle | rencontre (PNJ, objet) | sans position (à l'écart, contre la berge) | une roulotte plus petite et plus usée, sa porte fermée par une bâche rayée | `pon-camp` |

**Champs dérivés**
- **resume** : Le camp des forains, clairière de roulottes peintes autour d'un feu, face à la rivière et au pont brisé.
- **accroche** : Sous le pont brisé, un demi-cercle de roulottes peintes se dessine dans l'herbe, avec la fumée d'un feu et une corde tendue entre deux poteaux.
- **visuel** : Une clairière de terre battue, bordée par la berge au nord et les piles du pont brisé au nord-est, où cinq roulottes bleu rivière, ocre, vert mousse et rouge brique forment un demi-cercle autour d'un feu de pierres. Une corde de chanvre tendue entre deux poteaux de chêne gris coupe l'angle est, et des toiles rayées crème et rouge brique pendent sous les auvents. La lumière dorée de l'automne, filtrée par la brume, glisse sur les cerclages de fer, et l'ombre des roulottes s'étire vers l'ouest.
- **ambiance** : Roulottes peintes, corde tendue, feu de camp
- **arrivee** : Le sentier de rive débouche sur une clairière de terre battue, où l'herbe est écrasée par les roues et les pas. Devant vous, cinq roulottes peintes en bleu rivière, en ocre, en vert mousse et en rouge brique forment un demi-cercle autour d'un feu de pierres, et leurs toiles rayées pendent sous les auvents. L'odeur de fumée de bois se mêle à celle de la cire chaude et du chanvre mouillé. À l'est, une corde tendue entre deux poteaux de chêne gris coupe l'angle, et le vent y fait chanter les fibres. Au nord-est, au-dessus de la berge, les piles d'un pont de pierre claire se dressent dans l'eau, et entre elles, deux arches sont tombées dans la rivière. Quelque part derrière les roulottes, un accordéon répète la même phrase, puis s'arrête. Il fait frais, plus doux près du feu, et la lumière dorée d'automne glisse sur les toiles. Le camp semble plus silencieux que d'habitude, comme s'il se préparait à la foire sans se presser.
- **description** : Clairière de terre battue, une quarantaine de pas sur vingt, au pied des piles du pont brisé. Au centre, un feu de pierres porte une marmite de fer. Cinq roulottes en demi-cercle, bleu rivière, ocre, vert mousse et rouge brique, portes tournées vers l'eau. Sous l'auvent de la roulotte la plus à l'est, une caisse de costumes contient 10 po. Les affiches de la troupe sont fixées au montant de la roulotte de tête, près du feu. Mathilde Pot-de-Miel passe la journée assise près du feu. À l'est, la corde de chanvre est tendue entre deux poteaux de chêne gris ; le chêne du poteau ouest est poli et noirci à hauteur d'épaule. À l'écart, contre la berge, la roulotte de Mère Pivoine a sa porte fermée par une bâche. Si le groupe se montre hostile, les forains se ferment et ne parlent plus.

#### Niveau 3 : `pon-roulotte` (La roulotte de Mère Pivoine, salle), dans `pon-camp`

**Héritage** (recopié du niveau 1 via le niveau 2, ne pas modifier) :
- **Matériaux** : chêne clair, toile rayée rouge brique et crème, pierre claire des ponts, lanternes de papier ocre.
- **Couleurs** : ocre, vert mousse, rouge brique, crème, bleu rivière.
- **Lumière type** : dorée d'automne, brume de rivière le matin. **Sons** : clochettes de foire, cris de marchands, eau. **Odeurs** : pain chaud, foin, fumée de bois.
- **Interdits** : gore, magie ostentatoire.

- **Dimensions et structure** : une seule pièce de quatre pas sur deux et demi, plus haute que large, sur quatre roues de bois cerclées de fer ; porte à trois marches côté camp, au sud ; petite fenêtre au mur est. Une bâche rayée, tendue sur une corde de chanvre à mi-longueur, coupe la pièce en deux.
- **Matériaux et état** : planches de sapin peintes en bleu rivière, écaillées au pied des roues et verdies du côté de la berge ; plancher de chêne clair usé en sentier devant la porte ; poutres du toit de chêne noir ; toile cirée tendue sur la fenêtre nord ; cire de bougies sur le rebord de la fenêtre est.
- **Lumière** (origine, couleur, force, ombres) : jour qui entre par la porte ouverte au sud et par la petite fenêtre est ; pas de lampe allumée ; la moitié nord reste dans l'ombre, sous la toile cirée.
- **Sons** : claquement de la toile de la porte au vent, bruit du camp qui filtre entre les planches, eau contre la berge.
- **Odeurs** : cire chaude, huile de lampe, bois de sapin tiède.
- **Température** : plus chaude que dehors, l'air est confiné ; plus frais au fond, côté berge, là où la toile cirée laisse passer l'humidité.
- **Éléments remarquables** (chacun avec sa place) :
  - la bâche rayée, rouge brique et crème, tendue au milieu de la pièce sur sa corde de chanvre.
  - la lampe à huile de cuivre, accrochée au mur ouest à hauteur de tête.
  - une poupée de bois peinte en bleu, sur une tablette au-dessus de la lampe, avec un ruban de toile crème noué au cou ; pareille à celles du sanctuaire.
  - le coffre à costumes, en bois peint, contre le mur est, sous la petite fenêtre.
  - un banc de chêne et une table pliante, côté porte, sous la lampe.
- **Issues** (où elles mènent, aspect vu de chaque côté) :
  - vers `pon-camp` : description : Trois marches de bois descendent de la porte, en face, vers le feu et les roulottes du camp, entre l'herbe écrasée. ; retour : Une bâche rayée, rouge brique et crème, ferme la porte d'une roulotte bleu rivière, à l'écart contre la berge ; trois marches de bois y mènent.
- **Contenu prévu** (un emplacement par entité ; id s'il existe déjà, sinon « à créer » ; au lieu le plus précis) :

  | sorte (PNJ, monstre, piège, trésor, énigme, objet) | rôle | lié à quel élément du décor | id | skill |
  | --- | --- | --- | --- | --- |
  | PNJ | Mère Pivoine, doyenne des forains : au moins 4 sujets ; reçoit le colis de Brun et remet le reçu | assise sur le banc, côté porte | `mere-pivoine` | conversation |
  | PNJ | Tobie Pivoine, funambule : au moins 4 sujets ; caché derrière la bâche (Perception DD 10 pour le voir, ou Mère Pivoine l'y conduit) | derrière la bâche, au milieu de la pièce | `tobie-pivoine` | conversation (Perception DD 10) |
  | objet | le colis de Brun : objet de quête, remis à Mère Pivoine (ni vendable ni jetable) | table pliante | à créer (aucun id de colis dans les fichiers du monde hors LIEUX) | — |
  | objet | le reçu de Mère Pivoine : remis en échange du colis, à rapporter à Brun | table pliante | à créer | — |
  | objet | coffre à costumes (examen) | mur est, sous la petite fenêtre | à créer | examen |
  | objet | porte-bonheur de funambule : offert à un héros si Tobie s'est confié (indice de l'écho `epi1-tobie-reconnaissant`) | donné depuis la bâche | à créer | — (remise conditionnelle) |

  Cas limites : Tobie avoue la dette de vive voix à qui gagne sa confiance (Persuasion DD 11, ou le colis rendu) ; menacé, il se rend sans combattre ; s'il fuit, effet `deplacer` vers le camp ; il ne meurt pas dans l'épisode.

- **Avant / après** : aucun changement de la pièce prévu par le canon ; l'aveu et le porte-bonheur sont des conséquences de la rencontre, pas des états du lieu.
- **Un détail propre à ce lieu** : sur le montant de la petite fenêtre est, sept étoiles ocre peintes en rang, toutes de la même main (aucune autre roulotte du camp n'a d'étoiles).
- **Intérieur** : aucun (dernière pièce de la chaîne).

**Champs dérivés**
- **resume** : La roulotte de Mère Pivoine, la plus vieille du camp, à l'écart contre la berge, pleine de bougies et d'objets de foire.
- **accroche** : Contre la berge, à l'écart du demi-cercle, une roulotte bleu rivière, plus petite et plus usée que les autres, a sa porte fermée par une toile rayée.
- **visuel** : Une roulotte de sapin peint en bleu rivière, plus petite et plus ancienne que les autres, avec une porte ouverte sur trois marches. Une bâche rayée rouge brique et crème, tendue sur une corde de chanvre, coupe la pièce en deux ; une lampe de cuivre pend au mur ouest, sous une tablette où une poupée de bois porte un ruban crème. Par la petite fenêtre est, une lumière grise tombe sur un coffre peint et sur des étoiles ocre peintes au montant.
- **ambiance** : Sapin bleu, bougies, toile rayée
- **arrivee** : La porte de la roulotte est ouverte sur une pièce plus petite que vous ne l'imaginiez, où l'air sent la cire chaude et l'huile de lampe. Une bâche rayée, rouge brique et crème, est tendue au milieu de la pièce sur une corde de chanvre, et sa toile frémit quand le vent passe par la porte. Sur la gauche, une lampe de cuivre pend au mur, près d'une tablette où une poupée de bois, peinte en bleu, porte un ruban de toile crème. Contre le mur est, un coffre peint se tient sous une petite fenêtre, et sur le montant, des étoiles ocre attirent le regard. Une vieille femme au visage fin, assise sur un banc, ne lève pas tout de suite les yeux de son ouvrage. Par la fenêtre, une lumière grise tombe sur le plancher, et l'on entend au-dehors le camp, le feu, l'eau contre la berge. Tout reste à sa place, calme et un peu serré, comme une maison qui a beaucoup voyagé.
- **description** : Roulotte de sapin peint, quatre pas sur deux et demi, la plus vieille et la plus petite du camp, posée contre la berge. Une bâche rayée, tendue sur une corde de chanvre à mi-longueur, coupe la pièce en deux ; côté porte, un banc de chêne et une table pliante. Au mur ouest, une lampe à huile de cuivre pend sous une tablette où une poupée de bois, pareille à celles du sanctuaire, porte un ruban crème. Contre le mur est, un coffre à costumes peint se tient sous la petite fenêtre, dont le montant porte sept étoiles ocre. La fenêtre nord est bouchée par une toile cirée. Mère Pivoine, doyenne des forains, reçoit ici le colis de Brun et remet le reçu. Le plancher de chêne est usé en sentier devant la porte.
