# La Forge d'Histoires → un monde brouillon

La **Forge d'Histoires** (`RPGMakerStory/index.html`, à la racine du dossier D&D, hors dépôt) est un éditeur visuel autonome, dans le navigateur : on y glisse des lieux, des PNJ, des contenants, des objets et des quêtes, on les imbrique (village > bâtiment > pièce > contenant > objet) et on les relie (donne la quête, se termine à, requiert, garde, vend…). Elle sert à **concevoir et faire valider** un lieu de départ dense avant d'écrire un seul fichier (cap du 15/11/2026, `docs/PRD-SAGA.md`, fiches F2 et F3).

`pnpm monde importer-forge` transforme sa sauvegarde (`.forge.json`, bouton « Sauver ») en **nouveau monde en brouillon**.

```bash
pnpm monde importer-forge chemin/vers/histoire.forge.json mon-monde [--niveaux 1-2] [--heures 1]
pnpm monde valider mon-monde
```

- Il ne crée qu'un **nouveau** monde (refus si l'identifiant existe), après avoir tout converti : aucun dossier à moitié rempli. Le moteur n'est pas touché.
- Fichiers écrits : `monde.json` (statut `brouillon`), `lieux/forge-lieux.json`, `pnj/forge-pnj.json`, `objets/`, `tresors/`, `rencontres/`, `quetes/`, `evenements/`, `fins/`, plus `BIBLE.md`, `GUIDE-ZONE.md`, `canon.json`, `conception.forge.json` (copie de la source) et **`RAPPORT-FORGE.md`**.
- Le rapport liste ce qui est deviné, écarté ou à écrire, et la correspondance **référence de la Forge (L1, P3…) → identifiant du monde**.
- Le squelette est **jouable de bout en bout** (test : le joueur automatique `pnpm monde parcours` atteint la fin) ; tout ce qui n'est pas de la mécanique est un texte « À écrire : … » à remplacer.

## Dans l'atelier

`pnpm atelier`, puis **http://localhost:5180/forge/** (lien « Forge ↗ » dans l'en-tête de l'atelier). La Forge s'y ouvre comme page à part (`apps/atelier/public/forge/index.html`) ; son bouton **🏗 Créer le monde** envoie la conception à `POST /api/atelier/forge-importer` (`apps/atelier/forge.ts`, même convertisseur que la commande), puis propose d'ouvrir le monde dans l'atelier (vue Santé : « Aucune erreur : le monde est jouable » sur l'exemple). Un identifiant déjà pris est refusé (409), jamais d'écrasement.

- **La copie du dépôt est la référence.** `RPGMakerStory/index.html` (hors dépôt) n'a pas le bouton ; toute évolution de la Forge se fait dans `apps/atelier/public/forge/index.html`. Le brouillon de la Forge (localStorage) est propre à l'origine : celui de `localhost:5180` n'est pas celui d'un fichier ouvert à la main (utiliser Sauver / Ouvrir pour le déplacer).
- Ouverte hors de l'atelier (fichier local), la Forge fonctionne comme avant ; seul le bouton « Créer le monde » dit qu'il faut passer par l'atelier.
- Le serveur de l'atelier est relancé après toute modification de `serveur-mondes.ts` (piège connu).

## Correspondance

| Forge | Monde |
|---|---|
| (racine) | un lieu `region` au nom de l'histoire, qui réunit les lieux de plus haut niveau ; le monde démarre au premier village |
| village, maison, taverne, sanctuaire, forêt, grotte, ruines, lieu de quête | `village`, `batiment`, `lieu-dit`, `grotte`, `ruine` ; un lieu dans un bâtiment devient une `salle` ; la taverne : services `auberge`, `repas` et `repos: sur` ; le sanctuaire : `soins` |
| lien « mène à » | `liens` de type `chemin` (double sens, `--heures`, 1 par défaut) |
| PNJ (quêteur, notable, marchand, prêtre, allié) | `Pnj` : 1re réplique → salutation, les suivantes → sujets ; marchand → `boutique` (liens « vend ») ; prêtre → service de soins |
| adversaire, monstre | une **rencontre** de combat : profil du SRD trouvé dans le nom (« Goule des cryptes » → `goule`), sinon profil par défaut **à choisir** ; « Danger » → faible, modérée ou élevée ; déclenchée à l'entrée du lieu |
| coffre, armoire, cercueil, sac | `Tresor` (coffre, autre, sarcophage, sac) ; objets contenus ; bourse → `pieces` ; lien « garde » → `gardien` |
| objets posés dans un lieu | un trésor « sol » par lieu ; ce que vend un marchand n'est pas posé par terre |
| objets | `Objet` du monde ; une arme dont le nom ne contient pas d'arme du SRD reste « divers » (avis) |
| quête | `Quete` : étapes tirées des liens (se déroule à, se termine à → aller ; requiert un monstre → vaincre ; requiert un objet → trouver) puis **retour au donneur** ; le donneur la propose par un sujet, un lieu donneur par un événement d'entrée ; PX et pièces lus dans les champs de la Forge |
| quête principale | une fin « quête terminée » (épilogue à écrire) |

## Ce que la Forge ne sait pas dire (reste à la main)

Espèce, sexe, apparence et personnalité des PNJ (valeurs provisoires `humain`, `N`, `à définir`) ; verrous, pièges, caches, difficulté d'un contenant ; récit d'arrivée, accroche et visuel des lieux ; images, voix, scènes ; alternatives de négociation ; jauges, factions, dilemmes ; niveau des lieux. À terme, la Forge gagnera ces champs (F1 à F4 du PRD-SAGA) : voir la note d'intégration du 16/11/2026 dans le journal.

## Code

`outils/monde/importer-forge.ts` (conversion pure `convertirForge`, écriture `ecrireMondeForge`), commande dans `outils/monde/cli.ts`, test `outils/monde/importer-forge.test.ts` ; côté atelier `apps/atelier/forge.ts` (+ `forge.test.ts`), route dans `serveur-mondes.ts` ; exemple de conception `outils/monde/fixtures/villambrune.forge.json` (l'histoire d'exemple de la Forge).
