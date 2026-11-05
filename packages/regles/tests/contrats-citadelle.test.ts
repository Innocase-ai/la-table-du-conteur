import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

// Les contrats de La Citadelle des Marées au-delà du premier : embuscade, traque, défense, client qui ment.
const srd = chargerDonneesSrd();
const c = chargerMonde(join(RACINE_MONDES, 'citadelle-des-marees'));
if (!c.ok) throw new Error(c.erreurs.map((e) => e.message).join('\n'));
const moteur = creerMoteur({ dm: c.monde, srd }, MODULES_STANDARD);

function depart(): Partie {
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  return moteur.executer(moteur.nouvellePartie(g, { graine: 7, niveau: 1 }), { type: 'commencer' }).partie;
}

/** Place le groupe dans un lieu (visité) : les tests jouent les verbes, pas la carte. */
function chez(p: Partie, lieu: string): Partie {
  return { ...p, etat: { ...p.etat, lieu, lieuxVisites: [...new Set([...p.etat.lieuxVisites, lieu])] } };
}

/** Parler d'un sujet à un PNJ puis quitter la conversation. */
function dire(p: Partie, lieu: string, pnj: string, sujet: string): Partie {
  const q = moteur.executer(chez(p, lieu), { type: 'parler', pnj, sujet });
  expect(q.refus, `${pnj} / ${sujet}`).toBeUndefined();
  return moteur.executer(q.partie, { type: 'quitterDialogue' }).partie;
}

/** Accepte un contrat auprès de son donneur et vérifie qu'il est actif. */
function accepter(lieu: string, pnj: string, sujet: string, quete: string): Partie {
  let p = dire(depart(), lieu, pnj, sujet);
  expect(p.etat.quetes[quete]?.statut, 'proposée').toBe('proposee');
  p = moteur.executer(p, { type: 'accepterQuete', quete }).partie;
  expect(p.etat.quetes[quete]?.statut).toBe('active');
  return p;
}

type Resultat = ReturnType<typeof moteur.executer>;

/** Joue une alternative avec plusieurs graines jusqu'à obtenir un résultat réussi et un raté. */
function essais(base: Partie, alternative: string): { reussi?: Resultat; rate?: Resultat } {
  let reussi: Resultat | undefined;
  let rate: Resultat | undefined;
  for (let g = 1; g < 80 && !(reussi && rate); g++) {
    const r = moteur.executer({ ...base, graine: g }, { type: 'reglerRencontre', issue: 'alternative', alternative });
    const jet = r.evenements.find((e) => e.type === 'jet') as { jet: { reussite: boolean } } | undefined;
    if (jet?.jet.reussite) reussi ??= r;
    else if (jet) rate ??= r;
  }
  return { reussi, rate };
}

const regler = (p: Partie, issue: Record<string, unknown>): Resultat => moteur.executer(p, { type: 'reglerRencontre', ...issue } as never);

