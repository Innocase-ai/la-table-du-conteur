---
name: verifier-completude-histoire
description: Vérifier ce qui MANQUE dans une histoire de « La Table du Conteur » avant de la dire finie ou de la publier : images de lieux, de PNJ et d'objets (y compris la clé ou le fragment qui s'affichent avec une icône vide dans le sac), cartes illustrées des lieux, positions des lieux sur ces cartes, scènes narrées et leurs voix, contrats annoncés mais jamais écrits, estimation, chapitres. À utiliser à la fin de chaque lieu, avant toute présentation de bilan ou de publication (V8), après un essai dans le jeu, et dès que l'utilisateur dit « il manque… ». Complète `creer-monde` (qui construit) et `auditer-coherence-monde` (qui vérifie que ce qui existe est juste).
---

# Vérifier ce qui manque dans une histoire

Le validateur (`pnpm monde valider`) dit si ce qui **existe** est juste. Ce skill cherche ce qui **n'existe pas encore** : le joueur le voit tout de suite (tuile vide, icône par défaut, carte en anneau de pastilles, voix de synthèse). Un monde peut valider à 0 erreur et rester à moitié nu.

> **Le bilan complet en une commande** : `pnpm monde verifier <monde>` enchaîne la validation, cette complétude (`manque`), l'estimation à jour, la revue de secrets du `canon.json` et la preuve des fins (`--sans-parcours` pour aller vite). Les rubriques ci-dessous restent celles de `manque`.

## Étape 1 : la commande (automatique, gratuite)

```bash
pnpm monde manque <monde>
```

Elle liste, avec un code de sortie 1 s'il manque quelque chose :

| Rubrique | Ce qui manque | Comment le réparer |
| --- | --- | --- |
| `images` | lieu, PNJ ou objet du monde sans image ; objet du catalogue cité (trésor, boutique, inventaire, récompense) sans image commune | `pnpm images monde <monde> --lieu <id> --service klein --go` (une image à la fois, coût annoncé d'abord), prompt retouché dans `images.json` (`lieu-<id>`, `pnj-<id>`, `objet-<id>`) ; puis `uv run --with pillow python outils/images/installer.py monde <monde>` |
| `cartes` | un lieu qui en contient au moins 5 autres n'a pas de carte illustrée | `pnpm images cartes <monde> --lieu <id>` (simulation), composition dans `images.json` (`carte-<id>`, reprise de la fiche de niveau 1), `--go` après accord ; la carte du parent d'abord, la découpe sert de référence aux enfants |
| `positions` | lieux enfants sans `position` sur la carte de leur parent | poser `position {x, y}` d'après l'image RÉELLE, en la regardant (le service d'images ne place pas les lieux où on le demande) |
| `scenes` | pas de scène d'ouverture (`debut`) ; image d'un plan absente du manifeste ; fin sans scène | écrire `scenes/scenes.json` (skill `creer-monde`, étape 12 ; images déjà faites, pas de nouvelle dépense) |
| `voix` | plan de scène sans voix | `pnpm voix generer <monde> --go` (voix officielle du Maître de jeu, jamais un autre timbre) |
| `textes` | lieu sans récit d'arrivée ou sans accroche | rédacteur Haiku, d'après la fiche de niveau 2 |
| `contrats` | des lieux annoncent des contrats que personne n'a écrits | skill `creer-contrats` |
| `publication` | monde publié sans `estimation.json` ; aucun chapitre ne liste ses quêtes ; monde encore en brouillon | `pnpm monde estimer <monde>`, `chapitres[].quetes`, puis `statut` à `publie` après accord |

Un **manque** bloque la livraison ; un **avis** se lit et se décide.

## Étape 2 : ce que la commande ne voit pas (à vérifier soi-même)

- **Objets obtenus autrement que par un trésor** (effet `objet` d'un sujet, d'une rencontre, d'une quête) : ils sont dans `dm.objets` si l'histoire les définit, donc comptés ; mais un objet qu'un effet donne sans que le monde le définisse n'a ni nom ni image : le validateur le signale, relire.
- **Chaque lieu a-t-il de quoi faire ?** (combat, PNJ, trésor, énigme, secret) : relire le budget du niveau 1 contre les données (`docs/mondes/<monde>.md`, `pnpm monde doc`).
- **Rattachement du contenu** : faits, rencontres, PNJ présents, énigmes bien placés dans leur lieu (essai dans le jeu, pas seulement le validateur).
- **Compagnons, marchands, dilemmes, factions** : annoncés par le canon (BIBLE, fil rouge) et absents des données ; avis « Richesse » du validateur.
- **Sons et musiques** : `docs/SONS.md`.
- **Jouer vraiment** : lancer le jeu (`pnpm jeu`, Ombresang provisoirement en `publie` pour l'essai, à remettre ensuite), jouer l'ouverture, un combat, un dialogue, un trajet, ouvrir le sac et la carte. C'est ainsi qu'on trouve l'icône vide d'une clé ou une carte sans fond.
- **Cohérence entre images** : relire chaque image contre sa fiche (une image qui contredit le texte est un manque, pas un détail).

## Étape 3 : rendre compte, puis dépenser avec accord

- Présenter le résultat en tableau : rubrique, nombre, coût estimé pour la réparer (≈ 0,01 $ par image, ≈ 0,003 $ par plan de voix).
- **Annoncer le coût et attendre l'accord** avant toute génération (images, voix) : règle du projet.
- Faire un **essai d'une ou deux images** avant un lot, relire chacune contre sa fiche, refaire celles qui ne collent pas (retouche du prompt, jamais de la fiche gelée).
- Après réparation : relancer `pnpm monde manque <monde>` jusqu'à 0 manque, puis `pnpm monde valider`, `pnpm test`, et noter dans `docs/JOURNAL.md`.

## Pièges connus

- Le modèle d'images **ne sait pas compter** (quatre roues dentées donnent cinq ou six) et **refuse** certains prompts (« blessures », « poignets à vif » : violence) : un refus ne coûte rien, adoucir la description. Pour un objet dont le nombre compte, le montrer fermé ou isolé.
- Un objet de l'histoire s'affiche avec l'**icône de sa catégorie** (une clé : un cadenas) tant que son image n'existe pas : c'est le signe à chercher dans le sac.
- Les cartes illustrées d'un lieu s'accompagnent de **positions** : sans elles, le jeu dessine les lieux en cercles pointillés sur fond uni (la « carte » d'un village sans carte).
- Les noms de fichiers de scène et de voix sont liés : `voix/<scene>-<plan>.mp3`. Renommer une scène oblige à refaire ses voix.
