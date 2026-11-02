# Leçons du Val des Cendres

Défauts rencontrés en écrivant le premier monde, et leur remède. À relire avant d'intégrer.

## Pendant l'écriture
- **Identifiants avec accent ou majuscule** (`f-tanière`) : refusés par le schéma ; kebab-case ASCII. Le message d'erreur du chargeur nomme le fichier et le champ.
- **Compétence de recherche** : un trésor caché peut se trouver par perception, investigation, survie ou nature. Pour un autre test, il faut faire évoluer le schéma (pas le contourner).
- **Boutiques** : elles citent aussi les armes et armures du SRD par leur id (les agents ne le savent pas toujours : dis-le dans la mission).
- **Un fait que personne ne révèle** : avertissement. Soit un PNJ ou un lieu le révèle, soit un effet.
- **Lieux isolés** : chaque zone déclare un lien double sens vers le hub, sinon l'accessibilité dépend d'une autre zone.
- **Rencontres** : cartes avec au moins 6 `H` et autant de `m` que de monstres ; difficulté cohérente avec le budget de PX d'un groupe de 6.

## À l'intégration
- **Drapeau lu mais jamais posé** (le validateur l'avertit) : trouver quelle zone doit le poser (souvent une conséquence naturelle : une jauge, une mort, une entrée de lieu) et l'ajouter. Dans le Val : le Veilleur ne mourait jamais.
- **Quête à fins alternatives** : marque chaque étape finale `termine: true`. Sans cela, une étape sans suite qui n'est qu'une branche optionnelle termine la quête trop tôt, ou une quête ne se termine jamais. Une étape sans `termine` ne clôt la quête que si plus rien n'est actif.
- **Un même objet sous trois noms** (combustible : minerai, houille, huile de roche) : unifier ou assumer ; chaque nom doit avoir un rôle distinct.
- **Un objet obtenu légitimement qui déclenche une branche de « vol »** : prévoir une voie « don » pour chaque moyen légitime d'obtenir un objet de quête.
- **Un PNJ qu'on corrompt au lieu de le tuer** : les quêtes qui attendent sa mort ou son départ doivent aussi accepter les drapeaux de dissolution.
- **Doubles événements** sur un même palier de jauge (zone du hub et zone centrale) : un seul propriétaire par palier.
- **Fins jouables** : écris un test qui pose les drapeaux et objets du chemin de chaque fin et vérifie `e.fin`. C'est ce test qui a révélé le défaut des étapes finales.
- **Chapitre** : `chapitres[0].quetes` se remplit à la fin avec toutes les quêtes ; `statut: publie`.

## Gestion des agents
- Lance-les ensemble ; ils prennent 15 à 25 minutes chacun. Ne touche pas leurs fichiers pendant ce temps.
- Leurs rapports contiennent les ids qu'ils référencent hors de leur zone : vérifie-les un par un (le validateur le fait aussi).
- Un agent qui ajoute un PNJ ou un fait au canon (ex. une survivante) : accepte si cohérent, mais mets-le au registre ou à la bible pour la suite.
- Le catalogue d'objets et les monstres sont partagés : ne les modifie que pour **ajouter**.
