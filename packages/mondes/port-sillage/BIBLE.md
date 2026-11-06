# Bible de Le Grimoire de Port-Sillage (canon)

Document de référence pour tous ceux qui écrivent des données de ce monde. **Les identifiants du registre (§7) sont fixes** : les zones s'y réfèrent entre elles. Ne rien inventer qui contredise ce canon.

> **Canon validé par l'utilisateur le 06/11/2026** (V1 piste « Le Grimoire de la crypte », V2 canon). Gelé : tout changement demande un nouveau oui.

## 1. Pitch

À **Port-Sillage**, village de pêcheurs au fond d'une baie, le *Livre de Maëlle* — le grimoire de la sainte qui calmait les tempêtes — a disparu de la crypte de l'église pendant la fête de la Mer. Chaque année, le prêtre y lit la page de la Bonace pour que la flotte revienne ; sans le livre, la fête est gâchée et le village a peur. Le groupe (quatre héros, niveaux 1 à 3) a **trois nuits** : à la grande marée, un navire viendra chercher le livre.

**Ton** : conte marin cosy et salé, humour de village, aucune cruauté gratuite, des gens qui ont des raisons ; histoire **facile**. **Esthétique** : pierre grise et bois goudronné, filets, cordages, lanternes de poisson, lumière dorée de fin d'après-midi sur un port ; pas de noir et blanc.

**La question** : à qui confier le pouvoir de la mer — à l'Église qui le garde en y laissant sa voix, à la garnison qui le protège contre un prix, ou à un garçon qui l'a volé par amour pour sa mère ?

## 2. Ce qui s'est vraiment passé (secret, révélé par morceaux)

