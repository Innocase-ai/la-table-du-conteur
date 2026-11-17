# Plan d'enquête : la quête principale de « La Tombe des Rois Serpents » (proposition du 17/11/2026, à valider)

Règle appliquée : la quête principale est une enquête (skill `creer-intrigue`, point 3 bis). **Rien n'est modifié tant que ce plan n'est pas validé.**

## Ce qui existe déjà (et qu'on réutilise)

La tombe est déjà bâtie comme une enquête : **65 faits** (dont 5 « indispensables » : le contrat à moitié-part, le passage sous le faux temple, le vrai nom de Baltoplate, la chute de l'empire de Xiximantre, la Couronne chez les gobelins), 24 rencontres, 11 pièges, 3 énigmes, 6 passages cachés ou verrouillés, des tombes qui ne mènent nulle part (Xisor, Sparamantur, Franbinzar, la fausse tombe) et des petits combats sur les pistes. Ce qui manque : la **quête principale ne l'exploite pas**. Elle compte 5 étapes en ligne (« rejoignez le bivouac », « percez le faux temple », « franchissez le niveau deux », « résolvez le cœur », « réglez le partage »), qui se valident presque toutes en entrant dans un lieu. Le journal dit au joueur où aller, et rien ne l'oblige à recouper quoi que ce soit.

**Aucun nouveau lieu, aucune image, aucune voix : tout se fait dans les données de quête, quelques passages et quelques textes de journal (Haiku).**

## La nouvelle quête principale : 4 actes, 9 étapes visibles

Le journal ne montre que ce qu'on a découvert ; les étapes se complètent par des **faits appris**, pas par des lieux.

### Acte 1 : Qui est passé avant nous ? (le Fort et le Bivouac)
- **Étape 1 « Rejoindre le Bivouac et recevoir le contrat »** (inchangée, 50 PX).
- **Étape 2 « Comprendre pourquoi les autres ont échoué »** : pistes au choix, qui se recoupent : Varnac (seul survivant d'une descente), le registre de Corvin et les trois compagnies disparues, Brennan et la tranchée forcée, les avertissements de Garin. Se complète quand le groupe connaît **deux des trois** : `f-varnac-survivant`, `f-pnj-compagnies-precedentes`, `f-tranchee-forcee` (ou `f-traces-expedition-n1` trouvé sur place). Effet : une narration (« tous ont échoué au premier niveau : ce n'est peut-être pas la vraie tombe »).
- **Impasses utiles** : la rumeur du trône maudit (Gaspard, Solène : fausse piste), les cercueils dorés de la fausse tombe (un leurre qu'on veut piller, avec combat).

### Acte 2 : Le faux tombeau (niveau 1 de la tombe)
- **Étape 3 « Percer le faux temple »** : le passage vers le niveau 2 ne s'ouvre plus « par hasard à la fouille » : il exige de **recouper deux indices** parmi `f-eau-sous-l-idole`, `f-fausse-tombe-leurre`, `f-vapeur-des-sepulcres`, `f-traces-expedition-n1`. Chacun a plusieurs sources (examen, sujet, objet), et la fouille reste possible (jet difficile) pour qui n'a rien compris. Effet : le fait `f-passage-temple-decouvert` et une narration.
- **Impasses et petits combats** : tombe du sorcier (anneau maudit), squelettes du faux temple, vapeur des sépulcres.

### Acte 3 : Les vraies tombes (niveau 2)
- **Étape 4 « Trouver la porte du troisième niveau »** : deux chemins sont déjà dans les données (le couloir dérobé derrière la statue des soldats d'argile, ou la corniche derrière l'arène du colosse osseux) ; le journal n'en nomme aucun. Se complète par `f-passage-soldats-vers-n3` **ou** `f-porte-niveau-3-corniche`.
- **Étape 5 (en parallèle) « Lire ce que les prêtres ont consigné »** : la sacristie (`f-cercle-d-argent-garde`, `f-vrai-nom-baltoplate`) : facultative, mais c'est elle qui rend les dilemmes du niveau 3 lisibles. Pas de blocage.
- **Impasses** : les tombes de Xisor, Sparamantur et Franbinzar (butin et pièges, rien pour avancer), la galerie des soldats creux.

### Acte 4 : Le cœur du tombeau (niveau 3)
- **Étape 6 « Découvrir ce que valent les richesses »** : **trois pistes** déjà écrites, que le joueur recoupe : le **grand trésor** (clé sur le collier du basilic, porte de fer, serpent de pierre), la **Couronne** (statue d'or volée, traces de petits pieds, Skriik et ses quatre captifs), l'**accord avec Xiximantre** (ses curiosités, la vérité sur son empire). Le journal ne dit pas lesquelles existent ; l'étape se complète dès qu'une piste est **comprise** (`f-tresor-porte-de-fer`, `f-couronne-chez-gobelins` ou `f-xiximantre-troque-curiosites`).
- **Étape 7 « Résoudre le cœur »** : un des trois dénouements (`coeur-tombe-resolu`, déjà posé par les événements existants).
- **Étape 8 « Remonter »** : retour au bivouac (la sortie par les racines compte).
- **Étape 9 « Régler le partage avec Martin »** (dilemme du décompte, fins inchangées).

## Ce que ça change pour le joueur

| | Aujourd'hui | Après |
|---|---|---|
| Journal | dit où aller | dit quoi comprendre |
| Faux temple | s'ouvre en fouillant | s'ouvre en recoupant 2 indices (ou fouille difficile) |
| Niveau 3 | 2 portes, aucune enquête | 2 chemins à déduire |
| Cœur de la tombe | 3 dénouements annoncés d'emblée | 3 pistes à comprendre une à une |
| Impasses | existent, hors quête | comptées dans l'enquête (rumeurs, tombes nobles, leurres) |

## Ce qui ne change pas

Les **5 fins**, les **4 dilemmes**, l'horloge de Martin, les XP totaux de la quête (1 050 PX, répartis sur les nouvelles étapes), les 24 rencontres, les 15 autres quêtes, les 147 sujets. Les tests de la Tombe écrits par une autre session doivent continuer de passer.

## Garde-fous (pour ne pas bloquer le joueur)

- Tout fait exigé par une étape ou un passage a **au moins deux sources** (le validateur le vérifie : avis « Fait clé »).
- Seuls **deux passages** sont conditionnés par des faits (faux temple, cœur) ; le reste du donjon reste ouvert comme avant.
- Le chemin le plus court (`pnpm monde parcours --chemin`) doit passer par au moins 2 pistes de l'acte 1, 2 indices de l'acte 2 et 1 piste de l'acte 4.

## Compte final visé

4 actes, 9 étapes, 3 pistes (acte 1), 4 impasses utiles, 6 indices recoupables (acte 2), 3 pistes concurrentes (acte 4), les petits combats déjà en place.

## Questions pour toi

1. Le faux temple doit-il vraiment **exiger** le recoupement de deux indices (avec la fouille difficile comme issue de secours), ou seulement le **récompenser** (le journal avance, mais le passage s'ouvre comme avant) ? Je recommande d'exiger.
2. Les **trois pistes du cœur** s'ouvrent-elles toutes dès qu'on en comprend une, ou chaque piste n'apparaît-elle qu'une fois comprise ? Je recommande la deuxième (chaque piste est une découverte).
3. L'acte 1 (« qui est passé avant nous ») est le plus léger. On peut le garder tel quel (2 faits sur 3) ou l'enrichir d'un petit combat sur le chemin du Bivouac. Je recommande de le garder tel quel.
