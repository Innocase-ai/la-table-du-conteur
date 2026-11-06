// Adapter une rencontre d'histoire au nombre de héros. Les auteurs écrivent leurs combats pour un groupe de 6 (la taille
// maximale) ; un joueur qui mène 1, 2, 3, 4 ou 5 héros affronte proportionnellement moins de monstres. Le budget de PX du
// SRD est une somme par héros : réduire les monstres dans le rapport héros / 6 garde la même difficulté.
import type { Rencontre } from './prototype';

export const GROUPE_DE_REFERENCE = 6;

/**
 * La rencontre pour `heros` héros. Chaque groupe de monstres est réduit au prorata (au moins un) ; si cela dépasse encore
 * la part du groupe, les derniers groupes (les renforts) sont retirés d'abord, le premier groupe, le principal, jamais en
 * entier. À 6 héros ou plus, la rencontre est inchangée ; elle n'est jamais augmentée.
 */
export function adapterRencontre(rencontre: Rencontre, heros: number): Rencontre {
  if (heros >= GROUPE_DE_REFERENCE || heros < 1) return rencontre;
  const k = heros / GROUPE_DE_REFERENCE;
  const total = rencontre.monstres.reduce((s, m) => s + m.nombre, 0);
  const cible = Math.max(1, Math.round(total * k));
  const comptes = rencontre.monstres.map((m) => Math.max(1, Math.round(m.nombre * k)));
  let somme = comptes.reduce((s, n) => s + n, 0);
  for (let i = comptes.length - 1; i >= 0 && somme > cible; i--) {
    const plancher = i === 0 ? 1 : 0;
    const retrait = Math.min(comptes[i]! - plancher, somme - cible);
    comptes[i]! -= retrait;
    somme -= retrait;
  }
  const monstres = rencontre.monstres.flatMap((m, i) => (comptes[i]! > 0 ? [{ ...m, nombre: comptes[i]! }] : []));
  return { ...rencontre, monstres };
}
