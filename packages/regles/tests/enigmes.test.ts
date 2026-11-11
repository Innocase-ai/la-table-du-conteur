import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  auditerEnigmes,
  bilanAudit,
  bilanPersonnage,
  controlerReponse,
  creerMoteur,
  formulaireEnigme,
  groupeConseille,
  lisible,
  MODULES_STANDARD,
  normaliserTexte,
  personnageDepuisFiche,
  type Enigme,
  type Ordre,
  type Partie,
} from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
const enigmes = [...dm.enigmes.values()];
const enigme = (id: string) => dm.enigmes.get(id) as Enigme;

const groupe = () =>
  groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });

/** La partie, au lieu de l'énigme. */
function auLieuDe(e: Enigme): Partie {
  const p = moteur.executer(moteur.nouvellePartie(groupe(), { graine: 21, niveau: 3 }), { type: 'commencer' }).partie;
  return { ...p, etat: { ...p.etat, lieu: e.lieu } };
}

const boutonDe = (p: Partie, e: Enigme) => moteur.propositions(p).find((x) => x.ordre?.type === 'repondreEnigme' && x.ordre.enigme === e.id)!;

/** La bonne réponse, construite à partir de ce que le formulaire propose (et non de la solution seule). */
function bonneReponse(p: Partie, e: Enigme): unknown {
  const bouton = boutonDe(p, e);
  const f = bouton.formulaire;
  const s = e.solution;
  if (!f) {
    expect(bouton.saisie, `${e.id} : ni formulaire ni saisie`).toBeDefined();
    return s.type === 'mot-de-passe' ? s.mots[0] : s.type === 'deduction' ? s.reponses[0] : undefined;
  }
  if (f.type === 'ordre' && s.type === 'sequence') {
    expect(f.taille).toBe(s.ordre.length);
    expect(f.options).toHaveLength(s.ordre.length);
    // L'ordre proposé ne donne pas la solution.
    expect(
      f.options.map((o) => o.valeur),
      `${e.id} : options dans l'ordre de la solution`,
    ).not.toEqual(s.ordre);
    return s.ordre.map((x) => f.options.find((o) => normaliserTexte(o.valeur) === normaliserTexte(x))!.valeur);
  }
  if (f.type === 'nombres' && s.type === 'cadran') {
    expect(f.libelles).toHaveLength(s.valeurs.length);
    if (f.min !== undefined) for (const v of s.valeurs) expect(v >= f.min && v <= f.max!).toBe(true);
    return s.valeurs;
  }
  if (f.type === 'interrupteurs' && s.type === 'leviers') {
    expect(f.libelles).toHaveLength(s.positions.length);
    return s.positions;
  }
  if (f.type === 'association' && s.type === 'placement') {
    expect(f.emplacements.map((x) => x.cle)).toEqual(Object.keys(s.emplacements));
    expect(f.options.map((o) => o.valeur).sort()).toEqual(Object.values(s.emplacements).sort());
    return Object.fromEntries(f.emplacements.map((x) => [x.cle, f.options.find((o) => o.valeur === s.emplacements[x.cle])!.valeur]));
  }
  throw new Error(`${e.id} : formulaire « ${f.type} » pour une solution « ${s.type} »`);
}

/** Une réponse bien formée mais fausse. */
function mauvaiseReponse(e: Enigme): unknown {
  const s = e.solution;
  switch (s.type) {
    case 'sequence':
      return [...s.ordre].reverse();
    case 'leviers':
      return s.positions.map((x) => !x);
    case 'cadran':
      return s.valeurs.map((v) => v + 1);
    case 'placement': {
      const cles = Object.keys(s.emplacements);
      const valeurs = Object.values(s.emplacements);
      return Object.fromEntries(cles.map((c, i) => [c, valeurs[(i + 1) % valeurs.length]]));
    }
    default:
      return 'zzz';
  }
}

const ordreDe = (p: Partie, e: Enigme, reponse: unknown): Ordre => ({ ...boutonDe(p, e).ordre!, reponse });

