---
name: creer-pieges-tresors
description: Écrire, régler ou relire les pièges, les trésors, les objets propres au monde et les tables de butin d'un monde de « La Table du Conteur » : contenants, cachettes, serrures et clés, gardiens, indices, détection par la fouille, désamorçage, dégâts et effets, rattachement d'un piège (contenant, énigme ou libre), valeur et rareté par niveau, tables pondérées. À utiliser dès qu'on crée ou modifie un piège, un trésor, un objet de quête, une relique ou une table de butin, qu'on veut « récompenser l'exploration », « un piège qui ne soit pas qu'un jet de dégâts », « des trésors moins plats », ou que le validateur signale un avis de richesse, de butin, un trésor ou un piège. Reçoit son emplacement du « Contenu prévu » de l'atlas (`decrire-lieux`). Complète `creer-monde`, `creer-rencontres` (butin des combats, gardiens) et `enigmes` (échec qui déclenche un piège).
---

# Pièges et trésors

Un piège et un trésor sont deux moitiés du même geste : **le décor promet quelque chose, le joueur choisit de s'y risquer, le jeu lui rend un prix ou une récompense**. Un trésor qui est « un coffre avec 40 po » et un piège qui est « un jet de sauvegarde et des dégâts » sont des lignes de tableur ; ils deviennent du jeu quand le joueur a **vu un indice**, **pris une décision** et **vécu une conséquence**.

Le format est dans `packages/regles/src/monde/schemas.ts` (`Tresor`, `Piege`, `Objet`, `TableButin`) et `docs/MONDES.md` ; les gabarits JSON prêts à copier sont dans `references/gabarits.md`.

## Où ça se décide

- **L'emplacement** vient de la fiche du point dans l'atlas (`decrire-lieux`, « Contenu prévu » : à quel élément du décor l'entité est liée, au **lieu le plus précis** : le piège de la cave est un piège de la cave). Sans atlas, décide-le toi-même en regardant le `visuel` et la `description` du lieu.
- **Le budget** (combien de pièges et de trésors par lieu) vient du niveau 1 de l'atlas ; à défaut, les repères plus bas.
- **L'écriture** : les agents de zone (`creer-monde`, `GUIDE-ZONE.md`) écrivent les entités courantes ; ce skill sert à **concevoir** (les formes, l'équité, les prix) et à **relire** (la liste de contrôle).

## Les trésors

