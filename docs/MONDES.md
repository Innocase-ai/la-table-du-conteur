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
  monde.json        identité, ton, niveaux, groupe conseillé (`groupe.conseille` : 4 ou 6 héros, 6 par défaut), départ, direction artistique, chapitres, règles pour le MJ, **`vivres`** (facultatif : `{ "objet": "rations", "depart": 3, "faim": "1d4" }` ; chaque nouveau jour, chaque héros vivant mange une ration du sac du groupe, sauf quand il se trouve dans un lieu, ou dans un bâtiment, dont `services` contient `repas` ; sans ration il a faim et perd `faim` PV, jamais sous 1 ; `depart` : jours de vivres par héros au début ; le sac et l'en-tête de l'aventure montrent « Vivres N j » ; la boutique commune `magasin-general` en vend)
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
- **Récit d'arrivée** (`Lieu.arrivee`, `Lieu.arriveeVariantes`) : le texte que le **joueur** lit en entrant dans un lieu (130 à 170 mots, sensoriel, sans secret ni mécanique ; le validateur n'avertit qu'en dehors de 40 à 220), à la première visite puis quand une variante « après » prend le relais ; il est raconté comme un texte de l'auteur, juste après l'annonce du lieu (le conteur ne le répète pas). Le bouton « Regarder autour de soi » le relit. `Lieu.description` reste **pour le MJ** (ce qu'on trouve, mécanismes) et n'est jamais montrée.
| **PNJ** | Espèce, rôle, apparence (portrait), personnalité (traits, voix, désir, peur), faction, attitude initiale (−100 à 100), savoir, secrets (avec jet, condition ou prix), **sujets de conversation** (`question` : le libellé du bouton, ce que dit ou fait le joueur ; mots déclencheurs ; réponse ; faits révélés ; effets), boutique, services, profil de combat, rôle de compagnon (classe, niveau, quête personnelle, répliques) |
| **Objet** | Catégorie (arme, armure, bouclier, potion, parchemin, baguette, anneau, bijou, vêtement, outil, matériel, nourriture, livre, clé, quête, curiosité, monnaie ancienne, **gemme**, **objet d'art**, divers), rareté, valeur, résumé de jeu, histoire, **base SRD** (obligatoire pour une arme, une armure ou un bouclier : le catalogue du SRD, commun à tous les mondes, fournit leurs caractéristiques ; l'objet n'ajoute que son nom, ses bonus et son histoire), bonus, usage (`type` consommable, à charges ou permanent ; `soins` ; **`agit`** : ce que le consommable fait à un héros, en combat comme hors combat : `soins`, `pvTemporaires`, `retirerEtats`, `resistance` (un type, `tous` ou `au-hasard`), `de` (dé aux attaques ou aux sauvegardes), `force` (valeur de Force), `degats` (potion toxique) ; `jet` (objet de jet : sauvegarde, dégâts, `contre` des types de créatures, `enflamme`), `etat` (`invisible`), `hate`, `rounds` : durée en rounds, 10 = 1 minute, sans lui jusqu'à la fin du combat ; **`sorts`** : les sorts que l'objet lance (`sort`, `niveau`, `charges` à dépenser), jouables en combat seulement (le validateur le vérifie), avec `dd` et `attaque` ; **`charges`** : `max` et `recharge` (`des` + `bonus` regagnés à l'aube, sans `recharge` jamais). Un parchemin est un consommable qui lance un sort et se détruit ; une baguette ou un bâton est de type `charges`), DD d'identification et `inconnu` (nom et résumé vagues montrés tant que l'objet n'est pas identifié) ; un catalogue du SRD (équipement, objets magiques) est partagé par tous les mondes. Les boutiques, butins et récompenses peuvent aussi citer directement une **arme ou une armure du SRD** par son id (`epee-longue`, `cotte-de-mailles`) |
| **Trésor** | Lieu, contenant, contenu (pièces, objets, tables), accès (caché, verrouillé, piégé), gardien, indice |
| **Table de butin** | Entrées pondérées (objet, pièces, autre table), palier de niveau. **Tables communes** (`monde/butin-commun.json`, ids `commun-…`, réservés) : `commun-consommables-p1` à `p4`, `commun-parchemins-p1` et `p2`, `commun-baguettes-p2` et `p3` ; une histoire les cite (`butin.tables`, `contenu.tables`, `boutique.tables`) sans les écrire |
| **Rencontre** | Type, difficulté, monstres du SRD, carte tactique, `surprise` (embuscade : le camp surpris joue son Initiative avec Désavantage), alternatives (négocier, ruser, fuir), butin, effets de victoire |
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

