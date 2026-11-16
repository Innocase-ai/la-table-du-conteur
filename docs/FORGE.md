# La Forge d'Histoires → un monde brouillon

La **Forge d'Histoires** (`RPGMakerStory/index.html`, à la racine du dossier D&D, hors dépôt ; copie de référence dans `apps/atelier/public/forge/index.html`) est un éditeur visuel autonome, dans le navigateur : on y glisse des lieux, des PNJ, des contenants, des objets et des quêtes, on les imbrique (village > bâtiment > pièce > contenant > objet) et on les relie (donne la quête, se termine à, requiert, garde, vend…). Elle sert à **concevoir et faire valider** un lieu de départ dense avant d'écrire un seul fichier (cap du 15/11/2026, `docs/PRD-SAGA.md`, fiches F1 à F4).

`pnpm monde importer-forge` transforme sa sauvegarde (`.forge.json`, bouton « Sauver ») en **nouveau monde en brouillon**.

```bash
pnpm monde importer-forge chemin/vers/histoire.forge.json mon-monde [--niveaux 1-2] [--heures 1]
pnpm monde valider mon-monde
```

- Il ne crée qu'un **nouveau** monde (refus si l'identifiant existe), après avoir tout converti : aucun dossier à moitié rempli. Le moteur n'est pas touché.
- Fichiers écrits : `monde.json` (statut `brouillon`), `lieux/forge-lieux.json`, `pnj/forge-pnj.json`, `objets/`, `tresors/`, `pieges/`, `rencontres/`, `quetes/`, `evenements/`, `fins/`, plus `BIBLE.md`, `GUIDE-ZONE.md`, `canon.json`, `conception.forge.json` (copie de la source) et **`RAPPORT-FORGE.md`**.
- Le rapport liste ce qui est deviné, écarté ou à écrire, et la correspondance **référence de la Forge (L1, P3…) → identifiant du monde**.
- Le squelette est **jouable de bout en bout** (test : le joueur automatique `pnpm monde parcours` atteint la fin, y compris avec verrou, cache et piège) ; tout ce qui n'est pas de la mécanique est un texte « À écrire : … » à remplacer.

## Dans l'atelier

`pnpm atelier`, puis **http://localhost:5180/forge/** (lien « Forge ↗ » dans l'en-tête de l'atelier). La Forge s'y ouvre comme page à part ; son bouton **🏗 Créer le monde** envoie la conception à `POST /api/atelier/forge-importer` (`apps/atelier/forge.ts`, même convertisseur que la commande), puis propose d'ouvrir le monde dans l'atelier (vue Santé : « Aucune erreur : le monde est jouable » sur l'exemple). Un identifiant déjà pris est refusé (409), jamais d'écrasement.

- **La copie du dépôt est la référence.** `RPGMakerStory/index.html` (hors dépôt) n'a ni le bouton, ni les champs ci-dessous ; toute évolution de la Forge se fait dans `apps/atelier/public/forge/index.html`. Le brouillon de la Forge (localStorage) est propre à l'origine : celui de `localhost:5180` n'est pas celui d'un fichier ouvert à la main (utiliser Sauver / Ouvrir pour le déplacer).
- Ouverte hors de l'atelier (fichier local), la Forge fonctionne comme avant ; seuls « Créer le monde » et « Voir un monde » disent qu'il faut passer par l'atelier.
- Le serveur de l'atelier est relancé après toute modification de `serveur-mondes.ts` (piège connu).

## Ce que la Forge dit maintenant (F1 à F4 du PRD-SAGA)

