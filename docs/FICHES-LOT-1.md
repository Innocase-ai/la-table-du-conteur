# Fiches du lot 1 — corrections de fond du moteur et de l'outillage de création (18/11/2026)

**Statut au 18/11/2026 : les quatre groupes sont implémentés, non commités (J1 à J6, C1 à C5). Restent ouverts : l'amélioration du parcours pour prouver les fins de la Tombe (J6, D4), la décision D7 (secret d'Elara) et la relecture du site (C4).** Les fiches reprennent le format de `docs/PRD-SAGA.md` (objectif, aujourd'hui, changements, critères d'acceptation, effort, risque). Elles sont à valider une par une avant tout code (P7).

**Origine** : `docs/AUDIT-MOTEUR.md` (M12, M13, M17, M18, M19, M22, M23, rangs 6 à 10 du §7), `docs/AUDIT-CREATION-HISTOIRE.md` (rangs 7 à 10 du §5) et la relecture des textes de PNJ de la Tombe du 18/11/2026.

**Ce que ce lot ne contient pas** (lot 2 et suivants) : la fouille en deux étages (F1) et le butin par difficulté (F4), qui sont des fonctions nouvelles ; tout ce qui touche à `packages/regles/src/combat/` (aptitudes de l'Ensorceleur et du Druide, Se cacher, Préparer, états manquants) ; le carnet de campagne (F5). Le lot 1 ne corrige que des défauts constatés et des garde-fous.

---

## 1. Règles qui valent pour toutes les fiches

- **P1, P2 : additif.** Un champ nouveau est facultatif et reproduit l'ancien comportement ; un contrôle nouveau est un avis, sauf mention contraire. Les trois histoires publiées et les jeux d'essai passent `pnpm monde valider` sans modification (sauf quand la fiche dit explicitement qu'on corrige leurs données, avec votre accord).
- **P3 : le combat n'est pas touché.** Aucun fichier de `packages/regles/src/combat/`. La simulation de référence n'a donc pas à changer ; on la relance une fois à la fin pour le prouver.
- **P4 : sauvegardes.** Aucune fiche ne change la forme de la partie ; `VERSION_PARTIE` reste à 4.
- **P5 : barrières de livraison.** `pnpm typecheck`, `pnpm test`, `pnpm monde valider` et `pnpm monde verifier` sur les trois histoires, journal mis à jour. Chaque correction commence par un test qui **échoue avant** et passe après.
- **P7 : petits pas.** Accord avant chaque commit, jamais de push sans accord, aucune dépense (le lot n'en a aucune).

## 2. Mesures de référence à enregistrer avant le premier code

| Mesure | Valeur au 18/11/2026 | Commande |
|---|---|---|
| Tests | 2 660 verts, 3 sautés | `pnpm test` |
| Avis du validateur | Marche 31, Dîme 5, Tombe 3 | `pnpm monde valider <monde>` |
| Fins prouvées | Marche 2/2, Dîme 4/4, Tombe 5/5 | `pnpm monde verifier <monde>` |
| Mémoire et durée du parcours | Marche 611 Mo (18 s), Dîme 121 Mo (6 s), Tombe 489 Mo (14 s) | audit du moteur, §0 |
| Durée estimée affichée | Tombe ≈ 12 h, Dîme ≈ 8 h | `pnpm monde estimer <monde>` |
| Simulation de combat | sortie de `pnpm simuler 10 rapide` | à enregistrer dans un fichier avant de commencer |

Toute variation d'un de ces chiffres après une fiche doit être **expliquée dans le journal** ; une variation non expliquée bloque la livraison.

---

# Partie A — Moteur du jeu (`packages/regles`)

## J1 — Une nuit complète compte toujours pour l'horloge (M12)

**Fait le 18/11/2026** (journal « suite 8 »). Écart avec la fiche : le seuil est « avant 8 h » (6 h et 7 h comprises) ; couché à 6 h, le réveil est à 14 h.

- **Objectif :** que dormir à 1 h, à 6 h ou à 22 h ait le même effet sur l'horloge du monde et sur la fouille.
- **Aujourd'hui :** `seReposer` (`monde/exploration.ts`) ne passe par `nouveauJour` que si le groupe se couche avant minuit. Couché entre 0 h et 5 h : la jauge « repos-long » de la Dîme et de la Tombe n'avance pas, et la fouille du jour reste consommée alors que le message dit « revenir après un repos ». Couché à 6 h ou 7 h : le groupe dort 25 ou 26 h. Seize haltes d'une heure suffisent pour atteindre minuit.
- **Changements :** (a) appliquer les évolutions « repos-long » et les événements de repos à toute nuit complète ; (b) compter la fouille par repos plutôt que par jour civil ; (c) calculer le réveil à heure + 8 pour un coucher entre 6 h et 8 h.
- **Critères d'acceptation :**
  - Test d'après `audit-exploration/e5-nuit-apres-minuit.ts` : couché à 1 h, la jauge avance de 1 et la fouille se rouvre ; couché à 6 h, 8 h de sommeil et non 26 h.
  - Un joueur qui dort le soir (18 h à 23 h) obtient **exactement** les mêmes états qu'avant (test de non-régression).
  - Les fins des trois histoires sont toujours prouvées ; le nombre de nuits avant la fin d'horloge de la Tombe est inchangé pour un joueur qui dort le soir.
- **Effort :** petit. **Risque :** moyen. Dormir après minuit compte désormais : l'horloge de la Tombe peut s'accélérer pour qui veille tard. C'est la règle voulue, mais elle change le rythme ressenti : à valider (décision D5).

## J2 — Deux corrections d'une ligne : quête échouée, secret retenté (M17, M18)

**Fait le 18/11/2026** (journal « suite 6 », `tests/lot1-moteur.test.ts`). Écart avec la fiche : la clé du délai est `pnj:secret:<fait>` (et non `pnj:secret`), pour que rater un secret n'en ferme pas un autre du même PNJ.

- **Objectif :** qu'une quête échouée ne verse plus de récompenses, et qu'un secret à jet propre ne se retente pas trois fois en changeant de manière.
- **Aujourd'hui :** `terminerQuete` (`monde/etat.ts`) teste seulement `terminee`, alors que `echouerQuete` teste les deux statuts : une quête échouée peut être terminée et verse alors ses PX et son or (reproduit : `q-contrat-eau-du-fort`, PX 0 → 40, or 120 → 150). Dans `monde/dialogue.ts`, le délai d'un secret est rangé sous `pnj:manière:secret` alors que le jet est celui du secret : persuasion, intimidation puis tromperie donnent trois jets identiques (reproduit sur Anselme Roux, `f-pacte-du-meunier` : raté, raté, réussi). L'orateur est le meilleur du groupe dans la manière, pas dans la compétence testée.
- **Changements :** (a) `terminerQuete` ignore aussi `echouee` ; (b) un secret qui a son propre jet utilise la clé `pnj:secret` et choisit l'orateur selon la compétence testée.
- **Critères d'acceptation :** les scripts `06-quete-echouee-puis-terminee.ts` et `04-secret-trois-manieres.ts` deviennent deux tests (échec avant, succès après) ; le fait `f-pacte-du-meunier` reste atteignable par une autre voie (parcours de la Dîme : 4 fins sur 4) ; tests existants inchangés.
- **Effort :** très petit. **Risque :** faible. M18 réduit le nombre de tentatives possibles : vérifier que la Dîme ne comptait pas dessus.

## J3 — Des services typés (M19)

**Fait le 18/11/2026**, données de la Tombe comprises (décision D3). Écart avec la fiche : l'avis ne compte pas une `narration` comme un effet (les trois services de la Tombe en ont une) ; il signale donc aussi 7 services d'ambiance ou à promesse non tenue (voir le journal, « suite 6 »).

- **Objectif :** qu'un service payé fasse toujours ce que son nom promet.
- **Aujourd'hui :** `modules/commerce.ts` devine le type d'un service par des expressions régulières sur son identifiant (`SOINS`, `NUIT`, `IDENTIFICATION`). Dans la Tombe, `identifier-elara` (15 po), `gite-fort` (« Chambres propres ») et `benediction-chapelain` (« soins légers ») sont payés sans rien faire. À l'inverse, « abri » reconnaît « fabrication » et « soin » reconnaît « besoin ».
- **Changements :** (a) champ **facultatif** `type: soins | nuit | identification` sur les services d'un PNJ (`monde/schemas.ts`), l'ancienne détection restant en repli (P1) ; (b) avis du validateur pour un service sans type, sans effet et non reconnu par l'ancienne détection ; (c) **données de la Tombe** : poser `type` sur ses 3 services (modifie une histoire publiée : décision D3) ; (d) `docs/MONDES.md` et le skill `creer-marchands-compagnons` documentent le champ.
- **Critères d'acceptation :** test d'après `09-services-tombe.ts` : `identifier-elara` identifie `anneau-griffe-croc`, `gite-fort` fait dormir (heure, PV), `benediction-chapelain` soigne ; un service non typé reconnu par l'ancienne détection se comporte comme avant (tests existants) ; l'avis disparaît de la Tombe après correction des données.
- **Effort :** petit. **Risque :** faible côté code ; moyen côté données (histoire publiée, un champ ajouté seulement).

## J4 — Garde-fous du validateur pour les futurs épisodes (M22)

**Fait le 18/11/2026** (groupe 4, journal « suite 9 »).

- **Objectif :** que le validateur refuse ou signale les mondes cassés que les auteurs d'épisodes risquent d'écrire.
- **Aujourd'hui :** `refsEffet` (`monde/references.ts`) ne visite pas `debloquer` : une cible inexistante passe. Un lieu sans retour (lien à sens unique vers un cul-de-sac) n'est pas signalé. Les conditions impossibles passent (jauge au-delà de son maximum, `et` contradictoire, `niveauGroupe` au-delà du maximum du monde, verrou DD 40 sans clé). « Quête sautable » (`monde/quete-sautable.ts`) ne fait que chercher le nom de la quête dans la condition. Les quatre vrais mondes n'ont aucune cible de `debloquer` cassée : le défaut est latent.
- **Changements :** (a) `debloquer` entre dans `refsEffet` (**erreur** : une cible inexistante est toujours un défaut) ; (b) avis « lieu sans chemin de retour vers un lieu sûr » ; (c) avis pour les conditions statiquement impossibles ; (d) « quête sautable » évalue la condition du passage sur un état où la quête n'est pas active.
- **Critères d'acceptation :** les cas A à M de `v1-validateur.ts` produisent chacun +1 erreur ou +1 avis sur un monde d'essai ; sur les trois histoires publiées, **la liste exacte des nouveaux avis est écrite dans le journal** et chacun est justifié (vrai défaut ou faux positif à régler) ; aucune erreur nouvelle sur les mondes réels.
- **Effort :** moyen. **Risque :** faux positifs sur les avis (b) à (d) : avis rejetables dans `revue.json`, jamais bloquants.

## J5 — Un parcours automatique fidèle au moteur (M23)

**Fait le 18/11/2026**, mémoire et durée mesurées avant et après (journal « suite 8 ») : seuil « pas plus du double » tenu de justesse sur la Marche.

- **Objectif :** que la preuve des fins ne se trompe plus ni sur la nuit ni sur le niveau du groupe.
- **Aujourd'hui :** la clé d'un état de `verification/parcours.ts` range 0 h à 5 h en « jour », alors que `momentDe` (`monde/etat.ts`) y voit la nuit : deux états qui n'offrent pas les mêmes choix passent pour identiques et le second est jeté (la Marche a 2 conditions « nuit »). `groupeDeTest` (`verification/enigmes.ts`) crée toujours un groupe de niveau 3 sans choix : il ne monte jamais, quel que soit le niveau du monde.
- **Changements :** (a) la clé d'état utilise `momentDe(e.heure)` ; (b) le groupe de test est construit avec `groupeConseille(niveau du monde)` et peut monter.
- **Critères d'acceptation :** test d'après `p4-cle-nuit.ts` (heure 10 et heure 3 n'ont plus la même clé) ; les fins sont toujours prouvées (Marche 2/2, Dîme 4/4, Tombe 5/5) ; **mémoire et durée mesurées avant et après** : une clé plus fine explore plus d'états, la Marche étant déjà à 611 Mo, le seuil d'acceptation est « pas plus du double » (sinon réglage du budget `--etats`).
- **Effort :** petit. **Risque :** moyen, côté mémoire seulement.

## J6 — Tombe : le niveau 3 ne doit plus s'atteindre dès le 5e pas (M13) — *à ne faire que sur décision*

**Fait le 18/11/2026, D4 appliquée** (sens unique, texte `retour` corrigé dans le moteur, avis du validateur). **Critère non tenu : les 5 fins ne sont plus prouvées** par le parcours automatique de la Tombe (4 fins sur 5 non trouvées en 540 s ; le niveau 3 est atteint en 101 pas par les niveaux 1 et 2). L'utilisateur a accepté que `verifier` de la Tombe échoue jusqu'à une amélioration du parcours (journal « suite 8 »).

- **Objectif :** que les niveaux 1 et 2 ne se sautent pas.
- **Aujourd'hui :** le passage secret `n3-escalier-surface` ↔ `bivouac-entree` est à double sens avec un DD de Perception de 15, et la Perception passive du groupe conseillé vaut 16 : il est trouvé à l'arrivée au bivouac, sans jet. Le parcours atteint `fin-partage-honnete` en 72 pas. Au passage, le texte de découverte reprend `lien.description` (des marches « qui montent vers l'air libre ») au lieu de `retour`, quand on le découvre depuis l'autre côté.
- **Changements :** (a) données : rendre le passage à sens unique (n3 → bivouac), **ou** monter son DD au-dessus de la Perception passive (décision D4) ; (b) moteur : utiliser le texte `retour` quand on découvre un passage depuis son autre extrémité ; (c) validateur : avis quand un passage caché relie deux niveaux différents avec un DD inférieur ou égal à la Perception passive du groupe conseillé.
- **Critères d'acceptation :** le chemin le plus court vers une fin passe par les niveaux 1 et 2 (nombre minimal de pas relevé avant et après) ; les 5 fins sont toujours prouvées ; le texte de découverte est celui de `retour` (test).
- **Effort :** petit. **Risque :** moyen : c'est une décision de conception sur une histoire publiée.

---

# Partie B — Outillage de création d'histoire (`outils/`, `packages/regles/src/monde`)

## C1 — Les défauts de jeu font échouer `verifier` (G9, rang 7)

**Fait le 18/11/2026** (groupe 4) : rubrique « Défauts de jeu » ; défauts de la Marche (D1) acceptés dans `revue.json` avec leur raison, pas corrigés (suite de l'histoire non écrite) ; la Dîme (quête sautable) et les faits hors canon des trois histoires acceptés de même.

- **Objectif :** qu'une histoire qui a de vrais défauts de jeu ne puisse plus finir sur « Rien ne bloque ».
- **Aujourd'hui :** seules les erreurs mettent `verifier` en échec (`outils/monde/verifier.ts`). La Marche est publiée avec 31 avis, dont deux vrais défauts de jeu (`flacon-de-toxine-x44` exigé par une quête mais introuvable, drapeau `z2-davor-neutralise` lu mais jamais posé), noyés parmi 13 avis « Richesse ».
- **Changements :** trier les avis en deux familles. **Défauts de jeu** (objet exigé introuvable, drapeau jamais posé, quête sautable, lieu sans retour, et les contrôles de J4) : rubrique `Défauts de jeu` de `verifier`, en échec pour un monde publié. **Conseils d'écriture** (richesse, longueurs) : ils restent des avis.
- **Prérequis :** avant d'activer l'échec, traiter les deux défauts de la Marche, soit en corrigeant ses données, soit en les déclarant « acceptés » avec leur raison dans `revue.json` (décision D1). Sans cela, `verifier` de la Marche échouerait.
- **Critères d'acceptation :** sur un monde d'essai avec un objet introuvable, `verifier` échoue ; sur la Marche, la Dîme et la Tombe, `verifier` dit « Rien ne bloque » après le traitement des deux défauts ; les conseils d'écriture ne bloquent jamais.
- **Effort :** petit. **Risque :** moyen : on peut faire échouer une histoire publiée si les données ne sont pas traitées d'abord.

## C2 — Le `lieu` d'une quête : une règle, un avis, des données justes (G7, rang 8)

**Fait le 18/11/2026** : documentation, avis (règle stricte : le lieu du donneur ou l'une de ses présences) et données des **18** quêtes (les 14 de D2 et les 4 de la Dîme, décision de l'utilisateur).

- **Objectif :** que le parchemin d'une quête annonce d'où elle vient, pas où elle mène.
- **Aujourd'hui :** `Quete.lieu` n'est documenté nulle part, mais le jeu l'affiche (« Confiée par X, métier — lieu de la quête »). Dans la Marche, 4 quêtes ont pour `lieu` celui de l'objectif (exemple : `q-la-prime-sur-demi-dent`) ; dans la Tombe, 10 quêtes sur 15 ont un `lieu` qui n'est pas celui du donneur (exemple : `q-tombe-des-rois-serpents`, donneur au bivouac, `lieu` au fort ; et depuis le découpage du Fort, `q-contrat-eau-du-fort` annonce la cour alors que le donneur est à l'auberge).
- **Changements :** (a) documenter `Quete.lieu` comme « le lieu où la quête est confiée » (`docs/MONDES.md`, skill `creer-intrigue`) ; (b) avis quand il diffère du lieu, ou d'une présence, du donneur ; (c) **données** : corriger les 14 quêtes concernées (décision D2).
- **Critères d'acceptation :** l'avis apparaît sur un monde d'essai et sur la Marche et la Tombe avant correction ; il disparaît après ; le parchemin de chaque quête corrigée nomme le lieu du donneur (test) ; les fins restent prouvées.
- **Effort :** petit pour le code, moyen pour les données (14 quêtes, chacune relue). **Risque :** faible ; texte visible par le joueur, donc relu avec vous.

## C3 — Un CLI qui ne ment pas (O1 à O5, rang 9)

**Fait le 18/11/2026** (journal « suite 7 »), O6 à O9 comprises.

- **Objectif :** que `pnpm monde` ne dise jamais « tout va bien » quand on a mal tapé ou quand un fichier est cassé.
- **Aujourd'hui :** une commande inconnue (`verifie`, `manquee`) lance la validation en code 0 ; `verifier` plante sur un `estimation.json`, `manifeste.json` ou `revue.json` mal formé ; `--sans-parcours` finit sur « ✅ Rien ne bloque » sans avoir joué aucune fin ; la revue de secrets passe en ✅ avec un canon vide ; le squelette de `nouveau` ne valide pas et fait sortir `pnpm monde valider` en code 1 tant qu'il existe.
- **Changements :** (a) commande inconnue refusée, avec la liste des commandes, code 1 ; (b) fichiers JSON mal formés rapportés comme une rubrique en échec qui nomme le fichier ; (c) « Rien ne bloque (parcours non joué) » ; (d) avis quand `canon.secrets` est vide ; (e) squelette de `nouveau` valide ; et, du même mouvement, les cosmétiques O6 à O9 (`doc` en code 1 si le monde a des erreurs, conseil `--ms` quand le parcours s'arrête faute de temps, options numériques mal formées refusées, « 0/0 fins » en avis).
- **Critères d'acceptation :** un test par comportement ; `pnpm monde frobnicate` sort en code 1 ; `pnpm monde nouveau x` puis `pnpm monde valider x` : 0 erreur.
- **Effort :** petit. **Risque :** faible.

## C4 — La Forge, l'estimation et le PRD à l'échelle d'un épisode (G8, S8, S6, C1 ; rang 10)

**Fait le 18/11/2026** (journal « suite 7 »), sauf le site : `outils/site/contenu.json` reste à relire avec l'utilisateur (durées et coûts changés).

- **Objectif :** que les outils produisent et mesurent un épisode court sans fausser les chiffres.
- **Aujourd'hui :** l'importateur de la Forge écrit des journaux de quête qui nomment le lieu (« Rendez-vous à X. ») et qui n'entrent pas dans le brief d'écriture. L'estimation arrondit le total à l'heure alors que ses parties le sont à la demi-heure (le Médaillon affiche récit 1, combats 0,5, total 1) ; sous 0,5 h le total vaut 0 et `calibrer` diviserait par zéro ; les fiches `savoirs/`, `codex/` et `interjections/` ne comptent ni dans les tours ni dans le coût. Le PRD (F3) demande un `lieu` d'étape, contre la règle du 16/11. Trois cibles différentes pour la longueur des arrivées.
- **Changements :** (a) importateur : textes d'étape en `À écrire : ce que le joueur cherche (sans nommer le lieu)`, qui entrent dans le brief ; (b) estimation : total arrondi à la demi-heure (au quart d'heure sous 2 h), garde contre la division par zéro dans `calibrer.ts`, tours de conteur pour chaque PNJ qui a une fiche de savoir ; (c) amender F3 du PRD (« lieu d'étape seulement si l'auteur le demande ») ; (d) aligner les trois cibles de longueur d'arrivée sur la décision D6.
- **Critères d'acceptation :** sur le Médaillon, le total est la somme de ses parties ; `calibrer` ne rend plus `Infinity` ; les trois `estimation.json` sont régénérés et **les chiffres du site** (`outils/site/contenu.json`, durées et coûts) sont relus et mis à jour avec vous.
- **Effort :** petit. **Risque :** faible, mais les durées et coûts affichés au joueur changent : à relire.

## C5 — Des contrôles pour les défauts de texte de PNJ trouvés le 18/11 (nouveau)

**Fait le 18/11/2026** (groupe 4). Écart avec la fiche : (e) regarde les `secrets` du PNJ et sa fiche de savoir (pas sa simple liste `savoir`) ; sur la Tombe il remonte deux PNJ pour le même fait (Elara et frère Balthazar), et sur la Marche et la Dîme 3 et 7 PNJ : acceptés dans `revue.json` avec raison.

- **Objectif :** que les défauts de la relecture de la Tombe soient détectés avant publication, pas à la main.
- **Aujourd'hui :** aucun contrôle ne voit ces cinq défauts réels : un renvoi « demandez à X » vers un personnage qui n'a pas de sujet là-dessus ; une interjection de compagnon qui en nomme un autre sans condition de présence ; une variante hostile sur un sujet fermé aux hostiles (texte mort) ; un drapeau lu qui diffère d'un seul caractère d'un drapeau posé (`mireille-recrute` / `mireille-recruite`) ; un PNJ qui détient un fait que `canon.json` ne lui autorise pas (le secret d'Elara). Le test `tombe-textes-pnj.test.ts` les garde sur la Tombe seule.
- **Changements :** cinq avis du validateur, passés dans la famille « défauts de jeu » de C1 pour les trois derniers, « conseils » pour le premier (heuristique de langage) : (a) renvoi vers un PNJ inexistant ou sans aucun sujet ; (b) compagnon nommé sans condition de présence ; (c) variante `attitudeMax` sur un sujet dont la condition exige une attitude positive ; (d) drapeau lu jamais posé, avec la suggestion du drapeau voisin le plus proche ; (e) fait détenu par un PNJ (`secrets` ou `savoirs`) absent de `autorise` dans le canon.
- **Critères d'acceptation :** chaque contrôle a un test qui injecte le défaut dans un monde d'essai (+1 avis) ; sur la Tombe actuelle, **seul (e) remonte** (le secret d'Elara, tant que D7 n'est pas tranchée) ; aucun nouvel avis sur la Dîme ni la Marche sans justification écrite au journal ; les faux positifs sont rejetables dans `revue.json`.
- **Effort :** moyen. **Risque :** faux positifs de l'heuristique (a) : avis seulement.

---

# Ordre de livraison proposé

Quatre commits, chacun avec ses tests, ses vérifications (P5) et son entrée de journal, et chacun soumis à votre accord.

1. **Petits correctifs du moteur : J2 + J3.** Indépendants et sans risque.
2. **Outillage de création : C3 + C4 + la partie code de C2.** Aucun effet sur le jeu.
3. **Horloge et parcours : J1 + J5** (avec les mesures de mémoire), et **J6** si vous le décidez.
4. **Garde-fous : J4 + C5, puis C1** (après le traitement des données de la Marche). C'est le plus gros commit : il ajoute le plus d'avis, donc la liste des nouveaux avis y est écrite au journal.

Les corrections de **données** (quêtes de C2, services de J3, passage de J6, défauts de la Marche de C1) sont des commits séparés, car elles changent des histoires publiées.

---

# Décisions à prendre avant de commencer

| # | Décision | Ma recommandation |
|---|---|---|
| D1 | Les deux défauts de la Marche (flacon introuvable, drapeau jamais posé) : les corriger ou les déclarer acceptés dans `revue.json` ? | Les corriger si c'est simple ; sinon les accepter avec leur raison écrite. |
| D2 | Corriger maintenant le `lieu` des 14 quêtes (Marche 4, Tombe 10) ? | Oui, avec relecture de chaque parchemin ; sinon l'avis reste ouvert. |
| D3 | Ajouter `type` aux 3 services de la Tombe ? | Oui : c'est un champ ajouté seulement, et trois services sont aujourd'hui payés pour rien. |
| D4 | Tombe : passage à sens unique ou DD relevé (J6) ? | Sens unique : plus net, et le texte de `retour` devient inutile. |
| D5 | Dormir après minuit compte pour l'horloge (J1) ? | Oui : c'est la règle voulue, mais elle accélère l'horloge pour qui veille tard. |
| D6 | Longueur des arrivées : 130 à 170 mots (règle actuelle) ou 80 à 110 (plan de jouabilité) ? | À vous : je n'ai pas votre réponse. À défaut, l'ancienne règle reste. |
| D7 | Secret d'Elara : l'autoriser dans le canon ou le retirer ? | L'autoriser dans le canon seulement si vous voulez ce chemin d'indice au Fort ; sinon le retirer. |
