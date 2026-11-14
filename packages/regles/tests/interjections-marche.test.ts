// La Marche d'Ombrefiel : Varek et Mireille réagissent d'eux-mêmes quand ils voyagent avec le groupe.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { interjectionsDe } from '../src/monde/interjections-donnees';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
const textes = (evs: { type: string }[]) => evs.filter((e) => e.type === 'texte').map((e) => e as unknown as { texte: string; voix?: string });

describe('Interjections de la Marche', () => {
  it('Varek (16) et Mireille (17) ont de quoi parler, sans erreur de format', () => {
    const { interjections, erreurs } = interjectionsDe(dm);
    expect(erreurs).toEqual([]);
    expect(interjections.filter((i) => i.pnj === 'varek-le-brise')).toHaveLength(16);
    expect(interjections.filter((i) => i.pnj === 'mireille-de-la-rose')).toHaveLength(17);
    expect(new Set(interjections.map((i) => i.id)).size).toBe(interjections.length);
  });

  it('Varek, escorté, lance son interjection en arrivant au Vieux Pont, avec sa voix, une seule fois', () => {
    const g = groupeConseille(3, srd).emplacements.map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    const p0 = moteur.nouvellePartie(g, { graine: 9, niveau: 3 });
    const base = { ...p0, etat: { ...p0.etat, escortes: ['varek-le-brise'] } };
    const res = moteur.executer({ ...base, etat: { ...base.etat, lieu: 'ald-carrefour-d-aldric' } }, { type: 'aller', vers: 'ald-vieux-pont' });
    const dites = textes(res.evenements).filter((t) => t.voix === 'Varek le Brisé');
    expect(dites.map((t) => t.texte)).toEqual([expect.stringContaining('chêne')]);
    const retour = moteur.executer(res.partie, { type: 'aller', vers: 'ald-carrefour-d-aldric' });
    const encore = moteur.executer(retour.partie, { type: 'aller', vers: 'ald-vieux-pont' });
    expect(textes(encore.evenements).filter((t) => t.voix === 'Varek le Brisé')).toHaveLength(0);
  });
});
