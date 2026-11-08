---
name: creer-personnages
description: Donner de la profondeur aux personnages (PNJ) d'un monde de « La Table du Conteur » : passé, liens, souvenirs, opinions, confidences qui se gagnent, savoir verrouillé par la confiance, conversations libres que le jeu vérifie. À utiliser quand l'utilisateur dit que l'histoire ou les conversations manquent de profondeur, de détails, de lore, qu'un PNJ « est plat », qu'il veut des personnages « comme dans Baldur's Gate », ou quand on écrit ou relit le dossier `savoirs/` d'un monde, le canon des personnages ou un passé de PNJ. Complète `creer-monde` (canon) et `creer-dilemmes` (choix).
---

# Donner de la profondeur aux personnages

Un PNJ n'est profond que s'il **sait beaucoup de choses concrètes et les dit selon la confiance**. Avec seulement des sujets écrits (un texte figé par question), il esquive dès que le joueur sort du cadre. Le module Savoirs (`packages/regles/src/modules/savoirs.ts`, format `monde/savoirs-donnees.ts`, doc `docs/MONDES.md` § « Le savoir des PNJ ») donne au LLM du jeu une fiche (passé, liens, souvenirs, confidences, faits connus) ; le jeu **vérifie chaque réplique** : un élément absent de la fiche, un fait ou une confidence verrouillés, un mot tabou la font refuser.

## La méthode (éprouvée sur Ysmène, le Prieur et Mère Sorel de la Citadelle)

1. **Le canon des personnages d'abord** (Claude, jamais un agent) : un document du monde (`CANON-PERSONNAGES.md`, modèle : `references/canon-personnages-modele.md`) qui fixe, pour chaque personnage écrit en profondeur, son origine, ses dates (« il y a N ans »), ses proches, sa blessure, ses manies, ses opinions, et les **liens réciproques** (la même histoire vue de chaque côté). C'est la seule source des détails : une fiche ne peut rien affirmer en dehors. Vérifier l'arithmétique des âges et la compatibilité avec la bible et les faits existants (premier piège : une date de canon qui contredit un fait déjà écrit).
2. **Choisir qui** : 10 à 12 personnages majeurs très riches plutôt que 40 minces ; les autres restent légers.
3. **Un agent Haiku par personnage** (brief : `references/brief-savoir.md`) qui écrit `savoirs/z8-<id>.json` : `passe` (80 à 150 mots), `liens` (3 à 5, réciproques), `couleur` (10 à 12 : souvenirs datés, manies sensorielles, opinions tranchées, anecdotes), `sait` (les faits du canon qu'il connaît, avec l'accès, un `evasif`, des `tabou`). Les faits et leurs accès sont **décidés par Claude** dans le brief.
4. **Verrouiller les confidences** : ce qui est intime (la blessure, un secret honteux, une dette) va dans `couleur` avec `acces: { attitudeMin }` et `evasif`, et **jamais** dans `passe` ni `liens` (champs libres). Les confidences se gagnent par couches (30, 45, 50…), comme les histoires des compagnons des grands jeux.
5. **Relecture de cohérence par un agent distinct** (un éditeur qui ne voit que le canon, la bible, les fiches `pnj/` et les faits) : contradictions, secrets qui fuient dans les champs libres, inventions hors canon, voix, réciprocité des liens, faits verrouillés trop bavards. Corriger ensuite (sur le pilote : onze points dont des incohérences déjà présentes dans les fiches `pnj/`).
6. **Valider** : `pnpm monde valider` (erreurs : PNJ ou fait inconnu, accès plus ouvert que le secret de la fiche de dialogue ; conseils : passé, liens, souvenirs, faits, confidence sans `evasif`, secret sans `tabou`).
7. **Essai réel** (`pnpm conteur <monde> --go --essai …`, ≈ 0,003 $ le tour ; `!lieu`, `!attitude <pnj> <n>`, `!fait`, `!fuite` préparent la scène gratuitement) : des questions libres sur la famille, le passé, un secret (à faible puis à forte confiance), un sujet inconnu (« aimez-vous les chats ? »). Vérifier que les confidences verrouillées sont esquivées et qu'elles s'ouvrent quand la confiance monte, que le PNJ n'invente rien, que la voix tient.

