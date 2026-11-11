# Mission : écrire les questions du codex de La Citadelle des Marées

> **Exemple réel, tiré de La Citadelle des Marées.** Pour un autre monde, garde la structure, les règles et le format ; remplace l'id du monde, les noms, les identifiants et les listes (examens, questions, PNJ, lieux…) par ceux de ton monde, tirés du canon et de l'atlas. `<dossier temporaire de la session>` est le dossier temporaire (scratchpad) de la session en cours. Tous les chemins sont relatifs à la racine du dépôt.

Monde : `packages/regles/tests/fixtures/mondes/citadelle-des-marees/`. Lis `BIBLE.md` (canon et secrets) et ce brief. Format : `packages/regles/src/monde/codex-donnees.ts`. Écris UNIQUEMENT le fichier `codex/z9-questions.json` (tableau JSON de 14 objets ; crée le dossier `codex/`). Pas de commit. Vérifie : `cd C:/Users/sebas/Documents/GitHub/D&D/crpg-llm && pnpm monde valider citadelle-des-marees` : 0 erreur pour ton fichier. Rapport final court.

## Ce qu'est une question du codex
Un mystère que le groupe se pose, comme dans le journal d'un grand jeu de rôle. Elle **apparaît** quand le groupe apprend le fait de départ (`quand`), reste **en suspens** avec une **piste**, et se **ferme** quand il apprend le fait qui y répond (`resolue`) ; il lit alors la **réponse**.

Champs par question : `id` (donné), `texte` (la question, **donnée ci-dessous ; reformule-la seulement si elle est maladroite**, ≤ 18 mots, du point de vue du groupe), `quand` (`{ "fait": "…" }`, donné), `resolue` (`{ "fait": "…" }`, donné), `piste` (**à écrire**, 12 à 25 mots : où ou auprès de qui chercher, un geste concret ; **jamais la réponse**, jamais un nom que le groupe ne connaît pas encore ; ne cite pas le fait qui résout), `reponse` (**à écrire**, 15 à 35 mots : ce que le groupe en conclut, **uniquement ce que le fait de résolution dit** ; une réponse partielle est bonne : elle ouvre la suite).

Style : sobre, maritime, mélancolique ; voix « nous » ou impersonnelle (c'est le carnet du groupe) ; pas de dialogue ; pas de « mystérieux ». La piste donne envie sans spoiler ; la réponse apprend quelque chose sans clore tout le monde.

## Les 14 questions
Pour chacune : `quand` = le fait qui l'OUVRE (le groupe le connaît déjà : la question part de là, la piste et la question peuvent s'y appuyer) ; `resolue` = le fait qui la FERME (le groupe ne le connaît pas encore : la piste ne doit ni le citer ni le révéler ; la réponse ne dit que ce que ce fait dit).

