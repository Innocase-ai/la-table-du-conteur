// F5 (PRD-SAGA), pas (c) — les échos de campagne : `campagne.emet` dans monde.json, leur émission à la fin d'un épisode (bilan), leur lecture par
// les épisodes suivants, le registre et le contrôle entre épisodes. Additif (P1, P2) : un monde sans `campagne` ne change pas.
import { describe, expect, it } from 'vitest';
import { bilanDeFin, creerMoteur, entrerDansEpisode, groupeDeTest, Monde, MODULES_STANDARD, validerMonde, type DonneesMonde, type Moteur } from '../src';
import { avisCampagneDeLEpisode, echosDeFin, echosEmis, echosLus, registreDeCampagne, validerCampagne } from '../src/monde/campagne';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde } from '../src/monde/chargeur';
import { etatInitial } from '../src/monde/etat';
import { sujetsDisponibles } from '../src/monde/dialogue';
import { nouvellePartie } from '../src/monde/exploration';
import { dossierMonde } from './mondes-essai';

const srd = chargerDonneesSrd();
const charger = (id: string): DonneesMonde => {
  const r = chargerMonde(dossierMonde(id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
};
const moteurDe = (dm: DonneesMonde): Moteur => creerMoteur({ dm, srd }, MODULES_STANDARD);
const emet = (dm: DonneesMonde, ...echos: { id: string; quand?: object; phrase?: string }[]): void => {
  dm.monde.campagne = { emet: echos.map((e) => ({ id: e.id, quand: (e.quand ?? { flag: 'f' }) as never, phrase: e.phrase ?? `Phrase de ${e.id}.` })) };
};
/** Un sujet de PNJ que seul l'écho `id` ouvre. */
function sujetCommande(dm: DonneesMonde, id: string, sauf?: string) {
  const pnj = [...dm.pnj.values()].find((p) => p.id !== sauf && p.sujets.length > 1 && !p.sujets[0]!.condition && !p.sujets[0]!.attitudeMin)!;
  pnj.sujets[0]!.condition = { campagne: id };
  return { pnj, sujet: pnj.sujets[0]!.id };
}

describe('le schéma `campagne.emet`', () => {
  const brut = () => JSON.parse(JSON.stringify(charger('val-des-cendres').monde)) as Record<string, unknown>;

  it('est facultatif : sans lui, le monde est celui d’avant', () => {
    expect(Monde.parse(brut()).campagne).toBeUndefined();
  });

  it('accepte des échos (id, condition, phrase) et refuse un identifiant, une phrase ou une condition invalide', () => {
    const b = brut();
    b['campagne'] = { emet: [{ id: 'epi1-sauve', quand: { flag: 'x' }, phrase: 'Le village vous doit tout.' }] };
    expect(Monde.parse(b).campagne?.emet[0]!.id).toBe('epi1-sauve');
    b['campagne'] = { emet: [{ id: 'Épi 1', quand: { flag: 'x' }, phrase: 'p' }] };
    expect(Monde.safeParse(b).success).toBe(false);
    b['campagne'] = { emet: [{ id: 'a', quand: { flag: 'x' }, phrase: '' }] };
    expect(Monde.safeParse(b).success).toBe(false);
    b['campagne'] = { emet: [{ id: 'a', phrase: 'p' }] };
    expect(Monde.safeParse(b).success).toBe(false);
  });
});

describe('émission et lecture', () => {
  it('echosDeFin : seuls les échos dont la condition est vraie dans l’état', () => {
    const dm = charger('val-des-cendres');
    emet(dm, { id: 'a', quand: { flag: 'f1' } }, { id: 'b', quand: { flag: 'f2' } }, { id: 'c', quand: { non: { flag: 'f2' } } });
    const e = etatInitial(dm, 3);
    e.flags['f1'] = true;
    expect(echosDeFin(dm, e)).toEqual(['a', 'c']);
    expect(echosEmis(dm).map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('echosLus : trouve les conditions `campagne` dans les quêtes, les PNJ, monde.json et les données des modules', () => {
    const dm = charger('val-des-cendres');
    expect(echosLus(dm)).toEqual([]);
    sujetCommande(dm, 'lu-pnj');
    const q = [...dm.quetes.values()][0]!;
    q.prerequis = { et: [{ campagne: 'lu-quete' }, { flag: 'x' }] };
    emet(dm, { id: 'lu-emet', quand: { campagne: 'lu-monde' } });
    dm.extensions = { ...(dm.extensions ?? {}), dilemmes: [{ id: 'dil', condition: { ou: [{ campagne: 'lu-extension' }] } }] };
    const ids = echosLus(dm).map((l) => l.id).sort();
    expect(ids).toEqual(['lu-extension', 'lu-monde', 'lu-pnj', 'lu-quete']);
    expect(echosLus(dm).find((l) => l.id === 'lu-quete')!.ou).toBe(`quetes:${q.id}`);
  });

  it('le bilan de fin reçoit les échos émis sans qu’on les liste', () => {
    const dm = charger('val-des-cendres');
    emet(dm, { id: 'epi0-sauve', quand: { flag: 'village-sauve' } }, { id: 'epi0-rate', quand: { non: { flag: 'village-sauve' } } });
    const moteur = moteurDe(dm);
    const p = moteur.executer(moteur.nouvellePartie(groupeDeTest(srd, 3), { graine: 2, niveau: 3, campagne: ['ancien'] }), { type: 'commencer' }).partie;
    p.etat.flags['village-sauve'] = true;
    expect(bilanDeFin(p, { dm, srd }).campagne).toEqual(['ancien', 'epi0-sauve']);
    p.etat.flags['village-sauve'] = false;
    expect(bilanDeFin(p, { dm, srd }, { echos: ['a-la-main'] }).campagne).toEqual(['ancien', 'epi0-rate', 'a-la-main']);
  });

  it('un monde sans `campagne` ajoute au carnet exactement ce qu’il ajoutait avant (rien)', () => {
    const dm = charger('val-des-cendres');
    const moteur = moteurDe(dm);
    const p = moteur.executer(moteur.nouvellePartie(groupeDeTest(srd, 3), { graine: 2, niveau: 3 }), { type: 'commencer' }).partie;
    expect(bilanDeFin(p, { dm, srd }).campagne).toEqual([]);
  });

  it('de bout en bout : l’épisode A émet, l’épisode B lit l’écho attendu et lui seul', () => {
    const a = charger('val-des-cendres');
    emet(a, { id: 'epi1-allie', quand: { flag: 'allie' } }, { id: 'epi1-ennemi', quand: { flag: 'ennemi' } });
    const ma = moteurDe(a);
    const pa = ma.executer(ma.nouvellePartie(groupeDeTest(srd, 3), { graine: 4, niveau: 3 }), { type: 'commencer' }).partie;
    pa.etat.flags['allie'] = true;
    const bilan = bilanDeFin(pa, { dm: a, srd });
    expect(bilan.campagne).toEqual(['epi1-allie']);

    const b = charger('port-sillage');
    const { pnj, sujet } = sujetCommande(b, 'epi1-allie');
    const { pnj: autre, sujet: sujetAutre } = sujetCommande(b, 'epi1-ennemi', pnj.id);
    const { partie } = entrerDansEpisode(moteurDe(b), bilan, { graine: 9 });
    const vue = nouvellePartie(b, partie.etat, partie.groupe, () => 0.5);
    expect(sujetsDisponibles(vue, pnj).map((s) => s.id)).toContain(sujet);
    expect(sujetsDisponibles(vue, autre).map((s) => s.id)).not.toContain(sujetAutre);
  });
});

describe('le contrôle entre épisodes', () => {
  it('une chaîne cohérente (A émet, B lit) n’a ni erreur ni avis', () => {
    const a = charger('val-des-cendres');
    const b = charger('port-sillage');
    emet(a, { id: 'epi1-sauve' });
    sujetCommande(b, 'epi1-sauve');
    expect(validerCampagne([a, b])).toEqual({ erreurs: [], avis: [] });
    const reg = registreDeCampagne([a, b]);
    expect(reg.emis.map((e) => `${e.monde}:${e.id}`)).toEqual(['val-des-cendres:epi1-sauve']);
    expect(reg.lus.map((l) => `${l.monde}:${l.id}`)).toEqual(['port-sillage:epi1-sauve']);
  });

  it('un écho lu que personne n’émet est une ERREUR (faute de frappe)', () => {
    const a = charger('val-des-cendres');
    const b = charger('port-sillage');
    emet(a, { id: 'epi1-sauve' });
    sujetCommande(b, 'epi1-sauvee');
    const { erreurs } = validerCampagne([a, b]);
    expect(erreurs.join('\n')).toMatch(/« port-sillage ».*« epi1-sauvee » n'est émis par aucun épisode/);
  });

  it('un écho émis par deux épisodes est une erreur', () => {
    const a = charger('val-des-cendres');
    const b = charger('port-sillage');
    emet(a, { id: 'commun' });
    emet(b, { id: 'commun' });
    expect(validerCampagne([a, b]).erreurs.join('\n')).toMatch(/« commun » émis 2 fois \(val-des-cendres, port-sillage\)/);
  });

  it('un écho que personne ne lit, ou que seul son émetteur lit, est un avis', () => {
    const a = charger('val-des-cendres');
    const b = charger('port-sillage');
    emet(a, { id: 'orphelin' }, { id: 'sur-place' });
    sujetCommande(a, 'sur-place');
    const { erreurs, avis } = validerCampagne([a, b]);
    expect(erreurs).toEqual([]);
    expect(avis.join('\n')).toMatch(/« orphelin ».*aucun épisode ne le lit/);
    expect(avis.join('\n')).toMatch(/« sur-place ».*n'est émis que par cet épisode/);
  });

  it('sans aucun écho dans les épisodes, le registre est vide et rien n’est signalé', () => {
    expect(validerCampagne([charger('val-des-cendres'), charger('port-sillage')])).toEqual({ erreurs: [], avis: [] });
  });
});

describe('le validateur d’un épisode', () => {
  it('une condition d’écho qui cite un fait inconnu est une erreur ; une valide, non', () => {
    const dm = charger('val-des-cendres');
    emet(dm, { id: 'a', quand: { fait: 'fait-qui-nexiste-pas' } });
    expect(validerMonde(dm, srd).erreurs.join('\n')).toMatch(/Campagne, écho « a »/);
    emet(dm, { id: 'a', quand: { campagne: 'ailleurs' } });
    expect(validerMonde(dm, srd).erreurs.join('\n')).not.toMatch(/Campagne, écho/);
  });

  it('un écho déclaré deux fois est une erreur ; plus de 2 échos dans un épisode, un avis', () => {
    const dm = charger('val-des-cendres');
    emet(dm, { id: 'a' }, { id: 'a' });
    expect(avisCampagneDeLEpisode(dm, srd).erreurs.join('\n')).toMatch(/« a » est déclaré deux fois/);
    emet(dm, { id: 'a' }, { id: 'b' }, { id: 'c' });
    dm.monde.format = 'episode';
    expect(avisCampagneDeLEpisode(dm, srd).avis.join('\n')).toMatch(/3 échos émis/);
    dm.monde.format = undefined;
    expect(avisCampagneDeLEpisode(dm, srd).avis).toEqual([]);
  });

  it('la quête principale qui lit le carnet est signalée (un écho est un bonus)', () => {
    const dm = charger('val-des-cendres');
    const q = [...dm.quetes.values()].find((x) => x.type === 'principale')!;
    q.prerequis = { campagne: 'epi0-sauve' };
    expect(avisCampagneDeLEpisode(dm, srd).avis.join('\n')).toMatch(new RegExp(`quête principale « ${q.id} » lit l'écho « epi0-sauve »`));
  });

  it('un monde sans `campagne` n’a aucun avis de campagne (les trois histoires publiées en sont là)', () => {
    for (const id of ['marche-d-ombrefiel', 'dime-des-roseaux', 'tombe-des-rois-serpents']) {
      const r = chargerMonde(dossierMonde(id));
      if (!r.ok) throw new Error(id);
      expect(avisCampagneDeLEpisode(r.monde, srd)).toEqual({ erreurs: [], avis: [] });
      expect(echosEmis(r.monde)).toEqual([]);
      expect(echosLus(r.monde)).toEqual([]);
    }
  });
});
