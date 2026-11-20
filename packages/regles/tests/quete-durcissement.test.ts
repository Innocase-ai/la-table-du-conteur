// F3 (20/11/2026), les « dépendances connues » de l'état des lieux des quêtes du 13/11/2026, durcies en additif (P1) :
//  - `recompensesDeQuete` n'additionne plus des fins exclusives (D3) ;
//  - une étape que le monde ne connaît plus ne bloque pas une quête en cours (D2) : déjà réparé par `avancerQuetes`, ici prouvé ;
//  - l'effet direct `quete: active` (et `etape`) respecte `prerequis` (D1, décision du 20/11/2026) : la quête est seulement proposée ;
//  - une `completion` insatisfiable est détectée (D4) : avis `quete.etape-impossible`, voir quete-fiche.test.ts.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appliquerEffets, avancerQuetes, etatInitial, recompensesDeQuete } from '../src/monde/etat';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { Quete, type DonneesMonde } from '../src/monde/schemas';

const marche = (): DonneesMonde => {
  const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
  if (!r.ok) throw new Error('monde illisible');
  return r.monde;
};
const etape = (id: string, extra: Record<string, unknown> = {}) => ({ id, texte: `Étape ${id}.`, completion: { flag: `fait-${id}` }, suivantes: [], ...extra });
const quete = (etapes: unknown[], extra: Record<string, unknown> = {}) =>
  Quete.parse({ id: 'q-essai', nom: 'Quête d’essai', type: 'secondaire', resume: 'Essai.', niveau: { min: 1, max: 1 }, debut: (etapes[0] as { id: string }).id, etapes, recompenses: { xp: 10, pieces: 5, annonce: 'Un merci.' }, ...extra });

/** Ce que `recompensesDeQuete` donnait avant F3 : la somme de toutes les étapes. */
function ancienneSomme(q: ReturnType<typeof quete>) {
  const effets = [...q.recompenses.effets, ...q.etapes.flatMap((x) => x.effets)];
  let xp = q.recompenses.xp;
  let pieces = q.recompenses.pieces;
  for (const f of effets) {
    if ('xp' in f) xp += f.xp;
    else if ('pieces' in f && f.pieces > 0) pieces += f.pieces;
  }
  return { xp, pieces };
}

