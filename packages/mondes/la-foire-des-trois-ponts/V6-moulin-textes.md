# Textes du moulin, à relire (V6)

*Généré le 20/11/2026 à partir des fichiers JSON du monde (`pnj/moulin.json`, `rencontres/moulin.json`, `tresors/moulin.json`, `examens/moulin.json`). Copie de lecture : les données font foi. Rédaction : agents Haiku, relecture de Claude.*

## Les PNJ

### L’homme de main du pont (humain, 35 ans) — `mou-pont-du-meunier`

**Apparence** : Humain de 35 ans, visage mal rasé et cerné par les nuits de garde. Un manteau de toile cirée, trempé, couvre une tenue de cuir usé. Il est adossé à la guérite, les mains dans les poches, comme un homme qui attend la fin de son quart.

**Voix** : Il parle peu, d'une voix basse et grommelée, en phrases courtes qui finissent souvent par un haussement d'épaules. **Désir** : Toucher sa paie sans histoire. **Peur** : Son chef.

**Salutations** — neutre : « Vous passez, ou vous restez là à regarder la pluie ? Le pont n'est pas fait pour les curieux. » · amicale : « Un temps pareil, hein ? Vous n'êtes pas venus pour la foire, j'imagine. Enfin, ce n'est pas mes affaires. » · hostile : « Demi-tour, ou on va devoir se parler autrement. »

**hdm-garde** — *Qui garde ce pont ?*

> « Les hommes de la barrière, c'est comme ça qu'on nous appelle, et ça nous va. Vous voyez la barrière, là, tirée sur ses deux poteaux ? C'est nous qui la tenons. On est payés pour qu'il ne passe personne sur ce pont, et on ne demande pas plus loin qui a payé. Ça ne nous regarde pas. Moi, je fais mon quart dans la guérite, les autres font le leur sous la pluie. Si vous voulez savoir pourquoi, ce n'est pas à moi qu'il faut le demander. »

**hdm-ferme** — *Pourquoi le moulin est-il fermé ?*

> « Fermé pour réparations, c'est écrit sur la barrière, et ce n'est pas moi qui l'ai peint. Je n'ai pas de marteau, pas de clous, rien de ce qu'il faut pour réparer quoi que ce soit là-bas. Je ne suis là que pour le pont, pas pour le moulin. Alors si vous voulez que je vous explique les réparations, je ne vais pas le faire, parce que je n'ai rien à expliquer. Regardez plutôt la rivière, elle a l'air d'en savoir plus que moi. Insistez tant que vous voulez, vous perdrez votre temps. »

**hdm-chef** — *Qui commande, là-haut ?*

> « Là-haut, dans la salle des meules, c'est Rouquin qui commande. Il est assis sur son lit de camp, et il ne se lève pas pour nous. Il s'appelle Rouquin, c'est tout ce que je sais de lui, et il n'aime pas qu'on le dérange, alors je ne monte pas le voir sans raison. Mon conseil : si vous avez de quoi le payer, ça ira plus vite que de l'insulter. Moi, je tiens ma guérite, la pluie me tombe dessus, et je n'ai pas envie d'en faire davantage. »

**hdm-travail** — *Ça vous plaît, ce travail ?*

> « Vous me demandez si ça me plaît ? Trois jours de pluie, du pain dur, et une guérite de planches qui laisse passer l'eau par le toit. Non, ça ne me plaît pas, mais ça paie. Je compte mes pièces le soir, une à une, sur le tonneau, parce que c'est le seul moment de la journée qui m'appartient. Ne le prenez pas mal, je n'ai rien contre vous. C'est juste que je ne vois pas bien ce que je ferais d'autre avec mes mains. »

**hdm-patron** — *Qui vous paie ?* *(condition : {"ou":[{"rencontre":{"id":"r-hommes-de-main","issue":"victoire"}},{"rencontre":{"id":"r-hommes-de-main","issue":"alternative","alternative":"negocier"}}]})* — révèle f-gedeon-a-engage-la-bande

