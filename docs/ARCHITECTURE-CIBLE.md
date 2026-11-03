# Architecture cible : un moteur à modules

Demande (03/11/2026) : le jeu doit pouvoir grandir (scènes narrées en image et voix, inventaire, grimoire des classes qui lancent des sorts, journal de quêtes, et d'autres modules à venir) **sans tout réécrire à chaque ajout**. Faut-il aussi changer de langage (Rust ou autre) ?

Réponse courte : **garder TypeScript, mais changer l'ossature.** Le moteur actuel est sain dans le détail (règles pures, testées, déterministes en combat) ; ce qui bloque la croissance, c'est l'absence de colonne vertébrale commune : chaque sous-système a son état, son format de résultat et son point d'entrée. La cible est un **noyau** (état unique, commandes, événements, effets) sur lequel chaque fonctionnalité se branche comme un **module**.

## 1. Le moteur aujourd'hui

| Partie | Taille | Bien | Limite pour la suite |
| --- | --- | --- | --- |
| Règles (`fiche`, `schemas`, dés, tests d20) | ~1 000 lignes | Pures, testées | — |
| Création (`creation/`) | ~800 lignes | Exigences et recommandations claires | Dépend du combat (`combat/sorts`, `combat/creation`) : couches inversées |
| Combat (`combat/`) | ~2 700 lignes | Déterministe (graine dans l'état), IA par simulation, 30 monstres | Repart de zéro à chaque combat (PV, emplacements, potions) |
| Monde (`monde/`) | ~2 300 lignes | Format riche, validation, conditions et effets, exploration | Hasard non sérialisable (`Generateur` en fermeture) ; verbes qui renvoient chacun un compte rendu ad hoc |
| Client (`apps/jeu`) | ~7 000 lignes + 4 800 de CSS | Écrans soignés | `App.tsx` aiguille tout à la main (8 états React) ; une feuille de style unique |

**Les quatre problèmes de fond**

1. **L'état d'un personnage est éclaté en trois.** La `Fiche` (création), le `Combattant` (combat, reconstruit à chaque combat depuis un `Kit`) et l'`Aventurier` (exploration : fiche + PV + outils). Les PV vivent à deux endroits, l'inventaire à trois (`EtatMonde.inventaire` pour le groupe, `fiche.equipement` en texte libre, `Kit` pour le combat), les emplacements de sorts nulle part entre deux combats. Conséquences déjà visibles : **chaque combat de l'histoire redonne une potion neuve et recharge les sorts.** Un inventaire ou un grimoire ne peut pas se construire là-dessus.
2. **Il n'y a pas d'état racine.** La partie est répartie entre `EtatMonde`, son sous-état d'exploration, les PV du groupe dans `Partie.groupe`, le journal et le combat en attente dans le client, la sauvegarde bricolée dans le navigateur. Rien n'est versionné.
3. **Il n'y a pas d'événements.** Les verbes modifient l'état et renvoient du texte (`constats`). Un journal de quêtes, une cinématique déclenchée par une découverte, un succès, une statistique ou le conteur lui-même ont besoin de savoir **ce qui s'est passé** sous forme de données (« quête X : étape Y accomplie », « objet Z obtenu »), pas de phrases. Aujourd'hui, `avancerQuetes` fait avancer les quêtes sans le dire à personne.
4. **Chaque verbe est déclaré trois fois** : la fonction du moteur, le bouton du client, et (bientôt) l'outil du conteur. Ajouter une action, c'est toucher trois endroits qui peuvent diverger.

## 2. Faut-il changer de langage ?

| Option | Pour | Contre | Verdict |
| --- | --- | --- | --- |
| **TypeScript** (actuel) | Un seul langage du moteur à l'interface ; types partagés avec React ; Zod sert à la fois aux données, aux commandes et aux outils du conteur ; SDK Anthropic natif ; 355 tests existants ; je l'écris et le relis très bien | Moins de garanties qu'un langage à types algébriques stricts ; moins rapide | **Garder**, en durcissant : unions discriminées partout, `exhaustive switch`, aucun `any` |
| **Rust** (cœur en WebAssembly) | Performance, sûreté, types très stricts | Réécrire ~14 000 lignes et les tests ; une frontière WASM entre moteur et interface (sérialisation à chaque appel) ; deux langages ; les schémas Zod et les outils du conteur à refaire de l'autre côté | **Non pour le moteur.** Le jeu est au tour par tour : le seul calcul lourd est l'IA du combat (simulations), qui tient en TypeScript et peut passer dans un Web Worker. Rust n'apporterait pas de modularité : c'est l'architecture qui la donne |
| **Rust pour l'application de bureau** (Tauri) | Coquille légère, trousseau sécurisé pour les clés d'API, fichiers de sauvegarde, serveur local | Aucun | **Oui**, quand on fera l'application vendue : Rust pour la coquille, TypeScript pour le jeu |
| **C# / Godot, Unity** | Moteurs de jeu complets (animations, audio, 3D) | Tout réécrire ; le jeu est une interface riche et du texte, pas de la 3D ; perdre le web | Non |

Si un jour l'IA du combat devient trop lente (groupes plus grands, plus de simulations), on mesurera puis on portera **ce seul module** en Rust/WASM derrière la même interface. Le noyau proposé le permet.

## 3. La cible

```
                ┌──────────── Contenu (données validées) ────────────┐
                │  SRD  ·  mondes/<id>  ·  extensions de modules       │
                └─────────────────────────┬───────────────────────────┘
                                          │ schémas fournis par les modules
┌─────────────────────────────── Noyau ───┴──────────────────────────────────┐
│  État de partie unique (JSON, versionné)   Hasard dans l'état (graine)     │
│  Commandes ──► validation (Zod) ──► résolution ──► Événements ──► état      │
│  Effets (langage commun, extensible)       Registre des modules            │
└──────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
       │          │          │          │          │          │
  Exploration  Dialogue    Combat   Inventaire  Grimoire   Quêtes   Scènes narrées …
       │          │          │          │          │          │
       └──────────┴── commandes ─┴── événements ─┴── vues ──┴──────────┘
                │                         │                     │
        Boutons du client          Outils du conteur      Panneaux du client
     (générés des commandes)   (générés des commandes)   (fournis par les modules)
```

### 3.1 Un état de partie unique

```ts
interface Partie {
  version: number;              // pour migrer les vieilles sauvegardes
  monde: string;
  graine: number;               // le hasard fait partie de l'état : parties rejouables, tests, débogage
  horloge: { jour: number; moment: 'matin' | 'jour' | 'soir' | 'nuit' };
  groupe: Personnage[];         // UN modèle de personnage pour tout le jeu
  scene: Scene;                 // exploration | dialogue | combat | cinématique
  modules: Record<string, unknown>; // l'état propre à chaque module (monde, quêtes, inventaire de groupe…)
  journal: Evenement[];         // ce qui s'est passé, en données
}

interface Personnage {
  id: string;
  choix: ChoixPersonnage;       // la création : la fiche se recalcule (niveau, objets portés)
  pv: number; pvTemp: number;
  ressources: Record<string, number>;  // emplacements de sorts, second souffle, rage, dés de vie…
  etats: EtatActif[];
  inventaire: ObjetPorte[];     // équipé ou dans le sac, avec quantité
  xp: number;
}
```

Le combat ne crée plus ses combattants à partir de rien : il **prend** les personnages (PV, emplacements, potions, armes équipées) et **rend** leurs changements sous forme d'événements. Exploration et combat partagent enfin le même héros.

### 3.2 Commandes et événements

Toute action passe par une seule porte :

```ts
const r = moteur.executer(partie, { type: 'fouiller', personnage: 'pip' });
// r.evenements : [{ type: 'jet', … }, { type: 'decouverte', cible: 'piege:…' }, …]
// r.partie : le nouvel état ; r.refus si l'action est impossible
```

- Une **commande** est déclarée **une fois** : son schéma Zod, sa disponibilité (« possible ici et maintenant ? », pour griser ou cacher un bouton), sa résolution. Le client en tire ses boutons, le conteur ses outils (le SDK Anthropic prend directement les schémas Zod), le moteur sa validation.
- Un **événement** est un fait typé : `jet`, `deplacement`, `decouverte`, `objetObtenu`, `pvChange`, `queteMiseAJour`, `faitAppris`, `combatDeclenche`, `sceneNarree`… Le récit affiché, le journal de quêtes, la sauvegarde, les statistiques et le conteur **lisent les événements** ; aucun ne fouille l'état d'un autre module.
- Les modules **réagissent** aux événements des autres : le module Quêtes écoute `objetObtenu` et `faitAppris` ; le module Scènes écoute `queteMiseAJour` pour lancer une cinématique ; personne n'appelle personne directement.

### 3.3 Le contrat d'un module

```ts
interface Module<Etat> {
  id: string;                                   // 'inventaire', 'grimoire', 'quetes', 'scenes'…
  dependances?: string[];
  etatInitial(contexte): Etat;
  donnees?: Record<string, ZodSchema>;          // ce qu'un monde peut fournir (ex. scenes/*.json)
  commandes?: Record<string, Commande>;         // schéma + disponibilité + résolution
  reactions?: Partial<Record<TypeEvenement, Reaction>>;
  effets?: Record<string, GestionnaireEffet>;   // nouveaux effets du langage commun
  vues?: Record<string, (partie) => unknown>;   // ce que le client et la fiche de scène affichent
  migrations?: Migration[];
}

const moteur = creerMoteur([noyau, exploration, dialogue, combat, inventaire, grimoire, quetes, scenes]);
```

Ajouter une fonctionnalité = **un dossier de module + une ligne d'enregistrement** (+ son panneau dans le client). Le format des mondes s'étend de la même façon : un module déclare ses fichiers de données, le chargeur les valide.

### 3.4 Un seul langage d'effets

Aujourd'hui trois familles d'effets coexistent : effets du monde (`EffetMonde`), effets de fiche (traits, objets portés) et effets de combat (sorts, bottes). La cible : **un registre d'effets** où chaque module ajoute les siens (`soigner`, `donnerObjet`, `apprendreSort`, `lancerScene`…). Une potion, un sort de soins hors combat et une récompense de quête passent alors par le même chemin.

### 3.5 Le client

- Un **magasin d'état** (`useSyncExternalStore` sur le moteur, ou Zustand) remplace les huit `useState` d'`App.tsx` ; l'écran courant découle de `partie.scene`.
- Les modules fournissent leurs **panneaux** (Inventaire, Grimoire, Journal de quêtes) que l'écran d'aventure affiche dans des onglets, et leurs **lecteurs** de scène (plateau de combat, lecteur de cinématique).
- Le CSS se range par module (un fichier par dossier), au lieu d'une feuille de 4 800 lignes.

## 4. Les modules demandés, sur cette base

| Module | Données | Commandes | Événements | Vue / panneau |
| --- | --- | --- | --- | --- |
| **Inventaire** | Objets du SRD et du monde (poids, emplacement, effets d'usage) | équiper, ranger, donner, utiliser, jeter, acheter, vendre | `objetObtenu`, `objetPerdu`, `equipementChange` | Sac par personnage, coffre du groupe, encombrement ; le combat lit les armes équipées et les potions réelles |
| **Grimoire** | Sorts du SRD (déjà 181), sorts connus / préparés par classe | préparer (repos long), lancer hors combat (soins, lumière, détection…) | `sortLance`, `emplacementDepense`, `ressourcesRestaurees` | Livre de sorts des lanceurs : emplacements restants, sorts préparés, description |
| **Journal de quêtes** | Quêtes du monde (déjà là) | — (lecture) ; marquer une quête suivie | lit `queteMiseAJour`, `faitAppris` | Quêtes actives, étapes, indices appris, quêtes terminées |
| **Scènes narrées** (« vidéos ») | `scenes/*.json` d'un monde : déclencheur (condition ou événement) et plans (image, texte, voix) | passer, revoir | `sceneNarree` | Lecteur plein écran : image fixe avec léger mouvement, texte qui s'affiche, **voix** générée une fois et livrée avec le jeu (comme les images), sous-titres |

Les voix des scènes narrées suivent la règle des images : **générées une fois par nous, livrées avec le jeu, gratuites pour le joueur** ; le conteur, lui, reste en texte.

## 5. Migration, sans tout casser

Chaque étape garde les 355 tests verts et le jeu jouable. On ne réécrit pas : on **déplace** le code existant dans le nouveau cadre.

| Étape | Contenu | Résultat visible |
| --- | --- | --- |
| **1. Noyau** | `Partie` racine sérialisable et versionnée, graine dans l'état (comme le combat), types `Commande` / `Evenement` / `Module`, `creerMoteur` ; le module Exploration et Dialogue réécrit en commandes qui émettent des événements (le code des verbes est repris tel quel) | Le mode « livre » tourne sur le noyau ; récit construit depuis les événements ; sauvegarde = la `Partie` |
| **2. Personnage unifié** | `Personnage` (choix + PV + ressources + inventaire) ; le combat prend et rend les personnages | Fin de la potion gratuite et des sorts rechargés à chaque combat |
| **3. Commandes partout** | Boutons du client générés depuis les commandes disponibles ; même registre prêt pour les outils du conteur | Une action ajoutée au moteur apparaît dans l'interface sans code d'écran |
| **4. Premiers modules** | Inventaire, Grimoire, Journal de quêtes, avec leurs panneaux | Les trois fonctionnalités demandées |
| **5. Scènes narrées** | Format, lecteur, génération des voix (outil comme `pnpm images`) | Les cinématiques du Val |
| **6. Conteur (M4b)** | Outils générés depuis les commandes, fiche de scène tirée des vues | Le conteur se branche sans code spécifique par verbe |

L'étape 1 est la plus importante : c'est elle qui rend toutes les suivantes additives.

## 6. État : étape 1 faite (03/11/2026)

Le noyau existe (`packages/regles/src/noyau/`) et le mode « livre » tourne dessus.

- **`types.ts`** : `Partie` (JSON, versionnée : monde, graine, scène, groupe, état du monde, état des modules, journal), `CarteEvenements` (événements par type, extensible par un module avec `declare module`), `CommandeJeu` (description, schéma Zod, disponibilité, exécution), `Module` (commandes, réactions, vues, état initial), `ContexteJeu` (monde chargé, SRD).
- **`moteur.ts`** : `creerMoteur(ctx, modules)` vérifie dépendances et doublons de commandes ; `executer(partie, ordre)` valide l'entrée, vérifie la disponibilité, travaille sur une **copie** (l'ancienne partie n'est jamais modifiée), tire les dés sur la graine **de la partie** (`generateurSur`), puis fait réagir les modules aux événements (jusqu'à 10 vagues) ; `commandes(partie)` liste les commandes et leur disponibilité ; `vue(id, partie)` ; `charger(json)` relit une sauvegarde en vérifiant sa version.
- **`differences.ts`** : le noyau compare la partie avant et après chaque action et en tire les événements d'état (déplacement, faits appris, découvertes, objets, pièces, PX, jauges, quêtes, PV, scène, fin) : tout module qui modifie l'état produit ses événements sans rien faire de plus.
- **Modules** (`packages/regles/src/modules/`) : **Exploration** (commencer, aller, fouiller, ouvrir, désarmer, prendre, énigmes, repos, test libre, régler une rencontre ; vue `scene`) et **Dialogue** (parler, influencer, quitter ; vue `interlocuteur`). Ils enveloppent les verbes de `monde/` sans les réécrire.
- **Client** : l'aventure est `{ moteur, partie }` ; chaque bouton envoie une commande ; le récit est rendu depuis `partie.journal` (une nouvelle annonce « Nouvelle quête », « Quête terminée » vient gratuitement des événements) ; la sauvegarde est la `Partie` telle quelle ; un combat se règle par la commande `reglerRencontre`.
- **Tests** (`tests/noyau.test.ts`) : immuabilité, refus (entrée invalide, commande inconnue, indisponible), dés identiques après sauvegarde et rechargement, événements d'état, réaction d'un module à un autre, dialogue en scène, rencontre bloquante puis réglée ; 365 tests verts.
- **Vérifié dans le navigateur** : début de l'histoire, halle et cellier du bailli, reprise après rechargement, embuscade du gué (combat, 150 PX, butin, blessures conservées), conversation avec Hesta qui donne la quête « La Lanterne faiblit ».

Ajouter un module : voir le skill `.claude/skills/ajouter-module/`. Prochaine étape : **2, le personnage unifié** (fin de la potion gratuite et des sorts rechargés à chaque combat).

## 7. État : étape 2 faite (03/11/2026) — le personnage unifié

Un seul modèle de héros pour tout le jeu : `Personnage` (`packages/regles/src/personnage.ts`), qui remplace l'`Aventurier` de l'exploration et nourrit le combat.

- **État durable** : PV, `ressources` (potions, rages, second souffle, fougue, conduit divin) et `emplacements` de sorts. Les maximums se calculent depuis la fiche (`etatDurableMax`, dans `combat/creation.ts`, qui sert aussi au combat).
- **Combat** : `heroCombatDe(personnage)` donne au combat la fiche, l'équipement et **l'état du moment** ; à la fin, `reglerRencontre` reçoit l'état de chaque héros (`heros: { id: { pv, ressources, emplacements } }`) et `appliquerEtat` le reprend, borné par la fiche, sans les ressources qui ne servent qu'en combat (réaction). **Fini la potion neuve et les sorts rechargés à chaque combat.**
- **Repos** (`recuperer`, SRD 5.2.1) : long = PV, usages et emplacements au maximum ; court = un dé de vie (+ Con), une rage, un second souffle, un conduit divin regagnés, la fougue entière, la magie de pacte de l'occultiste ; **jamais les potions**. Table : `RECUPERATION`.
- **Événements** : `ressourceChange` (potions, usages, `emplacement-<niveau>`), déduit automatiquement par le noyau.
- **Sauvegardes** : format en **version 2** ; `noyau/migrations.ts` amène une partie de version 1 (sans ressources) à la version 2. Première migration, premier test de migration.
- **Client** : le bandeau du groupe montre potions et sorts restants (« Potions 1 · Sorts 3/6 »), le détail au survol.

Vérifié dans le navigateur : reprise d'une sauvegarde de version 1 (migrée), embuscade du défilé (Pip boit sa potion, les lanceurs dépensent leurs sorts : l'état reste après le combat), halte (PV par dé de vie, une rage regagnée, pas de sorts), nuit (sorts rendus, potion toujours bue). 370 tests verts.

Prochaine étape : **3, les commandes partout** (boutons générés depuis les commandes disponibles), puis **4, Inventaire, Grimoire, Journal de quêtes**.

## 8. État : étape 3 faite (03/11/2026) — les boutons viennent des commandes

- **Propositions** (`Proposition`, `noyau/types.ts`) : chaque commande peut dire quelles actions concrètes elle offre maintenant (`propositions(ctx, partie)`) : un libellé, l'ordre à envoyer, un panneau (`groupe` : id, titre, ordre d'affichage, description), un élément auquel se rattacher (un trésor, une sortie verrouillée, un piège), un style, une saisie de texte (`saisie`), une raison d'être grisée (`desactivee`), ou une intention gérée par le client (`combattre`).
- **Moteur** : `propositions(partie)` réunit celles de toutes les commandes **disponibles**, rangées par panneau. Pendant une rencontre, on ne voit donc que la rencontre ; en conversation, que la conversation.
- **Panneaux** du jeu (`PANNEAUX`, `modules/commun.ts`) : rencontre (0), dialogue (10), personnes (20), ici (30), à portée de main (40), énigmes (50), partir (90). Un module peut en créer d'autres (un numéro d'ordre suffit).
- **Client** : le panneau d'actions est **générique** (`Panneaux` dans `EcranAventure.tsx`) : il ne connaît aucune commande. Seuls restent spécifiques la fin de l'histoire et le portrait de l'interlocuteur.
- **État** : le niveau d'indice atteint par énigme est désormais dans la partie (`exploration.indices`), et non plus dans l'écran.
- **Test clé** : une marche au hasard de 300 actions, toujours prises parmi les boutons proposés, **sans un seul refus** du moteur. Un module qui propose un bouton cassé fait échouer ce test.

