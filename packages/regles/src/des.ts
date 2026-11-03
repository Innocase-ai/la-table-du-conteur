// Dés et hasard. Tout tirage passe par un Generateur, pour que les parties et les tests
// soient rejouables à partir d'une graine.

export type Generateur = () => number; // nombre dans [0, 1[

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function creerGenerateur(graine: number): Generateur {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Même générateur, mais son état vit dans un objet sérialisable (`{ graine }`) : la partie sauvegardée
 * contient le hasard, et une partie rechargée tire exactement les mêmes dés.
 */
export function generateurSur(porteur: { graine: number }): Generateur {
  return () => {
    porteur.graine = (porteur.graine + 0x6d2b79f5) >>> 0;
    let t = porteur.graine;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function lancerDe(faces: number, gen: Generateur): number {
  return Math.floor(gen() * faces) + 1;
}

export interface ResultatJet {
  expression: string;
  des: number[];
  modificateur: number;
  total: number;
}

const EXPRESSION = /^(\d*)d(\d+)\s*([+-]\s*\d+)?$|^([+-]?\d+)$/;

/** Lance une expression de dés comme « 2d6+3 », « d20 », « 1d8-1 » ou « 4 ». */
export function lancer(expression: string, gen: Generateur): ResultatJet {
  const m = EXPRESSION.exec(expression.trim());
  if (!m) throw new Error(`Expression de dés invalide : « ${expression} »`);
  if (m[4] !== undefined) {
    const fixe = Number(m[4]);
    return { expression, des: [], modificateur: fixe, total: fixe };
  }
  const nombre = m[1] ? Number(m[1]) : 1;
  const faces = Number(m[2]);
  const modificateur = m[3] ? Number(m[3].replace(/\s/g, '')) : 0;
  const des = Array.from({ length: nombre }, () => lancerDe(faces, gen));
  return { expression, des, modificateur, total: des.reduce((a, b) => a + b, 0) + modificateur };
}
