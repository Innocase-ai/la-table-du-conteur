// Fiches calculées à la main d'après le SRD 5.2.1, puis comparées au moteur.
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../src/donnees-node';
import { calculerFiche, type ChoixPersonnage, type Fiche } from '../src/fiche';
import { COMPETENCES, type Competence } from '../src/schemas';

const donnees = chargerDonneesSrd();

function fiche(choix: ChoixPersonnage): Fiche {
  const r = calculerFiche(choix, donnees);
  if (!r.ok) throw new Error(r.erreurs.join('\n'));
  return r.fiche;
}

function erreurs(choix: ChoixPersonnage): string[] {
  const r = calculerFiche(choix, donnees);
  return r.ok ? [] : r.erreurs;
}

const guerrier: ChoixPersonnage = {
  nom: 'Brandon',
  classe: 'guerrier',
  niveau: 1,
  espece: 'humain',
  taille: 'M',
  historique: 'soldat',
  methode: 'standard',
  valeursBase: { for: 15, dex: 14, con: 13, int: 8, sag: 10, cha: 12 },
  bonusHistorique: { for: 2, con: 1 },
  dons: ['defense'],
  competencesClasse: ['perception', 'survie'],
  competencesSupplementaires: ['persuasion'],
  armure: 'cotte-de-mailles',
};

describe('fiche de personnage', () => {
  it('guerrier humain niveau 1 en cotte de mailles', () => {
    const f = fiche(guerrier);
    expect(f.caracteristiques.for).toEqual({ valeur: 17, modificateur: 3 });
    expect(f.caracteristiques.con).toEqual({ valeur: 14, modificateur: 2 });
    expect(f.bonusMaitrise).toBe(2);
    expect(f.pvMax).toBe(12); // 10 + Con 2
    expect(f.ca).toBe(17); // cotte de mailles 16 + Défense 1
    expect(f.initiative).toBe(2);
    expect(f.vitesse).toBe(9);
    expect(f.sauvegardes.for).toEqual({ bonus: 5, maitrise: true });
    expect(f.sauvegardes.dex).toEqual({ bonus: 2, maitrise: false });
    expect(f.competences.athletisme).toEqual({ bonus: 5, maitrise: 'maitrise' });
    expect(f.competences.persuasion).toEqual({ bonus: 3, maitrise: 'maitrise' });
    expect(f.competences.arcanes).toEqual({ bonus: -1, maitrise: 'aucune' });
    expect(f.perceptionPassive).toBe(12);
    expect(f.incantation).toBeUndefined();
    expect(f.dons).toEqual(['sauvagerie-martiale', 'defense']);
  });

  it('roublard elfe niveau 3 : expertise, Vigilant, sous-classe', () => {
    const f = fiche({
      nom: 'Ilyra',
      classe: 'roublard',
      niveau: 3,
      espece: 'elfe',
      historique: 'criminel',
      methode: 'achat',
      valeursBase: { for: 8, dex: 15, con: 14, int: 12, sag: 12, cha: 10 },
      bonusHistorique: { dex: 2, con: 1 },
      competencesClasse: ['acrobaties', 'perception', 'investigation', 'tromperie'],
      competencesSupplementaires: ['intuition'],
      expertises: ['discretion', 'perception'],
      armure: 'armure-de-cuir',
    });
    expect(f.pvMax).toBe(24); // 8 + 2, puis 2 × (5 + 2)
    expect(f.ca).toBe(14); // cuir 11 + Dex 3
    expect(f.initiative).toBe(5); // Dex 3 + maîtrise 2 (Vigilant)
    expect(f.competences.discretion).toEqual({ bonus: 7, maitrise: 'expertise' });
    expect(f.perceptionPassive).toBe(15); // 10 + Sag 1 + 2 × 2
    expect(f.visionDansLeNoir).toBe(18);
    expect(f.sousClasse).toBeDefined();
    expect(f.aptitudes.some((a) => a.source !== 'Roublard' && a.source !== 'Elfe' && a.source !== 'Don')).toBe(true);
  });

  it('moine nain niveau 5 : Défense sans armure, Ténacité naine, amélioration', () => {
    const f = fiche({
      nom: 'Durgan',
      classe: 'moine',
      niveau: 5,
      espece: 'nain',
      historique: 'soldat',
      methode: 'standard',
      valeursBase: { for: 12, dex: 15, con: 13, int: 10, sag: 14, cha: 8 },
      bonusHistorique: { dex: 2, con: 1 },
      ameliorations: [{ sag: 2 }],
      competencesClasse: ['acrobaties', 'intuition'],
    });
    expect(f.caracteristiques.sag.valeur).toBe(16);
    expect(f.bonusMaitrise).toBe(3);
    expect(f.ca).toBe(16); // 10 + Dex 3 + Sag 3
    expect(f.pvMax).toBe(43); // 8 + 2, 4 × (5 + 2), + 5 (Ténacité naine)
    expect(f.vitesse).toBe(12); // 9 + Déplacement sans armure 3
    expect(f.visionDansLeNoir).toBe(36);
    expect(f.resistances).toContain('poison');
  });

  it('magicien gnome niveau 1 : incantation', () => {
    const f = fiche({
      nom: 'Pimprenelle',
      classe: 'magicien',
      niveau: 1,
      espece: 'gnome',
      historique: 'sage',
      methode: 'standard',
      valeursBase: { for: 8, dex: 13, con: 14, int: 15, sag: 12, cha: 10 },
      bonusHistorique: { int: 2, con: 1 },
      competencesClasse: ['investigation', 'medecine'],
    });
    expect(f.pvMax).toBe(8); // 6 + Con 2
    expect(f.ca).toBe(11);
    expect(f.incantation).toMatchObject({ caracteristique: 'int', ddSauvegarde: 13, bonusAttaque: 5, emplacements: [2] });
    expect(f.taille).toBe('P');
  });

  it('barbare : Défense sans armure avec bouclier', () => {
    const f = fiche({
      ...guerrier,
      classe: 'barbare',
      dons: [],
      competencesClasse: ['perception', 'survie'],
      armure: undefined,
      bouclier: true,
    });
    expect(f.ca).toBe(16); // 10 + Dex 2 + Con 2 + bouclier 2
    expect(f.pvMax).toBe(14); // 12 + Con 2
  });

  it('refuse les choix invalides', () => {
    expect(erreurs({ ...guerrier, valeursBase: { ...guerrier.valeursBase, for: 16 } }).join()).toMatch(/Valeurs standard/);
    expect(erreurs({ ...guerrier, bonusHistorique: { for: 2, cha: 1 } }).join()).toMatch(/historique/);
    expect(erreurs({ ...guerrier, bonusHistorique: { for: 3 } }).join()).toMatch(/\+2 et \+1/);
    expect(erreurs({ ...guerrier, competencesClasse: ['perception', 'arcanes'] }).join()).toMatch(/compétence de classe/);
    expect(erreurs({ ...guerrier, competencesClasse: ['perception', 'athletisme'] }).join()).toMatch(/deux fois/);
    expect(erreurs({ ...guerrier, niveau: 4 }).join()).toMatch(/Amélioration/);
    expect(erreurs({ ...guerrier, expertises: ['arcanes'] }).join()).toMatch(/expertise/);
    expect(erreurs({ ...guerrier, classe: 'inconnue' }).join()).toMatch(/Classe inconnue/);
    expect(erreurs({ ...guerrier, taille: undefined }).join()).toMatch(/Taille/);
  });

  it('avertit pour une armure sans formation', () => {
    const f = fiche({ ...guerrier, classe: 'magicien', dons: [], competencesClasse: ['arcanes', 'histoire'] });
    expect(f.avertissements.join()).toMatch(/formation/);
  });
});

