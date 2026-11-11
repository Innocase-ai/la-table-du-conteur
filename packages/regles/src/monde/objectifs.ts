// Ce qui guide le joueur vers ses quêtes, déduit de l'état (rien n'est stocké) :
// - les lieux où se joue une étape en cours (`etape.lieu`), et leurs ancêtres (une région contient l'objectif) : la carte et
//   les sorties les signalent ;
// - le signe d'un PNJ : « ! » s'il a une quête à confier (un sujet ouvert qui propose ou lance une quête pas encore commencée),
//   « ? » s'il attend un rapport (un sujet ouvert qui clôt une quête en cours). Le « ? » l'emporte.
import { sujetsDisponibles } from './dialogue';
import type { PartieMonde } from './exploration';
import type { Pnj } from './schemas';

/** Pour chaque lieu (et chacun de ses ancêtres), les noms des quêtes en cours dont une étape active s'y joue. */
export function lieuxObjectifs(p: PartieMonde): Map<string, string[]> {
  const res = new Map<string, string[]>();
  for (const [id, q] of Object.entries(p.etat.quetes)) {
    if (q.statut !== 'active') continue;
    const def = p.dm.quetes.get(id);
    if (!def) continue;
    for (const etapeId of q.actives) {
      const lieu = def.etapes.find((x) => x.id === etapeId)?.lieu;
      for (let c: string | undefined = lieu, n = 0; c && p.dm.lieux.has(c) && n < 30; c = p.dm.lieux.get(c)!.parent, n++) {
        const noms = res.get(c) ?? [];
        if (!noms.includes(def.nom)) res.set(c, [...noms, def.nom]);
      }
    }
  }
  return res;
}

export type SigneQuete = '!' | '?';

/** Le signe à montrer au-dessus d'un PNJ présent, d'après les sujets qu'il peut aborder maintenant. */
export function signeDeQuete(p: PartieMonde, pnj: Pnj): SigneQuete | undefined {
  let signe: SigneQuete | undefined;
  for (const s of sujetsDisponibles(p, pnj)) {
    for (const effet of s.effets) {
      if (!('quete' in effet)) continue;
      const q = p.etat.quetes[effet.quete.id];
      if (effet.quete.statut === 'terminee' && q?.statut === 'active') return '?';
      if ((effet.quete.statut === 'proposee' || effet.quete.statut === 'active') && (!q || (q.statut === 'proposee' && effet.quete.statut === 'active'))) signe = '!';
    }
  }
  return signe;
}
