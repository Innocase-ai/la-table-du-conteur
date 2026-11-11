# Mission : donner de la profondeur à Nolwen, l'accompagnatrice de La Citadelle des Marées (trois missions, trois agents)

> **Exemple réel, tiré de La Citadelle des Marées.** Pour un autre monde, garde la structure, les règles et le format ; remplace l'id du monde, les noms, les identifiants et les listes (examens, questions, PNJ, lieux…) par ceux de ton monde, tirés du canon et de l'atlas. `<dossier temporaire de la session>` est le dossier temporaire (scratchpad) de la session en cours. Tous les chemins sont relatifs à la racine du dépôt.

Contexte : monde `packages/regles/tests/fixtures/mondes/citadelle-des-marees/`. Lis dans l'ordre : `BIBLE.md` (canon et secrets), **`CANON-PERSONNAGES.md` (source unique des passés, dates, liens et habitudes ; la section « Nolwen Brevemer » est le canon de Nolwen ; tu n'inventes AUCUN nom, date ni lien qui n'y soit pas)**, la fiche de Nolwen dans `pnj/z1-citadelle.json` (voix, traits, désir, peur, sujets) et les fiches de ceux qu'elle fréquente, et `faits/*.json`. Skills de référence : `.claude/skills/creer-personnages/SKILL.md`. Pas de commit. N'écris que tes fichiers. Français soigné ; ton du monde (mélancolique, maritime, sobre, humour sec, espoir dans les petits gestes).

**Qui est Nolwen** : 16 ans, apprentie cartographe, escortée par le groupe de la Citadelle à Port-aux-Cordes (elle suit le groupe partout après la nuit du départ). Voix : phrases courtes et précises ; elle aime les nombres et les détours ; elle pose des questions sur les cartes qu'on lui tend. Désir : comprendre pourquoi la mer l'appelle et qui était vraiment Ysmène. Peur : être seule quand la mer viendra. Défaut : elle cache ses cauchemars et garde longtemps ses rancunes. **Elle ignore qu'elle est le Sceau et tout du Pacte.** Rien de ce qu'elle dit ou sait ne doit le révéler.

Vérification : `pnpm monde valider citadelle-des-marees` : 0 erreur pour tes fichiers. Rapport final court : ce que tu as écrit, ce que tu as omis faute de canon.

---

