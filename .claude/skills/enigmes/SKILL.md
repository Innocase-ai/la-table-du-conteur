---
name: enigmes
description: Écrire, relire, vérifier ou réparer les énigmes d'un monde de « La Table du Conteur » (séquence, placement, cadran, leviers, mot de passe, déduction). À utiliser dès qu'on crée ou modifie une énigme, qu'on écrit un monde qui en contient, ou qu'on demande de « vérifier l'énigme X » — et AVANT de dire qu'une énigme est finie. Une énigme n'est jamais « bonne » parce qu'elle passe le validateur : elle l'est quand on l'a jouée, en entier, par ses boutons.
---

# Les énigmes : écrire, et surtout vérifier

**Règle d'or : une énigme n'existe que si on l'a jouée.** Le schéma et `pnpm monde valider` ne disent pas qu'on peut la résoudre. Dans ce projet, 13 énigmes sur 18 du Val passaient la validation alors que le joueur n'avait aucun moyen de les résoudre, et l'échec de quatre d'entre elles supprimait le combat qu'il annonçait. Chaque fois que tu crées, modifies ou relis une énigme, **tu exécutes la vérification ci-dessous et tu dis ce qu'elle a donné** (y compris les avis).

## 1. Vérifier (toujours, dans cet ordre)

1. **`pnpm monde enigmes <monde>`** : l'audit *joue* chaque énigme dans le vrai moteur, avec le groupe conseillé : la bonne réponse construite d'après ce que propose le formulaire, une mauvaise réponse, une réponse mal formée. **Zéro erreur exigé.** Lis chaque avis et décide : corriger, ou le justifier à l'utilisateur (un avis peut être voulu). Ne dis jamais « énigme vérifiée » sans cette sortie.
2. **`pnpm monde valider <monde>`** : références et accessibilité ; il inclut l'audit des énigmes.
3. **`pnpm test`** : `tests/enigmes.test.ts` résout les énigmes de chaque monde livré par leur formulaire.
4. **Les jouer dans le jeu** (au moins une énigme de chaque *type* nouveau ou modifié), car l'écran a ses propres défauts : cadran qui ne se valide pas, liste déroulante sans l'élément, texte trop long. Procédure (la sauvegarde du joueur n'est pas à toi : copie-la, puis remets-la) :
   - lancer `pnpm jeu` (si des fichiers de données ont été ajoutés depuis son démarrage, le relancer) ;
   - dans la page : `localStorage` clé `table-du-conteur:partie` → copie dans `…-sauvegarde-essai`, puis mets `etat.lieu` au lieu de l'énigme et `scene` à `{ "type": "exploration" }`, recharge, « Reprendre l'aventure » ;
   - jouer **la bonne réponse, une mauvaise et « Chercher un indice »** ; lire le récit (ordre, texte, combat lancé ou non) ;
   - **restaurer la sauvegarde** et supprimer la copie.
5. **Relire à la main ce que l'audit ne peut pas juger** (§ 3).

## 2. Ce que contrôle `pnpm monde enigmes`

| Contrôle | Gravité | Ce qu'il détecte |
| --- | --- | --- |
| `jouable` | erreur | pas de bouton de réponse ; élément de la solution absent du formulaire ; mauvais nombre de champs ; valeur hors plage ; la bonne réponse ne résout pas |
| `ordre-neutre` | erreur | les éléments sont proposés dans l'ordre de la solution |
| `mal-formee` | erreur | une réponse mal formée n'est pas refusée, ou change la partie |
| `echec`, `echec-rencontre`, `echec-piege` | erreur | une mauvaise réponse n'est pas un échec ; l'échec ne lance ni la rencontre ni le piège que `echec` nomme |
| `reessayer` | avis | après l'échec (et le combat réglé), plus de bouton pour retenter |
| `echec-defini` | avis | aucun `echec` : on force l'énigme par essais, sans risque |
| `echec-annonce` | avis | le texte d'échec annonce un danger mais aucun effet ne le produit |
| `recompense-lue` | avis | un drapeau posé par la récompense n'est lu par aucune condition ni aucun lien : la récompense ne sert à rien |
| `indices`, `indices-jet` | avis | il manque un niveau d'indice (1, 2, 3) ; une compétence sans DD |
| `enonce-ordre` | avis | l'énoncé cite les éléments dans l'ordre de la solution : la réponse se lit sans réfléchir |
| `lecture-leviers`, `plage-cadran`, `libelles-cadran` | avis | l'énoncé ne dit pas comment lire les leviers ; cadran sans plage ni noms de réglages |

## 3. À relire à la main

- **Soluble par déduction** à partir de l'énoncé seul, sans connaître les identifiants ni le monde. Un joueur attentif y arrive ; un joueur pressé trouve l'indice 3 en cherchant.
- **Les trois indices montent** : 1 oriente, 2 précise, **3 donne la réponse** (tous les éléments, dans l'ordre pour une séquence). Leur jet (compétence, DD) est plausible pour le niveau du lieu.
- **Le texte d'échec et ses effets disent la même chose.** Si le texte annonce un combat : `{ "rencontre": "<id>" }` (qui déclenche), pas un drapeau. Si c'est un piège : `echec.piege`.
- **La récompense compte** : un lien qui s'ouvre (`condition` sur le drapeau), une quête qui avance, un trésor, un fait appris. Un texte comme « la brèche reste sans surveillance » doit correspondre à quelque chose que le jeu fait.
- **L'énoncé dit tout ce qu'il faut pour répondre** : le sens des leviers (« en haut = levé »), la plage d'un cadran, ce que représente chaque élément. Il ne livre pas la solution dans l'ordre où il cite les éléments.
- **Le lieu** existe et s'atteint (le validateur le vérifie) ; l'énigme y est bien annoncée par le lieu ou un indice.

## 4. Écrire une énigme

Dossier `enigmes/` du monde. Champs : `id`, `nom`, `lieu`, `enonce` (ce que lit le joueur), `solution`, `indices` (niveaux 1 à 3, avec `competence` et `dd` facultatifs), `echec` (`effets`, `piege`, `resume`), `recompense` (`effets`, `tresor`, `resume`).

| `solution.type` | Données | Le joueur… |
| --- | --- | --- |
| `mot-de-passe` | `mots` | écrit un mot |
| `deduction` | `reponses` | écrit une réponse |
| `sequence` | `ordre` : éléments dans l'ordre | clique les éléments dans l'ordre |
| `placement` | `emplacements` : emplacement → élément | associe chaque emplacement à un élément |
| `cadran` | `valeurs`, `plage: [min, max]`, `libelles` | règle chaque nombre |
| `leviers` | `positions` (`true` = en haut) | met chaque levier en haut ou en bas |

- Les éléments d'une séquence ou d'un placement sont **ce que le joueur voit** : un identifiant lisible (`wagonnet-de-minerai` → « Wagonnet de minerai ») ou l'id d'un objet (son nom s'affiche). Ils sont proposés dans un ordre neutre.
- Donne toujours `plage` et `libelles` à un cadran, et dis dans l'énoncé comment lire des leviers.
- Pas de `echec` = énigme sans risque : choisis-le consciemment (une déduction à texte libre peut s'en passer).
- Détails du format : `docs/MONDES.md` § Énigmes. Conventions d'écriture : `.claude/skills/creer-monde/references/lecons.md` § Énigmes.

## 5. Quand un contrôle échoue

- `jouable` « l'élément … n'est pas proposé » : l'élément de `solution` n'est pas écrit comme dans `ordre`/`emplacements` (faute, casse hors accents) ; ou une valeur sort de `plage`.
- `echec-rencontre` : la rencontre cité n'existe pas, ou l'effet n'est pas `rencontre` (voir l'historique ci-dessous). Si la rencontre est `unique` et déjà jouée, elle ne se relance pas.
- `mal-formee` : ne devrait plus arriver ; c'est un défaut du moteur (`controlerReponse`, `monde/reponses.ts`), pas des données.
- Un avis `recompense-lue` : cherche ce que la récompense devait ouvrir (un `lien` à `condition`, une étape de quête). S'il n'y a rien, retire le drapeau ou branche-le.

## 6. Historique des pièges (pour ne pas les refaire)

- Le bouton « Répondre » envoyait un texte alors qu'une séquence, un cadran, des leviers ou un placement attendent une liste ou une association : **toute réponse était un échec**. D'où `Proposition.formulaire` et le contrôle de forme.
- L'effet `rencontre` marquait la rencontre « faite » au lieu de la lancer : rater l'énigme **supprimait** le combat annoncé.
- Une réponse mal formée (un élément inconnu, un nombre de leviers faux) comptait comme un échec : elle est maintenant refusée sans conséquence.
- Le serveur de développement ne voit pas les fichiers de données ajoutés après son démarrage : le relancer.

## 7. Rendre compte

Dis à l'utilisateur, dans cet ordre : ce qui est juste, ce qui est cassé (avec la sortie de l'audit ou la capture du jeu comme preuve), ce que tu as corrigé, et les avis laissés en l'état avec la raison. Ne commite pas sans son accord.
