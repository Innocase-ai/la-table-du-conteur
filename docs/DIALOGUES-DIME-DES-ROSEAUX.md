# Dialogues — La Dîme des Roseaux

Les 16 PNJ du monde, leurs 97 sujets de conversation, leurs secrets et leurs variantes de salutation. Chaque sujet est un bouton : il se déclenche sur des mots, répond dans la voix du personnage, peut révéler un fait et changer une quête, une attitude ou un drapeau.

Trois compagnons recrutables (Perrine, Aveline, Bram), trois marchands (Bastien, Marin, Célestin) et dix autres personnages. Les six du cœur de l'intrigue sont Anselme, Huguette, Lina, Skarn, Varg et Colin.

## Vue d'ensemble

| PNJ | Rôle | Lieu | Sujets | Secrets | Variantes |
|---|---|---|---:|---:|---:|
| Anselme Roux | Meunier de Mireval, gardien du pacte de grain et père de Lina | mir-moulin-roux | 6 | 1 | 4 |
| Huguette | Maire de Mireval, la voix du village et sa mémoire | mir-place-du-marche | 7 | 1 | 5 |
| Bastien | Aubergiste halfelin de Mireval, bavard, comptable de toutes les rumeurs du village | mir-auberge-des-roseaux | 6 | 1 | 3 |
| Perrine Vasseur | Rôdeuse du village, sœur de Colin, recrutable | mir-grenier | 6 | 1 | 3 |
| Aveline Ker | Guérisseuse itinérante, clerc de la Dame des Roseaux | mir-auberge-des-roseaux | 4 | 1 | 2 |
| Célestin Brindille | Colporteur, marchand d'articles de survie sur la place de Mireval | mir-place-du-marche | 4 | 0 | 1 |
| Bram Cœur-de-Tourbe | Mineur retraité, connaît la vieille galerie de la mine | mir-grenier | 4 | 1 | 1 |
| Krik | Jeune guerrier gobelin qui garde le sentier des roseaux avec une patrouille ; impulsif, il veut prouver sa valeur à Skarn. | mar-sentier-des-roseaux | 8 | 1 | 4 |
| Marin | Passeur qui loue sa barque et son silence à travers le marais ; il vend le passage, les nouvelles et la carte du marais. | mar-cabane-des-passeurs | 9 | 1 | 4 |
| Lina Roux | Négociatrice malgré elle : elle tient la parole de Mireval auprès de Skarn | gro-cellule-de-lina | 6 | 1 | 3 |
| Skarn | Chef de la tribu : il décide du grain, de la paix et des dettes | gro-salle-commune | 6 | 1 | 3 |
| Nyx | Chamane : les os, les signes, les morts et la méfiance envers les humains | gro-salle-commune | 5 | 2 | 2 |
| Miette | Enfant de la tribu : elle sait tout ce qui se passe dans la grotte | gro-salle-commune | 5 | 0 | 2 |
| Varg | Capitaine hobgobelin, maître du péage et de la mine | min-bureau-de-varg | 8 | 2 | 4 |
| Grum | Garde du corps de Varg, fatigué de la guerre | min-camp-hobgobelin | 7 | 2 | 4 |
| Colin Vasseur | Charretier de Mireval, prisonnier à la veine de fer | min-veine-de-fer | 6 | 1 | 4 |

## Mireval

### Anselme Roux

**Meunier de Mireval** — mir-moulin-roux

> Le moulin tourne encore. Si c'est le grain que vous cherchez, il n'est pas ici.

#### Où est passée la charrette de l'automne ?


Anselme s'essuie les mains et regarde la porte. La charrette est partie avant l'aube avec Colin Vasseur et onze sacs, comme chaque automne ; elle devait être de retour en deux jours. Elle n'est pas revenue. Il dit que les gobelins l'ont prise sur la chaussée, et il ne vous regarde pas en le disant.

Révèle : f-charrette-saisie.

#### Que savez-vous de Lina ?


Sa voix se casse. Lina a suivi la charrette ce matin-là, elle a voulu savoir ce qui était arrivé au grain, et les gobelins l'ont gardée. Il répète le mot « enlevée » comme s'il le tenait entre ses doigts. Il refuse de dire comment il sait où elle est, et sa main tremble sur le rebord de la meule.


#### Le grenier tiendra-t-il l'hiver ?


Il dit que le grenier est plein, que le village s'inquiète pour rien, qu'un hiver est long mais qu'on a vu pire. Puis il se tait, et l'on entend l'eau passer sous le plancher. Si on insiste, il finit par admettre qu'il ne reste pas grand-chose, et que ce qui manque ne s'est pas perdu tout seul.

Révèle : f-grenier-vide.

#### Tenez-vous un registre des sacs qui partent ?


Il hausse les épaules : un meunier compte par le sac, pas par le livre, et les écritures ne nourrissent personne. Sa main se pose pourtant à plat sur le coffre de farine, tout près de l'échelle de l'étage, et il change de sujet en proposant du pain.

Effets : [{"flag":"z1-anselme-sous-pression"}].

#### Qu'avez-vous promis aux gobelins ?

*Condition :* {"ou":[{"flag":"z1-anselme-sous-pression"},{"objet":"registre-du-moulin"},{"flag":"pacte-revele"}]}

Il s'assoit sur un sac, soudain très vieux. Il y a quatre ans, la récolte s'est perdue ; il est monté voir Skarn avec du grain, des outils et une promesse : une part chaque automne, et la tribu reste loin du village. Le pacte a tenu, le village a vécu, et le grenier s'est vidé. Cette année, les hobgobelins ont pris la charrette avant les gobelins. Il vous demande de ne rien dire, puis il se tait comme s'il savait que c'était perdu.

Révèle : f-pacte-du-meunier.
Effets : [{"flag":"pacte-revele"},{"attitude":{"pnj":"anselme-roux","delta":5}}].

#### Le moulin tourne-t-il encore ?


La roue a perdu une aube et le bief s'engorge depuis la dernière crue ; il faudrait trois hommes dans l'eau froide et un charpentier pour la remettre. Il parle de sa meule comme d'une bête malade, avec une tendresse qui ne s'entend pas quand il parle des gens.


**Variantes de salutation**

- Si {"flag":"pacte-revele"} : Vous savez, maintenant. Alors dites-moi ce que vous voulez faire de moi : le village aura besoin d'un coupable, et j'ai déjà le tablier.
- Si {"flag":"lina-retrouvee"} : Elle est revenue. Je lui ai menti pendant quatre ans, et elle est revenue. Je ne sais pas encore comment la regarder.
- Si {"objet":"registre-du-moulin"} : Vous avez le livre. Ne le montrez pas sur la place, je vous en prie : ils me pendraient au mât avant la nuit, et Lina n'aurait plus de père.
- Si {"flag":"z1-roue-reparee"} : Vous avez remis la roue en marche. Ça ne change rien au reste, mais ça fait du bien d'entendre l'eau travailler.

### Huguette

**Maire de Mireval** — mir-place-du-marche

> Vous êtes les étrangers du pont. Ici, on vous écoutera, mais on vous comptera.

