# Remplir le canon (BIBLE.md) d'un monde

Le canon est lu par tous les agents et par le MJ. Il doit être **précis là où les zones se touchent** (registre §7) et **suggestif ailleurs**. Exemple complet : `packages/mondes/val-des-cendres/BIBLE.md`.

## §1 Pitch
Un décor singulier, une situation de départ qui enferme le groupe (le col se ferme, le pont s'effondre, le navire s'échoue : une raison de ne pas partir), un conflit central. Le groupe doit avoir **une question à laquelle répondre** et un décompte qui court. Ton et esthétique en deux lignes, cohérents avec la direction artistique de `monde.json`.

## §2 Le secret
Écris la vérité **à plat**, comme un résumé d'enquête. Trois règles qui font les bons secrets :
- **Les antagonistes croient bien faire.** Si un camp est simplement méchant, le monde est plat. Donne-lui une raison sincère.
- **Une vérité cachée par personnage** : chacun des PNJ importants sait ou cache un morceau ; le groupe reconstitue en parlant à tous.
- **Un coût caché** dans ce qui paraît protéger (la Lanterne du Val tenait la cendre, mais coûtait une vie par an).

## §3 Les fins
Trois à cinq, plus une fin d'échec si une jauge existe. Chacune : ce que fait le groupe, ce qui est gagné, **ce que ça coûte**, et le fait central qui rend cette voie possible. Aucune fin entièrement heureuse. Vérifie qu'une fin existe pour chaque grande attitude (sacrifice, destruction, marché, soumission à un camp).

## §4 La jauge
Un compteur qui rend le temps précieux et fait réagir le monde (menace qui monte à chaque repos long, réputation qui s'effrite, saison qui avance). Bornes, départ, 4 à 5 paliers avec une conséquence concrète chacun (couvre-feu, village qui se vide, assauts), et ce qui la fait baisser (une quête). Le palier maximal déclenche la fin d'échec.

## §5 Les factions
4 à 6, chacune avec un chef (PNJ du registre), un désir, des relations croisées. Au moins deux qui s'opposent sans qu'aucune ait entièrement tort. Réserve une faction « du passé » ou « des morts » si le monde a une histoire qui pèse.

## §6 Les peuples
Place pour toutes les espèces jouables (une ligne chacune). Le groupe est créé par le joueur : il peut être de n'importe quelle espèce, le monde doit l'accueillir.

## §7 Le registre (le cœur du travail)
Tout identifiant qu'une zone doit **lire sans l'avoir écrit** est dans le registre, avec la zone qui le crée :
- **Lieux** : la racine, le hub, la racine de chaque zone, les lieux clés (salle du boss, entrée secrète). Préfixes des sous-lieux par zone.
- **PNJ clés** : id, qui, zone, lieu. Les compagnons y figurent avec classe, espèce, niveau et l'id de leur quête personnelle.
- **Objets clés** : reliques, clés, objets de quête qui traversent des zones.
- **Drapeaux** : ceux que la quête principale lit (étapes, choix de fin) et que les zones posent. Un drapeau lu par la zone centrale doit avoir **une zone désignée pour le poser**.
- **Faits centraux** : la dizaine de vérités que les PNJ de toutes les zones peuvent révéler (ils sont écrits par la zone centrale, révélés par les autres).
- **Quêtes principales** : id et étapes.
Si tu hésites à mettre un identifiant dans le registre, mets-le : l'oublier crée des erreurs de référence que le validateur ne résout pas à ta place.

## §8 Progression
Quels lieux à quels niveaux, pour que les zones calibrent leurs rencontres (budget de PX du SRD pour un groupe de 6) et leurs trésors (rareté).

## §9 Monstres
La liste des profils disponibles. Les zones n'utilisent que ceux-là.

## Après le canon
Remplis `monde.json` (accroche, ton, niveaux, départ, direction artistique, règles du MJ, chapitre unique avec `lieux: ["<racine>"]`). Relis le tout une fois avec cette question : *si deux agents écrivent leurs zones sans se parler, ce document suffit-il à leur éviter de se contredire ?*
