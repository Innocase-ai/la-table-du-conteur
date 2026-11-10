import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { adapterRencontre, appliquerEffets, avancerQuetes, Estimation, MODULES_STANDARD, STYLE_INDIRECT, estimerCampagne, etatInitial, evaluerCondition, imageDe, validerMonde, verifierEnigme, verifierImages, type DonneesMonde } from '../src';
import { chargerManifesteImages, chargerMonde, listerMondes, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const DOSSIER = join(import.meta.dirname, 'fixtures/mini-monde');

function charger(): DonneesMonde {
  const r = chargerMonde(DOSSIER);
  if (!r.ok) throw new Error(r.erreurs.map((e) => `${e.fichier}: ${e.message}`).join('\n'));
  return r.monde;
}

describe('format de monde', () => {
  it('le mini-monde se charge et se valide sans erreur', () => {
    const bilan = validerMonde(charger(), srd);
    expect(bilan.erreurs).toEqual([]);
    expect(bilan.stats).toMatchObject({ pnj: 1, tresors: 1, rencontres: 2, quetes: { principale: 1 } });
  });

  it('avertit des réponses de PNJ au style indirect ou trop courtes, sans en faire une erreur', () => {
    const dm = charger();
    const pnj = dm.pnj.get('bertrand')!;
    const long = 'Il se penche sur le comptoir, essuie une chope qui n’en a pas besoin, puis baisse la voix pour que personne d’autre ne l’entende : « Le pacte, c’est une vieille histoire. Les gens d’ici préfèrent la laisser dormir, et moi aussi, jusqu’au jour où vous reviendrez avec quelque chose à me proposer. »';
    pnj.sujets = [
      { id: 'indirect', mots: ['a'], question: 'Q1', reponse: 'Il dit que la récolte a été mauvaise et que les gens ont faim cette année, mais il n’en dira pas plus devant des étrangers.', revele: [], effets: [], unique: false },
      { id: 'court', mots: ['b'], question: 'Q2', reponse: 'Il hausse les épaules.', revele: [], effets: [], unique: false },
      { id: 'bon', mots: ['c'], question: 'Q3', reponse: long, revele: [], effets: [], unique: false },
    ] as typeof pnj.sujets;
    const bilan = validerMonde(dm, srd);
    expect(bilan.erreurs).toEqual([]);
    const a = bilan.avertissements.join('\n');
    expect(a).toMatch(/Dialogues : 1 réponses sur 3 sont au style indirect[^\n]*bertrand:indirect/);
    expect(a).toMatch(/Dialogues : 2 réponses sur 3 font moins de 35 mots[^\n]*bertrand:court/);
    expect(a).not.toMatch(/Dialogues[^\n]*bertrand:bon/);
    expect(STYLE_INDIRECT.test('Elle explique que la mer s’est retirée.')).toBe(true);
    expect(STYLE_INDIRECT.test('« Elle explique que… » est une réplique, pas un style. Il dit : bonjour')).toBe(false);
    expect(STYLE_INDIRECT.test('Il dit : « Bonjour. »')).toBe(false);
  });

  it('signale une référence cassée, un lieu inaccessible et une quête incohérente', () => {
    const dm = charger();
    dm.pnj.get('bertrand')!.lieu = 'nulle-part';
    dm.lieux.set('ile', { ...dm.lieux.get('grotte')!, id: 'ile', parent: undefined, liens: [] });
    dm.quetes.get('q-loups')!.etapes[0]!.suivantes = ['fantome'];
    dm.rencontres.get('r-loups')!.monstres = [{ profil: 'dragon-inexistant', nombre: 1 }];
    const e = validerMonde(dm, srd).erreurs.join('\n');
    expect(e).toMatch(/lieu inconnu « nulle-part »/);
    expect(e).toMatch(/Lieu « ile » : inaccessible/);
    expect(e).toMatch(/suite inconnue « fantome »/);
    expect(e).toMatch(/profil de monstre inconnu « dragon-inexistant »/);
  });

  it('détecte une étape de quête inatteignable et une table de butin qui boucle', () => {
    const dm = charger();
    dm.quetes.get('q-loups')!.etapes.push({ id: 'orpheline', texte: 'x', completion: { flag: 'x' }, suivantes: [], termine: false, effets: [] });
    dm.tables.set('t', { id: 't', nom: 'T', palier: 1, entrees: [{ poids: 1, table: 't' }] });
    const e = validerMonde(dm, srd).erreurs.join('\n');
    expect(e).toMatch(/« orpheline » n'est pas atteignable/);
    expect(e).toMatch(/se référence elle-même/);
  });

  it('avertit des faits jamais révélés et des rencontres mal équilibrées', () => {
    const dm = charger();
    dm.faits.set('f-orphelin', { id: 'f-orphelin', texte: 'x', categorie: 'histoire', importance: 1, fiable: true });
    dm.rencontres.get('r-loups')!.monstres = [{ profil: 'ogre', nombre: 8 }];
    const a = validerMonde(dm, srd).avertissements.join('\n');
    expect(a).toMatch(/Fait « f-orphelin »/);
    expect(a).toMatch(/Rencontre « r-loups »/);
  });

  it('signale une carte tactique sans assez de cases de départ, et une fin déjà vraie au départ', () => {
    const dm = charger();
    const r = dm.rencontres.get('r-loups')!;
    r.monstres = [{ profil: 'loup', nombre: 3 }];
    r.carte = ['H.H.....', '........', '.....m..'];
    const a = validerMonde(dm, srd).avertissements.join('\n');
    expect(a).toMatch(/Rencontre « r-loups » : 2 case\(s\) de départ des héros \(H\) pour un groupe de 6/);
    expect(a).toMatch(/Rencontre « r-loups » : 1 case\(s\) de départ \(m\) pour 3 monstres/);
    const fin = [...dm.fins.values()][0]!;
    fin.condition = { non: { flag: 'jamais-pose' } };
    expect(validerMonde(dm, srd).erreurs.join('\n')).toMatch(new RegExp(`Fin « ${fin.id} » : sa condition est déjà vraie au départ`));
  });

  it('refuse un fichier qui ne respecte pas le schéma, avec un message lisible', () => {
    const r = chargerMonde(join(import.meta.dirname, 'fixtures'));
    expect(r.ok).toBe(false);
  });

  it('liste les mondes du dossier packages/mondes (zéro ou plus)', () => {
    expect(Array.isArray(listerMondes())).toBe(true);
  });
});

describe("état du monde", () => {
  it('évalue les conditions et applique les effets', () => {
    const dm = charger();
    const e = etatInitial(dm);
    expect(evaluerCondition({ et: [{ non: { flag: 'x' } }, { jauge: { id: 'peur', min: 1 } }] }, e)).toBe(true);
    appliquerEffets([{ flag: 'x' }, { jauge: { id: 'peur', delta: 5 } }, { reputation: { faction: 'villageois', delta: -200 } }], e, dm);
    expect(e.flags.x).toBe(true);
    expect(e.jauges.peur).toBe(3); // bornée par la jauge
    expect(e.reputations.villageois).toBe(-100);
    expect(evaluerCondition({ ou: [{ flag: 'x' }, { fait: 'rien' }] }, e)).toBe(true);
  });

  it('fait avancer une quête jusqu\'à sa fin et distribue les récompenses', () => {
    const dm = charger();
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: 'q-loups', statut: 'active' } }], e, dm);
    expect(e.quetes['q-loups']!.actives).toEqual(['tuer-alpha']);
    appliquerEffets([{ objet: { id: 'croc-de-loup' } }], e, dm);
    expect(e.quetes['q-loups']!.actives).toEqual(['rapporter']);
    appliquerEffets([{ flag: 'croc-remis' }], e, dm);
    avancerQuetes(e, dm);
    expect(e.quetes['q-loups']).toMatchObject({ statut: 'terminee', actives: [] });
    expect(e.xp).toBe(200);
    expect(e.pieces).toBe(20);
  });

  it('une étape finale (termine) clôt la quête une seule fois, même avec une autre étape en attente', () => {
    const dm = charger();
    const q = dm.quetes.get('q-loups')!;
    q.etapes[0]!.suivantes = ['rapporter', 'autre-fin'];
    q.etapes.push({ id: 'autre-fin', texte: 'x', completion: { flag: 'x' }, suivantes: [], termine: true, effets: [] });
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: 'q-loups', statut: 'active' } }, { objet: { id: 'croc-de-loup' } }, { flag: 'x' }], e, dm);
    expect(e.quetes['q-loups']!.statut).toBe('terminee');
    expect(e.xp).toBe(200); // récompenses données une seule fois
    appliquerEffets([{ quete: { id: 'q-loups', statut: 'terminee' } }], e, dm);
    expect(e.xp).toBe(200);
  });

  it('un échec de quête est détecté', () => {
    const dm = charger();
    dm.quetes.get('q-loups')!.etapes[0]!.echec = { pnj: { id: 'bertrand', etat: 'mort' } };
    const e = etatInitial(dm);
    appliquerEffets([{ quete: { id: 'q-loups', statut: 'active' } }, { pnjEtat: { pnj: 'bertrand', etat: 'mort' } }], e, dm);
    expect(e.quetes['q-loups']!.statut).toBe('echouee');
  });

  it('le moteur tranche les énigmes', () => {
    const enigme = charger().enigmes.get('e-runes')!;
    expect(verifierEnigme(enigme, ['Eau', 'feu', 'pierre'])).toBe(true);
    expect(verifierEnigme(enigme, ['feu', 'eau', 'pierre'])).toBe(false);
    expect(verifierEnigme(enigme, 'eau')).toBe(false);
  });
});

