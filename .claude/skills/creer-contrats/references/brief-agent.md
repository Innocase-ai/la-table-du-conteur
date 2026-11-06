# Brief type pour un agent Haiku : écrire un contrat

À copier dans un fichier du bac à sable (`scratchpad/brief-contrats.md`) puis à référencer dans le prompt de chaque agent. Remplir les `[crochets]` avec les décisions de Claude (ids exacts, forme, enjeu). Un agent Haiku écrit seulement ses fichiers ; Claude relit.

---

# Mission : écrire le contrat « [nom du contrat] » dans [monde]

Contexte : monde `packages/mondes/[monde]/` (lis `BIBLE.md` = canon, `GUIDE-ZONE.md` = format et style). Schéma qui fait foi : `packages/regles/src/monde/schemas.ts`. Pas de commit git. N'écris que les fichiers listés. Écris en français soigné, ton du monde : [ton].

**Le contrat** (décidé, à ne pas changer) :
- Forme : [embuscade | nid | traque | défense | client qui ment | convoi | duel]
- PNJ qui demande : `[id]` à `[lieu]` ; son problème : [une phrase concrète avec un détail] ; ce qu'il craint : [peur].
- Où se passe le combat : lieu `[id]`, déclencheur `[entree | repos | exploration]`, difficulté `[faible | moderee]`, monstres `[profil × n]` (profils SRD uniquement).
- Issue(s) sans combat : [alternatives voulues, avec compétence et DD].
- Récompense : [xp, pièces, objet `id`, réputation `faction`, attitude `pnj`, fait `id`] ; **ce qui arrive si on refuse** : [enjeu visible].
- Le drapeau qui accomplit l'étape : `[flag]` (**toutes** les issues qui règlent la rencontre le posent).

**Fichiers à écrire** :
1. `pnj/z[n]-contrats.json` : le sujet du PNJ demandeur (`id`, `mots`, `question` de 3 à 12 mots au vouvoiement, `reponse`, `effets` : quête `proposee`) et, s'il y a lieu, le sujet de retour (condition sur le drapeau). **Tu ne modifies pas la fiche d'un PNJ existant** : écris les sujets dans un fichier de patch `scratchpad/sujets-[contrat].json` au format `{ "<id pnj>": [ <sujets> ] }` ; Claude les applique.
2. `quetes/z[n]-contrats.json` : la quête (`type: secondaire`, `donneur`, `lieu`, `niveau`, `resume`, étapes dont `completion` = le drapeau, `recompenses`, `ramifications` avec « forme : … »).
3. `rencontres/z[n]-contrats.json` : la rencontre (type, difficulté, `intro`, monstres, carte tactique si combat, alternatives avec `jet`, `condition`, `resume`, `effets` ; pour un type sans monstres : `echec` + `echecResout`).
4. `scratchpad/rattachements-[contrat].json` : `[{ "lieu": "…", "id": "…", "declencheur": "…", "condition": { "quete": { "id": "q-…", "statut": "active" } }, "unique": true }]`.

**Règles d'écriture** : libellés du joueur à la 1re personne ; vouvoiement des PNJ envers le groupe ; images rationnées (pas deux phrases voisines sur le même mot) ; un détail concret par texte ; le PNJ dit son problème, pas la solution. Identifiants kebab-case ASCII sans accent, préfixe de zone.

**Vérification** : `pnpm monde valider [monde]` (0 erreur pour tes entités) puis `pnpm exec vitest run packages/regles/tests`. Rapport final court : fichiers écrits, ids créés, ce qui te pose problème.
