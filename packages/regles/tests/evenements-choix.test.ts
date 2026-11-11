import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Encart, type FicheEvenement, type Partie } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { COMMANDES_HORS_CONTEUR } from '../src/conteur/outils';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));

const LIEU = 'vei-maison-des-gardiens';
const EVENEMENT = {
  id: 'la-mare-bleue',
  titre: 'La mare bleue',
  lieu: LIEU,
  quand: { flag: 'mare-vue' },
  narration: 'Au fond de la caverne, une petite mare étrange, un liquide bleu opaque qui ne frémit pas.',
  variantes: [{ condition: { fait: 'f-tribut-du-bailli' }, narration: 'Vous savez déjà ce que cache le bailli : la mare vous paraît moins étrange.' }],
  choix: [
    { id: 'boire', libelle: 'Buvez à la mare.', effets: [{ pieces: 5 }], resultat: 'Le liquide est tiède et sans goût.' },
    { id: 'goutter', libelle: '« Laissez-moi goûter la pierre. »', condition: { heros: { espece: 'nain' } }, effets: [{ pieces: 10 }], resultat: 'La pierre est salée.' },
    { id: 'analyser', libelle: '« Je cherche des traces magiques. »', condition: { heros: { classe: 'magicien' } }, origine: 'Sorcier', jet: { competence: 'arcanes', dd: 30 }, effets: [{ pieces: 20 }], echec: [{ flag: 'analyse-ratee' }], resultat: 'Une trace nette.', resultatEchec: 'Rien, sinon un vertige.' },
    { id: 'cher', libelle: 'Plonger la main.', requis: { pieces: { min: 100000 } }, requisTexte: 'Trop cher.', effets: [{ flag: 'x' }], resultat: 'Jamais joué.' },
  ],
};

const dm = { ...r.monde, extensions: { ...(r.monde.extensions ?? {}), 'evenements-choix': [EVENEMENT] } };
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

/** Le groupe de départ, avec des origines connues : héros 0 = nain guerrier, héros 1 = humain magicien (le reste : humains guerriers). */
function depart(origines: { espece: string; classe: string }[] = [{ espece: 'nain', classe: 'guerrier' }, { espece: 'humain', classe: 'magicien' }]): Partie {
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine: 11, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
  p.etat.heros = p.groupe.map((_, i) => ({ historique: 'sage', ...(origines[i] ?? { espece: 'humain', classe: 'guerrier' }) }));
  return p;
}
const ici = (p: Partie): Partie => moteur.executer(p, { type: 'aller', vers: LIEU }).partie;
const fiche = (p: Partie) => moteur.vue<FicheEvenement | undefined>('evenementEnCours', p);
/** Un groupe sur place, la condition `quand` posée : l'événement s'ouvre. */
function ouvert(origines?: { espece: string; classe: string }[]): Partie {
  const p = ici(depart(origines));
  p.etat.flags['mare-vue'] = true;
  return moteur.executer(p, { type: 'ouvrirEvenement', evenement: EVENEMENT.id }).partie;
}

