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
