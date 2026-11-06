# Bible de {{NOM}} (canon)

Document de référence pour tous ceux qui écrivent des données de ce monde. **Les identifiants du registre (§7) sont fixes** : les zones s'y réfèrent entre elles. Ne rien inventer qui contredise ce canon.

> À remplir par l'auteur principal avant de lancer les agents (voir `.claude/skills/creer-monde/references/canon-modele.md`). Supprime les consignes entre crochets en les remplissant.

## 1. Pitch

[Le décor, la situation de départ, le conflit central, en un paragraphe. Puis le ton et l'esthétique en deux lignes.]

## 2. Ce qui s'est vraiment passé (secret, révélé par morceaux)

[La vérité, à plat, en 6 à 10 puces : l'origine du problème, qui sait quoi, pourquoi chaque antagoniste croit bien faire.]

## 3. Les fins

[Au moins trois fins, numérotées. Pour chacune : ce que fait le groupe, ce qui est gagné, ce que ça coûte, le fait central qui la rend possible.]

## 4. La jauge

[Optionnelle. Identifiant, bornes, valeur de départ, paliers (ce qui change à chaque seuil), ce qui la fait monter et descendre. Ex. : une menace qui progresse à chaque repos long.]

## 5. Factions (identifiants fixes)

| id | Faction | Veut | Chef |
| --- | --- | --- | --- |
| `…` | … | … | `…` |

## 6. Les peuples et les espèces dans ce monde

[Une place pour chaque espèce jouable du SRD (drakéide, elfe, gnome, goliath, halfelin, humain, nain, orc, tieffelin) : personne ne doit sentir qu'il joue une espèce « hors sujet ».]

## 7. Registre des identifiants fixes

### Lieux (arbre)

[La racine (région) puis les lieux racines de chaque zone, avec le préfixe des sous-lieux : `racine` → `hub` (zone 1, préfixe `xxx-`), …]

### Personnages clés (créés par la zone indiquée)

| id | Qui | Zone, lieu |
| --- | --- | --- |
| `…` | … | Z1, `…` |

[Inclure le ou les compagnons qui voyageront avec le groupe (escorte + interjections, skill `creer-personnages`) et leur quête personnelle. Le recrutement de compagnons jouables n'existe pas encore dans le moteur.]

### Objets clés

[Ids des objets de quête et reliques qui traversent les zones : qui les crée.]

### Jauge, drapeaux, faits centraux

[Les drapeaux posés par une zone et lus par une autre (clés de la quête principale, choix de fin), les faits centraux (`f-…`) que les PNJ de toutes les zones peuvent révéler, la jauge.]

### Quêtes principales (créées par la zone centrale)

[Id de la quête principale et de ses étapes, quêtes personnelles, quêtes de faction.]

### Rencontres emblématiques

[Les grands combats et leur lieu, niveaux visés.]

## 8. Progression par niveau

[Quels lieux à quels niveaux ; difficulté croissante.]

## 9. Monstres disponibles (SRD, ids de profil)

[Liste des profils de `packages/donnees/srd/monstres/` utilisables. Les rencontres n'utilisent que ceux-là.]

## 10. Choix, pertes et horloge (checklist « histoire qui ne s'ennuie pas »)

[Trois dilemmes par chapitre : la situation, les trois options avec leur coût et leur gain, l'écho trois jours plus tard.]
[Qui peut mourir ou partir selon les choix (au moins un PNJ).]
[L'horloge : une jauge à 4 paliers au moins, la moitié avec des effets qui ferment une porte, un moyen de la ralentir.]
[Les PNJ importants dont la salutation change (au moins 5) et ce qui la change.]
[Les faits clés et leurs trois sources.]
