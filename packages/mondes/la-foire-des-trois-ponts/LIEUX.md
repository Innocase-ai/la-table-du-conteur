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
| 7 | La forge de Brun (`ver-forge`) | l'enclume, la forge, le soufflet, la commande de Mère Pivoine | Brun Forgefer (4 sujets) ; forge et armes simples ; **coffre piégé du colis** (verrou DD 12, piège à aiguille 1d4, à chercher puis désamorcer) | hier, en livrant des fers au moulin, il a vu la **serrure de la cour forcée** | si le coffre est forcé à la brute : le piège part (1d4), le colis reste intact (un objet de quête ne se vend ni ne se jette) |
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