#### Comment va le village ?


Elle dit les choses comme un rapport : soixante-deux bouches, six miliciens, deux lances qui ne valent rien, des rations depuis trois semaines et un hiver qui arrive plus vite que prévu. Elle ajoute que le village tient, parce que c'est son rôle de le dire, et que si quelqu'un a une autre idée, il peut la dire maintenant.

Effets : [{"quete":{"id":"q-la-dime","statut":"proposee"}}].

#### Que savez-vous de la charrette disparue ?


La charrette est partie du moulin avec Colin et onze sacs, et elle n'est jamais arrivée au village. Huguette n'y croit pas à l'enlèvement : un meunier qui crie au loup cache un agneau, dit-elle. Elle a vu Anselme changer de version trois fois en une semaine.

Révèle : f-charrette-saisie.

#### Peut-on voir la réserve du grenier ?


La réserve est fermée, et elle en garde la clé. Elle ne l'ouvrira pas pour la curiosité d'étrangers : l'hiver est long et les sacs sont comptés. Mais si le groupe veut aider le village, elle veut bien parler de ce qu'il reste, et de ce qu'elle craint d'y trouver.

Révèle : f-grenier-vide.
Effets : [{"quete":{"id":"q-mireval-le-grenier","statut":"proposee"}}].

#### Nous confierez-vous la clé de la réserve ?

*Attitude minimale :* 20

Elle décroche une clé de fer de son trousseau, la pèse dans sa paume et la tend à contrecœur. Le grain est au village, dit-elle ; elle compte les sacs, et elle saura qui les a pris. Elle sait aussi qu'un sac de grain peut sauver une vie, et que cela ne se refuse pas toujours.

Effets : [{"objet":{"id":"cle-du-grenier"}},{"flag":"z1-cle-du-grenier"}].

#### Soupçonnez-vous un accord avec les gobelins ?

*Condition :* {"ou":[{"objet":"registre-du-moulin"},{"flag":"pacte-revele"}]}

Elle ne se récrie pas. Elle savait, ou elle s'en doutait, depuis le deuxième automne : les gobelins ne sont pas venus, le village n'a pas brûlé, et le meunier était trop calme. Elle a laissé faire quatre ans parce que la paix nourrissait mieux que la vérité. Maintenant, dit-elle, il faudra choisir ce qu'on avoue.

Révèle : f-pacte-du-meunier.
Effets : [{"flag":"pacte-revele"},{"attitude":{"pnj":"huguette","delta":5}}].

#### Qui peut nous guider dans les roseaux ?


Perrine Vasseur, la sœur de Colin, connaît les pistes mieux que la milice. Elle dort au grenier depuis que son frère a disparu et elle ne boit plus. Huguette ajoute qu'elle partira seule un de ces matins si personne ne lui promet de le retrouver, et qu'elle préférerait que ce soit vous.

Effets : [{"attitude":{"pnj":"perrine-vasseur","delta":5}}].

#### Comment traverse-t-on le marais ?


Marin et sa barque. Il connaît les chenaux mieux que les hobgobelins, mais il ne prend parti pour personne : il vend le passage, les nouvelles et parfois le silence. Il n'aime pas la compagnie du Péage, ce qui ne veut pas dire qu'il vous aidera gratis.

Révèle : f-passeurs-neutres.

**Variantes de salutation**

- Si {"flag":"pacte-revele"} : Je savais. Quatre ans que je savais, et je n'ai rien dit. Maintenant que tout le monde le sait, dites-moi ce que je dois faire du meunier.
- Si {"flag":"grenier-ouvert"} : La réserve est ouverte, et le village a vu ce qu'il y avait dedans. Vous avez gagné ma confiance et perdu mon silence.
- Si {"flag":"z1-cle-du-grenier"} : La clé est à vous, mais le grain est au village. Je compte les sacs, et je saurai qui les a pris.
- Si {"flag":"z5-ultimatum"} : Ils demandent la moitié du grenier. La moitié, alors qu'il n'y en a pas la moitié. Dites-moi quoi répondre, parce que je n'ai plus de mots.
- Si {"pnj":{"id":"perrine-vasseur","etat":"parti"}} : Perrine est partie avec vous. Ramenez-la, et ramenez son frère : je ne veux pas inscrire deux noms sur la porte du grenier.

### Bastien

**Aubergiste des Roseaux** — mir-auberge-des-roseaux

> Entrez, entrez ! On ferme la porte, pas la bouche.

#### Avez-vous vu partir la charrette de grain ?


Il l'a vue partir avant l'aube, avec Colin qui sifflait et onze sacs bien sanglés. Puis il a entendu des roues revenir trop vite, sans chanson, et plus rien. Il raconte ça avec des gestes de comptoir, mais il s'arrête pile quand on demande ce qu'il a vu au pont, et se met à essuyer une chope déjà propre.

Effets : [{"quete":{"id":"q-bastien-la-rumeur","statut":"proposee"}}].

#### Que disent les hobgobelins quand ils boivent ici ?


Ils ne boivent pas ici, et c'est bien le problème : ils boivent au pont, entre eux, et paient en vieilles pièces. Un seul est entré cet hiver, un grand sec avec une plaque de sergent ; il a dit que la compagnie payait la route, que le village devrait être content, et il est reparti sans finir sa chope.


#### Les gobelins venaient-ils au village ?


Il y a quatre ans, des gobelins venaient encore avec des paniers et des peaux, et ils payaient en grain. Puis ils ont arrêté du jour au lendemain, et personne n'a trouvé ça bizarre. Bastien, lui, a trouvé ça très bizarre, mais il a servi à boire et n'a rien demandé.

Révèle : f-tribu-affamee.

#### Qui connaît le chemin du marais ?


Marin, le passeur, et sa barque plate. Il connaît les chenaux, les îles de roseaux et les endroits où l'eau monte sans prévenir. Il ne prend parti pour personne et n'aime pas les hobgobelins ; il vend le passage, et Bastien conseille de payer sans discuter.

Révèle : f-passeurs-neutres.

#### Que savez-vous de Perrine et de Colin ?


Colin était charretier, le meilleur du village pour faire passer une charrette sur une chaussée noyée. Sa sœur Perrine est éclaireuse ; depuis qu'il a disparu, elle dort au grenier, ne boit plus et regarde la route. Bastien dit qu'elle partira seule si personne ne l'aide, et que ce serait dommage.


#### Quelles sont les rumeurs du village ?


Il en connaît trois, et il les déballe comme des cartes : le grenier serait plus plein qu'on ne le dit, le meunier enverrait du grain en amont la nuit, et les hobgobelins attendraient quelque chose. Laquelle est vraie ? Il sourit, pose le coude sur le comptoir, et attend de voir si l'on comprend le prix d'une réponse.


**Variantes de salutation**

- Si {"flag":"z1-bastien-complice"} : Vous avez payé, alors je parle : mais pas ici, près du feu. Les murs de mon auberge ont des oreilles et le pain a des dents.
- Si {"flag":"grenier-ouvert"} : On dit que la réserve est ouverte. Ce soir, il y aura plus de monde que de soupe, et je ne sais pas si je dois m'en réjouir.
- Si {"flag":"pacte-revele"} : Le meunier a menti au village pendant quatre ans, et c'est moi qui ai servi à boire à tout le monde. Je ferme plus tôt, ce soir.