describe('énigmes : répondre par les boutons', () => {
  it.each(enigmes.map((e) => [e.id, e] as const))('« %s » se résout par sa réponse structurée', (_id, e) => {
    const p = auLieuDe(e);
    const res = moteur.executer(p, ordreDe(p, e, bonneReponse(p, e)));
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.exploration.enigmes[e.id]).toBe('resolue');
  });

  it('une énigme structurée ne propose pas de saisie de texte, un mot de passe oui', () => {
    expect(boutonDe(auLieuDe(enigme('gro-e-aiguillages-de-la-fosse')), enigme('gro-e-aiguillages-de-la-fosse'))).toMatchObject({
      formulaire: { type: 'ordre', taille: 3 },
    });
    expect(boutonDe(auLieuDe(enigme('gro-e-aiguillages-de-la-fosse')), enigme('gro-e-aiguillages-de-la-fosse')).saisie).toBeUndefined();
    const mot = enigme('cry-e-le-mot-d-ordre');
    expect(boutonDe(auLieuDe(mot), mot)).toMatchObject({ saisie: { champ: 'reponse' } });
    expect(boutonDe(auLieuDe(mot), mot).formulaire).toBeUndefined();
  });

  it('le formulaire met des mots lisibles : noms des objets, identifiants humanisés', () => {
    const placement = formulaireEnigme(enigme('vei-e-mecanisme-de-fennick'), (id) => dm.objets.get(id)?.nom);
    expect(placement).toMatchObject({
      type: 'association',
      emplacements: [{ cle: 'arbre-moteur', libelle: 'Arbre moteur' }, { cle: 'arbre-relais' }, { cle: 'arbre-sortie' }],
    });
    expect(placement && placement.type === 'association' && placement.options.map((o) => o.libelle).sort()).toEqual([
      'Grand pignon de fer',
      'Petit pignon de cuivre',
      'Pignon moyen de laiton',
    ]);
    expect(formulaireEnigme(enigme('gro-e-aiguillages-de-la-fosse'))).toMatchObject({
      options: expect.arrayContaining([{ valeur: 'wagonnet-de-minerai', libelle: 'Wagonnet de minerai' }]),
    });
    expect(lisible('empreinte-de-l-eau')).toBe("Empreinte de l'eau");
    expect(lisible('hf-jeton-d-engrenages')).toBe("Hf jeton d'engrenages");
    expect(lisible('Rouge')).toBe('Rouge');
    expect(lisible("Pièce d'étain")).toBe("Pièce d'étain");
  });
});

describe('énigmes : une réponse mal formée n’est pas une mauvaise réponse', () => {
  const aiguillages = enigme('gro-e-aiguillages-de-la-fosse');

  it('refusée avec une explication, sans rien changer ni déclencher de conséquence', () => {
    const p = auLieuDe(aiguillages);
    for (const reponse of [
      'minerai, roche, vide',
      ['wagonnet-de-minerai'],
      ['wagonnet-de-minerai', 'wagonnet-de-roche', 'trottinette'],
      ['wagonnet-vide', 'wagonnet-vide', 'wagonnet-de-roche'],
    ]) {
      const res = moteur.executer(p, ordreDe(p, aiguillages, reponse));
      expect(res.refus, JSON.stringify(reponse)).toMatch(/éléments|élément/);
      expect(res.partie.etat.exploration.enigmes[aiguillages.id]).toBeUndefined();
      expect(res.partie.scene.type).toBe('exploration');
      expect(res.partie.etat.rencontresEnAttente ?? []).toEqual([]);
    }
  });

  it('les autres types : leviers, cadran, placement', () => {
    const e = (id: string) => enigme(id);
    expect(controlerReponse(e('cry-e-les-leviers'), ['haut', 'bas', 'haut', 'bas'])).toMatch(/leviers/);
    expect(controlerReponse(e('vei-e-cadran-de-la-lanterne'), '7 4 3')).toMatch(/cadran/);
    expect(controlerReponse(e('vei-e-cadran-de-la-lanterne'), [7, 4])).toMatch(/cadran/);
    expect(controlerReponse(e('vei-e-mecanisme-de-fennick'), ['a', 'b', 'c'])).toMatch(/emplacements/);
    expect(controlerReponse(e('vei-e-mecanisme-de-fennick'), { 'arbre-moteur': 'x', 'arbre-relais': 'y', 'arbre-sortie': 'z' })).toMatch(/proposés/);
    expect(controlerReponse(e('cry-e-le-mot-d-ordre'), ['a'])).toMatch(/écrite/);
  });

  it('les majuscules, accents et tirets des éléments sont acceptés', () => {
    const p = auLieuDe(aiguillages);
    const res = moteur.executer(p, ordreDe(p, aiguillages, ['Wagonnet de Minerai', 'WAGONNET-DE-ROCHE', 'wagonnet vide']));
    expect(res.partie.etat.exploration.enigmes[aiguillages.id]).toBe('resolue');
  });
});