> « Qui me paie ? Quelqu'un de la ville qui a de l'argent, voilà ce que je peux dire. C'est le marchand de grain, Marchebise, et il a voulu qu'on tienne ce pont pour retrouver la clé de la foire. Je ne sais rien de plus : ni pourquoi il la veut, ni où elle est. Je ne suis qu'un homme de main, pas un homme qui pose des questions. Vous me l'avez arraché sous la pluie, et je ne le redirai pas devant mes gars. »

### Rouquin Lamefine — Chef de bande (humain, 42 ans) — `mou-salle-des-meules`

**Apparence** : 42 ans, humain, cheveux roux qu'il porte courts, barbe de trois jours qui accroche la lueur des braises. Manteau de cuir usé fermé jusqu'au col, mains larges posées calmement sur ses genoux.

**Voix** : Lente et sèche, il parle à voix basse, avec la politesse d'un homme qui n'a jamais besoin de crier. **Désir** : Finir le travail et toucher sa paie. **Peur** : Perdre ses hommes et sa réputation.

**Salutations** — neutre : « Vous êtes entrés. Dites-moi ce que vous voulez, je n'ai pas toute la journée. » · amicale : « Des gens qui frappent avant d'entrer, ça change. Restez si vous voulez, mais ne touchez à rien. » · hostile : « Refermez cette porte, et vite. Je ne vais pas le redire deux fois. »

**rq-ici** — *Que faites-vous ici ?*

> « On garde un moulin fermé, dit-on. Il pourrait tourner, mais il ne tourne pas, et ce n'est pas mon affaire de le faire tourner. » Il étend ses jambes sur la laine brune du lit de camp, sans quitter la porte des yeux. « Le bruit de la foire ne me regarde pas, ni les clochettes, ni les cris des marchands. Vous non plus, si vous me laissez finir mon travail. Ce qui se passe en bas, sur le pont, ne vous concerne pas davantage. Vous n'avez rien à faire ici, et moi, j'ai beaucoup à faire. »

**rq-patron** — *Pour qui travaillez-vous ?*

> « Un patron qui paie bien, et qui paie d'avance, ce qui est rare dans ce pays. » Il frotte une braise tombée du trépied du bout de sa botte, sans se pencher. « Je ne vous donnerai pas son nom comme ça, pour rien. Un nom, ça se vend, et votre offre ne le vaut pas encore. Si elle le valait, je vous dirais peut-être qui il est. Pour l'instant, retenez seulement ceci : je reçois ma paie sans jamais voir la main qui la donne, et ça me va très bien. »

**rq-trouve** — *Qu'avez-vous trouvé ?*

> « Mes hommes ont retourné la cour, puis la salle, de la farine jusqu'aux sacs. » Il désigne du menton l'escalier du fond, sans se lever. « Là-haut, la trappe tient bon. Elle ne cède ni à la main ni à l'épaule, et mes hommes attendent une barre à mine pour la faire céder. Je ne vous dirai pas ce que je cherche, parce que vous ne m'aideriez pas à le trouver, et que vous avez déjà assez de questions dans la tête. Laissez-moi finir la fouille. »

**rq-arranger** — *On peut s'arranger ?*

> « Pas à ce prix. » Il ne se redresse pas, pose seulement la main à plat sur la laine brune, comme pour la garder. « Vous me proposez des mots, et des mots, je n'en ai pas besoin. Ils ne paient ni mes hommes ni mon lit. Ma paie vient d'ailleurs, et elle est sûre. Si vous voulez qu'on parle sérieusement, apportez quelque chose qui pèse plus lourd qu'une bourse. Jusque-là, les meules attendront avec moi, et le coffre au pied de mon lit aussi. »

