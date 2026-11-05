// Ce que le conteur reçoit. Un préfixe fixe, mis en cache (rôle, règles, monde, bible) ; à chaque tour, une fiche de
// scène compacte construite par le moteur, et le compte rendu de chaque outil appelé. Le conteur n'a jamais le monde
// entier : il consulte ce qu'il lui faut par la fiche de scène et par les outils.
import { equipementDe } from '../personnage';
import type { DonneesMonde } from '../monde/schemas';
import type { FicheScene } from '../monde/scene';
import { objetDe } from '../modules/catalogue';
import type { Interlocuteur } from '../modules/dialogue';
import { objetsPortes } from '../modules/equipement-regles';
import type { Moteur } from '../noyau/moteur';
import type { EvenementJeu, Partie } from '../noyau/types';

/** Le préfixe fixe de la conversation : le même pour toute la partie. */
export function promptSysteme(monde: DonneesMonde, bible: string): string {
  return `Tu es le conteur de « La Table du Conteur » : tu fais vivre, tour après tour, l'aventure d'un groupe de six héros dans le monde décrit plus bas. Les règles du jeu sont l'arbitre ; toi, tu racontes. **Le joueur ne doit jamais entendre parler de la machine** (voir la règle 9).

# Règles

1. **Tu ne décides jamais du résultat d'une action.** Pour toute action du groupe (aller quelque part, fouiller, ouvrir, parler, persuader, se reposer, lancer un sort, équiper…), tu appelles l'outil correspondant : les dés sont lancés avec les vraies fiches et la réponse te revient. Tu racontes ce qu'elle dit, ni plus, ni moins. Une impossibilité est un fait du monde (« la porte est verrouillée », « ils ont déjà retourné ce coin de fond en comble, il faudra patienter ») : raconte-la comme telle, ne la contourne pas.
2. **Le joueur écrit ce que font les héros.** Traduis-le en appels d'outils (un ou plusieurs). Pour une action que rien ne couvre (escalader, se souvenir…), utilise \`testLibre\` ; pour une simple parole ou une idée sans enjeu, réponds sans outil.
3. **Aucun secret avant l'heure.** Tu connais la bible : elle t'oriente, elle ne se raconte pas d'avance. Ne donne jamais un DD tenu secret (fouille, secrets des PNJ), la solution d'une énigme, la vérité d'une rumeur ni un fait qui n'a pas encore été révélé au groupe.
4. **Le joueur voit déjà ce que les outils te rendent** : les textes de l'auteur (« Texte de l'auteur »), les jets, les constats et les faits appris. Ne les répète pas, ne les résume pas, ne les paraphrase pas. Ajoute ce qu'ils ne disent pas : gestes, regards, ambiance, réaction des héros. Quand un PNJ vient de répondre par un texte de l'auteur, ne redis pas sa réponse : montre comment elle est dite et ce qu'elle provoque.
5. **N'invente rien qui compte.** Aucun objet trouvé, aucune information, aucun passage, aucune issue, aucun nom que les outils ou la fiche de scène n'ont pas donnés. Si la fouille ne donne rien, il n'y a rien : décris l'absence, pas une trouvaille. Tu peux inventer du décor et des gestes, jamais des faits ni du contenu utile ; les paroles d'un PNJ viennent du texte de l'auteur ou du sujet que le joueur a abordé : n'ajoute pas de réplique qui donne un ordre, un avertissement ou une information. Tu ne peux pas donner d'objet ou de pièces, changer l'attitude d'un PNJ sans jet, ouvrir ce qui est fermé sans clé ni jet, faire réussir un jet, ressusciter un mort, ni lancer un combat toi-même : si une action déclenche une rencontre, le compte rendu le dit, et tu racontes le début de la scène.
6. **Style** : français, au présent, 50 à 100 mots (jamais plus de 120), ton sombre et mélancolique, concret et sensoriel, sans liste ni titre. Tu t'adresses au groupe (« vous »). Les PNJ parlent à la première personne, avec leur caractère. Termine toujours par une situation ouverte, jamais par une question au joueur.
7. **Fin de tour** : écris d'abord ta narration (ton dernier message de texte), puis appelle \`proposer_actions\` avec 2 à 4 actions courtes et utiles maintenant.
8. Les héros ont des identifiants (voir la fiche de scène) ; passe-les dans \`personnage\` quand le joueur désigne un héros. Sans précision, laisse le jeu choisir le plus apte.
9. **Jamais de vocabulaire de machine dans ta narration.** N'écris jamais « moteur », « arbitre », « outil », « système », « règles du jeu », « IA », « modèle », « refus », « DD », « jet de dés » ni rien qui montre les coulisses : le joueur est dans l'histoire. Tout ce qui est impossible ou refusé se raconte **dans la fiction** (le groupe a déjà fouillé : « vous avez retourné ce bassin de fond en comble, il faudra laisser passer une nuit » ; une porte fermée : « le battant ne bouge pas »). Ne dis jamais que quelque chose est « refusé », « interdit » ou « impossible » par le jeu.

# Le monde

${JSON.stringify(monde.monde)}

# Bible du monde (canon, réservée au conteur)

${bible}`;
}

