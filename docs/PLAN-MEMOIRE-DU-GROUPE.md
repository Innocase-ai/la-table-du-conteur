# Plan : une mémoire de ce que le joueur a fait (lieux, combats, personnes vues)

> Document de travail du 10/11/2026, **à valider avant tout code**. Rien n'est implémenté.

## 1. Le constat

Le joueur trouve que les PNJ parlent sans « savoir » ce qu'il a fait : où il est passé, qui il a combattu, qui il a rencontré. Ce que le jeu garde déjà, et ce qui manque :

| Mémoire | Où elle vit aujourd'hui | Lue par le conteur ? | Lue par les textes écrits ? |
|---|---|---|---|
| Faits appris | `EtatMonde.faits` | oui (majeurs tous, 10 récents) | oui (`{ fait }`) |
| Quêtes, étapes | `EtatMonde.quetes` | oui | oui |
| Choix de dilemmes | module `dilemmes` | oui (`Choix faits`) | oui (`choix-<dilemme>-<option>`) |
| PNJ disparus | `pnjEtats` | oui | oui (`{ pnj: { etat } }`) |
| Réputations, attitudes | `reputations`, `attitudes` | attitude du PNJ seulement | oui |
| Sujets déjà abordés | `exploration.sujetsVus` | oui (« déjà dit ») | non |
| Lieux visités | `lieuxVisites` | **non** | oui (`{ lieu }` = « est déjà passé par »), mais pas de nom de lieu dans le dossier |
| Rencontres faites | `rencontresFaites` | **non** | **non** |
| **Issue** des rencontres (victoire, négociation, fuite, défaite) | **nulle part** | non | non |
| PNJ rencontrés, à qui on a parlé | **nulle part** (déduit de `sujetsVus`) | partiel | non |
| Qui a vu quoi (crochetage, combat, vol) | `exploration.vus` (crochetage seulement) | non | confrontation du PNJ seulement |
| Événements anciens (au-delà de 14) | journal | **non** | — |

Deux manques distincts :

1. **Le conteur** (saisie libre, parole libre) ne reçoit ni lieux, ni combats, ni PNJ vus, et oublie tout ce qui n'est ni un fait ni une quête au-delà de 14 événements.
2. **Les textes écrits** (sujets, salutations) ne peuvent réagir qu'à des drapeaux posés à la main : aucune condition « a vaincu », « a épargné », « a parlé à » (la condition `{ lieu }` dit déjà « est passé par »). Un auteur ne peut donc pas écrire « vous avez tué mes hommes » sans câbler un drapeau par rencontre.

## 2. Principes

- **Le moteur calcule la mémoire, le conteur la lit** (« le LLM propose, le moteur décide ») : aucune mémoire n'est écrite par un LLM, rien n'est oublié au rechargement.
- **Un PNJ ne sait que ce qu'il a pu savoir** : ce qui s'est passé chez lui, ce qu'il a vécu avec le groupe, ce que ses proches ont pu lui dire (règle de factions), les rumeurs que l'auteur a déclarées. Il ne sait **pas** tout. Sans cela, le monde devient omniscient et perd son immersion.
- **Aucun secret dans le dossier** : il ne contient que ce que le *groupe* a fait ou appris, jamais la bible.
- **Compatible avec les anciennes sauvegardes** : tous les nouveaux champs sont optionnels (comme `escortes`, `heros`, `heure`), pas de changement de version.
- **Léger en coût** : le dossier tient en quelques centaines de caractères et se calcule à chaque tour.

## 3. Phase 1 — Le registre du groupe (moteur pur, `packages/regles`)

Fichiers : `monde/etat.ts`, `monde/exploration.ts`, `monde/dialogue.ts`, `monde/schemas.ts`.

1. **Ce qu'on enregistre** (dans `EtatExploration`, optionnel) :
   - `issues: Record<rencontreId, { type: 'victoire' | 'alternative' | 'fuite' | 'defaite'; alternative?: string; jour: number; lieu: string }>`, écrit dans `issueRencontre` (aujourd'hui l'issue se perd) ;
   - `pnjVus: Record<pnjId, { premierJour: number; dernierJour: number; paroles: number }>`, écrit dans `parler` (et à l'arrivée d'un PNJ dans la scène) ;
   - `temoins: { lieu: string; jour: number; genre: 'combat' | 'crochetage' | 'vol' | 'piege' | 'mort'; ref: string }[]` (plafonné à ~40 entrées), qui généralise `exploration.vus` : qui était présent quand.
