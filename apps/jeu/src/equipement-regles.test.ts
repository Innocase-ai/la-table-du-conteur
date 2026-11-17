// La poupée d'équipement avec le vrai moteur : cases, mains bloquées, objets du sac par case, refus et CA.
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, type Emplacement, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type Moteur, type Partie } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../../packages/regles/src/monde/chargeur';
import { MONDES_ESSAI } from '../../../packages/regles/tests/mondes-essai';
import { join } from 'node:path';
import { attaquesEnMain, candidatsPour, casesPour, comparer, poupeeDe, texteAttaques, texteCa } from './equipement-regles';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(MONDES_ESSAI, 'val-des-cendres'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const moteur: Moteur = creerMoteur({ dm: r.monde, srd }, MODULES_STANDARD);

const depart = (): Partie => {
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    // Sylvaine (rôdeuse) démarre avec son arc long, qui prend les deux mains : ces tests de comparateur lui donnent le jeu de mêlée.
    if (p!.choix.nom === 'Sylvaine') p!.choix = { ...p!.choix, jeuArmes: 'melee' };
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  return moteur.nouvellePartie(groupe, { graine: 1, niveau: 3 });
};

describe('poupée d’équipement', () => {
  it('neuf cases de corps, deux jeux, le jeu en main est marqué', () => {
    const p = depart();
    const poupee = poupeeDe(moteur.ctx, p.groupe[0]!);
    expect(poupee.corps.map((c) => c.emplacement)).toEqual(['tete', 'cou', 'dos', 'torse', 'gants', 'anneau1', 'ceinture', 'anneau2', 'pieds']);
    expect(poupee.jeux.map((j) => j.actif)).toEqual([true, false]);
    expect(poupee.jeux[0].droite.objet).toBeDefined();
  });

  it('la main gauche est bloquée par une arme à deux mains, avec son motif', () => {
    const p = depart();
    const bran = p.groupe.find((h) => h.id === 'bran')!;
    const poupee = poupeeDe(moteur.ctx, bran);
    const j1 = poupee.jeux[0];
    if (j1.droite.objet?.id === 'epee-a-deux-mains') expect(j1.gauche.bloquee).toMatch(/deux mains/);
    else expect(j1.gauche.bloquee).toBeUndefined();
  });

  it('les objets du sac par case : la bonne famille, la CA avant et après, et les refus motivés', () => {
    const p = depart();
    p.etat.inventaire['cotte-de-mailles'] = 1;
    p.etat.inventaire['bouclier'] = 1;
    p.etat.inventaire['bottes-ailees'] = 1;
    const h = p.groupe.find((x) => x.id === 'pip')!;
    const torse = candidatsPour(moteur.ctx, h, 'torse', p.etat.inventaire);
    expect(torse.map((c) => c.objet)).toEqual(['cotte-de-mailles']);
    expect(torse[0]!.ca.apres).toBeGreaterThan(torse[0]!.ca.avant);
    expect(texteCa(torse[0]!.ca)).toMatch(/^CA \d+ → \d+$/);
    expect(candidatsPour(moteur.ctx, h, 'pieds', p.etat.inventaire).map((c) => c.objet)).toEqual(['bottes-ailees']);
    // Le bouclier va à gauche seulement, jamais à droite ni au corps.
    expect(candidatsPour(moteur.ctx, h, 'tete', p.etat.inventaire)).toEqual([]);
    const droite = candidatsPour(moteur.ctx, h, 'j1.droite', p.etat.inventaire);
    expect(droite.find((c) => c.objet === 'bouclier')?.refus).toMatch(/main gauche/);
  });

  it('les cases où va un objet du sac (celles qui s’allument), avec leur refus', () => {
    const h = depart().groupe.find((x) => x.id === 'pip')!;
    expect(Object.keys(casesPour(moteur.ctx, h, 'cotte-de-mailles'))).toEqual(['torse']);
    expect(Object.keys(casesPour(moteur.ctx, h, 'bottes-ailees'))).toEqual(['pieds']);
    // Un bouclier : les quatre mains sont proposées, seules les gauches l'acceptent (si la droite le permet).
    const bouclier = casesPour(moteur.ctx, h, 'bouclier');
    expect(Object.keys(bouclier).sort()).toEqual(['j1.droite', 'j1.gauche', 'j2.droite', 'j2.gauche']);
    expect(bouclier['j1.droite']!.refus).toMatch(/main gauche/);
    expect(casesPour(moteur.ctx, h, 'rations')).toEqual({});
  });

  describe('comparateur « remplace sur… »', () => {
    const lignesDe = (c: ReturnType<typeof comparer>) => Object.fromEntries((c?.lignes ?? []).map((l) => [l.cle, l]));
    const heros = (p: Partie, id: string) => p.groupe.find((x) => x.id === id)!;

    it('une arme magique remplace l’arme en main : dégâts, bonus et nom de ce qui est remplacé', () => {
      const p = depart();
      const c = comparer(moteur.ctx, heros(p, 'bran'), 'pdf-lame-de-fer-gris', 'j1.droite')!;
      expect(c.emplacement).toBe('j1.droite');
      expect(c.enMain).toBe(true);
      expect(c.remplace).toEqual(['Épée à deux mains']);
      expect(c.titre).toBe('Remplace sur Bran : Épée à deux mains');
      const l = lignesDe(c);
      expect(l.attaques!.avant).toBe('+5 · 2d6+3 tranchant (moy. 10)');
      expect(l.attaques!.apres).toBe('+6 · 1d8+4 tranchant (moy. 8,5)');
      expect(l.attaques!.sens).toBe('moins');
      expect(l.bonus).toMatchObject({ avant: 'aucun', apres: '+1 attaque, +1 dégâts', sens: 'mieux' });
      expect(l.ca).toBeUndefined();
    });

    it('une dague (corps à corps ou lancée) n’est écrite qu’une fois', () => {
      const p = depart();
      p.etat.inventaire['dague'] = 1;
      const c = comparer(moteur.ctx, heros(p, 'bran'), 'dague', 'j1.droite')!;
      expect(lignesDe(c).attaques!.apres).toBe('+5 · 1d4+3 perforant (moy. 5,5)');
    });

    it('un emplacement libre n’a rien à remplacer', () => {
      const p = depart();
      p.etat.inventaire['cotte-de-mailles'] = 1;
      const c = comparer(moteur.ctx, heros(p, 'ambrine'), 'cotte-de-mailles')!;
      expect(c.emplacement).toBe('torse');
      expect(c.remplace).toEqual([]);
      expect(c.titre).toBe('Libre sur Ambrine : torse');
    });

    it('une armure : la CA avant → après, la Discrétion, la formation manquante', () => {
      const p = depart();
      p.etat.inventaire['cotte-de-mailles'] = 1;
      const hilda = comparer(moteur.ctx, heros(p, 'hilda'), 'cotte-de-mailles')!;
      expect(lignesDe(hilda).ca).toMatchObject({ avant: '14', apres: '18', sens: 'mieux' });
      expect(hilda.remplace).toEqual(['Chemise de mailles']);
      // Pip n'a que la formation aux armures légères : la CA ne monte pas autant, et la mise en garde le dit.
      const pip = comparer(moteur.ctx, heros(p, 'pip'), 'cotte-de-mailles')!;
      expect(pip.notes.join(' ')).toMatch(/formation/);
      expect(lignesDe(pip).discretion).toMatchObject({ avant: 'normale', apres: 'désavantage', sens: 'moins' });
    });

    it('un bouclier va à la main gauche : +2 de CA, et les attaques ne changent pas', () => {
      const p = depart();
      p.etat.inventaire['bouclier'] = 1;
      const c = comparer(moteur.ctx, heros(p, 'sylvaine'), 'bouclier', 'j1.gauche')!;
      expect(c.emplacement).toBe('j1.gauche');
      expect(lignesDe(c).ca).toMatchObject({ avant: '15', apres: '17', sens: 'mieux' });
      expect(lignesDe(c).attaques).toBeUndefined();
    });

    it('une arme à deux mains chasse le bouclier : la CA baisse et l’attaque change', () => {
      const p = depart();
      p.etat.inventaire['epee-a-deux-mains'] = 1;
      const c = comparer(moteur.ctx, heros(p, 'hilda'), 'epee-a-deux-mains', 'j1.droite')!;
      expect(c.remplace).toEqual(['Bouclier', "Masse d'armes"]);
      const l = lignesDe(c);
      expect(l.ca).toMatchObject({ avant: '14', apres: '12', sens: 'moins' });
      expect(l.attaques!.sens).toBe('mieux');
    });

    it('sans emplacement imposé : comme la commande, un emplacement libre d’abord (ici l’autre jeu, qui n’est pas en main)', () => {
      const p = depart();
      p.etat.inventaire['epee-a-deux-mains'] = 1;
      const c = comparer(moteur.ctx, heros(p, 'hilda'), 'epee-a-deux-mains')!;
      expect(c.emplacement).toBe('j2.droite');
      expect(c.jeu).toBe(2);
      expect(c.enMain).toBe(false);
      expect(c.remplace).toEqual([]);
      expect(c.notes.join(' ')).toMatch(/pas en main/);
      // Aucun effet sur la CA tant que le jeu II n'est pas pris : la ligne le précise (la CA de la poupée ne bouge pas).
      expect(heros(p, 'hilda').fiche.ca).toBe(14);
    });

    it('un bouclier dans le jeu qui n’est pas en main : la CA une fois ce jeu pris en main', () => {
      const p = depart();
      p.etat.inventaire['bouclier'] = 1;
      const c = comparer(moteur.ctx, heros(p, 'bran'), 'bouclier')!;
      expect(c.emplacement).toBe('j2.gauche');
      expect(c.enMain).toBe(false);
      expect(lignesDe(c).ca).toMatchObject({ libelle: 'CA (jeu II)', sens: 'mieux' });
    });

    it('un anneau magique : bonus de CA, harmonisation, et rien d’autre qui bouge', () => {
      const p = depart();
      p.etat.inventaire['anneau-de-protection'] = 1;
      const c = comparer(moteur.ctx, heros(p, 'pip'), 'anneau-de-protection')!;
      const l = lignesDe(c);
      expect(c.emplacement).toBe('anneau1');
      expect(l.bonus).toMatchObject({ avant: 'aucun', apres: 'CA +1', sens: 'mieux' });
      expect(l.ca).toMatchObject({ avant: '14', apres: '15', sens: 'mieux' });
      expect(l.harmonisation).toMatchObject({ avant: '0 / 3', apres: '1 / 3', sens: 'neutre' });
      expect(l.attaques).toBeUndefined();
    });

    it('un anneau qui remplace un autre : l’ancien est nommé, l’harmonisation ne bouge pas', () => {
      let p = depart();
      p.etat.inventaire['cry-bague-de-cendre-apaisee'] = 2;
      p = moteur.executer(p, { type: 'equiper', objet: 'cry-bague-de-cendre-apaisee', personnage: 'pip', emplacement: 'anneau1' }).partie;
      p = moteur.executer(p, { type: 'equiper', objet: 'cry-bague-de-cendre-apaisee', personnage: 'pip', emplacement: 'anneau2' }).partie;
      const c = comparer(moteur.ctx, heros(p, 'pip'), 'cry-lorgnon-de-l-archiviste', 'tete')!;
      expect(c.refus).toBeUndefined();
      expect(lignesDe(c).harmonisation).toMatchObject({ avant: '2 / 3', apres: '3 / 3' });
    });

    it('les refus des règles sont donnés avec leur motif, sans lignes', () => {
      const p = depart();
      p.etat.inventaire['epee-longue'] = 1;
      const c = comparer(moteur.ctx, heros(p, 'pip'), 'epee-longue', 'j1.gauche')!;
      expect(c.refus).toMatch(/Légère/);
      expect(c.lignes).toEqual([]);
    });

    it('un objet qui ne s’équipe pas n’a pas de comparaison', () => {
      expect(comparer(moteur.ctx, depart().groupe[0]!, 'rations')).toBeUndefined();
    });

    it('ne touche pas au héros', () => {
      const p = depart();
      p.etat.inventaire['pdf-lame-de-fer-gris'] = 1;
      const avant = JSON.stringify(p.groupe);
      comparer(moteur.ctx, heros(p, 'bran'), 'pdf-lame-de-fer-gris');
      expect(JSON.stringify(p.groupe)).toBe(avant);
    });

    it('l’« après » annoncé est exactement ce que la commande équiper donne (CA et attaques)', () => {
      const essais: [string, string, string?][] = [
        ['bran', 'pdf-lame-de-fer-gris', 'j1.droite'],
        ['hilda', 'cotte-de-mailles'],
        ['hilda', 'epee-a-deux-mains', 'j1.droite'],
        ['sylvaine', 'bouclier', 'j1.gauche'],
        ['pip', 'anneau-de-protection'],
      ];
      for (const [id, objet, s] of essais) {
        const p = depart();
        p.etat.inventaire[objet] = 1;
        const c = comparer(moteur.ctx, heros(p, id), objet, s as Emplacement | undefined)!;
        const apres = moteur.executer(p, { type: 'equiper', objet, personnage: id, ...(s ? { emplacement: s } : {}) }).partie;
        const h = heros(apres, id);
        expect(c.emplacement).toBe(s ?? c.emplacement);
        expect(h.fiche.ca).toBe(Number(lignesDe(c).ca?.apres ?? heros(p, id).fiche.ca));
        const a = attaquesEnMain(moteur.ctx, h);
        const texte = texteAttaques(a);
        if (lignesDe(c).attaques) expect(lignesDe(c).attaques!.apres).toBe(texte);
      }
    });
  });

  it('les attaques du jeu en main suivent la bascule des jeux', () => {
    let p = depart();
    const bran = () => p.groupe.find((x) => x.id === 'bran')!;
    const avant = attaquesEnMain(moteur.ctx, bran()).map((a) => a.id);
    expect(avant.length).toBeGreaterThan(0);
    p = moteur.executer(p, { type: 'changerJeuArmes', personnage: 'bran' }).partie;
    const apres = attaquesEnMain(moteur.ctx, bran()).map((a) => a.id);
    expect(apres).not.toEqual(avant);
  });
});
