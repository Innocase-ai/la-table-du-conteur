// Lancer un sort : résolution générique d'après les données (attaque, sauvegarde, soins)
// et gestionnaires dédiés pour les sorts marqués `special`.
import type { Sort } from '../schemas';
import { aEtat, ennemis, journaliser, lancerDes, peutAgir, type Combattant, type EtatCombat } from './etat';
import { casesZone, cle, distanceMetres, ligneDeVue, type Position } from './grille';
import { ajouterEtat, detailsJet, finConcentration, infligerDegats, jetAttaque, sauvegarde, soigner, emplacementDisponible } from './moteur';

/** Sorts que le moteur de combat sait jouer fidèlement (les autres figurent sur la fiche, marqués « non jouable en combat »). */
export const SORTS_JOUABLES_EN_COMBAT: ReadonlySet<string> = new Set([
  'trait-de-feu', 'rayon-de-givre', 'poigne-electrique', 'flamme-sacree', 'aspersion-acide', 'bouffee-de-poison', 'contact-glacial',
  'projectile-magique', 'bouclier', 'mains-brulantes', 'sommeil', 'soins', 'mot-de-guerison', 'benediction', 'fleau', 'eclair-tracant',
  'bouclier-de-la-foi', 'marque-du-chasseur', 'blessure', 'vague-tonnante',
  'rayon-ardent', 'arme-spirituelle', 'aide', 'immobilisation-de-personne', 'restauration-partielle',
]);

export interface CibleSort {
  cibles?: Combattant[];
  point?: Position;
}

/** Nombre de dés d'un sort mineur selon le niveau du lanceur (niveaux 5, 11, 17). */
function desSortMineur(sort: Sort, lanceur: Combattant, des: string): string {
  if (sort.niveau !== 0 || !sort.evolutionSortMineur) return des;
  const n = lanceur.niveau >= 17 ? sort.evolutionSortMineur[2] : lanceur.niveau >= 11 ? sort.evolutionSortMineur[1] : lanceur.niveau >= 5 ? sort.evolutionSortMineur[0] : 1;
  const m = /^(\d+)d(\d+)$/.exec(des);
  return m ? `${Number(m[1]) * n}d${m[2]}` : des;
}

/** Dés d'un sort lancé à un niveau supérieur (« 1d6 » par niveau au-dessus). */
function desAmeliores(sort: Sort, des: string, niveauEmplacement: number): string {
  const sup = niveauEmplacement - sort.niveau;
  const am = sort.ameliorationParNiveau && /^(\d+)d(\d+)$/.exec(sort.ameliorationParNiveau);
  const base = /^(\d+)d(\d+)$/.exec(des);
  if (sup <= 0 || !am || !base || am[2] !== base[2]) return des;
  return `${Number(base[1]) + sup * Number(am[1])}d${base[2]}`;
}

/** Nombre de projectiles, rayons ou cibles en plus par niveau d'emplacement (« 1 rayon », « 1 cible »). */
function bonusParNiveau(sort: Sort, niveauEmplacement: number): number {
  const m = sort.ameliorationParNiveau && /^(\d+) /.exec(sort.ameliorationParNiveau);
  return m ? Number(m[1]) * (niveauEmplacement - sort.niveau) : 0;
}

export function porteeSort(sort: Sort): number {
  if (sort.portee.type === 'contact') return 1.5;
  if (sort.portee.type === 'personnel') return 0;
  return sort.portee.normale ?? 0;
}

export function nombreCibles(sort: Sort, niveauEmplacement: number): number {
  return (sort.cibles ?? 1) + (sort.cibles ? bonusParNiveau(sort, niveauEmplacement) : 0);
}

/** Vérifie et consomme les ressources ; renvoie le niveau d'emplacement utilisé (0 pour un sort mineur). */
export function preparerIncantation(lanceur: Combattant, sort: Sort): number | string {
  if (!lanceur.sorts.includes(sort.id)) return `${lanceur.nom} ne connaît pas ${sort.nom}.`;
  if (sort.niveau === 0) return 0;
  const niveau = emplacementDisponible(lanceur, sort.niveau);
  if (!niveau) return `Plus d'emplacement de niveau ${sort.niveau} ou plus.`;
  return niveau;
}

