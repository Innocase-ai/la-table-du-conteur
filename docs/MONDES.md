# Format des mondes

Le moteur est le même pour tous les mondes. Un **monde** est une histoire jouable : un dossier de fichiers JSON dans `packages/mondes/<id>/`, validé par des schémas et par un validateur. Écrire un nouveau monde, c'est écrire des données, pas du code.

Référence du format : [packages/regles/src/monde/schemas.ts](../packages/regles/src/monde/schemas.ts). Validation : `pnpm monde valider [monde]`. Document lisible généré : `pnpm monde doc [monde]` (écrit `docs/mondes/<monde>.md`).

## Principe : le MJ lit une bible, le moteur tient les comptes

- Le **récit** est improvisé par le MJ (Claude), mais il s'appuie sur des **faits** écrits à l'avance et ne peut pas les contredire.
- Tout ce qui se compte est dans l'**état du monde** (`monde/etat.ts`) : drapeaux, faits connus, jauges, réputations, attitudes des PNJ, inventaire, quêtes, lieux visités. Il est sauvegardable tel quel en JSON.
- Les **conditions** et les **effets** forment un petit langage commun à tout le monde (lieux, PNJ, quêtes, événements) : le MJ n'a pas à deviner si une porte est ouverte ou si une quête avance, le moteur le sait.
- Les **règles** (combat, jets, sorts) viennent du SRD ; les **monstres** et les **objets** viennent des catalogues du SRD, complétés par des objets propres au monde.

## Contenu d'un dossier de monde

```
packages/mondes/<id>/
  monde.json        identité, ton, niveaux, départ, direction artistique, chapitres, règles pour le MJ
  lieux/            régions, villes, villages, hameaux, camps, routes, grottes, donjons, salles, bâtiments
  pnj/              personnages, marchands, compagnons
  objets/           objets propres au monde (uniques, reliques, objets de quête)
  tresors/          trésors placés dans les lieux
  tables/           tables de butin pondérées
  rencontres/       combats, rencontres sociales ou mixtes
  pieges/  enigmes/ pièges (détection, désamorçage, dégâts) et énigmes (solution vérifiable)
  quetes/           quêtes à étapes et ramifications
  factions/         factions, réputation, relations
  jauges/           compteurs qui évoluent (la Cendre, la peur, l'heure…)
  evenements/       déclencheurs narratifs
  fins/             fins possibles, avec leurs conditions
  faits/            les vérités du monde, découvertes peu à peu
```

Chaque fichier contient un tableau (ou un objet) d'entités. L'identifiant (`id`, kebab-case ASCII sans accents) est unique pour un type d'entité dans le monde.

