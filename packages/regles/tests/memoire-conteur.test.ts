// La mémoire du groupe racontée au conteur (phase 2 du plan de mémoire) : le dossier du groupe, ce que chaque PNJ en sait, la règle du prompt.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  bilanPersonnage,
  ceQueSaitLePnj,
  creerMoteur,
  DOSSIER_MAX,
  dossierDuGroupe,
  etatInitial,
  ficheDeTour,
  groupeConseille,
  MODULES_STANDARD,
  opinionDeFaction,
  personnageDepuisFiche,
  promptSysteme,
  type Partie,
} from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

const GARDE = 'hf-r-garde-de-thalgrin';
const HESTA = 'hesta-cendrebrune';
const THALGRIN = 'thalgrin-coeur-d-enclume';

const groupe = () =>
  groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
function depart(): Partie {
  let p = moteur.executer(moteur.nouvellePartie(groupe(), { graine: 9, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
  return p;
}
/** Une partie où le groupe est chez Hesta, après avoir vaincu la garde de Thalgrin (dont seul Thalgrin a été témoin). */
function aprèsLeCombat(): Partie {
  const p = moteur.executer(depart(), { type: 'aller', vers: 'vei-maison-des-gardiens' }).partie;
  return {
    ...p,
    etat: {
      ...p.etat,
      exploration: {
        ...p.etat.exploration,
        issues: { [GARDE]: { type: 'victoire', jour: 3, lieu: 'hf-forge-du-coeur' } },
        temoignages: [{ genre: 'victoire', ref: GARDE, lieu: 'hf-forge-du-coeur', jour: 3, presents: [THALGRIN] }],
      },
    },
  };
}

describe('le dossier du groupe', () => {
  it('un groupe qui n’a rien vécu n’a pas de dossier', () => {
    const e = etatInitial(dm, 3);
    for (const f of dm.factions.values()) e.reputations[f.id] = 0;
    expect(dossierDuGroupe(dm, e)).toEqual([]);
  });

  it('il rappelle les lieux parcourus (les plus récents d’abord), les rencontres et leur issue, les personnes, les compagnons, les réputations', () => {
    const e = etatInitial(dm, 3);
    e.lieuxVisites = ['veillecendre', 'vei-auberge-dernier-feu', 'vei-halle-du-bailli'];
    e.lieu = 'vei-halle-du-bailli';
    e.jour = 4;
    e.escortes = ['ysolde-rouage'];
    e.reputations['gardiens-de-la-veille'] = 40;
    e.reputations['compagnie-du-fer-gris'] = -70;
    (e as unknown as { exploration: object }).exploration = {
      issues: { [GARDE]: { type: 'victoire', jour: 3, lieu: 'x' }, 'hf-r-le-fer-gris-arrive': { type: 'alternative', alternative: 'refuser', jour: 4, lieu: 'x' } },
      pnjVus: { [HESTA]: { premierJour: 1, dernierJour: 2, paroles: 3 }, 'rolf-garde-capitaine': { premierJour: 2, dernierJour: 4, paroles: 1 } },
    };
    const texte = dossierDuGroupe(dm, e).join('\n');
    expect(texte).toMatch(/Lieux déjà parcourus \(3 au total.*: L'auberge du Dernier Feu, Veillecendre\./);
    expect(texte).not.toContain('La halle du bailli'); // le lieu actuel n'est pas « déjà parcouru »
    expect(texte).toContain('La garde de Thalgrin (combat gagné par le groupe, jour 3)');
    expect(texte).toMatch(/L'arrivée du Fer-Gris \(réglée sans combat : refuser, jour 4\)/);
    expect(texte.indexOf('Fer-Gris')).toBeLessThan(texte.indexOf('garde de Thalgrin')); // la plus récente d'abord
    expect(texte).toMatch(/Personnes à qui le groupe a parlé.*: Rolf.*, Hesta/);
    expect(texte).toContain('Voyagent avec le groupe : Ysolde Rouage.');
    expect(texte).toMatch(/Réputation : les .*ennemis déclarés.*estime/);
  });

  it('sa taille est plafonnée, quel que soit le nombre d’actes passés : les souvenirs anciens tombent les premiers', () => {
    const e = etatInitial(dm, 3);
    const lieux = [...dm.lieux.values()].filter((l) => l.type !== 'region').slice(0, 120);
    e.lieuxVisites = lieux.map((l) => l.id);
    e.lieu = lieux[0]!.id;
    const rencontres = [...dm.rencontres.keys()].slice(0, 60);
    (e as unknown as { exploration: object }).exploration = {
      issues: Object.fromEntries(rencontres.map((id, i) => [id, { type: 'victoire', jour: i + 1, lieu: 'x' }])),
      pnjVus: Object.fromEntries([...dm.pnj.keys()].slice(0, 50).map((id, i) => [id, { premierJour: 1, dernierJour: i + 1, paroles: 1 }])),
    };
    const l = dossierDuGroupe(dm, e);
    expect(l.join('\n').length).toBeLessThanOrEqual(DOSSIER_MAX);
    // La rencontre la plus récente (jour 60) est présente, la plus ancienne (jour 1) non.
    const texte = l.join('\n');
    expect(texte).toContain(`${dm.rencontres.get(rencontres[59]!)!.nom} (combat gagné par le groupe, jour 60)`);
    expect(texte).not.toContain('jour 1)');
    expect(dossierDuGroupe(dm, e, 400).join('\n').length).toBeLessThanOrEqual(400);
  });

  it('les paroles de réputation : des mots, rien entre -25 et 25', () => {
    expect(opinionDeFaction(0)).toBeUndefined();
    expect(opinionDeFaction(24)).toBeUndefined();
    expect(opinionDeFaction(25)).toMatch(/estime/);
    expect(opinionDeFaction(-25)).toMatch(/méfient/);
    expect(opinionDeFaction(-60)).toMatch(/ennemis/);
    expect(opinionDeFaction(60)).toMatch(/dévoués/);
  });
});

describe('ce qu’un PNJ sait du groupe', () => {
  it('il ne connaît le groupe qu’après lui avoir parlé ; un PNJ qui n’a rien vu ignore les combats', () => {
    const e = etatInitial(dm, 3);
    expect(ceQueSaitLePnj(dm, e, HESTA)).toBe('ne connaît pas encore le groupe.');
    (e as unknown as { exploration: object }).exploration = {
      pnjVus: { [HESTA]: { premierJour: 1, dernierJour: 1, paroles: 2 } },
      issues: { [GARDE]: { type: 'victoire', jour: 3, lieu: 'x' } },
      temoignages: [{ genre: 'victoire', ref: GARDE, lieu: 'x', jour: 3, presents: [THALGRIN] }],
    };
    expect(ceQueSaitLePnj(dm, e, HESTA)).toBe('a déjà parlé au groupe (la première fois le jour 1, 2 fois).');
    // Thalgrin, lui, était là.
    expect(ceQueSaitLePnj(dm, e, THALGRIN)).toContain('était présent quand : La garde de Thalgrin (combat gagné par le groupe, jour 3)');
    expect(ceQueSaitLePnj(dm, e, HESTA)).not.toContain('était présent');
  });

  it('un PNJ rapporte l’opinion de sa faction ; une ancienne sauvegarde se contente des sujets abordés', () => {
    const e = etatInitial(dm, 3);
    const avecFaction = [...dm.pnj.values()].find((p) => p.faction && dm.factions.has(p.faction))!;
    e.reputations[avecFaction.faction!] = -70;
    expect(ceQueSaitLePnj(dm, e, avecFaction.id)).toMatch(/sa faction \(.*\) : ses membres sont ses ennemis déclarés/);
    const ancien = etatInitial(dm, 3);
    (ancien as unknown as { exploration: object }).exploration = { sujetsVus: [`${HESTA}:la-lanterne`] };
    expect(ceQueSaitLePnj(dm, ancien, HESTA)).toBe('a déjà parlé au groupe.');
  });
});

describe('dans la fiche du conteur', () => {
  it('le dossier et la ligne de chaque PNJ présent y figurent ; un PNJ qui n’était pas là n’a rien vu du combat', () => {
    const fiche = ficheDeTour(moteur, aprèsLeCombat());
    expect(fiche).toContain('## Ce que le groupe a vécu');
    expect(fiche).toContain('La garde de Thalgrin (combat gagné par le groupe, jour 3)');
    // Hesta est présente et n'a pas vu le combat ; sa ligne ne le mentionne pas.
    const ligneHesta = fiche.split('\n').find((x) => x.includes('Ce qu\'il sait du groupe')) ?? '';
    expect(ligneHesta).toMatch(/ne connaît pas encore le groupe|a déjà parlé au groupe/);
    expect(ligneHesta).not.toContain('était présent');
  });

  it('la règle du prompt dit que le monde se souvient, mais que chacun ne sait que ce qu’il a pu savoir', () => {
    const prompt = promptSysteme(dm, 'Bible.');
    expect(prompt).toContain('13. **Le monde se souvient du groupe, mais chacun ne sait que ce qu\'il a pu savoir.**');
    expect(prompt).toContain('« Ce qu\'il sait du groupe »');
  });
});
