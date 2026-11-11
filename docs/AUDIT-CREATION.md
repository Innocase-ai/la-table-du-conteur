# Audit de la création de personnages (11/11/2026)

Deux auditeurs en lecture seule (règles et fiche, écran du créateur), les deux bugs les plus graves reproduits à nouveau par script.
Ce qui est déjà connu (multiclassage, dons généraux, grimoire, Arcanum, effets des options de classe…) est dans
`docs/AUDIT-REGLES-SRD.md` §7 et n'est pas répété. Les données SRD (tables de sorts et d'emplacements, dés de vie, jets de
sauvegarde, compétences, historiques, PX, PV, CA) ont été trouvées justes.

**Corrigés le 11/11/2026** : R1, R2, R3, E1, E2, E3, E4, E7 (tests `creation-correctifs.test.ts`, `apps/jeu/src/createur/brouillon.test.ts`). Restent : R4 à R8, E5, E6, E8 à E10 et les pistes.

## 1. Bugs des règles (`packages/regles/src`)

| # | Bug | Où | Scénario | Certitude |
|---|---|---|---|---|
| R1 | **La montée de niveau échoue et le héros reste bloqué** quand ses compétences diffèrent des recommandées | `creation/progression.ts:25-48` (`monterAuNiveau` repart des recommandations, pas des choix du joueur), `modules/progression.ts:66-99` | Un Barbare qui a pris d'autres compétences que celles conseillées : au niveau 3, « Compétence survie choisie deux fois », la montée échoue. Mesuré : **72 héros bloqués sur 288** (Barde, Magicien, Rôdeur, Roublard, Barbare). Le groupe passe quand même au niveau (`niveauGroupe = cible`), le héros ne le rattrape jamais. | reproduit |
| R2 | Même blocage avec les améliorations de caractéristique révisées à l'écran de montée (une valeur dépasserait 20) | `creation/recommandations.ts:165-185` | 6 cas sur 4 076 montées, vers les niveaux 12 à 16 | reproduit par l'auditeur |
| R3 | **Plantage en combat : un sort d'espèce lancé par un non-lanceur** | `creation/kit.ts:7`, `combat/creation.ts:201-205`, `combat/sorts.ts:150` (`lanceur.incantation!`) | Guerrier tieffelin (Bouffée de poison) : « Cannot read properties of undefined (reading 'bonusAttaque') ». La fiche n'a ni DD ni attaque pour les sorts d'espèce ou d'Initié chez un non-lanceur (le SRD fait choisir Int, Sag ou Cha). | reproduit |
| R4 | Aptitudes sans effet sur la fiche | données des classes (`effets: []`), `fiche.ts:520-524` | Barbare 20 (+4 For et Con, plafond 25), Moine 20 (+4 Dex et Sag), Roublard 15 (JS de Sag et Cha), Moine 14 (tous les JS), Paladin 6 (aura : Cha aux JS) | confirmé |
| R5 | Sorts en double acceptés : Initié et classe, préparé et accordé par la sous-classe | `fiche.ts:498-508` | Clerc 9 garde « soins » préparé alors que son domaine l'accorde (une place perdue) | confirmé |
| R6 | Prérequis des options de classe non vérifiés (texte seulement) | `fiche.ts:302-316` | Occultiste 2 avec des manifestations de niveau 9 accepté | confirmé, faible impact |
| R7 | Le Barde n'ajoute pas Touche-à-tout à l'initiative | `fiche.ts:544` | Barde 5 : +2 au lieu de +3 | probable |
| R8 | « Tirage » : six 18 acceptés, aucune trace du tirage | `fiche.ts:155-156` | triche possible | confirmé, faible impact |

## 2. Bugs de l'écran (`apps/jeu/src`)

