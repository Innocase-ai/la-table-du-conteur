# Audit du moteur de jeu (18/11/2026)

Audit en lecture seule de `packages/regles` : noyau à modules, moteur de monde (exploration, dialogue, présences, quêtes, jauges, fins, scènes, tirage d'arrivée, estimation), combat, création et équipement, validateur et parcours automatique, sauvegardes et migrations. Aucun fichier du moteur n'a été modifié, rien n'a été commité, aucune API n'a été appelée. Ce rapport est le seul fichier créé.

**Corrigés le 18/11/2026** :
- M1, M2 et M3 (rangs 1 à 3 du §7), test `packages/regles/tests/audit-moteur-correctifs.test.ts` (13 tests, dont 10 qui échouaient avant la correction).
- M4 et M5 (rangs 4 et 5, combat touché avec l'accord de l'utilisateur), test `packages/regles/tests/audit-moteur-combat.test.ts` (5 tests, dont 4 qui échouaient avant). Comparaison des simulations au §8.

Les autres constats restent à faire.

**Méthode.** Quatre relectures menées en parallèle (Opus) : exploration et monde ; dialogues, objets et économie ; combat ; noyau, création et vérification. Chaque constat est reproduit par un petit script jetable, placé hors du dépôt. Les constats graves ont été relancés et relus dans le code par l'auteur du rapport. Les points déjà connus (`AUDIT-MOTEUR-JEU.md`, `AUDIT-COMBAT.md`, `AUDIT-REGLES-SRD.md`, `AUDIT-DIALOGUES-PNJ.md`, `AUDIT-CREATION.md`, dépendances de la fiche F3 dans `PRD-SAGA.md`) ne sont pas repris. Ils sont seulement revérifiés au §6.

**Certitude.** *Reproduit* : un script montre le défaut. *Lu* : le défaut est vérifié ligne à ligne dans le code, sans script. *Plausible* : le défaut est probable, mais pas démontré en partie réelle.

**Gravité.** *Bloquant* : la partie ou le combat ne peut plus avancer, ou un contenu est perdu pour toujours. *Gênant* : la règle est fausse ou contournable, mais on continue à jouer. *Cosmétique* : texte, cas latent ou rare.

## 0. Mesures de départ

- **`pnpm test`** (code de sortie 0) : `Test Files 183 passed (183)`, `Tests 2600 passed | 3 skipped (2603)`, durée 39,66 s. Les 3 tests sautés le sont volontairement : `parcours.test.ts:161`, « les mondes réels », ne tourne qu'avec `PARCOURS_LENTS`, et `apps/jeu/src/fichiers-audio.test.ts:52` demande ffmpeg.
- **`pnpm typecheck`** (code de sortie 0) : aucune erreur sur `packages/regles`, `outils`, `apps/atelier` et `apps/jeu`, en 19,5 s.
- **Robustesse du combat** : 300 combats, IA rapide des deux côtés, groupes de 1 à 6 héros, niveaux 1 à 20, 6 thèmes × 3 difficultés, arrêt au 40e round. Résultat : **0 plantage**, 236 victoires, 54 défaites et **10 combats qui ne finissent pas** (§2, M7). Aucun PV hors bornes, aucune ressource négative, aucune case occupée deux fois, et la reprise après passage en JSON se déroule à l'identique. On relève aussi 6 victoires où des PX manquent (M8) et des effets « orphelins » dans environ 250 combats (M9).
- **Noyau** : environ 4 000 actions jouées au hasard dans les 4 mondes, avec la partie gelée en profondeur (`Object.freeze`) avant chaque commande. Aucune commande ne modifie la partie d'entrée et aucune erreur interne n'apparaît.
- **Création** : 432 combinaisons (12 classes × 9 espèces × niveaux 1, 5, 11 et 20). Aucun plantage, PV de 7 au moins, CA de 11 à 19, aucun emplacement de sort négatif, toujours au moins une arme dans le kit. Une valeur de 21 n'apparaît qu'avec la Faveur épique, ce qui est voulu.
- **Parcours automatique sur les vrais mondes** : toutes les fins sont trouvées. Le Médaillon prend 10 s et 212 Mo, la Tombe 14 s et 489 Mo, la Dîme 6 s et 121 Mo, la Marche 18 s et 611 Mo.

En résumé, le noyau transactionnel et le combat sont solides : ni plantage ni mutation, et une sérialisation fidèle. Les défauts se trouvent dans les cas limites, entre les modules : conversation et repos, rencontre fortuite et trésor, sauvegarde et monde modifié, bord de la grille.

---

## 1. Bloquants

### M1. Payer une chambre le soir laisse le joueur dans une conversation vide · **corrigé le 18/11/2026**
- **Correction faite** : `fermerDialogueSansInterlocuteur` (`modules/dialogue.ts`) ramène en exploration une conversation dont le PNJ n'est plus là. Elle est appelée après un service payé (`modules/commerce.ts`, `apresService`), après une influence, quand le jour ou le lieu change (réactions `jourSuivant` et `deplacement`) et au chargement d'une partie. « Fin du dialogue » est désormais proposé dans toute conversation, même sans interlocuteur.
- **Où** : `modules/commerce.ts:144-151` (service de nuit) et `modules/dialogue.ts:170-173` (« Fin du dialogue » n'est proposé que si le PNJ est présent).
- **Ce qui se passe** : le service de nuit fait passer la nuit. Au réveil, le PNJ a changé de lieu selon ses présences, mais la scène reste « dialogue ». Le joueur n'a plus de bouton pour parler, plus de « Fin du dialogue », et Échap ne fait rien, car l'écran s'appuie sur ce bouton (`EcranAventure.tsx:534`). Il ne reste que des boutons de boutique, qui sont refusés (« Ce personnage n'est pas là »). `parler` traite déjà ce cas (`dialogue.ts:65-68`), mais pas `payerService` ni `influencer`.
- **Reproduire** : `audit-dialogue-objets/05-chambre-pnj-absent.ts`. Dans la Dîme, avec Bastien (présence `jour@mir-place-du-marche`) :
  `à 19 h : payé → scène dialogue (bastien), 8 h jour 2, PNJ présent : false, boutons : 30 (rendrePotion, retirerEquipement, lancerSort, acheter, payerService, accepterQuete)`. Le même cas à 23 h donne le même résultat. À 8 h, tout va bien.
- **Gravité** : bloquant, puisque louer une chambre le soir est le cas normal. Bug, reproduit. L'audit des dialogues l'avait noté « peu probable ».
- **Correction** : proposer toujours `quitterDialogue` quand la scène est « dialogue ». Après toute commande, repasser en exploration si l'interlocuteur n'est plus là, comme le fait déjà `parler`.

### M2. Une rencontre fortuite fuie ou perdue garde pour toujours les trésors de son lieu · **corrigé le 18/11/2026**
- **Correction faite** : `gardienEnPlace` (`monde/etat.ts`) ignore les rencontres fortuites de la partie (`exploration.rencontresAuto`). Une rencontre écrite fuie garde toujours sa salle, comme avant.
- **Où** : `monde/etat.ts:67-74` (`gardienEnPlace`) et `monde/hasard-arrivee.ts:136-140`.
- **Ce qui se passe** : le tirage d'arrivée crée un combat fortuit `auto-<lieu>-<n>`. Si le groupe fuit ou perd, ce combat reste « non fait ». `gardienEnPlace` le traite alors comme un gardien qui « tient sa salle » et refuse tous les trésors du lieu. Or aucun lieu ne déclare ce combat : il ne revient jamais, et le trésor reste gardé pour toujours.
- **Reproduire** : `audit-exploration/e1-fortuite-garde-tresor.ts` et `e1d-objet-de-quete-perdu.ts`.
  - Médaillon : `prendre « armoire-de-mahaut » : REFUS — Armoire de Mahaut est gardé : Une rencontre inattendue.`, puis le même refus « cinq jours plus tard ».
  - Dîme : `auto-mir-moulin-roux-1, fuite ; prendre z1-t-registre-du-moulin (registre-du-moulin) : Le tiroir sous la farine est gardé`.
  - Dans la Dîme, l'étape « moulin » garde une autre voie (`completion: ou [objet registre-du-moulin, flag pacte-revele]`) : la quête reste jouable, mais le registre est perdu. Le script `e1c-tresors-utiles.ts` liste 28 trésors exposés qui contiennent un objet cité ailleurs (herbes-de-velours, jeton-de-grain, couronne-rois-serpents…).
- **Gravité** : bloquant (un contenu perdu pour toujours, parfois un objet de quête). Bug, reproduit.
- **Correction** : dans `gardienEnPlace`, ne retenir que les rencontres déclarées par un lieu (ignorer les `auto-*`), ou laisser revenir la rencontre fortuite au retour suivant.

### M3. Une sauvegarde qui cite une rencontre, un lieu ou un champ disparus bloque la partie · **corrigé le 18/11/2026**
- **Correction faite** (`noyau/moteur.ts`) :
  - `charger` remet à leur valeur de départ une scène, des modules, un journal ou un état d'exploration absents. Il ramène un lieu courant inconnu au dernier lieu visité qui existe encore, sinon au départ.
  - Il oublie un `combatEnCours` de forme inconnue, et ramène en exploration une scène de rencontre retirée du monde, une fois les rencontres fortuites de la partie remises en place. Le cas du PNJ retiré du monde est traité par M1.
  - `disponible` est passé dans le `try` d'`executer`.
  - `propositions`, `encarts` et `commandes` isolent l'erreur d'un module (`sansPlanter`) : ses boutons disparaissent, ceux des autres restent.
  - `migrer` est inchangé : une sauvegarde sans version ni état est toujours refusée.
- **Où** : `noyau/moteur.ts:145-155` (`charger` répare les jauges, réputations et attitudes, mais pas la scène ni le lieu courant), `monde/scene.ts:44` et `:56` (`dm.lieux.get(etat.lieu)!`), `noyau/moteur.ts:80` (`disponible` est appelé avant le `try`), `noyau/migrations.ts` (`migrer` ne vérifie ni `scene`, ni `modules`, ni `etat.exploration`, ni `journal`).
- **Ce qui se passe** : le cas arrive dès qu'une histoire est mise à jour alors qu'un joueur a une partie en cours, ce que la saga va rendre courant.
  - Scène sur une rencontre supprimée : aucune proposition, et toutes les issues sont refusées.
  - Lieu courant supprimé : `propositions()` et la vue de scène lèvent une exception, hors du filet de sécurité d'`executer`.
  - Champ absent : `executer` lève une exception au lieu de refuser.
- **Reproduire** : `audit-exploration/e2-sauvegarde-entite-supprimee.ts` et `audit-noyau-creation/n2-blocages.ts`, `n1-sauvegardes.ts`.
  `A. reglerRencontre fuite : Rencontre inconnue : r-supprimee-du-monde.` / `A. propositions offertes : []` / `B. propositions : EXCEPTION — Cannot read properties of undefined (reading 'id')` / `sans scene : … executer JETTE : Cannot read properties of undefined (reading 'type')`.
- **Gravité** : bloquant. Bug, reproduit. Les constats S3 et S5 de `AUDIT-MOTEUR-JEU.md` ne sont donc corrigés qu'en partie.
- **Correction** :
  - Dans `charger`, ramener une scène (rencontre, PNJ, événement) inconnue à l'exploration, et un lieu inconnu au dernier lieu visité qui existe encore, sinon au départ du monde.
  - Jeter un `combatEnCours` dont la forme est invalide.
  - Mettre `disponible` dans le `try`, et protéger `propositions` et `encarts` de la même façon.
  - Dans `migrer`, refuser clairement une sauvegarde à laquelle il manque `scene`, `modules` ou `journal`, ou leur donner une valeur par défaut.

### M4. La botte Poussée envoie la cible hors de la grille, et le combat ne finit plus · **corrigé le 18/11/2026**
- **Correction faite** : la botte appelle `repousser(etat, attaquant.position, cible, 2)` (`combat/sorts.ts`), qui vérifie les bords de la grille ; la copie de `moteur.ts` est supprimée. Le reste ne change pas : 3 m, taille G au plus, même ligne de journal, rien sur une cible morte. Test : `tests/audit-moteur-combat.test.ts`. Simulation de référence identique (§8).
- **Où** : `combat/moteur.ts:966`. Le code lit `cases[p.y * largeur + p.x] ?? 'mur'` sans vérifier `x`. À `x = -1`, l'index retombe sur la dernière case de la ligne précédente, qui est franchissable. `repousser` (`combat/sorts.ts:252`) vérifie, lui, les bords.
- **Ce qui se passe** : le monstre se retrouve en `x = -2`. Il ne peut plus bouger, personne ne peut le cibler, et le combat tourne sans fin.
- **Reproduire** : `audit-combat/poussee-bloque.ts`.
  `gobelin en {"x":-2,"y":2} PV 9` / `cases où le gobelin peut aller : 0` / `cibles des attaques de Bran : attaque:epee-longue=[] …` / `après 200 tours d'IA : round 101, vainqueur aucun`.
  Une carte publiée a un bord ouvert : `marche-d-ombrefiel/rencontres/z1-pont.json`, l'embuscade du pont (`bords.ts`). Les armes qui portent cette botte sont la massue, le marteau de guerre, la pique et l'arbalète lourde.
- **Gravité** : bloquant. Bug, reproduit.
- **Correction** : remplacer le bloc par un appel à `repousser(etat, attaquant.position, cible, 2)`, ce qui supprime aussi le doublon. *Le combat est gelé (PRD-SAGA P3) : cette correction demande un accord explicite et la simulation de référence avant et après.*

---

## 2. Gênants

### Combat (tous dans `src/combat/`, gelé par P3)

**M5. « Héros auto » gonfle la Force d'un héros sans qu'il boive la potion.** · **corrigé le 18/11/2026**
- **Correction faite** : `clonerCombattant` (`combat/etat.ts`) copie aussi `mods`, `sauvegardes`, `competences`, les attaques (et leur tableau de dégâts) et celles de l'autre jeu d'armes. Test : `tests/audit-moteur-combat.test.ts`. Simulation de référence identique ; coût mesuré : +8,5 % de temps sur la simulation (§8).
- **Où** : `combat/etat.ts:298-311` (`clonerCombattant`), `combat/objets.ts:120-129`, `combat/ia.ts:295-298`.
- **Ce qui se passe** : `clonerCombattant` partage `mods`, `sauvegardes`, `competences` et `attaques` avec l'état réel. `appliquerObjet` modifie ces objets en place. Or l'IA simule toutes les cartes jouables, y compris `base:objet-*`, alors que `COMBAT.md` dit qu'elle ne les joue pas. La simulation modifie donc le vrai héros.
- **Reproduire** : `audit-combat/repro.ts`, bloc C-fuite-force. `étape choisie : Javeline (lancer) → g1 — potion encore en réserve : 1` / `AVANT : For 3 … epee-longue:+5/3` / `APRÈS : For 5 … epee-longue:+7/5`.
- **Gravité** : gênant, et même grave quand cela arrive, car tout le combat est faussé. Bug, reproduit.
- **Correction** : cloner en profondeur ces quatre champs, ou appliquer la potion par un modificateur au lieu de muter le combattant. Exclure aussi `base:objet-` de l'IA si c'est voulu.

**M6. Fougue jouée au milieu de l'action Attaque fait perdre l'attaque restante.**
- **Où** : `combat/cartes.ts:729-730` remet `attaquesRestantes` à 0.
- **Reproduire** : `repro.ts`, bloc C-fougue, avec un Guerrier de niveau 5 : `après 1 attaque : … attaquesRestantes 1` / `Fougue → attaquesRestantes 0` / `attaques faites sur le tour : 3 (SRD : 2 + 2 = 4)`.
- **Gravité** : gênant. Écart au SRD, reproduit.
- **Correction** : ne pas remettre le compteur à zéro. `consommerAttaque` ouvrira la nouvelle action quand la réserve sera vide.

**M7. Un monstre hors d'atteinte ne s'approche jamais.**
- **Où** : `combat/ia.ts:80-99` (`evaluer` ne note pas la distance, sauf avec la doctrine `garderDistance`), `ia.ts:311` et `:386`.
- **Ce qui se passe** : quand rien n'est atteignable ce tour-ci, toutes les étapes ont la même note. Le tri stable garde la première candidate, « fin du tour ».
- **Reproduire** : `audit-combat/non-fini.ts crypte 15 1 moderee 7481 normale`. L'ogre zombi reste en (17,1) du round 1 au round 41 alors que le chemin est libre. Cela arrive dans 10 combats sur 300, presque tous avec 1 ou 2 héros. Ces combats comptent comme des défaites dans `pnpm simuler` et `pnpm escarmouches`, ce qui fausse les mesures d'équilibre.
- **Gravité** : gênant. Bug d'IA, reproduit.
- **Correction** : départager les ex æquo par la distance à l'ennemi le plus proche, sauf pour les doctrines de tir.

**M8. Une victoire par Sommeil (monstres inconscients) ne rapporte pas leurs PX.**
- **Où** : la formule « mort ou en fuite » existe en trois copies, `combat/resultat.ts:21`, `apps/jeu/src/App.tsx:130` et `apps/jeu/src/composants/xp-combat.ts:15`. `resultatDeCombat` n'est toujours pas branché dans App.
- **Reproduire** : `audit-combat/robustesse.ts 300`, cas n° 48 : `embuscade-gobeline niv1 x6 faible graine 7624 : 200/450 (chef-gobelin-1:21 inconscient, combattant-gobelin-1:10 inconscient)`. Le cas se produit 6 fois sur 300.
- **Gravité** : gênant. Bug, reproduit.
- **Correction** : à la victoire, compter tous les monstres hors de combat, puis faire lire ce seul bilan par App et `xp-combat`.

**M9. Un effet qui devait finir au tour de sa source dure tout le combat si cette source meurt ou fuit.**
- **Où** : `combat/moteur.ts:158-161`, `:251-260` et `:269`. Seuls les effets du combattant actif expirent, or les morts et les fuyards sont sautés (`:283`). De plus, `fuir` (`ia.ts:436-438`) ne met pas fin à la concentration : la Bénédiction d'un prêtre en fuite reste sur ses alliés (lu dans le code).
- **Effets concernés** : Aider, Rayon de givre, Rayon empoisonné, Ralentissement, Éclair traçant.
- **Reproduire** : `repro.ts`, bloc C-orphelin : `vainqueur aucun, round 3 : Vitesse du gobelin 6 ; modificateurs [ 'rayon-de-givre(expire au tour de ambrine)' ]`. L'essai de robustesse trouve un effet orphelin dans environ 250 combats sur 300, surtout `aide-attaque`.
- **Gravité** : gênant. Bug, reproduit (la concentration du fuyard est lue dans le code).
- **Correction** : à la mort ou à la fuite d'une créature, purger les effets liés à son tour et appeler `finConcentration`.

**M10. Une multiattaque à portées mêlées prend pour toutes ses attaques la portée de la première.**
- **Où** : `combat/cartes.ts:270-272` (portée de la carte) et `:658-666` (aucun contrôle de portée par attaque).
- **Ce qui se passe** : 16 profils sont touchés, dont l'enlaceur, le rat-garou, le balor et la momie. Le regard de la momie, qui porte à 18 m, ne part qu'au contact.
- **Reproduire** : `audit-combat/multiattaques.ts`. `Essai enlaceur à 15 m de Bran : … jouable=true` / `Enlaceur attaque Bran (Morsure) : 18 → 25, touché.` La morsure porte pourtant à 1,5 m.
- **Gravité** : gênant. Bug, reproduit.
- **Correction** : dans la boucle, sauter ou rediriger une sous-attaque qui n'atteint pas la cible.

**M11. Préservation de la vie (Clerc) ignore les alliés à 0 PV mais dépense quand même le Conduit divin.**
- **Où** : `combat/cartes.ts:746`. La carte passe par `allies()`, qui exclut les héros à 0 PV, et son filtre `< pvMax/2` est strict. Le SRD dit « en sang », c'est-à-dire la moitié ou moins.
- **Reproduire** : `audit-combat/preservation.ts` : `{"ok":true} → Bran 0/28 PV, conduit restant 1`.
- **Gravité** : gênant. Écart au SRD, reproduit.
- **Correction** : prendre les alliés non morts, comme le fait la potion (`cartes.ts:471`), et comparer avec `<=`.

### Monde et exploration

**M12. Dormir après minuit contourne l'horloge, et dormir à 6 h ou 7 h saute encore une journée.**
- **Où** : `monde/exploration.ts:1050-1067`. C'est un reste du constat X6.
- **Ce qui se passe** :
  - Couché entre 0 h et 5 h, le groupe ne passe pas par `nouveauJour`. La jauge « repos-long » de la Dîme et de la Tombe n'avance pas, et la fouille du jour reste consommée, alors que le message dit « revenir après un repos ».
  - Couché à 6 h ou 7 h, le groupe dort 25 ou 26 h.
  - Seize haltes d'une heure suffisent pour atteindre minuit.
- **Reproduire** : `audit-exploration/e5-nuit-apres-minuit.ts`. `couché à 1 h → jour 1→1, 9 h (8 h de sommeil) ; jauge dime 0→0 ; refouiller : NON` / `couché à 6 h → jour 1→2, 8 h (26 h de sommeil)`. La Tombe donne le même résultat avec `soupcon-et-tension`.
- **Gravité** : gênant. Bug, reproduit.
- **Correction** : appliquer les évolutions « repos-long » et les événements de repos à toute nuit complète, compter la fouille par repos plutôt que par jour civil, et calculer le réveil à heure + 8 entre 6 h et 8 h.

**M13. La Tombe : le niveau 3 est accessible dès le 5e pas.**
- **Où** : données (`tombe-des-rois-serpents/lieux/z3-niveau3.json`, lien `n3-escalier-surface` ↔ `bivouac-entree`) et `monde/exploration.ts:418`.
- **Ce qui se passe** :
  - Le passage secret est à double sens (`sens: double`) avec un DD de Perception de 15. La Perception passive du groupe conseillé vaut 16 : le passage est trouvé dès l'arrivée au bivouac, sans jet.
  - Les niveaux 1 et 2 se sautent alors entièrement. Le parcours atteint `fin-partage-honnete` en 72 pas, rejoué sans refus par le vrai moteur.
  - Bug du moteur au passage : le texte de découverte reprend `lien.description` (des marches « qui montent vers l'air libre »), écrit depuis l'autre côté, au lieu de `retour`.
- **Reproduire** : `audit-noyau-creation/p3-raccourci-tombe.ts` donne, pour chaque graine, `passage vers le niveau 3 découvert à l'arrivée : true ; perception passive max 16`. Voir aussi `p2-chemin-tombe.ts`.
- **Gravité** : gênant. Bug (données et moteur), reproduit.
- **Correction** :
  - Données : rendre le passage à sens unique (n3 → bivouac), ou monter son DD au-dessus de la Perception passive.
  - Moteur : utiliser le texte de `retour` quand on découvre le passage depuis l'autre côté.
  - Validateur : donner un avis quand un passage caché relie deux niveaux différents avec un DD ≤ à la Perception passive du groupe conseillé.

**M14. Un 4 au dé d'arrivée rouvre toute la fouille du jour.**
- **Où** : `monde/hasard-arrivee.ts:187`. Le code retire l'entrée `fouilles` du lieu.
- **Ce qui se passe** : la fouille suivante relance tous les jets contre toutes les cachettes, pas seulement la trouvaille. La règle « une fouille par lieu et par jour » (choix assumé) se contourne par des allers-retours.
- **Reproduire** : `audit-exploration/e6-decouverte-rouvre-fouille.ts` : `2e fouille le même jour (1) : ACCEPTÉE — jets : investigation 17, investigation 14`.
- **Gravité** : gênant. Bug, reproduit.
- **Correction** : la trouvaille ne lance que son propre jet, et l'entrée `fouilles` reste en place.

**M15. Les indices d'énigme à jet se relancent sans coût, ou se perdent pour toujours.**
- **Où** : `monde/exploration.ts:1007-1021` et `modules/exploration.ts:261-268`. Le conteur peut aussi appeler `indiceEnigme`, qui n'est pas dans `COMMANDES_HORS_CONTEUR`.
- **Ce qui se passe** : chaque appel relance tous les jets jusqu'au niveau demandé, même ceux déjà réussis.
  - Par les boutons : un jet raté au niveau 3 n'affiche plus qu'« Plus d'indice », pour toujours.
  - Par la commande : tous les jets se relancent gratuitement.
- **Reproduire** : `audit-exploration/e7-indices-relances.ts` (Tombe, `e-autel-du-cobra`). `(b) tous les indices obtenus après 2 appel(s) … sans aucun coût ; jour 1, heure 8`.
- **Gravité** : gênant. Bug, reproduit.
- **Correction** : mémoriser chaque indice obtenu. Un jet raté se retente après un repos ou contre du temps.

**M16. Le tirage d'arrivée écrit dans le monde partagé.**
- **Où** : `monde/hasard-arrivee.ts:138` (`p.dm.rencontres.set`) et `monde/exploration.ts:69` (`if (!dm.rencontres.has(id))`).
- **Ce qui se passe** : le monde chargé est modifié, contrairement à ce qu'affirme l'audit du 11/11. Si une autre partie a déjà créé une rencontre du même identifiant dans la même session, la définition de la sauvegarde rechargée n'écrase pas la sienne.
- **Reproduire** : `audit-exploration/e11-monde-partage-modifie.ts`. `B rechargée : sa sauvegarde dit [combattant-gobelin ×3 …]` / `le monde lui fait combattre [bandit ×3 …]`.
- **Gravité** : gênant. Bug et fragilité, reproduit dans le moteur. En jeu, c'est plausible : il faut charger deux parties dans la même session.
- **Correction** : lire les rencontres `auto-*` dans la partie (`ex.rencontresAuto`), jamais dans `dm`, ou au moins les écraser toujours au chargement.

### Dialogue, objets, progression

**M17. Une quête échouée peut encore être terminée, et elle verse alors ses récompenses.**
- **Où** : `monde/etat.ts:313`. `terminerQuete` teste seulement `terminee`, alors que `echouerQuete` (`:326`) teste les deux statuts.
- **Reproduire** : `audit-dialogue-objets/06-quete-echouee-puis-terminee.ts` : `q-contrat-eau-du-fort : echouee → terminee ; PX 0 → 40 ; or 120 → 150`. Voir aussi `audit-exploration/e3-quete-echouee-puis-terminee.ts`.
- **Gravité** : gênant. Bug, reproduit au niveau de la fonction. Aucune donnée actuelle ne le déclenche à coup sûr.
- **Correction** : une ligne, `if (q.statut === 'terminee' || q.statut === 'echouee' || !def) return;`.

**M18. Un secret à jet propre se retente trois fois par 24 h en changeant seulement de manière.**
- **Où** : `monde/dialogue.ts:136`, `:158` et `:182-184`.
- **Ce qui se passe** : le délai est rangé sous la clé `pnj:manière:secret`, alors que le jet utilise la compétence et le DD du secret. Persuasion, intimidation puis tromperie donnent donc trois fois le même jet. De plus, l'orateur choisi est le meilleur du groupe dans la manière, pas dans la compétence testée.
- **Reproduire** : `audit-dialogue-objets/04-secret-trois-manieres.ts` (Dîme, Anselme Roux, `f-pacte-du-meunier`) : `persuasion … 7 raté / intimidation … 2 raté / tromperie … 20 réussi`.
- **Gravité** : gênant. Bug, reproduit.
- **Correction** : quand le secret a son propre jet, utiliser la clé `pnj:secret`, et choisir l'orateur selon la compétence testée.

**M19. Des services ne sont reconnus qu'à un mot de leur identifiant : trois services de la Tombe sont payés sans effet.**
- **Où** : `modules/commerce.ts:33-35`. Le type d'un service est deviné par des expressions régulières sur l'identifiant (`/soin|…/`, `/chambre|dortoir|…|abri|refuge/`, `/identification/`).
- **Ce qui se passe** : dans la Tombe, `identifier-elara` (15 po), `gite-fort` (« Chambres propres ») et `benediction-chapelain` (« soins légers ») sont payés sans rien faire. À l'inverse, « abri » reconnaît aussi « fabrication », et « soin » reconnaît « besoin ».
- **Reproduire** : `audit-dialogue-objets/09-services-tombe.ts` : `identifier-elara : payé ; or 200 → 185 ; … anneau-griffe-croc identifié : false` / `gite-fort : payé ; or 200 → 198 ; heure 10 → 10 ; PV 1 → 1/32`.
- **Gravité** : gênant, et touche une histoire publiée. Bug et fragilité, reproduit.
- **Correction** : ajouter un champ explicite `type: soins | nuit | identification` au schéma des services (facultatif, l'ancienne détection restant en repli, selon P1), et un avis du validateur pour un service sans type ni effet.

**M20. Une montée de plusieurs niveaux d'un coup fige les choix des niveaux intermédiaires.**
- **Où** : `creation/progression.ts:138-178` et `modules/progression.ts:79-102`. Le code compare seulement les niveaux N−1 et N.
- **Ce qui se passe** : l'amélioration et les sorts du niveau intermédiaire, choisis automatiquement, ne peuvent plus être revus. Le cas arrive quand un chapitre libère l'XP gardée en réserve, comme pour la Tombe, qui suit le Médaillon.
- **Reproduire** : `audit-noyau-creation/c2-saut-de-niveaux.ts` : `saut 3 → 5 … améliorations {"total":1,"figes":1}` / `le joueur veut +2 Con à la place : {"ok":false,"erreur":"Un choix des niveaux précédents ne peut pas être changé."}`. Voir aussi `audit-dialogue-objets/03-montee-plusieurs-niveaux.ts`.
- **Gravité** : gênant. Bug, reproduit sur les fonctions. En partie réelle, c'est plausible.
- **Correction** : garder le niveau de départ de la montée et calculer les choix figés depuis ce niveau.

**M21. Une « Armure +1 » générique s'équipe comme un vêtement et retire la vraie armure (O5 a évolué).**
- **Où** : `modules/equipement-regles.ts:33-36`. Sans `base`, l'objet devient « porté » au torse.
- **Reproduire** : `audit-dialogue-objets/07-equipement.ts` : `armure-magique-plus-1 sur bran : ok ; CA 17 → 14 ; … armure lue par le combat : undefined`.
- **Gravité** : gênant, mais latent : aucun monde ni aucune table ne place cet objet. Bug, reproduit.
- **Correction** : refuser d'équiper une armure ou une arme magique sans `base`.

### Validateur et parcours (les garde-fous des futurs épisodes)

**M22. Le validateur accepte des mondes cassés.**
- **Où** : `monde/validation.ts`, `monde/references.ts:37-53` et `monde/quete-sautable.ts:12-16, 51`.
- **Ce qui se passe** :
  - `refsEffet` ne visite pas l'effet `debloquer` : une cible inexistante passe sans erreur.
  - Seul l'accès depuis le départ est vérifié : un lieu sans retour (lien à sens unique vers un cul-de-sac) n'est pas signalé.
  - Les conditions impossibles passent sans un mot : jauge exigée au-delà de son maximum, `et` contradictoire, `niveauGroupe` au-delà du maximum du monde, verrou DD 40 sans clé.
  - Une étape de quête principale qui exige un objet que rien ne donne n'est qu'un avis.
  - « Quête sautable » ne fait que chercher le nom de la quête dans la condition : un passage `{ non: { quete active } }`, ou un `ou` qu'un drapeau suffit à ouvrir, compte à tort comme protégé.
- **Reproduire** : `audit-noyau-creation/v1-validateur.ts` donne `A. debloquer vers un lieu inexistant : +0 erreur(s), +0 avis`, `B. cul-de-sac … +0 erreur(s)`, et aussi F, G, H et M à `+0`, ainsi que `I. … { non: quête active } : +0`. Voir aussi `audit-exploration/e8-cul-de-sac.ts`. Les quatre vrais mondes n'ont aucune cible de `debloquer` cassée (`v2-debloquer-reels.ts`) : le défaut est latent.
- **Gravité** : gênant. Bug, reproduit.
- **Correction** :
  - Ajouter `debloquer` à `refsEffet`.
  - Vérifier que chaque lieu a un chemin de retour vers un lieu sûr.
  - Ajouter des contrôles statiques : bornes des jauges, `niveauGroupe`, DD au-delà de 30.
  - Évaluer la condition du passage sur un état où la quête n'est pas active pour décider s'il est vraiment protégé.

**M23. Le parcours automatique confond 0 h-5 h avec le jour, et joue toujours un groupe de niveau 3 qui ne monte jamais.**
- **Où** : `verification/parcours.ts:129`, `verification/enigmes.ts:41-45`, `parcours.ts:337` et `:433`.
- **Ce qui se passe** :
  - La clé d'un état range 0 h-5 h en « jour », alors que le moteur y voit la nuit (`momentDe`, `monde/etat.ts:13`). Deux états qui n'offrent pas les mêmes choix passent pour identiques, et le second est jeté. La Marche a 2 conditions « nuit ».
  - `groupeDeTest` crée un groupe de niveau 3 sans `choix`, qui ne monte donc jamais, quel que soit le niveau du monde.
- **Reproduire** : `audit-noyau-creation/p4-cle-nuit.ts` : `heure 10 : moment jour ; heure 3 : moment nuit ; même clé d'état : true`.
- **Gravité** : gênant, car le parcours peut dire « fin inaccessible » ou « jamais vu » à tort (plausible). Bug, reproduit pour la clé.
- **Correction** : utiliser `momentDe(e.heure)` dans la clé, et construire le groupe avec `groupeConseille(niveau du monde)`.

---

## 3. Écarts au SRD 5.2.1 non documentés

| # | Écart | Où | SRD | Gravité |
|---|---|---|---|---|
| S1 | **Bouclier sans formation** : en plus de la perte du bonus de CA, le moteur donne le Désavantage aux tests de Force et de Dextérité et **interdit les sorts**. Un magicien qui prend un bouclier ne lance plus rien (`07-equipement.ts` : « aucun sort possible »). Cité en une ligne dans `AUDIT-COMBAT.md`, avec une gravité sous-estimée. | `modules/equipement-regles.ts:233`, `fiche.ts:576`, `combat/cartes.ts:878` | « Si vous utilisez un bouclier sans avoir été formé à son port, vous ne recevez pas son bonus de CA » (`srd-fr-flux.txt` l. 35073) | gênant |
| S2 | Fougue au milieu d'une attaque (M6) | `cartes.ts:729` | action supplémentaire entière | gênant |
| S3 | Préservation de la vie (M11) | `cartes.ts:746` | « en sang » = la moitié ou moins | gênant |
| S4 | **Aide se cumule** sur la même cible : PV max 28 → 33 → 38 (`repro.ts`, C-aide) | `combat/sorts.ts:406` | les effets d'un même sort ne se cumulent pas | cosmétique |
| S5 | **20 naturel au jet contre la mort** : le héros revient à 1 PV mais sans mouvement, et ne peut pas se relever ce tour (`repro.ts`, C-20-naturel : `mouvement 0 Vitesse 9`) | `combat/moteur.ts:177-181`, `:689-694` | il regagne 1 PV et agit normalement | cosmétique |
| S6 | **Repos court : un dé de vie peut rendre 0 PV** (`Math.max(0, …)`) | `personnage.ts:141` | « minimum 1 » (`srd-fr-flux.txt` l. 35789) | cosmétique |
| S7 | **Faim** : des PV perdus dès le premier jour sans ration. Le SRD prévoit l'Épuisement après 5 jours. C'est décrit dans `MONDES.md`, mais absent des choix assumés (§5). | `monde/exploration.ts:576-597` | Malnutrition (l. 35394-35407) | cosmétique (à ranger dans les choix assumés) |
| S8 | Soins hors combat lancés avec un emplacement supérieur, faute de mieux : ils soignent comme au niveau de base | `modules/grimoire.ts:135-145` | gain par niveau d'emplacement | cosmétique |

## 4. Cosmétiques et cas latents (bugs)

| # | Constat | Où | Certitude |
|---|---|---|---|
| L1 | Ce que déclenche une étape accomplie (temps, blessures, événements et jauges qui la lisent) attend l'**action suivante** : `avancerQuetes` passe après `consommerConsequences` et la boucle des événements. Latent, car aucune donnée n'est touchée, mais 27 étapes de la Dîme et de la Tombe s'accomplissent par l'arrivée dans un lieu. | `monde/exploration.ts:263-290` | reproduit (`e4-suites-decalees.ts`) |
| L2 | `utiliserObjet` applique les effets sans `appliquer` ni `suites` : pas de palier de jauge, pas de narration, temps en attente, et une fin posée sans changer de scène. Latent : aucun consommable n'a ces effets. | `modules/inventaire.ts:239-243` | reproduit (`e10-usage-objet-sans-suites.ts`) |
| L3 | La carte qui déplace une zone paie son coût même quand le point est refusé (sur un mur, par exemple) | `combat/cartes.ts:684-686`, `sorts.ts:473` | lu |
| L4 | Identification par Arcanes : un héros à 0 PV peut étudier, et un échec ne coûte rien (essais illimités) | `modules/inventaire.ts:349` | reproduit pour les 0 PV |
| L5 | Choix réservés à une origine : le héros est retrouvé par sa **position** dans `etat.heros`, écrit seulement au départ ; un `ou` de deux origines n'est pas reconnu ; un héros à 0 PV compte en dialogue mais pas dans les événements | `modules/evenements-choix.ts:79`, `monde/etat.ts:220` | lu (mauvais héros : plausible) |
| L6 | Un groupe entier à 0 PV (vieille sauvegarde) peut encore tomber sur un combat fortuit, et la halte ne lui sert à rien | `monde/hasard-arrivee.ts:96`, `personnage.ts:135` | reproduit |
| L7 | Une « autre issue » ratée reste interdite à chaque retour d'une rencontre répétable (`essais` jamais vidé) | `monde/exploration.ts:1116`, `:1133` | lu (latent) |
| L8 | Tirage d'arrivée : la trouvaille s'écrit sans article (« vous dénichez lance oublié depuis des années ») ; le PNJ qui interpelle n'est pas consigné et revient à chaque 3 ; les types `cave` et `crypte` ne sont pas des types de lieu valides | `monde/hasard-arrivee.ts:46-49`, `:166-181`, `:77` | reproduit (la phrase), lu (le reste) |
| L9 | Au-delà de 10 vagues de réactions, la dernière vague est appliquée sans être annoncée (`pièces 70 → 81`, `dernier total annoncé 80 vs état 81`). Latent. | `noyau/moteur.ts:95-104` | reproduit (`n3-vagues.ts`) |
| L10 | Audit des énigmes : faux positif sur un placement à un seul emplacement (la « mauvaise » réponse décalée d'un cran est la bonne) | `verification/enigmes.ts:104-108` | reproduit |
| L11 | `reviserMontee` et `garderMontee` restent disponibles pendant une rencontre | `modules/progression.ts` | lu |

## 5. Fragilités, tests et performance

**Fonctions trop longues**, où tout changement est risqué :

| Fonction | Où | Taille |
|---|---|---|
| `validerMonde` | `monde/validation.ts` | 789 lignes |
| `cartesDisponibles` | `combat/cartes.ts:203-554` | 352 lignes |
| `executerAptitude` | `combat/cartes.ts:710-846` | 136 lignes |
| `tirerArrivee` | `monde/hasard-arrivee.ts:116-195` | 80 lignes |
| `issueRencontre` | `monde/exploration.ts:1086-1156` | 71 lignes |
| `ficheDeScene` | `monde/scene.ts` | ≈ 70 lignes |

**Doublons**, à l'origine de plusieurs bugs ci-dessus :
- La poussée recopie `repousser` (cause de M4).
- La formule des PX de combat existe en trois copies (cause de M8).
- La réaction Bouclier est écrite deux fois (`moteur.ts:495-505` et `sorts.ts:261-271`).
- Le ciblage d'un sort est calculé deux fois (`cartes.ts:295` et `:859`).
- La boutique est construite trois fois (`propositionsCommerce`, `vitrineDe`, la vue `boutique`), et aucune des trois ne vérifie la présence du PNJ, ce qui aggrave M1.
- Dans le monde : le filtre de rencontre écrite (`hasard-arrivee.ts:128-133` et `:152-157`), le relevé faits, narrations et jauges (`exploration.ts:208-212` et `:285-289`), et `choisir` recopié dans `modules/exploration.ts:363`.

**Couplages** :
- `clonerCombattant` partage des objets que d'autres fonctions modifient en place (cause de M5).
- Le monde chargé (`dm`) n'est pas en lecture seule (cause de M16).
- Le type d'un service est deviné depuis son identifiant (cause de M19).

**Code mort** : `situationAttaque` est calculée sans servir à `moteur.ts:900`.

**Fonctions sans test** : aucune mention dans `tests/` pour `gardienEnPlace`, `terminerQuete`, `estCumulatif`, `lectureActuelle`, `examensIci`, `dejaLu`, `aOutils`, `lieuDuPnj` et `consignerParole`. Elles sont peut-être couvertes indirectement.

**Scénarios sans test** : service de nuit pendant une conversation, saut de deux niveaux, bouclier sur un lanceur de sorts, poussée au bord de la grille, IA avec des objets embarqués, Fougue après une attaque, PX avec des monstres endormis, effets orphelins, combat sans approche possible, sauvegarde qui cite une entité supprimée.

**Performance**, seulement ce qui est mesuré :
- **Parcours avec une fin inaccessible** : la Marche prend 120 s pour 2 370 états, avec un tas de **≈ 2,5 Go** (rss 2,9 Go) ; le Médaillon prend 120 s pour 2 706 états et ≈ 1,7 Go (`p5-fin-impossible.ts`). C'est le cas où l'on a justement besoin du parcours. En cause, chaque état en attente garde une partie complète, et l'élagage ne commence qu'au-delà de 2 × 80 000 états (`parcours.ts:276-282`). Pour corriger, élaguer plus tôt, ou ne garder que le parent et l'action, puis rejouer.
- **Coût d'une action qui grandit avec la session** : de 1,0 ms sur les 100 premières actions à 12,2 ms sur les 100 dernières, après 2 500 actions dans le Médaillon. Le journal n'est jamais borné en mémoire (995 Ko après 3 000 actions), et chaque vague le recopie (`moteur.ts:86, 100`). La sauvegarde reste bornée, de 210 à 233 Ko : c'est le double des 110-120 Ko annoncés le 11/11, mais encore loin de la limite du navigateur. Pour corriger, ne pas recopier le journal dans `reference` ni dans le brouillon.
- **Combat** :
  - L'IA normale prend en moyenne 119 ms par tour (médiane 107, maximum 241) avec 19 combattants ; l'IA rapide, 3,5 à 14 ms.
  - Un `EtatCombat` sérialisé pèse **93 Ko dès le round 4**, dont 54 Ko de journal, et il est réécrit à chaque action. Pour corriger, ne sauver que les N derniers événements du journal.
- **Escarmouches au-delà du niveau 5** : avec 6 héros de niveau 20, les héros ne perdent que 3 à 7 % de leurs PV, contre 33 à 65 % au niveau 5. Une rencontre « élevée » de niveau 20 est triviale. C'est sans effet tant que la saison 1 s'arrête au niveau 5.

## 6. Points déjà connus, revérifiés

| Point | État au 18/11 |
|---|---|
| S3 filet de sécurité, S5 sauvegarde abîmée | **en partie corrigés** au moment de l'audit : voir M3 (corrigé le 18/11/2026) |
| S6 journal affiché non borné | toujours vrai, et il coûte aussi au moteur (§5) |
| X1 à X5, X7 | corrigés (X7 : reste la vieille sauvegarde à 0 PV, L6) |
| X6 repos long qui saute un jour | **en partie corrigé** : voir M12 |
| X8 fuite sans repli, X9 événement non unique ×10 | toujours vrais |
| O1, O2, O3 | corrigés |
| O4 service payé sans effet | corrigé pour les services reconnus, mais toujours vrai pour les autres : voir M19 |
| O5 objets magiques génériques | toujours vrai pour « Arme +1 » ; « Armure +1 » s'équipe désormais, mais mal (M21) |
| O6 objet équipé invisible aux conditions `{objet}` | toujours vrai (`etat.ts:197`) |
| Dialogues M1, M2, M4, M5 | corrigés |
| Dialogues M3 délai par secret | corrigé, mais contourné en changeant de manière (M18) |
| Combat : les 8 bugs du 11/11 | aucune régression |
| F3 : `quete: active` ignore `prerequis` ; étape supprimée qui bloque une quête ; `recompensesDeQuete` additionne des branches exclusives ; `completion` insatisfiable non détectée | les quatre toujours vrais |
| Migrations 1 → 4 | correctes : des sauvegardes v1, v2 et v3 fabriquées se rechargent et se jouent |
| Achat puis revente | aucun gain d'or possible dans les 4 mondes (`01-arbitrage.ts`) |

## 7. Les dix corrections les plus utiles, dans l'ordre

| Rang | Correction | Constats | Effort | Touche le combat gelé ? |
|---|---|---|---|---|
| 1 | ✅ **fait le 18/11/2026** : toujours proposer « Fin du dialogue », et repasser en exploration quand l'interlocuteur est parti après un service ou une influence | M1 | petit | non |
| 2 | ✅ **fait le 18/11/2026** : `gardienEnPlace` ignore les rencontres fortuites `auto-*` | M2 | petit | non |
| 3 | ✅ **fait le 18/11/2026** : `charger` répare une scène ou un lieu inconnus et complète `scene`, `modules` et `journal` ; `disponible` passe dans le `try` ; test d'une sauvegarde qui cite une entité supprimée | M3 | petit à moyen | non |
| 4 | ✅ **fait le 18/11/2026** : la poussée passe par `repousser` (bords de la grille vérifiés) | M4 | petit | **oui** (accord de l'utilisateur ; simulation de référence identique) |
| 5 | ✅ **fait le 18/11/2026** : copie profonde de `mods`, `sauvegardes`, `competences` et `attaques` dans `clonerCombattant` | M5 | petit | **oui** (idem) |
| 6 | Toute nuit complète fait avancer l'horloge et rouvre la fouille ; réveil à heure + 8 entre 6 h et 8 h | M12 | petit | non |
| 7 | Tombe : passage des racines à sens unique (ou DD relevé), texte de `retour` à la découverte, avis du validateur pour un passage caché entre niveaux | M13 | petit | non |
| 8 | Deux corrections d'une ligne : une quête échouée ne se termine plus (M17), délai d'un secret sans la manière (M18) | M17, M18 | très petit | non |
| 9 | Champ `type` des services, facultatif, l'ancienne détection gardée en repli ; les 3 services de la Tombe réparés | M19 | petit | non |
| 10 | Garde-fous des futurs épisodes : `debloquer` dans `refsEffet`, contrôle des lieux sans retour, « quête sautable » qui évalue la condition, clé de nuit du parcours, élagage plus tôt du parcours | M22, M23, §5 | moyen | non |

**Ensuite** :
- Avec un accord sur le combat : un bilan de combat unique branché dans App, qui compte aussi les monstres inconscients (M8) ; les effets purgés à la mort ou à la fuite (M9) ; le départage de l'IA par la distance (M7, qui fausse aussi les simulations) ; Fougue (M6).
- Hors combat : indices d'énigme mémorisés (M15), découverte sans réouverture de la fouille (M14), rencontres `auto-*` lues dans la partie (M16), montée de plusieurs niveaux (M20), et S1 (bouclier sans formation).

Pour les rangs 4 et 5 et tout le bloc combat, P3 impose d'enregistrer `pnpm simuler 10 rapide` avant la correction et d'expliquer tout écart après. La correction de M5 ne change la simulation que si un héros porte une potion de Force. M4 et M7 peuvent la changer.

## Annexe : scripts de reproduction

Ils sont hors du dépôt, dans le dossier temporaire de la session : `C:\Users\sebas\AppData\Local\Temp\claude\584d935d5a46fbdf\d204682f-75b2-42c5-8c49-41e6a44dc808\scratchpad\`, sous-dossiers `audit-exploration\`, `audit-dialogue-objets\`, `audit-combat\` et `audit-noyau-creation\`. On les lance depuis la racine du dépôt avec `node_modules/.bin/tsx <script>`, mais `p1-parcours.ts` et `p5-fin-impossible.ts` demandent `node --max-old-space-size=8000 node_modules/tsx/dist/cli.mjs`. Ce dossier peut être vidé au redémarrage : copier ce qui servira de base aux tests de non-régression avant de corriger.

## 8. Simulation de référence (P3) pour M4 et M5, le 18/11/2026

`pnpm simuler 10 rapide` (six héros pré-tirés, IA rapide des deux côtés, graines 1000 à 1009) a été enregistré avant toute modification puis relancé après. En complément, une empreinte de chaque combat a été relevée avant et après : 60 combats (6 rencontres × 10 graines), avec vainqueur, rounds, PV de chaque héros, nombre d'événements et empreinte SHA-1 du journal complet.

| Rencontre | Avant | Après |
|---|---|---|
| Embuscade gobeline | victoires 100 %, rounds 4.1, PV restants 83 %, à terre 0.1, morts 0.0 | identique |
| La crypte | 100 %, 6.7, 51 %, 0.6, 0.2 | identique |
| La bande et ses ogres | 100 %, 5.2, 82 %, 0.3, 0.0 | identique |
| Le camp hobgobelin | 90 %, 7.3, 50 %, 1.7, 0.4 | identique |
| Le gué des brigands | 100 %, 4.2, 90 %, 0.1, 0.0 | identique |
| Le col gelé | 60 %, 10.2, 20 %, 4.0, 1.8 | identique |

**Bilan** : toutes les lignes sont identiques hors de la colonne de durée, et les 60 empreintes de journal sont identiques. Aucun écart à expliquer, ce que l'analyse prévoyait :
- Aucun combat de référence ne contient de poussée (0 ligne « est repoussé » dans les 60 journaux) : M4 n'y joue pas.
- Aucun héros pré-tiré ne porte de potion de force de géant, seul objet qui modifiait un combattant en place : M5 ne change aucun choix.

**Seul écart : le temps.** La durée par partie passe de 0,5-1,2 s à 0,6-1,2 s selon la rencontre. Mesurée en alternance sur le script d'empreinte, la simulation complète passe de ≈ 50,0 s à ≈ 54,3 s, soit **+8,5 %**. Tout vient de M5 : avec la seule correction de M4, la durée est de 50,5 s. Une première écriture de la copie coûtait +14 % ; la version gardée copie le tableau des dégâts sans copier chaque dégât, et évite les décompositions conditionnelles. Par extrapolation, un tour d'IA normale passerait d'environ 119 ms à environ 129 ms (non mesuré). Si ce coût gêne, une copie sur écriture dans `combat/objets.ts` ne coûterait rien, mais elle protège moins contre une future mutation en place.