const signe = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** Un événement en phrase pour le conteur (rien pour ce qui ne le concerne pas). */
function enPhrase(dm: DonneesMonde, e: EvenementJeu): string | undefined {
  switch (e.type) {
    case 'jet': {
      const j = e.jet;
      return `Jet : ${j.nom}, ${j.test} ${j.total} (d20 ${j.des.join('/')} ${signe(j.bonus)})${j.ddSecret ? (j.reussite ? ' → il trouve quelque chose' : ' → rien') : ` contre DD ${j.dd} → ${j.reussite ? 'réussi' : 'raté'}`}.`;
    }
    case 'texte':
      return `Texte de l'auteur${e.voix ? ` (${e.voix} parle)` : ''}, déjà montré au joueur : « ${e.texte} »`;
    case 'constat':
      return `Constat : ${e.texte}`;
    case 'faitAppris': {
      const f = dm.faits.get(e.fait);
      return f?.fiable ? `Le groupe apprend : ${f.texte}` : `Le groupe entend une rumeur (dont le texte reste secret).`;
    }
    case 'arrivee':
    case 'deplacement':
      return `Le groupe est à : ${dm.lieux.get(e.type === 'arrivee' ? e.lieu : e.vers)?.nom ?? '?'}.`;
    case 'sceneChange': {
      const s = e.scene;
      if (s.type === 'rencontre')
        return `Une rencontre commence : ${dm.rencontres.get(s.rencontre)?.nom ?? s.rencontre}. Le joueur choisira de combattre, de tenter une alternative ou de se replier : raconte le début de la scène.`;
      if (s.type === 'dialogue') return `Le groupe est en conversation avec ${dm.pnj.get(s.pnj)?.nom ?? s.pnj}.`;
      return undefined;
    }
    case 'fin':
      return `FIN DE L'HISTOIRE : ${dm.fins.get(e.fin)?.nom ?? e.fin}. Raconte l'épilogue.`;
    case 'queteMiseAJour':
      return `Quête « ${dm.quetes.get(e.quete)?.nom ?? e.quete} » : ${e.statut}${e.nouvelle ? ' (nouvelle)' : ''}.`;
    default:
      return undefined;
  }
}

/** Le compte rendu d'un outil : ce qui s'est passé, en phrases. */
export function evenementsEnTexte(dm: DonneesMonde, evenements: EvenementJeu[]): string {
  const lignes = evenements.map((e) => enPhrase(dm, e)).filter((x): x is string => !!x);
  return lignes.length ? lignes.join('\n') : "Fait. Rien de plus à raconter.";
}

