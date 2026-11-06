import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, ficheDeSort, groupeConseille, MODULES_STANDARD, personnageDepuisFiche } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const propriete = (id: string, libelle: string) => ficheDeSort(srd.sorts.get(id)!).proprietes.find((p) => p.libelle === libelle)?.valeur;

describe('fiche d’un sort (parchemin)', () => {
  it('un sort de zone à sauvegarde : niveau, portée, zone, sauvegarde, dégâts, description', () => {
    const f = ficheDeSort(srd.sorts.get('boule-de-feu')!);
    expect(f.titre).toBe('Boule de feu');
    expect(f.sousTitre).toMatch(/^Évocation/);
    expect(propriete('boule-de-feu', 'Niveau')).toBe('3');
    expect(propriete('boule-de-feu', 'Portée')).toBe('45 m');
    expect(propriete('boule-de-feu', "Temps d'incantation")).toBe('1 action');
    expect(propriete('boule-de-feu', "Zone d'effet")).toBe('sphère de 6 m');
    expect(propriete('boule-de-feu', 'Jet de sauvegarde')).toBe('Dextérité, moitié des dégâts si réussi');
    expect(propriete('boule-de-feu', 'Dégâts')).toBe('8d6 feu');
    expect(f.texte).toContain('sphère de 6 m de rayon');
  });

  it('un sort mineur à jet d’attaque et un sort à concentration', () => {
    expect(propriete('trait-de-feu', 'Niveau')).toBe('mineur (0)');
    expect(propriete('trait-de-feu', 'Jet de sauvegarde')).toMatch(/^jet d'attaque de sort/);
    expect(propriete('benediction', 'Durée')).toMatch(/concentration/);
    expect(propriete('benediction', 'Jet de sauvegarde')).toBe('aucun');
  });

  it('un sort de soins montre ses dés de soins, une portée de contact est dite', () => {
    expect(propriete('soins', 'Soins')).toMatch(/d8/);
    expect(propriete('soins', 'Portée')).toMatch(/^contact/);
  });

  it('chaque sort du SRD donne une fiche complète, sans valeur vide ni « undefined »', () => {
    for (const s of srd.sorts.values()) {
      const f = ficheDeSort(s);
      expect(f.proprietes.length, s.id).toBeGreaterThanOrEqual(7);
      for (const p of f.proprietes) expect(`${p.libelle} ${p.valeur}`, s.id).not.toMatch(/undefined|NaN|^\s*$/);
    }
  });
});

describe('fiches des onglets Grimoire et Journal', () => {
  const r = chargerMonde(join(RACINE_MONDES, 'citadelle-des-marees'));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  const dm = r.monde;
  const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);
  const groupe = groupeConseille(3, srd).emplacements.map((p) => {
    const f = bilanPersonnage(p!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const depart = moteur.executer(moteur.nouvellePartie(groupe, { graine: 5, niveau: 3 }), { type: 'commencer' }).partie;

  it('chaque sort du Grimoire s’ouvre en fiche', () => {
    const lignes = moteur.encarts(depart).filter((e) => e.onglet === 'Grimoire').flatMap((e) => e.lignes ?? []);
    const sorts = lignes.filter((l) => l.valeur && /niveau|mineur/.test(l.valeur));
    expect(sorts.length).toBeGreaterThan(0);
    for (const l of sorts) expect(l.fiche?.titre, l.libelle).toBe(l.libelle);
  });

  it('une quête du Journal s’ouvre en fiche, avec son état et ce qu’il reste à faire', () => {
    const p = moteur.executer(depart, { type: 'parler', pnj: 'ysmene-hautecote' }).partie;
    const enCours = { ...p, etat: { ...p.etat, quetes: { 'q-la-grande-maree': { statut: 'active' as const, actives: ['abri'], accomplies: [] } } } };
    const ligne = moteur.encarts(enCours).find((e) => e.id === 'quetes-en-cours')!.lignes![0]!;
    expect(ligne.fiche?.titre).toBe('La Grande Marée');
    expect(ligne.fiche?.proprietes.find((x) => x.libelle === 'État')?.valeur).toBe('en cours');
    expect(ligne.fiche?.texte).toMatch(/À faire/);
  });
});
