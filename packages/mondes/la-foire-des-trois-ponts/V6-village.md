# V6 : le village de Verdelle, contenu pièce par pièce — *Validé par l'utilisateur le 20/11/2026 (gelé), décisions D1 à D9 comprises*

Ce document dit **ce qu'on vit** à Verdelle, dans l'ordre des pièces : les PNJ (qui ils sont, ce qu'ils veulent, leurs sujets), le combat, les pièges, les trésors, les objets, les examens, l'événement de la corde. Il ne contient **pas** les textes lus par le joueur : une fois ce plan validé, des agents Haiku écrivent les réponses, les introductions et les issues, avec un pilote d'abord. Il ne touche **pas** à ce qui est gelé (V2 à V5) ; ce qui y est ajouté est marqué **[nouveau]**. Les quêtes, leurs étapes et les fins relèvent de V7 : ici, un sujet dit seulement « démarre la quête X » ou « révèle le fait Y ».

## A. Décisions à valider (les seuls points qui demandent ton avis)

| # | Décision | Proposition | Pourquoi |
| --- | --- | --- | --- |
| D1 | Espèces et âges des PNJ du village | Aubin humain 55 ans ; Colombe halfeline 48 ; Gédéon humain 52 ; Brun nain 60 ; Mathilde gnome 45 ; Pervenche elfe (a l'air de 40 ans) ; Mère Pivoine humaine 68 ; Tobie humain 24 | une foire où l'on croise des peuples variés (BIBLE §6), sans toucher aux rôles |
| D2 | Contenu du colis de Brun | des ferrures et des clous neufs, pour réparer l'essieu de la roulotte de Mère Pivoine | explique « la commande de Mère Pivoine » (forge) et que Brun tienne à la livrer |
| D3 | La poupée du sanctuaire | un examen des ex-voto (Perception DD 10) fait remarquer une poupée récente, peinte en bleu au ruban crème ; le groupe peut la prendre (objet `poupee-de-bois-du-sanctuaire`), puis la montrer à Pervenche | donne la 2ᵉ voie (la poupée) sans ajouter de PNJ ; la poupée sert aussi de recoupement en V7 (la roulotte de Mère Pivoine en abrite une jumelle, V4) |
| D4 | Les 30 po de Gédéon | une salutation au premier contact + un sujet « l'offre » : accepter donne 30 po et pose le drapeau `gedeon-pot-de-vin` (indice de l'écho `epi1-gedeon-vengeur`) ; refuser est sans effet ; aucun effet sur la quête ni les fins | conforme au canon V2 ; ces 30 po viennent en plus des 80 po du village (facultatifs) |
| D5 | Les trésors piégés : DD et dégâts (dont le DD 11 pour chercher le filet des écuries, nouveau : V5 disait seulement « Perception ») | voir §F | niveau 1 : DD 10 à 14, dégâts 1d4 et 1d6 |
| D6 | L'objet unique `perche-d-equilibriste` (récompense d'Aubin) | un bâton +1 (base `baton-de-combat` du SRD, rareté peu commun, +1 attaque et +1 dégâts, magique) ; il se lit « perche de funambule ferrée de laiton » ; quelque chose de simple et d'utile à tous au niveau 2 | le moteur sait déjà le gérer (arme à bonus) ; un effet spécial demanderait du code |
| D7 | L'objet nommé `corde-de-funambule` (récompense de Brun, colis) | corde de soie de 15 m, `degre: nomme`, rareté commun, sans effet de règle ; une jolie récompense de ton | pas d'effet de fiche à inventer |
| D9 | Le « hier » de Brun (V4 gelé : « hier, en livrant des fers au moulin ») | **à trancher** : le vol date de la nuit dernière et la bande est arrivée après, donc « hier » ne tient pas. Je propose **« ce matin, à l'aube »** (Brun livre ses fers de roue avant qu'on pose la barrière, et voit la serrure forcée et les bottes) ; autrement, la serrure aurait été forcée avant le vol, par Tobie (à lui seul) | cohérence de la chronologie ; demande ton accord car cela change un mot du V4 gelé |
| D8 | Le porte-bonheur de Tobie | objet nommé sans effet de règle (curiosité) ; il se donne au Pont-Cassé (zone suivante) | voir V4 |

## B. Faits : les indices du village (ids) **[nouveau, ajoute aux 3 faits clés du canon]**

