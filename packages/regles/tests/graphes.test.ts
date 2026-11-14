import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { grapheAutour, grapheDependancesFin, grapheLieux, grapheQuete, indexerReferences, lieuxAtteints, lieuxParents, statutDrapeaux, type DonneesMonde, type Graphe } from '../src';
import { chargerMonde, listerMondes, RACINE_MONDES } from '../src/monde/chargeur';

const MINI = join(import.meta.dirname, 'fixtures/mini-monde');

function charger(dossier: string): DonneesMonde {
  const r = chargerMonde(dossier);
  if (!r.ok) throw new Error(r.erreurs.map((e) => `${e.fichier}: ${e.message}`).join('\n'));
  return r.monde;
}

/** Toute arête relie deux nœuds du graphe, et chaque id de nœud est unique. */
function coherent(g: Graphe): void {
  const ids = g.noeuds.map((n) => n.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const a of g.aretes) {
    expect(ids).toContain(a.de);
    expect(ids).toContain(a.vers);
  }
}

describe('graphe des lieux', () => {
  it('dessine les liens, le parent / enfant et les sens uniques du mini-monde', () => {
    const dm = charger(MINI);
    const g = grapheLieux(dm);
    coherent(g);
    expect(g.noeuds.map((n) => n.id).sort()).toEqual(['auberge', 'grotte', 'sentier', 'village']);
    expect(g.noeuds.every((n) => n.etat === 'ok')).toBe(true);
    expect(g.aretes.find((a) => a.de === 'village' && a.vers === 'sentier')).toMatchObject({ genre: 'lien', marques: ['heures'] });
    // L'auberge n'a pas de lien propre avec le village : le parent / enfant la rattache.
    expect(g.aretes.find((a) => a.genre === 'parent')).toMatchObject({ de: 'village', vers: 'auberge' });
  });

  it('marque verrou, passage caché, condition et sens unique, et ne dessine qu’une fois un double sens déclaré des deux côtés', () => {
    const dm = charger(MINI);
    dm.lieux.get('sentier')!.liens.push({ vers: 'village', type: 'chemin', heures: 0, sens: 'double' });
    dm.lieux.get('grotte')!.liens.push({ vers: 'sentier', type: 'passage-secret', heures: 0, sens: 'simple', cache: { dd: 15, competence: 'perception' }, verrou: { dd: 12 }, condition: { flag: 'x' } });
    const g = grapheLieux(dm);
    expect(g.aretes.filter((a) => a.genre === 'lien' && [a.de, a.vers].sort().join() === 'sentier,village')).toHaveLength(1);
    expect(g.aretes.find((a) => a.de === 'grotte' && a.vers === 'sentier')?.marques).toEqual(['sens-unique', 'verrou', 'cache', 'condition']);
  });

  it('signale un lieu inaccessible et limite une vue à un lieu et ses descendants, avec les voisins en « externe »', () => {
    const dm = charger(MINI);
    dm.lieux.set('ile', { ...dm.lieux.get('grotte')!, id: 'ile', nom: 'Île', parent: undefined, liens: [] });
    expect(lieuxAtteints(dm).has('ile')).toBe(false);
    expect(grapheLieux(dm).noeuds.find((n) => n.id === 'ile')?.etat).toBe('inaccessible');
    const sous = grapheLieux(dm, 'village');
    coherent(sous);
    expect(sous.noeuds.find((n) => n.id === 'village')?.etat).toBe('ok');
    expect(sous.noeuds.find((n) => n.id === 'sentier')?.etat).toBe('externe');
    expect(sous.noeuds.some((n) => n.id === 'grotte')).toBe(false);
    expect(lieuxParents(dm)).toEqual([{ id: 'village', nom: 'Brindoux', descendants: 1 }]);
  });
});

describe('graphe des dépendances d’une fin', () => {
  it('remonte de la fin à ce qui la déclenche, en marquant les drapeaux que rien ne pose', () => {
    const dm = charger(MINI);
    dm.fins.set('fin-flag', { id: 'fin-flag', nom: 'F', condition: { et: [{ flag: 'pose' }, { flag: 'jamais' }] }, epilogue: 'x', variantes: [], consequences: [] });
    dm.evenements.set('ev-pose', { id: 'ev-pose', declencheur: 'condition', unique: true, narration: 'x', condition: { fait: 'f-taniere' }, effets: [{ flag: 'pose' }] });
    const g = grapheDependancesFin(dm, indexerReferences(dm), 'fin-flag');
    coherent(g);
    const par = (id: string) => g.noeuds.find((n) => n.id === id);
    expect(par('fins:fin-flag')).toBeDefined();
    expect(par('flag:pose')?.etat).toBe('ok');
    expect(par('flag:jamais')?.etat).toBe('orphelin');
    expect(par('evenements:ev-pose')).toBeDefined();
    // Le fait exigé par l'événement est lui aussi dans la vue (deuxième niveau).
    expect(par('fait:f-taniere')).toBeDefined();
    expect(g.aretes).toContainEqual({ de: 'flag:pose', vers: 'evenements:ev-pose', genre: 'produit-par' });
  });

  it('une vue trop grande est coupée et le dit', () => {
    const dm = charger(MINI);
    const g = grapheDependancesFin(dm, indexerReferences(dm), 'fin-paix', { max: 2 });
    expect(g.tronque).toBe(true);
    expect(g.noeuds.length).toBeLessThanOrEqual(3);
  });
});

