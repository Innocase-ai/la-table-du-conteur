# Brief : ajouter des monstres du SRD au moteur (gabarit)

> **Le catalogue du moteur contient les 329 profils de l'index du SRD français (06/11/2026).** Ce brief ne sert plus qu'à ajouter un profil **absent du SRD** décidé par l'utilisateur pour le moteur, ou à corriger un profil. Une histoire n'ajoute jamais de monstre.

À donner à **un agent** `general-purpose`, modèle **Sonnet 5.5** (des statistiques à recopier exactement : pas d'invention), **avant** les agents de zone, pour un profil absent de `packages/donnees/srd/monstres/` (329 profils au 06/11/2026), sur décision de l'utilisateur. Remplace les `<…>`. Claude relit le rapport et vérifie deux profils à la main contre le SRD.

---

Tu ajoutes au catalogue partagé du jeu les profils de monstres suivants, tirés du **SRD 5.2.1 en français** (licence CC-BY) : <liste : nom français, et pourquoi le monde en a besoin>. Tous les chemins sont relatifs à la racine du dépôt. Tu n'ajoutes **que** ces profils ; tu ne modifies aucun profil existant.

## À lire d'abord
1. Le schéma qui fait foi : `Monstre` et `ActionMonstre` dans `packages/regles/src/schemas.ts` (taille `TP|P|M|G|TG|Gig`, caractéristiques, sauvegardes, compétences, sens avec `perceptionPassive`, `fp` en texte « 1/4 », `px`, `bonusMaitrise`, traits, actions avec `cout`, `resolution`, `portee`, `zone`, `degats`, `etats`, `recharge`, `utilisations`, `multiattaque`).
2. Trois profils existants proches de ceux que tu ajoutes, comme modèles de forme : `packages/donnees/srd/monstres/<profil>.json` (par exemple `loup.json`, `combattant-gobelin.json`, `squelette.json`).
3. Le texte du SRD : `sources/srd-fr.txt` (extrait texte du PDF `sources/FR_SRD_CC_v5.2.1.pdf`, hors git) ; cherche le nom du monstre et recopie ses statistiques **exactement** (CA, PV et leurs dés, vitesses, caractéristiques, sauvegardes, compétences, sens, langues, FP, PX, traits, actions).

## Ce que tu produis
- Un fichier par profil : `packages/donnees/srd/monstres/<id>.json` (id en kebab-case ASCII, d'après le nom français : `loup-arctique`).
- Pour chaque profil, une **fiche visuelle en anglais** dans `packages/donnees/visuel/charte.json`, tableau `monstres` : `{ "id": "<id>", "nom": "<nom français>", "apparence": "<une phrase en anglais : forme, matière, couleurs, posture>" }`. Le test `outils/images/images.test.ts` (« chaque monstre du monde a une fiche visuelle dans la charte », vérifié sur le Val ; vaut pour tout monde) l'exige ; sans elle, l'illustrateur invente (« Bandit » est devenu un humanoïde-hyène).

## Règles
- **Rien d'inventé** : une valeur introuvable dans le SRD est signalée dans le rapport, pas devinée.
- Les actions que le moteur de combat ne sait pas jouer (sorts complexes, effets narratifs) restent dans `traits` ou `resume` ; garde les attaques et sauvegardes sous la forme des profils modèles.
- Pas d'image ni d'appel payant : l'image de combat (`pnpm images bestiaire`, `apps/jeu/src/bestiaire/<id>.webp`) se fait plus tard, après accord.

## Vérification
`pnpm test` (le test `packages/regles/tests/donnees.test.ts` valide chaque fichier contre le schéma ; `outils/images/images.test.ts` vérifie la charte), `pnpm typecheck`. Pas de commit.

## Rapport final (court)
Profils ajoutés (id, FP, PX), valeurs non trouvées ou douteuses, actions simplifiées et pourquoi.
