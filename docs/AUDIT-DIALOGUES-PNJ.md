# Audit des rencontres et conversations avec les PNJ (11/11/2026)

Deux auditeurs en lecture seule (moteur et données, interface et conteur), constats revérifiés dans le code. Aucun appel payant.
Fichiers : `packages/regles/src/monde/dialogue.ts`, `monde/presence.ts`, `modules/dialogue.ts`, `modules/savoirs.ts`,
`conteur/*`, `apps/jeu/src/aventure/EcranAventure.tsx`, `BoiteDialogue.tsx`, `apps/jeu/src/voix.ts`.

## 1. Bugs

**Corrigés le 11/11/2026** : M1 à M5, I1, I3, I4 (tests `dialogue-correctifs.test.ts`, `exploration.test.ts`). Restent : I2, I5, I6, I7.

### Moteur (confirmés)

| # | Bug | Où | Scénario |
|---|---|---|---|
| M1 | **Un sujet répétable réapplique ses effets à chaque clic** | `monde/dialogue.ts:69-80` (seuls les sujets `unique` disparaissent) | Dîme : « rejoindre » de Bram (+15), Aveline (+15), Perrine (+10) : cliquer cinq fois = confiance maximale, secrets à `attitudeMin` ouverts sans jet. `huguette:la-cle` donne une clé à chaque fois. 18 sujets concernés dans la Dîme ; aucun dans la Marche (ses sujets répétables n'ont que des faits et des quêtes). Le validateur ne dit rien. |
| M2 | **Un PNJ est à deux endroits à la fois** | `monde/presence.ts:26-31` (le lieu de base reste valable à toute heure, les `presences` s'ajoutent) | Brégor est au comptoir **et** en salle commune le soir ; Silas en salle commune **et** aux combles la nuit. 8 PNJ dans la Marche, 5 dans la Dîme. Les horaires n'en sont pas. |
| M3 | **Le délai de 24 h ne distingue pas le secret visé** | `monde/dialogue.ts:125` (clé `pnj:manière`) | Rater une persuasion « pour l'attitude » bloque la persuasion d'un secret, et l'inverse. |
| M4 | **Secret à prix : l'or est payé avant le jet, et perdu si le jet rate** | `monde/dialogue.ts:132-139` | Payer 20 po, rater, attendre 24 h, payer encore 20 po. |
| M5 | **Persuader sans limite après un succès** | `monde/dialogue.ts:153-157` (délai seulement après un échec) | +10 à chaque réussite ; avec l'Avantage (attitude ≥ seuil amical), l'échec devient rare et l'attitude file vers 100. |

Peu probable : un PNJ qui quitte le lieu à cause de l'heure pendant une conversation laisse une scène `dialogue` sans bouton « Fin du dialogue » (`modules/dialogue.ts:21-26, 149-151`) ; le temps ne passe en principe pas pendant une conversation.

### Interface et conteur

| # | Bug | Où | Certitude |
|---|---|---|---|
| I1 | **Touches 1-9 et Échap actives pendant que le conteur réfléchit** : l'action jouée est ensuite écrasée par le résultat du conteur, calculé sur l'ancienne partie | `EcranAventure.tsx:382-395` (ne teste pas `enCours`), `:332` | confirmé dans le code |
| I2 | **Confidences « couleur » sans mots tabous** : le contrôle de la parole libre ne protège que les faits (`sait`) | `modules/savoirs.ts:33-41` | confirmé (impact selon la bible envoyée au conteur) |
| I3 | Suggestions du conteur périmées après une action par bouton (« Parler à Hesta » reste affiché dans le lieu suivant) | `EcranAventure.tsx:157, 330, 460` | confirmé |
| I4 | Phrase d'ouverture retirée au hasard (et revoisée) à chaque rechargement ou réouverture | `EcranAventure.tsx:229-248` (`Math.random`) | probable |
| I5 | Un fait recopié tel quel par le conteur hors de `repondreEnPersonnage` n'est jamais enregistré comme appris | `conteur/tour.ts:133-138` | plausible |
| I6 | Une parole de PNJ sans guillemets (discours indirect) échappe à la vérification | `conteur/tour.ts:92, 146-148` | plausible |
| I7 | Un cri de compagnon coupe la voix d'un PNJ en cours | `voix.ts:55-57, 85` | plausible, faible impact |

## 2. Les données

| | Marche (publiée) | Dîme (brouillon) |
|---|---|---|
| PNJ / sujets (moyenne) | 14 / 60 (4,3) | 16 / 97 (6,1) |
| Sujets sans effet ni révélation | 30 % | 34 % |
| PNJ avec salutations variables | **1** | 16 |
| Sujets avec `attitudeMin` | 0 | 6 |
| Effets `attitude` dans les sujets | 2 | 26 |
| Conditions `heros` (classe, espèce, historique) | **0** | 2 |
| Conditions `reputation` / `parle` | 0 / 0 | 0 / 0 |
| Fiches de savoir (parole libre) | **0 sur 14** | 16 sur 16 |
| Secrets (avec jet / avec prix) | 7 (2 / 0) | 17 (5 / 3) |

Aucun sujet inatteignable. **La Marche, seule histoire publiée, est la plus pauvre en réactivité** : une seule salutation variable, aucune fiche de savoir (la parole libre n'y a rien pour s'appuyer), aucune réplique propre à un héros.

## 3. Pistes, par impact pour le joueur

| # | Piste | Constat | Effort |
|---|---|---|---|
| 1 | **Historique de la conversation à l'écran** | La boîte n'affiche que la dernière réplique ; le journal est caché pendant un dialogue (`EcranAventure.tsx:92-103, 452`) | moyen |
| 2 | **Attitude visible et retour des effets** | L'attitude existe (`Interlocuteur.attitude`) mais n'est jamais montrée ; un mot (« méfiant », « amical ») et « +10 », « Vous apprenez… » en surbrillance | petit |
| 3 | **Répliques enchaînées** (petits arbres) | Un sujet répond puis revient au menu ; pas de `suite` ni de sujet débloqué par un autre (hors condition) | moyen |
| 4 | **Jets dans les répliques** (`[Perspicacité DD 13]`, `[Histoire]`, `[Religion]`) | Seuls les secrets et les trois boutons d'influence ont un jet | moyen |
| 5 | **Répliques selon le groupe** (`[Nain]`, `[Barde]`, `[Acolyte]`) | La condition `heros` existe, presque pas utilisée ; l'interface ne marque pas ces choix | petit (moteur) + écriture |
| 6 | **Vrais horaires** | Corriger M2 : la présence déclarée remplace le lieu de base | petit |
| 7 | **Influence propre au PNJ** | Les trois répliques d'influence sont les mêmes pour tous (`modules/dialogue.ts:83`) ; DD seulement en infobulle | petit à moyen |
| 8 | **Compagnons qui réagissent en conversation** | Les interjections et cris ne servent qu'en exploration et en combat ; les `opinions` des compagnons ne sont lues que par le conteur | moyen |
| 9 | **PNJ qui abordent le groupe** (« Hé, vous ! ») | Aucun mécanisme : un événement « abordé par » à l'entrée d'un lieu | moyen |
| 10 | **Réputation de faction lue par les PNJ** | Elle existe dans le moteur, aucun PNJ ne la lit | petit (moteur) |
| 11 | **Dons et prix** (offrir, payer pour un service, marchander) | Seuls 3 secrets ont un prix | moyen |
| 12 | **Mémoire de ce qui a été dit** (condition `parle`, salutation de retour) | Inutilisé dans les deux mondes | petit |
| 13 | **Voix de la parole libre** | Les réponses générées sont muettes ; une voix à la volée serait payante (à décider) | gros |
| 14 | **Coût de la parole libre** | Au moins deux appels par réplique ; la fiche de scène renvoyée à chaque appel sans cache | moyen |

## 4. Pour les auteurs (validateur)

- Avis : sujet répétable avec `attitude`, `objet`, `xp`, `pieces` ou `jauge` (M1).
- Avis sur les `presences` d'un PNJ (un moment sans lieu déclaré), une fois M2 corrigé.
- Avis : `secret.attitudeMin` ignoré quand le secret a un `jet` (`dialogue.ts:131`).
- Avis de richesse : PNJ importants sans fiche de savoir (Marche : 0 sur 14), sans salutation variable.

## 5. Ordre conseillé

1. **Bugs, petits et sûrs** : M1 (un sujet à gain ne rapporte qu'une fois) + avis, M2, M3-M4 (délai par secret, payer seulement si le jet réussit, ou rembourser), M5 (délai après un succès aussi), I1, I3, I4.
2. **Ce qui se voit tout de suite** : attitude visible et effets mis en valeur (2), historique de la conversation (1).
3. **Profondeur** : jets dans les répliques (4), répliques selon le groupe (5), répliques enchaînées (3).
4. **Contenu de La Marche** : salutations variables, fiches de savoir, répliques propres aux héros.