Vérifié dans le navigateur : panneaux du départ, de l'auberge, de la conversation avec Nério (sujets, influence, terminer), « Fouiller » grisé après une fouille (« Déjà fouillé aujourd'hui »), rencontre du gué (issues avec leur compétence), piège repéré avec « Désarmer ». 374 tests verts.

Prochaine étape : **4, Inventaire, Grimoire, Journal de quêtes** — les premiers vrais modules ajoutés sur le noyau.

## 9. État : étape 4 faite (03/11/2026) — Inventaire, Grimoire, Journal de quêtes

Les trois premiers modules ajoutés sur le noyau, **sans toucher aux autres** : un fichier chacun dans `packages/regles/src/modules/`, une ligne dans `MODULES_STANDARD`. Le noyau a gagné une notion : l'**encart** (`Encart`), une fiche d'information qu'un module montre dans un **onglet** ; une proposition peut aussi viser un onglet (`groupe.onglet`). L'écran affiche les onglets que déclarent les modules (dans leur ordre d'enregistrement), sans les connaître.

| Module | Commandes | Événements ajoutés | Onglet |
| --- | --- | --- | --- |
| **Inventaire** (`inventaire.ts`) | `utiliserObjet` (consommables : soins sur le plus blessé, effets), `confierPotion` (une potion de guérison du sac passe à un héros, qui la boira en combat), `identifierObjet` (Arcanes contre le DD de l'objet : son histoire et ses malédictions), `jeterObjet` (jamais un objet de quête) | `objetUtilise`, `objetIdentifie` | **Sac** : bourse et poids, potions portées par chacun, contenu du sac (détail, histoire si identifié) et ses boutons |
| **Grimoire** (`grimoire.ts`) | `lancerSort` : les sorts de soins hors combat (Soins, Mot de guérison, Prière de guérison, Mot de guérison de groupe), sur le plus blessé ou tout le groupe, avec le plus petit emplacement suffisant | `sortLance` | **Grimoire** : un encart par lanceur (DD, attaque, emplacements restants, sorts mineurs et préparés avec leur résumé) ; boutons « Soigner » |
| **Journal** (`journal.ts`) | aucune | aucun | **Journal** : quêtes en cours (type, résumé, étapes actives), quêtes achevées ou échouées, notes (les faits sûrs, du plus récent au plus ancien) |

Le module Inventaire déclare ses événements par augmentation de `CarteEvenements` (`declare module '../noyau/types'`) : la preuve que l'extension prévue fonctionne.

Tests (`tests/modules.test.ts`, groupe conseillé du créateur) : potion du sac qui soigne puis potion confiée, refus (objet absent, personne blessé, objet de quête), identification (jet d'Arcanes, histoire), onglet Sac ; Soins de Hilda (emplacement dépensé, événements), refus (sort inconnu, sort de combat, plus d'emplacement), onglet Grimoire ; quête de la Lanterne dans le Journal. La marche au hasard de 300 actions joue aussi leurs boutons. 382 tests verts.

Vérifié dans le navigateur avec le groupe du joueur : onglets Actions, Sac, Grimoire, Journal ; potions portées, livres de sorts d'Ilyra, Hilda, Sylvaine et Ambrine ; quête « La Lanterne faiblit » au journal après la conversation avec Hesta.

**Pas encore** (prochaines versions de ces modules) : l'équipement de départ des héros dans le sac, équiper une arme ou une armure (il faudra recalculer la fiche), préparer d'autres sorts au repos long, les parchemins, les boutiques, la charge maximale selon la Force, la quête suivie.

Prochaine étape : **5, les scènes narrées** (image, texte, voix).

## 10. État : étape 5 faite (03/11/2026) — les scènes narrées

- **Données de modules dans les mondes** : tout dossier inconnu du format de base (`scenes/`…) est lu et rangé dans `DonneesMonde.extensions` ; le module concerné le valide (`Module.valider`), appelé par `pnpm monde valider` et par les tests de chaque monde livré. Le format des mondes s'étend donc sans toucher au chargeur.
- **Module Scènes** (`modules/scenes.ts`) : format (`SceneNarree` : déclencheur, plans avec image, mouvement, texte, durée), déclenchement par **réaction** aux événements des autres modules (`arrivee`, `deplacement`, `queteMiseAJour`, `faitAppris`, `fin`), file des scènes à jouer et scènes vues (état du module), commandes `terminerScene` et `revoirScene` (boutons « Revoir » dans l'onglet Journal), vue `sceneEnCours`, événement `sceneNarree`.
- **Lecteur** (`apps/jeu/src/aventure/LecteurScene.tsx`) : plein écran, image du monde avec un lent mouvement de caméra, texte en fondu, voix (fichier livré avec le monde, sinon synthèse vocale du système, coupable), enchaînement automatique, « Suivant », « Passer la scène ».
- **Voix** : `pnpm voix lister|generer <monde>` (`outils/voix/cli.ts`), OpenRouter `openai/gpt-audio-mini` ou `openai/gpt-audio`, six voix, PCM en streaming converti en MP3 par ffmpeg (silences de début et de fin retirés), bilan de coût, plafond de dépense (`--plafond`, 0,25 $ par défaut). Simulation par défaut.
- **Garde-fous de lecture** (appris en générant le Val) : un modèle audio n'est pas un lecteur fiable. Laissé « narrateur », il lisait le texte puis **inventait une suite** (« Que va-t-elle choisir maintenant ? ») ; à `temperature: 0`, l'audio **bouclait** (11 s de lecture, puis 13 minutes de silence et de bruit, 0,04 $) avec une transcription parfaite. D'où : une consigne de voix de lecture (texte entre balises, « puis tu te tais »), la température par défaut, la comparaison mot à mot de la transcription au texte (92 % retrouvés au moins, 8 % de mots en trop au plus), une durée attendue (≈ 2,8 mots par seconde) avec coupure du flux au-delà du double, jusqu'à trois essais par plan, et la transcription gardée à côté du MP3 (`voix/<plan>.json`, hors du jeu livré).
- **Voix du Val** : 25 plans lus par `gpt-audio-mini`, voix `onyx`, tous fidèles à 100 % ; 4,4 Mo de MP3, 0,025 $ (plus 0,04 $ perdus sur l'essai qui bouclait).
- **Val des Cendres** : 8 scènes (ouverture, La Lanterne faiblit, le hall du sceau, une par fin), 25 plans, 6 000 caractères à lire, voix livrées.
- **Corrigé au passage** : le CLI des images s'exécutait quand un autre outil l'importait (garde sur le seul nom `cli.ts`) ; il compare maintenant le chemin complet.

Vérifié dans le navigateur : l'ouverture se joue au début de l'histoire et s'enchaîne seule, « Revoir » et « Passer » fonctionnent, la scène de la Lanterne se déclenche quand Hesta confie la quête. 386 tests verts.

Prochaine étape : **6, le conteur (M4b)**, branché sur les commandes et les vues du noyau.