describe('mondes livrés', () => {
  it('le dossier des mondes se lit', () => {
    expect(Array.isArray(listerMondes())).toBe(true);
  });

  for (const id of listerMondes()) {
    it(`${id} : se charge (schémas respectés) ; un monde publié n'a aucune erreur de validation`, () => {
      const r = chargerMonde(join(RACINE_MONDES, id));
      expect(r.ok, r.ok ? '' : r.erreurs.map((e) => `${e.fichier}: ${e.message}`).join('\n')).toBe(true);
      if (r.ok && r.monde.monde.statut === 'publie') expect(validerMonde(r.monde, srd).erreurs).toEqual([]);
    });

    it(`${id} : les données des modules (scènes narrées…) sont valides`, () => {
      const r = chargerMonde(join(RACINE_MONDES, id));
      if (!r.ok) return;
      for (const m of MODULES_STANDARD) expect(m.valider?.({ dm: r.monde, srd }) ?? [], m.id).toEqual([]);
    });

    it(`${id} : son manifeste d'images (s'il existe) ne cite que des éléments du monde et des fichiers présents`, () => {
      const dossier = join(RACINE_MONDES, id);
      const manifeste = chargerManifesteImages(dossier);
      const r = chargerMonde(dossier);
      if (!manifeste || !r.ok) return;
      expect(verifierImages(r.monde, manifeste).inconnues).toEqual([]);
      for (const fichiers of Object.values(manifeste)) {
        for (const f of Object.values(fichiers)) expect(existsSync(join(dossier, 'images', f)), f).toBe(true);
      }
    });
  }
});

