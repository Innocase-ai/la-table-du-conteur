import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { validerMonde } from '../src/monde/validation';
import { issueRencontre, nouvellePartie } from '../src/monde/exploration';
import { etatInitial } from '../src/monde/etat';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm0 = r.monde;

function partie(moteur: ReturnType<typeof creerMoteur>): Partie {
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine: 11, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
  return p;
}

describe("la salutation d'un PNJ se souvient de ce que le groupe a fait", () => {
  it('une variante dont la condition est vraie remplace la salutation, la première vraie gagne', () => {
    const hesta = dm0.pnj.get('hesta-cendrebrune')!;
    const pnj = new Map(dm0.pnj);
    pnj.set(hesta.id, {
      ...hesta,
      salutations: {
        ...hesta.salutations,
        variantes: [
          { condition: { flag: 'a-sauve-le-village' }, texte: 'Vous… vous êtes revenus. Le village vous doit tout.' },
          { condition: { jauge: { id: 'cendre', min: 3 } }, texte: 'La cendre monte, et vous voilà.' },
        ],
      },
    });
    const moteur = creerMoteur({ dm: { ...dm0, pnj }, srd }, MODULES_STANDARD);
    let p = partie(moteur);
    p = moteur.executer(p, { type: 'aller', vers: 'vei-maison-des-gardiens' }).partie;
    const salut = (q: Partie) => moteur.executer(q, { type: 'parler', pnj: 'hesta-cendrebrune' }).evenements.filter((e) => e.type === 'texte').map((e) => (e as { texte: string }).texte);
    expect(salut(p)).toEqual([hesta.salutations.neutre]);
    p.etat.jauges['cendre'] = 3;
    expect(salut(p)).toEqual(['La cendre monte, et vous voilà.']);
    p.etat.flags['a-sauve-le-village'] = true;
    expect(salut(p)).toEqual(['Vous… vous êtes revenus. Le village vous doit tout.']);
  });

  it('le validateur vérifie les références et les drapeaux des variantes', () => {
    const hesta = dm0.pnj.get('hesta-cendrebrune')!;
    const pnj = new Map(dm0.pnj);
    pnj.set(hesta.id, { ...hesta, salutations: { ...hesta.salutations, variantes: [{ condition: { lieu: 'nulle-part' }, texte: 'x' }, { condition: { flag: 'jamais-pose' }, texte: 'y' }] } });
    const bilan = validerMonde({ ...dm0, pnj }, srd);
    expect(bilan.erreurs.join('\n')).toMatch(/hesta-cendrebrune », salutation : lieu inconnu « nulle-part »/);
    expect(bilan.avertissements.join('\n')).toMatch(/salutation : le drapeau « jamais-pose » est lu mais jamais posé/);
  });
});

describe("conseils du validateur : le rythme, l'horloge et les choix", () => {
  it("signale trop peu de rencontres sans combat, et s'en satisfait quand il y en a assez", () => {
    const bilan = validerMonde(dm0, srd);
    const avis = bilan.avertissements.join('\n');
    const rencontres = [...dm0.rencontres.values()];
    const sans = rencontres.filter((x) => x.type === 'social' || x.type === 'exploration').length;
    expect(sans < rencontres.length * 0.2).toBe(/Rythme :/.test(avis));
    const converties = new Map(dm0.rencontres);
    for (const x of rencontres.filter((y) => y.type === 'combat').slice(0, 12)) converties.set(x.id, { ...x, type: 'social' });
    expect(validerMonde({ ...dm0, rencontres: converties }, srd).avertissements.join('\n')).not.toMatch(/Rythme :/);
    const tous = new Map(rencontres.map((x) => [x.id, { ...x, type: 'combat' as const, difficulte: 'faible' as const }]));
    const faux = validerMonde({ ...dm0, rencontres: tous }, srd).avertissements.join('\n');
    expect(faux).toMatch(/Rythme : 0 rencontre/);
    expect(faux).toMatch(/Tension : 0 rencontre/);
  });

  it("une jauge à peu de paliers, ou qui monte sans qu'on puisse la freiner, est signalée", () => {
    const j = dm0.jauges.get('cendre')!;
    const court = new Map([['cendre', { ...j, paliers: j.paliers.slice(0, 2), evolution: [{ declencheur: 'jour' as const, delta: 1 }] }]]);
    const avis = validerMonde({ ...dm0, jauges: court }, srd).avertissements.join('\n');
    expect(avis).toMatch(/Jauge « cendre » : 2 palier\(s\) ; il en faut au moins 4/);
    // Aucun effet du monde ne baisse la jauge si on retire ces effets : l'avis « rien ne la fait baisser » apparaît.
    const sansLevier = { ...dm0, extensions: {}, jauges: court, quetes: new Map(), pnj: new Map(), rencontres: new Map(), evenements: new Map(), enigmes: new Map(), pieges: new Map(), tresors: new Map() };
    expect(validerMonde(sansLevier as typeof dm0, srd).avertissements.join('\n')).toMatch(/rien ne la fait baisser/);
  });

  it('exige des dilemmes, des pertes possibles et des PNJ réactifs', () => {
    const sansVariantes = new Map([...dm0.pnj].map(([id, p]) => [id, { ...p, salutations: { ...p.salutations, variantes: [] } }]));
    const avis = validerMonde({ ...dm0, extensions: {}, pnj: sansVariantes }, srd).avertissements.join('\n');
    expect(avis).toMatch(/Choix : 0 dilemme/);
    expect(avis).toMatch(/Réactivité : 0 PNJ/);
  });
});

describe('un jet raté fait avancer (fail forward)', () => {
  const base = dm0.rencontres.get('vei-r-embuscade-gobeline')!;
  const groupe = () =>
    groupeConseille(3, srd).emplacements.map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
  const avec = (alt: Record<string, unknown>) => {
    const rencontres = new Map(dm0.rencontres);
    rencontres.set(base.id, { ...base, alternatives: [{ ...base.alternatives[0]!, jet: { competence: 'persuasion' as const, dd: 30 }, ...alt }] });
    const dm = { ...dm0, rencontres };
    return nouvellePartie(dm, etatInitial(dm), groupe(), () => 0);
  };
  const id = base.alternatives[0]!.id;

  it("sans prix d'échec, la rencontre attend toujours (comportement historique)", () => {
    const p = avec({});
    const r = issueRencontre(p, base.id, { type: 'alternative', id });
    expect(r.ok).toBe(false);
    expect(r.combat).toBe(base.id);
    expect(p.etat.rencontresFaites).not.toContain(base.id);
  });

  it("avec un prix d'échec et echecResout, la rencontre se dénoue autrement, plus cher", () => {
    const p = avec({ echec: [{ reputation: { faction: 'gardiens-de-la-veille', delta: -7 } }, { flag: 'a-rate-le-jet' }], echecResout: true });
    const avant = p.etat.reputations['gardiens-de-la-veille'] ?? 0;
    const r = issueRencontre(p, base.id, { type: 'alternative', id });
    expect(r.combat).toBeUndefined();
    expect(p.etat.rencontresFaites).toContain(base.id);
    expect(p.etat.reputations['gardiens-de-la-veille']).toBe(avant - 7);
    expect(p.etat.flags['a-rate-le-jet']).toBe(true);
  });

  it("un prix d'échec seul coûte quelque chose mais la rencontre reste ouverte", () => {
    const p = avec({ echec: [{ flag: 'a-paye' }] });
    const r = issueRencontre(p, base.id, { type: 'alternative', id });
    expect(r.combat).toBe(base.id);
    expect(p.etat.flags['a-paye']).toBe(true);
  });
});
