# Combat de cartes — spécification M1

Prototype du cœur du jeu, **sans LLM ni images**. Le but est de savoir si le combat est amusant (critère du PRD §7.3). Les règles suivent le SRD 5.2.1 ; ce document dit ce qui est couvert en M1 et comment les cartes s'y greffent.

## 1. Terrain

- **Grille de cases de 1,5 m.** Un déplacement en diagonale coûte une case, comme en orthogonal (règle de base du SRD).
- Cases : sol, mur (bloque déplacement et ligne de vue), terrain difficile (coût double).
- Une créature occupe une case (créatures G : 2×2). On traverse une case alliée, pas une case ennemie.
- **Ligne de vue** : tracé entre centres de cases, bloqué par les murs. Pas de couvert partiel en M1.

## 2. Déroulement

- **Initiative** : d20 + modificateur d'initiative, ordre décroissant ; égalité → Dextérité la plus haute, puis héros d'abord.
- **Tour** d'une créature : un **Mouvement** (sa Vitesse, fractionnable avant/après l'action), une **Action**, éventuellement une **Action bonus**, et une **Réaction** par round (reconstituée au début de son tour).
- Fin du combat : un camp n'a plus de créature active (morte, inconsciente ou en fuite).

## 3. Actions couvertes

| Action | Règle |
| --- | --- |
| Attaque | Une attaque d'arme (ou plus avec Attaque supplémentaire). Corps à corps : For (ou Dex si Finesse). Distance : Dex ; désavantage au-delà de la portée normale ou si un ennemi est au contact. |
| Lancer un sort | Coût selon le temps d'incantation, emplacement consommé ; un seul sort à emplacement par tour s'il y a un sort en action bonus. |
| Foncer | Mouvement supplémentaire égal à la Vitesse. |
| Se désengager | Pas d'attaque d'opportunité ce tour-ci. |
| Esquiver | Jusqu'au prochain tour : les attaques contre soi ont le désavantage, avantage aux sauvegardes de Dex. |
| Utiliser un objet | Potion de soins (2d4 + 2). |
| Aptitudes | Rage, Témérité, Second souffle, Fougue, Action rusée, Attaque sournoise, Critique amélioré… selon la fiche. |

**Attaque d'opportunité** (réaction) : quand un ennemi sort de l'allonge sans s'être désengagé.

**Bottes d'arme** couvertes en M1 : celles des armes des héros pré-tirés.

## 4. Dégâts, états, mort

- Critique : on double les dés de dégâts. Résistance : moitié ; vulnérabilité : double ; immunité : zéro.
- États couverts : À terre, Inconscient, Neutralisé, Entravé, Paralysé, Effrayé, Empoigné (au besoin des monstres choisis).
- Héros à 0 PV : Inconscient, **jets de sauvegarde contre la mort** ; les soins le relèvent. Monstres à 0 PV : morts.
- **Concentration** : un seul sort ; jet de Con DD max(10, dégâts/2) quand on subit des dégâts.

## 5. Les cartes

Les cartes sont l'interface ; chaque carte correspond à une option de jeu réelle.

- **Cartes permanentes** (toujours en main) : Attaque avec chaque arme, Foncer, Se désengager, Esquiver, Potion (si en stock), les **sorts préparés** (avec leur coût en emplacement), les **aptitudes** (avec leurs utilisations restantes).
- Chaque carte indique son coût : **Action**, **Action bonus** ou **Réaction**, plus la ressource consommée.
- **Deck d'élan** (hypothèse à tester, désactivable) : ~10 cartes propres à chaque héros selon sa classe. On en **pioche 2 au début de son tour** ; on peut en jouer **une** gratuitement ce tour-ci, les autres sont défaussées en fin de tour. Exemples : *Ouverture* (+2 à la prochaine attaque), *Pas de côté* (1,5 m sans attaque d'opportunité), *Coup appuyé* (+1d4 dégâts), *Garde haute* (+1 CA jusqu'au prochain tour), *Appel au groupe* (un allié peut se déplacer de 3 m).
- Les **monstres** jouent depuis leur profil (attaques, multiattaque, recharges, actions bonus) ; ils n'ont pas de deck d'élan.

## 6. IA tactique

- À son tour, un monstre énumère des **plans** : case d'arrivée × action × cible (et action bonus).
- Chaque plan est noté par une **évaluation** de l'état obtenu (PV des deux camps, menaces, exposition, ressources), pondérée par la **doctrine** du groupe : agressivité, focus (blessés, lanceurs de sorts, soigneurs), prudence, seuil de fuite.
- Les meilleurs plans sont départagés par **simulation** : on joue la suite du round plusieurs fois avec des politiques simples et on garde le plan dont l'issue moyenne est la meilleure.
- Le **moral** : un groupe dont le chef tombe ou qui perd la moitié de ses membres peut fuir ou se rendre (doctrine).
- Niveau de difficulté = nombre de simulations et qualité de la doctrine. **L'IA ne triche jamais** : elle ne connaît que ce qu'un joueur verrait (pas les PV exacts des héros, mais leur état « intact / blessé / en sang »).

## 7. Contenu du prototype

- **6 héros pré-tirés de niveau 3** : Guerrier (Champion), Barbare (Berserker), Roublard (Voleur), Rôdeur (Chasseur), Clerc (Domaine de la Vie), Magicien (Évocateur).
- **Monstres** : gobelins, hobgobelins, gobelours, loups, squelettes, zombis, gnolls, bandits, ogre (sélection du SRD).
- **Sorts** : ceux des héros pré-tirés.
- **3 ou 4 rencontres** de difficulté croissante, calculées avec le budget de PX du SRD (« Rencontres de combat »).
- **Simulation d'équilibre** : l'IA joue aussi les héros ; on mesure taux de victoire, durée en rounds, PV restants.

## 8. État de l'implémentation (02/11/2026)

Code : `packages/regles/src/combat/` — `grille.ts` (distances, ligne de vue, chemins, zones), `etat.ts` (état sérialisable, dés à graine, dés imposés pour les tests), `moteur.ts` (tours, déplacement et attaques d'opportunité, attaques, bottes, dégâts, sauvegardes, états, mort, concentration), `sorts.ts` (résolution générique + sorts spéciaux), `cartes.ts` (main et exécution des commandes), `creation.ts` (héros depuis une fiche, monstres depuis un profil), `ia.ts` (IA par simulation, doctrine, moral et fuite), `prototype.ts` (héros pré-tirés et rencontres).

**Couvert** : tout le §2 et le §3 ; Rage, Témérité, Frénésie, Sens du danger, Second souffle, Fougue, Critique amélioré, Attaque sournoise, Ruse, Visée appliquée, Mains lestes, Proie du chasseur (Tueur de colosses), Disciple de la vie, Préservation de la vie, Sort mineur appuyé ; bottes Sape, Ouverture, Renversement, Ralentissement, Poussée, Écorchure, Enchaînement ; 20 sorts (Bouclier en réaction automatique) ; Tactique de meute ; recharges ; empoignade et évasion.

**Simplifications** : pas de couvert ; Arme spirituelle sans jeton sur la grille ; Projectile magique et Rayon ardent répartis cycliquement sur les cibles choisies ; réactions des héros automatiques (attaque d'opportunité, Bouclier) ; les attaques multiples au choix des monstres prennent la première option ; Coup double non géré .

**Outils** : `pnpm simuler [parties] [rapide|normale] [rencontre]` fait jouer l'IA dans les deux camps et mesure taux de victoire, durée et pertes.