describe('images d\'un monde', () => {
  it('signale les entrées inconnues et les lieux / PNJ sans image', () => {
    const dm = charger();
    const lieu = [...dm.lieux.keys()][0]!;
    const bilan = verifierImages(dm, { lieux: { [lieu]: `lieu-${lieu}.webp`, fantome: 'lieu-fantome.webp' }, pnj: {}, monstres: { 'dragon-inexistant': 'x.webp' }, objets: {}, cartes: {} });
    expect(bilan.inconnues).toEqual(['lieux/fantome', 'monstres/dragon-inexistant']);
    expect(bilan.manquantes).toContain('pnj/bertrand');
    expect(bilan.manquantes).not.toContain(`lieux/${lieu}`);
  });

  it('cartes : la clé est un lieu parent, et les enfants non posés sont signalés', () => {
    const dm = charger();
    const parent = [...dm.lieux.values()].find((l) => [...dm.lieux.values()].some((e) => e.parent === l.id))!;
    const enfants = [...dm.lieux.values()].filter((l) => l.parent === parent.id).map((l) => l.id);
    const base = { lieux: {}, pnj: {}, monstres: {}, objets: {} };
    expect(verifierImages(dm, { ...base, cartes: { [parent.id]: `carte-${parent.id}.webp` } }).inconnues).toEqual([]);
    expect(verifierImages(dm, { ...base, cartes: { [parent.id]: `carte-${parent.id}.webp` } }).sansPosition).toEqual(enfants);
    expect(verifierImages(dm, { ...base, cartes: {} }).sansPosition).toEqual([]);
    const feuille = [...dm.lieux.values()].find((l) => !enfants.includes(l.id) && ![...dm.lieux.values()].some((e) => e.parent === l.id))!;
    expect(verifierImages(dm, { ...base, cartes: { [feuille.id]: 'x.webp' } }).inconnues).toEqual([`cartes/${feuille.id}`]);
  });

  it('Val des Cendres : tout est illustré (151 lieux, 63 PNJ, 16 objets ; les monstres sont au bestiaire commun)', () => {
    const dossier = join(RACINE_MONDES, 'val-des-cendres');
    const r = chargerMonde(dossier);
    const manifeste = chargerManifesteImages(dossier)!;
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(verifierImages(r.monde, manifeste).manquantes).toEqual([]);
    expect(imageDe(manifeste, 'lieux', 'haute-forge')).toBe('lieu-haute-forge.webp');
    expect(manifeste.monstres).toEqual({});
    expect(imageDe(undefined, 'pnj', 'brunhild')).toBeUndefined();
  });
});

