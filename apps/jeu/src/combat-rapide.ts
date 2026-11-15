// Le réglage « ▶▶ Rapide » du combat (animations et tours de l'IA accélérés), gardé d'un combat à l'autre dans le navigateur.
// Le stockage peut manquer ou échouer (navigation privée, quota, fenêtre sans stockage) : on retombe alors sur « normal ».

export const CLE_RAPIDE = 'crpg.combat.rapide';

/** Le minimum dont on a besoin d'un `localStorage` (permet de le remplacer dans les tests). */
export interface Stockage {
  getItem(cle: string): string | null;
  setItem(cle: string, valeur: string): void;
}

function stockageDuNavigateur(): Stockage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined; // l'accès lui-même peut lever une exception
  }
}

export function lireRapide(stockage: Stockage | undefined = stockageDuNavigateur()): boolean {
  try {
    return stockage?.getItem(CLE_RAPIDE) === 'oui';
  } catch {
    return false;
  }
}

export function ecrireRapide(rapide: boolean, stockage: Stockage | undefined = stockageDuNavigateur()): void {
  try {
    stockage?.setItem(CLE_RAPIDE, rapide ? 'oui' : 'non');
  } catch {
    // stockage plein ou indisponible : le choix vaut pour ce combat seulement
  }
}
