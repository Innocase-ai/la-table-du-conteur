# Les PNJ de Lame-Rousse se souviennent (proposition, à valider)

> 11/11/2026 — **rien n’est écrit dans l’histoire** : 16 salutations variables pour 9 PNJ (avec Ansel, qui en a déjà une, 10 PNJ sur 11 réagiront à ce que le groupe a fait ; l’avis « Réactivité » du validateur visait 5). Une salutation variable **remplace** la salutation du PNJ à l’ouverture d’une conversation, **la première dont la condition est vraie gagne** (l’ordre ci-dessous est l’ordre de priorité). Un PNJ ne réagit qu’à ce qu’il a pu voir (condition « témoin », il était dans le lieu) ou apprendre (un drapeau public). Aucune de ces répliques ne promet de remise ni de cadeau, ne révèle un secret ni le contenu d’un sujet. Écrites par trois agents Haiku, relues, auditées (agent d’audit, remarques vérifiées une à une), testées avec le vrai moteur (12 tests, `packages/regles/tests/salutations-ombresang.test.ts`) et validées sur une copie du monde (0 erreur).

## Odile Braise (`odile-braise`, lr-auberge)

Salutation d’origine : « Entrez, et refermez vite la porte. »

**1. Si drapeau « evt-la-lame-de-la-poutre » et drapeau « lr-place-sauvee »** (38 mots)

> « Vous avez abattu ces épées sur ma place, alors je ne dirai rien de ma poutre, que vous avez regardée d’un peu trop près. La maison sert chaud ce soir. Qu’est-ce que je vous sers ? »

*Ce qu’il a vu ou appris :* Les deux à la fois : le groupe a regardé la poutre et sauvé la place.

**2. Si drapeau « lr-place-sauvee »** (42 mots)

> « J’ai tout vu depuis ma porte, sur la place, quand ces épées se sont mises à bouger. C’est fini. La maison sert chaud ce soir, mais la bière se paie quand même. Asseyez-vous, et dites-moi ce que vous voulez boire. »

*Ce qu’il a vu ou appris :* Les épées qui s'étaient animées sur la place des Ferrailleurs ont été abattues par le groupe ; l'auberge donne sur la place et Odile a tout vu depuis sa porte.

**3. Si drapeau « evt-la-lame-de-la-poutre »** (30 mots)

> « Vous avez regardé ma poutre d’un peu trop près. Cette vieille lame tient ma maison debout depuis avant vous, alors dites-moi ce que vous lui voulez, et vite. »

*Ce qu’il a vu ou appris :* Le groupe a grimpé sur un de ses bancs pour regarder de près la vieille lame qui sert de poutre maîtresse à son auberge. Elle l'a vu, depuis son comptoir. Tu ne sais PAS si le groupe a réussi à gratter la rouille ni si quelque chose s'est brisé : ne le dis pas.

## Gorm Meule (`gorm-meule`, lr-forges)

Salutation d’origine : « Entrez. Le métal se vend au poids. Regardez ce que vous voulez. »

**1. Si drapeau « lr-ansel-sauve »** (30 mots)

> « Ansel est revenu à ma forge après trois jours sans nouvelles. Vous l’avez ramené. Merci. Voilà, c’est dit, et ne prenez pas l’habitude. Qu’est-ce qu’il vous faut ? »

*Ce qu’il a vu ou appris :* Le groupe a ramené son apprenti Ansel Pique, disparu depuis trois jours, coincé dans la grotte. Gorm l'a revu à la forge.

**2. Si drapeau « lr-chargement-recupere »** (38 mots)

> « Vous avez récupéré mon chargement au campement de la forêt d’Acier. Je compterai tout avant de dire un mot de plus. Ce n’est pas ce qu’on fait d’habitude, je le note. Qu’est-ce qu’il vous faut ? »

*Ce qu’il a vu ou appris :* Le groupe a récupéré le chargement de Gorm qui était resté au campement abandonné de la forêt d'Acier (tu ne sais pas comment : par la parole ou autrement : ne le dis pas).

## Sœur Martha (`soeur-martha`, lr-apothicairerie)

Salutation d’origine : « Entrez, et ne touchez pas au mortier. »

**1. Si drapeau « lr-place-sauvee »** (38 mots)

> « Les blessés de la place, je les ai bandés un à un, et je sais qui les a sauvés. Vous m’avez épargné une nuit d’ouvrage. Asseyez-vous si vous voulez, mais parlez-moi pendant que mes mains travaillent. »

