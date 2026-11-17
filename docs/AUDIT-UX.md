# Audit UX et Propositions d'Amélioration — La Table du Conteur (`crpg-llm`)

> Analyse réalisée le 15/11/2026 à partir du code du client (`apps/jeu/src/`) et des modules du moteur (`packages/regles/src/modules/`).

---

## 1. Socle UX actuel (Points forts)

Les chantiers récents donnent déjà au jeu une identité claire et une bonne ergonomie sur plusieurs piliers :

- **Feuille-Inventaire unifiée** (`apps/jeu/src/aventure/FeuillePersonnage.tsx`, `PoupeeEquipement.tsx`) : poupée à 13 emplacements, deux jeux d'armes, double interaction clic / glisser-déposer et calcul de CA en direct.
- **Panneau de combat & Main de cartes** (`apps/jeu/src/composants/PanneauTour.tsx`, `MainCartes.tsx`) : sections repliables mémorisées, illustrations des armes du SRD, raccourcis clavier (`1`–`9`, `F`), et probabilité de toucher affichée directement sur les jetons ciblables (`Plateau.tsx`).
- **Mises en scène plein écran** : rencontres avec dévoilement des monstres et annonce du meilleur héros sur les jets alternatifs (`EcranRencontre.tsx`), tirage d'arrivée D6 sur l'illustration (`TirageArrivee.tsx`), écrans de crochetage (`EcranCrochetage.tsx`), désamorçage (`EcranDesamorcage.tsx`), sommeil (`EcranSommeil.tsx`) et parchemins de quête (`EcranQuete.tsx`).

---

## 2. Diagnostic des points de friction par écran

### A. Exploration, Récit & Orientation