> Variante *(condition : {"objet":"reconnaissance-de-dette"})* : « Montrez-moi ça. » Il se tait un long moment, les yeux sur les braises du trépied, puis il tend la main sans se lever. « Vous avez mieux que des mots, je le vois à votre façon de la tenir. Posez-le sur la meule, et ne le lâchez pas avant que j'aie fini. Je ne dirai rien de ce qu'il contient, c'est votre affaire et la mienne. Je le lirai, et je jugerai de ce qu'il vaut. Ensuite, nous verrons ce que vous voulez vraiment. »

**rq-patron-secret** — *Qui est ce patron ?* *(condition : {"objet":"reconnaissance-de-dette"})* — révèle f-gedeon-a-engage-la-bande

> « Vous avez fini par le demander. C'est Gédéon Marchebise, le marchand de grain. » Il tapote la laine de son lit du bout des doigts, sans sourire. « Il m'a dit que la clé devait être quelque part ici, dans ce moulin. Pas dans la cour, pas dans la salle, quelque part où l'on ne regarde pas tout de suite. Je n'ai rien trouvé, et vous non plus, sans doute. Voilà ce que je sais, et ce n'est pas peu pour quelqu'un qui n'a jamais su pourquoi on le payait. »

## Les rencontres

### Les hommes de la barrière (3 × bandit, 1 × bandit, difficulté faible)

> Vos pas sonnent sur les planches, et la brume se déchire un instant au-dessus de l'eau. Quatre hommes se lèvent d'un même mouvement, comme s'ils n'attendaient que ce moment. Ils se placent en travers de la travée centrale, les bras le long du corps, et celui qui se tient au bout, près de la guérite, lève le menton vers votre chef de file. Ils ne bougent pas davantage. Le plus grand ne quitte pas des yeux votre chef de file, et les planches craquent sous le poids des autres. La rivière continue de se briser contre les piles, et la corde de la barrière grince dans votre dos.

**Je leur parle posément, sans lever la main.** (persuasion DD 12)

> Vous parlez sans menace, et vous laissez aux hommes le temps de comprendre qu'on ne vient pas pour les frapper. Le plus grand hésite, puis fait un pas de côté. Les autres suivent, un à un, et s'écartent de la travée centrale. Celui de la guérite finit par poser le menton sur sa main et se rend : il vous laisse passer, sans un mot de plus sur ce qui se trame.

**Je leur donne vingt pièces d'or.** *(condition : {"pieces":{"min":20}})*

> Ils comptent les pièces une à une, sans se presser, et le plus grand empoche la somme d'un geste sec. Les hommes s'écartent de la travée centrale et laissent le passage libre. Personne ne dit rien de plus. Celui de la guérite regarde la rivière, les lèvres serrées, comme un homme qui connaît la question qu'on pourrait lui poser et qui décide de ne pas y répondre.

### Rouquin Lamefine (1 × chef-de-bande, difficulté moderee)

> Le groupe franchit la marche, et l'homme sur le lit de camp se lève sans hâte. Il ne se presse pas : il tire sur sa ceinture, glisse une main sous son manteau de cuir et s'avance d'un pas, juste assez pour que chacun le voie. Son regard passe d'un visage à l'autre, puis s'arrête sur vos mains, comme s'il comptait vos armes avant vos mots. Il ne sort rien. Sa main reste près de la poignée de son cimeterre, et il attend que vous parliez les premiers, parce qu'un homme qui attend a toujours l'avantage.

**Je lui tends la reconnaissance de dette et je parle posément.** *(condition : {"objet":"reconnaissance-de-dette"})* (persuasion DD 11)

> Le papier passe de votre main à la sienne. Rouquin le déplie lentement et le lit deux fois, les lèvres serrées. Il comprend seulement que son patron lui a caché quelque chose. Il range le papier dans sa poche sans un mot, ôte sa main de la poignée de son cimeterre et se rassied sur le lit de camp. Il ne s'en va pas. Il se rend, et il attend la suite.

