import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appliquerEffets, avancerQuetes, etatInitial, evaluerCondition, validerMonde, verifierEnigme, type DonneesMonde } from '../src';
import { chargerMonde, listerMondes, RACINE_MONDES } from '../src/monde/chargeur';
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
  }
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