- **Tobie Ancre**, 17 ans, sacristain, a donné la clé de la crypte à **Sorel Noirbec**, contrebandier, contre 30 po d'avance pour payer l'apothicaire de sa mère **Hélène**, malade de la fièvre des marais. Il croyait qu'on voulait l'argenterie de l'église ; il a compris trop tard que c'était le livre. Il se cache depuis, rongé de remords.
- Sorel a promis le livre au **marquis de Verdelune**, collectionneur étranger, dont le navire mouillera au large à la grande marée, **dans trois nuits**. Il garde le livre dans sa grotte, sous la crique.
- **Odile Marsan**, capitaine de la garnison, laisse passer la contrebande de Sorel depuis deux ans : la solde n'a plus été versée, car la maire **Gilda Fauvel** a détourné les fonds vers la digue. Elle soupçonne le vol et refuse de l'admettre. Son sergent **Piotr Lenoir** est droit et ne sait rien du marché.
- **Père Aubin**, le prêtre, perd la vue et la voix : le livre prend un peu de la voix de celui qui lit la Bonace. Il voulait former Tobie en successeur et ne le lui a jamais dit ; Tobie croit qu'on ne veut pas de lui.
- Le livre contient aussi une **page de soin**, que seul un lecteur ayant lu la Bonace peut ouvrir : elle guérirait Hélène.
- **Coût caché** : ce qui protège la flotte use son lecteur.
- Chacun croit bien faire : Tobie sauve sa mère, Odile nourrit ses soldats, Gilda protège le village de la mer et du chaos, Aubin garde sa foi, Sorel gagne sa vie (et n'est pas cruel).

### Qui sait quoi

| PNJ | Sait | Cache |
| --- | --- | --- |
| Père Aubin | La Bonace, le prix de la voix, l'état d'Hélène | Qu'il perd la vue et la voix ; qu'il voulait Tobie pour successeur |
| Tobie Ancre | Qui a la clé, où est Sorel | Qu'il a donné la clé, pourquoi |
| Hélène Ancre | La fièvre, l'argent de l'apothicaire | Qu'elle devine ce que son fils a fait |
| Odile Marsan | La contrebande de Sorel, la solde impayée | Qu'elle l'a tolérée |
| Piotr Lenoir | Les rondes, le registre | Rien (il doute d'Odile) |
| Gilda Fauvel | La digue, les comptes | Qu'elle a détourné la solde |
| Maëva Brisant | Les clients de la taverne, la cave aux rats | Qu'elle a vu Sorel payer en pièces marquées |
| Gaspard | Une barque sans lumière à la marée de la fête | Qu'il a bu et ne sait plus quelle nuit |
| Sorel Noirbec | L'acheteur, l'heure du navire | Où est le livre |
| Cyprien | Les rumeurs de la place | — |
| Mirande Sel | Les marchandises qui passent la crique | Qu'elle a vendu une corde à Sorel |
| Basile Écume | Les rondes de nuit | Qu'il a peur du noir |

## 3. Les fins

1. **Retour à la crypte (Église)** — Fait : `f-fin-eglise`. Le groupe rend le livre à Aubin, qui lit la Bonace. **Gagné** : la fête sauvée, la flotte en sûreté. **Coût** : Aubin y laisse sa voix, Tobie est puni (pénitence ou exil), Hélène reste malade.
2. **À la caserne (garnison)** — Fait : `f-fin-caserne`. Le groupe confie le livre à Odile. **Gagné** : le livre en sûreté, la garnison payée. **Coût** : l'Église perd son autorité, la Bonace devient un service qu'on facture.
3. **À Tobie, nouveau lecteur** — Fait : `f-fin-tobie`. Le groupe le remet à Tobie, successeur d'Aubin. **Gagné** : Hélène guérie par la page de soin, l'Église et le garçon réconciliés. **Coût** : un lecteur novice, donc une mer capricieuse cet hiver ; Aubin vexé, la garnison méfiante.
4. **Fin d'échec** — Fait : `f-fin-echec`. La jauge atteint 4 : le navire de Verdelune emporte le livre. **Perdu** : plus de Bonace, la flotte reste à terre, Hélène meurt ; le sort de Tobie dépend de ce que le groupe en a fait (le texte de fin reste neutre : décision déléguée à Claude le 06/11/2026, qui remplace « Tobie s'enfuit sur le navire »).

## 4. La jauge : la grande marée (0 à 4)

Identifiant : `grande-maree`. Départ : 1. Bornes : 0 à 4.

- **0 — Mer d'huile.** Le navire est retardé, la crique est surveillée : on a du temps.
- **1 — Le vol connu.** La fête est gâchée, le village murmure. Départ de l'histoire.
- **2 — Couvre-feu.** Odile consigne la garnison, les contrebandiers sont nerveux : la crique se garde mieux, la taverne se vide.
- **3 — Le navire au large.** Le navire de Verdelune mouille ; des barques font la navette ; Sorel déplace ses hommes.
- **4 — Le livre embarque.** Fin d'échec.

Monte d'un cran par nuit passée sans avancer (repos long), quand une alarme est donnée à la crique (cloche d'alerte), ou quand le groupe accuse un innocent. Descend quand le groupe prévient le capitaine, sabote la barque de Sorel, bloque le port, ou retarde le navire (lettre de Verdelune).

## 5. Factions (identifiants fixes)

| id | Faction | Veut | Chef |
| --- | --- | --- | --- |
| `gens-du-port` | Les gens du port | Leur fête, leurs filets, la paix | `gilda-fauvel` |
| `eglise-de-la-bonace` | L'Église de la Bonace | Le livre à sa place, la Bonace lue | `pere-aubin` |
| `garnison-du-guet` | La garnison du guet | La solde, l'ordre, l'honneur | `odile-marsan` |
| `contrebandiers-de-la-crique` | Les contrebandiers de la crique | Vendre le livre, vivre tranquilles | `sorel-noirbec` |

## 6. Les peuples et les espèces dans ce monde

- **Humains** : majorité des pêcheurs, des soldats, des prêtres.
- **Halfelins** : tavernes et cuisines ; Maëva tient la taverne.
- **Nains** : anciens charpentiers de marine ; le sergent Piotr.
- **Gnomes** : crieurs, horlogers de cloche ; Cyprien.
- **Elfes** : colporteurs de passage ; Mirande Sel.
- **Tieffelins** : bateliers, on les soupçonne souvent à tort ; Sorel en est un, et il n'en fait pas un drame.
- **Drakéides, goliaths, orcs** : marins et débardeurs du quai, bienvenus ; le village a vu pire que des écailles.

