// F6 (PRD-SAGA), lot 8 — trois réactions de monstres de plus : Division (gelée ocre, pouding noir), Regard dérangeant (diable des chaînes), Poursuite (nalfeshnie).
import { describe, expect, it } from 'vitest';
import { declencherRegards, infligerDegats, creerCombat, poursuivre } from '../src/combat/moteur';
import { preparerRencontre, RENCONTRES, type Rencontre } from '../src/combat/prototype';
import { actif, aEtat, type Combattant, type EtatCombat } from '../src/combat/etat';
import { distanceCases } from '../src/combat/grille';
import { IA_RAPIDE, jouerTourIA } from '../src/combat/ia';
import { chargerDonneesSrd } from '../src/donnees-node';

const donnees = chargerDonneesSrd();

function groupe(...profils: string[]): { etat: EtatCombat; monstres: Combattant[]; heros: Combattant[] } {
  const r: Rencontre = { ...RENCONTRES[0]!, id: 'reaction-essai', nom: 'Réaction (essai)', monstres: profils.map((profil) => ({ profil, nombre: 1 })) };
  const { grille, combattants } = preparerRencontre(r, donnees);
  const etat = creerCombat(grille, combattants, 3);
  return { etat, monstres: etat.combattants.filter((c) => c.camp === 'monstres'), heros: etat.combattants.filter((c) => c.camp === 'heros') };
}

describe('Division (gelée ocre, pouding noir)', () => {
  it('touchée par un coup tranchant, la gelée se divise : une taille de moins, la moitié des PV et des PX chacune, la copie juste après elle dans l’ordre', () => {
    const { etat, monstres, heros } = groupe('gelee-ocre');
    const gelee = monstres[0]!;
    const pv = gelee.pv;
    const px = gelee.px;
    infligerDegats(etat, gelee, [{ montant: 5, type: 'tranchant' }], heros[0]);
    const copie = etat.combattants.find((c) => c.id.startsWith(`${gelee.id}-d`))!;
    expect(copie).toBeDefined();
    expect(gelee.taille).toBe('M');
    expect(copie.taille).toBe('M');
    // La gelée ocre est immunisée contre le tranchant : elle ne perd aucun PV, mais le subir la divise.
    expect(gelee.pv).toBe(Math.floor(pv / 2));
    expect(copie.pv).toBe(gelee.pv);
    expect(gelee.px + copie.px).toBeLessThanOrEqual(px);
    expect(etat.ordre.indexOf(copie.id)).toBe(etat.ordre.indexOf(gelee.id) + 1);
    expect(new Set(etat.ordre).size).toBe(etat.combattants.length);
    expect(gelee.ressources.reaction).toBe(0);
    expect(etat.journal.some((e) => /se divise/.test(e.texte))).toBe(true);
    // La copie occupe une case libre, différente de la sienne.
    expect(copie.position).not.toEqual(gelee.position);
    expect(distanceCases(copie, gelee)).toBeLessThanOrEqual(1);
  });

  it('un coup contondant ne la divise pas, tant qu’elle n’est pas en péril ; en péril, si', () => {
    const { etat, monstres, heros } = groupe('gelee-ocre');
    const gelee = monstres[0]!;
    infligerDegats(etat, gelee, [{ montant: 5, type: 'contondant' }], heros[0]);
    expect(etat.combattants.filter((c) => c.camp === 'monstres')).toHaveLength(1);
    infligerDegats(etat, gelee, [{ montant: gelee.pv - Math.floor(gelee.pvMax / 2), type: 'contondant' }], heros[0]);
    expect(etat.combattants.filter((c) => c.camp === 'monstres')).toHaveLength(2);
  });

  it('elle ne se divise pas sous 10 PV, ni sans réaction, ni quand elle est Petite ; une copie peut se diviser encore (Moyenne → Petite)', () => {
    const a = groupe('gelee-ocre');
    a.monstres[0]!.pv = 9;
    infligerDegats(a.etat, a.monstres[0]!, [{ montant: 5, type: 'tranchant' }], a.heros[0]);
    expect(a.etat.combattants.filter((c) => c.camp === 'monstres')).toHaveLength(1);
    const b = groupe('gelee-ocre');
    b.monstres[0]!.ressources.reaction = 0;
    infligerDegats(b.etat, b.monstres[0]!, [{ montant: 5, type: 'tranchant' }], b.heros[0]);
    expect(b.etat.combattants.filter((c) => c.camp === 'monstres')).toHaveLength(1);
    const c = groupe('gelee-ocre');
    const gelee = c.monstres[0]!;
    infligerDegats(c.etat, gelee, [{ montant: 1, type: 'tranchant' }], c.heros[0]);
    const copie = c.etat.combattants.find((x) => x.id.startsWith(`${gelee.id}-d`))!;
    copie.ressources.reaction = 1;
    infligerDegats(c.etat, copie, [{ montant: 1, type: 'tranchant' }], c.heros[0]);
    expect(copie.taille).toBe('P');
    expect(c.etat.combattants.filter((x) => x.camp === 'monstres')).toHaveLength(3);
    // Petite : elle ne se divise plus.
    copie.ressources.reaction = 1;
    copie.pv = copie.pvMax = 40;
    infligerDegats(c.etat, copie, [{ montant: 1, type: 'tranchant' }], c.heros[0]);
    expect(c.etat.combattants.filter((x) => x.camp === 'monstres')).toHaveLength(3);
  });

  it('le combattant dont c’est le tour reste le même après une division (l’indice de l’ordre est corrigé)', () => {
    const { etat, monstres, heros } = groupe('gelee-ocre');
    const gelee = monstres[0]!;
    // On se place sur un combattant qui joue après la gelée dans l'ordre.
    const rangGelee = etat.ordre.indexOf(gelee.id);
    etat.actif = etat.ordre.length - 1;
    const attendu = actif(etat).id;
    if (rangGelee < etat.actif) {
      infligerDegats(etat, gelee, [{ montant: 5, type: 'tranchant' }], heros[0]);
      expect(actif(etat).id).toBe(attendu);
    }
  });

  it('un combat entier contre la gelée ocre et le pouding noir se joue jusqu’au bout, ordre et PV valides', () => {
    for (const profil of ['gelee-ocre', 'pouding-noir']) {
      const { etat } = groupe(profil);
      let tours = 0;
      while (!etat.vainqueur && etat.round < 25 && tours++ < 600) {
        jouerTourIA(etat, { sorts: donnees.sorts }, IA_RAPIDE);
        expect(new Set(etat.ordre).size).toBe(etat.combattants.length);
        expect([...etat.ordre].sort()).toEqual(etat.combattants.map((c) => c.id).sort());
        expect(etat.combattants.every((c) => c.pv >= 0 && c.pv <= c.pvMax)).toBe(true);
      }
    }
  });
});

