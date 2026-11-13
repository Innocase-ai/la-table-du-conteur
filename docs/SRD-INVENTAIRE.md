# Inventaire du SRD 5.2.1 (version française)

Source : `sources/FR_SRD_CC_v5.2.1.pdf` (380 pages), téléchargé le 02/11/2026 depuis https://www.dndbeyond.com/srd. Le PDF et son texte extrait ne sont pas versionnés (`.gitignore`) ; pour les retrouver :

```bash
curl -L -o sources/FR_SRD_CC_v5.2.1.pdf https://media.dndbeyond.com/compendium-images/srd/5.2/FR_SRD_CC_v5.2.1.pdf
```

## Attribution obligatoire

À reproduire telle quelle dans les crédits du jeu, sans autre mention de Wizards :

> Cette œuvre inclut du matériel issu du System Reference Document 5.2.1 (« SRD 5.2.1 ») de Wizards of the Coast LLC, disponible à l'adresse https://www.dndbeyond.com/srd. Le SRD 5.2.1 est régi par la Licence Creative Commons Attribution 4.0 International, disponible à l'adresse https://creativecommons.org/licenses/by/4.0/legalcode.

Le jeu peut se dire « compatible avec la cinquième édition » ou « compatible 5E ».

## Contenu et usage prévu

| Partie | Pages | Contenu | Jalon | État des données |
| --- | --- | --- | --- | --- |
| Comment jouer | 5-19 | Caractéristiques, tests d20, maîtrise, actions, exploration, combat, dégâts et soins | M0-M1 | Règles codées dans `packages/regles` (dés, tests d20, modificateurs) |
| Création de personnage | 20-29 | Étapes, valeurs de caractéristique, PV, progression, multiclassage, babioles | M0, M3 | Codé dans `fiche.ts` (sans multiclassage) |
| Classes | 30-86 | 12 classes, **1 sous-classe chacune** | M0 | `donnees/srd/classes/*.json`, niveaux 1 à 20 |
| Historiques | 87 | Acolyte, Criminel, Sage, Soldat | M0 | `historiques/historiques.json` |
| Espèces | 87-91 | Drakéide, elfe, gnome, goliath, halfelin, humain, nain, orc, tieffelin | M0 | `especes/*.json` |
| Dons | 92-94 | 4 d'origines, 2 généraux, 4 styles de combat, 7 faveurs épiques | M0 | `dons/dons.json` |
| Équipement | 95-110 | Monnaie, armes (propriétés, bottes), armures, outils, matériel, montures, train de vie, fabrication d'objets, potions, parchemins | M0, M5 | Armes, armures, outils, matériel et paquetages en JSON (`objets/`) ; montures, véhicules et fabrication à faire (M5, artisanat) |
| Sorts | 111-186 | Règles d'incantation et description des sorts | M1, M3 | 339 sorts de niveaux 0 à 9 en JSON (`sorts/`) ; 25 jouables en combat |
| Glossaire de règles | 187-202 | Définitions (états, actions, zones…) | M1 | À faire |
| Boîte à outils ludique | 203-214 | Voyage, conception d'historique, malédictions, environnement, terreur, poisons, **pièges**, **rencontres de combat** | M1, M5 | À faire |
| Objets magiques | 215-266 | Règles et objets de A à Z | Mondes | Catalogue d'objets en JSON (`objets/*.json`) : 542 objets (dont 318 magiques, un par variante), avec 38 armes et 13 armures de base ; les effets d'usage et les effets portés sont encore du texte (voir l'état des lieux des objets du 13/11/2026 dans `docs/JOURNAL.md`) |
| Monstres | 267-359 | Profils de jeu, monstres de A à Z | M1, Mondes | 30 profils en JSON (FP 1/8 à 7) |
| Animaux | 360-380 | Profils d'animaux | M1 | À faire |

## Ce que le format ne représente pas encore

Relevé lors de l'extraction (M0). Ces éléments sont dans les résumés, pas dans les effets calculés :

- **Choix d'origine** : lignages elfiques et gnomes, héritage fiélon, ascendances draconique et gigante (vision du drow à 36 m, vitesse de l'elfe sylvestre, résistances du tieffelin et du drakéide), don au choix de l'humain (Polyvalent).
- **Choix de classe** : Ordre divin, Ordre primordial, styles de combat, manifestations occultes ; le style de combat se choisit déjà via `dons`.
- **Restriction de l'Expertise** de l'Érudition du Magicien à une liste de compétences.
- **Maîtrises d'outils et langues** (dons, classes, historiques) : en texte.
- **Sorts toujours préparés**, lancers gratuits, vitesses de vol, d'escalade et de nage, avantages aux sauvegardes, Attaque supplémentaire, Arts martiaux : à modéliser avec le combat (M1).
- **Progression du Déplacement sans armure** du Moine au-delà du niveau 5.
