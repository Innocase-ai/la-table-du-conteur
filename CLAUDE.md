# La Table du Conteur (crpg-llm)

CRPG narratif illustré, animé par un MJ IA (« le conteur »), sur les règles du SRD 5.2.1 en français. Destiné à la vente : chaque joueur utilise sa propre clé d'API. **Principe directeur : le LLM propose, le moteur décide.** Les règles sont du code, jamais un LLM.

## Démarrer

```bash
pnpm install
pnpm test            # moteur + données SRD
pnpm typecheck
pnpm jeu             # le jeu sur http://localhost:5173
pnpm monde valider   # mondes + énigmes
pnpm atelier         # l'atelier d'auteur (santé, arbre des lieux, graphes, parcours, fiches modifiables avec assistant d'écriture IA, registre) sur http://localhost:5180 ; le relancer après toute modif de son serveur ; la **Forge d'Histoires** (concevoir un lieu de départ, des PNJ, des quêtes, puis « Créer le monde » brouillon) est sur http://localhost:5180/forge/ (`docs/FORGE.md`)
pnpm monde parcours  # un joueur automatique joue le moteur pour atteindre chaque fin
pnpm bureau          # le jeu dans sa fenêtre de bureau (Tauri) ; pnpm bureau:installeur pour l'installeur Windows
```

Autres commandes : `pnpm monde importer-forge <fichier.forge.json> <id>` (une conception de la Forge d'Histoires, `RPGMakerStory/`, devient un monde brouillon : `docs/FORGE.md`), `pnpm monde <verifier|manque|doc|enigmes|estimer|nouveau>` (`pnpm monde verifier <monde>` : le bilan complet en une commande, point V8 : validation, ce qui manque, estimation à jour, revue de secrets du `canon.json`, fins prouvées ; code 1 si quelque chose bloque), `pnpm simuler`, `pnpm escarmouches`, `pnpm images`, `pnpm voix`, `pnpm salutations` (voix des salutations des PNJ, avec leur voix d'ouverture ; `communes` pour la bibliothèque partagée `salutations.commune` ; simulation sans coût par défaut), `pnpm conteur`.

Les clés vont dans `.env` (ignoré par git ; modèle : `.env.example`, variable `OPENROUTER_API_KEY`). Ne jamais écrire ni afficher une clé dans la conversation, ne pas lire la valeur de `.env`.

## Où lire