### Perrine Vasseur

**Éclaireuse de Mireval** — mir-grenier

> Vous êtes du pont. Vous avez vu les hobgobelins ? Bien. Alors écoutez.

#### Parlez-nous de votre frère Colin.


Colin conduit la charrette depuis six ans ; il chante aux chevaux dans les mauvais passages et il n'a jamais perdu un sac. Elle a suivi ses traces jusqu'au pont : la charrette a tourné vers les collines, et des bottes de hobgobelins ont piétiné la berge. Son frère ne s'est pas enfui, dit-elle, et elle veut qu'on le lui prouve.

Révèle : f-charrette-saisie.
Effets : [{"quete":{"id":"q-perrine-colin","statut":"proposee"}}].

#### Qu'avez-vous vu sur la piste de la charrette ?


Des roues enfoncées jusqu'au moyeu, un demi-tour brutal au sortir du pont, et des empreintes de bottes qui montent vers le nord. Le grain n'est pas allé chez les gobelins par la chaussée : quelqu'un l'a détourné avant. Elle n'a pas dormi depuis deux nuits en cherchant la suite de la piste.

Révèle : f-charrette-saisie.

#### Pourquoi dormez-vous au grenier ?


Parce qu'elle y garde la réserve, et parce qu'elle n'a pas envie de dormir sous le toit d'un village qui parle trop. Elle finit par avouer que la réserve est presque vide, et qu'elle a trouvé la clé de Huguette sur son clou, derrière la porte, plus d'une fois.

Révèle : f-grenier-vide.
Effets : [{"flag":"z1-cle-signalee"}].

#### Ouvrons-nous la réserve du grenier ?

*Condition :* {"objet":"cle-du-grenier"}

Elle prend la clé, la tourne deux fois dans le cadenas, et pousse la porte de chêne. Les sacs sont là, alignés, et la plupart sont plats ; il reste de quoi tenir quelques semaines si l'on rationne encore. Elle ne dit rien, mais elle vous laisse compter avec elle.

Révèle : f-grenier-vide.
Effets : [{"flag":"grenier-ouvert"}].

#### Nous accompagnerez-vous jusqu'à la mine ?

*Attitude minimale :* 20

Elle ajuste son arc et vous regarde bien en face : elle vient, à une condition, que l'on ramène Colin vivant. Elle prévient qu'elle n'est pas une enfant à protéger et qu'elle connaît les roseaux mieux que vous ; puis elle rassemble ses affaires avant que vous ne changiez d'avis.

Effets : [{"flag":"perrine-recruite"},{"attitude":{"pnj":"perrine-vasseur","delta":10}}].

#### Que faites-vous la nuit dans les roseaux ?


Elle compte les hobgobelins du pont : trois en permanence, relevés au matin et au soir, et un sergent qui garde un cor sous son manteau. Elle a vu aussi des traces de gobelins dans les roseaux du sud, maigres, qui ne volent rien. Elle dit que les deux camps cherchent quelque chose, et qu'elle n'aime pas ça.


**Variantes de salutation**

- Si {"flag":"colin-libere"} : Colin est libre. Je ne sais pas comment vous remercier sans pleurer, alors je vous suis. Où qu'on aille.
- Si {"flag":"perrine-recruite"} : Je suis avec vous, mais je préviens : si on me cache quelque chose sur mon frère, je partirai sans un mot.
- Si {"flag":"pacte-revele"} : Le meunier a vendu le grain du village, et Lina est allée payer sa dette. Mon frère a payé aussi. Ça, je ne l'oublierai pas.

### Aveline Ker

**Sœur des roseaux** — mir-auberge-des-roseaux

> Vous êtes les étrangers du pont. Vous avez du sang sur les manches ou seulement de la boue ?

#### Qui soignez-vous, ici ?


Ceux qui peuvent payer en grain, ceux qui ne peuvent pas, et les prisonniers quand on me laisse approcher de la mine. Colin Vasseur tousse depuis trois semaines ; on l'a mis à la veine parce qu'il connaît le grain, pas parce qu'il sait tenir un pic.

Révèle : f-colin-prisonnier.
Effets : [{"attitude":{"pnj":"aveline-ker","delta":5}}].

#### Aidez-nous à sortir les prisonniers de la mine.


Je ne peux pas y entrer seule, et je ne sais pas me battre. Mais je connais leurs blessures, leurs noms et ce que Varg leur fait porter. Si vous y allez, je viens : je soignerai ceux que vous ramènerez.

Effets : [{"quete":{"id":"q-aveline-les-prisonniers","statut":"proposee"}},{"attitude":{"pnj":"aveline-ker","delta":10}}].

#### Voulez-vous venir avec nous ?


Si vous allez à la mine, oui. Je ne porterai pas d'épée, mais je porterai les blessés. Et si vous fuyez devant Varg, ne comptez pas sur moi pour vous suivre.

Effets : [{"flag":"aveline-recruite"},{"attitude":{"pnj":"aveline-ker","delta":15}},{"quete":{"id":"q-aveline-les-prisonniers","statut":"proposee"}}].

#### En qui croyez-vous ?


La Dame des Roseaux n'a pas de temple : elle a des fièvres, des accouchements et des gens qui n'ont plus rien. Je lui parle dans les granges. Elle ne promet pas de vaincre Varg ; elle promet qu'on ne mourra pas seul.


**Variantes de salutation**

- Si {"flag":"colin-libere"} : Vous avez sorti Colin de la mine. Asseyez-vous : je vous dois des soins, et je n'aime pas les dettes.
- Si {"flag":"pacte-revele"} : Le village parle du registre. Moi, je regarde les blessés : ils n'ont pas l'air d'un pacte.

### Célestin Brindille

**Colporteur de la place** — mir-place-du-marche

> Approchez, approchez. Enfin, pas trop : la brouette est fragile et la clientèle aussi.

#### Pourquoi vos prix sont-ils si hauts ?


Le pont, les patrouilles, la crue. Chaque sac qui arrive ici a payé trois péages et une peur. Vous voulez du grain ? J'en ai. Vous voulez le prix d'avant le siège ? Allez le chercher à Laelith.

Effets : [{"attitude":{"pnj":"celestin-brindille","delta":5}}].

#### Que savez-vous de la route du pont ?


Les hobgobelins comptent les charrettes et taxent les mules. Ils ont laissé passer la mienne parce que j'ai payé en grain, pas en or. Si vous voulez sortir de Mireval, il faudra leur donner quelque chose qu'ils ne comptent pas.

Révèle : f-double-tribut.

#### Qu'avez-vous à vendre ?


Des rations, des torches, de l'huile, de la corde, une potion de guérison et deux couvertures. Pas de fer : le fer, ici, c'est Varg qui le garde. Tout se paie d'avance, sauf si vous m'apportez du grain.


#### Quelles sont les nouvelles ?


