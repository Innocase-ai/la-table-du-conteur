// Les correctifs de l'audit du moteur (05/11/2026) : un test par défaut corrigé.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validerMonde, articles, objetDe, bilanPersonnage, creerMoteur, personnageDepuisFiche, groupeConseille, MODULES_STANDARD, type DonneesMonde, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const mondes: Record<string, DonneesMonde> = {};
function monde(id: string): DonneesMonde {
  if (!mondes[id]) {
    const r = chargerMonde(join(RACINE_MONDES, id));
    if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
    mondes[id] = r.monde;
  }
  return mondes[id]!;
}
export function partie(id: string, niveau = 3) {
  const dm = monde(id);
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
  const groupe = groupeConseille(niveau, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const p = moteur.executer(moteur.nouvellePartie(groupe, { graine: 1, niveau }), { type: 'commencer' }).partie;
  return { dm, moteur, p };
}
const ici = (p: Partie, lieu: string, flags: Record<string, boolean> = {}): Partie => ({ ...p, scene: { type: 'exploration' }, etat: { ...p.etat, lieu, flags: { ...p.etat.flags, ...flags } } });

describe('audit : dialogue', () => {
  it('une fin déclenchée par un sujet de dialogue pose aussitôt la scène de fin', () => {
    const { dm, moteur, p } = partie('citadelle-des-marees');
    let q = ici(p, dm.pnj.get('maitre-osric-vent')!.lieu, { 'nolwen-avec-le-groupe': true });
    q = moteur.executer(q, { type: 'parler', pnj: 'maitre-osric-vent' }).partie;
    const r = moteur.executer(q, { type: 'parler', pnj: 'maitre-osric-vent', sujet: 'livrer-l-enfant' });
    expect(r.refus).toBeUndefined();
    expect(r.partie.scene).toEqual({ type: 'fin', fin: 'fin-livrer' });
  });
});

describe('audit : rencontres sans combat', () => {
  it('une rencontre sociale ouvre la scène de rencontre avec ses autres issues ; une issue ratée ne se retente pas', () => {
    const { moteur, p } = partie('val-des-cendres');
    const q = moteur.executer(ici(p, 'pont-de-fer'), { type: 'aller', vers: 'pdf-porte-principale' }).partie;
    expect(q.scene).toEqual({ type: 'rencontre', rencontre: 'pdf-controle-de-la-porte' });
    const issues = moteur.propositions(q).filter((x) => x.ordre?.type === 'reglerRencontre');
    expect(issues.some((x) => x.ordre?.alternative === 'pot-de-vin')).toBe(true);
    expect(issues.some((x) => x.libelle === 'Combattre')).toBe(false);
    expect(issues.some((x) => x.ordre?.alternative === 'montrer-le-sceau')).toBe(false); // sa condition n'est pas remplie
    // Un échec a un prix (fail forward) : la rencontre se dénoue quand même, plus cher, et la scène reprend.
    const avant = q.etat.reputations['compagnie-du-fer-gris'] ?? 0;
    let rate;
    for (let g = 1; g < 40 && !rate; g++) {
      const r = moteur.executer({ ...q, graine: g }, { type: 'reglerRencontre', issue: 'alternative', alternative: 'pot-de-vin' });
      if (r.evenements.some((e) => e.type === 'jet' && !e.jet.reussite)) rate = r;
    }
    expect(rate, 'un échec du pot-de-vin').toBeDefined();
    expect(rate!.partie.scene.type).toBe('exploration');
    expect(rate!.partie.etat.reputations['compagnie-du-fer-gris']).toBeLessThan(avant);
    // Une issue sans jet règle la rencontre.
    const fin = moteur.executer(q, { type: 'reglerRencontre', issue: 'alternative', alternative: 'autre-chemin' }).partie;
    expect(fin.scene.type).toBe('exploration');
  });
});

describe('audit : quêtes proposées', () => {
  it('une quête proposée par un PNJ s’accepte (bouton du Journal) et commence à sa première étape', () => {
    const { dm, moteur, p } = partie('val-des-cendres');
    const kor = dm.pnj.get('kor-varnak')!;
    const depart = ici(p, kor.lieu);
    depart.etat.attitudes = { ...depart.etat.attitudes, [kor.id]: 20 }; // le sujet demande sa confiance
    let q = moteur.executer(depart, { type: 'parler', pnj: kor.id }).partie;
    q = moteur.executer(q, { type: 'parler', pnj: kor.id, sujet: 'la-forge' }).partie;
    expect(q.etat.quetes['q-fer-gris-le-laissez-passer']?.statut).toBe('proposee');
    const bouton = moteur.propositions(q).find((x) => x.ordre?.type === 'accepterQuete' && x.ordre.quete === 'q-fer-gris-le-laissez-passer');
    expect(bouton?.libelle).toMatch(/^Accepter : /);
    q = moteur.executer(q, bouton!.ordre!).partie;
    expect(q.etat.quetes['q-fer-gris-le-laissez-passer']).toMatchObject({ statut: 'active', actives: [dm.quetes.get('q-fer-gris-le-laissez-passer')!.debut] });
    expect(moteur.executer(q, bouton!.ordre!).refus).toMatch(/pas en attente/);
  });
});

describe('audit : boutiques et services', () => {
  const parlerA = (m: ReturnType<typeof partie>, pnj: string, pieces: number) => {
    const q = ici(m.p, m.dm.pnj.get(pnj)!.lieu);
    q.etat.pieces = pieces;
    return m.moteur.executer(q, { type: 'parler', pnj }).partie;
  };

  it('acheter à un marchand : l’or baisse, l’objet entre dans le sac, le stock diminue ; refus sans assez d’or', () => {
    const m = partie('citadelle-des-marees');
    const pnj = [...m.dm.pnj.values()].find((n) => n.boutique?.stock.some((s) => s.quantite === 1 || s.quantite > 0))!;
    let q = parlerA(m, pnj.id, 500);
    const a = articles(m.moteur.ctx, q, pnj)[0]!;
    const bouton = m.moteur.propositions(q).find((x) => x.ordre?.type === 'acheter' && x.ordre.objet === a.objet);
    expect(bouton?.libelle).toMatch(/^Acheter — /);
    const avant = q.etat.inventaire[a.objet] ?? 0;
    q = m.moteur.executer(q, bouton!.ordre!).partie;
    expect(q.etat.inventaire[a.objet]).toBe(avant + 1);
    expect(q.etat.pieces).toBeCloseTo(500 - a.prix, 2);
    expect(articles(m.moteur.ctx, q, pnj).find((x) => x.objet === a.objet)?.reste ?? 0).toBe(a.reste - 1);
    const pauvre = { ...q, etat: { ...q.etat, pieces: 0 } };
    if (a.prix > 0 && a.reste > 1) expect(m.moteur.executer(pauvre, bouton!.ordre!).refus).toMatch(/Il faut/);
  });

  it('vendre : seulement ce que la boutique rachète, au prix de rachat', () => {
    const m = partie('val-des-cendres');
    const candidats = ['corde', 'rations', 'torche', 'dague', 'parchemin', 'potion-de-guerison'];
    let pnj = undefined as ReturnType<typeof m.dm.pnj.get>;
    let objet = '';
    for (const n of m.dm.pnj.values()) {
      if (!n.boutique || n.boutique.rachat <= 0) continue;
      const types = n.boutique.types as string[];
      const o = candidats.find((id) => !types.length || types.includes(objetDe(m.moteur.ctx, id).categorie));
      if (o) { pnj = n; objet = o; break; }
    }
    let q = parlerA(m, pnj!.id, 0);
    q.etat.inventaire[objet] = 2;
    const vente = m.moteur.propositions(q).find((x) => x.ordre?.type === 'vendre' && x.ordre.objet === objet);
    expect(vente).toBeDefined();
    q = m.moteur.executer(q, vente!.ordre!).partie;
    expect(q.etat.inventaire[objet]).toBe(1);
    expect(q.etat.pieces).toBeGreaterThan(0);
  });

  it('une chambre payée donne une nuit de repos ; des soins rendent tous les PV', () => {
    const m = partie('val-des-cendres');
    const hote = [...m.dm.pnj.values()].find((n) => n.services.some((s) => /chambre|dortoir/.test(s.id)))!;
    const chambre = hote.services.find((s) => /chambre|dortoir/.test(s.id))!;
    let q = parlerA(m, hote.id, 100);
    q.groupe[0]!.pv = 1;
    const jour = q.etat.jour;
    q = m.moteur.executer(q, { type: 'payerService', pnj: hote.id, service: chambre.id }).partie;
    expect(q.etat.jour).toBe(jour + 1);
    expect(q.groupe[0]!.pv).toBe(q.groupe[0]!.fiche.pvMax);
    expect(q.etat.pieces).toBeCloseTo(100 - chambre.prix, 2);
    const soigneur = [...m.dm.pnj.values()].find((n) => n.services.some((s) => /^soins/.test(s.id) && !s.condition))!;
    const soins = soigneur.services.find((s) => /^soins/.test(s.id))!;
    let r = parlerA(m, soigneur.id, 100);
    r.groupe[1]!.pv = 1;
    r = m.moteur.executer(r, { type: 'payerService', pnj: soigneur.id, service: soins.id }).partie;
    expect(r.groupe[1]!.pv).toBe(r.groupe[1]!.fiche.pvMax);
  });
});

describe('audit : temps, secrets, défaite', () => {
  it('un trajet de plusieurs heures fait avancer le temps, et passer minuit commence un nouveau jour', () => {
    const { dm, moteur, p } = partie('citadelle-des-marees');
    const q = ici(p, 'citadelle-des-marees');
    q.etat.heure = 23;
    const r = moteur.executer(q, { type: 'aller', vers: 'route-des-falaises' }).partie;
    const lien = [...dm.lieux.values()].flatMap((l) => (l.liens ?? []).map((k) => ({ de: l.id, ...k }))).find((k) => (k.de === 'route-des-falaises' && k.vers === 'citadelle-des-marees') || (k.de === 'citadelle-des-marees' && k.vers === 'route-des-falaises'))!;
    expect(lien.heures).toBeGreaterThan(0);
    expect(r.etat.jour).toBe(q.etat.jour + 1);
    expect(r.etat.heure).toBe((23 + lien.heures) % 24);
  });

  it('un PNJ qui ne vient que le soir n’est là que le soir', () => {
    const { dm, moteur, p } = partie('val-des-cendres');
    const pnj = [...dm.pnj.values()].find((n) => n.presences.some((x) => x.moment === 'soir' && !x.condition && x.lieu !== n.lieu))!;
    const lieu = pnj.presences.find((x) => x.moment === 'soir')!.lieu;
    const present = (heure: number) => {
      const q = ici(p, lieu);
      q.etat.heure = heure;
      return moteur.propositions(q).some((x) => x.ordre?.type === 'parler' && x.ordre.pnj === pnj.id);
    };
    expect(present(19)).toBe(true);
    expect(present(10)).toBe(pnj.presences.some((x) => x.lieu === lieu && x.moment === 'jour'));
  });

  it('un PNJ qui a un secret propose une réplique pour insister, qui vise ce secret sans le dire', () => {
    const { dm, moteur, p } = partie('val-des-cendres');
    const pnj = [...dm.pnj.values()].find((n) => n.secrets.some((s) => s.jet && !s.condition && !s.prix))!;
    const q = moteur.executer(ici(p, pnj.lieu), { type: 'parler', pnj: pnj.id }).partie;
    if (q.scene.type !== 'dialogue') return; // PNJ absent à cette heure : rien à vérifier ici
    const insister = moteur.propositions(q).find((x) => x.ordre?.type === 'influencer' && x.ordre.secret);
    expect(insister).toBeDefined();
    const fait = dm.faits.get(insister!.ordre!.secret as string)!;
    expect(insister!.libelle).not.toContain(fait.texte.slice(0, 20));
  });

  it('une défaite coûte la moitié de l’or et des heures ; la rencontre attend toujours', () => {
    const { moteur, p } = partie('val-des-cendres');
    let q = moteur.executer(ici(p, 'le-gue'), { type: 'aller', vers: 'gue-gue-a-gue' }).partie;
    expect(q.scene.type).toBe('rencontre');
    q.etat.pieces = 100;
    const heure = q.etat.heure ?? 8;
    q = moteur.executer(q, { type: 'reglerRencontre', issue: 'defaite', heros: Object.fromEntries(q.groupe.map((h) => [h.id, { pv: 0 }])) }).partie;
    expect(q.scene.type).toBe('exploration');
    expect(q.etat.pieces).toBe(50);
    expect(q.groupe.every((h) => h.pv === 1)).toBe(true);
    expect(q.etat.heure).toBe((heure + 8) % 24);
    expect(q.etat.rencontresFaites).not.toContain('gue-embuscade-au-gue');
  });
});

describe('audit : création', () => {
  it('les sorts toujours préparés d’une sous-classe sont accordés (Domaine de la Vie : niveau 3, puis 5)', async () => {
    const { creationRapide, calculerFiche } = await import('../src');
    const fiche = (niveau: number) => {
      const r = calculerFiche(creationRapide({ classe: 'clerc', espece: 'humain', niveau, nom: 'Test' }, srd), srd);
      if (!r.ok) throw new Error(r.erreurs.join());
      return r.fiche;
    };
    expect(fiche(2).sortsAccordes).not.toContain('restauration-partielle');
    expect(fiche(3).sortsAccordes).toEqual(expect.arrayContaining(['aide', 'benediction', 'restauration-partielle', 'soins']));
    expect(fiche(5).sortsAccordes).toEqual(expect.arrayContaining(['mot-de-guerison-de-groupe', 'retour-a-la-vie']));
  });

  it('un don en double est ignoré (avec un avertissement), sans rendre le personnage invalide', async () => {
    const { creationRapide, calculerFiche } = await import('../src');
    const choix = creationRapide({ classe: 'roublard', espece: 'humain', niveau: 1, nom: 'Test' }, srd);
    const donHistorique = srd.historiques.get(choix.historique)!.don;
    const r = calculerFiche({ ...choix, dons: [...(choix.dons ?? []), donHistorique] }, srd);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fiche.avertissements.join(' ')).toMatch(/en double/);
      expect(r.fiche.aptitudes.filter((a) => a.id === donHistorique)).toHaveLength(1);
    }
  });

  it('Imposition des mains : une réserve de 5 PV par niveau, qui soigne hors combat et revient au repos long', () => {
    const { moteur, p } = partie('val-des-cendres');
    const pal = p.groupe.find((h) => h.ressources.impositionDesMains !== undefined);
    if (!pal) return; // pas de paladin dans le groupe conseillé
    expect(pal.ressources.impositionDesMains).toBe(5 * pal.fiche.niveau);
    const blesse = p.groupe.find((h) => h.id !== pal.id)!;
    blesse.pv = 1;
    const q = moteur.executer(p, { type: 'imposerLesMains', paladin: pal.id, cible: blesse.id }).partie;
    const apres = q.groupe.find((h) => h.id === blesse.id)!;
    expect(apres.pv).toBe(Math.min(apres.fiche.pvMax, 1 + 5 * pal.fiche.niveau));
  });
});