## Données des modules : les événements à choix illustrés

Le dossier **`evenements-choix/`** (module `evenementsChoix`, `modules/evenements-choix.ts`, format dans `monde/evenements-choix-donnees.ts`, écran `apps/jeu/src/aventure/EcranEvenement.tsx`, conception : `docs/PLAN-EVENEMENTS-A-CHOIX.md`) porte des **tableaux** : une grande image du lieu, une boîte de texte sombre avec la narration, des choix numérotés (touches 1 à 9, Échap), puis le résultat et le seul bouton « Partir ». Ce n'est pas un dilemme (pas de coût et gain affichés, d'abstention, de délai ni d'échos) : une découverte à enjeu petit ou moyen, avec un texte de résultat.

```json
{
  "id": "la-source-grise", "titre": "La source grise", "lieu": "gro-loups-source",
  "quand": { "rencontre": { "id": "gro-r-loups-salle-de-la-meute", "alternative": "apaiser" } },
  "ouverture": "entree", "image": { "groupe": "lieux", "id": "gro-loups-source" },
  "narration": "70 à 110 mots.", "variantes": [ { "condition": { "fait": "f-…" }, "narration": "…" } ],
  "choix": [
    { "id": "boire", "libelle": "Buvez à la source.", "jet": { "competence": "medecine", "dd": 11 }, "effets": [ ], "resultat": "50 à 80 mots.", "echec": [ ], "resultatEchec": "…" },
    { "id": "nain", "condition": { "heros": { "espece": "nain" } }, "libelle": "« Laissez-moi goûter la pierre. »", "effets": [ ], "resultat": "…" }
  ],
  "partir": "Laisser les louveteaux dormir et repartir."
}
```

