# Textes du Pont-Cassé, à relire (V6)

*Généré le 20/11/2026 à partir des fichiers JSON du monde (`pnj/pont-casse.json`, `examens/pont-casse.json`, `tresors/pont-casse.json`). Copie de lecture : les données font foi. Rédaction : agents Haiku, relecture de Claude.*

## Les PNJ

### Mère Pivoine — Doyenne des forains (humain, 68 ans) — `pon-roulotte`

**Apparence** : Humaine de 68 ans, au visage fin buriné par le vent, les cheveux blancs relevés sous un foulard rouge brique. Robe de laine ocre et tablier usé ; ses mains sont toujours occupées à un ouvrage de fil.

**Voix** : Posée et rêche, elle parle en proverbes de route et ne dit jamais deux mots là où un suffit. **Désir** : Que son fils sorte sain et sauf de la foire. **Peur** : Perdre la roulotte et son fils.

**Salutations** — neutre : « Vous entrez, ou vous restez dans la lumière ? Asseyez-vous si vous voulez, le banc ne mord pas. » · amicale : « Ah, vous voilà. Asseyez-vous, la tisane est encore tiède, et les visiteurs qui ne demandent rien sont rares dans ce camp. » · hostile : « Vous n'avez pas l'air d'être venu pour la tisane. Parlez vite, et ne me rendez pas la journée plus lourde qu'elle ne l'est. »

- Variante *(condition : {"flag":"colis-remis-a-mere-pivoine"})* : « Vous êtes de la maison, maintenant. Asseyez-vous un moment, et ne soyez pas étonné si je vous donne un conseil de route. »

**mp-brun** — *Brun doit vous livrer quelque chose ?*

> « Brun ? Il doit me porter des ferrures et des clous neufs pour l'essieu, oui. Mon essieu gémit depuis l'hiver, et une roulotte qui gémit finit toujours par se coucher dans le fossé. C'est un homme de parole, mais lent, comme un fer qui refroidit avant qu'on le frappe. Il les a forgés, à ce qu'il dit, et je veux ces clous avant l'aube, pas après. Si vous venez de sa part, posez le paquet sur la table pliante, et ne le laissez pas traîner dans l'herbe. »

**mp-troupe** — *Parlez-moi de la troupe.*

> « La troupe, c'est une famille qui a pris la route trop tôt et n'a jamais voulu la quitter. Il y a les jongleurs, les chanteurs, un accordéoniste qui ne se sépare jamais de son instrument, et ceux qui réparent tout ce qui roule. Demain, c'est la foire, et chacun montre ce qu'il sait faire, pour que les gens oublient le vent et la fatigue. Une roulotte comme la mienne vaut plus qu'une maison, à condition qu'elle roule encore. Les jeunes apprennent la corde, les vieux la chanson, et personne ne part de table le ventre vide. »

**mp-fils** — *Où est votre fils ?* — révèle f-tobie-dans-la-roulotte

> Elle ne répond pas tout de suite. Son regard glisse vers la bâche rayée et s'y arrête un instant, puis revient à son ouvrage. « Vous êtes venu de bonne foi, alors je ne vais pas vous mentir : mon fils est là, derrière cette toile. Il ne sort plus depuis cette nuit, et je ne vous demande pas pourquoi vous le cherchez. Le reste, c'est entre lui et moi. » Elle tire un fil, le coupe avec les dents, sans se presser. « Vous avez une bonne tête, pour un étranger, et les bonnes têtes n'ont pas besoin de savoir tout ce qui se passe derrière une bâche. »

**mp-camp** — *Pourquoi campez-vous ici ?*

> Elle hausse les épaules sans quitter l'eau des yeux. « Le pont est tombé, et la ville n'a jamais eu le temps de le relever. Alors elle nous laisse la rive depuis l'effondrement, à condition qu'on ne gêne personne, ce qui n'est pas facile avec une troupe. Regardez les piles, là-bas, dans la brume : elles tiennent encore, et l'eau passe entre elles comme si de rien n'était. N'en parlons pas davantage, je n'aime pas qu'on fouille dans ce qui s'est cassé. »

**mp-colis** — *Lui remettre le colis de Brun.* *(condition : {"objet":"colis-de-brun"})* — effets [{"objet":{"id":"colis-de-brun","retirer":true}},{"objet":{"id":"recu-de-mere-pivoine"}},{"flag":"colis-remis-a-mere-pivoine"}]

