# PRD — La Table du Conteur, CRPG narratif animé par LLM

**Version :** 0.5 — 02/11/2026 **Statut :** Brouillon de conception ; M0 terminé, prototype M1 jouable (à valider en jeu) **Plateforme cible :** navigateur (PC), exécutable desktop envisagé plus tard (Tauri ou Electron) **Langue :** français **Stack :** TypeScript (moteur de règles pur + client React + serveur Node) **Règles :** D&D SRD 5.2.1 (CC-BY-4.0)

## 1. Vision

Un jeu de rôle pour un groupe de **6 aventuriers créés par le joueur**, raconté par un **maître du jeu IA** (Claude). Chaque interaction affiche un texte, des choix et **une illustration de la scène**. Les combats se jouent avec des **cartes**, contre des **monstres qui réfléchissent**. Le jeu est entièrement codé par un LLM et animé par un LLM.

**Fantasy centrale :** « Une table de jeu de rôle avec un vrai MJ, qui improvise, illustre ce qu'il raconte, et dont les monstres jouent pour gagner. »

**Inspirations :** Baldur's Gate 2 (groupe, compagnons, réactivité du monde), les livres dont vous êtes le héros (texte et choix), les jeux de cartes tactiques (combat).

**Piliers de design :**

- **Un MJ qui improvise, mais ne triche pas.** Le LLM raconte et décide des conséquences. Les règles, les dés et l'état du jeu appartiennent au code.
- **Chaque scène se voit.** Une illustration accompagne chaque interaction, dans un style unique, avec des héros reconnaissables.
- **Un groupe qui compte.** 6 personnages, chacun avec sa personnalité, ses compétences et sa voix. La composition du groupe change la façon de jouer.
- **Des combats tactiques.** Cartes, système d'actions de la 5e, et des adversaires qui exploitent les erreurs du joueur.

## 2. Boucle de jeu principale

```
Scène (texte + illustration + choix)
   ↓ le joueur choisit ou écrit une action
MJ interprète → arbitre traduit en règles → moteur résout (jets, effets)
   ↓
Conséquences : récit, objets, XP, relations, état du monde
   ↓
Selon la scène : exploration │ dialogue │ piège/énigme │ artisanat │ combat de cartes
   ↓
Repos, progression, scène suivante → … → fin du chapitre
```

**Durée visée (v1) :** un chapitre de 2 à 3 heures (un village et un donjon), niveaux 1 à 5.

## 3. Règles du jeu

### 3.1 Base : SRD 5.2.1

- Le **System Reference Document 5.2.1** (règles D&D 2024) est publié par Wizards of the Coast sous licence **Creative Commons CC-BY-4.0**. Le projet utilise la **version française officielle** (inventaire : `docs/SRD-INVENTAIRE.md`).
- Les crédits du jeu reprennent la **mention d'attribution exacte** demandée dans le SRD.
- **Interdits :** tout ce qui n'est pas dans le SRD (univers officiels, créatures et noms protégés). Le monde du jeu est original.
- **Pourquoi la 5e :** c'est la licence la plus claire, et c'est l'édition que les LLM connaissent le mieux, ce qui limite les erreurs de l'arbitre et du MJ. Son système d'actions (action, action bonus, réaction) se prête bien aux cartes.

### 3.2 Contenu à couvrir en v1

