# Audit de canon : La Marche d'Ombrefiel (BIBLE.md + monde.json)

Périmètre : `crpg-llm\packages\mondes\marche-d-ombrefiel\BIBLE.md` (276 lignes, version relue à 11:56) et `monde.json` (75 lignes). Lecture seule.

Bases des références :
- **C** = `crpg-llm\packages\mondes\marche-d-ombrefiel\` (BIBLE.md:n, monde.json:n)
- **O** = `D&D\la-marche-d-ombrefiel\` (origine, lecture seule)
- **Aud** = `crpg-llm\docs\AUDIT-MARCHE-D-OMBREFIEL.md`
- **Ren** = `crpg-llm\docs\RENOMMAGE-MARCHE-D-OMBREFIEL.md`

Note : BIBLE.md a été modifié pendant l'audit (mtime 11:53:20). La seule différence relevée entre ma première lecture et la version relue porte sur la ligne 83 (« ex « Poing d'Émeraude » » supprimé). Le rapport porte sur la version relue.

## (a) Verdict

**NON CONFORME.** Sept anomalies bloquantes (violations de règles explicites du cahier) et plusieurs écarts à l'origine. Les décisions de l'utilisateur (univers original, arme ébréchée, rêves sans pouvoir, PX calculés, compagnons non jouables, monde à part) sont respectées. Aucun nom interdit n'apparaît.

## (b) Anomalies

Gravité : **bloquante** = viole une règle explicite du cahier (secret, chaîne des indices, ids, FP moteur) ; **à corriger** = écart à l'origine non marqué ✚ ou incohérence interne ; **remarque** = point à trancher ou à expliciter.

### Bloquantes

| # | Gravité | Fichier:ligne | Ce qui est écrit | Source qui contredit | Correction proposée |
|---|---|---|---|---|---|
| B1 | bloquante | monde.json:6 (resume, texte joueur) | « …jusqu'à ceux qui préparent, à l'Échéance du Conseil, un coup d'État. » | Règle monde.json:65 (« Le MJ ne révèle jamais… le plan du putsch avant que le groupe ait découvert les faits »). Le plan est secret : BIBLE.md:23 et §2 « secret, révélé par morceaux ». | Retirer « un coup d'État » du resume ; dire seulement que quelqu'un prépare une manœuvre à l'Échéance. Vérifier aussi monde.json:7 (accroche « une guerre qui rapporte », voir R11). |
| B2 | bloquante | BIBLE.md:24 (§2) vs BIBLE.md:131 (§7) | §2 : Harken est « l'ingénieur nain qui avait compris ». §7 : `harken` = « Contremaître prisonnier ». | Même PNJ, deux rôles (règle 2). Origine : `data/quests.json:86` « Contremaître Harken » ; `zones/zone-2-mines-sombreval/fiches-pnj-et-conteneurs.md:118` « Ancien ingénieur en chef des mines royales ». | Choisir un rôle unique, par exemple « ancien ingénieur en chef, prisonnier », et l'appliquer aux deux lignes. |
| B3 | bloquante | BIBLE.md:35 (table « Qui sait quoi », Silas) | Fait central `f-griffe-noire-camp-foret`. | Absent du registre des faits BIBLE.md:170 (règle 2 : chaque fait cité doit être au registre §7). | Ajouter `f-griffe-noire-camp-foret` au registre l.170 (ou changer l'id cité). |
| B4 | bloquante | BIBLE.md:213 (§7 bis, « Marteau du Brise-Roc ») | Objet cité comme indice, sans id. | Absent de la liste « Objets clés » BIBLE.md:141-153 (règle 2 : tout objet cité doit être au registre). | Ajouter `marteau-du-brise-roc` (Z2, autel nain submergé) à la table des objets. |
| B5 | bloquante | BIBLE.md:211 (§7 bis, « Journal de Davor / piste du fer pur ») | Source = « trois sources : coffre de Davor, dépouille de Davor, témoignage de Korgan », puis, dans la colonne « Remplace », « Source unique **optionnelle** (supprimée) ». | Règle d'en-tête BIBLE.md:203 : une seule source par indice. La ligne se contredit elle-même. Origine : `zones/zone-2-mines-sombreval/liens-inter-zones.md:16` (la piste vient de la correspondance personnelle) ; Aud §6 (coffre C-2.4 optionnel). | Garder une seule source explicite (par exemple le coffre de Davor) et réécrire la colonne « Remplace » sans ambiguïté. Vérifier que `journal-de-davor` (BIBLE.md:147) reste cohérent. |
| B6 | bloquante | BIBLE.md:214 (§7 bis, mot de passe de Mère Margot) | « Z2 : Greta… le confie à qui a retrouvé Elian (Z3) ». | Règle 3 : un fait ne doit pas être révélé avant la zone qui le produit. Elian n'est trouvé qu'en Z3 (BIBLE.md:183) et la quête ne ramène pas le groupe à Sombreval. Greta est en Z2. | Déplacer la source en Z3 (Elian ou Aeloria, à l'Arbre-Vigie), ou ajouter explicitement un retour à Sombreval dans la quête. |
| B7 | bloquante | BIBLE.md:246 (§9, Z1, Keldan) | « Keldan : `acolyte` ou `fanatique-de-secte` ». | Règle 5 : niveau 1, FP ≤ 1. `fanatique-de-secte` est FP 2 (`packages\donnees\srd\monstres\fanatique-de-secte.json`, champ `"fp": "2"`). `acolyte` est FP 1/4. | Retirer `fanatique-de-secte` de la liste Z1 ; ne garder que `acolyte`. |

### À corriger

| # | Gravité | Fichier:ligne | Ce qui est écrit | Source qui contredit | Correction proposée |
|---|---|---|---|---|---|
| C1 | à corriger | BIBLE.md:19 (§2, origine du Masque) | « descend dans un sanctuaire scellé sous le palais ducal… ». La note ✚ ajoute que l'origine « le dit seulement « possédé » ». Sont aussi écrits « le masque lui murmure ce qu'il craignait déjà », « le Conseil est vénal » (non ✚). | `O\zones\zone-6-cite-haute-garde\fiches-pnj-et-conteneurs.md:13` : Valerius est « possédé et transformé par le Masque d'Onyx trouvé dans les catacombes de Cormyr ». Le lieu n'est donc pas un sanctuaire sous le palais, et la note ✚ est inexacte. La phrase sur le murmure n'a pas de source trouvée dans O. | Rétablir « catacombes » (d'Aurevaux) ou marquer ✚ le changement de lieu. Corriger la note ✚. Marquer ✚ « le masque murmure » et « Conseil vénal » s'ils sont conservés. |
| C2 | à corriger | BIBLE.md:57 (§3, fin 2) | Coût : « des centaines de morts, le Grand Duc diminué ». | `O\zones\zone-6-cite-haute-garde\liens-inter-zones.md:59-61` : « Le Grand Duc survit mais la cité est partiellement incendiée ». Aucun chiffre de morts, aucun affaiblissement du Grand Duc. Non ✚. | Retirer les deux ajouts, ou les marquer ✚ comme arbitrage. |
| C3 | à corriger | BIBLE.md:56 (§3, fin 1, coût) | « le Conseil oligarchique est rétabli, intact et corrompu, jusqu'à la prochaine crise » (non ✚ ; seul « Valerius meurt… ✚ » est marqué). | `O\zones\zone-6-cite-haute-garde\liens-inter-zones.md:56` : résultat = « la paix est restaurée, le cartel est dissous, les héros sont anoblis ». Aucun coût de ce type. | Marquer ✚ l'intégralité du coût, ou le retirer. |
| C4 | à corriger | BIBLE.md:96-101 (§6, peuples) | Gnome (l.96), Halfelin « Brog » (l.97), Goliath (l.98), Drakéide (l.99), Tieffelin (l.101) ; tout §6 sans ✚. | Aucune occurrence de Gnome, Drakéide, Tieffelin, Halfelin dans O (grep). « Goliath » n'apparaît que comme nom de navet (`zones/zone-2.../rencontres-absurdes.md`). Brog est sans race (`zones/zone-3.../fiches-pnj-et-conteneurs.md:166`). Nain, elfe, demi-elfe et orc (rumeur, `O\zones\zone-6.../README.md:18`) sont sourcés. | Marquer ✚ tout le §6 comme arbitrage, ou retirer les espèces non sourcées. |
| C5 | à corriger | BIBLE.md:42 (§2, table, Elian/Corwin) | « Que Corwin est un ancien de la Garde ». | Aucune occurrence dans O (grep « Corwin… Garde »). | Marquer ✚ ou retirer. |
| C6 | à corriger | BIBLE.md:126 et :188 | Quête personnelle de Varek « attitude 40 ». | Aucun seuil de 40 dans O. `O\data\quests.json:13-17` (q-1-2) sans seuil ; Aud §7 et §8.6 sans chiffre. | Marquer ✚ le seuil, ou le retirer. |
| C7 | à corriger | BIBLE.md:87 (§5) | Faction `heritiers-de-vaelen` (« Les Héritiers de Vaelen »), sans ✚. | Aucune occurrence dans O (« Héritiers » absent). Les factions d'origine sont trois blocs plus le Chef Masqué (`O\factions-et-forces.md`). | Marquer ✚ l'ajout de faction, ou la retirer. |
| C8 | à corriger | BIBLE.md:82 (§5) | `directeur-severus` = « (façade) » du Lion d'Acier. | `O\factions-et-forces.md:14` : Valerius est la « Tête Politique & Occulte » et l'« architecte suprême ». Sévérus est seulement grand argentier (l.16). | Marquer ✚ l'arbitrage, ou ne présenter Sévérus que comme argentier. |
| C9 | à corriger | BIBLE.md:176 vs :180-181 (§7 quêtes) | Règle « Une quête principale par zone » ; la table en liste deux pour Z1 (`q-la-securite-du-relais` l.180 et `q-l-echantillon-maudit` l.181). | `O\data\quests.json:4-33` : q-1-1 et q-1-4 sont toutes deux « principale ». | Requalifier `q-l-echantillon-maudit` en secondaire (ou préciser la règle : une principale par zone et une quête liée). |
| C10 | à corriger | BIBLE.md:11 (§1) | « l'unique voie qui monte vers Haute-Garde est coupée par les péages illégaux du Lion d'Acier ». | Contredit par BIBLE.md:119 (Route militaire des Crêtes, 18 km, vers Haute-Garde) et `O\zones\zone-5-ruines-tour-onyx\liens-inter-zones.md:29`. | Remplacer par « la voie la plus directe » ou « la Route du Roi ». |
| C11 | à corriger | BIBLE.md:65-70 (§4, Échéance) | Départ 0 ; paliers « Couverture maintenue 1 à 3 », etc. La valeur 0 n'est dans aucun palier. | `O\zones\zone-6-cite-haute-garde\README.md:43` : l'ITU commence à 1 (« ITU 1 à 3 »). | Ajouter 0 au palier « Couverture » (0 à 3) ou partir de 1. |
| C12 | à corriger | BIBLE.md:66 (§4 baisse) et BIBLE.md:272 (salutations) | Baisses « registres remis au Sergent Brand (−1) », « coffre de Sévérus vidé (−1) » ; salutations selon « l'or de Martha », « le mot de passe », « les registres », « Elian ». | Aucun de ces drapeaux dans le registre (BIBLE.md:159-167, qui ne liste que `z6-conseil-convoque` et `z6-vane-destitue` en Z6). Règle 2 : la jauge doit être cohérente avec les drapeaux. | Ajouter au registre les drapeaux lus (`z6-registres-remis`, `z6-coffre-severus-vide`, `z1-or-martha-rendu`, `z2-mot-de-passe-confie`, `z3-elian-retrouve`, etc.) avec leur zone de pose. |
| C13 | à corriger | BIBLE.md:268 (§10, Pertes) | « Elian (embuscade) ». | Aucune embuscade ou mort d'Elian dans O (grep). Elian est meneur des Veilleurs (`O\zones\zone-3.../fiches-pnj-et-conteneurs.md:94-95`). Non ✚. | Marquer ✚ ou retirer. |
| C14 | à corriger | BIBLE.md:145-153 (§7 objets insolites) | `dague-langue-d-acier`, `bottes-de-saut-du-gobelin`, `chope-inepuisable` posés en « Z1 (Tertre, carrière, caches) », sans ✚. | Aud §5 : ces objets ne sont placés dans aucune zone d'origine (`systeme-reves-et-objets-insolites.md` seul). | Marquer ✚ la décision de placement. |

### Remarques

| # | Gravité | Fichier:ligne | Ce qui est écrit | Source ou remarque | Correction proposée |
|---|---|---|---|---|---|
| R1 | remarque | BIBLE.md:9, :23 ; monde.json:6 | « les lames éclatent au premier choc » ; « ses épées voler en éclats ». | Décision 3 (Aud §8.3) : arme **ébréchée**, pas détruite. Le vocabulaire d'éclats suggère la destruction. | Harmoniser le vocabulaire narratif avec l'ébréchure. |
| R2 | remarque | monde.json:66 ; BIBLE.md:21 | Immunité : bronze antique et magique. | `O\piliers-et-regles.md:14-15` ajoute fer météorique et acier nain ouvragé. La simplification n'est pas marquée. | Marquer ✚ ou assumer dans la règle. |
| R3 | remarque | BIBLE.md:84 (§5, Griffe Noire) | « punir les convois du Lion ». | `O\factions-et-forces.md:36` : embuscades visant les convois de minerai brut et les détachements militaires. | Préciser « convois de minerai ». |
| R4 | remarque | BIBLE.md:135 (Malakar, « Archimage ») | « Archimage ». | `O\zones\zone-5...\fiches-pnj-et-conteneurs.md:13` : « Alchimiste en chef, sorcier ». | Accepter comme choix, ou harmoniser. |
| R5 | remarque | BIBLE.md:227 (Sévérus en Z2 et Z4) | Sévérus apparaît dans les pots-de-vin de Z2 et les registres de Z4. ✚ (arbitrage) | Sévérus n'apparaît dans aucun fichier de Z2 ou Z4 d'O (grep). L'ajout est assumé, mais il reste à écrire dans les zones. | Noter dans le plan V6 la production de ces traces. |
| R6 | remarque | BIBLE.md:250 et :251 (§9) | `vouivre` (FP 6) en Z5 ; `mage` (FP 6) pour Malakar en Z5. | FP 6 pour quatre héros de niveau 5 est un combat mortel. La vouivre est marquée « option évitable », pas Malakar. | Trancher : FP 6 pour Malakar au climax, ou FP 5 (`golem-de-chair`, `gladiateur`). |
| R7 | remarque | BIBLE.md:240 (§8) | « fiches d'origine (4 900 et 5 950) ». | `O\INDEX.md:67` annonce Z5 à 4 200 XP. 4 900 vient de l'addition des lignes (Aud §3.2). | Préciser la source du chiffre 4 900. |
| R8 | remarque | BIBLE.md:56-59 (§3) | Ids de fins `f-fin-triomphe`, `f-fin-revolution`, `f-fin-masque`, `f-fin-echec` absents du registre (BIBLE.md:170). | Règle 2 : tous les ids doivent être au registre. | Ajouter une ligne « Fins » au registre. |
| R9 | remarque | BIBLE.md:221 (§7 bis, « FEROX ») | « FEROX (devise de la Compagnie) ». | `O\factions-et-forces.md:8` : la devise est « L'Ordre par le Commerce, la Prospérité par la Force ». La devise FEROX n'est pas sourcée. (Le bloc §7 bis est ✚.) | Confirmer ou corriger. |
| R10 | remarque | BIBLE.md:209 (§7 bis, registre de convoi, « signature de Vane ») | Signature de Vane. | `O\zones\zone-1...\liens-inter-zones.md:82` parle de « paiements en or » de Vane, pas d'une signature sur le registre. (Bloc ✚.) | Confirmer. |
| R11 | remarque | monde.json:7 (accroche) | « quelqu'un prépare une guerre qui rapporte ». | Pitch MJ `O\INDEX.md:88`. Indice sur le mobile lucratif : plus léger que B1 mais à valider. | Valider avec l'utilisateur. |
| R12 | remarque | monde.json:49-62 (`chapitres[0].quetes: []`, l.61) | Le chapitre unique n'a aucune quête alors que §7 en compte sept. | BIBLE.md:174-186. | Renseigner les quêtes principales dans le chapitre. |
| R13 | remarque | BIBLE.md:119 (trajets) | « Aldric → Haute-Garde 35 km (Route du Roi, nord) ». | Contradiction d'origine : `O\zones\zone-6...\README.md:7` dit « 35 km à l'ouest » ; `O\zones\zone-1...\liens-inter-zones.md:11,46` dit « nord ». La bible tranche sans le signaler. | Ajouter la mention « tranché » dans §7 trajets. |
| R14 | remarque | BIBLE.md:255-276 (§10) | Pertes possibles (Harken, Torbjorn, Brand, Demi-Dent, Sévérus, Kromar, Barthélemy) et « la moitié ferment une porte ». | Décisions de design sans ✚ ; formulation de l'horloge floue. | Marquer ✚ et préciser. |

## (c) Contrôles vérifiés sans écart

- **Noms interdits** : aucun dans BIBLE.md ni monde.json (grep de la liste complète, accents compris, et « cormyrien »). Renommages appliqués (Aurevaux, Clairmont, Côte Âpre, Mer Grise, Aubéris, Hazelle absent, Garde d'Émeraude, Vieux Bourru, Garde-robe du Chambellan), conformes à `Ren`.
- **Ids** : aucun id de registre avec majuscule, accent ou espace ; les lieux portent ald-/som-/mur-/vsa-/ony-/hau- ; aucun PNJ ne porte de préfixe de zone.
- **Six zones × six lieux** : chaque zone a six lieux dans §7 et un repos sûr (marqué ✚) ; une quête principale par zone : voir C9 pour Z1.
- **Monstres §9** : les 36 ids cités existent comme fichiers dans `packages\donnees\srd\monstres\` ; aucun monstre propre à l'histoire. FP : Z2 à Z4 plausibles pour leur niveau (voir R6 pour Z5).
- **Faits (§7)** : les 17 `f-…` du registre sont tous cités dans « Qui sait quoi » (sauf l'inverse de B3, à savoir `f-griffe-noire-camp-foret` cité mais non enregistré).
- **Trajets et durées** : 15 km / ≈ 5 h (Piste de Sombreval, ouest) = `O\zones\zone-1\liens-inter-zones.md:29-30` ; 35 km = `O\zones\zone-1\liens-inter-zones.md:46` ; 1 200 marches / ≈ 3 h = `O\zones\zone-5\liens-inter-zones.md:25` ; 18 km = `O\zones\zone-5\liens-inter-zones.md:29` ; 45 min en wyverne = `O\zones\zone-5\liens-inter-zones.md:30`.
- **PX §8** : 300 / 900 / 2 700 / 6 500 / 14 000 / 23 000 = seuils SRD ; conforme à Aud §8.5. Aucun XP écrit à la main, aucune mention de « jalon » (décision 5 respectée).
- **Fins** : Triomphe (trois preuves, Hildegarde et Torbjorn témoins, 7 voix sur 12, anoblissement, cartel dissous) = `O\zones\zone-6\liens-inter-zones.md:54-56` et `O\zones\zone-6\actions-interactives.md:118` ; Chute = `liens-inter-zones.md:62-64` ; rêve 6B « Le Trône des Cendres » = `O\systeme-reves-et-objets-insolites.md:207` ; fin 3 (ajout) marquée ✚.
- **ITU** : paliers 1-3, 4-6, 7-9, 10 et leurs effets = `O\zones\zone-6\README.md:43-46`, conformes (sauf C11 pour 0).
- **Personnages et rôles** : Vane, Valerius, Sévérus, Malakar, Kaelen, Kromar, Darek, Morga, Ssarkath, Torbjorn, Korgan, Hildegarde, Brand, Margot, Martha, Demi-Dent, Grrrak, Durn, Davor, Brog (passeur), Greta (aubergiste) : rôles conformes à `O\factions-et-forces.md`, `O\zones\...\fiches-pnj-et-conteneurs.md`, `O\data\quests.json`.
- **Quêtes et donneurs** : donneurs de §7 conformes à `O\data\quests.json` ou remplacés et marqués ✚ (Intrigue Principale). Pas de donneur « Coffre » ou « Intrigue » restant.
- **Chaîne des indices** : sources uniques pour Échantillon (Z1, forge), Ordre de Keldan (Z1), Registre de convoi (Z1), Flacons (Z2), Missive (Z3, seule source), Lingots, Manifeste, Notes de Darek, Correspondance Vane-Darek (Z4), Laissez-passer (Z5), Sceau FEROX (Z5), Ordre de déploiement (Z5, seul emplacement), Bague (Z5). Aucun indice de Z6 n'est sourcé après Z6 (sauf B6).
- **Échéance** : valeurs 0 à 10 ; paliers cohérents entre §4, §10 (quatre paliers) et §3 (fins 2 et 4 à 10). Voir C11, C12.
- **Décisions 3 à 7** : arme ébréchée et immunités (monde.json:66) ; rêves sans pouvoir (BIBLE.md:76 et monde.json:69) ; PX calculés (§8) ; compagnons qui voyagent (BIBLE.md:126-127), aucun compagnon jouable ; monde à part (aucune mention d'Ombresang dans BIBLE.md ni monde.json).
- **Secrets dans monde.json** : `depart.intro` ne révèle ni Valerius, ni le Lion, ni le Chef Masqué, ni la toxine. `resume` et `accroche` : seul le « coup d'État » est retenu (B1, R11).
- **Joute** : « au moins 4 preuves » ramené à 3 et marqué ✚ (BIBLE.md:225, :7 bis), conformément à `Aud` §3.3.
- **Dilemmes** : un dilemme majeur par zone (BIBLE.md:257-266), marqués ✚.

Non vérifié (faute de source explicite dans O) : colonne « Cache » de §2 (BIBLE.md:33-50), en particulier « Qu'il a ouvert les cuves de lui-même » (Korgan), « Brand sait que son glaive se fendille », « Malakar veut le codex de Vaelen », « Où est le marteau de son père » (Harken). Et l'action de l'esprit de Vaelen qui « révèle la faille de l'alambic » (BIBLE.md:27) : `O\zones\zone-5\actions-interactives.md` contient un dialogue avec le fantôme, non lu en entier. À relire.

Rapport écrit : audit-canon.md
Verdict : NON CONFORME (7 bloquantes : B1 à B7 ; 14 à corriger ; 14 remarques).