describe('contrat « Les voleurs d’huile » (embuscade de nuit)', () => {
  const Q = 'q-cit-les-voleurs-d-huile';
  const R = 'cit-r-voleurs-d-huile';
  const lancer = (): Partie => {
    const p = accepter('cit-phare-archive', 'gudrun-lanterne', 'huile-des-fanaux', Q);
    // Aller aux jardins ne suffit pas : l'embuscade se déclenche quand le groupe se repose.
    const aux = moteur.executer(chez(p, 'cit-cour-des-vents'), { type: 'aller', vers: 'cit-jardins-de-falaise' }).partie;
    expect(aux.scene.type).toBe('exploration');
    const nuit = moteur.executer(aux, { type: 'seReposer', duree: 'court' }).partie;
    expect(nuit.scene).toEqual({ type: 'rencontre', rencontre: R });
    return nuit;
  };

  it('sans la quête, se reposer aux jardins ne déclenche rien', () => {
    const p = chez(depart(), 'cit-jardins-de-falaise');
    expect(moteur.executer(p, { type: 'seReposer', duree: 'court' }).partie.scene.type).toBe('exploration');
  });

  it('combat : la victoire règle l’embuscade, Gudrun récompense au retour', () => {
    let p = regler(lancer(), { issue: 'victoire', px: 100 }).partie;
    expect(p.etat.flags['cit-voleurs-regles']).toBe(true);
    p = dire(p, 'cit-phare-archive', 'gudrun-lanterne', 'voleurs-pris');
    expect(p.etat.quetes[Q]!.statut).toBe('terminee');
    expect(p.etat.inventaire['huile']).toBeGreaterThanOrEqual(3);
  });

  it('prendre les voleurs à revers réussit ou échoue sans régler ; racheter la nuit coûte 30 po et la confiance de Gudrun', () => {
    const nuit = lancer();
    const { reussi, rate } = essais(nuit, 'surprendre-en-silence');
    expect(reussi!.partie.etat.flags['cit-voleurs-regles']).toBe(true);
    expect(rate!.partie.etat.flags['cit-voleurs-regles']).toBeUndefined();
    expect(rate!.partie.scene.type).toBe('rencontre');
    nuit.etat.pieces = 10;
    expect(moteur.propositions(nuit).some((x) => (x.ordre as { alternative?: string } | undefined)?.alternative === 'racheter-la-nuit')).toBe(false);
    nuit.etat.pieces = 50;
    const avant = nuit.etat.attitudes['gudrun-lanterne'] ?? 0;
    const r = regler(nuit, { issue: 'alternative', alternative: 'racheter-la-nuit' });
    expect(r.partie.etat.pieces).toBe(20);
    expect(r.partie.etat.attitudes['gudrun-lanterne']).toBe(avant - 5);
    expect(r.partie.etat.flags['cit-voleurs-regles']).toBe(true);
  });

  it('si on tarde, l’huile est perdue et la quête échoue', () => {
    const p = accepter('cit-phare-archive', 'gudrun-lanterne', 'huile-des-fanaux', Q);
    p.etat.jauges['maree'] = 3;
    const r = moteur.executer(chez(p, 'cit-cour-des-vents'), { type: 'aller', vers: 'cit-refectoire' }).partie;
    expect(r.etat.quetes[Q]!.statut).toBe('echouee');
    expect(r.etat.flags['cit-huile-perdue']).toBe(true);
  });
});

describe('contrat « La charrette éventrée » (traque)', () => {
  const Q = 'q-fal-la-charrette-eventree';
  const FAIT = 'f-fal-meute-de-la-grotte';
  const entrer = (p: Partie): Partie => moteur.executer(chez(p, 'fal-grotte-des-marees'), { type: 'aller', vers: 'fal-grotte-des-marees-entree' }).partie;

  it('le fait clé a trois sources indépendantes (un jet raté ne bloque jamais)', () => {
    const lieux = [...c.monde.lieux.values()].filter((l) => l.faits.some((f) => f.fait === FAIT)).map((l) => l.id);
    const pnj = [...c.monde.pnj.values()].filter((x) => x.savoir.includes(FAIT)).map((x) => x.id);
    expect(lieux.length + pnj.length).toBeGreaterThanOrEqual(3);
    expect(lieux).toContain('fal-pont-des-corbeaux');
  });

  it('la tanière ne se défend que si le groupe a déduit où elle est', () => {
    const p = accepter('fal-relais-des-voyageurs', 'fal-aubin-lacombe', 'charrette-eventree', Q);
    expect(entrer(p).scene.type).toBe('exploration');
    p.etat.faits.push(FAIT);
    expect(entrer(p).scene).toEqual({ type: 'rencontre', rencontre: 'fal-r-meute-de-la-grotte' });
  });

  it('combat, apaiser la meute (dressage), ou chasser au feu (une torche) : toutes règlent la traque', () => {
    const base = accepter('fal-relais-des-voyageurs', 'fal-aubin-lacombe', 'charrette-eventree', Q);
    base.etat.faits.push(FAIT);
    const scene = entrer(base);
    expect(regler(scene, { issue: 'victoire', px: 100 }).partie.etat.flags['fal-meute-reglee']).toBe(true);
    const { reussi, rate } = essais(scene, 'apaiser-la-meute');
    expect(reussi!.partie.etat.flags['fal-meute-reglee']).toBe(true);
    expect(rate!.partie.etat.flags['fal-meute-reglee']).toBeUndefined();
    scene.etat.inventaire['torche'] = 2;
    const feu = regler(scene, { issue: 'alternative', alternative: 'les-chasser-au-feu' });
    expect(feu.partie.etat.inventaire['torche']).toBe(1);
    expect(feu.partie.etat.flags['fal-meute-reglee']).toBe(true);
    const fin = dire(feu.partie, 'fal-relais-des-voyageurs', 'fal-aubin-lacombe', 'loups-eloignes');
    expect(fin.etat.quetes[Q]!.statut).toBe('terminee');
  });

  it('si on tarde, Aubin quitte le relais', () => {
    const p = accepter('fal-relais-des-voyageurs', 'fal-aubin-lacombe', 'charrette-eventree', Q);
    p.etat.jauges['maree'] = 3;
    const r = moteur.executer(chez(p, 'route-des-falaises'), { type: 'aller', vers: 'marais-de-sel' }).partie;
    expect(r.etat.pnjEtats['fal-aubin-lacombe']).toBe('parti');
    expect(r.etat.quetes[Q]!.statut).toBe('echouee');
  });
});

