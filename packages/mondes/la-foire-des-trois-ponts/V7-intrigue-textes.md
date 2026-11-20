# Textes de V7 (intrigue et choix), à relire

*Généré le 20/11/2026 à partir des JSON du monde (`quetes/`, `dilemmes/`, `fins/`, `evenements/`, `monde.json`, `pnj/village.json`). Copie de lecture : les données font foi. Rédaction : agents Haiku, relecture de Claude.*

## Les quêtes

### La clé de la foire (`q-la-cle-de-la-foire`, principale, donneur aubin-cerfeuil) — récompenses : 235 PX, perche-d-equilibriste — « 60 po de prime et la perche d’équilibriste »

> La clé du coffre de la foire a disparu dans la nuit, et la cloche d'ouverture sonnera à l'aube. Le bailli Aubin Cerfeuil promet soixante pièces d'or à qui la rapporte, discrètement.

- **trouver-la-cle** ({"ou":[{"objet":"cle-du-coffre-de-la-foire"},{"flag":"cle-rendue"}]}) : Retrouvez la clé du coffre de la foire, sans éclat. Aubin Cerfeuil n'accuse personne, et il vous laisse chercher à votre façon.

- **rendre-la-cle** ({"flag":"cle-rendue"}) : Vous tenez la clé du coffre de la foire. Il ne reste qu'à la rapporter à Aubin Cerfeuil, dans sa halle, pour que le coffre s'ouvre sur les droits de place.

- **trancher** ({"flag":"choix-qui-doit-payer"}) : La clé est rendue au bailli. Reste à décider ce qu'on dit de ce qu'on a appris, et qui doit payer pour cette affaire.

### Le colis du forgeron (`q-le-colis-du-forgeron`, secondaire, donneur brun-forgefer) — récompenses : 40 PX, 10 po, corde-de-funambule — « 10 po et une corde de funambule »

> Brun Forgefer a préparé un colis pour Mère Pivoine, la doyenne des forains, qu'elle attend avant l'aube. Il l'a enfermé dans le coffre de chêne de sa forge, dont la serrure est délicate.

- **recuperer-le-colis** ({"ou":[{"objet":"colis-de-brun"},{"flag":"colis-remis-a-mere-pivoine"}]}) : Ouvrez le coffre de chêne de la forge sans abîmer le colis. La serrure est délicate : prenez-la doucement, et sortez le paquet intact.

- **livrer-le-colis** ({"flag":"colis-remis-a-mere-pivoine"}) : Le colis est en main. Trouvez Mère Pivoine, la doyenne des forains, et remettez-le-lui en mains propres.

- **rapporter-le-recu** ({"flag":"q-le-colis-du-forgeron-rendue"}) : Mère Pivoine a signé un reçu pour le colis. Rapportez ce papier à Brun Forgefer, qui l'attend de sa main.

### Les rats de la cave (`q-les-rats-de-la-cave`, secondaire, donneur colombe-tisserand) — récompenses : 25 PX — « Une nuit offerte au Héron Gris »

> Trois rats géants ravagent la cave du Héron Gris, et le sac de farine est déjà éventré. Colombe Tisserand offre une nuit à qui débarrasse sa cave de ces bêtes.

- **vaincre-les-rats** ({"rencontre":{"id":"r-rats-de-la-cave"}}) : Descendez à la cave et débarrassez-la des trois rats géants. Il n'y a rien à négocier avec des bêtes pareilles.

- **retour-chez-colombe** ({"flag":"q-les-rats-de-la-cave-rendue"}) : Les rats ont quitté la cave. Revenez l'annoncer à Colombe Tisserand, qui tient sa parole.

## Les sujets ajoutés

**aubin-cerfeuil / aubin-rendre** — *Lui rendre la clé du coffre.* — effets [{"quete":{"id":"q-la-cle-de-la-foire","statut":"active"}},{"objet":{"id":"cle-du-coffre-de-la-foire","retirer":true}},{"pieces":60},{"flag":"cle-rendue"}]