### Ce que le moteur fait
- Un trésor est **rattaché à un lieu** par son champ `lieu` (le lieu ne le liste pas). Il est montré au groupe avec son `nom` et sa `description` : **c'est le joueur qui les lit** (« Vous remarquez : … »), sans secret ni solution.
- **Caché** (`acces.cache`, DD et compétence parmi perception, investigation, survie, nature) : la perception passive du meilleur héros le repère **sans jet** si son DD ne dépasse pas son score (souvent 15 à 16 au niveau 3) ; sinon il faut **fouiller** (une fouille par lieu et par jour).
- **Verrouillé** (`acces.verrou`, DD, `cle` facultative) : on l'ouvre avec la clé, en **crochetant** (Escamotage) ou en **forçant** (Athlétisme). La clé est un objet : **elle doit exister dans le monde** (un PNJ qui la donne, un trésor, une rencontre) sinon le joueur ne peut que forcer.
- **Témoins** : crocheter ou forcer devant des PNJ est risqué. Les PNJ **placés dans le lieu** (`lieu` ou `presences` au bon moment de la journée) sont les témoins : le moteur lance un jet de **Discrétion** du héros contre un DD secret (`10 + 2` par témoin de plus que le premier, au plus 18 ; **+5 pour forcer**, qui fait du bruit) ; s'il est raté, chaque témoin perd de l'attitude envers le groupe (−10 pour crocheter, −15 pour forcer) et le dit dans le récit. **Un coffre dans une salle fréquentée ne s'ouvre donc pas en silence** : pour un coffre qu'on doit pouvoir ouvrir tranquillement, placez-le dans un lieu sans PNJ, ou comptez avec la baisse d'attitude. Avec la clé, personne ne regarde.
- **Piégé** (`acces.piege`) : le piège se déclenche à l'ouverture **sans la clé**, sauf s'il a été désamorcé. Si une clé existe, elle ouvre sans déclencher.
- **Gardé** (`gardien`) : une rencontre garde le trésor (voir `creer-rencontres`). **Indice** (`indice`) : le trésor aide à découvrir un fait (une note, un journal) : c'est ce qui fait servir un trésor à l'histoire. **Condition** : le trésor n'existe que si une condition est vraie (après un événement).
- **Contenu** : `pieces` (po, pa, pc), `objets` (id d'objet du monde ou du catalogue SRD, avec `quantite`), `tables` (des tables de butin tirées `jets` fois).

### Concevoir un trésor
1. **Le contenant dit où on est** : `contenant` parmi coffre, cache, cadavre, étagère, tombe, sarcophage, sac, autel, établi, vitrine, sol, autre ; choisis celui que le décor décrit (une étagère dans la bibliothèque, un établi à la forge), pas toujours un coffre. Sur ~93 trésors du Val : coffre 21, cache 22, sol 12, étagère 6, autel 5, établi 5, sac 5, cadavre 7.
2. **Trois sortes de contenu, jamais une seule** (et des **pierres précieuses** et **objets d'art** du catalogue, `gemme` et `objet-d-art`, pour des trésors qui ne sont pas que des pièces : `grep -h '"valeurPo"' packages/donnees/srd/objets/pierres-precieuses.json` donne les paliers 10, 50, 100, 500, 1 000 et 5 000 po ; objets d'art : 25, 250, 750, 2 500 et 7 500 po ; ils sont toujours `commun`, la valeur seule les distingue) : de l'**argent** (bourse, pièces anciennes), un **objet utile** (potion, parchemin, arme du SRD, outil), une **curiosité** qui raconte quelque chose (un objet avec `lore`, une lettre, un objet de quête). Une ou deux **belles trouvailles** par donjon, pas plus.
3. **Valeur et rareté par niveau** (mesure du 06/11/2026 sur les mondes livrés : en pièces, une médiane de 30 po par trésor dans le Val (niveaux 1 à 5), 150 po au 90ᵉ centile, 800 po au maximum ; dans la Citadelle (niveaux 1 à 4) une médiane de 10 po : la valeur y passe par les objets). Pas d'objet `rare` avant le niveau 3 ou 4, pas de `tres-rare` avant le niveau 5, pas de `legendaire` dans un chapitre de niveaux 1 à 5 sauf pivot de l'histoire. `pnpm monde valider` donne la valeur totale des trésors du monde (Val ≈ 33 280 po pour 93 trésors, Citadelle ≈ 2 932 po pour 31).
4. **Le chemin d'accès est un choix**, pas un mur : au moins deux façons d'obtenir ce qui est **indispensable** (une fouille ratée ne doit pas fermer la quête : prévois la clé chez un PNJ, un second indice). Réserve le verrou + le piège + le gardien aux trésors qui le méritent.
5. **Répartition** (mesure du Val) : environ 1 trésor sur 4 est verrouillé, 2 sur 5 caché, 1 sur 8 piégé, 1 sur 5 gardé, 1 sur 3 porte un indice. Un lieu où on se bat, on se repose ou on parle beaucoup n'a pas besoin d'un trésor de plus.
6. **Objets du monde** (`objets/`) : n'écris que ce qui est propre au monde (relique, objet de quête, curiosité avec `lore`). Les armes, armures, boucliers et objets magiques courants se **citent par leur id du catalogue SRD** (`grep -l '"id": "…"' packages/donnees/srd/objets/*.json`) ; un objet qui se découvre en l'étudiant a besoin de `identification` (DD d'Arcanes) **et** de `inconnu { nom, resume }`. Une arme ou armure du monde **doit** avoir `base` (id SRD).
7. **Tables de butin** (`tables/`) : entrées **pondérées** (`poids`), `palier` de niveau (1 = niveaux 1 à 4, 2 = 5 à 10… ; obligatoire, mais une indication pour l'auteur : le moteur ne le lit pas au tirage), avec une entrée `rien`. Une table par famille d'adversaires ou de lieu (« pillage gobelin », « bourse de bandit »), pas une table pour tout. Les combats donnent déjà des **dépouilles automatiques** selon le type et le FP (voir `creer-rencontres`) : n'en réécris pas.

## Les pièges

### Ce que le moteur fait
- **Détection** : la perception passive ne repère **jamais** un piège. Il ne se découvre qu'en **fouillant** (`detection` : compétence et DD, secret ; une fouille par lieu et par jour). Un piège peut donc rester caché.
- **Une fois repéré**, le groupe lit `nom` et `resume` (« un piège : nom (résumé) ») : écris le `resume` pour **ce que le groupe comprend en le voyant** (le mécanisme, pas la solution, aucun DD).
- **Désamorçage** (`desarmement` : compétence, DD, `outil` facultatif) : sans l'outil requis, désavantage ; un échec de **5 ou plus** le déclenche ; un échec plus léger ne fait rien et on peut réessayer. `outils-de-voleur` est reconnu dans l'inventaire ; un autre outil doit être dans la liste d'outils du personnage.
- **Déclenchement** : le texte `declenchement` est **narré au joueur** ; puis une **sauvegarde** éventuelle (`sauvegarde` : caractéristique, DD, `moitieSiReussite`), des **dégâts** (`degats` : dés et type), puis les **`effets`** du monde. Le moteur **ne tue pas** : 0 PV = inconscient. `etats` est affiché mais **n'est pas appliqué mécaniquement** : décris l'état dans `declenchement` si tu y tiens. `reinitialisation: true` : le piège se redéclenche à chaque fois.
- **Qui le subit** : un seul héros, jamais le groupe : celui qui ouvre la serrure (crocheter, forcer) ou rate le désamorçage ; quand on prend un objet piégé, rate une énigme ou déclenche un piège libre, c'est le héros qui a la meilleure Perception (il est en tête).

### Les trois rattachements (choisis-le consciemment)
| Rattachement | Quand il se déclenche | À utiliser pour |
| --- | --- | --- |
| **Un contenant** (`tresor.acces.piege`) | quand on ouvre le trésor sans la clé | l'aiguille dans la serrure, la fiole sous le couvercle : un piège **équitable**, lié à un geste que le joueur choisit |
| **Une énigme** (`enigme.echec.piege`) | quand l'énigme est ratée | la salle qui réagit à une mauvaise réponse |
| **Libre** (aucun des deux) | dès que le groupe **prend ou ouvre quelque chose dans le lieu** sans l'avoir trouvé (un seul à la fois) | la dalle, le fil : une menace d'ambiance. Un lieu **sans rien à prendre ni à ouvrir** n'en déclenchera jamais : c'est du contenu mort |

### Concevoir un piège
1. **Un indice dans le décor** : le piège est lié à un **élément remarquable** de la fiche du point (la dalle d'une autre couleur, la poussière absente devant la porte, la rainure de la serrure). Le `visuel` et la `description` du lieu en parlent **sans le dire** ; c'est ce qui rend le piège juste.
2. **Pas que des dégâts.** Les `effets` donnent de la variété : une **alarme** qui lance une rencontre (`rencontre`), un **vol** ou une perte (`objet` retiré, `pieces` négatif), un **coût** pour le monde (`jauge`, `reputation`), un **fait** ou un **drapeau** posé (le piège révèle que quelqu'un est passé), une porte qui se **débloque** (`debloquer`) ou un PNJ qui réagit (`attitude`, `pnjEtat`). Sur 33 pièges du Val, presque tous font des dégâts : fais mieux.
3. **Les nombres** (mesure du Val et de la Citadelle) : DD de détection 12 à 17, de désamorçage 11 à 17, de sauvegarde 11 à 17 ; dégâts typiques `2d6`, `2d8`, `2d10` aux niveaux 1 à 5 (`1d8` pour un coup de seringue, jusqu'à `4d10` en fin de donjon final). Garde le DD de désamorçage proche du DD de détection ; fais varier la compétence (Escamotage, Arcanes, Investigation, Survie selon la nature du piège).
4. **Le bon nombre** : un piège par endroit où il a un sens ; **pas dans le hub ni dans un lieu de repos** ; au plus un piège **libre** par lieu (un seul se déclenche à la fois). Objectif de richesse : 5 pièges par chapitre, mais la qualité avant le compte.
5. **Une issue pour le joueur prudent** : un piège qu'on ne peut ni voir, ni éviter, ni désamorcer est injuste ; lie-le à un geste facultatif (ouvrir, toucher, prendre), pas à une simple entrée dans la pièce.

## Contrôle (avant de dire « c'est fini »)
- [ ] Chaque entité a un **emplacement dans le décor** décrit (atlas ou fiche du lieu), au lieu le plus précis.
- [ ] Chaque **piège** a un indice dans le décor, un rattachement voulu (contenant, énigme ou libre avec quelque chose à prendre), un DD de détection et de désamorçage cohérents, une conséquence qui n'est pas que des dégâts (au moins un piège sur deux).
- [ ] Chaque **clé** citée existe et s'obtient dans le monde ; chaque **gardien**, **indice**, **objet**, **table** cité existe (le validateur le dit).
- [ ] Rien d'**indispensable** n'est derrière une seule fouille ratée.
- [ ] Les **raretés et valeurs** respectent le niveau du lieu ; les objets du monde ont `lore` ou `inconnu` quand ils s'identifient ; les armes et armures ont `base`.
- [ ] `description` d'un trésor et `resume` d'un piège : lisibles par le joueur, **sans secret, sans DD, sans solution**.
- [ ] `pnpm monde valider <id>` : pas de nouvel avis « Butin », « Richesse » ; l'atelier (Registre, filtres « Jamais cité » et « Jamais produit » : une clé ou un objet que rien ne donne).
- [ ] **Joue-le** : fouiller (le piège se trouve ou non), désarmer, ouvrir avec la clé, en crochetant, en forçant, et vérifie que le texte lu a du sens. Pour un piège spécial (rattaché à une énigme, effet `rencontre`), un test dans `packages/regles/tests/exploration.test.ts` (modèle : « les pièges ne se repèrent qu'en fouillant »).

## Les pièges connus
- **`etats` n'est pas appliqué** : écris l'état dans `declenchement` ou donne-le par un `effet`.
- **Piège libre dans une pièce vide** : jamais déclenché. Ajoute un trésor, une serrure ou un objet à prendre, ou rattache-le à un contenant.
- **Clé inexistante** : le trésor verrouillé n'est alors ouvrable qu'en forçant ou en crochetant : décide-le, ne le laisse pas arriver.
- **Perception ou Investigation ?** La perception passive du groupe (15 à 16 au niveau 3) repère sans jet tout trésor ou passage caché de DD inférieur ou égal : pour un vrai secret, DD 17 et plus ou Investigation (fouille active). Les pièges, eux, ne passent jamais par la perception passive.
- **Texte qui trahit** : un `resume` ou une `description` qui dit « piégé » alors que le piège est caché révèle le piège avant la détection (la `description` du trésor est lue dès qu'il est visible, le `resume` du piège seulement après sa découverte).
- **Récompense qui n'a rien à voir avec le lieu** : un trésor se justifie par ce que le lieu raconte (un atelier a des outils, un sarcophage une relique) ; sinon c'est du loot générique.
- **Avant de commiter** : mets à jour `docs/JOURNAL.md` et demande l'accord de l'utilisateur.
