// Le Val des Cendres, passe « compagnons et choix » : l'escorte, les interjections, les deux nouveaux dilemmes, les salutations de la Cendre.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { parler } from '../src/monde/dialogue';
import { nouvellePartie, etatInitial } from '../src';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

function depart(): Partie {
  const g = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine: 11, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
  return p;
}
const textes = (evs: { type: string }[]) => evs.filter((e) => e.type === 'texte').map((e) => e as unknown as { texte: string; voix?: string });

describe('les compagnons du Val : escorte et interjections', () => {
  it('chaque compagnon a au moins 12 interjections, et « rejoindre » le met en escorte', () => {
    const inter = (dm.extensions?.['interjections'] ?? []) as { pnj: string }[];
    for (const id of ['ysolde-rouage', 'korvun-tete-rase', 'mireille-vanhaut']) {
      expect(inter.filter((i) => i.pnj === id).length, id).toBeGreaterThanOrEqual(12);
      const p = dm.pnj.get(id)!;
      const rejoindre = p.sujets.find((s) => s.id === 'rejoindre')!;
      expect(JSON.stringify(rejoindre.effets)).toContain(`"escorte":{"pnj":"${id}","actif":true}`);
      expect(JSON.stringify(p.sujets.find((s) => s.id === 'se-separer')!.effets)).toContain('"actif":false');
    }
  });

  it('escortée, Ysolde parle à la Lanterne (une fois, sous son nom) ; séparée, elle se tait', () => {
    const p0 = depart();
    const avec = moteur.executer({ ...p0, etat: { ...p0.etat, escortes: ['ysolde-rouage'] } }, { type: 'aller', vers: 'vei-la-lanterne' });
    const dites = textes(avec.evenements).filter((t) => t.voix === 'Ysolde Rouage');
    expect(dites).toHaveLength(1);
    expect(dites[0]!.texte).toMatch(/feu|flamme|ne brûle/i);
    const sans = moteur.executer(depart(), { type: 'aller', vers: 'vei-la-lanterne' });
    expect(textes(sans.evenements).some((t) => t.voix === 'Ysolde Rouage')).toBe(false);
  });

  it('une interjection de choix fait l’approbation : Ysolde désapprouve l’alliance avec le Fer-Gris', () => {
    const p0 = depart();
    const avant = p0.etat.attitudes['ysolde-rouage'] ?? dm.pnj.get('ysolde-rouage')!.attitude;
    const res = moteur.executer(
      { ...p0, etat: { ...p0.etat, escortes: ['ysolde-rouage'], flags: { ...p0.etat.flags, 'choix-le-piege-du-fer-gris-alliance': true } } },
      { type: 'aller', vers: 'vei-la-lanterne' },
    );
    expect(textes(res.evenements).some((t) => t.voix === 'Ysolde Rouage')).toBe(true);
    expect(res.partie.etat.attitudes['ysolde-rouage']).toBeLessThan(avant);
  });
});

describe('la Cendre change l’accueil des habitants', () => {
  it('Hesta, Rolf, Aurèle et Bertille ont une salutation pour chaque palier atteint', () => {
    for (const id of ['hesta-cendrebrune', 'rolf-garde-capitaine', 'aurele-montclar', 'bertille-dernier-feu']) {
      const flags = dm.pnj.get(id)!.salutations.variantes.map((v) => JSON.stringify(v.condition));
      expect(flags.join(' '), id).toContain('z6-village-se-vide');
      expect(flags.join(' '), id).toContain('z6-cendre-rodeurs');
    }
  });

  it('au palier « le village se vide », Rolf le dit avant toute autre salutation', () => {
    const p = nouvellePartie(dm, { ...etatInitial(dm, 3), flags: { 'z6-village-se-vide': true, 'z6-couvre-feu': true, 'z6-cendre-rodeurs': true } }, [], () => 0.5);
    p.etat.lieu = dm.pnj.get('rolf-garde-capitaine')!.lieu;
    const res = parler(p, 'rolf-garde-capitaine');
    expect(res.ok).toBe(true);
    expect(res.narrations.join(' ')).toMatch(/charrettes/i);
  });
});