> Elle se lève, lentement, et prend le paquet à deux mains. Elle défait la toile d'emballage, sort un clou, le fait rouler entre le pouce et l'index, puis le regarde contre la lumière de la porte. « Droit, bien trempé, pas une bavure. Brun a tenu sa parole, et il ne fait pas le bavard, c'est sa force. » Elle prend un bout de papier sur la table pliante, écrit d'une main ferme, signe, puis le tend. « Voilà votre reçu. Rapportez-le-lui, c'est la preuve que le travail est fait, et qu'un forgeron ne doit jamais rien à personne. »

**mp-secret** — *Qu'avez-vous à me dire de plus ?* *(condition : {"flag":"colis-remis-a-mere-pivoine"})* — révèle f-cle-au-grenier

> Elle repose son ouvrage sur ses genoux et baisse la voix, comme on parle à quelqu'un de confiance. « Vous m'avez rendu ce qu'on attendait de vous, alors je vais vous dire ce que mon fils m'a confié, une seule fois. Avant de se terrer ici, il m'a dit avoir caché la clé au grenier du moulin, dans la grosse poutre. Il n'a pas voulu m'en dire davantage, et je n'ai pas insisté, un fils qui se tait a ses raisons. Je ne sais rien de plus, je vous le jure sur la roulotte. » Du bout du doigt, elle effleure le ruban de la poupée, sur sa tablette, comme pour s'assurer qu'elle est toujours là.

### Tobie Pivoine — Funambule (humain, 24 ans) — `pon-roulotte`

**Apparence** : Humain de 24 ans, silhouette fine et nerveuse, cheveux bruns en désordre et teint hâlé de plein air. Il porte une tunique de toile ocre usée aux coudes, et l'on voit ses mains trembler quand il parle.

**Voix** : Rapide et haché, il plaisante à la fin de ses phrases pour ne pas pleurer. **Désir** : Payer sa dette sans perdre sa mère ni sa corde. **Peur** : Gédéon Marchebise, et décevoir sa mère.

**Salutations** — neutre : Derrière la bâche, une respiration retenue ; personne ne répond. · amicale : Derrière la bâche, une respiration retenue ; personne ne répond. · hostile : Derrière la bâche, une respiration retenue ; personne ne répond.

- Variante *(condition : {"flag":"tobie-confie"})* : « Vous savez tout, alors. Ça me soulage, et ça me gêne aussi. Merci de ne pas en faire un spectacle. »

- Variante *(condition : {"et":[{"fait":"f-tobie-dans-la-roulotte"},{"pnj":{"id":"tobie-pivoine","attitudeMax":-1}}]})* : « Partez, dit-il à demi-voix, je ne sors pas, et vous ne me trouverez pas. »

- Variante *(condition : {"et":[{"fait":"f-tobie-dans-la-roulotte"},{"pnj":{"id":"tobie-pivoine","attitudeMin":20}}]})* : « Chut… parlez bas. Vous êtes du côté de ma mère, alors je vous écoute, mais pas trop fort. »

**tb-peur** — *Pourquoi vous cachez-vous ?* *(condition : {"fait":"f-tobie-dans-la-roulotte"})*

> « Ah, la question qui fait mal avant même la réponse. Il y a des hommes qui me cherchent, et ce ne sont pas des amis qui souhaitent bonne route. Ils sont polis, ce qui est pire. Alors je reste derrière cette toile : si je sors, ils me suivent, et s'ils me suivent, ils trouvent ma mère. Elle n'a rien fait, elle, à part m'élever avec beaucoup de patience. Vous voyez la lampe, là-bas, éteinte ? Ça me rassure qu'elle le soit, personne ne regarde par la fenêtre. Je ne vous demande pas de me protéger. Seulement de ne pas me vendre à eux, c'est déjà beaucoup. »

**tb-mere** — *Et votre mère, qu'est-elle pour vous ?* *(condition : {"fait":"f-tobie-dans-la-roulotte"})*