describe('énigmes : un échec déclenche la rencontre annoncée', () => {
  const avecRencontre = enigmes.filter((e) => e.echec?.effets.some((x) => 'rencontre' in x));

  it('quatre énigmes du Val annoncent une rencontre', () => {
    expect(avecRencontre.map((e) => e.id).sort()).toHaveLength(4);
  });

  it.each(avecRencontre.map((e) => [e.id, e] as const))('« %s » : une mauvaise réponse lance le combat', (_id, e) => {
    const rencontre = (e.echec!.effets.find((x) => 'rencontre' in x) as { rencontre: string }).rencontre;
    const p = auLieuDe(e);
    const res = moteur.executer(p, ordreDe(p, e, mauvaiseReponse(e)));
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.exploration.enigmes[e.id]).toBe('echouee');
    expect(res.partie.scene).toEqual({ type: 'rencontre', rencontre });
    expect(res.evenements.some((ev) => ev.type === 'sceneChange')).toBe(true);
  });

  it('une rencontre unique déjà jouée ne se relance pas ; une rencontre qui se répète, si', () => {
    const dortoir = enigme('gro-e-aiguillages-de-la-fosse');
    let p = auLieuDe(dortoir);
    p = moteur.executer(p, ordreDe(p, dortoir, mauvaiseReponse(dortoir))).partie;
    p = moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire' }).partie;
    expect(p.scene.type).toBe('exploration');
    expect(moteur.executer(p, ordreDe(p, dortoir, mauvaiseReponse(dortoir))).partie.scene.type).toBe('exploration');

    const signal = enigme('pdf-enigme-lanternes-des-sentinelles');
    let q = auLieuDe(signal);
    for (let i = 0; i < 2; i++) {
      q = moteur.executer(q, ordreDe(q, signal, mauvaiseReponse(signal))).partie;
      expect(q.scene, `essai ${i + 1}`).toEqual({ type: 'rencontre', rencontre: 'pdf-patrouille-du-fer-gris' });
      q = moteur.executer(q, { type: 'reglerRencontre', issue: 'victoire' }).partie;
    }
  });
});

describe("audit des énigmes d'un monde", () => {
  it('aucune énigme du Val ne comporte d’erreur : toutes se jouent, échouent et se récompensent comme annoncé', () => {
    const rapports = auditerEnigmes(dm, srd);
    expect(rapports).toHaveLength(enigmes.length);
    const erreurs = rapports.flatMap((rap) =>
      rap.verifications.filter((x) => !x.ok && x.gravite === 'erreur').map((x) => `${rap.nom} (${x.id}) : ${x.detail}`),
    );
    expect(erreurs).toEqual([]);
  });

  it('l’audit repère une énigme cassée : une valeur de cadran hors de sa plage, un échec qui ne lance rien', () => {
    const cadran = enigme('vei-e-cadran-de-la-lanterne');
    const casse = {
      ...dm,
      enigmes: new Map(dm.enigmes).set(cadran.id, { ...cadran, solution: { ...cadran.solution, plage: [1, 5] } } as Enigme),
    };
    const rapport = auditerEnigmes(casse, srd).find((x) => x.id === cadran.id)!;
    expect(rapport.verifications.find((x) => x.id === 'jouable')).toMatchObject({ ok: false, gravite: 'erreur', detail: expect.stringMatching(/plage/) });
    expect(bilanAudit([rapport]).erreurs).toBeGreaterThan(0);
  });

  it('l’audit signale en avis une énigme sans échec, une récompense jamais lue et un énoncé qui donne l’ordre', () => {
    // Le Val a corrigé ces défauts : on les fabrique ici, sur des copies des énigmes.
    const socle = enigme('hf-enigme-onzieme-socle');
    const { echec: _echec, ...sansEchec } = socle;
    const aiguillages = enigme('gro-e-aiguillages-de-la-fosse');
    const cadran = enigme('vei-e-cadran-de-la-lanterne');
    const casse = {
      ...dm,
      enigmes: new Map(dm.enigmes)
        .set(socle.id, sansEchec as Enigme)
        .set(aiguillages.id, { ...aiguillages, enonce: 'Trois wagonnets : minerai, roche, vide. Poussez-les dans le bon ordre.' } as Enigme)
        .set(cadran.id, { ...cadran, recompense: { ...cadran.recompense, effets: [{ flag: 'drapeau-que-personne-ne-lit' }] } } as Enigme),
    };
    const avis = auditerEnigmes(casse, srd).flatMap((rap) => rap.verifications.filter((x) => !x.ok).map((x) => `${rap.id}:${x.id}`));
    expect(avis).toContain('hf-enigme-onzieme-socle:echec-defini');
    expect(avis).toContain('gro-e-aiguillages-de-la-fosse:enonce-ordre');
    expect(avis).toContain('vei-e-cadran-de-la-lanterne:recompense-lue');
  });

  it('les énigmes du Val n’ont plus d’avis (échec défini, énoncé sans l’ordre, récompense lue)', () => {
    const avis = auditerEnigmes(dm, srd).flatMap((rap) => rap.verifications.filter((x) => !x.ok).map((x) => `${rap.id}:${x.id}`));
    expect(avis).toEqual([]);
  });
});
