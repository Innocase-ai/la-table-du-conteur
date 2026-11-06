// Les cris de combat des compagnons : les fichiers de données (cris communs, voix par race et par genre), le repérage des
// situations sur un vrai journal du moteur, et le choix (priorités, silences, pas de redite, accords).
import { describe, expect, it } from 'vitest';
import {
  calculerFiche,
  combattant,
  creerCombat,
  executer,
  grilleDepuisTexte,
  heroDepuisFiche,
  HEROS_PRE_TIRES,
  infligerDegats,
  monstreDepuisProfil,
  soigner,
  type Combattant,
  type EtatCombat,
  type Evenement,
} from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import portraits from '../../../packages/donnees/visuel/portraits.json';
import { capturer, planifierBulle, SILENCE_ENTRE_BULLES } from './animations';
import { FICHIER_CRIS, FICHIER_VOIX, REPLIQUES } from './repliques';
import { CLES_VOIX } from './voix';
import {
  accorder,
  ATTENTE_MAX,
  choisirReplique,
  convient,
  declencheurs,
  MAX_PAR_ROUND,
  rateVraiment,
  FichierCris,
  FichierVoix,
  nouvelleMemoire,
  SITUATIONS,
  voixDuPortrait,
  type Declencheur,
  type Situation,
} from './repliques-regles';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);

/** Un héros pré-tiré, habillé d'un portrait de la galerie (la voix vient de sa race et de son genre). */
function hero(nom: string, x: number, y: number, portrait: string): Combattant {
  const h = HEROS_PRE_TIRES.find((p) => p.choix.nom === nom)!;
  const r = calculerFiche(h.choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join());
  return { ...heroDepuisFiche(r.fiche, h.kit, donnees, { x, y }), portrait };
}

function combat(combattants: Combattant[], des: number[] = []): EtatCombat {
  const etat = creerCombat(ARENE, combattants.map((c, i) => ({ ...c, bonusInitiative: 100 - 30 * i })), 1, { elan: false });
  etat.desImposes = [...des];
  return etat;
}

const situations = (d: Declencheur[]) => d.map((x) => `${x.situation}:${x.locuteur ?? '-'}`);
/** Un hasard qui dit toujours oui (le tirage passe) et prend le premier choix. */
const toujours = () => 0;

const cris = FichierCris.parse(FICHIER_CRIS);
const voix = FichierVoix.parse(FICHIER_VOIX);
const R = REPLIQUES!;

describe('les fichiers de cris et de voix', () => {
  it('les deux fichiers sont valides et le jeu les charge', () => {
    expect(FichierCris.safeParse(FICHIER_CRIS).success).toBe(true);
    expect(FichierVoix.safeParse(FICHIER_VOIX).success).toBe(true);
    expect(REPLIQUES).toBeDefined();
  });

  it('de 10 à 15 cris en tout, courts (6 mots au plus), sans doublon dans une situation', () => {
    const tous = SITUATIONS.flatMap((s) => cris.situations[s]);
    expect(tous.length).toBeGreaterThanOrEqual(10);
    expect(tous.length).toBeLessThanOrEqual(15);
    for (const s of SITUATIONS) {
      expect(new Set(cris.situations[s]).size, s).toBe(cris.situations[s].length);
      for (const c of cris.situations[s]) expect(c.split(/\s+/).length, `${s} : ${c}`).toBeLessThanOrEqual(6);
    }
  });

  it('les cris n’ont que des accords {masculin|féminin} : rien d’autre à remplir, tout peut être enregistré d’avance', () => {
    for (const s of SITUATIONS)
      for (const c of cris.situations[s]) {
        expect(c.replace(/\{[^{}|]*\|[^{}|]*\}/g, ''), `${s} : ${c}`).not.toMatch(/[{}|]/);
        for (const feminin of [false, true]) expect(accorder(c, feminin)).not.toMatch(/[{}|]/);
      }
  });

  it('chaque race de la galerie a une voix masculine et une voix féminine, toutes différentes', () => {
    const attendues = new Set(portraits.map((p) => `${p.espece}-${p.sexe.toLowerCase()}`));
    expect(Object.keys(voix).sort()).toEqual([...attendues].sort());
    const timbres = Object.values(voix).map((v) => v.timbre);
    expect(new Set(timbres).size, 'deux voix avec le même timbre').toBe(timbres.length);
  });

  it('tous les portraits de la galerie ont une voix', () => {
    for (const p of portraits) expect(voixDuPortrait(p.id) ?? '', p.id in voix ? '' : p.id).toSatisfy((v: string) => v in voix);
  });

  it('chaque fichier de voix livré correspond à une voix et à un cri qui existent', () => {
    for (const cle of CLES_VOIX) {
      const [v, reste] = cle.split('/');
      const m = /^(.+)-(\d+)$/.exec(reste ?? '');
      expect(voix[v ?? ''], `voix inconnue : ${cle}`).toBeDefined();
      expect(cris.situations[m?.[1] as Situation]?.[Number(m?.[2]) - 1], `cri inconnu : ${cle}`).toBeDefined();
    }
  });
});

