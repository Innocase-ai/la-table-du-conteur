// Validation d'un monde : références, accessibilité, quêtes, énigmes, trésors, rencontres.
// Les erreurs rendent le monde injouable ; les avertissements signalent un manque de cohérence ou de richesse.
import { SEUILS_PX } from '../caracteristiques';
import { BUDGET_PX } from '../budget';
import type { Donnees } from '../donnees';
import { dilemmesDe, drapeauxDesDilemmes, effetsDuDilemme } from './dilemmes-donnees';
import { questionsDe } from './codex-donnees';
import { drapeauxDesEvenements, effetsDeLEvenement, evenementsChoixDe } from './evenements-choix-donnees';
import { examensDe } from './examens-donnees';
import { interjectionsDe } from './interjections-donnees';
import { diagnosticDeMessage, type Diagnostic } from './diagnostics';
import { refsCondition, refsEffet } from './references';
import { etatInitial, evaluerCondition } from './etat';
import type { Condition, DonneesMonde, EffetMonde } from './schemas';

export interface BilanMonde {
  erreurs: string[];
  avertissements: string[];
  /** Les mêmes messages rangés (code, gravité, entité visée), dans l'ordre où le validateur les produit. */
  diagnostics: Diagnostic[];
  stats: StatsMonde;
}

export interface StatsMonde {
  lieux: Record<string, number>;
  pnj: number;
  pnjAvecBoutique: number;
  compagnons: number;
  sujets: number;
  quetes: Record<string, number>;
  objetsUniques: number;
  tresors: number;
  valeurTresorsPo: number;
  rencontres: number;
  pieges: number;
  enigmes: number;
  faits: number;
  factions: number;
}

export { BUDGET_PX } from '../budget';

