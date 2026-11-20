# À brancher en V7 (quêtes) : ce que l'assemblage de V6 a laissé de côté

Les quêtes (`q-la-cle-de-la-foire`, `q-le-colis-du-forgeron`, `q-les-rats-de-la-cave`) n'existent pas encore : leurs effets et leurs conditions s'ajoutent en V7.

- Sujet `aubin-cle` : effet `quete` `q-la-cle-de-la-foire` actif.
- Sujet `brun-colis` : effet `quete` `q-le-colis-du-forgeron` actif ; le trésor `ver-tre-colis` n'existe qu'à la quête active.
- Sujet `colombe-rats` : effet `quete` `q-les-rats-de-la-cave` actif ; récompense : une nuit offerte.
- Variantes de salutation écrites mais non branchées :
  - aubin-cerfeuil / cle-rendue : « « Enfin ! Je n'osais plus l'espérer. Vous me rendez le sommeil, et la foire tiendra son rang. » »
  - mathilde-pot-de-miel / au-camp : « « On s'est vus au camp, mon bijou ! Je ne vous garde rancune de rien, alors ne faites pas cette tête. » »
  - brun-forgefer / colis-remis : « « Le reçu. Bien. Vous ne l'avez pas perdu, c'est déjà rare. Merci, sincèrement. » »

## Autres points laissés ouverts par l'assemblage de V6

- **Salutations qui changent** : il en faut au moins 5 PNJ ; trois sont branchées (Colombe : rats vaincus ; Gédéon : offre refusée ; Pervenche : poupée montrée), les trois ci-dessus attendent leurs quêtes (Aubin, Brun) ou la présence de Mathilde au camp.
- **Cas limites du village à encoder** (V4) : Colombe attaquée (refus de servir jusqu'au lendemain), Gédéon qui part chez le bailli si on crochète son coffre devant lui (`deplacer`), Mathilde volée qui part au camp (`deplacer`), Aubin qui verse la prime si la clé est rapportée sans quête acceptée. Aucun de ces cas n'a de point d'accroche dans les données du village : à examiner avec le moteur en V7.
- **Zones suivantes** : présence de Mathilde au camp (`presences` vers `pon-camp`), liens `verdelle` → `mou-pont-du-meunier` (conditionné à la quête principale) et `ver-pont-des-marchands` → `pon-camp`.
- **Gédéon, secret de la bande** : le sujet `gedeon-bande` se lit à l'attitude 30 (influence du moteur : Persuasion DD 15, 24 h après un échec) ; pas de jet propre au sujet.
- **Événement de la corde** : aucun choix réservé à une origine de héros (avis du validateur) ; à décider avec l'utilisateur.
- **Services de repas et de forge** : retirés (sans effet en jeu) ; le repas et la forge restent dits par les sujets de Colombe et de Brun et par la boutique de Brun.

## Moulin (V6, 20/11/2026)

- **Lien `verdelle` → `mou-pont-du-meunier`** (route, 1 h) : écrit **sans condition**, à conditionner par la quête principale active (`quete: q-la-cle-de-la-foire` active) dès que la quête existe (V4 : « la route s'ouvre quand la quête principale est active »).
- **Conditions des deux trésors de la clé** : ajouter « quête `q-la-cle-de-la-foire` non terminée » à `mou-tre-cle` et `mou-tre-cle-poutre`, pour qu'ils ne se reforment pas après la remise de la clé.
- **Scandale** (V7) : condition `f-gedeon-et-la-dette` **ou** `f-gedeon-a-engage-la-bande` (M1).
- **Gédéon et le moulin** : `gedeon-moulin` (« je n'ai pas su qui s'en occupe ») est un mensonge de Gédéon, qui a payé la bande : voulu, à garder en tête pour les échos.
- **Brun au moulin** : il y est passé ce matin à l'aube, avant que la bande n'ait tendu la barrière du pont (D9).
- **PNJ qui parlent après une victoire** : l'homme de main et Rouquin se rendent et restent vivants (M8).

## Pont-Cassé (V6, 20/11/2026)

- **Reçu et colis** : `mp-colis` pose le drapeau `colis-remis-a-mere-pivoine` et donne `recu-de-mere-pivoine` ; le retour du reçu à Brun (fin de `q-le-colis-du-forgeron`) est à écrire en V7, avec la salutation `colis-remis` de Brun.
- **Mathilde** : présente au camp le soir (P2) ; sa salutation « au camp » n'est pas branchée (pas de condition fiable : à reprendre en V7 avec un drapeau posé au camp le soir, ou à abandonner).
- **Écho** : `tobie-confie` (porte-bonheur donné) est le drapeau de l'indice de `epi1-tobie-reconnaissant` ; les fins et les échos se décident en V7.
- **Tobie muet** : listé dans la roulotte, muet (salutation narrée) jusqu'à `f-tobie-dans-la-roulotte` ; à vérifier en jeu que l'interface ne le propose pas comme interlocuteur avant la bâche.
- **Chronologie** : le vol date de la nuit dernière ; Tobie se terre « depuis cette nuit » ; Pervenche l'a vu prier « la nuit dernière » ; Brun voit la serrure du moulin forcée « ce matin à l'aube ».

## Fait en V7 (20/11/2026)

Tout ce qui précède est branché : effets de quête des sujets, `aubin-rendre`, `brun-recu`, `colombe-rats-fait`, salutations d'Aubin et de Brun, route du moulin et cour → salle conditionnées, trésors du colis et de la clé, piège du coffre-fort qui déplace Gédéon, événement de recoupement, dilemme `qui-doit-payer`, fins, échos, choix d'origine de la corde. **Abandonnés** (I11, I12) : Mathilde « volée », Colombe « attaquée », la salutation « au camp » de Mathilde. **Restent à V8** : texte de présentation (`resume`, `accroche`, `depart.intro`, `direction`, `teasing`), `chapitres[0].quetes`, récits d'arrivée du moulin et du Pont-Cassé, images, voix, scènes, preuve de chaque fin et de la quête du colis par un test déterministe.