Les trois faits clés (`f-tobie-a-vole-la-cle`, `f-cle-au-grenier`, `f-gedeon-et-la-dette`) gardent leurs trois sources, dont l'écriture exacte relève de V7 (recoupements). Au village, le groupe ramasse des **indices** (des faits petits, vrais, qui ne disent pas le secret) :

| id | texte (à plat) | Qui ou quoi le donne |
| --- | --- | --- |
| `f-funambule-de-nuit` | Un funambule a été vu rôder de nuit près des ponts. | Colombe (rumeurs), ardoise du Héron |
| `f-hommes-de-main-au-pont-du-meunier` | Des hommes louches ont été vus vers le Pont-du-Meunier, et le moulin est « fermé pour réparations ». | ardoise, Colombe, panneau de la place |
| `f-trace-de-corde-au-cabinet` | Quelqu'un est entré au cabinet du bailli par la rivière : une trace de corde marque le rebord de la fenêtre. | examen du rebord (cabinet) |
| `f-noeud-de-funambule` | Le bout de corde des écuries et la corde de la place portent le même nœud : un nœud de funambule. | examen de la corde (place), examen du bout de corde (écuries), Brun (il le reconnaît) |
| `f-corde-fine-vendue` | Mathilde a vendu une corde fine de soie à un funambule, il y a peu. | Mathilde (sujet « les cordes ») |
| `f-corde-vendue-a-tobie` | L'acheteur de la corde fine de soie est Tobie Pivoine. | Mathilde (secret : Persuasion DD 11 ou le bout de corde montré) |
| `f-serrure-forcee-au-moulin` | Brun a vu ce matin, à l’aube, la serrure de la cour du moulin forcée, et des bottes en nombre. | Brun (sujet « le moulin ») |
| `f-pervenche-a-vu-tobie` | Sœur Pervenche a vu Tobie prier de nuit au sanctuaire. | Pervenche (secret : Intuition DD 12 ou la poupée) |
| `f-traces-de-rive` | Des traces de boue de rive et un sentier piétiné partent du ponton des bateliers vers le Pont-Cassé. | examen du ponton (Pont-des-Marchands) |

Le fait `f-pervenche-a-vu-tobie` et `f-corde-vendue-a-tobie` sont les deux sources PNJ de `f-tobie-a-vole-la-cle` ; le recoupement (V7) fait passer le groupe de « un funambule rôdait » à « c'est Tobie ».

## C. Les PNJ du village

Pour chacun : **voix**, **désir**, **peur**, **sujets** (≥ 4, dont ≥ 2 sur la quête principale, règle du 16/11/2026), **secrets** éventuels (jet), **salutations qui changent** (au moins 5 PNJ). Toutes les réponses seront écrites en discours direct de 75 à 115 mots. Les « mots » qui déclenchent sont notés par thème.

### 1. Aubin Cerfeuil, bailli de la foire (`aubin-cerfeuil`, halle du bailli)

**Les sujets qui portent la quête principale sont marqués ★** (règle : au moins 2 par PNJ du village). **Voix** : solennelle et empesée, phrases d'huissier qui se défont quand il est inquiet. **Désir** : ouvrir la foire à l'aube sans honte. **Peur** : le scandale, la perte de sa charge. Humain, 55 ans, chaîne de bailli sur un pourpoint trop serré.

| # | Sujet (bouton) | Contenu | Effets |
| --- | --- | --- | --- |
| 1 ★ | « Que se passe-t-il ? » (la clé) | La clé du coffre de la foire a disparu dans la nuit : droits de place et bourse du concours, 300 po. Il demande la discrétion et promet 60 po. **Quête principale.** | démarre `q-la-cle-de-la-foire` |
| 2 ★ | « Où était la clé ? » (le cabinet) | Elle pendait à un clou, près de la fenêtre du cabinet ; aucune effraction ; il laisse le groupe visiter. **Quête principale.** | — |
| 3 ★ | « Qui soupçonnez-vous ? » | Personne, et il ne veut pas qu'on accuse les forains sans preuve ; il vante Gédéon Marchebise, « le plus fidèle des marchands, qui n'a jamais manqué une foire ». | — |
| 4 ★ | « Que devient la foire ? » | Elle s'ouvre à l'aube quoi qu'il arrive ; le coffre reste scellé tant que la clé manque ; la prime tient même après l'ouverture. | — |
| 5 ★ | « Où campent les forains ? » | Sur l'autre rive, au Pont-Cassé, le pont étant brisé ; on y va par le Pont-des-Marchands. | — |

