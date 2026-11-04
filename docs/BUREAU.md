# Version de bureau (Tauri)

Le jeu se développe et se teste dans le navigateur (`pnpm jeu`) ; il se **vend** en application de bureau installable. La coquille de bureau est dans `apps/bureau/` : une fenêtre Tauri 2 qui affiche exactement le jeu de `apps/jeu` (aucun code du jeu n'est dupliqué).

## Commandes

```bash
pnpm bureau              # le jeu dans sa fenêtre de bureau, rechargé à chaque modification (lance aussi `pnpm jeu`)
pnpm bureau:installeur   # construit le jeu puis l'installeur Windows
```

L'installeur sort dans `apps/bureau/src-tauri/target/release/bundle/nsis/` (`La Table du Conteur_<version>_x64-setup.exe`). Il installe le jeu pour l'utilisateur courant (sans droits d'administrateur), en français. Première version (04/11/2026) : installeur de **29,9 Mo**, programme de 38 Mo (le jeu, ses images, ses sons et ses musiques sont dedans) ; compilation en 2 minutes, 1,6 Go de fichiers de compilation dans `target/`.

## Ce qu'il faut sur la machine de développement

Node et pnpm (déjà là pour le jeu), **Rust** (rustup, cargo), les **Build Tools de Visual Studio** (compilateur C++) et **WebView2** (fourni avec Windows 10 et 11). Le premier `pnpm bureau:installeur` télécharge et compile les bibliothèques Rust (environ 2 minutes ; 1,6 Go dans `target/`, ignoré par git) ; les suivants sont beaucoup plus rapides.

## Configuration

- `apps/bureau/src-tauri/tauri.conf.json` : nom du jeu, identifiant (`fr.tableduconteur.jeu`), fenêtre (1440 × 900, minimum 1100 × 700), installeur NSIS en français.
- `apps/bureau/src-tauri/src/lib.rs` : le démarrage de l'application (journal de débogage en développement seulement).
- Icônes : `apps/bureau/src-tauri/icons/`, générées par `pnpm --filter bureau tauri icon apps/bureau/icone-source.png` (un recadrage de l'écran titre, le livre ouvert ; à remplacer par une vraie icône).

## Ce qui fonctionne déjà

Tout le jeu sans le conteur : écran titre, histoires en mode « livre », groupe, combats, effets, bruitages, musiques, sauvegardes (stockage du WebView, conservé entre deux lancements, dans le dossier de données de l'application).

## Ce qui reste à faire

- **Le conteur** : le relais de développement (`apps/jeu/serveur-conteur.ts`) n'existe pas dans l'application ; sans lui, le jeu reste en mode « livre » (le conteur se dit simplement indisponible). Prochaine étape : l'**écran Options** où le joueur saisit sa clé d'API, gardée dans le **trousseau du système** (Gestionnaire d'identification Windows, Trousseau macOS), et l'appel d'OpenRouter depuis l'application avec plafond de dépense.
- **Signature** du programme (sinon Windows SmartScreen avertit au premier lancement) : certificat de signature de code pour Windows, compte développeur Apple pour macOS. À faire au moment de vendre.
- **macOS et Linux** : à construire sur ces systèmes (Tauri ne compile pas pour macOS depuis Windows).
- **Mises à jour** : par la boutique (Steam, itch.io) ou le module de mise à jour de Tauri.
- **Une vraie icône**, et les sauvegardes en fichiers (au lieu du stockage du WebView) si l'on veut les rendre visibles ou les synchroniser.