### q-mer-trop-loin
- Question (`texte`) : Pourquoi la mer se retire-t-elle plus loin que jamais ?
- `quand` = `{ "fait": "f-fal-mer-trop-loin" }` — le groupe sait déjà : La mer s'est retirée au-delà de toute marée connue : les vieux saulniers ne l'ont jamais vue si basse, ni si longtemps.
- `resolue` = `{ "fait": "f-la-cour-tient-sous-la-mer" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : La Cour de Lothmar ne repose pas. Liée sous les flots, sans sommeil, elle tient la mer tant qu'un Sceau n'a pas pris sa place. Ses membres ne sont ni fous ni cruels : ils sont épuisés.

### q-tables-qui-retardent
- Question (`texte`) : Pourquoi les tables de marée retardent-elles de deux heures ?
- `quand` = `{ "fait": "f-cit-tables-decalees" }` — le groupe sait déjà : Les tables de marée de l'observatoire retardent de deux heures depuis le printemps ; les pêcheurs de la baie ont déjà perdu une sortie à cause d'elles.
- `resolue` = `{ "fait": "f-cit-fissure-de-l-intendance" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : Une fissure ancienne, dans la paroi de la cave de l'intendance, laisse remonter l'eau de mer : la marée entre dans la Citadelle par en dessous, et elle monte avant l'heure.

### q-la-cour
- Question (`texte`) : Qui est « la Cour » dont parlent les lettres au sceau de cire noire ?
- `quand` = `{ "fait": "f-cit-lettres-cire-noire" }` — le groupe sait déjà : Les lettres du sac de l'érudit portent un sceau de cire noire à trois vagues. Elles ne sont signées que d'une initiale, et parlent de « la Cour » comme d'une personne vivante.
- `resolue` = `{ "fait": "f-la-cour-tient-sous-la-mer" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : La Cour de Lothmar ne repose pas. Liée sous les flots, sans sommeil, elle tient la mer tant qu'un Sceau n'a pas pris sa place. Ses membres ne sont ni fous ni cruels : ils sont épuisés.

### q-femme-sous-la-chaussee
- Question (`texte`) : Qui est la femme debout sous la chaussée, et que réclame-t-elle ?
- `quand` = `{ "fait": "f-cit-dame-sous-la-mer" }` — le groupe sait déjà : Le marin tiré de l'eau a vu, sous la chaussée, une femme debout dans l'eau, immobile, qui demande qu'on lui rende ce qui lui appartient. Il l'a prise pour une mère qui pleure ; elle réclame un dû.
- `resolue` = `{ "fait": "f-deux-cours" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : La Cour noyée est divisée. Le Chancelier Orvald veut relever Lothmar avec un Sceau couronné ; la Dame Noyée, la Régente elle-même, veut rompre le pacte et laisser les noyés reposer.

### q-perle-grise
- Question (`texte`) : Quelle force a tiré la Perle grise sous l'eau ?
- `quand` = `{ "fait": "f-fal-perle-grise-coulee" }` — le groupe sait déjà : La Perle grise n'a pas sombré dans une tempête ordinaire : le vent était tombé, et le cotre a été tiré sous la coque par une force venue de dessous.
- `resolue` = `{ "fait": "f-la-cour-tient-sous-la-mer" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : La Cour de Lothmar ne repose pas. Liée sous les flots, sans sommeil, elle tient la mer tant qu'un Sceau n'a pas pris sa place. Ses membres ne sont ni fous ni cruels : ils sont épuisés.

### q-noyes-ne-remontent-pas
- Question (`texte`) : Pourquoi la mer ne rend-elle jamais ses noyés ?
- `quand` = `{ "fait": "f-fal-noyes-ne-remontent-pas" }` — le groupe sait déjà : Les noyés des naufrages ne remontent jamais : la mer les garde, et leurs tombes restent vides sous la pierre.
- `resolue` = `{ "fait": "f-le-sceau-est-prisonnier" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : Le Sceau n'est pas honoré : il demeure sous la mer, vivant et lié, sans retour. Et ce que la mer retient, elle le prend aussi à la côte : les noyés des naufrages ne remontent jamais.

### q-ligne-de-sel
- Question (`texte`) : De quelle marée date la ligne de sel de la grotte ?
- `quand` = `{ "fait": "f-fal-grotte-marque-de-maree" }` — le groupe sait déjà : Une ligne de sel blanc, sur la paroi du bassin, marque le niveau d'une marée plus haute que toutes celles qu'on a mesurées à la Citadelle.
- `resolue` = `{ "fait": "f-nuit-haute" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : La Régente Aelis Corvane refusa de livrer son propre fils. Privée de son Sceau, la mer monta en une seule nuit, la Nuit Haute, et la Cour se noya dans son palais.

### q-lanterne-sous-l-eau
- Question (`texte`) : Qui porte la lanterne qui marche au fond de l'eau ?
- `quand` = `{ "fait": "f-por-lumieres-sous-l-eau" }` — le groupe sait déjà : Au large de la chaussée, à marée basse, une lanterne sans main se déplace au fond de l'eau, et s'arrête quand on la vise.
- `resolue` = `{ "fait": "f-lot-garde-des-noyes" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : Les gardes du parvis sont les soldats de la garde royale, noyés la nuit de la Nuit Haute ; ils ne quittent pas la cour, et ils ne savent plus pourquoi ils tiennent leur poste.

### q-l-enfant-de-la-barque
- Question (`texte`) : Qui était l'enfant trouvé dans la barque, il y a seize ans ?
- `quand` = `{ "fait": "f-cit-barque-a-la-derive" }` — le groupe sait déjà : Il y a seize ans, Ysmène a trouvé un nouveau-né dans une barque à la dérive, au pied de la falaise, enveloppé dans une couverture de laine bleue.
- `resolue` = `{ "fait": "f-nolwen-est-le-sceau" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : Nolwen, élevée à la Citadelle depuis seize ans, porte la marque de basse-mer. Elle est le Sceau de cette génération, et la Cour la cherche depuis son enfance.

### q-l-homme-bleme
- Question (`texte`) : Qui est l'homme blême qui suit le groupe, et pour qui travaille-t-il ?
- `quand` = `{ "fait": "f-por-heraut-suit-le-groupe" }` — le groupe sait déjà : Un homme blême, au manteau sec malgré la pluie, a demandé à Joss quel groupe cherchait une barque pour la chaussée. Il suit les voyageurs depuis la Citadelle.
- `resolue` = `{ "fait": "f-lot-chancelier-couronne" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : Le Chancelier Orvald Sel veut poser la couronne de Lothmar sur la tête d'un Sceau vivant et consentant, pour que le royaume se relève, quoi qu'il en coûte à la côte.

### q-phare-cellule
- Question (`texte`) : Qui remplit un phare du cap de cages de plomb, et pour qui ?
- `quand` = `{ "fait": "f-lot-prisonnier-voit-les-barques" }` — le groupe sait déjà : Des barques de la Ligue des Phares sondent la côte de nuit, et transportent des cages de plomb vers un phare du cap, qu'on appelle un phare-cellule.
- `resolue` = `{ "fait": "f-ligue-et-phare-cellule" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : La Ligue des Phares veut enfermer le Sceau dans un phare-cellule scellé, pour que la mer n'ait personne à réclamer. Elle appelle cela de la sagesse.

### q-pierre-de-rupture
- Question (`texte`) : Où est cachée la Pierre de rupture ?
- `quand` = `{ "fait": "f-pierre-de-rupture" }` — le groupe sait déjà : Une pierre est tombée avec la Cour : la Pierre de rupture. Elle peut briser la marque du Sceau et libérer les noyés. Elle est cachée au Palais, et seule la Dame Noyée en connaît l'endroit.
- `resolue` = `{ "fait": "f-lot-pierre-cachee-chapelle" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : La Pierre de rupture est cachée sous l'autel de la chapelle de la Régente, dans un creux scellé par le sel ; la Dame Noyée l'y a placée elle-même.

### q-cercles-de-sel
- Question (`texte`) : Où mène la route de cercles de sel qui descend vers la mer ?
- `quand` = `{ "fait": "f-cit-cercles-de-sel" }` — le groupe sait déjà : Au pied des jardins de falaise, des cercles de sel frais dessinent une ligne droite vers la mer, comme une route tracée à la craie sur la roche.
- `resolue` = `{ "fait": "f-chaussee-des-basses-eaux" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : À marée très basse, la chaussée des Basses-Eaux découvre un passage de pierre noire entre la côte et le Palais-Basmarée. La mer le reprend vite, et les marins disent qu'elle n'attend pas qu'on ait fini.

### q-pilotes-disparus
- Question (`texte`) : Pourquoi la Ligue interdit-elle la jetée aux pilotes qui parlent de la chaussée ?
- `quand` = `{ "fait": "f-por-ligue-prime-les-pilotes" }` — le groupe sait déjà : La Ligue interdit la jetée aux pilotes qui parlent de la chaussée ; le registre des disparus compte six noms de pilotes.
- `resolue` = `{ "fait": "f-ligue-et-phare-cellule" }` — il l'apprendra plus tard (sert à écrire la `reponse`) : La Ligue des Phares veut enfermer le Sceau dans un phare-cellule scellé, pour que la mer n'ait personne à réclamer. Elle appelle cela de la sagesse.