describe('Val des Cendres : parcours', () => {
  const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
  const dm = r.ok ? r.monde : undefined;
  const base = ['a-parle-a-hesta', 'lanterne-visitee', 'cryptes-ouvertes', 'cryptes-franchies', 'haute-forge-ouverte', 'ecluse-noire-trouvee', 'coeur-atteint'];

  for (const choix of ['rallumer', 'eteindre', 'achever', 'fer-gris']) {
    it(`la quête principale mène à la fin « ${choix} »`, () => {
      expect(dm).toBeDefined();
      const e = etatInitial(dm!, 5);
      appliquerEffets(
        [{ quete: { id: 'q-la-lanterne-faiblit', statut: 'active' } }, { objet: { id: 'cle-du-sceau-de-la-forge' } }, { objet: { id: 'cle-de-l-ecluse-noire' } }, ...[...base, `choix-${choix}`].map((flag) => ({ flag }))],
        e,
        dm!,
      );
      expect(e.quetes['q-la-lanterne-faiblit']).toMatchObject({ statut: 'terminee', actives: [] });
      expect(e.fin).toBe(`fin-${choix}`);
    });
  }

  it('la jauge de Cendre au maximum submerge le village', () => {
    const e = etatInitial(dm!, 3);
    appliquerEffets([{ jauge: { id: 'cendre', delta: 10 } }, ...dm!.jauges.get('cendre')!.paliers.filter((p) => p.seuil <= 5).flatMap((p) => p.effets)], e, dm!);
    expect(e.jauges.cendre).toBe(5);
    expect(e.fin).toBe('fin-la-cendre-submerge');
  });

  it('le laissez-passer du Fer-Gris offert par un déserteur compte comme un don, pas comme un vol', () => {
    const e = etatInitial(dm!, 4);
    appliquerEffets([{ quete: { id: 'q-fer-gris-le-laissez-passer', statut: 'active' } }, { flag: 'pdf-sceau-donne' }, { objet: { id: 'sceau-du-fer-gris' } }], e, dm!);
    appliquerEffets([{ pnjEtat: { pnj: 'kor-varnak', etat: 'vivant' } }], e, dm!);
    expect(e.flags['z6-sceau-vole']).toBeUndefined();
  });
});