2. **Nouvelles conditions d'auteur** (type, schéma Zod, `evaluerCondition`, références dans `monde/references.ts`, validation, atelier) :
   - `{ "rencontre": { "id": "<rencontre>", "issue": "victoire" | "alternative" | "fuite" | "defaite", "alternative": "<id>" } }` : issue connue de cette rencontre (`issue` et `alternative` facultatifs : sans eux, « a été jouée ») ;
   - `{ "parle": "<pnj>" }` : le groupe a déjà parlé à ce PNJ ;
   - `{ "temoin": { "pnj": "<pnj>", "genre": "…" } }` : ce PNJ était présent quand le groupe a fait cela (facultatif en première version).
3. **Les effets** n'ont pas besoin de nouveaux types : les conditions lisent le registre.
4. **Tests** : un fichier `memoire.test.ts` (enregistrement de l'issue après victoire, négociation, fuite, défaite ; `parle` ; anciennes sauvegardes sans le champ ; plafond de `temoins`), plus le test de validation (id inconnu dans une condition).

Sortie de phase : un auteur peut écrire « si le groupe a vaincu la bande, le meunier a peur », sans drapeau manuel.

## 4. Phase 2 — Le dossier du groupe pour le conteur (faite le 10/11/2026 : `conteur/memoire.ts`, règle 13 du prompt, `docs/M4-CONTEUR.md` §16 ; le résumé des événements anciens et l'essai réel payant restent à faire)

Fichiers : `conteur/contexte.ts` (section « Ce que le groupe sait et a fait », `portrait`), `conteur/outils.ts` (rien : le jeu d'outils reste identique).

1. **`dossierDuGroupe(partie, dm)`** : fonction pure qui renvoie quelques lignes :
   - *Lieux parcourus* : par chapitre ou région, du plus récent au plus ancien, 12 noms au plus (les autres comptés) ;
   - *Combats et rencontres* : « bande du Gué : vaincue (jour 3) ; patrouille du Fer-Gris : fuite (jour 5) » ;
   - *Personnes rencontrées* : noms et dernier jour de parole ; *compagnons* avec le temps passé ensemble ;
   - *Réputations en mots* (« les Gardiens vous tiennent en estime ») ;
   - *Souvenirs anciens* (au-delà des 14 derniers événements) : résumé **déterministe** (les rencontres, les choix, les morts, dans l'ordre), pas un résumé par LLM.
2. **Budget** : une limite en caractères (≈ 1 200), les plus récents et les plus importants d'abord.
3. **Par PNJ** : dans `portrait`, une ligne « Ce que ${nom} sait du groupe » : l'a-t-il déjà vu ? parlé ? combats ou vols dont il a été témoin ? réputations de sa faction ? Les autres souvenirs lui sont inconnus.
4. **Consigne ajoutée au prompt** (règle 13) : un PNJ n'évoque du passé du groupe que ce qui figure dans « Ce que … sait du groupe » ou dans les faits qu'il connaît ; il ne devine rien d'autre ; s'il doit réagir à un souvenir précis (combat, vol, lieu), il le fait au présent, dans sa voix.
5. **Sécurité** : le dossier est ajouté aux textes « visibles » du détecteur de fuite (`secrets.ts`) comme les faits appris ; il ne contient pas de bible.
6. **Tests** : fiche contenant le dossier, plafond, PNJ non témoin qui ne reçoit pas le souvenir, ordre chronologique, parties anciennes.

Coût : ≈ +300 à 400 jetons d'entrée par tour (de l'ordre de +5 à 10 % d'un tour). À mesurer par un essai (voir §7).

## 5. Phase 3 — Les textes écrits qui changent selon le parcours

Fichiers : `monde/schemas.ts` (`Sujet`), `monde/dialogue.ts`, `monde/validation.ts`, `monde/revue.ts`, `docs/MONDES.md`, skills `creer-personnages` et `creer-rencontres`.

1. **`Sujet.variantes`** (point 3 de l'audit du moteur d'histoire) : `[{ condition, reponse }]`, la première variante vraie remplace la `reponse` de base (les `revele` et `effets` du sujet restent). Les salutations ont déjà des variantes.
2. **Validation** : conditions valides, variantes de longueur ≥ 35 mots, pas de style indirect (avis existants étendus) ; **revue de secrets** (`champsLibres`) sur les nouvelles réponses.
3. **Passe d'écriture par monde**, comme pour les interjections : Claude choisit les conditions (qui a vaincu quoi, quels lieux), Haiku écrit les textes, Claude relit. Départ proposé : **le Val des Cendres** (Fer-Gris, Brand, Hesta, Aurèle, Gaspard), 2 à 4 variantes sur les sujets les plus visibles de 8 à 10 PNJ ; puis la Citadelle, Port-Sillage, la Dîme.

## 6. Phase 4 — Clarté et longueur des réponses (faite le 10/11/2026 : consignes du conteur, outil de parole libre, bouton « Dis-le plus simplement », skill `creer-personnages` ; `docs/M4-CONTEUR.md` §17 ; seuil de 50 mots abandonné, voir §17 ; essai réel à faire)

Indépendante de la mémoire mais complémentaire :

- structure de réponse **réponse franche → détail concret → piste** (60 à 100 mots) pour la parole libre et pour les textes écrits ;
- règle de clarté du conteur (nommer ce que le joueur ne connaît pas encore, voix qui assaisonne sans porter le message) ;
- esquives **explicites** (« je n'en parlerai pas »), au lieu de la réponse à côté ;
- plafonds relevés (`MOTS_MAX` des répliques libres dans `modules/savoirs.ts`, `1 à 4 phrases` → 3 à 6) ;
- rappel « ce que vous retenez » après une longue réponse, bouton « Dis-le plus simplement » dans l'interface.

## 7. Vérification

1. Après chaque phase : `pnpm typecheck`, `pnpm --filter jeu typecheck`, `pnpm test`, `pnpm monde valider`.
2. **Essai réel, payant, à valider avec toi avant de le lancer** : 15 à 20 questions par PNJ sur 3 PNJ (un par monde) avec une partie préparée (`!lieu`, `!fait`, `!attitude`), avant et après les phases 2 et 4, `pnpm conteur … --essai`. Ordre de grandeur : ≈ 0,003 $ le tour, soit **moins de 0,50 $** pour tout l'essai. Je te l'annonce et j'attends ton accord.
3. Dans le jeu : une partie du Val où l'on combat le Fer-Gris puis où l'on parle à Hesta, à Kor Varnak et à un PNJ qui n'était pas là.

## 8. Ordre proposé et décisions à prendre

Ordre : **Phase 1 → Phase 2 → Phase 4 → Phase 3** (le moteur d'abord ; l'écriture des variantes à la fin, quand les conditions existent et que la parole libre est bonne).

À décider avec toi :

1. **Un PNJ sait-il tout (simple) ou seulement ce qu'il a pu voir (recommandé) ?**
2. **Résumé des événements anciens** : déterministe (recommandé, gratuit, sans invention) ou compacté par un LLM (plus fluide, mais coûte, et peut déformer).
3. **Combien de souvenirs** pour le conteur : 1 200 caractères, plus ou moins ?
4. **Quels souvenirs en premier** : combats, personnes vues, lieux, choix (je propose combats + personnes vues).
5. **Premier monde pour la passe d'écriture** (proposé : le Val).

## 9. Risques

- Un dossier trop long noie le conteur : budget plafonné et tests de coupe.
- Un PNJ « omniscient » par erreur : la règle du témoin et un test dédié.
- Anciennes sauvegardes : champs optionnels, jamais de lecture sans valeur par défaut.
- Les conditions ajoutées doivent être comprises par l'Atelier d'auteur et le simulateur de parcours (`verification/parcours.ts` doit en tenir compte : l'identité d'un état change).

## 10. Volet « grand monde » : Ombresang (une sauvegarde, des centaines de mini-histoires)

Contexte décidé (08/11/2026) : Ombresang est **un seul jeu**, une partie unique qui traverse 64 sous-régions et ~340 lieux ; chaque lieu est une mini-histoire de 20 à 40 min, liée au fil rouge ; drapeaux préfixés `camp-` (globaux) et `lr-` (locaux) ; des packs de régions ajoutés plus tard. Le plan ci-dessus (une partie de quelques heures) ne suffit pas : il faut une mémoire dont **le coût de lecture reste fixe** quand le jeu grossit. Le moteur n'a pas été testé à cette échelle (audit « à l'échelle » déjà prévu pour Ombresang) ; ce volet en fait partie.

### 10.1 Quatre niveaux de mémoire

1. **Monde** : l'état du fil rouge (jauge « Battement du Cœur », sceaux, camps), réputations de faction, PNJ disparus. Toujours lu, quelques lignes.
2. **Sous-région** : les histoires déjà closes dans cette sous-région, avec leur issue en une phrase.
3. **Lieu courant** : ses PNJ, ses rencontres faites, ce qui s'y est passé (le registre de la phase 1).
4. **PNJ** : ce que ce PNJ a pu voir ou apprendre du groupe (règle du témoin, phase 2).

### 10.2 Le « souvenir » d'une histoire close

- **Unité** : la quête principale locale d'un lieu (statut `terminee` ou `echouee`) et son issue (fin ou drapeau de fin). Le moteur la déduit de `quetes`, des drapeaux et des choix de dilemmes déjà gardés.
- **Un champ d'auteur en plus**, facultatif, sur la quête : `souvenir: { resume, portee, etiquettes }` : une phrase de résumé (≤ 25 mots), la **portée** (`lieu` | `sous-region` | `region` | `monde`) et des étiquettes (région, faction, PNJ, relique).
- **Registre dérivé, pas de nouvel état lourd** : `histoiresClosesDe(partie)` calcule la liste ; seul un petit index (`id → jour de clôture`) est stocké.

### 10.3 Ce que le conteur lit (taille fixe)

Dossier = niveau monde en entier + **4 à 5 souvenirs** choisis par score déterministe (même sous-région, étiquette commune avec le PNJ ou la faction du moment, portée monde, récence) + lieu courant + ce que le PNJ présent sait. Même budget (≈ 1 200 caractères, à régler par essai) à 5 histoires jouées ou à 200. Aucun embedding ni appel IA pour choisir.

### 10.4 Qui sait quoi, ailleurs dans le monde (portée et rumeurs)

- Un souvenir de portée `lieu` n'est connu que de ceux qui y étaient ; `sous-region` : des PNJ de la sous-région, après un délai ; `region` : de la région, délai plus long ; `monde` : de tous.
- Le délai se compte en jours de jeu (`etat.jour`) : un exploit se répand plutôt qu'il n'est su partout le lendemain.
- Un PNJ lit le souvenir par la même condition d'auteur que le reste (`{ "histoire": { "id": "<quête>", "issue": "…" } }`) : une mini-histoire peut réagir à une autre, de façon croisée entre sous-régions.

### 10.5 Taille de la sauvegarde et packs ajoutés

- Détail ancien plafonné (`temoins`, `pnjVus`) ; pour une histoire close, seul le souvenir compact reste. Estimation : quelques dizaines de Ko pour 340 lieux, à mesurer.
- Tout est indexé par des **identifiants stables** ; une condition vers une histoire d'un pack absent est **fausse** (jamais une erreur), donc un pack futur ne casse aucune sauvegarde.
- **Validateur** : une condition `histoire` ne peut viser qu'un identifiant **déjà publié** (ou du même pack), pour éviter les dépendances sur du contenu futur.
- Les identifiants publiés ne changent plus (règle à écrire dans les skills `creer-monde` et `decrire-lieux`).

### 10.6 Côté joueur : la « Chronique du voyage »

Un onglet du Journal qui liste les histoires closes (titre, issue, phrase de résumé, jour), groupées par région. Mêmes données que le conteur, **gratuit**, et utile pour reprendre une partie après une pause. Le Journal a déjà une « Chronique des choix » (dilemmes) : la nouvelle s'y ajoute.

### 10.7 Ordre et vérification

1. **Maintenant, pour Lame-Rousse** : phase 1 du plan (issues, `rencontre`, `parle`, `temoin` ; la condition `{ lieu }` existe déjà et veut dire « est passé par ») en écrivant les structures de façon à tenir à grande échelle (identifiants stables, champs optionnels).
2. **Ensuite** : `Quete.souvenir`, condition `histoire`, dossier à taille fixe (10.3).
3. **Quand 2 ou 3 sous-régions existent** : portées et rumeurs (10.4), plafonnement (10.5), Chronique (10.6).
4. **Test à l'échelle** : partie synthétique de 340 histoires closes ; mesurer la taille de la sauvegarde, le temps de construction du dossier et la taille du dossier (doit rester sous son plafond). Intégré à l'audit « à l'échelle » d'Ombresang.

Décisions à prendre avec toi : unité de mémoire = la quête principale locale du lieu (recommandé) ; délais de propagation par portée (à régler à l'essai) ; la Chronique visible au joueur dès la première histoire ou plus tard.
