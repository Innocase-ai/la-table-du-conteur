import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aller, carteDuMonde, creerGenerateur, etatInitial, nouvellePartie, positionAuto, type DonneesMonde } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { readdirSync } from 'node:fs';

const MONDES = readdirSync(RACINE_MONDES, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

function partie(monde: string, lieu?: string) {
  const r = chargerMonde(join(RACINE_MONDES, monde));
  if (!r.ok) throw new Error('monde illisible');
  const dm = r.monde as DonneesMonde;
  const etat = etatInitial(dm);
  if (lieu) {
    etat.lieu = lieu;
    etat.lieuxVisites = [lieu];
  }
  return nouvellePartie(dm, etat, [], creerGenerateur(3));
}

const ids = (v: { marqueurs: { id: string }[] }) => v.marqueurs.map((m) => m.id);

describe('carte du monde (brouillard et repère)', () => {
  it('au départ : le lieu de départ est marqué « ici », seuls les passages connus apparaissent', () => {
    const p = partie('citadelle-des-marees');
    const c = carteDuMonde(p);
    const v = c.vues[c.courant]!;
    const moi = v.marqueurs.filter((m) => m.etat === 'ici');
    expect(moi.map((m) => m.id)).toEqual([p.etat.lieu]);
    expect(c.lieu.id).toBe(p.etat.lieu);
    // tout lieu montré est soit le lieu courant, soit un voisin par un passage non caché
    const total = Object.values(c.vues).reduce((n, x) => n + x.marqueurs.length, 0);
    expect(total).toBeLessThan(p.dm.lieux.size / 2);
  });

  it('un passage caché reste absent jusqu\'à sa découverte', () => {
    for (const monde of MONDES) {
      const p0 = partie(monde);
      const trouve = [...p0.dm.lieux.values()].flatMap((l) => l.liens.filter((k) => k.cache).map((k) => ({ de: l.id, lien: k }))).find(({ de, lien }) => {
        const a = p0.dm.lieux.get(de)!;
        const b = p0.dm.lieux.get(lien.vers)!;
        return b.parent !== de && a.parent !== b.id && !b.liens.some((x) => x.vers === de);
      });
      if (!trouve) continue;
      const p = partie(monde, trouve.de);
      const cible = p.dm.lieux.get(trouve.lien.vers)!;
      const tous = (c: ReturnType<typeof carteDuMonde>) => Object.values(c.vues).flatMap(ids);
      expect(tous(carteDuMonde(p)), `${monde} avant`).not.toContain(cible.id);
      p.etat.exploration.decouverts.push(`lien:${trouve.de}>${cible.id}`);
      const apres = carteDuMonde(p);
      expect(tous(apres), `${monde} après`).toContain(cible.id);
      const m = Object.values(apres.vues).flatMap((x) => x.marqueurs).find((x) => x.id === cible.id)!;
      expect(m.etat).toBe('connu');
      return;
    }
    throw new Error('aucun passage caché trouvé dans les mondes');
  });

  it('aller déplace le repère et le lieu quitté devient « visité »', () => {
    const p = partie('citadelle-des-marees');
    const depart = p.etat.lieu;
    const sortie = Object.values(carteDuMonde(p).vues).flatMap((v) => v.marqueurs).find((m) => m.acces && !m.acces.verrouille && !m.acces.bloque && m.etat === 'connu')!;
    expect(sortie).toBeDefined();
    const r = aller(p, sortie.id);
    expect(r.ok, r.refus).toBe(true);
    const c = carteDuMonde(p);
    const tous = Object.values(c.vues).flatMap((v) => v.marqueurs);
    expect(c.lieu.id).toBe(sortie.id);
    expect(tous.find((m) => m.id === sortie.id)!.etat).toBe('ici');
    expect(tous.find((m) => m.id === depart)!.etat).toBe('visite');
  });

  it('aucune fuite : ni le texte ni le nom d\'un lieu inconnu dans la vue', () => {
    const p = partie('val-des-cendres');
    const c = carteDuMonde(p);
    const json = JSON.stringify(c);
    const montres = new Set(Object.values(c.vues).flatMap(ids));
    const nomsMontres = new Set([...montres].map((id) => p.dm.lieux.get(id)!.nom));
    expect(montres.size).toBeLessThan(p.dm.lieux.size / 2);
    for (const l of p.dm.lieux.values()) {
      if (montres.has(l.id) || l.id === c.lieu.id || Object.keys(c.vues).includes(l.id) || nomsMontres.has(l.nom)) continue;
      expect(json, l.id).not.toContain(`"${l.nom}"`);
      expect(json, l.id).not.toContain(l.resume);
    }
    for (const l of p.dm.lieux.values()) {
      expect(json).not.toContain(l.description);
      expect(json).not.toContain(l.visuel);
    }
  });

  it('ignore les identifiants de lieux qui n\'existent plus (vieilles sauvegardes)', () => {
    const p = partie('citadelle-des-marees');
    p.etat.lieuxVisites.push('lieu-disparu');
    expect(() => carteDuMonde(p)).not.toThrow();
    expect(JSON.stringify(carteDuMonde(p))).not.toContain('lieu-disparu');
  });

  it('la position de l\'auteur est reprise, sinon repli automatique', () => {
    const p = partie('citadelle-des-marees');
    delete p.dm.lieux.get(p.etat.lieu)!.position; // le monde livré peut déjà avoir posé ce lieu
    const c0 = carteDuMonde(p);
    const m0 = c0.vues[c0.courant]!.marqueurs.find((m) => m.id === p.etat.lieu)!;
    expect(m0.auto).toBe(true);
    p.dm.lieux.get(p.etat.lieu)!.position = { x: 12, y: 34 };
    const c1 = carteDuMonde(p);
    const m1 = c1.vues[c1.courant]!.marqueurs.find((m) => m.id === p.etat.lieu)!;
    expect(m1).toMatchObject({ x: 12, y: 34, auto: false });
  });

  for (const monde of MONDES) {
    it(`${monde} : la carte se calcule, positions dans la carte, sans exception`, () => {
      const p = partie(monde);
      p.etat.lieuxVisites = [...p.dm.lieux.keys()];
      const c = carteDuMonde(p);
      expect(Object.keys(c.vues).length).toBeGreaterThan(0);
      expect(c.vues[c.courant]).toBeDefined();
      for (const v of Object.values(c.vues)) for (const m of v.marqueurs) {
        expect(m.x).toBeGreaterThanOrEqual(0);
        expect(m.x).toBeLessThanOrEqual(100);
        expect(m.y).toBeGreaterThanOrEqual(0);
        expect(m.y).toBeLessThanOrEqual(100);
      }
    });
  }
});

describe('positionAuto', () => {
  it('place chaque lieu à un endroit distinct, dans la carte', () => {
    for (const n of [1, 2, 3, 6, 9, 10, 15, 18]) {
      const pts = Array.from({ length: n }, (_, i) => positionAuto(n, i));
      for (const a of pts) {
        expect(a.x).toBeGreaterThanOrEqual(5);
        expect(a.x).toBeLessThanOrEqual(95);
        expect(a.y).toBeGreaterThanOrEqual(5);
        expect(a.y).toBeLessThanOrEqual(95);
      }
      const cles = new Set(pts.map((a) => `${Math.round(a.x)},${Math.round(a.y)}`));
      expect(cles.size, `n=${n}`).toBe(n);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) expect(Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.y - pts[j]!.y), `n=${n} ${i}/${j}`).toBeGreaterThan(6);
    }
  });
});
