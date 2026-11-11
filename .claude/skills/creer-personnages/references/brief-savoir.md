# Mission : écrire la fiche de savoir d'un personnage de La Citadelle des Marées (une mission = un personnage)

> **Exemple réel, tiré de La Citadelle des Marées.** Pour un autre monde, garde la structure, les règles et le format ; remplace l'id du monde, les noms, les identifiants et les listes (examens, questions, PNJ, lieux…) par ceux de ton monde, tirés du canon et de l'atlas. `<dossier temporaire de la session>` est le dossier temporaire (scratchpad) de la session en cours. Tous les chemins sont relatifs à la racine du dépôt.

Contexte : monde `packages/regles/tests/fixtures/mondes/citadelle-des-marees/`. Lis, dans l'ordre : `BIBLE.md` (canon, secrets), **`CANON-PERSONNAGES.md` (la seule source des passés, dates et liens : tu n'inventes AUCUN nom, date ni lien qui n'y soit pas ; pour un détail qui manque, reste vague ou omets-le)**, la fiche du personnage dans `pnj/*.json` (sa voix, traits, désir, peur, salutations, sujets, secrets : tu respectes sa voix exactement), et `faits/*.json` (le canon des faits). Format défini par `packages/regles/src/monde/savoirs-donnees.ts` (lis-le). Pas de commit. N'écris que ton fichier : `savoirs/z8-<id du pnj>.json` (un tableau JSON avec **un seul objet**).

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

Vérification : `pnpm monde valider citadelle-des-marees` : aucune erreur `[savoirs]` et aucun avis `[savoirs]` pour ta fiche (les avis demandent : passé ≥ 70 mots, ≥ 2 liens, ≥ 6 souvenirs, ≥ 4 faits, au moins un fait verrouillé avec `evasif`, un `tabou` pour tout fait de catégorie secret). Rapport final court : ce que tu as écrit, ce que tu as omis faute de canon.

---

## Mission Y — Ysmène Hautecôte (`ysmene-hautecote`)
Faits (`sait`) : 
- `f-grande-maree-dans-trois-jours` — libre ; id `la-grande-maree`.
- `f-cit-barque-a-la-derive` — libre (c'est son souvenir le plus intime, elle en parle avec pudeur) ; id `la-barque-bleue`.
- `f-cit-registre-deux-pages` — libre ; id `les-pages-arrachees` (elle l'a remarqué).
- `f-pacte-des-marees` — `attitudeMin` 40 ; id `le-pacte` ; tabou `["Sceau", "Pacte des Marées"]`.
- `f-la-cour-tient-sous-la-mer` — `attitudeMin` 40 ; id `ceux-qui-tiennent` ; tabou `["Cour de Lothmar", "Cour noyée", "Chancelier"]`.
- `f-cartes-cachent-la-marque` — `attitudeMin` 50 ; id `les-cartes-brouillees` ; tabou `["brouillent la marque", "cachent la marque"]`.
- `f-marque-de-basse-mer` — `attitudeMin` 60 ; id `la-marque` ; tabou `["marque de basse-mer", "basse-mer"]`.
- `f-nolwen-est-le-sceau` — `attitudeMin` 60 ; id `ce-que-porte-nolwen` ; tabou `["porte la marque"]`.
(Elle ignore le coût réel du pacte : ne fais pas dire ou savoir `f-le-sceau-est-prisonnier`.)
Liens : Nolwen (`nolwen-brevemer`), Anselme (`prieur-anselme-vareuil`), Gudrun (`gudrun-lanterne`), Mère Sorel (`mere-sorel-quaibas`, voir CANON : la petite du quai), Tristan (`qui`: son frère noyé).

## Mission P — Anselme Vareuil, le Prieur (`prieur-anselme-vareuil`)
Faits (`sait`) :
- `f-grande-maree-dans-trois-jours` — libre ; id `la-grande-maree`.
- `f-la-cour-tient-sous-la-mer` — `attitudeMin` 50 ; id `les-comptes-sous-la-mer` ; tabou `["Cour de Lothmar", "Cour noyée", "Chancelier"]`.
- `f-ligue-et-phare-cellule` — `attitudeMin` 50 ; id `l-offre-de-la-ligue` ; tabou `["phare-cellule"]`.
- `f-pacte-des-marees` — `attitudeMin` 60 ; id `le-pacte-des-comptes` ; tabou `["Sceau", "Pacte des Marées"]`.
- `f-nolwen-est-le-sceau` — `attitudeMin` 75 ; id `l-enfant-marquee` ; tabou `["porte la marque"]`.
- `f-prieur-veut-livrer` — `attitudeMin` 75 ; id `ses-comptes-froids` ; tabou `["livrer l'enfant", "livrer une enfant", "livrer Nolwen"]`.
Liens : Ysmène (`ysmene-hautecote`), Mère Sorel (`mere-sorel-quaibas`), Gudrun (`gudrun-lanterne`), Aldous (`aldous-lindenvert`), Corentin de Brumevoile (`corentin-brumevoile`, voir CANON : le sac de sel de chaque hiver). L'épisode de Brumevoile (les onze noms au dos du registre, le sac de sel) n'est lié à aucun fait du canon : il va dans `passe` et dans un ou deux éléments de `couleur` sous forme de gestes concrets, sans jamais l'expliquer en entier à la légère.

## Mission S — Mère Sorel Quaibas (`mere-sorel-quaibas`)
Faits (`sait`) :
- `f-por-filets-coupes-par-rats` — libre mais évasif par nature (elle ne dit pas que ce sont les siens) ; id `les-filets` ; `acces` : `{ "attitudeMin": 20 }`, `evasif` : elle hausse les épaules.
- `f-por-caisses-faux-noms` — `attitudeMin` 30 ; id `les-caisses` ; tabou `["faux noms", "sous le plancher"]`.
- `f-rats-vendent-les-passages` — `attitudeMin` 40 ; id `les-passages` ; tabou `["Chancelier"]`.
- `f-ligue-et-phare-cellule` — `attitudeMin` 30 ; id `la-ligue-et-la-cellule` ; tabou `["phare-cellule"]`.
Liens : Ysmène (`ysmene-hautecote`, la dette de la corde), Osric (`maitre-osric-vent`, le mandat signé), Joss (`joss-la-rame`), le Prieur (`prieur-anselme-vareuil`), le Père Gorge (`qui`).
