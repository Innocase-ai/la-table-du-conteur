// Ambiances du plateau (21/11/2026) : plancher (`interieur`) et cave (`cave`) ; l'ambiance d'un combat d'histoire suit son
// lieu ; les décors d'une carte doivent avoir leur place dans l'ambiance (pas d'arbre dans une cave).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DECORS_PERMIS, decorsHorsAmbiance, grilleDepuisTexte, INFO_RELIEFS, RELIEFS, reliefDe, TERRAINS, typeCase } from '../src/combat/grille';
import { RENCONTRES } from '../src/combat/prototype';
import { ambianceDeRencontre, ambianceDuLieu } from '../src/monde/ambiance';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';

type L = { id: string; type: string; parent?: string };
const lieux = (...ls: L[]) => new Map(ls.map((l) => [l.id, l])) as never;

describe('ambiance selon le lieu', () => {
  const carte = lieux(
    { id: 'region', type: 'region' },
    { id: 'village', type: 'village', parent: 'region' },
    { id: 'auberge', type: 'batiment', parent: 'village' },
    { id: 'salle-commune', type: 'salle', parent: 'auberge' },
    { id: 'moulin', type: 'lieu-dit', parent: 'region' },
    { id: 'meules', type: 'salle', parent: 'moulin' },
    { id: 'tombe', type: 'donjon', parent: 'region' },
    { id: 'crypte', type: 'salle', parent: 'tombe' },
    { id: 'caveau', type: 'salle', parent: 'crypte' },
    { id: 'antre', type: 'grotte', parent: 'region' },
    { id: 'camp', type: 'camp', parent: 'region' },
    { id: 'tente', type: 'salle', parent: 'camp' },
  );

  it('une salle prend l’ambiance du premier ancêtre qui décide : bâtiment → plancher, donjon → crypte', () => {
    expect(ambianceDuLieu(carte, 'auberge')).toBe('interieur');
    expect(ambianceDuLieu(carte, 'salle-commune')).toBe('interieur');
    expect(ambianceDuLieu(carte, 'crypte')).toBe('souterrain');
    expect(ambianceDuLieu(carte, 'caveau')).toBe('souterrain');
    expect(ambianceDuLieu(carte, 'tente')).toBe('camp');
  });

  it('une salle d’un lieu extérieur (la salle des meules d’un moulin) est un intérieur ; le lieu-dit lui-même est dehors', () => {
    expect(ambianceDuLieu(carte, 'meules')).toBe('interieur');
    expect(ambianceDuLieu(carte, 'moulin')).toBe('foret');
    expect(ambianceDuLieu(carte, 'village')).toBe('foret');
  });

  it('grotte → caverne ; sans lieu ou lieu inconnu → forêt', () => {
    expect(ambianceDuLieu(carte, 'antre')).toBe('caverne');
    expect(ambianceDuLieu(carte, undefined)).toBe('foret');
    expect(ambianceDuLieu(carte, 'nulle-part')).toBe('foret');
  });

  it('l’ambiance déclarée par la rencontre l’emporte toujours (une cave se déclare)', () => {
    expect(ambianceDeRencontre({ lieux: carte }, { lieu: 'salle-commune', terrain: 'cave' })).toBe('cave');
    expect(ambianceDeRencontre({ lieux: carte }, { lieu: 'salle-commune' })).toBe('interieur');
  });

  it('La Foire des Trois Ponts : la cave aux rats est une cave, la salle des meules un plancher', () => {
    const c = chargerMonde(join(RACINE_MONDES, 'la-foire-des-trois-ponts'));
    if (!c.ok) throw new Error('monde invalide');
    expect(ambianceDeRencontre(c.monde, c.monde.rencontres.get('r-rats-de-la-cave')!)).toBe('cave');
    expect(ambianceDeRencontre(c.monde, c.monde.rencontres.get('r-rouquin-au-moulin')!)).toBe('interieur');
  });
});

describe('décors et ambiances', () => {
  it('le tonneau (« o ») est un obstacle bas, comme la caisse', () => {
    const g = grilleDepuisTexte(['.o.']);
    expect(reliefDe(g, { x: 1, y: 0 })).toBe('tonneau');
    expect(typeCase(g, { x: 1, y: 0 })).toBe('obstacle');
    expect(INFO_RELIEFS.tonneau.type).toBe('obstacle');
  });

  it('chaque ambiance a sa liste de décors permis, faite d’éléments connus ; aucun arbre sous un toit', () => {
    expect(Object.keys(DECORS_PERMIS).sort()).toEqual([...TERRAINS].sort());
    for (const t of TERRAINS) for (const r of DECORS_PERMIS[t]) expect(RELIEFS).toContain(r);
    for (const t of ['interieur', 'cave', 'souterrain', 'caverne'] as const) {
      expect(DECORS_PERMIS[t]).not.toContain('arbre');
      expect(DECORS_PERMIS[t]).not.toContain('tronc');
    }
    expect(DECORS_PERMIS.interieur).not.toContain('rocher');
  });

  it('decorsHorsAmbiance repère un arbre dans une cave, une fois, et rien dans une carte conforme', () => {
    expect(decorsHorsAmbiance(['.T.', 'T.o'], 'cave')).toEqual(['arbre']);
    expect(decorsHorsAmbiance(['.co', '#~.'], 'interieur')).toEqual([]);
    expect(decorsHorsAmbiance(['TRt'], 'foret')).toEqual([]);
  });

  it('les cartes du prototype respectent les décors de leur ambiance', () => {
    for (const r of RENCONTRES) expect(decorsHorsAmbiance(r.carte, r.terrain), r.id).toEqual([]);
  });
});
