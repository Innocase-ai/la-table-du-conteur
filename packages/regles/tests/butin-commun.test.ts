// Le butin et les boutiques communs à toutes les histoires (lot 3, 13/11/2026) : tables de butin par palier et modèles de boutique
// (`monde/butin-commun.json`), parchemins précis dans les dépouilles.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { articles, creerMoteur, validerMonde, MODULES_STANDARD, type Pnj } from '../src';
import { BOUTIQUES_MODELES, boutiqueComplete, TABLES_COMMUNES } from '../src/monde/butin-commun';
import { PARCHEMINS_DE_DEPOUILLE, tirerDepouilles } from '../src/monde/depouilles';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde } from '../src/monde/chargeur';
import { MONDES_ESSAI } from './mondes-essai';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const val = r.monde;
const existe = (id: string) => srd.objets.has(id) || srd.armes.has(id) || srd.armures.has(id);
const ORDRE_RARETE = ['commun', 'peu-commun', 'rare', 'tres-rare', 'legendaire'];

describe('tables de butin communes', () => {
  it('il y en a pour chaque palier, leurs identifiants commencent par « commun- », et chaque objet ou sous-table existe', () => {
    expect([...TABLES_COMMUNES.values()].map((t) => t.palier).sort()).toEqual([1, 1, 2, 2, 2, 3, 3, 4]);
    for (const t of TABLES_COMMUNES.values()) {
      expect(t.id.startsWith('commun-')).toBe(true);
      for (const e of t.entrees) {
        if (e.objet) expect(existe(e.objet), `${t.id} : ${e.objet}`).toBe(true);
        if (e.table) expect(TABLES_COMMUNES.has(e.table), `${t.id} : ${e.table}`).toBe(true);
      }
    }
  });

  it('la rareté des objets suit le palier : peu commun au plus au palier 1, rare au 2, très rare au 3', () => {
    const plafond = { 1: 'peu-commun', 2: 'rare', 3: 'tres-rare', 4: 'legendaire' } as const;
    for (const t of TABLES_COMMUNES.values())
      for (const e of t.entrees)
        if (e.objet) expect(ORDRE_RARETE.indexOf(srd.objets.get(e.objet)?.rarete ?? 'commun'), `${t.id} : ${e.objet}`).toBeLessThanOrEqual(ORDRE_RARETE.indexOf(plafond[t.palier as 1 | 2 | 3 | 4]));
  });

  it('une histoire les cite sans les définir ; le préfixe « commun- » lui est réservé ; une table commune inconnue est refusée', () => {
    const rencontre = [...val.rencontres.values()].find((x) => x.type === 'combat')!;
    const avec = (tables: string[]) => validerMonde({ ...val, rencontres: new Map(val.rencontres).set(rencontre.id, { ...rencontre, butin: { ...rencontre.butin, tables } }) }, srd).erreurs.join('\n');
    expect(avec(['commun-consommables-p2'])).not.toMatch(/table de butin inconnue/);
    expect(avec(['commun-n-existe-pas'])).toMatch(/table de butin inconnue « commun-n-existe-pas »/);
    const reservee = { ...val, tables: new Map(val.tables).set('commun-ma-table', { id: 'commun-ma-table', nom: 'Ma table', palier: 1, entrees: [{ poids: 1, rien: true }] }) };
    expect(validerMonde(reservee, srd).erreurs.join('\n')).toMatch(/préfixe « commun- » est réservé/);
  });
});

describe('modèles de boutique', () => {
  it('chaque modèle existe, ses objets aussi, et il a de quoi vendre', () => {
    expect([...BOUTIQUES_MODELES.keys()].sort()).toEqual(['alchimiste', 'apothicaire', 'arcaniste', 'forgeron', 'magasin-general']);
    for (const b of BOUTIQUES_MODELES.values()) {
      expect(b.stock.length, b.id).toBeGreaterThan(4);
      for (const s of b.stock) expect(existe(s.objet), `${b.id} : ${s.objet}`).toBe(true);
    }
  });

  it('un marchand cite un modèle : son stock s’y ajoute, ses types de rachat viennent du modèle sauf s’il écrit les siens', () => {
    const base = { stock: [{ objet: 'corde', quantite: 1 }], tables: [], rachat: 0.5, types: [] as string[] };
    const mélange = boutiqueComplete({ ...base, modele: 'apothicaire' });
    expect(mélange.stock.map((s) => s.objet)).toContain('potion-de-guerison');
    expect(mélange.stock.map((s) => s.objet)).toContain('corde');
    expect(mélange.types).toEqual(['potion', 'nourriture', 'materiel']);
    expect(boutiqueComplete({ ...base, types: ['arme'], modele: 'apothicaire' }).types).toEqual(['arme']);
  });

  it('en jeu : les articles d’un marchand à modèle et à table commune, et le validateur refuse un modèle inconnu', () => {
    const moteur = creerMoteur({ dm: val, srd }, MODULES_STANDARD);
    const pnj = [...val.pnj.values()].find((n) => n.boutique)!;
    const marchand = (modele: string): Pnj => ({ ...pnj, boutique: { ...pnj.boutique!, stock: [], tables: ['commun-parchemins-p1'], modele } });
    const partie = { ...moteur.nouvellePartie([], { graine: 1 }) };
    const a = articles(moteur.ctx, partie, marchand('apothicaire')).map((x) => x.objet);
    expect(a).toContain('potion-de-guerison');
    expect(a).toContain('parchemin-de-sort-trait-de-feu');
    const dm = { ...val, pnj: new Map(val.pnj).set(pnj.id, marchand('chez-personne')) };
    expect(validerMonde(dm, srd).erreurs.join('\n')).toMatch(/modèle inconnu « chez-personne »/);
  });
});

describe('dépouilles', () => {
  it('un humanoïde peut porter un parchemin de sort précis (plus le parchemin « au choix du MJ »)', () => {
    for (const id of PARCHEMINS_DE_DEPOUILLE) expect(srd.objets.has(id), id).toBe(true);
    const humanoide = [...srd.monstres.values()].find((m) => m.type.toLowerCase().includes('humanoïde'))!;
    const objets = Object.keys(tirerDepouilles(srd, [{ profil: humanoide.id, nombre: 1 }], () => 0).objets);
    expect(objets.some((id) => PARCHEMINS_DE_DEPOUILLE.includes(id))).toBe(true);
    expect(objets).not.toContain('parchemin-de-sort-niveau-1');
  });
});