## 7. Registre des identifiants fixes

### Lieux (arbre)

- `port-sillage` — région, racine de tout (Z1)
  - `ps-place` — place de la Criée, **hub et départ** (Z1), sous-lieu : `pl-quai`
  - `ps-taverne` — taverne *Le Hareng Rouillé* (Z1), sous-lieux `ta-salle`, `ta-cave`
  - `ps-caserne` — caserne du guet (Z1), sous-lieux `ca-cour`, `ca-bureau`
  - `ps-eglise` — église Sainte-Maëlle (Z2), sous-lieux `eg-nef`, `eg-sacristie`, `eg-crypte`
  - `ps-crique` — la crique des Gueux (Z3), sous-lieux `cr-plage`, `cr-entrepot`, `cr-grotte`

### Personnages clés (créés par la zone indiquée)

| id | Qui | Zone, lieu |
| --- | --- | --- |
| `pere-aubin` | prêtre, humain, M, 71 ans | Z2, `eg-nef` |
| `tobie-ancre` | sacristain, humain, M, 17 ans (se cache) | Z1, `pl-quai` |
| `helene-ancre` | mère de Tobie, humaine, F, 44 ans, malade | Z2, `eg-sacristie` |
| `odile-marsan` | capitaine du guet, humaine, F, 38 ans | Z1, `ca-bureau` |
| `piotr-lenoir` | sergent, nain, M, 52 ans | Z1, `ca-cour` |
| `gilda-fauvel` | maire, humaine, F, 58 ans | Z1, `ps-place` |
| `maeva-brisant` | aubergiste, halfeline, F, 45 ans | Z1, `ta-salle` |
| `gaspard-vent` | vieux pêcheur, humain, M, 68 ans | Z1, `ta-salle` |
| `sorel-noirbec` | chef des contrebandiers, tieffelin, M, 42 ans | Z3, `cr-grotte` |
| `cyprien-crieur` | crieur public, gnome, M, 30 ans | Z1, `ps-place` |
| `mirande-sel` | marchande ambulante, elfe, F, 120 ans | Z1, `ps-place` |
| `basile-ecume` | **compagnon** : recrue du guet, humain, M, 19 ans ; quête `q-basile-premier-service` | Z1, `ca-cour` |

### Objets clés

- `livre-de-maelle` (Z3, `cr-grotte`) : le grimoire, objet de quête.
- `cle-de-la-crypte` (Z3, `cr-entrepot`) : la clé volée à Tobie, preuve.
- `bourse-marquee` (Z1, `ta-salle`) : pièces marquées de Sorel, preuve du marché (Maëva).
- `registre-de-la-solde` (Z1, `ca-bureau`) : prouve la solde impayée.
- `lettre-de-verdelune` (Z3, `cr-grotte`) : prouve la vente et l'heure du navire.

### Jauge, drapeaux, faits centraux

- Jauge : `grande-maree`.
- Drapeaux : `vol-connu`, `tobie-retrouve`, `sorel-demasque`, `crique-trouvee`, `livre-retrouve`, `navire-retarde`, `odile-prevenue`, `choix-eglise`, `choix-caserne`, `choix-tobie`.
- Faits centraux : `f-livre-vole`, `f-cle-de-tobie`, `f-marche-de-sorel`, `f-navire-de-verdelune`, `f-solde-impayee`, `f-contrebande-toleree`, `f-aubin-perd-sa-voix`, `f-livre-use-la-voix`, `f-page-de-soin`, `f-helene-malade`.
- Fins : `f-fin-eglise`, `f-fin-caserne`, `f-fin-tobie`, `f-fin-echec`.

### Quêtes principales (créées par la zone centrale Z4)

- `q-le-grimoire` (principale ; étapes : place, taverne, église, Tobie, crique, grotte, fin).
- `q-tobie-sa-mere` (secondaire : soigner Hélène).
- `q-odile-la-solde` (faction : la solde de la garnison).
- `q-maeva-la-cave` (secondaire : les rats de la cave).
- `q-basile-premier-service` (personnelle du compagnon).