- **Ouverture** : `entree` (défaut) : l'écran s'ouvre tout seul dès que le groupe est dans le lieu, en exploration, et que `quand` (une `Condition` : fait, quête, drapeau, mémoire du groupe `rencontre` / `parle` / `temoin`, `heros`…) est vrai ; `bouton` : une action « Regarder de plus près » du panneau Ici. Partir sans choisir ne perd rien : « Revenir à ce moment » le rouvre. Il ne se joue qu'une fois (pas de rejouable pour l'instant).
- **Image** : `image` (groupe `lieux`, `pnj`, `monstres` ou `objets` du manifeste), par défaut l'image du lieu ; `visuel` garde le prompt d'une illustration propre pour plus tard (jamais de héros pré-tirés). Le groupe `evenements` du manifeste n'existe pas encore.
- **Choix** (2 à 6, « Partir » s'ajoute) : général (sans `heros`) ou **réservé à une origine** (`condition` contenant `heros`) : le jeu préfixe le libellé de l'origine d'après le SRD, `(Nain)`, `(Magicien)`, `(Nain Magicien)` (`origine` pour dire autre chose), le cache sans héros vivant correspondant, et **fait agir ce héros** (jet, nom dans le résultat). Une autre `condition` cache le choix sans préfixe ; `requis` + `requisTexte` le grise. Un `jet` impose `echec` et `resultatEchec` : un jet raté ne bloque jamais.
- **Mémoire** : choisir pose les drapeaux `evt-<id>` et `evt-<id>-<choix>` (lisibles partout), consigne la narration, le choix et le résultat au journal, et ajoute « Événements vécus » au Journal. Le conteur ne choisit jamais (`ouvrirEvenement`, `choisirEvenement`, `quitterEvenement` sont hors conteur).
- **Validation** : erreurs (lieu, image, référence inconnue, id ou choix en double, jet sans `echec` et `resultatEchec`, tous les choix réservés à une origine) ; conseils (narration hors 40 à 150 mots, résultat hors 30 à 110, aucun choix d'origine, choix sans effet, `quand` jamais vrai). Skill : `creer-evenements-choix`.

## Données des modules : le savoir des PNJ

Le troisième dossier d'extension est **`savoirs/`** (module Savoirs, `modules/savoirs.ts`, format dans `monde/savoirs-donnees.ts`). Une fiche de savoir donne à un personnage **de la profondeur** : de quoi parler librement de lui-même, de ses proches et de ce qu'il sait, **sans rien inventer**. Le LLM du jeu s'en sert quand le joueur sort des sujets écrits ; le jeu **vérifie chaque réplique**.

```json
{
  "pnj": "ysmene-hautecote",
  "passe": "80 à 150 mots : parcours, noms propres, dates, une blessure (jamais récité tel quel).",
  "liens": [ { "pnj": "prieur-anselme-vareuil", "nature": "son élève", "opinion": "…" }, { "qui": "son frère aîné", "nature": "disparu", "opinion": "…" } ],
  "couleur": [
    { "id": "tisane-de-criste-marine", "texte": "souvenir, manie ou opinion, 25 à 50 mots concrets" },
    { "id": "tristan-equinoxe", "texte": "une confidence intime", "acces": { "attitudeMin": 30 }, "evasif": "elle détourne les yeux vers la fenêtre" }
  ],
  "sait": [
    { "id": "la-marque", "fait": "f-marque-de-basse-mer", "version": "comment elle le dit", "acces": { "attitudeMin": 60 }, "evasif": "…", "tabou": ["marque de basse-mer"] }
  ]
}
```

- **Libre** : `passe`, `liens` et les éléments de `couleur` sans `acces` : de la matière pour parler (aucun secret, aucun fait d'intrigue).
- **Verrouillé par la confiance** : un `acces` (`attitudeMin`, `condition`) sur une confidence (`couleur`) ou un fait (`sait`) ; `evasif` dit ce que le personnage laisse entendre tant que c'est fermé. Les confidences se gagnent par couches, comme les histoires personnelles des compagnons des grands jeux.
- **Tabou** : mots qui trahissent un fait que le groupe ne connaît pas encore ; interdits dans toute réplique, sauf dans celle qui révèle légitimement ce fait.
- **Le jeu vérifie** (commande `repondreEnPersonnage`) : le LLM donne la réplique, les ids de la fiche utilisés (`utilise`) et les faits révélés (`revele`). Refus si : un id n'est pas dans la fiche, un fait ou une confidence est verrouillé, un mot tabou apparaît, la réplique dépasse 130 mots, le PNJ est absent ou sans fiche. Le LLM reçoit le motif comme un fait du monde et reformule. Un fait révélé est appris par le groupe (événements, quêtes). Le PNJ ne se répète pas (« déjà dit »).
- **Dans le prompt** : le portrait de chaque PNJ présent donne son passé, ses liens, ses souvenirs, ce qu'il sait, avec VERROUILLÉ et le motif ; le texte d'un secret verrouillé n'est jamais envoyé.
- **Validation** : erreurs (PNJ ou fait inconnu, id en double, accès plus ouvert que le secret de la fiche de dialogue) et conseils (passé ≥ 70 mots, ≥ 2 liens, ≥ 6 souvenirs, ≥ 4 faits, au moins un verrouillé avec `evasif`, un `tabou` pour tout fait secret).
- **Cohérence** : le canon des passés vit dans un document du monde (`CANON-PERSONNAGES.md` pour la Citadelle) ; une fiche ne peut rien affirmer qui le contredise ni qui contredise la bible. Un agent relit les fiches contre la bible et le canon avant publication.
- Limite connue : le jeu vérifie les **ids** et les **mots tabous**, pas le sens de chaque phrase ; un détail de décor non écrit peut encore se glisser dans une réplique (consigne et relecture le limitent).

## Conditions et effets

Conditions (`et`, `ou`, `non` se combinent) : `flag`, `fait`, `quete` (statut), `etape`, `faction` (réputation min/max), `jauge`, `objet`, `pnj` (attitude, vivant/mort/parti), `lieu` (visité), `rencontre` (jouée, et comment), `parle` (a parlé à ce PNJ), `temoin` (ce PNJ était présent quand une rencontre s'est dénouée), `niveauGroupe`, `moment` (`jour` 6 h-17 h, `soir` 18 h-21 h, `nuit` : un événement qui ne vaut que quand un PNJ qui change de lieu le soir est là, `{ "non": { "moment": "soir" } }`), `heros` ; voir « La mémoire du groupe » plus bas. **Une quête ne recule jamais** : proposée, puis en cours, puis close ; un effet `quete: proposee` ne remet pas en cours une quête déjà lancée (par un événement, par un autre sujet).

Effets : `flag`, `fait`, `jauge` (delta), `reputation`, `attitude`, `objet` (donner/retirer), `pieces`, `xp`, `quete` (proposée, active, terminée, échouée), `etape`, `pnjEtat`, `deplacer`, `escorte` (le PNJ suit le groupe et est présent partout ; `actif: false` l'arrête), `debloquer`, `rencontre`, `fin`, `narration`, **`blessure`** (`{ "des": "1d4", "cible": "un" | "tous" }` : des dégâts à un héros vivant tiré au hasard, ou à tous ; **les PV ne descendent jamais sous 1**) et **`temps`** (des heures qui passent, jusqu'à 24 : `{ "temps": 0.5 }` ; passer minuit fait avancer les jauges `jour`). Ces deux derniers (14/11/2026) donnent un prix à un échec (`alternatives[].echec`) sans tuer : une chute, une demi-heure perdue à écouter un bavard. Ils s'appliquent à la fin de l'action en cours, comme `rencontre`. L'effet `rencontre` **déclenche** la rencontre (combat compris) à la fin de l'action en cours ; une rencontre que son lieu déclare `unique` et qui a déjà été jouée ne se relance pas. C'est ainsi qu'un échec d'énigme ou un piège lance un combat.

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
- **Le monde se souvient** : `Pnj.salutations.variantes` (liste `{ condition, texte }`) : la première variante vraie remplace la salutation habituelle (un acte passé, un choix de dilemme, un palier de jauge). **Même principe pour la réponse d'un sujet** : `Sujet.variantes` (liste `{ condition, reponse }`), la première variante vraie remplace `reponse` (qui reste le repli) au moment où le sujet est dit, y compris quand on le repose ; `revele` et `effets` restent ceux du sujet, communs à toutes les variantes ; la condition de la variante ne ferme ni n'ouvre le sujet (c'est le rôle de sa `condition` et de son `attitudeMin`). Une variante répond à la **même question** que le sujet. Les jauges s'affichent en haut de l'écran avec leurs repères (●●●○○) et le **palier actuel** ; l'infobulle annonce le prochain.
- **Avis du validateur pour les histoires qui ne s'ennuient pas** : « Rythme » (moins de 20 % de rencontres sans combat), « Tension » (moins de 3 rencontres élevées), jauge (moins de 4 paliers, moins de la moitié avec des effets, monte sans rien pour la freiner), « Choix » (moins de 3 dilemmes par chapitre), « Pertes » (aucun PNJ ne peut mourir ou partir), « Réactivité » (moins de 5 PNJ aux salutations variables), « Fait clé » (exigé pour avancer mais révélé par une seule source).
- **Butin d'un combat** : une victoire verse l'XP (partagée), tire chaque table de `butin.tables` (pièces, objets du sac, parchemins ; une entrée `rien` possible) et traite `butin.tresors` : la réserve de l'ennemi, **ici même, sans verrou ni piège**, est prise aussitôt ; une réserve cachée, fermée ou piégée est seulement révélée (« Vous remarquez : … »). **Dépouilles automatiques** (`monde/depouilles.ts`) : chaque adversaire vaincu porte une bourse et du matériel **selon son type SRD et son FP**, sans que l'auteur écrive quoi que ce soit : humanoïdes, gobelinoïdes et gnolls (bourse 70 %, rations, torche, rarement potion ou parchemin), géants (bourse, corde, rations), morts-vivants (vieilles pièces, bougie, fiole, eau bénite), bêtes (presque rien), artificiels (presque rien). La bourse monte avec le FP (1d4 pa à 6d6 po). Un seul tirage par créature, un résumé unique : « Dépouilles : 14 po, 2 × rations ». Les tables d'une rencontre (`butin.tables`) s'y ajoutent pour la saveur de l'histoire ; `butin.depouilles: false` supprime les dépouilles (une rixe, un duel d'honneur). Avis « Butin » du validateur : un combat qui a `depouilles: false` et ni table, ni réserve, ni trésor qui le garde.
- **Pièges : détection** : la perception passive du groupe repère à l'entrée d'un lieu les passages et trésors cachés de Perception, **jamais les pièges**. Un piège ne se découvre qu'en **fouillant** (un jet par compétence, DD secret, une fouille par lieu et par jour) ; il peut donc rester caché. Un piège non trouvé se déclenche quand on ouvre le contenant qu'il garde (`tresor.acces.piege`) ou quand l'énigme qui le cite est ratée (`enigme.echec.piege`) ; un piège **rattaché à rien** (ni contenant piégé ni énigme) se déclenche, lui, dès que le groupe **prend ou ouvre quelque chose dans son lieu** (un trésor, une serrure, une clé) sans l'avoir trouvé : un seul piège à la fois, sur celui qui agit ; trouvé, désamorcé ou déjà déclenché, il ne fait plus rien.
- **Pas encore lus par le moteur** : `Pnj.compagnon` (recrutement), `Pnj.profilCombat` et `monstres[].pnj`, `RencontreMonde.tactique`, `Fin.consequences`, `Objet.usage.type = "charges"` sans `sorts` (refusé à l'usage), `Objet.usage.agit` hors des consommables listés ci-dessus (le reste d'une potion reste du texte), `Piege.etats` (affiché, pas appliqué), `Monde.regles` (seulement dans la doc du monde, pas dans le prompt du conteur), `Faction.paliers`, `relations`, `objectifs`, `chef` (la réputation n'agit que comme condition), `TableButin.palier` (indicatif).

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
3. **Tout ce qui se voit se décrit** : chaque lieu a un `visuel`, chaque PNJ une `apparence`, en phrases concrètes (2 à 4 pour un lieu, voir le skill `decrire-lieux`) (matières, lumière, éléments). Le visuel d'un lieu ne nomme pas de personnage.
4. **Les faits d'abord** : une vérité importante est un `fait` ; elle doit pouvoir être découverte (un PNJ la sait, un lieu la contient, un trésor l'indique). Une rumeur douteuse a `fiable: false`.
5. **Les PNJ parlent par sujets** : chaque PNJ important a au moins 3 sujets, dont un qui avance une quête ou révèle un fait ; la réponse d'un sujet est **montrée telle quelle**, sous le nom du PNJ (le conteur la reçoit comme « texte de l'auteur, déjà montré », il ne la reformule pas) : on l'écrit comme une vraie réplique, au discours direct. Elle peut évoluer avec l'état du monde grâce à `Sujet.variantes`. La parole libre et variable passe par les fiches de savoir et `repondreEnPersonnage`.
6. **Chaque piège et chaque énigme a une solution** : le moteur vérifie la réponse (`verifierEnigme`) ; les indices vont du plus vague au plus clair.
7. **Équilibre** : les rencontres respectent le budget de PX du SRD pour un groupe de 6, la taille maximale (le validateur avertit) ; avec moins de héros, le jeu retire des monstres au prorata (`adapterRencontre`, `docs/COMBAT.md`) ; les trésors suivent la rareté du niveau (pas d'objet légendaire au niveau 3).
8. **Plusieurs façons de résoudre** : les rencontres importantes ont une alternative (négocier, ruser, fuir) ; les quêtes ont des ramifications.
9. **Richesse minimale par chapitre** (niveaux 1 à 5) : 30 lieux dont au moins un village ou une ville, 3 grottes et 1 donjon ; 25 PNJ (75 sujets), 3 marchands, 3 compagnons ; 1 quête principale, 6 secondaires, 3 personnelles ; 25 trésors, 10 objets propres au monde, 3 tables de butin ; 3 énigmes, 5 pièges, 15 rencontres ; 40 faits, 4 factions, 2 fins. En dessous, `pnpm monde valider` avertit.

## Passage vers une suite absente (08/11/2026)

Dans un monde découpé en histoires publiées l'une après l'autre (Ombresang), la sortie d'un lieu peut mener à un lieu qui **n'existe pas encore** (suite en préparation) ou qui fait partie d'un **pack que la partie n'a pas**. Le lien porte alors `absent: { nom, motif, texte }` :

- `nom` : ce que le bouton affiche ; `texte` : ce que le joueur lit sous le bouton et en réponse s'il essaie d'y aller ; `motif` : `bientot` (suite en préparation) ou `pack` (contenu d'un autre pack).
- Le passage reste **visible et grisé** (« Bientôt disponible. » ou « Fait partie d'un autre pack. »), jamais caché ; `aller` refuse avec le texte de l'auteur.
- Le validateur accepte alors un lieu inconnu (sans `absent`, c'est toujours une erreur) ; les liens absents sont ignorés par le contrôle d'accessibilité et les graphes.
- Dès que le lieu existe dans le monde chargé, le lien fonctionne normalement et `absent` est ignoré : on peut le laisser en place.
- Convention d'écriture : le `texte` dit pourquoi la route est fermée *dans la fiction*, sans promettre de date.

## Les cartes du monde (06/11/2026)

Le jeu dessine une carte par lieu qui en contient d'autres, avec le repère du groupe et un brouillard (seuls les lieux visités ou connus par un passage non caché apparaissent). Rien n'est à écrire pour qu'elle fonctionne : sans image ni position, les lieux sont en anneau. Pour une vraie carte illustrée :

- l'image de la carte d'un lieu parent s'ajoute au manifeste d'images, groupe `cartes`, clé = id du **parent** (`pnpm images cartes <monde>`, voir `docs/M2-IMAGES.md`) ;
- chaque lieu enfant porte `position: { "x": 42, "y": 18 }` (en % de l'image de son parent ; atelier, onglet Cartes). Un lieu sans position est placé en anneau, deux frères au même endroit sont signalés, une position sans `parent` est une erreur ;
- ne pas confondre avec `carte` d'un lieu (grille tactique de combat) ;
- la carte ne montre jamais le résumé, la description ni le visuel d'un lieu non visité.

## Créer un nouveau monde

Le skill **`creer-monde`** (`.claude/skills/creer-monde/`) guide Claude pas à pas : cadrage avec l'utilisateur, canon, échafaudage (`pnpm monde nouveau <id> "<Nom>"`), agents de zone en parallèle, raccordement et validation. Résumé :

1. Cadrer avec l'utilisateur : trois pistes, puis le ton, les niveaux, la taille et le coût.
2. Écrire le **canon** (`BIBLE.md`, registre des identifiants, `canon.json`) et le **canon des personnages** (`CANON-PERSONNAGES.md`).
3. Écrire l'**atlas des lieux** (`LIEUX.md`, skill `decrire-lieux`) : carte du monde, chaque lieu, chaque point à visiter, avec le contenu prévu ; vérification en cascade.
4. Écrire les données zone par zone (un agent par zone, qui recopie l'atlas), en validant au fil de l'eau.
5. Enrichir dans l'ordre : contrats, rencontres, pièges et trésors ; savoirs et compagnon ; dilemmes puis salutations variables ; examens, codex, origines, antagoniste.
6. Valider (0 erreur, 0 avertissement), prouver les fins (`pnpm monde parcours`), publier, générer le document (`pnpm monde doc`), puis cartes, images, scènes et voix (après accord sur le coût).

L'ordre détaillé, étape par étape, est dans le skill `creer-monde`.

Un monde en cours d'écriture porte `"statut": "brouillon"` dans `monde.json` : ses erreurs de validation ne bloquent pas les tests ; un monde `publie` doit valider sans erreur.

## Mondes existants

- [Le Val des Cendres](mondes/val-des-cendres.md) (niveaux 1 à 5) : 1 région, 1 village, 1 ville, 1 hameau, 3 grottes, 2 donjons ; 63 PNJ (378 sujets), 93 trésors, 56 rencontres, 23 quêtes, 18 énigmes, 33 pièges, 176 faits, 4 fins. Canon et registre d'identifiants : `packages/regles/tests/fixtures/mondes/val-des-cendres/BIBLE.md` ; guide d'écriture d'une zone : `GUIDE-ZONE.md`.
- [La Citadelle des Marées](mondes/citadelle-des-marees.md) (niveaux 1 à 4, ≈ 13 h) : 1 région, 1 ville, 1 donjon ; 40 PNJ (181 sujets), 31 trésors, 19 rencontres, 19 quêtes, 6 énigmes, 62 faits, 5 fins. Un PNJ escorté (effet `escorte`). Canon : `packages/regles/tests/fixtures/mondes/citadelle-des-marees/BIBLE.md`.
- **Le Grimoire de Port-Sillage** (brouillon, `packages/regles/tests/fixtures/mondes/port-sillage/`, niveaux 1 à 3, histoire facile pour 4 héros) : un village de pêcheurs (place, taverne, église et crypte, caserne, crique des contrebandiers) ; 12 PNJ, 5 combats, 3 pièges, 2 énigmes, 3 dilemmes, 4 fins, un compagnon (Basile). Canon : `packages/regles/tests/fixtures/mondes/port-sillage/BIBLE.md`.

## Données des modules : les interjections (accompagnateurs)

Le quatrième dossier d'extension est **`interjections/`** (module Interjections, `modules/interjections.ts`, format dans `monde/interjections-donnees.ts`). Un personnage qui **voyage avec le groupe** (escorté par un effet `escorte`, ou présent là où l'on est) lance de lui-même de petites phrases à chaque nouveau lieu ou événement. Elles sont écrites à l'avance : **aucun appel au LLM, gratuit**.

```json
{ "id": "nolwen-ysmene-tombee", "pnj": "nolwen-brevemer", "quand": { "flag": "ysmene-tombee" },
  "texte": "Une à deux phrases courtes (25 à 45 mots), dans sa voix, avec un détail concret.",
  "effets": [ { "attitude": { "pnj": "nolwen-brevemer", "delta": 5 } } ] }
```

- **Quand** : une `Condition` quelconque (lieu visité, drapeau, fait, étape de quête, palier de jauge, choix de dilemme `choix-<dilemme>-<option>`). L'interjection part à la première réaction du moteur où la condition est vraie et où le personnage est avec le groupe ; **une seule fois** ; jamais par un mort ni par un absent.
- **Effets** : ils font l'**approbation** (`attitude`), qui ouvre ensuite les confidences verrouillées du module Savoirs et les quêtes personnelles (condition `pnj.attitudeMin`).
- **Voix** : le texte est émis comme paroles du personnage (`voix` = son nom).
- **Validation** : erreurs (PNJ inconnu, références de la condition et des effets, id en double) ; conseils (un personnage escorté a moins de 10 interjections ; texte de plus de 45 mots).
- **Quête personnelle d'un compagnon** : une quête `personnelle` en trois étapes dont le sujet de proposition est conditionné par la confiance (exemple : Nolwen, « La carte inachevée », attitude 40).

## Données des modules : les examens (le décor qui raconte)

Le cinquième dossier d'extension est **`examens/`** (module Examens, `modules/examens.ts`, format dans `monde/examens-donnees.ts`). Un examen est un détail d'un lieu qu'on peut **regarder de près** (une inscription, un objet, une trace) ; le texte, écrit par l'auteur, est le **lore du décor**. Le LLM du jeu ne l'invente jamais : il appelle la commande `examiner` avec l'id du détail et le jeu donne le texte.

```json
{ "id": "exa-borne-du-pont", "lieu": "fal-pont-des-corbeaux", "nom": "La borne du parapet",
  "apercu": "Un blason rongé, trois lettres.",
  "texte": "45 à 100 mots : des détails concrets, une question, jamais l'explication complète.",
  "visible": { "fait": "…" },
  "effets": [ { "fait": "…" } ],
  "variantes": [ { "id": "borne-de-lothmar", "condition": { "fait": "f-lothmar-englouti" }, "texte": "Ce qu'on lit quand on sait déjà…", "effets": [] } ] }
```

- **Boutons** : chaque détail visible du lieu est une proposition « Examiner » dans le panneau « À portée de main » ; discrète une fois lue, « Examiner de nouveau » quand une variante nouvelle est disponible.
- **Variantes** : la dernière dont la condition est vraie **remplace** le texte de base ; le même détail se lit autrement selon ce que le groupe sait (un fait appris, un drapeau, un choix). Le texte de base ne révèle jamais de secret ; c'est la variante qui nomme ce que le fait révèle.
- **Effets** : appliqués une seule fois par lecture (la première pour le texte de base, la première pour chaque variante) : un fait appris, un drapeau, de l'attitude.
- **Le conteur** voit dans sa fiche « À examiner ici : nom [id] (déjà lu) » (jamais le texte) ; pour tout autre détail, il répond en une phrase tirée de la description du lieu, sans inventer d'inscription, de date ni de nom.
- **Validation** : erreurs (lieu inconnu, id en double, variante `base` ou en double, références des conditions et effets) ; conseils (texte < 25 ou > 130 mots, moins d'un lieu sur trois a un examen, aucune variante dans le monde).
- **À éviter** : les éléments d'une énigme (la solution ne passe pas par un texte d'examen), les secrets dans le texte de base.

## Données des modules : le codex (ce que le groupe sait, et ce qu'il se demande)

Le sixième dossier d'extension est **`codex/`** (module Codex, `modules/codex.ts`, format dans `monde/codex-donnees.ts`). Le module remplace la liste plate des « notes » du journal par un **codex** vivant :

- **Rubriques** : ce que le groupe a appris est rangé en *Histoire* (histoire et secrets révélés), *Indices*, *Lieux*, *Personnes*, *Factions*, *Rumeurs*. Une rumeur non fiable est marquée « non vérifiée ».
- **Sources** : chaque fait garde d'où il vient (lieu, jour, et l'interlocuteur s'il a été appris en conversation) ; la ligne le dit, et sa fiche (fenêtre de parchemin) le détaille. Un joueur qui revient après une semaine retrouve le fil.
- **Questions en suspens** : les mystères que le monde pose, écrits dans `codex/` :

```json
{ "id": "q-ligne-de-sel", "texte": "De quelle marée date la ligne de sel de la grotte ?",
  "quand": { "fait": "f-fal-grotte-marque-de-maree" }, "resolue": { "fait": "f-nuit-haute" },
  "piste": "Cherchez qui garde la mémoire des plus grandes marées.",
  "reponse": "Ce que la Nuit Haute a laissé : la mer est montée une nuit, et n'a jamais tout rendu." }
```

  Une question **apparaît** quand sa condition `quand` devient vraie, reste en suspens avec sa **piste** (où chercher, jamais la réponse), puis passe dans « Questions éclaircies » avec sa **réponse** quand `resolue` est vraie. La réponse peut n'être que partielle : elle ouvre la suite.
- **Le conteur** voit « Questions en suspens (avec leur piste) » et « Questions éclaircies » dans sa fiche : il peut répondre à « qu'est-ce qu'on cherche ? » sans rien inventer, et ne donne jamais la réponse d'une question en suspens.
- **Validation** : erreurs (id en double, références des conditions) ; conseil (moins de 10 questions, question sans piste ou de plus de 20 mots).

## La mémoire du groupe (conditions `rencontre`, `parle`, `temoin`)

Le moteur garde ce que le groupe a fait (`etat.exploration`, facultatif : les anciennes sauvegardes n'ont rien de cela) et les conditions le lisent, sans qu'il faille poser un drapeau à la main :

- `{ "lieu": "<lieu>" }` : le groupe **est déjà passé** par ce lieu (et non : il s'y trouve).
- `{ "rencontre": { "id": "<rencontre>" } }` : la rencontre a été jouée. Avec `"issue": "victoire" | "alternative" | "fuite" | "defaite"` : elle s'est dénouée ainsi ; avec `"alternative": "<id>"` : par cette issue-là (`"issue": "alternative"` est sous-entendu par l'usage). La **dernière** issue consignée l'emporte (fuir puis vaincre vaut victoire). Sur une ancienne sauvegarde, « jouée » est vrai si la rencontre est faite, mais aucune issue n'est connue.
- `{ "parle": "<pnj>" }` : le groupe a déjà parlé à ce PNJ (salutation, sujet ou parole libre).
- `{ "temoin": { "pnj": "<pnj>", "genre": "victoire" } }` : ce PNJ était présent quand une rencontre s'est dénouée (de cette façon, si `genre` est donné). Les 60 derniers témoignages sont gardés. Un PNJ qui n'était pas là ne « sait » pas : à utiliser pour qu'un habitant ne réagisse qu'à ce qu'il a pu voir.

L'issue est consignée **avant** les effets de la rencontre : un événement ou un sujet qui la lit la voit tout de suite. Elles s'écrivent partout où une `Condition` est permise (sujets, salutations, événements, interjections, dilemmes…). Le validateur vérifie que la rencontre et le PNJ existent. Plan complet de la mémoire (dossier du conteur, mini-histoires d'Ombresang) : `docs/PLAN-MEMOIRE-DU-GROUPE.md`.

## Les origines des héros (condition `heros`)

Chaque héros du groupe a une **espèce**, une **classe** et un **historique** ; le monde peut s'en apercevoir. La condition `{ "heros": { "espece": "nain" } }` (ou `classe`, ou `historique`, ou plusieurs ensemble : alors le **même** héros doit avoir tout) est vraie si au moins un héros du groupe correspond. Elle s'écrit partout où une `Condition` est permise : variantes de salutation (`salutations.variantes`, la première vraie l'emporte : mettre les plus précises avant), sujets, examens, interjections, événements, dilemmes. L'état garde les origines du groupe à la création de la partie (`etat.heros`) ; une ancienne sauvegarde sans elles répond « faux ». Le validateur vérifie que la classe, l'espèce et l'historique existent dans le SRD.

- **Regards d'origine sur les examens** : le champ `regards` d'un examen (`[ { "condition": { "heros": {…} }, "texte": "…" } ]`) ajoute **une phrase** après la lecture quand un héros du groupe a l'œil pour ça (deux au plus par lecture) ; il s'ajoute au texte de base ou à la variante au lieu de la remplacer. Une phrase de 15 à 35 mots, un détail concret en plus (une technique, un défaut, une habitude) ; jamais un secret ni une solution d'énigme.
- **Salutations d'origine** : un PNJ réagit à un héros (un mot, un regard, un geste) dans sa voix ; les variantes d'origine se placent **après** celles de l'histoire.
- **À écrire** : un agent Haiku (brief : `.claude/skills/creer-monde/references/brief-origines.md`), relu par Claude (pas de lore inventé, pas de secret).

## L'antagoniste présent dès le début

Un antagoniste qui n'apparaît qu'à la fin du prologue n'existe pas pour le joueur. Pour le faire hanter le début sans rien révéler : **deux ou trois apparitions** qui montent en étrangeté (événements `entree-lieu` avec condition sur le prologue), un **fait par apparition** (catégorie `indice`), un **sujet** d'un PNJ qui l'a croisé, une **interjection** d'un accompagnateur, et une **question du codex** qui part de la première apparition. Exemple : « l'homme au manteau sec » de la Citadelle (`evenements/z9-heraut.json`, brief : `.claude/skills/creer-monde/references/brief-antagoniste.md`).

## Rythme de progression (08/11/2026)

Le niveau du groupe est plafonné par le chapitre le plus avancé où il est allé (`chapitres[].niveaux.max`) ; l'XP en trop reste en réserve. Une rencontre ne rapporte des PX qu'une fois. Voir `docs/PROGRESSION-XP.md`.