**Salutations qui changent** : clé rapportée (quête terminée) ; clé rapportée sans quête acceptée : il verse la prime et termine la quête (cas limite V4).
**Cas limite n+1** : si le groupe le menace, il appelle la garde et ferme ses sujets jusqu'au matin (sans état nouveau).

### 2. Colombe Tisserand, aubergiste du Héron Gris (`colombe-tisserand`)

**Voix** : bavarde, maternelle, taquine, un dicton à chaque phrase. **Désir** : une cave sans rats avant la foire. **Peur** : une salle vide ou une mauvaise réputation. Halfeline, 48 ans.

| # | Sujet | Contenu | Effets |
| --- | --- | --- | --- |
| 1 | « Un souci ? » (les rats) | Trois rats géants dans la cave ; elle offre une nuit gratuite. **Quête secondaire.** | démarre `q-les-rats-de-la-cave` |
| 2 ★ | « Quoi de neuf au bourg ? » (rumeurs) | « Un funambule rôdait en pleine nuit » ; des hommes louches vers le Pont-du-Meunier. | révèle `f-funambule-de-nuit`, `f-hommes-de-main-au-pont-du-meunier` |
| 3 ★ | « Parlez-moi du moulin. » | Il est fermé pour réparations ; mais « des réparations, ça fait du bruit de marteau, pas de bruit de bottes » ; elle n'y va pas. | indice, pas de fait nouveau |
| 4 | « Qui sont les gens d'ici ? » | Son avis sur Aubin (pointilleux), Brun (bourru mais juste), Pervenche (douce), Mathilde (bavarde), Gédéon (paie comptant, jamais un sourire) ; elle ne dit **rien** sur la dette. | — |
| 5 | « Que sert-on ? » | repas, chambre : 2 po la nuit. | — |

**Services** : repas, **chambre** (2 po, repos de nuit). **Salutations qui changent** : rats vaincus (condition `rencontre r-rats-de-la-cave`) : elle remercie et donne la récompense (cas limite V4 : même sans avoir la quête).
**Cas limite n+1** : attaquée, elle refuse de servir (ni repas ni chambre) jusqu'au lendemain (V4).

### 3. Gédéon Marchebise, marchand de grain (`gedeon-marchebise`, boutique du grain)

**Voix** : onctueuse, calme, poli jusqu'à l'ennui, un chiffre dans chaque phrase. **Désir** : récupérer son dû sans se montrer. **Peur** : que le bailli apprenne qu'il prête. Humain, 52 ans. Il croit son dû légitime.