**Je lui offre soixante pièces d'or pour qu'il lâche l'affaire.** *(condition : {"et":[{"objet":"reconnaissance-de-dette"},{"pieces":{"min":60}}]})*

> Vous posez la bourse sur la meule, et le tintement des soixante pièces fait tourner la tête de Rouquin. Il compte sans se presser, une pièce après l'autre, du bout de l'index. Il jette un regard au papier que vous tenez serré, puis tend la main pour la bourse, sans sourire. La salle retrouve son silence, les meules muettes, et l'affaire est close pour lui.

## Les examens

**L'écriteau** (`mou-pont-du-meunier`) — *Un écriteau peint en grandes lettres inégales, cloué à la traverse de la barrière, annonce la fermeture du moulin.*

> Vous approchez l'écriteau à hauteur de regard. Les lettres ont été peintes à la main, et la couleur a passé par endroits. Elles ne sont pas de même taille : le F penche, le R s'étale, et le dernier mot déborde sur le bois clair. Quand vous passez le pouce sur la peinture, elle s'effrite en poudre sèche. Les clous qui le retiennent ont rouillé, et leur rouille a coulé en traînées orange sur le chêne gris. L'un d'eux est enfoncé de travers, comme si l'on avait frappé trop vite. Derrière, la corde de la barrière grince au vent, et l'eau gronde sous le pont.

**La serrure forcée** (`mou-cour`) — *La porte basse de l'atelier porte une serrure arrachée, dont le bois est encore frais et clair.* — fait : f-cour-fouillee-par-une-bande

> La serrure n'a pas été crochetée. Quelqu'un l'a forcée de l'extérieur, en faisant levier sur le montant : les éclats de chêne sont blancs et pointus, et ils sentent encore la sève. Le fer de la gâche est tordu, la vis a sauté de sa mortaise. Vous passez un doigt dans la fente, et une poussière fine de bois tombe sur vos gants. Le battant tient mal, il bouge d'un souffle quand vous le poussez. Par l'entrebâillement, vous ne voyez qu'une pénombre grise et l'odeur de bois mouillé.

**Les traces dans la boue** (`mou-cour`) — *Dans la boue devant la roue, des traces de charrette se mêlent à de nombreuses bottes qui se croisent.* — fait : f-cour-fouillee-par-une-bande

> La boue est pleine d'empreintes, et elles ne se ressemblent pas. Il y a des bottes à semelle large, des pointes étroites, des talons usés d'un côté, des semelles neuves qui ont glissé. Elles vont et viennent entre la roue et le mur, certaines par-dessus d'autres, figées dans la terre où la pluie a rempli chaque creux. Les ornières de charrette tournent devant l'arbre de roue, et quelques flaques en gardent le reflet gris. Au bord de la boue, vous touchez une trace : elle est encore souple et froide. Le sol est lisse là où tout ce monde a marché, comme si l'on avait piétiné la même place longtemps.

**Les deux meules** (`mou-salle-des-meules`) — *Les deux meules de pierre grise portent des rainures de largeurs différentes, dont l'une est polie en cuvette.*

> Vous posez la main sur la meule du dessous, et la pierre est fraîche, un peu rugueuse. Les rainures ne se ressemblent pas : les unes sont fines comme un trait de plume, les autres larges de la largeur d'un doigt. Au centre de la plus large, la pierre s'est creusée en cuvette, lisse comme une assiette usée. Un siècle de grain a passé là, grain après grain, jusqu'à polir le gris. La poussière de farine glisse sous vos doigts et sent le pain sec. Dans le silence, vous croyez presque entendre le craquement d'une meule qui ne tourne plus.

**La poutre maîtresse** (`mou-grenier`) — *La poutre maîtresse du grenier porte, à hauteur de main, des traces de corde dans son bois noirci.* — fait : f-traces-de-corde-sur-la-poutre

