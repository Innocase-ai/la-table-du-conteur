# M4 — Le conteur : plan

Objectif du PRD : **un lieu court jouable de bout en bout** avec le maître de jeu (le conteur), l'arbitre et les illustrations ; critère : **une partie d'une heure sans incohérence de règles**.

Principe inchangé : **le conteur propose, le moteur décide.** Le conteur (Claude) comprend ce que veut le joueur, raconte et fait parler les PNJ ; il ne change jamais l'état de la partie lui-même. Il passe par des **verbes** (des outils) que le moteur valide, résout (jets, règles, effets du monde) et applique. Le résultat lui revient, et il le raconte.

## 1. Un tour de jeu

```
Joueur : « Je fouille le cellier, et Pip regarde si le coffret est piégé. »
   │
   ▼
Serveur : fiche de scène (lieu courant, sorties, PNJ présents, quêtes, état du groupe)
          + l'action du joueur  ──►  Conteur (Claude, outils)
   │
   ├─► fouiller({ lieu: "vei-cellier-du-bailli", personnage: "pip" })
   │      moteur : jet d'Investigation de Pip (d20 + bonus) contre les DD cachés du lieu
   │      → « coffret repéré ; piège vei-p-aiguille-du-coffret repéré (DD 13, jet 17) »
   ├─► desarmer({ piege: "vei-p-aiguille-du-coffret", personnage: "pip" })
   │      moteur : Escamotage + outils de voleur contre DD 13 → réussite
   ├─► proposer_actions([ « Ouvrir le coffret », « Remonter voir le bailli », … ])
   ▼
Récit en streaming : « Pip s'agenouille devant le coffret… une aiguille noire… »
Client : récit, image du lieu, jets affichés, boutons d'actions suggérées + saisie libre
```

Les jets sont toujours faits par le moteur, avec les vraies fiches des personnages. Le conteur ne voit que leurs résultats.

## 2. Les verbes (outils du conteur)

Deux familles : **consulter** (lecture, sans effet) et **agir** (le moteur vérifie, lance les dés, applique). Chaque outil a un schéma Zod strict ; une entrée invalide ou une action impossible revient au conteur comme une erreur expliquée (« la porte est verrouillée, DD 22, clé : clé du sceau »), qu'il raconte ou contourne.

