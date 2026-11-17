import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerMonde } from '../src/monde/chargeur';
import { Lieu, Quete } from '../src/monde/schemas';
import { avisQuetesSautables } from '../src/monde/quete-sautable';
import { MONDES_ESSAI } from './mondes-essai';

const r = chargerMonde(join(MONDES_ESSAI, 'port-sillage'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const base = r.monde;

const QUETE = 'q-essai';
const condition = { quete: { id: QUETE, statut: 'active' as const } };

/** Un monde où une cave n'est joignable que par un passage caché depuis le départ, et une quête qui s'y rend. */
function monde(opts: { condition?: boolean; sujetDebloque?: 'sans-quete' | 'avec-quete' | 'aucun' } = {}) {
  const dm = structuredClone(base);
  const depart = dm.monde.depart.lieu;
  const lieuDepart = dm.lieux.get(depart)!;
  dm.lieux.set('cave-essai', Lieu.parse({ id: 'cave-essai', nom: 'Cave d’essai', type: 'salle', parent: depart, resume: 'Une cave.', description: 'Une cave.', visuel: 'Une cave sombre.' }));
  lieuDepart.liens = [...lieuDepart.liens, { vers: 'cave-essai', type: 'passage', heures: 0, sens: 'simple', cache: { dd: 12, competence: 'perception' }, ...(opts.condition ? { condition } : {}) }];
  dm.quetes.set(QUETE, Quete.parse({
    id: QUETE, nom: 'Essai', type: 'principale', resume: 'Une quête d’essai.', niveau: { min: 1, max: 2 }, debut: 'aller',
    etapes: [{ id: 'aller', texte: 'Descendez à la cave.', completion: { lieu: 'cave-essai' }, suivantes: [], termine: true }],
    recompenses: {},
  }));
  if (opts.sujetDebloque && opts.sujetDebloque !== 'aucun') {
    const pnj = [...dm.pnj.values()][0]!;
    pnj.sujets = [...pnj.sujets, { id: 'sujet-essai', mots: ['cave'], question: 'Où est la cave ?', reponse: 'Là.', effets: [...(opts.sujetDebloque === 'avec-quete' ? [{ quete: { id: QUETE, statut: 'active' as const } }] : []), { debloquer: 'cave-essai' }], unique: false, revele: [], variantes: [] } as never];
  }
  return dm;
}
const avisEssai = (dm: ReturnType<typeof monde>) => avisQuetesSautables(dm).filter((a) => a.includes(QUETE));

describe('quête sautable : l’objectif ne doit pas s’atteindre sans la quête', () => {
  it('un objectif joignable par un passage libre (même caché) : avis', () => {
    const av = avisEssai(monde());
    expect(av).toHaveLength(1);
    expect(av[0]).toContain('cave-essai');
  });
  it('un passage qui exige la quête : plus d’avis', () => {
    expect(avisEssai(monde({ condition: true }))).toEqual([]);
  });
  it('un sujet qui débloque le passage sans démarrer la quête : avis (debloquer contourne la condition)', () => {
    const av = avisEssai(monde({ condition: true, sujetDebloque: 'sans-quete' }));
    expect(av).toHaveLength(1);
    expect(av[0]).toContain('sujet-essai');
  });
  it('un sujet qui débloque ET démarre la quête : rien à signaler', () => {
    expect(avisEssai(monde({ condition: true, sujetDebloque: 'avec-quete' }))).toEqual([]);
  });
  it('seules les quêtes principales sont concernées (une quête annexe se valide après coup)', () => {
    const dm = monde();
    dm.quetes.set(QUETE, { ...dm.quetes.get(QUETE)!, type: 'secondaire' });
    expect(avisEssai(dm)).toEqual([]);
  });
});

describe('le Médaillon de la Sœur Endormie : une enquête, pas une piste droite', () => {
  const reel = chargerMonde(join(__dirname, '..', '..', 'mondes', 'le-medaillon-de-la-soeur-endormie'));
  it('aucune quête sautable', () => {
    if (!reel.ok) throw new Error(reel.erreurs.map((e) => e.message).join('\n'));
    expect(avisQuetesSautables(reel.monde)).toEqual([]);
  });
  it('les ruines exigent la quête active ET les traces comprises ; l’étape d’enquête les pose', () => {
    if (!reel.ok) throw new Error('monde invalide');
    const lien = reel.monde.lieux.get('villambrune')!.liens.find((l) => l.vers === 'ruines-de-la-chapelle-brulee')!;
    expect(JSON.stringify(lien.condition)).toContain('le-medaillon-vole');
    expect(JSON.stringify(lien.condition)).toContain('traces-comprises');
    const enquete = reel.monde.quetes.get('le-medaillon-vole')!.etapes.find((e) => e.id === 'enqueter')!;
    expect(enquete.effets).toContainEqual({ flag: 'traces-comprises' });
    expect(JSON.stringify(enquete.completion)).toContain('f-boue-de-cendre');
  });
  it('plusieurs pistes mènent à des indices : examens, petits combats, témoin', () => {
    if (!reel.ok) throw new Error('monde invalide');
    expect(reel.monde.rencontres.has('r-chiens-errants')).toBe(true);
    expect(reel.monde.rencontres.has('r-rats-de-la-cave')).toBe(true);
    expect(JSON.stringify(reel.monde.rencontres.get('r-bandit-estropie'))).toContain('f-temoin-du-bandit');
  });
});
