---
name: creer-intrigue
description: Écrire ou régler la colonne vertébrale d'une histoire de « La Table du Conteur » : la quête principale (étapes, embranchements, échec), les quêtes secondaires et de faction, les factions et la réputation, la jauge (l'horloge du danger : paliers, évolution, ce qui la freine), les événements du monde et les fins (condition, effet, épilogue). À utiliser pour la « zone centrale » d'un nouveau monde, quand l'utilisateur parle d'intrigue, de quête principale, de fins, de « l'histoire n'avance pas », « la fin ne se déclenche pas », « la fin arrive trop tôt », d'horloge, de menace qui monte, de factions, ou quand le validateur donne un avis « Enjeu », « Jauge », « PX », « Fait clé », « Aucune quête principale ». Complète `creer-monde` (canon, zones), `creer-dilemmes` (choix et échos) et `creer-contrats`.
---

# L'intrigue : quêtes, jauge, événements, fins

L'intrigue est la seule partie du monde que le joueur **traverse** au lieu de la visiter : une question posée au début, une menace qui monte, des choix qui ferment des portes, une fin qui répond. Dans le moteur, ce sont cinq sortes de données reliées par des **drapeaux** et des **faits** : quêtes, factions, jauges, événements, fins. Une erreur ici ne se voit pas au validateur (tout est « valide ») mais casse la partie : une fin qui n'arrive jamais, ou qui arrive dès la première action.

Format : `packages/regles/src/monde/schemas.ts` (`Quete`, `Faction`, `Jauge`, `EvenementMonde`, `Fin`, `Condition`, `EffetMonde`), `docs/MONDES.md` § « Conditions et effets ». Gabarits JSON validés : `references/gabarits.md`.

## Ce que fait le moteur (vérifié dans le code)

**Après chaque action** (aller, parler, fouiller, prendre, un combat réglé…), le moteur fait, dans cet ordre (`monde/exploration.ts`, `suites`) : les évolutions de jauge sur condition, les événements sur condition, l'avancement des quêtes, les rencontres en attente, puis **les fins**.