- `docs/JOURNAL.md` : l'histoire du projet, **lire ses dernières entrées en premier** pour savoir où on en est.
- **`docs/PRD-SAGA.md`** : le cap du 15/11/2026 (saga d'épisodes courts indépendants, lieu de départ dense, quêtes en grammaire, butin par difficulté, fiches F1 à F8, règles de non-régression) ; **le lire avant tout chantier de gameplay ou d'histoire**.
- **`docs/GABARIT-LIEU-DE-DEPART.md`** : le gabarit du lieu de départ d'un épisode (emplacements, barème de 2 à 4 couches par pièce, champ `depart.gabarit`, avis de `pnpm monde manque`) ; à lire avant de concevoir ou de relire un village de départ.
- `docs/PRD.md` (conception), `docs/ARCHITECTURE-CIBLE.md` (noyau à modules), `docs/COMBAT.md`, `docs/CREATION.md`, `docs/MONDES.md`, `docs/M2-IMAGES.md`, `docs/M4-CONTEUR.md`, `docs/SRD-INVENTAIRE.md`.
- Code : `packages/regles` (moteur en TypeScript pur), `packages/donnees` (SRD en JSON, charte visuelle), `packages/mondes` (les histoires, un dossier par monde), `apps/jeu` (client Vite + React), `apps/bureau` (coquille de bureau Tauri), `outils/` (scripts en ligne de commande).
- Images communes à tous les mondes : 529 images du catalogue SRD (armes, armures, matériel, outils, objets magiques) dans `apps/jeu/src/equipement/`, prompts dans `packages/donnees/visuel/objets-communs.json`, `idImageCommune` regroupe les variantes ; `pnpm images equipement --max 500 --partie i/n --go` pour en refaire.
- **Bibliothèque commune** (portraits de PNJ et objets propres venus des histoires, salutations déjà dites, `commun:pnj/<id>` dans un manifeste) : `docs/BIBLIOTHEQUE-COMMUNE.md` ; **avant de générer un portrait ou une image d'objet pour une nouvelle histoire, lancer `pnpm images communs proposer <monde>`**.
- **Assets de RPGSEB** (décors de carte tuilée et leur catalogue, jeton du groupe, interface, icônes d'équipement, 16 portraits de figurants), copiés le 15/11/2026 pour de futures aventures : `apps/jeu/src/communs/rpgseb/LISEZMOI.md` (pas encore branchés dans le jeu).
- Son : `docs/SONS.md` (bruitages en place et manquants) ; musiques d'ambiance : `outils/musique/` et `apps/jeu/src/musique/`.
- Pictogrammes des cartes (sorts, écoles de magie, coûts, armes ; banc d'essai `/?icones`) : `docs/PICTOGRAMMES.md`.
- Plateaux de combat (ambiances, éléments sur les cases `T R e b n r t c`, couvert, cartes) : `docs/PLATEAUX.md`.
- Cris de combat des compagnons (15 cris communs, une voix par race et par genre) : `docs/REPLIQUES.md`, données dans `packages/donnees/repliques/`.

## Skills du projet (`.claude/skills/`)

- `ajouter-module` : pour toute nouvelle fonctionnalité du moteur.
- `creer-monde` : pour tout nouveau monde (chef d'orchestre : étapes, canon, zones, agents).
- `creer-rencontres` : combats et rencontres (déclencheurs, difficulté, alternatives, prix d'échec, rythme).
- `decrire-lieux` : décrire tous les lieux d'un monde en détail, du général au particulier (carte du monde, chaque lieu, chaque point à visiter), dans un atlas qui sert l'histoire, les images et les cartes.
- `creer-intrigue` : quête principale et secondaires, factions, jauge (horloge), événements, fins (condition et effet).
- `creer-marchands-compagnons` : boutiques, services qui agissent en jeu (nuit, soins, identification), présences, compagnon qui voyage (escorte, interjections).
- `creer-pieges-tresors` : pièges, trésors, objets propres au monde, tables de butin (cachettes, clés, gardiens, détection par la fouille, rattachement des pièges, valeur et rareté par niveau).
- `creer-contrats` : mini-quêtes de combat variées, ancrées dans la fiction (jamais une heure sans combat).
- `verifier-completude-histoire` : ce qui MANQUE dans une histoire (images de lieux, PNJ et objets, cartes, positions, scènes, voix, contrats, estimation) ; `pnpm monde manque <monde>` ; à lancer à la fin de chaque lieu et avant tout bilan ou publication.
- `creer-dilemmes` : choix difficiles, échos, épilogues (dossier `dilemmes/`).
- `creer-evenements-choix` : événements à choix illustrés (grande image, narration, choix généraux et choix propres à l'origine d'un héros du groupe, résultat ; dossier `evenements-choix/`).
- `creer-personnages` : profondeur des PNJ (canon des personnages, fiches de savoir, confidences verrouillées, conversations libres vérifiées).
- `enigmes` : dès qu'une énigme est créée, modifiée ou relue ; les énigmes se vérifient toujours en les jouant (`pnpm monde enigmes <monde>`, puis dans le jeu).
- `conteur` : le MJ IA (outils, prompt, essais réels).

## Décisions prises avec l'utilisateur (à ne pas rouvrir sans raison)

- SRD 5.2.1 (licence CC-BY), web en TypeScript, combat avec des cartes, groupe de 1 à 6 personnages créé par le joueur, sur **4 ou 6 emplacements au choix** (rencontres adaptées au nombre de héros ; chaque histoire annonce sa taille de groupe, `groupe.conseille` de `monde.json`).
- Le moteur accueille des dizaines de mondes (aujourd'hui : La Marche d'Ombrefiel, La Dîme des Roseaux et La Tombe des Rois Serpents (niveaux 3-4 depuis le 17/11/2026), publiées ; les autres histoires ont été retirées le 11/11/2026, leurs données restent comme jeux d'essai du moteur dans `packages/regles/tests/fixtures/mondes/`, versions complètes dans l'historique git). Les objets communs viennent du catalogue SRD partagé, pas de chaque monde.
- **Cap du 15/11/2026 (détail : `docs/PRD-SAGA.md`)** : le produit est une **saga d'épisodes courts et indépendants**, mêmes héros, un niveau par épisode (niveaux 1 à 20 à terme, « saison 1 » = 1 à 5), avec un carnet de campagne et des retours surprises. Chaque épisode : un lieu de départ dense écrit à la main (10 à 13 pièces), 3 à 8 quêtes dont une principale, butin proportionnel à la difficulté et plafonné au niveau du groupe. Les trois histoires actuelles **ne seront plus proposées au joueur** (jeux d'essai et référence ; masquer d'abord, rien ne se supprime avant l'épisode pilote) ; le grand monde Ombresang (64 sous-régions) est abandonné. **Ne pas casser le moteur** : tout est additif, nouveaux comportements par opt-in des données, combat gelé pour les fiches 1 à 5.
- **Règles de RPG du 16/11/2026** : le joueur **cherche** (aucun `lieu` sur les étapes de quête par défaut : pas de losange, de « ◆ » ni de boussole vers l'objectif ; le lieu se découvre par conversations, rumeurs, exploration) ; chaque PNJ qui parle a **au moins 4 sujets** en rapport avec l'histoire, qui complètent le savoir du joueur (objet central, chef du village, rumeurs, autres PNJ). Skills `creer-intrigue` et `creer-personnages`. Avant de livrer une histoire, jouer mentalement le chemin le plus court : il doit demander de chercher, de parler et de se battre.
- Coût : cible inférieure à 5 $ d'API par histoire. Le moteur et les textes écrits portent le jeu ; le conteur n'intervient que pour la saisie libre, les dialogues et les imprévus. Modèle par défaut : Claude Haiku 5.5 via OpenRouter.
- Distribution : on développe dans le navigateur, on **vend une application de bureau Tauri** (`apps/bureau`, voir `docs/BUREAU.md`) : poids des contenus sans contrainte, clé du joueur dans le trousseau du système.
- **Voix officielle du Maître de jeu** (décision du 04/11/2026) : toutes les vidéos et scènes narrées de toutes les histoires sont lues par Gemini Flash TTS, timbre **Algieba**, débit **×1,15**, style naturel (« intonations nuancées mais retenues, sans emphase »). C'est le défaut de `pnpm voix generer` (`outils/voix/gemini-scenes.ts`, `VOIX_OFFICIELLE`) : ne jamais en changer sans l'accord de l'utilisateur.
- **Règles SRD tenues, choix assumés** (audit du 07/11/2026, `docs/AUDIT-REGLES-SRD.md`) : influence = DD 15, Avantage/Désavantage selon l'attitude, 24 h d'attente après un échec (et après un succès sans secret visé, depuis le 11/11/2026 ; délai propre à chaque secret) ; PX de départ = ceux du niveau de départ ; Faveur épique au niveau 19 ; **pas de mort définitive en histoire** (héros relevés à 1 PV après un combat, défaite = 1 PV, moitié de l'or, 8 h).
- Images : FLUX Klein via OpenRouter, livrées en WebP avec le monde. Les images du groupe se construisent à l'exécution depuis les choix du joueur : **jamais d'images avec les 6 héros pré-tirés** (Bran, Grukk, Pip, Sylvaine, Hilda, Ambrine).

## Façon de travailler avec l'utilisateur

- Tout en français : réponses, messages entre deux étapes, listes de tâches, résumés, messages de commit.
- Demander l'accord avant chaque commit, puis le faire soi-même. Ne jamais pousser sans accord.
- Demander l'accord avant toute dépense (images, voix, appels d'API) et en annoncer le coût d'abord. Ne pas créer de compte, ne rien télécharger sans permission.
- Après chaque chantier : mettre à jour `docs/JOURNAL.md` et les skills concernés, puis proposer le commit.
- **Histoires d'Ombresang : audit de cohérence avant chaque page.** Avant de présenter une fiche, un pitch ou du contenu d'histoire (V1 à V8), lancer le sous-agent `auditeur-coherence-histoire` (Haiku, lecture seule), corriger ce qu'il trouve dans le non validé, signaler à l'utilisateur tout écart avec le gelé, vérifier soi-même chaque anomalie. Ne jamais annoncer qu'un fichier est écrit, gelé ou corrigé avant d'avoir relu le résultat de la commande.

## Pièges connus

- Le serveur de développement ne voit pas les fichiers de données ajoutés après son démarrage (voix, catalogue SRD) : le relancer.
- Génération de voix (gpt-audio) : ne jamais mettre `temperature: 0`, l'audio boucle.
- Conteur : la liste d'outils doit rester identique à chaque tour, sinon le cache de prompt est perdu.
- `sorties/` (PNG d'origine) et `sources/` (SRD en PDF) ne sont pas dans git.

## Ce qui reste à faire

Écran Options pour la clé du joueur ; récits d'arrivée du conteur ; comparaison de modèles ; essai réel payant de la parole libre du Val (fiches de savoir et canon.json écrits le 07/11) ; monstres puissants pour les escarmouches de niveau 5 ; **règles SRD : voir `docs/AUDIT-REGLES-SRD.md` §7** (aptitudes de l'Ensorceleur et du Druide, actions de monstre sans effet, états manquants, armes Légère et Polyvalente, grandes créatures).