> « Ah, la voilà enfin ! » Il ouvre la main, et la clé tombe sur son registre avec un petit bruit de fer. Il la pose sous la poutre où pend la cloche de cuivre, puis il souffle longuement, la chaîne de bailli se soulevant avec son souffle. Il compte les soixante pièces dans votre paume, une à une, à voix basse. « Une, deux… soixante. Ma parole tient, et la cloche sonnera sur un coffre en règle. » Puis sa voix redevient grave. « Maintenant, dites-moi ce que vous avez appris. Une foire ne s'ouvre pas sur un mensonge, et je préfère une vérité désagréable à un silence qui pourrit. »

**brun-forgefer / brun-recu** — *Lui rapporter le reçu de Mère Pivoine.* — effets [{"objet":{"id":"recu-de-mere-pivoine","retirer":true}},{"flag":"q-le-colis-du-forgeron-rendue"}]

> « Un reçu, et signé de sa main, en plus ! » Il le tourne vers la braise pour le lire, puis le replie en quatre, avec le soin qu'il met à un bon fer. « Ça, c'est du travail fait. » Il plonge la main dans le coffre de chêne sous l'établi et pose dix pièces d'or sur l'enclume, en les frappant du plat du marteau. « Pour votre peine. Et tenez, prenez aussi ça : une corde de soie de funambule, que je garde en réserve pour les pas qui comptent. » Il vous la tend enroulée serrée. « Maintenant, laissez-moi frapper, le fer n'attend pas. »

**colombe-tisserand / colombe-rats-fait** — *Les rats de la cave sont partis.* — effets [{"quete":{"id":"q-les-rats-de-la-cave","statut":"active"}},{"flag":"q-les-rats-de-la-cave-rendue"},{"flag":"nuit-offerte"}]

> « Partis ? Vous les avez vraiment chassés ? Que le ciel vous garde, mon bijou ! » Elle pose sa louche sur le comptoir et essuie ses mains sur son tablier, comme pour effacer la cave tout entière. « Plus une planche rongée au pied du mur sud, plus une miette dans le sac de farine. Vous méritez mieux qu'une soupe : la meilleure chambre de l'étage est à vous, pour la nuit, sans rien payer. » Elle désigne l'escalier étroit au fond à gauche. « Allez vous installer, et ne me dites pas non. »

## Le dilemme « Qui doit payer ? »

> Dans la halle du bailli, Aubin Cerfeuil tient la clé du coffre au creux de sa main, puis recule d'un pas. La foire doit s'ouvrir à l'aube, et les étals sont déjà dressés sous la toile. Ce que vous savez pèse sur le funambule, sa mère et le marchand de grain. Aubin attend. Il attend que vous lui disiez tout, ou que vous ne disiez rien. Le calme de la halle est lourd, et chacun guette votre réponse.

**Dire la vérité devant tous.** *(condition {"ou":[{"objet":"reconnaissance-de-dette"},{"fait":"f-gedeon-a-engage-la-bande"}]})*
- Coûts : Deux familles brisées : celle du funambule bannie, celle du marchand ruinée. / Un ennemi, qui ne l'oubliera pas.
- Gains : Gédéon payé de ce qu'il a fait. / La dette de Tobie est annulée, enfin.
- Épilogue : Devant les anciens, la vérité tombe comme une pierre, et Gédéon Marchebise plie les épaules.

**Payer la dette de Tobie, et ne rien dire.** *(condition {"fait":"f-gedeon-et-la-dette"}, requis {"pieces":{"min":90}})*
- Coûts : 90 po de votre poche, moins la prime : net −30 po. / Gédéon reste impuni, et personne ne le saura.
- Gains : Tobie et sa mère restent à la foire. / La dette est payée, la roulotte gardée.
- Épilogue : Vous réglez la dette en secret, et personne au bailli n'apprendra jamais votre nom.

**Je ne dis rien et je m'en vais.** *(abstention)*
- Coûts : Gédéon reste impuni, et la dette demeure. / Tobie reste menacé, et sa mère avec lui.
- Épilogue : Vous posez la clé sur la table, tournez les talons, et quittez la halle sans un mot.

## Les fins

### Le scandale (`fin-scandale`, condition {"flag":"choix-qui-doit-payer-scandale"})