describe('Regard dérangeant (diable des chaînes)', () => {
  it('dans son rayon, un jet de Sagesse raté effraie : l’état dure jusqu’à la fin du tour suivant, la réaction est dépensée', () => {
    const { etat, monstres, heros } = groupe('diable-des-chaines');
    const diable = monstres[0]!;
    const h = heros[0]!;
    h.position = { x: diable.position.x, y: diable.position.y + 3 };
    etat.desImposes = [1];
    declencherRegards(etat, h);
    expect(aEtat(h, 'effraye')).toBe(true);
    expect(diable.ressources.reaction).toBe(0);
    expect(h.etats.find((e) => e.etat === 'effraye')?.passerFin).toBe(true);
  });

  it('réussi, le héros est immunisé contre ce diable ; hors du rayon ou sans réaction, rien', () => {
    const { etat, monstres, heros } = groupe('diable-des-chaines');
    const diable = monstres[0]!;
    const h = heros[0]!;
    h.position = { x: diable.position.x, y: diable.position.y + 3 };
    etat.desImposes = [20];
    declencherRegards(etat, h);
    expect(aEtat(h, 'effraye')).toBe(false);
    expect(h.ressources[`immunise:${diable.id}`]).toBe(1);
    diable.ressources.reaction = 1;
    etat.desImposes = [1];
    declencherRegards(etat, h);
    expect(aEtat(h, 'effraye')).toBe(false);
    const loin = heros[1]!;
    loin.position = { x: diable.position.x, y: Math.min(etat.grille.hauteur - 2, diable.position.y + 9) };
    etat.desImposes = [1];
    declencherRegards(etat, loin);
    expect(aEtat(loin, 'effraye')).toBe(false);
  });
});

describe('Poursuite (nalfeshnie)', () => {
  it('quand un adversaire finit son déplacement à 36 m ou moins, il se téléporte à côté de lui ; une fois par round', () => {
    const { etat, monstres, heros } = groupe('nalfeshnie');
    const n = monstres[0]!;
    const h = heros[0]!;
    h.position = { x: n.position.x, y: n.position.y + 7 };
    const avant = distanceCases(n, h);
    expect(avant).toBeGreaterThan(2);
    poursuivre(etat, h);
    expect(distanceCases(n, h)).toBeLessThanOrEqual(2);
    expect(distanceCases(n, h)).toBeGreaterThanOrEqual(1);
    expect(n.ressources.reaction).toBe(0);
    expect(etat.journal.some((e) => /se téléporte près de/.test(e.texte))).toBe(true);
    const h2 = heros[1]!;
    h2.position = { x: 17, y: 9 };
    const pos = { ...n.position };
    poursuivre(etat, h2);
    expect(n.position).toEqual(pos);
  });

  it('déjà tout près, il ne bouge pas', () => {
    const { etat, monstres, heros } = groupe('nalfeshnie');
    const n = monstres[0]!;
    heros[0]!.position = { x: n.position.x, y: n.position.y + 2 };
    const pos = { ...n.position };
    poursuivre(etat, heros[0]!);
    expect(n.position).toEqual(pos);
    expect(n.ressources.reaction).toBe(1);
  });
});