- **Contenants** : verrou (DD), caché (DD), piégé (DD pour le trouver, DD pour le désarmer, dégâts « 2d6 poison »). Repères sur la carte : 🔒 verrou, 👁 caché, ⚠ piège.
- **Objets** : rareté (commun à légendaire) et case « unique » ; repères ◆ et ✦.
- **Histoire** : niveau du groupe au départ et à la fin (fiche de l'histoire).
- **Adversaires et monstres** : profil du SRD (id, ex. `goule`) en plus du danger.
- **Quêtes** : type (tuer, trouver, apporter, libérer ; « auto » le devine d'après les liens « requiert »), avec le destinataire d'un objet à apporter ou le captif à libérer.
- **Conseils de la recette** (indicatifs, jamais bloquants) : 3 à 8 quêtes ; chaque pièce a quelque chose à faire (couches : PNJ, contenant, obstacle, adversaire, service, objet) ; butin en rapport avec l'obstacle (contenant de 50 po ou plus sans obstacle ; obstacle de DD 15 ou plus pour rien, sauf objet de quête ou unique) ; raretés compatibles avec le niveau (rare dès le niveau 3, légendaire dès le niveau 5, sauf unique) ; 1 à 3 uniques rattachés à la quête principale ou au boss ; chaque quête a de quoi se jouer selon son type.
- **Le convertisseur les lit** : accès du trésor (`verrou`, `cache`, `piege` + une fiche de piège, DD par défaut 13 signalé), rareté de l'objet, niveaux, profil de la rencontre ; un **adversaire humanoïde** reçoit une alternative « Négocier » (Persuasion, DD 12, 15 ou 18 selon la difficulté, texte et effets à écrire) et l'étape « vaincre » s'accomplit aussi par elle ; **apporter** = étape de remise + sujet du destinataire qui retire l'objet ; **libérer** = aller au captif, vaincre ses gardiens, sujet « délivrer » du captif ; retour au donneur sauf quand il est le destinataire. Les façons de conclure (fouiller, crocheter, désamorcer, combattre) viennent des obstacles et des gardiens des contenants ; énigmes et conversation comme issue de quête ne sont pas gérées.

## Export IA : le brief des agents d'écriture

Le bouton **Export IA** donne le plan (lieux, PNJ, contenants avec obstacles, objets avec rareté, quêtes avec type) et une **consigne de rédaction** (`CONSIGNE_REDACTION`, dans la Forge) : plan validé, on n'invente rien ; règles de style de `docs/ECRIRE-UNE-HISTOIRE.md` ; longueurs (arrivée 130 à 170 mots, réponse de PNJ 75 à 115, rencontre 70 à 110) ; interdits (mécanique, secrets) ; quoi écrire par id ; sortie en Markdown par id ; si l'agent travaille dans le dépôt, remplacer les « À écrire » du monde brouillon puis lancer `pnpm monde valider`. « Copier Prompt + JSON » le met dans le presse-papier. Les textes sont écrits par les agents Haiku, relus et arbitrés par Claude (décision du projet).

## Voir un monde existant (lecture seule)

Bouton **🔭 Voir un monde** : charge un monde de l'atelier sur le canevas (`GET /api/atelier/forge-exporter/<id>`, `outils/monde/exporter-forge.ts`). **Rien n'est écrit dans le monde** ; la conception actuelle est remplacée après confirmation (la sauvegarder d'abord). C'est une vue avec perte : régions et routes (leurs lieux passent au premier niveau), rencontres sociales, énigmes, dilemmes, événements, jauges, factions et fins ne sont pas représentés ; les boutiques sont limitées à 12 articles ; les lieux sont disposés automatiquement. Sur La Dîme des Roseaux : 184 éléments et 68 liens, tous lisibles par la Forge. « Créer le monde » fabrique toujours un NOUVEAU monde : il ne remet jamais une vue dans le monde d'origine.

## Correspondance

| Forge | Monde |
|---|---|
| (racine) | un lieu `region` au nom de l'histoire, qui réunit les lieux de plus haut niveau ; le monde démarre au premier village |
| village, maison, taverne, sanctuaire, forêt, grotte, ruines, lieu de quête | `village`, `batiment`, `lieu-dit`, `grotte`, `ruine` ; un lieu dans un bâtiment devient une `salle` ; la taverne : services `auberge`, `repas` et `repos: sur` ; le sanctuaire : `soins` |
| lien « mène à » | `liens` de type `chemin` (double sens, `--heures`, 1 par défaut) |
| PNJ (quêteur, notable, marchand, prêtre, allié) | `Pnj` : 1re réplique → salutation, les suivantes → sujets ; marchand → `boutique` (liens « vend ») ; prêtre → service de soins |
| adversaire, monstre | une **rencontre** de combat : profil saisi, sinon trouvé dans le nom (« Goule des cryptes » → `goule`), sinon profil par défaut **à choisir** ; « Danger » → faible, modérée ou élevée ; déclenchée à l'entrée du lieu |
| coffre, armoire, cercueil, sac | `Tresor` (coffre, autre, sarcophage, sac) avec `acces` (verrou, cache, piège) ; objets contenus ; bourse → `pieces` ; lien « garde » → `gardien` |
| objets posés dans un lieu | un trésor « sol » par lieu ; ce que vend un marchand n'est pas posé par terre |
| objets | `Objet` du monde avec sa rareté ; une arme dont le nom ne contient pas d'arme du SRD reste « divers » (avis) |
| quête | `Quete` : étapes tirées des liens et du type de quête, puis **retour au donneur** ; le donneur la propose par un sujet, un lieu donneur par un événement d'entrée ; PX et pièces lus dans les champs de la Forge |
| quête principale | une fin « quête terminée » (épilogue à écrire) |

## Ce que la Forge ne sait pas dire (reste à la main)

Espèce, sexe, apparence et personnalité des PNJ (valeurs provisoires `humain`, `N`, `à définir`) ; récit d'arrivée, accroche et visuel des lieux ; indices visibles de richesse, effets du piège, clé d'un verrou ; images, voix, scènes ; énigmes et conversation comme façon de conclure une quête ; jauges, factions, dilemmes ; niveau des lieux.

## Code

`outils/monde/exporter-forge.ts` (monde vers Forge), `outils/monde/importer-forge.ts` (conversion pure `convertirForge`, écriture `ecrireMondeForge`), commande dans `outils/monde/cli.ts`, tests `importer-forge.test.ts` et `exporter-forge.test.ts` ; côté atelier `apps/atelier/forge.ts` (+ `forge.test.ts`), routes dans `serveur-mondes.ts` ; exemple de conception `outils/monde/fixtures/villambrune.forge.json` (l'histoire d'exemple de la Forge).

## Faire écrire les textes par Claude : le brief

« Créer le monde » écrit aussi **`BRIEF-ECRITURE.md`** dans le monde : le contexte, les règles d'écriture (`REGLES_ECRITURE` dans `importer-forge.ts`, mêmes longueurs que la consigne de l'Export IA : un test les compare), la méthode (agents Haiku, relecture, audit de cohérence, validation de l'utilisateur à chaque groupe, aucun commit sans accord), les points laissés à la main, et **l'inventaire de chaque champ « À écrire »** avec la fiche, le fichier et le chemin du champ (`sujets[1].reponse`).

Après la création, la modale propose **📋 Copier le message pour Claude** : une ligne à coller dans la conversation avec Claude (session du dépôt) ; il lit le brief et lance les agents. Un bouton ne peut pas écrire lui-même dans cette conversation : c'est la seule étape manuelle. La commande `pnpm monde importer-forge` affiche le même message.
