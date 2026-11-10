---
name: conteur
description: Modifier, régler ou vérifier le conteur (IA) de « La Table du Conteur » : ses consignes, ses outils, son coût, son modèle (OpenRouter, Claude Haiku 5.5), le relais du serveur, la saisie libre de l'écran d'aventure. À utiliser dès qu'on touche aux récits du conteur, au prompt, à une commande jouable par l'IA, au coût d'un tour ou à la clé d'API — et avant de dire qu'un changement du conteur est bon : un récit se juge sur de vrais tours, pas sur les tests.
---

# Le conteur (IA)

Principe du projet : **le LLM propose, le moteur décide.** Le conteur raconte et appelle des outils ; chaque outil est une commande du moteur (`moteur.executer`), donc les règles, les dés et les refus restent ceux du jeu. Il ne change jamais la partie lui-même.

## Où est quoi

- `packages/regles/src/conteur/` : `contexte.ts` (le prompt : règles du conteur, fiche de tour, comptes rendus des outils), `outils.ts` (les commandes devenues outils ; `COMMANDES_HORS_CONTEUR`), `tour.ts` (`jouerTour` : la boucle), `openrouter.ts` (l'appel, le coût, les erreurs), `schema-json.ts` (Zod → JSON Schema).
- `packages/regles/src/modules/conteur.ts` : les commandes `saisie` et `raconter` (le journal du joueur et du conteur).
- `apps/jeu/serveur-conteur.ts` : le **relais** du serveur de développement ; il garde la clé OpenRouter (`.env`), n'accepte que le modèle du conteur et coupe à 0,50 $ par session (`CONTEUR_PLAFOND_USD`). La clé n'est jamais dans le navigateur ni dans le chat.
- `apps/jeu/src/aventure/EcranAventure.tsx` + `conteur.ts` : la saisie libre, le récit, les suggestions, le compteur.
- `pnpm conteur [monde] --go --essai "texte" "texte"…` : joue dans le terminal avec le vrai modèle (sans `--go` : simulation, aucun appel).

## Quand tu changes le conteur

1. **Tests** : `pnpm test` (`tests/conteur.test.ts` : modèle scripté, outils, refus, erreurs, mémoire, appel simulé). Ils prouvent la mécanique, pas la qualité.
2. **Un essai réel** avec `pnpm conteur --go --essai …` : la batterie type (≈ 0,015 $) : un déplacement, une parole libre à un PNJ (« je lui demande s'il a vu… »), « combien d'or avons-nous ? », un PNJ absent, un sujet de quête, une question de règles, une fouille puis une refouille, une nuit, « que savons-nous ? ». Un tour coûte ≈ 0,0015 $ : ne t'en prive pas, mais garde un plafond (`--plafond`). **Lis les récits** comme un joueur.
3. **Ce qu'on cherche dans un récit** (défauts déjà vus) : une trouvaille inventée (un objet, un passage, un indice que le moteur n'a pas donné) ; la réponse d'un PNJ redite alors que le texte de l'auteur est déjà affiché ; une réplique de PNJ qui donne un ordre ou une information ; un secret révélé trop tôt (DD, solution d'énigme, vérité d'une rumeur) ; plus de 120 mots ; une question posée au joueur ; **un mot des coulisses** (« le moteur refuse… », « règles du jeu », « outil », « arbitre » : jamais, tout refus se raconte dans la fiction ; règle 9 du prompt, garde-fou `MACHINE` dans `tour.ts` qui fait réécrire le récit une fois).
4. **Corriger par les consignes** (`promptSysteme`, règles numérotées) ou par ce que le moteur rend au conteur (`evenementsEnTexte`, `ficheDeTour`), puis rejouer le même essai.
5. Dans l'écran : un tour réel dans le navigateur (le relais doit tourner : redémarre le serveur après avoir touché `vite.config.ts` ou `serveur-conteur.ts`). Sauvegarde du joueur : copie avant, remets après (voir le skill `enigmes`).

## Ce que reçoit le conteur (à tenir à jour)

- Préfixe en cache : rôle, 13 règles (dont 9 : aucun mot des coulisses ; 10 : trier la demande ; 11 : cohérence ; 13 : le monde se souvient du groupe, chacun ne sait que ce qu'il a pu savoir), `monde.json`, la bible.
- Fiche de tour (`ficheDeTour`) : lieu, heure et moment, sorties, **portraits des PNJ présents** (voix, traits, désir, peur, déjà dit, sujets ouverts avec les faits qu’ils révèlent, faits révélables marqués « aucun sujet écrit ne le dit » quand seule la parole vérifiée peut les donner ; jamais les secrets), conversation, objets, pièges, énigmes, jauges ; **« Ce que le groupe sait et a fait »** (quêtes, faits appris, choix, disparus) ; le groupe ; derniers événements raccourcis.
- **Mémoire du groupe** (`conteur/memoire.ts`, `docs/M4-CONTEUR.md` §16) : section « Ce que le groupe a vécu » (lieux, rencontres et issue, personnes, compagnons, réputations ; 1 200 caractères au plus) et, par PNJ présent, « Ce qu'il sait du groupe » (paroles, témoin, faction). Calculée par le moteur d'après `etat.exploration`, jamais par un LLM.
- Mémoire : `memoireDuJournal` (12 échanges par défaut, tirés du journal sauvegardé).
- **Savoir des PNJ** (`savoirs/`, skill `creer-personnages`) : l'outil `repondreEnPersonnage` (réplique + ids utilisés + faits révélés) est **vérifié par le jeu** ; ne jamais le contourner dans le prompt. Les essais réels se préparent avec `!lieu`, `!attitude`, `!fait`, `!fuite` dans `--essai`.

## Règles à garder

- **La liste des outils est la même à chaque tour** (c'est elle, avec le préfixe, qui est mise en cache : ≈ 0,01 $ le million de tokens relus au lieu de 0,10 $). Ne la filtre pas par scène : le moteur refuse ce qui est impossible, avec la raison.
- Une commande ajoutée au jeu devient un outil du conteur **automatiquement** : décris-la pour un modèle ; sinon `COMMANDES_HORS_CONTEUR`.
- Une panne du service avant tout outil ne change rien (le joueur réécrit) ; après un outil, on garde ce que les règles ont appliqué.
- **Coût** : mesure-le (`usage.cout` de chaque tour). Haiku 5.5 ≈ 0,0015 $ par tour ; si un changement le double, cherche pourquoi (outils en plus, fiche de tour trop longue, cache cassé : `cache` à 0 dans le compte rendu du tour).
- **Longueur de sortie** : `max_tokens` vaut 1200 (client et défaut du relais, plafond 1500). À 700, Haiku 5.5 coupait ses récits ou revenait vide ; si « produits » vaut exactement la limite dans un compte rendu, la réponse est tronquée.
- **Garde-fous de récit** (`defautDeRecit` : coulisses, parole de PNJ sans l’outil, secret recopié) : ils doivent aussi s’appliquer quand le récit arrive avec `proposer_actions`, qui est le cas normal ; les actions proposées sont filtrées par les mots tabou.
- Ne dépense pas sans que l'utilisateur l'ait demandé : les essais réels d'un conteur qu'il a demandé sont couverts, pas une comparaison de plusieurs modèles ni des centaines de tours.
- Jamais de clé dans un fichier versionné, dans un message ou dans le navigateur.
