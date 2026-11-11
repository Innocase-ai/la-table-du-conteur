# Consigne commune : écrire le contenu d'un lieu de la zone 1 (La Marche d'Ombrefiel)

Tu es un agent rédacteur de contenu (Haiku). Tout est en français. Racine du dépôt : `C:\Users\sebas\Documents\GitHub\D&D\crpg-llm`. Monde : `packages\mondes\marche-d-ombrefiel\`. Tu écris les **données de jeu d'UN lieu de niveau 2** (donné dans ton prompt) au format du moteur, sous forme de fichiers JSON (tableaux). D'autres agents écrivent les autres lieux **en parallèle** : n'écris **que tes fichiers** (`<dossier>/z1-<code du lieu>.json`).

## À lire d'abord, en entier, dans cet ordre

1. `packages\mondes\marche-d-ombrefiel\GUIDE-ZONE.md` (règles d'écriture d'une zone).
2. `packages\mondes\marche-d-ombrefiel\REGISTRE-Z1.md` : **contrat des ids, à respecter à la lettre**. Lis aussi sa section « Ajouts écrits avec l'auberge ».
3. `packages\mondes\marche-d-ombrefiel\BIBLE.md` : canon gelé (secret §1 et §2 « Qui sait quoi », §7 registre, §7 bis chaîne des indices, §9 monstres).
4. `packages\regles\src\monde\schemas.ts` : **le schéma qui fait foi** (`Pnj`, `Sujet`, `Tresor`, `Piege`, `Enigme`, `RencontreMonde`, `Objet`, `Fait`, `Condition`, `Effets`).
5. `docs\MONDES.md`, et au besoin `docs\COMBAT.md`.
6. Les skills `.claude\skills\creer-rencontres\SKILL.md`, `creer-pieges-tresors\SKILL.md`, `creer-personnages\SKILL.md`.
7. **Les fiches d'atlas de ton lieu** dans `packages\mondes\marche-d-ombrefiel\LIEUX.md` (section « Niveau 2 : <ton lieu> » et tous ses sous-lieux, **surtout les tableaux « Contenu prévu »**) : c'est le décor exact de chaque entité (où elle se trouve, quels jets).
8. **Le budget de contenu** et les décisions de zone : LIEUX.md, section « Budget de contenu » (lignes 100 à 140 environ).
9. **L'auberge, déjà écrite et validée par l'audit : ta référence de qualité et de forme** : `pnj\z1-auberge.json`, `rencontres\z1-auberge.json`, `tresors\z1-auberge.json`, `pieges\z1-auberge.json`, `enigmes\z1-auberge.json`, `objets\z1-auberge.json`, `faits\z1-auberge.json`, `quetes\z1-quetes.json`.
10. Exemples livrés d'un autre monde : `packages\mondes\port-sillage\{rencontres,tresors,pieges,objets}\`.
11. Le catalogue des monstres : `packages\donnees\srd\monstres\` (ids exacts : `bandit`, `eclaireur`, `combattant-gobelin`, `chef-gobelin`, `molosse`, `ours-brun`, `combattant-kobold`, `squelette`, `garde`, `mephite-vaporeux`…). **Les monstres suivent le catalogue SRD** (les blocs de stats de la source ne comptent pas).

## Matière (lecture seule), à renommer selon la table validée

Dossier d'origine : `C:\Users\sebas\Documents\GitHub\D&D\la-marche-d-ombrefiel\zones\zone-1-carrefour-aldric\` : `combats-et-rencontres.md`, `fiches-pnj-et-conteneurs.md`, `actions-interactives.md`, `rencontres-absurdes.md`, `liens-inter-zones.md`, `README.md`. **Applique la table de renommage** `docs\RENOMMAGE-MARCHE-D-OMBREFIEL.md` (Lathandre devient Aubéris, Poing d'Émeraude devient Garde d'Émeraude, Cormyr devient Aurevaux, le marchand et la veuve s'appellent **Aldwin** et **Martha**, jamais Aldous, etc.) : **aucun nom de l'ancienne table ne doit apparaître**. Tu n'inventes **ni secret, ni nom propre, ni lieu, ni fait central** hors du canon et des fiches d'atlas.

## Ce que tu écris (selon ce que ton lieu prévoit dans le budget et les tableaux « Contenu prévu »)

- `rencontres\z1-<lieu>.json` : chaque rencontre du REGISTRE-Z1 pour ton lieu. Champs : `id`, `nom`, `type` (combat / social), `lieu` (id exact du sous-lieu), `difficulte`, `intro` (**70 à 110 mots**, ce que lit le joueur, riche et concret), `monstres` (profils SRD exacts), `alternatives` (chacune : `id`, `nom` (ce que dit le joueur), `jet` {competence, dd}, `resume` **50 à 80 mots** côté joueur, `effets`, `echec` (prix de l'échec), `echecResout`), `butin` (`depouilles` true pour un vrai combat, false pour un duel ou une rixe), `effetsVictoire`. Pas de carte tactique.
- `tresors\z1-<lieu>.json` : les trésors du REGISTRE-Z1 pour ton lieu (contenant, description, contenu, accès : un seul DD de verrou ou `cache` avec compétence et DD).
- `pieges\z1-<lieu>.json` : les pièges de ton lieu (voir `pieges\z1-auberge.json` pour la forme : détection, désarmement, déclenchement, sauvegarde, dégâts).
- `enigmes\z1-<lieu>.json` : s'il y en a une (seule l'auberge en a une dans la zone 1 : en général, rien pour toi).
- `pnj\z1-<lieu>.json` : les PNJ avec fiche de ton lieu (selon le budget). Même forme que `pnj\z1-auberge.json` : `sujets` (champ `question` : 3 à 12 mots, au vouvoiement ; champ `reponse` **75 à 115 mots**, discours direct, un détail concret, dans la voix du PNJ), `salutations` (`neutre`, `amical`, `hostile`, `variantes` vide), `secrets`, `presences`.
- `objets\z1-<lieu>.json` : les objets propres au monde que tes fiches placent, **sauf** ceux qui existent déjà (voir ci-dessous). Chaque objet : `id`, `nom`, `categorie`, `rarete`, `valeurPo`, `resume`, `lore` (25 à 60 mots, ce que lit le joueur, sans secret), `visuel`.
- `faits\z1-<lieu>.json` : les faits nouveaux dont tu as besoin. **Préfixe tes ids neufs par `f-ald-<code du lieu>-…`** pour ne jamais entrer en collision avec un autre agent. Chaque fait : `texte` (vérité factuelle à plat), `categorie`, `importance`, `fiable` (`false` pour une rumeur fausse).

## Déjà écrit : à CITER, jamais à redéfinir

- Objets (définis dans `objets\z1-auberge.json`) : `ald-o-mousse-de-saule` (**une seule pièce** « trois doses »), `ald-o-luth-de-finbar`, `ald-o-alliance-d-aldwin`, `flacon-de-toxine-x44` (zone 2, hors de ta zone), `echantillon-de-fonte-friable`, `ordre-de-keldan`, `chope-inepuisable`, `ald-o-carnet-de-silas`, `ald-o-pioches-du-lion`, `ald-o-sifflet-d-argent`.
- Faits (dans `faits\z1-auberge.json`) : `f-fer-sabote-a-la-source`, `f-peages-du-lion`, `f-griffe-noire-camp-foret`, `f-ald-keldan-embusque-le-porche`, `f-ald-mot-de-passe-de-la-griffe`, `f-ald-marchand-mort-sur-la-route`, `f-ald-kobolds-ont-vole-le-luth`, `f-ald-fonte-friable`, `f-ald-aldwin-parti-avec-la-farine`, `f-ald-convoi-de-minerai-assailli`, etc. Les faits du REGISTRE-Z1 non encore écrits (`f-reactifs-vers-puits-4`, `f-ald-spatha-immunisee`) sont à créer par **le lieu qui les révèle** (carrière et tertre).
- Quêtes (dans `quetes\z1-quetes.json`) : `q-la-securite-du-relais`, `q-la-prime-sur-demi-dent`, `q-le-cor-du-moulin`, `q-baume-de-l-aube`, `q-le-luth-de-finbar`, `q-le-testament-du-chariot`, `q-l-ombre-de-la-griffe`, etc. **Ne crée aucune quête** : les drapeaux ci-dessous les font avancer ; lis le fichier pour ne rien contredire.
- Drapeaux **que tes entités doivent poser** (le validateur signale ceux qui sont lus et jamais posés) : `z1-pont-libere` (embuscade du pont, par une victoire **ou** une alternative qui la dénoue), `z1-cor-reduit-au-silence` (moulin, plateforme du cor), `z1-demi-dent-tue` et `z1-demi-dent-epargne` (carrière), `z1-or-rendu` et `z1-or-garde` (chariot d'Aldwin : rendre l'or à Martha ou le garder ; l'alliance est un objet distinct), `z1-rite-du-tombeau` (tertre), `z1-luth-rendu` est posé par Finbar (pas par toi). Le **mot de passe de la Griffe** (« La Serre ne plie point ») s'obtient en capturant et intimidant Silas (drapeau `z1-silas-capture`, fait `f-ald-mot-de-passe-de-la-griffe`) : une alternative peut l'exiger en condition (`{ "flag": "z1-silas-capture" }`), jamais l'offrir gratuitement.
- Les **dilemmes** (écho, jauge de Voie) seront écrits plus tard par Claude : tes rencontres `ald-r-chariot-d-aldwin` et `ald-r-reddition-de-demi-dent` écrivent seulement les alternatives (chacune pose son drapeau et son effet immédiat), pas de module `dilemmes`.
- **Objets de quête à placer** (un seul endroit de production par objet) : `ald-o-mousse-de-saule` dans les vasières du pont (trésor à créer : id `ald-t-mousse-des-vasieres`, contenant `cache`, Survie ou Perception, lieu `ald-pont-vasieres` : **seul ajout d'id autorisé au registre**, à signaler) ; `ald-o-alliance-d-aldwin` dans `ald-t-coffret-d-aldwin`, avec l'or de la ferme et la `culotte-a-rubans` ; `ald-o-luth-de-finbar` dans l'antre de la combe ou dans `ald-t-pot-des-kobolds` (selon la fiche) ; `echantillon-de-fonte-friable` est déjà donné par Torben.

## Règles de qualité (leçons de nos vérifications : à respecter)

- Voix distinctes ; humour cynique et truculent mais le danger reste réel ; **aucun nom ni terme genré pour désigner le groupe** (« vous », pas « messieurs »).
- **Aucune mécanique de jeu** (DD, PV, XP, « jet ») dans un texte lu par le joueur (`intro`, `resume` d'alternative, `reponse`, `lore`, `description` de trésor) : les DD vont dans les champs `jet`. L'arme ébréchée est une règle de module non écrite : ne la mets pas dans une mécanique.
- **Chaque jet a un `echec`** (prix de l'échec, un jet raté ne bloque jamais).
- Les `condition` d'objet sont de la forme `{ "objet": "<id>" }` (pas de quantité). L'effet `pieces` est un entier en po. Une alternative qui coûte de l'argent porte une `condition` `{ "pieces": { "min": N } }`.
- **Aucun secret du MJ dévoilé trop tôt** : un sujet sans condition ni jet ne révèle que du public (BIBLE §2).
- Les trésors sont rattachés au **lieu le plus précis** (id de sous-lieu). Les monstres sont des profils SRD du catalogue.
- Des ids de lieu exacts (`ald-…`, voir `lieux\z1-carrefour-d-aldric.json`).
- Pas de `quetes\`, pas de `dilemmes\`, pas de `lieux\` : **tu n'y touches pas**.

## Vérification

Lance `pnpm monde valider marche-d-ombrefiel` depuis la racine du dépôt (lecture seule) et **corrige toutes les erreurs de tes fichiers** (JSON invalide, champs manquants, profils de monstres inconnus, références à des faits ou objets inconnus). **Ignore** les erreurs qui viennent des fichiers d'autres agents écrits en parallèle (un fait ou objet qu'un autre lieu doit créer). Compte les mots : `intro` 70 à 110, `resume` d'alternative 50 à 80, `reponse` 75 à 115. Ne touche à aucun autre fichier que les tiens. Pas de git.

## Rapport final (court)

Ce que tu as écrit (ids par fichier), les choix où tu as dû trancher (et pourquoi), les ids neufs dont tu as eu besoin, les limites du moteur rencontrées, ce que tu n'as pas pu faire.
