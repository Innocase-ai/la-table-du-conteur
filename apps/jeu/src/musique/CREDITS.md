# Musiques du jeu

Trois usages, un dossier chacun (`src/musique.ts` choisit et joue) :

- `combat/` : l'ambiance d'un combat, une boucle tirée au hasard à chaque combat (jamais la même deux fois de suite) ;
- `accueil/` : la musique des menus, une boucle tirée au hasard ;
- `fond/` : les musiques de fond des histoires, communes à toutes, **très basses** (−30 dB), enchaînées dans un ordre aléatoire sans répétition avec un fondu de 3 s ; elles baissent encore pendant une scène narrée.

Tous les fichiers passent par `pnpm musique boucler` (fondu enchaîné fin → début, volume moyen −26 dB, pic ≤ −3 dB ; −30 dB pour le fond) : le test `fichiers-audio.test.ts` mesure ces niveaux.

## Générées par IA (Google Lyria 3 Clip, via OpenRouter, 04/11/2026)

| Fichier | Ambiance |
| --- | --- |
| `combat/foret.mp3` | Embuscade en forêt |
| `combat/souterrain.mp3` | Crypte et souterrain |
| `combat/caverne.mp3` | Caverne |
| `combat/camp.mp3` | Camp de guerre |
| `combat/intense.mp3` | Combat intense |

Boucles de 25 à 29 s, tirées de clips de 30 s (`pnpm musique generer`, consignes dans `outils/musique/ambiances.ts`, brouillons dans `sorties/musique/`, hors git). **Licence : à confirmer avant la vente du jeu.** Ni OpenRouter ni la page Google du modèle ne précisent les conditions d'usage commercial des musiques générées. Les morceaux portent un filigrane SynthID inaudible.

## Pixabay (07/11/2026)

Téléchargées sur Pixabay par l'utilisateur, sous la licence de contenu de Pixabay : usage commercial permis, attribution non requise (le crédit est donné ici et dans la page Crédits du jeu), mais **interdiction de vendre ou distribuer un fichier seul** (les musiques ne sont donc jamais proposées en téléchargement séparé du jeu). Les fichiers d'origine sont conservés hors git dans `sorties/musique/pixabay/` (sorties du traitement) ; les originaux téléchargés sont dans le dossier de l'utilisateur.

| Fichier du jeu | Fichier d'origine | Auteur (d'après le nom du fichier) |
| --- | --- | --- |
| `accueil/accueil-1.mp3` | `départ-jeux.mp3` | **à renseigner** (fichier renommé) |
| `accueil/accueil-2.mp3` | `départ-jeux-2.mp3` | **à renseigner** (fichier renommé) |
| `combat/bataille.mp3` | `Combat 1.mp3` | **à renseigner** (fichier renommé) |
| `fond/fond-ambiance.mp3` | `leberch-ambient-cinematic-628167.mp3` | Leberch |
| `fond/fond-documentaire.mp3` | `leberch-cinematic-documentary-628281.mp3` | Leberch |
| `fond/fond-sombre-1.mp3` | `leberch-dark-cinematic-628051.mp3` | Leberch |
| `fond/fond-sombre-2.mp3` | `leberch-dark-cinematic-628203.mp3` | Leberch |
| `fond/fond-donjon.mp3` | `menieldm-shadows-beneath-the-keep-495833.mp3` | Menieldm |
| `fond/fond-montagne.mp3` | `the_mountain-heroic-heroic-music-508023.mp3` | The_Mountain |

**À faire avant la vente :** compléter l'auteur et le lien Pixabay des trois fichiers renommés, et garder pour chaque morceau le certificat de licence Pixabay (fichier `.txt` téléchargé depuis sa page) avec la date de téléchargement : c'est la preuve à fournir en cas de réclamation YouTube (Content ID) sur une vidéo du jeu.