export function lancerSort(etat: EtatCombat, lanceur: Combattant, sort: Sort, niveau: number, cible: CibleSort): void {
  if (niveau > 0) lanceur.incantation!.emplacements[niveau - 1]! -= 1;
  const cases = sort.zone && cible.point ? casesDeZone(etat, lanceur, sort, cible.point) : undefined;
  journaliser(etat, {
    type: 'sort',
    texte: `${lanceur.nom} lance ${sort.nom}${niveau > sort.niveau ? ` (niveau ${niveau})` : ''}.`,
    acteur: lanceur.id,
    cible: cible.cibles?.length === 1 ? cible.cibles[0]!.id : undefined,
    details: { sort: sort.id, point: cible.point, cases },
  });
  if (sort.concentration) {
    if (lanceur.concentration) finConcentration(etat, lanceur);
    lanceur.concentration = { sort: sort.id, cibles: (cible.cibles ?? []).map((c) => c.id) };
  }
  const gestionnaire = sort.special ? SPECIAUX[sort.special] : undefined;
  if (gestionnaire) gestionnaire(etat, lanceur, sort, niveau, cible);
  else resolutionGenerique(etat, lanceur, sort, niveau, cible);
}

function casesDeZone(etat: EtatCombat, lanceur: Combattant, sort: Sort, point: Position): Position[] {
  const zone = sort.zone!;
  const origine = sort.portee.type === 'personnel' ? lanceur.position : point;
  return casesZone(etat.grille, zone.forme, zone.taille, origine, point);
}

function ciblesDeZone(etat: EtatCombat, lanceur: Combattant, sort: Sort, point: Position): Combattant[] {
  const cases = new Set(casesDeZone(etat, lanceur, sort, point).map(cle));
  return etat.combattants.filter((c) => !c.mort && !c.enFuite && c.id !== lanceur.id && cases.has(cle(c.position)));
}

function resolutionGenerique(etat: EtatCombat, lanceur: Combattant, sort: Sort, niveau: number, cible: CibleSort): void {
  const cibles = sort.zone && cible.point ? ciblesDeZone(etat, lanceur, sort, cible.point) : (cible.cibles ?? []);
  const inc = lanceur.incantation!;
  for (const c of cibles) {
    const des = sort.degats.map((d) => ({ des: desAmeliores(sort, desSortMineur(sort, lanceur, d.des), niveau), bonus: d.bonus, type: d.type }));
    const r = sort.resolution;
    if (r?.type === 'attaque') {
      const jet = jetAttaque(etat, lanceur, c, inc.bonusAttaque, r.mode);
      journaliser(etat, { type: 'attaque', texte: `${sort.nom} contre ${c.nom} : ${jet.de} → ${jet.total}, ${jet.touche ? (jet.critique ? 'critique !' : 'touché') : 'raté'}.`, acteur: lanceur.id, cible: c.id, details: detailsJet(jet, r.mode === 'distance', sort.id) });
      if (jet.touche) {
        infligerDegats(etat, c, des.map((d) => ({ montant: lancerDes(etat, d.des, jet.critique ? 2 : 1) + d.bonus, type: d.type })), lanceur, jet.critique);
        effetsSecondaires(etat, lanceur, sort, c);
        if (sort.id === 'poigne-electrique') c.ressources.reaction = 0;
      } else if (sort.niveau === 0 && lanceur.traits.includes('sort-mineur-appuye')) {
        // Sort mineur appuyé (Évocateur) : moitié des dégâts en cas d'échec.
        infligerDegats(etat, c, des.map((d) => ({ montant: Math.floor(lancerDes(etat, d.des) / 2), type: d.type })), lanceur);
      }
    } else if (r?.type === 'sauvegarde') {
      const reussite = sauvegarde(etat, c, r.caracteristique, inc.dd);
      journaliser(etat, { type: 'sort', texte: `${c.nom} : sauvegarde ${reussite ? 'réussie' : 'ratée'}.`, acteur: lanceur.id, cible: c.id, details: { sort: sort.id, sauvegarde: reussite ? 'reussie' : 'ratee', distance: !sort.zone && sort.portee.type === 'distance' } });
      const appuye = sort.niveau === 0 && lanceur.traits.includes('sort-mineur-appuye');
      const facteur = reussite ? (r.moitieSiReussite || appuye ? 0.5 : 0) : 1;
      if (facteur > 0 && des.length) {
        infligerDegats(etat, c, des.map((d) => ({ montant: Math.floor((lancerDes(etat, d.des) + d.bonus) * facteur), type: d.type })), lanceur);
      }
      if (!reussite) {
        for (const e of sort.etats) {
          ajouterEtat(etat, c, {
            etat: e.etat,
            source: lanceur.id,
            sort: sort.concentration ? sort.id : undefined,
            sauvegarde: e.sauvegardeFinDeTour ? { caracteristique: r.caracteristique, dd: inc.dd } : undefined,
          });
        }
      }
    } else if (sort.soins) {
      const disciple = lanceur.traits.includes('disciple-de-la-vie') && niveau > 0 ? 2 + niveau : 0;
      const montant = lancerDes(etat, desAmeliores(sort, sort.soins.des, niveau)) + (sort.soins.ajouterModificateur ? inc.modificateur : 0) + disciple;
      soigner(etat, c, montant, lanceur);
    } else if (r?.type === 'automatique' && des.length) {
      infligerDegats(etat, c, des.map((d) => ({ montant: lancerDes(etat, d.des) + d.bonus, type: d.type })), lanceur);
    }
  }
}