> Le chêne est noir, poli par les années, et son grain se lit comme une écriture serrée. À hauteur de votre main, la surface est marquée d'une série de sillons parallèles, ni nets ni profonds, qui tournent autour de la poutre. Des fibres arrachées pendent encore, claires, légèrement pelucheuses. Vous passez le doigt dans un sillon : il est assez large pour un cordage, et les bords sont souples, comme frottés. Plus haut, la poutre est intacte, couverte de poussière de grain. Sous vos yeux, la lumière grise glisse sur le bois et révèle chaque entaille.

**La trappe de planches** (`mou-grenier`) — *Une trappe de planches, contre le mur ouest, est coincée de ce côté-ci par une cale de bois.* — fait : f-trappe-calee-de-l-interieur

> La trappe est faite de planches épaisses, posées contre le mur ouest, au ras du plancher. Vous la poussez du pied : elle ne bouge pas, et vous comprenez vite pourquoi. Une cale de bois est glissée sous le rebord, calée contre le sol, serrée à force. Elle n'a rien de neuf, mais elle est nette, sans aucune trace de clou. Le bois est sec, aux nervures marquées, et elle ne se déplace qu'en la forçant. Par les fentes, vous sentez monter l'odeur de braise de la salle en contrebas, chaude et âcre.

**La trappe à grain** (`mou-grenier`) — *Dans le pignon ouest, une petite trappe à grain carrée laisse entrer un courant d'air frais.*

> L'ouverture est carrée, à peine assez large pour une épaule, et le bord n'a ni rebord ni verrou. Vous collez le visage contre l'encadrement : dehors, le vide, le gris de l'air, et très bas le bruit de l'eau qui passe sous une roue. Un courant d'air frais vous fouette les joues et fait trembler la poussière en suspension. Le bois de l'appui est gris, poudré de farine. Plus loin, la pluie tambourine sur les tuiles. Vous reculez d'un pas, et l'air vous semble plus sec.

## Les contenants

**La bourse sous le tonneau** (`mou-pont-du-meunier`) — Une bourse commune de cuir, usée et souple, cachée sous le tonneau-table, au milieu de la travée centrale. Elle est glissée entre le fond du tonneau et les planches, à l'abri de la pluie et de la vue de qui marche sur le pont.

**Le coffre de campement** (`mou-salle-des-meules`) — Au pied du lit de camp, un coffre de campement cerclé de fer repose sur le plancher couvert de farine. Ses bandes de métal sont rouillées aux angles, et sa serrure, large comme une paume, a un cœur épais. Il ne bouge pas quand on le pousse du pied.

**La caisse de matériel** (`mou-cour`) — Une caisse de bois brut, aux coins cerclés de fer, repose sous l'auvent de l'atelier, contre le mur ouest. Ses planches sont grises, marquées par la pluie, et un cadenas de fer ferme son couvercle. Le métal est piqué de rouille, mais la serrure reste solide.

**La fente de la poutre** (`mou-grenier`) *(condition : {"et":[{"non":{"fait":"f-traces-de-corde-sur-la-poutre"}},{"non":{"objet":"cle-du-coffre-de-la-foire"}}]})* — Une fente sombre s'ouvre dans la poutre maîtresse du grenier, à hauteur de main. Elle n'est visible qu'en la cherchant : le bois noir la dissimule, et son ouverture, étroite et nette, ressemble à une entaille ancienne. Il faut approcher le visage pour la voir.

**La fente de la poutre, repérée** (`mou-grenier`) *(condition : {"et":[{"fait":"f-traces-de-corde-sur-la-poutre"},{"non":{"objet":"cle-du-coffre-de-la-foire"}}]})* — La même fente, dans la poutre maîtresse du grenier, à hauteur de main. Les traces de corde qui marquent le bois autour la rendent plus facile à repérer : son bord est lisse, poli comme par un frottement. Elle reste sombre, étroite, à peine plus large qu'un doigt.
