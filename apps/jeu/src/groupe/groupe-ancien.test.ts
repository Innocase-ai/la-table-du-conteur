// Le joueur rouvre le jeu avec le groupe de 6 enregistré avant le grimoire du Magicien : les 6 héros entrent en jeu.
import { afterEach, describe, expect, it } from 'vitest';
import { completerGrimoireGroupe, groupeConseille, serialiser } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../../packages/regles/src/donnees-node';
import { chargerGroupe, CLE_GROUPE, herosDuGroupe } from './stockage';

const srd = chargerDonneesSrd();
const stock = new Map<string, string>();
(globalThis as { window?: unknown }).window = {
  localStorage: { getItem: (k: string) => stock.get(k) ?? null, setItem: (k: string, v: string) => void stock.set(k, v), removeItem: (k: string) => void stock.delete(k) },
};
afterEach(() => stock.clear());

describe('groupe de 6 enregistré avant le grimoire', () => {
  it('sans migration, 5 héros sur 6 entrent en jeu ; avec, les 6', () => {
    const g = groupeConseille(1, srd, 6);
    for (const p of g.emplacements) delete p!.choix.sortsGrimoire;
    stock.set(CLE_GROUPE, serialiser(g));
    const lu = chargerGroupe();
    expect(lu.emplacements.filter(Boolean)).toHaveLength(6);
    expect(herosDuGroupe(lu, srd)).toHaveLength(5);
    expect(herosDuGroupe(completerGrimoireGroupe(lu, srd), srd)).toHaveLength(6);
  });
});
