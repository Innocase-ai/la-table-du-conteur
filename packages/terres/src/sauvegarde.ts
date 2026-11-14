// Sauvegarde du voyage : du JSON versionné. On ne sauve ni la carte (elle se régénère à l'identique depuis sa définition) ni les
// cases : seulement l'état du groupe, ses cases explorées (en bits, base64) et le compteur de hasard.
import { VERSION_VOYAGE } from './voyage';
import type { CarteTerres, EtatVoyage } from './types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Une grille de 0 et de 1 en base64 (8 cases par octet). */
export function encoderBits(grille: Uint8Array): string {
  const octets = new Uint8Array(Math.ceil(grille.length / 8));
  for (let i = 0; i < grille.length; i++) if (grille[i]) octets[i >> 3]! |= 1 << (i & 7);
  let s = '';
  for (let i = 0; i < octets.length; i += 3) {
    const a = octets[i]!;
    const b = octets[i + 1] ?? 0;
    const c = octets[i + 2] ?? 0;
    const n = (a << 16) | (b << 8) | c;
    s += ALPHABET[(n >> 18) & 63]! + ALPHABET[(n >> 12) & 63]! + ALPHABET[(n >> 6) & 63]! + ALPHABET[n & 63]!;
  }
  return s;
}

export function decoderBits(texte: string, taille: number): Uint8Array {
  const octets: number[] = [];
  for (let i = 0; i < texte.length; i += 4) {
    const v = [0, 1, 2, 3].map((k) => {
      const idx = ALPHABET.indexOf(texte[i + k] ?? 'A');
      if (idx < 0) throw new Error('Sauvegarde du voyage abîmée : caractère inattendu dans les cases explorées.');
      return idx;
    });
    const n = (v[0]! << 18) | (v[1]! << 12) | (v[2]! << 6) | v[3]!;
    octets.push((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }
  const grille = new Uint8Array(taille);
  for (let i = 0; i < taille; i++) grille[i] = (octets[i >> 3]! >> (i & 7)) & 1;
  return grille;
}

export function serialiserVoyage(etat: EtatVoyage): string {
  const { explore, ...reste } = etat;
  return JSON.stringify({ ...reste, taille: explore.length, explore: encoderBits(explore) });
}

/**
 * Relit un voyage sauvegardé et le vérifie contre la carte : même carte, même graine, même version de l'algorithme. Une carte qui a
 * changé depuis (générateur modifié) est refusée clairement plutôt que de laisser le groupe dans un mur.
 */
export function chargerVoyage(json: string, carte: CarteTerres): EtatVoyage {
  let brut: Record<string, unknown>;
  try {
    brut = JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new Error('Sauvegarde du voyage abîmée : ce n’est pas du JSON.');
  }
  if (brut.version !== VERSION_VOYAGE) throw new Error(`Sauvegarde du voyage de version ${String(brut.version)} : ce jeu lit la version ${VERSION_VOYAGE}.`);
  if (brut.carte !== carte.id) throw new Error(`Sauvegarde du voyage : elle porte sur la carte « ${String(brut.carte)} », pas « ${carte.id} ».`);
  if (brut.graineCarte !== carte.graine) throw new Error('Sauvegarde du voyage : la graine de la carte a changé.');
  if (brut.versionGenerateur !== carte.versionGenerateur) throw new Error('Sauvegarde du voyage : la carte a été générée par une autre version du moteur.');
  const taille = carte.largeur * carte.hauteur;
  if (brut.taille !== taille || typeof brut.explore !== 'string' || brut.explore.length !== Math.ceil(Math.ceil(taille / 8) / 3) * 4) throw new Error('Sauvegarde du voyage abîmée : cases explorées illisibles.');
  const { taille: _t, explore, ...reste } = brut;
  const etat = { ...reste, explore: decoderBits(explore as string, taille) } as unknown as EtatVoyage;
  if (!Number.isInteger(etat.x) || !Number.isInteger(etat.y) || etat.x < 0 || etat.y < 0 || etat.x >= carte.largeur || etat.y >= carte.hauteur) throw new Error('Sauvegarde du voyage abîmée : position hors de la carte.');
  if (carte.tuiles[etat.y * carte.largeur + etat.x] === 'eau') throw new Error('Sauvegarde du voyage abîmée : le groupe est dans l’eau.');
  return etat;
}
