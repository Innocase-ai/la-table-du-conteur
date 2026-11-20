# V6 : le Pont-Cassé, contenu pièce par pièce — *Validé par l'utilisateur le 20/11/2026 (gelé), décisions P1 à P8 comprises (P2 : option a, Mathilde au camp le soir)*

Dernière zone de V6, même rythme que le village et le moulin (`V6-village.md`, `V6-moulin.md`, gelés). Ce document dit **ce qu'on vit** au camp des forains et dans la roulotte de Mère Pivoine : trois PNJ, les examens, un contenant, les faits, les liens. Il ne contient pas les textes lus par le joueur (des agents Haiku les écrivent après ton oui). Il ne touche pas au gelé (V2 à V5) ; ce qui s'y ajoute est marqué **[nouveau]**. Les quêtes (reçu rapporté à Brun, fins, échos) relèvent de V7 ; ici, un sujet dit seulement « pose le drapeau X » ou « donne l'objet Y ».

## A. Décisions à valider

| # | Décision | Proposition | Pourquoi |
| --- | --- | --- | --- |
| P1 | Les forains (V4 : « sans nom propre, aucun sujet ») | un PNJ **collectif** [nouveau] `forains-du-camp` (« Les forains du camp »), **4 sujets**, qui se ferment si le groupe est hostile (sujets conditionnés par l'attitude) | règle du 16/11 : tout PNJ qui parle a au moins 4 sujets ; c'est aussi la façon de faire dire aux forains que Tobie est « un des leurs » (V4), sans nommer le secret ; écart au « aucun sujet » de V4 et au budget « 2 PNJ à 4 sujets » |
| P2 | Mathilde au camp (V4 et V5 gelés : « y passe le jour » ; elle le dit elle-même dans le village) | **deux options, à toi de trancher** : **(a, recommandée)** `presences: [{ lieu: pon-camp, moment: soir }]` : le soir au camp, le jour au marché ; j'adapte ses phrases du village (« je passe mes jours au camp » devient « le soir, je rejoins le camp ») ; **(b)** garder « le jour » au camp, comme V4/V5 : Mathilde quitte alors le marché de 6 h à 17 h | dans le moteur, une présence **remplace** le lieu habituel à cette heure : avec (b), le groupe, qui arrive au village de jour, ne trouve plus Mathilde au marché ni sa boutique, ni ses sujets sur la corde, avant d'aller au camp |
| P3 | Tobie « derrière la bâche (Perception DD 10, ou Mère Pivoine l'y conduit) » | le moteur ne sait pas cacher un PNJ : Tobie est **listé** dans la roulotte mais **muet** (sa salutation : on entend respirer derrière la bâche ; aucun sujet disponible) tant que le groupe n'a pas appris qu'il est là : par l'**examen de la bâche** (sans jet) ou par le sujet de Mère Pivoine « Où est votre fils ? » ; fait [nouveau] `f-tobie-dans-la-roulotte` | pas de DD 10 (aucun jet sur un examen) ; les deux voies de V4 sont gardées |
| P4 | L'aveu de Tobie (V4 : « Persuasion DD 11, ou le colis rendu ») | le sujet `tb-aveu` s'ouvre si le groupe a **remis le colis** (drapeau `colis-remis-a-mere-pivoine`) **ou** si l'attitude de Tobie atteint 30 (influence du moteur : DD 15, 24 h après un échec) ; en plus, une entrée de secret avec jet Persuasion DD 11 pour la parole libre du conteur | l'influence standard du moteur est à DD 15 ; le DD 11 de V4 reste pour la parole libre |
| P5 | Ce que sait Mère Pivoine (BIBLE §2 : « sait que son fils est en danger ») | après la remise du colis, elle dit où est la clé (`f-cle-au-grenier`, source gelée « Mère Pivoine ») ; elle ne dit pas que son fils l'a volée | conforme à `canon.json` (`savoirs:mere-pivoine` autorisée) et à la BIBLE |
| P6 | Le porte-bonheur de Tobie (V4 : offert quand il se confie, quelle que soit la fin) | donné par l'effet du sujet `tb-aveu` (objet `porte-bonheur-de-funambule`) ; drapeau `tobie-confie` | indice discret de l'écho `epi1-tobie-reconnaissant` |
| P7 | Le sentier vers le camp | lien `ver-pont-des-marchands` ↔ `pon-camp` (sentier de rive, une demi-heure) sans condition : Aubin, Pervenche et l'examen du ponton le disent | le joueur cherche, et trouve le chemin par la parole ou par l'examen |
| P8 | Tobie ne combat jamais, ne fuit pas, ne meurt pas | aucun combat ni état nouveau (règle « n+1 » de V4) ; menacé, il se rend (aucun sujet ni effet à écrire) | V4 |

## B. Faits **[nouveaux]**

| id | texte (à plat) | Source |
| --- | --- | --- |
| `f-tobie-dans-la-roulotte` | Tobie Pivoine, le funambule, se cache derrière la bâche de la roulotte de sa mère. | examen de la bâche ; Mère Pivoine (sujet « Où est votre fils ? ») |
| `f-poupee-jumelle` | La roulotte de Mère Pivoine abrite une poupée de bois bleue au ruban crème, jumelle de celle du sanctuaire. | examen de la poupée |

Les trois faits clés (`f-tobie-a-vole-la-cle`, `f-cle-au-grenier`, `f-gedeon-et-la-dette`) sont tous donnés par `tb-aveu` (Tobie) ; `f-cle-au-grenier` l'est aussi par Mère Pivoine (P5). Le recoupement et les fins sont écrits en V7.

## C. Les PNJ du Pont-Cassé

### 1. Mère Pivoine (`mere-pivoine`, roulotte)

Humaine, 68 ans, doyenne des forains, assise sur le banc, côté porte. **Voix** : posée, rêche, un humour sec ; elle parle en proverbes de route. **Désir** : que son fils sorte sain et sauf de la foire. **Peur** : perdre la roulotte et son fils. Elle attend le colis de Brun.

| # | Sujet | Contenu | Effets / condition |
| --- | --- | --- | --- |
| 1 | « Brun doit vous livrer quelque chose ? » | Elle attend des ferrures et des clous neufs pour l'essieu de sa roulotte ; Brun est « de parole, mais lent ». | — |
| 2 | « Parlez-moi de la troupe. » | Les forains, leurs métiers ; la foire du lendemain ; ce que valent les roulottes. | — |
| 3 ★ | « Où est votre fils ? » | Elle jette un regard à la bâche ; elle ne ment pas à qui est venu avec bonne foi ; Tobie est là, il ne sort pas depuis hier. | révèle `f-tobie-dans-la-roulotte` |
| 4 | « Pourquoi campez-vous ici ? » | Le pont brisé : « la ville nous laisse la rive depuis l'effondrement » ; elle n'aime pas qu'on en parle. | — |
| 5 | **Remettre le colis** (bouton « Lui remettre le colis de Brun. ») | **Condition** : objet `colis-de-brun`. Elle ouvre la toile, vérifie un clou, écrit un reçu. | effets : retire `colis-de-brun`, donne `recu-de-mere-pivoine`, drapeau `colis-remis-a-mere-pivoine` ; `unique` |
| 6 ★ (secret) | « Qu'avez-vous à me dire de plus ? » | **Condition** : drapeau `colis-remis-a-mere-pivoine`. Elle se fie à eux : Tobie lui a dit avoir caché la clé « au grenier du moulin, dans la grosse poutre » avant de se terrer ici ; elle n'en sait pas plus. | révèle `f-cle-au-grenier` |

Au moins 4 sujets libres (1, 2, 3, 4 « Pourquoi campez-vous ici ? »). **Salutation qui change** : colis remis (« Vous êtes de la maison »). Mère Pivoine ne dit jamais que Tobie a volé la clé.

### 2. Tobie Pivoine (`tobie-pivoine`, roulotte)

Humain, 24 ans, funambule. **Voix** : nerveuse, rapide, honteuse ; il plaisante pour ne pas pleurer. **Désir** : payer sa dette sans perdre sa mère ni sa corde. **Peur** : Gédéon, et de décevoir sa mère. Derrière la bâche.

| # | Sujet | Contenu | Effets / condition |
| --- | --- | --- | --- |
| 1 ★ | « Pourquoi vous cachez-vous ? » | Des hommes l'ont chassé du moulin ; il ne veut pas qu'on les mène à sa mère ; il n'en dit pas plus. | condition : `f-tobie-dans-la-roulotte` connu |
| 2 | « Votre mère ? » | La roulotte, l'essieu, ses mains qui tremblent ; il l'aime et la protège. | idem |
| 3 | « Parlez-nous de la corde. » | Le funambule : l'équilibre, la peur du vide, le nœud ; il évite de dire à qui il a acheté la corde fine. | idem |
| 4 | « Que s'est-il passé au moulin ? » | Il esquive : « rien de ce que vous croyez » ; il regarde la bâche. | idem |
| 5 ★ (secret) | « On veut seulement aider. » | **Condition** : drapeau `colis-remis-a-mere-pivoine` **ou** attitude ≥ 30. **L'aveu** : il devait 90 po à Gédéon Marchebise ; Gédéon menaçait de faire saisir la roulotte de sa mère ; il a volé la clé du coffre pour payer en douce avec la bourse du concours, puis il a perdu courage et l'a cachée au grenier du moulin (dans une fente de la poutre) avant de se terrer ici ; il offre son porte-bonheur. | révèle `f-tobie-a-vole-la-cle`, `f-cle-au-grenier`, `f-gedeon-et-la-dette` ; donne `porte-bonheur-de-funambule` ; drapeau `tobie-confie` ; `unique` |

**Salutations** : neutre = silence derrière la bâche ; variante `tobie-confie`. **Cas limites** : menacé, il se rend (aucun sujet) ; il ne combat pas, ne fuit pas, ne meurt pas (P8).

### 3. Les forains du camp (`forains-du-camp`, camp) **[nouveau, P1]**

PNJ collectif, sans nom propre, humain ; **voix** : plusieurs, rieuse, un peu méfiante des étrangers. **Désir** : une belle foire demain. **Peur** : qu'on touche à l'un des leurs. Tous les sujets ont `attitudeMin: 0` : un groupe hostile les ferme (V4).

| # | Sujet | Contenu |
| --- | --- | --- |
| 1 | « Que préparez-vous ? » | La foire de demain : répétitions sous le pont brisé, costumes, l'accordéon. |
| 2 | « Qui est Tobie ? » | « Un des nôtres », le meilleur sur la corde ; pas vu depuis hier ; sa mère est dans la roulotte à l'écart ; on le laisse tranquille. |
| 3 | « Pourquoi ce camp ? » | Chaque automne, la ville leur laisse la rive depuis l'effondrement du pont. |
| 4 | « La corde, au bout du camp ? » | La corde tendue entre les deux poteaux : on y monte à tour de rôle ; le poteau ouest est poli par les mains ; on y apprend les petits. |

## D. Pièce par pièce

### 1. Le camp des forains (`pon-camp`)

- **PNJ** : `forains-du-camp` ; Mathilde Pot-de-Miel **le soir** (P2).
- **Trésor** `pon-tre-costumes` : la caisse de costumes sous l'auvent de la roulotte la plus à l'est, côté corde ; contenant, aucun obstacle ; 10 po.
- **Examens** : les affiches de la troupe (montant de la roulotte de tête) ; le poteau ouest de la corde (poli par les mains) ; les piles du pont brisé (ambiance).
- **Liens** : `ver-pont-des-marchands` (sentier de rive, 0,5 h, P7) ; `pon-roulotte` (porte, trois marches).
- **Cas limite** : groupe hostile, les forains se ferment ; la roulotte reste accessible.

### 2. La roulotte de Mère Pivoine (`pon-roulotte`)

- **PNJ** : Mère Pivoine (banc, côté porte) ; Tobie (derrière la bâche, muet jusqu'à `f-tobie-dans-la-roulotte`).
- **Examens** : la bâche rayée (`f-tobie-dans-la-roulotte`) ; la poupée de la tablette (`f-poupee-jumelle`) ; le coffre à costumes (ambiance, aucun contenu) ; les sept étoiles ocre du montant de la fenêtre (ambiance).
- **Objets** : `colis-de-brun` remis à Mère Pivoine ; `recu-de-mere-pivoine` reçu en échange ; `porte-bonheur-de-funambule` donné par Tobie (tous déjà écrits au village).
- **Aucun combat, aucun piège, aucune rencontre.**

## E. Chemin et cas limites

- Le Pont-Cassé n'est pas sur le chemin le plus court (la clé se trouve au moulin) ; il en est le **chemin le plus riche** : Tobie y avoue tout, et le colis de Brun s'y livre (quête secondaire).
- Cas limites (V4) : groupe hostile aux forains (ils se ferment) ; Tobie ne meurt pas et ne combat pas ; le colis ne se vend ni ne se jette ; si le groupe n'a jamais le colis, l'aveu s'obtient par la confiance (P4).

## F. Ce que V6 demande ensuite

Après ton oui : 3 agents Haiku (Mère Pivoine ; Tobie ; les forains, les examens et la caisse), environ 330 000 tokens Haiku ; un petit ajustement du texte de Mathilde (P2) ; assemblage, audit, `pnpm monde valider`, présentation du Pont-Cassé écrit. Puis V7.