On dit que la charrette n'est jamais arrivée chez les gobelins, et que les gobelins n'ont jamais eu aussi faim. On dit aussi que Varg fait travailler des prisonniers à la veine. Moi, je dis que tout le monde a raison et que personne ne paie.

Révèle : f-charrette-saisie, f-tribu-affamee.

**Variantes de salutation**

- Si {"flag":"pacte-revele"} : Le registre du meunier, hein ? J'aurais pu vous le vendre, si j'avais su qu'il valait autant.

### Bram Cœur-de-Tourbe

**Vieux mineur** — mir-grenier

> Un nain, deux humains et des bottes de la ville. Vous montez à la mine ou vous venez compter le grain ?

#### Que savez-vous de la vieille mine ?


Mon père l'a creusée avant que les hommes de Varg y mettent leurs bottes. Il y a un boyau derrière la galerie effondrée, et un abri où les mineurs dormaient. Si quelqu'un veut entrer sans passer par le porche, c'est là qu'il faut chercher.

Révèle : f-mine-de-fer.
Effets : [{"attitude":{"pnj":"bram-coeur-de-tourbe","delta":5}}].

#### Pouvez-vous nous montrer le passage de la galerie ?


Je peux vous dire où il est, mais mes jambes ne montent plus jusqu'à la grotte. Il y a un contrepoids de bois, derrière l'éboulement : quatre leviers, deux montants et deux traverses. Si vous les bougez dans le bon sens, le boyau s'ouvre.

Effets : [{"quete":{"id":"q-bram-la-galerie","statut":"proposee"}},{"flag":"bram-indique-galerie"},{"attitude":{"pnj":"bram-coeur-de-tourbe","delta":10}}].

#### Viendrez-vous avec nous jusqu'à la mine ?


Jusqu'à la galerie, oui. Après, je ne promets rien : je sais frapper, mais je ne sais plus courir. Et si vous trouvez la veine de mon père, ne la laissez pas à Varg.

Effets : [{"flag":"bram-recruite"},{"attitude":{"pnj":"bram-coeur-de-tourbe","delta":15}},{"quete":{"id":"q-bram-la-galerie","statut":"proposee"}}].

#### Avez-vous perdu quelqu'un dans la mine ?


Deux frères, il y a trente ans, dans un éboulement que personne n'a creusé assez vite. Leur nom est gravé sur une poutre de l'abri. Si vous y allez, ne marchez pas sur la paille sans regarder.

Effets : [{"attitude":{"pnj":"bram-coeur-de-tourbe","delta":5}}].

**Variantes de salutation**

- Si {"flag":"colin-libere"} : Vous avez sorti le charretier. La mine n'a pas tout pris, cette fois.

## Le marais

### Krik

**Jeune guerrier de la tribu de Skarn** — mar-sentier-des-roseaux

> Une silhouette se dresse dans les roseaux, cimeterre en travers du sentier. « Halte. On paie pour passer, ici. Même les humains. »

#### Pourquoi barrez-vous le sentier ?


Il ne barre pas le sentier, il le garde : la tribu veut savoir qui entre dans le marais et ce que les humains viennent y chercher. Depuis que les hobgobelins tiennent le pont, personne ne passe sans payer quelqu’un. Il demande ce que le groupe apporte, et son regard descend vers les bourses.


#### Votre tribu mange-t-elle à sa faim ?


Il hausse les épaules, puis parle trop vite : le grain du meunier n’est pas venu cette année, les collets du sentier sont vides, et les petits mangent les racines qu’on réservait aux chèvres. Skarn dit qu’ils tiendront un mois. Krik, lui, ne veut pas compter les jours.

Révèle : f-tribu-affamee.

#### Offrir une part de vos rations.

*Condition :* {"objet":"rations"}

Il regarde le paquet sans le prendre, puis l’empoche d’un geste sec et mâche trop vite pour faire semblant. Il dit que les humains ne donnent jamais rien, que c’est peut-être une ruse, et il reste debout entre le groupe et le sentier. Puis il s’écarte d’un demi-pas, ce qui, chez lui, est une faveur.

Effets : [{"objet":{"id":"rations","retirer":true}},{"attitude":{"pnj":"krik","delta":15}}].

#### Avez-vous vu passer la charrette du meunier ?


Il devient prudent d’un coup : les hobgobelins ont barré le pont, le grain n’est pas venu, et ce n’est pas aux gobelins qu’il faut le demander. Il dit qu’il n’était pas là, et il le dit une fois de trop. Sa nuque rougit jusqu’aux oreilles, et il change de sujet.


#### Où est la fille du meunier ?

*Attitude minimale :* 10

Dans les grottes, avec la tribu. Elle est venue parler à Skarn, pas se faire prendre ; elle a du cran, pour une humaine. Skarn la traite comme une invitée et lui a donné la meilleure couverture. Krik ne sait pas ce qu’elle attend, mais il trouve qu’elle pose trop de questions.

Révèle : f-lina-otage.

#### Que veulent les hobgobelins ?


Le double, à présent : au village comme à la tribu. Ils ont pris le pont, ils comptent les sacs, ils parlent de la mine comme d’un héritage. Krik dit qu’un jour ils viendront compter les gobelins eux-mêmes, et il tapote le pommeau de son cimeterre.

Révèle : f-double-tribut.

#### Que sortent-ils de la colline ?


Des sacs de caillou rouge, la nuit, tirés par des hommes enchaînés. Krik a vu la file passer sous le pont et il a compté les sacs jusqu’à cent avant de se lasser. Il ne comprend pas ce qu’on trouve à cette pierre lourde, mais les hobgobelins la portent comme du grain.

Révèle : f-mine-de-fer.

#### Où trouver le passeur ?


Le vieux Marin vend le passage à tout le monde, aux gobelins comme aux hobgobelins, et cela ne plaît pas à Krik. Il dit qu’un homme sans camp finira par en avoir un, et que ce jour-là il faudra choisir. Puis il indique la cabane d’un mouvement du menton : c’est au bout du sentier, et c’est payant.


**Variantes de salutation**

- Si {"flag":"alliance-gobeline"} : Krik accourt, essoufflé, et s’arrête net devant le groupe. « Skarn dit que vous êtes des nôtres. » Il ne sait pas encore s’il doit s’en réjouir, et cela se voit à sa mâchoire.
- Si {"fait":"f-charrette-saisie"} : Il ne lève pas son cimeterre. « Vous savez, alors. Pour la charrette. » Il regarde les roseaux comme s’il y cherchait encore les hobgobelins, puis s’écarte du sentier sans rien demander.
- Si {"faction":{"id":"tribu-de-skarn","max":-30}} : Sa patrouille se déploie dans les roseaux sans un mot. Krik ne menace pas, ne plaisante pas : il compte les armes du groupe, une à une, et attend qu’on fasse le premier pas.
- Si {"heros":{"classe":"rodeur"}} : Il regarde les bottes de l’éclaireur, puis la ligne des roseaux derrière lui. « Vous marchez sans casser les tiges. C’est bien. Les autres laissent un chemin qu’on suit. »

### Marin