describe('drapeaux et quêtes', () => {
  it('classe les drapeaux : lus jamais posés d’abord, puis posés jamais lus', () => {
    const dm = charger(MINI);
    dm.evenements.set('ev-a', { id: 'ev-a', declencheur: 'condition', unique: true, narration: 'x', condition: { flag: 'lu-seul' }, effets: [{ flag: 'pose-seul' }, { flag: 'les-deux' }] });
    dm.evenements.set('ev-b', { id: 'ev-b', declencheur: 'condition', unique: true, narration: 'x', condition: { flag: 'les-deux' }, effets: [] });
    const s = statutDrapeaux(indexerReferences(dm));
    expect(s.map((x) => [x.id, x.etat])).toEqual([['croc-remis', 'lu-jamais-pose'], ['lu-seul', 'lu-jamais-pose'], ['meute-battue', 'pose-jamais-lu'], ['pose-seul', 'pose-jamais-lu'], ['les-deux', 'ok']]);
    const g = grapheAutour(dm, indexerReferences(dm), 'flag', 'les-deux');
    coherent(g);
    expect(g.aretes).toEqual(expect.arrayContaining([{ de: 'evenements:ev-a', vers: 'flag:les-deux', genre: 'produit' }, { de: 'flag:les-deux', vers: 'evenements:ev-b', genre: 'lu-par' }]));
  });

  it('les drapeaux posés automatiquement par un dilemme ne comptent pas comme « posés jamais lus »', () => {
    const dm = charger(MINI);
    dm.extensions = {
      ...dm.extensions,
      dilemmes: [{ id: 'le-pacte', titre: 'Le pacte', situation: 'x', quand: { lieu: 'village' }, options: [{ id: 'oui', libelle: 'Oui', couts: ['a'], gains: ['b'] }, { id: 'non', libelle: 'Non', couts: ['a'], gains: ['b'] }], abstention: { couts: ['c'] } }],
    };
    dm.evenements.set('ev-lit', { id: 'ev-lit', declencheur: 'condition', unique: true, narration: 'x', condition: { flag: 'choix-le-pacte-oui' }, effets: [] });
    const s = statutDrapeaux(indexerReferences(dm));
    expect(s.find((x) => x.id === 'choix-le-pacte-oui')?.etat).toBe('ok');
    expect(s.find((x) => x.id === 'choix-le-pacte-non')?.etat).toBe('choix');
    expect(s.find((x) => x.id === 'choix-le-pacte')?.etat).toBe('choix');
  });

  it('dessine les étapes d’une quête avec leur départ et leur fin', () => {
    const dm = charger(MINI);
    const g = grapheQuete(dm, 'q-loups');
    coherent(g);
    expect(g.noeuds.map((n) => [n.id, n.genre])).toEqual([['tuer-alpha', 'etape-debut'], ['rapporter', 'etape-finale']]);
    expect(g.aretes).toEqual([{ de: 'tuer-alpha', vers: 'rapporter', genre: 'suite' }]);
    expect(grapheQuete(dm, 'inconnue').noeuds).toEqual([]);
  });
});

describe.each(listerMondes())('graphes de « %s »', (id) => {
  const dm = charger(join(RACINE_MONDES, id));
  const idx = indexerReferences(dm);

  it('la carte des lieux et chaque sous-carte sont cohérentes', () => {
    const g = grapheLieux(dm);
    coherent(g);
    expect(g.noeuds).toHaveLength(dm.lieux.size);
    for (const p of lieuxParents(dm).slice(0, 6)) coherent(grapheLieux(dm, p.id));
  });

  it('chaque fin et chaque quête ont un graphe cohérent', () => {
    for (const f of dm.fins.keys()) {
      const g = grapheDependancesFin(dm, idx, f);
      coherent(g);
      expect(g.noeuds.length).toBeGreaterThan(0);
    }
    for (const q of dm.quetes.keys()) coherent(grapheQuete(dm, q));
  });
});