describe('La Citadelle des Marées : parcours', () => {
  const r = chargerMonde(join(RACINE_MONDES, 'citadelle-des-marees'));
  const dm = r.ok ? r.monde : undefined;
  const jusquAuPort = ['a-parle-a-ysmene', 'cit-signes-vus', 'cit-nuit-du-depart', 'nolwen-avec-le-groupe', 'ysmene-tombee', 'port-atteint', 'ligue-alliee'];
  const jusquAuPalais = [...jusquAuPort, 'chaussee-ouverte', 'palais-atteint', 'regente-rencontree'];

  for (const choix of ['renouer', 'briser', 'relever']) {
    it(`la quête principale mène à la fin « ${choix} »`, () => {
      expect(dm).toBeDefined();
      const e = etatInitial(dm!, 4);
      appliquerEffets([{ quete: { id: 'q-la-grande-maree', statut: 'active' } }, ...[...jusquAuPalais, `choix-${choix}`].map((flag) => ({ flag }))], e, dm!);
      expect(e.quetes['q-la-grande-maree']).toMatchObject({ statut: 'terminee', actives: [] });
      expect(e.fin).toBe(`fin-${choix}`);
    });
  }

  it('livrer Nolwen au phare de la Ligue est une fin possible dès le port, et Nolwen cesse d\'être escortée', () => {
    const e = etatInitial(dm!, 3);
    const livrer = dm!.pnj.get('maitre-osric-vent')!.sujets.find((s) => s.id === 'livrer-l-enfant')!;
    appliquerEffets([{ quete: { id: 'q-la-grande-maree', statut: 'active' } }, { escorte: { pnj: 'nolwen-brevemer', actif: true } }, ...jusquAuPort.map((flag) => ({ flag }))], e, dm!);
    appliquerEffets(livrer.effets, e, dm!);
    expect(e.fin).toBe('fin-livrer');
    expect(e.escortes ?? []).not.toContain('nolwen-brevemer');
  });

  it('la Grande Marée au maximum noie la côte avant tout choix', () => {
    const e = etatInitial(dm!, 2);
    appliquerEffets([{ jauge: { id: 'maree', delta: 10 } }, ...dm!.jauges.get('maree')!.paliers.filter((p) => p.seuil <= 5).flatMap((p) => p.effets)], e, dm!);
    expect(e.jauges.maree).toBe(5);
    expect(e.fin).toBe('fin-maree-haute');
  });
});

describe('estimation de campagne', () => {
  it('compte les tours depuis le contenu et chiffre chaque modèle (le plus cher coûte le plus)', () => {
    const e = estimerCampagne(charger());
    expect(e.tours).toBeGreaterThan(0);
    const [opus, sonnet, haiku] = e.couts;
    expect(opus!.usd).toBeGreaterThan(sonnet!.usd);
    expect(sonnet!.usd).toBeGreaterThan(haiku!.usd);
    for (const c of e.couts) {
      expect(c.min).toBeLessThanOrEqual(c.usd);
      expect(c.max).toBeGreaterThanOrEqual(c.usd);
    }
  });

  for (const id of listerMondes()) {
    it(`${id} : estimation.json est à jour (sinon : pnpm monde estimer ${id})`, () => {
      const r = chargerMonde(join(RACINE_MONDES, id));
      if (!r.ok || r.monde.monde.statut !== 'publie') return;
      const fichier = join(RACINE_MONDES, id, 'estimation.json');
      expect(existsSync(fichier), 'estimation.json manquant').toBe(true);
      expect(Estimation.parse(JSON.parse(readFileSync(fichier, 'utf8')))).toEqual(estimerCampagne(r.monde));
    });
  }
});