describe('audit : montée de niveau', () => {
  it('chaque classe monte du niveau 1 au niveau 5 en gardant ses choix (fiche valide à chaque niveau)', async () => {
    const { creationRapide, monterAuNiveau } = await import('../src');
    for (const classe of srd.classes.keys()) {
      for (const espece of ['humain', 'elfe', 'nain']) {
        let choix = creationRapide({ classe, espece, niveau: 1, nom: 'Test' }, srd);
        for (let n = 2; n <= 5; n++) {
          const r = monterAuNiveau(choix, n, srd);
          expect(r, `${classe} ${espece} niveau ${n}`).toBeDefined();
          expect(r!.choix.valeursBase).toEqual(choix.valeursBase);
          expect(r!.choix.competencesClasse).toEqual(choix.competencesClasse);
          for (const s of choix.sortsPrepares ?? []) expect(r!.choix.sortsPrepares).toContain(s);
          choix = r!.choix;
        }
      }
    }
  });

  it('l’XP gagnée fait monter tout le groupe : niveau, PV, emplacements, choix gardés', async () => {
    const { creationRapide, calculerFiche } = await import('../src');
    const { dm, moteur } = partie('citadelle-des-marees', 1);
    const groupe = ['guerrier', 'clerc', 'magicien'].map((classe, i) => {
      const choix = creationRapide({ classe, espece: 'humain', niveau: 1, nom: `H${i}` }, srd);
      const r = calculerFiche(choix, srd);
      if (!r.ok) throw new Error(r.erreurs.join());
      return personnageDepuisFiche(r.fiche, { id: `h${i}`, choix });
    });
    let p = moteur.executer(moteur.nouvellePartie(groupe, { graine: 1, niveau: 1 }), { type: 'commencer' }).partie;
    p = { ...p, scene: { type: 'rencontre', rencontre: [...dm.rencontres.keys()][0]! } };
    const pvAvant = p.groupe.map((h) => h.fiche.pvMax);
    const r = moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire', px: 900 * groupe.length });
    expect(r.partie.etat.niveauGroupe).toBe(3);
    r.partie.groupe.forEach((h, i) => {
      expect(h.fiche.niveau).toBe(3);
      expect(h.choix?.niveau).toBe(3);
      expect(h.fiche.pvMax).toBeGreaterThan(pvAvant[i]!);
      expect(h.pv).toBe(h.fiche.pvMax);
    });
    expect(r.partie.groupe[2]!.emplacements[1]).toBeGreaterThan(0); // magicien niveau 3 : emplacements de niveau 2
    expect(r.evenements.some((e) => e.type === 'constat' && /atteint le niveau 3/.test(e.texte))).toBe(true);
  });
});

