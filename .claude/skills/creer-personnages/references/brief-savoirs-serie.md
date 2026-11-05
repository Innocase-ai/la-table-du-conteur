# Mission : écrire la fiche de savoir d'un personnage de La Citadelle des Marées (une mission = un personnage)

Contexte : monde `C:/Users/sebas/Documents/GitHub/D&D/crpg-llm/packages/mondes/citadelle-des-marees/`. Lis, dans l'ordre : `BIBLE.md` (canon, secrets), **`CANON-PERSONNAGES.md` (la seule source des passés, dates et liens : tu n'inventes AUCUN nom, date ni lien qui n'y soit pas ; pour un détail qui manque, reste vague ou omets-le)**, la fiche du personnage dans `pnj/*.json` (sa voix, traits, désir, peur, salutations, sujets, secrets : tu respectes sa voix exactement), et `faits/*.json` (le canon des faits). Format défini par `packages/regles/src/monde/savoirs-donnees.ts` (lis-le). Pas de commit. N'écris que ton fichier : `savoirs/z8-<id du pnj>.json` (un tableau JSON avec **un seul objet**).

## À quoi ça sert
Le LLM qui anime le jeu lira cette fiche pour faire parler le personnage **librement** (n'importe quelle question du joueur) sans rien inventer. Chaque réplique est vérifiée : elle ne peut citer que les éléments de la fiche (par id) et ne révéler que les faits dont l'accès est ouvert. La profondeur d'une conversation dépend donc de la **richesse concrète** de ce que tu écris ici.

## Ce que tu écris
```json
{
  "pnj": "<id>",
  "passe": "80 à 150 mots : son parcours, avec noms propres, dates (« il y a 57 ans »), lieux, un fait marquant, une blessure. Pour nourrir ses répliques, jamais lu tel quel. Seulement des éléments de CANON-PERSONNAGES.md.",
  "liens": [ { "pnj": "<id d'un PNJ du monde>", "nature": "élève / amie / rivale…", "opinion": "ce qu'il en pense, en une ou deux phrases, avec un détail" }, { "qui": "quelqu'un hors scène", "nature": "…", "opinion": "…" } ],
  "couleur": [ { "id": "kebab-case-unique", "texte": "un souvenir, une anecdote, une manie ou une opinion, 25 à 50 mots, concret (un lieu, un objet, un geste, un chiffre), à la troisième personne" } ],
  "sait": [ { "id": "kebab-case-unique", "fait": "<id d'un fait de faits/>", "version": "comment il le dit ou le comprend, à sa façon (20 à 50 mots, éventuellement partielle)", "acces": { "attitudeMin": 60 }, "evasif": "ce qu'il laisse entendre, la main sur la tasse, tant que c'est verrouillé", "tabou": ["mot à ne pas prononcer tant que le groupe ignore ce fait"] } ]
}
```
- `liens` : 3 à 5, avec au moins deux PNJ du monde (ids existants dans `pnj/*.json`) et les liens **réciproques** décrits dans CANON-PERSONNAGES.md (la même histoire vue de chaque côté).
- `couleur` : **10 à 12** éléments, variés : 3 souvenirs précis (avec date ou lieu), 3 manies ou habitudes sensorielles, 3 opinions tranchées (sur un lieu, une faction, un autre PNJ, la mer), 1 ou 2 anecdotes drôles ou tendres. **Aucun secret de la bible, aucun fait qui change l'intrigue.** Chaque id est unique dans la fiche.
- `sait` : exactement les faits listés dans ta mission ci-dessous, avec l'accès demandé. Un `acces` vide `{}` = libre. `attitudeMin` verrouille jusqu'à ce niveau de confiance (le chiffre est donné). `evasif` obligatoire pour un fait verrouillé. `tabou` : les mots donnés (il peut en manquer, n'en ajoute que s'ils trahissent vraiment le fait).
- **Spécificité obligatoire** : noms propres, chiffres, matières, odeurs, gestes ; pas de « mystérieux », « ancien », « sombre » sans détail attaché ; pas deux éléments qui disent la même chose ; chaque élément doit pouvoir servir de matière à une réplique de 1 à 3 phrases.
- Voix : le texte de la fiche (`passe`, `couleur`, `version`) est à la troisième personne ; la `version` d'un fait peut citer une tournure du personnage entre guillemets.

Vérification : `cd C:/Users/sebas/Documents/GitHub/D\&D/crpg-llm && pnpm monde valider citadelle-des-marees` : aucune erreur `[savoirs]` et aucun avis `[savoirs]` pour ta fiche (les avis demandent : passé ≥ 70 mots, ≥ 2 liens, ≥ 6 souvenirs, ≥ 4 faits, au moins un fait verrouillé avec `evasif`, un `tabou` pour tout fait de catégorie secret). Rapport final court : ce que tu as écrit, ce que tu as omis faute de canon.


---

# Missions (une par personnage) — la section de ton personnage fait foi ; **le canon à suivre est la « Suite du canon » en fin de `CANON-PERSONNAGES.md`**

**Consignes communes à toutes les missions ci-dessous** :
- Écris `savoirs/z8-<id du pnj>.json` : un tableau JSON avec UN objet (modèles : `savoirs/z8-ysmene-hautecote.json`, `z8-nolwen-brevemer.json`).
- `couleur` : 10 à 12 éléments ; les **confidences** demandées sont **verrouillées** : `"acces": { "attitudeMin": N }` et un `evasif` (ce qu'il laisse entendre en attendant), et elles n'apparaissent **jamais** dans `passe`, `liens` ni dans une couleur libre.
- **Compatibilité avec la fiche `pnj/`** : relis les `secrets` et les `sujets` de la fiche du personnage ; un fait que la fiche verrouille ne peut pas être plus ouvert dans ta fiche de savoir ; une confidence que la fiche dit librement (un sujet sans condition) ne se verrouille pas plus haut ici (aligne l'accès).
- `liens` réciproques du canon (ids de PNJ existants : `ysmene-hautecote`, `nolwen-brevemer`, `prieur-anselme-vareuil`, `aldous-lindenvert`, `gudrun-lanterne`, `mere-sorel-quaibas`, `joss-la-rame`, `por-ambroise-carene`, `por-hennequin-lacet`, `corentin-brumevoile`, `por-garance-bolle`, `cit-frere-halvard`, `soeur-elwyn`, `maitre-osric-vent`…) ; un nom hors scène (« Tamsin », « Ilse ») s'écrit avec `"qui"`.
- Aucune date ni aucun nom qui ne soit pas dans le canon (suite comprise).

## Mission AL — Aldous Lindenvert (`aldous-lindenvert`)
Faits (`sait`) : `f-cit-tables-decalees` libre (id `les-tables-decalees`) ; `f-cit-carte-du-cap-mort` libre (id `la-carte-du-cap-mort`) ; `f-cit-registre-deux-pages` libre (id `les-pages-arrachees`) ; `f-cit-lentille-encrassee` libre (id `la-lentille`) ; `f-grande-maree-dans-trois-jours` libre (id `la-grande-maree`).
Confidences verrouillées (`couleur`) : `l-heure-de-retard` (attitudeMin 40 : l'hiver du Gros Sel, la table d'alerte recopiée une heure trop tard, sa peur de l'avoir causé) ; `les-crayons-de-nolwen` (attitudeMin 35 : il garde en secret dans un tiroir les corrections au crayon de la petite).

## Mission GU — Gudrun Lanterne (`gudrun-lanterne`)
Faits : `f-cit-herbes-de-falaise` libre (id `les-herbes-grises`) ; `f-cit-cercles-de-sel` libre (id `les-cercles-de-sel`) ; `f-lot-prisonnier-voit-les-barques` attitudeMin 45, evasif (elle a vu des barques de la Ligue passer avec des cages ; id `les-cages-de-plomb`, tabou `["phare-cellule"]`) ; `f-ligue-et-phare-cellule` attitudeMin 60 (id `la-sagesse-de-la-ligue`, tabou `["phare-cellule"]`).
Confidences verrouillées : `le-fanal-du-cap-mort` (attitudeMin 40 : la nuit de Brumevoile, le seul fanal qu'elle n'a pas allumé) ; `ma-tendresse-pour-nolwen` (attitudeMin 30 : la lampe, la mèche taillée, ce qu'elle ne dit pas).

## Mission JO — Joss la Rame (`joss-la-rame`)
Faits : `f-por-regle-des-rats` libre (id `la-regle-des-anneaux`) ; `f-por-lumieres-sous-l-eau` libre (id `la-lanterne-sans-main`) ; `f-por-heraut-suit-le-groupe` attitudeMin 50, evasif (id `l-homme-sec`, tabou `["manteau sec"]`) ; `f-por-joss-vend-les-fuyards` attitudeMin 55 (id `les-fuyards-vendus`, tabou `["la Cour", "vend"]`) ; `f-por-lettre-du-chancelier` attitudeMin 65 (id `la-lettre-noire`, tabou `["Chancelier", "cire noire"]`).
Confidences verrouillées : `la-dette-de-garance` (attitudeMin 40 : ce qu'il croit lui devoir, sans trahir qu'elle doit aux Rats) ; `les-lettres-au-sceau-noir` (attitudeMin 60 : depuis deux hivers, ce qu'on lui promet ; il se raconte que ça ne fait de mal à personne).

## Mission AM — Ambroise Carène (`por-ambroise-carene`)
Faits : `f-por-ambroise-vu-palais` attitudeMin 30 (id `le-palais-vu`, tabou `["Palais-Basmarée"]` seulement si le groupe l'ignore) ; `f-chaussee-des-basses-eaux` attitudeMin 35 (id `la-chaussee`) ; `f-por-ligue-prime-les-pilotes` attitudeMin 25 (id `les-pilotes-rayes`) ; `f-por-cle-chez-le-pilote` attitudeMin 55, evasif (id `la-cle-cachee`, tabou `["double fond", "tiroir du bas"]`) ; `f-grande-maree-dans-trois-jours` libre.
Confidences verrouillées : `les-trois-pilotes` (attitudeMin 45 : il en a formé trois des six rayés, son silence) ; `la-cle-a-rendre` (attitudeMin 50 : ce que l'ancien Prieur lui a confié il y a trente ans, sans dire où elle est cachée).

## Mission HE — Hennequin Lacet (`por-hennequin-lacet`)
Faits : `f-por-barque-cachee` libre (id `la-barque-a-fond-plat`) ; `f-por-ligue-prime-les-pilotes` attitudeMin 40 (id `les-pilotes-rayes`) ; `f-grande-maree-dans-trois-jours` libre.
Confidences verrouillées : `la-petite-quaibas` (attitudeMin 30 : l'atelier d'Aubert, la petite qui nouait plus vite que lui) ; `la-rancune` (attitudeMin 45 : une rancune précise et mineure, plausible, que tu inventes dans le cadre du canon sans nom nouveau ; il la garde plus longtemps que ses dettes) ; `la-barque-d-ambroise` (attitudeMin 40 : pour qui il la répare, depuis un an).

## Mission CO — Corentin (`corentin-brumevoile`)
Faits : `f-fal-brumevoile-deserte` libre (id `le-hameau-deserte`) ; `f-fal-mer-trop-loin` libre (id `la-mer-trop-loin`) ; `f-fal-noyes-ne-remontent-pas` attitudeMin 30 (id `les-noyes-gardes`) ; `f-nuit-haute` attitudeMin 35 (id `la-nuit-haute`, tabou `["Nuit Haute"]` si le groupe ne la connaît pas ; accès cohérent avec la fiche) ; `f-grande-maree-dans-trois-jours` libre.
Confidences verrouillées : `tamsin-et-ewan` (attitudeMin 40 : sa femme et son fils emportés il y a dix ans) ; `le-sac-de-sel` (attitudeMin 50 : ce qui arrive chaque hiver sur son seuil, ce qu'il en pense) ; `les-onze-barques` (attitudeMin 30 : pourquoi il les retourne chaque matin). **Ne mélange pas** les onze barques de Brumevoile et les onze pêcheurs du Gros Sel (voir canon).

## Mission GA — Garance Bolle (`por-garance-bolle`)
Faits : `f-por-caisses-faux-noms` attitudeMin 50, evasif (id `les-caisses-de-la-cave`, tabou `["faux noms", "sous le plancher"]`) ; `f-por-garde-touchee-par-les-rats` attitudeMin 45 (id `la-bourse-des-gardes`) ; `f-por-gaspard-temoin` attitudeMin 65, evasif (id `ce-que-gaspard-a-vu`, tabou `["témoin", "faire taire"]`) ; `f-grande-maree-dans-trois-jours` libre.
Confidences verrouillées : `la-dette-aux-rats` (attitudeMin 40 : cent vingt pièces, le toit, la cave) ; `bastien` (attitudeMin 35 : son mari noyé il y a douze ans, la boucle de ceinture).

## Mission HA — Frère Halvard (`cit-frere-halvard`)
Faits : `f-cit-homme-bleme-vu` libre (id `l-homme-au-manteau-sec`) ; `f-cit-homme-bleme-question` libre (id `la-question-de-l-homme-sec`) ; `f-cit-barque-a-la-derive` attitudeMin 40, evasif (il a ouvert la porte à Ysmène avec le panier ; id `la-nuit-d-equinoxe`, tabou `["couverture"]`) ; `f-grande-maree-dans-trois-jours` libre.
Confidences verrouillées : `la-ligne-sans-nom` (attitudeMin 35 : « une entrante, sans nom », qu'il n'a jamais barrée ni remplie) ; `la-peur-d-ouvrir` (attitudeMin 45 : ouvrir un jour sans savoir à qui).

## Mission EL — Sœur Elwyn (`soeur-elwyn`)
Faits : `f-por-noms-des-noyes` libre (id `les-noms-graves`) ; `f-fal-noyes-ne-remontent-pas` libre (id `les-noyes-gardes`) ; `f-por-fosses-vides` accès **identique** à celui de la fiche `pnj/` (id `les-fosses-vides`, tabou à lire dans la fiche) ; `f-grande-maree-dans-trois-jours` libre.
Confidences verrouillées : `ilse` (attitudeMin 35 : sa sœur cadette, le premier nom gravé, le coquillage au chapelet) ; `l-enfant-du-quai` (attitudeMin 50 : l'enfant jamais réclamé, il y a trente ans).
