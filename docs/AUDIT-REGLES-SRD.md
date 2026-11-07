# Audit des règles D&D (SRD 5.2.1) — 07/11/2026

Le moteur (`packages/regles`) et les données (`packages/donnees/srd`) ont été comparés au texte du SRD 5.2.1 français (`sources/srd-fr.txt` et `sources/srd-fr-flux.txt`), en trois volets : création et fiche du personnage, combat, exploration / repos / progression. Lecture seule à l'origine ; **le lot 1 (section 1) a été corrigé le 07/11/2026** (voir le journal), le reste attend la décision de l'utilisateur.

Les écarts marqués **✔ vérifié** ont été contrôlés dans le code et le SRD après coup ; les autres viennent des relectures, avec la ligne du SRD et du code citées dans le rapport, et restent à confirmer au moment de les corriger. Les choix assumés du jeu (cartes, élan, histoires sans mort définitive) ne sont pas des erreurs : ils sont listés à part.

## 1. Écarts certains, simples à corriger (lot 1 : **corrigé le 07/11/2026**)

| # | Domaine | Écart | SRD | Code | Gravité |
|---|---|---|---|---|---|
| 1 | Classe | **Clerc : sorts mineurs qui retombent à 3 dès le niveau 6** (valeurs de la colonne Conduit divin recopiées). Le SRD donne 3 → 4 au niveau 4 → 5 au niveau 10. ✔ vérifié | table des aptitudes du Clerc | `donnees/srd/classes/clerc.json` (`incantation.sortsMineurs`) | notable (niv. 6+) · **Corrigé : 3 / 4 / 5 sorts mineurs.** |
| 2 | Classe | **Moine : bonus de Vitesse figé à +3 m** ; la colonne « Déplacement sans armure » (+4,5 / +6 / +7,5 / +9 m) est juste mais n'est pas appliquée. ✔ vérifié | table du Moine | `moine.json` (effet `bonus_vitesse`), `fiche.ts` | notable (niv. 6+) · **Corrigé : `colonne` sur l'effet `bonus_vitesse`, lue dans la progression.** |
| 3 | Classe | **Manifestations occultes et Métamagie plafonnées au niveau 5** (5 et 2) ; le SRD monte à 10 et 6. ✔ vérifié | tables de l'Occultiste et de l'Ensorceleur | `donnees/srd/choix/choix.json` (`nombres`) | notable (niv. 7+) · **Corrigé : 20 niveaux (Occultiste 10, Ensorceleur 6 options).** |
| 4 | Combat | **Boire une potion coûte l'action** ; le SRD : action Bonus (pour soi ou un allié à 1,5 m). ✔ vérifié | potion de guérison (flux l. 23459) | `combat/cartes.ts` (`base:potion`) | notable · **Corrigé : action Bonus.** |
| 5 | Combat | **Jets contre la mort non remis à zéro à la stabilisation** : stabilisé avec 2 échecs, un héros meurt au premier coup suivant. ✔ vérifié | « Stabilisé » (flux l. 2581) | `combat/moteur.ts` (jets contre la mort) | notable · **Corrigé : jets remis à zéro à la stabilisation.** |
| 6 | Combat | **Dégâts de zone tirés une fois par cible** ; le SRD : un seul jet pour toutes les cibles (mains brûlantes, boule de feu…). ✔ vérifié | zone d'effet (flux l. 2421) | `combat/sorts.ts`, actions de monstre | mineur (variance) · **Corrigé pour les sorts de zone ; les actions de monstre à zone restent à une cible (section 3).** |
| 7 | Repos | **Repos interrompu = bénéfices complets** : la récupération est appliquée avant la rencontre de nuit. SRD : repos court interrompu = rien ; repos long interrompu = repos court. ✔ vérifié | repos (flux l. 35800-35849) | `monde/exploration.ts` (`seReposer`) | notable · **Corrigé : la rencontre se tire avant la récupération ; nuit interrompue = repos court, halte interrompue = rien.** |
| 8 | Économie | **Gemmes et objets d'art revendus à 50 %** ; le SRD les garde à pleine valeur. | équipement (flux l. 21182) | `modules/commerce.ts` (`rachats`) | mineur · **Corrigé : gemmes et objets d'art à 100 %.** |
| 9 | Économie | **Objets magiques à 50-75 % de la table du SRD** (potion de guérison 37,5 po au lieu de 50 ; peu courant 300 au lieu de 400 ; rare 2 500 au lieu de 4 000 ; légendaire 100 000 au lieu de 200 000). ✔ vérifié | « Rareté et valeur » (flux l. 38281) | `donnees/srd/objets/*.json` (`valeurPo`) | notable (prix des boutiques, valeur des trésors) · **Corrigé : table du SRD (100 / 400 / 4 000 / 40 000 / 200 000 po, moitié pour l'usage unique) ; le prix de l'arme ou de l'armure de base n'est pas ajouté.** |
| 10 | Rencontres | **Budget de PX limité aux niveaux 1-10** (le SRD va à 20) ; un groupe de niveau 15 reçoit le budget du 10. ✔ vérifié | rencontres de combat (flux l. 37741) | `budget.ts`, `combat/escarmouche.ts`, `monde/validation.ts` | notable (niv. 11+) · **Corrigé : budget 1-20, plafonds de 10 levés.** |

## 2. Décisions à prendre (écart réel, mais le corriger change l'équilibre) : **tranchées et traitées le 07/11/2026**

- **Corrigé** : **PX de départ à 0 quel que soit le niveau de départ** ✔ vérifié (`monde/etat.ts`) ; le groupe démarre maintenant avec les PX de son niveau (aucune histoire n'est touchée : toutes démarrent au niveau 1) : une histoire qui commence au niveau 3 demande 2 700 PX pour le niveau 4 au lieu de 1 800 de plus. Les histoires ont peut-être été calibrées ainsi (validateur et estimations) : corriger demande de revoir leurs PX.
- **Corrigé (SRD complet)** : **Influence** : le jeu faisait varier le DD (5 à 25) selon l'attitude ; le SRD garde le DD et donne Avantage (amical) ou Désavantage (hostile), avec 24 h d'attente après un échec. Désormais : DD 15, Avantage si amical (attitude ≥ 30), Désavantage si hostile (≤ -30), 24 h d'attente avant de retenter la même manière avec le même PNJ (`influenceRatee`). La jauge d'attitude reste.
- **Gardé, documenté** : **héros relevés à 1 PV après un combat d'histoire, même morts** (`apps/jeu/src/App.tsx`) : pas de mort définitive en histoire (décision de l'utilisateur, 07/11/2026).
- **Corrigé** : **niveau 19** : les 12 classes reçoivent une Faveur épique (don de faveur + caractéristique relevée de 1, max 30) ; l'amélioration en trop du Roublard et de l'Occultiste est retirée. Reste : les effets en combat des faveurs et les dons généraux à la place d'une amélioration.

## 3. Mécaniques absentes ou simplifiées (gros chantiers)

**Combat**
- Grandes créatures sur une seule case (le SRD : G = 2×2, TG = 3×3, Gig = 4×4).
- 105 actions de monstre à zone (souffles de dragon…) ne touchent qu'une cible ; 186 actions de monstre sans résolution (la carte consomme l'action et ne fait rien) ; résistance à la magie, actions et résistances légendaires, régénération non gérées.
- États manquants : Pétrifié, Assourdi, Invisible, Épuisement (Étourdi ajouté le 07/11/2026).
- Armes Légère (attaque à deux armes) et Polyvalente (dégâts à deux mains) ignorées ; botte Coup double déclarée mais jamais appliquée ; styles Armes à deux mains et Combat à deux armes ignorés.
- Actions manquantes : Aider (dont stabiliser par Médecine DD 10), Se cacher, Préparer, Lutte et Bousculade ; pas de surprise à l'initiative ; couvert limité au demi-couvert.
- Aptitudes non jouables : ~~Châtiment divin~~, Imposition des mains, ~~Ki (Credo) et frappe bonus du Moine~~, ~~Inspiration bardique~~ (**jouables depuis le 07/11/2026**, voir `docs/COMBAT.md` §10), Métamagie, Sorcellerie innée, Forme sauvage.

