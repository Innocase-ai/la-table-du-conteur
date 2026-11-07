# Bruitages : ce qu'on a, ce qu'il manque

Les sons vont dans `apps/jeu/src/sons/<nom>.mp3`. Pour en ajouter : déposer les fichiers bruts (mp3, wav, ogg) dans un dossier, puis `pnpm sons rogner <dossier> apps/jeu/src/sons` (coupe les silences, égalise le volume, nettoie le nom : minuscules, sans accents, tirets). Le branchement sur les effets est dans `apps/jeu/src/sons-regles.ts` (tests dans `sons-regles.test.ts`, et `journal-sons.test.ts` sur un vrai journal du moteur). L'arme d'une attaque est donnée par le moteur (`details.arme` : identifiant de l'arme ou de l'action du monstre), le bruit vient de la part physique du coup même quand un élément s'y ajoute (Marque du chasseur). **Relancer `pnpm jeu` après l'ajout de fichiers** : le serveur de développement ne voit pas les fichiers ajoutés après son démarrage.

## En place (34 sons)

**Armes, coups** : `epee`, `hache`, `fouet`, `lance` (estoc : lance, pique, pic, trident), `rapiere` (rapière, dague, épée courte), `perforant`, `masse` (masse, maillet, marteau, fléau, morgenstern), `massue` (massue, gourdin, bâton), `contondant`, `rate-arme` (toute arme qui rate).
**Armes, tirs et jets** : `arc`, `arbalete`, `fronde`, `arme-a-feu`, `sarbacane`, `lancer` (arme de jet : javeline, hachette, dague…).
**Sorts de dégâts** : `feu-1` (trait de feu, mains brûlantes), `feu-2` (rayon ardent), `glace`, `foudre` (poigne électrique), `radiant` (flamme sacrée, rayon traçant), `acide`, `poison`, `necrotique` (contact glacial, blessure), `tonnerre`, `projectile-magique`, `arme-spirituelle`.
**Sorts de soutien et d'état** : `soin`, `protection` (bouclier, bouclier de la foi, bénédiction), `renforcement` (aide), `marque`, `malediction` (imprécation), `sommeil`, `immobilisation`.

Un sort sans son propre prend celui de la famille de ses dégâts (feu, froid, foudre, force, radiant, acide, poison, nécrotique, tonnerre) : les sorts du SRD pas encore jouables en profiteront.

## À revoir dans les fichiers fournis (04/11/2026)

Trois paires de fichiers ont exactement le même contenu : `lance` = `lancer`, `rapiere` = `rate-arme`, `necrotique` = `renforcement`. Ils fonctionnent, mais un estoc, un jet, un coup de rapière et un sifflement dans le vide ne devraient pas sonner pareil, pas plus qu'un sort nécrotique et un renforcement : à remplacer quand on aura mieux.

## Manque encore

| Nom du fichier | Sert pour | Le son |
| --- | --- | --- |
| `fleche-impact` | toute flèche ou carreau qui touche (aujourd'hui **muet**) | choc sec d'une pointe qui s'enfonce. Le fichier fourni sous ce nom est le même que `arc` (le départ de la corde) : il n'a pas été branché. |
| `chaine` | fléau d'armes (joue `masse` en attendant) | chaîne qui claque, boule lourde |

## Finitions (si l'envie y est)

| Nom du fichier | Sert pour | Le son |
| --- | --- | --- |
| `epee-lourde` | épée à deux mains, coutille, hallebarde | tranchant lourd, plus grave que `epee` |
| `critique` | tout coup critique | accent grave et bref par-dessus le coup |
| `impact-feu`, `impact-glace`, `impact-foudre`, `impact-acide`, `impact-poison`, `impact-necrotique`, `impact-radiant`, `impact-force`, `impact-psychique`, `impact-tonnerre` | l'impact d'un sort sur sa cible (aujourd'hui seul le départ du sort a un son) | éclat bref de la famille, 0,3 à 0,8 s |
| `psychique` | sorts psychiques (famille sans son) | ondes qui vibrent dans la tête |
| `mort` (2 ou 3 variantes) | mort d'une créature | chute, souffle |
| `etat-paralysie`, `etat-peur`, `etat-poison` | un état qui s'applique | signal court |
| `concentration-rompue` | un sort maintenu qui s'interrompt | craquement de verre |

## Remarques

- Plusieurs variantes d'un même effet (`epee-1`, `epee-2`, `epee-3`) évitent la répétition : le jeu pourra en tirer une au hasard.
- Licence : conserver l'origine de chaque fichier (voir `apps/jeu/src/sons/CREDITS.md`).

## Musiques (accueil, histoires, combats)

Les musiques sont dans `apps/jeu/src/musique/` (crédits et réserves de licence : `musique/CREDITS.md`), sur un **canal et un curseur à part des bruitages** (`crpg.musique`, défaut 50 %). Un fichier de musique entre toujours dans le projet par `pnpm musique boucler`.

| Usage | Dossier | Comportement | Niveau |
| --- | --- | --- | --- |
| Menus (accueil, histoires, groupe, aide, créateur) | `accueil/` (2) | une boucle tirée au hasard, gardée tant qu'on reste dans les menus | −26 dB |
| Histoire en cours | `fond/` (6) | un morceau tiré au hasard au début de la partie, puis les autres dans un ordre mélangé sans répétition, fondu de 3 s ; bouton ⏭ ; baisse de 70 % pendant une scène narrée | **−30 dB** (très bas) |
| Combat (d'histoire ou escarmouche) | `combat/` (6) | une boucle tirée au hasard, jamais la même deux fois de suite ; elle prend la place de la musique de la scène, qui reprend ensuite **là où elle s'était arrêtée** | −26 dB |

Le lecteur (`musique.ts`) ne reçoit pas d'ordres : il calcule ce qui doit jouer d'après la scène, le combat en cours et les réglages (`musiqueVoulue`, dans `musique-regles.ts`, pur et testé). Le contrôle du son (🔊, ♪, ⏭) est sur l'écran titre, dans l'aventure et en combat. Les fichiers sont chargés à la demande (seule la musique voulue est téléchargée). Poids : 34 Mo (mp3 192 kbps).
