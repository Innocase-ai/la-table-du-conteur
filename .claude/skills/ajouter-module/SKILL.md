---
name: ajouter-module
description: Ajouter une fonctionnalité de jeu à « La Table du Conteur » sous forme de module du noyau (inventaire, grimoire, journal de quêtes, scènes narrées, boutiques, artisanat…). À utiliser dès que l'utilisateur demande une nouvelle mécanique, un nouveau système ou un nouveau panneau de jeu, même s'il ne dit pas « module ».
---

# Ajouter un module au moteur

Le moteur est un **noyau** (`packages/regles/src/noyau/`) sur lequel chaque fonctionnalité se branche comme un **module** (`packages/regles/src/modules/`). Lis d'abord `docs/ARCHITECTURE-CIBLE.md` (§ 3 et § 6) et un module existant (`modules/exploration.ts`, `modules/dialogue.ts`). Règle d'or : **ajouter, jamais réécrire** ; si le noyau ne permet pas ce que demande le module, on étend le noyau (avec ses tests), on ne le contourne pas.

## 1. Concevoir

Réponds à ces questions avant d'écrire du code, et montre-les à l'utilisateur pour un module important :
- **État** : que garde le module ? Dans `partie.modules[id]` s'il lui est propre ; dans `partie.groupe` ou `partie.etat` s'il est partagé (ex. inventaire d'un personnage). Tout doit être du JSON.
  - L'état d'un héros vit dans `Personnage` (`src/personnage.ts`) : PV, `ressources` durables, `emplacements` de sorts. Une nouvelle ressource qui dure d'un combat à l'autre (ex. points de ki) : l'ajouter à `etatDurableMax` et à `RECUPERATION` (règle du repos court et long), le combat la reprendra et la rendra sans autre code.
  - Changer la forme de la partie (nouveau champ obligatoire) : augmente `VERSION_PARTIE` et ajoute la migration dans `noyau/migrations.ts`, avec un test qui recharge une sauvegarde de l'ancienne version.
- **Commandes** : ce que le joueur (ou le conteur) peut faire. Une commande = un nom unique, une description d'une phrase (elle sert aussi d'outil au conteur), un schéma Zod strict, une disponibilité (« possible maintenant ? »), une résolution.
- **Événements** : ce qui se passe, en données. Réutilise ceux du noyau (`objetObtenu`, `pvChange`…) ; ajoute les tiens par augmentation de `CarteEvenements` dans le fichier du module :
  ```ts
  declare module '../noyau/types' {
    interface CarteEvenements { sortLance: { personnage: string; sort: string; niveau: number } }
  }
  ```
- **Réactions** : à quels événements d'autres modules il répond (ex. Quêtes écoute `faitAppris`). Ne jamais appeler un autre module directement.
- **Vues** : ce que l'interface et le conteur lisent (calculé, jamais stocké en double).
- **Données de monde** : si le module lit des fichiers d'un monde (ex. `scenes/*.json`), leur schéma Zod et leur validation.

## 2. Écrire

1. `packages/regles/src/modules/<id>.ts` : `export const module<Id>: Module = { id, dependances, etatInitial, commandes, reactions, vues }`. Déclare les commandes avec `commande({ … })` pour l'inférence des types. Les règles pures (calculs) vont dans un fichier à part, sans dépendre du noyau, comme `monde/exploration.ts`.
2. Dans une commande : modifie `t.partie` (c'est une copie), tire les dés avec `t.hasard` (jamais `Math.random`), émets ce que le noyau ne déduit pas seul (`t.emettre({ type: 'texte', … })`). Les changements d'état connus (objets, PV, faits, quêtes…) deviennent des événements **automatiquement**. Pour refuser sans rien changer : `return { refus: 'raison lisible' }`.
3. Enregistre le module dans `modules/index.ts` (`MODULES_STANDARD`) et exporte-le.
4. Si la sauvegarde change de forme : augmente `VERSION_PARTIE` et ajoute une migration (`noyau/migrations.ts`).

## 3. Tester

Dans `packages/regles/tests/<id>.test.ts`, avec `creerMoteur` et un vrai monde (le Val des Cendres) :
- chaque commande : cas nominal, refus (entrée invalide, indisponible), événements émis ;
- immuabilité (l'ancienne partie intacte) et déterminisme (même graine, mêmes dés) si le module tire des dés ;
- les réactions avec les autres modules.
`pnpm test` et `pnpm typecheck` verts.

## 4. Brancher dans le client

- Les actions : **ne code pas de bouton**. Donne à chaque commande jouable par le joueur une fonction `propositions(ctx, partie)` qui renvoie les actions concrètes du moment (`Proposition`, `noyau/types.ts`) : libellé, ordre, panneau (`PANNEAUX` de `modules/commun.ts` ou un nouveau `{ id, titre, ordre }`), élément de rattachement, style, `saisie` pour un texte du joueur, `desactivee` avec la raison. L'écran d'aventure les affiche tout seul. Le test « chaque bouton proposé est jouable » (marche au hasard, `tests/noyau.test.ts`) doit rester vert : ajoute ton module au moteur de ce test si besoin.
- Une commande réservée au conteur (comme `testLibre`) n'a pas de propositions.
- L'information (contenu d'un sac, livre de sorts, liste de quêtes) : **ne code pas de panneau**. Déclare `encarts(ctx, partie)` dans le module : des `Encart` (onglet, titre, ordre, texte, lignes avec libellé, valeur, détail et ton). L'écran crée l'onglet tout seul ; pour y mettre aussi des boutons, donne `onglet` au `groupe` des propositions. Exemples : `modules/inventaire.ts` (onglet Sac), `modules/grimoire.ts`, `modules/journal.ts` (un module sans aucune commande).
- Le récit : si le module ajoute des événements visibles, un `case` dans `EntreeRecit` (`apps/jeu/src/aventure/EcranAventure.tsx`). C'est le seul endroit du client à toucher, et seulement si l'événement doit s'afficher autrement qu'en `constat` ou `texte` (le plus simple : émettre aussi un `constat`).
- Vérifie dans le navigateur (skill `run` ou le panneau navigateur) : jouer la fonctionnalité de bout en bout, recharger la page, reprendre.

## 5. Documenter

- `docs/ARCHITECTURE-CIBLE.md` : le module dans la liste, son état et ses événements.
- `docs/JOURNAL.md` : un paragraphe.
- Si les auteurs de mondes doivent écrire de nouvelles données : `docs/MONDES.md` et le skill `creer-monde` (`references/lecons.md`).
- Améliore ce skill si tu as appris quelque chose en ajoutant le module.
