// La Tombe des Rois Serpents : relecture des textes de PNJ du 18/11/2026. Ces tests gardent les défauts trouvés ce jour-là :
// un drapeau lu mais jamais posé (le sujet qui en dépendait ne s'ouvrait jamais), un compagnon qui nomme un autre compagnon
// sans savoir s'il est dans le groupe, des renvois vers un PNJ qui n'a aucun sujet là-dessus, des longueurs de réponse.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DonneesMonde } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { validerMonde } from '../src/monde/validation';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'tombe-des-rois-serpents'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde as DonneesMonde;

type Cond = Record<string, unknown> | undefined;
/** Les drapeaux qu'une condition lit, où qu'ils soient dans l'arbre (et, ou, non). */
function drapeaux(c: unknown, sortie: string[] = []): string[] {
  if (!c || typeof c !== 'object') return sortie;
  const o = c as Record<string, unknown>;
  if (typeof o['flag'] === 'string') sortie.push(o['flag']);
  for (const k of ['et', 'ou']) if (Array.isArray(o[k])) for (const x of o[k] as unknown[]) drapeaux(x, sortie);
  if (o['non']) drapeaux(o['non'], sortie);
  return sortie;
}
const mots = (t: string) => t.split(/\s+/).filter(Boolean).length;

describe('Textes de PNJ de la Tombe : défauts de la relecture du 18/11/2026', () => {
  it("aucun drapeau lu par une condition n'est jamais posé (« mireille-recrute » fermait deux sujets)", () => {
    const bilan = validerMonde(dm, srd);
    expect(bilan.avertissements.filter((a) => /jamais posé/.test(a))).toEqual([]);
  });

  it("les sujets « Que pensez-vous des autres ? » de Varnac et de Lysandre s'ouvrent quand les compagnons sont là", () => {
    for (const [pnj, flags] of [
      ['varnac-le-borgne', ['lysandre-recruite', 'mireille-recruite']],
      ['soeur-lysandre', ['varnac-recrute', 'mireille-recruite']],
    ] as const) {
      const s = dm.pnj.get(pnj)!.sujets.find((x) => x.id === 'avis-sur-les-autres')!;
      expect(drapeaux(s.condition).sort(), pnj).toEqual([...flags].sort());
    }
    // Chaque drapeau de recrutement lu est bien posé par le sujet de recrutement du compagnon.
    const poses = JSON.stringify([...dm.pnj.values()].flatMap((p) => p.sujets.map((s) => s.effets)));
    for (const f of ['varnac-recrute', 'lysandre-recruite', 'mireille-recruite']) expect(poses, f).toContain(`"flag":"${f}"`);
  });

  it("un compagnon ne nomme un autre compagnon que si une condition (un drapeau) garantit qu'il est dans le groupe", () => {
    const noms: Record<string, RegExp> = { 'varnac-le-borgne': /Varnac/, 'soeur-lysandre': /Lysandre/, 'mireille-cartographe': /Mireille/ };
    const interjections = ((dm.extensions?.['interjections'] ?? []) as { id: string; pnj: string; quand: Cond; texte: string }[]).filter((x) => x.pnj in noms);
    expect(interjections.length).toBeGreaterThan(100);
    for (const x of interjections)
      for (const [autre, re] of Object.entries(noms))
        if (autre !== x.pnj && re.test(x.texte)) expect(drapeaux(x.quand).length, `${x.id} nomme ${autre} sans condition de présence`).toBeGreaterThan(0);
  });

  it("les renvois « demandez à … » mènent à un PNJ qui a un sujet là-dessus", () => {
    const sujet = (pnj: string, id: string) => dm.pnj.get(pnj)!.sujets.find((s) => s.id === id);
    // Lise → Jehan (la vapeur des cercueils) ; Nolan → Gaspard et Lise (l'arbre mort, les corbeaux) ; Solène → Balthazar (les morts).
    expect(sujet('lise-guetteuse', 'anciens-pilleurs')!.reponse).toMatch(/Jehan, à la tranchée/);
    expect(sujet('jehan-fosseyeur', 'odeur-cercueils')).toBeDefined();
    expect(sujet('nolan-palefrenier', 'rumeurs-des-gamins')!.reponse).toMatch(/Gaspard.*Lise/);
    expect(sujet('gaspard-muletier', 'arbre-mort-ouest')).toBeDefined();
    expect(sujet('lise-guetteuse', 'traces-corbeaux')).toBeDefined();
    expect(sujet('solene-caravaniere', 'solene-caravaniere-legende-rois')!.reponse).toMatch(/frère Balthazar/);
    expect(sujet('frere-balthazar', 'prier-pour-les-morts')).toBeDefined();
    // Marta renvoie vers le commandant, qui a bien un sujet sur les terriers (ouvert par l'intuition).
    expect(sujet('marta-aubergiste', 'rumeur-de-la-falaise')!.reponse).toMatch(/interrogez le commandant/);
    expect(sujet('commandeur-garin', 'les-terriers-de-la-falaise')).toBeDefined();
  });

  it("Solène ne conseille que du matériel qu'elle vend", () => {
    const solene = dm.pnj.get('solene-caravaniere')!;
    const stock = new Set((solene.boutique?.stock ?? []).map((x) => x.objet));
    const conseil = solene.sujets.find((s) => s.id === 'materiel-souterrain')!.reponse;
    expect(conseil).not.toMatch(/miroir/i);
    for (const [mot, objet] of [['trousse de soins', 'trousse-de-soins'], ['corde', 'corde'], ['boîte à amadou', 'boite-a-amadou'], ['billes', 'billes']] as const) {
      expect(conseil, mot).toContain(mot);
      expect(stock.has(objet), `${objet} est en vente chez Solène`).toBe(true);
    }
  });

  it("les nombres de l'histoire s'accordent : cinq nuits d'horloge (Rodrigue), Pierrot est bien descendu (Brennan)", () => {
    expect(dm.pnj.get('sergent-rodrigue')!.sujets.find((s) => s.id === 'patrouilles-du-val')!.reponse).toMatch(/cinq nuits/);
    const brennan = dm.pnj.get('brennan-terrassier')!.sujets.find((s) => s.id === 'ouverture-tranchee')!.reponse;
    expect(brennan).toMatch(/Pierrot/);
    expect(dm.pnj.get('jehan-fosseyeur')!.sujets.find((s) => s.id === 'odeur-cercueils')!.reponse).toMatch(/Pierrot/);
    expect(dm.pnj.get('torin-armurier')!.sujets.find((s) => s.id === 'boucliers-trophees')!.reponse).not.toMatch(/bouclier du fort/);
  });

  it('toutes les réponses de PNJ font entre 60 et 120 mots, au discours direct, sans faute de frappe connue', () => {
    for (const p of dm.pnj.values())
      for (const s of p.sujets)
        for (const t of [s.reponse, ...s.variantes.map((v) => v.reponse)]) {
          expect(mots(t), `${p.id} / ${s.id}`).toBeGreaterThanOrEqual(60);
          expect(mots(t), `${p.id} / ${s.id}`).toBeLessThanOrEqual(120);
          expect(t, `${p.id} / ${s.id} : « les la »`).not.toMatch(/\bles la\b/);
        }
  });
});
