import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

// Les trois contrats de Lame-Rousse : « Le chargement de Gorm » (rival), « La lame fendue » (traque), « La veille du camp » (défense en deux vagues).
const srd = chargerDonneesSrd();
const c = chargerMonde(join(MONDES_ESSAI, 'ombresang'));
if (!c.ok) throw new Error(c.erreurs.map((e) => e.message).join('\n'));
const moteur = creerMoteur({ dm: c.monde, srd }, MODULES_STANDARD);

function depart(): Partie {
  const g = groupeConseille(4, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine: 7, niveau: 1 }), { type: 'commencer' }).partie;
  // L'histoire s'ouvre sur le combat de la place : on le gagne pour retrouver l'exploration libre.
  for (let i = 0; i < 4 && p.scene.type === 'rencontre'; i++) p = moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire', px: 0 } as never).partie;
  expect(p.scene.type).toBe('exploration');
  return p;
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

/** Accepte un contrat auprès de son donneur (après d'éventuels sujets préalables) et vérifie qu'il est actif. */
function accepter(lieu: string, pnj: string, sujet: string, quete: string, avant: string[] = []): Partie {
  let p = depart();
  for (const s of avant) p = dire(p, lieu, pnj, s);
  p = dire(p, lieu, pnj, sujet);
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
const propose = (p: Partie, alternative: string): boolean => moteur.propositions(p).some((x) => (x.ordre as { alternative?: string } | undefined)?.alternative === alternative);

describe('contrat « Le chargement de Gorm » (rival au campement)', () => {
  const Q = 'le-chargement-de-gorm';
  const R = 'les-mercenaires-du-campement';
  const lancer = (): Partie => {
    const p = accepter('lr-forges', 'gorm-meule', 'chargement', Q);
    const s = moteur.executer(chez(p, 'lr-foret-allee'), { type: 'aller', vers: 'lr-foret-campement' }).partie;
    expect(s.scene).toEqual({ type: 'rencontre', rencontre: R });
    return s;
  };

  it('sans la quête, le campement est désert', () => {
    const s = moteur.executer(chez(depart(), 'lr-foret-allee'), { type: 'aller', vers: 'lr-foret-campement' }).partie;
    expect(s.scene.type).toBe('exploration');
  });

  it('combat : la victoire libère la charrette, Gorm paie au retour (pièces, outils, confiance)', () => {
    let p = regler(lancer(), { issue: 'victoire', px: 50 }).partie;
    expect(p.etat.flags['lr-chargement-recupere']).toBe(true);
    const pieces = p.etat.pieces;
    const attitude = p.etat.attitudes['gorm-meule'] ?? 0;
    p = dire(p, 'lr-forges', 'gorm-meule', 'chargement-retour');
    expect(p.etat.quetes[Q]!.statut).toBe('terminee');
    expect(p.etat.pieces).toBe(pieces + 30);
    expect(p.etat.inventaire['outils-de-forgeron']).toBeGreaterThanOrEqual(1);
    expect(p.etat.attitudes['gorm-meule']).toBe(attitude + 10);
  });

  it('persuader les mercenaires réussit ou échoue sans régler ; payer leur part coûte 25 po et la patience de Gorm', () => {
    const scene = lancer();
    const { reussi, rate } = essais(scene, 'parler-d-abord');
    expect(reussi!.partie.etat.flags['lr-chargement-recupere']).toBe(true);
    expect(rate!.partie.etat.flags['lr-chargement-recupere']).toBeUndefined();
    expect(rate!.partie.scene.type).toBe('rencontre');
    scene.etat.pieces = 10;
    expect(propose(scene, 'payer-leur-part')).toBe(false);
    scene.etat.pieces = 60;
    const avant = scene.etat.attitudes['gorm-meule'] ?? 0;
    const r = regler(scene, { issue: 'alternative', alternative: 'payer-leur-part' });
    expect(r.partie.etat.pieces).toBe(35);
    expect(r.partie.etat.attitudes['gorm-meule']).toBe(avant - 5);
    expect(r.partie.etat.flags['lr-chargement-recupere']).toBe(true);
    expect(r.partie.etat.flags['lr-mercenaires-payes']).toBe(true);
  });
});

describe('contrat « La lame fendue » (traque légère)', () => {
  const Q = 'la-lame-fendue';
  const R = 'le-rongeur-de-l-allee';
  const FAIT_ODILE = 'f-lr-rouille-de-nuit';
  const lancer = (): Partie => {
    const p = accepter('lr-auberge', 'odile-braise', 'feuille-de-l-allee', Q, ['contrats']);
    expect(p.etat.faits).toContain(FAIT_ODILE);
    const s = moteur.executer(chez(p, 'lr-foret-lisiere'), { type: 'aller', vers: 'lr-foret-allee' }).partie;
    expect(s.scene).toEqual({ type: 'rencontre', rencontre: R });
    return s;
  };

  it('la feuille d’Odile n’est lisible qu’après le tableau, et la clairière reste calme sans la quête', () => {
    const q = moteur.executer(chez(depart(), 'lr-auberge'), { type: 'parler', pnj: 'odile-braise', sujet: 'feuille-de-l-allee' });
    expect(q.partie.etat.quetes[Q]?.statut).toBeUndefined();
    const s = moteur.executer(chez(depart(), 'lr-foret-lisiere'), { type: 'aller', vers: 'lr-foret-allee' }).partie;
    expect(s.scene.type).toBe('exploration');
  });

  it('les trois sources : Odile ouvre la rencontre ; la lame fendue (Survie) et la pioche du campement ouvrent l’issue sans combat', () => {
    const lieux = [...c.monde.lieux.values()].filter((l) => l.faits.some((f) => ['f-lr-lame-fendue-rongee', 'f-lr-pioche-rongee'].includes(f.fait))).map((l) => l.id);
    expect(lieux.sort()).toEqual(['lr-foret-allee', 'lr-foret-campement']);
    const scene = lancer();
    expect(propose(scene, 'detourner-avec-de-la-ferraille')).toBe(false);
    scene.etat.faits.push('f-lr-pioche-rongee');
    expect(propose(scene, 'detourner-avec-de-la-ferraille')).toBe(true);
  });

  it('combat : la victoire règle la traque, Odile paie au retour', () => {
    let p = regler(lancer(), { issue: 'victoire', px: 50 }).partie;
    expect(p.etat.flags['lr-rongeur-regle']).toBe(true);
    const pieces = p.etat.pieces;
    p = dire(p, 'lr-auberge', 'odile-braise', 'feuille-de-l-allee-retour');
    expect(p.etat.quetes[Q]!.statut).toBe('terminee');
    expect(p.etat.pieces).toBe(pieces + 40);
  });

  it('détourner la bête avec de la ferraille règle aussi la traque (jet raté : on se bat)', () => {
    const scene = lancer();
    scene.etat.faits.push('f-lr-lame-fendue-rongee');
    const { reussi, rate } = essais(scene, 'detourner-avec-de-la-ferraille');
    expect(reussi!.partie.etat.flags['lr-rongeur-regle']).toBe(true);
    expect(reussi!.partie.etat.flags['lr-rongeur-detourne']).toBe(true);
    expect(rate!.partie.etat.flags['lr-rongeur-regle']).toBeUndefined();
    expect(rate!.partie.scene.type).toBe('rencontre');
  });
});

describe('contrat « La veille du camp » (défense en deux vagues)', () => {
  const Q = 'la-veille-du-camp';
  const V1 = 'veille-du-camp-premiere-volee';
  const V2 = 'veille-du-camp-assaut';
  const vague1 = (): Partie => {
    const p = accepter('lr-camp-refugies', 'mira-sorel', 'veille-du-camp', Q);
    const s = moteur.executer(chez(p, 'lr-camp-refugies'), { type: 'seReposer', duree: 'court' }).partie;
    expect(s.scene).toEqual({ type: 'rencontre', rencontre: V1 });
    return s;
  };

  it('sans la quête, une halte au camp ne déclenche rien', () => {
    const s = moteur.executer(chez(depart(), 'lr-camp-refugies'), { type: 'seReposer', duree: 'court' }).partie;
    expect(s.scene.type).toBe('exploration');
  });

  it('on atteint le camp par le tablier du viaduc', () => {
    const p = moteur.executer(chez(depart(), 'lr-viaduc-tablier'), { type: 'aller', vers: 'lr-camp-refugies' });
    expect(p.refus).toBeUndefined();
    expect(p.partie.etat.lieu).toBe('lr-camp-refugies');
  });

  it('combat : la première volée appelle l’assaut, la victoire finale défend le camp ; Mira se confie davantage au retour', () => {
    let p = regler(vague1(), { issue: 'victoire', px: 30 }).partie;
    expect(p.scene).toEqual({ type: 'rencontre', rencontre: V2 });
    p = regler(p, { issue: 'victoire', px: 40 }).partie;
    expect(p.etat.flags['lr-camp-defendu']).toBe(true);
    const attitude = p.etat.attitudes['mira-sorel'] ?? 0;
    p = dire(p, 'lr-camp-refugies', 'mira-sorel', 'veille-du-camp-retour');
    expect(p.etat.quetes[Q]!.statut).toBe('terminee');
    expect(p.etat.attitudes['mira-sorel']).toBe(attitude + 15);
  });

  it('rassembler le fer (Athlétisme) : la seconde vague se règle sans combat ; raté, il faut se battre', () => {
    const scene = vague1();
    const { reussi, rate } = essais(scene, 'rassembler-le-fer');
    expect(rate!.partie.etat.flags['lr-camp-fortifie']).toBeUndefined();
    expect(rate!.partie.scene).toEqual({ type: 'rencontre', rencontre: V1 });
    expect(reussi!.partie.etat.flags['lr-camp-fortifie']).toBe(true);
    expect(reussi!.partie.scene).toEqual({ type: 'rencontre', rencontre: V2 });
    const fin = regler(reussi!.partie, { issue: 'alternative', alternative: 'laisser-les-lames-sur-le-tas' }).partie;
    expect(fin.etat.flags['lr-camp-defendu']).toBe(true);
  });

  it('sans le fer rassemblé, l’issue sans combat de la seconde vague n’est pas offerte', () => {
    const p = regler(vague1(), { issue: 'victoire', px: 30 }).partie;
    expect(propose(p, 'laisser-les-lames-sur-le-tas')).toBe(false);
  });
});