- Caractéristiques, compétences, maîtrise, avantage et désavantage, jets de sauvegarde, états préjudiciables.
- Les 9 espèces, 4 historiques, 12 classes (une sous-classe chacune) et 17 dons du SRD 5.2.1, extraits en JSON en M0.
- Sorts du SRD jusqu'au niveau 3, équipement, bottes d'armes, repos court et long.
- Bestiaire SRD adapté aux niveaux 1 à 5, complété par des créatures originales.
- Rencontres calibrées pour **6 personnages** (le calcul de difficulté de la 5e le permet, mais l'équilibrage sera à surveiller).

### 3.3 Ce que le code garantit

Tout calcul de règle est fait par le moteur : jets, modificateurs, points de vie, emplacements de sorts, durées, concentration, inventaire, XP. **Aucun LLM ne modifie l'état du jeu directement.**

## 4. Le groupe : création de 6 personnages

- **Créateur complet :** espèce, classe, historique, caractéristiques (tableau standard, achat de points ou tirage), compétences, équipement, sorts, nom, apparence et personnalité.
- **Portrait choisi dans une galerie** pré-générée (par espèce et par sexe), sans personnalisation physique, comme dans Baldur's Gate. Il sert ensuite de **référence visuelle** pour toutes les illustrations.
- **Création assistée :** le joueur décrit un personnage en une phrase, le MJ propose une fiche complète, et le moteur la valide (règles respectées) avant de l'accepter.
- **Groupe pré-tiré** disponible pour démarrer vite.
- **Personnalités :** chaque fiche contient des traits, idéaux, liens et défauts. Les compagnons réagissent aux choix, commentent, et peuvent entrer en conflit (esprit BG2).

## 5. Narration et scènes

- Chaque interaction est une **scène** : le texte du MJ (en streaming), une illustration, **3 ou 4 choix** et une **zone d'action libre**.
- Les choix qui demandent un jet l'affichent clairement, par exemple : *[Persuasion DD 15 — Lysandre]*. Le joueur choisit quel personnage agit.
- **Structure du monde :** une carte composée de lieux, chaque lieu étant un graphe de scènes (pièces, rencontres, PNJ). Le squelette (lieux, PNJ clés, quête principale) est écrit à l'avance dans une **bible du monde**. Le MJ improvise à l'intérieur de ce cadre.
- **Réactivité :** réputation, relations avec les PNJ et les compagnons, faits établis (un PNJ mort reste mort).

## 5 bis. Les mondes

Le moteur accueille **des dizaines de mondes** (histoires jouables) sans changer de code : un monde est un dossier de données (`packages/mondes/<id>/`) décrit dans `docs/MONDES.md`, avec des villes, villages, grottes et donjons, beaucoup de PNJ à qui parler et de trésors à trouver. Un validateur (`pnpm monde valider`) contrôle les références, l'accessibilité des lieux, les quêtes, l'équilibre des rencontres et la richesse. Premier monde : le Val des Cendres (chapitre 1, niveaux 1 à 5).

## 6. Illustrations

- **Une image par interaction**, même fixe. Le texte s'affiche tout de suite, l'image apparaît en fondu quand elle est prête.
- L'**illustrateur** (sous-agent, §10) produit une description structurée : lieu, personnages présents, action, lumière, cadrage. Elle est complétée par la **charte graphique** fixe et, pour chaque personnage du joueur présent dans la scène, son **portrait de galerie choisi** comme référence. Le jeu n'illustre **jamais** un héros qu'il n'a pas reçu du joueur : aucun héros pré-tiré dans les images du produit.
- **Cache :** les lieux et états déjà illustrés sont réutilisés. Les scènes clés du chapitre peuvent être générées à l'avance.
- **Service de génération : à choisir en M2** (Claude ne génère pas d'images). Critères : cohérence des personnages avec des images de référence, style, délai, coût par image, conditions d'utilisation.
- **Budget :** un plafond d'images par session sera configurable. Un mode « économie » réutilise davantage le cache.

## 7. Combat de cartes

### 7.1 Principe

Les cartes sont **l'interface** du combat, les règles de la 5e sont **le moteur**. Une carte représente une option de jeu réelle (attaque, sort, botte, aptitude de classe, objet) et sa résolution suit le SRD.

### 7.2 Proposition à valider par le prototype (M1)

- **Initiative individuelle** (règle 5e). Les 6 héros et les monstres agissent dans l'ordre d'initiative.
- **Chaque tour :** un mouvement sur une grille simple, **une carte Action**, **une carte Action bonus** si le personnage en a, et des **cartes Réaction** jouables pendant le tour adverse (attaque d'opportunité, sort *Bouclier*, etc.).
- **Cartes toujours disponibles :** les actions de base (attaquer, esquiver, foncer, se désengager, aider, se cacher, utiliser un objet), les sorts préparés (chaque lancer consomme un emplacement), les aptitudes de classe (avec leurs utilisations par repos).
- **Hypothèse à tester, une part de hasard :** un petit **deck d'« élan »** par personnage, construit à partir de sa classe, de ses bottes d'armes et de son équipement. On pioche 1 ou 2 cartes par tour, qui donnent des opportunités : un bonus tactique, un déplacement gratuit, une botte améliorée.
  - Alternative si le hasard nuit au jeu : pas de pioche, toutes les cartes visibles.
- **Les monstres** jouent aussi des cartes tirées de leur fiche (attaques multiples, souffle à recharge, réactions).
- **Présentation :** l'illustration de la scène en fond, la grille tactique, la main du personnage actif, et un journal des jets détaillé.

### 7.3 Critère de réussite du prototype

Un combat de 6 héros contre une rencontre moyenne doit durer **10 à 20 minutes**, offrir des choix qui ont du poids à chaque tour, et pouvoir être **perdu à cause de mauvaises décisions**.

## 8. Intelligence des monstres

Deux niveaux :

1. **IA tactique (code, à chaque action) :** le moteur étant déterministe et simulable, chaque monstre évalue ses options en **simulant des suites de coups** (recherche Monte-Carlo ou évaluation par utilité). Il cible les lanceurs de sorts, se met à couvert, prend à revers, garde ses ressources et coordonne ses attaques. C'est instantané et ça n'appelle pas le LLM.
2. **Stratégie (LLM, aux moments clés) :** le **stratège** fixe une **doctrine** au début du combat et la révise quand c'est nécessaire (moral brisé, chef tué, situation retournée) : attaquer, tenir une position, se replier, fuir, négocier, se rendre, provoquer. La doctrine se traduit en paramètres pour l'IA tactique (priorités de cible, prudence, seuil de fuite).

**Mémoire :** les survivants peuvent revenir, et les factions s'adaptent aux tactiques habituelles du groupe.

**Niveaux de difficulté :** ils jouent sur la profondeur de simulation et l'agressivité de la doctrine, sans jamais faire tricher l'IA.

## 9. Pièges, énigmes, artisanat

- **Pièges :** perception passive et active, désamorçage avec outils de voleur, jets de sauvegarde, dégâts. Le tout est défini en données et résolu par le moteur.
- **Énigmes :** définies en données avec une **solution vérifiable par le moteur**. Le MJ les met en scène, interprète les réponses libres et donne des indices graduels. Les énigmes proposées par un LLM ne sont acceptées qu'après vérification qu'elles ont une solution.
- **Artisanat :** il s'appuie sur les règles d'outils du SRD, complétées par des **recettes en tables** (ingrédients, outil, durée, jet, résultat). Le MJ peut proposer de nouvelles recettes, dans les limites de puissance fixées par le moteur.

## 10. Architecture des agents

```
Joueur → MJ narrateur (orchestre, écrit, propose)
           ├─ Arbitre        : action libre → demande de jet / effet
           ├─ Voix des PNJ   : dialogues des PNJ et des compagnons
           ├─ Stratège       : doctrine des monstres
           ├─ Illustrateur   : description de scène → image
           └─ Archiviste     : mémoire, résumés, cohérence (arrière-plan)
                  ↓ tous passent par des outils validés
           Moteur de règles (code) : personnages, combat de cartes,
           pièges, énigmes, artisanat, état du monde
```

**Principes :**

- **« Le LLM propose, le moteur décide. »** Les agents agissent uniquement par **outils** (`demander_jet`, `infliger_dégâts`, `donner_objet`, `placer_pnj`, `lancer_combat`, `mettre_à_jour_quête`…). Chaque appel est validé avant application.
- **Contrats stricts :** chaque agent reçoit et renvoie du JSON conforme à un schéma. Une réponse hors schéma est rejetée et redemandée.
- **Latence :** le joueur n'attend qu'**un seul appel** par interaction. Les autres agents travaillent en parallèle (illustrateur) ou en arrière-plan (archiviste). On évite les chaînes d'appels successifs.
- **Choix des modèles :** un modèle puissant pour le MJ et le stratège, un modèle rapide pour les PNJ et l'archiviste. Les prompts système (bible du monde, règles) sont mis en cache.
- **Déploiement progressif :** v1 commence avec **MJ, arbitre et illustrateur**. Les autres agents arrivent quand on mesure un besoin.

## 11. Architecture technique

| Partie | Rôle | Technologie |
| --- | --- | --- |
| `regles` | Moteur pur : fiches, jets, combat, IA tactique, pièges, énigmes, artisanat | TypeScript, sans dépendance graphique ni réseau |
| `donnees` | SRD 5.2.1 converti en JSON, bible du monde, recettes, rencontres | JSON + schémas |
| `agents` | Prompts, schémas de contrat, outils, orchestration | TypeScript, SDK Anthropic |
| `serveur` | Appels à Claude et au service d'images, clés API, cache d'images, sauvegardes | Node |
| `client` | Créateur de personnages, scènes illustrées, table de combat, inventaire, journal | React + Vite |

- **Tests :** le moteur est couvert par des tests unitaires. Les agents sont testés avec des **réponses enregistrées** (rejouables sans appel d'API) et des **scénarios d'évaluation**.
- **Sauvegardes :** l'état complet en JSON, avec le journal résumé et les images en cache.
- **Vérification visuelle :** le jeu tourne dans le navigateur, ce qui permet à Claude de le lancer, d'y cliquer et d'en faire des captures pendant le développement.

## 12. Jalons

| Jalon | Contenu | Critère de fin |
| --- | --- | --- |
| **M0 — Fondations** ✅ | Dépôt, inventaire du SRD et conversion en JSON du sous-ensemble utile, moteur de base (caractéristiques, jets, fiches) | Fiches de niveau 1 à 5 calculées correctement, tests verts |
| **M1 — Combat de cartes** 🧪 (jouable, animé, à valider en jeu ; `docs/COMBAT.md`) | Combat complet + IA tactique, 6 héros pré-tirés, quelques rencontres, sans LLM ni images | Le critère du §7.3 est atteint, après des parties de test |
| **M2 — Test des images** 🧪 (essais réels faits : FLUX 3 Image en tête, voir `docs/M2-IMAGES.md`) | Comparaison de 2 ou 3 services sur 10 scènes avec les mêmes héros | Service choisi, délai et coût mesurés, charte graphique fixée |
| **M3 — Créateur de personnages** ✅ M3a (sans LLM, voir `docs/CREATION.md`) ; M3b (assistant LLM) à venir | Création complète, portraits, création assistée | Un groupe de 6 se crée en moins de 20 minutes |
| **M4 — MJ** (plan : `docs/M4-CONTEUR.md`) | MJ + arbitre + illustrateur, un lieu court jouable de bout en bout | Une partie d'une heure sans incohérence de règles |
| **M5 — Profondeur** | Pièges, énigmes, artisanat, voix des PNJ, stratège, archiviste | Chaque système est utilisé dans le chapitre |
| **M6 — Chapitre 1** (données écrites : Val des Cendres, `docs/mondes/val-des-cendres.md` ; reste le MJ, M4) | Village + donjon, 2 à 3 heures, sauvegarde, équilibrage | Partie complète jouée et terminée |

## 13. Risques

| Risque | Impact | Parade |
| --- | --- | --- |
| Le combat de cartes n'est pas amusant | Cœur du jeu raté | Prototype M1 en premier, sans LLM, et itérations rapides |
| Héros qui changent de visage d'une image à l'autre | Immersion cassée | Test M2, portraits de référence, style fixe, cache |
| Coût des images et des appels LLM | Partie trop chère | Cache, choix des modèles, plafond par session, mesure dès M2 et M4 |
| Latence entre deux scènes | Rythme lent | Streaming du texte, image asynchrone, un seul appel bloquant |
| MJ incohérent ou trop généreux | Jeu cassé | Outils validés, bible du monde, archiviste, limites de puissance |
| Combats déséquilibrés avec 6 héros | Trop facile ou trop dur | Simulation automatique de combats (l'IA joue les deux camps) |
| Contenu hors SRD utilisé par erreur | Problème de licence | Données issues uniquement du SRD, liste d'interdits dans les prompts |

## 14. Questions ouvertes

1. **Nom du jeu, univers et ton** (sombre, héroïque, humoristique ?).
2. **Service d'images** et clé API (décision en M2).
3. ~~**Budget acceptable**~~ : **tranché le 03/11/2026** : moins de 5 $ d'API pour finir une histoire avec le modèle conseillé. D'où le principe « le moteur et les textes écrits portent le jeu, le conteur intervient là où il apporte quelque chose » (`docs/M4-CONTEUR.md` § 1 et 8).
4. ~~**Usage**~~ : **tranché le 03/11/2026, le jeu sera vendu** ; chaque joueur utilise **ses propres clés d'API** (Anthropic, et OpenRouter pour les images), gardées sur sa machine, et chaque histoire affiche son coût d'API estimé (`docs/M4-CONTEUR.md` § 7 et 8).
5. **Hasard dans le combat :** deck d'élan pioché ou toutes les cartes visibles (décision en M1).
6. **Mort des personnages :** définitive, ou avec possibilité de résurrection et recrutement ?

## 15. Sources

- SRD 5.2.1 (texte officiel, licence CC-BY-4.0) : https://dndbeyond.com/srd
- Annonce des traductions du SRD 5.2.1 (dont le français) : https://www.dndbeyond.com/community-update
