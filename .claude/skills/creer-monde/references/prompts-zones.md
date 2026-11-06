# Modèles de prompts pour les agents de zone

Chaque agent est un `general-purpose`, modèle **Sonnet 5.5**. Lance-les **tous dans un seul message**. Le prompt est court : il renvoie au guide (consignes communes), au canon et à l'**atlas** `LIEUX.md`, puis donne la mission. Remplace les `<…>`. Une zone = un ou plusieurs lieux **entiers** du niveau 1 de l'atlas ; ses cibles chiffrées sont la **somme des budgets de contenu** de ces lieux (l'atlas prime) ; sans atlas, elles viennent des objectifs de richesse du validateur (30 lieux, 25 PNJ, 75 sujets, 25 trésors, 15 rencontres… par chapitre).

## Gabarit général

```
Tu écris la **zone <Zn> de <NOM>** : <description de la zone>. Code de zone : `<zn>`, préfixe `<pre>-`. Commence par lire `packages/mondes/<ID>/GUIDE-ZONE.md` (consignes communes : à suivre à la lettre) puis tout ce qu'il t'indique, dont l'atlas `packages/mondes/<ID>/LIEUX.md` : tes lieux sont <ids des lieux du niveau 1>, recopie leurs champs et crée exactement leur « Contenu prévu ».

## Mission
**Lieux** (≥ <n>) : <racine à créer et sous-lieux, liens du monde à déclarer avec durées en heures>.
**PNJ** (≥ <n>) : <ceux du registre pour cette zone + habitants mémorables ; sujets, secrets, marchands, services>.
**Rencontres** (≥ <n>) : <compositions, cartes, alternatives>.
**Quêtes secondaires** (≥ <n>, préfixe `q-<pre>-`) : <thèmes>, avec ramifications et échecs.
**Trésors** (≥ <n>), **objets propres** (≥ <n>), **énigmes** (≥ <n>), **pièges** (≥ <n>), **faits** (≥ <n>, préfixe `f-<pre>-`), **événements** (≥ <n>).
Chiffres visés : <récapitulatif>.
```

## Zones types (à adapter au monde)

- **Hub de départ** (village ou ville) : crée la **racine de la carte** et le hub ; déclare les liens (double sens, durées) vers les racines des autres zones ; tous les PNJ du registre pour ce lieu, dont les futurs compagnons (le compagnon qui voyage se fait **après les zones**, par `escorte` + `interjections/` : skill `creer-personnages` ; le bloc `compagnon` du PNJ n'est **pas lu** par le moteur, ne le remplis pas) ; 4 marchands ou plus (auberge, forge, soin, marché) ; services (l'**id** décide de l'effet : un id qui contient `chambre`, `dortoir`, `hospitalite`, `abri` ou `refuge` donne une nuit, `soin`, `guerison` ou `purge` rend les PV, `identification` identifie le sac ; les autres ne sont que du texte) ; la quête principale est lancée par un sujet d'un PNJ (effet `quete active`) qui pose un drapeau du registre ; événements liés à la jauge ; embuscade d'ouverture.
- **Ville ou camp rival, repaire de brigands** : rencontres reprenant les compositions du prototype de combat (`packages/regles/src/combat/prototype.ts` : cartes prêtes) avec des alternatives (négocier, corrompre, libérer) ; un objet-laissez-passer ; quêtes de faction ; accès clandestins.
- **Grottes, routes, lieux sauvages** : plusieurs salles par grotte, entrées multiples, rencontres aléatoires (`declencheur: "aleatoire"`), un site habité par un groupe ambigu, caches et pièges ; chaque grotte reliée au monde par un lien depuis la route.
- **Donjon intermédiaire** : deux niveaux, plan non linéaire (boucles, raccourcis, passages secrets, portes verrouillées avec clé), plusieurs énigmes solubles par déduction à partir d'indices placés dans les salles, rencontres réparties (jamais tout dans une salle), gardien final avec phases ou alternatives, objet-clé qui ouvre le suivant.
- **Donjon final** : trois niveaux, voies vers **chacune des fins** (un PNJ ou une rencontre mixte où le groupe choisit), drapeaux de choix du registre, trésors de relique, énigmes d'ingénierie ; un accès alternatif dérobé.
- **Zone centrale** : factions (la réputation sert de **condition** ; paliers, relations et objectifs ne sont que des notes pour le MJ), jauge, son `evolution` (ce qui la fait monter : repos long, jour, lieu, condition) et ses événements, faits centraux (ids du registre), quête principale à étapes (variantes et étapes finales `termine: true` pour les fins alternatives), quêtes de faction, fins (**condition = le drapeau de l'issue**, jamais un fait qu'on apprend tôt : le moteur pose la première fin dont la condition est vraie, après chaque action ; voir `lecons.md` § fins), tables de butin (ids d'objets **vérifiés**).

## Pour tous : rappels à mettre dans la mission quand c'est pertinent
- Les ids d'objets du catalogue SRD se vérifient avec `grep -l '"id": "…"' packages/donnees/srd/objets/*.json` ; armes et armures du SRD se citent directement par leur id (`epee-longue`, `cotte-de-mailles`).
- Les profils de monstres se vérifient dans `packages/donnees/srd/monstres/`.
- Les drapeaux lus par la zone centrale sont posés par la zone désignée dans le registre.
- Rapport final attendu : fichiers, chiffres, ids du registre créés, ids d'autres zones référencés, drapeaux posés et lus, incohérences avec le canon.

## Monstres : uniquement ceux du moteur
Les zones n'utilisent que les 329 profils de `packages/donnees/srd/monstres/` (le validateur refuse les autres) et ne créent aucune image de monstre. Si un profil manque, on étend le moteur, pas l'histoire.

## Extraction de monstres SRD (chantier du moteur)
Avant les zones, un agent extrait les profils manquants : brief `brief-monstres.md` (il reprend la méthode de l'agent « monstres supplémentaires » du Val : liste de monstres, pages de l'index du SRD, schéma `Monstre`, exemples de fichiers existants, `pnpm test`).