// Toutes les classes, à tous les niveaux de 1 à 5, avec des choix automatiques valides.
describe('toutes les classes, niveaux 1 à 5', () => {
  const historique = donnees.historiques.get('sage')!;
  for (const classe of donnees.classes.values()) {
    for (let niveau = 1; niveau <= 5; niveau++) {
      it(`${classe.nom} niveau ${niveau}`, () => {
        const pris = new Set<Competence>([...historique.competences, 'perception']);
        const parmi = classe.competences.parmi === 'toutes' ? (Object.keys(COMPETENCES) as Competence[]) : classe.competences.parmi;
        const competencesClasse = parmi.filter((c) => !pris.has(c)).slice(0, classe.competences.nombre);
        const effets = [...classe.aptitudes, ...(niveau >= 3 ? classe.sousClasse.aptitudes : [])]
          .filter((a) => a.niveau <= niveau)
          .flatMap((a) => a.effets);
        const nbExpertises = effets.reduce((s, e) => (e.type === 'expertise' ? s + e.nombre : s), 0);
        const nbAmeliorations = effets.filter((e) => e.type === 'amelioration_caracteristique').length;
        // Humain (Compétent) : perception ; puis les compétences en plus accordées par la classe.
        const competencesSupplementaires: Competence[] = ['perception'];
        for (const e of effets) {
          if (e.type !== 'maitrise_competences') continue;
          const choix = (e.parmi ?? (Object.keys(COMPETENCES) as Competence[])).filter(
            (c) => !pris.has(c) && !competencesClasse.includes(c) && !competencesSupplementaires.includes(c),
          );
          competencesSupplementaires.push(...choix.slice(0, e.nombre));
        }
        const f = fiche({
          nom: 'Test',
          classe: classe.id,
          niveau,
          espece: 'humain',
          taille: 'M',
          historique: 'sage',
          methode: 'standard',
          valeursBase: { for: 10, dex: 14, con: 13, int: 15, sag: 12, cha: 8 },
          bonusHistorique: { int: 1, con: 1, sag: 1 },
          ameliorations: Array.from({ length: nbAmeliorations }, () => ({ dex: 1, con: 1 })),
          competencesClasse,
          competencesSupplementaires,
          expertises: [...historique.competences, ...competencesClasse].slice(0, nbExpertises),
        });
        expect(f.pvMax).toBeGreaterThanOrEqual(classe.deVie * niveau * 0.5);
        expect(f.bonusMaitrise).toBe(niveau >= 5 ? 3 : 2);
        if (classe.incantation) expect(f.incantation!.emplacements.length).toBeGreaterThan(0);
      });
    }
  }
});
