// Rendre une quête à son donneur : le sujet du PNJ clôt la quête ET pose le drapeau « quête rendue » qui accomplit l'étape de
// retour. La clôture passe après les autres effets du lot : l'étape de retour s'accomplit d'abord, ses PX ne se perdent plus.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appliquerEffets, etatInitial, validerMonde } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
function marche() {
  const r = chargerMonde(join(RACINE_MONDES, 'marche-d-ombrefiel'));
  if (!r.ok) throw new Error('monde illisible');
  return r.monde;
}

describe('rendre une quête à son donneur', () => {
  it('« La sécurité du relais » : l’étape de retour chez Brégor est accomplie et rapporte ses PX', () => {
    const dm = marche();
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: 'q-la-securite-du-relais', statut: 'active' } }], e, dm);
    appliquerEffets([{ flag: 'z1-pont-libere' }, { flag: 'z1-demi-dent-tue' }], e, dm);
    const avant = e.xp;
    const sujet = dm.pnj.get('bregor-le-borgne')!.sujets.find((s) => s.id === 'rapport-securite-et-prime')!;
    appliquerEffets(sujet.effets, e, dm);
    const q = e.quetes['q-la-securite-du-relais']!;
    expect(q.statut).toBe('terminee');
    expect(q.accomplies).toEqual(['le-pont', 'le-chef-gobelin', 'retour-chez-bregor']);
    // 50 PX de l'étape de retour (les récompenses de la quête sont à 0 : l'or est versé par le sujet).
    expect(e.xp - avant).toBe(50);
    expect(e.quetes['q-la-prime-sur-demi-dent']!.statut).toBe('terminee');
  });

  it('une clôture seule (sans étape à accomplir) donne toujours les récompenses de la quête, une seule fois', () => {
    const dm = marche();
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: 'q-le-cor-du-moulin', statut: 'active' } }], e, dm);
    appliquerEffets([{ quete: { id: 'q-le-cor-du-moulin', statut: 'terminee' } }], e, dm);
    appliquerEffets([{ quete: { id: 'q-le-cor-du-moulin', statut: 'terminee' } }], e, dm);
    expect(e.quetes['q-le-cor-du-moulin']!.statut).toBe('terminee');
  });

  it('le validateur signale un sujet qui clôt une quête sans poser ce qu’attend son étape finale', () => {
    const dm = marche();
    expect(validerMonde(dm, srd).avertissements.some((a) => a.includes('sans accomplir son étape finale'))).toBe(false);
    const bregor = dm.pnj.get('bregor-le-borgne')!;
    const sujet = bregor.sujets.find((s) => s.id === 'rapport-cor')!;
    sujet.effets = sujet.effets.filter((x) => !('flag' in x));
    const avis = validerMonde(dm, srd).avertissements.filter((a) => a.includes('sans accomplir son étape finale'));
    expect(avis.some((a) => a.includes('rapport-cor') && a.includes('q-le-cor-du-moulin'))).toBe(true);
  });
});