### Énigmes et pièges

- Énigmes : `eg-e-cloches-de-maree` (`eg-crypte`, Z2), `cr-e-coffre-de-sorel` (`cr-grotte`, Z3).
- Pièges : un dans `eg-sacristie` (coffre), un dans `eg-crypte` (dalle), un dans `cr-grotte` (alarme).

### Rencontres emblématiques

- Les rats de la cave (`ta-cave`, niveau 1).
- Les gardiens de la crypte (`eg-crypte`, niveau 2).
- Les crabes de la plage (`cr-plage`, niveau 2).
- Les bandits de l'entrepôt (`cr-entrepot`, niveau 2-3).
- Sorel et ses hommes (`cr-grotte`, niveau 3), avec une issue négociée.

## 8. Progression par niveau

- **Niveau 1** : `ps-place`, `pl-quai`, `ps-taverne` et ses sous-lieux (la cave : premiers rats).
- **Niveau 2** : `ps-caserne`, `ps-eglise` et la crypte, `cr-plage`.
- **Niveau 3** : `cr-entrepot`, `cr-grotte`.
- Les PX viennent des combats et des quêtes ; les rencontres sont **calibrées pour 4 héros** (renforts au-delà de 4 pour atteindre 6, retirés par `adapterRencontre` pour les petits groupes).

## 9. Monstres disponibles (SRD, ids de profil)

`rat-geant`, `nuee-de-rats`, `squelette`, `crabe-geant`, `bandit`, `chef-de-bande`, `garde`, `eclaireur`. À confirmer par `ls packages/donnees/srd/monstres/` avant d'écrire les rencontres.

## 10. Choix, pertes et horloge (checklist « histoire qui ne s'ennuie pas »)

> **Décisions déléguées à Claude par l'utilisateur le 06/11/2026** : (1) Sorel : le dilemme reste dans la rencontre de la grotte, mais « le laisser fuir » coûte (il prévient l'acheteur : jauge +1) ; (2) jauge : l'alarme du coffre ne peut plus déclencher la fin d'échec sur place (elle ne monte la jauge que jusqu'à 3), et Gilda peut fermer le port avec la lettre de l'acheteur (jauge −1) ; (3) Tobie : épilogues neutres sur son sort.

### Les trois dilemmes (légers)

1. **Tobie.** Le livrer à Odile (justice) / le cacher (compassion) / le confier à Aubin (pardon). Écho : trois jours plus tard, la place en parle ou en rit.
2. **La solde.** Dénoncer Odile à Gilda (la garnison est mise à l'amende) / se taire (la paix, la contrebande continue) / exiger que Gilda paie (tension avec la maire). Écho : Piotr ou Basile le sait.
3. **Sorel.** L'arrêter (justice, sang possible) / le laisser fuir contre le livre (miséricorde, lui reviendra) / le rançonner (or, humiliation). Écho : un contrebandier salue ou crache.

### Qui peut mourir ou partir

- **Sorel** peut mourir au combat final.
- **Tobie** peut être chassé, ou partir sur le navire (fin d'échec).
- **Odile** peut être destituée.
- **Hélène** meurt si l'horloge atteint 4.

### L'horloge

La jauge `grande-maree` (4 paliers + 0) : la moitié a des effets (couvre-feu, navire au large) ; on la ralentit en prévenant Odile, en sabotant la barque, en retardant le navire.

### Salutations variables (au moins 5)

`gilda-fauvel`, `odile-marsan`, `maeva-brisant`, `pere-aubin`, `tobie-ancre` : leur salutation change selon `vol-connu`, `tobie-retrouve`, `sorel-demasque` et les choix.

### Faits clés et leurs sources

- `f-cle-de-tobie` : Gaspard (barque sans lumière), Maëva (pièces marquées), `cle-de-la-crypte` (objet).
- `f-marche-de-sorel` : `bourse-marquee`, Mirande, la grotte.
- `f-navire-de-verdelune` : `lettre-de-verdelune`, Sorel, Cyprien (rumeur d'un navire inconnu).