**Personnage**
- Sorts de lignage des niveaux 3 et 5 (elfe, tieffelin) absents ; don Initié à la magie limité (pas de liste Druide, pas d'humain par Polyvalent) ; grimoire du Magicien, Arcanum mystique de l'Occultiste (sorts 6-9) absents ; Cercle de la Terre limité au climat tempéré ; multiclassage absent ; plafond 20 même pour les Faveurs épiques.

**Hors combat**
- Harmonisation automatique et partielle (armures, boucliers et armes magiques non comptés) ; objets à charges inutilisables hors combat ; ressources de Moine, Ensorceleur, Druide, Barde, Magicien non gérées au repos ; pas d'Épuisement, de rythme de voyage, de lumière.
- Pièges : pas de mort instantanée, pas de résistances, états écrits mais non appliqués.

## 4. Écarts mineurs

Combat : Entravé (désavantage aux JS de Dex), Agrippé (désavantage hors agrippeur), Effrayé (vue de la source, ne pas s'approcher), Charmé (ne pas attaquer le charmeur), Esquive (perdue à Vitesse 0), Rage sans expiration et sans avantage en Force, Témérité sur toute attaque au corps à corps, attaque sournoise une fois par tour du roublard seulement, diagonale entre deux murs, Contact glacial sans effet, Poigne électrique bloque toute réaction, Sommeil endort les elfes, Robustesse de la non-vie du zombi ignorée.
Hors combat : crochetage sans maîtrise de l'outil (ni Avantage compétence + outil), repos court qui dépense tous les dés de vie (et n'avance pas l'horloge), repos long sans condition de 1 PV ni délai de 16 h, monnaie sans pe ni pp, Doué sans les outils, Touche-à-tout sans l'initiative.

## 5. Choix assumés du jeu (pas des erreurs)

Cartes et élan en combat ; pas de mort définitive en histoire (héros relevés à 1 PV après un combat) ; égalités d'initiative par la Dextérité puis héros d'abord ; réactions automatiques ; monstres morts à 0 PV ; emplacement de sort le plus bas ; une fouille par lieu et par jour ; désamorçage raté de 5 ou plus qui déclenche le piège ; crocheter devant témoins (jet de Discrétion, arrêt, alerte) ; défaite = 1 PV, moitié de l'or, 8 h ; identification par Arcanes ; budget des escarmouches calé par simulation ; kit de départ allégé.

## 6. Ce qui est conforme (vérifié par les relectures)

Modificateurs, bonus de maîtrise, seuils de PX 1-20 ; tableau standard et achat de points ; bonus d'historique ; PV (niveau 1 au maximum, puis moyenne), Robustesse naine, Résistance draconique ; CA de toutes les armures, bouclier, défenses sans armure ; jets de sauvegarde et compétences par classe ; expertises ; DD et bonus d'attaque des sorts ; emplacements des 9 classes lanceuses et magie de pacte ; kits de départ ; propriétés des 38 armes.
Initiative, mouvement fractionnable, terrain difficile, attaque d'opportunité, critiques (dés doublés), 1 naturel, avantage et désavantage, À terre, Aveuglé, Paralysé, Inconscient, portée longue, résistances et vulnérabilités, PV temporaires, mort massive, concentration (DD plafonné à 30), un seul sort d'emplacement par tour, sorts mineurs aux niveaux 5/11/17, Attaque sournoise, Attaque supplémentaire, Second souffle, Fougue, bottes d'arme (hors Coup double).
Tests d20 (20 et 1 sans effet hors attaque), perception passive, repos long (tous les PV, dés de vie et emplacements), repos court (Second souffle, Rage, Conduit divin, emplacements de pacte), potions 2d4+2 à 10d4+20, capacité de charge, monnaie po/pa/pc, budget de PX niveaux 1-10, partage des PX.