**Passeur des roseaux** — mar-cabane-des-passeurs

> Il ne se lève pas de son banc. « Le passage, la carte ou les nouvelles ? Tout se paie, et je ne fais pas crédit. »

#### Combien pour traverser le marais ?


Il donne son tarif sans se lever : tant par tête, la barque et lui compris, payés d’avance. Il ne promet ni la lune ni la marée ; il promet d’arriver au sec, et il tient. Il ajoute qu’il ne transporte ni les hobgobelins en armes ni les gens qui mentent sur leur cargaison.

Effets : [{"quete":{"id":"q-marin-le-passage","statut":"proposee"}}].

#### Avez-vous une carte du marais ?

*Condition :* {"ou":[{"faction":{"id":"passeurs-des-roseaux","min":40}},{"pnj":{"id":"marin","attitudeMin":40}}]}

Il a mieux qu’une carte : un relevé des chenaux, copié sur un vieux plan d’archive et corrigé de sa main, où figure le passage qui mène derrière la colline. D’ordinaire il le vend, et cher. Cette fois il le sort de dessous les planches, le déplie sur la table et le pousse vers le groupe sans un mot.

Effets : [{"objet":{"id":"carte-du-marais","quantite":1}},{"attitude":{"pnj":"marin","delta":5}},{"narration":"Marin vous confie la carte du marais : le chenal derrière la cabane mène à la mine."}].

#### Le marais est-il dangereux ?


Il énumère sans s’énerver : l’eau monte au crépuscule par les chenaux et coupe le sentier en deux ; le sable, à droite des rondins, avale un homme en trois pas ; les roseaux cachent des collets qui ne sont pas à lui. Il conseille de marcher avant la nuit et de ne jamais quitter les fascines.


#### Traitez-vous avec les hobgobelins ?


Il dit que tout le monde paie, ici : les gobelins en peaux de poisson, les hobgobelins en pièces, le village en grain. Lui ne prend parti pour personne, il prend le prix. Puis il ajoute, plus bas, qu’il n’aime pas leur façon de compter les personnes comme du bétail.

Révèle : f-passeurs-neutres.

#### Que savez-vous de la mine ?


Il a descendu des sacs de caillou rouge, l’an dernier, jusqu’à la chaussée ; la pierre pesait plus lourd que le grain et rapportait moins. Depuis, les hobgobelins ont doublé les passages et parlent de la veine comme d’un héritage. Il dit que le fer est la seule chose que Varg n’ait pas volée : il l’a prise.

Révèle : f-mine-de-fer.

#### Avez-vous vu la charrette du meunier ?

*Attitude minimale :* 20

Il ne répond pas tout de suite. Il a vu passer, une nuit, une charrette escortée de hobgobelins sur le vieux chemin de halage ; le charretier marchait devant, une corde aux poignets. Il n’a pas bougé de sa barque, et il ne dit pas s’il l’a regretté.

Révèle : f-charrette-saisie.

#### Que faisiez-vous au printemps dernier ?

*Condition :* {"pnj":{"id":"marin","attitudeMin":30}}

Il ne nie pas. Au printemps, la compagnie a payé pour deux barques et une nuit sans lune : des outils, des cordes, des sacs de chaux, et des hommes qui ne parlaient pas. Il a conduit jusqu’au chenal de la halde, il a été payé, et il est revenu. Il dit qu’il ne savait pas ce qu’on construisait là-haut, et qu’il ne veut pas le savoir.

Effets : [{"narration":"Marin avoue avoir conduit un convoi de la compagnie jusqu’à la halde, au printemps, sans demander ce qu’il transportait."},{"attitude":{"pnj":"marin","delta":5}}].

#### Qu’est-ce que vous refusez de transporter ?


Des armes destinées à un village, des gens enchaînés, et les questionneurs qui ne paient pas. Il a ses règles et il les tient depuis vingt ans ; c’est pour cela qu’on lui confie encore des choses qu’on ne confierait pas à un honnête homme.


#### Pourquoi faites-vous payer si cher ?


Parce que la barque prend l’eau, que les roseaux mangent les perches et que personne ne paie un passeur mort. Il dit que la neutralité n’est pas gratuite : chaque pièce qu’il prend est une raison de plus de ne pas choisir de camp.


**Variantes de salutation**

- Si {"flag":"route-des-roseaux-ouverte"} : Il a sorti la carte et l’a posée entre vous, les quatre coins tenus par des cailloux. « Le chenal est bon jusqu’à la colline. Revenez par le même chemin, ou ne revenez pas. »
- Si {"fait":"f-charrette-saisie"} : « Vous savez, pour la charrette. » Il essuie un gobelet qui n’en a pas besoin. « Je n’ai rien fait cette nuit-là. Je ne veux pas qu’on me le rappelle, et je ne veux pas qu’on me le reproche. »
- Si {"faction":{"id":"compagnie-du-peage","min":40}} : Il vous regarde comme on regarde une marchandise dont on connaît déjà le prix. « On dit que vous parlez à Varg. Moi, je parle à tout le monde. La différence, c’est que je le dis. »
- Si {"heros":{"classe":"rodeur"}} : Il jette un œil aux bottes de l’éclaireur, puis à la ligne d’eau sur les pilotis. « Vous avez vu l’eau monter, pas vrai ? Ceux qui la voient une fois ne l’oublient plus. »

## La grotte des roseaux

### Lina Roux

**Fille du meunier, otage d'honneur de la tribu** — gro-cellule-de-lina

> Vous n'êtes pas du village. Pourtant vous avez la pluie de Mireval sur les épaules.

#### Que savez-vous du pacte de votre père ?


Elle parle vite, en comptant sur ses doigts : quatre automnes, quatre charrettes parties du moulin, du grain et des outils contre la paix. Elle dit que le grenier s'est vidé à ce prix, qu'elle a vu les comptes et la manière dont son père les rangeait, et que le village entier ignore d'où venait cette tranquillité. Elle ajoute qu'un accord pareil ne se raconte pas au marché.

Révèle : f-pacte-du-meunier.

#### Que veut Varg, exactement ?


Elle dit que Varg a fait porter un ordre par un homme à cheval : le double du tribut, du village comme de la tribu, avant les premières gelées. Elle précise que la tribu n'a rien reçu cette année, que la charrette n'est jamais venue, et que Skarn se retrouve à devoir payer pour un grain qu'il n'a pas mangé.

Révèle : f-double-tribut.

#### Où est passée la charrette ?


Elle raconte le départ du moulin à la date dite, Colin Vasseur sur le siège et le grain de la part derrière. La charrette n'est jamais arrivée. On a suivi la trace des roues jusqu'au pont, puis plus rien : ni grain, ni charrette, ni Colin. Elle pense qu'on l'a détournée, mais elle ne sait pas par qui, et elle n'aime pas le deviner tout haut.


#### Pourquoi restez-vous dans cette grotte ?


Elle dit qu'elle mange à la table de Skarn, qu'elle a une porte, une lanterne et de la paille propre, et qu'on ne la touche pas. Elle appelle cela une otage d'honneur : sa présence garantit que Mireval paiera. Puis, plus bas, elle ajoute que partir maintenant ferait croire que le village renonce, et qu'elle ne donnera pas ce plaisir à son père.


