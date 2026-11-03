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

## 8. État de l'implémentation (02/11/2026, mis à jour le soir)

Code : `packages/regles/src/combat/` — `grille.ts` (distances, ligne de vue, chemins, zones), `etat.ts` (état sérialisable, dés à graine, dés imposés pour les tests), `moteur.ts` (tours, déplacement et attaques d'opportunité, attaques, bottes, dégâts, sauvegardes, états, mort, concentration), `sorts.ts` (résolution générique + sorts spéciaux), `cartes.ts` (main et exécution des commandes), `creation.ts` (héros depuis une fiche, monstres depuis un profil), `ia.ts` (IA par simulation, doctrine, moral et fuite), `prototype.ts` (héros pré-tirés et rencontres).

**Couvert** : tout le §2 et le §3 ; Rage, Témérité, Frénésie, Sens du danger, Second souffle, Fougue, Critique amélioré, Attaque sournoise, Ruse, Visée appliquée, Mains lestes, Proie du chasseur (Tueur de colosses), Disciple de la vie, Préservation de la vie, Sort mineur appuyé ; bottes Sape, Ouverture, Renversement, Ralentissement, Poussée, Écorchure, Enchaînement ; 20 sorts (Bouclier en réaction automatique) ; Tactique de meute ; recharges ; empoignade et évasion.

**Simplifications** : pas de couvert ; Arme spirituelle sans jeton sur la grille ; Projectile magique et Rayon ardent répartis cycliquement sur les cibles choisies ; réactions des héros automatiques (attaque d'opportunité, Bouclier) ; les attaques multiples au choix des monstres prennent la première option ; Coup double non géré .

**Outils** : `pnpm simuler [parties] [rapide|normale] [rencontre]` fait jouer l'IA dans les deux camps et mesure taux de victoire, durée et pertes.

**Ajouts depuis** : retours graphiques (file d'animations pilotée par le journal d'événements : déplacements, élans, projectiles, dégâts flottants, zones, morts ; 20 pictogrammes CC BY 3.0) ; combat avec un **groupe créé** (`docs/CREATION.md` : armes, bottes d'arme, sorts jouables, arts martiaux du Moine, Attaque supplémentaire) ; **30 monstres** du SRD disponibles (spectres, ombres, armures animées… pour les mondes) ; 25 sorts jouables sur 181. Les rencontres des mondes (`docs/MONDES.md`) réutilisent les cartes tactiques et les compositions du prototype.

## 9. Escarmouches adaptées au groupe (03/11/2026)

Les escarmouches n'étaient que quatre rencontres fixes, calibrées pour six héros de niveau 3 : un groupe de niveau 1 s'y faisait écraser, un groupe de niveau 5 s'y ennuyait. Elles sont maintenant **composées pour le groupe** (`combat/escarmouche.ts`) :

- **Un thème** (une carte, un décor et un camp : embuscade gobeline, crypte, bande et ogres, camp hobgobelin) et **une difficulté** (faible, modérée, élevée) ; l'écran d'escarmouche affiche la composition, ses PX et ce que la rencontre pouvait dépenser pour ce groupe (« Composée pour 6 héros de niveau 3 »).
- **Budget** : la somme, héros par héros, du budget « faible » du SRD à son niveau (`budget.ts`), multipliée par 1, 1,45 ou 1,8 selon la difficulté, avec une correction aux niveaux 1 (× 1,4) et 4 (× 0,8), puis divisée par le **danger du thème**. Le SRD donne 1, 1,5 et 2,7 fois le budget « faible » au niveau 3 : en simulation, au-delà de 1,5 fois les héros sont presque toujours battus.
- **Composition** : le chef du thème s'il tient dans 55 % du budget (le plus fort possible), puis les troupes dans la proportion de leurs poids, tant que le budget le permet, puis des « montées en gamme » (un monstre remplacé par un plus fort) quand le nombre maximal de monstres (6 pour un héros, 16 pour six) limite avant le budget. Aucun monstre seul ne dépasse 55 % du budget (le chef) ni la moitié (les troupes). Déterministe.
- **Limite connue** : le catalogue n'a que 30 monstres ; au niveau 5, aucun thème ne peut dépenser tout son budget (l'écran le dit : « Peu de monstres assez puissants pour ce niveau »), et les rencontres y sont plus faciles que leur étiquette.
- **Calage** : `pnpm escarmouches [parties] [thème|tous] [niveaux] [--danger crypte=1.2]` fait jouer l'IA dans les deux camps sur chaque thème, niveau et difficulté (six héros du groupe conseillé). Cibles (IA contre IA, donc plus durs que pour un joueur) : faible ≈ 90 % de victoires, modérée ≈ 65 à 75 %, élevée ≈ 35 à 50 %. Le coefficient `danger` de chaque thème dit combien « pèse » vraiment sa troupe devant ses PX (goules qui paralysent, ogres lents).
- **Résultat du calage** (10 parties par cas, IA contre IA, six héros ; ±15 % de bruit) : niveau 3, faible 92 %, modérée 80 %, élevée 62 % de victoires ; niveau 2, 85 / 85 / 55 ; les niveaux 1 et 4 ont été resserrés après un premier passage trop dur ou trop facile. Les rencontres du niveau 5 sont plafonnées par le catalogue (80 à 100 % de victoires).
- **Tests** : `tests/escarmouche.test.ts` (budget, validité de chaque niveau × nombre de héros × difficulté, PX qui montent avec la difficulté et le niveau, déterminisme).

