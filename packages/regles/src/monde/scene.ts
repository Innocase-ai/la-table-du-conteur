// Fiche de scène : ce que le moteur dit au conteur à chaque tour (et ce que l'écran d'exploration affiche).
// Elle ne contient que ce que le groupe peut voir ou sait déjà, plus la description factuelle du lieu pour le conteur ;
// les secrets restent accessibles par les outils de consultation.
import { attitude, pnjPresents, sujetsDisponibles } from './dialogue';
import { pnjDansLieu } from './presence';
import { evaluerCondition } from './etat';
import { sortiesDe, type PartieMonde } from './exploration';

export interface FicheScene {
  jour: number;
  heure: number;
  lieu: { id: string; nom: string; type: string; resume: string; description: string; ambiance?: string; services: string[]; repos: string; parent?: string };
  sorties: { vers: string; nom: string; type: string; description?: string; apercu: string; visite: boolean; heures: number; etat: 'libre' | 'verrouille' | 'bloque' | 'absent'; dd?: number; absent?: 'bientot' | 'pack' }[];
  pnj: { id: string; nom: string; role: string; attitude: number; sujets: number }[];
  tresors: { id: string; nom: string; contenant: string; description: string; etat: 'ferme' | 'ouvert' | 'garde' }[];
  pieges: { id: string; nom: string; resume: string; etat: 'repere' | 'desarme' | 'declenche' }[];
  enigmes: { id: string; nom: string; enonce: string; etat: 'a-resoudre' | 'resolue' | 'echouee' }[];
  quetes: { id: string; nom: string; etapes: string[] }[];
  /** Faits connus du groupe, propres à ce lieu ou à ses PNJ. */
  faitsIci: string[];
  jauges: { id: string; nom: string; valeur: number; max: number; palier?: string; prochain?: string }[];
  groupe: { id: string; nom: string; classe: string; pv: number; pvMax: number }[];
  pieces: number;
  inventaire: { id: string; nom: string; quantite: number }[];
  fin?: string;
}

/** Qui l'on y croisera (« On y croise : … »), pour ne pas passer devant sans savoir qu'on y parle à quelqu'un. */
function signalerPnj(p: PartieMonde, vers: string): string {
  const noms = pnjDansLieu(p, vers).map((n) => n.nom);
  return noms.length ? ` On y croise : ${noms.join(', ')}.` : '';
}

export function ficheDeScene(p: PartieMonde): FicheScene {
  const { dm, etat } = p;
  const ex = etat.exploration;
  const l = dm.lieux.get(etat.lieu)!;
  const presents = pnjPresents(p);
  const tresors = [...dm.tresors.values()].filter(
    (t) => t.lieu === l.id && !ex.tresorsPris.includes(t.id) && (!t.condition || evaluerCondition(t.condition, etat)) && (!t.acces.cache || ex.decouverts.includes(`tresor:${t.id}`)),
  );
  const faitsDuLieu = new Set([...l.faits.map((f) => f.fait), ...presents.flatMap((n) => [...n.savoir, ...n.sujets.flatMap((s) => s.revele)])]);
  return {
    jour: etat.jour,
    heure: etat.heure ?? 8,
    lieu: { id: l.id, nom: l.nom, type: l.type, resume: l.resume, description: l.description, ambiance: l.ambiance, services: l.services, repos: l.repos, parent: l.parent },
    sorties: sortiesDe(p, l.id)
      .filter((s) => !s.cache)
      .map((s) => ({
        vers: s.vers,
        nom: s.nom,
        type: s.type,
        description: s.description,
        apercu: s.apercu + signalerPnj(p, s.vers),
        visite: s.visite,
        heures: s.heures,
        etat: s.absent ? 'absent' : s.bloque ? 'bloque' : s.verrou && !s.verrou.ouvert ? 'verrouille' : 'libre',
        dd: s.verrou && !s.verrou.ouvert ? s.verrou.dd : undefined,
        absent: s.absent?.motif,
      })),
    pnj: presents.map((n) => ({ id: n.id, nom: n.nom, role: n.role, attitude: attitude(p, n), sujets: sujetsDisponibles(p, n).length })),
    tresors: tresors.map((t) => ({
      id: t.id,
      nom: t.nom,
      contenant: t.contenant,
      description: t.description,
      etat: t.gardien && !etat.rencontresFaites.includes(t.gardien) ? 'garde' : t.acces.verrou && !ex.ouverts.includes(`tresor:${t.id}`) ? 'ferme' : 'ouvert',
    })),
    pieges: [...dm.pieges.values()]
      .filter((pg) => pg.lieu === l.id && (ex.decouverts.includes(`piege:${pg.id}`) || ex.pieges[pg.id]))
      .map((pg) => ({ id: pg.id, nom: pg.nom, resume: pg.resume, etat: ex.pieges[pg.id] === 'desarme' ? 'desarme' : ex.pieges[pg.id] === 'declenche' ? 'declenche' : 'repere' })),
    enigmes: [...dm.enigmes.values()]
      .filter((e) => e.lieu === l.id)
      .map((e) => ({ id: e.id, nom: e.nom, enonce: e.enonce, etat: ex.enigmes[e.id] === 'resolue' ? 'resolue' : ex.enigmes[e.id] === 'echouee' ? 'echouee' : 'a-resoudre' })),
    quetes: Object.entries(etat.quetes)
      .filter(([, q]) => q.statut === 'active')
      .map(([id, q]) => {
        const def = dm.quetes.get(id);
        return { id, nom: def?.nom ?? id, etapes: q.actives.map((e) => def?.etapes.find((x) => x.id === e)?.texte ?? e) };
      }),
    faitsIci: etat.faits.filter((f) => faitsDuLieu.has(f)),
    jauges: [...dm.jauges.values()].map((j) => {
      const valeur = etat.jauges[j.id] ?? j.initial;
      const paliers = [...j.paliers].sort((a, b) => a.seuil - b.seuil);
      return { id: j.id, nom: j.nom, valeur, max: j.max, palier: paliers.filter((x) => x.seuil <= valeur).pop()?.nom, prochain: paliers.find((x) => x.seuil > valeur)?.nom };
    }),
    groupe: p.groupe.map((a) => ({ id: a.id, nom: a.nom, classe: a.fiche.classe, pv: a.pv, pvMax: a.fiche.pvMax })),
    pieces: etat.pieces,
    inventaire: Object.entries(etat.inventaire).map(([id, quantite]) => ({ id, nom: dm.objets.get(id)?.nom ?? id, quantite })),
    fin: etat.fin,
  };
}
