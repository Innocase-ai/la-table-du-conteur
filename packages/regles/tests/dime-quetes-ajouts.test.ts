// Les quatre quêtes ajoutées à La Dîme des Roseaux se jouent de bout en bout, avec les fonctions du moteur : un sujet les propose,
// un lieu cache un fait, un sujet de retour les clôt. Les jets sont favorables (le hasard rend toujours le plus haut).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appliquerEffets, bilanPersonnage, etatInitial, groupeConseille, personnageDepuisFiche, sortiesDe, type DonneesMonde } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { avancerQuetes } from '../src/monde/etat';
import { aller, fouiller, nouvellePartie, repondreEnigme, type PartieMonde } from '../src/monde/exploration';
import { parler } from '../src/monde/dialogue';

const srd = chargerDonneesSrd();
const dm: DonneesMonde = (() => {
  const r = chargerMonde(join(RACINE_MONDES, 'dime-des-roseaux'));
  if (!r.ok) throw new Error('monde illisible');
  return r.monde as DonneesMonde;
})();
const groupe = () =>
  groupeConseille(2, srd)
    .emplacements.slice(0, 3)
    .map((e) => {
      const f = bilanPersonnage(e!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
function partie(lieu: string): PartieMonde {
  const etat = etatInitial(dm, 2);
  etat.lieu = lieu;
  etat.lieuxVisites.push(lieu);
  return nouvellePartie(dm, etat, groupe(), () => 0.999);
}
const accepter = (p: PartieMonde, id: string) => {
  appliquerEffets([{ quete: { id, statut: 'active' } }], p.etat, dm);
  avancerQuetes(p.etat, dm);
};
const va = (p: PartieMonde, vers: string) => {
  const r = aller(p, vers);
  expect(r.ok, `aller → ${vers} : ${r.refus ?? ''}`).toBe(true);
  avancerQuetes(p.etat, dm);
};
const dit = (p: PartieMonde, pnj: string, sujet: string) => {
  const r = parler(p, pnj, sujet);
  expect(r.refus, `${pnj} / ${sujet}`).toBeUndefined();
  avancerQuetes(p.etat, dm);
};
const fouille = (p: PartieMonde) => {
  fouiller(p);
  avancerQuetes(p.etat, dm);
};
const statut = (p: PartieMonde, id: string) => p.etat.quetes[id]?.statut;

describe('quêtes secondaires de La Dîme : de bout en bout', () => {
  it('q-archiviste-les-vieilles-cartes : l’écluse, le chenal, le retour ; le chenal ouvre la mine au niveau 2', () => {
    const p = partie('mir-auberge-des-roseaux');
    dit(p, 'selenie-orvanne', 'les-vieilles-cartes');
    expect(statut(p, 'q-archiviste-les-vieilles-cartes')).toBe('proposee');
    accepter(p, 'q-archiviste-les-vieilles-cartes');
    p.etat.lieu = 'marais';
    va(p, 'mar-ancienne-ecluse');
    // avant le relevé, le chenal est fermé ; après, il mène à la mine
    expect(sortiesDe(p, 'mar-ancienne-ecluse').find((s) => s.vers === 'mine-hobgobeline')?.bloque).toBe(true);
    fouille(p);
    expect(p.etat.faits).toContain('f-vieux-chenal');
    expect(sortiesDe(p, 'mar-ancienne-ecluse').find((s) => s.vers === 'mine-hobgobeline')?.bloque).toBe(false);
    p.etat.lieu = 'mir-auberge-des-roseaux';
    dit(p, 'selenie-orvanne', 'le-releve');
    expect(statut(p, 'q-archiviste-les-vieilles-cartes')).toBe('terminee');
  });

  it('q-marin-le-convoi : l’aveu, la barque enfouie, le retour', () => {
    const p = partie('mar-cabane-des-passeurs');
    p.etat.attitudes['marin'] = 15;
    dit(p, 'marin', 'un-convoi-pour-varg');
    expect(p.etat.faits).toContain('f-marin-convoi');
    accepter(p, 'q-marin-le-convoi');
    p.etat.lieu = 'marais';
    va(p, 'mar-barque-enfouie');
    fouille(p);
    expect(p.etat.faits).toContain('f-convoi-caisses-marquees');
    p.etat.lieu = 'mar-cabane-des-passeurs';
    dit(p, 'marin', 'le-convoi-regle');
    expect(statut(p, 'q-marin-le-convoi')).toBe('terminee');
  });

  it('q-huguette-les-comptes : le livre n’est trouvé que la quête acceptée, puis le retour baisse la jauge', () => {
    const p = partie('mir-place-du-marche');
    p.etat.flags['pacte-revele'] = true;
    p.etat.attitudes['huguette'] = 20;
    const dime = () => p.etat.jauges['dime'] ?? dm.jauges.get('dime')!.initial;
    appliquerEffets([{ jauge: { id: 'dime', delta: 1 } }], p.etat, dm);
    const avant = dime();
    dit(p, 'huguette', 'le-livre-de-la-halle');
    expect(statut(p, 'q-huguette-les-comptes')).toBe('proposee');
    // sans la quête active, la halle ne livre pas le livre
    p.etat.lieu = 'mireval';
    va(p, 'mir-halle-du-conseil');
    fouille(p);
    expect(p.etat.faits).not.toContain('f-huguette-livre');
    p.etat.lieu = 'mir-place-du-marche';
    accepter(p, 'q-huguette-les-comptes');
    p.etat.lieu = 'mir-halle-du-conseil';
    p.etat.jour += 1;
    fouille(p);
    expect(p.etat.faits).toContain('f-huguette-livre');
    p.etat.lieu = 'mir-place-du-marche';
    dit(p, 'huguette', 'le-livre-lu');
    expect(statut(p, 'q-huguette-les-comptes')).toBe('terminee');
    expect(dime()).toBe(avant - 1);
  });

  it('q-celestin-la-contrebande : la cave, la cachette, le retour (30 pièces)', () => {
    const p = partie('mir-place-du-marche');
    const avant = p.etat.pieces;
    dit(p, 'celestin-brindille', 'la-cave-de-bastien');
    accepter(p, 'q-celestin-la-contrebande');
    p.etat.lieu = 'mir-auberge-des-roseaux';
    va(p, 'mir-cave-de-l-auberge');
    fouille(p);
    expect(p.etat.faits).toContain('f-bastien-contrebande');
    p.etat.lieu = 'mir-place-du-marche';
    dit(p, 'celestin-brindille', 'la-cave-fermee');
    expect(statut(p, 'q-celestin-la-contrebande')).toBe('terminee');
    expect(p.etat.pieces).toBe(avant + 30);
  });

  it('l’atelier du mineur ne s’ouvre ni depuis la grotte ni sans le contrepoids ; la galerie le montre une fois le fait connu', () => {
    const p = partie('grotte-des-roseaux');
    expect(sortiesDe(p, 'grotte-des-roseaux').some((s) => s.vers === 'gro-atelier-du-mineur')).toBe(false);
    p.etat.lieu = 'gro-galerie-effondree';
    expect(sortiesDe(p, 'gro-galerie-effondree').find((s) => s.vers === 'gro-atelier-du-mineur')?.bloque).toBe(true);
    p.etat.faits.push('f-mine-de-fer');
    expect(sortiesDe(p, 'gro-galerie-effondree').find((s) => s.vers === 'gro-atelier-du-mineur')?.bloque).toBe(false);
  });

  it('la bergerie se rejoint depuis Mireval, et le berger y est de jour comme de nuit', () => {
    const p = partie('mireval');
    expect(sortiesDe(p, 'mireval').some((s) => s.vers === 'bergerie-des-hauteurs')).toBe(true);
    va(p, 'bergerie-des-hauteurs');
    dit(p, 'ormak-haute-lande', 'les-patrouilles');
    expect(p.etat.faits).toContain('f-ormak-patrouilles');
  });
});

describe('contenu de La Dîme que le joueur automatique ne rejoint pas dans son budget', () => {
  it('les rencontres d’exploration se déclenchent à la fouille du lieu (rats noyés, Grum, patrouille basse)', () => {
    for (const [lieu, rencontre] of [
      ['mar-grotte-des-noyes', 'mar-r-les-rats-noyes'],
      ['min-camp-hobgobelin', 'min-r-grum-le-gobelours'],
      ['min-grotte-de-la-veine-basse', 'min-r-la-patrouille-basse'],
    ] as const) {
      const p = partie(lieu);
      let r = fouiller(p).combat;
      // Un lieu à deux rencontres d'exploration les joue l'une après l'autre : la première faite, la fouille du lendemain donne la suivante.
      if (r !== rencontre && r) {
        p.etat.rencontresFaites.push(r);
        p.etat.jour += 1;
        r = fouiller(p).combat;
      }
      expect(r, `${lieu} → ${rencontre}`).toBe(rencontre);
    }
  });

  it('l’énigme des lanternes se résout dans l’ordre vert, ambre, rouge, blanche, à la cabane des passeurs', () => {
    const p = partie('mar-cabane-des-passeurs');
    const xp = p.etat.xp;
    const r = repondreEnigme(p, 'z5-e-signal-des-lanternes', ['verte', 'ambre', 'rouge', 'blanche']);
    expect(r.refus).toBeUndefined();
    expect(p.etat.exploration.enigmes['z5-e-signal-des-lanternes']).toBe('resolue');
    expect(p.etat.faits).toContain('f-passeurs-neutres');
    expect(p.etat.xp).toBe(xp + 50);
  });

  it('Marin propose la quête du passage ; Grum se joue (rencontre) ; la chute de Varg ne se joue qu’avec la guerre choisie', () => {
    const p = partie('mar-cabane-des-passeurs');
    dit(p, 'marin', 'passage');
    expect(statut(p, 'q-marin-le-passage')).toBe('proposee');
    const q = partie('min-bureau-de-varg');
    q.etat.flags['varg-vaincu'] = true;
    fouiller(q);
    expect(q.etat.evenementsJoues).not.toContain('z5-varg-tombe'); // vaincu sans la guerre : pas de chute racontée
    q.etat.flags['choix-guerre'] = true;
    q.etat.jour += 1;
    fouiller(q);
    expect(q.etat.evenementsJoues).toContain('z5-varg-tombe');
  });
});