describe('contrat « La coque neuve » (défense en deux vagues)', () => {
  const Q = 'q-por-la-coque-neuve';
  const V1 = 'por-r-premiere-vague-du-chantier';
  const V2 = 'por-r-assaut-du-chantier';
  const vague1 = (): Partie => {
    const p = accepter('por-chantier-naval', 'por-hennequin-lacet', 'coque-grattee', Q);
    const s = moteur.executer(chez(p, 'por-quai-aux-cordes'), { type: 'aller', vers: 'por-chantier-naval' }).partie;
    expect(s.scene).toEqual({ type: 'rencontre', rencontre: V1 });
    return s;
  };

  it('la première vague, qu’on la gagne ou qu’on l’évite, appelle la seconde', () => {
    const p = regler(vague1(), { issue: 'victoire', px: 50 }).partie;
    expect(p.scene).toEqual({ type: 'rencontre', rencontre: V2 });
    const brasero = vague1();
    brasero.etat.inventaire['huile'] = 1;
    const b = regler(brasero, { issue: 'alternative', alternative: 'allumer-les-braseros' }).partie;
    expect(b.etat.flags['por-braseros-allumes']).toBe(true);
    expect(b.etat.inventaire['huile']).toBeUndefined();
    expect(b.scene).toEqual({ type: 'rencontre', rencontre: V2 });
  });

  it('l’assaut se gagne au combat, en fermant la vanne, ou en sonnant la cloche (Hennequin n’aime pas ça)', () => {
    const seconde = regler(vague1(), { issue: 'victoire', px: 50 }).partie;
    expect(regler(seconde, { issue: 'victoire', px: 150 }).partie.etat.flags['por-chantier-defendu']).toBe(true);
    const { reussi, rate } = essais(seconde, 'fermer-la-vanne');
    expect(reussi!.partie.etat.flags['por-chantier-defendu']).toBe(true);
    expect(rate!.partie.etat.flags['por-chantier-defendu']).toBeUndefined();
    const avant = seconde.etat.attitudes['por-hennequin-lacet'] ?? 0;
    const cloche = regler(seconde, { issue: 'alternative', alternative: 'sonner-la-cloche-du-quai' }).partie;
    expect(cloche.etat.attitudes['por-hennequin-lacet']).toBe(avant - 5);
    const fin = dire(cloche, 'por-chantier-naval', 'por-hennequin-lacet', 'chantier-tenu');
    expect(fin.etat.quetes[Q]!.statut).toBe('terminee');
  });

  it('si on tarde, la coque est rongée', () => {
    const p = accepter('por-chantier-naval', 'por-hennequin-lacet', 'coque-grattee', Q);
    p.etat.jauges['maree'] = 3;
    const r = moteur.executer(chez(p, 'por-quai-aux-cordes'), { type: 'aller', vers: 'por-marche-aux-poissons' }).partie;
    expect(r.etat.quetes[Q]!.statut).toBe('echouee');
    expect(r.etat.flags['por-coque-rongee']).toBe(true);
  });
});

