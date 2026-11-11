// Les salutations communes : un PNJ secondaire n'écrit aucun texte, sa fiche nomme un registre de la bibliothèque partagée par toutes les
// histoires, et le chargement lui donne ses trois salutations, toujours les mêmes. Ces tests utilisent une bibliothèque fictive (la vraie
// est testée dans `salutations-communes-bibliotheque.test.ts`, une fois ses lignes écrites).
import { describe, expect, it } from 'vitest';
import {
  FichierSalutationsCommunes,
  ligneCommune,
  Pnj,
  REGISTRE_INCONNU,
  resoudreSalutationsCommunes,
  type FichierSalutationsCommunes as Bibliotheque,
} from '../src';

const lignes = (prefixe: string, n: number) => Array.from({ length: n }, (_, i) => `« ${prefixe} numéro ${i + 1}, dit comme il faut. »`);
const BIBLIOTHEQUE: Bibliotheque = {
  registres: [
    { id: 'garde', libelle: 'Garde', pour: 'garde, soldat', lignes: { neutre: lignes('neutre', 3), amical: lignes('amical', 3), hostile: lignes('hostile', 3) } },
    { id: 'villageois', libelle: 'Villageois', pour: 'paysan, passant', lignes: { neutre: lignes('v neutre', 3), amical: lignes('v amical', 3), hostile: lignes('v hostile', 3) } },
  ],
};

const fiche = (id: string, salutations: Record<string, unknown>) => ({ id, nom: id, salutations });

describe('les salutations communes', () => {
  it('un PNJ qui nomme un registre reçoit ses trois salutations, tirées de ce registre', () => {
    const r = resoudreSalutationsCommunes(fiche('marcus', { commune: 'garde' }), BIBLIOTHEQUE) as { salutations: Record<string, string> };
    expect(r.salutations['neutre']).toMatch(/neutre numéro/);
    expect(r.salutations['amical']).toMatch(/amical numéro/);
    expect(r.salutations['hostile']).toMatch(/hostile numéro/);
    expect(r.salutations['commune']).toBe('garde');
  });

  it('c’est stable : le même PNJ a toujours les mêmes salutations, et les PNJ d’un registre se répartissent sur ses lignes', () => {
    const a = resoudreSalutationsCommunes(fiche('marcus', { commune: 'garde' }), BIBLIOTHEQUE);
    expect(resoudreSalutationsCommunes(fiche('marcus', { commune: 'garde' }), BIBLIOTHEQUE)).toEqual(a);
    const neutres = new Set(Array.from({ length: 40 }, (_, i) => ligneCommune(BIBLIOTHEQUE.registres[0]!, 'neutre', `pnj-${i}`)));
    expect(neutres.size).toBe(3);
  });

  it('un texte que le PNJ écrit lui-même est gardé ; la bibliothèque comble le reste', () => {
    const propre = '« Chez moi, on entre en silence. »';
    const r = resoudreSalutationsCommunes(fiche('marcus', { commune: 'garde', neutre: propre }), BIBLIOTHEQUE) as { salutations: Record<string, string> };
    expect(r.salutations['neutre']).toBe(propre);
    expect(r.salutations['hostile']).toMatch(/hostile numéro/);
  });

  it('une fiche sans registre ne change pas, et l’objet reçu n’est jamais modifié', () => {
    const sans = fiche('marcus', { neutre: '« Bonjour. »' });
    expect(resoudreSalutationsCommunes(sans, BIBLIOTHEQUE)).toBe(sans);
    const avec = fiche('marcus', { commune: 'garde' });
    resoudreSalutationsCommunes(avec, BIBLIOTHEQUE);
    expect(avec.salutations).toEqual({ commune: 'garde' });
    expect(resoudreSalutationsCommunes(null, BIBLIOTHEQUE)).toBeNull();
    expect(resoudreSalutationsCommunes('texte', BIBLIOTHEQUE)).toBe('texte');
  });

  it('un registre inconnu est signalé clairement à la validation de la fiche (au lieu d’un « neutre manquant »)', () => {
    const r = resoudreSalutationsCommunes(fiche('marcus', { commune: 'sorcier' }), BIBLIOTHEQUE) as { salutations: Record<string, string> };
    expect(r.salutations['neutre']).toBe(REGISTRE_INCONNU);
    const pnj = Pnj.safeParse({
      id: 'marcus', nom: 'Marcus', espece: 'humain', sexe: 'M', role: 'garde', lieu: 'lr-place', apparence: 'un garde',
      personnalite: { traits: ['sec', 'fier'], voix: 'brève', desir: 'sa paie' },
      salutations: { commune: 'sorcier' },
    });
    expect(pnj.success).toBe(false);
    if (!pnj.success) expect(pnj.error.issues.map((i) => i.message).join(' ')).toMatch(/registre de salutations communes inconnu : « sorcier »/);
  });

  it('une fiche avec ses propres salutations passe la validation comme avant', () => {
    const pnj = Pnj.safeParse({
      id: 'marcus', nom: 'Marcus', espece: 'humain', sexe: 'M', role: 'garde', lieu: 'lr-place', apparence: 'un garde',
      personnalite: { traits: ['sec', 'fier'], voix: 'brève', desir: 'sa paie' },
      salutations: { neutre: '« Halte. »' },
    });
    expect(pnj.success).toBe(true);
    if (pnj.success) expect(pnj.data.salutations.neutre).toBe('« Halte. »');
  });

  it('le format de la bibliothèque refuse deux registres du même nom et une ligne qui n’est pas une parole', () => {
    expect(FichierSalutationsCommunes.safeParse(BIBLIOTHEQUE).success).toBe(true);
    expect(FichierSalutationsCommunes.safeParse({ registres: [BIBLIOTHEQUE.registres[0], BIBLIOTHEQUE.registres[0]] }).success).toBe(false);
    const mauvaise = { registres: [{ ...BIBLIOTHEQUE.registres[0]!, lignes: { ...BIBLIOTHEQUE.registres[0]!.lignes, neutre: ['Bonjour sans guillemets'] } }] };
    expect(FichierSalutationsCommunes.safeParse(mauvaise).success).toBe(false);
  });
});