describe('récompenses conditionnelles et variantes de rencontre', () => {
  it('un événement conditionnel donne son XP une seule fois, quand la condition devient vraie', () => {
    const { dm, moteur, groupe } = (() => {
      const dm = monde('citadelle-des-marees');
      dm.evenements.set('test-bonus-objectif', { id: 'test-bonus-objectif', declencheur: 'condition', condition: { flag: 'objectif-atteint' }, unique: true, narration: 'Un bonus.', effets: [{ xp: 50 }] } as never);
      const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
      const groupe = groupeConseille(1, srd).emplacements.map((p) => {
        const f = bilanPersonnage(p!, srd).fiche!;
        return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
      });
      return { dm, moteur, groupe };
    })();
    const debut = moteur.nouvellePartie(groupe, { graine: 1, niveau: 1 });
    const sans = moteur.executer(debut, { type: 'commencer' }).partie;
    expect(sans.etat.xp).toBe(0); // condition fausse : rien
    const avec = { ...debut, etat: { ...debut.etat, flags: { ...debut.etat.flags, 'objectif-atteint': true } } };
    const r = moteur.executer(avec, { type: 'commencer' }).partie;
    expect(r.etat.xp).toBe(50);
    expect(dm.evenements.has('test-bonus-objectif')).toBe(true);
  });
});

