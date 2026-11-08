# Partie unique d'Ombresang : groupe, niveau et inventaire d'une histoire à l'autre

**Statut :** décisions validées par l'utilisateur le 08/11/2026 (« je suis tes recommandations »). Aucun code écrit encore.
**Contexte :** Ombresang est un seul grand jeu façon Baldur's Gate 1 ; une histoire publiée = une sous-région (64), vendue en packs par région. Le groupe est le même d'un bout à l'autre (pas de recrutement de PNJ dans le groupe).

## Décisions

1. **Une seule partie pour tout le monde.** Le groupe, l'XP, le niveau, l'or et l'inventaire vivent dans la partie, pas dans l'histoire. Une sous-région lit ces données en entrant et y écrit à la sortie.
2. **Entrée à bon niveau.** Chaque sous-région annonce sa fourchette (`niveauMin`, `niveauMax`, tirée de l'atlas). Un groupe trop faible est prévenu, jamais bloqué.
3. **Récompenses dans une échelle commune.** XP, or et objets sont calibrés par palier de niveau (table unique pour les 64 sous-régions), pour une progression régulière, ordre libre compris.
4. **Inventaire qui grossit.** Coffre ou stockage dans les villes-hubs (Lame-Rousse d'abord), limite de poids ou d'emplacements, vente aux marchands.
5. **Packs ajoutés sans casser les sauvegardes.** Une région achetée plus tard s'ajoute à la partie existante ; une sauvegarde ne référence que des identifiants stables.
6. **Drapeaux globaux et locaux.** Les choix qui comptent pour la campagne et la jauge « Battement du Cœur » sont globaux ; les drapeaux et jauges d'une sous-région restent locaux.

## Ce qui existe (lu le 08/11/2026, non testé à cette échelle)

- `apps/jeu/src/aventure/partie.ts` : `demarrerAventure` crée la partie depuis un groupe et un niveau borné par les niveaux du monde ; la sauvegarde porte l'identifiant d'**un** monde et d'un lieu.
- Modules du moteur : `progression`, `inventaire`, `equipement`, `commerce`, `journal`.

## À vérifier avant le code

1. Où vivent aujourd'hui XP, niveau, or et inventaire (état de partie ou état de monde) ?
2. La montée de niveau complète est-elle prête jusqu'au niveau 20 (choix de classe, sorts) ?
3. Le format de sauvegarde et sa version (migration quand un pack s'ajoute).
4. Les `fins` qui terminent l'aventure : comment une sous-région se conclut sans finir le jeu.
5. Le chargement des mondes (aujourd'hui à la fabrication) : chargeur à la demande par région.

## Ordre de travail proposé

1. Audit court des 5 points ci-dessus, avec les fichiers exacts à changer.
2. Le noyau : partie unique et sauvegarde versionnée, avec tests.
3. Le chargement par région.
4. Les tables de récompenses par palier et les règles d'inventaire (poids, coffre).
5. Puis le V4 de Lame-Rousse, écrit directement pour ce format.

## Audit du 08/11/2026 (lecture du code, rien d'exécuté)

| Point | Constat | Verdict |
| :--- | :--- | :--- |
| **1. Où vivent XP, niveau, or, inventaire** | Dans la partie (`noyau/types.ts`, `Partie`) : `etat.xp`, `etat.niveauGroupe`, `etat.pieces`, `etat.inventaire` (id → quantité), plus `groupe: Personnage[]`. Une partie ne référence qu'**un** monde (`Partie.monde`). | Déjà conforme : si Ombresang est **un seul monde**, la partie unique existe. |
| **2. Montée de niveau** | Réaction `xp` du module `progression` : `monterAuNiveau` pour chaque héros, plafond `min(NIVEAU_MAX, monde.niveaux.max)`. Si un choix de création est incomplet, le héros reste au niveau d'avant (« choix à revoir »). | Non vérifié : couverture réelle des classes de 5 à 20 (l'audit SRD du 07/11 signale Ensorceleur et Druide incomplets) et valeur de `NIVEAU_MAX`. |
| **3. Sauvegarde** | `Partie` versionnée (`VERSION_PARTIE = 2`) avec migrations. Mais **un seul emplacement dans `localStorage`** (`table-du-conteur:partie`), et la partie contient tout le `journal` des événements. | **Risque n°1** : sur des dizaines d'heures, le journal dépassera la limite du navigateur (≈ 5 Mo). Il faut un stockage fichier (Tauri), plusieurs emplacements et un journal borné. |
| **4. Fins** | Une `Fin` fait passer la scène à `fin` (« L'histoire est terminée », `modules/commun.ts`). Les `fins` sont facultatives. | Aucun changement moteur : les sous-régions n'ont **pas** de `fins`, elles se concluent par quêtes terminées et récompenses. Seule l'intrigue principale définit des fins. Convention à écrire dans le skill. |
| **5. Chargement** | `apps/jeu/src/mondes.ts` : `import.meta.glob` à la **fabrication** ; les fichiers sont chargés paresseusement mais **tout le monde est assemblé d'un coup** au début de l'aventure. | À refaire pour 64 sous-régions et des packs vendus séparément : chargement et assemblage **par région**, depuis des fichiers téléchargés à l'exécution (Tauri). |

**Autres constats**
- `monde.json` d'Ombresang n'a pas de `chapitres` (validation en erreur) : à écrire d'après `FIL-ROUGE.md` (8 régions + capitale, avec leurs niveaux).
- Un pack acheté après coup ajoute des quêtes, jauges et lieux inconnus de la sauvegarde existante : il faut une étape de **complétion de l'état à la charge** (créer l'état initial des nouvelles entités sans toucher aux anciennes).
- L'inventaire a déjà un poids et une capacité de groupe (`charge du groupe`). Il manque le **coffre** des villes-hubs.

## Ordre de travail révisé

1. **Sauvegarde** : stockage fichier, emplacements multiples, journal borné (risque n°1).
2. **Chargement par région** et chargeur à l'exécution des packs, avec complétion de l'état à la charge.
3. `chapitres` d'Ombresang et convention « pas de `fins` dans une sous-région » (skill `creer-monde`).
4. Vérifier la montée de niveau de 1 à 20, classe par classe.
5. Coffre des hubs, tables de récompenses par palier.
6. V4 de Lame-Rousse.

## Avancement

- **08/11/2026, étape 1 (sauvegarde), première moitié faite** : le journal est borné à l'écriture (`packages/regles/src/noyau/sauvegarde.ts` : `partieBornee`, `sauvegarderPartie`, `JOURNAL_MAX = 600`) ; si le stockage est plein, on réessaie avec 200, 50 puis 1 événement ; `sauverPartie` (apps/jeu) renvoie `false` si rien n'a pu être écrit. 4 tests. Le jeu ne relit que la fin du journal (derniers échanges du conteur, 14 derniers événements), donc rien ne change pour le joueur.
- **Reste pour l'étape 1** : emplacements multiples et stockage fichier (Tauri), et prévenir le joueur quand la sauvegarde échoue (aujourd'hui l'appelant ignore le résultat).
- **Suite de tests rouge, antérieure à ce travail** : 7 tests échouent, tous sur « ombresang » (monde en `brouillon` sans `chapitres` ni lieux, que les tests de tous les « mondes livrés » essaient de charger). Se résout en écrivant `chapitres` et les lieux de Lame-Rousse (V4), ou en excluant les mondes sans dossier `lieux/` de ces tests.
- **08/11/2026, étape 2 (packs), première moitié faite** : `completerEtat` (`monde/etat.ts`) donne leur valeur de départ aux jauges, réputations de factions et attitudes de PNJ que le monde a gagnées depuis la sauvegarde, sans toucher à ce que la partie connaît (idempotent) ; `moteur.charger` l'appelle et crée l'état des modules absents. 2 tests (`completer-etat.test.ts`), typecheck vert.
- **Constat pour la suite de l'étape 2** : `assemblerMonde(brut, fichiers)` est déjà pur et prend une liste de fichiers : un **pack de région = une liste de fichiers du même format** (`lieux/…`, `pnj/…`, `quetes/…`). Charger « base + packs achetés » = `assemblerMonde(brut, [...base, ...packs.flat()])`. Reste à écrire : le chargeur à l'exécution (lecture des packs depuis le disque avec Tauri, au lieu de `import.meta.glob` à la fabrication) et le découpage d'Ombresang en packs de région.