#### Accepteriez-vous de revenir à Mireval ?

*Condition :* {"et":[{"fait":"f-double-tribut"},{"pnj":{"id":"lina-roux","attitudeMin":15}}]}

Elle accepte, mais pas les mains vides : elle veut pouvoir dire au village ce que Varg exige et ce que la tribu risque. Elle demande qu'on prévienne Skarn avant de l'emmener, par respect pour l'hospitalité reçue, et dit qu'elle fera la route avec les passeurs si le groupe doit rester de l'autre côté de la colline.

Effets : [{"flag":"lina-retrouvee"},{"attitude":{"pnj":"skarn","delta":5}}].

#### Que fait cette enfant dans la grotte ?


Elle parle de Miette avec une tendresse brusque : l'enfant lui apporte des cailloux, lui apprend des mots gobelins, et dort contre sa porte quand la salle est trop bruyante. Elle demande qu'on ne l'effraie pas avec les armes, et dit que dans cette grotte, la petite est la seule chose qui n'a rien à voir avec le grain.

Effets : [{"attitude":{"pnj":"miette","delta":5}}].

**Variantes de salutation**

- Si {"flag":"pacte-revele"} : Lina vous regarde comme on regarde des témoins. « Vous savez, pour mon père. Alors ne me parlez pas de mensonge : parlez-moi de ce qu'on peut encore sauver. »
- Si {"flag":"alliance-gobeline"} : « Skarn vous a serré la main ? » Elle sourit pour la première fois. « Alors asseyez-vous : dans cette grotte, ça veut dire quelque chose. »
- Si {"flag":"lina-retrouvee"} : Elle a noué son sac et remis sa veste. « Je suis prête. Mais on part par les roseaux, et on ne dit pas au village que je suis partie avec vous : on dit que j'ai négocié. »

### Skarn

**Chef de la tribu gobeline de la colline** — gro-salle-commune

> Tu sens le roseau et la pluie. Tu viens du village, alors. Pose ton sac et dis ce que tu veux.

#### Que vous faut-il pour passer l'hiver ?


Skarn dit qu'il lui faut du grain avant les gelées : trois charrettes, ou deux et du sel, ou une et des outils. Il parle de sa tribu comme d'une maisonnée — quarante bouches, dont quatorze enfants — et ne demande pas l'aumône : il propose un marché, du grain contre la paix sur la route du marais et des bras pour la mine.

Effets : [{"quete":{"id":"q-skarn-le-grain","statut":"proposee"}}].

#### Que vous a dit Varg ?


Il dit que Varg a envoyé un homme, pas un gobelin, avec un ordre écrit : le double du tribut, du village comme de la tribu, sinon la compagnie prendra la mine et la tribu avec. Il montre du menton la dalle gravée près du feu et dit que les bâtons n'iront pas plus loin que cet hiver.

Révèle : f-double-tribut.

#### Combien de temps pouvez-vous tenir ?


Il l'avoue sans détour : trois sacs de grain, des champignons secs, un quartier de lard, et les chasseurs rapportent peu depuis que les hobgobelins tiennent les chemins. Il dit que les enfants mangent avant les guerriers, que c'est la règle, et qu'il ne l'a jamais enfreinte, même l'hiver où deux des siens sont restés sous la galerie.

Révèle : f-tribu-affamee.

#### Proposer un accord avec la tribu.

*Condition :* {"et":[{"quete":{"id":"q-skarn-le-grain","statut":"active"}},{"pnj":{"id":"skarn","attitudeMin":10}}]}

Il pose sa main abîmée sur la table. Il jure, au nom de la pierre et des siens, que la tribu ne lèvera pas la lance contre le village et qu'elle tiendra le marais ouvert au groupe. En échange, il veut du grain, et il veut que les hobgobelins ne sachent jamais d'où vient l'aide.

Effets : [{"flag":"alliance-gobeline"},{"attitude":{"pnj":"skarn","delta":15}},{"attitude":{"pnj":"nyx","delta":5}}].

#### Que savez-vous des vieilles galeries ?


Il parle des vieilles galeries avec respect : les nains y ont creusé droit, sa tribu a suivi la veine brune, puis l'éboulement a pris deux des siens. Il dit qu'on n'y va plus, et que pourtant l'air y circule — un courant qui vient de l'autre côté de la colline, vers la mine des hobgobelins, et qui sent le fer.


#### Pourquoi gardez-vous la fille du meunier ?


Il dit que la fille du meunier mange à sa table, qu'elle a une porte et une lanterne, et qu'il ne la laissera pas partir avant d'avoir reçu son dû — non par cruauté, parce qu'un otage d'honneur est la seule garantie qu'un chef peut montrer à son peuple. Il ajoute qu'elle négocie mieux que son père, et que c'est un compliment.


**Variantes de salutation**

- Si {"flag":"pacte-revele"} : « Le meunier a parlé, alors. » Il ne s'étonne pas. « Quatre hivers, quatre charrettes. Il en manque une, et c'est ma tribu qui jeûne. »
- Si {"flag":"alliance-gobeline"} : Il se lève, ce qu'il ne fait presque jamais, et frappe la table de sa main valide. « Assieds-toi à ma droite, ami du village. Ce soir, on mange ensemble, et pas de soupe claire. »
- Si {"flag":"tribut-paye"} : « Le grain est arrivé. » Il dit cela simplement, sans joie. « Alors la parole de Mireval tient encore. Dis-moi ce qu'elle coûtera l'an prochain. »

### Nyx

**Chamane de la tribu** — gro-salle-commune

> Vous portez du fer aux ceintures et l'odeur du village sur vous. Qu'est-ce que vous voulez aux os ?

#### Qu'est-ce que les os vous disent ?


Elle jette des os sur une peau et lit : une charrette qui n'arrive pas, un feu qui monte dans un grenier, un fer qu'on arrache à la pierre. Elle ne traduit pas tout, et dit que les os ne parlent bien que des choses déjà commencées.


#### Pourquoi nous regardez-vous ainsi ?


Elle dit qu'elle a vu les humains promettre et repartir, qu'un homme du village est venu marchander des peaux l'an dernier et n'est jamais revenu. Elle ne déteste pas le groupe : elle attend de voir. Puis elle compte sur ses doigts les fois où on lui a menti, et il y a plus de doigts que de mains.


#### Que cherchent les hobgobelins dans la mine ?


Elle dit que les hobgobelins ne viennent pas pour le grain : ils ont des hommes, des outils et des chariots, et le grain ne se garde pas dans une mine. Elle s'arrête là, les yeux sur les os, et attend qu'on insiste pour dire le reste.


#### Que représente Miette pour vous ?

*Condition :* {"flag":"miette-rassuree"}

Elle se radoucit à peine, mais assez : elle dit que la petite a dormi sans cauchemar pour la première fois depuis un mois. Elle ajoute que si le groupe tient parole, elle lui donnera un nom gobelin, et que ce n'est pas rien : un nom se donne à ceux qui restent.