/** Une réponse de PNJ qui commence par « Il dit que », « Elle explique que »… : du style indirect, pas une parole (« Il dit : « … » » en est une). */
export const STYLE_INDIRECT = /^\s*(il|elle|ils|elles)\s+(dit|disent|explique|expliquent|raconte|racontent|demande|demandent|répond|répondent|repond|avoue|avouent|confie|confient|murmure|ajoute|admet|affirme|prévient|previent|propose|rappelle|jure|précise|précisent|souligne|insiste)\b(?!\s*[:«"“])/i;

/** Longueur d'un récit d'arrivée avant l'avis (la cible est de 60 à 150 mots). */
export const ARRIVEE_MOTS = { min: 40, max: 220 };

/** Les mots de la mécanique, qui n'ont rien à faire dans un texte que le joueur lit. */
export const MOTS_MECANIQUE = /\b(jauge|DD|jet de (dés|sauvegarde|perception)|points? de vie|PV|emplacements? de sort|test de)\b/;

/** Longueur minimale (en mots) d'une réponse de PNJ avant l'avis « le PNJ n'a pas de voix ». */
export const MOTS_REPONSE_MIN = 35;
/**
 * Les textes « secs » : le jeu se lit comme un RPG textuel, des textes courts sonnent pauvres. Cibles validées le 10/11/2026 (récit
 * d'arrivée 130-170 mots, réponse de PNJ 75-115, introduction de rencontre 70-110) ; l'avis ne se déclenche qu'en dessous de ces seuils.
 */
export const TEXTES_SECS = { arrivee: 110, reponse: 60, introRencontre: 60 };

/** Objectifs de richesse par chapitre (niveaux 1 à 5) : en dessous, le validateur avertit. */
export const MINIMA_PAR_CHAPITRE = {
  lieux: 30, pnj: 25, sujets: 75, marchands: 3, compagnons: 3, secondaires: 6, personnelles: 3, tresors: 25, objets: 10,
  enigmes: 3, pieges: 5, rencontres: 15, faits: 40, factions: 4, tables: 3, fins: 2,
};

const RAPPORT_RARETE_NIVEAU: Record<string, number> = { commun: 1, 'peu-commun': 1, rare: 5, 'tres-rare': 11, legendaire: 17 };

function compter(valeurs: string[]): Record<string, number> {
  const res: Record<string, number> = {};
  for (const v of valeurs) res[v] = (res[v] ?? 0) + 1;
  return res;
}

export function validerMonde(dm: DonneesMonde, srd: Donnees): BilanMonde {
  const erreurs: string[] = [];
  const avertissements: string[] = [];
  const diagnostics: Diagnostic[] = [];
  const err = (m: string) => (erreurs.push(m), diagnostics.push(diagnosticDeMessage(m, 'erreur')));
  const avis = (m: string) => (avertissements.push(m), diagnostics.push(diagnosticDeMessage(m, 'avis')));

  // Un « objet » peut être un objet du monde, du catalogue SRD, ou une arme ou armure du SRD (boutiques, butins, récompenses).
  const objetExiste = (id: string) => dm.objets.has(id) || srd.objets.has(id) || srd.armes.has(id) || srd.armures.has(id);
  const existe = (genre: string, id: string, extra?: string): boolean => {
    switch (genre) {
      case 'fait': return dm.faits.has(id);
      case 'quete': return dm.quetes.has(id);
      case 'etape': return !!dm.quetes.get(id)?.etapes.some((e) => e.id === extra);
      case 'faction': return dm.factions.has(id);
      case 'jauge': return dm.jauges.has(id);
      case 'objet': return objetExiste(id);
      case 'pnj': return dm.pnj.has(id);
      case 'lieu': return dm.lieux.has(id);
      case 'classe': return srd.classes.has(id);
      case 'espece': return srd.especes.has(id);
      case 'historique': return srd.historiques.has(id);
      case 'rencontre': return dm.rencontres.has(id);
      case 'fin': return dm.fins.has(id);
      case 'flag': return true; // un drapeau n'a pas de déclaration : il existe dès qu'on le pose
      default: return false;
    }
  };
  const verifierRef = (ou: string, genre: string, id: string, extra?: string) => {
    if (!existe(genre, id, extra)) err(`${ou} : ${genre} inconnu « ${id}${extra ? `/${extra}` : ''} ».`);
  };
  const cond = (ou: string, c: Condition | undefined) => c && refsCondition(c, (g, id, x) => verifierRef(ou, g, id, x));
  const effets = (ou: string, es: EffetMonde[] | undefined) => es?.forEach((e) => refsEffet(e, (g, id, x) => verifierRef(ou, g, id, x)));

  // --- Lieux : arbre et liens ---
  const racines = new Set<string>();
  for (const l of dm.lieux.values()) {
    const ou = `Lieu « ${l.id} »`;
    if (l.parent) verifierRef(ou, 'lieu', l.parent);
    else racines.add(l.id);
    let courant = l.parent;
    for (let i = 0; courant && i < 30; i++) courant = dm.lieux.get(courant)?.parent;
    if (courant) err(`${ou} : le parent forme une boucle.`);
    for (const lien of l.liens) {
      if (!lien.absent) verifierRef(`${ou}, lien`, 'lieu', lien.vers);
      if (lien.verrou?.cle) verifierRef(`${ou}, lien vers « ${lien.vers} » (clé)`, 'objet', lien.verrou.cle);
      cond(`${ou}, lien vers « ${lien.vers} »`, lien.condition);
    }
    for (const r of l.rencontres) {
      verifierRef(`${ou}, rencontre`, 'rencontre', r.id);
      cond(`${ou}, rencontre « ${r.id} »`, r.condition);
    }
    for (const f of l.faits) {
      verifierRef(`${ou}, fait`, 'fait', f.fait);
      cond(`${ou}, fait « ${f.fait} »`, f.decouverte.condition);
    }
    if (l.position && !l.parent) err(`${ou} : a une position sur la carte mais pas de parent (la position se lit sur la carte du parent).`);
  }
  // Deux frères posés au même endroit de la carte se cachent l'un l'autre.
  const placesSurCarte = new Map<string, string>();
  for (const l of dm.lieux.values()) {
    if (!l.position || !l.parent) continue;
    const cle = `${l.parent}@${Math.round(l.position.x)},${Math.round(l.position.y)}`;
    const autre = placesSurCarte.get(cle);
    if (autre) avis(`Carte : « ${l.id} » et « ${autre} » sont au même endroit de la carte de « ${l.parent} ».`);
    else placesSurCarte.set(cle, l.id);
  }
  verifierRef('Monde (départ)', 'lieu', dm.monde.depart.lieu);

  // Le joueur n'a pas de monde en 3D : c'est la phrase du passage qui lui dit où il va. Sans elle il ne lit rien avant d'y aller.
  const passagesSansTexte: string[] = [];
  let nbPassages = 0;
  for (const l of dm.lieux.values()) {
    for (const lien of l.liens) {
      nbPassages++;
      if (!lien.description?.trim()) passagesSansTexte.push(`${l.id} > ${lien.vers}`);
    }
  }
  if (passagesSansTexte.length)
    avis(`Passages : ${passagesSansTexte.length} sur ${nbPassages} n'ont pas de description (le joueur ne lit rien sous le bouton avant d'y aller) : ${passagesSansTexte.slice(0, 6).join(', ')}${passagesSansTexte.length > 6 ? '…' : ''}`);
  // On ne dort que dans un lieu sûr (`repos: "sur"`) : un monde sans lieu sûr ne laisserait jamais dormir, et un donjon sans refuge
  // oblige le groupe à en sortir pour passer la nuit.
  const sursDuMonde = [...dm.lieux.values()].filter((l) => l.repos === 'sur');
  if (!sursDuMonde.length) avis('Repos : aucun lieu sûr (repos « sur ») : le groupe ne pourra jamais dormir.');
  const sousLe = (id: string, racine: string): boolean => {
    for (let c = dm.lieux.get(id), i = 0; c && i < 30; c = c.parent ? dm.lieux.get(c.parent) : undefined, i++) if (c.id === racine) return true;
    return false;
  };
  for (const d of dm.lieux.values()) {
    if (d.type === 'donjon' && !sursDuMonde.some((s) => sousLe(s.id, d.id))) avis(`Repos : le donjon « ${d.id} » n'a aucun lieu sûr à l'intérieur (repos « sur ») : le groupe devra en sortir pour dormir.`);
  }

  // Chaque sujet de conversation a une « question » : le libellé du bouton (sans elle, le joueur ne voit que des mots-clés).
  const sansQuestion = [...dm.pnj.values()].flatMap((n) => n.sujets.filter((s) => !s.question?.trim()).map((s) => `${n.id}:${s.id}`));
  if (sansQuestion.length)
    avis(`Dialogues : ${sansQuestion.length} sujets n'ont pas de « question » (le joueur ne verra que leurs mots-clés) : ${sansQuestion.slice(0, 5).join(', ')}${sansQuestion.length > 5 ? '…' : ''}`);

  // Le jeu montre la réponse d'un sujet telle quelle, sous le nom du PNJ : écrite au style indirect (« Elle dit que… »), elle se lit comme un
  // compte rendu froid (« Ysmène Hautecôte Elle dit que la mer s'est retirée »). Une réponse très courte laisse aussi un PNJ sans voix.
  const reponses = [...dm.pnj.values()].flatMap((n) => n.sujets.map((s) => ({ ref: `${n.id}:${s.id}`, texte: s.reponse })));
  const indirectes = reponses.filter((r) => STYLE_INDIRECT.test(r.texte)).map((r) => r.ref);
  if (indirectes.length)
    avis(`Dialogues : ${indirectes.length} réponses sur ${reponses.length} sont au style indirect (« Il dit que… », « Elle explique que… ») : le jeu les affiche telles quelles, sous le nom du PNJ. Écrivez-les au discours direct, avec un geste (${indirectes.slice(0, 5).join(', ')}${indirectes.length > 5 ? '…' : ''}).`);
  const courtes = reponses.filter((r) => r.texte.split(/\s+/).filter(Boolean).length < MOTS_REPONSE_MIN).map((r) => r.ref);
  if (courtes.length)
    avis(`Dialogues : ${courtes.length} réponses sur ${reponses.length} font moins de ${MOTS_REPONSE_MIN} mots (le PNJ n'a pas de voix) : ${courtes.slice(0, 5).join(', ')}${courtes.length > 5 ? '…' : ''}`);

  // Le récit d'arrivée est lu tel quel par le joueur : de la bonne longueur, et sans vocabulaire de mécanique.
  const arrivees = [...dm.lieux.values()].flatMap((l) => [
    ...(l.arrivee?.trim() ? [{ ref: l.id, texte: l.arrivee }] : []),
    ...l.arriveeVariantes.map((v, i) => ({ ref: `${l.id} (variante ${i + 1})`, texte: v.texte })),
  ]);
  const horsLongueur = arrivees.filter((a) => {
    const n = a.texte.split(/\s+/).filter(Boolean).length;
    return n < ARRIVEE_MOTS.min || n > ARRIVEE_MOTS.max;
  });
  if (horsLongueur.length)
    avis(`Arrivée : ${horsLongueur.length} récit(s) d'arrivée hors de ${ARRIVEE_MOTS.min} à ${ARRIVEE_MOTS.max} mots (visé : 130 à 170) : ${horsLongueur.slice(0, 5).map((a) => a.ref).join(', ')}${horsLongueur.length > 5 ? '…' : ''}`);
  const secsArrivee = arrivees.filter((a) => {
    const n = a.texte.split(/\s+/).filter(Boolean).length;
    return n >= ARRIVEE_MOTS.min && n < TEXTES_SECS.arrivee;
  });
  if (secsArrivee.length)
    avis(`Textes secs : ${secsArrivee.length} récits d'arrivée sur ${arrivees.length} font moins de ${TEXTES_SECS.arrivee} mots (RPG textuel : le joueur lit beaucoup, visez 130 à 170) : ${secsArrivee.slice(0, 4).map((a) => a.ref).join(', ')}${secsArrivee.length > 4 ? '…' : ''}`);
  const secsReponses = reponses.filter((x) => {
    const n = x.texte.split(/\s+/).filter(Boolean).length;
    return n >= MOTS_REPONSE_MIN && n < TEXTES_SECS.reponse;
  });
  if (secsReponses.length)
    avis(`Textes secs : ${secsReponses.length} réponses de PNJ sur ${reponses.length} font moins de ${TEXTES_SECS.reponse} mots (visez 75 à 115 : une réponse franche, un détail concret, une piste) : ${secsReponses.slice(0, 4).map((x) => x.ref).join(', ')}${secsReponses.length > 4 ? '…' : ''}`);
  const secsIntros = [...dm.rencontres.values()].filter((x) => x.intro.split(/\s+/).filter(Boolean).length < TEXTES_SECS.introRencontre);
  if (secsIntros.length)
    avis(`Textes secs : ${secsIntros.length} introductions de rencontre sur ${dm.rencontres.size} font moins de ${TEXTES_SECS.introRencontre} mots (visez 70 à 110) : ${secsIntros.slice(0, 4).map((x) => x.id).join(', ')}${secsIntros.length > 4 ? '…' : ''}`);
  const mecanique = arrivees.filter((a) => MOTS_MECANIQUE.test(a.texte));
  if (mecanique.length)
    avis(`Arrivée : ${mecanique.length} récit(s) d'arrivée parlent de mécanique (jauge, DD, jet…) : le joueur le lit tel quel : ${mecanique.slice(0, 5).map((a) => a.ref).join(', ')}${mecanique.length > 5 ? '…' : ''}`);
  // Un monde qui a commencé à écrire ses récits d'arrivée doit les finir : sinon le joueur passe d'un lieu riche à un résumé de 15 mots.
  if (arrivees.length) {
    const sans = [...dm.lieux.values()].filter((l) => !l.arrivee?.trim() && !['region', 'route'].includes(l.type)).map((l) => l.id);
    if (sans.length)
      avis(`Arrivée : ${sans.length} lieux sur ${dm.lieux.size} n'ont pas de récit d'arrivée (champ « arrivee ») : ${sans.slice(0, 6).join(', ')}${sans.length > 6 ? '…' : ''}`);
  }

  // Les lieux enfants (bâtiments, salles) sans lien propre vers leur parent s'expliquent par leur `accroche`.
  const lienPropre = new Set<string>();
  for (const l of dm.lieux.values()) for (const k of l.liens) (lienPropre.add(`${l.id}>${k.vers}`), lienPropre.add(`${k.vers}>${l.id}`));
  const sansAccroche = [...dm.lieux.values()].filter((l) => l.parent && !lienPropre.has(`${l.parent}>${l.id}`) && !l.accroche?.trim()).map((l) => l.id);
  if (sansAccroche.length)
    avis(`Accroches : ${sansAccroche.length} lieux n'ont pas de phrase pour y entrer depuis leur parent (champ « accroche ») : ${sansAccroche.slice(0, 6).join(', ')}${sansAccroche.length > 6 ? '…' : ''}`);
  for (const l of dm.lieux.values()) {
    for (const lien of l.liens) {
      if (lien.retour && lien.sens === 'simple') avis(`Lieu « ${l.id} », lien vers « ${lien.vers} » : « retour » n'a pas de sens pour un lien à sens unique.`);
    }
  }

  // Accessibilité : tout lieu doit pouvoir être atteint depuis le départ (les conditions sont supposées satisfiables).
  const voisins = new Map<string, Set<string>>();
  const relier = (a: string, b: string) => {
    if (!voisins.has(a)) voisins.set(a, new Set());
    voisins.get(a)!.add(b);
  };
  for (const l of dm.lieux.values()) {
    if (l.parent) {
      relier(l.id, l.parent);
      relier(l.parent, l.id);
    }
    for (const lien of l.liens) {
      if (lien.absent && !dm.lieux.has(lien.vers)) continue;
      relier(l.id, lien.vers);
      if (lien.sens === 'double') relier(lien.vers, l.id);
    }
  }
  const atteints = new Set<string>([dm.monde.depart.lieu]);
  const file = [dm.monde.depart.lieu];
  while (file.length) {
    for (const v of voisins.get(file.shift()!) ?? []) if (!atteints.has(v) && dm.lieux.has(v)) (atteints.add(v), file.push(v));
  }
  for (const id of dm.lieux.keys()) if (!atteints.has(id)) err(`Lieu « ${id} » : inaccessible depuis le départ (« ${dm.monde.depart.lieu} »).`);

  // --- Faits, objets ---
  for (const o of dm.objets.values()) {
    if (o.base && !srd.armes.has(o.base) && !srd.armures.has(o.base)) err(`Objet « ${o.id} » : base SRD inconnue « ${o.base} ».`);
    // L'équipement repose sur le catalogue du SRD, commun à tous les mondes : une arme, une armure ou un bouclier du monde
    // dit lesquels (`base`) pour que le combat et la CA le comprennent ; il n'ajoute que son nom, ses bonus et son histoire.
    if (o.categorie === 'arme' && !(o.base && srd.armes.has(o.base))) err(`Objet « ${o.id} » : une arme du monde doit citer l'arme du SRD sur laquelle elle repose (« base »), sinon elle ne peut pas être équipée.`);
    if (o.categorie === 'armure' && !(o.base && srd.armures.has(o.base) && o.base !== 'bouclier')) err(`Objet « ${o.id} » : une armure du monde doit citer l'armure du SRD sur laquelle elle repose (« base »).`);
    if (o.categorie === 'bouclier' && o.base !== 'bouclier') err(`Objet « ${o.id} » : un bouclier du monde doit avoir « base » : « bouclier ».`);
    if (srd.objets.has(o.id) || srd.armes.has(o.id) || srd.armures.has(o.id)) err(`Objet « ${o.id} » : identifiant déjà pris par le catalogue du SRD.`);
    const minNiveau = RAPPORT_RARETE_NIVEAU[o.rarete]!;
    if (dm.monde.niveaux.max < minNiveau && o.rarete !== 'commun') avis(`Objet « ${o.id} » : rareté « ${o.rarete} » inhabituelle pour les niveaux ${dm.monde.niveaux.min} à ${dm.monde.niveaux.max}.`);
    if (o.usage) effets(`Objet « ${o.id} »`, o.usage.effets);
  }

  // --- Tables de butin ---
  for (const t of dm.tables.values()) {
    for (const e of t.entrees) {
      if (e.objet) verifierRef(`Table « ${t.id} »`, 'objet', e.objet);
      if (e.table && !dm.tables.has(e.table)) err(`Table « ${t.id} » : table inconnue « ${e.table} ».`);
      if (e.table === t.id) err(`Table « ${t.id} » : se référence elle-même.`);
    }
  }

  // --- PNJ ---
  const revele = new Set<string>();
  for (const p of dm.pnj.values()) {
    const ou = `PNJ « ${p.id} »`;
    verifierRef(ou, 'lieu', p.lieu);
    if (p.faction) verifierRef(ou, 'faction', p.faction);
    for (const pr of p.presences) {
      verifierRef(`${ou}, présence`, 'lieu', pr.lieu);
      cond(`${ou}, présence`, pr.condition);
    }
    p.salutations.variantes.forEach((v) => cond(`${ou}, salutation`, v.condition));
    for (const f of p.savoir) (verifierRef(ou, 'fait', f), revele.add(f));
    for (const s of p.secrets) {
      verifierRef(`${ou}, secret`, 'fait', s.fait);
      revele.add(s.fait);
      cond(`${ou}, secret`, s.condition);
    }
    for (const s of p.sujets) {
      cond(`${ou}, sujet « ${s.id} »`, s.condition);
      for (const f of s.revele) (verifierRef(`${ou}, sujet « ${s.id} »`, 'fait', f), revele.add(f));
      effets(`${ou}, sujet « ${s.id} »`, s.effets);
    }
    const idsSujets = p.sujets.map((s) => s.id);
    if (new Set(idsSujets).size !== idsSujets.length) err(`${ou} : identifiants de sujets en double.`);
    for (const s of p.services) {
      cond(`${ou}, service « ${s.id} »`, s.condition);
      effets(`${ou}, service « ${s.id} »`, s.effets);
    }
    if (p.boutique) {
      for (const s of p.boutique.stock) verifierRef(`${ou}, boutique`, 'objet', s.objet);
      for (const t of p.boutique.tables) if (!dm.tables.has(t)) err(`${ou}, boutique : table inconnue « ${t} ».`);
    }
    for (const o of p.inventaire) verifierRef(`${ou}, inventaire`, 'objet', o);
    if (p.profilCombat && !srd.monstres.has(p.profilCombat)) err(`${ou} : profil de combat inconnu « ${p.profilCombat} ».`);
    if (p.compagnon) {
      if (!srd.classes.has(p.compagnon.classe)) err(`${ou}, compagnon : classe inconnue « ${p.compagnon.classe} ».`);
      if (!srd.especes.has(p.compagnon.espece)) err(`${ou}, compagnon : espèce inconnue « ${p.compagnon.espece} ».`);
      if (p.compagnon.historique && !srd.historiques.has(p.compagnon.historique)) err(`${ou}, compagnon : historique inconnu « ${p.compagnon.historique} ».`);
      if (p.compagnon.quetePersonnelle) verifierRef(`${ou}, compagnon`, 'quete', p.compagnon.quetePersonnelle);
      cond(`${ou}, compagnon (recrutement)`, p.compagnon.recrutement);
    }
    if (!p.sujets.length && !p.compagnon) avis(`${ou} : aucun sujet de conversation.`);
  }

  // --- Trésors, pièges, énigmes ---
  let valeurTresors = 0;
  const objetValeur = (id: string) => dm.objets.get(id)?.valeurPo ?? srd.objets.get(id)?.valeurPo ?? srd.armes.get(id)?.prixPo ?? srd.armures.get(id)?.prixPo ?? 0;
  for (const t of dm.tresors.values()) {
    const ou = `Trésor « ${t.id} »`;
    verifierRef(ou, 'lieu', t.lieu);
    for (const o of t.contenu.objets) {
      verifierRef(ou, 'objet', o.objet);
      valeurTresors += objetValeur(o.objet) * o.quantite;
    }
    valeurTresors += (t.contenu.pieces?.po ?? 0) + (t.contenu.pieces?.pa ?? 0) / 10 + (t.contenu.pieces?.pc ?? 0) / 100;
    for (const tb of t.contenu.tables) if (!dm.tables.has(tb.table)) err(`${ou} : table inconnue « ${tb.table} ».`);
    if (t.acces.verrou?.cle) verifierRef(`${ou} (clé)`, 'objet', t.acces.verrou.cle);
    if (t.acces.piege && !dm.pieges.has(t.acces.piege)) err(`${ou} : piège inconnu « ${t.acces.piege} ».`);
    if (t.gardien) verifierRef(`${ou} (gardien)`, 'rencontre', t.gardien);
    if (t.indice) (verifierRef(ou, 'fait', t.indice), revele.add(t.indice));
    cond(ou, t.condition);
  }
  for (const p of dm.pieges.values()) {
    verifierRef(`Piège « ${p.id} »`, 'lieu', p.lieu);
    effets(`Piège « ${p.id} »`, p.effets);
  }
  for (const e of dm.enigmes.values()) {
    const ou = `Énigme « ${e.id} »`;
    verifierRef(ou, 'lieu', e.lieu);
    if (e.echec?.piege && !dm.pieges.has(e.echec.piege)) err(`${ou} : piège inconnu « ${e.echec.piege} ».`);
    if (e.recompense.tresor && !dm.tresors.has(e.recompense.tresor)) err(`${ou} : trésor inconnu « ${e.recompense.tresor} ».`);
    effets(ou, e.recompense.effets);
    effets(ou, e.echec?.effets);
    const s = e.solution;
    if (s.type === 'sequence' && new Set(s.ordre.map((x) => x.toLowerCase())).size !== s.ordre.length) err(`${ou} : la séquence contient deux éléments identiques.`);
    if (s.type === 'leviers' && s.positions.every((x) => !x) ) avis(`${ou} : tous les leviers sont à « bas » : la solution est triviale.`);
    if (s.type === 'cadran') {
      if (s.plage && (s.plage[0] > s.plage[1] || s.valeurs.some((v) => v < s.plage![0] || v > s.plage![1]))) err(`${ou} : une valeur du cadran sort de sa plage ${s.plage[0]} à ${s.plage[1]}.`);
      if (s.libelles && s.libelles.length !== s.valeurs.length) err(`${ou} : le cadran a ${s.valeurs.length} réglages mais ${s.libelles.length} libellés.`);
    }
    if (s.type === 'placement') for (const o of Object.values(s.emplacements)) verifierRef(ou, 'objet', o);
    const niveaux = e.indices.map((i) => i.niveau);
    if (!niveaux.includes(1)) avis(`${ou} : aucun indice de niveau 1.`);
  }

  // --- Rencontres ---
  for (const r of dm.rencontres.values()) {
    const ou = `Rencontre « ${r.id} »`;
    if (r.lieu) verifierRef(ou, 'lieu', r.lieu);
    for (const m of r.monstres) {
      if (!srd.monstres.has(m.profil)) err(`${ou} : profil de monstre inconnu « ${m.profil} ».`);
      if (m.pnj) verifierRef(ou, 'pnj', m.pnj);
    }
    if (r.type === 'combat' && !r.monstres.length) err(`${ou} : rencontre de combat sans monstre.`);
    for (const t of r.butin.tables) if (!dm.tables.has(t)) err(`${ou} : table de butin inconnue « ${t} ».`);
    for (const t of r.butin.tresors) if (!dm.tresors.has(t)) err(`${ou} : trésor inconnu « ${t} ».`);
    for (const a of r.alternatives) {
      cond(`${ou}, alternative « ${a.id} »`, a.condition);
      effets(`${ou}, alternative « ${a.id} »`, a.effets);
      effets(`${ou}, alternative « ${a.id} » (échec)`, a.echec);
    }
    // Fail forward : sans monstres, un jet raté ne doit pas laisser le groupe sans conséquence ni impasse.
    const sansPrix = r.alternatives.filter((a) => a.jet && !a.echec?.length).map((a) => a.id);
    if ((r.type === 'social' || r.type === 'exploration') && sansPrix.length)
      avis(`${ou} : un jet raté ne coûte rien (${sansPrix.join(', ')}). Ajoutez \`echec\` (effets) et \`echecResout\` pour que la rencontre se dénoue quand même, plus cher.`);
    effets(ou, r.effetsVictoire);
    if (r.carte) {
      const compte = (c: string) => r.carte!.reduce((n, l) => n + [...l].filter((x) => x === c).length, 0);
      const nb = r.monstres.reduce((n, m) => n + m.nombre, 0);
      if (compte('H') < 1) err(`${ou} : la carte n'a aucune case de départ des héros (H).`);
      if (compte('m') < 1 && nb) avis(`${ou} : la carte n'a aucune case de départ des monstres (m).`);
      // Le combat place chaque héros (6) et chaque monstre sur sa case ; celles qui manquent sont prises sur le sol le plus proche des cases marquées.
      else if (compte('m') < nb) avis(`${ou} : ${compte('m')} case(s) de départ (m) pour ${nb} monstres : les autres partent du sol le plus proche.`);
      if (compte('H') >= 1 && compte('H') < 6) avis(`${ou} : ${compte('H')} case(s) de départ des héros (H) pour un groupe de 6 : les autres partent du sol le plus proche.`);
    }
    // Difficulté déclarée contre le budget de PX d'un groupe de 6.
    if (r.type === 'combat' || r.type === 'mixte') {
      const px = r.monstres.reduce((n, m) => n + (srd.monstres.get(m.profil)?.px ?? 0) * m.nombre, 0);
      const lieu = r.lieu ? dm.lieux.get(r.lieu) : undefined;
      const niv = lieu?.niveau ?? dm.monde.niveaux;
      const niveaux = Array.from({ length: Math.min(niv.max, 20) - niv.min + 1 }, (_, i) => niv.min + i).filter((n) => BUDGET_PX[n]);
      if (niveaux.length && px > 0) {
        const idx = { faible: 0, moderee: 1, elevee: 2 }[r.difficulte];
        const coherent = niveaux.some((n) => {
          const b = BUDGET_PX[n]!;
          const borneBasse = idx === 0 ? 0 : b[idx - 1]! * 6 * 0.5;
          return px >= borneBasse && px <= b[idx]! * 6 * 1.5;
        });
        if (!coherent) avis(`${ou} : ${px} PX pour une difficulté « ${r.difficulte} » (niveaux ${niv.min}-${niv.max}, groupe de 6) : à rééquilibrer ?`);
      }
    }
  }

  // --- Quêtes ---
  for (const q of dm.quetes.values()) {
    const ou = `Quête « ${q.id} »`;
    if (q.donneur) verifierRef(ou, 'pnj', q.donneur);
    if (q.lieu) verifierRef(ou, 'lieu', q.lieu);
    cond(ou, q.prerequis);
    effets(`${ou} (récompenses)`, q.recompenses.effets);
    for (const o of q.recompenses.objets) verifierRef(`${ou} (récompenses)`, 'objet', o);
    const ids = q.etapes.map((e) => e.id);
    if (new Set(ids).size !== ids.length) err(`${ou} : identifiants d'étapes en double.`);
    if (!ids.includes(q.debut)) err(`${ou} : l'étape de départ « ${q.debut} » n'existe pas.`);
    for (const e of q.etapes) {
      for (const s of e.suivantes) if (!ids.includes(s)) err(`${ou}, étape « ${e.id} » : suite inconnue « ${s} ».`);
      cond(`${ou}, étape « ${e.id} »`, e.completion);
      cond(`${ou}, étape « ${e.id} » (échec)`, e.echec);
      effets(`${ou}, étape « ${e.id} »`, e.effets);
    }
    const vues = new Set<string>();
    const pile = [q.debut];
    while (pile.length) {
      const id = pile.pop()!;
      if (vues.has(id)) continue;
      vues.add(id);
      pile.push(...(q.etapes.find((e) => e.id === id)?.suivantes ?? []));
    }
    for (const id of ids) if (!vues.has(id)) err(`${ou} : l'étape « ${id} » n'est pas atteignable depuis le début.`);
    if (!q.etapes.some((e) => e.suivantes.length === 0)) err(`${ou} : aucune étape finale.`);
    if (q.niveau.min < dm.monde.niveaux.min || q.niveau.max > dm.monde.niveaux.max) avis(`${ou} : niveaux ${q.niveau.min}-${q.niveau.max} hors de ceux du monde (${dm.monde.niveaux.min}-${dm.monde.niveaux.max}).`);
    effets(`${ou}`, q.etapes.flatMap((e) => e.effets));
  }

  // --- Factions, jauges, événements, fins, chapitres ---
  for (const f of dm.factions.values()) {
    if (f.chef) verifierRef(`Faction « ${f.id} »`, 'pnj', f.chef);
    for (const r of f.relations) verifierRef(`Faction « ${f.id} »`, 'faction', r.faction);
  }
  for (const j of dm.jauges.values()) {
    if (j.initial < j.min || j.initial > j.max) err(`Jauge « ${j.id} » : valeur initiale hors bornes.`);
    for (const p of j.paliers) effets(`Jauge « ${j.id} »`, p.effets);
    for (const ev of j.evolution) {
      if (ev.lieu) verifierRef(`Jauge « ${j.id} »`, 'lieu', ev.lieu);
      cond(`Jauge « ${j.id} »`, ev.condition);
    }
  }
  for (const ev of dm.evenements.values()) {
    if (ev.lieu) verifierRef(`Événement « ${ev.id} »`, 'lieu', ev.lieu);
    cond(`Événement « ${ev.id} »`, ev.condition);
    effets(`Événement « ${ev.id} »`, ev.effets);
  }
  for (const f of dm.fins.values()) cond(`Fin « ${f.id} »`, f.condition);
  // Le moteur pose la première fin dont la condition est vraie, après chaque action : vraie dès le départ, l'histoire s'arrêterait aussitôt.
  const depart = etatInitial(dm);
  for (const f of dm.fins.values()) if (evaluerCondition(f.condition, depart)) err(`Fin « ${f.id} » : sa condition est déjà vraie au départ ; l'histoire se terminerait dès la première action.`);
  const { dilemmes } = dilemmesDe(dm);
  for (const d of dilemmes) {
    const ou = `Dilemme « ${d.id} »`;
    cond(ou, d.quand);
    if (d.lieu) verifierRef(ou, 'lieu', d.lieu);
    d.options.forEach((o) => cond(`${ou}, option « ${o.id} »`, o.condition));
    effets(ou, effetsDuDilemme(d));
  }
  const { interjections } = interjectionsDe(dm);
  for (const i of interjections) {
    cond(`Interjection « ${i.id} »`, i.quand);
    effets(`Interjection « ${i.id} »`, i.effets);
  }
  const { questions } = questionsDe(dm);
  for (const q of questions) {
    cond(`Question « ${q.id} »`, q.quand);
    cond(`Question « ${q.id} »`, q.resolue);
  }
  const { evenements: evtsChoix } = evenementsChoixDe(dm);
  for (const ev of evtsChoix) {
    const ou = `Événement à choix « ${ev.id} »`;
    cond(ou, ev.quand);
    verifierRef(ou, 'lieu', ev.lieu);
    ev.variantes.forEach((va, k) => cond(`${ou}, variante ${k + 1}`, va.condition));
    ev.choix.forEach((c) => {
      cond(`${ou}, choix « ${c.id} »`, c.condition);
      cond(`${ou}, choix « ${c.id} »`, c.requis);
    });
    effets(ou, effetsDeLEvenement(ev));
  }
  const { examens } = examensDe(dm);
  for (const x of examens) {
    const ou = `Examen « ${x.id} »`;
    cond(ou, x.visible);
    effets(ou, x.effets);
    x.regards.forEach((r, k) => cond(`${ou}, regard ${k + 1}`, r.condition));
    for (const va of x.variantes) {
      cond(`${ou}, variante « ${va.id} »`, va.condition);
      effets(`${ou}, variante « ${va.id} »`, va.effets);
    }
  }
  if (!dm.fins.size) avis('Aucune fin définie.');
  for (const c of dm.monde.chapitres) {
    for (const l of c.lieux) verifierRef(`Chapitre « ${c.id} »`, 'lieu', l);
    for (const q of c.quetes) verifierRef(`Chapitre « ${c.id} »`, 'quete', q);
  }

  // --- Faits : chaque fait doit pouvoir être découvert ---
  for (const l of dm.lieux.values()) for (const f of l.faits) revele.add(f.fait);
  const viaEffet = new Set<string>();
  const collecter = (es: EffetMonde[] | undefined) => es?.forEach((e) => 'fait' in e && viaEffet.add(e.fait));
  for (const d of dilemmes) collecter(effetsDuDilemme(d));
  for (const ev of evtsChoix) collecter(effetsDeLEvenement(ev));
  for (const i of interjections) collecter(i.effets);
  for (const x of examens) {
    collecter(x.effets);
    x.variantes.forEach((va) => collecter(va.effets));
  }
  for (const p of dm.pnj.values()) {
    p.sujets.forEach((s) => collecter(s.effets));
    p.services.forEach((s) => collecter(s.effets));
  }
  for (const q of dm.quetes.values()) {
    collecter(q.recompenses.effets);
    q.etapes.forEach((e) => collecter(e.effets));
  }
  dm.rencontres.forEach((r) => {
    collecter(r.effetsVictoire);
    r.alternatives.forEach((a) => (collecter(a.effets), collecter(a.echec)));
  });
  dm.enigmes.forEach((e) => collecter(e.recompense.effets));
  dm.evenements.forEach((e) => collecter(e.effets));
  for (const f of dm.faits.values()) {
    if (!revele.has(f.id) && !viaEffet.has(f.id)) avis(`Fait « ${f.id} » : personne ne le révèle (PNJ, lieu, trésor ou effet).`);
  }

  // --- Conditions mortes : un drapeau, un objet ou un fait lu quelque part doit pouvoir être obtenu quelque part ---
  const poses = new Set<string>();
  const objetsObtenables = new Set<string>();
  const faitsObtenables = new Set<string>([...revele, ...viaEffet]);
  const collecterEffets = (es: EffetMonde[] | undefined) =>
    es?.forEach((e) => {
      if ('flag' in e && e.valeur !== false) poses.add(e.flag);
      if ('objet' in e && !e.objet.retirer) objetsObtenables.add(e.objet.id);
    });
  for (const p of dm.pnj.values()) {
    p.sujets.forEach((x) => collecterEffets(x.effets));
    p.services.forEach((x) => collecterEffets(x.effets));
    p.inventaire.forEach((o) => objetsObtenables.add(o));
    p.boutique?.stock.forEach((x) => objetsObtenables.add(x.objet));
  }
  for (const q of dm.quetes.values()) {
    collecterEffets(q.recompenses.effets);
    q.recompenses.objets.forEach((o) => objetsObtenables.add(o));
    q.etapes.forEach((e) => collecterEffets(e.effets));
  }
  for (const r of dm.rencontres.values()) {
    collecterEffets(r.effetsVictoire);
    r.alternatives.forEach((a) => (collecterEffets(a.effets), collecterEffets(a.echec)));
  }
  for (const e of dm.enigmes.values()) collecterEffets(e.recompense.effets);
  for (const e of dm.evenements.values()) collecterEffets(e.effets);
  for (const p of dm.pieges.values()) collecterEffets(p.effets);
  for (const j of dm.jauges.values()) j.paliers.forEach((x) => collecterEffets(x.effets));
  for (const d of dilemmes) collecterEffets(effetsDuDilemme(d));
  for (const ev of evtsChoix) collecterEffets(effetsDeLEvenement(ev));
  for (const i of interjections) collecterEffets(i.effets);
  for (const x of examens) {
    collecterEffets(x.effets);
    x.variantes.forEach((va) => collecterEffets(va.effets));
  }
  for (const flag of drapeauxDesDilemmes(dm)) poses.add(flag);
  for (const flag of drapeauxDesEvenements(dm)) poses.add(flag);
  for (const t of dm.tresors.values()) {
    t.contenu.objets.forEach((o) => objetsObtenables.add(o.objet));
    t.contenu.tables.forEach((x) => dm.tables.get(x.table)?.entrees.forEach((en) => en.objet && objetsObtenables.add(en.objet)));
  }
  for (const t of dm.tables.values()) t.entrees.forEach((en) => en.objet && objetsObtenables.add(en.objet));
  for (const o of dm.objets.values()) o.usage?.effets.forEach((e) => collecterEffets([e]));
  const lus = new Map<string, string>();
  const lire = (ou: string, c: Condition | undefined) =>
    c &&
    refsCondition(c, (g, id) => {
      if (g === 'objet' && !objetsObtenables.has(id)) avis(`${ou} : l'objet « ${id} » est exigé mais ne se trouve nulle part.`);
      if (g === 'fait' && !faitsObtenables.has(id)) avis(`${ou} : le fait « ${id} » est exigé mais n'est révélé nulle part.`);
    });
  const lireFlags = (ou: string, c: Condition | undefined): void => {
    if (!c) return;
    if ('flag' in c) {
      if (!lus.has(c.flag)) lus.set(c.flag, ou);
    } else if ('non' in c) lireFlags(ou, c.non);
    else if ('et' in c) c.et.forEach((x) => lireFlags(ou, x));
    else if ('ou' in c) c.ou.forEach((x) => lireFlags(ou, x));
  };
  const toutes = (ou: string, c: Condition | undefined) => (lire(ou, c), lireFlags(ou, c));
  for (const l of dm.lieux.values()) {
    l.liens.forEach((x) => toutes(`Lieu « ${l.id} », lien vers « ${x.vers} »`, x.condition));
    l.rencontres.forEach((x) => toutes(`Lieu « ${l.id} », rencontre « ${x.id} »`, x.condition));
    l.faits.forEach((x) => toutes(`Lieu « ${l.id} », fait « ${x.fait} »`, x.decouverte.condition));
  }
  for (const p of dm.pnj.values()) {
    p.sujets.forEach((x) => toutes(`PNJ « ${p.id} », sujet « ${x.id} »`, x.condition));
    p.secrets.forEach((x) => toutes(`PNJ « ${p.id} », secret « ${x.fait} »`, x.condition));
    p.services.forEach((x) => toutes(`PNJ « ${p.id} », service « ${x.id} »`, x.condition));
    p.presences.forEach((x) => toutes(`PNJ « ${p.id} », présence`, x.condition));
    p.salutations.variantes.forEach((x) => toutes(`PNJ « ${p.id} », salutation`, x.condition));
    toutes(`PNJ « ${p.id} », recrutement`, p.compagnon?.recrutement);
  }
  for (const q of dm.quetes.values()) {
    toutes(`Quête « ${q.id} »`, q.prerequis);
    q.etapes.forEach((e) => {
      toutes(`Quête « ${q.id} », étape « ${e.id} »`, e.completion);
      toutes(`Quête « ${q.id} », étape « ${e.id} » (échec)`, e.echec);
    });
  }
  for (const r of dm.rencontres.values()) r.alternatives.forEach((a) => toutes(`Rencontre « ${r.id} », alternative « ${a.id} »`, a.condition));
  for (const t of dm.tresors.values()) toutes(`Trésor « ${t.id} »`, t.condition);
  for (const e of dm.evenements.values()) toutes(`Événement « ${e.id} »`, e.condition);
  for (const f of dm.fins.values()) toutes(`Fin « ${f.id} »`, f.condition);
  for (const i of interjections) toutes(`Interjection « ${i.id} »`, i.quand);
  for (const q of questions) {
    toutes(`Question « ${q.id} »`, q.quand);
    toutes(`Question « ${q.id} »`, q.resolue);
  }
  for (const x of examens) {
    toutes(`Examen « ${x.id} »`, x.visible);
    for (const va of x.variantes) toutes(`Examen « ${x.id} », variante « ${va.id} »`, va.condition);
  }
  for (const ev of evtsChoix) {
    toutes(`Événement à choix « ${ev.id} »`, ev.quand);
    ev.variantes.forEach((va) => toutes(`Événement à choix « ${ev.id} »`, va.condition));
    ev.choix.forEach((c) => {
      toutes(`Événement à choix « ${ev.id} », choix « ${c.id} »`, c.condition);
      toutes(`Événement à choix « ${ev.id} », choix « ${c.id} »`, c.requis);
    });
  }
  for (const d of dilemmes) {
    toutes(`Dilemme « ${d.id} »`, d.quand);
    d.options.forEach((o) => toutes(`Dilemme « ${d.id} », option « ${o.id} »`, o.condition));
  }
  for (const j of dm.jauges.values()) j.evolution.forEach((e) => toutes(`Jauge « ${j.id} »`, e.condition));
  for (const [flag, ou] of lus) if (!poses.has(flag)) avis(`${ou} : le drapeau « ${flag} » est lu mais jamais posé (sauf par le MJ).`);

  // --- Enchaînements : une quête principale doit exister, avec un donneur ---
  if (!Array.from(dm.quetes.values()).some((q) => q.type === 'principale')) avis('Aucune quête principale.');

  // --- Richesse : un chapitre doit offrir assez à explorer, à qui parler et à trouver ---
  const nbChap = dm.monde.chapitres.length;
  const comptes: [string, number, number][] = [
    ['lieux', dm.lieux.size, MINIMA_PAR_CHAPITRE.lieux],
    ['PNJ', dm.pnj.size, MINIMA_PAR_CHAPITRE.pnj],
    ['sujets de conversation', [...dm.pnj.values()].reduce((n, p) => n + p.sujets.length, 0), MINIMA_PAR_CHAPITRE.sujets],
    ['marchands', [...dm.pnj.values()].filter((p) => p.boutique).length, MINIMA_PAR_CHAPITRE.marchands],
    ['compagnons recrutables', [...dm.pnj.values()].filter((p) => p.compagnon).length, MINIMA_PAR_CHAPITRE.compagnons],
    ['quêtes secondaires', [...dm.quetes.values()].filter((q) => q.type === 'secondaire').length, MINIMA_PAR_CHAPITRE.secondaires],
    ['quêtes personnelles', [...dm.quetes.values()].filter((q) => q.type === 'personnelle').length, MINIMA_PAR_CHAPITRE.personnelles],
    ['trésors', dm.tresors.size, MINIMA_PAR_CHAPITRE.tresors],
    ['objets propres au monde', dm.objets.size, MINIMA_PAR_CHAPITRE.objets],
    ['énigmes', dm.enigmes.size, MINIMA_PAR_CHAPITRE.enigmes],
    ['pièges', dm.pieges.size, MINIMA_PAR_CHAPITRE.pieges],
    ['rencontres', dm.rencontres.size, MINIMA_PAR_CHAPITRE.rencontres],
    ['faits', dm.faits.size, MINIMA_PAR_CHAPITRE.faits],
    ['factions', dm.factions.size, MINIMA_PAR_CHAPITRE.factions],
    ['tables de butin', dm.tables.size, MINIMA_PAR_CHAPITRE.tables],
    ['fins', dm.fins.size, MINIMA_PAR_CHAPITRE.fins],
  ];
  for (const [nom, n, min] of comptes) if (n < min * nbChap) avis(`Richesse : ${n} ${nom} pour ${nbChap} chapitre(s) (objectif : ${min * nbChap}).`);
  const types = new Set([...dm.lieux.values()].map((l) => l.type));
  for (const [t, min] of [['grotte', 3], ['donjon', 1]] as const) {
    if ([...dm.lieux.values()].filter((l) => l.type === t).length < min * nbChap) avis(`Richesse : moins de ${min * nbChap} ${t}(s).`);
  }
  if (!types.has('village') && !types.has('ville')) avis('Richesse : ni village ni ville.');

  const stats: StatsMonde = {
    lieux: compter([...dm.lieux.values()].map((l) => l.type)),
    pnj: dm.pnj.size,
    pnjAvecBoutique: [...dm.pnj.values()].filter((p) => p.boutique).length,
    compagnons: [...dm.pnj.values()].filter((p) => p.compagnon).length,
    sujets: [...dm.pnj.values()].reduce((n, p) => n + p.sujets.length, 0),
    quetes: compter([...dm.quetes.values()].map((q) => q.type)),
    objetsUniques: dm.objets.size,
    tresors: dm.tresors.size,
    valeurTresorsPo: Math.round(valeurTresors),
    rencontres: dm.rencontres.size,
    pieges: dm.pieges.size,
    enigmes: dm.enigmes.size,
    faits: dm.faits.size,
    factions: dm.factions.size,
  };
  // Une quête que rien ne propose ni n'active (effet `quete`, ou `etape` qui l'ouvre) ne se jouera jamais.
  const citees = new Set<string>();
  const parcourir = (x: unknown): void => {
    if (Array.isArray(x)) return x.forEach(parcourir);
    if (!x || typeof x !== 'object') return;
    const o = x as Record<string, unknown>;
    const q = o['quete'] as { id?: string } | string | undefined;
    if (q && typeof q === 'object' && q.id) citees.add(q.id);
    if (o['etape'] && typeof o['etape'] === 'object') citees.add((o['etape'] as { quete: string }).quete);
    Object.values(o).forEach(parcourir);
  };
  for (const m of [dm.lieux, dm.pnj, dm.evenements, dm.rencontres, dm.enigmes, dm.tresors, dm.pieges, dm.jauges, dm.fins]) parcourir([...m.values()]);
  for (const q of dm.quetes.values()) {
    parcourir(q.etapes.map((e) => e.effets));
    parcourir(q.recompenses.effets);
  }
  for (const q of dm.quetes.values()) if (!citees.has(q.id)) err(`Quête « ${q.id} » : rien ne la propose ni ne l'active (aucun effet « quete » ou « etape »), elle ne se jouera jamais.`);

  // Trois conseils d'écriture (inspirés des aventures AideDD et des six ingrédients d'une histoire) :
  // 1. un enjeu : une fin qui arrive quand la jauge du monde tourne mal (ou un palier qui mène à une fin) ;
  const enjeu = [...dm.fins.values()].some((f) => JSON.stringify(f.condition).includes('"jauge"')) ||
    [...dm.jauges.values()].some((j) => j.paliers.some((p) => JSON.stringify(p.effets).includes('"fin"')));
  if (dm.fins.size && !enjeu) avis("Enjeu : aucune fin ne dépend d'une jauge ni d'un palier : que se passe-t-il si les personnages échouent ?");
  // 2. des PX qui mènent au niveau maximum du monde (le groupe partage une seule réserve d'XP) ;
  const xp = (x: unknown): number => {
    if (Array.isArray(x)) return x.reduce((s: number, y) => s + xp(y), 0);
    if (!x || typeof x !== 'object') return 0;
    const o = x as Record<string, unknown>;
    return (typeof o['xp'] === 'number' ? (o['xp'] as number) : 0) + Object.values(o).reduce((s: number, y) => s + xp(y), 0);
  };
  const total =
    [...dm.quetes.values()].reduce((s, q) => s + q.recompenses.xp + q.etapes.reduce((a, e) => a + xp(e.effets), 0) + xp(q.recompenses.effets), 0) +
    [...dm.rencontres.values()].reduce((s, r) => s + xp(r.effetsVictoire) + r.alternatives.reduce((a, x) => a + xp(x.effets), 0), 0) +
    [...dm.evenements.values()].reduce((s, e) => s + xp(e.effets), 0) +
    [...dm.pnj.values()].reduce((s, p) => s + p.sujets.reduce((a, x) => a + xp(x.effets), 0), 0);
  const niveauMax = dm.monde.niveaux.max;
  // Le groupe arrive déjà avec les PX de son niveau de départ.
  const pxDepart = SEUILS_PX[dm.monde.niveaux.min - 1] ?? 0;
  if (pxDepart + total < SEUILS_PX[niveauMax - 1]!) avis(`PX : le monde rapporte ${total} PX au groupe (plus ${pxDepart} au départ), pas assez pour atteindre le niveau ${niveauMax} (seuil : ${SEUILS_PX[niveauMax - 1]}).`);
  // 3. une issue autre que la fuite pour les combats difficiles (négocier, se rendre), sinon le groupe n'a que deux choix.
  for (const r of dm.rencontres.values()) {
    if ((r.type === 'combat' || r.type === 'mixte') && r.difficulte === 'elevee' && !r.alternatives.length) {
      avis(`Rencontre « ${r.id} » : combat difficile sans autre issue (négocier, se rendre, ruser) : le groupe n'a que la fuite.`);
    }
  }

  // 3 bis. Chemin critique (08/11/2026) : une rencontre sans combat qui n'a qu'une issue, ou dont toutes les issues reposent sur la même
  // compétence, bloque le groupe au premier jet raté. Il faut au moins deux voies différentes (deux compétences, un objet, une parole).
  for (const r of dm.rencontres.values()) {
    if (r.type === 'combat' || r.monstres.length) continue;
    if (r.alternatives.length < 2) {
      avis(`Rencontre « ${r.id} » : voie unique (${r.alternatives.length} issue) pour une rencontre sans combat : prévoyez au moins deux façons de s'en sortir (deux compétences, un objet, une parole), sinon un jet raté bloque.`);
    } else if (r.alternatives.every((a) => a.jet) && new Set(r.alternatives.map((a) => a.jet!.competence)).size === 1) {
      avis(`Rencontre « ${r.id} » : voie unique : toutes les issues reposent sur la même compétence (${r.alternatives[0]!.jet!.competence}) ; variez-les (autre compétence, objet, parole).`);
    }
  }

  // Conseils pour que l'histoire ne soit jamais ennuyeuse (rythme, tension, choix qui coûtent, monde qui réagit) :
  // 4. du rythme : des rencontres qui ne sont pas toutes des combats, et des pics de tension ;
  const rencontres = [...dm.rencontres.values()];
  const sansCombat = rencontres.filter((r) => r.type === 'social' || r.type === 'exploration').length;
  if (rencontres.length >= 8 && sansCombat < rencontres.length * 0.2)
    avis(`Rythme : ${sansCombat} rencontre(s) sur ${rencontres.length} se jouent sans combat (négociation, exploration) ; visez au moins 20 % pour varier les scènes.`);
  const elevees = rencontres.filter((r) => r.difficulte === 'elevee').length;
  if (rencontres.length >= 8 && elevees < 3) avis(`Tension : ${elevees} rencontre(s) « élevée(s) ». Il en faut au moins 3 pour les moments forts (boss, embuscade, finale).`);
  // 4 bis. un combat gagné doit rapporter quelque chose : une table de butin, un trésor qu'il garde ou la réserve de l'ennemi.
  const gardes = new Set([...dm.tresors.values()].map((t) => t.gardien).filter((g): g is string => !!g));
  const sansButin = rencontres.filter((r) => (r.type === 'combat' || r.type === 'mixte') && r.monstres.length > 0 && !r.butin.depouilles && !r.butin.tables.length && !r.butin.tresors.length && !gardes.has(r.id)).map((r) => r.id);
  if (sansButin.length) avis(`Butin : ${sansButin.length} combat(s) ne rapportent que des PX (${sansButin.slice(0, 6).join(', ')}${sansButin.length > 6 ? '…' : ''}). Donnez-leur une table de butin (\`butin.tables\`) ou une réserve (\`butin.tresors\`).`);
  // 5. une horloge qui compte : assez de paliers, des paliers qui changent le monde, et un moyen de la ralentir ;
  const tout = JSON.stringify([dm.pnj, dm.quetes, dm.rencontres, dm.evenements, dm.enigmes, dm.pieges, dm.tresors, dm.jauges, dm.lieux, dilemmes.flatMap((d) => effetsDuDilemme(d))].map((x) => (x instanceof Map ? [...x.values()] : x)));
  for (const j of dm.jauges.values()) {
    const ou = `Jauge « ${j.id} »`;
    if (j.paliers.length < 4) avis(`${ou} : ${j.paliers.length} palier(s) ; il en faut au moins 4 pour que le joueur voie le monde changer.`);
    const agissants = j.paliers.filter((p) => p.effets.length).length;
    if (j.paliers.length >= 2 && agissants < Math.ceil(j.paliers.length / 2)) avis(`${ou} : ${agissants} palier(s) sur ${j.paliers.length} changent vraiment le monde (effets) ; les autres ne font que raconter.`);
    const baisse = new RegExp(`"jauge":\\{"id":"${j.id}","delta":-`).test(tout) || j.evolution.some((e) => e.delta < 0);
    const monte = j.evolution.some((e) => e.delta > 0);
    if (monte && !baisse) avis(`${ou} : elle monte toute seule mais rien ne la fait baisser ; le joueur ne peut pas agir sur le danger.`);
  }
  // 6. des choix qui coûtent : des dilemmes, des pertes possibles, un monde qui se souvient ;
  const nbChapitres = Math.max(1, dm.monde.chapitres.length);
  if (dilemmes.length < 3 * nbChapitres) avis(`Choix : ${dilemmes.length} dilemme(s) pour ${nbChapitres} chapitre(s) ; visez 3 par chapitre (dossier dilemmes/ : des choix dont chaque option a un coût et un gain).`);
  if (!/"pnjEtat"/.test(tout)) avis('Pertes : aucun PNJ ne peut mourir ni partir selon les choix ; sans perte possible, aucun choix ne pèse.');
  const reactifs = [...dm.pnj.values()].filter((p) => p.salutations.variantes.length).length;
  if (reactifs < 5) avis(`Réactivité : ${reactifs} PNJ seulement saluent différemment selon ce que le groupe a fait (salutations.variantes) ; visez au moins 5 PNJ importants.`);
  // 7. des faits clés qu'on peut apprendre de plusieurs façons (jamais une seule source, sinon un jet raté bloque l'histoire).
  const sources = new Map<string, number>();
  const compterSources = (x: unknown): void => {
    if (Array.isArray(x)) return x.forEach(compterSources);
    if (!x || typeof x !== 'object') return;
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
      if (['condition', 'prerequis', 'completion', 'echec', 'quand'].includes(k)) continue;
      if (k === 'fait' && typeof v === 'string') sources.set(v, (sources.get(v) ?? 0) + 1);
      else if ((k === 'savoir' || k === 'revele') && Array.isArray(v)) for (const f of v) if (typeof f === 'string') sources.set(f, (sources.get(f) ?? 0) + 1);
      else compterSources(v);
    }
  };
  compterSources([[...dm.lieux.values()].map((l) => l.faits), [...dm.pnj.values()], [...dm.quetes.values()].map((q) => [q.etapes.map((e) => e.effets), q.recompenses.effets]), [...dm.rencontres.values()].map((r) => [r.effetsVictoire, r.alternatives.map((a) => a.effets)]), [...dm.evenements.values()].map((e) => e.effets), [...dm.tresors.values()].map((t) => t.contenu), [...dm.enigmes.values()].map((e) => e.recompense.effets), dilemmes.flatMap((d) => effetsDuDilemme(d))]);
  const cles = new Set<string>();
  const noterCle = (c: Condition | undefined): void => c && refsCondition(c, (g, id) => g === 'fait' && cles.add(id));
  for (const q of dm.quetes.values()) {
    noterCle(q.prerequis);
    q.etapes.forEach((e) => noterCle(e.completion));
  }
  for (const l of dm.lieux.values()) l.liens.forEach((x) => noterCle(x.condition));
  for (const f of dm.fins.values()) noterCle(f.condition);
  for (const id of cles) if ((sources.get(id) ?? 0) === 1) avis(`Fait clé « ${id} » : une seule source. S'il est exigé pour avancer (quête, passage, fin), donnez-lui trois sources (un PNJ, un lieu à fouiller, un objet) : un jet raté ne doit pas bloquer l'histoire.`);
  return { erreurs, avertissements, diagnostics, stats };
}