describe('D3 — ce que rapporte une quête : le déroulé le plus généreux, pas la somme de fins exclusives', () => {
  it('des fins exclusives (deux étapes finales) ne s\'additionnent pas', () => {
    const q = quete([
      etape('debut', { suivantes: ['paix', 'guerre'], effets: [{ xp: 20 }] }),
      etape('paix', { termine: true, effets: [{ xp: 100 }, { pieces: 10 }] }),
      etape('guerre', { termine: true, effets: [{ xp: 300 }] }),
    ]);
    expect(ancienneSomme(q).xp).toBe(10 + 20 + 100 + 300); // annonçait 430 PX
    expect(recompensesDeQuete(q)).toMatchObject({ xp: 10 + 20 + 300, pieces: 5, annonce: 'Un merci.' }); // la fin la plus riche
    // Ce que la partie a vraiment gagné : seulement la branche suivie.
    expect(recompensesDeQuete(q, ['debut', 'paix'])).toMatchObject({ xp: 10 + 20 + 100, pieces: 15 });
    expect(recompensesDeQuete(q, ['debut', 'guerre'])).toMatchObject({ xp: 10 + 20 + 300, pieces: 5 });
    expect(recompensesDeQuete(q, [])).toMatchObject({ xp: 10, pieces: 5 });
  });

  it('des étapes en parallèle s\'accomplissent toutes : leur somme reste juste', () => {
    const q = quete([
      etape('debut', { suivantes: ['a', 'b'], effets: [{ xp: 20 }] }),
      etape('a', { suivantes: ['fin'], effets: [{ xp: 30 }] }),
      etape('b', { suivantes: ['fin'], effets: [{ xp: 40 }] }),
      etape('fin', { termine: true, effets: [{ xp: 50 }] }),
    ]);
    expect(recompensesDeQuete(q).xp).toBe(10 + 20 + 30 + 40 + 50);
    expect(recompensesDeQuete(q).xp).toBe(ancienneSomme(q).xp);
  });

  it('une branche parallèle qui n\'est pas obligatoire (la quête se clôt par une étape finale) compte dans le plus généreux', () => {
    // Comme la quête principale de la Tombe : « comprendre les échecs » est un cul-de-sac parallèle, la quête se clôt à la dernière étape.
    const q = quete([
      etape('debut', { suivantes: ['facultative', 'principale'] }),
      etape('facultative', { effets: [{ xp: 50 }] }),
      etape('principale', { suivantes: ['fin'], effets: [{ xp: 100 }] }),
      etape('fin', { termine: true, effets: [{ xp: 250 }] }),
    ]);
    expect(recompensesDeQuete(q).xp).toBe(10 + 50 + 100 + 250);
  });

  it('les objets et l\'or d\'une branche exclusive ne s\'additionnent pas non plus', () => {
    const q = quete([
      etape('debut', { suivantes: ['voler', 'acheter'] }),
      etape('voler', { termine: true, effets: [{ objet: { id: 'dague' } }, { pieces: 50 }] }),
      etape('acheter', { termine: true, effets: [{ objet: { id: 'dague' } }, { pieces: 20 }] }),
    ]);
    const r = recompensesDeQuete(q);
    expect(r.objets).toEqual(['dague']);
    expect(r.pieces).toBe(5 + 50);
  });

  it('une quête sans embranchement donne EXACTEMENT ce qu\'elle donnait avant (aucun monde publié ne change)', () => {
    let sans = 0;
    let avec = 0;
    for (const dossier of ['dime-des-roseaux', 'marche-d-ombrefiel', 'tombe-des-rois-serpents']) {
      const r = chargerMonde(join(RACINE_MONDES, dossier));
      if (!r.ok) throw new Error(dossier);
      for (const q of r.monde.quetes.values()) {
        const fourche = q.etapes.some((e) => e.suivantes.length > 1);
        const nouveau = recompensesDeQuete(q);
        const ancien = ancienneSomme(q);
        if (!fourche) {
          sans++;
          expect({ xp: nouveau.xp, pieces: nouveau.pieces }, q.id).toEqual(ancien);
        } else {
          avec++;
          expect(nouveau.xp, q.id).toBeLessThanOrEqual(ancien.xp);
        }
      }
    }
    expect(sans).toBeGreaterThan(20);
    expect(avec).toBeGreaterThanOrEqual(1);
  });

  it('un graphe trop grand retombe sur la somme de toutes les étapes (garde-fou), sans planter', () => {
    // 16 étapes en parallèle qui se rejoignent : 2^16 états possibles, au-delà du plafond d'exploration.
    const milieu = Array.from({ length: 16 }, (_, i) => etape(`m${i}`, { suivantes: ['fin'], effets: [{ xp: 1 }] }));
    const q = quete([etape('debut', { suivantes: milieu.map((m) => m.id) }), ...milieu, etape('fin', { termine: true, effets: [{ xp: 100 }] })]);
    expect(recompensesDeQuete(q).xp).toBe(10 + 16 + 100);
  });
});