> « Ma mère ? Elle est tout ce qu'il me reste de solide. Regardez la roulotte : elle a des années de route sur cet essieu qui grince, et elle le répare avec des bouts de fer, sans jamais se plaindre. Vous voyez mes mains ? Elles tremblent depuis cette nuit, et je ne sais pas comment les arrêter. Elle les prend dans les siennes et dit que c'est le froid de la rivière. Je l'aime, voilà, c'est tout. Je la protège comme je peux, même quand cela m'oblige à me taire. Si vous voulez l'aider, apportez-lui le colis de Brun : elle attend des ferrures neuves pour cet essieu. »

**tb-corde** — *Parlez-nous de la corde.* *(condition : {"fait":"f-tobie-dans-la-roulotte"})*

> « La corde, c'est la seule chose qui ne me ment pas. On marche dessus les yeux fixés sur un point, toujours plus loin que là où l'on a peur. Le vide, lui, je ne le regarde jamais : il attend qu'on baisse la tête. Le nœud, je le fais à la main, deux tours et un contre-tour, sinon ça glisse. Pour la corde fine, je l'ai achetée il y a peu, dans une boutique où l'on ne pose pas trop de questions ; n'en faites pas une histoire, je vous en prie. Là-haut, personne ne peut me demander de payer. Je suis en paix seulement là-haut. Vous me croyez ? »

**tb-moulin** — *Que s'est-il passé au moulin ?* *(condition : {"fait":"f-tobie-dans-la-roulotte"})*

> « Au moulin ? Rien de ce que vous croyez. Je n'ai rien à raconter de cet endroit, voilà tout. Ne me demandez pas de détails, vous en avez assez comme ça. Regardez plutôt la bâche : elle bouge toute seule, c'est le vent, il faut bien que quelque chose bouge. Demandez-moi autre chose, une chose moins lourde, s'il vous plaît. »

**tb-aveu** — *On veut seulement aider.* *(condition : {"et":[{"fait":"f-tobie-dans-la-roulotte"},{"ou":[{"flag":"colis-remis-a-mere-pivoine"},{"pnj":{"id":"tobie-pivoine","attitudeMin":30}}]}]})* — révèle f-tobie-a-vole-la-cle, f-cle-au-grenier, f-gedeon-et-la-dette — effets [{"objet":{"id":"porte-bonheur-de-funambule"}},{"flag":"tobie-confie"}]

> « Je devais 90 po à Gédéon Marchebise, le marchand de grain. Il m'avait prêté, et moi je n'ai jamais su rembourser ; il a menacé de faire saisir la roulotte de ma mère. Alors, un soir, j'ai pris la clé du coffre de la foire, pour payer en douce avec la bourse du concours. Puis j'ai eu peur, et j'ai perdu courage. Je l'ai cachée au grenier du moulin, dans une fente de la grosse poutre, et je suis venu me terrer ici. Je suis désolé, vraiment. Tenez, prenez mon porte-bonheur de funambule : il m'a porté sur la corde, il vous portera peut-être mieux que moi. »

### Les forains du camp (humain) — `pon-camp`

**Apparence** : Un petit groupe de forains, humains, réunis autour d'un feu de pierres, les mains tendues vers la flamme. Ils portent des vêtements de toile rayée, crème et rouge brique, usés aux genoux et aux manches. Aucun visage ne se détache : c'est une troupe, pas un portrait.

**Voix** : Plusieurs voix qui se coupent, rieuses, et qui s'arrêtent net quand un étranger approche. **Désir** : Une belle foire demain, avec du monde et de l'argent dans les poches. **Peur** : Qu'on touche à l'un des leurs.

**Salutations** — neutre : « Vous passez ou vous restez ? Le feu est là, mais ne marchez pas sur les répétitions. » · amicale : « Ah, des visages qu'on ne connaît pas ! Approchez, la marmite est presque chaude. » · hostile : « Vous n'êtes pas du camp. Gardez vos questions pour vous, et laissez la corde tranquille. »

**fc-preparation** — *Que préparez-vous pour demain ?* *(condition : {"pnj":{"id":"forains-du-camp","attitudeMin":0}})*

> « Demain, c'est la foire, alors tout le monde répète, même le feu a l'air pressé. Ici, sous le pont brisé, on a de la place, et personne ne vient nous marcher sur les pieds. Regardez près de la roulotte de tête : les costumes sont sortis de leur caisse, et l'on rentre les coutures qui ont lâché. Derrière les roulottes, l'accordéon répète la même phrase depuis ce matin ; vous finirez par la siffler sans le vouloir. On fera d'abord la corde, puis les numéros d'équilibre, et la musique jusqu'à la nuit. Vous voulez voir ? Mais pas de mains baladeuses sur les costumes, s'il vous plaît. »

