// Validation d'un monde : références, accessibilité, quêtes, énigmes, trésors, rencontres.
// Les erreurs rendent le monde injouable ; les avertissements signalent un manque de cohérence ou de richesse.
import { BUDGET_PX } from '../budget';
import type { Donnees } from '../donnees';
import type { Condition, DonneesMonde, EffetMonde } from './schemas';

export interface BilanMonde {
  erreurs: string[];
  avertissements: string[];
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

/** Objectifs de richesse par chapitre (niveaux 1 à 5) : en dessous, le validateur avertit. */
export const MINIMA_PAR_CHAPITRE = {
  lieux: 30, pnj: 25, sujets: 75, marchands: 3, compagnons: 3, secondaires: 6, personnelles: 3, tresors: 25, objets: 10,
  enigmes: 3, pieges: 5, rencontres: 15, faits: 40, factions: 4, tables: 3, fins: 2,
};

const RAPPORT_RARETE_NIVEAU: Record<string, number> = { commun: 1, 'peu-commun': 1, rare: 5, 'tres-rare': 11, legendaire: 17 };

/** Parcourt toutes les références d'une condition. */
function refsCondition(c: Condition, f: (genre: string, id: string, extra?: string) => void): void {
  if ('flag' in c) return;
  if ('fait' in c) f('fait', c.fait);
  else if ('quete' in c) f('quete', c.quete.id);
  else if ('etape' in c) f('etape', c.etape.quete, c.etape.etape);
  else if ('faction' in c) f('faction', c.faction.id);
  else if ('jauge' in c) f('jauge', c.jauge.id);
  else if ('objet' in c) f('objet', c.objet);
  else if ('pnj' in c) f('pnj', c.pnj.id);
  else if ('lieu' in c) f('lieu', c.lieu);
  else if ('niveauGroupe' in c) return;
  else if ('non' in c) refsCondition(c.non, f);
  else if ('et' in c) c.et.forEach((x) => refsCondition(x, f));
  else c.ou.forEach((x) => refsCondition(x, f));
}

function refsEffet(e: EffetMonde, f: (genre: string, id: string, extra?: string) => void): void {
  if ('fait' in e) f('fait', e.fait);
  else if ('jauge' in e) f('jauge', e.jauge.id);
  else if ('reputation' in e) f('faction', e.reputation.faction);
  else if ('attitude' in e) f('pnj', e.attitude.pnj);
  else if ('objet' in e) f('objet', e.objet.id);
  else if ('quete' in e) f('quete', e.quete.id);
  else if ('etape' in e) f('etape', e.etape.quete, e.etape.etape);
  else if ('pnjEtat' in e) f('pnj', e.pnjEtat.pnj);
  else if ('deplacer' in e) {
    f('pnj', e.deplacer.pnj);
    f('lieu', e.deplacer.lieu);
  } else if ('rencontre' in e) f('rencontre', e.rencontre);
  else if ('fin' in e) f('fin', e.fin);
}

function compter(valeurs: string[]): Record<string, number> {
  const res: Record<string, number> = {};
  for (const v of valeurs) res[v] = (res[v] ?? 0) + 1;
  return res;
}

export function validerMonde(dm: DonneesMonde, srd: Donnees): BilanMonde {
  const erreurs: string[] = [];
  const avertissements: string[] = [];
  const err = (m: string) => erreurs.push(m);
  const avis = (m: string) => avertissements.push(m);

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
      case 'rencontre': return dm.rencontres.has(id);
      case 'fin': return dm.fins.has(id);
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
      verifierRef(`${ou}, lien`, 'lieu', lien.vers);
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
    }
    effets(ou, r.effetsVictoire);
    if (r.carte) {
      const compte = (c: string) => r.carte!.reduce((n, l) => n + [...l].filter((x) => x === c).length, 0);
      const nb = r.monstres.reduce((n, m) => n + m.nombre, 0);
      if (compte('H') < 1) err(`${ou} : la carte n'a aucune case de départ des héros (H).`);
      if (compte('m') < 1 && nb) avis(`${ou} : la carte n'a aucune case de départ des monstres (m).`);
    }
    // Difficulté déclarée contre le budget de PX d'un groupe de 6.
    if (r.type === 'combat' || r.type === 'mixte') {
      const px = r.monstres.reduce((n, m) => n + (srd.monstres.get(m.profil)?.px ?? 0) * m.nombre, 0);
      const lieu = r.lieu ? dm.lieux.get(r.lieu) : undefined;
      const niv = lieu?.niveau ?? dm.monde.niveaux;
      const niveaux = Array.from({ length: Math.min(niv.max, 10) - niv.min + 1 }, (_, i) => niv.min + i).filter((n) => BUDGET_PX[n]);
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
  if (!dm.fins.size) avis('Aucune fin définie.');
  for (const c of dm.monde.chapitres) {
    for (const l of c.lieux) verifierRef(`Chapitre « ${c.id} »`, 'lieu', l);
    for (const q of c.quetes) verifierRef(`Chapitre « ${c.id} »`, 'quete', q);
  }

  // --- Faits : chaque fait doit pouvoir être découvert ---
  for (const l of dm.lieux.values()) for (const f of l.faits) revele.add(f.fait);
  const viaEffet = new Set<string>();
  const collecter = (es: EffetMonde[] | undefined) => es?.forEach((e) => 'fait' in e && viaEffet.add(e.fait));
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
    r.alternatives.forEach((a) => collecter(a.effets));
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
    r.alternatives.forEach((a) => collecterEffets(a.effets));
  }
  for (const e of dm.enigmes.values()) collecterEffets(e.recompense.effets);
  for (const e of dm.evenements.values()) collecterEffets(e.effets);
  for (const p of dm.pieges.values()) collecterEffets(p.effets);
  for (const j of dm.jauges.values()) j.paliers.forEach((x) => collecterEffets(x.effets));
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
  return { erreurs, avertissements, stats };
}