describe('accorder et voixDuPortrait', () => {
  it('accorde au genre de la voix', () => {
    expect(accorder('Je suis grièvement {blessé|blessée} !', false)).toBe('Je suis grièvement blessé !');
    expect(accorder('Je suis grièvement {blessé|blessée} !', true)).toBe('Je suis grièvement blessée !');
    expect(accorder('Victoire !', true)).toBe('Victoire !');
  });

  it('la voix d’un portrait est celle de sa race et de son genre', () => {
    expect(voixDuPortrait('elfe-f-2')).toBe('elfe-f');
    expect(voixDuPortrait('nain-m-1')).toBe('nain-m');
    expect(voixDuPortrait('inconnu')).toBeUndefined();
    expect(voixDuPortrait(undefined)).toBeUndefined();
  });
});

describe('repérage sur un vrai journal du moteur', () => {
  it('un critique qui abat un gobelin : critique donné, puis ennemi abattu', () => {
    const etat = combat([hero('Bran', 1, 1, 'humain-f-1'), monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, 'gob', { x: 2, y: 1 })], [20, 8, 8, 8, 8]);
    const avant = capturer(etat);
    executer(etat, ctx, { type: 'jouer', carte: 'attaque:epee-longue', cibles: ['gob'] });
    expect(combattant(etat, 'gob').mort).toBe(true);
    expect(situations(declencheurs(etat, avant))).toEqual(['critique-donne:bran', 'ennemi-abattu:bran']);
  });

  it('un héros qui tombe : les autres le voient tomber ; relevé par un soin, il le dit', () => {
    const etat = combat([hero('Bran', 1, 1, 'humain-f-1'), hero('Hilda', 2, 1, 'nain-m-2')]);
    const bran = combattant(etat, 'bran');
    let avant = capturer(etat);
    infligerDegats(etat, bran, [{ montant: bran.pv + 1, type: 'contondant' }], undefined);
    const tombe = declencheurs(etat, avant);
    expect(tombe.map((d) => d.situation)).toEqual(['allie-tombe']);
    expect(tombe[0]!.cible).toBe('bran');

    avant = capturer(etat);
    soigner(etat, bran, 8, combattant(etat, 'hilda'));
    // Relevé, et pas « soigné » en plus pour le même soin.
    expect(situations(declencheurs(etat, avant))).toEqual(['releve:bran']);
  });

  it('les seuils de blessure : franchis par la commande, le plus grave l’emporte', () => {
    const etat = combat([hero('Bran', 1, 1, 'humain-f-1')]);
    const bran = combattant(etat, 'bran');
    const max = bran.pvMax;
    let avant = capturer(etat);
    infligerDegats(etat, bran, [{ montant: Math.ceil(max * 0.55), type: 'tranchant' }], undefined);
    expect(situations(declencheurs(etat, avant))).toEqual(['blesse:bran']);
    // Encore blessé, sans franchir de nouveau seuil : rien.
    avant = capturer(etat);
    infligerDegats(etat, bran, [{ montant: 1, type: 'tranchant' }], undefined);
    expect(bran.pv / max).toBeGreaterThan(0.25);
    expect(declencheurs(etat, avant)).toEqual([]);
    // Sous le quart : gravement blessé.
    avant = capturer(etat);
    infligerDegats(etat, bran, [{ montant: bran.pv - 1, type: 'tranchant' }], undefined);
    expect(situations(declencheurs(etat, avant))).toEqual(['grievement-blesse:bran']);
  });

  it('un coup raté, puis encore raté au round suivant', () => {
    // 2 et 3 au dé : l'épée longue de Bran (+5) ne passe pas la CA du gobelin.
    const etat = combat([hero('Bran', 1, 1, 'humain-f-1'), monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, 'gob', { x: 2, y: 1 })], [2, 3]);
    let avant = capturer(etat);
    executer(etat, ctx, { type: 'jouer', carte: 'attaque:epee-longue', cibles: ['gob'] });
    expect(situations(declencheurs(etat, avant))).toEqual(['rate:bran']);
    executer(etat, ctx, { type: 'finTour' });
    executer(etat, ctx, { type: 'finTour' });
    expect(etat.round).toBe(2);
    avant = capturer(etat);
    executer(etat, ctx, { type: 'jouer', carte: 'attaque:epee-longue', cibles: ['gob'] });
    expect(situations(declencheurs(etat, avant))).toEqual(['rate-encore:bran']);
  });

  it('un soin ordinaire d’un allié : soigné', () => {
    const etat = combat([hero('Bran', 1, 1, 'humain-f-1'), hero('Hilda', 2, 1, 'nain-m-2')]);
    const bran = combattant(etat, 'bran');
    bran.pv = bran.pvMax - 5;
    const avant = capturer(etat);
    soigner(etat, bran, 4, combattant(etat, 'hilda'));
    expect(situations(declencheurs(etat, avant))).toEqual(['soigne:bran']);
  });
});