> La halle se remplit en un instant. Les anciens se lèvent, les forains se pressent contre les piliers, et la voix de Gédéon Marchebise se brise lorsque vous exposez ce que vous savez. Le marchand de grain, ruiné en une matinée, baisse les bras et ne sourit plus. Plus loin, Tobie Pivoine serre la main de sa mère, baisse la tête et traverse la foule sans lever les yeux. Ils quittent Verdelle sur la route, bannis de la foire qu'ils aimaient. La dette de Tobie est effacée, mais personne n'applaudit. Le groupe garde sur la langue un goût de cendre, celui d'une vérité rendue publique au prix de deux familles.

Conséquences : Gédéon Marchebise est ruiné et interdit de foire. · Tobie et sa mère sont bannis de la foire. · Gédéon devient un ennemi du groupe.

### Le silence (`fin-silence`, condition {"ou":[{"flag":"choix-qui-doit-payer-silence"},{"flag":"choix-qui-doit-payer-abstention"}]})

> La foire s'ouvre à l'aube. La cloche sonne, et les étals se découvrent un à un sous le soleil d'automne. Au-dessus de la place, la corde est tendue, et Tobie Pivoine y remonte, les bras en croix. Gédéon Marchebise sourit derrière son comptoir, comme si de rien n'était, et compte ses sacs de grain. Le groupe s'éloigne dans la foule, plus léger de trente pièces d'or, et garde pour soi ce qu'il sait. Les bannières claquent, et la foire commence sans que personne ne pose de question.

> Variante {"flag":"choix-qui-doit-payer-abstention"} : La foire s'ouvre, mais la dette n'est pas payée. Les étals se déploient sous la toile, la cloche sonne, et la corde reste tendue au-dessus de la place. Tobie Pivoine regarde par la fenêtre de la roulotte, sans monter sur la corde, en sachant qu'il n'est pas sauvé. Gédéon Marchebise sourit derrière son comptoir, compte ses sacs de grain et ne doit rien à personne. Le groupe s'en va sans rien dire, la clé rendue, avec la certitude que la dette ne disparaîtra pas toute seule.

Conséquences : Gédéon reste impuni, sans que personne le sache. · Tobie et sa mère restent à la foire. · Le groupe garde le secret de l'affaire.

## Le recoupement

> Les pièces s'assemblent, et les indices s'alignent sur le même homme. Le groupe rapproche ce qu'il a entendu, et tout désigne Tobie, le funambule, qui a pris la clé du coffre pour payer en secret sa dette. Vous le comprenez d'un coup, et le silence qui suit ressemble à un aveu, et personne ne bouge.

## Les échos de campagne

- `epi1-gedeon-vengeur` (quand {"flag":"choix-qui-doit-payer-scandale"}) : Gédéon Marchebise, ruiné à Verdelle, n'a pas oublié qui l'a dénoncé.

- `epi1-tobie-reconnaissant` (quand {"flag":"choix-qui-doit-payer-silence"}) : Tobie Pivoine, funambule de Verdelle, se souvient de qui a payé sa dette.

## Les choix d'origine de la corde

**« Je passe en trottant sur la corde. »** ({"heros":{"espece":"halfelin"}})

> Un halfelin s'élance sur la corde tendue au-dessus de la vasque de la fontaine, et la traverse d'un pas léger, presque en trottant. Il ne regarde ni le vide ni la foule. Arrivé de l'autre côté, il salue d'un petit geste, et la place éclate de rire. Deux pièces d'or lui sont glissées en pourboire, et il les fait sauter dans sa paume avec un clin d'œil.

**« Je monte sur la corde en chantant. »** ({"heros":{"classe":"barde"}})

> Un barde s'élance sur la corde tendue au-dessus de la vasque de la fontaine, et la traverse en chantant, la voix claire et le pas assuré. Il ne regarde ni le vide ni la foule, il regarde la note suivante. Arrivé de l'autre côté, il salue d'une révérence, et la place applaudit à tout rompre. Deux pièces d'or lui sont tendues en pourboire, et il les garde en chantant encore un refrain.
