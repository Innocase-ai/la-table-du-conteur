# Leçons du Val des Cendres

Défauts rencontrés en écrivant le premier monde, et leur remède. À relire avant d'intégrer.

## Pendant l'écriture
- **Identifiants avec accent ou majuscule** (`f-tanière`) : refusés par le schéma ; kebab-case ASCII. Le message d'erreur du chargeur nomme le fichier et le champ.
- **Compétence de recherche** : un trésor caché peut se trouver par perception, investigation, survie ou nature. Pour un autre test, il faut faire évoluer le schéma (pas le contourner).
- **Boutiques** : elles citent aussi les armes et armures du SRD par leur id (les agents ne le savent pas toujours : dis-le dans la mission).
- **Un fait que personne ne révèle** : avertissement. Soit un PNJ ou un lieu le révèle, soit un effet.
- **Lieux isolés** : chaque zone déclare un lien double sens vers le hub, sinon l'accessibilité dépend d'une autre zone.
- **Rencontres** : cartes avec au moins 6 `H` et autant de `m` que de monstres ; difficulté cohérente avec le budget de PX d'un groupe de 6.

## À l'intégration
- **Drapeau lu mais jamais posé** (le validateur l'avertit) : trouver quelle zone doit le poser (souvent une conséquence naturelle : une jauge, une mort, une entrée de lieu) et l'ajouter. Dans le Val : le Veilleur ne mourait jamais.
- **Quête à fins alternatives** : marque chaque étape finale `termine: true`. Sans cela, une étape sans suite qui n'est qu'une branche optionnelle termine la quête trop tôt, ou une quête ne se termine jamais. Une étape sans `termine` ne clôt la quête que si plus rien n'est actif.
- **Un même objet sous trois noms** (combustible : minerai, houille, huile de roche) : unifier ou assumer ; chaque nom doit avoir un rôle distinct.
- **Un objet obtenu légitimement qui déclenche une branche de « vol »** : prévoir une voie « don » pour chaque moyen légitime d'obtenir un objet de quête.
- **Un PNJ qu'on corrompt au lieu de le tuer** : les quêtes qui attendent sa mort ou son départ doivent aussi accepter les drapeaux de dissolution.
- **Doubles événements** sur un même palier de jauge (zone du hub et zone centrale) : un seul propriétaire par palier.
- **Fins jouables** : écris un test qui pose les drapeaux et objets du chemin de chaque fin et vérifie `e.fin`. C'est ce test qui a révélé le défaut des étapes finales.
- **Chapitre** : `chapitres[0].quetes` se remplit à la fin avec toutes les quêtes ; `statut: publie`.

## Gestion des agents
- Lance-les ensemble ; ils prennent 15 à 25 minutes chacun. Ne touche pas leurs fichiers pendant ce temps.
- Leurs rapports contiennent les ids qu'ils référencent hors de leur zone : vérifie-les un par un (le validateur le fait aussi).
- Un agent qui ajoute un PNJ ou un fait au canon (ex. une survivante) : accepte si cohérent, mais mets-le au registre ou à la bible pour la suite.
- Le catalogue d'objets et les monstres sont partagés : ne les modifie que pour **ajouter**.

## Images (après l'intégration)
Le texte des fiches devient directement le prompt d'image : ce qui est flou ou ambigu dans `visuel` / `apparence` sort faux à l'image.
- **Dire l'état des choses, pas seulement la chose** : « canaux de fonte » dans une forge a donné de la lave partout à la Haute-Forge ; il fallait « fonte **figée, froide, noire** ». Idem pour l'eau (gelée ou courante), le feu (éteint ou vif), la lumière (d'où elle vient).
- **Mots que le service refuse** (9 refus sur 255) : corps, cadavre, enfant (surtout près de métal ou de danger), brûlures sur la peau, silhouettes couchées. Si le MJ a besoin de ces mots, garde la fiche telle quelle et mets une version adoucie dans `packages/mondes/<id>/images.json` (`lieu-<id>`, `pnj-<id>`, `objet-<id>`, `monstre-<profil>`).
- **Espèces** : utilise les espèces du SRD (humain, nain, elfe, halfelin, gnome, tieffelin, orc, goliath, drakéide, gobelin, hobgobelin, ogre) ; elles sont traduites dans le prompt. Pour un être hors liste (armure animée, automate, fantôme), l'`apparence` doit dire **de quoi il est fait et quelle forme il a**, car le prompt ne dit plus que « être fantastique non humain ».
- **Âge** : écris-le sous la forme « 40 ans » ou « environ 40 ans » ; toute autre forme (« sans âge », « vieux ») n'est pas transmise.
- **Monstres** : chaque profil utilisé par une rencontre doit avoir une fiche `apparence` **en anglais** dans `packages/donnees/visuel/charte.json` (le test l'exige). Sans elle, « Bandit » est devenu un humanoïde-hyène. Un profil nouveau au SRD du projet demande aussi son image de combat (bestiaire) : `pnpm images bestiaire --go` puis `python3 outils/images/installer.py bestiaire`.
- **Plateau** : chaque rencontre de combat indique son ambiance de terrain (`terrain` : `foret`, `souterrain`, `caverne` ou `camp`). Un décor qui n'entre dans aucune (navire, neige, marais…) demande une ambiance nouvelle dans `packages/donnees/visuel/terrains.json` puis `pnpm images terrains --go`.
- **Lieux** : le prompt demande « sans personne ni créature », mais ce que le `visuel` nomme (gardes de fer, squelettes, un fantôme) apparaît quand même. N'y mets que les figures que tu veux voir.
- **Relire chaque lot à l'œil** : une image peut être belle et fausse. Fais des planches (12 images par planche, id en légende) pour tout relire vite.
- Budget : environ 0,01 $ l'image avec Klein ; un monde de 150 lieux ≈ 250 images ≈ 2,30 $.
- **Objets** : une image d'objet n'est pas obligatoire (le sac montre alors l'icône de sa catégorie, au cadre de sa rareté) ; fais celles des objets de quête, rares et très rares. Un objet qui se découvre en l'étudiant (`identification` : DD d'Arcanes) a besoin de `inconnu { nom, resume }` : c'est ce que le joueur voit avant ; son vrai `resume` et son `lore` ne se montrent qu'identifié.

## Exploration (ce que le moteur fait de tes données)
Le moteur d'exploration (docs/M4-CONTEUR.md § 10) applique tes données à la lettre ; écris-les en conséquence.
- **Un lieu enfant s'ouvre librement depuis son parent.** Pour qu'une salle soit secrète, verrouillée ou conditionnelle, déclare un lien entre le parent et elle (`cache`, `verrou`, `condition`) : c'est lui qui contrôle l'accès.
- **Perception ou Investigation ?** Au niveau 3, la perception passive du meilleur héros vaut souvent 15 à 16 (le rôdeur pré-tiré : 16) : tout ce qui se trouve à la Perception avec un DD inférieur ou égal est repéré **sans jet** en entrant. Un vrai secret demande l'Investigation (fouille active) ou un DD de 17 et plus.
- **Une fouille par lieu et par jour** : ne cache pas l'indice indispensable d'une quête derrière une seule fouille ratée ; prévois un autre chemin (un PNJ qui le sait, un second indice).
- **Contenant piégé** : il se déclenche quand on l'ouvre sans la clé, sauf s'il a été désarmé. Si une clé existe, place-la dans le monde.
- **Sujets de PNJ** : le conteur choisit le sujet d'après les mots du joueur ; des `mots` variés et concrets l'aident. Un secret sans `jet` ni `attitudeMin` se donne à la première demande.
- **Les textes sont lus tels quels par le joueur.** Pour garder le coût d'API bas, l'IA n'est appelée que pour la saisie libre, les vraies conversations et les moments forts ; le reste du temps, le jeu affiche directement les réponses des sujets de PNJ, les narrations des événements et des paliers, le déclenchement des pièges, l'intro des rencontres. Écris-les pour le joueur : phrases complètes, au présent, sans identifiant ni note technique (`drapeau`, `DD`, ids). Les notes pour le MJ vont dans `description`, `ramifications` ou `tactique`.
- **Ce que lit le joueur, champ par champ** (mode « livre », sans IA) : d'un lieu, seulement `nom`, `resume` et `ambiance` (la `description` est pour le MJ) ; les `reponse` des sujets de PNJ et leurs `salutations` ; `narration` des événements et paliers de jauge ; `declenchement` des pièges ; `intro` et `alternatives` (nom, résumé) des rencontres ; `enonce` et `indices` des énigmes ; `nom` et `description` des trésors ; les faits **fiables** (`texte`), affichés « Vous apprenez : … ». Le texte d'un fait non fiable (rumeur) n'est jamais montré : la rumeur passe par la bouche d'un PNJ.
- **Une rencontre sans `carte`** se joue sur une clairière par défaut (16 × 10) : dessine la carte des combats importants. Son ambiance de plateau vient de `terrain`, sinon du type du lieu (grotte → caverne, donjon/salle/bâtiment → souterrain, camp → camp, sinon forêt).

## Voix des scènes (après accord de l'utilisateur)
- **Un plan, deux ou trois phrases** : la voix lit ce que le joueur voit écrit. Pas de parenthèse, d'abréviation ni de chiffre romain : écris « deux siècles », pas « 2 s. ».
- **Relire les transcriptions** : `pnpm voix generer <id> --go` refuse déjà une lecture infidèle ou trop longue (ce que fait le modèle quand on le laisse « conter » : il invente une suite). Si un plan échoue trois fois, c'est souvent le texte : une phrase qui appelle une suite (« Que faire ? ») ou un nom difficile. Retouche le texte, puis relance seulement ce plan (supprime son MP3, `--scene <id>`).
- **Le prologue est un film** : il ouvre l'histoire comme une bande-annonce. Un plan par idée (le passé, la menace, ce qui la retient, ce qui change maintenant, pourquoi le groupe est là, une dernière phrase qui donne envie), le dernier plan sur le lieu de départ. Le secret de la bible n'y entre pas.
- **Retoucher un texte** : `pnpm voix generer <id> --go` refait seul les plans dont le texte a changé. Relance ensuite `pnpm jeu`, qui ne voit pas les nouveaux fichiers.
- Budget : environ 0,001 $ par plan avec `gpt-audio-mini` ; un monde de 25 plans ≈ 0,03 $.
