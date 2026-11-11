# Audit du reste du moteur de jeu (11/11/2026)

Trois auditeurs en lecture seule (exploration et monde ; objets et économie ; noyau, sauvegardes et architecture), les
constats graves revérifiés dans le code. Déjà audités ailleurs : combat (`AUDIT-COMBAT.md`), conversations
(`AUDIT-DIALOGUES-PNJ.md`), création (`AUDIT-CREATION.md`), règles SRD (`AUDIT-REGLES-SRD.md`), quêtes (JOURNAL du 11/11).

**Bonne nouvelle d'abord** (mesuré sur 3 400 actions au hasard dans les deux mondes) : le noyau est sain. Une commande refusée
ne change rien, le monde n'est jamais modifié, la partie se recharge à l'identique, le hasard est reproductible, aucune
exception. Une sauvegarde pèse ≈ 110 à 120 Ko (journal borné à 600 événements), loin de la limite du navigateur. Une action
coûte moins d'une milliseconde. La liste d'outils du conteur est stable.

**Corrigés le 11/11/2026** : S1, S2, S3, S4 (export/import depuis l'écran titre), S5 ; X1 à X7 ; O1 à O4 (tests `moteur-jeu-correctifs.test.ts`, `apps/jeu/src/aventure/sauvegardes.test.ts`). Restent : S6, X8, X9, O5, O6 et les pistes 4 à 12.

## 1. Sauvegardes et robustesse (produit vendu)

| # | Problème | Où | Certitude |
|---|---|---|---|
| S1 | **Une seule sauvegarde, écrasée sans prévenir par une nouvelle histoire** | `App.tsx:222`, `aventure/partie.ts:86` (une clé) | confirmé |
| S2 | **Échec d'écriture ignoré** (stockage plein ou indisponible) : la partie continue, tout est perdu à la fermeture | `App.tsx:93-97` jette le booléen de `sauverPartie` | confirmé |
| S3 | **Aucun filet contre une erreur** : ni try/catch dans `executer`, ni ErrorBoundary ; un clic qui plante ne fait rien, un rendu qui plante donne un écran blanc, sans message ni rapport | `noyau/moteur.ts:82-100`, `apps/jeu/src` | confirmé |
| S4 | Pas d'export ni d'import de la partie ; sous Tauri elle vit dans le stockage du navigateur intégré (perdue à une réinstallation) | `apps/bureau/src-tauri/src/lib.rs` | confirmé |
| S5 | Une sauvegarde abîmée est mal reconnue (sans `version` : acceptée telle quelle ; sans `exploration` : erreur obscure) et n'est pas mise de côté comme le groupe | `noyau/migrations.ts:19-22`, `moteur.ts:135-143` | rapporté, non revérifié |
| S6 | Le journal affiché n'est pas borné en mémoire (des milliers de paragraphes après des heures) | `EcranAventure.tsx:469` | confirmé par lecture |

## 2. Exploration et monde

| # | Bug | Où | Certitude |
|---|---|---|---|
| X1 | **Trois mauvaises réponses à une énigme de la Dîme mènent à la fin d'échec** : aucune limite d'essais, l'échec fait monter la jauge à chaque fois | `monde/exploration.ts:818-855`, `dime-des-roseaux/enigmes` | reproduit |
| X2 | **Le repos court ne prend aucun temps** et se répète sans fin (Second souffle, emplacements de l'Occultiste… illimités, horloges contournées) ; le SRD dit une heure | `exploration.ts:911-916` | confirmé |
| X3 | **Un palier de jauge se déclenche aussi en descendant** : dans la Dîme, payer le péage raconte « La patrouille, les hobgobelins doublent le péage » | `exploration.ts:177` | confirmé (choix de code à trancher) |
| X4 | La condition « rencontre faite » est vraie après une fuite ou une défaite | `monde/etat.ts:172` | confirmé |
| X5 | Une fouille refusée (héros inconnu ou à 0 PV) consomme la fouille du jour | `exploration.ts:504-513` | confirmé |
| X6 | Le repos long fait sauter un jour entier quand on dort à 2 h du matin ; une nuit interrompue à 3 h compte 29 h | `exploration.ts:899-908` | reproduit |
| X7 | Un groupe tombé à 0 PV hors combat (piège) ne peut plus rien faire sauf marcher jusqu'à un lieu sûr | `exploration.ts:670`, `personnage.ts:95` | reproduit |
| X8 | Après une fuite ou une défaite, le groupe reste à côté des monstres ; un événement à choix quitté sans choisir se rouvre sans cesse ; l'heure s'affiche « 9.5 » après un trajet d'1,5 h | divers | plausible |
| X9 | Latents (aucune donnée touchée) : événement non unique joué 10 fois par action, butin redonné par une rencontre répétable | `exploration.ts:204-210, 983-991` | reproduit en forçant |

La Marche n'a ni jauge, ni événement, ni fin : X1 à X3 ne touchent que la Dîme.

## 3. Objets et économie

| # | Bug | Où | Certitude |
|---|---|---|---|
| O1 | **Une clé peut être jetée** (seuls les objets de quête sont protégés) : le grenier de Mireval devient fermé pour toujours | `modules/inventaire.ts:268` | reproduit |
| O2 | **Harmonisation contournée** : armure, bouclier et armes harmonisés ne comptent pas (5 objets harmonisés acceptés) | `modules/equipement.ts:31` | confirmé |
| O3 | **Or à virgule** jamais arrondi : après trois repas à 1 pa, le quatrième est refusé (« le groupe n'a que 10 pc ») | `monde/etat.ts:204` | reproduit |
| O4 | **Service payé sans effet** : soins payés groupe en pleine forme, identification sans rien à identifier | `modules/commerce.ts:147-160` | confirmé |
| O5 | Les objets magiques génériques du SRD (Arme +1, Armure +1…) ne s'équipent pas | `equipement-regles.ts:19` | latent (aucun monde ne les place) |
| O6 | Un objet équipé est invisible aux conditions `{objet}` et aux effets qui le retirent ; il ne peut pas être identifié | `etat.ts:163, 201` | latent |

**Équilibre** :
- La Marche : 232 po au départ pour un stock total des boutiques d'environ 100 po (ni armure, ni arc, ni potion) ; presque rien ne se revend (seul Torben rachète les armes) ; les quêtes ne versent pas d'or. L'or n'a pas d'usage.
- XP : La Marche donne ≈ 1 500 à 1 800 PX par héros pour 900 visés ; la Dîme ≈ 4 700 pour 300 (niveau 2 maximum) : plus de 90 % sont perdus.
- Sur 318 objets magiques du SRD, 49 ont un effet chiffré ; 74 consommables sur 79 ne font rien une fois bus ; les 65 objets à charges (baguettes, anneaux) ne s'utilisent pas ; seule la potion de soins simple marche en combat.

## 4. Pistes, par impact pour le joueur

| # | Piste | Effort |
|---|---|---|
| 1 | **Sauvegardes sûres** : plusieurs emplacements, sauvegarde auto séparée de la manuelle, confirmation avant d'écraser (S1), alerte si l'écriture échoue (S2), export/import de la partie (S4), sauvegarde illisible mise de côté (S5) | moyen |
| 2 | **Filet de sécurité** : erreur du moteur transformée en refus « erreur interne », écran d'erreur avec « sauver et copier le rapport » (S3) | petit |
| 3 | **Bugs qui bloquent ou faussent une partie** : X1 (limite d'essais), X2 (repos court = 1 h), X3, X4, X5, X6, X7, O1, O2, O3, O4 | petit chacun |
| 4 | **Annuler la dernière action** : le moteur garde déjà la partie d'avant ; une pile de quelques parties suffit | petit |
| 5 | **Objets magiques vivants** : utiliser une charge (baguettes, anneaux) et recharge à l'aube, effets simples des potions (état, bonus temporaire), potions de soins supérieures en combat | moyen à gros |
| 6 | **Économie de La Marche** : boutiques avec armures, arcs, potions ; rachat des gemmes et objets d'art ; de l'or dans les récompenses de quête ; XP de la Dîme à revoir | petit (données) |
| 7 | **Le temps qui passe** : verbe « attendre », la fouille et les énigmes qui prennent du temps, heure affichée en heures et minutes | moyen |
| 8 | **Jauge lisible** : « +1 » montré à chaque cause, avertissement avant une énigme qui coûte | petit |
| 9 | **Exploration plus riche** : discrétion et repérage des monstres, lumière et obscurité (mines, cryptes), rencontres de route par zone, voyages avec rations | moyen à gros |
| 10 | **Sac** : comparer deux objets, trier et filtrer, poids qui ralentit, marchandage, objets maudits | moyen |
| 11 | **Outillage** : un lint, `pnpm typecheck` qui couvre aussi le jeu, test d'une vieille sauvegarde figée, test d'une réaction qui plante | petit |
| 12 | **Accessibilité et confort** : taille du texte, réduction des animations, difficulté réglable | moyen |

## 5. Ordre conseillé

1. Filet de sécurité (S3) et sauvegardes sûres (S1, S2, puis S4-S5) : ce sont les pertes de partie du joueur.
2. Les petits bugs qui bloquent : O1, X1, X5, X7, X2, puis X3, X4, X6, O2, O3, O4.
3. Annuler la dernière action, jauge lisible, temps qui passe.
4. Économie et objets magiques (données de La Marche d'abord).
