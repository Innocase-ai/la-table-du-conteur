# V7 : intrigue et choix — *Validé par l'utilisateur le 20/11/2026 (gelé), décisions I1 à I13 comprises*

V7 relie tout ce que V1 à V6 ont posé : **les 3 quêtes**, **le dénouement** (le choix « qui doit payer ? », ses deux fins, ses échos), les **recoupements** d'enquête, et les branchements laissés à V7 (`V7-A-BRANCHER.md`). Rien ici ne change le gelé (V2 à V6) sans que je le dise : ce qui s'y ajoute est marqué **[nouveau]**, ce qui y déroge est dans la section A. Les textes lus par le joueur sont écrits ensuite par des agents Haiku (≈ 25 courts textes), les structures par moi.

## A. Décisions à valider

| # | Décision | Proposition | Pourquoi |
| --- | --- | --- | --- |
| I1 | Comment se fait le choix du dénouement | un **dilemme** du moteur `qui-doit-payer` (lieu : la halle du bailli ; s'ouvre dès que la clé est rendue) : chaque option annonce ses coûts et ses gains avant qu'on tranche ; **le moteur pose lui-même les drapeaux** `choix-qui-doit-payer` (quoi que ce soit) et `choix-qui-doit-payer-scandale`, `-silence` ou `-abstention` | V2 : « le groupe rend la clé et choisit » ; c'est le format du moteur pour « un choix qui coûte », et le validateur le réclame (avis « Choix ») |
| I2 | Le « scandale » | option réservée à qui a **la reconnaissance de dette ou le fait `f-gedeon-a-engage-la-bande`** (M1) ; effets : Gédéon, Tobie et Mère Pivoine **partent** (état `parti` : « ruiné, interdit de foire » ; « bannis de la foire ») ; drapeau automatique ; **plus** une attitude de Gédéon à −100 (« devient un ennemi ») | V2 : « Gédéon ruiné… la dette de Tobie annulée, mais lui et sa mère bannis » ; l'état `parti` existe déjà (V2 : « qui peut partir : Tobie et sa mère ») |
| I3 | Le « silence » | option réservée à qui **connaît la dette** (`f-gedeon-et-la-dette`), **grisée** sans 90 po ; effets : −90 po (net −30 po avec la prime de 60 po versée à la remise de la clé) ; le requis compte la prime, donc 30 po de la poche du groupe suffisent, comme dit V2 (« net −30 po ») | V2 : « le groupe paie la dette de sa poche (90 po) » |
| I4 | **L'abstention** (« je rends la clé et je ne dis rien ») | le moteur la prévoit à part des deux options (bloc `abstention`) ; je la fais mener à **la fin « silence »** avec une **variante d'épilogue** (la dette n'est pas payée, Tobie reste menacé) et **sans écho** `epi1-tobie-reconnaissant` | garde **deux fins** (V2) ; l'abstention coûte (Gédéon impuni **et** la dette demeure) |
| I5 | **Les 2 fins** | `fin-scandale` (condition `choix-qui-doit-payer-scandale`) et `fin-silence` (condition `choix-qui-doit-payer-silence` ou `choix-qui-doit-payer-abstention`) ; 80 à 120 mots d'épilogue chacune + 1 variante pour l'abstention ; `consequences` en 3 courtes lignes | V2 |
| I6 | Les **échos** de campagne (monde.json) | `epi1-gedeon-vengeur` si `choix-qui-doit-payer-scandale` ; `epi1-tobie-reconnaissant` si `choix-qui-doit-payer-silence` (pas l'abstention) ; une phrase chacun | V2 (indices déjà en jeu : les 30 po de Gédéon, le porte-bonheur de Tobie) |
| I7 | **Récompenses** | principale : **235 PX** ; la **perche d'équilibriste** (unique) donnée **à l'issue du choix** ; colis : 40 PX + 10 po + la corde de funambule ; rats : 25 PX + une nuit offerte | V2/BIBLE ; le chemin le plus court (payer 20 po aux hommes, combattre Rouquin 75 PX, quête 230 PX) atteint 310 PX ≥ 300 (niveau 2), avec 10 PX de marge à 6 héros |
| I8 | La route du moulin | le lien `verdelle` → pont du Meunier se **conditionne à la quête principale active** ; les deux trésors de la clé et le trésor du colis aussi | V4 |
| I9 | **Recoupement** de `f-tobie-a-vole-la-cle` [nouveau] | un événement de monde `ev-recoupement-tobie` (condition : **deux indices au moins parmi quatre** : `f-pervenche-a-vu-tobie`, `f-corde-vendue-a-tobie`, `f-trace-de-corde-au-cabinet`, `f-noeud-de-funambule`, écrits en six paires `et` sous un `ou` ; il apparaît dans le journal) qui révèle le fait sans passer par Tobie ; narration 50 à 80 mots, **qui nomme Tobie** : le canon devra autoriser `evenements:ev-recoupement-tobie` dans `autorise` (voir I13) | V2 : le fait central a trois sources jouables ; sans cela, seul l'aveu de Tobie le donne |
| I10 | L'événement de la corde, **choix d'origine** (avis du validateur) | deux choix réservés [nouveaux] : **Halfelin** (agile : « Je passe en trottant sur la corde ») et **Barde** (« Je monte en chantant ») ; réussite sans jet, un pourboire de 2 po | la règle « chaque événement compte un choix d'origine » ; facultatif : dis non, et je les retire |
| I11 | Les **cas limites** de V4 qui demandaient un effet de déplacement | je n'encode que le plus simple : **si le piège du coffre-fort part** (cambriolage maladroit), Gédéon part chez le bailli (`deplacer`, boutique vide) ; Mathilde « volée » et Colombe « attaquée » **abandonnés** : le moteur n'a aucun point d'accroche pour « voler » ou « attaquer » un PNJ | l'engine ne sait pas ces cas sans code (hors périmètre : pas de modification du moteur) |
| I13 | Autoriser le secret du vol dans l'événement de recoupement et les fins (revue de secrets du canon) | ajouter `evenements:ev-recoupement-tobie` et `fins` à la liste `autorise` de `secret-voleur-de-la-cle` (et `fins` à celle de `secret-gedeon-et-la-dette`) | ces textes ne se lisent qu'une fois le fait appris, ou au dénouement ; sans cela, la revue signalerait une fuite |
| I12 | Salutations qui changent | Aubin (`cle-rendue`) et Brun (`colis-remis`) branchées sur les drapeaux des quêtes ; Mathilde « au camp » **abandonnée** | 7 PNJ avec salutations variables (visé : 5) |

## B. Les quêtes

Aucune étape n'a de `lieu` (le joueur cherche). Chaque quête **finit chez son donneur**. Journal : `resume` et `etapes[].texte` de 2 à 3 phrases (écrits par Haiku).

### 1. `q-la-cle-de-la-foire` (principale, donneur Aubin, `lieu` = `ver-bailli-salle`, niveau 1 à 2)

| Étape | Condition d'accomplissement | Suites | Notes |
| --- | --- | --- | --- |
| `trouver-la-cle` (début) | `ou` : l'objet `cle-du-coffre-de-la-foire` dans le sac, ou le drapeau `cle-rendue` | `rendre-la-cle` | la quête se lance par le sujet `aubin-cle` |
| `rendre-la-cle` | drapeau `cle-rendue` (posé par le sujet **[nouveau]** `aubin-rendre`) | `trancher` | `aubin-rendre` : condition objet clé ; effets : lance la quête si absente (cas limite V4 : clé rapportée sans quête acceptée), retire la clé, **+60 po**, drapeau `cle-rendue` |
| `trancher` (termine) | drapeau `choix-qui-doit-payer` (posé par le moteur quand le dilemme est tranché, quelle que soit l'option) | — | — |

Récompenses : 235 PX ; la perche d'équilibriste ; annonce « 60 po de prime et la perche d'équilibriste ». Aucun échec (pas d'horloge).

### 2. `q-le-colis-du-forgeron` (secondaire, donneur Brun, `lieu` = `ver-forge`, niveau 1 à 2)

| Étape | Condition | Suites | Notes |
| --- | --- | --- | --- |
| `recuperer-le-colis` (début) | objet `colis-de-brun` dans le sac | `livrer-le-colis` | lancée par `brun-colis` ; le **trésor du coffre** n'existe que quête active ; crochetage DD 12 + aiguille |
| `livrer-le-colis` | drapeau `colis-remis-a-mere-pivoine` | `rapporter-le-recu` | `mp-colis` (Mère Pivoine) |
| `rapporter-le-recu` (termine) | drapeau `q-le-colis-du-forgeron-rendue` | — | sujet **[nouveau]** `brun-recu` : condition objet reçu ; retire le reçu, drapeau |

Récompenses : 40 PX, 10 po, la corde de funambule (nommée) ; annonce « 10 po et une corde de funambule ».

### 3. `q-les-rats-de-la-cave` (secondaire, donneur Colombe, `lieu` = `ver-heron-salle`, niveau 1)

| Étape | Condition | Suites | Notes |
| --- | --- | --- | --- |
| `vaincre-les-rats` (début) | rencontre `r-rats-de-la-cave` réglée | `retour-chez-colombe` | lancée par `colombe-rats` ; même si les rats sont tués avant d'avoir la quête (cas limite V4) |
| `retour-chez-colombe` (termine) | drapeau `q-les-rats-de-la-cave-rendue` | — | sujet **[nouveau]** `colombe-rats-fait` : condition rencontre réglée ; effets : drapeau, `nuit-offerte` (le service **[nouveau]** « chambre offerte », gratuit, condition `nuit-offerte`) |

Récompenses : 25 PX ; annonce « Une nuit offerte au Héron Gris ». Le service gratuit n'est pas limité à une nuit (le moteur n'a pas de « une fois ») : à signaler.

## C. Le dénouement : `qui-doit-payer`

- **Lieu** : la halle du bailli. **S'ouvre** : drapeau `cle-rendue`. **Situation** (70 à 110 mots) : Aubin tient la clé ; il attend qu'on dise tout, ou rien ; ce que le groupe sait pèse sur trois familles.
- **Options** (chacune : libellé, coûts, gains, épilogue d'une phrase) :
  - `scandale` : « Dire la vérité devant tous. » **Condition** : la reconnaissance de dette, ou `f-gedeon-a-engage-la-bande`. Coûts : une famille ruinée et bannie ; un ennemi. Gains : Gédéon payé de ce qu'il a fait ; la dette de Tobie annulée. Effets : Gédéon, Tobie, Mère Pivoine `parti` ; attitude de Gédéon −100.
  - `silence` : « Payer la dette de Tobie et rendre la clé en secret. » **Condition** : `f-gedeon-et-la-dette`. **Requis** : 90 po (grisé sinon). Coûts : 90 po de votre poche (net −30 po après la prime) ; Gédéon reste impuni. Gains : Tobie et sa mère restent à la foire. Effets : −90 po.
  - **bloc `abstention`** (à part des options, comme le veut le moteur) : « Je rends la clé et je ne dis rien. » Coûts : Gédéon impuni **et** la dette demeure ; Tobie reste menacé. Aucun effet de plus.
- **Pas d'écho différé** : l'épisode s'achève au choix ; la conséquence visible vient avec l'épilogue.

## D. Les fins (`fins/`)

| Fin | Condition | Épilogue |
| --- | --- | --- |
| `fin-scandale` « Le scandale » | `choix-qui-doit-payer-scandale` | 80 à 120 mots : la halle, la foule, Gédéon ruiné, Tobie et sa mère s'éloignent sur la route ; le goût amer |
| `fin-silence` « Le silence » | `ou` : `choix-qui-doit-payer-silence`, `choix-qui-doit-payer-abstention` | 80 à 120 mots : la foire s'ouvre, la corde au-dessus de la place, Tobie remonte sur sa corde ; **variante** `choix-qui-doit-payer-abstention` : la foire s'ouvre, mais la dette n'est pas payée |

Chaque fin garde 3 `consequences` (lignes de 6 à 12 mots).

## E. Les échos (`monde.json`, `campagne.emet`)

- `epi1-gedeon-vengeur` — quand `choix-qui-doit-payer-scandale` — « Gédéon Marchebise, ruiné à Verdelle, n'a pas oublié qui l'a dénoncé. »
- `epi1-tobie-reconnaissant` — quand `choix-qui-doit-payer-silence` — « Tobie Pivoine, funambule de Verdelle, se souvient de qui a payé sa dette. »

## F. Branchements dans les données existantes (par script, après ton oui)

- **Effets de quête** : `aubin-cle` lance `q-la-cle-de-la-foire` ; `brun-colis` lance `q-le-colis-du-forgeron` ; `colombe-rats` lance `q-les-rats-de-la-cave` ; sujets nouveaux `aubin-rendre`, `brun-recu`, `colombe-rats-fait` (textes Haiku) ; condition de quête sur le trésor du colis ; conditions « quête non terminée » sur les deux trésors de la clé ; lien `verdelle` → pont du Meunier conditionné (I8).
- **Salutations** : `cle-rendue` (Aubin, drapeau `cle-rendue`) et `colis-remis` (Brun, drapeau `q-le-colis-du-forgeron-rendue`).
- **Recoupement** : événement `ev-recoupement-tobie` (I9) ; **cas limite** : piège du coffre-fort qui déplace Gédéon (I11).
- **Chapitre** : `chapitres[0].quetes` = les trois quêtes (V8).

## G. Chemin le plus court (à prouver par `pnpm monde parcours --chemin`)

Place ou Colombe → Aubin (`aubin-cle`, quête principale) → route du moulin → hommes de main (payer 20 po) → cour → Rouquin (combat, pas de levier) → forcer la trappe → grenier (fouille DD 14, ou DD 10 après la poutre) → Aubin (`aubin-rendre`, +60 po) → dilemme (abstention ou silence/scandale). Il demande de chercher, de parler, de se battre.

## H. Ce que V7 demande ensuite

Après ton oui : (1) 2 ou 3 agents Haiku écrivent ≈ 25 courts textes (journaux de quête, 3 sujets, dilemme, fins, échos, narration du recoupement, 2 choix d'origine) ; (2) j'écris les structures (3 quêtes, dilemme, fins, événement, branchements) ; (3) audit, `pnpm monde valider`, **`pnpm monde parcours`** pour prouver chaque fin, puis présentation. Puis V8 (vérification d'ensemble, images, voix, publication).