| # | Sujet | Contenu | Effets / condition |
| --- | --- | --- | --- |
| 1 ★ | « Une proposition ? » (l'offre) | Au premier contact, il a entendu parler de l'affaire de la clé ; il offre 30 po au groupe « pour oublier l'affaire ». | accepter : +30 po, drapeau `gedeon-pot-de-vin` ; refuser : rien |
| 2 | « Votre commerce ? » | Grain, rations, sacs ; la foire est sa grande saison ; il y vient depuis toujours. | boutique |
| 3 | « Que pensez-vous des forains ? » | Des gens sans attache, « qui ne restent jamais deux saisons au même endroit » (opinion, pas un fait). | — |
| 4 ★ | « Parlez-moi du moulin. » | Il regrette que le moulin soit fermé : son grain y est moulu d'ordinaire ; il ne sait pas ce qu'on y répare. | — |
| 5 ★ (secret) | Montrer la reconnaissance de dette | **Condition** : avoir l'objet `reconnaissance-de-dette`. Il cède : il a prêté 90 po à Tobie Pivoine, il a payé Rouquin Lamefine et ses hommes, il sait que la clé est cachée **quelque part au moulin** (sans dire où). | révèle `f-gedeon-et-la-dette` |
| 6 ★ (secret) | Insister sur la bande | Persuasion DD 15, attitude amicale : il lâche « le chef de bande n'est pas de Verdelle » (mi-aveu) ; échec : il se ferme 24 h. | — |

**Boutique** : grain, rations, sacs (objets du catalogue SRD). **Offre** : voir sujet 1. **Salutations qui changent** : pot-de-vin refusé (`gedeon-pot-de-vin` absent après un refus) : plus froid ; fin « scandale » / « silence » (V7).
**Cas limite n+1** : si le groupe crochète son coffre-fort devant lui : il part chez le bailli (`deplacer`, boutique vide) ; la reconnaissance reste prise ; la prime ne change pas.

### 4. Brun Forgefer, forgeron (`brun-forgefer`, forge)

**Voix** : laconique, bourrue, des phrases courtes, une fierté de métier. **Désir** : que son colis arrive à Mère Pivoine avant l'aube. **Peur** : un travail mal fait. Nain, 60 ans.

| # | Sujet | Contenu | Effets |
| --- | --- | --- | --- |
| 1 | « Un travail à confier ? » (le colis) | Il a forgé des ferrures et des clous neufs pour la roulotte de Mère Pivoine ; il ne peut quitter la forge ; il le tient dans son coffre piégé (D2) ; le groupe doit le livrer et rapporter le reçu. | démarre `q-le-colis-du-forgeron` |
| 2 ★ | « Un souci au moulin ? » | Ce matin à l'aube (D9), en livrant les fers de roue que le meunier lui commande chaque automne, il a vu la serrure de la cour **forcée**, et des bottes en nombre. *(détail nouveau : l'origine des fers)* | révèle `f-serrure-forcee-au-moulin` |
| 3 ★ | « Reconnaissez-vous cette corde ? » | **Condition** : avoir examiné le bout de corde des écuries. Il reconnaît un nœud de funambule. | révèle `f-noeud-de-funambule` |
| 4 | « Que forgez-vous ? » | Fers, lames simples, clous ; sa forge est ouverte aux acheteurs. | forge (armes simples) |
| 5 | « Parlez-moi de Mère Pivoine. » | La doyenne des forains, sa meilleure cliente ; il l'appelle « la vieille ». | — |

**Services** : forge et armes simples. **Salutations qui changent** : colis remis (quête terminée) : sa franche gratitude.
**Cas limite n+1** : si le coffre est forcé à la brute, le piège part (1d4) et le colis reste intact ; le colis est un objet de quête (ni vendu, ni jeté).

### 5. Mathilde Pot-de-Miel, colporteuse (`mathilde-pot-de-miel`, marché)

**Voix** : volubile, rieuse, vend en parlant, appelle tout le monde « mon bijou ». **Désir** : vendre sa marchandise avant l'ouverture. **Peur** : être soupçonnée d'être de mèche avec un voleur. Gnome, 45 ans.

| # | Sujet | Contenu | Effets |
| --- | --- | --- | --- |
| 1 | « Que vendez-vous ? » | cordes, rations, bijoux de foire ; boutique. | boutique |
| 2 ★ | « Auriez-vous vendu une corde fine ? » (les cordes) | Elle a vendu une corde fine de soie à un funambule, il y a peu ; elle ne donne pas son nom (« un client est un client »). | révèle `f-corde-fine-vendue` |
| 3 | « Qui vient à votre étal ? » | Les forains, surtout ; elle rejoint le camp du Pont-Cassé le soir (P2 du Pont-Cassé, 20/11/2026 : « ses jours » devient « le soir »). | — |
| 4 | « Un mot sur le bourg ? » | Avis sur Brun, Colombe, Aubin, Gédéon (« il ne marchande jamais, c'est louche »). | — |
| 5 ★ (secret) | Le nom de l'acheteur | Persuasion DD 11 ou l'objet « bout de corde » montré : elle dit que c'était **Tobie** (mais sans dire qu'il a volé la clé). | ajoute le fait `f-corde-vendue-a-tobie` : « Mathilde a vendu la corde fine à Tobie Pivoine » |

**Salutations qui changent** : groupe vu au camp (condition à fixer en V7). **Cas limite n+1** : volée, elle plie son étal et part au camp des forains (`deplacer`).

### 6. Sœur Pervenche, soigneuse du sanctuaire (`soeur-pervenche`)

**Voix** : douce, lente, des silences, ne juge personne. **Désir** : aider ceux qui souffrent sans trahir leur confiance. **Peur** : violer le secret de la prière. Elfe, a l'air de 40 ans.

