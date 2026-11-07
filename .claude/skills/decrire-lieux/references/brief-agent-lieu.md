# Brief de l'agent « niveau 2 » (un agent par lieu du niveau 1)

À copier dans le prompt de l'agent, en remplaçant les `{{…}}`. Un agent `general-purpose` par lieu du niveau 1, tous lancés dans le même message. Modèle : Haiku (règle du projet pour l'écriture de textes) ; Claude relit chaque fiche (voir la liste de contrôle du skill).

---

Tu écris les fiches détaillées des points à visiter du lieu **{{id du lieu}}** ({{nom}}) du monde **{{id du monde}}**, dans `packages/mondes/{{id du monde}}/`. Tu ne modifies **aucun** autre fichier que ceux indiqués plus bas.

## À lire d'abord
1. `LIEUX.md` : la fiche **Niveau 0** (charte du monde) et la fiche **Niveau 1** de {{id du lieu}} (plan, points à visiter, héritage, secret du MJ). C'est ta source ; tu ne la contredis pas.
2. `BIBLE.md` : le canon (secrets, factions, registre d'identifiants §7).
3. `lieux/{{fichier de zone}}` : les fiches de lieux existantes de ta zone, pour ne rien dupliquer.
4. Un exemple du niveau attendu : `packages/mondes/citadelle-des-marees/lieux/z1-citadelle.json` (champs `visuel`, `description`, `accroche`, `liens`).

## Ce que tu produis
Pour **chaque point à visiter** listé dans le niveau 1 de {{id du lieu}} (et seulement eux, plus leurs sous-lieux déclarés dans leur section « Intérieur »), une fiche au format du modèle `.claude/skills/decrire-lieux/assets/ATLAS.modele.md` (« Niveau 2 »), écrite dans `LIEUX.md` sous la fiche de niveau 1 du lieu, dans l'ordre de la liste. Aucun fichier JSON : la dérivation vers les fichiers du monde se fait ensuite.

## Les points qui en contiennent d'autres
Si la fiche de niveau 1 (ou la section « Intérieur » d'un point) liste des **sous-lieux** (la cave et les chambres d'une taverne…), écris **aussi leurs fiches**, juste sous celle de leur conteneur, avec le même modèle (« Niveau 3 », puis 4 si besoin). Le bloc d'héritage d'un sous-lieu est la fiche de son conteneur, recopiée sans changement. Écris dans la section « Intérieur » du conteneur ce qui annonce chaque sous-lieu vu d'en haut (la trappe, l'escalier) : ce texte nourrit l'`accroche` du sous-lieu.

## Règles
- **Bloc d'héritage** : recopie-le mot pour mot depuis le niveau 1 ; ne le modifie pas. Si une salle exige un matériau ou une couleur absents du bloc, écris-le dans « Un détail propre » avec sa raison, et signale-le dans ton rapport (je l'ajouterai au bloc du dessus).
- **Pas de texte générique** : chaque fiche a **un détail propre** (inscription, odeur, objet cassé, usure particulière) qui ne conviendrait à aucune autre. Deux fiches qu'on pourrait échanger sont refusées.
- **Concret** : des tailles en pas, des matières, des couleurs précises, la **place** de chaque élément (« contre le mur nord », « au fond à droite »), l'origine de la lumière. Pas de « inquiétant », « mystérieux », « sinistre » : décris ce qui inquiète.
- **Rien d'inventé hors du canon** : aucun nouveau secret, relique, nom propre, lieu. Le « Contenu prévu » reprend le **budget du niveau 1** : tu places chaque entité prévue (son rôle, l'élément du décor auquel elle est liée, son id si `BIBLE.md` §7 ou les fichiers du monde le donnent, sinon « à créer ») ; tu n'écris **aucune fiche d'entité** et tu n'ajoutes pas de PNJ, de piège ni de trésor au-delà du budget. Place chaque entité au lieu le plus précis (la cave, pas la taverne).
- **Issues** : chaque porte, escalier ou passage cité mène à un id existant (niveau 1 : voisins directs) ; `description` et `retour` de 12 à 30 mots, vus de chaque côté, sans secret ni solution. Un escalier qui descend d'un côté remonte de l'autre.
- **`visuel`** (2 à 4 phrases) : forme générale et matière ; trois éléments remarquables avec leur place ; lumière et son origine ; état des choses (eau gelée ou courante, porte ouverte ou close). **Aucun nom de personnage ou de créature** (ce qui est nommé apparaît à l'image), **aucun secret**, évite les mots corps, cadavre, enfant près d'un danger, brûlures sur la peau, silhouettes couchées. Matériaux et couleurs du bloc d'héritage.
- **`description`** (MJ, 100 à 250 mots) : factuelle et détaillée ; peut contenir ce qu'on trouve, mais **pas** le secret du MJ du niveau 1 (il reste dans sa section).
- **`arrivee`** (récit d'arrivée, **pour le joueur**, 60 à 150 mots) : ce qu'il lit en entrant, à la première visite. Présent, « vous », un paragraphe sensoriel (lumière, un son, une odeur ou une température, un détail inattendu), au ton du monde. **Ni secret, ni mécanique** (jauge, DD, jet, PV), **ni ce qu'on peut trouver** en fouillant, ni sorties, ni personnage nommé, ni dialogue, ni heure précise : c'est le seul champ de lieu que le joueur lit en entier (le `resume` n'est qu'une légende). Ne recopie pas `description` (pour le MJ). **`arriveeVariantes`** : `[{ condition, texte }]` pour l'avant / après (la première variante vraie remplace `arrivee`, relue une fois). `pnpm monde valider` avertit hors de 40 à 220 mots, ou si le texte parle de mécanique ; `revue` surveille les secrets.
- **`resume`** : une phrase qui ne spoile rien. **`accroche`** : 12 à 30 mots, vue du **dehors** depuis le parent (façade, lueur, odeur, bruit), sans nom de PNJ ni contenu de la salle. **`ambiance`** : 3 à 8 mots.
- **Avant / après** : seulement si le canon prévoit un changement ; cite le drapeau ou le fait qui le déclenche.
- Français soigné, concret, sans emphase, au ton du monde (`monde.json`, champ `ton`).

## Vérification
Relis chaque fiche avec cette liste : héritage recopié sans changement ; un détail propre ; chaque élément avec sa place ; lumière avec son origine ; issues cohérentes avec les voisins du niveau 1 ; aucun secret ni nom de personnage dans `visuel` / `resume` / `accroche` ; aucune entité inventée. Pas de commit git.

## Rapport final (court)
Liste des points écrits (ids), nuances à ajouter au bloc d'héritage du niveau 1, incohérences repérées avec le niveau 1 ou le canon, entités que tu aurais voulu citer mais qui n'existent pas, écart éventuel entre le contenu prévu et le budget du niveau 1.