| # | Bug | Où | Certitude |
|---|---|---|---|
| E1 | **Le groupe est effacé s'il devient illisible** : `chargerGroupe` rend un groupe vide sans message, et la sauvegarde automatique l'écrit aussitôt par-dessus | `groupe/stockage.ts:7-16`, `App.tsx:75` | confirmé |
| E2 | **Le héros en cours n'est jamais sauvegardé** : un rechargement fait perdre 8 écrans de choix | `createur/Createur.tsx:62` | confirmé |
| E3 | « Quitter » n'existe qu'au premier écran ; en modification, 7 « Retour » pour annuler ; pas d'Échap | `Createur.tsx:90-95` | confirmé |
| E4 | Changer de classe garde les caractéristiques de l'ancienne (un Magicien avec Force 15 et le bonus sur Force) | `brouillon.ts:227-230`, `Caracteristiques.tsx:122` | confirmé |
| E5 | Création rapide : toujours une femme, toujours le portrait n° 1 ; deux héros de même espèce sont identiques ; écrase les choix sans demander | `brouillon.ts:50, 282` | confirmé |
| E6 | Alignement conseillé toujours Neutre bon, quelle que soit la classe | `Createur.tsx:123` | confirmé |
| E7 | « Modifié » vrai dès l'écran des caractéristiques : la fenêtre d'abandon s'ouvre sans rien avoir changé | `Caracteristiques.tsx:118-138` | confirmé |
| E8 | Les erreurs du moteur n'apparaissent qu'au récapitulatif, sans lien vers l'écran à corriger | `Createur.tsx:76`, `Recapitulatif.tsx` | confirmé |
| E9 | Tutoiement (« Choisis », « Donne un nom ») mêlé au vouvoiement | `creation/exigences.ts:147-149`, `brouillon.ts:150-172` | confirmé |
| E10 | Petits défauts : message « Pour continuer » tronqué, raison d'une option grisée illisible au clavier, ✓ d'étape restant après un retour, « Niveau du groupe » qui ne change que les futurs héros | divers | confirmé |

Aucun test ne couvre `brouillon.ts` (changements d'espèce, de classe, création rapide).

## 3. Recommandations (choix « conseillés »)

- **L'Initié à la magie prend les meilleurs sorts, qui ne sont pas jouables en combat** : Hilda (Clerc) met Flamme sacrée dans l'Initié et n'a plus de mineur offensif ; Ambrine (Magicien) y met Trait de feu, Rayon de givre et Projectile magique. Il faut l'inverse : l'Initié prend les sorts utilitaires, la classe les sorts jouables.
- **Au-delà du niveau 3, les sorts sont pris par ordre alphabétique** : un Magicien de niveau 9 n'a ni Contresort, ni Vol, ni Hâte, ni Boule de feu garantis.
- Groupe conseillé équilibré (PV, CA, Perception), mais Hilda prend Protecteur sans armure lourde, Ambrine reste à CA 11, trois héros ont des dons sans effet en jeu.

## 4. Pistes, par impact pour le joueur

| # | Piste | Effort |
|---|---|---|
| 1 | **Montée fiable** : compléter seulement ce qui manque à partir des choix du joueur (R1, R2), et ne jamais laisser un héros derrière (écran de choix si un niveau demande une décision) | moyen |
| 2 | **Sauvegardes sûres** : garder une copie d'un groupe illisible et prévenir (E1) ; sauvegarder le héros en cours (E2) ; bouton « Annuler » sur chaque écran (E3) | petit |
| 3 | **Sorts d'espèce et d'Initié jouables** : caractéristique d'incantation choisie, DD et attaque (R3) | petit à moyen |
| 4 | **Meilleurs conseils de sorts** : Initié utilitaire, sorts de classe jouables, listes conseillées jusqu'au niveau 9 | petit |
| 5 | **Création rapide variée** : sexe et portrait au hasard sans doublon, « Tout au hasard », alignement selon la classe ; « Compléter le groupe » avec le rôle qui manque (tank, soigneur, dégâts, soutien) | petit |
| 6 | **Aperçu de la fiche en direct** sur tous les écrans (PV, CA, attaques, sorts) : `ficheApercu` existe déjà | moyen |
| 7 | **Guidage du débutant** : classes « faciles », filtre « jouable en combat » dans les sorts (la plupart affichent « non jouable »), équipement résumé (« armure lourde, CA 16 » au lieu d'« Option A ») | petit à moyen |
| 8 | **Aptitudes manquantes** sur la fiche (R4) et validation (R5, R6, R7) | petit |
| 9 | **Export / import d'un seul héros** (réutiliser un héros d'une histoire à l'autre) ; retouche rapide du nom et du portrait | petit |
| 10 | **Petit écran** : le créateur n'a aucune règle pour les écrans étroits (deux colonnes fixes) | moyen à gros |
| 11 | Outils et langues (absents de la fiche), Initié pour tous les historiques, plus de portraits (bibliothèque commune ou portrait du joueur) | moyen |

## 5. Ordre conseillé

1. R1-R2 (montée bloquée) et R3 (plantage) : ce sont les seuls qui cassent une partie.
2. E1 à E4 (pertes de données et caractéristiques héritées), puis E5-E7.
3. Conseils de sorts (piste 4), création rapide variée (5).
4. Aperçu en direct, guidage, aptitudes manquantes.
