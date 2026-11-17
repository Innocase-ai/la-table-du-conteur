// La Tombe des Rois Serpents : chaque fin arrive (et pas trop tôt), l'horloge se joue, les quêtes de la colonne vertébrale s'accomplissent.
// Le verdict se rend par le dilemme `dilemme-le-decompte` (bivouac) ; l'échec par la jauge `soupcon-et-tension` (une nuit de repos = +1).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appliquerEffets, bilanPersonnage, creerMoteur, etatInitial, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type DonneesMonde, type FicheEvenement, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { avancerQuetes, epilogueDeFin } from '../src/monde/etat';
import { validerMonde } from '../src/monde/validation';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'tombe-des-rois-serpents'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde as DonneesMonde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

type Origine = { espece: string; classe: string };
/** Le groupe au départ de l'histoire ; `origines` fixe les héros (les autres sont des humains guerriers). */
function depart(graine = 11, origines: Origine[] = []): Partie {
  const g = groupeConseille(3, srd).emplacements.map((e) => {
    const f = bilanPersonnage(e!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
  p.etat.heros = p.groupe.map((_, i) => ({ historique: 'sage', ...(origines[i] ?? { espece: 'humain', classe: 'guerrier' }) }));
  return p;
}
const fiche = (p: Partie) => moteur.vue<FicheEvenement | undefined>('evenementEnCours', p);

/** Le groupe arrive au bivouac, de quoi solder le contrat en main : le dilemme du décompte s'ouvre. */
function auBivouac(graine = 11, plus: string[] = [], origines: Origine[] = [], jauge = 0): Partie {
  const p = depart(graine, origines);
  p.etat.lieu = 'tombe-des-rois';
  p.etat.lieuxVisites.push('tombe-des-rois', 'bivouac-entree');
  p.etat.flags['coeur-tombe-resolu'] = true;
  for (const f of plus) p.etat.flags[f] = true;
  p.etat.jauges['soupcon-et-tension'] = jauge;
  const res = moteur.executer(p, { type: 'aller', vers: 'bivouac-entree' });
  expect(res.refus, 'aller au bivouac').toBeUndefined();
  return res.partie;
}
const choisir = (p: Partie, option: string) => moteur.executer(p, { type: 'trancher', dilemme: 'dilemme-le-decompte', option });
const boutons = (p: Partie) => moteur.propositions(p).filter((x) => x.groupe.id === 'dilemme:dilemme-le-decompte');
const options = (p: Partie) => boutons(p).map((x) => (x.ordre as { option?: string }).option);
const fin = (p: Partie) => p.etat.fin;
const epilogue = (p: Partie) => {
  const f = dm.fins.get(p.etat.fin!)!;
  return epilogueDeFin(f, p.etat);
};

describe('La Tombe des Rois Serpents : le monde', () => {
  it('se valide sans erreur', () => {
    const bilan = validerMonde(dm, srd);
    expect(bilan.erreurs).toEqual([]);
  });

  it('a cinq fins, chacune avec un épilogue, et aucune dont la condition est vraie au départ', () => {
    expect([...dm.fins.keys()].sort()).toEqual(['fin-echec-horloge', 'fin-pacte-des-profondeurs', 'fin-partage-honnete', 'fin-soupcon-et-disgrace', 'fin-trahison-fortune']);
    const p = depart();
    expect(fin(p)).toBeUndefined();
    for (const f of dm.fins.values()) expect(f.epilogue.length).toBeGreaterThan(200);
  });

  it('aucune fin n’arrive avant le verdict : le cœur de la tombe résolu, l’horloge à 4, rien ne termine l’histoire', () => {
    const p = depart();
    p.etat.flags['coeur-tombe-resolu'] = true;
    p.etat.flags['gobelins-sauves'] = true;
    p.etat.flags['xiximantre-allie'] = true;
    p.etat.jauges['soupcon-et-tension'] = 4;
    appliquerEffets([{ xp: 1 }], p.etat, dm);
    avancerQuetes(p.etat, dm);
    expect(fin(p)).toBeUndefined();
  });
});

describe('La Tombe des Rois Serpents : le décompte devant Martin et les quatre issues', () => {
  it('s’ouvre à l’arrivée au bivouac, une fois le cœur de la tombe résolu, et pas avant', () => {
    const sans = depart();
    sans.etat.lieu = 'tombe-des-rois';
    sans.etat.lieuxVisites.push('tombe-des-rois');
    const res = moteur.executer(sans, { type: 'aller', vers: 'bivouac-entree' });
    expect(boutons(res.partie)).toEqual([]);
    const p = auBivouac();
    expect(options(p)).toEqual(expect.arrayContaining(['partager', 'dissimuler', 'tout-garder', 'abstention']));
    expect(fin(p)).toBeUndefined();
  });

  it('fin-partage-honnete : étaler tout le butin, moitié-moitié', () => {
    const res = choisir(auBivouac(), 'partager');
    expect(res.refus).toBeUndefined();
    expect(fin(res.partie)).toBe('fin-partage-honnete');
    expect(res.partie.etat.flags['verdict-partage-rendu']).toBe(true);
    expect(epilogue(res.partie)).toBe(dm.fins.get('fin-partage-honnete')!.epilogue);
  });

  it('ne pas trancher : Martin applique le contrat à la lettre (partage sans estime), l’histoire ne se bloque jamais', () => {
    const res = choisir(auBivouac(), 'abstention');
    expect(fin(res.partie)).toBe('fin-partage-honnete');
    expect(res.partie.etat.reputations['commanditaire-alderic']).toBeLessThan(auBivouac().etat.reputations['commanditaire-alderic']! + 30);
  });

  it('fin-partage-honnete (variante « fraude réussie ») ET fin-soupcon-et-disgrace : la dissimulation réussit ou échoue selon le jet', () => {
    const issues = new Set<string>();
    for (let graine = 1; graine <= 60 && issues.size < 2; graine++) {
      const res = choisir(auBivouac(graine), 'dissimuler');
      expect(res.refus).toBeUndefined();
      if (fin(res.partie) === 'fin-soupcon-et-disgrace') {
        issues.add('disgrace');
        expect(res.partie.etat.flags['verdict-soupcon-demasque']).toBe(true);
      } else {
        issues.add('fraude');
        expect(fin(res.partie)).toBe('fin-partage-honnete');
        expect(res.partie.etat.flags['verdict-fraude-reussie']).toBe(true);
        expect(epilogue(res.partie)).toBe(dm.fins.get('fin-partage-honnete')!.variantes[0]!.epilogue);
      }
    }
    expect([...issues].sort()).toEqual(['disgrace', 'fraude']);
  });

  it('la dissimulation n’est plus offerte quand Martin soupçonne déjà (horloge à 3)', () => {
    const p = auBivouac(11, [], [], 3);
    expect(options(p)).not.toContain('dissimuler');
    expect(choisir(p, 'dissimuler').refus).toBeTruthy();
    expect(options(p)).toContain('partager');
  });

  it('fin-trahison-fortune : refermer les sacs, rompre le contrat', () => {
    const res = choisir(auBivouac(), 'tout-garder');
    expect(fin(res.partie)).toBe('fin-trahison-fortune');
    expect(res.partie.etat.reputations['commanditaire-alderic']).toBeLessThan(0);
    expect(res.partie.etat.reputations['ordre-du-reflet-beni']).toBeLessThan(0);
  });

  it('fin-trahison-fortune, variante Xiximantre vaincu', () => {
    const res = choisir(auBivouac(11, ['xiximantre-vaincu']), 'tout-garder');
    expect(epilogue(res.partie)).toBe(dm.fins.get('fin-trahison-fortune')!.variantes[0]!.epilogue);
  });

  it('fin-pacte-des-profondeurs : réservé à qui a sauvé les gobelins ou flatté Xiximantre, et que Martin n’a pas tout appris', () => {
    // Sans alliance : grisé, refusé.
    const sans = auBivouac();
    expect(boutons(sans).find((x) => (x.ordre as { option?: string }).option === 'sceller-le-silence')?.desactivee).toBeTruthy();
    expect(choisir(sans, 'sceller-le-silence').refus).toBeTruthy();
    // Martin informé (dilemme « tout lui dire ») : l'option disparaît.
    const informe = auBivouac(11, ['gobelins-sauves', 'martin-informe']);
    expect(options(informe)).not.toContain('sceller-le-silence');
    // Gobelins sauvés : réussi ou éventé, c'est toujours la fin du pacte, mais l'éventé a son épilogue.
    const issues = new Set<string>();
    for (let graine = 1; graine <= 60 && issues.size < 2; graine++) {
      const res = choisir(auBivouac(graine, ['gobelins-sauves']), 'sceller-le-silence');
      expect(res.refus).toBeUndefined();
      expect(fin(res.partie)).toBe('fin-pacte-des-profondeurs');
      if (res.partie.etat.flags['verdict-pacte-evente']) {
        issues.add('evente');
        expect(epilogue(res.partie)).toBe(dm.fins.get('fin-pacte-des-profondeurs')!.variantes[0]!.epilogue);
      } else {
        issues.add('reussi');
        expect(epilogue(res.partie)).toBe(dm.fins.get('fin-pacte-des-profondeurs')!.epilogue);
      }
    }
    expect([...issues].sort()).toEqual(['evente', 'reussi']);
  });

  it('fin-pacte-des-profondeurs, variantes : Xiximantre allié, puis allié et gobelins sauvés', () => {
    const f = dm.fins.get('fin-pacte-des-profondeurs')!;
    const allie = choisir(auBivouac(11, ['xiximantre-allie']), 'sceller-le-silence');
    expect(fin(allie.partie)).toBe('fin-pacte-des-profondeurs');
    if (!allie.partie.etat.flags['verdict-pacte-evente']) expect(epilogue(allie.partie)).toBe(f.variantes[2]!.epilogue);
    const double = choisir(auBivouac(11, ['xiximantre-allie', 'gobelins-sauves']), 'sceller-le-silence');
    if (!double.partie.etat.flags['verdict-pacte-evente']) expect(epilogue(double.partie)).toBe(f.variantes[1]!.epilogue);
  });
});

describe('La Tombe des Rois Serpents : l’horloge', () => {
  const nuit = (p: Partie) => moteur.executer(p, { type: 'seReposer', duree: 'long' });
  /** Au bivouac (repos sûr), cinq nuits de suite. */
  const auCamp = (graine: number): Partie => {
    const p = depart(graine);
    p.etat.lieu = 'tombe-des-rois';
    p.etat.lieuxVisites.push('tombe-des-rois', 'bivouac-entree');
    return moteur.executer(p, { type: 'aller', vers: 'bivouac-entree' }).partie;
  };

  it('fin-echec-horloge : cinq nuits de repos sans verdict, Martin lève le camp', () => {
    let p = auCamp(11);
    const jauges: number[] = [];
    for (let i = 0; i < 8 && !fin(p); i++) {
      // Une scène ou un dilemme ouvert n'empêche pas de se reposer ; une nuit interrompue ne compte pas : on recommence.
      const res = nuit(p);
      if (res.refus) break;
      p = res.partie;
      jauges.push(p.etat.jauges['soupcon-et-tension']!);
    }
    expect(fin(p)).toBe('fin-echec-horloge');
    expect(p.etat.jauges['soupcon-et-tension']).toBeGreaterThanOrEqual(5);
    expect(p.etat.flags['horloge-expiree']).toBe(true);
    // Les trois premières nuits montent d'un cran ; le dilemme de Martin, ouvert au palier 2 et laissé sans réponse, s'applique de lui-même
    // deux jours plus tard (abstention : +1) : la quatrième nuit mène donc d'un coup au dernier palier.
    expect(jauges.slice(0, 3)).toEqual([1, 2, 3]);
  });

  it('les paliers se lisent dans l’ordre et posent leurs drapeaux (Martin satisfait, l’horloge ne court pas jusqu’au bout)', () => {
    let p = auCamp(11);
    for (let i = 0; i < 2; i++) p = nuit(p).partie;
    // On répond au dilemme de Martin (tout lui dire : −2), puis la tension remonte jusqu'au palier 4 sans atteindre la fin.
    const honorer = moteur.propositions(p).find((x) => x.groupe.id === 'dilemme:dilemme-serment-des-mules' && (x.ordre as { option?: string } | undefined)?.option === 'honorer-moitie')!;
    p = moteur.executer(p, honorer.ordre!).partie;
    expect(p.etat.jauges['soupcon-et-tension']).toBe(0);
    for (let i = 0; i < 4; i++) p = nuit(p).partie;
    for (const n of [2, 3, 4]) expect(p.etat.flags[`tension-palier-${n}`], `palier ${n}`).toBe(true);
    expect(p.etat.jauges['soupcon-et-tension']).toBe(4);
    expect(fin(p)).toBeUndefined();
  });

  it('rendre compte à Martin (dilemme) baisse la jauge : « tout lui dire » de deux crans', () => {
    let p = auCamp(11);
    for (let i = 0; i < 2; i++) p = nuit(p).partie;
    expect(p.etat.flags['tension-palier-2']).toBe(true);
    const bouton = moteur.propositions(p).find((x) => x.groupe.id === 'dilemme:dilemme-serment-des-mules' && x.ordre?.type === 'trancher' && (x.ordre as { option?: string }).option === 'honorer-moitie');
    expect(bouton, 'le dilemme de Martin est proposé au palier 2').toBeDefined();
    const res = moteur.executer(p, bouton!.ordre!);
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.jauges['soupcon-et-tension']).toBe(0);
    expect(res.partie.etat.flags['martin-informe']).toBe(true);
  });

  it('les deux quêtes qui apaisent Martin baissent la jauge à leur retour', () => {
    for (const q of ['q-barre-de-granit', 'q-statues-petrifiees']) {
      const p = depart();
      p.etat.jauges['soupcon-et-tension'] = 3;
      const quete = dm.quetes.get(q)!;
      appliquerEffets(quete.recompenses.effets, p.etat, dm);
      expect(p.etat.jauges['soupcon-et-tension'], q).toBe(2);
    }
  });
});

describe('La Tombe des Rois Serpents : les quêtes', () => {
  const statut = (p: Partie, id: string) => p.etat.quetes[id]?.statut;
  const activer = (p: Partie, id: string) => {
    appliquerEffets([{ quete: { id, statut: 'active' } }], p.etat, dm);
    avancerQuetes(p.etat, dm);
  };

  it('la quête principale est une enquête : étapes en parallèle, indices à recouper, et elle se clôt au verdict', () => {
    const p = depart();
    const etat = p.etat;
    const actives = () => etat.quetes['q-tombe-des-rois-serpents']?.actives ?? [];
    expect(statut(p, 'q-tombe-des-rois-serpents')).toBe('active');
    expect(actives()).toEqual(['rejoindre-bivouac']);
    etat.lieuxVisites.push('n1-couloir-entree');
    avancerQuetes(etat, dm);
    // Deux pistes en parallèle : comprendre ce qui a arrêté les autres, et percer le faux tombeau.
    expect(actives()).toEqual(['comprendre-les-echecs', 'percer-faux-temple']);
    // Un seul indice ne suffit pas : le passage reste fermé.
    etat.faits.push('f-eau-sous-l-idole');
    avancerQuetes(etat, dm);
    expect(actives()).toContain('percer-faux-temple');
    expect(etat.debloques).not.toContain('n2-hall-aux-statues');
    // Deux indices recoupés : le faux temple est percé, le passage s'ouvre.
    etat.faits.push('f-vapeur-des-sepulcres');
    avancerQuetes(etat, dm);
    expect(actives()).toEqual(['comprendre-les-echecs', 'franchir-niveau-deux']);
    expect(etat.faits).toContain('f-passage-temple-decouvert');
    expect(etat.debloques).toContain('n2-hall-aux-statues');
    // Deux faits sur les compagnies précédentes : la première piste aboutit.
    etat.faits.push('f-varnac-survivant', 'f-tranchee-forcee');
    avancerQuetes(etat, dm);
    expect(actives()).toEqual(['franchir-niveau-deux']);
    etat.lieuxVisites.push('n3-salle-ceremonie');
    avancerQuetes(etat, dm);
    expect(etat.flags['niveau-3-atteint']).toBe(true);
    expect(actives()).toEqual(['decouvrir-le-coeur']);
    // Comprendre une piste du cœur (ici la Couronne chez les gobelins).
    etat.faits.push('f-couronne-chez-gobelins');
    avancerQuetes(etat, dm);
    expect(actives()).toEqual(['resoudre-coeur-tombeau']);
    etat.flags['coeur-tombe-resolu'] = true;
    avancerQuetes(etat, dm);
    expect(actives()).toEqual(['regler-partage-martin']);
    etat.flags['verdict-partage-rendu'] = true;
    avancerQuetes(etat, dm);
    expect(statut(p, 'q-tombe-des-rois-serpents')).toBe('terminee');
  });

  it('descendre par la fouille (passage caché) fait aussi avancer l\'enquête : on ne reste jamais bloqué', () => {
    const p = depart();
    const etat = p.etat;
    etat.lieuxVisites.push('n1-couloir-entree');
    avancerQuetes(etat, dm);
    etat.lieuxVisites.push('n2-hall-aux-statues');
    avancerQuetes(etat, dm);
    expect(etat.quetes['q-tombe-des-rois-serpents']?.actives).toEqual(['franchir-niveau-deux']);
  });

  it('q-couronne-des-rois : le fait puis la couronne en main (la scène du trône ouvre la quête)', () => {
    const p = depart();
    activer(p, 'q-couronne-des-rois');
    expect(statut(p, 'q-couronne-des-rois')).toBe('active');
    p.etat.faits.push('f-couronne-chez-gobelins');
    avancerQuetes(p.etat, dm);
    p.etat.inventaire['couronne-rois-serpents'] = 1;
    avancerQuetes(p.etat, dm);
    expect(statut(p, 'q-couronne-des-rois')).toBe('terminee');
    expect(p.etat.flags['coeur-tombe-resolu']).toBe(true);
  });

  it('q-fontaine-des-gobelins : la statue reprise, puis remise sur son socle ou gardée', () => {
    for (const drapeau of ['statue-remise-fontaine', 'statue-gardee']) {
      const p = depart();
      activer(p, 'q-fontaine-des-gobelins');
      p.etat.inventaire['statue-or-fontaine'] = 1;
      avancerQuetes(p.etat, dm);
      expect(statut(p, 'q-fontaine-des-gobelins')).toBe('active');
      p.etat.flags[drapeau] = true;
      avancerQuetes(p.etat, dm);
      expect(statut(p, 'q-fontaine-des-gobelins'), drapeau).toBe('terminee');
    }
  });

  it('q-secret-de-baltoplate : apprendre le nom, puis régler le cercle', () => {
    const p = depart();
    activer(p, 'q-secret-de-baltoplate');
    p.etat.faits.push('f-vrai-nom-baltoplate');
    avancerQuetes(p.etat, dm);
    p.etat.flags['baltoplate-reglee'] = true;
    avancerQuetes(p.etat, dm);
    expect(statut(p, 'q-secret-de-baltoplate')).toBe('terminee');
  });

  it('q-pactes-de-xiximantre : les captifs libérés, puis Skriik', () => {
    const p = depart();
    activer(p, 'q-pactes-de-xiximantre');
    const rep = p.etat.reputations['clan-des-champignons']!;
    p.etat.flags['gobelins-sauves'] = true;
    avancerQuetes(p.etat, dm);
    p.etat.flags['couronne-obtenue'] = true;
    avancerQuetes(p.etat, dm);
    expect(statut(p, 'q-pactes-de-xiximantre')).toBe('terminee');
    expect(p.etat.reputations['clan-des-champignons']).toBe(rep + 20);
  });

  it('q-lysandre-sceau-brise : échoue si le groupe LIBÈRE Baltoplate, réussit sinon', () => {
    const echoue = depart();
    activer(echoue, 'q-lysandre-sceau-brise');
    echoue.etat.lieuxVisites.push('n2-sacristie');
    avancerQuetes(echoue.etat, dm);
    const attitude = echoue.etat.attitudes['soeur-lysandre']!;
    // Les effets de l'option « libérer » (qui pose baltoplate-reglee en même temps que le drapeau de choix) : la quête échoue, Lysandre part.
    const dil = (dm.extensions?.['dilemmes'] as { id: string; options: { id: string; effets: Parameters<typeof appliquerEffets>[0] }[] }[]).find((d) => d.id === 'dilemme-baiser-du-cercle')!;
    // Le moteur pose le drapeau de choix AVANT les effets de l'option, dans une seule application.
    appliquerEffets([{ flag: 'choix-dilemme-baiser-du-cercle-pacte-secret-baltoplate' }, ...dil.options.find((o) => o.id === 'pacte-secret-baltoplate')!.effets], echoue.etat, dm);
    expect(statut(echoue, 'q-lysandre-sceau-brise')).toBe('echouee');
    expect(echoue.etat.attitudes['soeur-lysandre']).toBe(attitude - 30);

    const reussit = depart();
    activer(reussit, 'q-lysandre-sceau-brise');
    reussit.etat.lieuxVisites.push('n2-sacristie');
    reussit.etat.flags['baltoplate-reglee'] = true;
    reussit.etat.flags['choix-dilemme-baiser-du-cercle-sceller-fielon'] = true;
    avancerQuetes(reussit.etat, dm);
    reussit.etat.flags['lysandre-mission-accomplie'] = true;
    avancerQuetes(reussit.etat, dm);
    expect(statut(reussit, 'q-lysandre-sceau-brise')).toBe('terminee');
  });

  it('les quêtes avec donneur se rendent par un drapeau de retour : elles ne se closent pas avant', () => {
    const retours: Record<string, string> = {
      'q-statues-petrifiees': 'statues-petrifiees-rapportees',
      'q-boucliers-de-l-arene': 'boucliers-rapportes-torin',
      'q-barre-de-granit': 'barre-granit-rapportee',
      'q-varnac-frere-d-armes': 'varnac-deuil-accompli',
      'q-mireille-plan-trois-paliers': 'mireille-carte-complete',
    };
    for (const [q, drapeau] of Object.entries(retours)) {
      const quete = dm.quetes.get(q)!;
      const derniere = quete.etapes.find((e) => e.termine)!;
      expect(derniere.completion, q).toEqual({ flag: drapeau });
    }
  });
});

describe('La Tombe des Rois Serpents : les dilemmes et leurs échos', () => {
  it('chaque option de dilemme a un épilogue, des coûts et des gains', () => {
    const dil = (dm.extensions?.['dilemmes'] ?? []) as { id: string; options: { id: string; epilogue?: string; couts: string[]; gains: string[] }[]; abstention: { epilogue?: string }; echos: { si: string }[] }[];
    expect(dil.length).toBe(4);
    for (const d of dil) {
      for (const o of d.options) {
        expect(o.epilogue, `${d.id}/${o.id}`).toBeTruthy();
        expect(o.couts.length).toBeGreaterThan(0);
        expect(o.gains.length).toBeGreaterThan(0);
      }
      expect(d.abstention.epilogue, `${d.id}/abstention`).toBeTruthy();
      // Le décompte clôt l'histoire : pas d'écho (il ne se lirait jamais).
      if (d.id !== 'dilemme-le-decompte') expect(d.echos.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('La Tombe des Rois Serpents : les scènes à choix de découverte', () => {
  type Scene = { id: string; lieu: string; preparer?: (p: Partie) => void; origines: Origine[]; generaux: string[]; origine: string[] };
  const SCENES: Scene[] = [
    { id: 'evt-la-fontaine-a-sec', lieu: 'n3-salle-ceremonie', origines: [{ espece: 'nain', classe: 'guerrier' }, { espece: 'humain', classe: 'rodeur' }], generaux: ['suivre-la-trainee'], origine: ['nain-pese-l-or', 'rodeur-lit-les-pas'] },
    { id: 'evt-les-rouleaux-de-la-sacristie', lieu: 'n2-sacristie', origines: [{ espece: 'humain', classe: 'clerc' }, { espece: 'elfe', classe: 'magicien' }], generaux: ['dechiffrer-les-rouleaux'], origine: ['clerc-lit-le-rite', 'magicien-flaire-le-chiffre'] },
    { id: 'evt-le-trone-vide', lieu: 'n3-salle-du-trone', origines: [{ espece: 'humain', classe: 'guerrier' }, { espece: 'humain', classe: 'barde' }], generaux: ['chercher-la-couronne', 's-asseoir'], origine: ['guerrier-flaire-le-danger', 'barde-joue-le-roi'] },
    { id: 'evt-la-statue-et-la-fontaine', lieu: 'n3-salle-ceremonie', preparer: (p) => { p.etat.inventaire['statue-or-fontaine'] = 1; }, origines: [{ espece: 'humain', classe: 'clerc' }], generaux: ['remettre-sur-son-socle', 'garder-pour-le-butin'], origine: ['clerc-rend-a-sa-place'] },
  ];
  const ouvre = (s: Scene, origines: Origine[]): Partie => {
    const p = depart(11, origines);
    p.etat.lieu = s.lieu;
    p.etat.lieuxVisites.push(s.lieu);
    s.preparer?.(p);
    const res = moteur.executer(p, { type: 'ouvrirEvenement', evenement: s.id });
    expect(res.refus, `ouvrir ${s.id}`).toBeUndefined();
    return res.partie;
  };

  for (const s of SCENES) {
    it(`${s.id} : les choix généraux sont toujours là, ceux d'origine seulement avec le bon héros, et chaque choix se joue`, () => {
      const moines = Array.from({ length: 6 }, () => ({ espece: 'humain', classe: 'moine' }));
      const sans = fiche(ouvre(s, moines))!;
      expect(sans.choix.map((c) => c.id)).toEqual(s.generaux);
      const avec = fiche(ouvre(s, s.origines))!;
      for (const id of s.origine) expect(avec.choix.map((c) => c.id), id).toContain(id);
      for (const c of avec.choix) {
        const res = moteur.executer(ouvre(s, s.origines), { type: 'choisirEvenement', evenement: s.id, choix: c.id });
        expect(res.refus, `${s.id} / ${c.id}`).toBeUndefined();
        expect(fiche(res.partie)?.resultat?.texte.length, `${s.id} / ${c.id}`).toBeGreaterThan(40);
        expect(res.partie.etat.flags[`evt-${s.id}-${c.id}`]).toBe(true);
      }
    });
  }

  it('remettre la statue sur son socle retire l’objet, la garder le conserve', () => {
    const s = SCENES[3]!;
    const remise = moteur.executer(ouvre(s, []), { type: 'choisirEvenement', evenement: s.id, choix: 'remettre-sur-son-socle' }).partie;
    expect(remise.etat.inventaire['statue-or-fontaine'] ?? 0).toBe(0);
    expect(remise.etat.flags['statue-remise-fontaine']).toBe(true);
    const gardee = moteur.executer(ouvre(s, []), { type: 'choisirEvenement', evenement: s.id, choix: 'garder-pour-le-butin' }).partie;
    expect(gardee.etat.inventaire['statue-or-fontaine']).toBe(1);
    expect(gardee.etat.flags['statue-gardee']).toBe(true);
  });
});
