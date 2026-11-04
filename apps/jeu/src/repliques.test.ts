// Les répliques des compagnons : les fichiers écrits, le repérage des situations sur un vrai journal du moteur, et le choix
// (priorités, silences, pas de redite, accords).
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
} from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import portraits from '../../../packages/donnees/visuel/portraits.json';
import { capturer } from './animations';
import { FICHIERS_REPLIQUES, REPLIQUES } from './repliques';
import {
  choisirReplique,
  declencheurs,
  FichierRepliques,
  nouvelleMemoire,
  remplir,
  SITUATIONS,
  type Declencheur,
  type Situation,
} from './repliques-regles';

const donnees = chargerDonneesSrd();
const ctx = { sorts: donnees.sorts };
const ARENE = grilleDepuisTexte(['..........', '..........', '..........', '..........', '..........']);

/** Un héros pré-tiré, habillé d'un portrait qui a des répliques. */
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

describe('les fichiers de répliques', () => {
  const ids = new Set(portraits.map((p) => p.id));

  it('chaque fichier est valide, porte le nom de son portrait, et ce portrait existe', () => {
    const chemins = Object.keys(FICHIERS_REPLIQUES);
    expect(chemins.length).toBeGreaterThanOrEqual(3);
    for (const [chemin, brut] of Object.entries(FICHIERS_REPLIQUES)) {
      const r = FichierRepliques.safeParse(brut);
      expect(r.success, `${chemin} : ${r.success ? '' : r.error.message}`).toBe(true);
      if (!r.success) continue;
      expect(chemin.endsWith(`/${r.data.portrait}.json`), chemin).toBe(true);
      expect(ids.has(r.data.portrait), `portrait inconnu : ${r.data.portrait}`).toBe(true);
    }
    expect(REPLIQUES.size).toBe(chemins.length);
  });

  it('les phrases n’utilisent que {nom} et {masculin|féminin}, et seulement quand on parle de quelqu’un', () => {
    for (const f of REPLIQUES.values())
      for (const s of SITUATIONS)
        for (const phrase of f.situations[s]) {
          const reste = phrase.replace(/\{nom\}/g, '').replace(/\{[^{}|]*\|[^{}|]*\}/g, '');
          expect(reste, `${f.portrait} / ${s} : ${phrase}`).not.toMatch(/[{}|]/);
          if (s !== 'allie-tombe') expect(phrase, `${f.portrait} / ${s} : ${phrase}`).not.toMatch(/[{}]/);
        }
  });

  it('pas deux fois la même phrase dans une situation', () => {
    for (const f of REPLIQUES.values()) for (const s of SITUATIONS) expect(new Set(f.situations[s]).size, `${f.portrait} / ${s}`).toBe(f.situations[s].length);
  });
});

describe('remplir', () => {
  it('accorde selon la personne dont on parle, et met son nom', () => {
    const elle = { nom: 'Hilda', portrait: 'nain-f-1' } as Combattant;
    const lui = { nom: 'Bran', portrait: 'humain-m-1' } as Combattant;
    expect(remplir('Couvrez-{le|la}, {nom} est à terre !', elle)).toBe('Couvrez-la, Hilda est à terre !');
    expect(remplir('Couvrez-{le|la}, {nom} est à terre !', lui)).toBe('Couvrez-le, Bran est à terre !');
    expect(remplir('{Il|Elle} est tombé{|e}.', elle)).toBe('Elle est tombée.');
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
  const deux = () => combat([hero('Bran', 1, 1, 'humain-f-1'), hero('Hilda', 2, 1, 'nain-m-2')]);
  const d = (situation: Situation, locuteur?: string, cible?: string): Declencheur => ({ situation, locuteur, cible, apres: 3 });

  it('la plus importante passe d’abord, et une seule réplique par commande', () => {
    const etat = deux();
    const r = choisirReplique([d('ennemi-abattu', 'bran'), d('grievement-blesse', 'hilda')], etat, REPLIQUES, nouvelleMemoire(), toujours);
    expect(r?.situation).toBe('grievement-blesse');
    expect(r?.locuteur).toBe('hilda');
    expect(REPLIQUES.get('nain-m-2')!.situations['grievement-blesse']).toContain(r!.texte);
  });

  it('un allié tombé est commenté par un autre, avec son nom et le bon accord', () => {
    const etat = deux();
    etat.combattants.find((c) => c.id === 'bran')!.pv = 0;
    const r = choisirReplique([d('allie-tombe', undefined, 'bran')], etat, REPLIQUES, nouvelleMemoire(), toujours);
    expect(r?.locuteur).toBe('hilda');
    expect(r?.texte).toContain('Bran');
    expect(r?.texte).not.toMatch(/[{}]/);
  });

  it('un portrait sans répliques se tait', () => {
    const etat = combat([hero('Bran', 1, 1, 'humain-m-3')]);
    expect(choisirReplique([d('grievement-blesse', 'bran')], etat, REPLIQUES, nouvelleMemoire(), toujours)).toBeUndefined();
  });

  it('silences : une réplique ordinaire par round pour le groupe, deux rounds pour la même personne ; l’urgent passe outre', () => {
    const etat = deux();
    const m = nouvelleMemoire();
    expect(choisirReplique([d('ennemi-abattu', 'bran')], etat, REPLIQUES, m, toujours)).toBeDefined();
    expect(choisirReplique([d('ennemi-abattu', 'hilda')], etat, REPLIQUES, m, toujours)).toBeUndefined();
    expect(choisirReplique([d('grievement-blesse', 'hilda')], etat, REPLIQUES, m, toujours)).toBeDefined();
    etat.round += 1;
    expect(choisirReplique([d('ennemi-abattu', 'bran')], etat, REPLIQUES, m, toujours)).toBeUndefined();
    etat.round += 1;
    expect(choisirReplique([d('ennemi-abattu', 'bran')], etat, REPLIQUES, m, toujours)).toBeDefined();
  });

  it('une situation courante n’est pas commentée à chaque fois', () => {
    const etat = deux();
    expect(choisirReplique([d('ennemi-abattu', 'bran')], etat, REPLIQUES, nouvelleMemoire(), () => 0.99)).toBeUndefined();
  });

  it('pas de redite avant d’avoir tout dit, ni deux fois de suite la même en recommençant', () => {
    const etat = deux();
    const m = nouvelleMemoire();
    const lignes = REPLIQUES.get('humain-f-1')!.situations['grievement-blesse'];
    const dites: string[] = [];
    for (let i = 0; i < lignes.length * 3; i++) dites.push(choisirReplique([d('grievement-blesse', 'bran')], etat, REPLIQUES, m, toujours)!.texte);
    expect(new Set(dites.slice(0, lignes.length)).size).toBe(lignes.length);
    for (let i = 1; i < dites.length; i++) expect(dites[i], `réplique ${i}`).not.toBe(dites[i - 1]);
  });
});
