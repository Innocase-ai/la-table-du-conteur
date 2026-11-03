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
