// Lot 1 des corrections de fond (docs/FICHES-LOT-1.md, 18/11/2026), partie moteur. Chaque test a été écrit avant la correction et
// échouait avant elle. Groupe 1 : J2 (M17 quête échouée, M18 secret retenté) et J3 (services typés, M19).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, etatInitial, groupeConseille, influencer, meilleurOrateur, MODULES_STANDARD, personnageDepuisFiche, type DonneesMonde, type Partie } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { appliquerEffet } from '../src/monde/etat';
import { diagnostiquerMonde } from '../src/monde/diagnostiquer';
import { nouvellePartie, type PartieMonde } from '../src/monde/exploration';
import { lieuxDuPnjMaintenant } from '../src/monde/presence';
import type { Pnj } from '../src/monde/schemas';
import { typeDeService } from '../src/monde/services';

const srd = chargerDonneesSrd();

function monde(id: string): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
}
const groupe = (n = 4) =>
  groupeConseille(n, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
const SUCCES = () => 0.999;
const ECHEC = () => 0;

describe('J2a (M17) : une quête échouée ne se termine plus et ne verse rien', () => {
  const dm = monde('tombe-des-rois-serpents');
  const q = [...dm.quetes.values()].find((x) => x.recompenses.xp > 0 || x.recompenses.pieces > 0)!;

  it('échouée puis « terminée » par un effet : le statut, les PX et l’or ne bougent pas', () => {
    const e = etatInitial(dm);
    appliquerEffet({ quete: { id: q.id, statut: 'active' } }, e, dm);
    appliquerEffet({ quete: { id: q.id, statut: 'echouee' } }, e, dm);
    const [xp, po] = [e.xp, e.pieces];
    appliquerEffet({ quete: { id: q.id, statut: 'terminee' } }, e, dm);
    expect(e.quetes[q.id]!.statut).toBe('echouee');
    expect(e.xp).toBe(xp);
    expect(e.pieces).toBe(po);
  });

  it('une quête active se termine toujours une seule fois, avec ses récompenses', () => {
    const e = etatInitial(dm);
    const xp0 = e.xp;
    appliquerEffet({ quete: { id: q.id, statut: 'active' } }, e, dm);
    appliquerEffet({ quete: { id: q.id, statut: 'terminee' } }, e, dm);
    expect(e.quetes[q.id]!.statut).toBe('terminee');
    expect(e.xp).toBe(xp0 + q.recompenses.xp);
    appliquerEffet({ quete: { id: q.id, statut: 'terminee' } }, e, dm);
    expect(e.xp).toBe(xp0 + q.recompenses.xp);
  });
});

describe('J2b (M18) : un secret à jet propre ne se retente pas en changeant de manière', () => {
  const BREGOR = 'bregor-le-borgne';
  function marche(secrets: Pnj['secrets']): { dm: DonneesMonde; p: PartieMonde } {
    const dm = monde('marche-d-ombrefiel');
    dm.pnj.get(BREGOR)!.secrets = secrets;
    const etat = etatInitial(dm);
    etat.lieu = 'ald-auberge-comptoir-et-cellier';
    etat.heure = 10;
    etat.pieces = 100;
    return { dm, p: nouvellePartie(dm, etat, groupe(3), ECHEC) };
  }

  it('raté en persuasion, la même clé bloque l’intimidation et la tromperie sur ce secret', () => {
    const { p } = marche([{ fait: 'test-secret-jet', jet: { competence: 'persuasion', dd: 15 } }]);
    expect(influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-jet' }).jets).toHaveLength(1);
    for (const maniere of ['intimidation', 'tromperie'] as const) {
      const r = influencer(p, BREGOR, maniere, { secret: 'test-secret-jet' });
      expect(r.ok).toBe(false);
      expect(r.jets).toHaveLength(0);
      expect(r.refus).toMatch(/réessayez dans 24 h/);
    }
  });

  it('un autre secret du même PNJ, et l’influence simple, restent possibles', () => {
    const { p } = marche([{ fait: 'test-secret-jet', jet: { competence: 'persuasion', dd: 15 } }, { fait: 'test-secret-autre', jet: { competence: 'persuasion', dd: 15 } }]);
    influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-jet' });
    expect(influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-autre' }).jets).toHaveLength(1);
    expect(influencer(p, BREGOR, 'persuasion').jets).toHaveLength(1);
  });

  it('un secret sans jet propre garde un délai par manière (comportement inchangé)', () => {
    const { p } = marche([{ fait: 'test-secret-simple' }]);
    expect(influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-simple' }).jets).toHaveLength(1);
    expect(influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-simple' }).ok).toBe(false);
    expect(influencer(p, BREGOR, 'intimidation', { secret: 'test-secret-simple' }).jets).toHaveLength(1);
  });

  it('l’orateur est le meilleur du groupe dans la compétence testée, pas dans la manière', () => {
    const base = marche([]);
    const comps = Object.keys(base.p.groupe[0]!.fiche.competences) as (keyof PartieMonde['groupe'][number]['fiche']['competences'])[];
    const meilleur = (c: (typeof comps)[number]) => [...base.p.groupe].sort((x, y) => y.fiche.competences[c].bonus - x.fiche.competences[c].bonus)[0]!.id;
    const competence = comps.find((c) => meilleur(c) !== meilleur('persuasion') && base.p.groupe.some((h) => h.fiche.competences[c].bonus !== base.p.groupe[0]!.fiche.competences[c].bonus));
    expect(competence, 'le groupe de test doit avoir une compétence où le meilleur diffère').toBeDefined();
    const { p } = marche([{ fait: 'test-secret-comp', jet: { competence: competence!, dd: 12 } }]);
    const attendu = meilleur(competence!);
    expect(meilleurOrateur(p, 'persuasion', competence!)!.id).toBe(attendu);
    const r = influencer(p, BREGOR, 'persuasion', { secret: 'test-secret-comp' });
    expect(r.jets[0]!.qui).toBe(attendu);
    expect(r.jets[0]!.test).toBe(competence);
  });

  it('une influence sans secret choisit toujours le meilleur dans la manière', () => {
    const { p } = marche([]);
    const attendu = [...p.groupe].sort((x, y) => y.fiche.competences.tromperie.bonus - x.fiche.competences.tromperie.bonus)[0]!.id;
    expect(influencer(p, BREGOR, 'tromperie').jets[0]!.qui).toBe(attendu);
  });
});

describe('J3 (M19) : des services typés', () => {
  const dm = monde('tombe-des-rois-serpents');
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

  function chezLePnj(pnjId: string, preparer: (p: Partie) => void = () => {}): Partie {
    let p = moteur.executer(moteur.nouvellePartie(groupe(4), { graine: 3 }), { type: 'commencer' }).partie;
    p.etat.pieces = 200;
    p.etat.heure = 10;
    p.etat.lieu = lieuxDuPnjMaintenant({ etat: p.etat }, dm.pnj.get(pnjId)!)[0]!;
    preparer(p);
    return moteur.executer(p, { type: 'parler', pnj: pnjId }).partie;
  }
  const blesse = (p: Partie) => {
    p.groupe[0]!.pv = 1;
  };

  it('identifier-elara identifie l’anneau de la Tombe', () => {
    const p = chezLePnj('elara-herboriste', (x) => (x.etat.inventaire['anneau-griffe-croc'] = 1));
    const r = moteur.executer(p, { type: 'payerService', pnj: 'elara-herboriste', service: 'identifier-elara' });
    expect(r.refus).toBeUndefined();
    expect(r.partie.etat.pieces).toBe(185);
    expect(((r.partie.modules['inventaire'] as { identifies: string[] }).identifies)).toContain('anneau-griffe-croc');
  });

  it('gite-fort fait dormir : le jour suivant, les PV du groupe au maximum', () => {
    const p = chezLePnj('commandeur-garin', blesse);
    const r = moteur.executer(p, { type: 'payerService', pnj: 'commandeur-garin', service: 'gite-fort' });
    expect(r.refus).toBeUndefined();
    expect(r.partie.etat.jour).toBe(p.etat.jour + 1);
    expect(r.partie.groupe[0]!.pv).toBe(r.partie.groupe[0]!.fiche.pvMax);
  });

  it('benediction-chapelain soigne le groupe', () => {
    const p = chezLePnj('frere-balthazar', blesse);
    const r = moteur.executer(p, { type: 'payerService', pnj: 'frere-balthazar', service: 'benediction-chapelain' });
    expect(r.refus).toBeUndefined();
    expect(r.partie.groupe[0]!.pv).toBe(r.partie.groupe[0]!.fiche.pvMax);
  });

  it('les trois services de la Tombe portent leur type', () => {
    const type = (pnj: string, service: string) => dm.pnj.get(pnj)!.services.find((s) => s.id === service)!.type;
    expect(type('elara-herboriste', 'identifier-elara')).toBe('identification');
    expect(type('commandeur-garin', 'gite-fort')).toBe('nuit');
    expect(type('frere-balthazar', 'benediction-chapelain')).toBe('soins');
  });

  describe('sur un monde modifié : le type prime sur l’identifiant, l’identifiant reste le repli', () => {
    // Le commandant du Fort : un PNJ de la Tombe qui parle sans rencontre en attente ; on remplace son service par celui qu'on essaie.
    const marche = () => {
      const m = monde('tombe-des-rois-serpents');
      const aubergiste = m.pnj.get('commandeur-garin')!;
      return { m, aubergiste };
    };
    const jouer = (service: { id: string; type?: 'soins' | 'nuit' | 'identification' }) => {
      const { m, aubergiste } = marche();
      aubergiste.services = [{ nom: 'Service', resume: 'Un service.', prix: 3, effets: [], ...service }];
      const mo = creerMoteur({ dm: m, srd }, MODULES_STANDARD);
      let p = mo.executer(mo.nouvellePartie(groupe(4), { graine: 3 }), { type: 'commencer' }).partie;
      p.etat.pieces = 50;
      p.etat.heure = 10;
      p.etat.lieu = lieuxDuPnjMaintenant({ etat: p.etat }, aubergiste)[0]!;
      p.groupe[0]!.pv = 1;
      p = mo.executer(p, { type: 'parler', pnj: aubergiste.id }).partie;
      const r = mo.executer(p, { type: 'payerService', pnj: aubergiste.id, service: service.id });
      expect(r.refus, `service « ${service.id} » refusé`).toBeUndefined();
      return { avant: p, apres: r.partie };
    };

    it('un identifiant sans mot-clé avec `type: nuit` fait dormir', () => {
      const { avant, apres } = jouer({ id: 'lit-douillet', type: 'nuit' });
      expect(apres.etat.jour).toBe(avant.etat.jour + 1);
    });
    it('un identifiant sans mot-clé avec `type: soins` soigne', () => {
      const { apres } = jouer({ id: 'baume-du-pere', type: 'soins' });
      expect(apres.groupe[0]!.pv).toBe(apres.groupe[0]!.fiche.pvMax);
    });
    it('`type: soins` l’emporte sur « chambre » dans l’identifiant : on ne dort pas', () => {
      const { avant, apres } = jouer({ id: 'chambre-des-malades', type: 'soins' });
      expect(apres.etat.jour).toBe(avant.etat.jour);
      expect(apres.groupe[0]!.pv).toBe(apres.groupe[0]!.fiche.pvMax);
    });
    it('sans type, l’ancienne détection par l’identifiant reste en repli', () => {
      const nuit = jouer({ id: 'chambre-simple' });
      expect(nuit.apres.etat.jour).toBe(nuit.avant.etat.jour + 1);
      const { apres } = jouer({ id: 'soins-legers' });
      expect(apres.groupe[0]!.pv).toBe(apres.groupe[0]!.fiche.pvMax);
    });
    it('un service ni typé ni reconnu ne change que ce que disent ses effets', () => {
      const { avant, apres } = jouer({ id: 'rumeurs' });
      expect(apres.etat.pieces).toBe(avant.etat.pieces - 3);
      expect(apres.etat.jour).toBe(avant.etat.jour);
      expect(apres.groupe[0]!.pv).toBe(1);
    });
  });

  describe('typeDeService et avis du validateur', () => {
    it('typeDeService : le type explicite d’abord, puis l’identifiant', () => {
      expect(typeDeService({ id: 'x', type: 'nuit' })).toBe('nuit');
      expect(typeDeService({ id: 'chambre-1' })).toBe('nuit');
      expect(typeDeService({ id: 'soins-rapides' })).toBe('soins');
      expect(typeDeService({ id: 'identification-magique' })).toBe('identification');
      expect(typeDeService({ id: 'rumeurs' })).toBeUndefined();
    });

    const avisServices = (d: DonneesMonde) => diagnostiquerMonde(d, srd).avertissements.filter((x) => /service/i.test(x) && /sans effet en jeu/.test(x));

    it('un service payé qui ne fait rien (ni type, ni mot-clé, ni effet réel) est signalé', () => {
      const m = monde('marche-d-ombrefiel');
      const avant = avisServices(m).length;
      const pnj = [...m.pnj.values()].find((n) => n.services.length)!;
      pnj.services.push({ id: 'gite-du-voyageur', nom: 'Gîte', resume: 'Un gîte.', prix: 2, effets: [{ narration: 'Vous vous reposez.' }] });
      expect(avisServices(m).length).toBe(avant + 1);
      pnj.services[pnj.services.length - 1]!.type = 'nuit';
      expect(avisServices(m).length).toBe(avant);
    });

    it('un service reconnu par son identifiant, ou qui a un effet réel, n’est pas signalé', () => {
      const m = monde('marche-d-ombrefiel');
      const avant = avisServices(m).length;
      const pnj = [...m.pnj.values()].find((n) => n.services.length)!;
      pnj.services.push({ id: 'chambre-du-fond', nom: 'Chambre', resume: 'Une chambre.', prix: 2, effets: [] }, { id: 'rumeurs-du-port', nom: 'Rumeurs', resume: 'Des rumeurs.', prix: 2, effets: [{ flag: 'test-rumeur' }] });
      expect(avisServices(m).length).toBe(avant);
    });

    it('la Tombe n’a plus d’avis de service sans effet pour ses trois services corrigés', () => {
      const trois = new Set(['identifier-elara', 'gite-fort', 'benediction-chapelain']);
      expect(avisServices(dm).filter((x) => [...trois].some((s) => x.includes(`« ${s} »`)))).toEqual([]);
    });
  });
});
