import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche } from '../src/fiche';
import { creationRapide, exigences, manquants } from '../src';

const donnees = chargerDonneesSrd();

describe('création rapide : toutes les classes × espèces × niveaux 1 à 20', () => {
  for (const classe of donnees.classes.keys()) {
    for (const espece of donnees.especes.keys()) {
      it(`${classe} / ${espece}`, () => {
        for (let niveau = 1; niveau <= 20; niveau++) {
          const choix = creationRapide({ classe, espece, niveau, nom: 'Test' }, donnees);
          const r = calculerFiche(choix, donnees);
          expect(r.ok, `niveau ${niveau} : ${r.ok ? '' : r.erreurs.join(' | ')}`).toBe(true);
          const manque = manquants(choix, donnees, { nom: 'Test', portrait: 'x', alignement: 'NB' });
          expect(manque, `niveau ${niveau} : ${manque.map((m) => m.message).join(' | ')}`).toEqual([]);
        }
      });
    }
  }
});

describe('exigences', () => {
  it('guerrier niveau 1 : style de combat, bottes, pas de sorts', () => {
    const ex = exigences({ classe: 'guerrier', espece: 'humain', historique: 'soldat', niveau: 1 }, donnees)!;
    expect(ex.donsStyle).toBe(1);
    expect(ex.donsOrigine).toBe(1);
    expect(ex.bottes?.nombre).toBe(3);
    expect(ex.sorts).toBeUndefined();
  });

  it('clerc niveau 1 : ordre divin et sorts', () => {
    const ex = exigences({ classe: 'clerc', espece: 'elfe', historique: 'acolyte', niveau: 1 }, donnees)!;
    expect(ex.choixClasse.map((c) => c.choix.id)).toEqual(['ordre-divin']);
    expect(ex.choixEspece.map((c) => c.choix.id)).toEqual(['lignage-elfique']);
    expect(ex.sorts).toMatchObject({ mineurs: 3, prepares: 4, niveauMax: 1 });
    expect(ex.initie).toMatchObject({ liste: 'clerc', mineurs: 2, niveau1: 1 });
  });

  it('un Thaumaturge gagne un sort mineur de plus', () => {
    const ex = exigences({ classe: 'clerc', espece: 'humain', historique: 'soldat', niveau: 1, choix: { 'ordre-divin': ['thaumaturge'] } }, donnees)!;
    expect(ex.sorts?.mineurs).toBe(4);
  });

  it("manquants contrôle l'espèce avant que la classe soit choisie", () => {
    const m = manquants({ espece: 'elfe', niveau: 1 }, donnees).map((x) => x.message).join(' | ');
    expect(m).toMatch(/Lignage elfique/);
    expect(manquants({ espece: 'humain', niveau: 1 }, donnees).map((x) => x.message).join(' | ')).toMatch(/Polyvalent/);
    expect(manquants({ espece: 'humain', niveau: 1, taille: 'M', dons: ['vigilant'] }, donnees).filter((x) => x.etape === 'espece')).toEqual([]);
  });

  it('manquants range les oublis par écran', () => {
    const m = manquants({ niveau: 1 }, donnees);
    expect(m.map((x) => x.etape)).toEqual(['espece', 'classe', 'historique']);
    const m2 = manquants({ classe: 'magicien', espece: 'gnome', historique: 'sage', niveau: 1 }, donnees);
    const etapes = new Set(m2.map((x) => x.etape));
    expect(etapes.has('espece')).toBe(true); // lignage gnome
    expect(etapes.has('historique')).toBe(true); // sorts d'initié
    expect(etapes.has('competences')).toBe(true); // sorts, équipement…
  });
});

describe('effets des choix', () => {
  it('le lignage drow étend la vision dans le noir, le gnome des roches accorde des sorts', () => {
    const base = creationRapide({ classe: 'roublard', espece: 'elfe', niveau: 1 }, donnees);
    const drow = calculerFiche({ ...base, choix: { ...base.choix, 'lignage-elfique': ['drow'] } }, donnees);
    expect(drow.ok && drow.fiche.visionDansLeNoir).toBe(36);
    const haut = calculerFiche({ ...base, choix: { ...base.choix, 'lignage-elfique': ['haut-elfe'] } }, donnees);
    expect(haut.ok && haut.fiche.visionDansLeNoir).toBe(18);
  });

  it('refuse un sort hors liste, un sort préparé en trop et une botte inadaptée', () => {
    const base = creationRapide({ classe: 'magicien', espece: 'humain', niveau: 1 }, donnees);
    expect(calculerFiche({ ...base, sortsPrepares: [...base.sortsPrepares!, 'soins'] }, donnees).ok).toBe(false);
    expect(calculerFiche({ ...base, sortsMineurs: ['flamme-sacree', ...base.sortsMineurs!.slice(1)] }, donnees).ok).toBe(false);
    const guerrier = creationRapide({ classe: 'roublard', espece: 'humain', niveau: 1 }, donnees);
    expect(calculerFiche({ ...guerrier, bottes: ['epee-a-deux-mains', 'pistolet'] }, donnees).ok).toBe(false);
  });

  it("l'équipement de départ fixe la CA et les armes", () => {
    const c = creationRapide({ classe: 'guerrier', espece: 'humain', niveau: 1 }, donnees);
    const r = calculerFiche(c, donnees);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fiche.equipement?.armure).toBe('cotte-de-mailles');
      expect(r.fiche.ca).toBe(17); // 16 + style Défense
      expect(r.fiche.equipement?.armes).toContain('epee-a-deux-mains');
    }
  });
});
