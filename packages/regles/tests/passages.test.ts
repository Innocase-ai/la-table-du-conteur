import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aller, creerGenerateur, etatInitial, ficheDeScene, nouvellePartie, sortiesDe, validerMonde, type DonneesMonde } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';
import { MONDES_ESSAI } from './mondes-essai';

/** Les passages expliquent où ils mènent : texte de l'auteur, vu de chaque côté, sinon résumé du lieu d'arrivée. */
function partie(lieu: string) {
  const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
  if (!r.ok) throw new Error('monde illisible');
  const dm = r.monde as DonneesMonde;
  const etat = etatInitial(dm);
  etat.lieu = lieu;
  return nouvellePartie(dm, etat, [], creerGenerateur(3));
}

describe('passages (sorties expliquées)', () => {
  it("la phrase sous le bouton : le texte de l'auteur ; sans lui, le résumé du lieu seulement une fois visité (jamais avant : il peut divulguer)", () => {
    const p = partie('hf-pont-de-la-veine');
    const sorties = sortiesDe(p, 'hf-pont-de-la-veine');
    expect(sorties.length).toBeGreaterThan(0);
    for (const s of sorties) {
      if (s.description) expect(s.apercu, s.vers).toBe(s.description);
      else expect(s.apercu, s.vers).toBe('');
    }
    // une fois visité, le résumé du lieu sert de repli
    p.etat.lieuxVisites.push('hf-lit-de-braise');
    const lit = sortiesDe(p, 'hf-pont-de-la-veine').find((s) => s.vers === 'hf-lit-de-braise')!;
    expect(lit.apercu).toBe(lit.description ?? p.dm.lieux.get('hf-lit-de-braise')!.resume);
    expect(ficheDeScene(p).sorties.length).toBe(sorties.length);
  });

  it("le texte d'un lien à double sens se lit « vu d'ici » : `retour` de l'autre côté, `description` du bon côté", () => {
    const p = partie('hf-pont-de-la-veine');
    const lien = { vers: 'hf-lit-de-braise', type: 'escalier' as const, heures: 0, sens: 'double' as const, description: 'Un escalier de basalte descend vers le lit de braise.', retour: 'L’escalier remonte vers le pont, dans la chaleur.' };
    const pont = p.dm.lieux.get('hf-pont-de-la-veine')!;
    pont.liens = pont.liens.filter((l) => l.vers !== 'hf-lit-de-braise');
    pont.liens.push(lien);
    expect(sortiesDe(p, 'hf-pont-de-la-veine').find((s) => s.vers === 'hf-lit-de-braise')!.apercu).toBe(lien.description);
    const lit = partie('hf-lit-de-braise');
    const l2 = lit.dm.lieux.get('hf-pont-de-la-veine')!;
    l2.liens = l2.liens.filter((l) => l.vers !== 'hf-lit-de-braise');
    l2.liens.push(lien);
    // le lit ne déclare rien vers le pont : le lien n'existe que d'un côté, et se lit « vu d'ici » de l'autre
    const lit2 = lit.dm.lieux.get('hf-lit-de-braise')!;
    lit2.liens = lit2.liens.filter((l) => l.vers !== 'hf-pont-de-la-veine');
    const retour = sortiesDe(lit, 'hf-lit-de-braise').find((s) => s.vers === 'hf-pont-de-la-veine');
    expect(retour?.apercu).toBe(lien.retour);
  });

  it("les bâtiments et salles s'expliquent par leur accroche, et le retour au parent a sa phrase", () => {
    const p = partie('veillecendre');
    const sorties = sortiesDe(p, 'veillecendre');
    const maison = sorties.find((s) => s.vers === 'vei-maison-des-gardiens')!;
    expect(maison.apercu).toBe(p.dm.lieux.get('vei-maison-des-gardiens')!.accroche);
    expect(maison.apercu.length).toBeGreaterThan(30);
    // en entrant, le chemin du retour est expliqué lui aussi
    aller(p, 'vei-maison-des-gardiens');
    const dehors = sortiesDe(p, 'vei-maison-des-gardiens').find((s) => s.vers === 'veillecendre')!;
    expect(dehors.apercu).toMatch(/Quitter la maison des Gardiens pour revenir à « Veillecendre »/);
    // chaque lieu enfant sans lien propre a une accroche écrite
    for (const l of p.dm.lieux.values()) {
      if (!l.parent) continue;
      const lien = [...p.dm.lieux.values()].some((x) => x.liens.some((k) => (x.id === l.parent && k.vers === l.id) || (x.id === l.id && k.vers === l.parent)));
      if (!lien) expect(l.accroche?.split(/\s+/).length ?? 0, l.id).toBeGreaterThanOrEqual(9);
    }
  });

  it('sait si le groupe est déjà allé quelque part et combien d’heures il faut', () => {
    const p = partie('veillecendre');
    const avant = sortiesDe(p, 'veillecendre').find((s) => s.vers === 'vei-maison-des-gardiens');
    expect(avant?.visite).toBe(false);
    aller(p, 'vei-maison-des-gardiens');
    aller(p, 'veillecendre');
    expect(sortiesDe(p, 'veillecendre').find((s) => s.vers === 'vei-maison-des-gardiens')?.visite).toBe(true);
    expect(sortiesDe(p, 'veillecendre').some((s) => s.heures > 0)).toBe(true);
  });

  it("le validateur signale les passages sans description (avis, pas erreur)", () => {
    const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
    if (!r.ok) throw new Error('monde illisible');
    const dm = r.monde as DonneesMonde;
    const srd = chargerDonneesSrd();
    // Le Val des Cendres a une phrase pour chacun de ses passages : plus d'avis.
    const complet = validerMonde(dm, srd);
    expect(complet.erreurs).toEqual([]);
    expect(complet.avertissements.join('\n')).not.toMatch(/Passages : /);
    // On en retire une : le validateur la compte.
    const lien = dm.lieux.get('hf-pont-de-la-veine')!.liens[0]!;
    delete lien.description;
    const v = validerMonde(dm, srd);
    expect(v.erreurs).toEqual([]);
    expect(v.avertissements.join('\n')).toMatch(/Passages : 1 sur \d+ n'ont pas de description/);
  });

  it('tous les passages du Val des Cendres expliquent où ils mènent (une phrase écrite, sans secret majeur)', () => {
    const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
    if (!r.ok) throw new Error('monde illisible');
    const dm = r.monde as DonneesMonde;
    for (const l of dm.lieux.values()) {
      for (const k of l.liens) {
        const t = k.description ?? '';
        expect(t.split(/\s+/).length, `${l.id} > ${k.vers}`).toBeGreaterThanOrEqual(8);
        expect(t, `${l.id} > ${k.vers}`).not.toMatch(/Cœur-de-Braise|Nuit de la Cendre|Thalgrin|Brunhild|tribut|Fer-Gris/);
      }
    }
  });
});

describe('passages : le parent ne contourne pas les liens fermés de ses enfants', () => {
  it("un lieu joignable seulement par des liens à condition, cachés ou verrouillés n'est pas offert par son parent ; un lien libre le rouvre", () => {
    const p = partie('veillecendre');
    const maison = 'vei-maison-des-gardiens';
    expect(sortiesDe(p, 'veillecendre').some((s) => s.vers === maison)).toBe(true);
    // un lien conditionné vers la maison, déclaré ailleurs : elle ne s'ouvre plus par son parent
    const pont = p.dm.lieux.get('hf-pont-de-la-veine')!;
    pont.liens.push({ vers: maison, type: 'passage', heures: 0, sens: 'simple', condition: { flag: 'cle-de-la-maison' } } as (typeof pont.liens)[number]);
    expect(sortiesDe(p, 'veillecendre').some((s) => s.vers === maison)).toBe(false);
    // le lien conditionné lui-même reste visible, fermé, depuis son lieu de départ
    const vu = sortiesDe(p, 'hf-pont-de-la-veine').find((s) => s.vers === maison);
    expect(vu?.bloque).toBe(true);
    // un second lien libre : la maison redevient joignable par son parent
    pont.liens.push({ vers: maison, type: 'passage', heures: 0, sens: 'simple' } as (typeof pont.liens)[number]);
    expect(sortiesDe(p, 'veillecendre').some((s) => s.vers === maison)).toBe(true);
  });

  it('La Dîme des Roseaux : la mine ne s’atteint pas depuis la région, mais le marais et la grotte, oui', () => {
    const r = chargerMonde(join(RACINE_MONDES, 'dime-des-roseaux'));
    if (!r.ok) throw new Error('monde illisible');
    const dm = r.monde as DonneesMonde;
    const etat = etatInitial(dm);
    etat.lieu = 'dime-des-roseaux';
    const p = nouvellePartie(dm, etat, [], creerGenerateur(3));
    const vers = sortiesDe(p, 'dime-des-roseaux').map((s) => s.vers);
    expect(vers).not.toContain('mine-hobgobeline');
    expect(vers).toContain('mireval');
    expect(vers).toContain('marais');
    // la mine reste joignable par le passage secret de la cabane, fermé tant que le groupe n'a pas la carte du marais
    const depuisCabane = sortiesDe(p, 'mar-cabane-des-passeurs').find((s) => s.vers === 'mine-hobgobeline');
    expect(depuisCabane?.bloque).toBe(true);
  });
});