| # | Sujet | Contenu | Effets |
| --- | --- | --- | --- |
| 1 | « Pouvez-vous nous soigner ? » | soins du sanctuaire (offrande libre, service). | service de soins |
| 2 | « Le sanctuaire ? » | La source sous la nef, les ex-voto (rubans et poupées de bois), l'offrande des forains. | — |
| 3 ★ | « Qui prie la nuit ici ? » | Elle hésite : le secret de ceux qui prient. **Deux voies** : Intuition DD 12, ou la poupée montrée ; sinon, elle refuse poliment. | révèle `f-pervenche-a-vu-tobie` (« un jeune funambule, venu la nuit dernière ») |
| 4 ★ | « Qu'est-ce qui pèse sur les forains ? » | Elle sait que les forains sont inquiets, sans dire pourquoi (ce n'est pas son secret). | — |
| 5 ★ | « Pouvez-vous nous guider ? » (le Pont-Cassé) | Les forains campent sur l'autre rive ; la route passe par le Pont-des-Marchands. | — |

**Salutations qui changent** : poupée montrée.
**Cas limite n+1** : si Pervenche refuse de parler : les deux voies ; aucun échec définitif (l'Intuition se retente après 24 h ; la poupée reste disponible).

## D. Le combat du village : `r-rats-de-la-cave`

| Champ | Valeur |
| --- | --- |
| Lieu | `ver-heron-cave` ; PX | 3 × `rat-geant` = 75 PX ; difficulté **faible** (verdict : trivial pour 6 héros, voulu : premier combat tutoriel) |
| Adversaires | 3 rats (muets : langues « aucune »), aucune alternative (combat seul, décidé V2) |
| Plateau | grille 12 × 7 ; `terrain: souterrain` ; 5 tonneaux en `#` (mur est), l'étagère en `#`, le trou de rats au sud-ouest (`m`) ; 6 `H` près de l'escalier |
| Butin | aucun sur les rats ; le **tonneau caché** (trésor gardé par la rencontre) : 8 po + un vin fin (id du catalogue à vérifier) |
| Prix d'échec | défaite : 1 PV, moitié de l'or, 8 h (règle du jeu) ; fuite : retour à la salle |
| Cas limite | rats tués avant d'avoir la quête : Colombe remercie et donne la récompense |

## E. Les trésors, objets et contenants du village

| Pièce | Entité | Contenant | Accès | Contenu |
| --- | --- | --- | --- | --- |
| Place | cache sous la fontaine | `cache` | Perception DD 12 | 5 po et une pièce de foire ancienne (curiosité, valeur 1 po) |
| Cave | tonneau caché | `autre` (tonneau) | gardé par `r-rats-de-la-cave` | 8 po, un vin fin |
| Cabinet | carnet du bailli | `etagere` | fouille (sans jet) | 12 po ; texte du carnet : comptes de place, **sans secret** |
| Forge | coffre du colis | `coffre` | verrou DD 12 + piège (voir §F) | `colis-de-brun` (objet de quête) |
| Boutique | coffre-fort | `coffre` | verrou DD 14 + piège (voir §F) | 40 po et `reconnaissance-de-dette` (objet de quête) |
| Écuries | cache dans le foin | `cache` | Perception DD 12 | 10 po |
| Pont-des-Marchands | caisse de bateliers | `coffre` | fouille | 5 po |
| Sanctuaire | poupée de bois | `autre` | examen Perception DD 10 | `poupee-de-bois-du-sanctuaire` (objet, indice pour Pervenche) |

Total d'or : 5 + 8 + 12 + 10 + 5 + 40 = **80 po** (conforme au budget d'or de V4 (village 80 po)).

## F. Les pièges du village (rattachement et valeurs)

| Piège | Pièce | Rattachement | Détection (chercher) | Désamorçage | Déclenchement | Effet |
| --- | --- | --- | --- | --- | --- | --- |
| Aiguille du coffre du colis | forge | contenant (`tresor.acces.piege`) | Perception DD 12 | Escamotage DD 12, outils de voleur | texte : l'aiguille jaillit de la serrure | sauvegarde Dextérité DD 11 (moitié) ; 1d4 perforants |
| Dard du coffre-fort | boutique | contenant | Perception DD 13 | Escamotage DD 13, outils de voleur | texte : un dard sort du couvercle | sauvegarde Dextérité DD 12 ; 1d6 perforants ; *il ne peut être déclenché qu'une fois* |
| Filet des écuries | écuries | libre (quand on prend le foin) | Perception DD 11 | Dextérité DD 10 : couper la corde | texte : un filet tombe ; la bousculade coûte du temps | sauvegarde Dextérité DD 10 ; échec : effet `temps` d'une demi-heure, aucun dégât |