| Verbe | Entrée | Ce que fait le moteur |
| --- | --- | --- |
| `consulter_lieu`, `consulter_pnj`, `consulter_objet`, `consulter_quete` | id | Renvoie la fiche (y compris les secrets, réservés au conteur) |
| `aller` | lien (vers) | Vérifie que le lien part du lieu courant, est découvert, que sa condition est vraie et qu'il est ouvert ; déplace le groupe ; déclenche l'entrée : rencontres `entree`, événements `entree-lieu`, faits automatiques, jauges `lieu` |
| `fouiller` | cible (lieu, trésor, lien), personnage, compétence | Jet contre les DD des trésors cachés, passages secrets et pièges du lieu ; révèle ce qui est trouvé. La perception passive des héros s'applique sans jet en entrant |
| `ouvrir` | cible (lien ou trésor), personnage, méthode (`cle`, `crocheter`, `forcer`) | Clé possédée : ouvre. Sinon Escamotage (outils de voleur) ou Athlétisme contre le DD du verrou ; un échec peut déclencher le piège lié |
| `desarmer` | piège, personnage | Jet de la compétence du piège (avec l'outil requis) ; un échec franc le déclenche |
| `declencher_piege` | piège | Sauvegarde, dégâts, états, effets (quand le groupe tombe dedans) |
| `prendre` | trésor | Pièces, objets, tirages sur les tables de butin → inventaire |
| `parler` | PNJ, sujet (id) | Vérifie présence, état et attitude ; renvoie la réponse du sujet, révèle ses faits, applique ses effets, le marque s'il est unique. Le conteur choisit le sujet d'après ce que dit le joueur |
| `persuader` (aussi intimider, tromper) | PNJ, compétence, ce qui est demandé | Jet contre un DD tiré de l'attitude (ou du secret visé) ; succès : attitude, secret révélé, service rendu ; échec : attitude en baisse |
| `test` | personnage, compétence ou caractéristique, DD (5 à 30), raison | Jet générique pour ce que les données ne prévoient pas (escalader, nager, se souvenir). **Aucun effet de monde** : seul le récit en dépend |
| `repondre_enigme` | énigme, réponse | `verifierEnigme` ; récompense ou échec définis par l'énigme |
| `commercer` | PNJ, acheter / vendre, objet | Stock, prix, rachat, pièces |
| `se_reposer` | court / long | Selon le lieu (sûr, dangereux, impossible) : soins, emplacements, jauges `repos-long`, rencontre éventuelle |
| `combattre` | rencontre | Le client bascule sur l'écran de combat ; l'issue (victoire, fuite, PV, morts, butin, `effetsVictoire`) revient au conteur |
| `proposer_actions` | 2 à 4 courtes actions | Boutons affichés sous le récit (la saisie libre reste toujours possible) |

Après chaque action, le moteur fait avancer les quêtes (`avancerQuetes`) et regarde si une fin se déclenche. Les narrations des effets du monde (`narration`) sont rendues au conteur, qui les reformule.

**Ce que le conteur ne peut pas faire** : donner un objet ou des pièces hors des trésors, boutiques et récompenses ; changer une attitude sans jet ou sans effet de données ; ouvrir ce qui est fermé sans clé ni jet ; faire réussir un jet ; ressusciter (règle du Val) ; révéler un secret dont la condition n'est pas remplie.

## 3. Ce que le conteur reçoit

Le monde complet du Val des Cendres pèse environ 1,15 Mo de JSON (plus de 300 000 tokens) : il ne peut pas être envoyé à chaque tour. On sépare donc :

- **Préfixe fixe, mis en cache** (prompt caching) : le rôle du conteur et ses règles de conduite, la charte (ton, interdits, « jamais de magie de résurrection »…), la **bible** du monde (`BIBLE.md`), `monde.json` et la définition des outils. Il ne change pas de toute la partie, donc il est relu pour 5 % du prix normal (0,20 $ au lieu de 4 $ le million de tokens).
- **Fiche de scène**, construite par le moteur à chaque tour : le lieu courant (description, ambiance, sorties découvertes), les PNJ présents (attitude, état), ce qui a été trouvé ici, les quêtes actives et leurs étapes, les faits connus utiles, les jauges, l'état du groupe (PV, ressources), le moment de la journée.
- **Le reste à la demande**, par les outils `consulter_*`.
- **Mémoire** : les derniers tours en entier, plus un résumé tenu par le moteur (journal des événements). Au-delà, compaction de l'historique.

## 4. Technique

- **Serveur local** (`apps/serveur`, Node) : il tourne **sur la machine du joueur** (lancé avec le jeu), tient la partie (état du monde, groupe), appelle le conteur avec la clé du joueur et diffuse le récit au client en streaming. En développement, il lit les clés dans `.env` (ignoré par git).
- **`packages/conteur`** : prompts, schémas des outils, construction de la fiche de scène, boucle de tour. Les verbes eux-mêmes sont **du moteur** (`packages/regles/src/monde/`), en code pur testé, utilisables sans LLM.
- **SDK** : `@anthropic-ai/sdk` en TypeScript, outils définis avec Zod (`betaZodTool`) et boucle par le tool runner du SDK ; streaming du texte ; `strict: true` sur les outils.
- **Modèle, au choix du joueur** : Claude Opus 5.5 (`claude-opus-5-5`, 4 $ / 20 $ par million de tokens en entrée / sortie, lecture du cache 0,20 $), Claude Sonnet 5.5 (2 $ / 10 $) ou Claude Haiku 5.5 (0,10 $ / 0,50 $), avec le coût estimé de chacun affiché. Réflexion adaptative, effort réglé pour un rythme de jeu fluide (à mesurer : `low` ou `medium`). Repli automatique en cas de refus par les filtres de sécurité (`fallbacks: "default"`), utile pour un monde sombre plein de morts-vivants.
- **Coût mesuré dès le premier prototype** : chaque tour enregistre ses tokens (`usage`) et son coût ; les hypothèses de l'estimation (§ 8) sont recalées sur ces mesures.
- **Images** : celles du monde (lieux, PNJ, monstres, objets) via le manifeste, affichées au fil du récit. Les scènes avec le groupe (portraits choisis en référence) viennent plus tard (illustrateur, après M4).
- **Journal de partie** : chaque tour est enregistré (action, fiche de scène, appels d'outils, jets, récit, coût). C'est la matière pour déboguer et évaluer.

## 5. L'écran d'exploration

- **Grand panneau image** : le lieu courant, ou le PNJ à qui l'on parle.
- **Récit** qui défile en streaming, avec les **jets** affichés en clair (« Pip — Investigation : 17 contre DD 13, réussi »).
- **Actions suggérées** en boutons, et une **saisie libre** toujours disponible.
- **Panneau du groupe** : portraits choisis, PV, états ; clic → fiche.
- **Journal de quêtes**, **inventaire**, **carte** des lieux visités (graphe des liens découverts).
- Bascule vers l'**écran de combat** quand un combat commence, et retour au récit avec l'issue.

## 6. Étapes

| Étape | Contenu | Fini quand |
| --- | --- | --- |
| **M4a — Moteur d'exploration** (sans LLM) | Les verbes en code pur dans le moteur, avec jets réels sur les fiches du groupe ; fiche de scène ; tests sur le mini-monde et le Val des Cendres (traverser Veillecendre, ouvrir le coffret piégé, parler à Nério, résoudre une énigme) | Tous les verbes testés ; un parcours scripté du Val se joue sans LLM |
| **M4b — Le conteur** | `apps/serveur`, `packages/conteur`, prompts, outils, cache, streaming, clés et plafond de dépense ; `pnpm conteur` pour jouer dans le terminal | Une scène jouée au terminal ; journal de partie et coût par tour mesurés |
| **M4c — L'écran d'exploration** | Le client : récit, image, actions, groupe, journal ; écran Options (clés, modèle, plafond) ; branchement du combat ; « Commencer l'aventure » activé | Veillecendre jouable dans le navigateur |
| **M4d — Sauvegarde** | Sauver et reprendre une partie (état du monde, groupe, résumé) ; « Continuer » sur l'écran titre | Reprise d'une partie sans perte |
| **M4e — Partie test** | Une heure de jeu réelle à Veillecendre, relue tour par tour | Critère du PRD : aucune incohérence de règles |

## 7. Clés d'API du joueur (jeu vendu)

Le jeu est vendu ; **chaque joueur utilise ses propres clés** et paie lui-même ses appels. Nous ne revendons pas d'API et ne voyons jamais ses clés.

- **Deux clés** : Anthropic (obligatoire, pour le conteur) et OpenRouter (facultative, pour les images du groupe en cours de partie ; sans elle, le jeu n'affiche que les images livrées avec le monde, qui sont gratuites).
- **Écran « Options »** (et premier lancement d'une histoire) : coller la clé, bouton « Tester » (appel gratuit à la liste des modèles), choix du modèle du conteur avec son coût estimé, plafond de dépense.
- **Où la clé est gardée** : dans l'application de bureau (Tauri ou Electron, prévue au PRD), dans le trousseau sécurisé du système (Keychain, Credential Manager, Secret Service), jamais en clair sur le disque ni dans le navigateur. Elle ne part que vers Anthropic ou OpenRouter, depuis le serveur local.
- **Garde-fous de dépense** : compteur de dépense en direct (calculé depuis `usage` de chaque réponse), plafond par session et par histoire choisi par le joueur, avertissement avant de le dépasser, pause automatique au plafond.
- **Erreurs claires** : clé invalide, crédit épuisé, limite de débit (on attend et on réessaie), service indisponible (on sauvegarde et on propose de reprendre).
- **À vérifier avant la vente** : les conditions d'utilisation d'Anthropic et d'OpenRouter pour une application où l'utilisateur fournit sa clé, et la mention claire au joueur que ses échanges avec le conteur passent par ces services.

## 8. Coût d'une campagne pour le joueur

Chaque histoire affiche sa **durée** et son **coût d'API estimé** pour la finir, par modèle (écran « Choisir une histoire »). Le calcul est dans le moteur (`packages/regles/src/monde/estimation.ts`) ; `pnpm monde estimer` écrit `packages/mondes/<monde>/estimation.json`, qu'un test garde à jour.

- **Tours de conteur** déduits du contenu : 1,5 par lieu (85 % des lieux visités), 3 par PNJ, 2 par combat (mise en scène et issue ; le combat lui-même est local et gratuit), 4 par autre rencontre ou énigme, 1,5 par piège, 0,5 par trésor, 3 par quête, 1 par événement, plus 15 % de marge ; 45 tours par heure, 12 minutes par combat.
- **Un tour** : 2,5 appels ; à chaque appel 15 000 tokens relus du cache et 3 000 nouveaux ; 900 tokens produits.
- **Images du groupe** : une tous les 12 tours, à 0,009 $.

Le Val des Cendres (151 lieux, 63 PNJ, 47 combats, 23 quêtes, 18 énigmes) : **918 tours, environ 30 h** (20,5 h de récit, 9,5 h de combats) ; **≈ 51 $ avec Opus 5.5, ≈ 29 $ avec Sonnet 5.5, ≈ 4,5 $ avec Haiku 5.5** (± 30 %), plus ≈ 0,7 $ d'images. Ces chiffres sont **provisoires** : ils seront recalés sur les mesures de M4b et M4e.

## 9. Décisions à prendre

1. **Clé Anthropic de développement** : à créer sur console.anthropic.com et à mettre dans `.env` (`ANTHROPIC_API_KEY=…`) ; nécessaire à partir de M4b.
2. **Modèle conseillé par défaut au joueur**, une fois les coûts mesurés : la qualité du récit d'Opus 5.5 vaut-elle son prix face à Sonnet 5.5 ou Haiku 5.5 ? À trancher sur des parties réelles.
3. **Application de bureau** (Tauri ou Electron) : nécessaire pour vendre le jeu avec un serveur local et un trousseau sécurisé ; à prévoir après M4.