### Quêtes
- Une quête devient active par l'effet `{ "quete": { "id", "statut": "active" } }` (un sujet de PNJ, un événement…), ou `proposee` puis le joueur l'accepte (bouton « Accepter », avec `prerequis` éventuel).
- Active, son étape `debut` est active. **Une étape s'accomplit dès que sa `completion` est vraie** ; ses `effets` s'appliquent, ses `suivantes` deviennent actives. Une étape `termine: true` clôt la quête aussitôt ; sinon la quête se clôt quand plus rien n'est actif. La quête terminée verse ses `recompenses`.
- **Toute quête qui a un `donneur` se rend** (leçon de Port-Sillage, 11/11/2026 : le joueur avait tué les rats et cherchait où valider). La dernière étape est un **retour au donneur** : texte « Retournez voir <Nom>, <où> : parlez-lui de <sujet> pour <ce qu'il y gagne> », `completion` = un drapeau (`<quete>-rendue`) posé par un **sujet du donneur** dont la `condition` est le drapeau de l'objectif atteint (le sujet de départ reçoit la condition contraire, pour ne plus se proposer), avec `termine: true` ; **le sujet pose toujours ce drapeau**, même s'il clôt aussi la quête (`quete: terminee`) : le moteur applique la clôture après les autres effets, l'étape de retour s'accomplit d'abord et ses PX sont versés (le validateur avertit « … sans accomplir son étape finale » sinon) ; une salutation variable du donneur (`et` objectif atteint, `non` rendue) rappelle qu'il attend des nouvelles. Les récompenses ne se versent qu'à ce moment, dans la voix du PNJ. Le validateur avertit (« Quêtes : … n'ont pas d'étape de retour ») quand aucune étape finale ne nomme le donneur ; seules les quêtes qui se closent sur une **fin d'histoire** (effet `fin`) en sont dispensées. Test à copier : `packages/regles/tests/quete-rendre-cave.test.ts`.
- Un effet `quete: active` ne rouvre **jamais** une quête accomplie ou échouée (le moteur l'ignore) : un sujet répétable peut rester sans danger, mais cache-le quand l'objectif est atteint.
- Une étape active dont la condition `echec` devient vraie fait **échouer** la quête (comme l'effet `quete: echouee`). L'échec a ses conséquences : bloc `"echec": { "texte": "…", "effets": [ … ] }` sur la quête (texte raconté une fois et montré dans le journal et le parchemin, effets appliqués une seule fois : jauge qui monte, attitude du donneur qui baisse, drapeau d'un épilogue). Un échec sans conséquence n'est qu'une case barrée : donne-lui un prix.
- Le texte des étapes actives est le journal du joueur : écris-le comme une consigne (« Trouver qui a ouvert la vanne »), sans solution.
- **`lieu` d'une étape** (id d'un lieu, facultatif mais conseillé dès que l'objectif est un endroit) : le journal l'ajoute entre parenthèses, la carte pose un losange rouge sur ce lieu et ses ancêtres, la sortie qui y mène porte « ◆ » et « Objectif de quête : … ». Ne le mets pas quand l'objectif est à trouver (enquête) : ce serait donner la solution.
- **Récompenses affichées** : le parchemin et le journal montrent le total (récompenses de la quête + PX, or gagné et objets donnés par les effets des étapes). Ce qui ne se compte pas (une faveur, une réduction, un titre) va dans `recompenses.annonce` (« Une chambre gratuite chez Brégor »).
- **Signes sur les PNJ** (calculés, rien à écrire) : « ! » sur le bouton « Parler à » quand un de ses sujets ouverts propose ou lance une quête pas commencée ; « ? » quand un de ses sujets ouverts clôt une quête en cours. Si un donneur n'a pas son « ? » une fois l'objectif atteint, la `condition` du sujet de rapport est fausse.

### Jauge (l'horloge)
- `min`, `max`, `initial` ; elle change par l'effet `{ "jauge": { "id", "delta" } }` ou par son `evolution` :
  - `jour` : à chaque nouveau jour ; `repos-long` : à chaque nuit de repos ;
  - `lieu` : **à chaque entrée** dans ce lieu (pas une seule fois) ;
  - `condition` : **une seule fois**, dès que la condition est vraie.
- Chaque **palier** (`seuil`) se déclenche **une fois**, quand la valeur le franchit **en montant** (par défaut, `sens: "monte"` ; `"baisse"` pour un palier qui salue le danger qui reflue) : sa `narration` est lue au joueur et ses `effets` s'appliquent. Un palier dont le seuil vaut la valeur initiale ne se déclenche jamais en montant : mets-le au-dessus. (Avant le 11/11/2026, un palier se franchissait aussi en descendant : payer le péage de la Dîme racontait « la patrouille double le péage ».) Le moteur ne pose **aucun drapeau tout seul** : pour qu'un PNJ ou une fin réagisse à un palier, mets un effet `{ "flag": "<jauge>-<n>" }` dans le palier, ou lis la jauge par une condition `{ "jauge": { "id", "min" } }`.
- Validateur : au moins 4 paliers, au moins la moitié avec des effets, et si elle monte seule, quelque chose doit pouvoir la faire baisser (un `delta` négatif dans un effet ou une évolution).

### Factions
- La réputation (`reputation` de départ, effet `{ "reputation": { "faction", "delta" } }`) n'agit que comme **condition** (`{ "faction": { "id", "min" } }`) : sur un sujet, une option, un événement, une fin. `paliers`, `relations`, `objectifs` et `chef` sont des notes pour l'auteur et le MJ : **le moteur ne les lit pas**.

### Événements
- `entree-lieu` (à l'arrivée dans `lieu`), `repos` (après une nuit de repos ; seulement si le groupe est dans `lieu` s'il est donné), `jour` (à chaque nouveau jour, même règle de lieu), `condition` (dès que la condition est vraie ; seulement dans `lieu` s'il est donné). `unique` (par défaut) : une seule fois. Ils lisent une `narration` et appliquent des `effets`. C'est l'outil des conséquences (« trois jours après ton choix… ») et des coups de théâtre.

### Fins
- **Deux voies** : l'effet `{ "fin": "<id>" }`, et la **`condition`** de la fin, évaluée après chaque action (la première vraie gagne). Une condition vraie trop tôt termine l'histoire sans prévenir ; le validateur refuse désormais une condition **déjà vraie au départ**, mais pas une condition qui deviendrait vraie trop tôt (un fait appris au chapitre 1).
- Le modèle sûr : la condition d'une fin est **le drapeau de son issue**, posé par l'étape d'issue de la quête principale (ou le dernier palier de la jauge), qui porte aussi `{ "fin": "<id>" }`.
- `epilogue` est lu à la fin ; `consequences` n'est pas lu par le moteur (notes). Les épilogues des dilemmes s'ajoutent (`creer-dilemmes`).

## Concevoir

1. **Une question, trois réponses qui coûtent.** L'intrigue tient en une question (BIBLE : « intrigue en une phrase ») ; chaque fin y répond autrement, aucune n'est entièrement heureuse, et au moins une dépend de la jauge (avis « Enjeu »). Au moins trois fins.
2. **La quête principale, en actes.** Un acte = une étape (ou deux en parallèle) dont la `completion` est un **fait** appris ou un **drapeau** posé, jamais un seul jet. Structure éprouvée (la Citadelle) : des étapes d'enquête qui posent des faits ; une étape `choix` (completion `ou` des drapeaux de choix) ; puis une étape `issue-<x>` par fin (completion = son drapeau, `termine: true`, effets `{ "xp" }` + `{ "fin" }`). Une fin atteignable avant le choix (livrer, fuir) met `{ "fin" }` et `{ "quete" … "terminee" }` dans l'effet du sujet qui la décide.
3. **Le fait clé a trois sources** : tout fait exigé par une `completion`, un passage ou une fin doit pouvoir s'apprendre de trois façons (un PNJ, un lieu à fouiller, un objet ou un trésor `indice`) ; avis « Fait clé » sinon.
4. **L'horloge se voit et se combat.** 4 à 6 paliers, des effets réels (un PNJ part, une route se ferme, une rencontre se déclenche), une évolution lisible (`jour`, ou `lieu` pour un endroit qui use) et au moins deux moyens de la freiner (une quête secondaire, un dilemme, un objet). Annonce le prochain palier dans la narration du précédent.
5. **Les factions servent des choix.** 3 à 5 factions, chacune avec ce qu'elle veut et ce qu'elle offre ; leur réputation ouvre ou ferme des sujets, des options de dilemme, une fin. Pas de faction décorative.
6. **Les événements donnent le rythme** : un événement par palier ou par choix majeur, des échos à quelques jours (`jour` + `condition`), un événement d'ouverture.
7. **Les quêtes secondaires** (6 par chapitre visé par le validateur) tiennent en dix minutes, ont une chute et, idéalement, touchent la jauge ou une faction ; **chacune se rend à son donneur** (étape de retour, voir « Quêtes »). Les **quêtes de faction** récompensent en réputation. Les petites quêtes de combat : `creer-contrats`.
8. **Les PX** : `recompenses.xp` des quêtes et les rencontres doivent mener au niveau maximum du monde (avis « PX »).

## Écrire
- Claude conçoit l'intrigue dans la BIBLE (secret, fins, factions, jauge, registre des drapeaux et faits, §7) ; il écrit **lui-même** la quête principale, les fins et la jauge, ou les confie à l'agent de la **zone centrale** (`creer-monde/references/prompts-zones.md`) avec les ids exacts du registre.
- Les dilemmes qui décident d'une fin : `creer-dilemmes` (drapeaux `choix-<dilemme>-<option>`).
- Tous les drapeaux et faits viennent du **registre** : un drapeau lu mais jamais posé (ou l'inverse) est le défaut n°1 (atelier : Registre et Graphes).

## Vérifier
- [ ] `pnpm monde valider <id>` : aucune erreur (dont « condition déjà vraie au départ »), pas d'avis « Enjeu », « Jauge », « PX », « Fait clé », « Aucune quête principale ».
- [ ] **Chaque fin arrive, et pas trop tôt** : `pnpm monde parcours <id>` (une fin non atteinte est une piste) ; atelier, Graphes > dépendances d'une fin ; un cas par fin dans `packages/regles/tests/monde.test.ts`. Relis chaque `condition` de fin : peut-elle devenir vraie avant le choix final ?
- [ ] Chaque étape de quête a une `completion` atteignable (le validateur détecte une étape inatteignable) et un texte de journal clair.
- [ ] Chaque palier de jauge a une narration qui fait sentir la montée ; au moins la moitié changent le monde ; le joueur peut la freiner.
- [ ] Les réputations de faction sont lues quelque part (sinon, la faction ne sert à rien).
- [ ] **Joue-le** : de la première scène au premier palier de la jauge, puis jusqu'au choix final, par les vrais boutons.

## Les pièges connus
- **Fin trop tôt** : une condition de fin sur un fait que le groupe apprend au chapitre 1 termine l'histoire. Condition = le drapeau de l'issue.
- **`lieu` dans l'évolution d'une jauge** : elle bouge à **chaque** entrée ; pour une seule fois, utilise `condition: { "lieu": "<id>" }`.
- **Palier sans drapeau** : rien ne peut réagir à un palier si son effet ne pose pas de drapeau (ou si personne ne lit la jauge).
- **Paliers et relations de faction** : de la documentation, pas des règles.
- **Étape qui s'accomplit seule** : une `completion` déjà vraie quand l'étape devient active l'accomplit aussitôt (pratique pour enchaîner, piège si c'est involontaire).
- Avant de commiter : `docs/JOURNAL.md`, et l'accord de l'utilisateur.
