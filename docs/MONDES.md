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
  pieges/  enigmes/ pièges (détection, désarmement, dégâts) et énigmes (solution vérifiable)
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
| **Lieu** | Type, parent (arbre région → ville → quartier → bâtiment, ou donjon → niveau → salle), liens vers d'autres lieux (durée en heures, porte verrouillée, passage secret, condition), description pour le MJ, **prompt visuel** pour l'illustrateur, rencontres déclenchées, faits à découvrir, repos |
| **PNJ** | Espèce, rôle, apparence (portrait), personnalité (traits, voix, désir, peur), faction, attitude initiale (−100 à 100), savoir, secrets (avec jet, condition ou prix), **sujets de conversation** (mots déclencheurs, réponse, faits révélés, effets), boutique, services, profil de combat, rôle de compagnon (classe, niveau, quête personnelle, répliques) |
| **Objet** | Catégorie, rareté, valeur, résumé de jeu, histoire, base SRD, bonus, usage ; un catalogue du SRD (équipement, objets magiques) est partagé par tous les mondes. Les boutiques, butins et récompenses peuvent aussi citer directement une **arme ou une armure du SRD** par son id (`epee-longue`, `cotte-de-mailles`) |
| **Trésor** | Lieu, contenant, contenu (pièces, objets, tables), accès (caché, verrouillé, piégé), gardien, indice |
| **Table de butin** | Entrées pondérées (objet, pièces, autre table), palier de niveau |
| **Rencontre** | Type, difficulté, monstres du SRD, carte tactique, alternatives (négocier, ruser, fuir), butin, effets de victoire |
| **Piège** | Détection, désarmement, déclenchement, sauvegarde, dégâts |
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
- **Voix** : `pnpm voix generer <monde> --go` fait lire chaque plan par un modèle audio (OpenRouter) et écrit `voix/<scene>-<plan>.mp3`, livré avec le monde, et `voix/<scene>-<plan>.json` (texte, transcription, durée, coût : pour relire ce qui a été dit ; non livré au joueur). Une lecture infidèle (mots ajoutés ou oubliés) ou trop longue est refaite, trois fois au plus, sinon le fichier n'est pas écrit. Sans fichier, le jeu utilise la voix de synthèse du système, que le joueur peut couper. Coût : environ 0,001 $ par plan avec `gpt-audio-mini`.
- **Règles d'écriture** : le texte est lu au joueur, au présent ou au passé de conte, sans rien dévoiler qu'il ne découvre au même moment ; deux ou trois phrases par plan, trois ou quatre plans par scène.

## Conditions et effets

Conditions (`et`, `ou`, `non` se combinent) : `flag`, `fait`, `quete` (statut), `etape`, `faction` (réputation min/max), `jauge`, `objet`, `pnj` (attitude, vivant/mort/parti), `lieu` (visité), `niveauGroupe`.

Effets : `flag`, `fait`, `jauge` (delta), `reputation`, `attitude`, `objet` (donner/retirer), `pieces`, `xp`, `quete` (proposée, active, terminée, échouée), `etape`, `pnjEtat`, `deplacer`, `debloquer`, `rencontre`, `fin`, `narration`.

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