**fc-tobie** — *Qui est Tobie, au juste ?* *(condition : {"pnj":{"id":"forains-du-camp","attitudeMin":0}})*

> « Tobie ? C'est un des nôtres, et le meilleur sur la corde, on ne le dira jamais assez. Mais il ne sort plus de la roulotte de sa mère depuis cette nuit, et nous ne le forçons pas à descendre. Sa mère est dans la roulotte, à l'écart, contre la berge. Elle a ses humeurs, et elle n'a pas besoin qu'on lui pose des questions au sujet de son fils. Alors on le laisse tranquille. Quand il sera prêt, il reviendra vers la corde, et le feu sera là. Ne vous fâchez pas si l'on ne vous répond pas tout de suite : ici, on se méfie des étrangers qui ont l'air pressé. »

**fc-camp** — *Pourquoi installer votre camp ici ?* *(condition : {"pnj":{"id":"forains-du-camp","attitudeMin":0}})*

> « Parce que la ville nous laisse la rive, chaque automne, depuis que le pont s'est effondré. Personne n'a envie de se battre pour un bout de berge qui ne sert à rien, et nous avons besoin d'un endroit plat et d'un peu d'eau. Les roulottes forment un demi-cercle, portes tournées vers la rivière, pour que le vent passe par-dessus le feu plutôt qu'à travers les toiles. Les piles, là-bas, coupent un peu le vent. Ce n'est pas un palais, mais la marmite tient sur son trépied. Chaque automne, on se dit que c'est la dernière fois, et chaque automne, on revient. Asseyez-vous donc, la fumée vous fera du bien. »

**fc-corde** — *Et cette corde, à quoi sert-elle ?* *(condition : {"pnj":{"id":"forains-du-camp","attitudeMin":0}})*

> « La corde, c'est notre école. On y monte à tour de rôle, d'abord la main sur le poteau, puis un pas, puis un autre, jusqu'à ce que les pieds sachent où ils vont. Le chanvre tendu chante quand le vent passe, et le petit apprend à l'écouter avant de regarder ses chevilles. Ce poteau-là, vous le voyez : le chêne est lisse et noirci à hauteur d'épaule, à force de s'y appuyer avant de monter. Les petits commencent par rester immobiles, les bras écartés, pendant que les grands leur disent quoi regarder. Vous voulez essayer ? Posez d'abord la main sur le chêne, puis levez le pied. »

## Les examens

**Les affiches de la troupe** (`pon-camp`) — *Des affiches de la troupe, collées au montant de la roulotte de tête, côté feu.*

> Les affiches sont collées au montant de la roulotte de tête, à hauteur de main, du côté du feu. Le papier, d'un crème jauni, porte des lettres rouge brique en gros caractères. Il y est question de la foire de demain et de numéros d'équilibre sur la corde. Une coulée de cire de bougie a glissé sur le bord, puis s'est figée en gouttes. Un coin s'est décollé, et quelqu'un l'a recollé avec un morceau de ruban de toile crème. Plus bas, la peinture bleu rivière de la roulotte s'écaille un peu, et la fumée du feu a noirci le bas de la page.

**Le poteau ouest de la corde** (`pon-camp`) — *Le poteau ouest de la corde : un chêne gris, poli et noirci à hauteur d'épaule.*

> Le poteau ouest de la corde est un tronc de chêne qui a grisé avec les années. À hauteur d'épaule, pourtant, le bois est devenu lisse comme un galet. Il est noirci à cet endroit, d'un brun presque luisant, et les fibres ont disparu sous la paume. Les marques sont larges, comme si des mains s'y étaient appuyées l'une après l'autre, à la même place, pendant des saisons. Le chanvre de la corde est noué au tronc un peu plus bas. Quand le soleil frappe le chêne, la chaleur monte doucement du bois. Vous passez la main sur le poteau, et votre paume glisse sans une seule écharde.

**Les piles du pont brisé** (`pon-camp`) — *Les piles du pont brisé, dressées dans l'eau brune, entre les arches tombées.*

