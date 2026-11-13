---
name: creer-marchands-compagnons
description: Écrire ou régler les marchands, les services et les compagnons de voyage d'un monde de « La Table du Conteur » : boutiques (stock, prix, tables, rachat, types), services payants qui ont un effet en jeu (nuit, soins, identification), présences des PNJ selon l'heure, et le compagnon qui voyage avec le groupe (escorte, interjections, approbation, quête personnelle). À utiliser quand on crée un hub, une auberge, une forge, un temple, un marché, qu'on veut « des marchands », « pouvoir dormir / se soigner / identifier », « un PNJ qui nous accompagne », « un compagnon », ou que le validateur donne un avis de richesse sur les marchands ou les compagnons. Complète `creer-monde` (zones), `creer-personnages` (profondeur du compagnon) et `creer-pieges-tresors` (objets et prix).
---

# Marchands, services et compagnons

Le hub vit par ses marchands et ses services : c'est là que le joueur dépense ce qu'il a trouvé, se soigne, dort, et revient. Un compagnon qui voyage donne une voix et une opinion à l'aventure. Le moteur gère tout cela à condition que les données soient écrites **comme il les lit** : un service nommé « lit » ne fait pas dormir ; un bloc `compagnon` sur un PNJ ne le fait pas voyager.

Format : `packages/regles/src/monde/schemas.ts` (`Pnj` : `boutique`, `services`, `presences`) et le module `packages/regles/src/modules/commerce.ts` ; les interjections : `packages/regles/src/monde/interjections-donnees.ts`.

## Les marchands (`Pnj.boutique`)

**Modèles de boutique** : `boutique.modele` prend un modèle commun (`apothicaire`, `alchimiste`, `arcaniste` pour les parchemins, `magasin-general`, `forgeron` : `packages/regles/src/monde/butin-commun.json`) dont le stock s'ajoute au `stock` du PNJ ; le `rachat` reste le sien, les `types` rachetés viennent du modèle s'il n'en écrit pas. Pour un marchand secondaire, le modèle suffit.

Pendant une conversation avec un PNJ qui a une boutique, ses articles, ce qu'il rachète et ses services s'affichent à côté du dialogue.
- **`stock`** : `{ objet, quantite, prix? }`. Sans `prix`, l'objet coûte sa valeur (`valeurPo` du catalogue SRD ou de l'objet du monde). Les quantités sont **limitées** : ce qui est acheté ne revient pas.
- **`tables`** : les objets des tables de butin citées sont aussi en vente (un de chaque).
- **`rachat`** : la part de la valeur payée pour un objet du sac (0,5 par défaut) ; **0 = il n'achète rien**. **`types`** : les catégories qu'il rachète (vide = tout). Un objet de quête n'est jamais racheté.
- Cite les objets ordinaires par leur **id du catalogue SRD** (armes, armures, matériel, potions) ; vérifie l'id (`grep -l '"id": "…"' packages/donnees/srd/objets/*.json`).