1. **Absence de « Quête suivie » (boussole d'objectif) à l'écran**
   - *Constat* : dans `EcranAventure.tsx`, l'en-tête montre le lieu, le moment, les jauges, les vivres et l'or, mais jamais l'étape de quête active. Le joueur doit quitter l'onglet `Actions`, ouvrir l'onglet `Journal` (`modules/journal.ts`), lire ses quêtes, puis revenir à `Actions`.
2. **Changements d'état silencieux dans le bandeau supérieur**
   - *Constat* : quand un choix fait monter une jauge, consomme/rapporte de l'or, fait passer `1 h` ou ajoute un objet au sac, rien ne s'anime sur les compteurs de l'en-tête. Tout est uniquement écrit dans le flux du journal. De plus, l'heure précise (`scene.heure`) n'est visible qu'en infobulle (`title`) sur `Jour X · matin`, alors que les trajets et présences de PNJ dépendent de l'heure.
3. **Manque d'aperçu sur les boutons d'action d'exploration**
   - *Constat* : sur l'écran de rencontre (`EcranRencontre.tsx`), un bouton alternatif affiche l'acteur et le bonus (ex. `Persuasion DD 13 · Hilda +3`). En exploration (`modules/exploration.ts`), les boutons `Fouiller`, `Crocheter`, `Forcer` et `Désamorcer` n'indiquent ni quel héros va agir par défaut, ni son bonus de compétence avant le clic.
4. **Navigation sur la carte en deux temps**
   - *Constat* : sur `CarteMonde.tsx`, cliquer un marqueur ne fait que le sélectionner ; il faut ensuite chercher le bouton `Y aller (1 h)` dans le volet inférieur `.carte-volet`. Aucun tracé visuel ne relie non plus le lieu actuel (`ici`) aux lieux directement accessibles.
5. **Pas de bouton « Annuler la dernière action » hors combat**
   - *Constat* : un clic involontaire sur une sortie qui coûte `2 h` de marche (et fait avancer l'horloge ou tire un D6 d'arrivée) est irréversible, sauf à recharger la sauvegarde depuis l'écran titre.

### B. Conversations, PNJ & Marchands

1. **Perte de l'historique immédiat pendant un dialogue**
   - *Constat* : dans `EcranAventure.tsx`, `entreesDeConversation` coupe le journal à la **dernière** prise de parole du PNJ (`journal.slice(derniere)`), et le récit principal `.aventure-recit` est masqué pendant toute la conversation. Si le joueur enchaîne deux questions, il ne peut plus relire la réponse précédente sans fermer le dialogue.
2. **Attitude du PNJ et jets d'influence cachés**
   - *Constat* : `Interlocuteur.attitude` est calculé dans `modules/dialogue.ts`, mais `BoiteDialogue.tsx` ne l'affiche pas. En outre, les 3 boutons d'influence (`[Persuader]`, `[Intimider]`, `[Tromper]`) sont mélangés à la suite des sujets de conversation sans séparateur visuel (la propriété `element: { id: 'influence', titre: 'Peser sur son attitude' }` n'est pas exploitée par `BoiteDialogue`), et leur DD / Avantage / Désavantage / meilleur orateur n'est visible qu'au survol (`title`).
3. **Boutiques purement textuelles dans la colonne latérale**
   - *Constat* : lorsqu'on parle à un marchand (`modules/commerce.ts`), ses articles apparaissent dans la colonne `Actions` à droite sous forme de simples boutons texte (`Acheter — 15 po`), pendant que le joueur regarde la boîte de dialogue au centre. Il n'y a ni image d'objet, ni fiche descriptive (dégâts, CA, effet), ni indication de qui dans le groupe peut l'équiper.

### C. Combat Tactique

1. **Aucun avertissement d'Attaque d'opportunité sur l'aperçu de déplacement**
   - *Constat* : dans `Combat.tsx`, survoler une case trace le chemin (`s.chemin`) et indique le coût en mètres, mais rien ne signale qu'une étape du trajet quitte la zone d'allonge d'un ennemi disposant de sa réaction.
2. **Contrôles de rythme (`▶▶ Rapide`) cachés dans un sous-menu et non persistés**
   - *Constat* : dans `PanneauTour.tsx`, l'accélération des animations (`rapide`) est cachée dans le bouton `⚙` et son état (`useState(false)` dans `Combat.tsx`) est perdu à chaque combat.
3. **Piste d'initiative unidirectionnelle**
   - *Constat* : dans `Initiative.tsx`, survoler un portrait affiche sa fiche à gauche, mais n'illumine pas son jeton sur le plateau (`Plateau.tsx`). Quand plusieurs ennemis identiques sont sur la grille, il est difficile de savoir lequel jouera en premier. Cliquer un portrait dans la barre d'initiative ne permet pas non plus d'épingler sa fiche ou de le cibler.
4. **Mention `(mort)` trompeuse sur l'écran de fin de combat d'histoire**
   - *Constat* : dans `FinCombat.tsx`, la ligne `Héros tombés` affiche `Nom (mort)` même lors d'un combat d'histoire où la règle relève tous les héros à `1 PV` à la reprise du récit (`App.tsx`).

### D. Inventaire, Créateur de Personnage & Menus

1. **Pas de comparateur « Équipé vs Sac » dans la feuille de personnage**
   - *Constat* : dans `FeuillePersonnage.tsx`, cliquer sur une arme ou armure du sac affiche sa fiche à droite, mais pour comparer ses caractéristiques avec l'équipement actuellement porté par le héros, il faut alterner les clics entre le sac et la poupée.
2. **Créateur de personnage sans aperçu en direct ni filtre sur les sorts jouables en combat**
   - *Constat* : dans `Createur.tsx`, le joueur traverse 7 écrans sans voir en direct la fiche synthétique (`PV`, `CA`, bonus d'attaque, DD des sorts) de son héros en construction. Lors du choix des sorts, les sorts utilisables en combat et les sorts utilitaires sont mêlés sans filtre rapide.
3. **Écran Titre obsolète et absence d'écran Options**
   - *Constat* : le pied de page de `EcranTitre.tsx` indique encore *« Prototype : le conteur (maître de jeu) n'est pas encore branché »*, et il manque un menu **Options** pour configurer la clé API du joueur, le modèle du conteur, le plafond de dépense et la taille de police.

---

## 3. Propositions d'amélioration classées par priorité

| Priorité | # | Proposition | Fichiers principalement touchés | Effort | Impact UX |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1 — Quick Wins** | **1** | **Dialogue lisible & Attitude visible** : conserver tout l'échange de la conversation en cours dans `BoiteDialogue` (avec défilement), afficher un badge d'attitude (`Méfiant`, `Neutre`, `Amical`), séparer visuellement le bloc « Peser sur son attitude » des questions, et afficher `[Persuader DD 15 · Hilda +4 (Avantage)]` directement sur le bouton. | `BoiteDialogue.tsx`, `EcranAventure.tsx`, `modules/dialogue.ts` | Petit | ⭐⭐⭐⭐⭐ |
| **P1 — Quick Wins** | **2** | **Alerte d'Attaque d'opportunité & Piste d'initiative interactive en combat** : (a) marquer d'une icône `⚠ Opportunité` les cases du chemin survolé qui déclenchent une réaction ennemie ; (b) illuminer sur le plateau le jeton survolé dans la barre d'initiative et permettre de cliquer sur un portrait d'initiative pour épingler sa fiche ou le cibler ; (c) sortir le bouton `▶▶ Rapide` en accès direct sur le bandeau de tour (et mémoriser le choix dans `localStorage`) ; (d) préciser `relevé à 1 PV` dans `FinCombat.tsx` en mode histoire. | `Combat.tsx`, `Plateau.tsx`, `Initiative.tsx`, `PanneauTour.tsx`, `FinCombat.tsx` | Petit à moyen | ⭐⭐⭐⭐⭐ |
| **P1 — Quick Wins** | **3** | **Boussole de quête suivie & Retours visuels (`+1`, `-10 po`, heure)** : afficher dans l'en-tête de `EcranAventure.tsx` l'objectif de la quête active (cliquable pour ouvrir sa fiche parchemin), afficher l'heure lisible (`14 h · après-midi`), et déclencher de courts badges animés (`+1`, `-15 po`, `+50 PX`) dans l'en-tête quand une action modifie l'état. | `EcranAventure.tsx`, `styles.css` | Petit | ⭐⭐⭐⭐ |
| **P1 — Quick Wins** | **4** | **Transparence des jets d'exploration** : afficher sur les boutons `Fouiller`, `Crocheter`, `Forcer` et `Désamorcer` le nom du héros qui agit et son bonus (ex. `Crocheter — Pip +6`), avec un petit sélecteur si le joueur préfère faire agir un autre compagnon. | `modules/exploration.ts`, `BoutonProposition.tsx` | Petit | ⭐⭐⭐⭐ |
| **P2 — Confort & Immersion** | **5** | **Vraie vitrine de Marchand illustrée** : enrichir les propositions du module `commerce.ts` avec l'image de l'objet (catalogue SRD ou monde), son résumé (dégâts, CA, soins) et une pastille d'aperçu au survol ou au clic, ou afficher un tiroir « Boutique » dédié à côté du dialogue. | `modules/commerce.ts`, `BoutonProposition.tsx` | Moyen | ⭐⭐⭐⭐ |
| **P2 — Confort & Immersion** | **6** | **Comparateur d'équipement dans la Feuille de personnage** : lorsqu'un objet équipable du sac est sélectionné, afficher sous sa fiche un encart compact « Remplace sur [Héros] : [Objet actuel] (dégâts / CA avant → après) ». | `FeuillePersonnage.tsx`, `equipement-regles.ts` | Petit à moyen | ⭐⭐⭐⭐ |
| **P2 — Confort & Immersion** | **7** | **Carte du monde plus directe** : permettre le double-clic sur un lieu accessible pour s'y rendre immédiatement, tracer sur le SVG les chemins reliant le lieu actuel (`ici`) aux sorties connues avec leur durée en heures, et afficher un bouton d'action près du marqueur sélectionné. | `CarteMonde.tsx` | Petit à moyen | ⭐⭐⭐ |
| **P2 — Confort & Immersion** | **8** | **Filet « Annuler le dernier pas » (Undo 1 cran hors combat)** : garder en mémoire l'état `Partie` précédent lors d'une action sans jet aléatoire (déplacement sans rencontre, achat/vente) et proposer un bouton discret `↶ Annuler` juste après l'action. | `EcranAventure.tsx`, `App.tsx` | Petit | ⭐⭐⭐ |
| **P3 — Création & Produit** | **9** | **Créateur de personnage guidé avec aperçu en direct** : ajouter un encart d'aperçu permanent (`PV`, `CA`, `Attaque`, `Sorts`) sur les étapes 1 à 7 de `Createur.tsx`, ajouter un filtre « Jouables en combat » dans le choix des sorts, et varier le sexe/portrait dans la Création rapide. | `Createur.tsx`, `brouillon.ts` | Moyen | ⭐⭐⭐⭐ |
| **P3 — Création & Produit** | **10** | **Menu Options (Clé API, Modèle du Conteur, Taille du texte) & Nettoyage de l'Écran Titre** : retirer la phrase obsolète de `EcranTitre.tsx` et ajouter une modale `Options` (taille de police 100 % / 115 % / 130 %, réduction des animations, configuration du conteur). | `EcranTitre.tsx`, `EcranAventure.tsx`, `styles.css` | Moyen | ⭐⭐⭐⭐ |