> Les piles du pont se dressent dans la rivière, en pierre claire usée par l'eau. On voit encore, sur leurs flancs, les traces des cintres qui portaient les arches. Entre les piles, deux arches sont tombées d'un bloc ; ses pierres gisent sous l'eau brune, couvertes de boue et de mousse verte. La brume monte de l'eau le matin et se déchire contre les pierres. Au pied de la pile la plus proche, le courant fait un bruit continu, sans rythme. L'ombre froide des piles couvre la berge, et le soleil, qui ne passe pas entre elles, laisse une bande d'herbe grise sur la rive.

**La bâche rayée** (`pon-roulotte`) — *La bâche rayée, tendue sur sa corde de chanvre au milieu de la pièce.* — fait : f-tobie-dans-la-roulotte

> La bâche est rouge brique et crème, tendue sur une corde de chanvre qui coupe la pièce en deux. Elle ne pend pas droit : elle bombe un peu, comme poussée de l'autre côté. Sous son bord, à quelques pouces du plancher usé, apparaît le bout d'un soulier souple de funambule, en cuir fin, immobile. Plus haut, la toile monte et descend doucement, au rythme d'une respiration qui ne cherche pas à se cacher. Le vent qui entre par la porte la fait claquer par moments, puis elle retombe, et le soulier reste à sa place. De ce côté-ci de la toile, personne ne parle.

**La poupée de bois** (`pon-roulotte`) — *Une poupée de bois peinte en bleu, un ruban crème noué au cou, sur la tablette.*

> Sur la tablette, au-dessus de la lampe, une poupée de bois est assise, les jambes croisées. Elle est peinte en bleu rivière, la peinture encore vive sur les joues et le front, et un ruban de toile crème est noué autour de son cou, bien serré. Le bois est lisse, sans la moindre écaille, et la poupée paraît posée là depuis peu. Son regard de bois tombe sur la porte, et la lumière grise glisse sur sa peinture bleue, sans la faire briller.

> Variante *(condition : {"lieu":"ver-sanctuaire"})* : Sur la tablette, au-dessus de la lampe, une poupée de bois est assise, les jambes croisées. Elle est peinte en bleu rivière, la peinture encore vive sur les joues et le front, et un ruban de toile crème est noué autour de son cou, bien serré. Le bois est lisse, sans la moindre écaille, et la poupée paraît posée là depuis peu. Son regard de bois tombe sur la porte, et la lumière grise glisse sur sa peinture bleue, sans la faire briller. Vous reconnaissez ce bleu et ce ruban : les ex-voto du sanctuaire de la Rive en portent de semblables, trait pour trait.

**Le coffre à costumes** (`pon-roulotte`) — *Le coffre à costumes, en bois peint, contre le mur est, sous la petite fenêtre.*

> Le coffre à costumes est contre le mur est, juste sous la petite fenêtre, et la lumière grise y tombe en biais. Il est en bois peint, d'un ocre passé sur un fond vert mousse, et ses arêtes sont renforcées de cerclages de fer rouillés. Des traces de pas usent la peinture du bas, là où l'on s'agenouille pour l'ouvrir. Le couvercle est bombé, et les charnières ont été graissées récemment. Quand le vent entre par la porte, le couvercle tremble un peu dans son berceau de bois. Vous sentez la poussière et la cire chaude, et rien d'autre que le bois qui reste tiède.

**Les sept étoiles** (`pon-roulotte`) — *Sept étoiles ocre peintes en rang sur le montant de la petite fenêtre.*

> Sept étoiles ocre sont peintes en rang sur le montant de la petite fenêtre. Elles ont à peu près la même taille, et la même pointe, comme si une seule main les avait tracées l'une après l'autre, sans se presser. La lumière grise les rend presque mates, et le bois autour, du sapin bleu, est écaillé par le soleil. Rien n'est écrit à côté, aucune lettre, aucune date. Vous comptez une deuxième fois, pour être sûr : il y en a bien sept.

## Le contenant

**La caisse de costumes** (`pon-camp`) — Une caisse de costumes, en bois peint, glissée sous l'auvent de la roulotte la plus à l'est, côté corde. Elle est posée à même le sol, à l'abri de la pluie, à portée de main de qui passe devant la corde.