## Un compagnon qui voyage : interjections et quête personnelle
Pour un PNJ escorté (effet `escorte`), ajouter en plus de sa fiche : **10 à 16 interjections** (dossier `interjections/`, doc `docs/MONDES.md`) déclenchées par les lieux, les faits, les choix de dilemmes (`choix-<dilemme>-<option>`, une interjection par issue) et la jauge, avec des effets `attitude` pour l'approbation ; et **une quête personnelle en 3 étapes**, proposée par un sujet dont la condition est `attitudeMin` (modèle : Nolwen, `quetes/z9-nolwen.json`). Brief type : `references/brief-compagnon.md` (celui de Nolwen). Vérifier que chaque interjection colle au sens réel de l'issue du dilemme (relire ses options).

## Règles d'écriture (spécificité)
- Des noms propres, des dates, des chiffres, des gestes, des matières ; pas de « mystérieux » ou « ancien » sans détail.
- Chaque élément de `couleur` doit pouvoir nourrir une réplique de 1 à 3 phrases ; deux éléments ne disent pas la même chose.
- Aucun secret de la bible, aucun fait d'intrigue dans `passe`, `liens` ou une `couleur` libre.
- Un souvenir ne change rien à l'intrigue ; ce qui la change est un fait du canon (`faits/`), verrouillé dans `sait`.

## Des conversations riches (décision du 08/11/2026, à appliquer à tout PNJ d'Ombresang)
- **Réponses de 40 à 80 mots** dans la voix de la fiche (`personnalite.voix`), avec un détail concret (nom, chiffre, geste, souvenir) ; un PNJ de 5 réponses de 30 mots n'a pas de voix (avis « Dialogues » du validateur).
- **Questions en chaîne** : un sujet parent pose un drapeau `lr-d-<pnj>-<mot>` (dans ses `effets`), le sujet suivant le lit (`condition: { "flag": ... }`). Les suites sont `unique: true` pour que la liste visible reste courte (6 à 8 questions au départ ; touches 1 à 9). Une suite doit avoir un sens même si le joueur a sauté l'étape : relier sa condition à ce qui rend la question naturelle (un fait connu, un objet, le sujet qui l'introduit).
- **Questions sur le monde** : au moins 2 par PNJ, qui font découvrir le lieu, la sous-région ou la région (routes, métiers, légendes, la capitale vue de loin), chacune avec un fait nouveau (`faits/`, catégorie `lieu`, `histoire` ou `rumeur`, importance 1 ou 2, `fiable: false` si douteux). Un PNJ ne dit que ce qu'il peut savoir.
- **Rester cohérent** : Bible, atlas, niveau de révélation du chapitre (au prologue : jamais le Concile ni « les dieux vivent »), aucune invention qui crée une obligation dans un module gelé, jamais de secret hors de son verrou. Un même fait de monde dit par plusieurs PNJ garde un seul id.
- **Méthode** : rédacteurs Haiku sur des fichiers de propositions (un par groupe de PNJ), relecture et fusion par script avec contrôles (drapeaux lus et posés, `revele` inclus dans `savoir`), puis vérificateur et auditeur.

## Pièges connus
- Une scène de rencontre ouverte bloque la parole libre (« Une rencontre attend ») : le joueur la règle par ses boutons d'abord.
- Le LLM ne cite pas toujours l'élément ouvert qui répond à la question : le prompt (règle 10) lui demande de le chercher d'abord ; relire les essais.
- Le jeu vérifie les ids et les mots tabou, pas le sens : un petit détail de décor peut se glisser (« une valise de cordier »). Le canon et la relecture le limitent.
- Un fait déjà révélé par un sujet de la fiche `pnj/` sans condition ne doit pas être verrouillé plus haut dans `savoirs/` (deux mécanismes, un seul secret) : aligner les accès.
- **La relecture de cohérence est outillée** : l'atelier (onglet **Revue**, `canon.json` du monde) signale les mots tabou d'un secret dans le passé, les liens ou la couleur libre d'une fiche (la règle « aucun secret dans les champs libres » se vérifie), les noms propres qui n'apparaissent nulle part ailleurs (invention d'agent), les nom/âge/espèce qui contredisent le canon et les liens non réciproques. Ouvre-la après chaque série de fiches de savoir, avant le commit.
