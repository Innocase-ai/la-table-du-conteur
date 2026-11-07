import { describe, expect, it } from 'vitest';
import { IA_RAPIDE, SORTS_JOUABLES_EN_COMBAT, TAILLES_GROUPE, avertissementsGroupe, bilanPersonnage, creationRapide, creerCombat, groupeConseille, groupeVide, herosRetires, redimensionner, jouerTourIA, kitDepuisFiche, lireGroupe, nouvelId, personnageComplet, preparerRencontre, RENCONTRES, serialiser, type PersonnageCree } from '../src';
import { chargerDonneesSrd } from '../src/donnees-node';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { join } from 'node:path';

const donnees = chargerDonneesSrd();

function personnage(classe: string, espece: string, niveau = 3): PersonnageCree {
  return { id: nouvelId(), sexe: 'F', alignement: 'NB', portrait: `${espece}-f-1`, choix: creationRapide({ classe, espece, niveau, nom: classe }, donnees) };
}

describe('groupe', () => {
  it('se sérialise et se relit à l’identique, et refuse un fichier invalide', () => {
    const g = groupeVide(3);
    g.emplacements[0] = personnage('guerrier', 'humain');
    g.emplacements[2] = personnage('magicien', 'gnome');
    const relu = lireGroupe(serialiser(g));
    expect(relu.ok && relu.groupe).toEqual(g);
    expect(lireGroupe('pas du json').ok).toBe(false);
    const erreur = lireGroupe(JSON.stringify({ version: 1, niveau: 9, emplacements: [] }));
    expect(!erreur.ok && erreur.erreur).toMatch(/format d'un groupe/);
    expect(lireGroupe(JSON.stringify({ version: 2 })).ok).toBe(false);
    const casse = JSON.parse(serialiser(g));
    casse.emplacements[0].choix.classe = 12;
    expect(lireGroupe(JSON.stringify(casse)).ok).toBe(false);
  });

  it('tous les choix survivent à la sauvegarde, dont la caractéristique de la Faveur épique (niveau 19)', () => {
    const g = groupeVide(19);
    g.emplacements[0] = personnage('guerrier', 'humain', 19);
    expect(g.emplacements[0]!.choix.faveurCaracteristique).toHaveLength(1);
    const relu = lireGroupe(serialiser(g));
    expect(relu.ok && relu.groupe.emplacements[0]!.choix).toEqual(g.emplacements[0]!.choix);
  });

  it('un personnage de création rapide, avec nom et portrait, est complet', () => {
    expect(personnageComplet(bilanPersonnage(personnage('clerc', 'nain'), donnees))).toBe(true);
    const sansNom = personnage('clerc', 'nain');
    sansNom.choix.nom = '';
    expect(personnageComplet(bilanPersonnage(sansNom, donnees))).toBe(false);
  });

  it('les conseils de composition signalent les manques', () => {
    const fiches = ['guerrier', 'barbare', 'moine', 'roublard'].map((c) => bilanPersonnage(personnage(c, 'humain'), donnees).fiche!);
    const avis = avertissementsGroupe(fiches, donnees).join('\n');
    expect(avis).toMatch(/Groupe de 4/);
    expect(avis).toMatch(/Aucun soigneur/);
    expect(avis).toMatch(/Aucun lanceur/);
    const bon = ['guerrier', 'clerc', 'roublard', 'magicien', 'rodeur', 'paladin'].map((c) => bilanPersonnage(personnage(c, 'humain'), donnees).fiche!);
    const avisBon = avertissementsGroupe(bon, donnees).join('\n');
    expect(avisBon).not.toMatch(/Aucun soigneur|Aucun lanceur|première ligne|incomplet/);
  });
});

describe('sorts jouables en combat', () => {
  it('existent tous dans les données', () => {
    for (const id of SORTS_JOUABLES_EN_COMBAT) expect(donnees.sorts.has(id), id).toBe(true);
  });
});

describe('un groupe créé se bat', () => {
  const classes = [...donnees.classes.keys()];
  for (const niveau of [1, 3, 5, 10, 20]) {
    for (let partie = 0; partie < 2; partie++) {
      it(`classes ${partie * 6 + 1} à ${partie * 6 + 6}, niveau ${niveau}`, () => {
        const heros = classes.slice(partie * 6, partie * 6 + 6).map((classe, i) => {
          const p = personnage(classe, [...donnees.especes.keys()][(i + partie) % 9]!, niveau);
          const b = bilanPersonnage(p, donnees);
          expect(b.fiche, b.erreurs.join(' ')).toBeDefined();
          return { fiche: b.fiche!, kit: kitDepuisFiche(b.fiche!) };
        });
        const rencontre = RENCONTRES[0]!;
        const { grille, combattants } = preparerRencontre(rencontre, donnees, heros);
        expect(combattants.filter((c) => c.camp === 'heros')).toHaveLength(6);
        for (const h of combattants.filter((c) => c.camp === 'heros')) expect(h.attaques.length, h.nom).toBeGreaterThan(0);
        const etat = creerCombat(grille, combattants, 99 + niveau);
        let tours = 0;
        while (!etat.vainqueur && tours < 500) {
          jouerTourIA(etat, { sorts: donnees.sorts }, IA_RAPIDE);
          tours++;
        }
        expect(etat.vainqueur, 'le combat doit se terminer').toBeDefined();
      });
    }
  }
});

describe('groupe conseillé', () => {
  it('est complet et sans avertissement de composition, à tous les niveaux', async () => {
    const { groupeConseille } = await import('../src');
    for (let niveau = 1; niveau <= 5; niveau++) {
      const g = groupeConseille(niveau, donnees);
      const bilans = g.emplacements.map((p) => bilanPersonnage(p!, donnees));
      for (const b of bilans) expect(personnageComplet(b), b.erreurs.concat(b.manquants.map((m) => m.message)).join(' | ')).toBe(true);
      expect(avertissementsGroupe(bilans.map((b) => b.fiche!), donnees)).toEqual([]);
    }
  });
});

describe('taille du groupe : 4 ou 6 emplacements', () => {
  it('un groupe vide a 4 ou 6 emplacements (6 par défaut) ; les tailles proposées sont 4 et 6', () => {
    expect(TAILLES_GROUPE).toEqual([4, 6]);
    expect(groupeVide(3).emplacements).toHaveLength(6);
    expect(groupeVide(3, 4).emplacements).toHaveLength(4);
  });

  it('se sérialise et se relit à 4 comme à 6 ; refuse 5 emplacements ; un ancien fichier à 6 reste lisible', () => {
    for (const taille of TAILLES_GROUPE) {
      const g = groupeVide(2, taille);
      g.emplacements[0] = personnage('guerrier', 'humain', 2);
      const relu = lireGroupe(serialiser(g));
      expect(relu.ok && relu.groupe).toEqual(g);
    }
    const cinq = lireGroupe(serialiser({ ...groupeVide(1), emplacements: groupeVide(1).emplacements.slice(0, 5) }));
    expect(cinq.ok).toBe(false);
    expect(!cinq.ok && cinq.erreur).toMatch(/format d'un groupe/);
  });

  it('redimensionner : 4 vers 6 ajoute deux emplacements vides ; 6 vers 4 retire les derniers, que herosRetires annonce', () => {
    const g = groupeVide(3);
    g.emplacements[0] = personnage('guerrier', 'humain');
    g.emplacements[4] = personnage('magicien', 'gnome');
    g.emplacements[5] = personnage('clerc', 'nain');
    expect(herosRetires(g, 4).map((p) => p.choix.classe)).toEqual(['magicien', 'clerc']);
    expect(herosRetires(g, 6)).toEqual([]);
    const petit = redimensionner(g, 4);
    expect(petit.emplacements).toHaveLength(4);
    expect(petit.emplacements[0]).toBe(g.emplacements[0]);
    const retour = redimensionner(petit, 6);
    expect(retour.emplacements).toHaveLength(6);
    expect(retour.emplacements.slice(4)).toEqual([null, null]);
  });

  it('le groupe conseillé compte 4 ou 6 héros complets, avec soigneur et lanceur de sorts à 4', () => {
    const six = groupeConseille(3, donnees);
    const quatre = groupeConseille(3, donnees, 4);
    expect(six.emplacements).toHaveLength(6);
    expect(quatre.emplacements).toHaveLength(4);
    const classes = quatre.emplacements.map((p) => p!.choix.classe);
    expect(classes).toEqual(['guerrier', 'clerc', 'roublard', 'magicien']);
    for (const p of quatre.emplacements) expect(personnageComplet(bilanPersonnage(p!, donnees))).toBe(true);
    const fiches = quatre.emplacements.map((p) => bilanPersonnage(p!, donnees).fiche!);
    expect(avertissementsGroupe(fiches, donnees, 4).join(' | ')).not.toMatch(/Aucun soigneur|Aucun lanceur|première ligne|moins de monstres/);
  });

  it('les conseils : un groupe plein de 4 est annoncé comme un peu plus léger ; 3 héros sur 4 emplacements, comme un groupe incomplet', () => {
    const quatre = groupeConseille(3, donnees, 4).emplacements.map((p) => bilanPersonnage(p!, donnees).fiche!);
    expect(avertissementsGroupe(quatre, donnees, 4).join(' | ')).toMatch(/Groupe de 4 : les combats/);
    expect(avertissementsGroupe(quatre.slice(0, 3), donnees, 4).join(' | ')).toMatch(/Groupe de 3 sur 4 emplacements/);
  });

  it('chaque histoire annonce sa taille de groupe (Port-Sillage : 4 ; les autres : 6)', () => {
    const lire = (id: string) => {
      const r = chargerMonde(join(RACINE_MONDES, id));
      if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join(' | '));
      return r.monde.monde.groupe.conseille;
    };
    expect(lire('port-sillage')).toBe(4);
    for (const id of ['val-des-cendres', 'citadelle-des-marees', 'dime-des-roseaux']) expect(lire(id), id).toBe(6);
  });
});
