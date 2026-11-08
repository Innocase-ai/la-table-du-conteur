import { describe, expect, it } from 'vitest';
import { resumerCompletude, verifierCompletude, type EntreesCompletude } from '../src/monde/completude';
import type { DonneesMonde } from '../src/monde/schemas';

// Un monde minimal : le moteur de complétude ne lit que quelques champs, le reste est vide.
function monde(extra: Partial<DonneesMonde> = {}): DonneesMonde {
  const lieu = (id: string, parent?: string) => [id, { id, nom: id, type: 'salle', parent, resume: 'r', description: 'd', visuel: 'v', arrivee: 'a', accroche: parent ? 'x' : undefined, liens: [], position: undefined }];
  const lieux = new Map<string, unknown>([lieu('parent'), ...['a', 'b', 'c', 'd', 'e'].map((i) => lieu(i, 'parent'))] as [string, unknown][]);
  return {
    monde: { id: 'test', statut: 'publie', chapitres: [{ quetes: [] }] },
    lieux,
    pnj: new Map([['vorn', { id: 'vorn', nom: 'Vorn', boutique: undefined, inventaire: [] }]]),
    objets: new Map([['cle', { id: 'cle', nom: 'Clé' }]]),
    tresors: new Map([['t', { id: 't', contenu: { objets: [{ objet: 'epee-longue' }, { objet: 'objet-rare' }] } }]]),
    quetes: new Map(),
    fins: new Map([['fin-a', { id: 'fin-a', nom: 'Fin A' }]]),
    ...extra,
  } as unknown as DonneesMonde;
}

const entrees = (dm: DonneesMonde, e: Partial<EntreesCompletude> = {}): EntreesCompletude => ({
  dm,
  manifeste: { lieux: {}, pnj: {}, monstres: {}, objets: {}, cartes: {} },
  imagesCommunes: new Set(['epee-longue']),
  idImageCommune: (id) => id,
  scenes: [],
  voix: new Set(),
  estimationPresente: false,
  ...e,
});

describe('complétude d’un monde', () => {
  it('signale les images, la carte, l’ouverture et l’estimation qui manquent', () => {
    const ecarts = verifierCompletude(entrees(monde()));
    const cibles = ecarts.filter((e) => e.gravite === 'manque').map((e) => `${e.categorie}:${e.cible}`);
    expect(cibles).toContain('images:vorn');
    expect(cibles).toContain('images:cle');
    expect(cibles).toContain('images:objet-rare');
    expect(cibles).not.toContain('images:epee-longue');
    expect(cibles).toContain('cartes:parent');
    expect(cibles).toContain('scenes:ouverture');
    expect(cibles).toContain('publication:estimation.json');
    expect(resumerCompletude(ecarts).get('cartes')?.manque).toBe(1);
  });

  it('ne signale plus rien quand tout est livré, sauf les positions sur la carte', () => {
    const dm = monde();
    const manifeste = {
      lieux: Object.fromEntries([...dm.lieux.keys()].map((id) => [id, `${id}.webp`])),
      pnj: { vorn: 'vorn.webp' }, monstres: {}, objets: { cle: 'cle.webp', 'objet-rare': 'x.webp' }, cartes: { parent: 'carte.webp' },
    };
    const ecarts = verifierCompletude(
      entrees(dm, {
        manifeste,
        imagesCommunes: new Set(['epee-longue', 'objet-rare']),
        scenes: [{ id: 'ouverture', declencheur: { debut: true }, plans: [{ image: { groupe: 'lieux', id: 'a' } }] }, { id: 'fin-a', declencheur: { fin: 'fin-a' }, plans: [{}] }],
        voix: new Set(['ouverture-1', 'fin-a-1']),
        estimationPresente: true,
      }),
    );
    expect(ecarts.filter((e) => e.gravite === 'manque')).toEqual([]);
    expect(ecarts.filter((e) => e.categorie === 'positions')).toHaveLength(5);
  });

  it('signale une voix absente et une image de scène hors manifeste', () => {
    const dm = monde();
    const ecarts = verifierCompletude(entrees(dm, { scenes: [{ id: 'ouverture', declencheur: { debut: true }, plans: [{ image: { groupe: 'lieux', id: 'absent' } }] }] }));
    const c = ecarts.filter((e) => e.categorie === 'scenes' || e.categorie === 'voix').map((e) => `${e.categorie}:${e.cible}`);
    expect(c).toContain('scenes:ouverture-1');
    expect(c).toContain('voix:ouverture-1');
  });
});
