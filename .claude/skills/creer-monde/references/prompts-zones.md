# Modèles de prompts pour les agents de zone

Chaque agent est un `general-purpose`. Lance-les **tous dans un seul message**. Le prompt est court : il renvoie au guide (consignes communes) et au canon, puis donne la mission. Remplace les `<…>`. Les cibles chiffrées viennent des objectifs de richesse du validateur (30 lieux, 25 PNJ, 75 sujets, 25 trésors, 15 rencontres… par chapitre).

## Gabarit général

```
Tu écris la **zone <Zn> de <NOM>** : <description de la zone>. Code de zone : `<zn>`, préfixe `<pre>-`. Commence par lire `~/crpg-llm/packages/mondes/<ID>/GUIDE-ZONE.md` (consignes communes : à suivre à la lettre) puis tout ce qu'il t'indique.

## Mission
**Lieux** (≥ <n>) : <racine à créer et sous-lieux, liens du monde à déclarer avec durées en heures>.
**PNJ** (≥ <n>) : <ceux du registre pour cette zone + habitants mémorables ; sujets, secrets, marchands, services>.
**Rencontres** (≥ <n>) : <compositions, cartes, alternatives>.
**Quêtes secondaires** (≥ <n>, préfixe `q-<pre>-`) : <thèmes>, avec ramifications et échecs.
**Trésors** (≥ <n>), **objets propres** (≥ <n>), **énigmes** (≥ <n>), **pièges** (≥ <n>), **faits** (≥ <n>, préfixe `f-<pre>-`), **événements** (≥ <n>).
Chiffres visés : <récapitulatif>.
```

## Zones types (à adapter au monde)

- **Hub de départ** (village ou ville) : crée la **racine de la carte** et le hub ; déclare les liens (double sens, durées) vers les racines des autres zones ; tous les PNJ du registre pour ce lieu, dont les compagnons avec bloc `compagnon` complet (recrutement, 4 à 6 répliques, 3 opinions) ; 4 marchands ou plus (auberge, forge, soin, marché) ; services (repos, soins, réparation, identification, rumeurs) ; la quête principale est lancée par un sujet d'un PNJ (effet `quete active`) qui pose un drapeau du registre ; événements liés à la jauge ; embuscade d'ouverture.
- **Ville ou camp rival, repaire de brigands** : rencontres reprenant les compositions du prototype de combat (`packages/regles/src/combat/prototype.ts` : cartes prêtes) avec des alternatives (négocier, corrompre, libérer) ; un objet-laissez-passer ; quêtes de faction ; accès clandestins.
- **Grottes, routes, lieux sauvages** : plusieurs salles par grotte, entrées multiples, rencontres aléatoires (`declencheur: "aleatoire"`), un site habité par un groupe ambigu, caches et pièges ; chaque grotte reliée au monde par un lien depuis la route.
- **Donjon intermédiaire** : deux niveaux, plan non linéaire (boucles, raccourcis, passages secrets, portes verrouillées avec clé), plusieurs énigmes solubles par déduction à partir d'indices placés dans les salles, rencontres réparties (jamais tout dans une salle), gardien final avec phases ou alternatives, objet-clé qui ouvre le suivant.
- **Donjon final** : trois niveaux, voies vers **chacune des fins** (un PNJ ou une rencontre mixte où le groupe choisit), drapeaux de choix du registre, trésors de relique, énigmes d'ingénierie ; un accès alternatif dérobé.
- **Zone centrale** : factions (paliers de réputation, relations), jauge et ses événements, faits centraux (ids du registre), quête principale à étapes (variantes et étapes finales `termine: true` pour les fins alternatives), quêtes personnelles des compagnons, quêtes de faction, fins (conditions = drapeaux de choix), tables de butin (ids d'objets **vérifiés**).

## Pour tous : rappels à mettre dans la mission quand c'est pertinent
- Les ids d'objets du catalogue SRD se vérifient avec `grep -l '"id": "…"' packages/donnees/srd/objets/*.json` ; armes et armures du SRD se citent directement par leur id (`epee-longue`, `cotte-de-mailles`).
- Les profils de monstres se vérifient dans `packages/donnees/srd/monstres/`.
- Les drapeaux lus par la zone centrale sont posés par la zone désignée dans le registre.
- Rapport final attendu : fichiers, chiffres, ids du registre créés, ids d'autres zones référencés, drapeaux posés et lus, incohérences avec le canon.

## Extraction de monstres SRD (si le thème l'exige)
Avant les zones, un agent extrait les profils manquants (modèle : l'agent « monstres supplémentaires » du Val : liste de monstres, pages de l'index du SRD, schéma `Monstre`, exemples de fichiers existants, `pnpm test`).