describe('choisirReplique', () => {
  // Deux héros au plus mal (1 PV) : « gravement blessé » doit leur convenir.
  const deux = () => {
    const etat = combat([hero('Bran', 1, 1, 'humain-m-1'), hero('Hilda', 2, 1, 'nain-f-2')]);
    for (const c of etat.combattants) c.pv = 1;
    return etat;
  };
  const d = (situation: Situation, locuteur?: string, cible?: string): Declencheur => ({ situation, locuteur, cible, apres: 3 });

  it('la plus importante passe d’abord, et une seule réplique par commande', () => {
    const r = choisirReplique([d('ennemi-abattu', 'bran'), d('grievement-blesse', 'hilda')], deux(), R, nouvelleMemoire(), toujours);
    expect(r?.situation).toBe('grievement-blesse');
    expect(r?.locuteur).toBe('hilda');
  });

  it('la voix est celle de la race et du genre du portrait, et le numéro dit quel cri', () => {
    const r = choisirReplique([d('grievement-blesse', 'hilda')], deux(), R, nouvelleMemoire(), toujours);
    expect(r?.voix).toBe('nain-f');
    expect(R.situations['grievement-blesse'].map((c) => accorder(c, true))[r!.numero - 1]).toBe(r!.texte);
  });

  it('l’accord suit celui qui parle : « blessée » pour une voix féminine, « blessé » pour une masculine', () => {
    // Le premier cri de la situation est déjà dit : on tombe sur « Je suis grièvement … ».
    const dejaDit = (id: string) => {
      const m = nouvelleMemoire();
      m.dites.set(`${id}:grievement-blesse`, [0]);
      return m;
    };
    expect(choisirReplique([d('grievement-blesse', 'hilda')], deux(), R, dejaDit('hilda'), toujours)?.texte).toBe('Je suis grièvement blessée !');
    expect(choisirReplique([d('grievement-blesse', 'bran')], deux(), R, dejaDit('bran'), toujours)?.texte).toBe('Je suis grièvement blessé !');
  });

  it('un allié tombé est commenté par un autre héros, pas par lui-même', () => {
    const etat = deux();
    etat.combattants.find((c) => c.id === 'bran')!.pv = 0;
    const r = choisirReplique([d('allie-tombe', undefined, 'bran')], etat, R, nouvelleMemoire(), toujours);
    expect(r?.locuteur).toBe('hilda');
    expect(r?.texte).toBe('Un allié est à terre !');
  });

  it('un personnage dont le portrait n’est pas de la galerie se tait', () => {
    const etat = combat([hero('Bran', 1, 1, 'portrait-inconnu')]);
    expect(choisirReplique([d('grievement-blesse', 'bran')], etat, R, nouvelleMemoire(), toujours)).toBeUndefined();
  });

  it('chaque portrait de la galerie peut parler, avec la voix de sa race et de son genre', () => {
    for (const p of portraits) {
      const etat = combat([hero('Bran', 1, 1, p.id)]);
      expect(choisirReplique([d('victoire')], etat, R, nouvelleMemoire(), toujours)?.voix, p.id).toBe(voixDuPortrait(p.id));
    }
  });

  it('silences : une réplique ordinaire par round pour le groupe, deux rounds pour la même personne ; l’urgent passe outre', () => {
    const etat = deux();
    const m = nouvelleMemoire();
    expect(choisirReplique([d('ennemi-abattu', 'bran')], etat, R, m, toujours)).toBeDefined();
    expect(choisirReplique([d('ennemi-abattu', 'hilda')], etat, R, m, toujours)).toBeUndefined();
    expect(choisirReplique([d('grievement-blesse', 'hilda')], etat, R, m, toujours)).toBeDefined();
    etat.round += 1;
    expect(choisirReplique([d('ennemi-abattu', 'bran')], etat, R, m, toujours)).toBeUndefined();
    etat.round += 1;
    expect(choisirReplique([d('ennemi-abattu', 'bran')], etat, R, m, toujours)).toBeDefined();
  });

  it('une situation courante n’est pas commentée à chaque fois', () => {
    expect(choisirReplique([d('ennemi-abattu', 'bran')], deux(), R, nouvelleMemoire(), () => 0.99)).toBeUndefined();
  });

  it('pas de redite avant d’avoir tout dit, ni deux fois de suite le même cri en recommençant', () => {
    const etat = deux();
    const m = nouvelleMemoire();
    const n = R.situations['grievement-blesse'].length;
    expect(n).toBeGreaterThanOrEqual(2);
    const dites: string[] = [];
    // Un round par cri : au plus deux répliques par round.
    for (let i = 0; i < n * 3; i++) {
      etat.round = i + 1;
      dites.push(choisirReplique([d('grievement-blesse', 'bran')], etat, R, m, toujours)!.texte);
    }
    expect(new Set(dites.slice(0, n)).size).toBe(n);
    for (let i = 1; i < dites.length; i++) expect(dites[i], `cri ${i}`).not.toBe(dites[i - 1]);
  });
});