/** La fiche de scène du tour : ce que le groupe voit, sait et porte. */
export function ficheDeTour(moteur: Moteur, partie: Partie): string {
  const dm = moteur.ctx.dm;
  const f = moteur.vue<FicheScene>('scene', partie);
  const interlocuteur = moteur.vue<Interlocuteur | undefined>('interlocuteur', partie);
  const nom = (id: string) => objetDe(moteur.ctx, id).nom;
  const l: string[] = [];
  l.push(`## Lieu : ${f.lieu.nom} (${f.lieu.id}) — jour ${f.jour}`);
  l.push(f.lieu.description);
  if (f.lieu.ambiance) l.push(`Ambiance : ${f.lieu.ambiance}`);
  l.push(`Repos : ${f.lieu.repos === 'sur' ? 'sûr (on peut dormir une nuit)' : f.lieu.repos === 'impossible' ? 'impossible' : 'dangereux (une halte seulement, on ne dort pas ici)'}.`);
  if (f.sorties.length)
    l.push(
      `Sorties : ${f.sorties.map((s) => `${s.nom} [vers: ${s.vers}]${s.description ? ` (${s.description})` : ''}${s.etat !== 'libre' ? ` (${s.etat}${s.dd ? `, DD ${s.dd}` : ''})` : ''}`).join(' ; ')}`,
    );
  if (f.pnj.length) l.push(`Personnes ici : ${f.pnj.map((n) => `${n.nom} [id: ${n.id}], ${n.role}, attitude ${n.attitude}`).join(' ; ')}`);
  if (interlocuteur)
    l.push(
      `Conversation en cours avec ${interlocuteur.nom} [id: ${interlocuteur.id}] ; sujets possibles : ${interlocuteur.sujets.map((s) => `${s.id} (${s.mots.join(', ')})`).join(' ; ') || 'aucun'}.`,
    );
  if (f.tresors.length) l.push(`À portée de main : ${f.tresors.map((t) => `${t.nom} [id: ${t.id}] (${t.contenant}, ${t.etat})`).join(' ; ')}`);
  if (f.pieges.length) l.push(`Pièges repérés : ${f.pieges.map((p) => `${p.nom} [id: ${p.id}] (${p.etat})`).join(' ; ')}`);
  if (f.enigmes.filter((e) => e.etat !== 'resolue').length)
    l.push(
      `Énigmes : ${f.enigmes
        .filter((e) => e.etat !== 'resolue')
        .map((e) => `${e.nom} [id: ${e.id}] — ${e.enonce}`)
        .join(' ; ')}`,
    );
  if (f.quetes.length) l.push(`Quêtes en cours : ${f.quetes.map((q) => `${q.nom} (${q.etapes.join(' ; ')})`).join(' | ')}`);
  if (f.jauges.length) l.push(`Jauges : ${f.jauges.map((j) => `${j.nom} ${j.valeur}/${j.max}`).join(', ')}`);
  l.push('', '## Le groupe');
  for (const h of partie.groupe) {
    const portes = objetsPortes(equipementDe(h)).map(nom);
    l.push(
      `- ${h.nom} [id: ${h.id}], ${h.fiche.classe} niv. ${h.fiche.niveau}, PV ${h.pv}/${h.fiche.pvMax}, CA ${h.fiche.ca}${portes.length ? `, porte : ${portes.join(', ')}` : ''}`,
    );
  }
  l.push(`Sac : ${f.inventaire.map((o) => `${o.nom}${o.quantite > 1 ? ` ×${o.quantite}` : ''}`).join(', ') || 'vide'} ; ${f.pieces} po.`);
  if (partie.scene.type === 'rencontre')
    l.push(
      '',
      `**Une rencontre attend** : ${dm.rencontres.get(partie.scene.rencontre)?.nom ?? partie.scene.rencontre}. Le groupe ne peut rien faire d'autre que combattre, tenter une alternative ou se replier (boutons du joueur).`,
    );
  const recents = partie.journal
    .slice(-14)
    .map((e) => (e.type === 'recitConteur' ? `Conteur : ${e.texte}` : e.type === 'saisieJoueur' ? `Joueur : ${e.texte}` : enPhrase(dm, e)))
    .filter((x): x is string => !!x);
  if (recents.length) l.push('', '## Derniers événements', ...recents.slice(-8));
  return l.join('\n');
}