describe('module Événements à choix', () => {
  it("n'est pas disponible tant que sa condition est fausse, puis le devient", () => {
    const p = ici(depart());
    expect(fiche(p)).toBeUndefined();
    expect(moteur.executer(p, { type: 'ouvrirEvenement', evenement: EVENEMENT.id }).refus).toMatch(/rien de tel/);
    p.etat.flags['mare-vue'] = true;
    const res = moteur.executer(p, { type: 'ouvrirEvenement', evenement: EVENEMENT.id });
    expect(res.refus).toBeUndefined();
    expect(res.evenements).toContainEqual({ type: 'evenementOuvert', evenement: 'la-mare-bleue' });
    expect(fiche(res.partie)?.titre).toBe('La mare bleue');
  });

  it("s'ouvre à l'arrivée quand la condition est déjà vraie", () => {
    const p = depart();
    p.etat.flags['mare-vue'] = true;
    const res = moteur.executer(p, { type: 'aller', vers: LIEU });
    expect(res.evenements).toContainEqual({ type: 'evenementOuvert', evenement: 'la-mare-bleue' });
    expect(fiche(res.partie)?.narration).toMatch(/mare étrange/);
  });

  it('propose les choix généraux et les choix réservés, préfixés de leur origine, seulement si un héros correspond', () => {
    const f = fiche(ouvert())!;
    expect(f.choix.map((c) => c.id)).toEqual(['boire', 'goutter', 'analyser', 'cher']);
    expect(f.choix.find((c) => c.id === 'goutter')!.origine).toBe('Nain');
    // Le champ `origine` remplace le nom tiré du SRD.
    expect(f.choix.find((c) => c.id === 'analyser')!.origine).toBe('Sorcier');
    expect(f.choix.find((c) => c.id === 'boire')!.origine).toBeUndefined();
    expect(f.choix.find((c) => c.id === 'analyser')!.jet).toEqual({ competence: 'arcanes', dd: 30 });
    expect(f.choix.find((c) => c.id === 'cher')!.desactivee).toBe('Trop cher.');
    // Sans nain ni magicien : seuls les choix généraux restent.
    const sans = fiche(ouvert([{ espece: 'humain', classe: 'guerrier' }, { espece: 'elfe', classe: 'clerc' }]))!;
    expect(sans.choix.map((c) => c.id)).toEqual(['boire', 'cher']);
    // Un héros qui ne peut plus agir (0 PV) ne compte pas.
    const p = ouvert();
    p.groupe[0]!.pv = 0;
    expect(fiche(p)!.choix.map((c) => c.id)).toEqual(['boire', 'analyser', 'cher']);
  });

  it('choisir applique les effets, pose les drapeaux, montre le résultat et se consigne au journal', () => {
    const p = ouvert();
    const po = p.etat.pieces;
    const res = moteur.executer(p, { type: 'choisirEvenement', evenement: EVENEMENT.id, choix: 'goutter' });
    expect(res.refus).toBeUndefined();
    const f = fiche(res.partie)!;
    expect(f.choix).toEqual([]);
    expect(f.resultat?.texte).toBe('La pierre est salée.');
    expect(f.resultat?.libelle).toMatch(/^\(Nain\) « Laissez-moi/);
    expect(f.resultat?.heros).toBe(res.partie.groupe[0]!.nom);
    expect(res.partie.etat.pieces).toBe(po + 10);
    expect(res.partie.etat.flags['evt-la-mare-bleue']).toBe(true);
    expect(res.partie.etat.flags['evt-la-mare-bleue-goutter']).toBe(true);
    expect(res.partie.etat.flags['evt-la-mare-bleue-boire']).toBeUndefined();
    expect(res.evenements).toContainEqual({ type: 'texte', texte: 'La pierre est salée.' });
    // Un seul choix par événement, et pas de choix d'un autre héros.
    expect(moteur.executer(res.partie, { type: 'choisirEvenement', evenement: EVENEMENT.id, choix: 'boire' }).refus).toMatch(/déjà fait/);
    const vecus = moteur.encarts(res.partie).find((e) => e.id === 'evenements-vecus') as Encart;
    expect(vecus.lignes![0]!.detail).toMatch(/Nain/);
  });

  it("refuse un choix réservé quand aucun héros ne correspond, un choix inconnu ou un choix dont il manque le requis", () => {
    const p = ouvert([{ espece: 'humain', classe: 'guerrier' }]);
    expect(moteur.executer(p, { type: 'choisirEvenement', evenement: EVENEMENT.id, choix: 'goutter' }).refus).toMatch(/pas ouvert/);
    expect(moteur.executer(p, { type: 'choisirEvenement', evenement: EVENEMENT.id, choix: 'fuir' }).refus).toMatch(/pas ouvert/);
    expect(moteur.executer(p, { type: 'choisirEvenement', evenement: EVENEMENT.id, choix: 'cher' }).refus).toMatch(/Trop cher/);
  });

  it("un jet raté n'arrête pas l'histoire : l'échec a son texte et ses effets, et c'est le héros concerné qui tente", () => {
    const res = moteur.executer(ouvert(), { type: 'choisirEvenement', evenement: EVENEMENT.id, choix: 'analyser' });
    expect(res.refus).toBeUndefined();
    const jet = res.evenements.find((e) => e.type === 'jet');
    expect(jet).toBeDefined();
    // Arcanes DD 30 : l'échec est quasi certain.
    const f = fiche(res.partie)!;
    expect(f.resultat?.reussite).toBe(false);
    expect(f.resultat?.texte).toBe('Rien, sinon un vertige.');
    expect(res.partie.etat.flags['analyse-ratee']).toBe(true);
    expect(f.resultat?.jets[0]?.qui).toBe(res.partie.groupe[1]!.id);
  });

  it('partir sans choisir ne perd rien : un bouton ramène à l\'événement ; partir après le choix le clôt pour de bon', () => {
    let p = ouvert();
    p = moteur.executer(p, { type: 'quitterEvenement', evenement: EVENEMENT.id }).partie;
    expect(fiche(p)).toBeUndefined();
    const revenir = moteur.propositions(p).find((x) => x.ordre?.type === 'ouvrirEvenement');
    expect(revenir?.libelle).toBe('Revenir à ce moment');
    p = moteur.executer(p, revenir!.ordre!).partie;
    expect(fiche(p)).toBeDefined();
    p = moteur.executer(p, { type: 'choisirEvenement', evenement: EVENEMENT.id, choix: 'boire' }).partie;
    p = moteur.executer(p, { type: 'quitterEvenement', evenement: EVENEMENT.id }).partie;
    expect(fiche(p)).toBeUndefined();
    expect(moteur.propositions(p).some((x) => x.ordre?.type === 'ouvrirEvenement')).toBe(false);
    expect(moteur.executer(p, { type: 'ouvrirEvenement', evenement: EVENEMENT.id }).refus).toBeDefined();
  });

  it("la narration suit les variantes (ce que le groupe sait déjà)", () => {
    const p = ouvert();
    expect(fiche(p)!.narration).toMatch(/mare étrange/);
    p.etat.faits.push('f-tribut-du-bailli');
    expect(fiche(p)!.narration).toMatch(/moins étrange/);
  });

  it('un événement « bouton » reste un bouton du panneau Ici, jamais ouvert de lui-même', () => {
    const dmB = { ...r.monde, extensions: { ...(r.monde.extensions ?? {}), 'evenements-choix': [{ ...EVENEMENT, quand: undefined, ouverture: 'bouton' }] } };
    const m = creerMoteur({ dm: dmB, srd }, MODULES_STANDARD);
    const g = groupeConseille(3, srd).emplacements.map((p) => personnageDepuisFiche(bilanPersonnage(p!, srd).fiche!, { id: 'h' }));
    let p = m.executer(m.nouvellePartie(g, { graine: 3, niveau: 3 }), { type: 'commencer' }).partie;
    p = m.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
    p = m.executer(p, { type: 'aller', vers: LIEU }).partie;
    expect(m.vue('evenementEnCours', p)).toBeUndefined();
    const b = m.propositions(p).find((x) => x.ordre?.type === 'ouvrirEvenement');
    expect(b?.libelle).toBe('Regarder de plus près');
  });

  it("un ancien état de partie sans le module n'empêche rien, et le conteur ne tranche jamais", () => {
    const p = ici(depart());
    delete p.modules['evenementsChoix'];
    expect(fiche(p)).toBeUndefined();
    expect(moteur.propositions(p).some((x) => x.ordre?.type === 'ouvrirEvenement')).toBe(false);
    for (const c of ['ouvrirEvenement', 'choisirEvenement', 'quitterEvenement']) expect(COMMANDES_HORS_CONTEUR.has(c)).toBe(true);
  });

  it('la validation et les conseils repèrent un événement mal écrit', () => {
    const module = MODULES_STANDARD.find((m) => m.id === 'evenementsChoix')!;
    expect(module.valider!({ dm, srd })).toEqual([]);
    const faux = (e: object) => ({ ...r.monde, extensions: { 'evenements-choix': [e] } });
    expect(module.valider!({ dm: faux({ ...EVENEMENT, lieu: 'nulle-part' }), srd }).join('\n')).toMatch(/lieu inconnu/);
    expect(module.valider!({ dm: faux({ ...EVENEMENT, choix: [{ ...EVENEMENT.choix[2]!, echec: undefined }, EVENEMENT.choix[0]!] }), srd }).join('\n')).toMatch(/échec/);
    expect(module.valider!({ dm: faux({ ...EVENEMENT, choix: [EVENEMENT.choix[1]!, EVENEMENT.choix[2]!] }), srd }).join('\n')).toMatch(/au moins un choix général/);
    expect(module.valider!({ dm: faux({ ...EVENEMENT, image: { groupe: 'lieux', id: 'inconnu' } }), srd }).join('\n')).toMatch(/image inconnue/);
    expect(module.conseils!({ dm, srd }).join('\n')).toMatch(/narration de \d+ mots/);
  });
});

