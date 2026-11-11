import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { creerMoteur, herosPreTires, MODULES_STANDARD, personnageDepuisFiche } from '../src';
import { chargerMonde } from '../src/monde/chargeur';
import { etatInitial, plafondDeNiveau } from '../src/monde/etat';
import { issueRencontre, nouvellePartie } from '../src/monde/exploration';
import { chargerDonneesSrd } from '../src/donnees-node';
import type { DonneesMonde } from '../src/monde/schemas';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const monde = r.monde;
const lieuDe = (dm: DonneesMonde, rencontre: string) => [...dm.lieux.values()].find((l) => l.rencontres.some((x) => x.id === rencontre))?.id;

/** Un monde à deux chapitres, aux plafonds 2 puis 5 : le premier couvre le lieu de départ, le second un autre lieu sans lien de parenté. */
function monde2Chapitres(): { dm: DonneesMonde; a: string; b: string } {
  const dm = structuredClone(monde);
  const a = dm.monde.depart.lieu;
  const ancetres = new Set<string>();
  for (let id: string | undefined = a; id; id = dm.lieux.get(id)?.parent) ancetres.add(id);
  const b = [...dm.lieux.keys()].find((id) => !ancetres.has(id) && ![...ancetres].some((x) => dm.lieux.get(id)?.parent === x))!;
  dm.monde.chapitres = [
    { id: 'un', nom: 'Un', niveaux: { min: 1, max: 2 }, resume: 'r', lieux: [a], quetes: [] },
    { id: 'deux', nom: 'Deux', niveaux: { min: 3, max: 5 }, resume: 'r', lieux: [b], quetes: [] },
  ];
  dm.monde.niveaux = { min: 1, max: 20 };
  return { dm, a, b };
}

describe('plafond de niveau par chapitre', () => {
  it('le groupe ne dépasse pas le palier du chapitre le plus avancé où il est allé', () => {
    const { dm, a, b } = monde2Chapitres();
    const e = etatInitial(dm, 1);
    expect(plafondDeNiveau(e, dm)).toBe(2);
    e.lieuxVisites.push(b);
    expect(plafondDeNiveau(e, dm)).toBe(5);
    expect(e.lieu).toBe(a);
  });

  it('sans chapitre correspondant, le plafond est le niveau maximal du monde', () => {
    const { dm } = monde2Chapitres();
    dm.monde.chapitres = [{ id: 'x', nom: 'X', niveaux: { min: 1, max: 3 }, resume: 'r', lieux: ['lieu-qui-n-existe-pas'], quetes: [] }];
    expect(plafondDeNiveau(etatInitial(dm, 1), dm)).toBe(20);
  });

  it("l'XP en trop reste en réserve, puis devient des niveaux en entrant dans le chapitre suivant", () => {
    const dm = structuredClone(monde);
    const a = dm.monde.depart.lieu;
    const ancetres = new Set<string>();
    for (let id: string | undefined = a; id; id = dm.lieux.get(id)?.parent) ancetres.add(id);
    // Un voisin direct (lien) qui n'est pas un ancêtre : il ouvre le chapitre 2.
    const b = dm.lieux.get(a)!.liens.map((l) => l.vers).find((v) => dm.lieux.has(v) && !ancetres.has(v) && !dm.lieux.get(v)!.liens.some((l) => l.verrou || l.condition) && !dm.lieux.get(a)!.liens.find((l) => l.vers === v)!.verrou && !dm.lieux.get(a)!.liens.find((l) => l.vers === v)!.condition)!;
    expect(b).toBeDefined();
    dm.monde.chapitres = [
      { id: 'un', nom: 'Un', niveaux: { min: 1, max: 2 }, resume: 'r', lieux: [a], quetes: [] },
      { id: 'deux', nom: 'Deux', niveaux: { min: 3, max: 5 }, resume: 'r', lieux: [b], quetes: [] },
    ];
    dm.monde.niveaux = { min: 1, max: 20 };
    const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
    const groupe = herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase() }));
    const depart = moteur.executer(moteur.nouvellePartie(groupe, { graine: 3, niveau: 1 }), { type: 'commencer' }).partie;
    const calme = depart.scene.type === 'rencontre' ? moteur.executer(depart, { type: 'reglerRencontre', issue: 'fuite' }).partie : depart;
    expect(calme.etat.niveauGroupe).toBe(1);
    // 6 500 PX = niveau 5 au SRD, mais le chapitre 1 s'arrête au niveau 2 : tant que le groupe y reste, plafondDeNiveau vaut 2.
    expect(plafondDeNiveau(calme.etat, dm)).toBe(2);
    const riche = structuredClone(calme);
    riche.etat.xp = 6500;
    // Entrer dans le chapitre 2 relève le plafond : l'XP en réserve devient des niveaux.
    const ailleurs = moteur.executer(riche, { type: 'aller', vers: b });
    expect(ailleurs.refus).toBeUndefined();
    expect(ailleurs.partie.etat.niveauGroupe).toBe(5);
    expect(ailleurs.partie.etat.xp).toBe(6500);
  });
});

describe('XP d’une rencontre : une seule fois', () => {
  it('une rencontre qui revient ne rapporte pas de PX une seconde fois', () => {
    const dm = monde;
    const rencontre = [...dm.rencontres.keys()].find((id) => lieuDe(dm, id))!;
    const groupe = herosPreTires(srd).map((h) => personnageDepuisFiche(h.fiche, { id: h.fiche.nom.toLowerCase() }));
    const p = { ...nouvellePartie(structuredClone(dm), etatInitial(dm), groupe, () => 0.5), srd };
    p.etat.lieu = lieuDe(dm, rencontre)!;
    const avant = p.etat.xp;
    issueRencontre(p, rencontre, { type: 'victoire', px: 600 });
    const apres1 = p.etat.xp;
    expect(apres1).toBeGreaterThan(avant);
    issueRencontre(p, rencontre, { type: 'victoire', px: 600 });
    expect(p.etat.xp).toBe(apres1);
  });
});
