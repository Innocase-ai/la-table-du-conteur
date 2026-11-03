// Les événements d'état : le noyau compare la partie avant et après une action et en tire des faits typés.
// Ainsi, tout module qui modifie l'état produit ses événements sans rien faire de plus.
import type { EvenementJeu, Partie } from './types';

const nouveaux = (avant: string[], apres: string[]) => apres.filter((x) => !avant.includes(x));

export function differences(avant: Partie, apres: Partie): EvenementJeu[] {
  const ev: EvenementJeu[] = [];
  const a = avant.etat;
  const b = apres.etat;
  if (a.lieu !== b.lieu) ev.push({ type: 'deplacement', de: a.lieu, vers: b.lieu });
  if (b.jour !== a.jour) ev.push({ type: 'jourSuivant', jour: b.jour });
  for (const f of nouveaux(a.faits, b.faits)) ev.push({ type: 'faitAppris', fait: f });
  for (const c of nouveaux(a.exploration.decouverts, b.exploration.decouverts)) ev.push({ type: 'decouverte', cle: c });
  for (const id of new Set([...Object.keys(a.inventaire), ...Object.keys(b.inventaire)])) {
    const d = (b.inventaire[id] ?? 0) - (a.inventaire[id] ?? 0);
    if (d > 0) ev.push({ type: 'objetObtenu', objet: id, quantite: d });
    if (d < 0) ev.push({ type: 'objetPerdu', objet: id, quantite: -d });
  }
  if (b.pieces !== a.pieces) ev.push({ type: 'pieces', delta: Number((b.pieces - a.pieces).toFixed(2)), total: b.pieces });
  if (b.xp !== a.xp) ev.push({ type: 'xp', delta: b.xp - a.xp, total: b.xp });
  for (const [id, v] of Object.entries(b.jauges)) if (v !== a.jauges[id]) ev.push({ type: 'jaugeChange', jauge: id, avant: a.jauges[id] ?? v, apres: v });
  for (const [id, q] of Object.entries(b.quetes)) {
    const qa = a.quetes[id];
    const accomplies = nouveaux(qa?.accomplies ?? [], q.accomplies);
    if (!qa || qa.statut !== q.statut || accomplies.length) ev.push({ type: 'queteMiseAJour', quete: id, statut: q.statut, etapesAccomplies: accomplies, nouvelle: !qa });
  }
  for (const p of apres.groupe) {
    const pa = avant.groupe.find((x) => x.id === p.id);
    if (!pa) continue;
    if (pa.pv !== p.pv) ev.push({ type: 'pvChange', personnage: p.id, avant: pa.pv, apres: p.pv });
    for (const k of new Set([...Object.keys(pa.ressources), ...Object.keys(p.ressources)])) {
      if ((pa.ressources[k] ?? 0) !== (p.ressources[k] ?? 0)) ev.push({ type: 'ressourceChange', personnage: p.id, ressource: k, avant: pa.ressources[k] ?? 0, apres: p.ressources[k] ?? 0 });
    }
    p.emplacements.forEach((v, i) => {
      if (v !== (pa.emplacements[i] ?? 0)) ev.push({ type: 'ressourceChange', personnage: p.id, ressource: `emplacement-${i + 1}`, avant: pa.emplacements[i] ?? 0, apres: v });
    });
  }
  if (JSON.stringify(a.fin) !== JSON.stringify(b.fin) && b.fin) ev.push({ type: 'fin', fin: b.fin });
  if (JSON.stringify(avant.scene) !== JSON.stringify(apres.scene)) ev.push({ type: 'sceneChange', scene: apres.scene });
  return ev;
}
