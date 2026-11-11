// Le brouillon du créateur (audit de la création, E4) et la sauvegarde du groupe (E1).
import { afterEach, describe, expect, it } from 'vitest';
import { bonusHistoriqueRecommande, serialiser, groupeVide, valeursRecommandees } from '@crpg/regles';
import { chargerDonneesSrd } from '../../../../packages/regles/src/donnees-node';
import { brouillonVide, changerClasse, type Brouillon } from './brouillon';
import { chargerGroupe, CLE_GROUPE, CLE_GROUPE_ILLISIBLE, groupeMisDeCote, sauverGroupe, texteGroupeMisDeCote } from '../groupe/stockage';

const srd = chargerDonneesSrd();

function guerrierConseille(): Brouillon {
  const b = brouillonVide(1);
  return {
    ...b,
    choix: { ...b.choix, espece: 'humain', classe: 'guerrier', historique: 'soldat', methode: 'standard', valeursBase: valeursRecommandees('guerrier'), bonusHistorique: bonusHistoriqueRecommande('guerrier', 'soldat', srd) },
  };
}

describe('changer de classe', () => {
  it('des caractéristiques laissées aux valeurs conseillées suivent la nouvelle classe', () => {
    const m = changerClasse(guerrierConseille(), 'magicien', srd);
    expect(m.choix.valeursBase).toEqual(valeursRecommandees('magicien'));
    expect(m.choix.bonusHistorique).toEqual(bonusHistoriqueRecommande('magicien', 'soldat', srd));
  });

  it('une répartition faite par le joueur reste telle quelle', () => {
    const b = guerrierConseille();
    const perso = { for: 8, dex: 15, con: 14, int: 13, sag: 12, cha: 10 };
    const m = changerClasse({ ...b, choix: { ...b.choix, valeursBase: perso, bonusHistorique: { dex: 2, con: 1 } } }, 'magicien', srd);
    expect(m.choix.valeursBase).toEqual(perso);
    expect(m.choix.bonusHistorique).toEqual({ dex: 2, con: 1 });
  });
});

describe('un groupe sauvegardé devenu illisible', () => {
  const stock = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: { getItem: (k: string) => stock.get(k) ?? null, setItem: (k: string, v: string) => void stock.set(k, v), removeItem: (k: string) => void stock.delete(k) },
  };
  afterEach(() => stock.clear());

  it('est mis de côté avant que la sauvegarde automatique n’écrive un groupe vide, et le motif est connu', () => {
    stock.set(CLE_GROUPE, '{"version": 999, "abime": true}');
    const g = chargerGroupe();
    expect(g.emplacements.every((x) => x === null)).toBe(true);
    expect(groupeMisDeCote()).toBeTruthy();
    sauverGroupe(g); // ce que fait l'application juste après
    expect(texteGroupeMisDeCote()).toBe('{"version": 999, "abime": true}');
    expect(JSON.parse(stock.get(CLE_GROUPE_ILLISIBLE)!).erreur).toBeTruthy();
  });

  it('un groupe lisible se recharge tel quel, sans rien mettre de côté', () => {
    stock.set(CLE_GROUPE, serialiser(groupeVide(3)));
    expect(chargerGroupe().niveau).toBe(3);
    expect(stock.has(CLE_GROUPE_ILLISIBLE)).toBe(false);
  });
});