*Ce qu’il a vu ou appris :* Les épées qui s'étaient animées sur la place ont été abattues par le groupe ; Sœur Martha a soigné des blessés de la place et sait qui les a sauvés. Elle ne lève pas les yeux de ses pansements.

## Joran (`joran-deserteur`, lr-place)

Salutation d’origine : « Vous êtes là pour me regarder, ou pour m'écouter ? »

**1. Si témoin (le PNJ était là) d’une victoire** (40 mots)

> « Les épées ont attaqué la place. Moi, je suis resté aux fers, je n’ai pas bougé d’un pouce. Vous, vous vous êtes battus sous mes yeux, et moi je regardais. Alors parlez, avant que je ne me taise. »

*Ce qu’il a vu ou appris :* Enchaîné au pilori de la place, Joran a vu le groupe abattre les épées animées qui venaient d'attaquer la place. Il était là, il n'a pas pu bouger.

**2. Si drapeau « lr-foule-reconnaissante »** (37 mots)

> « Vous avez retenu la charrette, celle qui versait sa ferraille sur la foule. Là, devant moi. On me traite de saboteur, moi. Alors pourquoi vous avez fait ça ? Parlez, je ne suis pas dupe. »

*Ce qu’il a vu ou appris :* Joran a vu le groupe retenir la charrette de ferraille qui versait vers la foule, sur la place où il est enchaîné.

## Vorn Bras-de-Laiton (`vorn-bras-de-laiton`, lr-forge-vorn)

Salutation d’origine : « Vous êtes dans ma forge. Dites ce que vous voulez, et tenez-vous loin du foyer. »

**1. Si témoin (le PNJ était là) d’une victoire** (35 mots)

> « Des lames se sont dressées devant moi, et vous les avez couchées sous mes yeux. Sans vous, j’aurais mal fini. Ne me demandez pas de le redire. Qu’est-ce qui vous amène encore ? »

*Ce qu’il a vu ou appris :* Des épées se sont levées dans sa forge, et le groupe les a abattues devant lui. Il est resté près du foyer. SECRET : il ne doit JAMAIS laisser entendre que ces lames viennent de son travail ni parler du foyer, du fragment, d'une écharde ou d'un battement.

## Élinor Vane (`elinor-vane`, lr-bastion-tour)

Salutation d’origine : « Entrez, et refermez la porte derrière vous. Je n'ai pas de temps pour les courants d'air. »

**1. Si drapeau « lr-hommes-de-la-baillie-battus » ou drapeau « lr-hommes-de-main-isoles »** (45 mots)

> « On me rapporte du bruit dans la cour du poste, et des hommes de la tour qui n’ont pas fait grande figure. Je n’y étais pas. Je ne sais pas qui y a gagné, mais je note les noms. Parlez, et soyez bref. »

*Ce qu’il a vu ou appris :* On lui a rapporté du bruit dans la cour du poste : les hommes de main qui travaillent à la tour ont été battus ou désarmés par le groupe. Elle n'était pas dans la cour. SECRETS : elle ne doit rien avouer (ni le tribut, ni les stocks de minerai, ni les drains).

## Brisk (`brisk-sergent`, lr-bastion-cour)

Salutation d’origine : « Halte. La route est fermée. Dites-moi ce que vous voulez, et vite. »

**1. Si drapeau « lr-herse-reparee »** (41 mots)

> « La herse du passage sud est remontée, et toute la cour l’a entendue. Ne vous réjouissez pas trop : je n’ai pas encore décidé si j’en suis content. Le passage pourrait rouvrir. Et maintenant, dites-moi ce qui vous amène. »

*Ce qu’il a vu ou appris :* La herse du passage sud, coincée aux trois quarts depuis des jours, vient d'être remontée par le groupe. Brisk commande le poste de la cour : il l'a entendue ou vue remonter.

**2. Si rencontre « hommes-de-la-baillie » (alternative « intimider-les-peagers »)** (45 mots)

> « Mes péagers ont posé leurs armes, sur un ordre, sans un coup. Et les hommes de la Baillie sont restés là, seuls au milieu de la cour. Je ne sais pas si je dois être vexé ou admiratif. Alors, dites-moi qui vous êtes. »

*Ce qu’il a vu ou appris :* Dans la cour du poste, le groupe a fait poser les armes aux péagers d'un ordre, sans combat, et les hommes de main sont restés seuls ; Brisk était là.

**3. Si rencontre « hommes-de-la-baillie » (issue victoire)** (42 mots)

