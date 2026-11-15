// La compatibilité d'un article avec le groupe, avec le vrai moteur : formation aux armures, maîtrise des armes, refus du moteur.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Moteur, type Partie } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../../../packages/regles/src/monde/chargeur';
import { MONDES_ESSAI } from '../../../../packages/regles/tests/mondes-essai';
import { compatibilite, resumeCompatibilite } from './vitrine-regles';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const moteur: Moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);
const partie = (): Partie => {
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  return moteur.nouvellePartie(groupe, { graine: 1, niveau: 3 });
};

describe('compatibilité d’un article avec le groupe', () => {
  const p = partie();

  it('une potion ne s’équipe pas : aucune ligne', () => {
    expect(compatibilite(moteur.ctx, p.groupe, 'potion-de-soins')).toEqual({ equipable: false, heros: [] });
    expect(resumeCompatibilite({ equipable: false, heros: [] })).toBe('');
  });

  it('une armure lourde : seuls les héros formés la portent sans pénalité, les autres le sont signalés', () => {
    const c = compatibilite(moteur.ctx, p.groupe, 'cotte-de-mailles');
    expect(c.equipable).toBe(true);
    expect(c.genre).toBe('armure');
    expect(c.heros).toHaveLength(p.groupe.length);
    for (const h of c.heros) {
      const heros = p.groupe.find((x) => x.id === h.heros)!;
      const forme = heros.fiche.formationArmures.includes('intermediaire') || heros.fiche.formationArmures.includes('lourde');
      // La cotte de mailles est une armure lourde dans le SRD : formation « lourde » requise.
      const attendu = heros.fiche.formationArmures.includes(srd.armures.get('cotte-de-mailles')!.categorie);
      expect(h.etat, `${h.nom} (${forme})`).toBe(attendu ? 'oui' : 'sans-formation');
      if (attendu) expect(h.detail).toMatch(/^CA \d+/);
      else expect(h.detail).toMatch(/non formé aux armures /);
    }
  });

  it('un bouclier : la CA avant et après est donnée à ceux qui le portent', () => {
    const c = compatibilite(moteur.ctx, p.groupe, 'bouclier');
    const forme = c.heros.find((h) => h.etat === 'oui');
    expect(forme?.detail).toMatch(/^CA \d+( → \d+)?$/);
    // Un héros non formé aux boucliers : le motif dit « boucliers », pas « armures les boucliers ».
    const sans = c.heros.find((h) => h.etat === 'sans-formation');
    if (sans) expect(sans.detail).toMatch(/non formé aux boucliers/);
  });

  it('une arme : sans maîtrise, le héros peut la tenir mais le signale', () => {
    const c = compatibilite(moteur.ctx, p.groupe, 'epee-longue');
    expect(c.genre).toBe('arme');
    for (const h of c.heros) expect(['oui', 'sans-formation']).toContain(h.etat);
    const sans = c.heros.filter((h) => h.etat === 'sans-formation');
    for (const h of sans) expect(h.detail).toMatch(/sans maîtrise/);
  });

  it('un résumé dit qui peut le porter', () => {
    const c = compatibilite(moteur.ctx, p.groupe, 'epee-longue');
    expect(resumeCompatibilite(c)).toMatch(/Peut le porter : |Sans formation : |Personne/);
    expect(resumeCompatibilite({ equipable: true, genre: 'arme', heros: [{ heros: 'a', nom: 'Hilda', etat: 'non', ameliore: false }] })).toBe('Personne du groupe ne peut le porter.');
    expect(
      resumeCompatibilite({
        equipable: true,
        genre: 'armure',
        heros: [
          { heros: 'a', nom: 'Hilda', etat: 'oui', ameliore: true },
          { heros: 'b', nom: 'Pip', etat: 'sans-formation', ameliore: false },
        ],
      }),
    ).toBe('Peut le porter : Hilda. Sans formation : Pip.');
  });
});