describe('cohérence : ce que dit un personnage colle à ce qui se passe', () => {
  const ev = (type: Evenement['type'], extra: Partial<Evenement> = {}): Evenement => ({ round: 1, type, texte: '', ...extra });
  const deux = () => combat([hero('Bran', 1, 1, 'humain-m-1'), hero('Hilda', 2, 1, 'nain-f-2')]);
  const d = (situation: Situation, locuteur?: string): Declencheur => ({ situation, locuteur, apres: 3 });

  it('un raté qui blesse quand même (Écorchure) n’est pas un raté', () => {
    const rate = ev('attaque', { acteur: 'bran', cible: 'gob', details: { resultat: 'rate' } });
    expect(rateVraiment([rate], 0)).toBe(true);
    expect(rateVraiment([rate, ev('degats', { cible: 'gob', valeur: 3 })], 0)).toBe(false);
    // Les dégâts d'une autre action, ou sur quelqu'un d'autre, ne comptent pas.
    expect(rateVraiment([rate, ev('degats', { cible: 'loup', valeur: 3 })], 0)).toBe(true);
    expect(rateVraiment([rate, ev('attaque', { acteur: 'pip', cible: 'gob' }), ev('degats', { cible: 'gob', valeur: 3 })], 0)).toBe(true);
    expect(rateVraiment([ev('attaque', { details: { resultat: 'touche' } })], 0)).toBe(false);
  });

  it('dans le journal : un raté suivi de dégâts sur la cible ne fait pas dire « Raté ! »', () => {
    const etat = combat([hero('Bran', 1, 1, 'humain-m-1'), monstreDepuisProfil(donnees.monstres.get('combattant-gobelin')!, 'gob', { x: 2, y: 1 })]);
    const avant = capturer(etat);
    etat.journal.push(ev('attaque', { acteur: 'bran', cible: 'gob', details: { resultat: 'rate' } }), ev('degats', { cible: 'gob', valeur: 3 }));
    expect(situations(declencheurs(etat, avant))).not.toContain('rate:bran');
  });

  it('un héros à l’agonie ne crie pas victoire, ni ne lance le combat avec entrain : un autre le fait', () => {
    const etat = deux();
    const hilda = etat.combattants.find((c) => c.id === 'hilda')!;
    hilda.pv = 1;
    expect(convient('victoire', hilda)).toBe(false);
    expect(convient('debut-combat', hilda)).toBe(false);
    expect(convient('grievement-blesse', hilda)).toBe(true);
    for (let i = 0; i < 20; i++) {
      const r = choisirReplique([d('victoire')], etat, R, nouvelleMemoire(), () => (i % 10) / 10);
      if (r) expect(r.locuteur).toBe('bran');
    }
    // Si tous sont au plus mal, personne ne crie victoire.
    etat.combattants.find((c) => c.id === 'bran')!.pv = 1;
    expect(choisirReplique([d('victoire')], etat, R, nouvelleMemoire(), toujours)).toBeUndefined();
  });

  it('« Aïe, ça fait mal ! » ne se dit pas quand on est déjà gravement blessé', () => {
    const etat = deux();
    etat.combattants.find((c) => c.id === 'bran')!.pv = 1;
    expect(choisirReplique([d('blesse', 'bran')], etat, R, nouvelleMemoire(), toujours)).toBeUndefined();
  });

  it(`pas plus de ${MAX_PAR_ROUND} répliques par round, même graves ; la victoire passe toujours`, () => {
    const etat = combat([hero('Bran', 1, 1, 'humain-m-1'), hero('Hilda', 2, 1, 'nain-f-2'), hero('Pip', 3, 1, 'halfelin-m-1')]);
    const m = nouvelleMemoire();
    const dites = ['bran', 'hilda', 'pip'].map((id) => choisirReplique([d('allie-tombe')], etat, R, m, toujours) ?? id);
    expect(dites.filter((x) => typeof x !== 'string').length).toBe(MAX_PAR_ROUND);
    expect(choisirReplique([d('victoire')], etat, R, m, toujours)).toBeDefined();
  });
});

describe('planifierBulle : une bulle à la fois, et jamais en retard', () => {
  it('sans bulle en cours, elle part tout de suite', () => {
    expect(planifierBulle(1000, 0, 1500, 300)).toEqual({ debut: 1000, fin: 2500 });
    expect(planifierBulle(5000, 2000, 1500, 300)).toEqual({ debut: 5000, fin: 6500 });
  });

  it('après une bulle, elle attend la fin et un silence', () => {
    expect(planifierBulle(1000, 2000, 1500, Infinity)).toEqual({ debut: 2000 + SILENCE_ENTRE_BULLES, fin: 2000 + SILENCE_ENTRE_BULLES + 1500 });
  });

  it('un cri ordinaire qui devrait trop attendre n’est pas dit ; un cri grave attend un peu, la victoire toujours', () => {
    expect(planifierBulle(1000, 2000, 1500, ATTENTE_MAX['rate-encore'])).toBeUndefined();
    expect(planifierBulle(1000, 1500, 1500, ATTENTE_MAX['grievement-blesse'])).toBeDefined();
    expect(planifierBulle(1000, 9000, 1500, ATTENTE_MAX.victoire)).toBeDefined();
  });
});
