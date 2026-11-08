# SR 1.1 — Contenu en données (V6, lieu par lieu)

Les données sont des fichiers JSON sans champ de statut : ce suivi dit ce qui est validé. Ce qui est validé est gelé : toute modification passe par l'utilisateur.

| N° | Lieu | Fichiers | Statut |
| :-: | :--- | :--- | :--- |
| 1 | Village de Lame-Rousse | `faits`, `objets`, `pieges`, `tresors`, `rencontres`, `pnj` : `z1-village.json` | **validé le 08/11/2026, gelé** |
| 2 | Bastion du Pont-Viaduc | les mêmes, plus `enigmes` : `z2-bastion.json` | **validé le 08/11/2026, gelé** |
| 3 | Grotte des Rouilles | `faits`, `objets`, `pieges`, `tresors`, `rencontres`, `pnj` : `z3-grotte.json` | **validé le 08/11/2026, gelé** |
| 4 | Temple du Glaive Brisé | les mêmes, plus `enigmes` : `z4-temple.json` | **validé le 08/11/2026, gelé** |
| 5 | Forêt d'Acier | `faits`, `objets`, `pieges`, `tresors`, `rencontres` : `z5-foret.json` | **validé le 08/11/2026, gelé** |

## Conversations enrichies : validées le 08/11/2026 (gelées)

Les 11 PNJ de la vallée : réponses de 40 à 80 mots, 52 questions nouvelles (chaînes par drapeaux `lr-d-...`, questions sur le lieu, la vallée, la région), 19 faits nouveaux dans `faits/z7-dialogues.json`. Secrets, verrous, prix et texte du serment inchangés. Neuf sujets existants ont reçu un drapeau de déblocage supplémentaire.

## V7 : intrigue branchée, validée le 08/11/2026 (gelée)

Écrit en un bloc, à la demande de l'utilisateur, **validé et gelé** : `lieux/z0 à z5` (36 lieux), `quetes`, `jauges`, `evenements` et `rencontres/z6-intrigue.json`, `objets/z6-intrigue.json`, `monde.json` (chapitre du prologue, départ `lr-place`), `BIBLE.md` §7 (registre des identifiants).

Choix validés :
- La Fièvre de Fer monte d'un cran à chaque nuit de repos (absent du pitch) : quatre nuits mènent à la rupture ; la Reine fait gagner une nuit.
- Parlementer avec l'Ichor la fait aussi baisser d'un cran (absent du pitch).
- Ajouts au contenu gelé : sujets pour libérer Joran, le garder aux fers, libérer Aldric, forcer le poste, proposer son aide à Martha ; activation des quêtes par des sujets existants ; intro des hommes de la Baillie ; prime d'Élinor et réponse de Mira ajustées.
- Fin C : le viaduc est rouvert par les forgerons, sans la pièce du Temple.

Restent hors de ce bloc : images, voix et scènes narrées (dépense à annoncer), les 2 contrats de l'auberge, `chapitres[].quetes` et le passage à `publie` (V8), l'essai dans le jeu lui-même.

## Décisions de la Forêt

- Le sol du cratère est un piège libre (il part quand on ramasse l'éclat sans l'avoir repéré), pas un piège de passage.
- « Jeter de quoi manger » ne demande pas d'objet : le moteur ne voit pas les rations du sac d'un héros.
- La bourse du ferrailleur n'apparaît qu'une fois les loups tués ou détournés.
- En passant les lieux en JSON : poser `lr-cratere-vu` à l'arrivée au Menhir (Vorn en dépend) ; conditionner `lames-errantes` au foyer de Vorn encore allumé ; rattacher avec un verrou les faits secrets.

## Décisions du Temple

- La lame solaire ternie est une épée longue +1 (400 po).
- Ser Osbern dit son nom dans ses derniers mots, puis le PNJ passe à l'état « parti » : la voix se tait.
- Seul un mensonge ferme la voie du serment ; une Persuasion ratée ne ferme rien.
- Les dalles à lames sont un piège de passage.
- En passant les lieux en JSON : `maitre-d-armes` se rattache à l'arsenal avec `unique: false` et la condition « ni serment prêté, ni Maître vaincu » (sinon un duel perdu ferait perdre le treuil). Le journal se rattache aux cellules.
- À tester quand le monde se chargera : l'énigme `plaques-du-serment`.

## Décisions de la Grotte

- Corniche et poche d'acide sont des **pièges de passage** (`passage: true`, ajouté au moteur le 08/11/2026) : ils partent quand le groupe quitte le lieu sans les avoir trouvés.
- Gorm Meule annonce la disparition d'Ansel (sujet libre `apprenti`).
- Le leurre (minerai ou ferraille) n'est pas consommé : le minerai sert aussi à la fin C.
- À rattacher aux lieux avec un verrou, jamais en automatique : la Forge Crânienne derrière les fûts, les œufs de la Reine, Élinor qui savait pour les drains.

## Décisions du Bastion

- Une gamelle de 12 pc, au centre de la cellule de l'est, sert d'appât : sans rien à prendre, le piège libre de la dalle ne se déclencherait jamais.
- Brisk cède la clé à l'attitude 20, ou après une Intimidation réussie (DD 13). Le cadenas reste crochetable ; l'Escamotage sur la ceinture d'un PNJ n'existe pas dans le moteur.
- Voie sans combat dans la cour : Intimidation DD 13 sur les péagers.
- Le tiroir du rapport et la gamelle sont hors du budget de trésors.
- La caisse du péage de la villa est portée à 55 po (30 po, 200 pa, 500 pc), plus que la recette d'un jour.
- Restent pour le V7 : libérer Aldric et Joran, remettre le treuil, les suites de la confrontation d'Élinor, poser `lr-nouvelles-de-joran`.
- À tester quand le monde se chargera : l'énigme `roues-du-treuil` (`pnpm monde enigmes`).

## Décisions du village

- Vorn est humain, avec l'avant-bras droit gainé de laiton.
- La serrure piégée du tiroir central commande les trois tiroirs du bureau.
- Vorn n'avoue la pierre sacrée brisée qu'une fois le cratère vu (drapeau `lr-cratere-vu`, à poser à la Forêt).
- Sœur Martha ne vend pas de potions.
- Les rencontres s'écrivent pour 6 héros : 4 `epee-volante` en données valent 3 pour 4 héros.
- Le registre et le minerai passent par des contenants de `tresors/` pour être remis au joueur ; ils restent hors du budget de trésors.
- Restent pour le V7 : la remise du fragment d'enclume, le déclenchement de `lames-du-foyer`, le déplacement de Joran au Bastion.
