# Salutations communes (bibliothèque partagée par toutes les histoires)

> 11/11/2026 — **validées et dites** (54 lignes × 12 voix = 648 prises, ≈ 1,0 $, livrées dans `apps/jeu/src/voix/dialogues/`). Un PNJ secondaire de **n'importe quelle histoire** n'a qu'à nommer son registre dans sa fiche : `"salutations": { "commune": "garde" }`. Le chargement lui donne ses trois salutations (neutre, amicale, hostile), tirées de ce registre, **toujours les mêmes pour ce PNJ**, déjà dites à voix haute avec **sa** voix (les 12 voix du jeu : la même que son ouverture de conversation). Un PNJ peut aussi mélanger : un texte à lui pour un ton, la bibliothèque pour les autres. Les PNJ importants gardent leurs propres textes.
>
> Les lignes sont **neutres en genre** (aucun accord au masculin ou au féminin), **sans lieu, nom, moment ni saison**, sans mécanique de jeu, et toutes différentes (6 registres × 3 tons × 3 lignes). Fichier : `packages/regles/src/monde/salutations-communes.json`. Test : `packages/regles/tests/salutations-communes-bibliotheque.test.ts`.

## Commerçant (`commercant`)

*Pour :* aubergiste, marchand, forgeron, apothicaire, artisan : quelqu’un qui accueille un client

**Neutre**

- « Vous cherchez quelque chose en particulier, ou vous souhaitez d’abord regarder ce que nous proposons ? »
- « Je vous écoute. Dites-moi ce qui vous amène, et je verrai ce que je peux vous proposer. »
- « Approchez, et donnez-moi votre demande ; je vous indiquerai précisément ce qui est disponible. »

**Amical**

- « Ah, de la visite ! Installez-vous à l’aise, je vous prie, et dites-moi tout. »
- « Quel plaisir de vous voir ! Prenez votre temps, parlez librement, je ferai de mon mieux pour vous aider. »
- « Ça me fait plaisir de vous voir ! Dites-moi comment je peux vous rendre service. »

**Hostile**

- « Dites vite ce que vous voulez, car je n’ai pas de temps à perdre avec vous. »
- « Inutile de tourner autour du pot : parlez, et ne traînez pas plus longtemps. »
- « Plus un mot : si vous n’avez rien à acheter ni à demander, allez voir ailleurs. »

## Garde (`garde`)

*Pour :* garde, soldat, milicien, sentinelle, péager : quelqu’un qui contrôle ou protège

**Neutre**

- « Présentez-vous, puis indiquez-moi le motif de votre venue, et je vous dirai la marche à suivre. »
- « Votre présence était-elle prévue, ou faut-il qu’on vérifie cela avant toute chose ? »
- « Patientez un peu, je vous prie. Donnez-moi votre nom et dites-moi ce que vous comptez faire. »

**Amical**

- « Ne vous inquiétez surtout pas : dites-moi simplement ce qui vous amène, et nous verrons. »
- « C’est un plaisir de vous rencontrer. Que puis-je faire pour vous, en toute franchise ? »
- « Vous n’avez rien à craindre de moi. Expliquez-moi calmement votre affaire, et nous trouverons une solution. »

**Hostile**

- « Inutile de rester planté là : dites ce que vous voulez, puis éloignez-vous. »
- « Nom, motif, et vite : je n’ai pas de temps à perdre à vous écouter longtemps. »
- « Je ne vous demande pas de me plaire, seulement de répondre sans détour. »

## Villageois (`villageois`)

*Pour :* paysan, pêcheur, ouvrier, mineur, passant : quelqu’un du commun, à sa vie

**Neutre**

- « Un visage nouveau ? Vous êtes simplement de passage, ou vous cherchez quelqu’un ? »
- « Je n’ai pas beaucoup de temps, mais je peux répondre à une question si elle est courte. »
- « Dites-moi ce que vous voulez savoir, et je vous répondrai du mieux que je peux. »

**Amical**