| Entité | Ce qu'elle porte |
| --- | --- |
| **Lieu** | Type, parent (arbre région → ville → quartier → bâtiment, ou donjon → niveau → salle), liens vers d'autres lieux (durée en heures, porte verrouillée, passage secret, condition, **`description` et `retour` : la phrase que le joueur lit sous le bouton de sortie, vue de chaque côté**), description pour le MJ, **`accroche`** (la phrase lue sous le bouton qui y mène depuis le parent), **prompt visuel** pour l'illustrateur, rencontres déclenchées, faits à découvrir, **repos** (`sur` : on y dort une nuit, repos long : auberge, camp, refuge, maison ; `dangereux`, défaut : une halte seulement, on n'y dort pas ; `impossible` : aucun repos). **Chaque donjon doit contenir au moins un lieu `sur`** (le validateur le signale) |
| **PNJ** | Espèce, rôle, apparence (portrait), personnalité (traits, voix, désir, peur), faction, attitude initiale (−100 à 100), savoir, secrets (avec jet, condition ou prix), **sujets de conversation** (`question` : le libellé du bouton, ce que dit ou fait le joueur ; mots déclencheurs ; réponse ; faits révélés ; effets), boutique, services, profil de combat, rôle de compagnon (classe, niveau, quête personnelle, répliques) |
| **Objet** | Catégorie, rareté, valeur, résumé de jeu, histoire, **base SRD** (obligatoire pour une arme, une armure ou un bouclier : le catalogue du SRD, commun à tous les mondes, fournit leurs caractéristiques ; l'objet n'ajoute que son nom, ses bonus et son histoire), bonus, usage, DD d'identification et `inconnu` (nom et résumé vagues montrés tant que l'objet n'est pas identifié) ; un catalogue du SRD (équipement, objets magiques) est partagé par tous les mondes. Les boutiques, butins et récompenses peuvent aussi citer directement une **arme ou une armure du SRD** par son id (`epee-longue`, `cotte-de-mailles`) |
| **Trésor** | Lieu, contenant, contenu (pièces, objets, tables), accès (caché, verrouillé, piégé), gardien, indice |
| **Table de butin** | Entrées pondérées (objet, pièces, autre table), palier de niveau |
| **Rencontre** | Type, difficulté, monstres du SRD, carte tactique, alternatives (négocier, ruser, fuir), butin, effets de victoire |
| **Piège** | Détection, désamorçage, déclenchement, sauvegarde, dégâts |
| **Énigme** | Énoncé, **solution vérifiable par le moteur** (séquence, mot de passe, leviers, placement, cadran, déduction), indices graduels, récompense |
| **Quête** | Donneur, étapes qui s'achèvent d'elles-mêmes quand leur condition devient vraie, suites, échecs, récompenses ; une étape marquée `termine` clôt la quête aussitôt (fins alternatives) ; sinon la quête se clôt quand la dernière étape active, sans suite, est accomplie |
| **Faction, Jauge, Événement, Fin, Fait** | Réputation et relations ; compteurs à paliers ; déclencheurs ; conditions d'achèvement et épilogue ; les vérités que le MJ connaît |

## Données des modules : les scènes narrées

Un monde peut contenir des dossiers que le format de base ne connaît pas : chacun appartient à un module du moteur, qui le valide (`pnpm monde valider` et les tests le font pour tous les modules). Le premier est **`scenes/`** (module Scènes narrées, `packages/regles/src/modules/scenes.ts`).

Une scène est une petite cinématique jouée quand quelque chose arrive :

```json
{
  "id": "la-lanterne-faiblit",
  "nom": "La Lanterne faiblit",
  "declencheur": { "quete": "q-la-lanterne-faiblit", "statut": "active" },
  "plans": [
    { "image": { "groupe": "pnj", "id": "hesta-cendrebrune" }, "mouvement": "approche", "texte": "Hesta Cendrebrune, la Mère-Gardienne…" }
  ]
}
```

- **Déclencheurs** : `{ "debut": true }` (ouverture de l'histoire), `{ "lieu": id }` (première entrée), `{ "quete": id, "statut": "active" | "terminee" | "echouee" }`, `{ "fait": id }`, `{ "fin": id }`. Une scène `unique` (par défaut) ne se joue qu'une fois ; on la revoit depuis l'onglet Journal.
- **Plans** : une image du monde (groupe du manifeste et id : lieu, PNJ, monstre, objet), un mouvement de caméra (`approche`, `recul`, `gauche`, `droite`, `fixe`), le texte lu et affiché, une durée minimale facultative.
- **Présentation** : `"plans"` (par défaut) montre un plan à la fois, le joueur avance avec « Suivant » ; `"film"` joue la scène d'une traite, comme une vidéo : carton de titre (le `nom` de la scène), images en fondu enchaîné, texte qui défile au rythme de la voix, puis le titre revient avec « Commencer l'aventure » (ouverture) ou « Reprendre ». À réserver au **prologue** (la scène `{ "debut": true }`, 5 ou 6 plans, environ une minute) et aux épilogues.
- **Voix** : `pnpm voix generer <monde> --go` fait lire chaque plan par un modèle audio (OpenRouter) et écrit `voix/<scene>-<plan>.mp3`, livré avec le monde, et `voix/<scene>-<plan>.json` (texte, transcription, durée, coût : pour relire ce qui a été dit ; non livré au joueur). Une lecture infidèle (mots ajoutés ou oubliés) ou trop longue est refaite, trois fois au plus, sinon le fichier n'est pas écrit. Sans fichier, le jeu utilise la voix de synthèse du système, que le joueur peut couper. Coût : environ 0,001 $ par plan avec `gpt-audio-mini`. Un plan dont le texte a changé depuis sa lecture est refait au prochain `generer`. Le serveur de développement (`pnpm jeu`) ne voit pas les fichiers ajoutés dans `packages/mondes` : relance-le après une génération.
  **VOIX OFFICIELLE du Maître de jeu (décision de l'utilisateur, 04/11/2026), pour toutes les histoires** : `gpt-audio` est un modèle de conversation qui lit « comme un robot » ; toutes les scènes sont lues par **Gemini Flash TTS**, avec les mêmes réglages, qui sont les défauts de l'outil (celui des répliques de combat) : `pnpm voix essai <monde> --scene id --plan n --timbres Orus,Algieba` (plusieurs timbres sur un plan, rien n'est livré), puis `pnpm voix generer <monde> --go` (timbre Algieba, ×1,15 : rien à préciser ; `--moteur gpt` pour l'ancienne lecture ; `--refaire` pour remplacer des voix existantes, `--plans 2,3` pour certains plans). L'audio brut est gardé dans `sorties/voix-scenes/<monde>/` : `pnpm voix convertir <monde> --tempo 1.2` règle le débit sans aucun appel. Réglage officiel (ne pas en changer) : timbre **Algieba**, débit **×1,15**, style « conteur naturel, intonations nuancées mais retenues » (un premier style plus théâtral a été jugé « trop accentué »). Coût : ≈ 0,003 $ par plan de 30 mots.
- **Règles d'écriture** : le texte est lu au joueur, au présent ou au passé de conte, sans rien dévoiler qu'il ne découvre au même moment ; deux ou trois phrases par plan, trois ou quatre plans par scène.

## Données des modules : les dilemmes

Le second dossier d'extension est **`dilemmes/`** (module Dilemmes, `packages/regles/src/modules/dilemmes.ts`, format dans `monde/dilemmes-donnees.ts`). Un dilemme est un **choix difficile** : le joueur lit ce que chaque option coûte et rapporte *avant* de trancher, et ne pas trancher a aussi un prix.

```json
{
  "id": "le-pli-scelle",
  "titre": "Le pli scellé",
  "situation": "Lise Morvan vous tend un pli…",
  "quand": { "quete": { "id": "q-fal-courrier-ligue", "statut": "active" } },
  "delai": 3,
  "options": [
    { "id": "porter", "libelle": "Je le porte fermé.", "ton": "Loyauté",
      "couts": ["Vous ignorerez ce qu'il contient"], "gains": ["La Ligue vous fait confiance"],
      "effets": [{ "reputation": { "faction": "ligue-des-phares", "delta": 10 } }], "epilogue": "…" },
    { "id": "ouvrir", "libelle": "Je l'ouvre en cachette.", "couts": ["Si le jet échoue, la Ligue le saura"], "gains": ["Vous apprenez la vérité"],
      "jet": { "competence": "escamotage", "dd": 14 },
      "effets": [{ "fait": "f-ligue-et-phare-cellule" }], "echec": [{ "reputation": { "faction": "ligue-des-phares", "delta": -10 } }] }
  ],
  "abstention": { "libelle": "Je garde le pli sans rien décider.", "couts": ["Le temps passe"], "effets": [], "epilogue": "…" },
  "echos": [{ "si": "porter", "apres": 2, "annonce": "Osric Vent vous attend…", "effets": [{ "pieces": 25 }] }]
}
```

- **Ouverture** : dès que `quand` (une condition) est vraie ; `lieu` restreint l'endroit où l'on tranche. Les boutons apparaissent en tête des actions (« Un choix s'impose : … ») avec, sous chaque option, une ligne **Coût** et une ligne **Gain**.
- **Option** : `libelle` à la première personne, `ton` (étiquette entre crochets), `couts` et `gains` (au moins une ligne chacun : jamais de choix gratuit), `condition` (option réservée : un objet, la confiance d'un PNJ), `effets`, `epilogue`. Avec un `jet`, `echec` est **obligatoire** : un jet raté ne bloque jamais, il coûte autrement.
- **Le temps presse** : `delai` en jours ; passé ce délai, l'abstention s'applique d'elle-même (« faute de décision à temps »).
- **Échos** : `echos[]`, des conséquences `apres` N jours (une narration `annonce`, des effets : une rencontre, un PNJ qui revient, de l'argent). C'est ce qui fait qu'un choix compte encore trois jours plus tard.
- **Mémoire** : un choix pose les drapeaux `choix-<dilemme>` et `choix-<dilemme>-<option>`, lisibles partout (variantes de salutation, conditions de sujet, de rencontre, de fin). Le journal tient une **Chronique des choix** (et les « Choix en suspens ») ; à la fin de l'histoire, les `epilogue` des choix faits sont racontés.
- **Validation** : erreurs (référence inconnue, jet sans `echec`, écho sur une option inconnue) et conseils `[dilemmes]` (option sans effet ou seulement narrative, aucun écho, épilogue manquant, deux options aux effets identiques). Le validateur du monde connaît les drapeaux de choix.

## Conditions et effets

Conditions (`et`, `ou`, `non` se combinent) : `flag`, `fait`, `quete` (statut), `etape`, `faction` (réputation min/max), `jauge`, `objet`, `pnj` (attitude, vivant/mort/parti), `lieu` (visité), `niveauGroupe`.

Effets : `flag`, `fait`, `jauge` (delta), `reputation`, `attitude`, `objet` (donner/retirer), `pieces`, `xp`, `quete` (proposée, active, terminée, échouée), `etape`, `pnjEtat`, `deplacer`, `escorte` (le PNJ suit le groupe et est présent partout ; `actif: false` l'arrête), `debloquer`, `rencontre`, `fin`, `narration`. L'effet `rencontre` **déclenche** la rencontre (combat compris) à la fin de l'action en cours ; une rencontre que son lieu déclare `unique` et qui a déjà été jouée ne se relance pas. C'est ainsi qu'un échec d'énigme ou un piège lance un combat.

## Ce que le moteur fait des données (audit du 05/11/2026)

- **Boutiques** (`boutique.stock`, `tables`, `rachat`, `types`) : pendant une conversation avec le marchand, ses articles (quantités limitées ; prix donné ou valeur de l'objet), ce qu'il rachète (valeur × `rachat`, seulement les catégories de `types` ; vide = tout ; jamais un objet de quête) et ses **services** s'affichent à côté de la boîte de dialogue (module `commerce` : `acheter`, `vendre`, `payerService`). Un service paie son prix, raconte son résumé et applique ses effets ; d'après son identifiant, `soins…`/`guerison…` rend tous les PV du groupe, `chambre`/`dortoir`/`abri`/`refuge`/`hospitalite` donne une nuit de repos même là où l'on ne peut pas dormir, `identification…` identifie les objets du sac. Vérifier que les `types` d'une boutique couvrent ce qu'elle vend si elle doit le racheter.
- **Quêtes proposées** : un effet `{ quete: { statut: "proposee" } }` la propose ; le joueur l'accepte (bouton « Accepter : … », commande `accepterQuete`), seulement si son `prerequis` est rempli. Le validateur signale (erreur) une quête que rien ne propose ni n'active.
- **Rencontres sociales et d'exploration** : elles ouvrent la scène de rencontre avec leurs `alternatives` (dont la `condition` est remplie) ; une issue ratée ne se retente pas ; « Passer son chemin » pour s'en aller. Sans alternative, ce n'est qu'un récit. Une rencontre `aleatoire` survient une fois sur trois en arrivant au lieu ou en s'y reposant.
- **Temps** : un lien a des `heures` de trajet ; elles font avancer l'heure, et passer minuit commence un nouveau jour (évolutions de jauge et événements `jour`). Une nuit de repos mène au matin (8 h). Les `presences` des PNJ (`jour` de 6 h à 17 h, `soir` de 18 h à 21 h, `nuit`) en tiennent compte.
- **Événement `condition` avec un `lieu`** : il ne se joue que dans ce lieu.
- **Dialogue** : les effets d'un sujet passent par le même chemin qu'une action (paliers de jauge, événements, quêtes, rencontres, **fin** : elle s'affiche aussitôt). Un PNJ qui a un **secret** propose une réplique pour insister (jet, attitude ou prix), sans en dévoiler le contenu.
- **Défaite** au combat : les héros reviennent à 1 PV huit heures plus tard, délestés de la moitié de l'or ; la rencontre attend toujours.
- **Récompense conditionnelle (bonus pour un objectif secondaire)** : un événement `declencheur: "condition"` avec une `condition` (un drapeau posé par l'objectif, par exemple « Lanéa libérée sans blessure ») et `effets: [{ "xp": 50 }]`. Il se joue une fois (`unique: true`), à la première action qui rend la condition vraie.
- **Issue de repli** : une alternative sans `jet` (« se rendre », « payer le passage ») règle la rencontre et peut poser un drapeau ou une fin. Le validateur signale un combat « élevée » qui n'en a aucune.
- **Variante selon le parcours** : une rencontre ou une alternative avec une `condition` (un drapeau, un compteur, une jauge) n'apparaît que lorsque celle-ci est vraie ; plusieurs rencontres au même lieu, chacune conditionnée, donnent une fin différente selon ce qui a été fait avant.
- **Avis du validateur** (conseils d'écriture) : « Enjeu » (aucune fin liée à une jauge ou à un palier), « PX » (le monde ne rapporte pas assez de PX pour atteindre son niveau maximum), « sans autre issue » (combat élevé sans alternative).
- **Le monde se souvient** : `Pnj.salutations.variantes` (liste `{ condition, texte }`) : la première variante vraie remplace la salutation habituelle (un acte passé, un choix de dilemme, un palier de jauge). Les jauges s'affichent en haut de l'écran avec leurs repères (●●●○○) et le **palier actuel** ; l'infobulle annonce le prochain.
- **Avis du validateur pour les histoires qui ne s'ennuient pas** : « Rythme » (moins de 20 % de rencontres sans combat), « Tension » (moins de 3 rencontres élevées), jauge (moins de 4 paliers, moins de la moitié avec des effets, monte sans rien pour la freiner), « Choix » (moins de 3 dilemmes par chapitre), « Pertes » (aucun PNJ ne peut mourir ou partir), « Réactivité » (moins de 5 PNJ aux salutations variables), « Fait clé » (exigé pour avancer mais révélé par une seule source).
- **Pas encore lus par le moteur** : `Pnj.compagnon` (recrutement), `Pnj.profilCombat` et `monstres[].pnj`, `RencontreMonde.tactique` et `butin.tresors`, `Fin.consequences`, `Objet.usage.type = "charges"`, `Piege.etats`.

## Énigmes : solution et réponse du joueur

Le moteur vérifie la solution ; le joueur répond par un **formulaire** adapté au type (le texte libre ne sert qu'aux deux premiers) :

| `solution.type` | Données | Ce que le joueur fait |
| --- | --- | --- |
| `mot-de-passe` | `mots` (réponses acceptées) | écrit un mot |
| `deduction` | `reponses` | écrit une réponse |
| `sequence` | `ordre` : les éléments dans l'ordre | les choisit un à un, dans l'ordre |
| `placement` | `emplacements` : emplacement → élément | associe chaque emplacement à un élément |
| `cadran` | `valeurs`, `plage` : [min, max] (facultatif), `libelles` : le nom de chaque réglage (facultatif) | règle chaque nombre |
| `leviers` | `positions` : `true` = en haut, `false` = en bas | met chaque levier en haut ou en bas |

- Les éléments d'une `sequence` et d'un `placement` sont **ce que le joueur voit** : un identifiant lisible (`wagonnet-de-minerai` s'affiche « Wagonnet de minerai ») ou l'id d'un objet (son nom s'affiche). Ils sont proposés dans un ordre qui ne donne pas la solution.
- L'énoncé doit dire comment se lisent les leviers (« en haut = levé, en bas = repos ») et la plage des cadrans.
- Une réponse mal formée (un élément inconnu, un mauvais nombre de leviers) est **refusée sans conséquence** : seule une réponse bien formée mais fausse est un échec (`echec.effets`, `echec.piege`).
- Un test (`tests/enigmes.test.ts`) résout chaque énigme de chaque monde livré par son formulaire.
- **`pnpm monde enigmes <monde>`** joue chaque énigme dans le vrai moteur (bonne réponse, mauvaise, mal formée) et vérifie l'échec, la récompense, les indices et l'énoncé ; zéro erreur exigé, les avis se lisent un par un. `pnpm monde valider` l'inclut. Procédure complète : skill `enigmes`.

## Règles d'écriture (pour les auteurs, humains ou LLM)

1. **Aucun contenu hors SRD** : pas de noms, de lieux ni de créatures d'un univers existant. Les noms propres sont originaux.
2. **Une seule source de vérité** : un PNJ, un trésor, un piège, une énigme se rattachent à leur lieu par leur propre champ `lieu`. Le lieu ne les liste pas.
3. **Tout ce qui se voit se décrit** : chaque lieu a un `visuel`, chaque PNJ une `apparence`, en une ou deux phrases concrètes (matières, lumière, éléments). Le visuel d'un lieu ne nomme pas de personnage.
4. **Les faits d'abord** : une vérité importante est un `fait` ; elle doit pouvoir être découverte (un PNJ la sait, un lieu la contient, un trésor l'indique). Une rumeur douteuse a `fiable: false`.
5. **Les PNJ parlent par sujets** : chaque PNJ important a au moins 3 sujets, dont un qui avance une quête ou révèle un fait ; les réponses sont des contenus à reformuler dans la voix du PNJ, pas des répliques figées.
6. **Chaque piège et chaque énigme a une solution** : le moteur vérifie la réponse (`verifierEnigme`) ; les indices vont du plus vague au plus clair.
7. **Équilibre** : les rencontres respectent le budget de PX du SRD pour un groupe de 6 (le validateur avertit) ; les trésors suivent la rareté du niveau (pas d'objet légendaire au niveau 3).
8. **Plusieurs façons de résoudre** : les rencontres importantes ont une alternative (négocier, ruser, fuir) ; les quêtes ont des ramifications.
9. **Richesse minimale par chapitre** (niveaux 1 à 5) : 30 lieux dont au moins un village ou une ville, 3 grottes et 1 donjon ; 25 PNJ (75 sujets), 3 marchands, 3 compagnons ; 1 quête principale, 6 secondaires, 3 personnelles ; 25 trésors, 10 objets propres au monde, 3 tables de butin ; 3 énigmes, 5 pièges, 15 rencontres ; 40 faits, 4 factions, 2 fins. En dessous, `pnpm monde valider` avertit.

## Créer un nouveau monde

Le skill **`creer-monde`** (`.claude/skills/creer-monde/`) guide Claude pas à pas : cadrage avec l'utilisateur, canon, échafaudage (`pnpm monde nouveau <id> "<Nom>"`), agents de zone en parallèle, raccordement et validation. Résumé :

1. Écrire l'accroche, le ton, la direction artistique et la liste des factions (une page).
2. Écrire le **canon** : le secret du monde, les fins, les personnages clés, les lieux principaux (une bible de quelques pages) et le registre des identifiants partagés entre les zones.
3. Écrire les données zone par zone (un agent ou un auteur par zone), en validant au fil de l'eau.
4. Rééquilibrer d'après les avertissements, puis générer le document (`pnpm monde doc`).

Un monde en cours d'écriture porte `"statut": "brouillon"` dans `monde.json` : ses erreurs de validation ne bloquent pas les tests ; un monde `publie` doit valider sans erreur.

## Mondes existants

- [Le Val des Cendres](mondes/val-des-cendres.md) (niveaux 1 à 5) : 1 région, 1 village, 1 ville, 1 hameau, 3 grottes, 2 donjons ; 63 PNJ (378 sujets), 93 trésors, 56 rencontres, 23 quêtes, 18 énigmes, 33 pièges, 176 faits, 4 fins. Canon et registre d'identifiants : `packages/mondes/val-des-cendres/BIBLE.md` ; guide d'écriture d'une zone : `GUIDE-ZONE.md`.
- [La Citadelle des Marées](mondes/citadelle-des-marees.md) (niveaux 1 à 4, ≈ 13 h) : 1 région, 1 ville, 1 donjon ; 40 PNJ (181 sujets), 31 trésors, 19 rencontres, 19 quêtes, 6 énigmes, 62 faits, 5 fins. Un PNJ escorté (effet `escorte`). Canon : `packages/mondes/citadelle-des-marees/BIBLE.md`.
