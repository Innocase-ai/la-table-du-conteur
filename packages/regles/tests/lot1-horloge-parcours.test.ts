// Lot 1 des corrections de fond (docs/FICHES-LOT-1.md, 18/11/2026). Groupe 3 : J1 (une nuit complète compte toujours pour l'horloge, M12),
// J5 (un parcours automatique fidèle au moteur, M23) et J6 (le passage secret de la Tombe, M13). Chaque test a été écrit avant la correction.
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, cleEtat, creerGenerateur, creerMoteur, etatInitial, groupeConseille, groupeDeTest, monterAuNiveau, MODULES_STANDARD, personnageDepuisFiche, type DonneesMonde } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { fouiller, nouvellePartie, seReposer, sortiesDe, type PartieMonde } from '../src/monde/exploration';
import { validerMonde } from '../src/monde/validation';
import { explorerParcours, groupeDuParcours } from '../src/verification/parcours';

const srd = chargerDonneesSrd();
function monde(id: string): DonneesMonde {
  const r = chargerMonde(join(RACINE_MONDES, id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
}
const groupe = (n = 3) =>
  groupeConseille(1, srd)
    .emplacements.slice(0, n)
    .map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
function partie(dm: DonneesMonde, lieu: string, graine = 2): PartieMonde {
  const etat = etatInitial(dm);
  etat.lieu = lieu;
  const p = nouvellePartie(dm, etat, groupe(), creerGenerateur(graine));
  p.srd = srd;
  return p;
}

describe('J1 (M12) : une nuit complète compte toujours pour l’horloge', () => {
  for (const id of ['dime-des-roseaux', 'tombe-des-rois-serpents']) {
    const dm = monde(id);
    const jauge = [...dm.jauges.values()].find((j) => j.evolution.some((e) => e.declencheur === 'repos-long'))!;
    const delta = jauge.evolution.filter((e) => e.declencheur === 'repos-long').reduce((s, e) => s + e.delta, 0);
    // Un lieu sûr sans rencontre de repos ni aléatoire : la nuit n'est pas interrompue.
    const sur = [...dm.lieux.values()].find((l) => l.repos === 'sur' && !l.rencontres.some((r) => r.declencheur === 'repos' || r.declencheur === 'aleatoire'))!;
    const nuit = (heure: number) => {
      const p = partie(dm, sur.id);
      p.etat.heure = heure;
      const avant = { jour: p.etat.jour, jauge: p.etat.jauges[jauge.id] ?? 0 };
      expect(fouiller(p).ok).toBe(true);
      const r = seReposer(p, 'long');
      return { p, r, avant, apres: fouiller(p) };
    };

    it(`${id} : couché à 1 h, la jauge « ${jauge.id} » avance de ${delta} et la fouille se rouvre, sans changer de jour`, () => {
      const { p, avant, apres } = nuit(1);
      expect(p.etat.jour).toBe(avant.jour);
      expect(p.etat.heure).toBe(9);
      expect(p.etat.jauges[jauge.id] ?? 0).toBe(avant.jauge + delta);
      expect(apres.ok, apres.refus).toBe(true);
    });

    it(`${id} : couché à 6 h ou 7 h, huit heures de sommeil et non 25 ou 26 h`, () => {
      for (const heure of [6, 7]) {
        const { p, avant, apres } = nuit(heure);
        expect(p.etat.jour, `couché à ${heure} h`).toBe(avant.jour);
        expect(p.etat.heure).toBe(heure + 8);
        expect(p.etat.jauges[jauge.id] ?? 0).toBe(avant.jauge + delta);
        expect(apres.ok, apres.refus).toBe(true);
      }
    });

    it(`${id} : couché le soir (18 h à 23 h), mêmes états qu’avant`, () => {
      for (const heure of [18, 20, 21, 22, 23]) {
        const { p, r, avant, apres } = nuit(heure);
        expect(p.etat.jour).toBe(avant.jour + 1);
        expect(p.etat.heure).toBe(8);
        expect(p.etat.jauges[jauge.id] ?? 0).toBe(avant.jauge + delta);
        expect(apres.ok).toBe(true);
        const empreinte = createHash('sha1').update(JSON.stringify({ etat: p.etat, constats: r.constats, pv: p.groupe.map((h) => h.pv) })).digest('hex').slice(0, 12);
        expect(empreinte, `${id} à ${heure} h`).toBe(EMPREINTES[`${id}@${heure}`]);
      }
    });
  }
});

/** Les états après une nuit du soir, relevés AVANT la correction de J1 (et qui ne doivent pas bouger). */
const EMPREINTES: Record<string, string> = Object.fromEntries(
  [18, 20, 21, 22, 23].flatMap((h) => [
    [`dime-des-roseaux@${h}`, '12542f0ff4b4'],
    [`tombe-des-rois-serpents@${h}`, 'c2d06fc28736'],
  ]),
);

describe('J5 (M23) : un parcours automatique fidèle au moteur', () => {
  const moteur = creerMoteur({ dm: monde('dime-des-roseaux'), srd }, MODULES_STANDARD);
  const depart = () => moteur.executer(moteur.nouvellePartie(groupeDeTest(srd), { graine: 3 }), { type: 'commencer' }).partie;

  it('la clé d’état distingue le jour (10 h) de la nuit (3 h), comme `momentDe`', () => {
    const [a, b, c, d] = [10, 3, 23, 12].map((h) => {
      const p = structuredClone(depart());
      p.etat.heure = h;
      return cleEtat(p);
    });
    expect(a).not.toBe(b);
    expect(b).toBe(c); // 3 h et 23 h sont deux nuits
    expect(a).toBe(d); // 10 h et 12 h sont deux jours
  });

  it('la clé garde ses trois tranches : jour (6 h à 17 h), soir (18 h à 21 h), nuit', () => {
    const cles = [8, 19, 23].map((h) => {
      const p = structuredClone(depart());
      p.etat.heure = h;
      return cleEtat(p);
    });
    expect(new Set(cles).size).toBe(3);
  });

  it('le groupe de test est au niveau demandé, avec ses choix : il peut monter de niveau', () => {
    expect(groupeDeTest(srd)[0]!.fiche.niveau).toBe(3); // par défaut, comme avant
    for (const niveau of [1, 3, 5]) {
      const g = groupeDeTest(srd, niveau);
      for (const h of g) {
        expect(h.fiche.niveau).toBe(niveau);
        expect(h.choix, h.nom).toBeDefined();
        expect(monterAuNiveau(h.choix!, niveau + 1, srd), `${h.nom} niveau ${niveau + 1}`).toBeDefined();
      }
    }
  });

  it('le parcours joue le groupe du niveau du monde (le Dîme : niveau 1, la Tombe : niveau 3)', () => {
    expect(groupeDuParcours({ dm: monde('dime-des-roseaux'), srd }, {})[0]!.fiche.niveau).toBe(1);
    expect(groupeDuParcours({ dm: monde('tombe-des-rois-serpents'), srd }, {})[0]!.fiche.niveau).toBe(3);
    expect(groupeDuParcours({ dm: monde('dime-des-roseaux'), srd }, { niveau: 2 })[0]!.fiche.niveau).toBe(2);
    const sur = groupeDeTest(srd, 4);
    expect(groupeDuParcours({ dm: monde('dime-des-roseaux'), srd }, { groupe: sur })).toBe(sur);
  });
});

describe('J6 (M13) : le passage secret de la Tombe ne saute plus les niveaux 1 et 2', () => {
  const tombe = () => monde('tombe-des-rois-serpents');
  const LIEN = (dm: DonneesMonde) => dm.lieux.get('n3-escalier-surface')!.liens.find((l) => l.vers === 'bivouac-entree')!;

  it('(moteur, D4) un passage à sens unique n’est offert que depuis son extrémité de départ', () => {
    const dm = monde('dime-des-roseaux');
    const [a, b] = [...dm.lieux.values()].filter((l) => !l.liens.length && l.type !== 'region').slice(0, 2);
    a!.liens.push({ vers: b!.id, type: 'passage', heures: 0, sens: 'simple' });
    expect(sortiesDe(partie(dm, a!.id), a!.id).some((s) => s.vers === b!.id)).toBe(true);
    expect(sortiesDe(partie(dm, b!.id), b!.id).some((s) => s.vers === a!.id)).toBe(false);
  });

  // DONNÉES DE LA TOMBE (décision D4) : le passage `n3-escalier-surface` → `bivouac-entree` à sens unique (correctif gardé dans les notes de
  // la session : `lot1/tombe-passage-sens-unique.patch`). NON APPLIQUÉ : sans le raccourci, le parcours automatique ne prouve plus les fins de
  // la Tombe (540 s, 7 530 états : 36 lieux sur 43 vus, aucune des 4 fins) ; voir le journal du 18/11/2026, « suite 8 ». Ces deux tests
  // décrivent l'état voulu ; ils seront activés quand le parcours saura prouver la descente réelle.
  it('(données, D4) le passage de la Tombe est à sens unique : du niveau 3 vers le bivouac', () => {
    const dm = tombe();
    expect(LIEN(dm).sens).toBe('simple');
    const au = (lieu: string): PartieMonde => partie(dm, lieu);
    expect(sortiesDe(au('bivouac-entree'), 'bivouac-entree').some((s) => s.vers === 'n3-escalier-surface')).toBe(false);
    expect(sortiesDe(au('n3-escalier-surface'), 'n3-escalier-surface').some((s) => s.vers === 'bivouac-entree')).toBe(true);
  });

  it('(moteur) un passage caché à double sens se découvre avec le texte « retour » depuis l’autre extrémité', () => {
    const dm = monde('dime-des-roseaux');
    const [a, b] = [...dm.lieux.values()].filter((l) => !l.liens.length && l.type !== 'region').slice(0, 2) as [DonneesMonde['lieux'] extends Map<string, infer L> ? L : never, DonneesMonde['lieux'] extends Map<string, infer L> ? L : never];
    a.liens.push({ vers: b.id, type: 'passage-secret', heures: 0, sens: 'double', cache: { dd: 1, competence: 'perception' }, description: 'TEXTE-ALLER', retour: 'TEXTE-RETOUR' });
    const depuis = (lieu: string) => {
      const p = partie(dm, lieu);
      const r = fouiller(p);
      return r.constats.join(' ');
    };
    expect(depuis(a.id)).toContain('TEXTE-ALLER');
    expect(depuis(b.id)).toContain('TEXTE-RETOUR');
    expect(depuis(b.id)).not.toContain('TEXTE-ALLER');
  });

  describe('(validateur) avis sur un passage caché entre deux niveaux, trouvé sans jet', () => {
    const avisPassage = (dm: DonneesMonde) => validerMonde(dm, srd).avertissements.filter((a) => a.startsWith('Passage caché'));
    const deuxLieux = (dm: DonneesMonde, niveauA: number | undefined, niveauB: number | undefined) => {
      const [a, b] = [...dm.lieux.values()].filter((l) => !l.liens.length && l.type !== 'region').slice(0, 2);
      for (const [l, n] of [[a!, niveauA], [b!, niveauB]] as const) {
        if (n === undefined) delete l.niveau;
        else l.niveau = { min: n, max: n };
      }
      return { a: a!, b: b! };
    };
    const lien = (dd: number, sens: 'double' | 'simple') => ({ type: 'passage-secret' as const, heures: 0, sens, cache: { dd, competence: 'perception' as const } });

    it('signalé : DD dans la Perception passive du groupe conseillé, niveaux différents', () => {
      const dm = monde('dime-des-roseaux');
      const avant = avisPassage(dm).length;
      const { a, b } = deuxLieux(dm, 1, 2);
      a.liens.push({ vers: b.id, ...lien(10, 'double') });
      const a1 = avisPassage(dm);
      expect(a1).toHaveLength(avant + 1);
      expect(a1.join('\n')).toContain(`« ${a.id} »`);
      expect(a1.join('\n')).toMatch(/Perception passive/);
    });

    it('pas signalé : DD hors de portée, même niveau, niveau inconnu, ou sortie à sens unique vers le moins profond', () => {
      let dm = monde('dime-des-roseaux');
      const avant = avisPassage(dm).length;
      let { a, b } = deuxLieux(dm, 1, 2);
      a.liens.push({ vers: b.id, ...lien(30, 'double') });
      expect(avisPassage(dm), 'DD 30').toHaveLength(avant);
      dm = monde('dime-des-roseaux');
      ({ a, b } = deuxLieux(dm, 2, 2));
      a.liens.push({ vers: b.id, ...lien(10, 'double') });
      expect(avisPassage(dm), 'même niveau').toHaveLength(avant);
      dm = monde('dime-des-roseaux');
      ({ a, b } = deuxLieux(dm, 1, undefined));
      a.liens.push({ vers: b.id, ...lien(10, 'double') });
      expect(avisPassage(dm), 'niveau inconnu').toHaveLength(avant);
      dm = monde('dime-des-roseaux');
      ({ a, b } = deuxLieux(dm, 2, 1));
      a.liens.push({ vers: b.id, ...lien(10, 'simple') });
      expect(avisPassage(dm), 'sortie à sens unique vers le moins profond').toHaveLength(avant);
      dm = monde('dime-des-roseaux');
      ({ a, b } = deuxLieux(dm, 1, 2));
      a.liens.push({ vers: b.id, ...lien(10, 'simple') });
      expect(avisPassage(dm), 'sens unique vers le plus profond').toHaveLength(avant + 1);
    });

    it('la Tombe (données d’aujourd’hui) : plus aucun passage caché trouvé sans jet (sortie du bivouac à sens unique, raccourci du niveau 2 à DD 18 > Perception passive 16, décision L2-D3 du 19/11/2026)', () => {
      const a = avisPassage(tombe());
      expect(a.filter((x) => x.includes('« n3-escalier-surface » → « bivouac-entree »'))).toHaveLength(0);
      expect(a.filter((x) => x.includes('« n2-soldats-d-argile » → « n3-hall-du-basilic »'))).toHaveLength(0);
      expect(a).toHaveLength(0);
    });
  });

  /** Les lieux que le groupe peut rejoindre depuis `depart` par les sorties du moteur (conditions, cachettes et verrous ignorés), sans entrer dans ceux que `interdit` refuse. */
  const accessibles = (dm: DonneesMonde, depart: string, interdit: (id: string) => boolean): Set<string> => {
    const vus = new Set([depart]);
    for (const file = [depart]; file.length; ) {
      const ici = file.shift()!;
      for (const sortie of sortiesDe(partie(dm, ici), ici)) {
        if (vus.has(sortie.vers) || interdit(sortie.vers)) continue;
        vus.add(sortie.vers);
        file.push(sortie.vers);
      }
    }
    return vus;
  };
  const sansNiveaux1et2 = (id: string) => id.startsWith('n1-') || id.startsWith('n2-');

  it('(données, D4) depuis le bivouac, le niveau 3 ne s’atteint plus sans passer par les niveaux 1 et 2', () => {
    const dm = tombe();
    const sans = accessibles(dm, 'bivouac-entree', sansNiveaux1et2);
    expect([...sans].filter((l) => l.startsWith('n3-'))).toEqual([]);
    // Et par les niveaux 1 et 2, il s'atteint : la descente existe.
    expect([...accessibles(dm, 'bivouac-entree', () => false)].some((l) => l.startsWith('n3-'))).toBe(true);
    // Avec l'ancien lien à double sens, le raccourci revenait : le test voit bien ce qu'il doit voir.
    LIEN(dm).sens = 'double';
    expect([...accessibles(dm, 'bivouac-entree', sansNiveaux1et2)].some((l) => l.startsWith('n3-'))).toBe(true);
  });

  // La preuve par le parcours automatique : le groupe atteint `n3-hall-du-basilic` en passant par les niveaux 1 et 2. Avec le squelette d'emblée
  // (lot 2, étape A), quelques secondes ; avant, 55 s et 101 pas. Le chemin trouvé n'a pas à être long : il doit seulement passer par les niveaux 1 et 2.
  it('(données, D4) le parcours automatique atteint le niveau 3 en passant par les niveaux 1 et 2', () => {
    const dm = tombe();
    dm.fins.clear();
    for (const [id, condition] of [['jalon', { lieu: 'n3-hall-du-basilic' }], ['fin-echec-horloge', { flag: 'jamais-pose' }]] as const) {
      dm.fins.set(id, { id, nom: id, condition, epilogue: 'x', variantes: [], consequences: [] } as never);
    }
    const rap = explorerParcours({ dm, srd }, { budgetEtats: 4000, budgetMs: 60_000, trancheAvantSquelette: 0 });
    const p = rap.parcours.find((x) => x.fin === 'jalon');
    expect(p, 'le niveau 3 est atteignable').toBeDefined();
    const lieux = new Set(p!.etapes.map((e) => e.lieu));
    expect([...lieux].some((l) => l.startsWith('n1-'))).toBe(true);
    expect([...lieux].some((l) => l.startsWith('n2-'))).toBe(true);
  }, 90_000);
});