Effets : [{"attitude":{"pnj":"nyx","delta":10}}].

#### Que feriez-vous si vous pouviez partir ?


Elle dit que si elle pouvait, elle emmènerait les enfants d'abord, par les roseaux, avec les passeurs, et qu'elle laisserait la mine aux hobgobelins sans un regret. Elle dit aussi que Skarn ne partira pas : un chef qui abandonne sa colline n'est plus chef, et il le sait.


**Variantes de salutation**

- Si {"flag":"alliance-gobeline"} : Elle crache dans le feu, puis vous fait signe d'approcher. « Le vieux vous a serré la main. Ça ne veut pas dire que je vous crois. Ça veut dire que je vous laisse essayer. »
- Si {"flag":"miette-rassuree"} : Elle a vu la ration passer de main en main. « La petite vous a souri. » Elle dit cela comme un fait, pas comme un remerciement, et vous laisse approcher du feu.

### Miette

**Enfant de la tribu : elle sait tout ce qui se passe dans la grotte** — gro-salle-commune

> Tu es grand. Tu viens du village ? Il y a des poules, au village ?

#### Qui est la dame rousse ?


Miette raconte que la dame rousse est arrivée un matin avec un sac et un bâton, qu'elle a parlé longtemps avec Skarn devant le feu, et qu'elle a posé elle-même son sac dans le réduit. Personne ne l'a poussée ni tirée. Elle dit que la dame compte les jours avec du charbon et lui apprend des mots.

Révèle : f-lina-otage.

#### Que faites-vous de ces cailloux ?


Elle montre sa collection : un caillou blanc comme un os, un caillou troué, un morceau de verre de rivière, et une dent qu'elle jure avoir trouvée. Elle dit qu'un caillou donné ne se reprend pas, que c'est la loi, et qu'elle en garde un pour la dame rousse.


#### Où avez-vous le droit d'aller ?


Elle baisse la voix : on n'a pas le droit d'aller à la galerie, parce que ça tombe. Mais elle y est allée quand même, et elle dit qu'il y a un trou derrière les grosses pierres, que le vent en sort et que ça sent le fer. Elle croit que c'est par là que les grands passent quand ils ne veulent pas être vus.


#### Qu'est-ce qu'on mange, ici ?


Elle dit que la soupe est claire depuis la fin de l'été, qu'il y a des champignons dedans et parfois un os à ronger. Elle dit que les grands se servent après les petits, et que Nyx met sa part dans son bol quand personne ne regarde.


#### Lui offrir une ration.

*Condition :* {"objet":"rations"}

Elle prend la ration à deux mains, la sent, la met dans sa robe sans la manger. Elle dit qu'elle la gardera pour plus tard, pour un jour où la soupe sera trop claire, et court vers le coin de Nyx en parlant très vite.

Effets : [{"objet":{"id":"rations","retirer":true}},{"flag":"miette-rassuree"},{"attitude":{"pnj":"miette","delta":10}},{"attitude":{"pnj":"nyx","delta":10}}].

**Variantes de salutation**

- Si {"flag":"miette-rassuree"} : Elle vous prend la main sans demander et vous tire vers le feu. « Viens, je te montre où est le trou. Enfin, je te montre de loin. »
- Si {"flag":"lina-retrouvee"} : Elle regarde le sac de Lina, puis Lina, puis vous. « Elle part ? » Elle ne pleure pas. Elle met un caillou dans la main de Lina et referme les doigts dessus.

## La mine hobgobeline

### Varg

**capitaine de la compagnie du Péage** — min-bureau-de-varg

> Vous êtes sur mes terres. Dites ce que vous voulez, et vite : la mine n'attend pas.

#### Que prélevez-vous, au juste, sur la chaussée ?


Il explique sans se cacher : un droit de passage sur les charrettes, une part du grain, et cette année le double. La compagnie mange, personne ne paie les soldats d'une frontière oubliée, et Mireval a vécu quatre ans sans rien voir venir. Le double n'est pas une punition : c'est un rappel.

Révèle : f-double-tribut.

#### Pourquoi tenir une vieille mine de fer ?


Il déplie une carte et désigne la veine du doigt : du fer, du vrai, en quantité, à deux jours de route. Des outils, des fers à cheval, des lames pour ceux qui paieront. La vallée est riche et personne ne l'a jamais comptée. Il ne dit pas un mot du grain.

Révèle : f-mine-de-fer.

#### Où est passée la charrette du moulin ?


Il ne nie pas : la charrette a été prise au pont, le grain est sous une bâche dans la cour, le charretier travaille à la veine. Le garçon est vivant parce qu'il est utile, et un otage vivant vaut mieux qu'un otage mort. Le village devrait le remercier de ne pas avoir tout pris.

Révèle : f-charrette-saisie, f-colin-prisonnier.

#### Reconnaissez-vous cette lettre ?

*Condition :* {"objet":"lettre-de-varg"}

Il la lit sans hâte, la plie exactement comme elle était et la repose. Oui, c'est son écriture : saisir la prochaine charrette, compter les sacs, garder le charretier. Un ordre est un ordre, et le village a rompu la parole en ne payant pas. Puis il regarde le groupe et demande ce qu'il veut en échange du silence.

Révèle : f-but-de-varg, f-double-tribut.

#### Que voulez-vous pour rendre Colin ?


Il a un prix et il le dit sans détour : le grain de la charrette et une part fixe chaque automne, comptée devant lui. Ou la tribu au travail dans la veine. Il ne rendra pas le garçon pour des mots ; il le rendra contre une garantie. Il précise qu'il ne veut pas le tuer, et que ce serait dommage pour tout le monde.


#### Vos hommes vous suivent-ils encore ?

*Attitude minimale :* 20

Il hésite, puis parle plus bas : la solde a six semaines de retard, les hommes comptent les sacs, et Grum n'est plus le même depuis l'hiver. Un capitaine qui ne paie pas n'est qu'un homme avec une épée. Il demande, sans en avoir l'air, si le groupe a du grain à vendre.

Révèle : f-grenier-vide.

#### Que vaut votre gobelours ?


Grum vaut deux hommes et la moitié d'un cerveau : le bras lourd, le sommeil léger, et plus lent depuis le printemps. Il l'appelle « mon ombre » sans ironie. Il ne le renverra pas : un capitaine ne jette pas un chien qui a mordu pour lui.


#### Peut-on encore marchander avec vous ?


Oui, si le village paie une part fixe et si la tribu travaille la veine. Il préfère une mine qui tourne à un village brûlé : le feu ne produit rien. Mais il veut une parole tenue, écrite, et un gage. Les précédents ont trop parlé et trop peu payé.

Effets : [{"attitude":{"pnj":"varg","delta":5}}].

**Variantes de salutation**

- Si {"objet":"lettre-de-varg"} : Vous avez mon courrier dans la poche. Posez-le sur la table, et parlons comme deux hommes qui savent lire.
- Si {"flag":"tribut-paye"} : Le tribut est payé. Vous êtes les premiers depuis quatre ans à ne pas marchander deux fois.
- Si {"faction":{"id":"compagnie-du-peage","min":40}} : Un capitaine reçoit ceux qui tiennent parole. Prenez une chaise, et parlons du tribut.
- Si {"flag":"varg-vaincu"} : Vous m'avez battu dans ma propre cour. Dites ce que vous voulez, et faites vite : mes hommes écoutent.

