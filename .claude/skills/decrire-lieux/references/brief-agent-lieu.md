# Brief de l'agent « niveau 2 » (un agent par lieu du niveau 1)

À copier dans le prompt de l'agent, en remplaçant les `{{…}}`. Un agent `general-purpose` par lieu du niveau 1, tous lancés dans le même message. Modèle : Haiku (règle du projet pour l'écriture de textes) ; Claude relit chaque fiche (voir la liste de contrôle du skill).

---

Tu écris les fiches détaillées des points à visiter du lieu **{{id du lieu}}** ({{nom}}) du monde **{{id du monde}}**, dans `~/crpg-llm/packages/mondes/{{id du monde}}/`. Tu ne modifies **aucun** autre fichier que ceux indiqués plus bas.

## À lire d'abord
1. `LIEUX.md` : la fiche **Niveau 0** (charte du monde) et la fiche **Niveau 1** de {{id du lieu}} (plan, points à visiter, héritage, secret du MJ). C'est ta source ; tu ne la contredis pas.
2. `BIBLE.md` : le canon (secrets, factions, registre d'identifiants §7).
3. `lieux/{{fichier de zone}}` : les fiches de lieux existantes de ta zone, pour ne rien dupliquer.
4. Un exemple du niveau attendu : `~/crpg-llm/packages/mondes/citadelle-des-marees/lieux/z1-citadelle.json` (champs `visuel`, `description`, `accroche`, `liens`).

## Ce que tu produis
Pour **chaque point à visiter** listé dans le niveau 1 de {{id du lieu}} (et seulement eux), une fiche au format du modèle `.claude/skills/decrire-lieux/assets/ATLAS.modele.md` (« Niveau 2 »), écrite dans `LIEUX.md` sous la fiche de niveau 1 du lieu, dans l'ordre de la liste. Aucun fichier JSON : la dérivation vers les fichiers du monde se fait ensuite.

## Règles
- **Bloc d'héritage** : recopie-le mot pour mot depuis le niveau 1 ; ne le modifie pas. Si une salle exige un matériau ou une couleur absents du bloc, écris-le dans « Un détail propre » avec sa raison, et signale-le dans ton rapport (je l'ajouterai au bloc du dessus).
- **Pas de texte générique** : chaque fiche a **un détail propre** (inscription, odeur, objet cassé, usure particulière) qui ne conviendrait à aucune autre. Deux fiches qu'on pourrait échanger sont refusées.
- **Concret** : des tailles en pas, des matières, des couleurs précises, la **place** de chaque élément (« contre le mur nord », « au fond à droite »), l'origine de la lumière. Pas de « inquiétant », « mystérieux », « sinistre » : décris ce qui inquiète.
- **Rien d'inventé hors du canon** : aucun nouveau PNJ, secret, relique, nom propre, lieu. « Ce qu'on y trouve » ne cite que des ids déjà présents dans `BIBLE.md` §7 ou dans les fichiers du monde.
- **Issues** : chaque porte, escalier ou passage cité mène à un id existant (niveau 1 : voisins directs) ; `description` et `retour` de 12 à 30 mots, vus de chaque côté, sans secret ni solution. Un escalier qui descend d'un côté remonte de l'autre.
- **`visuel`** (2 à 4 phrases) : forme générale et matière ; trois éléments remarquables avec leur place ; lumière et son origine ; état des choses (eau gelée ou courante, porte ouverte ou close). **Aucun nom de personnage ou de créature** (ce qui est nommé apparaît à l'image), **aucun secret**, évite les mots corps, cadavre, enfant près d'un danger, brûlures sur la peau, silhouettes couchées. Matériaux et couleurs du bloc d'héritage.
- **`description`** (MJ, 100 à 250 mots) : factuelle et détaillée ; peut contenir ce qu'on trouve, mais **pas** le secret du MJ du niveau 1 (il reste dans sa section).
- **`resume`** : une phrase qui ne spoile rien. **`accroche`** : 12 à 30 mots, vue du **dehors** depuis le parent (façade, lueur, odeur, bruit), sans nom de PNJ ni contenu de la salle. **`ambiance`** : 3 à 8 mots.
- **Avant / après** : seulement si le canon prévoit un changement ; cite le drapeau ou le fait qui le déclenche.
- Français soigné, concret, sans emphase, au ton du monde (`monde.json`, champ `ton`).

## Vérification
Relis chaque fiche avec cette liste : héritage recopié sans changement ; un détail propre ; chaque élément avec sa place ; lumière avec son origine ; issues cohérentes avec les voisins du niveau 1 ; aucun secret ni nom de personnage dans `visuel` / `resume` / `accroche` ; aucune entité inventée. Pas de commit git.

## Rapport final (court)
Liste des points écrits (ids), nuances à ajouter au bloc d'héritage du niveau 1, incohérences repérées avec le niveau 1 ou le canon, entités que tu aurais voulu citer mais qui n'existent pas.