## Mission A — La fiche de savoir de Nolwen (`savoirs/z8-nolwen-brevemer.json`)
Un tableau JSON avec UN objet (format : `packages/regles/src/monde/savoirs-donnees.ts` ; exemples : `savoirs/z8-ysmene-hautecote.json`, `savoirs/z8-mere-sorel-quaibas.json`).
- `passe` : 80 à 150 mots, uniquement le canon (trouvée, grandie à la Citadelle, apprentie, Aldous, Gudrun, le carnet). **Aucune confidence intime dedans.**
- `liens` : Ysmène (`ysmene-hautecote`), Aldous (`aldous-lindenvert`), Gudrun (`gudrun-lanterne`), le Prieur (`prieur-anselme-vareuil`) ; réciproques du canon.
- `couleur` : 10 à 12 éléments variés (souvenirs datés, manies sensorielles, opinions, anecdotes tendres ou drôles). Les confidences intimes sont **verrouillées** : `mes-cauchemars` (`attitudeMin` 40 : la salle sous l'eau, les pas qu'on compte, ce qu'elle ressent au réveil), `la-rancune` (`attitudeMin` 45 : ce qu'elle ne pardonne pas, un souvenir précis de rancune contre quelqu'un de la Citadelle, plausible et mineur), `peur-d-etre-seule` (`attitudeMin` 55 : une nuit d'enfant où personne n'est venu), chacune avec `evasif`.
- `sait` : `f-grande-maree-dans-trois-jours` (libre, id `la-grande-maree`), `f-cit-tables-decalees` (libre, elle l'a vu en copiant les colonnes, id `les-tables-qui-retardent`), `f-cit-registre-deux-pages` (libre, id `les-pages-arrachees`), `f-cit-barque-a-la-derive` (`attitudeMin` 35, elle sait seulement qu'Ysmène l'a trouvée dans une barque ; `evasif` ; id `la-barque`, tabou `["couverture"]`).

## Mission B — Les interjections de Nolwen (`interjections/z9-nolwen.json`)
Un tableau JSON de **16 interjections** (format : `packages/regles/src/monde/interjections-donnees.ts`). Chaque interjection : `id` (kebab-case, préfixe `nolwen-`), `pnj: "nolwen-brevemer"`, `quand` (une Condition), `texte` (une à deux phrases courtes, **25 à 45 mots**, **dans la voix de Nolwen**, avec UN détail concret : un chiffre, une matière, un geste, ce qu'elle mesure ou compte ; jamais deux fois la même image), `effets` (facultatif : l'approbation, voir plus bas). Elle les dit d'elle-même en voyageant ; elle ne dit **jamais** rien qui révèle le Pacte, le Sceau, la Cour ou que la marque a un sens.
Déclencheurs imposés (ids exacts) :
1. `{ "lieu": "route-des-falaises" }` : première fois sur la route, la Citadelle derrière elle.
2. `{ "lieu": "marais-de-sel" }` : le marais, la ligne de sel, la marée qui avance.
3. `{ "lieu": "fal-brumevoile" }` : le hameau déserté, l'envie de descendre vers l'eau.
4. `{ "lieu": "fal-phare-du-cap-mort" }` : le phare éteint, la vue sur la baie (elle pense à tracer sa carte).
5. `{ "lieu": "port-aux-cordes" }` : le bruit, les regards, trop de monde.
6. `{ "lieu": "por-taverne-du-hareng" }` : chaleur, soupe, nombres sur le menu.
7. `{ "lieu": "por-hall-de-la-ligue" }` : les registres, elle compare à ceux de la Citadelle.
8. `{ "lieu": "por-chapelle-des-noyes" }` : les noms de noyés, elle les compte.
9. `{ "lieu": "palais-basmaree" }` : le sol devient calme, la marque se réchauffe (elle le dit à demi-mot, sans comprendre).
10. `{ "flag": "ysmene-tombee" }` : la mort de Dame Ysmène ; sobre, brève, qui serre le cœur ; effet `{ "attitude": { "pnj": "nolwen-brevemer", "delta": 5 } }`.
11. `{ "jauge": { "id": "maree", "min": 3 } }` : la mer monte plus vite que ses tables ; elle a peur et ne le dit pas.
12. `{ "flag": "choix-la-promesse-de-nolwen-ne-pas-retenir" }` : elle a obtenu ce qu'elle demandait ; douce, grave.
13. `{ "flag": "choix-la-promesse-de-nolwen-sauver" }` : elle est touchée mais inquiète du poids que le groupe a pris.
14. `{ "flag": "choix-la-promesse-de-nolwen-refuser" }` : elle est blessée, pique, garde la rancune.
15. `{ "flag": "choix-les-ruelles-basses-evacuer" }` : elle a compté les gens sortis ; effet attitude +4.
16. `{ "flag": "choix-les-ruelles-basses-chaussee" }` : elle ne dit rien de cruel, mais elle a compté aussi ceux qu'on n'a pas sortis ; effet attitude −5.
(Les effets d'attitude indiqués sont les seuls ; les autres interjections n'ont pas d'effets.)

## Mission C — La quête personnelle « La carte inachevée » (`quetes/z9-nolwen.json` + `scratchpad/sujets-nolwen.json`)
Écris une quête `q-nolwen-la-carte-inachevee` (`type: "personnelle"`, `donneur: "nolwen-brevemer"`, `lieu: "fal-phare-du-cap-mort"`, `niveau: { "min": 1, "max": 3 }`, `resume` 2 à 3 phrases, `debut: "cap"`), 3 étapes :
- `cap` : « Montez avec Nolwen au phare du Cap-Mort : elle veut y tracer la baie entière. » `completion` `{ "flag": "nolwen-baie-tracee" }`, `suivantes: ["points"]`.
- `points` : « Faites lire ses points à un pilote du port : Ambroise Carène, à la jetée. » `completion` `{ "flag": "nolwen-points-lus" }`, `suivantes: ["nom"]`.
- `nom` : « Aidez Nolwen à donner un nom à sa carte. » `completion` `{ "flag": "nolwen-carte-nommee" }`, `termine: true`.
Récompenses : `{ xp: 100, pieces: 0, objets: [], effets: [ { "attitude": { "pnj": "nolwen-brevemer", "delta": 10 } } ] }` ; `ramifications` : « forme : quête personnelle de compagnon. Se débloque par la confiance (attitude 40). Les points du carnet sont les repères de l'ancienne chaussée des Basses-Eaux (canon). »
Écris `<dossier temporaire de la session>/sujets-nolwen.json` : `{ "<id pnj>": [ <sujets> ] }` (je les ajouterai aux fiches ; **ne modifie pas** `pnj/*.json`). Sujets (format des sujets de `pnj/z1-citadelle.json` : `id`, `mots`, `question` de 3 à 12 mots au vouvoiement, `reponse` à la **première personne** pour ce que Nolwen dit, 60 à 120 mots avec détails concrets, `condition`, `effets`, `unique`) :
- `nolwen-brevemer` : `ma-carte-inachevee` (proposition ; `condition` `{ "et": [ { "flag": "nolwen-avec-le-groupe" }, { "pnj": { "id": "nolwen-brevemer", "attitudeMin": 40 } }, { "non": { "quete": { "id": "q-nolwen-la-carte-inachevee", "statut": "active" } } }, { "non": { "quete": { "id": "q-nolwen-la-carte-inachevee", "statut": "terminee" } } } ] }`, question « Lui demander ce qu'elle voudrait tracer. », elle parle de la baie qu'elle n'a vue que de dos, de son carnet de points ; `effets` `[ { "quete": { "id": "q-nolwen-la-carte-inachevee", "statut": "active" } } ]`) ; `la-baie-du-cap-mort` (`condition` : étape `cap` active et `{ "lieu": "fal-phare-du-cap-mort" }` visité ; question « Lui proposer de tracer la baie ici. » ; elle trace, elle compte, elle parle ; `effets` `[ { "flag": "nolwen-baie-tracee" } ]`, `unique: true`) ; `le-nom-de-la-carte` (`condition` : `{ "flag": "nolwen-points-lus" }` ; question « Lui demander comment elle nommera sa carte. » ; elle choisit un nom simple, concret, qui ne révèle rien (**un nom de lieu ou d'objet de la côte**, pas un nom de légende) ; `effets` `[ { "flag": "nolwen-carte-nommee" } ]`, `unique: true`).
- `por-ambroise-carene` (pilote de la jetée, voir sa fiche) : `les-points-de-nolwen` (`condition` : étape `points` active, i.e. `{ "etape": { "quete": "q-nolwen-la-carte-inachevee", "etape": "points" } }` ; question « Lui montrer le carnet de Nolwen. » ; Ambroise reconnaît des repères de sondage d'une très ancienne chaussée de pierre noire, qui se découvre aux plus grandes basses mers ; il ne sait pas où elle mène ni d'où Nolwen les connaît ; `effets` `[ { "flag": "nolwen-points-lus" }, { "fait": "f-chaussee-des-basses-eaux" } ]`, `unique: true`).
Reste cohérent avec la fiche d'Ambroise et le fait `f-chaussee-des-basses-eaux` (lis-les) ; ne dis rien du palais ni du Sceau.