### Grum

**garde du corps de Varg** — min-camp-hobgobelin

> Passez votre chemin. Je ne veux de mal à personne.

#### Pourquoi vous battez-vous encore ?


Il hausse une épaule. Il est soldat depuis qu'il sait tenir un maillet, il a vu trois capitaines et deux camps, et la paie arrive quand elle arrive. Il compte les jours comme on compte des cailloux. Il ne déteste personne dans ce camp, et c'est bien ça le problème.


#### Que pensez-vous de votre capitaine ?


Il choisit ses mots avec soin : Varg est juste quand la paie arrive, dur quand elle n'arrive pas, et il n'a jamais laissé un homme derrière. Grum le craint et le respecte, et il ne dit pas lequel des deux pèse le plus. Il ajoute que le capitaine ne dort plus beaucoup.


#### Que sortez-vous de cette veine ?


Du fer, bon pour les outils et les fers à cheval. Les prisonniers cassent la roche, les hobgobelins charrient les wagonnets, et Varg compte les charges chaque soir avant la soupe. Grum dit que la montagne ne rend rien sans qu'on lui prenne, et qu'elle se souvient de ceux qui prennent trop.

Révèle : f-mine-de-fer.

#### Que fait le prisonnier à la veine ?


Le charretier travaille, mange, et dort enchaîné avec les autres. Grum lui donne sa soupe quand les gardes oublient, et l'a entendu parler tout seul de sa sœur. Il dit que le garçon ne fuira pas : il a trop peur de ce qu'on ferait à Mireval.

Révèle : f-colin-prisonnier.
Effets : [{"attitude":{"pnj":"colin-vasseur","delta":5}}].

#### Où est votre chez-vous ?


Dans une vallée de pierres grises, à six jours d'ici, avec une sœur qui tient une auberge et un chien qu'il n'a pas vu grandir. Il envoie sa solde quand il y pense. Il dit qu'il rentrera quand la compagnie sera payée, et il le dit comme on récite une leçon.


#### Pourquoi gardez-vous ce loup ?


Ce n'est pas le sien : c'est celui de la compagnie, dressé pour la garde, et il tire sur sa chaîne quand il a faim. Grum lui parle bas et lui donne les os de la soupe. S'il pouvait, il le détacherait et le laisserait courir vers les roseaux.


#### Pourquoi votre capitaine tient-il tant à cette mine ?

*Attitude minimale :* 20

Il regarde la porte du bureau, puis parle bas : le fer, pas le grain. Varg veut la veine et des bras pour la creuser ; le grain, c'est pour faire venir les bras. Il dit que les gobelins de la grotte feront l'affaire, et qu'ils n'auront pas le choix.

Révèle : f-but-de-varg.

**Variantes de salutation**

- Si {"flag":"grum-capture"} : Vous m'avez eu. Je ne demande rien. Faites ce que vous avez à faire.
- Si {"flag":"grum-libere"} : Vous m'avez laissé partir. Je n'oublie pas ces choses-là.
- Si {"pnj":{"id":"grum","attitudeMin":25}} : Vous êtes revenus. Je commençais à croire que les gens de passage ne revenaient jamais.
- Si {"flag":"varg-vaincu"} : Le capitaine est tombé. Je n'ai plus de solde, ni de raison de lever mon maillet.

### Colin Vasseur

**charretier du moulin** — min-veine-de-fer

> Vous n'êtes pas des hobgobelins. Ça change.

#### Où est passé le grain de la charrette ?


Sous les bâches, dans la cour, contre la palissade. Les sacs portent encore la marque du moulin Roux, et le quartier-maître les compte deux fois par jour. Colin dit qu'il a conduit la charrette jusqu'au pont et qu'après, on ne lui a plus demandé son avis.

Révèle : f-charrette-saisie.

#### Que fait Varg de ses prisonniers ?


Il travaille, il nourrit mal, et il ne bat pas pour le plaisir. L'hiver dernier, un hobgobelin a voulu partir : Varg l'a tué devant le camp, sans colère, comme on abat un cheval qui boite. Colin dit qu'il n'a pas dormi pendant trois nuits après ça.


#### Avez-vous des nouvelles de Mireval ?


Il demande d'abord si Perrine va bien, puis si elle est encore assez folle pour partir seule dans les roseaux. Il décrit sa sœur : éclaireuse, têtue, meilleure que lui avec un arc. Il demande qu'on lui dise qu'il n'a pas fui, et qu'il tient bon.

Effets : [{"attitude":{"pnj":"colin-vasseur","delta":10}}].

#### Comment travaille-t-on la veine ?


Il montre les étais du menton : le bois chante avant de céder, et la roche laisse tomber un filet de sable quand elle va lâcher. Il a vu un éboulement ensevelir un wagonnet la première semaine. On frappe, on écoute, et on ne reste jamais sous un étais noir.

Révèle : f-mine-de-fer.

#### Pourquoi conduisiez-vous une charrette vers les roseaux ?


On lui dit où mener, il mène. Le meunier payait, il ne posait pas de questions, et la route du marais était mauvaise mais connue. Il ajoute, plus bas, qu'il se doutait bien que ce grain n'allait pas à un marché, et qu'il aurait dû demander.


#### Le libérer de ses menottes.

*Condition :* {"ou":[{"flag":"varg-vaincu"},{"flag":"alliance-gobeline"}]}

Les menottes cèdent ; Colin frotte ses poignets et se lève trop vite. Il dit qu'il connaît la galerie, le rythme des gardes et le chemin du camp, et qu'il ne sera pas un fardeau. Il demande seulement qu'on ne le ramène pas à Mireval avant qu'il ait retrouvé sa sœur.

Effets : [{"flag":"colin-libere"},{"attitude":{"pnj":"colin-vasseur","delta":25}},{"xp":100},{"narration":"Colin est libre. Il masse ses poignets et jure de ne pas ralentir le groupe."}].

**Variantes de salutation**

- Si {"flag":"colin-libere"} : Je marche. Laissez-moi juste retrouver mes jambes et boire autre chose que de l'eau de roche.
- Si {"flag":"varg-vaincu"} : Ils sont partis ? Alors sortez-moi de là avant qu'ils changent d'avis.
- Si {"objet":"lettre-de-varg"} : Vous avez son écriture dans la poche. Ça me fait froid aux mains.
- Si {"pnj":{"id":"colin-vasseur","attitudeMin":25}} : Perrine ? Vous l'avez vue ? Dites-moi qu'elle va bien, même si c'est un mensonge.


---

## Questions libres

Les 16 PNJ ont une fiche de savoir qui permet au conteur de répondre aux questions écrites librement, sans inventer. Voir [SAVOIRS-DIME-DES-ROSEAUX.md](SAVOIRS-DIME-DES-ROSEAUX.md).