Tous se **cherchent** (`piegesACherche`). Aucun piège au village ne tue : le moteur ne tue pas, et les PV de départ au niveau 1 absorbent 1d6.

## G. L'événement à choix : la corde des funambules (place, lieu-vitrine du village)

Une grande image, une narration courte, trois choix généraux, puis un résultat :

| Choix | Jet | Résultat |
| --- | --- | --- |
| **Traverser la corde** | Acrobaties DD 8 | réussite : applaudissements, un forain rend 2 po de pourboire ; **échec** (la branche obligatoire de V4 : le test à échec amusant du premier épisode, règle 5) : un plouf sans danger dans la vasque, rires ; un héros mouillé se sèche au Héron Gris |
| **Regarder la corde de près** | aucun | on remarque un **nœud de funambule** : `f-noeud-de-funambule` (première source) |
| **Passer son chemin** | aucun | rien ne change, aucun coût |

Choix propres à l'origine d'un héros : une option facultative pour les héros acrobates ou forains (à écrire s'il y a une origine qui s'y prête), sans effet sur la suite.

## H. Les examens (un par élément remarquable, mots lus par le joueur)

| Pièce | Élément | Ce qu'on y lit | Fait |
| --- | --- | --- | --- |
| Place | panneau d'affichage | « Moulin fermé pour réparations, jusqu'à nouvel ordre. » | `f-hommes-de-main-au-pont-du-meunier` (en partie) |
| Place | corde | le nœud | `f-noeud-de-funambule` |
| Héron | ardoise des rumeurs | funambule de nuit ; hommes louches vers le Pont-du-Meunier | `f-funambule-de-nuit`, `f-hommes-de-main-au-pont-du-meunier` |
| Halle | registre de la foire | droits de place des marchands, sans détail utile | — |
| Cave | sac de farine rongé | atmosphère (rats) | — |
| Cabinet | rebord de la fenêtre | trace de corde ; aucune effraction ; le coffre est intact | `f-trace-de-corde-au-cabinet` |
| Sanctuaire | ex-voto | rubans et poupées ; une poupée récente | l'objet poupée (D3) |
| Forge | la commande | le colis attend, une étiquette « Mère Pivoine » | — |
| Marché | balance publique | atmosphère | — |
| Écuries | bout de corde noué | nœud de funambule | `f-noeud-de-funambule` |
| Pont-des-Marchands | marques de crue, avis aux bateliers, ponton | atmosphère ; traces de boue de rive sur les marches, sentier piétiné vers le Pont-Cassé | `f-traces-de-rive` |

## I. Cas limites « n+1 » du village (V4, rappelés)

Aucun ne crée d'état nouveau : Colombe refuse de servir si attaquée ; Aubin verse la prime si la clé est rapportée sans quête acceptée ; Gédéon part chez le bailli si on crochète son coffre devant lui (`deplacer`) ; Mathilde part au camp si on la vole (`deplacer`) ; coffre du colis forcé : le piège part, le colis reste ; Pervenche : deux voies ; groupe tombé à l'eau : une demi-heure pour se sécher.

## J. Chemin le plus court (aperçu, pour V7)

Panneau (place) ou Colombe → Aubin (`q-la-cle-de-la-foire`) → route du moulin → hommes de main (payer 20 po ou négocier) → cour → Rouquin (combat : pas de levier) → grenier (fouille) → retour à Aubin. Il demande de **chercher** (le moulin, la clé), de **parler** (Aubin, l'homme de main) et de **se battre** (Rouquin).

## K. Ce que V6 demande ensuite

Après ton oui : (1) des agents Haiku écrivent les textes (pilote de 4 d'abord) ; (2) j'assemble les fichiers JSON (`pnj/`, `objets/`, `tresors/`, `pieges/`, `rencontres/`, `faits/`, `evenements-choix/`) ; (3) audit, `pnpm monde valider`, puis présentation du village écrit. Les zones du moulin et du Pont-Cassé suivent, séparément.