**Concevoir** : 3 marchands par chapitre au moins (avis « Richesse »), chacun avec **une spécialité** qui dit le lieu (le forgeron rachète les armes et les armures, pas les herbes ; l'herboriste vend des potions et des simples) ; un stock court et lisible (6 à 12 lignes), une ou deux pièces rares en petite quantité pour donner un objectif ; des prix au catalogue sauf raison (pénurie, monopole : dis-le dans un sujet du PNJ).

## Les services (`Pnj.services`)

`{ id, nom, resume, prix, condition?, effets? }` : le prix est payé, le `resume` raconté, les `effets` appliqués. **L'id décide de l'effet en jeu** (`modules/commerce.ts`) :

| L'id contient | Effet |
| --- | --- |
| `chambre`, `dortoir`, `hospitalite`, `abri` ou `refuge` | une **nuit de repos** (repos long), même dans un lieu où l'on ne pourrait pas dormir |
| `soin`, `guerison`, `purge` ou `veillee-des-malades` | les **PV** de tout le groupe au maximum |
| `identification` | les objets du sac à étudier sont **identifiés** |
| tout autre id (`reparation`, `rumeurs`, `passage`…) | seulement le texte et les `effets` que tu écris |

Un service « rumeurs » utile révèle un fait par ses `effets` (`{ "fait": "<id>" }`) ; un passeur pose un drapeau qui ouvre un lien (`condition` du lien). La `condition` d'un service le rend **indisponible** tant qu'elle est fausse : le joueur le voit, grisé (une chambre réservée aux amis de la guilde : c'est aussi une promesse).

`Lieu.services` (une liste de mots sur le lieu) n'est qu'un affichage dans la fiche de scène : **il ne donne aucun service**. Le service est toujours porté par un PNJ.

## Où et quand on trouve un PNJ (`Pnj.presences`)

Un PNJ est dans son `lieu`, **sauf** aux moments où il a une présence : `presences` le met ailleurs selon le **moment** (`jour` 6 h-17 h, `soir` 18 h-21 h, `nuit`) et une `condition` facultative, et cette présence **remplace** son lieu habituel (depuis le 11/11/2026 ; avant, il était aux deux endroits à la fois). Exemple : l'aubergiste a `lieu` = l'auberge et une présence `jour` au marché : le jour il est au marché seulement, le soir et la nuit à l'auberge. Plusieurs présences au même moment = plusieurs lieux possibles. Un PNJ **déplacé** par un effet `deplacer` n'est plus que là, à toute heure. Ses services et sa boutique le suivent. Utile pour qu'un marchand ne soit pas joignable à toute heure, ou pour un rendez-vous de nuit ; dans les tests, `lieuxDuPnjMaintenant(partie, pnj)` dit où le trouver.

## Le compagnon qui voyage

**Ce qui marche aujourd'hui** (éprouvé avec Nolwen dans la Citadelle) :
- **L'escorte** : l'effet `{ "escorte": { "pnj": "<id>" } }` (posé par un sujet, une quête, un événement) fait **suivre** le groupe : le PNJ est présent dans tous les lieux, on peut lui parler partout ; `{ "escorte": { "pnj": "<id>", "actif": false } }` le laisse là où il est. **Il ne combat pas** : le combat ne connaît que les héros.
- **Les interjections** (`interjections/`) : de courtes phrases qu'il lance de lui-même quand une condition devient vraie (un lieu, un fait, une quête, un choix de dilemme, un palier de jauge) ; leurs `effets` (`attitude`) font **l'approbation**. 12 à 20 pour un compagnon qui voyage tout le chapitre.
- **Sa profondeur** (fiche de savoir, liens, confidences verrouillées) : skill `creer-personnages` (brief `references/brief-compagnon.md`, exemple de Nolwen).
- **Sa quête personnelle** : une quête `personnelle`, donnée par un sujet, dont une étape lit son attitude (`{ "pnj": { "id", "attitudeMin" } }`).
- **Ses salutations variables** (`salutations.variantes`) : il se souvient des choix.

**Ce qui ne marche pas encore** : le bloc `Pnj.compagnon` (recrutement, classe, niveau, répliques, opinions) **n'est lu par aucune partie du jeu** ; il n'y a pas de compagnon jouable qui rejoint le groupe. N'en écris pas pour un nouveau monde. L'avis du validateur « Richesse : 0 compagnons recrutables » compte ce bloc : il ne dit rien de la qualité du monde tant que le recrutement n'existe pas (le vrai compte est celui des PNJ escortés).

**Concevoir** : un ou deux compagnons par chapitre, avec **un désir** qui croise l'intrigue (le joueur le sent par les interjections), **une limite** (un lieu où il refuse d'aller, une condition d'escorte qui peut se rompre : `escorte` `actif: false` posé par un choix), et **un moment** (un dilemme ou une fin qui le touche). Écris ses interjections **après** les dilemmes, pour qu'il puisse réagir aux choix.

## Vérifier
- [ ] `pnpm monde valider <id>` : pas d'id d'objet inconnu dans un stock ; avis « Richesse » sur les marchands lu.
- [ ] Chaque service qui doit **faire** quelque chose a un id reconnu (tableau ci-dessus) ou des `effets`.
- [ ] Le hub a au moins une nuit (service ou lieu `repos: "sur"`), des soins, une identification si le monde a des objets à identifier.
- [ ] **Joue-le** : acheter, vendre, payer une chambre (le jour avance, les PV remontent), prendre le compagnon en escorte, entrer dans un lieu où il doit parler.

## Les pièges connus
- **Service sans effet** : un id `lit-a-l-etage` ne fait pas dormir ; renomme-le `chambre-…`.
- **`rachat: 0` oublié** : le temple qui rachète des haches ; mets `types` ou `rachat: 0`.
- **Compagnon qui n'existe pas** : un bloc `compagnon` sans `escorte` ne fait rien en jeu.
- **Interjections écrites sans spécification** : les conditions (lieux, faits, quêtes, `choix-<dilemme>-<option>`, jauge) doivent être choisies par Claude et données à Haiku avec l'intention ; un agent qui invente ses conditions casse des ids. Modèle : Val des Cendres (`interjections/z8-compagnons.json`, 47 interjections).
- **Dilemme dans une salle qui a déjà sa rencontre** : les boutons du choix restent cachés tant qu'une scène de rencontre est ouverte ; pose le dilemme avant la salle, ou fais-en une issue de la rencontre.
- **Escorte sans fin** : prévois quand et comment il quitte le groupe (fin de sa quête, choix, danger).
- Avant de commiter : `docs/JOURNAL.md`, et l'accord de l'utilisateur.