function effetsSecondaires(etat: EtatCombat, lanceur: Combattant, sort: Sort, c: Combattant): void {
  if (sort.id === 'rayon-de-givre') {
    c.modificateurs.push({ id: 'rayon-de-givre', type: 'vitesse', valeur: -3, source: lanceur.id, expire: { moment: 'debut_tour', de: lanceur.id } });
  }
  if (sort.id === 'eclair-tracant') {
    c.modificateurs.push({ id: 'eclair-tracant', type: 'avantage_contre', source: lanceur.id, usageUnique: true, expire: { moment: 'fin_tour', de: lanceur.id } });
    // L'avantage dure jusqu'à la fin du prochain tour du lanceur.
    c.modificateurs[c.modificateurs.length - 1]!.expire = undefined;
  }
}

type Gestionnaire = (etat: EtatCombat, lanceur: Combattant, sort: Sort, niveau: number, cible: CibleSort) => void;

const SPECIAUX: Record<string, Gestionnaire> = {
  'projectile-magique': (etat, lanceur, sort, niveau, cible) => {
    const n = 3 + bonusParNiveau(sort, niveau);
    const cibles = cible.cibles ?? [];
    for (let i = 0; i < n && cibles.length; i++) {
      const c = cibles[i % cibles.length]!;
      journaliser(etat, { type: 'attaque', texte: `Un projectile file vers ${c.nom}.`, acteur: lanceur.id, cible: c.id, details: { resultat: 'touche', distance: true, sort: sort.id } });
      infligerDegats(etat, c, [{ montant: lancerDes(etat, '1d4') + 1, type: 'force' }], lanceur);
    }
  },
  'rayon-ardent': (etat, lanceur, sort, niveau, cible) => {
    const n = 3 + bonusParNiveau(sort, niveau);
    const cibles = cible.cibles ?? [];
    for (let i = 0; i < n && cibles.length; i++) {
      const c = cibles[i % cibles.length]!;
      if (c.mort) continue;
      const jet = jetAttaque(etat, lanceur, c, lanceur.incantation!.bonusAttaque, 'distance');
      journaliser(etat, { type: 'attaque', texte: `Rayon contre ${c.nom} : ${jet.de} → ${jet.total}, ${jet.touche ? 'touché' : 'raté'}.`, acteur: lanceur.id, cible: c.id, details: detailsJet(jet, true, sort.id) });
      if (jet.touche) infligerDegats(etat, c, [{ montant: lancerDes(etat, '2d6', jet.critique ? 2 : 1), type: 'feu' }], lanceur, jet.critique);
    }
  },
  bouclier: () => {
    // Géré comme réaction dans jetAttaque.
  },
  benediction: (etat, lanceur, sort, niveau, cible) => {
    for (const c of (cible.cibles ?? []).slice(0, nombreCibles(sort, niveau))) {
      c.modificateurs.push({ id: 'benediction-a', type: 'de_attaque', de: '1d4', source: lanceur.id, sort: sort.id });
      c.modificateurs.push({ id: 'benediction-s', type: 'de_sauvegarde', de: '1d4', source: lanceur.id, sort: sort.id });
      journaliser(etat, { type: 'sort', texte: `${c.nom} est béni (+1d4 aux attaques et sauvegardes).`, cible: c.id });
    }
  },
  fleau: (etat, lanceur, sort, niveau, cible) => {
    for (const c of (cible.cibles ?? []).slice(0, nombreCibles(sort, niveau))) {
      if (sauvegarde(etat, c, 'cha', lanceur.incantation!.dd)) {
        journaliser(etat, { type: 'sort', texte: `${c.nom} résiste à ${sort.nom}.`, cible: c.id });
        continue;
      }
      c.modificateurs.push({ id: 'fleau-a', type: 'de_attaque', de: '-1d4', source: lanceur.id, sort: sort.id });
      c.modificateurs.push({ id: 'fleau-s', type: 'de_sauvegarde', de: '-1d4', source: lanceur.id, sort: sort.id });
      journaliser(etat, { type: 'sort', texte: `${c.nom} est maudit (−1d4 aux attaques et sauvegardes).`, cible: c.id });
    }
  },
  'eclair-tracant': (etat, lanceur, sort, niveau, cible) => resolutionGenerique(etat, lanceur, sort, niveau, cible),
  'bouclier-de-la-foi': (etat, lanceur, sort, _niveau, cible) => {
    const c = cible.cibles?.[0] ?? lanceur;
    c.modificateurs.push({ id: 'bouclier-de-la-foi', type: 'bonus_ca', valeur: 2, source: lanceur.id, sort: sort.id });
    journaliser(etat, { type: 'sort', texte: `${c.nom} est protégé (+2 CA).`, cible: c.id });
  },
  'marque-du-chasseur': (etat, lanceur, sort, _niveau, cible) => {
    const c = cible.cibles?.[0];
    if (!c) return;
    c.modificateurs.push({ id: 'marque-du-chasseur', type: 'bonus_attaque', valeur: 0, source: lanceur.id, sort: sort.id });
    journaliser(etat, { type: 'sort', texte: `${c.nom} est marqué.`, cible: c.id });
  },
  'arme-spirituelle': (etat, lanceur, sort, niveau, cible) => {
    lanceur.ressources.armeSpirituelle = niveau;
    attaqueArmeSpirituelle(etat, lanceur, sort, cible.cibles?.[0]);
  },
  aide: (etat, lanceur, sort, niveau, cible) => {
    const bonus = 5 * (niveau - 1);
    for (const c of (cible.cibles ?? []).slice(0, 3)) {
      c.pvMax += bonus;
      if (c.pv > 0 || bonus > 0) soigner(etat, c, bonus, lanceur);
    }
  },
  sommeil: (etat, lanceur, sort, _niveau, cible) => {
    if (!cible.point) return;
    for (const c of ciblesDeZone(etat, lanceur, sort, cible.point)) {
      if (c.camp === lanceur.camp || c.type.toLowerCase().includes('mort-vivant') || c.type.toLowerCase().includes('artificiel')) continue;
      if (sauvegarde(etat, c, 'sag', lanceur.incantation!.dd)) {
        journaliser(etat, { type: 'sort', texte: `${c.nom} résiste au sommeil.`, cible: c.id });
        continue;
      }
      ajouterEtat(etat, c, { etat: 'neutralise', source: lanceur.id, sort: sort.id, sauvegarde: { caracteristique: 'sag', dd: lanceur.incantation!.dd } });
    }
  },
};