describe('les dilemmes de la houille et du serment', () => {
  const boutons = (p: Partie, d: string) => moteur.propositions(p).filter((x) => x.groupe.id === `dilemme:${d}`);

  it('« la houille et la toux » s’ouvre à l’infirmerie de Pont-de-Fer avec le fait et la houille en poche', () => {
    const p0 = depart();
    const etat = { ...p0.etat, lieu: 'pont-de-fer', faits: [...p0.etat.faits, 'f-pdf-toux-de-fer'], inventaire: { ...p0.etat.inventaire, 'z6-houille-rouge': 1 } };
    const sans = moteur.executer({ ...p0, etat: { ...etat, inventaire: {} } }, { type: 'aller', vers: 'pdf-infirmerie' });
    expect(boutons(sans.partie, 'la-houille-et-la-toux')).toEqual([]);
    const ouvert = moteur.executer({ ...p0, etat }, { type: 'aller', vers: 'pdf-infirmerie' });
    expect(boutons(ouvert.partie, 'la-houille-et-la-toux').map((b) => b.libelle)).toHaveLength(4);
  });

  it('donner la houille à l’infirmerie la retire du sac, aide le Fer-Gris et laisse la cendre monter', () => {
    const p0 = depart();
    const etat = { ...p0.etat, lieu: 'pont-de-fer', faits: [...p0.etat.faits, 'f-pdf-toux-de-fer'], inventaire: { ...p0.etat.inventaire, 'z6-houille-rouge': 1 } };
    const ouvert = moteur.executer({ ...p0, etat }, { type: 'aller', vers: 'pdf-infirmerie' }).partie;
    const avant = ouvert.etat.reputations['compagnie-du-fer-gris'] ?? 0;
    const cendreAvant = ouvert.etat.jauges['cendre'] ?? 0;
    const res = moteur.executer(ouvert, { type: 'trancher', dilemme: 'la-houille-et-la-toux', option: 'infirmerie' });
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.inventaire['z6-houille-rouge']).toBeUndefined();
    expect(res.partie.etat.reputations['compagnie-du-fer-gris']).toBe(avant + 15);
    expect(res.partie.etat.jauges['cendre']).toBe(cendreAvant + 1);
    expect(res.partie.etat.flags['choix-la-houille-et-la-toux-infirmerie']).toBe(true);
  });

  it('« le serment d’Ormgard » se pose à l’armurerie, avant la rencontre avec Brand ; lire les noms apaise les morts, forcer les scellés les offense', () => {
    const p0 = depart();
    const etat = { ...p0.etat, lieu: 'cry-rotonde', faits: [...p0.etat.faits, 'f-cry-gardien-brand'] };
    const ouvert = moteur.executer({ ...p0, etat }, { type: 'aller', vers: 'cry-armurerie' }).partie;
    expect(boutons(ouvert, 'le-serment-d-ormgard').map((b) => b.libelle)).toHaveLength(4);
    // Une fois la route du Sceau franchie, le choix ne se pose plus.
    const franchi = moteur.executer({ ...p0, etat: { ...etat, flags: { ...etat.flags, 'cryptes-franchies': true } } }, { type: 'aller', vers: 'cry-armurerie' }).partie;
    expect(boutons(franchi, 'le-serment-d-ormgard')).toEqual([]);
    const avant = ouvert.etat.reputations['morts-de-la-forge'] ?? 0;
    const res = moteur.executer(ouvert, { type: 'trancher', dilemme: 'le-serment-d-ormgard', option: 'relever' });
    expect(res.refus).toBeUndefined();
    expect(res.partie.etat.reputations['morts-de-la-forge']).toBe(avant + 15);
    const force = moteur.executer(ouvert, { type: 'trancher', dilemme: 'le-serment-d-ormgard', option: 'forcer' }).partie;
    expect(force.etat.reputations['morts-de-la-forge']).toBe(avant - 20);
    expect(force.etat.pieces).toBe(ouvert.etat.pieces + 150);
  });
});
