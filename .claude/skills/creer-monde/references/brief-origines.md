# Mission : le monde réagit aux origines des héros (La Citadelle des Marées)

> **Exemple réel, tiré de La Citadelle des Marées.** Pour un autre monde, garde la structure, les règles et le format ; remplace l'id du monde, les noms, les identifiants et les listes (examens, questions, PNJ, lieux…) par ceux de ton monde, tirés du canon et de l'atlas. `<dossier temporaire de la session>` est le dossier temporaire (scratchpad) de la session en cours. Tous les chemins sont relatifs à la racine du dépôt.

Monde : `packages/regles/tests/fixtures/mondes/citadelle-des-marees/`. Lis `BIBLE.md` (canon et secrets), `CANON-PERSONNAGES.md`, les fiches `pnj/*.json` concernées et les `examens/z9-*.json`. Pas de commit ; n'écris que ton fichier (chemin donné dans ta mission). Français soigné, ton du monde (mélancolique, maritime, sobre, humour sec rare). Rapport final court.

## Le principe
Le joueur compose son groupe de six héros : chacun a une **espèce** (`nain`, `elfe`, `gnome`, `goliath`, `halfelin`, `humain`, `orc`, `tieffelin`, `drakeide`), une **classe** (`barbare`, `barde`, `clerc`, `druide`, `ensorceleur`, `guerrier`, `magicien`, `moine`, `occultiste`, `paladin`, `rodeur`, `roublard`) et un **historique** (`acolyte`, `criminel`, `sage`, `soldat`). Le monde doit **s'en apercevoir** : un nain juge un ouvrage de pierre, un roublard voit où le livre de comptes est truqué, une elfe entend ce qu'on ne dit pas. Ces réactions sont de la **couleur** : elles montrent un œil, un savoir-faire, une façon d'être regardé ; elles **ne révèlent aucun secret, aucun fait d'intrigue, aucune solution d'énigme**, et ne contredisent rien du canon. Elles ne disent jamais qu'un héros « est » telle personne : seulement ce qu'il remarque ou comment on le reçoit. Une condition s'écrit `{ "heros": { "espece": "nain" } }` (ou `classe`, ou `historique`, ou plusieurs ensemble : alors le **même** héros doit avoir tout). Ids exacts, en minuscules et sans accent.

---

## Mission A — Regards d'origine sur les examens (fichier `<dossier temporaire de la session>/regards.json`)
Un objet `{ "<id d'examen>": [ { "condition": {…}, "texte": "…" } ] }`. Chaque `texte` : **une phrase, 15 à 35 mots**, qui s'ajoute **après** le texte de l'examen (relis-le : n'en répète aucun détail, apporte ce que cet œil remarque **en plus**, un détail concret et plausible : une technique, un défaut, une habitude, une odeur ; ne change pas ce que l'examen affirme). Écris à la 3ᵉ personne neutre ou avec « l'un de vous » : on ne sait pas quel héros parle.
À écrire (exactement ces examens et ces conditions) :
1. `exa-girouette` : espèce `nain` (le bronze, la fonte) ; historique `sage` (un motif héraldique ou savant, pas un ornement).
2. `exa-poutres-du-refectoire` : historique `soldat` (les entailles comme un registre de garde) ; classe `rodeur` (le bois, l'âge de la fumée).
3. `exa-registre-des-comptes` : historique `criminel` (l'œil qui flaire une ligne arrangée) ; classe `roublard`.
4. `exa-carte-des-marees` : historique `sage` ; espèce `gnome` (la précision du trait).
5. `exa-lentille-voilee` : classe `magicien` ; espèce `gnome`.
6. `exa-barreaux-de-la-grille` : classe `roublard` (le fer poli par des mains, pas par l'eau) ; classe `rodeur` (les traces).
7. `exa-coque-de-la-perle-grise` : classe `rodeur` ; espèce `goliath`.
8. `exa-borne-du-pont` : historique `sage` ; espèce `nain` (le travail de la pierre).
9. `exa-tombes-sans-terre` : classe `clerc` ; historique `acolyte`.
10. `exa-porte-du-phare-du-port` : classe `roublard` (la serrure) ; espèce `nain` (la forge de la chaîne).
11. `exa-chaise-d-enfant` : classe `barde` (la nacre, le rang) ; historique `acolyte`.
12. `exa-pas-du-sanctuaire` : classe `clerc` ; espèce `elfe`.
(Au plus **deux** regards par examen ; tu en écris donc 24.)

---

## Mission B — Salutations d'origine (fichier `<dossier temporaire de la session>/salutations-origines.json`)
Un objet `{ "<id pnj>": [ { "condition": {…}, "texte": "…" } ] }`. La **salutation** est ce que le PNJ dit et fait en voyant le groupe (voir `salutations.neutre` et les `variantes` de sa fiche : même registre, narration brève puis une réplique entre « » ; **25 à 50 mots**). Ici, il **réagit à un héros du groupe** (espèce, classe ou historique) : un mot, un regard, un geste qui montre qu'il l'a remarqué, **dans sa voix** et selon ses opinions (relis sa fiche : désir, peur, défaut). Ne révèle rien qu'il tait ; ne change pas son attitude (ce sont des mots, pas des effets). Plusieurs conditions possibles par PNJ ; elles seront évaluées **dans l'ordre** après les variantes de l'histoire, la première vraie l'emporte : mets la plus **précise** en premier.
À écrire :
- `mere-sorel-quaibas` (tieffelin, cheffe des Rats) : espèce `tieffelin` ; historique `criminel`.
- `joss-la-rame` (orc, passeur) : espèce `orc` ; historique `soldat`.
- `gudrun-lanterne` (nain, fanalière) : espèce `nain` ; espèce `gnome`.
- `por-hennequin-lacet` (nain, charpentier de marine) : espèce `nain` ; classe `guerrier`.
- `prieur-anselme-vareuil` (humain, Prieur) : classe `clerc` ; classe `paladin`.
- `ysmene-hautecote` (humaine, cartographe) : classe `magicien` ; historique `sage`.
- `aldous-lindenvert` (gnome, copiste) : espèce `gnome` ; historique `sage`.
- `bertrane-mijotee` (halfeline, cuisinière) : espèce `halfelin` ; classe `barde`.
- `corentin-brumevoile` (goliath, pêcheur) : espèce `goliath` ; classe `barbare`.
- `por-ambroise-carene` (elfe, pilote) : espèce `elfe` ; classe `rodeur`.
(Ces PNJ ne sont pas forcément au même endroit que le groupe : c'est une salutation de rencontre, pas un événement.)