describe('exemple livré : « La source grise » (Val des Cendres)', () => {
  const reel = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);
  const SOURCE = 'gro-loups-source';
  function aLaSource(alternative: string | undefined, origines: { espece: string; classe: string }[]): Partie {
    const g = groupeConseille(3, srd).emplacements.map((p) => {
      const f = bilanPersonnage(p!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    let p = reel.executer(reel.nouvellePartie(g, { graine: 5, niveau: 2 }), { type: 'commencer' }).partie;
    p = reel.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
    p.etat.heros = p.groupe.map((_, i) => ({ historique: 'sage', ...(origines[i] ?? { espece: 'humain', classe: 'guerrier' }) }));
    p.etat.lieu = SOURCE;
    if (alternative) p.etat.exploration.issues = { 'gro-r-loups-salle-de-la-meute': { type: 'alternative', alternative, jour: 1, lieu: 'gro-loups-salle-de-la-meute' } };
    return p;
  }
  const evt = (p: Partie) => reel.vue<FicheEvenement | undefined>('evenementEnCours', p);

  it("n'est disponible qu'une fois la meute apaisée ou la cause pistée, pas après un combat", () => {
    expect(reel.executer(aLaSource(undefined, []), { type: 'ouvrirEvenement', evenement: 'la-source-grise' }).refus).toBeDefined();
    const combat = aLaSource(undefined, []);
    combat.etat.exploration.issues = { 'gro-r-loups-salle-de-la-meute': { type: 'victoire', jour: 1, lieu: 'gro-loups-salle-de-la-meute' } };
    expect(reel.executer(combat, { type: 'ouvrirEvenement', evenement: 'la-source-grise' }).refus).toBeDefined();
    for (const alt of ['apaiser', 'pister-la-cause']) {
      const res = reel.executer(aLaSource(alt, []), { type: 'ouvrirEvenement', evenement: 'la-source-grise' });
      expect(res.refus).toBeUndefined();
      expect(evt(res.partie)?.choix.map((c) => c.id)).toEqual(['boire']);
    }
  });

  it('offre les choix du nain, du magicien et du druide selon le groupe, et applique les effets', () => {
    const p = reel.executer(aLaSource('apaiser', [{ espece: 'nain', classe: 'druide' }, { espece: 'humain', classe: 'magicien' }]), { type: 'ouvrirEvenement', evenement: 'la-source-grise' }).partie;
    const f = evt(p)!;
    expect(f.choix.map((c) => [c.id, c.origine])).toEqual([['boire', undefined], ['nain', 'Nain'], ['magicien', 'Magicien'], ['druide', 'Druide']]);
    const xp = p.etat.xp;
    const res = reel.executer(p, { type: 'choisirEvenement', evenement: 'la-source-grise', choix: 'nain' });
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.flags['source-grise-cendre-de-forge']).toBe(true);
    expect(res.partie.etat.xp).toBeGreaterThan(xp);
    expect(evt(res.partie)?.resultat?.texte).toMatch(/cendre de forge/);
  });
});
