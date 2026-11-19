# Fiches de décision du lot 2 (volet « dettes du lot 1 ») — 19/11/2026

**Statut au 19/11/2026 : L2-D1, L2-D2 et L2-D3 appliqués avec les recommandations ci-dessous (l'utilisateur m'a laissé trancher : « fais les bons choix, le but est de donner du plaisir aux joueurs ») ; L2-D4 : option 1, rien à faire.** Les fiches gardent leurs faits et leurs options ; chacune est suivie, dans le journal du 19/11/2026, de ce qui a été changé. Variante appliquée pour L2-D3 : le DD passe à 18 sur le lien **et** sur le fait `f-passage-soldats-vers-n3` (même cachette, même valeur).

Rappel : `packages/mondes/<histoire>/revue.json` accepte aujourd'hui ces points avec leur raison ; chaque décision dit aussi quoi y retirer.

---

## L2-D1 — Le secret d'Elara (et de frère Balthazar) : D7 du lot 1

- **Constat.** Le fait `f-fausse-tombe-leurre` (« les trois cercueils dorés sont un leurre pour retenir les pilleurs loin du véritable escalier ») est un secret du canon avec `autorise: []`, et deux PNJ le détiennent : **Elara** (secret à jet d'Histoire DD 12, et fiche de savoir à confiance 40) et **frère Balthazar** (fiche de savoir à confiance 40). Le contrôle « fait détenu hors du canon » les signale tous deux.
- **Le fait n'est pas gardé que par eux** : il a sept sources (le lieu `n1-faux-temple`, deux trésors, un examen, Elara, Balthazar…). L'étape « percer le faux temple » de la quête principale accepte plusieurs couples de faits (`f-eau-sous-l-idole` + `f-fausse-tombe-leurre`, ou `f-vapeur-des-sepulcres`, etc.) : retirer le secret d'Elara **ne bloque aucune étape**.
- **Options.**
  1. **Autoriser** : ajouter `pnj:elara-herboriste` et `pnj:frere-balthazar` à `autorise` de `secret-fausse-tombe-leurre` dans `canon.json`. Elara et Balthazar donnent alors un chemin d'indice au Fort, sans entrer dans la tombe.
  2. **Retirer** le secret d'Elara et la ligne de Balthazar : l'indice ne se trouve plus que dans la tombe.
- **Recommandation : option 1.** C'est un indice de lore ordinaire, déjà trouvable en jeu par cinq autres sources ; Elara (apothicaire de curiosités) et Balthazar (chroniqueur du Val) sont des détenteurs naturels, et leur accès est déjà gardé par la confiance et un jet. Ne pas le garder au Fort priverait le joueur qui cherche d'abord au Fort d'une piste, contre la règle « le joueur cherche, parle, se bat ». Le prix : l'autorisation relâche la surveillance des mots tabou dans leurs fiches (la revue ne trouve aujourd'hui aucune fuite chez eux).
- **Ce que ça déclenche.** Option 1 : une modification de `canon.json` (2 lignes) ; retirer les 2 entrées `revue.fait-non-autorise` de `revue.json` de la Tombe (et leurs raisons). Option 2 : modifier `pnj/pnj.json` (secret d'Elara) et `savoirs/` (Balthazar), puis refaire `pnpm monde verifier` et relire les sujets d'Elara. Dans les deux cas : `pnpm monde verifier tombe-des-rois-serpents` doit rester « Rien ne bloque ».

---

## L2-D2 — « Fait détenu hors du canon » : Marche (3 PNJ) et Dîme (7 PNJ)

- **Constat.** Le contrôle compare ce que le PNJ détient (ses `secrets` ou sa fiche de savoir) à `autorise` du secret dans `canon.json`. Dans ces deux histoires, **le canon est incomplet, pas les fiches** : chaque détenteur a un accès gardé par l'auteur (jet, confiance, condition, prix), c'est-à-dire voulu.

  | Histoire | PNJ | Fait (secret du canon) | Accès voulu par la fiche |
  |---|---|---|---|
  | Marche | `silas-l-epieur` | `f-ald-mot-de-passe-de-la-griffe` | après `z1-silas-capture` |
  | Marche | `bregor-le-borgne` | `f-ald-bregor-sergent-de-vane` | confiance 60 |
  | Marche | `demi-dent` | `f-ald-demi-dent-or-etranger` | après `z1-demi-dent-epargne` |
  | Dîme | `pimmo-rouelente` | `f-pacte-du-meunier` | confiance 30 |
  | Dîme | `aveline-ker` | `f-colin-prisonnier` | confiance 20 |
  | Dîme | `marin` | `f-but-de-varg` | jet de Persuasion DD 11 et 10 po |
  | Dîme | `nyx`, `varg`, `grum`, `bram-coeur-de-tourbe` | `f-but-de-varg` | jet DD 14, ou confiance 20 à 25 |

  Pour `f-but-de-varg` le canon dit `autorise: []` alors que cinq PNJ et leurs fiches le portent. Pour `f-pacte-du-meunier` et `f-colin-prisonnier`, la liste existe mais oublie Pimmo et Aveline.
- **Options.** (1) **Autoriser** : ajouter les PNJ à `autorise` (`savoirs:<pnj>`, la convention du canon). (2) **Retirer** le fait de la fiche du PNJ. (3) Laisser accepté.
- **Recommandation : option 1 pour les dix PNJ.** Aucun n'a une fiche qui semble un oubli de l'auteur : ce sont des accès gardés, écrits exprès (ils font la richesse des conversations, voir la règle « au moins 4 sujets par PNJ »). Retirer des faits casserait des chemins d'indice testés (le parcours de la Dîme passe par `f-pacte-du-meunier`). Avant d'écrire, relancer `pnpm monde verifier` : l'autorisation ne doit faire apparaître aucune fuite (`revue.secret`) ; sinon un mot tabou est à corriger, pas à autoriser.
- **Ce que ça déclenche.** Modifier `canon.json` de la Marche (3 lignes) et de la Dîme (7 PNJ, 3 secrets) ; retirer les 3 + 7 entrées `revue.fait-non-autorise` de leurs `revue.json`. Ces deux histoires sont des références publiées non proposées au joueur : risque faible.

---

## L2-D3 — Le second raccourci de la Tombe : `n2-soldats-d-argile` ↔ `n3-hall-du-basilic`

- **Constat (mesuré).** Passage caché à double sens, Perception DD 16, alors que la Perception passive du groupe conseillé de niveau 3 vaut 16 : il est **trouvé à l'arrivée dans la salle, sans jet**. Il relie le niveau 2 (niveau de groupe 3) au niveau 3 (niveau 4). L'entrée « normale » du niveau 3 est `n2-gouffre-et-effondrement` ↔ `n3-salle-ceremonie`, **verrouillée (DD 14)**. Les parcours automatiques des 4 fins longues **empruntent tous le raccourci** et ne visitent que 7 des 11 pièces du niveau 2.
- **Options.**
  1. **Relever le DD à 18** (au-dessus de la Perception passive 16 : il faut chercher, avec un jet). Vérifié en mémoire : l'avis du validateur disparaît et le parcours prouve toujours les 5 fins (4 112 états, 63 s). Mesure faite sur une copie en mémoire : le fichier n'est pas modifié.
  2. **Passage à sens unique** (du niveau 3 vers le niveau 2) : plus net, mais ferme la porte au groupe qui trouve le passage depuis le niveau 2 et supprime une récompense d'exploration.
  3. **Garder** : c'est un raccourci qu'on ne trouve qu'après avoir descendu et fouillé le niveau 2 ; le contrôle reste un avis.
- **Recommandation : option 1 (DD 18).** C'est le plus petit changement, il garde la récompense d'exploration (le joueur qui fouille la salle des soldats d'argile trouve le passage), et il fait passer le premier raccourci (celui du bivouac, déjà à sens unique) et celui-ci selon la même règle : un passage caché ne se découvre sans jet que s'il ne saute rien d'important.
- **Ce que ça déclenche.** Un nombre dans `lieux/z2-niveau2.json` (`cache.dd`, 16 → 18) ; plus d'avis « Passage caché » sur la Tombe ; refaire `pnpm monde verifier` (5 fins). Aucune modification de `revue.json` (cet avis n'y est pas accepté).

---

## L2-D4 — La Marche : suite de l'histoire (zone 2) absente

- **Constat.** Deux quêtes secondaires de la Marche ne peuvent pas être terminées dans l'histoire telle qu'elle est publiée, car leur objectif est dans la zone 2 (Sombreval), pas encore écrite : `q-l-echantillon-maudit` (Torben veut un `flacon-de-toxine-x44` « de Sombreval ») et `q-honneur-de-brise-roc` (Varek attend le drapeau `z2-davor-neutralise`). Le flacon n'est dans aucune pièce ; le drapeau n'est posé par personne. Les notes d'écriture de ces quêtes le disent (« sera posé quand cette zone sera écrite »). Trois avis étaient noyés dans le bilan ; ils sont acceptés dans `revue.json` avec cette raison (décision D1 du lot 1).
- **Options.**
  1. **Laisser accepté** jusqu'à l'écriture de la zone 2 : les deux quêtes restent proposées mais sans issue.
  2. **Masquer ces deux quêtes** tant que la zone 2 n'existe pas (retirer, ou conditionner par un drapeau jamais posé, les sujets qui les offrent) : le joueur ne prend pas une quête qu'il ne peut pas finir.
  3. **Écrire un minimum de zone 2** (un lieu, le flacon dans un trésor, un événement qui pose `z2-davor-neutralise`) : du contenu d'histoire à décider avec l'auteur.
- **Recommandation : option 1 pour le moment, option 2 si la Marche doit être de nouveau proposée au joueur avant la zone 2.** La Marche est aujourd'hui une référence publiée **non proposée** (cap du 15/11/2026) ; l'écrire ou la masquer maintenant n'apporte rien et inventerait de l'histoire. Si elle est un jour proposée seule, une quête sans issue est une promesse non tenue : à masquer.
- **Ce que ça déclenche.** Option 1 : rien (les trois acceptations restent). Option 2 : modifier les sujets d'offre dans `pnj/z1-auberge.json` (Torben, Varek), retirer les 3 entrées `objet.introuvable` / `flag.lu-jamais-pose` de `revue.json` seulement si les références disparaissent avec elles (les sujets de rendu lisent le flacon et le drapeau : à retirer aussi). Option 3 : un chantier d'écriture, avec les validations V1 à V8 de l'auteur.

---

## Ordre conseillé

1. **L2-D3** (un nombre, vérifié) puis **L2-D1** (deux lignes de canon) : deux petits changements, chacun suivi de `pnpm monde verifier tombe-des-rois-serpents`.
2. **L2-D2** (canon de la Marche et de la Dîme) : une relecture des dix PNJ avant d'autoriser.
3. **L2-D4** : ne rien faire tant que la Marche n'est pas proposée.

Une fois ces points traités, `revue.json` des trois histoires ne devrait plus porter que : la quête sautable de la Dîme (choix de conception) et, selon L2-D4, les trois défauts de la Marche.