describe('avis d’écriture du validateur (enjeu, PX, issue de repli)', () => {
  const avis = (id: string, dm = monde(id)) => validerMonde(dm, srd).avertissements;
  it('les deux mondes livrés ne déclenchent aucun de ces avis', () => {
    for (const id of ['val-des-cendres', 'citadelle-des-marees']) {
      expect(avis(id).filter((a) => /^Enjeu|^PX :|sans autre issue/.test(a)), id).toEqual([]);
    }
  });
  it('un monde sans fin liée à une jauge n’a pas d’enjeu écrit', () => {
    const dm = JSON.parse(JSON.stringify({ x: 0 })) && monde('citadelle-des-marees');
    const copie = { ...dm, fins: new Map([...dm.fins].map(([k, f]) => [k, { ...f, condition: { flag: 'x' } }])), jauges: new Map() } as DonneesMonde;
    expect(avis('citadelle-des-marees', copie).some((a) => /^Enjeu/.test(a))).toBe(true);
  });
  it('un monde qui n’atteint pas son niveau maximum avec ses PX le signale', () => {
    const dm = monde('citadelle-des-marees');
    const copie = { ...dm, monde: { ...dm.monde, niveaux: { min: 1, max: 10 } } } as DonneesMonde; // le monde rapporte désormais assez de PX pour le niveau 5
    expect(avis('citadelle-des-marees', copie).some((a) => /^PX :/.test(a))).toBe(true);
  });
});