describe('contrat « La caisse de Gaspard » (le client ment)', () => {
  const Q = 'q-por-la-caisse-de-gaspard';
  const arriver = (): Partie => {
    const p = accepter('por-taverne-du-hareng', 'por-garance-bolle', 'caisse-de-sel', Q);
    const s = moteur.executer(chez(p, 'por-quai-aux-cordes'), { type: 'aller', vers: 'por-marche-aux-poissons' }).partie;
    expect(s.scene).toEqual({ type: 'rencontre', rencontre: 'por-r-les-pecheurs-de-gaspard' });
    return s;
  };
  const dilemme = (p: Partie) => moteur.propositions(p).filter((x) => x.groupe.id === 'dilemme:le-contrat-de-garance');
  /** Le groupe a parlé à Gaspard (vérité connue) : le dilemme s'ouvre au marché même (le quai relancerait le procès). */
  const verite = (): Partie => essais(arriver(), 'parler-a-gaspard').reussi!.partie;

  it('parler à Gaspard révèle la vérité et ouvre le dilemme ; dénoncer Garance à la Ligue clôt la quête et coûte ses amis', () => {
    let p = verite();
    expect(p.etat.faits).toContain('f-por-gaspard-temoin');
    expect(p.etat.flags['por-gaspard-parle']).toBe(true);
    expect(dilemme(p).length).toBeGreaterThanOrEqual(4); // 3 options + l’abstention
    const rats = p.etat.reputations['rats-de-quai'] ?? 0;
    const ligue = p.etat.reputations['ligue-des-phares'] ?? 0;
    p = moteur.executer(p, { type: 'trancher', dilemme: 'le-contrat-de-garance', option: 'denoncer' }).partie;
    expect(p.etat.reputations['ligue-des-phares']).toBe(ligue + 10);
    expect(p.etat.reputations['rats-de-quai']).toBe(rats - 15);
    expect(p.etat.quetes[Q]!.statut).toBe('terminee');
  });

  it('livrer Gaspard à Garance le condamne ; mentir à Garance le sauve (ou rate)', () => {
    const base = verite();
    const livre = moteur.executer(base, { type: 'trancher', dilemme: 'le-contrat-de-garance', option: 'livrer' }).partie;
    expect(livre.etat.pnjEtats['por-gaspard-filet']).toBe('mort');
    let sauve: Partie | undefined;
    for (let g = 1; g < 80 && !sauve; g++) {
      const r = moteur.executer({ ...base, graine: g }, { type: 'trancher', dilemme: 'le-contrat-de-garance', option: 'mentir' });
      if (r.evenements.some((e) => e.type === 'jet' && (e as { jet: { reussite: boolean } }).jet.reussite)) sauve = r.partie;
    }
    expect(sauve!.etat.pnjEtats['por-gaspard-filet']).not.toBe('mort');
  });

  it('payer la caisse règle sans révéler la vérité : le retour est simple', () => {
    const scene = arriver();
    scene.etat.pieces = 80;
    const r = regler(scene, { issue: 'alternative', alternative: 'payer-la-caisse' }).partie;
    expect(r.etat.pieces).toBe(50);
    expect(r.etat.faits).not.toContain('f-por-gaspard-temoin');
    const fin = dire(r, 'por-taverne-du-hareng', 'por-garance-bolle', 'caisse-rendue');
    expect(fin.etat.quetes[Q]!.statut).toBe('terminee');
  });

  it('si on tarde, Gaspard disparaît du marché', () => {
    const p = accepter('por-taverne-du-hareng', 'por-garance-bolle', 'caisse-de-sel', Q);
    p.etat.jauges['maree'] = 3;
    const r = moteur.executer(chez(p, 'por-taverne-du-hareng'), { type: 'aller', vers: 'por-quai-aux-cordes' }).partie;
    expect(r.etat.pnjEtats['por-gaspard-filet']).toBe('parti');
    expect(r.etat.quetes[Q]!.statut).toBe('echouee');
  });
});