- « Approchez, n’ayez pas peur ; si je peux vous être utile, je le ferai de bon cœur. »
- « Vous semblez hésiter sur la suite, dites-moi ce que vous cherchez, et je vous guiderai volontiers. »
- « Pas de précipitation, asseyez-vous un moment et racontez-moi ce qui vous amène, on verra bien. »

**Hostile**

- « Je ne veux pas bavarder avec des gens de passage, alors allez voir ailleurs. »
- « Si c’est pour me demander quelque chose, la réponse sera non, alors ne perdez pas votre souffle. »
- « Laissez-moi en paix, j’ai mes propres affaires à régler, et elles ne regardent personne d’autre. »

## Savant (`savant`)

*Pour :* érudit, prêtre, guérisseur, archiviste, mage : quelqu’un de lettré ou de spirituel

**Neutre**

- « Je ne vous connais pas encore ; dites-moi ce qui vous amène, et nous verrons ce que je peux faire. »
- « Prenez le temps de bien formuler votre demande : je ne réponds qu’à une question claire. »
- « Parlez, je vous écoute, et je tiendrai compte de ce que vous me direz avant de répondre. »

**Amical**

- « Entrez donc, la conversation est toujours plus utile quand elle se fait à plusieurs. »
- « Votre question me paraît sérieuse, et j’aimerais en discuter avec vous à loisir. »
- « Installez-vous, je vous en prie, et dites-moi ce qui vous préoccupe : nous chercherons ensemble. »

**Hostile**

- « Je ne répondrai pas à ce genre de questions, et je vous saurai gré de me laisser à mes travaux. »
- « Mes notes ne sont pas à la disposition de tout le monde, et mon temps est mieux employé ailleurs. »
- « Inutile d’insister, je n’ai rien à ajouter à ce que j’ai déjà dit. »

## Notable (`notable`)

*Pour :* noble, bailli, juge, capitaine, chef de faction : quelqu’un qui a rang et autorité

**Neutre**

- « Vous avez sollicité un entretien, et je vous écoute. Exposez l’objet de votre démarche, sans détour. »
- « Les usages veulent qu’on se présente avant de demander. Faites-le, puis dites ce que vous attendez de moi. »
- « Mesurez vos paroles, car chaque mot prononcé sera retenu. Parlez, je vous prie. »

**Amical**

- « Votre démarche n’a rien d’importun et mérite qu’on l’écoute. Dites-moi ce qui vous amène, en peu de mots. »
- « Il est rare de se présenter avec tant de réserve, et cela mérite attention. Approchez, la conversation peut commencer. »
- « Peu de gens savent se tenir ainsi devant moi, et cela vous honore. Expliquez-vous, je suis à l’écoute. »

**Hostile**

- « Cette requête ne m’intéresse guère, et je doute qu’elle mérite mon attention. Retirez-vous avant que je ne change d’avis. »
- « Rien de ce qui m’occupe ne vous regarde, et je n’ai pas à répondre. Éloignez-vous sans délai. »
- « Les gens de votre sorte se croient souvent dignes d’égard, et je ne suis pas de cet avis. »

## Marginal (`marginal`)

*Pour :* voyou, contrebandier, mendiant, brigand, vagabond : quelqu’un qui vit en marge

**Neutre**

- « Pas de bruit. Dites ce que vous voulez, on verra bien ce qu’on peut arranger. »
- « Pas de détours, je vous écoute, et ça ira vite si vous parlez net. »
- « Vous me cherchez, ou c’est un hasard qui vous amène ? Dites-le vite, sans fioritures. »

**Amical**

- « Entrez donc, personne ne vous veut de mal. Racontez-moi ça tranquillement, voyons. »
- « Inutile de vous cacher, je ne suis pas du style à mordre. Dites-moi ce qui vous ronge. »
- « Il me semble que vous avez besoin d’un coup de main, non ? Parlez. »

**Hostile**

- « Déguerpissez avant que la patience ne tourne, et ça vaudra mieux pour vous. »
- « Gaspiller votre souffle ne sert à rien. Je n’ai rien pour vous, alors filez. »
- « Les gens qui traînent autour de moi finissent par mal tourner, et vous le savez sans doute. »
