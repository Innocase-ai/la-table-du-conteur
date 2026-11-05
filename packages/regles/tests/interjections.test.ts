import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { validerMonde } from '../src/monde/validation';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm0 = r.monde;
const LIEU = 'vei-maison-des-gardiens';

const INTERJECTIONS = [
  { id: 'hesta-chez-elle', pnj: 'hesta-cendrebrune', quand: { lieu: LIEU }, texte: 'Hesta effleure le chambranle : « Ici, la cendre n’entre pas. »', effets: [{ attitude: { pnj: 'hesta-cendrebrune', delta: 4 } }, { flag: 'hesta-a-parle' }] },
  { id: 'kor-au-village', pnj: 'kor-varnak', quand: { lieu: LIEU }, texte: 'Kor regarde les toits : « Ça ne tiendrait pas une semaine. »' },
  { id: 'kor-apres-le-fait', pnj: 'kor-varnak', quand: { flag: 'hesta-a-parle' }, texte: 'Kor grogne : « Elle parle trop. »' },
];
const dm = { ...dm0, extensions: { ...(dm0.extensions ?? {}), interjections: INTERJECTIONS } };
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

function depart(): Partie {
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine: 9, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
  return p;
}
const textes = (evs: { type: string }[]) => evs.filter((e) => e.type === 'texte').map((e) => e as unknown as { texte: string; voix?: string });

describe('module Interjections : un personnage qui voyage avec le groupe réagit de lui-même', () => {
  it('un personnage présent lance son interjection quand sa condition devient vraie, avec sa voix, une seule fois', () => {
    const res = moteur.executer(depart(), { type: 'aller', vers: LIEU });
    const dites = textes(res.evenements).filter((t) => t.voix === 'Hesta Cendrebrune');
    expect(dites).toHaveLength(1);
    expect(dites[0]!.texte).toContain('la cendre n’entre pas');
    // Une seconde visite ne la répète pas.
    const p = moteur.executer(res.partie, { type: 'aller', vers: 'veillecendre' }).partie;
    const encore = moteur.executer(p, { type: 'aller', vers: LIEU });
    expect(textes(encore.evenements).filter((t) => t.voix === 'Hesta Cendrebrune')).toHaveLength(0);
  });

  it('ses effets s’appliquent : l’approbation monte, un drapeau est posé (et déclenche une autre interjection)', () => {
    const p0 = depart();
    const avant = p0.etat.attitudes['hesta-cendrebrune'] ?? 0;
    const p = moteur.executer({ ...p0, etat: { ...p0.etat, escortes: ['kor-varnak'] } }, { type: 'aller', vers: LIEU });
    expect(p.partie.etat.attitudes['hesta-cendrebrune']).toBe(avant + 4);
    expect(p.partie.etat.flags['hesta-a-parle']).toBe(true);
    // Kor, escorté, parle aussi : au village, puis à cause du drapeau posé par Hesta.
    const kor = textes(p.evenements).filter((t) => t.voix === 'Kor Varnak').map((t) => t.texte);
    expect(kor.some((t) => t.includes('une semaine'))).toBe(true);
    expect(p.partie.modules['interjections']).toMatchObject({ dites: expect.arrayContaining(['hesta-chez-elle', 'kor-au-village']) });
  });

  it('un personnage absent ne parle pas ; escorté, il parle partout', () => {
    const sansKor = moteur.executer(depart(), { type: 'aller', vers: LIEU });
    expect(textes(sansKor.evenements).some((t) => t.voix === 'Kor Varnak')).toBe(false);
    const p0 = depart();
    const avecKor = moteur.executer({ ...p0, etat: { ...p0.etat, escortes: ['kor-varnak'] } }, { type: 'aller', vers: LIEU });
    expect(textes(avecKor.evenements).some((t) => t.voix === 'Kor Varnak')).toBe(true);
  });

  it('un personnage mort se tait', () => {
    const p0 = depart();
    const res = moteur.executer({ ...p0, etat: { ...p0.etat, pnjEtats: { 'hesta-cendrebrune': 'mort' } } }, { type: 'aller', vers: LIEU });
    expect(textes(res.evenements).some((t) => t.voix === 'Hesta Cendrebrune')).toBe(false);
  });

  it('la validation : PNJ inconnu, références de la condition et des effets, identifiants en double ; un conseil pour un escorté muet', () => {
    const module = MODULES_STANDARD.find((m) => m.id === 'interjections')!;
    expect(module.valider!({ dm, srd })).toEqual([]);
    const casse = { ...dm0, extensions: { interjections: [{ ...INTERJECTIONS[0]!, pnj: 'personne' }, INTERJECTIONS[1], INTERJECTIONS[1]] } };
    const erreurs = module.valider!({ dm: casse, srd }).join('\n');
    expect(erreurs).toMatch(/PNJ inconnu « personne »/);
    expect(erreurs).toMatch(/Interjection « kor-au-village » : identifiant en double/);
    const bilan = validerMonde({ ...dm0, extensions: { interjections: [{ ...INTERJECTIONS[0]!, quand: { lieu: 'nulle-part' }, effets: [{ attitude: { pnj: 'inconnu', delta: 1 } }] }] } }, srd);
    expect(bilan.erreurs.join('\n')).toMatch(/Interjection « hesta-chez-elle » : lieu inconnu « nulle-part »/);
    expect(bilan.erreurs.join('\n')).toMatch(/Interjection « hesta-chez-elle » : pnj inconnu « inconnu »/);
    // Un personnage escorté par un effet du monde mais sans interjection : conseil.
    const citadelle = chargerMonde(join(RACINE_MONDES, 'citadelle-des-marees'));
    if (citadelle.ok) {
      const sansParole = { ...citadelle.monde, extensions: { ...(citadelle.monde.extensions ?? {}), interjections: [] } };
      expect(module.conseils!({ dm: sansParole, srd }).join('\n')).toMatch(/« nolwen-brevemer » voyage avec le groupe mais n'a que 0 interjection/);
    }
  });
});