describe('D2 — une étape supprimée du monde ne bloque pas une quête en cours', () => {
  const monde = (etapes: unknown[]) => {
    const dm = marche();
    dm.quetes.set('q-essai', quete(etapes));
    return dm;
  };

  it('l\'étape active disparaît : la quête reprend aux suites des étapes déjà accomplies', () => {
    // La sauvegarde a été faite quand la quête était a → b → c ; le monde vendu ensuite a renommé b en b2.
    const dm = monde([etape('a', { suivantes: ['b2'] }), etape('b2', { suivantes: ['c'] }), etape('c', { termine: true })]);
    const e = etatInitial(dm);
    e.quetes['q-essai'] = { statut: 'active', actives: ['b'], accomplies: ['a'] };
    avancerQuetes(e, dm);
    expect(e.quetes['q-essai']).toMatchObject({ statut: 'active', actives: ['b2'], accomplies: ['a'] });
    appliquerEffets([{ flag: 'fait-b2' }], e, dm);
    appliquerEffets([{ flag: 'fait-c' }], e, dm);
    expect(e.quetes['q-essai']!.statut).toBe('terminee'); // la quête se termine
    expect(e.xp).toBeGreaterThan(0);
  });

  it('plusieurs étapes actives dont une seule disparaît : l\'autre continue', () => {
    const dm = monde([etape('a', { suivantes: ['b', 'c'] }), etape('b', { termine: true }), etape('c', { termine: true })]);
    const e = etatInitial(dm);
    e.quetes['q-essai'] = { statut: 'active', actives: ['b', 'disparue'], accomplies: ['a'] };
    avancerQuetes(e, dm);
    expect(e.quetes['q-essai']!.actives).toEqual(['b']);
  });

  it('rien de ce que la partie a accompli n\'existe plus : la quête reprend à son début', () => {
    const dm = monde([etape('depart', { suivantes: ['fin'] }), etape('fin', { termine: true })]);
    const e = etatInitial(dm);
    e.quetes['q-essai'] = { statut: 'active', actives: ['ancienne-etape'], accomplies: ['ancienne-etape-faite'] };
    avancerQuetes(e, dm);
    expect(e.quetes['q-essai']).toMatchObject({ statut: 'active', actives: ['depart'] });
  });

  it('une quête terminée ou échouée n\'est jamais rouverte par la réparation', () => {
    const dm = monde([etape('a', { suivantes: ['b'] }), etape('b', { termine: true })]);
    const e = etatInitial(dm);
    e.quetes['q-essai'] = { statut: 'terminee', actives: [], accomplies: ['ancienne'] };
    avancerQuetes(e, dm);
    expect(e.quetes['q-essai']).toMatchObject({ statut: 'terminee', actives: [] });
  });
});

describe('D1 — le prérequis protège aussi un lancement direct (décision du 20/11/2026, docs/FICHES-F3.md, F3-D1 option 1)', () => {
  const avec = (prerequis: unknown) => {
    const dm = marche();
    dm.quetes.set('q-essai', quete([etape('a', { termine: true })], { prerequis }));
    return dm;
  };

  it("prérequis faux : l'effet `quete: active` ne lance pas la quête, il la propose ; rejoué quand le prérequis est vrai, il la lance", () => {
    const dm = avec({ flag: 'jamais-pose' });
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: 'q-essai', statut: 'active' } }], e, dm);
    expect(e.quetes['q-essai']).toMatchObject({ statut: 'proposee', actives: [] });
    appliquerEffets([{ flag: 'jamais-pose' }, { quete: { id: 'q-essai', statut: 'active' } }], e, dm);
    expect(e.quetes['q-essai']).toMatchObject({ statut: 'active', actives: ['a'] });
  });

  it("prérequis vrai : le lancement direct est celui d'avant", () => {
    const dm = avec({ flag: 'pose' });
    const e = etatInitial(dm);
    e.flags['pose'] = true;
    appliquerEffets([{ quete: { id: 'q-essai', statut: 'active' } }], e, dm);
    expect(e.quetes['q-essai']).toMatchObject({ statut: 'active', actives: ['a'] });
  });

  it("l'ordre des effets du lot ne compte pas : le drapeau posé APRÈS l'effet de quête est pris en compte", () => {
    const dm = avec({ flag: 'confiance' });
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: 'q-essai', statut: 'active' } }, { flag: 'confiance' }], e, dm);
    expect(e.quetes['q-essai']).toMatchObject({ statut: 'active', actives: ['a'] });
  });

  it('un effet `etape` ne lance pas non plus une quête dont le prérequis est faux ; une quête déjà en cours ne recule pas', () => {
    const dm = avec({ flag: 'jamais-pose' });
    const e = etatInitial(dm);
    appliquerEffets([{ etape: { quete: 'q-essai', etape: 'a' } }], e, dm);
    expect(e.quetes['q-essai']).toMatchObject({ statut: 'proposee', actives: [], accomplies: [] });
    const e2 = etatInitial(dm);
    e2.quetes['q-essai'] = { statut: 'active', actives: ['a'], accomplies: [] };
    appliquerEffets([{ quete: { id: 'q-essai', statut: 'active' } }], e2, dm);
    expect(e2.quetes['q-essai']).toMatchObject({ statut: 'active', actives: ['a'] });
  });

  it('une quête sans prérequis est lancée exactement comme avant', () => {
    const dm = avec(undefined);
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: 'q-essai', statut: 'active' } }], e, dm);
    expect(e.quetes['q-essai']).toMatchObject({ statut: 'active', actives: ['a'] });
  });
});