describe('Le Grimoire de Port-Sillage : parcours', () => {
  const r = chargerMonde(join(RACINE_MONDES, 'port-sillage'));
  const dm = r.ok ? r.monde : undefined;
  const enquete = ['vol-connu', 'tobie-retrouve', 'crique-trouvee', 'livre-retrouve'];
  const dilemmeLivre = () => (dm!.extensions as { dilemmes: { id: string; options: { id: string; effets: never[] }[] }[] }).dilemmes.find((d) => d.id === 'le-livre')!;

  for (const [option, fin] of [['a-aubin', 'fin-eglise'], ['a-odile', 'fin-caserne'], ['a-tobie', 'fin-tobie']] as const) {
    it(`remettre le livre (« ${option} ») mène à la fin « ${fin} »`, () => {
      expect(dm).toBeDefined();
      const e = etatInitial(dm!, 3);
      appliquerEffets([{ quete: { id: 'q-le-grimoire', statut: 'active' } }, ...enquete.map((flag) => ({ flag }))], e, dm!);
      expect(e.fin, 'aucune fin avant le choix').toBeUndefined();
      appliquerEffets(dilemmeLivre().options.find((o) => o.id === option)!.effets, e, dm!);
      expect(e.quetes['q-le-grimoire']).toMatchObject({ statut: 'terminee', actives: [] });
      expect(e.fin).toBe(fin);
    });
  }

  const option = (id: string, opt: string) => (dm!.extensions as { dilemmes: { id: string; options: { id: string; condition?: never; effets: never[] }[]; abstention: { effets: never[] } }[] }).dilemmes.find((d) => d.id === id)!.options.find((o) => o.id === opt)!;
  const dispo = (id: string, opt: string, e: ReturnType<typeof etatInitial>) => { const c = option(id, opt).condition; return c === undefined || evaluerCondition(c, e); };

  it('livrer Tobie à la caserne ou le laisser au guet empêche de lui remettre le livre ; dénoncer Odile empêche de lui remettre le livre', () => {
    for (const flag of ['choix-le-sacristain-livrer', 'tobie-au-guet']) {
      const e = etatInitial(dm!, 3);
      appliquerEffets([{ flag: 'tobie-retrouve' }], e, dm!);
      expect(dispo('le-livre', 'a-tobie', e), 'avant').toBe(true);
      appliquerEffets([{ flag }], e, dm!);
      expect(dispo('le-livre', 'a-tobie', e), flag).toBe(false);
    }
    const e = etatInitial(dm!, 3);
    expect(dispo('le-livre', 'a-odile', e)).toBe(true);
    appliquerEffets([{ flag: 'choix-la-solde-denoncer' }], e, dm!);
    expect(dispo('le-livre', 'a-odile', e)).toBe(false);
  });

  it('ne pas trancher la remise du livre mène à la fin « Église »', () => {
    const e = etatInitial(dm!, 3);
    const abstention = (dm!.extensions as { dilemmes: { id: string; abstention: { effets: never[] } }[] }).dilemmes.find((d) => d.id === 'le-livre')!.abstention;
    appliquerEffets([{ quete: { id: 'q-le-grimoire', statut: 'active' } }, ...enquete.map((flag) => ({ flag }))], e, dm!);
    appliquerEffets(abstention.effets, e, dm!);
    expect(e.fin).toBe('fin-eglise');
  });

  it('le coffre de Sorel reste ouvrable après l’énigme (le drapeau est posé mais pas l’objet) et tenir le livre pose `livre-retrouve`', () => {
    const e = etatInitial(dm!, 3);
    const coffre = dm!.tresors.get('z3-t-coffre-de-sorel')!;
    appliquerEffets([{ flag: 'livre-retrouve' }], e, dm!);
    expect(evaluerCondition(coffre.condition!, e), 'énigme résolue, livre pas encore pris').toBe(true);
    e.inventaire['livre-de-maelle'] = 1;
    expect(evaluerCondition(coffre.condition!, e), 'livre pris').toBe(false);
    const enMain = dm!.evenements.get('z4-ev-livre-en-main')!;
    const e2 = etatInitial(dm!, 3);
    expect(evaluerCondition(enMain.condition!, e2), 'sans le livre').toBe(false);
    e2.inventaire['livre-de-maelle'] = 1;
    expect(evaluerCondition(enMain.condition!, e2), 'livre crocheté dans le coffre').toBe(true);
  });

  it('l’alarme du coffre ne peut pas finir la partie : elle ne monte la jauge que jusqu’à 3', () => {
    const piege = dm!.pieges.get('z3-p-cloche-d-alarme')!;
    expect(JSON.stringify(piege.effets)).not.toContain('"jauge"');
    const ev = dm!.evenements.get('z4-ev-alarme-a-la-crique')!;
    const e = etatInitial(dm!, 3);
    appliquerEffets([{ flag: 'alarme-donnee' }, { jauge: { id: 'grande-maree', delta: 2 } }], e, dm!);
    expect(e.jauges['grande-maree']).toBe(3);
    expect(evaluerCondition(ev.condition!, e), 'déjà à 3 : plus de montée').toBe(false);
    const e2 = etatInitial(dm!, 3);
    appliquerEffets([{ flag: 'alarme-donnee' }], e2, dm!);
    expect(evaluerCondition(ev.condition!, e2), 'à 1 : l’alerte fait monter').toBe(true);
  });

  const finAtteinte = (e: ReturnType<typeof etatInitial>) => [...dm!.fins.values()].find((f) => evaluerCondition(f.condition, e))?.id;

  it('la grande marée au maximum sans le livre emporte le livre (fin d’échec, testée avant les autres)', () => {
    const e = etatInitial(dm!, 2);
    appliquerEffets([{ jauge: { id: 'grande-maree', delta: 10 } }], e, dm!);
    expect(e.jauges['grande-maree']).toBe(4);
    expect(finAtteinte(e)).toBe('fin-echec');
  });

  it('la jauge au maximum n’emporte plus le livre une fois retrouvé, et aucune fin n’arrive avant le choix', () => {
    const e = etatInitial(dm!, 2);
    appliquerEffets([{ flag: 'livre-retrouve' }, { jauge: { id: 'grande-maree', delta: 10 } }], e, dm!);
    expect(finAtteinte(e)).toBeUndefined();
  });

  it('rebondissement A : le guet-apens du quai exige le livre retrouvé et la jauge à 2, et aucune issue ne retire le livre', () => {
    const ren = dm!.rencontres.get('z5-r-guet-apens-du-quai')!;
    const lieu = dm!.lieux.get('pl-quai')!.rencontres.find((x) => x.id === ren.id)!;
    expect(lieu.declencheur).toBe('exploration');
    const cond = lieu.condition!;
    const e = etatInitial(dm!, 3);
    expect(evaluerCondition(cond, e), 'au départ').toBe(false);
    appliquerEffets([{ flag: 'livre-retrouve' }], e, dm!);
    expect(evaluerCondition(cond, e), 'livre retrouvé mais jauge à 1').toBe(false);
    appliquerEffets([{ jauge: { id: 'grande-maree', delta: 1 } }], e, dm!);
    expect(evaluerCondition(cond, e), 'livre retrouvé, jauge à 2').toBe(true);
    appliquerEffets([{ flag: 'emissaire-neutralise' }], e, dm!);
    expect(evaluerCondition(cond, e), 'émissaire neutralisé').toBe(false);
    const issues = [ren.effetsVictoire, ...ren.alternatives.flatMap((a) => [a.effets, a.echec ?? []])];
    expect(ren.alternatives.filter((a) => a.jet).every((a) => a.echec?.length && a.echecResout)).toBe(true);
    for (const effets of issues) {
      const s = etatInitial(dm!, 3);
      appliquerEffets([{ flag: 'livre-retrouve' }, { jauge: { id: 'grande-maree', delta: 1 } }], s, dm!);
      s.inventaire['livre-de-maelle'] = 1;
      appliquerEffets(effets, s, dm!);
      expect(s.flags['emissaire-neutralise']).toBe(true);
      expect(s.inventaire['livre-de-maelle']).toBe(1);
      expect(effets.some((x) => 'objet' in x && x.objet.retirer)).toBe(false);
    }
    expect(adapterRencontre(ren as never, 4).monstres.map((m) => m.nombre)).toEqual([1, 2, 2]);
  });

  it('rebondissement C : « Aubin savait » se joue quand le fait est connu, et chaque issue pose aubin-tranche', () => {
    const ren = dm!.rencontres.get('z5-r-aubin-savait')!;
    const lieu = dm!.lieux.get('eg-nef')!.rencontres.find((x) => x.id === ren.id)!;
    const e = etatInitial(dm!, 3);
    expect(evaluerCondition(lieu.condition!, e), 'fait inconnu').toBe(false);
    appliquerEffets([{ fait: 'f-aubin-savait' }], e, dm!);
    expect(evaluerCondition(lieu.condition!, e), 'fait connu').toBe(true);
    appliquerEffets([{ flag: 'aubin-tranche' }], e, dm!);
    expect(evaluerCondition(lieu.condition!, e), 'déjà tranché').toBe(false);
    const attendu: Record<string, { flag?: string; attitude: number; reputation: number }> = {
      'lui-pardonner': { flag: 'aubin-pardonne', attitude: 25, reputation: 5 },
      'le-denoncer': { flag: 'aubin-denonce', attitude: -30, reputation: -10 },
      'se-taire': { attitude: 0, reputation: 0 },
    };
    for (const a of ren.alternatives) {
      const s = etatInitial(dm!, 3);
      const att0 = s.attitudes['pere-aubin']!;
      const rep0 = s.reputations['eglise-de-la-bonace']!;
      appliquerEffets(a.effets, s, dm!);
      const x = attendu[a.id]!;
      expect(s.flags['aubin-tranche'], a.id).toBe(true);
      expect(x.flag ? s.flags[x.flag] : undefined, a.id).toBe(x.flag ? true : undefined);
      expect(s.attitudes['pere-aubin']! - att0, a.id).toBe(x.attitude);
      expect(s.reputations['eglise-de-la-bonace']! - rep0, a.id).toBe(x.reputation);
    }
    const aubin = dm!.pnj.get('pere-aubin')!;
    const sujet = aubin.sujets.find((s) => s.id === 'la-nuit-de-la-fete')!;
    const s0 = etatInitial(dm!, 3);
    expect(evaluerCondition(sujet.condition!, s0), 'sujet verrouillé').toBe(false);
    appliquerEffets([{ attitude: { pnj: 'pere-aubin', delta: 50 } }], s0, dm!);
    expect(evaluerCondition(sujet.condition!, s0), 'forte confiance').toBe(true);
    const s1 = etatInitial(dm!, 3);
    s1.inventaire['cle-de-la-crypte'] = 1;
    expect(evaluerCondition(sujet.condition!, s1), 'preuve : la clé').toBe(true);
    expect(aubin.salutations.variantes.slice(0, 2).map((v) => JSON.stringify(v.condition))).toEqual(['{"flag":"aubin-pardonne"}', '{"flag":"aubin-denonce"}']);
  });
});