> « Vous les avez battus, dans ma cour, sous mes yeux. Je compte les corps, et je me demande ce que ça va me coûter. Je ne vous remercierai pas. Mais je n’aurais pas fait mieux. Qu’est-ce que vous voulez ? »

*Ce qu’il a vu ou appris :* Dans la cour du poste, le groupe a abattu les hommes de main de la Baillie sous les yeux de Brisk.

## Mira Sorel (`mira-sorel`, lr-camp-refugies)

Salutation d’origine : « Vous venez du pont, ou de la rive ? Parlez vite, je n'ai pas le temps de m'asseoir. »

**1. Si drapeau « lr-camp-defendu »** (45 mots)

> « Le camp a tenu cette nuit, et je vous en remercie. Les lames sont venues jusqu’ici, je l’ai vu de mes yeux. Je n’ai pas fermé l’œil de la nuit. Asseyez-vous si vous voulez, mais parlez : ma voix ne tiendra pas longtemps. »

*Ce qu’il a vu ou appris :* Au petit matin, le groupe a tenu le camp des réfugiés contre l'assaut des épées volantes. Mira était présente à la veille.

## Le Maître d'Armes Sans Corps (`maitre-d-armes-sans-corps`, lr-temple-chapelle)

Salutation d’origine : « Parlez, et ne mentez pas : je le sentirais. »

**1. Si drapeau « evt-le-chant-de-la-lame-paladin » ou drapeau « evt-le-chant-de-la-lame-clerc »** (38 mots)

> « Des mots justes ont été dits sur le parvis, et je les ai entendus d’ici. Ceux qui ont veillé méritaient ces paroles. Vous qui les avez prononcées, restez un moment. Dites-moi ce qui vous amène ici. »

*Ce qu’il a vu ou appris :* Quelqu'un du groupe a salué ou prié pour ceux qui avaient veillé, sur le parvis du temple, au pied de la lame couchée. Il l'a entendu depuis la chapelle (une voix sort du casque posé sur l'autel). SECRETS : il ne doit pas dire qui il est ni son nom, ni parler du serment, du journal, de l'armure de l'arsenal, du pont ou de sa fin.

**2. Si drapeau « chant-note-fausse »** (39 mots)

> « Vous avez chanté faux sur le parvis, et la poussière est tombée de la lame. Ça s’entend jusqu’ici. On n’entre pas chez moi en massacrant une note : apprenez-la, puis revenez, ou dites-moi ce qui vous amène. »

*Ce qu’il a vu ou appris :* Quelqu'un du groupe a chanté faux sur le parvis du temple, et de la poussière est tombée de la lame ; il l'a entendu de la chapelle. SECRETS : mêmes interdits (ni nom, ni serment, ni journal, ni armure, ni pont).

## Relecture du directeur

- **Corrigé après l’audit** : Odile (l’ordre masquait la réplique sur la place : trois variantes maintenant, « les deux », la place, la poutre) ; Vorn (« dans mon atelier » laissait entendre que les lames venaient de chez lui, ce qui est son secret) ; Mira (« encore debout » supposait un combat, or le camp peut aussi être défendu sans combat) ; Gorm (« Merci, voilà » bancal) ; Odile (« monté sur mon banc » était faux pour les héros qui n’ont pas grimpé, et genrait le groupe) ; Élinor (« se relèvent mal » faux quand les hommes sont seulement désarmés) ; le Maître d’Armes (« priiez » : le paladin salue, il ne prie pas ; « un hymne » inventé) ; Gorm (une offre de paiement « en échange de votre peine » ressemblait à une promesse).
- **Vérifié et gardé contre l’audit** : « Ansel est revenu à ma forge » est bien garanti : l’événement du monde `ev-lr-ansel-rentre` le raconte à l’entrée des forges. Joran : la variante « épées abattues » passe avant celle de la charrette, ce qui suit l’ordre réel (la charrette est retenue d’abord, le combat vient ensuite : entre les deux, il parle de la charrette).
- **Limite du moteur** : une salutation variable remplace la salutation tant que sa condition reste vraie (pas de « une seule fois »). Un PNJ réagit donc à un acte tant qu’aucune variante plus prioritaire ne le remplace.
- **Test** : `salutations-ombresang.test.ts` échoue tant que ces salutations ne sont pas écrites dans l’histoire (il lit le monde réel ; avec `MONDE_OMBRESANG=<dossier>`, il lit une copie).