/** Attaque de l'arme spirituelle (au lancement, puis en action bonus les tours suivants). */
export function attaqueArmeSpirituelle(etat: EtatCombat, lanceur: Combattant, sort: Sort, c: Combattant | undefined): void {
  if (!c || c.mort) return;
  const niveau = lanceur.ressources.armeSpirituelle ?? 2;
  const jet = jetAttaque(etat, lanceur, c, lanceur.incantation!.bonusAttaque, 'corps-a-corps');
  journaliser(etat, { type: 'attaque', texte: `L'arme spirituelle frappe ${c.nom} : ${jet.de} → ${jet.total}, ${jet.touche ? 'touché' : 'raté'}.`, acteur: lanceur.id, cible: c.id, details: detailsJet(jet, true, sort.id) });
  if (jet.touche) {
    const des = desAmeliores(sort, '1d8', niveau);
    infligerDegats(etat, c, [{ montant: lancerDes(etat, des, jet.critique ? 2 : 1) + lanceur.incantation!.modificateur, type: 'force' }], lanceur, jet.critique);
  }
}

/** Cibles valides d'un sort pour le lanceur (portée et ligne de vue). */
export function ciblesPossibles(etat: EtatCombat, lanceur: Combattant, sort: Sort): Combattant[] {
  const portee = porteeSort(sort);
  const offensif = !!sort.resolution || sort.special === 'marque-du-chasseur' || sort.degats.length > 0;
  const pool = offensif ? ennemis(etat, lanceur) : etat.combattants.filter((c) => c.camp === lanceur.camp && !c.mort && !c.enFuite);
  return pool.filter((c) => {
    if (sort.id === 'immobilisation-de-personne' && !c.type.toLowerCase().includes('humanoïde')) return false;
    if (sort.soins && c.pv >= c.pvMax) return false;
    if (sort.portee.type === 'personnel') return c.id === lanceur.id;
    return distanceMetres(lanceur.position, c.position) <= portee && ligneDeVue(etat.grille, lanceur.position, c.position);
  });
}

export { aEtat, peutAgir };
