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
| Aptitudes | Rage, Témérité, Second souffle, Fougue, Action rusée, Attaque sournoise, Critique amélioré, Inspiration bardique, Châtiment divin, Credo du Moine… selon la fiche. |

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

**Couvert** : tout le §2 et le §3 ; Rage, Témérité, Frénésie, Sens du danger, Second souffle, Fougue, Critique amélioré, Attaque sournoise, Ruse, Visée appliquée, Mains lestes, Proie du chasseur (Tueur de colosses), Disciple de la vie, Préservation de la vie, Sort mineur appuyé, **Inspiration bardique, Châtiment divin, Arts martiaux et Credo du Moine (Frappe bonus, Déluge de coups, Patience défensive, Porté par le vent, Frappe étourdissante, Métabolisme surnaturel)** ; état Étourdi ; bottes Sape, Ouverture, Renversement, Ralentissement, Poussée, Écorchure, Enchaînement ; 20 sorts (Bouclier en réaction automatique) ; Tactique de meute ; recharges ; empoignade et évasion.

**Simplifications** (état du 02/11, voir les sections suivantes pour ce qui a changé : couvert demi, Lutte et Bousculade, Aider, Stabiliser) : pas de couvert ; Arme spirituelle sans jeton sur la grille ; Projectile magique et Rayon ardent répartis cycliquement sur les cibles choisies ; réactions des héros automatiques (attaque d'opportunité, Bouclier) ; les attaques multiples au choix des monstres prennent la première option ; Coup double non géré .

**Outils** : `pnpm simuler [parties] [rapide|normale] [rencontre]` fait jouer l'IA dans les deux camps et mesure taux de victoire, durée et pertes.

**Ajouts depuis** : retours graphiques (file d'animations pilotée par le journal d'événements : déplacements, élans, projectiles, dégâts flottants, zones, morts ; 20 pictogrammes CC BY 3.0) ; combat avec un **groupe créé** (`docs/CREATION.md` : armes, bottes d'arme, sorts jouables, arts martiaux du Moine, Attaque supplémentaire) ; **30 monstres** du SRD disponibles (spectres, ombres, armures animées… pour les mondes) ; 42 sorts jouables (dont 17 ajoutés le 08/11/2026 : 11 sorts de dégâts jusqu’au niveau 3 et 6 sorts qui durent, voir « Sorts qui durent »). Les rencontres des mondes (`docs/MONDES.md`) réutilisent les cartes tactiques et les compositions du prototype.

## 9. Escarmouches adaptées au groupe (03/11/2026)

Les escarmouches n'étaient que quatre rencontres fixes, calibrées pour six héros de niveau 3 : un groupe de niveau 1 s'y faisait écraser, un groupe de niveau 5 s'y ennuyait. Elles sont maintenant **composées pour le groupe** (`combat/escarmouche.ts`) :

- **Un thème** (une carte, un décor et un camp : embuscade gobeline, crypte, bande et ogres, camp hobgobelin) et **une difficulté** (faible, modérée, élevée) ; l'écran d'escarmouche affiche la composition, ses PX et ce que la rencontre pouvait dépenser pour ce groupe (« Composée pour 6 héros de niveau 3 »).
- **Budget** : la somme, héros par héros, du budget « faible » du SRD à son niveau (`budget.ts`), multipliée par 1, 1,45 ou 1,8 selon la difficulté, avec une correction aux niveaux 1 (× 1,4) et 4 (× 0,8), puis divisée par le **danger du thème**. Le SRD donne 1, 1,5 et 2,7 fois le budget « faible » au niveau 3 : en simulation, au-delà de 1,5 fois les héros sont presque toujours battus.
- **Composition** : le chef du thème s'il tient dans 55 % du budget (le plus fort possible), puis les troupes dans la proportion de leurs poids, tant que le budget le permet, puis des « montées en gamme » (un monstre remplacé par un plus fort) quand le nombre maximal de monstres (6 pour un héros, 16 pour six) limite avant le budget. Aucun monstre seul ne dépasse 55 % du budget (le chef) ni la moitié (les troupes). Déterministe.
- **Limite connue** : le catalogue n'a que 30 monstres ; au niveau 5, aucun thème ne peut dépenser tout son budget (l'écran le dit : « Peu de monstres assez puissants pour ce niveau »), et les rencontres y sont plus faciles que leur étiquette.
- **Calage** : `pnpm escarmouches [parties] [thème|tous] [niveaux] [--danger crypte=1.2]` fait jouer l'IA dans les deux camps sur chaque thème, niveau et difficulté (six héros du groupe conseillé). Cibles (IA contre IA, donc plus durs que pour un joueur) : faible ≈ 90 % de victoires, modérée ≈ 65 à 75 %, élevée ≈ 35 à 50 %. Le coefficient `danger` de chaque thème dit combien « pèse » vraiment sa troupe devant ses PX (goules qui paralysent, ogres lents).
- **Résultat du calage** (10 parties par cas, IA contre IA, six héros ; ±15 % de bruit) : niveau 3, faible 92 %, modérée 80 %, élevée 62 % de victoires ; niveau 2, 85 / 85 / 55 ; les niveaux 1 et 4 ont été resserrés après un premier passage trop dur ou trop facile. Les rencontres du niveau 5 sont plafonnées par le catalogue (80 à 100 % de victoires).
- **Tests** : `tests/escarmouche.test.ts` (budget, validité de chaque niveau × nombre de héros × difficulté, PX qui montent avec la difficulté et le niveau, déterminisme).


## La conduite des monstres (doctrines)

L'IA (`combat/ia.ts`) note ses choix selon une **doctrine** (`combat/doctrine.ts`) : agressivité, prudence, cible prioritaire, seuil de fuite du groupe, et, en option, seuil de fuite individuel (`seuilFuitePv`) et goût pour la distance (`garderDistance`). Chaque monstre créé depuis son profil SRD reçoit sa conduite (`conduitesDe`, `doctrineDeProfil`), cumulable :

| Conduite | Qui | Effet |
| --- | --- | --- |
| `sans-peur` | morts-vivants, artificiels, vases, plantes d'Intelligence ≤ 8 | avance sans se protéger, ne fuit jamais |
| `bete` | bêtes d'Intelligence ≤ 3 | pas de moral de groupe ; détale seule sous 25 % de ses PV |
| `brute` | Force ≥ 16, Intelligence ≤ 8, ni tireur ni lanceur | frappe sans se protéger, tient presque jusqu'au bout |
| `lanceur` | trait d'incantation, taille M au plus, une attaque à 18 m ou plus | prudent, vise les lanceurs, garde ses distances |
| `tireur` | attaque à 18 m ou plus au moins égale à son attaque de contact, Dextérité ≥ Force | prudent, garde ses distances |
| `lache` | gobelinoïdes et kobolds de taille P, FP inférieur à 1 | fuit seul sous 30 % de ses PV |

Sans conduite (environ 160 profils : soldats, dragons, démons intelligents…), un monstre suit la doctrine de son camp. Les morts-vivants ne fuient jamais et les héros non plus, quelle que soit leur doctrine. Il n'y a pas de conduite « soigneur » : acolytes et prêtres sont des lanceurs ; depuis le 15/11/2026 les monstres lancent leurs sorts (voir « Sorts des monstres »), et l'IA soigne ou bénit comme n'importe quelle carte jouable.

- **Distance** : un tireur est récompensé d'être loin de l'ennemi le plus proche, jusqu'à **6 m** (`DISTANCE_DE_CONFORT`). Mesuré en simulation : au-delà, il sort du combat sans gain ; le poids exact change peu de chose, c'est surtout de ne plus charger qui compte.
- **Mesure** (IA contre IA, mêmes graines) : les doctrines rendent certains combats plus faciles pour les héros, surtout parce que les tireurs ne chargent plus. Coefficients de danger recalés le 09/11/2026 : embuscade 0,9, camp hobgobelin 1, gué 1,25. Le texte `tactique.doctrine` des rencontres reste de la mise en scène pour le conteur.
- **Tests** : `tests/doctrine.test.ts`.

## Groupe de 1 à 6 héros

Le joueur compose un groupe de **1 à 6 personnages**. Les rencontres des histoires sont écrites pour 6 ; `adapterRencontre(rencontre, nbHéros)` (`packages/regles/src/combat/echelle.ts`) les réduit au prorata du nombre de héros (le budget de PX du SRD est une somme par héros) : chaque groupe de monstres est réduit (au moins un), puis les derniers groupes (les renforts) sont retirés d'abord ; le premier groupe, le principal, reste toujours. À 6 héros la rencontre est inchangée. Les PX viennent des monstres vaincus, donc ils suivent. Limite : un monstre unique très fort (un chef seul) ne peut pas être réduit, il reste dur pour un héros seul. Les escarmouches composaient déjà leur rencontre pour le nombre de héros.

## 10. Aptitudes de classe des niveaux 1 à 5 (07/11/2026)

Trois classes ont leurs aptitudes de combat jouables (cartes `aptitude:…`, ressources durables rendues au repos par `recuperer`) :

- **Barde, Inspiration bardique** : action Bonus, un allié à 18 m reçoit un dé (d6, d8 au niveau 5, colonne « Dé bardique ») ; autant d'utilisations que le Charisme (min 1), rendues au repos long (et court dès le niveau 5). Le dé, un modificateur `de_inspiration`, se dépense **tout seul sur le premier jet d'attaque ou de sauvegarde raté qu'il peut rattraper** (le manque ne dépasse pas la face du dé ; jamais sur un 1 naturel).
- **Paladin, Châtiment divin** (niveau 2) : action Bonus juste après un coup au corps à corps (`tour.dernierCoup`) ; 2d8 radiants, +1d8 par niveau d'emplacement au-dessus du 1er, +1d8 contre un Fiélon ou un Mort-vivant, dés doublés sur critique ; un lancer gratuit par repos long, sinon un emplacement (un seul sort à emplacement par tour).
- **Moine** : points de Credo (colonne de la fiche, rendus au repos court ou long). Frappe bonus (après l'action Attaque), Déluge de coups (1 point : deux attaques à mains nues, une ou deux cibles), Patience défensive et Porté par le vent (gratuits, ou avec 1 point pour la version double), Frappe étourdissante (niveau 5, 1 point, une fois par tour après un coup : JS de Constitution, raté = **Étourdi** jusqu'au début du prochain tour du Moine, réussi = Vitesse /2 et Avantage à la prochaine attaque), Métabolisme surnaturel (à l'Initiative, rend le Credo et des PV, une fois par repos long, automatique et seulement s'il sert).
- **État Étourdi** : comme Neutralisé, plus l'échec automatique aux JS de Force et de Dextérité et l'Avantage aux attaques contre lui ; la créature passe son tour.
- **Limites connues** : le Châtiment n'existe qu'à partir du niveau 2 (le sort du catalogue n'est pas joué) ; la Frappe étourdissante accepte tout coup au corps à corps (le moteur ne distingue pas les armes de Moine) ; Déviation d'assaut, Chute ralentie, Source d'inspiration par emplacement et les sous-classes du niveau 3 ne sont pas jouées. L'IA des simulations choisit ces cartes comme les autres cartes offensives (le groupe conseillé des escarmouches n'a ni Barde, ni Paladin, ni Moine : le calage de difficulté ne change pas).

## Sorts qui durent (08/11/2026)

Une **zone persistante** (`EtatCombat.zones`, type `ZonePersistante`) reste sur le plateau tant que le lanceur se concentre : Sphère de feu, Rayon de lune, Invocation d'animaux, nuage d'Appel de la foudre. Elle se déclenche quand une créature **finit son tour dedans** ou **y entre** (au plus une fois par tour de table), avec la sauvegarde et les dés du sort relevés selon l'emplacement. Perdre la concentration la retire. Le lanceur la déplace ou y frappe par une **carte de suivi** (`aptitude:zone-<sort>` ; `SUIVI_ZONES` dans `combat/sorts.ts`) dont la portée se mesure depuis le centre de la zone (`Carte.origine`). Lame de feu et Caresse du vampire donnent une carte d'attaque (`aptitude:lame-de-feu`, `aptitude:caresse-du-vampire`) tant que le lanceur se concentre. Le plateau dessine les zones qui durent (`case-zone-durable`).

**Pas encore :** Mur de vent, Métal brûlant (objets à chauffer), Représailles infernales (réaction), Châtiment de révélation (supplément après une attaque d'arme). Simplifications assumées : la sphère de feu roule en ligne droite et s'arrête sur la première créature de sa trajectoire ; le nuage d'orage est centré sur le point de l'incantation ; « une fois par tour » = une fois par tour de table.

## Le panneau d'actions (12/11/2026)

Le panneau de droite du combat se lit de haut en bas : **le héros** (portrait, PV, mouvement en barre « ➜ 6 / 9 m », pastilles Action / Bonus / Réaction / Élan, pleines = disponibles, vides = utilisées), **la consigne**, **« Fin du tour »** (touche `F` ; il pulse quand il ne reste plus rien d'utile à jouer), puis **la main en sections repliables** : Élan, Attaques, Actions (monstre), Sorts, Aptitudes, Actions de base, et en bas « Indisponibles » (replié) pour ce qu'on ne peut pas jouer ce tour-ci (coût déjà payé, plus d'emplacement). Une carte dont seule la distance manque (« Aucune cible à portée ») reste dans sa section, atténuée : on voit son épée et on comprend qu'il faut s'approcher. Le repli est mémorisé dans le navigateur. Tour auto, Héros auto, vitesse et son sont dans le menu ⚙ du héros.

- **Une carte** : bande de coût colorée, nom, **pastilles de chiffres** (`+5`, `1d8+3` avec le motif du type de dégâts, `DD 13 Dex` pour un sort à sauvegarde, portée ou zone), description, ressource, illustration à droite : **l'image de l'arme** (433 images d'équipement du SRD, `apps/jeu/src/equipement/<id>.webp`, `attaque:javeline-lancer` prend `javeline` avec un ➹) ou celle de la potion de soins, ou celle de l'objet que le héros a reçu (carte `base:objet-<id>`, voir « Objets embarqués ») ; repli sur le pictogramme pour les sorts, aptitudes, actions de monstre et armes sans image. ⓘ déplie la description complète avec l'image en grand. Les chiffres viennent de `Carte.stats` (`StatsCarte`, `cartes.ts`), que le moteur remplit pour les attaques d'arme et les sorts ; `description` reste la phrase.
- **Raccourcis** : `1` à `9` jouent (ou choisissent) la carte du même numéro, parmi les cartes jouables visibles dans l'ordre affiché ; `F` termine le tour ; Échap annule ; Entrée valide un choix de plusieurs cibles. Rien n'agit pendant un tour de l'IA, une animation ou une saisie.
- **Aperçu avant de cibler** (`apercuCarte`, `probabiliteToucher`, `moyenneDes`) : une carte à cible choisie, chaque cible valide porte une pastille « 65 % » sur le plateau, et en survolant un ennemi la consigne dit « Arc long → Sbire gobelin 1 : 80 % de toucher (avantage), ≈ 7,5 dégâts. » ou, pour un sort à sauvegarde, « sauvegarde de Dextérité DD 13, 55 % d'échec ». C'est une **estimation** : mêmes règles que `jetAttaque` (1 naturel rate, 20 touche, avantage, désavantage, demi-couvert, bonus en cours, dés de bonus à leur moyenne), sans l'Inspiration bardique ni la réaction Bouclier. Testée contre des milliers de vrais jets (`combat-apercu.test.ts`).
- Fichiers : `PanneauTour.tsx`, `MainCartes.tsx` (+ `.css`), règles pures dans `main-cartes-regles.ts` (sections, touches, pastilles, phrase d'aperçu) et `pictogrammes-regles.ts` (`imageDeCarte`, `cleDegats`), tests `main-cartes-regles.test.ts`.

## Objets embarqués (13/11/2026)

Un héros peut emporter au combat un consommable dont l'effet est écrit dans les données (`usage.agit`, `ActionObjet` dans `monde/schemas.ts`) : le sac propose « Confier à… » (commande `confierObjet`), l'objet quitte le sac et se compte dans les ressources du héros (`objet:<id>`, comme `potions`) ; ce qu'il fait est copié dans `Personnage.embarques`. En combat, chaque objet emporté a une carte `base:objet-<id>` (action Bonus, pour soi ou un allié au contact, image de l'objet ; inutile = refusée, « Cela ne changerait rien ») ; `combat/objets.ts` applique les effets : soins, PV temporaires, états retirés, résistance (modificateur `resistance`, durée `rounds`), dés (modificateurs `de_attaque` et `de_sauvegarde`), Force (l'écart de modificateur va aux attaques de Force, aux dégâts, à la sauvegarde et à l'Athlétisme). Ce qui reste après le combat reste dans les mains du héros (`appliquerEtat`) ; `rendreObjet` le remet au sac. La potion de guérison simple garde son compte `potions` et sa carte `base:potion`. L'IA ne joue pas ces cartes.

### Objets à sorts et à charges (13/11/2026)

Un objet dont `usage.sorts` n'est pas vide (parchemin de sort, baguette, bâton) s'emporte aussi (`confierObjet`) et donne **une carte par sort** : `base:objet-<id>~<sort>~<niveau>`. Le sort se joue comme celui d'un héros (mêmes cibles, zones, jets) mais **sans emplacement**, au DD (`usage.dd`) et au bonus d'attaque (`usage.attaque`) de l'objet : `avecIncantationDObjet` (`combat/objets.ts`) donne le temps du sort une incantation à l'objet, puis le héros retrouve la sienne (un guerrier peut lire un parchemin). Un parchemin est détruit à la lecture ; une baguette dépense les charges du sort (`ressources['charges:<id>']`, que l'interface montre « n / max »). Refusé : plus assez de charges, en rage, armure sans formation. Les charges restantes suivent l'objet (au sac : `modules.inventaire.charges`) et reviennent **à l'aube** (événement `jourSuivant`, `usage.charges.recharge`). Un objet harmonisé emporté compte parmi les trois du héros. Seuls les sorts de `SORTS_JOUABLES_EN_COMBAT` sont permis ; les parchemins de sorts précis du SRD sont dans `objets/parchemins-de-sorts.json` (21, créés d'après le catalogue des sorts), les six baguettes et bâtons qui lancent des sorts jouables dans `baguettes.json`.

### Objets de jet, Hâte, Invisible (13/11/2026)

- **Objets de jet** (`ActionObjet.jet` : acide 2d6, eau bénite 2d8 radiants contre Fiélons et Morts-vivants, feu grégeois 1d4 de feu) : la carte `base:objet-<id>` est une action qui vise un **ennemi** à 6 m au plus en vue (les ennemis valides seuls pour l'eau bénite) ; sauvegarde de Dextérité contre 8 + modificateur de Dextérité + maîtrise du lanceur ; raté, dégâts pleins ; réussi, rien. Le feu grégeois fait **brûler** : 1d4 de feu à la fin de chaque tour de la cible (modificateur `degats_differes` avec `repete`), jusqu'à ce qu'elle joue **« Éteindre les flammes »** (`base:eteindre`, une action) ou, à défaut, pendant 3 tours (le SRD ne fixe pas de limite : réglage du jeu pour que l'IA, qui n'éteint pas, ne laisse pas brûler sans fin).
- **Invisible** (nouvel état `invisible`, potion d'invisibilité) : avantage aux attaques de l'invisible, désavantage aux attaques contre lui ; il cesse quand il attaque (`jetAttaque`), inflige des dégâts (`infligerDegats`) ou lance un sort (`lancerSort`).
- **Hâte** (modificateur `hate`, potion de vitesse, 10 rounds) : +2 CA, Vitesse doublée, avantage aux sauvegardes de Dextérité, une attaque de plus par tour (`attaquesRestantes` vaut 1 en début de tour) ; pas de léthargie à la fin.

## Entraves, zones, Aider et surprise (14/11/2026)

- **IA** : `evaluer` (`ia.ts`) compte les **entraves** (`valeurEntraves`) des deux côtés : états qui donnent désavantage (à terre, aveuglé, effrayé, empoisonné, entravé, empoigné, charmé), malus de dés (Fléau), Vitesse réduite, désavantage aux attaques, attaques contre lui avec Avantage, brûlure. Affaiblir un adversaire rapporte, être entravé coûte. Un adversaire qui ne peut plus agir n'est pas compté deux fois. `pointsZone` choisit le point qui touche le plus d'adversaires (au plus 3 candidats), un allié touché coûte une fois et demie, aucun point rentable : la carte n'est pas jouée.
- **Aider** : `base:aider` (action) : un adversaire à 1,5 m reçoit un modificateur `aide-attaque` (`avantage_contre`, usage unique, jusqu'au début du prochain tour de qui aide). `base:stabiliser` (action) : un allié à 0 PV au contact, test de **Sagesse (Médecine) DD 10** (`Combattant.competences.medecine`) ; réussi, `stable` et jets contre la mort remis à zéro. L'IA les joue comme les autres cartes (Aider a une valeur par les entraves ; Stabiliser n'en a aucune, elle compte sur les soins).
- **Surprise** : `creerCombat(grille, combattants, graine, { elan, surpris: [camp] })` : le camp surpris jette son Initiative avec Désavantage (SRD 5.2.1) ; une rencontre de monde déclare `surprise: "heros" | "monstres"` (embuscade). Le camp surpris joue le plus souvent après l'autre ; il n'y a pas de round perdu.
- **Fin d'un combat d'histoire** : `resultatDeCombat(etat)` (`combat/resultat.ts`) donne l'issue, les PX et l'état des héros tels que `reglerRencontre` les attend ; à brancher dans `App.tsx`.
- **Tests** : `ia-affaiblissements-zones.test.ts`, `combat-filet.test.ts` (invariants, vue sans triche, IA normale, bottes, mort massive, fin de combat d'histoire), `combat-actions-srd.test.ts`.
- **Lutte et Bousculade** (14/11/2026, héros seulement : les monstres ont leurs actions dans leur profil) : trois cartes de base, `base:lutter`, `base:renverser` (jeter à terre) et `base:repousser` (1,5 m), qui **remplacent une attaque** de l'action Attaque (la première dépense l'action et ouvre les attaques supplémentaires ; elles comptent pour la Frappe bonus du Moine). Cible à 1,5 m, pas plus d'une taille au-dessus du héros. Sauvegarde de Force ou de Dextérité (la cible prend la meilleure) contre 8 + Force + maîtrise ; raté : **empoigné** (Vitesse 0, évasion au même DD par « S'échapper »), à terre, ou repoussé. Nouveau : un empoigné attaque avec **Désavantage** toute autre créature que celle qui le tient (monstres compris). Simplifications : la main libre n'est pas exigée, la créature qui lutte ne traîne pas sa prise en se déplaçant (elle la lâche si elle s'éloigne de plus de 3 m, au tour de l'empoigné). **L'IA ne les joue pas** (`CARTES_QUE_L_IA_NE_JOUE_PAS`, `ia.ts`) : mesuré en simulation, quand l'IA des héros les choisit elle gâche ses actions (victoires 87 % → 81 %, PV restants 63 % → 56 % sur 36 cas) ; Héros auto n'y recourt donc jamais. Test : `combat-lutte-bousculade.test.ts`.

## Sauvegarde du combat en cours (14/11/2026, partie version 4)

Un combat d'histoire se sauvegarde **à chaque action** : `Partie.combatEnCours` (type `CombatEnCours`, `noyau/types.ts`) garde l'`EtatCombat` entier, la graine du combat, la rencontre telle qu'elle est jouée (nom, ambiance, surprise) et le niveau de l'IA. L'état contient celui du générateur de dés (`rng`) : un combat repris se déroule exactement comme celui qu'on a quitté, **recharger la page ne relance plus les dés** (avant, la reprise recréait un combat avec une nouvelle graine).

- **Écriture** : `Combat.tsx` appelle `onProgres(etat)` au début puis après chaque commande (le compteur `version` change à chaque action) ; `App.tsx` copie l'état dans la partie et l'écrit comme toute sauvegarde. L'état du combat vit donc toujours dans une ref du composant (le moteur le mute en place), mais sa copie sauvegardée est dans la partie.
- **Reprise** : « Reprendre l'aventure » depuis l'écran titre rouvre directement le combat quand la partie en contient un ; depuis l'écran d'aventure, « Combattre » reprend le combat commencé au lieu d'en lancer un autre. Un combat repris ne redit pas le cri de début.
- **Effacement** : la commande `reglerRencontre` (victoire, défaite, repli, autre issue réglée) supprime `combatEnCours`. À la lecture, un combat resté dans une partie qui n'est plus en scène de rencontre est oublié (`moteur.charger`). Le bouton « Fuir » est un repli : il règle la rencontre et efface le combat.
- **Migration 3 → 4** : vide (le champ est facultatif).
- **Limites** : le plan d'un tour de monstre en cours (`fileIA`) n'est pas sauvegardé : reprise au milieu d'un tour de monstre, l'IA replanifie depuis l'état présent avec ce qui lui reste (le même combat, pas toujours le même coup) ; le choix de cible du joueur en cours, la vitesse rapide et « Héros auto » ne sont pas gardés. Les escarmouches libres (hors histoire) ne se sauvegardent pas. Un combat sauvegardé pèse quelques dizaines de Ko dans le stockage du navigateur.
- **Tests** : `sauvegarde-combat.test.ts` (aller-retour en plein combat, même déroulement jet pour jet, combat terminé, migration 3 → 4, version trop récente, reste oublié, fin de rencontre qui efface). Vérifié dans le jeu : partie en version 3 migrée, combat de la Dîme lancé, attaque jouée, page rechargée, combat repris au même tour avec le même `rng` et les mêmes PV, « Fuir » qui efface le champ.

## Sorts des monstres (15/11/2026)

Les monstres lancent leurs sorts, comme le SRD 5.2.1 le décrit (section « Sorts » des profils) : **pas d'emplacements**, « à volonté » ou N fois par jour, au **niveau le plus bas** du sort sauf mention (« boule de feu (au 5e niveau) »), avec le DD et le bonus d'attaque du profil.

- **Données** : champ facultatif `sorts` de chaque profil (`SortsMonstre`, `schemas.ts`) : caractéristique, DD, bonus d'attaque, et une liste `{ sort, niveau?, cout?, usage }` où `usage` est `"volonte"` ou `{ nombre, par: "jour", groupe? }` (un `groupe` relie des sorts à une **réserve commune** : le « Soutien divin » du prêtre, 3 par jour pour Bénédiction, Mot de guérison et Restauration partielle ; `cout: "bonus"` quand le profil change le coût). Écrit une fois pour toutes dans **35 profils** du SRD (acolyte, prêtre, mage, archimage, liche, druide, fanatique, couatl, déva, planétar, solar, nagas, guenaudes, oni, méphite poussiéreux, dragons adultes et vénérables…) d'après le texte de leur trait « Incantation ».
- **Seulement les sorts que le moteur joue** (`SORTS_JOUABLES_EN_COMBAT`, hors Réaction) : les autres (invisibilité, vol, scrutation, détection…) restent dans le texte du trait. Un test (`combat-sorts-monstres.test.ts`) vérifie que chaque sort listé existe, est jouable et n'est pas une réaction.
- **Moteur** : `monstreDepuisProfil` remplit `sorts`, `incantation` (DD, attaque, aucun emplacement) et `sortsMonstre` (niveau, coût, clé de réserve) ; les lancers du jour sont dans `ressources['sort:<sort ou groupe>']`. `cartesDisponibles` donne une carte `sort:<id>` (ressource « à volonté » ou « n lancer(s) restant(s) », refusée à zéro) ; `preparerIncantation` et `lancerSort` décomptent la réserve au lieu d'un emplacement. Rien ne change pour les héros.
- **IA** : aucune règle à part : les cartes de sort d'un monstre entrent dans la simulation comme celles d'un héros (zone posée là où elle touche le plus d'adversaires, un allié touché coûte une fois et demie). Le mage lance Boule de feu sur un groupe serré, le prêtre soigne ou bénit.
- **Interface** : la fiche d'un combattant montre les lancers du jour (`ressourcesLisibles`).
- **Pas encore** : les sorts en Réaction (Bouclier, Contresort du mage et de l'archimage), les actions légendaires qui relancent un sort (dragons), les sorts à Recharge (diantrefosse : boule de feu ×2, Recharge 4-6), les sorts de Magie d'assemblée des guenaudes, les sorts de 1 minute et plus, le stockage de sort du garde animé, et tous les sorts que le moteur ne joue pas.
- **Conséquence d'équilibre, mesurée** (simulation IA contre IA, six héros pré-tirés de niveau 3, 60 parties) : *La Colère de Xiximantre* (Tombe des Rois Serpents, danger « élevé », un mage avec Boule de feu 2/jour) passe de **85 % à 38 % de victoires des héros**, PV restants 47 % → 20 %, héros à terre 2,0 → 4,3. Dans le jeu : première Boule de feu au tour du mage, 32 dégâts (un seul jet de 9d6 pour toute la zone) sur trois héros de niveau 3, tous à terre. C'est fidèle au SRD (un mage est un monstre de FP 6) mais c'est à regarder avec l'auteur de la Tombe. *Keldan au perron* (Marche, un acolyte) ne change pas.

## Correctifs de l'audit du moteur (18/11/2026)

- **Botte Poussée** : elle passe par `repousser` (`sorts.ts`), comme la carte « Repousser » et les sorts qui repoussent. La cible s'arrête au bord de la grille ; avant, elle pouvait en sortir (un monstre hors de la grille n'était plus ciblable et le combat ne finissait plus). Rien d'autre ne change : 3 m, taille G au plus, même ligne de journal.
- **Copies de simulation de l'IA** (`clonerCombattant`, `etat.ts`) : caractéristiques, sauvegardes, compétences et attaques sont copiées. Une potion de force de géant envisagée par l'IA (Héros auto) ne modifie plus le vrai héros.
- **Simulation de référence** (`pnpm simuler 10 rapide`) : résultats identiques avant et après, y compris les 60 journaux de combat ; la simulation prend environ 8,5 % de temps en plus (`docs/AUDIT-MOTEUR.md` §8). Tests : `tests/audit-moteur-combat.test.ts`.

## Combat de haut niveau (F6 de docs/PRD-SAGA.md, 19/11/2026)

La fiche F6 se fait par **petits lots**. Règle de non-régression : P3 est levé pour cette fiche seulement ; une branche nouvelle ne s'exécute **que pour les monstres porteurs des données nouvelles** (un trait ou une action du profil), et `pnpm simuler 10 rapide` reste **identique** sur les profils existants. Le catalogue porte déjà les données : 30 monstres ont le trait `actions-legendaires` (actions de `cout: gratuit` dont le texte commence par « Action légendaire. », sans `resolution` pour la plupart), 32 ont `resistance-legendaire` ; aucun n'est placé dans les trois histoires publiées.

- **Lot 1 — filet d'invariants** (`tests/combat-haut-niveau.test.ts`) : des parties entières (les six rencontres du prototype à six graines, puis un dragon blanc adulte contre six héros de niveau 8) sont jouées par l'IA et **après chaque tour** : PV entre 0 et le maximum, pas de mort avec des PV, ressources positives, positions dans la grille et hors des murs, deux combattants encore dans le combat jamais sur la même case, ordre d'initiative complet, combattant actif valide, rounds croissants. *Constat* : un fuyard (hors de combat) peut s'arrêter sur la case d'un autre combattant (« Embuscade gobeline », graine 6) ; sans effet sur les règles, l'invariant l'excepte.
- **Lot 2 — Résistance légendaire** : un monstre qui porte le trait `resistance-legendaire` naît avec la réserve `ressources.resistanceLegendaire` (le nombre écrit avant « /jour », 3 par défaut : de 3 à 6 dans le catalogue) ; **tout jet de sauvegarde raté** (`sauvegarde`, `combat/moteur.ts`) est **réussi** tant qu'il en reste, et le journal le dit (« X utilise sa Résistance légendaire… »). Le monstre l'utilise donc d'office, y compris pour un jet banal ; c'est le choix le plus simple, à affiner (par exemple ne la dépenser que si l'échec a une vraie conséquence) quand une histoire aura un boss légendaire. Le bonus « dans son antre » (4/jour) n'est pas pris en compte.
- **Lot 3 — actions légendaires** (`combat/legendaire.ts`) : un monstre qui porte le trait `actions-legendaires` naît avec une réserve (`ressources.actionsLegendaires`, le nombre écrit dans le trait : « Utilisations d'action Légendaire : 3 »), rendue en entier au **début de son tour**. **Aussitôt après le tour d'un adversaire** (`finTour`), il peut dépenser **une** utilisation pour une action légendaire qu'il sait jouer : celle qui vaut le plus (le plus de cibles, ses alliés pris dans la zone comptent contre elle) ; sinon il garde sa réserve. **Jouables** : les actions légendaires du profil (texte « Action légendaire. ») qui portent une `resolution` d'attaque ou de sauvegarde, à une cible (portée de l'action) ou en **zone** (sphère centrée sur un point qu'il voit à portée : on essaie la case de chaque ennemi ; émanation autour de lui). Une action dont le texte dit « ne peut alors plus entreprendre cette action » est **verrouillée** jusqu'au début de son tour. Ces actions **ne sont plus des cartes de son propre tour** (avant, un dragon pouvait les jouer comme action principale) ; un monstre sans le trait est inchangé. **Lot 3b — « se déplace puis attaque »** : 24 actions légendaires (« Assaut incisif » de 18 dragons, « Balayage caudal », « Offensive » de la tarasque, « Frappe immortelle » du vampire, « Frappe nécrotique » de la momie, « Traque arcanique » du sphinx : sans la téléportation) portent un champ `legendaire: { deplacement?, attaque: [ids] }` dans le profil (`schemas.ts` `ActionMonstre`, donnée écrite par script d'après le texte du profil, aucune non reconnue). Le monstre choisit la meilleure attaque listée (dégâts moyens) contre l'adversaire le plus blessé : **sans bouger** si l'un est déjà à portée, sinon il **s'approche** (chemin le moins cher dans la part de Vitesse permise, attaques d'opportunité comprises), puis frappe ; son mouvement du tour n'est pas entamé. **Lot 3c — sorts légendaires** : 14 actions « recourt à Incantation pour lancer X » portent `legendaire: { sort }` (le sort X est dans la liste `sorts.liste` du monstre et fait partie des sorts que le moteur sait jouer : Fracassement du dragon bleu, Rayon ardent des dragons d'airain et rouges, Épine mentale des dragons de cuivre et verts, Éclair traçant des dragons d'or et de bronze — « Rayon traçant » du texte). Le sort est lancé **hors du tour du monstre, sans action ni réserve** : il devient un instant le combattant actif (`executer`, donc les mêmes cartes, portées et dégâts que s'il lançait le sort à son tour), puis son tour et l'ordre sont rétablis ; une zone est centrée sur l'adversaire qui en touche le plus (ses alliés comptant contre), un sort à cible vise les plus blessés. Cela demande les sorts du catalogue : `finTour(etat, ctx?)` reçoit le contexte (ajouté aux appels de `cartes.ts` et `ia.ts`) ; sans lui, le monstre ne lance pas. **Pas encore jouées** : 16 actions légendaires, qui lancent un sort que le moteur ne joue pas (Terreur, Injonction, Immobilisation de monstre, Invisibilité), les téléportations (liche, sphinx), « Trait d'orage » du kraken et les effets sans règle. Mesure (10 parties, IA rapide, six héros de niveau 8, graines 1000 à 1009) : dragon blanc adulte, **sans** ses traits (combat d'avant) 100 % de victoires, 5,4 rounds, 81 % des PV restants ; **avec** (lots 2 et 3b) 40 %, 8,7 rounds, 7 % ; dragon d'airain adulte 90 % → 60 % ; kraken 0 % → 10 %. Un dragon adulte (FP 13 à 17) est un adversaire de niveau 12 et plus : contre un groupe de niveau 8 il est mortel, ce n'est pas un défaut.
- **À venir** : actions légendaires qui lancent un sort ou sans règle (30), réactions de monstres, grandes créatures sur plusieurs cases, IA (valoriser les affaiblissements, redirection de la multiattaque).

### Banc de haut niveau (F6, lot 4, `pnpm simuler:haut`)

`pnpm simuler:haut [parties=10] [rapide|normale] [profil]` (`outils/simuler-haut-niveau.ts`) joue un monstre légendaire contre le groupe conseillé de six héros (de vrais personnages montés au niveau du scénario), l'IA jouant les deux camps, graines 1000 et suivantes : **déterministe** (deux passages donnent la même sortie, durées exceptées). Il complète `pnpm simuler`, dont la sortie (six rencontres de niveau 3) reste la garde de non-régression de F6. **Référence du 19/11/2026** (10 parties, IA rapide, après le lot 3c) :

| Monstre (FP, niveau du groupe) | Victoires | Rounds | PV héros restants | Héros à terre | Actions lég. | Résist. lég. |
|---|---|---|---|---|---|---|
| Aboleth (10, niv. 8) | 100 % | 5,3 | 84 % | 0,2 | 0,0 | 1,5 |
| Vampire (13, niv. 12) | 100 % | 10,1 | 44 % | 1,7 | 29,1 | 0,3 |
| Dragon blanc adulte (13, niv. 12) | 80 % | 11,0 | 33 % | 2,8 | 33,0 | 1,2 |
| Dragon d'airain adulte (13, niv. 12) | 100 % | 8,4 | 53 % | 1,2 | 25,3 | 1,3 |
| Dragon rouge adulte (17, niv. 15) | 60 % | 10,3 | 19 % | 4,0 | 30,8 | 0,6 |
| Liche (21, niv. 17) | **0 %** | 9,4 | 0 % | 6,0 | 8,8 | 1,3 |
| Kraken (23, niv. 17) | 90 % | 16,2 | 48 % | 0,6 | 15,3 | 1,3 |

Lecture : 10 parties = ±15 % de bruit. **À regarder** : la liche écrase un groupe de niveau 17 (0 % de victoires) alors que les autres boss sont tenables : à comprendre avant de la placer dans un épisode (sorts de la liste lancés à son tour, Résistance légendaire, groupe de test sans équipement magique) ; l'aboleth, la licorne et le sphinx savant ont une réserve d'actions légendaires mais **aucune action légendaire écrite** dans le profil (0 action légendaire jouée pour l'aboleth) : à compléter dans les données.

### Réactions de monstres : « +N à la CA contre cette attaque » (F6, lot 5)

Décision de l'utilisateur du 19/11/2026 : la simulation de référence de `pnpm simuler 10 rapide` **change** (nouvelle référence ci-dessous), parce que ce lot touche des profils que ces rencontres jouent. Sept réactions du catalogue portent le champ `reaction: { ca, contre }` (`schemas.ts` `ActionMonstre`, écrit par script d'après le texte « ajoute N à sa CA contre cette attaque ») : **Parade** du chef de bande (+2), du vétéran (+2), du noble (+2), du gladiateur (+3), de l'érinye (+4), de la marilith (+5), toutes contre le corps à corps ; **Tourbillon de sable** de la momie (+2, contre toute attaque ; seule la part « CA » est jouée, pas la téléportation ni l'état Aveuglé). Dans `jetAttaque` (`combat/moteur.ts`, à côté du Bouclier des héros) : si une attaque de ce mode touche le monstre (hors 20 naturel), qu'il a sa réaction et peut agir, et que le bonus la ferait rater, il le dépense (sa réaction, une par round) et l'attaque rate, le journal le dit. Les 15 autres réactions du catalogue (Division, Magie protectrice de la liche, Attaque redirigée, Protection, Parade de projectile, Poursuite…) ne sont **pas** jouées.

**Nouvelle référence de `pnpm simuler 10 rapide`** (graines 1000 à 1009) : seules deux lignes bougent.

| Rencontre | Avant (lot 3c) | Après (lot 5) |
|---|---|---|
| La bande et ses ogres | 100 %, 5,2 rounds, 82 % des PV, 0,0 mort | 100 %, **4,9** rounds, **85 %**, **0,1** mort |
| Le gué des brigands | 100 %, 4,2 rounds | 100 %, **4,3** rounds |
| les quatre autres | inchangées | inchangées |

Le banc de haut niveau (`pnpm simuler:haut`) est **inchangé** (aucun de ses monstres n'a de réaction jouée). Les tests : `tests/combat-reactions-monstres.test.ts`.

### Grandes créatures sur plusieurs cases (F6, lot 6)

**Modèle** (`combat/grille.ts`) : une créature **Très grande** (`TG`) occupe **3 × 3** cases, une **Gigantesque** (`Gig`) **4 × 4** ; `position` reste sa case d'**ancrage** (la case centrale pour 3 × 3, la case de gauche du centre pour 4 × 4 : de −1 à +2), `casesOccupees(c)` donne toutes ses cases, `CASES_PAR_TAILLE` la table. Les créatures **Grandes** (`G`, 2 × 2) tiennent **encore sur une case** : les passer à 2 × 2 est une ligne de la table, mais elle changerait toutes les rencontres déjà jouées (107 monstres Grands, dont les ogres et les loups de la simulation de référence), à décider à part. **Distances** : `distanceCases` et `distanceMetres` acceptent une case, ou un combattant : entre deux créatures, c'est la distance de leurs cases les plus proches (une case contre une case : inchangée). **Occupation** : toute l'empreinte est occupée et, pour un ennemi, bloquante. **Déplacement** (`cheminsAtteignables(…, taille)`) : on ne passe, et on ne s'arrête, que si toute l'empreinte est libre de mur, d'obstacle et d'autre créature ; un terrain difficile sous un bord de l'empreinte double le pas ; un couloir de largeur 2 est fermé à un dragon. **Portée et attaques d'opportunité** : mesurées d'empreinte à empreinte (un héros collé à un bord du dragon l'atteint au corps à corps ; la sortie de son allonge se mesure depuis l'empreinte du mobile). **Zones** (sorts, actions légendaires, IA) : une créature est touchée si une case de son empreinte est dans la zone. **Placement au départ** (`preparerRencontre`) : une grande créature part de sa case de départ ou de la plus proche qui laisse toute son empreinte libre ; une case de départ prise par l'empreinte d'une grande créature cède aussi sa place. **IA** : les destinations (contact, tir, repli, rapprochement) se calculent avec l'empreinte du monstre arrivé là. **Écran** (`apps/jeu/src/composants/Plateau.tsx`) : le jeton couvre n × n cases ; **non vérifié à l'écran** (aucun combat de boss lancé dans le navigateur). Tests : `tests/combat-grandes-creatures.test.ts` (12) ; le filet d'invariants du lot 1 vérifie les empreintes.

**Référence** : `pnpm simuler 10 rapide` **inchangée** (aucun monstre de ces six rencontres n'est Très grand ou Gigantesque). `pnpm simuler:haut` (10 parties, IA rapide) change, comme prévu — les dragons et le kraken, qui n'étaient qu'un point sur la carte, se rapprochent maintenant avec toute leur masse et sont nettement plus durs :

| Monstre | Avant (lot 5) | Après (lot 6) |
|---|---|---|
| Dragon blanc adulte (niv. 12) | 80 %, 11,0 rounds, 33 % des PV | **50 %**, 14,9 rounds, 18 % |
| Dragon d'airain adulte (niv. 12) | 100 %, 8,4 rounds, 53 % | **60 %**, 12,1 rounds, 30 % |
| Dragon rouge adulte (niv. 15) | 60 %, 10,3 rounds, 19 % | **20 %**, 16,1 rounds, 5 % |
| Kraken (niv. 17) | 90 %, 16,2 rounds, 48 % | **30 %**, 26,9 rounds, 40 % |
| Aboleth, vampire, liche | inchangés | inchangés |

### Réactions de monstres, suite (F6, lot 7)

Six réactions de plus se jouent (8 monstres), par le champ `reaction` du profil (`schemas.ts`, élargi : `ca`, `duree`, `redirige`, `reduitDegats`, `sauvegarde`). Chacune est la **réaction** du monstre (une par round, rendue au début de son tour) :

- **Bouclier** (`magie-protectrice` de la liche et du mage, `ca: 5, duree: 'tour'`) : comme la réaction Bouclier d'un héros, un coup qui touche et que +5 CA ferait rater rate ; le bonus dure **jusqu'au début du prochain tour du monstre**. Seule la part « Bouclier » est jouée (pas le contresort, pas d'emplacement : le monstre n'en dépense pas).
- **Attaque redirigée** (`attaque-redirigee`, chef gobelin, `redirige: { tailleMax: 'M' }`) : quand une créature ennemie l'attaque (arme ou action de monstre à jet d'attaque), il **change de place avec un allié adjacent** de taille Petite ou Moyenne (le plus en forme), et l'allié reçoit l'attaque (`attaqueArme` et `attaqueMonstre`, avant le jet).
- **Parade de projectile** (`parade-de-projectile`, géant des pierres, `reduitDegats: { des: '1d10', bonus: 6 }, contre: 'distance'`) : une attaque à distance qui le touche voit ses dégâts physiques baisser de 1d10 + 6 ; la part « renvoyer le rocher » n'est pas jouée.
- **Accès d'ingéniosité** (sphinx savant et merveilleux, `sauvegarde: { bonus: 2, portee: 9 }`) : un jet de sauvegarde raté de lui ou d'un allié à 9 m, qu'un +2 réussirait, est réussi (`sauvegarde()`). Les « 2/jour » du sphinx merveilleux ne sont pas comptés (une réaction par round seulement).

**Pas jouées (9 réactions, 7 profils)** : Division (gelée ocre, pouding noir : créer deux créatures plus petites en cours de combat), Nuage d'encre (pieuvres : eau, visibilité nulle), Hurlement (criard : alerte sans effet de combat), Regard dérangeant (diable des chaînes : jet au début du tour d'un autre), Protection (garde animé : bonus de CA au porteur d'une amulette), Poursuite (nalfeshnie : téléportation), Antennes réactives (oxydeur : rejoue une attaque), et le contresort de la magie protectrice.

**Mesure** (`pnpm simuler 10 rapide`, avant = référence du lot 6) : une seule ligne bouge, « Embuscade gobeline » 4,1 → **3,8 rounds** (le chef gobelin fait encaisser un coup à un gobelin) ; les cinq autres sont identiques. `pnpm simuler:haut` : la liche, 9,4 → **10,1 rounds** (Bouclier), 8,8 → 9,4 actions légendaires, toujours 0 % de victoires ; les autres lignes identiques. Tests : `tests/combat-reactions-monstres-2.test.ts` (9).

### Réactions de monstres, fin (F6, lot 8)

Trois réactions de plus se jouent (quatre profils : gelée ocre, pouding noir, diable des chaînes, nalfeshnie), champs `division`, `regard` et `poursuite` de `reaction` :

- **Division** (gelée ocre, pouding noir ; `combat/moteur.ts`, `diviserSiBesoin`, appelée par `infligerDegats`) : un monstre de taille Grande ou Moyenne avec au moins 10 PV se divise, en réaction, quand il est mis **en péril** (la moitié de ses PV ou moins) ou qu'il **subit** de la foudre ou du tranchant — même s'il y est immunisé (la gelée ocre l'est : le déclencheur est de les subir). Lui et une copie ont **une taille de moins**, la moitié des PV et des PX chacun ; la copie prend place **juste après lui dans l'ordre d'initiative** (l'indice du combattant actif est corrigé) sur une case libre voisine ; sans case libre, pas de division. Aucune des deux n'a sa réaction avant son tour. Une Petite ne se divise plus. Cela touche le combat de la **Tombe** (gelée ocre de Franbinzar), qui devient plus long pour qui frappe au tranchant.
- **Regard dérangeant** (diable des chaînes ; `declencherRegards`, au début de chaque tour) : un adversaire dans les 9 m, en ligne de vue, fait le jet de sauvegarde de l'action ; raté, l'état Effrayé dure jusqu'à la fin de son tour suivant ; réussi, il est immunisé contre ce diable pour le reste du combat.
- **Poursuite** (nalfeshnie ; `poursuivre`, à la fin de chaque déplacement) : quand un adversaire finit un déplacement à 36 m ou moins, en ligne de vue, le monstre se téléporte à 3 m de lui (la case libre la plus proche de sa place).

**Toujours pas jouées (5 réactions, 5 profils)** : Nuage d'encre des pieuvres (l'eau et la visibilité nulle n'existent pas), Hurlement du criard (une alerte sans effet de combat), Protection du garde animé (le bonus de CA va au porteur d'une amulette : aucun porteur n'existe dans un combat), Antennes réactives de l'oxydeur (rejoue l'action Antennes, dont la corrosion de l'équipement n'est pas modélisée), et le contresort de la liche et du mage (il faudrait des sorts en réaction et un test de lanceur).

**Mesure** : `pnpm simuler 10 rapide` et `pnpm simuler:haut` **inchangés** (aucun de ces quatre monstres n'y figure). Tests : `tests/combat-reactions-monstres-3.test.ts` (9).
